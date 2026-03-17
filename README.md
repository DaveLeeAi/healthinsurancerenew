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
| 6 | Formulary Intelligence | `formulary_intelligence.json` | 181,734 drug records (deduped) |
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
- Data version bar: CMS Marketplace PUF 2026
- Schema: Article, BreadcrumbList, FAQPage, MedicalEntity

### Formulary
`/formulary/[issuer]/[drug_name]` — Drug coverage by insurer

Features:
- Drug Coverage Snapshot card (tier, PA status, step therapy, quantity limit, plans count, generic availability)
- Estimated Out-of-Pocket Cost visual (color-coded by tier: Generic $5–$20 green → Specialty $100–$500+ red)
- Coverage Status grid (4 cards)
- Coverage Details table (grouped by formulation)
- **Programmatic internal linking** (8–15 links per page, category-aware):
  - Related Medications — 4–6 drugs from same therapeutic category (e.g., Metformin → Ozempic, Jardiance, Trulicity)
  - Comparison Links — 2–3 "Drug A vs Drug B" SEO comparison pages
  - State Marketplace Resources — plans, formulary browse, subsidy calculator (state pages only)
  - Educational Links — contextual guides based on tier/restrictions (prior auth, step therapy, quantity limits)
  - Cross-pillar entity links — plan details, subsidy calculator, billing, FAQ via `EntityLinkCard`
  - Related Coverage Guides — category-matched topical authority guides at page bottom
- Drug autocomplete search with 2,000-drug index (debounced, keyboard-navigable)
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

## Formulary Intelligence — SBM Coverage

State-Based Marketplace states are absent from the federal CMS Machine-Readable PUF. We maintain a separate source registry and ingestion pipeline for SBM formulary data.

| Source | States | Status |
|--------|--------|--------|
| Centene/Ambetter API | GA, IL, KY, NJ, NV, PA, WA | Ingested (7 states) |
| CareFirst BCBS | VA | Ingested — Drugs_1–5.json (VA plan IDs) |
| Elevance/Anthem (FormularyNavigator) | ME | Ingested — drugs/35 (ME plan IDs) |
| Cambia Health (Regence) | WA, OR, ID, UT | Ingested — drugs1.json + drugs2.json |
| Moda Health | OR | Ingested — drugs-OR.json |
| Providence Health Plan | OR | Ingested — 2 drug files |
| Blocked (no MR endpoint) | CA, CO, CT, DC, MA, MD, MN, NM, NY, RI, VT | 11 states |

**Registry:** `data/config/sbm-source-registry.json` — 22 states, 67 issuers tracked
**Script:** `scripts/fetch/fetch_formulary_sbm.py` — registry-driven fetch + normalize + merge
**Report:** `docs/sbm-ingestion-report.md` — detailed URL verification results

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

### SBM Formulary Fetch

```bash
python scripts/fetch/fetch_formulary_sbm.py --verify-urls          # Test URLs only
python scripts/fetch/fetch_formulary_sbm.py --state WA OR --merge  # Fetch + merge into main
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
pnpm install

# Dev server
pnpm dev

# Build (loads large datasets — needs 8 GB RAM)
pnpm build

# Type check
pnpm exec tsc --noEmit
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
  drug-linking.ts       # Drug category taxonomy + internal linking helpers (20 categories, ~200 drugs)
  formulary-helpers.ts  # CMS tier → consumer-facing label mapping
  types.ts              # All TypeScript interfaces
content/                # Markdown (guides, FAQ, state pages, tool descriptions)
data/
  raw/                  # ⚠️ GITIGNORED — CMS PUF files
  processed/            # ✅ COMMITTED — structured datasets + SBM formulary per-state files
  config/               # Site config JSONs (FPL tables, SBM registry, chat routing, etc.)
  schema/               # JSON validation schemas
docs/                   # SBM ingestion reports, field maps
scripts/
  fetch/                # Data download scripts (PUF fetcher, SBM formulary fetcher)
  etl/                  # Transform & normalize scripts (10 pillar builders)
  generate/             # Content generation scripts
```
