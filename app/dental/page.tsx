// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { loadDentalCoverage } from '@/lib/data-loader'
import { buildBreadcrumbSchema, buildArticleSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import PageFaq from '@/components/PageFaq'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

const STATE_NAMES: Record<string, string> = {
  AK: 'Alaska', AL: 'Alabama', AR: 'Arkansas', AZ: 'Arizona', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DC: 'District of Columbia', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', IA: 'Iowa', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  MA: 'Massachusetts', MD: 'Maryland', ME: 'Maine', MI: 'Michigan', MN: 'Minnesota',
  MO: 'Missouri', MS: 'Mississippi', MT: 'Montana', NC: 'North Carolina',
  ND: 'North Dakota', NE: 'Nebraska', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NV: 'Nevada', NY: 'New York', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VA: 'Virginia',
  VT: 'Vermont', WA: 'Washington', WI: 'Wisconsin', WV: 'West Virginia', WY: 'Wyoming',
}

const FAQ_ITEMS = [
  { question: 'What is a Stand-Alone Dental Plan (SADP)?', answer: 'A Stand-Alone Dental Plan (SADP) is a separate dental insurance policy purchased through the ACA marketplace alongside your medical plan. Adult dental coverage is not considered an essential health benefit under the ACA, so SADPs are the primary way to get dental coverage through the exchange.' },
  { question: 'Are dental premiums eligible for premium tax credits?', answer: 'No. SADP premiums are not eligible for the Advance Premium Tax Credit (APTC). Only medical plan premiums qualify for marketplace subsidies. However, pediatric dental premiums embedded in a medical plan may be included in the premium used to calculate the APTC.' },
  { question: 'What do dental plans typically cover?', answer: 'Most marketplace dental plans cover three tiers of care: preventive (cleanings, exams, X-rays), basic restorative (fillings, extractions), and major restorative (crowns, bridges, root canals). Coverage percentages vary by tier, and some plans also include orthodontia for adults or children.' },
  { question: 'How do waiting periods work on dental plans?', answer: 'Some dental plans impose waiting periods before certain services are covered — especially for basic and major restorative work. Preventive services often have no waiting period. Waiting periods typically range from 3 to 12 months depending on the plan and service category.' },
  { question: 'Do I need a separate dental plan if I have a medical marketplace plan?', answer: 'It depends. Medical marketplace plans are required to include pediatric dental coverage for children under 19, but adult dental is not required. If you want dental coverage as an adult, you will typically need to purchase a separate SADP through the marketplace or a private dental plan.' },
]

export const metadata: Metadata = {
  title: `Stand-Alone Dental Plans (SADP) ${PLAN_YEAR} — Compare Coverage by State`,
  description:
    `Compare ${PLAN_YEAR} stand-alone dental plan (SADP) options across 30 states. ` +
    `Annual maximums, coverage percentages, waiting periods, and issuer details from federal dental plan data.`,
  alternates: { canonical: `${SITE_URL}/dental` },
  openGraph: {
    type: 'article',
    title: `Stand-Alone Dental Plans (SADP) ${PLAN_YEAR} — Compare Coverage by State`,
    description: `1,389 dental plan variants across 30 states. Coverage tiers, annual maximums, and waiting periods from federal dental plan data.`,
    url: `${SITE_URL}/dental`,
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Stand-Alone Dental Plans (SADP) ${PLAN_YEAR} — Compare Coverage by State',
    description:
      '1,389 dental plan variants across 30 states. Coverage tiers, annual maximums, and waiting periods from federal dental plan data.',
  },
}

export default function DentalIndexPage() {
  const dataset = loadDentalCoverage()

  // --- Group by state ---
  const byState = new Map<string, { count: number; issuers: Set<string>; orthoCount: number }>()
  for (const p of dataset.data) {
    const existing = byState.get(p.state_code) ?? { count: 0, issuers: new Set(), orthoCount: 0 }
    existing.count++
    existing.issuers.add(p.issuer_name)
    if (p.ortho_adult_covered) existing.orthoCount++
    byState.set(p.state_code, existing)
  }
  const states = [...byState.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const totalIssuers = new Set(dataset.data.map((p) => p.issuer_name)).size

  // --- Schema ---
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Dental', url: `${SITE_URL}/dental` },
  ])

  const articleSchema = buildArticleSchema({
    headline: `Stand-Alone Dental Plans for ${PLAN_YEAR}`,
    description: `${dataset.data.length.toLocaleString()} dental plan variants across ${states.length} states. Source: federal dental plan data.`,
    dateModified: '2026-03-15',
    dataSourceName: 'federal dental plan data',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={articleSchema} id="article-schema" />

      <LlmComment
        pageType="dental-index"
        data="federal-dental-plan-data"
        extra={{ plans: dataset.data.length, issuers: totalIssuers, states: states.length }}
      />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li aria-current="page" className="text-neutral-700 font-medium">Dental</li>
          </ol>
        </nav>

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            Stand-Alone Dental Plans — {PLAN_YEAR}
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            <strong>{dataset.data.length.toLocaleString()}</strong> dental plan variants from{' '}
            <strong>{totalIssuers}</strong> issuers across <strong>{states.length}</strong> states
            are available through the health insurance marketplace for {PLAN_YEAR}. Select a state to compare
            coverage tiers, annual maximums, waiting periods, and issuer options.
          </p>
        </section>

        {/* ── What is an SADP ── */}
        <section className="bg-teal-50 border border-teal-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-teal-900 mb-2">What Is a Stand-Alone Dental Plan?</h2>
          <p className="text-neutral-700 leading-relaxed text-sm">
            A stand-alone dental plan (SADP) is a separate dental insurance policy purchased through
            the marketplace alongside your medical plan. Adult dental is <strong>not</strong> an
            essential health benefit under the ACA, so SADPs are the primary way to get dental
            coverage through the exchange. Pediatric dental (for children under 19) is an essential
            benefit and may be embedded in medical plans or purchased as an SADP. SADP premiums are{' '}
            <strong>not eligible</strong> for APTC premium tax credits.
          </p>
        </section>

        {/* ── State grid ── */}
        <section aria-labelledby="states-heading">
          <h2 id="states-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Browse by State
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {states.map(([stateCode, { count, issuers, orthoCount }]) => (
              <a
                key={stateCode}
                href={`/dental/${stateCode.toLowerCase()}`}
                className="p-4 border border-neutral-200 rounded-xl hover:border-teal-400 hover:shadow-sm transition-all group"
              >
                <div className="text-xl font-bold text-navy-800 group-hover:text-teal-700">
                  {stateCode}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {STATE_NAMES[stateCode] ?? stateCode}
                </div>
                <div className="text-xs text-neutral-400 mt-2">
                  {count} plan{count !== 1 ? 's' : ''} · {issuers.size} issuer{issuers.size !== 1 ? 's' : ''}
                </div>
                {orthoCount > 0 && (
                  <div className="text-xs text-green-600 mt-0.5">
                    {orthoCount} with adult ortho
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>

        <PageFaq faqs={FAQ_ITEMS} />

        <GenericByline
          dataSource="federal dental plan data"
          planYear={PLAN_YEAR}
        />

        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            This page is for informational purposes only and does not constitute dental or insurance
            advice. <strong>Consult a licensed health insurance agent</strong> to evaluate your
            specific coverage options.
          </p>
        </footer>
      </main>
    </>
  )
}
