// lib/entity-linker.ts — Cross-pillar entity linking engine

import type { PlanRecord } from './types'

const BASE_URL = 'https://healthinsurancerenew.com'
const CURRENT_YEAR = new Date().getFullYear()

// ─── Core types ──────────────────────────────────────────────────────────────

export interface EntityLink {
  label: string
  href: string
  type:
    | 'plan'
    | 'subsidy'
    | 'rate'
    | 'sbc'
    | 'formulary'
    | 'dental'
    | 'billing'
    | 'faq'
    | 'life-event'
    | 'policy-scenario'
  /** 0–100 — higher = more relevant. getRelatedEntities returns top 10 sorted desc. */
  relevanceScore: number
}

// ─── Canonical URL generator ─────────────────────────────────────────────────

export type PageType =
  | 'plans'
  | 'subsidy'
  | 'rates'
  | 'sbc'
  | 'formulary'
  | 'dental'
  | 'billing'
  | 'faq'
  | 'life-event'
  | 'policy-scenario'
  | 'plan-detail'

export interface CanonicalParams {
  state?: string
  county?: string
  plan_id?: string
  plan_variant?: string
  issuer?: string
  drug_name?: string
  cpt_code?: string
  category?: string
  slug?: string
  event_type?: string
}

/**
 * Returns an absolute URL for any page type given its route params.
 * Use this instead of hand-constructing href strings in page components.
 */
export function getCanonicalUrl(pageType: PageType, params: CanonicalParams): string {
  const st = params.state?.toLowerCase() ?? ''
  const county = params.county ?? ''

  switch (pageType) {
    case 'plans':
      return `${BASE_URL}/plans/${st}/${county}`
    case 'subsidy':
      return `${BASE_URL}/subsidies/${st}/${county}`
    case 'rates':
      return `${BASE_URL}/rates/${st}/${county}`
    case 'policy-scenario':
      return `${BASE_URL}/enhanced-credits/${st}/${county}`
    case 'plan-detail':
    case 'sbc':
      return `${BASE_URL}/plan-details/${params.plan_id ?? ''}`
    case 'formulary': {
      const drugSlug = (params.drug_name ?? '').toLowerCase().replace(/\s+/g, '-')
      return `${BASE_URL}/formulary/${params.issuer ?? 'all'}/${drugSlug}`
    }
    case 'dental':
      return `${BASE_URL}/dental/${st}/${params.plan_variant ?? ''}`
    case 'billing':
      return `${BASE_URL}/billing/${params.cpt_code ?? ''}`
    case 'faq':
      return `${BASE_URL}/faq/${params.category ?? ''}/${params.slug ?? ''}`
    case 'life-event':
      return `${BASE_URL}/life-events/${params.event_type ?? ''}`
  }
}

// ─── Primitive link builders (public — use in page components) ───────────────

export function planLink(planId: string, planName: string): EntityLink {
  return {
    href: `/plan-details/${planId}`,
    label: `View full plan details and SBC for ${planName}`,
    type: 'plan',
    relevanceScore: 80,
  }
}

export function countyPlansLink(
  stateCode: string,
  countyFips: string,
  countyName?: string
): EntityLink {
  const display = countyName ? `${countyName}, ${stateCode}` : `${stateCode} county ${countyFips}`
  return {
    href: `/plans/${stateCode.toLowerCase()}/${countyFips}`,
    label: `Compare ${CURRENT_YEAR} ACA health plans in ${display}`,
    type: 'plan',
    relevanceScore: 90,
  }
}

export function subsidyLink(
  stateCode: string,
  countyFips: string,
  countyName?: string
): EntityLink {
  const display = countyName ? `${countyName}, ${stateCode}` : `${stateCode} county ${countyFips}`
  return {
    href: `/subsidies/${stateCode.toLowerCase()}/${countyFips}`,
    label: `Calculate your APTC premium subsidy in ${display}`,
    type: 'subsidy',
    relevanceScore: 90,
  }
}

export function ratesLink(
  stateCode: string,
  countyFips: string,
  countyName?: string
): EntityLink {
  const display = countyName ? `${countyName}, ${stateCode}` : `${stateCode} county ${countyFips}`
  return {
    href: `/rates/${stateCode.toLowerCase()}/${countyFips}`,
    label: `View ${CURRENT_YEAR} premium rate trends in ${display}`,
    type: 'rate',
    relevanceScore: 85,
  }
}

