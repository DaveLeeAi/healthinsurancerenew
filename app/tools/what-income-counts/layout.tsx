import type { Metadata } from 'next'
import LlmComment from '../../../components/LlmComment'
import { buildBreadcrumbSchema } from '../../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'What Income Counts for Health Insurance Subsidies? | HealthInsuranceRenew',
  description:
    'Learn which income sources count toward your MAGI for premium tax credits: wages, self-employment, Social Security, rental income, alimony, and more.',
  alternates: { canonical: 'https://healthinsurancerenew.com/tools/what-income-counts' },
  openGraph: {
    title: 'What Income Counts for Health Insurance Subsidies? | HealthInsuranceRenew',
    description:
      'Learn which income sources count toward your MAGI for premium tax credits: wages, self-employment, Social Security, rental income, alimony, and more.',
    url: 'https://healthinsurancerenew.com/tools/what-income-counts',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
}

// NOTE: No name/NPN on this page — generic byline only

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'What Income Counts?', url: '/tools/what-income-counts' },
]

export default function WhatIncomeCountsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LlmComment pageType="tool-what-income-counts" year={2026} data="IRS-MAGI" />
      {children}
    </>
  )
}
