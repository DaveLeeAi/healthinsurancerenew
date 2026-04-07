// lib/schema-markup.ts — JSON-LD schema generation for ACA pages

import type {
  PlanRecord,
  SubsidyRecord,
  SbcRecord,
  FormularyDrug,
  RateVolatilityRecord,
  DentalRecord,
  BillingScenario,
  LifeEventRecord,
  PolicyScenarioRecord,
} from './types'
import siteConfig from '../data/config/config.json'

// ─── Shared publisher constant ──────────────────────────────────────────────

const PUBLISHER = {
  '@type': 'Organization',
  name: 'HealthInsuranceRenew',
  url: 'https://healthinsurancerenew.com',
} as const

// ─── Organization ───────────────────────────────────────────────────────────

export interface OrganizationSchema {
  '@context': string
  '@type': string
  name: string
  url: string
  description: string
}

export function buildOrgSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HealthInsuranceRenew',
    url: 'https://healthinsurancerenew.com',
    description:
      'Health insurance marketplace data and tools for US consumers.',
  }
}

// ─── BreadcrumbList ─────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Builds a schema.org/BreadcrumbList for any page.
 * Pass an array of {name, url} from root to current page.
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ─── FAQPage ────────────────────────────────────────────────────────────────

export interface FAQSchema {
  '@context': string
  '@type': 'FAQPage'
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: { '@type': 'Answer'; text: string }
  }>
}

export function buildFAQSchema(faqs: Array<{ question: string; answer: string }>): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

// ─── Article ────────────────────────────────────────────────────────────────

export interface ArticleSchema {
  '@context': string
  '@type': 'Article'
  headline: string
  description: string
  author: { '@type': string; name: string; url?: string }
  publisher: { '@type': string; name: string; url: string }
  dateModified: string
  isBasedOn?: { '@type': string; name: string; url: string }
}

export function buildArticleSchema(params: {
  headline: string
  description: string
  dateModified: string
  dataSourceName?: string
  dataSourceUrl?: string
}): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.headline,
    description: params.description,
    author: {
      '@type': 'Organization',
      name: 'HealthInsuranceRenew Editorial Team',
      url: 'https://healthinsurancerenew.com/about/editorial-policy',
    },
    publisher: {
      '@type': 'Organization',
      name: 'HealthInsuranceRenew',
      url: 'https://healthinsurancerenew.com',
    },
    dateModified: params.dateModified,
    ...(params.dataSourceName && params.dataSourceUrl
      ? {
          isBasedOn: {
            '@type': 'Dataset',
            name: params.dataSourceName,
            url: params.dataSourceUrl,
          },
        }
      : {}),
  }
}

// ─── Article with Organization author (state plans pages) ────────────────────

/**
 * Builds Article schema with Organization author (licensed professionals) and
 * Dataset reference. Used on state-level plan pages for E-E-A-T signals.
 *
 * NOTE: Dave Lee name/NPN must NOT appear in schema on these pages.
 * Name/NPN only on homepage + /circle-of-champions.
 */
export function buildStatePlansArticleSchema(params: {
  headline: string
  description: string
  url: string
  dateModified: string
  stateName: string
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.headline,
    description: params.description,
    url: params.url,
    author: {
      '@type': 'Organization',
      name: 'HealthInsuranceRenew Editorial Team',
      url: 'https://healthinsurancerenew.com/editorial-policy',
    },
    editor: {
      '@type': 'Organization',
      name: 'HealthInsuranceRenew Editorial Team',
    },
    publisher: PUBLISHER,
    dateModified: params.dateModified,
    datePublished: '2025-11-01',
    isBasedOn: {
      '@type': 'Dataset',
      name: 'Federal Marketplace Plan Data',
      url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    },
    about: {
      '@type': 'State',
      name: params.stateName,
    },
  }
}

// ─── Dataset (generic) ──────────────────────────────────────────────────────

export interface DatasetSchema {
  '@context': string
  '@type': 'Dataset'
  name: string
  description: string
  url: string
  creator: { '@type': string; name: string }
  temporalCoverage: string
  spatialCoverage?: string
}

