#!/usr/bin/env python3
"""
Parse Kaiser Permanente CA 2026 SBC PDFs -> data/processed/sbc_sbm_CA_kaiser.json

Reads all PDFs from data/raw/sbc_pdfs/kaiser_ca/
Expected filename pattern: {PLAN_ID}-en-2026.pdf
  e.g. 40513CA0380002-00-en-2026.pdf

Output schema matches data/processed/sbc_sbm_CA.json (Ambetter) exactly.
Uses pdfplumber table extraction (not raw text regex) for clean column-separated data.

Run:
  python scripts/etl/parse_sbc_pdfs_ca_kaiser.py
"""

import json
import logging
import re
import sys
from datetime import datetime
from pathlib import Path

import pdfplumber

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger(__name__)

SBC_DIR = Path("data/raw/sbc_pdfs/kaiser_ca")
OUT_PATH = Path("data/processed/sbc_sbm_CA_kaiser.json")

ISSUER_ID = "40513"
ISSUER_NAME = "Kaiser Permanente (CA)"
DEFAULT_NETWORK = "HMO"

METAL_KEYWORDS = {
    "platinum": "Platinum",
    "gold": "Gold",
    "silver": "Silver",
    "bronze": "Bronze",
    "catastrophic": "Catastrophic",
    "minimum coverage": "Catastrophic",
}

CSR_PATTERNS = [
    (r"silver\s+73|73%\s+csr|csr\s+73", "Silver CSR 73%"),
    (r"silver\s+87|87%\s+csr|csr\s+87|enhanced silver", "Silver CSR 87%"),
    (r"silver\s+94|94%\s+csr|csr\s+94", "Silver CSR 94%"),
    (r"zero\s+cost\s+share|0\s+cost\s+share", "Zero Cost Share"),
    (r"ai/an|american\s+indian", "AI/AN Zero Cost Share"),
]


# ── Filename -> metadata ──────────────────────────────────────────────────────

def parse_filename(stem: str) -> dict:
    """Extract plan metadata from stem like '40513CA0380002-00-en-2026'."""
    m = re.match(r"^(40513CA038(\d{4})-(\d{2}))-en-(\d{4})$", stem)
    if not m:
        log.warning("Filename does not match expected pattern: %s", stem)
        return {"plan_id": stem, "sequence": None, "variant_suffix": "00", "year": 2026}
    return {
        "plan_id": m.group(1),
        "sequence": int(m.group(2)),
        "variant_suffix": m.group(3),
        "year": int(m.group(4)),
    }


# ── Text utilities ────────────────────────────────────────────────────────────

def clean(text: str) -> str:
    """Normalise whitespace."""
    if not text:
        return ""
    text = re.sub(r"[\ufffd\u2019\u2018]", "'", text)
    return re.sub(r"\s+", " ", text).strip()


def cell(row: list, col: int) -> str:
    """Safe cell access with None guard."""
    if col >= len(row):
        return ""
    v = row[col]
    return clean(v) if v else ""


# ── Table extraction ──────────────────────────────────────────────────────────

# SBC table columns (0-indexed):
#   0: Common Medical Event (merged)
#   1: Services You May Need
#   2: Plan Provider cost (in-network) ← what we want
#   3: Non-Plan Provider cost
#   4: Limitations / Notes

COL_EVENT = 0
COL_SERVICE = 1
COL_INNET = 2   # in-network cost


