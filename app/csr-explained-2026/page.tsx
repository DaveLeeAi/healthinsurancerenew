import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import AnswerBox from '../../components/AnswerBox'
import FAQSection from '../../components/FAQSection'
import SourcesBox from '../../components/SourcesBox'
import csrData from '../../data/config/csr-tiers.json'
import fplData from '../../data/config/fpl-current.json'

export const metadata: Metadata = {
  title: 'What Is Cost-Sharing Reduction (CSR) in 2026? | HealthInsuranceRenew',
  description:
    'Plain-English explanation of cost-sharing reductions (CSR) for 2026. See the three CSR tiers, who qualifies based on income, and how CSRs lower your health care costs.',
  alternates: { canonical: 'https://healthinsurancerenew.com/csr-explained-2026' },
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'CSR Explained 2026', url: '/csr-explained-2026' },
]

const tiers = csrData.tiers
const g = fplData.guidelines

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US')
}

const faqs = [
  {
    question: 'What is a cost-sharing reduction (CSR)?',
    answer:
      'A cost-sharing reduction is a discount that lowers the amount you pay out of pocket when you use health care. It reduces your deductible, copays, and out-of-pocket maximum. CSRs are only available on Silver plans bought through the health insurance marketplace.',
  },
  {
    question: 'Why do CSRs only apply to Silver plans?',
    answer:
      'This is how the ACA was written. Silver plans were chosen as the baseline because they offer a moderate level of coverage (70% actuarial value). CSRs effectively upgrade a Silver plan to cover 73%, 87%, or 94% of costs depending on your income, which can make a Silver plan perform like a Gold or Platinum plan at a lower price.',
  },
  {
    question: 'How do I know which CSR tier I qualify for?',
    answer:
      'Your CSR tier depends on your income as a percentage of the Federal Poverty Level. If your income is between 100% and 150% FPL, you get the 94% CSR (the most generous). Between 150% and 200% FPL gets you the 87% CSR. Between 200% and 250% FPL gets you the 73% CSR. Above 250% FPL, no CSR is available.',
  },
  {
    question: 'Do I have to do anything special to get CSRs?',
    answer:
      'No. If you qualify based on your income and you select a Silver plan through the marketplace, the cost-sharing reductions are applied automatically. You do not need to fill out a separate application. The lower deductibles and copays are built into the plan you receive.',
  },
  {
    question: 'Can I get a CSR if I buy a Bronze or Gold plan?',
    answer:
      'No. Cost-sharing reductions are only available on Silver-tier plans purchased through the health insurance marketplace. If you choose a Bronze, Gold, or Platinum plan, you will not receive CSR benefits, even if your income qualifies. You will still receive any premium tax credit you qualify for on any metal tier.',
  },
  {
    question: 'What is the difference between a premium tax credit and a CSR?',
    answer:
      'A premium tax credit lowers your monthly insurance payment (the premium). A cost-sharing reduction lowers what you pay when you actually use health care (deductibles, copays, out-of-pocket maximum). You can receive both at the same time if you qualify and choose a Silver plan.',
  },
]

