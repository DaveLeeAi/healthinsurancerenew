/**
 * Dynamic sub-sitemap handler.
 *
 * Generates XML sitemaps for each page type:
 *   /sitemaps/static          — homepage + section index pages
 *   /sitemaps/plans           — /plans/[state]/[county]
 *   /sitemaps/subsidies       — /subsidies/[state]/[county]
 *   /sitemaps/rates           — /rates/[state]/[county]
 *   /sitemaps/enhanced-credits— /enhanced-credits/[state]/[county]
 *   /sitemaps/sbc             — /plan-details/[plan_variant_id]/[slug]
 *   /sitemaps/formulary       — /formulary/[issuer]/[drug] (static seed only)
 *   /sitemaps/dental          — /dental/[state]/[plan_variant]
 *   /sitemaps/faq             — /faq/[category]/[slug]
 *   /sitemaps/billing         — /billing/[category]
 *   /sitemaps/life-events     — /life-events/[event_type]
 */

import {
  getAllPlanStateCountyCombos,
  getAllSubsidyStateCountyCombos,
  getAllStateCountyCombos,
  getAllSbcPlans,
  getTopIssuerIds,
  getAllLifeEventParams,
  loadFrictionQA,
  loadBillingIntel,
  loadDentalCoverage,
} from '@/lib/data-loader'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const BASE = 'https://healthinsurancerenew.com'

const SEED_DRUGS = [
  'metformin', 'lisinopril', 'atorvastatin', 'amlodipine', 'omeprazole',
  'levothyroxine', 'albuterol', 'losartan', 'gabapentin', 'hydrochlorothiazide',
  'sertraline', 'metoprolol', 'montelukast', 'escitalopram', 'rosuvastatin',
  'bupropion', 'pantoprazole', 'duloxetine', 'furosemide', 'trazodone',
]

interface SitemapEntry {
  loc: string
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority: number
}

export const revalidate = 86400

interface RouteParams {
  params: { type: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const lastmod = new Date().toISOString().slice(0, 10)
  const entries = buildEntries(params.type)

  if (!entries) {
    return new Response('Not Found', { status: 404 })
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority.toFixed(1)}</priority>\n  </url>`
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

function buildEntries(type: string): SitemapEntry[] | null {
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
    case 'formulary':
      return buildFormularyEntries()
    case 'dental':
      return buildDentalEntries()
    case 'faq':
      return buildFaqEntries()
    case 'billing':
      return buildBillingEntries()
    case 'life-events':
      return buildLifeEventEntries()
    default:
      return null
  }
}

// ── Static pages ────────────────────────────────────────────────────────────

function buildStaticEntries(): SitemapEntry[] {
  const indexPages = [
    '/',
    '/plans',
    '/subsidies',
    '/rates',
    '/formulary',
    '/dental',
    '/faq',
    '/billing',
    '/life-events',
    '/enhanced-credits',
  ]
  return indexPages.map((path) => ({
    loc: `${BASE}${path}`,
    changefreq: 'monthly',
    priority: path === '/' ? 1.0 : 0.7,
  }))
}

// ── Plans — /plans/[state]/[county] ─────────────────────────────────────────

function buildPlanEntries(): SitemapEntry[] {
  return getAllPlanStateCountyCombos().map(({ state, county }) => ({
    loc: `${BASE}/plans/${state}/${county}`,
    changefreq: 'yearly',
    priority: 0.8,
  }))
}

// ── Subsidies — /subsidies/[state]/[county] ─────────────────────────────────

function buildSubsidyEntries(): SitemapEntry[] {
  return getAllSubsidyStateCountyCombos().map(({ state, county }) => ({
    loc: `${BASE}/subsidies/${state}/${county}`,
    changefreq: 'monthly',
    priority: 0.9,
  }))
}

// ── Rates — /rates/[state]/[county] ─────────────────────────────────────────

function buildRateEntries(): SitemapEntry[] {
  return getAllStateCountyCombos().map(({ state, county }) => ({
    loc: `${BASE}/rates/${state}/${county}`,
    changefreq: 'monthly',
    priority: 0.5,
  }))
}

// ── Enhanced Credits — /enhanced-credits/[state]/[county] ───────────────────

function buildEnhancedCreditEntries(): SitemapEntry[] {
  return getAllStateCountyCombos().map(({ state, county }) => ({
    loc: `${BASE}/enhanced-credits/${state}/${county}`,
    changefreq: 'yearly',
    priority: 0.5,
  }))
}

// ── SBC / Plan Details — /plan-details/[plan_variant_id]/[slug] ──────────────

function buildSbcEntries(): SitemapEntry[] {
  return getAllSbcPlans().map(({ plan_variant_id, plan_name }) => ({
    loc: `${BASE}/plan-details/${plan_variant_id}/${slugify(plan_name)}`,
    changefreq: 'yearly',
    priority: 0.5,
  }))
}

// ── Formulary — /formulary/[issuer]/[drug] (static seed only) ───────────────

function buildFormularyEntries(): SitemapEntry[] {
  const topIssuers = getTopIssuerIds(20)
  const entries: SitemapEntry[] = []
  for (const issuer of topIssuers) {
    for (const drug of SEED_DRUGS) {
      entries.push({
        loc: `${BASE}/formulary/${issuer}/${drug}`,
        changefreq: 'yearly',
        priority: 0.6,
      })
    }
  }
  return entries
}

// ── Dental — /dental/[state]/[plan_variant] ─────────────────────────────────

function buildDentalEntries(): SitemapEntry[] {
  return loadDentalCoverage().data.map((d) => ({
    loc: `${BASE}/dental/${d.state_code.toLowerCase()}/${d.plan_variant_id}`,
    changefreq: 'yearly',
    priority: 0.5,
  }))
}

// ── FAQ — /faq/[category]/[id] ──────────────────────────────────────────────

function buildFaqEntries(): SitemapEntry[] {
  return loadFrictionQA().data.map((q) => ({
    loc: `${BASE}/faq/${q.category}/${q.id}`,
    changefreq: 'yearly',
    priority: 0.7,
  }))
}

// ── Billing — /billing/[category] ───────────────────────────────────────────

function buildBillingEntries(): SitemapEntry[] {
  const categories = [
    ...new Set(loadBillingIntel().data.map((b) => b.billing_category)),
  ]
  return categories.map((c) => ({
    loc: `${BASE}/billing/${c}`,
    changefreq: 'yearly',
    priority: 0.5,
  }))
}

// ── Life Events — /life-events/[event_type] ─────────────────────────────────

function buildLifeEventEntries(): SitemapEntry[] {
  return getAllLifeEventParams().map(({ event_type }) => ({
    loc: `${BASE}/life-events/${event_type}`,
    changefreq: 'yearly',
    priority: 0.5,
  }))
}
