import type { Metadata } from 'next'
import { loadRateVolatility } from '@/lib/data-loader'
import allStatesData from '@/data/config/all-states.json'

export const metadata: Metadata = {
  title: 'Health Insurance Plan Comparison — All 50 States',
  description: 'Compare marketplace health insurance plans by state and county. 30 FFM states with county-level CMS data. All 50 states covered.',
}

interface StateEntry {
  name: string
  abbr: string
  slug: string
  exchange: string
  ownExchange: boolean
  exchangeUrl?: string
}

export default function PlansIndexPage() {
  const dataset = loadRateVolatility()

  // Group counties by state (FFM states with data)
  const byState = new Map<string, { fips: string; carrier_count: number; plan_count: number }[]>()
  for (const r of dataset.data) {
    if (!byState.has(r.state_code)) byState.set(r.state_code, [])
    byState.get(r.state_code)!.push({ fips: r.county_fips, carrier_count: r.carrier_count, plan_count: r.plan_count })
  }
  const ffmStates = [...byState.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  // SBM states: ownExchange=true and NOT in the FFM data
  const ffmStateCodes = new Set(ffmStates.map(([code]) => code))
  const sbmStates = (allStatesData.states as StateEntry[])
    .filter((s) => s.ownExchange && !ffmStateCodes.has(s.abbr))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Health Insurance Plan Comparison</h1>
        <p className="text-neutral-500">
          {dataset.data.length.toLocaleString()} counties across {ffmStates.length} states with CMS data ·{' '}
          {sbmStates.length} state-based marketplace states · 2026 Plan Year
        </p>
      </div>

      {/* Section 1: FFM states with county-level data */}
      <section>
        <h2 className="text-xl font-semibold text-navy-800 mb-4">Compare Plans by County</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ffmStates.map(([state, counties]) => {
            const totalPlans = counties.reduce((s, c) => s + c.plan_count, 0)
            const firstCounty = counties[0]
            return (
              <a
                key={state}
                href={`/plans/${state.toLowerCase()}/${firstCounty.fips}`}
                className="p-4 border border-neutral-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all"
              >
                <div className="text-xl font-bold text-navy-800">{state}</div>
                <div className="text-xs text-neutral-400 mt-1">
                  {counties.length} counties · {totalPlans.toLocaleString()} plans
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {/* Section 2: SBM states */}
      {sbmStates.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-navy-800 mb-2">State-Based Marketplace States</h2>
          <p className="text-neutral-500 text-sm mb-4">
            These states run their own exchanges. Visit your state&apos;s marketplace to compare plans directly.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sbmStates.map((s) => (
              <a
                key={s.abbr}
                href={`/plans/${s.abbr.toLowerCase()}`}
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
    </main>
  )
}
