"""
ETL: BenCS PUF Integration — Per-Service Cost Sharing Grid (Pillar 3 Enhancement)

Parses benefits-and-cost-sharing-puf.csv to extract per-service copays and
coinsurance for 12 target service categories, then merges into the existing
sbc_decoded.json cost-sharing profiles.

Also categorizes plan_level_exclusions text using the 20-category exclusion
taxonomy from the SBC Parser skill.

Sources:
  - data/raw/puf/benefits-and-cost-sharing-puf.csv   (BenCS PUF, 358 MB)
  - data/processed/sbc_decoded.json                  (existing plan records)

Output:
  - data/processed/sbc_decoded.json                  (updated in-place, schema v2.0)

Usage:
    python scripts/etl/build_bencs_cost_sharing.py
"""

import json
import logging
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

import pandas as pd
from tqdm import tqdm

logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")
PROCESSED_DIR = Path("data/processed")
SBC_OUTPUT = PROCESSED_DIR / "sbc_decoded.json"

TARGET_CATEGORIES = [
    "primary_care",
    "specialist",
    "er",
    "urgent_care",
    "hospital_inpatient",
    "mental_health_outpatient",
    "imaging",
    "generic_rx",
    "preferred_brand_rx",
    "specialty_rx",
    "maternity",
    "rehab",
]

# ─── Service Category Pattern Mapping ────────────────────────────────────────
# Each entry: (category, [substrings to match against lowercase BenefitName])
# Ordered specific → general so the first match wins.

SERVICE_CATEGORY_PATTERNS: list[tuple[str, list[str]]] = [
    ("primary_care", [
        "primary care visit to treat an injury or illness",
        "primary care visit",
        "primary care",
    ]),
    ("specialist", [
        "specialist visit",
        "specialist",
    ]),
    ("er", [
        "emergency room services",
        "emergency room",
        "emergency care",
        "emergency department",
        "emergency services",
    ]),
    ("urgent_care", [
        "urgent care centers or facilities",
        "urgent care center",
        "urgent care",
        "urgicenter",
    ]),
    ("hospital_inpatient", [
        "inpatient hospital services",
        "facility fee (e.g., hospital room)",
        "facility fee (e.g. hospital room)",
        "inpatient hospitalization",
        "inpatient hospital",
        "inpatient admission",
        "hospital stay",
    ]),
    ("mental_health_outpatient", [
        "mental/behavioral health outpatient services",
        "mental health outpatient",
        "behavioral health outpatient",
        "outpatient mental health",
        "mental health care outpatient",
    ]),
    ("imaging", [
        "imaging (ct/pet scans, mris)",
        "imaging (ct/pet scans",
        "ct/pet scans",
        "diagnostic imaging",
        "radiology",
        "imaging",
    ]),
    ("generic_rx", [
        "generic drugs",
        "generic drug",
        "tier 1 - generic",
        "tier 1 drugs",
        "generic medications",
    ]),
    ("preferred_brand_rx", [
        "preferred brand drugs",
        "preferred brand drug",
        "tier 2 - preferred brand",
        "tier 2 drugs",
        "formulary brand drugs",
        "preferred brand",
    ]),
    ("specialty_rx", [
        "specialty drugs",
        "specialty drug",
        "tier 4 - specialty",
        "tier 5 - specialty",
        "specialty medications",
        "high cost specialty",
    ]),
    ("maternity", [
        "prenatal and postnatal care",
        "delivery and all inpatient services for maternity care",
        "maternity care",
        "prenatal care",
        "postnatal care",
        "obstetric care",
        "childbirth/delivery (facility)",
        "childbirth",
        "labor and delivery",
    ]),
    ("rehab", [
        "rehabilitative services",
        "rehabilitation services",
        "rehabilitative occupational",
        "physical therapy",
        "occupational therapy",
        "speech-language pathology services",
        "speech therapy",
        "cardiac rehab",
    ]),
]

# Flat lookup: substr → category (sorted longest-first for specificity)
_BENEFIT_LOOKUP: list[tuple[str, str]] = sorted(
    [(pat, cat) for cat, pats in SERVICE_CATEGORY_PATTERNS for pat in pats],
    key=lambda x: -len(x[0]),
)


