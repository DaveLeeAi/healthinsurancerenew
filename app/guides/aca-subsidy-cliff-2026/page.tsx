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

const PAGE_URL = `${SITE_URL}/guides/aca-subsidy-cliff-2026`

export const metadata: Metadata = {
  title: 'ACA Subsidy Cliff 2026: What It Means for Your Health Insurance Premiums',
  description:
    'The enhanced ACA subsidies expired December 31, 2025. Learn how the subsidy cliff affects your 2026 marketplace premiums, who lost financial help, and what you may do next.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'article',
    title: 'ACA Subsidy Cliff 2026: What It Means for Your Health Insurance Premiums',
    description:
      'The enhanced ACA subsidies expired December 31, 2025. Learn how the subsidy cliff affects your 2026 marketplace premiums, who lost financial help, and what you may do next.',
    url: PAGE_URL,
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'ACA Subsidy Cliff 2026: What It Means for Your Health Insurance Premiums',
    description:
      'The enhanced ACA subsidies expired December 31, 2025. Learn how the subsidy cliff affects your 2026 marketplace premiums, who lost financial help, and what you may do next.',
  },
}

const FAQS = [
  {
    question: 'What is the ACA subsidy cliff in 2026?',
    answer:
      'The subsidy cliff is the income threshold above which you receive zero premium tax credit on ACA marketplace plans. In 2026, that threshold is 400% of the Federal Poverty Level \u2014 an estimated $62,600 for a single person. Earning even one dollar above that amount means you pay the full unsubsidized premium.',
  },
  {
    question: 'Did the enhanced ACA subsidies expire?',
    answer:
      'Yes. The enhanced premium tax credits from the American Rescue Plan and Inflation Reduction Act expired on December 31, 2025. No extension had been signed into law as of March 2026. The original ACA subsidy rules, including the cliff at 400% FPL, are now back in effect.',
  },
  {
    question: 'What income is too high for ACA subsidies in 2026?',
    answer:
      'If your modified adjusted gross income exceeds 400% of the Federal Poverty Level, you receive no marketplace subsidy in 2026. That is an estimated $62,600 for one person, $84,600 for a family of two, and $128,600 for a family of four based on 2025 HHS Poverty Guidelines.',
  },
  {
    question: 'How much more may I pay for health insurance in 2026?',
    answer:
      'It depends on your income, age, and location. KFF estimates that subsidized marketplace enrollees may face an estimated 114% average premium increase. A 60-year-old earning just above 400% FPL may see premiums rise from an estimated $5,440 per year to an estimated $14,931 per year.',
  },
  {
    question: 'What states are helping with ACA subsidy losses?',
    answer:
      'As of March 2026, at least 10 states have implemented mitigation measures. New Mexico fully replaced lost federal premium tax credits with enrollment up 20%. Connecticut allocated $70 million in state subsidies. Washington State provides $55 per month for those still receiving federal credits and $250 per month for those who lost eligibility.',
  },
]

