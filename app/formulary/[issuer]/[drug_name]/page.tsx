// NOTE: No name/NPN on this page — generic byline only
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import siteConfig from '@/data/config/config.json'
import {
  searchFormulary,
  getIssuerName,
  getPlanById,
  getTopIssuerIds,
} from '@/lib/data-loader'
import type { FormularyDrug } from '@/lib/types'
import {
  buildFormularyDrugSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
} from '@/lib/schema-markup'
import { getRelatedEntities } from '@/lib/entity-linker'
import SchemaScript from '@/components/SchemaScript'
import EntityLinkCard from '@/components/EntityLinkCard'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import { generateFormularyContent } from '@/lib/content-templates'
import {
  humanizeTier,
  humanizeTiers,
  summarizeTierPlacement,
  getDominantTierGroup,
  interpretCoverage,
} from '@/lib/formulary-helpers'
import type { HumanTier } from '@/lib/formulary-helpers'
import {
  getDrugCategory,
  getRelatedDrugs,
  getComparisonLinks,
  getEducationalLinks,
  getStatePlanLinks,
  getRelatedGuides,
} from '@/lib/drug-linking'
import DrugPageCta from '@/components/DrugPageCta'
import allStatesData from '@/data/config/all-states.json'
import { stateCodeToSlug } from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

