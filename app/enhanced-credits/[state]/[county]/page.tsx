import type { Metadata } from 'next'
import {
  getPolicyByCounty,
  getSubsidyByCounty,
  getAllPolicyStateCountyCombos,
} from '@/lib/data-loader'
import { getRelatedEntities } from '@/lib/entity-linker'
import {
  buildPolicyScenarioSchema,
  buildBreadcrumbSchema,
  buildArticleSchema,
  buildFAQSchema,
} from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import EntityLinkCard from '@/components/EntityLinkCard'
import type { FplScenarioDetail, AgeScenario } from '@/lib/types'
import { generatePolicyScenarioContent } from '@/lib/content-templates'
import { getCountyName } from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface Props {
  params: { state: string; county: string }
}

// Static generation — all state/county combos pre-built at deploy; revalidate daily
export const revalidate = 86400

export async function generateStaticParams() {
  return getAllPolicyStateCountyCombos()
    .map(({ state, county }) => ({ state, county }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateUpper = params.state.toUpperCase()
  const countyDisplay = getCountyName(params.county) ?? `County ${params.county}`
  const canonicalUrl = `${SITE_URL}/enhanced-credits/${params.state}/${params.county}`

  const title = `Enhanced Premium Tax Credits in ${countyDisplay}, ${stateUpper} ${PLAN_YEAR} | Subsidy Cliff Analysis`
  const description =
    `Enhanced subsidies expired end of 2025. See how ${PLAN_YEAR} health insurance premiums changed ` +
    `in ${countyDisplay}, ${stateUpper} — dollar impact at every income level for ages 27–64. ` +
    `Source: federal benchmark premiums and IRS income guidelines.`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonicalUrl,
      siteName: 'HealthInsuranceRenew',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// NOTE: No name/NPN on this page — generic byline only
export default function EnhancedCreditsPage({ params }: Props) {
  const stateUpper = params.state.toUpperCase()
  const countyDisplay = getCountyName(params.county) ?? `County ${params.county}`

  // --- Data loading ---
  const scenario = getPolicyByCounty(stateUpper, params.county)
  const subsidy = getSubsidyByCounty(stateUpper, params.county)

  // --- Entity links ---
  const entityLinks = getRelatedEntities({
    pageType: 'policy-scenario',
    state: params.state,
    county: params.county,
    countyName: countyDisplay,
  })

  // --- Schema ---
  const canonicalUrl = `${SITE_URL}/enhanced-credits/${params.state}/${params.county}`

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Enhanced Credits', url: `${SITE_URL}/enhanced-credits` },
    { name: stateUpper, url: `${SITE_URL}/enhanced-credits/${params.state}` },
    { name: countyDisplay, url: canonicalUrl },
  ])

  const articleSchema = buildArticleSchema({
    headline: `Enhanced Premium Tax Credits in ${countyDisplay}, ${stateUpper} — ${PLAN_YEAR} Analysis`,
    description: `Enhanced credits expired end of 2025. See the ${PLAN_YEAR} premium increase in ${countyDisplay}, ${stateUpper}. Modeled at 6 income levels across 5 age brackets. Source: federal marketplace rate data and IRS income guidelines.`,
    dateModified: '2026-01-15',
    dataSourceName: 'Federal Marketplace Rate Data and IRS Income Guidelines',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  const policySchemas = scenario
    ? buildPolicyScenarioSchema({
        record: scenario,
        countyName: countyDisplay,
        planYear: PLAN_YEAR,
      })
    : []

  const faqSchema = buildFAQSchema(buildFaqs(stateUpper, countyDisplay, scenario))

  // --- No data fallback ---
  if (!scenario) {
    return (
      <>
        <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
        <SchemaScript schema={articleSchema} id="article-schema" />
        <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
          <Breadcrumbs
            state={params.state}
            stateUpper={stateUpper}
            countyDisplay={countyDisplay}
          />
          <section>
            <h1 className="text-3xl font-bold text-navy-900 mb-3">
              Enhanced Premium Tax Credits in {countyDisplay}, {stateUpper} — {PLAN_YEAR} Analysis
            </h1>
            <p className="text-neutral-500">
              No enhanced credit scenario data is available for this county in the {PLAN_YEAR} dataset.
            </p>
          </section>
          <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />
        </main>
      </>
    )
  }

  // --- Editorial content ---
  const editorial = generatePolicyScenarioContent({
    countyName: countyDisplay,
    stateCode: stateUpper,
    record: scenario,
    planYear: PLAN_YEAR,
  })

  // --- Derived data ---
  const { headline } = scenario
  const age40 = scenario.age_scenarios.age_40
  const fplScenarios = age40?.fpl_scenarios

  // Key FPL levels for the comparison table (200%, 300%, 400% FPL)
  const keyFpls: Array<{ key: string; label: string }> = [
    { key: 'fpl_200', label: '200% FPL' },
    { key: 'fpl_300', label: '300% FPL' },
    { key: 'fpl_400', label: '400% FPL' },
  ]

  // All FPL scenarios for the full table
  const allFplKeys = ['fpl_150', 'fpl_200', 'fpl_250', 'fpl_300', 'fpl_400', 'fpl_500']

  // Benchmark premium
  const benchmarkPremium = scenario.benchmark_silver_premium_age40

  return (
    <>
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      {policySchemas.map((schema, i) => (
        <SchemaScript key={i} schema={schema} id={`policy-schema-${i}`} />
      ))}
      <SchemaScript schema={faqSchema} id="faq-schema" />
      <LlmComment
        pageType="enhanced-credits-county"
        state={stateUpper}
        county={countyDisplay}
        data="federal-marketplace-rate-data-IRS-FPL"
        extra={{
          benchmark40: `$${scenario.benchmark_silver_premium_age40.toFixed(0)}`,
          monthlyIncrease: `$${headline.monthly_increase_at_expiration.toFixed(0)}`,
        }}
      />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* ── Breadcrumbs ── */}
        <Breadcrumbs
          state={params.state}
          stateUpper={stateUpper}
          countyDisplay={countyDisplay}
        />

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            Enhanced Premium Tax Credits in {countyDisplay}, {stateUpper} — {PLAN_YEAR} Analysis
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            The Inflation Reduction Act (IRA) enhanced premium tax credits expired on January 1, {PLAN_YEAR}.
            Marketplace enrollees in {countyDisplay}, {stateUpper} now face significantly higher health
            insurance premiums. This page shows the exact dollar impact at every income level.
          </p>
        </section>

        {/* ── Key scenario callout ── */}
        <section aria-labelledby="headline-heading">
          <h2 id="headline-heading" className="sr-only">Headline Impact</h2>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="text-sm font-semibold text-red-700 mb-2">
              Key Scenario: {headline.description}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  2025 Premium (Enhanced)
                </div>
                <div className="text-2xl font-bold text-navy-800">
                  ${headline.current_net_monthly_with_enhanced.toFixed(0)}/mo
                </div>
                <div className="text-xs text-neutral-400">With enhanced credits (expired)</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  2026 Premium (Standard)
                </div>
                <div className="text-2xl font-bold text-red-700">
                  ${headline.net_monthly_without_enhanced_pre_arp.toFixed(0)}/mo
                </div>
                <div className="text-xs text-neutral-400">Pre-ARP formula restored</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  Monthly Increase
                </div>
                <div className="text-2xl font-bold text-red-800">
                  +${headline.monthly_increase_at_expiration.toFixed(0)}/mo
                </div>
                <div className="text-xs text-red-600 font-medium">
                  +${headline.annual_increase_at_expiration.toFixed(0)}/year
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── What Are Enhanced Credits? ── */}
        <section aria-labelledby="explainer-heading">
          <h2
            id="explainer-heading"
            className="text-xl font-semibold text-navy-800 mb-4"
          >
            What Were Enhanced Premium Tax Credits?
          </h2>
          <div className="prose max-w-none text-neutral-600 leading-relaxed space-y-3">
            <p>
              The <strong>American Rescue Plan Act (ARP)</strong>, signed in March 2021, temporarily
              expanded ACA premium tax credits in two key ways: it lowered the percentage of income
              that households had to contribute toward their benchmark silver plan premium, and it
              eliminated the income cap at 400% of the Federal Poverty Level (FPL) — meaning people
              above 400% FPL could receive subsidies for the first time.
            </p>
            <p>
              The <strong>Inflation Reduction Act (IRA)</strong> of 2022 extended these enhanced
              credits through plan year 2025. Under those enhanced rules, no household paid
              more than 8.5% of their income toward a benchmark silver plan premium, regardless of
              income level. These provisions expired on January 1, {PLAN_YEAR}.
            </p>
            <p>
              With the enhanced credits now expired, the applicable
              percentage table has reverted to the pre-ARP formula defined in{' '}
              <a
                href="https://www.law.cornell.edu/uscode/text/26/36B"
                className="text-primary-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                26 U.S.C. &sect; 36B(b)(3)(A)
              </a>
              . This means lower subsidies at every income level below 400% FPL, and the complete
              elimination of subsidies for anyone earning above 400% FPL — the so-called{' '}
              <strong>&ldquo;subsidy cliff.&rdquo;</strong> Congress may act to restore these credits
              retroactively, but as of {PLAN_YEAR} they are not in effect.
            </p>
          </div>
        </section>

        {/* ── Scenario Comparison Table ── */}
        {fplScenarios && (
          <section aria-labelledby="comparison-heading">
            <h2
              id="comparison-heading"
              className="text-xl font-semibold text-navy-800 mb-4"
            >
              Premium Impact by Income Level (Age 40)
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Based on the {PLAN_YEAR} second-lowest-cost Silver plan (SLCSP) benchmark premium
              of <strong>${benchmarkPremium.toFixed(2)}/month</strong> for age 40 in{' '}
              {countyDisplay}, {stateUpper}. Household size: {scenario.household_size}.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-navy-50 text-navy-700">
                    <th className="text-left py-3 px-4 font-semibold">Income Level</th>
                    <th className="text-right py-3 px-4 font-semibold">Annual Income</th>
                    <th className="text-right py-3 px-4 font-semibold">
                      <span className="text-green-700">2025 (Enhanced)</span>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      <span className="text-red-700">2026 (Standard)</span>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">Monthly Increase</th>
                    <th className="text-right py-3 px-4 font-semibold">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {allFplKeys.map((key) => {
                    const fpl = fplScenarios[key]
                    if (!fpl) return null
                    const impactPositive = fpl.expiration_impact.monthly_premium_increase > 0
                    return (
                      <tr
                        key={key}
                        className="border-b border-neutral-100 hover:bg-neutral-50"
                      >
                        <td className="py-3 px-4 font-medium text-navy-800">
                          {fpl.fpl_percent}% FPL
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600">
                          ${fpl.annual_income.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-green-700">
                          ${fpl.with_enhanced_credits.net_monthly_premium.toFixed(0)}/mo
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-red-700">
                          ${fpl.without_enhanced_credits_pre_arp.net_monthly_premium.toFixed(0)}/mo
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          {impactPositive ? (
                            <span className="text-red-800">
                              +${fpl.expiration_impact.monthly_premium_increase.toFixed(0)}/mo
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <ImpactBadge level={fpl.expiration_impact.impact_level} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Net monthly premium after APTC subsidy. &ldquo;2026 (Standard)&rdquo; uses the
              pre-ARP applicable percentage table per IRC &sect; 36B, now in effect. Source: federal marketplace rate data and IRS income guidelines, {PLAN_YEAR}.
            </p>
          </section>
        )}

        {/* ── The Subsidy Cliff — visual callout ── */}
        <section aria-labelledby="cliff-heading">
          <h2
            id="cliff-heading"
            className="text-xl font-semibold text-navy-800 mb-4"
          >
            The Subsidy Cliff: What 400%+ FPL Households Face
          </h2>
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-lg font-bold">
                !
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 text-lg">
                  The &ldquo;Subsidy Cliff&rdquo; Has Returned for {PLAN_YEAR}
                </h3>
                <p className="text-amber-800 mt-1">
                  With enhanced credits expired, households earning above 400% of the Federal Poverty Level
                  now receive <strong>zero premium assistance</strong>. The enhanced credits had eliminated
                  this cliff by capping premiums at 8.5% of income regardless of how much you earned.
                  That protection is no longer in effect.
                </p>
              </div>
            </div>
            {fplScenarios && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <CliffScenarioCard
                  label="At 300% FPL"
                  fplData={fplScenarios['fpl_300']}
                  countyDisplay={countyDisplay}
                  stateUpper={stateUpper}
                />
                <CliffScenarioCard
                  label="At 250% FPL"
                  fplData={fplScenarios['fpl_250']}
                  countyDisplay={countyDisplay}
                  stateUpper={stateUpper}
                />
              </div>
            )}
            <p className="text-xs text-amber-700 mt-4">
              A 40-year-old earning 250% FPL (~${fplScenarios?.['fpl_250']?.annual_income.toLocaleString() ?? '48,900'}/year)
              in {countyDisplay} would see their monthly premium{' '}
              {fplScenarios?.['fpl_250']?.expiration_impact.monthly_premium_increase
                ? `increase by $${fplScenarios['fpl_250'].expiration_impact.monthly_premium_increase.toFixed(0)}/month`
                : 'change'}{' '}
              — that is the single most impactful scenario for middle-income enrollees.
            </p>
          </div>
        </section>

        {/* ── Age breakdown table ── */}
        <section aria-labelledby="age-heading">
          <h2
            id="age-heading"
            className="text-xl font-semibold text-navy-800 mb-4"
          >
            Impact Across Age Groups (250% FPL)
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            How the enhanced credit expiration affects enrollees of different ages at the same
            income level (250% FPL) in {countyDisplay}.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-navy-50 text-navy-700">
                  <th className="text-left py-3 px-4 font-semibold">Age</th>
                  <th className="text-right py-3 px-4 font-semibold">Benchmark Premium</th>
                  <th className="text-right py-3 px-4 font-semibold">2025 (Enhanced)</th>
                  <th className="text-right py-3 px-4 font-semibold">2026 (Standard)</th>
                  <th className="text-right py-3 px-4 font-semibold">Monthly Increase</th>
                </tr>
              </thead>
              <tbody>
                {(['age_27', 'age_40', 'age_50', 'age_60', 'age_64'] as const).map((ageKey) => {
                  const ageData = scenario.age_scenarios[ageKey]
                  if (!ageData) return null
                  const fpl250 = ageData.fpl_scenarios?.['fpl_250']
                  if (!fpl250) return null
                  const increase = fpl250.expiration_impact.monthly_premium_increase
                  return (
                    <tr
                      key={ageKey}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-3 px-4 font-medium text-navy-800">
                        Age {ageData.age}
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600">
                        ${ageData.benchmark_premium_at_age.toFixed(0)}/mo
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-700">
                        ${fpl250.with_enhanced_credits.net_monthly_premium.toFixed(0)}/mo
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-red-700">
                        ${fpl250.without_enhanced_credits_pre_arp.net_monthly_premium.toFixed(0)}/mo
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {increase > 0 ? (
                          <span className="text-red-800">+${increase.toFixed(0)}/mo</span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Age rating factors per 45 CFR &sect; 147.102. Benchmark = SLCSP for {countyDisplay}.
            All figures at 250% FPL, household size {scenario.household_size}.
          </p>
        </section>

        {/* ── What This Means for [County] Residents ── */}
        <section aria-labelledby="local-heading">
          <h2
            id="local-heading"
            className="text-xl font-semibold text-navy-800 mb-4"
          >
            What This Means for {countyDisplay} Residents
          </h2>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <p className="text-neutral-700 leading-relaxed">
              In {countyDisplay}, {stateUpper}, the {PLAN_YEAR} benchmark silver plan premium for a
              40-year-old is <strong>${benchmarkPremium.toFixed(2)}/month</strong>
              {subsidy && (
                <>
                  {' '}(FPL base: ${scenario.fpl_base.toLocaleString()} for a household of{' '}
                  {scenario.household_size})
                </>
              )}
              . Under enhanced credits, a 40-year-old at 250% FPL pays approximately{' '}
              <strong>
                ${headline.current_net_monthly_with_enhanced.toFixed(0)}/month
              </strong>{' '}
              after their subsidy. If enhanced credits expire, that same person would pay{' '}
              <strong>
                ${headline.net_monthly_without_enhanced_pre_arp.toFixed(0)}/month
              </strong>{' '}
              — an increase of{' '}
              <strong>${headline.monthly_increase_at_expiration.toFixed(0)}/month</strong> (
              <strong>${headline.annual_increase_at_expiration.toFixed(0)}/year</strong>).
            </p>
            {fplScenarios?.['fpl_150'] && (
              <p className="text-neutral-700 leading-relaxed mt-3">
                Lower-income enrollees are also affected: at 150% FPL (~$
                {fplScenarios['fpl_150'].annual_income.toLocaleString()}/year), the monthly
                premium increase would be{' '}
                <strong>
                  ${fplScenarios['fpl_150'].expiration_impact.monthly_premium_increase.toFixed(0)}/month
                </strong>
                . The impact is consistent across income levels because the enhanced credits
                reduced applicable percentages at every tier, not just at the subsidy cliff.
              </p>
            )}
          </div>
        </section>

        {/* ── What You Should Do ── */}
        <section aria-labelledby="action-heading">
          <h2 id="action-heading" className="text-xl font-semibold text-navy-800 mb-4">
            What You Should Do
          </h2>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 space-y-4">
            <ActionTip
              number={1}
              title="Review your 2026 plan options now"
              text={`Enhanced credits are no longer in effect for ${PLAN_YEAR}. If you enrolled based on 2025 subsidy amounts, your net premium has likely increased. Review your current plan and consider switching during Open Enrollment or a qualifying Special Enrollment Period.`}
            />
            <ActionTip
              number={2}
              title="Understand your FPL bracket"
              text={`Your Federal Poverty Level percentage determines your subsidy amount. In ${countyDisplay}, the benchmark premium is $${benchmarkPremium.toFixed(0)}/month (age 40). Use our county subsidy calculator to see your exact APTC based on your household income and size.`}
            />
            <ActionTip
              number={3}
              title="Watch for income changes near the 400% FPL cliff"
              text="With the subsidy cliff back in effect for 2026, exceeding 400% FPL means losing all premium assistance. If your income is near that threshold, report changes to Healthcare.gov promptly and consider strategies to manage your modified adjusted gross income."
            />
            <ActionTip
              number={4}
              title="Talk to a licensed agent about your options"
              text="A licensed health insurance agent can model your exact scenario — factoring in your household size, projected income, state-specific rules, and plan options — to help you find the most cost-effective coverage under the current 2026 subsidy rules."
            />
          </div>
        </section>

        {/* ── Regulatory reference ── */}
        <section aria-labelledby="legal-heading">
          <h2
            id="legal-heading"
            className="text-xl font-semibold text-navy-800 mb-4"
          >
            Regulatory Basis
          </h2>
          <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 space-y-2 text-sm text-neutral-600">
            <p>
              <strong>IRC Section 36B</strong> — Refundable credit for coverage under a qualified
              health plan. Defines the applicable percentage table used to calculate the maximum
              household premium contribution.
            </p>
            <p>
              <strong>ARP Section 9661</strong> — Temporarily modified the applicable percentage
              table for tax years 2021–2022, lowering the maximum contribution and eliminating the
              400% FPL cap on subsidy eligibility.
            </p>
            <p>
              <strong>Inflation Reduction Act (P.L. 117-169, Section 12001)</strong> — Extended the
              ARP modifications through tax year 2025. These provisions expired January 1, {PLAN_YEAR}.
            </p>
            <p>
              <strong>45 CFR &sect; 147.102</strong> — CMS age rating curve used to calculate
              age-adjusted benchmark premiums across all modeled ages.
            </p>
          </div>
        </section>

        {/* ── Editorial content ── */}
        <section className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }} />

        {/* ── Entity links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ── Byline ── */}
        <GenericByline dataSource="Federal Marketplace Rate Data and IRS Income Guidelines" />

        {/* ── Medical disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            All premium amounts are estimates based on federal benchmark data and IRS income guidelines for
            plan year {PLAN_YEAR}. Actual premiums depend on your specific plan selection, age,
            tobacco use, household size, and income. Enhanced credits expired at the end of 2025.
            Congress may act to restore them retroactively.
          </p>
          <p>
            This page is for informational purposes only and does not constitute insurance or tax
            advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> to evaluate your specific
            coverage options and confirm subsidy eligibility.
          </p>
        </footer>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// FAQ builder
// ---------------------------------------------------------------------------

function buildFaqs(
  stateUpper: string,
  countyDisplay: string,
  scenario: ReturnType<typeof getPolicyByCounty>
) {
  const fpl250 = scenario?.age_scenarios.age_40?.fpl_scenarios?.['fpl_250']

  return [
    {
      question: `What were enhanced premium tax credits?`,
      answer: `Enhanced premium tax credits were introduced by the American Rescue Plan Act in 2021 and extended through 2025 by the Inflation Reduction Act. They lowered the percentage of income that households had to contribute toward benchmark silver plan premiums and eliminated the 400% FPL income cap on subsidy eligibility. They expired on January 1, 2026.`,
    },
    {
      question: `How did the enhanced credit expiration affect premiums in ${countyDisplay}, ${stateUpper}?`,
      answer: fpl250
        ? `With enhanced credits expired, a 40-year-old at 250% FPL in ${countyDisplay} saw their monthly premium increase from $${fpl250.with_enhanced_credits.net_monthly_premium.toFixed(0)}/month to $${fpl250.without_enhanced_credits_pre_arp.net_monthly_premium.toFixed(0)}/month — an increase of $${fpl250.expiration_impact.monthly_premium_increase.toFixed(0)}/month ($${fpl250.expiration_impact.annual_premium_increase.toFixed(0)}/year).`
        : `With enhanced credits expired, marketplace enrollees in ${countyDisplay} face higher premiums across all income levels. The exact impact depends on age and income.`,
    },
    {
      question: `What is the ACA subsidy cliff?`,
      answer: `Under the pre-ARP rules now restored for 2026 (IRC Section 36B), households earning above 400% of the Federal Poverty Level receive zero premium tax credits — this is the "subsidy cliff." The enhanced credits had eliminated this cliff by capping premiums at 8.5% of income regardless of earnings. With those credits expired, the cliff is back in effect.`,
    },
    {
      question: `How much does a benchmark silver plan cost in ${countyDisplay}, ${stateUpper}?`,
      answer: scenario
        ? `The ${PLAN_YEAR} second-lowest-cost Silver plan (SLCSP) benchmark premium for a 40-year-old in ${countyDisplay} is $${scenario.benchmark_silver_premium_age40.toFixed(2)}/month before subsidies. Source: federal marketplace rate filings.`
        : `Benchmark silver plan premiums vary by county. Check federal marketplace rate filings for current data.`,
    },
    {
      question: `When did enhanced premium tax credits expire?`,
      answer: `Enhanced premium tax credits expired on January 1, ${PLAN_YEAR}. They were authorized through plan year 2025 under the Inflation Reduction Act (P.L. 117-169, Section 12001). Congress may act to restore them retroactively, but as of ${PLAN_YEAR} they are not in effect.`,
    },
  ]
}

// ---------------------------------------------------------------------------
// Local sub-components
// ---------------------------------------------------------------------------

function Breadcrumbs({
  state,
  stateUpper,
  countyDisplay,
}: {
  state: string
  stateUpper: string
  countyDisplay: string
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <a href="/" className="hover:underline text-primary-600">
            Home
          </a>
        </li>
        <li aria-hidden="true" className="text-neutral-300">
          &rsaquo;
        </li>
        <li>
          <a href="/enhanced-credits" className="hover:underline text-primary-600">
            Enhanced Credits
          </a>
        </li>
        <li aria-hidden="true" className="text-neutral-300">
          &rsaquo;
        </li>
        <li>
          <a
            href={`/enhanced-credits/${state}`}
            className="hover:underline text-primary-600"
          >
            {stateUpper}
          </a>
        </li>
        <li aria-hidden="true" className="text-neutral-300">
          &rsaquo;
        </li>
        <li aria-current="page" className="text-neutral-700 font-medium">
          {countyDisplay}
        </li>
      </ol>
    </nav>
  )
}

function ActionTip({
  number,
  title,
  text,
}: {
  number: number
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-primary-900 mb-1">{title}</h3>
        <p className="text-sm text-primary-700 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

function ImpactBadge({
  level,
}: {
  level: string
}) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    catastrophic: { bg: 'bg-red-100', text: 'text-red-800', label: 'Catastrophic' },
    severe: { bg: 'bg-red-50', text: 'text-red-700', label: 'Severe' },
    significant: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Significant' },
    moderate: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Moderate' },
    minimal: { bg: 'bg-green-50', text: 'text-green-700', label: 'Minimal' },
    no_impact: { bg: 'bg-neutral-100', text: 'text-neutral-500', label: 'No Impact' },
  }
  const c = config[level] ?? config['no_impact']
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  )
}

function CliffScenarioCard({
  label,
  fplData,
  countyDisplay,
  stateUpper,
}: {
  label: string
  fplData: FplScenarioDetail | undefined
  countyDisplay: string
  stateUpper: string
}) {
  if (!fplData || fplData.expiration_impact.monthly_premium_increase <= 0) return null
  return (
    <div className="bg-white rounded-lg p-4 border border-amber-200">
      <div className="text-sm font-semibold text-amber-900 mb-2">{label}</div>
      <div className="text-xs text-neutral-500 mb-1">
        Income: ${fplData.annual_income.toLocaleString()}/year
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-green-700 font-semibold">
          ${fplData.with_enhanced_credits.net_monthly_premium.toFixed(0)}/mo
        </span>
        <span className="text-neutral-400">&rarr;</span>
        <span className="text-red-700 font-semibold">
          ${fplData.without_enhanced_credits_pre_arp.net_monthly_premium.toFixed(0)}/mo
        </span>
      </div>
      <div className="text-red-800 font-bold text-lg">
        +${fplData.expiration_impact.monthly_premium_increase.toFixed(0)}/mo
      </div>
      <div className="text-xs text-red-600">
        +${fplData.expiration_impact.annual_premium_increase.toFixed(0)}/year in {countyDisplay}
      </div>
    </div>
  )
}
