#!/usr/bin/env python3
"""
Parse Blue Shield of California 2026 IFP medical SBC PDFs.

Reads every PDF from data/raw/sbc_pdfs/blueshield_ca/
Produces data/processed/sbc_sbm_CA_blueshield.json
Schema matches sbc_sbm_CA_kaiser.json (v1.0).

Note: Blue Shield uses a proprietary 2-column SBC format (not the federal ACA
SBC table format). All cost data is extracted via regex on raw text.

Run:
  python scripts/etl/parse_sbc_pdfs_ca_blueshield.py
"""

import json
import logging
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pdfplumber

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
CARRIER = "Blue Shield of California"
ISSUER_ID = "90637"  # CMS HIOS Issuer ID for Blue Shield of California (CA)
STATE = "CA"
YEAR = 2026

PDF_DIR = Path("data/raw/sbc_pdfs/blueshield_ca")
OUT_PATH = Path("data/processed/sbc_sbm_CA_blueshield.json")

# Cost value capture pattern (in-network copay, coinsurance, or "Not covered")
COST_RE = (
    r"(?:"
    r"\$[\d,]+(?:/(?:visit|surgery|transport|day|prescription|trip|encounter|procedure))?"
    r"|\d+%(?:\s+up\s+to\s+\$[\d,]+/prescription)?"
    r"|Not\s+covered"
    r"|\$0"
    r")"
)


# ── Filename parsing ──────────────────────────────────────────────────────────

def _parse_filename(stem: str) -> dict[str, Any]:
    """
    Decode plan metadata from filename stem.

    Examples:
      2026-Gold-HMO-A49339-EN
      2026-Silver-70-PPO-Covered-CA-A46206-CC-EN
      2026-Bronze-60-HDHP-A46210-HSA-EN
      2026-Silver-73-PPO-A46207-EN
      2026-0-Cost-Share-HMO-AI-AN-A49353-EN
      2026-Platinum-HMO-AI-AN-A49340-NA-EN
    """
    parts = stem.upper().split("-")

    # Form ID: starts with A and followed by 5+ digits
    form_id = ""
    for p in parts:
        if re.match(r"^A\d{5}$", p):
            form_id = p
            break

    # Flags
    is_hdhp = "HDHP" in parts
    is_ai_an = ("AI" in parts and "AN" in parts) or "NA" in parts
    is_hsa = "HSA" in parts
    is_off_exchange = "OFF" in parts and "EXCHANGE" in parts
    is_cc = "CC" in parts or "COVERED" in parts

    # Network type (may not be in filename for some PPO plans)
    if "HMO" in parts:
        network_type = "HMO"
    elif "PPO" in parts:
        network_type = "PPO"
    else:
        network_type = ""  # resolve from PDF text

    # Metal level and CSR
    if "PLATINUM" in parts:
        metal_level, metal_pct, csr_variation = "Platinum", 90, "Standard"
    elif "GOLD" in parts:
        metal_level, metal_pct, csr_variation = "Gold", 80, "Standard"
    elif "0" in parts and "COST" in parts and "SHARE" in parts:
        metal_level, metal_pct, csr_variation = "Silver", None, "Zero Cost Share"
    elif "SILVER" in parts:
        metal_level = "Silver"
        metal_pct = 70  # default
        csr_variation = "Standard"
        if "73" in parts:
            metal_pct, csr_variation = 73, "73"
        elif "87" in parts:
            metal_pct, csr_variation = 87, "87"
        elif "94" in parts:
            metal_pct, csr_variation = 94, "94"
    elif "BRONZE" in parts:
        metal_level, metal_pct, csr_variation = "Bronze", 60, "Standard"
    elif "MINIMUM" in parts and "COVERAGE" in parts:
        metal_level, metal_pct, csr_variation = "Catastrophic", None, "Standard"
    else:
        metal_level, metal_pct, csr_variation = "Unknown", None, "Standard"

    # Marketplace type
    if is_off_exchange:
        marketplace_type = "ifp"
        marketplace_label = "Off-Exchange"
    elif is_ai_an or is_cc or csr_variation not in ("Standard",) or metal_level == "Catastrophic":
        marketplace_type = "iex"
        marketplace_label = "Covered California"
    else:
        # Unlabeled plans default to iex (all are on broker IFP/CC page)
        marketplace_type = "iex"
        marketplace_label = "Covered California"

    # Build variant suffix for plan_variant_id
    variant_parts = []
    if csr_variation not in ("Standard",):
        if csr_variation == "Zero Cost Share":
            variant_parts.append("zcs")
        else:
            variant_parts.append(csr_variation)
    if is_hdhp:
        variant_parts.append("hdhp")
    if is_ai_an:
        variant_parts.append("aian")
    variant_suffix = "-".join(variant_parts) if variant_parts else "00"

    return {
        "form_id": form_id,
        "network_type": network_type,
        "metal_level": metal_level,
        "metal_pct": metal_pct,
        "csr_variation": csr_variation,
        "marketplace_type": marketplace_type,
        "marketplace_label": marketplace_label,
        "is_hdhp": is_hdhp or is_hsa,
        "is_ai_an": is_ai_an,
        "variant_suffix": variant_suffix,
    }


