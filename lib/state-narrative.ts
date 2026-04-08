/**
 * lib/state-narrative.ts
 *
 * State Narrative Pattern Engine — generates genuinely different prose
 * for each state+drug combination based on 10 distinct coverage patterns.
 *
 * Each pattern produces different sentence structures, openings, framings,
 * and shopper guidance. NOT just state-name + number substitution.
 *
 * Tone: grade 6–8, active voice, "you/your" consumer language.
 */

import type { DrugBaseline, FormularyDrug } from './types'

// ─── Narrative patterns ──────────────────────────────────────────────────────

export type NarrativePattern =
  | 'broad-low-friction'
  | 'broad-high-friction'
  | 'narrow-high-friction'
  | 'narrow-low-friction'
  | 'tier-dominant'
  | 'issuer-variation'
  | 'supply-limits-standout'
  | 'small-market'
  | 'large-market-advantage'
  | 'outlier'

// ─── Input data ──────────────────────────────────────────────────────────────

export interface NarrativeData {
  drugName: string
  stateName: string
  stateCode: string
  totalPlans: number
  priorAuthCount: number
  priorAuthPct: number
  nationalPaPct: number
  dominantTier: string
  nationalDominantTier: string
  stepTherapyCount: number
  quantityLimitCount: number
  quantityLimitPct: number
  tierSpread: number
  medianPlansPerState: number
  hasPriorAuth: boolean
}

// ─── Tier label helpers ──────────────────────────────────────────────────────

const TIER_CONSUMER_LABELS: Record<string, string> = {
  generic: 'generic',
  'preferred-brand': 'preferred brand',
  'non-preferred-brand': 'non-preferred brand',
  specialty: 'specialty',
  preventive: 'preventive',
}

