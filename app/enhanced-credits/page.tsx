import type { Metadata } from 'next'
import { loadPolicyScenarios } from '@/lib/data-loader'
import { buildBreadcrumbSchema, buildArticleSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'

const PLAN_YEAR = 2025
const SITE_URL = 'https://healthinsurancerenew.com'

// Dynamic rendering — policy_scenarios.json (65 MB) rendered on-demand
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `Enhanced ACA Premium Tax Credits — ${PLAN_YEAR} Subsidy Cliff Analysis by State & County`,
  description:
    `What happens to your ACA health insurance premium when IRA enhanced subsidies expire? ` +
    `County-level impact analysis at ages 27–64 across 26 states. Source: CMS + IRS FPL tables.`,
  alternates: { canonical: `${SITE_URL}/enhanced-credits` },
  openGraph: {
    type: 'article',
    title: `Enhanced ACA Premium Tax Credits — ${PLAN_YEAR} Subsidy Cliff Analysis`,
    description:
      'County-level analysis of enhanced ACA credit expiration impact on health insurance premiums.',
    url: `${SITE_URL}/enhanced-credits`,
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
  },
}

export default function EnhancedCreditsIndexPage() {
  const policy = loadPolicyScenarios()

  // Count unique states
  const stateSet = new Set(policy.records.map((r) => r.state_code))
  const stateCount = stateSet.size

  // --- Schema ---
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Enhanced Credits', url: `${SITE_URL}/enhanced-credits` },
  ])

  const articleSchema = buildArticleSchema({
    headline: `Enhanced ACA Premium Tax Credits — ${PLAN_YEAR} Subsidy Cliff Analysis`,
    description: `What happens to ACA premiums when enhanced credits expire? ${policy.records.length} counties modeled across ${stateCount} states.`,
    dateModified: new Date().toISOString().slice(0, 10),
    dataSourceName: 'CMS QHP Rate PUF + IRS FPL Tables',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  // National averages
  const recordsWithHeadline = policy.records.filter((r) => r.headline)
  const avgMonthlyIncrease =
    recordsWithHeadline.reduce((s, r) => s + r.headline.monthly_increase_at_expiration, 0) /
    recordsWithHeadline.length
  const avgAnnualIncrease =
    recordsWithHeadline.reduce((s, r) => s + r.headline.annual_increase_at_expiration, 0) /
    recordsWithHeadline.length

  // Top 10 highest impact counties
  const top10 = [...recordsWithHeadline]
    .sort(
      (a, b) =>
        b.headline.annual_increase_at_expiration - a.headline.annual_increase_at_expiration
    )
    .slice(0, 10)

  // State summaries
  const stateMap = new Map<
    string,
    { counties: number; totalAnnualIncrease: number; maxAnnualIncrease: number }
  >()
  for (const r of recordsWithHeadline) {
    const existing = stateMap.get(r.state_code) ?? {
      counties: 0,
      totalAnnualIncrease: 0,
      maxAnnualIncrease: 0,
    }
    stateMap.set(r.state_code, {
      counties: existing.counties + 1,
      totalAnnualIncrease:
        existing.totalAnnualIncrease + r.headline.annual_increase_at_expiration,
      maxAnnualIncrease: Math.max(
        existing.maxAnnualIncrease,
        r.headline.annual_increase_at_expiration
      ),
    })
  }
  const states = [...stateMap.entries()]
    .map(([state, v]) => ({
      state,
      counties: v.counties,
      avgAnnualIncrease: v.totalAnnualIncrease / v.counties,
      maxAnnualIncrease: v.maxAnnualIncrease,
    }))
    .sort((a, b) => b.avgAnnualIncrease - a.avgAnnualIncrease)

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={articleSchema} id="article-schema" />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* ── Breadcrumbs ── */}
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
            <li aria-current="page" className="text-neutral-700 font-medium">
              Enhanced Credits
            </li>
          </ol>
        </nav>

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            Enhanced ACA Premium Tax Credits — {PLAN_YEAR} Expiration Analysis
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            The Inflation Reduction Act enhanced ACA premium subsidies through {PLAN_YEAR}. If
            Congress does not extend them, millions of enrollees will face higher premiums. This tool
            shows the county-level dollar impact across {recordsWithHeadline.length.toLocaleString()}{' '}
            counties in {states.length} states.
          </p>
        </section>

        {/* ── National impact summary ── */}
        <section aria-labelledby="national-heading">
          <h2 id="national-heading" className="sr-only">National Summary</h2>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="text-sm font-semibold text-red-700 mb-3">
              National Average Impact — Age 40, 250% FPL
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  Counties Analyzed
                </div>
                <div className="text-2xl font-bold text-navy-800">
                  {recordsWithHeadline.length.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  Avg Monthly Increase
                </div>
                <div className="text-2xl font-bold text-red-800">
                  +${avgMonthlyIncrease.toFixed(0)}/mo
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  Avg Annual Increase
                </div>
                <div className="text-2xl font-bold text-red-800">
                  +${avgAnnualIncrease.toFixed(0)}/yr
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Top 10 highest impact counties ── */}
        <section aria-labelledby="top10-heading">
          <h2
            id="top10-heading"
            className="text-xl font-semibold text-navy-800 mb-4"
          >
            Highest Impact Counties
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-navy-50 text-navy-700">
                  <th className="text-left py-3 px-4 font-semibold">State</th>
                  <th className="text-left py-3 px-4 font-semibold">County</th>
                  <th className="text-right py-3 px-4 font-semibold">With Enhanced</th>
                  <th className="text-right py-3 px-4 font-semibold">Without Enhanced</th>
                  <th className="text-right py-3 px-4 font-semibold">Monthly Increase</th>
                  <th className="text-right py-3 px-4 font-semibold">Annual Increase</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((r) => (
                  <tr
                    key={`${r.state_code}-${r.county_fips}`}
                    className="border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="py-3 px-4 font-medium text-navy-800">
                      <a
                        href={`/enhanced-credits/${r.state_code.toLowerCase()}`}
                        className="text-primary-600 hover:underline"
                      >
                        {r.state_code}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`/enhanced-credits/${r.state_code.toLowerCase()}/${r.county_fips}`}
                        className="text-primary-600 hover:underline"
                      >
                        {r.county_fips}
                      </a>
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
                    <td className="py-3 px-4 text-right font-mono font-semibold text-red-800">
                      +${r.headline.annual_increase_at_expiration.toFixed(0)}/yr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Scenario: Age 40, 250% FPL, household size 1. Source: CMS + IRS, {PLAN_YEAR}.
          </p>
        </section>

        {/* ── Browse by State ── */}
        <section aria-labelledby="states-heading">
          <h2
            id="states-heading"
            className="text-xl font-semibold text-navy-800 mb-4"
          >
            Browse by State
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {states.map(({ state, counties, avgAnnualIncrease: stateAvg }) => (
              <a
                key={state}
                href={`/enhanced-credits/${state.toLowerCase()}`}
                className="p-4 border border-neutral-200 rounded-xl hover:border-red-300 hover:shadow-sm transition-all"
              >
                <div className="text-xl font-bold text-navy-800">{state}</div>
                <div className="text-xs text-neutral-400 mt-1">
                  {counties} counties
                </div>
                <div className="text-sm font-semibold text-red-700 mt-1">
                  avg +${stateAvg.toFixed(0)}/yr
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── Disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            All premium amounts are estimates based on CMS benchmark data and IRS FPL tables for
            plan year {PLAN_YEAR}. Enhanced credit availability is subject to Congressional action.
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
