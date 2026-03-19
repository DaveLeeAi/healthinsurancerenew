import type { Metadata } from 'next'
import { loadRateVolatility } from '@/lib/data-loader'
import allStatesData from '@/data/config/all-states.json'
import { stateCodeToSlug, getCountySlug } from '@/lib/county-lookup'

export const metadata: Metadata = {
  title: 'Compare Health Insurance Plans by State & County | 2026',
  description:
    'Find and compare 2026 marketplace health insurance plans by state and county. County-level CMS data for all FFM states. Select your state to see available plans.',
  alternates: { canonical: 'https://healthinsurancerenew.com/plans' },
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

  // Group counties by state for FFM states that have CMS plan data
  const byState = new Map<string, { fips: string; carrier_count: number; plan_count: number }[]>()
  for (const r of dataset.data) {
    if (!byState.has(r.state_code)) byState.set(r.state_code, [])
    byState.get(r.state_code)!.push({ fips: r.county_fips, carrier_count: r.carrier_count, plan_count: r.plan_count })
  }
  const ffmStates = [...byState.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const ffmStateCodes = new Set(ffmStates.map(([code]) => code))

  // SBM states: run their own exchange AND have no FFM county data
  const sbmStates = (allStatesData.states as StateEntry[])
    .filter((s) => s.ownExchange && !ffmStateCodes.has(s.abbr))
    .sort((a, b) => a.name.localeCompare(b.name))

  // FFM states without county data yet (federal exchange, no CMS dataset loaded)
  const ffmNoDataStates = (allStatesData.states as StateEntry[])
    .filter((s) => !s.ownExchange && !ffmStateCodes.has(s.abbr))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Compare Health Insurance Plans</h1>
        <p className="text-neutral-500">
          {dataset.data.length.toLocaleString()} counties across {ffmStates.length} states with CMS plan data ·{' '}
          {sbmStates.length} state-run exchange states · 2026 Plan Year
        </p>
      </div>

      {/* Section 1: FFM states with county-level CMS plan data */}
      <section>
        <h2 className="text-xl font-semibold text-navy-800 mb-1">Compare Plans by County</h2>
        <p className="text-neutral-500 text-sm mb-4">
          These states use the federal marketplace (healthcare.gov). Select a state to choose your county and
          compare available plans, premiums, and cost-sharing.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ffmStates.map(([state, counties]) => {
            const totalPlans = counties.reduce((s, c) => s + c.plan_count, 0)
            const firstCounty = counties[0]
            return (
              <a
                key={state}
                href={`/${stateCodeToSlug(state)}/${getCountySlug(firstCounty.fips)}`}
                className="p-4 border border-neutral-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all"
              >
                <div className="text-xl font-bold text-navy-800">{state}</div>
                <div className="text-xs text-neutral-400 mt-1">
                  {counties.length} {counties.length === 1 ? 'county' : 'counties'} · {totalPlans.toLocaleString()} plans
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {/* Section 2: SBM states — own exchange, no FFM data */}
      {sbmStates.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-navy-800 mb-1">State-Run Marketplace States</h2>
          <p className="text-neutral-500 text-sm mb-4">
            These states operate their own exchanges. Plan comparison is available through each state&apos;s
            marketplace. Select a state for enrollment information and links to your state&apos;s exchange.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sbmStates.map((s) => (
              <a
                key={s.abbr}
                href={`/${s.slug}/health-insurance-plans`}
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

      {/* Section 3: FFM states where county plan data is not yet available */}
      {ffmNoDataStates.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-navy-800 mb-1">Plan Data Coming Soon</h2>
          <p className="text-neutral-500 text-sm mb-4">
            These states use the federal marketplace but county-level plan data has not been loaded yet.
            You can still check subsidy eligibility, browse drug coverage, or compare plans on healthcare.gov.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {ffmNoDataStates.map((s) => (
              <div
                key={s.abbr}
                className="p-4 border border-neutral-100 rounded-xl bg-neutral-50"
              >
                <div className="text-xl font-bold text-neutral-400">{s.abbr}</div>
                <div className="text-sm font-medium text-neutral-400">{s.name}</div>
                <div className="text-xs text-neutral-300 mt-1">Data not yet available</div>
              </div>
            ))}
          </div>
          {/* Alternative CTAs for missing-inventory states */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/subsidies"
              className="flex items-start gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50 hover:border-primary-400 transition-all"
            >
              <div>
                <div className="font-semibold text-primary-800 text-sm">Check Subsidy Eligibility</div>
                <div className="text-xs text-primary-600 mt-0.5">
                  Estimate your APTC premium tax credit before choosing a plan.
                </div>
              </div>
            </a>
            <a
              href="/formulary"
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 bg-white hover:border-primary-300 transition-all"
            >
              <div>
                <div className="font-semibold text-navy-800 text-sm">Drug Coverage Lookup</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Search which marketplace plans cover your medications.
                </div>
              </div>
            </a>
            <a
              href="/contact"
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 bg-white hover:border-primary-300 transition-all"
            >
              <div>
                <div className="font-semibold text-navy-800 text-sm">Talk to a Licensed Agent</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Get personalized plan recommendations and enroll at no cost.
                </div>
              </div>
            </a>
          </div>
        </section>
      )}
    </main>
  )
}
