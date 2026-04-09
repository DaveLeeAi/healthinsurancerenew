/**
 * lib/drug-archetype.ts
 *
 * Drug Archetype Classification — assigns each drug to one of 19 archetypes
 * that drive distinct page voice, emphasis, and shopper guidance.
 *
 * Combined with state narrative patterns, this produces 19 × 10 = 190
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
  | 'anticoagulant'               // warfarin, Eliquis, Xarelto, Pradaxa
  | 'contraceptive'               // ethinyl estradiol, levonorgestrel, NuvaRing
  | 'ophthalmic'                  // latanoprost, timolol drops, Restasis
  | 'dermatology'                 // clobetasol, triamcinolone, tretinoin
  | 'pain-chronic'                // meloxicam, diclofenac, celecoxib, cyclobenzaprine
  | 'seizure-neuro'               // levetiracetam, carbamazepine, topiramate
  | 'gi-acid'                     // omeprazole, pantoprazole, famotidine
  | 'blood-pressure-other'        // diltiazem, carvedilol, metoprolol ER forms
  | 'transplant-immuno'           // tacrolimus, mycophenolate, cyclosporine
  | 'oncology'                    // tamoxifen, letrozole, imatinib, ibrutinib
  | 'copd-maintenance'            // glycopyrrolate, aclidinium, indacaterol
  // ── Wave 1/2 archetypes ───────────────────────────────────────────────────
  | 'devices-supplies'            // lancets, test strips, CGM, nebulizers
  | 'vaccine'                     // influenza, shingles, pneumococcal, HPV
  | 'rx-supplements'              // folic acid, B12, iron, vitamin D, prenatal vitamins
  | 'smoking-cessation'           // varenicline, nicotine replacement
  | 'antibiotic-systemic'         // vancomycin, linezolid, rifampin, IV antibiotics
  | 'hormone-hrt'                 // estradiol, conjugated estrogens, progesterone HRT
  | 'prenatal-vitamins'           // prescription prenatal vitamins
  | 'cardiac-other'               // digoxin, amiodarone, isosorbide, sacubitril
  | 'hiv-art'                     // tenofovir, dolutegravir, biktarvy, Truvada
  | 'antiemetic-gi'               // ondansetron, prochlorperazine, metoclopramide
  | 'neuro-parkinsons'            // levodopa, pramipexole, donepezil, memantine
  | 'diabetes-oral'               // glipizide, pioglitazone, sitagliptin, empagliflozin
  | 'migraine'                    // sumatriptan, ubrogepant, rimegepant, erenumab
  | 'gi-ibd'                      // mesalamine, balsalazide, ozanimod, vedolizumab
  | 'urology'                     // tamsulosin, oxybutynin, sildenafil, finasteride
  | 'antiviral-hep-covid'         // sofosbuvir, paxlovid, entecavir, valganciclovir
  | 'allergy-rhinitis'            // loratadine, cetirizine, azelastine, hydroxyzine
  | 'antipsychotic'               // asenapine, brexpiprazole, cariprazine, lumateperone
  | 'steroid-systemic'            // prednisone, methylprednisolone, dexamethasone
  | 'hematology'                  // hydroxyurea, epoetin, filgrastim, deferasirox
  | 'renal-dialysis'              // sevelamer, cinacalcet, patiromer, finerenone
  | 'osteoporosis'                // alendronate, teriparatide, denosumab, raloxifene
  | 'antifungal-systemic'         // itraconazole, voriconazole, terbinafine oral
  | 'immunology-dmard'            // hydroxychloroquine, leflunomide, tofacitinib, tocilizumab
  | 'weight-mgmt'                 // phentermine, qsymia, contrave, orlistat
  | 'testosterone-androgen'       // testosterone gel/cypionate, androgel, danazol
  | 'pulmonary-specialty'         // bosentan, treprostinil, nintedanib, pirfenidone
  | 'epinephrine-emergency'       // epinephrine, EpiPen, Auvi-Q
  | 'antiplatelet'                // clopidogrel, ticagrelor, prasugrel, dipyridamole
  | 'otic-ear'                    // ciprofloxacin otic, ofloxacin otic, cortisporin
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
  | 'ira-cap-callout'         // insulin only
  | 'biosimilar-callout'      // specialty biologic only
  | 'parity-callout'          // mental health only
  | 'device-note'             // inhaler only
  | 'brand-vs-generic'        // thyroid + anticoagulant
  | 'aca-preventive-callout'  // contraceptive only
  | 'monitoring-note'         // anticoagulant only (INR)
  | 'formulation-note'        // dermatology + ophthalmic (cream vs ointment, drops vs gel)

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
    | 'brand-vs-generic-matters'  // thyroid + seizure-neuro: substitution may not be 1:1
    | 'compare-tier-and-pa'       // brand chronic: tier + PA both matter
    | 'verify-aca-preventive'     // contraceptive: should be $0 under ACA
    | 'doac-vs-warfarin'          // anticoagulant: huge cost gap, switching has risk
    | 'check-formulation-coverage' // dermatology + ophthalmic: cream vs ointment differs
    | 'check-nsaid-options'       // pain-chronic: compare NSAID tier + OTC equivalents
    | 'verify-continuity-coverage' // transplant-immuno: plan continuity is critical
    | 'oncology-plan-critical'    // oncology: plan choice affects specialty drug access
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

  'anticoagulant': {
    archetype: 'anticoagulant',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: [
      'quick-answer',
      'brand-vs-generic',     // warfarin vs DOAC is the central decision
      'cost-context',
      'tier-breakdown',
      'pa-section',
      'monitoring-note',      // INR for warfarin
      'pharmacy-choice',
      'deductible-context',
    ],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'doac-vs-warfarin',
  },

  'contraceptive': {
    archetype: 'contraceptive',
    leadIssue: 'coverage',
    copyLength: 'short',
    sectionPriority: [
      'quick-answer',
      'aca-preventive-callout', // ACA mandates $0 — lead with it
      'tier-breakdown',
      'cost-context',
      'pharmacy-choice',
    ],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'verify-aca-preventive',
  },

  'ophthalmic': {
    archetype: 'ophthalmic',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: [
      'quick-answer',
      'cost-context',
      'tier-breakdown',
      'formulation-note',  // drops vs gel vs suspension differ
      'pharmacy-choice',
    ],
    suppressSections: ['supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'check-formulation-coverage',
  },

  'dermatology': {
    archetype: 'dermatology',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: [
      'quick-answer',
      'cost-context',
      'tier-breakdown',
      'formulation-note',  // cream vs ointment vs lotion
      'pharmacy-choice',
    ],
    suppressSections: ['supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'check-formulation-coverage',
  },

  'pain-chronic': {
    archetype: 'pain-chronic',
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
    ctaAngle: 'check-nsaid-options',
  },

  'seizure-neuro': {
    archetype: 'seizure-neuro',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: [
      'quick-answer',
      'brand-vs-generic',   // brand/generic switching is clinically non-trivial
      'cost-context',
      'tier-breakdown',
      'pa-section',
      'pharmacy-choice',
    ],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'brand-vs-generic-matters',
  },

  'gi-acid': {
    archetype: 'gi-acid',
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

  'blood-pressure-other': {
    archetype: 'blood-pressure-other',
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

  'transplant-immuno': {
    archetype: 'transplant-immuno',
    leadIssue: 'access',
    copyLength: 'long',
    sectionPriority: [
      'quick-answer',
      'pa-section',
      'tier-breakdown',
      'supply-limits',
      'cost-context',
      'monitoring-note',    // tacrolimus/cyclosporine require lab monitoring
      'pharmacy-choice',
      'deductible-context',
    ],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 3,
    ctaAngle: 'verify-continuity-coverage',
  },

  'oncology': {
    archetype: 'oncology',
    leadIssue: 'access',
    copyLength: 'long',
    sectionPriority: [
      'quick-answer',
      'pa-section',
      'tier-breakdown',
      'cost-context',
      'supply-limits',
      'deductible-context',
      'pharmacy-choice',
    ],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 3,
    ctaAngle: 'oncology-plan-critical',
  },

  'copd-maintenance': {
    archetype: 'copd-maintenance',
    leadIssue: 'access',
    copyLength: 'medium',
    sectionPriority: [
      'quick-answer',
      'device-note',        // inhaled formulation specifics matter
      'tier-breakdown',
      'pa-section',
      'cost-context',
      'pharmacy-choice',
    ],
    suppressSections: ['deductible-context'],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'verify-device-coverage',
  },

  'devices-supplies': {
    archetype: 'devices-supplies',
    leadIssue: 'coverage',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice'],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'data-driven',
  },

  'vaccine': {
    archetype: 'vaccine',
    leadIssue: 'coverage',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'aca-preventive-callout', 'tier-breakdown', 'cost-context'],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'verify-aca-preventive',
  },

  'rx-supplements': {
    archetype: 'rx-supplements',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice'],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'smoking-cessation': {
    archetype: 'smoking-cessation',
    leadIssue: 'coverage',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'aca-preventive-callout', 'tier-breakdown', 'cost-context'],
    suppressSections: ['supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'verify-aca-preventive',
  },

  'antibiotic-systemic': {
    archetype: 'antibiotic-systemic',
    leadIssue: 'coverage',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice'],
    suppressSections: ['supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'hormone-hrt': {
    archetype: 'hormone-hrt',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pa-section', 'formulation-note', 'pharmacy-choice'],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier-and-pa',
  },

  'prenatal-vitamins': {
    archetype: 'prenatal-vitamins',
    leadIssue: 'coverage',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'aca-preventive-callout', 'tier-breakdown', 'cost-context'],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'verify-aca-preventive',
  },

  'cardiac-other': {
    archetype: 'cardiac-other',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pa-section', 'pharmacy-choice', 'deductible-context'],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'compare-tier-and-pa',
  },

  'hiv-art': {
    archetype: 'hiv-art',
    leadIssue: 'access',
    copyLength: 'long',
    sectionPriority: ['quick-answer', 'pa-section', 'tier-breakdown', 'supply-limits', 'cost-context', 'pharmacy-choice', 'deductible-context'],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 3,
    ctaAngle: 'plan-shopping-critical',
  },

  'antiemetic-gi': {
    archetype: 'antiemetic-gi',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice'],
    suppressSections: ['supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'neuro-parkinsons': {
    archetype: 'neuro-parkinsons',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: ['quick-answer', 'brand-vs-generic', 'cost-context', 'tier-breakdown', 'pa-section', 'pharmacy-choice'],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 2,
    ctaAngle: 'brand-vs-generic-matters',
  },

  'diabetes-oral': {
    archetype: 'diabetes-oral',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice', 'deductible-context'],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'migraine': {
    archetype: 'migraine',
    leadIssue: 'access',
    copyLength: 'medium',
    sectionPriority: ['quick-answer', 'pa-section', 'cost-context', 'tier-breakdown', 'supply-limits', 'pharmacy-choice'],
    suppressSections: ['deductible-context'],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'compare-tier-and-pa',
  },

  'gi-ibd': {
    archetype: 'gi-ibd',
    leadIssue: 'access',
    copyLength: 'long',
    sectionPriority: ['quick-answer', 'pa-section', 'tier-breakdown', 'cost-context', 'supply-limits', 'pharmacy-choice', 'deductible-context'],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'plan-shopping-critical',
  },

  'urology': {
    archetype: 'urology',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice'],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'antiviral-hep-covid': {
    archetype: 'antiviral-hep-covid',
    leadIssue: 'access',
    copyLength: 'medium',
    sectionPriority: ['quick-answer', 'pa-section', 'tier-breakdown', 'cost-context', 'pharmacy-choice', 'deductible-context'],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'plan-shopping-critical',
  },

  'allergy-rhinitis': {
    archetype: 'allergy-rhinitis',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice'],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'antipsychotic': {
    archetype: 'antipsychotic',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: ['quick-answer', 'parity-callout', 'cost-context', 'tier-breakdown', 'pa-section', 'pharmacy-choice'],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'verify-parity-coverage',
  },

  'steroid-systemic': {
    archetype: 'steroid-systemic',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice'],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'hematology': {
    archetype: 'hematology',
    leadIssue: 'access',
    copyLength: 'long',
    sectionPriority: ['quick-answer', 'pa-section', 'tier-breakdown', 'cost-context', 'supply-limits', 'deductible-context', 'pharmacy-choice'],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 3,
    ctaAngle: 'plan-shopping-critical',
  },

  'renal-dialysis': {
    archetype: 'renal-dialysis',
    leadIssue: 'access',
    copyLength: 'medium',
    sectionPriority: ['quick-answer', 'pa-section', 'tier-breakdown', 'cost-context', 'pharmacy-choice', 'deductible-context'],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'plan-shopping-critical',
  },

  'osteoporosis': {
    archetype: 'osteoporosis',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pa-section', 'pharmacy-choice', 'deductible-context'],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 2,
    ctaAngle: 'compare-tier-and-pa',
  },

  'antifungal-systemic': {
    archetype: 'antifungal-systemic',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice'],
    suppressSections: ['supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'immunology-dmard': {
    archetype: 'immunology-dmard',
    leadIssue: 'access',
    copyLength: 'long',
    sectionPriority: ['quick-answer', 'pa-section', 'tier-breakdown', 'cost-context', 'supply-limits', 'deductible-context', 'pharmacy-choice'],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 3,
    ctaAngle: 'plan-shopping-critical',
  },

  'weight-mgmt': {
    archetype: 'weight-mgmt',
    leadIssue: 'access',
    copyLength: 'medium',
    sectionPriority: ['quick-answer', 'pa-section', 'supply-limits', 'tier-breakdown', 'cost-context', 'pharmacy-choice'],
    suppressSections: ['deductible-context'],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 2,
    ctaAngle: 'check-three-things',
  },

  'testosterone-androgen': {
    archetype: 'testosterone-androgen',
    leadIssue: 'cost',
    copyLength: 'medium',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pa-section', 'formulation-note', 'pharmacy-choice'],
    suppressSections: ['supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier-and-pa',
  },

  'pulmonary-specialty': {
    archetype: 'pulmonary-specialty',
    leadIssue: 'access',
    copyLength: 'long',
    sectionPriority: ['quick-answer', 'pa-section', 'tier-breakdown', 'cost-context', 'supply-limits', 'deductible-context', 'pharmacy-choice'],
    suppressSections: [],
    requireConditionalBlocks: true,
    maxConditionalBlocks: 3,
    ctaAngle: 'plan-shopping-critical',
  },

  'epinephrine-emergency': {
    archetype: 'epinephrine-emergency',
    leadIssue: 'coverage',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice'],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'data-driven',
  },

  'antiplatelet': {
    archetype: 'antiplatelet',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice', 'deductible-context'],
    suppressSections: ['pa-section', 'supply-limits'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
  },

  'otic-ear': {
    archetype: 'otic-ear',
    leadIssue: 'cost',
    copyLength: 'short',
    sectionPriority: ['quick-answer', 'cost-context', 'tier-breakdown', 'pharmacy-choice'],
    suppressSections: ['pa-section', 'supply-limits', 'deductible-context'],
    requireConditionalBlocks: false,
    maxConditionalBlocks: 1,
    ctaAngle: 'compare-tier',
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

// ─── Anticoagulants ─────────────────────────────────────────────────────────
// Warfarin generics + the four DOACs. Cost gap is enormous and clinically
// switching is non-trivial — distinct narrative from generic chronic.
const ANTICOAGULANT_NAMES = [
  'warfarin', 'coumadin', 'jantoven',
  'heparin', 'enoxaparin', 'lovenox', 'dalteparin', 'fragmin',
  'fondaparinux', 'arixtra',
  'rivaroxaban', 'xarelto',
  'apixaban', 'eliquis',
  'dabigatran', 'pradaxa',
  'edoxaban', 'savaysa', 'lixiana',
  'betrixaban', 'bevyxxa',
]

// ─── Contraceptives (oral / ring / implant / IUD hormonal) ──────────────────
// ACA mandates $0 cost-share for at least one product per FDA category.
// Lead with that, not with tier breakdowns.
const CONTRACEPTIVE_NAMES = [
  // Generic active ingredients
  'ethinyl-estradiol', 'ethinyl estradiol',
  'norethindrone', 'norgestimate', 'norgestrel', 'norelgestromin',
  'levonorgestrel', 'desogestrel', 'drospirenone', 'etonogestrel',
  'medroxyprogesterone', 'depo-provera', 'depo-subq',
  'segesterone', 'ulipristal',
  // Branded oral combinations
  'sprintec', 'tri-sprintec', 'mononessa', 'tri-previfem', 'previfem',
  'ortho-cyclen', 'ortho-tri-cyclen', 'ortho-novum', 'ortho-evra',
  'yasmin', 'yaz', 'beyaz', 'gianvi', 'loryna', 'syeda', 'ocella',
  'loestrin', 'lo loestrin', 'junel', 'microgestin',
  'lutera', 'lessina', 'aviane', 'orsythia', 'sronyx',
  'seasonique', 'lo seasonique', 'amethia', 'camrese', 'daysee',
  'kariva', 'mircette', 'azurette',
  'estarylla', 'estradiol-norethindrone',
  'jolessa', 'introvale', 'quartette',
  // Branded ring / patch
  'nuvaring', 'eluryng', 'annovera', 'xulane', 'twirla',
  // Implant / IUD (hormonal)
  'nexplanon', 'implanon',
  'mirena', 'kyleena', 'skyla', 'liletta',
  // Emergency contraception
  'plan b', 'plan-b', 'ella',
]

// ─── Ophthalmic (eye drops, gels, suspensions) ──────────────────────────────
// Glaucoma + dry eye + allergic conjunctivitis. Formulation matters
// (gel vs solution vs suspension can differ on the formulary).
const OPHTHALMIC_NAMES = [
  // Glaucoma (prostaglandin analogs)
  'latanoprost', 'xalatan', 'travoprost', 'travatan', 'bimatoprost', 'lumigan',
  'tafluprost', 'zioptan', 'latanoprostene', 'vyzulta',
  // Glaucoma (alpha agonists / beta blockers / CAIs)
  'brimonidine', 'alphagan', 'apraclonidine', 'iopidine',
  'timolol-mal', 'timolol maleate', 'betaxolol', 'betoptic',
  'levobunolol', 'betagan', 'carteolol', 'metipranolol',
  'dorzolamide', 'trusopt', 'brinzolamide', 'azopt',
  'cosopt', 'combigan', 'simbrinza', 'rocklatan', 'netarsudil',
  'pilocarpine', 'isopto carpine',
  // Dry eye
  'cyclosporine ophthalmic', 'restasis', 'cequa',
  'lifitegrast', 'xiidra', 'varenicline ophthalmic', 'tyrvaya',
  'perfluorohexyloctane', 'miebo',
  // Allergic conjunctivitis
  'olopatadine', 'patanol', 'pataday', 'pazeo',
  'ketotifen ophthalmic', 'alaway', 'zaditor',
  'azelastine ophthalmic', 'optivar',
  'epinastine', 'elestat', 'bepotastine', 'bepreve',
  // Ophthalmic anti-infectives + steroids (specific to eye)
  'moxifloxacin ophthalmic', 'vigamox', 'gatifloxacin ophthalmic', 'zymaxid',
  'besifloxacin', 'besivance',
  'difluprednate', 'durezol', 'loteprednol', 'lotemax', 'alrex',
  'bromfenac', 'prolensa', 'nepafenac', 'nevanac', 'ilevro',
]

// ─── Dermatology (TOPICAL only — not biologics like Humira/Dupixent) ────────
// Biologics for psoriasis/eczema stay in specialty-biologic via PA signals.
// This list catches topical steroids, retinoids, and topical immunomodulators.
const DERMATOLOGY_TOPICAL_NAMES = [
  // Topical corticosteroids — high to low potency
  'clobetasol', 'temovate', 'olux', 'cormax', 'clodan', 'impeklo',
  'halobetasol', 'ultravate', 'lexette', 'bryhali',
  'betamethasone-dip', 'betamethasone dipropionate', 'diprolene', 'diprosone',
  'augmented betamethasone', 'sernivo',
  'fluocinonide', 'lidex', 'vanos',
  'halcinonide', 'halog',
  'amcinonide', 'cyclocort',
  'desoximetasone', 'topicort',
  'mometasone topical', 'mometasone furoate cream', 'elocon',
  'fluticasone topical', 'cutivate',
  'triamcinolone topical', 'triamcinolone acetonide cream', 'kenalog cream',
  'hydrocortisone', 'cortizone', 'cortaid', 'westcort', 'locoid',
  'desonide', 'desowen', 'verdeso', 'tridesilon',
  'alclometasone', 'aclovate',
  'prednicarbate', 'dermatop',
  'fluocinolone', 'capex', 'derma-smoothe', 'synalar',
  // Topical retinoids
  'tretinoin', 'retin-a', 'renova', 'avita', 'altreno', 'atralin',
  'adapalene', 'differin', 'epiduo',
  'tazarotene', 'tazorac', 'arazlo', 'fabior',
  'trifarotene', 'aklief',
  'isotretinoin', 'accutane', 'absorica', 'claravis', 'amnesteem', 'myorisan',
  // Topical immunomodulators
  'tacrolimus topical', 'protopic',
  'pimecrolimus', 'elidel',
  'crisaborole', 'eucrisa',
  'ruxolitinib topical', 'opzelura',
  // Topical psoriasis
  'calcipotriene', 'dovonex', 'sorilux', 'enstilar', 'taclonex',
  'calcitriol topical', 'vectical',
  'anthralin', 'dritho-creme',
  // Topical antibiotics for skin
  'mupirocin', 'bactroban', 'centany',
  'retapamulin', 'altabax',
  'metronidazole topical', 'metrogel', 'metrocream', 'noritate', 'rosadan',
  'azelaic acid', 'finacea', 'azelex',
  'clindamycin topical', 'cleocin t', 'clindagel', 'evoclin',
  'erythromycin topical', 'erygel',
  'dapsone topical', 'aczone',
  'sulfacetamide topical', 'klaron',
  'minocycline topical', 'amzeeq', 'zilxi',
  // Topical antifungals
  'ketoconazole topical', 'nizoral cream', 'extina', 'xolegel',
  'ciclopirox', 'loprox', 'penlac',
  'econazole', 'spectazole', 'ecoza',
  'oxiconazole', 'oxistat',
  'sulconazole', 'exelderm',
  'naftifine', 'naftin',
  'butenafine', 'mentax',
  // Antiviral / antiparasitic topicals
  'imiquimod', 'aldara', 'zyclara',
  'podofilox', 'condylox',
  'sinecatechins', 'veregen',
  'permethrin', 'elimite', 'nix', 'acticin',
  'lindane',
  'spinosad', 'natroba',
  'ivermectin topical', 'sklice', 'soolantra',
  'malathion', 'ovide',
  // Misc topical Rx (acne, skin cancer, hyperhidrosis)
  'benzoyl peroxide', 'epiduo forte', 'duac', 'benzaclin',
  'fluorouracil topical', 'efudex', 'carac', 'tolak', 'fluoroplex',
  'glycopyrronium topical', 'qbrexza',
  'eflornithine', 'vaniqa',
  'hydroquinone', 'tri-luma',
  'selenium sulfide', 'selsun', 'selrx',
  'salicylic acid topical', 'salex',
  'urea topical', 'kerafoam', 'umecta', 'rea lo',
  'lactic acid topical', 'lac-hydrin', 'amlactin',
  'pramoxine topical',
  'lidocaine topical', 'lidoderm', 'zingo',
  'capsaicin topical',
  'doxepin topical', 'prudoxin', 'zonalon',
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

// ─── Pain / chronic NSAID + muscle relaxant ─────────────────────────────────
const PAIN_CHRONIC_NAMES = [
  // NSAIDs
  'meloxicam', 'mobic',
  'diclofenac', 'voltaren', 'cambia', 'zipsor', 'zorvolex', 'flector', 'pennsaid',
  'naproxen', 'naprosyn', 'anaprox', 'ec-naprosyn', 'naprelan',
  'celecoxib', 'celebrex',
  'piroxicam', 'feldene',
  'indomethacin', 'indocin',
  'ketoprofen',
  'etodolac', 'lodine',
  'oxaprozin', 'daypro',
  'sulindac', 'clinoril',
  'nabumetone', 'relafen',
  'diflunisal', 'dolobid',
  'meclofenamate',
  'flurbiprofen', 'ansaid',
  'ketorolac', 'toradol', 'sprix',
  // Muscle relaxants
  'cyclobenzaprine', 'flexeril', 'amrix', 'fexmid',
  'methocarbamol', 'robaxin',
  'tizanidine', 'zanaflex',
  'baclofen', 'lioresal', 'gablofen',
  'carisoprodol', 'soma',
  'chlorzoxazone', 'parafon forte',
  'orphenadrine', 'norflex',
  'metaxalone', 'skelaxin',
]

// ─── Seizure / antiepileptic / neuro ────────────────────────────────────────
// Note: lamotrigine and lithium are already in MENTAL_HEALTH_NAMES.
// gabapentin and pregabalin are already in CONTROLLED_NAMES.
const SEIZURE_NEURO_NAMES = [
  'levetiracetam', 'keppra', 'spritam', 'roweepra', 'elepsia',
  'carbamazepine', 'tegretol', 'carbatrol', 'equetro',
  'phenytoin', 'dilantin', 'phenytek',
  'topiramate', 'topamax', 'trokendi', 'qudexy',
  'oxcarbazepine', 'trileptal', 'oxtellar',
  'valproic acid', 'valproate', 'depakote', 'depakene', 'depacon',
  'divalproex',
  'lacosamide', 'vimpat',
  'eslicarbazepine', 'aptiom',
  'zonisamide', 'zonegran',
  'phenobarbital', 'luminal',
  'primidone', 'mysoline',
  'ethosuximide', 'zarontin',
  'clobazam', 'onfi', 'sympazan',
  'rufinamide', 'banzel',
  'vigabatrin', 'sabril',
  'perampanel', 'fycompa',
  'brivaracetam', 'briviact',
  'cenobamate', 'xcopri',
  'felbamate', 'felbatol',
  'tiagabine', 'gabitril',
  'stiripentol', 'diacomit',
  'ezogabine', 'potiga',
  'acetazolamide', 'diamox',  // used for absence seizures
]

// ─── GI acid suppression (PPIs and H2 blockers) ──────────────────────────────
const GI_ACID_NAMES = [
  'omeprazole', 'prilosec',
  'esomeprazole', 'nexium',
  'lansoprazole', 'prevacid',
  'pantoprazole', 'protonix',
  'rabeprazole', 'aciphex',
  'dexlansoprazole', 'dexilant',
  'famotidine', 'pepcid',
  'ranitidine', 'zantac',
  'cimetidine', 'tagamet',
  'nizatidine', 'axid',
  'sucralfate', 'carafate',
  'vonoprazan', 'voquezna',
  'misoprostol',
]

// ─── Blood pressure — CCBs, beta-blockers, and vasodilators not elsewhere ───
// Base metoprolol tartrate will likely already be common-generic-chronic via
// data signals. This list targets ER/XR forms and less-common agents.
const BLOOD_PRESSURE_OTHER_NAMES = [
  // Calcium channel blockers
  'diltiazem', 'cardizem', 'tiazac', 'cartia xt', 'dilt-cd', 'dilacor',
  'verapamil', 'calan', 'verelan', 'isoptin', 'covera-hs',
  'nifedipine', 'adalat', 'procardia',
  'felodipine', 'plendil',
  'nisoldipine', 'sular',
  'isradipine',
  'nicardipine', 'cardene',
  'clevidipine', 'cleviprex',
  // Beta-blockers (ER/XR forms and less-common agents)
  'carvedilol', 'coreg',
  'metoprolol succinate', 'toprol-xl', 'toprol xl',
  'nebivolol', 'bystolic',
  'bisoprolol', 'zebeta',
  'nadolol', 'corgard',
  'labetalol', 'trandate', 'normodyne',
  'pindolol',
  'acebutolol', 'sectral',
  // ARBs and ACE inhibitors (less common ones not caught as generic chronic)
  'olmesartan', 'benicar',
  'irbesartan', 'avapro',
  'telmisartan', 'micardis',
  'candesartan', 'atacand',
  'azilsartan', 'edarbi',
  'eprosartan',
  // Alpha blockers and centrally acting
  'clonidine', 'catapres', 'kapvay',
  'methyldopa', 'aldomet',
  'doxazosin', 'cardura',
  'prazosin', 'minipress',
  'terazosin', 'hytrin',
  'guanfacine', 'intuniv', 'tenex',
  // Aldosterone antagonists
  'eplerenone', 'inspra',
  // Loop and thiazide-like diuretics
  'torsemide', 'demadex',
  'metolazone', 'zaroxolyn',
  'indapamide', 'lozol',
  // Vasodilators
  'hydralazine',
  'minoxidil oral',
]

// ─── Transplant immunosuppressants ──────────────────────────────────────────
// Note: 'tacrolimus topical' (Protopic) is already in DERMATOLOGY_TOPICAL_NAMES
// and 'cyclosporine ophthalmic' (Restasis) is in OPHTHALMIC_NAMES.
// Systemic forms at specialty tier fall through to here.
const TRANSPLANT_IMMUNO_NAMES = [
  'tacrolimus', 'prograf', 'astagraf', 'envarsus',
  'mycophenolate', 'cellcept', 'myfortic', 'mycophenolic',
  'cyclosporine', 'sandimmune', 'neoral', 'gengraf',
  'sirolimus', 'rapamune',
  'everolimus', 'zortress',
  'azathioprine', 'imuran',
  'belacept', 'nulojix',
  'basiliximab', 'simulect',
]

// ─── Oncology (oral/non-biologic cancer treatments) ─────────────────────────
// Large-molecule biologics (Herceptin, Avastin, etc.) stay in specialty-biologic
// via PA signals. This catches oral targeted therapies and hormone modulators.
const ONCOLOGY_NAMES = [
  // Hormone therapy — breast cancer
  'tamoxifen', 'soltamox',
  'anastrozole', 'arimidex',
  'letrozole', 'femara',
  'exemestane', 'aromasin',
  'fulvestrant', 'faslodex',
  'toremifene', 'fareston',
  'megestrol', 'megace',
  // Targeted oral kinase inhibitors
  'imatinib', 'gleevec', 'glivec',
  'dasatinib', 'sprycel',
  'nilotinib', 'tasigna',
  'bosutinib', 'bosulif',
  'ponatinib', 'iclusig',
  'ibrutinib', 'imbruvica',
  'acalabrutinib', 'calquence',
  'zanubrutinib', 'brukinsa',
  'venetoclax', 'venclexta',
  'idelalisib', 'zydelig',
  'copanlisib', 'aliqopa',
  'erlotinib', 'tarceva',
  'gefitinib', 'iressa',
  'osimertinib', 'tagrisso',
  'afatinib', 'gilotrif',
  'lapatinib', 'tykerb',
  'neratinib', 'nerlynx',
  'tucatinib', 'tukysa',
  'crizotinib', 'xalkori',
  'alectinib', 'alecensa',
  'brigatinib', 'alunbrig',
  'lorlatinib', 'lorbrena',
  'ceritinib', 'zykadia',
  'ribociclib', 'kisqali',
  'palbociclib', 'ibrance',
  'abemaciclib', 'verzenio',
  'olaparib', 'lynparza',
  'niraparib', 'zejula',
  'rucaparib', 'rubraca',
  'talazoparib', 'talzenna',
  'vemurafenib', 'zelboraf',
  'dabrafenib', 'tafinlar',
  'trametinib', 'mekinist',
  'cobimetinib', 'cotellic',
  'binimetinib', 'mektovi',
  'encorafenib', 'braftovi',
  'vismodegib', 'erivedge',
  'sonidegib', 'odomzo',
  'regorafenib', 'stivarga',
  'sorafenib', 'nexavar',
  'sunitinib', 'sutent',
  'pazopanib', 'votrient',
  'axitinib', 'inlyta',
  'cabozantinib', 'cabometyx', 'cometriq',
  'lenvatinib', 'lenvima',
  'vandetanib', 'caprelsa',
  'temozolomide', 'temodar',
  'capecitabine', 'xeloda',
  'mercaptopurine', 'purinethol',
  'methotrexate oral',  // low-dose oral (higher dose IV is separate)
  'thalidomide', 'thalomid',
  'lenalidomide', 'revlimid',
  'pomalidomide', 'pomalyst',
  'bicalutamide', 'casodex',
  'enzalutamide', 'xtandi',
  'apalutamide', 'erleada',
  'darolutamide', 'nubeqa',
  'abiraterone', 'zytiga', 'yonsa',
]

// ─── COPD maintenance (LAMAs, LABAs, and combos not already in INHALER_NAMES) ─
// tiotropium (Spiriva), umeclidinium (Incruse), and combo products (Anoro,
// Trelegy) are already in INHALER_NAMES. This list adds remaining LAMA/LABA agents.
const COPD_MAINTENANCE_NAMES = [
  'glycopyrrolate inhalation', 'lonhala magnair', 'seebri', 'glycopyrronium inhalation',
  'aclidinium', 'tudorza',
  'indacaterol', 'arcapta',
  'olodaterol', 'striverdi',
  'revefenacin', 'yupelri',
  'formoterol nebulization', 'perforomist',
  'arformoterol', 'brovana',
  'roflumilast', 'daliresp',   // PDE4 inhibitor for COPD
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function nameMatches(drugName: string, list: string[]): boolean {
  // For needles >= 5 chars, plain substring matching is used.
  // For shorter needles, the match must be word-bounded so that 'ella' (the
  // contraceptive ulipristal) does NOT match savella, bordetella, ocella,
  // pirmella, etc., and 'yaz' does not match dyazide.
  const n = drugName.toLowerCase().trim()
  for (const needle of list) {
    if (n === needle) return true
    const idx = n.indexOf(needle)
    if (idx === -1) continue
    if (needle.length >= 5) return true
    const before = idx === 0 ? '' : n[idx - 1]
    const after = n[idx + needle.length] ?? ''
    const isAlnum = (c: string) => /[a-z0-9]/.test(c)
    if (!isAlnum(before) && !isAlnum(after)) return true
  }
  return false
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

  // Rule 8 — Anticoagulant (DOACs + warfarin)
  // Brand DOACs (Eliquis, Xarelto, Pradaxa) and generic warfarin have very
  // different cost profiles but identical clinical purpose. The page should
  // lead with the DOAC-vs-warfarin tradeoff, not the tier breakdown.
  if (nameMatches(name, ANTICOAGULANT_NAMES)) {
    return baseProfile('anticoagulant', {
      tier,
      isBrand: tier !== 'generic',
      chronicOrAcute: 'chronic',
      typicalFriction: 'moderate',
      costSensitivity: tier === 'generic' ? 'low' : 'high',
      qlLikelihood: 'low',
    })
  }

  // Rule 9 — Contraceptive (oral, ring, patch, implant, hormonal IUD)
  // ACA mandates $0 cost-share for at least one product per FDA category.
  // The page should lead with the ACA preventive callout, not tier or PA.
  if (nameMatches(name, CONTRACEPTIVE_NAMES)) {
    return baseProfile('contraceptive', {
      tier,
      chronicOrAcute: 'chronic',
      typicalFriction: 'low',
      costSensitivity: 'low',  // ACA $0 mandate
      qlLikelihood: 'low',
    })
  }

  // Rule 10 — Ophthalmic (eye drops, gels, suspensions)
  // Glaucoma, dry eye, and allergic conjunctivitis Rx. Formulation
  // (drops vs gel vs suspension) can differ on the formulary.
  if (nameMatches(name, OPHTHALMIC_NAMES)) {
    return baseProfile('ophthalmic', {
      tier,
      chronicOrAcute: 'chronic',
      typicalFriction: 'low',
      costSensitivity: tier === 'specialty' ? 'high' : 'low',
      qlLikelihood: 'low',
    })
  }

  // Rule 11 — Dermatology topical (steroids, retinoids, immunomodulators)
  // Restricted to non-specialty so biologics (Humira, Dupixent, Cosentyx,
  // Skyrizi) continue to fall through to specialty-biologic via PA signals.
  if (tier !== 'specialty' && nameMatches(name, DERMATOLOGY_TOPICAL_NAMES)) {
    return baseProfile('dermatology', {
      tier,
      chronicOrAcute: 'both',
      typicalFriction: 'low',
      costSensitivity: 'low',
      qlLikelihood: 'low',
    })
  }

  // Rule 12a — Transplant immunosuppressants (name-based; systemic, not topical/ophthalmic)
  // Topical tacrolimus (Protopic) and ophthalmic cyclosporine (Restasis) were already
  // caught by Rules 10-11. This catches systemic/specialty forms.
  if (nameMatches(name, TRANSPLANT_IMMUNO_NAMES)) {
    return baseProfile('transplant-immuno', {
      tier,
      isSpecialty: tier === 'specialty',
      chronicOrAcute: 'chronic',
      typicalFriction: 'high',
      costSensitivity: 'high',
      qlLikelihood: 'high',
    })
  }

  // Rule 12b — Oncology (oral targeted therapies and hormone modulators)
  if (nameMatches(name, ONCOLOGY_NAMES)) {
    return baseProfile('oncology', {
      tier,
      isSpecialty: tier === 'specialty',
      isBrand: tier !== 'generic',
      chronicOrAcute: 'chronic',
      typicalFriction: 'high',
      costSensitivity: 'high',
      qlLikelihood: 'moderate',
    })
  }

  // Rule 12c — COPD maintenance (agents not already caught by inhaler-respiratory)
  if (nameMatches(name, COPD_MAINTENANCE_NAMES)) {
    return baseProfile('copd-maintenance', {
      tier,
      chronicOrAcute: 'chronic',
      typicalFriction: 'moderate',
      costSensitivity: 'moderate',
      qlLikelihood: 'moderate',
    })
  }

  // Rule 12d — Seizure / antiepileptic
  if (nameMatches(name, SEIZURE_NEURO_NAMES)) {
    return baseProfile('seizure-neuro', {
      tier,
      isGeneric: tier === 'generic',
      chronicOrAcute: 'chronic',
      typicalFriction: 'moderate',
      costSensitivity: tier === 'generic' ? 'low' : 'moderate',
      qlLikelihood: 'moderate',
    })
  }

  // Rule 12e — Pain chronic (NSAIDs + muscle relaxants)
  if (nameMatches(name, PAIN_CHRONIC_NAMES)) {
    return baseProfile('pain-chronic', {
      tier,
      isGeneric: tier === 'generic',
      chronicOrAcute: 'chronic',
      typicalFriction: 'low',
      costSensitivity: tier === 'generic' ? 'low' : 'moderate',
      qlLikelihood: 'low',
    })
  }

  // Rule 12f — GI acid suppression (PPIs + H2 blockers)
  if (nameMatches(name, GI_ACID_NAMES)) {
    return baseProfile('gi-acid', {
      tier,
      isGeneric: tier === 'generic',
      chronicOrAcute: 'both',
      typicalFriction: 'low',
      costSensitivity: 'low',
      qlLikelihood: 'low',
    })
  }

  // Rule 12g — Blood pressure other (CCBs, less-common beta-blockers, vasodilators)
  if (nameMatches(name, BLOOD_PRESSURE_OTHER_NAMES)) {
    return baseProfile('blood-pressure-other', {
      tier,
      isGeneric: tier === 'generic',
      chronicOrAcute: 'chronic',
      typicalFriction: 'low',
      costSensitivity: tier === 'generic' ? 'low' : 'moderate',
      qlLikelihood: 'low',
    })
  }

  // Rule 12 — Specialty biologic (data-signal driven)
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

  // Rule 13 — Brand chronic (data-signal driven)
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

  // Rule 14 — Common generic acute
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

  // Rule 15 — Common generic chronic
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

  // Rule 16 — Fallback
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

// ─── Name normalizer (strips concentration/volume prefixes for reclassification) ──

/**
 * Strips leading dose/volume prefixes and trailing concentration descriptors so
 * that "10 ml vancomycin 5 mg-ml injection" normalises to "vancomycin".
 * Used only by reclassifyByName — not by the primary classifyDrug path.
 */
