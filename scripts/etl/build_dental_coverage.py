"""
ETL: SADP Dental Coverage Intelligence (Pillar 7)

Extracts Stand-Alone Dental Plan (SADP) data from CMS PUF files:

  - plan-attributes-puf.csv   → plan metadata, deductible, annual maximum
  - benefits-and-cost-sharing-puf.csv → coverage %, waiting periods, quantity limits
  - service-area-puf.csv      → county-level service area

CMS PUF conventions for SADPs:
  - MetalLevel: "Low" (less comprehensive) or "High" (more comprehensive)
  - MEHB MOOP columns → repurposed to store dental ANNUAL MAXIMUM
  - MEHB Deductible columns → store dental DEDUCTIBLE
  - BenCS CoinsInnTier1 → patient coinsurance %, so plan_pays = 100 - coinsurance
  - Waiting periods appear in BenCS Exclusions free text
  - Premiums not published in rate-puf.csv for SADPs

Sources:
  data/raw/puf/plan-attributes-puf.csv
  data/raw/puf/benefits-and-cost-sharing-puf.csv
  data/raw/puf/service-area-puf.csv

Output:
  data/processed/dental_coverage.json

Usage:
    python scripts/etl/build_dental_coverage.py
"""

import json
import logging
import re
from pathlib import Path
from typing import Any

import pandas as pd
from tqdm import tqdm

logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")
PROCESSED_DIR = Path("data/processed")
OUTPUT_PATH = PROCESSED_DIR / "dental_coverage.json"

# ─── Benefit Name → Canonical Category ───────────────────────────────────────
# Maps lowercase BenefitName substrings to (category_key, age_group)
# Ordered specific → general; first match wins.

DENTAL_BENEFIT_MAP: list[tuple[str, str]] = [
    # Preventive
    ("routine dental services (adult)",     "preventive_adult"),
    ("dental check-up for children",        "preventive_child"),
    ("dental check-up",                     "preventive_child"),
    ("topical fluoride",                    "fluoride_child"),
    ("sealants",                            "sealants_child"),
    ("dental x-rays",                       "xrays"),
    ("dental x-ray",                        "xrays"),
    # Basic
    ("basic dental care - adult",           "basic_adult"),
    ("basic dental care - child (non ehb)", "basic_child_non_ehb"),
    ("basic dental care - child",           "basic_child"),
    ("basic dental care",                   "basic_adult"),
    ("fillings",                            "fillings"),
    ("minor restorative services",          "fillings"),
    ("posterior composites - adult",        "posterior_composites_adult"),
    ("posterior composites - child",        "posterior_composites_child"),
    # Extractions
    ("extractions",                         "extractions"),
    # Major
    ("major dental care - adult",           "major_adult"),
    ("major dental care - child (non ehb)", "major_child_non_ehb"),
    ("major dental care - child",           "major_child"),
    ("major dental care",                   "major_adult"),
    ("root canal therapy and retreatment",  "root_canal"),
    ("root canal",                          "root_canal"),
    ("oral surgery",                        "oral_surgery"),
    ("periodontal root scaling and planing","periodontics"),
    ("periodontal and osseous surgery",     "periodontics"),
    ("periodontal maintenance",             "periodontics"),
    ("complete and partial dentures",       "dentures"),
    ("denture adjustments",                 "dentures"),
    ("denture rebase",                      "dentures"),
    ("denture reline and rebase",           "dentures"),
    ("denture reline",                      "dentures"),
    ("immediate dentures",                  "dentures"),
    ("initial placement of bridges",        "bridges"),
    ("post and core build-up",              "crowns"),
    # Implants
    ("implants - adult",                    "implants_adult"),
    ("implants - child",                    "implants_child"),
    ("implants",                            "implants_adult"),
    # Orthodontia
    ("orthodontia - adult",                 "ortho_adult"),
    ("orthodontia - child",                 "ortho_child"),
    ("cosmetic orthodontia",                "ortho_cosmetic"),
    ("cosmetic orthodonita",                "ortho_cosmetic"),
    # Other dental
    ("accidental dental - child",           "accidental_child"),
    ("accidental dental adult",             "accidental_adult"),
    ("accidental dental",                   "accidental_adult"),
]

