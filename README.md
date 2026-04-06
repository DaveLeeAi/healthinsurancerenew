# HealthInsuranceRenew — ACA Intelligence Platform

A Next.js 14 programmatic SEO site powering 12,000+ pages of structured ACA health insurance data across all US states and counties, with additional routes rendered on-demand via SSR. Built from CMS Public Use Files (PUFs) with zero manual content entry.

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

### Plan Details / SBC
`/{state-slug}/{county-slug}/{plan-slug}-plan` — Full SBC for any ACA plan (canonical URL)

URL example: `/north-carolina/wake-county/blue-advantage-bronze-plan`

Features:
- Plan Snapshot card (metal level, plan type, premium, deductible, OOP max)
- Color-coded Real-World Cost Examples table (green/yellow/red by cost level)
- Cost-sharing grid (12 service categories from BenCS PUF)
- Exclusions section (confirmed + pending PDF review)
- FAQ section (5 Q&As with plan-specific data) + FAQPage JSON-LD schema
- Location-aware breadcrumbs: Home › {State} Health Insurance Plans › {County} › {Plan Name}
- Data Methodology block + Source Citations (CMS Plan Attributes PUF, BenCS PUF, Healthcare.gov)
- Data version bar: CMS Marketplace PUF 2026
- Schema: Article, BreadcrumbList, FAQPage, MedicalEntity

**Legacy redirects (301):**
- `/plan-details/{plan_id}/{slug}` → `/{state}/{county}/{plan-slug}-plan`
- `/{state-slug}/{plan-slug}-plan` (no county) → `/{state}/{county}/{plan-slug}-plan` (county resolved from data)

**Plan slug format:** `{plan-name-lowercased-hyphenated}-plan` (always ends in `-plan`; no double suffix)

### Formulary
`/[state]/[drug]/` — Drug coverage by state

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

### County Drug Coverage Pages
`/[state-name]/[county-slug]/[drug-slug]-coverage` — Drug coverage scoped to a specific county

URL format example: `/north-carolina/wake-county/metformin-coverage`

Features:
- State slug → state code → county FIPS → formulary lookup (fully dynamic, all ~3,000 counties × any drug)
- Hero answer box with coverage interpretation (covered/limited/requires prior authorization/not covered)
- "Plans That Cover This Drug" — per-carrier breakdown joining formulary issuer_ids to county plan records
- Related drug pills (same therapeutic category) using canonical county URL format
- FAQ (5 Q&As with real tier/PA/step therapy data), methodology block, soft CTA
- 404 on invalid state slug, county slug, or missing `-coverage` suffix
- Schema: Article, FAQPage, BreadcrumbList

### Drug Category Hub Pages
`/drugs/categories/[id]` — Hub for each of 20 therapeutic drug categories

Pre-built at deploy via `generateStaticParams()` for all 20 categories (diabetes, blood-pressure, cholesterol, mental-health, weight-loss, etc.)

### Drug Comparison Pages
`/drugs/compare/[drug-a-vs-drug-b]` — Side-by-side coverage, cost, and PA comparison

15 pre-built seed pairs (metformin-vs-ozempic, ozempic-vs-wegovy, mounjaro-vs-wegovy, etc.) via `generateStaticParams()`.

### Drug Hub Index
`/drugs` — Master index with priority category grid, full 20-category grid, 8 featured comparisons

### Plans Index
`/plans` — Plan discovery and comparison index

Distinct from `/states`. Intent: discover and compare marketplace plan inventory.

- **FFM states** (federal exchange): state cards showing county count + plan count, linking into county comparison
- **SBM states** (own exchange): state cards linking to state's plan hub + exchange info
- **Missing-inventory states**: greyed tiles with alternative CTAs (subsidy calculator, drug lookup, healthcare.gov) — inventory gaps are handled inside `/plans`, never by redirecting to `/states`

### County Plan Comparison
`/{state-slug}/{county-slug}` — All marketplace plans for a county

**Legacy redirects (301):**
- `/plans/{state}/{fips}` → `/{state-slug}/{county-slug}`
- `/plans/{state}` → `/{state-slug}/health-insurance-plans`

### Navigation Architecture

`/plans` and `/states` are **intentionally distinct** destinations:

| Nav item | Route | Intent |
|----------|-------|--------|
| Plans | `/plans` | Discover and compare marketplace plan inventory by state/county |
| States | `/states` | State education directory — exchange type, Medicaid expansion, enrollment guides |

