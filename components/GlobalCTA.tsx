import Link from 'next/link'
import { CTA_CONFIG, CTA_VARIANTS } from '@/lib/cta-config'
import type { CTAConfig, CTAVariantKey } from '@/lib/cta-config'

// ---------------------------------------------------------------------------
// Future monetization scaffolds — accept but do not act on yet.
// Wire these up when geo-routing, A/B testing, or affiliate injection lands.
// ---------------------------------------------------------------------------

interface LocationContext {
  state?: string   // ISO 2-letter state code, e.g. "NC"
  county?: string  // FIPS code, e.g. "37183"
}

type PageType = 'drug' | 'plan' | 'county' | 'subsidy' | 'tool' | 'general'
type Intent   = 'browse' | 'compare' | 'enroll' | 'help'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GlobalCTAProps {
  /** Use a named variant from CTA_VARIANTS. Defaults to CTA_CONFIG (network). */
  variant?: CTAVariantKey
  /** Override individual fields — useful for page-specific copy or A/B tests. */
  override?: Partial<CTAConfig>
  /** CTA link destination. Defaults to /contact. */
  href?: string
  // ── Future routing props (scaffold — not implemented) ──
  /** Geo context for future agent-network routing. */
  location?: LocationContext
  /** Page type for future context-aware CTA switching. */
  pageType?: PageType
  /** User intent signal for future lead-buyer routing. */
  intent?: Intent
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * GlobalCTA — brand-neutral, fully configurable agent-consultation CTA.
 *
 * Usage (default):
 *   <GlobalCTA />
 *
 * Usage (named variant):
 *   <GlobalCTA variant="generic" />
 *
 * Usage (field override for A/B or page-specific copy):
 *   <GlobalCTA override={{ headline: 'Need help with drug coverage?' }} />
 *
 * Usage (custom destination):
 *   <GlobalCTA href="/contact?source=drug-page" />
 */
export default function GlobalCTA({
  variant,
  override,
  href = '/contact',
  // Future props — destructured but intentionally unused until routing is wired
  location: _location,
  pageType: _pageType,
  intent: _intent,
}: GlobalCTAProps) {
  const base = variant ? CTA_VARIANTS[variant] : CTA_CONFIG
  const config: CTAConfig = { ...base, ...override }

  return (
    <section
      aria-labelledby="global-cta-heading"
      className="rounded-xl bg-primary-50 border border-primary-200 p-6 text-center"
    >
      <h2
        id="global-cta-heading"
        className="text-lg font-semibold text-primary-900 mb-2"
      >
        {config.headline}
      </h2>
      <p className="text-sm text-primary-700 max-w-lg mx-auto mb-4 leading-relaxed">
        {config.body}
      </p>
      <Link
        href={href}
        className="inline-block px-6 py-2.5 bg-primary-700 text-white text-sm font-semibold rounded-lg hover:bg-primary-800 transition-colors"
      >
        {config.buttonText} &rarr;
      </Link>
    </section>
  )
}