export function buildDatasetSchema(params: {
  name: string
  description: string
  url: string
  year: string
}): DatasetSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: params.name,
    description: params.description,
    url: params.url,
    creator: { '@type': 'Organization', name: 'HealthInsuranceRenew' },
    temporalCoverage: params.year,
  }
}

// ─── Pillar 1: Plans — Product with Offers ──────────────────────────────────

/**
 * Builds schema.org/Product for an ACA plan comparison page.
 * Each plan becomes an Offer with the age-40 benchmark premium as price.
 */
export function buildPlansProductSchema(params: {
  countyName: string
  stateCode: string
  planYear: number
  plans: Pick<PlanRecord, 'plan_id' | 'plan_name' | 'issuer_name' | 'metal_level' | 'premiums'>[]
}): object {
  const { countyName, stateCode, planYear, plans } = params
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Health Insurance Plans — ${countyName}, ${stateCode}`,
    description: `Compare marketplace health insurance plans available in ${countyName}, ${stateCode} for plan year ${planYear}. Source: federal marketplace plan data.`,
    publisher: PUBLISHER,
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.plan_name,
      price: plan.premiums?.age_40 ?? plan.premiums?.age_27 ?? 0,
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: plan.premiums?.age_40 ?? plan.premiums?.age_27 ?? 0,
        priceCurrency: 'USD',
        unitText: 'monthly premium (age 40 benchmark)',
      },
      availability: 'https://schema.org/InStock',
      validFrom: `${planYear}-01-01`,
      validThrough: `${planYear}-12-31`,
      seller: {
        '@type': 'Organization',
        name: plan.issuer_name,
      },
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'metal_level',
          value: plan.metal_level,
        },
        {
          '@type': 'PropertyValue',
          name: 'plan_id',
          value: plan.plan_id,
        },
      ],
    })),
  }
}

// ─── Pillar 2: Subsidy Calculator — FAQPage + GovernmentService ─────────────

/**
 * Builds FAQPage schema where each subsidy FPL tier is a Question/Answer pair,
 * plus a GovernmentService schema for the ACA APTC program.
 * Returns an array — inject both as separate <script> blocks.
 */
export function buildSubsidySchemas(params: {
  stateCode: string
  countyName: string
  subsidyRecord: Pick<SubsidyRecord, 'subsidy_estimates' | 'benchmark_silver_premium' | 'household_size'>
  planYear: number
}): object[] {
  const { stateCode, countyName, subsidyRecord, planYear } = params

  const tierFaqs = Object.entries(subsidyRecord.subsidy_estimates)
    .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => entry[1] !== undefined)
    .map(([key, tier]) => {
      const fplLabel = key.replace('fpl_', '').replace('_', '.')
      return {
        '@type': 'Question' as const,
        name: `What subsidy do I get at ${fplLabel}% FPL in ${countyName}, ${stateCode}?`,
        acceptedAnswer: {
          '@type': 'Answer' as const,
          text: `At ${fplLabel}% FPL (annual income ~$${tier.annual_income.toLocaleString()}), your estimated monthly APTC subsidy is $${tier.monthly_aptc.toFixed(2)}, reducing your net monthly premium to approximately $${tier.net_monthly_premium.toFixed(2)}. Based on the ${planYear} benchmark silver premium of $${subsidyRecord.benchmark_silver_premium.toFixed(2)}/month. Consult a licensed agent to confirm your eligibility.`,
        },
      }
    })

  const faqSchema: object = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tierFaqs,
  }

  const govServiceSchema: object = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'ACA Marketplace — Advance Premium Tax Credit (APTC)',
    description:
      'Federal subsidy program reducing marketplace health insurance premiums for eligible households based on income relative to the Federal Poverty Level (FPL). Administered via HealthCare.gov.',
    serviceType: 'Health Insurance Subsidy',
    provider: {
      '@type': 'GovernmentOrganization',
      name: 'Centers for Medicare & Medicaid Services (CMS)',
      url: 'https://www.cms.gov',
    },
    areaServed: {
      '@type': 'State',
      name: stateCode,
    },
    url: 'https://www.healthcare.gov/lower-costs/',
  }

  return [faqSchema, govServiceSchema]
}

// ─── Pillar 3: SBC Detail — Product + additionalProperty + MedicalEntity ────

/**
 * Builds schema.org/Product for an SBC detail page.
 * Each cost-sharing field becomes an additionalProperty.
 * Each coverage category is emitted as a MedicalEntity.
 * Returns an array — inject the Product first, then MedicalEntity schemas.
 */
export function buildSbcProductSchema(params: {
  plan: Pick<
    PlanRecord,
    | 'plan_id'
    | 'plan_name'
    | 'issuer_name'
    | 'metal_level'
    | 'plan_type'
    | 'state_code'
    | 'deductible_individual'
    | 'moop_individual'
  >
  sbc: Pick<SbcRecord, 'cost_sharing_grid' | 'exclusions'>
  planYear: number
}): object[] {
  const { plan, sbc, planYear } = params

  const additionalProperties: object[] = []

  if (plan.deductible_individual != null) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Individual Deductible',
      value: `$${plan.deductible_individual.toLocaleString()}`,
      unitCode: 'USD',
    })
  }
  if (plan.moop_individual != null) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Out-of-Pocket Maximum (Individual)',
      value: `$${plan.moop_individual.toLocaleString()}`,
      unitCode: 'USD',
    })
  }

  for (const [category, entry] of Object.entries(sbc.cost_sharing_grid)) {
    if (!entry) continue
    const label = category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    if (entry.copay_in_network != null) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: `${label} — In-Network Copay`,
        value: `$${entry.copay_in_network}`,
        unitCode: 'USD',
      })
    }
    if (entry.coinsurance_in_network != null) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: `${label} — In-Network Coinsurance`,
        value: `${(entry.coinsurance_in_network * 100).toFixed(0)}%`,
      })
    }
  }

  const coverageCategories: object[] = Object.keys(sbc.cost_sharing_grid).map((category) => ({
    '@context': 'https://schema.org',
    '@type': 'MedicalEntity',
    name: category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: `Coverage category included in ${plan.plan_name}`,
    medicineSystem: 'https://schema.org/WesternConventional',
    relevantSpecialty: category.includes('mental') ? 'Psychiatry' : undefined,
  }))

  const productSchema: object = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: plan.plan_name,
    description: `${plan.metal_level} ${plan.plan_type} health insurance plan offered by ${plan.issuer_name} in ${plan.state_code}. Plan year ${planYear}. Source: federal plan benefit documents.`,
    brand: {
      '@type': 'Brand',
      name: plan.issuer_name,
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      validFrom: `${planYear}-01-01`,
      validThrough: `${planYear}-12-31`,
      priceCurrency: 'USD',
      seller: {
        '@type': 'Organization',
        name: plan.issuer_name,
      },
    },
    additionalProperty: additionalProperties,
    publisher: PUBLISHER,
  }

  return [productSchema, ...coverageCategories]
}

// ─── Pillar 4: Rate Volatility — Dataset with distribution ──────────────────

/**
 * Builds an enhanced schema.org/Dataset for a rate volatility county page.
 * Includes distribution (downloadable source), temporal coverage, and spatial coverage.
 */
export function buildRateVolatilityDatasetSchema(params: {
  record: Pick<
    RateVolatilityRecord,
    'state_code' | 'county_fips' | 'plan_year' | 'carrier_count' | 'plan_count'
  >
  countyName: string
}): object {
  const { record, countyName } = params
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Health Insurance Rate Volatility — ${countyName}, ${record.state_code} (${record.plan_year})`,
    description: `Premium rate analytics for ${countyName} county, ${record.state_code}. ${record.plan_count} plans across ${record.carrier_count} carriers. Source: federal marketplace rate filings.`,
    url: `https://healthinsurancerenew.com/rates/${record.state_code.toLowerCase()}/${record.county_fips}`,
    creator: { '@type': 'Organization', name: 'HealthInsuranceRenew' },
    publisher: PUBLISHER,
    temporalCoverage: String(record.plan_year),
    spatialCoverage: {
      '@type': 'AdministrativeArea',
      name: `${countyName}, ${record.state_code}`,
    },
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://healthinsurancerenew.com/data/rate_volatility.json',
        name: 'Rate Volatility Dataset (federal data-derived)',
      },
    ],
    isBasedOn: {
      '@type': 'Dataset',
      name: 'Federal Marketplace Rate Filings',
      url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    },
  }
}