const sources = [
  { title: 'Healthcare.gov - Cost-Sharing Reductions', url: 'https://www.healthcare.gov/choose-a-plan/plans-categories/' },
  { title: 'CMS - Actuarial Value', url: 'https://www.cms.gov/cciio/programs-and-initiatives/health-insurance-market-reforms/minimum-essential-coverage' },
  { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
]

const tierColors: Record<string, { bg: string; badge: string }> = {
  'Silver 94': { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800' },
  'Silver 87': { bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  'Silver 73': { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  'Standard Silver': { bg: 'bg-slate-50 border-slate-200', badge: 'bg-slate-100 text-slate-700' },
}

export default function CSRExplainedPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        What Is Cost-Sharing Reduction (CSR) in 2026?
      </h1>

      <AnswerBox answer="Cost-sharing reductions lower what you pay when you actually use health care — your deductible, copays, and out-of-pocket maximum. They are only available on Silver plans through the marketplace. The amount of savings depends on your income." />

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">What CSR Means in Practice</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          When you buy health insurance, you pay in two ways: your monthly <strong>premium</strong> (the bill to keep
          the plan) and your <strong>cost-sharing</strong> (deductibles, copays, and coinsurance when you get care).
          Premium tax credits help with the first part. Cost-sharing reductions help with the second.
        </p>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          With a CSR, your Silver plan is upgraded to cover a larger share of your medical costs. A standard Silver
          plan covers about 70% of average costs. With CSRs, that jumps to 73%, 87%, or 94% depending on your income.
          The premium stays the same — you just pay less when you visit the doctor, fill a prescription, or go to the
          hospital.
        </p>
        <p className="text-sm text-slate-500">
          Related:{' '}
          <a href="/glossary#cost-sharing-reduction--csr-" className="text-primary-600 hover:text-primary-700 underline">
            Glossary: CSR
          </a>{' '}
          |{' '}
          <a href="/glossary#deductible" className="text-primary-600 hover:text-primary-700 underline">
            Glossary: Deductible
          </a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Why CSRs Only Apply to Silver Plans</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          This is a rule set by the ACA itself. Silver plans were designated as the tier that qualifies for
          cost-sharing reductions. If you pick a Bronze, Gold, or Platinum plan, you will not get CSR benefits —
          even if your income qualifies. You will still get your premium tax credit on any tier, but the
          out-of-pocket savings from CSRs are Silver-only.
        </p>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          This is why enrollment counselors often recommend Silver plans for people with lower incomes. A Silver plan
          with a 94% CSR can actually provide better coverage than a Platinum plan, at a fraction of the monthly
          cost.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">The Three CSR Tiers</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-6">
          Each tier corresponds to an income range based on the{' '}
          <a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">
            Federal Poverty Level
          </a>
          . The lower your income, the more generous the cost-sharing reduction.
        </p>

        <div className="space-y-5">
          {tiers.filter((t) => t.name !== 'Standard Silver').map((tier) => {
            const colors = tierColors[tier.name] ?? { bg: 'bg-white border-slate-200', badge: 'bg-slate-100 text-slate-700' }
            const incomeSingle1 = fmt(Math.round(g.household_1 * tier.minFPL / 100))
            const incomeSingle2 = fmt(Math.round(g.household_1 * tier.maxFPL / 100))
            const incomeFamily1 = fmt(Math.round(g.household_4 * tier.minFPL / 100))
            const incomeFamily2 = fmt(Math.round(g.household_4 * tier.maxFPL / 100))

            return (
              <div key={tier.name} className={`border rounded-2xl p-5 ${colors.bg}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${colors.badge}`}>
                    {tier.actuarialValue}% CSR
                  </span>
                  <span className="text-sm text-slate-600">
                    Income: {tier.minFPL}%–{tier.maxFPL === 999 ? '400%+' : `${tier.maxFPL}%`} FPL
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-serif mb-3">{tier.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm mb-3">
                  <div className="bg-white/80 rounded-xl p-3">
                    <div className="font-bold text-slate-900">{fmt(tier.deductible)}</div>
                    <div className="text-slate-500 text-xs">Deductible</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3">
                    <div className="font-bold text-slate-900">{fmt(tier.oopMax)}</div>
                    <div className="text-slate-500 text-xs">OOP Max</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3">
                    <div className="font-bold text-slate-900">${tier.copayPrimary}</div>
                    <div className="text-slate-500 text-xs">Primary Care Copay</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3">
                    <div className="font-bold text-slate-900">${tier.copayGenericRx}</div>
                    <div className="text-slate-500 text-xs">Generic Rx Copay</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  2026 income range (single): {incomeSingle1}–{incomeSingle2} | Family of 4: {incomeFamily1}–{incomeFamily2}
                </p>
              </div>
            )
          })}

          <div className={`border rounded-2xl p-5 ${tierColors['Standard Silver'].bg}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${tierColors['Standard Silver'].badge}`}>
                No CSR (70%)
              </span>
              <span className="text-sm text-slate-600">Income: 250%+ FPL</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-serif mb-3">
              Above 250% FPL, no cost-sharing reductions apply. The plan covers the standard 70% actuarial value. You
              may still qualify for a premium tax credit, but the plan&apos;s deductible and out-of-pocket costs are
              at the standard Silver level.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
              <div className="bg-white/80 rounded-xl p-3">
                <div className="font-bold text-slate-900">{fmt(tiers[3].deductible)}</div>
                <div className="text-slate-500 text-xs">Deductible</div>
              </div>
              <div className="bg-white/80 rounded-xl p-3">
                <div className="font-bold text-slate-900">{fmt(tiers[3].oopMax)}</div>
                <div className="text-slate-500 text-xs">OOP Max</div>
              </div>
              <div className="bg-white/80 rounded-xl p-3">
                <div className="font-bold text-slate-900">${tiers[3].copayPrimary}</div>
                <div className="text-slate-500 text-xs">Primary Care Copay</div>
              </div>
              <div className="bg-white/80 rounded-xl p-3">
                <div className="font-bold text-slate-900">${tiers[3].copayGenericRx}</div>
                <div className="text-slate-500 text-xs">Generic Rx Copay</div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Source: {csrData.source}, {csrData.year}. Estimates based on national averages; actual plan values vary.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">CSR vs. No CSR: Why the Difference Is Huge</h2>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          To understand why this matters, consider someone with a low income who needs surgery. On a standard Silver
          plan, they might face a $5,000 deductible before coverage kicks in. On a 94% CSR Silver plan, the same
          surgery might only cost $75 out of pocket before the plan takes over.
        </p>
        <p className="text-slate-700 leading-relaxed font-serif mb-4">
          This is not just a small discount — it can mean the difference between being able to afford medical care and
          avoiding it entirely due to cost.
        </p>
        <p className="text-sm text-slate-500">
          Related:{' '}
          <a href="/tools/plan-comparison" className="text-primary-600 hover:text-primary-700 underline">
            Compare Plan Levels
          </a>{' '}
          |{' '}
          <a href="/aca-income-guide-2026" className="text-primary-600 hover:text-primary-700 underline">
            Health Insurance Savings by Income Level
          </a>
        </p>
      </section>

      <FAQSection faqs={faqs} />
      <SourcesBox sources={sources} />
    </div>
  )
}
