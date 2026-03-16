import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '../../components/Breadcrumbs'
import configData from '../../data/config/config.json'
import allStatesData from '../../data/config/all-states.json'

export const metadata: Metadata = {
  title: 'Health Insurance by State | HealthInsuranceRenew',
  description:
    'ACA health insurance information for every U.S. state. Find eligibility details, Medicaid expansion status, exchange info, and 2026 enrollment guides.',
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'States', url: '/states' },
]

export default function StatesIndexPage() {
  const licensedSlugs = new Set(configData.licensedStates.map((s) => s.slug))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Health Insurance by State
      </h1>
      <p className="text-lg text-slate-600 mb-8 max-w-2xl font-serif">
        Select your state to learn about ACA marketplace options, Medicaid expansion status, and
        2026 enrollment information. Licensed agents are available in 18 states.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Licensed Agent States</h2>
        <p className="text-sm text-slate-600 mb-4">
          Licensed agents can help you enroll in these states.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {configData.licensedStates.map((state) => (
            <Link
              key={state.slug}
              href={`/states/${state.slug}`}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-200"
            >
              <span className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-primary-100 transition-colors">
                {state.abbr}
              </span>
              <div>
                <p className="font-medium text-slate-800 group-hover:text-primary-600 transition-colors">
                  {state.name}
                </p>
                <p className="text-xs text-slate-500">Licensed agent state</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          All 50 States + D.C. — 2026 ACA Guides
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Every state has an ACA guide covering Medicaid expansion, exchange details, eligibility,
          and costs.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allStatesData.states.map((state) => (
            <Link
              key={state.slug}
              href={`/states/${state.slug}/aca-2026`}
              className={`group flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${
                licensedSlugs.has(state.slug)
                  ? 'bg-white border-primary-200 hover:border-primary-400 hover:shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <span
                className={`text-lg font-bold transition-colors ${
                  licensedSlugs.has(state.slug)
                    ? 'text-primary-700 group-hover:text-primary-600'
                    : 'text-slate-700 group-hover:text-slate-900'
                }`}
              >
                {state.abbr}
              </span>
              <span className="text-xs text-slate-500 text-center mt-0.5">{state.name}</span>
              {state.medicaidExpanded ? (
                <span className="text-[10px] text-green-600 mt-1">Expanded</span>
              ) : (
                <span className="text-[10px] text-amber-600 mt-1">Not expanded</span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