export function normalizeForReclassification(drugName: string): string {
  let n = drugName.toLowerCase().trim()
  // Remove leading volume/dose prefix: "10 ml ", "500 mg ", "2 mcg ", "100 units "
  n = n.replace(/^\d[\d.]*\s*(?:ml|l)\s+/i, '')
  n = n.replace(/^\d[\d.]*\s*(?:mg|mcg|g|unt|units?)\s+/i, '')
  // Remove trailing concentration: " 5 mg-ml injection", " 10 mg/ml soln"
  n = n.replace(/\s+\d[\d.]*\s*(?:mg-ml|mcg-ml|mg\/ml|mcg\/ml|unt\/ml|units\/ml).*$/i, '')
  // Remove trailing dosage form keywords
  n = n.replace(/\s+(?:oral capsule|oral tablet|oral solution|oral suspension|inhalation solution|inhalation powder|injection solution|injection suspension|nasal spray|ophthalmic solution|ophthalmic suspension|topical cream|topical ointment|topical gel|topical lotion|topical foam|patch|transdermal|injection|injectable|intravenous|intramuscular|subcutaneous|sublingual|rectal|vaginal|external|topical).*$/i, '')
  // Remove time-release prefixes: "24 hr ", "12 hr ", "er ", "xr "
  n = n.replace(/^(?:\d+\s*hr\s+|extended release\s+|controlled release\s+|delayed release\s+)/i, '')
  // Strip common pharmaceutical salt suffixes (but only when trailing — preserve drug names that contain them)
  n = n.replace(/\s+(?:hydrochloride|hcl|sodium|potassium|sulfate|sulphate|acetate|maleate|tartrate|mesylate|fumarate|gluconate|monohydrate|dihydrate|citrate|phosphate|disodium|trisodium|calcium|besylate|succinate|bromide|chloride|nitrate|stearate)(?:\s+.*)?$/i, '')
  return n.trim()
}

