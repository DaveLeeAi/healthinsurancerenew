import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllStateCountyCombos } from '@/lib/data-loader'
import { buildBreadcrumbSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import allStatesData from '@/data/astro/all-states.json'

const PLAN_YEAR = 2025
const SITE_URL = 'https://healthinsurancerenew.com'

interface Props {
  params: { state: string }
}

export const dynamic = 'force-dynamic'

function getStateName(abbr: string): string {
  const found = (allStatesData.states as { name: string; abbr: string }[]).find(
    (s) => s.abbr === abbr.toUpperCase()
  )
  return found?.name ?? abbr.toUpperCase()
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateUpper = params.state.toUpperCase()
  const stateName = getStateName(stateUpper)
  const counties = getAllStateCountyCombos().filter((c) => c.state === params.state)

  if (counties.length === 0) return { title: 'Not Found' }

  const title = `ACA Health Insurance Rate Trends in ${stateName} ${PLAN_YEAR} | Premium Changes by County`
  const description =
    `Track ${PLAN_YEAR} ACA premium rate changes across ${counties.length} counties in ${stateName}. ` +
    `Compare year-over-year premium trends and carrier competition. Source: CMS Rate PUF.`
  const canonical = `${SITE_URL}/rates/${params.state}`

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
  const stateName = getStateName(stateUpper)
  const counties = getAllStateCountyCombos().filter((c) => c.state === params.state)

  if (counties.length === 0) notFound()

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

        {/* Heading */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            ACA Health Insurance Rate Trends in {stateName} — {PLAN_YEAR}
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
                <span className="text-sm font-medium text-primary-700">County {county}</span>
                <span className="block text-xs text-neutral-500 mt-0.5">FIPS {county}</span>
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

        {/* Disclaimer */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400">
          <p>
            Rate data sourced from the CMS Rate Review Public Use File, plan year {PLAN_YEAR}.
            Year-over-year changes reflect benchmark silver plan premium movements.
            Source: CMS data.healthcare.gov.
          </p>
        </footer>

      </main>
    </>
  )
}