// ─── Pillar 6: Formulary — Drug + HealthInsurancePlan ───────────────────────

/**
 * Builds schema.org/Drug for a formulary drug detail page.
 * Links to HealthInsurancePlan via relatedDrug.
 * isAvailableGenerically is derived from drug_tier.
 */
export function buildFormularyDrugSchema(params: {
  drug: Pick<
    FormularyDrug,
    | 'drug_name'
    | 'rxnorm_id'
    | 'drug_tier'
    | 'issuer_name'
    | 'plan_id'
    | 'prior_authorization'
    | 'step_therapy'
    | 'quantity_limit'
  >
  issuerName?: string
  planYear?: number
}): object {
  const { drug, issuerName, planYear } = params

  const tierLabel = drug.drug_tier ?? 'Unknown'
  const isGeneric =
    tierLabel.toUpperCase().includes('GENERIC') ||
    tierLabel.toUpperCase().includes('ACA-PREVENTIVE')

  const restrictions: string[] = []
  if (drug.prior_authorization) restrictions.push('Prior Authorization Required')
  if (drug.step_therapy) restrictions.push('Step Therapy Required')
  if (drug.quantity_limit) restrictions.push('Quantity Limit Applies')

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Drug',
    name: drug.drug_name,
    drugClass: tierLabel,
    isAvailableGenerically: isGeneric,
    legalStatus:
      restrictions.length > 0 ? restrictions.join('; ') : 'No special access restrictions',
    publisher: PUBLISHER,
  }

  if (drug.rxnorm_id) {
    schema['identifier'] = {
      '@type': 'PropertyValue',
      propertyID: 'RxNorm',
      value: drug.rxnorm_id,
    }
  }

  if (drug.plan_id) {
    schema['relatedDrug'] = {
      '@type': 'HealthInsurancePlan',
      name: issuerName ?? drug.issuer_name ?? 'Marketplace Plan',
      identifier: drug.plan_id,
      ...(planYear
        ? { validFrom: `${planYear}-01-01`, validThrough: `${planYear}-12-31` }
        : {}),
    }
  }

  return schema
}

