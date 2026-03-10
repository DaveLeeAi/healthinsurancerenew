"""
build_policy_scenarios.py — Pillar 10: Regulatory Risk & Policy Scenarios

Calculates enhanced credit expiration impact for every county in subsidy_engine.json.
For each county × age × FPL level combination, computes:
  - Premium with enhanced IRA credits (current law through 2025)
  - Premium without enhanced credits (pre-ARP / cliff restoration)
  - Dollar and percentage increase at expiration

IRA Enhanced Credits (2021–2025 temporary):
  - Extends APTC eligibility above 400% FPL (no cliff)
  - Caps max contribution at 8.5% of income at all FPL levels
  - Reduces contribution percentages at lower FPL brackets vs pre-ARP

Pre-ARP Applicable Percentages (26 U.S.C. § 36B, pre-ARP):
  FPL 100–133%: 2.07%
  FPL 133–150%: 3.09–4.07%
  FPL 150–200%: 4.07–6.31%
  FPL 200–250%: 6.31–8.10%
  FPL 250–300%: 8.10–9.83%
  FPL 300–400%: 9.83–9.83%
  FPL 400%+:    NO subsidy (hard cliff)

IRA Enhanced Applicable Percentages (2022–2025):
  FPL 100–133%: 0.00%
  FPL 133–150%: 0.00–2.00%
  FPL 150–200%: 2.00%
  FPL 200–250%: 2.00–4.00%
  FPL 250–300%: 4.00–6.00%
  FPL 300–400%: 6.00–8.50%
  FPL 400%+:    8.50% (cap, no cliff)

Output: data/processed/policy_scenarios.json
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "data" / "processed"
SUBSIDY_PATH = PROCESSED / "subsidy_engine.json"
OUT_PATH = PROCESSED / "policy_scenarios.json"

# ---------------------------------------------------------------------------
# Age rating factors relative to age 40 baseline
# Source: 45 CFR § 147.102 / CMS age curve
# ---------------------------------------------------------------------------
AGE_FACTORS: dict[int, float] = {
    21: 1.000 / 1.444,   # 0.6925
    27: 1.145 / 1.444,   # 0.7929
    30: 1.201 / 1.444,   # 0.8318
    40: 1.444 / 1.444,   # 1.0000
    50: 1.906 / 1.444,   # 1.3199
    60: 2.520 / 1.444,   # 1.7452
    64: 2.911 / 1.444,   # 2.0160
}

# Ages to model
TARGET_AGES: list[int] = [27, 40, 50, 60, 64]

# FPL levels to model (as percentages, e.g. 150 = 150%)
TARGET_FPL_LEVELS: list[int] = [150, 200, 250, 300, 400, 500]

# ---------------------------------------------------------------------------
# Applicable percentage tables
# Each entry: (fpl_lower, fpl_upper, rate_lower, rate_upper)
# Interpolate linearly between brackets.
# Source: IRS Rev. Proc. 2024-35 (IRA enhanced) vs. § 36B pre-ARP table
# ---------------------------------------------------------------------------

# Pre-ARP (cliff at 400% FPL)
PRE_ARP_TABLE: list[tuple[int, int, float, float]] = [
    (100, 133, 0.0207, 0.0207),
    (133, 150, 0.0207, 0.0407),
    (150, 200, 0.0407, 0.0631),
    (200, 250, 0.0631, 0.0810),
    (250, 300, 0.0810, 0.0983),
    (300, 400, 0.0983, 0.0983),
    # 400%+ → no subsidy
]

# IRA Enhanced (2022–2025, temporary)
IRA_TABLE: list[tuple[int, int, float, float]] = [
    (100, 133, 0.000, 0.000),
    (133, 150, 0.000, 0.020),
    (150, 200, 0.020, 0.020),
    (200, 250, 0.020, 0.040),
    (250, 300, 0.040, 0.060),
    (300, 400, 0.060, 0.085),
    (400, 9999, 0.085, 0.085),   # no cliff — capped at 8.5%
]


def _interpolate_rate(fpl_pct: int, table: list[tuple[int, int, float, float]]) -> float:
    """
    Return the applicable percentage (0–1) for a given FPL% from a bracket table.
    Returns 0.0 if FPL is below 100% or above the table's upper bound.
    """
    for lo, hi, rate_lo, rate_hi in table:
        if lo <= fpl_pct < hi:
            span = hi - lo
            if span == 0:
                return rate_lo
            frac = (fpl_pct - lo) / span
            return rate_lo + frac * (rate_hi - rate_lo)
    # Check exact match on upper boundary of last bracket
    if table and fpl_pct >= table[-1][1] and table[-1][1] == 9999:
        return table[-1][3]
    return 0.0  # above cliff → no subsidy


def _calc_aptc(
    benchmark_premium_age40: float,
    age: int,
    fpl_pct: int,
    fpl_base: float,
    table: list[tuple[int, int, float, float]],
) -> dict[str, float]:
    """
    Calculate APTC, net premium, and full premium for a given scenario.

    Returns dict with:
      full_premium:   unsubsidized benchmark premium at this age
      applicable_pct: max contribution % of income
      contribution:   monthly out-of-pocket contribution
      aptc:           Advanced Premium Tax Credit (monthly)
      net_premium:    premium after APTC (floored at $0)
    """
    age_factor = AGE_FACTORS.get(age, 1.0)
    full_monthly = round(benchmark_premium_age40 * age_factor, 2)
    annual_income = round(fpl_base * (fpl_pct / 100), 2)
    applicable_pct = _interpolate_rate(fpl_pct, table)
    monthly_contribution = round(annual_income * applicable_pct / 12, 2)

    # APTC = benchmark - contribution (floored at $0)
    aptc = max(0.0, full_monthly - monthly_contribution)
    # Net premium floored at $0
    net_monthly = max(0.0, full_monthly - aptc)

    return {
        "full_monthly_premium": full_monthly,
        "applicable_percentage": round(applicable_pct * 100, 3),
        "monthly_contribution": monthly_contribution,
        "monthly_aptc": round(aptc, 2),
        "net_monthly_premium": round(net_monthly, 2),
        "annual_aptc": round(aptc * 12, 2),
        "annual_net_cost": round(net_monthly * 12, 2),
    }


def build_county_scenario(record: dict[str, Any]) -> dict[str, Any]:
    """
    Build full policy scenario for one county from subsidy_engine.json record.
    """
    state = record["state_code"]
    fips = record["county_fips"]
    benchmark = record["benchmark_silver_premium"]  # age-40 rate
    fpl_base = record["fpl_base"]
    household_size = record.get("household_size", 1)

    age_scenarios: dict[str, Any] = {}

    for age in TARGET_AGES:
        fpl_scenarios: dict[str, Any] = {}

        for fpl_pct in TARGET_FPL_LEVELS:
            enhanced = _calc_aptc(benchmark, age, fpl_pct, fpl_base, IRA_TABLE)
            pre_arp = _calc_aptc(benchmark, age, fpl_pct, fpl_base, PRE_ARP_TABLE)

            # Cliff scenario: above 400% FPL loses all subsidy under pre-ARP
            cliff_applies = fpl_pct > 400

            monthly_increase = round(pre_arp["net_monthly_premium"] - enhanced["net_monthly_premium"], 2)
            annual_increase = round(monthly_increase * 12, 2)

            # Percentage increase (relative to current net cost)
            if enhanced["net_monthly_premium"] > 0:
                pct_increase = round(monthly_increase / enhanced["net_monthly_premium"] * 100, 1)
            elif monthly_increase > 0:
                pct_increase = 100.0  # Was free, now pays something
            else:
                pct_increase = 0.0

            fpl_scenarios[f"fpl_{fpl_pct}"] = {
                "fpl_percent": fpl_pct,
                "annual_income": round(fpl_base * fpl_pct / 100, 0),
                "with_enhanced_credits": enhanced,
                "without_enhanced_credits_pre_arp": pre_arp,
                "cliff_applies_pre_arp": cliff_applies,
                "expiration_impact": {
                    "monthly_premium_increase": monthly_increase,
                    "annual_premium_increase": annual_increase,
                    "percent_increase": pct_increase,
                    "impact_level": _classify_impact(annual_increase, pct_increase),
                },
            }

        age_scenarios[f"age_{age}"] = {
            "age": age,
            "age_rating_factor": round(AGE_FACTORS.get(age, 1.0), 4),
            "benchmark_premium_at_age": round(benchmark * AGE_FACTORS.get(age, 1.0), 2),
            "fpl_scenarios": fpl_scenarios,
        }

    # Headline figures: age 40, FPL 250% (typical middle-market scenario)
    headline = _build_headline(benchmark, fpl_base)

    return {
        "state_code": state,
        "county_fips": fips,
        "benchmark_silver_premium_age40": benchmark,
        "fpl_base": fpl_base,
        "household_size": household_size,
        "headline": headline,
        "age_scenarios": age_scenarios,
    }


def _classify_impact(annual_increase: float, pct_increase: float) -> str:
    """Categorize the impact level for content/SEO tiering."""
    if annual_increase <= 0:
        return "no_impact"
    if annual_increase >= 6000 or pct_increase >= 200:
        return "catastrophic"
    if annual_increase >= 3000 or pct_increase >= 100:
        return "severe"
    if annual_increase >= 1200 or pct_increase >= 50:
        return "significant"
    if annual_increase >= 600 or pct_increase >= 20:
        return "moderate"
    return "minor"


def _build_headline(benchmark_age40: float, fpl_base: float) -> dict[str, Any]:
    """
    Pre-compute headline scenario: age 40, FPL 250%.
    This is the most commonly cited comparison in consumer content.
    """
    fpl_pct = 250
    age = 40

    enhanced = _calc_aptc(benchmark_age40, age, fpl_pct, fpl_base, IRA_TABLE)
    pre_arp = _calc_aptc(benchmark_age40, age, fpl_pct, fpl_base, PRE_ARP_TABLE)

    monthly_increase = round(pre_arp["net_monthly_premium"] - enhanced["net_monthly_premium"], 2)

    return {
        "description": "Age 40, 250% FPL — Most-cited middle-market scenario",
        "age": 40,
        "fpl_percent": 250,
        "annual_income": round(fpl_base * 2.50, 0),
        "current_net_monthly_with_enhanced": enhanced["net_monthly_premium"],
        "net_monthly_without_enhanced_pre_arp": pre_arp["net_monthly_premium"],
        "monthly_increase_at_expiration": monthly_increase,
        "annual_increase_at_expiration": round(monthly_increase * 12, 2),
    }


def build_metadata(records: list[dict[str, Any]], source_count: int) -> dict[str, Any]:
    """Build output file metadata block."""
    # Aggregate headline stats
    annual_increases = [
        r["headline"]["annual_increase_at_expiration"]
        for r in records
        if r["headline"]["annual_increase_at_expiration"] > 0
    ]
    avg_increase = round(sum(annual_increases) / len(annual_increases), 2) if annual_increases else 0.0
    max_increase = round(max(annual_increases), 2) if annual_increases else 0.0

    states = sorted({r["state_code"] for r in records})

    return {
        "schema_version": "1.0",
        "pillar": 10,
        "pillar_name": "Regulatory Risk & Policy Scenarios",
        "description": (
            "Enhanced credit expiration impact: premium delta (with vs without IRA "
            "enhanced credits) for every CMS-covered county at 5 ages × 6 FPL levels."
        ),
        "plan_year": 2025,
        "source_records": source_count,
        "output_records": len(records),
        "states_covered": states,
        "state_count": len(states),
        "ages_modeled": TARGET_AGES,
        "fpl_levels_modeled": TARGET_FPL_LEVELS,
        "regulatory_basis": {
            "enhanced_credits": "American Rescue Plan Act (ARPA) § 9661, extended by IRA 2022 through 2025",
            "pre_arp_cliff": "26 U.S.C. § 36B(b)(3)(A) — applicable percentage table",
            "age_rating": "45 CFR § 147.102 — CMS standard age rating curve",
            "benchmark_premium": "Second-lowest-cost Silver plan (SLCSP) per county",
        },
        "headline_stats": {
            "avg_annual_increase_age40_fpl250": avg_increase,
            "max_annual_increase_age40_fpl250": max_increase,
            "counties_with_cliff_impact_above_400pct_fpl": sum(
                1 for r in records
                if r["age_scenarios"]["age_40"]["fpl_scenarios"]["fpl_400"]
                ["expiration_impact"]["annual_premium_increase"] > 0
            ),
        },
        "content_use": [
            "Enhanced credit expiration landing pages (per county)",
            "SEP + ARP expiration alert content",
            "Comparative cost tables by income level",
            "State-level subsidy cliff risk reports",
            "Enrollment urgency messaging",
        ],
    }


def main() -> None:
    log.info("Loading subsidy_engine.json …")
    with SUBSIDY_PATH.open("r", encoding="utf-8") as fh:
        raw_data = json.load(fh)

    subsidy_records: list[dict[str, Any]]
    if isinstance(raw_data, dict) and "data" in raw_data:
        subsidy_records = raw_data["data"]
    elif isinstance(raw_data, dict) and "records" in raw_data:
        subsidy_records = raw_data["records"]
    elif isinstance(raw_data, list):
        subsidy_records = raw_data
    else:
        log.error("Unexpected subsidy_engine.json structure")
        sys.exit(1)

    log.info("Loaded %d county records", len(subsidy_records))

    scenarios: list[dict[str, Any]] = []
    for i, record in enumerate(subsidy_records, 1):
        if i % 500 == 0:
            log.info("  Processing %d / %d …", i, len(subsidy_records))
        scenario = build_county_scenario(record)
        scenarios.append(scenario)

    log.info("Built %d county policy scenarios", len(scenarios))

    metadata = build_metadata(scenarios, len(subsidy_records))

    output = {
        "metadata": metadata,
        "records": scenarios,
    }

    log.info("Writing %s …", OUT_PATH)
    with OUT_PATH.open("w", encoding="utf-8") as fh:
        json.dump(output, fh, indent=2)

    size_mb = OUT_PATH.stat().st_size / 1_048_576
    log.info("Done — %d records, %.1f MB", len(scenarios), size_mb)

    # Print summary
    meta = output["metadata"]
    hl = meta["headline_stats"]
    log.info("─" * 60)
    log.info("States covered:          %d", meta["state_count"])
    log.info("Counties modeled:        %d", meta["output_records"])
    log.info("Ages × FPL combos/cty:  %d × %d = %d",
             len(TARGET_AGES), len(TARGET_FPL_LEVELS),
             len(TARGET_AGES) * len(TARGET_FPL_LEVELS))
    log.info("Avg annual ↑ (40/250%%): $%.0f", hl["avg_annual_increase_age40_fpl250"])
    log.info("Max annual ↑ (40/250%%): $%.0f", hl["max_annual_increase_age40_fpl250"])
    log.info("Counties w/ cliff risk:  %d", hl["counties_with_cliff_impact_above_400pct_fpl"])


if __name__ == "__main__":
    main()
