// NOTE: No name/NPN on this page — generic byline only
import { readFile } from 'fs/promises'
import path from 'path'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import siteConfig from '@/data/config/config.json'
import {
  searchFormulary,
  getIssuerName,
  getPlanById,
  getTopIssuerIds,
  getIssuerStateMap,
  getDrugBaseline,
} from '@/lib/data-loader'
import type { FormularyDrug } from '@/lib/types'
import {
  buildFormularyTripleSchema,
  buildBreadcrumbSchema,
} from '@/lib/schema-markup'
import { getRelatedEntities } from '@/lib/entity-linker'
import SchemaScript from '@/components/SchemaScript'
import EntityLinkCard from '@/components/EntityLinkCard'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import { generateFormularyContent } from '@/lib/content-templates'
import { generateStateInsights } from '@/lib/formulary-insights'
import {
  buildNarrativeData,
  detectNarrativePattern,
  generateQuickAnswer,
  generateInsightBody,
  generateCostContext,
  generateLocalizedSections,
  getConditionalBlocks,
  getInsightHeading,
} from '@/lib/state-narrative'
import type { NarrativePattern, NarrativeData } from '@/lib/state-narrative'
import { classifyDrug } from '@/lib/drug-archetype'
import ProcessBar from '@/components/ProcessBar'
import AeoBlock from '@/components/AeoBlock'
import EvidenceBlock from '@/components/EvidenceBlock'
import CostBlock from '@/components/CostBlock'
import PlanRulesBlock from '@/components/PlanRulesBlock'
import TimelineSteps from '@/components/TimelineSteps'
import SavingsRows from '@/components/SavingsRows'
import LimitsBlock from '@/components/LimitsBlock'
import AboutBlock from '@/components/AboutBlock'
import {
  humanizeTier,
  humanizeTiers,
  humanizeTierForDrug,
  humanizeTiersForDrug,
  summarizeTierPlacement,
  getDominantTierGroup,
  getDominantTierGroupForDrug,
  interpretCoverage,
} from '@/lib/formulary-helpers'
import {
  getDrugCategory,
  getRelatedDrugs,
  getComparisonLinks,
  getEducationalLinks,
  getStatePlanLinks,
  getRelatedGuides,
} from '@/lib/drug-linking'
import allStatesData from '@/data/config/all-states.json'
import { stateCodeToSlug, stateSlugToCode } from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

// ---------------------------------------------------------------------------
// Drug class detection for editorial variation
// ---------------------------------------------------------------------------

const INJECTABLE_GLP1_DRUGS = new Set([
  'ozempic', 'mounjaro', 'trulicity', 'victoza', 'saxenda', 'wegovy', 'zepbound',
])
const ORAL_GLP1_MAP: Record<string, { name: string; slug: string }> = {
  'ozempic': { name: 'Rybelsus', slug: 'rybelsus' },
  'wegovy': { name: 'Rybelsus', slug: 'rybelsus' },
}
const COMMON_GENERICS = new Set([
  'metformin', 'atorvastatin', 'lisinopril', 'amlodipine', 'omeprazole',
  'levothyroxine', 'metoprolol', 'losartan', 'gabapentin', 'sertraline',
  'escitalopram', 'rosuvastatin', 'pantoprazole', 'duloxetine', 'furosemide',
  'hydrochlorothiazide', 'atenolol', 'bupropion', 'fluoxetine', 'warfarin',
  'montelukast', 'albuterol', 'trazodone', 'citalopram', 'cyclobenzaprine',
  'doxycycline', 'meloxicam', 'naproxen', 'prednisone', 'tramadol',
  'venlafaxine', 'amoxicillin', 'azithromycin', 'ciprofloxacin', 'clopidogrel',
  'sildenafil', 'tadalafil', 'finasteride', 'tamsulosin', 'famotidine',
])
// ---------------------------------------------------------------------------
// Generic (nonproprietary) name mapping for Drug schema nonProprietaryName
// ---------------------------------------------------------------------------

const GENERIC_NAME_MAP: Record<string, string> = {
  'ozempic': 'semaglutide',
  'wegovy': 'semaglutide',
  'rybelsus': 'semaglutide',
  'mounjaro': 'tirzepatide',
  'zepbound': 'tirzepatide',
  'trulicity': 'dulaglutide',
  'victoza': 'liraglutide',
  'saxenda': 'liraglutide',
  'metformin': 'metformin',
  'atorvastatin': 'atorvastatin',
  'lisinopril': 'lisinopril',
  'amlodipine': 'amlodipine',
  'omeprazole': 'omeprazole',
  'levothyroxine': 'levothyroxine',
  'metoprolol': 'metoprolol',
  'losartan': 'losartan',
  'gabapentin': 'gabapentin',
  'sertraline': 'sertraline',
  'escitalopram': 'escitalopram',
  'rosuvastatin': 'rosuvastatin',
  'pantoprazole': 'pantoprazole',
  'duloxetine': 'duloxetine',
  'furosemide': 'furosemide',
  'hydrochlorothiazide': 'hydrochlorothiazide',
  'atenolol': 'atenolol',
  'bupropion': 'bupropion',
  'fluoxetine': 'fluoxetine',
  'warfarin': 'warfarin',
  'montelukast': 'montelukast',
  'albuterol': 'albuterol',
  'trazodone': 'trazodone',
  'citalopram': 'citalopram',
  'cyclobenzaprine': 'cyclobenzaprine',
  'doxycycline': 'doxycycline',
  'meloxicam': 'meloxicam',
  'naproxen': 'naproxen',
  'prednisone': 'prednisone',
  'tramadol': 'tramadol',
  'venlafaxine': 'venlafaxine',
  'amoxicillin': 'amoxicillin',
  'azithromycin': 'azithromycin',
  'ciprofloxacin': 'ciprofloxacin',
  'clopidogrel': 'clopidogrel',
  'sildenafil': 'sildenafil',
  'tadalafil': 'tadalafil',
  'finasteride': 'finasteride',
  'tamsulosin': 'tamsulosin',
  'famotidine': 'famotidine',
}

const GLP1_MANUFACTURER: Record<string, string> = {
  'ozempic': 'Novo Nordisk', 'wegovy': 'Novo Nordisk', 'rybelsus': 'Novo Nordisk',
  'mounjaro': 'Eli Lilly', 'zepbound': 'Eli Lilly',
  'trulicity': 'Eli Lilly', 'victoza': 'Novo Nordisk', 'saxenda': 'Novo Nordisk',
}

type DrugClassType = 'injectable-glp1' | 'generic' | 'brand-preferred' | 'other'

function detectDrugClass(drugSlug: string, dominantGroup: string): DrugClassType {
  const key = drugSlug.toLowerCase().replace(/-/g, ' ')
  if (INJECTABLE_GLP1_DRUGS.has(key)) return 'injectable-glp1'
  if (COMMON_GENERICS.has(key) || dominantGroup === 'generic') return 'generic'
  if (dominantGroup === 'preferred-brand') return 'brand-preferred'
  return 'other'
}

// ---------------------------------------------------------------------------
// Clinical data lookup (top-50 common drugs)
// Information Gain: tier context per alternative, unique to this dataset
// ---------------------------------------------------------------------------

interface DrugAlt {
  name: string
  tier: string
  desc: string
}

interface ClinicalData {
  drugClass: string
  indications: string
  genericAlts: DrugAlt[]
  therapeuticAlts: DrugAlt[]
  otcAlts: DrugAlt[]
}

