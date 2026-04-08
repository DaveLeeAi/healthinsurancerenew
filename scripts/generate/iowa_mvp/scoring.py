"""
iowa_mvp/scoring.py — Python reference implementation of the Iowa plan-fit scoring engine.

This mirrors the TypeScript scoring engine in lib/iowa-mvp/scoring.ts.
Used for testing, validation, and offline analysis.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any

# ---------------------------------------------------------------------------
# ACA age rating factors (age 40 = 1.0)
# ---------------------------------------------------------------------------

AGE_FACTORS: dict[int, float] = {
    21: 0.6350, 22: 0.6350, 23: 0.6350, 24: 0.6350,
    25: 0.6604, 26: 0.6604, 27: 0.7929,
    28: 0.7929, 29: 0.7929, 30: 0.8575,
    31: 0.8778, 32: 0.8981, 33: 0.9183,
    34: 0.9386, 35: 0.9588, 36: 0.9791,
    37: 0.9993, 38: 1.0000, 39: 1.0000,
    40: 1.0000, 41: 1.0508, 42: 1.0508,
    43: 1.1016, 44: 1.1016, 45: 1.1524,
    46: 1.2032, 47: 1.2540, 48: 1.3199,
    49: 1.3199, 50: 1.3199, 51: 1.3858,
    52: 1.4516, 53: 1.5175, 54: 1.5882,
    55: 1.6590, 56: 1.7298, 57: 1.8006,
    58: 1.8714, 59: 1.9422, 60: 1.7452,
    61: 1.7452, 62: 1.7452, 63: 1.7452,
    64: 2.0160,
}

FPL_BASE_2026 = 15650


@dataclass
class ScoreDimension:
    name: str
    score: int
    weight: float
    reason: str


@dataclass
class DrugMatch:
    drug_name: str
    found: bool
    tier: str | None
    prior_authorization: bool
    quantity_limit: bool
    step_therapy: bool
    carrier_verified: bool
    notes: str


@dataclass
class PlanScore:
    plan_id: str
    plan_name: str
    issuer_name: str
    metal_level: str
    plan_type: str
    monthly_premium: float | None
    estimated_aptc: float
    net_premium: float | None
    deductible: int | None
    moop: int | None
    overall_score: int
    dimensions: list[ScoreDimension]
    drug_matches: list[DrugMatch]


def estimate_premium_for_age(premiums: dict[str, float], age: int) -> float | None:
    """Interpolate monthly premium for a specific age."""
    key = f"age_{age}"
    if key in premiums and premiums[key] is not None:
        return premiums[key]

    brackets = [
        (21, "age_21"), (27, "age_27"), (30, "age_30"),
        (40, "age_40"), (50, "age_50"), (60, "age_60"), (64, "age_64"),
    ]
    nearest = None
    min_dist = 999
    for bracket_age, bracket_key in brackets:
        if bracket_key in premiums and premiums[bracket_key] is not None:
            dist = abs(age - bracket_age)
            if dist < min_dist:
                min_dist = dist
                nearest = (bracket_age, premiums[bracket_key])

    if nearest is None:
        return None

    clamped = max(21, min(64, age))
    nearest_factor = AGE_FACTORS.get(nearest[0], 1.0)
    target_factor = AGE_FACTORS.get(clamped, 1.0)
    if nearest_factor == 0:
        return None
    return round(nearest[1] * (target_factor / nearest_factor))


def estimate_subsidy(
    premium: float,
    income: float,
    household_size: int,
    subsidy_record: dict[str, Any] | None,
) -> dict[str, Any]:
    """Estimate APTC and net premium."""
    fpl_threshold = FPL_BASE_2026 * household_size
    fpl_pct = round((income / fpl_threshold) * 100)

    if fpl_pct > 400 or subsidy_record is None:
        return {
            "monthly_aptc": 0,
            "net_premium": premium,
            "fpl_percent": fpl_pct,
            "subsidy_eligible": False,
        }

    tiers = [150, 200, 250, 300, 400]
    closest = min(tiers, key=lambda t: abs(fpl_pct - t))
    tier_key = f"fpl_{closest}"
    tier_data = subsidy_record.get("subsidy_estimates", {}).get(tier_key)
    if not tier_data:
        return {
            "monthly_aptc": 0,
            "net_premium": premium,
            "fpl_percent": fpl_pct,
            "subsidy_eligible": False,
        }

    ap = tier_data["applicable_percentage"]
    contribution = (income * ap) / 12
    benchmark = subsidy_record["benchmark_silver_premium"]
    aptc = max(0, benchmark - contribution)
    net = max(0, premium - aptc)

    return {
        "monthly_aptc": round(aptc),
        "net_premium": round(net),
        "fpl_percent": fpl_pct,
        "subsidy_eligible": aptc > 0,
    }


def match_drugs(
    user_meds: list[str],
    formulary_drugs: list[dict],
    carrier_name: str,
) -> list[DrugMatch]:
    """Match user medications against formulary."""
    is_oscar = carrier_name == "Oscar Insurance Company"
    results = []

    for med in user_meds:
        norm = med.lower().strip()
        if not is_oscar:
            results.append(DrugMatch(
                drug_name=med, found=False, tier=None,
                prior_authorization=False, quantity_limit=False, step_therapy=False,
                carrier_verified=False,
                notes=f"Drug coverage data not available for {carrier_name}.",
            ))
            continue

        match = None
        for d in formulary_drugs:
            dname = (d.get("drug_name") or "").lower().strip()
            if dname == norm or norm in dname or dname in norm:
                match = d
                if dname == norm:
                    break  # exact match, stop

        if not match:
            results.append(DrugMatch(
                drug_name=med, found=False, tier=None,
                prior_authorization=False, quantity_limit=False, step_therapy=False,
                carrier_verified=True,
                notes="Not found in Oscar Iowa formulary.",
            ))
        else:
            pa = match.get("pa") in (True, "Y", "Yes")
            ql = match.get("ql") in (True, "Y", "Yes")
            st = match.get("st") in (True, "Y", "Yes")
            results.append(DrugMatch(
                drug_name=med, found=True,
                tier=str(match.get("tier")) if match.get("tier") is not None else None,
                prior_authorization=pa, quantity_limit=ql, step_therapy=st,
                carrier_verified=True,
                notes="Found in Oscar Iowa formulary.",
            ))

    return results


def score_plan(
    plan: dict[str, Any],
    age: int,
    income: float,
    household_size: int,
    expected_usage: str,
    budget_preference: str,
    plan_type_pref: str,
    medications: list[str],
    subsidy_record: dict[str, Any] | None,
    formulary_drugs: list[dict],
) -> PlanScore:
    """Score a single plan against user profile."""
    premium = estimate_premium_for_age(plan.get("premiums", {}), age)
    sub_est = estimate_subsidy(premium or 0, income, household_size, subsidy_record) if premium else {
        "monthly_aptc": 0, "net_premium": None, "fpl_percent": 0, "subsidy_eligible": False
    }

    drug_matches = match_drugs(medications, formulary_drugs, plan.get("issuer_name", ""))

    dimensions: list[ScoreDimension] = []

    # Affordability
    net = sub_est.get("net_premium")
    if net is not None and net > 0:
        share = (net * 12) / income if income > 0 else 1
        if share <= 0.02: aff = 100
        elif share <= 0.04: aff = 90
        elif share <= 0.06: aff = 80
        elif share <= 0.085: aff = 70
        elif share <= 0.10: aff = 55
        elif share <= 0.15: aff = 40
        else: aff = 20
        w = 0.35 if budget_preference == "lowest_premium" else 0.25
        dimensions.append(ScoreDimension("Affordability", aff, w, f"Net premium ~${net}/mo"))
    else:
        dimensions.append(ScoreDimension("Affordability", 50, 0.25, "Premium data unavailable"))

    # Deductible
    ded = plan.get("deductible_individual")
    if ded is not None:
        if expected_usage == "high":
            if ded <= 1000: ds = 95
            elif ded <= 2500: ds = 80
            elif ded <= 5000: ds = 55
            elif ded <= 7000: ds = 35
            else: ds = 15
        elif expected_usage == "moderate":
            if ded <= 2000: ds = 90
            elif ded <= 4000: ds = 75
            elif ded <= 6000: ds = 55
            else: ds = 35
        else:
            if ded <= 3000: ds = 85
            elif ded <= 6000: ds = 70
            elif ded <= 8000: ds = 60
            else: ds = 50
        dimensions.append(ScoreDimension("Deductible Fit", ds, 0.20 if expected_usage != "high" else 0.25, f"Deductible: ${ded:,}"))
    else:
        dimensions.append(ScoreDimension("Deductible Fit", 50, 0.20, "Deductible data unavailable"))

    # MOOP
    moop = plan.get("oop_max_individual")
    if moop is not None:
        if moop <= 3000: ms = 95
        elif moop <= 5000: ms = 85
        elif moop <= 7000: ms = 70
        elif moop <= 8500: ms = 55
        else: ms = 40
        w = 0.25 if budget_preference == "lowest_risk" else 0.15
        dimensions.append(ScoreDimension("MOOP Protection", ms, w, f"MOOP: ${moop:,}"))
    else:
        dimensions.append(ScoreDimension("MOOP Protection", 50, 0.15, "MOOP data unavailable"))

    # Drug fit
    if drug_matches:
        found = sum(1 for d in drug_matches if d.found)
        verified = sum(1 for d in drug_matches if d.carrier_verified)
        if verified == 0:
            drug_score = 40
        else:
            drug_score = round((found / len(drug_matches)) * 90)
        dimensions.append(ScoreDimension("Drug Fit", drug_score, 0.20, f"{found}/{len(drug_matches)} found"))
    else:
        dimensions.append(ScoreDimension("Drug Fit", 70, 0.10, "No medications specified"))

    # Plan type
    if plan_type_pref != "no_preference":
        pt_match = plan.get("plan_type") == plan_type_pref
        dimensions.append(ScoreDimension("Plan Type", 95 if pt_match else 45, 0.10, f"{plan.get('plan_type')} plan"))
    else:
        dimensions.append(ScoreDimension("Plan Type", 70, 0.05, "No preference"))

    # Overall
    total_w = sum(d.weight for d in dimensions)
    overall = round(sum(d.score * d.weight for d in dimensions) / total_w) if total_w > 0 else 50

    return PlanScore(
        plan_id=plan["plan_id"],
        plan_name=plan.get("plan_name", plan["plan_id"]),
        issuer_name=plan.get("issuer_name", ""),
        metal_level=plan.get("metal_level", ""),
        plan_type=plan.get("plan_type", ""),
        monthly_premium=premium,
        estimated_aptc=sub_est.get("monthly_aptc", 0),
        net_premium=sub_est.get("net_premium"),
        deductible=ded,
        moop=moop,
        overall_score=overall,
        dimensions=dimensions,
        drug_matches=drug_matches,
    )


def score_all_plans(
    dataset: dict[str, Any],
    county_fips: str,
    age: int,
    income: float,
    household_size: int = 1,
    expected_usage: str = "moderate",
    budget_preference: str = "balanced",
    plan_type_pref: str = "no_preference",
    medications: list[str] | None = None,
) -> list[PlanScore]:
    """Score all plans available in a county. Returns sorted list (best first)."""
    meds = medications or []
    available = [p for p in dataset["plans"] if county_fips in p.get("counties_served", [])]

    # Exclude catastrophic for age >= 30
    if age >= 30:
        available = [p for p in available if p.get("metal_level") != "Catastrophic"]

    subsidy = None
    for s in dataset.get("subsidies", []):
        if s.get("county_fips") == county_fips:
            subsidy = s
            break

    formulary_drugs = dataset.get("formulary", {}).get("drugs", [])

    scored = [
        score_plan(p, age, income, household_size, expected_usage, budget_preference,
                   plan_type_pref, meds, subsidy, formulary_drugs)
        for p in available
    ]

    scored.sort(key=lambda s: (-s.overall_score, s.net_premium or float("inf")))
    return scored
