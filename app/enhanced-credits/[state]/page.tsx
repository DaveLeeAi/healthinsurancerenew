import type { Metadata } from 'next'
import { getPolicyByState, getAllPolicyStates } from '@/lib/data-loader'
import { buildBreadcrumbSchema, buildArticleSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface Props {
  params: { state: string }
}

// Static generation — all policy states pre-built at deploy; revalidate daily
export const revalidate = 86400

export async function generateStaticParams() {
  return getAllPolicyStates()
    .map(state => ({ state: state.toLowerCase() }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateUpper = params.state.toUpperCase()
  const canonicalUrl = `${SITE_URL}/enhanced-credits/${params.state}`

  const title = `Enhanced Premium Tax Credits by County — ${stateUpper} ${PLAN_YEAR} | Subsidy Cliff Impact`
  const description =
    `Enhanced premium tax credits expired end of 2025. See how 2026 marketplace premiums increased in every ` +
    `county in ${stateUpper}. Compare the subsidy cliff impact at ages 27–64 across all income levels. ` +
    `Source: CMS benchmark premiums + IRS FPL tables.`

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
export default function EnhancedCreditsStatePage({ params }: Props) {
  const stateUpper = params.state.toUpperCase()
  const records = getPolicyByState(stateUpper)

  // --- Schema ---
  const canonicalUrl = `${SITE_URL}/enhanced-credits/${params.state}`

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Enhanced Credits', url: `${SITE_URL}/enhanced-credits` },
    { name: stateUpper, url: canonicalUrl },
  ])

  const articleSchema = buildArticleSchema({
    headline: `Enhanced Credit Expiration Impact — ${stateUpper} Counties`,
    description: `Enhanced credits expired end of 2025. County-level analysis of the 2026 premium increase in ${stateUpper}. ${records.length} counties modeled.`,
    dateModified: new Date().toISOString().slice(0, 10),
    dataSourceName: 'CMS QHP Rate PUF + IRS FPL Tables',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  if (records.length === 0) {
    return (
      <>
        <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
        <SchemaScript schema={articleSchema} id="article-schema" />
        <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
          <Breadcrumbs state={params.state} stateUpper={stateUpper} />
          <section>
            <h1 className="text-3xl font-bold text-navy-900 mb-3">
              Enhanced Credit Expiration Impact — {stateUpper}
            </h1>
            <p className="text-neutral-500">
              No enhanced credit scenario data available for {stateUpper}.
            </p>
          </section>
        </main>
      </>
    )
  }

  // Sort by annual increase descending (headline scenario = age 40, 250% FPL)
  const sorted = [...records].sort(
    (a, b) =>
      b.headline.annual_increase_at_expiration - a.headline.annual_increase_at_expiration
  )

  // State-level summary stats
  const avgMonthlyIncrease =
    sorted.reduce((sum, r) => sum + r.headline.monthly_increase_at_expiration, 0) /
    sorted.length
  const avgAnnualIncrease =
    sorted.reduce((sum, r) => sum + r.headline.annual_increase_at_expiration, 0) /
    sorted.length
  const maxIncrease = sorted[0]

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={articleSchema} id="article-schema" />
      <LlmComment
        pageType="enhanced-credits-state"
        state={stateUpper}
        data="CMS-Rate-PUF-IRS-FPL"
        extra={{ counties: records.length }}
      />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* ── Breadcrumbs ── */}
        <Breadcrumbs state={params.state} stateUpper={stateUpper} />

        {/* ── H1 ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            Enhanced Credit Expiration Impact — {stateUpper}
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            IRA enhanced premium tax credits expired at the end of 2025.{' '}
            <strong>{records.length}</strong> counties in {stateUpper} now face higher marketplace
            premiums in {PLAN_YEAR}. Below is the impact for a 40-year-old at 250% FPL — the
            most commonly cited middle-market scenario.
          </p>
        </section>

        {/* ── State summary stats ── */}
        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="sr-only">State Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Counties" value={records.length.toString()} />
            <StatCard
              label="Avg Monthly Increase"
              value={`+$${avgMonthlyIncrease.toFixed(0)}/mo`}
            />
            <StatCard
              label="Avg Annual Increase"
              value={`+$${avgAnnualIncrease.toFixed(0)}/yr`}
            />
            <StatCard
              label="Highest Impact"
              value={`+$${maxIncrease.headline.annual_increase_at_expiration.toFixed(0)}/yr`}
              note={`County ${maxIncrease.county_fips}`}
            />
          </div>
        </section>

        {/* ── County table ── */}
        <section aria-labelledby="county-table-heading">
          <h2
            id="county-table-heading"
            className="text-xl font-semibold text-navy-800 mb-4"
          >
            All {stateUpper} Counties — Enhanced Credit Expiration Impact
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-navy-50 text-navy-700">
                  <th className="text-left py-3 px-4 font-semibold">County FIPS</th>
                  <th className="text-right py-3 px-4 font-semibold">Benchmark (Age 40)</th>
                  <th className="text-right py-3 px-4 font-semibold">
                    <span className="text-green-700">2025 (Enhanced)</span>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">
                    <span className="text-red-700">2026 (Standard)</span>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">Monthly Increase</th>
                  <th className="text-right py-3 px-4 font-semibold">Annual Increase</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr
                    key={r.county_fips}
                    className="border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="py-3 px-4 font-medium text-navy-800">
                      <a
                        href={`/enhanced-credits/${params.state}/${r.county_fips}`}
                        className="text-primary-600 hover:underline"
                      >
                        {r.county_fips}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      ${r.benchmark_silver_premium_age40.toFixed(0)}/mo
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-700">
                      ${r.headline.current_net_monthly_with_enhanced.toFixed(0)}/mo
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-red-700">
                      ${r.headline.net_monthly_without_enhanced_pre_arp.toFixed(0)}/mo
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-800">
                      +${r.headline.monthly_increase_at_expiration.toFixed(0)}/mo
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-800">
                      +${r.headline.annual_increase_at_expiration.toFixed(0)}/yr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Scenario: Age 40, 250% FPL, household size 1. Source: CMS QHP Rate PUF + IRS FPL
            tables, {PLAN_YEAR}. All amounts are net monthly premium after APTC.
          </p>
        </section>

        {/* ── Byline ── */}
        <GenericByline dataSource="CMS Rate PUF & IRS FPL Tables" />

        {/* ── Disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            All premium amounts are estimates based on CMS benchmark data and IRS FPL tables for
            plan year {PLAN_YEAR}. Enhanced credits expired at the end of 2025. Congress may act to
            restore them retroactively.
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
// Local sub-components
// ---------------------------------------------------------------------------

function Breadcrumbs({
  state,
  stateUpper,
}: {
  state: string
  stateUpper: string
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
        <li aria-current="page" className="text-neutral-700 font-medium">
          {stateUpper}
        </li>
      </ol>
    </nav>
  )
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div className="p-4 rounded-xl bg-neutral-50">
      <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-navy-800">{value}</div>
      {note && <div className="text-xs text-neutral-400 mt-0.5">{note}</div>}
    </div>
  )
}
