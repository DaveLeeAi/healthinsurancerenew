import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSubsidyStateCountyCombos } from '@/lib/data-loader'
import { buildBreadcrumbSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import StateFPLCalculator from '@/components/StateFPLCalculator'
import allStatesData from '@/data/config/all-states.json'
import { getCountyName, stateCodeToSlug } from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface StateEntry {
  name: string
  abbr: string
  slug: string
  exchange: string
  ownExchange: boolean
  exchangeUrl?: string
}

interface Props {
  params: { state: string }
}

// Static generation — all state pages pre-built at deploy; revalidate daily
export const revalidate = 86400

export async function generateStaticParams() {
  const unique = [...new Set(
    getAllSubsidyStateCountyCombos().map(c => c.state)
  )]
  return unique.map(state => ({ state }))
}

function getStateEntry(abbr: string): StateEntry | undefined {
  return (allStatesData.states as StateEntry[]).find(
    (s) => s.abbr === abbr.toUpperCase()
  )
}

function getStateName(abbr: string): string {
  return getStateEntry(abbr)?.name ?? abbr.toUpperCase()
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateUpper = params.state.toUpperCase()
  const stateEntry = getStateEntry(stateUpper)
  if (!stateEntry) return { title: 'Not Found' }

  const stateName = stateEntry.name
  const counties = getAllSubsidyStateCountyCombos().filter((c) => c.state === params.state)
  const isSbm = stateEntry.ownExchange && counties.length === 0
  const canonical = `${SITE_URL}/subsidies/${params.state}`

  const title = isSbm
    ? `Health Insurance Subsidy Estimator — ${stateName}`
    : `${stateName} Health Insurance Subsidy Calculator ${PLAN_YEAR} | Estimate Tax Credits by County`

  const description = isSbm
    ? `Estimate your ${PLAN_YEAR} premium tax credit in ${stateName}. ` +
      `Subsidies work the same whether you enroll through ${stateEntry.exchange} or Healthcare.gov.`
    : `Calculate your ${PLAN_YEAR} premium tax credit (APTC) across ${counties.length} counties in ${stateName}. ` +
      `Enter your income to estimate your subsidy at each FPL level. Source: CMS QHP Rate PUF.`

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
export default function SubsidiesStatePage({ params }: Props) {
  const stateUpper = params.state.toUpperCase()
  const stateEntry = getStateEntry(stateUpper)

  if (!stateEntry) notFound()

  const stateName = stateEntry.name
  const counties = getAllSubsidyStateCountyCombos().filter((c) => c.state === params.state)
  const isSbm = stateEntry.ownExchange && counties.length === 0

  // If no county data AND not an SBM state, 404
  if (counties.length === 0 && !stateEntry.ownExchange) notFound()

  const canonical = `${SITE_URL}/subsidies/${params.state}`

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Subsidies', url: `${SITE_URL}/subsidies` },
    { name: stateName, url: canonical },
  ])

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <LlmComment
        pageType="subsidies-state"
        state={stateUpper}
        data="CMS-Benchmark-Premium-IRS-FPL"
        extra={{ counties: counties.length, isSbm: isSbm }}
      />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li><a href="/subsidies" className="hover:underline text-primary-600">Subsidies</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{stateName}</li>
          </ol>
        </nav>

        {isSbm ? (
          /* ── SBM State: subsidy estimator page ── */
          <>
            <section>
              <h1 className="text-3xl font-bold text-navy-900 mb-3">
                Estimate Your Health Insurance Savings in {stateName}
              </h1>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-neutral-700 leading-relaxed">
                  Premium tax credits are a federal benefit — they work the same way in{' '}
                  {stateName} regardless of whether you enroll through{' '}
                  <strong>{stateEntry.exchange}</strong> or Healthcare.gov. The calculator below
                  uses national average benchmark premiums as an estimate.
                </p>
              </div>
            </section>

            <section>
              <StateFPLCalculator
                stateName={stateName}
                stateAbbr={stateUpper}
                exchangeName={stateEntry.exchange}
                exchangeUrl="/contact"
              />
            </section>

            <section className="border-t border-neutral-200 pt-6 space-y-3">
              {/* Primary — stay on site */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                <a
                  href={`/${stateEntry.slug}/health-insurance-plans`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
                >
                  View {stateName} health plans
                </a>
                <a
                  href={`/${stateCodeToSlug(params.state.toUpperCase())}/metformin`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100 transition-colors"
                >
                  Search drug coverage in {stateName}
                </a>
              </div>

              {/* State guide link */}
              <div className="mt-3">
                <a
                  href={`/${stateEntry.slug}/health-insurance-plans`}
                  className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700"
                >
                  {stateName} health insurance guide &rarr;
                </a>
              </div>

              <p className="text-sm text-slate-500 mt-4">
                A licensed agent can provide exact premium quotes and enroll you in {stateName} plans at no cost.{' '}
                <a href="/contact" className="text-primary-600 hover:text-primary-700 underline">
                  Contact a licensed agent &rarr;
                </a>
              </p>
            </section>
          </>
        ) : (
          /* ── FFM State: county data page ── */
          <>
            <section>
              <h1 className="text-3xl font-bold text-navy-900 mb-3">
                {stateName} Health Insurance Subsidy Calculator — {PLAN_YEAR}
              </h1>
              <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
                Estimate your {PLAN_YEAR} premium tax credit (APTC) across{' '}
                <strong>{counties.length} counties</strong> in {stateName}. Select your county
                to calculate subsidies based on your household income and FPL percentage.
              </p>
            </section>

            {/* County grid */}
            <section aria-labelledby="counties-heading">
              <h2 id="counties-heading" className="text-xl font-semibold text-navy-800 mb-4">
                Select a County
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {counties.map(({ county }) => (
                  <a
                    key={county}
                    href={`/subsidies/${params.state}/${county}`}
                    className="block p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-primary-700">{getCountyName(county) ?? 'Unknown County'}</span>
                  </a>
                ))}
              </div>
            </section>

            {/* Related state data */}
            <section className="border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-semibold text-navy-800 mb-3">
                More Data for {stateName}
              </h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/${stateEntry.slug}/health-insurance-plans`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Plans in {stateName}
                </a>
                <a
                  href={`/rates/${params.state}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Rate Trends in {stateName}
                </a>
                <a
                  href={`/enhanced-credits/${params.state}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Enhanced Credits in {stateName}
                </a>
              </div>
            </section>
          </>
        )}

        {/* Byline */}
        <GenericByline dataSource="CMS Benchmark Premium & IRS FPL Tables" />

        {/* Disclaimer */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400">
          <p>
            {isSbm
              ? `Subsidy estimates use national average benchmark premiums and standard ACA applicable percentage rates. ` +
                `Actual tax credit amounts depend on the benchmark plan in your county and your final MAGI. ` +
                `Consult a licensed agent to confirm your eligibility.`
              : `Subsidy estimates are based on CMS benchmark silver premium data and IRS applicable ` +
                `percentage tables for plan year ${PLAN_YEAR}. Actual tax credit amounts depend on ` +
                `your final MAGI. Consult a licensed agent to confirm your eligibility.`
            }
          </p>
        </footer>

      </main>
    </>
  )
}
