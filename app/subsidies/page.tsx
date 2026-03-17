import type { Metadata } from 'next'
import { loadSubsidyEngine } from '@/lib/data-loader'
import allStatesData from '@/data/config/all-states.json'

export const metadata: Metadata = {
  title: 'Health Insurance Subsidy Calculator — APTC by State & County',
  description: 'Calculate your 2026 premium tax credit (APTC) by county. Based on CMS benchmark silver premium data for all 50 states.',
}

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

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Health Insurance Subsidy Calculator</h1>
        <p className="text-neutral-500 mb-3">
          Find your Advanced Premium Tax Credit (APTC) based on income and county. Data: CMS benchmark silver premiums, IRS FPL tables.
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
    </main>
  )
}