# ─── 20-Category Exclusion Taxonomy ──────────────────────────────────────────

EXCLUSION_KEYWORDS: dict[str, list[str]] = {
    "cosmetic":                ["cosmetic surgery", "cosmetic procedure", "elective cosmetic", "aesthetic procedure"],
    "experimental":            ["experimental", "investigational", "not proven", "unproven", "clinical trial"],
    "bariatric":               ["bariatric", "weight loss surgery", "gastric bypass", "gastric sleeve", "lap band", "roux-en-y"],
    "fertility":               ["infertility", "ivf", "in vitro fertilization", "artificial insemination",
                                "fertility treatment", "assisted reproduction", "sperm banking", "egg freezing"],
    "dental_adult":            ["adult dental", "dental care", "dental services", "dental treatment",
                                "routine dental", "dental exam", "dental cleaning", "oral care"],
    "vision_adult":            ["vision care", "eyeglasses", "contact lenses", "vision exam",
                                "routine eye exam", "adult vision", "corrective lenses", "optical"],
    "chiropractic":            ["chiropractic", "chiropractor", "spinal manipulation"],
    "acupuncture":             ["acupuncture"],
    "out_of_country":          ["out of country", "outside the united states", "international coverage",
                                "foreign country", "overseas", "out-of-country"],
    "weight_loss":             ["weight loss program", "weight management program", "diet program",
                                "obesity program", "non-surgical weight", "weight reduction"],
    "hearing_aids":            ["hearing aid", "hearing device", "hearing exam", "hearing evaluation", "hearing instrument"],
    "dme_limits":              ["durable medical equipment", "dme limits", "prosthetics limit", "orthotics limit"],
    "private_nursing":         ["private duty nursing", "private-duty nursing", "private nurse"],
    "custodial_care":          ["custodial care", "long-term care", "nursing home", "assisted living",
                                "residential care", "custodial"],
    "dental_implants":         ["dental implant"],
    "tmj":                     ["tmj", "temporomandibular", "jaw disorder", "jaw joint"],
    "foot_care":               ["routine foot care", "routine podiatry", "toenail trimming", "callus removal"],
    "cosmetic_dental":         ["cosmetic dental", "teeth whitening", "veneers", "bleaching", "enameloplasty"],
    "non_emergency_transport": ["non-emergency transport", "non-emergency medical transport",
                                "non-emergency ambulance", "non emergency transport"],
}


def categorize_exclusions(text: str | None) -> list[str]:
    """Map free-text exclusion string to canonical 20-category taxonomy."""
    if not text:
        return []
    s = text.strip()
    if s.lower() in ("nan", "not applicable", "n/a", "none", ""):
        return []
    s_lower = s.lower()
    found = [cat for cat, kws in EXCLUSION_KEYWORDS.items() if any(kw in s_lower for kw in kws)]
    if not found and len(s) > 10:
        found.append("other")
    return sorted(found)


# ─── Cost-Sharing Value Parser ────────────────────────────────────────────────

