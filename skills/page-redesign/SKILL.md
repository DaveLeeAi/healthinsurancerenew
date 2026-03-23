---
name: page-redesign
description: Converts existing pages to V19 design standard. Triggers on V19, redesign, design audit, component migration, DESIGN.md compliance, above-fold pattern, or visual conversion.
---

# Skill: Page Redesign (V19 Conversion)

> Converts existing pages to the V19 design standard defined in DESIGN.md.

---

## Before Touching Any File

1. Read `DESIGN.md` — the single source of truth for page structure
2. Read `ozempic_nc_formulary_v19.html` — the approved visual mockup
3. Identify which page type you're converting (DESIGN.md Section 12a–12m)

---

## V19 Above-Fold Pattern (exact structure)

```html
<main>
  <nav aria-label="Breadcrumb">
    <Breadcrumbs items={breadcrumbs} />
  </nav>

  <article>
    <!-- H1: human, specific, keyword-present, NO <br> tags -->
    <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
      {title}
    </h1>

    <!-- Date line: visible <time>, max 2 segments -->
    <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
      <time dateTime="{ISO_date}">Data reviewed {Month Year}</time>
      <span>·</span>
      <span>{N} plans analyzed</span>
    </div>

    <!-- Lede: 2–3 sentences, answer-first -->
    <p className="text-lg text-slate-700 mt-4 leading-relaxed">
      {answer-first lede}
    </p>

    <!-- Evidence block -->
    <EvidenceBlock title="..." meta="..." stats={stats} rows={rows} note="..." />

    <!-- AEO block — caveat OUTSIDE -->
    <div className="aeo-block">
      <span className="aeo-label">Quick answer</span>
      <div className="aeo-answer">{single extractable sentence}</div>
    </div>
    <p className="aeo-caveat-note">{disclaimer}</p>

    <!-- Snapshot grid: 4 cells, $/month not $/fill -->
    <SnapshotGrid cells={cells} qualifier="..." />

    <!-- Primary CTA (green) -->
    <div className="cta-primary bg-emerald-50 border border-emerald-200 rounded-xl p-6">
      ...
    </div>
```

---

## Required Component Checklist (9 components)

Every data page converted to V19 must include:

- [ ] `Breadcrumbs` — with `aria-label="Breadcrumb"`
- [ ] `EvidenceBlock` — 3 stats + 3–5 rows proving claims
- [ ] `AeoBlock` — single extractable sentence, caveat OUTSIDE
- [ ] `SnapshotGrid` — 4 cells, new info (not lede repeat)
- [ ] `LimitsBlock` — "Before you make a decision, keep in mind"
- [ ] `StaticFaq` — `<details>/<summary>`, first item `open`
- [ ] `AboutBlock` — data source + methodology
- [ ] `GenericByline` — "Reviewed by a licensed health insurance professional"
- [ ] Three CTAs — green (top), blue (mid), navy (bottom)

---

## 7-Step Conversion Process

### Step 1: Audit
- Read the existing page file
- Note current components, data loading, and schema
- Identify what's V19-compliant vs what needs changing

### Step 2: Schema
- Remove `MedicalWebPage` → use `WebPage`
- Remove `medicalAudience`
- Remove raw issuer IDs from schema
- Ensure `dateModified` matches visible `<time>` element
- Ensure schema `description` matches `<meta name="description">`

### Step 3: Structure
- Wrap editorial content in `<article>`
- Add `role="complementary"` trust bar outside `<main>` if needed
- Move related/supporting content outside `<article>`

### Step 4: Above-fold
- Apply exact V19 order: breadcrumb → H1 → date → lede → evidence → AEO → snapshot → CTA
- Remove `<br>` from headings
- Add visible `<time>` element
- Build EvidenceBlock with real data

### Step 5: Below-fold
- Apply DESIGN.md Section 4 below-fold order
- Add LimitsBlock
- Convert FAQ to static `<details>/<summary>`
- Add AboutBlock

### Step 6: Copy sweep
- Run forbidden phrases check (DESIGN.md Section 9)
- Replace "per fill"/"per pen" → "per month"
- Replace "TL;DR" → "Quick answer"
- Replace "patients" → "people" or "enrollees"
- Remove "ACA" from H1, remove "formulary" from H1
- Ensure cost disclaimers use "2026 plan benefit filings"

### Step 7: Validate
```bash
npx tsc --noEmit
grep -r "MedicalWebPage\|medicalAudience\|per fill\|per pen\|TL;DR" app/ --include="*.tsx"
grep -r "<h1.*<br\|<h2.*<br" app/ --include="*.tsx"
```