// ─── Pillar 7: Dental — HealthInsurancePlan ─────────────────────────────────

/**
 * Builds schema.org/HealthInsurancePlan for a dental plan detail page.
 * Coverage tiers (preventive, basic, major, ortho) use HealthPlanFormulary
 * as the closest available schema.org type for benefit tiers.
 */
export function buildDentalPlanSchema(params: {
  dental: DentalRecord
  planYear: number
}): object {
  const { dental, planYear } = params
  const cp = dental.coverage_percentages

  const pct = (val: number | null): string =>
    val != null ? `${Math.round(val)}% coverage` : 'Coverage varies'

  const benefitOptions: object[] = [
    {
      '@type': 'HealthPlanFormulary',
      name: 'Preventive Care',
      offersPrescriptionByMail: false,
      healthPlanDrugTier: pct(cp.preventive_adult),
    },
    {
      '@type': 'HealthPlanFormulary',
      name: 'Basic Restorative',
      offersPrescriptionByMail: false,
      healthPlanDrugTier: pct(cp.basic_adult),
    },
    {
      '@type': 'HealthPlanFormulary',
      name: 'Major Restorative',
      offersPrescriptionByMail: false,
      healthPlanDrugTier: pct(cp.major_adult),
    },
  ]

  if (dental.ortho_adult_covered) {
    benefitOptions.push({
      '@type': 'HealthPlanFormulary',
      name: 'Orthodontia',
      offersPrescriptionByMail: false,
      healthPlanDrugTier: pct(cp.ortho_adult),
    })
  }

  const additionalProperties: object[] = []
  const annualMax = dental.annual_maximum.individual_in_network
  if (annualMax != null) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Annual Maximum Benefit',
      value: `$${annualMax.toLocaleString()}`,
      unitCode: 'USD',
    })
  }
  const prevWait = dental.waiting_periods.preventive_months
  if (prevWait != null && prevWait > 0) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Waiting Period (Preventive)',
      value: `${prevWait} months`,
    })
  }
  const deductible = dental.deductible.individual_in_network
  if (deductible != null) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Individual Deductible',
      value: `$${deductible.toLocaleString()}`,
      unitCode: 'USD',
    })
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'HealthInsurancePlan',
    name: dental.plan_name,
    description: `${dental.metal_level} stand-alone dental plan (SADP) offered by ${dental.issuer_name} in ${dental.state_code}. Plan year ${planYear}. Source: federal dental plan data.`,
    identifier: dental.plan_id,
    healthPlanMarketingUrl: `https://healthinsurancerenew.com/dental/${dental.state_code.toLowerCase()}/${dental.plan_variant_id}`,
    healthPlanDrugOption: benefitOptions,
    additionalProperty: additionalProperties,
    offeredBy: {
      '@type': 'Organization',
      name: dental.issuer_name,
    },
    publisher: PUBLISHER,
  }
}

