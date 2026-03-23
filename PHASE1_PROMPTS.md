# PHASE 1 — Formulary Page Redesign Prompts
## HealthInsuranceRenew · V19 Standard · March 2026

> **PHASE 1 COMPLETE** — Formulary template locked at 9.5/10, scored by external LLM reviewers (ChatGPT, Gemini). This file is now historical reference only. Do not re-run these prompts.

> **How to use this file:**
> Run each prompt one at a time in Claude Code.
> Wait for it to finish and confirm the checkpoint before moving to the next.
> Do NOT skip ahead. Each prompt depends on the previous one.

---

## PROMPT 0 — Context Load (run this first, every session)

```
Read these files before doing anything else:
1. DESIGN.md (project root — sitewide design rules)
2. ozempic_nc_formulary_v19.html (in project root or uploads — the V19 approved mockup)
3. app/formulary/[issuer]/[drug_name]/page.tsx (current formulary page, 2040 lines)

Confirm you've read all three. List the V19 above-fold section order
and the current page's above-fold section order side by side.
Do not write any code yet.
```

---

## PROMPT 1 — Build Priority 1 Components (new files only)

```
Read DESIGN.md Section 5 and ozempic_nc_formulary_v19.html.

Create these 9 new component files in components/. Match the V19 HTML
structure and CSS classes exactly — convert to Tailwind + TypeScript.

Use the V19 CSS variables as Tailwind custom values where needed.
Every component must be a typed React server component with no client
interactivity unless noted.

1. components/ProcessBar.tsx
   - V19 class: .pbar
   - Props: { items: string[] }
   - Renders: role="complementary" aria-label="Page trust information"
   - Green dots + trust items in a centered flex row
   - Dark background (ink-2 from V19)

2. components/AeoBlock.tsx
   - V19 classes: .aeo-block, .aeo-label, .aeo-answer, .aeo-caveat-note
   - Props: { label?: string, answer: string, caveat: string }
   - Default label: "Quick answer" (DESIGN.md 5b says this, but V19 uses
     "At a glance" — use "Quick answer" per DESIGN.md, we'll update V19)
   - CRITICAL: caveat renders as a SEPARATE <p> OUTSIDE the .aeo-block div
   - Left blue border accent, white background

3. components/EvidenceBlock.tsx
   - V19 classes: .evidence-block, .evidence-hdr, .evidence-grid, .ev-cell,
     .evidence-rows, .ev-row, .evidence-note
   - Props: match DESIGN.md Section 5a interface exactly:
     { title, meta, stats: {label,value,sub,highlight?}[],
       rows: {key,value,variant?}[], note }
   - 3-column grid for stats, stacks to 1-col at 600px
   - Detail rows below grid
   - Note row at bottom with italic text

4. components/CostBlock.tsx
   - V19 classes: .cost-block, .cost-row, .cost-vary-block
   - Props: { rows: {name,desc,figure,unit,barPercent?,barColor?}[],
     note: string, varyRows?: {key,value}[] }
   - Rows with left text, optional progress bar, right figure
   - Vary block renders below if varyRows provided

5. components/PlanRulesBlock.tsx
   - V19 classes: .rules-block, .rule-row, .rr-badge, .rr-title, .rr-body
   - Props: { rules: {badge:'blue'|'green'|'gray', badgeText:string,
     title:string, observation:string, body:string|ReactNode}[] }
   - Badge colors: blue=active requirement, green=cleared, gray=partial

6. components/TimelineSteps.tsx
   - V19 classes: .tl-item, .tl-n, .tl-title, .tl-desc, .tl-time
   - Props: { steps: {title,desc,time}[] }
   - Numbered circles with step content

7. components/SavingsRows.tsx
   - V19 classes: .sv-row, .sv-icon, .sv-title, .sv-desc, .sv-note
   - Props: { rows: {icon:string, title:string, desc:string|ReactNode}[],
     note?: string }

8. components/LimitsBlock.tsx
   - V19 classes: .limits-block, .limits-title, .limit-item, .limit-dash
   - Props: { title?: string, items: string[] }
   - Default title: "What this page can't confirm"
   - Dash-prefixed items

9. components/AboutBlock.tsx
   - V19 classes: .about-block, .about-reviewed, .about-links
   - Props: { text: string, reviewedLine: string,
     links: {href:string, label:string}[] }
   - Green dot before reviewed line

For ALL components:
- Use Tailwind classes that match V19's visual output
- Where V19 uses CSS variables (--ink, --blue, --rule, etc), map to
  appropriate Tailwind values: slate-900, blue-700, gray-200, etc.
- Export as default
- No "use client" unless strictly required
- Add a brief JSDoc comment at the top of each file

CHECKPOINT: After creating all 9 files, run `npx tsc --noEmit` and
fix any TypeScript errors. Report which files were created.
```

