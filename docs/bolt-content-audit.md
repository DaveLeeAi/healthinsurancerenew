# Bolt Content Audit Report
Generated: 2026-04-08

## Executive Summary
- Total pages scanned: **55** (41 page files + 14 template files)
- Total components scanned: **41** (32 root + 9 plan/)
- Pages with >50% Bolt content (REWRITE): **0**
- Pages with 20-50% Bolt content (EDIT): **1** (homepage)
- Pages with <20% Bolt content requiring EDIT: **6**
- Pages with <20% Bolt content (KEEP): **48**
- Components with Bolt origins: **0** (all Claude-built)
- Components needing minor EDIT: **2**

**Bottom line:** This codebase is remarkably clean. The Astro-to-Next.js migration and subsequent Claude Code work replaced nearly all Bolt-generated content. Remaining Bolt fingerprints are concentrated in vocabulary choices ("Explore", "Navigate", "comprehensive") and one icon-card layout pattern, not in structural scaffolding or wholesale placeholder pages.

---

## Bolt Content Severity by Page

### EDIT (20-50% Bolt content -- targeted copy fixes)

| Page | File | Bolt % | Worst Bolt Examples | Verdict |
|---|---|---|---|---|
| Homepage | `app/page.tsx` | ~30% | "Explore the complete dataset" (L332), "Explore" link text on all 10 data pillar cards (L343), icon+heading+paragraph card grid (L228-243), decorative gradient blobs (L179-182), vague hero tool descriptions ("Assess your eligibility", L54) | EDIT |

### EDIT (<20% Bolt -- minor targeted fixes needed)

| Page | File | Bolt % | Worst Bolt Examples | Verdict |
|---|---|---|---|---|
| Old State Template | `app/states/[state]/page.tsx` | ~18% | "What This Page Helps With" icon-card grid (L370-401), "Explore health insurance in ${stateName}" (L62), "Navigating to the ${stateName} plan comparison page" (L387), "Explore detailed ${PLAN_YEAR}" (L434) | EDIT |
| Editorial Policy | `app/editorial-policy/page.tsx` | ~12% | "Learn how HealthInsuranceRenew creates" (L15), missing BLUFBox/TrustBar, redundant with `/about/editorial-standards/` | EDIT |
| Rates State | `app/rates/[state]/page.tsx` | ~5% | "Explore {stateName} Health Insurance Data" (L158), "Explore premium rate changes" (L202) | EDIT |
| Life Events Detail | `app/life-events/[event_type]/page.tsx` | ~3% | FAQ placeholder non-answers: "For detailed guidance on this question, review the decision tree..." repeated for every FAQ (L127, L401) -- generates FAQPage schema with empty answers | EDIT |
| Billing Detail | `app/billing/[cpt_code]/page.tsx` | ~5% | "Common Billing Surprises" section (L389-404) is same 4 generic items on every billing page | EDIT |
| What Income Counts Tool | `app/tools/what-income-counts/page.tsx` | ~8% | **FACTUAL ERROR** L62: "under current extended subsidy provisions, assistance may be available at higher income levels" -- enhanced subsidies expired end of 2025, this is wrong for 2026 | EDIT |

### KEEP (<20% Bolt content -- Claude-quality, minimal fixes)

