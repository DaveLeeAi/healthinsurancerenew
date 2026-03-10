import type { Metadata } from 'next'
import {
  getSubsidyByCounty,
  getPolicyByCounty,
  getAllSubsidyStateCountyCombos,
} from '@/lib/data-loader'
import { getRelatedEntities } from '@/lib/entity-linker'
import {
  buildSubsidySchemas,
  buildBreadcrumbSchema,
} from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import SubsidyCalculator from '@/components/SubsidyCalculator'
import EntityLinkCard from '@/components/EntityLinkCard'
import type { FplTierEstimate } from '@/lib/types'

const PLAN_YEAR = 2025
const SITE_URL  = 'https://healthinsurancerenew.com'

interface Props {
  params: { state: string; county: string }
}

// ---------------------------------------------------------------------------
// Static params — sourced from subsidy_engine.json
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return getAllSubsidyStateCountyCombos()
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateUpper   = params.state.toUpperCase()
  const countyDisplay = `County ${params.county}`
  const subsidy      = getSubsidyByCounty(stateUpper, params.county)

  const benchmark = subsidy?.benchmark_silver_premium
  const benchmarkStr = benchmark ? ` Benchmark silver premium: $${benchmark.toFixed(0)}/mo.` : ''

  const canonicalUrl = `${SITE_URL}/subsidies/${params.state}/${params.county}`

  const title = `${countyDisplay}, ${stateUpper} ACA Subsidy Calculator ${PLAN_YEAR} | Estimate Your Tax Credit`

  const description =
    `Calculate your ${PLAN_YEAR} ACA premium tax credit (APTC) for ${countyDisplay},` +
    ` ${stateUpper}. Enter your income to see your estimated subsidy at each FPL level.` +
    `${benchmarkStr} Source: CMS QHP Rate PUF.`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type:        'article',
      title,
      description,
      url:         canonicalUrl,
      siteName:    'HealthInsuranceRenew',
      locale:      'en_US',
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SubsidiesPage({ params }: Props) {
  const stateUpper    = params.state.toUpperCase()
  const countyDisplay = `County ${params.county}`

  const subsidy         = getSubsidyByCounty(stateUpper, params.county)
  const policyScenario  = getPolicyByCounty(stateUpper, params.county)

  const enhancedCreditsHref = `/enhanced-credits/${params.state}/${params.county}`
  const plansHref           = `/plans/${params.state}/${params.county}`
  const canonicalUrl        = `${SITE_URL}/subsidies/${params.state}/${params.county}`

  // Entity links
  const entityLinks = getRelatedEntities({
    pageType:    'subsidy',
    state:       params.state,
    county:      params.county,
    countyName:  countyDisplay,
  })

  // Schema (only when we have subsidy data)
  const subsidySchemas = subsidy
    ? buildSubsidySchemas({
        stateCode:    stateUpper,
        countyName:   countyDisplay,
        subsidyRecord: subsidy,
        planYear:     PLAN_YEAR,
      })
    : []

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home',      url: SITE_URL },
    { name: 'Subsidies', url: `${SITE_URL}/subsidies` },
    { name: stateUpper,  url: `${SITE_URL}/subsidies/${params.state}` },
    { name: countyDisplay, url: canonicalUrl },
  ])

  // Sorted FPL tiers for the static reference table
  const fplTiers: FplTierEstimate[] = subsidy
    ? (Object.values(subsidy.subsidy_estimates) as (FplTierEstimate | undefined)[])
        .filter((t): t is FplTierEstimate => t !== undefined)
        .sort((a, b) => a.fpl_percent - b.fpl_percent)
    : []

  return (
    <>
      {subsidySchemas.map((schema, i) => (
        <SchemaScript key={i} schema={schema} id={`subsidy-schema-${i}`} />
      ))}
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <a href="/" className="hover:underline text-primary-600">Home</a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li>
              <a href="/subsidies" className="hover:underline text-primary-600">Subsidies</a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li>
              <a href={`/subsidies/${params.state}`} className="hover:underline text-primary-600">
                {stateUpper}
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{countyDisplay}</li>
          </ol>
        </nav>

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            {countyDisplay}, {stateUpper} ACA Subsidy Calculator {PLAN_YEAR}
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed">
            {subsidy ? (
              <>
                The benchmark silver plan premium in {countyDisplay} is{' '}
                <strong>${subsidy.benchmark_silver_premium.toFixed(0)}/month</strong> (age-40
                reference rate). Enter your household details below to estimate your Advance
                Premium Tax Credit (APTC) and net monthly premium. Source: CMS QHP Rate PUF ·
                Plan Year {PLAN_YEAR}.
              </>
            ) : (
              <>
                ACA subsidy data is not available for {countyDisplay}, {stateUpper} in the{' '}
                {PLAN_YEAR} dataset.
              </>
            )}
          </p>
        </section>

        {/* ── Interactive calculator ── */}
        {subsidy ? (
          <section aria-labelledby="calc-heading">
            <h2 id="calc-heading" className="sr-only">Subsidy Calculator</h2>
            <SubsidyCalculator
              data={subsidy}
              policyScenario={policyScenario ?? undefined}
              countyDisplay={countyDisplay}
              enhancedCreditsHref={enhancedCreditsHref}
            />
          </section>
        ) : (
          <p className="text-neutral-500">
            No subsidy data available for this county. Try{' '}
            <a href="/subsidies" className="underline text-primary-600">
              browsing all counties
            </a>
            .
          </p>
        )}

        {/* ── Static educational content ── */}
        {subsidy && (
          <section aria-labelledby="how-subsidies-heading" className="space-y-6">
            <h2
              id="how-subsidies-heading"
              className="text-2xl font-semibold text-navy-800"
            >
              How ACA Subsidies Work in {countyDisplay}, {stateUpper}
            </h2>

            <div className="prose prose-neutral max-w-none space-y-4 text-neutral-700 leading-relaxed">
              <p>
                The Advance Premium Tax Credit (APTC) is a federal subsidy that lowers your
                monthly ACA health insurance premium. It is calculated based on the{' '}
                <strong>benchmark silver plan</strong> — the second-lowest-cost silver plan
                available in {countyDisplay}. For {PLAN_YEAR}, that benchmark premium is{' '}
                <strong>${subsidy.benchmark_silver_premium.toFixed(0)}/month</strong> at the
                age-40 reference rate. Your subsidy equals the benchmark premium minus the
                amount the government expects you to contribute, which is a percentage of your
                income set by ACA law.
              </p>
              <p>
                Eligibility is based on your household income relative to the Federal Poverty
                Level (FPL). In {PLAN_YEAR}, 100% FPL for a {subsidy.household_size}-person
                household is <strong>${subsidy.fpl_base.toLocaleString()}/year</strong>.
                Households earning between 100% and 400% FPL qualify for the standard credit.
                Under the IRA enhanced credits (currently in effect through {PLAN_YEAR}),
                subsidies are also available above 400% FPL, with your contribution capped at
                8.5% of your income. If these enhanced credits expire, the 400% FPL cliff
                would be reinstated and no subsidy would apply above that threshold.
              </p>
              <p>
                To use your credit, you apply it when enrolling through HealthCare.gov or your
                state marketplace. You can take the full credit in advance to lower your monthly
                bill, or claim it as a lump sum when you file your federal tax return. If your
                income changes during the year, you must report it to the marketplace to avoid
                repaying excess credits at tax time.{' '}
                <a href={plansHref} className="underline text-primary-600">
                  Compare all {PLAN_YEAR} ACA plans in {countyDisplay} →
                </a>
              </p>
            </div>

            {/* ── FPL reference table ── */}
            {fplTiers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-navy-800 mb-3">
                  APTC Amounts by FPL Level — {countyDisplay} ({PLAN_YEAR})
                </h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Based on the ${subsidy.benchmark_silver_premium.toFixed(0)}/mo benchmark
                  silver premium · Household size {subsidy.household_size} · Age-40 reference
                </p>
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-navy-50 text-navy-700 text-left">
                        <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">
                          FPL %
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">
                          Annual Income
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap text-right">
                          Monthly APTC
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap text-right">
                          Your Contribution
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap text-right">
                          Net Silver Premium
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap text-right">
                          App. % of Income
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fplTiers.map((tier) => (
                        <tr
                          key={tier.fpl_percent}
                          className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors"
                        >
                          <th scope="row" className="px-4 py-3 font-semibold text-navy-700">
                            {tier.fpl_percent}%
                          </th>
                          <td className="px-4 py-3 text-neutral-600">
                            ${tier.annual_income.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-primary-700">
                            ${tier.monthly_aptc.toFixed(0)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-neutral-600">
                            ${tier.monthly_contribution.toFixed(0)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-neutral-600">
                            ${tier.net_monthly_premium.toFixed(0)}
                          </td>
                          <td className="px-4 py-3 text-right text-neutral-500">
                            {(tier.applicable_percentage * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Source: CMS QHP Rate PUF {PLAN_YEAR} · Amounts are estimates at the age-40
                  reference rate · Consult a licensed agent to confirm your eligibility
                </p>
              </div>
            )}

            {/* ── Link to enhanced credit scenario ── */}
            {policyScenario && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h3 className="font-semibold text-amber-900 mb-2">
                  What If Enhanced Credits Expire?
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  If IRA enhanced subsidies expire, a{' '}
                  <strong>
                    {policyScenario.headline.age}-year-old at{' '}
                    {policyScenario.headline.fpl_percent}% FPL
                  </strong>{' '}
                  (${policyScenario.headline.annual_income.toLocaleString()}/yr) in{' '}
                  {countyDisplay} would pay an estimated{' '}
                  <strong>
                    +${policyScenario.headline.monthly_increase_at_expiration.toFixed(0)}/month
                  </strong>{' '}
                  more — ${policyScenario.headline.annual_increase_at_expiration.toFixed(0)}/year.
                </p>
                <a
                  href={enhancedCreditsHref}
                  className="inline-block mt-3 text-sm font-medium text-amber-800 underline"
                >
                  See full enhanced credit expiration analysis for {countyDisplay} →
                </a>
              </div>
            )}
          </section>
        )}

        {/* ── Entity links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ── Disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Subsidy estimates are based on the CMS QHP Rate PUF benchmark silver premium for
            plan year {PLAN_YEAR}. All APTC amounts are estimates and subject to change based
            on final income, enrollment date, household composition, and applicable law.
            Enhanced credit availability depends on current legislation.
          </p>
          <p>
            This page is for informational purposes only and does not constitute tax or
            insurance advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> or tax professional to
            confirm your subsidy eligibility and optimize your plan selection.
          </p>
        </footer>

      </main>
    </>
  )
}
