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

const PAGE_URL = `${SITE_URL}/guides/how-to-read-your-sbc`

export const metadata: Metadata = {
  title: 'How to Read Your Summary of Benefits and Coverage (SBC) in 2026',
  description:
    'Your SBC is a standardized document that shows exactly what your health plan covers. Learn how to read each section, compare plans, and find your SBC on Healthcare.gov.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'article',
    title: 'How to Read Your Summary of Benefits and Coverage (SBC) in 2026',
    description:
      'Your SBC is a standardized document that shows exactly what your health plan covers. Learn how to read each section, compare plans, and find your SBC on Healthcare.gov.',
    url: PAGE_URL,
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'How to Read Your Summary of Benefits and Coverage (SBC) in 2026',
    description:
      'Your SBC is a standardized document that shows exactly what your health plan covers. Learn how to read each section, compare plans, and find your SBC on Healthcare.gov.',
  },
}

const FAQS = [
  {
    question: 'What is a Summary of Benefits and Coverage?',
    answer:
      'A Summary of Benefits and Coverage (SBC) is a standardized document that every health plan must provide under ACA Section 2715. It uses a uniform template so you can compare any two plans side by side. The SBC shows your deductible, copays, coinsurance, out-of-pocket maximum, and covered services in plain language.',
  },
  {
    question: 'How do I find my SBC on Healthcare.gov?',
    answer:
      'Sign in to your Healthcare.gov account, find your plan name, and look for the Plan Documents section. The SBC is typically labeled "Summary of Benefits and Coverage" as a downloadable PDF. You may also request a copy directly from your insurance company, which must provide it within 7 business days.',
  },
  {
    question: 'What is the out-of-pocket maximum for 2026 ACA plans?',
    answer:
      'The 2026 out-of-pocket maximum is $10,600 for individual coverage and $21,200 for family coverage. This was revised upward from the initially finalized $10,150 and $20,300. Once you reach this amount in a plan year, your insurance pays 100% of covered services for the remainder of the year.',
  },
  {
    question: 'What are the three coverage examples in an SBC?',
    answer:
      'Every SBC includes three standardized scenarios: Peg is Having a Baby (prenatal care and normal delivery), Mia has a Simple Fracture (emergency room, X-ray, and physical therapy), and Managing Joe\u2019s Type 2 Diabetes (routine care and prescriptions). These identical scenarios appear on every SBC so you can compare costs directly.',
  },
  {
    question: 'What is the difference between a copay and coinsurance?',
    answer:
      'A copay is a fixed dollar amount you pay for a service, like $30 for a doctor visit. Coinsurance is a percentage you pay, like 20% of the total bill. Both apply after your deductible unless the service has pre-deductible coverage. Your SBC shows which cost-sharing type applies to each service.',
  },
]

