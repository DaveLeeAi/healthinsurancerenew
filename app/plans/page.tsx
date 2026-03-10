import type { Metadata } from 'next'
import { loadRateVolatility } from '@/lib/data-loader'

export const metadata: Metadata = {
  title: 'ACA Health Plan Comparison — All States & Counties',
  description: 'Compare ACA Marketplace health plans by state and county. Premiums, metal levels, and deductibles from CMS 2026 data.',
}

export default function PlansIndexPage() {
  const dataset = loadRateVolatility()
  // Group counties by state
  const byState = new Map<string, { fips: string; carrier_count: number; plan_count: number }[]>()
  for (const r of dataset.data) {
    if (!byState.has(r.state_code)) byState.set(r.state_code, [])
    byState.get(r.state_code)!.push({ fips: r.county_fips, carrier_count: r.carrier_count, plan_count: r.plan_count })
  }
  const states = [...byState.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-navy-900 mb-2">ACA Health Plan Comparison</h1>
      <p className="text-neutral-500 mb-8">
        {dataset.data.length.toLocaleString()} counties across {states.length} states · 2026 Plan Year · Source: CMS QHP Landscape PUF
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {states.map(([state, counties]) => {
          const totalPlans = counties.reduce((s, c) => s + c.plan_count, 0)
          const firstCounty = counties[0]
          return (
            <a
              key={state}
              href={`/plans/${state.toLowerCase()}/${firstCounty.fips}`}
              className="p-4 border border-neutral-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all"
            >
              <div className="text-xl font-bold text-navy-800">{state}</div>
              <div className="text-xs text-neutral-400 mt-1">{counties.length} counties · {totalPlans.toLocaleString()} plans</div>
            </a>
          )
        })}
      </div>
    </main>
  )
}
