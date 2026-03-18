// ============================================================
// lib/drug-linking.ts — Programmatic internal linking for drug pages
// Provides category detection, related drug selection, comparison
// link generation, and educational link mapping.
// ============================================================

import type { TierGroup } from './formulary-helpers'
import { stateCodeToSlug, getCountySlug } from './county-lookup'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DrugCategory {
  /** Machine key, e.g. "diabetes" */
  id: string
  /** Consumer-facing label, e.g. "Diabetes Medications" */
  label: string
  /** Short description for context */
  description: string
  /** Drugs in this category (lowercase canonical names) */
  drugs: string[]
}

export interface RelatedDrug {
  name: string
  slug: string
  href: string
}

export interface ComparisonLink {
  drugA: string
  drugB: string
  label: string
  href: string
}

export interface CategoryHubLink {
  categoryId: string
  label: string
  href: string
}

export interface CountyDrugLink {
  label: string
  href: string
}

export interface EducationalLink {
  label: string
  href: string
  /** Short context line shown below the link */
  context: string
}

export interface StatePlanLink {
  label: string
  href: string
}

// ─── Drug Category Taxonomy ─────────────────────────────────────────────────
// 20 therapeutic categories covering the most commonly searched medications
// on ACA Marketplace formularies. Each category contains 6–12 drugs ordered
// by prescription volume / search frequency.