export default function HowToReadYourSbcPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'How to Read Your SBC', url: '/guides/how-to-read-your-sbc' },
  ]

  const schema = getArticleSchema({
    article: {
      title: 'How to Read Your Summary of Benefits and Coverage (SBC) in 2026',
      description:
        'Your SBC is a standardized document that shows exactly what your health plan covers. Learn how to read each section, compare plans, and find your SBC on Healthcare.gov.',
      url: PAGE_URL,
      datePublished: '2026-03-29',
      dateModified: '2026-03-29',
      section: 'Guides',
    },
    breadcrumbs: [
      { name: 'Home', url: SITE_URL },
      { name: 'Guides', url: `${SITE_URL}/guides` },
      { name: 'How to Read Your SBC', url: PAGE_URL },
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
        How to Read Your Summary of Benefits and Coverage (SBC) in 2026
      </h1>

      <TrustBar lastUpdated="March 29, 2026" lastUpdatedIso="2026-03-29" reviewedDate="March 29, 2026" reviewedDateIso="2026-03-29" />

      <BLUFBox>
        The Summary of Benefits and Coverage is a standardized document every health
        plan must provide under ACA Section 2715. It uses a uniform template so you can
        compare any two plans side by side. Your SBC shows your deductible, copays,
        coinsurance, out-of-pocket maximum, and covered services in plain language.
      </BLUFBox>

      {/* ── What Is an SBC ── */}
      <SectionHeading>What Is an SBC and Why Does It Matter?</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        The Summary of Benefits and Coverage (SBC) is a plain-language document that
        every health plan in the United States must provide. It was created by ACA
        Section 2715 (amending the Public Health Service Act) so consumers could compare
        health plans without reading hundreds of pages of policy documents.
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li>Uses a uniform four-double-sided-page template (plus coverage examples) &mdash; the same layout for every plan from every insurer</li>
        <li>Designed as a &ldquo;nutrition label&rdquo; for health insurance</li>
        <li>Plans must provide it within 7 business days of your request</li>
        <li>Penalty for failing to provide: up to $1,000 per offense</li>
        <li>Current template: April 2017 edition (OMB control number 0938-1146, PRA expiration May 31, 2026)</li>
        <li>The September 2025 CLAS Guidance update added new language taglines and translated SBC versions but made no substantive content changes to the template</li>
      </ul>
      <DataSourceAttribution
        sources={[
          { name: 'CMS SBC Template', url: 'https://www.cms.gov/marketplace', description: 'Uniform SBC template requirements' },
          { name: 'ACA Section 2715', url: 'https://www.healthcare.gov/', description: 'Public Health Service Act amendment' },
        ]}
      />

      {/* ── Page-by-Page Guide ── */}
      <SectionHeading>Page-by-Page Guide to Your SBC</SectionHeading>

      <SectionHeading level={3}>Page 1: Important Questions</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        The first page identifies your plan and answers seven &ldquo;Important Questions&rdquo;
        with a &ldquo;Why This Matters&rdquo; column explaining each answer. This page covers:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li><strong>Overall deductible:</strong> How much you pay before the plan starts paying</li>
        <li><strong>Pre-deductible services:</strong> What the plan covers before you meet the deductible (usually preventive care)</li>
        <li><strong>Out-of-pocket limit:</strong> The most you pay in a year before the plan covers 100%</li>
        <li><strong>Network requirements:</strong> Whether you need to use specific doctors and hospitals</li>
        <li><strong>Referral rules:</strong> Whether you need a referral to see a specialist</li>
      </ul>

      <SectionHeading level={3}>Pages 2 &ndash; 3: Common Medical Events</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        This is the core of your SBC. It organizes healthcare into common scenarios and
        shows what you pay for each:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
        <li>Doctor visits (primary care and specialist)</li>
        <li>Tests (diagnostic and imaging)</li>
        <li>Drugs (organized by four tiers: generic, preferred brand, non-preferred brand, specialty)</li>
        <li>Outpatient surgery (facility and physician fees)</li>
        <li>Emergency room and urgent care</li>
        <li>Hospital stays</li>
        <li>Mental health and substance use disorder services</li>
        <li>Pregnancy (prenatal, delivery, and postnatal)</li>
        <li>Recovery and rehabilitation</li>
        <li>Children&apos;s dental and vision</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-4">
        Each row shows your in-network cost, any out-of-network cost, and limitations
        or exceptions. Read the limitations column carefully &mdash; it often contains
        visit limits, prior authorization requirements, or exclusions.
      </p>

      <SectionHeading level={3}>Page 4: Rights and Notices</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        The final page covers your rights to continue coverage, how to file appeals
        and grievances, minimum essential coverage (MEC) and minimum value (MV)
        standards, and language assistance taglines.
      </p>

      <SectionHeading level={3}>Page 5: Coverage Examples</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        Three standardized scenarios showing estimated total costs. These are identical
        across all SBCs so you can compare plans directly.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'CMS SBC Template', url: 'https://www.cms.gov/marketplace' },
          { name: 'Healthcare.gov', url: 'https://www.healthcare.gov/' },
        ]}
      />

      {/* ── Key Insurance Terms ── */}
      <SectionHeading>Key Insurance Terms You Need to Know</SectionHeading>
      <div className="space-y-4 mb-4">
        <div className="border-l-4 border-blue-400 pl-4">
          <p className="font-semibold text-gray-900">Deductible</p>
          <p className="text-gray-700">The amount you pay out of your own pocket for covered services before your insurance starts paying. For example, with a $5,000 deductible, you pay the first $5,000 of covered costs each year.</p>
        </div>
        <div className="border-l-4 border-blue-400 pl-4">
          <p className="font-semibold text-gray-900">Copayment (copay)</p>
          <p className="text-gray-700">A fixed dollar amount you pay for a covered service. For example, $30 for a primary care visit or $50 for a specialist visit. Copays may apply before or after your deductible depending on the plan.</p>
        </div>
        <div className="border-l-4 border-blue-400 pl-4">
          <p className="font-semibold text-gray-900">Coinsurance</p>
          <p className="text-gray-700">Your share of costs expressed as a percentage. For example, 20% coinsurance means you pay 20% and the plan pays 80%. Coinsurance typically applies after you meet your deductible.</p>
        </div>
        <div className="border-l-4 border-blue-400 pl-4">
          <p className="font-semibold text-gray-900">Out-of-pocket maximum</p>
          <p className="text-gray-700">The most you pay during a plan year. After reaching this amount, the plan pays 100% of covered services. For 2026, the limit is $10,600 for individual and $21,200 for family coverage. For cost-sharing reduction Silver plans, reduced limits apply: $3,500/$7,000 for enrollees at 100% to 200% FPL and $8,450/$16,900 for those at 200% to 250% FPL.</p>
        </div>
        <div className="border-l-4 border-blue-400 pl-4">
          <p className="font-semibold text-gray-900">Premium</p>
          <p className="text-gray-700">Your monthly payment for the health plan, regardless of whether you use any healthcare services that month. Premiums do not count toward your deductible or out-of-pocket maximum.</p>
        </div>
        <div className="border-l-4 border-blue-400 pl-4">
          <p className="font-semibold text-gray-900">Prior authorization</p>
          <p className="text-gray-700">Approval your insurance company must give before it will cover certain services or medications. If you skip prior authorization, the plan may not pay for the service.</p>
        </div>
        <div className="border-l-4 border-blue-400 pl-4">
          <p className="font-semibold text-gray-900">Formulary</p>
          <p className="text-gray-700">Your plan&apos;s list of covered prescription drugs, organized into tiers. Lower tiers generally have lower costs. Your SBC references the formulary but the full drug list is a separate document.</p>
        </div>
        <div className="border-l-4 border-blue-400 pl-4">
          <p className="font-semibold text-gray-900">Network</p>
          <p className="text-gray-700">The group of doctors, hospitals, and pharmacies your plan has contracted with for lower rates. Using out-of-network providers usually costs more, and some plan types (HMO, EPO) may not cover out-of-network care at all except in emergencies.</p>
        </div>
      </div>
      <DataSourceAttribution
        sources={[
          { name: 'Healthcare.gov Uniform Glossary', url: 'https://www.healthcare.gov/', description: 'Standardized health insurance terms' },
        ]}
      />

      {/* ── Coverage Examples ── */}
      <SectionHeading>The Three Coverage Examples Explained</SectionHeading>
      <p className="text-gray-700 leading-relaxed mb-4">
        Every SBC includes three identical scenarios so you can compare estimated costs
        across plans:
      </p>
      <div className="space-y-4 mb-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <p className="font-semibold text-gray-900 mb-1">Peg is Having a Baby</p>
          <p className="text-gray-700 text-sm">Nine months of prenatal care plus a normal vaginal delivery. Shows estimated costs for office visits, lab work, hospital stay, and newborn care.</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <p className="font-semibold text-gray-900 mb-1">Mia Has a Simple Fracture</p>
          <p className="text-gray-700 text-sm">Emergency room visit, X-ray, crutches, and follow-up physical therapy. Shows estimated costs for an acute care episode.</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <p className="font-semibold text-gray-900 mb-1">Managing Joe&apos;s Type 2 Diabetes</p>
          <p className="text-gray-700 text-sm">Yearly routine care including regular doctor visits, prescriptions, and blood work. Shows estimated costs for ongoing chronic condition management.</p>
        </div>
      </div>
      <p className="text-gray-700 leading-relaxed mb-4">
        Because these scenarios are identical across all SBCs, comparing the estimated
        costs gives you a direct apples-to-apples view of how different plans handle
        the same situation.
      </p>
      <DataSourceAttribution
        sources={[
          { name: 'CMS SBC Template', url: 'https://www.cms.gov/marketplace', description: 'Standardized coverage example scenarios' },
        ]}
      />

      {/* ── How to Find Your SBC ── */}
      <SectionHeading>How to Find Your SBC</SectionHeading>
      <ol className="list-decimal pl-6 text-gray-700 space-y-3 mb-4">
        <li>
          <strong>On Healthcare.gov:</strong> Sign in, find your plan name, and look
          for &ldquo;Plan Documents.&rdquo; The SBC is usually a downloadable PDF
          labeled &ldquo;Summary of Benefits and Coverage.&rdquo;
        </li>
        <li>
          <strong>From your insurer&apos;s website:</strong> Most carriers have an
          online SBC search tool where you can enter your plan name or ID.
        </li>
        <li>
          <strong>Request from your employer:</strong> If you have employer coverage,
          your HR department or benefits administrator must provide it within 7 business
          days.
        </li>
        <li>
          <strong>Healthcare.gov Plan Comparison Tool:</strong> During open enrollment,
          you can view SBC information electronically for side-by-side comparison.
        </li>
        <li>
          <strong>Navigators and counselors:</strong> Certified Application Counselors
          and Navigators can help you find and understand your SBC at no cost.
        </li>
      </ol>
      <DataSourceAttribution
        sources={[
          { name: 'Healthcare.gov', url: 'https://www.healthcare.gov/', description: 'Plan lookup and SBC access' },
        ]}
      />

      {/* ── Tips for Comparing ── */}
      <SectionHeading>Tips for Comparing SBCs Across Plans</SectionHeading>
      <ol className="list-decimal pl-6 text-gray-700 space-y-3 mb-4">
        <li>
          <strong>Start with the deductible.</strong> How much do you pay before the
          plan starts covering costs? Plans with lower premiums usually have higher
          deductibles.
        </li>
        <li>
          <strong>Check the out-of-pocket maximum.</strong> This is your worst-case
          annual exposure. A plan with a lower OOP max protects you more if you have
          a serious health event.
        </li>
        <li>
          <strong>Review drug tiers.</strong> Where are your current medications placed?
          A plan with a lower premium may cost more overall if your drugs are on a
          higher tier.
        </li>
        <li>
          <strong>Check the network type.</strong> HMO plans require referrals and
          in-network use. PPO plans offer out-of-network coverage. EPO plans do not
          cover out-of-network except emergencies.
        </li>
        <li>
          <strong>Compare the coverage examples.</strong> The same three scenarios
          appear on every SBC, making direct cost comparison straightforward.
        </li>
        <li>
          <strong>Consider your total cost.</strong> Premium + deductible + typical
          copays and coinsurance = your likely annual cost. The cheapest premium is
          not always the cheapest plan. See our{' '}
          <a href="/guides/bronze-vs-silver-plan-2026" className="text-blue-600 hover:underline">
            Bronze vs Silver plan guide
          </a>{' '}
          for a detailed comparison.
        </li>
      </ol>

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
