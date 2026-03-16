import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllStateCountyCombos } from '@/lib/data-loader'
import { buildBreadcrumbSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import allStatesData from '@/data/config/all-states.json'

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

  const title = `${PLAN_YEAR} ACA Health Insurance Plans in ${stateName} | Compare Plans by County`
  const description =
    `Browse ${PLAN_YEAR} ACA Marketplace health insurance plans across ${counties.length} ` +
    `counties in ${stateName}. Compare premiums, metal tiers, and carriers. Source: CMS QHP PUF.`
  const canonical = `${SITE_URL}/plans/${params.state}`

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
  const stateName = getStateName(stateUpper)
  const counties = getAllStateCountyCombos().filter((c) => c.state === params.state)

  if (counties.length === 0) notFound()

  const canonical = `${SITE_URL}/plans/${params.state}`

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

        {/* Heading */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            {PLAN_YEAR} ACA Health Insurance Plans in {stateName}
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            Browse ACA Marketplace health insurance plans across{' '}
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
            {counties.map(({ county }) => (
              <a
                key={county}
                href={`/plans/${params.state}/${county}`}
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

        {/* Disclaimer */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400">
          <p>
            Plan data sourced from CMS QHP Landscape Public Use File, plan year {PLAN_YEAR}.
            Premiums shown before premium tax credits and vary by age, household size, and income.
            Source: CMS data.healthcare.gov.
          </p>
        </footer>

      </main>
    </>
  )
}