// ─── Pillar 8: Billing — MedicalProcedure ───────────────────────────────────

/**
 * Builds schema.org/MedicalProcedure for a billing intelligence scenario page.
 * CPT codes extracted from how_it_gets_coded become additionalProperty entries.
 */
export function buildBillingProcedureSchema(params: {
  scenario: BillingScenario
}): object {
  const { scenario } = params
  const cptCodes = extractCptCodes(scenario)

  const additionalProperties: object[] = cptCodes.map((cpt) => ({
    '@type': 'PropertyValue',
    name: 'CPT Code',
    value: cpt,
    propertyID: 'https://www.ama-assn.org/practice-management/cpt',
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: scenario.title,
    description: scenario.description,
    procedureType: {
      '@type': 'MedicalProcedureType',
      name: scenario.billing_category
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    additionalProperty: additionalProperties,
    recognizingAuthority: {
      '@type': 'Organization',
      name: 'American Medical Association (AMA)',
      url: 'https://www.ama-assn.org',
    },
    publisher: PUBLISHER,
  }
}

/** Extract all CPT codes from a billing scenario's nested coding structure. */
export function extractCptCodes(scenario: BillingScenario): string[] {
  const codes: string[] = []
  const coding = scenario.how_it_gets_coded
  if (coding.code_1?.cpt) codes.push(coding.code_1.cpt)
  if (coding.code_2?.cpt) codes.push(coding.code_2.cpt)
  for (const entry of coding.code_2_examples ?? []) codes.push(entry.cpt)
  for (const entry of coding.facility_codes ?? []) codes.push(entry.cpt)
  for (const entry of coding.physician_codes ?? []) codes.push(entry.cpt)
  for (const entry of coding.ancillary_codes ?? []) codes.push(entry.cpt)
  return [...new Set(codes)]
}

// ─── Pillar 9: Life Events — HowTo ──────────────────────────────────────────

/**
 * Builds schema.org/HowTo for a life event / SEP decision tree page.
 * Each action_step becomes a HowToStep. totalTime is the SEP window in minutes.
 */
export function buildLifeEventHowToSchema(params: {
  event: Pick<
    LifeEventRecord,
    'title' | 'trigger_description' | 'action_steps' | 'sep_details' | 'slug'
  >
}): object {
  const { event } = params
  const steps = event.action_steps ?? []
  const windowDays = event.sep_details.window_days ?? 60
  const windowMinutes = windowDays * 24 * 60

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `What to Do After ${event.title}`,
    description: `${event.trigger_description} You have a ${windowDays}-day Special Enrollment Period (SEP) to enroll in or change your marketplace health coverage.`,
    totalTime: `PT${windowMinutes}M`,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step,
      text: step,
      url: `https://healthinsurancerenew.com/life-events/${event.slug}#step-${index + 1}`,
    })),
    supply: [
      {
        '@type': 'HowToSupply',
        name: 'Qualifying life event documentation',
      },
      {
        '@type': 'HowToSupply',
        name: 'Social Security Number or immigration documents (if applicable)',
      },
    ],
    publisher: PUBLISHER,
  }
}

