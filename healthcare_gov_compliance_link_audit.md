# Healthcare Gov Compliance Link Audit

---

## Summary

- **Total public-facing Healthcare.gov references found:** 60
- **Code comments (skipped — not public-facing):** 4
- **Compliance-Required Live Link:** 1
- **Plain-Text Keep:** 38
- **Rewrite:** 16
- **Remove:** 0

---

## Findings

---

### Finding 1
- **File:** `components/trust/index.tsx`
- **Lines:** 116–135
- **Public Surface:** Template — renders sitewide on all pages where the `<TrustDisclaimer>` (or equivalent) component is included
- **Current Text:** `...go to the Health Insurance Marketplace® website at HealthCare.gov` with `<a href="https://www.healthcare.gov">HealthCare.gov</a>`
- **Classification:** **Compliance-Required Live Link**
- **Why:** This is the federally mandated non-Exchange/web-broker disclosure required under 45 CFR §§ 155.220(c) and (d), which explicitly directs consumers to the Health Insurance Marketplace® website. The live link is a compliance obligation, not a stylistic choice.

---

### Finding 2
- **File:** `app/about/author/page.tsx`
- **Line:** 217
- **Public Surface:** Body
- **Current Text:** `Registered with the Federally-facilitated Marketplace (FFM) and certified to assist consumers with enrollment on HealthCare.gov.`
- **Classification:** **Plain-Text Keep**
- **Why:** This is a factual EEAT credential statement accurately describing Dave Lee's FFM certification. No hyperlink is present. The HealthCare.gov name is part of the certification description and is accurate.

---

### Finding 3
- **File:** `app/about/page.tsx`
- **Line:** 130
- **Public Surface:** Body
- **Current Text:** `HealthCare.gov and state-based exchange enrollment.`
- **Classification:** **Plain-Text Keep**
- **Why:** Factual description of the site's content scope in the About page. No hyperlink. Plain text reference to the two enrollment platforms is accurate.

---

### Finding 4
- **File:** `app/enhanced-credits/[state]/[county]/page.tsx`
- **Line:** 553
- **Public Surface:** Body — ActionTip component
- **Current Text:** `"report changes to Healthcare.gov promptly and consider strategies to manage your modified adjusted gross income."`
- **Classification:** **Rewrite**
- **Why:** This page serves all states, including SBM states where enrollees report changes to their state exchange, not Healthcare.gov.
- **Suggested Rewrite:** `"report changes to your Marketplace account promptly and consider strategies to manage your modified adjusted gross income."`

---

### Finding 5
- **File:** `app/formulary/[issuer]/[drug_name]/page.tsx`
- **Line:** 1775
- **Public Surface:** Body — page disclaimer footer
- **Current Text:** `verify current coverage with your insurance carrier or at healthcare.gov.`
- **Classification:** **Rewrite**
- **Why:** Formulary pages serve plans across all 51 jurisdictions, including SBM states. Directing SBM enrollees to healthcare.gov for verification is inaccurate.
- **Suggested Rewrite:** `verify current coverage with your insurance carrier or through the Health Insurance Marketplace website.`

---

### Finding 6
- **File:** `app/formulary/[issuer]/[drug_name]/page.tsx`
- **Line:** 1901
- **Public Surface:** Body — footer disclaimer (alternate rendering path)
- **Current Text:** `Always verify current coverage with your insurance carrier or at healthcare.gov.`
- **Classification:** **Rewrite**
- **Why:** Same as Finding 5 — formulary pages serve all states. SBM enrollees cannot use healthcare.gov.
- **Suggested Rewrite:** `Always verify current coverage with your insurance carrier or through the Health Insurance Marketplace website.`

---

### Finding 7
- **File:** `app/guides/bronze-vs-silver-plan-2026/page.tsx`
- **Line:** 167
- **Public Surface:** Body
- **Current Text:** `with benchmark Silver plans on Healthcare.gov states increasing 30%.`
- **Classification:** **Rewrite**
- **Why:** "Healthcare.gov states" is informal shorthand that names the platform unnecessarily. The accurate technical term is "federal marketplace states" or "FFM states."
- **Suggested Rewrite:** `with benchmark Silver plans in federal marketplace (FFM) states increasing 30%.`

