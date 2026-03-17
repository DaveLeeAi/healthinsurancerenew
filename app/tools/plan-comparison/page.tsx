'use client'

import { useState } from 'react'
import Breadcrumbs from '../../../components/Breadcrumbs'
import AnswerBox from '../../../components/AnswerBox'
import SourcesBox from '../../../components/SourcesBox'
import metalTiers from '../../../data/config/metal-tiers.json'

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'Compare Plan Levels', url: '/tools/plan-comparison' },
]

type UsageLevel = 'low' | 'moderate' | 'high'

const tierColors: Record<string, { bg: string; border: string; accent: string; ring: string }> = {
  bronze: { bg: 'bg-amber-50', border: 'border-amber-300', accent: 'text-amber-700', ring: 'ring-amber-400' },
  silver: { bg: 'bg-slate-50', border: 'border-slate-300', accent: 'text-slate-700', ring: 'ring-slate-400' },
  gold: { bg: 'bg-yellow-50', border: 'border-yellow-400', accent: 'text-yellow-700', ring: 'ring-yellow-400' },
  platinum: { bg: 'bg-indigo-50', border: 'border-indigo-300', accent: 'text-indigo-700', ring: 'ring-indigo-400' },
}

const usageToTier: Record<UsageLevel, string> = {
  low: 'bronze',
  moderate: 'silver',
  high: 'gold',
}

const recommendations: Record<UsageLevel, string> = {
  low: 'Based on low expected healthcare usage, a Bronze plan may be a reasonable starting point. Bronze plans typically have the lowest monthly premiums, which can be appealing for generally healthy individuals who mainly want coverage for unexpected medical events. Keep in mind that out-of-pocket costs are higher when care is needed.',
  moderate:
    'Based on moderate expected healthcare usage, a Silver plan may be a reasonable starting point. Silver plans offer a balance between monthly premiums and out-of-pocket costs. An important consideration: cost-sharing reductions (CSRs) are available only with Silver plans for eligible lower-income households, which can significantly reduce deductibles and copays.',
  high: 'Based on high expected healthcare usage, a Gold plan may be a reasonable starting point. Gold plans generally have higher monthly premiums but lower costs when receiving care, which can be beneficial for individuals with frequent healthcare needs. For very high usage, a Platinum plan may also be worth considering despite its higher premiums.',
}

export default function PlanComparisonPage() {
  const [selectedUsage, setSelectedUsage] = useState<UsageLevel | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Compare Plan Levels: Bronze, Silver, Gold, Platinum
      </h1>

      <AnswerBox answer="Health plans come in four levels: Bronze, Silver, Gold, and Platinum. Pick how often you use health care to see which level might be the best fit for you." />

      <div className="bg-white/70 border border-slate-200/80 rounded-2xl p-4 mb-6">
        <p className="text-sm text-slate-600 leading-relaxed">
          This website is not affiliated with any federal or state government agency. Information
          provided here is for educational purposes only.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Metal Tier Comparison Tool</h2>
        <p className="text-sm text-slate-600 mb-5">
          Select your expected healthcare usage level to see how the four metal tiers compare and
          which tier may be a reasonable starting point based on general guidelines.
        </p>

        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">Expected Healthcare Usage Level</p>
          <div className="flex flex-wrap gap-3">
            {(['low', 'moderate', 'high'] as UsageLevel[]).map((usage) => (
              <button
                key={usage}
                type="button"
                onClick={() => setSelectedUsage(usage)}
                className={`px-6 py-2.5 rounded-xl border font-medium transition-colors ${
                  selectedUsage === usage
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {usage.charAt(0).toUpperCase() + usage.slice(1)} Usage
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500 space-y-1">
            <span className="block"><strong>Low:</strong> Rarely visit doctors, no ongoing prescriptions, mainly want coverage for unexpected events.</span>
            <span className="block"><strong>Moderate:</strong> Regular checkups, a few prescriptions, occasional specialist visits.</span>
            <span className="block"><strong>High:</strong> Frequent doctor visits, multiple prescriptions, ongoing treatments or planned procedures.</span>
          </div>
        </div>

        {selectedUsage && (
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Plan Tier Comparison</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {metalTiers.tiers.map((tier) => {
                const colors = tierColors[tier.slug] ?? tierColors.bronze
                const isRecommended = tier.slug === usageToTier[selectedUsage]
                return (
                  <div
                    key={tier.slug}
                    className={`rounded-xl border-2 p-5 transition-all ${colors.bg} ${colors.border} ${
                      isRecommended ? `ring-2 ${colors.ring} shadow-md` : ''
                    }`}
                  >
                    {isRecommended && (
                      <span className="inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-900 text-white mb-3">
                        Suggested Starting Point
                      </span>
                    )}
                    <h4 className={`text-lg font-bold mb-2 ${colors.accent}`}>{tier.name} Plan</h4>
                    <p className="text-sm text-slate-600 mb-3">{tier.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Actuarial Value</span>
                        <span className="font-semibold text-slate-800">{tier.actuarialValue}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Premium Level</span>
                        <span className="font-semibold text-slate-800">{tier.premiumLevel}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Out-of-Pocket Level</span>
                        <span className="font-semibold text-slate-800">{tier.outOfPocketLevel}</span>
                      </div>
                    </div>
                    <div className={`mt-3 pt-3 border-t ${colors.border}`}>
                      <p className="text-xs text-slate-500">
                        <strong>Generally suited for:</strong> {tier.bestFor}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-primary-700 mb-1">Educational Suggestion</p>
              <p className="text-sm text-primary-800 leading-relaxed">
                {recommendations[selectedUsage]}
              </p>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              This comparison is for educational purposes only. Actual plan costs, benefits, and
              availability vary by location, insurer, and enrollment period. The suggestion above
              is a general starting point, not a recommendation for any specific plan. Consider
              all factors including available cost-sharing reductions for Silver plans.
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Resources</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="/csr-explained-2026" className="text-primary-600 hover:text-primary-700 underline">Cost-Sharing Reductions: Why Silver Plans Are Special</a></li>
          <li><a href="/aca-income-guide-2026" className="text-primary-600 hover:text-primary-700 underline">Health Insurance Savings by Income Level</a></li>
          <li><a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">Estimate Your Premium Savings</a></li>
        </ul>
      </div>

      <SourcesBox sources={[
        { title: 'Healthcare.gov - Plan Categories', url: 'https://www.healthcare.gov/choose-a-plan/plans-categories/' },
        { title: 'Healthcare.gov - Cost-Sharing Reductions', url: 'https://www.healthcare.gov/lower-costs/save-on-out-of-pocket-costs/' },
        { title: 'CMS - Actuarial Value and Cost Sharing', url: 'https://www.cms.gov/cciio/resources/data-resources/marketplace-puf' },
      ]} />
    </div>
  )
}
