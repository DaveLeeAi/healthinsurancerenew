# DESIGN.md — HealthInsuranceRenew Full Site Framework
## Version: 2.0 | Standard: V19 | Updated: March 2026

> Single source of truth for every page on the site.
> Claude Code must read this file at the start of every session.
> Do not deviate without a documented reason in the commit message.
> The V19 formulary mockup (ozempic_nc_formulary_v19.html) is the approved
> visual reference. All page types inherit from this standard.

---

## 0. BUSINESS CONTEXT

**Purpose:** Programmatic SEO authority site for ACA health insurance.
**Scale:** 150,000+ pages across 10 data pillars.
**Exit strategy:** Asset sale in ~9 months. Every architectural decision
must support a clean transfer to a new owner with zero reindexing liability.
**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Vercel

---

## 1. GLOBAL SHELL (every page inherits this)

### Semantic HTML structure
```html
<header>                          <!-- sticky nav -->
<div role="complementary"         <!-- trust/process bar — NOT inside main -->
     aria-label="Page trust information">
<main>
  <nav aria-label="Breadcrumb">
  <article>                       <!-- primary editorial content -->
    ... hero through FAQ + about block ...
  </article>
  ... supporting content (related, insurers, nav) outside article ...
  <footer class="disc">           <!-- page-level disclaimer -->
</main>
<div class="footer-bar">          <!-- site-level trust statement -->
```

### Header nav (current — do not change without updating this doc)
```
Guides | Tools | States | Plans | Subsidies | Drug Lookup | Dental | [Get Help]
```

### Trust bar — required on all inner pages
```
• {N} plans reviewed for {year}  • Data snapshot: {month year}
• Editorial process documented   • Not affiliated with any insurer
```

### Global disclaimer (footer of every page)
```
This page is for informational purposes only and does not constitute
health insurance, medical, legal, or tax advice. Always verify current
plan details before enrolling or making coverage decisions.
Data sourced from CMS Public Use Files for Plan Year {year}.
This site is not affiliated with any insurance company or government agency.
We may receive compensation when you connect with a plan or agent.
```

---

## 2. AUTHOR ATTRIBUTION RULE (asset-sale constraint)

NEVER add named author attribution — personal name, NPN, or individual
credentials — to any inner page. The site is built for future asset
transfer. Named attribution on 12,000+ inner pages creates a reindexing
liability when the site changes hands.

Use GenericByline (process-based) on all inner pages.
Personal credentials belong ONLY on /about and /editorial-policy.

```
CORRECT: "Reviewed by a licensed health insurance professional"
WRONG:   "Reviewed by Dave Lee, NPN 7578729"
```

E-E-A-T is established through:
- Organization-level credentials on /about and /editorial-policy
- The evidence block (specific plan counts = verifiable proof of work)
- Data source attribution (CMS PUF = government data = authoritative)
- GenericByline component on every inner page

---

## 3. COST DATA RULE (estimated, not live)

No page pulls live pharmacy or premium prices. All cost figures come
from plan benefit documents (CMS filings). This matches how ValuePenguin,
GoodRx, and NerdWallet handle pricing at scale.

Rules:
- One cost disclaimer per cost block — not per row or per cell
- Location: footer row of cost block or snap-qualifier below snapshot grid
- Language: "Estimated from {year} plan benefit filings — not live prices.
  Actual cost depends on your plan, pharmacy, and deductible."
- The `<time datetime="YYYY-MM-DD">` near the H1 is the data freshness
  signal to Google — keep it accurate on every page
- Never remove the cost disclaimer — it is the YMYL legal safety net

---

## 4. INFORMATION HIERARCHY (non-negotiable above-fold order)

Every page — regardless of pillar — follows this sequence.
No exceptions. No reordering.

```
1.  Breadcrumb nav
2.  H1          — human, specific, keyword-present, NO <br> tags
3.  Date line   — visible <time> element, max 2 segments (mobile safe)
4.  Lede        — 2–3 sentences, answer-first, consumer language
5.  Evidence block — data proving the lede (pillar-specific)
6.  AEO block   — single extractable sentence, clean (no caveat inside)
7.  AEO caveat  — <p> OUTSIDE and AFTER the aeo-block element
8.  Snapshot grid — 4 cells, numbers only, new info (not lede repeat)
9.  Primary CTA — green, above fold
```

