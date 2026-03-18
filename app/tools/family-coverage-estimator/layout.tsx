import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Family Coverage Estimator | HealthInsuranceRenew',
  description:
    'Estimate marketplace health insurance costs for your family in 2026. Compare premiums, deductibles, and out-of-pocket maximums across metal tiers and family sizes.',
}

export default function FamilyCoverageEstimatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
