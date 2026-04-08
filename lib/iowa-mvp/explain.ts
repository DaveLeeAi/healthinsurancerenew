/**
 * lib/iowa-mvp/explain.ts — Grounded explanation generator for Iowa MVP.
 *
 * Every explanation is derived from computed scoring data and structured plan facts.
 * The LLM never invents coverage facts — this module only translates data into
 * consumer-friendly language.
 */

import type {
  IowaPlan,
  ScoreDimension,
  DrugMatch,
  UserProfile,
} from './types'

// ---------------------------------------------------------------------------
// Why it may fit
// ---------------------------------------------------------------------------

interface SubsidyInfo {
  monthly_aptc: number
  net_monthly_premium: number | null
  subsidy_eligible: boolean
}

export function generateWhyItMayFit(
  plan: IowaPlan,
  dimensions: ScoreDimension[],
  subsidy: SubsidyInfo,
  drugMatches: DrugMatch[],
): string[] {
  const reasons: string[] = []

  // Premium / affordability
  if (subsidy.subsidy_eligible && subsidy.monthly_aptc > 0) {
    reasons.push(
      `With an estimated tax credit of $${subsidy.monthly_aptc}/month, the net premium may be around $${subsidy.net_monthly_premium ?? '—'}/month.`
    )
  } else if (subsidy.net_monthly_premium != null) {
    reasons.push(
      `Estimated monthly premium: $${subsidy.net_monthly_premium}.`
    )
  }

  // Metal level context
  const metal = plan.metal_level.toLowerCase()
  if (metal.includes('gold')) {
    reasons.push('Gold plans typically cover a higher share of costs when you use care, which may reduce your out-of-pocket spending.')
  } else if (metal.includes('silver')) {
    reasons.push('Silver plans offer a balance between monthly premium and out-of-pocket costs. If you qualify, cost-sharing reductions can lower your deductible and copays.')
  } else if (metal.includes('bronze')) {
    reasons.push('Bronze plans generally have the lowest monthly premiums, which can work well if you expect low healthcare usage.')
  }

  // Deductible
  const ded = plan.deductible_individual
  if (ded != null) {
    if (ded <= 2000) {
      reasons.push(`The $${ded.toLocaleString()} deductible is relatively low, meaning the plan starts sharing costs sooner.`)
    } else if (ded >= 7000) {
      reasons.push(`The $${ded.toLocaleString()} deductible is high, but the lower premium may offset this if you don't expect frequent care.`)
    }
  }

  // MOOP
  const moop = plan.oop_max_individual
  if (moop != null && moop <= 5000) {
    reasons.push(`The maximum out-of-pocket of $${moop.toLocaleString()} limits your worst-case spending in a plan year.`)
  }

  // Drug matches
  const foundDrugs = drugMatches.filter((d) => d.found && d.carrier_verified)
  if (foundDrugs.length > 0) {
    reasons.push(
      `${foundDrugs.length} of your medications were found in this plan's formulary.`
    )
  }

  // Plan type
  if (plan.plan_type === 'PPO') {
    reasons.push('PPO plans typically offer more flexibility in choosing providers, including out-of-network options.')
  }

  // Strong score dimensions
  const strongDims = dimensions.filter((d) => d.score >= 80)
  if (strongDims.length >= 3) {
    reasons.push(
      `This plan scores well across ${strongDims.length} of ${dimensions.length} evaluation dimensions.`
    )
  }

  return reasons
}

// ---------------------------------------------------------------------------
// Trade-offs
// ---------------------------------------------------------------------------

export function generateTradeoffs(
  plan: IowaPlan,
  dimensions: ScoreDimension[],
  subsidy: SubsidyInfo,
  profile: UserProfile,
): string[] {
  const tradeoffs: string[] = []

  // High deductible + high usage
  const ded = plan.deductible_individual
  if (ded != null && ded >= 5000 && profile.expected_usage === 'high') {
    tradeoffs.push(
      `With a $${ded.toLocaleString()} deductible and high expected usage, you may pay significant costs before the plan covers most services.`
    )
  }

  // Low deductible but high premium
  if (ded != null && ded <= 2000 && subsidy.net_monthly_premium != null && subsidy.net_monthly_premium > 400) {
    tradeoffs.push(
      'Lower deductibles often come with higher monthly premiums. Consider whether the premium fits your monthly budget.'
    )
  }

  // HMO referral requirement
  if (plan.plan_type === 'HMO') {
    tradeoffs.push(
      'HMO plans typically require referrals to see specialists and limit coverage to in-network providers only.'
    )
  }

  // EPO no out-of-network
  if (plan.plan_type === 'EPO') {
    tradeoffs.push(
      'EPO plans generally do not cover out-of-network care except in emergencies. Verify that your providers are in-network.'
    )
  }

  // Weak dimensions
  const weakDims = dimensions.filter((d) => d.score < 50)
  for (const dim of weakDims) {
    if (dim.name === 'Drug Coverage Fit') {
      tradeoffs.push(
        'Drug coverage could not be fully verified for this plan. Check the carrier formulary before enrolling.'
      )
    }
    if (dim.name === 'Affordability' && subsidy.net_monthly_premium != null) {
      tradeoffs.push(
        `The estimated monthly cost of $${subsidy.net_monthly_premium} may be a stretch for your budget. Compare with lower-premium options.`
      )
    }
  }

  // MOOP is high
  const moop = plan.oop_max_individual
  if (moop != null && moop >= 8000) {
    tradeoffs.push(
      `The $${moop.toLocaleString()} out-of-pocket maximum means your worst-case costs in a plan year are relatively high.`
    )
  }

  // Subsidy cliff warning
  if (subsidy.subsidy_eligible && subsidy.monthly_aptc > 0) {
    tradeoffs.push(
      'Tax credit estimates are approximate. Your actual credit depends on your final income and the benchmark plan in your area.'
    )
  }

  // Ensure at least one trade-off
  if (tradeoffs.length === 0) {
    tradeoffs.push(
      'No major trade-offs identified based on available data. Still verify providers, drug coverage, and final costs before enrolling.'
    )
  }

  return tradeoffs
}