Below-fold order:
```
10. Divider
11. Main data section (pillar-specific)
12. Mid CTA
13. Rules / restrictions / eligibility
14. Timeline / how-it-works
15. Ways to save / next steps
16. Limits block ("Before you make a decision")
17. Divider
18. Related entities (outside <article>)
19. Supporting entities
20. Navigation block
21. Divider
22. FAQ — static <details>/<summary> ONLY
23. About this page block
24. Education links (2 max, bottom only)
25. Bottom CTA
26. Page disclaimer footer
```

---

## 5. COMPONENT LIBRARY

### 5a. EvidenceBlock — the V19 core innovation
Visible proof for all claims. Required on every data page.

```tsx
interface EvidenceBlockProps {
  title: string      // "What we found across {N} NC plans"
  meta: string       // "2026 plan year · data snapshot January 2026"
  stats: {
    label: string    // consumer-facing label
    value: string    // the number
    sub: string      // qualifying note
    highlight?: boolean  // green for positive findings
  }[]                // exactly 3 stats
  rows: {
    key: string      // "Step therapy required"
    value: string    // "Not found in plans reviewed"
    variant?: 'default' | 'varies'
  }[]                // 3–5 rows
  note: string       // "Plan details can change. Confirm before enrolling."
}
```

### 5b. AeoBlock — AI Overview extraction target
```tsx
// CORRECT — caveat is OUTSIDE the block
<div class="aeo-block">
  <span class="aeo-label">Quick answer</span>
  <div class="aeo-answer">{single extractable sentence}</div>
</div>
<p class="aeo-caveat-note">{disclaimer}</p>

// WRONG — caveat inside block pollutes AI extraction
<div class="aeo-block">
  <div class="aeo-answer">...</div>
  <div class="aeo-caveat">...</div>  ← WRONG
</div>
```

Label is always "Quick answer" — not "TL;DR", not "Key finding".

### 5c. SnapshotGrid — 4 cells, always this order
```
Cell 1: Coverage/count    (green highlight for positive)
Cell 2: Tier/category     (varies by pillar)
Cell 3: Cost after X      ($/month — never $/fill or $/pen)
Cell 4: Cost before X     (first-encounter cost)
```
Single qualifier row below grid. No per-cell disclaimers.
No `<br>` tags — cells reflow naturally on mobile.

### 5d. StaticFaq — crawlable from first parse
```tsx
// CORRECT — static HTML, crawlable on first parse
<details className="faq-item" open>
  <summary className="faq-trig">
    {question} <span className="faq-chev">▼</span>
  </summary>
  <div className="faq-body">{answer}</div>
</details>

// WRONG — current pattern in most pages
<div id="faq"></div>
<script>faqs.forEach(f => { ... inject HTML ... })</script>
```

FAQ schema question text MUST be character-for-character identical
to the visible `<summary>` text. Google's rich result validator
fails on any mismatch.

First FAQ item always has `open` attribute — visible above fold on mobile.

### 5e. Three-CTA pattern (all pages)
```
CTA 1 — Top (green):   After snapshot grid
  "Compare {State} Plans That {Action}"
  Button: "Compare Plans →"

CTA 2 — Mid (blue bar): After main data section
  "See plans with lower {relevant metric}"
  Style: white card, left blue border accent

CTA 3 — Bottom (navy): After education links
  "Compare Plans That {Action}"
  Button: "See {State} Plan Options →"
```

### 5f. LimitsBlock — YMYL requirement
Required on all data pages. Title: "Before you make a decision, keep in mind"
Contains 4–5 dash-prefixed items explaining what the page cannot confirm.

