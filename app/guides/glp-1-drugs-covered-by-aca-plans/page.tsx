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
import {
  getArticleSchema,
  generateDrugSchema,
  SITE_URL,
  schemaToJsonLd,
} from '../../../lib/schema'

const PAGE_URL = `${SITE_URL}/guides/glp-1-drugs-covered-by-aca-plans`

export const metadata: Metadata = {
  title: 'GLP-1 Drugs Covered by ACA Plans: 2026 Formulary Guide',
  description:
    'Most ACA marketplace plans cover GLP-1 drugs like Ozempic and Mounjaro for diabetes but not for weight loss. See which drugs are covered, typical costs, and how to check your plan\u2019s formulary.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'article',
    title: 'GLP-1 Drugs Covered by ACA Plans: 2026 Formulary Guide',
    description:
      'Most ACA marketplace plans cover GLP-1 drugs like Ozempic and Mounjaro for diabetes but not for weight loss. See which drugs are covered, typical costs, and how to check your plan\u2019s formulary.',
    url: PAGE_URL,
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'GLP-1 Drugs Covered by ACA Plans: 2026 Formulary Guide',
    description:
      'Most ACA marketplace plans cover GLP-1 drugs like Ozempic and Mounjaro for diabetes but not for weight loss. See which drugs are covered, typical costs, and how to check your plan\u2019s formulary.',
  },
}

const FAQS = [
  {
    question: 'Which GLP-1 drugs are covered by ACA plans?',
    answer:
      'Most ACA marketplace plans cover GLP-1 drugs prescribed for Type 2 diabetes, including Ozempic (estimated 82% of formularies), Rybelsus (estimated 73%), Trulicity, and Mounjaro. Coverage for weight-loss GLP-1 drugs like Wegovy (estimated 1%) and Zepbound (estimated 0%) is extremely rare on marketplace plans.',
  },
  {
    question: 'Why don\u2019t ACA plans cover GLP-1 drugs for weight loss?',
    answer:
      'ACA plans follow the USP Model Guidelines to determine which drug categories they must cover. The current guidelines do not include a weight-loss drug category. Without that category, plans have no Essential Health Benefits obligation to cover GLP-1 medications for weight management, even though they may cover the same drug for diabetes.',
  },
  {
    question: 'How do I check if my marketplace plan covers Ozempic or Mounjaro?',
    answer:
      'Sign in at Healthcare.gov, find your plan, and open the Plan Documents section. Download the prescription drug list (formulary) PDF. Search for the drug name and note the tier number and any codes like PA (prior authorization), ST (step therapy), or QL (quantity limits).',
  },
  {
    question: 'What states require GLP-1 coverage for weight loss?',
    answer:
      'Only nine states have any marketplace plans covering GLP-1 drugs for weight management: California, North Dakota, New York, Vermont, Pennsylvania, West Virginia, Rhode Island, Delaware, and Georgia. North Dakota was the first state to mandate coverage through its EHB benchmark effective January 2025.',
  },
  {
    question: 'How much do GLP-1 drugs cost without insurance in 2026?',
    answer:
      'Self-pay pricing varies by drug and manufacturer program. Through NovoCare Pharmacy, Ozempic costs an estimated $349 to $675 per month depending on dose. Wegovy ranges from an estimated $149 to $549 per month. Zepbound is approximately $549 per month. Manufacturer patient assistance programs may provide free medication for eligible uninsured individuals.',
  },
]

