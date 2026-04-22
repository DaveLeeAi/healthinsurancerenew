/**
 * PlanMetalContext — Metal tier explanation.
 *
 * Content varies substantially by tier:
 *   Bronze  → high-deductible emphasis, HSA callout
 *   Silver  → CSR eligibility callout (only tier eligible)
 *   Gold    → predictability / break-even framing
 *   Platinum → maximum coverage / cost certainty
 *   Catastrophic → eligibility-restricted, limited benefit structure
 *
 * Computes county average deductible for contextual framing.
 * Returns null if metal level is unrecognized.
 */

import type { PlanRecord } from '@/lib/types'

interface Props {
  plan: PlanRecord
  countyPlans: PlanRecord[]
}

interface MetalContent {
  headline: string
  paragraphs: string[]
  csrCallout?: boolean
  hsaCallout?: boolean
}

function normalizeMetalLevel(level: string): string {
  return level.toLowerCase().replace(/\s+/g, '_')
}

function fmt(n: number): string {
  return `$${n.toLocaleString()}`
}

function getCountyAvgDeductible(metal: string, countyPlans: PlanRecord[]): number | null {
  const vals = countyPlans
    .filter(
      p =>
        normalizeMetalLevel(p.metal_level) === metal && p.deductible_individual != null,
    )
    .map(p => p.deductible_individual!)
  if (vals.length === 0) return null
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

function buildContent(plan: PlanRecord, countyPlans: PlanRecord[]): MetalContent | null {
  const metal = normalizeMetalLevel(plan.metal_level)
  const deductible = plan.deductible_individual
  const moop = plan.moop_individual
  const avgDed = getCountyAvgDeductible(metal, countyPlans)

  const deductibleVsAvg = (() => {
    if (avgDed == null || deductible == null) return ''
    if (deductible < avgDed) return ` — lower than the county average of ${fmt(avgDed)} for this tier`
    if (deductible > avgDed) return ` — higher than the county average of ${fmt(avgDed)} for this tier`
    return ` — at the county average for this tier`
  })()

  if (metal === 'bronze' || metal === 'expanded_bronze') {
    const paragraphs = [
      `Bronze plans are actuarially valued at approximately 60% of expected covered costs — meaning you are responsible for roughly 40% of costs when care is needed. This higher cost-sharing in exchange for lower monthly premiums is the core Bronze trade-off.`,
      deductible != null
        ? `This plan's ${fmt(deductible)} individual deductible${deductibleVsAvg}. Until that threshold is crossed each plan year, you pay 100% of the contracted rate for most covered services. Preventive care is always at $0 under federal rules.`
        : `Review the plan documents for the individual deductible amount. Until the deductible is met, most non-preventive services are paid out of pocket.`,
      `Bronze plans make economic sense primarily for enrollees who expect minimal healthcare use and want to keep monthly costs low. However, a single hospitalization or serious illness will expose you to significant costs before the plan contributes — the deductible and coinsurance can add up quickly.`,
    ]
    if (metal === 'expanded_bronze') {
      paragraphs.push(
        `This Expanded Bronze plan must cover at least one non-preventive service before the deductible — typically a primary care visit — which improves first-use coverage compared to standard Bronze.`,
      )
    }
    return {
      headline: 'Bronze Plan: Lower Monthly Premium, Higher Out-of-Pocket Exposure',
      paragraphs,
      hsaCallout: (deductible ?? 0) >= 1600,
    }
  }

  if (metal === 'silver') {
    return {
      headline: 'Silver Plan: The Only Tier Eligible for Cost Sharing Reductions',
      paragraphs: [
        `Silver plans cover approximately 70% of expected covered healthcare costs and are the most commonly selected tier on the Marketplace — largely because they are the only tier eligible for Cost Sharing Reductions (CSRs).`,
        `CSRs are automatically applied at enrollment for individuals with household income between 100% and 250% of the Federal Poverty Level (FPL). With CSRs, the same Silver plan has a substantially lower deductible, lower copays, and a lower out-of-pocket maximum — at no extra premium cost. The higher your subsidy eligibility, the more valuable Silver becomes relative to other tiers.`,
        deductible != null
          ? `Without CSR savings, this plan has a ${fmt(deductible)} individual deductible${deductibleVsAvg} and a ${moop != null ? fmt(moop) : 'standard'} out-of-pocket maximum. With a CSR at 200% FPL, both figures could be reduced significantly depending on the specific plan variant.`
          : `Review the plan details at HealthCare.gov to see CSR-enhanced variants, which may carry a lower deductible and out-of-pocket maximum if you qualify.`,
        `If you believe you may qualify for CSRs, compare all available Silver plan variants before selecting one. The CSR benefit is locked in at enrollment and cannot be applied retroactively.`,
      ],
      csrCallout: true,
    }
  }

  if (metal === 'gold') {
    return {
      headline: 'Gold Plan: Predictable Costs for Regular Healthcare Users',
      paragraphs: [
        `Gold plans cover approximately 80% of average expected covered costs — a higher actuarial value than Bronze or Silver, which translates to lower deductibles, lower copays, and lower coinsurance when care is received.`,
        deductible != null
          ? `This plan's ${fmt(deductible)} individual deductible${deductibleVsAvg}. Cost-sharing begins sooner than on most Bronze plans, which is advantageous for enrollees who expect to use the plan regularly.`
          : `Gold deductibles are typically lower than Bronze or Silver — review the plan documents for the specific amount.`,
        `The break-even point for Gold vs. Silver depends on your expected healthcare spending. If your annual out-of-pocket costs on a lower-tier plan would exceed the premium difference, Gold typically reduces your total annual spend. This plan is most cost-effective for enrollees who see specialists regularly, fill multiple prescriptions, or have a planned procedure within the plan year.`,
        `Note: Gold plans are not eligible for Cost Sharing Reductions (CSRs) — those apply only to Silver plans. If you qualify for CSRs and your income is below 250% FPL, compare a CSR-eligible Silver variant before defaulting to Gold.`,
      ],
    }
  }

  if (metal === 'platinum') {
    return {
      headline: 'Platinum Plan: Maximum Coverage, Highest Monthly Premium',
      paragraphs: [
        `Platinum plans cover approximately 90% of expected covered healthcare costs — the highest actuarial value tier on the Marketplace. In exchange, they carry the highest monthly premiums.`,
        `The defining characteristic of Platinum plans is predictability: low deductibles, low copays, and low coinsurance mean that most costs are known in advance. This plan's ${moop != null ? fmt(moop) : 'annual'} out-of-pocket maximum caps your total exposure for in-network care.`,
        `Platinum plans are most cost-effective for enrollees who consistently use significant healthcare services — those managing chronic conditions, taking branded or specialty medications, or requiring frequent specialist or hospital care. For low-use enrollees, the premium premium rarely pays off.`,
        `As with Gold plans, Platinum plans are not eligible for Cost Sharing Reductions (CSRs). If you qualify for CSRs, a CSR-enhanced Silver plan may provide similar cost-sharing at a lower premium.`,
      ],
    }
  }

  if (metal === 'catastrophic') {
    return {
      headline: 'Catastrophic Plan: Eligibility-Restricted, High-Deductible Protection',
      paragraphs: [
        `Catastrophic plans are only available to two groups: individuals under 30, and those who qualify for a hardship exemption or affordability exemption (when the lowest-available Silver plan exceeds a specified percentage of income).`,
        deductible != null
          ? `These plans carry the highest deductibles on the Marketplace. This plan's ${fmt(deductible)} individual deductible means you pay the full contracted rate for virtually all covered services until that threshold is met.`
          : `Catastrophic deductibles are typically at or near the federal out-of-pocket maximum — review the plan documents for the exact amount.`,
        `The limited benefit structure: three primary care visits per year are covered before the deductible, and all ACA-mandated preventive services are covered at $0. Beyond those, the plan pays nothing until the deductible is exhausted.`,
        `Catastrophic plans generally cannot be purchased with Advance Premium Tax Credits (APTC). They are primarily a financial safety net — not a full-benefit plan — and are best suited for otherwise healthy individuals whose primary concern is protection against a catastrophic medical event.`,
      ],
    }
  }

  return null
}

export default function PlanMetalContext({ plan, countyPlans }: Props) {
  const content = buildContent(plan, countyPlans)
  if (!content) return null

  return (
    <section aria-labelledby="metal-context-heading" className="mb-10">
      <h2 id="metal-context-heading" className="text-xl font-semibold text-navy-800 mb-4">
        {content.headline}
      </h2>

      <div className="space-y-3 mb-4">
        {content.paragraphs.map((para, i) => (
          <p key={i} className="text-sm text-neutral-600 leading-relaxed">
            {para}
          </p>
        ))}
      </div>

      {content.csrCallout && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1">
            CSR Eligibility Note
          </p>
          <p className="text-sm text-blue-800">
            Cost Sharing Reductions are only available on Silver plans for enrollees with income
            between 100–250% FPL. If you qualify, you receive a better plan at no additional
            premium.{' '}
            <a href="/contact" className="underline hover:text-blue-900">
              Ask a licensed agent if you qualify →
            </a>
          </p>
        </div>
      )}

      {content.hsaCallout && (
        <div className="rounded-xl border border-green-200 bg-green-50/40 p-4 mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-1">
            Potential HSA Compatibility
          </p>
          <p className="text-sm text-green-800">
            This plan&apos;s deductible may meet IRS thresholds for Health Savings Account (HSA)
            eligibility. HSA contributions are tax-deductible, grow tax-free, and can be withdrawn
            tax-free for qualified medical expenses. Verify HDHP status with the carrier before
            opening an HSA.
          </p>
        </div>
      )}
    </section>
  )
}