These must never resolve to the same page. If plan inventory is missing for a state, the gap is handled inside `/plans` with alternative CTAs — users are never silently redirected from Plans to States.

### State Plan Pages (shared template)
`/{state-slug}/health-insurance-plans` — Canonical state marketplace plans index

Single template (`app/[state-name]/health-insurance-plans/page.tsx`) serving all 50 states. Dynamically generates:

- **FAQ answers** (5 per state) using actual `planCount`, `carrierCount`, `premiumRange`, `avgDeductible`, `exchangeType`, `medicaidExpanded`
- **About section** (300+ words, 5 paragraphs): exchange type explanation (FFM vs SBM), Medicaid expansion impact, plan/carrier/premium context, OEP + SEP rules, subsidy/CSR details
- **GEO "At a Glance" stat block** — structured `<dl>` for AI engine extraction (SGE, Perplexity, ChatGPT)
- **Schema** — Article (Organization author) + FAQPage (Q+A) + Dataset + BreadcrumbList in `<head>`
- **Byline** — "Reviewed by a licensed health insurance professional" (name/NPN only on homepage + /circle-of-champions)

States with handwritten prose (CA, FL, TX, NY) use curated copy. All others use the dynamic template with real CMS data.

SEO framework coverage: SEO, AEO, GEO, AIO/LLMO, E-E-A-T, HCU, YMYL, Schema, Zero-Click/BLUF, Topical Authority.

### Other Routes
- `/subsidies/[state]/[county]` — APTC subsidy calculator
- `/rates/[state]/[county]` — Rate volatility by county
- `/dental/[state]` — Dental plan comparison
- `/enhanced-credits/**` — Policy scenario modeling
- `/life-events` — SEP and transition guides
- `/faq` — Friction & guidance Q&A

**Legacy redirects (301):**
- `/states/{state}/aca-2026` → `/{state}/health-insurance-plans` (via both `permanentRedirect()` in page + `next.config.js`)

### Plan Source Adapters (`lib/plan-sources/`)

Adapter-ready architecture for federal (Healthcare.gov) and state-based marketplace (SBM) data:

| File | Purpose |
|------|---------|
| `source-registry.ts` | Maps all 50 states + DC to source type (FFM vs SBM) |
| `federal-adapter.ts` | Wraps CMS PUF data loaders (`plan`, `formulary`, `sbc`) |
| `sbm-adapter.ts` | Scaffold for SBM states — formulary delegates to federal adapter |

SBM states (no county-level plan data in federal PUF): CA, CO, CT, DC, ID, KY, MA, MD, ME, MN, NJ, NM, NV, NY, OR, PA, RI, VT, WA

Add per-state SBM support via `lib/plan-sources/states/sbm-{state}.ts`.

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

### County Name Lookup Data

