"""
ETL: Build SBC Decoded Dataset from Plan Attributes PUF (Pillar 3)

Extracts all cost-sharing, deductible, MOOP, coverage example, and plan design
fields from the Plan Attributes PUF — no PDF parsing needed for these fields.

Includes all CSR variants (Silver 73/87/94, Zero Cost Sharing, Limited Cost Sharing)
because each variant has materially different deductibles and OOP maximums.

Sources: plan-attributes-puf.csv
Output:  data/processed/sbc_decoded.json

Usage:
    python scripts/etl/build_sbc_from_puf.py
"""

import json
import logging
import re
from pathlib import Path
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")
PROCESSED_DIR = Path("data/processed")

VALID_METAL_LEVELS = {"Bronze", "Expanded Bronze", "Silver", "Gold", "Platinum", "Catastrophic"}


def parse_dollar(val: Any) -> float | None:
    """Parse PUF dollar fields like '$1,500 ', '$0 per person', 'Not Applicable'."""
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.lower() in ("not applicable", "n/a", "", "nan"):
        return None
    # Also handle "per person not applicable", "per group not applicable"
    if "not applicable" in s.lower():
        return None
    # Remove $, commas, and trailing descriptors like "per person", "per group"
    s = re.sub(r"\s*(per person|per group).*$", "", s, flags=re.IGNORECASE)
    s = s.replace("$", "").replace(",", "").strip()
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_pct(val: Any) -> float | None:
    """Parse percentage fields like '50.00%', '100%'."""
    if pd.isna(val):
        return None
    s = str(val).strip().rstrip("%")
    if s.lower() in ("not applicable", "n/a", "", "nan"):
        return None
    try:
        return round(float(s), 2)
    except ValueError:
        return None


def load_plan_attributes() -> pd.DataFrame:
    """Load Plan Attributes PUF filtered to Individual medical plans."""
    logger.info("Loading Plan Attributes PUF...")
    df = pd.read_csv(RAW_DIR / "plan-attributes-puf.csv", low_memory=False)
    logger.info(f"  Raw: {len(df):,} rows, {len(df.columns)} columns")

    df = df[
        (df["MarketCoverage"] == "Individual")
        & (df["DentalOnlyPlan"] == "No")
        & (df["MetalLevel"].isin(VALID_METAL_LEVELS))
    ]
    logger.info(f"  Filtered (Individual/Medical): {len(df):,} plan variants")
    logger.info(f"  Unique base plans: {df['StandardComponentId'].nunique():,}")
    return df


def build_sbc_decoded(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Extract slim SBC records from the Plan Attributes PUF.

    Only retains fields used by the UI. cost_sharing_grid and exclusions
    are placeholders populated later by build_bencs_cost_sharing.py.
    """
    logger.info("Building SBC decoded records (slim)...")
    records: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        record: dict[str, Any] = {
            "plan_variant_id": row["PlanId"],
            "plan_id": row["StandardComponentId"],
            "state_code": str(row["StateCode"]),
            "issuer_name": str(row["IssuerMarketPlaceMarketingName"])
                           if pd.notna(row.get("IssuerMarketPlaceMarketingName"))
                           else None,
            "metal_level": str(row["MetalLevel"]),
            "csr_variation": str(row.get("CSRVariationType", ""))
                             if pd.notna(row.get("CSRVariationType")) else "",
            "cost_sharing_grid": {},
            "exclusions": [],
        }
        records.append(record)

    logger.info(f"Built {len(records):,} SBC decoded records")
    return records


def validate(records: list[dict[str, Any]]) -> None:
    """Validate SBC decoded output."""
    logger.info("Validating output...")
    assert len(records) > 0, "No records produced"

    total = len(records)

    # CSR variation breakdown
    csr_counts: dict[str, int] = {}
    for r in records:
        csr = r["csr_variation"]
        csr_counts[csr] = csr_counts.get(csr, 0) + 1
    logger.info("  CSR variation breakdown:")
    for csr, count in sorted(csr_counts.items(), key=lambda x: -x[1]):
        logger.info(f"    {csr}: {count:,}")

    states = set(r["state_code"] for r in records)
    base_plans = set(r["plan_id"] for r in records)
    metals = set(r["metal_level"] for r in records)

    logger.info(f"  Total records: {total:,}")
    logger.info(f"  States: {len(states)}")
    logger.info(f"  Unique base plans: {len(base_plans)}")
    logger.info(f"  Metal levels: {sorted(metals)}")
    logger.info("  Validation passed")


def save(records: list[dict[str, Any]]) -> Path:
    """Save SBC decoded dataset with metadata."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    states = sorted(set(r["state_code"] for r in records))
    base_plans = set(r["plan_id"] for r in records)

    output = {
        "metadata": {
            "source": "CMS Plan Attributes PUF (PY2026)",
            "plan_year": 2026,
            "record_count": len(records),
            "unique_base_plans": len(base_plans),
            "includes_csr_variants": True,
            "states": states,
            "generated_at": pd.Timestamp.now().isoformat(),
            "schema_version": "1.0-slim",
            "note": "Slim output: cost_sharing_grid and exclusions populated by build_bencs_cost_sharing.py",
        },
        "data": records,
    }

    outpath = PROCESSED_DIR / "sbc_decoded.json"
    with open(outpath, "w") as f:
        json.dump(output, f, indent=2, default=str)
    logger.info(f"Saved {len(records):,} records to {outpath}")
    return outpath


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    df = load_plan_attributes()
    records = build_sbc_decoded(df)
    validate(records)
    outpath = save(records)

    print(f"\nSaved {len(records):,} records to {outpath}")
    print("\nSample record:")
    print(json.dumps(records[0], indent=2, default=str))


if __name__ == "__main__":
    main()
