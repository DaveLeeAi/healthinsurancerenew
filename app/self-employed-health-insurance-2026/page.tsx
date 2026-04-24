// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import AeoBlock from '../../components/AeoBlock'
import PageFaq from '@/components/PageFaq'
import GenericByline from '../../components/GenericByline'
import LlmComment from '../../components/LlmComment'
import { buildBreadcrumbSchema, buildArticleSchema } from '../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'Self-Employed Health Insurance Guide (2026) | HealthInsuranceRenew',
  description:
    'Health insurance for freelancers and self-employed workers in 2026. Learn about marketplace options, premium tax credits, the self-employed deduction, and HSA strategies.',
  alternates: { canonical: 'https://healthinsurancerenew.com/self-employed-health-insurance-2026' },
  openGraph: {
    title: 'Self-Employed Health Insurance Guide (2026)',
    description: 'Health insurance for freelancers and self-employed workers in 2026. Learn about marketplace options, premium tax credits, the self-employed deduction, and HSA strategies.',
    url: 'https://healthinsurancerenew.com/self-employed-health-insurance-2026',
    type: 'article',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Self-Employed Health Insurance Guide (2026)',
    description:
      'Health insurance for freelancers and self-employed workers in 2026. Learn about marketplace options, premium tax credits, the self-employed deduction, and HSA strategies.',
  },
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Guides', url: '/guides' },
  { name: 'Self-Employed Coverage', url: '/self-employed-health-insurance-2026' },
]

const faqs = [
  {
    question: 'Can self-employed people get marketplace subsidies?',
    answer:
      'Yes. Self-employed individuals are eligible for marketplace premium tax credits based on projected Modified Adjusted Gross Income. Net self-employment income (after business deductions) is the primary figure used. Many freelancers and gig workers qualify for substantial savings, especially in years with lower net income.',
  },
  {
    question: 'How do I estimate income for marketplace subsidies if my earnings vary?',
    answer:
      'Base your estimate on your prior year tax return, adjusted for known changes in contracts or business conditions. The marketplace allows you to update your income projection at any time during the year, which adjusts your monthly premium credit going forward. Updating regularly helps avoid surprise repayments at tax time.',
  },
  {
    question: 'Can I deduct health insurance premiums as a self-employed person?',
    answer:
      'Yes. Self-employed individuals can deduct 100% of health insurance premiums (after subtracting the advance premium tax credit) as an above-the-line deduction on their federal tax return. This reduces your adjusted gross income, which can in turn increase your marketplace subsidy eligibility.',
  },
  {
    question: 'Should self-employed workers choose Bronze or Silver plans?',
    answer:
      'If your income is below 250% FPL, a Silver plan with cost-sharing reductions usually provides the best value — lower deductibles, copays, and out-of-pocket costs. If you are healthy and have higher income, a Bronze plan paired with a Health Savings Account offers lower premiums and tax advantages.',
  },
  {
    question: 'Can I use an HSA if I am self-employed?',
    answer:
      'Yes. If you enroll in a high-deductible health plan (HDHP), typically a Bronze plan, you can contribute to a Health Savings Account. HSA contributions are tax-deductible, growth is tax-free, and withdrawals for medical expenses are tax-free. HSA contributions also reduce your MAGI, potentially increasing your marketplace subsidy.',
  },
  {
    question: 'When can self-employed people enroll in marketplace coverage?',
    answer:
      'You can enroll during the annual open enrollment period. If you are newly self-employed and just lost employer coverage, that is a qualifying life event that opens a 60-day special enrollment period. If you were already self-employed without coverage, you must wait for open enrollment unless you have another qualifying event.',
  },
]

