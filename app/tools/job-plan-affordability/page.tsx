'use client'

import { useState } from 'react'
import Breadcrumbs from '../../../components/Breadcrumbs'
import AnswerBox from '../../../components/AnswerBox'
import SourcesBox from '../../../components/SourcesBox'
import affordabilityData from '../../../data/astro/affordability-threshold.json'

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'Does My Employer Plan Count?', url: '/tools/job-plan-affordability' },
]

const THRESHOLD = affordabilityData.thresholdPercent

export default function JobPlanAffordabilityPage() {
  const [income, setIncome] = useState('')
  const [monthlyPremium, setMonthlyPremium] = useState('')
  const [plansMinimumValue, setPlansMinimumValue] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    annualPremium: number
    maxAffordable: number
    isAffordable: boolean
    lacksMinValue: boolean
  } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!income || !monthlyPremium || !plansMinimumValue) {
      setError('Please complete all fields before calculating.')
      return
    }

    const annualIncome = parseFloat(income)
    const annualPremium = parseFloat(monthlyPremium) * 12
    const maxAffordable = (THRESHOLD / 100) * annualIncome
    const isAffordable = annualPremium <= maxAffordable
    const lacksMinValue = plansMinimumValue === 'no'

    setResult({ annualPremium, maxAffordable, isAffordable, lacksMinValue })
  }

  function handleReset() {
    setIncome('')
    setMonthlyPremium('')
    setPlansMinimumValue('')
    setError('')
    setResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Does My Employer Plan Count? Affordability Check
      </h1>

      <AnswerBox answer="Enter your income and your employer's health insurance premium to determine if it meets ACA affordability standards and whether you may qualify for marketplace savings." />

      <div className="bg-white/70 border border-slate-200/80 rounded-2xl p-4 mb-6">
        <p className="text-sm text-slate-600 leading-relaxed">
          This website is not affiliated with any federal or state government agency. Information
          provided here is for educational purposes only.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Employer Plan Affordability Check
        </h2>
        <p className="text-sm text-slate-600 mb-5">
          The ACA affordability threshold for {affordabilityData.year} is{' '}
          <strong>{THRESHOLD}%</strong> of household income for employee-only coverage.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="household-income" className="block text-sm font-medium text-slate-700 mb-1">
              Annual Household Income ($)
            </label>
            <input
              type="number"
              id="household-income"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 55000"
              min="0"
              step="100"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="monthly-premium" className="block text-sm font-medium text-slate-700 mb-1">
              Employee-Only Monthly Premium ($)
            </label>
            <input
              type="number"
              id="monthly-premium"
              value={monthlyPremium}
              onChange={(e) => setMonthlyPremium(e.target.value)}
              placeholder="e.g. 200"
              min="0"
              step="1"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter only the employee's share of the premium for employee-only coverage (not
              family coverage).
            </p>
          </div>

          <div>
            <label htmlFor="min-value" className="block text-sm font-medium text-slate-700 mb-1">
              Does your employer plan meet Minimum Value?
            </label>
            <select
              id="min-value"
              value={plansMinimumValue}
              onChange={(e) => setPlansMinimumValue(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Select an option</option>
              <option value="yes">Yes — covers at least 60% of costs</option>
              <option value="no">No — covers less than 60% of costs</option>
              <option value="unknown">I do not know</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Minimum value means the plan pays at least 60% of covered medical costs on average.
              Most employer plans meet this standard. Check your plan documents or ask HR.
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
              Check Affordability
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
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 font-medium">Your Annual Premium</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  ${result.annualPremium.toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 font-medium">Affordability Threshold ({THRESHOLD}%)</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  ${result.maxAffordable.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {result.lacksMinValue ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-green-800 mb-1">
                  Plan Lacks Minimum Value — You May Qualify for Marketplace Savings
                </p>
                <p className="text-sm text-green-700 leading-relaxed">
                  Because your employer plan does not appear to cover at least 60% of medical
                  costs, it does not meet the ACA minimum value standard. This means you may be
                  eligible for marketplace premium tax credits, even if the premium cost would
                  otherwise be considered affordable.
                </p>
              </div>
            ) : result.isAffordable ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Plan Appears Affordable — Marketplace Subsidies May Not Apply
                </p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Your employer plan cost (${result.annualPremium.toLocaleString()}/yr) is below
                  the {THRESHOLD}% affordability threshold ($
                  {result.maxAffordable.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr).
                  Under ACA rules, if you have access to an affordable employer plan that meets
                  minimum value, you generally cannot receive marketplace premium tax credits.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-green-800 mb-1">
                  Plan May Be Unaffordable — You May Qualify for Marketplace Savings
                </p>
                <p className="text-sm text-green-700 leading-relaxed">
                  Your employer plan cost (${result.annualPremium.toLocaleString()}/yr) exceeds the{' '}
                  {THRESHOLD}% affordability threshold ($
                  {result.maxAffordable.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr).
                  This may mean the plan is considered unaffordable under ACA rules, which could
                  allow you to seek marketplace coverage with premium tax credits instead.
                </p>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-4">
              This is an educational estimate only. Official affordability determinations are made
              by the marketplace when you apply. Tax situations vary. Consult a licensed health
              insurance agent or tax professional for guidance specific to your situation.
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Resources</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="/employer-coverage-unaffordable-2026" className="text-primary-600 hover:text-primary-700 underline">Employer Coverage Is Unaffordable: What Now?</a></li>
          <li><a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">Estimate Your Marketplace Savings</a></li>
          <li><a href="/eligibility-check" className="text-primary-600 hover:text-primary-700 underline">Full Eligibility Check</a></li>
        </ul>
      </div>

      <SourcesBox sources={[
        { title: 'IRS - Employer Health Plan Affordability', url: 'https://www.irs.gov/affordable-care-act/employers/employer-shared-responsibility-provisions' },
        { title: 'Healthcare.gov - Employer Coverage and ACA', url: 'https://www.healthcare.gov/have-job-based-coverage/' },
      ]} />
    </div>
  )
}