/** @deprecated Use policyScenarioLink for clarity */
export function policyLink(
  stateCode: string,
  countyFips: string,
  countyName?: string
): EntityLink {
  return policyScenarioLink(stateCode, countyFips, countyName)
}

export function policyScenarioLink(
  stateCode: string,
  countyFips: string,
  countyName?: string
): EntityLink {
  const display = countyName ? `${countyName}, ${stateCode}` : stateCode
  return {
    href: `/enhanced-credits/${stateCode.toLowerCase()}/${countyFips}`,
    label: `See enhanced credit expiration impact for ${display} households`,
    type: 'policy-scenario',
    relevanceScore: 80,
  }
}

export function drugLink(drugName: string, issuer?: string): EntityLink {
  const slug = drugName.toLowerCase().replace(/\s+/g, '-')
  return {
    href: `/formulary/${issuer ?? 'all'}/${slug}`,
    label: `Check ${drugName} formulary coverage across ACA plans`,
    type: 'formulary',
    relevanceScore: 75,
  }
}

export function lifeEventLink(slug: string, title: string): EntityLink {
  return {
    href: `/life-events/${slug}`,
    label: `What to do after ${title.toLowerCase()}`,
    type: 'life-event',
    relevanceScore: 70,
  }
}

export function faqLink(category: string, slug: string, question: string): EntityLink {
  return {
    href: `/faq/${category}/${slug}`,
    label: question,
    type: 'faq',
    relevanceScore: 65,
  }
}

export function dentalLink(
  stateCode: string,
  planVariantId: string,
  planName: string
): EntityLink {
  return {
    href: `/dental/${stateCode.toLowerCase()}/${planVariantId}`,
    label: `View dental coverage details for ${planName}`,
    type: 'dental',
    relevanceScore: 70,
  }
}

export function sbcLink(planId: string, planName: string): EntityLink {
  return {
    href: `/plan-details/${planId}`,
    label: `View full SBC cost-sharing details for ${planName}`,
    type: 'sbc',
    relevanceScore: 75,
  }
}

// ─── PageContext discriminated union ─────────────────────────────────────────
//
// Used by getRelatedEntities() — typed discriminated union instead of `any`
// per CLAUDE.md strict TypeScript requirement (no `any`).

export type PageContext =
  | {
      pageType: 'plans'
      state: string
      county: string
      countyName: string
      plans: Pick<
        PlanRecord,
        'plan_id' | 'plan_name' | 'issuer_name' | 'metal_level' | 'plan_variant_id'
      >[]
    }
  | { pageType: 'subsidy'; state: string; county: string; countyName: string }
  | { pageType: 'rates'; state: string; county: string; countyName: string }
  | { pageType: 'policy-scenario'; state: string; county: string; countyName: string }
  | {
      pageType: 'plan-detail'
      plan: Pick<
        PlanRecord,
        | 'plan_id'
        | 'plan_name'
        | 'issuer_name'
        | 'state_code'
        | 'county_fips'
        | 'plan_variant_id'
      >
      countyName?: string
      /** Whether a formulary index entry exists for this plan's issuer */
      hasFormularyData: boolean
      /** Whether a dental SADP with the same issuer exists for this state */
      hasDentalEquivalent: boolean
    }
  | {
      pageType: 'sbc'
      plan: Pick<
        PlanRecord,
        | 'plan_id'
        | 'plan_name'
        | 'issuer_name'
        | 'state_code'
        | 'county_fips'
        | 'plan_variant_id'
      >
      countyName?: string
    }
  | {
      pageType: 'formulary'
      drugName: string
      issuer: string
      /** Plan IDs that include this drug — used to link to plan detail pages */
      relatedPlanIds: string[]
      state?: string
      county?: string
      countyName?: string
    }
  | {
      pageType: 'faq'
      category: string
      slug: string
      question: string
      tags?: string[]
      /** Optional county context for geo-targeted links */
      state?: string
      county?: string
      countyName?: string
    }
  | {
      pageType: 'billing'
      billingCategory: string
      cptCodes?: string[]
      /** Optional county context for cost-sharing plan links */
      state?: string
      county?: string
      countyName?: string
    }
  | {
      pageType: 'life-event'
      slug: string
      title: string
      category: string
      sepWindowDays: number
      state?: string
      county?: string
      countyName?: string
    }
  | {
      pageType: 'dental'
      state: string
      county?: string
      countyName?: string
      planVariantId: string
      issuerName: string
      planName: string
    }

// ─── Internal helpers ────────────────────────────────────────────────────────

function sortAndSlice(links: EntityLink[], limit = 10): EntityLink[] {
  return [...links].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit)
}