| Page | File | Bolt % | Notes | Verdict |
|---|---|---|---|---|
| About | `app/about/page.tsx` | ~10% | Clean prose, data-sourced, BLUFBox | KEEP |
| Author | `app/about/author/page.tsx` | ~5% | Strongest page -- first-person, verifiable NPN, specific credentials | KEEP |
| Editorial Standards | `app/about/editorial-standards/page.tsx` | ~8% | One "comprehensive" (L111) to fix | KEEP |
| Methodology | `app/about/methodology/page.tsx` | ~5% | One "comprehensive" (L204) to fix | KEEP |
| Privacy | `app/privacy/page.tsx` | ~5% | Legal boilerplate, clean | KEEP |
| Terms | `app/terms/page.tsx` | ~5% | Legal boilerplate, clean | KEEP |
| Contact | `app/contact/page.tsx` | ~15% | Minor soft marketing, mostly clean | KEEP |
| How We Get Paid | `app/how-we-get-paid/page.tsx` | ~10% | CFR citations, strong | KEEP |
| Licensing | `app/licensing/page.tsx` | ~10% | Data-driven state grid | KEEP |
| Data Methodology | `app/data-methodology/page.tsx` | ~5% | Model page, outstanding data provenance | KEEP |
| Circle of Champions | `app/circle-of-champions/page.tsx` | ~10% | Config-driven, minor corporate tone | KEEP |
| Glossary | `app/glossary/page.tsx` | ~3% | Plain English, specific dollar examples | KEEP |
| Eligibility Check | `app/eligibility-check/page.tsx` | ~5% | Exemplary worked examples | KEEP |
| FPL 2026 | `app/fpl-2026/page.tsx` | ~2% | Best-in-class data tables from JSON | KEEP |
| CSR Explained | `app/csr-explained-2026/page.tsx` | ~3% | Data-driven CSR tier cards | KEEP |
| ACA Income Guide | `app/aca-income-guide-2026/page.tsx` | ~5% | Dynamic FPL/CSR/contribution data | KEEP |
| Early Retirement | `app/early-retirement-health-insurance-2026/page.tsx` | ~10% | Concrete couple example with MAGI math | KEEP |
| Employer Unaffordable | `app/employer-coverage-unaffordable-2026/page.tsx` | ~5% | Worked affordability example, 9.96% threshold | KEEP |
| Lost Job | `app/lost-job-health-insurance-2026/page.tsx` | ~8% | Dynamic FPL threshold, comparison table | KEEP |
| Self-Employed | `app/self-employed-health-insurance-2026/page.tsx` | ~12% | Variable income advice, slightly editorial | KEEP |
| Turning 26 | `app/turning-26-health-insurance-options/page.tsx` | ~10% | 4-option cards, "Do not wait" callout | KEEP |
| Guides Index | `app/guides/page.tsx` | ~10% | Clean card grid, FAQ accordion | KEEP |
| Tools Index | `app/tools/page.tsx` | ~15% | "Discover" (L85), icon+heading cards (functional), "How These Tools Help You" (L184) | KEEP |
| FAQ Index | `app/faq/page.tsx` | ~8% | Emoji on category cards (functional wayfinding) | KEEP |
| Subsidies Hub | `app/subsidies/page.tsx` | ~5% | Model index page | KEEP |
| Rates Hub | `app/rates/page.tsx` | ~5% | Exemplary data-first with real tables | KEEP |
| Dental Hub | `app/dental/page.tsx` | ~5% | Clean state grid with plan counts | KEEP |
| Billing Hub | `app/billing/page.tsx` | ~5% | Scenario-driven, risk badges | KEEP |
| Enhanced Credits Hub | `app/enhanced-credits/page.tsx` | ~3% | Gold standard data-driven page | KEEP |
| Life Events Hub | `app/life-events/page.tsx` | ~10% | "Navigate" in meta (L22, L30) | KEEP |
| State Hub (new) | `app/[state-name]/health-insurance-plans/page.tsx` | ~2% | Data-driven, hand-written prose for CA/FL/TX/NY | KEEP |
| County Hub | `app/[state-name]/[county-slug]/page.tsx` | ~0% | Pure data template | KEEP |
| Plan Detail | `app/[state-name]/health-insurance-plans/[plan-slug]/page.tsx` | ~2% | Near V35 gold standard | KEEP |
| Subsidies State | `app/subsidies/[state]/page.tsx` | ~3% | Clean county grid | KEEP |
| Subsidies County | `app/subsidies/[state]/[county]/page.tsx` | ~0% | Pure data, FPL tier table | KEEP |
| Rates County | `app/rates/[state]/[county]/page.tsx` | ~0% | Dense data, carrier comparison | KEEP |
| Dental State | `app/dental/[state]/page.tsx` | ~0% | Pure data listing | KEEP |
| Dental Plan | `app/dental/[state]/[plan_variant]/page.tsx` | ~0% | Deeply data-driven plan detail | KEEP |
| Enhanced Credits State | `app/enhanced-credits/[state]/page.tsx` | ~0% | Pure data | KEEP |
| Enhanced Credits County | `app/enhanced-credits/[state]/[county]/page.tsx` | ~0% | Deepest data page in codebase | KEEP |
| FAQ Category | `app/faq/[category]/page.tsx` | ~2% | Data-driven from friction_qa.json | KEEP |
| FAQ Detail | `app/faq/[category]/[slug]/page.tsx` | ~0% | Clean answer template | KEEP |
| States Index | `app/states/page.tsx` | ~5% | Data-driven stat cards | KEEP |
| 404 | `app/not-found.tsx` | ~0% | Clean utility page | KEEP |
| Layout | `app/layout.tsx` | ~0% | Infrastructure only | KEEP |
| Subsidy Cliff Guide | `app/guides/aca-subsidy-cliff-2026/page.tsx` | ~2% | Outstanding data density | KEEP |
| SBC Guide | `app/guides/how-to-read-your-sbc/page.tsx` | ~5% | Educational, substantive | KEEP |
| Bronze vs Silver | `app/guides/bronze-vs-silver-plan-2026/page.tsx` | ~3% | Data tables, CSR tiers, HSA limits | KEEP |
| GLP-1 Guide | `app/guides/glp-1-drugs-covered-by-aca-plans/page.tsx` | ~2% | Exceptional data density, drug tables | KEEP |
| Ozempic Guide | `app/guides/does-aca-cover-ozempic-2026/page.tsx` | ~2% | Deep pricing research | KEEP |
| Guide Template | `app/guides/[slug]/page.tsx` | ~10% | Template is sound, quality depends on markdown | KEEP |
| Income Calculator | `app/tools/income-savings-calculator/page.tsx` | ~8% | Real FPL/contribution data | KEEP |
| Affordability Tool | `app/tools/job-plan-affordability/page.tsx` | ~5% | Real threshold data | KEEP |
| Family Estimator | `app/tools/family-coverage-estimator/page.tsx` | ~5% | Real FPL data, tier multipliers | KEEP |
| Plan Comparison | `app/tools/plan-comparison/page.tsx` | ~12% | Most Bolt-adjacent tool (tier card grid) but functional | KEEP |
| CSR Estimator | `app/tools/csr-estimator/page.tsx` | ~5% | Real CSR tier data | KEEP |