# Build fast lookup: substr → category
_DENTAL_LOOKUP: list[tuple[str, str]] = sorted(
    DENTAL_BENEFIT_MAP, key=lambda x: -len(x[0])
)

# Which categories roll up to the 4 SBC canonical service categories
SBC_ROLLUP: dict[str, str] = {
    "preventive_adult":        "preventive",
    "preventive_child":        "preventive",
    "fluoride_child":          "preventive",
    "sealants_child":          "preventive",
    "xrays":                   "preventive",
    "basic_adult":             "basic",
    "basic_child":             "basic",
    "basic_child_non_ehb":     "basic",
    "fillings":                "basic",
    "posterior_composites_adult": "basic",
    "posterior_composites_child": "basic",
    "extractions":             "basic",
    "major_adult":             "major",
    "major_child":             "major",
    "major_child_non_ehb":     "major",
    "root_canal":              "major",
    "oral_surgery":            "major",
    "periodontics":            "major",
    "dentures":                "major",
    "bridges":                 "major",
    "crowns":                  "major",
    "implants_adult":          "implants",
    "implants_child":          "implants",
    "ortho_adult":             "ortho",
    "ortho_child":             "ortho",
    "ortho_cosmetic":          "ortho",
    "accidental_adult":        "accidental",
    "accidental_child":        "accidental",
}


def classify_dental_benefit(benefit_name: str) -> str | None:
    """Map raw BenefitName to canonical dental category key."""
    if not benefit_name:
        return None
    b = benefit_name.lower().strip()
    for pattern, category in _DENTAL_LOOKUP:
        if pattern in b:
            return category
    return None


# ─── Value Parsers ────────────────────────────────────────────────────────────

def parse_dollar(val: Any) -> float | None:
    """Parse dollar amount from PUF field, handling 'Not Applicable', '$50 ', etc."""
    if pd.isna(val):
        return None
    s = str(val).strip()
    if not s or s.lower() in ("not applicable", "n/a", "nan"):
        return None
    if "not applicable" in s.lower():
        return None
    s = re.sub(r"\s*(per person|per group|per individual).*$", "", s, flags=re.IGNORECASE)
    s = s.replace("$", "").replace(",", "").strip()
    try:
        return float(s)
    except ValueError:
        return None


def parse_coinsurance_pct(val: Any) -> float | None:
    """Parse patient coinsurance % from BenCS field (e.g. '35.00%', '20.00% Coinsurance after deductible')."""
    if pd.isna(val):
        return None
    s = str(val).strip()
    if not s or s.lower() in ("not applicable", "n/a", "nan", "no charge"):
        return None
    m = re.search(r"(\d+(?:\.\d+)?)\s*%", s)
    if m:
        return round(float(m.group(1)), 1)
    return None


def extract_waiting_periods(exclusion_texts: list[str]) -> dict[str, Any]:
    """
    Extract waiting period months from BenCS Exclusions free text.

    Patterns:
      "12 month waiting period" | "12-month waiting period"
      "6 month waiting period" | "6-month waiting period"
      References to "Class II" (basic) or "Class III" (major)
    """
    combined = " ".join(exclusion_texts).lower()

    # Basic (Class II) waiting period
    basic_months: int | None = None
    # Major (Class III) waiting period
    major_months: int | None = None
    # Ortho waiting period
    ortho_months: int | None = None

    # Look for class-specific patterns first
    m = re.search(r"(\d+)[- ]month waiting period on class iii", combined)
    if m:
        major_months = int(m.group(1))

    m = re.search(r"(\d+)[- ]month waiting period on class ii(?! i)", combined)
    if m:
        basic_months = int(m.group(1))

    m = re.search(r"(\d+)[- ]month waiting period on.*ortho", combined)
    if m:
        ortho_months = int(m.group(1))

    # Generic "12 month waiting period" / "6 month waiting period"
    if major_months is None and basic_months is None:
        months_found = re.findall(r"(\d+)[- ]month waiting period", combined)
        if months_found:
            periods = sorted(set(int(m) for m in months_found), reverse=True)
            if periods:
                major_months = periods[0]   # longest period → major
                if len(periods) > 1:
                    basic_months = periods[1]  # shorter → basic

    has_any = major_months is not None or basic_months is not None or ortho_months is not None

    return {
        "preventive_months": 0,  # Preventive never has waiting period
        "basic_months": basic_months,
        "major_months": major_months,
        "ortho_months": ortho_months,
        "source": "bencs_exclusions" if has_any else "not_extractable",
        "needs_pdf_parsing": not has_any,
    }


