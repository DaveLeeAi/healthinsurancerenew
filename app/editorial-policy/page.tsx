import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import GenericByline from '../../components/GenericByline'
import LlmComment from '../../components/LlmComment'
import SchemaScript from '../../components/SchemaScript'

export const metadata: Metadata = {
  title: 'Editorial Policy | HealthInsuranceRenew',
  description:
    'How HealthInsuranceRenew reviews and updates its health insurance guides, corrects errors, and keeps editorial content independent from advertisers and insurance companies.',
  alternates: { canonical: 'https://healthinsurancerenew.com/editorial-policy' },
  openGraph: {
    title: 'Editorial Policy | HealthInsuranceRenew',
    description:
      'How HealthInsuranceRenew reviews and updates its health insurance guides, corrects errors, and keeps editorial content independent from advertisers and insurance companies.',
    url: 'https://healthinsurancerenew.com/editorial-policy',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Editorial Policy | HealthInsuranceRenew',
    description:
      'How HealthInsuranceRenew reviews and updates its health insurance guides, corrects errors, and keeps editorial content independent from advertisers and insurance companies.',
  },
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
      name: 'Is HealthInsuranceRenew.com affiliated with the government or Healthcare Gov?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. HealthInsuranceRenew.com is an independent platform. It is based on official CMS data but is not affiliated with Healthcare Gov, CMS, or any government agency.',
      },
    },
    {
      '@type': 'Question',
      name: 'How current is the data on HealthInsuranceRenew.com?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Plan, rate, subsidy, and formulary data is updated annually following federal marketplace data release cycles. The current data reflects the 2026 plan year.',
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
        <p className="text-slate-700 leading-relaxed mb-4">
          Health insurance is a big decision for most people. The plan you choose affects what you pay each month, which
          doctors you can see, what your prescriptions cost, and how protected you are when you need care. We want the
          information on this site to be clear, honest, and useful when you are trying to figure out your options.
        </p>

        {/* Section 1 — Review and accuracy */}
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Review and accuracy</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Every guide and data page on HealthInsuranceRenew is reviewed by a licensed health insurance professional
          before it goes live. That means a licensed professional reads the page before it goes live to make sure the
          information is accurate, clear, and easy to understand.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          Pages get updated when things change. New plans come out each year. Premiums move. Deductibles move. Drug
          tiers change. The rules about who can get help with costs change. When any of that happens, the pages that
          cover it get updated, so you are not reading last year&apos;s numbers.
        </p>

        {/* Section 2 — Corrections */}
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Corrections</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          If something on the site is wrong, we want to correct it. If you spot a number that looks off, a rule that
          does not match what you are seeing on your own plan, or anything else that seems incorrect, you can tell us
          through our{' '}
          <a href="/contact" className="text-primary-600 hover:text-primary-700 underline">contact page</a>.
          A licensed professional reviews every correction request. If the error is real, we fix it quickly and update
          the page so the next person who reads it gets the right information. We do not leave clear mistakes up while
          we think about it.
        </p>

        {/* Section 3 — Editorial independence */}
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Editorial independence</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          What we say about plans, insurance companies, and coverage is not influenced by who pays us. Commissions,
          advertising, and relationships with insurance companies do not decide which plans we describe favorably, which
          insurance companies we mention, or what we tell you to think about when you are comparing options. No
          insurance company pays us to recommend its plans. No advertiser has any say in what our guides say.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          We are open about how the business side works. You can read about how the site earns money on our{' '}
          <a href="/how-we-get-paid" className="text-primary-600 hover:text-primary-700 underline">
            How We Get Paid
          </a>{' '}
          page. It is kept separate from the guides on purpose, so the two never get mixed up.
        </p>

        {/* Section 4 — Our information basis */}
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Our information basis</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Our content is based on official CMS data, plan documents filed by insurance companies, and related
          government guidance. When we tell you what a plan covers, what a drug costs on a specific plan, or how help
          with premiums is calculated, we are working from the original sources — not from what someone else wrote
          about them. Working from the source is what lets us give you specific numbers you can act on, instead of
          general claims you cannot verify.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          Things can still change during the year. A plan can change its coverage, costs, or rules during the year. A
          drug can move to a different tier. An insurance company can update its requirements. Before you enroll in a
          plan or fill a prescription, check the details directly with the plan or pharmacy — these pages are here to
          help you understand your options, not replace what your specific plan says.
        </p>
      </div>

      <GenericByline dataSource="HealthInsuranceRenew editorial team" />

      <div className="bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 mt-8">
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-700">Non-Government Disclaimer:</strong> HealthInsuranceRenew.com is not a
          government website. This site is not affiliated with the federal Health Insurance Marketplace, Healthcare Gov,
          or any state-based exchange. It is independently operated by licensed insurance professionals and provides
          educational information only. Nothing on this site constitutes legal, tax, or benefits advice.
        </p>
      </div>
    </div>
  )
}
