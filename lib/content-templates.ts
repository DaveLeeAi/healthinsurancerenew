// ============================================================
// lib/content-templates.ts — ACA Dataset Authority
// Template functions for programmatic page content generation.
// All content uses variable interpolation from dataset values.
// NOT AI-generated at request time.
// ============================================================

import type {
  PlanRecord,
  SubsidyRecord,
  SbcRecord,
  RateVolatilityRecord,
  FormularyDrug,
  DentalRecord,
  BillingScenario,
  LifeEventRecord,
  PolicyScenarioRecord,
  FrictionQA,
} from './types'

// ─── Constants ───────────────────────────────────────────────────────────────

const PLAN_YEAR = 2025
const BASE_URL = 'https://healthinsurancerenew.com'

// IRA enhanced credits expire at end of plan year 2025 unless extended
const ENHANCED_CREDIT_EXPIRATION_YEAR = 2025
const ENHANCED_CREDIT_EXPIRATION_NOTE =
  'The American Rescue Plan Act (ARP) of 2021 and Inflation Reduction Act (IRA) of 2022 ' +
  `temporarily extended enhanced premium tax credits through plan year ${ENHANCED_CREDIT_EXPIRATION_YEAR}. ` +
  'Unless Congress acts to extend these provisions, enhanced credits are scheduled to expire ' +
  `after ${ENHANCED_CREDIT_EXPIRATION_YEAR}, which could significantly increase net premiums for many enrollees.`

// ─── Shared block types ───────────────────────────────────────────────────────

export interface AuthorBlock {
  /** Rendered HTML for the reviewer attribution section */
  html: string
  /** schema.org/Person markup — inject as <script type="application/ld+json"> */
  schemaOrg: {
    '@context': string
    '@type': 'Person'
    name: string
    jobTitle: string
    award: string
    knowsAbout: string[]
    url: string
  }
}

export interface DataSourceEntry {
  name: string
  url: string
  description: string
}

export interface PageContent {
  /** Lead paragraph, 2–3 sentences, data-specific */
  introParagraph: string
  /** Full body HTML: headings, paragraphs, lists — 300–500 words */
  bodyHtml: string
  /** Author/reviewer attribution block */
  author: AuthorBlock
  /** Data sources section HTML */
  dataSourcesHtml: string
  /** Licensed agent disclaimer footer HTML */
  disclaimerHtml: string
}

// ─── Shared builders ─────────────────────────────────────────────────────────

/**
 * Returns the author attribution block for Dave Lee.
 * Include on every public page.
 */
export function buildAuthorBlock(): AuthorBlock {
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Person' as const,
    name: 'Dave Lee',
    jobTitle: 'Licensed Health Insurance Agent',
    award: 'CMS Elite Circle of Champions',
    knowsAbout: [
      'ACA Marketplace health insurance',
      'Advance Premium Tax Credits (APTC)',
      'Special Enrollment Periods',
      'Plan comparison and selection',
      'Subsidy optimization strategies',
    ],
    url: `${BASE_URL}/about/dave-lee`,
  }

  const html = `<aside class="author-attribution" aria-label="Content reviewer">
  <div class="author-attribution__inner">
    <div class="author-attribution__meta">
      <span class="author-attribution__label">Reviewed by</span>
      <strong class="author-attribution__name" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <span itemprop="name">Dave Lee</span>
      </strong>
      <span class="author-attribution__title">Licensed Health Insurance Agent</span>
      <span class="author-attribution__credential">CMS Elite Circle of Champions</span>
    </div>
    <p class="author-attribution__note">
      Content on this page has been reviewed for accuracy by a licensed health insurance
      professional with recognition from the Centers for Medicare &amp; Medicaid Services.
      <a href="${BASE_URL}/about/editorial-policy">Editorial policy</a>
    </p>
  </div>
</aside>`

  return { html: html.trim(), schemaOrg }
}

/**
 * Returns the licensed agent disclaimer footer HTML.
 * Required on every public page.
 */
export function buildAgentDisclaimerHtml(): string {
  return `<div class="agent-disclaimer" role="note" aria-label="Licensed agent disclaimer">
  <p>
    <strong>HealthInsuranceRenew.com</strong> is operated by a licensed insurance agent.
    This information is provided for educational purposes only. Specific plan details,
    premium amounts, and coverage terms should be verified at
    <a href="https://www.healthcare.gov" rel="noopener noreferrer" target="_blank">HealthCare.gov</a>
    or by consulting a licensed health insurance agent in your state.
    Plan availability and pricing are subject to change. Data sourced from CMS Public Use Files
    for the ${PLAN_YEAR} plan year.
  </p>
</div>`.trim()
}

/**
 * Renders a data sources attribution section.
 */
export function buildDataSourcesHtml(sources: DataSourceEntry[]): string {
  const items = sources
    .map(
      (s) =>
        `<li><strong>${s.name}</strong> — ${s.description}. ` +
        `<a href="${s.url}" rel="noopener noreferrer" target="_blank">View source</a></li>`
    )
    .join('\n    ')

  return `<section class="data-sources" aria-labelledby="data-sources-heading">
  <h2 id="data-sources-heading">Data Sources</h2>
  <p>
    All plan data, premium rates, and benefit information on this page is derived from official
    government public use files published by the Centers for Medicare &amp; Medicaid Services (CMS).
    Data is not independently modified by HealthInsuranceRenew.com.
  </p>
  <ul class="data-sources__list">
    ${items}
  </ul>
  <p class="data-sources__note">
    Data current as of the ${PLAN_YEAR} plan year. Always verify current plan details at
    <a href="https://www.healthcare.gov" rel="noopener noreferrer" target="_blank">HealthCare.gov</a>.
  </p>
</section>`.trim()
}

// ─── Standard data source definitions per pillar ─────────────────────────────

const CMS_PUF_SOURCE: DataSourceEntry = {
  name: 'CMS QHP Landscape Public Use File',
  url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  description: `Consumer-facing plan comparison data for ${PLAN_YEAR}, published by CMS`,
}

const CMS_RATE_PUF_SOURCE: DataSourceEntry = {
  name: 'CMS Rate PUF',
  url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  description: `Premium rates by plan, age, tobacco use, and rating area for ${PLAN_YEAR}`,
}

const CMS_PLAN_ATTR_SOURCE: DataSourceEntry = {
  name: 'CMS Plan Attributes PUF',
  url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  description: 'Benefits, cost-sharing, network, and metal level details for all QHP plans',
}

const CMS_BENCS_SOURCE: DataSourceEntry = {
  name: 'CMS Benefits and Cost Sharing (BenCS) PUF',
  url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  description: 'Service-level cost-sharing grid: copays, coinsurance, deductibles, and MOOP',
}

const CMS_MR_PUF_SOURCE: DataSourceEntry = {
  name: 'CMS Machine-Readable PUF (MR-PUF)',
  url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  description: 'Carrier formulary JSON file URLs, mandated by ACA Section 1311(e)(3)',
}

const CMS_SADP_SOURCE: DataSourceEntry = {
  name: 'CMS Stand-Alone Dental Plan (SADP) PUF',
  url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  description: `Stand-alone dental plan benefits, waiting periods, and coverage percentages for ${PLAN_YEAR}`,
}

const CMS_RATE_REVIEW_SOURCE: DataSourceEntry = {
  name: 'CMS Rate Review PUF',
  url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  description: 'Rate change justifications and year-over-year premium volatility data',
}

const IRS_FPL_SOURCE: DataSourceEntry = {
  name: 'IRS Revenue Procedure — Federal Poverty Level Tables',
  url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/aca-premium-tax-credit-2025',
  description: `${PLAN_YEAR} Federal Poverty Level percentages and applicable contribution percentages under IRC Section 36B`,
}

