import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ACA Income Savings Calculator | HealthInsuranceRenew',
  description:
    'Calculate how much you can save on ACA health insurance by adjusting your reported income. See the impact of IRA contributions and deductions on subsidies.',
}

export default function IncomeSavingsCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