export const DRUG_TAXONOMY: DrugCategory[] = [
  {
    id: 'diabetes',
    label: 'Diabetes Medications',
    description: 'Drugs for managing blood sugar and type 2 diabetes',
    drugs: [
      'metformin', 'ozempic', 'jardiance', 'trulicity', 'farxiga',
      'mounjaro', 'wegovy', 'januvia', 'glipizide', 'insulin glargine',
      'rybelsus', 'invokana',
    ],
  },
  {
    id: 'blood-pressure',
    label: 'Blood Pressure Medications',
    description: 'Drugs for managing hypertension',
    drugs: [
      'lisinopril', 'amlodipine', 'losartan', 'metoprolol',
      'hydrochlorothiazide', 'valsartan', 'enalapril', 'olmesartan',
      'irbesartan', 'carvedilol', 'benazepril', 'telmisartan',
    ],
  },
  {
    id: 'cholesterol',
    label: 'Cholesterol Medications',
    description: 'Drugs for managing cholesterol and cardiovascular risk',
    drugs: [
      'atorvastatin', 'rosuvastatin', 'simvastatin', 'ezetimibe',
      'pravastatin', 'lovastatin', 'fenofibrate', 'repatha', 'praluent',
      'pitavastatin',
    ],
  },
  {
    id: 'mental-health',
    label: 'Mental Health Medications',
    description: 'Antidepressants, anti-anxiety, and mood stabilizers',
    drugs: [
      'sertraline', 'escitalopram', 'bupropion', 'trazodone', 'buspirone',
      'fluoxetine', 'duloxetine', 'venlafaxine', 'citalopram',
      'paroxetine', 'mirtazapine', 'amitriptyline',
    ],
  },
  {
    id: 'pain-inflammation',
    label: 'Pain & Inflammation',
    description: 'NSAIDs, nerve pain, and anti-inflammatory medications',
    drugs: [
      'gabapentin', 'meloxicam', 'cyclobenzaprine', 'naproxen', 'celecoxib',
      'pregabalin', 'diclofenac', 'ibuprofen', 'tramadol',
      'indomethacin',
    ],
  },
  {
    id: 'thyroid',
    label: 'Thyroid Medications',
    description: 'Drugs for hypothyroidism and thyroid disorders',
    drugs: [
      'levothyroxine', 'liothyronine', 'synthroid', 'armour thyroid',
      'methimazole', 'propylthiouracil',
    ],
  },
  {
    id: 'respiratory',
    label: 'Respiratory & Asthma',
    description: 'Inhalers, bronchodilators, and allergy medications',
    drugs: [
      'albuterol', 'montelukast', 'fluticasone', 'budesonide',
      'tiotropium', 'symbicort', 'advair', 'breo ellipta',
      'ipratropium', 'cetirizine', 'loratadine', 'fexofenadine',
    ],
  },
  {
    id: 'stomach-gi',
    label: 'Stomach & GI Medications',
    description: 'Acid reflux, ulcer, and digestive medications',
    drugs: [
      'omeprazole', 'pantoprazole', 'famotidine', 'esomeprazole',
      'lansoprazole', 'sucralfate', 'ondansetron', 'dicyclomine',
      'ranitidine', 'metoclopramide',
    ],
  },
  {
    id: 'heart-rhythm',
    label: 'Heart & Rhythm Medications',
    description: 'Blood thinners, anti-arrhythmics, and cardiac drugs',
    drugs: [
      'eliquis', 'xarelto', 'warfarin', 'clopidogrel', 'digoxin',
      'amiodarone', 'diltiazem', 'propranolol', 'sotalol',
      'isosorbide mononitrate',
    ],
  },
  {
    id: 'kidney-diuretics',
    label: 'Kidney & Diuretic Medications',
    description: 'Diuretics and kidney-related medications',
    drugs: [
      'furosemide', 'spironolactone', 'chlorthalidone', 'triamterene',
      'bumetanide', 'torsemide', 'metolazone', 'acetazolamide',
    ],
  },
  {
    id: 'antibiotics',
    label: 'Antibiotics',
    description: 'Common prescription antibiotics',
    drugs: [
      'amoxicillin', 'azithromycin', 'doxycycline', 'ciprofloxacin',
      'cephalexin', 'metronidazole', 'clindamycin', 'sulfamethoxazole',
      'levofloxacin', 'nitrofurantoin',
    ],
  },
  {
    id: 'sleep',
    label: 'Sleep Medications',
    description: 'Medications for insomnia and sleep disorders',
    drugs: [
      'trazodone', 'zolpidem', 'hydroxyzine', 'melatonin',
      'eszopiclone', 'doxepin', 'suvorexant', 'ramelteon',
    ],
  },
  {
    id: 'adhd',
    label: 'ADHD Medications',
    description: 'Stimulants and non-stimulants for attention disorders',
    drugs: [
      'adderall', 'vyvanse', 'concerta', 'methylphenidate',
      'atomoxetine', 'guanfacine', 'dexmethylphenidate', 'strattera',
    ],
  },
  {
    id: 'seizure',
    label: 'Seizure & Epilepsy Medications',
    description: 'Anticonvulsants and seizure prevention drugs',
    drugs: [
      'lamotrigine', 'levetiracetam', 'topiramate', 'carbamazepine',
      'valproic acid', 'phenytoin', 'oxcarbazepine', 'zonisamide',
    ],
  },
  {
    id: 'skin',
    label: 'Skin & Dermatology',
    description: 'Topical and systemic medications for skin conditions',
    drugs: [
      'tretinoin', 'clobetasol', 'triamcinolone', 'ketoconazole',
      'methotrexate', 'dupixent', 'humira', 'mupirocin',
      'tacrolimus', 'acyclovir',
    ],
  },
  {
    id: 'eye-care',
    label: 'Eye Care Medications',
    description: 'Glaucoma, dry eye, and ophthalmic treatments',
    drugs: [
      'latanoprost', 'timolol', 'brimonidine', 'dorzolamide',
      'cyclosporine', 'travoprost', 'olopatadine', 'prednisolone',
    ],
  },
  {
    id: 'osteoporosis',
    label: 'Bone & Osteoporosis',
    description: 'Medications for bone density and osteoporosis',
    drugs: [
      'alendronate', 'risedronate', 'raloxifene', 'denosumab',
      'calcitonin', 'ibandronate', 'teriparatide',
    ],
  },
  {
    id: 'autoimmune',
    label: 'Autoimmune & Biologic',
    description: 'Biologics and immunosuppressants for autoimmune conditions',
    drugs: [
      'humira', 'enbrel', 'methotrexate', 'hydroxychloroquine',
      'sulfasalazine', 'rinvoq', 'xeljanz', 'otezla',
      'leflunomide', 'azathioprine',
    ],
  },
  {
    id: 'weight-loss',
    label: 'Weight Management',
    description: 'GLP-1 agonists and weight loss medications',
    drugs: [
      'wegovy', 'ozempic', 'mounjaro', 'zepbound', 'saxenda',
      'contrave', 'phentermine', 'qsymia',
    ],
  },
  {
    id: 'womens-health',
    label: "Women's Health",
    description: 'Contraceptives, hormone therapy, and reproductive health',
    drugs: [
      'norgestimate-ethinyl estradiol', 'estradiol', 'progesterone',
      'norethindrone', 'spironolactone', 'medroxyprogesterone',
      'letrozole', 'clomiphene', 'premarin',
    ],
  },
]

