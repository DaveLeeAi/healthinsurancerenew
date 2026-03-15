import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Job Plan Affordability Checker | HealthInsuranceRenew',
  description:
    'Check if your employer\'s health plan meets ACA affordability standards in 2025. Determine if you qualify for marketplace subsidies instead.',
}

export default function JobPlanAffordabilityLayout({ children }: { children: React.ReactNode }) {
  return children
}
