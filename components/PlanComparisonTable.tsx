'use client'

import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { PlanRecord } from '@/lib/types'
import { stateCodeToSlug, getCountySlug } from '@/lib/county-lookup'
import { generatePlanSlug } from '@/lib/plan-slug'
import CarrierFilterBar from './CarrierFilterBar'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'premium_age_21' | 'premium_age_40' | 'premium_age_64' | 'deductible' | 'moop'
type SortDir = 'asc' | 'desc'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'premium_age_21', label: 'Age 21' },
  { key: 'premium_age_40', label: 'Age 40' },
  { key: 'premium_age_64', label: 'Age 64' },
  { key: 'deductible',     label: 'Deductible' },
  { key: 'moop',           label: 'OOP Max' },
]

const METAL_BADGE: Record<string, string> = {
  catastrophic:    'bg-neutral-100 text-neutral-600',
  bronze:          'bg-amber-50 text-amber-700',
  expanded_bronze: 'bg-amber-100 text-amber-800',
  silver:          'bg-slate-100 text-slate-700',
  gold:            'bg-yellow-50 text-yellow-700',
  platinum:        'bg-violet-50 text-violet-700',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSortValue(plan: PlanRecord, key: SortKey): number {
  switch (key) {
    case 'premium_age_21': return plan.premiums?.age_21 ?? Infinity
    case 'premium_age_40': return plan.premiums?.age_40 ?? Infinity
    case 'premium_age_64': return plan.premiums?.age_64 ?? Infinity
    case 'deductible':     return plan.deductible_individual ?? Infinity
    case 'moop':           return plan.moop_individual ?? Infinity
  }
}

function fmtDollar(val: number | null | undefined): string {
  return val != null ? `$${val.toLocaleString()}` : '—'
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return <span className="text-neutral-300 text-xs" aria-hidden="true">⇕</span>
  }
  return (
    <span className="text-primary-600 text-xs" aria-hidden="true">
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  )
}

function SortableTh({
  colKey,
  activeKey,
  dir,
  onSort,
  children,
}: {
  colKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  children: ReactNode
}) {
  const isActive = colKey === activeKey
  const ariaSort: 'ascending' | 'descending' | 'none' = isActive
    ? dir === 'asc' ? 'ascending' : 'descending'
    : 'none'

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className="px-3 py-3 text-right font-semibold text-navy-700 whitespace-nowrap cursor-pointer select-none hover:bg-navy-100 transition-colors"
      onClick={() => onSort(colKey)}
    >
      <span className="inline-flex items-center justify-end gap-1">
        {children}
        <SortIcon active={isActive} dir={dir} />
      </span>
    </th>
  )
}

// ---------------------------------------------------------------------------
// PlanComparisonTable
// ---------------------------------------------------------------------------

interface Props {
  plans: PlanRecord[]
}

export default function PlanComparisonTable({ plans }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('premium_age_40')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [metalFilter, setMetalFilter]     = useState('all')
  const [typeFilter, setTypeFilter]       = useState('all')
  const [carrierFilter, setCarrierFilter] = useState('all')

  // Derive carrier list from ALL plans, sorted A-Z — counts reflect total per carrier
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

  // Derive filter option lists from the full plans prop (not the filtered view)
  const metalLevels = useMemo(
    () => ['all', ...Array.from(new Set(plans.map((p) => p.metal_level))).sort()],
    [plans],
  )
  const planTypes = useMemo(
    () => ['all', ...Array.from(new Set(plans.map((p) => p.plan_type))).sort()],
    [plans],
  )

  // Apply filters then sort
  const displayed = useMemo(() => {
    let filtered = plans
    if (carrierFilter !== 'all') filtered = filtered.filter((p) => p.issuer_name === carrierFilter)
    if (metalFilter   !== 'all') filtered = filtered.filter((p) => p.metal_level === metalFilter)
    if (typeFilter    !== 'all') filtered = filtered.filter((p) => p.plan_type   === typeFilter)
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, sortKey)
      const bv = getSortValue(b, sortKey)
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [plans, carrierFilter, metalFilter, typeFilter, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (plans.length === 0) {
    return <p className="text-neutral-500">No plans available for this county.</p>
  }

  return (
    <div className="space-y-3">

      {/* ── Carrier filter tabs ── */}
      <CarrierFilterBar
        carriers={carriers}
        selected={carrierFilter}
        totalCount={plans.length}
        onSelect={setCarrierFilter}
      />

      {/* ── Filter controls ── */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <span>Metal level:</span>
          <select
            value={metalFilter}
            onChange={(e) => setMetalFilter(e.target.value)}
            className="border border-neutral-300 rounded-lg px-2 py-1.5 text-sm bg-white"
            aria-label="Filter by metal level"
          >
            {metalLevels.map((m) => (
              <option key={m} value={m}>
                {m === 'all' ? 'All levels' : capitalize(m)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <span>Plan type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-neutral-300 rounded-lg px-2 py-1.5 text-sm bg-white"
            aria-label="Filter by plan type"
          >
            {planTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All types' : t}
              </option>
            ))}
          </select>
        </label>

        <span className="text-xs text-neutral-400 ml-auto">
          {displayed.length} plan{displayed.length !== 1 ? 's' : ''} shown
        </span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-navy-50">
              <th scope="col" className="px-3 py-3 text-left font-semibold text-navy-700 whitespace-nowrap">
                Plan Name
              </th>
              <th scope="col" className="px-3 py-3 text-left font-semibold text-navy-700 whitespace-nowrap">
                Issuer
              </th>
              <th scope="col" className="px-3 py-3 text-left font-semibold text-navy-700 whitespace-nowrap">
                Metal
              </th>
              <th scope="col" className="px-3 py-3 text-left font-semibold text-navy-700 whitespace-nowrap">
                Type
              </th>
              {SORT_COLUMNS.map(({ key, label }) => (
                <SortableTh
                  key={key}
                  colKey={key}
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                >
                  {label}
                </SortableTh>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((plan, i) => (
              <tr
                key={plan.plan_id ?? i}
                className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors"
              >
                {/* Plan name as row header for accessibility */}
                <th scope="row" className="px-3 py-3 font-medium text-left">
                  <a
                    href={
                      plan.state_code && plan.county_fips
                        ? `/${stateCodeToSlug(plan.state_code)}/${getCountySlug(plan.county_fips)}/${generatePlanSlug(plan.plan_name ?? '')}`
                        : plan.state_code
                        ? `/${stateCodeToSlug(plan.state_code)}/health-insurance-plans`
                        : '#'
                    }
                    className="text-primary-600 hover:underline hover:text-primary-800"
                  >
                    {plan.plan_name}
                  </a>
                </th>
                <td className="px-3 py-3 text-neutral-600">{plan.issuer_name}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      METAL_BADGE[plan.metal_level] ?? 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {capitalize(plan.metal_level)}
                  </span>
                </td>
                <td className="px-3 py-3 text-neutral-600">{plan.plan_type}</td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  {fmtDollar(plan.premiums?.age_21)}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums font-semibold">
                  {fmtDollar(plan.premiums?.age_40)}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  {fmtDollar(plan.premiums?.age_64)}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  {fmtDollar(plan.deductible_individual)}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  {fmtDollar(plan.moop_individual)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-400">
        Premiums shown before subsidy · All amounts monthly/per person ·
        Source:{' '}
        <a
          href="https://www.cms.gov/marketplace/resources/data/public-use-files"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          federal marketplace plan data
        </a>{' '}
        · Click column headers to sort · Consult a licensed agent for personalized advice
      </p>
    </div>
  )
}