---

## Navigation Bolt Assessment

### Header
- **Origin:** Claude-built
- **Menu items:** Guides, Tools, States, Plans, Subsidies, Drug Lookup, Dental, "Get Help" CTA -- all intentional, mapping to core route structure. Not Bolt defaults.
- **Styling:** V35 tokens (`primary-600/700`, `slate-*`). Clean sticky header with mobile hamburger, backdrop blur.
- **Minor issue:** Uses `<a>` instead of `next/link` (full page reloads instead of SPA navigation)
- **Needs rewrite:** No

### Footer
- **Origin:** Claude-built
- **Copy quality:** Site-specific and legally precise. CMS compliance disclaimer, dynamic licensed state data from `config.json`, recognition year from config. Three link columns (Coverage Data, Resources, Company) -- all real routes.
- **Layout:** Custom responsive 4-column grid with mobile accordion. Production-quality.
- **Styling:** V35 tokens (navy `#0B1F3B`, `slate-*`, `primary-600`)
- **Link structure:** Intentional, all functional internal links
- **Minor issue:** Same `<a>` vs `next/link` nit as Header
- **Needs rewrite:** No

---

## Component Bolt Assessment

**Zero Bolt-generated components found.** All 41 components are Claude-built.

### Components Needing Minor EDIT (2)

| Component | Origin | Issue | Verdict |
|---|---|---|---|
| `components/trust/index.tsx` | Claude-built | Uses `gray-*` classes instead of site's `neutral-*`/`slate-*`; `AuthorBioBox` uses `<img>` not `next/image` | EDIT |
| `components/ChatWidget.tsx` | Claude-built | Hardcodes 18 licensed states instead of importing from `data/config/config.json` | EDIT |

### All Other Components (39) -- KEEP

