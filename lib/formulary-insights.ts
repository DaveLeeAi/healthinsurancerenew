/**
 * lib/formulary-insights.ts
 *
 * Generates state-specific, decision-useful content differentiators for
 * formulary drug pages. Each field replaces or augments a specific section
 * of the V35 template with genuinely different sentences — not just
 * variable substitution.
 *
 * All generated sentences match V35 tone:
 *   - Short, active voice, grade 6–8 reading level
 *   - "you/your" consumer framing
 *   - "plans we reviewed" attribution
 *   - Dashes for asides — no clinical jargon
 *
 * If baseline data is unavailable, every field returns an empty string so
 * the page falls back to its existing V35 defaults.
 */

import type { DrugBaseline, FormularyDrug } from './types'

export interface StateInsights {
  /** Appended to AEO block BLUF. Empty string = nothing to add. */
  accessQualifier: string
  /** Replaces the 4-way ternary in the editorial insight box. */
  insightBody: string
  /** Qualifier appended to the PA row in EvidenceBlock. */
  paComparison: string
  /** Qualifier appended to the tier row in EvidenceBlock. */
  tierComparison: string
  /** Cost section intro with state-specific framing. */
  costContext: string
  /** Replaces generic varyRow[0] (tier placement matters). */
  tierBreakdown: string
  /** Appended to plan rules PA section body. Empty string = nothing to add. */
  paNote: string
}

// Tier labels for consumer-facing copy (matches humanizeTierForDrug output)
const TIER_LABELS: Record<string, string> = {
  generic: 'generic',
  'preferred-brand': 'preferred brand',
  'non-preferred-brand': 'non-preferred brand',
  specialty: 'specialty',
  preventive: 'preventive',
}

