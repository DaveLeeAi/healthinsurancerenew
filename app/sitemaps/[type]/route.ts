/**
 * Dynamic sub-sitemap handler.
 *
 * Generates XML sitemaps for each page type:
 *   /sitemaps/static          — homepage, index pages, tools, articles, trust pages
 *   /sitemaps/plans           — /{state-slug}/health-insurance-plans (state hubs)
 *                               + /{state-slug}/{county-slug}  (canonical county plans)
 *   /sitemaps/subsidies       — /subsidies/[state] (state indexes)
 *                               + /subsidies/[state]/[county]
 *   /sitemaps/rates           — /rates/[state] (state indexes)
 *                               + /rates/[state]/[county]
 *   /sitemaps/enhanced-credits— /enhanced-credits/[state] (state indexes)
 *                               + /enhanced-credits/[state]/[county]
 *   /sitemaps/sbc             — /{state-slug}/{county-slug}/{plan-name}-plan  (canonical SBC)
 *   /sitemaps/formulary       — /formulary/[issuer]/[drug] (static seed only)
 *   /sitemaps/dental          — /dental/[state] (state indexes)
 *                               + /dental/[state]/[plan_variant]
 *   /sitemaps/faq             — /faq/[category] (category hubs)
 *                               + /faq/[category]/[slug]
 *   /sitemaps/billing         — /billing/[category]
 *   /sitemaps/life-events     — /life-events/[event_type]
 *   /sitemaps/guides          — /guides/[slug]
 *   /sitemaps/states          — /states/[state]
 */

import {
  getAllPlanStateCountyCombos,
  getAllSubsidyStateCountyCombos,
  getAllStateCountyCombos,
  getAllSbcPlans,
  getAllLifeEventParams,
  loadFrictionQA,
  loadBillingIntel,
  loadDentalCoverage,
  loadFormularySitemapIndex,
} from '@/lib/data-loader'
import { stateCodeToSlug, getCountySlug } from '@/lib/county-lookup'
import { generatePlanSlug } from '@/lib/plan-slug'
import { getCollectionSlugs } from '@/lib/markdown'
import allStatesData from '@/data/config/all-states.json'

const BASE = 'https://healthinsurancerenew.com'

// Honest lastmod dates — reflect actual data/content dates, NEVER new Date()
const DATA_LASTMOD = '2026-01-15'       // Plan year data reviewed date
const PLAN_YEAR_LASTMOD = '2026-01-01'  // Subsidy/enhanced-credits plan year start
const EDITORIAL_LASTMOD = '2026-03-15'  // Last editorial review date
const STATIC_LASTMOD = '2026-03-15'     // Last site content edit date
const OZEMPIC_LASTMOD = '2026-04-23'    // Date Ozempic state summaries were regenerated
                                         // (ETL re-run after V79 Pass 2 voice fixes)

// Phase 5 Tier 2 Ozempic rollout — state+drug pairs blocked from the sitemap
// until Claude.ai produces Tier 1/3/4 V79-voice conditional copy.  These four
// states have a non-preferred-brand dominant placement for Ozempic, so the
// Tier 2 locked patterns (BONUS A cost intro in particular) do not apply.
// See docs/formulary-tier-conditional-copy.md and F01-V79-formulary-page-lock-spec.md.
const BLOCKED_FORMULARY_PAIRS = new Set<string>([
  'colorado/ozempic',
  'district-of-columbia/ozempic',
  'maryland/ozempic',
  'rhode-island/ozempic',
])

