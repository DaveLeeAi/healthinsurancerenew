# CLAUDE.md — HealthInsuranceRenew ACA Intelligence Platform

> Read this file at the start of EVERY session. Follow all instructions precisely.

---

## Project Overview

**Name:** HealthInsuranceRenew — ACA Intelligence Platform
**Purpose:** Build structured datasets from public government data to power 150,000+ programmatic SEO pages covering ACA health insurance plans, premiums, subsidies, formularies, and compliance scenarios across all US states and counties.
**Owner:** Dave Lee — Licensed health insurance agent, CMS Elite Circle of Champions recognition, licensed in 20+ states.
**Site:** healthinsurancerenew.com
**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Vercel

---

## Critical Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — master project instructions |
| `DESIGN.md` | Single source of truth for every page type, component, schema, and copy rule |
| `healthinsurancerenew_v35_formulary.html` | V35 locked content, copy, schema, and tone reference |
| `middleware.ts` | Route disambiguation — rewrites `/{state}/{drug}` → `/formulary/{state}/{drug}` |

---

## Working Style

1. **Read DESIGN.md before touching any page file** — it is the visual and structural authority
2. **Always show diffs first** before making changes
3. **One task at a time** — complete and validate before moving on
4. **Commit after each step** with descriptive messages
5. **Test/validate after every ETL step** — record counts, null checks, schema validation
6. **Ask before installing** unapproved packages

---

## Architecture — 10 Data Pillars

| # | Pillar | Primary Data Sources |
|---|--------|---------------------|
| 1 | **Plan & Premium Intelligence** | Federal marketplace plan data |
| 2 | **Subsidy & Affordability Engine** | IRS FPL tables + federal benchmark premiums + APTC formula |
| 3 | **SBC Decoded (Exclusions & Triggers)** | Carrier SBC PDFs → structured JSON |
| 4 | **Rate Volatility Tracker** | Federal marketplace rate filings |
| 5 | **Friction & Guidance Q&A** | Regulatory citations + real client experience scenarios |
| 6 | **Formulary Intelligence** | Federal plan benefit documents → carrier formulary files |
| 7 | **Dental Coverage Reality** | Federal dental plan data (waiting periods, coverage %, annual max) |
| 8 | **Billing Intelligence** | CPT/ICD-10 coding scenarios + visit limit data |
| 9 | **Life Events & Transitions** | SEP rules, turning 26, Medicare at 65, immigration/DMI |
| 10 | **Regulatory Risk & Policy Scenarios** | Enhanced credit expiration modeling, state mandates |

---

## 2026 Rules (Critical)

- **Enhanced subsidies expired** end of 2025
- **Subsidy cliff is back** at 400% FPL ($62,600 single / $128,600 family of 4)
- Congress may still act to retroactively extend — check Healthcare.gov for latest
- All subsidy and enhanced-credits pages reflect post-enhancement 2026 rules
- Do NOT show 2021–2025 enhanced figures as current rates

---

## Implementation Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Formulary page redesign — V35 locked as content/schema standard | **COMPLETE** |
| 2 | Sitewide component migration (FAQ, AEO, schema fixes) | **COMPLETE** |
| 3 | 2026 content + routing + differentiation + triple schema | **COMPLETE** |
| 4 | Page-type conversion + ISR + phased indexing | **IN PROGRESS** |

**Formulary template:** `app/formulary/[issuer]/[drug_name]/page.tsx` (2,036 lines). Scored 9.5/10 by ChatGPT and Gemini. V35 is the locked content, copy, tone, and schema reference.

### Phase 4 substatus (SERP-validated build order):
- 🔲 20. SBC plan detail pages — highest SERP-validated demand (priority score: 96)
- 🔲 21. State hub pages — state + drug discovery + internal link equity
- 🔲 22. Life events pages — high standalone volume, evergreen SEP triggers
- 🔲 23. County hub pages — geo landing only, no drug expansion at county level
- 🔲 24. Dental pages — standalone SADP demand
- 🔲 25. Rate volatility pages — seasonal (spikes Oct–Dec)
- 🔲 26. Billing pages — lowest priority
- 🔲 27. ISR configuration + phased indexing

---

## Routing Architecture

### Canonical public URLs (what Google sees):
```
/{state}/{drug}                    → formulary drug page (via middleware rewrite)
/{state-slug}/{county-slug}        → county hub
/{state-slug}/health-insurance-plans → state plans listing
/formulary                         → drug lookup/search tool
```

