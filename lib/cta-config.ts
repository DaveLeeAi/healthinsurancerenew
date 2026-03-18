/**
 * Centralized CTA (Call-To-Action) configuration.
 *
 * Single source of truth for all agent-consultation CTAs across the site.
 * Swap CTA_CONFIG to a different variant here to update every CTA globally,
 * or pass a `variant` / `override` prop to a specific <GlobalCTA> instance.
 *
 * Future hooks (scaffold only — not yet wired):
 *   - geo-based routing (state/county → specific agent network)
 *   - A/B testing (alternate variant per experiment arm)
 *   - affiliate injection (affiliate partner CTAs by pageType)
 *   - lead-buyer routing (intent signal → buyer-specific destination)
 */

export type CTAVariantKey = 'network' | 'generic'

export interface CTAConfig {
  headline: string
  body: string
  buttonText: string
  variant: CTAVariantKey
}

/** All available CTA variants. Add new variants here — no component changes needed. */
export const CTA_VARIANTS: Record<CTAVariantKey, CTAConfig> = {
  /**
   * network — default production variant.
   * References "our network" for YMYL compliance (signals professional service,
   * not a single individual). "At no cost" addresses common consumer hesitation.
   */
  network: {
    headline: 'Talk to a licensed insurance professional',
    body: 'Our network of licensed agents can help you compare plans, verify coverage, and find the right option for your needs — at no cost to you.',
    buttonText: 'Connect with an agent',
    variant: 'network',
  },

  /**
   * generic — lower-friction variant for pages where the CTA is secondary.
   * Shorter copy, broader appeal.
   */
  generic: {
    headline: 'Get expert help at no cost',
    body: 'A licensed health insurance agent can help you compare plans and check coverage options available in your area.',
    buttonText: 'Get help',
    variant: 'generic',
  },
}

/**
 * Site-wide default CTA.
 * Change this one line to switch every CTA block on the site simultaneously.
 */
export const CTA_CONFIG: CTAConfig = CTA_VARIANTS.network