### 5g. Component status
```
KEEP AS-IS:
  SchemaScript, LlmComment, DataAttribution, Breadcrumbs,
  LastUpdated (move near H1), YmylDisclaimer, GenericByline,
  MethodologyBlock (rename AboutBlock + V19 style)

REPLACE:
  AnswerBox      → AeoBlock (wrong label, caveat inside)
  FAQSection     → StaticFaq (JS-rendered, not crawlable)
  PageFaq        → StaticFaq (same issue)
  DrugPageCta    → Three-CTA pattern

BUILD NEW (Priority 1 — before formulary goes live):
  EvidenceBlock, AeoBlock, SnapshotGrid, StaticFaq,
  LimitsBlock, AboutBlock, ProcessBar, CostBlock,
  PlanRulesBlock

BUILD NEW (Priority 2 — before other page types):
  TimelineSteps, SavingsRows, InsurerTable,
  RelatedEntityPills, PageCtas
```

---

## 6. URL ARCHITECTURE

### Canonical patterns
| Pattern | Pillar | Primary user question |
|---|---|---|
| `/formulary/{state}/{drug}` | Formulary | Is my drug covered + cost? |
| `/formulary/{issuer}/{drug}` | Formulary | What does this carrier cover? |
| `/drugs` | Drug index | Browse drugs by category |
| `/drugs/categories/{category}` | Drug hub | What drugs are in this class? |
| `/drugs/compare/{a}-vs-{b}` | Comparison | Which is better covered? |
| `/{state-slug}/{county-slug}` | County hub | County insurance overview |
| `/{state-slug}/{county-slug}/{plan-slug}-plan` | SBC | What does this plan cover? |
| `/{state-slug}/{county-slug}/{drug-slug}-coverage` | County drug | Drug cost in my county? |
| `/{state-slug}/health-insurance-plans` | Plans | Plans in my state? |
| `/plans` | Plans index | Plans overview |
| `/subsidies/{state}/{county}` | Subsidy | How much subsidy? |
| `/rates/{state}/{county}` | Rates | Are premiums going up? |
| `/dental/{state}/{plan_variant}` | Dental | Dental plan detail |
| `/life-events/{event_type}` | Life events | What happens to my coverage? |
| `/billing/{cpt_code}` | Billing | How is this billed? |
| `/enhanced-credits/{state}/{county}` | Policy | Enhanced credit scenarios |
| `/states/{state}` | State hub | State insurance overview |
| `/guides/{slug}` | Editorial | Educational guides |
| `/faq/{category}/{slug}` | FAQ | Specific question answered |

### URL rules
- State params: full slug (`north-carolina`) not abbreviation (`nc`)
- Drug params: lowercase hyphenated (`ozempic` not `Ozempic`)
- No trailing slashes
- All existing 301 redirects must be maintained:
  - `/plan-details/{id}/{slug}` → `/{state}/{county}/{plan}-plan`
  - `/drugs/{state}/{county}/{drug}` → `/{state}/{county}/{drug}-coverage`
  - `/plans/{state}` and `/plans/{state}/{county}` are currently stubs —
    they need full page implementations (see Section 13)

---

## 7. SCHEMA BY PAGE TYPE

### The one rule that overrides all others
Never use `MedicalWebPage` on any page. Insurance decision-support
is not clinical medical content. The formulary page currently uses
`MedicalWebPage` — this must be removed as Phase 1 priority.

### Schema map
| Page type | Primary | Supporting |
|---|---|---|
| Formulary drug | `WebPage` | `FAQPage` + `Drug` in about + `BreadcrumbList` |
| Drug category/index | `WebPage` | `BreadcrumbList` |
| Drug comparison | `WebPage` | `FAQPage` + `BreadcrumbList` |
| County/state hub | `WebPage` | `FAQPage` + `BreadcrumbList` |
| SBC plan detail | `WebPage` | `HealthInsurancePlan` + `FAQPage` + `BreadcrumbList` |
| Subsidy | `WebPage` | `FAQPage` + `BreadcrumbList` |
| Rates | `WebPage` | `Dataset` + `BreadcrumbList` |
| Dental | `WebPage` | `FAQPage` + `BreadcrumbList` |
| Life events | `WebPage` | `HowTo` + `FAQPage` + `BreadcrumbList` |
| Billing/CPT | `WebPage` | `MedicalCode` + `FAQPage` + `BreadcrumbList` |
| Enhanced credits | `WebPage` | `FAQPage` + `BreadcrumbList` |
| Guides | `Article` | `FAQPage` + `BreadcrumbList` |
| FAQ pages | `FAQPage` | `BreadcrumbList` |
| Tools | `WebApplication` | `BreadcrumbList` |