function tierLabel(key: string): string {
  // Normalize varied CMS tier names to consumer labels
  const k = key.toLowerCase().replace(/_/g, '-')
  if (k.includes('generic') && !k.includes('brand')) return 'generic'
  if (k.includes('non-preferred') || k.includes('non_preferred')) return 'non-preferred brand'
  if (k.includes('preferred-brand') || k.includes('preferred-brands')) return 'preferred brand'
  if (k.includes('specialty')) return 'specialty'
  if (k.includes('preventive') || k.includes('preventative')) return 'preventive'
  return TIER_CONSUMER_LABELS[k] ?? k
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Compute median plans per state from baseline ────────────────────────────

export function computeMedianPlans(baseline: DrugBaseline): number {
  const counts = Object.values(baseline.per_state).map(s => s.plan_count).sort((a, b) => a - b)
  if (counts.length === 0) return 15
  const mid = Math.floor(counts.length / 2)
  return counts.length % 2 === 1 ? counts[mid] : Math.round((counts[mid - 1] + counts[mid]) / 2)
}

// ─── Compute tier spread from state results ──────────────────────────────────

export function computeTierSpread(results: FormularyDrug[]): number {
  const tiers = new Set<string>()
  for (const r of results) {
    if (r.drug_tier) {
      const normalized = normalizeTierKey(r.drug_tier)
      tiers.add(normalized)
    }
  }
  return tiers.size
}

function normalizeTierKey(raw: string): string {
  const t = raw.toLowerCase().replace(/_/g, '-').replace(/ /g, '-')
  if (t.includes('generic') && !t.includes('brand')) return 'generic'
  if (t.includes('non-preferred') || t.includes('non_preferred')) return 'non-preferred-brand'
  if (t.includes('preferred-brand') || t.includes('preferred-brands')) return 'preferred-brand'
  if (t.includes('specialty')) return 'specialty'
  if (t.includes('preventive') || t.includes('preventative')) return 'preventive'
  return t
}

// ─── Build NarrativeData from page-level variables ───────────────────────────

export function buildNarrativeData(params: {
  drugName: string
  stateName: string
  stateCode: string
  results: FormularyDrug[]
  baseline: DrugBaseline
  dominantTier: string
  priorAuthCount: number
  stepTherapyCount: number
  quantityLimitCount: number
  hasPriorAuth: boolean
}): NarrativeData {
  const { drugName, stateName, stateCode, results, baseline, dominantTier,
          priorAuthCount, stepTherapyCount, quantityLimitCount, hasPriorAuth } = params
  const stateUpper = stateCode.toUpperCase()
  const stateData = baseline.per_state[stateUpper]

  return {
    drugName,
    stateName,
    stateCode,
    totalPlans: results.length,
    priorAuthCount,
    priorAuthPct: results.length > 0 ? (priorAuthCount / results.length) * 100 : 0,
    nationalPaPct: baseline.prior_auth_pct_national,
    dominantTier: stateData?.dominant_tier ?? dominantTier,
    nationalDominantTier: baseline.dominant_tier_national,
    stepTherapyCount,
    quantityLimitCount,
    quantityLimitPct: results.length > 0 ? (quantityLimitCount / results.length) * 100 : 0,
    tierSpread: computeTierSpread(results),
    medianPlansPerState: computeMedianPlans(baseline),
    hasPriorAuth,
  }
}

// ─── Pattern detection ───────────────────────────────────────────────────────

export function detectNarrativePattern(data: NarrativeData): NarrativePattern {
  const { totalPlans, priorAuthPct, nationalPaPct, dominantTier, nationalDominantTier,
          quantityLimitPct, tierSpread, medianPlansPerState } = data

  const paDiff = priorAuthPct - nationalPaPct
  const isAboveMedian = totalPlans > medianPlansPerState
  const isBelowMedian = totalPlans < medianPlansPerState

  // Small market override — every plan decision matters
  if (totalPlans <= 5) return 'small-market'

  // Outlier — extreme on any metric
  if (Math.abs(paDiff) > 25 || totalPlans > medianPlansPerState * 2.5) return 'outlier'

  // Supply limits standout — QL is the hidden friction
  if (quantityLimitPct > 85 && Math.abs(paDiff) < 10) return 'supply-limits-standout'

  // Broad coverage patterns
  if (isAboveMedian && paDiff < -10) return 'broad-low-friction'
  if (isAboveMedian && paDiff > 10) return 'broad-high-friction'

  // Narrow coverage patterns
  if (isBelowMedian && paDiff > 10) return 'narrow-high-friction'
  if (isBelowMedian && paDiff < -10) return 'narrow-low-friction'

  // Tier-dominant — PA similar but tier placement differs
  if (Math.abs(paDiff) <= 10 && tierLabel(dominantTier) !== tierLabel(nationalDominantTier)) return 'tier-dominant'

  // Issuer variation — wide tier spread within the state
  if (Math.abs(paDiff) <= 10 && tierSpread >= 3) return 'issuer-variation'

  // Large market advantage
  if (totalPlans > 30) return 'large-market-advantage'

  // Default
  return 'tier-dominant'
}

// ─── Quick Answer generator (AEO block) ──────────────────────────────────────

export function generateQuickAnswer(data: NarrativeData, pattern: NarrativePattern): string {
  const { drugName, stateName, totalPlans, priorAuthCount, priorAuthPct,
          nationalPaPct, dominantTier, quantityLimitCount, quantityLimitPct } = data
  const drug = titleCase(drugName)
  const tier = tierLabel(dominantTier)
  const paDiff = Math.abs(priorAuthPct - nationalPaPct)
  const paDirection = priorAuthPct > nationalPaPct ? 'above' : 'below'
  const YEAR = 2026

  switch (pattern) {
    case 'broad-low-friction':
      return `${drug} is widely covered across ${totalPlans} ${stateName} marketplace plans for ${YEAR}, and ${priorAuthPct < 30 ? 'few' : 'fewer than average'} require prior approval — ${Math.round(priorAuthPct)}% compared to the ${Math.round(nationalPaPct)}% national average. Most plans here place it on a ${tier} tier, keeping access relatively straightforward.`

    case 'broad-high-friction':
      return `${totalPlans} ${stateName} marketplace plans include ${drug} for ${YEAR}, but access comes with extra steps. ${Math.round(priorAuthPct)}% require prior approval — well ${paDirection} the ${Math.round(nationalPaPct)}% national average — so your doctor will likely need to submit paperwork before your plan agrees to cover it.`

    case 'narrow-high-friction':
      return `Coverage for ${drug} is limited in ${stateName} — only ${totalPlans} marketplace plans include it for ${YEAR}. Of those, ${priorAuthCount} require prior approval, and most assign a ${tier} tier. With fewer plans to choose from, each carrier's requirements make a bigger difference in your access.`

    case 'narrow-low-friction':
      return `Only ${totalPlans} ${stateName} marketplace plans include ${drug} for ${YEAR}, but the ones that do make it relatively easy to access. Prior approval rates are below the national average at ${Math.round(priorAuthPct)}%, and most assign a ${tier} tier.`

    case 'tier-dominant':
      return `In ${stateName}, the bigger question for ${drug} is not whether plans cover it — ${totalPlans} do — but what tier they place it on. Most ${stateName} plans assign a ${tier} tier, while nationally the most common placement is ${tierLabel(data.nationalDominantTier)}. That tier difference directly affects your monthly cost.`

    case 'issuer-variation':
      return `${drug} is on ${totalPlans} ${stateName} marketplace plans for ${YEAR}, but coverage quality varies sharply by carrier. Some place it on a lower-cost tier with no prior approval, while others assign a higher tier with approval required. In ${stateName}, which carrier you pick matters as much as which metal level you choose.`

    case 'supply-limits-standout':
      return `${drug} appears on ${totalPlans} ${stateName} plans for ${YEAR}, and ${priorAuthPct < 40 ? "most don't require prior approval" : `${Math.round(priorAuthPct)}% require prior approval`}. But watch for supply limits — ${quantityLimitCount} of ${totalPlans} plans restrict how much you can get per month. Check your plan's quantity limits before assuming coverage means easy access.`

    case 'small-market':
      return `Only ${totalPlans} ${stateName} marketplace plan${totalPlans === 1 ? '' : 's'} include${totalPlans === 1 ? 's' : ''} ${drug} for ${YEAR}. In a market this small, each carrier's formulary decision has an outsized impact on your options. Compare ${totalPlans === 1 ? 'this plan' : `all ${totalPlans} plans`} carefully — tier placement and approval rules vary between them.`

    case 'large-market-advantage':
      return `${drug} is covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR} — one of the broader selections in the country. With this many options, you have room to shop for a plan that places it on a lower tier or skips prior approval entirely.`

    case 'outlier': {
      if (priorAuthPct > nationalPaPct + 25) {
        return `${stateName} has one of the highest prior approval rates for ${drug} in the country — ${Math.round(priorAuthPct)}% of plans require it, compared to a ${Math.round(nationalPaPct)}% national average. That means nearly every plan here adds an extra step before your first fill.`
      }
      if (priorAuthPct < nationalPaPct - 25) {
        return `${stateName} stands out for easier access to ${drug}. Only ${Math.round(priorAuthPct)}% of the ${totalPlans} plans here require prior approval, well below the ${Math.round(nationalPaPct)}% national average. Most plans assign a ${tier} tier.`
      }
      // Plan count outlier
      return `${stateName} offers an unusually large selection for ${drug} — ${totalPlans} marketplace plans include it for ${YEAR}, far more than the typical state. That gives you significantly more room to compare tier placements, approval rules, and costs.`
    }
  }
}

// ─── Editorial insight box ───────────────────────────────────────────────────

export function generateInsightBody(data: NarrativeData, pattern: NarrativePattern): string {
  const { drugName, stateName, totalPlans, priorAuthCount, priorAuthPct, nationalPaPct,
          dominantTier, quantityLimitCount, quantityLimitPct, tierSpread } = data
  const drug = titleCase(drugName)
  const tier = tierLabel(dominantTier)
  const natTier = tierLabel(data.nationalDominantTier)

  switch (pattern) {
    case 'broad-low-friction':
      return `${drug} is one of the easier drugs to access in ${stateName}. With ${totalPlans} plans covering it and a prior approval rate of just ${Math.round(priorAuthPct)}%, the main decision is which plan places it on the most favorable tier. Focus on tier placement and deductible structure when comparing — those drive the cost difference between plans here.`

    case 'broad-high-friction':
      return `Even though ${totalPlans} ${stateName} plans include ${drug}, ${Math.round(priorAuthPct)}% of them require prior approval — ${Math.round(Math.abs(priorAuthPct - nationalPaPct))} percentage points above the national average. The high approval rate means your doctor will likely need to submit paperwork before your first fill. When choosing a plan, look for carriers with faster approval turnaround and lower tier placement.`

    case 'narrow-high-friction': {
      // Vary by plan count + PA magnitude so similar narrow states diverge.
      const planPhrase = totalPlans <= 6
        ? `Just ${totalPlans} plans cover`
        : totalPlans <= 9
          ? `Only ${totalPlans} plans cover`
          : `Fewer than a dozen plans (${totalPlans}) cover`
      const paPhrase = priorAuthPct >= 85
        ? `nearly all of them — ${Math.round(priorAuthPct)}% — require prior approval`
        : priorAuthPct >= 75
          ? `${Math.round(priorAuthPct)}% require prior approval`
          : `${priorAuthCount} of those require prior approval`
      const tail = totalPlans <= 6
        ? `With this few options, every plan rule has a bigger impact on your access. Compare each plan's tier, approval policy, and quantity limits before enrolling.`
        : `Verify coverage, tier placement, and approval requirements before enrolling — switching plans mid-year is difficult, and each carrier's rules differ.`
      return `${planPhrase} ${drug} in ${stateName}, and ${paPhrase}, leaving fewer easy paths than in most states. ${tail}`
    }

    case 'narrow-low-friction':
      return `${stateName} has fewer plans covering ${drug} than average, but the ones available tend to have lower approval barriers. The limited selection means your plan choice still matters — compare the ${totalPlans} available options on tier placement and how each handles your deductible for this drug.`

    case 'tier-dominant':
      return `For ${drug} in ${stateName}, tier placement is the main cost variable. Most plans here assign a ${tier} tier, while nationally ${natTier} is more common. That difference means your monthly cost in ${stateName} may be ${tier === 'generic' || tier === 'preferred brand' ? 'lower' : 'higher'} than the national norm — but it depends on which plan you choose.`

    case 'issuer-variation':
      return `${stateName} carriers disagree on how to classify ${drug}. With ${tierSpread} different tier placements found across ${totalPlans} plans, the carrier you pick determines your cost more than any other factor. Check each carrier's tier assignment and prior approval policy side by side before deciding.`

    case 'supply-limits-standout':
      return `The main access concern for ${drug} in ${stateName} is not prior approval — it is supply limits. ${quantityLimitCount} of ${totalPlans} plans (${Math.round(quantityLimitPct)}%) cap how much you can fill at once. If you need a larger monthly supply, look for plans that allow 90-day fills or mail-order exceptions.`

    case 'small-market':
      return `With only ${totalPlans} plan${totalPlans === 1 ? '' : 's'} covering ${drug} in ${stateName}, every detail matters. Check each plan's tier assignment, prior approval policy, and quantity limits. A single plan difference can mean hundreds of dollars per year in out-of-pocket costs.`

    case 'large-market-advantage':
      return `${stateName}'s large marketplace means more leverage for ${drug} shoppers. Across ${totalPlans} plans, you can find meaningful variation in tier placement, approval rules, and cost-sharing. Narrowing by tier and PA status is the fastest way to find your best option.`

    case 'outlier': {
      if (priorAuthPct > nationalPaPct + 25) {
        return `${stateName}'s prior approval rate for ${drug} is an outlier at ${Math.round(priorAuthPct)}% — the national average is ${Math.round(nationalPaPct)}%. Before enrolling, confirm that the plan you're considering has a manageable approval process. Some ${stateName} carriers process approvals faster than others.`
      }
      if (priorAuthPct < nationalPaPct - 25) {
        return `${stateName} is unusually permissive for ${drug} access — only ${Math.round(priorAuthPct)}% of plans require prior approval. That's a real advantage if approval paperwork is a concern. Focus your comparison on tier placement and deductible design instead.`
      }
      return `${stateName} has far more plan options for ${drug} than a typical state. Use that to your advantage — filter by tier placement first, then compare prior approval policies. With ${totalPlans} plans to choose from, you should be able to find favorable terms.`
    }
  }
}

// ─── Cost section intro ──────────────────────────────────────────────────────

export function generateCostContext(data: NarrativeData, pattern: NarrativePattern): string {
  const { drugName, stateName, totalPlans, priorAuthPct, dominantTier, tierSpread } = data
  const drug = titleCase(drugName)
  const tier = tierLabel(dominantTier)
  const natTier = tierLabel(data.nationalDominantTier)

  switch (pattern) {
    case 'broad-low-friction':
      return `With ${totalPlans} plans covering ${drug} in ${stateName}, you have room to shop for the best tier placement. Most plans here assign a ${tier} tier — your cost after deductible depends on where your chosen plan falls.`

    case 'broad-high-friction':
      return `Most ${stateName} plans place ${drug} on a ${tier} tier, but ${Math.round(priorAuthPct)}% also require prior approval — adding a step before your first fill. Your out-of-pocket cost depends on both the tier and how quickly your plan processes the approval.`

    case 'narrow-high-friction': {
      // Vary intro by market size so small narrow states diverge from larger ones.
      const intro = totalPlans <= 6
        ? `${stateName}'s ${totalPlans}-plan field for ${drug} leaves little room to shop on price.`
        : totalPlans <= 9
          ? `With only ${totalPlans} plans covering ${drug} in ${stateName}, you have a narrow set of cost options.`
          : `${totalPlans} ${stateName} plans cover ${drug} — a tighter selection than most states.`
      const tierLine = `Most assign a ${tier} tier, and prior approval applies on ${Math.round(priorAuthPct)}% of them.`
      const tail = totalPlans <= 6
        ? `Run the math on every plan you can — a single tier or copay difference can mean hundreds of dollars over the year.`
        : `Compare all available plans before enrolling — small differences in tier or cost-sharing add up quickly with fewer choices.`
      return `${intro} ${tierLine} ${tail}`
    }

    case 'narrow-low-friction':
      return `${stateName}'s ${totalPlans} plans covering ${drug} generally assign a ${tier} tier with below-average approval requirements. Your main cost variable is deductible structure — check whether your plan applies a separate drug deductible or combines it with medical.`

    case 'tier-dominant':
      return `In ${stateName}, the dominant tier for ${drug} is ${tier} — ${tier !== natTier ? `different from the national norm of ${natTier}` : 'matching the national average'}. Your monthly cost hinges on your plan's tier assignment and where you are in your deductible year.`

    case 'issuer-variation':
      return `${stateName} carriers assign ${drug} to ${tierSpread} different tier levels. That spread means two ${stateName} plans can charge very different amounts for the same drug. Filter plans by tier placement first to narrow the field.`

    case 'supply-limits-standout':
      return `For ${drug} in ${stateName}, the tier placement drives your per-fill cost, but supply limits affect your total annual spending. Plans that restrict monthly quantities may cost you more over a year even if the per-fill copay looks lower.`

    case 'small-market':
      return `In ${stateName}'s small market, each of the ${totalPlans} plan${totalPlans === 1 ? '' : 's'} covering ${drug} has its own tier assignment and cost-sharing rules. Your annual drug cost depends almost entirely on which plan you pick.`

    case 'large-market-advantage':
      return `With ${totalPlans} plans covering ${drug} in ${stateName}, cost variation is significant. Plans on the lowest available tier can save you $40–$80 per month or more compared to those on a higher tier — worth the time to filter and compare.`

    case 'outlier': {
      if (data.priorAuthPct > data.nationalPaPct + 25) {
        return `In ${stateName}, nearly all plans require prior approval for ${drug}, which can delay your first fill. Once approved, your ongoing cost depends on tier placement — most plans here assign a ${tier} tier.`
      }
      if (data.priorAuthPct < data.nationalPaPct - 25) {
        return `${stateName}'s low approval barriers for ${drug} mean your cost comparison can focus on tier placement and deductible design. Most plans assign a ${tier} tier — check whether your plan covers it before or after the deductible is met.`
      }
      return `${stateName}'s large plan selection for ${drug} means real cost variation between options. The difference between a favorable and unfavorable tier placement can mean $50–$100 per month. Use that competition to your advantage when comparing.`
    }
  }
}

// ─── Localized section content ───────────────────────────────────────────────

export function generateLocalizedSections(data: NarrativeData, pattern: NarrativePattern): {
  tierBreakdown: string
  pharmacyChoice: string
  deductibleContext: string
  paNote: string
} {
  const { drugName, stateName, totalPlans, priorAuthCount, priorAuthPct,
          nationalPaPct, dominantTier, tierSpread, quantityLimitCount } = data
  const drug = titleCase(drugName)
  const tier = tierLabel(dominantTier)
  const natTier = tierLabel(data.nationalDominantTier)

  // ── Tier breakdown — varies by pattern ──
  let tierBreakdown: string

  switch (pattern) {
    case 'broad-low-friction':
    case 'large-market-advantage':
      tierBreakdown = `Across ${totalPlans} ${stateName} plans, the most common tier for ${drug} is ${tier}. With this many plans, you can often find one that places it on a more favorable tier — worth checking before you enroll.`
      break
    case 'broad-high-friction':
      tierBreakdown = `Most ${stateName} plans assign ${drug} to a ${tier} tier, but the high prior approval rate means tier placement is only part of the picture. Compare both tier and approval speed when evaluating plans.`
      break
    case 'narrow-high-friction':
    case 'narrow-low-friction':
      // Vary tier breakdown by exact plan count band so similar narrow states diverge.
      tierBreakdown = totalPlans <= 6
        ? `Across ${stateName}'s ${totalPlans} plans, ${drug} most often lands on a ${tier} tier. In a market this tight, that single tier choice drives most of what you'll pay.`
        : totalPlans <= 9
          ? `${stateName}'s ${totalPlans} plans most commonly assign ${drug} to a ${tier} tier. With this few options, a one-tier difference between plans can swing your monthly cost noticeably.`
          : `With ${totalPlans} plans available in ${stateName}, the typical placement for ${drug} is ${tier}. Fewer options means tier differences between plans have a bigger impact on your cost.`
      break
    case 'tier-dominant':
      tierBreakdown = `${stateName} plans most commonly assign ${drug} to a ${tier} tier — ${tier !== natTier ? `while nationally, ${natTier} is more typical` : 'in line with the national pattern'}. The tier your plan assigns is the biggest factor in what you pay each month.`
      break
    case 'issuer-variation':
      tierBreakdown = `${stateName} carriers assign ${drug} across ${tierSpread} different tiers. That means two plans with the same metal level can charge very different amounts for this drug. Check the tier assignment on each plan you're considering.`
      break
    case 'supply-limits-standout':
      tierBreakdown = `Most ${stateName} plans place ${drug} on a ${tier} tier, but ${quantityLimitCount} of ${totalPlans} also limit your monthly supply. A plan with a slightly higher copay but no supply limit could cost you less over the full year.`
      break
    case 'small-market':
      tierBreakdown = `In ${stateName}'s small market, the ${totalPlans} plan${totalPlans === 1 ? '' : 's'} covering ${drug} ${totalPlans === 1 ? 'assigns' : 'assign'} ${totalPlans === 1 ? 'a' : 'varying'} tier${totalPlans === 1 ? '' : 's'}. With so few options, that assignment drives most of your cost.`
      break
    case 'outlier':
      tierBreakdown = `${stateName} stands out nationally for ${drug} coverage. The dominant tier here is ${tier}, and ${Math.round(priorAuthPct)}% of plans require prior approval — ${priorAuthPct > nationalPaPct ? 'above' : 'below'} the ${Math.round(nationalPaPct)}% national average.`
      break
  }

  // ── Pharmacy choice — varies by market size ──
  let pharmacyChoice: string
  if (totalPlans > 30) {
    pharmacyChoice = `With ${totalPlans} plans in ${stateName}, preferred pharmacy networks vary widely. Check whether your regular pharmacy is in-network — and whether mail-order could save you more on ${drug}.`
  } else if (totalPlans <= 5) {
    pharmacyChoice = `In ${stateName}'s small market, your pharmacy options for ${drug} may be more limited. Confirm your preferred pharmacy is in-network on the plan you're considering, and ask about mail-order pricing.`
  } else {
    pharmacyChoice = `Your plan's price for ${drug} varies by pharmacy. Preferred pharmacies and mail-order often come in lower — worth checking before your first fill, especially in ${stateName} where plan options are more limited.`
  }

  // ── Deductible context — varies by tier ──
  let deductibleContext: string
  if (tier === 'generic' || tier === 'preventive') {
    deductibleContext = `Some ${stateName} plans cover ${drug} before your deductible is met — meaning you'd pay just the copay from day one. Look for this in your Summary of Benefits and Coverage.`
  } else if (tier === 'specialty') {
    deductibleContext = `For specialty-tier drugs like ${drug}, most ${stateName} plans require you to meet your full deductible first. That means higher out-of-pocket costs early in the year — your plan's deductible amount is a critical comparison point.`
  } else {
    deductibleContext = `Whether your plan has a separate drug deductible or combines it with medical determines when your lower copay for ${drug} kicks in. This structure varies across ${stateName} plans and is worth checking before enrollment.`
  }

  // ── PA note — varies by pattern ──
  let paNote: string
  switch (pattern) {
    case 'broad-high-friction':
    case 'narrow-high-friction':
      paNote = `Prior approval rates for ${drug} in ${stateName} run above the national average at ${Math.round(priorAuthPct)}%. Confirm your plan's approval process and expected timeline before enrolling — it directly affects when you can start filling this prescription.`
      break
    case 'broad-low-friction':
    case 'narrow-low-friction':
      paNote = `${stateName} plans are less likely to require prior approval for ${drug} than the national average — ${Math.round(priorAuthPct)}% vs. ${Math.round(nationalPaPct)}% nationally. That's one fewer hurdle to deal with here.`
      break
    case 'outlier':
      if (priorAuthPct > nationalPaPct + 25) {
        paNote = `${stateName}'s ${Math.round(priorAuthPct)}% prior approval rate for ${drug} is among the highest in the country. Factor in the approval timeline when choosing a plan — some carriers process requests faster than others.`
      } else if (priorAuthPct < nationalPaPct - 25) {
        paNote = `${stateName}'s low prior approval rate for ${drug} — just ${Math.round(priorAuthPct)}% — means most plans here let you fill the prescription without extra steps.`
      } else {
        paNote = `${priorAuthCount} of ${totalPlans} ${stateName} plans require prior approval for ${drug}. With this many plan options, you may be able to find one that does not require it.`
      }
      break
    case 'small-market':
      paNote = `In ${stateName}'s small market, ${priorAuthCount === 0 ? 'none' : `${priorAuthCount} of ${totalPlans}`} plan${totalPlans === 1 ? '' : 's'} require${totalPlans === 1 ? 's' : ''} prior approval for ${drug}. With limited options, this is worth confirming before you enroll.`
      break
    default:
      if (priorAuthCount > 0) {
        paNote = `${priorAuthCount} of ${totalPlans} ${stateName} plans require prior approval for ${drug}. Your doctor's office typically handles the paperwork, but timelines vary by carrier.`
      } else {
        paNote = `None of the ${totalPlans} ${stateName} plans we reviewed require prior approval for ${drug}. Your doctor can prescribe it and your pharmacy can fill it without an extra approval step.`
      }
      break
  }

  return { tierBreakdown, pharmacyChoice, deductibleContext, paNote }
}

// ─── Insight box heading (varies by pattern) ─────────────────────────────────

export function getInsightHeading(data: NarrativeData, pattern: NarrativePattern): string {
  const { drugName, stateName } = data
  const drug = titleCase(drugName)

  switch (pattern) {
    case 'small-market':
      return `Why plan choice matters more in ${stateName}`
    case 'broad-high-friction':
      return `Where ${stateName} shoppers run into barriers`
    case 'narrow-high-friction':
      return `What limits access to ${drug} in ${stateName}`
    case 'broad-low-friction':
      return `What ${stateName} shoppers should still check`
    case 'narrow-low-friction':
      return `What to know about ${drug} access in ${stateName}`
    case 'tier-dominant':
      return `Why tier placement matters most in ${stateName}`
    case 'issuer-variation':
      return `Why your carrier choice matters in ${stateName}`
    case 'supply-limits-standout':
      return `The hidden cost factor for ${drug} in ${stateName}`
    case 'large-market-advantage':
      return `How to use ${stateName}'s plan options to your advantage`
    case 'outlier':
      return `What makes ${stateName} different for ${drug}`
  }
}

// ─── Conditional pattern blocks ──────────────────────────────────────────────

export interface ConditionalBlock {
  id: string
  heading: string
  body: string
  /** Strength score used to pick the top 2 blocks when multiple triggers fire. */
  strength: number
}

/**
 * Returns 0–2 conditional content blocks based on the narrative pattern + data.
 * Each block must contain state-specific numbers. Blocks are scored by data
 * deviation strength and the top 2 are returned. Returns [] if nothing fires.
 */
export function getConditionalBlocks(
  data: NarrativeData,
  pattern: NarrativePattern
): ConditionalBlock[] {
  const {
    drugName, stateName, totalPlans,
    priorAuthCount, priorAuthPct, nationalPaPct,
    dominantTier, nationalDominantTier,
    quantityLimitCount, quantityLimitPct,
    tierSpread,
  } = data
  const drug = titleCase(drugName)
  const tier = tierLabel(dominantTier)
  const natTier = tierLabel(nationalDominantTier)
  const paDiff = priorAuthPct - nationalPaPct

  const candidates: ConditionalBlock[] = []

  // ── Module 1: Small market effect ──
  // Boost: when this rare trigger fires, prioritize it strongly so similar
  // narrow-market states differentiate from one another (e.g. Iowa 6 vs Kansas 9).
  if (pattern === 'small-market' || totalPlans <= 6) {
    candidates.push({
      id: 'small-market',
      heading: `Why plan count matters in ${stateName}`,
      body: `With only ${totalPlans} plan${totalPlans === 1 ? '' : 's'} covering ${drug} in ${stateName}, each carrier's formulary decision has an outsized impact. If one carrier drops coverage or tightens restrictions, your options shrink fast. Compare ${totalPlans === 1 ? 'this plan' : `all ${totalPlans} plans`} carefully before enrolling.`,
      strength: 30 + Math.max(0, 10 - totalPlans),
    })
  }

  // ── Module 2: High approval friction warning ──
  const isHighFrictionPattern =
    pattern === 'broad-high-friction' ||
    pattern === 'narrow-high-friction' ||
    (pattern === 'outlier' && priorAuthPct > nationalPaPct + 25)
  if (isHighFrictionPattern || priorAuthPct > 75) {
    // Vary the sentence template by PA magnitude so similar high-PA states diverge.
    let body: string
    if (priorAuthPct >= 90) {
      body = `Almost every ${stateName} plan — ${priorAuthCount} of ${totalPlans} — requires prior approval for ${drug}, far above the ${Math.round(nationalPaPct)}% national average. Plan on your doctor submitting paperwork before you can fill the prescription, and ask each plan how long approvals usually take.`
    } else if (priorAuthPct >= 80) {
      body = `In ${stateName}, ${Math.round(priorAuthPct)}% of plans require prior approval for ${drug} — well above the ${Math.round(nationalPaPct)}% national average. That extra step adds days or weeks before your first fill. Ask each plan about its approval timeline and whether expedited reviews are available.`
    } else {
      body = `Roughly ${priorAuthCount} of ${totalPlans} ${stateName} plans require prior approval for ${drug}, putting the state above the ${Math.round(nationalPaPct)}% national average. Build that paperwork step into your timeline, and ask the plan what documentation your doctor needs to submit.`
    }
    candidates.push({
      id: 'high-pa-friction',
      heading: `Prior approval is a bigger factor in ${stateName}`,
      body,
      strength: Math.max(Math.round(Math.abs(paDiff)), 5),
    })
  }

  // ── Module 3: Tier-driven cost warning ──
  const tierIsHigher = tier === 'specialty' || tier === 'non-preferred brand'
  const tierDiffersFromNational = tier !== natTier
  if (pattern === 'tier-dominant' || tierDiffersFromNational || tierIsHigher) {
    const costWord = tier === 'generic' || tier === 'preferred brand' ? 'less' : 'more'
    const range = tier === 'specialty' ? '$80–$300' : tier === 'non-preferred brand' ? '$30–$80' : '$15–$50'
    const compareLine = tierDiffersFromNational
      ? `In ${stateName}, most plans place ${drug} on a ${tier} tier, while the national average is ${natTier}. That tier gap alone can mean ${range} ${costWord} per month after your deductible.`
      : `In ${stateName}, most plans place ${drug} on a ${tier} tier — the same as the national average — but tier placement still drives most of what you pay. Plans assigning ${drug} to a more favorable tier can save you ${range} per month after your deductible.`
    candidates.push({
      id: 'tier-driven-cost',
      heading: `Tier placement drives most of the cost difference in ${stateName}`,
      body: `${compareLine} When comparing plans, check the tier assignment first — it has the biggest impact on what you actually pay.`,
      // Strength: higher when tier differs from national or is a higher-cost tier
      strength: (tierDiffersFromNational ? 15 : 0) + (tierIsHigher ? 10 : 0) + 5,
    })
  }

  // ── Module 4: Carrier comparison matters here ──
  if (pattern === 'issuer-variation' || tierSpread >= 3) {
    const tier1 = tier === 'generic' || tier === 'preferred brand' ? 'lower' : 'higher'
    const tier2 = tier1 === 'lower' ? 'higher' : 'lower'
    // Vary phrasing by tier-spread AND market size so similar-spread states diverge.
    let body: string
    const marketSize = totalPlans <= 6 ? 'tiny' : totalPlans <= 12 ? 'small' : 'broader'
    if (tierSpread >= 5 && marketSize === 'tiny') {
      body = `Even with only ${totalPlans} plans, ${stateName} carriers disagree sharply on ${drug} — ${tierSpread} different tier assignments show up across the ${totalPlans}-plan field. One carrier may put it on a ${tier1}-cost tier with no approval needed, while another places it on a ${tier2}-cost tier and requires prior approval. In a market this small, picking the right carrier shapes almost everything you'll pay.`
    } else if (tierSpread >= 5 && marketSize === 'small') {
      body = `${stateName}'s ${totalPlans} plans split ${drug} across ${tierSpread} tier levels — a wider spread than most small markets show. One plan might list it on a ${tier1}-cost tier with no approval needed; another puts it on a ${tier2}-cost tier with prior approval required. Carrier choice will move your monthly cost more than metal level here.`
    } else if (tierSpread >= 5) {
      body = `${stateName}'s ${totalPlans} plans place ${drug} on ${tierSpread} different tiers depending on the carrier. With this much variation, comparing carriers side by side matters more than picking a metal level — two plans at the same Silver tier can charge very different amounts.`
    } else if (tierSpread === 4) {
      body = `Across ${totalPlans} ${stateName} plans, ${drug} lands on ${tierSpread} different tier levels depending on the carrier. That spread alone can swing your monthly cost by $30 or more. Compare carriers side by side before locking in a plan — the metal level alone won't tell you the full story.`
    } else {
      body = `${stateName} plans split ${drug} across ${tierSpread} tier levels — fewer than the most fragmented states, but enough that two plans at the same metal level can charge meaningfully different amounts. Check each carrier's tier and approval rules before you decide.`
    }
    candidates.push({
      id: 'carrier-comparison',
      heading: `In ${stateName}, which carrier you choose matters most`,
      body,
      strength: tierSpread * 4,
    })
  }

  // ── Module 5: Supply limits are the hidden friction ──
  if (pattern === 'supply-limits-standout' || quantityLimitPct > 80) {
    candidates.push({
      id: 'supply-limits',
      heading: `Watch for supply limits in ${stateName}`,
      body: `${quantityLimitCount} of ${totalPlans} ${stateName} plans limit how much ${drug} you can get per fill — typically a 30-day supply. If you need a larger quantity or use a higher dose, check whether your plan allows 90-day fills or mail-order options before enrolling.`,
      // Strength scales with how high QL pct is
      strength: Math.round(quantityLimitPct / 5),
    })
  }

  // Sort by strength descending and return top 2
  return candidates
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 2)
}
