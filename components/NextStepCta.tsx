import Link from 'next/link'
import { stateCodeToSlug, getCountySlug } from '@/lib/county-lookup'
import { CTA_VARIANTS } from '@/lib/cta-config'

type CtaVariant = 'subsidy-calculator' | 'plan-comparison' | 'agent-consultation' | 'custom'

interface NextStepCtaProps {
  variant: CtaVariant
  state?: string
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
    href: '/plans',
  },
  'agent-consultation': {
    title: CTA_VARIANTS.network.headline,
    description: CTA_VARIANTS.network.body,
    label: CTA_VARIANTS.network.buttonText,
    href: '/contact',
  },
}

/** NextStepCta — V19 .cta-mid: white bg, left blue border, blue button. */
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
      <section
        className="bg-white border border-rule flex items-center justify-between flex-wrap"
        style={{ borderLeft: '3px solid #1a56a0', borderRadius: '0 8px 8px 0', padding: '14px 18px', gap: '14px' }}
      >
        <div>
          <p className="text-ink font-medium" style={{ fontSize: '14px' }}>
            {customTitle ?? 'Next Step'}
          </p>
          {customDescription && (
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
              {customDescription}
            </p>
          )}
        </div>
        {customHref && (
          <Link
            href={customHref}
            className="inline-block shrink-0 bg-vblue text-white font-medium hover:bg-ink transition-colors"
            style={{ borderRadius: '6px', padding: '9px 20px', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}
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
    <section
      className="bg-white border border-rule flex items-center justify-between flex-wrap"
      style={{ borderLeft: '3px solid #1a56a0', borderRadius: '0 8px 8px 0', padding: '14px 18px', gap: '14px' }}
    >
      <div>
        <p className="text-ink font-medium" style={{ fontSize: '14px' }}>
          {config.title}
        </p>
        <p className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
          {config.description}
        </p>
      </div>
      <Link
        href={href}
        className="inline-block shrink-0 bg-vblue text-white font-medium hover:bg-ink transition-colors"
        style={{ borderRadius: '6px', padding: '9px 20px', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        {config.label} &rarr;
      </Link>
    </section>
  )
}