### Required WebPage fields (every page)
```json
{
  "@type": "WebPage",
  "@id": "{canonical}#webpage",
  "name": "{title}",
  "description": "{meta_description}",
  "url": "{canonical}",
  "inLanguage": "en-US",
  "datePublished": "{ISO_date}",
  "dateModified": "{ISO_date}",
  "author": { "@type": "Organization" },
  "publisher": { "@type": "Organization" }
}
```

Three hard rules:
- `dateModified` in schema must match the visible `<time>` element
- Schema `description` must be identical to `<meta name="description">`
- FAQPage `name` must be identical to visible `<summary>` text

### Remove from all pages immediately
```
medicalAudience: { "@type": "MedicalAudience" }
"@type": "MedicalWebPage"
identifier: issuer  (raw CMS issuer IDs — never public-facing)
```

---

## 8. TITLE / META / H1 FORMULAS BY PAGE TYPE

### Rules applying to all pages
- Title tag: max 65 chars for keyword portion, brand at end after `|`
- Meta description: 145–155 chars, synced to WebPage schema description
- H1: NO `<br>` tags — causes misaligned wrapping on mobile
- Date line under H1: max 2 segments
- OG + Twitter tags: required on every page

### OG/Twitter (required everywhere)
```html
<meta property="og:type"         content="website">
<meta property="og:url"          content="{canonical}">
<meta property="og:title"        content="{title without brand}">
<meta property="og:description"  content="{meta_description}">
<meta property="og:site_name"    content="HealthInsuranceRenew">
<meta name="twitter:card"        content="summary">
<meta name="twitter:title"       content="{title without brand}">
<meta name="twitter:description" content="{meta_description}">
```

### Per-pillar title/H1/AEO formulas

**Formulary**
```
Title: {Drug} Coverage in {State} — Cost, Tier & Prior Authorization ({Year})
H1:    {Drug} Coverage in {State}: What It Costs, What Plans Cover It,
       and What to Know Before You Enroll
Meta:  {Drug} is covered by most {State} health plans for {year}.
       Prior authorization typically required. Typical copay after
       deductible: ${low}–${high}/month.
AEO:   {Drug} is covered by {N} of the {total} {State} health plans we
       reviewed for {year}. Most plans place it on a {tier} tier and
       require prior authorization. After your deductible, typical
       copays range from ${low}–${high} per month.
```

**County/State Hub**
```
Title: Health Insurance Plans in {County}, {State} ({Year}) — Costs & Coverage
H1:    Health Insurance in {County}, {State}: Plans, Costs, and What to Know
Meta:  {N} health plans available in {County}, {State} for {year}.
       Average premium ${x}/month. Compare plans, costs, and subsidies.
AEO:   {N} Marketplace health plans were available in {County}, {State}
       for {year}, with average monthly premiums of ${x} before subsidies.
```

**SBC Plan Detail**
```
Title: {Plan Name} — Deductible, Copays & Coverage Details ({Year})
H1:    {Plan Name}: Full Cost-Sharing Breakdown for {Year}
Meta:  {Plan Name} has a ${deductible} deductible and ${oop} out-of-pocket
       max for {year}. See copays, coinsurance, and real-world cost examples.
AEO:   {Plan Name} is a {metal} plan with a ${deductible} deductible and
       ${oop} out-of-pocket maximum for {year}.
```

**Subsidy**
```
Title: ACA Subsidy in {County}, {State} — {Year} Premium Tax Credit Estimates
H1:    Health Insurance Subsidies in {County}, {State} for {Year}
Meta:  Estimated premium tax credits for {County}, {State} for {year}.
       A single adult earning ${income}/year may qualify for ${subsidy}/month.
AEO:   In {County}, {State}, a household earning ${income}/year may qualify
       for approximately ${subsidy}/month in premium tax credits for {year}.
```

