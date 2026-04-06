import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import GenericByline from '../../components/GenericByline'
import LlmComment from '../../components/LlmComment'
import SchemaScript from '../../components/SchemaScript'

export const metadata: Metadata = {
  title: 'Editorial Policy | HealthInsuranceRenew',
  description:
    'Learn how HealthInsuranceRenew creates, reviews, and updates its health insurance educational content. Content is reviewed by licensed health insurance professionals with CMS Elite Circle of Champions recognition.',
  alternates: { canonical: 'https://healthinsurancerenew.com/editorial-policy' },
  openGraph: {
    title: 'Editorial Policy | HealthInsuranceRenew',
    description:
      'Learn how HealthInsuranceRenew creates, reviews, and updates its health insurance educational content. Content is reviewed by licensed health insurance professionals.',
    url: 'https://healthinsurancerenew.com/editorial-policy',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Editorial Policy | HealthInsuranceRenew',
    description:
      'Learn how HealthInsuranceRenew creates, reviews, and updates its health insurance educational content. Content is reviewed by licensed health insurance professionals.',
  },,
}

// NOTE: No name/NPN on this page — generic byline only

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Editorial Policy', url: '/editorial-policy' },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Who writes the content on HealthInsuranceRenew.com?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Content is written and reviewed by licensed health insurance professionals. The site operator holds CMS Marketplace Elite Circle of Champions recognition from the Centers for Medicare & Medicaid Services for the 2022-2023 Open Enrollment Period.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is HealthInsuranceRenew.com affiliated with the government or Healthcare.gov?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. HealthInsuranceRenew.com is an independent platform. It uses CMS Public Use Files as its data source but is not affiliated with Healthcare.gov, CMS, or any government agency.',
      },
    },
    {
      '@type': 'Question',
      name: 'How current is the data on HealthInsuranceRenew.com?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Plan, rate, subsidy, and formulary data is updated annually following CMS Public Use File release cycles. The current data reflects the 2026 plan year.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `https://healthinsurancerenew.com${item.url}`,
  })),
}

export default function EditorialPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SchemaScript schema={faqSchema} id="schema-faq-editorial" />
      <SchemaScript schema={breadcrumbSchema} id="schema-breadcrumb-editorial" />
      <LlmComment pageType="editorial-policy" year={2026} data="editorial" />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">Editorial Policy</h1>

      <div className="prose prose-neutral max-w-none">
        {/* Section 1 — Who We Are */}
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Who We Are</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          HealthInsuranceRenew.com is operated by licensed health insurance professionals. The site operator holds
          CMS Marketplace Elite Circle of Champions recognition from the Centers for Medicare &amp; Medicaid Services
          (CCIIO division) for the 2022-2023 Open Enrollment Period — a designation awarded based on verified
          enrollment volume and consumer service standards.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          <a href="/circle-of-champions" className="text-primary-600 hover:text-primary-700 underline">
            View full credential details on the Elite Circle of Champions page &rarr;
          </a>
        </p>

        {/* Section 2 — Content Standards */}
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Content Standards</h2>
        <ul className="list-disc pl-5 text-slate-700 leading-relaxed mb-4 space-y-2">
          <li>All guides and data pages are reviewed by a licensed health insurance professional before publication.</li>
          <li>Content must cite regulatory sources (ACA statute, CFR, CMS guidance) where applicable.</li>
          <li>
            Dollar figures, income thresholds, and plan data are sourced directly from CMS Public Use Files — not
            estimated or extrapolated.
          </li>
          <li>Pages are updated annually following CMS data release cycles.</li>
          <li>
            YMYL standard: all health insurance content is treated as financial/health advice and held to the highest
            accuracy standard.
          </li>
        </ul>

        {/* Section 3 — Data Sources */}
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Data Sources</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          All plan, rate, subsidy, and formulary data on this site is sourced from CMS Public Use Files (PUFs) published
          by the Centers for Medicare &amp; Medicaid Services. These datasets are public domain and updated annually.
        </p>
        <ul className="list-disc pl-5 text-slate-700 leading-relaxed mb-4 space-y-2">
          <li><strong>QHP Landscape PUF</strong> — Plan-level data for all qualified health plans on the ACA Marketplace</li>
          <li><strong>Rate PUF</strong> — Premium rates by plan, age, tobacco use, and rating area</li>
          <li><strong>Plan Attributes PUF</strong> — Benefits, cost-sharing, and network details</li>
          <li><strong>Formulary PUF (MR-PUF)</strong> — Machine-readable drug formulary files from every carrier</li>
          <li><strong>SADP PUF</strong> — Stand-alone dental plan data</li>
        </ul>
        <p className="text-slate-700 leading-relaxed mb-4">
          Full details are available on the CMS data page:{' '}
          <a
            href="https://www.cms.gov/marketplace/resources/data/public-use-files"
            className="text-primary-600 hover:text-primary-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            CMS Marketplace Public Use Files
          </a>
        </p>

        {/* Section 4 — Corrections Policy */}
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Corrections Policy</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          If you find an error in any published content, please{' '}
          <a href="/contact" className="text-primary-600 hover:text-primary-700 underline">contact us</a>.
          We review correction requests within 5 business days and correct verified errors within 24 hours
          of confirmation.
        </p>

        {/* Section 5 — Independence */}
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Independence</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          We do not accept payment to recommend specific plans or insurance companies. How we earn revenue is fully disclosed
          at{' '}
          <a href="/how-we-get-paid" className="text-primary-600 hover:text-primary-700 underline">
            How We Get Paid
          </a>
          . No advertiser influences content.
        </p>
      </div>

      <GenericByline dataSource="HealthInsuranceRenew editorial team" />

      <div className="bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 mt-8">
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-700">Non-Government Disclaimer:</strong> HealthInsuranceRenew.com is not a
          government website. This site is not affiliated with the federal Health Insurance Marketplace, HealthCare.gov,
          or any state-based exchange. It is independently operated by licensed insurance professionals and provides
          educational information only. Nothing on this site constitutes legal, tax, or benefits advice.
        </p>
      </div>
    </div>
  )
}
