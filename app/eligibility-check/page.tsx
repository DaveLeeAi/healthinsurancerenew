// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import AnswerBox from '../../components/AnswerBox'
import PageFaq from '@/components/PageFaq'
import GenericByline from '../../components/GenericByline'
import LlmComment from '../../components/LlmComment'
import SourcesBox from '../../components/SourcesBox'
import { buildBreadcrumbSchema, buildArticleSchema } from '../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'ACA Eligibility Check — Do You Qualify for Savings? | HealthInsuranceRenew',
  description:
    'Find out if you qualify for marketplace health insurance savings in 2026. Step-by-step guide covering employer coverage, income, Medicaid, and special enrollment.',
  alternates: { canonical: 'https://healthinsurancerenew.com/eligibility-check' },
  openGraph: {
    title: 'ACA Eligibility Check — Do You Qualify for Savings?',
    description: 'Find out if you qualify for marketplace health insurance savings in 2026. Step-by-step guide covering employer coverage, income, Medicaid, and special enrollment.',
    url: 'https://healthinsurancerenew.com/eligibility-check',
    type: 'article',
    siteName: 'HealthInsuranceRenew',
  },
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Eligibility Check', url: '/eligibility-check' },
]

const faqs = [
  {
    question: 'Can I get marketplace savings if my employer offers health insurance?',
    answer:
      "It depends. If your employer plan costs more than about 9.96% of your household income for employee-only coverage, it may be considered unaffordable under ACA rules. In that case, you could qualify for marketplace savings instead. Use our \"Does My Employer Plan Count?\" tool to check.",
  },
  {
    question: 'What income is used to decide if I qualify for help?',
    answer:
      'The marketplace uses Modified Adjusted Gross Income (MAGI). This includes wages, self-employment income, Social Security benefits, and a few other sources. It is not exactly the same as your take-home pay. See our "What Income Counts?" guide for a full breakdown.',
  },
  {
    question: 'Do I qualify for Medicaid or marketplace savings?',
    answer:
      'It depends on your income and your state. In states that have expanded Medicaid, adults with income below about 138% of the Federal Poverty Level generally qualify for Medicaid. Above that, you may qualify for marketplace premium tax credits. In non-expansion states, the thresholds are different.',
  },
  {
    question: 'What if I missed open enrollment?',
    answer:
      'You may still be able to sign up through a Special Enrollment Period if you experienced a qualifying life event — like losing job-based coverage, getting married, having a baby, or moving to a new state. Medicaid applications are accepted year-round.',
  },
  {
    question: 'Can I get marketplace subsidies if self-employed?',
    answer:
      'Yes. Self-employed individuals can buy coverage through the marketplace and may qualify for premium tax credits based on their projected income. Your income from self-employment counts toward your MAGI for eligibility purposes.',
  },
  {
    question: 'Is there an income limit for marketplace premium tax credits?',
    answer:
      'For 2026, the enhanced subsidies that removed the income cap have expired. Under the standard ACA rules now in effect, premium tax credits phase out entirely at 400% of the Federal Poverty Level ($62,600 for a single person). Above that threshold, no premium assistance is available.',
  },
]

