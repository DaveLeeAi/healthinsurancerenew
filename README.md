# HealthInsuranceRenew — ACA Intelligence Platform

A Next.js 14 programmatic SEO site powering 150,000+ pages of structured ACA health insurance data across all US states and counties. Built from CMS Public Use Files (PUFs) with zero manual content entry.

**Owner:** Dave Lee — Licensed health insurance agent, CMS Elite Circle of Champions

---

## Architecture

### 10 Data Pillars

| # | Pillar | Output File | Records |
|---|--------|-------------|---------|
| 1 | Plan & Premium Intelligence | `plan_intelligence.json` (107 MB) | Plan-county-premium combos |
| 2 | Subsidy & Affordability Engine | `subsidy_engine.json` (2.86 MB) | APTC by FPL% by county |
| 3 | SBC Decoded (Benefits & Cost Sharing) | `sbc_decoded.json` (429 MB) | 20,354 plan variants |
| 4 | Rate Volatility Tracker | `rate_volatility.json` (654 KB) | County-level YoY analytics |
| 5 | Friction & Guidance Q&A | `friction_qa.json` (56.8 KB) | 54 Q&A entries |
| 6 | Formulary Intelligence | `formulary_intelligence.json` (7.73 GB) | Drug-plan-tier mappings |
| 7 | Dental Coverage Reality | `dental_coverage.json` (4.4 MB) | 1,389 plan variants |
| 8 | Billing Intelligence | `billing_intel.json` (52.8 KB) | 20 billing scenarios |
| 9 | Life Events & Transitions | `life_events.json` (49.8 KB) | 8 decision trees |
| 10 | Regulatory Risk & Policy Scenarios | `policy_scenarios.json` (65.1 MB) | 1,852 counties × 5 ages × 6 FPL |

### Tech Stack

- **Framework:** Next.js 14 App Router (TypeScript, strict mode)
- **Styling:** Tailwind CSS v3
- **Data:** Python 3.11 ETL pipeline → CMS PUF CSVs → structured JSON
- **Deployment:** Vercel (SSR for large-dataset routes, SSG for static content)

---

## Public Pages

### Plan Details
`/plan-details/[plan_id]/[slug]` — Full SBC for any ACA plan

Features:
- Plan Snapshot card (metal level, plan type, premium, deductible, OOP max)
- Color-coded Real-World Cost Examples table (green/yellow/red by cost level)
- Cost-sharing grid (12 service categories from BenCS PUF)
- Exclusions section (confirmed + pending PDF review)
- FAQ section (5 Q&As with plan-specific data) + FAQPage JSON-LD schema
- Data Methodology block + Source Citations (CMS Plan Attributes PUF, BenCS PUF, Healthcare.gov)
- Data version bar: CMS Marketplace PUF 2025
- Schema: Article, BreadcrumbList, FAQPage, MedicalEntity

### Formulary
`/formulary/[issuer]/[drug_name]` — Drug coverage by insurer

Features:
- Drug Coverage Snapshot card (tier, PA status, step therapy, quantity limit, plans count, generic availability)
- Estimated Out-of-Pocket Cost visual (color-coded by tier: Generic $5–$20 green → Specialty $100–$500+ red)
- Coverage Status grid (4 cards)
- Coverage Details table (grouped by formulation)
- FAQ section (5 Q&As interpolated with actual tier/PA/step therapy data) + FAQPage JSON-LD schema
- Data Methodology block + Source Citations (CMS MR-PUF, Formulary Reference File, Healthcare.gov)
- Schema: Drug, HealthInsurancePlan, BreadcrumbList, FAQPage

### Other Routes
- `/plans/[state]/[county]` — Plan comparison by county
- `/subsidies/[state]/[county]` — APTC subsidy calculator
- `/rates/[state]/[county]` — Rate volatility by county
- `/dental/[state]` — Dental plan comparison
- `/enhanced-credits/**` — Policy scenario modeling
- `/life-events` — SEP and transition guides
- `/faq` — Friction & guidance Q&A

---

## Data Pipeline

### ETL Scripts (`scripts/etl/`)

```bash
python scripts/etl/build_plan_intelligence.py
python scripts/etl/build_sbc_from_puf.py
python scripts/etl/build_bencs_cost_sharing.py
python scripts/etl/build_subsidy_engine.py
python scripts/etl/build_rate_volatility.py
python scripts/etl/build_dental_coverage.py
python scripts/etl/build_friction_qa.py
python scripts/etl/build_billing_intel.py
python scripts/etl/build_life_events.py
python scripts/etl/build_policy_scenarios.py
```

Raw CMS files go in `data/raw/puf/` (gitignored — too large).
Processed JSON outputs go in `data/processed/` (committed).

### Data Sources
- [CMS Marketplace PUF](https://www.cms.gov/marketplace/resources/data/public-use-files) — Rate, Plan Attributes, BenCS, MR-PUF, SADP, QHP Landscape
- [data.healthcare.gov API](https://data.healthcare.gov/api/1/) — Dataset catalog and downloads
- IRS FPL tables — Federal Poverty Level for subsidy calculations

---

## Development

```bash
# Install
npm install

# Dev server
npm run dev

# Build (loads large datasets — needs 8 GB RAM)
npm run build

# Type check
npx tsc --noEmit
```

### Environment Variables

```env
# No secrets required for local dev — all data is from public CMS files
# Add to .env.local for any future API integrations
```

### Build Notes

- `experimental.cpus: 1` — prevents worker OOM when loading large datasets
- `NODE_OPTIONS=--max-old-space-size=8192` — set in package.json build script
- Large-dataset routes use `export const dynamic = 'force-dynamic'` (SSR):
  - `/plans/[state]/[county]`, `/formulary/**`, `/rates/**`, `/subsidies/**`, `/dental/**`, `/enhanced-credits/**`
- Small-dataset routes are SSG: `/life-events`, `/faq`, `/billing`, `/guides`, `/states/**`

---

## SEO / Schema

Every public page includes:
- `generateMetadata()` with canonical URL, Open Graph, Twitter Card
- JSON-LD schema via `SchemaScript` component (injected in `<head>`)
- FAQPage schema on plan-detail and formulary pages
- BreadcrumbList schema on all pages
- Article schema with `isBasedOn` citing CMS dataset

All schema built via `lib/schema-markup.ts`.

---

## Folder Structure

```
app/                    # Next.js App Router pages
  plan-details/         # SBC detail pages (force-dynamic, ~20K plans)
  formulary/            # Drug formulary pages (force-dynamic)
  plans/                # Plan comparison by county
  subsidies/            # APTC calculator pages
  ...
components/             # React TSX components
  SBCGrid.tsx           # Cost-sharing grid
  SchemaScript.tsx      # JSON-LD injector
  EntityLinkCard.tsx    # Related page links
  ...
lib/
  data-loader.ts        # Loads processed JSON datasets
  schema-markup.ts      # All Schema.org builders
  content-templates.ts  # Editorial content generators
  entity-linker.ts      # Cross-page link logic
  types.ts              # All TypeScript interfaces
data/
  raw/                  # ⚠️ GITIGNORED — CMS PUF files
  processed/            # ✅ COMMITTED — structured datasets
  schema/               # JSON validation schemas
scripts/
  fetch/                # CMS data download scripts
  etl/                  # Transform & normalize scripts
  generate/             # Content generation scripts
src/                    # Legacy Astro site (reference only)
```