def parse_cost_value(val: Any) -> dict[str, Any] | None:
    """
    Parse a BenCS copay/coinsurance cell into a canonical dict.

    Handles:
        "$30"                        → copay $30
        "$500/day"                   → copay $500 per_day
        "20%"                        → coinsurance 20%
        "20% Coinsurance after ded"  → coinsurance 20% after_deductible
        "No Charge"                  → no_charge
        "No Charge after deductible" → no_charge after_deductible
        "Not Applicable"             → null
        "Not Covered"                → not_covered
    """
    if pd.isna(val):
        return None
    s = str(val).strip()
    if not s or s.lower() in ("not applicable", "n/a", "nan"):
        return None

    s_lower = s.lower()
    after_ded = "after deductible" in s_lower or "after the deductible" in s_lower

    if s_lower.replace(".", "").replace(" ", "") in ("notcovered", "excluded", "notcoveredbyplan"):
        return {"type": "not_covered", "after_deductible": False, "display": "Not covered"}

    if "no charge" in s_lower:
        return {
            "type": "no_charge",
            "amount": 0,
            "pct": None,
            "after_deductible": after_ded,
            "display": "No charge after deductible" if after_ded else "No charge",
        }

    # Coinsurance: percentage
    pct_match = re.search(r"(\d+(?:\.\d+)?)\s*%", s)
    if pct_match:
        pct = round(float(pct_match.group(1)), 1)
        return {
            "type": "coinsurance",
            "amount": None,
            "pct": pct,
            "after_deductible": after_ded,
            "display": f"{pct:.0f}% coinsurance" + (" after deductible" if after_ded else ""),
        }

    # Copay: dollar amount
    dollar_match = re.search(r"\$(\d+(?:,\d{3})*(?:\.\d+)?)", s)
    if dollar_match:
        amount = float(dollar_match.group(1).replace(",", ""))
        unit: str | None = None
        if "/day" in s_lower or "per day" in s_lower or "per diem" in s_lower:
            unit = "per_day"
        elif "/visit" in s_lower or "per visit" in s_lower:
            unit = "per_visit"
        display = f"${amount:,.0f} copay"
        if unit:
            display += f" {unit.replace('_', ' ')}"
        if after_ded:
            display += " after deductible"
        return {
            "type": "copay",
            "amount": amount,
            "pct": None,
            "after_deductible": after_ded,
            "unit": unit,
            "display": display,
        }

    # Unknown format — preserve raw value
    return {"type": "unknown", "raw": s, "after_deductible": after_ded, "display": s}


# ─── BenCS PUF Loader ─────────────────────────────────────────────────────────

def classify_benefit_name(benefit_name: str) -> str | None:
    """Map a raw BenefitName string to one of 12 target service categories."""
    if not benefit_name:
        return None
    b = benefit_name.lower().strip()
    for pattern, category in _BENEFIT_LOOKUP:
        if pattern in b:
            return category
    return None


