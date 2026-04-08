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
import type { DrugArchetype, DrugClassification } from './drug-archetype'
import { getArchetypeProfile } from './drug-archetype'

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
  /** Drug archetype — drives voice, emphasis, and section priority. */
  archetype: DrugArchetype
  classification: DrugClassification
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
  classification: DrugClassification
}): NarrativeData {
  const { drugName, stateName, stateCode, results, baseline, dominantTier,
          priorAuthCount, stepTherapyCount, quantityLimitCount, hasPriorAuth,
          classification } = params
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
    archetype: classification.archetype,
    classification,
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

// ─── Archetype-aware voice helpers ───────────────────────────────────────────

/**
 * Produces an archetype-flavored opener sentence that combines drug-class
 * voice with state pattern context. Returns null for the 'other' archetype
 * (which falls back to the pattern-only voice).
 */
function archetypeOpener(data: NarrativeData, pattern: NarrativePattern): string | null {
  const { archetype, drugName, stateName, totalPlans, priorAuthPct,
          quantityLimitPct, dominantTier } = data
  const drug = titleCase(drugName)
  const tier = tierLabel(dominantTier)
  const YEAR = 2026

  switch (archetype) {
    case 'common-generic-chronic':
      // Cost-first, reassuring, brief.
      if (totalPlans >= data.medianPlansPerState) {
        return `${drug} is one of the most widely covered drugs in ${stateName} — ${totalPlans} of the marketplace plans for ${YEAR} include it, almost always on a ${tier} tier.`
      }
      return `${drug} is a widely used generic, covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Cost depends mainly on which tier your plan assigns.`

    case 'common-generic-acute':
      // Brief, simple, near-universal.
      return `${drug} is covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR} — coverage is near-universal, and out-of-pocket cost is typically minimal for a short course.`

    case 'statin-cholesterol':
      // Very brief, "tier is the only question".
      return `Statins like ${drug} are among the most broadly covered drugs nationwide. In ${stateName}, ${totalPlans} marketplace plans include it for ${YEAR}, almost always on a low-cost tier.`

    case 'thyroid-hormone':
      // Brand vs generic substitution matters.
      return `${drug} is covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Because thyroid drugs have a narrow therapeutic range, brand-versus-generic substitution can matter — check whether your plan covers the specific version your doctor prescribes.`

    case 'mental-health':
      // Respectful, parity-aware.
      return `${drug} is covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Mental health medication coverage is protected by federal parity law — plans must cover it comparably to physical health drugs.`

    case 'inhaler-respiratory':
      // Device-focused.
      return `${drug} is covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR}. For inhalers, the device type your doctor prescribes affects coverage — check whether your plan covers the exact form, not just the active ingredient.`

    case 'controlled-substance':
      // Refill-rules-first, no judgment.
      return `${drug} is covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Because it is a controlled substance, refill rules and quantity limits are tighter than other drugs — most plans cap fills at a 30-day supply.`

    case 'injectable-diabetes':
      // IRA $35 cap is the lead story.
      return `${drug} is covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Under the Inflation Reduction Act, your insulin copay is capped at $35 per month on every marketplace plan — regardless of tier placement.`

    case 'brand-chronic':
      // Cost + PA-aware.
      return `${drug} is a brand-name drug covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR}. ${Math.round(priorAuthPct)}% require prior approval, and tier placement varies widely by carrier — both factors affect what you pay.`

    case 'glp1-weight-diabetes':
      // Access-first, three-things framing.
      if (priorAuthPct >= 70) {
        return `${drug} access in ${stateName} is restricted — ${totalPlans} marketplace plans cover it for ${YEAR}, and ${Math.round(priorAuthPct)}% require prior approval. Coverage alone does not guarantee easy access.`
      }
      return `${drug} access in ${stateName} depends on three things: whether the plan covers it (${totalPlans} of the marketplace plans for ${YEAR} do), whether it requires prior approval (${Math.round(priorAuthPct)}%), and what the supply limits look like (${Math.round(quantityLimitPct)}% of plans cap monthly fills).`

    case 'specialty-biologic':
      // Serious, plan-shopping-critical.
      if (priorAuthPct >= 80) {
        return `${drug} is a specialty biologic covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR} — but ${Math.round(priorAuthPct)}% require prior approval and nearly all assign it to a specialty tier. If you take ${drug}, plan selection is one of the most consequential healthcare decisions you make this year.`
      }
      return `${drug} is a specialty biologic covered by ${totalPlans} ${stateName} marketplace plans for ${YEAR}, almost always on a specialty tier with prior approval required. Cost ranges are wide, so plan selection has an outsized financial impact.`

    case 'other':
      return null
  }
}

/**
 * Returns the archetype-specific shopper guidance line. Used at the end
 * of cost-context and insight blocks. Returns null for 'other'.
 */
function archetypeCta(data: NarrativeData): string | null {
  const profile = getArchetypeProfile(data.archetype)
  switch (profile.ctaAngle) {
    case 'compare-tier':
      return `Compare tier placement across plans — that is where the cost difference lives.`
    case 'check-three-things':
      return `Check three things on every plan: does it cover the drug, does it require prior approval, and what are the supply limits.`
    case 'plan-shopping-critical':
      return `For specialty drugs, plan selection has an outsized impact on your annual cost — compare formulary placement and prior approval timelines side by side.`
    case 'verify-parity-coverage':
      return `Federal parity law requires plans to cover mental health medications comparably to physical health drugs — verify that your plan applies the same tier and approval rules.`
    case 'check-quantity-rules':
      return `Confirm the plan's monthly supply limit, refill timing, and whether prior approval applies before you enroll.`
    case 'cap-applies-everywhere':
      return `Your insulin copay is capped at $35 per month on every marketplace plan — focus your comparison on premium and deductible instead.`
    case 'verify-device-coverage':
      return `For inhalers, confirm your plan covers the specific device your doctor prescribes — generic substitution is not always 1:1.`
    case 'brand-vs-generic-matters':
      return `If your doctor prescribes a specific brand, check whether the plan covers it or only the generic substitute.`
    case 'compare-tier-and-pa':
      return `Compare both tier placement and prior approval policy — for brand drugs, both affect your monthly cost.`
    case 'data-driven':
    default:
      return null
  }
}

/**
 * State-pattern tail sentence that follows an archetype opener. Keeps the
 * state pattern signal alive without restating drug class context.
 */
function quickAnswerPatternTail(data: NarrativeData, pattern: NarrativePattern): string {
  const { stateName, totalPlans, priorAuthPct, nationalPaPct,
          quantityLimitCount, tierSpread } = data
  const profile = getArchetypeProfile(data.archetype)

  // Common-generic and statin: skip the tail when copy length is 'short'
  // and the pattern is broad/easy. Brevity is the point.
  if (profile.copyLength === 'short' &&
      (pattern === 'broad-low-friction' || pattern === 'large-market-advantage')) {
    return ''
  }

  switch (pattern) {
    case 'broad-low-friction':
      return `Most ${stateName} carriers also keep prior approval rates low — easier than the national average.`
    case 'broad-high-friction':
      return `${stateName} sits well above the national average for prior approval — ${Math.round(priorAuthPct)}% vs. ${Math.round(nationalPaPct)}% nationally.`
    case 'narrow-high-friction':
      return `Few ${stateName} plans cover it, and most of those that do require prior approval — every plan rule has a bigger impact in a market this small.`
    case 'narrow-low-friction':
      return `${stateName} has fewer plans than average, but the ones that cover it tend to have lower approval barriers.`
    case 'tier-dominant':
      return `${stateName} carriers cluster on a single tier — that placement drives most of what you pay here.`
    case 'issuer-variation':
      return `${stateName} carriers split across ${tierSpread} different tier levels, so carrier choice matters as much as metal level.`
    case 'supply-limits-standout':
      return `${quantityLimitCount} of ${totalPlans} ${stateName} plans cap the monthly fill — supply limits are the hidden friction here.`
    case 'small-market':
      return `With only ${totalPlans} ${stateName} plans, every formulary decision has outsized impact on your options.`
    case 'large-market-advantage':
      return `${stateName}'s broad selection gives you room to compare and shop for favorable terms.`
    case 'outlier':
      if (priorAuthPct > nationalPaPct + 25) {
        return `${stateName} stands out nationally — ${Math.round(priorAuthPct)}% prior approval vs. ${Math.round(nationalPaPct)}% nationally.`
      }
      if (priorAuthPct < nationalPaPct - 25) {
        return `${stateName} is unusually permissive — only ${Math.round(priorAuthPct)}% of plans require prior approval, well below the national norm.`
      }
      return `${stateName} offers an unusually large plan selection — far more comparison room than a typical state.`
  }
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

  // Archetype-aware voice — when an opener is available, combine it with a
  // state-pattern context tail. Otherwise fall back to pattern-only voice.
  const opener = archetypeOpener(data, pattern)
  if (opener) {
    const tail = quickAnswerPatternTail(data, pattern)
    return tail ? `${opener} ${tail}` : opener
  }

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
  const { drugName, stateName, totalPlans, priorAuthPct, dominantTier } = data
  const drug = titleCase(drugName)
  const tier = tierLabel(dominantTier)
  const profile = getArchetypeProfile(data.archetype)
  const cta = archetypeCta(data)

  // Short-copy archetypes (statins, common generic acute) get a compressed
  // insight body — one pattern sentence + CTA. Skip the long pattern body.
  if (profile.copyLength === 'short' &&
      (pattern === 'broad-low-friction' || pattern === 'large-market-advantage' ||
       pattern === 'tier-dominant')) {
    const lead = pattern === 'broad-low-friction' || pattern === 'large-market-advantage'
      ? `${drug} is one of the easier drugs to access in ${stateName}. With ${totalPlans} plans covering it and prior approval needed on just ${Math.round(priorAuthPct)}%, the main decision is which plan places it on the most favorable tier.`
      : `For ${drug} in ${stateName}, tier placement is the main cost variable — most plans assign a ${tier} tier.`
    return cta ? `${lead} ${cta}` : lead
  }

  // Long-copy archetypes (specialty biologic, GLP-1) get a leading archetype
  // sentence prepended to the pattern body, plus CTA appended.
  if (profile.copyLength === 'long') {
    const archetypeLead = archetypeLongLead(data)
    const patternBody = generatePatternInsightBody(data, pattern)
    return cta ? `${archetypeLead} ${patternBody} ${cta}` : `${archetypeLead} ${patternBody}`
  }

  // Medium archetypes — pattern body + CTA tail.
  const body = generatePatternInsightBody(data, pattern)
  return cta ? `${body} ${cta}` : body
}

/**
 * Archetype-specific leading sentence for long-form insight bodies.
 */
function archetypeLongLead(data: NarrativeData): string {
  const { archetype, drugName, stateName, priorAuthPct, quantityLimitPct } = data
  const drug = titleCase(drugName)

  switch (archetype) {
    case 'specialty-biologic':
      return `${drug} sits in the highest-cost drug category for ${stateName} marketplace plans. Specialty drugs almost always require prior approval and are placed on the highest tier — meaning your out-of-pocket cost can range from $80 to several hundred dollars per month depending on the plan you choose.`
    case 'glp1-weight-diabetes':
      return `${drug} has become one of the most-requested drugs in the marketplace, but coverage in ${stateName} is uneven. ${Math.round(priorAuthPct)}% of plans require prior approval, ${Math.round(quantityLimitPct)}% cap monthly fills, and weight-loss versus diabetes coverage is treated differently by carrier.`
    default:
      return ''
  }
}

/**
 * Pattern-only insight body (the original switch logic, kept intact for
 * medium and long archetypes that still need state-pattern variation).
 */
function generatePatternInsightBody(data: NarrativeData, pattern: NarrativePattern): string {
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
  const { drugName, stateName, totalPlans, priorAuthPct, dominantTier, tierSpread, archetype } = data
  const drug = titleCase(drugName)
  const tier = tierLabel(dominantTier)
  const natTier = tierLabel(data.nationalDominantTier)

  // Archetype-specific overrides — these take precedence over the pattern voice
  // when the cost story is dominated by drug-class economics.
  if (archetype === 'injectable-diabetes') {
    return `Insulin cost in ${stateName} is capped at $35 per month on every marketplace plan thanks to the Inflation Reduction Act. That cap applies regardless of tier placement or deductible — focus your plan comparison on premium and overall benefits instead of insulin copay.`
  }
  if (archetype === 'specialty-biologic') {
    return `${drug} is almost always placed on a specialty tier in ${stateName} — the highest cost tier most plans use. Out-of-pocket costs typically run $80 to several hundred dollars per month, and most plans require you to meet your full deductible before coinsurance kicks in. The plan you choose can move your annual cost by thousands of dollars.`
  }
  if (archetype === 'glp1-weight-diabetes') {
    return `${drug} pricing in ${stateName} varies dramatically by plan. Carriers split it across tier levels, and prior approval requirements add a step before your first fill. Compare both the tier placement and the approval timeline — and confirm that the version your doctor prescribes (diabetes vs. weight loss) is the one your plan covers.`
  }
  if (archetype === 'controlled-substance') {
    return `${drug} cost in ${stateName} is straightforward — most plans place it on a generic or preferred-brand tier — but refill rules and quantity limits matter more than the per-fill copay. Plans cap monthly fills, and some require new prescriptions each refill. Your annual cost depends on whether the supply rules match your prescription pattern.`
  }
  if (archetype === 'statin-cholesterol') {
    return `Statins like ${drug} are nearly always on a low-cost generic tier in ${stateName} — your monthly cost is typically a small copay. Tier placement is the only meaningful cost variable.`
  }
  if (archetype === 'common-generic-acute') {
    return `${drug} is a short-term generic with near-universal coverage in ${stateName}. A typical course costs only the generic copay — usually a few dollars after deductible.`
  }

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
  const { drugName, stateName, archetype } = data
  const drug = titleCase(drugName)

  // Archetype-specific headings — used when the drug-class story dominates.
  switch (archetype) {
    case 'injectable-diabetes':
      return `What the $35 insulin cap means for ${stateName} shoppers`
    case 'glp1-weight-diabetes':
      return `What ${stateName} shoppers should check before assuming coverage`
    case 'specialty-biologic':
      return `Why plan choice matters most for ${drug} in ${stateName}`
    case 'controlled-substance':
      return `Refill rules and quantity limits for ${drug} in ${stateName}`
    case 'mental-health':
      return `What federal parity law means for ${drug} in ${stateName}`
    case 'inhaler-respiratory':
      return `Why device coverage matters for ${drug} in ${stateName}`
    case 'thyroid-hormone':
      return `Brand vs. generic for ${drug} in ${stateName}`
    case 'statin-cholesterol':
    case 'common-generic-acute':
      // Brief headings for short-copy archetypes.
      return `What to know about ${drug} in ${stateName}`
    default:
      break
  }

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
    tierSpread, archetype,
  } = data
  const drug = titleCase(drugName)
  const tier = tierLabel(dominantTier)
  const natTier = tierLabel(nationalDominantTier)
  const paDiff = priorAuthPct - nationalPaPct
  const profile = getArchetypeProfile(archetype)

  const candidates: ConditionalBlock[] = []

  // ── Archetype-specific blocks (always-on for the matching drug class) ──

  if (archetype === 'injectable-diabetes') {
    candidates.push({
      id: 'ira-insulin-cap',
      heading: `Insulin is capped at $35/month on every ${stateName} marketplace plan`,
      body: `Under the Inflation Reduction Act, every ACA marketplace plan in ${stateName} caps insulin copays at $35 per month — regardless of tier placement, deductible, or carrier. That means your insulin cost is the same on a Bronze plan as it is on a Platinum plan. Use the rest of your plan comparison (premium, deductible, network) to make your choice.`,
      strength: 100,
    })
  }

  if (archetype === 'mental-health') {
    candidates.push({
      id: 'parity-callout',
      heading: `Federal parity law protects ${drug} coverage in ${stateName}`,
      body: `The Mental Health Parity and Addiction Equity Act requires marketplace plans to cover mental health medications comparably to physical health drugs. That means plans cannot apply tougher tier placement, prior approval rules, or quantity limits to ${drug} than they apply to similar non-mental-health drugs. If a ${stateName} plan denies ${drug} coverage, you can appeal under federal parity rules.`,
      strength: 80,
    })
  }

  if (archetype === 'controlled-substance') {
    candidates.push({
      id: 'controlled-refill-rules',
      heading: `Refill and quantity rules for ${drug} in ${stateName}`,
      body: `As a controlled substance, ${drug} has tighter refill rules than most drugs. Most ${stateName} plans cap fills at a 30-day supply, do not allow automatic refills, and may require a new prescription each fill. ${quantityLimitCount} of ${totalPlans} plans here apply explicit quantity limits. Confirm the rules match your prescription pattern before enrolling.`,
      strength: 90,
    })
  }

  if (archetype === 'specialty-biologic') {
    candidates.push({
      id: 'specialty-plan-impact',
      heading: `Why plan choice has outsized impact for ${drug} in ${stateName}`,
      body: `Specialty drugs like ${drug} are placed on the highest cost tier on virtually every ${stateName} plan, and ${Math.round(priorAuthPct)}% require prior approval. The difference between the cheapest and most expensive plan for a specialty user can be thousands of dollars per year — significantly more than the difference for non-specialty drugs. Specialty users should compare formulary placement first, then evaluate everything else.`,
      strength: 85,
    })
  }

  if (archetype === 'glp1-weight-diabetes') {
    candidates.push({
      id: 'glp1-three-checks',
      heading: `Three things to verify for ${drug} in ${stateName}`,
      body: `Before assuming coverage means access, verify three things on each ${stateName} plan: (1) is ${drug} on the formulary, (2) does the plan require prior approval (${Math.round(priorAuthPct)}% do), and (3) what monthly supply limit applies (${Math.round(quantityLimitPct)}% of plans cap fills). Carriers also distinguish weight-loss versus diabetes coverage — make sure the version your doctor prescribes is the one your plan covers.`,
      strength: 85,
    })
  }

  if (archetype === 'inhaler-respiratory') {
    candidates.push({
      id: 'inhaler-device',
      heading: `Device-specific coverage for ${drug} in ${stateName}`,
      body: `For inhalers and respiratory devices, ${stateName} plans cover specific device formats — generic substitution is not always 1:1. If your doctor prescribes a particular brand-name inhaler or device, confirm the plan covers that exact form, not just the active ingredient. Switching device types can affect technique and dose delivery.`,
      strength: 70,
    })
  }

  if (archetype === 'thyroid-hormone') {
    candidates.push({
      id: 'thyroid-brand-generic',
      heading: `Brand vs. generic substitution for ${drug} in ${stateName}`,
      body: `Thyroid hormone replacement has a narrow therapeutic range, which means brand-versus-generic substitution can produce different clinical results for some people. If your doctor specifically prescribes a brand name, check whether your ${stateName} plan covers that brand or only the generic. Plans differ on whether they require step therapy through the generic first.`,
      strength: 65,
    })
  }

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

  // Sort by strength descending and return top N per archetype profile.
  // Short-copy archetypes (statin, common-generic-acute) cap at 1 block;
  // long-copy archetypes (specialty, GLP-1) keep up to 2.
  return candidates
    .sort((a, b) => b.strength - a.strength)
    .slice(0, profile.maxConditionalBlocks)
}