// ---------------------------------------------------------------------------
// Clinical data lookup (top-50 common drugs)
// Information Gain: tier context per alternative, not available on GoodRx/Drugs.com
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
    indications: 'Reduces LDL cholesterol and cardiovascular event risk. First-line statin for high-risk patients.',
    genericAlts: [],
    therapeuticAlts: [
      { name: 'Rosuvastatin', tier: 'Tier 1 Generic', desc: 'High-intensity statin — generic available since 2021, equivalent efficacy' },
      { name: 'Simvastatin', tier: 'Tier 1 Generic', desc: 'Moderate-intensity statin — lowest cost, longest track record' },
    ],
    otcAlts: [],
  },
  'lisinopril': {
    drugClass: 'ACE Inhibitor (Hypertension / Heart failure)',
    indications: 'First-line for hypertension, heart failure, and kidney protection in diabetic patients.',
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
      { name: 'Synthroid', tier: 'Tier 2 Preferred Brand', desc: 'Brand-name version — some patients prefer for consistency' },
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
    indications: 'Treats hypertension and reduces kidney disease progression in diabetic patients. Alternative when ACE inhibitor causes cough.',
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

function isStateCode(param: string): boolean {
  return param.length === 2 && VALID_STATE_CODES.has(param.toLowerCase())
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
  const isState = isStateCode(params.issuer)
  const stateName = isState ? getStateNameFromAbbr(params.issuer) : undefined

  const stateConf = isState
    ? (allStatesData.states as { abbr: string; name: string; exchange: string; ownExchange: boolean }[])
        .find(s => s.abbr.toUpperCase() === params.issuer.toUpperCase())
    : undefined

  const issuerName = isState
    ? `Plans in ${stateName}`
    : params.issuer !== 'all'
      ? (getIssuerName(params.issuer) ?? params.issuer)
      : 'All Insurers'

  const title = isState
    ? `${titleCase(drugDisplay)} Coverage in ${stateName} — ${PLAN_YEAR} Marketplace (Obamacare) Plans`
    : `Does ${issuerName} Cover ${titleCase(drugDisplay)}? ${PLAN_YEAR} Marketplace Formulary`
  const description = isState
    ? stateConf?.ownExchange
      ? `Check if ${drugDisplay} is covered by ${stateName} Marketplace (Obamacare) plans. ${stateName} uses ${stateConf.exchange} for enrollment.`
      : `Is ${drugDisplay} covered by Marketplace plans in ${stateName}? See tier, cost, and prior authorization details. CMS ${PLAN_YEAR} data.`
    : `Check if ${issuerName} covers ${drugDisplay} on their ${PLAN_YEAR} Marketplace formulary. ` +
      `See tier placement, prior authorization requirements, step therapy, and quantity limits. Source: CMS MR-PUF.`
  const canonical = `${SITE_URL}/formulary/${params.issuer}/${params.drug_name}`

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
// Page
// ---------------------------------------------------------------------------

export default async function FormularyDrugPage({ params }: Props) {
  const drugSlug = decodeURIComponent(params.drug_name)
  const drugDisplay = drugSlug.replace(/-/g, ' ')

  // Guard: /formulary/[state]/all is not a drug search
  if (drugSlug.toLowerCase() === 'all') {
    redirect('/formulary')
  }

  const issuer = params.issuer
  const isState = isStateCode(issuer)
  const stateCode = isState ? issuer.toUpperCase() : undefined
  const isSpecificIssuer = !isState && issuer !== 'all'

  // Full state config for exchange info
  const stateConfig = isState
    ? (allStatesData.states as {
        abbr: string; name: string; exchange: string;
        exchangeUrl: string; ownExchange: boolean
      }[]).find(s => s.abbr.toUpperCase() === issuer.toUpperCase())
    : undefined
  const stateName = stateConfig?.name ?? (isState ? issuer.toUpperCase() : undefined)
  const isSBMState = stateConfig?.ownExchange ?? false

  // --- Load drug results ---
  const results = await searchFormulary({
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

  // ── SBM state or state with no formulary data — show explanation page ──
  if (isState && results.length === 0) {
    return <SBMExplanationPage
      issuer={issuer}
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
      : 'All Insurers'

  // --- Derived coverage details ---
  const rawTiers = results.map((r) => r.drug_tier).filter(Boolean) as string[]
  const tiers = [...new Set(rawTiers)]
  const humanTiers = humanizeTiers(rawTiers)
  const dominantGroup = getDominantTierGroup(rawTiers)
  const dominantHumanTier = humanizeTier(
    results.find(r => getDominantTierGroup([r.drug_tier]) === dominantGroup)?.drug_tier
  )

  const hasPriorAuth = results.some((r) => r.prior_authorization)
  const priorAuthCount = results.filter((r) => r.prior_authorization).length
  const priorAuthPct = results.length > 0 ? (priorAuthCount / results.length) * 100 : 0
  const hasStepTherapy = results.some((r) => r.step_therapy)
  const stepTherapyCount = results.filter((r) => r.step_therapy).length
  const hasQuantityLimit = results.some((r) => r.quantity_limit)
  const quantityLimitCount = results.filter((r) => r.quantity_limit).length
  const isGenericAvailable = tiers.some((t) => t.toUpperCase().includes('GENERIC'))
  const rxnormId = results.find((r) => r.rxnorm_id)?.rxnorm_id

  // --- Other issuers covering this drug ---
  const otherIssuers = getUniqueIssuers(allResults).filter((i) => i.id !== issuer)

  // --- Schema.org ---
  const drugSchema = buildFormularyDrugSchema({
    drug: {
      drug_name: drugDisplay,
      rxnorm_id: rxnormId,
      drug_tier: tiers[0],
      issuer_name: issuerName,
      plan_id: results[0]?.plan_id,
      prior_authorization: hasPriorAuth,
      step_therapy: hasStepTherapy,
      quantity_limit: hasQuantityLimit,
    },
    issuerName,
    planYear: PLAN_YEAR,
  })

  const healthPlanSchema = {
    '@context': 'https://schema.org',
    '@type': 'HealthInsurancePlan',
    name: `${issuerName} Marketplace Plan`,
    identifier: issuer,
    healthPlanDrugOption: tiers.map((t) => ({
      '@type': 'HealthPlanFormulary',
      healthPlanDrugTier: t,
    })),
  }

  const medicalWebPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: `${titleCase(drugDisplay)} ACA Formulary Coverage`,
    description: `Formulary tier placement, cost-sharing, restrictions, and patient guidance for ${titleCase(drugDisplay)} on ACA Marketplace health plans.`,
    url: `${SITE_URL}/formulary/${params.issuer}/${params.drug_name}`,
    author: {
      '@type': 'Organization',
      name: 'HealthInsuranceRenew Editorial Team',
      url: 'https://healthinsurancerenew.com/editorial-policy',
    },
    reviewedBy: {
      '@type': 'Organization',
      name: 'HealthInsuranceRenew Editorial Team',
      url: 'https://healthinsurancerenew.com/editorial-policy',
    },
    dateModified: new Date().toISOString(),
    medicalAudience: {
      '@type': 'MedicalAudience',
      audienceType: 'Patient',
    },
    about: {
      '@type': 'Drug',
      name: titleCase(drugDisplay),
      ...(rxnormId ? { identifier: `rxnorm:${rxnormId}` } : {}),
    },
  }

  const breadcrumbItems = isState
    ? [
        { name: 'Home', url: SITE_URL },
        { name: 'Formulary', url: `${SITE_URL}/formulary` },
        { name: stateName!, url: `${SITE_URL}/formulary/${issuer}/all` },
        { name: titleCase(drugDisplay), url: `${SITE_URL}/formulary/${issuer}/${drugSlug}` },
      ]
    : [
        { name: 'Home', url: SITE_URL },
        { name: 'Formulary', url: `${SITE_URL}/formulary` },
        { name: issuerName, url: `${SITE_URL}/formulary/${issuer}/all` },
        { name: titleCase(drugDisplay), url: `${SITE_URL}/formulary/${issuer}/${drugSlug}` },
      ]
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems)

  // ── FAQ data ────────────────────────────────────────────────────────────
  const tierSummaryText = summarizeTierPlacement(rawTiers, titleCase(drugDisplay))
  const stateOrIssuerLabel = isState ? `in ${stateName}` : `from ${issuerName}`
  const stateOrNational = isState ? ` in ${stateName}` : ''

  // Featured snippet FAQ (first item, rendered prominently)
  const featuredSnippetFaq = {
    question: isState
      ? `Is ${titleCase(drugDisplay)} covered by Marketplace (Obamacare) plans in ${stateName}?`
      : `Is ${titleCase(drugDisplay)} covered by Marketplace (Obamacare) plans?`,
    answer: results.length > 0
      ? `Yes, ${titleCase(drugDisplay)} is covered by most Marketplace plans${stateOrNational}. ${tierSummaryText}`
      : `${titleCase(drugDisplay)} was not found on Marketplace plan formularies${stateOrNational} in the ${PLAN_YEAR} CMS dataset. You may be able to request a formulary exception if your doctor demonstrates medical necessity.`,
  }

  const formularyFaqs = [
    featuredSnippetFaq,
    {
      question: `Does ${titleCase(drugDisplay)} require prior authorization on Marketplace plans?`,
      answer: hasPriorAuth
        ? `Yes, prior authorization (PA) is required for ${titleCase(drugDisplay)} on ${priorAuthCount === results.length ? 'all' : 'some'} Marketplace plans${stateOrNational}. PA is not a coverage denial — it is a prerequisite. Your doctor submits a request with your diagnosis code and clinical rationale, and the insurer must respond within 2–3 business days (24–72 hours for urgent cases). Most properly documented PA requests are approved. If denied, you have the right to a peer-to-peer review between your doctor and the insurer's medical director, followed by a formal internal appeal. Always request expedited processing if you need the medication within 72 hours.`
        : `No, prior authorization is not required for ${titleCase(drugDisplay)} on most Marketplace plans${stateOrNational}, meaning your doctor can prescribe it and your pharmacy can fill it without advance insurer approval. However, formulary requirements can change during the plan year — always confirm current coverage with your insurer before filling a new prescription, especially after January 1 when formularies are updated.`,
    },
    {
      question: `How much does ${titleCase(drugDisplay)} cost with Marketplace insurance?`,
      answer: humanTiers.length > 0
        ? `${titleCase(drugDisplay)} typically costs ${dominantHumanTier.costRange} per fill on most Marketplace plans as a ${dominantHumanTier.shortLabel.toLowerCase()} drug. However, this is the post-deductible copay — if you have not yet met your annual deductible, you will pay the plan's negotiated rate for the drug, which may be significantly higher than the listed copay. For example, on a $1,500 deductible plan, you could pay $40–$80 for a drug with a $15 listed copay until your deductible is satisfied. A 90-day mail-order supply often costs about 67% of three 30-day fills, saving roughly $30–$60 per quarter. Always check your plan's Summary of Benefits and Coverage for exact cost-sharing at your deductible status.`
        : `Cost depends on your plan's specific tier placement and cost-sharing structure. Check your plan's Summary of Benefits and Coverage for exact copay or coinsurance amounts at your current deductible status.`,
    },
    {
      question: `What tier is ${titleCase(drugDisplay)} on Marketplace drug formularies?`,
      answer: humanTiers.length > 0
        ? `${titleCase(drugDisplay)} is placed on a ${dominantHumanTier.shortLabel.toLowerCase()} tier on most Marketplace plans${stateOrNational}. ${dominantHumanTier.costHint}. Tier placement can vary significantly by insurer — the same drug can be Tier 2 on one plan and Tier 4 on another, depending on PBM rebate contracts negotiated annually. This is one of the most important reasons to check the specific formulary of any plan you are considering before enrolling. Formulary tiers are reset every January 1, so a drug's tier can change even if you stay on the same plan year to year.`
        : `Tier details for ${titleCase(drugDisplay)} vary across plans. Check your specific plan's formulary document for tier placement. Formularies are updated annually, so verify coverage each Open Enrollment period.`,
    },
    {
      question: `What if ${titleCase(drugDisplay)} is not covered by my plan?`,
      answer: `You have three main paths when a drug is not covered. First, request a formulary exception — your doctor submits a letter of medical necessity explaining why formulary alternatives are clinically inappropriate for you. The insurer must respond within 72 hours for urgent cases or 30 days for standard requests. Second, if the exception is denied, file a formal internal appeal — appeals succeed approximately 40–50% of the time when well-documented. Third, if the internal appeal also fails, request an independent External Review Organization (IRO) review under 45 CFR § 147.136 — the IRO decision is binding on the insurer, and about 40% of IRO reviews overturn insurer decisions. Simultaneously, ask your doctor if a formulary-covered therapeutic alternative would work for your condition.`,
    },
    // New questions — AEO/GEO/LLMO targeted
    {
      question: `Can I switch plans just to get my medication covered?`,
      answer: `Yes, but timing matters. You can switch plans during Open Enrollment (November 1–January 15) or during a qualifying Special Enrollment Period (SEP). SEP-qualifying events include losing other coverage, moving to a new coverage area, getting married, or having a baby. If your current plan stops covering a drug mid-year or significantly raises its tier, that may qualify you for an SEP — document the denial in writing and check with a licensed agent. Never enroll in a new plan without verifying that your specific drug is covered on the new formulary. Formularies change every January 1, so check the drug list specifically for the plan year you are enrolling in.`,
    },
    {
      question: `Why did my drug's tier change at the start of the year?`,
      answer: `Insurers renegotiate formularies annually — drug tiers change when manufacturer rebate contracts are renegotiated with pharmacy benefit managers (PBMs), when a generic enters the market and shifts the brand to a higher tier, or when clinical guidelines are updated. Your plan is required to notify you of formulary changes at least 60 days before they take effect (or at renewal). If a drug you depend on moved to a higher tier or was removed, you have the right to request a formulary exception based on medical necessity. If the change substantially increases your costs, you may qualify for a Special Enrollment Period to switch to a plan with better formulary coverage. This is one of the most critical reasons to review your plan's formulary at every Open Enrollment — the coverage you have today may not reflect what your plan will cover on January 1.`,
    },
    {
      question: `What's the difference between a formulary exception and a prior authorization?`,
      answer: `Prior authorization (PA) requires your doctor to document medical necessity before your insurer will cover a drug at all — PA is about getting coverage activated. A formulary exception asks the insurer to cover a drug at a lower tier or to cover a drug that is off-formulary entirely — it is about getting coverage at a lower cost or getting coverage for a drug the formulary does not include. Both require prescriber documentation, but they solve different problems. PA is typically triggered by the pharmacy at the point of sale for drugs with a PA flag. A formulary exception can be requested at any time when the clinically appropriate drug is not available at an appropriate cost tier. You can file both simultaneously if your drug is off-formulary and also has a PA requirement.`,
    },
    {
      question: `Does copay assistance count toward my deductible?`,
      answer: `It depends on your plan. Many Marketplace plans now use copay accumulator adjustment programs, which means manufacturer copay cards do NOT count toward your deductible or out-of-pocket maximum — the insurer keeps the rebate but does not credit it to your cost-sharing. However, several states have enacted accumulator reform laws requiring copay assistance to count toward cost-sharing, including Arizona, Georgia, Oklahoma, Virginia, and West Virginia. Check your plan's Summary of Benefits and Coverage for language about "copay accumulator" or "copay maximizer" programs, or call Member Services and ask directly. If your state has a reform law, insist that your plan comply when you use a manufacturer copay card — you may need to file a grievance if they do not.`,
    },
    {
      question: `What does 'not covered' vs 'prior authorization required' mean?`,
      answer: `"Not covered" (non-formulary) means the drug is not on your plan's drug list — your insurer will not pay for it at any cost-sharing level unless you win a formulary exception. The pharmacy will reject the claim entirely. "Prior authorization required" means the drug IS on your formulary, but your insurer requires clinical justification before they will process the claim. The key difference: PA is a process, not a denial. Most PA requests for medically appropriate drugs are approved. Non-formulary status requires either a formulary exception or switching to a covered therapeutic alternative. Always ask the pharmacy to clarify which situation applies so you know whether to pursue a PA or an exception.`,
    },
  ]
  const faqSchema = buildFAQSchema(formularyFaqs)

  // --- Editorial content ---
  const editorial = results.length > 0
    ? generateFormularyContent({ drugName: drugDisplay, drugs: results, issuerName })
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

  return (
    <>
      <SchemaScript schema={drugSchema} id="drug-schema" />
      <SchemaScript schema={healthPlanSchema} id="health-plan-schema" />
      <SchemaScript schema={medicalWebPageSchema} id="medical-web-page-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />
      <LlmComment
        pageType="formulary-drug"
        state={stateCode}
        planCount={results.length}
        year={PLAN_YEAR}
        data="CMS-MR-PUF"
        extra={{ drug: titleCase(drugDisplay), issuer: issuerName }}
      />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <a href="/" className="hover:underline text-primary-600">Home</a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li>
              <a href="/formulary" className="hover:underline text-primary-600">Formulary</a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li>
              <a
                href={`/formulary/${issuer}/all`}
                className="hover:underline text-primary-600"
              >
                {isState ? stateName : issuerName}
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">
              {titleCase(drugDisplay)}
            </li>
          </ol>
        </nav>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 1: HERO ANSWER BLOCK
            The key answer in plain English — scannable in under 3 seconds
            ════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="hero-heading">
          <h1 id="hero-heading" className="text-3xl sm:text-4xl font-bold text-navy-900">
            {titleCase(drugDisplay)} Coverage{isState ? ` in ${stateName}` : isSpecificIssuer ? ` — ${issuerName}` : ''}: Cost &amp; Prior Authorization Guide
          </h1>
          <p className="text-lg text-neutral-500 mt-1.5 mb-4">
            {isState
              ? <><span className="font-semibold text-navy-700">{stateName}</span>{' '}Marketplace Plans</>
              : isSpecificIssuer
                ? <><span className="font-semibold text-navy-700">{issuerName}</span>{' '}&mdash; Marketplace Plans</>
                : <>Marketplace / Obamacare Plans</>
            } &bull; {PLAN_YEAR}
          </p>

          {/* BLUF answer box — optimized for AI answer engine extraction and zero-click search panels */}
          {results.length > 0 && (
            <div className="border-l-4 border-primary-500 bg-primary-50/60 rounded-r-xl px-5 py-4 mb-5">
              <p className="text-sm text-neutral-700 leading-relaxed">
                <strong>{titleCase(drugDisplay)}</strong> is covered on{' '}
                {results.length > 50 ? 'most' : results.length > 10 ? 'many' : 'some'} Marketplace health insurance plans
                {isState ? ` in ${stateName}` : ''}.{' '}
                {hasPriorAuth
                  ? 'It is subject to prior authorization on most plans — your doctor must obtain insurer approval before you can fill it.'
                  : 'It does not require prior authorization on most plans.'
                }{' '}
                The most common tier placement is {dominantHumanTier.shortLabel}, with a typical copay of {dominantHumanTier.costRange}.
                {(!isGenericAvailable && dominantGroup !== 'generic' && dominantGroup !== 'preventive') &&
                  ' Generic alternatives may be available at significantly lower cost — ask your doctor.'
                }
              </p>
            </div>
          )}

          {results.length > 0 ? (
            <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/30 p-6 sm:p-7">
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-green-500 text-xl shrink-0">&#10004;</span>
                  <span className="text-neutral-500 text-base sm:text-lg">Covered:</span>
                  <span className="text-lg sm:text-xl font-bold text-green-800">
                    Yes ({results.length} plan{results.length === 1 ? '' : 's'})
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-green-500 text-xl shrink-0">&#10004;</span>
                  <span className="text-neutral-500 text-base sm:text-lg">Cost:</span>
                  <span className={`text-lg sm:text-xl font-bold ${dominantHumanTier.color}`}>
                    {dominantHumanTier.costRange}
                    <span className="text-sm font-normal text-neutral-500 ml-1">per fill (typical range)</span>
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-green-500 text-xl shrink-0">&#10004;</span>
                  <span className="text-neutral-500 text-base sm:text-lg">Tier:</span>
                  <span className="text-lg sm:text-xl font-bold text-navy-800">
                    {dominantHumanTier.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className={`text-xl shrink-0 ${hasPriorAuth ? 'text-amber-500' : 'text-green-500'}`}>
                    {hasPriorAuth ? '\u26A0' : '\u2714'}
                  </span>
                  <span className="text-neutral-500 text-base sm:text-lg">Prior Authorization:</span>
                  <span className={`text-lg sm:text-xl font-bold ${hasPriorAuth ? 'text-amber-700' : 'text-green-700'}`}>
                    {priorAuthLabel}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-500 mt-5 pt-3 border-t border-green-200/60">
                Based on CMS {PLAN_YEAR} plan data &middot; Updated March 2026 &middot; {results.length} plan{results.length === 1 ? '' : 's'} analyzed
                {isState ? ` in ${stateName}` : ` from ${issuerName}`}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Actual cost varies by plan, deductible, and pharmacy.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-neutral-600 text-lg leading-relaxed">
                No formulary records found for{' '}
                <strong>{titleCase(drugDisplay)}</strong>
                {isState
                  ? ` among ${stateName} marketplace plans in the CMS dataset.`
                  : ` in the ${PLAN_YEAR} CMS dataset.`
                }{' '}
                {isState && (
                  <a href={`/formulary/all/${drugSlug}`} className="text-primary-600 hover:underline font-medium">
                    Search all states &rarr;
                  </a>
                )}
              </p>
            </div>
          )}
        </section>

        {/* ═══ HERO CTA — plan check prompt ═══ */}
        {results.length > 0 && (
          <DrugPageCta
            variant="hero"
            drugName={titleCase(drugDisplay)}
            stateCode={stateCode}
            stateName={stateName}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════
            LAYER 2: CLINICAL CONTEXT
            Drug class, indications, alternatives with tier context
            Information Gain: competitors show drug info without tier context
            ════════════════════════════════════════════════════════════════ */}
        <DrugClinicalContext drugDisplay={drugDisplay} drugSlug={drugSlug} issuer={issuer} />

        {/* ═══ COST — Estimated cost per fill ═══ */}
        {results.length > 0 && humanTiers.length > 0 && (
          <section aria-labelledby="cost-heading">
            <h2 id="cost-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Estimated cost per fill
            </h2>
            <ul className="space-y-2">
              {humanTiers.map((ht) => (
                <li key={ht.group} className={`flex items-center gap-3 rounded-lg border ${ht.border} ${ht.bg} px-4 py-3`}>
                  <span className={`text-sm font-semibold ${ht.color} min-w-[160px]`}>
                    {ht.label}
                  </span>
                  <span className={`text-lg font-bold ${ht.color}`}>
                    {ht.costRange}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-neutral-400 mt-3">
              Ranges are estimates based on typical Marketplace plan cost-sharing.
              Actual cost depends on your deductible status and pharmacy network.
            </p>
          </section>
        )}

        {/* ═══ WHAT THIS MEANS — Plain-English interpretation ═══ */}
        {results.length > 0 && (
          <section aria-labelledby="interpretation-heading" className="rounded-xl bg-primary-50 border-2 border-primary-200 p-5 sm:p-6">
            <h2 id="interpretation-heading" className="text-lg font-bold text-navy-900 mb-2">
              What this means for you
            </h2>
            <p className="text-base sm:text-lg text-neutral-800 leading-relaxed">
              {coverageInterpretation}
            </p>
          </section>
        )}

        {/* ═══ MID-PAGE CTA — primary conversion ═══ */}
        {results.length > 0 && (
          <DrugPageCta
            variant="mid"
            drugName={titleCase(drugDisplay)}
            stateCode={stateCode}
            stateName={stateName}
            costRange={dominantHumanTier.costRange}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════
            LAYER 3: CASH PRICE vs INSURANCE
            Information Gain: pre-deductible reality check not on competitor pages
            ════════════════════════════════════════════════════════════════ */}
        {results.length > 0 && (
          <DrugCashPriceComparison
            drugDisplay={drugDisplay}
            dominantHumanTier={dominantHumanTier}
            dominantGroup={dominantGroup}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4: RESTRICTION SUMMARY CARDS
            Prior auth, step therapy, quantity limit — clean compact cards
            ════════════════════════════════════════════════════════════════ */}
        {results.length > 0 && (hasPriorAuth || hasStepTherapy || hasQuantityLimit) && (
          <section aria-labelledby="restrictions-heading">
            <h2 id="restrictions-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Coverage restrictions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <RestrictionCard
                active={hasPriorAuth}
                title="Prior authorization"
                activeText={priorAuthPct > 80
                  ? `Required on most plans (${priorAuthCount} of ${results.length})`
                  : `Required on some plans (${priorAuthCount} of ${results.length})`
                }
                inactiveText="Not required on any plan in this dataset"
                detail={hasPriorAuth
                  ? 'Your doctor must get insurer approval before prescribing. If denied, you can appeal.'
                  : 'Your doctor can prescribe this medication directly.'
                }
              />
              <RestrictionCard
                active={hasStepTherapy}
                title="Step therapy"
                activeText={`Required on ${stepTherapyCount} plan${stepTherapyCount === 1 ? '' : 's'}`}
                inactiveText="No 'try first' requirement"
                detail={hasStepTherapy
                  ? 'You may need to try a lower-cost alternative before this drug is approved.'
                  : 'You don\'t need to try other drugs first.'
                }
              />
              <RestrictionCard
                active={hasQuantityLimit}
                title="Quantity limit"
                activeText={`Applies on ${quantityLimitCount} plan${quantityLimitCount === 1 ? '' : 's'}`}
                inactiveText="No monthly fill limit"
                detail={hasQuantityLimit
                  ? 'The amount dispensed per fill may be capped. Your doctor can request an exception.'
                  : 'No restrictions on quantity per fill in this dataset.'
                }
              />
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION 5: HOW TO SAVE ON THIS MEDICATION
            ════════════════════════════════════════════════════════════════ */}
        {results.length > 0 && (
          <section aria-labelledby="save-tips-heading" className="rounded-xl border border-green-200 bg-green-50/50 p-5">
            <h2 id="save-tips-heading" className="text-base font-semibold text-green-900 mb-3">
              How to save on {titleCase(drugDisplay)}
            </h2>
            <ul className="space-y-2 text-sm text-green-800">
              {isGenericAvailable && (
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold shrink-0">&#10003;</span>
                  <span>
                    <strong>Generic available</strong> — ask your doctor to prescribe the generic version for a lower copay.
                  </span>
                </li>
              )}
              <li className="flex gap-2">
                <span className="text-green-600 font-bold shrink-0">&#10003;</span>
                <span>
                  <strong>90-day mail order</strong> — many plans offer a lower per-dose cost for 90-day supplies.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold shrink-0">&#10003;</span>
                <span>
                  <strong>Manufacturer copay cards</strong> — most brand-name drugs have copay assistance programs. Search &ldquo;{drugDisplay} copay card.&rdquo;
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold shrink-0">&#10003;</span>
                <span>
                  <strong>Compare plans at open enrollment</strong> — formulary tiers change yearly. Always check the formulary when comparing plans.
                </span>
              </li>
            </ul>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            LAYER 4: MANUFACTURER ASSISTANCE
            Only for non-generic / non-preventive tiers — YMYL + E-E-A-T
            ════════════════════════════════════════════════════════════════ */}
        {results.length > 0 && dominantGroup !== 'generic' && dominantGroup !== 'preventive' && (
          <DrugManufacturerAssistance drugDisplay={drugDisplay} />
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION 6: INSURER COMPARISON (moved higher)
            ════════════════════════════════════════════════════════════════ */}
        {otherIssuers.length > 0 && (
          <section aria-labelledby="insurers-heading">
            <h2 id="insurers-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Insurers that cover {titleCase(drugDisplay)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherIssuers.slice(0, 12).map((ins) => {
                const ht = humanizeTier(ins.tier)
                return (
                  <a
                    key={ins.id}
                    href={`/formulary/${ins.id}/${drugSlug}`}
                    className="block p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-primary-700">
                      {ins.name}
                    </span>
                    <span className={`block text-xs mt-0.5 ${ht.color}`}>
                      {ht.shortLabel} — {ht.costRange}
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* ═══ WHAT IF NOT COVERED? ═══ */}
        {results.length > 0 && (
          <section aria-labelledby="not-covered-heading" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <h2 id="not-covered-heading" className="text-base font-semibold text-navy-800 mb-3">
              What if your plan doesn&apos;t cover this drug?
            </h2>
            <div className="space-y-3 text-sm text-neutral-700">
              <div className="flex gap-3">
                <span className="text-primary-600 font-bold shrink-0">1.</span>
                <div>
                  <strong>Request a formulary exception.</strong>{' '}
                  Your doctor submits a letter of medical necessity explaining why listed alternatives won&apos;t work for you.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-primary-600 font-bold shrink-0">2.</span>
                <div>
                  <strong>File an internal appeal.</strong>{' '}
                  The insurer must respond within <strong>72 hours</strong> for urgent requests or 30 days for standard requests.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-primary-600 font-bold shrink-0">3.</span>
                <div>
                  <strong>Request external review.</strong>{' '}
                  An independent reviewer makes a binding decision. You have this right under federal law.
                </div>
              </div>
              <p className="text-xs text-neutral-400 pt-2 border-t border-neutral-200">
                Source: 42 U.S.C. §300gg-19, 45 CFR §147.136. Contact your state insurance commissioner or a licensed agent for specific guidance.
              </p>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            LAYER 6: PATIENT ACTION GUIDE
            SXO: completes the user's task — they should not need to Google again
            ════════════════════════════════════════════════════════════════ */}
        {results.length > 0 && (
          <DrugPatientActionGuide
            drugDisplay={drugDisplay}
            drugSlug={drugSlug}
            stateCode={stateCode}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════
            RELATED MEDICATIONS — category-aware internal linking
            ════════════════════════════════════════════════════════════════ */}
        {relatedDrugs.length > 0 && (
          <section aria-labelledby="related-drugs-heading">
            <h2 id="related-drugs-heading" className="text-lg font-semibold text-navy-800 mb-1">
              Related medications
            </h2>
            {drugCategory && (
              <p className="text-sm text-neutral-500 mb-3">
                Other {drugCategory.label.toLowerCase()} covered by Marketplace plans
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {relatedDrugs.map((drug) => (
                <a
                  key={drug.slug}
                  href={drug.href}
                  className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <span className="text-primary-500 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <span className="text-sm font-medium text-primary-700">
                    {drug.name}
                  </span>
                </a>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-3">
              <a href={`/formulary/${issuer}/all`} className="underline hover:text-neutral-600">
                Browse all {isState ? stateName : issuerName} formulary drugs &rarr;
              </a>
            </p>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            COMPARISON LINKS — high SEO value "Drug A vs Drug B"
            ════════════════════════════════════════════════════════════════ */}
        {comparisonLinks.length > 0 && (
          <section aria-labelledby="compare-heading">
            <h2 id="compare-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Compare {titleCase(drugDisplay)}
            </h2>
            <div className="space-y-2">
              {comparisonLinks.map((comp) => (
                <a
                  key={comp.href}
                  href={comp.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                >
                  <span className="text-primary-400 group-hover:text-primary-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-primary-700 group-hover:text-primary-900">
                    {comp.label}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STATE + PLAN LINKS — contextual when state is selected
            ════════════════════════════════════════════════════════════════ */}
        {statePlanLinks.length > 0 && (
          <section aria-labelledby="state-links-heading">
            <h2 id="state-links-heading" className="text-lg font-semibold text-navy-800 mb-3">
              {stateName} Marketplace resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {statePlanLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block p-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm font-medium text-primary-700"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ═══ DETAILED DATA — Expandable table ═══ */}
        {results.length > 0 && (
          <section aria-labelledby="detail-table-heading">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div>
                  <h2 id="detail-table-heading" className="text-base font-semibold text-navy-800">
                    View detailed formulary entries
                  </h2>
                  <p className="text-sm text-neutral-500">
                    {groupByFormulation(results).length} formulation{groupByFormulation(results).length === 1 ? '' : 's'} across {results.length} plan{results.length === 1 ? '' : 's'}
                  </p>
                </div>
                <svg className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="mt-3">
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 text-left">
                        <th className="px-4 py-2.5 font-semibold text-navy-700">Formulation</th>
                        <th className="px-4 py-2.5 font-semibold text-navy-700">Tier</th>
                        <th className="px-4 py-2.5 font-semibold text-navy-700">Prior Authorization</th>
                        <th className="px-4 py-2.5 font-semibold text-navy-700">Step Therapy</th>
                        <th className="px-4 py-2.5 font-semibold text-navy-700">Quantity Limit</th>
                        <th className="px-4 py-2.5 font-semibold text-navy-700 text-right">Plans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupByFormulation(results).map((g, i) => {
                        const ht = humanizeTier(g.drug_tier)
                        return (
                          <tr
                            key={i}
                            className="border-t border-neutral-100 hover:bg-neutral-50"
                          >
                            <td className="px-4 py-2.5 font-medium">{g.drug_name}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ht.bg} ${ht.color}`}>
                                {ht.shortLabel}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <RestrictionBadge active={g.prior_authorization} />
                            </td>
                            <td className="px-4 py-2.5">
                              <RestrictionBadge active={g.step_therapy} />
                            </td>
                            <td className="px-4 py-2.5">
                              <RestrictionBadge active={g.quantity_limit} />
                            </td>
                            <td className="px-4 py-2.5 text-neutral-500 text-right whitespace-nowrap">
                              {g.planCount}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Source: CMS Machine-Readable PUF, {PLAN_YEAR} plan year
                </p>
              </div>
            </details>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            LEARN MORE — contextual educational links
            ════════════════════════════════════════════════════════════════ */}
        {educationalLinks.length > 0 && (
          <section aria-labelledby="learn-links-heading">
            <h2 id="learn-links-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Learn more
            </h2>
            <div className="space-y-2">
              {educationalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                >
                  <span className="text-primary-400 group-hover:text-primary-600 mt-0.5 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </span>
                  <div>
                    <span className="text-sm font-medium text-primary-700 group-hover:text-primary-900 block">
                      {link.label}
                    </span>
                    <span className="text-xs text-neutral-500">{link.context}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Entity Links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ════════════════════════════════════════════════════════════════
            SECTION 9: EDUCATIONAL EXPLAINERS (collapsed by default)
            Moved lower — supporting education, not the main answer
            ════════════════════════════════════════════════════════════════ */}
        {editorial && (
          <section aria-labelledby="learn-more-heading">
            <h2 id="learn-more-heading" className="text-sm font-semibold text-neutral-600 mb-3 uppercase tracking-wide">
              Understanding formulary coverage
            </h2>
            <div className="space-y-2">
              <ExpandableSection title="How formulary tiers work">
                <p className="mb-3">
                  Marketplace plans organize covered medications into tiers to manage costs. Here is why the system works the way it does — not just what the tiers are:
                </p>
                <ol className="space-y-3 list-decimal list-inside text-sm text-neutral-700 mb-3">
                  <li><strong>Tier 1 — Generic ($5–$20):</strong> Generics have no R&amp;D recoupment costs — the original patent has expired and multiple manufacturers compete, driving prices down. Insurers place generics at Tier 1 to steer utilization toward lower-cost options.</li>
                  <li><strong>Tier 2 — Preferred Brand ($30–$60):</strong> Brand-name drugs that pay rebates to pharmacy benefit managers (PBMs) in exchange for favorable tier placement. The rebate system means a drug&apos;s tier reflects negotiated pricing agreements, not just clinical effectiveness.</li>
                  <li><strong>Tier 3 — Non-Preferred Brand ($60–$100+):</strong> Brand drugs that did not negotiate preferred placement, or where a generic is available. The higher cost-sharing is deliberate — it incentivizes you to use the generic alternative.</li>
                  <li><strong>Tier 4 — Specialty (20–33% coinsurance):</strong> High-cost biologics and complex medications requiring clinical management, cold-chain distribution, or injection administration. Cost-sharing is often coinsurance, not a flat copay.</li>
                  <li><strong>Preventive ($0):</strong> Drugs on the federal preventive services list covered with zero cost-sharing regardless of deductible status — required by federal law.</li>
                </ol>
                <p className="text-sm text-neutral-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <strong>Why the same drug can be Tier 2 on one plan and Tier 4 on another:</strong> PBM rebate contracts differ by insurer. A drug&apos;s tier reflects the specific negotiated deal between the drug manufacturer and your insurer&apos;s PBM — not the drug&apos;s clinical profile. If your drug is on a high tier, ask your doctor to request a therapeutic substitution or file a tier exception.
                </p>
              </ExpandableSection>

              {hasPriorAuth && (
                <ExpandableSection title="What is prior authorization — and what to do when it&apos;s required">
                  <p className="mb-3">
                    Prior authorization (PA) means your insurer requires clinical justification before they will cover a medication. It is not a coverage denial — it is a prerequisite. Most PA requests that are properly documented are approved.
                  </p>
                  <p className="mb-3 font-medium text-navy-800">Step-by-step PA process:</p>
                  <ol className="space-y-2 list-decimal list-inside text-sm text-neutral-700 mb-3">
                    <li>Your doctor submits a PA request with diagnosis code, clinical rationale, and alternatives already tried.</li>
                    <li>Insurer clinical team reviews — standard timeline is 2–3 business days; urgent requests must be decided within 24–72 hours.</li>
                    <li>If approved: prescription proceeds normally. If denied: insurer must provide written denial with the specific clinical reason.</li>
                    <li>Your doctor can request a peer-to-peer review — a direct call between your doctor and the insurer&apos;s medical director. This overturns denials approximately 40–50% of the time.</li>
                    <li>If still denied: file a formal internal appeal. Marketplace plans are required to decide within 30 days (standard) or 72 hours (urgent).</li>
                    <li>If internal appeal fails: request an independent External Review Organization (IRO) review. The IRO decision is binding on the insurer under federal law.</li>
                  </ol>
                  <p className="text-sm text-neutral-600 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3">
                    <strong>Word-for-word call script:</strong> &ldquo;I am calling to request a prior authorization for [drug name] prescribed by Dr. [name] for [condition]. I need this medication within [X] days. Can you initiate an expedited review?&rdquo;
                  </p>
                </ExpandableSection>
              )}

              {hasStepTherapy && (
                <ExpandableSection title="What is step therapy — and your legal rights to override it">
                  <p className="mb-3">
                    Step therapy (also called &ldquo;fail first&rdquo;) requires you to try a lower-cost drug before the insurer will authorize the prescribed medication. This is a cost-containment strategy — insurers want you to attempt the cheaper option before they cover the more expensive one.
                  </p>
                  <p className="mb-3">
                    <strong>Why this matters:</strong> Step therapy can delay access to the right medication by weeks or months while you try drugs your doctor may already know will not work for you.
                  </p>
                  <p className="mb-2 font-medium text-navy-800">You have the right to request a step therapy override when:</p>
                  <ul className="space-y-1.5 text-sm list-disc list-inside text-neutral-700 mb-3">
                    <li>You have already tried and failed the required step drug</li>
                    <li>The required drug is contraindicated for your specific condition</li>
                    <li>The required drug would cause a clinically significant adverse reaction</li>
                    <li>Delay of treatment would cause significant irreversible harm (emergency override)</li>
                  </ul>
                  <p className="text-sm text-neutral-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <strong>State protections:</strong> States including NY, TX, CA, VA, IL, and others have enacted step therapy reform laws requiring insurers to respond to override requests within 72 hours for urgent cases. Your state insurance commissioner can enforce these protections if the insurer does not comply.
                  </p>
                </ExpandableSection>
              )}

              {hasQuantityLimit && (
                <ExpandableSection title="What are quantity limits — and how to request an exception">
                  <p className="mb-3">
                    Quantity limits (QL) restrict the amount of a drug dispensed per fill or per month. Common examples: 30 tablets per 30-day fill for controlled substances; 1 rescue inhaler per 30 days; 4 glucose test strips per day for diabetes.
                  </p>
                  <p className="mb-3">
                    <strong>Why QL exists:</strong> Insurers use quantity limits to prevent hoarding of controlled substances, align with clinical dosing guidelines, and flag unusual prescribing patterns. Some limits are clinically appropriate; others are not.
                  </p>
                  <p className="mb-2 font-medium text-navy-800">When QL is clinically inappropriate (grounds for exception):</p>
                  <ul className="space-y-1.5 text-sm list-disc list-inside text-neutral-700 mb-3">
                    <li>Your condition requires a higher dose than the standard limit (e.g., titration period)</li>
                    <li>You take split doses — twice-daily dosing of a once-daily-limited drug</li>
                    <li>You need breakthrough medication in addition to standard doses</li>
                    <li>Your prescriber documents that the limit is clinically inappropriate for your specific diagnosis</li>
                  </ul>
                  <p className="text-sm text-neutral-600 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3">
                    <strong>Practical tip:</strong> Ask your doctor to write &ldquo;Quantity limit exception required — medical necessity documented&rdquo; on the prescription. This signals to the pharmacy that a PA/exception is already in process.
                  </p>
                </ExpandableSection>
              )}

              <ExpandableSection title="How to request a formulary exception — full step-by-step guide">
                <p className="mb-3">
                  A formulary exception asks the insurer to cover a drug that is either off-formulary or placed on a higher tier than is clinically appropriate. This is distinct from a prior authorization — PA gets the drug covered at all; a formulary exception gets it covered at a lower cost tier.
                </p>
                <ol className="space-y-2.5 list-decimal list-inside text-sm text-neutral-700 mb-3">
                  <li><strong>Get the denial in writing.</strong> Request an Explanation of Benefits (EOB) or denial letter stating the exact reason for non-coverage.</li>
                  <li><strong>Call Member Services.</strong> Confirm the denial reason and get the exact fax number or portal address for exception submissions.</li>
                  <li><strong>Doctor submits exception package:</strong> diagnosis code, clinical rationale, alternatives tried and why they failed, letter of medical necessity.</li>
                  <li><strong>First-level internal appeal.</strong> Insurer must respond within 30 days (standard) or 72 hours (urgent). Urgent = when standard processing would seriously jeopardize your health.</li>
                  <li><strong>If denied: External IRO review.</strong> An independent reviewer makes a binding decision. The insurer must comply. You have this right under 45 CFR § 147.136.</li>
                  <li><strong>State insurance commissioner complaint.</strong> If the IRO is also denied (rare), file with your state insurance commissioner for regulatory enforcement.</li>
                </ol>
                <div className="text-sm text-neutral-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <strong>Success rate context:</strong> Internal appeals succeed approximately 40–50% of the time when properly documented. External IRO reviews overturn insurer decisions about 40% of the time. Filing an appeal is almost always worth attempting — the cost is your doctor&apos;s time, not yours.
                </div>
              </ExpandableSection>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION 10: FAQ
            ════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-lg font-semibold text-navy-800 mb-3">
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {formularyFaqs.map((faq, i) => (
              <details key={i} open={i === 0} className="group border border-neutral-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-neutral-50 transition-colors list-none">
                  <span className="font-medium text-navy-800 text-sm pr-4">{faq.question}</span>
                  <svg className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 11: DATA METHODOLOGY + SOURCES
            ════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="methodology-heading" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <h2 id="methodology-heading" className="text-sm font-semibold text-neutral-700 mb-2">Data Methodology</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Formulary data is derived from CMS Machine-Readable Public Use Files
            for plan year {PLAN_YEAR}. Drug tier placement, prior authorization requirements,
            and quantity limits may change during the plan year. Cost ranges shown are general
            estimates based on typical Marketplace plan cost-sharing structures and do not reflect
            your specific plan. Always verify coverage with your insurer before enrollment.
            Data is updated when CMS publishes new PUF releases.
          </p>
        </section>

        {/* ════ E-E-A-T: Author attribution ════ */}
        <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <p className="text-sm text-neutral-600">
            <strong>Reviewed by licensed health insurance professionals</strong> &bull; {siteConfig.operator.recognition} &bull; Licensed in {siteConfig.licensedStates.length}+ states &bull;{' '}
            <a
              href="/editorial-policy"
              className="text-primary-600 hover:underline"
            >
              Editorial policy &rarr;
            </a>
          </p>
        </section>

        <section aria-labelledby="sources-heading" className="rounded-xl border border-neutral-200 p-5">
          <h2 id="sources-heading" className="text-sm font-semibold text-neutral-700 mb-3">Sources</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://www.cms.gov/marketplace/resources/data/public-use-files"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline font-medium"
              >
                CMS Machine-Readable PUF ({PLAN_YEAR})
              </a>
              <span className="text-neutral-500"> — Standardized drug coverage data submitted by all ACA-certified plans. The primary source for all tier, PA, step therapy, and quantity limit data on this page.</span>
            </li>
            <li>
              <span className="font-medium text-neutral-700">CMS — ACA Formulary Requirements</span>
              <span className="text-neutral-500"> — Federal guidance on how formularies work in ACA Marketplace plans. Source: CMS.gov regulatory guidance.</span>
            </li>
            <li>
              <a
                href="https://www.needymeds.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline font-medium"
              >
                NeedyMeds.org
              </a>
              <span className="text-neutral-500"> — Patient assistance program database. Use to find manufacturer PAP programs for uninsured or underinsured patients.</span>
            </li>
            <li>
              <a
                href="https://www.rxassist.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline font-medium"
              >
                RxAssist.org
              </a>
              <span className="text-neutral-500"> — Comprehensive database of pharmaceutical manufacturer patient assistance programs.</span>
            </li>
            <li>
              <span className="font-medium text-neutral-700">42 CFR § 156.122</span>
              <span className="text-neutral-500"> — ACA formulary adequacy standards. Requires plans to cover at least one drug in each United States Pharmacopeia category.</span>
            </li>
            <li>
              <span className="font-medium text-neutral-700">45 CFR § 156.172</span>
              <span className="text-neutral-500"> — Exception and appeals requirements. Requires Marketplace plans to offer formulary exception processes and respond within 72 hours for urgent requests.</span>
            </li>
          </ul>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            RELATED COVERAGE GUIDES — bottom-of-page topical authority
            ════════════════════════════════════════════════════════════════ */}
        {relatedGuides.length > 0 && (
          <section aria-labelledby="related-guides-heading" className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5">
            <h2 id="related-guides-heading" className="text-base font-semibold text-navy-800 mb-3">
              Related coverage guides
            </h2>
            <div className="space-y-3">
              {relatedGuides.map((guide) => (
                <a
                  key={guide.href}
                  href={guide.href}
                  className="flex items-start gap-3 group"
                >
                  <span className="text-primary-400 group-hover:text-primary-600 mt-0.5 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                  <div>
                    <span className="text-sm font-medium text-primary-700 group-hover:text-primary-900 group-hover:underline block">
                      {guide.label}
                    </span>
                    <span className="text-xs text-neutral-500">{guide.context}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ═══ BOTTOM CTA — final conversion prompt ═══ */}
        <DrugPageCta
          variant="bottom"
          drugName={titleCase(drugDisplay)}
          stateCode={stateCode}
          stateName={stateName}
        />

        <GenericByline dataSource="CMS MR-PUF & carrier formulary files" planYear={PLAN_YEAR} />

        {/* ── Disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Formulary data sourced from the CMS Machine-Readable PUF, plan year{' '}
            {PLAN_YEAR}. Drug tier placement, prior authorization requirements,
            and quantity limits may change during the plan year. Always verify
            current coverage with your insurance carrier or at healthcare.gov.
          </p>
          <p>
            This page is for informational purposes only and does not constitute
            medical or insurance advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> to confirm
            formulary coverage for your specific plan.
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
  drugSlug,
  drugDisplay,
  stateName,
  isSBMState,
  exchangeName,
  exchangeUrl,
  allResults,
}: {
  issuer: string
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
    { name: 'Formulary', url: `${SITE_URL}/formulary` },
    { name: stateName, url: `${SITE_URL}/formulary/${issuer}/all` },
    { name: titleCase(drugDisplay), url: `${SITE_URL}/formulary/${issuer}/${drugSlug}` },
  ]
  const bSchema = buildBreadcrumbSchema(breadcrumbItems)

  return (
    <>
      <SchemaScript schema={bSchema} id="breadcrumb-schema" />
      <main className="max-w-3xl mx-auto px-4 py-10">

        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li><a href="/formulary" className="hover:underline text-primary-600">Formulary</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li><a href={`/formulary/${issuer}/all`} className="hover:underline text-primary-600">{stateName}</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{titleCase(drugDisplay)}</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-4">
          {titleCase(drugDisplay)} Formulary Coverage in {stateName}
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
                  ? `${stateName} marketplace plans enroll through ${exchangeName}, which maintains its own formulary database separate from the federal CMS dataset. To check if ${titleCase(drugDisplay)} is covered by a ${stateName} plan, use the ${exchangeName} plan finder directly.`
                  : `Formulary records for ${stateName} marketplace plans are not available in the current CMS dataset. This does not mean ${titleCase(drugDisplay)} is uncovered — check directly with your plan or the federal marketplace.`
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <a
            href={`/formulary/all/${drugSlug}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Search all states for {titleCase(drugDisplay)}
          </a>
          <a
            href={`/${stateCodeToSlug(issuer.toUpperCase())}/health-insurance-plans`}
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
              {new Set(allResults.map(r => (r.issuer_ids?.[0] ?? r.issuer_id))).size} insurers.
              {allResults[0]?.drug_tier && (
                <> It is typically listed as a {humanizeTier(allResults[0].drug_tier).shortLabel.toLowerCase()} drug.</>
              )}
            </p>
            <a href={`/formulary/all/${drugSlug}`} className="text-sm text-primary-600 font-semibold hover:text-primary-700">
              View national coverage details &rarr;
            </a>
          </div>
        )}

        <GenericByline dataSource="CMS MR-PUF & carrier formulary files" planYear={PLAN_YEAR} />

        <footer className="border-t border-neutral-200 mt-8 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Formulary data sourced from the CMS Machine-Readable PUF, plan year {PLAN_YEAR}.
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
// Layer 2 — Drug Clinical Context
// ---------------------------------------------------------------------------

function DrugClinicalContext({
  drugDisplay,
  drugSlug,
  issuer,
}: {
  drugDisplay: string
  drugSlug: string
  issuer: string
}) {
  const key = drugDisplay.toLowerCase().replace(/\s+/g, '-')
  const data = DRUG_CLINICAL_DATA[key] ?? DRUG_CLINICAL_DATA[drugDisplay.toLowerCase()]

  return (
    <section aria-labelledby="clinical-context-heading" className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-5">
      <h2 id="clinical-context-heading" className="text-lg font-semibold text-navy-800 mb-4">
        What Is {titleCase(drugDisplay)} Used For?
      </h2>

      {data ? (
        <>
          <div className="mb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary-700 bg-primary-100 rounded-full px-3 py-1 mb-2">
              {data.drugClass}
            </span>
            <p className="text-sm text-neutral-700 leading-relaxed">{data.indications}</p>
          </div>

          {(data.genericAlts.length > 0 || data.therapeuticAlts.length > 0 || data.otcAlts.length > 0) && (
            <>
              <h3 className="text-sm font-semibold text-navy-800 mb-3">
                Common Alternatives to {titleCase(drugDisplay)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.genericAlts.length > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Generic Alternatives</p>
                    <div className="space-y-2">
                      {data.genericAlts.map((alt) => (
                        <div key={alt.name}>
                          <a
                            href={`/formulary/${issuer}/${alt.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="text-sm font-medium text-primary-700 hover:underline"
                          >
                            {alt.name}
                          </a>
                          <p className="text-xs text-green-700 font-medium">{alt.tier}</p>
                          <p className="text-xs text-neutral-500">{alt.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.therapeuticAlts.length > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Therapeutic Alternatives</p>
                    <div className="space-y-2">
                      {data.therapeuticAlts.map((alt) => (
                        <div key={alt.name}>
                          <a
                            href={`/formulary/${issuer}/${alt.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                            className="text-sm font-medium text-primary-700 hover:underline"
                          >
                            {alt.name}
                          </a>
                          <p className="text-xs text-blue-700 font-medium">{alt.tier}</p>
                          <p className="text-xs text-neutral-500">{alt.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.otcAlts.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">OTC Alternatives</p>
                    <div className="space-y-2">
                      {data.otcAlts.map((alt) => (
                        <div key={alt.name}>
                          <span className="text-sm font-medium text-neutral-700">{alt.name}</span>
                          <p className="text-xs text-amber-700 font-medium">{alt.tier}</p>
                          <p className="text-xs text-neutral-500">{alt.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <p className="text-sm text-neutral-500 leading-relaxed">
          Clinical details for {titleCase(drugDisplay)} are not yet indexed in our database.
          A licensed agent can help you understand your coverage options and identify alternatives covered at a lower tier on your plan.{' '}
          <a href="/contact" className="text-primary-600 hover:underline font-medium">Get help &rarr;</a>
        </p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Layer 3 — Cash Price vs Insurance Comparison
// ---------------------------------------------------------------------------

function DrugCashPriceComparison({
  drugDisplay,
  dominantHumanTier,
  dominantGroup,
}: {
  drugDisplay: string
  dominantHumanTier: HumanTier
  dominantGroup: string
}) {
  // Estimate monthly copay midpoint for 90-day math
  const copayRange = dominantHumanTier.costRange
  const copayMidpoint = (() => {
    const match = copayRange.match(/\$(\d+)/)
    return match ? parseInt(match[1], 10) : null
  })()

  return (
    <section aria-labelledby="cash-price-heading" className="rounded-xl border border-neutral-200 p-5">
      <h2 id="cash-price-heading" className="text-lg font-semibold text-navy-800 mb-1">
        Cash Price vs. Insurance Cost
      </h2>
      <p className="text-xs text-neutral-500 mb-4">
        Insurance copays are post-deductible. If you have not met your deductible, your actual cost may be higher.
      </p>

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-left">
              <th className="px-4 py-2.5 font-semibold text-navy-700">Source</th>
              <th className="px-4 py-2.5 font-semibold text-navy-700">30-day cost</th>
              <th className="px-4 py-2.5 font-semibold text-navy-700 hidden sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-neutral-100">
              <td className="px-4 py-2.5 font-medium">
                <a href="https://www.goodrx.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  GoodRx
                </a>
                {dominantGroup === 'generic' ? ' (generic)' : ' (brand)'}
              </td>
              <td className="px-4 py-2.5 text-neutral-600">Check GoodRx &rarr;</td>
              <td className="px-4 py-2.5 text-neutral-500 text-xs hidden sm:table-cell">Varies by pharmacy &amp; ZIP code</td>
            </tr>
            <tr className="border-t border-neutral-100 bg-primary-50/30">
              <td className="px-4 py-2.5 font-medium">Insurance copay ({dominantHumanTier.shortLabel})</td>
              <td className="px-4 py-2.5 font-semibold text-primary-700">{dominantHumanTier.costRange}</td>
              <td className="px-4 py-2.5 text-neutral-500 text-xs hidden sm:table-cell">After deductible; may be higher pre-deductible</td>
            </tr>
            <tr className="border-t border-neutral-100">
              <td className="px-4 py-2.5 font-medium">90-day mail order</td>
              <td className="px-4 py-2.5 text-neutral-600">~67% of 3× 30-day cost</td>
              <td className="px-4 py-2.5 text-neutral-500 text-xs hidden sm:table-cell">Preferred pharmacy or mail-order program</td>
            </tr>
            {dominantGroup === 'generic' && (
              <tr className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-medium">
                  <a href="https://costplusdrugs.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    Cost Plus Drugs
                  </a>
                </td>
                <td className="px-4 py-2.5 text-neutral-600">Cost + 15% markup + $3</td>
                <td className="px-4 py-2.5 text-neutral-500 text-xs hidden sm:table-cell">Generic only — often dramatically lower than pharmacy cash price</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>Pre-deductible reality check:</strong> If you have not met your deductible, you pay the plan&apos;s full allowed amount — not the copay.
          For a {dominantHumanTier.shortLabel} drug with a {dominantHumanTier.costRange} listed copay, your pre-deductible cost may be $30–$120+ depending on your plan&apos;s negotiated rate with the pharmacy.
          GoodRx or Cost Plus Drugs often beat the pre-deductible insurance price significantly.
        </p>
      </div>

      {copayMidpoint !== null && (
        <p className="text-xs text-neutral-500 mt-3">
          <strong>90-day supply math:</strong> If your 30-day copay is ~${copayMidpoint}, a mail-order 90-day supply typically
          costs ~${Math.round(copayMidpoint * 2)} — saving ~${copayMidpoint} per quarter (${copayMidpoint * 4}/year).
        </p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Layer 4 — Manufacturer Assistance
// ---------------------------------------------------------------------------

function DrugManufacturerAssistance({ drugDisplay }: { drugDisplay: string }) {
  return (
    <section aria-labelledby="manufacturer-assistance-heading">
      <h2 id="manufacturer-assistance-heading" className="text-lg font-semibold text-navy-800 mb-3">
        Manufacturer &amp; Patient Assistance Programs
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1 */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Manufacturer Copay Card</p>
          <p className="text-sm text-neutral-700 leading-relaxed mb-2">
            Brand-drug manufacturers offer copay cards that can reduce your out-of-pocket cost by up to $150–$200/month.
          </p>
          <ul className="text-xs text-neutral-600 space-y-1 mb-3">
            <li><strong>Who qualifies:</strong> Commercially insured patients only — NOT Medicare or Medicaid (federal law prohibits this)</li>
            <li><strong>How to find:</strong> Search &ldquo;{drugDisplay} copay card&rdquo; or visit the manufacturer&apos;s patient services page</li>
          </ul>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            <strong>Warning:</strong> Copay accumulator programs may prevent this from counting toward your deductible — check your plan SBC.
          </p>
        </div>

        {/* Card 2 */}
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Patient Assistance Program (PAP)</p>
          <p className="text-sm text-neutral-700 leading-relaxed mb-2">
            If you are uninsured or cannot afford your medication, PAPs may provide the drug free or for $0–$10/month.
          </p>
          <ul className="text-xs text-neutral-600 space-y-1">
            <li><strong>Who qualifies:</strong> Typically uninsured or underinsured, income below 400% FPL</li>
            <li>
              <strong>Resources:</strong>{' '}
              <a href="https://www.needymeds.org" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">NeedyMeds.org</a>,{' '}
              <a href="https://www.rxassist.org" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">RxAssist.org</a>,
              manufacturer PAP portal
            </li>
          </ul>
        </div>

        {/* Card 3 */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">State Pharmaceutical Assistance (SPAP)</p>
          <p className="text-sm text-neutral-700 leading-relaxed mb-2">
            Many states offer drug assistance programs for seniors and low-income adults, often stacking with Medicare or Marketplace coverage.
          </p>
          <ul className="text-xs text-neutral-600 space-y-1">
            <li><strong>Who qualifies:</strong> Varies by state — often seniors or adults below 200–400% FPL</li>
            <li><strong>Resource:</strong> Your state Medicaid office or StateCoverageInfo.org</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Layer 6 — Patient Action Guide
// ---------------------------------------------------------------------------

function DrugPatientActionGuide({
  drugDisplay,
  drugSlug,
  stateCode,
}: {
  drugDisplay: string
  drugSlug: string
  stateCode?: string
}) {
  return (
    <section aria-labelledby="patient-action-heading" className="rounded-xl border-2 border-primary-200 bg-primary-50/40 p-5 sm:p-6">
      <h2 id="patient-action-heading" className="text-lg font-bold text-navy-900 mb-4">
        Your Action Guide for {titleCase(drugDisplay)} Coverage
      </h2>
      <p className="text-xs text-neutral-500 mb-5">
        A patient landing on this page with a coverage problem should be able to take action without Googling again.
      </p>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="flex-none w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0">1</div>
          <div>
            <p className="text-sm font-semibold text-navy-800 mb-1">Confirm your coverage</p>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Call the Member Services number on your insurance card and ask:{' '}
              <em>&ldquo;Is {drugDisplay} covered on my formulary, and what tier is it assigned to? Is prior authorization required?&rdquo;</em>
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="flex-none w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0">2</div>
          <div>
            <p className="text-sm font-semibold text-navy-800 mb-1">If covered but expensive — options in priority order</p>
            <ul className="text-sm text-neutral-600 space-y-1 mt-1">
              <li className="flex gap-2"><span className="text-primary-500 shrink-0">&rsaquo;</span> Compare <a href="https://www.goodrx.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">GoodRx</a> / <a href="https://costplusdrugs.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Cost Plus Drugs</a> cash price — often cheaper pre-deductible</li>
              <li className="flex gap-2"><span className="text-primary-500 shrink-0">&rsaquo;</span> Request 90-day supply via mail order — saves ~10–15% typically</li>
              <li className="flex gap-2"><span className="text-primary-500 shrink-0">&rsaquo;</span> Ask your doctor for a therapeutic alternative on a lower tier</li>
              <li className="flex gap-2"><span className="text-primary-500 shrink-0">&rsaquo;</span> Apply for manufacturer copay card (brand drugs only — not valid on Medicare/Medicaid)</li>
            </ul>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="flex-none w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center shrink-0">3</div>
          <div>
            <p className="text-sm font-semibold text-navy-800 mb-1">If not covered (non-formulary) — three paths</p>
            <div className="space-y-2 mt-1">
              <p className="text-sm text-neutral-600"><strong className="text-navy-700">Path A — Exception/override:</strong> Your prescriber submits a letter of medical necessity documenting why formulary alternatives are inappropriate for your condition.</p>
              <p className="text-sm text-neutral-600"><strong className="text-navy-700">Path B — Therapeutic substitution:</strong> Ask your doctor if a covered drug in the same class would work equally well for your diagnosis.</p>
              <p className="text-sm text-neutral-600"><strong className="text-navy-700">Path C — Plan change:</strong> If you are in Open Enrollment or have a qualifying SEP, switch to a plan that covers this drug. Verify the specific formulary before enrolling.</p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4">
          <div className="flex-none w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0">4</div>
          <div>
            <p className="text-sm font-semibold text-navy-800 mb-1">Find a plan that covers {titleCase(drugDisplay)}</p>
            <p className="text-sm text-neutral-600 leading-relaxed mb-2">
              Never enroll in a plan without checking the formulary. Tiers change every January 1 — always verify for the specific plan year.
            </p>
            <a
              href={`/formulary?drug=${encodeURIComponent(drugSlug)}`}
              className="inline-block text-sm font-semibold text-primary-700 hover:text-primary-900 hover:underline"
            >
              Search plans that cover {titleCase(drugDisplay)} &rarr;
            </a>
          </div>
        </div>

        {/* Step 5 */}
        <div className="flex gap-4">
          <div className="flex-none w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center shrink-0">5</div>
          <div>
            <p className="text-sm font-semibold text-navy-800 mb-1">Get expert help at no cost</p>
            <p className="text-sm text-neutral-600 leading-relaxed mb-2">
              A licensed agent can search all available plans in your area for drug coverage — at no cost to you.
            </p>
            <a
              href="/contact"
              className="inline-block px-4 py-2 bg-primary-700 text-white text-sm font-semibold rounded-lg hover:bg-primary-800 transition-colors"
            >
              Connect with an agent &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
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

function getUniqueIssuers(drugs: FormularyDrug[]): IssuerInfo[] {
  const seen = new Map<string, IssuerInfo>()
  for (const d of drugs) {
    const ids = d.issuer_ids ?? (d.issuer_id ? [d.issuer_id] : [])
    for (const id of ids) {
      if (!seen.has(id)) {
        const name = getIssuerName(id)
        if (!name) continue
        seen.set(id, { id, name, tier: d.drug_tier })
      }
    }
  }
  return [...seen.values()]
}
