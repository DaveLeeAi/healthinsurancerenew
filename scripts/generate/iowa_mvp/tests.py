#!/usr/bin/env python3
"""
iowa_mvp/tests.py — Tests for the Iowa MVP scoring engine and guardrails.

Run: python scripts/generate/iowa_mvp/tests.py
"""

import json
import sys
from pathlib import Path

# Add this directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent))

from scoring import (
    estimate_premium_for_age,
    estimate_subsidy,
    match_drugs,
    score_plan,
    score_all_plans,
)
from guardrails import (
    validate_text,
    is_text_safe,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "processed"

PASSED = 0
FAILED = 0


def assert_true(condition: bool, description: str) -> None:
    global PASSED, FAILED
    if condition:
        PASSED += 1
        print(f"  PASS: {description}")
    else:
        FAILED += 1
        print(f"  FAIL: {description}")


def assert_equal(actual: object, expected: object, description: str) -> None:
    assert_true(actual == expected, f"{description} (got {actual}, expected {expected})")


def assert_in_range(value: float | int, low: float, high: float, description: str) -> None:
    assert_true(low <= value <= high, f"{description} (got {value}, expected {low}–{high})")


# ---------------------------------------------------------------------------
# Load dataset
# ---------------------------------------------------------------------------

def load_dataset() -> dict:
    path = DATA_DIR / "iowa_mvp_plans.json"
    if not path.exists():
        print(f"ERROR: Dataset not found at {path}")
        print("Run: python scripts/generate/build_iowa_mvp.py")
        sys.exit(1)
    with open(path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Test: Premium interpolation
# ---------------------------------------------------------------------------

def test_premium_interpolation() -> None:
    print("\n--- Premium Interpolation ---")

    premiums = {"age_21": 280, "age_27": 294, "age_40": 358, "age_50": 500, "age_64": 841}

    # Direct match
    p40 = estimate_premium_for_age(premiums, 40)
    assert_equal(p40, 358, "Age 40 direct match")

    # Interpolated age 35
    p35 = estimate_premium_for_age(premiums, 35)
    assert_true(p35 is not None, "Age 35 interpolation returns a value")
    assert_in_range(p35, 300, 400, "Age 35 interpolated premium")

    # Interpolated age 55
    p55 = estimate_premium_for_age(premiums, 55)
    assert_true(p55 is not None, "Age 55 interpolation returns a value")
    assert_in_range(p55, 500, 700, "Age 55 interpolated premium")

    # Empty premiums
    p_empty = estimate_premium_for_age({}, 40)
    assert_true(p_empty is None, "Empty premiums returns None")


# ---------------------------------------------------------------------------
# Test: Subsidy estimation
# ---------------------------------------------------------------------------

def test_subsidy_estimation() -> None:
    print("\n--- Subsidy Estimation ---")

    subsidy_record = {
        "benchmark_silver_premium": 432.8,
        "subsidy_estimates": {
            "fpl_150": {"applicable_percentage": 0.0},
            "fpl_200": {"applicable_percentage": 0.02},
            "fpl_250": {"applicable_percentage": 0.04},
            "fpl_300": {"applicable_percentage": 0.06},
            "fpl_400": {"applicable_percentage": 0.085},
        },
    }

    # 200% FPL single
    est = estimate_subsidy(358, 31300, 1, subsidy_record)
    assert_true(est["subsidy_eligible"], "200% FPL is subsidy eligible")
    assert_true(est["monthly_aptc"] > 0, "200% FPL has positive APTC")
    assert_true(est["net_premium"] < 358, "Net premium is less than full premium")

    # Above 400% FPL
    est_high = estimate_subsidy(358, 100000, 1, subsidy_record)
    assert_true(not est_high["subsidy_eligible"], "Above 400% FPL is not eligible")
    assert_equal(est_high["monthly_aptc"], 0, "No APTC above cliff")

    # No subsidy record
    est_none = estimate_subsidy(358, 31300, 1, None)
    assert_true(not est_none["subsidy_eligible"], "No subsidy record = not eligible")


# ---------------------------------------------------------------------------
# Test: Drug matching
# ---------------------------------------------------------------------------

def test_drug_matching() -> None:
    print("\n--- Drug Matching ---")

    dataset = load_dataset()
    drugs = dataset["formulary"]["drugs"]

    # Oscar carrier — should search formulary
    matches = match_drugs(["metformin"], drugs, "Oscar Insurance Company")
    assert_equal(len(matches), 1, "One drug searched")

    # Non-Oscar carrier — should flag as unverified
    matches_unk = match_drugs(["metformin"], drugs, "Wellmark Health Plan of Iowa, Inc.")
    assert_equal(len(matches_unk), 1, "One drug searched for Wellmark")
    assert_true(not matches_unk[0].carrier_verified, "Wellmark drug not carrier-verified")

    # Empty medications
    matches_empty = match_drugs([], drugs, "Oscar Insurance Company")
    assert_equal(len(matches_empty), 0, "No drugs = no matches")


# ---------------------------------------------------------------------------
# Test: County filtering
# ---------------------------------------------------------------------------

def test_county_filtering() -> None:
    print("\n--- County Filtering ---")

    dataset = load_dataset()

    # Polk County (Des Moines) — FIPS 19153
    polk_plans = [p for p in dataset["plans"] if "19153" in p.get("counties_served", [])]
    assert_true(len(polk_plans) > 0, f"Polk County has plans ({len(polk_plans)} found)")

    # Check that all carriers are present
    carriers = set(p["issuer_name"] for p in polk_plans)
    assert_true(len(carriers) >= 3, f"Multiple carriers in Polk County ({len(carriers)} found)")

    # Invalid FIPS
    fake_plans = [p for p in dataset["plans"] if "99999" in p.get("counties_served", [])]
    assert_equal(len(fake_plans), 0, "Invalid FIPS returns no plans")


# ---------------------------------------------------------------------------
# Test: Plan scoring
# ---------------------------------------------------------------------------

def test_plan_scoring() -> None:
    print("\n--- Plan Scoring ---")

    dataset = load_dataset()

    results = score_all_plans(
        dataset,
        county_fips="19153",  # Polk County
        age=40,
        income=45000,
        household_size=1,
        expected_usage="moderate",
        budget_preference="balanced",
        medications=["metformin"],
    )

    assert_true(len(results) > 0, f"Got {len(results)} scored plans for Polk County")

    # Scores should be 0-100
    for r in results:
        assert_in_range(r.overall_score, 0, 100, f"Score for {r.plan_id}")

    # Should be sorted descending
    for i in range(len(results) - 1):
        assert_true(
            results[i].overall_score >= results[i + 1].overall_score
            or (results[i].overall_score == results[i + 1].overall_score),
            f"Plans sorted descending at position {i}",
        )

    # Top plan should have dimensions
    top = results[0]
    assert_true(len(top.dimensions) >= 4, f"Top plan has {len(top.dimensions)} dimensions")

    # Score with high usage should rank lower-deductible plans higher
    results_high = score_all_plans(
        dataset, county_fips="19153", age=40, income=45000,
        expected_usage="high", budget_preference="lowest_risk",
    )
    results_low = score_all_plans(
        dataset, county_fips="19153", age=40, income=45000,
        expected_usage="low", budget_preference="lowest_premium",
    )
    # Different preferences should produce different rankings
    if len(results_high) > 1 and len(results_low) > 1:
        assert_true(
            results_high[0].plan_id != results_low[0].plan_id
            or results_high[0].overall_score != results_low[0].overall_score,
            "Different usage/budget preferences produce different results",
        )


# ---------------------------------------------------------------------------
# Test: Guardrails — guarantee language
# ---------------------------------------------------------------------------

def test_guardrail_guarantees() -> None:
    print("\n--- Guardrails: Guarantee Language ---")

    assert_true(not is_text_safe("This plan is guaranteed to cover your drugs."), "Catches 'guaranteed'")
    assert_true(not is_text_safe("You will definitely be covered."), "Catches 'definitely covered'")  # 'definitely covered' isn't exact but related
    assert_true(not is_text_safe("We guarantee you will save money."), "Catches 'we guarantee'")
    assert_true(not is_text_safe("You will be approved for this plan."), "Catches 'you will be approved'")
    assert_true(not is_text_safe("Rest assured this is the right choice."), "Catches 'assured'")
    assert_true(is_text_safe("This plan may be a good fit based on available data."), "Allows cautious language")
    assert_true(is_text_safe("Based on plan data, this appears to match your needs."), "Allows grounded language")


# ---------------------------------------------------------------------------
# Test: Guardrails — enrollment advice
# ---------------------------------------------------------------------------

def test_guardrail_enrollment() -> None:
    print("\n--- Guardrails: Enrollment Advice ---")

    assert_true(not is_text_safe("You should enroll in this plan."), "Catches 'you should enroll'")
    assert_true(not is_text_safe("Apply now to get covered!"), "Catches 'apply now'")
    assert_true(not is_text_safe("Enroll now for the best rates."), "Catches 'enroll now'")
    assert_true(not is_text_safe("This is the best plan for you."), "Catches 'the best plan for you'")
    assert_true(not is_text_safe("Sign up today before it's too late!"), "Catches 'sign up today'")
    assert_true(is_text_safe("Consider reviewing this plan on HealthCare.gov."), "Allows review suggestion")
    assert_true(is_text_safe("Talk to a licensed agent before making a decision."), "Allows agent referral")


# ---------------------------------------------------------------------------
# Test: Guardrails — discriminatory language
# ---------------------------------------------------------------------------

def test_guardrail_discrimination() -> None:
    print("\n--- Guardrails: Discriminatory Language ---")

    assert_true(not is_text_safe("People like you should settle for a basic plan."), "Catches 'people like you should'")
    assert_true(not is_text_safe("Based on your neighborhood, you only need bronze."), "Catches 'based on your neighborhood'")
    assert_true(not is_text_safe("You deserve a lower-tier plan."), "Catches 'you deserve'")
    assert_true(not is_text_safe("Lower-income people should accept basic coverage."), "Catches 'lower-income should accept'")
    assert_true(is_text_safe("Based on your stated preferences, these plans may fit."), "Allows preference-based")


# ---------------------------------------------------------------------------
# Test: Guardrails — unsupported claims
# ---------------------------------------------------------------------------

def test_guardrail_unsupported() -> None:
    print("\n--- Guardrails: Unsupported Claims ---")

    assert_true(not is_text_safe("Your doctor is in network for this plan."), "Catches provider claim")
    assert_true(not is_text_safe("Your exact cost will be $200 per month."), "Catches exact cost claim")
    assert_true(not is_text_safe("Your subsidy will be exactly $300."), "Catches exact subsidy claim")
    assert_true(is_text_safe("Estimated net premium based on available data: $200/mo."), "Allows estimates")


# ---------------------------------------------------------------------------
# Test: Safe fallback for incomplete data
# ---------------------------------------------------------------------------

def test_safe_fallback() -> None:
    print("\n--- Safe Fallback ---")

    dataset = load_dataset()

    # Score with no plans in a fake county
    results = score_all_plans(
        dataset, county_fips="99999", age=40, income=45000,
    )
    assert_equal(len(results), 0, "No plans for invalid county")

    # Score with missing medication (shouldn't crash)
    results = score_all_plans(
        dataset, county_fips="19153", age=40, income=45000,
        medications=["nonexistent_drug_xyz_12345"],
    )
    assert_true(len(results) > 0, "Still returns plans even with unknown drug")
    top = results[0]
    not_found = [d for d in top.drug_matches if not d.found]
    # For non-Oscar carriers, drug won't be verified; for Oscar, won't be found
    assert_true(len(not_found) > 0 or any(not d.carrier_verified for d in top.drug_matches),
                "Unknown drug flagged correctly")


# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("Iowa MVP Scoring Engine — Test Suite")
    print("=" * 60)

    test_premium_interpolation()
    test_subsidy_estimation()
    test_drug_matching()
    test_county_filtering()
    test_plan_scoring()
    test_guardrail_guarantees()
    test_guardrail_enrollment()
    test_guardrail_discrimination()
    test_guardrail_unsupported()
    test_safe_fallback()

    print("\n" + "=" * 60)
    print(f"Results: {PASSED} passed, {FAILED} failed")
    print("=" * 60)

    sys.exit(1 if FAILED > 0 else 0)
