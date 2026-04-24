// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import AeoBlock from '../../components/AeoBlock'
import PageFaq from '@/components/PageFaq'
import GenericByline from '../../components/GenericByline'
import LlmComment from '../../components/LlmComment'
import { buildBreadcrumbSchema, buildArticleSchema } from '../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'Early Retirement Health Insurance — Bridge to Medicare | HealthInsuranceRenew',
  description:
    'Retiring before 65? Learn your health insurance options for 2026 including marketplace plans, premium tax credits, income strategies, and how to bridge the gap to Medicare.',
  alternates: { canonical: 'https://healthinsurancerenew.com/early-retirement-health-insurance-2026' },
  openGraph: {
    title: 'Early Retirement Health Insurance — Bridge to Medicare',
    description: 'Retiring before 65? Learn your health insurance options for 2026 including marketplace plans, premium tax credits, income strategies, and how to bridge the gap to Medicare.',
    url: 'https://healthinsurancerenew.com/early-retirement-health-insurance-2026',
    type: 'article',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Early Retirement Health Insurance — Bridge to Medicare',
    description:
      'Retiring before 65? Learn your health insurance options for 2026 including marketplace plans, premium tax credits, income strategies, and how to bridge the gap to Medicare.',
  },
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Guides', url: '/guides' },
  { name: 'Early Retirement', url: '/early-retirement-health-insurance-2026' },
]

const faqs = [
  {
    question: 'Can I get marketplace health insurance if I retire before 65?',
    answer:
      'Yes. The health insurance marketplace is available to anyone who is not eligible for Medicare, regardless of employment status. Retiring early does not disqualify you. In fact, because your income often drops in early retirement, you may qualify for significant premium tax credits.',
  },
  {
    question: 'How does retirement income affect marketplace subsidies?',
    answer:
      'The marketplace uses Modified Adjusted Gross Income (MAGI), which includes retirement account withdrawals (from traditional IRAs and 401(k)s), Social Security benefits, pension income, investment income, and rental income. Roth IRA withdrawals generally do not count. You can manage your MAGI by controlling how much you withdraw each year.',
  },
  {
    question: 'Should I use COBRA or the marketplace after early retirement?',
    answer:
      'In most cases, the marketplace offers better value. COBRA premiums can be $600 to $750 per month or more because you pay the full premium without employer help. Marketplace plans with income-based subsidies are often $100 to $300 per month. COBRA may make sense only if you need to keep a specific doctor or are mid-treatment.',
  },
  {
    question: 'What happens to my marketplace plan when I turn 65 and get Medicare?',
    answer:
      'When you become eligible for Medicare at 65, you transition off the marketplace plan. You must enroll in Medicare during your Initial Enrollment Period (three months before your 65th birthday through three months after). Premium tax credits end once you are Medicare-eligible.',
  },
  {
    question: 'Can I control my income to maximize marketplace savings in early retirement?',
    answer:
      'Yes, this is a common strategy. By managing how much you withdraw from traditional retirement accounts versus Roth accounts and taxable savings, you can keep your MAGI within a range that maximizes premium tax credits and potentially qualifies for cost-sharing reductions on Silver plans.',
  },
  {
    question: 'Is health insurance the biggest expense in early retirement?',
    answer:
      'For many early retirees, health insurance is one of the largest expenses between retirement and Medicare eligibility at 65. However, marketplace subsidies can reduce this cost dramatically. Planning your income withdrawals strategically is one of the most effective ways to control this expense.',
  },
]

