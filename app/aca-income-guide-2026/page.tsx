// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import AnswerBox from '../../components/AnswerBox'
import FAQSection from '../../components/FAQSection'
import GenericByline from '../../components/GenericByline'
import LlmComment from '../../components/LlmComment'
import SourcesBox from '../../components/SourcesBox'
import { buildBreadcrumbSchema, buildArticleSchema } from '../../lib/schema-markup'
import fplData from '../../data/config/fpl-current.json'
import csrData from '../../data/config/csr-tiers.json'
import contributionData from '../../data/config/contribution-scale.json'

export const metadata: Metadata = {
  title: 'Health Insurance Savings by Income Level (2026) | HealthInsuranceRenew',
  description:
    'Understand what health insurance savings you qualify for at every income level. Covers Medicaid, premium tax credits, and cost-sharing reductions by FPL percentage.',
  alternates: { canonical: 'https://healthinsurancerenew.com/aca-income-guide-2026' },
  openGraph: {
    title: 'Health Insurance Savings by Income Level (2026)',
    description: 'Understand what health insurance savings you qualify for at every income level. Covers Medicaid, premium tax credits, and cost-sharing reductions by FPL percentage.',
    url: 'https://healthinsurancerenew.com/aca-income-guide-2026',
    type: 'article',
    siteName: 'HealthInsuranceRenew',
  },
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Health Insurance Savings by Income', url: '/aca-income-guide-2026' },
]

const g = fplData.guidelines

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US')
}

const faqs = [
  {
    question: 'What savings do I get if I earn below 138% of the poverty level?',
    answer:
      'If you live in a Medicaid expansion state and earn below 138% FPL, you likely qualify for Medicaid coverage with minimal or no monthly cost. In non-expansion states, you may fall into a coverage gap if your income is below 100% FPL.',
  },
  {
    question: 'What help is available between 138% and 200% of the poverty level?',
    answer:
      'This income range qualifies for significant help. Your benchmark Silver plan premium is very low (0% to 2% of income), and you qualify for the 87% CSR tier on Silver plans. That means a typical deductible around $650 and an out-of-pocket maximum around $2,900.',
  },
  {
    question: 'Do I get any help above 400% of the poverty level?',
    answer:
      'Under the enhanced subsidy rules (if still in effect for 2026), your premium is capped at 8.5% of household income regardless of how high your income is. Under the original ACA rules, no premium tax credit is available above 400% FPL. Check which rules apply for the year you are enrolling.',
  },
  {
    question: 'How do I know which income band I fall into?',
    answer:
      'Calculate your household Modified Adjusted Gross Income (MAGI), then compare it to the Federal Poverty Level for your household size. For example, a single person earning $25,000 in 2026 would be at about 160% FPL. Use our FPL table or the Estimate Your Savings tool for a quick lookup.',
  },
  {
    question: 'Does my state affect which income band benefits I receive?',
    answer:
      'Premium tax credits and CSR tiers are federal benefits and work the same in every state. However, Medicaid eligibility depends on whether your state has expanded Medicaid. In non-expansion states, the Medicaid threshold is much lower than 138% FPL for adults.',
  },
]

