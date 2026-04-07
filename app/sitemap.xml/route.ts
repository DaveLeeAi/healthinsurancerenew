/**
 * Sitemap index — points to per-type sub-sitemaps at /sitemaps/[type].
 *
 * Sub-sitemaps: static, plans, subsidies, rates, enhanced-credits,
 *               sbc, formulary-1..N (split at 50K), dental, faq,
 *               billing, life-events, guides, states, drugs
 */

import { loadFormularySitemapIndex } from '@/lib/data-loader'

const BASE = 'https://healthinsurancerenew.com'

const MAX_URLS_PER_SITEMAP = 30_000

const FIXED_SITEMAP_TYPES = [
  'static',
  'plans',
  'subsidies',
  'rates',
  'enhanced-credits',
  'sbc',
  'dental',
  'faq',
  'billing',
  'life-events',
  'guides',
  'states',
] as const

export const revalidate = 86400

export async function GET() {
  // Honest lastmod — reflects last data pipeline run, NOT current time
  const lastmod = '2026-01-15'

  // Calculate how many formulary sub-sitemaps are needed
  const formularyIndex = loadFormularySitemapIndex()
  const totalPairs = formularyIndex.pairs.length
  const formularyChunks = totalPairs > 0
    ? Math.ceil(totalPairs / MAX_URLS_PER_SITEMAP)
    : 1 // at least formulary-1 even if empty (graceful fallback)

  const allTypes: string[] = []

  for (const type of FIXED_SITEMAP_TYPES) {
    allTypes.push(type)
    // Insert formulary chunks right after 'sbc' (where 'formulary' used to be)
    if (type === 'sbc') {
      for (let i = 1; i <= formularyChunks; i++) {
        allTypes.push(`formulary-${i}`)
      }
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allTypes.map(
      (type) =>
        `  <sitemap>\n    <loc>${BASE}/sitemaps/${type}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`
    ),
    '</sitemapindex>',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