**Rate Volatility**
```
Title: Health Insurance Rates in {County}, {State} — {Year} Premium Trends
H1:    Health Insurance Premium Trends in {County}, {State} for {Year}
Meta:  Marketplace premiums in {County}, {State} changed by {X}% for {year}.
       {N} carriers offer plans. See rate trends and what drives costs.
AEO:   Marketplace premiums in {County}, {State} changed by {X}% for {year},
       with {N} carriers offering coverage across {M} plans.
```

**Life Events**
```
Title: {Event Type} and Health Insurance — What Happens to Your Coverage
H1:    {Event Type}: What Happens to Your Health Insurance Coverage
Meta:  If you {event}, you have {N} days to enroll in a new health plan.
       Here's what qualifies, what deadlines apply, and what to do next.
AEO:   {Event type} typically triggers a special enrollment period of
       {N} days, during which you can enroll in or change health
       insurance outside of open enrollment.
```

**Billing/CPT**
```
Title: CPT {code} — {Procedure} Insurance Coverage & Billing ({Year})
H1:    CPT {code}: {Procedure} — Coverage, Costs, and Billing Rules
Meta:  CPT {code} covers {procedure}. Typical cost with insurance:
       ${low}–${high}. Prior authorization required on {X}% of plans.
AEO:   CPT code {code} ({procedure}) is covered by most health plans,
       with typical patient cost of ${low}–${high} after the deductible.
```

**Guides**
```
Title: {Guide Title} — Plain-English Guide | HealthInsuranceRenew
H1:    {Guide Title}
Meta:  {frontmatter description — 145–155 chars}
Schema: Article (not WebPage)
Note:  No AEO block required — guides are long-form editorial
```

---

## 9. COPY RULES

### Forbidden phrases — search and replace before every PR
```
"per pen" / "per fill"          → "per month"
"prior auth"                    → "prior authorization" (full term)
"TL;DR"                         → "Quick answer"
"observed in"                   → "found in {N} of {total} plans"
"most plans cover"              → "covered by {N} of {total} plans reviewed"
"based on available data"       → "in our review of {N} plans"
"estimated, per [unit]"         → remove inline — one disclaimer in footer
"Plan benefit documents"        → "2026 plan benefit filings"
"ACA" in hero/H1                → "health plan" or "Marketplace plan"
"formulary" in H1               → "drug list" or "drug coverage"
"patients"                      → "people" or "enrollees"
"related conditions"            → remove
"ACA guidelines"                → remove
"FPL" in visible copy           → "income limit" (link to /fpl-2026)
"coinsurance" in hero           → move below fold
```

### Required patterns
- Cost claims: one disclaimer per cost block, not per row
- Plan counts: "in our review of {N} plans" or "{N} of {total} plans"
- Approval timelines: "generally within a few days — check your plan"
- Savings programs: single eligibility note at bottom of savings section
- 2026 subsidy context: enhanced credits expired end of 2025 — all
  subsidy and enhanced-credits pages must reflect post-enhancement rules

### Tone
- Consumer, not clinician. Decision support, not medical guidance.
- The reader is stressed. Answer first. Caveats second.
- Short sentences. Active voice.

---

## 10. DATA EXPOSURE RULES

### Never show in visible UI
- Raw CMS issuer IDs (e.g., `77422`)
- "Machine-Readable PUF" — use "plan benefit documents"
- CFR citations in hero or above-fold
- State DOI links
- Internal pipeline field names

### Acceptable attribution
```
"Based on 2026 plan benefit filings"
"From plan documents reviewed for {N} {State} plans"
"Data snapshot: January 2026"
"Source: CMS Marketplace Public Use Files"
```

---

## 11. YMYL COMPLIANCE CHECKLIST

Run before every deploy. Every box must be checked.

### Trust signals
- [ ] Visible `<time datetime="YYYY-MM-DD">` near H1
- [ ] GenericByline component present
- [ ] AboutBlock present with data source
- [ ] YmylDisclaimer in page footer
- [ ] "Not affiliated with any insurance company or government agency"
- [ ] No absolute claims without on-page evidence
- [ ] Evidence block with specific counts (data pages)

