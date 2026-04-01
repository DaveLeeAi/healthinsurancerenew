"""
ETL: Parse CMS SBE QHP PUF into sbc_sbm_[STATE].json

Downloads the CMS SBE QHP Public Use File ZIP for a given state,
extracts the Plans CSV and Benefits CSV, and builds a structured
JSON output matching the schema in data/processed/sbc_sbm_CA.json.

Source: https://www.cms.gov/marketplace/resources/data/state-based-public-use-files
Download pattern: https://www.cms.gov/files/zip/{statename}sbepuf2025.zip

Usage:
    python scripts/etl/parse_sbc_puf_sbm.py MN
    python scripts/etl/parse_sbc_puf_sbm.py --all
"""

import argparse
import csv
import io
import json
import logging
import re
import sys
import zipfile
from pathlib import Path
from typing import Any
from urllib.request import urlretrieve

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")
PROCESSED_DIR = Path("data/processed")

# State abbreviation → full name for CMS download URL (lowercase, no spaces)
STATE_NAMES: dict[str, str] = {
    "MN": "minnesota",
    "PA": "pennsylvania",
    "CO": "colorado",
    "ID": "idaho",
    "NV": "nevada",
    "NJ": "newjersey",
    "WA": "washington",
    "NY": "newyork",
    "NM": "newmexico",
    "KY": "kentucky",
    "MD": "maryland",
    "CT": "connecticut",
    "DC": "districtofcolumbia",
    "ME": "maine",
    "MA": "massachusetts",
    "RI": "rhodeisland",
    "VT": "vermont",
    "CA": "california",
}

# State abbreviation → marketplace display name
# Known issuer ID → name lookup for states where ISSUER NAME is blank in PUF.
# Built from mn_source_registry.json, CMS HIOS data, and plan marketing names.
ISSUER_NAMES: dict[str, str] = {
    # MN
    "31616": "Medica",
    "57129": "Blue Plus (BCBS MN)",
    "70373": "Quartz Health Plan",
    "79888": "HealthPartners",
    "85736": "UCare",
    # PA
    "23237": "Highmark Inc.",
    "36096": "Geisinger Health Plan",
    "78079": "UPMC Health Plan",
    "84217": "Oscar Health Plan",
    "33373": "Independence Blue Cross",
    # CO
    "36194": "Denver Health Medical Plan",
    "52192": "Friday Health Plans",
    "63436": "Rocky Mountain HMO",
    "75753": "Anthem Blue Cross Blue Shield",
    "86830": "Kaiser Permanente",
    "87726": "Cigna Healthcare",
    "17230": "Oscar Health Plan",
    "27357": "Bright Health",
    # ID
    "14095": "Blue Cross of Idaho",
    "23603": "PacificSource Health Plans",
    "35783": "SelectHealth",
    "15539": "Mountain Health CO-OP",
    # NV
    "21113": "Ambetter of Nevada",
    "55204": "Health Plan of Nevada (UHC)",
    "93299": "SilverSummit Healthplan",
    "14705": "Hometown Health",
    "72052": "Friday Health Plans of Nevada",
    # NJ
    "23236": "Horizon Blue Cross Blue Shield NJ",
    "36620": "AmeriHealth HMO",
    "68813": "Oscar Health Plan",
    "52619": "Ambetter from WNHG",
    # WA
    "10191": "Kaiser Foundation Health Plan of WA",
    "18543": "Premera Blue Cross",
    "43849": "Coordinated Care",
    "74489": "Molina Healthcare of WA",
    "95185": "LifeWise Health Plan of WA",
    # NY
    "28951": "MetroPlus Health Plan",
    "38344": "MVP Health Plan",
    "55711": "Oscar Health Plan",
    "71073": "Fidelis Care",
    "84805": "Healthfirst",
    "93689": "EmblemHealth",
    # NM
    "36882": "Molina Healthcare of NM",
    "54172": "Blue Cross Blue Shield of NM",
    "79865": "True Health NM",
    "37814": "Presbyterian Health Plan",
    # KY
    "57173": "Ambetter from Wellcare",
    "68063": "Anthem Blue Cross Blue Shield KY",
    "47432": "CareSource",
    "36408": "Molina Healthcare of KY",
    # MD
    "18919": "CareFirst BlueChoice",
    "52898": "CareFirst BlueCross BlueShield",
    "86052": "Kaiser Permanente",
    "27508": "Aetna Health",
    # CT
    "86304": "Anthem Health Plans of CT",
    "22444": "ConnectiCare Benefits",
    "59763": "ConnectiCare Insurance",
    # DC
    "41842": "CareFirst BlueCross BlueShield",
    "78439": "Kaiser Permanente",
    "94192": "Aetna Life Insurance",
    # ME
    "24355": "Community Health Options",
    "39022": "Anthem Health Plans of ME",
    "88806": "Harvard Pilgrim Health Care",
    # MA
    "21989": "Tufts Health Plan",
    "23682": "Harvard Pilgrim Health Care",
    "24610": "Fallon Health",
    "56204": "BMC HealthNet Plan",
    "88806": "Health Plans Inc.",
    "73141": "Blue Cross Blue Shield of MA",
    "36966": "ConnectiCare of MA",
    # RI
    "27603": "Neighborhood Health Plan of RI",
    "53104": "Blue Cross Blue Shield of RI",
    # VT
    "25198": "Blue Cross Blue Shield of VT",
    "72454": "MVP Health Plan",
}

