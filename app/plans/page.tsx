import type { Metadata } from 'next'
import { loadRateVolatility } from '@/lib/data-loader'
import allStatesData from '@/data/config/all-states.json'
import { stateCodeToSlug } from '@/lib/county-lookup'
import Breadcrumbs from '@/components/Breadcrumbs'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'

export const metadata: Metadata = {
  title: 'Compare Health Insurance Plans by State & County (2026) | HealthInsuranceRenew',
  description:
    'Browse marketplace health insurance plans across 50 states. Compare premiums, deductibles, and carriers by county for plan year 2026. CMS QHP data for all federal and state exchanges.',
  alternates: { canonical: 'https://healthinsurancerenew.com/plans' },
  openGraph: {
    title: 'Compare Health Insurance Plans by State & County (2026)',
    description: 'Browse marketplace health insurance plans across 50 states. Compare premiums, deductibles, and carriers by county for plan year 2026.',
    url: 'https://healthinsurancerenew.com/plans',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Compare Health Insurance Plans by State & County (2026)',
    description:
      'Browse marketplace health insurance plans across 50 states. Compare premiums, deductibles, and carriers by county for plan year 2026.',
  },,
}

interface StateEntry {
  name: string
  abbr: string
  slug: string
  exchange: string
  ownExchange: boolean
  exchangeUrl?: string
  medicaidExpanded?: boolean
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Plans', url: '/plans' },
]

const FAQ_ITEMS = [
  {
    question: 'What marketplace plans are available in my state?',
    answer:
      'Every state offers Bronze, Silver, Gold, and Platinum marketplace plans through either Healthcare.gov or a state-run exchange. The number of plans and carriers varies by county. Select your state above to see exactly which plans are available where you live, including premium costs and deductible amounts for plan year 2026.',
  },
  {
    question: 'What is the difference between Bronze, Silver, Gold, and Platinum plans?',
    answer:
      'Metal tiers reflect how you split costs with the plan. Bronze plans have the lowest premiums but highest out-of-pocket costs (the plan pays ~60%). Silver plans (70%) are popular because cost-sharing reductions (CSR) are available if your income is under 250% FPL. Gold plans (80%) have higher premiums but lower copays. Platinum plans (90%) have the highest premiums and lowest cost-sharing.',
  },
  {
    question: 'How do I know if my state uses Healthcare.gov or its own exchange?',
    answer:
      'There are two types of marketplaces. About 30 states use the federal marketplace at Healthcare.gov (also called FFM states). The remaining states run their own exchange with a separate enrollment website. This page separates both groups so you can find the right starting point. State-run exchanges include Covered California, NY State of Health, and others listed in the section below.',
  },
  {
    question: 'When can I enroll in a marketplace plan?',
    answer:
      'Open Enrollment for 2026 plans typically runs from November 1 through January 15. Outside this window, you may qualify for a Special Enrollment Period (SEP) if you experience a qualifying life event such as losing coverage, getting married, having a baby, or moving to a new state. Medicaid and CHIP enrollment is available year-round.',
  },
  {
    question: 'How do subsidies affect my plan choice?',
    answer:
      'The Premium Tax Credit (APTC) lowers your monthly premium based on income and the cost of the benchmark Silver plan in your county. If your income is between 100% and 400% FPL, you likely qualify. The IRA enhanced credits that extended subsidies above 400% FPL expired at the end of 2025. Subsidies apply to any metal tier, but the credit amount is calculated off the Silver benchmark. Use our subsidy calculator to estimate your savings.',
  },
]

