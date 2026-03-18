import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { searchFormulary, getPlansByCounty } from '@/lib/data-loader'
import {
  getCountyName,
  getStateName,
  stateSlugToCode,
  getFipsFromSlug,
  countySlugToName,
  countyNameToSlug,
  getCountySlug,
} from '@/lib/county-lookup'
import { humanizeTier, getDominantTierGroup, interpretCoverage } from '@/lib/formulary-helpers'
import type { HumanTier } from '@/lib/formulary-helpers'
import type { PlanRecord, FormularyDrug } from '@/lib/types'
import {
  getDrugCategory,
  getRelatedDrugs,
  getComparisonLinks,
  getRelatedGuides,
} from '@/lib/drug-linking'
import { buildArticleSchema, buildBreadcrumbSchema, buildFAQSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import DrugPageCta from '@/components/DrugPageCta'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

// Dynamic rendering — formulary_intelligence.json + plan_intelligence.json
export const dynamic = 'force-dynamic'

interface Props {
  params: { 'state-name': string; 'county-slug': string; 'drug-coverage': string }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** "metformin-coverage" → "metformin", rejects if suffix missing */
function parseDrugSlug(raw: string): string | null {
  if (!raw.endsWith('-coverage')) return null
  return raw.slice(0, -'-coverage'.length)
}

/** "metformin" → "Metformin",  "ozempic" → "Ozempic" */
function drugSlugToDisplayName(slug: string): string {
  return titleCase(slug.replace(/-/g, ' '))
}

// ── Per-issuer coverage record ───────────────────────────────────────────────

interface IssuerCoverage {
  issuerId: string
  issuerName: string
  humanTier: HumanTier
  priorAuth: boolean
  stepTherapy: boolean
  quantityLimit: boolean
  plans: PlanRecord[]
}

function buildIssuerCoverageMap(
  formularyResults: FormularyDrug[],
  countyPlans: PlanRecord[],
): IssuerCoverage[] {
  // Build issuer_id → plans map from county plans
  const issuerPlans = new Map<string, PlanRecord[]>()
  for (const plan of countyPlans) {
    const existing = issuerPlans.get(plan.issuer_id)
    if (existing) {
      existing.push(plan)
    } else {
      issuerPlans.set(plan.issuer_id, [plan])
    }
  }

  // Build issuer_id → issuer_name from county plans
  const issuerNames = new Map<string, string>()
  for (const plan of countyPlans) {
    if (!issuerNames.has(plan.issuer_id)) {
      issuerNames.set(plan.issuer_id, plan.issuer_name)
    }
  }

  // Collect issuers that appear in formulary results for this drug
  const issuerFormulary = new Map<string, FormularyDrug>()
  for (const record of formularyResults) {
    for (const id of record.issuer_ids ?? []) {
      if (!issuerFormulary.has(id)) {
        issuerFormulary.set(id, record)
      }
    }
  }

  const result: IssuerCoverage[] = []

  for (const [issuerId, record] of issuerFormulary) {
    // Only show issuers that actually have plans in this county
    const plans = issuerPlans.get(issuerId)
    if (!plans || plans.length === 0) continue

    const tierGroup = getDominantTierGroup([record.drug_tier ?? ''])
    const humanTier = humanizeTier(tierGroup)
    const issuerName = issuerNames.get(issuerId) ?? record.issuer_ids?.[0] ?? issuerId

    result.push({
      issuerId,
      issuerName,
      humanTier,
      priorAuth: record.prior_authorization ?? false,
      stepTherapy: record.step_therapy ?? false,
      quantityLimit: record.quantity_limit ?? false,
      plans,
    })
  }

  // Sort: no PA first, then by tier sort order (cheapest first)
  result.sort((a, b) => {
    if (a.priorAuth !== b.priorAuth) return a.priorAuth ? 1 : -1
    return a.humanTier.sortOrder - b.humanTier.sortOrder
  })

  return result
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) return { title: 'Not Found' }

  const stateName = getStateName(stateCode)
  const countyFips = getFipsFromSlug(params['county-slug'], stateCode)
  const countyDisplay = countyFips
    ? getCountyName(countyFips)
    : countySlugToName(params['county-slug'])

  const drugSlug = parseDrugSlug(params['drug-coverage'])
  if (!drugSlug) return { title: 'Not Found' }

  const drugName = drugSlugToDisplayName(drugSlug)
  const canonicalUrl = `${SITE_URL}/${params['state-name']}/${params['county-slug']}/${params['drug-coverage']}`

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CountyDrugPage({ params }: Props) {
  // Validate state slug
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) notFound()

  // Validate drug slug (must end in -coverage)
  const drugSlug = parseDrugSlug(params['drug-coverage'])
  if (!drugSlug) notFound()

  // Resolve county slug → FIPS
  const countyFips = getFipsFromSlug(params['county-slug'], stateCode)
  if (!countyFips) notFound()

  const stateName = getStateName(stateCode)
  const countyDisplay = getCountyName(countyFips)
  const drugName = drugSlugToDisplayName(drugSlug)
  const canonicalUrl = `${SITE_URL}/${params['state-name']}/${params['county-slug']}/${params['drug-coverage']}`

  // ── Data ──────────────────────────────────────────────────────────────────
  const countyPlans = getPlansByCounty(stateCode, countyFips)
  const issuerIds = [...new Set(countyPlans.map((p) => p.issuer_id))]
  const carrierCount = new Set(countyPlans.map((p) => p.issuer_name)).size

  const formularyResults = await searchFormulary({
    drug_name: drugSlug.replace(/-/g, ' '),
    state_code: stateCode,
  })

  // Filter formulary to issuers serving this county
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

  // Per-issuer coverage breakdown for "Plans covering this drug" section
  const issuerCoverageList = buildIssuerCoverageMap(countyResults, countyPlans)

  // ── Internal linking ──────────────────────────────────────────────────────
  const category = getDrugCategory(drugSlug.replace(/-/g, ' '))
  const relatedDrugs = getRelatedDrugs(drugSlug.replace(/-/g, ' '), stateCode.toLowerCase(), 6)
  const comparisons = getComparisonLinks(drugSlug.replace(/-/g, ' '), 3)
  const guides = getRelatedGuides(category)

  // ── Schema ────────────────────────────────────────────────────────────────
  const faqs = buildFAQContent(drugName, countyDisplay, stateName, tierGroup, hasPriorAuth)

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
    { name: stateName, url: `${SITE_URL}/plans/${stateCode.toLowerCase()}` },
    { name: countyDisplay, url: `${SITE_URL}/plans/${stateCode.toLowerCase()}/${countyFips}` },
    { name: drugName, url: canonicalUrl },
  ])

  const faqSchema = buildFAQSchema(faqs)

  return (
    <>
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li><a href="/drugs" className="hover:underline text-primary-600">Drug Coverage</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li>
              <a
                href={`/plans/${stateCode.toLowerCase()}/${countyFips}`}
                className="hover:underline text-primary-600"
              >
                {countyDisplay}
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{drugName}</li>
          </ol>
        </nav>

        {/* Hero */}
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
          <DrugPageCta
            variant="hero"
            drugName={drugName}
            stateCode={stateCode}
            stateName={stateName}
          />
        </section>

        {/* ── ANSWER BOX ─────────────────────────────────────────────────── */}
        <section
          aria-labelledby="coverage-summary-heading"
          className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <div>
              <h2 id="coverage-summary-heading" className="text-base font-semibold text-navy-800">
                Coverage Summary
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {countyDisplay} · {stateName} Marketplace · {PLAN_YEAR}
              </p>
            </div>
            {hasCoverageData && tierGroup && tierGroup !== 'unknown' && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${humanTier?.bg} ${humanTier?.color} ${humanTier?.border} border`}
              >
                {humanTier?.shortLabel}
              </span>
            )}
          </div>

          <div className="p-6">
            {hasCoverageData ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <SummaryItem
                  label="Covered"
                  value={tierGroup && tierGroup !== 'unknown' ? 'Yes — on most plans' : 'Varies by plan'}
                  accent={tierGroup && tierGroup !== 'unknown' ? 'green' : 'neutral'}
                />
                <SummaryItem
                  label="Cost range per fill"
                  value={humanTier?.costRange ?? 'See plan details'}
                />
                <SummaryItem
                  label="Tier"
                  value={humanTier?.label ?? 'Varies by plan'}
                />
                <SummaryItem
                  label="Prior Authorization"
                  value={hasPriorAuth ? 'Required on some plans' : 'Not commonly required'}
                  accent={hasPriorAuth ? 'amber' : 'green'}
                />
                {hasStepTherapy && (
                  <SummaryItem
                    label="Step Therapy"
                    value="Required on some plans — must try an alternative first"
                    accent="amber"
                  />
                )}
                {hasQuantityLimit && (
                  <SummaryItem
                    label="Quantity Limits"
                    value="Applied on some plans"
                    accent="amber"
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-neutral-500 text-sm mb-3">
                  No formulary data found for {drugName} on county-specific plans.
                  Coverage may still exist — check your plan directly.
                </p>
                <a
                  href={`/formulary/${stateCode.toLowerCase()}/${drugSlug}`}
                  className="text-sm text-primary-600 font-medium hover:underline"
                >
                  View statewide {drugName} coverage for {stateName} →
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Coverage interpretation */}
        {coverageInterpretation && (
          <section className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm text-blue-800 leading-relaxed">{coverageInterpretation}</p>
          </section>
        )}

        {/* ── PLANS COVERING THIS DRUG ────────────────────────────────────── */}
        {issuerCoverageList.length > 0 && (
          <section aria-labelledby="plans-covering-heading">
            <h2 id="plans-covering-heading" className="text-xl font-semibold text-navy-800 mb-2">
              Plans That Cover {drugName} in {countyDisplay}
            </h2>
            <p className="text-sm text-neutral-500 mb-5">
              {issuerCoverageList.length} carrier{issuerCoverageList.length !== 1 ? 's' : ''}{' '}
              include {drugName} in their {PLAN_YEAR} formulary for {countyDisplay}.
              Sorted by cost tier, lowest first.
            </p>

            <div className="space-y-4">
              {issuerCoverageList.map((issuer) => (
                <IssuerCoverageCard
                  key={issuer.issuerId}
                  issuer={issuer}
                  countyFips={countyFips}
                  stateCode={stateCode}
                />
              ))}
            </div>

            <p className="text-xs text-neutral-400 mt-4">
              Source: CMS Machine-Readable Formulary PUF, plan year {PLAN_YEAR}. Tier and
              restriction data reflect issuer formulary filings. Verify coverage directly with
              your insurer before enrolling.
            </p>
          </section>
        )}

        {/* Tier explainer */}
        {humanTier && (
          <section aria-labelledby="tier-heading">
            <h2 id="tier-heading" className="text-lg font-semibold text-navy-800 mb-3">
              What does &ldquo;{humanTier.shortLabel}&rdquo; tier mean for your costs?
            </h2>
            <div className={`p-5 rounded-xl border ${humanTier.border} ${humanTier.bg}`}>
              <p className={`font-semibold text-sm ${humanTier.color} mb-1`}>
                {humanTier.label}
              </p>
              <p className={`text-sm ${humanTier.color} opacity-80 mb-2`}>{humanTier.costHint}</p>
              <p className={`text-sm ${humanTier.color}`}>
                Estimated cost: <strong>{humanTier.costRange} per fill</strong> after
                deductible, on plans where this tier applies.
              </p>
            </div>
          </section>
        )}

        {/* Related drugs in county */}
        {relatedDrugs.length > 0 && (
          <section aria-labelledby="related-drugs-heading">
            <h2 id="related-drugs-heading" className="text-lg font-semibold text-navy-800 mb-2">
              Related {category?.label ?? 'Medications'} in {countyDisplay}
            </h2>
            {category && (
              <p className="text-sm text-neutral-500 mb-4">
                Other{' '}
                <a
                  href={`/drugs/categories/${category.id}`}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {category.label}
                </a>{' '}
                — check county-level coverage for each.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {relatedDrugs.map((rd) => (
                <a
                  key={rd.slug}
                  href={`/${params['state-name']}/${params['county-slug']}/${rd.slug}-coverage`}
                  className="px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700 font-medium hover:bg-primary-100 hover:border-primary-300 transition-colors"
                >
                  {rd.name}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Mid CTA */}
        <DrugPageCta
          variant="mid"
          drugName={drugName}
          stateCode={stateCode}
          stateName={stateName}
        />

        {/* Comparison links */}
        {comparisons.length > 0 && (
          <section aria-labelledby="compare-heading">
            <h2 id="compare-heading" className="text-lg font-semibold text-navy-800 mb-4">
              Compare {drugName} with Similar Medications
            </h2>
            <div className="space-y-2">
              {comparisons.map((cmp) => (
                <a
                  key={cmp.href}
                  href={cmp.href}
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group text-sm"
                >
                  <span className="font-medium text-navy-900 group-hover:text-primary-700">
                    {cmp.label}
                  </span>
                  <svg className="w-4 h-4 text-neutral-400 group-hover:text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* County plan link */}
        <section className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-navy-800 mb-2">
            All Marketplace Plans in {countyDisplay}
          </h2>
          <p className="text-sm text-neutral-600 mb-3">
            {countyPlans.length} plan{countyPlans.length !== 1 ? 's' : ''} from{' '}
            {carrierCount} carrier{carrierCount !== 1 ? 's' : ''} available in {countyDisplay}.
          </p>
          <a
            href={`/plans/${stateCode.toLowerCase()}/${countyFips}`}
            className="text-sm text-primary-600 font-medium hover:underline"
          >
            Compare all {countyDisplay} plans →
          </a>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-5">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-neutral-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-navy-900 font-medium text-sm hover:bg-neutral-50 transition-colors list-none">
                  {faq.question}
                  <svg className="w-4 h-4 text-neutral-400 flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-4 pt-1 text-sm text-neutral-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Related guides */}
        {guides.length > 0 && (
          <section aria-labelledby="guides-heading">
            <h2 id="guides-heading" className="text-lg font-semibold text-navy-800 mb-4">
              Related Guides
            </h2>
            <div className="space-y-2">
              {guides.map((g) => (
                <a
                  key={g.href}
                  href={g.href}
                  className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                >
                  <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-400 group-hover:bg-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-navy-900 group-hover:text-primary-700">
                      {g.label}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{g.context}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <DrugPageCta
          variant="bottom"
          drugName={drugName}
          stateCode={stateCode}
          stateName={stateName}
        />

        {/* Data methodology */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            <strong>Data methodology:</strong> Coverage data from the CMS Machine-Readable
            Formulary PUF, plan year {PLAN_YEAR}, filtered to issuers with plans in{' '}
            {countyDisplay} (FIPS {countyFips}). Tier placement reflects issuer formulary
            filings and may change during the plan year.
          </p>
          <p>
            This page is for informational purposes only and does not constitute medical or
            insurance advice. <strong>Consult a licensed health insurance agent</strong> to
            evaluate your specific coverage options. Always verify formulary coverage directly
            with your insurer before enrolling or filling a prescription.
          </p>
        </footer>

      </main>
    </>
  )
}

// ── IssuerCoverageCard ───────────────────────────────────────────────────────

function IssuerCoverageCard({
  issuer,
  countyFips,
  stateCode,
}: {
  issuer: IssuerCoverage
  countyFips: string
  stateCode: string
}) {
  const planCount = issuer.plans.length
  // Show up to 3 plan names
  const planPreview = issuer.plans.slice(0, 3).map((p) => p.plan_name)
  const hasMore = planCount > 3

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-3 bg-neutral-50 border-b border-neutral-100">
        <span className="font-semibold text-sm text-navy-900">{issuer.issuerName}</span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${issuer.humanTier.bg} ${issuer.humanTier.color} ${issuer.humanTier.border}`}
        >
          {issuer.humanTier.shortLabel}
        </span>
      </div>

      {/* Details grid */}
      <div className="px-5 py-4 grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Cost range</p>
          <p className="font-medium text-navy-800">{issuer.humanTier.costRange} per fill</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Prior Authorization</p>
          <p className={`font-medium ${issuer.priorAuth ? 'text-amber-700' : 'text-green-700'}`}>
            {issuer.priorAuth ? 'Required' : 'Not required'}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Step Therapy</p>
          <p className={`font-medium ${issuer.stepTherapy ? 'text-amber-700' : 'text-neutral-600'}`}>
            {issuer.stepTherapy ? 'Required' : 'Not required'}
          </p>
        </div>
      </div>

      {/* Plan names */}
      <div className="px-5 pb-4">
        <p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">
          {planCount} plan{planCount !== 1 ? 's' : ''} available in this county
        </p>
        <ul className="space-y-1">
          {planPreview.map((name) => (
            <li key={name} className="text-xs text-neutral-600 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-neutral-300 flex-shrink-0" />
              {name}
            </li>
          ))}
          {hasMore && (
            <li className="text-xs text-neutral-400">
              +{planCount - 3} more plan{planCount - 3 !== 1 ? 's' : ''}
            </li>
          )}
        </ul>
        <a
          href={`/plans/${stateCode.toLowerCase()}/${countyFips}`}
          className="inline-block mt-3 text-xs text-primary-600 font-medium hover:underline"
        >
          Compare all plans from {issuer.issuerName} →
        </a>
      </div>
    </div>
  )
}