MARKETPLACE_LABELS: dict[str, str] = {
    "MN": "MNsure",
    "PA": "Pennie",
    "CO": "Connect for Health Colorado",
    "ID": "Your Health Idaho",
    "NV": "Nevada Health Link",
    "NJ": "GetCoveredNJ",
    "WA": "Washington Healthplanfinder",
    "NY": "NY State of Health",
    "NM": "beWellnm",
    "KY": "kynect",
    "MD": "Maryland Health Connection",
    "CT": "Access Health CT",
    "DC": "DC Health Link",
    "ME": "CoverME",
    "MA": "Massachusetts Health Connector",
    "RI": "HealthSource RI",
    "VT": "Vermont Health Connect",
    "CA": "Covered California",
}

# Benefit name → cost_sharing_grid key mapping
BENEFIT_TO_GRID: dict[str, str] = {
    "Primary Care Visit to Treat an Injury or Illness": "primary_care",
    "Specialist Visit": "specialist",
    "Preventive Care/Screening/Immunization": "preventive_care",
    "Laboratory Outpatient and Professional Services": "diagnostic_lab",
    "Imaging (CT/PET Scans, MRIs)": "imaging",
    "X-rays and Diagnostic Imaging": "imaging",
    "Generic Drugs": "generic_drugs_tier1",
    "Preferred Brand Drugs": "preferred_brand_tier2",
    "Non-Preferred Brand Drugs": "nonpreferred_brand_tier3",
    "Specialty Drugs": "specialty_tier4",
    "Emergency Room Services": "er_facility",
    "Emergency Transportation/Ambulance": "emergency_transport",
    "Urgent Care Centers or Facilities": "urgent_care",
    "Inpatient Hospital Services (e.g., Hospital Stay)": "inpatient_hospital_facility",
    "Outpatient Facility Fee (e.g., Ambulatory Surgery Center)": "outpatient_surgery_facility",
    "Mental/Behavioral Health Outpatient Services": "mental_health_outpatient",
    "Mental/Behavioral Health Inpatient Services": "mental_health_inpatient",
}

# All 16 cost_sharing_grid keys in schema order
GRID_KEYS = [
    "primary_care",
    "specialist",
    "preventive_care",
    "diagnostic_lab",
    "imaging",
    "generic_drugs_tier1",
    "preferred_brand_tier2",
    "nonpreferred_brand_tier3",
    "specialty_tier4",
    "er_facility",
    "emergency_transport",
    "urgent_care",
    "inpatient_hospital_facility",
    "outpatient_surgery_facility",
    "mental_health_outpatient",
    "mental_health_inpatient",
]


