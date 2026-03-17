'use client'

import { useState } from 'react'
import Breadcrumbs from '../../../components/Breadcrumbs'
import AnswerBox from '../../../components/AnswerBox'
import SourcesBox from '../../../components/SourcesBox'
import fplData from '../../../data/config/fpl-current.json'
import csrData from '../../../data/config/csr-tiers.json'

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'Extra Savings on Silver Plans', url: '/tools/csr-estimator' },
]

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

function fmt(n: number) {
  return '$' + n.toLocaleString()
}

interface CsrTier {
  name: string
  actuarialValue: number
  minFPL: number
  maxFPL: number
  deductible: number
  oopMax: number
  copayPrimary: number
  copayGenericRx: number
  description: string
}

export default function CsrEstimatorPage() {
  const [householdSize, setHouseholdSize] = useState('')
  const [annualIncome, setAnnualIncome] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    fpl: number
    fplPercent: number
    tier: CsrTier | null
    qualifies: boolean
  } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!householdSize || !annualIncome) {
      setError('Please complete all fields before calculating.')
      return
    }

    const size = parseInt(householdSize, 10)
    const income = parseFloat(annualIncome)

    if (income <= 0) {
      setError('Please enter a valid income amount.')
      return
    }

    const fpl = getFPL(size)
    const fplPercent = (income / fpl) * 100

    const tiers = csrData.tiers as CsrTier[]
    const tier = tiers.find((t) => fplPercent >= t.minFPL && fplPercent < t.maxFPL) ?? tiers[tiers.length - 1]
    const qualifies = fplPercent >= 100 && fplPercent < 250

    setResult({ fpl, fplPercent, tier: qualifies ? tier : null, qualifies })
  }

  function handleReset() {
    setHouseholdSize('')
    setAnnualIncome('')
    setError('')
    setResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Check for Extra Savings on Silver Plans (CSR Estimator)
      </h1>

      <AnswerBox answer="Enter your household size and income to see if you might qualify for extra savings on a Silver plan — lower copays, smaller deductibles, and a lower cap on what you pay out of pocket." />

      <div className="bg-white/70 border border-slate-200/80 rounded-2xl p-4 mb-6">
        <p className="text-sm text-slate-600 leading-relaxed">
          This website is not affiliated with any federal or state government agency. Information
          provided here is for educational purposes only.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Cost-Sharing Reduction Estimator
        </h2>
        <p className="text-sm text-slate-600 mb-5">
          CSRs are available only on Silver plans and reduce deductibles, copays, and out-of-pocket
          maximums for households with income between 100% and 250% of the Federal Poverty Level.
        </p>

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
              placeholder="e.g. 35000"
              min="0"
              step="100"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
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
              Estimate CSR Eligibility
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
                <p className="text-xl font-bold text-primary-900 mt-1">{fmt(result.fpl)}</p>
              </div>
              <div className="bg-primary-50 rounded-xl p-4">
                <p className="text-sm text-primary-700 font-medium">Your Income as % of FPL</p>
                <p className="text-xl font-bold text-primary-900 mt-1">
                  {result.fplPercent.toFixed(0)}%
                </p>
              </div>
            </div>

            {result.qualifies && result.tier ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  You May Qualify for {result.tier.name} ({result.tier.actuarialValue}% CSR)
                </p>
                <p className="text-sm text-green-700 leading-relaxed mb-4">{result.tier.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
                  <div className="bg-white/80 rounded-xl p-3">
                    <div className="font-bold text-slate-900">{fmt(result.tier.deductible)}</div>
                    <div className="text-slate-500 text-xs">Deductible</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3">
                    <div className="font-bold text-slate-900">{fmt(result.tier.oopMax)}</div>
                    <div className="text-slate-500 text-xs">OOP Max</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3">
                    <div className="font-bold text-slate-900">${result.tier.copayPrimary}</div>
                    <div className="text-slate-500 text-xs">Primary Copay</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3">
                    <div className="font-bold text-slate-900">${result.tier.copayGenericRx}</div>
                    <div className="text-slate-500 text-xs">Generic Rx</div>
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-3">
                  To receive these savings, you must enroll in a Silver plan through the
                  marketplace. CSRs are not available on Bronze, Gold, or Platinum plans.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
                <p className="text-sm font-semibold text-slate-800 mb-2">
                  {result.fplPercent < 100
                    ? 'Income Below 100% FPL — May Qualify for Medicaid'
                    : 'Income Above 250% FPL — No CSR Available'}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {result.fplPercent < 100
                    ? 'At this income level, you may qualify for Medicaid rather than marketplace coverage. In states that have expanded Medicaid, adults with income below 138% FPL generally qualify. Cost-sharing reductions are not applicable for Medicaid.'
                    : 'Cost-sharing reductions are only available for households with income between 100% and 250% of the Federal Poverty Level. At income above 250% FPL, you may still qualify for a premium tax credit, but the standard Silver plan cost-sharing applies.'}
                </p>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-4">
              CSR eligibility is based on household income and enrollment in a Silver marketplace
              plan. Actual plan values vary by insurer and location. These are national average
              estimates.
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Resources</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="/csr-explained-2026" className="text-primary-600 hover:text-primary-700 underline">Cost-Sharing Reductions Explained</a></li>
          <li><a href="/aca-income-guide-2026" className="text-primary-600 hover:text-primary-700 underline">Health Insurance Savings by Income Level</a></li>
          <li><a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">Estimate Your Premium Savings</a></li>
        </ul>
      </div>

      <SourcesBox sources={[
        { title: 'Healthcare.gov - Cost-Sharing Reductions', url: 'https://www.healthcare.gov/lower-costs/save-on-out-of-pocket-costs/' },
        { title: 'CMS - Actuarial Value', url: 'https://www.cms.gov/cciio/programs-and-initiatives/health-insurance-market-reforms/minimum-essential-coverage' },
        { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
      ]} />
    </div>
  )
}