function countyDisplay(state: string, county: string, countyName?: string): string {
  return countyName
    ? `${countyName}, ${state.toUpperCase()}`
    : `${state.toUpperCase()} county ${county}`
}

const BILLING_TO_FAQ_TAGS: Record<string, string[]> = {
  surprise_billing:   ['balance_billing', 'no_surprises', 'out_of_network'],
  mental_health:      ['mental_health', 'parity', 'behavioral'],
  prior_auth:         ['prior_authorization', 'appeals', 'denial'],
  prescription:       ['formulary', 'drug_coverage', 'tier'],
  preventive:         ['preventive', 'aca_mandate', 'free_services'],
  emergency:          ['emergency', 'out_of_network', 'er'],
  specialist:         ['specialist', 'referral', 'hmo'],
  hospital:           ['inpatient', 'deductible', 'moop'],
  premium_tax_credit: ['aptc', 'subsidy', 'fpl', 'reconciliation'],
}

const LIFE_EVENT_TO_FAQ_TAGS: Record<string, string[]> = {
  job_change:    ['loss_of_coverage', 'sep', 'cobra', 'enrollment'],
  job_loss:      ['loss_of_coverage', 'sep', 'cobra', 'enrollment'],
  marriage:      ['household', 'sep', 'enrollment'],
  birth:         ['household', 'sep', 'enrollment', 'newborn'],
  divorce:       ['household', 'sep', 'enrollment'],
  turning_26:    ['sep', 'enrollment', 'young_adult'],
  medicare:      ['medicare', 'sep', 'turning_65'],
  move:          ['sep', 'enrollment', 'new_address'],
  income_change: ['aptc', 'subsidy', 'fpl', 'reporting'],
}

// Kept for potential future use in tag-weighted scoring
const _BILLING_TO_FAQ_TAGS = BILLING_TO_FAQ_TAGS
void _BILLING_TO_FAQ_TAGS

// ─── getRelatedEntities ───────────────────────────────────────────────────────

/**
 * Returns the top 10 most relevant cross-links for the given page context.
 *
 * Uses a discriminated union (PageContext) instead of `pageData: any`
 * per CLAUDE.md strict TypeScript standards. The `pageType` discriminant
 * drives full type narrowing in each branch.
 */
export function getRelatedEntities(ctx: PageContext): EntityLink[] {
  switch (ctx.pageType) {
    case 'plans':
      return buildCountyLinks(ctx.state, ctx.county, ctx.countyName, 'plans')
    case 'subsidy':
      return buildCountyLinks(ctx.state, ctx.county, ctx.countyName, 'subsidy')
    case 'rates':
      return buildCountyLinks(ctx.state, ctx.county, ctx.countyName, 'rates')
    case 'policy-scenario':
      return buildCountyLinks(ctx.state, ctx.county, ctx.countyName, 'policy-scenario')
    case 'plan-detail':
      return buildPlanDetailLinks(ctx)
    case 'sbc':
      return buildSbcLinks(ctx)
    case 'formulary':
      return buildFormularyLinks(ctx)
    case 'faq':
      return buildFaqLinks(ctx)
    case 'billing':
      return buildBillingLinks(ctx)
    case 'life-event':
      return buildLifeEventLinks(ctx)
    case 'dental':
      return buildDentalLinks(ctx)
  }
}

// ─── County pages — always cross-link to all other county pillar pages ────────

function buildCountyLinks(
  state: string,
  county: string,
  countyName: string,
  current: 'plans' | 'subsidy' | 'rates' | 'policy-scenario'
): EntityLink[] {
  const cn = countyDisplay(state, county, countyName)
  const st = state.toLowerCase()
  const links: EntityLink[] = []

  if (current !== 'plans') {
    links.push({
      href: `/plans/${st}/${county}`,
      label: `Compare ${CURRENT_YEAR} ACA health plans available in ${cn}`,
      type: 'plan',
      relevanceScore: 95,
    })
  }
  if (current !== 'subsidy') {
    links.push({
      href: `/subsidies/${st}/${county}`,
      label: `Calculate your ${CURRENT_YEAR} APTC premium subsidy in ${cn}`,
      type: 'subsidy',
      relevanceScore: 95,
    })
  }
  if (current !== 'rates') {
    links.push({
      href: `/rates/${st}/${county}`,
      label: `View ${CURRENT_YEAR} premium rate trends and carrier competition in ${cn}`,
      type: 'rate',
      relevanceScore: 90,
    })
  }
  if (current !== 'policy-scenario') {
    links.push({
      href: `/enhanced-credits/${st}/${county}`,
      label: `See enhanced credit expiration impact for ${cn} households`,
      type: 'policy-scenario',
      relevanceScore: 85,
    })
  }
  links.push({
    href: '/life-events/job-loss',
    label: 'Lost employer coverage? Your 60-day SEP window explained',
    type: 'life-event',
    relevanceScore: 70,
  })
  links.push({
    href: '/life-events/turning-26',
    label: 'Turning 26 and losing parent plan coverage — ACA enrollment guide',
    type: 'life-event',
    relevanceScore: 65,
  })
  links.push({
    href: '/faq/enrollment/when-is-aca-open-enrollment',
    label: 'When does ACA open enrollment start and end each year?',
    type: 'faq',
    relevanceScore: 60,
  })

  return sortAndSlice(links)
}

