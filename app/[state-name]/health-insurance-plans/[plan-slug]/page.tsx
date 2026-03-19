import type { Metadata } from 'next'
// NOTE: No name/NPN on this page — generic byline only
import { notFound } from 'next/navigation'
import {
  getSbmPlanBySlug,
  getSbmPlansForStaticParams,
  loadSbmSbcData,
  generateSbmPlanSlug,
  type SbmSbcRecord,
  type SbmSbcCostSharingGrid,
} from '@/lib/data-loader'
import { buildBreadcrumbSchema, buildFAQSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import allStatesData from '@/data/config/all-states.json'
import { stateSlugToCode, stateCodeToSlug } from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface StateEntry {
  name: string
  abbr: string
  slug: string
  exchange: string
  ownExchange: boolean
}

interface Props {
  params: { 'state-name': string; 'plan-slug': string }
}

function getStateEntry(abbr: string): StateEntry | undefined {
  return (allStatesData.states as StateEntry[]).find(
    (s) => s.abbr === abbr.toUpperCase()
  )
}

// ---------------------------------------------------------------------------
// Static generation
// ---------------------------------------------------------------------------

export const revalidate = 86400

export async function generateStaticParams() {
  // Only build for SBM states that have parsed SBC data files
  const sbmStateCodes = ['CA'] // expand as more states get SBC data parsed
  const params: Array<{ 'state-name': string; 'plan-slug': string }> = []
  for (const code of sbmStateCodes) {
    const plans = getSbmPlansForStaticParams(code)
    const stateSlug = stateCodeToSlug(code)
    for (const plan of plans) {
      params.push({
        'state-name': stateSlug,
        'plan-slug': generateSbmPlanSlug(plan.plan_name_from_sbc),
      })
    }
  }
  return params
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'string') return val.startsWith('$') ? val : `$${val}`
  return `$${val.toLocaleString()}`
}

function metalBadgeClass(metal: string): string {
  const m = metal.toLowerCase()
  if (m.includes('bronze')) return 'bg-amber-100 text-amber-800'
  if (m === 'silver') return 'bg-slate-100 text-slate-700'
  if (m === 'gold') return 'bg-yellow-100 text-yellow-800'
  if (m === 'platinum') return 'bg-indigo-100 text-indigo-800'
  if (m === 'catastrophic') return 'bg-red-100 text-red-700'
  return 'bg-neutral-100 text-neutral-600'
}

const COST_SHARING_LABELS: Record<keyof SbmSbcCostSharingGrid, string> = {
  primary_care: 'Primary Care Visit',
  specialist: 'Specialist Visit',
  preventive_care: 'Preventive Care',
  diagnostic_lab: 'Diagnostic Lab Tests',
  imaging: 'Imaging (X-ray, MRI)',
  generic_drugs_tier1: 'Generic Drugs (Tier 1)',
  preferred_brand_tier2: 'Preferred Brand (Tier 2)',
  nonpreferred_brand_tier3: 'Non-Preferred Brand (Tier 3)',
  specialty_tier4: 'Specialty Drugs (Tier 4)',
  er_facility: 'Emergency Room',
  emergency_transport: 'Emergency Transport',
  urgent_care: 'Urgent Care',
  inpatient_hospital_facility: 'Inpatient Hospital',
  outpatient_surgery_facility: 'Outpatient Surgery',
  mental_health_outpatient: 'Mental Health (Outpatient)',
  mental_health_inpatient: 'Mental Health (Inpatient)',
}

const COST_SHARING_GROUPS = [
  {
    label: 'Medical Visits',
    keys: ['primary_care', 'specialist', 'preventive_care', 'urgent_care', 'er_facility', 'emergency_transport'] as const,
  },
  {
    label: 'Diagnostics & Imaging',
    keys: ['diagnostic_lab', 'imaging'] as const,
  },
  {
    label: 'Prescriptions',
    keys: ['generic_drugs_tier1', 'preferred_brand_tier2', 'nonpreferred_brand_tier3', 'specialty_tier4'] as const,
  },
  {
    label: 'Hospital & Surgery',
    keys: ['inpatient_hospital_facility', 'outpatient_surgery_facility'] as const,
  },
  {
    label: 'Behavioral Health',
    keys: ['mental_health_outpatient', 'mental_health_inpatient'] as const,
  },
]