---

### Finding 8
- **File:** `app/guides/glp-1-drugs-covered-by-aca-plans/page.tsx`
- **Line:** 55
- **Public Surface:** Body — step-by-step instructions
- **Current Text:** `'Sign in at Healthcare.gov, find your plan, and open the Plan Documents section. Download the prescription drug list (formulary) PDF...'`
- **Classification:** **Rewrite**
- **Why:** This guide is national. SBM state enrollees do not have accounts at Healthcare.gov. The instruction is inaccurate for approximately one-third of ACA enrollees.
- **Suggested Rewrite:** Remove the specific platform name; direct users to their marketplace account without naming the platform — e.g., `'Sign in at your marketplace account, find your plan, and open the Plan Documents section...'`

---

### Finding 9
- **File:** `app/how-we-get-paid/page.tsx`
- **Line:** 94
- **Public Surface:** Body
- **Current Text:** `premium is the same as it would be enrolling directly through HealthCare.gov or a state-based exchange.`
- **Classification:** **Plain-Text Keep**
- **Why:** This is a consumer protection / agent compensation transparency disclosure. The comparison between the agent channel and the direct enrollment channel (HealthCare.gov or state exchange) is accurate, relevant, and appropriate. No hyperlink. Plain text reference supports consumer trust.

---

### Finding 10
- **File:** `app/plans/page.tsx`
- **Lines:** 47, 55, 57, 189, 244
- **Public Surface:** Body and UI labels
- **Current Text (all five instances):**
  - L47: `"through either Healthcare.gov or a state-run exchange"`
  - L55: `"How do I know if my state uses Healthcare.gov or its own exchange?"`
  - L57: `"About 30 states use the federal marketplace at Healthcare.gov (also called FFM states)."`
  - L189: `"These {ffmStates.length} states use Healthcare.gov (the federal marketplace)."`
  - L244: `"These states use Healthcare.gov but county-level plan data has not been loaded yet."`
- **Classification:** **Plain-Text Keep**
- **Why:** All five are factual, plain text descriptions or UI labels distinguishing FFM from SBM states. The page is specifically about explaining the two marketplace types, making Healthcare.gov an accurate and necessary term. No hyperlinks present.

---

### Finding 11
- **File:** `app/self-employed-health-insurance-2026/page.tsx`
- **Line:** 104
- **Public Surface:** Body
- **Current Text:** `Healthcare.gov or your state exchange, and your subsidy is based on your projected annual household income.`
- **Classification:** **Plain-Text Keep**
- **Why:** Enrollment path guidance that correctly names both platforms. No hyperlink. The pairing "Healthcare.gov or your state exchange" covers both enrollment paths accurately.

---

### Finding 12
- **File:** `app/states/[state]/page.tsx`
- **Lines:** 121, 326
- **Public Surface:** Body (FAQ) and UI label
- **Current Text:**
  - L121: Used as a conditional value: `exchange === 'Healthcare.gov' ? 'January 15' : ...`
  - L326: `'Federal exchange (Healthcare.gov)'`
- **Classification:** **Plain-Text Keep**
- **Why:** Line 121 is a template condition that determines rendered FAQ copy based on whether the state uses Healthcare.gov — functionally correct. Line 326 is a plain text UI label. Neither is a hyperlink. Both are factual identifiers.

---

### Finding 13
- **File:** `app/states/page.tsx`
- **Lines:** 58, 183, 261, 303
- **Public Surface:** Body, UI labels, tab header
- **Current Text:**
  - L58: `"The remaining states use the federal marketplace at Healthcare.gov."`
  - L183: `"operates its own health insurance exchange or uses the federal marketplace at Healthcare.gov."`
  - L261: `Healthcare.gov ({ffmStates.length})` — tab label
  - L303: `{state.ownExchange ? state.exchange : 'Healthcare.gov'}` — table cell
