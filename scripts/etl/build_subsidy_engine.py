"""
ETL: Build Subsidy & Affordability Engine (Pillar 2)

Calculates APTC (Advanced Premium Tax Credit) estimates by county using
2026 FPL guidelines, benchmark Silver premiums from Rate PUF, and the
ACA affordability formula.

The APTC formula:
  APTC = Benchmark Silver Premium - Expected Contribution
  Expected Contribution = Household Income * Applicable Percentage

Sources: rate-puf.csv, plan-attributes-puf.csv, service-area-puf.csv
Output:  data/processed/subsidy_engine.json

Usage:
    python scripts/etl/build_subsidy_engine.py
"""

import json
import logging
from pathlib import Path
from typing import Any

import pandas as pd

from county_fips import COVER_ENTIRE_STATE_COUNTIES

logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")
PROCESSED_DIR = Path("data/processed")

# 2025 Federal Poverty Level guidelines (2026 typically uses prior year's FPL)
# Source: HHS ASPE, effective Jan 2025
# Using 2025 FPL for 2026 plan year as is standard practice
FPL_2025 = {
    1: 15650,  # Single person
    2: 21150,
    3: 26650,
    4: 32150,
    5: 37650,
    6: 43150,
    7: 48650,
    8: 54150,
}
# Alaska and Hawaii have higher FPLs
FPL_2025_AK = {1: 19560, 2: 26440, 3: 33320, 4: 40200, 5: 47080, 6: 53960, 7: 60840, 8: 67720}
FPL_2025_HI = {1: 18010, 2: 24340, 3: 30670, 4: 37000, 5: 43330, 6: 49660, 7: 55990, 8: 62320}

# ACA Applicable Percentage table (2026 — enhanced subsidies from IRA)
# These are the max % of income someone pays for benchmark Silver premium
# Below 150% FPL: effectively 0% (most qualify for Medicaid or $0 plans)
# Source: IRS Rev Proc, enhanced by Inflation Reduction Act through 2025
# Note: Enhanced credits set to expire after 2025 unless extended by Congress
# Using enhanced rates assuming extension (common industry assumption for 2026 projections)
APPLICABLE_PERCENTAGES = [
    (150, 0.0),     # 0-150% FPL: 0% of income
    (200, 0.02),    # 150-200% FPL: 0-2% of income
    (250, 0.04),    # 200-250% FPL: 2-4% of income
    (300, 0.06),    # 250-300% FPL: 4-6% of income
    (400, 0.085),   # 300-400% FPL: 6-8.5% of income
]
# Note: Under enhanced credits, no one pays more than 8.5% regardless of income

# FPL percentages to calculate subsidies for
FPL_PERCENTAGES = [150, 200, 250, 300, 400]

# Reference age for subsidy calculation (ACA uses age 21 for benchmark)
# Actually, APTC is based on actual age, but we calculate for a standard 40-year-old
REFERENCE_AGE = "40"


def get_fpl(state_code: str, household_size: int = 1) -> int:
    """Get FPL amount for a state and household size."""
    if state_code == "AK":
        return FPL_2025_AK.get(household_size, FPL_2025_AK[1])
    elif state_code == "HI":
        return FPL_2025_HI.get(household_size, FPL_2025_HI[1])
    else:
        return FPL_2025.get(household_size, FPL_2025[1])


def get_applicable_percentage(fpl_percent: int) -> float:
    """Get the applicable percentage for a given FPL level."""
    for threshold, pct in APPLICABLE_PERCENTAGES:
        if fpl_percent <= threshold:
            return pct
    return 0.085  # Cap at 8.5% under enhanced credits


def get_expected_contribution(income: float, fpl_percent: int) -> float:
    """Calculate expected annual contribution based on income and FPL%."""
    pct = get_applicable_percentage(fpl_percent)
    return income * pct