// ─── Plan detail pages ───────────────────────────────────────────────────────

function buildPlanDetailLinks(
  ctx: Extract<PageContext, { pageType: 'plan-detail' }>
): EntityLink[] {
  const { plan, countyName, hasFormularyData, hasDentalEquivalent } = ctx
  const st = plan.state_code
  const county = plan.county_fips
  const cn = countyDisplay(st, county ?? '', countyName)
  const links: EntityLink[] = []

  if (county) {
    links.push({
      href: `/plans/${st.toLowerCase()}/${county}`,
      label: `Compare all ${CURRENT_YEAR} ACA plans in ${cn}`,
      type: 'plan',
      relevanceScore: 92,
    })
    links.push({
      href: `/subsidies/${st.toLowerCase()}/${county}`,
      label: `Calculate subsidy eligibility for plans in ${cn}`,
      type: 'subsidy',
      relevanceScore: 88,
    })
    links.push({
      href: `/rates/${st.toLowerCase()}/${county}`,
      label: `View ${CURRENT_YEAR} premium rate volatility history in ${cn}`,
      type: 'rate',
      relevanceScore: 80,
    })
    links.push({
      href: `/enhanced-credits/${st.toLowerCase()}/${county}`,
      label: `See enhanced credit expiration impact for ${cn} households`,
      type: 'policy-scenario',
      relevanceScore: 75,
    })
  }

  if (hasFormularyData) {
    const issuerSlug = plan.issuer_name.toLowerCase().replace(/\s+/g, '-')
    links.push({
      href: `/formulary/${issuerSlug}/all`,
      label: `Search ${plan.issuer_name} drug formulary — covered tiers and restrictions`,
      type: 'formulary',
      relevanceScore: 82,
    })
  }

  if (hasDentalEquivalent && plan.plan_variant_id) {
    links.push({
      href: `/dental/${st.toLowerCase()}/${plan.plan_variant_id}`,
      label: `Stand-alone dental plans (SADPs) available in ${st} from ${plan.issuer_name}`,
      type: 'dental',
      relevanceScore: 72,
    })
  }

  links.push({
    href: '/faq/cost_sharing/what-counts-toward-deductible',
    label: 'What medical expenses count toward my ACA deductible?',
    type: 'faq',
    relevanceScore: 68,
  })
  links.push({
    href: '/faq/enrollment/can-i-switch-plans-mid-year',
    label: 'Can I switch ACA plans mid-year without a qualifying life event?',
    type: 'faq',
    relevanceScore: 62,
  })

  return sortAndSlice(links)
}

// ─── SBC pages ───────────────────────────────────────────────────────────────

function buildSbcLinks(ctx: Extract<PageContext, { pageType: 'sbc' }>): EntityLink[] {
  const { plan, countyName } = ctx
  const st = plan.state_code
  const county = plan.county_fips
  const cn = countyDisplay(st, county ?? '', countyName)
  const links: EntityLink[] = []

  links.push({
    href: `/plan-details/${plan.plan_id}`,
    label: `Full plan overview for ${plan.plan_name}`,
    type: 'plan',
    relevanceScore: 95,
  })

  if (county) {
    links.push({
      href: `/plans/${st.toLowerCase()}/${county}`,
      label: `Compare all ${CURRENT_YEAR} ACA plans in ${cn}`,
      type: 'plan',
      relevanceScore: 88,
    })
    links.push({
      href: `/subsidies/${st.toLowerCase()}/${county}`,
      label: `Calculate subsidy eligibility for plans in ${cn}`,
      type: 'subsidy',
      relevanceScore: 82,
    })
  }

  const issuerSlug = plan.issuer_name.toLowerCase().replace(/\s+/g, '-')
  links.push({
    href: `/formulary/${issuerSlug}/all`,
    label: `Search ${plan.issuer_name} drug formulary covered under this plan`,
    type: 'formulary',
    relevanceScore: 80,
  })
  links.push({
    href: '/faq/cost_sharing/how-does-coinsurance-work',
    label: 'How does coinsurance work after meeting your ACA deductible?',
    type: 'faq',
    relevanceScore: 72,
  })
  links.push({
    href: '/billing/prior_auth',
    label: 'Prior authorization — when your insurer can require approval before treatment',
    type: 'billing',
    relevanceScore: 68,
  })
  links.push({
    href: '/billing/surprise_billing',
    label: 'Surprise billing protections — your rights under the No Surprises Act',
    type: 'billing',
    relevanceScore: 65,
  })

  return sortAndSlice(links)
}