const sources = [
  { title: 'Healthcare.gov - Eligibility', url: 'https://www.healthcare.gov/quick-guide/eligibility/' },
  { title: 'Healthcare.gov - Qualifying Life Events', url: 'https://www.healthcare.gov/glossary/qualifying-life-event/' },
  { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
  { title: 'CMS - Medicaid Expansion', url: 'https://www.medicaid.gov/medicaid/national-medicaid-chip-program-information/medicaid-chip-enrollment-data/index.html' },
]

export default function EligibilityCheckPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://healthinsurancerenew.com' },
    { name: 'Eligibility Check', url: 'https://healthinsurancerenew.com/eligibility-check' },
  ])
  const articleSchema = buildArticleSchema({
    headline: 'ACA Eligibility Check — Do You Qualify for Savings?',
    description: 'Find out if you qualify for marketplace health insurance savings in 2026.',
    dateModified: '2026-03-19',
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <LlmComment pageType="eligibility-tool" year={2026} data="editorial" />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Do I Qualify for Health Insurance Savings in 2026?
      </h1>

      <AnswerBox answer="Whether you qualify depends on a few things: your income, your household size, whether you have employer coverage, and where you live. This page walks through each factor in plain English." />

      <p className="text-slate-600 leading-relaxed font-serif mb-8">
        Marketplace eligibility is not a single yes-or-no question. It depends on several pieces of your situation working
        together. Review the sections below to understand where you stand.
      </p>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Do you have employer coverage?</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <p className="text-slate-700 leading-relaxed font-serif mb-3">
            If your employer offers health insurance, that is usually your first option. But having an employer plan
            does not automatically mean you are locked out of marketplace savings.
          </p>
          <p className="text-slate-700 leading-relaxed font-serif mb-3">
            The key question is whether the employer plan is considered <strong>affordable</strong> under ACA rules.
            If it costs too much relative to your income, you may qualify for marketplace savings instead.
          </p>
          <details className="group mt-4">
            <summary className="flex items-center justify-between cursor-pointer text-primary-600 font-medium hover:text-primary-700 transition-colors">
              <span>What counts as &quot;affordable&quot;?</span>
              <svg className="w-5 h-5 transition-transform group-open:rotate-180 shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-3 pt-3 border-t border-slate-100 text-slate-600 leading-relaxed font-serif">
              <p className="mb-2">
                For 2026, an employer plan is considered affordable if the employee-only premium costs no more than
                about <strong>9.96%</strong> of your household income. Only the employee-only cost matters for this
                test — not the cost to add a spouse or children.
              </p>
              <p>If the plan fails this test, you may be able to get marketplace coverage with premium tax credits.</p>
            </div>
          </details>
        </div>
        <p className="text-sm text-slate-500">
          Related:{' '}
          <a href="/tools/job-plan-affordability" className="text-primary-600 hover:text-primary-700 underline">
            Does My Employer Plan Count?
          </a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Is your employer plan affordable under ACA rules?</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <p className="text-slate-700 leading-relaxed font-serif mb-3">
            This is based on a specific percentage of your household income. The threshold for 2026 is approximately
            9.96%. Here is what that means in practice:
          </p>
          <ul className="list-disc pl-5 text-slate-700 leading-relaxed font-serif space-y-2 mb-3">
            <li>Take your total household income for the year</li>
            <li>Multiply by 0.0996 (about 9.96%)</li>
            <li>Divide by 12 to get the monthly amount</li>
            <li>
              If the employee-only monthly premium is higher than that number, the plan may be considered unaffordable
            </li>
          </ul>
          <details className="group mt-4">
            <summary className="flex items-center justify-between cursor-pointer text-primary-600 font-medium hover:text-primary-700 transition-colors">
              <span>Example: $50,000 household income</span>
              <svg className="w-5 h-5 transition-transform group-open:rotate-180 shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-3 pt-3 border-t border-slate-100 text-slate-600 leading-relaxed font-serif">
              <p>
                $50,000 × 9.96% = $4,980 per year, or about $415 per month. If the employee-only premium is above
                $415/month, it may be considered unaffordable, and you could qualify for marketplace help.
              </p>
            </div>
          </details>
        </div>
        <p className="text-sm text-slate-500">
          Related:{' '}
          <a href="/tools/job-plan-affordability" className="text-primary-600 hover:text-primary-700 underline">
            Check your employer plan
          </a>{' '}
          |{' '}
          <a href="/glossary#affordability-test" className="text-primary-600 hover:text-primary-700 underline">
            Glossary: Affordability Test
          </a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. What is your household income?</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <p className="text-slate-700 leading-relaxed font-serif mb-3">
            The marketplace uses a specific income number called{' '}
            <strong>Modified Adjusted Gross Income (MAGI)</strong>. This includes:
          </p>
          <ul className="list-disc pl-5 text-slate-700 leading-relaxed font-serif space-y-2 mb-3">
            <li>Wages and salary</li>
            <li>Self-employment income</li>
            <li>Social Security benefits</li>
            <li>Unemployment compensation</li>
            <li>Investment income, rental income, alimony received (for agreements before 2019)</li>
          </ul>
          <p className="text-slate-700 leading-relaxed font-serif mb-3">
            Your MAGI determines where you fall on the Federal Poverty Level scale, which in turn determines the size
            of your premium tax credit and whether you qualify for cost-sharing reductions.
          </p>
          <details className="group mt-4">
            <summary className="flex items-center justify-between cursor-pointer text-primary-600 font-medium hover:text-primary-700 transition-colors">
              <span>How does income affect savings?</span>
              <svg className="w-5 h-5 transition-transform group-open:rotate-180 shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-3 pt-3 border-t border-slate-100 text-slate-600 leading-relaxed font-serif">
              <p className="mb-2">
                Lower income generally means more savings. People with income between 100% and 150% of FPL pay $0 per
                month for a benchmark Silver plan. As income rises, you are expected to pay a larger share. At 400%
                FPL and above, no premium tax credit is available for 2026. The enhanced subsidies that previously
                extended help above 400% FPL expired at the end of 2025.
              </p>
              <p>
                See the{' '}
                <a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">
                  2026 FPL guidelines
                </a>{' '}
                for the specific income ranges.
              </p>
            </div>
          </details>
        </div>
        <p className="text-sm text-slate-500">
          Related:{' '}
          <a href="/tools/what-income-counts" className="text-primary-600 hover:text-primary-700 underline">
            What Income Counts?
          </a>{' '}
          |{' '}
          <a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">
            Estimate Your Savings
          </a>{' '}
          |{' '}
          <a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">
            2026 FPL Guidelines
          </a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. How many people are in your household?</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <p className="text-slate-700 leading-relaxed font-serif mb-3">
            The marketplace counts everyone you claim on your tax return as part of your household. This usually
            includes:
          </p>
          <ul className="list-disc pl-5 text-slate-700 leading-relaxed font-serif space-y-2 mb-3">
            <li>You</li>
            <li>Your spouse (if filing jointly)</li>
            <li>Your tax dependents (including children under 26, in most cases)</li>
          </ul>
          <p className="text-slate-700 leading-relaxed font-serif">
            A larger household size means a higher Federal Poverty Level threshold for the same income, which could
            mean bigger savings. For example, $40,000 for a single person puts you at a different FPL percentage than
            $40,000 for a family of four.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Are you in a Medicaid expansion state?</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <p className="text-slate-700 leading-relaxed font-serif mb-3">
            This matters a lot for people with lower incomes. In states that have expanded Medicaid under the ACA,
            adults with income below about <strong>138% of the Federal Poverty Level</strong> generally qualify for
            Medicaid coverage, which has little to no monthly cost.
          </p>
          <p className="text-slate-700 leading-relaxed font-serif mb-3">
            In states that have <strong>not</strong> expanded Medicaid, there may be a &quot;coverage gap&quot; —
            where your income is too high for traditional Medicaid but too low for marketplace premium tax credits
            (which start at 100% FPL).
          </p>
          <details className="group mt-4">
            <summary className="flex items-center justify-between cursor-pointer text-primary-600 font-medium hover:text-primary-700 transition-colors">
              <span>How do I know if my state expanded Medicaid?</span>
              <svg className="w-5 h-5 transition-transform group-open:rotate-180 shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-3 pt-3 border-t border-slate-100 text-slate-600 leading-relaxed font-serif">
              <p>
                As of early 2026, most states have expanded Medicaid. A few holdout states have not. Check your state
                page on this site or{' '}
                <a href="/contact" className="text-primary-600 hover:text-primary-700 underline">
                  contact a licensed agent
                </a>{' '}
                to confirm your state&apos;s Medicaid eligibility.
              </p>
            </div>
          </details>
        </div>
        <p className="text-sm text-slate-500">
          Related:{' '}
          <a href="/states" className="text-primary-600 hover:text-primary-700 underline">
            Find your state
          </a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Did you experience a qualifying life event?</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <p className="text-slate-700 leading-relaxed font-serif mb-3">
            If it is not open enrollment season, you can still sign up for marketplace coverage if you had a qualifying
            life event within the last 60 days. Common qualifying events include:
          </p>
          <ul className="list-disc pl-5 text-slate-700 leading-relaxed font-serif space-y-2 mb-3">
            <li>Losing health coverage (from a job, Medicaid, COBRA, or a parent&apos;s plan)</li>
            <li>Getting married</li>
            <li>Having or adopting a baby</li>
            <li>Moving to a new ZIP code or county</li>
            <li>Changes in income that affect eligibility</li>
            <li>Turning 26 and aging off a parent&apos;s plan</li>
          </ul>
          <details className="group mt-4">
            <summary className="flex items-center justify-between cursor-pointer text-primary-600 font-medium hover:text-primary-700 transition-colors">
              <span>How long do I have to sign up after a qualifying event?</span>
              <svg className="w-5 h-5 transition-transform group-open:rotate-180 shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-3 pt-3 border-t border-slate-100 text-slate-600 leading-relaxed font-serif">
              <p>
                You generally have <strong>60 days</strong> from the date of the qualifying event to enroll in a
                marketplace plan. Some events (like having a baby) give 60 days after the birth. Missing this window
                means waiting until the next open enrollment period, unless another qualifying event happens.
              </p>
            </div>
          </details>
        </div>
      </section>

      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Quick Summary</h2>
        <div className="text-slate-700 leading-relaxed font-serif space-y-3">
          <p>You are most likely to qualify for marketplace savings if:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>You do not have affordable employer coverage</li>
            <li>
              Your household income is between 100% and 400% of the Federal Poverty Level (the subsidy cutoff
              for 2026)
            </li>
            <li>You are a U.S. citizen or lawfully present</li>
            <li>You are not currently incarcerated</li>
            <li>You are not eligible for Medicare</li>
          </ul>
          <p>
            The best way to know for sure is to{' '}
            <a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">
              estimate your savings
            </a>{' '}
            or apply through{' '}
            <a
              href="https://applyhealthinsuranceonline.com"
              className="text-primary-600 hover:text-primary-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ApplyHealthInsuranceOnline.com
            </a>
            .
          </p>
        </div>
      </section>

      <PageFaq faqs={faqs} />
      <SourcesBox sources={sources} />
      {/* NOTE: No name/NPN on this page — generic byline only */}
      <GenericByline dataSource="HealthInsuranceRenew editorial team" lastReviewed="2026-03-19" />
    </div>
  )
}