def load_benchmark_premiums() -> pd.DataFrame:
    """
    Load Silver plan premiums and find second-lowest-cost Silver (SLCSP)
    per rating area — this is the benchmark for APTC calculation.
    """
    logger.info("Loading Plan Attributes for Silver plan identification...")
    plans = pd.read_csv(
        RAW_DIR / "plan-attributes-puf.csv",
        usecols=["StandardComponentId", "MetalLevel", "MarketCoverage", "DentalOnlyPlan"],
        low_memory=False,
    )
    silver_plans = plans[
        (plans["MetalLevel"] == "Silver")
        & (plans["MarketCoverage"] == "Individual")
        & (plans["DentalOnlyPlan"] == "No")
    ]["StandardComponentId"].unique()
    logger.info(f"  Silver medical plans: {len(silver_plans):,}")

    logger.info("Loading Rate PUF for age-40 non-tobacco premiums (chunked)...")
    silver_set = set(silver_plans)
    rate_chunks = []
    for chunk in pd.read_csv(
        RAW_DIR / "rate-puf.csv",
        usecols=["PlanId", "RatingAreaId", "Age", "Tobacco", "IndividualRate"],
        low_memory=False,
        chunksize=500_000,
    ):
        filtered = chunk[
            (chunk["Age"] == REFERENCE_AGE)
            & (chunk["Tobacco"].isin(["No Preference", "No Tobacco", "Tobacco User/Non-Tobacco User"]))
            & (chunk["PlanId"].isin(silver_set))
        ]
        if len(filtered) > 0:
            rate_chunks.append(filtered)
    rates = pd.concat(rate_chunks, ignore_index=True) if rate_chunks else pd.DataFrame()
    logger.info(f"  Silver age-40 rate rows: {len(rates):,}")

    # Find SLCSP (second lowest cost Silver plan) per rating area
    # Group by rating area, sort by premium, take the second cheapest
    slcsp = (
        rates.groupby("RatingAreaId")["IndividualRate"]
        .apply(lambda x: sorted(x.unique())[1] if len(x.unique()) >= 2 else x.min())
        .reset_index()
        .rename(columns={"IndividualRate": "benchmark_premium"})
    )
    logger.info(f"  SLCSP benchmarks: {len(slcsp):,} rating areas")
    return slcsp


def load_county_rating_area_map() -> pd.DataFrame:
    """Map counties to rating areas via Service Area PUF + Rate PUF join."""
    logger.info("Building county -> rating area map...")

    # Load service areas
    sa = pd.read_csv(RAW_DIR / "service-area-puf.csv", low_memory=False)
    sa = sa[(sa["MarketCoverage"] == "Individual") & (sa["DentalOnlyPlan"] == "No")]

    # Get county rows
    county_sa = sa[sa["County"].notna()].copy()
    county_sa["County"] = county_sa["County"].astype(int).astype(str).str.zfill(5)

    # For CoverEntireState, expand using known counties
    all_counties = county_sa[["StateCode", "County"]].drop_duplicates()
    state_counties = {}
    for _, row in all_counties.iterrows():
        state_counties.setdefault(row["StateCode"], set()).add(row["County"])

    entire_state = sa[sa["CoverEntireState"] == "Yes"]
    expanded = []
    for _, row in entire_state.iterrows():
        state = row["StateCode"]
        # Use PUF county rows if available, else fall back to hardcoded FIPS
        counties = state_counties.get(state, set())
        if not counties and state in COVER_ENTIRE_STATE_COUNTIES:
            counties = set(COVER_ENTIRE_STATE_COUNTIES[state])
            logger.info(f"  Using fallback FIPS for {state}: {len(counties)} counties")
        for county in counties:
            expanded.append({
                "StateCode": state,
                "IssuerId": row["IssuerId"],
                "ServiceAreaId": row["ServiceAreaId"],
                "County": county,
            })

    if expanded:
        expanded_df = pd.DataFrame(expanded)
        county_sa = pd.concat(
            [county_sa[["StateCode", "IssuerId", "ServiceAreaId", "County"]], expanded_df],
            ignore_index=True,
        ).drop_duplicates()

    # Now map ServiceAreaId+IssuerId -> RatingAreaId via Rate PUF
    # Load plans to get IssuerId -> ServiceAreaId -> StandardComponentId
    plans = pd.read_csv(
        RAW_DIR / "plan-attributes-puf.csv",
        usecols=["StandardComponentId", "IssuerId", "ServiceAreaId", "MarketCoverage", "DentalOnlyPlan"],
        low_memory=False,
    )
    plans = plans[(plans["MarketCoverage"] == "Individual") & (plans["DentalOnlyPlan"] == "No")]

    # Get rating area per plan from rates (chunked to avoid OOM)
    logger.info("  Loading Rate PUF for rating area mapping (chunked)...")
    rate_chunks = []
    for chunk in pd.read_csv(
        RAW_DIR / "rate-puf.csv",
        usecols=["PlanId", "RatingAreaId"],
        low_memory=False,
        chunksize=500_000,
    ):
        rate_chunks.append(chunk.drop_duplicates())
    rates = pd.concat(rate_chunks, ignore_index=True).drop_duplicates() if rate_chunks else pd.DataFrame()

    # Join: plans -> rates to get ServiceAreaId -> RatingAreaId
    plan_ratings = plans.merge(
        rates,
        left_on="StandardComponentId",
        right_on="PlanId",
        how="inner",
    )[["IssuerId", "ServiceAreaId", "RatingAreaId"]].drop_duplicates()

    # Join: county -> service area -> rating area
    county_ratings = county_sa.merge(
        plan_ratings,
        on=["IssuerId", "ServiceAreaId"],
        how="inner",
    )[["StateCode", "County", "RatingAreaId"]].drop_duplicates()

    logger.info(f"  County-rating area mappings: {len(county_ratings):,}")
    return county_ratings


