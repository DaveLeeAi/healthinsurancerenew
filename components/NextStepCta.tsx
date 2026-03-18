import Link from 'next/link'
import { stateCodeToSlug, getCountySlug } from '@/lib/county-lookup'
import { CTA_VARIANTS } from '@/lib/cta-config'

type CtaVariant = 'subsidy-calculator' | 'plan-comparison' | 'agent-consultation' | 'custom'

interface NextStepCtaProps {
  variant: CtaVariant
  // state: ISO 2-letter state code (e.g. "NC")
  state?: string
  // county: FIPS code (e.g. "37183") — used only for plan-comparison canonical URL
  county?: string
  customTitle?: string
  customDescription?: string
  customHref?: string
  customLabel?: string
}

const VARIANTS: Record<Exclude<CtaVariant, 'custom'>, { title: string; description: string; label: string; href: string }> = {
  'subsidy-calculator': {
    title: 'Find Out How Much You Can Save',
    description: 'Use our subsidy calculator to estimate your Advanced Premium Tax Credit (APTC) based on your household income and county.',
    label: 'Calculate Your Subsidy',
    href: '/subsidies',
  },
  'plan-comparison': {
    title: 'Compare Plans in Your Area',
    description: 'See every marketplace plan available in your county — compare premiums, deductibles, and out-of-pocket maximums side by side.',
    label: 'Compare Plans',
    // Base href for the index case (no state/county). State+county builds the
    // canonical /{state-slug}/{county-slug} URL in the component body below.
    href: '/plans',
  },
  'agent-consultation': {
    title: CTA_VARIANTS.network.headline,
    description: CTA_VARIANTS.network.body,
    label: CTA_VARIANTS.network.buttonText,
    href: '/contact',
  },
}

export default function NextStepCta({
  variant,
  state,
  county,
  customTitle,
  customDescription,
  customHref,
  customLabel,
}: NextStepCtaProps) {
  if (variant === 'custom') {
    return (
      <section className="rounded-xl bg-primary-50 border border-primary-200 p-6 text-center">
        <h2 className="text-lg font-semibold text-primary-900 mb-2">
          {customTitle ?? 'Next Step'}
        </h2>
        <p className="text-sm text-primary-700 max-w-lg mx-auto mb-4">
          {customDescription ?? ''}
        </p>
        {customHref && (
          <Link
            href={customHref}
            className="inline-block px-6 py-2.5 bg-primary-700 text-white text-sm font-semibold rounded-lg hover:bg-primary-800 transition-colors"
          >
            {customLabel ?? 'Learn More'}
          </Link>
        )}
      </section>
    )
  }

  const config = VARIANTS[variant]
  let href = config.href

  if (variant === 'plan-comparison') {
    // Build canonical county plans URL: /{state-slug}/{county-slug}
    // Avoids the legacy /plans/{state}/{county} redirect chain.
    if (state && county) {
      href = `/${stateCodeToSlug(state.toUpperCase())}/${getCountySlug(county)}`
    } else if (state) {
      href = `/${stateCodeToSlug(state.toUpperCase())}/health-insurance-plans`
    }
  } else if (variant === 'subsidy-calculator') {
    if (state && county) {
      href = `/subsidies/${state.toLowerCase()}/${county}`
    } else if (state) {
      href = `/subsidies/${state.toLowerCase()}`
    }
  }

  return (
    <section className="rounded-xl bg-primary-50 border border-primary-200 p-6 text-center">
      <h2 className="text-lg font-semibold text-primary-900 mb-2">
        {config.title}
      </h2>
      <p className="text-sm text-primary-700 max-w-lg mx-auto mb-4">
        {config.description}
      </p>
      <Link
        href={href}
        className="inline-block px-6 py-2.5 bg-primary-700 text-white text-sm font-semibold rounded-lg hover:bg-primary-800 transition-colors"
      >
        {config.label} &rarr;
      </Link>
    </section>
  )
}
