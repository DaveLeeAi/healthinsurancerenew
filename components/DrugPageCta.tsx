import Link from 'next/link'
import config from '@/data/config/config.json'
import { stateCodeToSlug } from '@/lib/county-lookup'
import { CTA_CONFIG } from '@/lib/cta-config'

const LICENSED_ABBRS = new Set(
  (config.licensedStates as { abbr: string }[]).map((s) => s.abbr.toUpperCase())
)

type Variant = 'hero' | 'mid' | 'bottom'

interface DrugPageCtaProps {
  variant: Variant
  drugName: string
  stateCode?: string
  stateName?: string
  /** e.g. "$5–$20 per fill" — shown in cost hook when available */
  costRange?: string
}

function isLicensedState(abbr?: string): boolean {
  if (!abbr) return false
  return LICENSED_ABBRS.has(abbr.toUpperCase())
}

function getCtaHref(stateCode?: string): string {
  if (stateCode) {
    return `/${stateCodeToSlug(stateCode.toUpperCase())}/health-insurance-plans`
  }
  return '/plans'
}

export default function DrugPageCta({
  variant,
  drugName,
  stateCode,
  stateName,
  costRange,
}: DrugPageCtaProps) {
  const licensed = isLicensedState(stateCode)
  const href = getCtaHref(stateCode)
  const stateLabel = stateName ?? stateCode?.toUpperCase()

  if (variant === 'hero') {
    return (
      <section className="mt-4 rounded-xl bg-primary-50/60 border border-primary-200/80 px-5 py-4 text-center">
        <p className="text-sm text-primary-800 mb-3">
          Need help choosing a plan that covers this medication?
        </p>
        <Link
          href={href}
          className="inline-block px-5 py-2.5 bg-primary-700 text-white text-sm font-semibold rounded-lg hover:bg-primary-800 transition-colors"
        >
          {stateLabel ? `Check Plans in ${stateLabel}` : 'Check Plans'} &rarr;
        </Link>
      </section>
    )
  }

  if (variant === 'mid') {
    return (
      <section
        aria-labelledby="coverage-help-heading"
        className="rounded-xl bg-primary-50 border-2 border-primary-200 p-5 sm:p-6 text-center"
      >
        <h2
          id="coverage-help-heading"
          className="text-lg font-semibold text-primary-900 mb-2"
        >
          Not sure which plan is best for your prescriptions?
        </h2>
        <p className="text-sm text-primary-700 max-w-lg mx-auto mb-2 leading-relaxed">
          {licensed
            ? CTA_CONFIG.body
            : 'Compare marketplace plans to find coverage that includes your medications at the lowest cost.'}
        </p>
        {costRange && stateLabel && (
          <p className="text-xs text-primary-600 mb-3">
            Plans covering {drugName}{stateLabel ? ` in ${stateLabel}` : ''} typically
            cost {costRange} per fill.
          </p>
        )}
        <Link
          href={href}
          className="inline-block px-6 py-2.5 bg-primary-700 text-white text-sm font-semibold rounded-lg hover:bg-primary-800 transition-colors"
        >
          See Plans That Cover {drugName} &rarr;
        </Link>
      </section>
    )
  }

  // bottom variant
  return (
    <section className="rounded-xl bg-neutral-50 border border-neutral-200 px-5 py-5 text-center">
      <p className="text-sm text-neutral-700 mb-3">
        Still have questions about your coverage?
      </p>
      <Link
        href={licensed ? '/contact' : href}
        className="inline-block px-5 py-2.5 bg-primary-700 text-white text-sm font-semibold rounded-lg hover:bg-primary-800 transition-colors"
      >
        {licensed ? CTA_CONFIG.buttonText : 'Get Help'} &rarr;
      </Link>
    </section>
  )
}
