# Phase 4.5 Full Audit Report
Generated: 2026-04-07

---

## 1. Route Map

### Page Routes (69 total)

**Core Data Pages:**
- `app/page.tsx` — Homepage
- `app/[state-name]/health-insurance-plans/page.tsx` — State hub
- `app/[state-name]/health-insurance-plans/[plan-slug]/page.tsx` — SBC plan detail (SBM)
- `app/[state-name]/[county-slug]/page.tsx` — County hub
- `app/[state-name]/[county-slug]/[county-page]/page.tsx` — County sub-page (plan detail + drug coverage dispatcher)
- `app/formulary/[issuer]/[drug_name]/page.tsx` — Formulary drug page (2,158 lines)
- `app/formulary/page.tsx` — Drug lookup/search tool
- `app/subsidies/page.tsx` / `[state]/page.tsx` / `[state]/[county]/page.tsx` — Subsidy hub/state/county
- `app/rates/page.tsx` / `[state]/page.tsx` / `[state]/[county]/page.tsx` — Rate volatility hub/state/county
- `app/dental/page.tsx` / `[state]/page.tsx` / `[state]/[plan_variant]/page.tsx` — Dental hub/state/plan
- `app/enhanced-credits/page.tsx` / `[state]/page.tsx` / `[state]/[county]/page.tsx` — Enhanced credits hub/state/county
- `app/billing/page.tsx` / `[cpt_code]/page.tsx` — Billing hub/detail
- `app/life-events/page.tsx` / `[event_type]/page.tsx` — Life events hub/detail
- `app/faq/page.tsx` / `[category]/page.tsx` / `[category]/[slug]/page.tsx` — FAQ hub/category/detail

**Guides & Tools:**
- `app/guides/page.tsx` / `[slug]/page.tsx` — Guides hub/detail
- `app/guides/aca-subsidy-cliff-2026/page.tsx` — Standalone guide
- `app/guides/bronze-vs-silver-plan-2026/page.tsx` — Standalone guide
- `app/guides/does-aca-cover-ozempic-2026/page.tsx` — Standalone guide
- `app/guides/glp-1-drugs-covered-by-aca-plans/page.tsx` — Standalone guide
- `app/guides/how-to-read-your-sbc/page.tsx` — Standalone guide
- `app/tools/page.tsx` — Tools index
- `app/tools/csr-estimator/page.tsx` — CSR estimator
- `app/tools/family-coverage-estimator/page.tsx` — Family estimator
- `app/tools/income-savings-calculator/page.tsx` — Income savings calculator
- `app/tools/job-plan-affordability/page.tsx` — Job plan affordability checker
- `app/tools/plan-comparison/page.tsx` — Plan comparison tool
- `app/tools/what-income-counts/page.tsx` — Income types explainer

**Standalone Content:**
- `app/aca-income-guide-2026/page.tsx`
- `app/circle-of-champions/page.tsx`
- `app/csr-explained-2026/page.tsx`
- `app/early-retirement-health-insurance-2026/page.tsx`
- `app/eligibility-check/page.tsx`
- `app/employer-coverage-unaffordable-2026/page.tsx`
- `app/fpl-2026/page.tsx`
- `app/glossary/page.tsx`
- `app/how-we-get-paid/page.tsx`
- `app/lost-job-health-insurance-2026/page.tsx`
- `app/self-employed-health-insurance-2026/page.tsx`
- `app/turning-26-health-insurance-options/page.tsx`

**Trust & Legal:**
- `app/about/page.tsx` / `author/page.tsx` / `editorial-standards/page.tsx` / `methodology/page.tsx`
- `app/contact/page.tsx`
- `app/data-methodology/page.tsx`
- `app/editorial-policy/page.tsx`
- `app/licensing/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`

**Iowa MVP:**
- `app/iowa/compare-health-insurance/page.tsx`

**Legacy Redirects:**
- `app/plan-details/[plan_id]/[slug]/page.tsx` — permanentRedirect
- `app/plans/page.tsx` / `[state]/page.tsx` / `[state]/[county]/page.tsx` — redirects
- `app/states/page.tsx` / `[state]/page.tsx` / `[state]/aca-2026/page.tsx` — redirects

### API Routes (5)
- `app/api/formulary/suggest/route.ts` — Drug autocomplete
- `app/api/iowa-compare/route.ts` — Iowa comparison API
- `app/robots.txt/route.ts`
- `app/sitemap.xml/route.ts`
- `app/sitemaps/[type]/route.ts`

