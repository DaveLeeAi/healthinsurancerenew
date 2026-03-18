import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllStateCountyCombos } from '@/lib/data-loader'
import { buildBreadcrumbSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
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
  const canonical = `${SITE_URL}/rates/${params.state}`

  const title = isSbm
    ? `Health Insurance Rates in ${stateName} — ${stateEntry.exchange}`
    : `Health Insurance Rate Trends in ${stateName} ${PLAN_YEAR} | Premium Changes by County`

  const description = isSbm
    ? `${stateName} manages rate data through ${stateEntry.exchange}. ` +
      `Learn about premium trends and where to compare rates for plan year ${PLAN_YEAR}.`
    : `Track ${PLAN_YEAR} marketplace premium rate changes across ${counties.length} counties in ${stateName}. ` +
      `Compare year-over-year premium trends and carrier competition. Source: CMS Rate PUF.`

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

export default function RatesStatePage({ params }: Props) {
  const stateUpper = params.state.toUpperCase()
  const stateEntry = getStateEntry(stateUpper)

  if (!stateEntry) notFound()

  const stateName = stateEntry.name
  const counties = getAllStateCountyCombos().filter((c) => c.state === params.state)
  const isSbm = stateEntry.ownExchange && counties.length === 0

  // If no county data AND not an SBM state, 404
  if (counties.length === 0 && !stateEntry.ownExchange) notFound()

  const canonical = `${SITE_URL}/rates/${params.state}`

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Rates', url: `${SITE_URL}/rates` },
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
            <li><a href="/rates" className="hover:underline text-primary-600">Rates</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{stateName}</li>
          </ol>
        </nav>

        {isSbm ? (
          /* ── SBM State: informational rates page ── */
          <>
            <section>
              <h1 className="text-3xl font-bold text-navy-900 mb-3">
                Health Insurance Rate Trends in {stateName}
              </h1>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-neutral-700 leading-relaxed">
                  {stateName} files rate data with its own state exchange,{' '}
                  <strong>{stateEntry.exchange}</strong>, rather than with the federal CMS system.
                  Premium rate data for {stateName} is not available in the CMS federal dataset
                  that powers this tracker.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-navy-800">Explore {stateName} Health Insurance Data</h2>

              {/* Primary — stay on site */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                <a
                  href={`/plans/${params.state}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
                >
                  View {stateName} health plans
                </a>
                <a
                  href={`/subsidies/${params.state}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100 transition-colors"
                >
                  Estimate savings in {stateName}
                </a>
              </div>

              {/* State guide link */}
              <div className="mt-3">
                <a
                  href={`/states/${params.state}/aca-2026`}
                  className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700"
                >
                  {stateName} health insurance guide &rarr;
                </a>
              </div>

              {/* External demoted */}
              {stateEntry.exchangeUrl && (
                <p className="text-sm text-slate-500 mt-4">
                  For current rate filings in {stateName},{' '}
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
            </section>
          </>
        ) : (
          /* ── FFM State: county data page ── */
          <>
            <section>
              <h1 className="text-3xl font-bold text-navy-900 mb-3">
                Health Insurance Rate Trends in {stateName} — {PLAN_YEAR}
              </h1>
              <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
                Explore premium rate changes and carrier competition across{' '}
                <strong>{counties.length} counties</strong> in {stateName} for plan year {PLAN_YEAR}.
                Select a county to see year-over-year trend data.
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
                    href={`/rates/${params.state}/${county}`}
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
                  href={`/plans/${params.state}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Plans in {stateName}
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
              </div>
            </section>
          </>
        )}

        {/* Disclaimer */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400">
          <p>
            {isSbm
              ? `${stateName} rate data is managed by ${stateEntry.exchange}. ` +
                `Consult a licensed health insurance agent for current premium information.`
              : `Rate data sourced from the CMS Rate Review Public Use File, plan year ${PLAN_YEAR}. ` +
                `Year-over-year changes reflect benchmark silver plan premium movements. ` +
                `Source: CMS data.healthcare.gov.`
            }
          </p>
        </footer>

      </main>
    </>
  )
}
