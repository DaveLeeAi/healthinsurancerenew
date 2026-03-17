'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import allStatesData from '@/data/config/all-states.json'
import DrugAutocomplete from '@/components/DrugAutocomplete'

type StateEntry = { name: string; abbr: string; exchange: string; ownExchange: boolean }

const allStates = (allStatesData.states as StateEntry[]).sort(
  (a, b) => a.name.localeCompare(b.name)
)

// States with CMS formulary data in our dataset
const FFM_STATES_WITH_DATA = new Set([
  'AK','AL','AZ','FL','IA','IN','KS','LA','MI','MO','MS','MT',
  'NC','ND','NE','NH','OH','OK','OR','SC','SD','TN','TX','UT','WI','WY'
])

// SBM states where we also have formulary data (from issuer filings)
const SBM_STATES_WITH_DATA = new Set([
  'GA','ID','IL','KY','ME','NJ','NV','PA','VA','WA'
])

const STATES_WITH_DATA = new Set(
  Array.from(FFM_STATES_WITH_DATA).concat(Array.from(SBM_STATES_WITH_DATA))
)

const dataStates = allStates.filter(s => STATES_WITH_DATA.has(s.abbr))
const noDataStates = allStates.filter(s => !STATES_WITH_DATA.has(s.abbr))

// Drug categories for "Common medications people check"
const DRUG_CATEGORIES = [
  {
    label: 'Diabetes',
    drugs: ['Metformin', 'Ozempic', 'Jardiance', 'Trulicity'],
  },
  {
    label: 'Blood Pressure',
    drugs: ['Lisinopril', 'Amlodipine', 'Losartan', 'Hydrochlorothiazide'],
  },
  {
    label: 'Mental Health',
    drugs: ['Sertraline', 'Escitalopram', 'Bupropion', 'Trazodone'],
  },
  {
    label: 'Cholesterol',
    drugs: ['Atorvastatin', 'Rosuvastatin', 'Simvastatin', 'Ezetimibe'],
  },
]

export default function FormularyIndexPage() {
  const router = useRouter()
  const [drug, setDrug] = useState('')
  const [selectedState, setSelectedState] = useState('')

  function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const slug = drug.trim().toLowerCase().replace(/\s+/g, '-')
    if (!slug) return
    const stateParam = selectedState || 'all'
    router.push(`/formulary/${stateParam}/${slug}`)
  }

  const stateParam = selectedState || 'all'

  return (
    <main className="max-w-3xl mx-auto px-4 pt-10 pb-16">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">
          Marketplace Drug Coverage Tool
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 leading-tight mb-3">
          Check If Your Medication Is Covered
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          Search 551,000+ medications across Marketplace (Obamacare) plans.
          See coverage status, cost tier, and restrictions instantly.
        </p>
      </div>

      {/* ── TRUST BAR ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Data source: CMS + issuer filings
        </span>
        <span className="hidden sm:inline text-neutral-300">|</span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
          Updated: 2026 plan year
        </span>
        <span className="hidden sm:inline text-neutral-300">|</span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
          {STATES_WITH_DATA.size} states covered
        </span>
        <span className="hidden sm:inline text-neutral-300">|</span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
          Built by a licensed U.S. health insurance agent
        </span>
      </div>

      {/* ── SEARCH BOX ───────────────────────────────────────── */}
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
            <optgroup label="States with Formulary Data">
              {dataStates.map((s) => (
                <option key={s.abbr} value={s.abbr.toLowerCase()}>
                  {s.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="State-Based Exchanges (linked to state tools)">
              {noDataStates.map((s) => (
                <option key={s.abbr} value={s.abbr.toLowerCase()}>
                  {s.name} — {s.exchange}
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
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors whitespace-nowrap shadow-sm"
            >
              Look Up Drug
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            You&apos;ll see coverage status, cost tier, and restrictions by plan.
          </p>
        </form>
      </div>

      {/* ── WHAT YOU'LL SEE ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <PreviewCard
          icon={<CheckCircleIcon />}
          title="Coverage Status"
          description="Covered, not covered, or varies by plan"
        />
        <PreviewCard
          icon={<TierIcon />}
          title="Cost Tier"
          description="Generic, preferred brand, specialty, etc."
        />
        <PreviewCard
          icon={<ClipboardIcon />}
          title="Restrictions"
          description="Prior authorization, step therapy, quantity limits"
        />
        <PreviewCard
          icon={<BuildingIcon />}
          title="Plans & Issuers"
          description="Which insurers include the drug"
        />
      </div>

      {/* ── COMMON MEDICATIONS ───────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">
          Common medications people check
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {DRUG_CATEGORIES.map((cat) => (
            <div key={cat.label} className="border border-neutral-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2.5">
                {cat.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {cat.drugs.map((d) => (
                  <a
                    key={d}
                    href={`/formulary/${stateParam}/${d.toLowerCase()}`}
                    className="px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700 font-medium hover:bg-primary-100 hover:border-primary-300 transition-colors"
                  >
                    {d}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATE DATA NOTICE ────────────────────────────────── */}
      <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-4 mb-10">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>Coverage data is based on {STATES_WITH_DATA.size} states</strong> using the
          federal Marketplace (Healthcare.gov) and select state-based exchanges where
          machine-readable formulary data is published.
          States like CA, NY, and MA run their own exchanges &mdash; if you select one,
          we&apos;ll guide you to the correct source.
        </p>
      </div>

      {/* ── WHY TRUST THIS TOOL ──────────────────────────────── */}
      <section className="border-t border-neutral-200 pt-8">
        <h2 className="text-base font-semibold text-navy-900 mb-4">
          Why trust this tool
        </h2>
        <ul className="space-y-2.5 text-sm text-neutral-600">
          <TrustBullet>
            Uses official CMS machine-readable data (MR-PUF) &mdash; the same data insurers are
            required by law to publish
          </TrustBullet>
          <TrustBullet>
            Updated for the current 2026 plan year
          </TrustBullet>
          <TrustBullet>
            Simplified into plain English &mdash; tier names, cost ranges, and restriction flags
            explained for consumers, not just brokers
          </TrustBullet>
          <TrustBullet>
            Built and maintained by a licensed U.S. health insurance agent with CMS
            Circle of Champions recognition
          </TrustBullet>
        </ul>
      </section>
    </main>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PreviewCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-center">
      <div className="flex justify-center mb-2 text-primary-500">{icon}</div>
      <p className="text-sm font-semibold text-navy-900 mb-0.5">{title}</p>
      <p className="text-xs text-neutral-500 leading-snug">{description}</p>
    </div>
  )
}

function TrustBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
      <span>{children}</span>
    </li>
  )
}

// ── Icons ───────────────────────────────────────────────────────────────────

function CheckCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  )
}

function TierIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/>
    </svg>
  )
}