# ── Text extraction ───────────────────────────────────────────────────────────

def _extract_text(pdf_path: Path) -> tuple[str, str]:
    """Return (page1_text, full_text)."""
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or "")
    return pages[0] if pages else "", "\n".join(pages)


# ── Plan name / network type from PDF text ────────────────────────────────────

def _parse_page1(page1: str, network_type_hint: str) -> tuple[str, str]:
    """
    Return (plan_name, network_type) from page 1 text.

    Page 1 structure (Blue Shield CA format):
      Line 1: "Summary of Benefits Individual and Family Plan"
      Line 2: "HMO Plan" or "PPO Plan"
      Line 3: "<Plan Name>"  e.g. "Blue Shield Gold 80 Trio HMO"
    """
    lines = [ln.strip() for ln in page1.split("\n") if ln.strip()]
    # Detect network type from page 1
    # "PPO Savings Plan" is used for HDHP/HSA PPO plans
    network_type = network_type_hint
    for ln in lines[:5]:
        if re.search(r"\bHMO Plan\b", ln, re.I):
            network_type = "HMO"
            break
        if re.search(r"\bPPO (?:Plan|Savings Plan)\b", ln, re.I):
            network_type = "PPO"
            break

    # Plan name is the line that follows "HMO Plan" / "PPO Plan" / "PPO Savings Plan"
    plan_name = ""
    for i, ln in enumerate(lines[:6]):
        if re.search(r"(HMO Plan|PPO Plan|PPO Savings Plan)", ln, re.I):
            if i + 1 < len(lines):
                plan_name = lines[i + 1]
            break
    if not plan_name:
        # Fallback: third non-header line
        for ln in lines:
            if re.search(r"Blue Shield|Trio|HMO|PPO|Bronze|Silver|Gold|Platinum|Minimum|Coverage", ln, re.I):
                if "Summary of Benefits" not in ln:
                    plan_name = ln
                    break

    # Strip rotated watermark artifacts (short non-word tokens)
    plan_name = re.sub(r"\b[a-zA-Z]{1,2}\b", "", plan_name).strip()
    plan_name = re.sub(r"\s{2,}", " ", plan_name).strip()
    return plan_name, network_type


# ── Deductible & OOP parsing ──────────────────────────────────────────────────

def _first_dollar(text: str) -> str:
    """Find the first $X or $X,XXX dollar amount in text."""
    m = re.search(r"\$[\d,]+", text)
    return m.group(0) if m else ""


