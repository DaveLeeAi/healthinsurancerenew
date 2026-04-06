// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { loadRateVolatility } from '@/lib/data-loader'
import allStatesData from '@/data/config/all-states.json'
import { buildBreadcrumbSchema, buildFAQSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'

const SITE_URL = 'https://healthinsurancerenew.com'

export const metadata: Metadata = {
  title: 'Health Insurance Premium Rate Trends by State (2026)',
  description: 'Track 2026 marketplace premium rate changes by state and county. Carrier counts, metal level breakdowns, year-over-year trends, and age-64 shock ratios from CMS Rate PUF data.',
  alternates: { canonical: `${SITE_URL}/rates` },
  openGraph: {
    type: 'website',
    title: 'Health Insurance Premium Rate Trends by State (2026)',
    description: 'Track 2026 marketplace premium rate changes by state and county. Carrier counts, metal level breakdowns, year-over-year trends, and age-64 shock ratios from CMS Rate PUF data.',
    url: `${SITE_URL}/rates`,
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Health Insurance Premium Rate Trends by State (2026)',
    description:
      'Track marketplace premium rate changes by state and county. Carrier counts, metal level breakdowns, and age-64 shock ratios from CMS Rate PUF.',
  },
}

interface StateEntry {
  name: string
  abbr: string
  slug: string
  exchange: string
  ownExchange: boolean
}

export default function RatesIndexPage() {
  const dataset = loadRateVolatility()

  // Top 10 highest age-64 shock ratio counties
  const topShock = [...dataset.data]
    .sort((a, b) => b.age_64_shock_ratio - a.age_64_shock_ratio)
    .slice(0, 10)

  // States summary
  const byState = new Map<string, { counties: number; avgPremium40: number }>()
  for (const r of dataset.data) {
    const s = byState.get(r.state_code) ?? { counties: 0, avgPremium40: 0 }
    byState.set(r.state_code, {
      counties: s.counties + 1,
      avgPremium40: s.avgPremium40 + r.avg_premium_age_40,
    })
  }
  const states = [...byState.entries()]
    .map(([state, v]) => ({ state, counties: v.counties, avgPremium40: v.avgPremium40 / v.counties }))
    .sort((a, b) => b.avgPremium40 - a.avgPremium40)

  // Sample county per state
  const sampleByState = new Map<string, string>()
  for (const r of dataset.data) {
    if (!sampleByState.has(r.state_code)) sampleByState.set(r.state_code, r.county_fips)
  }

  // SBM states without CMS rate data
  const ffmStateCodes = new Set(states.map((s) => s.state))
  const sbmStates = (allStatesData.states as StateEntry[])
    .filter((s) => s.ownExchange && !ffmStateCodes.has(s.abbr))
    .sort((a, b) => a.name.localeCompare(b.name))

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Rate Trends', url: `${SITE_URL}/rates` },
  ])

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <LlmComment pageType="rates-index" year={2026} data="CMS-Rate-PUF" extra={{ counties: dataset.data.length, states: states.length }} />

    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Health Insurance Rate Volatility</h1>
        <p className="text-neutral-500">
          {dataset.data.length.toLocaleString()} counties · Plan Year {dataset.metadata.plan_year} · Source: CMS Rate PUF
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-navy-800 mb-3">Highest Age-64 Premium Shock</h2>
        <p className="text-sm text-neutral-500 mb-4">Counties where age-64 premiums are highest relative to age-40 (3x cap = ACA limit)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left">
                <th className="px-4 py-2 font-medium text-neutral-600">State</th>
                <th className="px-4 py-2 font-medium text-neutral-600">County FIPS</th>
                <th className="px-4 py-2 font-medium text-neutral-600 text-right">Age 40 Avg</th>
                <th className="px-4 py-2 font-medium text-neutral-600 text-right">Age 64 Avg</th>
                <th className="px-4 py-2 font-medium text-neutral-600 text-right">Shock Ratio</th>
              </tr>
            </thead>
            <tbody>
              {topShock.map((r) => (
                <tr key={r.county_fips} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-2">{r.state_code}</td>
                  <td className="px-4 py-2">
                    <a href={`/rates/${r.state_code.toLowerCase()}/${r.county_fips}`} className="text-primary-600 hover:underline">
                      {r.county_fips}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">${r.avg_premium_age_40.toFixed(0)}</td>
                  <td className="px-4 py-2 text-right font-mono">${r.avg_premium_age_64.toFixed(0)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-100 text-accent-700">
                      {r.age_64_shock_ratio}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-navy-800 mb-3">Browse by State</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {states.map(({ state, counties, avgPremium40 }) => (
            <a
              key={state}
              href={`/rates/${state.toLowerCase()}/${sampleByState.get(state)}`}
              className="p-4 border border-neutral-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all"
            >
              <div className="text-xl font-bold text-navy-800">{state}</div>
              <div className="text-xs text-neutral-400 mt-1">{counties} counties · avg ${avgPremium40.toFixed(0)}/mo</div>
            </a>
          ))}
        </div>
      </section>

      {sbmStates.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-navy-800 mb-2">State-Based Marketplace States</h2>
          <p className="text-neutral-500 text-sm mb-4">
            These states file rate data with their own exchanges, not with the federal CMS system.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sbmStates.map((s) => (
              <a
                key={s.abbr}
                href={`/rates/${s.abbr.toLowerCase()}`}
                className="p-4 border border-neutral-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all"
              >
                <div className="text-xl font-bold text-navy-800">{s.abbr}</div>
                <div className="text-sm font-medium text-neutral-600">{s.name}</div>
                <div className="text-xs text-primary-600 mt-1">{s.exchange}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      {(() => {
        const faqs = [
          { question: 'Why do health insurance rates change every year?', answer: 'Rates change based on medical cost trends, claims experience, regulatory changes, and carrier competition in each market. CMS reviews all rate filings before they take effect.' },
          { question: 'What is the age-64 rate ratio?', answer: 'ACA rules allow carriers to charge older enrollees up to 3x more than younger ones. The age-64 "shock ratio" shows how much more the oldest enrollees pay compared to a 21-year-old in the same plan.' },
          { question: 'Do rate changes affect my subsidy?', answer: 'Subsidies are based on the benchmark silver plan premium in your area. If rates increase, your subsidy may also increase to offset the higher cost — but your net premium can still change.' },
          { question: 'Where does this rate data come from?', answer: 'All rate data comes from the CMS Rate PUF (Public Use File), which contains every marketplace plan\'s approved premium rates by age, rating area, and tobacco status.' },
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

      <GenericByline dataSource="CMS Rate PUF" planYear={2026} />
    </main>
    </>
  )
}