---

## PROMPT 2 — Update DESIGN.md Reference

```
Open DESIGN.md in the project root.

Make these two changes:
1. Line 2: Change "Standard: V12" to "Standard: V19"
2. Lines 7-8: Change the reference from "V12 formulary mockup
   (formulary-mock-up.html)" to "V19 formulary mockup
   (ozempic_nc_formulary_v19.html)"

Copy ozempic_nc_formulary_v19.html into the project root if it's not
already there (it should sit alongside the old formulary-mock-up.html).

Do not delete the old mockup file — keep it for reference.

CHECKPOINT: Confirm the two DESIGN.md lines changed. Show the diff.
```

---

## PROMPT 3 — Schema Fixes (lib/schema-markup.ts)

```
Read DESIGN.md Section 7 (Schema by Page Type).

Open lib/schema-markup.ts and make these changes:

1. Find the buildFormularyDrugSchema function. Change the @type from
   "MedicalWebPage" to "WebPage" everywhere it appears.

2. Remove any "medicalAudience" property from all schema builders.

3. Remove any "identifier: issuer" or raw CMS issuer ID exposure
   from the HealthInsurancePlan schema.

4. In the WebPage schema, ensure the description field is built from
   the same source as the <meta name="description"> content — they
   must be identical strings.

5. Ensure dateModified is NOT new Date().toISOString(). It should be
   a stable date string (e.g., "2026-03-20") that matches the visible
   <time> element we'll add in the next prompt.

Do NOT touch any other schema builders — only formulary-related ones.

CHECKPOINT: Run these greps and confirm zero results:
  grep -r "MedicalWebPage" lib/ --include="*.ts"
  grep -r "medicalAudience" lib/ --include="*.ts"
  grep -r "identifier: issuer" lib/ --include="*.ts"
```

---

## PROMPT 4 — Copy Rule Fixes (lib/content-templates.ts)

```
Read DESIGN.md Section 9 (Copy Rules — forbidden phrases).

Open lib/content-templates.ts. Search for and fix every instance of:

| Find | Replace with |
|------|-------------|
| "per fill" | "per month" |
| "per pen" | "per month" |
| "Machine-Readable PUF" | "plan benefit filings" |
| "Machine-Readable Public Use Files" | "plan benefit filings" |
| "MR-PUF" (in visible copy, not variable names) | "plan benefit documents" |
| "most plans cover" | rewrite to "{N} of {total} plans reviewed" pattern |
| "patients" (in consumer-facing text) | "people" or "enrollees" |
| "related conditions" | remove the phrase |
| "ACA" in hero/lede text | "Marketplace" or "health plan" |

Do NOT change variable names, function names, or code comments.
Only change strings that will appear in rendered HTML.

CHECKPOINT: Run this grep and confirm zero matches in visible strings:
  grep -rn "per pen\|per fill\|Machine-Readable\|most plans cover\|related conditions" \
    lib/content-templates.ts
Report how many replacements were made.
```

---

## PROMPT 5 — Rewrite the Formulary Page (the big one)

