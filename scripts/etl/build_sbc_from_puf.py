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
    """Extract all SBC-relevant fields from the Plan Attributes PUF."""
    logger.info("Building SBC decoded records...")
    records: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        record: dict[str, Any] = {
            # Plan identification
            "plan_id": row["StandardComponentId"],
            "plan_variant_id": row["PlanId"],
            "plan_name": row["PlanMarketingName"],
            "issuer_id": str(int(row["IssuerId"])),
            "issuer_name": row["IssuerMarketPlaceMarketingName"],
            "state_code": row["StateCode"],
            "metal_level": row["MetalLevel"],
            "plan_type": row["PlanType"],
            "csr_variation": row["CSRVariationType"],

            # Plan design features
            "design": {
                "medical_drug_deductibles_integrated": row["MedicalDrugDeductiblesIntegrated"] == "Yes",
                "medical_drug_moop_integrated": row["MedicalDrugMaximumOutofPocketIntegrated"] == "Yes",
                "multiple_in_network_tiers": row["MultipleInNetworkTiers"] == "Yes",
                "first_tier_utilization": parse_pct(row.get("FirstTierUtilization")),
                "second_tier_utilization": parse_pct(row.get("SecondTierUtilization")),
                "is_hsa_eligible": row["IsHSAEligible"] == "Yes",
                "is_referral_required_specialist": row["IsReferralRequiredForSpecialist"] == "Yes",
                "specialist_requiring_referral": str(row["SpecialistRequiringReferral"]) if pd.notna(row.get("SpecialistRequiringReferral")) else None,
                "is_notice_required_pregnancy": row["IsNoticeRequiredForPregnancy"] == "Yes",
                "wellness_program_offered": row["WellnessProgramOffered"] == "Yes",
                "disease_management_programs": str(row["DiseaseManagementProgramsOffered"]) if pd.notna(row.get("DiseaseManagementProgramsOffered")) else None,
                "out_of_country_coverage": row["OutOfCountryCoverage"] == "Yes",
                "out_of_country_description": str(row["OutOfCountryCoverageDescription"]) if pd.notna(row.get("OutOfCountryCoverageDescription")) else None,
                "ehb_percent_premium": round(float(row["EHBPercentTotalPremium"]), 4) if pd.notna(row.get("EHBPercentTotalPremium")) else None,
                "actuarial_value": parse_pct(row.get("IssuerActuarialValue")),
                "av_calculator_output": round(float(row["AVCalculatorOutputNumber"]), 4) if pd.notna(row.get("AVCalculatorOutputNumber")) else None,
            },

            # Cost sharing triggers
            "cost_sharing_triggers": {
                "specialty_drug_max_coinsurance": parse_dollar(row.get("SpecialtyDrugMaximumCoinsurance")),
                "inpatient_copay_max_days": int(row["InpatientCopaymentMaximumDays"]) if pd.notna(row.get("InpatientCopaymentMaximumDays")) else None,
                "primary_care_cost_sharing_after_visits": int(row["BeginPrimaryCareCostSharingAfterNumberOfVisits"]) if pd.notna(row.get("BeginPrimaryCareCostSharingAfterNumberOfVisits")) else None,
                "primary_care_deductible_after_copays": int(row["BeginPrimaryCareDeductibleCoinsuranceAfterNumberOfCopays"]) if pd.notna(row.get("BeginPrimaryCareDeductibleCoinsuranceAfterNumberOfCopays")) else None,
            },

            # Deductibles — Medical EHB (MEHB)
            "deductibles": {
                "mehb_in_network_tier1": {
                    "individual": parse_dollar(row.get("MEHBDedInnTier1Individual")),
                    "family_per_person": parse_dollar(row.get("MEHBDedInnTier1FamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("MEHBDedInnTier1FamilyPerGroup")),
                    "coinsurance_pct": parse_pct(row.get("MEHBDedInnTier1Coinsurance")),
                },
                "mehb_in_network_tier2": {
                    "individual": parse_dollar(row.get("MEHBDedInnTier2Individual")),
                    "family_per_person": parse_dollar(row.get("MEHBDedInnTier2FamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("MEHBDedInnTier2FamilyPerGroup")),
                    "coinsurance_pct": parse_pct(row.get("MEHBDedInnTier2Coinsurance")),
                },
                "mehb_out_of_network": {
                    "individual": parse_dollar(row.get("MEHBDedOutOfNetIndividual")),
                    "family_per_person": parse_dollar(row.get("MEHBDedOutOfNetFamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("MEHBDedOutOfNetFamilyPerGroup")),
                },
                "mehb_combined": {
                    "individual": parse_dollar(row.get("MEHBDedCombInnOonIndividual")),
                    "family_per_person": parse_dollar(row.get("MEHBDedCombInnOonFamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("MEHBDedCombInnOonFamilyPerGroup")),
                },
                # Drug EHB (DEHB)
                "dehb_in_network_tier1": {
                    "individual": parse_dollar(row.get("DEHBDedInnTier1Individual")),
                    "family_per_person": parse_dollar(row.get("DEHBDedInnTier1FamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("DEHBDedInnTier1FamilyPerGroup")),
                    "coinsurance_pct": parse_pct(row.get("DEHBDedInnTier1Coinsurance")),
                },
                "dehb_in_network_tier2": {
                    "individual": parse_dollar(row.get("DEHBDedInnTier2Individual")),
                    "family_per_person": parse_dollar(row.get("DEHBDedInnTier2FamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("DEHBDedInnTier2FamilyPerGroup")),
                    "coinsurance_pct": parse_pct(row.get("DEHBDedInnTier2Coinsurance")),
                },
                "dehb_out_of_network": {
                    "individual": parse_dollar(row.get("DEHBDedOutOfNetIndividual")),
                    "family_per_person": parse_dollar(row.get("DEHBDedOutOfNetFamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("DEHBDedOutOfNetFamilyPerGroup")),
                },
                "dehb_combined": {
                    "individual": parse_dollar(row.get("DEHBDedCombInnOonIndividual")),
                    "family_per_person": parse_dollar(row.get("DEHBDedCombInnOonFamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("DEHBDedCombInnOonFamilyPerGroup")),
                },
                # Total EHB (TEHB = Medical + Drug combined)
                "tehb_in_network_tier1": {
                    "individual": parse_dollar(row.get("TEHBDedInnTier1Individual")),
                    "family_per_person": parse_dollar(row.get("TEHBDedInnTier1FamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("TEHBDedInnTier1FamilyPerGroup")),
                    "coinsurance_pct": parse_pct(row.get("TEHBDedInnTier1Coinsurance")),
                },
                "tehb_in_network_tier2": {
                    "individual": parse_dollar(row.get("TEHBDedInnTier2Individual")),
                    "family_per_person": parse_dollar(row.get("TEHBDedInnTier2FamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("TEHBDedInnTier2FamilyPerGroup")),
                    "coinsurance_pct": parse_pct(row.get("TEHBDedInnTier2Coinsurance")),
                },
                "tehb_out_of_network": {
                    "individual": parse_dollar(row.get("TEHBDedOutOfNetIndividual")),
                    "family_per_person": parse_dollar(row.get("TEHBDedOutOfNetFamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("TEHBDedOutOfNetFamilyPerGroup")),
                },
                "tehb_combined": {
                    "individual": parse_dollar(row.get("TEHBDedCombInnOonIndividual")),
                    "family_per_person": parse_dollar(row.get("TEHBDedCombInnOonFamilyPerPerson")),
                    "family_per_group": parse_dollar(row.get("TEHBDedCombInnOonFamilyPerGroup")),
                },
            },

            # Maximum Out-of-Pocket
            "moop": {
                # Medical EHB MOOP
                "mehb_in_network_tier1": {
                    "individual": parse_dollar(row.get("MEHBInnTier1IndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("MEHBInnTier1FamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("MEHBInnTier1FamilyPerGroupMOOP")),
                },
                "mehb_in_network_tier2": {
                    "individual": parse_dollar(row.get("MEHBInnTier2IndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("MEHBInnTier2FamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("MEHBInnTier2FamilyPerGroupMOOP")),
                },
                "mehb_out_of_network": {
                    "individual": parse_dollar(row.get("MEHBOutOfNetIndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("MEHBOutOfNetFamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("MEHBOutOfNetFamilyPerGroupMOOP")),
                },
                "mehb_combined": {
                    "individual": parse_dollar(row.get("MEHBCombInnOonIndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("MEHBCombInnOonFamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("MEHBCombInnOonFamilyPerGroupMOOP")),
                },
                # Drug EHB MOOP
                "dehb_in_network_tier1": {
                    "individual": parse_dollar(row.get("DEHBInnTier1IndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("DEHBInnTier1FamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("DEHBInnTier1FamilyPerGroupMOOP")),
                },
                "dehb_in_network_tier2": {
                    "individual": parse_dollar(row.get("DEHBInnTier2IndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("DEHBInnTier2FamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("DEHBInnTier2FamilyPerGroupMOOP")),
                },
                "dehb_out_of_network": {
                    "individual": parse_dollar(row.get("DEHBOutOfNetIndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("DEHBOutOfNetFamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("DEHBOutOfNetFamilyPerGroupMOOP")),
                },
                "dehb_combined": {
                    "individual": parse_dollar(row.get("DEHBCombInnOonIndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("DEHBCombInnOonFamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("DEHBCombInnOonFamilyPerGroupMOOP")),
                },
                # Total EHB MOOP (Medical + Drug)
                "tehb_in_network_tier1": {
                    "individual": parse_dollar(row.get("TEHBInnTier1IndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("TEHBInnTier1FamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("TEHBInnTier1FamilyPerGroupMOOP")),
                },
                "tehb_in_network_tier2": {
                    "individual": parse_dollar(row.get("TEHBInnTier2IndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("TEHBInnTier2FamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("TEHBInnTier2FamilyPerGroupMOOP")),
                },
                "tehb_out_of_network": {
                    "individual": parse_dollar(row.get("TEHBOutOfNetIndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("TEHBOutOfNetFamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("TEHBOutOfNetFamilyPerGroupMOOP")),
                },
                "tehb_combined": {
                    "individual": parse_dollar(row.get("TEHBCombInnOonIndividualMOOP")),
                    "family_per_person": parse_dollar(row.get("TEHBCombInnOonFamilyPerPersonMOOP")),
                    "family_per_group": parse_dollar(row.get("TEHBCombInnOonFamilyPerGroupMOOP")),
                },
            },

            # SBC Coverage Examples
            "coverage_examples": {
                "having_a_baby": {
                    "deductible": parse_dollar(row.get("SBCHavingaBabyDeductible")),
                    "copayment": parse_dollar(row.get("SBCHavingaBabyCopayment")),
                    "coinsurance": parse_dollar(row.get("SBCHavingaBabyCoinsurance")),
                    "limit": parse_dollar(row.get("SBCHavingaBabyLimit")),
                },
                "managing_diabetes": {
                    "deductible": parse_dollar(row.get("SBCHavingDiabetesDeductible")),
                    "copayment": parse_dollar(row.get("SBCHavingDiabetesCopayment")),
                    "coinsurance": parse_dollar(row.get("SBCHavingDiabetesCoinsurance")),
                    "limit": parse_dollar(row.get("SBCHavingDiabetesLimit")),
                },
                "simple_fracture": {
                    "deductible": parse_dollar(row.get("SBCHavingSimplefractureDeductible")),
                    "copayment": parse_dollar(row.get("SBCHavingSimplefractureCopayment")),
                    "coinsurance": parse_dollar(row.get("SBCHavingSimplefractureCoinsurance")),
                    "limit": parse_dollar(row.get("SBCHavingSimplefractureLimit")),
                },
            },

            # Exclusions & URLs
            "plan_level_exclusions": str(row["PlanLevelExclusions"]) if pd.notna(row.get("PlanLevelExclusions")) else None,
            "sbc_url": str(row["URLForSummaryofBenefitsCoverage"]) if pd.notna(row.get("URLForSummaryofBenefitsCoverage")) else None,
            "formulary_url": str(row["FormularyURL"]) if pd.notna(row.get("FormularyURL")) else None,
            "plan_brochure_url": str(row["PlanBrochure"]) if pd.notna(row.get("PlanBrochure")) else None,
        }

        # Compute total you-pay for each coverage example (sum of deductible + copay + coinsurance + limit)
        for example_key in ("having_a_baby", "managing_diabetes", "simple_fracture"):
            ex = record["coverage_examples"][example_key]
            components = [ex["deductible"], ex["copayment"], ex["coinsurance"], ex["limit"]]
            if all(v is not None for v in components):
                ex["total_you_pay"] = round(sum(components), 2)
            else:
                ex["total_you_pay"] = None

        records.append(record)

    logger.info(f"Built {len(records):,} SBC decoded records")
    return records


def validate(records: list[dict[str, Any]]) -> None:
    """Validate SBC decoded output."""
    logger.info("Validating output...")
    assert len(records) > 0, "No records produced"

    # Count coverage completeness
    has_tehb_ded = sum(1 for r in records if r["deductibles"]["tehb_in_network_tier1"]["individual"] is not None)
    has_tehb_moop = sum(1 for r in records if r["moop"]["tehb_in_network_tier1"]["individual"] is not None)
    has_baby = sum(1 for r in records if r["coverage_examples"]["having_a_baby"]["total_you_pay"] is not None)
    has_diabetes = sum(1 for r in records if r["coverage_examples"]["managing_diabetes"]["total_you_pay"] is not None)
    has_fracture = sum(1 for r in records if r["coverage_examples"]["simple_fracture"]["total_you_pay"] is not None)
    has_exclusions = sum(1 for r in records if r["plan_level_exclusions"] is not None)
    has_sbc_url = sum(1 for r in records if r["sbc_url"] is not None)
    has_hsa = sum(1 for r in records if r["design"]["is_hsa_eligible"])
    has_referral = sum(1 for r in records if r["design"]["is_referral_required_specialist"])

    total = len(records)
    logger.info(f"  Total records: {total:,}")
    logger.info(f"  TEHB deductible present: {has_tehb_ded:,} ({has_tehb_ded*100//total}%)")
    logger.info(f"  TEHB MOOP present: {has_tehb_moop:,} ({has_tehb_moop*100//total}%)")
    logger.info(f"  Coverage example - baby: {has_baby:,} ({has_baby*100//total}%)")
    logger.info(f"  Coverage example - diabetes: {has_diabetes:,} ({has_diabetes*100//total}%)")
    logger.info(f"  Coverage example - fracture: {has_fracture:,} ({has_fracture*100//total}%)")
    logger.info(f"  Plan exclusions text: {has_exclusions:,} ({has_exclusions*100//total}%)")
    logger.info(f"  SBC PDF URL: {has_sbc_url:,} ({has_sbc_url*100//total}%)")
    logger.info(f"  HSA eligible: {has_hsa:,}")
    logger.info(f"  Referral required: {has_referral:,}")

    # CSR variation breakdown
    csr_counts: dict[str, int] = {}
    for r in records:
        csr = r["csr_variation"]
        csr_counts[csr] = csr_counts.get(csr, 0) + 1
    logger.info("  CSR variation breakdown:")
    for csr, count in sorted(csr_counts.items(), key=lambda x: -x[1]):
        logger.info(f"    {csr}: {count:,}")

    # Sanity checks on MOOP values
    federal_moop_individual = 9200  # 2025 federal limit (2026 not yet published, use 2025)
    federal_moop_family = 18400
    moop_warnings = 0
    for r in records[:500]:
        ind_moop = r["moop"]["tehb_in_network_tier1"]["individual"]
        if ind_moop is not None and ind_moop > federal_moop_individual + 500:
            moop_warnings += 1
            if moop_warnings <= 5:
                logger.warning(f"  MOOP exceeds federal limit: {r['plan_variant_id']} = ${ind_moop:,.0f}")

    # Sanity checks: deductible should not exceed MOOP
    ded_gt_moop = 0
    for r in records[:500]:
        ded = r["deductibles"]["tehb_in_network_tier1"]["individual"]
        moop = r["moop"]["tehb_in_network_tier1"]["individual"]
        if ded is not None and moop is not None and ded > moop:
            ded_gt_moop += 1
            if ded_gt_moop <= 3:
                logger.warning(f"  Deductible > MOOP: {r['plan_variant_id']} ded=${ded:,.0f} moop=${moop:,.0f}")

    states = set(r["state_code"] for r in records)
    issuers = set(r["issuer_id"] for r in records)
    base_plans = set(r["plan_id"] for r in records)
    metals = set(r["metal_level"] for r in records)

    logger.info(f"  States: {len(states)}")
    logger.info(f"  Issuers: {len(issuers)}")
    logger.info(f"  Unique base plans: {len(base_plans)}")
    logger.info(f"  Metal levels: {sorted(metals)}")
    logger.info("  Validation passed")


def save(records: list[dict[str, Any]]) -> Path:
    """Save SBC decoded dataset with metadata."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    states = sorted(set(r["state_code"] for r in records))
    base_plans = set(r["plan_id"] for r in records)
    has_baby = sum(1 for r in records if r["coverage_examples"]["having_a_baby"]["total_you_pay"] is not None)

    output = {
        "metadata": {
            "source": "CMS Plan Attributes PUF (PY2026)",
            "plan_year": 2026,
            "record_count": len(records),
            "unique_base_plans": len(base_plans),
            "includes_csr_variants": True,
            "states": states,
            "coverage_example_completeness": {
                "having_a_baby": has_baby,
                "managing_diabetes": sum(1 for r in records if r["coverage_examples"]["managing_diabetes"]["total_you_pay"] is not None),
                "simple_fracture": sum(1 for r in records if r["coverage_examples"]["simple_fracture"]["total_you_pay"] is not None),
            },
            "generated_at": pd.Timestamp.now().isoformat(),
            "schema_version": "1.0",
            "note": "All cost-sharing data extracted from PUF. Copay/coinsurance per service category requires BenCS PUF or SBC PDF parsing.",
            "fields_still_need_pdf_parsing": [
                "copay_primary_care",
                "copay_specialist",
                "copay_er",
                "copay_urgent_care",
                "copay_generic_rx",
                "copay_preferred_brand_rx",
                "copay_specialty_rx",
                "coinsurance_hospital_inpatient",
                "coinsurance_outpatient_surgery",
                "coinsurance_imaging",
                "coinsurance_mental_health",
                "coinsurance_maternity",
                "exclusion_categories (structured taxonomy)",
            ],
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
    print("\nSample record (standard Silver plan):")
    # Find a standard Silver plan for the sample
    silver = [r for r in records if "Standard Silver On Exchange" in r["csr_variation"]]
    if silver:
        print(json.dumps(silver[0], indent=2, default=str))
    else:
        print(json.dumps(records[0], indent=2, default=str))


if __name__ == "__main__":
    main()