// ─── Pillar 10: Policy Scenarios — Dataset + MonetaryAmount ─────────────────

/**
 * Builds schema.org/Dataset with a companion schema.org/MonetaryAmount for
 * the enhanced credit cliff impact on an enhanced-credits county page.
 * Returns [datasetSchema, monetaryAmountSchema] — inject both as separate blocks.
 */
export function buildPolicyScenarioSchema(params: {
  record: Pick<PolicyScenarioRecord, 'state_code' | 'county_fips' | 'headline'>
  countyName: string
  planYear: number
}): object[] {
  const { record, countyName, planYear } = params
  const { headline } = record

  const datasetSchema: object = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `IRA Enhanced Credit Expiration Impact — ${countyName}, ${record.state_code}`,
    description: `Modeled impact of enhanced subsidy expiration on households in ${countyName}, ${record.state_code}. Based on ${planYear} benchmark premiums and IRS FPL tables.`,
    url: `https://healthinsurancerenew.com/enhanced-credits/${record.state_code.toLowerCase()}/${record.county_fips}`,
    creator: { '@type': 'Organization', name: 'HealthInsuranceRenew' },
    publisher: PUBLISHER,
    temporalCoverage: String(planYear),
    spatialCoverage: {
      '@type': 'AdministrativeArea',
      name: `${countyName}, ${record.state_code}`,
    },
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://healthinsurancerenew.com/data/policy_scenarios.json',
        name: 'Policy Scenarios Dataset (federal data + IRS-derived)',
      },
    ],
    isBasedOn: {
      '@type': 'Dataset',
      name: 'Federal Marketplace Rate Data and IRS Income Guidelines',
      url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    },
  }

  const creditCliffSchema: object = {
    '@context': 'https://schema.org',
    '@type': 'MonetaryAmount',
    name: `Monthly Premium Increase at Enhanced Credit Expiration — Age ${headline.age}, ${headline.fpl_percent}% FPL`,
    currency: 'USD',
    value: headline.monthly_increase_at_expiration,
    description: `If IRA enhanced subsidies expire, a ${headline.age}-year-old at ${headline.fpl_percent}% FPL ($${headline.annual_income.toLocaleString()}/yr) in ${countyName}, ${record.state_code} would pay an estimated $${headline.monthly_increase_at_expiration.toFixed(2)}/month more ($${headline.annual_increase_at_expiration.toFixed(2)}/year more). Consult a licensed agent to confirm your situation.`,
  }

  return [datasetSchema, creditCliffSchema]
}

// ─── WebPage (DESIGN.md Section 7) ──────────────────────────────────────────

/**
 * Builds a schema.org/WebPage for plan detail pages.
 * YMYL trust signals via reviewedBy + publisher + dateModified.
 */