### Layouts (8)
- `app/layout.tsx` — Root layout (Header + Footer + ChatWidget + GA4)
- `app/formulary/layout.tsx`
- 6 tool-specific layouts (`app/tools/*/layout.tsx`)

### Middleware
- `middleware.ts` — Rewrites `/{state}/{drug}` → `/formulary/{state}/{drug}`. Passes through `-county`, `-plan`, `health-insurance-plans`, `compare-health-insurance` segments. Well-structured with clear comments.

---

## 2. Homepage

**File:** `app/page.tsx` (485 lines)

### Sections:
1. **Hero** — H1: "Health insurance that actually makes sense." Trust badge (licensed agent + CMS recognized + state count). "Who it's for" pill links. Two CTAs: "See what I qualify for" + "Browse free tools". 3 hero tool cards.
2. **Data Authority Bar** — Dark bg, 6 stats (551K+ drugs, 1,852 county records, 942 dental plans, 54 Q&As, 50 states, licensed states count). CMS data source attribution.
3. **Guides** — Grid of 11 guide cards with links.
4. **Tools** — Grid of 7 tool cards. Includes Iowa Compare tool.
5. **Data Pillars** — 10 pillar cards (Plans, Subsidies, Rates, Formulary, Dental, Billing, Life Events, Enhanced Credits, FAQ, Plan Details/SBC).
6. **Trust / E-E-A-T** — 3 trust cards (Licensed Agent, Federal Data, No Ads/Lead Sales). 3 hero images.
7. **CMS Elite Circle of Champions** — Recognition details, enrollment volume, licensed states count.
8. **Licensed States** — Grid of state abbreviation cards linking to `/states/{slug}`.

### Assessment:
- **Copy quality: 8/10** — Consumer-friendly, active voice, specific numbers. Not V35 level but strong.
- **Schema:** WebSite + Organization + WebPage/Speakable — correctly structured.
- **Trust signals:** CMS recognition, NPN number, licensed state count, "How we get paid" link, editorial policy link. Strong.
- **Issues:**
  - Licensed states grid links to `/states/${state.slug}` (line 473) — this is the OLD route pattern. `app/states/[state]/page.tsx` exists as a redirect, so it works but adds a redirect hop.
  - Data authority bar stat "551,000+ Drugs in Formulary Database" is stale — actual count is 15.2M+ plan-level records or ~551K unique drugs. The number is defensible but could mislead.
  - Images use bare `<img>` with `loading="lazy"` — should use `next/image` per project rules.
  - No FAQ section on homepage (missing rich snippet opportunity).
  - No `<h2>` for "Licensed agents are available in X states" section — uses `<h2>` correctly, good.

---

## 3. Navigation

### Header (`components/Header.tsx`, 78 lines)
**Nav items (7 + CTA):**
| Label | Destination | Status |
|-------|-------------|--------|
| Guides | `/guides` | OK |
| Tools | `/tools` | OK |
| States | `/states` | OK (redirect page exists) |
| Plans | `/plans` | OK (redirect page exists) |
| Subsidies | `/subsidies` | OK |
| Drug Lookup | `/formulary` | OK |
| Dental | `/dental` | OK |
| Get Help (CTA) | `/contact` | OK |

- Mobile menu: hamburger toggle, accordion nav. Works.
- **Missing from nav:** Life Events, Enhanced Credits, Billing, FAQ, Rates. Footer covers these.

### Footer (`components/Footer.tsx`, 160 lines)
**4 columns on desktop, accordion on mobile:**

**Coverage Data (7 links):** Plans, Subsidies, Rates, Drug Lookup, Dental, Life Events, Enhanced Credits — all valid.

**Resources (7 links):** Guides, Lost Your Job?, Self-Employed Coverage, Billing, FAQ, Tools, Glossary — all valid.

**Company (5 links):** About, Contact, Privacy, Terms, Editorial Policy — all valid.

**Trust & Compliance:** Editorial policy link, CMS Marketplace Certified badge, licensed states list, Circle of Champions link, Data & Methodology link — all valid.

**Total footer links:** 26 unique destinations. All verified.

**Disclaimer:** Present. Non-government disclaimer, compensation disclosure, educational purposes statement.

