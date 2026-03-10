"""
Generate: Billing Intelligence Dataset (Pillar 8)

20 billing scenarios covering common consumer cost surprises:
- Preventive visit with additional complaint (split billing)
- Multi-diagnosis single visit
- Specialist referral vs self-refer
- Lab ordered in-office vs external reference lab
- Telehealth vs in-person cost differences
- Emergency care billing surprises
- Facility fee vs professional fee
- Bundled vs unbundled charges

Each scenario: description, how_it_gets_coded (CPT/ICD-10), cost_impact_by_plan_type,
consumer_tip, related_triggers, billing_category.

Output: data/processed/billing_intel.json

Usage:
    python scripts/generate/build_billing_intel.py
"""

import datetime
import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

PROCESSED_DIR = Path("data/processed")
OUTPUT_PATH = PROCESSED_DIR / "billing_intel.json"

# ─── Billing Scenarios ────────────────────────────────────────────────────────

BILLING_SCENARIOS: list[dict[str, Any]] = [
    {
        "id": "bil_001",
        "billing_category": "preventive_split_billing",
        "title": "Preventive Visit + Same-Day Complaint = Two Bills",
        "description": (
            "You schedule a routine annual physical (covered 100% under ACA). During the visit, "
            "you mention knee pain. Your doctor addresses both. The office bills a preventive exam "
            "code AND a problem-focused E&M visit — you receive a bill for the second service."
        ),
        "how_it_gets_coded": {
            "code_1": {"cpt": "99395", "description": "Preventive medicine E&M, 18-39 years", "cost_sharing": "None — ACA preventive"},
            "code_2": {"cpt": "99213", "description": "Problem-focused office/outpatient E&M, moderate complexity", "cost_sharing": "Applies deductible/copay"},
            "modifier": "-25 (significant, separately identifiable E&M on same day as preventive)",
            "icd10_examples": ["M25.561 (knee pain)", "Z00.00 (general adult medical exam)"],
            "billing_mechanism": "Modifier -25 allows billing two E&M services same day — legal but controversial",
        },
        "cost_impact_by_plan_type": {
            "bronze_hdhp": "Likely $0 (deductible not yet met) if deductible applies first — but patient owes full allowable charge",
            "silver": "Typically $30–$60 copay or 20–30% coinsurance after deductible for E&M code",
            "gold": "Typically $20–$40 copay for E&M code",
            "hmo_vs_ppo": "HMO may require PCP referral; PPO allows self-referral but same split-billing risk",
        },
        "consumer_tip": (
            "If you only want the preventive visit covered at 100%, tell your doctor explicitly: "
            "'Please address only the preventive exam today. I will schedule a separate appointment "
            "for my knee.' This prevents Modifier -25 billing. If both are billed, you can request "
            "an itemized bill and ask the provider to re-code as preventive-only if the complaint "
            "was minor and not a separate medical decision."
        ),
        "related_triggers": ["preventive_care", "modifier_25", "annual_physical", "uspstf_screenings"],
        "related_cfr": "ACA §2713; 45 CFR §147.130; AMA CPT Modifier -25 guidelines",
        "consumer_risk_level": "High — extremely common, affects millions annually",
    },
    {
        "id": "bil_002",
        "billing_category": "lab_routing",
        "title": "In-Office Blood Draw → Out-of-Network Reference Lab",
        "description": (
            "Your in-network doctor collects blood during a visit and sends it to an external "
            "reference laboratory (Quest Diagnostics, LabCorp, BioReference). The lab is out-of-network. "
            "You receive a lab bill weeks later that doesn't apply toward your in-network deductible "
            "and may be billed at full list price."
        ),
        "how_it_gets_coded": {
            "code_1": {"cpt": "36415", "description": "Routine venipuncture (blood draw)", "cost_sharing": "Usually bundled or minimal"},
            "code_2_examples": [
                {"cpt": "80053", "description": "Comprehensive metabolic panel"},
                {"cpt": "85025", "description": "Complete blood count (CBC)"},
                {"cpt": "83036", "description": "Hemoglobin A1c"},
                {"cpt": "80061", "description": "Lipid panel"},
            ],
            "billing_mechanism": "Lab bills separately from physician — often DIFFERENT tax ID, different insurance contract",
            "icd10_examples": ["Z00.00 (routine exam)", "E11.9 (Type 2 diabetes — for A1c)", "Z13.6 (encounter for screening for cardiovascular disorders)"],
        },
        "cost_impact_by_plan_type": {
            "in_network_lab": "$0–$30 typically (applies in-network deductible/copay)",
            "out_of_network_lab": "$100–$500+ depending on tests; may not count toward in-network deductible; balance billing possible",
            "hdhp_hsa": "Full cost counts toward deductible; OON lab billed at higher rate",
            "federal_no_surprises_act_gap": "NSA does not fully cover reference labs in all situations — partial protection only",
        },
        "consumer_tip": (
            "Before your appointment: call your insurer and ask 'What labs are in-network?' and "
            "tell your doctor 'Please send labs only to [in-network lab name].' If your doctor's "
            "office uses a specific reference lab, confirm its network status before the visit. "
            "You can also request that routine labs be drawn at a free-standing in-network lab "
            "facility (e.g., a Quest Patient Service Center you call and schedule separately). "
            "After an unexpected lab bill: ask if the lab has an in-network agreement your doctor "
            "wasn't aware of — sometimes labs have retrospective network arrangements."
        ),
        "related_triggers": ["lab_routing", "out_of_network", "no_surprises_act", "reference_lab"],
        "related_cfr": "No Surprises Act §102; 45 CFR §149.110; state lab laws vary",
        "consumer_risk_level": "High — affects 20%+ of patients with lab orders",
    },
    {
        "id": "bil_003",
        "billing_category": "facility_fee",
        "title": "Hospital-Owned Clinic Visit Triggers Facility Fee",
        "description": (
            "You visit a doctor's office that was acquired by a hospital system. The office bills "
            "both a professional fee (doctor's service) AND a facility fee (for using the hospital's "
            "facility), even though you never set foot in a hospital. Total bill is 2–3x a "
            "comparable independent practice visit."
        ),
        "how_it_gets_coded": {
            "professional_fee": {"cpt": "99213", "pos_code": "22 (outpatient hospital)", "billed_by": "Physician group"},
            "facility_fee": {"revenue_code": "0510 (clinic), 0982 (professional fees)", "pos_code": "22", "billed_by": "Hospital system"},
            "billing_mechanism": "Hospital outpatient department (HOPD) billing uses Place of Service 22 instead of 11 (office), unlocking higher CMS reimbursement rates and dual-billing",
            "note": "Site-neutral payment policies being phased in by CMS for off-campus HOPDs under BBA 2015",
        },
        "cost_impact_by_plan_type": {
            "typical_independent_office_copay": "$25–$50 copay (POS 11)",
            "hospital_owned_clinic_total": "$75–$300+ (professional $40–$80 + facility $50–$250)",
            "insurance_coverage_difference": "Facility fee often has separate deductible/coinsurance even on same-day visit",
            "hmo_vs_ppo": "HMO plans may require different authorization for HOPD vs office settings",
        },
        "consumer_tip": (
            "When calling to schedule: ask explicitly 'Is this a hospital-owned clinic or "
            "independent practice?' and 'Will there be a facility fee?' "
            "If yes, ask for a cost estimate before your visit. "
            "You can often find care at identical quality at an independent physician office "
            "for significantly lower cost-sharing. "
            "CMS has implemented site-neutral payment for off-campus HOPDs — check if the "
            "clinic grandfathered under old billing rules (pre-2015 facilities)."
        ),
        "related_triggers": ["facility_fee", "hospital_outpatient", "site_neutral_payment", "pos_code"],
        "related_cfr": "CMS OPPS (42 CFR §419); BBA 2015 §603 site-neutral provisions",
        "consumer_risk_level": "High — increasingly common as hospital systems acquire physician practices",
    },
    {
        "id": "bil_004",
        "billing_category": "emergency_care",
        "title": "Emergency Visit: Facility + Physician Bills Separately",
        "description": (
            "You go to the ER. You receive two separate bills: one from the hospital (facility charge) "
            "and one from the emergency physician group (professional charge). "
            "The physician group may be a separate company contracted to the hospital and "
            "may not be in-network even though the hospital is in-network."
        ),
        "how_it_gets_coded": {
            "facility_codes": [{"cpt": "99283", "description": "ED visit, moderate severity (facility component)"}],
            "physician_codes": [{"cpt": "99283", "description": "ED visit, moderate severity (professional component)"}],
            "ancillary_codes": [
                {"cpt": "71046", "description": "X-ray chest 2 views"},
                {"cpt": "93005", "description": "ECG tracing"},
                {"cpt": "85025", "description": "CBC"},
            ],
            "billing_mechanism": "Hospital bills for use of facility/equipment; physician group bills separately for physician services",
        },
        "cost_impact_by_plan_type": {
            "bronze": "Typically $500–$1,500+ ER copay/visit plus deductible-applicable physician charges",
            "silver": "Typically $250–$500 ER copay plus 20–30% of physician charges",
            "gold": "Typically $150–$300 ER copay plus 20% of physician charges",
            "out_of_network_physician_protection": "No Surprises Act protects against balance billing by out-of-network emergency physicians at in-network ER",
        },
        "consumer_tip": (
            "For emergency care: the No Surprises Act (effective 2022) requires your insurer to treat "
            "out-of-network emergency providers at an in-network ER as in-network for cost-sharing purposes. "
            "You should only pay in-network cost-sharing amounts for emergency services regardless of "
            "physician network status. "
            "If balance billed by an OON emergency physician, file a complaint at cms.gov/nosurprises. "
            "Keep all EOBs and compare to bills — insurers must disclose their expected payments."
        ),
        "related_triggers": ["emergency_care", "no_surprises_act", "balance_billing", "emergency_physician"],
        "related_cfr": "No Surprises Act (Div. BB CAA 2021); 45 CFR §149.110; ACA §2719A",
        "consumer_risk_level": "High — ER physician groups were historically most common source of surprise bills",
    },
    {
        "id": "bil_005",
        "billing_category": "specialist_referral",
        "title": "Self-Referral to Specialist: Network Status Matters More Than You Think",
        "description": (
            "You self-refer to a specialist you found online. They claim to accept your insurance. "
            "But after the visit you learn they are 'participating' (on the insurer's list) but "
            "not 'preferred in-network' — resulting in higher cost-sharing than expected. "
            "Or: you have an HMO and didn't get a PCP referral — insurer denies the claim."
        ),
        "how_it_gets_coded": {
            "specialist_visit_codes": [
                {"cpt": "99243", "description": "Office consultation, moderate complexity"},
                {"cpt": "99214", "description": "Office/outpatient E&M established patient, moderate-high"},
            ],
            "billing_mechanism": "Specialist may be in-network but in a higher-cost tier (tiered network plans); or HMO requires referral authorization code on claim",
            "icd10_examples": ["M54.5 (low back pain)", "I10 (essential hypertension)"],
        },
        "cost_impact_by_plan_type": {
            "hmo_no_referral": "Claim denied 100% — patient owes full amount",
            "tiered_ppo_preferred_tier": "Specialist copay: $40–$60",
            "tiered_ppo_non_preferred_tier": "Higher copay ($80–$120) or higher coinsurance (30–40%)",
            "epo": "Out-of-network claim denied except for emergencies",
            "pos_plan": "In-network referral: low cost; self-refer: higher cost-sharing",
        },
        "consumer_tip": (
            "Before seeing a specialist: (1) For HMO/POS plans, always get a referral from your PCP. "
            "(2) Call the specialist AND your insurer to confirm network tier — 'participating' vs "
            "'preferred' vs 'non-preferred' are different cost-sharing levels. "
            "(3) Ask the specialist's billing office: 'What is your NPI number and what tier are "
            "you in with [my insurer]?' "
            "(4) For tiered plans, the insurer's online directory usually shows tiers — check "
            "before scheduling."
        ),
        "related_triggers": ["specialist_referral", "hmo_referral", "tiered_network", "epo_restriction"],
        "related_cfr": "45 CFR §147.138 (access to OB-GYN without referral); state tiered network disclosure laws",
        "consumer_risk_level": "Medium-High — common confusion point especially with HMO/tiered network plans",
    },
    {
        "id": "bil_006",
        "billing_category": "outpatient_surgery",
        "title": "Outpatient Surgery: Multiple Separate Billers",
        "description": (
            "You have an outpatient procedure at a surgical center. You receive bills from: "
            "(1) the surgery center itself, (2) the surgeon, (3) the anesthesiologist, "
            "(4) possibly an assistant surgeon, (5) pathology if tissue was sent, "
            "(6) radiology if imaging was done intraoperatively. Each bills separately."
        ),
        "how_it_gets_coded": {
            "surgery_center": {"revenue_codes": "0360-0369 (operating room)", "example_cpt": "27447 (total knee arthroplasty)"},
            "surgeon": {"cpt_example": "27447 with global period modifier", "type": "professional fee"},
            "anesthesiologist": {"cpt_example": "01400 (knee anesthesia) + time units", "type": "professional fee"},
            "assistant_surgeon": {"modifier": "-80 or -AS", "percentage": "20% of surgeon's allowable typically"},
            "pathology": {"cpt_example": "88305 (tissue exam)", "type": "professional fee"},
            "billing_mechanism": "Each provider has independent billing entity and separate insurance contract — any could be OON",
        },
        "cost_impact_by_plan_type": {
            "all_providers_in_network": "Standard cost-sharing per your SBC, deductible likely fully or partially met",
            "anesthesiologist_oon": "No Surprises Act protects against balance billing for non-emergency facility procedures",
            "surgery_center_oon": "Full OON cost-sharing applies; balance billing possible if not protected by NSA",
            "total_estimated_patient_cost": "Can range from $0 (OOP max met) to $5,000+ if deductible not met",
        },
        "consumer_tip": (
            "Before surgery: (1) Ask the surgical center for a complete list of all providers who "
            "will participate in your procedure and their NPI numbers. (2) Verify each provider's "
            "network status with your insurer — surgeon IN-network doesn't mean anesthesiologist is. "
            "(3) The No Surprises Act protects you against OON balance billing for anesthesiologists "
            "and other facility-based providers at in-network facilities. "
            "(4) Request a Good Faith Estimate (GFE) — facilities are required to provide one "
            "before scheduled services."
        ),
        "related_triggers": ["outpatient_surgery", "no_surprises_act", "anesthesia", "good_faith_estimate"],
        "related_cfr": "No Surprises Act §107 (Good Faith Estimates); 45 CFR §149.610; CMS ASC billing",
        "consumer_risk_level": "High — surgical billing is the highest-dollar surprise billing scenario",
    },
    {
        "id": "bil_007",
        "billing_category": "mental_health_parity",
        "title": "Mental Health Copay Higher Than Medical — Parity Violation?",
        "description": (
            "You notice your mental health outpatient visit copay ($60) is higher than your "
            "primary care copay ($30). Under the Mental Health Parity and Addiction Equity Act "
            "(MHPAEA), this may be a violation — treatment limitations on mental health cannot "
            "be more restrictive than medical/surgical benefits."
        ),
        "how_it_gets_coded": {
            "mental_health_codes": [
                {"cpt": "90837", "description": "Psychotherapy, 60 minutes"},
                {"cpt": "90834", "description": "Psychotherapy, 45 minutes"},
                {"cpt": "90791", "description": "Psychiatric diagnostic evaluation"},
            ],
            "comparison_codes": [
                {"cpt": "99213", "description": "Primary care office visit (medical analog)"},
            ],
            "parity_test": "Financial requirements (copays/coinsurance) for MH/SUD cannot be more restrictive than for medical/surgical at same benefit level",
        },
        "cost_impact_by_plan_type": {
            "compliant_plan": "MH copay = medical copay (e.g., both $30); or MH coinsurance = medical coinsurance",
            "potential_violation": "MH copay ($60) vs medical ($30) = financial parity violation",
            "nonquantitative_limit_violation": "PA required for MH but not for comparable medical = NQTL violation",
            "remedy_if_violated": "File complaint with DOL (employer plans) or state insurance commissioner; insurer must refund excess cost-sharing",
        },
        "consumer_tip": (
            "Your plan must apply the same cost-sharing rules to mental health/SUD visits as it "
            "does to comparable medical/surgical visits. "
            "If your MH copay is higher than your PCP copay, request a parity analysis from your "
            "insurer (they're required to provide one). "
            "For employer plans, file a complaint with the Department of Labor at dol.gov/MHPAEA. "
            "For Marketplace plans, file with your state insurance commissioner. "
            "MHPAEA also covers non-quantitative treatment limitations — visit limits, prior auth "
            "requirements, and step therapy cannot be more restrictive for MH than medical."
        ),
        "related_triggers": ["mental_health_parity", "mhpaea", "prior_authorization", "treatment_limits"],
        "related_cfr": "MHPAEA (PL 110-343); 29 CFR §2590.712; 26 CFR §54.9812-1; 45 CFR §146.136",
        "consumer_risk_level": "Medium — parity violations common but underreported",
    },
    {
        "id": "bil_008",
        "billing_category": "observation_status",
        "title": "Hospital Observation Status vs Inpatient Admission: Huge Cost Difference",
        "description": (
            "You spend two nights in the hospital. The doctor puts you on 'observation status' "
            "instead of officially admitting you as inpatient. Under Medicare this dramatically "
            "affects SNF eligibility. Under commercial insurance, observation is often billed "
            "as outpatient — different (often higher) cost-sharing applies than inpatient."
        ),
        "how_it_gets_coded": {
            "inpatient_admission": {"revenue_code": "0100-0219 (room & board)", "type": "DRG-based (Diagnosis Related Group) billing", "status": "Type of Bill: 11X"},
            "observation_status": {"revenue_code": "0762 (observation room)", "cpt": "G0378 (observation per hour)", "status": "Type of Bill: 13X (outpatient)", "billing_note": "Billed hourly as outpatient services"},
            "criteria_difference": "Inpatient: MD expects 2+ nights stay; Observation: MD expects discharge in <24-48h or uncertain status",
        },
        "cost_impact_by_plan_type": {
            "inpatient_cost_sharing": "Fixed copay (e.g., $500/admission) then lower coinsurance",
            "observation_outpatient_cost_sharing": "Each service billed individually — drugs, tests, room all separate copays",
            "typical_observation_vs_inpatient_patient_cost": "Observation often costs patient MORE out-of-pocket than inpatient admission",
            "medicare_specific": "Observation status prevents qualifying 3-day inpatient stay for skilled nursing facility (SNF) coverage",
        },
        "consumer_tip": (
            "If hospitalized, ask explicitly: 'Am I admitted as inpatient or on observation status?' "
            "You can request the hospital change your status — ask for the 'utilization review' department. "
            "Under the NOTICE Act (for Medicare), hospitals must notify Medicare beneficiaries of "
            "observation status in writing within 36 hours. "
            "For commercial insurance, review your EOB carefully — outpatient cost-sharing for a "
            "hospital stay can significantly exceed your inpatient copay."
        ),
        "related_triggers": ["observation_status", "inpatient_admission", "medicare_snf", "hospital_billing"],
        "related_cfr": "CMS NOTICE Act (PL 114-42); Medicare Claims Processing Manual §30.6.1; CMS Two-Midnight Rule",
        "consumer_risk_level": "Medium — most common for elderly patients; large dollar impact",
    },
    {
        "id": "bil_009",
        "billing_category": "prescription_drug_tiers",
        "title": "Brand Drug Classified as Tier 4 Instead of Tier 3: Cost Triples",
        "description": (
            "Your doctor prescribes a brand-name medication. Your insurer classifies it as "
            "Specialty Tier (Tier 4/5) with 30–40% coinsurance rather than Preferred Brand "
            "(Tier 3) with a fixed $60 copay. The same drug at a different insurer would be "
            "Tier 3 — formulary placement drives out-of-pocket cost dramatically."
        ),
        "how_it_gets_coded": {
            "tier_structure": {
                "tier_1": "Generic drugs — $5–$15 copay",
                "tier_2": "Preferred generic/formulary brand — $30–$50 copay",
                "tier_3": "Non-preferred brand — $60–$100 copay",
                "tier_4": "Specialty drugs — 30–40% coinsurance, often $200–$500+/fill",
                "tier_5": "High-cost specialty/biologic — up to $500 max coinsurance/fill (ACA specialty cap)",
            },
            "billing_mechanism": "PBM (Pharmacy Benefit Manager) assigns formulary tier; each insurer's PBM negotiates separately",
            "icd10_examples": ["Multiple — tier placement affects all diagnoses"],
        },
        "cost_impact_by_plan_type": {
            "preferred_brand_tier3": "$60–$100 per 30-day fill",
            "specialty_tier4": "30–40% of $3,000–$15,000 drug cost = $900–$6,000 annually",
            "aca_specialty_coinsurance_cap": "ACA limits specialty drug coinsurance to not exceed max OOP — applies toward MOOP",
            "manufacturer_coupon_note": "Manufacturer coupons may not count toward MOOP on some plans (check plan docs)",
        },
        "consumer_tip": (
            "Before starting a new prescription: (1) Look up the drug on your plan's formulary online "
            "to see its tier and any PA/ST/QL requirements. (2) Ask your doctor if a therapeutic "
            "equivalent in a lower tier exists. (3) If the drug is Tier 4+, request a formulary "
            "exception — your plan must grant exceptions if medical necessity is documented. "
            "(4) Ask about manufacturer patient assistance programs (PAP) for very high-cost drugs "
            "if you qualify. (5) Check GoodRx.com — sometimes paying cash + GoodRx is cheaper than insurance."
        ),
        "related_triggers": ["drug_tiers", "formulary", "specialty_drugs", "formulary_exception", "prior_authorization"],
        "related_cfr": "ACA §2719; 45 CFR §156.122 (formulary requirements); CMS formulary exception standards",
        "consumer_risk_level": "High — specialty drug tier placement is the #1 Rx cost surprise",
    },
    {
        "id": "bil_010",
        "billing_category": "out_of_network_air_ambulance",
        "title": "Air Ambulance Bill: $40,000 After Insurance Pays $8,000",
        "description": (
            "You're airlifted after an accident. The air ambulance company is out-of-network. "
            "They bill $48,000. Your insurer pays $8,000 (its 'usual and customary' rate). "
            "The air ambulance company balance bills you for the $40,000 difference. "
            "The No Surprises Act now broadly covers ground ambulance but air ambulance rules differ."
        ),
        "how_it_gets_coded": {
            "air_ambulance_codes": [
                {"cpt": "A0430", "description": "Air ambulance, fixed-wing"},
                {"cpt": "A0431", "description": "Air ambulance, rotary wing (helicopter)"},
                {"cpt": "A0432-A0436", "description": "Additional air ambulance mileage/service codes"},
            ],
            "billing_mechanism": "Air ambulance companies are deregulated airlines under ERISA preemption — historically not subject to state balance billing laws",
            "nsa_coverage": "NSA covers air ambulance: limits patient cost-sharing to in-network amount; prohibits balance billing for NSA-covered plans",
        },
        "cost_impact_by_plan_type": {
            "pre_nsa_oon": "$10,000–$50,000+ balance bill possible",
            "post_nsa_covered_plans": "Patient pays only in-network cost-sharing amount; insurer and air ambulance negotiate remaining amount",
            "nsa_exclusions": "NSA doesn't cover all plans — grandfathered plans, some self-funded plans may have different rules",
            "ground_ambulance": "Ground ambulance has a separate, more limited NSA carve-out; balance billing still possible in many states",
        },
        "consumer_tip": (
            "Air ambulance NSA protections: If you had emergency air transport on or after January 1, 2022, "
            "and received a balance bill exceeding your in-network cost-sharing, the NSA likely applies. "
            "Steps: (1) File a complaint at cms.gov/nosurprises, (2) Contact your state insurance "
            "commissioner (some states have additional protections), (3) Request an explanation from "
            "your insurer of their NSA independent dispute resolution process. "
            "Never pay a balance bill from an air ambulance company without first verifying NSA applicability."
        ),
        "related_triggers": ["air_ambulance", "no_surprises_act", "balance_billing", "emergency_transport"],
        "related_cfr": "No Surprises Act §102(b); 45 CFR §149.130; ERISA §514(b)(4)",
        "consumer_risk_level": "High — catastrophic financial impact if unprotected",
    },
    {
        "id": "bil_011",
        "billing_category": "telehealth_cost_sharing",
        "title": "Telehealth Visit Billed Differently Than In-Person — Same PCP, Different Cost",
        "description": (
            "You have a telehealth call with your PCP. The visit is billed with POS code '02' "
            "(telehealth) or '10' (patient's home). Your plan has a specific telehealth benefit "
            "with different cost-sharing than in-office visits — sometimes lower, sometimes higher. "
            "Mental health telehealth has its own rules under MHPAEA."
        ),
        "how_it_gets_coded": {
            "telehealth_cpt": [
                {"cpt": "99213", "pos": "02 (telehealth) or 10 (patient's home)", "modifier": "95 or GT"},
                {"cpt": "99443", "description": "Online digital E&M 21+ minutes (audio-only)"},
            ],
            "audio_only": {"cpt_range": "99441-99443", "note": "Audio-only codes have lower reimbursement; some plans don't cover"},
            "billing_mechanism": "Place of Service code changes from 11 (office) to 02/10 triggers telehealth benefit level; modifier 95 = real-time audio/visual",
        },
        "cost_impact_by_plan_type": {
            "plans_with_telehealth_benefit": "$0–$15 telehealth copay (better than in-office)",
            "plans_applying_office_copay": "Same $30–$60 as office visit",
            "plans_with_higher_telehealth_cost": "Some older plan designs have $50–$75 telehealth copay",
            "mental_health_telehealth_parity": "Must equal mental health in-person copay under MHPAEA",
            "audio_only_coverage": "Not all plans cover audio-only calls — check plan docs",
        },
        "consumer_tip": (
            "Check your Summary of Benefits for 'telehealth' or 'virtual visit' cost-sharing specifically — "
            "it may be listed separately from office visit copays. "
            "If using telehealth for mental health: MHPAEA requires parity with in-person MH visits. "
            "Ask the provider if they'll use audio/video (not just phone) — audio-only has fewer coverage guarantees. "
            "Many plans waived telehealth cost-sharing during COVID; check if those waivers are still active."
        ),
        "related_triggers": ["telehealth", "mental_health_parity", "cost_sharing", "audio_only"],
        "related_cfr": "Mental Health Parity Act; state telehealth parity laws; CMS PHE telehealth extensions",
        "consumer_risk_level": "Low-Medium — mostly favorable but varies widely by plan",
    },
    {
        "id": "bil_012",
        "billing_category": "bundled_vs_unbundled",
        "title": "Unbundled Surgical Codes: Paying Separately for Components of One Procedure",
        "description": (
            "A surgeon performs a procedure and bills multiple CPT codes for steps that should "
            "be bundled into one code under CMS's National Correct Coding Initiative (NCCI). "
            "This is called 'unbundling.' When done intentionally by a provider, it's fraud. "
            "When done accidentally (or passed to the patient), it inflates your out-of-pocket costs."
        ),
        "how_it_gets_coded": {
            "example_unbundled": {
                "should_be": {"cpt": "45378", "description": "Diagnostic colonoscopy (all-inclusive)"},
                "incorrectly_billed_as": [
                    {"cpt": "45330", "description": "Flexible sigmoidoscopy"},
                    {"cpt": "45382", "description": "Colonoscopy with control of bleeding"},
                ],
                "correct_code": "45378 or 45385 (if polyp removed) — not both scoping codes",
            },
            "ncci_edits": "CMS National Correct Coding Initiative (NCCI) defines which CPT code pairs cannot be billed together",
        },
        "cost_impact_by_plan_type": {
            "correct_billing": "Single all-inclusive procedure — your cost-sharing applies once",
            "unbundled_billing": "Multiple separate cost-sharing obligations — may be 2–3x expected cost",
            "insurer_ncci_edits": "Most insurers apply NCCI edits and auto-reject unbundled pairs — but some pass through",
        },
        "consumer_tip": (
            "If you receive multiple bills for what you believed was a single procedure: "
            "Request an itemized bill and look up the CPT codes on the NCCI edits list. "
            "If codes are bundled pairs, dispute the charge with the provider billing department — "
            "ask them to rebill with the correct comprehensive code. "
            "If the provider refuses, file a complaint with your state insurance commissioner "
            "and/or the OIG Medicare Fraud Hotline (1-800-HHS-TIPS) if Medicare-related."
        ),
        "related_triggers": ["unbundling", "ncci_edits", "surgical_billing", "cpt_codes"],
        "related_cfr": "CMS NCCI Policy Manual; 42 CFR §411.353 (anti-kickback); OIG guidance",
        "consumer_risk_level": "Medium — more common than expected; hard for consumers to detect",
    },
    {
        "id": "bil_013",
        "billing_category": "deductible_reset",
        "title": "Deductible Resets January 1 — Scheduling Surgery Timing Matters",
        "description": (
            "You had a high-cost procedure in November after meeting your deductible. "
            "Your doctor recommends follow-up surgery. In December, you'd pay near-$0 (deductible met). "
            "In January, you'd restart the deductible — potentially $3,000–$7,000 out-of-pocket. "
            "Strategic scheduling can save thousands."
        ),
        "how_it_gets_coded": {
            "note": "No change in coding — identical CPT codes billed before or after deductible reset",
            "deductible_year": "Calendar year plans: deductible resets January 1",
            "plan_year_variation": "Some employer plans have non-calendar plan years (e.g., July 1) — deductible resets on plan anniversary",
            "accumulator_programs": "Some plans with manufacturer coupons use 'accumulator adjustment programs' — copay assistance may not count toward deductible",
        },
        "cost_impact_by_plan_type": {
            "pre_deductible_met": "$0–$300 (only coinsurance after deductible met)",
            "post_deductible_reset": "$3,000–$7,000 (individual deductible must be re-met)",
            "total_savings_by_scheduling_in_december": "$2,700–$6,700 depending on deductible amount",
            "note": "Consult with physician — medical timing always takes priority over financial optimization",
        },
        "consumer_tip": (
            "Before scheduling any elective procedure: check your current deductible status with your insurer. "
            "If you've nearly met your deductible, it may be advantageous to schedule before year-end. "
            "If you've barely started the year, consider whether a higher-deductible Bronze plan "
            "makes sense if you're healthy, or if you'd benefit from lower-deductible Gold. "
            "Never delay medically necessary care for financial reasons — always consult your physician first."
        ),
        "related_triggers": ["deductible_reset", "plan_year", "elective_surgery_timing", "cost_optimization"],
        "related_cfr": "ACA §1302; 45 CFR §156.130 (cost-sharing parameters); plan SBC disclosure",
        "consumer_risk_level": "Low — informational/planning, not a harmful billing practice",
    },
    {
        "id": "bil_014",
        "billing_category": "moop_accumulation",
        "title": "Out-of-Pocket Maximum: What Counts and What Doesn't",
        "description": (
            "You've been told your out-of-pocket maximum is $8,500. You've paid $8,000 this year "
            "but still receive bills. Some payments don't count toward your MOOP: "
            "out-of-network charges, balance billing amounts, some 'excluded' services, "
            "and in some plans, drug costs accumulate separately."
        ),
        "how_it_gets_coded": {
            "counts_toward_moop": [
                "In-network deductibles", "In-network copays", "In-network coinsurance",
                "In-network prescription drug cost-sharing (if integrated MOOP)",
            ],
            "does_not_count": [
                "Out-of-network cost-sharing (for most plans)",
                "Balance billing amounts (amounts above allowed charges)",
                "Premiums",
                "Non-covered service cost-sharing",
                "Drug cost-sharing on plans with separate drug MOOP (ACA allows this)",
            ],
            "aca_moop_limit_2026": "$9,450 individual / $18,900 family (estimated 2026 limit)",
        },
        "cost_impact_by_plan_type": {
            "integrated_moop": "Single MOOP covers medical + drugs — once hit, everything is $0",
            "separate_drug_moop": "Medical MOOP + separate drug MOOP — could have two separate $9,450 limits",
            "in_network_only": "MOOP protection only applies in-network for most plans",
        },
        "consumer_tip": (
            "Read your Summary of Benefits to determine: (1) Does your plan have integrated or "
            "separate drug MOOP? (2) Does OON cost-sharing count toward MOOP? "
            "If you've hit your MOOP and still receiving bills: (1) Request EOB for each service "
            "and verify the provider was in-network, (2) Confirm the service is covered under your plan, "
            "(3) Verify charges are applying toward the correct MOOP accumulator. "
            "File an appeal if costs that should count toward MOOP are not being applied."
        ),
        "related_triggers": ["out_of_pocket_maximum", "moop_accumulation", "drug_moop", "in_network"],
        "related_cfr": "ACA §1302(c); 45 CFR §156.130; CMS MOOP parameters for 2026",
        "consumer_risk_level": "Medium — MOOP confusion causes unnecessary patient payments",
    },
    {
        "id": "bil_015",
        "billing_category": "preventive_screening_aca",
        "title": "Colonoscopy Billed as Diagnostic vs Preventive: $0 vs $1,500",
        "description": (
            "Routine preventive colonoscopy for a 50-year-old should be $0 under ACA. "
            "But if the doctor removes a polyp during the colonoscopy, the billing code changes "
            "to a therapeutic/diagnostic code — and some insurers apply cost-sharing to the "
            "entire procedure, reversing the $0 preventive benefit. "
            "This is a major ACA litigation and regulatory controversy."
        ),
        "how_it_gets_coded": {
            "preventive_code": {"cpt": "45378", "description": "Diagnostic colonoscopy — $0 if billed preventive per USPSTF", "note": "Should be $0 under ACA for routine screening age 45+"},
            "polyp_removal_code": {"cpt": "45385", "description": "Colonoscopy with removal of polyp — therapeutic", "note": "Some insurers apply cost-sharing to this code"},
            "billing_controversy": "USPSTF grade A recommendation is for screening — but therapeutic component (polyp removal) triggers diagnostic billing by some insurers",
            "post_2022_aca_clarification": "HHS issued rules in 2022 clarifying that colonoscopy with polyp removal during preventive screen must be covered at $0 — fully effective for plan years beginning on or after Jan 1, 2024",
        },
        "cost_impact_by_plan_type": {
            "fully_compliant_post_2024": "$0 patient cost-sharing for colonoscopy including polyp removal",
            "non_compliant_plans": "Patient billed $200–$1,500 for therapeutic code — appealable",
            "grandfathered_plans": "Grandfathered plans (unchanged since 2010) are exempt from ACA preventive care mandate",
        },
        "consumer_tip": (
            "If billed for a screening colonoscopy where a polyp was removed: "
            "For plan years beginning on/after January 1, 2024, your insurer should cover it at $0. "
            "File an internal appeal citing '45 CFR §147.130 and HHS Final Rule on preventive care.' "
            "If your plan year began after January 2024 and you're still being billed, file a "
            "complaint with your state insurance commissioner or the Department of Labor (employer plans). "
            "Grandfathered plans are still exempt — check your SBC for grandfathered status."
        ),
        "related_triggers": ["preventive_care", "colonoscopy", "uspstf_grade_a", "polyp_removal"],
        "related_cfr": "ACA §2713; 45 CFR §147.130; HHS Final Rule (88 FR 21550, 2023); Braidwood Management Inc. v. Becerra",
        "consumer_risk_level": "Medium — major ACA controversy, now largely resolved for non-grandfathered plans",
    },
    {
        "id": "bil_016",
        "billing_category": "coordination_of_benefits",
        "title": "Two Insurance Plans: Which Is Primary? COB Order Matters for Your Cost",
        "description": (
            "You have coverage under your own employer plan AND your spouse's employer plan. "
            "Or you have both Medicare and a commercial plan (MAPD or employer). "
            "Coordination of Benefits (COB) determines which plan pays first (primary) and "
            "second (secondary). Getting this wrong can result in claims denied or underpaid."
        ),
        "how_it_gets_coded": {
            "cob_rules": {
                "birthday_rule": "For children on two parents' plans: plan of parent whose birthday comes first in year is primary",
                "employer_vs_marketplace": "Employer plan is always primary; Marketplace is secondary",
                "medicare_employer_primary": "Employer plan primary if employer has 20+ employees and person is actively employed",
                "medicare_employer_secondary": "Medicare primary if employer has <20 employees or retiree coverage",
            },
            "billing_note": "Claims must be submitted to primary first; secondary pays remainder per their allowed amount (not billed amount)",
        },
        "cost_impact_by_plan_type": {
            "correct_cob_order": "Remaining patient liability can be $0 or very small",
            "incorrect_cob_order": "Claims denied, delayed, or you're billed as if uninsured",
            "medicare_secondary_payer_msp": "MSP violations result in Medicare paying incorrectly and seeking reimbursement from primary insurer (or patient)",
        },
        "consumer_tip": (
            "Tell every provider you have two insurance plans and provide both cards. "
            "For Medicare COB: verify whether Medicare is primary or secondary with your HR department. "
            "For children: apply the birthday rule (earlier birthday = primary parent's plan). "
            "If claims are being denied by the secondary insurer: ensure the primary insurer's "
            "Explanation of Benefits (EOB) is submitted with the secondary claim. "
            "Insurers have COB departments — call them directly if getting conflicting information."
        ),
        "related_triggers": ["coordination_of_benefits", "medicare_secondary_payer", "birthday_rule", "dual_coverage"],
        "related_cfr": "42 CFR §411.20-52 (Medicare Secondary Payer); NAIC COB Model Regulation",
        "consumer_risk_level": "Medium — billing errors are common when dual coverage is present",
    },
    {
        "id": "bil_017",
        "billing_category": "dme_billing",
        "title": "Durable Medical Equipment: Renting vs Buying, In-Network vs Mail-Order",
        "description": (
            "Your doctor prescribes a CPAP machine. The DME supplier bills it monthly as a rental "
            "for 13 months before you own it — or bills as a purchase. Your plan may require "
            "mail-order through a specific supplier, have tiered DME cost-sharing, or exclude "
            "certain DME entirely. Cost can vary from $0 to $2,000+ for the same device."
        ),
        "how_it_gets_coded": {
            "cpap_example": [
                {"hcpcs": "E0601", "description": "CPAP device — purchase"},
                {"hcpcs": "A7030", "description": "CPAP full face mask"},
                {"hcpcs": "A7037", "description": "CPAP tubing"},
                {"hcpcs": "A7034", "description": "CPAP mask cushion/pillow"},
            ],
            "billing_mechanism": "DME billed under HCPCS codes (not CPT); different benefit tier than office visits; may require Certificate of Medical Necessity (CMN)",
            "prior_auth": "Most insurers require PA for DME over specific cost threshold",
        },
        "cost_impact_by_plan_type": {
            "in_network_dme_supplier": "20% coinsurance or fixed DME copay after deductible",
            "out_of_network_supplier": "50% coinsurance or full cost; balance billing possible",
            "mail_order_requirement": "Many plans require mail-order for maintenance supplies — retail purchases not covered",
            "medicare_capped_rental": "Medicare: 13-month rental capped, then patient owns; commercial plans may differ",
        },
        "consumer_tip": (
            "Before purchasing any DME: (1) Verify your insurer has a preferred DME supplier network "
            "and use their suppliers. (2) Confirm PA is approved BEFORE device is delivered. "
            "(3) Ask specifically about ongoing supply coverage — CPAP supplies (masks, filters, tubing) "
            "are covered on different schedules and require separate orders. "
            "(4) If your insurer requires mail-order: use it or pay the price difference yourself. "
            "(5) Get the DME supplier's NPI and verify network status directly with insurer."
        ),
        "related_triggers": ["dme", "prior_authorization", "mail_order", "hcpcs_codes"],
        "related_cfr": "CMS DMEPOS Quality Standards; 42 CFR §414.202; prior auth for DME regulations",
        "consumer_risk_level": "Medium — DME billing errors very common; significant for chronically ill patients",
    },
    {
        "id": "bil_018",
        "billing_category": "inpatient_drug_billing",
        "title": "Hospital Drug Bills: Same Drug Costs 50x More in Hospital Than Pharmacy",
        "description": (
            "During a hospital stay, you receive a drug your pharmacy fills for $20/month. "
            "The hospital bills $1,000 for the same drug. Hospital 'chargemaster' prices for "
            "drugs are radically different from retail pharmacy prices. "
            "Inpatient drugs are included in the DRG (all-inclusive hospital billing) for Medicare — "
            "but for commercial insurance, drugs may be separately itemized and billed."
        ),
        "how_it_gets_coded": {
            "inpatient_drug_codes": {"hcpcs": "J-codes (injectable drugs)", "note": "J2185 = methotrexate injection; J0585 = botulinum toxin"},
            "drg_bundling": "Medicare bundles all inpatient drugs into DRG payment — no separate drug billing for Part A",
            "commercial_billing": "Commercial insurers may allow separate drug billing within inpatient claims or include in per-diem rate",
            "chargemaster": "Hospital chargemaster prices are list prices, often 2-50x actual acquisition cost",
        },
        "cost_impact_by_plan_type": {
            "drg_bundle_plans": "Drugs included in inpatient stay — patient pays single admission copay",
            "per_diem_plans": "Drugs included in daily room rate",
            "itemized_billing": "Each drug billed separately at chargemaster price — significant cost accumulation",
            "oop_maximum_protection": "All in-network costs eventually count toward MOOP — provides ceiling",
        },
        "consumer_tip": (
            "During a hospital stay: request your itemized bill upon discharge. "
            "Review all drug charges for accuracy — hospitals commonly bill for drugs not administered "
            "or at incorrect quantities. A study found 80% of hospital bills contain errors. "
            "If you see charges for drugs you brought from home or that weren't administered, "
            "dispute with the hospital billing office directly. "
            "If a drug charge seems excessive, hospital financial counselors can often negotiate "
            "or waive charges based on financial hardship."
        ),
        "related_triggers": ["hospital_drug_billing", "drg", "chargemaster", "inpatient_billing"],
        "related_cfr": "CMS Hospital Price Transparency Final Rule (45 CFR §180); ACA §2718",
        "consumer_risk_level": "Medium — high dollar impact for hospital stays; billing errors common",
    },
    {
        "id": "bil_019",
        "billing_category": "cob_fsa_hsa",
        "title": "FSA vs HSA: Using Pre-Tax Accounts Strategically with Deductibles",
        "description": (
            "You have a $3,000 HDHP deductible and both an HSA ($4,150 max contribution) and "
            "a Flexible Spending Account at your employer. Using the wrong account at the wrong "
            "time — or combining incompatible accounts — can cause IRS penalties or waste tax savings."
        ),
        "how_it_gets_coded": {
            "hsa_eligible_plans": "Must be enrolled in HDHP (2026: deductible ≥$1,650 individual, $3,300 family)",
            "fsa_vs_hsa_difference": {
                "hsa": "Rolls over indefinitely; owned by you; invest funds; can't have other first-dollar health coverage",
                "fsa": "Use-it-or-lose-it (up to $640 rollover allowed); employer-owned; immediate full access",
                "incompatibility": "General-purpose FSA + HSA = IRS violation; limited-purpose FSA (dental/vision only) IS compatible with HSA",
            },
            "contribution_limits_2026": {"hsa_individual": 4300, "hsa_family": 8550, "hsa_catch_up_55plus": 1000, "fsa_health": 3300},
        },
        "cost_impact_by_plan_type": {
            "hsa_tax_benefit": "Federal income tax deduction + payroll tax savings + tax-free growth = ~35-40% effective discount",
            "fsa_tax_benefit": "Federal income tax deduction only = ~25-32% effective discount (no investment growth)",
            "wrong_account_penalty": "Contributing to HSA while enrolled in general FSA: 6% IRS excise tax on excess contributions + income tax",
        },
        "consumer_tip": (
            "If you have an HDHP and your employer offers a general-purpose FSA: "
            "DO NOT enroll in the general FSA — it disqualifies your HSA. Ask for a 'limited-purpose FSA' "
            "instead (covers dental and vision only, compatible with HSA). "
            "HSA strategy: contribute the maximum annually, invest HSA funds in index funds, "
            "pay current medical bills out-of-pocket (if you can afford it) and save receipts — "
            "you can reimburse yourself years later tax-free. "
            "The HSA is the only triple-tax-advantaged account in the U.S. tax code."
        ),
        "related_triggers": ["hsa", "fsa", "hdhp", "tax_advantaged_accounts", "irs_contribution_limits"],
        "related_cfr": "IRC §223 (HSA); IRC §125 (FSA/Cafeteria Plan); IRS Publication 969",
        "consumer_risk_level": "Medium — tax penalty risk if accounts used incorrectly",
    },
    {
        "id": "bil_020",
        "billing_category": "surprise_billing_protections",
        "title": "Good Faith Estimate: Your Right to Know Cost Before Treatment",
        "description": (
            "Under the No Surprises Act, uninsured patients and insured patients scheduling "
            "non-emergency services at least 3 days in advance are entitled to a Good Faith "
            "Estimate (GFE). If the actual bill exceeds the GFE by more than $400, you can "
            "dispute it via the patient-provider dispute resolution process."
        ),
        "how_it_gets_coded": {
            "gfe_requirements": {
                "who_must_provide": "Providers and facilities upon scheduling or upon patient request",
                "timeframe": "Within 1 business day if scheduling 3+ days out; within 3 days if scheduling 10+ days out",
                "what_included": "All reasonably expected items and services; list of providers involved; NPI numbers; diagnosis codes; expected charges",
                "format": "Written (paper or electronic); must be in plain language",
            },
            "dispute_process": "If bill >$400 above GFE: file through CMS patient-provider dispute resolution (PPDR) within 120 days of bill",
        },
        "cost_impact_by_plan_type": {
            "uninsured": "GFE is the primary cost protection tool; dispute resolution available",
            "insured": "GFE + EOB comparison; dispute resolution for discrepancies >$400",
            "advanced_eob": "Insured patients must receive Advanced EOB from insurer before scheduled services in some states",
        },
        "consumer_tip": (
            "Before ANY non-emergency procedure: ask your provider for a Good Faith Estimate in writing. "
            "They are legally required to provide one. Keep the GFE document. "
            "When you receive your final bill: compare every line item to the GFE. "
            "If the total exceeds the GFE by more than $400: "
            "(1) First, try to resolve directly with the provider, "
            "(2) If unresolved, file via CMS patient-provider dispute resolution (search 'CMS PPDR'), "
            "(3) File within 120 days of receiving the bill. "
            "The arbitrator will determine fair payment based on the GFE."
        ),
        "related_triggers": ["good_faith_estimate", "no_surprises_act", "patient_rights", "billing_dispute"],
        "related_cfr": "No Surprises Act §2799B-6; 45 CFR §149.610; CMS PPDR final rule",
        "consumer_risk_level": "Low — consumer protection tool; exercise these rights proactively",
    },
]