export default function Glp1DrugsCoveredPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'GLP-1 Drugs Covered by ACA Plans', url: '/guides/glp-1-drugs-covered-by-aca-plans' },
  ]

  const articleSchema = getArticleSchema({
    article: {
      title: 'GLP-1 Drugs Covered by ACA Plans: 2026 Formulary Guide',
      description:
        'Most ACA marketplace plans cover GLP-1 drugs like Ozempic and Mounjaro for diabetes but not for weight loss. See which drugs are covered, typical costs, and how to check your plan\u2019s formulary.',
      url: PAGE_URL,
      datePublished: '2026-03-29',
      dateModified: '2026-03-29',
      section: 'Guides',
    },
    breadcrumbs: [
      { name: 'Home', url: SITE_URL },
      { name: 'Guides', url: `${SITE_URL}/guides` },
      { name: 'GLP-1 Drugs Covered by ACA Plans', url: PAGE_URL },
    ],
    faqs: FAQS,
  })

  const ozempicDrug = generateDrugSchema({
    name: 'Ozempic',
    genericName: 'semaglutide',
    drugClass: 'GLP-1 receptor agonist',
    manufacturer: 'Novo Nordisk',
    administrationRoute: 'Subcutaneous injection',
    fdaApprovedIndications: ['Type 2 diabetes mellitus'],
    url: `${SITE_URL}/guides/does-aca-cover-ozempic-2026`,
  })

  const mounjaroDrug = generateDrugSchema({
    name: 'Mounjaro',
    genericName: 'tirzepatide',
    drugClass: 'GLP-1/GIP receptor agonist',
    manufacturer: 'Eli Lilly',
    administrationRoute: 'Subcutaneous injection',
    fdaApprovedIndications: ['Type 2 diabetes mellitus'],
  })

  const fullSchema = {
    ...articleSchema,
    '@graph': [
      ...(articleSchema['@graph'] as Record<string, unknown>[]),
      ozempicDrug,
      mounjaroDrug,
    ],
  }

  return (
    <article className="max-w-[720px] mx-auto px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToJsonLd(fullSchema) }}
      />

      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
        GLP-1 Drugs Covered by ACA Plans: 2026 Formulary Guide
      </h1>

      <TrustBar lastUpdated="March 29, 2026" lastUpdatedIso="2026-03-29" reviewedDate="March 29, 2026" reviewedDateIso="2026-03-29" />

      <BLUFBox>
        ACA marketplace plans generally cover GLP-1 medications when prescribed for
        Type 2 diabetes. An estimated 82% of formularies include Ozempic for diabetes.
        However, only an estimated 1% of marketplace plans cover any GLP-1 drug for
        weight management. Coverage depends on your specific plan, the prescribing
        indication, and your state.
      </BLUFBox>

      {/* ── GLP-1 Drugs Available in 2026 ── */}
      <SectionHeading>GLP-1 Drugs Available in 2026</SectionHeading>

      <SectionHeading level={3}>FDA-Approved for Type 2 Diabetes</SectionHeading>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Drug</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Active Ingredient</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Form</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Manufacturer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="px-4 py-2.5 font-medium">Ozempic</td><td className="px-4 py-2.5">Semaglutide</td><td className="px-4 py-2.5">Weekly injection</td><td className="px-4 py-2.5">Novo Nordisk</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Rybelsus</td><td className="px-4 py-2.5">Semaglutide</td><td className="px-4 py-2.5">Daily oral tablet</td><td className="px-4 py-2.5">Novo Nordisk</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Mounjaro</td><td className="px-4 py-2.5">Tirzepatide (dual GIP/GLP-1)</td><td className="px-4 py-2.5">Weekly injection</td><td className="px-4 py-2.5">Eli Lilly</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Trulicity</td><td className="px-4 py-2.5">Dulaglutide</td><td className="px-4 py-2.5">Weekly injection</td><td className="px-4 py-2.5">Eli Lilly</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Victoza</td><td className="px-4 py-2.5">Liraglutide</td><td className="px-4 py-2.5">Daily injection</td><td className="px-4 py-2.5">Novo Nordisk</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Bydureon BCise</td><td className="px-4 py-2.5">Exenatide ER</td><td className="px-4 py-2.5">Weekly injection</td><td className="px-4 py-2.5">AstraZeneca</td></tr>
          </tbody>
        </table>
      </div>

      <SectionHeading level={3}>FDA-Approved for Weight Management</SectionHeading>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Drug</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Active Ingredient</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Form</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="px-4 py-2.5 font-medium">Wegovy</td><td className="px-4 py-2.5">Semaglutide 2.4mg</td><td className="px-4 py-2.5">Weekly injection</td><td className="px-4 py-2.5">Original formulation</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Wegovy (oral)</td><td className="px-4 py-2.5">Semaglutide 25mg</td><td className="px-4 py-2.5">Daily oral tablet</td><td className="px-4 py-2.5">FDA approved Dec 22, 2025</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Wegovy HD</td><td className="px-4 py-2.5">Semaglutide 7.2mg</td><td className="px-4 py-2.5">Weekly injection</td><td className="px-4 py-2.5">FDA approved March 19, 2026</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Zepbound</td><td className="px-4 py-2.5">Tirzepatide</td><td className="px-4 py-2.5">Weekly injection</td><td className="px-4 py-2.5">Also approved for sleep apnea</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Saxenda</td><td className="px-4 py-2.5">Liraglutide 3.0mg</td><td className="px-4 py-2.5">Daily injection</td><td className="px-4 py-2.5">Older generation</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-gray-700 leading-relaxed mb-4">
        In the pipeline: orforglipron (Eli Lilly, oral non-peptide GLP-1, under FDA review),
        CagriSema (Novo Nordisk, cagrilintide/semaglutide combo, FDA response expected 2026),
        and aleniglipron (Structure Therapeutics, positive Phase 2 data announced March 2026).
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'FDA Drug Approvals', url: 'https://www.fda.gov/drugs', description: 'FDA-approved indications and approval dates' },
        ]}
      />

      {/* ── Marketplace Coverage Rates ── */}
      <SectionHeading>Marketplace Formulary Coverage Rates</SectionHeading>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Drug</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Indication</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">Estimated Coverage Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="px-4 py-2.5 font-medium">Ozempic</td><td className="px-4 py-2.5">Diabetes</td><td className="text-right px-4 py-2.5">~82%</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Rybelsus</td><td className="px-4 py-2.5">Diabetes</td><td className="text-right px-4 py-2.5">~73%</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Trulicity</td><td className="px-4 py-2.5">Diabetes</td><td className="text-right px-4 py-2.5">Majority of plans</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Mounjaro</td><td className="px-4 py-2.5">Diabetes</td><td className="text-right px-4 py-2.5">Growing coverage</td></tr>
            <tr className="bg-red-50"><td className="px-4 py-2.5 font-medium">Wegovy</td><td className="px-4 py-2.5">Weight loss</td><td className="text-right px-4 py-2.5 text-red-700">~1%</td></tr>
            <tr className="bg-red-50"><td className="px-4 py-2.5 font-medium">Zepbound</td><td className="px-4 py-2.5">Weight loss</td><td className="text-right px-4 py-2.5 text-red-700">~0%</td></tr>
            <tr className="bg-red-50"><td className="px-4 py-2.5 font-medium">Saxenda</td><td className="px-4 py-2.5">Weight loss</td><td className="text-right px-4 py-2.5 text-red-700">~1%</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-gray-700 leading-relaxed mb-4">
        The gap exists because of how ACA Essential Health Benefits are structured. Plans
        must cover at least one drug in each USP therapeutic category. The current USP
        Model Guidelines do not include a weight-loss drug category, so plans have no
        obligation to include GLP-1 drugs for weight management.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        Coverage for weight loss is actively declining: an estimated 3.6 million enrollees
        had access to at least one GLP-1 for obesity in 2024, compared to an estimated
        2.8 million in 2026. Blue Cross Blue Shield of Massachusetts discontinued Wegovy,
        Saxenda, and Zepbound coverage effective January 1, 2026. Only an estimated 26
        out of 300 marketplace carriers offer any GLP-1 obesity coverage.
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Estimated from federal plan data and published analyses. Actual formulary
        inclusion varies by carrier, state, and plan year.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'KFF Marketplace Formulary Analysis', url: 'https://www.kff.org/health-reform/' },
          { name: 'CMS EHB Framework', url: 'https://www.cms.gov/marketplace/resources/data/public-use-files' },
        ]}
      />

      {/* ── Typical Costs With Insurance ── */}
      <SectionHeading>Typical Costs With Insurance</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        When covered for diabetes, GLP-1 drugs are usually placed on Tier 2 (preferred
        brand) or Tier 3 (non-preferred brand). Typical estimated costs:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li><strong>Tier 2 or Tier 3 copay:</strong> estimated $35 to $70 per month after deductible</li>
        <li><strong>Specialty tier (if applicable):</strong> estimated $300+ per month with 25% to 33% coinsurance</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-4">
        Nearly all plans apply prior authorization, quantity limits, or both. Step therapy
        (requiring a trial of metformin first) affects fewer than 25% of plans. Specialty
        tier placement (common for Mounjaro) carries 25% to 33% coinsurance, potentially
        meaning $300 or more per month before manufacturer assistance.
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Estimated from 2026 federal plan data. Actual cost depends on your plan, tier
        placement, pharmacy, and deductible status.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'CMS Formulary Data', url: 'https://www.cms.gov/marketplace/resources/data/public-use-files' },
        ]}
      />

      {/* ── How to Check Your Plan's Formulary ── */}
      <SectionHeading>How to Check Your Plan&apos;s Formulary</SectionHeading>
      <ol className="list-decimal pl-6 text-gray-700 space-y-3 mb-4">
        <li>
          Go to{' '}
          <a href="https://www.healthcare.gov" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Healthcare.gov
          </a>{' '}
          and sign in to your account.
        </li>
        <li>Find your plan and look for &ldquo;Plan Documents&rdquo; or &ldquo;Formulary.&rdquo;</li>
        <li>Download the prescription drug list PDF.</li>
        <li>Search for the drug by brand name or generic name.</li>
        <li>
          Note the tier number and any restriction codes:
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>PA</strong> &mdash; Prior authorization required before the plan will cover it</li>
            <li><strong>ST</strong> &mdash; Step therapy required (must try another drug first)</li>
            <li><strong>QL</strong> &mdash; Quantity limits on how much you may receive per month</li>
          </ul>
        </li>
      </ol>
      <p className="text-gray-700 leading-relaxed mb-4">
        If a drug is not on your formulary and your doctor believes it is medically
        necessary, you may request a formulary exception. Your plan must respond within
        72 hours (24 hours for urgent requests).
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'Healthcare.gov', url: 'https://www.healthcare.gov/', description: 'Plan lookup and formulary access' },
          { name: 'KFF', url: 'https://www.kff.org/health-reform/' },
        ]}
      />

      {/* ── States With GLP-1 Weight Loss Coverage ── */}
      <SectionHeading>States With GLP-1 Weight Loss Coverage</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        Only nine states have any marketplace plans that cover GLP-1 drugs for weight
        management:
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-4">
        <p className="text-gray-800 font-medium mb-2">States with some marketplace GLP-1 obesity coverage:</p>
        <p className="text-gray-700">
          California, North Dakota, New York, Vermont, Pennsylvania, West Virginia,
          Rhode Island, Delaware, Georgia
        </p>
      </div>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li>
          <strong>North Dakota:</strong> First state to mandate coverage through its EHB
          benchmark (effective January 1, 2025), covering GLP-1/GIP drugs for prevention
          of diabetes and treatment of insulin resistance, metabolic syndrome, or morbid
          obesity.
        </li>
        <li>
          <strong>New Mexico:</strong> EHB benchmark includes weight-loss medication coverage.
        </li>
        <li>
          <strong>California (AB 575):</strong> Would direct health plans to cover at least
          one anti-obesity medication, but not yet enacted. The California Health Benefits
          Review Program estimated it would cost approximately $1.5 billion in Year 2
          premiums.
        </li>
        <li>
          <strong>Mississippi:</strong> Passed the legislature but was vetoed by the governor
          due to fiscal concerns.
        </li>
      </ul>
      <DataSourceAttribution
        sources={[
          { name: 'State Exchange Data', url: 'https://www.cms.gov/marketplace', description: 'EHB benchmark plans by state' },
          { name: 'Pharmacy Times', url: 'https://www.pharmacytimes.com/', description: 'State mandate tracking' },
        ]}
      />

      {/* ── Costs Without Insurance ── */}
      <SectionHeading>Estimated Costs Without Insurance</SectionHeading>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Drug</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">Estimated Self-Pay Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="px-4 py-2.5 font-medium">Ozempic</td><td className="text-right px-4 py-2.5">~$349 &ndash; $675 per month</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Wegovy (pill, lower doses)</td><td className="text-right px-4 py-2.5">~$149 per month</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Wegovy (injection)</td><td className="text-right px-4 py-2.5">~$549 per month</td></tr>
            <tr><td className="px-4 py-2.5 font-medium">Zepbound (vials, 5mg)</td><td className="text-right px-4 py-2.5">~$549 per month</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-gray-700 leading-relaxed mb-4">
        Novo Nordisk&apos;s January 2026 price cut reduced list prices approximately 35% to
        50% across its GLP-1 portfolio. NovoCare Pharmacy offers self-pay pricing at
        reduced rates. Manufacturer patient assistance programs may provide free medication
        for eligible uninsured individuals with income at or below 200% FPL.
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Estimated from manufacturer pricing and published sources. Actual cost depends
        on dose, pharmacy, and eligibility for assistance programs.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'NovoCare.com', url: 'https://www.novocare.com/', description: 'Self-pay and PAP pricing' },
        ]}
      />

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
