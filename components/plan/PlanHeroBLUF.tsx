/**
 * PlanHeroBLUF — Bottom Line Up Front for plan detail pages.
 *
 * 2–4 sentences. Derives content from metal tier, premium position vs county,
 * and deductible level. Never outputs generic filler — suppresses fields
 * when data is absent rather than substituting placeholder copy.
 */

import type { PlanRecord } from '@/lib/types'

interface Props {
  plan: PlanRecord
  countyDisplay: string
  countyPlans: PlanRecord[]
}

type PremiumPosition = 'lower-cost' | 'mid-range' | 'higher-cost'

function normalizeMetalLevel(level: string): string {
  return level.toLowerCase().replace(/\s+/g, '_')
}

function getPremiumPosition(plan: PlanRecord, countyPlans: PlanRecord[]): PremiumPosition | null {
  if (plan.premiums?.age_40 == null) return null
  const metal = normalizeMetalLevel(plan.metal_level)
  const tierPremiums = countyPlans
    .filter(p => normalizeMetalLevel(p.metal_level) === metal && p.premiums?.age_40 != null)
    .map(p => p.premiums!.age_40!)
    .sort((a, b) => a - b)
  if (tierPremiums.length < 2) return null
  const rank = tierPremiums.filter(p => p < plan.premiums!.age_40!).length
  const pct = rank / tierPremiums.length
  if (pct <= 0.33) return 'lower-cost'
  if (pct <= 0.66) return 'mid-range'
  return 'higher-cost'
}

function buildBLUF(
  plan: PlanRecord,
  countyDisplay: string,
  premiumPosition: PremiumPosition | null,
): string {
  const metal = normalizeMetalLevel(plan.metal_level)
  const metalDisplay = plan.metal_level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const premium = plan.premiums?.age_40
  const deductible = plan.deductible_individual
  const moop = plan.moop_individual

  const premiumContext = (() => {
    if (!premium) return null
    const amt = `$${premium.toLocaleString()}/month for a 40-year-old`
    if (!premiumPosition) return `The monthly premium is ${amt}.`
    const position =
      premiumPosition === 'lower-cost'
        ? 'among the lower-cost options'
        : premiumPosition === 'higher-cost'
        ? 'among the higher-cost options'
        : 'near the midpoint'
    return `At ${amt}, this plan is ${position} for ${metalDisplay} plans in ${countyDisplay}.`
  })()

  const sentences: string[] = []

  if (metal === 'bronze' || metal === 'expanded_bronze') {
    sentences.push(
      `This is a ${metalDisplay} plan from ${plan.issuer_name}, structured to minimize monthly cost in exchange for higher out-of-pocket exposure when care is needed.`,
    )
    if (premiumContext) sentences.push(premiumContext)
    if (deductible != null)
      sentences.push(
        `You pay 100% of most covered services until the $${deductible.toLocaleString()} individual deductible is met.`,
      )
    sentences.push(
      `Best fit: healthy enrollees who rarely use healthcare and want financial protection against catastrophic events.`,
    )
  } else if (metal === 'silver') {
    sentences.push(
      `This is a Silver plan from ${plan.issuer_name} — the most commonly selected tier on the ACA Marketplace.`,
    )
    if (premiumContext) sentences.push(premiumContext)
    sentences.push(
      `Silver is the only tier eligible for Cost Sharing Reductions (CSRs), which can sharply reduce the deductible and out-of-pocket maximum for enrollees below 250% of the Federal Poverty Level.`,
    )
    sentences.push(`Best fit: moderate healthcare users and anyone who may qualify for CSR savings.`)
  } else if (metal === 'gold') {
    sentences.push(
      `This is a Gold plan from ${plan.issuer_name}, which charges a higher monthly premium in exchange for lower costs when care is received.`,
    )
    if (premiumContext) sentences.push(premiumContext)
    if (deductible != null)
      sentences.push(
        `The $${deductible.toLocaleString()} individual deductible means cost-sharing starts sooner than on most Bronze or Silver plans.`,
      )
    sentences.push(
      `Best fit: frequent healthcare users, those managing chronic conditions, or anyone expecting a procedure or specialist visits this year.`,
    )
  } else if (metal === 'platinum') {
    sentences.push(
      `This is a Platinum plan from ${plan.issuer_name} — the highest-coverage tier on the ACA Marketplace, designed for maximum cost predictability.`,
    )
    if (premiumContext) sentences.push(premiumContext)
    if (moop != null)
      sentences.push(
        `Your annual out-of-pocket exposure is capped at $${moop.toLocaleString()} for in-network care.`,
      )
    sentences.push(
      `Best fit: enrollees with high ongoing medical costs who prioritize predictable expenses over lower monthly premiums.`,
    )
  } else if (metal === 'catastrophic') {
    sentences.push(
      `This is a Catastrophic plan from ${plan.issuer_name}, available only to enrollees under 30 or those with a qualifying hardship or affordability exemption.`,
    )
    if (premiumContext) sentences.push(premiumContext)
    if (deductible != null)
      sentences.push(
        `The $${deductible.toLocaleString()} deductible is very high — this plan pays little until that threshold is met, except for preventive care and 3 covered primary care visits per year.`,
      )
    sentences.push(
      `Best fit: young, healthy individuals who want low monthly costs and basic catastrophic protection.`,
    )
  } else {
    // Fallback for any unexpected tier
    sentences.push(
      `This is a ${metalDisplay} plan from ${plan.issuer_name} available in ${countyDisplay}.`,
    )
    if (premiumContext) sentences.push(premiumContext)
    if (deductible != null) sentences.push(`Individual deductible: $${deductible.toLocaleString()}.`)
    if (moop != null) sentences.push(`Out-of-pocket maximum: $${moop.toLocaleString()}.`)
  }

  return sentences.join(' ')
}

export default function PlanHeroBLUF({ plan, countyDisplay, countyPlans }: Props) {
  const premiumPosition = getPremiumPosition(plan, countyPlans)
  const bluf = buildBLUF(plan, countyDisplay, premiumPosition)

  return (
    <div id="plan-bluf" className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 mb-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">
        Plan Summary
      </p>
      <p className="text-sm text-blue-900 leading-relaxed">{bluf}</p>
    </div>
  )
}