# Ordered list of (pattern, issuer_name) for inferring issuer from plan marketing name.
# Checked in order; first match wins. More specific patterns first.
PLAN_NAME_PATTERNS: list[tuple[str, str]] = [
    ("blue cross of idaho", "Blue Cross of Idaho"),
    ("bcbsvt", "Blue Cross Blue Shield of VT"),
    ("bcbs", "Blue Cross Blue Shield"),
    ("bluechoice", "CareFirst BlueChoice"),
    ("bluepreferred", "CareFirst BlueCross BlueShield"),
    ("blue community", "Blue Cross Blue Shield of NM"),
    ("bluesolutions", "Blue Cross Blue Shield of RI"),
    ("my blue access", "Excellus BCBS"),
    ("my direct blue", "Independence Blue Cross"),
    ("my priority blue", "Independence Blue Cross"),
    ("together blue", "Independence Blue Cross"),
    ("blue plus", "Blue Plus (BCBS MN)"),
    ("anthem", "Anthem"),
    ("wellpoint", "Wellpoint"),
    ("ambetter", "Ambetter"),
    ("fidelis", "Fidelis Care"),
    ("unitedhealth", "UnitedHealthcare"),
    ("uhc ", "UnitedHealthcare"),
    ("uhc compass", "UnitedHealthcare"),
    ("oscar", "Oscar Health"),
    ("cigna", "Cigna Healthcare"),
    ("aetna", "Aetna"),
    ("kaiser", "Kaiser Permanente"),
    ("kp ", "Kaiser Permanente"),
    ("molina", "Molina Healthcare"),
    ("caresource", "CareSource"),
    ("centene", "Centene"),
    ("geisinger", "Geisinger Health Plan"),
    ("upmc", "UPMC Health Plan"),
    ("highmark", "Highmark"),
    ("horizon", "Horizon BCBS NJ"),
    ("amerihealth", "AmeriHealth"),
    ("connecticare", "ConnectiCare"),
    ("emblemhealth", "EmblemHealth"),
    ("healthfirst", "Healthfirst"),
    ("metroplus", "MetroPlus Health Plan"),
    ("mvp", "MVP Health Plan"),
    ("premera", "Premera Blue Cross"),
    ("lifewise", "LifeWise Health Plan"),
    ("coordinated care", "Coordinated Care"),
    ("community health plan", "Community Health Plan of WA"),
    ("community health options", "Community Health Options"),
    ("health options", "Community Health Options"),
    ("clear choice", "Community Health Options"),
    ("pacificsource", "PacificSource Health Plans"),
    ("selecthealth", "SelectHealth"),
    ("select health", "SelectHealth"),
    ("moda", "Moda Health"),
    ("medica", "Medica"),
    ("healthpartners", "HealthPartners"),
    ("quartz", "Quartz Health Plan"),
    ("ucare", "UCare"),
    ("rocky mountain", "Rocky Mountain HMO"),
    ("rmhp", "Rocky Mountain HMO"),
    ("denver health", "Denver Health Medical Plan"),
    ("elevate health", "Elevate Health Plans"),
    ("friday health", "Friday Health Plans"),
    ("hometown health", "Hometown Health"),
    ("renown", "Hometown Health (Renown)"),
    ("imperial", "Hometown Health"),
    ("ihc ", "AmeriHealth"),
    ("personal choice", "Independence Blue Cross"),
    ("keystone", "Independence Blue Cross"),
    ("harvard pilgrim", "Harvard Pilgrim Health Care"),
    ("tufts", "Tufts Health Plan"),
    ("fallon", "Fallon Health"),
    ("wellsense", "WellSense Health Plan"),
    ("hne ", "Health New England"),
    ("taro", "Taro Health"),
    ("neighborhood", "Neighborhood Health Plan of RI"),
    ("nhpri", "Neighborhood Health Plan of RI"),
    ("presbyterian", "Presbyterian Health Plan"),
    ("st luke", "St. Luke's Health Plan"),
    ("pqa ", "PacificSource Health Plans"),
    ("link ", "Blue Cross of Idaho"),
    ("voyager", "Mountain Health CO-OP"),
    ("complete ", "AmeriHealth"),
    ("jefferson health", "Jefferson Health Plans"),
    ("choice bronze", "CareSource"),
    ("choice silver", "CareSource"),
    ("choice gold", "CareSource"),
]


def infer_issuer_from_plan_name(plan_name: str, issuer_id: str) -> str:
    """Infer issuer name from the plan marketing name when ISSUER NAME is blank."""
    low = plan_name.lower()
    for pattern, name in PLAN_NAME_PATTERNS:
        if pattern in low:
            return name
    # Fallback: return issuer ID so the field isn't blank
    return f"Issuer {issuer_id}"


def download_puf_zip(state: str) -> Path:
    """Download the CMS SBE QHP PUF ZIP for a state. Returns local path."""
    state_name = STATE_NAMES[state]
    zip_name = f"{state_name}sbepuf2025.zip"
    zip_path = RAW_DIR / zip_name

    if zip_path.exists():
        logger.info(f"Using cached ZIP: {zip_path}")
        return zip_path

    url = f"https://www.cms.gov/files/zip/{zip_name}"
    logger.info(f"Downloading {url} ...")
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    urlretrieve(url, zip_path)
    logger.info(f"Saved to {zip_path} ({zip_path.stat().st_size // 1024} KB)")
    return zip_path