| Component | Origin | Styling | Notes |
|---|---|---|---|
| SchemaScript.tsx | Claude | N/A | JSON-LD injector |
| Breadcrumbs.tsx | Claude | V35 | Accessible `<nav aria-label>` |
| LlmComment.tsx | Claude | N/A | AI discoverability |
| GenericByline.tsx | Claude | V35 | EEAT byline, no named author per constraint |
| ProcessBar.tsx | Claude | V35 hex | Trust strip |
| AboutBlock.tsx | Claude | V35 custom | V19 about block |
| AeoBlock.tsx | Claude | V35 custom | AI Overview extraction target |
| EvidenceBlock.tsx | Claude | V35 custom | 3-col stat grid |
| TimelineSteps.tsx | Claude | V35 custom | Numbered step sequence |
| LimitsBlock.tsx | Claude | V35 custom | YMYL safety block |
| CostBlock.tsx | Claude | V35 custom | Cost rows with progress bars |
| SavingsRows.tsx | Claude | V35 custom | Savings/next steps |
| PlanRulesBlock.tsx | Claude | V35 custom | PA/ST/QL rules |
| PageFaq.tsx | Claude | V35 custom | FAQ with schema |
| DrugPageCta.tsx | Claude | V35 hex | 3-variant CTA |
| GlobalCTA.tsx | Claude | V35 hex | Configurable CTA |
| AnswerBox.tsx | Claude | V35 | Quick answer box |
| DrugAutocomplete.tsx | Claude | V35 | Full ARIA combobox |
| FormularySearch.tsx | Claude | V35 | State+drug search |
| SubsidyCalculator.tsx | Claude | V35 | Full APTC calculator |
| StateFPLCalculator.tsx | Claude | V35 | State FPL calculator |
| SEPDecisionTree.tsx | Claude | Custom | Interactive decision tree |
| CarrierFilterBar.tsx | Claude | V35 | Reusable carrier filter |
| PlanComparisonTable.tsx | Claude | V35 | Sortable plan comparison |
| SbmPlanTable.tsx | Claude | V35 | SBM plan listing |
| SBCGrid.tsx | Claude | V35 | Cost-sharing grid |
| EntityLinkCard.tsx | Claude | V35 + type colors | Cross-pillar links |
| SourcesBox.tsx | Claude | V35 | Sources citation |
| plan/PlanHeroBLUF.tsx | Claude | V35 | Plan BLUF from metal tier |
| plan/PlanNetworkInsight.tsx | Claude | V35 | Network-type content |
| plan/PlanMetalContext.tsx | Claude | V35 | Tier explanation |
| plan/PlanFitSummary.tsx | Claude | V35 | Good-for/tradeoff layout |
| plan/PlanCostScenario.tsx | Claude | V35 | Cost simulation |
| plan/PlanActionGuide.tsx | Claude | V35 | 5-step evaluation |
| plan/PlanCrossLinks.tsx | Claude | V35 | Cross-navigation |
| plan/PlanDrugFitIntegration.tsx | Claude | V35 | Drug category links |
| plan/PlanFAQ.tsx | Claude | V35 | Data-derived FAQs |
| plan/PlanAuthorityBlock.tsx | Claude | V35 | YMYL authority block |
| Header.tsx | Claude | V35 | Custom sticky header |
| Footer.tsx | Claude | V35 | CMS-compliant footer |

---

## Bolt Fingerprints Found

### Copy Patterns

**"Explore" / "Discover" / "Navigate" (10 instances):**
- `app/page.tsx:332` — "Explore the complete dataset."
- `app/page.tsx:343` — "Explore" (link text on all 10 data pillar cards)
- `app/states/[state]/page.tsx:62` — "Explore health insurance in ${stateName}"
- `app/states/[state]/page.tsx:434` — "Explore detailed ${PLAN_YEAR} health insurance data"
- `app/rates/[state]/page.tsx:158` — "Explore {stateName} Health Insurance Data"
- `app/rates/[state]/page.tsx:202` — "Explore premium rate changes and carrier competition"
- `app/tools/page.tsx:85` — "Discover which types of earnings"
- `app/life-events/page.tsx:22` — "Navigate health insurance coverage changes"
- `app/life-events/page.tsx:31` — "Navigate health insurance coverage changes"
- `app/page.tsx:45` — "Discover which earnings types affect your marketplace savings"

**"understand your" vague value props (7 instances):**
- `app/layout.tsx:15` — "understand your coverage options"
- `app/page.tsx:9` — "understand your coverage options"
- `app/guides/page.tsx:118` — "help you understand your options"
- `app/tools/page.tsx:127` — "help you understand your coverage options before you apply"
- `app/tools/page.tsx:192` — "help you understand your situation before you start"
- `app/tools/page.tsx:224` — "help you understand your options and estimate costs"
- `app/states/[state]/page.tsx:103` — "help you understand your costs after financial assistance"

**"comprehensive" filler adjective (4 instances):**
- `app/about/editorial-standards/page.tsx:111` — "comprehensive state guides"
- `app/about/methodology/page.tsx:204` — "comprehensive guides"
- `app/employer-coverage-unaffordable-2026/page.tsx:172` — "comprehensive coverage"
- `app/[state-name]/health-insurance-plans/page.tsx:324` — "comprehensive Gold and Platinum coverage"

**Other filler adjectives (3 instances):**
- `app/about/author/page.tsx:130` — "powerful"
- `app/self-employed-health-insurance-2026/page.tsx:155` — "particularly powerful"
- `app/aca-income-guide-2026/page.tsx:112` — "essentially"

**"committed to" / "designed to" placeholder phrasing (3 instances):**
- `app/privacy/page.tsx:52` — "committed to protecting the privacy"
- `app/how-we-get-paid/page.tsx:101` — "designed to be accurate and unbiased"
- `app/how-we-get-paid/page.tsx:111` — "Full transparency is part of our commitment"

