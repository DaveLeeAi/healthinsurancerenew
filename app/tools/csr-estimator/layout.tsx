import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CSR Estimator: Cost-Sharing Reduction Calculator | HealthInsuranceRenew',
  description:
    'Estimate your cost-sharing reduction (CSR) benefit on ACA silver plans based on your household income and family size. Updated with 2025 thresholds.',
}

export default function CsrEstimatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
