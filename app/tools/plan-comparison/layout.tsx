import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marketplace Plan Comparison Tool | HealthInsuranceRenew',
  description:
    'Compare marketplace health insurance plans side by side. Evaluate premiums, deductibles, copays, and out-of-pocket maximums to find the best fit for your needs.',
}

export default function PlanComparisonLayout({ children }: { children: React.ReactNode }) {
  return children
}