function metalContextCopy(metal: string): string {
  const m = metal.toLowerCase()
  if (m.includes('bronze')) return 'Bronze plans have lower monthly premiums and higher out-of-pocket costs when you use care. Best for healthy adults who want protection against major medical expenses and rarely need routine care.'
  if (m === 'silver') return 'Silver plans offer moderate premiums and cost-sharing. They are the only metal level eligible for Cost-Sharing Reductions (CSRs), making them the best value for enrollees earning 100%–250% of the Federal Poverty Level.'
  if (m === 'gold') return 'Gold plans have higher monthly premiums and lower out-of-pocket costs when you use care. Best for people who expect to use health services regularly throughout the year.'
  if (m === 'platinum') return 'Platinum plans have the highest monthly premiums and the lowest out-of-pocket costs. Best for people with frequent or high-cost medical needs who value maximum cost predictability.'
  if (m === 'catastrophic') return 'Catastrophic plans have very low premiums and very high deductibles. Only available to people under 30 or those with a hardship exemption. They cover three primary care visits per year before the deductible.'
  return 'This plan provides ACA-compliant essential health benefits coverage through a state marketplace.'
}

// CSR variants available for Silver plans
function getCsrVariants(plan: SbmSbcRecord, allPlans: SbmSbcRecord[]): SbmSbcRecord[] {
  if (!plan.metal_level.toLowerCase().includes('silver')) return []
  return allPlans.filter(
    (p) =>
      p.plan_year === plan.plan_year &&
      p.marketplace_type === plan.marketplace_type &&
      p.metal_level === plan.metal_level &&
      p.network_type === plan.network_type &&
      p.csr_variation !== 'Standard' &&
      generateSbmPlanSlug(p.plan_name_from_sbc) === generateSbmPlanSlug(plan.plan_name_from_sbc)
        ? false  // exclude the plan itself
        : p.plan_name_from_sbc !== plan.plan_name_from_sbc ||
          p.csr_variation !== plan.csr_variation
  ).filter((p) => p.metal_level === plan.metal_level && p.csr_variation !== 'Standard')
    .slice(0, 4)
}

// Related plans: same metal level, different network or same carrier
function getRelatedPlans(plan: SbmSbcRecord, allPlans: SbmSbcRecord[]): SbmSbcRecord[] {
  return allPlans
    .filter(
      (p) =>
        p.plan_variant_id !== plan.plan_variant_id &&
        p.plan_name_from_sbc !== plan.plan_name_from_sbc &&
        p.metal_level === plan.metal_level &&
        p.csr_variation === 'Standard' &&
        p.plan_year === plan.plan_year &&
        p.marketplace_type === 'iex'
    )
    .slice(0, 4)
}

function buildPlanFAQs(plan: SbmSbcRecord, exchange: string): { q: string; a: string }[] {
  const metal = plan.metal_level.toLowerCase()
  const isSilver = metal === 'silver'
  const network = plan.network_type || 'HMO/PPO'
  const deductible = formatCurrency(plan.deductible_individual)
  const oopMax = formatCurrency(plan.oop_max_individual)

  return [
    {
      q: `What is the deductible for the ${plan.plan_name_from_sbc}?`,
      a: `The individual deductible for this plan is ${deductible}. This is the amount you pay out-of-pocket for covered services before the plan begins sharing costs, with the exception of services that are covered before the deductible (such as preventive care, which is typically covered at no charge).`,
    },
    {
      q: `What is the out-of-pocket maximum for this plan?`,
      a: `The individual out-of-pocket maximum is ${oopMax}. Once you reach this limit in a plan year, the plan pays 100% of covered in-network costs for the rest of the year. The out-of-pocket maximum includes deductibles, copays, and coinsurance, but not your monthly premium.`,
    },
    ...(isSilver ? [{
      q: `Is this plan eligible for Cost-Sharing Reductions (CSRs)?`,
      a: `Yes. As a Silver plan, this plan qualifies for Cost-Sharing Reductions if you enroll through ${exchange} and your income is between 100% and 250% of the Federal Poverty Level. CSRs reduce your deductible, copays, and out-of-pocket maximum. You must select a Silver plan to access CSR benefits — they are not available on Bronze, Gold, or Platinum plans.`,
    }] : []),
    {
      q: `What network type does this plan use?`,
      a: `This is a ${network} plan. ${
        network.toUpperCase() === 'HMO'
          ? 'HMO plans require you to select a primary care physician (PCP) who coordinates your care. Referrals are typically needed to see specialists. Care outside the network is generally not covered except in emergencies.'
          : network.toUpperCase() === 'PPO'
          ? 'PPO plans offer more flexibility — you can see any in-network provider without a referral, and out-of-network care is covered at a higher cost share. PCPs are optional.'
          : 'Contact a licensed agent for details on this network type and which providers are in-network.'
      }`,
    },
    {
      q: `Who is the ${plan.plan_name_from_sbc} best suited for?`,
      a: `${metalContextCopy(plan.metal_level)} If you have questions about whether this specific plan is the right fit for your health needs and budget, a licensed agent can compare it against other options in ${exchange} at no cost to you.`,
    },
    {
      q: `How do I enroll in this plan?`,
      a: `This plan is available through ${exchange}. You can enroll during Open Enrollment (typically November 1 – ${metal === 'catastrophic' ? 'January 15' : 'January 31'}) or during a Special Enrollment Period if you have a qualifying life event. A licensed agent can help you enroll and verify your subsidy eligibility at no cost.`,
    },
  ]
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) return { title: 'Not Found' }
  const stateEntry = getStateEntry(stateCode)
  if (!stateEntry) return { title: 'Not Found' }
  const plan = getSbmPlanBySlug(stateCode, params['plan-slug'])
  if (!plan) return { title: 'Not Found' }

  const canonical = `${SITE_URL}/${params['state-name']}/health-insurance-plans/${params['plan-slug']}`
  const title = `${plan.plan_name_from_sbc} — ${plan.metal_level} Plan | ${stateEntry.exchange} ${PLAN_YEAR}`
  const description =
    `${plan.metal_level} ${plan.network_type || ''} plan from ${plan.issuer_name} on ${stateEntry.exchange}. ` +
    `Deductible: ${formatCurrency(plan.deductible_individual)}. OOP Max: ${formatCurrency(plan.oop_max_individual)}. ` +
    `Compare benefits, cost-sharing, and coverage details. Plan year ${plan.plan_year}.`

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

