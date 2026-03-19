#!/usr/bin/env python3
"""
Parse Ambetter CA SBC PDFs → data/processed/sbc_sbm_CA.json

Extracts per-plan:
  - Plan name / metal level / network type / marketplace type
  - Deductible (individual + family)
  - OOP maximum (individual + family)
  - Cost sharing grid: 14 service categories (in-network copay/coinsurance)

Output schema matches sbc_decoded.json (extends with SBM-specific fields).

Run: python scripts/etl/parse_sbc_pdfs_ca.py
"""

import json
import logging
import re
from datetime import datetime
from pathlib import Path

import pdfplumber

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

SBC_DIR = Path("data/raw/sbc_pdfs/ambetter_ca/sbc")
OUT_PATH = Path("data/processed/sbc_sbm_CA.json")
ISSUER_ID = "67138"
ISSUER_NAME = "Ambetter from Health Net (CA)"

# ── Filename parsing ──────────────────────────────────────────────────────────
#  Pattern: ca-{marketplace}-{metal_slug}-{network}-sbc-{year}.pdf
#  Examples: ca-iex-gold-80-ambetter-hmo-sbc-2026.pdf
#            ca-iex-silver-73-ambetter-hmo-sbc-2026.pdf   (CSR 73)
#            ca-ifp-bronze-60-ambetter-ppo-sbc-2026.pdf
#            ca-iex-0-cost-share-ambetter-hmo-ai-an-sbc-2026.pdf
#            ca-iex-bronze-60-lc-ambetter-hmo-ai-an-sbc-2026.pdf
#            ca-iex-bronze-60-0-cost-share-ambetter-hmo-sbc-2026.pdf

METAL_MAP = {
    "platinum": "Platinum", "gold": "Gold", "silver": "Silver",
    "bronze": "Bronze", "min": "Catastrophic", "minimum": "Catastrophic",
}
CSR_LEVELS = {"73": "Silver CSR 73%", "87": "Silver CSR 87%", "94": "Silver CSR 94%"}


def parse_filename(stem: str) -> dict:
    """Extract plan metadata from SBC filename stem."""
    parts = stem.split("-")
    # Remove leading 'ca' and trailing 'sbc-YEAR'
    year = int(parts[-1])
    parts = parts[1:]  # drop 'ca'
    # Remove 'sbc' and year at end
    while parts and parts[-1].isdigit():
        parts.pop()
    if parts and parts[-1] == "sbc":
        parts.pop()
    # Remove 'ambetter' token
    parts = [p for p in parts if p != "ambetter"]

    marketplace = parts[0] if parts else "unknown"  # iex / ifp
    parts = parts[1:]

    # Network type: last token
    network = parts[-1].upper() if parts else "HMO"
    parts = parts[:-1]

    # AI/AN flag
    is_ai_an = "ai" in parts and "an" in parts
    if is_ai_an:
        parts = [p for p in parts if p not in ("ai", "an")]

    # Low-cost flag (lc = limited cost share variant)
    is_lc = "lc" in parts
    if is_lc:
        parts = [p for p in parts if p != "lc"]

    # 0-cost-share flag
    is_zero = "0" in parts and "cost" in parts and "share" in parts
    if is_zero:
        parts = [p for p in parts if p not in ("0", "cost", "share")]

    # Remaining parts describe metal + level
    # e.g. ['gold', '80'] or ['silver', '73'] or ['bronze', '60', 'hdhp'] or ['min', 'cov']
    is_hdhp = "hdhp" in parts
    if is_hdhp:
        parts = [p for p in parts if p != "hdhp"]

    metal_key = parts[0] if parts else "unknown"
    metal = METAL_MAP.get(metal_key, metal_key.title())
    metal_pct_str = parts[1] if len(parts) > 1 and parts[1].isdigit() else None
    metal_pct = int(metal_pct_str) if metal_pct_str else None

    # CSR variant
    csr_variation = "Standard"
    if metal_pct_str in CSR_LEVELS:
        csr_variation = CSR_LEVELS[metal_pct_str]
    elif is_ai_an:
        csr_variation = "AI/AN Zero Cost Share"
    elif is_zero:
        csr_variation = "Zero Cost Share"
    elif is_lc:
        csr_variation = "Limited Cost Share"

    marketplace_label = "Covered California" if marketplace == "iex" else "Off-Exchange (Direct)"

    return {
        "year": year,
        "marketplace_type": marketplace,
        "marketplace_label": marketplace_label,
        "metal_level": metal,
        "metal_pct": metal_pct,
        "network_type": network,
        "csr_variation": csr_variation,
        "is_hdhp": is_hdhp,
        "is_ai_an": is_ai_an,
    }


