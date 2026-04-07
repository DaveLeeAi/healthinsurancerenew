# HealthInsuranceRenew — ACA Intelligence Platform

A Next.js 14 programmatic SEO site powering 150,000+ pages of structured ACA health insurance data across all US states and counties. Built from federal marketplace plan data and plan benefit documents with zero manual content entry.

**Operator:** Licensed health insurance agent — CMS Elite Circle of Champions recognition. See `data/config/config.json` for operator details.

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
| 6 | Formulary Intelligence | `formulary_intelligence.json` (4.4 GB) | 15.2M+ formulary records (320 carriers) |
| 7 | Dental Coverage Reality | `dental_coverage.json` (4.4 MB) | 1,389 plan variants |
| 8 | Billing Intelligence | `billing_intel.json` (52.8 KB) | 20 billing scenarios |
| 9 | Life Events & Transitions | `life_events.json` (49.8 KB) | 8 decision trees |
| 10 | Regulatory Risk & Policy Scenarios | `policy_scenarios.json` (65.1 MB) | 1,852 counties × 5 ages × 6 FPL |

### Tech Stack

- **Framework:** Next.js 14 App Router (TypeScript, strict mode)
- **Styling:** Tailwind CSS v3
- **Data:** Python 3.11 ETL pipeline → federal marketplace data → structured JSON
- **Deployment:** Vercel (SSR for large-dataset routes, SSG for static content)

---

## Public Pages

### Formulary Drug Coverage
`/{state}/{drug}/` — Drug coverage by state (canonical URL)

Routed via `middleware.ts` rewrite: `/{state}/{drug}` → `/formulary/{state}/{drug}`
Template: `app/formulary/[issuer]/[drug_name]/page.tsx` (2,036 lines, locked at 9.5/10)

Features:
- Drug Coverage Snapshot card (tier, PA status, step therapy, quantity limit, plans count, generic availability)
- Estimated Out-of-Pocket Cost visual (color-coded by tier)
- Coverage Status grid + Coverage Details table (grouped by formulation)
- State-specific content differentiation via `lib/formulary-insights.ts` + `drug_national_baselines.json`
- Programmatic internal linking (8–15 links per page, category-aware)
- Drug autocomplete search with 2,000-drug index (debounced, keyboard-navigable)
- FAQ section (5 Q&As interpolated with actual tier/PA/step therapy data) + FAQPage JSON-LD
- Triple schema: `@graph` with Drug + MedicalWebPage + HealthInsurancePlan + Organization + BreadcrumbList + FAQPage
- Data Methodology block + Source Citations

### Plan Details / SBC
`/{state-slug}/{county-slug}/{plan-slug}-plan` — Full SBC for any ACA plan (canonical URL)

Features:
- Plan Snapshot card (metal level, plan type, premium, deductible, OOP max)
- Color-coded Real-World Cost Examples table
- Cost-sharing grid (12 service categories)
- Exclusions section (confirmed + pending PDF review)
- FAQ section (5 Q&As) + FAQPage JSON-LD schema
- Location-aware breadcrumbs
- Schema: Article, BreadcrumbList, FAQPage, MedicalEntity

### County Drug Coverage Pages
`/{state-name}/{county-slug}/{drug-slug}-coverage` — Drug coverage scoped to a specific county

### Drug Lookup
`/formulary` — Drug coverage search interface

### Plans
`/plans` — Plan discovery and comparison index
`/{state-slug}/health-insurance-plans` — State marketplace plans listing
`/{state-slug}/{county-slug}` — County plan comparison

### Other Routes
- `/subsidies/{state}/{county}` — APTC subsidy calculator
- `/rates/{state}/{county}` — Rate volatility by county
- `/dental/{state}` — Dental plan comparison
- `/enhanced-credits/**` — Policy scenario modeling
- `/life-events` — SEP and transition guides
- `/faq` — Friction & guidance Q&A
- `/billing` — CPT billing scenarios
- `/states/{state}` — State insurance overview
- `/guides/{slug}` — Editorial guides

### Routing Architecture

- `middleware.ts` intercepts `/{state}/{drug}` and rewrites to `/formulary/{state}/{drug}`
- County slugs (ending in `-county`) pass through middleware to `app/[state-name]/[county-slug]`
- Canonical tags on formulary pages emit `/{state}/{drug}` (not `/formulary/...`)

