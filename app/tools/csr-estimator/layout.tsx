import type { Metadata } from 'next'
import LlmComment from '../../../components/LlmComment'
import { buildBreadcrumbSchema } from '../../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'CSR Estimator: Cost-Sharing Reduction Calculator | HealthInsuranceRenew',
  description:
    'Estimate your cost-sharing reduction (CSR) benefit on marketplace silver plans based on your household income and family size. Updated with 2026 thresholds.',
  alternates: { canonical: 'https://healthinsurancerenew.com/tools/csr-estimator' },
  openGraph: {
    title: 'CSR Estimator: Cost-Sharing Reduction Calculator | HealthInsuranceRenew',
    description:
      'Estimate your cost-sharing reduction (CSR) benefit on marketplace silver plans based on your household income and family size. Updated with 2026 thresholds.',
    url: 'https://healthinsurancerenew.com/tools/csr-estimator',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
}

// NOTE: No name/NPN on this page — generic byline only

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'Extra Savings on Silver Plans', url: '/tools/csr-estimator' },
]

export default function CsrEstimatorLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LlmComment pageType="tool-csr-estimator" year={2026} data="IRS-FPL" />
      {children}
    </>
  )
}