function tierLabel(key: string): string {
  return TIER_LABELS[key] ?? key
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Generates per-state content differentiation signals for a formulary page.
 *
 * Returns an object where every field is either a meaningful sentence OR an
 * empty string — never undefined. Callers can use `field || defaultText`.
 */
export function generateStateInsights(params: {
  drugName: string
  stateName: string
  stateCode: string
  stateResults: FormularyDrug[]
  baseline: DrugBaseline
}): StateInsights {
  const { drugName, stateName, stateCode, stateResults, baseline } = params

  const stateUpper = stateCode.toUpperCase()
  const stateData = baseline.per_state[stateUpper]
  const totalPlans = stateResults.length

  // If we have no per-state data, return graceful fallbacks (empty strings)
  if (!stateData || totalPlans === 0) {
    return emptyInsights()
  }

  const statePaPct = stateData.prior_auth_pct
  const nationalPaPct = baseline.prior_auth_pct_national
  const stateDominantTier = stateData.dominant_tier
  const nationalDominantTier = baseline.dominant_tier_national
  const paDiff = statePaPct - nationalPaPct

  // ── accessQualifier ─────────────────────────────────────────────────────────
  let accessQualifier = ''
  if (paDiff > 15) {
    accessQualifier = `Approval requirements here are stricter than most states.`
  } else if (paDiff < -15) {
    accessQualifier = `Fewer plans here require approval than in most states.`
  } else if (totalPlans < 5) {
    accessQualifier = `Coverage options are limited — comparing the available plans matters more.`
  }

  // ── insightBody ─────────────────────────────────────────────────────────────
  const insightParts: string[] = []

  insightParts.push(
    `Your plan choice in ${stateName} determines the tier for ${drugName}, what you pay each month, and whether you need approval before your first fill.`
  )

  if (Math.abs(paDiff) > 10) {
    const direction = paDiff > 0 ? 'higher' : 'lower'
    const consequence =
      paDiff > 0
        ? 'That adds an extra step before your first fill.'
        : 'That means fewer access hurdles here than in most states.'
    insightParts.push(
      `In ${stateName}, ${statePaPct}% of plans require prior approval — ${direction} than the ${nationalPaPct}% national average. ${consequence}`
    )
  }

  if (stateDominantTier !== nationalDominantTier) {
    insightParts.push(
      `Most ${stateName} plans place ${drugName} on a ${tierLabel(stateDominantTier)} tier, while nationally the most common placement is ${tierLabel(nationalDominantTier)}. That difference directly affects your monthly cost.`
    )
  } else {
    const tierKeys = Object.keys(baseline.tier_distribution_pct).filter(
      (k) => (baseline.tier_distribution_pct[k] ?? 0) > 5
    )
    if (tierKeys.length > 2 && stateResults.length >= 5) {
      insightParts.push(
        `Tier placement varies across ${stateName} plans — which means the plan you pick has a direct impact on what you pay each month.`
      )
    }
  }

  insightParts.push(
    `Compare plans on tier assignment, approval requirements, and deductible structure to find the best fit.`
  )

  const insightBody = insightParts.join(' ')

  // ── paComparison ─────────────────────────────────────────────────────────────
  let paComparison = ''
  if (paDiff > 10) {
    paComparison = `(higher than the ${nationalPaPct}% national average)`
  } else if (paDiff < -10) {
    paComparison = `(lower than the ${nationalPaPct}% national average)`
  } else {
    paComparison = `(close to the national average)`
  }

  // ── tierComparison ───────────────────────────────────────────────────────────
  let tierComparison = ''
  if (stateDominantTier !== nationalDominantTier) {
    tierComparison = `(nationally, ${tierLabel(nationalDominantTier)} is more common)`
  }

  // ── costContext ──────────────────────────────────────────────────────────────
  let costContext: string
  const highTiers = ['specialty', 'non-preferred-brand']
  if (highTiers.includes(stateDominantTier) && stateDominantTier !== nationalDominantTier) {
    costContext = `Most ${stateName} plans place ${drugName} on a ${tierLabel(stateDominantTier)} tier, which typically means higher monthly costs after your deductible. The plan you choose matters here — tier placement varies.`
  } else if (paDiff > 15) {
    costContext = `In ${stateName}, the most common access hurdle for ${drugName} is prior approval — required by ${statePaPct}% of plans we reviewed. Getting that step done before your first fill can affect both timing and cost.`
  } else {
    costContext = `In ${stateName}, most plans place ${drugName} on a ${tierLabel(stateDominantTier)} tier. Your actual cost depends on that tier assignment and where you are in your deductible year.`
  }

  // ── tierBreakdown ────────────────────────────────────────────────────────────
  let tierBreakdown = ''

  // Build a count of each tier from stateResults
  const tierCounts: Record<string, number> = {}
  for (const r of stateResults) {
    const t = (r.drug_tier ?? 'unknown').toLowerCase().replace(/_/g, '-').replace(/ /g, '-')
    // Normalise to canonical keys
    const norm =
      t.includes('generic') ? 'generic'
      : t.includes('preferred-brand') && !t.includes('non') ? 'preferred-brand'
      : t.includes('non-preferred') || t.includes('non_preferred') ? 'non-preferred-brand'
      : t.includes('specialty') ? 'specialty'
      : t.includes('preventive') ? 'preventive'
      : 'other'
    tierCounts[norm] = (tierCounts[norm] ?? 0) + 1
  }

  const tierEntries = Object.entries(tierCounts)
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a)

  if (tierEntries.length >= 2) {
    const [tier1Key, tier1Count] = tierEntries[0]
    const [tier2Key, tier2Count] = tierEntries[1]
    tierBreakdown = `${tier1Count} ${stateName} plans place ${drugName} on a ${tierLabel(tier1Key)} tier, ${tier2Count} on ${tierLabel(tier2Key)}. That tier difference is where most of your cost variation sits.`
  } else if (tierEntries.length === 1) {
    const [tier1Key] = tierEntries[0]
    tierBreakdown = `All ${stateName} plans we reviewed place ${drugName} on a ${tierLabel(tier1Key)} tier. Tier differences between plans can mean $40–$80 per month or more — worth checking when comparing options.`
  } else {
    tierBreakdown = `Tier placements for ${drugName} vary across ${stateName} plans. The plan you pick has a direct impact on what you pay each month.`
  }

  // ── paNote ───────────────────────────────────────────────────────────────────
  let paNote: string
  if (paDiff > 10) {
    paNote = `Prior approval rates for ${drugName} in ${stateName} are above the national average — making it especially important to confirm requirements before choosing a plan.`
  } else if (paDiff < -10) {
    paNote = `${capitalize(stateName)} plans are less likely to require prior approval for ${drugName} than the national average.`
  } else {
    paNote = `Prior approval rates for ${drugName} in ${stateName} run close to the national average of ${nationalPaPct}%.`
  }

  return {
    accessQualifier,
    insightBody,
    paComparison,
    tierComparison,
    costContext,
    tierBreakdown,
    paNote,
  }
}

function emptyInsights(): StateInsights {
  return {
    accessQualifier: '',
    insightBody: '',
    paComparison: '',
    tierComparison: '',
    costContext: '',
    tierBreakdown: '',
    paNote: '',
  }
}
