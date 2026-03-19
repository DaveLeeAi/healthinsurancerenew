# HEALTHINSURANCERENEW.COM — SEO PRODUCTION READINESS AUDIT

**Date:** March 19, 2026 | **Auditor:** Claude Opus 4.6 | **Repo:** healthinsurancerenew (Next.js 14 App Router)

---

## Table of Contents

- [Part 1 — Page Inventory](#part-1--page-inventory)
- [Part 2 — Critical SEO Risks (Top 20)](#part-2--critical-seo-risks-top-20)
- [Part 3 — Canonical Map](#part-3--canonical-map)
- [Part 4 — Internal Linking Audit](#part-4--internal-linking-audit)
- [Part 5 — Metadata / Schema Audit](#part-5--metadata--schema-audit)
- [Part 6 — Production Readiness](#part-6--production-readiness)
- [Part 7 — Implementation Plan](#part-7--implementation-plan)
- [Phase A Implementation Summary](#phase-a-implementation-summary)

---

## Part 1 — Page Inventory

### Estimated Page Counts by Route Class

| Route Class | Est. Pages | In Sitemap? | Notes |
|---|---|---|---|
| **Static core pages** (home, about, contact, tools, trust) | 36 | 36 | All in `/sitemaps/static` |
| **Guides** (`/guides/[slug]`) | 11 | 11 | Markdown-driven |
| **State overviews** (`/states/[state]`) | 18 | 18 | Thin — ~200 words each |
| **State plan hubs** (`/[state]/health-insurance-plans`) | ~30 | **0 → FIXED** | **Were NOT IN SITEMAP — now added** |
| **State plan details** (`/[state]/health-insurance-plans/[slug]`) | ~4,044 | **0** | **NOT IN SITEMAP** |
| **County plan pages** (`/[state]/[county]`) | ~1,990 | ~1,990 | In `/sitemaps/plans` |
| **County plan detail / SBC** (`/[state]/[county]/[plan]-plan`) | ~20,354 | ~20,354 | In `/sitemaps/sbc` |
| **Subsidy state indexes** (`/subsidies/[state]`) | ~30 | **0 → FIXED** | **Were NOT IN SITEMAP — now added** |
| **Subsidy county pages** (`/subsidies/[state]/[county]`) | ~1,990 | ~1,990 | In `/sitemaps/subsidies` |
| **Rate state indexes** (`/rates/[state]`) | ~30 | **0 → FIXED** | **Were NOT IN SITEMAP — now added** |
| **Rate county pages** (`/rates/[state]/[county]`) | ~1,990 | ~1,990 | In `/sitemaps/rates` |
| **Enhanced credit state indexes** (`/enhanced-credits/[state]`) | ~30 | **0 → FIXED** | **Were NOT IN SITEMAP — now added** |
| **Enhanced credit county** (`/enhanced-credits/[state]/[county]`) | ~1,990 | ~1,990 | In `/sitemaps/enhanced-credits` |
| **Dental state indexes** (`/dental/[state]`) | ~30 | **0 → FIXED** | **Were NOT IN SITEMAP — now added** |
| **Dental plan pages** (`/dental/[state]/[variant]`) | ~1,389 | ~1,389 | In `/sitemaps/dental` |
| **FAQ category pages** (`/faq/[category]`) | 9 | **0 → FIXED** | **Were NOT IN SITEMAP — now added** |
| **FAQ individual** (`/faq/[category]/[slug]`) | 54 | 54 | In `/sitemaps/faq` |
| **Billing category pages** | ~20 | ~20 | In `/sitemaps/billing` |
| **Life event pages** | 8 | 8 | In `/sitemaps/life-events` |
| **Formulary seed** (`/formulary/[issuer]/[drug]`) | 400 in sitemap | 400 | 20 issuers x 20 drugs |
| **Formulary renderable** (all combos) | ~50,000+ | **NOT sitemapped** | On-demand ISR, discoverable only via links |
| **Drug seed** (`/drugs/[state]/[county]/[drug]`) | 500 in sitemap | 500 | 50 counties x 10 drugs |
| **Drug categories** (`/drugs/categories/[cat]`) | ~15 | **0 → FIXED** | **Were NOT IN SITEMAP — now added** |
| **Drug comparisons** (`/drugs/compare/[comp]`) | ~15 | **0 → FIXED** | **Were NOT IN SITEMAP — now added** |
| **Redirect-only pages** (plans/[s]/[c], plan-details, etc.) | ~4,000+ | 0 | Correctly excluded |

### Summary

| Category | Count |
|---|---|
| **Total in sitemap (before fix)** | ~34,800 |
| **New URLs added by Phase A fix** | ~189 |
| **Total in sitemap (after fix)** | ~34,989 |
| **Renderable but NOT in sitemap** | ~4,044 (state plan details) + ~50,000 (formulary long-tail) |
| **Should be noindex** | 0 currently; recommend ~18 (thin state overview pages) |
| **Should be 301 redirected** | Already handled for legacy routes |
| **Should be removed** | 0 |

---

## Part 2 — Critical SEO Risks (Top 20)

### 1. State plan hub pages missing from sitemap
**Severity: CRITICAL** ✅ **FIXED**
**Files:** `app/sitemaps/[type]/route.ts` — no builder for `/{state}/health-insurance-plans`
**Why:** These ~30 pages are your highest-value, most content-rich pages (1,000+ lines, subsidy calculator, plan data tables, 5+ FAQs, 300+ words of prose). Google has no sitemap signal to discover or prioritize them. They may only be found via crawling from `/states/[state]` links.
**Fix:** Added a `buildPlanEntries()` state hub builder to the sitemap handler with priority 0.9.

### 2. State-level index pages missing from sitemap (subsidies, rates, enhanced-credits, dental)
**Severity: CRITICAL** ✅ **FIXED**
**Files:** `app/sitemaps/[type]/route.ts`
**Why:** ~120 state-level index pages serve as navigation hubs and have unique metadata. Without sitemap entries, Google only finds them via internal links. These aggregate county data and serve state-level queries.
**Fix:** Added state-level entries to each respective sitemap builder.

### 3. Six tool pages missing canonical tags
**Severity: HIGH** ✅ **Already resolved**
**Files:** `app/tools/income-savings-calculator/page.tsx`, `app/tools/plan-comparison/page.tsx`, `app/tools/csr-estimator/page.tsx`, `app/tools/job-plan-affordability/page.tsx`, `app/tools/what-income-counts/page.tsx`, `app/tools/family-coverage-estimator/page.tsx`
**Why:** Without explicit canonical, Next.js uses the request URL (which may include query params or trailing slashes). Tools pages are high-intent — inconsistent canonical signals waste crawl equity.
**Finding:** All 6 tool pages already have canonical tags in their `layout.tsx` files.

### 4. `lastmod` always set to today's date
**Severity: HIGH** ✅ **FIXED**
**Files:** `app/sitemaps/[type]/route.ts:58` — `const lastmod = new Date().toISOString().slice(0, 10)`
**Why:** Every sitemap request returned today's date as lastmod for ALL ~34,800 URLs. Google will learn to ignore this signal. If you later make real content changes, Google won't trust the lastmod timestamp to prioritize recrawling.
**Fix:** Replaced with honest constants: `DATA_LASTMOD = '2026-03-17'` for data-driven pages, `STATIC_LASTMOD = '2026-03-15'` for editorial content.

### 5. Dual robots.txt files — route handler + static file
**Severity: HIGH** ✅ **FIXED**
**Files:** `app/robots.txt/route.ts` AND `public/robots.txt`
**Why:** Next.js serves the route handler over the static file, but this is a maintenance trap. The static file contained 14 LLM crawler allow rules + llms.txt pointer that were being silently ignored.
**Fix:** Merged all LLM crawler rules into the route handler and deleted `public/robots.txt`.

### 6. Thin state overview pages (`/states/[state]`) — fully indexed
**Severity: HIGH**
**Files:** `content/states/*.md` (~200 words each), `app/states/[state]/page.tsx`
**Why:** 18 state markdown pages with ~200 words of generic content compete with the data-rich `/{state}/health-insurance-plans` pages for the same "[state] health insurance" queries. This is intent cannibalization. The thin pages dilute ranking signals.
**Fix:** Either beef up the markdown to 600+ words with unique state data, or set `/states/[state]` to noindex and use them as navigation-only pages that funnel to the canonical state plan hub.

### 7. OG locale inconsistency
**Severity: MEDIUM**
**Files:** `app/about/page.tsx`, `app/contact/page.tsx`, `app/glossary/page.tsx` (and likely other early pages)
**Why:** Some pages set `og:locale: 'en_US'`, others omit it. While the root layout sets global OG, page-level metadata objects may override partially. Inconsistency weakens entity signals.
**Fix:** Add `locale: 'en_US'` to all page-level OG metadata.

### 8. OG type inconsistency
**Severity: MEDIUM**
**Files:** `app/dental/page.tsx` (`article`), `app/glossary/page.tsx` (`article`), vs most others (`website`)
**Why:** Index/hub pages should use `og:type: website`. Only individual content pages (guides, FAQ entries, articles) should use `article`.
**Fix:** Standardize: index pages = `website`, individual content = `article`.

### 9. FAQ category pages missing from sitemap
**Severity: MEDIUM** ✅ **FIXED**
**Files:** `app/sitemaps/[type]/route.ts` — `buildFaqEntries()` only included individual FAQ slugs, not `/faq/[category]`
**Why:** 9 FAQ category hub pages aggregate related Q&As. Without sitemap inclusion, Google discovers them only via links.
**Fix:** Added category-level entries to the FAQ sitemap builder.

### 10. Font loading via external CSS link instead of `next/font`
**Severity: MEDIUM**
**Files:** `app/layout.tsx:42-45` — `fonts.googleapis.com` link tag
**Why:** External font stylesheet is render-blocking. `next/font/google` would inline critical CSS and self-host fonts, improving LCP by 100-300ms.
**Fix:** Migrate to `next/font/google` for Public Sans and Lora.

### 11. MedicalWebPage schema built but never used
**Severity: MEDIUM**
**Files:** `lib/schema-markup.ts` — `buildMedicalWebPageSchema()` exists unused
**Why:** For a YMYL health insurance site, `MedicalWebPage` with `reviewedBy` signals are strong trust signals for Google and AI engines. The function is built — it just needs to be called on pillar pages.
**Fix:** Add `MedicalWebPage` schema to key pages: subsidy, rates, dental, formulary, enhanced-credits, and all state plan hub pages.

### 12. SpeakableSpecification only on homepage
**Severity: MEDIUM**
**Files:** `app/page.tsx:138-152` — only homepage has `speakable`
**Why:** AI engines (Google AI Overview, Perplexity, ChatGPT) use Speakable to identify extractable content. Your most data-rich pages (formulary, subsidy, county plans) don't signal which content is speakable.
**Fix:** Add `SpeakableSpecification` to FAQ, formulary, subsidy, and guide pages targeting key H2 sections.

### 13. SearchAction targets query-param URL (`/formulary?q=`)
**Severity: LOW**
**Files:** `app/page.tsx:82` — `urlTemplate: '.../formulary?q={search_term_string}'`
**Why:** Google Sitelinks Search Box expects a clean search results page. If `/formulary?q=metformin` doesn't render a proper search results page, Google may ignore or penalize the SearchAction.
**Fix:** Verify that `/formulary?q=` actually renders search results. If it just filters the formulary index, this is fine. If not, consider removing SearchAction.

### 14. Drug pages (`/drugs/[state]/[county]/[drug]`) missing canonical
**Severity: MEDIUM**
**Files:** `app/drugs/[state]/[county]/[drug]/page.tsx`
**Why:** No explicit canonical set. These county-specific drug pages could theoretically have URL variants.
**Fix:** Add canonical tag.

### 15. Drug category and comparison pages missing from sitemap
**Severity: LOW** ✅ **FIXED**
**Files:** `app/sitemaps/[type]/route.ts` — `buildDrugEntries()` only built state/county/drug combos
**Why:** `/drugs/categories/[category]` and `/drugs/compare/[comparison]` are unique content pages not in any sitemap.
**Fix:** Added these to the drugs sitemap builder.

### 16. `images.unoptimized: true` in next.config
**Severity: LOW**
**Files:** `next.config.js:3`
**Why:** Bypasses Next.js image optimization (resizing, WebP conversion, lazy-loading). If hero images aren't already optimized, this hurts LCP/CWV.
**Fix:** Only an issue if images are served unoptimized. Verify hero images are pre-optimized WebP at correct sizes.

### 17. No `hreflang` tag
**Severity: LOW**
**Why:** The site targets US-only audiences. `hreflang="en-US"` is helpful for signal clarity but not critical when there's no multilingual content.
**Fix:** Add `<html lang="en">` already present. Consider `hreflang` in sitemap for completeness.

### 18. Header nav missing key high-value links
**Severity: MEDIUM**
**Files:** `components/Header.tsx:5-13`
**Why:** Header links to: Guides, Tools, States, Plans, Subsidies, Drug Lookup, Dental. Missing: Enhanced Credits, Billing, Life Events, FAQ, Rates. These pages receive no top-nav authority signal.
**Fix:** Not all 14 pillars need header space. But consider adding "More" dropdown for secondary pillars or ensuring Footer adequately covers them (Footer does cover all — good).

### 19. Homepage doesn't directly link to county-level pages
**Severity: LOW**
**Why:** Homepage links to state pages, pillar index pages, guides, and tools. But the ~1,990 county plan pages — which are the primary landing pages for "[county] health insurance" queries — receive no direct homepage link equity.
**Fix:** This is by design (hub-and-spoke). State pages link to counties. No fix needed, but consider a "Popular counties" section on homepage for top-traffic counties.

### 20. `changefreq: 'yearly'` on data pages that update annually
**Severity: LOW**
**Files:** `app/sitemaps/[type]/route.ts` — SBC, dental, formulary, enhanced-credits
**Why:** While technically accurate (data updates annually), `monthly` signals freshness to Google. The `revalidate: 86400` ISR already handles actual recrawl freshness.
**Fix:** Change to `monthly` for data pages to encourage crawling.

---

## Part 3 — Canonical Map

| Route Class | URL Pattern | Index? | In Sitemap? | Canonical | Redirect Logic |
|---|---|---|---|---|---|
| **Homepage** | `/` | Yes | Yes (static) | Self | — |
| **Guides index** | `/guides` | Yes | Yes (static) | Self | — |
| **Guide pages** | `/guides/[slug]` | Yes | Yes (guides) | Self | — |
| **State overviews** | `/states/[state]` | **Recommend noindex** | Yes (states) | Self | Consider removing from sitemap |
| **State plan hubs** | `/[state]/health-insurance-plans` | Yes | **Yes (FIXED)** | Self | `/plans/[state]` → 301 here |
| **State plan details** | `/[state]/health-insurance-plans/[slug]` | Yes | **Not yet** | Self | — |
| **County plan index** | `/[state]/[county]` | Yes | Yes (plans) | Self | `/plans/[state]/[county]` → 301 here |
| **Plan SBC detail** | `/[state]/[county]/[plan]-plan` | Yes | Yes (sbc) | Self | `/plan-details/[id]/[slug]` → 301 here |
| **Subsidy state** | `/subsidies/[state]` | Yes | **Yes (FIXED)** | Self | — |
| **Subsidy county** | `/subsidies/[state]/[county]` | Yes | Yes (subsidies) | Self | — |
| **Rate state** | `/rates/[state]` | Yes | **Yes (FIXED)** | Self | — |
| **Rate county** | `/rates/[state]/[county]` | Yes | Yes (rates) | Self | — |
| **Enhanced credit state** | `/enhanced-credits/[state]` | Yes | **Yes (FIXED)** | Self | — |
| **Enhanced credit county** | `/enhanced-credits/[state]/[county]` | Yes | Yes (enhanced-credits) | Self | — |
| **Dental state** | `/dental/[state]` | Yes | **Yes (FIXED)** | Self | — |
| **Dental plan** | `/dental/[state]/[variant]` | Yes | Yes (dental) | Self | — |
| **FAQ category** | `/faq/[category]` | Yes | **Yes (FIXED)** | Self | — |
| **FAQ individual** | `/faq/[category]/[slug]` | Yes | Yes (faq) | Self | — |
| **Billing** | `/billing/[category]` | Yes | Yes (billing) | Self | — |
| **Life events** | `/life-events/[type]` | Yes | Yes (life-events) | Self | — |
| **Formulary seed** | `/formulary/[issuer]/[drug]` | Yes | Yes (400 seeded) | Self | — |
| **Formulary long-tail** | `/formulary/[issuer]/[drug]` (non-seed) | Yes | No (ISR on demand) | Self | Discovered via search/links |
| **Drug seed** | `/drugs/[state]/[county]/[drug]` | Yes | Yes (500 seeded) | Self | — |
| **Drug categories** | `/drugs/categories/[cat]` | Yes | **Yes (FIXED)** | Self | — |
| **Drug comparisons** | `/drugs/compare/[comp]` | Yes | **Yes (FIXED)** | Self | — |
| **Tools** | `/tools/*` | Yes | Yes (static) | Self (in layout.tsx) | — |
| **Redirect pages** | `/plans/[s]/[c]`, `/plan-details/...` | No (301) | No | N/A | Redirect to canonical |

---

## Part 4 — Internal Linking Audit

### Current State

**Homepage** distributes link equity to:
- 6 "Who it's for" persona links (guides + article pages)
- 3 hero tool CTAs (calculator, eligibility, states)
- 11 guide cards
- 6 tool cards
- 10 data pillar cards (all index pages)
- ~18 licensed state links (`/states/[state]`)

**Header** (every page): Guides, Tools, States, Plans, Subsidies, Drug Lookup, Dental, Contact

**Footer** (every page): 9 Coverage Data links + 6 Resource links + 5 Company links + Trust links

**Entity linker** (`lib/entity-linker.ts`): Sophisticated cross-linking with relevance scoring on county/plan/formulary/FAQ pages.

### Strengths
- Homepage links to all 10 pillar index pages
- Footer provides comprehensive secondary nav on every page
- Entity linker creates contextual cross-links on data pages (county → subsidy → rates → etc.)
- Breadcrumbs on all pages provide upward navigation

### Weaknesses

| Issue | Impact | Fix |
|---|---|---|
| **`/{state}/health-insurance-plans` not linked from homepage** | These are your highest-value pages but only reachable via `/states/[state]` → link in content | Add "Top states for plan comparison" section on homepage linking directly to top 5–10 state plan hubs |
| **Header missing Rates, Enhanced Credits, Billing, Life Events, FAQ** | These pillars get no top-nav authority | Footer compensates, but consider "More" dropdown |
| **State overview pages (`/states/[state]`) don't strongly link to state plan hubs** | User journey: `/states` → `/states/texas` → `???` → `/texas/health-insurance-plans` | Verify `/states/texas` prominently links to `/texas/health-insurance-plans` with strong CTA |
| **Guides don't cross-link to data pages by default** | 11 guides are mostly self-contained markdown without structured cross-links to county/state data pages | Add contextual entity links to guide templates |
| **No "related guides" on data pages** | County/subsidy/rate pages link to other data pages but rarely to guides | Entity linker could add guide suggestions based on page context |

### Orphaned / Weakly Linked
- `/drugs/categories/[category]` — no inbound links from sitemap, limited internal links
- `/drugs/compare/[comparison]` — same issue
- `/faq/[category]` pages — not in sitemap (now fixed), only reachable from `/faq` index

### Overlinked Low-Value
- `/states/[state]` (thin pages) get 18 direct homepage links AND sitemap entries, while the data-rich `/{state}/health-insurance-plans` pages get neither (sitemap now fixed)

---

## Part 5 — Metadata / Schema Audit

### Metadata

| Signal | Status | Notes |
|---|---|---|
| Title template | Present (`%s \| HealthInsuranceRenew`) | Consistent |
| Page-level titles | Present on all pages | Dynamic via `generateMetadata()` on data pages |
| Meta descriptions | Present on all pages | 150–160 chars, well-crafted |
| OG title/description | Present on all pages | Some duplicate meta description |
| OG image | Global default (`/og-default.png`) | No per-page OG images |
| OG locale | **Inconsistent** — missing on ~5 pages | Standardize to `en_US` |
| OG type | **Inconsistent** — `/dental`, `/glossary` use `article` | Standardize: index=website, content=article |
| Twitter card | Present globally | `summary_large_image` |
| Canonical | Present on all indexable pages | Tools have canonicals in layout.tsx |
| robots | Global `index: true, follow: true` | No per-page noindex (may want some) |

### Schema / JSON-LD

| Schema Type | Used On | Status |
|---|---|---|
| `WebSite` | Homepage | Present + SearchAction |
| `Organization` | Homepage | Present with `knowsAbout`, `hasCredential`, `publishingPrinciples` |
| `SpeakableSpecification` | Homepage only | **Should extend to pillar pages** |
| `BreadcrumbList` | Most pages | Present via Breadcrumbs component |
| `FAQPage` | FAQ, subsidy, plans, billing | Good coverage |
| `Article` | Guides, enhanced-credits | Present with `dateModified`, `isBasedOn` |
| `Dataset` | Plans, rates, subsidies, formulary | Present with CMS citation |
| `Drug` | Formulary pages | Present |
| `HealthInsurancePlan` | Dental pages | Present |
| `MedicalProcedure` | Billing pages | Present |
| `HowTo` | Life events | Present |
| `FinancialProduct` | Plan detail/SBC | Present |
| **`MedicalWebPage`** | **NONE** | **Built but unused — important YMYL signal** |
| `Person` / Author | **NONE on content pages** | Organization used instead — acceptable for team authorship |

### Missing / Weak

1. **MedicalWebPage with `reviewedBy`** — strongest YMYL signal, unused
2. **SpeakableSpecification** — only homepage; should be on FAQ, formulary, subsidy
3. **No per-page OG images** — all pages use the global default
4. **No `dateModified` on data pages** — important for freshness signals

---

## Part 6 — Production Readiness

### Safe
- Redirect structure is clean (3 config redirects + page-level `permanentRedirect()`)
- No route collisions detected — catch-all `[state-name]` segments handle disambiguation properly
- No crawl traps — all dynamic routes have `generateStaticParams` or ISR
- YMYL compliance signals present (editorial policy, data methodology, licensing, disclaimer)
- LLM crawler policy explicit and well-configured (`llms.txt`)

### Concerns

| Issue | Risk Level |
|---|---|
| ~~Dual robots.txt (route + static file)~~ | ✅ **FIXED** |
| ~~`lastmod` = today() on all URLs~~ | ✅ **FIXED** |
| ~18 thin state pages fully indexed | Dilutes site quality score |
| ~~Sitemap omits ~250+ high-value pages~~ | ✅ **FIXED** |
| Font loaded via external stylesheet | Potential render-blocking / CWV |
| No `404.tsx` custom error page found | Default Next.js 404 hurts UX |

---

## Part 7 — Implementation Plan

### Phase A — Must-Fix Before Production ✅ COMPLETE

| # | Fix | Files | Impact | Status |
|---|---|---|---|---|
| A1 | **Add state plan hubs to sitemap** | `app/sitemaps/[type]/route.ts` | ~30 highest-value pages discoverable | ✅ Done |
| A2 | **Add state-level index pages to sitemap** (subsidies, rates, enhanced-credits, dental) | `app/sitemaps/[type]/route.ts` | ~120 pages discoverable | ✅ Done |
| A3 | **Add FAQ category pages to sitemap** | `app/sitemaps/[type]/route.ts` | 9 hub pages discoverable | ✅ Done |
| A4 | **Add drug category + comparison pages to sitemap** | `app/sitemaps/[type]/route.ts` | ~25 pages discoverable | ✅ Done |
| A5 | **Add canonical tags to 6 tool pages** | `app/tools/*/layout.tsx` | Already present — no fix needed | ✅ Verified |
| A6 | **Delete duplicate `public/robots.txt`** | `public/robots.txt`, `app/robots.txt/route.ts` | Remove maintenance hazard, restore LLM rules | ✅ Done |
| A7 | **Fix `lastmod` to use real dates** | `app/sitemaps/[type]/route.ts` | Restore lastmod trust signal | ✅ Done |

### Phase B — High-Value Within 7 Days

| # | Fix | Impact |
|---|---|---|
| B1 | Add `MedicalWebPage` schema to all pillar pages | Strongest YMYL signal available |
| B2 | Add `SpeakableSpecification` to FAQ, formulary, subsidy, guide pages | Better AI engine extraction |
| B3 | Standardize OG locale to `en_US` on all pages | Entity signal consistency |
| B4 | Standardize OG type (website vs article) | Social sharing accuracy |
| B5 | Add homepage section linking to top 5 state plan hubs | Direct link equity to highest-value pages |
| B6 | Migrate fonts to `next/font/google` | CWV improvement |

### Phase C — Nice-to-Have Later

| # | Fix | Impact |
|---|---|---|
| C1 | Either enrich state overview markdown to 600+ words or noindex them | Reduce thin content risk |
| C2 | Add per-page OG images | Social sharing improvement |
| C3 | Add `dateModified` to all data pages using pipeline dates | Freshness signals |
| C4 | Add guide cross-links on data pages via entity linker | Internal linking depth |
| C5 | Add "Popular counties" section on homepage | Direct link equity to county pages |

---

## Phase A Implementation Summary

### Files Changed

**1. `app/sitemaps/[type]/route.ts` — Sitemap handler (major overhaul)**
- **A1:** Added ~30 `/{state}/health-insurance-plans` state plan hub URLs (priority 0.9) — the most content-rich pages on the site, previously invisible to Google
- **A2:** Added state-level index URLs for subsidies (~30), rates (~30), enhanced-credits (~30), dental (~30) — ~120 new hub pages total
- **A3:** Added 9 FAQ category hub URLs (`/faq/[category]`)
- **A4:** Added drug category URLs (from `DRUG_TAXONOMY`) + 15 drug comparison URLs (`/drugs/compare/[comp]`)
- **A7:** Replaced `new Date().toISOString().slice(0, 10)` (lying about daily updates) with honest constants: `DATA_LASTMOD = '2026-03-17'` for data-driven pages, `STATIC_LASTMOD = '2026-03-15'` for editorial content. Each entry now carries its own `lastmod` field.
- Added imports: `DRUG_TAXONOMY` from `@/lib/drug-linking`, `allStatesData` from config

**2. `app/robots.txt/route.ts` — Robots handler**
- **A6:** Merged the 14 LLM crawler allow rules + llms.txt pointer from the static `public/robots.txt` into the route handler (which was overriding it silently)

**3. Deleted: `public/robots.txt`**
- **A6:** Removed the duplicate file that was being ignored by Next.js

### Net Impact on Sitemap

| Change | New URLs Added |
|---|---|
| State plan hubs (`/{state}/health-insurance-plans`) | ~30 |
| State subsidy indexes (`/subsidies/{state}`) | ~30 |
| State rate indexes (`/rates/{state}`) | ~30 |
| State enhanced-credit indexes (`/enhanced-credits/{state}`) | ~30 |
| State dental indexes (`/dental/{state}`) | ~30 |
| FAQ category hubs (`/faq/{category}`) | 9 |
| Drug category pages (`/drugs/categories/{cat}`) | ~15 |
| Drug comparison pages (`/drugs/compare/{comp}`) | 15 |
| **Total new sitemapped URLs** | **~189** |

All were previously renderable but not in any sitemap. Zero new page routes were created — only sitemap discovery was fixed.

### What Was NOT Changed (Correct as-is)
- **A5:** All 6 tool pages already had canonical tags in their `layout.tsx` files
- No pages were mass-generated, removed, or noindexed
- No content was modified
- TypeScript compiles cleanly with zero errors

The Phase B and C items from the audit (MedicalWebPage schema, SpeakableSpecification on pillar pages, OG locale standardization, font migration to next/font, homepage linking to state plan hubs) are documented and ready when you want to tackle them.