// ─── Formulary pages ─────────────────────────────────────────────────────────

function buildFormularyLinks(
  ctx: Extract<PageContext, { pageType: 'formulary' }>
): EntityLink[] {
  const { drugName, issuer, relatedPlanIds, state, county, countyName } = ctx
  const links: EntityLink[] = []

  relatedPlanIds.slice(0, 3).forEach((planId, i) => {
    links.push({
      href: `/plan-details/${planId}`,
      label: `View plan details and full SBC for an ACA plan covering ${drugName}`,
      type: 'plan',
      relevanceScore: 90 - i * 4,
    })
  })

  const issuerSlug = issuer.toLowerCase().replace(/\s+/g, '-')
  links.push({
    href: `/formulary/${issuerSlug}/all`,
    label: `Browse all drugs covered by ${issuer} ACA plans`,
    type: 'formulary',
    relevanceScore: 85,
  })

  if (state && county) {
    const cn = countyDisplay(state, county, countyName)
    links.push({
      href: `/plans/${state.toLowerCase()}/${county}`,
      label: `Compare ACA plans in ${cn} that cover ${drugName}`,
      type: 'plan',
      relevanceScore: 80,
    })
    links.push({
      href: `/subsidies/${state.toLowerCase()}/${county}`,
      label: `Check subsidy eligibility to lower your monthly plan premium in ${cn}`,
      type: 'subsidy',
      relevanceScore: 72,
    })
  }

  links.push({
    href: '/faq/formulary/what-is-prior-authorization',
    label: 'What is prior authorization and how do I appeal a denial?',
    type: 'faq',
    relevanceScore: 75,
  })
  links.push({
    href: '/faq/formulary/generic-vs-brand-drug-coverage',
    label: 'Generic vs brand-name drugs — which tier costs less on ACA plans?',
    type: 'faq',
    relevanceScore: 68,
  })
  links.push({
    href: '/billing/prescription',
    label: 'How ACA prescription drug billing works — copays, tiers, and quantity limits',
    type: 'billing',
    relevanceScore: 65,
  })

  return sortAndSlice(links)
}

// ─── FAQ pages ───────────────────────────────────────────────────────────────

