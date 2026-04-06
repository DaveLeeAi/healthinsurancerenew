import type { Metadata } from 'next'
import LlmComment from '../../../components/LlmComment'
import { buildBreadcrumbSchema } from '../../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'Family Coverage Estimator | HealthInsuranceRenew',
  description:
    'Estimate marketplace health insurance costs for your family in 2026. Compare premiums, deductibles, and out-of-pocket maximums across metal tiers and family sizes.',
  alternates: { canonical: 'https://healthinsurancerenew.com/tools/family-coverage-estimator' },
  openGraph: {
    title: 'Family Coverage Estimator | HealthInsuranceRenew',
    description:
      'Estimate marketplace health insurance costs for your family in 2026. Compare premiums, deductibles, and out-of-pocket maximums across metal tiers and family sizes.',
    url: 'https://healthinsurancerenew.com/tools/family-coverage-estimator',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Family Coverage Estimator | HealthInsuranceRenew',
    description:
      'Estimate marketplace health insurance costs for your family in 2026. Compare premiums, deductibles, and out-of-pocket maximums across metal tiers and family sizes.',
  },,
}

// NOTE: No name/NPN on this page — generic byline only

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: "Estimate Your Family's Costs", url: '/tools/family-coverage-estimator' },
]

export default function FamilyCoverageEstimatorLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LlmComment pageType="tool-family-coverage-estimator" year={2026} data="IRS-FPL" />
      {children}
    </>
  )
}