def find_csv_in_zip(zf: zipfile.ZipFile, pattern: str) -> str:
    """Find a CSV file in the ZIP matching a pattern (case-insensitive)."""
    pat = pattern.lower()
    for name in zf.namelist():
        if pat in name.lower() and name.lower().endswith(".csv"):
            return name
    raise FileNotFoundError(
        f"No CSV matching '{pattern}' in ZIP. Files: {zf.namelist()}"
    )


def read_csv_from_zip(zf: zipfile.ZipFile, csv_name: str) -> list[dict[str, str]]:
    """Read a CSV from a ZIP file into a list of dicts."""
    with zf.open(csv_name) as f:
        text = io.TextIOWrapper(f, encoding="utf-8-sig")
        reader = csv.DictReader(text)
        return list(reader)


def parse_dollar_text(val: str | None) -> str:
    """Return dollar values as-is for display (matching CA schema text format)."""
    if not val or val.strip().lower() in ("not applicable", "n/a", "", "nan"):
        return ""
    return val.strip()


def parse_family_field(val: str | None) -> str:
    """Parse PUF family fields like '$4500 per person | $9000 per group' → '$9000'.

    Returns the per-group value if present, otherwise the raw value.
    """
    if not val or val.strip().lower() in ("not applicable", "n/a", "", "nan"):
        return ""
    txt = val.strip()
    if "not applicable" in txt.lower():
        return ""
    # Pattern: "$X per person | $Y per group"
    match = re.search(r"\|\s*(\$[\d,]+)\s*per group", txt)
    if match:
        return match.group(1)
    # Pattern: "$X per person" (no group component)
    match = re.search(r"(\$[\d,]+)\s*per person", txt)
    if match:
        return match.group(1)
    return txt


def classify_csr(csr_raw: str) -> str:
    """Normalize CSR variation type to match CA schema values.

    PUF values vary by state, e.g.:
    - "Standard Silver On Exchange Plan"
    - "73% AV Level Silver Plan"
    - "Zero Cost Sharing Plan Variation"
    - "Limited Cost Sharing Plan Variation"
    """
    if not csr_raw:
        return "Standard"
    low = csr_raw.lower().strip()
    if "zero cost" in low:
        return "Zero Cost Share"
    if "limited cost" in low:
        return "Limited Cost Share"
    # Match percentage patterns: "73% AV Level", "Silver CSR 73%", etc.
    match = re.search(r"(\d{2})%\s*av\s*level", low)
    if match:
        return f"Silver CSR {match.group(1)}%"
    match = re.search(r"(?:silver|csr)\s*(?:variation)?\s*(\d{2})%?", low)
    if match:
        return f"Silver CSR {match.group(1)}%"
    match = re.search(r"(\d{2})%?\s*(?:silver|csr)", low)
    if match:
        return f"Silver CSR {match.group(1)}%"
    if "standard" in low:
        return "Standard"
    # Return as-is if we can't classify
    return csr_raw.strip()


def determine_marketplace_type(qhp_type: str | None) -> str:
    """Map QHP NONQHP TYPE ID to marketplace_type."""
    if not qhp_type:
        return "iex"
    low = qhp_type.lower()
    if "exchange" in low or "on the exchange" in low:
        return "iex"
    if "off" in low:
        return "ifp"
    if "both" in low:
        return "iex"
    return "iex"


def build_exclusions(
    benefits_by_plan: dict[str, list[dict[str, str]]], plan_id: str
) -> list[str]:
    """Build exclusion list from Benefits CSV for a plan."""
    rows = benefits_by_plan.get(plan_id, [])
    exclusions: list[str] = []
    for row in rows:
        benefit = row.get("BENEFIT NAME", "")
        is_covered = row.get("IS COVERED", "").strip()
        excl_text = row.get("EXCLUSIONS", "").strip()

        # If explicitly not covered, add as exclusion
        if is_covered.lower() == "not covered" and benefit:
            exclusions.append(benefit)
        # If there's exclusion text, add it
        elif excl_text and excl_text.lower() not in ("", "n/a", "none"):
            # Clean up long boilerplate text
            if len(excl_text) > 200:
                excl_text = excl_text[:200] + "..."
            exclusions.append(f"{benefit}: {excl_text}")

    return exclusions


