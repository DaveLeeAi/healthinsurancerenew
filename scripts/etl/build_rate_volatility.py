"""
ETL: Build Rate Volatility Tracker (Pillar 4)

Creates county-level premium summary statistics for 2026. Structured to accept
multi-year data in future for year-over-year rate change analysis.

Current output: avg premiums by metal level, carrier count, plan count,
age-64 premium shock ratio (highest age / lowest age premium).

Sources: rate-puf.csv, plan-attributes-puf.csv, service-area-puf.csv
Output:  data/processed/rate_volatility.json

Usage:
    python scripts/etl/build_rate_volatility.py
"""

import json
import logging
from pathlib import Path
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")
PROCESSED_DIR = Path("data/processed")

VALID_METAL_LEVELS = {"Bronze", "Expanded Bronze", "Silver", "Gold", "Platinum", "Catastrophic"}


def load_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load all three PUF files needed for rate volatility analysis."""
    logger.info("Loading Plan Attributes PUF...")
    plans = pd.read_csv(
        RAW_DIR / "plan-attributes-puf.csv",
        usecols=[
            "StandardComponentId", "IssuerId", "IssuerMarketPlaceMarketingName",
            "MetalLevel", "PlanType", "ServiceAreaId", "StateCode",
            "MarketCoverage", "DentalOnlyPlan",
        ],
        low_memory=False,
    )
    plans = plans[
        (plans["MarketCoverage"] == "Individual")
        & (plans["DentalOnlyPlan"] == "No")
        & (plans["MetalLevel"].isin(VALID_METAL_LEVELS))
    ].drop_duplicates(subset=["StandardComponentId"])
    logger.info(f"  Medical plans: {len(plans):,}")

    logger.info("Loading Rate PUF...")
    rates = pd.read_csv(
        RAW_DIR / "rate-puf.csv",
        usecols=["PlanId", "RatingAreaId", "Age", "Tobacco", "IndividualRate"],
        low_memory=False,
    )
    rates = rates[rates["Tobacco"].isin(["No Preference", "No Tobacco"])]
    logger.info(f"  Rate rows (non-tobacco): {len(rates):,}")

    logger.info("Loading Service Area PUF...")
    sa = pd.read_csv(RAW_DIR / "service-area-puf.csv", low_memory=False)
    sa = sa[(sa["MarketCoverage"] == "Individual") & (sa["DentalOnlyPlan"] == "No")]
    logger.info(f"  Service area rows: {len(sa):,}")

    return plans, rates, sa


def build_county_map(sa: pd.DataFrame) -> pd.DataFrame:
    """Build county -> issuer/service area mappings (handles CoverEntireState)."""
    county_rows = sa[sa["County"].notna()].copy()
    county_rows["County"] = county_rows["County"].astype(int).astype(str).str.zfill(5)

    # Build state -> counties lookup
    state_counties: dict[str, set[str]] = {}
    for _, row in county_rows[["StateCode", "County"]].drop_duplicates().iterrows():
        state_counties.setdefault(row["StateCode"], set()).add(row["County"])

    # Expand CoverEntireState
    entire_state = sa[sa["CoverEntireState"] == "Yes"]
    expanded = []
    for _, row in entire_state.iterrows():
        state = row["StateCode"]
        for county in state_counties.get(state, []):
            expanded.append({
                "StateCode": state,
                "IssuerId": row["IssuerId"],
                "ServiceAreaId": row["ServiceAreaId"],
                "County": county,
            })

    result = county_rows[["StateCode", "IssuerId", "ServiceAreaId", "County"]].copy()
    if expanded:
        result = pd.concat([result, pd.DataFrame(expanded)], ignore_index=True)

    return result.drop_duplicates()


def build_rate_volatility() -> list[dict[str, Any]]:
    """Build county-level rate volatility summaries."""
    plans, rates, sa = load_data()
    county_map = build_county_map(sa)

    # Join plans to county map
    logger.info("Joining plans to counties...")
    plan_counties = county_map.merge(
        plans[["StandardComponentId", "IssuerId", "IssuerMarketPlaceMarketingName",
               "MetalLevel", "PlanType", "ServiceAreaId", "StateCode"]],
        on=["IssuerId", "ServiceAreaId", "StateCode"],
        how="inner",
    )
    logger.info(f"  Plan-county combinations: {len(plan_counties):,}")

    # Get age-40 premiums (standard reference age) and age extremes
    logger.info("Computing premium statistics...")
    age_40_rates = rates[rates["Age"] == "40"][["PlanId", "RatingAreaId", "IndividualRate"]].copy()
    age_40_rates = age_40_rates.rename(columns={"IndividualRate": "premium_40"})

    age_21_rates = rates[rates["Age"] == "21"][["PlanId", "RatingAreaId", "IndividualRate"]].copy()
    age_21_rates = age_21_rates.rename(columns={"IndividualRate": "premium_21"})

    age_64_rates = rates[rates["Age"] == "64 and over"][["PlanId", "RatingAreaId", "IndividualRate"]].copy()
    age_64_rates = age_64_rates.rename(columns={"IndividualRate": "premium_64"})

    # Merge all age premiums
    plan_premiums = age_40_rates.merge(age_21_rates, on=["PlanId", "RatingAreaId"], how="left")
    plan_premiums = plan_premiums.merge(age_64_rates, on=["PlanId", "RatingAreaId"], how="left")

    # Join to plan-county data
    full = plan_counties.merge(
        plan_premiums,
        left_on="StandardComponentId",
        right_on="PlanId",
        how="inner",
    )
    logger.info(f"  Full joined rows: {len(full):,}")

    # Aggregate by county
    logger.info("Aggregating by county...")
    records: list[dict[str, Any]] = []

    for (state, county), group in full.groupby(["StateCode", "County"]):
        # Metal level breakdown
        metal_stats: dict[str, Any] = {}
        for metal, metal_group in group.groupby("MetalLevel"):
            metal_stats[str(metal).lower().replace(" ", "_")] = {
                "plan_count": int(metal_group["StandardComponentId"].nunique()),
                "avg_premium_40": round(float(metal_group["premium_40"].mean()), 2),
                "min_premium_40": round(float(metal_group["premium_40"].min()), 2),
                "max_premium_40": round(float(metal_group["premium_40"].max()), 2),
            }

        # Overall county stats
        carrier_count = int(group["IssuerId"].nunique())
        plan_count = int(group["StandardComponentId"].nunique())
        avg_premium_40 = round(float(group["premium_40"].mean()), 2)
        avg_premium_21 = round(float(group["premium_21"].mean()), 2) if group["premium_21"].notna().any() else None
        avg_premium_64 = round(float(group["premium_64"].mean()), 2) if group["premium_64"].notna().any() else None

        # Premium shock ratio: how much more does a 64yo pay vs 21yo
        shock_ratio = None
        if avg_premium_21 and avg_premium_64 and avg_premium_21 > 0:
            shock_ratio = round(avg_premium_64 / avg_premium_21, 2)

        # Carrier names
        carriers = sorted(group["IssuerMarketPlaceMarketingName"].unique().tolist())

        records.append({
            "state_code": str(state),
            "county_fips": str(county),
            "plan_year": 2026,
            "carrier_count": carrier_count,
            "plan_count": plan_count,
            "carriers": carriers,
            "avg_premium_age_21": avg_premium_21,
            "avg_premium_age_40": avg_premium_40,
            "avg_premium_age_64": avg_premium_64,
            "age_64_shock_ratio": shock_ratio,
            "by_metal_level": metal_stats,
            # Placeholder for future multi-year data
            "prior_year": None,
            "yoy_change_pct": None,
        })

    # Sort by state, county
    records.sort(key=lambda r: (r["state_code"], r["county_fips"]))
    logger.info(f"Built {len(records):,} county rate summaries")
    return records


def validate(records: list[dict[str, Any]]) -> None:
    """Validate rate volatility output."""
    logger.info("Validating output...")
    assert len(records) > 0, "No records produced"

    for r in records[:50]:
        assert r["carrier_count"] > 0, f"No carriers in {r['county_fips']}"
        assert r["plan_count"] > 0, f"No plans in {r['county_fips']}"
        assert r["avg_premium_age_40"] > 0, f"Invalid premium in {r['county_fips']}"
        if r["age_64_shock_ratio"]:
            # ACA 3:1 age band ratio means max should be around 3.0
            assert r["age_64_shock_ratio"] < 5.0, f"Shock ratio too high: {r['age_64_shock_ratio']}"

    states = set(r["state_code"] for r in records)
    single_carrier = sum(1 for r in records if r["carrier_count"] == 1)

    logger.info(f"  States: {len(states)}")
    logger.info(f"  Counties: {len(records)}")
    logger.info(f"  Single-carrier counties: {single_carrier} ({single_carrier*100//len(records)}%)")
    logger.info(f"  Avg carriers/county: {sum(r['carrier_count'] for r in records)/len(records):.1f}")
    logger.info(f"  Avg plans/county: {sum(r['plan_count'] for r in records)/len(records):.1f}")
    logger.info("  Validation passed")


def save(records: list[dict[str, Any]]) -> Path:
    """Save with metadata wrapper."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    single_carrier = sum(1 for r in records if r["carrier_count"] == 1)

    output = {
        "metadata": {
            "source": "CMS PUF (Rate + Plan Attributes + Service Area)",
            "plan_year": 2026,
            "record_count": len(records),
            "states": sorted(set(r["state_code"] for r in records)),
            "total_carriers": len(set(c for r in records for c in r["carriers"])),
            "single_carrier_counties": single_carrier,
            "multi_year_data_available": False,
            "years_included": [2026],
            "generated_at": pd.Timestamp.now().isoformat(),
            "schema_version": "1.0",
            "note": "YoY change fields are null until prior year data is loaded. Structure supports multi-year analysis.",
        },
        "data": records,
    }
    outpath = PROCESSED_DIR / "rate_volatility.json"
    with open(outpath, "w") as f:
        json.dump(output, f, indent=2, default=str)
    logger.info(f"Saved {len(records):,} records to {outpath}")
    return outpath


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    records = build_rate_volatility()
    validate(records)
    outpath = save(records)

    print(f"\nSaved {len(records):,} records to {outpath}")
    print("\nSample record:")
    print(json.dumps(records[0], indent=2, default=str))


if __name__ == "__main__":
    main()