### Breadcrumbs
- `Breadcrumbs` component used in 60 files — excellent coverage.
- Consistent pattern across all page types.

---

## 4. Formulary Content Uniqueness

### 4a. Prose Block Classification

| Classification | % of Visible Prose | Description |
|---|---|---|
| **STATIC** | ~35% | Identical on all 15M pages: PA timeline (5 steps), LimitsBlock (5 items), 3 of 7 FAQs, related guides, cost section varyRows, disclaimer footer |
| **VARIABLE-SWAP** | ~40% | Same sentence with drug/state/count plugged in: H1, AeoBlock, EvidenceBlock stats, FAQ #1-4, cost heading, CTAs, AboutBlock |
| **CONDITIONAL** | ~20% | Different structure from fixed set of 4-6 templates: Editorial Insight Box (4 variants), Savings section (3 drug-class variants), PA yes/no branches |
| **UNIQUE** | ~5% | Genuinely different per state: insurer list with tier badges, related drug pills |

**Estimated cross-state uniqueness for the same drug: 8-12%.**

### 4b. National Baselines

**`data/processed/drug_national_baselines.json` DOES NOT EXIST.**

This is the single biggest gap. The entire state differentiation system (`lib/formulary-insights.ts`, 222 lines) is fully built but completely dormant. The `getDrugBaseline()` function returns `null`, causing all 7 differentiation fields to fall through to static defaults:
- `accessQualifier` — empty
- `insightBody` — empty
- `paComparison` — empty
- `tierComparison` — empty
- `costContext` — empty
- `tierBreakdown` — empty
- `paNote` — empty

Generating this file would activate ~15 additional unique sentences per state page.

### 4c. Helper Functions

- `lib/formulary-helpers.ts` — Tier labels, PA status computation, plan count formatting. Functional helpers, not content generators.
- `lib/formulary-insights.ts` — 222 lines of state-differentiation logic. DORMANT (baselines missing).
- `lib/content-templates.ts` — `generateFormularyContent()` produces editorial body HTML. Variable-swap with minor conditional branching.

### 4d. Rendered Content Diff

Unable to run dev server for live diffing, but manual template analysis confirms:

**For the same drug (e.g., metformin) across Ohio vs Kansas vs Iowa:**
- H1, breadcrumbs, meta title/description: state name swap only
- AeoBlock answer: plan count + state name swap
- Cost section intro: 100% identical (baselines missing)
- PA timeline: 100% identical (150 words, word-for-word)
- LimitsBlock: 100% identical (80 words)
- FAQ #5-7: 100% identical
- Related guides: 100% identical
- Disclaimer: 100% identical
- Insurer list: **genuinely different** (different carriers per state)
- Related drugs: **genuinely different**

### 4e. Top 20 Worst Duplicate Lines (STATIC across all pages)

1. "Two things drive your cost: whether your deductible is met, and which tier your plan puts this drug on. The gap between tiers is bigger than most people expect." (line 1051)
2. "Tier placement is one of the more impactful things to check when comparing options." (line 1058)
3. "Your plan's price varies by pharmacy. Preferred pharmacies and mail-order often come in lower -- worth checking before your first fill." (line 1059)
4. "Some plans have a separate drug deductible; others combine it with your medical one. That structure determines when your lower monthly copay kicks in." (line 1060)
5. Entire PA timeline — 5 steps, ~150 words (lines 1144-1167)
6. "If your plan requires it -- and most do -- your doctor handles the paperwork." (line 1155)
7. "Response times vary by plan and urgency. Check your benefit documents or call member services..." (line 1161)
8. "Authorization periods vary by plan -- check your benefit documents..." (line 1162)
9. "Most plans include an internal appeal process..." (line 1163)
10. Entire LimitsBlock — 5 items, ~80 words (lines 1252-1266)
11. "Whether your doctor's documentation will meet your specific plan's approval requirements..." (line 1259)
12. FAQ #5: Coverage exception answer (line 695-696)
13. FAQ #6: Plan switching answer (line 699-700)
14. FAQ #7: Exception vs PA answer (line 703-705)
15. "How to request a drug list exception" section (editorial body, lines 892-894)
16. Related guides — 2 hardcoded links (lines 1327-1352)
17. GenericByline text (line 1537-1551)
18. "Coverage alone doesn't tell the full story." (line 997)
19. "Comparing these two factors across plans is the best way to estimate your real monthly cost." (line 1002)
20. "We looked at drug list inclusion, tier placement, prior authorization requirements..." (line 1316)

