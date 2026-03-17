'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import allStatesData from '@/data/config/all-states.json'

type StateEntry = { name: string; abbr: string; exchange: string; ownExchange: boolean }

const allStates = (allStatesData.states as StateEntry[]).sort(
  (a, b) => a.name.localeCompare(b.name)
)

// States with CMS formulary data in our dataset
const FFM_STATES_WITH_DATA = new Set([
  'AK','AL','AZ','FL','IA','IN','KS','LA','MI','MO','MS','MT',
  'NC','ND','NE','NH','OH','OK','OR','SC','SD','TN','TX','UT','WI','WY'
])

const ffmStates = allStates.filter(s => FFM_STATES_WITH_DATA.has(s.abbr))
const sbmStates = allStates.filter(s => !FFM_STATES_WITH_DATA.has(s.abbr))

const POPULAR_DRUGS = ['lisinopril', 'metformin', 'atorvastatin', 'sertraline', 'omeprazole', 'amlodipine']

export default function FormularyIndexPage() {
  const router = useRouter()
  const [drug, setDrug] = useState('')
  const [selectedState, setSelectedState] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const slug = drug.trim().toLowerCase().replace(/\s+/g, '-')
    if (!slug) return
    const stateParam = selectedState || 'all'
    router.push(`/formulary/${stateParam}/${slug}`)
  }

  const stateParam = selectedState || 'all'
  const selectedStateName = selectedState
    ? allStates.find((s) => s.abbr.toLowerCase() === selectedState)?.name
    : undefined

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-navy-900 mb-2">Drug Formulary Lookup</h1>
      <p className="text-neutral-500 mb-8">
        {selectedStateName
          ? `Search drugs covered by marketplace plans in ${selectedStateName}.`
          : 'Search 551,000+ drugs across all marketplace plans.'
        }{' '}
        Data from CMS MR-PUF 2026.
      </p>

      {/* State selector */}
      <div className="mb-4">
        <label htmlFor="state-select" className="block text-sm font-medium text-neutral-700 mb-1">
          Filter by State
        </label>
        <select
          id="state-select"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All States (federal data)</option>
          <optgroup label="States with CMS Formulary Data">
            {ffmStates.map((s) => (
              <option key={s.abbr} value={s.abbr.toLowerCase()}>
                {s.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="State-Based Exchanges (links to state exchange)">
            {sbmStates.map((s) => (
              <option key={s.abbr} value={s.abbr.toLowerCase()}>
                {s.name} — {s.exchange}
              </option>
            ))}
          </optgroup>
        </select>
        {selectedStateName && (
          <p className="text-xs text-primary-600 mt-1">
            Filtering to plans available in {selectedStateName}. Results will show insurers operating in your state.
          </p>
        )}
      </div>

      {/* Drug search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={drug}
          onChange={(e) => setDrug(e.target.value)}
          placeholder="e.g. lisinopril, metformin, augmentin"
          className="flex-1 border border-neutral-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Info note */}
      <p className="text-xs text-neutral-400 mt-3">
        Formulary data from CMS covers {ffmStates.length} states using the federal marketplace.
        States with their own exchanges are linked to their state formulary tools.
      </p>

      {/* Popular drugs */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {POPULAR_DRUGS.map((d) => (
          <a
            key={d}
            href={`/formulary/${stateParam}/${d}`}
            className="px-4 py-2 border border-neutral-200 rounded-lg text-sm text-primary-600 hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            {d}
          </a>
        ))}
      </div>
    </main>
  )
}
