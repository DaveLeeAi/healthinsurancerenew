/**
 * PlanFitSummary — "Who is this plan good for?"
 *
 * Derives fit bullets from deductible, MOOP, premium percentile, and metal tier.
 * Renders a two-column good/tradeoff layout. Returns null if no meaningful points
 * can be derived from available data.
 */

import type { PlanRecord } from '@/lib/types'

interface Props {
  plan: PlanRecord
  countyPlans: PlanRecord[]
}

interface FitPoint {
  label: string
  goodFor: boolean
  reason: string
}

function normalizeMetalLevel(level: string): string {
  return level.toLowerCase().replace(/\s+/g, '_')
}

function buildFitPoints(plan: PlanRecord, countyPlans: PlanRecord[]): FitPoint[] {
  const metal = normalizeMetalLevel(plan.metal_level)
  const deductible = plan.deductible_individual ?? 0
  const moop = plan.moop_individual ?? 0
  const premium = plan.premiums?.age_40

  // Premium percentile within same metal tier
  const tierPremiums = countyPlans
    .filter(p => normalizeMetalLevel(p.metal_level) === metal && p.premiums?.age_40 != null)
    .map(p => p.premiums!.age_40!)
    .sort((a, b) => a - b)
  const isLowPremium =
    premium != null && tierPremiums.length > 1
      ? premium <= tierPremiums[Math.floor(tierPremiums.length / 3)]
      : false

  const isHighDeductible = deductible >= 4000
  const isLowMOOP = moop > 0 && moop <= 4000
  const isHighMOOP = moop > 7000

  const points: FitPoint[] = []

  // Metal-tier primary fit
  if (metal === 'bronze' || metal === 'expanded_bronze') {
    points.push({
      label: 'Rarely uses healthcare',
      goodFor: true,
      reason: `Low monthly premium makes this plan cost-effective when medical services are infrequent.`,
    })
    points.push({
      label: 'Frequent doctor visits or specialist care',
      goodFor: false,
      reason: `A $${deductible.toLocaleString()} deductible means you pay the full contracted rate for most visits until that threshold is met.`,
    })
    if ((deductible ?? 0) >= 1600) {
      points.push({
        label: 'HSA account holders',
        goodFor: true,
        reason: `This high-deductible plan may qualify for HSA contributions — contributions are pre-tax and withdrawals for medical expenses are tax-free.`,
      })
    }
    if (metal === 'expanded_bronze') {
      points.push({
        label: 'Wants at least one covered visit before the deductible',
        goodFor: true,
        reason: `Expanded Bronze plans must cover at least one non-preventive service — typically a primary care visit — before the deductible applies.`,
      })
    }
  }

  if (metal === 'silver') {
    points.push({
      label: 'Income between 100–250% of Federal Poverty Level',
      goodFor: true,
      reason: `Silver is the only tier eligible for Cost Sharing Reductions (CSRs), which can significantly reduce your deductible and out-of-pocket maximum at no additional premium cost.`,
    })
    points.push({
      label: 'Moderate healthcare users',
      goodFor: true,
      reason: `Balanced premium and cost-sharing makes this plan workable for enrollees who need occasional care without overwhelming monthly costs.`,
    })
    points.push({
      label: 'High-volume medical users (multiple prescriptions, frequent specialists)',
      goodFor: false,
      reason: `Without CSR savings, a Gold plan may reduce your total annual costs if you regularly exceed your deductible.`,
    })
  }

  if (metal === 'gold') {
    points.push({
      label: 'Ongoing medical conditions',
      goodFor: true,
      reason: `Lower deductible and predictable cost-sharing reduce financial risk for enrollees with regular care needs.`,
    })
    points.push({
      label: 'Multiple prescriptions',
      goodFor: true,
      reason: `Higher-tier plans typically have lower drug copays and the deductible is met faster when multiple medications are filled regularly.`,
    })
    points.push({
      label: 'Minimizing monthly premium cost',
      goodFor: false,
      reason: `This plan's higher premium is only cost-effective if you actually use significant healthcare services during the year.`,
    })
  }

  if (metal === 'platinum') {
    points.push({
      label: 'High ongoing medical expenses',
      goodFor: true,
      reason: `Platinum's 90% actuarial value means the plan pays more of your costs — ideal when annual out-of-pocket spending consistently approaches the deductible.`,
    })
    points.push({
      label: 'Predictable budgeting',
      goodFor: true,
      reason: `Low deductibles and copays make your healthcare costs more predictable month to month.`,
    })
    points.push({
      label: 'Low healthcare users',
      goodFor: false,
      reason: `High monthly premiums are rarely offset for enrollees who stay healthy and use minimal services.`,
    })
  }

  if (metal === 'catastrophic') {
    points.push({
      label: 'Under 30 or holding a hardship exemption',
      goodFor: true,
      reason: `Catastrophic plans are exclusively available to these groups and offer the lowest possible monthly premiums.`,
    })
    points.push({
      label: 'Any regular healthcare use',
      goodFor: false,
      reason: `The high deductible means virtually all care costs come out of pocket before coverage begins, except for preventive services and 3 primary care visits per year.`,
    })
    points.push({
      label: 'Premium tax credit (APTC) recipients',
      goodFor: false,
      reason: `Catastrophic plans generally cannot be purchased using Advance Premium Tax Credits under standard ACA rules.`,
    })
  }

  // MOOP-based additions
  if (isLowMOOP && !points.some(p => p.label.includes('chronic') || p.label.includes('ongoing'))) {
    points.push({
      label: 'Planned procedures or surgery this year',
      goodFor: true,
      reason: `Out-of-pocket exposure is capped at $${moop.toLocaleString()} — lower than average for this county, limiting worst-case spending.`,
    })
  }

  if (isHighMOOP && metal !== 'bronze' && metal !== 'catastrophic') {
    points.push({
      label: 'High annual medical expenses',
      goodFor: false,
      reason: `The $${moop.toLocaleString()} out-of-pocket maximum is higher than typical — significant financial exposure before the plan covers 100%.`,
    })
  }

  // Family coverage note
  if (plan.deductible_family != null && plan.moop_family != null) {
    const familyDeductible = plan.deductible_family
    if (familyDeductible > 0 && (metal === 'gold' || metal === 'platinum')) {
      points.push({
        label: 'Families with multiple members using healthcare',
        goodFor: true,
        reason: `Family deductible of $${familyDeductible.toLocaleString()} starts accumulating across all household members, which can be reached faster in larger families.`,
      })
    }
  }

  return points.slice(0, 6)
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-green-600 mt-0.5 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg
      className="h-4 w-4 text-amber-500 mt-0.5 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function PlanFitSummary({ plan, countyPlans }: Props) {
  const points = buildFitPoints(plan, countyPlans)
  if (points.length === 0) return null

  const good = points.filter(p => p.goodFor)
  const tradeoffs = points.filter(p => !p.goodFor)

  return (
    <section aria-labelledby="fit-summary-heading" className="mb-10">
      <h2 id="fit-summary-heading" className="text-xl font-semibold text-navy-800 mb-4">
        Who Is This Plan Good For?
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {good.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-3">
              Good match for
            </p>
            <ul className="space-y-3">
              {good.map((p, i) => (
                <li key={i} className="flex gap-2.5">
                  <CheckIcon />
                  <div>
                    <p className="text-sm font-medium text-green-900">{p.label}</p>
                    <p className="text-xs text-green-700 mt-0.5 leading-relaxed">{p.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {tradeoffs.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-3">
              Consider alternatives if you
            </p>
            <ul className="space-y-3">
              {tradeoffs.map((p, i) => (
                <li key={i} className="flex gap-2.5">
                  <WarnIcon />
                  <div>
                    <p className="text-sm font-medium text-amber-900">{p.label}</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{p.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
