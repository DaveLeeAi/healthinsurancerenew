// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { getDentalByState, loadDentalCoverage } from '@/lib/data-loader'
import { buildBreadcrumbSchema, buildArticleSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import GlobalCTA from '@/components/GlobalCTA'
import LlmComment from '@/components/LlmComment'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

const STATE_NAMES: Record<string, string> = {
  AK: 'Alaska', AL: 'Alabama', AR: 'Arkansas', AZ: 'Arizona', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DC: 'District of Columbia', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', IA: 'Iowa', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  MA: 'Massachusetts', MD: 'Maryland', ME: 'Maine', MI: 'Michigan', MN: 'Minnesota',
  MO: 'Missouri', MS: 'Mississippi', MT: 'Montana', NC: 'North Carolina',
  ND: 'North Dakota', NE: 'Nebraska', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NV: 'Nevada', NY: 'New York', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VA: 'Virginia',
  VT: 'Vermont', WA: 'Washington', WI: 'Wisconsin', WV: 'West Virginia', WY: 'Wyoming',
}

interface Props {
  params: { state: string }
}

// Static generation — all dental states pre-built at deploy; revalidate daily
export const revalidate = 86400

export async function generateStaticParams() {
  const states = [...new Set(
    loadDentalCoverage().data.map(d => d.state_code.toLowerCase())
  )]
  return states.map(state => ({ state }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateUpper = params.state.toUpperCase()
  const stateName = STATE_NAMES[stateUpper] ?? stateUpper
  const plans = getDentalByState(stateUpper)
  const canonicalUrl = `${SITE_URL}/dental/${params.state}`

  const title = `${stateName} Dental Plans ${PLAN_YEAR} — ${plans.length} Stand-Alone Options Compared`
  const description =
    `Compare all ${plans.length} stand-alone dental plans (SADPs) available in ${stateName} for ${PLAN_YEAR}. ` +
    `Coverage percentages, annual maximums, waiting periods, and issuer details from federal dental plan data.`

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

export default function DentalStatePage({ params }: Props) {
  const stateUpper = params.state.toUpperCase()
  const stateName = STATE_NAMES[stateUpper] ?? stateUpper
  const plans = getDentalByState(stateUpper)
  const canonicalUrl = `${SITE_URL}/dental/${params.state}`

  // --- Derived stats ---
  const issuers = new Set(plans.map((p) => p.issuer_name))
  const planTypes = new Set(plans.map((p) => p.plan_type))
  const annualMaxes = plans
    .map((p) => p.annual_maximum.individual_in_network)
    .filter((v): v is number => v != null)
  const avgMax = annualMaxes.length > 0
    ? Math.round(annualMaxes.reduce((a, b) => a + b, 0) / annualMaxes.length)
    : null
  const orthoCount = plans.filter((p) => p.ortho_adult_covered).length

  // --- Group by issuer ---
  const byIssuer = new Map<string, typeof plans>()
  for (const p of plans) {
    const existing = byIssuer.get(p.issuer_name) ?? []
    existing.push(p)
    byIssuer.set(p.issuer_name, existing)
  }
  const issuerList = [...byIssuer.entries()].sort((a, b) => b[1].length - a[1].length)

  // --- Schema ---
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Dental', url: `${SITE_URL}/dental` },
    { name: stateName, url: canonicalUrl },
  ])

  const articleSchema = buildArticleSchema({
    headline: `${stateName} Stand-Alone Dental Plans for ${PLAN_YEAR}`,
    description: `${plans.length} SADP dental plan variants from ${issuers.size} issuers in ${stateName}. Source: federal dental plan data.`,
    dateModified: '2026-01-15',
    dataSourceName: 'federal dental plan data',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={articleSchema} id="article-schema" />
      <LlmComment
        pageType="dental-state"
        state={stateUpper}
        planCount={plans.length}
        carrierCount={issuers.size}
        year={PLAN_YEAR}
        data="federal-dental-plan-data"
      />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li><a href="/dental" className="hover:underline text-primary-600">Dental</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{stateName}</li>
          </ol>
        </nav>

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            {stateName} Stand-Alone Dental Plans — {PLAN_YEAR}
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            <strong>{plans.length}</strong> dental plan variant{plans.length !== 1 ? 's' : ''} from{' '}
            <strong>{issuers.size}</strong> issuer{issuers.size !== 1 ? 's' : ''} are available in{' '}
            {stateName} through the marketplace for {PLAN_YEAR}. These are stand-alone dental
            plans (SADPs), purchased separately from medical coverage.
          </p>
        </section>

        {/* ── Key Stats ── */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="text-xl font-semibold text-navy-800 mb-4">
            {stateName} Dental Market at a Glance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Plan Variants</div>
              <div className="text-2xl font-bold text-navy-800">{plans.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Issuers</div>
              <div className="text-2xl font-bold text-navy-800">{issuers.size}</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Avg Annual Max</div>
              <div className="text-2xl font-bold text-navy-800">
                {avgMax != null ? `$${avgMax.toLocaleString()}` : 'N/A'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Adult Ortho Plans</div>
              <div className="text-2xl font-bold text-navy-800">{orthoCount}</div>
              <div className="text-xs text-neutral-400 mt-0.5">of {plans.length} total</div>
            </div>
          </div>
        </section>

        {/* ── Full plan table ── */}
        <section aria-labelledby="all-plans-heading">
          <h2 id="all-plans-heading" className="text-xl font-semibold text-navy-800 mb-4">
            All Dental Plans in {stateName}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-teal-50 text-teal-800">
                  <th className="text-left py-3 px-4 font-semibold">Plan Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Issuer</th>
                  <th className="text-right py-3 px-4 font-semibold">Level</th>
                  <th className="text-right py-3 px-4 font-semibold">Type</th>
                  <th className="text-right py-3 px-4 font-semibold">Annual Max</th>
                  <th className="text-right py-3 px-4 font-semibold">Preventive</th>
                  <th className="text-right py-3 px-4 font-semibold">Basic</th>
                  <th className="text-right py-3 px-4 font-semibold">Major</th>
                  <th className="text-right py-3 px-4 font-semibold">Ortho</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr
                    key={p.plan_variant_id}
                    className="border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="py-3 px-4">
                      <a
                        href={`/dental/${params.state}/${p.plan_variant_id}`}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {p.plan_name}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{p.issuer_name}</td>
                    <td className="py-3 px-4 text-right text-neutral-600">{p.metal_level}</td>
                    <td className="py-3 px-4 text-right text-neutral-600">{p.plan_type}</td>
                    <td className="py-3 px-4 text-right font-medium text-navy-800">
                      {p.annual_maximum.individual_in_network != null
                        ? `$${p.annual_maximum.individual_in_network.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {p.coverage_percentages.preventive_adult != null
                        ? `${p.coverage_percentages.preventive_adult}%`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {p.coverage_percentages.basic_adult != null
                        ? `${p.coverage_percentages.basic_adult}%`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {p.coverage_percentages.major_adult != null
                        ? `${p.coverage_percentages.major_adult}%`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.ortho_adult_covered ? (
                        <span className="text-green-700 font-medium">Yes</span>
                      ) : (
                        <span className="text-neutral-400">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Coverage percentages = plan pays (%). Network types: {[...planTypes].join(', ')}.
            Source: federal dental plan data, plan year {PLAN_YEAR}.
          </p>
        </section>

        {/* ── Issuers breakdown ── */}
        <section aria-labelledby="issuers-heading">
          <h2 id="issuers-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Dental Plan Issuers in {stateName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {issuerList.map(([issuer, issuerPlans]) => (
              <div
                key={issuer}
                className="p-4 rounded-xl bg-neutral-50 border border-neutral-200"
              >
                <div className="font-semibold text-navy-800 mb-1">{issuer}</div>
                <div className="text-sm text-neutral-500">
                  {issuerPlans.length} plan variant{issuerPlans.length !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Types: {[...new Set(issuerPlans.map((p) => p.plan_type))].join(', ')}
                </div>
              </div>
            ))}
          </div>
        </section>

        <GenericByline dataSource="federal dental plan data" planYear={PLAN_YEAR} />

        <GlobalCTA />

        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            This page is for informational purposes only and does not constitute dental or insurance
            advice. <strong>Consult a licensed health insurance agent</strong> to evaluate your
            specific coverage options.
          </p>
        </footer>
      </main>
    </>
  )
}