const DRUG_CLINICAL_DATA: Record<string, ClinicalData> = {
  'metformin': {
    drugClass: 'Biguanide (Type 2 diabetes)',
    indications: 'First-line treatment for type 2 diabetes. Also used off-label for PCOS and prediabetes prevention.',
    genericAlts: [{ name: 'Metformin ER', tier: 'Tier 1 Generic', desc: 'Extended-release — same drug, slower absorption, fewer GI side effects' }],
    therapeuticAlts: [
      { name: 'Glipizide', tier: 'Tier 1 Generic', desc: 'Sulfonylurea — lowers blood sugar via different pathway' },
      { name: 'Sitagliptin (Januvia)', tier: 'Tier 3 Non-Preferred', desc: 'DPP-4 inhibitor — often added when metformin alone is insufficient' },
    ],
    otcAlts: [],
  },
  'atorvastatin': {
    drugClass: 'HMG-CoA reductase inhibitor (High-intensity Statin)',
    indications: 'Reduces LDL cholesterol and cardiovascular event risk. First-line statin for people at high cardiovascular risk.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Rosuvastatin', tier: 'Tier 1 Generic', desc: 'High-intensity statin — generic available since 2021, equivalent efficacy' },
      { name: 'Simvastatin', tier: 'Tier 1 Generic', desc: 'Moderate-intensity statin — lowest cost, longest track record' },
    ],
    otcAlts: [],
  },
  'lisinopril': {
    drugClass: 'ACE Inhibitor (Hypertension / Heart failure)',
    indications: 'First-line for hypertension, heart failure, and kidney protection in people with diabetes.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Losartan', tier: 'Tier 1 Generic', desc: 'ARB — preferred when ACE inhibitor causes dry cough' },
      { name: 'Amlodipine', tier: 'Tier 1 Generic', desc: 'Calcium channel blocker — different class, often combined' },
    ],
    otcAlts: [],
  },
  'amlodipine': {
    drugClass: 'Calcium Channel Blocker (Hypertension / Angina)',
    indications: 'Treats hypertension and stable angina. One of the most-prescribed blood pressure medications globally.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Lisinopril', tier: 'Tier 1 Generic', desc: 'ACE inhibitor — first-line for BP with heart protection benefit' },
      { name: 'Metoprolol', tier: 'Tier 1 Generic', desc: 'Beta blocker — often combined with amlodipine for angina' },
    ],
    otcAlts: [],
  },
  'omeprazole': {
    drugClass: 'Proton Pump Inhibitor (PPI)',
    indications: 'Treats GERD, heartburn, peptic ulcers, and H. pylori infection.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Pantoprazole', tier: 'Tier 1 Generic', desc: 'PPI — same class, Tier 1 on most Marketplace plans, fewer drug interactions' },
      { name: 'Esomeprazole (Nexium)', tier: 'Tier 3 Non-Preferred', desc: 'Brand PPI — same mechanism, significantly higher cost' },
    ],
    otcAlts: [{ name: 'Prilosec OTC (omeprazole 20mg)', tier: 'OTC — no Rx needed', desc: 'Same active ingredient for 14-day heartburn courses' }],
  },
  'levothyroxine': {
    drugClass: 'Thyroid hormone replacement',
    indications: 'First-line treatment for hypothyroidism. Taken daily on an empty stomach.',
    genericAlts: [{ name: 'Levothyroxine generic', tier: 'Tier 1 Generic', desc: 'Identical active ingredient — same drug at generic pricing' }],
    therapeuticAlts: [
      { name: 'Synthroid', tier: 'Tier 2 Preferred Brand', desc: 'Brand-name version — some people prefer for consistency' },
      { name: 'Liothyronine (T3)', tier: 'Tier 1 Generic', desc: 'Added when T4-only therapy is insufficient' },
    ],
    otcAlts: [],
  },
  'metoprolol': {
    drugClass: 'Selective Beta-1 Blocker (Hypertension / Heart)',
    indications: 'Treats hypertension, heart failure, angina, and certain arrhythmias.',
    genericAlts: [
      { name: 'Metoprolol Tartrate (IR)', tier: 'Tier 1 Generic', desc: 'Immediate-release — taken twice daily' },
      { name: 'Metoprolol Succinate ER', tier: 'Tier 1 Generic', desc: 'Extended-release — once-daily dosing, preferred for heart failure' },
    ],
    therapeuticAlts: [
      { name: 'Atenolol', tier: 'Tier 1 Generic', desc: 'Beta blocker — once daily, lower cost, less preferred by guidelines' },
      { name: 'Carvedilol', tier: 'Tier 1 Generic', desc: 'Non-selective beta blocker — preferred in heart failure with reduced EF' },
    ],
    otcAlts: [],
  },
  'gabapentin': {
    drugClass: 'Anticonvulsant / Neuropathic pain agent',
    indications: 'Treats neuropathic pain, postherpetic neuralgia, and partial seizures. Widely used off-label for anxiety.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Pregabalin (Lyrica)', tier: 'Tier 3 Non-Preferred', desc: 'Related drug — schedule V controlled, similar mechanism, higher cost' },
      { name: 'Duloxetine (Cymbalta)', tier: 'Tier 2 Preferred', desc: 'SNRI with FDA indication for neuropathic pain' },
    ],
    otcAlts: [],
  },
  'sertraline': {
    drugClass: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
    indications: 'First-line for depression, anxiety disorders, OCD, PTSD, and panic disorder.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Escitalopram', tier: 'Tier 1 Generic', desc: 'SSRI — often better tolerated, fewer drug interactions, Tier 1 on most plans' },
      { name: 'Fluoxetine (Prozac)', tier: 'Tier 1 Generic', desc: 'SSRI — longest half-life, best choice for adherence issues' },
      { name: 'Bupropion', tier: 'Tier 1 Generic', desc: 'NDRI — different mechanism, also for smoking cessation, no sexual side effects' },
    ],
    otcAlts: [],
  },
  'losartan': {
    drugClass: 'Angiotensin II Receptor Blocker (ARB)',
    indications: 'Treats hypertension and reduces kidney disease progression in people with diabetes. Alternative when ACE inhibitor causes cough.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Lisinopril', tier: 'Tier 1 Generic', desc: 'ACE inhibitor — first-line for BP with heart protection benefit' },
      { name: 'Valsartan (Diovan)', tier: 'Tier 2 Preferred', desc: 'ARB — same class, generic available, often used in heart failure' },
    ],
    otcAlts: [],
  },
  'albuterol': {
    drugClass: 'Short-Acting Beta-2 Agonist (SABA) — Rescue inhaler',
    indications: 'Relieves acute bronchospasm in asthma and COPD. Rescue medication — not for daily prevention.',
    genericAlts: [{ name: 'Albuterol HFA generic', tier: 'Tier 1 Generic', desc: 'FDA-approved generics now available at Tier 1 pricing' }],
    therapeuticAlts: [
      { name: 'Levalbuterol (Xopenex)', tier: 'Tier 3 Non-Preferred', desc: 'Pure R-isomer — fewer tremor side effects, significantly higher cost' },
    ],
    otcAlts: [],
  },
  'montelukast': {
    drugClass: 'Leukotriene Receptor Antagonist',
    indications: 'Long-term asthma control and seasonal allergic rhinitis. Not a rescue medication.',
    genericAlts: [{ name: 'Montelukast generic', tier: 'Tier 1 Generic', desc: 'Generic available since 2012 — Tier 1 on virtually all Marketplace plans' }],
    therapeuticAlts: [
      { name: 'Fluticasone nasal spray', tier: 'Tier 1 Generic', desc: 'Preferred for allergic rhinitis per current guidelines' },
      { name: 'Inhaled corticosteroid', tier: 'Tier 1–2 Generic', desc: 'Preferred controller for asthma per NAEPP guidelines' },
    ],
    otcAlts: [{ name: 'Cetirizine (Zyrtec)', tier: 'OTC — no Rx needed', desc: 'Antihistamine for allergy symptoms — different mechanism' }],
  },
  'pantoprazole': {
    drugClass: 'Proton Pump Inhibitor (PPI)',
    indications: 'Treats GERD, erosive esophagitis, and Zollinger-Ellison syndrome. Fewer drug interactions than omeprazole.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Omeprazole', tier: 'Tier 1 Generic', desc: 'PPI — equivalent efficacy, also available OTC' },
      { name: 'Esomeprazole (Nexium)', tier: 'Tier 3 Non-Preferred', desc: 'Brand PPI — higher cost, similar effectiveness' },
    ],
    otcAlts: [{ name: 'Omeprazole OTC (Prilosec)', tier: 'OTC — no Rx needed', desc: '14-day course for occasional GERD' }],
  },
  'escitalopram': {
    drugClass: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
    indications: 'First-line for major depression and generalized anxiety disorder. Well-tolerated with minimal drug interactions.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Sertraline', tier: 'Tier 1 Generic', desc: 'SSRI — equally effective, also first-line choice' },
      { name: 'Fluoxetine (Prozac)', tier: 'Tier 1 Generic', desc: 'SSRI — longest half-life, weekly dosing available' },
    ],
    otcAlts: [],
  },
  'rosuvastatin': {
    drugClass: 'HMG-CoA reductase inhibitor (High-intensity Statin)',
    indications: 'High-intensity LDL reduction and cardiovascular risk reduction. Generic available since 2021.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Atorvastatin', tier: 'Tier 1 Generic', desc: 'High-intensity statin — generic longest established, equivalent efficacy' },
    ],
    otcAlts: [],
  },
  'duloxetine': {
    drugClass: 'Serotonin-Norepinephrine Reuptake Inhibitor (SNRI)',
    indications: 'Treats depression, generalized anxiety, diabetic neuropathy, fibromyalgia, and chronic musculoskeletal pain.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Venlafaxine (Effexor)', tier: 'Tier 1 Generic', desc: 'SNRI — similar mechanism, lower cost generic widely available' },
      { name: 'Sertraline', tier: 'Tier 1 Generic', desc: 'SSRI — when pain indication is not primary concern' },
    ],
    otcAlts: [],
  },
  'furosemide': {
    drugClass: 'Loop Diuretic',
    indications: 'Treats fluid retention from heart failure, cirrhosis, and chronic kidney disease.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Torsemide', tier: 'Tier 1 Generic', desc: 'Loop diuretic — better oral bioavailability, once-daily dosing' },
      { name: 'Hydrochlorothiazide', tier: 'Tier 1 Generic', desc: 'Thiazide diuretic — milder, used for blood pressure control' },
    ],
    otcAlts: [],
  },
  'hydrochlorothiazide': {
    drugClass: 'Thiazide Diuretic (Hypertension)',
    indications: 'First-line for hypertension, often combined with ACE inhibitors or ARBs.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Chlorthalidone', tier: 'Tier 1 Generic', desc: 'Longer-acting thiazide — preferred over HCTZ by current guidelines' },
      { name: 'Lisinopril', tier: 'Tier 1 Generic', desc: 'ACE inhibitor — often prescribed alongside HCTZ as combination therapy' },
    ],
    otcAlts: [],
  },
  'atenolol': {
    drugClass: 'Selective Beta-1 Blocker (Hypertension)',
    indications: 'Treats hypertension and angina. Less preferred than metoprolol in current cardiology guidelines.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Metoprolol Succinate', tier: 'Tier 1 Generic', desc: 'Beta blocker — preferred per current guidelines for most indications' },
      { name: 'Lisinopril', tier: 'Tier 1 Generic', desc: 'ACE inhibitor — preferred first-line for uncomplicated hypertension' },
    ],
    otcAlts: [],
  },
  'bupropion': {
    drugClass: 'Norepinephrine-Dopamine Reuptake Inhibitor (NDRI)',
    indications: 'Treats depression and seasonal affective disorder. Also FDA-approved for smoking cessation (Zyban).',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Sertraline', tier: 'Tier 1 Generic', desc: 'SSRI — often preferred when sexual side effects are a concern' },
      { name: 'Escitalopram', tier: 'Tier 1 Generic', desc: 'SSRI — fewer drug interactions' },
    ],
    otcAlts: [],
  },
  'fluoxetine': {
    drugClass: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
    indications: 'Treats depression, OCD, panic disorder, and bulimia. Longest half-life of all SSRIs — less sensitive to missed doses.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Sertraline', tier: 'Tier 1 Generic', desc: 'SSRI — preferred for anxiety and PTSD' },
      { name: 'Escitalopram', tier: 'Tier 1 Generic', desc: 'SSRI — best-tolerated, fewest drug interactions' },
    ],
    otcAlts: [],
  },
  'warfarin': {
    drugClass: 'Vitamin K Antagonist (Anticoagulant)',
    indications: 'Prevents blood clots in atrial fibrillation, deep vein thrombosis, pulmonary embolism, and mechanical heart valves.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Apixaban (Eliquis)', tier: 'Tier 3 Non-Preferred', desc: 'DOAC — no INR monitoring needed, lower bleeding risk, much higher cost' },
      { name: 'Rivaroxaban (Xarelto)', tier: 'Tier 3 Non-Preferred', desc: 'DOAC — once-daily dosing, no monitoring, high cost' },
    ],
    otcAlts: [],
  },
}

const VALID_STATE_CODES = new Set(
  (allStatesData.states as { abbr: string }[]).map((s) => s.abbr.toLowerCase())
)

/**
 * Resolves a route param to state info. Supports both:
 * - 2-letter abbreviation (e.g. "tx") — triggers 301 redirect to slug
 * - Full state slug (e.g. "texas") — canonical format
 * Returns null if param is not a state.
 */
function resolveStateParam(param: string): { stateCode: string; stateSlug: string; stateName: string; needsRedirect: boolean } | null {
  // Check abbreviation first (e.g. "tx")
  if (param.length === 2 && VALID_STATE_CODES.has(param.toLowerCase())) {
    const code = param.toUpperCase()
    const slug = stateCodeToSlug(code)
    const name = getStateNameFromAbbr(param)
    return { stateCode: code, stateSlug: slug, stateName: name, needsRedirect: true }
  }
  // Check full state slug (e.g. "texas", "north-carolina")
  const code = stateSlugToCode(param)
  if (code) {
    const name = getStateNameFromAbbr(code)
    return { stateCode: code, stateSlug: param.toLowerCase(), stateName: name, needsRedirect: false }
  }
  return null
}

// Keep for backward compat in generateMetadata (where we can't redirect)
function isStateCode(param: string): boolean {
  return param.length === 2 && VALID_STATE_CODES.has(param.toLowerCase())
}

function isStateParam(param: string): boolean {
  return resolveStateParam(param) !== null
}

function getStateNameFromAbbr(abbr: string): string {
  const found = (allStatesData.states as { name: string; abbr: string }[]).find(
    (s) => s.abbr === abbr.toUpperCase()
  )
  return found?.name ?? abbr.toUpperCase()
}


interface Props {
  params: { issuer: string; drug_name: string }
}

// ISR — priority seed of top issuers × top drugs pre-built; remaining pages built on first request
export const revalidate = 86400

const PRIORITY_DRUGS = [
  'metformin', 'lisinopril', 'atorvastatin', 'amlodipine', 'omeprazole',
  'levothyroxine', 'albuterol', 'losartan', 'gabapentin', 'hydrochlorothiazide',
  'sertraline', 'metoprolol', 'montelukast', 'escitalopram', 'rosuvastatin',
  'bupropion', 'pantoprazole', 'duloxetine', 'furosemide', 'trazodone',
  'atenolol', 'citalopram', 'cyclobenzaprine', 'doxycycline', 'fluoxetine',
  'meloxicam', 'naproxen', 'prednisone', 'tramadol', 'venlafaxine',
  'amoxicillin', 'azithromycin', 'ciprofloxacin', 'warfarin', 'clopidogrel',
  'sildenafil', 'tadalafil', 'finasteride', 'tamsulosin', 'quetiapine',
  'aripiprazole', 'risperidone', 'methylphenidate', 'amphetamine-salts',
  'ondansetron', 'famotidine', 'esomeprazole',
]