---

## V19 Color Tokens (mapped to Tailwind)

| Token | Use | Tailwind |
|-------|-----|----------|
| Emerald | Positive findings, primary CTA, generic tier | `emerald-50/200/700` |
| Amber | Warnings, non-preferred tier | `amber-50/200/700` |
| Red | Alerts, specialty tier | `red-50/200/700` |
| Blue | Info blocks, mid CTA, preferred brand | `blue-50/200/700` |
| Slate | Body text, neutral | `slate-500/700/900` |
| Navy | Bottom CTA background | `slate-800/900` |

---

## Typography

| Element | Font | Weight | Tailwind |
|---------|------|--------|----------|
| H1 | Lora (serif) | Bold | `font-serif text-3xl md:text-4xl font-bold` |
| H2 | DM Sans | Semibold | `text-2xl font-semibold` |
| Body | DM Sans | Regular | `text-base text-slate-700` |
| Lede | DM Sans | Regular | `text-lg text-slate-700 leading-relaxed` |
| Labels | DM Sans | Medium | `text-sm font-medium text-slate-500` |
| AEO label | DM Sans | Semibold | `text-xs font-semibold uppercase tracking-wide` |

---

## Per-Page-Type Conversion Notes

### Formulary (`/formulary/{state}/{drug}`)
- Full V19 spec in DESIGN.md Section 12a
- Most complex conversion — 14 required sections
- Snapshot cells: Plans covering drug | Typical tier | After deductible/month | Before deductible/month

### SBC Plan Detail (`/{state}/{county}/{plan}-plan`)
- DESIGN.md Section 12b
- Keep existing SBCGrid component for cost-sharing table
- `/plan-details/{id}/{slug}` is a 301 redirect — don't touch routing

### County Hub (`/{state}/{county}`)
- DESIGN.md Section 12c
- Primary updates: AnswerBox → AeoBlock, JS FAQ → StaticFaq

### Subsidy (`/subsidies/{state}/{county}`)
- DESIGN.md Section 12d
- CRITICAL: Enhanced subsidies expired — show 2026 cliff rules

### Enhanced Credits (`/enhanced-credits/{state}/{county}`)
- DESIGN.md Section 12i
- CRITICAL: All figures must reflect post-enhancement 2026 reality

---

## Reference Template: Formulary (locked at 9.5/10)

The formulary template is the locked reference at 9.5/10. All other page types should aim to match this quality. The actual built section order (not the original DESIGN.md 12a spec — the improved version):

```
1. Hero (H1 + date line) → AEO block → Evidence block → Plain-English takeaway → Editorial insight box
2. Primary CTA (green)
3. Cost section with interpretation lines + vary block
4. Mid CTA (blue accent)
5. Plan rules with observation counts + cross-links
6. Prior authorization timeline (conditional)
7. Savings rows (drug-class-aware)
8. "What to do if you run into a problem" scenario guidance
9. Limits block
10. FAQ (7 items, before related drugs)
11. About block + education links
12. Related drugs (pills) — outside article
13. Insurer table with insight intro — outside article
14. State nav — outside article
15. Bottom CTA (navy, specific to cost+access)
```

### Data Contradiction Checklist (verify before shipping any page)
- Evidence block tier MUST match FAQ tier
- FAQ tier MUST match cost section tiers
- Cost section tiers MUST match insurer table tiers
- FAQ deductible answer MUST use `beforeDeductibleRange`, not `dominantHumanTier.costRange`
- No Preventive/$0 for non-preventive drugs (check biologic blocklist)

### Drug-Aware Functions (MUST use instead of base functions)
- `humanizeTierForDrug()` not `humanizeTier()` — handles insulin IRA, biologic blocklist
- `getDominantTierGroupForDrug()` not `getDominantTierGroup()`
- `humanizeTiersForDrug()` not `humanizeTiers()`

### Required Editorial Intelligence Sections
- **Editorial insight box** — conditional content by tier/PA combination
- **Scenario guidance** — "What to do if you run into a problem" with conditional steps
- **Drug-class savings variation** — different savings copy per drug class

---

## What NOT to Change

- **Data loading logic** — keep existing data file reads and transformations
- **Route structure** — don't change URL patterns or dynamic segments
- **Helper functions** — `lib/formulary-helpers.ts`, `lib/schema-markup.ts` internals
- **301 redirects** — existing redirects are correct, don't modify
- **API routes** — `app/api/` endpoints are not part of the visual redesign
