"""
Generate: Life Events & Transitions Decision Tree Dataset (Pillar 9)

8 life event decision trees:
  1. Turning 26 (aging off parent's plan)
  2. Getting married
  3. Having a baby
  4. Losing job coverage
  5. Early retirement (pre-65)
  6. Medicare at 65
  7. Moving states
  8. Immigration status change

Each event: sep_details, documentation_needed, timeline_days, state_specific_rules,
decision_tree, pillar_connections, key_deadlines, consumer_mistakes.

Output: data/processed/life_events.json

Usage:
    python scripts/generate/build_life_events.py
"""

import datetime
import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

PROCESSED_DIR = Path("data/processed")
OUTPUT_PATH = PROCESSED_DIR / "life_events.json"

LIFE_EVENTS: list[dict[str, Any]] = [

    # ── 1. TURNING 26 ─────────────────────────────────────────────────────────
    {
        "id": "turning_26",
        "slug": "turning-26",
        "title": "Turning 26: Aging Off a Parent's Health Plan",
        "category": "coverage_loss",
        "url_pattern": "/life-events/turning-26",
        "trigger_description": "Dependent child reaches age 26 — loses eligibility on parent's employer or Marketplace plan.",
        "sep_details": {
            "sep_type": "Loss of minimum essential coverage",
            "window_days": 60,
            "window_start": "Date of 26th birthday",
            "marketplace_eligible": True,
            "medicaid_eligible": True,
            "retroactive_coverage": False,
            "notes": "Coverage end date varies: some plans end on birthday, some end of birthday month, some end of calendar year",
        },
        "documentation_needed": [
            "Proof of loss of coverage (letter from employer HR or insurer stating coverage end date)",
            "Date of birth (identity verification)",
            "If enrolling in employer plan: employer qualifying event form",
        ],
        "timeline_days": {
            "before_birthday": {
                "60_days_before": "Review options: parent's plan coverage end date, employer plan (if employed), Marketplace plans",
                "30_days_before": "Get cost comparisons for Marketplace plans; check Medicaid eligibility",
                "14_days_before": "Begin Marketplace application if desired; confirm employer plan enrollment window",
            },
            "after_birthday": {
                "day_0": "Coverage ends (or end of month depending on plan) — 60-day SEP clock begins",
                "day_1_30": "Optimal enrollment window — coverage can be effective 1st of following month",
                "day_31_60": "Still within SEP; coverage effective 1st of month after enrollment",
                "day_61_plus": "Must wait for Open Enrollment (Nov 1) or next qualifying event; gap in coverage likely",
            },
        },
        "decision_tree": [
            {
                "node": "Is new employment with employer health insurance available?",
                "yes_path": "Enroll in employer plan within 30 days of coverage loss; check if plan passes minimum value and affordability tests",
                "no_path": "Proceed to income check",
            },
            {
                "node": "Is income below 138% FPL (Medicaid expansion state) or 100% FPL (non-expansion)?",
                "yes_path": "Apply for Medicaid — year-round enrollment, no monthly premium in most cases",
                "no_path": "Proceed to Marketplace enrollment",
            },
            {
                "node": "Is income 100–400% FPL (or higher if enhanced credits apply)?",
                "yes_path": "Enroll in ACA Marketplace plan with APTC. Consider Silver CSR if 100–250% FPL.",
                "no_path": "Enroll in Marketplace without subsidy; compare Bronze/Catastrophic plans",
            },
            {
                "node": "Is COBRA continuation worthwhile?",
                "yes_path": "COBRA maintains same coverage, same network, same doctors — but at full cost. Best if: ongoing treatment, specific in-network doctors needed, or employer plan has rich benefits.",
                "no_path": "Marketplace likely cheaper. COBRA election still buys time (60 days to elect, retroactive to loss date).",
            },
        ],
        "state_specific_rules": {
            "extended_dependent_age_states": {
                "NY": "Up to age 29 (state-regulated plans)",
                "NJ": "Up to age 31 (state-regulated plans)",
                "PA": "Up to age 30 (state-regulated plans)",
                "FL": "Up to age 30 (non-married dependents, state-regulated)",
                "OH": "Up to age 28 (state-regulated plans)",
                "CO": "Up to age 26 + end of calendar year",
                "note": "Extended ages apply to state-regulated plans — fully-insured employer plans and Marketplace plans. Self-funded employer plans (ERISA) may only be required to comply with federal ACA age 26 rule.",
            },
            "marketplace_state_notes": "State-run marketplaces (CA, NY, CO, etc.) may have additional protections or longer enrollment windows",
        },
        "consumer_mistakes": [
            "Waiting until after the birthday to start comparing plans — leads to gap in coverage",
            "Assuming COBRA is always the best option — Marketplace often cheaper with subsidies",
            "Missing the 60-day SEP window — requires waiting until Open Enrollment",
            "Not checking Medicaid eligibility first (often free coverage if income qualifies)",
            "Forgetting to update dependents in employer systems — COBRA notice may not be sent automatically",
        ],
        "key_deadlines": [
            {"deadline": "60 days from birthday", "action": "Enroll in Marketplace SEP or employer plan"},
            {"deadline": "60 days from coverage loss", "action": "Elect COBRA if desired (retroactive to loss date)"},
            {"deadline": "45 days after COBRA election", "action": "Pay first COBRA premium"},
        ],
        "pillar_connections": {
            "pillar_1_plan_intelligence": "Use plan_intelligence.json to compare premiums for available plans in new rating area",
            "pillar_2_subsidy_engine": "Use subsidy_engine.json to calculate APTC eligibility at various income levels",
            "pillar_3_sbc_decoded": "Review cost-sharing grid (sbc_decoded.json) to find plans covering current doctors/drugs",
            "pillar_6_formulary": "Check formulary_intelligence.json to ensure current prescriptions are covered",
            "friction_qa": "See category: turning_26 Q&A entries",
        },
        "content_page_data": {
            "faq_questions": [
                "When exactly does my coverage end when I turn 26?",
                "Should I choose COBRA or a Marketplace plan at 26?",
                "Can I stay on my parent's plan if I'm married?",
                "How do I enroll in health insurance for the first time at 26?",
                "What's the cheapest health insurance for a 26-year-old?",
                "Does turning 26 count as a qualifying life event?",
                "What happens if I miss the 60-day enrollment window at 26?",
                "Can I get Medicaid when I turn 26?",
            ],
            "schema_type": "SpecialAnnouncement",
            "related_entities": ["cobra", "marketplace_plans", "aptc_subsidy", "medicaid"],
        },
    },

    # ── 2. GETTING MARRIED ────────────────────────────────────────────────────
    {
        "id": "getting_married",
        "slug": "getting-married",
        "title": "Getting Married: Combining Health Insurance Coverage",
        "category": "household_change",
        "url_pattern": "/life-events/getting-married",
        "trigger_description": "Marriage creates SEP for both spouses to enroll, switch, or add the other to employer/Marketplace plans.",
        "sep_details": {
            "sep_type": "Marriage (household change)",
            "window_days": 60,
            "window_start": "Date of marriage",
            "marketplace_eligible": True,
            "medicaid_eligible": True,
            "retroactive_coverage": False,
            "notes": "Both spouses can enroll or change plans; household income now combined for APTC calculation",
        },
        "documentation_needed": [
            "Marriage certificate (official government document, raised seal)",
            "If adding spouse to employer plan: employer SEP form, proof of marriage",
            "If enrolling in Marketplace: marriage certificate uploaded to HealthCare.gov",
        ],
        "timeline_days": {
            "before_marriage": {
                "30_days_before": "Compare options: spouse's employer plan vs your employer plan vs Marketplace; run combined income subsidy calculation",
                "14_days_before": "Identify lower-cost option for combined household; check network compatibility for both spouses' doctors",
            },
            "after_marriage": {
                "day_0": "Marriage date — 60-day SEP window begins",
                "day_1_30": "Notify employer(s) HR and/or Marketplace of life event; add spouse or enroll jointly",
                "day_31_60": "Final window; coverage effective 1st of month after enrollment",
                "day_61_plus": "Must wait for Open Enrollment; spouse may have gap",
            },
        },
        "decision_tree": [
            {
                "node": "Does one or both spouses have employer coverage?",
                "yes_path": "Compare: (1) Keep separate employer plans, (2) Add spouse to better employer plan (check cost), (3) If one employer plan is much better, consider moving both spouses there",
                "no_path": "Both enroll in Marketplace; calculate new combined household income for APTC",
            },
            {
                "node": "Does adding spouse to employer plan trigger family glitch?",
                "yes_path": "Spouse may be eligible for Marketplace APTC if employee-only premium > 9.02% of household income (post-2023 family glitch fix)",
                "no_path": "Add spouse to employer plan if it's the most cost-effective option",
            },
            {
                "node": "Does combined income change Medicaid eligibility?",
                "yes_path": "One spouse may lose Medicaid eligibility if combined income exceeds threshold — re-apply immediately",
                "no_path": "Both may qualify for Medicaid or retain current Marketplace eligibility",
            },
            {
                "node": "Are both spouses' doctors and drugs in the chosen network/formulary?",
                "yes_path": "Proceed with enrollment",
                "no_path": "Check alternative plan options; compromise on network or formulary coverage may be needed",
            },
        ],
        "state_specific_rules": {
            "community_property_states": "AZ, CA, ID, LA, NM, NV, TX, WA, WI: income may be reported differently for MAGI calculations",
            "state_marketplace_documentation": "State-run marketplaces may have specific document requirements for marriage certificate format",
        },
        "consumer_mistakes": [
            "Assuming adding spouse to employer plan is always cheapest — often family coverage doubles the premium",
            "Not recalculating APTC with combined household income — could owe back subsidies at tax time",
            "Missing the 60-day window — common because newlyweds are busy",
            "Not checking whether existing doctors/prescriptions are covered on a combined plan",
            "Forgetting to update beneficiary designations and coverage paperwork consistently",
        ],
        "key_deadlines": [
            {"deadline": "60 days from marriage", "action": "Update Marketplace account; add to employer plan"},
            {"deadline": "As soon as possible", "action": "Recalculate APTC with new combined household income"},
            {"deadline": "30 days (most employer plans)", "action": "Notify employer HR to add spouse"},
        ],
        "pillar_connections": {
            "pillar_2_subsidy_engine": "Recalculate combined household APTC at new income level",
            "pillar_1_plan_intelligence": "Compare plans for combined household premium",
            "friction_qa": "See category: sep_triggers (marriage), income_changes",
        },
        "content_page_data": {
            "faq_questions": [
                "Do I have to add my spouse to my health insurance?",
                "Is it cheaper to stay on separate health insurance plans after marriage?",
                "How long do I have to add my spouse to my insurance after getting married?",
                "What documents do I need to add my spouse to my health insurance?",
                "My spouse has Medicaid — what happens when we get married and combine income?",
                "Can I enroll in a new health plan when I get married even though it's not Open Enrollment?",
                "What is the family glitch and how does it affect married couples?",
            ],
            "schema_type": "HowTo",
            "related_entities": ["marriage_sep", "employer_coverage", "aptc_subsidy", "family_glitch"],
        },
    },

    # ── 3. HAVING A BABY ──────────────────────────────────────────────────────
    {
        "id": "having_baby",
        "slug": "having-a-baby",
        "title": "Having a Baby: Adding a Newborn to Health Coverage",
        "category": "household_change",
        "url_pattern": "/life-events/having-a-baby",
        "trigger_description": "Birth, adoption, or foster placement of a child triggers immediate retroactive coverage eligibility.",
        "sep_details": {
            "sep_type": "Birth, adoption, or foster placement",
            "window_days": 60,
            "window_start": "Date of birth, adoption, or foster placement",
            "marketplace_eligible": True,
            "medicaid_eligible": True,
            "retroactive_coverage": True,
            "retroactive_notes": "Coverage for newborn is retroactive to date of birth — even if enrolled on day 59. Critical for NICU costs.",
        },
        "documentation_needed": [
            "Birth certificate (official, raised seal) or hospital birth record",
            "Adoption finalization document or foster placement document",
            "Social Security Number for newborn (apply at hospital; required within 30 days for Marketplace)",
            "Employer HR SEP form",
        ],
        "timeline_days": {
            "before_birth": {
                "third_trimester": "Review maternity coverage on current plan; confirm delivery hospital is in-network; check pediatrician network",
                "30_days_before": "Identify pediatrician; confirm newborn coverage under plan from birth",
                "7_days_before": "Confirm hospital pre-authorization if required; verify out-of-pocket maximum status",
            },
            "after_birth": {
                "day_0": "Birth — retroactive coverage begins; 60-day SEP clock starts",
                "day_1_30": "Apply for newborn SSN (hospital or SSA); add newborn to plan; check Medicaid/CHIP for child",
                "day_31_60": "Still within SEP — retroactive to birth",
                "day_61_plus": "Late enrollment — coverage only from enrollment date forward; NICU/birth costs for that gap may not be covered",
            },
        },
        "decision_tree": [
            {
                "node": "Is the newborn covered under a current plan automatically at birth?",
                "yes_path": "Most employer plans auto-cover newborn for 30–31 days; enroll within that window to extend past auto-coverage period",
                "no_path": "Enroll newborn explicitly in plan within 60-day SEP window; coverage retroactive to birth",
            },
            {
                "node": "Is household income below Medicaid/CHIP eligibility for the child?",
                "yes_path": "Apply for CHIP or Medicaid for the child — typically covers children up to 200–300%+ FPL depending on state; year-round enrollment",
                "no_path": "Add child to existing employer or Marketplace plan",
            },
            {
                "node": "Does the new family size affect APTC calculation?",
                "yes_path": "Update HealthCare.gov with new household size immediately — larger household = higher FPL threshold = potentially more APTC",
                "no_path": "No action needed on subsidy",
            },
            {
                "node": "Will the NICU or birth create large medical bills?",
                "yes_path": "Confirm retroactive enrollment date; verify all providers and hospital are in-network; check whether hospital's NICU providers bill separately (NSA applies)",
                "no_path": "Standard enrollment timeline",
            },
        ],
        "state_specific_rules": {
            "medicaid_chip_income_limits": "CHIP eligibility varies: most states cover children up to 200–300% FPL; some (CA, NY) cover up to 400%",
            "newborn_auto_coverage": "Most states require group health plans to auto-cover newborns for 30 days without enrollment action under state insurance law",
        },
        "consumer_mistakes": [
            "Assuming the newborn is covered indefinitely without explicit enrollment — auto-coverage is typically 30 days only",
            "Not checking CHIP — free/near-free coverage often available for children even when parents don't qualify for Medicaid",
            "Not updating household size for APTC — missing out on increased subsidies",
            "Failing to secure newborn SSN within 30 days — Marketplace requires SSN within deadline",
            "Not confirming NICU providers are in-network before delivery — hospitals choose neonatology groups",
        ],
        "key_deadlines": [
            {"deadline": "30–31 days from birth", "action": "Enroll newborn to extend beyond auto-coverage period (employer plans)"},
            {"deadline": "60 days from birth", "action": "Marketplace SEP enrollment window closes"},
            {"deadline": "As soon as possible", "action": "Apply for newborn Social Security Number"},
            {"deadline": "Within 30 days", "action": "Update Marketplace income/household size for new APTC"},
        ],
        "pillar_connections": {
            "pillar_7_dental": "Check if plan includes pediatric dental (ACA EHB requirement) or if separate SADP needed",
            "pillar_2_subsidy_engine": "Recalculate APTC with updated household size",
            "pillar_6_formulary": "Check pediatric formula, post-natal medications on formulary",
            "friction_qa": "See category: sep_triggers (birth/adoption)",
        },
        "content_page_data": {
            "faq_questions": [
                "How do I add a newborn to my health insurance?",
                "Is my baby automatically covered at birth?",
                "What happens if I miss the 60-day window to add my baby to insurance?",
                "Can I get Medicaid or CHIP for my newborn?",
                "Does having a baby change my health insurance subsidy?",
                "What is the deadline to add a baby to employer health insurance?",
                "My baby was in the NICU — is that covered from birth?",
            ],
            "schema_type": "HowTo",
            "related_entities": ["newborn_coverage", "chip", "medicaid", "sep_birth"],
        },
    },

    # ── 4. LOSING JOB COVERAGE ────────────────────────────────────────────────
    {
        "id": "losing_job",
        "slug": "losing-job-coverage",
        "title": "Losing Job Coverage: What To Do When Employer Insurance Ends",
        "category": "coverage_loss",
        "url_pattern": "/life-events/losing-job-coverage",
        "trigger_description": "Involuntary or voluntary job loss, or reduction in hours below employer plan eligibility, triggers loss of employer health coverage and a 60-day SEP.",
        "sep_details": {
            "sep_type": "Loss of minimum essential coverage",
            "window_days": 60,
            "window_start": "Date employer coverage ends",
            "marketplace_eligible": True,
            "medicaid_eligible": True,
            "retroactive_coverage": False,
            "notes": "Coverage end date is often last day of month in which employment ends; verify with employer",
        },
        "documentation_needed": [
            "Employer letter or COBRA election notice stating coverage end date",
            "Final paystub showing coverage period",
            "If COBRA elected: COBRA election letter with coverage dates",
        ],
        "timeline_days": {
            "at_job_loss": {
                "immediately": "Ask HR: exact coverage end date; COBRA premium amount; any grace period",
                "within_14_days": "Compare COBRA cost vs Marketplace plans; check Medicaid eligibility at new income level",
            },
            "after_coverage_ends": {
                "day_0": "Coverage ends — 60-day SEP clock begins",
                "day_1_14": "Enroll in Marketplace for next-month coverage OR elect COBRA (retroactive to loss date)",
                "day_60": "Last day of SEP — must enroll or wait for Open Enrollment",
                "day_61": "COBRA: can still elect up to this point; can pay retroactive premiums and activate full coverage",
            },
        },
        "decision_tree": [
            {
                "node": "Is income now below Medicaid threshold?",
                "yes_path": "Apply for Medicaid immediately — year-round enrollment, effective same month; free or near-free coverage",
                "no_path": "Proceed to Marketplace or COBRA comparison",
            },
            {
                "node": "Is Marketplace plan (with APTC) cheaper than COBRA?",
                "yes_path": "Enroll in Marketplace plan via SEP; APTC significantly reduces premium at 100–400%+ FPL",
                "no_path": "COBRA maintains existing coverage and network — best if ongoing treatment or surgery scheduled",
            },
            {
                "node": "Is surgery or major treatment scheduled within 2 months?",
                "yes_path": "COBRA ensures no disruption to care — elect COBRA now; switch to Marketplace at Open Enrollment if cost is unsustainable",
                "no_path": "Marketplace likely more cost-effective",
            },
            {
                "node": "Is a new job likely within 60 days?",
                "yes_path": "COBRA buys time — elect now (retroactive if needed); switch to new employer plan when available",
                "no_path": "Enroll in Marketplace for cost savings during extended job search",
            },
        ],
        "state_specific_rules": {
            "state_continuation_coverage": "Many states have 'mini-COBRA' laws covering employees at smaller employers not covered by federal COBRA (20+ FTEs required for federal COBRA)",
            "medicaid_expansion": "In non-expansion states (10 states as of 2026), income below 100% FPL may create a coverage gap — no Medicaid and no APTC",
            "state_ui_and_coverage": "Some states offer subsidized continuation coverage for unemployment insurance recipients",
        },
        "consumer_mistakes": [
            "Waiting to see if COBRA is needed before enrolling in Marketplace — misses optimal enrollment window",
            "Assuming COBRA is required/mandatory — it's optional; Marketplace often cheaper",
            "Not checking Medicaid — job loss often reduces income enough for Medicaid eligibility",
            "Electing COBRA and then forgetting to pay premium — coverage voids retroactively",
            "Not realizing coverage ends at end of month, not date of termination — may have extra weeks of coverage",
        ],
        "key_deadlines": [
            {"deadline": "60 days from coverage end", "action": "Marketplace SEP enrollment"},
            {"deadline": "60 days from coverage end", "action": "COBRA election window closes"},
            {"deadline": "45 days after COBRA election", "action": "Pay first COBRA premium"},
            {"deadline": "As soon as possible", "action": "Check Medicaid eligibility at new income level"},
        ],
        "pillar_connections": {
            "pillar_2_subsidy_engine": "Calculate APTC at new (reduced) income — subsidy likely much higher now",
            "pillar_1_plan_intelligence": "Compare Marketplace plans in county for coverage options",
            "pillar_3_sbc_decoded": "Review cost-sharing to ensure ongoing treatment coverage",
            "friction_qa": "See category: sep_triggers (job loss), income_changes",
        },
        "content_page_data": {
            "faq_questions": [
                "What happens to my health insurance when I lose my job?",
                "How long can I stay on COBRA after losing my job?",
                "Is COBRA or marketplace insurance better after job loss?",
                "How do I get health insurance between jobs?",
                "Can I get Medicaid if I lose my job?",
                "What is the deadline to get health insurance after losing a job?",
                "Do I have to pay for the whole month of COBRA even if I lost coverage mid-month?",
            ],
            "schema_type": "HowTo",
            "related_entities": ["cobra", "marketplace_plans", "medicaid", "sep_job_loss"],
        },
    },

    # ── 5. EARLY RETIREMENT (PRE-65) ─────────────────────────────────────────
    {
        "id": "early_retirement",
        "slug": "early-retirement-health-insurance",
        "title": "Early Retirement: Health Insurance Before Medicare at 65",
        "category": "coverage_loss",
        "url_pattern": "/life-events/early-retirement-health-insurance",
        "trigger_description": "Retiring before age 65 creates a coverage gap — Medicare doesn't begin until 65. Often the most expensive insurance period of a person's life.",
        "sep_details": {
            "sep_type": "Loss of employer coverage upon retirement",
            "window_days": 60,
            "window_start": "Date employer coverage ends at retirement",
            "marketplace_eligible": True,
            "medicaid_eligible": True,
            "retroactive_coverage": False,
        },
        "documentation_needed": [
            "Employer letter confirming retirement date and coverage end date",
            "Income documentation for APTC: projected retirement income (pension, IRA distributions, investment income)",
            "COBRA election paperwork if bridging coverage with COBRA",
        ],
        "timeline_days": {
            "planning_phase": {
                "12_months_before": "Calculate projected post-retirement income; estimate APTC eligibility; research retiree coverage from employer if available",
                "6_months_before": "Get plan comparison quotes; understand HSA rules (stop contributing 6 months before Medicare if claiming SS)",
                "3_months_before": "Confirm coverage end date; COBRA cost; Marketplace enrollment timeline",
            },
            "retirement_day": {
                "day_0": "Coverage ends (or end of retirement month)",
                "day_1_60": "Enroll in Marketplace SEP or elect COBRA",
                "day_61_plus": "Open Enrollment only; costly gap if missed",
            },
        },
        "decision_tree": [
            {
                "node": "Does former employer offer retiree health coverage?",
                "yes_path": "Compare retiree coverage cost vs Marketplace; retiree coverage may be ineligible for APTC",
                "no_path": "Marketplace or COBRA are primary options",
            },
            {
                "node": "What is projected post-retirement income level?",
                "yes_path_low_income": "100–250% FPL: strongly consider Silver plan with CSR cost-sharing reductions — most valuable coverage available",
                "medium_income_path": "250–400% FPL: Silver or Gold plan with APTC",
                "higher_income_path": "400%+ FPL: Marketplace without subsidy; consider HSA-eligible Bronze HDHP",
            },
            {
                "node": "Is spouse under 65 and needing coverage also?",
                "yes_path": "Household coverage — family Marketplace plan or separate plans; coordinate deductibles",
                "no_path": "Individual coverage only",
            },
            {
                "node": "How many years until Medicare at 65?",
                "1_2_years": "COBRA may be practical bridge if employer plan is good; otherwise Marketplace",
                "3_plus_years": "Marketplace almost always better than COBRA long-term; reassess annually at Open Enrollment",
            },
        ],
        "state_specific_rules": {
            "note": "State continuation (mini-COBRA) covers retirees from small employers; check if state law applies",
            "medicaid_retirees": "Some retirees at 55–64 with modest pension income may qualify for Medicaid in expansion states",
        },
        "consumer_mistakes": [
            "Not accounting for investment income in MAGI — IRA distributions count and can eliminate APTC",
            "Taking large IRA distributions in early retirement years — can push MAGI over APTC threshold",
            "Forgetting that Roth IRA distributions are NOT counted in MAGI — strategic withdrawal planning matters",
            "Not stopping HSA contributions 6 months before Medicare enrollment (SS retroactive coverage risk)",
            "Underestimating pre-Medicare health insurance as retirement budget line item ($15,000–$25,000/year is common for a couple)",
        ],
        "key_deadlines": [
            {"deadline": "60 days from retirement coverage end", "action": "Marketplace SEP enrollment"},
            {"deadline": "6 months before Medicare enrollment", "action": "Stop HSA contributions"},
            {"deadline": "3 months before turning 65", "action": "Begin Medicare Initial Enrollment Period"},
        ],
        "pillar_connections": {
            "pillar_2_subsidy_engine": "Critical: model APTC at various income drawdown scenarios (pension + IRA distributions)",
            "pillar_1_plan_intelligence": "Compare Silver CSR plans for early retirees at 200–250% FPL",
            "pillar_3_sbc_decoded": "Review coverage examples for healthcare-intensive age group (55–64)",
            "friction_qa": "See categories: medicare_65, income_changes",
        },
        "content_page_data": {
            "faq_questions": [
                "How do I get health insurance if I retire early before 65?",
                "How much does health insurance cost for early retirees?",
                "Can I get Marketplace subsidies if I retire at 62?",
                "What happens to my HSA when I retire?",
                "Is COBRA a good option for early retirees?",
                "What income counts against my ACA subsidy in retirement?",
                "How do I bridge coverage between retirement and Medicare?",
            ],
            "schema_type": "FAQPage",
            "related_entities": ["cobra", "marketplace_plans", "aptc_subsidy", "hsa", "medicare_part_a"],
        },
    },

    # ── 6. MEDICARE AT 65 ─────────────────────────────────────────────────────
    {
        "id": "medicare_at_65",
        "slug": "medicare-at-65",
        "title": "Turning 65: Transitioning from ACA Coverage to Medicare",
        "category": "new_coverage_eligible",
        "url_pattern": "/life-events/medicare-at-65",
        "trigger_description": "Turning 65 triggers Medicare eligibility. Must coordinate Medicare enrollment with existing ACA Marketplace or employer coverage — mismanagement creates permanent penalty or coverage gaps.",
        "sep_details": {
            "sep_type": "New Medicare eligibility; loss of ACA Marketplace eligibility",
            "window_days": None,
            "window_start": "3 months before 65th birthday",
            "medicare_iep_note": "Initial Enrollment Period: 3 months before birthday through 3 months after = 7-month window total",
            "marketplace_eligible": False,
            "marketplace_note": "Once enrolled in Medicare Part A or B, no longer eligible for APTC on Marketplace",
        },
        "documentation_needed": [
            "Medicare Initial Enrollment Package (mailed by SSA ~3 months before birthday)",
            "Social Security card and proof of citizenship",
            "If delaying Part B due to employer coverage: letter from employer confirming active employment coverage",
            "For HSA stop: confirm last HSA contribution date (6 months before Medicare coverage start)",
        ],
        "timeline_days": {
            "months_before_65": {
                "3_months_before": "Medicare Initial Enrollment Period begins; apply at SSA.gov or ssa.gov/Medicare",
                "2_months_before": "Confirm Medicare premium amounts; evaluate Medicare Supplement (Medigap) and Part D options",
                "1_month_before": "Stop HSA contributions if planning Medicare enrollment this month",
            },
            "at_65": {
                "birthday_month": "Part A and B begin if enrolled; Marketplace plan must be terminated; APTC stops",
                "next_month": "Medicare effective date if enrolled during IEP",
            },
            "after_65_if_employed": {
                "employment_end": "8-month SEP for Part B begins when employment OR coverage ends (whichever first)",
                "critical": "Must enroll in Part B within 8 months — no exceptions; penalty applies if missed",
            },
        },
        "decision_tree": [
            {
                "node": "Are you still working with employer coverage at age 65?",
                "yes_path_20plus_employees": "Employer plan is primary; delay Part B without penalty; enroll in Part A (free, no premium risk) if eligible",
                "yes_path_under_20_employees": "Medicare is primary — must enroll in Part B at 65 or face permanent penalty",
                "no_path": "Enroll in Medicare Parts A and B during Initial Enrollment Period (3 months before birthday)",
            },
            {
                "node": "Do you have an HSA?",
                "yes_path": "Stop contributions 6 months before Medicare enrollment date (retroactive Part A risk); use existing HSA funds freely",
                "no_path": "No HSA considerations",
            },
            {
                "node": "Will you need Medicare Supplement (Medigap) coverage?",
                "yes_path": "Enroll in Medigap within 6 months of Part B — guaranteed issue, no medical underwriting; best rates and acceptance",
                "no_path": "Consider Medicare Advantage (Part C) as all-in-one alternative",
            },
            {
                "node": "Are current prescriptions covered by a Medicare Part D plan?",
                "yes_path": "Enroll in Part D plan during IEP (or when Part B begins); avoid Part D late enrollment penalty",
                "no_path": "Still enroll in Part D to avoid penalty; even if few prescriptions, penalty is permanent",
            },
        ],
        "state_specific_rules": {
            "state_medigap_protections": "Some states (MA, MN, WI) have standardized Medigap differently than federal standard; some offer guaranteed issue beyond initial 6-month window",
            "state_drug_assistance": "Many states have SHIP (State Health Insurance Assistance Programs) providing free Medicare counseling; Extra Help/Low Income Subsidy for Part D",
        },
        "consumer_mistakes": [
            "Continuing to contribute to HSA after Medicare Part A begins — triggers IRS excise tax",
            "Missing the 8-month Part B SEP after employer coverage ends — permanent 10%/year late enrollment penalty",
            "Keeping Marketplace APTC after Medicare enrollment begins — must repay all APTC received",
            "Not enrolling in Part D because of few prescriptions — late enrollment penalty is permanent",
            "Missing the Medigap 6-month guaranteed issue window — may face medical underwriting and denials later",
        ],
        "key_deadlines": [
            {"deadline": "3 months before 65th birthday", "action": "Initial Enrollment Period begins"},
            {"deadline": "3 months after 65th birthday", "action": "Initial Enrollment Period ends — penalty applies if missed"},
            {"deadline": "8 months after employer coverage ends", "action": "Part B SEP closes — permanent penalty if missed"},
            {"deadline": "6 months after Part B enrollment", "action": "Medigap guaranteed issue window closes"},
            {"deadline": "6 months before Medicare", "action": "Stop HSA contributions"},
        ],
        "pillar_connections": {
            "pillar_2_subsidy_engine": "APTC ineligible after Medicare enrollment — model transition income scenarios",
            "pillar_3_sbc_decoded": "Review cost-sharing before transition to ensure Medicare + supplement provides comparable coverage",
            "friction_qa": "See category: medicare_65",
        },
        "content_page_data": {
            "faq_questions": [
                "When should I enroll in Medicare?",
                "What happens to my ACA plan when I turn 65?",
                "Can I keep my health insurance and get Medicare?",
                "What is the Medicare late enrollment penalty?",
                "Should I choose Medicare Advantage or Original Medicare plus Medigap?",
                "What happens to my HSA when I go on Medicare?",
                "How do I enroll in Medicare Part D?",
            ],
            "schema_type": "HowTo",
            "related_entities": ["medicare_part_a", "medicare_part_b", "medigap", "medicare_part_d", "hsa"],
        },
    },

    # ── 7. MOVING STATES ──────────────────────────────────────────────────────
    {
        "id": "moving_states",
        "slug": "moving-states-health-insurance",
        "title": "Moving to a New State: Changing Health Insurance Across State Lines",
        "category": "coverage_change",
        "url_pattern": "/life-events/moving-states-health-insurance",
        "trigger_description": "Moving to a new state where different Marketplace plans, Medicaid rules, and insurers are available triggers an SEP and often requires new coverage.",
        "sep_details": {
            "sep_type": "Moving to a new coverage area with new qualified health plans available",
            "window_days": 60,
            "window_start": "Date of move (change of primary residence)",
            "marketplace_eligible": True,
            "medicaid_eligible": True,
            "retroactive_coverage": False,
            "notes": "Must actually change primary residence; vacation or temporary relocation does not qualify",
        },
        "documentation_needed": [
            "Proof of new address: utility bill, lease agreement, mortgage statement, or official government mail",
            "Proof of prior address (may be requested to show you moved)",
            "For state-based marketplace: create new account in new state's marketplace",
        ],
        "timeline_days": {
            "before_move": {
                "60_days_before": "Research plans available in new state; compare premiums; find in-network providers near new address",
                "30_days_before": "Check if current plan covers new state (PPO may have nationwide network; HMO typically does not)",
                "14_days_before": "Identify new primary care physician in new state; check prescription drug formulary continuity",
            },
            "after_move": {
                "day_0": "Move date — 60-day SEP begins",
                "day_1_30": "Enroll in new state Marketplace (create new account if state-based); update Medicaid with new state",
                "day_61_plus": "SEP closes; wait for Open Enrollment",
            },
        },
        "decision_tree": [
            {
                "node": "Does current plan cover the new state? (PPO nationwide vs HMO local)",
                "yes_path_ppo": "May keep current plan for transition period; but if new state is different Marketplace region, new enrollment required",
                "no_path_hmo": "Lose in-network coverage entirely in new state — must switch plans immediately",
            },
            {
                "node": "Does the new state have different Medicaid eligibility?",
                "yes_path_expansion": "Moving to Medicaid expansion state may make you newly eligible; apply immediately",
                "yes_path_non_expansion": "Moving from expansion to non-expansion state may lose Medicaid; enroll in Marketplace",
                "no_change": "Continue current Medicaid enrollment; update address with new state Medicaid agency",
            },
            {
                "node": "Is the new state a state-based marketplace (CA, NY, CO, etc.)?",
                "yes_path": "Must create new account on state marketplace (healthcare.gov application doesn't transfer); apply fresh",
                "no_path": "Update address on HealthCare.gov; new plans for new state will populate",
            },
            {
                "node": "Are current prescriptions covered on new state's available formularies?",
                "yes_path": "Select plan with matching formulary",
                "no_path": "May need to switch medications or request formulary exception; check drug coverage before enrolling",
            },
        ],
        "state_specific_rules": {
            "state_based_marketplaces": "CA (Covered California), CO (Connect for Health), CT (Access Health CT), DC (DC Health Link), ID (Your Health Idaho), KY (kynect), MA (MAhealthconnector), MD (MD Health Connection), ME (CoverME.gov), MN (MNsure), NJ (GetCoveredNJ), NM (beWellnm), NY (NY State of Health), PA (Pennie), RI (HealthSource RI), VT (Vermont Health Connect), WA (Washington Healthplanfinder)",
            "medicaid_expansion_difference": "Moving between expansion and non-expansion states may dramatically change Medicaid eligibility and premium amounts",
        },
        "consumer_mistakes": [
            "Keeping old state's plan after moving — HMO plans provide no in-network coverage outside service area",
            "Not re-applying on new state's marketplace — must create new account if moving to/from state-based marketplace",
            "Not updating Medicaid with new state — coverage terminates when old state discovers address change",
            "Forgetting to transfer prescriptions to new pharmacy in-network for new plan",
            "Not checking if new state has better subsidies or Medicaid coverage — significant premium differences by state",
        ],
        "key_deadlines": [
            {"deadline": "60 days from move date", "action": "Enroll in new state Marketplace SEP"},
            {"deadline": "As soon as possible", "action": "Update Medicaid with new state address"},
            {"deadline": "Within 30 days", "action": "Transfer prescriptions to new in-network pharmacy"},
        ],
        "pillar_connections": {
            "pillar_1_plan_intelligence": "Compare plans in new county — premium and plan availability varies dramatically by county",
            "pillar_2_subsidy_engine": "Recalculate APTC in new state (benchmark premiums differ by geography)",
            "friction_qa": "See category: sep_triggers (moving)",
        },
        "content_page_data": {
            "faq_questions": [
                "Do I need new health insurance when I move to a new state?",
                "How long do I have to change my health insurance after moving?",
                "What happens to my Medicaid if I move to a different state?",
                "Can I keep my current health insurance plan if I move?",
                "How do I get health insurance after moving to a new state?",
                "Does moving states affect my health insurance subsidy?",
                "What documents do I need to get health insurance after moving?",
            ],
            "schema_type": "HowTo",
            "related_entities": ["sep_moving", "marketplace_plans", "medicaid", "state_marketplaces"],
        },
    },

    # ── 8. IMMIGRATION STATUS CHANGE ─────────────────────────────────────────
    {
        "id": "immigration_status_change",
        "slug": "immigration-status-change-health-insurance",
        "title": "Immigration Status Change: New Health Coverage Eligibility",
        "category": "eligibility_change",
        "url_pattern": "/life-events/immigration-status-change-health-insurance",
        "trigger_description": "Gaining lawful presence status, permanent residency, or citizenship opens eligibility for ACA Marketplace coverage and potentially Medicaid.",
        "sep_details": {
            "sep_type": "Gaining lawful presence status",
            "window_days": 60,
            "window_start": "Date of approved status change",
            "marketplace_eligible": True,
            "medicaid_eligible": True,
            "retroactive_coverage": False,
            "notes": "Undocumented immigrants and DACA recipients are generally not eligible for federal Marketplace coverage",
        },
        "documentation_needed": [
            "I-551 (Permanent Resident Card / Green Card)",
            "I-94 Arrival/Departure Record with admission class showing lawful presence",
            "Asylum approval document (I-94, I-571, or court order)",
            "Refugee travel document or refugee admission letter",
            "VAWA self-petition approval (I-360)",
            "T or U visa approval notice",
            "For SSN verification: SSN card or SSA documentation",
        ],
        "timeline_days": {
            "status_change_date": {
                "day_0": "Status change — 60-day SEP begins",
                "day_1_30": "Apply for SSN if not yet obtained (SSA.gov); create HealthCare.gov account; apply for Marketplace coverage",
                "day_1_45": "Apply for Medicaid if income-eligible; 5-year bar check for LPRs (exceptions: refugees, asylees, children)",
                "day_61_plus": "Must wait for Open Enrollment or next qualifying event",
            },
            "5_year_bar_note": "LPRs (green card holders) typically must wait 5 years before Medicaid eligibility; exceptions for refugees, asylees, children, pregnant women in many states",
        },
        "decision_tree": [
            {
                "node": "What immigration status was just obtained?",
                "lpr_path": "Green card (LPR): Marketplace eligible immediately; Medicaid eligible after 5-year bar (or state funds)",
                "refugee_asylee_path": "Refugee/asylee: Medicaid eligible immediately (5-year bar exception); Marketplace eligible",
                "visa_path": "T/U visa, VAWA, Special Immigrant Visa: Marketplace eligible; Medicaid depends on specific status",
                "daca_path": "DACA: Federal Marketplace NOT eligible; state programs in CA, IL, NY, WA, CO and others",
            },
            {
                "node": "Is a Social Security Number (SSN) available for verification?",
                "yes_path": "Apply directly at HealthCare.gov or state marketplace",
                "no_path": "Apply for SSN at SSA immediately; HealthCare.gov requires SSN; call 1-800-318-2596 for assistance with non-SSN verification",
            },
            {
                "node": "Is income below Medicaid threshold (accounting for 5-year bar)?",
                "yes_path_eligible": "Apply for Medicaid — most cost-effective option with $0–minimal premium",
                "yes_path_5yr_bar": "Apply for Marketplace APTC; some states provide state-funded Medicaid during 5-year bar",
                "no_path": "Apply for Marketplace with APTC at income-appropriate level",
            },
            {
                "node": "Does a data matching issue (DMI) appear on the Marketplace application?",
                "yes_path": "Provide immigration documents as listed above; DHS SAVE system verification required; allow 7–10 business days",
                "no_path": "Proceed with standard enrollment",
            },
        ],
        "state_specific_rules": {
            "states_covering_daca": "CA (Medi-Cal), CO, IL, MA (state-funded), NY (Essential Plan), OR, WA",
            "states_covering_undocumented_children": "CA, CO, DC, IL, MA, MD, NY, OR, WA",
            "states_eliminating_5_year_bar": "CA, IL, MA, ME, NY, WA, WI provide state-funded Medicaid during federal 5-year bar for LPRs",
            "state_marketplace_rules": "Some state marketplaces (NY Essential Plan, MA) have broader eligibility for immigrants",
        },
        "consumer_mistakes": [
            "Applying too early — before immigration status is officially approved and in DHS SAVE system",
            "Not applying because of fear — lawful immigrants have full rights to Marketplace coverage; use of Marketplace is NOT public charge",
            "Missing 60-day SEP window — applying for SSN takes time; begin process immediately upon status change",
            "DACA holders applying for federal Marketplace — ineligible; use state programs instead",
            "Not disclosing immigration status accurately — DMI will arise regardless and inaccurate applications may be denied",
        ],
        "key_deadlines": [
            {"deadline": "As soon as status is approved", "action": "Apply for Social Security Number (SSA.gov)"},
            {"deadline": "60 days from status change", "action": "Marketplace SEP enrollment"},
            {"deadline": "As soon as possible", "action": "Apply for Medicaid if income-eligible (year-round)"},
        ],
        "pillar_connections": {
            "pillar_2_subsidy_engine": "Calculate APTC at current income — newly eligible immigrants often have significant subsidy eligibility",
            "pillar_1_plan_intelligence": "Find affordable plans in county",
            "friction_qa": "See category: immigration_dmi",
        },
        "content_page_data": {
            "faq_questions": [
                "Can immigrants get health insurance through the ACA Marketplace?",
                "What immigration statuses are eligible for ACA health insurance?",
                "Can DACA recipients get health insurance?",
                "Does getting Marketplace insurance affect immigration status (public charge)?",
                "What is the 5-year Medicaid waiting period for immigrants?",
                "Can undocumented immigrants get health insurance?",
                "What documents do I need to enroll in health insurance as an immigrant?",
            ],
            "schema_type": "FAQPage",
            "related_entities": ["lawful_presence", "dmi_citizenship", "medicaid_5yr_bar", "daca"],
        },
    },
]