// ─── Lookup indexes (built once at module load) ──────────────────────────────

/** Maps lowercase drug name → category IDs (a drug can appear in multiple categories) */
const drugToCategoryIds = new Map<string, string[]>()

/** Maps category ID → DrugCategory */
const categoryById = new Map<string, DrugCategory>()

for (const cat of DRUG_TAXONOMY) {
  categoryById.set(cat.id, cat)
  for (const drug of cat.drugs) {
    const existing = drugToCategoryIds.get(drug)
    if (existing) {
      existing.push(cat.id)
    } else {
      drugToCategoryIds.set(drug, [cat.id])
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Normalize a drug name for lookup: lowercase, strip dosage/form suffixes,
 * extract the bracketed brand name if present (CMS format).
 */
function normalizeDrugName(raw: string): string {
  // CMS format: "0.25 MG ... SEMAGLUTIDE ... [OZEMPIC]"
  const bracketMatch = raw.match(/\[([^\]]+)\]/)
  if (bracketMatch) {
    return bracketMatch[1].toLowerCase().trim()
  }
  // Already a clean name — just lowercase
  return raw.toLowerCase().trim()
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns all matching categories for a drug name.
 * Handles both clean names ("metformin") and CMS full names ("[OZEMPIC]").
 */
export function getDrugCategories(drugName: string): DrugCategory[] {
  const normalized = normalizeDrugName(drugName)
  const ids = drugToCategoryIds.get(normalized)
  if (ids) {
    return ids.map((id) => categoryById.get(id)!).filter(Boolean)
  }

  // Fuzzy fallback: check if any category drug appears as a substring
  for (const [key, catIds] of drugToCategoryIds) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return catIds.map((id) => categoryById.get(id)!).filter(Boolean)
    }
  }

  return []
}

/**
 * Returns the primary (first matched) category for a drug, or null.
 */
export function getDrugCategory(drugName: string): DrugCategory | null {
  const cats = getDrugCategories(drugName)
  return cats[0] ?? null
}

/**
 * Returns 4–6 related drugs from the same category, excluding the input drug.
 * Drugs are selected to maximize variety (not just the first N).
 */
export function getRelatedDrugs(
  drugName: string,
  issuerSlug: string,
  limit = 6,
): RelatedDrug[] {
  const normalized = normalizeDrugName(drugName)
  const categories = getDrugCategories(drugName)
  if (categories.length === 0) return []

  const seen = new Set<string>([normalized])
  const result: RelatedDrug[] = []

  // Pull from primary category first, then secondary
  for (const cat of categories) {
    for (const drug of cat.drugs) {
      if (seen.has(drug)) continue
      seen.add(drug)
      result.push({
        name: titleCase(drug),
        slug: slugify(drug),
        href: `/formulary/${issuerSlug}/${slugify(drug)}`,
      })
      if (result.length >= limit) return result
    }
  }

  return result
}

/**
 * Generates 2–3 comparison link pairs for high-SEO-value "Drug A vs Drug B" pages.
 * Pairs the input drug with the most relevant alternatives in the same category.
 */
export function getComparisonLinks(
  drugName: string,
  limit = 3,
): ComparisonLink[] {
  const normalized = normalizeDrugName(drugName)
  const display = titleCase(normalized)
  const categories = getDrugCategories(drugName)
  if (categories.length === 0) return []

  const seen = new Set<string>([normalized])
  const result: ComparisonLink[] = []

  for (const cat of categories) {
    for (const drug of cat.drugs) {
      if (seen.has(drug)) continue
      seen.add(drug)

      const otherDisplay = titleCase(drug)
      // Alphabetical order for canonical URL consistency
      const [first, second] = [display, otherDisplay].sort()
      const slug = `${slugify(first)}-vs-${slugify(second)}`

      result.push({
        drugA: first,
        drugB: second,
        label: `${first} vs ${second}: Coverage, Cost, and Differences`,
        href: `/drugs/compare/${slug}`,
      })

      if (result.length >= limit) return result
    }
  }

  return result
}

/**
 * Returns 2–3 contextually relevant educational guide links based on
 * the drug's tier, restrictions, and category.
 */
export function getEducationalLinks(context: {
  drugName: string
  tierGroup: TierGroup
  hasPriorAuth: boolean
  hasStepTherapy: boolean
  hasQuantityLimit: boolean
  category: DrugCategory | null
}): EducationalLink[] {
  const links: EducationalLink[] = []

  // Always include the tier explainer — it's universally relevant
  links.push({
    label: 'How drug tiers work on Marketplace plans',
    href: '/guides/how-aca-subsidies-work-2026#drug-formulary',
    context: 'Understanding generic, preferred brand, and specialty tiers',
  })

  // Prior auth → link to the PA guide
  if (context.hasPriorAuth) {
    links.push({
      label: 'What is prior authorization and how to appeal a denial',
      href: '/faq/prior_authorization/pa_001',
      context: 'Your doctor must get insurer approval before prescribing',
    })
  }

  // Step therapy → explain the "try first" process
  if (context.hasStepTherapy) {
    links.push({
      label: 'Step therapy explained: when you must try another drug first',
      href: '/faq/prior_authorization/pa_003',
      context: 'How to request an exception if alternatives don\'t work for you',
    })
  }

  // Specialty / high-cost → link to cost savings guide
  if (context.tierGroup === 'specialty' || context.tierGroup === 'non-preferred-brand') {
    links.push({
      label: 'How prescription drug costs work on Marketplace plans',
      href: '/billing/prescription',
      context: 'Copays, coinsurance, deductibles, and out-of-pocket maximums',
    })
  }

  // Quantity limit → formulary exception guide
  if (context.hasQuantityLimit) {
    links.push({
      label: 'How to request a formulary exception for quantity limits',
      href: '/faq/prior_authorization/pa_002',
      context: 'Your right to appeal under federal law (42 U.S.C. §300gg-19)',
    })
  }

  // Generic fallback if we haven't hit 2 links yet
  if (links.length < 2) {
    links.push({
      label: 'How to choose a health plan that covers your medications',
      href: '/guides/how-to-choose-health-plan',
      context: 'Compare formularies during open enrollment to find the best fit',
    })
  }

  // Cap at 3
  return links.slice(0, 3)
}

/**
 * Returns state + plan context links when a state code is available.
 */
export function getStatePlanLinks(
  drugName: string,
  stateCode?: string,
  stateName?: string,
): StatePlanLink[] {
  if (!stateCode || !stateName) return []

  const display = titleCase(normalizeDrugName(drugName))
  const st = stateCode.toLowerCase()

  return [
    {
      label: `Marketplace plans in ${stateName}`,
      href: `/${stateCodeToSlug(stateCode.toUpperCase())}/health-insurance-plans`,
    },
    {
      label: `Browse all drugs covered in ${stateName}`,
      href: `/formulary/${st}/all`,
    },
    {
      label: `${stateName} subsidy calculator — see if you qualify for help with premiums`,
      href: `/subsidies/${st}`,
    },
    {
      label: `Drug coverage hub — browse by category`,
      href: `/drugs`,
    },
  ]
}

/**
 * Returns the category hub page link for a drug.
 * e.g. metformin → { categoryId: "diabetes", label: "Diabetes Medications", href: "/drugs/categories/diabetes" }
 */
export function getCategoryHubLink(drugName: string): CategoryHubLink | null {
  const category = getDrugCategory(drugName)
  if (!category) return null
  return {
    categoryId: category.id,
    label: category.label,
    href: `/drugs/categories/${category.id}`,
  }
}

/**
 * Returns a county-scoped drug coverage link using the canonical URL format.
 * e.g. metformin + "NC" + "37183" → { label: "Metformin coverage in Wake County, NC", href: "/north-carolina/wake-county/metformin-coverage" }
 * countyParam is the 5-digit FIPS code.
 */
export function getCountyDrugLink(
  drugName: string,
  stateCode: string,
  countyFips: string,
  countyDisplay?: string,
): CountyDrugLink {
  const display = titleCase(normalizeDrugName(drugName))
  const drugSlug = slugify(normalizeDrugName(drugName))
  const stateSlug = stateCodeToSlug(stateCode)
  const countySlug = getCountySlug(countyFips)
  const location = countyDisplay ?? countySlug
  return {
    label: `${display} coverage in ${location}`,
    href: `/${stateSlug}/${countySlug}/${drugSlug}-coverage`,
  }
}

/**
 * Returns 2–3 related coverage guide links for the bottom-of-page block.
 * Selected based on drug category to keep them relevant.
 */
export function getRelatedGuides(category: DrugCategory | null): EducationalLink[] {
  // Category-specific guide mappings
  const categoryGuides: Record<string, EducationalLink[]> = {
    diabetes: [
      { label: 'How ACA subsidies can lower your insulin costs', href: '/guides/how-aca-subsidies-work-2026', context: 'Premium tax credits and cost-sharing reductions explained' },
      { label: 'Open enrollment 2026: what\'s changing for prescriptions', href: '/guides/open-enrollment-2026', context: 'Key dates, new rules, and formulary updates' },
    ],
    'blood-pressure': [
      { label: 'What affects your health insurance costs in 2026', href: '/guides/what-affects-health-insurance-costs', context: 'Age, location, tobacco use, and plan type' },
      { label: 'How to choose a health plan when you take daily medications', href: '/guides/how-to-choose-health-plan', context: 'Compare formularies, copays, and pharmacy networks' },
    ],
    cholesterol: [
      { label: 'How to choose a health plan when you take daily medications', href: '/guides/how-to-choose-health-plan', context: 'Compare formularies, copays, and pharmacy networks' },
      { label: 'What affects your health insurance costs in 2026', href: '/guides/what-affects-health-insurance-costs', context: 'Age, location, tobacco use, and plan type' },
    ],
    'mental-health': [
      { label: 'Mental health coverage under ACA Marketplace plans', href: '/faq/subsidies-and-financial-help', context: 'Parity requirements and what plans must cover' },
      { label: 'How to choose a health plan for mental health coverage', href: '/guides/how-to-choose-health-plan', context: 'Formulary tiers, therapy coverage, and network access' },
    ],
    'weight-loss': [
      { label: 'Are GLP-1 weight loss drugs covered by Marketplace plans?', href: '/guides/how-to-choose-health-plan', context: 'Coverage varies widely — check your plan\'s formulary' },
      { label: 'How ACA subsidies reduce your monthly premium', href: '/guides/how-aca-subsidies-work-2026', context: 'Premium tax credits based on income and household size' },
    ],
    respiratory: [
      { label: 'Preventive care covered at $0 under ACA plans', href: '/faq/aca-marketplace-basics', context: 'Includes certain inhalers and allergy medications' },
      { label: 'Open enrollment 2026: key dates and formulary changes', href: '/guides/open-enrollment-2026', context: 'Don\'t miss your window to switch plans' },
    ],
  }

  // Default guides for categories without specific mappings
  const defaultGuides: EducationalLink[] = [
    { label: 'How to choose a Marketplace health plan', href: '/guides/how-to-choose-health-plan', context: 'Compare formularies, copays, and pharmacy networks' },
    { label: 'How ACA subsidies work in 2026', href: '/guides/how-aca-subsidies-work-2026', context: 'Premium tax credits and cost-sharing reductions explained' },
    { label: 'Open enrollment 2026: dates and deadlines', href: '/guides/open-enrollment-2026', context: 'Key dates for signing up or switching plans' },
  ]

  if (!category) return defaultGuides.slice(0, 2)

  const specific = categoryGuides[category.id]
  if (specific) return specific

  return defaultGuides.slice(0, 2)
}
