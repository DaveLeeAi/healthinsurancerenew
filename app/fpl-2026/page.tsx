// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import AeoBlock from '../../components/AeoBlock'
import PageFaq from '@/components/PageFaq'
import GenericByline from '../../components/GenericByline'
import LlmComment from '../../components/LlmComment'
import SourcesBox from '../../components/SourcesBox'
import { buildBreadcrumbSchema, buildArticleSchema } from '../../lib/schema-markup'
import fplData from '../../data/config/fpl-current.json'

export const metadata: Metadata = {
  title: '2026 Federal Poverty Level (FPL) Guidelines | HealthInsuranceRenew',
  description:
    '2026 Federal Poverty Level guidelines and health insurance eligibility thresholds. See FPL amounts for every household size and how they determine Medicaid and subsidy eligibility.',
  alternates: { canonical: 'https://healthinsurancerenew.com/fpl-2026' },
  openGraph: {
    title: '2026 Federal Poverty Level (FPL) Guidelines | HealthInsuranceRenew',
    description: '2026 Federal Poverty Level guidelines and health insurance eligibility thresholds. See FPL amounts for every household size and how they determine Medicaid and subsidy eligibility.',
    url: 'https://healthinsurancerenew.com/fpl-2026',
    type: 'article',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: '2026 Federal Poverty Level (FPL) Guidelines | HealthInsuranceRenew',
    description:
      '2026 Federal Poverty Level guidelines and health insurance eligibility thresholds. See FPL amounts for every household size and how they determine Medicaid and subsidy eligibility.',
  },
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: '2026 FPL Guidelines', url: '/fpl-2026' },
]

const g = fplData.guidelines

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US')
}

const householdSizes = [
  { size: 1, base: g.household_1 },
  { size: 2, base: g.household_2 },
  { size: 3, base: g.household_3 },
  { size: 4, base: g.household_4 },
  { size: 5, base: g.household_5 },
  { size: 6, base: g.household_6 },
  { size: 7, base: g.household_6 + g.additionalPerson },
  { size: 8, base: g.household_6 + g.additionalPerson * 2 },
]

const fplPercentages = [100, 138, 150, 200, 250, 300, 400]

const faqs = [
  {
    question: 'What is the Federal Poverty Level (FPL)?',
    answer:
      'The Federal Poverty Level is an income measure published each year by the U.S. Department of Health and Human Services. The ACA uses it as the yardstick to decide who qualifies for Medicaid, premium tax credits, and cost-sharing reductions. Your eligibility is based on your income as a percentage of FPL for your household size.',
  },
  {
    question: 'When are the 2026 FPL guidelines released?',
    answer:
      'HHS typically publishes updated poverty guidelines in January of each year. The numbers on this page reflect the most recently available guidelines. If updated figures have been released since this page was last reviewed, we update them as quickly as possible.',
  },
  {
    question: 'What does "138% of FPL" mean for Medicaid?',
    answer:
      'In states that have expanded Medicaid under the ACA, adults with income below 138% of the Federal Poverty Level generally qualify for Medicaid. For a single person in 2026, that is roughly ' +
      fmt(Math.round(g.household_1 * 1.38)) +
      '.',
  },
  {
    question: 'What does "400% of FPL" mean for premium tax credits?',
    answer:
      'Under the ACA, premium tax credits phase out at 400% of FPL. The enhanced subsidies that temporarily removed this cap expired at the end of 2025, so the 400% FPL cliff is back in effect for 2026. For a single person in 2026, 400% FPL is ' +
      fmt(g.household_1 * 4) +
      '.',
  },
  {
    question: 'Does Alaska or Hawaii use different FPL numbers?',
    answer:
      'Yes. HHS publishes separate poverty guidelines for Alaska and Hawaii, which are higher than the 48-state guidelines. The numbers on this page reflect the contiguous 48 states and DC. If you live in Alaska or Hawaii, check the HHS website for your state-specific figures.',
  },
]

const sources = [
  { title: 'HHS 2026 Federal Poverty Guidelines', url: 'https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines' },
  { title: 'Healthcare.gov - Eligibility', url: 'https://www.healthcare.gov/quick-guide/eligibility/' },
  { title: 'Federal Cost-Sharing Reductions', url: 'https://www.healthcare.gov/choose-a-plan/plans-categories/' },
]

