import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  searchFormulary,
  getPlansByCounty,
  getSbcByPlanVariantId,
  getDentalByState,
} from '@/lib/data-loader'
import {
  getCountyName,
  getStateName,
  stateSlugToCode,
  getFipsFromSlug,
  countySlugToName,
  getCountySlug,
  stateCodeToSlug,
} from '@/lib/county-lookup'
import { humanizeTier, getDominantTierGroup, interpretCoverage } from '@/lib/formulary-helpers'
import type { HumanTier } from '@/lib/formulary-helpers'
import type { PlanRecord, FormularyDrug, SbcRecord } from '@/lib/types'
import {
  getDrugCategory,
  getRelatedDrugs,
  getComparisonLinks,
  getRelatedGuides,
} from '@/lib/drug-linking'
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildSbcProductSchema,
} from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import DrugPageCta from '@/components/DrugPageCta'
import SBCGrid from '@/components/SBCGrid'
import EntityLinkCard from '@/components/EntityLinkCard'
import { generateSbcContent } from '@/lib/content-templates'
import { getRelatedEntities } from '@/lib/entity-linker'
import { parsePlanSlug, generatePlanSlug } from '@/lib/plan-slug'
import { getPlanBySlug } from '@/lib/plan-slug-server'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

// Dynamic rendering — loads large datasets on demand
export const dynamic = 'force-dynamic'

// ─── Shared params type ──────────────────────────────────────────────────────
//
// Route: app/[state-name]/[county-slug]/[county-page]/page.tsx
//
// This file is the dispatcher for two distinct county-scoped page types.
// The slug suffix in the [county-page] segment determines which to render:
//
//   /{state-slug}/{county-slug}/{plan-slug}-plan      → CountyPlanDetailPage (SBC)
//   /{state-slug}/{county-slug}/{drug-slug}-coverage  → CountyDrugPage
//
// The parser and rendering logic for each type are explicitly separate:
//   - parsePlanSlug()   validates -plan suffix; returns null otherwise
//   - parseDrugSlug()   validates -coverage suffix; returns null otherwise
//   - CountyPlanDetailPage renders plan/SBC pages only
//   - CountyDrugPage renders drug formulary pages only

interface Props {
  params: { 'state-name': string; 'county-slug': string; 'county-page': string }
}

// ─── Slug helpers ────────────────────────────────────────────────────────────

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** "metformin-coverage" → "metformin", null if suffix absent */
function parseDrugSlug(raw: string): string | null {
  if (!raw.endsWith('-coverage')) return null
  return raw.slice(0, -'-coverage'.length)
}

/** "metformin" → "Metformin" */
function drugSlugToDisplayName(slug: string): string {
  return titleCase(slug.replace(/-/g, ' '))
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const raw = params['county-page']
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) return { title: 'Not Found' }

  // ── Plan detail metadata ──
  if (parsePlanSlug(raw)) {
    const countyFips = getFipsFromSlug(params['county-slug'], stateCode)
    const plan = getPlanBySlug(raw, stateCode, countyFips ?? undefined)
    if (!plan) return { title: 'Plan Not Found | HealthInsuranceRenew' }

    const stateName = getStateName(stateCode)
    const countyDisplay = countyFips
      ? (getCountyName(countyFips) ?? countySlugToName(params['county-slug']))
      : stateName
    const stateSlug = stateCodeToSlug(stateCode)
    const countySlug = countyFips ? getCountySlug(countyFips) : null
    const planSlug = generatePlanSlug(plan.plan_name)
    const canonicalUrl = countySlug
      ? `${SITE_URL}/${stateSlug}/${countySlug}/${planSlug}`
      : `${SITE_URL}/${stateSlug}/${planSlug}`

    const deductible = plan.moop_individual != null ? `$${plan.moop_individual.toLocaleString()} OOP max` : ''
    const title = `${plan.plan_name} Benefits & Coverage ${PLAN_YEAR} | ${countyDisplay}`
    const description =
      `${plan.issuer_name} ${plan.metal_level} plan in ${countyDisplay}, ${stateName}. ` +
      `${deductible ? deductible + '. ' : ''}` +
      `Full cost-sharing grid, covered services, exclusions. Source: CMS PUF ${PLAN_YEAR}.`

    return {
      title,
      description: description.slice(0, 160),
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: 'article',
        title,
        description: description.slice(0, 160),
        url: canonicalUrl,
        siteName: 'HealthInsuranceRenew',
        locale: 'en_US',
      },
    }
  }

  // ── Drug coverage metadata ──
  const stateName = getStateName(stateCode)
  const countyFips = getFipsFromSlug(params['county-slug'], stateCode)
  const countyDisplay = countyFips
    ? (getCountyName(countyFips) ?? countySlugToName(params['county-slug']))
    : countySlugToName(params['county-slug'])

  const drugSlug = parseDrugSlug(raw)
  if (!drugSlug) return { title: 'Not Found' }

  const drugName = drugSlugToDisplayName(drugSlug)
  const canonicalUrl = `${SITE_URL}/${params['state-name']}/${params['county-slug']}/${params['county-page']}`

  const title = `${drugName} Coverage in ${countyDisplay} (${PLAN_YEAR})`
  const description =
    `Is ${drugName} covered by Marketplace plans in ${countyDisplay}, ${stateName}? ` +
    `Check coverage status, cost tier, prior authorization, and which ${PLAN_YEAR} plans include this medication.`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonicalUrl,
      siteName: 'HealthInsuranceRenew',
      locale: 'en_US',
    },
  }
}

