# SEO Upgrade Report: `/states/[state]` Hub Pages

**Date:** 2026-03-19
**File changed:** `app/states/[state]/page.tsx`
**Scope:** Single file rewrite — no route changes, no other templates touched

---

## PART A — Audit Findings (Before)

### Current Structure

The existing `/states/[state]` template was a thin markdown-driven page:

- H1 from frontmatter title (e.g., "Health Insurance in California: Marketplace Coverage Guide")
- State badge (abbreviation + exchange type)
- "Updated" date line
- AnswerBox (TL;DR = meta description text)
- Markdown body content (~3 short H2 sections, ~150–200 words each)
- 2 FAQs from frontmatter (only California and Texas had more)
- GenericByline (reviewed by licensed professional)
- "Related Resources" box with 7 generic links (identical on every state)
- External CTA button to applyhealthinsuranceonline.com
- SourcesBox with 2 generic sources

### Weak Points Identified

| # | Issue | Impact |
|---|-------|--------|
| 1 | **Thin content** — most states had ~400 words + 2 FAQs | HCU risk, low dwell time |
| 2 | **No county discovery** — no links to county pages despite data for 30 states | Missed internal link equity, poor crawlability |
| 3 | **No state snapshot** — exchange type and Medicaid status buried or missing | Low information density above the fold |
| 4 | **Generic internal links** — same 7 links on every state page, none state-specific | No topical relevance signal per state |
| 5 | **Commercial page link buried** — `/{state}/health-insurance-plans` was one item in a generic list | Weak intent handoff, cannibalizes the commercial page |
| 6 | **Identical metadata pattern** — same title format as commercial pages | Title cannibalization between `/states/[state]` and `/{state}/health-insurance-plans` |
| 7 | **OG type was `article`** — should be `website` for a hub/overview page | Incorrect social signal |
| 8 | **No `og:locale`** | Missing standard OG property |
| 9 | **Schema: Article only** — overlaps with the commercial page schema | No schema differentiation |
| 10 | **No links to subsidy/rates/dental/enhanced-credits pages** — missed all pillar pages | Orphaned pillar pages, weak link graph |
| 11 | **External CTA was primary** — should be secondary to internal plan comparison | Pushes users off-site before they see internal data pages |
| 12 | **Only 18 states have content files** — page only renders for those 18 | Limited coverage (acceptable for now, not changed in this task) |

---

## PART B — Files Changed

| File | Action |
|------|--------|
| `app/states/[state]/page.tsx` | Full rewrite |

No other files were created, modified, or deleted.

---

## PART C — What Was Improved

### Content Structure (thin placeholder → rich informational hub)

The page now renders 10 distinct sections:

| # | Section | Description |
|---|---------|-------------|
| 1 | **Hero / Intro** | State-specific H1 ("Health Insurance in {State}: 2026 Overview"), intro paragraph clarifying informational intent, badge row for state abbr / exchange / Medicaid expansion status |
| 2 | **State Snapshot** | 3-card grid: marketplace type (SBM vs FFM), Medicaid expansion status with context, county data count — all sourced from existing `all-states.json` and `rate_volatility.json` |
| 3 | **What This Page Helps With** | 4-item grid explaining page intent: understanding insurance, reviewing costs/subsidies, finding county data, navigating to plan comparison |
| 4 | **Primary CTA** | Prominent internal link to `/{state}/health-insurance-plans` with clear "compare plans" framing — styled as a primary action block |
| 5 | **Markdown Body** | Existing editorial content preserved as-is (no content changes to markdown files) |
| 6 | **State Resource Grid** | 5 state-specific internal links: plans, subsidies, rates, enhanced credits, dental — each with label and description |
| 7 | **County Discovery** | Responsive grid of up to 24 counties linking to `/{stateSlug}/{countySlug}`, with "view all" overflow link to the commercial page |
| 8 | **FAQ Section** | 6 hub-level informational FAQs merged with existing frontmatter FAQs (8+ total per page) |
| 9 | **Guides & Tools** | 4 contextual links to existing content: subsidies guide, savings calculator, OEP guide, life events |
| 10 | **Secondary CTA** | External enrollment link demoted to bottom position, with inline reference to internal plan comparison page |

### Metadata Improvements

| Property | Before | After |
|----------|--------|-------|
| Title | `{frontmatter title} \| HealthInsuranceRenew` | `Health Insurance in {State} (2026 Guide, Costs, Coverage Options)` |
| Description | Frontmatter description (generic) | `Explore health insurance in {State}, including marketplace coverage options, subsidy resources, premium rates, county-level plan data, and where to compare 2026 plans.` |
| OG type | `article` | `website` |
| OG locale | Missing | `en_US` |
| Canonical | Self-referential (unchanged) | Self-referential (unchanged) |
| Twitter card | `summary_large_image` (unchanged) | `summary_large_image` (unchanged) |

### Schema Improvements

