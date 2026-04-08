'use client'

import { useState } from 'react'
import Breadcrumbs from '../../../components/Breadcrumbs'
import AeoBlock from '../../../components/AeoBlock'
import SourcesBox from '../../../components/SourcesBox'

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'What Income Counts?', url: '/tools/what-income-counts' },
]

function fmt(n: number) {
  return '$' + n.toLocaleString()
}

export default function WhatIncomeCountsPage() {
  const [agi, setAgi] = useState('')
  const [taxExemptInterest, setTaxExemptInterest] = useState('')
  const [foreignIncome, setForeignIncome] = useState('')
  const [ssBenefits, setSsBenefits] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    agi: number
    interest: number
    foreign: number
    ss: number
    magi: number
    contextText: string
  } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!agi) {
      setError('Please enter your Adjusted Gross Income (AGI).')
      return
    }

    const agiVal = parseFloat(agi) || 0
    const interestVal = parseFloat(taxExemptInterest) || 0
    const foreignVal = parseFloat(foreignIncome) || 0
    const ssVal = parseFloat(ssBenefits) || 0
    const magi = agiVal + interestVal + foreignVal + ssVal
    const addBacks = interestVal + foreignVal + ssVal

    let contextText = ''
    if (addBacks > 0) {
      contextText =
        `Your estimated MAGI of ${fmt(magi)} includes ${fmt(addBacks)} in add-back items beyond your AGI. ` +
        'These add-backs are types of income that are not included in AGI on a standard tax return but are counted for subsidy eligibility purposes. '
    } else {
      contextText =
        `Your estimated MAGI of ${fmt(magi)} is the same as your AGI because no add-back items were entered. ` +
        'For many households, MAGI and AGI are the same amount. '
    }
    contextText +=
      'The ACA uses MAGI to determine eligibility for premium tax credits and cost-sharing reductions. ' +
      'Generally, MAGI between 100% and 400% of the Federal Poverty Level may qualify for premium tax credits. ' +
      'For 2026, the enhanced subsidies that were available from 2021 through 2025 have expired, so the subsidy cliff at 400% FPL has returned.'

    setResult({ agi: agiVal, interest: interestVal, foreign: foreignVal, ss: ssVal, magi, contextText })
  }

  function handleReset() {
    setAgi('')
    setTaxExemptInterest('')
    setForeignIncome('')
    setSsBenefits('')
    setError('')
    setResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        What Income Counts for Health Insurance Subsidies?
      </h1>

      <AeoBlock answer="The marketplace uses a specific income number called MAGI to decide your savings. Enter your income details below to see what yours might be." caveat="This is an estimate for planning purposes. Verify with your plan or a licensed agent." />

      <div className="bg-white/70 border border-slate-200/80 rounded-2xl p-4 mb-6">
        <p className="text-sm text-slate-600 leading-relaxed">
          This website is not affiliated with any federal or state government agency. Information
          provided here is for educational purposes only.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">MAGI Estimator</h2>
        <p className="text-sm text-slate-600 mb-5">
          MAGI (Modified Adjusted Gross Income) for ACA purposes includes Adjusted Gross Income
          plus certain add-back items. Enter your income sources below to calculate your estimated
          MAGI.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="agi" className="block text-sm font-medium text-slate-700 mb-1">
              Adjusted Gross Income (AGI) ($)
            </label>
            <input
              type="number"
              id="agi"
              value={agi}
              onChange={(e) => setAgi(e.target.value)}
              placeholder="e.g. 50000"
              min="0"
              step="100"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Found on IRS Form 1040, line 11. Includes wages, salary, self-employment income,
              retirement distributions, investment income, and other taxable income minus
              above-the-line deductions.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <p className="text-sm font-medium text-slate-800 mb-3">Add-Back Items (if applicable)</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="tax-exempt-interest" className="block text-sm font-medium text-slate-700 mb-1">
                  Tax-Exempt Interest Income ($)
                </label>
                <input
                  type="number"
                  id="tax-exempt-interest"
                  value={taxExemptInterest}
                  onChange={(e) => setTaxExemptInterest(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Interest from municipal bonds or other tax-exempt sources (Form 1040, line 2a).
                </p>
              </div>
              <div>
                <label htmlFor="foreign-income" className="block text-sm font-medium text-slate-700 mb-1">
                  Excluded Foreign Earned Income ($)
                </label>
                <input
                  type="number"
                  id="foreign-income"
                  value={foreignIncome}
                  onChange={(e) => setForeignIncome(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Income excluded under the Foreign Earned Income Exclusion (Form 2555).
                </p>
              </div>
              <div>
                <label htmlFor="ss-benefits" className="block text-sm font-medium text-slate-700 mb-1">
                  Non-Taxable Social Security Benefits ($)
                </label>
                <input
                  type="number"
                  id="ss-benefits"
                  value={ssBenefits}
                  onChange={(e) => setSsBenefits(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  The non-taxable portion of Social Security benefits. Total benefits (Form
                  SSA-1099) minus the taxable amount on Form 1040.
                </p>
              </div>
            </div>
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
              Estimate MAGI
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

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Adjusted Gross Income (AGI)</span>
                <span className="text-sm font-semibold text-slate-800">{fmt(result.agi)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">+ Tax-Exempt Interest</span>
                <span className="text-sm font-semibold text-slate-800">{fmt(result.interest)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">+ Excluded Foreign Income</span>
                <span className="text-sm font-semibold text-slate-800">{fmt(result.foreign)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">+ Non-Taxable Social Security</span>
                <span className="text-sm font-semibold text-slate-800">{fmt(result.ss)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-primary-50 rounded-xl px-3">
                <span className="text-sm font-semibold text-primary-700">Estimated MAGI</span>
                <span className="text-xl font-bold text-primary-900">{fmt(result.magi)}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-700 font-medium mb-2">What This Means for Subsidy Eligibility</p>
              <p className="text-sm text-slate-600 leading-relaxed">{result.contextText}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Important:</strong> This tool provides an estimate based on standard MAGI
                calculations. Tax situations vary, and this is not tax advice. For your actual
                MAGI, consult a tax professional or refer to your IRS guidance.
              </p>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              This estimate is for educational purposes only. The Health Insurance Marketplace
              uses verified tax information to determine actual MAGI for subsidy eligibility.
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Resources</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">Estimate Your Savings</a></li>
          <li><a href="/eligibility-check" className="text-primary-600 hover:text-primary-700 underline">Full Eligibility Check</a></li>
          <li><a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">2026 FPL Guidelines</a></li>
        </ul>
      </div>

      <SourcesBox sources={[
        { title: 'Healthcare.gov - Income and Household Information', url: 'https://www.healthcare.gov/income-and-household-information/income/' },
        { title: 'IRS - Modified Adjusted Gross Income (MAGI)', url: 'https://www.irs.gov/e-file-providers/definition-of-adjusted-gross-income' },
        { title: 'IRS - Premium Tax Credit Eligibility', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
      ]} />
    </div>
  )
}