def build_cost_sharing_grid(
    benefits_by_plan: dict[str, list[dict[str, str]]], plan_id: str
) -> dict[str, str]:
    """Build cost_sharing_grid from Benefits CSV coverage data.

    The SBE PUF Benefits CSV does not contain copay/coinsurance amounts
    (unlike the FFE BenCS PUF). We populate with coverage status where
    available and leave empty strings otherwise, matching the CA schema
    pattern for fields without data.
    """
    grid = {k: "" for k in GRID_KEYS}
    rows = benefits_by_plan.get(plan_id, [])

    for row in rows:
        benefit = row.get("BENEFIT NAME", "")
        grid_key = BENEFIT_TO_GRID.get(benefit)
        if not grid_key:
            continue

        is_covered = row.get("IS COVERED", "").strip()
        if is_covered.lower() == "not covered":
            grid[grid_key] = "Not Covered"
        elif is_covered.lower() in ("yes", "covered"):
            # SBE PUF doesn't have copay amounts — leave as empty string
            # to match CA schema pattern (actual copay data comes from SBC PDFs)
            grid[grid_key] = ""

    return grid


def parse_state(state: str) -> dict[str, Any]:
    """Parse a single state's SBE PUF into the CA schema format."""
    logger.info(f"=== Processing {state} ===")

    zip_path = download_puf_zip(state)
    zf = zipfile.ZipFile(zip_path)

    logger.info(f"ZIP contents: {zf.namelist()}")

    # Find and read Plans CSV
    plans_csv_name = find_csv_in_zip(zf, "plans")
    logger.info(f"Reading Plans CSV: {plans_csv_name}")
    plans_rows = read_csv_from_zip(zf, plans_csv_name)
    logger.info(f"  {len(plans_rows)} rows")

    # Find and read Benefits CSV
    benefits_csv_name = find_csv_in_zip(zf, "benefits")
    logger.info(f"Reading Benefits CSV: {benefits_csv_name}")
    benefits_rows = read_csv_from_zip(zf, benefits_csv_name)
    logger.info(f"  {len(benefits_rows)} rows")

    # Index benefits by PLAN ID for fast lookup
    benefits_by_plan: dict[str, list[dict[str, str]]] = {}
    for row in benefits_rows:
        pid = row.get("PLAN ID", "").strip()
        if pid:
            benefits_by_plan.setdefault(pid, []).append(row)

    # Filter to Individual Medical plans only
    filtered_plans = []
    for row in plans_rows:
        market = row.get("MARKET COVERAGE", "").strip()
        dental = row.get("DENTAL ONLY PLAN", "").strip()
        if market.lower() == "individual" and dental.lower() == "no":
            filtered_plans.append(row)

    logger.info(
        f"  Filtered to {len(filtered_plans)} Individual Medical plan variants"
    )

    if not filtered_plans:
        logger.warning(f"No Individual Medical plans found for {state}!")
        return {"data": []}

    # Build records
    records: list[dict[str, Any]] = []
    marketplace_label = MARKETPLACE_LABELS.get(state, f"{state} Marketplace")

    for row in filtered_plans:
        plan_id = row.get("PLAN ID", "").strip()
        std_component_id = row.get("STANDARD COMPONENT ID", "").strip()
        state_code = row.get("STATE CODE", state).strip()
        issuer_id = row.get("ISSUER ID", "").strip()
        plan_name = row.get("PLAN VARIANT MARKETING NAME", "").strip()
        if not plan_name:
            plan_name = row.get("PLAN MARKETING NAME", "").strip()
        issuer_name = row.get("ISSUER NAME", "").strip()
        if not issuer_name:
            issuer_name = ISSUER_NAMES.get(issuer_id, "")
        if not issuer_name:
            issuer_name = infer_issuer_from_plan_name(plan_name, issuer_id)
        business_year = row.get("BUSINESS YEAR", "").strip()
        metal_level = row.get("METAL LEVEL", "").strip()
        csr_raw = row.get("CSR VARIATION TYPE", "").strip()
        plan_type = row.get("PLAN TYPE", "").strip()
        qhp_type = row.get("QHP NONQHP TYPE ID", "").strip()
        is_hsa = row.get("IS HSA ELIGIBLE", "").strip()

        # Deductibles — prefer TEHB (Total EHB), fall back to MEHB (Medical EHB)
        ded_ind = parse_dollar_text(
            row.get("TEHB DED INN TIER 1 INDIVIDUAL")
            or row.get("TEHB DED INN TIER1 INDIVIDUAL")
            or row.get("MEHB DED INN TIER1 INDIVIDUAL")
        )
        ded_fam = parse_family_field(
            row.get("TEHB DED INN TIER 1 FAMILY")
            or row.get("TEHB DED INN TIER1 FAMILY")
            or row.get("MEHB DED INN TIER1 FAMILY")
        )

        # Drug deductible (DEHB = Dental EHB in PUF, but in context of
        # medical plans, separate drug deductible isn't in SBE PUF columns)
        drug_ded = ""
        if row.get("MEDICAL DRUG DEDUCTIBLES INTEGRATED", "").strip().lower() == "no":
            dehb_ind = parse_dollar_text(
                row.get("DEHB DED INN TIER1 INDIVIDUAL", "")
            )
            if dehb_ind and dehb_ind != ded_ind:
                drug_ded = dehb_ind

        # OOP Max — prefer TEHB, fall back to MEHB
        oop_ind = parse_dollar_text(
            row.get("TEHB INN TIER 1 INDIVIDUAL MOOP")
            or row.get("TEHB INN TIER1 INDIVIDUAL MOOP")
            or row.get("MEHB INN TIER 1 INDIVIDUAL MOOP")
            or row.get("MEHB INN TIER1 INDIVIDUAL MOOP")
        )
        oop_fam = parse_family_field(
            row.get("TEHB INN TIER 1 FAMILY MOOP")
            or row.get("TEHB INN TIER1 FAMILY MOOP")
            or row.get("MEHB INN TIER 1 FAMILY MOOP")
            or row.get("MEHB INN TIER1 FAMILY MOOP")
        )

        record: dict[str, Any] = {
            "plan_variant_id": plan_id,
            "state_code": state_code,
            "issuer_id": issuer_id,
            "issuer_name": issuer_name,
            "plan_year": int(business_year) if business_year.isdigit() else 2025,
            "metal_level": metal_level,
            "metal_pct": None,
            "csr_variation": classify_csr(csr_raw),
            "network_type": plan_type,
            "marketplace_type": determine_marketplace_type(qhp_type),
            "marketplace_label": marketplace_label,
            "is_hdhp": is_hsa.lower() in ("yes", "true"),
            "is_ai_an": (
                "ai-an" in csr_raw.lower()
                or "zero cost" in csr_raw.lower()
                or "limited cost" in csr_raw.lower()
            ),
            "plan_name_from_sbc": plan_name,
            "plan_id": std_component_id,
            "source": "CMS SBE QHP PUF",
            "source_file": plans_csv_name,
            "deductible_individual": ded_ind,
            "deductible_family": ded_fam,
            "drug_deductible": drug_ded,
            "oop_max_individual": oop_ind,
            "oop_max_family": oop_fam,
            "cost_sharing_grid": build_cost_sharing_grid(benefits_by_plan, plan_id),
            "exclusions": build_exclusions(benefits_by_plan, plan_id),
        }
        records.append(record)

    logger.info(f"Built {len(records)} records for {state}")
    return {"data": records}