def detect_preexisting_exclusion(texts: list[str]) -> bool:
    """Return True if any text mentions pre-existing condition exclusion."""
    combined = " ".join(t.lower() for t in texts if t)
    return any(kw in combined for kw in [
        "pre-existing", "preexisting", "pre existing",
        "prior condition", "waiting period for pre",
    ])


# ─── Service Area County Index ────────────────────────────────────────────────

def build_service_area_index(sa_path: Path) -> dict[str, dict[str, Any]]:
    """
    Build index: service_area_id → {covers_entire_state, counties, market_coverage}
    County values are FIPS codes (integers).
    """
    logger.info("Loading Service Area PUF...")
    sa = pd.read_csv(sa_path, low_memory=False, dtype={"IssuerId": str, "ServiceAreaId": str})
    sa = sa[(sa["BusinessYear"] == 2026) & (sa["DentalOnlyPlan"] == "Yes")]
    logger.info(f"  Dental service area rows: {len(sa):,}")

    index: dict[str, dict[str, Any]] = {}
    for sa_id, group in sa.groupby("ServiceAreaId"):
        covers_state = (group["CoverEntireState"] == "Yes").any()
        counties_raw = group["County"].dropna().unique()
        counties = sorted(int(c) for c in counties_raw if str(c).replace(".0", "").isdigit())
        market = group["MarketCoverage"].iloc[0] if len(group) > 0 else None
        index[str(sa_id)] = {
            "covers_entire_state": bool(covers_state),
            "counties": counties,
            "market_coverage": market,
        }

    logger.info(f"  Indexed {len(index):,} dental service areas")
    return index


# ─── BenCS Dental Index ───────────────────────────────────────────────────────

def build_bencs_dental_index(bencs_path: Path, dental_ids: set[str]) -> dict[str, dict[str, Any]]:
    """
    Build per-plan-variant index of dental coverage data from BenCS PUF.

    Returns:
        dict keyed by plan_variant_id → {
            "benefits": { category_key → benefit_record },
            "waiting_periods": waiting_period_dict,
            "quantity_limits": { category → {qty, unit} },
            "implants_adult_covered": bool,
            "ortho_adult_covered": bool,
            "pre_existing_excluded": bool,
            "exclusion_texts": [str, ...],
        }
    """
    logger.info("Loading BenCS PUF (dental plans only)...")
    bencs = pd.read_csv(
        bencs_path,
        low_memory=False,
        usecols=[
            "BusinessYear", "PlanId", "BenefitName",
            "CopayInnTier1", "CopayInnTier2", "CoinsInnTier1", "CoinsInnTier2",
            "CoinsOutofNet", "IsCovered", "QuantLimitOnSvc", "LimitQty", "LimitUnit",
            "Exclusions",
        ],
        dtype={"PlanId": str},
    )
    bencs = bencs[(bencs["BusinessYear"] == 2026) & (bencs["PlanId"].isin(dental_ids))]
    logger.info(f"  Dental BenCS rows: {len(bencs):,}")

    index: dict[str, dict[str, Any]] = {}

    for plan_id, group in tqdm(bencs.groupby("PlanId"), desc="Indexing dental BenCS", unit="plan"):
        benefits: dict[str, Any] = {}
        exclusion_texts: list[str] = []
        qty_limits: dict[str, Any] = {}

        for _, row in group.iterrows():
            benefit_name = str(row["BenefitName"]) if pd.notna(row["BenefitName"]) else ""
            category = classify_dental_benefit(benefit_name)

            # Collect exclusion/waiting period text
            excl = str(row["Exclusions"]) if pd.notna(row["Exclusions"]) else ""
            excl_clean = excl.strip()
            if excl_clean and excl_clean.lower() not in (
                "nan", "not applicable", "n/a", "", "see policy for exclusions.",
                "see policy", "none",
            ):
                exclusion_texts.append(excl_clean)

            if not isinstance(category, str):
                continue

            is_covered = str(row.get("IsCovered", "")).strip().lower() in ("covered", "yes")
            patient_coinsurance = parse_coinsurance_pct(row.get("CoinsInnTier1"))
            plan_pays_pct = round(100.0 - patient_coinsurance, 1) if patient_coinsurance is not None else None

            # Quantity limits
            has_limit = str(row.get("QuantLimitOnSvc", "")).strip().lower() in ("yes", "true")
            if has_limit:
                qty = int(row["LimitQty"]) if pd.notna(row.get("LimitQty")) else None
                unit = str(row["LimitUnit"]).strip() if pd.notna(row.get("LimitUnit")) else None
                qty_limits[category] = {"qty": qty, "unit": unit}

            benefits[category] = {
                "benefit_name": benefit_name,
                "is_covered": is_covered,
                "patient_coinsurance_pct": patient_coinsurance,
                "plan_pays_pct": plan_pays_pct,
                "patient_coinsurance_out_of_network_pct": parse_coinsurance_pct(row.get("CoinsOutofNet")),
                "after_deductible": "after deductible" in str(row.get("CoinsInnTier1", "")).lower(),
                "sbc_rollup": SBC_ROLLUP.get(category),
            }

        # Infer covered flags from benefits dict
        implants_adult = benefits.get("implants_adult", {}).get("is_covered", False)
        ortho_adult = benefits.get("ortho_adult", {}).get("is_covered", False)

        index[str(plan_id)] = {
            "benefits": benefits,
            "waiting_periods": extract_waiting_periods(exclusion_texts),
            "quantity_limits": qty_limits,
            "implants_adult_covered": implants_adult,
            "ortho_adult_covered": ortho_adult,
            "pre_existing_excluded": detect_preexisting_exclusion(exclusion_texts),
            "exclusion_texts": exclusion_texts[:5],
        }

    logger.info(f"  Dental BenCS index: {len(index):,} plan variants")
    return index