function buildFaqLinks(ctx: Extract<PageContext, { pageType: 'faq' }>): EntityLink[] {
  const { category, question, tags, state, county, countyName } = ctx
  const links: EntityLink[] = []

  if (state && county) {
    const cn = countyDisplay(state, county, countyName)
    links.push({
      href: `/subsidies/${state.toLowerCase()}/${county}`,
      label: `Calculate your ${CURRENT_YEAR} APTC subsidy in ${cn}`,
      type: 'subsidy',
      relevanceScore: 88,
    })
    links.push({
      href: `/plans/${state.toLowerCase()}/${county}`,
      label: `Compare ${CURRENT_YEAR} ACA plans available in ${cn}`,
      type: 'plan',
      relevanceScore: 85,
    })
  }

  // Keyword-based boost for subsidy/APTC questions
  const qLower = question.toLowerCase()
  if (qLower.includes('subsid') || qLower.includes('fpl') || qLower.includes('aptc')) {
    if (state && county) {
      links.push({
        href: `/subsidies/${state.toLowerCase()}/${county}`,
        label: 'Use the APTC subsidy calculator for your county',
        type: 'subsidy',
        relevanceScore: 92,
      })
    }
    links.push({
      href: '/life-events/income-change',
      label: 'Income change mid-year — how to update your APTC to avoid repayment',
      type: 'life-event',
      relevanceScore: 78,
    })
  }

  const categoryLinkMap: Partial<Record<string, EntityLink[]>> = {
    cost_sharing: [
      { href: '/billing/split_billing', label: 'How split billing works at in-network facilities', type: 'billing', relevanceScore: 82 },
      { href: '/billing/prior_auth', label: 'Prior authorization — when your insurer requires pre-approval', type: 'billing', relevanceScore: 78 },
      { href: '/billing/surprise_billing', label: 'Surprise billing — federal protections under the No Surprises Act', type: 'billing', relevanceScore: 74 },
    ],
    enrollment: [
      { href: '/life-events/job-loss', label: 'Lost employer coverage — your 60-day SEP window explained', type: 'life-event', relevanceScore: 82 },
      { href: '/life-events/turning-26', label: 'Turning 26 and aging off a parent plan — how to enroll', type: 'life-event', relevanceScore: 78 },
      { href: '/life-events/marriage', label: 'Getting married — adding a spouse to ACA coverage', type: 'life-event', relevanceScore: 74 },
    ],
    sep: [
      { href: '/life-events/job-loss', label: 'Job loss SEP — what triggers it and when your window opens', type: 'life-event', relevanceScore: 88 },
      { href: '/life-events/marriage', label: 'Marriage SEP — 60 days to enroll or change your ACA plan', type: 'life-event', relevanceScore: 82 },
      { href: '/life-events/move', label: 'Moving to a new area — does your current ACA plan transfer?', type: 'life-event', relevanceScore: 78 },
    ],
    subsidy: [
      { href: '/life-events/income-change', label: 'Income change mid-year — updating your APTC the right way', type: 'life-event', relevanceScore: 84 },
      { href: '/billing/premium_tax_credit', label: 'How premium tax credits are reconciled at tax filing time', type: 'billing', relevanceScore: 80 },
      { href: '/enhanced-credits', label: 'Enhanced ACA credits — what happens if they expire', type: 'policy-scenario', relevanceScore: 76 },
    ],
    formulary: [
      { href: '/billing/prescription', label: 'ACA prescription drug billing — how tiers and copays work', type: 'billing', relevanceScore: 82 },
      { href: '/billing/prior_auth', label: 'Prior authorization for specialty drugs — your appeal rights', type: 'billing', relevanceScore: 78 },
    ],
    appeals: [
      { href: '/billing/prior_auth', label: 'Prior authorization denial — your right to internal and external appeal', type: 'billing', relevanceScore: 88 },
      { href: '/faq/appeals/how-to-file-external-appeal', label: 'How to file an external appeal for a denied ACA claim', type: 'faq', relevanceScore: 82 },
      { href: '/billing/surprise_billing', label: 'Surprise billing dispute process — step by step', type: 'billing', relevanceScore: 76 },
    ],
    dental: [
      { href: '/dental', label: 'Compare stand-alone dental plans (SADPs) on the ACA marketplace', type: 'dental', relevanceScore: 85 },
      { href: '/billing/preventive', label: 'Preventive dental care — what ACA plans must cover at no cost', type: 'billing', relevanceScore: 78 },
    ],
  }

  const catLinks = categoryLinkMap[category] ?? []
  links.push(...catLinks)

  // Tag-based additions
  if (tags && tags.length > 0) {
    const tagSet = new Set(tags.map((t) => t.toLowerCase()))
    if (tagSet.has('billing') || tagSet.has('eob') || tagSet.has('balance')) {
      links.push({
        href: '/billing/surprise_billing',
        label: 'Surprise medical billing — federal protections explained',
        type: 'billing',
        relevanceScore: 70,
      })
    }
    if (tagSet.has('dental') || tagSet.has('orthodontia')) {
      links.push({
        href: '/dental',
        label: 'Compare stand-alone dental plans available on the ACA marketplace',
        type: 'dental',
        relevanceScore: 68,
      })
    }
  }

  return sortAndSlice(links)
}

// ─── Billing pages ───────────────────────────────────────────────────────────