// ─── Page dispatcher ──────────────────────────────────────────────────────────

export default async function CountyContentPage({ params }: Props) {
  const raw = params['county-page']

  if (parsePlanSlug(raw)) {
    return <CountyPlanDetailPage params={params} />
  }

  const drugSlug = parseDrugSlug(raw)
  if (!drugSlug) notFound()

  return <CountyDrugPage params={params} drugSlug={drugSlug} />
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN DETAIL PAGE
// Route: /{state-slug}/{county-slug}/{plan-slug}-plan
// Canonical SBC / plan detail page with clean location-aware URL.
// ═══════════════════════════════════════════════════════════════════════════════

async function CountyPlanDetailPage({ params }: Props) {
  const raw = params['county-page']
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) notFound()

  const countyFips = getFipsFromSlug(params['county-slug'], stateCode)
  const plan = getPlanBySlug(raw, stateCode, countyFips ?? undefined)
  if (!plan) notFound()

  const stateSlug = stateCodeToSlug(stateCode)
  const stateName = getStateName(stateCode)
  const countyDisplay = countyFips
    ? (getCountyName(countyFips) ?? countySlugToName(params['county-slug']))
    : stateName
  const resolvedCountySlug = countyFips ? getCountySlug(countyFips) : null
  const planSlug = generatePlanSlug(plan.plan_name)
  const canonicalUrl = resolvedCountySlug
    ? `${SITE_URL}/${stateSlug}/${resolvedCountySlug}/${planSlug}`
    : `${SITE_URL}/${stateSlug}/${planSlug}`

  // ── Data ──
  const sbc = await getSbcByPlanVariantId(plan.plan_variant_id ?? plan.plan_id)

  const editorial = generateSbcContent({
    plan,
    sbc: sbc ?? { plan_variant_id: plan.plan_variant_id ?? '', cost_sharing_grid: {}, exclusions: [] },
    planYear: PLAN_YEAR,
  })

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
    countyName: countyDisplay,
    hasFormularyData: true,
    hasDentalEquivalent,
  })

  // ── Schema ──
  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: `${stateName} Health Insurance Plans`, url: `${SITE_URL}/${stateSlug}/health-insurance-plans` },
    ...(resolvedCountySlug
      ? [{ name: countyDisplay, url: `${SITE_URL}/${stateSlug}/${resolvedCountySlug}` }]
      : []),
    { name: plan.plan_name, url: canonicalUrl },
  ]
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems)

  const articleSchema = buildArticleSchema({
    headline: `${plan.plan_name} — Summary of Benefits & Coverage ${PLAN_YEAR}`,
    description: `Detailed cost-sharing, deductible, OOP max, and exclusion data for ${plan.plan_name} by ${plan.issuer_name}.`,
    dateModified: new Date().toISOString().split('T')[0],
    dataSourceName: 'CMS Plan Attributes & Benefits Cost Sharing PUF',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  const sbcSchemas = sbc ? buildSbcProductSchema({ plan, sbc, planYear: PLAN_YEAR }) : []

  const exclusions = sbc?.exclusions ?? []
  const confirmedExclusions = exclusions.filter((e) => !e.needs_pdf_parsing)
  const pendingExclusions = exclusions.filter((e) => e.needs_pdf_parsing)

  const deductibleDisplay = plan.moop_individual != null
    ? `$${plan.moop_individual.toLocaleString()} for an individual`
    : 'listed in the plan documents'
  const oopDisplay = plan.moop_individual != null
    ? `$${plan.moop_individual.toLocaleString()} for an individual`
    : 'listed in the plan documents'
  const metalDisplay = plan.metal_level.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const sbcFaqs = buildPlanFAQs(plan.plan_name, plan.issuer_name, metalDisplay, deductibleDisplay, oopDisplay, PLAN_YEAR)
  const faqSchema = buildFAQSchema(sbcFaqs)

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="schema-breadcrumb" />
      <SchemaScript schema={articleSchema} id="schema-article" />
      <SchemaScript schema={faqSchema} id="schema-faq" />
      {sbcSchemas.map((schema, i) => (
        <SchemaScript key={i} schema={schema} id={`schema-sbc-${i}`} />
      ))}

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-400 mb-6">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li><Link href="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/${stateSlug}/health-insurance-plans`} className="hover:text-primary-600 transition-colors">
                {stateName}
              </Link>
            </li>
            {resolvedCountySlug && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/${stateSlug}/${resolvedCountySlug}`} className="hover:text-primary-600 transition-colors">
                    {countyDisplay}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="text-neutral-600 font-medium truncate max-w-[300px]">{plan.plan_name}</li>
          </ol>
        </nav>

        {/* ── Plan Snapshot Card ── */}
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
              <div className="text-xs text-neutral-500 mb-1">Location</div>
              <div className="text-sm font-semibold text-navy-800">{countyDisplay}, {stateCode}</div>
            </div>
          </div>
        </div>

        {/* ── Header ── */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <MetalBadge level={plan.metal_level} />
            <span className="text-sm text-neutral-500">{plan.plan_type}</span>
          </div>
          <h1 className="text-3xl font-bold text-navy-900 mb-1">
            {plan.plan_name} — Summary of Benefits &amp; Coverage {PLAN_YEAR}
          </h1>
          <p className="text-neutral-500">
            {plan.issuer_name} · {countyDisplay}, {stateName}
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·
            Data Version: CMS Marketplace PUF {PLAN_YEAR} · Plan Year: {PLAN_YEAR}
          </p>
        </header>

        {/* ── Key costs ── */}
        <section aria-label="Key costs" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <CostBox label="Deductible" sublabel="Individual" value={dollars(plan.deductible_individual)}
            tooltip="The amount you pay out of pocket for covered services before your plan begins to pay." />
          <CostBox label="Deductible" sublabel="Family" value={dollars(plan.deductible_family)}
            tooltip="Combined amount all family members must pay before the plan pays. Usually 2× individual." />
          <CostBox label="Out-of-Pocket Max" sublabel="Individual" value={dollars(plan.moop_individual)}
            tooltip="The most you'll pay in a year for covered in-network care. After this, your plan pays 100%." highlight />
          <CostBox label="Out-of-Pocket Max" sublabel="Family" value={dollars(plan.moop_family)}
            tooltip={`The most your family will pay combined. ACA sets the max for families in ${PLAN_YEAR}.`} highlight />
        </section>

        <WhatThisMeansForYou metalLevel={plan.metal_level} />
        <RealWorldCostExamples metalLevel={plan.metal_level} deductibleIndividual={plan.deductible_individual} />

        {/* ── Cost-sharing grid ── */}
        {sbc ? (
          <div className="mb-10"><SBCGrid sbc={sbc} /></div>
        ) : (
          <div className="mb-10 p-6 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
            <p className="text-neutral-500">
              Detailed cost-sharing data is not yet available for this plan variant.
              Check back soon or contact the carrier directly.
            </p>
          </div>
        )}

        {/* ── Exclusions ── */}
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

        {/* ── Important Notices ── */}
        <section aria-labelledby="notices-heading" className="mb-10 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
          <h2 id="notices-heading" className="text-base font-semibold text-blue-900 mb-2">Important Notices</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>This is a summary of benefits and coverage. It is not a contract. The actual plan documents govern actual coverage terms, limitations, and exclusions.</li>
            <li>Cost-sharing amounts shown apply to in-network providers. Out-of-network costs may be significantly higher.</li>
            <li>Preventive care services are covered at no cost under all ACA-compliant plans when provided by an in-network provider.</li>
          </ul>
        </section>

        {/* ── Editorial content ── */}
        {editorial && (
          <section className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }} />
        )}

        {/* ── FAQ ── */}
        <section aria-labelledby="faq-heading" className="mb-10">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {sbcFaqs.map((faq, i) => (
              <details key={i} className="group border border-neutral-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors list-none">
                  <span className="font-medium text-navy-800 text-sm pr-4">{faq.question}</span>
                  <svg className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Data Methodology ── */}
        <section aria-labelledby="methodology-heading" className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <h2 id="methodology-heading" className="text-sm font-semibold text-neutral-700 mb-2">Data Methodology</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Plan cost-sharing numbers are derived from CMS Marketplace Public Use Files for plan year {PLAN_YEAR}.
            Plan details may vary by county and plan variant. Users should confirm coverage with the insurer before enrollment.
            Data is updated when CMS publishes new PUF releases.
          </p>
        </section>

        {/* ── Sources ── */}
        <section aria-labelledby="sources-heading" className="mb-10 rounded-xl border border-neutral-200 p-5">
          <h2 id="sources-heading" className="text-sm font-semibold text-neutral-700 mb-3">Sources</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="https://www.cms.gov/marketplace/resources/data/public-use-files" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">
                CMS Plan Attributes PUF
              </a>
              <span className="text-neutral-500"> — Plan benefit design, metal level, network type, and cost-sharing parameters.</span>
            </li>
            <li>
              <a href="https://www.cms.gov/marketplace/resources/data/public-use-files" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">
                CMS Benefits &amp; Cost Sharing PUF
              </a>
              <span className="text-neutral-500"> — Per-service copay/coinsurance grid and exclusion data for all plan variants.</span>
            </li>
            <li>
              <a href="https://www.healthcare.gov/health-care-law-protections/summary-of-benefits-and-coverage/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">
                Healthcare.gov SBC Documentation
              </a>
              <span className="text-neutral-500"> — Official ACA guidance on Summary of Benefits and Coverage requirements.</span>
            </li>
          </ul>
        </section>

        <EntityLinkCard links={entityLinks} title="Explore Related Coverage Data" variant="bottom" />
      </main>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRUG COVERAGE PAGE
// Route: /{state-slug}/{county-slug}/{drug-slug}-coverage
// (existing functionality — preserved unchanged)
// ═══════════════════════════════════════════════════════════════════════════════

interface DrugPageProps {
  params: Props['params']
  drugSlug: string
}

async function CountyDrugPage({ params, drugSlug }: DrugPageProps) {
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) notFound()

  const countyFips = getFipsFromSlug(params['county-slug'], stateCode)
  if (!countyFips) notFound()

  const stateName = getStateName(stateCode)
  const countyDisplay = getCountyName(countyFips) ?? countySlugToName(params['county-slug'])
  const drugName = drugSlugToDisplayName(drugSlug)
  const canonicalUrl = `${SITE_URL}/${params['state-name']}/${params['county-slug']}/${params['county-page']}`

  const countyPlans = getPlansByCounty(stateCode, countyFips)
  const issuerIds = [...new Set(countyPlans.map((p) => p.issuer_id))]
  const carrierCount = new Set(countyPlans.map((p) => p.issuer_name)).size

  const formularyResults = await searchFormulary({
    drug_name: drugSlug.replace(/-/g, ' '),
    state_code: stateCode,
  })

  const countyResults = formularyResults.filter((r) =>
    r.issuer_ids?.some((id) => issuerIds.includes(id))
  )

  const hasCoverageData = countyResults.length > 0
  const tierGroup = hasCoverageData
    ? getDominantTierGroup(countyResults.map((r) => r.drug_tier ?? ''))
    : null
  const humanTier = tierGroup ? humanizeTier(tierGroup) : null

  const hasPriorAuth = countyResults.some((r) => r.prior_authorization)
  const hasStepTherapy = countyResults.some((r) => r.step_therapy)
  const hasQuantityLimit = countyResults.some((r) => r.quantity_limit)
  const priorAuthPct = countyResults.length > 0
    ? (countyResults.filter((r) => r.prior_authorization).length / countyResults.length) * 100
    : 0

  const coverageInterpretation = hasCoverageData && tierGroup
    ? interpretCoverage({
        drugName,
        totalPlans: countyResults.length,
        dominantGroup: tierGroup,
        hasPriorAuth,
        priorAuthPct,
        hasGenericAvailable: tierGroup === 'generic',
      })
    : null

  const issuerCoverageList = buildIssuerCoverageMap(countyResults, countyPlans)

  const category = getDrugCategory(drugSlug.replace(/-/g, ' '))
  const relatedDrugs = getRelatedDrugs(drugSlug.replace(/-/g, ' '), stateCode.toLowerCase(), 6)
  const comparisons = getComparisonLinks(drugSlug.replace(/-/g, ' '), 3)
  const guides = getRelatedGuides(category)

  const faqs = buildDrugFAQContent(drugName, countyDisplay, stateName, tierGroup, hasPriorAuth)

  const articleSchema = buildArticleSchema({
    headline: `${drugName} Coverage in ${countyDisplay} (${PLAN_YEAR})`,
    description: `${drugName} formulary coverage across Marketplace plans in ${countyDisplay}, ${stateName} for plan year ${PLAN_YEAR}.`,
    dateModified: new Date().toISOString().slice(0, 7),
    dataSourceName: 'CMS Machine-Readable Formulary PUF',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Drug Coverage', url: `${SITE_URL}/drugs` },
    { name: `${stateName} Health Insurance Plans`, url: `${SITE_URL}/${params['state-name']}/health-insurance-plans` },
    { name: countyDisplay, url: `${SITE_URL}/${params['state-name']}/${params['county-slug']}` },
    { name: drugName, url: canonicalUrl },
  ])

  const faqSchema = buildFAQSchema(faqs)

  return (
    <>
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li>
              <a href={`/${params['state-name']}/health-insurance-plans`} className="hover:underline text-primary-600">
                {stateName}
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li>
              <a href={`/${params['state-name']}/${params['county-slug']}`} className="hover:underline text-primary-600">
                {countyDisplay}
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{drugName} Coverage</li>
          </ol>
        </nav>

        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-2">
            {stateName} Marketplace / Obamacare · {PLAN_YEAR}
          </p>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">
            {drugName} Coverage in {countyDisplay} ({PLAN_YEAR})
          </h1>
          <p className="text-neutral-600 text-base leading-relaxed max-w-3xl mb-5">
            Coverage data for <strong>{drugName}</strong> across{' '}
            {carrierCount} carrier{carrierCount !== 1 ? 's' : ''} offering Marketplace
            plans in {countyDisplay}, {stateName}. Source: CMS Machine-Readable
            Formulary PUF, {PLAN_YEAR}.
          </p>
          <DrugPageCta variant="hero" drugName={drugName} stateCode={stateCode} stateName={stateName} />
        </section>

        <section
          aria-labelledby="coverage-summary-heading"
          className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <div>
              <h2 id="coverage-summary-heading" className="text-base font-semibold text-navy-800">Coverage Summary</h2>
              <p className="text-xs text-neutral-500 mt-0.5">{countyDisplay} · {stateName} Marketplace · {PLAN_YEAR}</p>
            </div>
            {hasCoverageData && tierGroup && tierGroup !== 'unknown' && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${humanTier?.bg} ${humanTier?.color} ${humanTier?.border} border`}>
                {humanTier?.shortLabel}
              </span>
            )}
          </div>
          <div className="p-6">
            {hasCoverageData ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <SummaryItem label="Covered" value={tierGroup && tierGroup !== 'unknown' ? 'Yes — on most plans' : 'Varies by plan'} accent={tierGroup && tierGroup !== 'unknown' ? 'green' : 'neutral'} />
                <SummaryItem label="Cost range per fill" value={humanTier?.costRange ?? 'See plan details'} />
                <SummaryItem label="Tier" value={humanTier?.label ?? 'Varies by plan'} />
                <SummaryItem label="Prior Authorization" value={hasPriorAuth ? 'Required on some plans' : 'Not commonly required'} accent={hasPriorAuth ? 'amber' : 'green'} />
                {hasStepTherapy && <SummaryItem label="Step Therapy" value="Required on some plans — must try an alternative first" accent="amber" />}
                {hasQuantityLimit && <SummaryItem label="Quantity Limits" value="Applied on some plans" accent="amber" />}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-neutral-500 text-sm mb-3">
                  No formulary data found for {drugName} on county-specific plans. Coverage may still exist — check your plan directly.
                </p>
                <a href={`/formulary/${stateCode.toLowerCase()}/${drugSlug}`} className="text-sm text-primary-600 font-medium hover:underline">
                  View statewide {drugName} coverage for {stateName} →
                </a>
              </div>
            )}
          </div>
        </section>

        {coverageInterpretation && (
          <section className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm text-blue-800 leading-relaxed">{coverageInterpretation}</p>
          </section>
        )}

        {issuerCoverageList.length > 0 && (
          <section aria-labelledby="plans-covering-heading">
            <h2 id="plans-covering-heading" className="text-xl font-semibold text-navy-800 mb-2">
              Plans That Cover {drugName} in {countyDisplay}
            </h2>
            <p className="text-sm text-neutral-500 mb-5">
              {issuerCoverageList.length} carrier{issuerCoverageList.length !== 1 ? 's' : ''}{' '}
              include {drugName} in their {PLAN_YEAR} formulary for {countyDisplay}. Sorted by cost tier, lowest first.
            </p>
            <div className="space-y-4">
              {issuerCoverageList.map((issuer) => (
                <IssuerCoverageCard key={issuer.issuerId} issuer={issuer} stateSlug={params['state-name']} countySlug={params['county-slug']} />
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-4">
              Source: CMS Machine-Readable Formulary PUF, plan year {PLAN_YEAR}. Tier and restriction data reflect issuer formulary filings. Verify coverage directly with your insurer before enrolling.
            </p>
          </section>
        )}

        {humanTier && (
          <section aria-labelledby="tier-heading">
            <h2 id="tier-heading" className="text-lg font-semibold text-navy-800 mb-3">
              What does &ldquo;{humanTier.shortLabel}&rdquo; tier mean for your costs?
            </h2>
            <div className={`p-5 rounded-xl border ${humanTier.border} ${humanTier.bg}`}>
              <p className={`font-semibold text-sm ${humanTier.color} mb-1`}>{humanTier.label}</p>
              <p className={`text-sm ${humanTier.color} opacity-80 mb-2`}>{humanTier.costHint}</p>
              <p className={`text-sm ${humanTier.color}`}>
                Estimated cost: <strong>{humanTier.costRange} per fill</strong> after deductible, on plans where this tier applies.
              </p>
            </div>
          </section>
        )}

        {relatedDrugs.length > 0 && (
          <section aria-labelledby="related-drugs-heading">
            <h2 id="related-drugs-heading" className="text-lg font-semibold text-navy-800 mb-2">
              Related {category?.label ?? 'Medications'} in {countyDisplay}
            </h2>
            {category && (
              <p className="text-sm text-neutral-500 mb-4">
                Other{' '}
                <a href={`/drugs/categories/${category.id}`} className="text-primary-600 hover:underline font-medium">
                  {category.label}
                </a>{' '}
                — check county-level coverage for each.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {relatedDrugs.map((rd) => (
                <a key={rd.slug} href={`/${params['state-name']}/${params['county-slug']}/${rd.slug}-coverage`}
                  className="px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700 font-medium hover:bg-primary-100 hover:border-primary-300 transition-colors">
                  {rd.name}
                </a>
              ))}
            </div>
          </section>
        )}

        <DrugPageCta variant="mid" drugName={drugName} stateCode={stateCode} stateName={stateName} />

        {comparisons.length > 0 && (
          <section aria-labelledby="compare-heading">
            <h2 id="compare-heading" className="text-lg font-semibold text-navy-800 mb-4">
              Compare {drugName} with Similar Medications
            </h2>
            <div className="space-y-2">
              {comparisons.map((cmp) => (
                <a key={cmp.href} href={cmp.href}
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group text-sm">
                  <span className="font-medium text-navy-900 group-hover:text-primary-700">{cmp.label}</span>
                  <svg className="w-4 h-4 text-neutral-400 group-hover:text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-navy-800 mb-2">All Marketplace Plans in {countyDisplay}</h2>
          <p className="text-sm text-neutral-600 mb-3">
            {countyPlans.length} plan{countyPlans.length !== 1 ? 's' : ''} from{' '}
            {carrierCount} carrier{carrierCount !== 1 ? 's' : ''} available in {countyDisplay}.
          </p>
          <a href={`/${params['state-name']}/${params['county-slug']}`} className="text-sm text-primary-600 font-medium hover:underline">
            Compare all {countyDisplay} plans →
          </a>
        </section>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-5">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-neutral-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-navy-900 font-medium text-sm hover:bg-neutral-50 transition-colors list-none">
                  {faq.question}
                  <svg className="w-4 h-4 text-neutral-400 flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-4 pt-1 text-sm text-neutral-600 leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </section>

        {guides.length > 0 && (
          <section aria-labelledby="guides-heading">
            <h2 id="guides-heading" className="text-lg font-semibold text-navy-800 mb-4">Related Guides</h2>
            <div className="space-y-2">
              {guides.map((g) => (
                <a key={g.href} href={g.href} className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                  <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-400 group-hover:bg-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-navy-900 group-hover:text-primary-700">{g.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{g.context}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        <DrugPageCta variant="bottom" drugName={drugName} stateCode={stateCode} stateName={stateName} />

        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            <strong>Data methodology:</strong> Coverage data from the CMS Machine-Readable Formulary PUF, plan year {PLAN_YEAR},
            filtered to issuers with plans in {countyDisplay} (FIPS {countyFips}). Tier placement reflects issuer formulary
            filings and may change during the plan year.
          </p>
          <p>
            This page is for informational purposes only and does not constitute medical or insurance advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> to evaluate your specific coverage options.
            Always verify formulary coverage directly with your insurer before enrolling or filling a prescription.
          </p>
        </footer>
      </main>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS (plan detail)
// ═══════════════════════════════════════════════════════════════════════════════

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

function ExclusionIcon() {
  return (
    <svg className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}

function dollars(val: number | undefined | null): string {
  if (val == null) return 'See plan documents'
  return `$${val.toLocaleString()}`
}

function CostBox({ label, sublabel, value, tooltip, highlight }: {
  label: string; sublabel: string; value: string; tooltip: string; highlight?: boolean
}) {
  return (
    <div className={`relative group p-4 rounded-xl border ${highlight ? 'border-primary-200 bg-primary-50/50' : 'border-neutral-200 bg-neutral-50'}`}>
      <div className="text-xs text-neutral-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-xs text-neutral-400 mb-2">{sublabel}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-primary-800' : 'text-navy-800'}`}>{value}</div>
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-lg bg-neutral-800 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {tooltip}
      </span>
    </div>
  )
}

const METAL_GUIDANCE: Record<string, string> = {
  bronze: "Lower-premium plan. You'll pay less each month but more when you use care. Best for healthy people who rarely visit the doctor and want protection against major medical bills.",
  expanded_bronze: "Lower-premium plan. You'll pay less each month but more when you use care. Best for healthy people who rarely visit the doctor and want protection against major medical bills.",
  silver: 'The most popular metal level. Balanced premiums and out-of-pocket costs. If your income is under 250% FPL, Silver plans offer extra savings through Cost Sharing Reductions.',
  gold: 'Higher monthly premium but lower costs when you use care. Good choice if you see doctors regularly, take multiple medications, or have a planned surgery.',
  platinum: 'Highest premium but lowest out-of-pocket costs. Best for people with ongoing medical needs who want predictable costs.',
  catastrophic: 'Very low premiums but very high deductible. Only available to people under 30 or with a hardship exemption. Covers 3 primary care visits and preventive care before the deductible.',
}

function WhatThisMeansForYou({ metalLevel }: { metalLevel: string }) {
  const key = metalLevel.toLowerCase().replace(/\s+/g, '_')
  const description = METAL_GUIDANCE[key]
  if (!description) return null
  return (
    <section aria-labelledby="what-this-means-heading" className="mb-6 rounded-xl border border-green-200 bg-green-50/50 p-5">
      <h2 id="what-this-means-heading" className="text-base font-semibold text-green-900 mb-2">What This Means For You</h2>
      <p className="text-sm text-green-800 leading-relaxed">{description}</p>
    </section>
  )
}

const METAL_COINSURANCE: Record<string, number> = {
  bronze: 0.40, expanded_bronze: 0.40, silver: 0.30, gold: 0.20, platinum: 0.10, catastrophic: 0.40,
}

const COST_EXAMPLES: Array<{ service: string; typicalCharge: number; costLevel: 'low' | 'moderate' | 'high'; note?: string }> = [
  { service: 'Preventive Care Visit',  typicalCharge: 0,    costLevel: 'low',      note: 'Free — required by law' },
  { service: 'Primary Care Visit',     typicalCharge: 150,  costLevel: 'low' },
  { service: 'Specialist Visit',       typicalCharge: 300,  costLevel: 'moderate' },
  { service: 'Urgent Care Visit',      typicalCharge: 250,  costLevel: 'moderate' },
  { service: 'Emergency Room Visit',   typicalCharge: 1500, costLevel: 'high' },
  { service: 'Generic Drug (30-day)',  typicalCharge: 15,   costLevel: 'low' },
  { service: 'Branded Drug (30-day)',  typicalCharge: 200,  costLevel: 'moderate' },
]

const COST_LEVEL_STYLES = {
  low:      { row: 'bg-green-50/40',  badge: 'bg-green-100 text-green-700',  label: 'Low cost' },
  moderate: { row: 'bg-yellow-50/40', badge: 'bg-yellow-100 text-yellow-700', label: 'Moderate' },
  high:     { row: 'bg-red-50/40',    badge: 'bg-red-100 text-red-700',      label: 'High cost' },
}

function RealWorldCostExamples({ metalLevel, deductibleIndividual }: { metalLevel: string; deductibleIndividual?: number | null }) {
  const key = metalLevel.toLowerCase().replace(/\s+/g, '_')
  const coinsurance = METAL_COINSURANCE[key]
  if (coinsurance == null) return null
  const pct = Math.round(coinsurance * 100)
  const deductibleDisplay = deductibleIndividual != null ? `$${deductibleIndividual.toLocaleString()}` : 'your'
  const levelDisplay = metalLevel.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <section aria-labelledby="cost-examples-heading" className="mb-10">
      <h2 id="cost-examples-heading" className="text-xl font-semibold text-navy-800 mb-1">Real-World Cost Examples</h2>
      <p className="text-sm text-neutral-500 mb-4">
        Estimates based on {levelDisplay} tier (~{pct}% coinsurance). Before your {deductibleDisplay} deductible is met, you pay the full charge. After your deductible, you pay your coinsurance percentage.
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
              const isPreventive = ex.typicalCharge === 0
              return (
                <tr key={ex.service} className={`border-t border-neutral-100 ${style.row}`}>
                  <td className="px-4 py-2 font-medium text-neutral-700">
                    {ex.service}
                    {ex.note && <span className="ml-2 text-xs text-green-600">({ex.note})</span>}
                  </td>
                  <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>{style.label}</span></td>
                  <td className="px-4 py-2 text-neutral-600">{isPreventive ? '$0' : `~$${ex.typicalCharge.toLocaleString()}`}</td>
                  <td className="px-4 py-2 text-neutral-600">
                    {isPreventive ? <span className="text-green-600 font-medium">$0 (free)</span> : <>~${ex.typicalCharge.toLocaleString()} <span className="text-neutral-400 text-xs">(full cost)</span></>}
                  </td>
                  <td className="px-4 py-2 font-medium text-primary-700">
                    {isPreventive ? <span className="text-green-600">$0 (free)</span> : `~$${Math.round(ex.typicalCharge * coinsurance).toLocaleString()}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400 mt-3">
        Estimates only. Actual costs depend on your network provider, specific service codes, and plan cost-sharing rules.
      </p>
    </section>
  )
}

function buildPlanFAQs(planName: string, issuerName: string, metalDisplay: string, deductibleDisplay: string, oopDisplay: string, planYear: number) {
  return [
    {
      question: 'What is a Summary of Benefits and Coverage?',
      answer: `A Summary of Benefits and Coverage (SBC) is a standardized document required by the ACA that explains what a health plan covers and what costs you will pay. All insurers must provide an SBC to help consumers compare plans on equal terms. This page presents the SBC data for ${planName} by ${issuerName} for plan year ${planYear}, sourced from CMS Public Use Files.`,
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
      answer: `Yes. Under the ACA, all qualified health plans must cover preventive services — including annual checkups, immunizations, cancer screenings, and contraception — at no cost to you, even before your deductible is met. This applies when using in-network providers. ${planName} is an ACA-compliant plan and must follow this rule.`,
    },
  ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS (drug coverage)
// ═══════════════════════════════════════════════════════════════════════════════

interface IssuerCoverage {
  issuerId: string
  issuerName: string
  humanTier: HumanTier
  priorAuth: boolean
  stepTherapy: boolean
  quantityLimit: boolean
  plans: PlanRecord[]
}

function buildIssuerCoverageMap(formularyResults: FormularyDrug[], countyPlans: PlanRecord[]): IssuerCoverage[] {
  const issuerPlans = new Map<string, PlanRecord[]>()
  for (const plan of countyPlans) {
    const existing = issuerPlans.get(plan.issuer_id)
    if (existing) { existing.push(plan) } else { issuerPlans.set(plan.issuer_id, [plan]) }
  }
  const issuerNames = new Map<string, string>()
  for (const plan of countyPlans) {
    if (!issuerNames.has(plan.issuer_id)) issuerNames.set(plan.issuer_id, plan.issuer_name)
  }
  const issuerFormulary = new Map<string, FormularyDrug>()
  for (const record of formularyResults) {
    for (const id of record.issuer_ids ?? []) {
      if (!issuerFormulary.has(id)) issuerFormulary.set(id, record)
    }
  }
  const result: IssuerCoverage[] = []
  for (const [issuerId, record] of issuerFormulary) {
    const plans = issuerPlans.get(issuerId)
    if (!plans || plans.length === 0) continue
    const tierGroup = getDominantTierGroup([record.drug_tier ?? ''])
    const humanTier = humanizeTier(tierGroup)
    const issuerName = issuerNames.get(issuerId) ?? record.issuer_ids?.[0] ?? issuerId
    result.push({ issuerId, issuerName, humanTier, priorAuth: record.prior_authorization ?? false, stepTherapy: record.step_therapy ?? false, quantityLimit: record.quantity_limit ?? false, plans })
  }
  result.sort((a, b) => {
    if (a.priorAuth !== b.priorAuth) return a.priorAuth ? 1 : -1
    return a.humanTier.sortOrder - b.humanTier.sortOrder
  })
  return result
}

function IssuerCoverageCard({ issuer, stateSlug, countySlug }: { issuer: IssuerCoverage; stateSlug: string; countySlug: string }) {
  const planCount = issuer.plans.length
  const planPreview = issuer.plans.slice(0, 3).map((p) => p.plan_name)
  const hasMore = planCount > 3
  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-neutral-50 border-b border-neutral-100">
        <span className="font-semibold text-sm text-navy-900">{issuer.issuerName}</span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${issuer.humanTier.bg} ${issuer.humanTier.color} ${issuer.humanTier.border}`}>{issuer.humanTier.shortLabel}</span>
      </div>
      <div className="px-5 py-4 grid sm:grid-cols-3 gap-3 text-sm">
        <div><p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Cost range</p><p className="font-medium text-navy-800">{issuer.humanTier.costRange} per fill</p></div>
        <div><p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Prior Authorization</p><p className={`font-medium ${issuer.priorAuth ? 'text-amber-700' : 'text-green-700'}`}>{issuer.priorAuth ? 'Required' : 'Not required'}</p></div>
        <div><p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Step Therapy</p><p className={`font-medium ${issuer.stepTherapy ? 'text-amber-700' : 'text-neutral-600'}`}>{issuer.stepTherapy ? 'Required' : 'Not required'}</p></div>
      </div>
      <div className="px-5 pb-4">
        <p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">{planCount} plan{planCount !== 1 ? 's' : ''} available in this county</p>
        <ul className="space-y-1">
          {planPreview.map((name) => (<li key={name} className="text-xs text-neutral-600 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-neutral-300 flex-shrink-0" />{name}</li>))}
          {hasMore && <li className="text-xs text-neutral-400">+{planCount - 3} more plan{planCount - 3 !== 1 ? 's' : ''}</li>}
        </ul>
        <a href={`/${stateSlug}/${countySlug}`} className="inline-block mt-3 text-xs text-primary-600 font-medium hover:underline">
          Compare all plans from {issuer.issuerName} →
        </a>
      </div>
    </div>
  )
}

function SummaryItem({ label, value, accent = 'neutral' }: { label: string; value: string; accent?: 'green' | 'amber' | 'neutral' }) {
  const valueColor = accent === 'green' ? 'text-green-700' : accent === 'amber' ? 'text-amber-700' : 'text-navy-900'
  return (
    <div className="p-3 bg-neutral-50 rounded-xl">
      <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-semibold ${valueColor}`}>{value}</p>
    </div>
  )
}

interface FAQ { question: string; answer: string }

function buildDrugFAQContent(drugName: string, countyDisplay: string, stateName: string, tierGroup: string | null, hasPriorAuth: boolean): FAQ[] {
  return [
    {
      question: `Is ${drugName} covered by Marketplace plans in ${countyDisplay}?`,
      answer: `Coverage for ${drugName} in ${countyDisplay} depends on the specific plan. All ACA Marketplace plans must cover prescription drugs, but each insurer maintains its own formulary. The coverage summary above shows which carriers in ${countyDisplay} include ${drugName} and at what cost tier.`,
    },
    {
      question: `How much does ${drugName} cost on a Marketplace plan in ${countyDisplay}?`,
      answer: `${tierGroup === 'generic' ? `As a generic medication, ${drugName} typically costs $5–$20 per fill after your deductible on plans that cover it.` : tierGroup === 'specialty' ? `${drugName} is classified as a specialty drug on most plans, which can mean significant out-of-pocket costs until your out-of-pocket maximum is reached.` : `Your cost depends on the plan's tier placement, your deductible, and out-of-pocket maximum.`} Compare plans in ${countyDisplay} to find the lowest cost for this medication.`,
    },
    {
      question: `Does ${drugName} require prior authorization in ${countyDisplay}?`,
      answer: hasPriorAuth
        ? `Some Marketplace plans in ${countyDisplay} require prior authorization for ${drugName}. This means your doctor must submit documentation to your insurer before the plan will approve coverage. If denied, you have the right to appeal under federal law (45 C.F.R. § 156.122).`
        : `Based on our data, prior authorization is not commonly required for ${drugName} on Marketplace plans in ${countyDisplay}. Requirements can vary by plan — always confirm directly with your insurer or pharmacist.`,
    },
    {
      question: `Which carrier in ${countyDisplay} offers the best coverage for ${drugName}?`,
      answer: `Coverage quality depends on cost tier (lower tier = lower cost) and restrictions. See the "Plans That Cover ${drugName}" section above for a carrier-by-carrier breakdown. Generally, carriers that place ${drugName} on a lower tier with no prior authorization requirement will offer the best coverage.`,
    },
    {
      question: `What can I do if my plan in ${countyDisplay} doesn't cover ${drugName}?`,
      answer: `You have several options: (1) Request a formulary exception — your doctor can document medical necessity. Plans must have an exception process under 45 C.F.R. § 156.122. (2) Ask about covered alternatives in the same drug class. (3) Switch plans during open enrollment to one that covers ${drugName} at a lower tier. (4) Ask the manufacturer about patient assistance programs.`,
    },
  ]
}

// Suppress unused import warning — SbcRecord is used in the async function
void (null as unknown as SbcRecord)
