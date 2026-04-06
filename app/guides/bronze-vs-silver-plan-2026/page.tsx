import type { Metadata } from 'next'
import {
  TrustBar,
  BLUFBox,
  CMSDisclaimer,
  AuthorBioBox,
  DataSourceAttribution,
  SectionHeading,
} from '../../../components/trust'
import Breadcrumbs from '../../../components/Breadcrumbs'
import { getArticleSchema, SITE_URL, schemaToJsonLd } from '../../../lib/schema'

const PAGE_URL = `${SITE_URL}/guides/bronze-vs-silver-plan-2026`

export const metadata: Metadata = {
  title: 'Bronze vs Silver ACA Plan 2026: Which Metal Tier Is Right for You?',
  description:
    'Compare Bronze and Silver ACA marketplace plans for 2026. Learn about cost-sharing reductions on Silver plans, the new HSA eligibility for all Bronze plans, deductibles, and which tier may save you the most.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'article',
    title: 'Bronze vs Silver ACA Plan 2026: Which Metal Tier Is Right for You?',
    description:
      'Compare Bronze and Silver ACA marketplace plans for 2026. Learn about cost-sharing reductions on Silver plans, the new HSA eligibility for all Bronze plans, deductibles, and which tier may save you the most.',
    url: PAGE_URL,
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Bronze vs Silver ACA Plan 2026: Which Metal Tier Is Right for You?',
    description:
      'Compare Bronze and Silver ACA marketplace plans for 2026. Learn about cost-sharing reductions on Silver plans, the new HSA eligibility for all Bronze plans, deductibles, and which tier may save you the most.',
  },
}

const FAQS = [
  {
    question: 'What is the difference between Bronze and Silver ACA plans?',
    answer:
      'Bronze plans cover approximately 60% of average healthcare costs, while Silver plans cover approximately 70%. Bronze plans have lower monthly premiums but higher deductibles and out-of-pocket costs. Silver plans cost more monthly but offer access to cost-sharing reductions if your income is 100% to 250% of the Federal Poverty Level.',
  },
  {
    question: 'What are cost-sharing reductions on Silver plans?',
    answer:
      'Cost-sharing reductions lower your deductible, copays, and out-of-pocket maximum on Silver plans purchased through the marketplace. They are available only to enrollees with income between 100% and 250% FPL. At 100% to 150% FPL, a Silver plan may have a deductible as low as an estimated $80 and a maximum out-of-pocket of $3,500.',
  },
  {
    question: 'Are all Bronze plans HSA-eligible in 2026?',
    answer:
      'Yes. The One Big Beautiful Bill Act effective January 1, 2026, made all Bronze and Catastrophic marketplace plans automatically HSA-eligible high-deductible health plans. You no longer need to verify that a Bronze plan meets the standard HDHP deductible and out-of-pocket thresholds to contribute to a Health Savings Account.',
  },
  {
    question: 'What is silver loading and how does it affect my premiums?',
    answer:
      'Silver loading is when insurance companies add the cost of unfunded cost-sharing reductions to Silver plan premiums only. Because marketplace subsidies are calculated from the inflated Silver benchmark premium, the resulting larger subsidy can make Bronze plans free or Gold plans cheaper than Silver in many areas.',
  },
  {
    question: 'What is the out-of-pocket maximum for ACA plans in 2026?',
    answer:
      'The 2026 out-of-pocket maximum is $10,600 for individual coverage and $21,200 for family coverage. This was revised upward from the initially finalized amounts of $10,150 and $20,300. Once you reach the out-of-pocket maximum, your plan pays 100% of covered services for the rest of the year.',
  },
]