### Schema
- [ ] WebPage schema — never MedicalWebPage
- [ ] FAQPage names match visible `<summary>` text exactly
- [ ] BreadcrumbList matches visible breadcrumb
- [ ] dateModified matches visible `<time>` element
- [ ] Schema description matches `<meta name="description">`
- [ ] OG and Twitter tags present
- [ ] No medicalAudience, no raw issuer IDs

### SEO/AEO
- [ ] Title keyword in first 65 chars
- [ ] Meta description 145–155 chars
- [ ] H1 present, no `<br>` tags
- [ ] AEO block present, caveat outside the block element
- [ ] FAQ uses static `<details>/<summary>`
- [ ] "Prior Authorization" (full term) in plan rules heading
- [ ] Canonical URL correct

### Mobile
- [ ] No `<br>` in any heading
- [ ] Date line max 2 segments
- [ ] Grids stack to 1 column at 600px
- [ ] No horizontal overflow

### Accessibility
- [ ] `<main>` landmark present
- [ ] `<article>` wraps editorial content
- [ ] Trust bar has `role="complementary"`
- [ ] Breadcrumb has `aria-label="Breadcrumb"`
- [ ] First FAQ item has `open` attribute

---

## 12. PAGE-TYPE SPECIFICATIONS

### 12a. Formulary — `/formulary/{state}/{drug}`
Primary question: Is my drug covered and what does it cost?
Data: formulary_intelligence.json (20.5M records)

Required sections (order fixed):
1. Hero → evidence block → AEO → snapshot
2. Primary CTA (green)
3. Cost section (before/after deductible + vary block)
4. Mid CTA (blue)
5. Plan rules (prior auth, step therapy, supply limits — conditional)
6. Approval timeline (5 steps)
7. Ways to lower cost (savings card, pharmacy, tier, oral alt)
8. Limits block
9. Related drugs (pills) — outside article
10. Insurer table — outside article
11. State nav — outside article
12. FAQ (7 questions, static details)
13. About block + education links (2 max)
14. Bottom CTA (navy)

Conditional rendering:
```tsx
{stepTherapyCount > 0 && <StepTherapyWarning />}
{stepTherapyCount === 0 && <StepTherapyCleared />}
{quantityLimitCount > 0 && <SupplyLimitRow />}
{results.length === 0 && isState && <SBMExplanationPage />}
{plansWithDrug === 0 && <NotCoveredVariant />}
```

Snapshot cells (always this order):
```
Plans covering {drug} | Typical tier | After deductible/month | Before deductible/month
```

### 12b. SBC Plan Detail — `/{state}/{county}/{plan}-plan`
Primary question: What does this specific plan actually cover?
Data: sbc_decoded.json (20,354 plans)

Required sections:
1. Hero (plan name, metal, issuer, year)
2. Cost snapshot (deductible, OOP max, primary care, specialist)
3. SBCGrid (full cost-sharing table — keep existing component)
4. Prior authorization rules
5. Key exclusions
6. Real-world cost examples (3 scenarios)
7. Compare alternatives CTA
8. FAQ (static details)
9. About block

Schema: HealthInsurancePlan supporting WebPage.

NOTE: /plan-details/{id}/{slug} is a correct 301 redirect — do not
change the routing logic. Only update the visual/component layer in
app/[state-name]/[county-slug]/[county-page]/page.tsx (1,095 lines).

### 12c. County Hub — `/{state}/{county}`
Primary question: What plans are available in my area?
Data: plan_intelligence.json + subsidy_engine.json

Required sections:
1. Hero (county, state, plan count, average premium)
2. Plan comparison table (top plans by metal level)
3. Subsidy snapshot (savings at 3 income levels)
4. Rate trend (% change)
5. Carrier overview
6. Drug coverage link
7. FAQ (static details)
8. About block

Current status: 660 lines, mostly complete.
Primary updates needed: AnswerBox → AeoBlock, JS FAQ → static details.

### 12d. Subsidy — `/subsidies/{state}/{county}`
Primary question: How much subsidy can I get?
Data: subsidy_engine.json (1,852 counties)