```
This is the main rewrite. Read these files first:
- DESIGN.md (full file, especially Sections 4, 5, 9, 11, 12a)
- ozempic_nc_formulary_v19.html (the visual standard)
- The 9 new components in components/ (from Prompt 1)
- app/formulary/[issuer]/[drug_name]/page.tsx (current file)

IMPORTANT: Keep ALL existing data logic — the imports, generateStaticParams,
generateMetadata, searchFormulary calls, tier/restriction computations,
clinical data lookup, entity linking, SBMExplanationPage, and helper
functions. Those are correct. You are ONLY rewriting the JSX rendering
inside the FormularyDrugPage return() block and the metadata.

Rewrite the page following this exact section order from DESIGN.md 12a
and V19. Use the new components from Prompt 1.

ABOVE FOLD (inside <article>):
1.  Breadcrumb — keep current, but change "Formulary" text to "Drug Coverage"
2.  H1 — use V19 formula: "{Drug} Coverage in {State}: What {N} Health
    Plans Show for {Year}" — include total plan count in H1
3.  Date line — <time datetime="2026-03-20">Last reviewed March 2026</time>
    · {State} {Year} — exactly 2 segments, using <time> element
4.  AeoBlock — single answer sentence with coverage count, tier, PA status.
    Caveat outside. Label: "Quick answer"
5.  EvidenceBlock — 3 stats (plans covering, typical tier, PA count) +
    2-3 detail rows (step therapy, supply limits) + note
6.  Primary CTA (green) — "Find a {State} Plan That Covers {Drug}"
    Button: "Compare Plans →". Link to /contact

DIVIDER

BELOW FOLD — MAIN DATA (inside <article>):
7.  Cost section label: "How much {Drug} costs on {State} plans"
    Intro paragraph (V19 style). CostBlock with 3 rows:
    - Before deductible ($400-$650/month range from humanTiers)
    - After deductible — preferred tier
    - After deductible — non-preferred tier (conditional)
    CostVary block with 3 rows: tier placement, pharmacy choice,
    deductible structure

8.  Mid CTA (blue accent, white bg, left blue border) —
    "See plans in {State} with lower out-of-pocket drug costs"
    Button: "Compare Plans →"

9.  Plan rules section label: "Plan rules for {Drug}"
    PlanRulesBlock with 3 rules:
    - Prior authorization (blue badge if required, green if not) with
      observation count "— {N} of {M} plans we reviewed"
    - Step therapy (green if cleared, blue if required) with obs count
    - Supply limits (gray badge) with obs count
    All conditional on the data.

10. Approval timeline — section label: "How the prior authorization
    process works". Only show if hasPriorAuth. TimelineSteps with
    5 steps matching V19 exactly.

11. Ways to save — section label: "Ways to pay less". SavingsRows with
    4 items: manufacturer savings card, preferred pharmacy/mail-order,
    choose favorable tier plan, ask about oral version (link to rybelsus).
    Conditional items based on drug data.

12. LimitsBlock — "What this page can't confirm" with 5 items matching
    V19's content pattern (exact pharmacy cost, PA approval criteria,
    mid-year drug list changes, plan-specific timelines, savings card
    eligibility).

DIVIDER — close </article> here

OUTSIDE ARTICLE (supporting content):
13. Related drugs — drug pills (RelatedEntityPills style from V19)
14. Insurer table — V19 .ins-block style with insurer name, PA status,
    tier badge per row
15. State nav — "See drug coverage data for all medications reviewed in
    {State} health plans." Button: "All {State abbrev} drug coverage →"

BACK TO SHARED:
16. FAQ — trim to exactly 7 questions. Use static <details>/<summary>.
    First item open. Match V19 question text EXACTLY for schema sync.
    The 7 questions (adapt from V19):
    a. Is {Drug} covered by {State} health plans in {Year}?
    b. How much will {Drug} cost me before I meet my deductible?
    c. Will I need approval from my insurance before picking up {Drug}?
    d. What tier does {Drug} fall under in {State} plans?
    e. What if my plan doesn't cover {Drug}?
    f. Can I switch plans to get {Drug} covered in {State}?
    g. What's the difference between a coverage exception and prior approval?

17. AboutBlock — "About this page" with data methodology, reviewed line
    with green dot, 3 links (editorial policy, review process, about)

18. Education links — max 2:
    - "How your deductible affects what you pay for prescription drugs"
      → /guides/how-deductibles-affect-drug-costs
    - "How approval rules work — and what happens if a request is not approved"
      → /guides/how-approval-rules-work-for-prescriptions

19. Bottom CTA (navy/dark) — "Compare Plans That Cover {Drug}"
    Button: "See {State} Plan Options →"

20. Page disclaimer footer — match V19 disclaimer text exactly

REMOVE from current page (do NOT include in rewrite):
- DrugCashPriceComparison component call
- DrugPatientActionGuide component call
- DrugClinicalContext section (entire clinical context block)
- Deep dive ExpandableSection blocks (tier explainer, PA guide, step
  therapy guide, quantity limit guide, formulary exception guide)
- Formulation data table (expandable detailed entries)
- The inline RestrictionCard sub-component (replaced by PlanRulesBlock)
- The old 4-cell snapshot grid

KEEP these sub-components at the bottom of the file:
- SBMExplanationPage (the empty-state variant)
- groupByFormulation helper
- getUniqueIssuers helper
- titleCase helper
- resolveStateParam helper
- All existing type definitions and interfaces
- DRUG_CLINICAL_DATA (keep the data, just don't render it — we may
  use it later for guide pages)
- PRIORITY_DRUGS array

Also update generateMetadata:
- Title formula: "{Drug} Coverage in {State} — Cost, Tier & Prior
  Authorization ({Year}) | HealthInsuranceRenew"
- Meta description: match DESIGN.md Section 8 formulary formula
- Ensure OG and Twitter tags are present (they already are)

Also update the schema section of the page:
- Remove the MedicalWebPage schema block entirely
- Remove the HealthInsurancePlan schema block (it exposes raw issuer IDs)
- Keep: drugSchema (WebPage), breadcrumbSchema, faqSchema
- Ensure faqSchema question names match the visible <summary> text

Add to the page layout:
- <article> wrapper around editorial content (hero through about block)
- ProcessBar below the header (pass trust items as props)
- Skip link: <a href="#main-content" className="sr-only focus:not-sr-only ...">
- id="main-content" on the <main> element

CHECKPOINT:
1. Run `npx tsc --noEmit` — zero errors
2. Run these greps and confirm zero results:
   grep -r "MedicalWebPage\|medicalAudience\|per fill\|per pen" \
     app/formulary/[issuer]/[drug_name]/page.tsx
3. Count the total lines — should be shorter than 2040 (target ~1200-1500)
4. Report the section order of the rendered page
```