- **Classification:** **Plain-Text Keep**
- **Why:** All four are plain text factual references on a page whose explicit purpose is distinguishing SBM from FFM states. Using Healthcare.gov as the identifier for the federal marketplace is accurate and necessary on this page.

---

### Finding 14
- **File:** `app/subsidies/[state]/[county]/page.tsx`
- **Line:** 238
- **Public Surface:** Body
- **Current Text:** `To use your credit, you apply it when enrolling through HealthCare.gov or your state marketplace.`
- **Classification:** **Plain-Text Keep**
- **Why:** The "or your state marketplace" qualifier makes this accurate for both FFM and SBM enrollees. No hyperlink. Plain text.

---

### Finding 15
- **File:** `app/subsidies/[state]/page.tsx`
- **Lines:** 68, 152
- **Public Surface:** Body
- **Current Text:**
  - L68: `` `Subsidies work the same whether you enroll through ${stateEntry.exchange} or Healthcare.gov.` ``
  - L152: `<strong>{stateEntry.exchange}</strong> or Healthcare.gov.`
- **Classification:** **Rewrite**
- **Why:** This template renders on SBM state pages (e.g., California, New York). On those pages, `stateEntry.exchange` is the SBM exchange name, making "or Healthcare.gov" inaccurate and potentially confusing — SBM enrollees do not use Healthcare.gov. The sentence structure also implies the two are interchangeable options for the same user, which they are not.
- **Suggested Rewrite (both lines):** Remove the "or Healthcare.gov" clause entirely. The point (subsidy rules are uniform) does not require naming the federal platform on a state-specific SBM page.

---

### Finding 16
- **File:** `app/tools/family-coverage-estimator/page.tsx`
- **Line:** 170
- **Public Surface:** Body — helper text
- **Current Text:** `Check Healthcare.gov or your state exchange for this amount.`
- **Classification:** **Plain-Text Keep**
- **Why:** Includes "or your state exchange" — accurate for both enrollment paths. No hyperlink. Plain text.

---

### Finding 17
- **File:** `app/tools/family-coverage-estimator/page.tsx`
- **Line:** 242
- **Public Surface:** Body — tool output disclaimer
- **Current Text:** `For accurate numbers, apply through Healthcare.gov.`
- **Classification:** **Rewrite**
- **Why:** National tool — SBM state users cannot apply through Healthcare.gov. The disclaimer should cover both enrollment paths.
- **Suggested Rewrite:** `For accurate numbers, apply through the Health Insurance Marketplace or your state exchange.`

---

### Finding 18
- **File:** `app/tools/income-savings-calculator/page.tsx`
- **Line:** 233
- **Public Surface:** Body — calculator output
- **Current Text:** `Healthcare.gov or your state marketplace.`
- **Classification:** **Plain-Text Keep**
- **Why:** The "or your state marketplace" qualifier makes this accurate for all states. No hyperlink. Plain text.

---

### Finding 19
- **File:** `app/tools/page.tsx`
- **Line:** 233
- **Public Surface:** Body — FAQ answer
- **Current Text:** `'To actually enroll, visit Healthcare.gov or your state exchange, or connect with a licensed agent.'`
- **Classification:** **Plain-Text Keep**
- **Why:** The "or your state exchange" qualifier covers both enrollment paths. No hyperlink. Plain text. Accurate enrollment guidance.

---

### Finding 20
- **File:** `app/turning-26-health-insurance-options/page.tsx`
- **Line:** 125
- **Public Surface:** Body
- **Current Text:** `compare plans, check eligibility for premium tax credits, and enroll through Healthcare.gov or your state exchange.`
- **Classification:** **Plain-Text Keep**
- **Why:** Both enrollment paths named correctly. No hyperlink.

---

### Finding 21
- **File:** `app/[state-name]/[county-slug]/page.tsx`
- **Lines:** 430, 662, 701
- **Public Surface:** Body and UI label
- **Current Text:**
  - L430: `<dd className="font-semibold text-navy-800">FFM (HealthCare.gov)</dd>`
  - L662: `"You can compare them on HealthCare.gov during Open Enrollment (November 1 – January 15). Source: federal marketplace plan data ${PLAN_YEAR}."`
  - L701: `"Apply through HealthCare.gov during Open Enrollment or a qualifying Special Enrollment Period."`