def validate_scenarios(records: list[dict[str, Any]]) -> None:
    """Validate billing scenario records."""
    required = {"id", "billing_category", "title", "description", "how_it_gets_coded",
                "cost_impact_by_plan_type", "consumer_tip", "related_triggers", "related_cfr"}
    ids: set[str] = set()
    for r in records:
        missing = required - r.keys()
        assert not missing, f"{r.get('id')} missing: {missing}"
        assert r["id"] not in ids, f"Duplicate ID: {r['id']}"
        ids.add(r["id"])
    logger.info(f"  Validation passed: {len(records)} scenarios")


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    records = BILLING_SCENARIOS
    logger.info(f"Billing scenarios defined: {len(records)}")
    validate_scenarios(records)

    from collections import Counter
    cat_counts = Counter(r["billing_category"] for r in records)
    logger.info("Category breakdown:")
    for cat, n in sorted(cat_counts.items()):
        logger.info(f"  {cat}: {n}")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output = {
        "metadata": {
            "source": "HealthInsuranceRenew billing intelligence (PY2026)",
            "plan_year": 2026,
            "record_count": len(records),
            "categories": dict(cat_counts),
            "cpt_code_disclaimer": "CPT codes © American Medical Association. Codes provided for educational reference only.",
            "disclaimer": "For informational purposes only. Billing codes and plan coverage vary. Consult your insurer or a licensed agent.",
            "generated_at": datetime.datetime.now().isoformat(),
            "schema_version": "1.0",
        },
        "data": records,
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2, default=str)
    size_kb = OUTPUT_PATH.stat().st_size / 1000
    logger.info(f"Saved {len(records)} billing scenarios ({size_kb:.1f} KB) to {OUTPUT_PATH}")

    print(f"\nSaved {len(records)} billing intelligence scenarios to {OUTPUT_PATH}")
    print(f"\nSample scenario:")
    print(json.dumps(records[0], indent=2))


if __name__ == "__main__":
    main()
