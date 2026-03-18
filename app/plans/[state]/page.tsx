import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllStateCountyCombos } from '@/lib/data-loader'
import { buildBreadcrumbSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import StateFPLCalculator from '@/components/StateFPLCalculator'
import allStatesData from '@/data/config/all-states.json'
import { getCountyName } from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface StateEntry {
  name: string
  abbr: string
  slug: string
  exchange: string
  ownExchange: boolean
  exchangeUrl?: string
  medicaidExpanded?: boolean
}

interface Props {
  params: { state: string }
}

export const dynamic = 'force-dynamic'

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
  const counties = getAllStateCountyCombos().filter((c) => c.state === params.state)
  const isSbm = stateEntry.ownExchange && counties.length === 0
  const canonical = `${SITE_URL}/plans/${params.state}`

  const title = isSbm
    ? `Health Insurance Plans in ${stateName} | ${stateEntry.exchange}`
    : `${PLAN_YEAR} Health Insurance Plans in ${stateName} | Compare Plans by County`

  const description = isSbm
    ? `${stateName} operates ${stateEntry.exchange}, a state-based marketplace. ` +
      `Compare plans, estimate subsidies, and enroll at ${stateEntry.exchange}. Plan year ${PLAN_YEAR}.`
    : `Browse ${PLAN_YEAR} marketplace health insurance plans across ${counties.length} ` +
      `counties in ${stateName}. Compare premiums, metal tiers, and carriers. Source: CMS QHP PUF.`

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
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PlansStatePage({ params }: Props) {
  const stateUpper = params.state.toUpperCase()
  const stateEntry = getStateEntry(stateUpper)

  if (!stateEntry) notFound()

  const stateName = stateEntry.name
  const counties = getAllStateCountyCombos().filter((c) => c.state === params.state)
  const isSbm = stateEntry.ownExchange && counties.length === 0
  const canonical = `${SITE_URL}/plans/${params.state}`

  // If no county data AND not an SBM state, 404
  if (counties.length === 0 && !stateEntry.ownExchange) notFound()

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Plans', url: `${SITE_URL}/plans` },
    { name: stateName, url: canonical },
  ])

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li><a href="/plans" className="hover:underline text-primary-600">Plans</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{stateName}</li>
          </ol>
        </nav>

        {isSbm ? (
          /* ── SBM State: informational page ── */
          <>
            <section>
              <h1 className="text-3xl font-bold text-navy-900 mb-3">
                Health Insurance Plans in {stateName}
              </h1>
              <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-neutral-700 text-lg leading-relaxed">
                    {stateName} has its own state-based marketplace called{' '}
                    <strong>{stateEntry.exchange}</strong>. Plans, enrollment, and eligibility are
                    handled through {stateEntry.exchange} rather than Healthcare.gov.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="text-xs text-neutral-500 uppercase tracking-wide">State Exchange</div>
                    <div className="text-sm font-semibold text-navy-800 mt-0.5">{stateEntry.exchange}</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="text-xs text-neutral-500 uppercase tracking-wide">Medicaid Expanded</div>
                    <div className="text-sm font-semibold text-navy-800 mt-0.5">
                      {stateEntry.medicaidExpanded ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                {/* Primary — stay on site */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  <a
                    href={`/subsidies/${params.state}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Estimate your savings in {stateName}
                  </a>
                  <a
                    href={`/formulary/${params.state}/metformin`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100 transition-colors"
                  >
                    Search drug coverage in {stateName}
                  </a>
                </div>

                {/* Also link to state guide */}
                <div className="mt-3">
                  <a
                    href={`/states/${params.state}/aca-2026`}
                    className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700"
                  >
                    {stateName} health insurance guide &rarr;
                  </a>
                </div>

                {/* External demoted to small text */}
                {stateEntry.exchangeUrl && (
                  <p className="text-sm text-slate-500 mt-4">
                    To compare and enroll in {stateName} plans,{' '}
                    <a
                      href={stateEntry.exchangeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline"
                    >
                      visit {stateEntry.exchange} directly
                    </a>.
                  </p>
                )}
              </div>
            </section>

            {/* Subsidy Estimator */}
            <section aria-labelledby="subsidy-calc-heading">
              <h2 id="subsidy-calc-heading" className="text-xl font-semibold text-navy-800 mb-4">
                Estimate Your {PLAN_YEAR} Subsidy
              </h2>
              <StateFPLCalculator
                stateName={stateName}
                stateAbbr={stateUpper}
                exchangeName={stateEntry.exchange}
                exchangeUrl={stateEntry.exchangeUrl ?? 'https://www.healthcare.gov'}
              />
            </section>

            {/* Related links */}
            <section className="border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-semibold text-navy-800 mb-3">
                More About Health Insurance in {stateName}
              </h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/subsidies/${params.state}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Subsidies in {stateName}
                </a>
                <a
                  href={`/states/${stateEntry.slug}/aca-2026`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  {PLAN_YEAR} ACA Guide for {stateName}
                </a>
                <a
                  href={`/dental/${params.state}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Dental Plans in {stateName}
                </a>
              </div>
            </section>
          </>
        ) : (
          /* ── FFM State: county data page ── */
          <>
            <section>
              <h1 className="text-3xl font-bold text-navy-900 mb-3">
                {PLAN_YEAR} Health Insurance Plans in {stateName}
              </h1>
              <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
                Browse marketplace health insurance plans across{' '}
                <strong>{counties.length} counties</strong> in {stateName}. Select a county to
                compare premiums, metal tiers, and carriers for plan year {PLAN_YEAR}.
              </p>
            </section>

            {/* County grid */}
            <section aria-labelledby="counties-heading">
              <h2 id="counties-heading" className="text-xl font-semibold text-navy-800 mb-4">
                Select a County
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {counties.map(({ county }) => {
                  const countyDisplay = getCountyName(county)
                  return (
                    <a
                      key={county}
                      href={`/plans/${params.state}/${county}`}
                      className="block p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-primary-700">{countyDisplay}</span>
                    </a>
                  )
                })}
              </div>
            </section>

            {/* Related state data */}
            <section className="border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-semibold text-navy-800 mb-3">
                More Data for {stateName}
              </h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/rates/${params.state}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Rate Trends in {stateName}
                </a>
                <a
                  href={`/subsidies/${params.state}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Subsidies in {stateName}
                </a>
                <a
                  href={`/enhanced-credits/${params.state}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Enhanced Credits in {stateName}
                </a>
                <a
                  href={`/dental/${params.state}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Dental Plans in {stateName}
                </a>
              </div>
            </section>
          </>
        )}

        {/* Disclaimer */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400">
          <p>
            {isSbm
              ? `${stateName} plan data is managed by ${stateEntry.exchange}. ` +
                `Subsidy estimates are based on federal poverty level guidelines and the ACA affordability formula. ` +
                `Consult a licensed health insurance agent for personalized guidance.`
              : `Plan data sourced from CMS QHP Landscape Public Use File, plan year ${PLAN_YEAR}. ` +
                `Premiums shown before premium tax credits and vary by age, household size, and income. ` +
                `Source: CMS data.healthcare.gov.`
            }
          </p>
        </footer>

      </main>
    </>
  )
}
