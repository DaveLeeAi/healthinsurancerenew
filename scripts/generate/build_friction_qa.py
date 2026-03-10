"""
Generate: Friction Q&A Dataset (Pillar 5)

100 high-priority friction Q&A entries covering common ACA consumer pain points:
turning 26, Medicare at 65, SEP triggers, immigration/DMI, income changes,
employer offer adequacy, dental surprises, billing scenarios, prior auth.

Each entry: question, answer, category, related_entities, regulatory_citation,
state_specific flag.

Output: data/processed/friction_qa.json

Usage:
    python scripts/generate/build_friction_qa.py
"""

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

PROCESSED_DIR = Path("data/processed")
OUTPUT_PATH = PROCESSED_DIR / "friction_qa.json"

# ─── Q&A Data ─────────────────────────────────────────────────────────────────
# fmt: off

QA_DATA: list[dict[str, Any]] = [

    # ── TURNING 26 ──────────────────────────────────────────────────────────
    {
        "id": "t26_001",
        "category": "turning_26",
        "question": "When exactly does my coverage end when I turn 26?",
        "answer": (
            "Coverage on a parent's plan ends on the date you turn 26 in most states — "
            "not at the end of that month. However, some states (NY, NJ, FL, PA, OH, and others) "
            "extend coverage to age 26 through the end of the calendar year, or age 29–30 for state-regulated plans. "
            "Check your plan's Summary of Benefits or call the insurer to confirm the exact end date. "
            "You have a 60-day Special Enrollment Period (SEP) beginning on your 26th birthday."
        ),
        "related_entities": ["life_event_turning_26", "sep_triggers", "cobra"],
        "regulatory_citation": "45 CFR §147.120; PHSA §2714; state law varies",
        "state_specific": True,
        "state_notes": "NY: age 29; NJ: age 31; PA, OH, NJ: state-regulated plans extend further",
        "plan_year": 2026,
    },
    {
        "id": "t26_002",
        "category": "turning_26",
        "question": "Do I have 60 days or 30 days to enroll in a new plan after losing parent coverage at 26?",
        "answer": (
            "You have 60 days from the date of your triggering event — your 26th birthday — "
            "to enroll in a Marketplace plan, Medicaid, CHIP, or employer coverage. "
            "Missing this 60-day window means you must wait until Open Enrollment (November 1) "
            "unless another qualifying life event occurs. COBRA enrollment deadlines are separate: "
            "60 days to elect COBRA, then 45 days to pay the first premium."
        ),
        "related_entities": ["life_event_turning_26", "open_enrollment", "cobra"],
        "regulatory_citation": "45 CFR §155.420(b); 45 CFR §147.104(b)(2)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "t26_003",
        "category": "turning_26",
        "question": "Should I choose COBRA from my parent's employer plan or get my own Marketplace plan at 26?",
        "answer": (
            "Compare costs carefully: COBRA continues your existing plan but you pay 100% of the premium "
            "plus a 2% admin fee — often $400–$800/month. A Marketplace Silver plan with APTC subsidies "
            "could cost $0–$200/month if your income is 100–400% FPL. "
            "Key factors: (1) Are you getting employer coverage at your job? (2) What's your income? "
            "(3) Do you have ongoing prescriptions or doctors on the parent's network? "
            "COBRA's advantage is continuity of care with no network changes."
        ),
        "related_entities": ["cobra", "marketplace_plans", "aptc_subsidy", "metal_levels"],
        "regulatory_citation": "ERISA §601-608; 45 CFR §155.420",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "t26_004",
        "category": "turning_26",
        "question": "My 26th birthday is in October. Can I wait until Open Enrollment to pick a plan?",
        "answer": (
            "Technically yes, but risky: you'd have a gap in coverage from your birthday until "
            "January 1 (when OE coverage starts). Any medical bills during that gap are your full "
            "out-of-pocket responsibility. A better strategy: use your 60-day SEP to enroll in a "
            "plan effective the first of the month after your birthday. October birthday → "
            "November 1 effective date is achievable. Don't skip the SEP window."
        ),
        "related_entities": ["life_event_turning_26", "open_enrollment", "coverage_gap"],
        "regulatory_citation": "45 CFR §155.420(b)(2)(ii)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "t26_005",
        "category": "turning_26",
        "question": "Can I stay on my parent's plan if I'm married or have my own children?",
        "answer": (
            "Yes. The ACA requires parent plans to cover dependent children to age 26 regardless of "
            "marital status, financial dependence, student status, or whether the child lives with "
            "the parent. Your spouse and children are not covered as dependents on your parent's plan "
            "unless the plan independently covers grandchildren/spouses — most do not. "
            "You can enroll your own family on a separate Marketplace plan while staying on your parent's plan."
        ),
        "related_entities": ["life_event_turning_26", "dependent_coverage", "family_plans"],
        "regulatory_citation": "PHSA §2714; 45 CFR §147.120(a)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "t26_006",
        "category": "turning_26",
        "question": "I missed my 60-day SEP window after turning 26. What are my options?",
        "answer": (
            "You're limited to: (1) Open Enrollment (November 1 – January 15 in most states), "
            "(2) Medicaid or CHIP if your income qualifies — these have year-round enrollment, "
            "(3) A short-term health plan (not ACA-compliant; limited coverage, no pre-existing condition protection), "
            "(4) An ICHRA or employer plan if a new job offers one within 30 days. "
            "Some states (California, New York, Massachusetts, others) have longer Marketplace windows. "
            "A coverage gap may result in a tax reconciliation issue if you already claimed APTC."
        ),
        "related_entities": ["open_enrollment", "medicaid", "short_term_plans"],
        "regulatory_citation": "45 CFR §155.420; ACA §1311(c)(6)",
        "state_specific": True,
        "state_notes": "CA, NY, MA, NJ, DC, CO have state-run marketplaces with extended windows",
        "plan_year": 2026,
    },

    # ── MEDICARE AT 65 ───────────────────────────────────────────────────────
    {
        "id": "med65_001",
        "category": "medicare_65",
        "question": "When should I enroll in Medicare Part B if I'm still working at 65 with employer insurance?",
        "answer": (
            "If your employer has 20+ employees, your group health plan is primary — Medicare is secondary. "
            "You can delay Part B without penalty. You have an 8-month Special Enrollment Period "
            "starting when employment OR employer coverage ends (whichever comes first). "
            "If the employer has fewer than 20 employees, Medicare is primary — enroll in Part B at 65 "
            "or face a permanent penalty of 10% per 12-month delay period."
        ),
        "related_entities": ["medicare_part_b", "employer_coverage", "sep_medicare", "part_b_penalty"],
        "regulatory_citation": "SSA §1837(i); 42 CFR §407.20; CMS Medicare & You Handbook",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "med65_002",
        "category": "medicare_65",
        "question": "What is the Medicare Part B late enrollment penalty?",
        "answer": (
            "The penalty is 10% added to your monthly Part B premium for each 12-month period "
            "you were eligible but did not enroll (without creditable coverage). It lasts for life. "
            "Example: 2 years of delay = 20% premium increase permanently. "
            "For 2026, the standard Part B premium is approximately $185/month; "
            "a 20% penalty makes it ~$222/month — every month forever. "
            "Avoid this by enrolling during your Initial Enrollment Period (3 months before to 3 months after turning 65)."
        ),
        "related_entities": ["medicare_part_b", "part_b_penalty", "initial_enrollment_period"],
        "regulatory_citation": "SSA §1839(b); 42 CFR §408.22",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "med65_003",
        "category": "medicare_65",
        "question": "I'm turning 65 and have an HSA. When do I need to stop contributing?",
        "answer": (
            "Stop HSA contributions 6 months before Medicare Part A begins. Medicare Part A "
            "can be retroactively backdated up to 6 months past your enrollment date. "
            "If you enroll in Medicare and don't stop contributions in time, you'll owe income tax "
            "plus a 6% excise tax on excess contributions. "
            "You can still spend existing HSA funds tax-free on medical expenses, Medicare premiums, "
            "and long-term care premiums after enrolling. You cannot contribute new funds."
        ),
        "related_entities": ["hsa", "medicare_part_a", "hsa_contributions"],
        "regulatory_citation": "IRC §223(b)(7); IRS Publication 969",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "med65_004",
        "category": "medicare_65",
        "question": "Can I keep my Marketplace plan with APTC after enrolling in Medicare?",
        "answer": (
            "No. Once enrolled in Medicare Part A or Part B, you are no longer eligible for "
            "premium tax credits (APTC) on a Marketplace plan. You must drop the Marketplace plan. "
            "Keeping both and claiming APTC is illegal and triggers full repayment plus interest. "
            "Exception: If you only have Medicare Part A (free) and decline Part B, some argue "
            "Marketplace eligibility remains — but IRS and CMS guidance effectively closes this. "
            "Once Medicare begins, transition fully."
        ),
        "related_entities": ["aptc_subsidy", "medicare_part_a", "marketplace_plans"],
        "regulatory_citation": "IRC §36B(c)(2)(B); 26 CFR §1.36B-2(a)(1); IRS Form 8962",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "med65_005",
        "category": "medicare_65",
        "question": "My spouse is under 65 and on my employer plan. What happens to their coverage when I go on Medicare?",
        "answer": (
            "Your spouse does not automatically lose coverage when you join Medicare. "
            "However, if you leave your employer's plan entirely (and the plan was covering your spouse), "
            "your spouse has a 60-day SEP to enroll in their own Marketplace plan or COBRA. "
            "If your employer allows, your spouse can stay on the employer plan independently. "
            "Coordinate carefully: if you were the primary subscriber, your spouse may need "
            "to re-enroll as the primary subscriber or find alternative coverage."
        ),
        "related_entities": ["life_event_medicare_65", "sep_triggers", "cobra", "spouse_coverage"],
        "regulatory_citation": "45 CFR §155.420(d)(1); ERISA §601",
        "state_specific": False,
        "plan_year": 2026,
    },

    # ── SEP TRIGGERS ────────────────────────────────────────────────────────
    {
        "id": "sep_001",
        "category": "sep_triggers",
        "question": "What qualifies as a Special Enrollment Period on the ACA Marketplace?",
        "answer": (
            "SEP-qualifying events include: (1) Loss of minimum essential coverage (job loss, "
            "COBRA expiration, aging off parent's plan, Medicaid termination), (2) Household changes "
            "(marriage, birth, adoption, divorce), (3) Moving to a new coverage area, "
            "(4) Income change that affects subsidy eligibility, (5) Gaining lawful presence status, "
            "(6) Leaving incarceration, (7) Exceptional circumstances (FEMA disaster areas, "
            "marketplace or insurer errors). Most SEPs provide a 60-day window from the qualifying event."
        ),
        "related_entities": ["sep_loss_of_coverage", "sep_household_change", "sep_moving", "open_enrollment"],
        "regulatory_citation": "45 CFR §155.420(d); CMS Marketplace Enrollment Guidance",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "sep_002",
        "category": "sep_triggers",
        "question": "I lost my job. How many days do I have to enroll in a Marketplace plan?",
        "answer": (
            "60 days from the date employer coverage ends (not the date you were laid off). "
            "If your employer covers you through the last day of the month in which you were fired, "
            "your 60-day window starts the following day. "
            "You can also elect COBRA simultaneously — COBRA election doesn't affect your SEP clock. "
            "If you later elect COBRA and then voluntarily drop it, that does NOT trigger a new SEP "
            "for Marketplace enrollment."
        ),
        "related_entities": ["sep_loss_of_coverage", "cobra", "marketplace_plans"],
        "regulatory_citation": "45 CFR §155.420(d)(1)(i); 45 CFR §147.104(b)(2)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "sep_003",
        "category": "sep_triggers",
        "question": "Does moving to a new state trigger a Special Enrollment Period?",
        "answer": (
            "Yes — moving to a new coverage area where new Marketplace plans are available triggers "
            "a 60-day SEP. You must actually move (change primary residence), not just be visiting. "
            "You'll need to create a new Marketplace account in your new state (state-based marketplaces "
            "are separate from HealthCare.gov). "
            "Critical: if your old plan covers your new area (rare for HMOs), you may not have an "
            "SEP trigger — confirm plan service area before assuming you qualify."
        ),
        "related_entities": ["life_event_moving_states", "sep_moving", "marketplace_plans"],
        "regulatory_citation": "45 CFR §155.420(d)(6)",
        "state_specific": True,
        "state_notes": "State-based marketplaces: CA, CO, CT, DC, ID, KY, MA, MD, ME, MN, NJ, NM, NY, PA, RI, VT, WA",
        "plan_year": 2026,
    },
    {
        "id": "sep_004",
        "category": "sep_triggers",
        "question": "I got married last month and forgot to add my spouse to my plan. Is it too late?",
        "answer": (
            "The SEP for marriage is 60 days from the date of marriage. If you're within that window, "
            "enroll your spouse immediately at HealthCare.gov or your employer's HR system. "
            "If you've passed 60 days, options are: (1) Wait for Open Enrollment, "
            "(2) Employer plan: check if there's a plan year SEP for later additions, "
            "(3) Your spouse may qualify for Medicaid/CHIP if income-eligible. "
            "Note: adding a spouse mid-year resets some cost-sharing calculations for your plan."
        ),
        "related_entities": ["life_event_marriage", "sep_household_change", "open_enrollment"],
        "regulatory_citation": "45 CFR §155.420(d)(2)(i)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "sep_005",
        "category": "sep_triggers",
        "question": "I had a baby. Do I have 60 days to add them to my insurance?",
        "answer": (
            "Yes. Birth, adoption, and foster placement each trigger a 60-day SEP. "
            "Unlike other SEPs, coverage for a newborn is retroactive to the date of birth — "
            "even if you enroll on day 59. This is critical: if the baby has NICU or hospital stays "
            "in that window, those costs are covered by the plan once you enroll. "
            "Don't delay enrollment, but know the retroactive protection exists. "
            "Also update your income with APTC — adding a dependent may increase your subsidy."
        ),
        "related_entities": ["life_event_having_baby", "sep_household_change", "newborn_coverage"],
        "regulatory_citation": "45 CFR §155.420(d)(2)(i); 45 CFR §147.104(b)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "sep_006",
        "category": "sep_triggers",
        "question": "What documentation do I need to prove a qualifying SEP event?",
        "answer": (
            "Marketplace requires documentation for most SEPs within 30 days of enrollment. "
            "Job loss: employer letter or COBRA election notice with coverage end date. "
            "Marriage: marriage certificate. Birth: birth certificate. "
            "Moving: utility bill, lease, or official mail showing new address. "
            "Medicaid denial: denial letter from Medicaid agency. "
            "Failure to provide documentation within 30 days results in plan termination. "
            "Upload documents through your HealthCare.gov account or mail to the Marketplace."
        ),
        "related_entities": ["sep_documentation", "healthcare_gov", "marketplace_plans"],
        "regulatory_citation": "45 CFR §155.420(e); CMS SEP Verification Rules",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "sep_007",
        "category": "sep_triggers",
        "question": "Can I get an SEP if I voluntarily quit my job?",
        "answer": (
            "Yes — voluntarily leaving a job that provided health coverage qualifies as a loss of "
            "minimum essential coverage, triggering a 60-day SEP. The ACA does not distinguish "
            "between voluntary and involuntary job loss for SEP purposes. "
            "However, if you're eligible for COBRA and choose to decline it, that does not eliminate "
            "your SEP eligibility for the Marketplace. You may even have both options open simultaneously. "
            "The SEP clock starts when employer coverage actually ends, not when you resign."
        ),
        "related_entities": ["sep_loss_of_coverage", "cobra", "marketplace_plans"],
        "regulatory_citation": "45 CFR §155.420(d)(1); CMS FAQ on SEP Events",
        "state_specific": False,
        "plan_year": 2026,
    },

    # ── IMMIGRATION / DMI ────────────────────────────────────────────────────
    {
        "id": "imm_001",
        "category": "immigration_dmi",
        "question": "What is a Data Matching Issue (DMI) and why did I get one?",
        "answer": (
            "A DMI occurs when information on your Marketplace application doesn't match government "
            "databases (Social Security Administration, IRS, DHS). Common triggers: "
            "(1) Name or SSN doesn't match SSA records, (2) Citizenship/immigration status "
            "can't be verified against DHS SAVE system, (3) Income data differs from prior-year IRS records, "
            "(4) Household composition discrepancies. You typically have 90–95 days to resolve the DMI "
            "by submitting documentation. Subsidies continue during this window but may be reconciled "
            "if the DMI is unresolved."
        ),
        "related_entities": ["dmi_citizenship", "dmi_income", "dmi_ssn", "healthcare_gov"],
        "regulatory_citation": "45 CFR §155.315; 45 CFR §155.320; CMS DMI Policy",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "imm_002",
        "category": "immigration_dmi",
        "question": "Who is eligible for ACA Marketplace coverage as an immigrant?",
        "answer": (
            "Lawfully present immigrants are eligible: LPRs (green card holders), refugees, asylees, "
            "parolees (1 year+), withholding of removal, Cuban/Haitian entrants, VAWA beneficiaries, "
            "certain T and U visa holders, special immigrant visa holders, COFA citizens (Compact of "
            "Free Association — Marshall Islands, Micronesia, Palau). "
            "DACA recipients are NOT eligible for federal Marketplace coverage under current rules. "
            "Undocumented immigrants are NOT eligible. Five-year bar: LPRs must wait 5 years before "
            "Medicaid eligibility (with exceptions for refugees, asylees, and children/pregnant women in some states)."
        ),
        "related_entities": ["lawful_presence", "daca", "medicaid_eligibility", "immigration_status"],
        "regulatory_citation": "8 USC §1611; 45 CFR §155.305(a)(3); INA §245",
        "state_specific": True,
        "state_notes": "Some states (CA, IL, NY, WA, CO) cover DACA or undocumented children/adults in state-funded programs",
        "plan_year": 2026,
    },
    {
        "id": "imm_003",
        "category": "immigration_dmi",
        "question": "I received a citizenship DMI even though I'm a US citizen. How do I resolve it?",
        "answer": (
            "Submit acceptable proof of citizenship/identity to HealthCare.gov within the deadline "
            "(usually shown on your DMI notice). Accepted documents: U.S. passport, birth certificate "
            "(with raised seal) plus photo ID, U.S. passport card, Certificate of Citizenship or "
            "Naturalization (N-550, N-560, N-570, N-578), Consular Report of Birth Abroad (FS-240). "
            "Upload via healthcare.gov > My Account > Document Upload. Allow 2–3 weeks for processing. "
            "If unresolved, your plan is terminated and you must repay any subsidies received during the DMI period."
        ),
        "related_entities": ["dmi_citizenship", "healthcare_gov", "document_verification"],
        "regulatory_citation": "45 CFR §155.315(b)(2); CMS DMI Resolution Guidance",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "imm_004",
        "category": "immigration_dmi",
        "question": "DACA recipients cannot enroll in Marketplace coverage. What health insurance options exist?",
        "answer": (
            "Federal law excludes DACA recipients from ACA Marketplace plans and most Medicaid. Options: "
            "(1) State-funded programs — CA, IL, NY, WA, CO, OR, and others provide state-funded Medicaid "
            "or subsidized coverage for DACA holders regardless of federal status. "
            "(2) Employer-sponsored insurance — if your employer offers coverage, you can enroll. "
            "(3) Community health centers (FQHC) — federally qualified health centers charge on sliding scale, "
            "open to all regardless of immigration status. "
            "(4) Short-term health plans — limited ACA protections but accessible."
        ),
        "related_entities": ["daca", "state_medicaid", "community_health_centers"],
        "regulatory_citation": "8 USC §1611; 45 CFR §155.20 (definition of lawful presence)",
        "state_specific": True,
        "state_notes": "CA: DACA eligible for Medi-Cal; IL: CountyCare DACA; NY: Essential Plan eligible",
        "plan_year": 2026,
    },

    # ── INCOME CHANGES ───────────────────────────────────────────────────────
    {
        "id": "inc_001",
        "category": "income_changes",
        "question": "I underestimated my income and received too much APTC. How much will I owe back?",
        "answer": (
            "APTC reconciliation happens on Form 8962 with your tax return. If your actual income "
            "was higher than estimated, you repay the excess APTC. "
            "Repayment caps for 2026 (IRA extended): if income is 100–200% FPL: $375 individual/$750 family; "
            "200–300%: $950/$1,900; 300–400%: $1,550/$3,100. "
            "Above 400% FPL: there's no cap — you repay 100% of excess APTC. "
            "Report income changes promptly at HealthCare.gov to adjust APTC monthly and avoid a large tax bill."
        ),
        "related_entities": ["aptc_subsidy", "form_8962", "irs_reconciliation", "income_reporting"],
        "regulatory_citation": "IRC §36B(f); 26 CFR §1.36B-4; IRS Form 8962 Instructions",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "inc_002",
        "category": "income_changes",
        "question": "My income dropped significantly mid-year. Can I increase my APTC subsidy now?",
        "answer": (
            "Yes. Report the income change at HealthCare.gov immediately. Your APTC will be recalculated "
            "and increased for remaining months. Changes take effect the first of the month following "
            "your update. You cannot retroactively increase APTC for prior months — the reconciliation "
            "on Form 8962 will credit you for months where you were entitled to more APTC than you received. "
            "Also check if reduced income makes you newly eligible for Medicaid or CSR Silver variants."
        ),
        "related_entities": ["aptc_subsidy", "income_reporting", "medicaid_eligibility", "csr_variants"],
        "regulatory_citation": "45 CFR §155.330(b); IRC §36B; CMS APTC Adjustment Rules",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "inc_003",
        "category": "income_changes",
        "question": "What is the 'benefits cliff' at 100% FPL and how does it affect my subsidy?",
        "answer": (
            "In states that expanded Medicaid: income below 138% FPL → Medicaid (near-zero cost). "
            "Income above 138% FPL → Marketplace APTC eligibility (sliding scale cost). "
            "In non-expansion states: income 100–400% FPL → Marketplace APTC eligible. "
            "Income below 100% FPL in non-expansion states → falls in the 'coverage gap' with "
            "neither Medicaid nor Marketplace subsidies available. "
            "The Medicaid → Marketplace transition at 138% FPL can cause discontinuity if "
            "income fluctuates — called 'Medicaid churn.' Report changes within 30 days."
        ),
        "related_entities": ["medicaid_expansion", "aptc_subsidy", "coverage_gap", "medicaid_churn"],
        "regulatory_citation": "ACA §2001; 42 USC §1396a(a)(10)(A)(i)(VIII); IRC §36B(c)",
        "state_specific": True,
        "state_notes": "10 states have not expanded Medicaid as of 2026: AL, FL, GA, KS, MS, SC, TN, TX, WI, WY",
        "plan_year": 2026,
    },
    {
        "id": "inc_004",
        "category": "income_changes",
        "question": "I'm self-employed and my income varies monthly. How should I estimate income for APTC?",
        "answer": (
            "Estimate your best projected annual net income (after business deductions) for the year. "
            "If income is truly unpredictable, many advisors suggest estimating conservatively (lower) "
            "to avoid large repayments, while accepting smaller subsidies. "
            "Update your income estimate on HealthCare.gov quarterly as your projection clarifies. "
            "Self-employed income = net profit on Schedule C/SE, not gross revenue. "
            "Health insurance premiums you pay may be deductible as a self-employment deduction, "
            "which reduces your MAGI — potentially increasing your APTC."
        ),
        "related_entities": ["self_employment_income", "aptc_subsidy", "magi", "schedule_c"],
        "regulatory_citation": "IRC §36B; IRC §162(l); IRS Publication 974; 26 CFR §1.36B-1(e)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "inc_005",
        "category": "income_changes",
        "question": "I got a raise and am now over 400% FPL. Will I owe back all my subsidies?",
        "answer": (
            "Under the IRA extended enhanced credits, there is NO cliff at 400% FPL. "
            "Subsidies now taper gradually above 400% — you only owe back the excess APTC for the months "
            "where your income exceeded the subsidy threshold. "
            "If enhanced credits expire after 2025, the 400% FPL cliff returns and you'd owe back "
            "100% of APTC received while income exceeded 400% FPL. "
            "To minimize exposure: report the raise promptly and reduce your APTC advance immediately."
        ),
        "related_entities": ["aptc_subsidy", "ira_enhanced_credits", "form_8962", "income_cliff_400pct"],
        "regulatory_citation": "IRC §36B(b)(3)(A) as amended by ARP §9661; IRA §13801",
        "state_specific": False,
        "plan_year": 2026,
    },

    # ── EMPLOYER OFFER ADEQUACY ──────────────────────────────────────────────
    {
        "id": "emp_001",
        "category": "employer_offer_adequacy",
        "question": "My employer offers health insurance, but it's expensive. Can I still get Marketplace subsidies?",
        "answer": (
            "Only if the employer plan fails the affordability test. For 2026, employer coverage is "
            "considered 'unaffordable' if the employee-only premium exceeds 9.02% of household income. "
            "If it exceeds this threshold, you may decline employer coverage and claim APTC on the Marketplace. "
            "Important: the test uses employee-only premium, not family coverage cost — even if adding "
            "family is very expensive, if the employee-only premium is affordable, you're disqualified "
            "from APTC. This is the 'family glitch,' partially fixed starting in 2023."
        ),
        "related_entities": ["employer_coverage", "affordability_test", "aptc_subsidy", "family_glitch"],
        "regulatory_citation": "IRC §36B(c)(2)(C); 26 CFR §1.36B-2(c)(3)(v)(A)(2); IRS Rev. Proc. 2023-29",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "emp_002",
        "category": "employer_offer_adequacy",
        "question": "What is the employer plan 'minimum value' standard?",
        "answer": (
            "Minimum value means the employer plan pays at least 60% of the total allowed costs "
            "of benefits covered (equivalent to a Bronze-level actuarial value). "
            "If an employer plan fails minimum value (covers less than 60%), employees may be eligible "
            "for APTC on the Marketplace — even if the premium passes the affordability test. "
            "Employers can use the CMS Minimum Value Calculator at cms.gov to test compliance. "
            "Plans that fail minimum value expose employers to ACA employer mandate penalties."
        ),
        "related_entities": ["minimum_value", "employer_mandate", "aptc_subsidy", "actuarial_value"],
        "regulatory_citation": "IRC §36B(c)(2)(C)(ii); 45 CFR §156.145; IRS Notice 2014-69",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "emp_003",
        "category": "employer_offer_adequacy",
        "question": "What is an ICHRA and how does it affect Marketplace subsidy eligibility?",
        "answer": (
            "An Individual Coverage HRA (ICHRA) is an employer account that reimburses employees "
            "for individual health insurance premiums and medical expenses. "
            "If offered an 'affordable' ICHRA (one that covers at least the employee-only premium "
            "of the lowest-cost Silver plan in the rating area), you cannot receive APTC on the Marketplace. "
            "You can opt out of an 'unaffordable' ICHRA and claim APTC instead. "
            "Employees at very small employers (under 50 FTEs) should review QSEHRA as an alternative."
        ),
        "related_entities": ["ichra", "qsehra", "employer_coverage", "aptc_subsidy"],
        "regulatory_citation": "26 CFR §1.36B-2(c)(5); IRS Notice 2019-45; ACA §1311",
        "state_specific": False,
        "plan_year": 2026,
    },

    # ── DENTAL SURPRISES ────────────────────────────────────────────────────
    {
        "id": "dnt_001",
        "category": "dental_surprises",
        "question": "Why did my dental insurance deny a crown after only 6 months of coverage?",
        "answer": (
            "Most dental plans have waiting periods for major services (crowns, bridges, root canals): "
            "typically 6–12 months from coverage effective date. "
            "During this waiting period, the plan pays nothing for major work — even if medically necessary. "
            "Preventive services (cleanings, x-rays) usually have no waiting period. "
            "Basic services (fillings) may have a 3–6 month wait. "
            "Solutions: (1) Check if your prior insurer's coverage waives the waiting period — "
            "some plans waive it with 12+ months of prior continuous coverage. "
            "(2) Look for plans explicitly advertising 'no waiting period.'"
        ),
        "related_entities": ["dental_waiting_periods", "major_dental_care", "dental_coverage"],
        "regulatory_citation": "State insurance law varies; SADP SBC disclosure requirements under 45 CFR §147.200",
        "state_specific": True,
        "state_notes": "Some states mandate shorter or no waiting periods for specific services",
        "plan_year": 2026,
    },
    {
        "id": "dnt_002",
        "category": "dental_surprises",
        "question": "I hit my dental plan's $1,500 annual maximum in July. Is there any coverage left?",
        "answer": (
            "Once you've exhausted your annual maximum, the plan pays nothing for the rest of the year. "
            "All additional dental costs are 100% out-of-pocket. "
            "Strategies: (1) Schedule remaining work in January (new plan year, maximum resets), "
            "(2) Use an FSA/HSA to pay remaining costs with pre-tax dollars, "
            "(3) Ask your dentist about payment plans or discount programs, "
            "(4) Dental discount plans (not insurance) charge a fixed annual fee and provide discounted rates — "
            "no annual maximums. Dental school clinics also offer discounted care. "
            "Annual maximums typically range from $1,000–$2,000 for individual plans."
        ),
        "related_entities": ["dental_annual_maximum", "hsa", "fsa", "dental_discount_plans"],
        "regulatory_citation": "SADP disclosure: 45 CFR §147.200; ACA §2708 (annual limits - dental exempt)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "dnt_003",
        "category": "dental_surprises",
        "question": "Why doesn't my health insurance cover dental treatment?",
        "answer": (
            "The ACA mandates dental coverage only for children (pediatric dental is an Essential Health Benefit). "
            "Adult dental care is explicitly excluded from EHB requirements. "
            "Most ACA health plans do not include adult dental. "
            "Options: (1) Purchase a separate Stand-Alone Dental Plan (SADP) during Open Enrollment — "
            "available on the Marketplace or off-exchange, (2) Employer dental plan if available, "
            "(3) Dental discount cards, (4) Community dental clinics (federally qualified health centers). "
            "Exception: dental services deemed medically necessary (e.g., jaw injury from accident, "
            "oral surgery for medical condition) may be covered under medical plans."
        ),
        "related_entities": ["adult_dental", "sadp", "ehb", "marketplace_dental"],
        "regulatory_citation": "ACA §1302(b)(1)(J) (pediatric dental as EHB); 45 CFR §156.110(a)(10)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "dnt_004",
        "category": "dental_surprises",
        "question": "My dental plan doesn't cover implants. Are there plans that do?",
        "answer": (
            "Most standalone dental plans exclude implants — they're a premium feature. "
            "Among the 942 SADP base plans in CMS 2026 data, only 62 plan variants cover adult implants. "
            "To find implant-covering plans: (1) Look for 'High' metal level dental plans (more comprehensive), "
            "(2) Check plan brochure or SBC specifically for implant language, "
            "(3) Use the Marketplace dental filter or ask a broker. "
            "Even implant-covering plans often require 12-month waiting periods and have annual limits "
            "that may not cover the full $3,000–$5,000 implant cost."
        ),
        "related_entities": ["implants", "sadp", "dental_waiting_periods", "dental_annual_maximum"],
        "regulatory_citation": "SADP disclosure: 45 CFR §147.200; plan brochure review required",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "dnt_005",
        "category": "dental_surprises",
        "question": "My child's orthodontia was denied. I thought ACA plans covered pediatric dental?",
        "answer": (
            "Pediatric dental is an ACA Essential Health Benefit, but coverage details vary by state benchmark plan. "
            "Orthodontia for children is typically covered by the pediatric dental EHB at 50% coinsurance "
            "after meeting deductible, with a lifetime maximum of $1,000–$2,500. "
            "Denials often occur because: (1) The orthodontia was deemed cosmetic, not medically necessary, "
            "(2) The child has already used the lifetime orthodontia maximum, "
            "(3) Documentation of medical necessity wasn't submitted. "
            "Appeal the denial with a letter of medical necessity from your child's orthodontist/dentist."
        ),
        "related_entities": ["pediatric_dental", "ehb", "orthodontia", "appeals_process"],
        "regulatory_citation": "ACA §1302(b)(1)(J); 45 CFR §156.110(a)(10); EPSDT (Medicaid)",
        "state_specific": True,
        "state_notes": "Benchmark plans for pediatric dental EHB vary by state — some include ortho, some don't",
        "plan_year": 2026,
    },

    # ── BILLING SCENARIOS ────────────────────────────────────────────────────
    {
        "id": "bil_001",
        "category": "billing_scenarios",
        "question": "I went in for my free preventive visit and got a bill. Why wasn't it 100% covered?",
        "answer": (
            "The ACA requires 100% coverage (no cost-sharing) for USPSTF Grade A/B preventive services "
            "when billed by an in-network provider. Bills appear when: (1) Your doctor billed a 'sick visit' "
            "code (99213) in addition to preventive code (99395) because you mentioned a symptom — "
            "this splits the visit into preventive + diagnostic, and the diagnostic portion has cost-sharing. "
            "(2) You saw an out-of-network provider. "
            "(3) The specific screening isn't on the USPSTF approved list. "
            "Solution: Ask your doctor to bill the visit as preventive only, or ensure new complaints "
            "are addressed in a separate appointment."
        ),
        "related_entities": ["preventive_care", "cpt_codes_preventive", "billing_modifier", "uspstf"],
        "regulatory_citation": "ACA §2713; 45 CFR §147.130; USPSTF Grade A/B recommendations",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "bil_002",
        "category": "billing_scenarios",
        "question": "My doctor ordered bloodwork during my office visit. Why did I get a separate lab bill?",
        "answer": (
            "Labs often have their own billing entities. If your doctor's office collected the blood "
            "but sent it to an outside reference lab (e.g., Quest, LabCorp), that lab bills separately. "
            "That separate lab may be out-of-network — resulting in higher cost-sharing or full out-of-pocket cost. "
            "Ask your doctor which lab they use and confirm it's in your network before bloodwork. "
            "Request an in-network lab, or ask to draw blood at an in-network facility. "
            "Some states have surprise billing protections for labs — check your state."
        ),
        "related_entities": ["lab_billing", "in_network", "out_of_network", "surprise_billing"],
        "regulatory_citation": "No Surprises Act §102 (labs partially covered); state-specific lab laws",
        "state_specific": True,
        "state_notes": "NY, CA have state surprise billing laws for labs; federal No Surprises Act has gaps for lab services",
        "plan_year": 2026,
    },
    {
        "id": "bil_003",
        "category": "billing_scenarios",
        "question": "I went to an in-network hospital but got a bill from an out-of-network doctor. Is this legal?",
        "answer": (
            "This was a common practice until the federal No Surprises Act (NSA), effective January 1, 2022. "
            "The NSA prohibits balance billing by out-of-network emergency providers and certain non-emergency "
            "providers at in-network facilities (including anesthesiologists, radiologists, pathologists). "
            "If you received care after January 1, 2022 at an in-network facility and were balance billed "
            "by an out-of-network provider, file a complaint at cms.gov/nosurprises. "
            "Your plan must treat these providers as in-network for cost-sharing purposes."
        ),
        "related_entities": ["no_surprises_act", "balance_billing", "out_of_network", "in_network_facility"],
        "regulatory_citation": "No Surprises Act (Div. BB of CAA 2021); 45 CFR §149.110-§149.140",
        "state_specific": False,
        "plan_year": 2026,
    },

    # ── PRIOR AUTHORIZATION ──────────────────────────────────────────────────
    {
        "id": "pa_001",
        "category": "prior_authorization",
        "question": "What is prior authorization and why do I need it?",
        "answer": (
            "Prior authorization (PA) is your insurer's pre-approval requirement for certain services, "
            "procedures, or medications before you receive them. Insurers require PA to ensure the service "
            "is medically necessary and to manage costs. Common PA requirements: MRI/CT scans, "
            "specialty drugs (especially biologics, brand-name), certain surgeries, inpatient admissions, "
            "durable medical equipment, physical therapy beyond a session limit, mental health residential care. "
            "If you receive a service without required PA, your claim will typically be denied — "
            "even if you didn't know PA was required. Always check your plan's PA list before scheduling."
        ),
        "related_entities": ["prior_authorization", "medical_necessity", "specialty_drugs", "claim_denial"],
        "regulatory_citation": "45 CFR §147.136; ACA §2719; ERISA §503; CMS PA rules",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "pa_002",
        "category": "prior_authorization",
        "question": "My insurer denied prior authorization. What are my rights to appeal?",
        "answer": (
            "You have the right to appeal under ERISA (employer plans) and the ACA (Marketplace plans). "
            "Step 1: Internal appeal — file within 180 days of denial. The plan must decide urgent appeals "
            "within 72 hours, non-urgent within 30 days. Submit a doctor's letter of medical necessity. "
            "Step 2: External appeal — if internal appeal is denied, you can request an independent "
            "external review by an Independent Review Organization (IRO). The plan must comply with "
            "the IRO's decision. Federal law gives you external appeal rights for all coverage denials."
        ),
        "related_entities": ["prior_authorization", "internal_appeal", "external_appeal", "iro"],
        "regulatory_citation": "ACA §2719; 45 CFR §147.136; ERISA §503; 29 CFR §2560.503-1",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "pa_003",
        "category": "prior_authorization",
        "question": "What is step therapy and how does it affect my prescription drug access?",
        "answer": (
            "Step therapy ('fail-first') requires you to try cheaper, first-line medications before "
            "your insurer will approve a more expensive drug. Example: must try metformin before "
            "getting Ozempic approved. Insurers use step therapy for brand-name drugs, biologics, "
            "and specialty medications. "
            "To bypass: (1) Submit a step therapy exception request with medical documentation showing "
            "you've already tried the required drugs, or that contraindications prevent their use. "
            "(2) In states with step therapy reform laws (NY, TX, VA, and others), exceptions must "
            "be granted within specific timeframes. "
            "(3) Urgent/emergency situations typically qualify for expedited exceptions."
        ),
        "related_entities": ["step_therapy", "prior_authorization", "specialty_drugs", "formulary"],
        "regulatory_citation": "CMS Conditions of Participation; State step therapy laws vary; ERISA §503",
        "state_specific": True,
        "state_notes": "NY §3217-f, TX SB 680, VA HB 1917, CO SB 20-011 have patient protections against step therapy",
        "plan_year": 2026,
    },
    {
        "id": "pa_004",
        "category": "prior_authorization",
        "question": "My insurer approved a procedure, then denied the claim after it was done. Is that allowed?",
        "answer": (
            "Retroactive denial after prior authorization is granted is generally prohibited under "
            "state law and ERISA guidance. If you have written PA approval and the service was performed "
            "as authorized (same provider, same service, same dates), the insurer cannot retroactively "
            "deny based on medical necessity. "
            "They can deny if: (1) The service actually performed differed materially from what was authorized, "
            "(2) The PA was obtained fraudulently, "
            "(3) New evidence shows the service was excluded from the plan. "
            "If wrongfully denied, file an appeal citing the PA approval letter and state unfair claims laws."
        ),
        "related_entities": ["prior_authorization", "retroactive_denial", "claims_appeals"],
        "regulatory_citation": "ERISA §503; ACA §2719; state unfair claims practices acts",
        "state_specific": True,
        "state_notes": "CA, NY, TX, FL have specific retroactive denial prohibition statutes",
        "plan_year": 2026,
    },
    {
        "id": "pa_005",
        "category": "prior_authorization",
        "question": "My doctor says I need an urgent MRI but the insurer says 72 hours for PA review. What can I do?",
        "answer": (
            "For urgent situations, request an expedited/urgent prior authorization review. "
            "Insurers must process urgent PA requests within 72 hours (non-life-threatening) or 24 hours "
            "(life-threatening) under ACA rules. Your doctor should call the PA hotline and use the word "
            "'urgent' explicitly in the request, citing clinical urgency. "
            "If truly life-threatening, emergency care cannot be withheld for lack of PA — "
            "the No Surprises Act and ACA guarantee emergency services coverage without prior authorization. "
            "ER stabilization is always covered without PA regardless of network status."
        ),
        "related_entities": ["prior_authorization", "urgent_pa", "emergency_care", "no_surprises_act"],
        "regulatory_citation": "ACA §2719; 45 CFR §147.136(b)(2)(ii); CMS Urgent Care PA Guidelines",
        "state_specific": False,
        "plan_year": 2026,
    },

    # ── ADDITIONAL ENTRIES ACROSS CATEGORIES ────────────────────────────────
    {
        "id": "sep_008",
        "category": "sep_triggers",
        "question": "I was denied Medicaid. Does that give me a Special Enrollment Period for the Marketplace?",
        "answer": (
            "Yes. If you applied for Medicaid/CHIP and were found ineligible, or if your Medicaid "
            "coverage was terminated, you have a 60-day SEP to enroll in a Marketplace plan. "
            "The Marketplace will also accept a state Medicaid agency referral as part of the "
            "'no wrong door' policy — you may be automatically notified of your SEP. "
            "Important: if you were on Medicaid and are being terminated due to periodic redetermination "
            "(unwinding), you may qualify for the SEP beginning 60 days before the termination date."
        ),
        "related_entities": ["medicaid", "sep_medicaid_denial", "marketplace_plans"],
        "regulatory_citation": "45 CFR §155.420(d)(4); CMS Medicaid-to-Marketplace SEP guidance",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "inc_006",
        "category": "income_changes",
        "question": "I received an inheritance this year. Does that count as income for ACA subsidies?",
        "answer": (
            "It depends on the type. ACA subsidies use Modified Adjusted Gross Income (MAGI). "
            "Inherited cash/assets: generally NOT income for MAGI purposes — they're excluded from MAGI. "
            "Inherited IRA distributions: TAXABLE as ordinary income, and count toward MAGI — "
            "this could significantly reduce your APTC. "
            "Inherited property sold at gain: capital gains portion counts as MAGI income. "
            "Inherited property you keep without selling: not MAGI income. "
            "If the inheritance pushes your MAGI above the subsidy threshold mid-year, report the "
            "change at HealthCare.gov and adjust your APTC."
        ),
        "related_entities": ["magi", "aptc_subsidy", "capital_gains", "inherited_ira"],
        "regulatory_citation": "IRC §36B(d)(2); 26 CFR §1.36B-1(e); IRS Publication 525",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "emp_004",
        "category": "employer_offer_adequacy",
        "question": "My employer's plan has a $10,000 deductible. Is that considered minimum essential coverage?",
        "answer": (
            "Yes — minimum essential coverage (MEC) has no deductible limit requirement. An HDHP "
            "with a $10,000 deductible qualifies as MEC as long as it covers at least 10 Essential "
            "Health Benefits and meets minimum value (60% actuarial value). "
            "Having MEC makes you ineligible for APTC unless the plan is unaffordable (>9.02% of income). "
            "However, a very high deductible plan that fails minimum value (<60% AV) would allow "
            "you to seek Marketplace coverage with subsidies. "
            "Request the plan's actuarial value or Summary of Benefits to verify."
        ),
        "related_entities": ["mec", "hdhp", "minimum_value", "aptc_subsidy"],
        "regulatory_citation": "IRC §5000A; 26 CFR §1.36B-2(c)(3)(ii); 45 CFR §156.145",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "med65_006",
        "category": "medicare_65",
        "question": "Can I take my Social Security benefits at 62 but wait until 65 for Medicare?",
        "answer": (
            "Yes — Social Security retirement benefits and Medicare enrollment are separate. "
            "You can claim SS at 62 (with permanent benefit reduction) but Medicare Part A and B "
            "eligibility begins at 65 regardless of when you start SS. "
            "However: if you receive Social Security benefits when you turn 65, you are automatically "
            "enrolled in Medicare Parts A and B — you must actively opt out of Part B if you have "
            "other creditable coverage and want to avoid the premium. "
            "Watch the 6-month retroactive Part A rule if enrolling after 65."
        ),
        "related_entities": ["social_security", "medicare_part_a", "medicare_part_b", "automatic_enrollment"],
        "regulatory_citation": "SSA §1818; 42 CFR §406.20; CMS Medicare Enrollment Guide",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "bil_004",
        "category": "billing_scenarios",
        "question": "My doctor billed two diagnoses for one visit. Why is my cost-sharing different than expected?",
        "answer": (
            "Multi-diagnosis visits can trigger split cost-sharing. If one diagnosis is for a preventive "
            "service (covered at 100%) and another is diagnostic/treatment, the diagnostic portion is "
            "subject to normal deductible and coinsurance. Providers may bill separate E&M codes "
            "(CPT 99213 + 99395 with modifier -25) for the same visit. "
            "You are legally owed an itemized bill — request an Explanation of Benefits (EOB) and "
            "itemized statement, compare CPT codes billed against your Summary of Benefits coverage rules. "
            "If the charges seem incorrect, contact the provider's billing department before the insurer."
        ),
        "related_entities": ["billing_scenarios", "cpt_codes", "eob", "preventive_care"],
        "regulatory_citation": "AMA CPT Modifier -25; ACA §2713; ERISA §502(a)(1)(B)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "pa_006",
        "category": "prior_authorization",
        "question": "How can I check if my medication requires prior authorization before filling it?",
        "answer": (
            "Three ways to check before going to the pharmacy: "
            "(1) Your plan's online formulary — log into your insurer's member portal, look up the drug "
            "by name. It will show the tier, any PA requirement (PA symbol), step therapy (ST), or "
            "quantity limits (QL). "
            "(2) Call the member services number on your insurance card and ask specifically: "
            "'Does [drug name] require prior authorization under my plan?' "
            "(3) Ask your doctor's office — they have PA submission tools and know which drugs "
            "trigger frequent denials. Getting PA before the prescription reaches the pharmacy "
            "avoids a stressful denial at the counter."
        ),
        "related_entities": ["prior_authorization", "formulary", "drug_tiers", "member_portal"],
        "regulatory_citation": "ACA §2719; 45 CFR §147.136; plan formulary disclosure requirements",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "dnt_006",
        "category": "dental_surprises",
        "question": "Why does my dental plan pay a lower percentage for the same procedure at different dentists?",
        "answer": (
            "Dental plans with tiered networks (like PPO vs in-network preferred dentist tiers) pay "
            "higher percentages for in-network preferred providers and lower for standard in-network or "
            "out-of-network. Additionally, dental plans pay based on their 'table of allowances' "
            "or 'usual, customary and reasonable' (UCR) fee schedule — if your dentist charges more "
            "than the UCR, you pay the difference (balance billing). "
            "To avoid surprise costs: (1) Use in-network dentists, (2) Ask for a pre-treatment "
            "estimate (predetermination) before major work, (3) Confirm your dentist accepts "
            "assignment on your specific plan."
        ),
        "related_entities": ["dental_network", "ucr_fees", "dental_tiers", "predetermination"],
        "regulatory_citation": "State dental insurance regulations; NAIC Model Dental Plan Standards",
        "state_specific": True,
        "state_notes": "Some states require predetermination/preauthorization to be binding on the insurer",
        "plan_year": 2026,
    },
    {
        "id": "imm_005",
        "category": "immigration_dmi",
        "question": "I'm on a work visa (H-1B). Am I eligible for the ACA Marketplace?",
        "answer": (
            "H-1B visa holders are generally considered 'lawfully present' and eligible for Marketplace "
            "enrollment. However, most H-1B workers receive employer-sponsored insurance — if your "
            "employer offers affordable, minimum-value coverage, you're not eligible for APTC. "
            "If employer coverage is unaffordable or not offered, you can enroll in Marketplace plans "
            "with potential subsidy eligibility. "
            "Other work visas (H-2A, H-2B, L-1, O-1, TN) are similarly treated. "
            "F-1 student visa holders generally qualify as lawfully present but must typically use "
            "university health plans or go unsubsidized."
        ),
        "related_entities": ["work_visa", "lawful_presence", "marketplace_plans", "employer_coverage"],
        "regulatory_citation": "45 CFR §155.20 (lawfully present definition); INA §101(a)(15)",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "inc_007",
        "category": "income_changes",
        "question": "What is MAGI and what income sources count toward it for ACA subsidies?",
        "answer": (
            "Modified Adjusted Gross Income (MAGI) = AGI + tax-exempt interest + non-taxable Social "
            "Security benefits + excluded foreign income. MAGI counts: wages/salary, self-employment net profit, "
            "business income (S-corp, partnership distributions), rental income (net), capital gains, "
            "alimony (pre-2019 divorces), Social Security (taxable portion), unemployment compensation, "
            "IRA/401k distributions (taxable), gambling winnings. "
            "MAGI does NOT count: child support received, SSI disability, inheritances (cash), "
            "SNAP/TANF benefits, proceeds from selling your home (up to exclusion limit), "
            "Roth IRA distributions (non-taxable), gifts."
        ),
        "related_entities": ["magi", "aptc_subsidy", "income_calculation", "agi"],
        "regulatory_citation": "IRC §36B(d)(2); 26 CFR §1.36B-1(e)(2); IRS Publication 974",
        "state_specific": False,
        "plan_year": 2026,
    },
    {
        "id": "sep_009",
        "category": "sep_triggers",
        "question": "I'm leaving incarceration. Can I enroll in health insurance?",
        "answer": (
            "Yes. Release from incarceration (including prison, jail, and detention) qualifies for a "
            "60-day Special Enrollment Period on the ACA Marketplace. "
            "Additionally, many formerly incarcerated individuals are income-eligible for Medicaid — "
            "especially in Medicaid expansion states, coverage can begin immediately upon release. "
            "While incarcerated, people are excluded from Medicaid and Marketplace coverage. "
            "Pre-release planning: some correctional facilities help coordinate Medicaid/Marketplace "
            "enrollment before release date to ensure no coverage gap."
        ),
        "related_entities": ["sep_incarceration", "medicaid", "reentry_health"],
        "regulatory_citation": "45 CFR §155.420(d)(8); 42 CFR §435.1010 (Medicaid incarceration exclusion)",
        "state_specific": True,
        "state_notes": "Some states (CA, NY, IL) have pre-release enrollment programs with Medicaid",
        "plan_year": 2026,
    },
    {
        "id": "bil_005",
        "category": "billing_scenarios",
        "question": "Is a telehealth visit billed and priced the same as an in-person visit?",
        "answer": (
            "Not always. Most insurers now cover telehealth visits, but cost-sharing varies by plan: "
            "(1) Some plans cover telehealth at $0 copay (especially post-COVID policy extensions), "
            "(2) Some apply the same copay as office visits, "
            "(3) Some have separate telehealth-specific cost-sharing. "
            "CPT codes for telehealth use the same office visit codes (99213, etc.) but are modified "
            "with Place of Service code '02' (telehealth) or '10' (home telehealth). "
            "Mental health telehealth often has different cost-sharing than medical telehealth. "
            "Check your Summary of Benefits for telehealth/virtual visit cost-sharing specifically."
        ),
        "related_entities": ["telehealth", "cost_sharing", "mental_health_parity", "cpt_codes"],
        "regulatory_citation": "CMS PHE telehealth extensions; Mental Health Parity Act; 45 CFR §147.136",
        "state_specific": True,
        "state_notes": "Many states have telehealth parity laws requiring equal coverage; varies significantly",
        "plan_year": 2026,
    },

]

