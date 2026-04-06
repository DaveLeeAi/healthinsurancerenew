import type { Metadata } from 'next'
import LlmComment from '../../../components/LlmComment'
import { buildBreadcrumbSchema, buildWebApplicationSchema } from '../../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'Health Insurance Savings Calculator | HealthInsuranceRenew',
  description:
    'Calculate how much you can save on marketplace health insurance by adjusting your reported income. See the impact of IRA contributions and deductions on subsidies.',
  alternates: { canonical: 'https://healthinsurancerenew.com/tools/income-savings-calculator' },
  openGraph: {
    title: 'Health Insurance Savings Calculator | HealthInsuranceRenew',
    description:
      'Calculate how much you can save on marketplace health insurance by adjusting your reported income. See the impact of IRA contributions and deductions on subsidies.',
    url: 'https://healthinsurancerenew.com/tools/income-savings-calculator',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Health Insurance Savings Calculator | HealthInsuranceRenew',
    description:
      'Calculate how much you can save on marketplace health insurance by adjusting your reported income. See the impact of IRA contributions and deductions on subsidies.',
  },
}

// NOTE: No name/NPN on this page — generic byline only

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'Estimate Your Savings', url: '/tools/income-savings-calculator' },
]

export default function IncomeSavingsCalculatorLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs)
  const webAppSchema = buildWebApplicationSchema({
    name: 'Health Insurance Savings Calculator',
    description: 'Calculate how much you can save on marketplace health insurance by adjusting your reported income.',
    url: 'https://healthinsurancerenew.com/tools/income-savings-calculator',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <LlmComment pageType="tool-income-savings-calculator" year={2026} data="IRS-FPL" />
      {children}
    </>
  )
}
