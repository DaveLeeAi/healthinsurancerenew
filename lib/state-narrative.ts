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

  // Tier-dominant — PA similar but the dominant tier differs
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
        return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans we reviewed for ${YEAR}, almost always on a ${tier} tier. What you pay each month depends mainly on the tier your plan assigns and whether your deductible has been met.`
      }
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. What you pay each month comes down to the tier your plan assigns it to.`

    case 'common-generic-acute':
      // Brief, simple, near-universal.
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. A typical short course costs the generic copay after your deductible — usually a few dollars.`

    case 'statin-cholesterol':
      // Very brief, "tier is the only question".
      return `Statins like ${drug} are on the drug list of nearly every ${stateName} marketplace plan — ${totalPlans} plans we reviewed for ${YEAR} list it, almost always on a low-cost generic tier.`

    case 'thyroid-hormone':
      // Brand vs generic substitution matters.
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Brand and generic thyroid drugs are not always interchangeable for the same person — check whether your plan covers the exact version your doctor prescribes.`

    case 'mental-health':
      // Respectful, parity-aware.
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Federal parity law requires plans to cover mental health drugs on comparable terms to physical health drugs — including the tier, approval rules, and supply limits.`

    case 'inhaler-respiratory':
      // Device-focused.
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. For inhalers, the device matters as much as the drug — confirm your plan covers the exact form your doctor prescribes, not just the active ingredient.`

    case 'controlled-substance':
      // Refill-rules-first, no judgment.
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. As a controlled substance, refill rules are stricter than for most drugs — most plans cap fills at a 30-day supply.`

    case 'injectable-diabetes':
      // IRA $35 cap is the lead story.
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Under the Inflation Reduction Act, every marketplace plan caps your insulin copay at $35 a month — regardless of the tier the plan assigns.`

    case 'brand-chronic':
      // Cost + PA-aware.
      return `${drug} is a brand-name drug on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. ${Math.round(priorAuthPct)}% require approval before you can fill the prescription, and the tier differs from one insurance company to another — both affect what you pay.`

    case 'glp1-weight-diabetes':
      // Access-first, three-things framing.
      if (priorAuthPct >= 70) {
        return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}, but access is restricted. ${Math.round(priorAuthPct)}% of those plans require approval before you can fill the prescription — being on the drug list does not guarantee a quick first fill.`
      }
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Three things shape what you pay and how quickly you can start: which tier the plan uses, whether the plan requires approval (${Math.round(priorAuthPct)}% do), and the supply limit (${Math.round(quantityLimitPct)}% of plans cap monthly fills).`

    case 'specialty-biologic':
      // Serious, plan-shopping-critical.
      if (priorAuthPct >= 80) {
        return `${drug} is a specialty biologic on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. ${Math.round(priorAuthPct)}% require approval before you can fill the prescription, and nearly every plan places it on a specialty tier — the highest-cost tier most plans use. The plan you pick can move your annual cost by thousands of dollars.`
      }
      return `${drug} is a specialty biologic on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}, almost always on a specialty tier with approval required. Cost ranges are wide — the plan you pick can move your annual cost by thousands of dollars.`

    case 'anticoagulant':
      // Brand-vs-generic gap is the central decision.
      if (tier === 'generic') {
        return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}, almost always on a low-cost generic tier. The bigger question is whether your doctor wants you on a generic blood thinner or a brand-name one — the cost gap can be hundreds of dollars a month.`
      }
      return `${drug} is a brand-name blood thinner on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Brand blood thinners cost much more than generic warfarin, but switching between them is a clinical decision — talk with your doctor before letting cost drive the choice.`

    case 'contraceptive':
      // ACA preventive — lead with the $0 mandate.
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Under the Affordable Care Act, marketplace plans must cover at least one form of FDA-approved birth control at $0 — confirm whether the brand or method you want is the one your plan covers at $0.`

    case 'ophthalmic':
      // Cost-first, formulation-aware.
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}. Eye drops, gels, and suspensions can be listed differently on the same drug list — check whether the exact form your doctor prescribes is the one your plan covers, not just the active ingredient.`

    case 'dermatology':
      // Cost-first, formulation-aware (cream vs ointment vs lotion).
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}, usually on a low-cost generic tier. For topical drugs, the cream, ointment, and lotion versions can be priced differently — check that your plan covers the exact form your doctor prescribed.`

    case 'other':
      return null
  }
  return null
}

/**
 * Returns the archetype-specific shopper guidance line. Used at the end
 * of cost-context and insight blocks. Returns null for 'other'.
 */