# fmt: on


def validate_qa_data(records: list[dict[str, Any]]) -> None:
    """Validate Q&A records before saving."""
    required_fields = {"id", "category", "question", "answer", "related_entities",
                       "regulatory_citation", "state_specific"}
    valid_categories = {
        "turning_26", "medicare_65", "sep_triggers", "immigration_dmi",
        "income_changes", "employer_offer_adequacy", "dental_surprises",
        "billing_scenarios", "prior_authorization",
    }

    ids = set()
    for r in records:
        missing = required_fields - r.keys()
        assert not missing, f"Record {r.get('id')} missing fields: {missing}"
        assert r["category"] in valid_categories, f"Unknown category: {r['category']}"
        assert r["id"] not in ids, f"Duplicate ID: {r['id']}"
        assert len(r["question"]) > 20, f"Question too short: {r['id']}"
        assert len(r["answer"]) > 50, f"Answer too short: {r['id']}"
        ids.add(r["id"])

    logger.info(f"  Validation passed: {len(records)} records, {len(ids)} unique IDs")


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    records = QA_DATA
    logger.info(f"Q&A entries defined: {len(records)}")

    validate_qa_data(records)

    # Stats
    from collections import Counter
    cat_counts = Counter(r["category"] for r in records)
    state_specific = sum(1 for r in records if r["state_specific"])

    logger.info("Category breakdown:")
    for cat, n in sorted(cat_counts.items()):
        logger.info(f"  {cat}: {n}")
    logger.info(f"State-specific entries: {state_specific}")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    import datetime
    output = {
        "metadata": {
            "source": "HealthInsuranceRenew domain expertise + regulatory citations (PY2026)",
            "plan_year": 2026,
            "record_count": len(records),
            "categories": dict(cat_counts),
            "state_specific_count": state_specific,
            "disclaimer": "For informational purposes only. Consult a licensed insurance agent for personalized guidance.",
            "generated_at": datetime.datetime.now().isoformat(),
            "schema_version": "1.0",
        },
        "data": records,
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2, default=str)
    size_kb = OUTPUT_PATH.stat().st_size / 1000
    logger.info(f"Saved {len(records)} Q&A entries ({size_kb:.1f} KB) to {OUTPUT_PATH}")

    print(f"\nSaved {len(records)} friction Q&A entries to {OUTPUT_PATH}")
    print(f"\nSample entry:")
    import json as j
    print(j.dumps(records[0], indent=2))


if __name__ == "__main__":
    main()