def load_bencs_index(csv_path: Path) -> dict[str, dict[str, Any]]:
    """
    Load BenCS PUF and build a per-plan-variant index of cost-sharing values
    for the 12 target service categories.

    Returns:
        dict keyed by plan_variant_id (PlanId) → {
            "services": { category → service_record },
            "exclusion_texts": [str, ...],
            "benefit_count": int,
            "covered_categories": [str, ...]
        }
    """
    logger.info(f"Loading BenCS PUF from {csv_path} ({csv_path.stat().st_size / 1e6:.0f} MB)...")

    KEEP_COLS = [
        "BusinessYear", "StandardComponentId", "PlanId", "BenefitName",
        "CopayInnTier1", "CopayInnTier2", "CopayOutofNet",
        "CoinsInnTier1", "CoinsInnTier2", "CoinsOutofNet",
        "IsEHB", "IsCovered", "QuantLimitOnSvc", "LimitQty", "LimitUnit",
        "Exclusions",
    ]

    df = pd.read_csv(
        csv_path,
        low_memory=False,
        usecols=KEEP_COLS,
        dtype={"StandardComponentId": str, "PlanId": str},
    )
    logger.info(f"  Loaded: {len(df):,} benefit rows, {df['PlanId'].nunique():,} plan variants")

    # Filter to plan year 2026
    df = df[df["BusinessYear"] == 2026].copy()
    logger.info(f"  After year 2026 filter: {len(df):,} rows, {df['PlanId'].nunique():,} variants")

    # Pre-classify benefit names (vectorized for speed)
    df["_category"] = df["BenefitName"].apply(
        lambda x: classify_benefit_name(str(x)) if pd.notna(x) else None
    )
    classified_pct = df["_category"].notna().mean() * 100
    logger.info(f"  Benefit name classification: {classified_pct:.1f}% of rows matched to a target category")

    # Log which categories matched how many rows
    cat_counts = df["_category"].value_counts()
    for cat in TARGET_CATEGORIES:
        logger.info(f"    {cat}: {cat_counts.get(cat, 0):,} rows")

    # Build per-plan index
    logger.info("  Building per-plan index...")
    index: dict[str, dict[str, Any]] = {}

    for plan_variant_id, group in tqdm(df.groupby("PlanId"), desc="Indexing plan variants", unit="plan"):
        services: dict[str, dict[str, Any]] = {}
        exclusion_texts: list[str] = []

        for _, row in group.iterrows():
            benefit_name = str(row["BenefitName"]) if pd.notna(row["BenefitName"]) else ""
            category = row["_category"]

            # Collect non-boilerplate exclusion text
            excl = str(row["Exclusions"]) if pd.notna(row["Exclusions"]) else ""
            excl_clean = excl.strip()
            if excl_clean and excl_clean.lower() not in (
                "nan", "not applicable", "n/a", "", "see policy for exclusions.",
                "see policy", "none", "no exclusions", "varies by plan",
            ):
                exclusion_texts.append(f"{benefit_name}: {excl_clean}")

            if not isinstance(category, str):
                continue

            is_covered_raw = str(row.get("IsCovered", "")).strip().lower()
            has_qty_limit = str(row.get("QuantLimitOnSvc", "")).strip().lower() in ("yes", "true")

            services[category] = {
                "benefit_name": benefit_name,
                "is_covered": is_covered_raw in ("covered", "yes"),
                "is_ehb": str(row.get("IsEHB", "")).strip().lower() in ("yes", "true"),
                "in_network": {
                    "tier1": {
                        "copay": parse_cost_value(row.get("CopayInnTier1")),
                        "coinsurance": parse_cost_value(row.get("CoinsInnTier1")),
                    },
                    "tier2": {
                        "copay": parse_cost_value(row.get("CopayInnTier2")),
                        "coinsurance": parse_cost_value(row.get("CoinsInnTier2")),
                    },
                },
                "out_of_network": {
                    "copay": parse_cost_value(row.get("CopayOutofNet")),
                    "coinsurance": parse_cost_value(row.get("CoinsOutofNet")),
                },
                "quantity_limit": {
                    "has_limit": True,
                    "qty": int(row["LimitQty"]) if pd.notna(row.get("LimitQty")) else None,
                    "unit": str(row["LimitUnit"]).strip() if pd.notna(row.get("LimitUnit")) else None,
                } if has_qty_limit else None,
            }

        index[str(plan_variant_id)] = {
            "services": services,
            "exclusion_texts": exclusion_texts[:10],  # cap at 10 per plan
            "benefit_count": len(group),
            "covered_categories": sorted(services.keys()),
        }

    logger.info(f"  BenCS index built: {len(index):,} plan variants")
    return index


# ─── Merge into sbc_decoded.json ──────────────────────────────────────────────