def validate_schema_match(state_data: dict[str, Any], state: str) -> bool:
    """Validate that output schema matches CA reference file."""
    ca_path = PROCESSED_DIR / "sbc_sbm_CA.json"
    if not ca_path.exists():
        logger.warning("CA reference file not found — skipping schema validation")
        return True

    with open(ca_path) as f:
        ca_data = json.load(f)

    if not ca_data.get("data") or not state_data.get("data"):
        logger.warning("Empty data — skipping schema validation")
        return True

    ca_record = ca_data["data"][0]
    new_record = state_data["data"][0]

    # Check top-level keys match
    ca_keys = set(ca_record.keys())
    new_keys = set(new_record.keys())

    missing = ca_keys - new_keys
    extra = new_keys - ca_keys

    if missing:
        logger.error(f"SCHEMA MISMATCH: Missing keys in {state}: {missing}")
        return False
    if extra:
        logger.error(f"SCHEMA MISMATCH: Extra keys in {state}: {extra}")
        return False

    # Check cost_sharing_grid keys
    ca_grid_keys = set(ca_record.get("cost_sharing_grid", {}).keys())
    new_grid_keys = set(new_record.get("cost_sharing_grid", {}).keys())

    if ca_grid_keys != new_grid_keys:
        logger.error(
            f"SCHEMA MISMATCH: cost_sharing_grid keys differ. "
            f"Missing: {ca_grid_keys - new_grid_keys}, Extra: {new_grid_keys - ca_grid_keys}"
        )
        return False

    # Check data types match for key fields
    type_mismatches = []
    for key in ca_keys:
        ca_type = type(ca_record[key]).__name__
        new_type = type(new_record[key]).__name__
        # Allow None/str/int mismatches for nullable fields
        if ca_type != new_type and not (
            {ca_type, new_type} & {"NoneType"}
            or (ca_type in ("str", "int") and new_type in ("str", "int"))
        ):
            type_mismatches.append(f"  {key}: CA={ca_type}, {state}={new_type}")

    if type_mismatches:
        logger.error(f"SCHEMA MISMATCH: Type differences:\n" + "\n".join(type_mismatches))
        return False

    logger.info(f"Schema validation PASSED for {state} (all keys and types match CA)")
    return True