### Legacy Redirects (do not remove)
- `/plan-details/{id}/{slug}` → `/{state}/{county}/{plan}-plan` (permanentRedirect)
- `/plans/{state}` → `/{state-slug}/health-insurance-plans` (redirect)
- `/plans/{state}/{county}` → `/{state-slug}/{county-slug}` (redirect)
- `/states/{state}/aca-2026` → `/{state}/health-insurance-plans` (permanentRedirect)

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

### Content Differentiation

```bash
python scripts/generate/generate_drug_baselines.py  # Generates national drug baselines
```
Output: `data/processed/drug_national_baselines.json`
Used by: `lib/formulary-insights.ts` → `generateStateInsights()` for per-state formulary content

### County Name Lookup

```bash
python scripts/etl/generate_county_names_static.py   # US Census Bureau → county-names.json (3,235 counties)
```

### SBM Formulary Fetch

```bash
python scripts/fetch/fetch_formulary_sbm.py --verify-urls          # Test URLs only
python scripts/fetch/fetch_formulary_sbm.py --state WA OR --merge  # Fetch + merge
```

Raw data files go in `data/raw/puf/` (gitignored — too large).
Processed JSON outputs go in `data/processed/` (committed).

### Data Sources
- Federal marketplace plan data and plan benefit documents (all public domain)
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

### Build Notes

- `experimental.cpus: 1` — prevents worker OOM when loading large datasets
- `NODE_OPTIONS=--max-old-space-size=8192` — set in package.json build script
- Large-dataset routes use `export const dynamic = 'force-dynamic'` (SSR):
  - `/{state-slug}/{county-slug}`, `/formulary/**`, `/rates/**`, `/subsidies/**`, `/dental/**`, `/enhanced-credits/**`
- Small-dataset routes are SSG: `/life-events`, `/faq`, `/billing`, `/guides`, `/states/**`

---

## Trust & Editorial Pages

| Route | Purpose |
|-------|---------|
| `/editorial-policy` | Editorial standards, data sourcing, review process, correction policy |
| `/data-methodology` | Full ETL pipeline documentation, data provenance, validation steps |
| `/how-we-get-paid` | Revenue transparency — affiliate, advertising, lead gen disclosures |
| `/circle-of-champions` | CMS Elite Circle of Champions recognition, enrollment credentials |
| `/about` | Site mission, operator background, EEAT authority signals |
| `/licensing` | State licensing disclosures |

### AI Crawler Support

- `public/llms.txt` — LLM-specific crawler instructions, preferred citation format, key page URLs
- `public/robots.txt` — expanded with sitemap index, crawl-delay guidance, AI bot directives

---

## SEO / Schema / E-E-A-T

### Schema Markup Library (`lib/schema-markup.ts`)

All JSON-LD built via typed builders:
- `buildFormularyTripleSchema` — 6-type `@graph` block (Drug, MedicalWebPage, HealthInsurancePlan, Organization, BreadcrumbList, FAQPage)
- `buildBreadcrumbSchema`, `buildFAQSchema`, `buildArticleSchema`, `buildStatePlansArticleSchema`
- `buildDatasetSchema`, `buildPlansProductSchema`, `buildSubsidySchemas`
- `buildDentalPlanSchema`, `buildBillingProcedureSchema`, `buildLifeEventHowToSchema`
- `buildPolicyScenarioSchema`, `buildMedicalWebPageSchema`, `buildFinancialProductSchema`

### Per-Page Checklist (enforced across all 65 templates)

| Signal | Details |
|--------|---------|
| `generateMetadata()` | Title, description, canonical, OG, Twitter Card |
| BreadcrumbList schema | Via `SchemaScript` or inline `<script>` |
| FAQPage schema | 5+ Q&As per page |
| LLM comment block | `<!-- HIR: page=X state=Y ... -->` for AI engine discovery |
| Generic byline | "Reviewed by a licensed health insurance professional" |
| BLUF paragraph | ≤60 words answering the zero-click query |

### V19 Formulary Component Library

