'use client'

import { useState } from 'react'
import Breadcrumbs from '../../../components/Breadcrumbs'
import AeoBlock from '../../../components/AeoBlock'
import fplData from '../../../data/config/fpl-current.json'
import contributionData from '../../../data/config/contribution-scale.json'
import configData from '../../../data/config/config.json'

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'Estimate Your Savings', url: '/tools/income-savings-calculator' },
]

interface Band {
  minFPL: number
  maxFPL: number
  minPercent: number
  maxPercent: number
}

function getFPL(size: number): number {
  const g = fplData.guidelines
  if (size === 1) return g.household_1
  if (size === 2) return g.household_2
  if (size === 3) return g.household_3
  if (size === 4) return g.household_4
  if (size === 5) return g.household_5
  if (size === 6) return g.household_6
  return g.household_6 + g.additionalPerson * (size - 6)
}

function findBand(fplPercent: number): Band {
  const bands = contributionData.bands as Band[]
  for (const band of bands) {
    if (fplPercent >= band.minFPL && fplPercent < band.maxFPL) return band
  }
  return bands[bands.length - 1]
}

function getInterpretation(fplPercent: number): string {
  if (fplPercent < 150) {
    return 'At this income level (below 150% FPL), individuals may be eligible for low-cost or no-cost coverage options, including Medicaid in states that have expanded eligibility. Marketplace plans with significant premium tax credits and cost-sharing reductions may also be available.'
  } else if (fplPercent < 400) {
    return 'At this income level (between 150% and 400% FPL), individuals generally may receive premium tax credits that reduce the monthly cost of a marketplace health insurance plan. The amount of financial assistance typically decreases as income increases.'
  } else {
    return 'At this income level (above 400% FPL), no premium tax credit is available for 2026. The enhanced subsidies that previously extended assistance above 400% FPL expired at the end of 2025. You would pay the full unsubsidized premium. A licensed agent can help you find the most affordable plan options.'
  }
}

export default function IncomeSavingsCalculatorPage() {
  const [householdSize, setHouseholdSize] = useState('')
  const [annualIncome, setAnnualIncome] = useState('')
  const [stateVal, setStateVal] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    fpl: number
    fplPercent: number
    band: Band
    interpretation: string
  } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!householdSize || !annualIncome || !stateVal) {
      setError('Please complete all fields before calculating.')
      return
    }

    const size = parseInt(householdSize, 10)
    const income = parseFloat(annualIncome)

    if (income <= 0) {
      setError('Please enter a valid income amount greater than zero.')
      return
    }

    const fpl = getFPL(size)
    const fplPercent = (income / fpl) * 100
    const band = findBand(fplPercent)

    setResult({ fpl, fplPercent, band, interpretation: getInterpretation(fplPercent) })
  }

  function handleReset() {
    setHouseholdSize('')
    setAnnualIncome('')
    setStateVal('')
    setError('')
    setResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Estimate Your Health Insurance Savings
      </h1>

      <AeoBlock answer="Enter your household size and annual income to calculate an estimate of your potential marketplace savings." caveat="This is an estimate for planning purposes. Verify with your plan or a licensed agent." />

      <div className="bg-white/70 border border-slate-200/80 rounded-2xl p-4 mb-6">
        <p className="text-sm text-slate-600 leading-relaxed">
          This website is not affiliated with any federal or state government agency. Information
          provided here is for educational purposes only.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Estimate Your Income-Based Savings
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="household-size" className="block text-sm font-medium text-slate-700 mb-1">
              Household Size
            </label>
            <select
              id="household-size"
              value={householdSize}
              onChange={(e) => setHouseholdSize(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Select household size</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'person' : 'people'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="annual-income" className="block text-sm font-medium text-slate-700 mb-1">
              Annual Household Income ($)
            </label>
            <input
              type="number"
              id="annual-income"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              placeholder="e.g. 45000"
              min="0"
              step="100"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="state-select" className="block text-sm font-medium text-slate-700 mb-1">
              State
            </label>
            <select
              id="state-select"
              value={stateVal}
              onChange={(e) => setStateVal(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Select your state</option>
              {configData.licensedStates.map((state) => (
                <option key={state.abbr} value={state.abbr}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
            >
              Calculate Estimate
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Educational Estimate</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-primary-50 rounded-xl p-4">
                <p className="text-sm text-primary-700 font-medium">Federal Poverty Level</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">
                  ${result.fpl.toLocaleString()}
                </p>
              </div>
              <div className="bg-primary-50 rounded-xl p-4">
                <p className="text-sm text-primary-700 font-medium">Income as % of FPL</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">
                  {result.fplPercent.toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
              <p className="text-sm text-slate-700 font-medium mb-1">Expected Contribution Range</p>
              <p className="text-lg font-semibold text-slate-900">
                {result.band.minPercent === 0 && result.band.maxPercent === 0
                  ? 'Estimated contribution: $0 (0% of income)'
                  : `Estimated monthly contribution: $${Math.round((result.band.minPercent / 100) * parseFloat(annualIncome) / 12).toLocaleString()} – $${Math.round((result.band.maxPercent / 100) * parseFloat(annualIncome) / 12).toLocaleString()} (${result.band.minPercent.toFixed(1)}% – ${result.band.maxPercent.toFixed(1)}% of income)`}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-700 font-medium mb-2">What This May Mean</p>
              <p className="text-sm text-slate-600 leading-relaxed">{result.interpretation}</p>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              This estimate is based on official federal guidelines and is not a determination of
              eligibility or a guarantee of benefits. Actual costs depend on age, ZIP code, plan
              selection, and availability in your area. For official determination, apply through
              Healthcare.gov or your state marketplace.
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Resources</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="/aca-income-guide-2026" className="text-primary-600 hover:text-primary-700 underline">Health Insurance Savings by Income Level</a></li>
          <li><a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">2026 FPL Guidelines</a></li>
          <li><a href="/csr-explained-2026" className="text-primary-600 hover:text-primary-700 underline">Cost-Sharing Reductions Explained</a></li>
          <li><a href="/eligibility-check" className="text-primary-600 hover:text-primary-700 underline">Check Your Full Eligibility</a></li>
        </ul>
      </div>

    </div>
  )
}