CRITICAL 2026 NOTE: Enhanced subsidies expired end of 2025.
Subsidy cliff is back at 400% FPL ($62,600 single / $128,600 family of 4).
Every subsidy page must reflect 2026 rules, not 2021–2025 enhanced rules.
Verify this in every subsidy page before deploy.

Required sections:
1. Hero (county, income scenario, estimated savings)
2. SubsidyCalculator (keep existing component)
3. Income scenarios table (3 household sizes × 3 income levels)
4. How subsidies work explanation
5. Subsidy cliff warning (2026 rules — 400% FPL cap is back)
6. Enrollment CTA
7. FAQ (static details)
8. About block

### 12e. Rate Volatility — `/rates/{state}/{county}`
Primary question: Are premiums going up and by how much?
Data: rate_volatility.json (642 counties)

Required sections:
1. Hero (% change, county, year)
2. Snapshot (current vs prior year, carrier count)
3. Age 64 shock ratio
4. Carrier table (sorted by rate change)
5. Metal level breakdown
6. Market stability assessment
7. Editorial block
8. FAQ (static details)
9. About block

### 12f. Dental — `/dental/{state}` and `/dental/{state}/{plan_variant}`
Primary question: Is dental covered and what does it cost?
Data: dental_coverage.json (1,389 variants, 30 states)

State page: plan count, coverage overview, plan list, issuer comparison.
Plan variant: annual max, waiting periods, coverage grid (preventive/
basic/major/ortho), cost breakdown, restrictions.

### 12g. Life Events — `/life-events/{event_type}`
Primary question: What do I do about health insurance after this life change?
Data: life_events.json (8 SEP decision trees)
YMYL level: Very high — missed deadlines cause coverage gaps.

Required sections:
1. Hero (event, enrollment window, key deadline)
2. "Do you qualify?" decision block
3. What to do — step-by-step (TimelineSteps component)
4. Critical deadlines (specific dates when possible)
5. Documents needed
6. Common mistakes
7. State-specific rules (conditional)
8. FAQ (static details)
9. About block

Use HowTo schema for step-by-step section.

### 12h. Billing/CPT — `/billing/{cpt_code}`
Primary question: How is this procedure billed and what will I pay?
Data: billing_intel.json (20 CPT/ICD-10 scenarios)

Required sections:
1. Hero (procedure, CPT code, cost range)
2. Coverage snapshot (PA rate, typical patient cost)
3. CPT details table
4. ICD-10 codes
5. How insurance covers it
6. Surprise billing risks
7. What to do if denied
8. Cost-saving tips
9. Related procedures
10. FAQ (static details)
11. About block

### 12i. Enhanced Credits — `/enhanced-credits/{state}/{county}`
Primary question: How do the subsidy changes affect me specifically?
Data: policy_scenarios.json (1,852 counties × 30 scenarios)

CRITICAL: Enhanced subsidies expired end of 2025. Every page in this
pillar must reflect post-enhancement 2026 reality. Do not show
2021–2025 enhanced figures as current rates.

Required sections:
1. Hero (credit change, county, year-over-year impact)
2. Headline impact snapshot
3. Credit comparison (2025 enhanced vs 2026 standard)
4. Income cliff visualization (400% FPL)
5. Age-based impact
6. Local market context
7. Action steps
8. FAQ (static details)
9. About block

### 12j. State Hub — `/states/{state}`
Data: Multiple pillars aggregated.

Required sections:
1. Hero (state, plan count, average premium, top carrier)
2. State snapshot grid
3. County navigator
4. Plan data summary
5. Subsidy summary
6. Formulary link
7. Carrier overview
8. FAQ (static details)
9. About block

### 12k. Guides — `/guides/{slug}`
Schema: Article (not WebPage).
No AEO block required — guides are long-form editorial.

Required: H1 + date, Key Takeaways (if in frontmatter),
article body (markdown), Sources box, FAQ (if in frontmatter),
GenericByline, related guides.