export default function BronzeVsSilverPlan2026Page() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Bronze vs Silver Plan 2026', url: '/guides/bronze-vs-silver-plan-2026' },
  ]

  const schema = getArticleSchema({
    article: {
      title: 'Bronze vs Silver ACA Plan 2026: Which Metal Tier Is Right for You?',
      description:
        'Compare Bronze and Silver ACA marketplace plans for 2026. Learn about cost-sharing reductions on Silver plans, the new HSA eligibility for all Bronze plans, deductibles, and which tier may save you the most.',
      url: PAGE_URL,
      datePublished: '2026-03-29',
      dateModified: '2026-03-29',
      section: 'Guides',
    },
    breadcrumbs: [
      { name: 'Home', url: SITE_URL },
      { name: 'Guides', url: `${SITE_URL}/guides` },
      { name: 'Bronze vs Silver Plan 2026', url: PAGE_URL },
    ],
    faqs: FAQS,
  })

  return (
    <article className="max-w-[720px] mx-auto px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToJsonLd(schema) }}
      />

      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
        Bronze vs Silver ACA Plan 2026: Which Metal Tier Is Right for You?
      </h1>

      <TrustBar lastUpdated="March 29, 2026" reviewedDate="March 29, 2026" />

      <BLUFBox>
        For 2026, all Bronze ACA marketplace plans are now HSA-eligible. If your income
        is between 100% and 250% of the Federal Poverty Level, Silver plans with
        cost-sharing reductions may offer significantly lower deductibles and out-of-pocket
        costs. Your best choice depends on your income, expected healthcare use, and
        whether you want HSA tax advantages.
      </BLUFBox>

      {/* ── What the Metal Tiers Mean ── */}
      <SectionHeading>What the Metal Tiers Mean</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        ACA marketplace plans are organized into metal tiers based on actuarial value
        &mdash; the average percentage of healthcare costs the plan pays:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Metal Tier</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">Plan Pays (Average)</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">You Pay (Average)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="bg-amber-50"><td className="px-4 py-2.5 font-medium">Bronze</td><td className="text-right px-4 py-2.5">60%</td><td className="text-right px-4 py-2.5">40%</td></tr>
            <tr className="bg-gray-100"><td className="px-4 py-2.5 font-medium">Silver</td><td className="text-right px-4 py-2.5">70%</td><td className="text-right px-4 py-2.5">30%</td></tr>
            <tr className="bg-yellow-50"><td className="px-4 py-2.5 font-medium">Gold</td><td className="text-right px-4 py-2.5">80%</td><td className="text-right px-4 py-2.5">20%</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Platinum</td><td className="text-right px-4 py-2.5">90%</td><td className="text-right px-4 py-2.5">10%</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-gray-700 leading-relaxed mb-4">
        Actuarial value is an average across all enrollees, not a guarantee. Your actual
        costs depend on what services you use. A Bronze plan still covers preventive care
        at 100% before deductible, just like every other tier.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'Healthcare.gov', url: 'https://www.healthcare.gov/', description: 'Metal tier definitions' },
          { name: 'CMS', url: 'https://www.cms.gov/marketplace' },
        ]}
      />

      {/* ── Premiums and Deductibles ── */}
      <SectionHeading>2026 Premiums and Deductibles at a Glance</SectionHeading>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Metric</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">Bronze (est.)</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">Silver (est.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="px-4 py-2.5">Average gross monthly premium</td><td className="text-right px-4 py-2.5">~$456</td><td className="text-right px-4 py-2.5">~$625</td></tr>
            <tr><td className="px-4 py-2.5">Premium difference</td><td className="text-right px-4 py-2.5" colSpan={2}>~$169 per month (~$2,028 per year)</td></tr>
            <tr><td className="px-4 py-2.5">Average deductible</td><td className="text-right px-4 py-2.5">~$7,186 &ndash; $7,476</td><td className="text-right px-4 py-2.5">~$5,304</td></tr>
            <tr><td className="px-4 py-2.5">Out-of-pocket maximum</td><td className="text-right px-4 py-2.5">$10,600</td><td className="text-right px-4 py-2.5">$10,600</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-gray-700 leading-relaxed mb-4">
        ACA marketplace insurance companies raised premiums approximately 26% on average in 2026,
        with benchmark Silver plans on Healthcare.gov states increasing 30%. The 2026
        out-of-pocket maximum is $10,600 for individual coverage and $21,200 for family
        coverage &mdash; a 15.2% increase from 2025. This was revised upward from the
        initially finalized $10,150/$20,300 after the Trump administration changed the
        premium adjustment percentage methodology in June 2025.
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Estimated averages from published analyses. Actual premiums and deductibles vary
        by carrier, plan, age, and rating area.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'Peterson-KFF Health System Tracker', url: 'https://www.healthsystemtracker.org/', description: 'Premium and deductible averages' },
          { name: 'CMS 2026 Payment Notice', url: 'https://www.cms.gov/marketplace', description: 'Out-of-pocket maximum revision' },
        ]}
      />

      {/* ── Cost-Sharing Reductions ── */}
      <SectionHeading>Cost-Sharing Reductions: Why Silver Plans May Transform at Lower Incomes</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        Cost-sharing reductions (CSRs) are available only on Silver plans purchased
        through the marketplace. They lower your deductible, copays, and out-of-pocket
        maximum based on income. In 2025, 53% of marketplace enrollees received some
        form of CSR, covering over 12.5 million people.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Income Level</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">Actuarial Value</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">Est. Deductible</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">Est. Max OOP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="px-4 py-2.5">Standard Silver (no CSR)</td><td className="text-right px-4 py-2.5">70%</td><td className="text-right px-4 py-2.5">~$5,304</td><td className="text-right px-4 py-2.5">$10,600</td></tr>
            <tr><td className="px-4 py-2.5">200% &ndash; 250% FPL</td><td className="text-right px-4 py-2.5">73%</td><td className="text-right px-4 py-2.5">~$3,727</td><td className="text-right px-4 py-2.5">$8,450</td></tr>
            <tr className="bg-green-50"><td className="px-4 py-2.5">150% &ndash; 200% FPL</td><td className="text-right px-4 py-2.5">87%</td><td className="text-right px-4 py-2.5">~$790</td><td className="text-right px-4 py-2.5">$3,500</td></tr>
            <tr className="bg-green-50"><td className="px-4 py-2.5 font-medium">100% &ndash; 150% FPL</td><td className="text-right px-4 py-2.5 font-medium">94%</td><td className="text-right px-4 py-2.5 font-medium">~$80</td><td className="text-right px-4 py-2.5 font-medium">$3,500</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-gray-700 leading-relaxed mb-4">
        At 100% to 150% FPL, a Silver CSR plan has 94% actuarial value &mdash;
        better than Platinum. The estimated deductible drops to approximately $80 and
        the maximum out-of-pocket is $3,500. This level of benefit is not available on
        any other metal tier at any price.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        KFF calculates the breakeven point is remarkably low: a 40-year-old earning
        an estimated $22,000 per year (141% FPL) paying approximately $794 per year for
        Silver with CSR breaks even versus a $0-premium Bronze plan at just an estimated
        $874 in total annual health costs.
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Estimated from CMS cost-sharing reduction guidelines. Actual plan benefits
        vary by carrier and state.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'KFF', url: 'https://www.kff.org/health-reform/', description: 'CSR enrollment and benefit analysis' },
          { name: 'CMS Cost-Sharing Reduction Guidelines', url: 'https://www.cms.gov/marketplace' },
        ]}
      />

      {/* ── HSA Advantage ── */}
      <SectionHeading>The New HSA Advantage for Bronze Plans</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        The One Big Beautiful Bill Act (OBBBA), effective January 1, 2026, made all
        Bronze and Catastrophic marketplace plans automatically qualify as HSA-eligible
        high-deductible health plans (HDHPs). This was confirmed by IRS Notice 2026-5
        (December 9, 2025). Previously, many Bronze plans failed to qualify due to
        pre-deductible coverage of certain services. Standard HDHP parameters ($1,700
        minimum deductible for self-only, $8,500 maximum out-of-pocket) are waived for
        ACA Bronze plans under the new law.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-4">
        <p className="text-gray-800 font-medium mb-2">2026 HSA Contribution Limits:</p>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Self-only coverage: $4,400</li>
          <li>Family coverage: $8,750</li>
          <li>Catch-up contribution (age 55+): additional $1,000</li>
        </ul>
      </div>
      <p className="text-gray-700 leading-relaxed mb-4">
        HSAs offer a triple tax advantage: contributions are tax-deductible, growth is
        tax-free, and withdrawals for qualified medical expenses are tax-free. This makes
        Bronze plans particularly attractive for healthy enrollees who want to maximize
        tax savings while maintaining catastrophic coverage.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'IRS Notice 2026-5', url: 'https://www.irs.gov/', description: 'OBBBA HSA provisions' },
          { name: 'IRS Revenue Procedure 2025-19', url: 'https://www.irs.gov/', description: '2026 HSA limits' },
        ]}
      />

      {/* ── Silver Loading ── */}
      <SectionHeading>Silver Loading: How It May Make Bronze Plans Free</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        Since 2017, the federal government has not reimbursed insurance companies for the cost of
        providing cost-sharing reductions. To recoup these costs, insurance companies add the CSR
        expense to Silver plan premiums only &mdash; a practice known as &ldquo;silver
        loading.&rdquo;
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        Here is why this matters for you: marketplace premium tax credits are calculated
        from the second-lowest-cost Silver plan (the benchmark). Because silver loading
        inflates Silver premiums, the benchmark is higher, and your subsidy is larger.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        When that larger subsidy is applied to a non-inflated Bronze plan, the net premium
        may be $0. In some areas, a Gold plan may cost less than Silver after subsidies
        &mdash; sometimes called &ldquo;Gold plan arbitrage.&rdquo;
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'KFF Silver Loading Analysis', url: 'https://www.kff.org/health-reform/', description: 'How CSR loading affects benchmark premiums' },
        ]}
      />

      {/* ── When Bronze Makes Sense ── */}
      <SectionHeading>When Bronze May Make More Sense</SectionHeading>
      <ul className="list-disc pl-6 text-gray-700 space-y-3 mb-4">
        <li>
          <strong>You are generally healthy</strong> with low expected healthcare use
          and primarily need coverage for preventive care and emergencies.
        </li>
        <li>
          <strong>You want the HSA triple-tax advantage.</strong> All Bronze plans are
          now HSA-eligible in 2026, letting you save and invest pre-tax dollars for
          healthcare.
        </li>
        <li>
          <strong>Your income is above 250% FPL.</strong> At this income level, you do
          not qualify for meaningful cost-sharing reductions on Silver plans.
        </li>
        <li>
          <strong>You want the lowest possible monthly premium</strong> and are
          comfortable accepting a higher deductible in exchange.
        </li>
      </ul>

      {/* ── When Silver Makes Sense ── */}
      <SectionHeading>When Silver May Make More Sense</SectionHeading>
      <ul className="list-disc pl-6 text-gray-700 space-y-3 mb-4">
        <li>
          <strong>Your income is 100% to 250% FPL.</strong> The cost-sharing reductions
          available only on Silver plans may dramatically reduce your deductible and
          out-of-pocket costs.
        </li>
        <li>
          <strong>You have chronic conditions or regular medical needs.</strong> The
          lower deductible and copays on Silver CSR plans may save you significantly
          over a plan year.
        </li>
        <li>
          <strong>You want lower worst-case exposure.</strong> A Silver CSR plan at
          150% to 200% FPL has an estimated $3,500 maximum out-of-pocket, compared
          to $10,600 on a standard Bronze or Silver plan.
        </li>
        <li>
          <strong>Your income is 150% to 200% FPL.</strong> At this level, a Silver
          plan has 87% actuarial value &mdash; approaching Platinum-level coverage at
          a Silver price.
        </li>
      </ul>

      {/* ── FAQ Section ── */}
      <SectionHeading id="faq">Frequently Asked Questions</SectionHeading>
      <div className="space-y-4 mb-8">
        {FAQS.map((faq, i) => (
          <details key={i} className="border border-gray-200 rounded-lg" open={i === 0}>
            <summary className="px-5 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
              {faq.question}
            </summary>
            <div className="px-5 pb-4 text-gray-700 leading-relaxed">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>

      <CMSDisclaimer />
      <AuthorBioBox />
    </article>
  )
}