const sources = [
  { title: 'Healthcare.gov - How Savings Work', url: 'https://www.healthcare.gov/lower-costs/' },
  { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
  { title: 'CMS - Cost-Sharing Reductions', url: 'https://www.healthcare.gov/choose-a-plan/plans-categories/' },
  { title: 'Medicaid.gov - Eligibility', url: 'https://www.medicaid.gov/medicaid/eligibility/index.html' },
]

export default function ACAIncomeGuidePage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://healthinsurancerenew.com' },
    { name: 'Health Insurance Savings by Income', url: 'https://healthinsurancerenew.com/aca-income-guide-2026' },
  ])
  const articleSchema = buildArticleSchema({
    headline: 'Health Insurance Savings by Income Level (2026)',
    description: 'Understand what health insurance savings you qualify for at every income level.',
    dateModified: '2026-03-19',
    dataSourceName: 'IRS Premium Tax Credit & CMS CSR Data',
    dataSourceUrl: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit',
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <LlmComment pageType="income-guide" year={2026} data="IRS-CMS" />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Health Insurance Savings by Income Level: 2026 Guide
      </h1>

      <AnswerBox answer="Your health insurance savings depend almost entirely on your income relative to the Federal Poverty Level. This guide explains what happens at each income level, from Medicaid at the bottom to enhanced subsidies at the top." />

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">How Income Determines Your Health Insurance Benefits</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          The ACA uses income as a percentage of the{' '}
          <a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">
            Federal Poverty Level (FPL)
          </a>{' '}
          to determine what help you receive. There are essentially five income bands, each with different benefits:
        </p>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Income Band</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Single (2026)</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Family of 4 (2026)</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Primary Benefit</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { band: 'Below 138% FPL', s1: 0, s2: Math.round(g.household_1 * 1.38), f1: 0, f2: Math.round(g.household_4 * 1.38), benefit: 'Medicaid (expansion states)' },
                  { band: '138%–150% FPL', s1: Math.round(g.household_1 * 1.38), s2: Math.round(g.household_1 * 1.5), f1: Math.round(g.household_4 * 1.38), f2: Math.round(g.household_4 * 1.5), benefit: '$0 premium + 94% CSR' },
                  { band: '150%–200% FPL', s1: Math.round(g.household_1 * 1.5), s2: g.household_1 * 2, f1: Math.round(g.household_4 * 1.5), f2: g.household_4 * 2, benefit: 'Very low premium + 87% CSR' },
                  { band: '200%–250% FPL', s1: g.household_1 * 2, s2: Math.round(g.household_1 * 2.5), f1: g.household_4 * 2, f2: Math.round(g.household_4 * 2.5), benefit: '2%–4% of income premium + 73% CSR' },
                  { band: '250%–400% FPL', s1: Math.round(g.household_1 * 2.5), s2: g.household_1 * 4, f1: Math.round(g.household_4 * 2.5), f2: g.household_4 * 4, benefit: '4%–8.5% of income premium, no CSR' },
                  { band: '400%+ FPL', s1: g.household_1 * 4, s2: null, f1: g.household_4 * 4, f2: null, benefit: '8.5% cap on premium (enhanced rules)' },
                ].map((row, i) => (
                  <tr key={row.band} className={i % 2 === 0 ? 'border-b border-slate-100' : 'border-b border-slate-100 bg-slate-50/50'}>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.band}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.s2 ? `${fmt(row.s1)}–${fmt(row.s2)}` : `${fmt(row.s1)}+`}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.f2 ? `${fmt(row.f1)}–${fmt(row.f2)}` : `${fmt(row.f1)}+`}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.benefit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Based on 2026 FPL guidelines. Single = 1-person household. Family of 4 = 4-person household. Premium
          percentages are for benchmark Silver plans under enhanced subsidy rules.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Income Band Detail</h2>

        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <h3 className="font-semibold text-slate-900 mb-2">Below 138% FPL — Medicaid</h3>
            <p className="text-slate-700 leading-relaxed font-serif mb-2">
              In states that have expanded Medicaid, adults with income below 138% FPL generally qualify for Medicaid
              — coverage with little to no monthly premium and very low cost-sharing.
            </p>
            <p className="text-slate-700 leading-relaxed font-serif text-sm">
              2026 threshold: {fmt(Math.round(g.household_1 * 1.38))} (single) /{' '}
              {fmt(Math.round(g.household_4 * 1.38))} (family of 4)
            </p>
          </div>

          {contributionData.bands.map((band, i) => {
            if (band.minFPL === 0) return null
            const csrTier = csrData.tiers.find((t) => t.minFPL <= band.minFPL && t.maxFPL >= band.minFPL)
            const colors = ['bg-blue-50 border-blue-200', 'bg-sky-50 border-sky-200', 'bg-amber-50 border-amber-200', 'bg-orange-50 border-orange-200', 'bg-slate-50 border-slate-200']

            const singleMin = fmt(Math.round(g.household_1 * band.minFPL / 100))
            const singleMax = band.maxFPL === 999 ? null : fmt(Math.round(g.household_1 * band.maxFPL / 100))
            const familyMin = fmt(Math.round(g.household_4 * band.minFPL / 100))
            const familyMax = band.maxFPL === 999 ? null : fmt(Math.round(g.household_4 * band.maxFPL / 100))

            const premiumDesc = band.minPercent === 0 && band.maxPercent === 0
              ? '$0 for benchmark Silver plan'
              : band.minPercent === band.maxPercent
              ? `${band.maxPercent}% of household income`
              : `${band.minPercent}%–${band.maxPercent}% of household income`

            return (
              <div key={i} className={`border rounded-2xl p-5 ${colors[i - 1] ?? 'bg-white border-slate-200'}`}>
                <h3 className="font-semibold text-slate-900 mb-2">
                  {band.minFPL}%–{band.maxFPL === 999 ? '400%+' : `${band.maxFPL}%`} FPL
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-slate-500 block">Expected Premium</span>
                    <span className="font-medium text-slate-800">{premiumDesc}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CSR Tier</span>
                    <span className="font-medium text-slate-800">
                      {csrTier && csrTier.name !== 'Standard Silver'
                        ? `${csrTier.actuarialValue}% (${csrTier.name})`
                        : 'None (70% standard)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">2026 Income Range</span>
                    <span className="font-medium text-slate-800 text-xs">
                      Single: {singleMin}{singleMax ? `–${singleMax}` : '+'} |{' '}
                      Family of 4: {familyMin}{familyMax ? `–${familyMax}` : '+'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">What This Means for Choosing a Plan</h2>
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="font-semibold text-slate-800 mb-1">Below 250% FPL → Choose Silver</h3>
            <p className="text-slate-700 text-sm font-serif">
              Cost-sharing reductions are only available on Silver plans. At lower incomes, a Silver plan with CSR
              gives you better coverage (lower deductible, lower copays) than a Bronze or Gold plan. This is the
              single most important plan-selection rule for lower-income enrollees.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="font-semibold text-slate-800 mb-1">250%–400% FPL → Compare Silver and Gold</h3>
            <p className="text-slate-700 text-sm font-serif">
              At this income level, you do not qualify for CSRs. Compare the total cost of a Silver plan vs. a Gold
              plan based on your expected medical usage. If you use a lot of care, Gold may be cheaper overall.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="font-semibold text-slate-800 mb-1">400%+ FPL, generally healthy → Consider Bronze + HSA</h3>
            <p className="text-slate-700 text-sm font-serif">
              If your income is high and you rarely use medical care, a Bronze plan paired with a Health Savings
              Account can minimize total costs while providing tax advantages.
            </p>
          </div>
        </div>
      </section>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Resources</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">2026 FPL Guidelines</a></li>
          <li><a href="/csr-explained-2026" className="text-primary-600 hover:text-primary-700 underline">Cost-Sharing Reductions Explained</a></li>
          <li><a href="/eligibility-check" className="text-primary-600 hover:text-primary-700 underline">Do I Qualify for Health Insurance Savings?</a></li>
          <li><a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">Estimate Your Savings</a></li>
          <li><a href="/tools/plan-comparison" className="text-primary-600 hover:text-primary-700 underline">Compare Plan Levels</a></li>
        </ul>
      </div>

      <FAQSection faqs={faqs} />
      <SourcesBox sources={sources} />
      {/* NOTE: No name/NPN on this page — generic byline only */}
      <GenericByline dataSource="HealthInsuranceRenew editorial team" />
    </div>
  )
}