- **Classification:** **Plain-Text Keep**
- **Why:** The `[county-slug]` pages with FFM data are federal marketplace pages — they explicitly cite "federal marketplace plan data" as the source. For FFM county pages, directing users to HealthCare.gov is accurate. All three are plain text (no hyperlinks).

---

### Finding 22
- **File:** `app/[state-name]/health-insurance-plans/page.tsx`
- **Lines:** 98, 114, 133, 159, 169, 191, 277, 280, 284–285, 337, 403, 553, 841
- **Public Surface:** Body (FAQ answers, state intro paragraphs, enrollment guidance, UI label)
- **Current Text (representative samples):**
  - L98: `'Unlike states on Healthcare.gov, Covered California negotiates...'` (CA SBM page)
  - L114: `'Does Covered California have different enrollment dates than Healthcare.gov?'` (CA SBM FAQ)
  - L133: `'...approximately 3.6 million residents enrolled through Healthcare.gov.'` (FL FFM page)
  - L159: `'Florida uses the federal Healthcare.gov marketplace...'` (FL FFM page)
  - L284–285: `'${stateName} uses Healthcare.gov, the federally facilitated marketplace (FFM)...'` (FFM states)
  - L553: `const exchangeLabel = isSbm ? stateEntry.exchange : 'Healthcare.gov (the federal marketplace)'`
  - L841: `'Healthcare.gov (FFM)'` (UI label for FFM states)
- **Classification:** **Plain-Text Keep** for all 14 instances
- **Why:** This template conditionally renders the correct content per state type (SBM vs FFM). SBM state pages correctly contrast their exchange against Healthcare.gov. FFM state pages correctly identify Healthcare.gov as the enrollment platform. All references are plain text (no hyperlinks). The conditional logic (`isSbm ? ... : 'Healthcare.gov'`) ensures the accurate exchange name is always used. Changing these would reduce factual clarity without compliance benefit.

---

### Finding 23
- **File:** `components/FormularySearch.tsx`
- **Line:** 54
- **Public Surface:** UI — dropdown option group label
- **Current Text:** `<optgroup label="Healthcare.gov States (FFM)">`
- **Classification:** **Plain-Text Keep**
- **Why:** Dropdown UI label grouping FFM states. Plain text. Accurate categorization that helps users identify the correct enrollment channel.

---

### Finding 24
- **File:** `components/plan/PlanFAQ.tsx`
- **Line:** 110
- **Public Surface:** Body — FAQ answer
- **Current Text:** `Check eligibility at HealthCare.gov using the plan finder tool.`
- **Classification:** **Plain-Text Keep**
- **Why:** CSR eligibility guidance directing users to the Marketplace plan finder. No hyperlink. Plain text. The HealthCare.gov plan finder is the accurate tool for this task (CSR eligibility is determined at enrollment). Note: this FAQ only appears on Silver plan pages; however, since the plan could be in an SBM state, this warrants monitoring — SBM enrollees use their state exchange's plan finder, not HealthCare.gov.

---

### Finding 25
- **File:** `components/plan/PlanMetalContext.tsx`
- **Line:** 89
- **Public Surface:** Body — informational note on plan detail pages
- **Current Text:** `"Review the plan details at HealthCare.gov to see CSR-enhanced variants, which may carry a lower deductible and out-of-pocket maximum if you qualify."`
- **Classification:** **Rewrite**
- **Why:** Plan detail pages render for plans across all states, including SBM states. SBM state enrollees cannot review plan details at HealthCare.gov. This instruction is inaccurate for a material portion of users.
- **Suggested Rewrite:** `"Review the plan details at the Health Insurance Marketplace website or your state exchange to see CSR-enhanced variants, which may carry a lower deductible and out-of-pocket maximum if you qualify."`

---

