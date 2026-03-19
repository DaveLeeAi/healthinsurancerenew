import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllStateCountyCombos, loadSbmSbcData, type SbmSbcRecord } from '@/lib/data-loader'
import { buildBreadcrumbSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import StateFPLCalculator from '@/components/StateFPLCalculator'
import allStatesData from '@/data/config/all-states.json'
import {
  stateSlugToCode,
  getStateName,
  stateCodeToSlug,
  getCountySlug,
} from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface StateEntry {
  name: string
  abbr: string
  slug: string
  exchange: string
  ownExchange: boolean
  exchangeUrl?: string
  medicaidExpanded?: boolean
}

interface Props {
  params: { 'state-name': string }
}

// Static generation — all state plan pages pre-built at deploy; revalidate daily
export const revalidate = 86400

export async function generateStaticParams() {
  const states = [...new Set(
    getAllStateCountyCombos().map(c =>
      stateCodeToSlug(c.state.toUpperCase())
    )
  )]
  return states.map(s => ({ 'state-name': s }))
}

function getStateEntry(abbr: string): StateEntry | undefined {
  return (allStatesData.states as StateEntry[]).find(
    (s) => s.abbr === abbr.toUpperCase()
  )
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) return { title: 'Not Found' }

  const stateEntry = getStateEntry(stateCode)
  if (!stateEntry) return { title: 'Not Found' }

  const stateName = stateEntry.name
  const counties = getAllStateCountyCombos().filter(
    (c) => c.state === stateCode.toLowerCase()
  )
  const isSbm = stateEntry.ownExchange && counties.length === 0
  const canonical = `${SITE_URL}/${params['state-name']}/health-insurance-plans`

  const title = isSbm
    ? `Health Insurance Plans in ${stateName} | ${stateEntry.exchange}`
    : `${PLAN_YEAR} Health Insurance Plans in ${stateName} | Compare Plans by County`

  const description = isSbm
    ? `${stateName} operates ${stateEntry.exchange}, a state-based marketplace. ` +
      `Compare plans, estimate subsidies, and enroll at ${stateEntry.exchange}. Plan year ${PLAN_YEAR}.`
    : `Browse ${PLAN_YEAR} marketplace health insurance plans across ${counties.length} ` +
      `counties in ${stateName}. Compare premiums, metal tiers, and carriers. Source: CMS QHP PUF.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: 'HealthInsuranceRenew',
      locale: 'en_US',
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const METAL_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Catastrophic', 'Expanded Bronze']

function formatCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'string') {
    // Already formatted (e.g. '$5,800' from SBM SBC PDFs)
    return val.startsWith('$') ? val : `$${val}`
  }
  return `$${val.toLocaleString()}`
}

function metalBadgeClass(metal: string): string {
  const m = metal.toLowerCase()
  if (m === 'bronze' || m === 'expanded bronze') return 'bg-amber-100 text-amber-800'
  if (m === 'silver') return 'bg-slate-100 text-slate-700'
  if (m === 'gold') return 'bg-yellow-100 text-yellow-800'
  if (m === 'platinum') return 'bg-indigo-100 text-indigo-800'
  if (m === 'catastrophic') return 'bg-red-100 text-red-700'
  return 'bg-neutral-100 text-neutral-600'
}

export default function StatePlansPage({ params }: Props) {
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) notFound()

  const stateEntry = getStateEntry(stateCode)
  if (!stateEntry) notFound()

  const stateName = stateEntry.name
  const stateSlug = stateCodeToSlug(stateCode)
  const counties = getAllStateCountyCombos().filter(
    (c) => c.state === stateCode.toLowerCase()
  )
  const isSbm = stateEntry.ownExchange && counties.length === 0
  const canonical = `${SITE_URL}/${stateSlug}/health-insurance-plans`

  // Load SBM plan data (from parsed carrier SBCs) if available
  const sbmPlans: SbmSbcRecord[] = isSbm ? loadSbmSbcData(stateCode) : []
  const sbmIssuers = [...new Set(sbmPlans.map(p => p.issuer_name))].sort()
  // '01' = FFM standard variant code; 'Standard' = SBM carrier PDF label (e.g. CA Ambetter)
  const STANDARD_CSR = new Set(['01', 'Standard'])
  const sbmByMetal = METAL_ORDER.reduce<Record<string, SbmSbcRecord[]>>((acc, m) => {
    const plans = sbmPlans.filter(p => p.metal_level === m && STANDARD_CSR.has(p.csr_variation))
    if (plans.length > 0) acc[m] = plans
    return acc
  }, {})

  // If no county data AND not an SBM state, 404
  if (counties.length === 0 && !stateEntry.ownExchange) notFound()

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: `${stateName} Health Insurance`, url: canonical },
  ])

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">
              {stateName} Health Insurance Plans
            </li>
          </ol>
        </nav>

        {isSbm ? (
          /* ── SBM State: informational page ── */
          <>
            <section>
              <h1 className="text-3xl font-bold text-navy-900 mb-3">
                Health Insurance Plans in {stateName}
              </h1>
              <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-neutral-700 text-lg leading-relaxed">
                    {stateName} has its own state-based marketplace called{' '}
                    <strong>{stateEntry.exchange}</strong>. Plans, enrollment, and eligibility are
                    handled through {stateEntry.exchange} rather than Healthcare.gov.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="text-xs text-neutral-500 uppercase tracking-wide">State Exchange</div>
                    <div className="text-sm font-semibold text-navy-800 mt-0.5">{stateEntry.exchange}</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="text-xs text-neutral-500 uppercase tracking-wide">Medicaid Expanded</div>
                    <div className="text-sm font-semibold text-navy-800 mt-0.5">
                      {stateEntry.medicaidExpanded ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  <a
                    href={`/subsidies/${stateCode.toLowerCase()}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Estimate your savings in {stateName}
                  </a>
                  <a
                    href={`/formulary/${stateCode.toLowerCase()}/metformin`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100 transition-colors"
                  >
                    Search drug coverage in {stateName}
                  </a>
                </div>



                <p className="text-sm text-slate-500 mt-4">
                  A licensed agent can help you compare and enroll in {stateName} plans at no cost.{' '}
                  <a href="/contact" className="text-primary-600 hover:text-primary-700 underline">
                    Contact a licensed agent &rarr;
                  </a>
                </p>
              </div>
            </section>

            {/* SBM Plan Listings — shown when we have parsed SBC data */}
            {sbmPlans.length > 0 && (
              <section aria-labelledby="sbm-plans-heading">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="sbm-plans-heading" className="text-xl font-semibold text-navy-800">
                    {PLAN_YEAR} Plans Available in {stateName}
                  </h2>
                  <span className="text-sm text-neutral-500">
                    {sbmPlans.length} plan variants · {sbmIssuers.length} {sbmIssuers.length === 1 ? 'carrier' : 'carriers'}
                  </span>
                </div>

                <p className="text-sm text-neutral-500 mb-5">
                  Standard plan variants (base rates, no CSR). Deductibles and out-of-pocket maxima sourced from carrier Summary of Benefits and Coverage (SBC) documents.
                  Plans are available through <strong>{stateEntry.exchange}</strong>.{' '}
                  <a href="/contact" className="text-primary-600 underline hover:text-primary-700">
                    Contact a licensed agent to enroll &rarr;
                  </a>
                </p>

                <div className="space-y-6">
                  {Object.entries(sbmByMetal).map(([metal, plans]) => (
                    <div key={metal}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${metalBadgeClass(metal)}`}>
                          {metal}
                        </span>
                        <span className="text-xs text-neutral-400">{plans.length} plans</span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-neutral-200">
                        <table className="w-full text-sm">
                          <thead className="bg-neutral-50 text-xs text-neutral-500 uppercase tracking-wide">
                            <tr>
                              <th className="text-left px-4 py-2.5 font-medium">Plan Name</th>
                              <th className="text-left px-4 py-2.5 font-medium">Network</th>
                              <th className="text-right px-4 py-2.5 font-medium">Deductible (Ind)</th>
                              <th className="text-right px-4 py-2.5 font-medium">OOP Max (Ind)</th>
                              <th className="text-left px-4 py-2.5 font-medium">Carrier</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {plans.map((plan) => (
                              <tr key={plan.plan_variant_id} className="hover:bg-neutral-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-navy-800">{plan.plan_name_from_sbc || plan.plan_id}</td>
                                <td className="px-4 py-3 text-neutral-500">{plan.network_type || '—'}</td>
                                <td className="px-4 py-3 text-right text-neutral-700">{formatCurrency(plan.deductible_individual)}</td>
                                <td className="px-4 py-3 text-right text-neutral-700">{formatCurrency(plan.oop_max_individual)}</td>
                                <td className="px-4 py-3 text-neutral-500 text-xs">{plan.issuer_name}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-neutral-400 mt-4">
                  Source: {sbmIssuers.join(', ')} Summary of Benefits and Coverage documents, plan year {PLAN_YEAR}.
                  Premiums vary by age, household size, and income. Contact a licensed agent to enroll.
                </p>
              </section>
            )}

            <section aria-labelledby="subsidy-calc-heading">
              <h2 id="subsidy-calc-heading" className="text-xl font-semibold text-navy-800 mb-4">
                Estimate Your {PLAN_YEAR} Subsidy
              </h2>
              <StateFPLCalculator
                stateName={stateName}
                stateAbbr={stateCode}
                exchangeName={stateEntry.exchange}
                exchangeUrl="/contact"
              />
            </section>

            <section className="border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-semibold text-navy-800 mb-3">
                More About Health Insurance in {stateName}
              </h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/subsidies/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Subsidies in {stateName}
                </a>

                <a
                  href={`/dental/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Dental Plans in {stateName}
                </a>
              </div>
            </section>
          </>
        ) : (
          /* ── FFM State: county data page ── */
          <>
            <section>
              <h1 className="text-3xl font-bold text-navy-900 mb-3">
                {PLAN_YEAR} Health Insurance Plans in {stateName}
              </h1>
              <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
                Browse marketplace health insurance plans across{' '}
                <strong>{counties.length} counties</strong> in {stateName}. Select a county to
                compare premiums, metal tiers, and carriers for plan year {PLAN_YEAR}.
              </p>
            </section>

            <section aria-labelledby="counties-heading">
              <h2 id="counties-heading" className="text-xl font-semibold text-navy-800 mb-4">
                Select a County
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {counties.map(({ county }) => {
                  const countySlug = getCountySlug(county)
                  const countyDisplay = countySlug
                    .split('-')
                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')
                  return (
                    <a
                      key={county}
                      href={`/${stateSlug}/${countySlug}`}
                      className="block p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-primary-700">{countyDisplay}</span>
                    </a>
                  )
                })}
              </div>
            </section>

            <section className="border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-semibold text-navy-800 mb-3">
                More Data for {stateName}
              </h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/rates/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Rate Trends in {stateName}
                </a>
                <a
                  href={`/subsidies/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Subsidies in {stateName}
                </a>
                <a
                  href={`/enhanced-credits/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Enhanced Credits in {stateName}
                </a>
                <a
                  href={`/dental/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  Dental Plans in {stateName}
                </a>
              </div>
            </section>
          </>
        )}

        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400">
          <p>
            {isSbm
              ? `${stateName} plan data is managed by ${stateEntry.exchange}. ` +
                `Subsidy estimates are based on federal poverty level guidelines and the ACA affordability formula. ` +
                `Consult a licensed health insurance agent for personalized guidance.`
              : `Plan data sourced from CMS QHP Landscape Public Use File, plan year ${PLAN_YEAR}. ` +
                `Premiums shown before premium tax credits and vary by age, household size, and income. ` +
                `Source: CMS data.healthcare.gov.`
            }
          </p>
        </footer>

      </main>
    </>
  )
}