export default function EarlyRetirementPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://healthinsurancerenew.com' },
    { name: 'Guides', url: 'https://healthinsurancerenew.com/guides' },
    { name: 'Early Retirement', url: 'https://healthinsurancerenew.com/early-retirement-health-insurance-2026' },
  ])
  const articleSchema = buildArticleSchema({
    headline: 'Early Retirement Health Insurance — Bridge to Medicare',
    description: 'Retiring before 65? Learn your health insurance options for 2026.',
    dateModified: '2026-03-19',
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <LlmComment pageType="early-retirement-guide" year={2026} data="editorial" />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Early Retirement Health Insurance: Your 2026 Options
      </h1>

      <AeoBlock answer="If you retire before turning 65 and losing employer coverage, the health insurance marketplace is your primary option until Medicare kicks in. Your retirement income level determines how much help you get with premiums. Many early retirees qualify for substantial savings by managing how much income they take each year." caveat="Verify details with your plan or a licensed agent before making decisions." />

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">The Gap Between Retirement and Medicare</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          Medicare eligibility begins at age 65. If you retire at 55, 58, or 62, that leaves years where you need to
          find your own health insurance. Before the ACA, this gap was one of the biggest financial risks of early
          retirement. Now, the marketplace provides a path to affordable coverage — especially if you plan your
          income carefully.
        </p>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          Leaving an employer triggers a 60-day{' '}
          <a href="/guides/special-enrollment-period" className="text-primary-600 hover:text-primary-700 underline">
            Special Enrollment Period
          </a>{' '}
          for the marketplace, so you do not need to wait for open enrollment.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">How Marketplace Subsidies Work for Early Retirees</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          Premium tax credits are based on your{' '}
          <a href="/tools/what-income-counts" className="text-primary-600 hover:text-primary-700 underline">
            Modified Adjusted Gross Income (MAGI)
          </a>
          . For retirees, MAGI typically includes:
        </p>
        <ul className="list-disc pl-5 text-slate-700 leading-relaxed font-serif space-y-2 mb-4">
          <li>Withdrawals from traditional IRAs and 401(k) plans</li>
          <li>Pension income</li>
          <li>Social Security benefits (the taxable portion)</li>
          <li>Investment income (dividends, capital gains, interest)</li>
          <li>Rental income</li>
        </ul>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          <strong>Roth IRA withdrawals</strong> generally do not count toward MAGI. This is a key planning tool. By
          drawing from Roth accounts and taxable savings in early retirement, you can keep your MAGI low enough to
          qualify for larger premium tax credits.
        </p>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-slate-800 mb-3">Example: Early Retiree Couple, Age 60</h3>
          <p className="text-slate-700 leading-relaxed font-serif mb-2">
            A married couple retiring at 60 with $1.2 million in mixed retirement accounts. They need about $60,000
            per year to cover expenses.
          </p>
          <ul className="list-disc pl-5 text-slate-700 leading-relaxed font-serif space-y-2">
            <li>
              If they withdraw $60,000 from a traditional IRA: MAGI = $60,000, which is about 284% FPL for a
              household of 2. They qualify for premium tax credits but not CSR.
            </li>
            <li>
              If they withdraw $30,000 from a traditional IRA + $30,000 from Roth/savings: MAGI = $30,000, which is
              about 142% FPL. They qualify for a $0 benchmark premium and the 94% CSR tier.
            </li>
          </ul>
          <p className="text-slate-700 leading-relaxed font-serif mt-3">
            Same expenses, dramatically different health insurance costs. This is why income management matters.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">COBRA vs. Marketplace for Retirees</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          After leaving an employer, you usually have the option of COBRA continuation coverage for up to 18 months.
          COBRA keeps your exact same plan but you pay the full premium — often $600 to $750+ per month for one
          person, or $1,500 to $2,000+ for a couple.
        </p>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          A marketplace plan with subsidies is almost always cheaper for early retirees, because your retirement
          income is typically lower than your working income. The marketplace is usually the better financial choice
          unless:
        </p>
        <ul className="list-disc pl-5 text-slate-700 leading-relaxed font-serif space-y-2 mb-4">
          <li>You are mid-treatment and need to keep a specific provider network</li>
          <li>You have already met a high deductible for the year on your employer plan</li>
          <li>You receive a COBRA subsidy from a severance package</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Step-by-Step: Getting Coverage After Early Retirement</h2>
        <ol className="list-decimal pl-5 text-slate-700 leading-relaxed font-serif space-y-3">
          <li>
            <strong>Project your retirement income.</strong> Estimate your MAGI for the year based on planned
            withdrawals, Social Security, and investment income.
          </li>
          <li>
            <strong>
              Check the{' '}
              <a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">
                FPL table
              </a>
            </strong>{' '}
            to see what percentage of FPL your income represents for your household size.
          </li>
          <li>
            <strong>
              Use the{' '}
              <a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">
                savings calculator
              </a>
            </strong>{' '}
            to estimate your premium tax credit.
          </li>
          <li>
            <strong>Consider Roth conversions before retiring</strong> to build a pool of tax-free withdrawals for
            early retirement years.
          </li>
          <li>
            <strong>Apply through the marketplace</strong> within 60 days of losing employer coverage.
          </li>
          <li>
            <strong>Update your income estimate</strong> during the year if it changes, so your advance credit stays
            accurate.
          </li>
          <li>
            <strong>Plan for the Medicare transition.</strong> Enroll in Medicare during your Initial Enrollment
            Period starting 3 months before you turn 65.
          </li>
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