const SERFF_SOURCE: DataSourceEntry = {
  name: 'SERFF Rate Filing Database',
  url: 'https://www.serff.com',
  description: 'State-level rate change filings submitted by carriers to state insurance departments',
}

const STATE_DOI_SOURCE: DataSourceEntry = {
  name: 'State Department of Insurance Publications',
  url: 'https://www.naic.org/state_web_map.htm',
  description: 'State-specific insurance regulations, rate approvals, and consumer advisories',
}

// ─── Internal helper ─────────────────────────────────────────────────────────

function metalLevelActuarialValue(metalLevel: string): string {
  const map: Record<string, string> = {
    catastrophic: '~40%',
    bronze: '~60%',
    expanded_bronze: '~65%',
    silver: '~70%',
    gold: '~80%',
    platinum: '~90%',
  }
  return map[metalLevel?.toLowerCase()] ?? '~70%'
}

// ─── Pillar 1: Plan Comparison ────────────────────────────────────────────────

export interface PlanComparisonParams {
  countyName: string
  stateCode: string
  plans: Pick<
    PlanRecord,
    'plan_id' | 'plan_name' | 'issuer_name' | 'metal_level' | 'plan_type' | 'premiums'
  >[]
  planYear?: number
}

/**
 * Generates editorial content for a county-level ACA plan comparison page.
 * Interpolates: plan count, carrier count, premium range, metal levels, plan types.
 */
