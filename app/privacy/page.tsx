import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import LlmComment from '../../components/LlmComment'
import { buildBreadcrumbSchema } from '../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'Privacy Policy | HealthInsuranceRenew',
  description:
    'Privacy policy for HealthInsuranceRenew. Learn what information is collected, how it is used, and how your privacy is protected.',
  alternates: { canonical: 'https://healthinsurancerenew.com/privacy' },
  openGraph: {
    title: 'Privacy Policy | HealthInsuranceRenew',
    description:
      'Privacy policy for HealthInsuranceRenew. Learn what information is collected, how it is used, and how your privacy is protected.',
    url: 'https://healthinsurancerenew.com/privacy',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | HealthInsuranceRenew',
    description:
      'Privacy policy for HealthInsuranceRenew. Learn what information is collected, how it is used, and how your privacy is protected.',
  },
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Privacy Policy', url: '/privacy' },
]

// NOTE: No name/NPN on this page — generic byline only (legal page, no byline needed)

export default function PrivacyPage() {
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LlmComment pageType="privacy" year={2026} data="editorial" />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">Privacy Policy</h1>

      <div className="prose prose-neutral max-w-none">
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          This policy describes what information is collected and how it is used.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          HealthInsuranceRenew.com is committed to protecting the privacy of its visitors. This privacy policy applies
          to information collected through this website and explains the types of data gathered, how that data is used,
          and the choices available to visitors. By using this site, visitors acknowledge the practices described in
          this policy.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          The site collects limited information necessary for its operation and improvement.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          When visitors browse this site, certain technical information may be collected automatically, including IP
          address, browser type, device type, pages visited, and the date and time of access. This information is used
          to maintain the site, analyze usage patterns, and improve the visitor experience. If a visitor initiates a
          chat conversation or requests to speak with a licensed agent, additional information such as name, state of
          residence, and contact details may be collected voluntarily.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          Cookies and similar technologies are used for site functionality and analytics.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          This site may use cookies, which are small text files stored on a visitor&apos;s device. Cookies help the site
          function properly, remember visitor preferences, and gather aggregate analytics data. Third-party analytics
          services may also place cookies to help understand how the site is used. Most web browsers allow visitors to
          control or disable cookies through their settings. Disabling cookies may limit some site functionality.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          Personal information is not sold or shared for unrelated marketing purposes.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Information collected through this site is used to operate the site, respond to inquiries, and connect
          visitors with licensed agents when requested. Personal information is not sold to third parties. Information
          may be shared with licensed agents for the purpose of assisting with health insurance inquiries, with service
          providers who help operate the site, or as required by law.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          Third-party services integrated with this site have their own privacy practices.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          This site may use third-party tools for analytics, chat functionality, or other features. These services
          operate under their own privacy policies. HealthInsuranceRenew.com is not responsible for the privacy
          practices of third-party services, and visitors are encouraged to review those policies independently.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          Questions about this privacy policy can be directed to the site team.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Visitors with questions or concerns about how their information is handled are encouraged to reach out
          through the{' '}
          <a href="/contact" className="text-primary-600 hover:text-primary-700 underline">
            contact page
          </a>
          . This policy may be updated periodically to reflect changes in practices or legal requirements. The &ldquo;last
          updated&rdquo; date at the top of this page indicates when the most recent revision was made.
        </p>
      </div>
    </div>
  )
}
