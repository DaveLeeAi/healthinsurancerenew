// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { loadSubsidyEngine } from '@/lib/data-loader'
import allStatesData from '@/data/config/all-states.json'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import PageFaq from '@/components/PageFaq'
import { buildBreadcrumbSchema, buildDatasetSchema } from '@/lib/schema-markup'

export const metadata: Metadata = {
  title: 'Health Insurance Subsidy Calculator — APTC by State & County (2026)',
  description: 'Calculate your 2026 premium tax credit (APTC) by county. Based on CMS benchmark silver premium data for all 50 states. See how much you could save.',
  alternates: { canonical: 'https://healthinsurancerenew.com/subsidies' },
  openGraph: {
    title: 'Health Insurance Subsidy Calculator — APTC by State & County (2026)',
    description: 'Calculate your 2026 premium tax credit. Based on CMS benchmark silver premium data for all 50 states.',
    url: 'https://healthinsurancerenew.com/subsidies',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
}

const SITE_URL = 'https://healthinsurancerenew.com'

const FAQ_ITEMS = [
  { question: 'What is the Premium Tax Credit (APTC)?', answer: 'The Advance Premium Tax Credit is a federal subsidy that lowers your monthly health insurance premium. It is calculated based on your household income relative to the Federal Poverty Level and the cost of the benchmark Silver plan in your county.' },
  { question: 'Who qualifies for ACA health insurance subsidies in 2026?', answer: 'Under the IRA enhanced credits, households earning from 100% to over 400% of the Federal Poverty Level may qualify. The amount depends on your income, household size, and the benchmark Silver premium in your area.' },
  { question: 'How is the subsidy amount calculated?', answer: 'Your subsidy equals the benchmark Silver plan premium minus your expected contribution (a percentage of income set by the ACA affordability table). The lower your income relative to FPL, the smaller your expected contribution.' },
  { question: 'Can I use my subsidy on any metal tier plan?', answer: 'Yes. The APTC can be applied to any Bronze, Silver, Gold, or Platinum marketplace plan. However, the subsidy amount is always calculated based on the Silver benchmark. Silver plans also unlock Cost Sharing Reductions for incomes under 250% FPL.' },
  { question: 'Do subsidies vary by county?', answer: 'Yes. Subsidies are tied to the second-lowest-cost Silver plan (benchmark) in your county. Counties with higher benchmark premiums produce larger subsidies. This is why it is important to check your specific county.' },
]

interface StateEntry {
  name: string
  abbr: string
  slug: string
  exchange: string
  ownExchange: boolean
}

export default function SubsidiesIndexPage() {
  const dataset = loadSubsidyEngine()
  const byState = new Map<string, number>()
  for (const r of dataset.data) {
    byState.set(r.state_code, (byState.get(r.state_code) ?? 0) + 1)
  }
  const states = [...byState.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  // Pick a sample county per state (first one alphabetically by FIPS)
  const sampleByState = new Map<string, string>()
  for (const r of dataset.data) {
    if (!sampleByState.has(r.state_code)) sampleByState.set(r.state_code, r.county_fips)
  }

  // SBM states without county data
  const ffmStateCodes = new Set(states.map(([code]) => code))
  const sbmStates = (allStatesData.states as StateEntry[])
    .filter((s) => s.ownExchange && !ffmStateCodes.has(s.abbr))
    .sort((a, b) => a.name.localeCompare(b.name))

  const totalCounties = states.reduce((sum, [, count]) => sum + count, 0)

  // --- Schema ---
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Subsidies', url: `${SITE_URL}/subsidies` },
  ])

  const datasetSchema = buildDatasetSchema({
    name: 'ACA Subsidy & APTC Calculator Dataset',
    description: `Premium tax credit (APTC) estimates by county for ${states.length} states and ${totalCounties} counties. Based on CMS benchmark silver premiums and IRS Federal Poverty Level tables for the 2026 plan year.`,
    url: `${SITE_URL}/subsidies`,
    year: '2026',
  })

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={datasetSchema} id="dataset-schema" />

      <LlmComment
        pageType="subsidy-index"
        data="CMS-Subsidy-Engine"
        extra={{ counties: totalCounties, states: states.length }}
      />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* -- Breadcrumbs -- */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">Subsidies</li>
          </ol>
        </nav>

        <div>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Health Insurance Subsidy Calculator</h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl mb-3">
            The Advance Premium Tax Credit (APTC) is the federal subsidy that lowers your monthly health insurance premium on the ACA marketplace.
            How much you receive depends on your household income, household size, and the benchmark Silver plan premium in your county.
            Use this tool to look up APTC estimates for <strong>{totalCounties.toLocaleString()}</strong> counties
            across <strong>{states.length}</strong> states, based on 2026 CMS benchmark data and IRS Federal Poverty Level tables.
          </p>
          <div className="bg-federal-50 border border-federal-200 rounded-xl p-4 text-sm text-federal-800">
            Select your state, then choose your county to see APTC estimates at each income level.
          </div>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-navy-800 mb-4">States with County-Level Data</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {states.map(([state, count]) => (
              <a
                key={state}
                href={`/subsidies/${state.toLowerCase()}/${sampleByState.get(state)}`}
                className="p-4 border border-neutral-200 rounded-xl hover:border-federal-400 hover:shadow-sm transition-all"
              >
                <div className="text-xl font-bold text-navy-800">{state}</div>
                <div className="text-xs text-neutral-400 mt-1">{count} counties</div>
              </a>
            ))}
          </div>
        </section>

        {sbmStates.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-navy-800 mb-2">State-Based Marketplace States</h2>
            <p className="text-neutral-500 text-sm mb-4">
              Subsidies work the same in all states. Use our FPL-based estimator for these state exchange states.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sbmStates.map((s) => (
                <a
                  key={s.abbr}
                  href={`/subsidies/${s.abbr.toLowerCase()}`}
                  className="p-4 border border-neutral-200 rounded-xl hover:border-federal-400 hover:shadow-sm transition-all"
                >
                  <div className="text-xl font-bold text-navy-800">{s.abbr}</div>
                  <div className="text-sm font-medium text-neutral-600">{s.name}</div>
                  <div className="text-xs text-primary-600 mt-1">{s.exchange}</div>
                </a>
              ))}
            </div>
          </section>
        )}

        <PageFaq faqs={FAQ_ITEMS} />

        <GenericByline
          dataSource="CMS Benchmark Silver Premiums + IRS FPL Tables"
          planYear={2026}
        />
      </main>
    </>
  )
}