---

## PROMPT 6 — Schema Sync Verification

```
Open app/formulary/[issuer]/[drug_name]/page.tsx.

Verify these three schema sync rules from DESIGN.md Section 7:

1. The WebPage schema "description" field must use the EXACT same
   string as the <meta name="description"> tag generated by
   generateMetadata(). If they differ, make the schema description
   reference the same variable/expression.

2. The FAQPage schema "name" fields must be character-for-character
   identical to the visible <summary> text in the FAQ section.
   Compare each FAQ question in the schema array against its
   corresponding <summary> element. Fix any mismatches.

3. The WebPage schema "dateModified" must match the visible <time>
   datetime attribute. Both should be "2026-03-20" (or a consistent
   date derived from the same source).

CHECKPOINT: List each sync pair (schema value vs visible element)
and confirm they match.
```

---

## PROMPT 7 — Grep Validation (DESIGN.md Section 15)

```
Run ALL validation commands from DESIGN.md Section 15:

# TypeScript compilation
npx tsc --noEmit

# Forbidden phrases
grep -r "per pen\|per fill\|prior auth[^o]\|MedicalWebPage\|medicalAudience\|TL;DR\|most plans cover\|related conditions" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts"

# <br> in headings
grep -r "<h1.*<br\|<h2.*<br" app/ --include="*.tsx"

# JS-rendered FAQ
grep -r "getElementById.*faq\|\.forEach.*faq\|faq.*innerHTML" \
  app/ --include="*.tsx"

For each command:
- Show the full output
- If any violations found, fix them immediately
- Re-run until all commands return clean

CHECKPOINT: All 4 commands return zero violations.
```

---

## PROMPT 8 — Mobile & Accessibility Check

```
Review app/formulary/[issuer]/[drug_name]/page.tsx for:

MOBILE (DESIGN.md Section 11 — Mobile):
1. No <br> in any heading element
2. Date line has max 2 segments
3. All grids/flex layouts stack to 1 column at sm: breakpoint or below
4. The evidence grid should use grid-cols-1 sm:grid-cols-3
5. CTA blocks should flex-col on mobile
6. No fixed-width elements that could cause horizontal overflow

ACCESSIBILITY (DESIGN.md Section 11 — Accessibility):
1. <main id="main-content"> present
2. <article> wraps editorial content
3. ProcessBar has role="complementary" and aria-label
4. Breadcrumb has aria-label="Breadcrumb"
5. First FAQ item has open attribute
6. Skip link exists and targets #main-content

Fix any issues found.

CHECKPOINT: List each check with PASS/FAIL and line number.
```

---

## PROMPT 9 — Commit & Summary

```
Stage all changes. Create a single commit with this message:

"feat(formulary): redesign to V19 standard

- Built 9 new shared components (EvidenceBlock, AeoBlock, CostBlock,
  PlanRulesBlock, TimelineSteps, SavingsRows, LimitsBlock, AboutBlock,
  ProcessBar)
- Rewrote formulary page JSX to V19 section order
- Removed MedicalWebPage and medicalAudience from schema
- Removed raw issuer IDs from schema
- Fixed copy: per fill→per month, Machine-Readable→plan benefit filings
- Added <article> wrapper, ProcessBar, skip link, <time> element
- Trimmed FAQ to 7 items, synced schema to visible text
- Removed inline deep-dive content (will become guide pages in Phase 2)

DESIGN.md Phase 1 items 1-6 complete."

Then list the files changed and their line counts.
Do NOT push — just commit locally.
```

---

## WHAT COMES NEXT (Phase 2 — not today)

After Phase 1 is validated:
- Extract deep-dive content into guide pages
  (`/guides/how-formulary-tiers-work`, `/guides/how-approval-rules-work-for-prescriptions`)
- Apply V19 standard to SBC page (`app/[state-name]/[county-slug]/[county-page]/page.tsx`)
- Convert all other FAQSection/PageFaq instances sitewide to StaticFaq
- Build remaining Priority 2 components (InsurerTable, RelatedEntityPills, PageCtas)