### LLM-Sounding / Stiff Phrases

| Line | Phrase | Issue |
|---|---|---|
| 997 | "Coverage alone doesn't tell the full story." | Cliche LLM opener |
| 1051 | "The gap between tiers is bigger than most people expect." | Unsourced claim, filler |
| 1058 | "Tier placement is one of the more impactful things to check" | Vague LLM filler |
| 1059 | "come in lower -- worth checking before your first fill" | Informal + vague |
| 1155 | "Here's what the process typically looks like from start to finish." | Filler |
| 1161 | "Check your benefit documents or call member services for the timeline" | Repeated 3x, hedging |
| 1259 | "Whether your doctor's documentation will meet your specific plan's approval requirements -- that depends on your plan's rules and your situation." | Circular, says nothing |
| 1316 | "We looked at drug list inclusion, tier placement..." | Defensive process description |
| 923 | "What you pay can vary quite a bit depending on..." | "can vary quite a bit" = padding |
| 1845 | "Clinical details for {Drug} are not yet indexed in our database." | Admission of missing data |

### Dead Code in Template
4 sub-components defined but never rendered (~400 lines of dead code):
- `DrugClinicalContext` (lines 1755-1853)
- `DrugCashPriceComparison` (lines 1859-1931)
- `DrugCostHelp` (lines 1937-1985)
- `DrugPatientActionGuide` (lines 1991-2085)

### Projected Uniqueness After Fixes
If `drug_national_baselines.json` is generated and the dormant `formulary-insights.ts` system activates, estimated uniqueness would improve from ~8-12% to ~25-30%. Additional content variation strategies (state-specific regulations, carrier landscape commentary, regional pricing context) could push it to the 30-40% target.

---

## 5. Page Type Assessments

| Page Type | Lines | Score | Forbidden Phrases | Schema | Byline | Sources | CTA | Key Issues |
|---|---|---|---|---|---|---|---|---|
| **State Hub** | 1,051 | 8/10 | None | Article, Dataset, Breadcrumb, FAQ, WebPage | Yes | Yes | Yes | `new Date()` for dateModified; state-specific prose only for CA/FL/TX/NY |
| **County Hub** | 704 | 8/10 | None | Article, Product, Breadcrumb, WebPage, FAQ | Yes | Yes | Yes | `new Date()` for dateModified |
| **County Sub-page** | 1,094 | 9/10 | None | Article, WebPage, FinancialProduct, FAQ, Breadcrumb | Yes | Yes | Yes | `new Date()` for dateModified; dispatcher for plan+drug |
| **SBC Plan Detail (SBM)** | 527 | 8/10 | None | Breadcrumb, FAQ | Yes | Yes | Yes | Missing WebPage/Article schema |
| **Subsidy Detail** | 375 | 8/10 | None | Subsidy schemas, Breadcrumb | Yes | Yes | Yes | Clean; interactive calculator; 2026 cliff messaging |
| **Rate Volatility** | 621 | 8/10 | None | Article, Dataset, Breadcrumb, WebPage | Yes | Yes | Yes | `new Date()` for dateModified |
| **Dental State** | 289 | 7/10 | None | Article, Breadcrumb | Yes | Yes | No CTA | Missing WebPage + FAQ schema |
| **Dental Plan Detail** | 723 | 8/10 | None | Article, Breadcrumb, Dental, FAQ, WebPage | Yes | Yes | No CTA | Thorough; missing agent enrollment CTA |
| **Life Events** | 435 | 8/10 | None | Breadcrumb, WebPage, HowTo, FAQ | Yes | Yes | No CTA | FAQ answers are placeholder text |
| **Billing** | 575 | 8/10 | None | Article, Breadcrumb, WebPage, FAQ | Yes | Yes | Yes | Solid; CPT + ICD-10 cross-reference |
| **Enhanced Credits** | 792 | 9/10 | None | Article, Breadcrumb, Policy, FAQ | Yes | Yes | Yes | Strong policy analysis; `new Date()` for dateModified |
| **Guides** | 147 | 7/10 | None | Article, Breadcrumb, FAQ | Yes | Yes | No CTA | Markdown-driven; related resources hardcoded |
| **FAQ Index** | 245 | 7/10 | None | FAQ, Breadcrumb | Yes | Yes | Yes | Clean; FAQ schema uses only top question per category |
| **FAQ Detail** | 289 | 7/10 | None | FAQ, Article, Breadcrumb | Yes | Yes | No CTA | Good; regulatory citations; missing agent CTA |
| **About** | 255 | 8/10 | None | WebPage | No (alt trust components) | Yes | No | Uses older `lib/schema` system |
| **Author** | 304 | 9/10 | None | ProfilePage | No (author page) | Yes | No | Excellent EEAT; uses `<img>` not `next/image` |
| **Editorial Policy** | 176 | 7/10 | None | FAQ, Breadcrumb | Yes | Yes | No | Inline hand-rolled schema |
| **Formulary Search** | 387 | 8/10 | None | Dataset, Breadcrumb, WebPage | Yes | Yes | Yes | Canonical set to `/drugs` (should be `/formulary`) |
| **Tools Index** | 248 | 7/10 | None | Breadcrumb, FAQ | Yes | No | Yes | Missing WebPage/Article schema; no SourcesBox |
| **Glossary** | 191 | 7/10 | None | Article, Breadcrumb, FAQ | Yes | Yes | Yes | 16 terms only; uses hardcoded date (good) |