def merge_into_sbc(sbc_path: Path, bencs_index: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """
    Load existing sbc_decoded.json and merge BenCS cost-sharing data + exclusion
    taxonomy into each record. Returns the updated data structure.
    """
    logger.info(f"Loading sbc_decoded.json ({sbc_path.stat().st_size / 1e6:.0f} MB)...")
    with open(sbc_path) as f:
        sbc_data = json.load(f)

    records: list[dict[str, Any]] = sbc_data["data"]
    logger.info(f"  Loaded {len(records):,} plan variant records")

    stats: dict[str, Any] = {
        "total": len(records),
        "with_bencs_data": 0,
        "without_bencs_data": 0,
        "exclusions_categorized": 0,
        "exclusions_needs_pdf": 0,
        "category_coverage": defaultdict(int),
        "exclusion_category_counts": defaultdict(int),
    }

    for record in tqdm(records, desc="Merging BenCS data", unit="plan"):
        plan_variant_id = record["plan_variant_id"]
        bencs = bencs_index.get(plan_variant_id)

        # ── Per-service cost-sharing grid ─────────────────────────────────────
        if bencs and bencs["services"]:
            stats["with_bencs_data"] += 1
            record["cost_sharing_grid"] = {
                "source": "bencs_puf",
                "benefit_count": bencs["benefit_count"],
                "covered_categories": bencs["covered_categories"],
                "services": bencs["services"],
                "needs_pdf_parsing": False,
            }
            for cat in bencs["covered_categories"]:
                if cat in TARGET_CATEGORIES:
                    stats["category_coverage"][cat] += 1
        else:
            stats["without_bencs_data"] += 1
            record["cost_sharing_grid"] = {
                "source": "none",
                "benefit_count": 0,
                "covered_categories": [],
                "services": {},
                "needs_pdf_parsing": True,
            }

        # ── Exclusion categorization ──────────────────────────────────────────
        # Combine plan-level exclusion text (from Plan Attributes PUF) with
        # per-benefit exclusion notes from BenCS PUF.
        raw_plan_exclusions = record.get("plan_level_exclusions")
        bencs_excl_texts = bencs["exclusion_texts"] if bencs else []

        combined_text = " | ".join(filter(None, [
            raw_plan_exclusions or "",
            " ".join(bencs_excl_texts),
        ])).strip()

        categories = categorize_exclusions(combined_text if combined_text else None)

        if categories:
            stats["exclusions_categorized"] += 1
            for cat in categories:
                stats["exclusion_category_counts"][cat] += 1
            record["exclusions"] = {
                "source": "puf_text",
                "categories": categories,
                "raw_plan_text": raw_plan_exclusions,
                "bencs_notes": bencs_excl_texts[:5],
                "needs_pdf_parsing": False,
            }
        else:
            stats["exclusions_needs_pdf"] += 1
            record["exclusions"] = {
                "source": "none",
                "categories": [],
                "raw_plan_text": raw_plan_exclusions,
                "bencs_notes": [],
                "needs_pdf_parsing": True,
            }

    # ── Log stats ─────────────────────────────────────────────────────────────
    total = stats["total"]
    logger.info("=== Merge Statistics ===")
    logger.info(f"  Plans with BenCS data:      {stats['with_bencs_data']:>6,} ({stats['with_bencs_data']*100//total}%)")
    logger.info(f"  Plans without BenCS data:   {stats['without_bencs_data']:>6,} ({stats['without_bencs_data']*100//total}%)")
    logger.info(f"  Exclusions from PUF text:   {stats['exclusions_categorized']:>6,} ({stats['exclusions_categorized']*100//total}%)")
    logger.info(f"  Exclusions need PDF:         {stats['exclusions_needs_pdf']:>6,} ({stats['exclusions_needs_pdf']*100//total}%)")
    logger.info("  Per-service category coverage:")
    for cat in TARGET_CATEGORIES:
        n = stats["category_coverage"][cat]
        logger.info(f"    {cat:<30} {n:>6,}  ({n*100//total}%)")
    logger.info("  Top exclusion categories found:")
    for cat, n in sorted(stats["exclusion_category_counts"].items(), key=lambda x: -x[1])[:10]:
        logger.info(f"    {cat:<30} {n:>6,}")

    # ── Update metadata ───────────────────────────────────────────────────────
    metadata = sbc_data["metadata"]
    metadata["schema_version"] = "2.0"
    metadata.pop("fields_still_need_pdf_parsing", None)
    metadata.pop("note", None)

    metadata["bencs_integration"] = {
        "source": "CMS Benefits and Cost Sharing PUF (PY2026)",
        "integrated_at": pd.Timestamp.now().isoformat(),
        "plans_with_bencs_data": stats["with_bencs_data"],
        "plans_without_bencs_data": stats["without_bencs_data"],
        "bencs_coverage_pct": round(stats["with_bencs_data"] * 100 / total, 1),
        "target_service_categories": TARGET_CATEGORIES,
        "category_coverage_counts": dict(stats["category_coverage"]),
    }
    metadata["exclusions_integration"] = {
        "taxonomy_version": "sbc-parser-v1",
        "taxonomy_categories": 20,
        "plans_categorized_from_puf": stats["exclusions_categorized"],
        "plans_needing_pdf_parsing": stats["exclusions_needs_pdf"],
        "puf_coverage_pct": round(stats["exclusions_categorized"] * 100 / total, 1),
        "top_exclusion_categories": dict(
            sorted(stats["exclusion_category_counts"].items(), key=lambda x: -x[1])[:10]
        ),
    }

    return sbc_data


# ─── Validation ───────────────────────────────────────────────────────────────

def validate(records: list[dict[str, Any]]) -> None:
    """Post-merge validation checks."""
    logger.info("Running validation...")
    total = len(records)

    has_grid = sum(1 for r in records if r.get("cost_sharing_grid", {}).get("source") == "bencs_puf")
    has_excl = sum(1 for r in records if r.get("exclusions", {}).get("source") == "puf_text")
    has_primary_care = sum(
        1 for r in records
        if "primary_care" in r.get("cost_sharing_grid", {}).get("covered_categories", [])
    )
    has_rx = sum(
        1 for r in records
        if "generic_rx" in r.get("cost_sharing_grid", {}).get("covered_categories", [])
    )

    assert total > 0, "No records"
    assert has_grid > 0, "No records have BenCS data — check PlanId join"
    assert has_primary_care > 0, "No primary care data found — check benefit name mapping"
    assert has_rx > 0, "No generic Rx data found — check benefit name mapping"

    logger.info(f"  Records with BenCS grid:     {has_grid:,} / {total:,}")
    logger.info(f"  Records with exclusions:     {has_excl:,} / {total:,}")
    logger.info(f"  Records with primary care:   {has_primary_care:,} / {total:,}")
    logger.info(f"  Records with generic Rx:     {has_rx:,} / {total:,}")
    logger.info("  Validation passed")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    bencs_path = RAW_DIR / "benefits-and-cost-sharing-puf.csv"
    if not bencs_path.exists():
        raise FileNotFoundError(f"BenCS PUF not found: {bencs_path}")
    if not SBC_OUTPUT.exists():
        raise FileNotFoundError(f"sbc_decoded.json not found: {SBC_OUTPUT}")

    # Step 1: Build BenCS index
    bencs_index = load_bencs_index(bencs_path)

    # Step 2: Merge into sbc_decoded
    merged = merge_into_sbc(SBC_OUTPUT, bencs_index)

    # Step 3: Validate
    validate(merged["data"])

    # Step 4: Save
    logger.info(f"Saving updated sbc_decoded.json ({SBC_OUTPUT})...")
    with open(SBC_OUTPUT, "w") as f:
        json.dump(merged, f, indent=2, default=str)
    size_mb = SBC_OUTPUT.stat().st_size / 1e6
    logger.info(f"Saved {len(merged['data']):,} records ({size_mb:.0f} MB) to {SBC_OUTPUT}")

    # Step 5: Print sample record
    print("\n" + "=" * 80)
    print("SAMPLE RECORD — Standard Silver plan with full cost-sharing grid")
    print("=" * 80)

    # Find a Silver plan with rich BenCS data (8+ categories covered)
    candidates = [
        r for r in merged["data"]
        if "Standard Silver On Exchange" in r.get("csr_variation", "")
        and r.get("cost_sharing_grid", {}).get("source") == "bencs_puf"
        and len(r["cost_sharing_grid"]["covered_categories"]) >= 8
    ]
    sample = candidates[0] if candidates else merged["data"][0]

    # Focused view showing the new fields
    sample_output = {
        "plan_id": sample["plan_id"],
        "plan_variant_id": sample["plan_variant_id"],
        "plan_name": sample["plan_name"],
        "issuer_name": sample["issuer_name"],
        "state_code": sample["state_code"],
        "metal_level": sample["metal_level"],
        "plan_type": sample["plan_type"],
        "csr_variation": sample["csr_variation"],
        "deductible_individual_in_network": sample["deductibles"]["tehb_in_network_tier1"]["individual"],
        "oop_max_individual_in_network": sample["moop"]["tehb_in_network_tier1"]["individual"],
        "coverage_examples": sample["coverage_examples"],
        "cost_sharing_grid": sample["cost_sharing_grid"],
        "exclusions": sample["exclusions"],
    }
    print(json.dumps(sample_output, indent=2, default=str))


if __name__ == "__main__":
    main()