def validate_life_events(records: list[dict[str, Any]]) -> None:
    """Validate life event records."""
    required = {"id", "slug", "title", "category", "sep_details", "documentation_needed",
                "timeline_days", "decision_tree", "consumer_mistakes", "key_deadlines",
                "pillar_connections", "content_page_data"}
    valid_categories = {"coverage_loss", "household_change", "new_coverage_eligible",
                        "coverage_change", "eligibility_change"}
    ids: set[str] = set()
    for r in records:
        missing = required - r.keys()
        assert not missing, f"{r.get('id')} missing: {missing}"
        assert r["category"] in valid_categories, f"Unknown category: {r['category']}"
        assert r["id"] not in ids, f"Duplicate ID: {r['id']}"
        ids.add(r["id"])
    logger.info(f"  Validation passed: {len(records)} life events")


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    records = LIFE_EVENTS
    logger.info(f"Life events defined: {len(records)}")
    validate_life_events(records)

    from collections import Counter
    cat_counts = Counter(r["category"] for r in records)
    logger.info("Category breakdown:")
    for cat, n in sorted(cat_counts.items()):
        logger.info(f"  {cat}: {n}")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output = {
        "metadata": {
            "source": "HealthInsuranceRenew life events + ACA regulatory knowledge (PY2026)",
            "plan_year": 2026,
            "record_count": len(records),
            "categories": dict(cat_counts),
            "disclaimer": "For informational purposes only. Individual situations vary. Consult a licensed insurance agent.",
            "generated_at": datetime.datetime.now().isoformat(),
            "schema_version": "1.0",
        },
        "data": records,
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2, default=str)
    size_kb = OUTPUT_PATH.stat().st_size / 1000
    logger.info(f"Saved {len(records)} life event records ({size_kb:.1f} KB) to {OUTPUT_PATH}")

    print(f"\nSaved {len(records)} life event records to {OUTPUT_PATH}")
    print(f"\nSample event: {records[0]['title']}")
    print(f"  SEP window: {records[0]['sep_details']['window_days']} days")
    print(f"  Documentation: {len(records[0]['documentation_needed'])} items")
    print(f"  Decision tree nodes: {len(records[0]['decision_tree'])}")
    print(f"  FAQ questions: {len(records[0]['content_page_data']['faq_questions'])}")


if __name__ == "__main__":
    main()
