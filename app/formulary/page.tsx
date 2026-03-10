'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FormularyIndexPage() {
  const router = useRouter()
  const [drug, setDrug] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const slug = drug.trim().toLowerCase().replace(/\s+/g, '-')
    if (slug) router.push(`/formulary/all/${slug}`)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-navy-900 mb-2">Drug Formulary Lookup</h1>
      <p className="text-neutral-500 mb-8">
        Search 551,000+ drugs across all ACA Marketplace plans. Data from CMS MR-PUF 2026.
      </p>
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
      <div className="mt-8 grid grid-cols-2 gap-3">
        {['lisinopril', 'metformin', 'atorvastatin', 'sertraline', 'omeprazole', 'amlodipine'].map((d) => (
          <a
            key={d}
            href={`/formulary/all/${d}`}
            className="px-4 py-2 border border-neutral-200 rounded-lg text-sm text-primary-600 hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            {d}
          </a>
        ))}
      </div>
    </main>
  )
}