### How routing works:
- `middleware.ts` intercepts `/{state}/{drug}` and rewrites to `/formulary/{state}/{drug}`
- Formulary page renders at `app/formulary/[issuer]/[drug_name]/page.tsx`
- Canonical tags emit `/{state}/{drug}` (not `/formulary/...`)
- County slugs (ending in `-county`) pass through middleware
- `/formulary/all/{drug}` is the non-state lookup — NOT a canonical SEO page

### Legacy redirect shims (do not delete):
- `/plans/[state]` → `redirect()` to `/{state-slug}/health-insurance-plans`
- `/plans/[state]/[county]` → `redirect()` to `/{state-slug}/{county-slug}`
- `/plan-details/[id]/[slug]` → `permanentRedirect()` to canonical plan URL

---

## Folder Structure

```
healthinsurancerenew/
├── CLAUDE.md
├── DESIGN.md
├── middleware.ts                       # /{state}/{drug} → /formulary/{state}/{drug}
├── app/
│   ├── [state-name]/                  # State/county/plan routes
│   │   ├── [county-slug]/
│   │   └── health-insurance-plans/
│   ├── formulary/                     # Drug lookup + V35 drug coverage pages
│   │   ├── page.tsx                  # Search interface
│   │   └── [issuer]/[drug_name]/     # V35 template (2,036 lines)
│   ├── plans/                         # Legacy redirect shims
│   ├── subsidies/
│   ├── rates/
│   ├── dental/
│   ├── enhanced-credits/
│   ├── life-events/
│   ├── billing/
│   ├── states/
│   ├── guides/
│   ├── faq/
│   ├── tools/
│   └── api/
├── components/
│   ├── AeoBlock.tsx
│   ├── EvidenceBlock.tsx
│   ├── CostBlock.tsx
│   ├── PlanRulesBlock.tsx
│   ├── TimelineSteps.tsx
│   ├── SavingsRows.tsx
│   ├── LimitsBlock.tsx
│   ├── AboutBlock.tsx
│   ├── ProcessBar.tsx
│   ├── GenericByline.tsx
│   ├── SchemaScript.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ...
├── lib/
│   ├── data-loader.ts
│   ├── formulary-helpers.ts
│   ├── formulary-insights.ts          # State-specific content differentiation
│   ├── drug-linking.ts
│   ├── entity-linker.ts
│   ├── schema-markup.ts               # Triple schema builder (6-type @graph)
│   ├── content-templates.ts
│   └── ...
├── data/
│   ├── processed/                     # Committed datasets
│   │   └── drug_national_baselines.json  # National drug baselines for differentiation
│   └── config/
├── scripts/
│   └── generate/
│       └── generate_drug_baselines.py # Baseline generation script
└── ...
```

---

## Forbidden Phrases — Search and Replace Before Every PR

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
"clinical situation"            → "your situation" or remove
"criteria"                      → "approval requirements"
```

### Reading Level
- Target: Grade 6–8, Flesch Reading Ease 60+
- Active voice, consumer-first, `you/your` language

---

## Validation Commands

```bash
npx tsc --noEmit

grep -r "per pen\|per fill\|prior auth[^o]\|TL;DR\|most plans cover\|related conditions\|insurer\b\|insurers\b\|clinical situation\|provide the medication\|pick it up from" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts"

# MedicalWebPage only in schema builder
grep -r "MedicalWebPage\|medicalAudience" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts"

grep -r "<h1.*<br\|<h2.*<br" app/ --include="*.tsx"

# No /drugs references
grep -rn '"/drugs' app/ lib/ components/ --include="*.tsx" --include="*.ts" | grep -v node_modules

# No bare /all/ links
grep -rn '"\`/all/' app/ components/ --include="*.tsx" | grep -v "/formulary/all/"
```

---

## NEVER Do This

- Never use `MedicalWebPage` schema on any page EXCEPT formulary pages
- Never use `insurer` or `insurers` — use `insurance company` or `your plan`
- Never expose raw CMS issuer IDs in visible UI
- Never add named author on inner pages (asset-sale constraint)
- Never use `<br>` in headings
- Never use specific CMS PUF file names in public-facing copy — use "federal marketplace plan data and plan benefit documents"
- Never link to `/drugs` — removed
- Never generate `/all/{drug}` links — always `/formulary/all/{drug}`
- Never change V35 template layout without explicit approval
- Never hardcode API keys or secrets
- Never commit raw CMS data files