export default function SelfEmployedPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://healthinsurancerenew.com' },
    { name: 'Guides', url: 'https://healthinsurancerenew.com/guides' },
    { name: 'Self-Employed Coverage', url: 'https://healthinsurancerenew.com/self-employed-health-insurance-2026' },
  ])
  const articleSchema = buildArticleSchema({
    headline: 'Self-Employed Health Insurance Guide (2026)',
    description: 'Health insurance for freelancers and self-employed workers in 2026.',
    dateModified: '2026-03-19',
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <LlmComment pageType="self-employed-guide" year={2026} data="editorial" />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Self-Employed Health Insurance in 2026: Your Options
      </h1>

      <AeoBlock answer="The health insurance marketplace is the primary source of individual health insurance for self-employed workers. Premium tax credits based on your net income can reduce costs significantly. You can also deduct premiums as a business expense, and pair a high-deductible plan with an HSA for additional tax savings." caveat="Verify details with your plan or a licensed agent before making decisions." />

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Marketplace Coverage for Freelancers and Gig Workers</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          Whether you are a freelancer, independent contractor, gig worker, or small business owner, the
          marketplace is designed for people who do not get insurance through an employer. You apply through
          Healthcare.gov or your state exchange, and your subsidy is based on your projected annual household income.
        </p>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          Self-employed income is calculated as net income after business deductions (revenue minus business
          expenses). This is the number from Schedule C on your tax return. A lower net income means a higher premium
          tax credit.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Managing Variable Income</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          The biggest challenge for self-employed marketplace enrollees is projecting annual income accurately.
          Freelance and gig income fluctuates, and your subsidy is based on a full-year projection.
        </p>
        <ul className="list-disc pl-5 text-slate-700 leading-relaxed font-serif space-y-2 mb-4">
          <li><strong>Overestimating income</strong> means a smaller advance credit each month, but you get a refund at tax time</li>
          <li><strong>Underestimating income</strong> means a larger advance credit each month, but you may owe money back at tax time</li>
          <li><strong>Updating mid-year</strong> is allowed and recommended — the marketplace adjusts your credit going forward</li>
        </ul>
        <p className="text-slate-700 leading-relaxed font-serif">
          Best practice: base your projection on the most recent tax return, adjust for known changes, and update
          quarterly if income shifts significantly.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">The Self-Employed Health Insurance Deduction</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          Self-employed workers can deduct 100% of health insurance premiums for themselves and dependents as an
          above-the-line deduction on their federal tax return. This deduction:
        </p>
        <ul className="list-disc pl-5 text-slate-700 leading-relaxed font-serif space-y-2 mb-4">
          <li>Applies to the net premium after subtracting the advance premium tax credit</li>
          <li>Reduces your adjusted gross income, which can increase your marketplace subsidy</li>
          <li>Is available regardless of whether you itemize deductions</li>
          <li>Creates a circular calculation (deduction increases subsidy, which reduces the deductible premium) — tax software handles this automatically</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">HSA Strategy for Self-Employed Workers</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          If you enroll in an HSA-eligible high-deductible health plan (typically Bronze), you can contribute to a
          Health Savings Account with a triple tax benefit: contributions are deductible, growth is tax-free, and
          withdrawals for medical expenses are tax-free.
        </p>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          HSA contributions also reduce your MAGI, which can increase your marketplace premium tax credit. This makes the HSA
          strategy particularly powerful for self-employed workers.
        </p>
        <p className="text-slate-700 leading-relaxed font-serif">
          This approach works best for people who are generally healthy and can tolerate the higher deductible in
          exchange for lower premiums and tax savings.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Choosing the Right Plan Tier</h2>
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="font-semibold text-slate-800 mb-1">Silver (Best for income below 250% FPL)</h3>
            <p className="text-slate-700 text-sm font-serif">
              Cost-sharing reductions lower your deductible, copays, and OOP max. Best overall value at lower income
              levels.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="font-semibold text-slate-800 mb-1">Bronze + HSA (Best for healthy, higher earners)</h3>
            <p className="text-slate-700 text-sm font-serif">
              Lowest premiums. HSA provides tax advantages. Best for people who rarely use health care.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="font-semibold text-slate-800 mb-1">Gold (Best for frequent care users)</h3>
            <p className="text-slate-700 text-sm font-serif">
              Higher premiums but lower cost-sharing. Worth considering if you have ongoing treatments or expensive
              prescriptions.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Step-by-Step: Getting Covered</h2>
        <ol className="list-decimal pl-5 text-slate-700 leading-relaxed font-serif space-y-3">
          <li><strong>Calculate your net self-employment income.</strong> Revenue minus business deductions.</li>
          <li>
            <strong>Estimate your household MAGI.</strong> Include all income sources for your tax household. See{' '}
            <a href="/tools/what-income-counts" className="text-primary-600 hover:text-primary-700 underline">
              What Income Counts
            </a>
            .
          </li>
          <li>
            <strong>Check your estimated savings.</strong> Use the{' '}
            <a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">
              Estimate Your Savings
            </a>{' '}
            tool.
          </li>
          <li><strong>Decide on a plan tier.</strong> Compare Silver (with CSR if eligible) vs. Bronze + HSA.</li>
          <li>
            <strong>Enroll during open enrollment</strong> through{' '}
            <a href="https://applyhealthinsuranceonline.com" className="text-primary-600 hover:text-primary-700 underline" target="_blank" rel="noopener noreferrer">
              ApplyHealthInsuranceOnline.com
            </a>{' '}
            or your state exchange.
          </li>
          <li><strong>Update your income estimate</strong> during the year if it changes significantly.</li>
        </ol>
      </section>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Resources</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="/eligibility-check" className="text-primary-600 hover:text-primary-700 underline">Do I Qualify for Health Insurance Savings?</a></li>
          <li><a href="/aca-income-guide-2026" className="text-primary-600 hover:text-primary-700 underline">Health Insurance Savings by Income Level</a></li>
          <li><a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">2026 FPL Guidelines</a></li>
          <li><a href="/csr-explained-2026" className="text-primary-600 hover:text-primary-700 underline">Cost-Sharing Reductions Explained</a></li>
          <li><a href="/tools/what-income-counts" className="text-primary-600 hover:text-primary-700 underline">What Income Counts?</a></li>
        </ul>
      </div>

      <PageFaq faqs={faqs} />
      {/* NOTE: No name/NPN on this page — generic byline only */}
      <GenericByline dataSource="HealthInsuranceRenew editorial team" lastReviewed="2026-03-19" />
    </div>
  )
}