### Finding 26
- **File:** `components/SubsidyCalculator.tsx`
- **Line:** 253
- **Public Surface:** Body — Medicaid/CHIP eligibility alert
- **Current Text:** `<strong>healthcare.gov</strong>` in `"Visit healthcare.gov or your state Medicaid office to verify eligibility before enrolling in a marketplace plan."`
- **Classification:** **Plain-Text Keep**
- **Why:** Already plain text (bold only, no hyperlink). The "or your state Medicaid office" qualifier covers both FFM and SBM scenarios. Direction to healthcare.gov for Medicaid eligibility verification is appropriate, as healthcare.gov has federal Medicaid eligibility screening. No action needed.

---

### Finding 27
- **File:** `lib/content-templates.ts`
- **Line:** 443
- **Public Surface:** Generated body copy — subsidy/APTC reconciliation template
- **Current Text:** `"Most enrollees choose advance payment through HealthCare.gov."`
- **Classification:** **Rewrite**
- **Why:** This template generates content for all states. SBM state enrollees advance-pay through their state exchange, not HealthCare.gov. The statement is inaccurate for approximately one-third of ACA enrollees.
- **Suggested Rewrite:** `"Most enrollees choose advance payment through the Marketplace."`

---

### Finding 28
- **File:** `lib/content-templates.ts`
- **Line:** 446
- **Public Surface:** Generated body copy — subsidy/APTC reconciliation template
- **Current Text:** `"Report income changes promptly to HealthCare.gov to minimize reconciliation surprises at tax time."`
- **Classification:** **Rewrite**
- **Why:** SBM state enrollees report income changes to their state exchange. "HealthCare.gov" is inaccurate for these users.
- **Suggested Rewrite:** `"Report income changes promptly to your Marketplace account to minimize reconciliation surprises at tax time."`

---

### Finding 29
- **File:** `lib/content-templates.ts`
- **Line:** 576
- **Public Surface:** Generated body copy — SBC comparison page disclaimer
- **Current Text:** `"always verify current cost-sharing details directly with the carrier or at HealthCare.gov before enrolling"`
- **Classification:** **Rewrite**
- **Why:** SBC comparison pages serve all states. "at HealthCare.gov" is inaccurate for SBM state users.
- **Suggested Rewrite:** `"always verify current cost-sharing details directly with the carrier or through the Health Insurance Marketplace website before enrolling"`

---

### Finding 30
- **File:** `lib/content-templates.ts`
- **Line:** 1143
- **Public Surface:** Generated body copy — life events documentation fallback
- **Current Text:** `'<p>Documentation requirements vary. Have proof of the qualifying event ready when enrolling at HealthCare.gov.</p>'`
- **Classification:** **Rewrite**
- **Why:** Life events templates generate content for all states. SBM enrollees enroll at their state exchange.
- **Suggested Rewrite:** `'<p>Documentation requirements vary. Have proof of the qualifying event ready when enrolling through the Marketplace.</p>'`

---

### Finding 31
- **File:** `lib/content-templates.ts`
- **Line:** 1173
- **Public Surface:** Generated body copy — life events SEP documentation section
- **Current Text:** `"HealthCare.gov may request documentation verifying your qualifying life event."`
- **Classification:** **Rewrite**
- **Why:** "HealthCare.gov may request" should be "The Marketplace may request" to cover SBM states where the state exchange, not HealthCare.gov, processes documentation.
- **Suggested Rewrite:** `"The Marketplace may request documentation verifying your qualifying life event."`

---

### Finding 32
- **File:** `lib/content-templates.ts`
- **Line:** 1191
- **Public Surface:** Generated body copy — life events SEP subsidy eligibility section
- **Current Text:** `"Update your income and household information on HealthCare.gov when enrolling during your SEP"`
- **Classification:** **Rewrite**
- **Why:** SBM enrollees update income information on their state exchange, not HealthCare.gov.
- **Suggested Rewrite:** `"Update your income and household information on the Marketplace when enrolling during your SEP"`

---

