'use client'

// ---------------------------------------------------------------------------
// SbmPlanTable — carrier-filterable plan listing for SBM state pages
// ---------------------------------------------------------------------------
//
// Extracts the plan listing table block from the server-rendered SBM state page
// so that carrier filtering (client interactivity) can work without turning the
// whole page into a client component.
//
// The server component loads `sbmPlans`, filters to standard CSR variants, and
// groups by metal level. This component receives those pre-filtered/grouped plans
// and handles the carrier tab UI.

import { useState, useMemo } from 'react'
import CarrierFilterBar from './CarrierFilterBar'

// ---------------------------------------------------------------------------
// Types — mirrors SbmSbcRecord from data-loader (serialisable subset only)
// ---------------------------------------------------------------------------

export interface SbmPlanRow {
  plan_variant_id: string
  plan_id?: string | null
  plan_name_from_sbc?: string | null
  issuer_name: string
  metal_level: string
  network_type?: string | null
  deductible_individual?: number | string | null
  oop_max_individual?: number | string | null
}

interface Props {
  /** Standard-CSR plans, all metal levels, sorted however the server prefers */
  plans: SbmPlanRow[]
  stateSlug: string
  exchangeName: string
  planYear: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const METAL_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Catastrophic', 'Expanded Bronze']

function sbmPlanSlug(planName: string): string {
  const base = planName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base.endsWith('-plan') ? base : `${base}-plan`
}

function formatCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'string') return val.startsWith('$') ? val : `$${val}`
  return `$${val.toLocaleString()}`
}

function metalBadgeClass(metal: string): string {
  const m = metal.toLowerCase()
  if (m === 'bronze' || m === 'expanded bronze') return 'bg-amber-100 text-amber-800'
  if (m === 'silver') return 'bg-slate-100 text-slate-700'
  if (m === 'gold') return 'bg-yellow-100 text-yellow-800'
  if (m === 'platinum') return 'bg-indigo-100 text-indigo-800'
  if (m === 'catastrophic') return 'bg-red-100 text-red-700'
  return 'bg-neutral-100 text-neutral-600'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SbmPlanTable({ plans, stateSlug, exchangeName, planYear }: Props) {
  const [carrierFilter, setCarrierFilter] = useState('all')

  // Carrier list: counts from ALL plans (before carrier filter), sorted A-Z
  const carriers = useMemo(() => {
    const counts = new Map<string, number>()
    plans.forEach((p) => {
      const name = p.issuer_name ?? 'Unknown'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [plans])

  // Apply carrier filter
  const filteredPlans = useMemo(
    () =>
      carrierFilter === 'all'
        ? plans
        : plans.filter((p) => p.issuer_name === carrierFilter),
    [plans, carrierFilter],
  )

  // Group filtered plans by metal level in canonical order
  const byMetal = useMemo(() => {
    const groups: Record<string, SbmPlanRow[]> = {}
    METAL_ORDER.forEach((m) => {
      const group = filteredPlans.filter((p) => p.metal_level === m)
      if (group.length > 0) groups[m] = group
    })
    return groups
  }, [filteredPlans])

  const issuerNames = useMemo(
    () => [...new Set(plans.map((p) => p.issuer_name))].sort(),
    [plans],
  )

  if (plans.length === 0) return null

  return (
    <div className="space-y-5">
      {/* ── Carrier filter tabs ── */}
      <CarrierFilterBar
        carriers={carriers}
        selected={carrierFilter}
        totalCount={plans.length}
        onSelect={setCarrierFilter}
      />

      {/* ── Plan count summary ── */}
      {carrierFilter !== 'all' && (
        <p className="text-sm text-neutral-500">
          Showing {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''} from{' '}
          <strong>{carrierFilter}</strong>.{' '}
          <button
            onClick={() => setCarrierFilter('all')}
            className="text-primary-600 underline hover:text-primary-700"
          >
            Show all carriers
          </button>
        </p>
      )}

      {/* ── Plans grouped by metal level ── */}
      {Object.entries(byMetal).map(([metal, metalPlans]) => (
        <div key={metal}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${metalBadgeClass(metal)}`}>
              {metal}
            </span>
            <span className="text-xs text-neutral-400">{metalPlans.length} plan{metalPlans.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Plan Name</th>
                  <th className="text-left px-4 py-2.5 font-medium">Network</th>
                  <th className="text-right px-4 py-2.5 font-medium">Deductible (Ind)</th>
                  <th className="text-right px-4 py-2.5 font-medium">OOP Max (Ind)</th>
                  <th className="text-left px-4 py-2.5 font-medium">Carrier</th>
                  <th className="text-right px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {metalPlans.map((plan) => {
                  const slug = sbmPlanSlug(plan.plan_name_from_sbc || plan.plan_id || plan.plan_variant_id)
                  const href = `/${stateSlug}/health-insurance-plans/${slug}`
                  return (
                    <tr
                      key={plan.plan_variant_id}
                      className="hover:bg-primary-50/40 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <a
                          href={href}
                          className="font-medium text-primary-700 hover:text-primary-800 hover:underline"
                        >
                          {plan.plan_name_from_sbc || plan.plan_id}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{plan.network_type || '—'}</td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        {formatCurrency(plan.deductible_individual)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        {formatCurrency(plan.oop_max_individual)}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{plan.issuer_name}</td>
                      <td className="px-4 py-2.5 text-right">
                        <a
                          href={href}
                          className="text-xs text-primary-600 hover:underline whitespace-nowrap"
                        >
                          View details →
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ── No results for this carrier ── */}
      {filteredPlans.length === 0 && (
        <p className="text-sm text-neutral-400 py-4 text-center">
          No standard plans found for this carrier.
        </p>
      )}

      <p className="text-xs text-neutral-400">
        Source: {issuerNames.join(', ')} Summary of Benefits and Coverage documents, plan year{' '}
        {planYear}. Premiums vary by age, household size, and income. Contact a licensed agent to
        enroll.
      </p>
    </div>
  )
}
