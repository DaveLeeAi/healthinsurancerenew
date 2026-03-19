'use client'

import { useState, useMemo } from 'react'

// ---------------------------------------------------------------------------
// 2025 Federal Poverty Level base amounts — lower 48 states + DC
// Source: HHS 2025 FPL Guidelines
// ---------------------------------------------------------------------------
const FPL_2025: Record<number, number> = {
  1: 15060,
  2: 20440,
  3: 25820,
  4: 31200,
  5: 36580,
  6: 41960,
  7: 47340,
  8: 52720,
}

// Alaska and Hawaii have higher FPL thresholds
const FPL_MULTIPLIER: Record<string, number> = {
  AK: 1.25,
  HI: 1.15,
}

// ---------------------------------------------------------------------------
// IRA enhanced applicable percentage breakpoints
// (fpl_percent, applicable_percentage)
// ---------------------------------------------------------------------------
const APPLICABLE_PCT_BREAKPOINTS: readonly [number, number][] = [
  [0, 0],
  [150, 0],
  [200, 0.02],
  [250, 0.04],
  [300, 0.06],
  [400, 0.085],
]

// National average benchmark silver premium (age 40) — 2026 reference
const NATIONAL_AVG_BENCHMARK = 514.89

// ---------------------------------------------------------------------------
// Piecewise-linear interpolation
// ---------------------------------------------------------------------------
function interpolate(x: number, breakpoints: readonly [number, number][]): number {
  if (breakpoints.length === 0) return 0
  if (x <= breakpoints[0][0]) return breakpoints[0][1]
  if (x >= breakpoints[breakpoints.length - 1][0]) return breakpoints[breakpoints.length - 1][1]
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const [x0, y0] = breakpoints[i]
    const [x1, y1] = breakpoints[i + 1]
    if (x >= x0 && x <= x1) {
      const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  return breakpoints[breakpoints.length - 1][1]
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CalcResult {
  fplPct: number
  applicablePct: number
  expectedContribution: number
  monthlyAptc: number
  netMonthlyPremium: number
  csrTier: string | null
}

interface Props {
  stateName: string
  stateAbbr: string
  exchangeName: string
  exchangeUrl: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function StateFPLCalculator({
  stateName,
  stateAbbr,
  exchangeName,
  exchangeUrl,
}: Props) {
  const [householdSize, setHouseholdSize] = useState(1)
  const [rawIncome, setRawIncome] = useState('')

  const result = useMemo((): CalcResult | null => {
    const income = parseFloat(rawIncome.replace(/,/g, ''))
    if (!isFinite(income) || income <= 0) return null

    const multiplier = FPL_MULTIPLIER[stateAbbr] ?? 1.0
    const fplBase = (FPL_2025[householdSize] ?? FPL_2025[8]) * multiplier
    const fplPct = (income / fplBase) * 100

    // Applicable percentage (IRA enhanced rates)
    const applicablePct = fplPct > 400
      ? 0.085
      : interpolate(fplPct, APPLICABLE_PCT_BREAKPOINTS)

    // Expected annual contribution = income * applicable %
    const expectedContribution = income * applicablePct
    const monthlyContribution = expectedContribution / 12

    // APTC = benchmark - expected contribution (floored at 0)
    const monthlyAptc = Math.max(0, NATIONAL_AVG_BENCHMARK - monthlyContribution)
    const netMonthlyPremium = Math.max(0, NATIONAL_AVG_BENCHMARK - monthlyAptc)

    // CSR tier estimation (Silver plan only)
    let csrTier: string | null = null
    if (fplPct <= 150) {
      csrTier = '94% AV Silver (strongest cost-sharing help)'
    } else if (fplPct <= 200) {
      csrTier = '87% AV Silver (strong cost-sharing help)'
    } else if (fplPct <= 250) {
      csrTier = '73% AV Silver (moderate cost-sharing help)'
    }

    return { fplPct, applicablePct, expectedContribution, monthlyAptc, netMonthlyPremium, csrTier }
  }, [rawIncome, householdSize, stateAbbr])

  const hasValidIncome =
    rawIncome.trim() !== '' && isFinite(parseFloat(rawIncome.replace(/,/g, '')))

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">
          Estimate Your {stateName} Premium Tax Credit
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sfpl-hh-size" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Household Size
            </label>
            <select
              id="sfpl-hh-size"
              value={householdSize}
              onChange={(e) => setHouseholdSize(Number(e.target.value))}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n} person{n !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-400 mt-1">
              100% FPL: ${((FPL_2025[householdSize] ?? 0) * (FPL_MULTIPLIER[stateAbbr] ?? 1.0)).toLocaleString()}/yr
            </p>
          </div>

          <div>
            <label htmlFor="sfpl-income" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Annual Household Income
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm select-none">
                $
              </span>
              <input
                id="sfpl-income"
                type="text"
                inputMode="numeric"
                value={rawIncome}
                onChange={(e) => setRawIncome(e.target.value)}
                placeholder="e.g. 45,000"
                className="w-full border border-neutral-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Combined gross income for all household members
            </p>
          </div>
        </div>
      </div>

      {/* Prompt before entry */}
      {!hasValidIncome && (
        <p className="text-sm text-neutral-400 italic text-center py-4">
          Enter your household income above to see your estimated subsidy.
        </p>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4" aria-live="polite" aria-atomic="true">

          {/* Medicaid zone */}
          {result.fplPct < 138 && (
            <div role="alert" className="bg-amber-50 border border-amber-300 rounded-xl p-5">
              <p className="font-semibold text-amber-800 mb-1">
                Medicaid / CHIP May Apply
              </p>
              <p className="text-sm text-amber-700 leading-relaxed">
                At <strong>{result.fplPct.toFixed(0)}% FPL</strong>, your income falls below
                the Medicaid threshold. If eligible for Medicaid in {stateName}, you would not
                receive marketplace APTC credits. Check with {exchangeName} or your state Medicaid
                office to verify eligibility.
              </p>
            </div>
          )}

          {/* Main APTC callout */}
          {result.fplPct >= 138 && result.monthlyAptc > 0 && (
            <div className="bg-primary-50 border-2 border-primary-400 rounded-xl p-6">
              <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-1">
                Estimated Monthly Tax Credit
              </p>
              <p className="text-5xl font-bold text-primary-800 mb-2">
                ${result.monthlyAptc.toFixed(0)}
                <span className="text-2xl font-normal text-primary-600">/mo</span>
              </p>
              <p className="text-primary-700 text-sm leading-relaxed">
                At <strong>{result.fplPct.toFixed(0)}% FPL</strong>, your expected contribution
                is {(result.applicablePct * 100).toFixed(1)}% of income. This reduces the
                national average benchmark silver premium from{' '}
                <strong>${NATIONAL_AVG_BENCHMARK.toFixed(0)}/mo</strong> to approximately{' '}
                <strong>${result.netMonthlyPremium.toFixed(0)}/mo</strong>.
              </p>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Your FPL %"
              value={`${result.fplPct.toFixed(0)}%`}
              sub={`of ${stateAbbr} poverty level`}
            />
            <StatCard
              label="APTC Credit"
              value={`$${result.monthlyAptc.toFixed(0)}/mo`}
              sub="estimated monthly"
              highlight
            />
            <StatCard
              label="Your Share"
              value={`$${result.netMonthlyPremium.toFixed(0)}/mo`}
              sub="toward silver plan"
            />
            <StatCard
              label="Contribution Rate"
              value={`${(result.applicablePct * 100).toFixed(1)}%`}
              sub="of income (IRA rates)"
            />
          </div>

          {/* CSR tier */}
          {result.csrTier && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              <strong>Cost-Sharing Reduction:</strong> At {result.fplPct.toFixed(0)}% FPL,
              you likely qualify for a <strong>{result.csrTier}</strong> if you choose a Silver plan.
              CSR lowers your deductibles and copays at no additional premium cost.
            </div>
          )}

          {/* Disclaimer with inline exchange link */}
          <p className="text-xs text-slate-400 text-center mt-3">
            This is a national average estimate. For exact premiums in {stateName},{' '}
            <a href="/contact" className="underline hover:text-slate-600">
              contact a licensed agent
            </a>
            {' '}who can enroll you at no cost.
          </p>
        </div>
      )}

      <p className="text-xs text-neutral-400 pt-3 border-t border-neutral-100 leading-relaxed">
        Estimates use the national average benchmark silver premium (${NATIONAL_AVG_BENCHMARK}/mo at
        age 40) and IRA enhanced applicable percentage rates. 2025 FPL guidelines
        {FPL_MULTIPLIER[stateAbbr] ? ` (${stateAbbr} adjusted)` : ' (lower 48 + DC)'}.
        Actual credits depend on the benchmark plan in your county, age, and final MAGI.{' '}
        <strong>Consult a licensed health insurance agent</strong> for personalized advice.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Local sub-component
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`p-4 rounded-xl ${
        highlight
          ? 'bg-primary-100 border border-primary-300'
          : 'bg-neutral-50 border border-neutral-200'
      }`}
    >
      <div
        className={`text-xs uppercase tracking-wide mb-1 ${
          highlight ? 'text-primary-500' : 'text-neutral-400'
        }`}
      >
        {label}
      </div>
      <div className={`text-xl font-bold ${highlight ? 'text-primary-800' : 'text-navy-800'}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-neutral-400 mt-0.5">{sub}</div>}
    </div>
  )
}