### Forbidden Phrases Found (across all files)
| File | Line | Phrase | Severity |
|---|---|---|---|
| `app/formulary/[issuer]/[drug_name]/page.tsx` | 494, 599 | "All Insurers" | HIGH — appears in navigation labels |
| `app/guides/aca-subsidy-cliff-2026/page.tsx` | 288 | "Insurers proposed" | MEDIUM |
| `components/SubsidyCalculator.tsx` | 341 | "Insurers apply" | MEDIUM |
| `app/about/methodology/page.tsx` | 266 | "negotiated rates" | MEDIUM |

---

## 6. Internal Link Issues

### Dead Links (pointing to non-existent routes)

| Priority | Link | File | Line | Should Be |
|---|---|---|---|---|
| **HIGH** | `/compare/${stateSlug}` | `app/formulary/[issuer]/[drug_name]/page.tsx` | 1185, 1198 | No `/compare/` route exists — remove or build |
| **MEDIUM** | `/about/data-methodology` | `components/plan/PlanAuthorityBlock.tsx` | 72 | `/data-methodology` |
| **MEDIUM** | `/about/editorial-policy` | `components/plan/PlanAuthorityBlock.tsx` | 68 | `/editorial-policy` |
| **MEDIUM** | `/tools/subsidy-estimator` | `components/plan/PlanAuthorityBlock.tsx` | 51 | `/tools/income-savings-calculator` |
| **LOW-MED** | `/guides/how-approval-rules-work-for-prescriptions` | `app/formulary/[issuer]/[drug_name]/page.tsx` | 1344 | No guide content file exists |
| **LOW-MED** | `/guides/how-deductibles-affect-drug-costs` | `app/formulary/[issuer]/[drug_name]/page.tsx` | 1336 | No guide content file exists |

### Missing Cross-Links

| From | To | Gap |
|---|---|---|
| State hub pages | `/formulary` | No drug lookup cross-link |
| Tool pages | `/guides` | No guide cross-links from any tool |
| Formulary pages | County hub pages | Only links to state hub, not county |

### Link Equity Distribution
- `/contact` receives 29 inbound links — highest after homepage (33)
- `/tools/income-savings-calculator` receives 17 — appropriate for primary CTA
- `/fpl-2026` receives 14 — strong for a reference page
- `/formulary` receives only 6 inbound links despite being the largest content section (15M+ pages)
- `/rates`, `/dental`, `/life-events` receive only 2 links each — underlinked

### Homepage State Links Issue
Homepage licensed states grid (line 473) links to `/states/${state.slug}` — this triggers a redirect to the canonical route. Should link directly to canonical `/${state-slug}/health-insurance-plans` to avoid redirect hop.

---

## 7. Unused Components

**All 31 components are imported at least once.** No orphaned components found.

However, 4 sub-components inside the formulary template are defined but never called:
- `DrugClinicalContext` (lines 1755-1853)
- `DrugCashPriceComparison` (lines 1859-1931)
- `DrugCostHelp` (lines 1937-1985)
- `DrugPatientActionGuide` (lines 1991-2085)

