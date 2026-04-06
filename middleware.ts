import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Middleware — Route disambiguation for /{state}/{drug} vs /{state}/{county}
//
// The canonical URL architecture is:
//   /{state-slug}/{drug-slug}   → formulary drug page
//   /{state-slug}/{county-slug} → county hub page
//
// But the formulary page still renders at /formulary/{state}/{drug}.
// This middleware rewrites /{state}/{drug} → /formulary/{state}/{drug}
// while letting county routes pass through to app/[state-name]/[county-slug].
// ---------------------------------------------------------------------------

// All 50 states + DC as URL slugs (fixed set — won't change)
const STATE_SLUGS = new Set([
  'alabama', 'alaska', 'arizona', 'arkansas', 'california',
  'colorado', 'connecticut', 'delaware', 'florida', 'georgia',
  'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
  'kansas', 'kentucky', 'louisiana', 'maine', 'maryland',
  'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri',
  'montana', 'nebraska', 'nevada', 'new-hampshire', 'new-jersey',
  'new-mexico', 'new-york', 'north-carolina', 'north-dakota', 'ohio',
  'oklahoma', 'oregon', 'pennsylvania', 'rhode-island', 'south-carolina',
  'south-dakota', 'tennessee', 'texas', 'utah', 'vermont',
  'virginia', 'washington', 'west-virginia', 'wisconsin', 'wyoming',
  'district-of-columbia',
])

// Segments that belong to existing [state-name]/* routes — NOT drug slugs
function isKnownStateSubroute(segment: string): boolean {
  // Static route: /{state}/health-insurance-plans
  if (segment === 'health-insurance-plans') return true
  // County slugs always end with "-county" (from countyNameToSlug)
  if (segment.endsWith('-county')) return true
  // Fallback county format: "county-{fips}"
  if (segment.startsWith('county-')) return true
  // Plan slug fallback: ends with "-plan" (from parsePlanSlug)
  if (segment.endsWith('-plan')) return true
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only process paths with exactly 2 segments: /{seg1}/{seg2}
  // Skip paths with query params like /formulary?q=... (handled by formulary index)
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length !== 2) return NextResponse.next()

  const [stateSlug, secondSegment] = segments

  // First segment must be a valid state slug
  if (!STATE_SLUGS.has(stateSlug)) return NextResponse.next()

  // If second segment is a known state sub-route, let it pass through
  if (isKnownStateSubroute(secondSegment)) return NextResponse.next()

  // Special case: "all" is a valid formulary param (e.g., /{state}/all)
  // Rewrite to /formulary/{state}/all
  // Everything else that reaches here is treated as a drug slug
  const url = request.nextUrl.clone()
  url.pathname = `/formulary/${stateSlug}/${secondSegment}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Only run on paths that could be /{state}/{drug} — skip static assets, API, etc.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap|formulary|drugs|plans|subsidies|rates|dental|billing|life-events|enhanced-credits|faq|states|guides|tools|about|contact|glossary|eligibility-check|turning-26|early-retirement|lost-job|compare|public).*)',
  ],
}
