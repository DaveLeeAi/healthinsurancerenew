// ============================================================
// lib/formulary-helpers.ts — Formulary tier label humanizer
// Maps raw CMS formulary tier strings to consumer-facing labels
// with cost context, color coding, and sort order.
// ============================================================

// ─── Consumer-facing tier group ─────────────────────────────────────────────

export interface HumanTier {
  /** Consumer-facing label, e.g. "Generic (lowest cost)" */
  label: string
  /** Short label for badges/pills, e.g. "Generic" */
  shortLabel: string
  /** One-line cost context for consumers */
  costHint: string
  /** Estimated copay range string, e.g. "$5–$20" */
  costRange: string
  /** Sort order (lower = cheaper) */
  sortOrder: number
  /** Tailwind color classes */
  color: string
  bg: string
  border: string
  /** The canonical group key */
  group: TierGroup
}

export type TierGroup =
  | 'preventive'
  | 'insulin-ira'
  | 'generic'
  | 'preferred-brand'
  | 'non-preferred-brand'
  | 'specialty'
  | 'unknown'

// ─── Mapping table ──────────────────────────────────────────────────────────

const TIER_GROUPS: Record<TierGroup, Omit<HumanTier, 'group'>> = {
  preventive: {
    label: 'Preventive ($0 on eligible plans)',
    shortLabel: 'Preventive',
    costHint: 'Covered at no cost on eligible Marketplace plans',
    costRange: '$0',
    sortOrder: 0,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  'insulin-ira': {
    label: 'Insulin (IRA $35 cap)',
    shortLabel: 'Insulin (IRA $35 cap)',
    costHint: 'Capped at $35 per month under the Inflation Reduction Act for all Marketplace plans',
    costRange: '$35',
    sortOrder: 0.5,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  generic: {
    label: 'Generic (low cost)',
    shortLabel: 'Generic',
    costHint: 'Typically the lowest copay — same active ingredient as the brand-name version',
    costRange: '$5–$20',
    sortOrder: 1,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  'preferred-brand': {
    label: 'Preferred brand (moderate cost)',
    shortLabel: 'Preferred Brand',
    costHint: 'Brand-name drug with insurer-negotiated pricing — moderate copay',
    costRange: '$30–$60',
    sortOrder: 2,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  'non-preferred-brand': {
    label: 'Non-preferred brand (higher cost)',
    shortLabel: 'Non-Preferred Brand',
    costHint: 'Brand-name drug not on the preferred list — higher copay or coinsurance',
    costRange: '$60–$100+',
    sortOrder: 3,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  specialty: {
    label: 'Specialty (highest cost)',
    shortLabel: 'Specialty',
    costHint: 'High-cost or complex medication — often coinsurance-based (25–33%)',
    costRange: '$100–$500+',
    sortOrder: 4,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  unknown: {
    label: 'See plan documents',
    shortLabel: 'Other',
    costHint: 'Tier not mapped to a standard category — check your plan\'s drug list',
    costRange: 'Varies',
    sortOrder: 5,
    color: 'text-neutral-600',
    bg: 'bg-neutral-50',
    border: 'border-neutral-200',
  },
}

// ─── Raw → group classifier ─────────────────────────────────────────────────

/**
 * Classifies a raw CMS tier string into a consumer-facing tier group.
 * Handles all known CMS MR-PUF tier label variations.
 */
export function classifyTier(rawTier: string | undefined | null): TierGroup {
  if (!rawTier) return 'unknown'
  const upper = rawTier.toUpperCase().replace(/[-\s]+/g, '_')

  // Preventive — must check before generic (some labels include both words)
  if (upper.includes('PREVENTIVE') || upper.includes('ACA_PREVENTIVE')
      || upper === 'ZERO_COST_SHARE_PREVENTIVE' || upper === 'ZERO_COST_SHARE_PREVENTIVE_DRUGS')
    return 'preventive'

  // Specialty — check before preferred (some labels are "PREFERRED-SPECIALTY")
  if (upper.includes('SPECIALTY') || upper.includes('BIOLOGICS'))
    return 'specialty'

  // Non-preferred — check before preferred
  if (upper.includes('NON_PREFERRED') || upper.includes('NONPREFERRED'))
    return 'non-preferred-brand'

  // Carrier-specific numbered tiers: TIER-THREE, TIER-FOUR
  if (upper === 'TIER_THREE')
    return 'non-preferred-brand'
  if (upper === 'TIER_FOUR')
    return 'specialty'

  // Preferred brand (including TIER-TWO)
  if (upper === 'TIER_TWO')
    return 'preferred-brand'
  if (
    upper.includes('PREFERRED') &&
    !upper.includes('GENERIC') &&
    !upper.includes('NON')
  )
    return 'preferred-brand'

  // Generic (including "PREFERRED-GENERIC", "TIER-ONE", "TIER-ONE-B")
  if (upper.includes('GENERIC'))
    return 'generic'
  if (upper === 'TIER_ONE' || upper === 'TIER_ONE_B')
    return 'generic'

  // Catch-all: any unrecognized tier containing "ONE" or "GENERIC" → Generic
  if (upper.includes('ONE') || upper.includes('GENERIC'))
    return 'generic'

  // Formulary-level catch-alls that CMS sometimes uses
  if (upper.includes('FORMULARY'))
    return 'preferred-brand'

  // Log unknown tiers for discovery
  console.warn(`[formulary-helpers] Unknown tier label: "${rawTier}" (normalized: "${upper}")`)
  return 'unknown'
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns the full HumanTier object for a raw CMS tier label.
 */
export function humanizeTier(rawTier: string | undefined | null): HumanTier {
  const group = classifyTier(rawTier)
  return { ...TIER_GROUPS[group], group }
}

/**
 * Given an array of raw tier strings (from multiple plan entries),
 * returns a deduplicated, sorted array of HumanTier objects.
 */
export function humanizeTiers(rawTiers: (string | undefined | null)[]): HumanTier[] {
  const seen = new Set<TierGroup>()
  const result: HumanTier[] = []
  for (const raw of rawTiers) {
    const group = classifyTier(raw)
    if (!seen.has(group)) {
      seen.add(group)
      result.push({ ...TIER_GROUPS[group], group })
    }
  }
  return result.sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Generates a one-line consumer summary of tier placement across plans.
 * Example: "Most plans place this drug in a low-cost generic tier."
 */
export function summarizeTierPlacement(
  rawTiers: (string | undefined | null)[],
  drugName: string,
): string {
  const groups = humanizeTiersForDrug(rawTiers, drugName)
  if (groups.length === 0) return `Tier information is not available for ${drugName} in this dataset.`

  const primary = groups[0]

  if (groups.length === 1) {
    switch (primary.group) {
      case 'preventive':
        return `${drugName} is classified as a preventive drug, meaning it should be covered at $0 cost-sharing on eligible Marketplace plans.`
      case 'insulin-ira':
        return `${drugName} is an insulin product capped at $35 per month under the Inflation Reduction Act on all Marketplace plans.`
      case 'generic':
        return `${drugName} is placed on a generic (lowest-cost) tier across all plans in this dataset — typically $5–$20 per month.`
      case 'preferred-brand':
        return `${drugName} is listed as a preferred brand drug — moderate cost-sharing, typically $30–$60 per month.`
      case 'non-preferred-brand':
        return `${drugName} is classified as a non-preferred brand — higher cost-sharing, typically $60–$100+ per month.`
      case 'specialty':
        return `${drugName} is classified as a specialty drug — the highest cost tier, often 25–33% coinsurance ($100–$500+ per month).`
      default:
        return `Tier details for ${drugName} vary — check your specific plan's formulary document.`
    }
  }

  // Multiple tiers across plans
  const lowestLabel = primary.shortLabel.toLowerCase()
  return `Most plans place ${drugName} in a ${lowestLabel} tier (${primary.costRange} per month), though some carriers classify it differently. Your cost depends on your specific plan.`
}

/**
 * Returns the dominant (most common) tier group from an array of raw tiers.
 */
export function getDominantTierGroup(rawTiers: (string | undefined | null)[]): TierGroup {
  const counts = new Map<TierGroup, number>()
  for (const raw of rawTiers) {
    const group = classifyTier(raw)
    counts.set(group, (counts.get(group) ?? 0) + 1)
  }
  let maxGroup: TierGroup = 'unknown'
  let maxCount = 0
  for (const [group, count] of counts) {
    if (count > maxCount) {
      maxGroup = group
      maxCount = count
    }
  }
  return maxGroup
}

/**
 * Generates a short "what this means" interpretation for consumers.
 */
export function interpretCoverage(opts: {
  drugName: string
  totalPlans: number
  dominantGroup: TierGroup
  hasPriorAuth: boolean
  priorAuthPct: number
  hasGenericAvailable: boolean
}): string {
  const { drugName, dominantGroup, hasPriorAuth, priorAuthPct, hasGenericAvailable } = opts

  // Sentence 1: coverage + cost context
  let result = ''
  switch (dominantGroup) {
    case 'preventive':
      result = `${drugName} is covered at no cost on most Marketplace plans as a preventive medication.`
      break
    case 'insulin-ira':
      result = `${drugName} is an insulin product capped at $35 per month under the Inflation Reduction Act on all Marketplace plans.`
      break
    case 'generic':
      result = `${drugName} is covered on most Marketplace plans as a low-cost generic, typically $5–$20 per month.`
      break
    case 'preferred-brand':
      result = `${drugName} is covered on most Marketplace plans as a preferred brand drug, with moderate costs typically $30–$60 per month.`
      break
    case 'non-preferred-brand':
      result = `${drugName} is covered on most Marketplace plans but classified as non-preferred, meaning higher out-of-pocket costs ($60–$100+ per month).`
      break
    case 'specialty':
      result = `${drugName} is covered on most Marketplace plans as a specialty drug, the highest cost tier (often 25–33% coinsurance).`
      break
    default:
      result = `Coverage details for ${drugName} vary across Marketplace plans — check your specific plan's drug list.`
  }

  // Sentence 2: prior authorization
  if (!hasPriorAuth) {
    result += ' Prior authorization is not required.'
  } else if (priorAuthPct > 50) {
    result += ` Prior authorization is required on most plans (${Math.round(priorAuthPct)}%).`
  } else {
    result += ' Prior authorization may be required on some plans.'
  }

  // Optional sentence 3: generic tip
  if (hasGenericAvailable && dominantGroup !== 'generic' && dominantGroup !== 'preventive') {
    result += ' A lower-cost generic version may be available.'
  }

  return result
}

// ─── Drug-specific tier overrides ──────────────────────────────────────────

/** Insulin drug name patterns — IRA $35/month cap applies */
const INSULIN_PATTERNS = [
  'insulin', 'humulin', 'novolog', 'lantus', 'tresiba', 'basaglar',
  'humalog', 'levemir', 'toujeo', 'admelog', 'semglee', 'fiasp',
]

/** Biologic drugs that should NEVER be classified as Preventive */
const BIOLOGIC_BLOCKLIST = [
  'dupixent', 'enbrel', 'humira', 'cosentyx', 'skyrizi', 'rinvoq',
  'xeljanz', 'otezla', 'xolair', 'stelara', 'tremfya', 'taltz',
  'kevzara', 'actemra', 'orencia', 'cimzia', 'simponi',
]

/** GLP-1 receptor agonists — expensive brand/specialty drugs sometimes
 *  miscoded as preventive in carrier formulary files */
const GLP1_BLOCKLIST = [
  'ozempic', 'wegovy', 'mounjaro', 'zepbound', 'rybelsus', 'saxenda',
  'victoza', 'trulicity', 'byetta', 'bydureon', 'adlyxin', 'tanzeum',
  'semaglutide', 'tirzepatide', 'liraglutide', 'dulaglutide',
  'exenatide', 'lixisenatide',
]

/** Returns true if the drug name matches an insulin product */
export function isInsulinDrug(drugName: string): boolean {
  const lower = drugName.toLowerCase()
  return INSULIN_PATTERNS.some((p) => lower.includes(p))
}

/** Returns true if the drug name matches a biologic that should never be Preventive */
export function isBiologicDrug(drugName: string): boolean {
  const lower = drugName.toLowerCase()
  return BIOLOGIC_BLOCKLIST.some((p) => lower.includes(p))
}

/** Returns true if the drug name matches a GLP-1 agonist that should never be Preventive */
export function isGlp1Drug(drugName: string): boolean {
  const lower = drugName.toLowerCase()
  return GLP1_BLOCKLIST.some((p) => lower.includes(p))
}

/**
 * Applies drug-specific tier overrides:
 * - Insulins marked PREVENTIVE/ZERO-COST-SHARE → "insulin-ira" ($35/month IRA cap)
 * - Biologics marked PREVENTIVE → reclassified as "specialty"
 * - GLP-1 agonists marked PREVENTIVE → reclassified as "non-preferred-brand"
 *
 * Call this AFTER classifyTier() when the drug name is known.
 */
export function applyDrugTierOverride(
  group: TierGroup,
  drugName: string,
  rawTier?: string | null,
): TierGroup {
  // Insulin IRA $35 cap: insulins in preventive/zero-cost-share tier are $35, not $0
  if (isInsulinDrug(drugName) && (group === 'preventive')) {
    return 'insulin-ira'
  }

  // Biologic preventive override: carrier data error — reclassify as specialty
  if (isBiologicDrug(drugName) && group === 'preventive') {
    console.warn(
      `[formulary-helpers] Biologic "${drugName}" incorrectly marked as Preventive` +
      `${rawTier ? ` (raw: "${rawTier}")` : ''} — overriding to Specialty`
    )
    return 'specialty'
  }

  // GLP-1 preventive override: carrier data error — reclassify as non-preferred brand
  if (isGlp1Drug(drugName) && group === 'preventive') {
    console.warn(
      `[formulary-helpers] GLP-1 "${drugName}" incorrectly marked as Preventive` +
      `${rawTier ? ` (raw: "${rawTier}")` : ''} — overriding to Non-Preferred Brand`
    )
    return 'non-preferred-brand'
  }

  return group
}

/**
 * Drug-aware version of humanizeTier — applies insulin/biologic overrides.
 */
export function humanizeTierForDrug(
  rawTier: string | undefined | null,
  drugName: string,
): HumanTier {
  const baseGroup = classifyTier(rawTier)
  const group = applyDrugTierOverride(baseGroup, drugName, rawTier)
  return { ...TIER_GROUPS[group], group }
}

/**
 * Drug-aware version of humanizeTiers — applies insulin/biologic overrides.
 */
export function humanizeTiersForDrug(
  rawTiers: (string | undefined | null)[],
  drugName: string,
): HumanTier[] {
  const seen = new Set<TierGroup>()
  const result: HumanTier[] = []
  for (const raw of rawTiers) {
    const baseGroup = classifyTier(raw)
    const group = applyDrugTierOverride(baseGroup, drugName, raw)
    if (!seen.has(group)) {
      seen.add(group)
      result.push({ ...TIER_GROUPS[group], group })
    }
  }
  return result.sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Drug-aware version of getDominantTierGroup — applies insulin/biologic overrides.
 */
export function getDominantTierGroupForDrug(
  rawTiers: (string | undefined | null)[],
  drugName: string,
): TierGroup {
  const counts = new Map<TierGroup, number>()
  for (const raw of rawTiers) {
    const baseGroup = classifyTier(raw)
    const group = applyDrugTierOverride(baseGroup, drugName, raw)
    counts.set(group, (counts.get(group) ?? 0) + 1)
  }
  let maxGroup: TierGroup = 'unknown'
  let maxCount = 0
  for (const [group, count] of counts) {
    if (count > maxCount) {
      maxGroup = group
      maxCount = count
    }
  }
  return maxGroup
}