export function generatePlanComparisonContent(params: PlanComparisonParams): PageContent {
  const { countyName, stateCode, plans, planYear = PLAN_YEAR } = params
  const carrierSet = new Set(plans.map((p) => p.issuer_name))
  const nPlans = plans.length
  const nCarriers = carrierSet.size
  const age40Premiums = plans
    .map((p) => p.premiums?.age_40)
    .filter((p): p is number => p != null)
  const minPremium = age40Premiums.length > 0 ? Math.min(...age40Premiums) : null
  const maxPremium = age40Premiums.length > 0 ? Math.max(...age40Premiums) : null

  const metalCounts = plans.reduce<Record<string, number>>((acc, p) => {
    const key = p.metal_level ?? 'unknown'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const metalSummary = Object.entries(metalCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([metal, count]) => `${count} ${metal}`)
    .join(', ')

  const premiumRange =
    minPremium != null && maxPremium != null
      ? `$${Math.round(minPremium).toLocaleString()}–$${Math.round(maxPremium).toLocaleString()}/month`
      : 'varies by plan'

  const hmoCount = plans.filter((p) => p.plan_type === 'HMO').length
  const ppoCount = plans.filter((p) => p.plan_type === 'PPO').length
  const planTypeNote =
    hmoCount > 0 && ppoCount > 0
      ? `Both HMO (${hmoCount}) and PPO (${ppoCount}) plans are available`
      : hmoCount > 0
      ? `All available plans are HMOs, which require a primary care physician and referrals for specialist visits`
      : ppoCount > 0
      ? `All available plans are PPOs, which allow you to see any provider without a referral`
      : "Plan types vary — review each plan's network rules before enrolling"

  const introParagraph =
    `For the ${planYear} plan year, ${nPlans} health insurance plan${nPlans !== 1 ? 's' : ''} from ` +
    `${nCarriers} carrier${nCarriers !== 1 ? 's' : ''} are available in ${countyName}, ${stateCode} ` +
    `through the ACA Marketplace. Premiums for a 40-year-old range from ${premiumRange} before any ` +
    `subsidy is applied. Source: CMS QHP Landscape PUF, ${planYear} plan year.`

  const bodyHtml = `<section class="content-plan-comparison">
  <h2>Understanding Your ${planYear} ACA Plan Options in ${countyName}, ${stateCode}</h2>
  <p>
    The Affordable Care Act Marketplace in ${countyName} offers ${nPlans} qualifying health
    plan${nPlans !== 1 ? 's' : ''} across ${nCarriers} insurance carrier${nCarriers !== 1 ? 's' : ''}
    for the ${planYear} coverage year. Plans are distributed across metal levels as follows:
    ${metalSummary}. Metal levels define how costs are split between you and the insurer — not
    the quality of care you receive. All Marketplace plans must cover the same ten Essential
    Health Benefit categories regardless of metal level.
  </p>

  <h2>How Metal Levels Affect Your Costs</h2>
  <p>
    Bronze plans carry the lowest monthly premiums but highest out-of-pocket costs when you use
    care — they cover approximately 60% of average expected costs. Silver plans cover about 70%
    of costs and are the only tier eligible for Cost Sharing Reductions (CSRs) if your income is
    below 250% of the Federal Poverty Level. Gold plans cover roughly 80% of expected costs,
    making them cost-effective for people who use healthcare frequently. Platinum plans cover
    90% of costs and carry the highest monthly premiums.
  </p>
  <p>
    If you qualify for a premium tax credit under IRC Section 36B, the amount is calculated
    against the second-lowest-cost Silver plan (the benchmark plan) in your county. You can
    apply that credit to any metal level — though Silver plans offer the unique advantage of
    CSR upgrades at lower incomes.
  </p>

  <h2>Plan Type and Network Considerations</h2>
  <p>
    ${planTypeNote}. HMO plans typically offer lower premiums but require you to stay within
    the plan's network. EPO plans fall between HMOs and PPOs: no referrals needed, but you
    must use in-network providers except in emergencies. PPO plans offer more flexibility for
    out-of-network care at higher cost sharing. Always verify your current doctors and
    prescriptions are covered under a plan's network before enrolling.
  </p>

  <h2>Premium Tax Credits and Your Net Cost</h2>
  <p>
    The premium amounts shown reflect the full unsubsidized cost. Most enrollees qualify for
    an Advance Premium Tax Credit (APTC) under IRC Section 36B that substantially reduces the
    monthly amount owed. ${ENHANCED_CREDIT_EXPIRATION_NOTE} Use our
    <a href="${BASE_URL}/subsidies/${stateCode.toLowerCase()}">subsidy calculator</a> to
    estimate your net premium after tax credits based on your household size and income.
  </p>

  <h2>Open Enrollment and Enrollment Windows</h2>
  <p>
    ACA Open Enrollment for ${planYear} coverage runs each fall. Outside of Open Enrollment,
    you can only enroll or switch plans if a qualifying life event triggers a Special Enrollment
    Period (SEP). Qualifying events include losing other coverage, marriage, birth of a child,
    or moving to a new coverage area. Coverage selected during Open Enrollment takes effect
    on January 1 of the plan year.
  </p>
</section>`.trim()

  return {
    introParagraph,
    bodyHtml,
    author: buildAuthorBlock(),
    dataSourcesHtml: buildDataSourcesHtml([CMS_PUF_SOURCE, CMS_RATE_PUF_SOURCE, CMS_PLAN_ATTR_SOURCE]),
    disclaimerHtml: buildAgentDisclaimerHtml(),
  }
}

// ─── Pillar 2: Subsidy Engine ─────────────────────────────────────────────────

export interface SubsidyTemplateParams {
  countyName: string
  stateCode: string
  subsidyRecord: Pick<SubsidyRecord, 'benchmark_silver_premium' | 'household_size' | 'subsidy_estimates'>
  planYear?: number
}

/**
 * Generates editorial content for a county-level subsidy/APTC page.
 * Explains the IRC Section 36B formula, ARP/IRA enhanced credits, and CSR rules.
 */
export function generateSubsidyContent(params: SubsidyTemplateParams): PageContent {
  const { countyName, stateCode, subsidyRecord, planYear = PLAN_YEAR } = params
  const { benchmark_silver_premium, household_size } = subsidyRecord
  const benchmarkFormatted = `$${benchmark_silver_premium.toFixed(2)}/month`
  const fpl250Estimate = subsidyRecord.subsidy_estimates['fpl_250']

  const introParagraph =
    `The benchmark silver plan premium in ${countyName}, ${stateCode} for the ${planYear} plan year is ` +
    `${benchmarkFormatted} for a single adult (age 40, non-tobacco). This figure is used by the IRS ` +
    `to calculate Advance Premium Tax Credit (APTC) amounts for all Marketplace enrollees in this ` +
    `county, regardless of which plan they ultimately select.`

  const bodyHtml = `<section class="content-subsidy">
  <h2>How the ACA Subsidy Formula Works — IRC Section 36B</h2>
  <p>
    The Advance Premium Tax Credit (APTC) is authorized under Internal Revenue Code Section 36B,
    enacted as part of the Affordable Care Act. The credit equals the difference between the
    benchmark premium (the second-lowest-cost Silver plan in your county) and your "applicable
    percentage" contribution — the share of income the law says you should pay for health
    insurance, scaled by your household income relative to the Federal Poverty Level (FPL).
  </p>
  <p>
    For ${planYear}, the benchmark silver plan premium in ${countyName} is ${benchmarkFormatted}
    for a ${household_size === 1 ? 'single adult' : `household of ${household_size}`} at age 40.
    If you choose a less expensive plan, you keep the difference as additional savings. If you
    choose a more expensive plan, you pay the extra cost above the credit amount.
  </p>

  <h2>Enhanced Premium Tax Credits — ARP and IRA Extension</h2>
  <p>
    Beginning with plan year 2021, the American Rescue Plan Act (ARP) temporarily expanded APTC
    eligibility by eliminating the "subsidy cliff" at 400% FPL — meaning households above 400%
    FPL became newly eligible for credits — and by reducing the applicable percentage
    contribution for all income levels, resulting in larger subsidies for everyone who qualifies.
  </p>
  <p>
    The Inflation Reduction Act (IRA) of 2022 extended these enhanced credits through plan year
    ${ENHANCED_CREDIT_EXPIRATION_YEAR}. ${ENHANCED_CREDIT_EXPIRATION_NOTE}
    If you are currently enrolled using enhanced credits, model your premium under the pre-ARP
    formula using our
    <a href="${BASE_URL}/enhanced-credits/${stateCode.toLowerCase()}">enhanced credit expiration
    calculator</a>.
  </p>

${
  fpl250Estimate
    ? `  <h2>Example: Subsidy Estimate at 250% FPL in ${countyName}</h2>
  <p>
    At 250% of the Federal Poverty Level (annual income approximately
    $${fpl250Estimate.annual_income.toLocaleString()}), the estimated monthly APTC in ${countyName}
    is <strong>$${fpl250Estimate.monthly_aptc.toFixed(2)}/month</strong>, reducing your net premium
    on the benchmark silver plan to approximately
    <strong>$${fpl250Estimate.net_monthly_premium.toFixed(2)}/month</strong>.
    Enrollees at this income level may also qualify for Cost Sharing Reductions (CSRs) on a
    Silver plan, which lower your deductible, copays, and out-of-pocket maximum.
  </p>`
    : ''
}

  <h2>Cost Sharing Reductions — The Silver Plan Advantage</h2>
  <p>
    CSRs are only available on Silver-tier plans and only if your income is between 100% and
    250% FPL. At 100–150% FPL, CSRs can reduce a Silver plan's individual deductible from a
    typical $2,000–$4,000 to as little as $350, and reduce the out-of-pocket maximum from
    $9,100 to $2,700 (${planYear} limits). CSRs are not tax credits — they are direct
    reductions to cost-sharing that you receive automatically by enrolling in an eligible
    Silver plan. No separate application is required.
  </p>

  <h2>Reconciling Your Credit at Tax Time</h2>
  <p>
    You can claim your APTC in advance (applied monthly to reduce your premium) or as a lump
    credit on your federal tax return. Most enrollees choose advance payment through
    HealthCare.gov. You must file IRS Form 8962 each year to reconcile advance payments
    against actual income. If your income was higher than estimated, you may owe back some or
    all of the credit. If your income was lower, you may receive an additional refund. Report
    income changes promptly to HealthCare.gov to minimize reconciliation surprises at tax time.
  </p>
</section>`.trim()

  return {
    introParagraph,
    bodyHtml,
    author: buildAuthorBlock(),
    dataSourcesHtml: buildDataSourcesHtml([IRS_FPL_SOURCE, CMS_PUF_SOURCE, CMS_RATE_PUF_SOURCE]),
    disclaimerHtml: buildAgentDisclaimerHtml(),
  }
}

// ─── Pillar 3: SBC Decoded ────────────────────────────────────────────────────

export interface SbcTemplateParams {
  plan: Pick<
    PlanRecord,
    | 'plan_name'
    | 'issuer_name'
    | 'metal_level'
    | 'plan_type'
    | 'state_code'
    | 'deductible_individual'
    | 'moop_individual'
  >
  sbc: Pick<SbcRecord, 'cost_sharing_grid' | 'exclusions'>
  planYear?: number
}

/**
 * Generates editorial content for an SBC plan detail page.
 * Explains the SBC document, flags exclusions in plain English,
 * and includes the CMS "This is not a contract" disclaimer.
 */
export function generateSbcContent(params: SbcTemplateParams): PageContent {
  const { plan, sbc, planYear = PLAN_YEAR } = params
  const exclusions = sbc.exclusions ?? []
  const flaggedExclusions = exclusions.filter((e) => !e.needs_pdf_parsing)
  const pendingExclusions = exclusions.filter((e) => e.needs_pdf_parsing)

  const deductibleText =
    plan.deductible_individual != null
      ? `$${plan.deductible_individual.toLocaleString()}`
      : 'see plan documents'
  const moopText =
    plan.moop_individual != null
      ? `$${plan.moop_individual.toLocaleString()}`
      : 'see plan documents'

  const introParagraph =
    `The Summary of Benefits and Coverage (SBC) for ${plan.plan_name} (${plan.metal_level} ` +
    `${plan.plan_type}, ${plan.state_code}, ${planYear}) shows an individual deductible of ` +
    `${deductibleText} and an out-of-pocket maximum of ${moopText}. This page decodes the ` +
    `CMS-standardized SBC document into plain-language cost-sharing data to help you understand ` +
    `what you would pay at each care setting.`

  const exclusionListHtml =
    flaggedExclusions.length > 0
      ? `<ul class="sbc-exclusions__list">
      ${flaggedExclusions
        .map(
          (e) =>
            `<li><strong>${e.category}</strong>: ${e.description}` +
            (e.source === 'puf' ? ` <em>(Source: CMS PUF)</em>` : '') +
            `</li>`
        )
        .join('\n      ')}
    </ul>`
      : `<p>No categorical exclusions were identified in the PUF data for this plan.
    Review the full carrier SBC document to confirm exclusions for specific services.</p>`

  const pendingNote =
    pendingExclusions.length > 0
      ? `<p class="sbc-exclusions__pending-note">
    <strong>Note:</strong> ${pendingExclusions.length} additional exclusion
    ${pendingExclusions.length === 1 ? 'category was' : 'categories were'} identified as
    requiring PDF parsing of the full SBC document. These are not yet decoded in the
    structured dataset. Review the carrier-published SBC PDF for complete exclusion details.
  </p>`
      : ''

  const bodyHtml = `<section class="content-sbc">
  <h2>What Is a Summary of Benefits and Coverage (SBC)?</h2>
  <p>
    The Summary of Benefits and Coverage is a standardized document required by the ACA for all
    health insurance plans. Carriers must provide an SBC in a uniform format so consumers can
    compare plans on an apples-to-apples basis. The SBC shows covered benefits, cost-sharing
    details, deductibles, out-of-pocket limits, and coverage examples for common medical
    scenarios.
  </p>
  <p>
    <strong>Important CMS notice:</strong> The SBC is a summary only.
    <em>"This is not a contract"</em> — the actual terms of your coverage are determined by the
    full plan documents, including the Evidence of Coverage (EOC) and carrier policy. In any
    conflict between the SBC and plan documents, the plan documents control.
  </p>

  <h2>Key Cost-Sharing Numbers for ${plan.plan_name}</h2>
  <ul class="sbc-cost-summary">
    <li><strong>Individual Deductible:</strong> ${deductibleText} — you pay 100% of covered costs until this amount is met each plan year</li>
    <li><strong>Individual Out-of-Pocket Maximum:</strong> ${moopText} — after reaching this limit, the plan pays 100% of covered in-network costs for the remainder of the plan year</li>
    <li><strong>Metal Level:</strong> ${plan.metal_level} — designed to cover approximately ${metalLevelActuarialValue(plan.metal_level)} of average expected covered costs</li>
  </ul>

  <h2>How Deductibles and Coinsurance Work Together</h2>
  <p>
    Many services require you to meet your deductible before cost-sharing begins. For example,
    if your plan has a $2,000 deductible and you need an MRI, you typically pay the full
    contracted rate until your deductible is met, then pay your coinsurance percentage for
    remaining visits in the plan year. Some services — most notably preventive care, primary
    care visits on certain plans, and generic drugs — may have copays that apply without first
    meeting the deductible. The cost-sharing grid on this page shows which services are
    deductible-first and which have flat copays.
  </p>

  <h2>Coverage Exclusions for This Plan</h2>
  <p>
    The following coverage exclusions have been identified from CMS Public Use File data.
    Exclusions are services the plan does not cover. Understanding exclusions before enrolling
    can prevent unexpected bills. Always confirm exclusions in the full carrier SBC document.
  </p>
  ${exclusionListHtml}
  ${pendingNote}

  <h2>Using SBC Data When Comparing Plans</h2>
  <p>
    The cost-sharing data on this page is derived from the CMS BenCS (Benefits and Cost Sharing)
    Public Use File, which carriers are required to submit annually. While this data reflects
    carrier filings, always verify current cost-sharing details directly with the carrier or at
    HealthCare.gov before enrolling, as plan documents are the legally binding source of truth.
    Use this data for comparison purposes; do not rely on it as definitive coverage confirmation.
  </p>
</section>`.trim()

  return {
    introParagraph,
    bodyHtml,
    author: buildAuthorBlock(),
    dataSourcesHtml: buildDataSourcesHtml([CMS_BENCS_SOURCE, CMS_PLAN_ATTR_SOURCE, CMS_PUF_SOURCE]),
    disclaimerHtml: buildAgentDisclaimerHtml(),
  }
}

// ─── Pillar 4: Rate Volatility ────────────────────────────────────────────────

export interface RateVolatilityTemplateParams {
  countyName: string
  stateCode: string
  record: Pick<
    RateVolatilityRecord,
    | 'plan_year'
    | 'carrier_count'
    | 'plan_count'
    | 'avg_premium_age_21'
    | 'avg_premium_age_40'
    | 'avg_premium_age_64'
    | 'age_64_shock_ratio'
    | 'yoy_change_pct'
  >
}

/**
 * Generates editorial content for a county-level rate volatility page.
 * Covers carrier competition, age-rating structure, and year-over-year trends.
 */
export function generateRateVolatilityContent(params: RateVolatilityTemplateParams): PageContent {
  const { countyName, stateCode, record } = params
  const {
    plan_year,
    carrier_count,
    plan_count,
    avg_premium_age_21,
    avg_premium_age_40,
    avg_premium_age_64,
    age_64_shock_ratio,
    yoy_change_pct,
  } = record

  const competitionContext =
    carrier_count >= 4
      ? `With ${carrier_count} carriers competing in ${countyName}, this county has strong insurer competition, which tends to moderate premium increases.`
      : carrier_count === 3
      ? `With ${carrier_count} carriers in ${countyName}, competition is moderate. Consumers have meaningful plan choices, though fewer than in higher-competition markets.`
      : carrier_count === 2
      ? `With only ${carrier_count} carriers in ${countyName}, competition is limited, which can reduce pricing pressure and increase premium volatility.`
      : `With a single carrier in ${countyName}, this county is a monopoly ACA market. Consumers have no premium competition and limited plan choice.`

  const yoyNote =
    yoy_change_pct != null
      ? `Average premiums in ${countyName} ${yoy_change_pct > 0 ? 'increased' : 'decreased'} by ${Math.abs(yoy_change_pct).toFixed(1)}% compared to ${plan_year - 1}.`
      : `Year-over-year rate change data is not available for ${countyName} in this dataset.`

  const introParagraph =
    `For the ${plan_year} plan year, ${plan_count} ACA plan${plan_count !== 1 ? 's' : ''} from ` +
    `${carrier_count} carrier${carrier_count !== 1 ? 's' : ''} are available in ${countyName}, ` +
    `${stateCode}. The average unsubsidized monthly premium for a 40-year-old is ` +
    `$${Math.round(avg_premium_age_40).toLocaleString()}. ${yoyNote}`

  const bodyHtml = `<section class="content-rate-volatility">
  <h2>Premium Rate Landscape in ${countyName}, ${stateCode} — ${plan_year}</h2>
  <p>
    ${competitionContext} The ${plan_count} plans available span multiple metal levels and plan
    types. All premium data shown is the unsubsidized rate — most enrollees qualify for an APTC
    that significantly reduces the net cost. Use the
    <a href="${BASE_URL}/subsidies/${stateCode.toLowerCase()}">subsidy calculator</a> to see your
    estimated net premium.
  </p>

  <h2>The Age-Rating Factor and Premium Variation</h2>
  <p>
    Under the ACA, insurers may charge older adults up to 3× the premium charged to a 21-year-old
    for the same plan. In ${countyName}, the average monthly premium for a 21-year-old is
    $${Math.round(avg_premium_age_21).toLocaleString()}, rising to
    $${Math.round(avg_premium_age_40).toLocaleString()} at age 40 and
    $${Math.round(avg_premium_age_64).toLocaleString()} at age 64 — approximately
    ${age_64_shock_ratio.toFixed(1)}× the age-40 rate.
  </p>
  <p>
    This age-rating structure means the APTC formula (which compares premium costs to income)
    can produce very different credit amounts for people of different ages at the same income
    level. Adults approaching 60–64 may qualify for substantially larger premium tax credits
    than younger enrollees at the same income, because the benchmark premium itself is much
    higher at older ages.
  </p>

  <h2>Carrier Competition and Market Stability</h2>
  <p>
    ${competitionContext} Research from CMS and the Kaiser Family Foundation consistently shows
    that counties with three or more carriers tend to see lower average premium increases and
    more plan diversity. In limited-competition markets, consumer advocates recommend actively
    comparing all available plans at renewal — switching plans within the same metal level can
    sometimes yield significant savings even when your subsidy stays constant.
  </p>

  <h2>Rate Review and State Oversight</h2>
  <p>
    Before any Marketplace premium increase takes effect, carriers in ${stateCode} must submit a
    rate filing justifying the change. For increases of 10% or more, CMS and/or the state
    Department of Insurance conducts a formal rate review. These filings are publicly available
    through the SERFF (System for Electronic Rate and Form Filing) database. Reviewing filed
    rate justifications can explain what is driving premium changes in your area — whether
    utilization trends, prescription drug costs, or market exits.
  </p>

  <h2>Planning for Premium Changes at Renewal</h2>
  <p>
    ACA plans renew annually. Your current plan's premium, network, and formulary may change
    each year. During Open Enrollment, always re-evaluate all available plans — not just your
    current one. If your plan's rate increases more than the benchmark plan, your out-of-pocket
    net premium will rise even if your subsidy amount stays the same, because the credit is
    anchored to the benchmark premium, not your specific plan.
  </p>
</section>`.trim()

  return {
    introParagraph,
    bodyHtml,
    author: buildAuthorBlock(),
    dataSourcesHtml: buildDataSourcesHtml([
      CMS_RATE_PUF_SOURCE,
      CMS_RATE_REVIEW_SOURCE,
      SERFF_SOURCE,
      STATE_DOI_SOURCE,
    ]),
    disclaimerHtml: buildAgentDisclaimerHtml(),
  }
}

// ─── Pillar 5: Friction Q&A ───────────────────────────────────────────────────

export interface FrictionQATemplateParams {
  qa: Pick<FrictionQA, 'question' | 'answer' | 'category' | 'citations'>
  countyName?: string
  stateCode?: string
}

/**
 * Generates editorial content for an individual friction Q&A page.
 * Provides regulatory context, citation framing, and agent referral guidance.
 */
export function generateFrictionQAContent(params: FrictionQATemplateParams): PageContent {
  const { qa, countyName, stateCode } = params
  const locationContext = countyName && stateCode ? ` in ${countyName}, ${stateCode}` : ''

  const introParagraph =
    `This page answers: "${qa.question}" — one of the most common questions we receive from ` +
    `ACA enrollees${locationContext}. The answer below is based on current CMS regulations and ` +
    `IRS guidance applicable to the ${PLAN_YEAR} plan year.`

  const citationsHtml =
    qa.citations && qa.citations.length > 0
      ? `<h2>Regulatory Citations</h2>
  <ul class="faq-citations">
    ${qa.citations.map((c) => `<li>${c}</li>`).join('\n    ')}
  </ul>`
      : ''

  const categoryContextMap: Record<string, string> = {
    enrollment:
      'ACA enrollment rules are governed by CMS and the Treasury Department. Enrollment windows, qualifying events, and plan selection rules are set annually through CMS guidance.',
    subsidy:
      'ACA premium tax credits are governed by IRC Section 36B and related IRS regulations. Credit amounts, income thresholds, and reconciliation rules may change annually.',
    cost_sharing:
      'ACA cost-sharing rules — including deductibles, copays, coinsurance, and out-of-pocket maximums — are set by carriers within CMS-established limits for each metal level.',
    sep:
      'Special Enrollment Periods are triggered by qualifying life events defined in 45 CFR Part 155. Documentation requirements and window lengths vary by event type.',
    formulary:
      'ACA plans must provide at least one drug per USPSTF category in each formulary tier. Carriers have discretion to add requirements such as prior authorization and step therapy.',
    appeals:
      'ACA enrollees have the right to internal and external appeals for denied claims under 45 CFR Part 147. External Independent Medical Review is federally mandated.',
    dental:
      'Dental coverage on the ACA Marketplace is offered as embedded pediatric dental (required) or as optional stand-alone dental plans (SADPs). Adult dental is not a required Essential Health Benefit.',
    billing:
      'ACA billing rules are governed by CMS, the No Surprises Act (2022), and state insurance regulations. Billing disputes may involve federal and state consumer protection processes.',
  }

  const categoryIntro =
    categoryContextMap[qa.category] ??
    'ACA coverage rules are set by CMS and state insurance departments and may vary by state and plan year.'

  const bodyHtml = `<section class="content-friction-qa">
  <h2>${qa.question}</h2>
  <div class="faq-answer">
    <p>${qa.answer}</p>
  </div>

  <h2>Regulatory Context</h2>
  <p>${categoryIntro}</p>
  <p>
    This answer applies to the ${PLAN_YEAR} plan year. ACA rules, contribution percentages,
    and subsidy eligibility thresholds are updated annually. Always confirm current rules at
    <a href="https://www.healthcare.gov" rel="noopener noreferrer" target="_blank">HealthCare.gov</a>
    or by consulting a licensed health insurance agent.
  </p>

  ${citationsHtml}

  <h2>When to Consult a Licensed Agent</h2>
  <p>
    The information on this page is general guidance based on federal ACA regulations. Your
    specific situation — including your income, household size, state of residence, and
    available plans — may produce different outcomes. A licensed health insurance agent can
    review your circumstances, model subsidy scenarios, and assist with plan selection and
    enrollment at no cost to you: agents are compensated by carriers, not by enrollees.
  </p>
</section>`.trim()

  return {
    introParagraph,
    bodyHtml,
    author: buildAuthorBlock(),
    dataSourcesHtml: buildDataSourcesHtml([CMS_PUF_SOURCE, IRS_FPL_SOURCE]),
    disclaimerHtml: buildAgentDisclaimerHtml(),
  }
}

// ─── Pillar 6: Formulary Intelligence ────────────────────────────────────────

export interface FormularyTemplateParams {
  drugName: string
  drugs: Pick<
    FormularyDrug,
    | 'drug_name'
    | 'drug_tier'
    | 'prior_authorization'
    | 'step_therapy'
    | 'quantity_limit'
    | 'issuer_name'
    | 'state_code'
  >[]
  issuerName?: string
  stateCode?: string
  planYear?: number
}

/**
 * Generates editorial content for a formulary drug detail page.
 * Explains tier structure, prior auth, step therapy, and exception requests.
 */
export function generateFormularyContent(params: FormularyTemplateParams): PageContent {
  const { drugName, drugs, issuerName, stateCode, planYear = PLAN_YEAR } = params
  const planCount = drugs.length
  const tierCounts = drugs.reduce<Record<string, number>>((acc, d) => {
    const tier = d.drug_tier ?? 'Unknown'
    acc[tier] = (acc[tier] ?? 0) + 1
    return acc
  }, {})
  const topTier = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown'
  const priorAuthCount = drugs.filter((d) => d.prior_authorization).length
  const stepTherapyCount = drugs.filter((d) => d.step_therapy).length
  const quantityLimitCount = drugs.filter((d) => d.quantity_limit).length
  const locationContext = stateCode ? ` in ${stateCode}` : ''
  const issuerContext = issuerName ? ` at ${issuerName}` : ''
  const genericCount = tierCounts['GENERIC'] ?? 0

  const introParagraph =
    `${drugName} appears on the formulary of ${planCount} ACA plan${planCount !== 1 ? 's' : ''}` +
    `${issuerContext}${locationContext} for the ${planYear} plan year. The most common ` +
    `formulary tier classification is <strong>${topTier}</strong>. ` +
    (priorAuthCount > 0
      ? `${priorAuthCount} plan${priorAuthCount !== 1 ? 's' : ''} require prior authorization for this medication. `
      : 'No plans in this dataset require prior authorization for this medication. ') +
    `Source: CMS Machine-Readable PUF, ${planYear}.`

  const bodyHtml = `<section class="content-formulary">
  <h2>Understanding ACA Formulary Tier Structure</h2>
  <p>
    ACA Marketplace plans organize covered medications into tiers. While exact tier names vary
    by carrier, the standard structure from lowest to highest cost-sharing is:
  </p>
  <ol class="formulary-tiers">
    <li><strong>Tier 1 — Generic:</strong> The lowest-cost tier. Generic drugs have the same active ingredients, safety, and efficacy as brand-name drugs and carry your plan's lowest copay or coinsurance.</li>
    <li><strong>Tier 2 — Preferred Brand:</strong> Brand-name drugs with carrier-negotiated preferred pricing. Higher cost-sharing than generics, but lower than non-preferred brands.</li>
    <li><strong>Tier 3 — Non-Preferred Brand:</strong> Brand-name drugs not on the carrier's preferred list. Higher cost-sharing than Tier 2.</li>
    <li><strong>Tier 4 — Specialty:</strong> High-cost or complex medications, including biologics. Typically the highest cost-sharing, often coinsurance-based (e.g., 25–33% of cost).</li>
    <li><strong>ACA Preventive:</strong> Medications required to be covered at no cost-sharing under the ACA's preventive services mandate (USPSTF Grade A/B recommendations).</li>
  </ol>
  <p>
    For ${planYear}, ${drugName} is most commonly classified as <strong>${topTier}</strong>
    on the plans in this dataset.
    ${genericCount > 0 ? `${genericCount} plan${genericCount !== 1 ? 's' : ''} classify it as a generic. ` : ''}
    Your actual copay or coinsurance depends on your specific plan's Evidence of Coverage document.
  </p>

  <h2>Prior Authorization — What It Means and How to Navigate It</h2>
  <p>
    Prior authorization (PA) means the carrier requires advance approval before covering a
    medication. Of the ${planCount} plans showing ${drugName} in this dataset,
    ${
      priorAuthCount > 0
        ? `<strong>${priorAuthCount}</strong> require prior authorization. Your prescribing doctor must submit clinical documentation showing medical necessity before the plan will cover the medication.`
        : 'none currently require prior authorization, though this can change at annual formulary updates.'
    }
  </p>
  <p>
    If your PA request is denied, you have the right to appeal. The ACA requires carriers to
    maintain an internal appeals process and, if that fails, an external independent review.
    For urgent clinical situations, expedited appeals must be decided within 72 hours. Keep
    copies of all submitted clinical documentation and denial notices.
  </p>

${
  stepTherapyCount > 0
    ? `  <h2>Step Therapy — "Fail First" Requirements</h2>
  <p>
    Step therapy requires you to try a lower-cost drug before the carrier will authorize the
    prescribed medication. ${stepTherapyCount} plan${stepTherapyCount !== 1 ? 's' : ''} in this
    dataset apply step therapy to ${drugName}. If your doctor believes step therapy is
    medically inappropriate, they can file a step therapy exception request with clinical
    documentation.
  </p>`
    : ''
}

${
  quantityLimitCount > 0
    ? `  <h2>Quantity Limits</h2>
  <p>
    ${quantityLimitCount} plan${quantityLimitCount !== 1 ? 's' : ''} in this dataset apply a
    quantity limit to ${drugName}, restricting the amount dispensed per fill or per month.
    If your prescribed quantity exceeds the limit, your doctor can request a quantity limit
    exception.
  </p>`
    : ''
}

  <h2>How to Request a Formulary Exception</h2>
  <p>
    If your prescribed medication is not on your plan's formulary, or is placed on a high-cost
    tier, you can request a formulary exception. Your doctor submits a written request with
    clinical documentation explaining why the formulary alternative is not medically appropriate.
    The carrier must respond within 72 hours (24 hours for urgent requests). If denied, you have
    the right to appeal through internal and external review. The ACA prohibits carriers from
    placing all drugs for a specific condition on specialty tiers in a way that discriminates
    against enrollees with that condition.
  </p>
</section>`.trim()

  return {
    introParagraph,
    bodyHtml,
    author: buildAuthorBlock(),
    dataSourcesHtml: buildDataSourcesHtml([CMS_MR_PUF_SOURCE, CMS_PLAN_ATTR_SOURCE]),
    disclaimerHtml: buildAgentDisclaimerHtml(),
  }
}

// ─── Pillar 7: Dental Coverage ────────────────────────────────────────────────

export interface DentalTemplateParams {
  dental: DentalRecord
  planYear?: number
}

/**
 * Generates editorial content for a stand-alone dental plan (SADP) detail page.
 * Covers waiting periods, coverage tiers, annual max, and ACA context.
 */
export function generateDentalContent(params: DentalTemplateParams): PageContent {
  const { dental, planYear = PLAN_YEAR } = params
  const cp = dental.coverage_percentages
  const pct = (val: number | null): string =>
    val != null ? `${Math.round(val)}%` : 'varies'
  const annualMax =
    dental.annual_maximum.individual_in_network != null
      ? `$${dental.annual_maximum.individual_in_network.toLocaleString()}`
      : 'not specified in public data'
  const wp = dental.waiting_periods
  const hasDocumentedWait = !wp.needs_pdf_parsing && wp.basic_months != null && wp.basic_months > 0
  const waitingPeriod = hasDocumentedWait
    ? `${wp.basic_months}-month waiting period for some services`
    : wp.needs_pdf_parsing
      ? 'waiting period terms — see plan documents'
      : 'no waiting period'

  const introParagraph =
    `${dental.plan_name} is a ${dental.metal_level}-level stand-alone dental plan (SADP) offered ` +
    `by ${dental.issuer_name} in ${dental.state_code} for the ${planYear} plan year. The plan covers ` +
    `preventive services at ${pct(cp.preventive_adult)}, basic restorative at ` +
    `${pct(cp.basic_adult)}, and major restorative at ${pct(cp.major_adult)}, ` +
    `with an annual maximum benefit of ${annualMax}. There is ${waitingPeriod}.`

  const bodyHtml = `<section class="content-dental">
  <h2>Stand-Alone Dental Plans (SADPs) vs Embedded Dental Coverage</h2>
  <p>
    The ACA requires all Marketplace plans to include pediatric dental as an Essential Health
    Benefit, but adult dental is not required. Most ACA medical plans include limited or no
    adult dental benefits. Stand-alone dental plans (SADPs) — offered separately on the
    Marketplace — provide adult dental coverage and are the primary way to add dental benefits
    through the ACA exchange.
  </p>
  <p>
    SADPs come in Low and High tiers (analogous to Bronze and Gold for dental). Low-tier plans
    carry lower monthly premiums with higher cost-sharing; High-tier plans cost more per month
    but cover a larger percentage of procedure costs. ${dental.plan_name} is a
    <strong>${dental.metal_level}-tier</strong> SADP from ${dental.issuer_name}.
  </p>

  <h2>Coverage Tiers for This Plan</h2>
  <ul class="dental-coverage-tiers">
    <li>
      <strong>Preventive Care (${pct(cp.preventive_adult)}):</strong>
      Routine exams, cleanings, X-rays, and fluoride treatments. Preventive care is typically
      covered at the highest percentage and usually does not require meeting the deductible first.
    </li>
    <li>
      <strong>Basic Restorative (${pct(cp.basic_adult)}):</strong>
      Fillings, simple extractions, and basic periodontal treatments. Usually covered at a
      lower percentage than preventive, often after the deductible is met.
    </li>
    <li>
      <strong>Major Restorative (${pct(cp.major_adult)}):</strong>
      Crowns, bridges, dentures, complex extractions, and oral surgery. Covered at the lowest
      percentage, typically after deductible.
    </li>
    ${
      dental.ortho_adult_covered
        ? `<li>
      <strong>Orthodontia:</strong> This plan includes orthodontic coverage. Most SADPs
      covering orthodontia include a lifetime maximum benefit (separate from the annual maximum)
      and may have a separate waiting period. See plan documents for orthodontia-specific limits.
    </li>`
        : ''
    }
  </ul>

  <h2>Annual Maximum Benefit</h2>
  <p>
    This plan's annual maximum benefit is <strong>${annualMax}</strong> — the most the insurer
    will pay for covered dental services in a plan year. Once you exceed this amount, you pay
    100% of costs for the remainder of the year. Unlike ACA medical plans, dental plans do not
    have an out-of-pocket maximum that caps your total spending. For consumers expecting
    extensive dental work, calculate projected costs before enrolling to determine whether the
    annual maximum will be sufficient.
  </p>

  <h2>Waiting Periods</h2>
  <p>
    ${
      hasDocumentedWait
        ? `This plan has a ${wp.basic_months}-month waiting period for certain services.
    Waiting periods typically apply to major restorative services and orthodontia — not to
    preventive and basic services, which are usually covered from day one of enrollment.`
        : 'This plan does not appear to have a waiting period for covered services per CMS SADP PUF data. Confirm directly with the carrier before enrolling.'
    }
    If you have an urgent need for major dental work, verify the waiting period before
    enrolling to ensure coverage will be active when treatment is planned.
  </p>

  <h2>Deductible</h2>
  <p>
    ${
      dental.deductible.individual_in_network != null
        ? `The individual deductible for this plan is $${dental.deductible.individual_in_network.toLocaleString()}. You must meet this deductible before cost-sharing applies to basic and major restorative services. Preventive services are often covered without meeting the deductible first.`
        : 'Deductible information was not available in the CMS SADP PUF for this plan. Review the full plan documents for deductible details.'
    }
  </p>
</section>`.trim()

  return {
    introParagraph,
    bodyHtml,
    author: buildAuthorBlock(),
    dataSourcesHtml: buildDataSourcesHtml([CMS_SADP_SOURCE, CMS_PLAN_ATTR_SOURCE]),
    disclaimerHtml: buildAgentDisclaimerHtml(),
  }
}

// ─── Pillar 8: Billing Intelligence ──────────────────────────────────────────

export interface BillingTemplateParams {
  scenario: BillingScenario
  countyName?: string
  stateCode?: string
}

/**
 * Generates editorial content for a billing intelligence scenario page.
 * Provides ACA consumer rights context, resolution steps, and documentation guidance.
 */
export function generateBillingContent(params: BillingTemplateParams): PageContent {
  const { scenario, countyName, stateCode } = params
  const locationContext = countyName && stateCode ? ` in ${countyName}, ${stateCode}` : ''

  const introParagraph =
    `This page explains the "${scenario.title}" billing scenario${locationContext}. ` +
    `${scenario.description} Risk level: ${scenario.consumer_risk_level}.`.trim()

  const categoryRightsMap: Record<string, string> = {
    surprise_billing_protections:
      'The No Surprises Act (effective January 2022) protects ACA enrollees from most surprise out-of-network bills for emergency services and for non-emergency services at in-network facilities when the patient had no choice of provider. Surprise bills in violation of the NSA can be disputed through the federal independent dispute resolution process.',
    specialist_referral:
      'HMO plans typically require a primary care physician referral for specialist visits. Visiting a specialist without a required referral may result in a denied claim. PPO plans generally do not require referrals but may have higher cost-sharing for out-of-network specialists.',
    prescription_drug_tiers:
      "Prescription drug billing under ACA plans follows the plan's formulary and cost-sharing schedule. The ACA requires coverage of at least one drug per USPSTF category. For specialty drugs, cost-sharing is subject to the plan's annual out-of-pocket maximum.",
    mental_health_parity:
      'The Mental Health Parity and Addiction Equity Act (MHPAEA) requires ACA plans to cover mental health and substance use disorder services at parity with comparable medical/surgical benefits. Plans cannot impose more restrictive prior authorization, visit limits, or cost-sharing on mental health services.',
    emergency_care:
      'ACA plans must cover emergency services at in-network cost-sharing levels even at out-of-network facilities. Plans cannot require prior authorization for emergency services. The No Surprises Act further restricts balance billing for emergency care.',
  }

  const categoryExplanation =
    categoryRightsMap[scenario.billing_category] ??
    'ACA billing protections vary by service type and carrier. Always review your Explanation of Benefits (EOB) when you receive a bill that differs from expected cost-sharing.'

  const bodyHtml = `<section class="content-billing">
  <h2>Understanding This Billing Scenario</h2>
  <p>${scenario.description}</p>
  <p><strong>Consumer risk level:</strong> ${scenario.consumer_risk_level}</p>

  <h2>Your ACA Rights in This Situation</h2>
  <p>${categoryExplanation}</p>

  <h2>Consumer Tip</h2>
  <p>${scenario.consumer_tip}</p>

  <h2>Regulatory Reference</h2>
  <p>${scenario.related_cfr}</p>

  <h2>Documentation to Keep</h2>
  <ul class="billing-documentation-checklist">
    <li>Your Explanation of Benefits (EOB) from the insurer — sent after every claim</li>
    <li>The original itemized bill from the provider</li>
    <li>Any prior authorization approvals or denial letters</li>
    <li>Correspondence with insurer customer service (note date, time, representative name)</li>
    <li>Your plan's Summary of Benefits and Coverage (SBC) and Evidence of Coverage (EOC) documents</li>
  </ul>

  <h2>When to Escalate</h2>
  <p>
    If the insurer's internal appeal process does not resolve your billing dispute, you have the
    right to request an External Independent Review. For disputes involving the No Surprises Act,
    you may file a complaint with the federal No Surprises Help Desk at 1-800-985-3059. Your
    state's Department of Insurance handles complaints against carriers for state-regulated plans.
    A licensed health insurance agent or patient advocate can help navigate complex billing
    disputes at no additional cost.
  </p>
</section>`.trim()

  return {
    introParagraph,
    bodyHtml,
    author: buildAuthorBlock(),
    dataSourcesHtml: buildDataSourcesHtml([CMS_BENCS_SOURCE, CMS_PLAN_ATTR_SOURCE, STATE_DOI_SOURCE]),
    disclaimerHtml: buildAgentDisclaimerHtml(),
  }
}

// ─── Pillar 9: Life Events & SEPs ─────────────────────────────────────────────

export interface LifeEventTemplateParams {
  event: Pick<
    LifeEventRecord,
    'title' | 'trigger_description' | 'sep_details' | 'action_steps' | 'deadlines' | 'common_mistakes'
  >
  countyName?: string
  stateCode?: string
  planYear?: number
}

/**
 * Generates editorial content for a life event / SEP trigger page.
 * Explains the SEP window, documentation requirements, and enrollment steps.
 */
export function generateLifeEventContent(params: LifeEventTemplateParams): PageContent {
  const { event, countyName, stateCode, planYear = PLAN_YEAR } = params
  const { sep_details } = event
  const locationContext = countyName && stateCode ? ` in ${countyName}, ${stateCode}` : ''

  const introParagraph =
    `${event.trigger_description} This life event triggers a Special Enrollment Period (SEP) — ` +
    `a ${sep_details.window_days}-day window during which you can enroll in or change your ACA ` +
    `Marketplace health coverage${locationContext} outside of the standard Open Enrollment period. ` +
    `SEP type: <strong>${sep_details.sep_type}</strong>.`

  const stepsHtml =
    event.action_steps && event.action_steps.length > 0
      ? `<ol class="life-event-steps">
      ${event.action_steps.map((step) => `<li>${step}</li>`).join('\n      ')}
    </ol>`
      : '<p>Act promptly — SEP windows begin from the date of the qualifying event and are strictly enforced.</p>'

  const documentationHtml =
    sep_details.documentation_required && sep_details.documentation_required.length > 0
      ? `<ul class="life-event-docs">
      ${sep_details.documentation_required.map((doc) => `<li>${doc}</li>`).join('\n      ')}
    </ul>`
      : '<p>Documentation requirements vary. Have proof of the qualifying event ready when enrolling at HealthCare.gov.</p>'

  const mistakesHtml =
    event.common_mistakes && event.common_mistakes.length > 0
      ? `<h2>Common Mistakes to Avoid</h2>
  <ul class="life-event-mistakes">
    ${event.common_mistakes.map((m) => `<li>${m}</li>`).join('\n    ')}
  </ul>`
      : ''

  const bodyHtml = `<section class="content-life-event">
  <h2>What Is a Special Enrollment Period (SEP)?</h2>
  <p>
    Outside of the annual Open Enrollment window, you can only enroll in or change your ACA
    Marketplace coverage if a qualifying life event triggers an SEP. ${event.title} is one such
    qualifying event, granting a <strong>${sep_details.window_days}-day SEP window</strong> to
    enroll in or change coverage.
  </p>
  <p>
    SEP windows are strictly enforced. Missing the ${sep_details.window_days}-day deadline means
    waiting until the next Open Enrollment period — which could leave you without coverage for
    months. Act as soon as your qualifying event occurs.
    ${ENHANCED_CREDIT_EXPIRATION_NOTE}
  </p>

  <h2>Your Action Steps</h2>
  ${stepsHtml}

  <h2>Required Documentation</h2>
  <p>
    HealthCare.gov may request documentation verifying your qualifying life event. Submit
    documents promptly — incomplete applications can be pended, delaying your coverage start date.
  </p>
  ${documentationHtml}

  <h2>Coverage Start Dates</h2>
  <p>
    Coverage start dates during SEPs depend on when you enroll and when the qualifying event
    occurred. For loss-of-coverage events (job loss, aging off a parent plan), coverage
    typically begins the first of the month following enrollment. For birth and adoption,
    coverage may be backdated to the date of the event. Confirm your prospective start date
    during enrollment to avoid coverage gaps.
  </p>

  <h2>Subsidy Eligibility May Change With This Life Event</h2>
  <p>
    A life event often changes your APTC eligibility. Marriage changes household size. A new
    job may change your income or offer employer-sponsored insurance, which affects Marketplace
    eligibility. Update your income and household information on HealthCare.gov when enrolling
    during your SEP to ensure your subsidy reflects your new circumstances. Using an incorrect
    income estimate can result in APTC repayment when you file your federal tax return.
  </p>

  <h2>COBRA vs ACA Marketplace Coverage</h2>
  <p>
    If you lost employer-sponsored coverage, you may be eligible for COBRA continuation. Before
    electing COBRA, compare its cost to ACA Marketplace plans — particularly if you qualify for
    an APTC. ACA plans with subsidies are often significantly less expensive than COBRA, which
    requires you to pay the full premium including the employer contribution. A licensed agent
    can run a cost comparison for your specific situation at no charge.
  </p>

  ${mistakesHtml}
</section>`.trim()

  return {
    introParagraph,
    bodyHtml,
    author: buildAuthorBlock(),
    dataSourcesHtml: buildDataSourcesHtml([CMS_PUF_SOURCE, IRS_FPL_SOURCE]),
    disclaimerHtml: buildAgentDisclaimerHtml(),
  }
}

// ─── Pillar 10: Policy Scenarios ──────────────────────────────────────────────

export interface PolicyScenarioTemplateParams {
  countyName: string
  stateCode: string
  record: Pick<PolicyScenarioRecord, 'benchmark_silver_premium_age40' | 'headline' | 'age_scenarios'>
  planYear?: number
}

/**
 * Generates editorial content for an enhanced credits expiration modeling page.
 * Quantifies dollar impact of enhanced credit expiration per county/age/income.
 */
export function generatePolicyScenarioContent(params: PolicyScenarioTemplateParams): PageContent {
  const { countyName, stateCode, record, planYear = PLAN_YEAR } = params
  const { headline, age_scenarios } = record
  const benchmarkFormatted = `$${Math.round(record.benchmark_silver_premium_age40).toLocaleString()}/month`

  const introParagraph =
    `For a ${headline.age}-year-old at ${headline.fpl_percent}% FPL ` +
    `(annual income approximately $${headline.annual_income.toLocaleString()}) in ` +
    `${countyName}, ${stateCode}, current enhanced ACA subsidies reduce the monthly net premium ` +
    `to approximately $${headline.current_net_monthly_with_enhanced.toFixed(2)}/month. If the IRA ` +
    `enhanced credits expire after ${ENHANCED_CREDIT_EXPIRATION_YEAR}, the estimated monthly ` +
    `increase is <strong>$${headline.monthly_increase_at_expiration.toFixed(2)}/month</strong> ` +
    `($${headline.annual_increase_at_expiration.toFixed(2)}/year). ` +
    `Source: CMS Rate PUF + IRS FPL tables, ${planYear}.`

  const ageRowsHtml = Object.entries(age_scenarios)
    .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => entry[1] != null)
    .map(([ageKey, sc]) => {
      const ageLabel = ageKey.replace('age_', '')
      return `<tr>
          <td>Age ${ageLabel}</td>
          <td>$${sc.benchmark_premium_at_age.toFixed(2)}</td>
          <td>${sc.aptc_at_250_fpl != null ? `$${sc.aptc_at_250_fpl.toFixed(2)}` : '—'}</td>
          <td>${sc.net_premium_at_250_fpl != null ? `$${sc.net_premium_at_250_fpl.toFixed(2)}` : '—'}</td>
        </tr>`
    })
    .join('\n        ')

  const bodyHtml = `<section class="content-policy-scenario">
  <h2>Enhanced ACA Credits — What They Are and Why They May Expire</h2>
  <p>
    The American Rescue Plan Act of 2021 expanded Advance Premium Tax Credits by temporarily
    eliminating the "subsidy cliff" at 400% FPL and increasing subsidy amounts across all income
    levels. The Inflation Reduction Act of 2022 extended these enhanced credits through plan year
    ${ENHANCED_CREDIT_EXPIRATION_YEAR}. Unless Congress acts, the enhanced credit provisions
    expire and the ACA reverts to the pre-ARP subsidy formula.
  </p>
  <p>
    The benchmark silver plan premium in ${countyName}, ${stateCode} for a 40-year-old is
    ${benchmarkFormatted}. This is the anchor premium used by the IRS to compute APTC for all
    income levels in this county, adjusted by age-rating factors for other ages.
  </p>

  <h2>The Cost of Expiration in ${countyName}</h2>
  <p>
    Households at higher income levels — particularly 300–400%+ FPL — would see the largest
    increases because the pre-ARP formula excluded them from subsidies or provided much smaller
    credits. For the headline scenario in this county:
  </p>
  <ul class="policy-impact-list">
    <li>
      <strong>Age ${headline.age} at ${headline.fpl_percent}% FPL ($${headline.annual_income.toLocaleString()}/yr):</strong>
      Current net premium with enhanced credits: $${headline.current_net_monthly_with_enhanced.toFixed(2)}/month.
      At expiration: $${headline.net_monthly_without_enhanced_pre_arp.toFixed(2)}/month —
      an increase of <strong>$${headline.monthly_increase_at_expiration.toFixed(2)}/month
      ($${headline.annual_increase_at_expiration.toFixed(2)}/year)</strong>.
    </li>
  </ul>

  <h2>Age-Adjusted Scenarios at 250% FPL in ${countyName}</h2>
  <p>
    The following table shows how the benchmark premium and estimated APTC vary by age at 250%
    FPL using current enhanced credit parameters. All figures are estimates based on CMS PUF
    data and IRS FPL tables. Actual credits depend on final enrollment income, household size,
    and plan year parameters.
  </p>
  <div class="table-responsive">
    <table class="policy-age-table">
      <thead>
        <tr>
          <th>Age</th>
          <th>Benchmark Premium</th>
          <th>Est. APTC at 250% FPL</th>
          <th>Est. Net Premium</th>
        </tr>
      </thead>
      <tbody>
        ${ageRowsHtml}
      </tbody>
    </table>
  </div>
  <p class="table-note">
    Source: CMS Rate PUF ${planYear}, IRS FPL tables. Estimated figures — verify at HealthCare.gov.
  </p>

  <h2>What You Can Do Now</h2>
  <p>
    If you currently receive enhanced APTC, model your estimated premium under the pre-ARP
    formula using this page's expiration calculator. If the projected increase would make
    coverage unaffordable, contact a licensed agent to explore options — including whether
    employer-sponsored coverage, Medicaid, or other programs might be available if Marketplace
    coverage becomes too expensive. Open Enrollment each fall is the primary time to review
    and adjust your plan selection for the coming year.
  </p>
</section>`.trim()

  return {
    introParagraph,
    bodyHtml,
    author: buildAuthorBlock(),
    dataSourcesHtml: buildDataSourcesHtml([IRS_FPL_SOURCE, CMS_RATE_PUF_SOURCE, CMS_PUF_SOURCE]),
    disclaimerHtml: buildAgentDisclaimerHtml(),
  }
}
