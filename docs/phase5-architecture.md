# Phase 5 Architecture — Plan + Drug Pages (15.2M URLs)

## URL Pattern
`/{state}/{drug}/{plan}` — e.g., `/florida/ozempic/ambetter-silver-2026`

## Rendering Strategy
- **ISR with on-demand generation** — NOT full SSG at build time
- `dynamicParams = true` — allow any plan+drug combination to render on first request
- `revalidate = 86400` (24 hours) — stale-while-revalidate for cached pages
- NO `generateStaticParams()` for plan+drug pages — the 15.2M combinations would OOM the build
- Build ZERO pages at build time. All plan+drug pages render on first visitor request, then cache.

## Data Loading Strategy
- **Current:** JSON files loaded from disk (works for ~150K pages)
- **Phase 5:** Same JSON approach BUT with streaming reads for plan+drug lookups
  - `formulary_intelligence.json` (4.0GB) — stream-parse, don't load into memory
  - Create `lib/formulary-lookup.ts` — single-record lookup by issuer+drug, uses streaming JSON parser
  - Fallback: if streaming is too slow, pre-split into per-state JSON files during ETL
  - Long-term (Phase 6+): migrate to PostgreSQL/Supabase if JSON approach hits limits

## Pre-Split ETL (do this BEFORE building the template)
- Create `scripts/etl/split_formulary_by_state.py`
  - Input: `data/processed/formulary_intelligence.json` (4.0GB)
  - Output: `data/processed/formulary/by-state/{state_code}.json` (~50-100MB each)
  - Each file contains all plan+drug records for that state
  - This is what the page template will read at render time

## Sitemap Strategy
- One sitemap per state: `sitemap-drug-plan-{state}.xml`
- Cap at 30,000 URLs per sitemap file
- Large states (FL, TX, CA) will need multiple sitemap files: `sitemap-drug-plan-florida-1.xml`, etc.
- Priority: 1.0 (same as SBC — these are the highest-intent pages)
- lastmod: `2026-01-15` (data review date)
- Sitemaps generated from pre-split state JSON files, NOT from 4GB master file

## Phased Rollout
1. **Week 1:** Build template + data pipeline for top 3 states (FL, TX, CA)
2. **Week 2:** Expand to top 10 states, monitor indexing + Core Web Vitals
3. **Week 3:** All 50 states + DC
4. **Week 4:** Submit all sitemaps, monitor Search Console for crawl errors
5. **Ongoing:** Monitor thin content signals, add interactive elements if needed

## Top 50K Priority Combinations
- Generate `data/config/phase5-priority-combinations.csv`
- Criteria: top 200 drugs × top 250 plans (by enrollment) = 50,000 high-intent URLs
- These get submitted to Search Console first via sitemap
- Track indexation rate — if <50% indexed after 2 weeks, investigate content quality

## Template Requirements (build in Phase 5 proper, not now)
- Answer: "Does [plan] cover [drug]?" — yes/no with evidence
- Fields: coverage status, tier, prior authorization, step therapy, quantity limits, cost range
- Schema: WebPage + FAQPage + BreadcrumbList (NOT MedicalWebPage)
- Above-fold: V35 pattern (breadcrumb → H1 → date → lede → evidence → AEO → snapshot → CTA)
- FAQ: 5-7 items, static <details>/<summary>
- Cross-links: back to drug page (/{state}/{drug}), back to plan page (/{state}/{county}/{plan}-plan)
- GenericByline, CMS disclaimer, LimitsBlock — all standard V35 requirements

## Memory/Build Constraints
- Current: `--max-old-space-size=8192`, `cpus: 1`, `staticPageGenerationTimeout: 300`
- Phase 5: NO CHANGE to build config — plan+drug pages are ISR-only, never built at compile time
- The build should get FASTER after Phase 5, not slower, because we're not adding static pages

## Competitive Moat
- 15.2M unique plan+drug combinations across 50 states + DC
- Healthcare.gov requires login + 5 screens to find this answer — we surface it in one indexed URL
- GoodRx doesn't cross-reference ACA formulary data at the plan level
- eHealth/GoHealth don't build programmatic pages for individual drug+plan combinations
- Technical barrier: CMS PUF parsing + RxNorm mapping + county-to-rating-area crosswalk = months of engineering