def _labeled_dollar(text: str, label: str) -> str:
    """Find '$X: <label>' pattern (e.g. '$18,400: Family')."""
    m = re.search(rf"(\$[\d,]+):\s*{re.escape(label)}", text, re.I)
    return m.group(1) if m else ""


def _parse_deductible_oop(full: str) -> dict[str, str]:
    """
    Extract medical deductible (individual, family aggregate),
    pharmacy deductible (individual), and OOP max (individual, family aggregate).

    Handles both HMO (single column) and PPO (dual column in/OON) layouts.
    Watermark text appears between values but contains no dollar amounts.
    """
    result: dict[str, str] = {
        "deductible_individual": "",
        "deductible_family": "",
        "drug_deductible": "",
        "oop_max_individual": "",
        "oop_max_family": "",
    }

    # ── Medical deductible ────────────────────────────────────────────────────
    med_ded_m = re.search(
        r"Calendar Year medical Deductible(.*?)(?:Calendar Year pharmacy|Calendar Year Out-of-Pocket)",
        full, re.DOTALL,
    )
    if med_ded_m:
        ded_text = med_ded_m.group(1)
        # Individual (in-network: first dollar amount after "Individual coverage")
        ind_m = re.search(r"Individual coverage\s+(\$[\d,]+)", ded_text)
        if ind_m:
            result["deductible_individual"] = ind_m.group(1)
        # Family aggregate: "$X: Family" label (in-network is the first occurrence)
        fam = _labeled_dollar(ded_text, "Family")
        if fam:
            result["deductible_family"] = fam
    else:
        # Minimum Coverage / catastrophic: look for deductible embedded in benefits table
        # These plans say "First dollar coverage is provided..." — deductible = OOP max
        pass

    # ── Pharmacy deductible ───────────────────────────────────────────────────
    pharm_m = re.search(
        r"Calendar Year pharmacy Deductible\s*Individual coverage\s+(\$[\d,]+|Not covered)",
        full, re.DOTALL,
    )
    if pharm_m:
        result["drug_deductible"] = pharm_m.group(1).strip()

    # ── OOP max ───────────────────────────────────────────────────────────────
    oop_m = re.search(
        r"Calendar Year Out-of-Pocket Maximum.*?Individual coverage\s+(\$[\d,]+)",
        full, re.DOTALL,
    )
    if oop_m:
        result["oop_max_individual"] = oop_m.group(1)

    # Family aggregate OOP: "$X: Family" — find the one inside the OOP section
    oop_section_m = re.search(
        r"Calendar Year Out-of-Pocket Maximum(.*?)(?:Benefits|Preventive Health Services)",
        full, re.DOTALL,
    )
    if oop_section_m:
        oop_text = oop_section_m.group(1)
        fam_oop = _labeled_dollar(oop_text, "Family")
        if fam_oop:
            result["oop_max_family"] = fam_oop

    # Catastrophic plan fallback: deductible_individual = oop_max_individual
    if not result["deductible_individual"] and result["oop_max_individual"]:
        result["deductible_individual"] = result["oop_max_individual"]
        result["deductible_family"] = result["oop_max_family"]

    return result


# ── Cost-value helpers ────────────────────────────────────────────────────────

def _capture_cost(full: str, anchor: str, window: int = 120, flags: int = re.DOTALL) -> str:
    """
    Find <anchor> in text and return the first cost value within <window> chars.

    Picks the first match of: $X/unit, $X, X%, or "Not covered".
    For PPO plans with dual columns, this naturally returns the in-network
    (Participating Provider) value since it always appears first.
    """
    m = re.search(anchor, full, flags)
    if not m:
        return ""
    segment = full[m.end(): m.end() + window]
    cv = re.search(COST_RE, segment, re.I)
    return cv.group(0).strip() if cv else ""


