// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { loadPolicyScenarios } from '@/lib/data-loader'
import { getCountyName } from '@/lib/county-lookup'
import { buildBreadcrumbSchema, buildArticleSchema, buildFAQSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

// Static generation — index page pre-built at deploy; revalidate daily
export const revalidate = 86400

export const metadata: Metadata = {
  title: `Enhanced Premium Tax Credits — ${PLAN_YEAR} Subsidy Cliff Analysis by State & County`,
  description:
    `Enhanced health insurance subsidies expired end of 2025. See the county-level premium ` +
    `impact for 2026 at ages 27–64 across 26 states. Source: federal marketplace rate data and IRS income guidelines.`,
  alternates: { canonical: `${SITE_URL}/enhanced-credits` },
  openGraph: {
    type: 'article',
    title: `Enhanced Premium Tax Credits — ${PLAN_YEAR} Subsidy Cliff Analysis`,
    description:
      'County-level analysis of how enhanced credit expiration raised marketplace health insurance premiums in 2026.',
    url: `${SITE_URL}/enhanced-credits`,
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: `Enhanced Premium Tax Credits — ${PLAN_YEAR} Subsidy Cliff Analysis`,
    description:
      'County-level analysis of how enhanced credit expiration raised marketplace health insurance premiums in 2026.',
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
    headline: `Enhanced Premium Tax Credits — ${PLAN_YEAR} Subsidy Cliff Analysis`,
    description: `Enhanced credits expired end of 2025. See the 2026 premium impact across ${policy.records.length} counties in ${stateCount} states.`,
    dateModified: '2026-03-15',
    dataSourceName: 'Federal Marketplace Rate Data and IRS Income Guidelines',
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
      <LlmComment pageType="enhanced-credits-index" year={PLAN_YEAR} data="federal-marketplace-rate-data+IRS-FPL" extra={{ counties: recordsWithHeadline.length, states: states.length }} />

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
            What Happened to Your Subsidy in {PLAN_YEAR}?
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            The Inflation Reduction Act enhanced marketplace premium subsidies through 2025. Those
            enhanced credits expired on January 1, 2026, and millions of enrollees now face higher
            premiums. This page shows the county-level dollar impact across{' '}
            {recordsWithHeadline.length.toLocaleString()} counties in {states.length} states.
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
                  <th className="text-right py-3 px-4 font-semibold">2025 (Enhanced)</th>
                  <th className="text-right py-3 px-4 font-semibold">2026 (Standard)</th>
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
                        {getCountyName(r.county_fips) ?? '—'}
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
            Scenario: Age 40, 250% FPL, household size 1. Source: federal marketplace rate data and IRS income guidelines, {PLAN_YEAR}.
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

        {/* ── FAQ ── */}
        {(() => {
          const faqs = [
            { question: 'What were enhanced premium tax credits?', answer: 'Enhanced credits were temporary increases to ACA subsidies, first enacted under the American Rescue Plan (2021) and extended through 2025 by the Inflation Reduction Act. They expanded eligibility above 400% FPL and reduced required contribution percentages for all income levels. They expired on January 1, 2026.' },
            { question: 'When did enhanced credits expire?', answer: 'Enhanced credits expired at the end of 2025. Starting in 2026, the original ACA subsidy rules apply, including the subsidy cliff at 400% of the Federal Poverty Level. Congress may act to restore them retroactively, but as of now they are no longer in effect.' },
            { question: 'What is the subsidy cliff?', answer: 'The subsidy cliff means that households earning above 400% FPL receive zero premium tax credits. With enhanced credits gone in 2026, a small income increase above the threshold can result in losing thousands of dollars in annual subsidies.' },
            { question: 'How does this affect my 2026 premiums?', answer: 'Without enhanced credits, many households are paying more for marketplace coverage in 2026. The exact impact depends on your income, age, family size, and the benchmark silver plan premium in your county.' },
          ]
          return (
            <>
              <SchemaScript schema={buildFAQSchema(faqs)} id="faq-schema" />
              <section className="my-10">
                <h2 className="text-2xl font-bold text-navy-900 mb-4">Frequently Asked Questions</h2>
                {faqs.map((f, i) => (
                  <details key={i} className="border-b border-neutral-200 py-3" {...(i === 0 ? { open: true } : {})}>
                    <summary className="cursor-pointer font-medium text-slate-800 hover:text-primary-700">{f.question}</summary>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.answer}</p>
                  </details>
                ))}
              </section>
            </>
          )
        })()}

        <GenericByline dataSource="Federal Marketplace Rate Data and IRS Income Guidelines" planYear={PLAN_YEAR} />

        {/* ── Disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            All premium amounts are estimates based on federal benchmark data and IRS income guidelines for
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
