// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import GenericByline from '../../components/GenericByline'
import LlmComment from '../../components/LlmComment'
import SchemaScript from '../../components/SchemaScript'
import { buildArticleSchema } from '../../lib/schema-markup'

export const metadata: Metadata = {
  title: 'Data Methodology — How We Process CMS Public Use Files | HealthInsuranceRenew',
  description:
    'Where our numbers come from. All plan, rate, subsidy, and formulary data is sourced from CMS Public Use Files — the same government datasets that power Healthcare.gov.',
  alternates: { canonical: 'https://healthinsurancerenew.com/data-methodology' },
  openGraph: {
    title: 'Data Methodology — How We Process CMS Public Use Files',
    description: 'Where our numbers come from. All plan, rate, subsidy, and formulary data is sourced from CMS Public Use Files — the same government datasets that power Healthcare.gov.',
    url: 'https://healthinsurancerenew.com/data-methodology',
    type: 'article',
    siteName: 'HealthInsuranceRenew',
  },
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Data & Methodology', url: '/data-methodology' },
]

const datasetSchemas = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'CMS QHP Landscape Public Use File 2026',
    description: 'Plan-level data for all qualified health plans available on the ACA Marketplace, including premiums, metal levels, and plan types.',
    url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    provider: {
      '@type': 'GovernmentOrganization',
      name: 'Centers for Medicare & Medicaid Services',
    },
    isBasedOn: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    license: 'https://www.usa.gov/government-works',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'CMS Rate Public Use File 2026',
    description: 'Premium rates by plan, age, tobacco use, and rating area for all ACA Marketplace health plans.',
    url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    provider: {
      '@type': 'GovernmentOrganization',
      name: 'Centers for Medicare & Medicaid Services',
    },
    isBasedOn: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    license: 'https://www.usa.gov/government-works',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'CMS Plan Attributes Public Use File 2026',
    description: 'Detailed benefits, cost-sharing, copays, and SBC data for every ACA Marketplace plan.',
    url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    provider: {
      '@type': 'GovernmentOrganization',
      name: 'Centers for Medicare & Medicaid Services',
    },
    isBasedOn: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    license: 'https://www.usa.gov/government-works',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'CMS Formulary Public Use File 2026',
    description: 'Machine-readable drug formulary files with tier placement, prior authorization, step therapy, and quantity limit data for 551,000+ drug coverage records.',
    url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    provider: {
      '@type': 'GovernmentOrganization',
      name: 'Centers for Medicare & Medicaid Services',
    },
    isBasedOn: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    license: 'https://www.usa.gov/government-works',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'CMS SADP Public Use File 2026',
    description: 'Stand-alone dental plan data including coverage percentages, waiting periods, annual maximums, and orthodontia coverage across 942 plans.',
    url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    provider: {
      '@type': 'GovernmentOrganization',
      name: 'Centers for Medicare & Medicaid Services',
    },
    isBasedOn: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
    license: 'https://www.usa.gov/government-works',
  },
]

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `https://healthinsurancerenew.com${item.url}`,
  })),
}

const dataSchemaIds = [
  'schema-dataset-landscape',
  'schema-dataset-rate',
  'schema-dataset-attributes',
  'schema-dataset-formulary',
  'schema-dataset-sadp',
]

