import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'What Income Counts for Health Insurance Subsidies? | HealthInsuranceRenew',
  description:
    'Learn which income sources count toward your MAGI for premium tax credits: wages, self-employment, Social Security, rental income, alimony, and more.',
}

export default function WhatIncomeCountsLayout({ children }: { children: React.ReactNode }) {
  return children
}