// State+drug pairs whose underlying summary was regenerated on OZEMPIC_LASTMOD.
// Pairs not in this set fall back to DATA_LASTMOD (plan-year snapshot date).
const OZEMPIC_STATE_PAIRS = new Set<string>([
  'alabama/ozempic','alaska/ozempic','arizona/ozempic','arkansas/ozempic',
  'california/ozempic','connecticut/ozempic','delaware/ozempic','florida/ozempic',
  'georgia/ozempic','hawaii/ozempic','idaho/ozempic','illinois/ozempic',
  'indiana/ozempic','iowa/ozempic','kansas/ozempic','kentucky/ozempic',
  'louisiana/ozempic','maine/ozempic','massachusetts/ozempic','michigan/ozempic',
  'minnesota/ozempic','mississippi/ozempic','missouri/ozempic','montana/ozempic',
  'nebraska/ozempic','nevada/ozempic','new-hampshire/ozempic','new-jersey/ozempic',
  'new-mexico/ozempic','new-york/ozempic','north-carolina/ozempic','north-dakota/ozempic',
  'ohio/ozempic','oklahoma/ozempic','oregon/ozempic','pennsylvania/ozempic',
  'south-carolina/ozempic','south-dakota/ozempic','tennessee/ozempic','texas/ozempic',
  'utah/ozempic','vermont/ozempic','virginia/ozempic','washington/ozempic',
  'west-virginia/ozempic','wisconsin/ozempic','wyoming/ozempic',
])


interface StateEntry { slug: string; abbr: string; ownExchange?: boolean }

interface SitemapEntry {
  loc: string
  lastmod: string
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority: number
}

export const revalidate = 86400

