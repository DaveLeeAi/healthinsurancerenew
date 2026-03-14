import Link from 'next/link'

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
    description: 'See every ACA Marketplace plan available in your county — compare premiums, deductibles, and out-of-pocket maximums side by side.',
    label: 'Compare Plans',
    href: '/plans',
  },
  'agent-consultation': {
    title: 'Talk to a Licensed Agent',
    description: 'Not sure which plan is right for you? A licensed health insurance agent can review your options and help you enroll at no cost.',
    label: 'Get Free Help',
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
  if (state && county) {
    href = `${config.href}/${state.toLowerCase()}/${county}`
  } else if (state) {
    href = `${config.href}/${state.toLowerCase()}`
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
