---
name: content-generator
description: Generates programmatic SEO pages from ACA datasets. Triggers on page generation, content templates, H1/meta/AEO formulas, schema markup, or page section order.
---

# Skill: Content Generator

> Generates programmatic SEO pages from structured ACA datasets. 150,000+ pages across entity types and comparisons.

---

## Step 1: Read DESIGN.md

Before generating or modifying any page content, read `DESIGN.md` in the project root. It is the single source of truth for page structure, component usage, copy rules, and schema.

The **V19 formulary mockup** (`ozempic_nc_formulary_v19.html`) is the approved visual reference. All page types inherit from this standard.

---

## Content Safety Rules

These are **non-negotiable** on every generated page:

1. **No DIY medical instructions** — never tell users to self-diagnose, self-treat, or skip professional care
2. **No full names/addresses** on public pages — use only carrier names, plan names, and geographic identifiers
3. **No named author on inner pages** — use GenericByline (process-based). Personal credentials belong ONLY on /about and /editorial-policy
4. **All content saves as draft** — never auto-publish; human review required before go-live
5. **Medical disclaimer on every page**
6. **Source citation** — every cost/premium claim must cite "2026 plan benefit filings" with plan year
7. **Agent CTA** — every page includes: "Need help choosing? Talk to a licensed agent" → lead form
8. **2026 subsidy cliff warning** — enhanced credits expired end of 2025; subsidy cliff at 400% FPL is back. All subsidy/enhanced-credits pages must reflect post-enhancement rules.

---

## Page Types (see DESIGN.md Section 12a–12m for full specs)

| Page Type | URL Pattern | DESIGN.md Section |
|-----------|-------------|-------------------|
| Formulary drug | `/formulary/{state}/{drug}` | 12a |
| SBC plan detail | `/{state}/{county}/{plan}-plan` | 12b |
| County hub | `/{state}/{county}` | 12c |
| Subsidy | `/subsidies/{state}/{county}` | 12d |
| Rate volatility | `/rates/{state}/{county}` | 12e |
| Dental | `/dental/{state}/{plan_variant}` | 12f |
| Life events | `/life-events/{event_type}` | 12g |
| Billing/CPT | `/billing/{cpt_code}` | 12h |
| Enhanced credits | `/enhanced-credits/{state}/{county}` | 12i |
| State hub | `/states/{state}` | 12j |
| Guides | `/guides/{slug}` | 12k |
| Tools | `/tools/{tool-slug}` | 12l |
| FAQ pages | `/faq/{category}/{slug}` | 12m |

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
| `SnapshotGrid` | 4-cell data summary | $/month not $/fill; no `<br>` tags |
| `StaticFaq` | Crawlable `<details>/<summary>` FAQ | Replaces JS-rendered FAQSection |
| `CostBlock` | Cost data with single disclaimer | One disclaimer per block, not per row |
| `LimitsBlock` | YMYL "Before you decide" section | Required on all data pages |
| `AboutBlock` | Data source + methodology | Replaces old MethodologyBlock |
| `ProcessBar` | Trust/process bar | `role="complementary"`, NOT inside `<main>` |
| `GenericByline` | Process-based attribution | Never named author on inner pages |

---

## Copy Rules (Forbidden Phrases — from DESIGN.md Section 9)

```
"per pen" / "per fill"          → "per month"
"prior auth"                    → "prior authorization" (full term)
"TL;DR"                         → "Quick answer"
"observed in"                   → "found in {N} of {total} plans"
"most plans cover"              → "covered by {N} of {total} plans reviewed"
"based on available data"       → "in our review of {N} plans"
"Plan benefit documents"        → "2026 plan benefit filings"
"ACA" in hero/H1                → "health plan" or "Marketplace plan"
"formulary" in H1               → "drug list" or "drug coverage"
"patients"                      → "people" or "enrollees"
"Machine-Readable PUF"          → "plan benefit documents"
```

---

## Schema Rules (DESIGN.md Section 7)

- **Never** use `MedicalWebPage` on any page
- **Never** use `medicalAudience` in any schema
- **Never** expose raw CMS issuer IDs in schema or visible UI
- Primary schema is `WebPage` for all data pages (except guides = `Article`, FAQ = `FAQPage`)
- `dateModified` in schema must match the visible `<time>` element
- Schema `description` must be identical to `<meta name="description">`
- FAQPage `name` must be identical to visible `<summary>` text

---

## Schema Markup (JSON-LD)

### Every page gets:

**WebPage** (primary — not MedicalWebPage):
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

**BreadcrumbList** and **FAQPage** (on pages with FAQ sections).

### Page-specific supporting schema:
- Formulary: `Drug` in `about`
- SBC plan: `HealthInsurancePlan`
- Rates: `Dataset`
- Life events: `HowTo`
- Billing: `MedicalCode`
- Tools: `WebApplication`

---

## Internal Linking Rules

1. **Entity-to-entity only** — every link connects two entities in the graph
2. **Bidirectional** — if Plan A links to Carrier B, Carrier B must link back
3. **Max 5–7 internal links per page**
4. **Anchor text** — use descriptive entity names, never "click here"
5. **Cross-entity links** — every page links to at least 2 different entity types

---

## Content QA Checklist (per page)

- [ ] Medical disclaimer present
- [ ] Source citation on all cost/premium data ("2026 plan benefit filings")
- [ ] FAQ section uses static `<details>/<summary>` (not JS-rendered)
- [ ] Schema uses WebPage (not MedicalWebPage), no medicalAudience
- [ ] AEO block present, caveat OUTSIDE the block element
- [ ] No forbidden phrases
- [ ] No `<br>` in headings
- [ ] No raw issuer IDs in visible UI
- [ ] GenericByline (not named author) on inner pages
- [ ] All data from current plan year
- [ ] Mobile-readable layout