export default function FPL2026Page() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://healthinsurancerenew.com' },
    { name: '2026 FPL Guidelines', url: 'https://healthinsurancerenew.com/fpl-2026' },
  ])
  const articleSchema = buildArticleSchema({
    headline: '2026 Federal Poverty Level (FPL) Guidelines',
    description: '2026 Federal Poverty Level guidelines and health insurance eligibility thresholds.',
    dateModified: '2026-03-19',
    dataSourceName: 'HHS Federal Poverty Guidelines',
    dataSourceUrl: 'https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines',
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <LlmComment pageType="fpl-guide" year={2026} data="HHS-FPL" />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        2026 Federal Poverty Level (FPL) Guidelines
      </h1>

      <AeoBlock answer="The Federal Poverty Level (FPL) is the income benchmark used to determine eligibility for Medicaid, premium tax credits, and cost-sharing reductions under the ACA. The table below shows the 2026 FPL for every household size, plus what common FPL percentages translate to in annual income." caveat="Subsidy estimates are approximate. Actual amounts are determined during enrollment." />

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">2026 FPL by Household Size</h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Household Size</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">100% FPL</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">138% FPL (Medicaid)</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">150% FPL ($0 premium)</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">400% FPL</th>
                </tr>
              </thead>
              <tbody>
                {householdSizes.map((row, i) => (
                  <tr key={row.size} className={i % 2 === 0 ? 'border-b border-slate-100' : 'border-b border-slate-100 bg-slate-50/50'}>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.size} {row.size === 1 ? 'person' : 'people'}</td>
                    <td className="px-4 py-3 text-slate-700">{fmt(row.base)}</td>
                    <td className="px-4 py-3 text-slate-700">{fmt(Math.round(row.base * 1.38))}</td>
                    <td className="px-4 py-3 text-slate-700">{fmt(Math.round(row.base * 1.5))}</td>
                    <td className="px-4 py-3 text-slate-700">{fmt(row.base * 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Source: U.S. Department of Health and Human Services, 2026 guidelines for the 48 contiguous states and DC.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">FPL Thresholds by Percentage</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          The table below shows what each FPL percentage means in dollar terms for each household size.
        </p>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">FPL %</th>
                  {householdSizes.map((row) => (
                    <th key={row.size} className="text-left px-4 py-3 font-semibold text-slate-700">
                      {row.size} {row.size === 1 ? 'person' : 'people'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fplPercentages.map((pct, i) => (
                  <tr key={pct} className={i % 2 === 0 ? 'border-b border-slate-100' : 'border-b border-slate-100 bg-slate-50/50'}>
                    <td className="px-4 py-3 font-medium text-slate-800">{pct}%</td>
                    {householdSizes.map((row) => (
                      <td key={row.size} className="px-4 py-3 text-slate-700">
                        {fmt(Math.round(row.base * pct / 100))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Key FPL Thresholds and What They Mean</h2>
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-semibold text-slate-800 mb-2">100–138% FPL — Medicaid Boundary</h3>
            <p className="text-slate-700 text-sm font-serif">
              In Medicaid expansion states, adults with income below 138% FPL qualify for Medicaid. Above 100% FPL and
              not eligible for Medicaid, you can get marketplace premium tax credits.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-semibold text-slate-800 mb-2">100–150% FPL — $0 Premium Silver Plan</h3>
            <p className="text-slate-700 text-sm font-serif">
              People with income between 100% and 150% FPL pay very low premiums for a benchmark
              Silver plan. This remains one of the most significant marketplace benefits for 2026.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-semibold text-slate-800 mb-2">100–250% FPL — Cost-Sharing Reductions (CSR)</h3>
            <p className="text-slate-700 text-sm font-serif">
              Silver plan enrollees with income below 250% FPL qualify for cost-sharing reductions, which lower their
              deductible, copays, and out-of-pocket maximum. The CSR is only available on Silver plans.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-semibold text-slate-800 mb-2">400%+ FPL — No Subsidy (Cliff)</h3>
            <p className="text-slate-700 text-sm font-serif">
              For 2026, there is a hard cutoff at 400% FPL. Households above this threshold receive zero premium tax
              credits and pay the full unsubsidized premium. The enhanced subsidies that previously removed this cliff
              expired at the end of 2025.
            </p>
          </div>
        </div>
      </section>

      <PageFaq faqs={faqs} />
      <SourcesBox sources={sources} />
      {/* NOTE: No name/NPN on this page — generic byline only */}
      <GenericByline dataSource="HealthInsuranceRenew editorial team" lastReviewed="2026-03-19" />
    </div>
  )
}
