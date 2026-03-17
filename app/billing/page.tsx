import type { Metadata } from 'next'
import { loadBillingIntel } from '@/lib/data-loader'
import { buildBreadcrumbSchema, buildArticleSchema, extractCptCodes } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'

const SITE_URL = 'https://healthinsurancerenew.com'

const CATEGORY_GROUPS: Record<string, { label: string; categories: string[] }> = {
  visit_billing: {
    label: 'Office Visits & Exams',
    categories: [
      'preventive_split_billing',
      'facility_fee',
      'specialist_referral',
      'telehealth_cost_sharing',
      'preventive_screening_aca',
    ],
  },
  hospital_billing: {
    label: 'Hospital & Emergency',
    categories: [
      'emergency_care',
      'outpatient_surgery',
      'observation_status',
      'inpatient_drug_billing',
      'out_of_network_air_ambulance',
    ],
  },
  cost_sharing_mechanics: {
    label: 'Cost-Sharing & Deductibles',
    categories: [
      'deductible_reset',
      'moop_accumulation',
      'coordination_of_benefits',
      'cob_fsa_hsa',
    ],
  },
  specialty_billing: {
    label: 'Labs, Drugs & Equipment',
    categories: [
      'lab_routing',
      'prescription_drug_tiers',
      'dme_billing',
      'bundled_vs_unbundled',
    ],
  },
  protections: {
    label: 'Consumer Protections',
    categories: [
      'surprise_billing_protections',
      'mental_health_parity',
    ],
  },
}

function riskBadge(level: string): { bg: string; text: string; short: string } {
  if (level.startsWith('High')) return { bg: 'bg-red-100', text: 'text-red-800', short: 'High Risk' }
  if (level.startsWith('Medium-High')) return { bg: 'bg-orange-100', text: 'text-orange-800', short: 'Med-High' }
  if (level.startsWith('Medium')) return { bg: 'bg-amber-100', text: 'text-amber-800', short: 'Medium' }
  return { bg: 'bg-green-100', text: 'text-green-800', short: 'Low' }
}

export const metadata: Metadata = {
  title: 'Insurance Billing Guides — 20 Common Billing Scenarios Explained',
  description:
    'Understand how health insurance billing really works. 20 common billing scenarios covering split billing, surprise bills, facility fees, coding errors, and your consumer rights under the ACA.',
  alternates: { canonical: `${SITE_URL}/billing` },
  openGraph: {
    type: 'article',
    title: 'Insurance Billing Guides — 20 Common Billing Scenarios Explained',
    description: '20 billing scenarios with CPT codes, cost-sharing breakdowns, and consumer action steps.',
    url: `${SITE_URL}/billing`,
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
  },
}

export default function BillingIndexPage() {
  const dataset = loadBillingIntel()
  const scenarioMap = new Map(dataset.data.map((s) => [s.billing_category, s]))

  const highRiskCount = dataset.data.filter((s) => s.consumer_risk_level.startsWith('High')).length
  const totalCptCodes = new Set(dataset.data.flatMap((s) => extractCptCodes(s))).size

  // --- Schema ---
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Billing Guides', url: `${SITE_URL}/billing` },
  ])

  const articleSchema = buildArticleSchema({
    headline: 'Insurance Billing Guides — Common Billing Scenarios',
    description: `${dataset.data.length} common billing scenarios with CPT codes, consumer tips, and action steps.`,
    dateModified: new Date().toISOString().slice(0, 10),
    dataSourceName: 'AMA CPT, CMS ACA Regulations',
    dataSourceUrl: 'https://www.cms.gov/nosurprises',
  })

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={articleSchema} id="article-schema" />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li aria-current="page" className="text-neutral-700 font-medium">Billing Guides</li>
          </ol>
        </nav>

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            Insurance Billing Guides
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            <strong>{dataset.data.length}</strong> common billing scenarios that catch consumers off
            guard — from split-billing at preventive visits to surprise air ambulance charges. Each
            guide explains how the billing works, how insurance covers it, and exactly what to do if
            you get an unexpected bill.
          </p>
        </section>

        {/* ── Key stats ── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Scenarios</div>
              <div className="text-2xl font-bold text-navy-800">{dataset.data.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">High Risk</div>
              <div className="text-2xl font-bold text-red-700">{highRiskCount}</div>
              <div className="text-xs text-neutral-400 mt-0.5">most common traps</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">CPT Codes</div>
              <div className="text-2xl font-bold text-navy-800">{totalCptCodes}</div>
              <div className="text-xs text-neutral-400 mt-0.5">referenced</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Categories</div>
              <div className="text-2xl font-bold text-navy-800">{Object.keys(CATEGORY_GROUPS).length}</div>
            </div>
          </div>
        </section>

        {/* ── Grouped scenarios ── */}
        {Object.entries(CATEGORY_GROUPS).map(([groupKey, group]) => {
          const groupScenarios = group.categories
            .map((cat) => scenarioMap.get(cat))
            .filter((s): s is NonNullable<typeof s> => s != null)

          if (groupScenarios.length === 0) return null

          return (
            <section key={groupKey} aria-labelledby={`group-${groupKey}`}>
              <h2 id={`group-${groupKey}`} className="text-xl font-semibold text-navy-800 mb-4">
                {group.label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupScenarios.map((s) => {
                  const risk = riskBadge(s.consumer_risk_level)
                  const cpts = extractCptCodes(s)
                  return (
                    <a
                      key={s.id}
                      href={`/billing/${s.billing_category}`}
                      className="p-5 border border-neutral-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-navy-800 group-hover:text-primary-700 text-sm leading-snug">
                          {s.title}
                        </h3>
                        <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${risk.bg} ${risk.text}`}>
                          {risk.short}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
                        {s.description}
                      </p>
                      {cpts.length > 0 && (
                        <div className="text-xs text-neutral-400">
                          CPT: {cpts.slice(0, 4).join(', ')}{cpts.length > 4 ? ` +${cpts.length - 4} more` : ''}
                        </div>
                      )}
                    </a>
                  )
                })}
              </div>
            </section>
          )
        })}

        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            CPT codes &copy; American Medical Association. This page is for informational purposes
            only and does not constitute medical, legal, or insurance advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> for guidance on your specific
            billing situation.
          </p>
        </footer>
      </main>
    </>
  )
}
