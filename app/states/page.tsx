import type { Metadata } from 'next'
import Link from 'next/link'
import { loadRateVolatility } from '@/lib/data-loader'
import Breadcrumbs from '@/components/Breadcrumbs'
import configData from '@/data/config/config.json'
import allStatesData from '@/data/config/all-states.json'

export const metadata: Metadata = {
  title: 'Health Insurance by State (2026) | HealthInsuranceRenew',
  description:
    'Find marketplace plans, premiums, subsidies, and carrier options for your state. Browse all 50 states plus D.C. with exchange type, Medicaid expansion status, and plan counts for 2026.',
  alternates: { canonical: 'https://healthinsurancerenew.com/states' },
  openGraph: {
    title: 'Health Insurance by State (2026)',
    description: 'Find marketplace plans, premiums, subsidies, and carrier options for your state. All 50 states plus D.C. for plan year 2026.',
    url: 'https://healthinsurancerenew.com/states',
    type: 'website',
  },
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
  { name: 'States', url: '/states' },
]

const FAQ_ITEMS = [
  {
    question: 'Why do health insurance costs vary by state?',
    answer:
      'Health insurance premiums differ by state due to variations in state regulations, provider costs, insurer competition, population health, and whether the state has expanded Medicaid. States with more carriers competing tend to have lower premiums. Local cost of living and hospital reimbursement rates also influence pricing. Rural counties often have fewer carriers and higher premiums than urban areas.',
  },
  {
    question: 'Which states have expanded Medicaid?',
    answer:
      'As of 2026, 41 states plus D.C. have expanded Medicaid under the ACA, covering adults earning up to 138% of the Federal Poverty Level. The remaining states that have not expanded include Texas, Florida, Mississippi, Wisconsin, Kansas, South Carolina, Tennessee, Wyoming, and Alabama. In non-expansion states, some low-income adults fall into the coverage gap — earning too much for traditional Medicaid but too little for marketplace subsidies.',
  },
  {
    question: 'What states run their own health insurance exchange?',
    answer:
      'About 20 states and D.C. operate their own marketplace (State-Based Marketplace or SBM). These include California (Covered California), New York (NY State of Health), Colorado (Connect for Health Colorado), Massachusetts (Health Connector), and others. The remaining states use the federal marketplace at Healthcare.gov. Both types offer the same ACA-compliant plans with the same subsidy eligibility rules.',
  },
  {
    question: 'Can I buy health insurance if I live in multiple states?',
    answer:
      'You must enroll in a marketplace plan based on your primary residence — the state where you live and sleep most of the year. You cannot hold marketplace plans in two states simultaneously. If you move to a new state, you qualify for a Special Enrollment Period (SEP) to enroll in a plan in your new state within 60 days of the move.',
  },
  {
    question: 'Which state has the cheapest health insurance?',
    answer:
      'Premiums vary significantly by state and county. States with high insurer competition (like Ohio, Pennsylvania, and Virginia) tend to have lower premiums. However, the cheapest state depends on your age, income, and county. Premium Tax Credits (APTC) can reduce costs dramatically — most marketplace enrollees pay less than $100/month after subsidies. Use our state pages to compare actual premium data for your location.',
  },
]

type FilterKey = 'all' | 'ffm' | 'sbm' | 'expanded'

