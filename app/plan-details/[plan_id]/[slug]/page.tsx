import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPlanById, getSbcByPlanVariantId, getDentalByState, getAllSbcPlans } from '@/lib/data-loader'
import { generateSbcContent } from '@/lib/content-templates'
import { getRelatedEntities } from '@/lib/entity-linker'
import { buildSbcProductSchema, buildBreadcrumbSchema, buildArticleSchema } from '@/lib/schema-markup'
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
  if (val == null) return 'N/A'
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

  // Editorial content
  const editorial = sbc ? generateSbcContent({ plan, sbc, planYear: PLAN_YEAR }) : null

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

  return (
    <>
      {/* Schema JSON-LD */}
      <SchemaScript schema={breadcrumbSchema} id="schema-breadcrumb" />
      <SchemaScript schema={articleSchema} id="schema-article" />
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