| Schema | Before | After |
|--------|--------|-------|
| `Article` | Present (overlapped with commercial page) | **Removed** |
| `MedicalWebPage` | Not present | **Added** — with Organization reviewedBy, SpeakableSpecification for AI engines |
| `BreadcrumbList` | Present | Present (unchanged) |
| `FAQPage` | 2 FAQs (most states) | 8+ FAQs (frontmatter + hub FAQs) |
| `Person` | Not present | Not present (intentionally excluded) |

MedicalWebPage schema includes:
- `reviewedBy`: Organization ("Licensed Insurance Professionals")
- `publisher`: Organization ("HealthInsuranceRenew")
- `medicalAudience`: "Patient"
- `lastReviewed`: dateModified from frontmatter
- `speakable`: CSS selectors for `h1`, `#state-snapshot`, `#hub-faqs`

### Internal Linking Improvements

| Link Target | Before | After |
|-------------|--------|-------|
| `/{state}/health-insurance-plans` | 1 link in generic list | **3 links**: primary CTA block, resource grid, secondary CTA text |
| `/subsidies/{state}` | Not linked | **Linked** in resource grid |
| `/rates/{state}` | Not linked | **Linked** in resource grid |
| `/enhanced-credits/{state}` | Not linked | **Linked** in resource grid |
| `/dental/{state}` | Not linked | **Linked** in resource grid |
| County pages (`/{state}/{county}`) | Not linked | **Up to 24 county links** in discovery grid |
| `/guides/how-aca-subsidies-work-2026` | Not linked | **Linked** in guides section |
| `/tools/income-savings-calculator` | Generic link text | **Linked** with description in guides section |
| `/guides/open-enrollment-2026` | Not linked | **Linked** in guides section |
| `/life-events` | Not linked | **Linked** in guides section |
| State exchange URL | Not linked | **Linked** in SourcesBox (for SBM states) |

Total internal links added per page: **~35+** (was ~8)

---

## PART D — Intent Separation Check

The goal was to differentiate `/states/[state]` (informational hub) from `/{state}/health-insurance-plans` (commercial comparison).

| Signal | `/states/[state]` (Hub) | `/{state}/health-insurance-plans` (Commercial) |
|--------|------------------------|-----------------------------------------------|
| **H1** | "Health Insurance in {State}: 2026 Overview" | "{State} Health Insurance Plans 2026" |
| **Title tag** | "(2026 Guide, Costs, Coverage Options)" | Includes plan count + carrier count |
| **Meta description** | "Explore health insurance... overview hub" | Premium ranges, plan counts, data-driven |
| **OG type** | `website` | `article` |
| **Primary schema** | `MedicalWebPage` | `Article` + `Dataset` + `FinancialProduct` |
| **Content type** | Educational: how insurance works, Medicaid explainer, subsidy overview | Data tables: plans, premiums, carriers, deductibles, subsidy calculator |
| **Primary CTA** | Internal link → commercial page | Subsidy calculator + external enrollment |
| **County data** | Discovery grid (links only) | Full plan tables, premium data per county |
| **FAQs** | Informational: "How does insurance work in this state?" | Data-driven: "How many plans are available?" |
| **User intent** | Learning, orientation, navigation | Comparison shopping, decision-making |

The two pages now serve clearly different search intents with no overlapping metadata patterns, schema types, or content structure.

---

## PART E — Validation

| Check | Status |
|-------|--------|
| TypeScript compiles (`tsc --noEmit`) | **Pass** — 0 errors |
| Route unchanged | **Confirmed** — `/states/[state]` path and `generateStaticParams` unchanged |
| No personal branding | **Confirmed** — no Dave Lee, NPN, or Elite Circle of Champions references |
| Canonicals preserved | **Confirmed** — self-referential at `https://healthinsurancerenew.com/states/{state}` |
| Metadata upgraded | **Confirmed** — distinct title pattern, unique description, `og:type=website`, `og:locale=en_US` |
| Schema upgraded | **Confirmed** — `MedicalWebPage` + `BreadcrumbList` + `FAQPage`, no `Person` schema |
| Internal links added | **Confirmed** — 5 state resource links + county grid + 4 guides/tools + 3 commercial page links |
| No noindex added | **Confirmed** — pages remain indexable |
| No sitemap changes | **Confirmed** — sitemap behavior untouched |
| No other route types modified | **Confirmed** — only `app/states/[state]/page.tsx` changed |
| Brand-neutral / sellable | **Confirmed** — Organization-only trust signals, generic reviewer byline |

---

## Data Sources Used (No Invented Facts)

All state snapshot data is derived from existing repo data:

- **Exchange type and name** — `data/config/all-states.json` (`exchange`, `ownExchange`)
- **Medicaid expansion status** — `data/config/all-states.json` (`medicaidExpanded`)
- **County count and names** — `data/config/county-names.json` + `rate_volatility.json` via `getAllStateCountyCombos()`
- **County slugs for links** — `lib/county-lookup.ts` (`getCountySlug`, `getCountyName`, `stateCodeToSlug`)

No statistics, cost claims, or state-specific facts were fabricated.