def save_state(state: str, data: dict[str, Any]) -> Path:
    """Save parsed state data to JSON."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    out_path = PROCESSED_DIR / f"sbc_sbm_{state}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    size_kb = out_path.stat().st_size // 1024
    logger.info(f"Saved {out_path} ({size_kb} KB, {len(data.get('data', []))} records)")
    return out_path


def log_summary(data: dict[str, Any], state: str) -> None:
    """Log a summary of parsed data."""
    records = data.get("data", [])
    if not records:
        return

    issuers = {}
    metals = {}
    csrs = {}
    for r in records:
        issuer = r.get("issuer_name", "Unknown")
        issuers[issuer] = issuers.get(issuer, 0) + 1
        metal = r.get("metal_level", "Unknown")
        metals[metal] = metals.get(metal, 0) + 1
        csr = r.get("csr_variation", "Unknown")
        csrs[csr] = csrs.get(csr, 0) + 1

    logger.info(f"\n--- {state} Summary ---")
    logger.info(f"Total plan variants: {len(records)}")
    logger.info(f"Issuers ({len(issuers)}):")
    for name, count in sorted(issuers.items(), key=lambda x: -x[1]):
        logger.info(f"  {name}: {count}")
    logger.info(f"Metal levels: {dict(sorted(metals.items()))}")
    logger.info(f"CSR variations: {dict(sorted(csrs.items()))}")

    # Check data quality
    has_ded = sum(1 for r in records if r.get("deductible_individual"))
    has_oop = sum(1 for r in records if r.get("oop_max_individual"))
    has_excl = sum(1 for r in records if r.get("exclusions"))
    logger.info(
        f"Data quality: {has_ded}/{len(records)} have deductible, "
        f"{has_oop}/{len(records)} have OOP max, "
        f"{has_excl}/{len(records)} have exclusions"
    )


ALL_STATES = ["MN", "PA", "CO", "ID", "NV", "NJ", "WA", "NY", "NM", "KY",
              "MD", "CT", "DC", "ME", "MA", "RI", "VT"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse CMS SBE QHP PUF for SBM states")
    parser.add_argument(
        "state",
        nargs="?",
        help="State abbreviation (e.g., MN) or --all for all 17 states",
    )
    parser.add_argument("--all", action="store_true", help="Process all 17 SBM states")
    args = parser.parse_args()

    if args.all:
        states = ALL_STATES
    elif args.state:
        state = args.state.upper()
        if state not in STATE_NAMES:
            logger.error(f"Unknown state: {state}. Valid: {sorted(STATE_NAMES.keys())}")
            sys.exit(1)
        states = [state]
    else:
        parser.print_help()
        sys.exit(1)

    results: dict[str, int] = {}
    for state in states:
        try:
            data = parse_state(state)
            log_summary(data, state)
            schema_ok = validate_schema_match(data, state)
            if not schema_ok:
                logger.error(f"Schema validation FAILED for {state} — not saving")
                results[state] = 0
                continue
            save_state(state, data)
            results[state] = len(data.get("data", []))
        except Exception as e:
            logger.error(f"FAILED to process {state}: {e}", exc_info=True)
            results[state] = -1

    logger.info("\n=== Final Results ===")
    for state, count in results.items():
        status = f"{count} records" if count >= 0 else "FAILED"
        logger.info(f"  {state}: {status}")


if __name__ == "__main__":
    main()