export default function AcaSubsidyCliff2026Page() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'ACA Subsidy Cliff 2026', url: '/guides/aca-subsidy-cliff-2026' },
  ]

  const schema = getArticleSchema({
    article: {
      title: 'ACA Subsidy Cliff 2026: What It Means for Your Health Insurance Premiums',
      description:
        'The enhanced ACA subsidies expired December 31, 2025. Learn how the subsidy cliff affects your 2026 marketplace premiums, who lost financial help, and what you may do next.',
      url: PAGE_URL,
      datePublished: '2026-03-29',
      dateModified: '2026-03-29',
      section: 'Guides',
    },
    breadcrumbs: [
      { name: 'Home', url: SITE_URL },
      { name: 'Guides', url: `${SITE_URL}/guides` },
      { name: 'ACA Subsidy Cliff 2026', url: PAGE_URL },
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
        ACA Subsidy Cliff 2026: What It Means for Your Health Insurance Premiums
      </h1>

      <TrustBar lastUpdated="March 29, 2026" lastUpdatedIso="2026-03-29" reviewedDate="March 29, 2026" reviewedDateIso="2026-03-29" />

      <BLUFBox>
        The enhanced ACA premium tax credits expired on December 31, 2025. If your
        household income is above 400% of the Federal Poverty Level (estimated $62,600
        for one person in 2026), you no longer receive any premium subsidy. Marketplace
        enrollees may see estimated premium increases averaging over 100% compared to 2025.
      </BLUFBox>

      {/* ── Section: What Is the ACA Subsidy Cliff? ── */}
      <SectionHeading>What Is the ACA Subsidy Cliff?</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        The &ldquo;subsidy cliff&rdquo; is the income cutoff above which you receive
        zero financial help paying for an ACA marketplace health plan. In 2026, that
        cutoff is 400% of the Federal Poverty Level.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        From 2021 through 2025, the American Rescue Plan Act and Inflation Reduction Act
        temporarily eliminated this cliff. During that period, no one paid more than 8.5%
        of household income for the benchmark Silver plan, regardless of how much they
        earned. There was no income ceiling.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        Those enhanced premium tax credits expired on December 31, 2025. As of March 2026,
        no extension has been signed into law. The original ACA rules are back in effect:
        premium contribution percentages range from 2.10% to 9.96% of income, and anyone
        earning above 400% FPL receives zero subsidy.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'IRS Revenue Procedure 2025-25', url: 'https://www.irs.gov/irb/2025-25_IRB' },
          { name: 'CMS.gov', url: 'https://www.cms.gov/marketplace' },
        ]}
      />

      {/* ── Section: 2026 Premium Contribution Percentages ── */}
      <SectionHeading>2026 Premium Contribution Percentages</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        Under the original ACA rules now back in effect, the percentage of income you are
        expected to pay toward your benchmark Silver plan premium depends on where your
        income falls relative to the Federal Poverty Level.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Income as % of FPL</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">2026 Applicable Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="px-4 py-2.5">Below 133%</td><td className="px-4 py-2.5">2.10%</td></tr>
            <tr><td className="px-4 py-2.5">133% &ndash; 150%</td><td className="px-4 py-2.5">3.14% &ndash; 4.19%</td></tr>
            <tr><td className="px-4 py-2.5">150% &ndash; 200%</td><td className="px-4 py-2.5">4.19% &ndash; 6.60%</td></tr>
            <tr><td className="px-4 py-2.5">200% &ndash; 250%</td><td className="px-4 py-2.5">6.60% &ndash; 8.44%</td></tr>
            <tr><td className="px-4 py-2.5">250% &ndash; 300%</td><td className="px-4 py-2.5">8.44% &ndash; 9.96%</td></tr>
            <tr><td className="px-4 py-2.5">300% &ndash; 400%</td><td className="px-4 py-2.5">9.96%</td></tr>
            <tr className="bg-red-50"><td className="px-4 py-2.5 font-medium">Above 400%</td><td className="px-4 py-2.5 font-medium text-red-700">No subsidy</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-gray-700 leading-relaxed mb-4">
        Compare this with the expired enhanced rules, which capped contributions at
        0% to 8.5% of income with no upper income limit. The shift at 150% FPL is
        particularly stark: consumers who previously paid $0 for the benchmark plan
        now pay approximately 4.19% of income &mdash; roughly $82 per month for a
        single person.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'IRS Revenue Procedure 2025-25', url: 'https://www.irs.gov/irb/2025-25_IRB', description: 'Applicable percentage table for 2026' },
        ]}
      />

      {/* ── Section: 2026 Federal Poverty Level Guidelines ── */}
      <SectionHeading>2026 Federal Poverty Level Guidelines</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        The 2025 HHS Poverty Guidelines apply to the 2026 coverage year. These
        thresholds determine your subsidy eligibility.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Household Size</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">100% FPL</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">150% FPL</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">200% FPL</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">250% FPL</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">400% FPL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-4 py-2.5">1 person</td>
              <td className="text-right px-4 py-2.5">$15,650</td>
              <td className="text-right px-4 py-2.5">$23,475</td>
              <td className="text-right px-4 py-2.5">$31,300</td>
              <td className="text-right px-4 py-2.5">$39,125</td>
              <td className="text-right px-4 py-2.5 font-medium">$62,600</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5">2 people</td>
              <td className="text-right px-4 py-2.5">$21,150</td>
              <td className="text-right px-4 py-2.5">$31,725</td>
              <td className="text-right px-4 py-2.5">$42,300</td>
              <td className="text-right px-4 py-2.5">$52,875</td>
              <td className="text-right px-4 py-2.5 font-medium">$84,600</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5">3 people</td>
              <td className="text-right px-4 py-2.5">$26,650</td>
              <td className="text-right px-4 py-2.5">$39,975</td>
              <td className="text-right px-4 py-2.5">$53,300</td>
              <td className="text-right px-4 py-2.5">$66,625</td>
              <td className="text-right px-4 py-2.5 font-medium">$106,600</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5">4 people</td>
              <td className="text-right px-4 py-2.5">$32,150</td>
              <td className="text-right px-4 py-2.5">$48,225</td>
              <td className="text-right px-4 py-2.5">$64,300</td>
              <td className="text-right px-4 py-2.5">$80,375</td>
              <td className="text-right px-4 py-2.5 font-medium">$128,600</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="px-4 py-2.5 text-gray-500">Each additional person</td>
              <td className="text-right px-4 py-2.5 text-gray-500">+$5,500</td>
              <td className="text-right px-4 py-2.5 text-gray-500">+$8,250</td>
              <td className="text-right px-4 py-2.5 text-gray-500">+$11,000</td>
              <td className="text-right px-4 py-2.5 text-gray-500">+$13,750</td>
              <td className="text-right px-4 py-2.5 text-gray-500">+$22,000</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Based on 2025 HHS Poverty Guidelines applied to 2026 plan year. The 2026 HHS
        Poverty Guidelines (published January 13, 2026) set the single-person threshold
        at $15,960, but those apply to 2027 coverage. Actual amounts depend on your
        modified adjusted gross income (MAGI).
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'HHS Poverty Guidelines', url: 'https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines', description: 'Federal Register, 2025 guidelines' },
        ]}
      />

      {/* ── Section: How Much More May You Pay? ── */}
      <SectionHeading>How Much More May You Pay?</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        The impact depends on your age, income, and where you live. Here is one example
        showing how the cliff works in practice:
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-4 space-y-3">
        <p className="text-gray-800 leading-relaxed">
          <strong>Example 1:</strong> A 60-year-old earning $64,000 (409% FPL)
          paid roughly $5,440 per year for the benchmark Silver plan under the enhanced
          rules. In 2026, that same person pays the full unsubsidized premium of
          approximately $14,931 per year &mdash; a difference of nearly $10,000 annually.
        </p>
        <p className="text-gray-800 leading-relaxed">
          <strong>Example 2:</strong> A 60-year-old couple at 402% FPL (approximately
          $85,000 income) could face roughly $22,600 per year in premiums &mdash; about
          25% of their income.
        </p>
        <p className="text-gray-800 leading-relaxed">
          <strong>The cliff in action:</strong> Someone earning $62,000 (just below
          400% FPL) pays approximately $6,175 per year. Someone earning $64,000 (just
          above) pays approximately $14,931. A $2,000 income difference creates an
          abrupt jump of thousands of dollars.
        </p>
      </div>
      <p className="text-gray-700 leading-relaxed mb-4">
        According to KFF analysis, subsidized marketplace enrollees may face an estimated
        114% average premium increase &mdash; from an estimated $888 per year in 2025 to
        an estimated $1,904 per year in 2026. ACA marketplace insurance companies raised premiums
        approximately 26% on average, with benchmark Silver plans increasing 30%.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        The Congressional Budget Office estimates approximately 2.2 million more people
        may become uninsured in 2026 than if enhanced subsidies had continued, with gross
        benchmark premiums rising 4.3% in 2026 and 7.7% in 2027 due to adverse selection
        from healthier enrollees dropping coverage. The Urban Institute and Commonwealth
        Fund project approximately 4.8 million Americans may drop coverage entirely, with
        the Black uninsured population projected to increase by 30% (925,000 people).
        Insurance companies proposed a median 18% premium increase specifically reflecting anticipated
        adverse selection from subsidy expiration.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        CBO estimates total marketplace enrollment could fall to 12.5 million by 2028
        without an extension.
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Estimated figures based on published analyses. Actual premium changes depend on
        your specific plan, age, tobacco use, and rating area.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'KFF Analysis', url: 'https://www.kff.org/health-reform/', description: 'Marketplace premium impact estimates' },
          { name: 'Congressional Budget Office', url: 'https://www.cbo.gov/', description: 'Coverage loss projections' },
        ]}
      />

      {/* ── Section: What Congress Has Done So Far ── */}
      <SectionHeading>What Congress Has Done So Far</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        The U.S. House of Representatives passed a clean three-year extension of the
        enhanced premium tax credits on January 8, 2026, by a vote of 230 to 196. The
        vote included 17 Republicans joining all Democrats via a bipartisan discharge
        petition.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        The Senate has not reached the 60 votes needed to advance the legislation.
        Bipartisan Senate negotiations led by Sen. Bernie Moreno (R-OH) collapsed over
        disputes about abortion restrictions, HSA diversions, and income caps. President
        Trump threatened a veto of the clean extension. No legislation has advanced
        further as of late March 2026.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        ACA marketplace enrollment has already declined: approximately 23 million people
        selected plans for 2026, down from 24.3 million in 2025 &mdash; at least 1.2
        million fewer plan selections.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'Congress.gov', url: 'https://www.congress.gov/', description: 'H.R. 5145 status' },
        ]}
      />

      {/* ── Section: State-Level Responses ── */}
      <SectionHeading>State-Level Responses</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        At least 10 states have implemented mitigation measures. Three notable examples:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li><strong>New Mexico:</strong> Fully replaced lost federal premium tax credits for all enrollees. Enrollment is up 20% year-over-year.</li>
        <li><strong>Connecticut:</strong> Allocated $70 million to offset expiring subsidies.</li>
        <li><strong>Washington State:</strong> Provides $55 per month for those still receiving federal credits and $250 per month for those who lost eligibility entirely.</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-4">
        Most states have not taken action. If you live in a state without supplemental
        subsidies, the federal rules apply in full.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'State Exchange Reports', url: 'https://www.cms.gov/marketplace/resources/data/public-use-files', description: 'State-level subsidy replacement programs' },
        ]}
      />

      {/* ── Section: What You May Do Next ── */}
      <SectionHeading>What You May Do Next</SectionHeading>
      <ul className="list-disc pl-6 text-gray-700 space-y-3 mb-4">
        <li>
          <strong>Check your 2026 subsidy eligibility</strong> at{' '}
          <a href="https://www.healthcare.gov" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Healthcare.gov
          </a>.
          Your premium tax credit amount depends on your income, household size, and the
          benchmark Silver plan premium in your area.
        </li>
        <li>
          <strong>Compare plans carefully.</strong> You may qualify for a $0-premium Bronze
          plan through silver loading. When insurance companies add CSR costs to Silver premiums only,
          the subsidy calculated from the inflated Silver price can cover the full Bronze
          premium in many areas.
        </li>
        <li>
          <strong>If your income is near 400% FPL,</strong> strategies like HSA contributions
          or traditional IRA/401(k) contributions may lower your modified adjusted gross
          income and help you remain subsidy-eligible.
        </li>
        <li>
          <strong>Consider Silver CSR plans</strong> if your income is 100% to 250% FPL.
          Cost-sharing reductions may significantly lower your deductible and out-of-pocket
          maximum at no additional premium cost.
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