def _capture_cost_first_valid(full: str, anchor: str, window: int = 120) -> str:
    """
    Try all occurrences of <anchor> and return the first that has a cost value
    within <window> chars.  Used when a service description appears in the
    document before the benefits table (e.g. FDC descriptions, headings).
    """
    for m in re.finditer(anchor, full, re.DOTALL):
        segment = full[m.end(): m.end() + window]
        cv = re.search(COST_RE, segment, re.I)
        if cv:
            return cv.group(0).strip()
    return ""


def _capture_day_rate(full: str, anchor: str) -> str:
    """
    Capture per-day cost like '$375/day up to 5 days/admission'.

    Blue Shield CA PDFs sometimes interleave the service name inside the
    multi-line cost string due to visual table layout.  We handle both
    orderings:
      Normal:  "Hospital services and stay\n$375/day up to\n5 days/admission"
      Reversed: "$375/day up to\nHospital services\n5 days/admission"
    """
    # Normal: anchor comes before cost
    m = re.search(anchor, full, re.DOTALL)
    if m:
        after = full[m.end(): m.end() + 200]
        day_m = re.search(r"(\$[\d,]+/day\s+up\s+to\s+[\d]+\s+days/\w+)", after.replace("\n", " "))
        if day_m:
            return day_m.group(1).strip()
        # Percentage coinsurance
        pct_m = re.search(r"(\d+%)", after)
        if pct_m:
            return pct_m.group(1)
        # Flat dollar (no day-rate qualifier)
        dol_m = re.search(r"(\$[\d,]+)", after)
        if dol_m:
            return dol_m.group(1)

    # Reversed: cost appears before service name (PDF column interleave)
    rev_m = re.search(
        r"(\$[\d,]+/day\s+up\s+to)\s+" + anchor.replace("\\s+", r"\s*") + r"\s+(\d+\s+days/\w+)",
        full.replace("\n", " "), re.DOTALL,
    )
    if rev_m:
        return f"{rev_m.group(1)} {rev_m.group(2)}".strip()

    return ""


# ── Cost grid ─────────────────────────────────────────────────────────────────

