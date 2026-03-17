import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Check If Your Medication Is Covered — Marketplace Drug Formulary Lookup | HealthInsuranceRenew',
  description:
    'Search 551,000+ medications across Marketplace (Obamacare) plans. See coverage status, cost tier, prior authorization, and restrictions by plan and insurer. Source: CMS MR-PUF 2026.',
}

export default function FormularyLayout({ children }: { children: React.ReactNode }) {
  return children
}
