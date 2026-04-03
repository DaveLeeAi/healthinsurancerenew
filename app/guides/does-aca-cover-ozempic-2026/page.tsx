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

const PAGE_URL = `${SITE_URL}/guides/does-aca-cover-ozempic-2026`

export const metadata: Metadata = {
  title: 'Does ACA Cover Ozempic in 2026? What Marketplace Plans Include',
  description:
    'Ozempic (semaglutide) is covered by an estimated 82% of ACA marketplace plans for Type 2 diabetes, but almost never for weight loss. Learn coverage rules, costs, and alternatives for 2026.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'article',
    title: 'Does ACA Cover Ozempic in 2026? What Marketplace Plans Include',
    description:
      'Ozempic (semaglutide) is covered by an estimated 82% of ACA marketplace plans for Type 2 diabetes, but almost never for weight loss. Learn coverage rules, costs, and alternatives for 2026.',
    url: PAGE_URL,
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Does ACA Cover Ozempic in 2026? What Marketplace Plans Include',
    description:
      'Ozempic (semaglutide) is covered by an estimated 82% of ACA marketplace plans for Type 2 diabetes, but almost never for weight loss. Learn coverage rules, costs, and alternatives for 2026.',
  },
}

const FAQS = [
  {
    question: 'Does the ACA require plans to cover Ozempic?',
    answer:
      'ACA plans must cover at least one drug in each USP therapeutic category, including anti-diabetic agents. An estimated 82% of marketplace formularies include Ozempic for Type 2 diabetes. However, no ACA rule requires plans to cover Ozempic specifically \u2014 only that the anti-diabetic category has coverage.',
  },
  {
    question: 'Can I get Ozempic covered for weight loss through the marketplace?',
    answer:
      'Almost never. Only an estimated 1% of ACA marketplace plans cover any GLP-1 medication for weight management in 2026. The CMS USP Model Guidelines do not include a weight-loss drug category, so plans have no Essential Health Benefits obligation to cover it for that purpose.',
  },
  {
    question: 'How much does Ozempic cost without insurance in 2026?',
    answer:
      'Novo Nordisk cut the list price approximately 35% in January 2026. Through NovoCare Pharmacy, self-pay pricing is an estimated $349 per month for the 0.25mg to 1mg doses and an estimated $499 per month for the 2mg dose. The manufacturer also offers a Patient Assistance Program for uninsured people at or below 200% FPL.',
  },
  {
    question: 'What is prior authorization for Ozempic?',
    answer:
      'Prior authorization means your insurance company must approve the prescription before they will cover it. An estimated 99% of marketplace plans require prior authorization for Ozempic. Typical requirements include a confirmed Type 2 diabetes diagnosis, documented trial of metformin, and recent A1C lab results.',
  },
  {
    question: 'Does Medicare cover Ozempic for weight loss in 2026?',
    answer:
      'Medicare is launching the BALANCE Model for GLP-1 coverage starting July 2026, but this applies only to Medicare and Medicaid beneficiaries. The GLP-1 Bridge program offers an estimated $50 per month copay for Medicare enrollees. None of these programs apply to ACA marketplace plans.',
  },
]