def extract_all_rows(pdf) -> list[dict]:
    """Extract all table rows from all pages, returning list of dicts.

    Each dict has:
      event: str  (Common Medical Event — accumulated across merged rows)
      service: str
      cost: str   (in-network cost)

    Merged event cells in the SBC table span 2-3 physical rows.  pdfplumber
    surfaces the first fragment in the 'event' cell of the first row and puts
    the tail text (e.g. 'abuse services') in subsequent rows.  To preserve the
    full context we accumulate the fragments: when a new 'If you ...' event
    starts we reset; any non-primary fragment is appended to the running event.
    """
    rows = []
    last_event = ""       # last complete primary event phrase
    accumulated = ""      # full accumulated text including continuation fragments

    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                if len(row) < 3:
                    continue
                event_val = cell(row, COL_EVENT)
                service_val = cell(row, COL_SERVICE)
                cost_val = cell(row, COL_INNET)

                # Skip header rows
                if "what you will pay" in cost_val.lower() or \
                   "plan provider" in cost_val.lower() or \
                   "services you may need" in service_val.lower():
                    continue

                # Skip non-cost rows (exclusions lists, etc.)
                if not service_val or service_val.startswith("●") or \
                   "services your plan" in service_val.lower() or \
                   "other covered services" in service_val.lower():
                    continue

                # Event cell accumulation
                if event_val:
                    ev_lower = event_val.lower()
                    if ev_lower.startswith("if you") or ev_lower.startswith("common medical"):
                        # New primary event — reset accumulator
                        last_event = event_val
                        accumulated = event_val
                    else:
                        # Continuation fragment of the previous merged cell
                        accumulated = last_event + " " + event_val

                rows.append({
                    "event": accumulated,
                    "service": service_val,
                    "cost": cost_val,
                })
    return rows


# ── Service -> cost mapping ───────────────────────────────────────────────────

# Maps (service keyword, optional event keyword) -> output key
# Checked with case-insensitive substring match. First match wins.
SERVICE_LOOKUP: list[tuple[str, str | None, str]] = [
    # (service_pattern, event_pattern_or_None, output_key)
    ("primary care visit",          None,              "primary_care"),
    ("specialist visit",            None,              "specialist"),
    ("preventive care",             None,              "preventive_care"),
    ("diagnostic test",             None,              "diagnostic_lab"),
    ("imaging",                     None,              "imaging"),
    ("generic drugs",               None,              "generic_drugs_tier1"),
    ("non-preferred brand",         None,              "nonpreferred_brand_tier3"),
    ("preferred brand",             None,              "preferred_brand_tier2"),  # after non-preferred
    ("specialty drugs",             None,              "specialty_tier4"),
    # Outpatient surgery: "Facility fee" with "ambulatory surgery" in service name
    ("ambulatory surgery",          None,              "outpatient_surgery_facility"),
    # Emergency
    ("emergency room care",         None,              "er_facility"),
    ("emergency medical transport", None,              "emergency_transport"),
    ("emergency medical",           None,              "emergency_transport"),
    ("urgent care",                 None,              "urgent_care"),
    # Inpatient hospital: "Facility fee" with "hospital room" in service name
    ("hospital room",               None,              "inpatient_hospital_facility"),
    # Mental health — disambiguate by event context
    ("outpatient services",         "mental",          "mental_health_outpatient"),
    ("inpatient services",          "mental",          "mental_health_inpatient"),
    ("outpatient services",         "behavioral",      "mental_health_outpatient"),
    ("inpatient services",          "behavioral",      "mental_health_inpatient"),
    ("outpatient services",         "substance",       "mental_health_outpatient"),
    ("inpatient services",          "substance",       "mental_health_inpatient"),
]


def rows_to_grid(rows: list[dict]) -> dict[str, str]:
    """Map extracted table rows to the cost_sharing_grid output keys."""
    grid: dict[str, str] = {
        "primary_care": "",
        "specialist": "",
        "preventive_care": "",
        "diagnostic_lab": "",
        "imaging": "",
        "generic_drugs_tier1": "",
        "preferred_brand_tier2": "",
        "nonpreferred_brand_tier3": "",
        "specialty_tier4": "",
        "er_facility": "",
        "emergency_transport": "",
        "urgent_care": "",
        "inpatient_hospital_facility": "",
        "outpatient_surgery_facility": "",
        "mental_health_outpatient": "",
        "mental_health_inpatient": "",
    }

    for row in rows:
        service_lower = row["service"].lower()
        event_lower = row["event"].lower()
        cost = row["cost"]

        for svc_pat, evt_pat, key in SERVICE_LOOKUP:
            if grid[key]:
                continue  # already filled
            if svc_pat not in service_lower:
                continue
            if evt_pat and evt_pat not in event_lower:
                continue
            grid[key] = cost
            break

    return grid


# ── Page-1 parsers ────────────────────────────────────────────────────────────