# ─── Main Record Builder ──────────────────────────────────────────────────────

def build_coverage_summary(benefits: dict[str, Any]) -> dict[str, Any]:
    """
    Build plan_pays coverage_percentages dict for the 4 SBC canonical categories
    plus granular sub-categories.
    """
    def pct(key: str) -> float | None:
        b = benefits.get(key, {})
        return b.get("plan_pays_pct") if b.get("is_covered") else None

    return {
        # SBC canonical 4 categories
        "preventive_adult": pct("preventive_adult"),
        "preventive_child": pct("preventive_child"),
        "basic_adult": pct("basic_adult"),
        "basic_child": pct("basic_child"),
        "major_adult": pct("major_adult"),
        "major_child": pct("major_child"),
        "ortho_adult": pct("ortho_adult"),
        "ortho_child": pct("ortho_child"),
        # Extended granular categories
        "xrays": pct("xrays"),
        "sealants_child": pct("sealants_child"),
        "fluoride_child": pct("fluoride_child"),
        "root_canal": pct("root_canal"),
        "oral_surgery": pct("oral_surgery"),
        "periodontics": pct("periodontics"),
        "dentures": pct("dentures"),
        "implants_adult": pct("implants_adult"),
        "implants_child": pct("implants_child"),
        "extractions": pct("extractions"),
        "fillings": pct("fillings"),
        "accidental_adult": pct("accidental_adult"),
        "accidental_child": pct("accidental_child"),
    }


