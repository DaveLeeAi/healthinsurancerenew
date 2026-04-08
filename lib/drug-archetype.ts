/**
 * lib/drug-archetype.ts
 *
 * Drug Archetype Classification — assigns each drug to one of 12 archetypes
 * that drive distinct page voice, emphasis, and shopper guidance.
 *
 * Combined with state narrative patterns, this produces 12 × 10 = 120
 * narrative variants instead of just 10 (state-only) or 1 (template).
 */

export type DrugArchetype =
  | 'common-generic-chronic'      // metformin, lisinopril, atorvastatin
  | 'common-generic-acute'        // amoxicillin, azithromycin
  | 'brand-chronic'               // Eliquis, Jardiance
  | 'injectable-diabetes'         // insulin lispro, insulin glargine
  | 'glp1-weight-diabetes'        // Ozempic, Wegovy, Mounjaro
  | 'specialty-biologic'          // Humira, Enbrel, Stelara
  | 'mental-health'               // sertraline, fluoxetine, bupropion
  | 'inhaler-respiratory'         // albuterol, Symbicort, Advair
  | 'thyroid-hormone'             // levothyroxine, Synthroid
  | 'controlled-substance'        // Adderall, Xanax, Vyvanse
  | 'statin-cholesterol'          // atorvastatin, rosuvastatin
  | 'other'                       // fallback

export interface DrugClassification {
  archetype: DrugArchetype
  isGeneric: boolean
  isBrand: boolean
  isSpecialty: boolean
  isInjectable: boolean
  isControlled: boolean
  isInsulin: boolean
  chronicOrAcute: 'chronic' | 'acute' | 'both'
  typicalFriction: 'low' | 'moderate' | 'high'
  costSensitivity: 'low' | 'moderate' | 'high'
  quantityLimitLikelihood: 'low' | 'moderate' | 'high'
}

// ─── Archetype profile (drives content generation) ──────────────────────────

/**
 * Identifies the dominant story for the page. The narrative engine reads this
 * to decide what to LEAD with and what to push down or omit.
 *
 * - access: focus on coverage breadth, PA, step therapy, supply limits
 * - cost: focus on tier placement, copay range, deductible
 * - coverage: focus on whether the drug is on the formulary at all
 * - refills: focus on refill rules, quantity limits, controlled substance rules
 */
export type LeadIssue = 'access' | 'cost' | 'coverage' | 'refills'

export type CopyLength = 'short' | 'medium' | 'long'

/**
 * Section IDs the content engine knows how to render.
 * Order is dictated by archetype profile, not template.
 */
export type SectionId =
  | 'quick-answer'
  | 'cost-context'
  | 'tier-breakdown'
  | 'pa-section'
  | 'supply-limits'
  | 'refill-rules'
  | 'pharmacy-choice'
  | 'deductible-context'
  | 'ira-cap-callout'        // insulin only
  | 'biosimilar-callout'     // specialty biologic only
  | 'parity-callout'         // mental health only
  | 'device-note'            // inhaler only
  | 'brand-vs-generic'       // thyroid only

export interface ArchetypeProfile {
  archetype: DrugArchetype
  /** What the page should LEAD with. */
  leadIssue: LeadIssue
  /** Target body length for the editorial sections. */
  copyLength: CopyLength
  /** Section render order (top to bottom of the editorial body). */
  sectionPriority: SectionId[]
  /** Sections to OMIT entirely for this archetype. */
  suppressSections: SectionId[]
  /** Whether to require at least one conditional pattern block. */
  requireConditionalBlocks: boolean
  /** Maximum conditional blocks to display. */
  maxConditionalBlocks: number
  /** CTA angle — drives shopper guidance language. */
  ctaAngle:
    | 'compare-tier'              // generics: tier is the only variable
    | 'check-three-things'        // GLP-1: coverage + PA + supply limits
    | 'plan-shopping-critical'    // specialty: plan choice has biggest dollar impact
    | 'verify-parity-coverage'    // mental health: federal parity protection
    | 'check-quantity-rules'      // controlled substances: refill rules
    | 'cap-applies-everywhere'    // insulin: $35 cap on all marketplace plans
    | 'verify-device-coverage'    // inhalers: device-specific coverage
    | 'brand-vs-generic-matters'  // thyroid: substitution may not be 1:1
    | 'compare-tier-and-pa'       // brand chronic: tier + PA both matter
    | 'data-driven'               // fallback: report what data shows
}