export default function DoesAcaCoverOzempic2026Page() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Does ACA Cover Ozempic 2026', url: '/guides/does-aca-cover-ozempic-2026' },
  ]

  const articleSchema = getArticleSchema({
    article: {
      title: 'Does ACA Cover Ozempic in 2026? What Marketplace Plans Include',
      description:
        'Ozempic (semaglutide) is covered by an estimated 82% of ACA marketplace plans for Type 2 diabetes, but almost never for weight loss. Learn coverage rules, costs, and alternatives for 2026.',
      url: PAGE_URL,
      datePublished: '2026-03-29',
      dateModified: '2026-03-29',
      section: 'Guides',
    },
    breadcrumbs: [
      { name: 'Home', url: SITE_URL },
      { name: 'Guides', url: `${SITE_URL}/guides` },
      { name: 'Does ACA Cover Ozempic 2026', url: PAGE_URL },
    ],
    faqs: FAQS,
  })

  const drugSchema = generateDrugSchema({
    name: 'Ozempic',
    genericName: 'semaglutide',
    drugClass: 'GLP-1 receptor agonist',
    manufacturer: 'Novo Nordisk',
    administrationRoute: 'Subcutaneous injection',
    fdaApprovedIndications: ['Type 2 diabetes mellitus'],
    url: PAGE_URL,
  })

  // Merge Drug into @graph
  const fullSchema = {
    ...articleSchema,
    '@graph': [...(articleSchema['@graph'] as Record<string, unknown>[]), drugSchema],
  }

  return (
    <article className="max-w-[720px] mx-auto px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToJsonLd(fullSchema) }}
      />

      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
        Does ACA Cover Ozempic in 2026? What Marketplace Plans Include
      </h1>

      <TrustBar lastUpdated="March 29, 2026" reviewedDate="March 29, 2026" />

      <BLUFBox>
        Ozempic (semaglutide) is included on an estimated 82% of ACA marketplace plan
        formularies when prescribed for Type 2 diabetes. However, marketplace plans almost
        never cover Ozempic for weight loss. Only an estimated 1% of marketplace plans
        cover any GLP-1 medication for weight management in 2026.
      </BLUFBox>

      {/* ── The Short Answer ── */}
      <SectionHeading>The Short Answer: It Depends on Why Your Doctor Prescribes It</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        Ozempic is the same molecule (semaglutide) whether prescribed for diabetes or
        weight management. But your insurance coverage depends entirely on the reason
        it was prescribed:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li>
          <strong>Type 2 diabetes:</strong> Generally covered. ACA Essential Health
          Benefits require plans to include anti-diabetic medications, and an estimated
          82% of marketplace formularies list Ozempic for this indication.
        </li>
        <li>
          <strong>Weight loss:</strong> Almost never covered. The USP Model Guidelines
          that define required drug categories for ACA plans have no weight-loss drug
          category, so plans have no obligation to cover it.
        </li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-4">
        Same injection, same drug, completely different coverage outcome.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'KFF Marketplace Formulary Analysis', url: 'https://www.kff.org/health-reform/', description: 'Coverage rate estimates' },
          { name: 'CMS Essential Health Benefits', url: 'https://www.cms.gov/marketplace/resources/data/public-use-files', description: 'EHB framework and USP categories' },
        ]}
      />

      {/* ── Ozempic for Diabetes ── */}
      <SectionHeading>Ozempic Coverage for Type 2 Diabetes</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        An estimated 82% of marketplace formularies include Ozempic when prescribed
        for Type 2 diabetes. Plans typically place it on Tier 2 (preferred brand) or
        Tier 3 (non-preferred brand), with estimated copays of $35 to $70 per month
        after your deductible.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        Prior authorization is required by an estimated 99% of plans. Your prescriber
        will typically need to document:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li>A confirmed Type 2 diabetes diagnosis</li>
        <li>Documentation of trying first-line treatments (metformin)</li>
        <li>A1C levels above a specified threshold</li>
        <li>Prescribing provider&apos;s medical necessity documentation</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-4">
        Reauthorization is generally required every 6 to 12 months.
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Estimated from 2026 plan benefit filings. Actual copays depend on your specific
        plan, tier placement, and deductible status.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'KFF Formulary Analysis', url: 'https://www.kff.org/health-reform/' },
          { name: 'CMS Formulary Data', url: 'https://www.cms.gov/marketplace/resources/data/public-use-files' },
        ]}
      />

      {/* ── Ozempic for Weight Loss ── */}
      <SectionHeading>Ozempic for Weight Loss: Why Plans Do Not Cover It</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        The CMS USP Model Guidelines define which drug categories ACA plans must cover.
        There is no weight-loss drug category in the current guidelines. Because ACA plans
        are only required to cover at least one drug per USP category, most plans choose
        not to include weight-loss medications.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        The Biden administration proposed in late 2023 switching the EHB formulary framework
        from USP MMG to USP DC (Drug Classification), which includes weight-loss drug
        categories and would have required ACA plan coverage of anti-obesity medications.
        This was never finalized. The Trump administration&apos;s April 2025 CY2026 final
        rule explicitly declined to move forward with this change.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        As a result, marketplace coverage for weight-loss GLP-1 drugs remains extremely
        limited:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li>
          <strong>Wegovy</strong> (semaglutide 2.4mg, FDA-approved for weight loss):
          included on an estimated 1% of marketplace formularies.
        </li>
        <li>
          <strong>Zepbound</strong> (tirzepatide, FDA-approved for weight loss):
          included on an estimated 0% of marketplace formularies.
        </li>
      </ul>
      <DataSourceAttribution
        sources={[
          { name: 'CMS CY2026 Final Rule', url: 'https://www.cms.gov/marketplace', description: 'USP classification decision' },
          { name: 'KFF Marketplace Formulary Analysis', url: 'https://www.kff.org/health-reform/' },
        ]}
      />

      {/* ── Medicare GLP-1 Coverage ── */}
      <SectionHeading>What About Medicare GLP-1 Coverage?</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        CMS announced the BALANCE Model in December 2025 for Medicare and Medicaid
        beneficiaries only. This includes:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li>
          <strong>Medicare GLP-1 Bridge</strong> (launching July 2026): estimated
          $50 per month copay for eligible Medicare enrollees.
        </li>
        <li>
          <strong>Full BALANCE Model</strong> (January 2027): estimated $245 net
          price per 30-day supply for Medicare/Medicaid.
        </li>
        <li>
          <strong>IRA-negotiated prices</strong> for Ozempic, Rybelsus, and Wegovy
          ($274 per 30-day supply) take effect in 2027 under the Inflation Reduction
          Act drug negotiation program.
        </li>
      </ul>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-4">
        <p className="text-gray-800 font-medium">
          None of these programs apply to ACA marketplace plans. They are exclusively
          for Medicare and Medicaid beneficiaries.
        </p>
      </div>
      <DataSourceAttribution
        sources={[
          { name: 'CMS BALANCE Model', url: 'https://www.cms.gov/', description: 'Medicare/Medicaid GLP-1 program' },
          { name: 'IRA Drug Negotiation Program', url: 'https://www.cms.gov/inflation-reduction-act-and-medicare' },
        ]}
      />

      {/* ── Out-of-Pocket Costs ── */}
      <SectionHeading>Estimated Out-of-Pocket Costs in 2026</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        Novo Nordisk cut the Ozempic list price approximately 35% in January 2026, from
        $1,027 to $675 per month. Current pricing options include:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Scenario</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">Estimated Monthly Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="px-4 py-2.5">List price (before discounts)</td><td className="text-right px-4 py-2.5">~$675 per month</td></tr>
            <tr><td className="px-4 py-2.5">Retail pharmacy (no discount)</td><td className="text-right px-4 py-2.5">~$840 &ndash; $1,000 per month</td></tr>
            <tr><td className="px-4 py-2.5">NovoCare self-pay (0.25mg &ndash; 1mg)</td><td className="text-right px-4 py-2.5">~$349 per month</td></tr>
            <tr><td className="px-4 py-2.5">NovoCare self-pay (2mg)</td><td className="text-right px-4 py-2.5">~$499 per month</td></tr>
            <tr><td className="px-4 py-2.5">Commercial insurance + savings card</td><td className="text-right px-4 py-2.5">~$25 &ndash; $150 per month</td></tr>
            <tr><td className="px-4 py-2.5">Average out-of-pocket (employer plans)</td><td className="text-right px-4 py-2.5">~$70 per month</td></tr>
            <tr className="bg-green-50"><td className="px-4 py-2.5">Novo Nordisk PAP (uninsured, &le;200% FPL)</td><td className="text-right px-4 py-2.5 font-medium text-green-700">$0</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Estimated from manufacturer pricing and plan benefit filings. Actual cost depends
        on your plan, pharmacy, deductible status, and eligibility for assistance programs.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'Novo Nordisk / NovoCare.com', url: 'https://www.novocare.com/', description: 'Self-pay and PAP pricing' },
        ]}
      />

      {/* ── How to Check Your Plan ── */}
      <SectionHeading>How to Check if Your Plan Covers Ozempic</SectionHeading>
      <ol className="list-decimal pl-6 text-gray-700 space-y-3 mb-4">
        <li>
          Go to{' '}
          <a href="https://www.healthcare.gov" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Healthcare.gov
          </a>{' '}
          and sign in to your account.
        </li>
        <li>Find your plan name and look for &ldquo;Plan Documents.&rdquo;</li>
        <li>Open the prescription drug list (formulary) PDF.</li>
        <li>
          Search for &ldquo;semaglutide&rdquo; or &ldquo;Ozempic.&rdquo; Note the tier
          number and any codes next to it.
        </li>
        <li>
          Common codes to look for: <strong>PA</strong> (prior authorization required),{' '}
          <strong>ST</strong> (step therapy &mdash; must try another drug first),{' '}
          <strong>QL</strong> (quantity limits on how much you may receive per month).
        </li>
      </ol>
      <p className="text-gray-700 leading-relaxed mb-4">
        If Ozempic is not on your formulary and your doctor believes it is medically
        necessary, you may request a formulary exception from your insurance company.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'Healthcare.gov', url: 'https://www.healthcare.gov/', description: 'Plan lookup and formulary access' },
          { name: 'CMS Marketplace Guidance', url: 'https://www.cms.gov/marketplace' },
        ]}
      />

      {/* ── Patient Assistance ── */}
      <SectionHeading>Patient Assistance and Savings Programs</SectionHeading>
      <ul className="list-disc pl-6 text-gray-700 space-y-3 mb-4">
        <li>
          <strong>Novo Nordisk Patient Assistance Program (PAP):</strong> Free medication
          for uninsured patients with household income at or below 200% FPL (approximately
          $31,300 for a single person). Medicare patients are no longer eligible for PAP
          as of 2026.
        </li>
        <li>
          <strong>Ozempic Savings Card:</strong> Reduces costs to as low as $25 per month
          for commercially insured patients (maximum savings $100 to $150 per 28-day
          supply, valid up to 48 months). Not available for people with government
          insurance (Medicare, Medicaid, VA, TRICARE).
        </li>
        <li>
          <strong>NovoCare Pharmacy:</strong> Self-pay pricing at reduced rates without
          insurance ($349 per month for lower doses, $499 per month for 2mg dose).
        </li>
      </ul>
      <DataSourceAttribution
        sources={[
          { name: 'NovoCare.com', url: 'https://www.novocare.com/', description: 'Patient assistance and savings programs' },
          { name: 'Ozempic.com', url: 'https://www.ozempic.com/', description: 'Savings card details' },
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