# ── Text extraction helpers ───────────────────────────────────────────────────

def clean(text: str) -> str:
    """Normalise whitespace and common PDF encoding artefacts."""
    text = text.replace("\ufffd", "'").replace("?", "'")
    return re.sub(r"\s+", " ", text).strip()


def extract_full_text(pdf) -> str:
    """Concatenate text from all pages."""
    parts = []
    for page in pdf.pages:
        t = page.extract_text()
        if t:
            parts.append(t)
    return "\n".join(parts)


# ── Page-1 field parsers ──────────────────────────────────────────────────────

def extract_plan_name(page1_text: str) -> str:
    """Line 2: 'Health Net of CA: Gold 80 Ambetter HMO Coverage for: …'"""
    lines = page1_text.strip().split("\n")
    for line in lines[1:5]:
        if "Ambetter" in line or "Health Net" in line:
            # Strip trailing 'Coverage for: …'
            name = re.sub(r"\s*Coverage for:.*", "", line).strip()
            return clean(name)
    return ""


_DOLLAR_PATTERN = re.compile(
    r"\$[\d,]+(?:\s+(?:member|individual|per\s+member))?"
    r"(?:/\$[\d,]+(?:\s+(?:family|per\s+family))?)?",
    re.IGNORECASE,
)


def _first_dollar(text: str) -> str:
    m = _DOLLAR_PATTERN.search(text)
    return m.group(0).strip() if m else ""


def _search_window(text: str, anchor: str, window: int = 700) -> str:
    """Return a text window around the first occurrence of anchor."""
    m = re.search(anchor, text, re.IGNORECASE)
    if not m:
        return ""
    start = max(0, m.start() - 100)
    return text[start: min(len(text), m.end() + window)]


def _parse_dollar_pair(window: str) -> tuple[str, str]:
    """Parse (individual, family) dollar pair from a text window."""
    w = clean(window)
    # "$0" / no deductible
    if re.search(r"\$0\b|no deductible|there is no deductible", w, re.IGNORECASE):
        return ("$0", "$0")
    # "$5,800 member/$11,600 family"
    m = re.search(
        r"(\$[\d,]+)\s+(?:member|individual)[/\\](\$[\d,]+)\s+(?:family)",
        w, re.IGNORECASE
    )
    if m:
        return (m.group(1), m.group(2))
    # "$X per calendar year"
    m2 = re.search(r"(\$[\d,]+)\s+per\s+(?:calendar\s+)?year", w, re.IGNORECASE)
    if m2:
        return (m2.group(1), "")
    # first dollar amount
    first = _first_dollar(w)
    return (first, "")


def extract_deductible(page1_text: str) -> tuple[str, str]:
    """Return (individual, family) deductible strings.

    The PDF layout interleaves question text with answer text across columns,
    so we search a wide window anchored at 'What is the overall'.
    """
    window = _search_window(page1_text, r"What is the overall", window=700)
    if not window:
        return ("", "")
    # Clip at next question to avoid pulling in the OOP amount
    clip = re.search(r"Are there services|Are there other deductibles", window, re.IGNORECASE)
    if clip:
        window = window[: clip.start()]
    return _parse_dollar_pair(window)


def extract_oop(page1_text: str) -> tuple[str, str]:
    """Return (individual, family) OOP maximum strings.

    Anchored at 'What is the out-of-' with a wide window.
    """
    window = _search_window(page1_text, r"What is the out-of-", window=600)
    if not window:
        return ("", "")
    clip = re.search(r"What is not included|Will you pay less", window, re.IGNORECASE)
    if clip:
        window = window[: clip.start()]
    return _parse_dollar_pair(window)


# ── Cost-sharing table parser ─────────────────────────────────────────────────

