/**
 * PlanActionGuide — Concise 5-step action guide for plan evaluation.
 *
 * Each step is actionable. Steps 2 and 3 include direct links to county-specific tools.
 * Ends with GlobalCTA for agent consultation.
 * No personal branding — uses GlobalCTA for all consultation CTAs.
 */

import Link from 'next/link'
import GlobalCTA from '@/components/GlobalCTA'
import type { PlanRecord } from '@/lib/types'

interface Props {
  plan: PlanRecord
  stateCode: string
  countyFips: string
  stateSlug: string
  countySlug: string
}

interface Step {
  number: string
  title: string
  description: string
  link?: { href: string; label: string; external?: boolean }
}

export default function PlanActionGuide({
  plan,
  stateCode,
  countyFips,
  stateSlug,
  countySlug,
}: Props) {
  const steps: Step[] = [
    {
      number: '01',
      title: 'Check drug coverage',
      description:
        'Verify that any medications you take regularly appear on this plan\'s formulary and at what cost tier, before enrolling.',
      link: {
        href: `/${stateSlug}/${countySlug}`,
        label: `Browse drug coverage in this county →`,
      },
    },
    {
      number: '02',
      title: 'Estimate your subsidy eligibility',
      description:
        'Enter your household size and income to see whether you qualify for Advance Premium Tax Credits (APTC) that reduce your monthly premium.',
      link: {
        href: `/subsidies/${stateCode}/${countyFips}`,
        label: 'Subsidy calculator for this county →',
      },
    },
    {
      number: '03',
      title: 'Compare 2–3 similar plans',
      description:
        'Review other plans in this county — compare deductibles, premiums, and cost-sharing grids to find the right balance for your situation.',
      link: {
        href: `/${stateSlug}/${countySlug}`,
        label: 'Compare all plans in this county →',
      },
    },
    {
      number: '04',
      title: 'Verify your providers are in-network',
      description: `Use ${plan.issuer_name}'s provider directory to confirm your primary care physician, specialists, and preferred hospital accept this plan.`,
      link: {
        href: 'https://www.healthcare.gov/find-premium-estimates/',
        label: 'Find provider directory at HealthCare.gov →',
        external: true,
      },
    },
    {
      number: '05',
      title: 'Enroll during Open Enrollment',
      description:
        'Open Enrollment runs November 1 – January 15. Coverage typically begins January 1 for enrollments completed by December 15. Special Enrollment Periods are available for qualifying life events.',
      link: {
        href: 'https://www.healthcare.gov',
        label: 'Enroll at HealthCare.gov →',
        external: true,
      },
    },
  ]

  return (
    <section aria-labelledby="action-guide-heading" className="mb-10">
      <h2 id="action-guide-heading" className="text-xl font-semibold text-navy-800 mb-5">
        Next Steps: How to Evaluate This Plan
      </h2>

      <ol className="space-y-5 mb-6">
        {steps.map(step => (
          <li key={step.number} className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center">
              {step.number}
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-semibold text-navy-800">{step.title}</p>
              <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed">{step.description}</p>
              {step.link && (
                <Link
                  href={step.link.href}
                  className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                  {...(step.link.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {step.link.label}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>

      <GlobalCTA
        pageType="plan"
        intent="enroll"
        location={{ state: stateCode, county: countyFips }}
      />
    </section>
  )
}