Use AnswerBox (existing component) for key takeaway — this is one of
the few places AnswerBox is appropriate. The "TL;DR" label is acceptable
on guides since they are not YMYL-critical data pages.

### 12l. Tools — `/tools/{tool-slug}`
Schema: WebApplication.

Required: H1 + description, interactive tool (keep existing),
how-it-works explanation, disclaimer block, about block.

### 12m. FAQ Pages — `/faq/{category}/{slug}`
Schema: FAQPage (primary).

Required: H1 (the question itself), direct answer (first 2–3 sentences
answer the question directly), extended explanation, related questions
(pills), GenericByline.

---

## 13. STUB PAGES TO BUILD

These routes exist as stubs and need full implementations:

| Route | Current | Lines | Priority |
|---|---|---|---|
| `/plans/{state}` | Stub | 14 | High — heavily linked from nav |
| `/plans/{state}/{county}` | Stub | 15 | High |
| `/states/{state}/aca-2026` | Redirect | 28 | Medium |

DO NOT change these routes (correct 301 redirects, leave as-is):
- `/plan-details/{id}/{slug}` → canonical plan URL
- `/drugs/{state}/{county}/{drug}` → county drug URL

---

## 14. IMPLEMENTATION ORDER

Do not start the next phase until the current phase is complete
and validated against the YMYL checklist.

```
Phase 1 — Foundation (formulary first)
  1. Build Priority 1 components (Section 5g)
  2. Update formulary/[issuer]/[drug_name]/page.tsx to V19 standard
  3. Update lib/schema-markup.ts (remove MedicalWebPage everywhere)
  4. Update lib/content-templates.ts (copy rules throughout)
  5. Validate formulary against full YMYL checklist
  6. Test on mobile real device

Phase 2 — Sitewide fixes
  7. Build Priority 2 components (Section 5g)
  8. Convert all FAQSection/PageFaq → StaticFaq
  9. Convert all AnswerBox → AeoBlock (except guides)
  10. Add OG/Twitter meta tags to all pages missing them
  11. Sync all schema descriptions to meta descriptions
  12. Remove <br> from all H1s sitewide

Phase 3 — Critical 2026 content updates
  13. Update all subsidy pages for 2026 rules (cliff is back)
  14. Update all enhanced-credits pages for post-enhancement reality
  15. Build /plans/{state} full page (currently 14-line stub)
  16. Build /plans/{state}/{county} full page (15-line stub)

Phase 4 — Page type by page type (validate each before next)
  17. County hub pages
  18. Rate volatility pages
  19. Dental pages
  20. Life events pages
  21. Billing pages
  22. State hub pages
  23. SBC plan detail pages (most complex — 1,095 lines, handle last)
```

---

## 15. VALIDATION COMMANDS

```bash
# TypeScript
npx tsc --noEmit

# Forbidden phrases
grep -r "per pen\|per fill\|prior auth[^o]\|MedicalWebPage\|medicalAudience\|TL;DR\|most plans cover\|related conditions" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts"

# <br> in headings
grep -r "<h1.*<br\|<h2.*<br" app/ --include="*.tsx"

# JS-rendered FAQ (should return nothing after Phase 2)
grep -r "getElementById.*faq\|\.forEach.*faq\|faq.*innerHTML" \
  app/ --include="*.tsx"

# Schema/meta sync (manual)
# WebPage description === <meta name="description"> in each page
# FAQPage question names === visible <summary> text in each page
```

---

## 16. REFERENCE FILES

- `formulary-mock-up.html` — legacy V12 visual reference (superseded by V19)
- `ozempic_nc_formulary_v19.html` — V19 approved visual reference
- `CLAUDE.md` — project rules, data pipeline, coding standards
- `docs/audits/` — previous audit reports (do not regress fixed issues)
- `skills/` — data pipeline, formulary-aggregator, content-generator
- `data/config/config.json` — site configuration
- `data/config/all-states.json` — state data including SBM flags
- `lib/content-templates.ts` — all 10 pillar content generators
- `lib/schema-markup.ts` — all schema builders

---

*This document supersedes all previous design discussions.
When in doubt, match the V19 mockup exactly.
Update this file whenever a structural decision changes.*
