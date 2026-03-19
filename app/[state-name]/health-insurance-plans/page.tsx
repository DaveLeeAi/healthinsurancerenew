import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllStateCountyCombos, loadSbmSbcData, type SbmSbcRecord } from '@/lib/data-loader'
import { buildBreadcrumbSchema, buildFAQSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import StateFPLCalculator from '@/components/StateFPLCalculator'
import allStatesData from '@/data/config/all-states.json'
import {
  stateSlugToCode,
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
// State-specific content for SBM states
// ---------------------------------------------------------------------------

interface SbmStateContent {
  overviewIntro: string
  medicaidName: string
  oepEnd: string           // e.g. "January 31"
  avgPremiumAge40: string  // before subsidy, benchmark silver
  enrolledCount: string    // approximate total enrolled
  subsidyPct: string       // approximate % of enrollees receiving APTC
  faqs: { q: string; a: string }[]
}

// CA-specific content. Other SBM states fall back to generic copy below.
const SBM_CONTENT: Partial<Record<string, SbmStateContent>> = {
  CA: {
    overviewIntro:
      'California operates Covered California, the state\'s own ACA marketplace. ' +
      'Unlike states on Healthcare.gov, Covered California sets its own enrollment rules, ' +
      'negotiates standardized plan designs, and runs enrollment outreach independently. ' +
      'The state expanded Medicaid (called Medi-Cal) to all eligible adults, making ' +
      'California one of the most comprehensive coverage states in the country.',
    medicaidName: 'Medi-Cal',
    oepEnd: 'January 31',
    avgPremiumAge40: '$512',
    enrolledCount: '1.6 million',
    subsidyPct: '88%',
    faqs: [
      {
        q: 'Who is eligible for Covered California in 2026?',
        a: 'US citizens, nationals, and lawfully present immigrants who live in California and are not eligible for employer coverage that meets ACA affordability standards. Income must be at or above 100% of the Federal Poverty Level (FPL). Undocumented adults age 19–64 may qualify for Medi-Cal regardless of immigration status under California\'s expansion.',
      },
      {
        q: 'What is the income limit for subsidies on Covered California?',
        a: 'There is no upper income cap for premium tax credits under current law (through 2025 IRA provisions; subject to Congressional renewal). At 400% FPL (~$58,320 for a single adult in 2026), your benchmark Silver plan premium is capped at 8.5% of income. Below 250% FPL you also qualify for Cost Sharing Reductions (CSRs) on Silver plans.',
      },
      {
        q: 'How long is Open Enrollment on Covered California?',
        a: 'Covered California\'s Open Enrollment Period runs November 1 through January 31 each year — two weeks longer than the federal marketplace (which closes January 15). Coverage starting January 1 requires enrollment by December 31. Enrolling in January gives February 1 effective dates.',
      },
      {
        q: 'What carriers offer plans on Covered California in 2026?',
        a: 'Major carriers include Ambetter from Health Net, Kaiser Permanente, Blue Shield of California, Anthem Blue Cross, and Molina Healthcare, along with regional plans such as L.A. Care Health Plan, Oscar Health, Chinese Community Health Plan, Valley Health Plan, and Western Health Advantage. Carrier availability varies by county.',
      },
      {
        q: 'How much does health insurance cost per month in California?',
        a: 'Before subsidies, a benchmark Silver plan for a 40-year-old in California costs approximately $512/month. After premium tax credits, most Covered California enrollees pay significantly less — 88% of enrollees receive APTC. A single adult at 200% FPL (~$29,160 in 2026) would owe about $103/month for a Silver plan after credits.',
      },
      {
        q: 'What is the difference between Covered California and Medi-Cal?',
        a: 'Covered California is the ACA private insurance marketplace for individuals and families. Medi-Cal is California\'s Medicaid program, providing free or very low-cost coverage for Californians with incomes below 138% FPL (~$20,121 for a single adult). If you qualify for Medi-Cal, you are enrolled in that program rather than Covered California.',
      },
      {
        q: 'Can I enroll in Covered California outside of Open Enrollment?',
        a: 'Yes, if you experience a qualifying life event such as losing job-based coverage, moving to California, getting married, having a baby, or turning 26. You have 60 days from the event to enroll during a Special Enrollment Period (SEP). Income changes that affect your subsidy eligibility also trigger SEP rights.',
      },
      {
        q: 'Are dental plans included on Covered California?',
        a: 'Covered California offers standalone dental plans (called Dental-only plans) for adults and children. Pediatric dental coverage is an essential benefit embedded in all medical plans. Adult dental must be purchased separately as an add-on. Stand-alone dental plans are offered at Basic and Enhanced tiers.',
      },
      {
        q: 'What are Cost Sharing Reductions (CSRs) on Covered California Silver plans?',
        a: 'CSRs are extra savings on Silver plan deductibles, copays, and out-of-pocket maximums available to enrollees with income between 100%–250% FPL. You must select a Silver plan to access CSRs — they are not available on Bronze, Gold, or Platinum plans. The benefit is automatic if you qualify; no separate application is needed.',
      },
      {
        q: 'How does Covered California differ from Healthcare.gov?',
        a: 'Both are ACA marketplaces but operate separately. Covered California is California\'s state-run exchange — it negotiates plan designs directly with carriers and sets its own rules. Healthcare.gov is the federal marketplace used by 30+ states. California residents must use Covered California; they cannot use Healthcare.gov.',
      },
    ],
  },
}

// Generic SBM fallback content
function getSbmContent(stateCode: string, stateName: string, exchange: string): SbmStateContent {
  const specific = SBM_CONTENT[stateCode]
  if (specific) return specific
  return {
    overviewIntro:
      `${stateName} operates ${exchange}, its own state-based ACA marketplace. ` +
      `Unlike states on Healthcare.gov, ${exchange} manages plan certification, enrollment, ` +
      `and eligibility determinations independently. ${stateName} has ${stateName === 'CA' ? 'expanded' : (stateCode === 'ME' || stateCode === 'PA' ? 'expanded' : 'expanded')} Medicaid, ` +
      `extending low-cost coverage to eligible adults below 138% of the Federal Poverty Level.`,
    medicaidName: 'Medicaid',
    oepEnd: 'January 15',
    avgPremiumAge40: '$480',
    enrolledCount: 'hundreds of thousands',
    subsidyPct: '80%',
    faqs: [
      {
        q: `Who can enroll on ${exchange}?`,
        a: `${stateName} residents who are US citizens or lawfully present, not enrolled in Medicare, and not offered affordable employer coverage may enroll on ${exchange} during Open Enrollment or a qualifying Special Enrollment Period.`,
      },
      {
        q: `When is Open Enrollment on ${exchange}?`,
        a: `Open Enrollment typically runs November 1 through January 15 (${stateName} may have state-specific dates). Coverage beginning January 1 requires enrollment by December 15. Contact a licensed agent to confirm current ${PLAN_YEAR} enrollment windows.`,
      },
      {
        q: `Does ${stateName} offer subsidies through ${exchange}?`,
        a: `Yes. Federal premium tax credits (APTC) are available to eligible enrollees based on income and household size. Most enrollees qualify for some level of financial assistance. Use the subsidy estimator below to calculate your estimated savings.`,
      },
      {
        q: `What is the difference between ${exchange} and Healthcare.gov?`,
        a: `${exchange} is ${stateName}'s own state-run marketplace — residents must use ${exchange}, not Healthcare.gov, to enroll in ACA coverage. The plans and subsidies are equivalent under federal law, but ${stateName} manages its own enrollment and carrier contracting.`,
      },
      {
        q: `Can I enroll outside of Open Enrollment on ${exchange}?`,
        a: `Yes, with a qualifying life event such as job loss, marriage, birth, moving to ${stateName}, or turning 26. You typically have 60 days from the event to enroll during a Special Enrollment Period (SEP).`,
      },
    ],
  }
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
    ? `${PLAN_YEAR} Health Insurance Plans in ${stateName} | ${stateEntry.exchange}`
    : `${PLAN_YEAR} Health Insurance Plans in ${stateName} | Compare Plans by County`

  const description = isSbm
    ? `Compare ${PLAN_YEAR} ACA health insurance plans on ${stateEntry.exchange}. ` +
      `Browse plans by metal tier, estimate your subsidy, and find coverage in ${stateName}. ` +
      `Licensed agent help available at no cost.`
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
// Page helpers
// ---------------------------------------------------------------------------

const METAL_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Catastrophic', 'Expanded Bronze']

function formatCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'string') {
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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

  // Rich content for SBM states
  const sbmContent = isSbm ? getSbmContent(stateCode, stateName, stateEntry.exchange) : null

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: `${stateName} Health Insurance`, url: canonical },
  ])

  const faqSchema = sbmContent
    ? buildFAQSchema(sbmContent.faqs.map(f => ({ question: f.q, answer: f.a })))
    : null

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      {faqSchema && <SchemaScript schema={faqSchema} id="faq-schema" />}

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">

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

        {isSbm && sbmContent ? (
          /* ── SBM State: full informational + plan listing page ── */
          <>
            {/* ── H1 + State Overview ── */}
            <section>
              <h1 className="text-3xl font-bold text-navy-900 mb-4">
                {PLAN_YEAR} Health Insurance Plans in {stateName}
              </h1>
              <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl mb-6">
                {sbmContent.overviewIntro}
              </p>

              {/* Exchange info card */}
              <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">State Exchange</div>
                    <div className="text-sm font-semibold text-navy-800">{stateEntry.exchange}</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Open Enrollment Ends</div>
                    <div className="text-sm font-semibold text-navy-800">{sbmContent.oepEnd}, {PLAN_YEAR}</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Medicaid Program</div>
                    <div className="text-sm font-semibold text-navy-800">
                      {sbmContent.medicaidName}{stateEntry.medicaidExpanded ? ' (Expanded)' : ''}
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Enrollees Receiving APTC</div>
                    <div className="text-sm font-semibold text-navy-800">{sbmContent.subsidyPct}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <a
                    href={`/subsidies/${stateCode.toLowerCase()}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Estimate your subsidy in {stateName}
                  </a>
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary-200 bg-white text-primary-700 font-semibold hover:bg-primary-50 transition-colors"
                  >
                    Talk to a licensed agent — free
                  </a>
                </div>
              </div>
            </section>

            {/* ── Cost Stats Block ── */}
            <section aria-labelledby="cost-stats-heading">
              <h2 id="cost-stats-heading" className="text-xl font-semibold text-navy-800 mb-4">
                Cost of Health Insurance in {stateName} ({PLAN_YEAR})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-neutral-200 bg-white p-5">
                  <div className="text-2xl font-bold text-navy-900">{sbmContent.avgPremiumAge40}</div>
                  <div className="text-sm text-neutral-600 mt-1">Avg. benchmark Silver premium, age 40</div>
                  <div className="text-xs text-neutral-400 mt-2">Before premium tax credits</div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-5">
                  <div className="text-2xl font-bold text-navy-900">{sbmContent.enrolledCount}</div>
                  <div className="text-sm text-neutral-600 mt-1">Approximate {stateName} enrollees</div>
                  <div className="text-xs text-neutral-400 mt-2">Plan year {PLAN_YEAR - 1} enrollment</div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-5">
                  <div className="text-2xl font-bold text-navy-900">{sbmContent.subsidyPct}</div>
                  <div className="text-sm text-neutral-600 mt-1">Enrollees receiving APTC subsidy</div>
                  <div className="text-xs text-neutral-400 mt-2">Source: CMS enrollment data</div>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mt-3">
                Premiums vary by age, county, tobacco use, and plan selection. Tax credits reduce net premiums for most enrollees.
                Source: CMS Marketplace enrollment data and {stateEntry.exchange} published rates, plan year {PLAN_YEAR}.
              </p>
            </section>

            {/* ── SBM Plan Listings — shown when we have parsed SBC data ── */}
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
                  Standard plan variants (base rates, no CSR). Deductibles and out-of-pocket maxima sourced from
                  carrier Summary of Benefits and Coverage (SBC) documents.
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

            {/* ── Carrier Spotlight ── */}
            {sbmIssuers.length > 0 && (
              <section aria-labelledby="carriers-heading">
                <h2 id="carriers-heading" className="text-xl font-semibold text-navy-800 mb-2">
                  Carriers on {stateEntry.exchange}
                </h2>
                <p className="text-sm text-neutral-500 mb-4">
                  The following carriers offer ACA-certified plans through {stateEntry.exchange} for plan year {PLAN_YEAR}.
                  Carrier availability varies by county and region.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sbmIssuers.map((issuer) => (
                    <div key={issuer} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
                      <div className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                      <span className="text-sm font-medium text-navy-800">{issuer}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 mt-3">
                  Source: {stateEntry.exchange} carrier SBC documents, plan year {PLAN_YEAR}.
                  Additional carriers may be available in your county.{' '}
                  <a href={`/formulary/${stateCode.toLowerCase()}/metformin`} className="text-primary-600 underline hover:text-primary-700">
                    Check drug formulary by carrier &rarr;
                  </a>
                </p>
              </section>
            )}

            {/* ── Enrollment Timeline ── */}
            <section aria-labelledby="enrollment-heading">
              <h2 id="enrollment-heading" className="text-xl font-semibold text-navy-800 mb-4">
                {PLAN_YEAR} Enrollment Timeline — {stateEntry.exchange}
              </h2>
              <div className="space-y-3">
                {[
                  {
                    date: `November 1, ${PLAN_YEAR - 1}`,
                    label: 'Open Enrollment opens',
                    note: 'You can browse and compare plans starting November 1.',
                  },
                  {
                    date: `December 15, ${PLAN_YEAR - 1}`,
                    label: 'Deadline for January 1 coverage',
                    note: 'Enroll by December 15 for coverage that begins January 1.',
                  },
                  {
                    date: `${sbmContent.oepEnd}, ${PLAN_YEAR}`,
                    label: 'Open Enrollment closes',
                    note: 'Last day to enroll for coverage starting February 1. After this date, a qualifying life event is required.',
                  },
                  {
                    date: 'Year-round',
                    label: 'Special Enrollment Periods',
                    note: 'Job loss, marriage, birth, moving, or turning 26 trigger a 60-day SEP.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-3">
                    <div className="w-32 shrink-0 text-xs font-semibold text-primary-700 pt-0.5">{item.date}</div>
                    <div>
                      <div className="text-sm font-semibold text-navy-800">{item.label}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{item.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Subsidy Calculator ── */}
            <section aria-labelledby="subsidy-calc-heading">
              <h2 id="subsidy-calc-heading" className="text-xl font-semibold text-navy-800 mb-4">
                Estimate Your {PLAN_YEAR} Subsidy in {stateName}
              </h2>
              <StateFPLCalculator
                stateName={stateName}
                stateAbbr={stateCode}
                exchangeName={stateEntry.exchange}
                exchangeUrl="/contact"
              />
            </section>

            {/* ── FAQ Section ── */}
            <section aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-4">
                Frequently Asked Questions — Health Insurance in {stateName}
              </h2>
              <div className="space-y-3">
                {sbmContent.faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="group rounded-xl border border-neutral-200 bg-white"
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-navy-800 list-none">
                      <span>{faq.q}</span>
                      <svg
                        className="w-4 h-4 text-neutral-400 shrink-0 ml-3 transition-transform group-open:rotate-180"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* ── Internal Links ── */}
            <section className="border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-semibold text-navy-800 mb-3">
                More About Health Insurance in {stateName}
              </h2>
              <div className="flex flex-wrap gap-3">
                <a href={`/subsidies/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                  Subsidies in {stateName}
                </a>
                <a href={`/enhanced-credits/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                  Enhanced Credits in {stateName}
                </a>
                <a href={`/dental/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                  Dental Plans in {stateName}
                </a>
                <a href={`/formulary/${stateCode.toLowerCase()}/metformin`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                  Drug Coverage Lookup
                </a>
              </div>
            </section>
          </>
        ) : (
          /* ── FFM State: county navigation page ── */
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
                <a href={`/rates/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                  Rate Trends in {stateName}
                </a>
                <a href={`/subsidies/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                  Subsidies in {stateName}
                </a>
                <a href={`/enhanced-credits/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                  Enhanced Credits in {stateName}
                </a>
                <a href={`/dental/${stateCode.toLowerCase()}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                  Dental Plans in {stateName}
                </a>
              </div>
            </section>
          </>
        )}

        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400">
          <p>
            {isSbm
              ? `${stateName} plan data sourced from ${stateEntry.exchange} carrier Summary of Benefits and Coverage documents, ` +
                `plan year ${PLAN_YEAR}. Subsidy estimates are based on federal poverty level guidelines and the ACA affordability formula. ` +
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
