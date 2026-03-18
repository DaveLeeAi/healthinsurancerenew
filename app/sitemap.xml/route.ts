/**
 * Sitemap index — points to per-type sub-sitemaps at /sitemaps/[type].
 *
 * Sub-sitemaps: static, plans, subsidies, rates, enhanced-credits,
 *               sbc, formulary, dental, faq, billing, life-events,
 *               guides, states, drugs
 */

const BASE = 'https://healthinsurancerenew.com'

const SITEMAP_TYPES = [
  'static',
  'plans',
  'subsidies',
  'rates',
  'enhanced-credits',
  'sbc',
  'formulary',
  'dental',
  'faq',
  'billing',
  'life-events',
  'guides',
  'states',
  'drugs',
] as const

export const revalidate = 86400

export async function GET() {
  const lastmod = new Date().toISOString().slice(0, 10)

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...SITEMAP_TYPES.map(
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