| Component | Purpose |
|-----------|---------|
| `ProcessBar` | Light trust strip |
| `AeoBlock` | Quick answer card — 3px blue left border |
| `EvidenceBlock` | 3-col stat grid + key/value rows |
| `CostBlock` | Progress bar cost rows + "why costs vary" sub-card |
| `PlanRulesBlock` | Prior auth / step therapy / supply limit rule rows |
| `TimelineSteps` | Numbered timeline with vertical connector line |
| `SavingsRows` | Green icon + title/desc savings tips |
| `LimitsBlock` | YMYL "what this page can't confirm" surface card |
| `AboutBlock` | Data attribution + green dot reviewed line + links |
| `PageFaq` | Accordion FAQ with chevron rotation |
| `GenericByline` | E-E-A-T byline (generic — no name/NPN) |
| `SchemaScript` | JSON-LD injector |

---

## Folder Structure

```
healthinsurancerenew/
├── CLAUDE.md                       # Project instructions for Claude Code
├── DESIGN.md                       # Page design framework (V19/V35 standard)
├── middleware.ts                    # /{state}/{drug} → /formulary/{state}/{drug}
├── app/
│   ├── [state-name]/               # State + county routes
│   │   ├── [county-slug]/          #   /{state}/{county} (county plan comparison)
│   │   │   └── [county-page]/      #   /{state}/{county}/{plan}-plan (SBC)
│   │   │                           #   /{state}/{county}/{drug}-coverage
│   │   └── health-insurance-plans/ # /{state}/health-insurance-plans
│   ├── formulary/                  # Drug lookup + V35 drug coverage pages
│   │   ├── page.tsx                #   Search interface
│   │   └── [issuer]/[drug_name]/   #   V35 template (2,036 lines)
│   ├── plans/                      # Legacy redirect shims
│   ├── plan-details/               # Legacy redirect → canonical plan URL
│   ├── subsidies/                  # APTC calculator pages
│   ├── rates/                      # Rate volatility pages
│   ├── dental/                     # Dental plan pages
│   ├── enhanced-credits/           # Policy scenario pages
│   ├── life-events/                # SEP and transition guides
│   ├── billing/                    # CPT billing pages
│   ├── states/                     # State overview pages
│   ├── guides/                     # Editorial guides
│   ├── faq/                        # FAQ pages
│   ├── tools/                      # Interactive tools
│   ├── sitemaps/                   # Dynamic XML sitemaps
│   └── api/                        # API routes
├── components/
│   ├── AeoBlock.tsx                # Quick answer card
│   ├── EvidenceBlock.tsx           # Stat grid
│   ├── CostBlock.tsx               # Cost progress bars
│   ├── PlanRulesBlock.tsx          # Coverage rule rows
│   ├── GenericByline.tsx           # E-E-A-T byline
│   ├── SchemaScript.tsx            # JSON-LD injector
│   ├── PageFaq.tsx                 # FAQ accordion + schema
│   ├── Header.tsx / Footer.tsx     # Site chrome
│   └── plan/                       # Plan detail sub-components
├── lib/
│   ├── data-loader.ts              # Loads processed JSON datasets
│   ├── schema-markup.ts            # All Schema.org builders (incl. buildFormularyTripleSchema)
│   ├── formulary-helpers.ts        # Tier normalization
│   ├── formulary-insights.ts       # State-specific content differentiation
│   ├── drug-linking.ts             # Drug category taxonomy + linking helpers
│   ├── entity-linker.ts            # Cross-page link logic
│   ├── content-templates.ts        # Editorial content generators
│   ├── county-lookup.ts            # FIPS ↔ county/state conversions
│   ├── plan-slug.ts                # Plan URL slug generation
│   └── plan-sources/               # Federal + SBM adapter pattern
├── data/
│   ├── raw/                        # ⚠️ GITIGNORED — large source files
│   ├── processed/                  # ✅ COMMITTED — structured datasets
│   │   └── drug_national_baselines.json  # National drug baselines
│   └── config/                     # Site config JSONs
├── scripts/
│   ├── fetch/                      # Data download scripts
│   ├── etl/                        # Transform & normalize (10 pillar builders)
│   └── generate/                   # Content generation scripts
├── content/                        # Markdown (guides, FAQ, state pages)
└── docs/                           # Ingestion reports, field maps
```
