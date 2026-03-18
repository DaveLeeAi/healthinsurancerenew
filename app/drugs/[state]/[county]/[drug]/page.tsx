import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { searchFormulary, getPlansByCounty } from '@/lib/data-loader'
import { getCountyName, getStateName, getFipsFromSlug, countySlugToName } from '@/lib/county-lookup'
import {
  humanizeTier,
  getDominantTierGroup,
  interpretCoverage,
} from '@/lib/formulary-helpers'
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

// Dynamic rendering: formulary + plan data too large for static build
export const dynamic = 'force-dynamic'

interface Props {
  params: { state: string; county: string; drug: string }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function drugSlugToName(slug: string) {
  return slug.replace(/-/g, ' ')
}

/**
 * Resolve county slug or FIPS to a FIPS code.
 * Accepts:
 *   - 5-digit FIPS string ("37183")
 *   - county slug ("wake-county")
 */
function resolveCountyFips(countyParam: string, stateCode: string): string | null {
  if (/^\d{5}$/.test(countyParam)) return countyParam
  // Try slug lookup
  return getFipsFromSlug(countyParam, stateCode)
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateCode = params.state.toUpperCase()
  const stateName = getStateName(stateCode)
  const countyFips = resolveCountyFips(params.county, stateCode)
  const countyDisplay = countyFips
    ? getCountyName(countyFips)
    : countySlugToName(params.county)
  const drugName = titleCase(drugSlugToName(params.drug))

  const title = `${drugName} Coverage in ${countyDisplay} (${PLAN_YEAR})`
  const description =
    `Check if ${drugName} is covered by ACA Marketplace plans in ${countyDisplay}, ${stateName}. ` +
    `See coverage status, cost tier, prior authorization, and which plans include this medication in ${PLAN_YEAR}.`
  const canonicalUrl = `${SITE_URL}/drugs/${params.state}/${params.county}/${params.drug}`

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CountyDrugPage({ params }: Props) {
  const stateCode = params.state.toUpperCase()
  const stateName = getStateName(stateCode)
  const countyFips = resolveCountyFips(params.county, stateCode)

  // If county slug not resolvable and not a FIPS → 404
  if (!countyFips) notFound()

  const countyDisplay = getCountyName(countyFips)
  const drugSlug = params.drug
  const drugName = titleCase(drugSlugToName(drugSlug))
  const canonicalUrl = `${SITE_URL}/drugs/${params.state}/${params.county}/${drugSlug}`

  // ── Data: plans in county → issuer IDs ──────────────────────────────────
  const countyPlans = getPlansByCounty(stateCode, countyFips)
  const issuerIds = [...new Set(countyPlans.map((p) => p.issuer_id))]
  const carrierCount = new Set(countyPlans.map((p) => p.issuer_name)).size

  // ── Data: formulary lookup (state-scoped) ────────────────────────────────
  const formularyResults = await searchFormulary({
    drug_name: drugSlug.replace(/-/g, ' '),
    state_code: stateCode,
  })

  // Filter to issuers that serve this county
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

  // ── Internal linking ─────────────────────────────────────────────────────
  const category = getDrugCategory(drugSlug.replace(/-/g, ' '))
  const relatedDrugs = getRelatedDrugs(drugSlug.replace(/-/g, ' '), params.state, 6)
  const comparisons = getComparisonLinks(drugSlug.replace(/-/g, ' '), 3)
  const guides = getRelatedGuides(category)

  // ── Schema ───────────────────────────────────────────────────────────────
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
    { name: stateName, url: `${SITE_URL}/plans/${params.state}` },
    { name: countyDisplay, url: `${SITE_URL}/plans/${params.state}/${countyFips}` },
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
                href={`/plans/${params.state}/${countyFips}`}
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
            Coverage data for {drugName} across {carrierCount} carrier{carrierCount !== 1 ? 's' : ''}{' '}
            offering Marketplace plans in {countyDisplay}, {stateName}. Source: CMS
            Machine-Readable Formulary PUF, {PLAN_YEAR}.
          </p>
          <DrugPageCta
            variant="hero"
            drugName={drugName}
            stateCode={params.state.toUpperCase()}
            stateName={stateName}
          />
        </section>

        {/* Coverage answer box */}
        <section
          aria-labelledby="coverage-summary-heading"
          className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <h2 id="coverage-summary-heading" className="text-base font-semibold text-navy-800">
              Coverage Summary
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {countyDisplay} · {stateName} Marketplace · {PLAN_YEAR}
            </p>
          </div>
          <div className="p-6">
            {hasCoverageData ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <SummaryItem
                  label="Coverage status"
                  value={tierGroup && tierGroup !== 'unknown' ? 'Covered' : 'Varies by plan'}
                  accent={tierGroup && tierGroup !== 'unknown' ? 'green' : 'neutral'}
                />
                <SummaryItem
                  label="Cost range per fill"
                  value={humanTier?.costRange ?? 'See plan details'}
                />
                <SummaryItem
                  label="Typical tier"
                  value={humanTier?.shortLabel ?? 'Varies'}
                />
                <SummaryItem
                  label="Prior authorization"
                  value={hasPriorAuth ? 'Required on some plans' : 'Not commonly required'}
                  accent={hasPriorAuth ? 'amber' : 'green'}
                />
                {hasStepTherapy && (
                  <SummaryItem
                    label="Step therapy"
                    value="Required on some plans — must try an alternative first"
                    accent="amber"
                  />
                )}
                {hasQuantityLimit && (
                  <SummaryItem
                    label="Quantity limits"
                    value="Applied on some plans"
                    accent="amber"
                  />
                )}
                <SummaryItem
                  label="Plans checked"
                  value={`${countyPlans.length} plans from ${carrierCount} carrier${carrierCount !== 1 ? 's' : ''}`}
                />
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-neutral-500 text-sm">
                  Formulary data for {countyDisplay} is not available in our current dataset.
                  Coverage may still exist — check directly with your plan.
                </p>
                <a
                  href={`/formulary/${params.state}/${drugSlug}`}
                  className="inline-block mt-4 text-sm text-primary-600 font-medium hover:underline"
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

        {/* Tier explanation */}
        {humanTier && (
          <section aria-labelledby="tier-heading">
            <h2 id="tier-heading" className="text-lg font-semibold text-navy-800 mb-3">
              What does &ldquo;{humanTier.shortLabel}&rdquo; tier mean?
            </h2>
            <div
              className={`p-4 rounded-xl border ${humanTier.border} ${humanTier.bg}`}
            >
              <p className={`font-semibold text-sm ${humanTier.color} mb-1`}>
                {humanTier.label}
              </p>
              <p className={`text-sm ${humanTier.color} opacity-80`}>{humanTier.costHint}</p>
              <p className={`text-sm mt-2 ${humanTier.color}`}>
                Estimated out-of-pocket: <strong>{humanTier.costRange} per fill</strong> (after
                deductible, on plans with this tier).
              </p>
            </div>
          </section>
        )}

        {/* County plan link */}
        <section
          aria-labelledby="county-plans-heading"
          className="bg-neutral-50 border border-neutral-200 rounded-xl p-5"
        >
          <h2 id="county-plans-heading" className="text-base font-semibold text-navy-800 mb-2">
            Marketplace Plans in {countyDisplay}
          </h2>
          <p className="text-sm text-neutral-600 mb-3">
            {countyPlans.length} plan{countyPlans.length !== 1 ? 's' : ''} available
            from {carrierCount} carrier{carrierCount !== 1 ? 's' : ''}.
            Compare all plans to find the one that best covers {drugName}.
          </p>
          <a
            href={`/plans/${params.state}/${countyFips}`}
            className="text-sm text-primary-600 font-medium hover:underline"
          >
            Compare all {countyDisplay} plans →
          </a>
        </section>

        {/* Related drugs */}
        {relatedDrugs.length > 0 && (
          <section aria-labelledby="related-drugs-heading">
            <h2 id="related-drugs-heading" className="text-lg font-semibold text-navy-800 mb-4">
              Related {category?.label ?? 'Medications'}
            </h2>
            {category && (
              <p className="text-sm text-neutral-500 mb-4">
                Other medications in the{' '}
                <a
                  href={`/drugs/categories/${category.id}`}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {category.label}
                </a>{' '}
                category.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {relatedDrugs.map((rd) => (
                <a
                  key={rd.slug}
                  href={`/drugs/${params.state}/${params.county}/${rd.slug}`}
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
          stateCode={params.state.toUpperCase()}
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
                  href={`/drugs/compare/${cmp.href.split('/').pop()}`}
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
          stateCode={params.state.toUpperCase()}
          stateName={stateName}
        />

        {/* Data methodology */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            <strong>Data methodology:</strong> Coverage data sourced from the CMS Machine-Readable
            Formulary PUF, plan year {PLAN_YEAR}, filtered to issuers with plans available in{' '}
            {countyDisplay} (county FIPS {countyFips}). Tier placement reflects issuer formulary
            filings as of the most recent data update. Coverage may change throughout the plan year.
          </p>
          <p>
            This page is for informational purposes only and does not constitute medical or insurance
            advice. <strong>Consult a licensed health insurance agent</strong> to evaluate your
            specific coverage options. Always verify formulary coverage directly with your insurer
            before enrolling or filling a prescription.
          </p>
        </footer>

      </main>
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SummaryItem({
  label,
  value,
  accent = 'neutral',
}: {
  label: string
  value: string
  accent?: 'green' | 'amber' | 'neutral'
}) {
  const valueColor =
    accent === 'green'
      ? 'text-green-700'
      : accent === 'amber'
      ? 'text-amber-700'
      : 'text-navy-900'

  return (
    <div className="p-3 bg-neutral-50 rounded-xl">
      <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-semibold ${valueColor}`}>{value}</p>
    </div>
  )
}

// ── FAQ content ──────────────────────────────────────────────────────────────

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
      answer: `Coverage for ${drugName} in ${countyDisplay} varies by plan. ACA Marketplace plans must cover prescription drugs as an Essential Health Benefit, but each insurer sets its own formulary. Some plans in ${countyDisplay} may cover ${drugName} at a lower tier (lower cost), while others may place it at a higher tier or require prior authorization. Check the coverage summary above for current data.`,
    },
    {
      question: `How much does ${drugName} cost on Marketplace plans in ${countyDisplay}?`,
      answer: `Your out-of-pocket cost for ${drugName} depends on the plan's cost tier, your deductible, and whether you've met your out-of-pocket maximum. ${tierGroup === 'generic' ? 'As a generic medication, ' + drugName + ' typically costs $5–$20 per fill after your deductible.' : tierGroup === 'specialty' ? drugName + ' is classified as a specialty drug on most plans, which can mean costs of hundreds of dollars per fill until your out-of-pocket maximum is met.' : 'See the tier details above for estimated cost ranges.'} Compare plans in ${countyDisplay} to find the lowest-cost coverage for this medication.`,
    },
    {
      question: `Do I need prior authorization for ${drugName} in ${countyDisplay}?`,
      answer: hasPriorAuth
        ? `Some Marketplace plans in ${countyDisplay} require prior authorization (PA) for ${drugName}. This means your doctor must submit a request to your insurer before the plan will cover the medication. PA is typically approved when the medication is medically necessary and appropriate for your condition. If denied, you have the right to appeal under federal law.`
        : `Based on our data, prior authorization is not commonly required for ${drugName} on Marketplace plans in ${countyDisplay}. However, individual plan requirements can vary — always verify directly with your insurer or pharmacist.`,
    },
    {
      question: `Which Marketplace plans in ${countyDisplay} cover ${drugName}?`,
      answer: `Coverage varies by insurer. To find plans that cover ${drugName} in ${countyDisplay}, use the HealthCare.gov plan finder during open enrollment and enter your medications to filter by formulary coverage. A licensed health insurance agent can also help you identify the plan with the best ${drugName} coverage at the lowest cost in ${stateName}.`,
    },
    {
      question: `What if my plan in ${countyDisplay} doesn't cover ${drugName}?`,
      answer: `You have several options: (1) Request a formulary exception — your doctor can submit documentation showing medical necessity. Under 45 C.F.R. § 156.122, plans must have an exception process. (2) Ask your doctor about covered alternatives in the same drug class. (3) Switch to a plan with better coverage during open enrollment. (4) Check whether the drug manufacturer offers a patient assistance program. (5) Use a pharmacy discount card (GoodRx, etc.) as a backup — though this cannot be combined with insurance.`,
    },
  ]
}
