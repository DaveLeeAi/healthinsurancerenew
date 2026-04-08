'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DrugAutocomplete from '@/components/DrugAutocomplete'

function stateNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

interface StateEntry {
  name: string
  abbr: string
  exchange: string
  ownExchange: boolean
}

interface FormularySearchProps {
  ffmStates: StateEntry[]
  sbmStates: StateEntry[]
}

export default function FormularySearch({ ffmStates, sbmStates }: FormularySearchProps) {
  const router = useRouter()
  const [drug, setDrug] = useState('')
  const [selectedState, setSelectedState] = useState('')

  function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const slug = drug.trim().toLowerCase().replace(/\s+/g, '-')
    if (!slug) return
    const stateParam = selectedState || 'all'
    if (stateParam === 'all') {
      router.push(`/formulary/all/${slug}`)
    } else {
      router.push(`/${stateParam}/${slug}`)
    }
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-5 sm:p-6 mb-6">
      {/* State selector */}
      <div className="mb-4">
        <label htmlFor="state-select" className="block text-sm font-medium text-neutral-700 mb-1.5">
          Your state
        </label>
        <select
          id="state-select"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        >
          <option value="">All states (nationwide search)</option>
          <optgroup label="Healthcare.gov States (FFM)">
            {ffmStates.map((s) => (
              <option key={s.abbr} value={stateNameToSlug(s.name)}>
                {s.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="State-Based Marketplace (SBM)">
            {sbmStates.map((s) => (
              <option key={s.abbr} value={stateNameToSlug(s.name)}>
                {s.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Drug search */}
      <form onSubmit={handleSearch}>
        <label htmlFor="drug-search" className="block text-sm font-medium text-neutral-700 mb-1.5">
          Medication name
        </label>
        <div className="flex gap-3">
          <DrugAutocomplete
            value={drug}
            onChange={setDrug}
            onSubmit={() => handleSearch()}
            placeholder="Type your medication name (e.g. Ozempic, Metformin, Adderall)"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors whitespace-nowrap shadow-sm"
          >
            Search
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Works for brand and generic names. Based on 2026 plan data.
        </p>
      </form>
    </div>
  )
}
