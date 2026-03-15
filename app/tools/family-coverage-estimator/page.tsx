'use client'

import { useState } from 'react'
import Breadcrumbs from '../../../components/Breadcrumbs'
import AnswerBox from '../../../components/AnswerBox'
import SourcesBox from '../../../components/SourcesBox'
import fplData from '../../../data/astro/fpl-current.json'
import contributionData from '../../../data/astro/contribution-scale.json'

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: "Estimate Your Family's Costs", url: '/tools/family-coverage-estimator' },
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

// Rough actuarial value multipliers relative to Silver
const tierMultipliers = [
  { name: 'Bronze', premium: 0.78, coverage: '~60%', desc: 'Lowest premiums, highest out-of-pocket' },
  { name: 'Silver', premium: 1.0, coverage: '~70%', desc: 'Baseline; required for CSR savings' },
  { name: 'Gold', premium: 1.18, coverage: '~80%', desc: 'Higher premium, lower OOP' },
  { name: 'Platinum', premium: 1.32, coverage: '~90%', desc: 'Highest premium, lowest OOP' },
]

export default function FamilyCoverageEstimatorPage() {
  const [householdSize, setHouseholdSize] = useState('')
  const [annualIncome, setAnnualIncome] = useState('')
  const [silverBenchmark, setSilverBenchmark] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    fplPercent: number
    band: Band
    annualIncome: number
    silverMonthly: number
  } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!householdSize || !annualIncome || !silverBenchmark) {
      setError('Please complete all fields before calculating.')
      return
    }

    const size = parseInt(householdSize, 10)
    const income = parseFloat(annualIncome)
    const silver = parseFloat(silverBenchmark)

    if (income <= 0 || silver <= 0) {
      setError('Please enter valid amounts greater than zero.')
      return
    }

    const fpl = getFPL(size)
    const fplPercent = (income / fpl) * 100
    const band = findBand(fplPercent)

    setResult({ fplPercent, band, annualIncome: income, silverMonthly: silver })
  }

  function handleReset() {
    setHouseholdSize('')
    setAnnualIncome('')
    setSilverBenchmark('')
    setError('')
    setResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Estimate Your Family&apos;s Health Insurance Costs
      </h1>

      <AnswerBox answer="Enter your household size, income, and the benchmark Silver plan premium in your area to estimate what you might pay across different plan tiers." />

      <div className="bg-white/70 border border-slate-200/80 rounded-2xl p-4 mb-6">
        <p className="text-sm text-slate-600 leading-relaxed">
          This website is not affiliated with any federal or state government agency. Information
          provided here is for educational purposes only.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Family Coverage Estimator</h2>
        <p className="text-sm text-slate-600 mb-5">
          Enter your information to see estimated monthly premium costs across all four plan tiers,
          after accounting for any premium tax credit you might receive.
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
              placeholder="e.g. 60000"
              min="0"
              step="100"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="silver-benchmark" className="block text-sm font-medium text-slate-700 mb-1">
              Benchmark Silver Plan Monthly Premium ($)
            </label>
            <input
              type="number"
              id="silver-benchmark"
              value={silverBenchmark}
              onChange={(e) => setSilverBenchmark(e.target.value)}
              placeholder="e.g. 450"
              min="0"
              step="1"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              The second-lowest-cost Silver plan premium for your household size and location.
              Check Healthcare.gov or your state exchange for this amount.
            </p>
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
              Estimate Costs
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

        {result && (() => {
          const expectedContribMonthly =
            result.band.minPercent === 0 && result.band.maxPercent === 0
              ? 0
              : Math.round(((result.band.minPercent + result.band.maxPercent) / 2 / 100) * result.annualIncome / 12)
          const taxCredit = Math.max(0, result.silverMonthly - expectedContribMonthly)

          return (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Educational Estimate</h3>
              <p className="text-sm text-slate-600 mb-4">
                Your income is approximately{' '}
                <strong>{result.fplPercent.toFixed(0)}% of the Federal Poverty Level</strong>.
                Estimated monthly premium tax credit:{' '}
                <strong>${taxCredit.toLocaleString()}</strong>
              </p>

              <div className="space-y-3 mb-4">
                {tierMultipliers.map((tier) => {
                  const fullPremium = Math.round(result.silverMonthly * tier.premium)
                  const netPremium = Math.max(0, fullPremium - taxCredit)
                  return (
                    <div key={tier.name} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800">{tier.name} Plan</span>
                        <span className="text-sm text-slate-500">{tier.coverage} AV</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">Full premium</span>
                        <span className="text-slate-700">${fullPremium.toLocaleString()}/mo</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="text-primary-700">Est. after tax credit</span>
                        <span className="text-primary-700 text-lg">${netPremium.toLocaleString()}/mo</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{tier.desc}</p>
                    </div>
                  )
                })}
              </div>

              <p className="text-xs text-slate-500 mt-4">
                These are rough estimates only. Actual premiums vary by age, ZIP code, tobacco
                status, and the specific plans available in your area. Tier premiums are estimated
                using national average relativities. For accurate numbers, apply through
                Healthcare.gov.
              </p>
            </div>
          )
        })()}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Resources</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="/tools/plan-comparison" className="text-primary-600 hover:text-primary-700 underline">Compare Plan Levels</a></li>
          <li><a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">Estimate Your Premium Savings</a></li>
          <li><a href="/tools/csr-estimator" className="text-primary-600 hover:text-primary-700 underline">Check for Extra Silver Plan Savings</a></li>
        </ul>
      </div>

      <SourcesBox sources={[
        { title: 'Healthcare.gov - Premium Tax Credit', url: 'https://www.healthcare.gov/lower-costs/' },
        { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
      ]} />
    </div>
  )
}