def extract_plan_name(page1_text: str) -> str:
    """Extract plan name from page 1 text.

    Kaiser SBC page 1 line 2 has the format:
      :Gold 80 HMO Coverage for: Individual/Family | Plan Type: HMO
    or
      :Minimum Coverage HMO Coverage for: Individual/Family | Plan Type: HMO

    We extract the part before 'Coverage for:'.
    """
    lines = [ln.strip() for ln in page1_text.split("\n") if ln.strip()]
    for line in lines[:5]:
        # Match ':Plan Name Coverage for:' pattern
        m = re.match(r"^:(.+?)\s+Coverage\s+for\s*:", line, re.IGNORECASE)
        if m:
            return clean(m.group(1))
    # Fallback: look for a line with metal + HMO/PPO
    for line in lines[:20]:
        if re.search(r"\b(?:HMO|PPO)\b", line) and re.search(
            r"platinum|gold|silver|bronze|minimum|catastrophic|cost\s+share",
            line, re.IGNORECASE,
        ):
            name = re.sub(r"\s*coverage\s+for\s*:.*", "", line, flags=re.IGNORECASE)
            name = re.sub(r"^[^a-zA-Z]*", "", name)  # strip leading non-alpha
            if len(name) > 5:
                return clean(name)
    return ""


def extract_metal_level(plan_name: str, page1_text: str) -> tuple[str, int | None, str]:
    """Return (metal_level, metal_pct, csr_variation)."""
    search = (plan_name + " " + page1_text[:2000]).lower()

    metal = "Unknown"
    metal_pct: int | None = None

    # Metal + pct from plan name e.g. "Gold 80 HMO"
    m = re.search(r"\b(platinum|gold|silver|bronze)\s+(\d{2})\b", plan_name, re.IGNORECASE)
    if m:
        metal = m.group(1).title()
        metal_pct = int(m.group(2))
    else:
        for kw, label in METAL_KEYWORDS.items():
            if kw in search:
                metal = label
                break

    # CSR variant
    csr_variation = "Standard"
    for pat, label in CSR_PATTERNS:
        if re.search(pat, search, re.IGNORECASE):
            csr_variation = label
            break

    return metal, metal_pct, csr_variation


def _parse_iq_answer(answer: str) -> str:
    """Clean an Important Questions table answer cell."""
    return clean(answer) if answer else ""


def _split_ind_fam(val: str) -> tuple[str, str]:
    """Split 'X Individual / Y Family' into (X, Y).

    Also handles '$0', 'Not Applicable', 'No' (no deductible).
    """
    val = val.strip()
    # $X Individual / $Y Family  (or vice versa)
    m = re.search(
        r"(\$[\d,]+)\s+(?:Individual|member)[^/]*/\s*(\$[\d,]+)\s+Family",
        val, re.IGNORECASE,
    )
    if m:
        return (m.group(1), m.group(2))
    # Plain "$0" or "Not Applicable"
    if re.search(r"Not Applicable|No\b", val, re.IGNORECASE):
        return ("$0", "$0")
    m2 = re.search(r"(\$[\d,]+)", val)
    if m2:
        return (m2.group(1), "")
    return (val, "")


def extract_page1_data(page1) -> dict:
    """Extract deductible, OOP, and drug deductible from page 1 Important Questions table.

    Uses table extraction for accuracy — the table has columns:
      0: Question
      1: Answer
      2: Why this Matters
    """
    result = {
        "deductible_individual": "",
        "deductible_family": "",
        "oop_max_individual": "",
        "oop_max_family": "",
        "drug_deductible": "",
    }

    for table in page1.extract_tables():
        for row in table:
            if len(row) < 2:
                continue
            question = clean(row[0] or "").lower()
            answer = clean(row[1] or "")

            if "overall deductible" in question:
                ind, fam = _split_ind_fam(answer)
                result["deductible_individual"] = ind
                result["deductible_family"] = fam

            elif "out-of-pocket limit" in question and "not included" not in question:
                if re.search(r"Not Applicable", answer, re.IGNORECASE):
                    result["oop_max_individual"] = "Not Applicable"
                    result["oop_max_family"] = "Not Applicable"
                else:
                    ind, fam = _split_ind_fam(answer)
                    result["oop_max_individual"] = ind
                    result["oop_max_family"] = fam

            elif "deductible for specific" in question or "pharmacy deductible" in question:
                if re.search(r"\$[\d,]+", answer):
                    result["drug_deductible"] = answer

    return result