export async function generateStaticParams() {
  const topIssuers = getTopIssuerIds(50)
  const params = []
  for (const issuer of topIssuers) {
    for (const drug of PRIORITY_DRUGS) {
      params.push({ issuer, drug_name: drug })
    }
  }
  return params // ~50 × 47 = ~2,350 pre-built pages
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (decodeURIComponent(params.drug_name).toLowerCase() === 'all') {
    return { title: 'Drug Formulary Lookup' }
  }

  const drugDisplay = decodeURIComponent(params.drug_name).replace(/-/g, ' ')
  const stateInfo = resolveStateParam(params.issuer)
  const isState = stateInfo !== null
  const stateName = stateInfo?.stateName
  const canonicalIssuer = stateInfo ? stateInfo.stateSlug : params.issuer

  const stateConf = stateInfo
    ? (allStatesData.states as { abbr: string; name: string; exchange: string; ownExchange: boolean }[])
        .find(s => s.abbr === stateInfo.stateCode)
    : undefined

  const issuerName = isState
    ? `Plans in ${stateName}`
    : params.issuer !== 'all'
      ? (getIssuerName(params.issuer) ?? params.issuer)
      : 'All Plans'

  const title = isState
    ? `${titleCase(drugDisplay)} in ${stateName}: Coverage, Cost, and Prior Approval on ${PLAN_YEAR} Health Plans | HealthInsuranceRenew`
    : `${titleCase(drugDisplay)} — ${issuerName}: Coverage, Cost, and Prior Approval on ${PLAN_YEAR} Health Plans | HealthInsuranceRenew`
  const description = isState
    ? stateConf?.ownExchange
      ? `${titleCase(drugDisplay)} is covered by most ${stateName} health plans for ${PLAN_YEAR}. ${stateName} uses ${stateConf.exchange} for enrollment. See coverage details.`
      : `${titleCase(drugDisplay)} is covered by most ${stateName} health plans for ${PLAN_YEAR}. Prior authorization typically required. Typical copay after deductible: see plan details.`
    : `${titleCase(drugDisplay)} is covered by most ${issuerName} health plans for ${PLAN_YEAR}. Prior authorization typically required. Typical copay after deductible: see plan details.`
  const canonical = `${SITE_URL}/${canonicalIssuer}/${params.drug_name}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: 'HealthInsuranceRenew',
      locale: 'en_US',
      authors: ['HealthInsuranceRenew Editorial Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// State drug summary — data/formulary-summaries/{state}/{drug}.json
// ---------------------------------------------------------------------------

interface FormularyStateDrugSummaryCarrier {
  issuer_id: string
  name: string
  plan_count: number
  tier_placement: string
  pa_required: boolean
  quantity_limits: boolean
  step_therapy: boolean
  data_record_count: number
}

interface FormularyStateDrugSummary {
  state_code: string
  drug_slug: string
  plan_count: number
  carriers: FormularyStateDrugSummaryCarrier[]
  cost_range_after_deductible: { low: number; high: number } | null
  cost_range_before_deductible: { low: number; high: number } | null
  data_sources: string[]
}

function summaryDominantTier(s: FormularyStateDrugSummary): string {
  const counts: Record<string, number> = {}
  for (const c of s.carriers) counts[c.tier_placement] = (counts[c.tier_placement] ?? 0) + c.plan_count
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'preferred-brand'
}
const summaryPaMajority  = (s: FormularyStateDrugSummary) => s.carriers.filter(c => c.pa_required).length  >= s.carriers.length / 2
const summaryStMajority  = (s: FormularyStateDrugSummary) => s.carriers.filter(c => c.step_therapy).length >= s.carriers.length / 2
const summaryQlMajority  = (s: FormularyStateDrugSummary) => s.carriers.filter(c => c.quantity_limits).length >= s.carriers.length / 2
const summaryPaAll       = (s: FormularyStateDrugSummary) => s.carriers.every(c => c.pa_required)
const summaryPaCount     = (s: FormularyStateDrugSummary) => s.carriers.filter(c => c.pa_required).length

// V79 voice: spell out small integers (one–twenty), digits beyond.
const NUMBER_WORDS = [
  'zero','one','two','three','four','five','six','seven','eight','nine',
  'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen',
  'seventeen','eighteen','nineteen','twenty',
]
function spellNumber(n: number): string {
  return n >= 0 && n <= 20 ? NUMBER_WORDS[n] : String(n)
}

// Render counts with US thousands separators: 1115 → "1,115".
const NUMBER_FORMAT = new Intl.NumberFormat('en-US')
function fmtN(n: number): string {
  return NUMBER_FORMAT.format(n)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function FormularyDrugPage({ params }: Props) {
  const drugSlug = decodeURIComponent(params.drug_name)
  const drugDisplay = drugSlug.replace(/-/g, ' ')

  // Guard: /formulary/[state]/all is not a drug search
  if (drugSlug.toLowerCase() === 'all') {
    redirect('/drugs')
  }

  // --- State slug detection + redirect from abbreviation to canonical slug ---
  const stateInfo = resolveStateParam(params.issuer)
  if (stateInfo?.needsRedirect) {
    redirect(`/${stateInfo.stateSlug}/${params.drug_name}`)
  }

  const issuer = params.issuer
  const isState = stateInfo !== null
  const stateCode = stateInfo?.stateCode
  const stateSlug = stateInfo?.stateSlug
  const isSpecificIssuer = !isState && issuer !== 'all'

  // Full state config for exchange info
  const stateConfig = stateInfo
    ? (allStatesData.states as {
        abbr: string; name: string; exchange: string;
        exchangeUrl: string; ownExchange: boolean
      }[]).find(s => s.abbr === stateInfo.stateCode)
    : undefined
  const stateName = stateInfo?.stateName ?? (stateConfig?.name)
  const isSBMState = stateConfig?.ownExchange ?? false

  // --- Load drug results ---
  let results = await searchFormulary({
    drug_name: drugDisplay,
    state_code: stateCode,
    issuer_id: isSpecificIssuer ? issuer : undefined,
  })

  // 404 if no results for a specific issuer+drug combo
  if (results.length === 0 && isSpecificIssuer) {
    notFound()
  }

  // --- Load all issuers carrying this drug (for cross-linking) ---
  const allResults = await searchFormulary({
    drug_name: drugDisplay,
    state_code: stateCode,
  })

  // --- Load state drug summary when issuer is a state ---
  let stateSummary: FormularyStateDrugSummary | null = null
  if (isState && stateCode) {
    try {
      const fp = path.join(process.cwd(), 'data/formulary-summaries', stateCode, `${drugSlug}.json`)
      stateSummary = JSON.parse(await readFile(fp, 'utf-8')) as FormularyStateDrugSummary
    } catch { /* summary not available for this state/drug */ }
  }

  // For SBM states with no FFE data, synthesize results from state summary
  if (isState && results.length === 0 && stateSummary) {
    const synthTier = summaryDominantTier(stateSummary)
    const synthPa   = summaryPaMajority(stateSummary)
    const synthSt   = summaryStMajority(stateSummary)
    const synthQl   = summaryQlMajority(stateSummary)
    results = Array.from({ length: stateSummary.plan_count }, () => ({
      drug_name: drugDisplay,
      drug_tier: synthTier,
      prior_authorization: synthPa,
      step_therapy: synthSt,
      quantity_limit: synthQl,
    } as FormularyDrug))
  }

  // ── State with no data and no summary — show explanation page ──
  if (isState && results.length === 0) {
    return <SBMExplanationPage
      issuer={stateSlug ?? issuer}
      stateSlug={stateSlug ?? issuer}
      drugSlug={drugSlug}
      drugDisplay={drugDisplay}
      stateName={stateName!}
      isSBMState={isSBMState}
      exchangeName={stateConfig?.exchange ?? `${stateName} Marketplace`}
      exchangeUrl={stateConfig?.exchangeUrl ?? '/contact'}
      allResults={allResults}
    />
  }

  const issuerName = isState
    ? `Plans in ${stateName}`
    : isSpecificIssuer
      ? (results[0]?.issuer_name ?? getIssuerName(issuer) ?? `Issuer ${issuer}`)
      : 'All Plans'

  // --- Derived coverage details ---
  const rawTiers = results.map((r) => r.drug_tier).filter(Boolean) as string[]
  const tiers = [...new Set(rawTiers)]
  const humanTiers = humanizeTiersForDrug(rawTiers, drugDisplay)
  const dominantGroup = getDominantTierGroupForDrug(rawTiers, drugDisplay)
  const dominantHumanTier = humanizeTierForDrug(
    results.find(r => getDominantTierGroupForDrug([r.drug_tier], drugDisplay) === dominantGroup)?.drug_tier,
    drugDisplay,
  )

  const hasPriorAuth = stateSummary ? summaryPaMajority(stateSummary) : results.some((r) => r.prior_authorization)
  const paAll = stateSummary ? summaryPaAll(stateSummary) : false
  const paMajorityCount = stateSummary ? summaryPaCount(stateSummary) : 0
  const priorAuthCount = results.filter((r) => r.prior_authorization).length
  const priorAuthPct = results.length > 0 ? (priorAuthCount / results.length) * 100 : 0
  const hasStepTherapy = stateSummary ? summaryStMajority(stateSummary) : results.some((r) => r.step_therapy)
  const stepTherapyCount = results.filter((r) => r.step_therapy).length
  const hasQuantityLimit = stateSummary ? summaryQlMajority(stateSummary) : results.some((r) => r.quantity_limit)
  const quantityLimitCount = results.filter((r) => r.quantity_limit).length
  const displayPlanCount = stateSummary ? stateSummary.plan_count : results.length
  const isGenericAvailable = tiers.some((t) => t.toUpperCase().includes('GENERIC'))
  const rxnormId = results.find((r) => r.rxnorm_id)?.rxnorm_id

  // --- Other issuers covering this drug ---
  const otherIssuers = getUniqueIssuers(allResults, stateCode).filter((i) => i.id !== issuer)

  const canonicalIssuerParam = stateSlug ?? issuer
  const breadcrumbItems = isState
    ? [
        { name: 'Home', url: SITE_URL },
        { name: 'Drug Coverage', url: `${SITE_URL}/drugs` },
        { name: stateName!, url: `${SITE_URL}/${canonicalIssuerParam}/health-insurance-plans` },
        { name: titleCase(drugDisplay), url: `${SITE_URL}/${canonicalIssuerParam}/${drugSlug}` },
      ]
    : [
        { name: 'Home', url: SITE_URL },
        { name: 'Drug Coverage', url: `${SITE_URL}/drugs` },
        { name: issuerName, url: `${SITE_URL}/${canonicalIssuerParam}/all` },
        { name: titleCase(drugDisplay), url: `${SITE_URL}/${canonicalIssuerParam}/${drugSlug}` },
      ]
  // Plain-English tier label for interpretive sentences.
  // Callers append " tier" — never include the word "tier" in the returned string,
  // and strip a trailing " tier" from any fallback label so "tier tier" cannot render.
  const tierPlain = (() => {
    const g = dominantGroup
    if (g === 'generic') return 'low-cost generic'
    if (g === 'preferred-brand') return 'lower-cost brand'
    if (g === 'non-preferred-brand') return 'higher-cost brand'
    if (g === 'specialty') return 'highest-cost'
    return dominantHumanTier.shortLabel.toLowerCase().replace(/\s*tier\s*$/, '')
  })()

  // Before-deductible cost range — varies by tier group (NOT the same as copay)
  const beforeDeductibleRange = (() => {
    const g = dominantGroup
    if (g === 'generic') return '$15–$80'
    if (g === 'preferred-brand') return '$200–$450'
    if (g === 'non-preferred-brand') return '$400–$650'
    if (g === 'specialty') return '$800–$2,000+'
    if (g === 'insulin-ira') return '$35'
    if (g === 'preventive') return '$0'
    return '$200–$650'
  })()

  // Cost range overrides from state drug summary (Priority 1 source)
  const displayBeforeDeductibleRange = stateSummary?.cost_range_before_deductible
    ? `$${stateSummary.cost_range_before_deductible.low}–$${stateSummary.cost_range_before_deductible.high}`
    : beforeDeductibleRange
  const displayAfterDeductibleRange = stateSummary?.cost_range_after_deductible
    ? `$${stateSummary.cost_range_after_deductible.low}–$${stateSummary.cost_range_after_deductible.high}`
    : dominantHumanTier.costRange

  // ── FAQ data ────────────────────────────────────────────────────────────
  const tierSummaryText = summarizeTierPlacement(rawTiers, titleCase(drugDisplay))
  const stateOrIssuerLabel = isState ? `in ${stateName}` : `from ${issuerName}`
  const stateOrNational = isState ? ` in ${stateName}` : ''

  const formularyFaqs = [
    {
      question: `Is ${titleCase(drugDisplay)} covered by ${isState ? `${stateName} health plans` : 'Marketplace health plans'} in ${PLAN_YEAR}?`,
      answer: (isState && stateSummary && stateName)
        ? `Yes. All ${spellNumber(stateSummary.carriers.length)} insurance companies offering individual marketplace plans in ${stateName} for ${PLAN_YEAR} list ${titleCase(drugDisplay)} as a covered drug — every health plan in the state’s marketplace. Coverage terms and tiers still vary by plan, so confirm your specific plan’s drug list before you enroll.`
        : results.length === 0
          ? `${titleCase(drugDisplay)} was not found on ${isState ? stateName : 'Marketplace'} plan drug lists in the ${PLAN_YEAR} dataset. You may be able to request a coverage exception if your doctor demonstrates medical necessity.`
          : results.length > 50
          ? `Yes \u2014 ${titleCase(drugDisplay)} appeared on ${fmtN(results.length)} of the ${isState ? stateName : 'Marketplace'} health plans we reviewed for ${PLAN_YEAR}. ${dominantHumanTier.costHint}. Your cost depends on your plan\u2019s tier and deductible status.`
          : results.length >= 15
            ? `${titleCase(drugDisplay)} is covered by some but not all ${isState ? stateName : 'Marketplace'} plans \u2014 ${fmtN(results.length)} in our review for ${PLAN_YEAR}. If your plan does not include it, you may be able to request a coverage exception.`
            : `${titleCase(drugDisplay)} appeared on only ${fmtN(results.length)} of the ${isState ? stateName : 'Marketplace'} plans we reviewed for ${PLAN_YEAR}. Coverage is limited \u2014 check your specific plan\u2019s drug list before enrolling, and ask about alternatives.`,
    },
    {
      question: `How much will ${titleCase(drugDisplay)} cost me before I meet my deductible${isState ? ` on a ${stateName} plan` : ''}?`,
      answer: humanTiers.length > 0 && isState
        ? `In ${stateName}, most ${results.length === 1 ? 'plans' : `of the ${results.length} plans`} covering ${titleCase(drugDisplay)} place it on a ${dominantHumanTier.shortLabel.toLowerCase()} tier. Before your deductible is met, you typically pay the plan's full price — roughly ${displayBeforeDeductibleRange} per month for ${titleCase(drugDisplay)}. After your deductible, your copay drops to around ${displayAfterDeductibleRange} per month. A 90-day mail-order supply often costs about 67% of three 30-day fills. Check your Summary of Benefits and Coverage for exact numbers.`
        : humanTiers.length > 0
          ? `Before your deductible is met, you typically pay the plan's full price — not the listed copay. For ${titleCase(drugDisplay)}, that means roughly ${displayBeforeDeductibleRange} per month until your deductible is satisfied. After your deductible is met, your copay drops to around ${displayAfterDeductibleRange} per month on most plans. A 90-day mail-order supply often costs about 67% of three 30-day fills.`
          : `Cost depends on which tier your plan places ${titleCase(drugDisplay)} on and how your plan structures copays and coinsurance. Before your deductible is met, you typically pay the full amount the plan owes the pharmacy. Check your Summary of Benefits and Coverage for exact copay or coinsurance amounts.`,
    },
    {
      question: `Will I need approval from my insurance before picking up ${titleCase(drugDisplay)}?`,
      answer: hasPriorAuth
        ? (isState && stateSummary
          ? (paAll
            ? `You may not be able to get ${titleCase(drugDisplay)} right away. All ${stateSummary.carriers.length} ${stateName} insurance companies offering individual marketplace plans require approval before you can fill the prescription (called prior authorization). Your doctor handles the paperwork — submitting your diagnosis and clinical rationale directly to your plan. A few days is common, but some requests take longer. If the situation is urgent, ask whether a faster review is possible. If a request is denied, you can request a peer-to-peer review and then file a formal appeal.`
            : `${paMajorityCount} of ${stateSummary.carriers.length} insurance companies offering individual marketplace plans in ${stateName} for ${PLAN_YEAR} require approval before you can fill the prescription (called prior authorization). Your doctor handles the paperwork — submitting your diagnosis and clinical rationale directly to your plan. A few days is common, but some requests take longer. If the situation is urgent, ask whether a faster review is possible. If a request is denied, you can request a peer-to-peer review and then file a formal appeal.`)
          : `Yes, prior authorization is required for ${titleCase(drugDisplay)} on ${fmtN(priorAuthCount)} of ${fmtN(results.length)} plans${stateOrNational}. Your doctor submits a request with your diagnosis and clinical rationale. A few days is common, but some requests take longer. If the situation is urgent, ask whether a faster review is possible. If denied, you can request a peer-to-peer review and then a formal appeal.`)
        : `No, prior authorization is not required for ${titleCase(drugDisplay)} on most plans${stateOrNational}. Your doctor can prescribe it and your pharmacy can fill it without advance plan approval. Drug list requirements can change during the plan year — always confirm current coverage with your plan.`,
    },
    {
      question: `What tier does ${titleCase(drugDisplay)} fall under in ${isState ? stateName : 'Marketplace'} plans?`,
      answer: humanTiers.length > 0
        ? `${titleCase(drugDisplay)} is placed on a ${dominantHumanTier.shortLabel.toLowerCase()} tier on most plans${stateOrNational}. ${dominantHumanTier.costHint}. Tier placement can vary by plan — the same drug can be Tier 2 on one plan and Tier 4 on another, depending on PBM rebate contracts. This is one of the most important reasons to check the specific drug list of any plan you are considering.`
        : `Tier details for ${titleCase(drugDisplay)} vary across plans. Check your specific plan's drug list for tier placement. Drug lists are updated annually, so verify coverage each Open Enrollment period.`,
    },
    {
      question: `What if my ${isState ? stateName : 'Marketplace'} plan does not cover ${titleCase(drugDisplay)}?`,
      answer: isState && results.length > 0
        ? `Of the ${fmtN(results.length)} ${stateName} plans we reviewed, ${results.length === 1 ? 'the one plan covers' : 'all cover'} ${titleCase(drugDisplay)} — but if your specific plan does not, you have three paths. First, request a coverage exception: your doctor submits a letter of medical necessity. A few days is common for the response, but some requests take longer; if the situation is urgent, ask whether a faster review is possible. Second, if denied, file a formal internal appeal. Third, request an independent External Review — the decision is binding. You can also ask your doctor about a therapeutic alternative covered on a lower tier.`
        : `You have three main paths. First, request a coverage exception — your doctor submits a letter of medical necessity. A few days is common for the response, but some requests take longer; if the situation is urgent, ask whether a faster review is possible. Second, if denied, file a formal internal appeal. Third, request an independent External Review — the decision is binding on the plan. You can also ask your doctor about a covered therapeutic alternative.`,
    },
    {
      question: `Can I switch plans to get ${titleCase(drugDisplay)} covered${isState ? ` in ${stateName}` : ''}?`,
      answer: isState && results.length > 0
        ? `Yes, but timing matters. You can switch during Open Enrollment (November 1–January 15) or during a qualifying Special Enrollment Period. In ${stateName}, ${fmtN(results.length)} marketplace plan${results.length === 1 ? '' : 's'} include${results.length === 1 ? 's' : ''} ${titleCase(drugDisplay)} for ${PLAN_YEAR} — verify tier placement and approval rules on any plan before enrolling. If your current plan drops coverage or raises the tier mid-year, that may qualify you for a Special Enrollment Period.`
        : `Yes, but timing matters. You can switch during Open Enrollment (November 1–January 15) or during a qualifying Special Enrollment Period. If your current plan stops covering a drug mid-year or significantly raises its tier, that may qualify you for a Special Enrollment Period. Verify that your specific drug is covered on any new drug list before enrolling.`,
    },
    {
      question: `What is the difference between a coverage exception and prior approval for ${titleCase(drugDisplay)}${isState ? ` in ${stateName}` : ''}?`,
      answer: `Prior authorization (sometimes called 'prior auth') means your plan has to approve ${titleCase(drugDisplay)} before the pharmacy can fill it. A coverage exception is different — it is when you ask your plan to cover a drug that is not on its drug list, or to move it to a cheaper tier. Prior auth is about timing. A coverage exception is about whether it is covered at all.`,
    },
  ]
  // --- Triple schema (@graph) ---
  const canonical = `${SITE_URL}/${canonicalIssuerParam}/${drugSlug}`
  const stateConf = stateInfo
    ? (allStatesData.states as { abbr: string; name: string; exchange: string; ownExchange: boolean }[])
        .find(s => s.abbr === stateInfo.stateCode)
    : undefined
  const schemaTitle = isState
    ? `${titleCase(drugDisplay)} in ${stateName}: Coverage, Cost, and Prior Approval on ${PLAN_YEAR} Health Plans | HealthInsuranceRenew`
    : `${titleCase(drugDisplay)} — ${issuerName}: Coverage, Cost, and Prior Approval on ${PLAN_YEAR} Health Plans | HealthInsuranceRenew`
  const schemaDescription = isState
    ? stateConf?.ownExchange
      ? `${titleCase(drugDisplay)} is covered by most ${stateName} health plans for ${PLAN_YEAR}. ${stateName} uses ${stateConf.exchange} for enrollment. See coverage details.`
      : `${titleCase(drugDisplay)} is covered by most ${stateName} health plans for ${PLAN_YEAR}. Prior authorization typically required. Typical copay after deductible: see plan details.`
    : `${titleCase(drugDisplay)} is covered by most ${issuerName} health plans for ${PLAN_YEAR}. Prior authorization typically required. Typical copay after deductible: see plan details.`

  const costSharingSpecs = humanTiers.map(tier => ({
    tierCategory: tier.shortLabel,
    copayRange: tier.costRange,
    copayOption: 'After deductible',
  }))

  const clinicalData = DRUG_CLINICAL_DATA[drugSlug.toLowerCase()]
  const tripleSchema = buildFormularyTripleSchema({
    drugName: titleCase(drugDisplay),
    drugSlug,
    nonProprietaryName: GENERIC_NAME_MAP[drugSlug.toLowerCase()],
    rxcui: rxnormId,
    drugClass: clinicalData?.drugClass,
    stateSlug: canonicalIssuerParam,
    stateName: stateName ?? 'Marketplace',
    canonical,
    pageTitle: schemaTitle,
    metaDescription: schemaDescription,
    planYear: PLAN_YEAR,
    hasPriorAuth,
    hasStepTherapy,
    hasQuantityLimit,
    planCount: displayPlanCount,
    costSharingSpecs,
    breadcrumbItems,
    faqItems: formularyFaqs,
  })

  // --- Editorial content ---
  const editorial = results.length > 0
    ? generateFormularyContent({ drugName: drugDisplay, drugs: results, issuerName, stateCode: isState ? stateName : undefined })
    : null

  // --- State-specific content insights ---
  const baseline = getDrugBaseline(drugSlug)
  const stateInsights =
    baseline && isState && results.length > 0
      ? generateStateInsights({
          drugName: drugDisplay,
          stateName: stateName ?? '',
          stateCode: stateCode ?? '',
          stateResults: results,
          baseline,
        })
      : null

  // --- Drug archetype classification (drives content voice + emphasis) ---
  const drugClassification = baseline
    ? classifyDrug({
        drugName: drugDisplay,
        dominantTier: baseline.dominant_tier_national ?? dominantGroup,
        nationalPaPct: baseline.prior_auth_pct_national ?? 0,
        nationalQlPct: baseline.quantity_limit_pct_national ?? 0,
        totalPlans: baseline.total_plans_national ?? results.length,
      })
    : null

  // --- Narrative pattern engine (state-level content differentiation) ---
  const narrativeData: NarrativeData | null =
    baseline && isState && results.length > 0 && drugClassification
      ? buildNarrativeData({
          drugName: drugDisplay,
          stateName: stateName ?? '',
          stateCode: stateCode ?? '',
          results,
          baseline,
          dominantTier: dominantGroup,
          priorAuthCount,
          stepTherapyCount,
          quantityLimitCount,
          hasPriorAuth,
          classification: drugClassification,
        })
      : null
  const narrativePattern: NarrativePattern | null =
    narrativeData ? detectNarrativePattern(narrativeData) : null
  const localizedSections = narrativeData && narrativePattern
    ? generateLocalizedSections(narrativeData, narrativePattern)
    : null
  const conditionalBlocks = narrativeData && narrativePattern
    ? getConditionalBlocks(narrativeData, narrativePattern)
    : []
  const insightHeading = narrativeData && narrativePattern
    ? getInsightHeading(narrativeData, narrativePattern)
    : null

  // --- Entity links ---
  const relatedPlans = results
    .map((r) => r.plan_id)
    .filter((id): id is string => id != null)
    .slice(0, 5)
    .map((id) => {
      const plan = getPlanById(id)
      return { id, name: plan?.plan_name ?? id }
    })

  const entityLinks = getRelatedEntities({
    pageType: 'formulary',
    drugName: drugDisplay,
    issuer: issuerName,
    relatedPlans,
  })

  // --- Coverage interpretation ---
  const coverageInterpretation = interpretCoverage({
    drugName: titleCase(drugDisplay),
    totalPlans: results.length,
    dominantGroup,
    hasPriorAuth,
    priorAuthPct,
    hasGenericAvailable: isGenericAvailable,
  })

  // --- Internal linking data ---
  const drugCategory = getDrugCategory(drugDisplay)
  const relatedDrugs = getRelatedDrugs(drugDisplay, issuer)
  const comparisonLinks = getComparisonLinks(drugDisplay)
  const educationalLinks = getEducationalLinks({
    drugName: drugDisplay,
    tierGroup: dominantGroup,
    hasPriorAuth,
    hasStepTherapy,
    hasQuantityLimit,
    category: drugCategory,
  })
  const statePlanLinks = getStatePlanLinks(drugDisplay, stateCode, stateName)
  const relatedGuides = getRelatedGuides(drugCategory)

  const priorAuthLabel = !hasPriorAuth
    ? 'Not required'
    : priorAuthPct > 80
      ? 'Usually required'
      : priorAuthPct > 30
        ? 'Sometimes required'
        : 'Rarely required'

  // --- Drug class for editorial variation ---
  const drugClass = detectDrugClass(drugSlug, dominantGroup)
  const glp1Manufacturer = GLP1_MANUFACTURER[drugSlug.toLowerCase().replace(/-/g, ' ')]
  const oralAlt = ORAL_GLP1_MAP[drugSlug.toLowerCase().replace(/-/g, ' ')]

  // --- Build cost rows for CostBlock ---
  const costRows: { name: string; desc: string; figure: string; unit: string; hint?: string }[] = []
  if (humanTiers.length > 0) {
    costRows.push({
      name: "Before you have met your deductible",
      desc: `Estimated from ${fmtN(displayPlanCount)} ${isState ? stateName : 'Marketplace'} plan filing${displayPlanCount === 1 ? '' : 's'} \u2014 varies by plan and pharmacy`,
      figure: displayBeforeDeductibleRange,
      unit: 'month',
      hint: `For ${titleCase(drugDisplay)}${isState ? ` in ${stateName}` : ''}, this is typically the highest out-of-pocket phase \u2014 you pay the full amount your plan owes the pharmacy until your deductible is met.`,
    })
    costRows.push({
      name: `After your deductible \u2014 ${dominantHumanTier.shortLabel.toLowerCase()} tier`,
      desc: `On ${isState ? stateName : 'Marketplace'} plans where ${titleCase(drugDisplay)} is placed on a ${dominantHumanTier.shortLabel.toLowerCase()} tier`,
      figure: displayAfterDeductibleRange,
      unit: 'month',
      hint: dominantGroup === 'generic'
        ? `Generic tier drugs like ${titleCase(drugDisplay)} often have low copays even before your deductible is met on some ${isState ? stateName : 'Marketplace'} plans.`
        : `Once your deductible is met, this is what most people pay for ${titleCase(drugDisplay)} on ${isState ? stateName : 'Marketplace'} plans with favorable tier placement.`,
    })
    if (humanTiers.length > 1) {
      const secondTier = humanTiers.find(ht => ht.group !== dominantGroup)
      if (secondTier) {
        costRows.push({
          name: `After your deductible \u2014 ${secondTier.shortLabel.toLowerCase()} tier`,
          desc: `${isState ? stateName : 'Marketplace'} plans that place ${titleCase(drugDisplay)} on a ${secondTier.shortLabel.toLowerCase()} tier`,
          figure: secondTier.costRange,
          unit: 'month',
          hint: `${isState ? stateName : 'Marketplace'} plans that place ${titleCase(drugDisplay)} on a higher tier will cost more even after your deductible.`,
        })
      }
    }
  }

  return (
    <>
      <SchemaScript schema={tripleSchema} id="formulary-schema" />
      <LlmComment
        pageType="formulary-drug"
        state={stateCode}
        planCount={results.length}
        year={PLAN_YEAR}
        data="federal-plan-benefit-documents"
        extra={{ drug: titleCase(drugDisplay), issuer: issuerName }}
      />

      <ProcessBar items={[
        `${PLAN_YEAR} federal plan data`,
        `${fmtN(displayPlanCount)} plan${displayPlanCount === 1 ? '' : 's'} reviewed`,
        'Licensed agent reviewed',
        'Updated March 2026',
      ]} />

      <main id="main-content" className="mx-auto" style={{ maxWidth: 800, padding: '0 20px 72px' }}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:px-4 focus:py-2 focus:z-50 focus:rounded focus:shadow">Skip to main content</a>

        {/* ── Breadcrumbs (V19 .bc) ── */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center text-faint" style={{ fontSize: '12px', gap: '4px', paddingTop: '20px' }}>
          <a href="/" className="text-vblue hover:underline">Home</a>
          <span className="text-rule" style={{ fontSize: '10px' }}>&rsaquo;</span>
          <a href="/formulary" className="text-vblue hover:underline">Drug Coverage</a>
          <span className="text-rule" style={{ fontSize: '10px' }}>&rsaquo;</span>
          <a href={isState ? `/${canonicalIssuerParam}/health-insurance-plans` : `/${canonicalIssuerParam}/all`} className="text-vblue hover:underline">
            {isState ? stateName : issuerName}
          </a>
          <span className="text-rule" style={{ fontSize: '10px' }}>&rsaquo;</span>
          <span className="text-ink3">{titleCase(drugDisplay)}</span>
        </nav>

        <article>
          {/* ── 1. H1 (V19 .page-h1) ── */}
          <div style={{ paddingTop: '16px' }}>
            <h1
              className="font-serif text-ink"
              style={{ fontSize: '27px', fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.3px', maxWidth: 680 }}
            >
              {isState
                ? `${titleCase(drugDisplay)} in ${stateName}: Coverage, Cost, and Prior Approval on ${PLAN_YEAR} Health Plans`
                : isSpecificIssuer
                  ? `${titleCase(drugDisplay)} \u2014 ${issuerName}: Coverage, Cost, and Prior Approval on ${PLAN_YEAR} Health Plans`
                  : `${titleCase(drugDisplay)}: Coverage, Cost, and Prior Approval on ${PLAN_YEAR} Health Plans`
              }
            </h1>

            {/* ── 2. Date line (V19 .page-date) ── */}
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '6px' }}>
              <time dateTime="2026-03-20">Last reviewed March 2026</time>
              {' \u00a0·\u00a0 '}
              {isState ? stateName : issuerName} {PLAN_YEAR}
            </p>
          </div>

          {/* ── 3. AeoBlock ── */}
          {results.length > 0 && (
            <AeoBlock
              answer={
                // DEFECT-5 — PATTERN A (coverage summary cluster bullet 1) for state+summary case.
                (isState && stateSummary && stateName)
                  ? `All ${spellNumber(stateSummary.carriers.length)} insurance companies offering individual marketplace plans in ${stateName} for ${PLAN_YEAR} list ${titleCase(drugDisplay)} as a covered drug. That covers all ${fmtN(stateSummary.plan_count)} health plans in the state’s marketplace. Confirm your specific plan’s drug list before you enroll.`
                  : narrativeData && narrativePattern
                    ? generateQuickAnswer(narrativeData, narrativePattern)
                    : `${titleCase(drugDisplay)} is covered by ${fmtN(displayPlanCount)} ${isState ? stateName : 'Marketplace'} plans for ${PLAN_YEAR}. ${hasPriorAuth ? `${priorAuthCount} require prior approval.` : 'Prior approval is not required on reviewed plans.'}`
              }
              caveat={`Based on ${PLAN_YEAR} federal plan data. Actual cost depends on your plan, pharmacy, and deductible status.`}
            />
          )}

          {/* ── 4. EvidenceBlock ── */}
          {results.length > 0 && (
            <EvidenceBlock
              title={`What we found across ${fmtN(displayPlanCount)} ${isState ? stateName : ''} plans`}
              meta={`${PLAN_YEAR} plan year \u00b7 data snapshot March 2026`}
              stats={[
                { label: 'Plans covering', value: fmtN(displayPlanCount), sub: 'of plans reviewed', highlight: true },
                {
                  label: 'Typical tier',
                  value: dominantGroup === 'generic' ? 'Lowest cost tier'
                    : dominantGroup === 'preferred-brand' ? 'Lower-cost brand tier'
                    : dominantGroup === 'non-preferred-brand' ? 'Higher-cost brand tier'
                    : dominantGroup === 'specialty' ? 'Highest cost tier'
                    : dominantHumanTier.shortLabel,
                  sub: [
                    `Plan term: ${dominantHumanTier.shortLabel} · ${dominantHumanTier.costRange}`,
                    stateInsights?.tierComparison ? ` ${stateInsights.tierComparison}` : '',
                  ].join(''),
                },
                {
                  label: 'Prior authorization',
                  value: hasPriorAuth ? `${fmtN(priorAuthCount)} plans` : 'Not required',
                  sub: hasPriorAuth
                    ? ['require approval', stateInsights?.paComparison ? ` ${stateInsights.paComparison}` : ''].join('')
                    : 'on plans reviewed',
                },
              ]}
              rows={[
                ...(hasStepTherapy
                  ? [{ key: 'Step therapy required', value: `${fmtN(stepTherapyCount)} plan${stepTherapyCount === 1 ? '' : 's'}`, variant: 'varies' as const }]
                  : [{ key: 'Step therapy required', value: 'Not found in plans reviewed' }]),
                ...(hasQuantityLimit
                  ? [{ key: 'Supply limits', value: `${fmtN(quantityLimitCount)} plan${quantityLimitCount === 1 ? '' : 's'}`, variant: 'varies' as const }]
                  : [{ key: 'Supply limits', value: 'Not found in plans reviewed' }]),
              ]}
              note="Plan details can change. Confirm before enrolling."
            />
          )}

          {/* ── 4b. Plain-English takeaway ── */}
          {results.length > 0 && (
            <p className="text-mid" style={{ fontSize: '13.5px', lineHeight: 1.6, marginTop: '10px' }}>
              {priorAuthPct > 50
                ? `Most ${isState ? stateName : 'Marketplace'} plans reviewed place ${titleCase(drugDisplay)} on a ${tierPlain} tier and require prior approval before coverage starts.`
                : `Most ${isState ? stateName : 'Marketplace'} plans reviewed cover ${titleCase(drugDisplay)} on a ${tierPlain} tier without requiring prior approval.`
              }
            </p>
          )}

          {/* ── 4c. Editorial Insight Box ── */}
          {results.length > 0 && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #dbe3ec',
                borderLeft: '3px solid #1a56a0',
                borderRadius: '0 8px 8px 0',
                padding: '16px 20px',
                marginTop: '14px',
              }}
            >
              <p className="text-ink font-medium" style={{ fontSize: '13.5px', marginBottom: '6px' }}>
                {insightHeading
                  ?? `What matters most for ${titleCase(drugDisplay)} in ${isState ? stateName : 'Marketplace plans'}`}
              </p>
              <p className="text-ink" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                {narrativeData && narrativePattern
                  ? generateInsightBody(narrativeData, narrativePattern)
                  : stateInsights?.insightBody
                  || `For ${titleCase(drugDisplay)}${isState ? ` in ${stateName}` : ''}, plans vary most in tier placement and whether prior approval is required. Comparing these two factors is the best way to estimate your real monthly cost.`
                }
              </p>
            </div>
          )}

          {/* ── 4d. Conditional pattern blocks — render only when data triggers them ── */}
          {results.length > 0 && conditionalBlocks.length > 0 && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {conditionalBlocks.map((block) => (
                <div
                  key={block.id}
                  style={{
                    background: '#f8fafc',
                    borderLeft: '3px solid #64748b',
                    borderRadius: '0 8px 8px 0',
                    padding: '14px 18px',
                  }}
                >
                  <p className="text-ink font-medium" style={{ fontSize: '13.5px', marginBottom: '4px' }}>
                    {block.heading}
                  </p>
                  <p className="text-mid" style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
                    {block.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── 5. Primary CTA (V19 .cta-primary) ── */}
          {results.length > 0 && (
            <div
              className="flex items-center justify-between flex-wrap"
              style={{ background: '#0b6e4a', borderRadius: '10px', padding: '15px 20px', gap: '14px', marginTop: '14px' }}
            >
              <div>
                <div className="text-white font-medium" style={{ fontSize: '15px', lineHeight: 1.3 }}>
                  Find a {isState ? `${stateName} ` : ''}Plan That Covers {titleCase(drugDisplay)}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                  Compare tier placement, costs, and prior authorization rules across plans
                </div>
              </div>
              <a
                href="/contact"
                className="inline-block shrink-0 bg-white font-medium hover:opacity-90 transition-opacity"
                style={{ color: '#0b6e4a', borderRadius: '6px', padding: '9px 22px', fontSize: '13.5px', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Compare Plans &rarr;
              </a>
            </div>
          )}

          {/* ── DIVIDER (V19 .divider) ── */}
          <hr className="border-rule" style={{ margin: '36px 0' }} />

          {/* ── 6. Cost section ── */}
          {results.length > 0 && humanTiers.length > 0 && (
            <section aria-labelledby="cost-heading" style={{ marginTop: '44px', borderTop: '1px solid var(--rule)', paddingTop: '44px' }}>
              <div
                id="cost-heading"
                className="text-faint uppercase font-medium border-b border-rule flex justify-between items-baseline flex-wrap"
                style={{ fontSize: '10.5px', letterSpacing: '0.1em', paddingBottom: '8px', marginBottom: '14px', gap: '4px' }}
              >
                <span>What {titleCase(drugDisplay)} is likely to cost you in {isState ? stateName : 'Marketplace plans'}</span>
                <span className="text-muted normal-case italic font-normal" style={{ fontSize: '11px', letterSpacing: 0 }}>
                  {titleCase(drugDisplay)} on {isState ? stateName : 'Marketplace'} plans
                </span>
              </div>
              <p className="text-mid" style={{ fontSize: '13.5px', lineHeight: 1.65, marginBottom: '14px' }}>
                {
                  // BONUS A — V79 locked cost intro. Renders for state+summary+preferred-brand case
                  // with after-deductible cost range from the summary.
                  (isState && stateSummary && stateName
                    && dominantGroup === 'preferred-brand'
                    && stateSummary.cost_range_after_deductible)
                    ? `After your deductible, most people in ${stateName} pay an estimated $${stateSummary.cost_range_after_deductible.low} to $${stateSummary.cost_range_after_deductible.high} a month for ${titleCase(drugDisplay)}. All ${spellNumber(stateSummary.carriers.length)} ${stateName} insurance companies place ${titleCase(drugDisplay)} on a lower-cost brand tier — the cost variation within that range depends on what you would pay for ${titleCase(drugDisplay)} on that plan. Before your deductible, you may pay several hundred dollars a month.`
                    : narrativeData && narrativePattern
                      ? generateCostContext(narrativeData, narrativePattern)
                      : stateInsights?.costContext
                      || `Your cost for ${titleCase(drugDisplay)} depends on which ${isState ? stateName : 'Marketplace'} plan you choose and what tier it assigns. Deductible structure also plays a role — check whether your plan has a separate drug deductible.`
                }
              </p>
              <CostBlock
                rows={costRows}
                note={`Estimated from ${PLAN_YEAR} plan filings \u2014 not pharmacy prices and not a quote. What you pay at the counter depends on your specific plan, pharmacy, and deductible status. Confirm with your plan or pharmacist before relying on these numbers.`}
                varyRows={[
                  { key: 'Tier placement matters', value: localizedSections?.tierBreakdown ?? stateInsights?.tierBreakdown ?? `Preferred and non-preferred tiers can differ by $40–$80 per month or more. Check the tier assignment on each ${isState ? stateName : 'Marketplace'} plan you are considering.` },
                  { key: 'Pharmacy choice', value: localizedSections?.pharmacyChoice ?? `Your plan's price for ${titleCase(drugDisplay)} varies by pharmacy. Preferred pharmacies and mail-order often come in lower — worth checking before your first fill.` },
                  { key: 'How your deductible works', value: localizedSections?.deductibleContext ?? `Whether your plan has a separate drug deductible or combines it with medical determines when your lower copay for ${titleCase(drugDisplay)} kicks in.` },
                ]}
              />
            </section>
          )}

          {/* ── 7. Mid CTA (V19 .cta-mid) ── */}
          {results.length > 0 && (
            <div
              className="bg-white border border-rule flex items-center justify-between flex-wrap"
              style={{ borderLeft: '3px solid #1a56a0', borderRadius: '0 8px 8px 0', padding: '14px 18px', gap: '14px', marginTop: '14px' }}
            >
              <div>
                <div className="text-ink font-medium" style={{ fontSize: '14px' }}>
                  See plans in {isState ? stateName : 'your area'} with lower out-of-pocket drug costs
                </div>
                <div className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                  Tier and deductible design vary — comparing plans can reveal a lower total cost
                </div>
              </div>
              <a
                href="/contact"
                className="inline-block shrink-0 bg-vblue text-white font-medium hover:bg-ink transition-colors"
                style={{ borderRadius: '6px', padding: '9px 20px', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Compare Plans &rarr;
              </a>
            </div>
          )}

          {/* ── 8. Plan rules section ── */}
          {results.length > 0 && (
            <section aria-labelledby="rules-heading" style={{ marginTop: '44px', borderTop: '1px solid var(--rule)', paddingTop: '44px' }}>
              <div
                id="rules-heading"
                className="text-faint uppercase font-medium border-b border-rule"
                style={{ fontSize: '10.5px', letterSpacing: '0.1em', paddingBottom: '8px', marginBottom: '14px' }}
              >
                Access rules: what {isState ? stateName : 'Marketplace'} plans require for {titleCase(drugDisplay)}
              </div>
              <PlanRulesBlock
                rules={[
                  {
                    badge: hasPriorAuth ? 'blue' : 'green',
                    badgeText: hasPriorAuth ? '\u25B6' : '\u2713',
                    // DEFECT-6 Pattern 3 — amber callout title parameterized by paAll vs paMajority.
                    title: (isState && stateSummary && stateName && hasPriorAuth)
                      ? (paAll
                          ? `You may not be able to get ${titleCase(drugDisplay)} right away — approval required on every plan from all ${spellNumber(stateSummary.carriers.length)} ${stateName} insurance companies`
                          : `You may not be able to get ${titleCase(drugDisplay)} right away — approval required on ${spellNumber(paMajorityCount)} of ${spellNumber(stateSummary.carriers.length)} ${stateName} insurance companies`)
                      : `Prior approval ${hasPriorAuth ? 'is usually required' : 'not required'}`,
                    titleSuffix: '(Prior Authorization)',
                    observation: hasPriorAuth
                      ? `${fmtN(priorAuthCount)} of ${fmtN(results.length)} plans we reviewed`
                      : 'not found in plans we reviewed',
                    body: (isState && stateSummary && stateName && hasPriorAuth)
                      // DEFECT-6 Pattern 3 body — V79 locked wording.
                      ? `Many plans require approval first (called prior authorization), so you may have to wait several days before you can fill it. If you need ${titleCase(drugDisplay)} soon, ask your doctor’s office how to avoid delays.`
                      : hasPriorAuth
                      ? [
                          `Before your pharmacy can fill ${titleCase(drugDisplay)}, most plans require your doctor to submit documentation to the plan first. Your doctor\u2019s office typically handles this. The approval requirements, process, and timelines vary by plan \u2014 check your benefit documents for the specifics that apply to yours. If a request is denied, your plan will have an appeal process you can use.`,
                          localizedSections?.paNote ? ` ${localizedSections.paNote}` : stateInsights?.paNote ? ` ${stateInsights.paNote}` : '',
                        ].join('')
                      : `Your doctor can prescribe ${titleCase(drugDisplay)} directly. Your pharmacy can fill it without advance plan approval. Drug list requirements can change during the plan year \u2014 always confirm current coverage with your plan.`,
                  },
                  {
                    badge: hasStepTherapy ? 'blue' : 'green',
                    badgeText: hasStepTherapy ? '\u25B6' : '\u2713',
                    title: `Step therapy ${hasStepTherapy ? 'may be required' : 'not required'}`,
                    observation: hasStepTherapy
                      ? `found in ${fmtN(stepTherapyCount)} plan${stepTherapyCount === 1 ? '' : 's'} we reviewed`
                      : 'not found in plans we reviewed',
                    body: hasStepTherapy
                      ? `Some plans require you to try a lower-cost alternative before covering ${titleCase(drugDisplay)}. If your doctor believes step therapy is not clinically appropriate, they can file a step therapy exception request with supporting documentation.`
                      : `None of the ${fmtN(results.length)} ${isState ? `${stateCode} ` : ''}plans we reviewed required you to try a cheaper drug before covering ${titleCase(drugDisplay)}. That said, if you are using a related medication for a different indication, the rules may be different \u2014 ${relatedDrugs.length > 0 ? `see <a href="${relatedDrugs[0].href}" class="text-vblue hover:underline">${relatedDrugs[0].name} coverage</a> for comparison` : 'check your plan\u2019s benefit documents for details'}.`,
                  },
                  {
                    badge: hasQuantityLimit ? 'gray' : 'green',
                    badgeText: hasQuantityLimit ? 'QL' : '\u2713',
                    title: `Supply limits per month`,
                    observation: hasQuantityLimit
                      ? `found in ${fmtN(quantityLimitCount)} of ${fmtN(results.length)} plans`
                      : 'not found in plans reviewed',
                    body: hasQuantityLimit
                      ? `${fmtN(quantityLimitCount)} of ${fmtN(results.length)} ${isState ? stateName : 'Marketplace'} plans we reviewed limit how much ${titleCase(drugDisplay)} you can fill at a time \u2014 typically one monthly supply. Mail order is often an exception and can allow a larger supply at a lower per-dose cost. Your doctor can request an exception if your prescribed amount exceeds the plan's limit.`
                      : `No supply restrictions were found in the plans we reviewed. Your plan may still have fill-quantity guidelines \u2014 check your benefit documents for details.`,
                  },
                ]}
              />
            </section>
          )}

          {/* ── 8b. What to expect while you wait — DEFECT-6 Patterns 1 & 2 ── */}
          {/* Renders only when paMajority === true (V79 locked). */}
          {results.length > 0 && isState && stateSummary && hasPriorAuth && (
            <section aria-labelledby="wait-heading" style={{ marginTop: '24px' }}>
              <h3
                id="wait-heading"
                className="text-ink font-medium"
                style={{ fontSize: '14px', lineHeight: 1.3, marginBottom: '10px' }}
              >
                What to expect while you wait
              </h3>
              <div className="bg-white border border-rule" style={{ borderRadius: '8px', padding: '12px 16px', marginBottom: '10px' }}>
                {/* DEFECT-6 Pattern 2 — At the pharmacy (static, no variables). */}
                <div className="text-ink font-medium" style={{ fontSize: '13px', marginBottom: '4px' }}>
                  You may find out approval is needed when you try to pick it up
                </div>
                <div className="text-mid" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  You may find out at the pharmacy that your plan requires approval first. If it does, you will not be able to fill it until your plan approves it.
                </div>
              </div>
              <div className="bg-white border border-rule" style={{ borderRadius: '8px', padding: '12px 16px' }}>
                {/* DEFECT-6 Pattern 1 — The wait (static, no variables). */}
                <div className="text-ink font-medium" style={{ fontSize: '13px', marginBottom: '4px' }}>
                  A few days is common, but it can take longer
                </div>
                <div className="text-mid" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  A few days is common, but some requests take longer. If the situation is urgent, ask whether a faster review is possible.
                </div>
              </div>
            </section>
          )}

          {/* ── 9. Approval timeline (only if hasPriorAuth) ── */}
          {results.length > 0 && hasPriorAuth && (
            <section aria-labelledby="timeline-heading" style={{ marginTop: '44px', borderTop: '1px solid var(--rule)', paddingTop: '44px' }}>
              <div
                id="timeline-heading"
                className="text-faint uppercase font-medium border-b border-rule"
                style={{ fontSize: '10.5px', letterSpacing: '0.1em', paddingBottom: '8px', marginBottom: '14px' }}
              >
                How the prior authorization process works
              </div>
              <p className="text-mid" style={{ fontSize: '13.5px', lineHeight: 1.65, marginBottom: '14px' }}>
                If your {isState ? stateName : 'Marketplace'} plan requires prior approval for {titleCase(drugDisplay)}, your doctor handles the paperwork. The steps below outline how the process works.
              </p>
              <TimelineSteps
                steps={[
                  { title: 'Your doctor submits documentation', desc: `Your prescribing doctor sends your diagnosis and supporting information directly to your ${isState ? stateName + ' ' : ''}health plan. ${priorAuthCount > 0 ? `${fmtN(priorAuthCount)} of ${fmtN(results.length)} plans we reviewed require this step for ${titleCase(drugDisplay)}.` : 'The documentation required varies by plan.'}`, time: 'Day 1' },
                  { title: 'Plan reviews the request', desc: `${isState ? stateName + ' ' : 'Your '}plan checks the request against its coverage requirements. Your doctor and the plan's review team handle this — you do not need to do anything at this stage.`, time: 'Days 1\u20133 typically' },
                  { title: 'Decision issued', desc: `Response times vary by plan and urgency. Your plan's benefit documents explain the timeline that applies to your coverage — urgent cases may be handled faster than standard requests.`, time: 'Usually within a few business days' },
                  { title: 'Prescription can be filled', desc: `Once approved, you can fill the prescription at your pharmacy. Your deductible status and tier determine your cost at the counter. Your plan's benefit documents explain how long the approval is valid.`, time: 'After approval' },
                  { title: 'If not approved \u2014 you have options', desc: `Your plan has an appeal process you can use. If the appeal is also denied, you may be able to request an independent external review. Your plan's benefit documents outline the steps and deadlines.`, time: 'Review your plan documents for deadlines' },
                ]}
              />
            </section>
          )}

          {/* ── 10. How to reduce what you pay ── */}
          {results.length > 0 && (
            <section aria-labelledby="savings-heading" style={{ marginTop: '44px', borderTop: '1px solid var(--rule)', paddingTop: '44px' }}>
              <div
                id="savings-heading"
                className="text-faint uppercase font-medium border-b border-rule"
                style={{ fontSize: '10.5px', letterSpacing: '0.1em', paddingBottom: '8px', marginBottom: '14px' }}
              >
                How to reduce what you pay for {titleCase(drugDisplay)}
              </div>
              <SavingsRows
                rows={
                  // BONUS B — V79 locked "Compare specific plans, not just insurance companies" card.
                  // Prepended across all drug-class branches.
                  [
                    { icon: '↗', title: 'Compare specific plans, not just insurance companies', desc: `Even when two plans both cover ${titleCase(drugDisplay)} on the same tier, your monthly cost can still be different based on the plan’s deductible, the ${titleCase(drugDisplay)} copay, and which pharmacies it uses. During open enrollment, check the specific plan you are considering — not just which insurance company offers it.` },
                  ].concat(
                  drugClass === 'injectable-glp1'
                    ? [
                        { icon: '$', title: `${glp1Manufacturer ?? 'Manufacturer'} savings card`, desc: `${glp1Manufacturer ?? 'The manufacturer'} offers a savings card for ${titleCase(drugDisplay)} that can reduce your monthly cost if you have commercial insurance. ${isState ? `${stateName} residents with a marketplace plan generally qualify.` : ''} Eligibility and savings amounts change \u2014 ask your doctor's office or pharmacist for current details before factoring it into your budget.` },
                        (drugSlug.toLowerCase() === 'ozempic'
                          ? { icon: '\u2192', title: `Ask about the oral version`, desc: `If injectable ${titleCase(drugDisplay)} is hard to access or too expensive, ask your doctor about <a href="/${canonicalIssuerParam}/rybelsus" class="text-vblue hover:underline">Rybelsus</a> \u2014 an oral option with the same active ingredient that may be on a different tier.` }
                          : { icon: '\u2192', title: `Ask about alternatives`, desc: `If cost or access is a problem, ask your doctor whether a different covered medication in the same class might work for your situation.` }),
                        { icon: '\u2197', title: 'Compare plans by specialty tier', desc: `Specialty tier copays can vary by hundreds of dollars between ${isState ? stateName : 'Marketplace'} plans. Choosing a plan where ${titleCase(drugDisplay)} is on a more favorable tier can reduce your monthly cost.${isState && stateSlug ? ` <a href="/${stateSlug}/health-insurance-plans" class="text-vblue hover:underline">Browse ${stateName} plan options</a> before enrollment closes.` : ''}` },
                        { icon: '\u2713', title: 'Preferred pharmacy or mail-order benefits', desc: `Some plans offer lower rates at preferred pharmacies or through mail-order benefits. Check your plan\u2019s pharmacy benefit summary to see whether this applies and how to use it.` },
                      ]
                    : drugClass === 'generic'
                      ? [
                          { icon: '\u2713', title: 'Already low cost on most plans', desc: `${titleCase(drugDisplay)} is a generic drug placed on the lowest-cost tier by most ${isState ? stateName : 'Marketplace'} plans. Your copay is typically ${dominantHumanTier.costRange} per month after your deductible.` },
                          { icon: '\u2197', title: 'Check pharmacy choice and mail order', desc: `Even for low-cost generics, preferred pharmacies and 90-day mail-order supplies often save an additional 20\u201330%. Check your plan\u2019s pharmacy benefit summary for options.` },
                          { icon: '$', title: 'Check if your plan covers it before deductible', desc: `Some plans cover generic drugs before the deductible is met \u2014 meaning you\u2019d pay just the copay from day one. Look for this in your Summary of Benefits and Coverage.` },
                          ...(relatedDrugs.length > 0 ? [{ icon: '\u2192', title: 'Compare related medications', desc: `See how similar drugs compare on tier placement: <a href="${relatedDrugs[0].href}" class="text-vblue hover:underline">${relatedDrugs[0].name} coverage</a>.` }] : []),
                        ]
                      : [
                          { icon: '$', title: 'Manufacturer copay card', desc: `The manufacturer of ${titleCase(drugDisplay)} may offer a copay card for commercially insured ${isState ? stateName + ' residents' : 'patients'}. Eligibility and savings amounts vary \u2014 ask your doctor\u2019s office or pharmacist for current details.` },
                          { icon: '\u2192', title: 'Check generic alternatives', desc: `Ask your doctor or pharmacist whether a generic equivalent or therapeutic alternative is on a lower tier on your ${isState ? stateName + ' ' : ''}plan.${relatedDrugs.length > 0 ? ` See <a href="${relatedDrugs[0].href}" class="text-vblue hover:underline">${relatedDrugs[0].name} coverage</a> to compare.` : ''}` },
                          { icon: '\u2197', title: 'Choose a plan with a more favorable tier', desc: `Across the ${fmtN(results.length)} ${isState ? stateName : 'Marketplace'} plan${results.length === 1 ? '' : 's'} we reviewed, tier assignment for ${titleCase(drugDisplay)} ranged from ${dominantHumanTier.shortLabel.toLowerCase()} to other tiers. Choosing a plan with a preferred tier can reduce your monthly cost by $40\u2013$80 or more.${isState && stateSlug ? ` <a href="/${stateSlug}/health-insurance-plans" class="text-vblue hover:underline">Browse ${stateName} plan options</a> before enrollment closes.` : ''}` },
                          { icon: '\u2713', title: 'Preferred pharmacy or mail-order benefits', desc: `Some ${isState ? stateName : 'Marketplace'} plans offer lower rates at preferred pharmacies or through mail-order. Check your plan\u2019s pharmacy benefit summary to see whether this applies to ${titleCase(drugDisplay)}.` },
                        ]
                  )
                }
                note="Eligibility for savings programs varies. Check directly with the manufacturer or your plan."
              />
            </section>
          )}

          {/* ── 10b. What to do if you run into a problem ── */}
          {results.length > 0 && (
            <section aria-labelledby="not-covered-heading" style={{ marginTop: '44px' }}>
              <div
                id="not-covered-heading"
                className="text-faint uppercase font-medium border-b border-rule"
                style={{ fontSize: '10.5px', letterSpacing: '0.1em', paddingBottom: '8px', marginBottom: '14px' }}
              >
                What to do if you run into a problem
              </div>
              <ol className="text-mid" style={{ fontSize: '13.5px', lineHeight: 1.7, paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong className="text-ink">Check whether prior approval is required</strong> &mdash; it may be covered but needs documentation from your doctor first.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong className="text-ink">Ask your doctor about a coverage exception</strong> &mdash; your doctor can submit clinical justification explaining why {titleCase(drugDisplay)} is medically necessary for you.
                </li>
                {hasPriorAuth && (
                  <li style={{ marginBottom: '8px' }}>
                    <strong className="text-ink">If prior approval is denied</strong> &mdash; ask your doctor to request a peer-to-peer review with the plan&rsquo;s medical director. If that fails, file a formal appeal. A few days is common for a response, but some requests take longer &mdash; if the situation is urgent, ask whether a faster review is possible.
                  </li>
                )}
                {(dominantGroup === 'specialty' || dominantGroup === 'non-preferred-brand') && (
                  <li style={{ marginBottom: '8px' }}>
                    <strong className="text-ink">If the cost is too high even after your deductible</strong> &mdash; ask about the manufacturer savings program, check whether a therapeutic alternative is on a lower tier, or compare plans at Open Enrollment with better brand-tier coverage.
                  </li>
                )}
                {hasStepTherapy && (
                  <li style={{ marginBottom: '8px' }}>
                    <strong className="text-ink">If step therapy is required</strong> &mdash; ask your doctor to document why alternatives are not appropriate for you. Many plans grant exceptions with proper clinical justification.
                  </li>
                )}
                <li style={{ marginBottom: '8px' }}>
                  <strong className="text-ink">Ask whether a therapeutic alternative is on your plan&rsquo;s drug list</strong> at a lower tier &mdash; a similar drug in the same class may be covered at a lower cost.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong className="text-ink">If you&rsquo;re comparing plans during enrollment</strong> &mdash; check the drug list AND the tier for {titleCase(drugDisplay)} specifically. Two plans can both &ldquo;cover&rdquo; a drug but place it on very different tiers.
                </li>
                <li>
                  <strong className="text-ink">If denied, file an appeal</strong> &mdash; most plans have an internal appeal process, and independent external review is available under federal law.
                </li>
              </ol>
            </section>
          )}

          {/* ── 11. LimitsBlock ── */}
          {results.length > 0 && (
            <div style={{ marginTop: '44px' }}>
              <LimitsBlock
                title="What we cannot confirm from plan documents alone"
                items={[
                  `Your exact cost at a specific pharmacy. Prices at the counter can differ from what is in plan filings.`,
                  `Whether your doctor\u2019s documentation will meet your specific plan\u2019s approval requirements \u2014 that depends on your plan\u2019s rules and your situation.`,
                  `Whether your plan has updated its drug list or tier since our January ${PLAN_YEAR} snapshot. Plans can make mid-year changes.`,
                  `The exact timelines and appeal steps that apply to your plan. Those details are in your plan\u2019s benefit documents.`,
                  `Whether you qualify for the manufacturer savings card. Terms and eligibility can change \u2014 verify directly.`,
                ]}
              />
            </div>
          )}
        </article>

        {/* ── FAQ (V19 .faq-wrap) — moved before secondary exploration ── */}
        <section aria-labelledby="faq-heading" style={{ marginTop: '44px' }}>
          <div
            id="faq-heading"
            className="text-faint uppercase font-medium border-b border-rule"
            style={{ fontSize: '10.5px', letterSpacing: '0.1em', paddingBottom: '8px', marginBottom: '14px' }}
          >
            Common questions
          </div>
          <div className="flex flex-col" style={{ gap: '5px' }}>
            {formularyFaqs.map((faq, i) => (
              <details
                key={i}
                open={i === 0}
                className="group bg-white border border-rule overflow-hidden"
                style={{ borderRadius: '8px' }}
              >
                <summary
                  className="flex items-center justify-between cursor-pointer text-ink font-medium hover:bg-surface transition-colors [&::-webkit-details-marker]:hidden list-none"
                  style={{ padding: '13px 18px', fontSize: '13.5px', gap: '8px' }}
                >
                  <span>{faq.question}</span>
                  <span className="text-faint shrink-0 transition-transform group-open:rotate-180" style={{ fontSize: '10px' }}>&#x25BC;</span>
                </summary>
                <div
                  className="text-mid border-t border-rule"
                  style={{ padding: '10px 18px 15px', fontSize: '13.5px', lineHeight: 1.65 }}
                >
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Educational explainers (bodyHtml — tightened, below unique content) ── */}
        {editorial?.bodyHtml && (
          <div
            className="content-formulary"
            style={{ marginTop: '44px', fontSize: '13.5px', lineHeight: 1.7, color: 'var(--ink)' }}
            dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }}
          />
        )}

        {/* ── AboutBlock ── */}
        <div style={{ marginTop: '44px' }}>
          <AboutBlock
            text={`The information here comes from reviewing plan information for ${fmtN(results.length)} ${isState ? `${stateName} ` : ''}individual health plans available in ${PLAN_YEAR}. We reviewed whether each plan covers the drug, which tier it is on, whether prior approval is required, and the estimated cost after your deductible \u2014 based on 2026 plan filings, not live pharmacy prices. Plan details can change during the year, and your specific plan may differ from what we reviewed.`}
            reviewedLine={`Reviewed using a structured editorial process \u00b7 Data snapshot: January ${PLAN_YEAR} \u00b7 Last updated: March ${PLAN_YEAR}`}
            links={[
              { href: '/editorial-policy', label: 'Editorial process' },
              { href: '/review-process', label: 'How pages are reviewed' },
              { href: '/about', label: 'About this site' },
            ]}
          />
        </div>

        {/* ── Education links (V19 .edu-list) ── */}
        <div style={{ marginTop: '44px' }}>
          <div
            className="text-faint uppercase font-medium border-b border-rule"
            style={{ fontSize: '10.5px', letterSpacing: '0.1em', paddingBottom: '8px', marginBottom: '14px' }}
          >
            Related guides
          </div>
          <div className="flex flex-col">
            <a
              href="/guides/how-deductibles-affect-drug-costs"
              className="flex items-center justify-between border-b border-rule text-ink hover:text-vblue transition-colors"
              style={{ padding: '12px 0', fontSize: '13.5px', textDecoration: 'none' }}
            >
              How your deductible affects what you pay for prescription drugs
              <span className="text-rule" style={{ fontSize: '12px' }}>&rsaquo;</span>
            </a>
            <a
              href="/guides/how-approval-rules-work-for-prescriptions"
              className="flex items-center justify-between text-ink hover:text-vblue transition-colors"
              style={{ padding: '12px 0', fontSize: '13.5px', textDecoration: 'none' }}
            >
              How approval rules work — and what happens if a request is not approved
              <span className="text-rule" style={{ fontSize: '12px' }}>&rsaquo;</span>
            </a>
          </div>
        </div>

        {/* ── DIVIDER (V19 .divider) ── */}
        <hr className="border-rule" style={{ margin: '36px 0' }} />

        {/* ── Related drugs (V19 .drug-pills) ── */}
        {(relatedDrugs.length > 0 || comparisonLinks.length > 0) && (
          <section aria-labelledby="related-drugs-heading" style={{ marginTop: '44px' }}>
            <div
              id="related-drugs-heading"
              className="text-faint uppercase font-medium border-b border-rule"
              style={{ fontSize: '10.5px', letterSpacing: '0.1em', paddingBottom: '8px', marginBottom: '14px' }}
            >
              Related drugs — {isState ? `${stateName} coverage` : 'coverage'}
            </div>
            {relatedDrugs.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                {relatedDrugs.map((drug) => (
                  <a
                    key={drug.slug}
                    href={drug.href}
                    className="bg-white border border-rule text-vblue font-medium hover:border-vblue hover:bg-bluedim transition-colors"
                    style={{ padding: '7px 15px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none' }}
                  >
                    {drug.name}
                  </a>
                ))}
              </div>
            )}
            {comparisonLinks.length > 0 && (
              <div className={`${relatedDrugs.length > 0 ? 'border-t border-rule' : ''}`} style={{ marginTop: relatedDrugs.length > 0 ? '14px' : 0, paddingTop: relatedDrugs.length > 0 ? '14px' : 0 }}>
                {comparisonLinks.map((comp) => (
                  <a
                    key={comp.href}
                    href={comp.href}
                    className="flex items-center text-vblue font-medium hover:underline"
                    style={{ fontSize: '13px', gap: '6px' }}
                  >
                    {comp.label} &rarr;
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Insurer list (V19 .ins-block) ── */}
        {otherIssuers.length > 0 && (
          <section aria-labelledby="insurance-companies-heading" style={{ marginTop: '44px' }}>
            <div
              className="text-faint uppercase font-medium border-b border-rule flex justify-between items-baseline flex-wrap"
              style={{ fontSize: '10.5px', letterSpacing: '0.1em', paddingBottom: '8px', marginBottom: '14px', gap: '4px' }}
            >
              <span>{isState ? `${stateCode}` : ''} insurance companies that included {titleCase(drugDisplay)} in {PLAN_YEAR}</span>
              <span className="text-muted normal-case italic font-normal" style={{ fontSize: '11px', letterSpacing: 0 }}>
                Tier from plan documents reviewed · prior authorization status noted
              </span>
            </div>
            {/* Insurer table intro */}
            <p className="text-muted" style={{ fontSize: '13px', lineHeight: 1.55, marginBottom: '10px' }}>
              {/* DEFECT-7 — V79 locked comparison framing. */}
              The same drug can cost more on one plan than another, even when the tier is the same. What you actually pay depends on what your plan charges — the deductible, the copay, and which pharmacy you use.
            </p>
            <div className="bg-white border border-rule rounded-[10px] overflow-hidden">
              {otherIssuers.slice(0, 12).map((ins, i) => {
                const ht = humanizeTierForDrug(ins.tier, drugDisplay)
                const isPref = ht.group === 'preferred-brand' || ht.group === 'generic' || ht.group === 'insulin-ira'
                return (
                  <a
                    key={ins.id}
                    href={`/${ins.id}/${drugSlug}`}
                    className={`flex items-center justify-between hover:bg-surface transition-colors ${i > 0 ? 'border-t border-rule' : ''}`}
                    style={{ padding: '12px 20px', fontSize: '13.5px', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div>
                      <span className="text-vblue block font-medium">{ins.name}</span>
                      <span className="text-muted block" style={{ fontSize: '11.5px', marginTop: '1px' }}>
                        {hasPriorAuth ? 'Prior authorization seen on reviewed plans' : 'No prior authorization'}
                      </span>
                    </div>
                    <div className="flex items-center shrink-0" style={{ gap: '10px' }}>
                      <span
                        className="font-medium"
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          background: isPref ? '#e6eef9' : '#f3f7fa',
                          color: isPref ? '#1a3a87' : '#4a6278',
                          border: isPref ? 'none' : '1px solid #dbe3ec',
                        }}
                      >
                        {ht.shortLabel}
                      </span>
                    </div>
                  </a>
                )
              })}
              <div
                className="bg-surface border-t border-rule"
                style={{ padding: '9px 20px', fontSize: '11.5px', color: '#728fa4', fontStyle: 'italic' }}
              >
                Click any insurance company to see plan-level detail. Confirm current coverage before enrolling.
              </div>
            </div>
            {(() => {
              const tierSet = new Set(otherIssuers.slice(0, 12).map(ins => humanizeTierForDrug(ins.tier, drugDisplay).group))
              if (tierSet.size < 2) return null
              const tierLabels = [...tierSet].map(g => {
                const t = humanizeTierForDrug(g, drugDisplay)
                return t.shortLabel.toLowerCase()
              })
              // Estimate savings from cost range differences
              const ranges = [...tierSet].map(g => {
                const match = humanizeTierForDrug(g, drugDisplay).costRange.match(/\$(\d+)/)
                return match ? parseInt(match[1], 10) : 0
              }).filter(Boolean)
              const savingsNote = ranges.length >= 2
                ? ` $${Math.abs(Math.max(...ranges) - Math.min(...ranges))}+`
                : ''
              return (
                <p className="text-muted" style={{ fontSize: '12.5px', lineHeight: 1.55, marginTop: '10px', fontStyle: 'italic' }}>
                  Notice the tier differences — choosing a plan with a lower tier for {titleCase(drugDisplay)} could save you{savingsNote} per month.
                </p>
              )
            })()}
          </section>
        )}

        {/* ── State nav (V19 .state-nav) ── */}
        {isState && (
          <section style={{ marginTop: '44px' }}>
            <div
              className="bg-white border border-rule rounded-[10px] flex items-center justify-between flex-wrap"
              style={{ padding: '15px 20px', gap: '12px' }}
            >
              <div className="text-mid" style={{ fontSize: '13.5px' }}>
                See drug coverage data for all medications reviewed in <strong className="text-ink font-medium">{stateName}</strong> health plans.
              </div>
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                <a
                  href={`/${canonicalIssuerParam}/all`}
                  className="border border-rule text-vblue font-medium hover:border-vblue transition-colors"
                  style={{ borderRadius: '6px', padding: '7px 16px', fontSize: '13px', textDecoration: 'none' }}
                >
                  All {stateCode} drug coverage &rarr;
                </a>
                <a
                  href={`/states/${stateCode?.toLowerCase()}`}
                  className="border border-rule text-vblue font-medium hover:border-vblue transition-colors"
                  style={{ borderRadius: '6px', padding: '7px 16px', fontSize: '13px', textDecoration: 'none' }}
                >
                  {stateName} health insurance overview &rarr;
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ── Bottom CTA (V19 .cta-bottom) ── */}
        <div
          className="flex items-center justify-between flex-wrap"
          style={{ background: '#0d1b2a', borderRadius: '16px', padding: '28px 32px', gap: '18px', marginTop: '44px' }}
        >
          <div>
            <div
              className="font-serif text-white font-medium"
              style={{ fontSize: '21px', lineHeight: 1.2, marginBottom: '4px' }}
            >
              Compare {isState ? `${stateName} ` : ''}Plans for {titleCase(drugDisplay)} Cost and Access
            </div>
            <div style={{ fontSize: '13px', color: '#7fb3e0' }}>
              Review {isState ? `${stateName} ` : ''}plan options, tier placement, and estimated monthly costs before you enroll.
            </div>
          </div>
          <a
            href="/contact"
            className="inline-block shrink-0 bg-white text-ink font-medium hover:opacity-90 transition-opacity"
            style={{ borderRadius: '6px', padding: '12px 26px', fontSize: '14px', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Compare {isState ? `${stateName} ` : ''}Plans &rarr;
          </a>
        </div>

        {/* ── 19. GenericByline ── */}
        <div style={{ marginTop: '24px' }}>
          <GenericByline dataSource="Federal marketplace plan data" planYear={PLAN_YEAR} />
        </div>

        {/* ── 20. Page disclaimer footer (V19 .disc) ── */}
        <footer className="border-t border-rule text-muted" style={{ fontSize: '11.5px', lineHeight: 1.65, paddingTop: '18px', marginTop: '24px' }}>
          <p>
            This page is for informational purposes only and does not constitute
            medical or insurance advice. Formulary data sourced from federal plan benefit
            documents for plan year {PLAN_YEAR}. Drug tier placement, prior authorization
            requirements, and quantity limits may change during the plan year. Always
            verify current coverage with your insurance carrier or at healthcare.gov.
            Consult a licensed health insurance agent to confirm coverage for your
            specific plan.
          </p>
        </footer>

      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// SBM / Empty-State Explanation Page (extracted for clarity)
// ---------------------------------------------------------------------------

function SBMExplanationPage({
  issuer,
  stateSlug,
  drugSlug,
  drugDisplay,
  stateName,
  isSBMState,
  exchangeName,
  exchangeUrl,
  allResults,
}: {
  issuer: string
  stateSlug: string
  drugSlug: string
  drugDisplay: string
  stateName: string
  isSBMState: boolean
  exchangeName: string
  exchangeUrl: string
  allResults: FormularyDrug[]
}) {
  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: 'Drug Coverage', url: `${SITE_URL}/drugs` },
    { name: stateName, url: `${SITE_URL}/${stateSlug}/health-insurance-plans` },
    { name: titleCase(drugDisplay), url: `${SITE_URL}/${stateSlug}/${drugSlug}` },
  ]
  const bSchema = buildBreadcrumbSchema(breadcrumbItems)

  return (
    <>
      <SchemaScript schema={bSchema} id="breadcrumb-schema" />
      <main className="mx-auto px-5 pb-[72px]" style={{ maxWidth: 800 }}>

        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li><a href="/formulary" className="hover:underline text-primary-600">Drug Coverage</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li><a href={`/${stateSlug}/health-insurance-plans`} className="hover:underline text-primary-600">{stateName}</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{titleCase(drugDisplay)}</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-4">
          {titleCase(drugDisplay)} in {stateName}: Coverage Information
        </h1>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-amber-800 mb-1">
                {isSBMState
                  ? `${stateName} uses its own state exchange`
                  : `Formulary data not available for ${stateName}`
                }
              </p>
              <p className="text-amber-700 text-sm leading-relaxed">
                {isSBMState
                  ? `${stateName} marketplace plans enroll through ${exchangeName}, which maintains its own formulary database separate from the federal marketplace dataset. To check if ${titleCase(drugDisplay)} is covered by a ${stateName} plan, use the ${exchangeName} plan finder directly.`
                  : `Formulary records for ${stateName} marketplace plans are not available in the current federal marketplace dataset. This does not mean ${titleCase(drugDisplay)} is uncovered — check directly with your plan or the federal marketplace.`
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <a
            href={`/drugs`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Search all states for {titleCase(drugDisplay)}
          </a>
          <a
            href={`/${stateSlug}/health-insurance-plans`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100 transition-colors"
          >
            View {stateName} health plans
          </a>
        </div>

        {allResults.length > 0 && (
          <div className="border border-slate-200 rounded-2xl p-5">
            <h2 className="font-semibold text-slate-800 mb-3">
              {titleCase(drugDisplay)} is covered nationally
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Across all states in our dataset, {titleCase(drugDisplay)} appears on{' '}
              {allResults.length} formulary {allResults.length === 1 ? 'record' : 'records'} from{' '}
              {fmtN(new Set(allResults.map(r => (r.issuer_ids?.[0] ?? r.issuer_id))).size)} insurance companies.
              {allResults[0]?.drug_tier && (
                <> It is typically listed as a {humanizeTierForDrug(allResults[0].drug_tier, drugDisplay).shortLabel.toLowerCase()} drug.</>
              )}
            </p>
            <a href="/formulary" className="text-sm text-primary-600 font-semibold hover:text-primary-700">
              View national coverage details &rarr;
            </a>
          </div>
        )}

        <GenericByline dataSource="Federal plan benefit documents and carrier formulary filings" planYear={PLAN_YEAR} />

        <footer className="border-t border-neutral-200 mt-8 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Formulary data sourced from federal marketplace plan data, plan year {PLAN_YEAR}.
            Always verify current coverage with your insurance carrier or at healthcare.gov.
          </p>
          <p>
            This page is for informational purposes only and does not constitute medical or
            insurance advice. <strong>Consult a licensed health insurance agent</strong> to
            confirm formulary coverage for your specific plan.
          </p>
        </footer>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RestrictionCard({
  active,
  title,
  activeText,
  inactiveText,
  detail,
}: {
  active: boolean
  title: string
  activeText: string
  inactiveText: string
  detail: string
}) {
  return (
    <div className={`rounded-xl p-4 ${active ? 'bg-amber-50 border border-amber-200' : 'bg-neutral-50 border border-neutral-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        {active ? (
          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span className="text-sm font-semibold text-navy-800">{title}</span>
      </div>
      <p className={`text-sm font-medium mb-1 ${active ? 'text-amber-700' : 'text-green-700'}`}>
        {active ? activeText : inactiveText}
      </p>
      <p className="text-xs text-neutral-500">{detail}</p>
    </div>
  )
}

function ExpandableSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border border-neutral-200 rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-neutral-50 transition-colors list-none">
        <span className="font-medium text-navy-800 text-sm pr-4">{title}</span>
        <svg className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </summary>
      <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
        {children}
      </div>
    </details>
  )
}

function RestrictionBadge({ active }: { active?: boolean }) {
  return active ? (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      Yes
    </span>
  ) : (
    <span className="text-neutral-400 text-xs">No</span>
  )
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

interface IssuerInfo {
  id: string
  name: string
  tier?: string
}

interface FormulationGroup {
  drug_name: string
  drug_tier?: string
  prior_authorization?: boolean
  step_therapy?: boolean
  quantity_limit?: boolean
  planCount: number
}

function groupByFormulation(drugs: FormularyDrug[]): FormulationGroup[] {
  const map = new Map<string, FormulationGroup>()
  for (const d of drugs) {
    const key = [
      d.drug_name ?? '',
      d.drug_tier ?? '',
      String(!!d.prior_authorization),
      String(!!d.step_therapy),
      String(!!d.quantity_limit),
    ].join('|')
    const existing = map.get(key)
    if (existing) {
      existing.planCount += 1
    } else {
      map.set(key, {
        drug_name: d.drug_name ?? '',
        drug_tier: d.drug_tier,
        prior_authorization: d.prior_authorization,
        step_therapy: d.step_therapy,
        quantity_limit: d.quantity_limit,
        planCount: 1,
      })
    }
  }
  return [...map.values()]
}

function getUniqueIssuers(drugs: FormularyDrug[], stateCode?: string): IssuerInfo[] {
  // Build state filter: only include issuer IDs that actually serve the requested state
  const stateMap = stateCode ? getIssuerStateMap() : undefined
  const stateUpper = stateCode?.toUpperCase()

  const seenNames = new Map<string, IssuerInfo>()
  for (const d of drugs) {
    const ids = d.issuer_ids ?? (d.issuer_id ? [d.issuer_id] : [])
    for (const id of ids) {
      // Skip issuer IDs that don't serve the current state
      if (stateMap && stateUpper && !stateMap.get(id)?.has(stateUpper)) continue

      const name = getIssuerName(id)
      if (!name) continue
      // Deduplicate by display name to avoid showing the same insurance company multiple times
      if (!seenNames.has(name)) {
        seenNames.set(name, { id, name, tier: d.drug_tier })
      }
    }
  }
  return [...seenNames.values()]
}