interface RouteParams {
  params: { type: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const entries = buildEntries(params.type)

  if (!entries) {
    return new Response('Not Found', { status: 404 })
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority.toFixed(1)}</priority>\n  </url>`
    ),
    '</urlset>',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}

// ---------------------------------------------------------------------------
// Entry builders by type
// ---------------------------------------------------------------------------

const MAX_URLS_PER_SITEMAP = 30_000

function buildEntries(type: string): SitemapEntry[] | null {
  // Handle formulary-N sub-sitemaps (formulary-1, formulary-2, etc.)
  const formularyMatch = type.match(/^formulary-(\d+)$/)
  if (formularyMatch) {
    const chunkIndex = parseInt(formularyMatch[1], 10)
    return buildFormularyEntries(chunkIndex)
  }

  switch (type) {
    case 'static':
      return buildStaticEntries()
    case 'plans':
      return buildPlanEntries()
    case 'subsidies':
      return buildSubsidyEntries()
    case 'rates':
      return buildRateEntries()
    case 'enhanced-credits':
      return buildEnhancedCreditEntries()
    case 'sbc':
      return buildSbcEntries()
    case 'dental':
      return buildDentalEntries()
    case 'faq':
      return buildFaqEntries()
    case 'billing':
      return buildBillingEntries()
    case 'life-events':
      return buildLifeEventEntries()
    case 'guides':
      return buildGuideEntries()
    case 'states':
      return buildStateEntries()
    default:
      return null
  }
}

// ── Static pages ────────────────────────────────────────────────────────────

function buildStaticEntries(): SitemapEntry[] {
  const pages: Array<{ path: string; priority: number; changefreq: SitemapEntry['changefreq'] }> = [
    // Core
    { path: '/', priority: 1.0, changefreq: 'weekly' },
    { path: '/about', priority: 0.8, changefreq: 'monthly' },
    { path: '/contact', priority: 0.7, changefreq: 'monthly' },

    // Data pillars — index pages
    { path: '/plans', priority: 0.9, changefreq: 'monthly' },
    { path: '/subsidies', priority: 0.9, changefreq: 'monthly' },
    { path: '/rates', priority: 0.7, changefreq: 'monthly' },
    { path: '/formulary', priority: 0.9, changefreq: 'monthly' },
    { path: '/dental', priority: 0.7, changefreq: 'monthly' },
    { path: '/enhanced-credits', priority: 0.8, changefreq: 'monthly' },
    { path: '/faq', priority: 0.8, changefreq: 'monthly' },
    { path: '/billing', priority: 0.7, changefreq: 'monthly' },
    { path: '/life-events', priority: 0.7, changefreq: 'monthly' },
    { path: '/states', priority: 0.8, changefreq: 'monthly' },
    { path: '/guides', priority: 0.8, changefreq: 'monthly' },
    { path: '/tools', priority: 0.8, changefreq: 'monthly' },
    { path: '/glossary', priority: 0.6, changefreq: 'monthly' },

    // Tools
    { path: '/tools/income-savings-calculator', priority: 0.8, changefreq: 'monthly' },
    { path: '/tools/job-plan-affordability', priority: 0.8, changefreq: 'monthly' },
    { path: '/tools/what-income-counts', priority: 0.7, changefreq: 'monthly' },
    { path: '/tools/plan-comparison', priority: 0.8, changefreq: 'monthly' },
    { path: '/tools/csr-estimator', priority: 0.8, changefreq: 'monthly' },
    { path: '/tools/family-coverage-estimator', priority: 0.7, changefreq: 'monthly' },
    { path: '/eligibility-check', priority: 0.8, changefreq: 'monthly' },

    // Standalone article pages
    { path: '/aca-income-guide-2026', priority: 0.8, changefreq: 'yearly' },
    { path: '/fpl-2026', priority: 0.7, changefreq: 'yearly' },
    { path: '/csr-explained-2026', priority: 0.8, changefreq: 'yearly' },
    { path: '/turning-26-health-insurance-options', priority: 0.7, changefreq: 'yearly' },
    { path: '/self-employed-health-insurance-2026', priority: 0.7, changefreq: 'yearly' },
    { path: '/early-retirement-health-insurance-2026', priority: 0.7, changefreq: 'yearly' },
    { path: '/lost-job-health-insurance-2026', priority: 0.7, changefreq: 'yearly' },
    { path: '/employer-coverage-unaffordable-2026', priority: 0.7, changefreq: 'yearly' },

    // Trust / policy pages
    { path: '/how-we-get-paid', priority: 0.6, changefreq: 'monthly' },
    { path: '/editorial-policy', priority: 0.6, changefreq: 'monthly' },
    { path: '/data-methodology', priority: 0.7, changefreq: 'monthly' },
    { path: '/licensing', priority: 0.5, changefreq: 'yearly' },
    { path: '/circle-of-champions', priority: 0.6, changefreq: 'yearly' },
    { path: '/privacy', priority: 0.4, changefreq: 'yearly' },
    { path: '/terms', priority: 0.4, changefreq: 'yearly' },
  ]

  return pages.map(({ path, priority, changefreq }) => ({
    loc: `${BASE}${path}`,
    lastmod: STATIC_LASTMOD,
    changefreq,
    priority,
  }))
}

// ── Plans — /{state-slug}/health-insurance-plans (state hubs)
//            + /{state-slug}/{county-slug}  (canonical county plans pages) ───────

function buildPlanEntries(): SitemapEntry[] {
  // State plan hub pages (highest-value content pages)
  const ffmStates = [...new Set(
    getAllPlanStateCountyCombos().map((c) => stateCodeToSlug(c.state.toUpperCase()))
  )]
  const sbmStates = (allStatesData.states as StateEntry[])
    .filter((s) => s.ownExchange)
    .map((s) => s.slug)
  const allStateSlugs = [...new Set([...ffmStates, ...sbmStates])]

  const stateHubs: SitemapEntry[] = allStateSlugs.map((slug) => ({
    loc: `${BASE}/${slug}/health-insurance-plans`,
    lastmod: DATA_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.9,
  }))

  // County plan pages
  const countyPages: SitemapEntry[] = getAllPlanStateCountyCombos().map(({ state, county }) => ({
    loc: `${BASE}/${stateCodeToSlug(state.toUpperCase())}/${getCountySlug(county)}`,
    lastmod: DATA_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.8,
  }))

  return [...stateHubs, ...countyPages]
}

// ── Subsidies — /subsidies/[state] (state indexes) + /subsidies/[state]/[county] ──

function buildSubsidyEntries(): SitemapEntry[] {
  const combos = getAllSubsidyStateCountyCombos()
  const uniqueStates = [...new Set(combos.map((c) => c.state))]

  const stateIndexes: SitemapEntry[] = uniqueStates.map((state) => ({
    loc: `${BASE}/subsidies/${state}`,
    lastmod: PLAN_YEAR_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.8,
  }))

  const countyPages: SitemapEntry[] = combos.map(({ state, county }) => ({
    loc: `${BASE}/subsidies/${state}/${county}`,
    lastmod: PLAN_YEAR_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.9,
  }))

  return [...stateIndexes, ...countyPages]
}

// ── Rates — /rates/[state] (state indexes) + /rates/[state]/[county] ────────

function buildRateEntries(): SitemapEntry[] {
  const combos = getAllStateCountyCombos()
  const uniqueStates = [...new Set(combos.map((c) => c.state))]

  const stateIndexes: SitemapEntry[] = uniqueStates.map((state) => ({
    loc: `${BASE}/rates/${state}`,
    lastmod: DATA_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.6,
  }))

  const countyPages: SitemapEntry[] = combos.map(({ state, county }) => ({
    loc: `${BASE}/rates/${state}/${county}`,
    lastmod: DATA_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.5,
  }))

  return [...stateIndexes, ...countyPages]
}

// ── Enhanced Credits — /enhanced-credits/[state] + /enhanced-credits/[state]/[county] ──

function buildEnhancedCreditEntries(): SitemapEntry[] {
  const combos = getAllStateCountyCombos()
  const uniqueStates = [...new Set(combos.map((c) => c.state))]

  const stateIndexes: SitemapEntry[] = uniqueStates.map((state) => ({
    loc: `${BASE}/enhanced-credits/${state}`,
    lastmod: PLAN_YEAR_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.6,
  }))

  const countyPages: SitemapEntry[] = combos.map(({ state, county }) => ({
    loc: `${BASE}/enhanced-credits/${state}/${county}`,
    lastmod: PLAN_YEAR_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.5,
  }))

  return [...stateIndexes, ...countyPages]
}

// ── SBC / Plan Details — /{state-slug}/{county-slug}/{plan-name}-plan  (canonical) ──
// generatePlanSlug() always appends -plan; every URL here ends in -plan and resolves
// to the CountyPlanDetailPage branch in app/[state-name]/[county-slug]/[county-page]/page.tsx

function buildSbcEntries(): SitemapEntry[] {
  return getAllSbcPlans()
    .filter(({ state_code, county_fips }) => state_code && county_fips)
    .map(({ plan_name, state_code, county_fips }) => ({
      loc: `${BASE}/${stateCodeToSlug(state_code.toUpperCase())}/${getCountySlug(county_fips)}/${generatePlanSlug(plan_name)}`,
      lastmod: DATA_LASTMOD,
      changefreq: 'yearly' as const,
      priority: 0.5,
    }))
}

// ── Formulary — /formulary/[state-slug]/[drug-slug] (all valid state/drug pairs)
//
// Pre-built index from scripts/etl/build_formulary_sitemap_index.py.
// Split into 50K-URL chunks: formulary-1, formulary-2, etc.

function buildFormularyEntries(chunkIndex: number): SitemapEntry[] {
  const index = loadFormularySitemapIndex()
  // Strip pairs blocked pending Tier 1/3/4 V79-voice copy (see BLOCKED_FORMULARY_PAIRS).
  const pairs = index.pairs.filter((p) => !BLOCKED_FORMULARY_PAIRS.has(p))

  // chunkIndex is 1-based: formulary-1 = pairs[0..49999], formulary-2 = pairs[50000..99999], etc.
  const start = (chunkIndex - 1) * MAX_URLS_PER_SITEMAP
  const end = Math.min(start + MAX_URLS_PER_SITEMAP, pairs.length)

  if (start >= pairs.length) return []

  const entries: SitemapEntry[] = []
  for (let i = start; i < end; i++) {
    // Each pair is "state-slug/drug-slug".
    // Ozempic state summaries were regenerated on OZEMPIC_LASTMOD; everything
    // else still reflects the plan-year data snapshot (DATA_LASTMOD).
    const pair = pairs[i]
    const lastmod = OZEMPIC_STATE_PAIRS.has(pair) ? OZEMPIC_LASTMOD : DATA_LASTMOD
    entries.push({
      loc: `${BASE}/${pair}`,
      lastmod,
      changefreq: 'yearly' as const,
      priority: 0.6,
    })
  }
  return entries
}

// ── Dental — /dental/[state] (state indexes) + /dental/[state]/[plan_variant] ──

function buildDentalEntries(): SitemapEntry[] {
  const data = loadDentalCoverage().data
  const uniqueStates = [...new Set(data.map((d) => d.state_code.toLowerCase()))]

  const stateIndexes: SitemapEntry[] = uniqueStates.map((state) => ({
    loc: `${BASE}/dental/${state}`,
    lastmod: DATA_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.6,
  }))

  const planPages: SitemapEntry[] = data.map((d) => ({
    loc: `${BASE}/dental/${d.state_code.toLowerCase()}/${d.plan_variant_id}`,
    lastmod: DATA_LASTMOD,
    changefreq: 'yearly' as const,
    priority: 0.5,
  }))

  return [...stateIndexes, ...planPages]
}

// ── FAQ — /faq/[category] (category hubs) + /faq/[category]/[id] ────────────

function buildFaqEntries(): SitemapEntry[] {
  const data = loadFrictionQA().data
  const uniqueCategories = [...new Set(data.map((q) => q.category))]

  const categoryHubs: SitemapEntry[] = uniqueCategories.map((cat) => ({
    loc: `${BASE}/faq/${cat}`,
    lastmod: STATIC_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.7,
  }))

  const questionPages: SitemapEntry[] = data.map((q) => ({
    loc: `${BASE}/faq/${q.category}/${q.id}`,
    lastmod: STATIC_LASTMOD,
    changefreq: 'yearly' as const,
    priority: 0.7,
  }))

  return [...categoryHubs, ...questionPages]
}

// ── Billing — /billing/[category] ───────────────────────────────────────────

function buildBillingEntries(): SitemapEntry[] {
  const categories = [
    ...new Set(loadBillingIntel().data.map((b) => b.billing_category)),
  ]
  return categories.map((c) => ({
    loc: `${BASE}/billing/${c}`,
    lastmod: STATIC_LASTMOD,
    changefreq: 'yearly' as const,
    priority: 0.5,
  }))
}

// ── Life Events — /life-events/[event_type] ─────────────────────────────────

function buildLifeEventEntries(): SitemapEntry[] {
  return getAllLifeEventParams().map(({ event_type }) => ({
    loc: `${BASE}/life-events/${event_type}`,
    lastmod: EDITORIAL_LASTMOD,
    changefreq: 'yearly' as const,
    priority: 0.5,
  }))
}

// ── Guides — /guides/[slug] ─────────────────────────────────────────────────

function buildGuideEntries(): SitemapEntry[] {
  return getCollectionSlugs('guides').map((slug) => ({
    loc: `${BASE}/guides/${slug}`,
    lastmod: EDITORIAL_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.8,
  }))
}

// ── States — /states/[state] ────────────────────────────────────────────────

function buildStateEntries(): SitemapEntry[] {
  return getCollectionSlugs('states').map((slug) => ({
    loc: `${BASE}/states/${slug}`,
    lastmod: STATIC_LASTMOD,
    changefreq: 'monthly' as const,
    priority: 0.7,
  }))
}

