import type { Metadata } from 'next'
import LlmComment from '../../../components/LlmComment'
import { buildBreadcrumbSchema } from '../../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'Job Plan Affordability Checker | HealthInsuranceRenew',
  description:
    'Check if your employer\'s health plan meets ACA affordability standards in 2026. Determine if you qualify for marketplace subsidies instead.',
  alternates: { canonical: 'https://healthinsurancerenew.com/tools/job-plan-affordability' },
  openGraph: {
    title: 'Job Plan Affordability Checker | HealthInsuranceRenew',
    description:
      'Check if your employer\'s health plan meets ACA affordability standards in 2026. Determine if you qualify for marketplace subsidies instead.',
    url: 'https://healthinsurancerenew.com/tools/job-plan-affordability',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Job Plan Affordability Checker | HealthInsuranceRenew',
    description:
      'Check if your employer\',
  },,
}

// NOTE: No name/NPN on this page — generic byline only

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'Does My Employer Plan Count?', url: '/tools/job-plan-affordability' },
]

export default function JobPlanAffordabilityLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LlmComment pageType="tool-job-plan-affordability" year={2026} data="IRS-ACA-affordability" />
      {children}
    </>
  )
}
