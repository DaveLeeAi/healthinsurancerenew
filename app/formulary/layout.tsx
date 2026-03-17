import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Drug Formulary Lookup | HealthInsuranceRenew',
  description:
    'Search 551,000+ drugs across all marketplace plans. Look up formulary coverage, tier placement, and cost-sharing for any prescription by plan and issuer.',
}

export default function FormularyLayout({ children }: { children: React.ReactNode }) {
  return children
}
