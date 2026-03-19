import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import SchemaScript from '../../components/SchemaScript'

export const metadata: Metadata = {
  title: 'How We Get Paid | HealthInsuranceRenew',
  description:
    'HealthInsuranceRenew.com discloses all revenue sources. The site earns through standard CMS-regulated agent compensation when consumers enroll in health plans — at no cost to the consumer.',
  alternates: { canonical: 'https://healthinsurancerenew.com/how-we-get-paid' },
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'How We Get Paid', url: '/how-we-get-paid' },
]

const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'How HealthInsuranceRenew Gets Paid',
  description: 'HealthInsuranceRenew.com discloses all revenue sources. The site earns through standard CMS-regulated agent compensation when consumers enroll in health plans — at no cost to the consumer.',
  url: 'https://healthinsurancerenew.com/how-we-get-paid',
  publisher: {
    '@type': 'Organization',
    name: 'HealthInsuranceRenew',
  },
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

export default function HowWeGetPaidPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SchemaScript schema={aboutPageSchema} id="schema-about-how-we-get-paid" />
      <SchemaScript schema={breadcrumbSchema} id="schema-breadcrumb-how-we-get-paid" />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">How We Get Paid</h1>

      <div className="prose prose-neutral max-w-none">
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          Agents are compensated by insurance carriers — not by consumers.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          When individuals enroll in marketplace health insurance plans through a licensed agent associated with
          this site, the insurance carrier pays a commission to that agent. This is standard industry practice
          under CMS regulations (45 CFR &sect; 156.1230). The commission is paid by the carrier,
          not the consumer.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          Compensation does not vary by plan selection.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Agents are not incentivized to push more expensive plans. Commission rates are set by carriers and do
          not vary based on which specific plan a consumer selects. CMS prohibits agents from charging consumers
          a fee for enrollment assistance (45 CFR &sect; 156.1230(b)).
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          No ads, no data sales, no paid recommendations.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          This site does not sell user data, display advertising, or accept payment for plan recommendations.
          Using this site, its educational content, tools, and calculators is free. Speaking with a licensed
          agent is also free. If a consumer chooses to enroll in a marketplace plan through an agent, the
          premium is the same as it would be enrolling directly through HealthCare.gov or a state-based exchange.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          Compensation does not influence the educational content on this site.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          The guides, tools, and state pages on this site are designed to be accurate and unbiased regardless of
          whether a reader chooses to work with an agent. Content is not written to favor specific carriers, plan
          types, or coverage levels. The{' '}
          <a href="/editorial-policy" className="text-primary-600 hover:text-primary-700 underline">
            editorial policy
          </a>{' '}
          governs how content is created and reviewed, independent of business relationships with insurance carriers.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          Full transparency is part of our commitment to readers.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Readers deserve to know how the sites they visit are funded. This page exists to provide that information
          clearly and directly. Additional details about how this site handles data can be found in the{' '}
          <a href="/privacy" className="text-primary-600 hover:text-primary-700 underline">
            privacy policy
          </a>
          , and information about agent credentials is available on the{' '}
          <a href="/licensing" className="text-primary-600 hover:text-primary-700 underline">
            licensing page
          </a>
          .
        </p>
      </div>
    </div>
  )
}
