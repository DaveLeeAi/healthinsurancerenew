import type { Metadata } from 'next'
import LlmComment from '../../../components/LlmComment'
import { buildBreadcrumbSchema } from '../../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'Marketplace Plan Comparison Tool | HealthInsuranceRenew',
  description:
    'Compare marketplace health insurance plans side by side. Evaluate premiums, deductibles, copays, and out-of-pocket maximums to find the best fit for your needs.',
  alternates: { canonical: 'https://healthinsurancerenew.com/tools/plan-comparison' },
  openGraph: {
    title: 'Marketplace Plan Comparison Tool | HealthInsuranceRenew',
    description:
      'Compare marketplace health insurance plans side by side. Evaluate premiums, deductibles, copays, and out-of-pocket maximums to find the best fit for your needs.',
    url: 'https://healthinsurancerenew.com/tools/plan-comparison',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Marketplace Plan Comparison Tool | HealthInsuranceRenew',
    description:
      'Compare marketplace health insurance plans side by side. Evaluate premiums, deductibles, copays, and out-of-pocket maximums to find the best fit for your needs.',
  },
}

// NOTE: No name/NPN on this page — generic byline only

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'Compare Plan Levels', url: '/tools/plan-comparison' },
]

export default function PlanComparisonLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LlmComment pageType="tool-plan-comparison" year={2026} data="CMS-QHP-PUF" />
      {children}
    </>
  )
}
