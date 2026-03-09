"""
ETL: Build Plan Intelligence Dataset (Pillar 1)

Joins Plan Attributes PUF + Service Area PUF + Rate PUF to create a unified
plan-county-premium dataset. Each record represents one plan available in one
county, with premiums at key age bands.

Sources: plan-attributes-puf.csv, service-area-puf.csv, rate-puf.csv
Output:  data/processed/plan_intelligence.json

Usage:
    python scripts/etl/build_plan_intelligence.py
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

# Key age bands for premium reporting
AGE_BANDS = ["21", "27", "30", "40", "50", "60", "64 and over"]
AGE_BAND_KEYS = ["age_21", "age_27", "age_30", "age_40", "age_50", "age_60", "age_64"]

# Valid metal levels for medical QHP plans
VALID_METAL_LEVELS = {"Bronze", "Expanded Bronze", "Silver", "Gold", "Platinum", "Catastrophic"}

# US state FIPS codes — used to expand CoverEntireState issuers
# Maps state code to list of county FIPS codes
# We'll build this dynamically from the Service Area PUF itself


def load_plan_attributes() -> pd.DataFrame:
    """Load and filter Plan Attributes PUF to Individual market medical plans."""
    logger.info("Loading Plan Attributes PUF...")
    df = pd.read_csv(RAW_DIR / "plan-attributes-puf.csv", low_memory=False)
    logger.info(f"  Raw: {len(df):,} rows")

    # Filter: Individual market, medical only (not dental), base variant only (-00)
    df = df[
        (df["MarketCoverage"] == "Individual")
        & (df["DentalOnlyPlan"] == "No")
        & (df["MetalLevel"].isin(VALID_METAL_LEVELS))
    ]
    # Keep only base plan variant (StandardComponentId is the 14-char base)
    # Deduplicate on StandardComponentId — keep first (base variant)
    df = df.drop_duplicates(subset=["StandardComponentId"], keep="first")
    logger.info(f"  Filtered (Individual/Medical/Base): {len(df):,} plans")
    return df


def parse_dollar_amount(val: Any) -> float | None:
    """Parse dollar amounts from PUF fields. Handles 'Not Applicable', NaN, and currency strings."""
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.lower() in ("not applicable", "n/a", "", "nan"):
        return None
    # Remove $ and commas
    s = s.replace("$", "").replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None


def load_service_areas() -> pd.DataFrame:
    """Load Service Area PUF. Produces issuer_id -> county FIPS mappings."""
    logger.info("Loading Service Area PUF...")
    df = pd.read_csv(RAW_DIR / "service-area-puf.csv", low_memory=False)
    logger.info(f"  Raw: {len(df):,} rows")

    # Filter: Individual market, medical only
    df = df[
        (df["MarketCoverage"] == "Individual")
        & (df["DentalOnlyPlan"] == "No")
    ]

    # For CoverEntireState=Yes, we need all counties for that state.
    # Build a state -> county FIPS lookup from rows that DO have counties
    county_rows = df[df["County"].notna()].copy()
    county_rows["County"] = county_rows["County"].astype(int).astype(str).str.zfill(5)

    state_counties: dict[str, list[str]] = {}
    for _, row in county_rows[["StateCode", "County"]].drop_duplicates().iterrows():
        state_counties.setdefault(row["StateCode"], []).append(row["County"])

    # Process CoverEntireState rows — expand to all counties in that state
    entire_state = df[df["CoverEntireState"] == "Yes"]
    expanded_rows = []
    for _, row in entire_state.iterrows():
        state = row["StateCode"]
        counties = state_counties.get(state, [])
        if not counties:
            # State has no county data in PUF — skip (these are states like NY, CA
            # that run their own exchanges and aren't in the FFM PUF)
            logger.warning(f"  No county data for CoverEntireState issuer {row['IssuerId']} in {state}")
            continue
        for county_fips in counties:
            expanded_rows.append({
                "StateCode": state,
                "IssuerId": row["IssuerId"],
                "ServiceAreaId": row["ServiceAreaId"],
                "County": county_fips,
            })

    # Combine: explicit county rows + expanded entire-state rows
    explicit = county_rows[["StateCode", "IssuerId", "ServiceAreaId", "County"]].copy()
    if expanded_rows:
        expanded_df = pd.DataFrame(expanded_rows)
        result = pd.concat([explicit, expanded_df], ignore_index=True)
    else:
        result = explicit

    result = result.drop_duplicates()
    logger.info(f"  Service area mappings: {len(result):,} (issuer-county pairs)")
    return result


def load_rates() -> pd.DataFrame:
    """Load Rate PUF. Pivot age bands into columns per plan+rating_area."""
    logger.info("Loading Rate PUF...")
    df = pd.read_csv(
        RAW_DIR / "rate-puf.csv",
        usecols=["PlanId", "RatingAreaId", "Age", "Tobacco", "IndividualRate"],
        low_memory=False,
    )
    logger.info(f"  Raw: {len(df):,} rows")

    # Filter to non-tobacco rates and our target age bands
    df = df[
        (df["Tobacco"].isin(["No Preference", "No Tobacco"]))
        & (df["Age"].isin(AGE_BANDS))
    ]
    logger.info(f"  Filtered (non-tobacco, key ages): {len(df):,} rows")

    # Pivot: one row per plan+rating_area, columns for each age premium
    pivoted = df.pivot_table(
        index=["PlanId", "RatingAreaId"],
        columns="Age",
        values="IndividualRate",
        aggfunc="first",
    ).reset_index()

    # Rename age columns
    rename_map = dict(zip(AGE_BANDS, AGE_BAND_KEYS))
    pivoted = pivoted.rename(columns=rename_map)

    logger.info(f"  Pivoted: {len(pivoted):,} plan-area combos")
    return pivoted


def build_plan_intelligence() -> list[dict[str, Any]]:
    """Join all three PUFs to build the plan intelligence dataset."""
    plans_df = load_plan_attributes()
    service_df = load_service_areas()
    rates_df = load_rates()

    # Step 1: Join plans to service areas via IssuerId + ServiceAreaId
    logger.info("Joining plans to service areas...")
    plans_with_sa = plans_df.merge(
        service_df,
        on=["IssuerId", "ServiceAreaId", "StateCode"],
        how="inner",
    )
    logger.info(f"  Plans x counties: {len(plans_with_sa):,} rows")

    # Step 2: Join to rates via PlanId (= StandardComponentId) + RatingAreaId
    # First, we need to map ServiceAreaId -> RatingAreaId.
    # In the Rate PUF, RatingAreaId is like "Rating Area 1". We need to find
    # which rating area each plan's county falls in.
    # Since plans in the same service area share a rating area, we can get it
    # from the rate data: each plan_id has a rating_area_id.
    # For simplicity, we'll join plans to ALL their rating areas from rates.
    logger.info("Joining with rate data...")
    merged = plans_with_sa.merge(
        rates_df,
        left_on="StandardComponentId",
        right_on="PlanId",
        how="inner",
    )
    logger.info(f"  After rate join: {len(merged):,} rows")

    # Step 3: Build output records
    logger.info("Building output records...")
    records: list[dict[str, Any]] = []
    for _, row in merged.iterrows():
        record = {
            "plan_id": row["StandardComponentId"],
            "plan_name": row["PlanMarketingName"],
            "issuer_id": str(int(row["IssuerId"])),
            "issuer_name": row["IssuerMarketPlaceMarketingName"],
            "state_code": row["StateCode"],
            "county_fips": row["County"],
            "metal_level": row["MetalLevel"],
            "plan_type": row["PlanType"],
            "rating_area": row["RatingAreaId"],
            "premiums": {},
            "deductible_individual": parse_dollar_amount(row.get("MEHBDedInnTier1Individual")),
            "deductible_family": parse_dollar_amount(row.get("MEHBDedInnTier1FamilyPerGroup")),
            "oop_max_individual": parse_dollar_amount(row.get("TEHBInnTier1IndividualMOOP")),
            "oop_max_family": parse_dollar_amount(row.get("TEHBInnTier1FamilyPerGroupMOOP")),
            "sbc_url": row.get("URLForSummaryofBenefitsCoverage") if pd.notna(row.get("URLForSummaryofBenefitsCoverage")) else None,
            "formulary_url": row.get("FormularyURL") if pd.notna(row.get("FormularyURL")) else None,
        }
        # Add premiums for each age band
        for age_key in AGE_BAND_KEYS:
            val = row.get(age_key)
            record["premiums"][age_key] = round(float(val), 2) if pd.notna(val) else None

        records.append(record)

    logger.info(f"Built {len(records):,} plan-county-area records")
    return records


def validate(records: list[dict[str, Any]]) -> None:
    """Run validation checks on output records."""
    logger.info("Validating output...")
    assert len(records) > 0, "No records produced"

    errors = 0
    for i, r in enumerate(records):
        # Required fields
        for field in ["plan_id", "issuer_id", "state_code", "metal_level"]:
            if not r.get(field):
                logger.error(f"Record {i}: missing {field}")
                errors += 1

        # Plan ID format
        if r.get("plan_id") and not re.match(r"^\d{5}[A-Z]{2}\d{7}$", r["plan_id"]):
            if errors < 10:
                logger.warning(f"Record {i}: unusual plan_id format: {r['plan_id']}")

        # Premium sanity
        for age_key, val in r.get("premiums", {}).items():
            if val is not None and (val <= 0 or val > 10000):
                logger.warning(f"Record {i}: suspicious premium {age_key}={val}")
                errors += 1

    # Summary stats
    states = set(r["state_code"] for r in records)
    issuers = set(r["issuer_id"] for r in records)
    plans = set(r["plan_id"] for r in records)
    metals = set(r["metal_level"] for r in records)

    logger.info(f"  States: {len(states)}")
    logger.info(f"  Issuers: {len(issuers)}")
    logger.info(f"  Unique plans: {len(plans)}")
    logger.info(f"  Metal levels: {metals}")
    logger.info(f"  Validation errors: {errors}")

    if errors > 100:
        logger.warning(f"High error count ({errors}) but proceeding — review output")


def save(records: list[dict[str, Any]]) -> Path:
    """Save with metadata wrapper."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output = {
        "metadata": {
            "source": "CMS PUF (Plan Attributes + Service Area + Rate)",
            "plan_year": 2026,
            "record_count": len(records),
            "unique_plans": len(set(r["plan_id"] for r in records)),
            "unique_counties": len(set(r["county_fips"] for r in records if r["county_fips"])),
            "states": sorted(set(r["state_code"] for r in records)),
            "generated_at": pd.Timestamp.now().isoformat(),
            "schema_version": "1.0",
        },
        "data": records,
    }
    outpath = PROCESSED_DIR / "plan_intelligence.json"
    with open(outpath, "w") as f:
        json.dump(output, f, indent=2, default=str)
    logger.info(f"Saved {len(records):,} records to {outpath}")
    return outpath


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    records = build_plan_intelligence()
    validate(records)
    outpath = save(records)

    # Print sample
    print(f"\nSaved {len(records):,} records to {outpath}")
    print("\nSample record:")
    print(json.dumps(records[0], indent=2, default=str))


if __name__ == "__main__":
    main()