export default function PlansIndexPage() {
  const dataset = loadRateVolatility()

  // Group counties by state for FFM states that have CMS plan data
  const byState = new Map<string, { fips: string; carrier_count: number; plan_count: number; avg_premium_age_40: number }[]>()
  for (const r of dataset.data) {
    if (!byState.has(r.state_code)) byState.set(r.state_code, [])
    byState.get(r.state_code)!.push({
      fips: r.county_fips,
      carrier_count: r.carrier_count,
      plan_count: r.plan_count,
      avg_premium_age_40: r.avg_premium_age_40,
    })
  }
  const ffmStates = [...byState.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const ffmStateCodes = new Set(ffmStates.map(([code]) => code))

  // SBM states: run their own exchange AND have no FFM county data
  const sbmStates = (allStatesData.states as StateEntry[])
    .filter((s) => s.ownExchange && !ffmStateCodes.has(s.abbr))
    .sort((a, b) => a.name.localeCompare(b.name))

  // FFM states without county data yet
  const ffmNoDataStates = (allStatesData.states as StateEntry[])
    .filter((s) => !s.ownExchange && !ffmStateCodes.has(s.abbr))
    .sort((a, b) => a.name.localeCompare(b.name))

  // Aggregate stats
  const totalCounties = dataset.data.length
  const totalStates = ffmStates.length + sbmStates.length + ffmNoDataStates.length
  const totalPlans = dataset.data.reduce((sum, r) => sum + r.plan_count, 0)
  const avgPremium40 = totalCounties > 0
    ? Math.round(dataset.data.reduce((sum, r) => sum + r.avg_premium_age_40, 0) / totalCounties)
    : 0

  // Unique carriers across all counties
  const allCarriers = new Set<string>()
  for (const r of dataset.data) {
    for (const c of r.carriers) allCarriers.add(c)
  }

  // Schema: BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://healthinsurancerenew.com' },
      { '@type': 'ListItem', position: 2, name: 'Plans', item: 'https://healthinsurancerenew.com/plans' },
    ],
  }

  // Schema: FAQPage
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  // Schema: Dataset
  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: '2026 ACA Marketplace Plan Data by State and County',
    description: 'County-level health insurance plan, premium, and carrier data from CMS QHP Public Use Files for plan year 2026.',
    url: 'https://healthinsurancerenew.com/plans',
    creator: { '@type': 'Organization', name: 'Centers for Medicare & Medicaid Services (CMS)' },
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'text/csv',
      contentUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    },
    temporalCoverage: '2026',
    spatialCoverage: { '@type': 'Country', name: 'United States' },
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
      <LlmComment pageType="plans-index" planCount={totalPlans} carrierCount={allCarriers.size} year={2026} />

      <Breadcrumbs items={breadcrumbs} />

      {/* Hero / BLUF */}
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-3">
          Compare Health Insurance Plans by State &amp; County (2026)
        </h1>
        <p className="text-lg text-slate-600 max-w-3xl font-serif mb-6">
          Browse marketplace plans across {totalStates} states and {totalCounties.toLocaleString()} counties.
          Compare premiums, deductibles, and carriers for plan year 2026.
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{totalPlans.toLocaleString()}</div>
            <div className="text-xs text-primary-600 mt-1">Total Plans</div>
          </div>
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{totalStates}</div>
            <div className="text-xs text-primary-600 mt-1">States Covered</div>
          </div>
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{totalCounties.toLocaleString()}</div>
            <div className="text-xs text-primary-600 mt-1">Counties</div>
          </div>
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">${avgPremium40.toLocaleString()}</div>
            <div className="text-xs text-primary-600 mt-1">Avg Premium (Age 40)</div>
          </div>
        </div>
      </header>

      {/* Section A: FFM states with county-level CMS plan data */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Compare Plans by County (FFM States)</h2>
        <p className="text-sm text-slate-600 mb-4">
          These {ffmStates.length} states use Healthcare.gov (the federal marketplace). Select your state to browse plans by county, compare premiums, and view cost-sharing details.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ffmStates.map(([state, counties]) => {
            const stateAllStates = (allStatesData.states as StateEntry[]).find((s) => s.abbr === state)
            const totalStatePlans = counties.reduce((s, c) => s + c.plan_count, 0)
            return (
              <a
                key={state}
                href={`/${stateCodeToSlug(state)}/health-insurance-plans`}
                className="p-4 border border-slate-200 rounded-xl hover:border-primary-400 hover:shadow-md transition-all group bg-white"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{state}</span>
                  {stateAllStates && (
                    <span className="text-xs text-slate-400 truncate">{stateAllStates.name}</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {counties.length} {counties.length === 1 ? 'county' : 'counties'} · {totalStatePlans.toLocaleString()} plans
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {/* Section B: SBM states */}
      {sbmStates.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-1">State-Run Marketplace States (SBM)</h2>
          <p className="text-sm text-slate-600 mb-4">
            These {sbmStates.length} states run their own health insurance exchange. Select your state to view available plans and enrollment information through your state&apos;s marketplace.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sbmStates.map((s) => (
              <a
                key={s.abbr}
                href={`/${s.slug}/health-insurance-plans`}
                className="p-4 border border-slate-200 rounded-xl hover:border-primary-400 hover:shadow-md transition-all group bg-white"
              >
                <div className="text-xl font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{s.abbr}</div>
                <div className="text-sm font-medium text-slate-600">{s.name}</div>
                <div className="text-xs text-primary-600 mt-1">{s.exchange}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Section C: FFM states without data yet */}
      {ffmNoDataStates.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Plan Data Coming Soon</h2>
          <p className="text-sm text-slate-600 mb-4">
            These states use Healthcare.gov but county-level plan data has not been loaded yet.
            You can still check subsidy eligibility and browse drug coverage. A licensed agent can help you compare plans at no cost.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {ffmNoDataStates.map((s) => (
              <div key={s.abbr} className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                <div className="text-xl font-bold text-slate-400">{s.abbr}</div>
                <div className="text-sm font-medium text-slate-400">{s.name}</div>
                <div className="text-xs text-slate-300 mt-1">Data not yet available</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="/subsidies" className="flex items-start gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50 hover:border-primary-400 transition-all">
              <div>
                <div className="font-semibold text-primary-800 text-sm">Check Subsidy Eligibility</div>
                <div className="text-xs text-primary-600 mt-0.5">Estimate your APTC premium tax credit before choosing a plan.</div>
              </div>
            </a>
            <a href="/formulary" className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 transition-all">
              <div>
                <div className="font-semibold text-slate-800 text-sm">Drug Coverage Lookup</div>
                <div className="text-xs text-slate-500 mt-0.5">Search which marketplace plans cover your medications.</div>
              </div>
            </a>
            <a href="/contact" className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-300 transition-all">
              <div>
                <div className="font-semibold text-slate-800 text-sm">Talk to a Licensed Agent</div>
                <div className="text-xs text-slate-500 mt-0.5">Get personalized plan recommendations and enroll at no cost.</div>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* Educational Block */}
      <section className="mb-10 bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">How to Compare Health Insurance Plans</h2>
        <ol className="space-y-3 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-xs">1</span>
            <span><strong>Choose your state</strong> from the grids above. FFM states have county-level plan data; SBM states link to their exchange.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-xs">2</span>
            <span><strong>Filter by metal tier</strong> — Bronze, Silver, Gold, or Platinum — based on how you want to balance premiums and out-of-pocket costs.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-xs">3</span>
            <span><strong>Compare premiums and deductibles</strong> side by side. Check if your doctors and prescriptions are covered before enrolling.</span>
          </li>
        </ol>
      </section>

      {/* FAQ Section */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, i) => (
            <details key={i} className="group border border-slate-200 rounded-xl bg-white">
              <summary className="flex items-center justify-between gap-2 px-5 py-4 cursor-pointer text-sm font-medium text-slate-800 hover:text-primary-600 transition-colors">
                {faq.question}
                <svg className="w-5 h-5 shrink-0 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* NOTE: No name/NPN on this page — generic byline only */}
      <GenericByline dataSource="CMS QHP Landscape & Rate PUF" />

      {/* Source citation */}
      <footer className="text-xs text-slate-400 border-t border-slate-100 pt-4">
        <p>
          Data source: CMS QHP Landscape and Rate Public Use Files, plan year 2026.
          Published by the Centers for Medicare &amp; Medicaid Services.
          Premium averages are unweighted means across all plans in a county for a 40-year-old non-tobacco user.
        </p>
      </footer>
    </main>
  )
}