// ─── Name-only reclassifier (used by reclassify-other.ts script) ────────────

/**
 * Returns the new archetype for a drug currently classified as 'other', using
 * only name-pattern matching (raw name + normalised name).
 * Returns null if no archetype matches (drug stays 'other').
 *
 * Match order matters — higher-specificity archetypes come first.
 * Also redirects 'other' entries that belong to EXISTING archetypes whose
 * keyword lists didn't originally catch them (brand insulins, more inhalers,
 * ophthalmic brands, etc.).
 */
export function reclassifyByName(drugName: string): {
  archetype: DrugArchetype
  chronicOrAcute: 'chronic' | 'acute' | 'both'
  typicalFriction: 'low' | 'moderate' | 'high'
  costSensitivity: 'low' | 'moderate' | 'high'
  quantityLimitLikelihood: 'low' | 'moderate' | 'high'
} | null {
  const raw  = drugName.toLowerCase().trim()
  const norm = normalizeForReclassification(raw)

  // Helper: check both raw and normalised name against a list
  const hit = (list: string[]) => nameMatches(raw, list) || nameMatches(norm, list)

  // ── Redirect to existing archetypes (Wave-2 gap-closers) ──────────────────

  // injectable-diabetes: brand insulin names not caught by "insulin" substring rule
  const INSULIN_BRAND_EXTRA = [
    'lantus', 'basaglar', 'toujeo', 'semglee', 'rezvoglar',
    'levemir', 'tresiba',
    'novolog', 'fiasp', 'trurapi',
    'humalog', 'admelog', 'lyumjev', 'lispro',
    'apidra', 'glulisine',
    'humulin', 'novolin',
    'degludec', 'detemir', 'glargine', 'aspart',
    'gvoke', 'baqsimi', 'zegalogue', 'glucagen', 'glucagon',
  ]
  if (hit(INSULIN_BRAND_EXTRA)) {
    return { archetype: 'injectable-diabetes', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'high' }
  }

  // inhaler-respiratory: additional brands/generics not in INHALER_NAMES
  const INHALER_EXTRA = [
    'bevespi aerosphere', 'duaklir', 'utibron neohaler', 'zenhale',
    'elebrato ellipta', 'breztri', 'airsupra', 'airduo',
    'fluticasone-vilanterol', 'fluticasone-salmeterol',
    'budesonide-formoterol', 'mometasone-formoterol',
    'beclomethasone-formoterol',
    'ipratropium-albuterol', 'combivent',
    'xolair', 'omalizumab', 'dupixent', 'dupilumab',
    'fasenra', 'benralizumab', 'nucala', 'mepolizumab',
    'cinqair', 'reslizumab', 'tezspire', 'tezepelumab',
  ]
  if (hit(INHALER_EXTRA)) {
    return { archetype: 'inhaler-respiratory', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'moderate' }
  }

  // ophthalmic: additional eye products not in OPHTHALMIC_NAMES
  const OPHTHALMIC_EXTRA = [
    'tobramycin ophthalmic', 'tobrex', 'tobradex',
    'azithromycin ophthalmic', 'azasite',
    'erythromycin ophthalmic', 'ilotycin',
    'gentamicin ophthalmic', 'gentak',
    'ciprofloxacin ophthalmic', 'ciloxan',
    'polymyxin-trimethoprim ophthalmic', 'polytrim',
    'prednisolone ophthalmic', 'pred forte', 'omnipred',
    'dexamethasone ophthalmic', 'maxidex', 'tobradex',
    'fluorometholone', 'fml',
    'rimexolone', 'vexol',
    'lotemax',      // also catches loteprednol + brand
    'ocuflox', 'iquix',
    'vigamox',      // also already in OPHTHALMIC_NAMES
    'systane', 'refresh', 'genteal',  // OTC but Rx formulations exist
  ]
  if (hit(OPHTHALMIC_EXTRA)) {
    return { archetype: 'ophthalmic', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // mental-health: extended list of older antidepressants/anxiolytics not in MENTAL_HEALTH_NAMES
  const MENTAL_HEALTH_EXTRA = [
    'phenelzine', 'nardil', 'tranylcypromine', 'parnate', 'isocarboxazid', 'marplan',
    'selegiline patch',   // emsam — oral selegiline is neuro
    'maprotiline', 'protriptyline', 'trimipramine',
    'fluvoxamine', 'luvox',
    'clomipramine', 'anafranil',
    'hydroxyzine pamoate',
    'perphenazine-amitriptyline',
    'meprobamate', 'miltown',
    'ramelteon', 'rozerem',
    'suvorexant', 'belsomra',
    'lemborexant', 'dayvigo',
  ]
  if (hit(MENTAL_HEALTH_EXTRA)) {
    return { archetype: 'mental-health', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'moderate' }
  }

  // common-generic-acute: local anesthetics + IV/ER forms of drugs already in ACUTE_NAMES
  // Also catches ACUTE_NAMES brand names missed by original classifyDrug tier gating
  const ACUTE_EXTRA = [
    'bupivacaine', 'marcaine', 'sensorcaine',
    'ropivacaine', 'naropin',
    'mepivacaine', 'carbocaine',
    'prilocaine', 'citanest',
    'articaine', 'septocaine',
    'chloroprocaine', 'nesacaine',
    'tetracaine',
    'ceftriaxone', 'rocephin',
    'cefazolin', 'ancef',
    'cefepime', 'maxipime',
    'ceftaroline', 'teflaro',
    'ceftazidime', 'fortaz', 'tazicef',
    'cefoxitin', 'mefoxin',
    'cefotetan',
    'piperacillin-tazobactam', 'zosyn',
    'ampicillin-sulbactam', 'unasyn',
    'meropenem', 'merrem',
    'imipenem-cilastatin', 'primaxin',
    'ertapenem', 'invanz',
    'aztreonam', 'azactam',
    'tigecycline', 'tygacil',
    'ciprofloxacin',   // IV form caught via normalization
    'zithromax', 'z-pak', 'zpak',
    'levofloxacin', 'levaquin',
    'moxifloxacin',
    'oxacillin', 'nafcillin', 'dicloxacillin',
    'penicillin g', 'penicillin v',
    'clindamycin',     // IV form
    'fluconazole',     // IV form (oral already in ACUTE_NAMES)
    'acyclovir',       // IV form
    'oseltamivir',
  ]
  if (hit(ACUTE_EXTRA) || nameMatches(raw, ACUTE_NAMES) || nameMatches(norm, ACUTE_NAMES)) {
    return { archetype: 'common-generic-acute', chronicOrAcute: 'acute', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // controlled-substance: IV/injection forms not caught by original CONTROLLED_NAMES
  const CONTROLLED_EXTRA = [
    'midazolam', 'versed',
    'hydromorphone', 'dilaudid', 'exalgo',
    'ketamine', 'ketalar',
    'alfentanil', 'alfenta',
    'sufentanil', 'sufenta',
    'remifentanil', 'ultiva',
    'nalbuphine', 'nubain',
    'butorphanol', 'stadol',
    'meperidine', 'demerol',
    'levorphanol',
    'tapentadol', 'nucynta',
    'droperidol', 'inapsine',
    'dexmedetomidine', 'precedex',
    'chloral hydrate',
    'pentobarbital', 'nembutal',
    'secobarbital', 'seconal',
    'sodium oxybate', 'xyrem',
    'nalmefene', 'revex',
    'naloxone', 'narcan',   // not controlled but related
    'naltrexone',           // oral (vs naltrexone-bupropion for weight which is above)
    'phendimetrazine', 'bontril',
    'diethylpropion', 'tenuate',
    'benzphetamine', 'didrex',
    'pemoline',
  ]
  if (hit(CONTROLLED_EXTRA) || nameMatches(raw, CONTROLLED_NAMES) || nameMatches(norm, CONTROLLED_NAMES)) {
    return { archetype: 'controlled-substance', chronicOrAcute: 'both', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'high' }
  }

  // ── Existing Wave-1 archetypes (already in classifyDrug but may need name boost) ─

  if (hit(TRANSPLANT_IMMUNO_NAMES)) {
    return { archetype: 'transplant-immuno', chronicOrAcute: 'chronic', typicalFriction: 'high', costSensitivity: 'high', quantityLimitLikelihood: 'high' }
  }
  if (hit(ONCOLOGY_NAMES)) {
    return { archetype: 'oncology', chronicOrAcute: 'chronic', typicalFriction: 'high', costSensitivity: 'high', quantityLimitLikelihood: 'moderate' }
  }
  if (hit(COPD_MAINTENANCE_NAMES)) {
    return { archetype: 'copd-maintenance', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'moderate' }
  }
  if (hit(SEIZURE_NEURO_NAMES)) {
    return { archetype: 'seizure-neuro', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'moderate' }
  }
  if (hit(PAIN_CHRONIC_NAMES)) {
    return { archetype: 'pain-chronic', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }
  if (hit(GI_ACID_NAMES)) {
    return { archetype: 'gi-acid', chronicOrAcute: 'both', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }
  if (hit(BLOOD_PRESSURE_OTHER_NAMES)) {
    return { archetype: 'blood-pressure-other', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // ── Wave 1/2 new archetypes ───────────────────────────────────────────────

  // HIV antiretrovirals
  const HIV_ART_NAMES = [
    'tenofovir', 'viread', 'vemlidy',
    'emtricitabine', 'emtriva',
    'abacavir', 'ziagen',
    'lamivudine', 'epivir',
    'zidovudine', 'retrovir',
    'efavirenz', 'sustiva',
    'rilpivirine', 'edurant',
    'doravirine', 'pifeltro',
    'etravirine', 'intelence',
    'atazanavir', 'reyataz',
    'darunavir', 'prezista',
    'lopinavir', 'kaletra',
    'ritonavir', 'norvir',
    'cobicistat', 'tybost',
    'raltegravir', 'isentress',
    'dolutegravir', 'tivicay',
    'elvitegravir',
    'bictegravir',
    'cabotegravir', 'vocabria',
    'maraviroc', 'selzentry',
    'enfuvirtide', 'fuzeon',
    'fostemsavir', 'rukobia',
    'lenacapavir', 'sunlenca',
    'ibalizumab', 'trogarzo',
    'truvada', 'descovy', 'epzicom', 'combivir',
    'triumeq', 'biktarvy', 'genvoya', 'stribild',
    'complera', 'odefsey', 'symtuza', 'dovato',
    'juluca', 'cabenuva',
    'cabotegravir-rilpivirine',
  ]
  if (hit(HIV_ART_NAMES)) {
    return { archetype: 'hiv-art', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'high', quantityLimitLikelihood: 'moderate' }
  }

  // Hepatitis / COVID antivirals (not HIV, not acyclovir/valacyclovir which are in ACUTE_NAMES)
  const ANTIVIRAL_HEP_COVID_NAMES = [
    'sofosbuvir', 'sovaldi',
    'ledipasvir', 'harvoni',
    'velpatasvir', 'epclusa', 'vosevi',
    'glecaprevir', 'pibrentasvir', 'mavyret',
    'elbasvir', 'grazoprevir', 'zepatier',
    'simeprevir', 'olysio',
    'daclatasvir', 'daklinza',
    'ombitasvir', 'paritaprevir', 'viekira',
    'nirmatrelvir', 'paxlovid',
    'molnupiravir', 'lagevrio',
    'remdesivir', 'veklury',
    'entecavir', 'baraclude',
    'adefovir', 'hepsera',
    'telbivudine', 'tyzeka',
    'ganciclovir', 'cytovene',
    'valganciclovir', 'valcyte',
    'cidofovir', 'vistide',
    'foscarnet', 'foscavir',
    'letermovir', 'prevymis',
    'maribavir', 'livtencity',
  ]
  if (hit(ANTIVIRAL_HEP_COVID_NAMES)) {
    return { archetype: 'antiviral-hep-covid', chronicOrAcute: 'both', typicalFriction: 'high', costSensitivity: 'high', quantityLimitLikelihood: 'moderate' }
  }

  // Oncology extended (targeted therapies + IV cytotoxics not in ONCOLOGY_NAMES)
  const ONCOLOGY_EXTRA = [
    // IV cytotoxic chemotherapy
    'oxaliplatin', 'eloxatin',
    'irinotecan', 'camptosar',
    'docetaxel', 'taxotere', 'docefrez',
    'paclitaxel', 'taxol', 'abraxane',
    'gemcitabine', 'gemzar', 'infugem',
    'doxorubicin', 'adriamycin', 'rubex',
    'epirubicin', 'ellence',
    'daunorubicin', 'cerubidine', 'daunoxome',
    'liposomal doxorubicin', 'doxil',
    'vinorelbine', 'navelbine',
    'vincristine', 'oncovin', 'vincasar',
    'vinblastine', 'velban',
    'etoposide', 'toposar', 'vepesid',
    'carboplatin', 'paraplatin',
    'cisplatin', 'platinol',
    'bleomycin', 'blenoxane',
    'mitomycin', 'mutamycin', 'jelmyto',
    'pemetrexed', 'alimta',
    'topotecan', 'hycamtin',
    'ifosfamide', 'ifex',
    'cyclophosphamide', 'cytoxan', 'neosar',
    'chlorambucil', 'leukeran',
    'melphalan', 'alkeran', 'evomela',
    'busulfan', 'myleran', 'busulfex',
    'bendamustine', 'treanda', 'bendeka',
    'fludarabine', 'fludara',
    'cladribine', 'leustatin',
    'clofarabine', 'clolar',
    'nelarabine', 'arranon',
    'pentostatin', 'nipent',
    'cytarabine', 'cytosar',
    'fluorouracil iv', 'adrucil',
    'methotrexate injection',
    'pralatrexate', 'folotyn',
    'ixabepilone', 'ixempra',
    'eribulin', 'halaven',
    'trabectedin', 'yondelis',
    'mitoxantrone', 'novantrone',
    'streptozocin', 'zanosar',
    'dacarbazine', 'dtic-dome',
    'temozolomide',  // also in ONCOLOGY_NAMES
    'bortezomib', 'velcade',
    'carfilzomib', 'kyprolis',
    'ixazomib',    // in ONCOLOGY_EXTRA above
    'arsenic trioxide', 'trisenox',
    'tretinoin oral', 'vesanoid', 'atra',
    // Targeted oral not in ONCOLOGY_NAMES
    'midostaurin', 'rydapt',
    'gilteritinib', 'xospata',
    'glasdegib', 'daurismo',
    'enasidenib', 'idhifa',
    'ivosidenib', 'tibsovo',
    'olutasidenib', 'rezlidhia',
    'inavolisib', 'itovebi',
    'alpelisib', 'piqray',
    'everolimus oral', 'afinitor',
    'temsirolimus',
    'selpercatinib', 'retevmo',
    'pralsetinib', 'gavreto',
    'capmatinib', 'tabrecta',
    'tepotinib', 'tepmetko',
    'avapritinib', 'ayvakit',
    'ripretinib', 'qinlock',
    'pexidartinib', 'turalio',
    'lurbinectedin', 'zepzelca',
    'ixazomib', 'ninlaro',
    'selinexor', 'xpovio',
    'venetoclax combo',
    'asciminib', 'scemblix',
    'momelotinib', 'ojjaara',
    'pacritinib', 'vonjo',
    'fedratinib', 'inrebic',
    'ruxolitinib oral', 'jakafi',
    'tivozanib', 'fotivda',
    'belzutifan', 'welireg',
    'futibatinib', 'lytgobi',
    'infigratinib', 'truseltiq',
    'pemigatinib', 'pemazyre',
    'erdafitinib', 'balversa',
    'larotrectinib', 'vitrakvi',
    'entrectinib', 'rozlytrek',
    'crizotinib',  // already in ONCOLOGY_NAMES
    'tepotinib',
  ]
  if (hit(ONCOLOGY_EXTRA)) {
    return { archetype: 'oncology', chronicOrAcute: 'chronic', typicalFriction: 'high', costSensitivity: 'high', quantityLimitLikelihood: 'moderate' }
  }

  // Hematology
  const HEMATOLOGY_NAMES = [
    'hydroxyurea', 'hydrea', 'droxia', 'siklos',
    'epoetin', 'epogen', 'procrit',
    'darbepoetin', 'aranesp',
    'filgrastim', 'neupogen', 'granix', 'zarxio', 'nivestym',
    'pegfilgrastim', 'neulasta', 'fulphila', 'udenyca', 'ziextenzo',
    'eltrombopag', 'promacta',
    'romiplostim', 'nplate',
    'avatrombopag', 'doptelet',
    'lusutrombopag', 'mulpleta',
    'fostamatinib', 'tavalisse',
    'rilzabrutinib',
    'deferasirox', 'exjade', 'jadenu',
    'deferiprone', 'ferriprox',
    'deferoxamine', 'desferal',
    'voxelotor', 'oxbryta',
    'crizanlizumab', 'adakveo',
    'luspatercept', 'reblozyl',
    'enasidenib',   // also oncology — hematology wins here
    'ivosidenib',
    'glasdegib',
    'azacitidine', 'vidaza', 'onureg',
    'decitabine', 'dacogen',
    'venetoclax',  // also oncology
    'L-glutamine', 'endari',
  ]
  if (hit(HEMATOLOGY_NAMES)) {
    return { archetype: 'hematology', chronicOrAcute: 'chronic', typicalFriction: 'high', costSensitivity: 'high', quantityLimitLikelihood: 'high' }
  }

  // Migraine
  const MIGRAINE_NAMES = [
    'sumatriptan', 'imitrex',
    'rizatriptan', 'maxalt',
    'zolmitriptan', 'zomig',
    'naratriptan', 'amerge',
    'almotriptan', 'axert',
    'frovatriptan', 'frova',
    'eletriptan', 'relpax',
    'ubrogepant', 'ubrelvy',
    'rimegepant', 'nurtec',
    'zavegepant', 'zavzpret',
    'lasmiditan', 'reyvow',
    'ergotamine', 'cafergot', 'migergot',
    'dihydroergotamine', 'migranal', 'trudhesa',
    'erenumab', 'aimovig',
    'fremanezumab', 'ajovy',
    'galcanezumab', 'emgality',
    'eptinezumab', 'vyepti',
    'atogepant', 'qulipta',
  ]
  if (hit(MIGRAINE_NAMES)) {
    return { archetype: 'migraine', chronicOrAcute: 'both', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'high' }
  }

  // Cardiac (not already covered by BLOOD_PRESSURE_OTHER_NAMES or anticoagulants)
  const CARDIAC_OTHER_NAMES = [
    'digoxin', 'lanoxin',
    'amiodarone', 'cordarone', 'nexterone', 'pacerone',
    'flecainide', 'tambocor',
    'propafenone', 'rhythmol',
    'sotalol', 'betapace',
    'dofetilide', 'tikosyn',
    'dronedarone', 'multaq',
    'sacubitril', 'entresto',
    'ivabradine', 'corlanor',
    'ranolazine', 'ranexa',
    'isosorbide', 'isordil', 'imdur', 'monoket', 'dilatrate',
    'nitroglycerin', 'nitrostat', 'nitroquick', 'nitrolingual',
    'hydralazine-isosorbide', 'bidil',
    'colchicine', 'colcrys', 'mitigare',   // pericarditis / gout
    'procainamide', 'quinidine',
    'mexiletine', 'disopyramide',
    'levosimendan',
    'vericiguat', 'verquvo',
    // IV vasoactive / antiarrhythmic agents (caught via normalization)
    'dopamine',
    'dobutamine',
    'norepinephrine', 'levophed',
    'epinephrine cardiac',
    'vasopressin', 'pitressin', 'vasostrict',
    'phenylephrine',
    'isoproterenol', 'isuprel',
    'esmolol', 'brevibloc',
    'adenosine', 'adenocard',
    'ibutilide', 'corvert',
    'atropine sulfate',
    'milrinone', 'primacor',
    'dobutamine',
    'nesiritide', 'natrecor',
    'nitroprusside', 'nipride',
    'hydralazine injection',
    'labetalol injection',
    'nicardipine injection',
    'clevidipine',
    'fenoldopam', 'corlopam',
    'levosimendan', 'simdax',
  ]
  if (hit(CARDIAC_OTHER_NAMES)) {
    return { archetype: 'cardiac-other', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'moderate' }
  }

  // Antiplatelet
  const ANTIPLATELET_NAMES = [
    'clopidogrel', 'plavix',
    'prasugrel', 'effient',
    'ticagrelor', 'brilinta',
    'aspirin-dipyridamole', 'aggrenox',
    'dipyridamole', 'persantine',
    'cilostazol', 'pletal',
    'vorapaxar', 'zontivity',
    'ticlopidine', 'ticlid',
    'cangrelor', 'kengreal',
    'eptifibatide', 'integrilin',
    'tirofiban', 'aggrastat',
    'abciximab', 'reopro',
  ]
  if (hit(ANTIPLATELET_NAMES)) {
    return { archetype: 'antiplatelet', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Parkinson's / dementia
  const NEURO_PARKINSONS_NAMES = [
    'levodopa', 'l-dopa',
    'carbidopa', 'sinemet', 'rytary', 'duopa', 'duodopa',
    'entacapone', 'comtan', 'stalevo',
    'tolcapone', 'tasmar',
    'opicapone', 'ongentys',
    'pramipexole', 'mirapex',
    'ropinirole', 'requip',
    'rotigotine', 'neupro',
    'apomorphine', 'apokyn', 'kynmobi',
    'rasagiline', 'azilect',
    'safinamide', 'xadago',
    'amantadine', 'gocovri', 'osmolex', 'symmetrel',
    'istradefylline', 'nourianz',
    'trihexyphenidyl', 'artane',
    'benztropine', 'cogentin',
    'donepezil', 'aricept',
    'rivastigmine', 'exelon',
    'galantamine', 'razadyne',
    'memantine', 'namenda', 'namzaric',
    'aducanumab', 'aduhelm',
    'lecanemab', 'leqembi',
    'donanemab',
  ]
  if (hit(NEURO_PARKINSONS_NAMES)) {
    return { archetype: 'neuro-parkinsons', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'moderate' }
  }

  // Urology (BPH, overactive bladder, ED)
  const UROLOGY_NAMES = [
    'tamsulosin', 'flomax',
    'alfuzosin', 'uroxatral',
    'silodosin', 'rapaflo',
    'finasteride', 'proscar', 'propecia',
    'dutasteride', 'avodart',
    'dutasteride-tamsulosin', 'jalyn',
    'oxybutynin', 'ditropan',
    'tolterodine', 'detrol',
    'solifenacin', 'vesicare',
    'darifenacin', 'enablex',
    'trospium', 'sanctura',
    'fesoterodine', 'toviaz',
    'mirabegron', 'myrbetriq',
    'vibegron', 'gemtesa',
    'phenazopyridine', 'pyridium', 'azo standard',
    'bethanechol', 'urecholine',
    'sildenafil', 'viagra', 'revatio',
    'tadalafil', 'cialis', 'adcirca',
    'vardenafil', 'levitra', 'staxyn',
    'avanafil', 'stendra',
    'alprostadil', 'caverject', 'muse',
  ]
  if (hit(UROLOGY_NAMES)) {
    return { archetype: 'urology', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Osteoporosis / bone
  const OSTEOPOROSIS_NAMES = [
    'alendronate', 'fosamax',
    'risedronate', 'actonel', 'atelvia',
    'ibandronate', 'boniva',
    'zoledronic acid', 'reclast',
    'raloxifene', 'evista',
    'teriparatide', 'forteo',
    'abaloparatide', 'tymlos',
    'romosozumab', 'evenity',
    'denosumab', 'prolia', 'xgeva',
    'calcitonin', 'miacalcin', 'fortical',
  ]
  if (hit(OSTEOPOROSIS_NAMES)) {
    return { archetype: 'osteoporosis', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'low' }
  }

  // GI-IBD (aminosalicylates, oral budesonide brands, IBD-specific biologics)
  const GI_IBD_NAMES = [
    'mesalamine', 'asacol', 'lialda', 'pentasa', 'delzicol', 'apriso', 'rowasa', 'sfrowasa',
    'balsalazide', 'colazal',
    'olsalazine', 'dipentum',
    'sulfasalazine', 'azulfidine',
    'entocort', 'uceris',            // budesonide oral brands
    'vedolizumab', 'entyvio',
    'ozanimod', 'zeposia',
    'etrasimod', 'velsipity',
    'mirikizumab', 'omvoh',
    'risankizumab', 'skyrizi',        // also immunology-dmard
    'ustekinumab', 'stelara',         // also specialty-biologic but IBD use
    'infliximab', 'remicade',
    'adalimumab', 'humira',
  ]
  if (hit(GI_IBD_NAMES)) {
    return { archetype: 'gi-ibd', chronicOrAcute: 'chronic', typicalFriction: 'high', costSensitivity: 'high', quantityLimitLikelihood: 'moderate' }
  }

  // Immunology / DMARD (RA, psoriatic arthritis — not covered above)
  const IMMUNOLOGY_DMARD_NAMES = [
    'hydroxychloroquine', 'plaquenil',
    'leflunomide', 'arava',
    'tofacitinib', 'xeljanz',
    'baricitinib', 'olumiant',
    'upadacitinib', 'rinvoq',
    'abatacept', 'orencia',
    'anakinra', 'kineret',
    'tocilizumab', 'actemra',
    'sarilumab', 'kevzara',
    'secukinumab', 'cosentyx',
    'ixekizumab', 'taltz',
    'guselkumab', 'tremfya',
    'tildrakizumab', 'ilumya',
    'bimekizumab', 'bimzelx',
    'apremilast', 'otezla',
    'deucravacitinib', 'sotyktu',
    'filgotinib',
  ]
  if (hit(IMMUNOLOGY_DMARD_NAMES)) {
    return { archetype: 'immunology-dmard', chronicOrAcute: 'chronic', typicalFriction: 'high', costSensitivity: 'high', quantityLimitLikelihood: 'moderate' }
  }

  // Antipsychotics not already in MENTAL_HEALTH_NAMES
  const ANTIPSYCHOTIC_NAMES = [
    'asenapine', 'saphris',
    'iloperidone', 'fanapt',
    'brexpiprazole', 'rexulti',
    'cariprazine', 'vraylar',
    'lumateperone', 'caplyta',
    'pimavanserin', 'nuplazid',
    'chlorpromazine', 'thorazine',
    'perphenazine',
    'fluphenazine', 'prolixin',
    'thioridazine',
    'thiothixene', 'navane',
    'loxapine', 'loxitane',
    'pimozide', 'orap',
    'haloperidol decanoate', 'haldol decanoate',
    'fluphenazine decanoate',
    'risperidone consta',
    'paliperidone palmitate', 'invega sustenna', 'invega trinza',
    'aripiprazole lauroxil', 'aristada',
    'olanzapine pamoate', 'zyprexa relprevv',
    'molindone',
    'penfluridol',
  ]
  if (hit(ANTIPSYCHOTIC_NAMES)) {
    return { archetype: 'antipsychotic', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'moderate' }
  }

  // Renal / dialysis
  const RENAL_DIALYSIS_NAMES = [
    'sevelamer', 'renvela', 'renagel',
    'lanthanum', 'fosrenol',
    'calcium acetate renal', 'phoslo',
    'sucroferric oxyhydroxide', 'velphoro',
    'ferric citrate', 'auryxia',
    'cinacalcet', 'sensipar',
    'etelcalcetide', 'parsabiv',
    'sodium polystyrene', 'kayexalate',
    'patiromer', 'veltassa',
    'sodium zirconium', 'lokelma',
    'tolvaptan', 'jynarque', 'samsca',
    'finerenone', 'kerendia',
    'bardoxolone',
    'avacopan', 'tavneos',
    'sparsentan', 'filspari',
    'burosumab', 'crysvita',
  ]
  if (hit(RENAL_DIALYSIS_NAMES)) {
    return { archetype: 'renal-dialysis', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'high', quantityLimitLikelihood: 'moderate' }
  }

  // Pulmonary specialty (PAH, IPF)
  const PULMONARY_SPECIALTY_NAMES = [
    'bosentan', 'tracleer',
    'ambrisentan', 'letairis',
    'macitentan', 'opsumit',
    'riociguat', 'adempas',
    'epoprostenol', 'flolan', 'veletri',
    'treprostinil', 'remodulin', 'tyvaso', 'orenitram', 'unituxin',
    'iloprost', 'ventavis',
    'selexipag', 'uptravi',
    'nintedanib', 'ofev',
    'pirfenidone', 'esbriet',
    'inhaled treprostinil',
    'sotatercept', 'winrevair',
  ]
  if (hit(PULMONARY_SPECIALTY_NAMES)) {
    return { archetype: 'pulmonary-specialty', chronicOrAcute: 'chronic', typicalFriction: 'high', costSensitivity: 'high', quantityLimitLikelihood: 'high' }
  }

  // Hormone / HRT
  const HORMONE_HRT_NAMES = [
    'estradiol', 'estrace', 'estrogel', 'divigel', 'evamist',
    'climara', 'vivelle', 'alora', 'minivelle',
    'conjugated estrogens', 'premarin', 'enjuvia', 'cenestin',
    'esterified estrogens', 'menest',
    'estropipate', 'ogen', 'ortho-est',
    'progesterone oral', 'prometrium',
    'estradiol-progesterone', 'bijuva',
    'ospemifene', 'osphena',
    'bazedoxifene', 'duavee',
    'prasterone', 'intrarosa',
    'estradiol vaginal', 'vagifem', 'yuvafem', 'imvexxy',
    'estriol',
    'estradiol ring', 'femring', 'estring',
    'norethindrone hrt',
    'estradiol-norethindrone', 'activella', 'femhrt', 'prefest',
    'estradiol-levonorgestrel', 'climara pro',
    'estradiol-norgestimate',
  ]
  if (hit(HORMONE_HRT_NAMES)) {
    return { archetype: 'hormone-hrt', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Testosterone / androgen
  const TESTOSTERONE_ANDROGEN_NAMES = [
    'testosterone', 'androgel', 'axiron', 'fortesta', 'testim', 'vogelxo',
    'testosterone cypionate', 'depo-testosterone',
    'testosterone enanthate', 'delatestryl',
    'testosterone undecanoate', 'jatenzo', 'tlando', 'aveed', 'kyzatrex',
    'testosterone patch', 'androderm',
    'testosterone solution', 'natesto',
    'danazol',
    'oxandrolone',
    'methyltestosterone',
    'fluoxymesterone',
  ]
  if (hit(TESTOSTERONE_ANDROGEN_NAMES)) {
    return { archetype: 'testosterone-androgen', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'moderate' }
  }

  // Oral diabetes agents (not injectable GLP-1 or insulin)
  const DIABETES_ORAL_NAMES = [
    'glipizide', 'glucotrol',
    'glyburide', 'diabeta', 'glynase', 'micronase',
    'glimepiride', 'amaryl',
    'pioglitazone', 'actos',
    'rosiglitazone', 'avandia',
    'sitagliptin', 'januvia', 'janumet',
    'saxagliptin', 'onglyza', 'kombiglyze',
    'linagliptin', 'tradjenta', 'jentadueto',
    'alogliptin', 'nesina', 'kazano',
    'empagliflozin', 'jardiance', 'synjardy',
    'dapagliflozin', 'farxiga', 'xigduo',
    'canagliflozin', 'invokana', 'invokamet',
    'ertugliflozin', 'steglatro', 'steglujan',
    'repaglinide', 'prandin',
    'nateglinide', 'starlix',
    'acarbose', 'precose',
    'miglitol', 'glyset',
    'pramlintide', 'symlin',
    'metformin',   // usually caught as common-generic-chronic but include here for 'other' bucket
  ]
  if (hit(DIABETES_ORAL_NAMES)) {
    return { archetype: 'diabetes-oral', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Antiemetics / GI motility
  const ANTIEMETIC_GI_NAMES = [
    'ondansetron', 'zofran', 'zuplenz',
    'granisetron', 'kytril', 'sancuso',
    'dolasetron', 'anzemet',
    'palonosetron', 'aloxi',
    'prochlorperazine', 'compazine',
    'promethazine', 'phenergan',
    'metoclopramide', 'reglan', 'gimoti',
    'trimethobenzamide', 'tigan',
    'dronabinol', 'marinol', 'syndros',
    'nabilone', 'cesamet',
    'aprepitant', 'emend',
    'fosaprepitant',
    'rolapitant', 'varubi',
    'netupitant', 'akynzeo',
    'alosetron', 'lotronex',
    'tegaserod', 'zelnorm',
    'linaclotide', 'linzess',
    'lubiprostone', 'amitiza',
    'plecanatide', 'trulance',
    'naloxegol', 'movantik',
    'methylnaltrexone', 'relistor',
    'naldemedine', 'symproic',
  ]
  if (hit(ANTIEMETIC_GI_NAMES)) {
    return { archetype: 'antiemetic-gi', chronicOrAcute: 'both', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Smoking cessation
  const SMOKING_CESSATION_NAMES = [
    'varenicline', 'chantix', 'champix', 'tyrvaya smoking',
    'nicotine', 'nicorette', 'nicoderm', 'nicotrol', 'habitrol',
    'cytisine', 'tabex',
  ]
  if (hit(SMOKING_CESSATION_NAMES)) {
    return { archetype: 'smoking-cessation', chronicOrAcute: 'acute', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Allergy / rhinitis
  const ALLERGY_RHINITIS_NAMES = [
    'loratadine', 'claritin',
    'cetirizine', 'zyrtec',
    'fexofenadine', 'allegra',
    'desloratadine', 'clarinex',
    'levocetirizine', 'xyzal',
    'diphenhydramine',
    'hydroxyzine', 'vistaril', 'atarax',
    'cyproheptadine',
    'azelastine nasal', 'astelin', 'astepro',
    'olopatadine nasal', 'patanase',
    'cromolyn nasal', 'nasalcrom',
    'ipratropium nasal', 'atrovent nasal',
    'rupatadine',
    'bilastine',
  ]
  if (hit(ALLERGY_RHINITIS_NAMES)) {
    return { archetype: 'allergy-rhinitis', chronicOrAcute: 'both', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Systemic corticosteroids
  const STEROID_SYSTEMIC_NAMES = [
    'prednisone', 'deltasone', 'prednicot', 'rayos',
    'prednisolone', 'orapred', 'prelone', 'pediapred',
    'methylprednisolone', 'medrol', 'depo-medrol', 'solu-medrol',
    'dexamethasone', 'dexamethasone oral', 'dexamethasone injection',
    'betamethasone', 'celestone',
    'triamcinolone injection', 'kenalog injection',
    'cortisone', 'cortone',
    'fludrocortisone', 'florinef',
    'hydrocortisone oral', 'cortef',
    'hydrocortisone injection', 'solu-cortef',
  ]
  if (hit(STEROID_SYSTEMIC_NAMES)) {
    return { archetype: 'steroid-systemic', chronicOrAcute: 'both', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Systemic antifungals
  const ANTIFUNGAL_SYSTEMIC_NAMES = [
    'itraconazole', 'sporanox', 'onmel', 'tolsura',
    'posaconazole', 'noxafil',
    'voriconazole', 'vfend',
    'isavuconazole', 'cresemba',
    'griseofulvin', 'gris-peg', 'grifulvin',
    'terbinafine', 'lamisil',
    'anidulafungin', 'eraxis',
    'caspofungin', 'cancidas',
    'micafungin', 'mycamine',
    'amphotericin', 'abelcet', 'ambisome', 'amphotec',
    'flucytosine', 'ancobon',
    'ibrexafungerp', 'brexafemme',
    'olorofim', 'milvexian',
  ]
  if (hit(ANTIFUNGAL_SYSTEMIC_NAMES)) {
    return { archetype: 'antifungal-systemic', chronicOrAcute: 'both', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'low' }
  }

  // Systemic antibiotics (beyond ACUTE_NAMES — mostly IV forms)
  const ANTIBIOTIC_SYSTEMIC_NAMES = [
    'vancomycin', 'vancocin',
    'linezolid', 'zyvox',
    'daptomycin', 'cubicin',
    'rifampin', 'rifadin', 'rimactane',
    'rifaximin', 'xifaxan',
    'fidaxomicin', 'dificid',
    'tedizolid', 'sivextro',
    'oritavancin', 'orbactiv',
    'dalbavancin', 'dalvance',
    'fosfomycin', 'monurol',
    'polymyxin', 'colistin', 'polymyxin b',
    'amikacin', 'amikin',
    'tobramycin', 'tobi',
    'gentamicin',
    'chloramphenicol',
    'clofazimine', 'lamprene',
    'bedaquiline', 'sirturo',
    'delamanid',
    'pretomanid',
    'rifapentine', 'priftin',
    'ethambutol', 'myambutol',
    'isoniazid', 'nydrazid',
    'pyrazinamide',
    'cefazolin',
    'ceftriaxone',
    'cefepime',
    'ceftazidime',
    'cefoxitin',
    'meropenem',
    'imipenem',
    'ertapenem',
    'doripenem',
    'aztreonam',
    'piperacillin',
    'ticarcillin',
    'ampicillin',
    'oxacillin', 'nafcillin',
    'gentamicin',
    'streptomycin',
    'levofloxacin',
    'ceftolozane', 'zerbaxa',
    'ceftazidime-avibactam', 'avycaz',
    'meropenem-vaborbactam', 'vabomere',
    'imipenem-cilastatin-relebactam', 'recarbrio',
    'omadacycline', 'nuzyra',
    'eravacycline', 'xerava',
  ]
  if (hit(ANTIBIOTIC_SYSTEMIC_NAMES)) {
    return { archetype: 'antibiotic-systemic', chronicOrAcute: 'both', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Vaccines
  const VACCINE_NAMES = [
    'vaccine', 'vaccination',
    'varivax', 'zostavax', 'shingrix',
    'prevnar', 'pneumovax', 'vaxneuvance',
    'fluzone', 'fluvax', 'fluarix', 'flublok', 'afluria', 'fluad', 'flulaval',
    'gardasil', 'cervarix',
    'engerix', 'recombivax', 'heplisav', 'prehevbrio',
    'twinrix', 'havrix', 'vaqta',
    'menactra', 'menveo', 'mpsv4',
    'trumenba', 'bexsero',
    'daptacel', 'infanrix', 'pediarix', 'pentacel',
    'varicella vaccine', 'zoster vaccine',
    'hpv vaccine', 'papillomavirus vaccine',
    'hepatitis a vaccine', 'hepatitis b vaccine',
    'meningococcal vaccine', 'pneumococcal vaccine',
    'influenza vaccine', 'covid vaccine',
    'mmr vaccine', 'mmrv', 'priorix',
    'rotateq', 'rotarix',
    'typhoid vaccine', 'vivotif', 'typhim vi',
    'rabies vaccine', 'imovax', 'rabavert',
    'yellow fever vaccine', 'stamaril',
    'tdap', 'boostrix', 'adacel',
    'ipv', 'ipol',
    'bcg vaccine',
    'anthrax vaccine', 'biothrax',
  ]
  if (hit(VACCINE_NAMES)) {
    return { archetype: 'vaccine', chronicOrAcute: 'acute', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Rx supplements / vitamins
  const RX_SUPPLEMENTS_NAMES = [
    'folic acid', 'leucovorin', 'levoleucovorin',
    'cyanocobalamin', 'methylcobalamin', 'hydroxocobalamin',
    'ergocalciferol',
    'ferrous sulfate', 'ferrous gluconate', 'ferrous fumarate', 'ferric maltol',
    'iron supplement',
    'zinc sulfate',
    'sodium fluoride', 'fluoride supplement',
    'thiamine', 'riboflavin', 'pyridoxine',
    'niacinamide', 'niacin er prescription',
    'calcitriol',       // not topical/ophthalmic
    'paricalcitol', 'doxercalciferol',
    'magnesium oxide', 'magnesium glycinate',
    'potassium chloride', 'klor-con', 'k-tab', 'micro-k',
    'potassium bicarbonate',
    'omega-3 acid', 'lovaza', 'vascepa', 'epanova',
    'icosapent ethyl',
  ]
  if (hit(RX_SUPPLEMENTS_NAMES)) {
    return { archetype: 'rx-supplements', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Prenatal vitamins
  const PRENATAL_VITAMIN_NAMES = [
    'prenatal', 'prenatal vitamin', 'prenatal multi',
    'citranatal', 'neevo', 'vitafol', 'prenatabs', 'prenate', 'precare',
    'natafort', 'natachew', 'natelle', 'nestabs',
    'ob complete', 'pnv', 'pnv-ob',
    'prenatal dha', 'prenatal omega',
    'vitafol-one', 'stuartnatal', 'materna',
  ]
  if (hit(PRENATAL_VITAMIN_NAMES)) {
    return { archetype: 'prenatal-vitamins', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Weight management (non-GLP-1)
  const WEIGHT_MGMT_NAMES = [
    'phentermine', 'adipex', 'lomaira', 'fastin',
    'phentermine-topiramate', 'qsymia',
    'naltrexone-bupropion', 'contrave',
    'orlistat', 'xenical', 'alli',
    'setmelanotide', 'imcivree',
  ]
  if (hit(WEIGHT_MGMT_NAMES)) {
    return { archetype: 'weight-mgmt', chronicOrAcute: 'chronic', typicalFriction: 'high', costSensitivity: 'high', quantityLimitLikelihood: 'high' }
  }

  // Devices / supplies
  const DEVICES_SUPPLIES_NAMES = [
    'lancet', 'lancets',
    'test strip', 'glucose test',
    'glucose meter', 'glucometer', 'blood glucose monitor',
    'continuous glucose', 'cgm sensor',
    'dexcom', 'freestyle libre', 'omnipod', 'accu-chek', 'onetouch ultra',
    'insulin pump supply',
    'catheter', 'ostomy', 'urological catheter',
    'nebulizer', 'nebulization supply',
    'spacer', 'valved holding chamber',
    'peak flow meter',
    'syringe', 'insulin syringe', 'pen needle',
    'alcohol swab',
    'oral rehydration',
    'wound care supply',
    'compression stocking',
  ]
  if (hit(DEVICES_SUPPLIES_NAMES)) {
    return { archetype: 'devices-supplies', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Epinephrine / emergency
  const EPINEPHRINE_NAMES = [
    'epinephrine', 'epipen', 'auvi-q', 'adrenaclick', 'adrenalin',
    'epinephrine auto-injector',
    'anaphylaxis kit',
  ]
  if (hit(EPINEPHRINE_NAMES)) {
    return { archetype: 'epinephrine-emergency', chronicOrAcute: 'acute', typicalFriction: 'low', costSensitivity: 'high', quantityLimitLikelihood: 'low' }
  }

  // Otic / ear
  const OTIC_EAR_NAMES = [
    'ciprofloxacin otic', 'cetraxal', 'otiprio',
    'ofloxacin otic', 'floxin otic',
    'neomycin-polymyxin otic', 'cortisporin otic', 'pediotic',
    'hydrocortisone otic',
    'antipyrine-benzocaine', 'auralgan',
    'carbamide peroxide otic', 'debrox',
    'acetic acid otic', 'vosol', 'acetasol',
    'fluocinolone otic', 'dermotic',
    'dexamethasone otic',
    'triamcinolone otic',
  ]
  if (hit(OTIC_EAR_NAMES)) {
    return { archetype: 'otic-ear', chronicOrAcute: 'both', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // ── Additional gap-filler redirects ──────────────────────────────────────

  // Ophthalmic extra (brands + sulfacetamide ophthalmic)
  const OPHTHALMIC_GAP = [
    'sulfacetamide',   // catches 'sulfacetamide sodium ophthalmic' via normalization
    'zirgan', 'ganciclovir ophthalmic',
    'lucentis', 'ranibizumab',
    'eylea', 'aflibercept',
    'beovu', 'brolucizumab',
    'vabysmo', 'faricimab',
    'macugen', 'pegaptanib',
    'toric', 'tocilizumab ophthalmic',
    'ozurdex', 'dexamethasone implant',
    'iluvien', 'yutiq', 'fluocinolone acetonide implant',
    'retisert', 'suprachoroidal',
    'photrexa', 'photodynamic',
    'acuity',
    'polytrim ophthalmic',
    'maxitrol ophthalmic',
    'tobradex ophthalmic',
    'zylet ophthalmic',
    'pred mild', 'econopred',
    'alrex ophthalmic',
  ]
  if (hit(OPHTHALMIC_GAP) || nameMatches(raw, OPHTHALMIC_NAMES) || nameMatches(norm, OPHTHALMIC_NAMES)) {
    return { archetype: 'ophthalmic', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Allergy / rhinitis gap (plain forms of drugs with 'nasal' qualifier in ALLERGY_RHINITIS_NAMES)
  const ALLERGY_GAP = [
    'azelastine',   // 'azelastine nasal' in list; plain form catches ophthalmic too
    'cromolyn',     // 'cromolyn nasal' in list; plain form catches oral cromoglicate
    'olopatadine',  // 'olopatadine nasal' and 'olopatadine ophthalmic' are separate
    'ketotifen',    // oral or ophthalmic
    'nedocromil', 'tilade',
    'montelukast',  // already in INHALER_NAMES but may appear in 'other'
  ]
  if (hit(ALLERGY_GAP)) {
    return { archetype: 'allergy-rhinitis', chronicOrAcute: 'both', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Blood pressure extra (plain forms + combos + brands not in BLOOD_PRESSURE_OTHER_NAMES)
  const BP_GAP = [
    'metoprolol',   // plain form; 'metoprolol succinate' is in the main list
    'lopressor',    // metoprolol brand
    'propranolol', 'inderal',
    'atenolol', 'tenormin',
    'losartan', 'cozaar',
    'valsartan', 'diovan',
    'fosinopril', 'monopril',
    'ramipril', 'altace',
    'benazepril', 'lotensin',
    'moexipril', 'univasc',
    'quinapril', 'accupril',
    'trandolapril', 'mavik',
    'perindopril', 'aceon',
    'amlodipine', 'norvasc',
    'lisinopril-hydrochlorothiazide',
    'losartan-hydrochlorothiazide',
    'valsartan-hydrochlorothiazide',
    'metoprolol-hydrochlorothiazide',
    'amlodipine-benazepril',
    'amlodipine-olmesartan',
    'amlodipine-valsartan',
    'triamterene', 'dyrenium',
    'amiloride',
    'spironolactone', 'aldactone',  // aldosterone antagonist
    'chlorthalidone', 'thalitone',
    'hydrochlorothiazide', 'hctz', 'microzide',
    'furosemide', 'lasix',         // loop diuretic
    'bumetanide',                  // loop diuretic
    'sacubitril-valsartan',
    'aliskiren', 'tekturna',
    'clonidine',   // already in BLOOD_PRESSURE_OTHER_NAMES
  ]
  if (hit(BP_GAP) || nameMatches(raw, BLOOD_PRESSURE_OTHER_NAMES) || nameMatches(norm, BLOOD_PRESSURE_OTHER_NAMES)) {
    return { archetype: 'blood-pressure-other', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Statin / cholesterol gap
  const STATIN_GAP = [
    'colestipol', 'colestid',
    'cholestyramine', 'questran', 'prevalite',
    'colesevelam', 'welchol',
    'fenofibrate', 'tricor', 'trilipix', 'antara',
    'gemfibrozil', 'lopid',
    'niacin er', 'niaspan',
    'omega-3 ethyl esters',
    'bempedoic acid', 'nexletol', 'nexlizet',
    'ezetimibe', 'zetia',
    'ezetimibe-simvastatin', 'vytorin',
    'evolocumab', 'repatha',
    'alirocumab', 'praluent',
    'inclisiran', 'leqvio',
  ]
  if (hit(STATIN_GAP) || nameMatches(raw, STATIN_NAMES) || nameMatches(norm, STATIN_NAMES)) {
    return { archetype: 'statin-cholesterol', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Anticoagulant gap (argatroban, bivalirudin, other injectable anticoags)
  const ANTICOAG_GAP = [
    'argatroban',
    'bivalirudin', 'angiomax',
    'desirudin',
    'lepirudin',
    'antithrombin', 'thrombate',
    'protein c', 'ceprotin',
  ]
  if (hit(ANTICOAG_GAP) || nameMatches(raw, ANTICOAGULANT_NAMES) || nameMatches(norm, ANTICOAGULANT_NAMES)) {
    return { archetype: 'anticoagulant', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'low' }
  }

  // Mental health gap (brands and older agents not in MENTAL_HEALTH_NAMES)
  const MH_GAP = [
    'lithobid', 'eskalith',  // lithium brands (lithium is in MENTAL_HEALTH_NAMES)
    'lexapro', 'prozac', 'zoloft', 'paxil', 'celexa',
    'effexor', 'cymbalta', 'pristiq', 'wellbutrin', 'remeron',
    'abilify', 'seroquel', 'zyprexa', 'risperdal', 'latuda',
    'lamictal',   // lamotrigine brand
    'invega',     // paliperidone brand
    'vraylar', 'rexulti', 'saphris',  // also in ANTIPSYCHOTIC above
    'trintellix', 'viibryd', 'fetzima',
    'nuvigil', 'provigil',  // in CONTROLLED_NAMES but may miss
    'phenergan',   // promethazine
    'vistaril', 'atarax',  // hydroxyzine
  ]
  if (hit(MH_GAP) || nameMatches(raw, MENTAL_HEALTH_NAMES) || nameMatches(norm, MENTAL_HEALTH_NAMES)) {
    return { archetype: 'mental-health', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'moderate' }
  }

  // Urology gap (desmopressin, lofexidine)
  const UROLOGY_GAP = [
    'desmopressin', 'ddavp', 'stimate', 'minirin', 'noctiva', 'nocdurna',
    'lofexidine', 'lucemyra',  // opioid withdrawal
    'onabotulinumtoxin', 'botox urology',
    'pentosan polysulfate', 'elmiron',
    'hyoscyamine', 'levsin', 'anaspaz', 'cystospaz', 'nulev',
    'dicyclomine', 'bentyl',
  ]
  if (hit(UROLOGY_GAP)) {
    return { archetype: 'urology', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Dermatology gap (plain lidocaine, sulfacetamide plain)
  const DERM_GAP = [
    'lidocaine',    // catches 'lidocaine hcl', 'lidocaine viscous', etc via normalization
    'lidoderm', 'zingo',
    'capsaicin',
    'benzocaine topical',
    'pramoxine', 'prax',
    'calamine', 'caladryl',
    'zinc oxide topical',
    'coal tar', 'denorex', 'neutrogena t/gel',
    'pyrithione zinc',
    'salicylic acid',
    'benzoyl peroxide',
    'adapalene',
    'clindamycin topical',   // catches 'clindamycin topical solution' etc.
    'erythromycin topical',
    'dapsone topical',
    'minocycline topical', 'amzeeq',
    'luliconazole', 'luzu',
    'tavaborole', 'kerydin',
    'efinaconazole', 'jublia',
    'halobetasol',
    'clobetasol',    // already in DERMATOLOGY but catches 'clobetasol propionate'
  ]
  if (hit(DERM_GAP) || nameMatches(raw, DERMATOLOGY_TOPICAL_NAMES) || nameMatches(norm, DERMATOLOGY_TOPICAL_NAMES)) {
    return { archetype: 'dermatology', chronicOrAcute: 'both', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Osteoporosis gap (pamidronate, zoledronic)
  const OSTEO_GAP = [
    'pamidronate', 'aredia',
    'zoledronic acid', 'zometa',  // zometa (bone mets) vs reclast (osteoporosis) — same drug
    'strontium ranelate',
    'odanacatib',
  ]
  if (hit(OSTEO_GAP) || nameMatches(raw, OSTEOPOROSIS_NAMES) || nameMatches(norm, OSTEOPOROSIS_NAMES)) {
    return { archetype: 'osteoporosis', chronicOrAcute: 'chronic', typicalFriction: 'moderate', costSensitivity: 'moderate', quantityLimitLikelihood: 'low' }
  }

  // Thyroid gap
  if (nameMatches(raw, THYROID_NAMES) || nameMatches(norm, THYROID_NAMES)) {
    return { archetype: 'thyroid-hormone', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Contraceptive gap
  const CONTRACEPTIVE_GAP = [
    'lo-zumandimine', 'zumandimine', 'lojaimiess', 'lopreeza',
    'lo loestrin', 'femynor', 'luizza', 'lyleq', 'lynkuet',
    'zenchent', 'zovia',
    'lo-ogestrel', 'low-ogestrel',
    'pimtrea',
    'myhibb', 'larin',
    'gildagia', 'gianvi', 'loryna',
  ]
  if (hit(CONTRACEPTIVE_GAP) || nameMatches(raw, CONTRACEPTIVE_NAMES) || nameMatches(norm, CONTRACEPTIVE_NAMES)) {
    return { archetype: 'contraceptive', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Rx supplements gap (plain forms of iron, vitamins)
  const SUPPS_GAP = [
    'ferumoxytol', 'feraheme',
    'iron sucrose', 'venofer',
    'ferric carboxymaltose', 'injectafer',
    'ferric derisomaltose', 'monoferric',
    'iron dextran', 'infed', 'dexferrum',
    'sodium ferric gluconate',
    'lysine', 'l-lysine',
    'biotin',
    'niacin',
    'cholecalciferol',
    'ergocalciferol',
    'ascorbic acid',
    'zinc chloride',
    'zinc oxide',   // oral form
    'ferrous',      // catches any 'ferrous X' not already matched
    'manganese',
    'copper',
    'selenium',
  ]
  if (hit(SUPPS_GAP)) {
    return { archetype: 'rx-supplements', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // Devices gap
  const DEVICES_GAP = [
    'lancing', 'lifeshield', 'litetouch', 'lite touch',
    'liteaire', 'liveaire',
    'meter', 'monitor',
    'spring loaded',
    'pen needle',
    'cannula',
    'infusion set',
    'sensor',
    'transmitter',
    'reservoir',
  ]
  if (hit(DEVICES_GAP)) {
    return { archetype: 'devices-supplies', chronicOrAcute: 'chronic', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  // GI-IBD gap / antiemetic gap
  const GI_GAP = [
    'lomotil', 'diphenoxylate',
    'dicyclomine',  // also in UROLOGY_GAP - doesn't matter, same archetype not reached if urology wins
    'hyoscine', 'scopolamine',
    'clidinium',
    'librax',
    'colestid', 'colestipol',  // lipid-lowering via gut
    'rifaximin',   // already in ANTIBIOTIC_SYSTEMIC but also used for IBS/HE
    'lubiprostone', 'amitiza',
    'linzess', 'linaclotide',
  ]
  if (hit(GI_GAP)) {
    return { archetype: 'antiemetic-gi', chronicOrAcute: 'both', typicalFriction: 'low', costSensitivity: 'low', quantityLimitLikelihood: 'low' }
  }

  return null
}
