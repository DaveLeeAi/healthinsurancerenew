import type { Metadata } from 'next'
import { loadRateVolatility } from '@/lib/data-loader'

export const metadata: Metadata = {
  title: 'ACA Premium Rate Volatility Tracker — 2026',
  description: 'Track ACA premium rate changes by state and county. Carrier counts, metal level breakdowns, and age-64 shock ratios from CMS Rate PUF.',
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

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-navy-900 mb-2">ACA Premium Rate Volatility</h1>
      <p className="text-neutral-500 mb-8">
        {dataset.data.length.toLocaleString()} counties · Plan Year {dataset.metadata.plan_year} · Source: CMS Rate PUF
      </p>

      <h2 className="text-lg font-semibold text-navy-800 mb-3">Highest Age-64 Premium Shock</h2>
      <p className="text-sm text-neutral-500 mb-4">Counties where age-64 premiums are highest relative to age-40 (3× cap = ACA limit)</p>
      <div className="overflow-x-auto mb-10">
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
                    {r.age_64_shock_ratio}×
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </main>
  )
}