export default function SbmPlanDetailPage({ params }: Props) {
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) notFound()
  const stateEntry = getStateEntry(stateCode)
  if (!stateEntry || !stateEntry.ownExchange) notFound()

  const plan = getSbmPlanBySlug(stateCode, params['plan-slug'])
  if (!plan) notFound()

  const stateSlug = stateCodeToSlug(stateCode)
  const stateName = stateEntry.name
  const exchange = stateEntry.exchange
  const allPlans = loadSbmSbcData(stateCode)
  const planSlug = generateSbmPlanSlug(plan.plan_name_from_sbc)
  const canonical = `${SITE_URL}/${stateSlug}/health-insurance-plans/${planSlug}`

  const relatedPlans = getRelatedPlans(plan, allPlans)
  const faqs = buildPlanFAQs(plan, exchange)
  const grid = plan.cost_sharing_grid ?? {}
  const hasGrid = Object.values(grid).some((v) => v && v.trim() !== '')

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: `${stateName} Health Insurance Plans`, url: `${SITE_URL}/${stateSlug}/health-insurance-plans` },
    { name: plan.plan_name_from_sbc, url: canonical },
  ])
  const faqSchema = buildFAQSchema(faqs.map((f) => ({ question: f.q, answer: f.a })))

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />
      <LlmComment pageType="plan-slug" state={stateCode} exchange={exchange} year={PLAN_YEAR} data="SBM-SBC" extra={{ plan: plan.plan_name_from_sbc, metal: plan.metal_level, issuer: plan.issuer_name }} />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li>
              <a href={`/${stateSlug}/health-insurance-plans`} className="hover:underline text-primary-600">
                {stateName} Health Insurance Plans
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li className="text-neutral-700 font-medium truncate max-w-xs">{plan.plan_name_from_sbc}</li>
          </ol>
        </nav>

        {/* ── Hero / Plan Identity ── */}
        <section>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${metalBadgeClass(plan.metal_level)}`}>
              {plan.metal_level}
            </span>
            {plan.network_type && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
                {plan.network_type}
              </span>
            )}
            {plan.is_hdhp && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                HDHP / HSA-eligible
              </span>
            )}
            <span className="text-xs text-neutral-400 ml-1">Plan year {plan.plan_year}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2 leading-tight">
            {plan.plan_name_from_sbc}
          </h1>
          <p className="text-neutral-500 text-sm mb-6">
            {plan.issuer_name} · {exchange} · {stateName}
          </p>

          {/* Cost summary card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Individual Deductible', value: formatCurrency(plan.deductible_individual) },
              { label: 'Family Deductible', value: formatCurrency(plan.deductible_family) },
              { label: 'Individual OOP Max', value: formatCurrency(plan.oop_max_individual) },
              { label: 'Family OOP Max', value: formatCurrency(plan.oop_max_family) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="text-xs text-neutral-500 mb-1">{item.label}</div>
                <div className="text-lg font-bold text-navy-900">{item.value}</div>
              </div>
            ))}
          </div>

          {plan.drug_deductible && plan.drug_deductible.trim() !== '' && (
            <p className="text-sm text-neutral-500 mt-3">
              Drug deductible: <span className="font-medium text-neutral-700">{plan.drug_deductible}</span>
            </p>
          )}
        </section>

        {/* ── Metal Level Context ── */}
        <section aria-labelledby="metal-context-heading">
          <h2 id="metal-context-heading" className="text-lg font-semibold text-navy-800 mb-2">
            About {plan.metal_level} Plans
          </h2>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm text-neutral-700 leading-relaxed">
            {metalContextCopy(plan.metal_level)}
          </div>
        </section>

        {/* ── Cost Sharing Grid ── */}
        {hasGrid && (
          <section aria-labelledby="cost-grid-heading">
            <h2 id="cost-grid-heading" className="text-xl font-semibold text-navy-800 mb-1">
              What You Pay — In-Network Cost Sharing
            </h2>
            <p className="text-sm text-neutral-500 mb-5">
              Your costs after meeting your deductible (unless noted as covered before deductible).
              Source: {plan.issuer_name} Summary of Benefits and Coverage (SBC), plan year {plan.plan_year}.
            </p>

            <div className="space-y-5">
              {COST_SHARING_GROUPS.map((group) => {
                const rows = group.keys
                  .map((k) => ({ label: COST_SHARING_LABELS[k], value: grid[k] }))
                  .filter((r) => r.value && r.value.trim() !== '')
                if (rows.length === 0) return null
                return (
                  <div key={group.label}>
                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                      {group.label}
                    </div>
                    <div className="rounded-xl border border-neutral-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-neutral-100">
                          {rows.map((row) => (
                            <tr key={row.label} className="bg-white odd:bg-neutral-50/50">
                              <td className="px-4 py-2.5 text-neutral-700">{row.label}</td>
                              <td className="px-4 py-2.5 text-right font-medium text-navy-800">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Exclusions ── */}
        {plan.exclusions && plan.exclusions.length > 0 && (
          <section aria-labelledby="exclusions-heading">
            <h2 id="exclusions-heading" className="text-xl font-semibold text-navy-800 mb-2">
              Services Not Covered (Exclusions)
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              The following services are listed as exclusions in the{' '}
              {plan.issuer_name} SBC for this plan. Always verify coverage with your
              carrier before receiving care.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.exclusions.map((ex, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  <span className="mt-0.5 shrink-0 text-red-400">✕</span>
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-neutral-400 mt-3">
              Source: {plan.issuer_name} Summary of Benefits and Coverage, plan year {plan.plan_year}.
              Exclusion lists are not exhaustive — consult your full plan documents or Evidence of Coverage for complete details.
            </p>
          </section>
        )}

        {/* ── FAQ ── */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-xl border border-neutral-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-navy-800 list-none">
                  <span>{faq.q}</span>
                  <svg
                    className="w-4 h-4 text-neutral-400 shrink-0 ml-3 transition-transform group-open:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Related Plans ── */}
        {relatedPlans.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Other {plan.metal_level} Plans on {exchange}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedPlans.map((p) => {
                const relSlug = generateSbmPlanSlug(p.plan_name_from_sbc)
                return (
                  <a
                    key={p.plan_variant_id}
                    href={`/${stateSlug}/health-insurance-plans/${relSlug}`}
                    className="block rounded-xl border border-neutral-200 bg-white p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="text-sm font-semibold text-navy-800 mb-1">{p.plan_name_from_sbc}</div>
                    <div className="flex gap-2 text-xs text-neutral-500">
                      <span>{p.network_type || 'Plan'}</span>
                      <span>·</span>
                      <span>Deductible: {formatCurrency(p.deductible_individual)}</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Agent CTA ── */}
        <section className="rounded-2xl border border-primary-200 bg-primary-50 p-6 text-center">
          <h2 className="text-xl font-bold text-navy-900 mb-2">
            Ready to Enroll in This Plan?
          </h2>
          <p className="text-sm text-neutral-600 mb-5 max-w-md mx-auto">
            A licensed health insurance agent can verify your subsidy eligibility, compare this plan against alternatives, and help you enroll in {exchange} — at no cost to you.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Contact a licensed agent — free
          </a>
          <p className="text-xs text-neutral-400 mt-3">
            Licensed agents are available to assist with {exchange} enrollment.
          </p>
        </section>

        <GenericByline dataSource={`${plan.issuer_name} Summary of Benefits and Coverage (SBC)`} planYear={plan.plan_year} />

        {/* ── Back link ── */}
        <div className="border-t border-neutral-200 pt-6">
          <a
            href={`/${stateSlug}/health-insurance-plans`}
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
          >
            ← Back to all {stateName} health insurance plans
          </a>
        </div>

        {/* ── Footer disclaimer ── */}
        <footer className="text-xs text-neutral-400 border-t border-neutral-200 pt-4">
          <p>
            Plan data sourced from {plan.issuer_name} Summary of Benefits and Coverage (SBC) documents,
            plan year {plan.plan_year}. Deductibles and cost-sharing are estimates from SBC documents —
            always verify current plan details with your carrier. Premiums are not shown here as they vary
            by age, household size, and income. Source: {exchange}, plan year {plan.plan_year}.
          </p>
        </footer>

      </main>
    </>
  )
}