def _parse_cost_grid(full: str, network_type: str) -> dict[str, str]:
    """
    Extract in-network cost values for the 16 standard SBC cost grid fields.

    Blue Shield CA PDFs have two layout quirks:
    1. Description text (e.g. FDC disclosures, footnote headers) appears before
       the benefits table, so the first regex match may land on description text.
       We use _capture_cost_first_valid() for services that have this issue.
    2. PPO drug tier tables interleave column data: "N% up to" from Tier X row
       bleeds into the Tier X+1 label row because the multi-line cost cell in
       column 2 overlaps with the next service label in column 1 during extraction.
    """
    grid: dict[str, str] = {}

    # ── Medical services ──────────────────────────────────────────────────────

    # Preventive: skip description text ("...for covered Preventive Health Services office visits")
    # The table entry is: "Preventive Health Services $0 [Not covered]"
    grid["preventive_care"] = _capture_cost_first_valid(
        full, r"Preventive Health Services\s+", 60
    )

    # Primary care: first-valid needed for catastrophic plans where the FDC
    # description lists "Primary care office visit (by a Primary Care Physician)"
    # before the actual table entry with the cost value
    grid["primary_care"] = _capture_cost_first_valid(
        full, r"Primary care office visit\s+", 60
    )

    # Specialist — HMO (Trio+) vs PPO labels; also use first-valid for Bronze
    # FDC description plans where specialist appears in FDC list first
    spec = (
        _capture_cost(full, r"Trio\+\s+specialist care office visit\s*\([^)]+\)\s+", 60)
        or _capture_cost(full, r"Other specialist care office visit\s*\([^)]+\)\s+", 60)
        or _capture_cost_first_valid(full, r"Specialist care office visit\s+", 80)
    )
    grid["specialist"] = spec

    grid["diagnostic_lab"] = _capture_cost(full, r"Laboratory center\s+", 60)

    # Imaging: find the "Advanced imaging services" block and extract
    # "Outpatient radiology center" cost within it.
    adv_m = re.search(
        r"Advanced imaging services(.*?)(?:Rehabilitative|Durable|Mental|Home health)",
        full, re.DOTALL,
    )
    if adv_m:
        adv_text = adv_m.group(1)
        grid["imaging"] = _capture_cost(adv_text, r"Outpatient radiology center\s+", 80)
    if not grid.get("imaging"):
        # Fallback: find the outpatient radiology center after the CT/MRI description
        grid["imaging"] = _capture_cost(
            full, r"CT scans.*?Outpatient radiology center\s+", 80
        )
    if not grid.get("imaging"):
        # Final fallback for AI/AN PDFs where "center" is split after cost values:
        #   "Outpatient radiology 40%  50%  $0 center" — cost before "center"
        grid["imaging"] = _capture_cost(full, r"Outpatient radiology\s+", 80)

    grid["er_facility"] = _capture_cost(full, r"Emergency room services\s+", 80)
    grid["emergency_transport"] = _capture_cost(full, r"Ambulance services\s+", 60)
    grid["urgent_care"] = _capture_cost(full, r"Urgent care center services\s+", 60)
    # ASC: in some AI/AN PDFs "Center" is split after cost values:
    #   "Ambulatory Surgery 40%  Benefit  $0 Center ..." — cost before "Center"
    # Try the clean pattern first, fall back to "Ambulatory Surgery\s+"
    asc = _capture_cost_first_valid(full, r"Ambulatory Surgery Center\s+", 60)
    if not asc:
        asc = _capture_cost_first_valid(full, r"Ambulatory Surgery\s+", 60)
    grid["outpatient_surgery_facility"] = asc

    # Inpatient hospital: day-rate or coinsurance
    grid["inpatient_hospital_facility"] = _capture_day_rate(full, r"Hospital services and stay")
    if not grid["inpatient_hospital_facility"]:
        grid["inpatient_hospital_facility"] = _capture_cost(
            full, r"Hospital services and stay\s+", 100
        )

    # ── Mental health ─────────────────────────────────────────────────────────
    # Use regex (not str.find) because in some AI/AN PDFs column text bleeds
    # into the section header line: "Mental Health and Your payment\nSubstance..."
    # making the exact string "Mental Health and Substance" absent.
    mh_m = re.search(r"Mental Health", full)
    mh_start = mh_m.start() if mh_m else -1
    rx_start = full.find("Prescription Drug Benefits")
    if mh_start >= 0 and rx_start > mh_start:
        mh_section = full[mh_start:rx_start]
    elif mh_start >= 0:
        mh_section = full[mh_start: mh_start + 2000]
    else:
        mh_section = ""

    # MH outpatient: "Office visit, including Physician office visit $X/visit"
    # In 4-column AI/AN PDFs, costs are interleaved before "Physician office visit":
    #   "Office visit, including $60/visit 50% $0 Physician office visit"
    # Anchoring on "Office visit\b" captures the cost that follows the section label.
    grid["mental_health_outpatient"] = _capture_cost(
        mh_section, r"Office visit\b", 80
    )

    # MH inpatient: Hospital services within inpatient subsection of MH section
    mh_inp_start = mh_section.find("Inpatient services")
    mh_inp_text = mh_section[mh_inp_start:] if mh_inp_start >= 0 else mh_section

    # Try forward capture first (PPO: "Hospital services 30%")
    mh_hosp = re.search(r"Hospital services\s+(" + COST_RE + r")", mh_inp_text, re.I)
    if mh_hosp:
        grid["mental_health_inpatient"] = mh_hosp.group(1).strip()
    else:
        # Reversed capture (HMO: "$375/day up to Hospital services 5 days/admission")
        rev = re.search(
            r"(\$[\d,]+/day\s+up\s+to)\s+Hospital services\s+(\d+\s+days/\w+)",
            mh_inp_text.replace("\n", " "),
        )
        if rev:
            grid["mental_health_inpatient"] = f"{rev.group(1)} {rev.group(2)}"
        else:
            # Last resort: same as inpatient hospital (HMO plans: identical cost-sharing)
            grid["mental_health_inpatient"] = grid.get("inpatient_hospital_facility", "")

    # ── Prescription drugs ────────────────────────────────────────────────────
    rx_start_idx = full.find("Prescription Drug Benefits")
    rx_text = full[rx_start_idx: rx_start_idx + 1500] if rx_start_idx >= 0 else ""

    # PPO column-interleave: the "N% up to" coinsurance from Tier X OON column
    # bleeds before the "Tier X+1 Drugs" label, and the dollar cap appears after it.
    # Example (Silver 70 PPO):
    #   "...Tier 3 Drugs $90/prescription  20% up to Not covered Tier 4 Drugs  $250/prescription..."
    # Tier 4 in-network = "20% up to $250/prescription" — assembled from text
    # before and after the Tier 4 label.
    for tier_label, field_key in [
        ("Tier 1 Drugs", "generic_drugs_tier1"),
        ("Tier 2 Drugs", "preferred_brand_tier2"),
        ("Tier 3 Drugs", "nonpreferred_brand_tier3"),
        ("Tier 4 Drugs", "specialty_tier4"),
    ]:
        tier_m = re.search(re.escape(tier_label), rx_text, re.I)
        if not tier_m:
            grid[field_key] = ""
            continue

        after = rx_text[tier_m.end(): tier_m.end() + 120]
        cv = re.search(COST_RE, after, re.I)
        if not cv:
            grid[field_key] = ""
            continue

        cost = cv.group(0).strip()

        # If captured value is just "$X/prescription" (no %) check whether
        # "N% up to" appears in the ~80 chars BEFORE the tier label — PPO interleave.
        # For AI/AN plans an extra column value (e.g. "Not covered", "$0") can appear
        # between "N% up to" and the next tier label, so allow trailing words:
        #   Standard PPO: "20% up to Not covered Tier 4 Drugs $250/prescription"
        #   AI/AN PPO:    "40% up to Not covered $0 Not covered Tier 2 Drugs $0 $500/rx"
        if cost.startswith("$") and "/prescription" in cost:
            before = rx_text[max(0, tier_m.start() - 80): tier_m.start()]
            pct_m = re.search(
                r"(\d+%\s+up\s+to)(?:\s+\S+)*\s*$",
                before.replace("\n", " ").rstrip(),
            )
            if pct_m:
                cost = f"{pct_m.group(1)} {cost}"

        grid[field_key] = re.sub(r"\s+", " ", cost)

    return grid