export function buildWebPageSchema(params: {
  name: string
  description: string
  url: string
  dateModified: string
  /**
   * CSS selectors for content sections best suited for AI/voice extraction.
   * Renders a SpeakableSpecification block — signals to Google AI Overviews,
   * Perplexity, and ChatGPT Browse which sections are high-signal answer candidates.
   * Example: ['h1', '#plan-bluf', '#fit-summary-heading']
   */
  speakableCssSelectors?: string[]
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: params.name,
    description: params.description,
    url: params.url,
    dateModified: params.dateModified,
    reviewedBy: {
      '@type': 'Organization',
      name: 'Licensed Insurance Professionals',
      url: 'https://healthinsurancerenew.com/about/editorial-policy',
    },
    publisher: PUBLISHER,
    lastReviewed: params.dateModified,
    ...(params.speakableCssSelectors && params.speakableCssSelectors.length > 0
      ? {
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: params.speakableCssSelectors,
          },
        }
      : {}),
  }
}


// ─── FinancialProduct (plan) ─────────────────────────────────────────────────

/**
 * Builds a schema.org/FinancialProduct for ACA plan pages.
 * Complements the existing buildSbcProductSchema with the FinancialProduct type
 * for broader AI engine recognition of plan cost data.
 */
export function buildFinancialProductSchema(params: {
  planName: string
  issuerName: string
  description: string
  url: string
  areaServed: string
  annualPremiumAge40?: number
  deductibleIndividual?: number
  moopIndividual?: number
  metalLevel: string
}): object {
  const {
    planName,
    issuerName,
    description,
    url,
    areaServed,
    annualPremiumAge40,
    deductibleIndividual,
    moopIndividual,
    metalLevel,
  } = params

  const feesAndCommissionsSpecification = [
    annualPremiumAge40 != null
      ? {
          '@type': 'UnitPriceSpecification',
          name: 'Monthly Premium (Age 40)',
          priceCurrency: 'USD',
          price: annualPremiumAge40,
          unitText: 'MON',
        }
      : null,
    deductibleIndividual != null
      ? {
          '@type': 'UnitPriceSpecification',
          name: 'Individual Deductible',
          priceCurrency: 'USD',
          price: deductibleIndividual,
          unitText: 'ANN',
        }
      : null,
    moopIndividual != null
      ? {
          '@type': 'UnitPriceSpecification',
          name: 'Individual Out-of-Pocket Maximum',
          priceCurrency: 'USD',
          price: moopIndividual,
          unitText: 'ANN',
        }
      : null,
  ].filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: planName,
    description,
    url,
    provider: {
      '@type': 'Organization',
      name: issuerName,
    },
    // Explicit AdministrativeArea entity — enables plan→county graph relationship
    // for AI knowledge graph extraction (ChatGPT Browse, Perplexity, Google SGE).
    areaServed: {
      '@type': 'AdministrativeArea',
      name: areaServed,
    },
    category: `ACA Marketplace Health Insurance — ${metalLevel.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Plan`,
    feesAndCommissionsSpecification:
      feesAndCommissionsSpecification.length > 0
        ? feesAndCommissionsSpecification
        : undefined,
    isRelatedTo: {
      '@type': 'Service',
      name: 'ACA Marketplace Health Insurance',
      url: 'https://www.healthcare.gov',
    },
  }
}


// ─── Pillar 6b: Formulary Triple Schema — @graph with 6 types ─────────────────

/**
 * Builds a single @graph JSON-LD block for formulary pages containing:
 * Drug, MedicalWebPage, HealthInsurancePlan, Organization, BreadcrumbList, FAQPage.
 *
 * Matches V35 reference schema structure exactly. Single <script> block output.
 */