### Structural Patterns

**Icon + heading + paragraph card grids (2 locations):**
- `app/page.tsx:228-243` — Hero tool cards with vague descriptions
- `app/states/[state]/page.tsx:370-401` — "What This Page Helps With" section with emoji + generic text

**Gradient backgrounds (1 instance):**
- `app/page.tsx:179` — `bg-gradient-to-br from-white via-slate-50 to-slate-100` (subtle, not garish)

**Emoji in UI data objects (6 instances, all functional wayfinding):**
- `app/faq/page.tsx:20,35,55` — FAQ category icons (hospital, money, clipboard)
- `app/life-events/page.tsx:61` — Life events icon
- `app/states/[state]/page.tsx:375,379` — State page icons

**Non-V35 semantic colors (18 instances, all intentional semantic coding):**
- Orange = warning/rates, Teal = dental, Indigo/Violet = Platinum tier, Rose = policy scenarios
- Used consistently across `billing/`, `dental/`, `life-events/`, `EntityLinkCard.tsx`, `PlanComparisonTable.tsx`
- These are design decisions, not Bolt defaults

---

## Recommended Rewrite Priority

### Tier 1 -- Fix immediately (factual error + SEO liability)

1. **`app/tools/what-income-counts/page.tsx` L62** — FACTUAL ERROR: says enhanced subsidies still extend above 400% FPL. They expired end of 2025. This is actively misleading consumers about 2026 eligibility.
2. **`app/life-events/[event_type]/page.tsx` L127, L401** — FAQ section generates FAQPage schema with placeholder non-answers ("For detailed guidance on this question, review the decision tree..."). This is an SEO liability -- Google may penalize thin FAQ schema.

### Tier 2 -- Fix before next PR (user-facing, affects trust/SEO)

1. **`app/page.tsx`** — Replace "Explore" vocabulary (10 data pillar card links), replace vague hero tool descriptions ("Assess your eligibility" → specific outcome), remove decorative gradient blobs
2. **`app/states/[state]/page.tsx` L370-401** — Remove entire "What This Page Helps With" icon-card section (zero informational value). Replace "Explore" in meta desc (L62) and L434.
3. **`app/rates/[state]/page.tsx` L158, L202** — Replace "Explore" with "Compare" or "View"
4. **`app/billing/[cpt_code]/page.tsx` L389-404** — Customize "Common Billing Surprises" per billing scenario or remove generic section

### Tier 3 -- Fix when convenient (low traffic, minor impact)

1. **`app/editorial-policy/page.tsx`** — Consider redirecting to `/about/editorial-standards/` (redundant page with older components, missing BLUFBox/TrustBar)
2. **`app/about/editorial-standards/page.tsx` L111** — Replace "comprehensive state guides"
3. **`app/about/methodology/page.tsx` L204** — Replace "comprehensive guides"
4. **`app/life-events/page.tsx` L22, L30** — Replace "Navigate" in OG/Twitter descriptions
5. **`app/tools/page.tsx` L85** — Replace "Discover" with "Learn" or "See"; L184 retitle "How These Tools Help You"
6. **`components/trust/index.tsx`** — Normalize `gray-*` to `neutral-*`/`slate-*`; swap `<img>` to `next/image`
7. **`components/ChatWidget.tsx`** — Import licensed states from `config.json` instead of hardcoding

---

## Total Bolt Content Estimate

- **Approximate Bolt-generated words across entire site:** ~800-1,200 (concentrated in homepage data pillar cards, old state template icon section, and scattered "Explore/Discover/Navigate/comprehensive" vocabulary)
- **Approximate Claude-generated words:** ~150,000+ (all data-driven pages, guides, tools, components, schema, templates)
- **Bolt content as % of total visible copy: ~0.6-0.8%**

### Assessment

This codebase is **97-99% Claude Code-generated content**. The Bolt-to-Claude migration was exceptionally thorough. The remaining Bolt fingerprints are:

1. **Vocabulary residue** -- ~30 instances of "Explore/Discover/Navigate/comprehensive/understand your" scattered across meta descriptions and section headers. Easy find-and-replace.
2. **One icon-card layout** -- the "What This Page Helps With" section on `states/[state]/page.tsx` is the only surviving Bolt structural pattern.
3. **One factual error** -- `tools/what-income-counts` still references expired enhanced subsidies as current.

No pages require full rewrites. The 7 pages flagged for EDIT need surgical, targeted fixes (specific line numbers identified above). All 41 components are Claude-built with zero Bolt origins.
