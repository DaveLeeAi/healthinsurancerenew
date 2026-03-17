import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPlanById, getSbcByPlanVariantId, getDentalByState, getAllSbcPlans } from '@/lib/data-loader'
import { generateSbcContent } from '@/lib/content-templates'
import { getRelatedEntities } from '@/lib/entity-linker'
import { buildSbcProductSchema, buildBreadcrumbSchema, buildArticleSchema, buildFAQSchema } from '@/lib/schema-markup'
import SBCGrid from '@/components/SBCGrid'
import EntityLinkCard from '@/components/EntityLinkCard'
import SchemaScript from '@/components/SchemaScript'

// ─── Config ─────────────────────────────────────────────────────────────────

// force-dynamic: dataset is too large (~107 MB + ~429 MB) to pre-render all ~20K plans at build time.
// generateStaticParams below tells Next.js which paths exist for routing/sitemap purposes.
export const dynamic = 'force-dynamic'

const PLAN_YEAR = 2025

interface Props {
  params: { plan_id: string; slug: string }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── Static params ───────────────────────────────────────────────────────────

export function generateStaticParams(): { plan_id: string; slug: string }[] {
  return getAllSbcPlans().map(({ plan_variant_id, plan_name }) => ({
    plan_id: plan_variant_id,
    slug: slugify(plan_name),
  }))
}

// ─── Metal level badge styling ──────────────────────────────────────────────

const METAL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bronze:           { bg: 'bg-amber-100',  text: 'text-amber-800',   border: 'border-amber-300' },
  expanded_bronze:  { bg: 'bg-amber-100',  text: 'text-amber-800',   border: 'border-amber-300' },
  silver:           { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300' },
  gold:             { bg: 'bg-yellow-100', text: 'text-yellow-800',  border: 'border-yellow-400' },
  platinum:         { bg: 'bg-slate-200',  text: 'text-slate-800',   border: 'border-slate-400' },
  catastrophic:     { bg: 'bg-red-100',    text: 'text-red-800',     border: 'border-red-300' },
}

function MetalBadge({ level }: { level: string }) {
  const key = level.toLowerCase().replace(/\s+/g, '_')
  const style = METAL_COLORS[key] ?? { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-300' }
  const display = level.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
      {display}
    </span>
  )
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const plan = getPlanById(params.plan_id)
  if (!plan) return { title: 'Plan Not Found | HealthInsuranceRenew' }

  const deductible = plan.deductible_individual != null ? `$${plan.deductible_individual.toLocaleString()} deductible` : ''
  const oopMax = plan.moop_individual != null ? `$${plan.moop_individual.toLocaleString()} OOP max` : ''
  const costSnippet = [deductible, oopMax].filter(Boolean).join(', ')

  const title = `${plan.plan_name} Benefits & Coverage ${PLAN_YEAR} | Deductible, Copays, Exclusions`
  const description = `${plan.issuer_name} ${plan.metal_level} plan in ${plan.state_code}. ${costSnippet ? costSnippet + '. ' : ''}Full cost-sharing grid, covered services, exclusions, and what you'll pay. Source: CMS PUF data.`

  const canonicalUrl = `https://healthinsurancerenew.com/plan-details/${params.plan_id}/${params.slug}`

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      type: 'website',
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dollars(val: number | undefined | null): string {
  if (val == null) return 'See plan documents'
  return `$${val.toLocaleString()}`
}

// ─── Exclusion category icons ───────────────────────────────────────────────

function ExclusionIcon() {
  return (
    <svg className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default async function PlanDetailsPage({ params }: Props) {
  const plan = getPlanById(params.plan_id)
  if (!plan) notFound()

  const sbc = await getSbcByPlanVariantId(plan.plan_variant_id ?? params.plan_id)

  // Editorial content — always generate; fall back to empty sbc shell when data not available
  const editorial = generateSbcContent({
    plan,
    sbc: sbc ?? { plan_variant_id: plan.plan_variant_id ?? '', cost_sharing_grid: {}, exclusions: [] },
    planYear: PLAN_YEAR,
  })

  // Entity links
  const hasDentalEquivalent = getDentalByState(plan.state_code).some(
    (d) => d.issuer_name === plan.issuer_name
  )
  const entityLinks = getRelatedEntities({
    pageType: 'plan-detail',
    plan: {
      plan_id: plan.plan_id,
      plan_name: plan.plan_name,
      issuer_name: plan.issuer_name,
      state_code: plan.state_code,
      county_fips: plan.county_fips,
      plan_variant_id: plan.plan_variant_id,
    },
    hasFormularyData: true,
    hasDentalEquivalent,
  })

  // Schema markup
  const planUrl = `https://healthinsurancerenew.com/plan-details/${params.plan_id}/${params.slug}`

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://healthinsurancerenew.com' },
    { name: 'Plans', url: `https://healthinsurancerenew.com/plans` },
    { name: plan.state_code, url: `https://healthinsurancerenew.com/plans/${plan.state_code.toLowerCase()}/${plan.county_fips}` },
    { name: plan.plan_name, url: planUrl },
  ])

  const articleSchema = buildArticleSchema({
    headline: `${plan.plan_name} — Summary of Benefits & Coverage ${PLAN_YEAR}`,
    description: `Detailed cost-sharing, deductible, OOP max, and exclusion data for ${plan.plan_name} by ${plan.issuer_name}.`,
    dateModified: new Date().toISOString().split('T')[0],
    dataSourceName: 'CMS Plan Attributes & Benefits Cost Sharing PUF',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  const sbcSchemas = sbc
    ? buildSbcProductSchema({ plan, sbc, planYear: PLAN_YEAR })
    : []

  const exclusions = sbc?.exclusions ?? []
  const confirmedExclusions = exclusions.filter((e) => !e.needs_pdf_parsing)
  const pendingExclusions = exclusions.filter((e) => e.needs_pdf_parsing)

  // ── FAQ data (Feature 4) ──────────────────────────────────────────────────
  const deductibleDisplay = plan.deductible_individual != null
    ? `$${plan.deductible_individual.toLocaleString()} for an individual`
    : 'listed in the plan documents'
  const oopDisplay = plan.moop_individual != null
    ? `$${plan.moop_individual.toLocaleString()} for an individual`
    : 'listed in the plan documents'
  const metalDisplay = plan.metal_level.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const sbcFaqs = [
    {
      question: 'What is a Summary of Benefits and Coverage?',
      answer: `A Summary of Benefits and Coverage (SBC) is a standardized document required by the ACA that explains what a health plan covers and what costs you will pay. All insurers must provide an SBC to help consumers compare plans on equal terms. This page presents the SBC data for ${plan.plan_name} by ${plan.issuer_name} for plan year ${PLAN_YEAR}, sourced from CMS Public Use Files.`,
    },
    {
      question: `What does the deductible mean for this plan?`,
      answer: `The deductible for this plan is ${deductibleDisplay}. This is the amount you must pay out of pocket for covered services before your plan begins to pay. Most services require the deductible to be met first, though ACA-mandated preventive care is always covered at no cost regardless of deductible status.`,
    },
    {
      question: `What is the out-of-pocket maximum for this plan?`,
      answer: `The out-of-pocket maximum for this plan is ${oopDisplay}. Once you reach this annual limit, your insurer pays 100% of covered in-network costs for the rest of the plan year. The ACA sets a federal cap on out-of-pocket maximums each year to protect enrollees from catastrophic medical bills.`,
    },
    {
      question: `What is the difference between a copay and coinsurance?`,
      answer: `A copay is a fixed dollar amount you pay for a covered service — for example, $30 for a primary care visit. Coinsurance is a percentage of the cost you pay after your deductible is met — for example, 20% of a hospital bill. This ${metalDisplay} plan uses a combination of both depending on the service type, as shown in the cost-sharing grid above.`,
    },
    {
      question: `Are preventive services covered before the deductible on this plan?`,
      answer: `Yes. Under the ACA, all qualified health plans must cover preventive services — including annual checkups, immunizations, cancer screenings, and contraception — at no cost to you, even before your deductible is met. This applies when using in-network providers. ${plan.plan_name} is an ACA-compliant plan and must follow this rule.`,
    },
  ]
  const faqSchema = buildFAQSchema(sbcFaqs)

  return (
    <>
      {/* Schema JSON-LD */}
      <SchemaScript schema={breadcrumbSchema} id="schema-breadcrumb" />
      <SchemaScript schema={articleSchema} id="schema-article" />
      <SchemaScript schema={faqSchema} id="schema-faq" />
      {sbcSchemas.map((schema, i) => (
        <SchemaScript key={i} schema={schema} id={`schema-sbc-${i}`} />
      ))}

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-400 mb-6">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li><Link href="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/plans" className="hover:text-primary-600 transition-colors">Plans</Link></li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/plans/${plan.state_code.toLowerCase()}/${plan.county_fips}`}
                className="hover:text-primary-600 transition-colors"
              >
                {plan.state_code}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-600 font-medium truncate max-w-[300px]">{plan.plan_name}</li>
          </ol>
        </nav>

        {/* ── Feature 5: Plan Snapshot Card ── */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-3">Plan Snapshot</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-neutral-500 mb-1">Metal Level</div>
              <MetalBadge level={plan.metal_level} />
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Plan Type</div>
              <div className="text-sm font-semibold text-navy-800">{plan.plan_type}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Monthly Premium (Age 40)</div>
              <div className="text-sm font-semibold text-navy-800">
                {plan.premiums?.age_40 != null ? `$${plan.premiums.age_40.toLocaleString()}` : 'Get a quote'}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Deductible (Individual)</div>
              <div className="text-sm font-semibold text-navy-800">{dollars(plan.deductible_individual)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">OOP Max (Individual)</div>
              <div className="text-sm font-semibold text-primary-800">{dollars(plan.moop_individual)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">State</div>
              <div className="text-sm font-semibold text-navy-800">{plan.state_code}</div>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <MetalBadge level={plan.metal_level} />
            <span className="text-sm text-neutral-500">{plan.plan_type}</span>
          </div>
          <h1 className="text-3xl font-bold text-navy-900 mb-1">
            {plan.plan_name} — Summary of Benefits &amp; Coverage {PLAN_YEAR}
          </h1>
          <p className="text-neutral-500">
            {plan.issuer_name} · {plan.state_code} · Plan ID: {plan.plan_id}
          </p>
          {/* ── Feature 3: Data Version Bar ── */}
          <p className="text-xs text-neutral-400 mt-2">
            Last Updated: March 2026 · Data Version: CMS Marketplace PUF 2025 · Plan Year: 2025
          </p>
        </header>

        {/* Deductible & OOP Max callout boxes */}
        <section aria-label="Key costs" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <CostBox
            label="Deductible"
            sublabel="Individual"
            value={dollars(plan.deductible_individual)}
            tooltip="The amount you pay out of pocket for covered services before your plan begins to pay."
          />
          <CostBox
            label="Deductible"
            sublabel="Family"
            value={dollars(plan.deductible_family)}
            tooltip="Combined amount all family members must pay before the plan pays. Usually 2× individual."
          />
          <CostBox
            label="Out-of-Pocket Max"
            sublabel="Individual"
            value={dollars(plan.moop_individual)}
            tooltip="The most you'll pay in a year for covered in-network care. After this, your plan pays 100%."
            highlight
          />
          <CostBox
            label="Out-of-Pocket Max"
            sublabel="Family"
            value={dollars(plan.moop_family)}
            tooltip="The most your family will pay combined. ACA sets the max at $18,900 for families in 2025."
            highlight
          />
        </section>

        {/* What This Means For You */}
        <WhatThisMeansForYou metalLevel={plan.metal_level} />

        {/* Real-World Cost Examples */}
        <RealWorldCostExamples metalLevel={plan.metal_level} deductibleIndividual={plan.deductible_individual} />

        {/* Cost-sharing grid */}
        {sbc ? (
          <div className="mb-10">
            <SBCGrid sbc={sbc} />
          </div>
        ) : (
          <div className="mb-10 p-6 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
            <p className="text-neutral-500">
              Detailed cost-sharing data is not yet available for this plan variant.
              Check back soon or contact the carrier directly.
            </p>
          </div>
        )}

        {/* What's NOT Covered */}
        {exclusions.length > 0 && (
          <section aria-labelledby="exclusions-heading" className="mb-10">
            <h2 id="exclusions-heading" className="text-xl font-semibold text-navy-800 mb-1">
              What&apos;s NOT Covered
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Services and treatments this plan excludes or limits. Always verify with your carrier before receiving care.
            </p>

            {confirmedExclusions.length > 0 && (
              <ul className="space-y-2 mb-4">
                {confirmedExclusions.map((excl, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <ExclusionIcon />
                    <div>
                      <span className="font-medium text-neutral-700">{excl.category}:</span>{' '}
                      <span className="text-neutral-600">{excl.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {pendingExclusions.length > 0 && (
              <details className="group">
                <summary className="text-sm font-medium text-neutral-500 cursor-pointer hover:text-neutral-700 transition-colors">
                  {pendingExclusions.length} additional exclusion{pendingExclusions.length !== 1 ? 's' : ''} identified — details pending SBC document review
                </summary>
                <ul className="mt-3 space-y-2">
                  {pendingExclusions.map((excl, i) => (
                    <li key={i} className="flex gap-2.5 text-sm">
                      <ExclusionIcon />
                      <div>
                        <span className="font-medium text-neutral-700">{excl.category}:</span>{' '}
                        <span className="text-neutral-500 italic">{excl.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <p className="text-xs text-neutral-400 mt-3">
              Source: CMS Plan Attributes PUF exclusion fields. Some exclusions require carrier SBC document review for full detail.
            </p>
          </section>
        )}

        {/* Important Notices */}
        <section aria-labelledby="notices-heading" className="mb-10 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
          <h2 id="notices-heading" className="text-base font-semibold text-blue-900 mb-2">
            Important Notices
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              This is a summary of benefits and coverage. It is not a contract.
              The actual plan documents, including the Evidence of Coverage and policy,
              govern actual coverage terms, limitations, and exclusions.
            </li>
            <li>
              Cost-sharing amounts shown apply to in-network providers.
              Out-of-network costs may be significantly higher and may not count toward your deductible or out-of-pocket maximum.
            </li>
            <li>
              Preventive care services are covered at no cost to you under all ACA-compliant plans
              when provided by an in-network provider.
            </li>
          </ul>
        </section>

        {/* ── Editorial content ── */}
        {editorial && (
          <section className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }} />
        )}

        {/* ── Feature 4: FAQ Section ── */}
        <section aria-labelledby="faq-heading" className="mb-10">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {sbcFaqs.map((faq, i) => (
              <details key={i} className="group border border-neutral-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors list-none">
                  <span className="font-medium text-navy-800 text-sm pr-4">{faq.question}</span>
                  <svg className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Feature 2: Data Methodology Block ── */}
        <section aria-labelledby="methodology-heading" className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <h2 id="methodology-heading" className="text-sm font-semibold text-neutral-700 mb-2">Data Methodology</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Plan cost-sharing numbers and formulary information are derived from CMS Marketplace Public Use Files
            for plan year 2025. Plan details may vary by county and plan variant. Users should confirm coverage
            with the insurer before enrollment. Data is updated when CMS publishes new PUF releases.
          </p>
        </section>

        {/* ── Feature 1: Source Citations ── */}
        <section aria-labelledby="sources-heading" className="mb-10 rounded-xl border border-neutral-200 p-5">
          <h2 id="sources-heading" className="text-sm font-semibold text-neutral-700 mb-3">Sources</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://www.cms.gov/marketplace/resources/data/public-use-files"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline font-medium"
              >
                CMS Plan Attributes PUF
              </a>
              <span className="text-neutral-500"> — Plan benefit design, metal level, network type, and cost-sharing parameters.</span>
            </li>
            <li>
              <a
                href="https://www.cms.gov/marketplace/resources/data/public-use-files"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline font-medium"
              >
                CMS Benefits &amp; Cost Sharing PUF
              </a>
              <span className="text-neutral-500"> — Per-service copay/coinsurance grid and exclusion data for all plan variants.</span>
            </li>
            <li>
              <a
                href="https://www.healthcare.gov/health-care-law-protections/summary-of-benefits-and-coverage/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline font-medium"
              >
                Healthcare.gov SBC Documentation
              </a>
              <span className="text-neutral-500"> — Official ACA guidance on Summary of Benefits and Coverage requirements.</span>
            </li>
            <li className="text-neutral-500">
              Carrier plan documents — Always verify final coverage terms with the insurer&apos;s Evidence of Coverage.
            </li>
          </ul>
        </section>

        {/* Entity links */}
        <EntityLinkCard
          links={entityLinks}
          title="Explore Related Coverage Data"
          variant="bottom"
        />
      </main>
    </>
  )
}

// ─── What This Means For You ─────────────────────────────────────────────────

const METAL_GUIDANCE: Record<string, string> = {
  bronze:
    "This is a lower-premium plan. You'll pay less each month but more when you use care. Best for healthy people who rarely visit the doctor and want protection against major medical bills.",
  expanded_bronze:
    "This is a lower-premium plan. You'll pay less each month but more when you use care. Best for healthy people who rarely visit the doctor and want protection against major medical bills.",
  silver:
    'The most popular metal level. Balanced premiums and out-of-pocket costs. If your income is under 250% FPL, Silver plans offer extra savings through Cost Sharing Reductions.',
  gold:
    'Higher monthly premium but lower costs when you use care. Good choice if you see doctors regularly, take multiple medications, or have a planned surgery.',
  platinum:
    'Highest premium but lowest out-of-pocket costs. Best for people with ongoing medical needs who want predictable costs.',
  catastrophic:
    'Very low premiums but very high deductible. Only available to people under 30 or with a hardship exemption. Covers 3 primary care visits and preventive care before the deductible.',
}

function WhatThisMeansForYou({ metalLevel }: { metalLevel: string }) {
  const key = metalLevel.toLowerCase().replace(/\s+/g, '_')
  const description = METAL_GUIDANCE[key]
  if (!description) return null
  return (
    <section
      aria-labelledby="what-this-means-heading"
      className="mb-6 rounded-xl border border-green-200 bg-green-50/50 p-5"
    >
      <h2 id="what-this-means-heading" className="text-base font-semibold text-green-900 mb-2">
        What This Means For You
      </h2>
      <p className="text-sm text-green-800 leading-relaxed">{description}</p>
    </section>
  )
}

// ─── Real-World Cost Examples ─────────────────────────────────────────────────

const METAL_COINSURANCE: Record<string, number> = {
  bronze: 0.40,
  expanded_bronze: 0.40,
  silver: 0.30,
  gold: 0.20,
  platinum: 0.10,
  catastrophic: 0.40,
}

const COST_EXAMPLES: Array<{
  service: string
  typicalCharge: number
  costLevel: 'low' | 'moderate' | 'high'
  note?: string
}> = [
  { service: 'Preventive Care Visit', typicalCharge: 0, costLevel: 'low', note: 'Free — required by law' },
  { service: 'Primary Care Visit', typicalCharge: 150, costLevel: 'low' },
  { service: 'Specialist Visit', typicalCharge: 300, costLevel: 'moderate' },
  { service: 'Urgent Care Visit', typicalCharge: 250, costLevel: 'moderate' },
  { service: 'Emergency Room Visit', typicalCharge: 1500, costLevel: 'high' },
  { service: 'Generic Drug (30-day)', typicalCharge: 15, costLevel: 'low' },
  { service: 'Branded Drug (30-day)', typicalCharge: 200, costLevel: 'moderate' },
]

const COST_LEVEL_STYLES = {
  low:      { row: 'bg-green-50/40',  badge: 'bg-green-100 text-green-700',  label: 'Low cost' },
  moderate: { row: 'bg-yellow-50/40', badge: 'bg-yellow-100 text-yellow-700', label: 'Moderate' },
  high:     { row: 'bg-red-50/40',    badge: 'bg-red-100 text-red-700',      label: 'High cost' },
}

function RealWorldCostExamples({
  metalLevel,
  deductibleIndividual,
}: {
  metalLevel: string
  deductibleIndividual: number | null | undefined
}) {
  const key = metalLevel.toLowerCase().replace(/\s+/g, '_')
  const coinsurance = METAL_COINSURANCE[key]
  if (coinsurance == null) return null

  const pct = Math.round(coinsurance * 100)
  const deductibleDisplay =
    deductibleIndividual != null ? `$${deductibleIndividual.toLocaleString()}` : 'your'
  const levelDisplay = metalLevel.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <section aria-labelledby="cost-examples-heading" className="mb-10">
      <h2 id="cost-examples-heading" className="text-xl font-semibold text-navy-800 mb-1">
        Real-World Cost Examples
      </h2>
      <p className="text-sm text-neutral-500 mb-4">
        Estimates based on {levelDisplay} tier (~{pct}% coinsurance). Before your{' '}
        {deductibleDisplay} deductible is met, you pay the full charge. After your deductible,
        you pay your coinsurance percentage.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-2 font-semibold">Service</th>
              <th className="px-4 py-2 font-semibold">Cost Level</th>
              <th className="px-4 py-2 font-semibold">Typical Charge</th>
              <th className="px-4 py-2 font-semibold">Before Deductible</th>
              <th className="px-4 py-2 font-semibold">After Deductible</th>
            </tr>
          </thead>
          <tbody>
            {COST_EXAMPLES.map((ex) => {
              const style = COST_LEVEL_STYLES[ex.costLevel]
              const isPrevenetive = ex.typicalCharge === 0
              return (
                <tr key={ex.service} className={`border-t border-neutral-100 ${style.row}`}>
                  <td className="px-4 py-2 font-medium text-neutral-700">
                    {ex.service}
                    {ex.note && <span className="ml-2 text-xs text-green-600">({ex.note})</span>}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-600">
                    {isPrevenetive ? '$0' : `~$${ex.typicalCharge.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">
                    {isPrevenetive ? (
                      <span className="text-green-600 font-medium">$0 (free)</span>
                    ) : (
                      <>~${ex.typicalCharge.toLocaleString()}{' '}<span className="text-neutral-400 text-xs">(full cost)</span></>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-primary-700">
                    {isPrevenetive ? (
                      <span className="text-green-600">$0 (free)</span>
                    ) : (
                      `~$${Math.round(ex.typicalCharge * coinsurance).toLocaleString()}`
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400 mt-3">
        Estimates only. Actual costs depend on your network provider, specific service codes, and plan cost-sharing rules. Check your Evidence of Coverage for exact amounts.
      </p>
    </section>
  )
}

// ─── Cost callout box sub-component ────────────────────────────────────────

function CostBox({
  label,
  sublabel,
  value,
  tooltip,
  highlight,
}: {
  label: string
  sublabel: string
  value: string
  tooltip: string
  highlight?: boolean
}) {
  return (
    <div
      className={`relative group p-4 rounded-xl border ${
        highlight
          ? 'border-primary-200 bg-primary-50/50'
          : 'border-neutral-200 bg-neutral-50'
      }`}
    >
      <div className="text-xs text-neutral-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-xs text-neutral-400 mb-2">{sublabel}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-primary-800' : 'text-navy-800'}`}>
        {value}
      </div>
      {/* Tooltip on hover */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-lg bg-neutral-800 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {tooltip}
      </span>
    </div>
  )
}
