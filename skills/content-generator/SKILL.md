---
name: content-generator
description: Generates programmatic SEO pages from ACA datasets. Triggers on page generation, content templates, H1/meta/AEO formulas, schema markup, or page section order.
---

# Skill: Content Generator

> Generates programmatic SEO pages from structured ACA datasets. 150,000+ pages across entity types and comparisons.

---

## Step 1: Read DESIGN.md

Before generating or modifying any page content, read `DESIGN.md` in the project root. It is the single source of truth for page structure, component usage, copy rules, and schema.

The **V35 formulary reference** (`healthinsurancerenew_v35_formulary.html`) is the locked content, copy, and schema standard. All page types follow V35 standard (Phase 4 complete).

**Page-Class Governance (DESIGN.md §15):** Only generate pages for APPROVED page classes. Do NOT generate pages for REJECTED classes (county+drug, copay standalone, step therapy standalone, quantity limits standalone). See DESIGN.md §15 for full list.

---

## Content Safety Rules

These are **non-negotiable** on every generated page:

1. **No DIY medical instructions** — never tell users to self-diagnose, self-treat, or skip professional care
2. **No full names/addresses** on public pages — use only carrier names, plan names, and geographic identifiers
3. **No named author on inner pages** — use GenericByline (process-based). Personal credentials belong ONLY on /about and /editorial-policy
4. **All content saves as draft** — never auto-publish; human review required before go-live
5. **Medical disclaimer on every page**
6. **Source citation** — every cost/premium claim must cite "federal marketplace plan data and plan benefit documents" with plan year
7. **Agent CTA** — every page includes: "Need help choosing? Talk to a licensed agent" → lead form
8. **2026 subsidy cliff warning** — enhanced credits expired end of 2025; subsidy cliff at 400% FPL is back. All subsidy/enhanced-credits pages must reflect post-enhancement rules.

---

## Page Types (see DESIGN.md Section 12a–12m for full specs)

| Page Type | URL Pattern | DESIGN.md Section | Status |
|-----------|-------------|-------------------|--------|
| Formulary drug | `/{state}/{drug}` | 12a | V35 locked |
| SBC plan detail | `/{state}/{county}/{plan}-plan` | 12b | V35 standard |
| County hub | `/{state}/{county}` | 12c | V35 standard — geo landing ONLY, no drug expansion |
| Subsidy | `/subsidies/{state}/{county}` | 12d | V35 standard |
| Rate volatility | `/rates/{state}/{county}` | 12e | V35 standard |
| Dental | `/dental/{state}/{plan_variant}` | 12f | V35 standard |
| Life events | `/life-events/{event_type}` | 12g | V35 standard |
| Billing/CPT | `/billing/{cpt_code}` | 12h | V35 standard |
| Enhanced credits | `/enhanced-credits/{state}/{county}` | 12i | V35 standard |
| State hub | `/states/{state}` | 12j | V35 standard |
| Guides | `/guides/{slug}` | 12k | LIVE |
| Tools | `/tools/{tool-slug}` | 12l | LIVE |
| FAQ pages | `/faq/{category}/{slug}` | 12m | LIVE |
| Plan + drug | `/{state}/{drug}/{plan}` | Phase 5 | NOT YET BUILT |

---

## Above-Fold Order (DESIGN.md Section 4 — non-negotiable)

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

---

## Component Library

| Component | Purpose | Notes |
|-----------|---------|-------|
| `EvidenceBlock` | Visible proof for claims — 3 stats + 3–5 rows | Required on every data page |
| `AeoBlock` | AI Overview extraction target | Caveat OUTSIDE the block element |
| `CostBlock` | Cost data with single disclaimer | One disclaimer per block, not per row |
| `LimitsBlock` | YMYL "Before you decide" section | Required on all data pages |
| `AboutBlock` | Data source + methodology | On every page |
| `ProcessBar` | Trust/process bar | `role="complementary"`, NOT inside `<main>` |
| `GenericByline` | Process-based attribution | Never named author on inner pages |
| `SchemaScript` | JSON-LD schema injection | Centralized schema builder |
| `Breadcrumbs` | Navigation breadcrumb | `aria-label="Breadcrumb"` |

FAQ: Use static `<details>/<summary>` inline. The `PageFaq` component is acceptable (it renders static HTML) but inline is preferred for new work.

---

## Schema Rules (DESIGN.md Section 7)

- **Formulary pages ONLY:** MedicalWebPage + Drug + HealthInsurancePlan in triple @graph
- **All other pages:** WebPage primary + FAQPage + BreadcrumbList
- **Never** use MedicalWebPage on non-formulary pages
- **Never** use medicalAudience on non-formulary pages
- **Never** expose raw CMS issuer IDs in schema or visible UI
- `dateModified` in schema must match the visible `<time>` element
- Schema `description` must be identical to `<meta name="description">`
- FAQPage `name` must be identical to visible `<summary>` text

---

## Copy Rules (Forbidden Phrases — from DESIGN.md Section 9)

```
"per pen" / "per fill"          → "per month"
"prior auth"                    → "prior authorization" (full term)
"TL;DR"                         → "Quick answer"
"observed in"                   → "found in {N} of {total} plans"
"most plans cover"              → "covered by {N} of {total} plans reviewed"
"based on available data"       → "in our review of {N} plans"
"ACA" in hero/H1                → "health plan" or "Marketplace plan"
"formulary" in H1               → "drug list" or "drug coverage"
"patients"                      → "people" or "enrollees"
"insurer" / "insurers"          → "insurance company" or "your plan"
"criteria"                      → "approval requirements"
"negotiated rate"               → remove or rephrase
"Machine-Readable PUF"          → "federal marketplace plan data and plan benefit documents"
```

---

## Formulary Section Order (locked at 9.5/10)

Template: `app/formulary/[issuer]/[drug_name]/page.tsx` (2,158 lines)
Canonical URL: `/{state}/{drug}` — routed via middleware.ts rewrite

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

### Drug-Aware Functions (MUST use instead of base functions)
- `humanizeTierForDrug()` not `humanizeTier()`
- `getDominantTierGroupForDrug()` not `getDominantTierGroup()`
- `humanizeTiersForDrug()` not `humanizeTiers()`

---

## Content QA Checklist (per page)

- [ ] Medical disclaimer present
- [ ] Source citation: "federal marketplace plan data and plan benefit documents" (never specific PUF names)
- [ ] FAQ section uses static `<details>/<summary>` (not JS-rendered)
- [ ] Schema correct per page type (DESIGN.md §7)
- [ ] AEO block present, caveat OUTSIDE the block element
- [ ] No forbidden phrases
- [ ] No `<br>` in headings
- [ ] No raw issuer IDs in visible UI
- [ ] GenericByline (not named author) on inner pages
- [ ] OG + Twitter meta tags present
- [ ] Canonical tag correct
- [ ] All data from current plan year
- [ ] Page class is APPROVED (DESIGN.md §15)