# ── Main plan parser ──────────────────────────────────────────────────────────

def _build_variant_id(
    metal_level: str,
    metal_pct: int | None,
    network_type: str,
    marketplace_type: str,
    variant_suffix: str,
) -> str:
    metal_slug = metal_level.lower()
    net_slug = network_type.lower()
    pct_slug = str(metal_pct) if metal_pct else "xx"
    return (
        f"{ISSUER_ID}-{STATE}-{marketplace_type}-{metal_slug}-{pct_slug}"
        f"-{net_slug}-{YEAR}-{variant_suffix}"
    )


def parse_plan(pdf_path: Path) -> dict[str, Any] | None:
    """Parse a single Blue Shield CA SBC PDF into a structured record."""
    stem = pdf_path.stem  # e.g. "2026-Gold-HMO-A49339-EN"

    try:
        meta = _parse_filename(stem)
    except Exception as exc:
        log.warning("Filename parse failed %s: %s", pdf_path.name, exc)
        return None

    try:
        page1, full = _extract_text(pdf_path)
    except Exception as exc:
        log.warning("PDF extraction failed %s: %s", pdf_path.name, exc)
        return None

    plan_name, network_type = _parse_page1(page1, meta["network_type"])
    if not network_type:
        log.warning("Could not determine network type for %s — skipping", pdf_path.name)
        return None

    ded_oop = _parse_deductible_oop(full)
    cost_grid = _parse_cost_grid(full, network_type)

    variant_id = _build_variant_id(
        meta["metal_level"],
        meta["metal_pct"],
        network_type,
        meta["marketplace_type"],
        meta["variant_suffix"],
    )

    return {
        "plan_variant_id": variant_id,
        "state_code": STATE,
        "issuer_id": ISSUER_ID,
        "issuer_name": CARRIER,
        "plan_year": YEAR,
        "metal_level": meta["metal_level"],
        "metal_pct": meta["metal_pct"],
        "csr_variation": meta["csr_variation"],
        "network_type": network_type,
        "marketplace_type": meta["marketplace_type"],
        "marketplace_label": meta["marketplace_label"],
        "is_hdhp": meta["is_hdhp"],
        "is_ai_an": meta["is_ai_an"],
        "plan_name_from_sbc": plan_name,
        "plan_id": meta["form_id"],
        "source": "SBC PDF",
        "source_file": pdf_path.name,
        **ded_oop,
        "cost_sharing_grid": cost_grid,
        "exclusions": [],
    }


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        log.error("No PDFs found in %s — run download_blueshield_ca_sbcs.py first", PDF_DIR)
        sys.exit(1)

    log.info("Parsing %d Blue Shield CA SBC PDFs ...", len(pdfs))
    records: list[dict[str, Any]] = []
    skipped = 0
    for pdf_path in pdfs:
        log.info("  Parsing %s ...", pdf_path.name)
        record = parse_plan(pdf_path)
        if record:
            records.append(record)
            log.info("    -> %s | %s %s %s | %s%s",
                     record["plan_id"],
                     record["metal_level"],
                     record.get("metal_pct", ""),
                     record["network_type"],
                     record["csr_variation"],
                     " [AI/AN]" if record["is_ai_an"] else "")
        else:
            skipped += 1

    output = {
        "metadata": {
            "source": "Blue Shield of California SBC PDFs (individual/family 2026)",
            "issuer_id": ISSUER_ID,
            "issuer_name": CARRIER,
            "state_code": STATE,
            "plan_years": [YEAR],
            "record_count": len(records),
            "skipped_count": skipped,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "schema_version": "1.0",
            "note": (
                "Parsed from Blue Shield CA IFP SBC PDFs via regex on raw text. "
                "Blue Shield uses a proprietary 2-column SBC format (not federal ACA SBC table format). "
                "plan_id = form ID from PDF filename (e.g. A49339). "
                "Cost grid contains in-network (Participating Provider) values only. "
                "Marketplace type inferred from filename: explicit 'Covered-CA'/'CC' -> iex, "
                "'Off-Exchange' -> ifp, CSR/AI-AN/Catastrophic -> iex, others default to iex. "
                "HIOS Issuer ID 90637 should be validated against CMS PUF data."
            ),
        },
        "data": records,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info("Wrote %d records -> %s", len(records), OUT_PATH)

    # ── Validation summary ────────────────────────────────────────────────────
    log.info("=== Validation Summary ===")
    empty_counts: dict[str, int] = {}
    for rec in records:
        for field in ["deductible_individual", "oop_max_individual", "plan_name_from_sbc"]:
            if not rec.get(field):
                empty_counts[field] = empty_counts.get(field, 0) + 1
        for field, val in rec.get("cost_sharing_grid", {}).items():
            if not val:
                key = f"grid.{field}"
                empty_counts[key] = empty_counts.get(key, 0) + 1
    if empty_counts:
        log.warning("Empty fields (count / %d plans):", len(records))
        for field, cnt in sorted(empty_counts.items(), key=lambda x: -x[1]):
            log.warning("  %s: %d empty", field, cnt)
    else:
        log.info("All fields populated across all records.")


if __name__ == "__main__":
    main()