export default function DataMethodologyPage() {
  const articleSchema = buildArticleSchema({
    headline: 'Data Methodology — How We Process CMS Public Use Files',
    description: 'Where our numbers come from. All data sourced from CMS Public Use Files.',
    dateModified: '2026-03-19',
    dataSourceName: 'CMS Marketplace Public Use Files',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SchemaScript schema={breadcrumbSchema} id="schema-breadcrumb-data" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {datasetSchemas.map((schema, i) => (
        <SchemaScript key={dataSchemaIds[i]} schema={schema} id={dataSchemaIds[i]} />
      ))}
      <LlmComment pageType="data-methodology" year={2026} data="CMS-PUF" />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">Data &amp; Methodology</h1>

      <div className="prose prose-neutral max-w-none">
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Where our numbers come from</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Every figure used in our tools and guides comes from official, publicly available government data. We do not
          create our own estimates from scratch or use proprietary models. The primary sources include:
        </p>
        <ul className="list-disc pl-5 text-slate-700 leading-relaxed mb-4 space-y-2">
          <li>
            <strong>Federal Poverty Level (FPL) guidelines</strong> — Published annually by the U.S. Department of
            Health and Human Services (HHS). We update these as soon as the new figures are released, typically in
            January.
          </li>
          <li>
            <strong>Premium contribution percentages</strong> — Based on IRS Revenue Procedures that set how much of
            your income you are expected to pay toward a benchmark plan. These are updated annually.
          </li>
          <li>
            <strong>Affordability threshold</strong> — Set by the IRS each year. This determines whether an employer
            plan is considered affordable under the ACA.
          </li>
          <li>
            <strong>Cost-sharing reduction tiers</strong> — Based on actuarial value standards published by the
            Centers for Medicare &amp; Medicaid Services (CMS).
          </li>
          <li>
            <strong>Benchmark premium estimates</strong> — National average second-lowest-cost Silver plan premiums,
            sourced from CMS and the Kaiser Family Foundation (KFF).
          </li>
        </ul>

        {/* Data Provenance Table */}
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Data Provenance</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          All datasets are sourced from the{' '}
          <a
            href="https://www.cms.gov/marketplace/resources/data/public-use-files"
            className="text-primary-600 hover:text-primary-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            CMS Marketplace Public Use Files
          </a>{' '}
          page. These are the same government datasets that power Healthcare.gov.
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Data Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">CMS Source File</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Records</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 text-slate-700">Health Plans</td>
                <td className="px-4 py-3 text-slate-600">QHP Landscape PUF</td>
                <td className="px-4 py-3 text-slate-600">All ACA plans, all states</td>
                <td className="px-4 py-3 text-slate-600">Annually</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700">Premium Rates</td>
                <td className="px-4 py-3 text-slate-600">Rate PUF</td>
                <td className="px-4 py-3 text-slate-600">Age-rated premiums by county</td>
                <td className="px-4 py-3 text-slate-600">Annually</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700">Plan Benefits</td>
                <td className="px-4 py-3 text-slate-600">Plan Attributes PUF</td>
                <td className="px-4 py-3 text-slate-600">Cost-sharing, copays, SBC data</td>
                <td className="px-4 py-3 text-slate-600">Annually</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700">Drug Formulary</td>
                <td className="px-4 py-3 text-slate-600">Formulary PUF</td>
                <td className="px-4 py-3 text-slate-600">551,000+ drug coverage records</td>
                <td className="px-4 py-3 text-slate-600">Annually</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700">Dental Plans</td>
                <td className="px-4 py-3 text-slate-600">SADP PUF</td>
                <td className="px-4 py-3 text-slate-600">942 stand-alone dental plans</td>
                <td className="px-4 py-3 text-slate-600">Annually</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">How the calculators work</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Our tools use straightforward math based on the official formulas described in ACA regulations. For the
          savings estimator, the calculation is:
        </p>
        <ol className="list-decimal pl-5 text-slate-700 leading-relaxed mb-4 space-y-2">
          <li>Determine the Federal Poverty Level for your household size.</li>
          <li>Calculate your income as a percentage of FPL.</li>
          <li>Look up the expected contribution percentage for your FPL range.</li>
          <li>Multiply your income by that percentage to get your expected annual contribution.</li>
          <li>
            Subtract your expected contribution from the benchmark plan cost to get the estimated tax credit.
          </li>
        </ol>
        <p className="text-slate-700 leading-relaxed mb-4">
          The CSR estimator and family cost estimator follow similar logic, using published tier data and benchmark
          premium averages. No machine learning, scoring models, or proprietary algorithms are involved.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          What the results mean — and what they don&apos;t
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Tool results are estimates based on national averages, not official quotes. Actual health insurance costs
          depend on your age, location (county-level), tobacco use, and available plans. These estimates help you
          understand your rough situation before applying.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          For accurate premium quotes and subsidy amounts based on your exact situation,{' '}
          <a href="/contact" className="text-primary-600 hover:text-primary-700 underline">
            contact a licensed agent
          </a>{' '}
          who can pull real plan prices for your county and income level at no cost to you.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">How we keep data current</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          All data files are reviewed and updated ahead of each open enrollment period. When the government publishes
          new FPL guidelines, contribution percentages, or affordability thresholds, we update the corresponding data
          within our tools. Each page shows a &ldquo;last updated&rdquo; date so you know when the content was most recently
          reviewed.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          If you spot a number that looks wrong, please let us know through the{' '}
          <a href="/contact" className="text-primary-600 hover:text-primary-700 underline">
            contact page
          </a>
          . We take accuracy seriously and will correct any errors as quickly as possible.
        </p>
      </div>
      {/* NOTE: No name/NPN on this page — generic byline only */}
      <GenericByline dataSource="HealthInsuranceRenew editorial team" lastReviewed="2026-03-19" />
    </div>
  )
}
