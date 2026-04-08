import type { Metadata } from 'next'
import path from 'path'
import fs from 'fs'
import Breadcrumbs from '@/components/Breadcrumbs'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import { buildBreadcrumbSchema } from '@/lib/schema-markup'
import IowaCompareClient from './IowaCompareClient'

const SITE_URL = 'https://healthinsurancerenew.com'

export const metadata: Metadata = {
  title: 'Compare Iowa Health Insurance Plans — 2026 Plan-Fit Tool',
  description:
    'Compare 2026 Iowa marketplace health insurance plans based on your age, income, medications, and coverage needs. See estimated premiums, deductibles, drug coverage, and trade-offs. Free decision-support tool.',
  alternates: { canonical: `${SITE_URL}/iowa/compare-health-insurance` },
  openGraph: {
    type: 'website',
    title: 'Compare Iowa Health Insurance Plans — 2026 Plan-Fit Tool',
    description:
      'Compare 2026 Iowa marketplace plans by premium, deductible, drug coverage, and fit. Grounded in federal plan data. Free, no sign-up.',
    url: `${SITE_URL}/iowa/compare-health-insurance`,
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Compare Iowa Health Insurance Plans — 2026 Plan-Fit Tool',
    description:
      'Compare 2026 Iowa marketplace plans by premium, deductible, drug coverage, and fit. Grounded in federal plan data.',
  },
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools' },
  { name: 'Iowa Plan Comparison', url: '/iowa/compare-health-insurance' },
]

interface CountyOption {
  fips: string
  name: string
}

function loadIowaCounties(): CountyOption[] {
  const filepath = path.join(process.cwd(), 'data', 'config', 'county-names.json')
  if (!fs.existsSync(filepath)) return []
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8')) as Record<string, string>
  return Object.entries(data)
    .filter(([fips]) => fips.startsWith('19'))
    .map(([fips, name]) => ({ fips, name: `${name} County` }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export default function IowaComparePage() {
  const counties = loadIowaCounties()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SchemaScript
        schema={buildBreadcrumbSchema(breadcrumbs)}
        id="breadcrumb"
      />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-3">
        Compare Iowa Health Insurance Plans
      </h1>
      <p className="text-lg text-slate-600 mb-6 leading-relaxed max-w-3xl">
        Find marketplace plans that may fit your needs based on your age, income,
        medications, and how you expect to use healthcare in 2026. Results are
        grounded in federal plan data — not guesses.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
        <p className="text-sm text-amber-900 leading-relaxed">
          <strong>Important:</strong> This tool provides estimates for educational
          purposes only. It does not sell, solicit, or negotiate insurance. Results
          are not a guarantee of coverage, costs, or eligibility. Always verify
          details with the carrier or at{' '}
          <a
            href="https://www.healthcare.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            HealthCare.gov
          </a>{' '}
          before enrolling. Talk to a licensed agent for personalized guidance.
        </p>
      </div>

      <GenericByline />

      <IowaCompareClient counties={counties} />
    </div>
  )
}