# Each entry: (output_key, list of search patterns in the table text)
SERVICE_PATTERNS = [
    ("primary_care", [
        r"Primary care visit.*?(\$[\d,]+\s+copay/visit|No charge|[\d]+%\s+coinsurance)",
    ]),
    ("specialist", [
        r"Specialist visit.*?(\$[\d,]+\s+copay/visit|No charge|[\d]+%\s+coinsurance)",
    ]),
    ("preventive_care", [
        r"Preventive\s+care.*?(\$[\d,]+\s+copay|No charge|[\d]+%\s+coinsurance)",
    ]),
    ("diagnostic_lab", [
        r"Diagnostic test.*?Lab[- ](\$[\d,]+\s+copay/visit|No charge|[\d]+%\s+coinsurance)",
        r"Diagnostic test.*?(\$[\d,]+\s+copay/visit|No charge|[\d]+%\s+coinsurance)",
    ]),
    ("imaging", [
        r"Imaging \(CT.*?(\$[\d,]+\s+copay/procedure|No charge|[\d]+%\s+coinsurance)",
    ]),
    ("generic_drugs_tier1", [
        r"Generic drugs.*?(\$[\d,]+\s+copay/retail[^N]*?)(?:Not covered|$)",
        r"Generic drugs.*?(\$[\d,]+\s+copay/visit)",
    ]),
    ("preferred_brand_tier2", [
        r"Preferred brand drugs.*?(\$[\d,]+\s+copay/retail[^N]*?)(?:Not covered|$)",
        r"Preferred brand drugs.*?(\$[\d,]+\s+copay/visit)",
    ]),
    ("nonpreferred_brand_tier3", [
        r"Non-preferred brand\s+drugs.*?(\$[\d,]+\s+copay/retail[^N]*?)(?:Not covered|$)",
        r"Non-preferred brand\s+drugs.*?(\$[\d,]+\s+copay/visit)",
    ]),
    ("specialty_tier4", [
        r"Specialty drugs.*?([\d]+%\s+coinsurance[^N]*?)(?:Not covered|$)",
        r"Specialty drugs.*?(\$[\d,]+\s+copay[^N]*?)(?:Not covered|$)",
    ]),
    ("er_facility", [
        r"Emergency room care.*?Facility[- ](\$[\d,]+\s+copay/visit|No charge|[\d]+%\s+coinsurance)",
        r"Emergency room care.*?(\$[\d,]+\s+copay/visit|No charge|[\d]+%\s+coinsurance)",
    ]),
    ("emergency_transport", [
        r"Emergency medical\s+transportation.*?(\$[\d,]+\s+copay/transport|No charge|[\d]+%\s+coinsurance)",
    ]),
    ("urgent_care", [
        r"Urgent care.*?(\$[\d,]+\s+copay/visit|No charge|[\d]+%\s+coinsurance)",
    ]),
    ("inpatient_hospital_facility", [
        r"hospital\s+(?:room\)?|stay).*?Facility[^$]*(\$[\d,]+\s+copay/(?:day|admission)[^N]*?)(?:Not covered|$)",
        r"hospital\s+room\)?\s+.*?(\$[\d,]+\s+copay/day[^N]*?)(?:Not covered|$)",
        r"Facility fee.*?hospital.*?(\$[\d,]+\s+copay/(?:day|admission)[^N]*?)(?:Not covered|$)",
    ]),
    ("outpatient_surgery_facility", [
        r"outpatient\s+surgery.*?Facility.*?(\$[\d,]+\s+copay/admission|No charge|[\d]+%\s+coinsurance)",
        r"ambulatory surgery.*?(\$[\d,]+\s+copay/admission|No charge|[\d]+%\s+coinsurance)",
    ]),
    ("mental_health_outpatient", [
        r"Outpatient services.*?(?:mental|behavioral).*?(\$[\d,]+\s+copay/visit|No charge|[\d]+%\s+coinsurance)",
        r"Office visit.*?individual therapy.*?(\$[\d,]+\s+copay/visit|No charge)",
    ]),
    ("mental_health_inpatient", [
        r"Inpatient services.*?(?:mental|behavioral).*?(\$[\d,]+\s+copay/(?:day|admission)[^N]*?)(?:Not covered|$)",
    ]),
]


def _extract_cost(full_text: str, patterns: list) -> str:
    for pat in patterns:
        m = re.search(pat, full_text, re.DOTALL | re.IGNORECASE)
        if m:
            return clean(m.group(1))
    return ""


def extract_cost_sharing(full_text: str) -> dict:
    """Extract all cost-sharing values from combined page text."""
    grid = {}
    for key, patterns in SERVICE_PATTERNS:
        val = _extract_cost(full_text, patterns)
        grid[key] = val
    return grid