function buildBillingLinks(ctx: Extract<PageContext, { pageType: 'billing' }>): EntityLink[] {
  const { billingCategory, state, county, countyName } = ctx
  const links: EntityLink[] = []

  if (state && county) {
    const cn = countyDisplay(state, county, countyName)
    links.push({
      href: `/plans/${state.toLowerCase()}/${county}`,
      label: `Compare ${CURRENT_YEAR} ACA plans with the best cost-sharing in ${cn}`,
      type: 'plan',
      relevanceScore: 90,
    })
    links.push({
      href: `/subsidies/${state.toLowerCase()}/${county}`,
      label: `Lower your out-of-pocket costs with an APTC subsidy in ${cn}`,
      type: 'subsidy',
      relevanceScore: 82,
    })
  }

  if (billingCategory === 'prior_auth' || billingCategory === 'appeals') {
    links.push({
      href: '/faq/appeals/how-to-appeal-prior-auth-denial',
      label: 'How to appeal a prior authorization denial — step-by-step guide',
      type: 'faq',
      relevanceScore: 90,
    })
  }
  if (billingCategory === 'surprise_billing') {
    links.push({
      href: '/faq/billing/no-surprises-act-protections',
      label: 'Your rights under the No Surprises Act for unexpected out-of-network bills',
      type: 'faq',
      relevanceScore: 88,
    })
  }
  if (billingCategory === 'prescription') {
    links.push({
      href: '/formulary/all/lisinopril',
      label: 'Search which ACA plans cover your prescriptions and at what tier',
      type: 'formulary',
      relevanceScore: 82,
    })
    links.push({
      href: '/faq/formulary/what-is-prior-authorization',
      label: 'What is prior authorization for prescription drugs?',
      type: 'faq',
      relevanceScore: 78,
    })
  }
  if (billingCategory === 'mental_health') {
    links.push({
      href: '/faq/cost_sharing/mental-health-parity-aca',
      label: 'Mental health parity under the ACA — what plans are required to cover',
      type: 'faq',
      relevanceScore: 85,
    })
  }
  if (billingCategory === 'premium_tax_credit') {
    links.push({
      href: '/life-events/income-change',
      label: 'Income change — how to update your APTC and avoid year-end repayment',
      type: 'life-event',
      relevanceScore: 86,
    })
  }

  links.push({
    href: '/life-events/job-loss',
    label: 'Lost employer coverage mid-year — COBRA vs ACA marketplace cost comparison',
    type: 'life-event',
    relevanceScore: 68,
  })

  if (billingCategory !== 'surprise_billing') {
    links.push({
      href: '/billing/surprise_billing',
      label: 'Surprise billing — federal dispute process and provider restrictions',
      type: 'billing',
      relevanceScore: 62,
    })
  }
  if (billingCategory !== 'prior_auth') {
    links.push({
      href: '/billing/prior_auth',
      label: 'Prior authorization — what it is and how to appeal a denial',
      type: 'billing',
      relevanceScore: 60,
    })
  }

  return sortAndSlice(links)
}

// ─── Life event pages ────────────────────────────────────────────────────────