def extract_marketplace(full_text: str, plan_name: str) -> tuple[str, str]:
    combined = (plan_name + " " + full_text[:2000]).lower()
    if "covered california" in combined or "covered ca" in combined:
        return ("iex", "Covered California")
    if "off-exchange" in combined or "off exchange" in combined:
        return ("ifp", "Off-Exchange (Direct)")
    return ("iex", "Covered California")


# ── Main parser ───────────────────────────────────────────────────────────────

def parse_sbc(pdf_path: Path) -> dict | None:
    """Parse one Kaiser CA SBC PDF and return a structured record."""
    file_meta = parse_filename(pdf_path.stem)
    plan_id_raw = file_meta["plan_id"]
    year = file_meta["year"]

    try:
        with pdfplumber.open(pdf_path) as pdf:
            page1 = pdf.pages[0]
            page1_text = page1.extract_text() or ""
            p1_data = extract_page1_data(page1)
            all_rows = extract_all_rows(pdf)
    except Exception as exc:
        log.warning("Failed to open %s: %s", pdf_path.name, exc)
        return None

    plan_name = extract_plan_name(page1_text)
    metal_level, metal_pct, csr_variation = extract_metal_level(plan_name, page1_text)
    is_hdhp = bool(re.search(r"hsa|hdhp|high.?deductible", plan_name + page1_text[:1000], re.IGNORECASE))
    is_ai_an = bool(re.search(r"ai/an|american.?indian", plan_name + page1_text[:1000], re.IGNORECASE))
    marketplace_type, marketplace_label = extract_marketplace(page1_text, plan_name)

    deductible_ind = p1_data["deductible_individual"]
    deductible_fam = p1_data["deductible_family"]
    oop_ind = p1_data["oop_max_individual"]
    oop_fam = p1_data["oop_max_family"]
    drug_deductible = p1_data["drug_deductible"]
    cost_grid = rows_to_grid(all_rows)

    # Build plan_variant_id using same convention as Ambetter parser
    parts = [ISSUER_ID, "CA", marketplace_type,
             metal_level.lower().replace(" ", ""),
             str(metal_pct or ""),
             DEFAULT_NETWORK.lower(),
             str(year)]
    if csr_variation != "Standard":
        csr_slug = re.sub(r"[^\w]", "", csr_variation).lower()
        parts.append(csr_slug)
    parts.append(file_meta["variant_suffix"])
    plan_variant_id = "-".join(p for p in parts if p)

    return {
        "plan_variant_id": plan_variant_id,
        "state_code": "CA",
        "issuer_id": ISSUER_ID,
        "issuer_name": ISSUER_NAME,
        "plan_year": year,
        "metal_level": metal_level,
        "metal_pct": metal_pct,
        "csr_variation": csr_variation,
        "network_type": DEFAULT_NETWORK,
        "marketplace_type": marketplace_type,
        "marketplace_label": marketplace_label,
        "is_hdhp": is_hdhp,
        "is_ai_an": is_ai_an,
        "plan_name_from_sbc": plan_name,
        "plan_id": plan_id_raw,
        "source": "SBC PDF",
        "source_file": pdf_path.name,
        "deductible_individual": deductible_ind,
        "deductible_family": deductible_fam,
        "drug_deductible": drug_deductible,
        "oop_max_individual": oop_ind,
        "oop_max_family": oop_fam,
        "cost_sharing_grid": cost_grid,
        "exclusions": [],
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    if not SBC_DIR.exists():
        log.error("SBC directory not found: %s", SBC_DIR)
        log.error("Run discover_kaiser_ca_sbcs.py first.")
        sys.exit(1)

    pdf_files = sorted(SBC_DIR.glob("*-en-2026.pdf"))
    if not pdf_files:
        log.error("No Kaiser CA SBC PDFs found in %s", SBC_DIR)
        sys.exit(1)

    log.info("Found %d Kaiser CA SBC PDFs to parse", len(pdf_files))

    records = []
    skipped = []
    for pdf_path in pdf_files:
        log.info("Parsing %s", pdf_path.name)
        rec = parse_sbc(pdf_path)
        if rec:
            records.append(rec)
        else:
            skipped.append(pdf_path.name)
            log.warning("Skipped %s", pdf_path.name)

    if not records:
        log.error("No records produced.")
        sys.exit(1)

    output = {
        "metadata": {
            "source": "Kaiser Permanente CA SBC PDFs (individual/family 2026)",
            "issuer_id": ISSUER_ID,
            "issuer_name": ISSUER_NAME,
            "state_code": "CA",
            "plan_years": sorted({r["plan_year"] for r in records}),
            "record_count": len(records),
            "skipped_count": len(skipped),
            "generated_at": datetime.utcnow().isoformat(),
            "schema_version": "1.0",
            "note": (
                "Parsed from Kaiser Permanente CA SBC PDFs via table extraction. "
                "plan_id contains Kaiser's plan ID from URL/filename. "
                "cost_sharing_grid contains in-network values only (HMO, OON not covered). "
                "Metal level and CSR variation inferred from PDF page-1 text."
            ),
        },
        "data": records,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
        f.write("\n")

    log.info("Wrote %d records -> %s", len(records), OUT_PATH)

    # QA report
    grid_keys = [
        "primary_care", "specialist", "preventive_care", "diagnostic_lab",
        "imaging", "generic_drugs_tier1", "preferred_brand_tier2",
        "nonpreferred_brand_tier3", "specialty_tier4", "er_facility",
        "emergency_transport", "urgent_care", "inpatient_hospital_facility",
        "outpatient_surgery_facility", "mental_health_outpatient", "mental_health_inpatient",
    ]
    missing_name = [r["source_file"] for r in records if not r["plan_name_from_sbc"]]
    missing_metal = [r["source_file"] for r in records if r["metal_level"] == "Unknown"]
    missing_deductible = [r["source_file"] for r in records if not r["deductible_individual"]]
    missing_oop = [r["source_file"] for r in records if not r["oop_max_individual"]]
    empty_grids = [r["source_file"] for r in records
                   if not any(r["cost_sharing_grid"].get(k) for k in grid_keys)]

    log.info("-" * 60)
    log.info("QA Summary:")
    log.info("  Total records:       %d", len(records))
    log.info("  Skipped PDFs:        %d", len(skipped))
    log.info("  Missing plan name:   %d", len(missing_name))
    log.info("  Unknown metal level: %d", len(missing_metal))
    log.info("  Missing deductible:  %d", len(missing_deductible))
    log.info("  Missing OOP max:     %d", len(missing_oop))
    log.info("  Empty cost grids:    %d", len(empty_grids))
    log.info("  Cost grid field coverage:")
    for key in grid_keys:
        count = sum(1 for r in records if r["cost_sharing_grid"].get(key))
        pct = count / len(records) * 100 if records else 0
        log.info("    %-35s %d / %d  (%.0f%%)", key, count, len(records), pct)

    if missing_name:
        log.warning("Missing plan name: %s", missing_name[:5])
    if missing_metal:
        log.warning("Unknown metal level: %s", missing_metal[:5])
    if empty_grids:
        log.warning("Empty cost grids: %s", empty_grids[:5])

    log.info("-" * 60)
    log.info("Output: %s", OUT_PATH)

    # Sample record for spot-check
    if records:
        sample = records[0]
        log.info("Sample record [%s]:", sample["source_file"])
        log.info("  Plan name:   %s", sample["plan_name_from_sbc"])
        log.info("  Metal:       %s %s", sample["metal_level"], sample["metal_pct"] or "")
        log.info("  CSR:         %s", sample["csr_variation"])
        log.info("  Deductible:  %s / %s", sample["deductible_individual"], sample["deductible_family"])
        log.info("  OOP max:     %s / %s", sample["oop_max_individual"], sample["oop_max_family"])
        log.info("  Primary care: %s", sample["cost_sharing_grid"]["primary_care"])
        log.info("  Generic Rx:   %s", sample["cost_sharing_grid"]["generic_drugs_tier1"])
        log.info("  ER:           %s", sample["cost_sharing_grid"]["er_facility"])


if __name__ == "__main__":
    main()