# ── Per-plan drug deductible ──────────────────────────────────────────────────

def extract_drug_deductible(full_text: str) -> str:
    """Pharmacy deductible if present (e.g. '$450 member/$900 family')."""
    m = re.search(
        r"Pharmacy deductible[:\s]+(\$[\d,]+[^.]*?)(?:\.|There are|You must)",
        full_text, re.IGNORECASE
    )
    return clean(m.group(1)) if m else ""


# ── Main ──────────────────────────────────────────────────────────────────────

def parse_sbc(pdf_path: Path) -> dict | None:
    meta = parse_filename(pdf_path.stem)
    year = meta["year"]

    try:
        with pdfplumber.open(pdf_path) as pdf:
            page1_text = pdf.pages[0].extract_text() or ""
            full_text = extract_full_text(pdf)
    except Exception as e:
        log.warning("Failed to open %s: %s", pdf_path.name, e)
        return None

    plan_name = extract_plan_name(page1_text)
    deductible_ind, deductible_fam = extract_deductible(full_text)
    oop_ind, oop_fam = extract_oop(full_text)
    drug_deductible = extract_drug_deductible(full_text)
    cost_grid = extract_cost_sharing(full_text)

    # Construct a synthetic plan_variant_id from file metadata
    parts = [ISSUER_ID, "CA", meta["marketplace_type"],
             meta["metal_level"].lower(),
             str(meta["metal_pct"] or ""),
             meta["network_type"].lower(),
             str(year)]
    if meta["csr_variation"] != "Standard":
        csr_slug = re.sub(r"[^\w]", "", meta["csr_variation"]).lower()
        parts.append(csr_slug)
    plan_variant_id = "-".join(p for p in parts if p)

    return {
        "plan_variant_id": plan_variant_id,
        "state_code": "CA",
        "issuer_id": ISSUER_ID,
        "issuer_name": ISSUER_NAME,
        "plan_year": year,
        "metal_level": meta["metal_level"],
        "metal_pct": meta["metal_pct"],
        "csr_variation": meta["csr_variation"],
        "network_type": meta["network_type"],
        "marketplace_type": meta["marketplace_type"],
        "marketplace_label": meta["marketplace_label"],
        "is_hdhp": meta["is_hdhp"],
        "is_ai_an": meta["is_ai_an"],
        "plan_name_from_sbc": plan_name,
        "plan_id": None,  # CMS plan ID not in SBC PDF
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


def main() -> None:
    pdf_files = sorted(SBC_DIR.glob("**/*-sbc-*.pdf"))
    log.info("Found %d SBC PDFs", len(pdf_files))

    records = []
    for pdf_path in pdf_files:
        log.info("Parsing %s", pdf_path.name)
        rec = parse_sbc(pdf_path)
        if rec:
            records.append(rec)
        else:
            log.warning("Skipped %s", pdf_path.name)

    output = {
        "metadata": {
            "source": "Ambetter CA (Health Net) SBC PDFs",
            "issuer_id": ISSUER_ID,
            "issuer_name": ISSUER_NAME,
            "state_code": "CA",
            "plan_years": sorted({r["plan_year"] for r in records}),
            "record_count": len(records),
            "generated_at": datetime.utcnow().isoformat(),
            "schema_version": "1.0",
            "note": (
                "Parsed from SBC PDFs. plan_id=null until matched to CMS plan IDs. "
                "cost_sharing_grid contains in-network values only (HMO/PPO HMO = OON not covered)."
            ),
        },
        "data": records,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
        f.write("\n")

    log.info("Wrote %d records → %s", len(records), OUT_PATH)

    # Quick QA report
    missing_deductible = [r["source_file"] for r in records if not r["deductible_individual"]]
    missing_oop = [r["source_file"] for r in records if not r["oop_max_individual"]]
    empty_grids = [r["source_file"] for r in records
                   if not any(v for v in r["cost_sharing_grid"].values())]
    log.info("QA: %d missing deductible, %d missing OOP, %d empty grids",
             len(missing_deductible), len(missing_oop), len(empty_grids))
    if missing_deductible:
        log.warning("Missing deductible: %s", missing_deductible[:5])
    if empty_grids:
        log.warning("Empty grids: %s", empty_grids[:5])


if __name__ == "__main__":
    main()