/**
 * Profile registry — single source of truth for archetype-driven content.
 * The narrative engine reads from this to decide order, length, and emphasis.
 */
export const ARCHETYPE_PROFILES: Record<DrugArchetype, ArchetypeProfile> = {
  'common-generic-chronic': {
    archetype: 'common-generic-chronic',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: [
      'quick-answer',
      'cost-context',
      'tier-breakdown',
      'pharmacy-choice',
      'deductible-context',
    ],
    suppressSections: ['pa-section', 'supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'common-generic-acute': {
    archetype: 'common-generic-acute',
    leadIssue: 'coverage',
    copyLength: 'short',
    sectionPriority: [
      'quick-answer',
      'cost-context',
      'tier-breakdown',
    ],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'statin-cholesterol': {
    archetype: 'statin-cholesterol',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: [
      'quick-answer',
      'cost-context',
      'tier-breakdown',
      'pharmacy-choice',
    ],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'thyroid-hormone': {
    archetype: 'thyroid-hormone',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: [
      'quick-answer',
      'brand-vs-generic',
      'cost-context',
      'tier-breakdown',
      'pharmacy-choice',
    ],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'brand-vs-generic-matters',
  },

  'mental-health': {
    archetype: 'mental-health',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: [
      'quick-answer',
      'parity-callout',
      'cost-context',
      'tier-breakdown',
      'pharmacy-choice',
    ],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'verify-parity-coverage',
  },

  'inhaler-respiratory': {
    archetype: 'inhaler-respiratory',
    leadIssue: 'access',
    copyLength: 'medium',
    sectionPriority: [
      'quick-answer',
      'device-note',
      'tier-breakdown',
      'pa-section',
      'cost-context',
      'pharmacy-choice',
    ],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'verify-device-coverage',
  },

  'controlled-substance': {
    archetype: 'controlled-substance',
    leadIssue: 'refills',
    copyLength: 'medium',
    sectionPriority: [
      'quick-answer',
      'refill-rules',
      'supply-limits',
      'pa-section',
      'tier-breakdown',
      'cost-context',
    ],
    suppressSections: ['deductible-context'],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'check-quantity-rules',
  },

  'injectable-diabetes': {
    archetype: 'injectable-diabetes',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: [
      'quick-answer',
      'ira-cap-callout',
      'cost-context',
      'tier-breakdown',
      'pa-section',
      'pharmacy-choice',
    ],
    suppressSections: ['deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'cap-applies-everywhere',
  },

  'brand-chronic': {
    archetype: 'brand-chronic',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: [
      'quick-answer',
      'cost-context',
      'tier-breakdown',
      'pa-section',
      'pharmacy-choice',
      'deductible-context',
    ],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'compare-tier-and-pa',
  },

  'glp1-weight-diabetes': {
    archetype: 'glp1-weight-diabetes',
    leadIssue: 'access',
    copyLength: 'long',
    sectionPriority: [
      'quick-answer',
      'pa-section',
      'supply-limits',
      'tier-breakdown',
      'cost-context',
      'pharmacy-choice',
      'deductible-context',
    ],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'check-three-things',
  },

  'specialty-biologic': {
    archetype: 'specialty-biologic',
    leadIssue: 'cost',
    copyLength: 'long',
    sectionPriority: [
      'quick-answer',
      'pa-section',
      'tier-breakdown',
      'cost-context',
      'biosimilar-callout',
      'deductible-context',
      'pharmacy-choice',
      'supply-limits',
    ],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'plan-shopping-critical',
  },

  'other': {
    archetype: 'other',
    leadIssue: 'coverage',
    copyLength: 'medium',
    sectionPriority: [
      'quick-answer',
      'cost-context',
      'tier-breakdown',
      'pa-section',
      'pharmacy-choice',
      'deductible-context',
    ],
    suppressSections: [],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 2,
    ctaAngle: 'data-driven',
  },
}

/**
 * Convenience accessor — returns the profile for a given archetype.
 */
export function getArchetypeProfile(archetype: DrugArchetype): ArchetypeProfile {
  return ARCHETYPE_PROFILES[archetype]
}

// ─── Name pattern lists (lowercased substrings) ─────────────────────────────

const GLP1_NAMES = [
  'ozempic', 'wegovy', 'mounjaro', 'rybelsus', 'trulicity', 'saxenda',
  'victoza', 'byetta', 'bydureon', 'zepbound',
  'semaglutide', 'liraglutide', 'tirzepatide', 'dulaglutide', 'exenatide',
]

const STATIN_NAMES = [
  'atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin',
  'lovastatin', 'fluvastatin', 'pitavastatin',
  'lipitor', 'crestor', 'zocor', 'pravachol', 'mevacor', 'livalo',
]

const CONTROLLED_NAMES = [
  'amphetamine', 'dextroamphetamine', 'adderall',
  'methylphenidate', 'ritalin', 'concerta', 'focalin', 'metadate',
  'vyvanse', 'lisdexamfetamine',
  'alprazolam', 'xanax', 'diazepam', 'valium',
  'clonazepam', 'klonopin', 'lorazepam', 'ativan', 'temazepam',
  'zolpidem', 'ambien', 'eszopiclone', 'lunesta', 'zaleplon',
  'oxycodone', 'oxycontin', 'percocet', 'hydrocodone', 'vicodin',
  'tramadol', 'codeine', 'morphine', 'fentanyl', 'methadone', 'buprenorphine',
  'gabapentin', 'pregabalin', 'lyrica', 'neurontin',
  'modafinil', 'armodafinil', 'provigil', 'nuvigil',
]

const MENTAL_HEALTH_NAMES = [
  'sertraline', 'fluoxetine', 'escitalopram', 'citalopram', 'paroxetine',
  'venlafaxine', 'duloxetine', 'desvenlafaxine', 'levomilnacipran',
  'bupropion', 'mirtazapine', 'trazodone', 'vilazodone', 'vortioxetine',
  'zoloft', 'lexapro', 'prozac', 'celexa', 'paxil',
  'effexor', 'cymbalta', 'pristiq', 'wellbutrin', 'remeron',
  'aripiprazole', 'quetiapine', 'olanzapine', 'risperidone', 'ziprasidone',
  'lurasidone', 'paliperidone', 'clozapine', 'haloperidol',
  'abilify', 'seroquel', 'zyprexa', 'risperdal', 'latuda',
  'lamotrigine', 'lithium', 'lamictal',
  'amitriptyline', 'nortriptyline', 'imipramine', 'doxepin',
  'buspirone', 'buspar',
]

const INHALER_NAMES = [
  'albuterol', 'levalbuterol', 'budesonide', 'fluticasone', 'mometasone',
  'beclomethasone', 'ciclesonide',
  'symbicort', 'advair', 'breo', 'dulera', 'wixela',
  'montelukast', 'singulair',
  'proair', 'ventolin', 'proventil', 'xopenex',
  'ipratropium', 'tiotropium', 'spiriva', 'umeclidinium', 'incruse',
  'trelegy', 'anoro', 'stiolto',
  'pulmicort', 'qvar', 'flovent', 'arnuity', 'asmanex',
  'formoterol', 'salmeterol', 'arformoterol',
]

const THYROID_NAMES = [
  'levothyroxine', 'synthroid', 'levoxyl', 'unithroid', 'tirosint',
  'liothyronine', 'cytomel',
  'armour thyroid', 'np thyroid', 'nature-throid',
  'methimazole', 'tapazole', 'propylthiouracil',
]

// ─── Antibiotic/acute name hints (for common-generic-acute detection) ───────

const ACUTE_NAMES = [
  'amoxicillin', 'amoxicillin-clavulanate', 'augmentin',
  'azithromycin', 'zithromax', 'z-pak',
  'cephalexin', 'keflex', 'cefdinir', 'cefuroxime', 'cefpodoxime',
  'ciprofloxacin', 'cipro', 'levofloxacin', 'levaquin', 'moxifloxacin',
  'doxycycline', 'minocycline', 'tetracycline',
  'clindamycin', 'cleocin',
  'metronidazole', 'flagyl',
  'sulfamethoxazole', 'trimethoprim', 'bactrim',
  'nitrofurantoin', 'macrobid', 'macrodantin',
  'penicillin', 'ampicillin',
  'fluconazole', 'diflucan',
  'acyclovir', 'valacyclovir', 'valtrex',
  'oseltamivir', 'tamiflu',
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function nameMatches(drugName: string, list: string[]): boolean {
  const n = drugName.toLowerCase().trim()
  return list.some(needle => n === needle || n.includes(needle))
}

function normalizeTier(tier: string): string {
  const t = tier.toLowerCase().replace(/_/g, '-')
  if (t.includes('specialty')) return 'specialty'
  if (t.includes('non-preferred')) return 'non-preferred-brand'
  if (t.includes('preferred-brand') || t.includes('preferred-brands')) return 'preferred-brand'
  if (t.includes('generic') && !t.includes('brand')) return 'generic'
  return t
}

// ─── Main classifier ────────────────────────────────────────────────────────

export interface ClassifyParams {
  drugName: string
  dominantTier: string
  nationalPaPct: number
  nationalQlPct: number
  totalPlans: number
  /** Median plans across all drugs in the dataset (default ~97). */
  medianTotalPlans?: number
  drugClass?: string
  isGenericFlag?: boolean
}

export function classifyDrug(params: ClassifyParams): DrugClassification {
  const {
    drugName,
    dominantTier,
    nationalPaPct,
    nationalQlPct,
    totalPlans,
    medianTotalPlans = 97,
  } = params

  const tier = normalizeTier(dominantTier)
  const name = drugName.toLowerCase().trim()

  // Rule 1 — Insulin
  if (name.includes('insulin')) {
    return baseProfile('injectable-diabetes', {
      tier,
      isInjectable: true,
      isInsulin: true,
      chronicOrAcute: 'chronic',
      typicalFriction: 'low',     // IRA $35 cap
      costSensitivity: 'low',     // capped
      qlLikelihood: 'high',       // common in data
    })
  }

  // Rule 2 — GLP-1
  if (nameMatches(name, GLP1_NAMES)) {
    return baseProfile('glp1-weight-diabetes', {
      tier,
      isInjectable: !name.includes('rybelsus'),
      chronicOrAcute: 'chronic',
      typicalFriction: 'high',
      costSensitivity: 'high',
      qlLikelihood: 'high',
    })
  }

  // Rule 3 — Statin
  if (nameMatches(name, STATIN_NAMES)) {
    return baseProfile('statin-cholesterol', {
      tier,
      chronicOrAcute: 'chronic',
      typicalFriction: 'low',
      costSensitivity: 'low',
      qlLikelihood: 'low',
    })
  }

  // Rule 4 — Controlled substance
  if (nameMatches(name, CONTROLLED_NAMES)) {
    return baseProfile('controlled-substance', {
      tier,
      isControlled: true,
      chronicOrAcute: 'both',
      typicalFriction: 'moderate',
      costSensitivity: 'moderate',
      qlLikelihood: 'high',
    })
  }

  // Rule 5 — Mental health
  if (nameMatches(name, MENTAL_HEALTH_NAMES)) {
    return baseProfile('mental-health', {
      tier,
      chronicOrAcute: 'chronic',
      typicalFriction: 'low',
      costSensitivity: 'low',
      qlLikelihood: 'moderate',
    })
  }

  // Rule 6 — Inhaler
  if (nameMatches(name, INHALER_NAMES)) {
    return baseProfile('inhaler-respiratory', {
      tier,
      chronicOrAcute: 'chronic',
      typicalFriction: 'moderate',
      costSensitivity: 'moderate',
      qlLikelihood: 'moderate',
    })
  }

  // Rule 7 — Thyroid
  if (nameMatches(name, THYROID_NAMES)) {
    return baseProfile('thyroid-hormone', {
      tier,
      chronicOrAcute: 'chronic',
      typicalFriction: 'low',
      costSensitivity: 'low',
      qlLikelihood: 'low',
    })
  }

  // Rule 8 — Specialty biologic (data-signal driven)
  if (tier === 'specialty' && nationalPaPct > 50 && totalPlans < medianTotalPlans) {
    return baseProfile('specialty-biologic', {
      tier,
      isSpecialty: true,
      chronicOrAcute: 'chronic',
      typicalFriction: 'high',
      costSensitivity: 'high',
      qlLikelihood: 'high',
    })
  }

  // Also catch specialty-tier high-PA drugs even if total plans are larger.
  if (tier === 'specialty' && nationalPaPct > 70) {
    return baseProfile('specialty-biologic', {
      tier,
      isSpecialty: true,
      chronicOrAcute: 'chronic',
      typicalFriction: 'high',
      costSensitivity: 'high',
      qlLikelihood: 'high',
    })
  }

  // Rule 9 — Brand chronic (data-signal driven)
  if (
    (tier === 'preferred-brand' || tier === 'non-preferred-brand') &&
    nationalPaPct > 30
  ) {
    return baseProfile('brand-chronic', {
      tier,
      isBrand: true,
      chronicOrAcute: 'chronic',
      typicalFriction: 'moderate',
      costSensitivity: 'high',
      qlLikelihood: 'moderate',
    })
  }

  // Rule 10 — Common generic acute
  if (
    tier === 'generic' &&
    nationalPaPct < 20 &&
    totalPlans > medianTotalPlans * 1.5 &&
    nameMatches(name, ACUTE_NAMES)
  ) {
    return baseProfile('common-generic-acute', {
      tier,
      isGeneric: true,
      chronicOrAcute: 'acute',
      typicalFriction: 'low',
      costSensitivity: 'low',
      qlLikelihood: 'low',
    })
  }

  // Rule 11 — Common generic chronic
  if (tier === 'generic' && totalPlans > medianTotalPlans) {
    return baseProfile('common-generic-chronic', {
      tier,
      isGeneric: true,
      chronicOrAcute: 'chronic',
      typicalFriction: 'low',
      costSensitivity: 'low',
      qlLikelihood: 'low',
    })
  }

  // Rule 12 — Fallback
  // Even fallback gets reasonable profile flags from tier signals.
  return baseProfile('other', {
    tier,
    isGeneric: tier === 'generic',
    isBrand: tier.includes('brand'),
    isSpecialty: tier === 'specialty',
    chronicOrAcute: 'both',
    typicalFriction:
      nationalPaPct > 50 ? 'high' : nationalPaPct > 20 ? 'moderate' : 'low',
    costSensitivity: tier === 'specialty' ? 'high' : tier === 'generic' ? 'low' : 'moderate',
    qlLikelihood:
      nationalQlPct > 60 ? 'high' : nationalQlPct > 30 ? 'moderate' : 'low',
  })
}

// ─── Profile builder ────────────────────────────────────────────────────────

interface ProfileOpts {
  tier: string
  isGeneric?: boolean
  isBrand?: boolean
  isSpecialty?: boolean
  isInjectable?: boolean
  isControlled?: boolean
  isInsulin?: boolean
  chronicOrAcute?: 'chronic' | 'acute' | 'both'
  typicalFriction?: 'low' | 'moderate' | 'high'
  costSensitivity?: 'low' | 'moderate' | 'high'
  qlLikelihood?: 'low' | 'moderate' | 'high'
}

function baseProfile(archetype: DrugArchetype, opts: ProfileOpts): DrugClassification {
  const { tier } = opts
  return {
    archetype,
    isGeneric: opts.isGeneric ?? tier === 'generic',
    isBrand: opts.isBrand ?? tier.includes('brand'),
    isSpecialty: opts.isSpecialty ?? tier === 'specialty',
    isInjectable: opts.isInjectable ?? false,
    isControlled: opts.isControlled ?? false,
    isInsulin: opts.isInsulin ?? false,
    chronicOrAcute: opts.chronicOrAcute ?? 'both',
    typicalFriction: opts.typicalFriction ?? 'moderate',
    costSensitivity: opts.costSensitivity ?? 'moderate',
    quantityLimitLikelihood: opts.qlLikelihood ?? 'moderate',
  }
}