function buildLifeEventLinks(
  ctx: Extract<PageContext, { pageType: 'life-event' }>
): EntityLink[] {
  const { slug, category, state, county, countyName } = ctx
  const links: EntityLink[] = []

  // Subsidy calculator is always the #1 next action after a life event
  if (state && county) {
    const cn = countyDisplay(state, county, countyName)
    links.push({
      href: `/subsidies/${state.toLowerCase()}/${county}`,
      label: `Calculate your updated APTC subsidy after this life event in ${cn}`,
      type: 'subsidy',
      relevanceScore: 95,
    })
    links.push({
      href: `/plans/${state.toLowerCase()}/${county}`,
      label: `Compare ${CURRENT_YEAR} ACA plans in ${cn} available during your SEP window`,
      type: 'plan',
      relevanceScore: 90,
    })
  } else {
    links.push({
      href: '/subsidies',
      label: 'Calculate your APTC subsidy after this qualifying life event',
      type: 'subsidy',
      relevanceScore: 85,
    })
  }

  const faqTags = LIFE_EVENT_TO_FAQ_TAGS[category] ?? []
  const tagSet = new Set(faqTags)

  if (tagSet.has('cobra')) {
    links.push({
      href: '/faq/enrollment/cobra-vs-aca-marketplace',
      label: 'COBRA vs ACA marketplace — which is cheaper after job loss?',
      type: 'faq',
      relevanceScore: 88,
    })
  }
  if (tagSet.has('sep')) {
    links.push({
      href: '/faq/sep/what-qualifies-as-a-sep',
      label: 'What events qualify as a Special Enrollment Period trigger?',
      type: 'faq',
      relevanceScore: 85,
    })
  }
  if (tagSet.has('aptc') || tagSet.has('subsidy') || tagSet.has('fpl')) {
    links.push({
      href: '/faq/subsidy/reporting-income-change',
      label: 'How to report income changes mid-year and avoid APTC repayment',
      type: 'faq',
      relevanceScore: 82,
    })
  }
  if (tagSet.has('young_adult')) {
    links.push({
      href: '/faq/enrollment/best-plans-for-young-adults',
      label: 'Best ACA plan types for young adults — bronze vs silver vs catastrophic',
      type: 'faq',
      relevanceScore: 80,
    })
  }
  if (tagSet.has('medicare') || tagSet.has('turning_65')) {
    links.push({
      href: '/faq/sep/aca-to-medicare-at-65',
      label: 'Transitioning from ACA marketplace coverage to Medicare at age 65',
      type: 'faq',
      relevanceScore: 84,
    })
  }

  const relatedEventsMap: Partial<Record<string, Array<{ slug: string; label: string }>>> = {
    job_loss:      [{ slug: 'income-change', label: 'Income changed after job loss — update your APTC' }],
    job_change:    [{ slug: 'income-change', label: 'New job income changed your subsidy eligibility' }, { slug: 'marriage', label: 'Getting married — adding a spouse to ACA coverage' }],
    marriage:      [{ slug: 'birth', label: 'Having a baby — ACA special enrollment for newborns' }],
    birth:         [{ slug: 'income-change', label: 'New dependent changed your household income — update APTC' }],
    divorce:       [{ slug: 'job-loss', label: 'Lost coverage through divorce — 60-day SEP explained' }],
    turning_26:    [{ slug: 'job-loss', label: 'No employer coverage after 26 — how to enroll in ACA' }],
    move:          [{ slug: 'job-loss', label: 'Moving for a new job — SEP timing when coverage overlaps' }],
    income_change: [{ slug: 'job-loss', label: 'Job loss triggered your income change — COBRA vs ACA' }],
  }

  const relatedEvents = relatedEventsMap[category] ?? []
  relatedEvents.forEach(({ slug: relSlug, label }, i) => {
    if (relSlug !== slug) {
      links.push({
        href: `/life-events/${relSlug}`,
        label,
        type: 'life-event',
        relevanceScore: 72 - i * 5,
      })
    }
  })

  links.push({
    href: '/billing/premium_tax_credit',
    label: 'How premium tax credits are reconciled when your situation changes',
    type: 'billing',
    relevanceScore: 62,
  })

  return sortAndSlice(links)
}

// ─── Dental pages ────────────────────────────────────────────────────────────

function buildDentalLinks(ctx: Extract<PageContext, { pageType: 'dental' }>): EntityLink[] {
  const { state, county, countyName, issuerName } = ctx
  const links: EntityLink[] = []

  if (county) {
    const cn = countyDisplay(state, county, countyName)
    links.push({
      href: `/plans/${state.toLowerCase()}/${county}`,
      label: `Compare ${CURRENT_YEAR} ACA medical plans available alongside dental coverage in ${cn}`,
      type: 'plan',
      relevanceScore: 90,
    })
    links.push({
      href: `/subsidies/${state.toLowerCase()}/${county}`,
      label: `Check if you qualify for an APTC subsidy to offset your premiums in ${cn}`,
      type: 'subsidy',
      relevanceScore: 82,
    })
  }

  links.push({
    href: '/dental',
    label: `Compare all stand-alone dental plans (SADPs) available in ${state.toUpperCase()}`,
    type: 'dental',
    relevanceScore: 88,
  })
  links.push({
    href: '/faq/dental/does-aca-cover-dental',
    label: 'Does ACA marketplace coverage include dental benefits?',
    type: 'faq',
    relevanceScore: 85,
  })
  links.push({
    href: '/faq/dental/what-is-an-sadp',
    label: 'What is a stand-alone dental plan (SADP) and who should get one?',
    type: 'faq',
    relevanceScore: 80,
  })
  links.push({
    href: '/faq/dental/orthodontia-aca-coverage',
    label: 'Does ACA dental coverage include orthodontia for adults?',
    type: 'faq',
    relevanceScore: 74,
  })
  links.push({
    href: '/billing/preventive',
    label: 'Preventive dental care — what ACA plans are required to cover at no cost',
    type: 'billing',
    relevanceScore: 72,
  })

  const issuerSlug = issuerName.toLowerCase().replace(/\s+/g, '-')
  links.push({
    href: `/formulary/${issuerSlug}/all`,
    label: `Browse ${issuerName} medical plan formulary coverage`,
    type: 'formulary',
    relevanceScore: 65,
  })

  links.push({
    href: '/life-events/job-loss',
    label: 'Lost dental coverage at work? Your ACA marketplace options',
    type: 'life-event',
    relevanceScore: 68,
  })

  return sortAndSlice(links)
}