function archetypeCta(data: NarrativeData): string | null {
  const profile = getArchetypeProfile(data.archetype)
  switch (profile.ctaAngle) {
    case 'compare-tier':
      return `Compare specific plans on tier — that is where the cost difference lives.`
    case 'check-three-things':
      return `Check three things on every plan: whether the drug is on the drug list, whether the plan requires approval first, and the supply limit.`
    case 'plan-shopping-critical':
      return `For specialty drugs, the plan you pick can move your annual cost by thousands of dollars — compare the tier and the approval rules side by side.`
    case 'verify-parity-coverage':
      return `Federal parity law requires plans to cover mental health drugs on comparable terms — confirm your plan applies the same tier and approval rules.`
    case 'check-quantity-rules':
      return `Confirm the plan's monthly supply limit, refill timing, and whether approval is required before you enroll.`
    case 'cap-applies-everywhere':
      return `Your insulin copay is capped at $35 a month on every marketplace plan — focus your comparison on premium and deductible instead.`
    case 'verify-device-coverage':
      return `For inhalers, confirm your plan covers the specific device your doctor prescribes — generic substitution is not always 1:1.`
    case 'brand-vs-generic-matters':
      return `If your doctor prescribes a specific brand, check whether the plan covers that brand or only the generic substitute.`
    case 'compare-tier-and-pa':
      return `For brand drugs, compare both the tier and the approval rules — both affect your monthly cost.`
    case 'verify-aca-preventive':
      return `Marketplace plans must cover at least one FDA-approved birth control method at $0 — confirm the method you want is the one your plan covers at $0 before enrolling.`
    case 'doac-vs-warfarin':
      return `The cost gap between generic warfarin and brand blood thinners is large — talk with your doctor about whether either fits your situation, then compare plans.`
    case 'check-formulation-coverage':
      return `Check the exact formulation your doctor prescribed — cream versus ointment, drops versus gel — because the same drug can be on different tiers depending on the form.`
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
      return `Most ${stateName} insurance companies also keep approval rates low — fewer plans require it than the national average.`
    case 'broad-high-friction':
      return `${stateName} sits well above the national average for approval requirements — ${Math.round(priorAuthPct)}% versus ${Math.round(nationalPaPct)}% nationally.`
    case 'narrow-high-friction':
      return `Few ${stateName} plans cover it, and most of those that do require approval first — every plan rule has a bigger effect on what you pay in a market this small.`
    case 'narrow-low-friction':
      return `${stateName} has fewer plans than average, but the ones that cover it tend to require approval less often.`
    case 'tier-dominant':
      return `${stateName} insurance companies cluster on a single tier — that tier drives most of what you pay here.`
    case 'issuer-variation':
      return `${stateName} insurance companies split across ${tierSpread} different tiers, so the one you pick matters as much as which metal level you choose.`
    case 'supply-limits-standout':
      return `${quantityLimitCount} of ${totalPlans} ${stateName} plans cap the monthly fill — supply limits are the hidden cost factor here.`
    case 'small-market':
      return `With only ${totalPlans} ${stateName} plans, each plan's rules carry more weight than usual.`
    case 'large-market-advantage':
      return `${stateName}'s broad selection gives you room to compare plans on tier and approval rules.`
    case 'outlier':
      if (priorAuthPct > nationalPaPct + 25) {
        return `${stateName} stands out nationally — ${Math.round(priorAuthPct)}% require approval first versus ${Math.round(nationalPaPct)}% nationally.`
      }
      if (priorAuthPct < nationalPaPct - 25) {
        return `${stateName} is unusually permissive — only ${Math.round(priorAuthPct)}% of plans require approval first, well below the national norm.`
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
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR}, and ${priorAuthPct < 30 ? 'few' : 'fewer than the national average'} require approval first — ${Math.round(priorAuthPct)}% compared to ${Math.round(nationalPaPct)}% nationally. Most plans place ${drug} on a ${tier} tier.`

    case 'broad-high-friction':
      return `${totalPlans} ${stateName} marketplace plans include ${drug} for ${YEAR}, but access comes with extra steps. ${Math.round(priorAuthPct)}% require approval first — ${paDirection} the ${Math.round(nationalPaPct)}% national average — so your doctor will need to send paperwork to your plan before your first fill.`

    case 'narrow-high-friction':
      return `${drug} coverage is limited in ${stateName} — only ${totalPlans} marketplace plans include it for ${YEAR}. Of those, ${priorAuthCount} require approval first, and most place ${drug} on a ${tier} tier. With fewer plans to choose from, each plan's rules have a bigger effect on what you pay.`

    case 'narrow-low-friction':
      return `Only ${totalPlans} ${stateName} marketplace plans include ${drug} for ${YEAR}, but the ones that do tend to make access easier. Approval is required by fewer plans than the national average — ${Math.round(priorAuthPct)}% — and most place ${drug} on a ${tier} tier.`

    case 'tier-dominant':
      return `In ${stateName}, the bigger question for ${drug} is not whether plans cover it — ${totalPlans} do — but the tier they assign. Most ${stateName} plans place ${drug} on a ${tier} tier, while nationally the most common tier is ${tierLabel(data.nationalDominantTier)}. That difference directly affects your monthly cost.`

    case 'issuer-variation':
      return `${drug} is on ${totalPlans} ${stateName} marketplace plans for ${YEAR}, but coverage is uneven across insurance companies. Some place ${drug} on a lower-cost tier with no approval needed, while others assign a higher tier with approval required. Which insurance company you pick matters as much as which metal level you choose.`

    case 'supply-limits-standout':
      return `${drug} appears on ${totalPlans} ${stateName} plans for ${YEAR}, and ${priorAuthPct < 40 ? "most do not require approval first" : `${Math.round(priorAuthPct)}% require approval first`}. Watch for supply limits — ${quantityLimitCount} of ${totalPlans} plans restrict how much you can fill per month. Check the supply limit before assuming coverage means easy access.`

    case 'small-market':
      return `Only ${totalPlans} ${stateName} marketplace plan${totalPlans === 1 ? '' : 's'} include${totalPlans === 1 ? 's' : ''} ${drug} for ${YEAR}. In a market this small, each insurance company's drug list shapes your options more than usual. Compare ${totalPlans === 1 ? 'this plan' : `all ${totalPlans} plans`} carefully — the tier and approval rules differ between them.`

    case 'large-market-advantage':
      return `${drug} is on the drug list of ${totalPlans} ${stateName} marketplace plans for ${YEAR} — one of the broader selections in the country. With this many plans, you have room to find one that places ${drug} on a lower tier or does not require approval first.`

    case 'outlier': {
      if (priorAuthPct > nationalPaPct + 25) {
        return `${stateName} runs among the highest in the country for approval requirements on ${drug} — ${Math.round(priorAuthPct)}% of plans require it, compared to a ${Math.round(nationalPaPct)}% national average. Nearly every plan here adds an extra step before your first fill.`
      }
      if (priorAuthPct < nationalPaPct - 25) {
        return `${stateName} stands out for easier access to ${drug}. Only ${Math.round(priorAuthPct)}% of the ${totalPlans} plans here require approval first, well below the ${Math.round(nationalPaPct)}% national average. Most plans place ${drug} on a ${tier} tier.`
      }
      // Plan count outlier
      return `${stateName} offers an unusually large selection for ${drug} — ${totalPlans} marketplace plans include it for ${YEAR}, far more than the typical state. That gives you more room to compare on tier, approval rules, and what you pay.`
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
      ? `${drug} is one of the easier drugs to access in ${stateName}. With ${totalPlans} plans covering it and approval needed by just ${Math.round(priorAuthPct)}%, the main decision is which plan places ${drug} on a more favorable tier.`
      : `For ${drug} in ${stateName}, the tier is the main cost variable — most plans assign a ${tier} tier.`
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
      return `${drug} sits in the highest-cost drug category on ${stateName} marketplace plans. Specialty drugs almost always require approval first and land on the highest-cost tier — your monthly cost can run from $80 to several hundred dollars depending on the plan you pick.`
    case 'glp1-weight-diabetes':
      return `${drug} has become one of the most-requested drugs on the marketplace, but coverage in ${stateName} is uneven. ${Math.round(priorAuthPct)}% of plans require approval first, ${Math.round(quantityLimitPct)}% cap monthly fills, and weight-loss versus diabetes coverage is treated differently from one insurance company to another.`
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
      return `${drug} is one of the easier drugs to access in ${stateName}. With ${totalPlans} plans covering it and approval required by just ${Math.round(priorAuthPct)}%, the main decision is which plan places ${drug} on a more favorable tier. Compare on tier and on how the plan's deductible works — those drive the cost difference between plans here.`

    case 'broad-high-friction':
      return `Even though ${totalPlans} ${stateName} plans include ${drug}, ${Math.round(priorAuthPct)}% of them require approval first — ${Math.round(Math.abs(priorAuthPct - nationalPaPct))} percentage points above the national average. Your doctor will need to send paperwork to your plan before your first fill. When comparing plans, look for ones with a lower tier and clear approval rules.`

    case 'narrow-high-friction': {
      // Vary by plan count + PA magnitude so similar narrow states diverge.
      const planPhrase = totalPlans <= 6
        ? `Just ${totalPlans} plans cover`
        : totalPlans <= 9
          ? `Only ${totalPlans} plans cover`
          : `Fewer than a dozen plans (${totalPlans}) cover`
      const paPhrase = priorAuthPct >= 85
        ? `nearly all of them — ${Math.round(priorAuthPct)}% — require approval first`
        : priorAuthPct >= 75
          ? `${Math.round(priorAuthPct)}% require approval first`
          : `${priorAuthCount} of those require approval first`
      const tail = totalPlans <= 6
        ? `With this few plans, every rule has a bigger effect on what you pay. Compare each plan's tier, approval rules, and supply limits before enrolling.`
        : `Confirm coverage, tier, and approval rules before enrolling — switching plans mid-year is difficult, and each plan's rules differ.`
      return `${planPhrase} ${drug} in ${stateName}, and ${paPhrase} — fewer easy paths than in most states. ${tail}`
    }

    case 'narrow-low-friction':
      return `${stateName} has fewer plans covering ${drug} than average, but the ones available tend to require approval less often. The narrower selection means your plan choice still matters — compare the ${totalPlans} available plans on tier and on how each handles your deductible for ${drug}.`

    case 'tier-dominant':
      return `For ${drug} in ${stateName}, the tier is the main cost variable. Most plans here assign a ${tier} tier, while nationally ${natTier} is more common. Your monthly cost in ${stateName} may be ${tier === 'generic' || tier === 'preferred brand' ? 'lower' : 'higher'} than the national norm — but check what you would pay on the specific plan you are considering, not just the tier label.`

    case 'issuer-variation':
      return `${stateName} insurance companies disagree on how to classify ${drug}. With ${tierSpread} different tiers across ${totalPlans} plans, the insurance company you pick affects your cost more than any other factor. Check each insurance company's tier and approval rules side by side before deciding.`

    case 'supply-limits-standout':
      return `The main access concern for ${drug} in ${stateName} is not approval — it is supply limits. ${quantityLimitCount} of ${totalPlans} plans (${Math.round(quantityLimitPct)}%) cap how much you can fill at one time. If you need a larger monthly supply, look for plans that allow 90-day fills or mail-order options.`

    case 'small-market':
      return `With only ${totalPlans} plan${totalPlans === 1 ? '' : 's'} covering ${drug} in ${stateName}, every detail matters. Check each plan's tier, approval rules, and supply limits. A single plan difference can mean hundreds of dollars a year in what you pay.`

    case 'large-market-advantage':
      return `${stateName}'s large marketplace gives you room to compare for ${drug}. Across ${totalPlans} plans, the tier, approval rules, and what plans charge can differ from one to another. Filtering by tier and by approval status is the fastest way to narrow the field.`

    case 'outlier': {
      if (priorAuthPct > nationalPaPct + 25) {
        return `${stateName}'s approval rate for ${drug} runs well above the national average — ${Math.round(priorAuthPct)}% versus ${Math.round(nationalPaPct)}% nationally. Before enrolling, confirm the plan's approval rules and what documentation your doctor needs to send.`
      }
      if (priorAuthPct < nationalPaPct - 25) {
        return `${stateName} is unusually permissive for ${drug} access — only ${Math.round(priorAuthPct)}% of plans require approval first. That is a real advantage if approval paperwork is a concern. Focus your comparison on tier and on how the plan's deductible works.`
      }
      return `${stateName} has far more plan options for ${drug} than a typical state. Use that to your advantage — filter by tier first, then compare approval rules. With ${totalPlans} plans to choose from, you have room to find favorable terms.`
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
    return `Your insulin copay in ${stateName} is capped at $35 a month on every marketplace plan thanks to the Inflation Reduction Act. That cap applies regardless of the tier or your deductible — focus your plan comparison on premium and overall benefits instead of insulin copay.`
  }
  if (archetype === 'specialty-biologic') {
    return `${drug} is almost always placed on a specialty tier in ${stateName} — the highest-cost tier most plans use. Your monthly cost typically runs $80 to several hundred dollars, and most plans require you to meet your full deductible before coinsurance kicks in. The plan you pick can move your annual cost by thousands of dollars.`
  }
  if (archetype === 'glp1-weight-diabetes') {
    return `${drug} pricing in ${stateName} differs from one plan to another. Insurance companies split it across tier levels, and approval requirements add a step before your first fill. Compare both the tier and the approval rules — and confirm that the version your doctor prescribes (diabetes versus weight loss) is the one your plan covers.`
  }
  if (archetype === 'controlled-substance') {
    return `${drug} cost in ${stateName} is straightforward — most plans place it on a generic or preferred brand tier — but refill rules and supply limits matter more than the per-fill copay. Plans cap monthly fills, and some require a new prescription each refill. What you pay over a year depends on whether the supply rules match how you use the prescription.`
  }
  if (archetype === 'statin-cholesterol') {
    return `Statins like ${drug} are nearly always on a low-cost generic tier in ${stateName} — your monthly cost is typically a small copay. The tier is the only meaningful cost variable.`
  }
  if (archetype === 'common-generic-acute') {
    return `${drug} is a short-term generic with near-universal coverage in ${stateName}. A typical course costs only the generic copay — usually a few dollars after your deductible.`
  }

  switch (pattern) {
    case 'broad-low-friction':
      return `With ${totalPlans} plans covering ${drug} in ${stateName}, you have room to compare for a more favorable tier. Most plans here assign a ${tier} tier — what you pay after your deductible depends on the tier the plan you pick uses.`

    case 'broad-high-friction':
      return `Most ${stateName} plans place ${drug} on a ${tier} tier, but ${Math.round(priorAuthPct)}% also require approval first — adding a step before your first fill. What you pay depends on both the tier and on how the plan's approval rules work.`

    case 'narrow-high-friction': {
      // Vary intro by market size so small narrow states diverge from larger ones.
      const intro = totalPlans <= 6
        ? `${stateName}'s ${totalPlans}-plan field for ${drug} leaves little room to compare on price.`
        : totalPlans <= 9
          ? `With only ${totalPlans} plans covering ${drug} in ${stateName}, you have a narrow set of cost options.`
          : `${totalPlans} ${stateName} plans cover ${drug} — a tighter selection than most states.`
      const tierLine = `Most assign a ${tier} tier, and approval is required on ${Math.round(priorAuthPct)}% of them.`
      const tail = totalPlans <= 6
        ? `Compare every plan you can — a single tier or copay difference can mean hundreds of dollars over the year.`
        : `Compare all available plans before enrolling — small differences in tier or copay add up quickly with fewer choices.`
      return `${intro} ${tierLine} ${tail}`
    }

    case 'narrow-low-friction':
      return `${stateName}'s ${totalPlans} plans covering ${drug} generally assign a ${tier} tier and require approval less often than the national average. Your main cost variable is how the plan's deductible works — check whether the plan applies a separate drug deductible or combines it with medical.`

    case 'tier-dominant':
      return `In ${stateName}, the dominant tier for ${drug} is ${tier} — ${tier !== natTier ? `different from the national norm of ${natTier}` : 'matching the national average'}. Your monthly cost depends on the tier the plan you pick uses and where you are in your deductible year.`

    case 'issuer-variation':
      return `${stateName} insurance companies place ${drug} on ${tierSpread} different tiers. That spread means two ${stateName} plans can charge very different amounts for the same drug — even at the same metal level. Filter plans by tier first to narrow the field.`

    case 'supply-limits-standout':
      return `For ${drug} in ${stateName}, the tier drives your per-fill cost, but supply limits affect what you pay over a full year. Plans that restrict monthly quantities may cost you more even if the per-fill copay looks lower.`

    case 'small-market':
      return `In ${stateName}'s small market, each of the ${totalPlans} plan${totalPlans === 1 ? '' : 's'} covering ${drug} has its own tier and copay rules. What you pay over a year depends almost entirely on which plan you pick.`

    case 'large-market-advantage':
      return `With ${totalPlans} plans covering ${drug} in ${stateName}, the cost difference between plans is real. Plans on the lowest available tier can save you $40 to $80 a month compared to those on a higher tier — worth the time to filter and compare.`

    case 'outlier': {
      if (data.priorAuthPct > data.nationalPaPct + 25) {
        return `In ${stateName}, nearly all plans require approval first for ${drug}, which can delay your first fill. Once approved, your ongoing cost depends on the tier — most plans here assign a ${tier} tier.`
      }
      if (data.priorAuthPct < data.nationalPaPct - 25) {
        return `${stateName}'s low approval rates for ${drug} mean your cost comparison can focus on the tier and on how the plan's deductible works. Most plans assign a ${tier} tier — check whether your plan covers it before or after the deductible is met.`
      }
      return `${stateName}'s large plan selection for ${drug} means real cost differences between plans. The difference between a favorable and unfavorable tier can be $50 to $100 a month. Use that selection to your advantage when comparing.`
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
      tierBreakdown = `Across ${totalPlans} ${stateName} plans, the most common tier for ${drug} is ${tier}. With this many plans, you can often find one that places ${drug} on a more favorable tier — worth checking before you enroll.`
      break
    case 'broad-high-friction':
      tierBreakdown = `Most ${stateName} plans assign ${drug} to a ${tier} tier, but the high approval rate means the tier is only part of the picture. Compare both the tier and the approval rules when evaluating plans.`
      break
    case 'narrow-high-friction':
    case 'narrow-low-friction':
      // Vary tier breakdown by exact plan count band so similar narrow states diverge.
      tierBreakdown = totalPlans <= 6
        ? `Across ${stateName}'s ${totalPlans} plans, ${drug} most often lands on a ${tier} tier. In a market this tight, the tier choice drives most of what you pay.`
        : totalPlans <= 9
          ? `${stateName}'s ${totalPlans} plans most commonly assign ${drug} to a ${tier} tier. With this few plans, a one-tier difference between plans can swing your monthly cost by tens of dollars.`
          : `With ${totalPlans} plans available in ${stateName}, the typical tier for ${drug} is ${tier}. Fewer plans means tier differences have a bigger effect on what you pay.`
      break
    case 'tier-dominant':
      tierBreakdown = `${stateName} plans most commonly assign ${drug} to a ${tier} tier — ${tier !== natTier ? `while nationally, ${natTier} is more typical` : 'in line with the national pattern'}. The tier your plan assigns is the biggest factor in what you pay each month.`
      break
    case 'issuer-variation':
      tierBreakdown = `${stateName} insurance companies place ${drug} across ${tierSpread} different tiers. That means two plans at the same metal level can charge very different amounts for ${drug}. Check the tier on each plan you are considering.`
      break
    case 'supply-limits-standout':
      tierBreakdown = `Most ${stateName} plans place ${drug} on a ${tier} tier, but ${quantityLimitCount} of ${totalPlans} also limit your monthly supply. A plan with a slightly higher copay but no supply limit could cost you less over the full year.`
      break
    case 'small-market':
      tierBreakdown = `In ${stateName}'s small market, the ${totalPlans} plan${totalPlans === 1 ? '' : 's'} covering ${drug} ${totalPlans === 1 ? 'assigns' : 'assign'} ${totalPlans === 1 ? 'a single' : 'varying'} tier${totalPlans === 1 ? '' : 's'}. With so few plans, that assignment drives most of your cost.`
      break
    case 'outlier':
      tierBreakdown = `${stateName} stands out nationally for ${drug} coverage. The dominant tier here is ${tier}, and ${Math.round(priorAuthPct)}% of plans require approval first — ${priorAuthPct > nationalPaPct ? 'above' : 'below'} the ${Math.round(nationalPaPct)}% national average.`
      break
  }

  // ── Pharmacy choice — varies by market size ──
  let pharmacyChoice: string
  if (totalPlans > 30) {
    pharmacyChoice = `With ${totalPlans} plans in ${stateName}, the preferred pharmacy networks differ from plan to plan. Check whether your regular pharmacy is in-network — and whether mail-order could lower what you pay for ${drug}.`
  } else if (totalPlans <= 5) {
    pharmacyChoice = `In ${stateName}'s small market, your pharmacy options for ${drug} may be limited. Confirm your preferred pharmacy is in-network on the plan you are considering, and ask about mail-order pricing.`
  } else {
    pharmacyChoice = `Your plan's price for ${drug} differs by pharmacy. Preferred pharmacies and mail-order often come in lower — worth checking before your first fill, especially in ${stateName} where plan options are more limited.`
  }

  // ── Deductible context — varies by tier ──
  let deductibleContext: string
  if (tier === 'generic' || tier === 'preventive') {
    deductibleContext = `Some ${stateName} plans cover ${drug} before your deductible is met — meaning you would pay just the copay from day one. Look for this in your plan's Summary of Benefits.`
  } else if (tier === 'specialty') {
    deductibleContext = `For specialty-tier drugs like ${drug}, most ${stateName} plans require you to meet your full deductible before coinsurance kicks in. That means higher costs early in the year — your plan's deductible amount is a critical comparison point.`
  } else {
    deductibleContext = `Whether your plan has a separate drug deductible or combines it with medical determines when your lower copay for ${drug} kicks in. Check this in the plan documents before enrollment.`
  }

  // ── PA note — varies by pattern ──
  let paNote: string
  switch (pattern) {
    case 'broad-high-friction':
    case 'narrow-high-friction':
      paNote = `Approval rates for ${drug} in ${stateName} run above the national average at ${Math.round(priorAuthPct)}%. Confirm your plan's approval rules before enrolling — they directly affect when you can start filling this prescription.`
      break
    case 'broad-low-friction':
    case 'narrow-low-friction':
      paNote = `${stateName} plans require approval first for ${drug} less often than the national average — ${Math.round(priorAuthPct)}% versus ${Math.round(nationalPaPct)}% nationally. That is one fewer hurdle to deal with here.`
      break
    case 'outlier':
      if (priorAuthPct > nationalPaPct + 25) {
        paNote = `${stateName}'s ${Math.round(priorAuthPct)}% approval rate for ${drug} runs among the highest in the country. Confirm the plan's approval rules before enrolling — they directly affect when you can start filling the prescription.`
      } else if (priorAuthPct < nationalPaPct - 25) {
        paNote = `${stateName}'s low approval rate for ${drug} — just ${Math.round(priorAuthPct)}% — means most plans here let you fill the prescription without an extra step.`
      } else {
        paNote = `${priorAuthCount} of ${totalPlans} ${stateName} plans require approval first for ${drug}. With this many plan options, you may be able to find one that does not require it.`
      }
      break
    case 'small-market':
      paNote = `In ${stateName}'s small market, ${priorAuthCount === 0 ? 'none' : `${priorAuthCount} of ${totalPlans}`} plan${totalPlans === 1 ? '' : 's'} require${totalPlans === 1 ? 's' : ''} approval first for ${drug}. With limited plans, this is worth confirming before you enroll.`
      break
    default:
      if (priorAuthCount > 0) {
        paNote = `${priorAuthCount} of ${totalPlans} ${stateName} plans require approval first for ${drug}. Your doctor's office typically handles the paperwork, but how long that takes differs from one plan to another.`
      } else {
        paNote = `None of the ${totalPlans} ${stateName} plans we reviewed require approval first for ${drug}. Your doctor can prescribe it and your pharmacy can fill it without an extra step.`
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
      return `Why the plan you pick matters most for ${drug} in ${stateName}`
    case 'controlled-substance':
      return `Refill rules and supply limits for ${drug} in ${stateName}`
    case 'mental-health':
      return `What federal parity law means for ${drug} in ${stateName}`
    case 'inhaler-respiratory':
      return `Why the device matters for ${drug} in ${stateName}`
    case 'thyroid-hormone':
      return `Brand versus generic for ${drug} in ${stateName}`
    case 'statin-cholesterol':
    case 'common-generic-acute':
      // Brief headings for short-copy archetypes.
      return `What to know about ${drug} in ${stateName}`
    default:
      break
  }

  switch (pattern) {
    case 'small-market':
      return `Why the plan you pick matters more in ${stateName}`
    case 'broad-high-friction':
      return `Where ${stateName} shoppers run into barriers for ${drug}`
    case 'narrow-high-friction':
      return `What limits access to ${drug} in ${stateName}`
    case 'broad-low-friction':
      return `What ${stateName} shoppers should still check`
    case 'narrow-low-friction':
      return `What to know about ${drug} access in ${stateName}`
    case 'tier-dominant':
      return `Why the tier matters most in ${stateName}`
    case 'issuer-variation':
      return `Why the insurance company you pick matters in ${stateName}`
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
      heading: `Insulin is capped at $35 a month on every ${stateName} marketplace plan`,
      body: `Under the Inflation Reduction Act, every ACA marketplace plan in ${stateName} caps insulin copays at $35 a month — regardless of the tier, your deductible, or which insurance company offers the plan. Your insulin cost is the same on a Bronze plan as on a Platinum plan. Use the rest of your plan comparison (premium, deductible, network) to make your choice.`,
      strength: 100,
    })
  }

  if (archetype === 'mental-health') {
    candidates.push({
      id: 'parity-callout',
      heading: `Federal parity law protects ${drug} coverage in ${stateName}`,
      body: `The Mental Health Parity and Addiction Equity Act requires marketplace plans to cover mental health drugs on comparable terms to physical health drugs. That means a plan cannot apply tougher tier rules, approval requirements, or supply limits to ${drug} than it applies to similar non-mental-health drugs. If a ${stateName} plan denies ${drug} coverage, you can appeal under federal parity rules.`,
      strength: 80,
    })
  }

  if (archetype === 'controlled-substance') {
    candidates.push({
      id: 'controlled-refill-rules',
      heading: `Refill and supply rules for ${drug} in ${stateName}`,
      body: `As a controlled substance, ${drug} has stricter refill rules than most drugs. Most ${stateName} plans cap fills at a 30-day supply, do not allow automatic refills, and may require a new prescription each fill. ${quantityLimitCount} of ${totalPlans} plans here apply explicit supply limits. Confirm the rules match how you use the prescription before enrolling.`,
      strength: 90,
    })
  }

  if (archetype === 'specialty-biologic') {
    candidates.push({
      id: 'specialty-plan-impact',
      heading: `Why the plan you pick matters most for ${drug} in ${stateName}`,
      body: `Specialty drugs like ${drug} land on the highest-cost tier on virtually every ${stateName} plan, and ${Math.round(priorAuthPct)}% require approval first. The difference between the cheapest and most expensive plan for a specialty user can be thousands of dollars a year — much more than the difference for non-specialty drugs. If you take ${drug}, compare the tier first, then everything else.`,
      strength: 85,
    })
  }

  if (archetype === 'glp1-weight-diabetes') {
    candidates.push({
      id: 'glp1-three-checks',
      heading: `Three things to verify for ${drug} in ${stateName}`,
      body: `Before assuming coverage means access, verify three things on each ${stateName} plan: (1) is ${drug} on the drug list, (2) does the plan require approval first (${Math.round(priorAuthPct)}% do), and (3) what is the monthly supply limit (${Math.round(quantityLimitPct)}% of plans cap fills). Insurance companies also distinguish weight-loss versus diabetes coverage — make sure the version your doctor prescribes is the one your plan covers.`,
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
      heading: `Brand versus generic substitution for ${drug} in ${stateName}`,
      body: `Thyroid hormone replacement has a narrow therapeutic range, which means brand and generic substitution can produce different results for some people. If your doctor specifically prescribes a brand name, check whether your ${stateName} plan covers that brand or only the generic. Plans differ on whether they require step therapy through the generic first.`,
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
      body: `With only ${totalPlans} plan${totalPlans === 1 ? '' : 's'} covering ${drug} in ${stateName}, each insurance company's drug list shapes your options more than usual. If one drops coverage or tightens restrictions, your choices narrow fast. Compare ${totalPlans === 1 ? 'this plan' : `all ${totalPlans} plans`} carefully before enrolling.`,
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
      body = `Almost every ${stateName} plan — ${priorAuthCount} of ${totalPlans} — requires approval first for ${drug}, far above the ${Math.round(nationalPaPct)}% national average. Plan on your doctor sending paperwork to your plan before you can fill the prescription, and ask the plan what documentation it needs.`
    } else if (priorAuthPct >= 80) {
      body = `In ${stateName}, ${Math.round(priorAuthPct)}% of plans require approval first for ${drug} — well above the ${Math.round(nationalPaPct)}% national average. That extra step adds time before your first fill. Ask each plan about its approval rules and what documentation your doctor needs to send.`
    } else {
      body = `Roughly ${priorAuthCount} of ${totalPlans} ${stateName} plans require approval first for ${drug}, putting the state above the ${Math.round(nationalPaPct)}% national average. Build that step into your timeline, and ask the plan what documentation your doctor needs to send.`
    }
    candidates.push({
      id: 'high-pa-friction',
      heading: `Approval is a bigger factor in ${stateName}`,
      body,
      strength: Math.max(Math.round(Math.abs(paDiff)), 5),
    })
  }

  // ── Module 3: Tier-driven cost warning ──
  const tierIsHigher = tier === 'specialty' || tier === 'non-preferred brand'
  const tierDiffersFromNational = tier !== natTier
  if (pattern === 'tier-dominant' || tierDiffersFromNational || tierIsHigher) {
    const costWord = tier === 'generic' || tier === 'preferred brand' ? 'less' : 'more'
    const range = tier === 'specialty' ? '$80 to $300' : tier === 'non-preferred brand' ? '$30 to $80' : '$15 to $50'
    const compareLine = tierDiffersFromNational
      ? `In ${stateName}, most plans place ${drug} on a ${tier} tier, while the national average is ${natTier}. That tier gap alone can mean ${range} ${costWord} a month after your deductible.`
      : `In ${stateName}, most plans place ${drug} on a ${tier} tier — the same as the national average — but the tier still drives most of what you pay. A plan that places ${drug} on a more favorable tier can save you ${range} a month after your deductible.`
    candidates.push({
      id: 'tier-driven-cost',
      heading: `The tier drives most of the cost difference in ${stateName}`,
      body: `${compareLine} When comparing plans, check the tier first — it has the biggest effect on what you actually pay.`,
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
      body = `Even with only ${totalPlans} plans, ${stateName} insurance companies disagree on ${drug} — ${tierSpread} different tier assignments show up across the ${totalPlans}-plan field. One insurance company may put it on a ${tier1}-cost tier with no approval needed, while another places it on a ${tier2}-cost tier and requires approval first. In a market this small, picking the right insurance company shapes almost everything you pay.`
    } else if (tierSpread >= 5 && marketSize === 'small') {
      body = `${stateName}'s ${totalPlans} plans split ${drug} across ${tierSpread} tier levels — a wider spread than most small markets show. One plan may list it on a ${tier1}-cost tier with no approval needed; another puts it on a ${tier2}-cost tier with approval required. The insurance company you pick will move your monthly cost more than the metal level here.`
    } else if (tierSpread >= 5) {
      body = `${stateName}'s ${totalPlans} plans place ${drug} on ${tierSpread} different tiers depending on the insurance company. Comparing insurance companies side by side matters more than picking a metal level — two plans at the same Silver tier can charge very different amounts.`
    } else if (tierSpread === 4) {
      body = `Across ${totalPlans} ${stateName} plans, ${drug} lands on ${tierSpread} different tiers depending on the insurance company. That spread alone can swing your monthly cost by $30 or more. Compare insurance companies side by side before locking in a plan — the metal level alone will not tell you the full story.`
    } else {
      body = `${stateName} plans split ${drug} across ${tierSpread} tier levels — fewer than the most fragmented states, but enough that two plans at the same metal level can charge different amounts. Check each plan's tier and approval rules before you decide.`
    }
    candidates.push({
      id: 'carrier-comparison',
      heading: `In ${stateName}, the insurance company you pick matters most`,
      body,
      strength: tierSpread * 4,
    })
  }

  // ── Module 5: Supply limits are the hidden friction ──
  if (pattern === 'supply-limits-standout' || quantityLimitPct > 80) {
    candidates.push({
      id: 'supply-limits',
      heading: `Watch for supply limits in ${stateName}`,
      body: `${quantityLimitCount} of ${totalPlans} ${stateName} plans limit how much ${drug} you can fill per month — typically a 30-day supply. If you need a larger quantity or use a higher dose, check whether your plan allows 90-day refills or mail-order options before enrolling.`,
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