def build_records(
    dental_df: pd.DataFrame,
    bencs_index: dict[str, dict[str, Any]],
    sa_index: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    """Build final dental coverage records."""
    logger.info(f"Building records for {len(dental_df):,} dental plan variants...")
    records: list[dict[str, Any]] = []

    for _, row in tqdm(dental_df.iterrows(), total=len(dental_df), desc="Building records", unit="plan"):
        plan_variant_id = str(row["PlanId"])
        sa_id = str(row["ServiceAreaId"]) if pd.notna(row.get("ServiceAreaId")) else None
        sa_data = sa_index.get(sa_id, {}) if sa_id else {}
        bencs = bencs_index.get(plan_variant_id, {})

        # Dental deductible — stored in MEHB Deductible columns by CMS convention
        # Prefer combined (in+out-of-net), fall back to in-network tier1
        ded_individual = (
            parse_dollar(row.get("MEHBDedCombInnOonIndividual"))
            or parse_dollar(row.get("MEHBDedInnTier1Individual"))
        )
        ded_family_pp = (
            parse_dollar(row.get("MEHBDedCombInnOonFamilyPerPerson"))
            or parse_dollar(row.get("MEHBDedInnTier1FamilyPerPerson"))
        )
        ded_family_pg = (
            parse_dollar(row.get("MEHBDedCombInnOonFamilyPerGroup"))
            or parse_dollar(row.get("MEHBDedInnTier1FamilyPerGroup"))
        )

        # Annual maximum — stored in MEHB MOOP columns by CMS convention for SADPs
        ann_max_individual = (
            parse_dollar(row.get("MEHBInnTier1IndividualMOOP"))
            or parse_dollar(row.get("MEHBCombInnOonIndividualMOOP"))
        )
        ann_max_family_pp = (
            parse_dollar(row.get("MEHBInnTier1FamilyPerPersonMOOP"))
            or parse_dollar(row.get("MEHBCombInnOonFamilyPerPersonMOOP"))
        )
        ann_max_family_pg = (
            parse_dollar(row.get("MEHBInnTier1FamilyPerGroupMOOP"))
            or parse_dollar(row.get("MEHBCombInnOonFamilyPerGroupMOOP"))
        )

        plan_level_excl = str(row["PlanLevelExclusions"]) if pd.notna(row.get("PlanLevelExclusions")) else None
        bencs_excl_texts = bencs.get("exclusion_texts", [])
        all_excl_texts = [t for t in ([plan_level_excl] + bencs_excl_texts) if t]

        record: dict[str, Any] = {
            # Plan identification
            "plan_id": str(row["StandardComponentId"]),
            "plan_variant_id": plan_variant_id,
            "plan_name": str(row["PlanMarketingName"]) if pd.notna(row.get("PlanMarketingName")) else None,
            "issuer_id": str(int(float(row["IssuerId"]))) if pd.notna(row.get("IssuerId")) else None,
            "issuer_name": str(row["IssuerMarketPlaceMarketingName"]) if pd.notna(row.get("IssuerMarketPlaceMarketingName")) else None,
            "state_code": str(row["StateCode"]),
            "metal_level": str(row["MetalLevel"]),          # "Low" or "High"
            "plan_type": str(row["PlanType"]) if pd.notna(row.get("PlanType")) else None,
            "csr_variation": str(row["CSRVariationType"]) if pd.notna(row.get("CSRVariationType")) else None,
            "is_new_plan": str(row.get("IsNewPlan", "")).strip() == "Yes",

            # Service area
            "service_area_id": sa_id,
            "covers_entire_state": sa_data.get("covers_entire_state"),
            "counties": sa_data.get("counties", []),
            "market_coverage": sa_data.get("market_coverage"),

            # Deductible (dental deductible stored in MEHB fields per CMS SADP convention)
            "deductible": {
                "individual_in_network": ded_individual,
                "family_per_person_in_network": ded_family_pp,
                "family_per_group_in_network": ded_family_pg,
                "source_note": "MEHB Deductible columns (CMS SADP convention)",
            },

            # Annual maximum (stored in MEHB MOOP columns per CMS SADP convention)
            "annual_maximum": {
                "individual_in_network": ann_max_individual,
                "family_per_person_in_network": ann_max_family_pp,
                "family_per_group_in_network": ann_max_family_pg,
                "source_note": "MEHB MOOP columns (CMS SADP convention)",
            },

            # Waiting periods (from BenCS Exclusions free text)
            "waiting_periods": bencs.get("waiting_periods", {
                "preventive_months": 0,
                "basic_months": None,
                "major_months": None,
                "ortho_months": None,
                "source": "not_available",
                "needs_pdf_parsing": True,
            }),

            # Coverage percentages (plan pays %, = 100 - patient coinsurance)
            "coverage_percentages": build_coverage_summary(bencs.get("benefits", {})),

            # Quantity limits
            "quantity_limits": bencs.get("quantity_limits", {}),

            # Feature flags
            "implants_adult_covered": bencs.get("implants_adult_covered", False),
            "ortho_adult_covered": bencs.get("ortho_adult_covered", False),
            "pre_existing_excluded": (
                detect_preexisting_exclusion(all_excl_texts)
                or bencs.get("pre_existing_excluded", False)
            ),

            # Exclusions
            "plan_level_exclusions_raw": plan_level_excl,
            "bencs_exclusion_notes": bencs_excl_texts[:3],

            # Premiums
            "premium_data_available": False,
            "premium_note": "SADP premiums not published in CMS rate-puf.csv; available via carrier rate filings",

            # References
            "ehb_pediatric_dental_apportionment": (
                round(float(row["EHBPediatricDentalApportionmentQuantity"]), 4)
                if pd.notna(row.get("EHBPediatricDentalApportionmentQuantity")) else None
            ),
            "sbc_url": str(row["URLForSummaryofBenefitsCoverage"]) if pd.notna(row.get("URLForSummaryofBenefitsCoverage")) else None,
        }
        records.append(record)

    logger.info(f"Built {len(records):,} dental coverage records")
    return records


# ─── Validation ───────────────────────────────────────────────────────────────

def validate(records: list[dict[str, Any]]) -> None:
    """Post-build validation checks."""
    logger.info("Validating...")
    total = len(records)
    assert total > 0

    has_deductible = sum(1 for r in records if r["deductible"]["individual_in_network"] is not None)
    has_ann_max = sum(1 for r in records if r["annual_maximum"]["individual_in_network"] is not None)
    has_basic_pct = sum(1 for r in records if r["coverage_percentages"]["basic_adult"] is not None)
    has_major_pct = sum(1 for r in records if r["coverage_percentages"]["major_adult"] is not None)
    has_waiting = sum(1 for r in records if r["waiting_periods"]["source"] == "bencs_exclusions")
    has_counties = sum(1 for r in records if r["counties"])
    ortho_adult_covered = sum(1 for r in records if r["ortho_adult_covered"])
    implants_covered = sum(1 for r in records if r["implants_adult_covered"])

    logger.info(f"  Total records: {total:,}")
    logger.info(f"  Has deductible:        {has_deductible:>5,} ({has_deductible*100//total}%)")
    logger.info(f"  Has annual maximum:    {has_ann_max:>5,} ({has_ann_max*100//total}%)")
    logger.info(f"  Has basic_adult pct:   {has_basic_pct:>5,} ({has_basic_pct*100//total}%)")
    logger.info(f"  Has major_adult pct:   {has_major_pct:>5,} ({has_major_pct*100//total}%)")
    logger.info(f"  Waiting period found:  {has_waiting:>5,} ({has_waiting*100//total}%)")
    logger.info(f"  Has county data:       {has_counties:>5,} ({has_counties*100//total}%)")
    logger.info(f"  Ortho adult covered:   {ortho_adult_covered:>5,}")
    logger.info(f"  Implants covered:      {implants_covered:>5,}")

    # Metal level breakdown
    metals: dict[str, int] = {}
    for r in records:
        metals[r["metal_level"]] = metals.get(r["metal_level"], 0) + 1
    logger.info(f"  Metal levels: {dict(sorted(metals.items()))}")

    # States
    states = sorted(set(r["state_code"] for r in records))
    logger.info(f"  States ({len(states)}): {states}")
    logger.info("  Validation passed")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    plan_attr_path = RAW_DIR / "plan-attributes-puf.csv"
    bencs_path = RAW_DIR / "benefits-and-cost-sharing-puf.csv"
    sa_path = RAW_DIR / "service-area-puf.csv"

    for p in (plan_attr_path, bencs_path, sa_path):
        if not p.exists():
            raise FileNotFoundError(f"Required input not found: {p}")

    # ── Step 1: Load dental plans from Plan Attributes PUF ────────────────────
    logger.info("Loading dental plans from Plan Attributes PUF...")
    pa = pd.read_csv(
        plan_attr_path,
        low_memory=False,
        dtype={"PlanId": str, "StandardComponentId": str, "ServiceAreaId": str, "IssuerId": str},
    )
    dental_df = pa[pa["DentalOnlyPlan"] == "Yes"].copy()
    dental_ids = set(dental_df["PlanId"])
    logger.info(f"  Dental plan variants: {len(dental_df):,}")
    logger.info(f"  Dental base plans:    {dental_df['StandardComponentId'].nunique():,}")
    logger.info(f"  States:               {dental_df['StateCode'].nunique()}")

    # ── Step 2: Build service area county index ───────────────────────────────
    sa_index = build_service_area_index(sa_path)

    # ── Step 3: Build BenCS dental index ─────────────────────────────────────
    bencs_index = build_bencs_dental_index(bencs_path, dental_ids)

    # ── Step 4: Build records ─────────────────────────────────────────────────
    records = build_records(dental_df, bencs_index, sa_index)

    # ── Step 5: Validate ──────────────────────────────────────────────────────
    validate(records)

    # ── Step 6: Save ──────────────────────────────────────────────────────────
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    issuers = sorted(set(r["issuer_id"] for r in records if r["issuer_id"]))
    base_plans = sorted(set(r["plan_id"] for r in records))
    states = sorted(set(r["state_code"] for r in records))
    has_ann_max = sum(1 for r in records if r["annual_maximum"]["individual_in_network"] is not None)
    has_waiting = sum(1 for r in records if r["waiting_periods"]["source"] == "bencs_exclusions")

    output = {
        "metadata": {
            "source": "CMS Plan Attributes PUF + BenCS PUF + Service Area PUF (PY2026)",
            "plan_year": 2026,
            "plan_type": "SADP (Stand-Alone Dental Plan)",
            "record_count": len(records),
            "unique_base_plans": len(base_plans),
            "unique_issuers": len(issuers),
            "states": states,
            "metal_levels": ["Low", "High"],
            "coverage_pct_note": "coverage_percentages = plan_pays %; computed as 100 - patient_coinsurance from BenCS CoinsInnTier1",
            "annual_maximum_note": "Stored in MEHB MOOP columns per CMS SADP convention",
            "deductible_note": "Stored in MEHB Deductible columns per CMS SADP convention",
            "premium_availability": "Not in rate-puf.csv; SADP premiums require carrier rate filings",
            "waiting_periods_coverage": {
                "extractable_from_puf": has_waiting,
                "needs_pdf_parsing": len(records) - has_waiting,
                "puf_coverage_pct": round(has_waiting * 100 / len(records), 1),
            },
            "annual_maximum_coverage_pct": round(has_ann_max * 100 / len(records), 1),
            "generated_at": pd.Timestamp.now().isoformat(),
            "schema_version": "1.0",
        },
        "data": records,
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2, default=str)
    size_mb = OUTPUT_PATH.stat().st_size / 1e6
    logger.info(f"Saved {len(records):,} records ({size_mb:.1f} MB) to {OUTPUT_PATH}")

    # ── Step 7: Print sample record ───────────────────────────────────────────
    print("\n" + "=" * 80)
    print("SAMPLE RECORD — High plan with full coverage grid:")
    print("=" * 80)

    candidates = [
        r for r in records
        if r["metal_level"] == "High"
        and r["coverage_percentages"]["basic_adult"] is not None
        and r["coverage_percentages"]["major_adult"] is not None
        and r["annual_maximum"]["individual_in_network"] is not None
    ]
    sample = candidates[0] if candidates else records[0]
    print(json.dumps(sample, indent=2, default=str))

    # ── Quick stats summary ───────────────────────────────────────────────────
    print("\n" + "=" * 80)
    print("STATS SUMMARY")
    print("=" * 80)
    print(f"Total dental plan variants: {len(records):,}")
    print(f"Unique base plans:          {len(base_plans):,}")
    print(f"States:                     {len(states)}")
    print(f"Annual max coverage:        {has_ann_max:,} ({has_ann_max*100//len(records)}%)")
    print(f"Waiting period extractable: {has_waiting:,} ({has_waiting*100//len(records)}%)")

    # Coverage % distribution
    for cat in ["preventive_adult", "basic_adult", "major_adult", "ortho_child"]:
        pcts = [r["coverage_percentages"][cat] for r in records if r["coverage_percentages"][cat] is not None]
        if pcts:
            import statistics
            print(f"Plan pays {cat}: median={statistics.median(pcts):.0f}% min={min(pcts):.0f}% max={max(pcts):.0f}% (n={len(pcts):,})")


if __name__ == "__main__":
    main()
