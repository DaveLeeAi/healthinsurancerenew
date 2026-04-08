'use client'

import { useState } from 'react'
import type { ScoringResult, PlanResult } from '@/lib/iowa-mvp/types'

interface CountyOption {
  fips: string
  name: string
}

interface Props {
  counties: CountyOption[]
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  county_fips: string
  age: string
  household_size: string
  annual_income: string
  is_smoker: boolean
  medications: string
  expected_usage: 'low' | 'moderate' | 'high'
  budget_preference: 'lowest_premium' | 'balanced' | 'lowest_risk'
  plan_type_preference: 'no_preference' | 'HMO' | 'PPO' | 'EPO'
  risk_tolerance: 'low' | 'moderate' | 'high'
  notes: string
}

const INITIAL_FORM: FormState = {
  county_fips: '',
  age: '',
  household_size: '1',
  annual_income: '',
  is_smoker: false,
  medications: '',
  expected_usage: 'moderate',
  budget_preference: 'balanced',
  plan_type_preference: 'no_preference',
  risk_tolerance: 'moderate',
  notes: '',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IowaCompareClient({ counties }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [result, setResult] = useState<ScoringResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const medications = form.medications
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)

      const payload = {
        county_fips: form.county_fips,
        age: parseInt(form.age, 10),
        household_size: parseInt(form.household_size, 10),
        annual_income: parseFloat(form.annual_income),
        is_smoker: form.is_smoker,
        medications,
        expected_usage: form.expected_usage,
        budget_preference: form.budget_preference,
        plan_type_preference: form.plan_type_preference,
        risk_tolerance: form.risk_tolerance,
        notes: form.notes,
      }

      const res = await fetch('/api/iowa-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setResult(data as ScoringResult)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-1">Your Information</h2>
        <p className="text-sm text-slate-500 mb-6">
          All fields help personalize your results. Only lawful rating factors (age, location, tobacco) are used.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* County */}
          <div>
            <label htmlFor="county" className="block text-sm font-medium text-slate-700 mb-1">Iowa County</label>
            <select
              id="county"
              required
              value={form.county_fips}
              onChange={(e) => updateField('county_fips', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select your county</option>
              {counties.map((c) => (
                <option key={c.fips} value={c.fips}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-1">Age</label>
            <input
              id="age"
              type="number"
              required
              min={18}
              max={64}
              placeholder="18–64"
              value={form.age}
              onChange={(e) => updateField('age', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Household Size */}
          <div>
            <label htmlFor="household" className="block text-sm font-medium text-slate-700 mb-1">Household Size</label>
            <select
              id="household"
              value={form.household_size}
              onChange={(e) => updateField('household_size', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
          </div>

          {/* Annual Income */}
          <div>
            <label htmlFor="income" className="block text-sm font-medium text-slate-700 mb-1">Estimated Annual Income ($)</label>
            <input
              id="income"
              type="number"
              required
              min={0}
              max={1000000}
              placeholder="e.g. 45000"
              value={form.annual_income}
              onChange={(e) => updateField('annual_income', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Modified Adjusted Gross Income (MAGI)</p>
          </div>

          {/* Expected Usage */}
          <div>
            <label htmlFor="usage" className="block text-sm font-medium text-slate-700 mb-1">Expected Healthcare Usage</label>
            <select
              id="usage"
              value={form.expected_usage}
              onChange={(e) => updateField('expected_usage', e.target.value as FormState['expected_usage'])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low — mostly preventive care</option>
              <option value="moderate">Moderate — a few doctor visits per year</option>
              <option value="high">High — regular care, specialists, or ongoing treatment</option>
            </select>
          </div>

          {/* Budget Preference */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-slate-700 mb-1">Budget Preference</label>
            <select
              id="budget"
              value={form.budget_preference}
              onChange={(e) => updateField('budget_preference', e.target.value as FormState['budget_preference'])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="lowest_premium">Lowest monthly premium</option>
              <option value="balanced">Balanced — premium vs. out-of-pocket</option>
              <option value="lowest_risk">Lowest out-of-pocket risk</option>
            </select>
          </div>

          {/* Plan Type Preference */}
          <div>
            <label htmlFor="plantype" className="block text-sm font-medium text-slate-700 mb-1">Plan Type Preference</label>
            <select
              id="plantype"
              value={form.plan_type_preference}
              onChange={(e) => updateField('plan_type_preference', e.target.value as FormState['plan_type_preference'])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="no_preference">No preference</option>
              <option value="HMO">HMO</option>
              <option value="PPO">PPO</option>
              <option value="EPO">EPO</option>
            </select>
          </div>

          {/* Risk Tolerance */}
          <div>
            <label htmlFor="risk" className="block text-sm font-medium text-slate-700 mb-1">Risk Tolerance</label>
            <select
              id="risk"
              value={form.risk_tolerance}
              onChange={(e) => updateField('risk_tolerance', e.target.value as FormState['risk_tolerance'])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low — I want predictable costs</option>
              <option value="moderate">Moderate — some trade-off is OK</option>
              <option value="high">High — I can handle unexpected costs</option>
            </select>
          </div>
        </div>

        {/* Medications */}
        <div className="mt-5">
          <label htmlFor="meds" className="block text-sm font-medium text-slate-700 mb-1">
            Current Medications <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="meds"
            type="text"
            placeholder="e.g. metformin, lisinopril, atorvastatin"
            value={form.medications}
            onChange={(e) => updateField('medications', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Separate with commas. Drug coverage can only be verified for Oscar plans. Up to 10 medications.
          </p>
        </div>

        {/* Smoker */}
        <div className="mt-4 flex items-center gap-2">
          <input
            id="smoker"
            type="checkbox"
            checked={form.is_smoker}
            onChange={(e) => updateField('is_smoker', e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="smoker" className="text-sm text-slate-700">Tobacco user</label>
        </div>

        {/* Notes */}
        <div className="mt-5">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
            Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            maxLength={500}
            placeholder="e.g. I want to keep my current doctor, I need a plan with low ER copays"
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Provider preferences are noted but cannot be verified — this tool does not include provider directory data.
          </p>
        </div>

        {/* Submit */}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Comparing Plans...' : 'Compare Plans'}
          </button>
          {loading && (
            <span className="text-sm text-slate-500">Scoring plans against your profile...</span>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && <ResultsDisplay result={result} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results display
// ---------------------------------------------------------------------------

function ResultsDisplay({ result }: { result: ScoringResult }) {
  if (result.status === 'no_plans') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">No Plans Found</h2>
        <p className="text-sm text-slate-600">
          No marketplace plans were found for {result.county_name} County, Iowa in our data.
          This may be a data gap. Check{' '}
          <a href="https://www.healthcare.gov" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
            HealthCare.gov
          </a>{' '}
          for current plan availability.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Summary header */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">
          Top Matching Plans for {result.county_name} County, Iowa
        </h2>
        <p className="text-sm text-slate-600">
          {result.top_plans.length} plans shown based on your profile
          (age {result.input_summary.age}, ${result.input_summary.income.toLocaleString()} income,
          {result.input_summary.expected_usage} usage).
          {result.input_summary.medications_checked > 0 &&
            ` ${result.input_summary.medications_checked} medication(s) checked.`}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Plan year: {result.plan_year} | {result.snapshot_note}
        </p>
      </div>

      {/* Plan cards */}
      {result.top_plans.map((plan, i) => (
        <PlanCard key={plan.plan_id} plan={plan} rank={i + 1} />
      ))}

      {/* Data limitations */}
      {result.data_limitations.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Data Limitations</h3>
          <ul className="text-xs text-slate-600 space-y-1">
            {result.data_limitations.map((lim, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-400 shrink-0">•</span>
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimers */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">Important Disclaimers</h3>
        <div className="space-y-2">
          {result.disclaimers.map((d, i) => (
            <p key={i} className="text-xs text-amber-800 leading-relaxed">{d}</p>
          ))}
        </div>
      </div>

      {/* Safe CTAs */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Next Steps</h3>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://www.healthcare.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Verify on HealthCare.gov
          </a>
          <a
            href="/contact"
            className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            Talk to a Licensed Agent
          </a>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Always confirm premiums, provider networks, and drug coverage before enrolling.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual plan card
// ---------------------------------------------------------------------------

function PlanCard({ plan, rank }: { plan: PlanResult; rank: number }) {
  const [expanded, setExpanded] = useState(false)

  const metalColor: Record<string, string> = {
    'Gold': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Silver': 'bg-slate-100 text-slate-700 border-slate-300',
    'Expanded Bronze': 'bg-amber-100 text-amber-800 border-amber-300',
    'Bronze': 'bg-amber-100 text-amber-800 border-amber-300',
    'Catastrophic': 'bg-gray-100 text-gray-700 border-gray-300',
  }

  const scoreColor = plan.overall_score >= 75
    ? 'text-green-700 bg-green-50 border-green-200'
    : plan.overall_score >= 55
      ? 'text-blue-700 bg-blue-50 border-blue-200'
      : 'text-slate-600 bg-slate-50 border-slate-200'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
      {/* Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-400">#{rank}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${metalColor[plan.metal_level] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {plan.metal_level}
            </span>
            <span className="text-xs text-slate-400">{plan.plan_type}</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 truncate">{plan.plan_name}</h3>
          <p className="text-sm text-slate-500">{plan.issuer_name}</p>
        </div>

        <div className={`shrink-0 px-4 py-2 rounded-xl border text-center ${scoreColor}`}>
          <div className="text-2xl font-bold">{plan.overall_score}</div>
          <div className="text-xs font-medium">Fit Score</div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricBox
          label="Est. Monthly Premium"
          value={plan.estimated_net_monthly_premium != null ? `$${plan.estimated_net_monthly_premium}` : '—'}
          sublabel={plan.estimated_monthly_aptc && plan.estimated_monthly_aptc > 0 ? `$${plan.estimated_monthly_aptc}/mo credit` : undefined}
        />
        <MetricBox
          label="Deductible"
          value={plan.deductible_individual != null ? `$${plan.deductible_individual.toLocaleString()}` : '—'}
        />
        <MetricBox
          label="Max Out-of-Pocket"
          value={plan.oop_max_individual != null ? `$${plan.oop_max_individual.toLocaleString()}` : '—'}
        />
        <MetricBox
          label="Full Premium"
          value={plan.monthly_premium_before_subsidy != null ? `$${plan.monthly_premium_before_subsidy}` : '—'}
          sublabel="before tax credit"
        />
      </div>

      {/* Risk flags */}
      {plan.risk_flags.length > 0 && (
        <div className="px-5 pb-3">
          {plan.risk_flags.map((flag, i) => (
            <div
              key={i}
              className={`text-xs rounded-lg px-3 py-2 mb-1.5 ${
                flag.severity === 'critical' ? 'bg-red-50 text-red-800 border border-red-200' :
                flag.severity === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {flag.severity === 'warning' && '⚠ '}
              {flag.severity === 'critical' && '⛔ '}
              {flag.message}
            </div>
          ))}
        </div>
      )}

      {/* Expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-100 flex items-center justify-center gap-1"
      >
        {expanded ? 'Show less' : 'See details, trade-offs & verification checklist'}
        <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-5">
          {/* Why it may fit */}
          {plan.why_it_may_fit.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Why This Plan May Fit</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                {plan.why_it_may_fit.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-green-500 shrink-0">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trade-offs */}
          {plan.main_tradeoffs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Trade-Offs to Consider</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                {plan.main_tradeoffs.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500 shrink-0">△</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Score breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Score Breakdown</h4>
            <div className="space-y-2">
              {plan.dimensions.map((dim) => (
                <div key={dim.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-40 shrink-0">{dim.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dim.score >= 75 ? 'bg-green-500' : dim.score >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-8 text-right">{dim.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Drug matches */}
          {plan.drug_matches.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Drug Coverage Check</h4>
              <div className="space-y-1.5">
                {plan.drug_matches.map((dm) => (
                  <div key={dm.drug_name} className={`text-xs rounded-lg px-3 py-2 ${
                    dm.found ? 'bg-green-50 text-green-800 border border-green-200' :
                    dm.carrier_verified ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}>
                    <span className="font-medium">{dm.drug_name}</span>
                    {dm.found && dm.tier && <span className="ml-2">Tier {dm.tier}</span>}
                    {!dm.carrier_verified && <span className="ml-2 italic">Not verified for this carrier</span>}
                    {dm.notes && <span className="block mt-0.5 text-xs opacity-80">{dm.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification checklist */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Verify Before You Enroll</h4>
            <ul className="text-sm text-slate-600 space-y-1.5">
              {plan.verification_checklist.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-slate-400 shrink-0">☐</span>
                  <span>
                    <span className="font-medium text-slate-700">{item.category}:</span>{' '}
                    {item.action}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metric box helper
// ---------------------------------------------------------------------------

function MetricBox({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
      {sublabel && <div className="text-xs text-slate-400">{sublabel}</div>}
    </div>
  )
}