def build_subsidy_engine() -> list[dict[str, Any]]:
    """Build county-level subsidy estimates at various FPL levels."""
    slcsp = load_benchmark_premiums()
    county_map = load_county_rating_area_map()

    # Join counties to their SLCSP benchmark
    county_benchmarks = county_map.merge(slcsp, on="RatingAreaId", how="inner")

    # Deduplicate: if a county has multiple rating areas, take the most common benchmark
    # (some counties span rating areas — use the average)
    county_avg = (
        county_benchmarks.groupby(["StateCode", "County"])
        .agg(benchmark_premium=("benchmark_premium", "mean"))
        .reset_index()
    )
    logger.info(f"Counties with benchmarks: {len(county_avg):,}")

    # Calculate subsidies at each FPL level for a single adult (household_size=1)
    records: list[dict[str, Any]] = []
    for _, row in county_avg.iterrows():
        state = row["StateCode"]
        county_fips = row["County"]
        benchmark = round(float(row["benchmark_premium"]), 2)
        fpl_base = get_fpl(state, household_size=1)

        subsidy_estimates: dict[str, Any] = {}
        for fpl_pct in FPL_PERCENTAGES:
            income = fpl_base * (fpl_pct / 100)
            applicable_pct = get_applicable_percentage(fpl_pct)
            monthly_contribution = round((income * applicable_pct) / 12, 2)
            monthly_aptc = round(max(0, benchmark - monthly_contribution), 2)
            net_premium = round(benchmark - monthly_aptc, 2)

            subsidy_estimates[f"fpl_{fpl_pct}"] = {
                "fpl_percent": fpl_pct,
                "annual_income": round(income, 0),
                "applicable_percentage": applicable_pct,
                "monthly_contribution": monthly_contribution,
                "monthly_aptc": monthly_aptc,
                "net_monthly_premium": net_premium,
            }

        records.append({
            "state_code": state,
            "county_fips": county_fips,
            "benchmark_silver_premium": benchmark,
            "fpl_base": fpl_base,
            "household_size": 1,
            "reference_age": int(REFERENCE_AGE),
            "subsidy_estimates": subsidy_estimates,
        })

    logger.info(f"Built {len(records):,} county subsidy records")
    return records


def validate(records: list[dict[str, Any]]) -> None:
    """Validate subsidy calculations."""
    logger.info("Validating subsidy output...")
    assert len(records) > 0, "No records produced"

    for r in records[:50]:
        benchmark = r["benchmark_silver_premium"]
        assert benchmark > 0, f"Invalid benchmark: {benchmark}"
        assert benchmark < 5000, f"Benchmark too high: {benchmark}"

        for key, est in r["subsidy_estimates"].items():
            aptc = est["monthly_aptc"]
            contrib = est["monthly_contribution"]
            net = est["net_monthly_premium"]
            # APTC should not exceed benchmark
            assert aptc <= benchmark + 0.01, f"APTC {aptc} > benchmark {benchmark}"
            # Net premium should be non-negative
            assert net >= -0.01, f"Negative net premium: {net}"
            # When APTC > 0: contribution + aptc should equal benchmark
            # When APTC = 0: contribution exceeds benchmark (no subsidy needed)
            if aptc > 0:
                assert abs((contrib + aptc) - benchmark) < 0.02, (
                    f"Math error: {contrib} + {aptc} != {benchmark}"
                )

    states = set(r["state_code"] for r in records)
    logger.info(f"  States: {len(states)}")
    logger.info(f"  Counties: {len(records)}")
    logger.info(f"  Avg benchmark: ${sum(r['benchmark_silver_premium'] for r in records)/len(records):.2f}")
    logger.info("  Validation passed")


def save(records: list[dict[str, Any]]) -> Path:
    """Save with metadata wrapper."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output = {
        "metadata": {
            "source": "CMS PUF (Rate + Plan Attributes + Service Area) + HHS FPL 2025",
            "plan_year": 2026,
            "fpl_year": 2025,
            "record_count": len(records),
            "fpl_percentages_calculated": FPL_PERCENTAGES,
            "household_size": 1,
            "reference_age": int(REFERENCE_AGE),
            "subsidy_model": "IRA Enhanced Credits (assumed extended for 2026)",
            "generated_at": pd.Timestamp.now().isoformat(),
            "schema_version": "1.0",
            "disclaimer": "Estimates only. Actual APTC depends on household size, age, income, and plan availability. Consult a licensed agent.",
        },
        "data": records,
    }
    outpath = PROCESSED_DIR / "subsidy_engine.json"
    with open(outpath, "w") as f:
        json.dump(output, f, indent=2, default=str)
    logger.info(f"Saved {len(records):,} records to {outpath}")
    return outpath


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    records = build_subsidy_engine()
    validate(records)
    outpath = save(records)

    print(f"\nSaved {len(records):,} records to {outpath}")
    print("\nSample record:")
    print(json.dumps(records[0], indent=2, default=str))


if __name__ == "__main__":
    main()