These are ~400 lines of dead code within the formulary page file.

---

## 8. Mobile Issues

### Non-Responsive Grids
- `app/states/page.tsx` line 153: `grid-cols-3` without responsive prefix — 3 stat cards forced into 3 columns on phones.

### Fixed Pixel Widths
- No problematic fixed widths found. All `w-[Npx]` instances are either max-width constraints or responsive.

### Overflow Handling
- 32 instances of `overflow-x-auto`/`overflow-auto` across 22 files — tables properly wrapped.

### Images Not Using next/image
- `app/page.tsx` lines 411-413: `<img>` tags for hero images (should use `next/image`)
- `app/about/author/page.tsx` line 88: `<img>` tag (should use `next/image`)

---

## 9. Priority Fix List (ordered by impact)

### Critical (blocks Phase 5 or harms SEO)

1. **Generate `drug_national_baselines.json`** — Activates the dormant state differentiation system. Currently ~35% of formulary page prose is identical across all 15M pages. This single file would activate 7 differentiation fields and increase uniqueness from ~8% to ~25-30%.

2. **Fix `/compare/${state}` dead links** in formulary template (lines 1185, 1198) — These 404 on every formulary page. Either build the compare route or replace with a valid link.

3. **Fix `new Date()` in 21 schema dateModified instances** across billing, dental, enhanced-credits, faq, life-events, rates, states, county hub, and county sub-page files. CLAUDE.md explicitly forbids this: "Never use `new Date()` or current timestamp for sitemap lastmod -- use actual data/edit dates."

### High (affects SEO/content quality)

4. **Fix 4 forbidden phrase instances** — "All Insurers" in formulary template (lines 494, 599), "Insurers" in subsidy cliff guide (line 288) and SubsidyCalculator (line 341), "negotiated rates" in methodology page (line 266).

5. **Fix dead links in PlanAuthorityBlock** — `/about/data-methodology` → `/data-methodology`, `/about/editorial-policy` → `/editorial-policy`, `/tools/subsidy-estimator` → `/tools/income-savings-calculator`.

6. **Fix formulary search canonical** — Currently set to `/drugs` (line 92 of `app/formulary/page.tsx`) but page lives at `/formulary`.

7. **Add cross-links**: State hub → formulary, tool pages → guides, formulary → county hubs.

8. **Fix homepage state links** — Change `/states/${state.slug}` to direct canonical URLs to eliminate redirect hop.

9. **Remove 400 lines of dead code** from formulary template (4 unused sub-components).

### Medium (UX improvement)

10. **Add agent CTAs** to dental state, dental plan detail, life events, FAQ detail, and guides pages — these are lead generation opportunities currently missing.

11. **Fix life events FAQ placeholder answers** — All currently say "review the decision tree and timeline sections above" instead of providing real answers.

12. **Replace LLM-sounding phrases** in formulary template — "Coverage alone doesn't tell the full story", "The gap between tiers is bigger than most people expect", "one of the more impactful things to check", etc.

13. **Fix `<img>` tags** on homepage (3 images) and author page (1 image) — should use `next/image` per project rules.

14. **Add missing schemas** — Dental state page (WebPage + FAQ), SBC plan detail (WebPage/Article), tools index (WebPage).

### Low (cleanup)

15. **Fix `grid-cols-3` without responsive prefix** on states page (line 153).

16. **Consolidate two schema systems** — Some pages use `lib/schema`, others use `lib/schema-markup`. Should be one system.

17. **Create guide content** for 2 formulary-linked guides that don't exist: `how-approval-rules-work-for-prescriptions`, `how-deductibles-affect-drug-costs`.

18. **Reduce formulary link equity imbalance** — `/formulary` only has 6 inbound links despite being the site's largest content section. `/rates`, `/dental`, `/life-events` have only 2 each.

---

## Appendix: Component Usage Map

| Component | Files Using It |
|---|---|
| Breadcrumbs | 60 |
| LlmComment | 56 |
| GenericByline | 48 |
| SchemaScript | 36 |
| AeoBlock | 18 |
| SourcesBox | 18 |
| PageFaq | 14 |
| EntityLinkCard | 10 |
| Header | 6 |
| Footer | 3 |
| GlobalCTA | 3 |
| StateFPLCalculator | 3 |
| CarrierFilterBar | 3 |
| PlanComparisonTable | 3 |
| All others | 2 each |