```bash
python scripts/etl/generate_county_names_static.py   # Downloads county names from US Census Bureau
                                                      # Outputs data/config/county-names.json (3,235 counties)
                                                      # Used by lib/county-lookup.ts for FIPS → human name
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
  - `/{state-slug}/{county-slug}` (canonical county plans), `/{state-slug}/{county-slug}/{slug}` (plan SBC + drug coverage), `/formulary/**`, `/rates/**`, `/subsidies/**`, `/dental/**`, `/enhanced-credits/**`
  - Legacy `/plans/[state]/[county]` redirects (301) → canonical `/{state-slug}/{county-slug}`
- Small-dataset routes are SSG: `/life-events`, `/faq`, `/billing`, `/guides`, `/states/**`

---

## Trust & Editorial Pages

| Route | Purpose |
|-------|---------|
| `/editorial-policy` | Editorial standards, data sourcing, review process, correction policy |
| `/data-methodology` | Full ETL pipeline documentation, CMS PUF provenance, validation steps |
| `/how-we-get-paid` | Revenue transparency — affiliate, advertising, lead gen disclosures |
| `/circle-of-champions` | CMS Elite Circle of Champions recognition, enrollment credentials |
| `/about` | Site mission, operator background, EEAT authority signals |
| `/licensing` | State licensing disclosures |

### AI Crawler Support

- `public/llms.txt` — LLM-specific crawler instructions, preferred citation format, key page URLs
- `public/robots.txt` — expanded with sitemap index, crawl-delay guidance, AI bot directives

---

## SEO / Schema / E-E-A-T — Sitewide Template Sweep

Every public page (65 templates) now includes the full SEO + E-E-A-T stack:

### Per-Page Checklist (enforced across all 65 templates)

| Signal | Status | Details |
|--------|--------|---------|
| `generateMetadata()` | All dynamic routes | Title, description, canonical, OG, Twitter Card |
| Static `metadata` export | All index/static routes | Same fields via static export |
| BreadcrumbList schema | All pages | Via `SchemaScript` or inline `<script>` |
| FAQPage schema | All pages with FAQ sections | 5+ Q&As per page, auto-injected via `PageFaq` |
| Article schema | Guide, state, county pages | Organization author, `isBasedOn` citing CMS dataset |
| Dataset schema | Plans, subsidies, formulary, rates | CMS PUF provenance |
| CollectionPage schema | Index pages (states, guides) | `hasPart` linking child pages |
| LLM comment block | All pages | `<!-- HIR: page=X state=Y ... -->` for AI engine discovery |
| Generic byline | All non-legal pages | "Reviewed by a licensed health insurance professional" |
| Data attribution | All data pages | "CMS QHP Landscape PUF · Plan Year 2026" |
| BLUF paragraph | All content pages | ≤60 words answering the zero-click query |

### Shared E-E-A-T Components

| Component | Path | Purpose |
|-----------|------|---------|
| `GenericByline` | `components/GenericByline.tsx` | Renders "Reviewed by a licensed health insurance professional" + data source + last reviewed date |
| `LlmComment` | `components/LlmComment.tsx` | Injects `<!-- HIR: ... -->` HTML comment with page metadata for AI crawlers |
| `DataAttribution` | `components/DataAttribution.tsx` | Lightweight data source footer for pages where full byline is too heavy |
| `PageFaq` | `components/PageFaq.tsx` | FAQ accordion + auto-injected FAQPage JSON-LD schema |

### Author/NPN Rule

- **Dave Lee name + NPN 7578729**: Only on `app/page.tsx` (homepage) and `app/circle-of-champions/page.tsx`
- **All other pages**: Generic byline only — no name, no NPN
- Every template includes: `// NOTE: No name/NPN on this page — generic byline only`

### Schema Markup Library (`lib/schema-markup.ts`)

All JSON-LD built via typed builders: `buildBreadcrumbSchema`, `buildFAQSchema`, `buildArticleSchema`, `buildStatePlansArticleSchema`, `buildDatasetSchema`, `buildPlansProductSchema`, `buildSubsidySchemas`, `buildFormularyDrugSchema`, `buildDentalPlanSchema`, `buildBillingProcedureSchema`, `buildLifeEventHowToSchema`, `buildPolicyScenarioSchema`, `buildMedicalWebPageSchema`, `buildFinancialProductSchema`.

### Consumer Copy Standard

Visible UI copy uses "Marketplace" language (what consumers search for), not "ACA":
- "Marketplace health insurance plans" not "ACA Marketplace plans"
- "Marketplace coverage" not "ACA coverage"
- "federal rules" / "federal law" not "ACA rules"
- Exceptions: schema JSON-LD, data source citations, CFR/regulatory references, "ACA-compliant" / "ACA-mandated" (technical/legal terms)

### V19 Formulary Component Library

All formulary drug page components are pixel-matched to the approved `ozempic_nc_formulary_v19.html` mockup. Design tokens: body bg `#ecf1f7`, shell `max-width: 800px`, H1 Lora 27px/500, borders `#dbe3ec`, muted `#728fa4`, blue accent `#1a56a0`, green `#0b6e4a`.

| Component | File | V19 Section |
|-----------|------|-------------|
| `ProcessBar` | `components/ProcessBar.tsx` | Light trust strip — bg `#f3f7fa`, text `#728fa4`, green dots |
| `AeoBlock` | `components/AeoBlock.tsx` | Quick answer card — 3px blue left border, white bg, caveat inside |
| `EvidenceBlock` | `components/EvidenceBlock.tsx` | 3-col stat grid + key/value rows + italic note footer |
| `CostBlock` | `components/CostBlock.tsx` | Progress bar cost rows + "why costs vary" sub-card |
| `PlanRulesBlock` | `components/PlanRulesBlock.tsx` | Prior auth / step therapy / supply limit rule rows |
| `TimelineSteps` | `components/TimelineSteps.tsx` | Numbered timeline with vertical connector line |
| `SavingsRows` | `components/SavingsRows.tsx` | Green icon + title/desc savings tips |
| `LimitsBlock` | `components/LimitsBlock.tsx` | YMYL "what this page can't confirm" surface card |
| `AboutBlock` | `components/AboutBlock.tsx` | Data attribution + green dot reviewed line + links |
| `DrugPageCta` | `components/DrugPageCta.tsx` | Green primary CTA (`.cta-primary`) |
| `NextStepCta` | `components/NextStepCta.tsx` | Blue-accent mid-page CTA (`.cta-mid`) |
| `GlobalCTA` | `components/GlobalCTA.tsx` | Bottom-of-page CTA (`.cta-bottom`) |
| `PageFaq` | `components/PageFaq.tsx` | Accordion FAQ with chevron rotation |

---

## Folder Structure

```
app/                    # Next.js App Router pages
  [state-name]/         # State + county routes
    [county-slug]/      #   /{state}/{county}                       (county plan comparison index)
      [county-page]/    #   /{state}/{county}/{plan-name}-plan      (SBC / plan detail — canonical)
                        #   /{state}/{county}/{drug-name}-coverage  (county drug coverage)
    health-insurance-plans/  # /{state}/health-insurance-plans     (canonical state route)
  plan-details/         # Legacy redirect only → /{state}/{county}/{plan-name}-plan (301)
  formulary/            # Drug formulary pages (force-dynamic)
  drugs/                # Drug hub index + 20 category hubs + comparison pages
  plans/                # Plan comparison by county
  subsidies/            # APTC calculator pages
  ...
components/             # React TSX components
  GenericByline.tsx     # E-E-A-T byline (generic — no name/NPN)
  LlmComment.tsx        # HTML comment block for AI crawlers
  DataAttribution.tsx   # Lightweight data source footer
  PageFaq.tsx           # FAQ accordion + FAQPage JSON-LD schema
  SBCGrid.tsx           # Cost-sharing grid
  SchemaScript.tsx      # JSON-LD injector
  EntityLinkCard.tsx    # Related page links
  GlobalCTA.tsx         # Sitewide agent-consultation CTA block
  plan/                 # Plan detail sub-components (SBC page sections)
    PlanHeroBLUF.tsx    #   Above-the-fold plan snapshot + BLUF summary
    PlanMetalContext.tsx #   Metal tier educational callout
    PlanCostScenario.tsx #  Real-world cost scenario table
    PlanFitSummary.tsx  #   Plan fit summary for target enrollee types
    PlanFAQ.tsx         #   Plan-specific FAQ section
    PlanCrossLinks.tsx  #   Related plan/county cross-links
    ...                 #   + 5 additional plan detail components
  ...
lib/
  data-loader.ts        # Loads processed JSON datasets
  schema-markup.ts      # All Schema.org builders
  content-templates.ts  # Editorial content generators
  entity-linker.ts      # Cross-page link logic
  cta-config.ts         # Centralized CTA variants (network / generic)
  drug-linking.ts       # Drug category taxonomy + internal linking helpers (20 categories, ~200 drugs)
  formulary-helpers.ts  # CMS tier → consumer-facing label mapping
  county-lookup.ts      # FIPS ↔ county name/slug ↔ state code/slug conversions (3,235 counties)
  plan-slug.ts          # Plan URL slug generation, parsing, lookup (generatePlanSlug / getPlanBySlug)
  plan-sources/         # Source adapter pattern — federal-adapter, sbm-adapter, source-registry
  types.ts              # All TypeScript interfaces
content/                # Markdown (guides, FAQ, state pages, tool descriptions)
data/
  raw/                  # ⚠️ GITIGNORED — CMS PUF files
  processed/            # ✅ COMMITTED — structured datasets + SBM formulary per-state files
  config/               # Site config JSONs (FPL tables, SBM registry, county-names.json, etc.)
  schema/               # JSON validation schemas
docs/                   # SBM ingestion reports, field maps
scripts/
  fetch/                # Data download scripts (PUF fetcher, SBM formulary fetcher)
  etl/                  # Transform & normalize scripts (10 pillar builders)
  generate/             # Content generation scripts
```