export default function StatesIndexPage() {
  const dataset = loadRateVolatility()
  const licensedSlugs = new Set(configData.licensedStates.map((s) => s.slug))

  // Build plan count lookup by state code
  const planCountByState = new Map<string, number>()
  const carriersByState = new Map<string, Set<string>>()
  for (const r of dataset.data) {
    planCountByState.set(r.state_code, (planCountByState.get(r.state_code) ?? 0) + r.plan_count)
    if (!carriersByState.has(r.state_code)) carriersByState.set(r.state_code, new Set())
    for (const c of r.carriers) carriersByState.get(r.state_code)!.add(c)
  }

  // Aggregate stats
  const states = allStatesData.states as StateEntry[]
  const statesWithData = new Set(planCountByState.keys())
  const totalPlans = [...planCountByState.values()].reduce((a, b) => a + b, 0)
  const allCarriers = new Set<string>()
  for (const carriers of carriersByState.values()) {
    for (const c of carriers) allCarriers.add(c)
  }
  const expandedCount = states.filter((s) => s.medicaidExpanded).length

  // Schema: BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://healthinsurancerenew.com' },
      { '@type': 'ListItem', position: 2, name: 'States', item: 'https://healthinsurancerenew.com/states' },
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

  // Schema: CollectionPage
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Health Insurance by State (2026)',
    description: 'Browse marketplace health insurance plan data for all 50 U.S. states and D.C.',
    url: 'https://healthinsurancerenew.com/states',
    numberOfItems: states.length,
    hasPart: states.map((s) => ({
      '@type': 'WebPage',
      name: `${s.name} Health Insurance Plans`,
      url: `https://healthinsurancerenew.com/${s.slug}/health-insurance-plans`,
    })),
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <Breadcrumbs items={breadcrumbs} />

      {/* Hero / BLUF */}
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-3">
          Health Insurance by State (2026)
        </h1>
        <p className="text-lg text-slate-600 max-w-3xl font-serif mb-6">
          Find marketplace plans, premiums, subsidies, and carrier options for your state.
          Select a state to get started.
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{states.length}</div>
            <div className="text-xs text-primary-600 mt-1">States + D.C.</div>
          </div>
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{totalPlans.toLocaleString()}</div>
            <div className="text-xs text-primary-600 mt-1">Total Plans</div>
          </div>
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{allCarriers.size}</div>
            <div className="text-xs text-primary-600 mt-1">Carriers Nationwide</div>
          </div>
        </div>
      </header>

      {/* Client-side filter wrapper */}
      <StatesGrid
        states={states}
        licensedSlugs={licensedSlugs}
        planCountByState={Object.fromEntries(planCountByState)}
        expandedCount={expandedCount}
      />

      {/* Educational Block */}
      <section className="mb-10 bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Understanding Health Insurance by State</h2>
        <div className="text-sm text-slate-700 space-y-2 leading-relaxed">
          <p>
            Health insurance plans, premiums, and carrier options vary significantly by state. Each state either
            operates its own health insurance exchange or uses the federal marketplace at Healthcare.gov. This
            choice affects the enrollment experience but not the ACA protections you receive — all marketplace
            plans must cover essential health benefits and cannot deny coverage for pre-existing conditions.
          </p>
          <p>
            Medicaid expansion is another key factor. In the {expandedCount} states that have expanded Medicaid,
            adults earning up to 138% of the Federal Poverty Level qualify for free or low-cost coverage.
            In non-expansion states, some low-income adults fall into a coverage gap. Your state page
            shows expansion status, average premiums, available carriers, and links to subsidy calculators
            to help you find the most affordable option.
          </p>
        </div>
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

      {/* Source citation */}
      <footer className="text-xs text-slate-400 border-t border-slate-100 pt-4">
        <p>
          Data source: CMS QHP Landscape and Rate Public Use Files, plan year 2026.
          Medicaid expansion status current as of January 2026.
          Published by the Centers for Medicare &amp; Medicaid Services.
        </p>
      </footer>
    </main>
  )
}

/** Client-side filter component for the state grid */
function StatesGrid({
  states,
  licensedSlugs,
  planCountByState,
  expandedCount,
}: {
  states: StateEntry[]
  licensedSlugs: Set<string>
  planCountByState: Record<string, number>
  expandedCount: number
}) {
  // Server-rendered: show all states, filters are progressive enhancement
  const sbmStates = states.filter((s) => s.ownExchange)
  const ffmStates = states.filter((s) => !s.ownExchange)
  const expandedStates = states.filter((s) => s.medicaidExpanded)

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        All 50 States + D.C. — 2026 Health Insurance Guides
      </h2>

      {/* Filter pills — all show by default (server render shows all) */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary-600 text-white">
          All States ({states.length})
        </span>
        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
          Healthcare.gov ({ffmStates.length})
        </span>
        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
          State Exchanges ({sbmStates.length})
        </span>
        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
          Medicaid Expanded ({expandedCount})
        </span>
      </div>

      {/* State grid — A-Z, no grouping */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {states.map((state) => {
          const plans = planCountByState[state.abbr]
          const isLicensed = licensedSlugs.has(state.slug)
          return (
            <Link
              key={state.slug}
              href={`/${state.slug}/health-insurance-plans`}
              className={`group flex flex-col p-3 rounded-xl border transition-all duration-200 bg-white ${
                isLicensed
                  ? 'border-primary-200 hover:border-primary-400 hover:shadow-md'
                  : 'border-slate-200 hover:border-slate-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-lg font-bold transition-colors ${
                  isLicensed
                    ? 'text-primary-700 group-hover:text-primary-600'
                    : 'text-slate-700 group-hover:text-slate-900'
                }`}>
                  {state.abbr}
                </span>
                <span className="text-xs text-slate-400 truncate">{state.name}</span>
              </div>

              {/* Exchange type badge */}
              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full w-fit mb-1 ${
                state.ownExchange
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-50 text-slate-500'
              }`}>
                {state.ownExchange ? state.exchange : 'Healthcare.gov'}
              </span>

              <div className="flex items-center gap-2 mt-auto">
                {plans ? (
                  <span className="text-[10px] text-slate-500">{plans.toLocaleString()} plans</span>
                ) : (
                  <span className="text-[10px] text-slate-400">Guide available</span>
                )}
                {state.medicaidExpanded ? (
                  <span className="text-[10px] text-green-600 font-medium">Expanded</span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-medium">Not expanded</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