export function buildFormularyTripleSchema(params: {
  drugName: string
  drugSlug: string
  nonProprietaryName?: string
  rxcui?: string
  drugClass?: string
  stateSlug: string
  stateName: string
  canonical: string
  pageTitle: string
  metaDescription: string
  planYear: number
  hasPriorAuth: boolean
  hasStepTherapy: boolean
  hasQuantityLimit: boolean
  planCount: number
  costSharingSpecs: Array<{
    tierCategory: string
    copayRange: string
    copayOption: string
  }>
  breadcrumbItems: Array<{ name: string; url?: string }>
  faqItems: Array<{ question: string; answer: string }>
}): object {
  const {
    drugName, drugSlug, nonProprietaryName, rxcui, drugClass,
    stateSlug, stateName, canonical, pageTitle, metaDescription,
    planYear, hasPriorAuth, hasStepTherapy, hasQuantityLimit,
    costSharingSpecs, breadcrumbItems, faqItems,
  } = params

  const today = new Date().toISOString().split('T')[0]
  const orgId = 'https://healthinsurancerenew.com/#organization'

  // 1. Drug
  const drugNode: Record<string, unknown> = {
    '@type': 'Drug',
    '@id': `${canonical}#drug`,
    'name': drugName,
    'additionalProperty': [
      { '@type': 'PropertyValue', name: 'priorAuthorizationRequired', value: String(hasPriorAuth) },
      { '@type': 'PropertyValue', name: 'stepTherapyRequired', value: String(hasStepTherapy) },
      { '@type': 'PropertyValue', name: 'quantityLimitApplies', value: String(hasQuantityLimit) },
    ],
    'includedInHealthInsurancePlan': { '@id': `${canonical}#healthplan` },
  }
  if (nonProprietaryName) drugNode['nonProprietaryName'] = nonProprietaryName
  if (rxcui) drugNode['rxcui'] = rxcui
  if (drugClass) {
    drugNode['drugClass'] = { '@type': 'DrugClass', name: drugClass }
  }

  // 2. MedicalWebPage
  const medicalWebPage: Record<string, unknown> = {
    '@type': 'MedicalWebPage',
    '@id': `${canonical}#webpage`,
    'name': pageTitle,
    'description': metaDescription,
    'url': canonical,
    'inLanguage': 'en-US',
    'lastReviewed': today,
    'datePublished': `${planYear}-01-15`,
    'dateModified': today,
    'medicalAudience': { '@type': 'MedicalAudience', audienceType: 'Patient' },
    'speakable': { '@type': 'SpeakableSpecification', cssSelector: '.aeo-answer' },
    'about': { '@id': `${canonical}#drug` },
    'reviewedBy': { '@id': orgId },
    'author': { '@id': orgId },
    'publisher': { '@id': orgId },
  }

  // 3. HealthInsurancePlan → HealthPlanFormulary → HealthPlanCostSharingSpecification
  const healthPlan: Record<string, unknown> = {
    '@type': 'HealthInsurancePlan',
    '@id': `${canonical}#healthplan`,
    'name': `${stateName} ACA Marketplace Plans (${planYear})`,
    'healthPlanDrugOption': {
      '@type': 'HealthPlanFormulary',
      offersPrescriptionByMail: true,
      healthPlanCostSharingSpecification: costSharingSpecs.map(spec => ({
        '@type': 'HealthPlanCostSharingSpecification',
        healthPlanPharmacyCategory: spec.tierCategory,
        healthPlanCopay: spec.copayRange,
        healthPlanCopayOption: spec.copayOption,
      })),
    },
  }

  // 4. Organization
  const organization = {
    '@type': 'Organization',
    '@id': orgId,
    'name': 'HealthInsuranceRenew',
    'url': 'https://healthinsurancerenew.com',
    'description': 'ACA health insurance data and decision support',
  }

  // 5. BreadcrumbList
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbItems.map((item, index) => {
      const entry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      }
      if (item.url) entry['item'] = item.url
      return entry
    }),
  }

  // 6. FAQPage
  const faqPage = {
    '@type': 'FAQPage',
    'mainEntity': faqItems.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [drugNode, medicalWebPage, healthPlan, organization, breadcrumb, faqPage],
  }
}

// ─── WebApplication (DESIGN.md Section 7 — Tools) ─────────────────────────────

/**
 * Builds a schema.org/WebApplication for interactive tool pages.
 * Per DESIGN.md §7: Tools require WebApplication + BreadcrumbList.
 */
export function buildWebApplicationSchema(params: {
  name: string
  description: string
  url: string
  applicationCategory?: string
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: params.name,
    description: params.description,
    url: params.url,
    applicationCategory: params.applicationCategory ?? 'HealthApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: PUBLISHER,
  }
}