// ── SummaryItem ──────────────────────────────────────────────────────────────

function SummaryItem({
  label, value, accent = 'neutral',
}: {
  label: string
  value: string
  accent?: 'green' | 'amber' | 'neutral'
}) {
  const valueColor =
    accent === 'green' ? 'text-green-700' :
    accent === 'amber' ? 'text-amber-700' :
    'text-navy-900'

  return (
    <div className="p-3 bg-neutral-50 rounded-xl">
      <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-semibold ${valueColor}`}>{value}</p>
    </div>
  )
}

// ── FAQ ──────────────────────────────────────────────────────────────────────

interface FAQ { question: string; answer: string }

function buildFAQContent(
  drugName: string,
  countyDisplay: string,
  stateName: string,
  tierGroup: string | null,
  hasPriorAuth: boolean,
): FAQ[] {
  return [
    {
      question: `Is ${drugName} covered by Marketplace plans in ${countyDisplay}?`,
      answer: `Coverage for ${drugName} in ${countyDisplay} depends on the specific plan. All ACA Marketplace plans must cover prescription drugs, but each insurer maintains its own formulary. The coverage summary above shows which carriers in ${countyDisplay} include ${drugName} and at what cost tier. Check the "Plans That Cover" section for carrier-by-carrier details.`,
    },
    {
      question: `How much does ${drugName} cost on a Marketplace plan in ${countyDisplay}?`,
      answer: `${tierGroup === 'generic' ? `As a generic medication, ${drugName} typically costs $5–$20 per fill after your deductible on plans that cover it.` : tierGroup === 'specialty' ? `${drugName} is classified as a specialty drug on most plans, which can mean significant out-of-pocket costs until your out-of-pocket maximum is reached. Many specialty drugs have manufacturer assistance programs that can help.` : `Your cost depends on the plan's tier placement, your deductible, and out-of-pocket maximum.`} Compare plans in ${countyDisplay} to find the lowest cost for this medication.`,
    },
    {
      question: `Does ${drugName} require prior authorization in ${countyDisplay}?`,
      answer: hasPriorAuth
        ? `Some Marketplace plans in ${countyDisplay} require prior authorization (Prior Authorization) for ${drugName}. This means your doctor must submit documentation to your insurer before the plan will approve coverage. Prior authorization is typically approved when the medication is medically necessary. If denied, you have the right to appeal under federal law (45 C.F.R. § 156.122).`
        : `Based on our data, prior authorization is not commonly required for ${drugName} on Marketplace plans in ${countyDisplay}. Requirements can vary by plan — always confirm directly with your insurer or pharmacist.`,
    },
    {
      question: `Which carrier in ${countyDisplay} offers the best coverage for ${drugName}?`,
      answer: `Coverage quality depends on cost tier (lower tier = lower cost) and restrictions. See the "Plans That Cover ${drugName}" section above for a carrier-by-carrier breakdown. Generally, carriers that place ${drugName} on a lower tier (generic or preferred brand) with no prior authorization requirement will offer the best coverage.`,
    },
    {
      question: `What can I do if my plan in ${countyDisplay} doesn't cover ${drugName}?`,
      answer: `You have several options: (1) Request a formulary exception — your doctor can document medical necessity. Plans must have an exception process under 45 C.F.R. § 156.122. (2) Ask about covered alternatives in the same drug class. (3) Switch plans during open enrollment (November 1 – January 15) to one that covers ${drugName} at a lower tier. (4) Ask the manufacturer about patient assistance programs. (5) Use a pharmacy discount card as a backup — note this cannot be combined with insurance.`,
    },
  ]
}
