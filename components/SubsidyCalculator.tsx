'use client'

import { useState, useMemo } from 'react'
import type { SubsidyRecord, FplTierEstimate, PolicyScenarioRecord } from '@/lib/types'

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

// ---------------------------------------------------------------------------
// ACA age rating factors (age 40 = 1.0×, ACA 3:1 max ratio)
// Anchor points; intermediate ages use piecewise linear interpolation
// ---------------------------------------------------------------------------
const AGE_ANCHORS: readonly [number, number][] = [
  [0,  0.635],
  [21, 0.635],
  [30, 0.760],
  [40, 1.000],
  [50, 1.320],
  [60, 1.745],
  [64, 2.016],
]

function getAgeRatingFactor(age: number): number {
  if (age <= AGE_ANCHORS[0][0]) return AGE_ANCHORS[0][1]
  if (age >= AGE_ANCHORS[AGE_ANCHORS.length - 1][0]) return AGE_ANCHORS[AGE_ANCHORS.length - 1][1]
  for (let i = 0; i < AGE_ANCHORS.length - 1; i++) {
    const [x0, y0] = AGE_ANCHORS[i]
    const [x1, y1] = AGE_ANCHORS[i + 1]
    if (age >= x0 && age <= x1) {
      const t = x1 === x0 ? 0 : (age - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  return 1.0
}

// ---------------------------------------------------------------------------
// Piecewise-linear interpolation over sorted (fpl_percent, value) pairs
// ---------------------------------------------------------------------------
function interpolateFpl(fplPct: number, breakpoints: readonly [number, number][]): number {
  if (breakpoints.length === 0) return 0
  if (fplPct <= breakpoints[0][0]) return breakpoints[0][1]
  if (fplPct >= breakpoints[breakpoints.length - 1][0]) return breakpoints[breakpoints.length - 1][1]
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const [x0, y0] = breakpoints[i]
    const [x1, y1] = breakpoints[i + 1]
    if (fplPct >= x0 && fplPct <= x1) {
      const t = x1 === x0 ? 0 : (fplPct - x0) / (x1 - x0)
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
  monthlyAptc: number
  monthlyContribution: number
  netMonthlyPremium: number
  ageFactor: number
  agePremium: number
  isMedicaid: boolean   // FPL < 138%
  isLowIncome: boolean  // 138% ≤ FPL < 150%
  isNearCliff: boolean  // 370% ≤ FPL ≤ 430%
  isAboveCliff: boolean // FPL > 400% (IRA 8.5% cap formula used)
}

interface Props {
  data: SubsidyRecord
  policyScenario?: PolicyScenarioRecord
  countyDisplay: string
  enhancedCreditsHref: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SubsidyCalculator({
  data,
  policyScenario,
  countyDisplay,
  enhancedCreditsHref,
}: Props) {
  const [householdSize, setHouseholdSize] = useState(2)
  const [rawIncome, setRawIncome]         = useState('')
  const [age, setAge]                     = useState(40)

  // Build sorted (fpl_percent, monthly_aptc) pairs once from subsidy_estimates
  const aptcBreakpoints = useMemo((): readonly [number, number][] => {
    return (Object.values(data.subsidy_estimates) as (FplTierEstimate | undefined)[])
      .filter((t): t is FplTierEstimate => t !== undefined)
      .map((t): [number, number] => [t.fpl_percent, t.monthly_aptc])
      .sort((a, b) => a[0] - b[0])
  }, [data.subsidy_estimates])

  const result = useMemo((): CalcResult | null => {
    const income = parseFloat(rawIncome.replace(/,/g, ''))
    if (!isFinite(income) || income < 0) return null

    const fplBase = FPL_2025[householdSize] ?? FPL_2025[8]
    const fplPct  = (income / fplBase) * 100

    const isMedicaid   = fplPct < 138
    const isLowIncome  = fplPct >= 138 && fplPct < 150
    const isNearCliff  = fplPct >= 370 && fplPct <= 430
    const isAboveCliff = fplPct > 400

    let monthlyAptc: number
    if (fplPct < 150) {
      // Use stored fpl_150 floor value (at-or-below threshold)
      monthlyAptc = data.subsidy_estimates.fpl_150?.monthly_aptc ?? 0
    } else if (fplPct <= 400) {
      // Interpolate between the 6 stored breakpoints
      monthlyAptc = Math.max(0, interpolateFpl(fplPct, aptcBreakpoints))
    } else {
      // Above 400% FPL — IRA enhanced formula: contribution capped at 8.5% of income
      monthlyAptc = Math.max(0, data.benchmark_silver_premium - (income * 0.085) / 12)
    }

    const netMonthlyPremium   = Math.max(0, data.benchmark_silver_premium - monthlyAptc)
    const monthlyContribution = Math.max(0, data.benchmark_silver_premium - monthlyAptc)
    const ageFactor           = getAgeRatingFactor(age)
    const agePremium          = data.benchmark_silver_premium * ageFactor

    return {
      fplPct,
      monthlyAptc,
      monthlyContribution,
      netMonthlyPremium,
      ageFactor,
      agePremium,
      isMedicaid,
      isLowIncome,
      isNearCliff,
      isAboveCliff,
    }
  }, [rawIncome, householdSize, age, aptcBreakpoints, data])

  const hasValidIncome =
    rawIncome.trim() !== '' && isFinite(parseFloat(rawIncome.replace(/,/g, '')))

  return (
    <div className="space-y-6">

      {/* ── Inputs ── */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Enter Your Household Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          <div>
            <label htmlFor="hh-size" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Household Size
            </label>
            <select
              id="hh-size"
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
              100% FPL: ${(FPL_2025[householdSize] ?? 0).toLocaleString()}/yr
            </p>
          </div>

          <div>
            <label htmlFor="annual-income" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Annual Household Income
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm select-none">
                $
              </span>
              <input
                id="annual-income"
                type="text"
                inputMode="numeric"
                value={rawIncome}
                onChange={(e) => setRawIncome(e.target.value)}
                placeholder="e.g. 45,000"
                aria-describedby="income-hint"
                className="w-full border border-neutral-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <p id="income-hint" className="text-xs text-neutral-400 mt-1">
              Combined gross income for all household members
            </p>
          </div>

          <div>
            <label htmlFor="age-input" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Age of Oldest Member
            </label>
            <input
              id="age-input"
              type="number"
              min={18}
              max={64}
              value={age}
              onChange={(e) => setAge(Math.min(64, Math.max(18, Number(e.target.value))))}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Age rating factor: ×{getAgeRatingFactor(age).toFixed(3)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Prompt before entry ── */}
      {!hasValidIncome && (
        <p className="text-sm text-neutral-400 italic text-center py-4">
          Enter your household income above to see your estimated subsidy.
        </p>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4" aria-live="polite" aria-atomic="true">

          {/* Medicaid zone */}
          {result.isMedicaid && (
            <div role="alert" className="bg-amber-50 border border-amber-300 rounded-xl p-5">
              <p className="font-semibold text-amber-800 mb-1">
                Medicaid / CHIP May Apply
              </p>
              <p className="text-sm text-amber-700 leading-relaxed">
                At <strong>{result.fplPct.toFixed(0)}% FPL</strong>, your income falls below
                the Medicaid threshold in most states. If eligible for Medicaid, you would not
                receive marketplace APTC credits. Visit{' '}
                <strong>healthcare.gov</strong> or your state Medicaid office to verify
                eligibility before enrolling in a marketplace plan.
              </p>
            </div>
          )}

          {/* Low-income zone 138–150% */}
          {result.isLowIncome && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="font-semibold text-amber-800 mb-1">
                Income 138–150% FPL — Enhanced Silver Plan Likely Available
              </p>
              <p className="text-sm text-amber-700 leading-relaxed">
                At <strong>{result.fplPct.toFixed(0)}% FPL</strong>, you may qualify for a
                $0-premium silver plan with enhanced cost-sharing reduction (CSR) in{' '}
                {countyDisplay}. The stored subsidy at 150% FPL for this county is{' '}
                <strong>
                  ${(data.subsidy_estimates.fpl_150?.monthly_aptc ?? 0).toFixed(0)}/mo
                </strong>
                . Consult a licensed agent for current plan availability.
              </p>
            </div>
          )}

          {/* Main APTC callout */}
          {!result.isMedicaid && result.monthlyAptc > 0 && (
            <div className="bg-primary-50 border-2 border-primary-400 rounded-xl p-6">
              <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-1">
                Estimated Monthly Tax Credit
              </p>
              <p className="text-5xl font-bold text-primary-800 mb-2">
                ${result.monthlyAptc.toFixed(0)}
                <span className="text-2xl font-normal text-primary-600">/mo</span>
              </p>
              <p className="text-primary-700 text-sm leading-relaxed">
                You may qualify for{' '}
                <strong>${result.monthlyAptc.toFixed(0)}/month</strong> in premium tax
                credits
                {result.isAboveCliff
                  ? ' (IRA enhanced cap — 8.5% of income)'
                  : ` (${result.fplPct.toFixed(0)}% FPL)`}
                , reducing the benchmark silver plan from{' '}
                <strong>${data.benchmark_silver_premium.toFixed(0)}/mo</strong> to{' '}
                <strong>${result.netMonthlyPremium.toFixed(0)}/mo</strong>
                {result.netMonthlyPremium === 0 ? ' — fully subsidized' : ''}.
              </p>
              {result.isAboveCliff && (
                <p className="text-xs text-primary-500 mt-2">
                  ⚠ Estimate uses the IRA enhanced credit formula (contribution capped at 8.5%
                  of income). Without enhanced credits, no APTC applies above 400% FPL.
                </p>
              )}
            </div>
          )}

          {/* Math breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Your FPL %"
              value={`${result.fplPct.toFixed(0)}%`}
              sub={`of $${(FPL_2025[householdSize] ?? 0).toLocaleString()} base`}
            />
            <StatCard
              label="APTC Credit"
              value={`$${result.monthlyAptc.toFixed(0)}/mo`}
              sub="estimated monthly"
              highlight
            />
            <StatCard
              label="Your Contribution"
              value={`$${result.monthlyContribution.toFixed(0)}/mo`}
              sub="toward silver plan"
            />
            <StatCard
              label="Net Silver Premium"
              value={`$${result.netMonthlyPremium.toFixed(0)}/mo`}
              sub="after tax credit"
            />
          </div>

          {/* Age-adjusted note */}
          <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 text-sm text-neutral-600 leading-relaxed">
            <strong>Age adjustment (age {age}):</strong>{' '}
            The benchmark silver premium of{' '}
            <strong>${data.benchmark_silver_premium.toFixed(0)}/mo</strong> is the age-40
            reference rate for {countyDisplay}. At age {age}, your actual silver plan premium is
            approximately{' '}
            <strong>${result.agePremium.toFixed(0)}/mo</strong> (×
            {result.ageFactor.toFixed(3)} rating factor) before the tax credit. Insurers apply
            the APTC against your actual age-rated premium at enrollment.
          </div>

          {/* Cliff warning */}
          {result.isNearCliff && (
            <div role="alert" className="bg-red-50 border border-red-300 rounded-xl p-5">
              <p className="font-semibold text-red-800 mb-1">
                ⚠ Subsidy Cliff Warning — Income Near 400% FPL
              </p>
              <p className="text-sm text-red-700 leading-relaxed">
                At <strong>{result.fplPct.toFixed(0)}% FPL</strong>, your income is{' '}
                {result.isAboveCliff ? 'above' : 'approaching'} the 400% FPL threshold where
                standard marketplace subsidies end. Under IRA enhanced credits (through 2025),
                contributions are capped at 8.5% of income at all income levels. If these
                expire, subsidies above 400% FPL are eliminated entirely.
              </p>
              {policyScenario &&
                policyScenario.headline.monthly_increase_at_expiration > 0 && (
                  <p className="text-sm text-red-700 mt-2 leading-relaxed">
                    For {countyDisplay} at the modeled{' '}
                    {policyScenario.headline.fpl_percent}% FPL scenario (age{' '}
                    {policyScenario.headline.age}), credit expiration would add{' '}
                    <strong>
                      +$
                      {policyScenario.headline.monthly_increase_at_expiration.toFixed(0)}/month
                    </strong>{' '}
                    (+$
                    {policyScenario.headline.annual_increase_at_expiration.toFixed(0)}/year).{' '}
                    <a href={enhancedCreditsHref} className="underline font-medium">
                      See full scenario analysis →
                    </a>
                  </p>
                )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-neutral-400 pt-3 border-t border-neutral-100 leading-relaxed">
        Estimates use the federal benchmark silver premium for {countyDisplay} · Age-40 reference
        rate · 2025 FPL guidelines (lower 48 states + DC; Alaska and Hawaii have higher
        thresholds) · Actual credits depend on final reported income, enrollment status, and
        plan selection.{' '}
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