### Finding 33
- **File:** `lib/content-templates.ts`
- **Line:** 1312
- **Public Surface:** Generated body copy — rate/subsidy table footnote
- **Current Text:** `"Estimated figures — verify at HealthCare.gov."`
- **Classification:** **Rewrite**
- **Why:** This table footnote is generated for all states. SBM state users cannot verify at HealthCare.gov.
- **Suggested Rewrite:** `"Estimated figures — verify at the Marketplace website or your state exchange."`

---

### Finding 34
- **File:** `lib/iowa-mvp/guardrails.ts`
- **Lines:** 119, 121, 123
- **Public Surface:** Disclaimer strings rendered in the Iowa plan comparison tool
- **Current Text:**
  - L119: `"Talk to a licensed agent or visit HealthCare.gov before making enrollment decisions."`
  - L121: `"Always verify details directly with the carrier or HealthCare.gov before enrolling."`
  - L123: `"Use the official HealthCare.gov calculator for binding estimates."`
- **Classification:** **Plain-Text Keep** for all three
- **Why:** Iowa is an FFM state. These are Iowa-specific disclaimers for an Iowa-specific tool. Directing Iowa users to HealthCare.gov is accurate and appropriate. No hyperlinks.

---

### Finding 35
- **File:** `lib/iowa-mvp/scoring.ts`
- **Lines:** 480, 540
- **Public Surface:** Scoring flags/messages rendered in the Iowa plan comparison tool
- **Current Text:**
  - L480: `"Based on this income estimate, you may not qualify for premium tax credits. Verify with HealthCare.gov."`
  - L540: `"Confirm your exact premium and tax credit on HealthCare.gov using your actual household and income details."`
- **Classification:** **Plain-Text Keep** for both
- **Why:** Iowa-specific tool. Iowa uses HealthCare.gov (FFM state). Both are plain text scoring messages — accurate guidance for this tool's context.

---

## Skipped (Code Comments — Not Public-Facing)

| File | Line | Content |
|------|------|---------|
| `app/formulary/page.tsx` | 19 | `// FFM states: plan data from Healthcare.gov PUF` — internal dev comment |
| `components/plan/PlanAuthorityBlock.tsx` | 6 | `* - References CMS / Healthcare.gov / CFR regulatory citations` — JSDoc comment |
| `lib/plan-sources/federal-adapter.ts` | 8 | `// (those that use Healthcare.gov / federal marketplace).` — internal comment |
| `lib/plan-sources/source-registry.ts` | 21 | `// These states do NOT use Healthcare.gov for enrollment.` — internal comment |

---

## Kept Live Links

| Finding | File | Lines | Reason |
|---------|------|-------|--------|
| 1 | `components/trust/index.tsx` | 127–134 | Federally required web-broker disclosure under 45 CFR §§ 155.220(c) and (d). The regulation requires explicitly directing users to the Health Insurance Marketplace® website. A clickable link satisfies the spirit of the disclosure more clearly than plain text. This is the only live hyperlink to Healthcare.gov in the entire codebase and it must stay. |

---

## Priority Rewrites (SBM Accuracy — Highest Risk)

The 10 rewrite findings in `lib/content-templates.ts` and the three app-level findings in `subsidies/[state]/page.tsx`, `formulary/[issuer]/[drug_name]/page.tsx`, and `enhanced-credits/[state]/[county]/page.tsx` are the most impactful because they affect national or multi-state pages where directing SBM enrollees to HealthCare.gov is factually wrong.

| Finding | File | Line(s) |
|---------|------|---------|
| 4 | `app/enhanced-credits/[state]/[county]/page.tsx` | 553 |
| 5 | `app/formulary/[issuer]/[drug_name]/page.tsx` | 1775 |
| 6 | `app/formulary/[issuer]/[drug_name]/page.tsx` | 1901 |
| 15 | `app/subsidies/[state]/page.tsx` | 68, 152 |
| 17 | `app/tools/family-coverage-estimator/page.tsx` | 242 |
| 25 | `components/plan/PlanMetalContext.tsx` | 89 |
| 27–33 | `lib/content-templates.ts` | 443, 446, 576, 1143, 1173, 1191, 1312 |

---

*Audit completed: 2026-04-24. Audit only — no files modified.*
