---
name: page-redesign
description: Converts pages to V35 design standard or creates new page types. Triggers on V35, redesign, design audit, component migration, DESIGN.md compliance, or visual conversion.
---

# Skill: Page Redesign (V35 Standard)

> All existing page types are at V35 standard (Phase 4 complete 2026-04-07).
> This skill is now primarily for NEW page types (e.g., Phase 5 plan+drug template).

---

## Before Touching Any File

1. Read `CLAUDE.md` — master project instructions
2. Read `DESIGN.md` — the single source of truth for page structure
3. Read `healthinsurancerenew_v35_formulary.html` — the V35 locked content/schema reference
4. Identify which page type (DESIGN.md Section 12a–12m)
5. Check DESIGN.md §15 — Page-Class Governance. Do NOT build REJECTED page classes.

---

## V35 Standard Checklist (every page must pass all)

1. **YMYL checklist** (DESIGN.md §11) — every item passes
2. **V35 component library** — AeoBlock, EvidenceBlock, GenericByline, AboutBlock, SchemaScript, Breadcrumbs, LimitsBlock
3. **Copy rules** — grade 6-8, active voice, consumer-first, answer-first, "you/your" language
4. **Schema** — WebPage primary + FAQPage + BreadcrumbList in `@graph` (formulary pages additionally get Drug + MedicalWebPage + HealthInsurancePlan)
5. **OG/Twitter meta tags** — present on every page
6. **Canonical tags** — correct, matching the public URL
7. **No forbidden phrases** — full list in CLAUDE.md and DESIGN.md §9
8. **No `<br>` in headings**
9. **Static FAQ** — `<details>/<summary>`, never JS-rendered
10. **GenericByline** on every page ("Licensed ACA Agent" — never Dave's name/NPN on inner pages)
11. **CMS disclaimer** on every page
12. **Data attribution** — "federal marketplace plan data and plan benefit documents" (never specific PUF file names)
13. **Actor rotation** — "your plan" / "the plan" / "your insurance company" by context, never "insurer"
14. **No MedicalWebPage schema** except on formulary pages

---

## Above-Fold Pattern (exact structure — DESIGN.md §4)

```
1.  Breadcrumb nav
2.  H1          — human, specific, keyword-present, NO <br> tags
3.  Date line   — visible <time> element, max 2 segments
4.  Lede        — 2–3 sentences, answer-first
5.  Evidence block — data proving the lede
6.  AEO block   — single extractable sentence, caveat OUTSIDE
7.  Snapshot grid — 4 cells, $/month not $/fill
8.  Primary CTA — green, above fold
```

---

## Conversion Process for New Page Types

### Step 1: Audit
- Read the existing page file (if updating) or design from scratch
- Verify page class is APPROVED in DESIGN.md §15
- Note current components, data loading, and schema

### Step 2: Schema
- WebPage primary (NOT MedicalWebPage — that's formulary-only)
- Add FAQPage + BreadcrumbList
- `dateModified` matches visible `<time>`
- Schema `description` matches `<meta name="description">`

### Step 3: Structure
- Wrap editorial content in `<article>`
- Trust bar `role="complementary"` outside `<main>`
- Related/supporting content outside `<article>`

### Step 4: Above-fold
- Apply V35 order: breadcrumb → H1 → date → lede → evidence → AEO → snapshot → CTA
- No `<br>` in headings
- Visible `<time>` element
- EvidenceBlock with real data

### Step 5: Below-fold
- Apply DESIGN.md §4 below-fold order
- LimitsBlock required
- Static FAQ with `<details>/<summary>`
- AboutBlock

### Step 6: Copy sweep
- Run forbidden phrases check
- Ensure "federal marketplace plan data and plan benefit documents" (never PUF names)
- Grade 6-8 reading level, active voice, consumer-first

### Step 7: Validate
```bash
npx tsc --noEmit
# Full validation suite from CLAUDE.md
```

---

## V35 Color Tokens (Tailwind)

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

| Element | Font | Tailwind |
|---------|------|----------|
| H1 | Lora (serif) | `font-serif text-3xl md:text-4xl font-bold` |
| H2 | DM Sans | `text-2xl font-semibold` |
| Body | DM Sans | `text-base text-slate-700` |
| Lede | DM Sans | `text-lg text-slate-700 leading-relaxed` |

---

## What NOT to Change

- **V35 formulary template** — locked at 9.5/10, never modify without explicit approval
- **Data loading logic** — keep existing data file reads
- **Route structure** — don't change URL patterns
- **301 redirects** — existing redirects are correct
- **API routes** — not part of visual work
