import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import {
  getPlansByCounty,
  getSubsidyByCounty,
  getRatesByCounty,
  getAllPlanStateCountyCombos,
} from '@/lib/data-loader'
import { getRelatedEntities } from '@/lib/entity-linker'
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildPlansProductSchema,
  buildWebPageSchema,
  buildFAQSchema,
} from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import PlanComparisonTable from '@/components/PlanComparisonTable'
import EntityLinkCard from '@/components/EntityLinkCard'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import { generatePlanComparisonContent } from '@/lib/content-templates'
import {
  stateSlugToCode,
  getFipsFromSlug,
  getCountyName,
  getStateName,
  stateCodeToSlug,
  getCountySlug,
} from '@/lib/county-lookup'
import { parsePlanSlug, generatePlanSlug } from '@/lib/plan-slug'
import { getPlanBySlug } from '@/lib/plan-slug-server'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface Props {
  params: { 'state-name': string; 'county-slug': string }
}

// Static generation — all state/county combos pre-built at deploy; revalidate daily
export const revalidate = 86400

export async function generateStaticParams() {
  return getAllPlanStateCountyCombos().map(({ state, county }) => ({
    'state-name': stateCodeToSlug(state.toUpperCase()),
    'county-slug': getCountySlug(county),
  }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) return { title: 'Not Found' }

  const countyFips = getFipsFromSlug(params['county-slug'], stateCode)
  if (!countyFips) {
    // The county-slug position may hold a plan slug: /{state-slug}/{plan-slug}-plan
    // Return minimal metadata — the page component will issue the redirect.
    if (parsePlanSlug(params['county-slug'])) return { title: 'Redirecting…' }
    return { title: 'Not Found' }
  }

  const countyDisplay = getCountyName(countyFips)
  if (!countyDisplay) return { title: 'Not Found' }
  const stateName = getStateName(stateCode)
  const plans = getPlansByCounty(stateCode, countyFips)

  const planCount = plans.length
  const carrierCount = new Set(plans.map((p) => p.issuer_name)).size
  const premiums40 = plans
    .map((p) => p.premiums?.age_40)
    .filter((v): v is number => v != null)
  const minPremium = premiums40.length > 0 ? Math.min(...premiums40) : null
  const maxPremium = premiums40.length > 0 ? Math.max(...premiums40) : null

  const canonicalUrl = `${SITE_URL}/${params['state-name']}/${params['county-slug']}`

  const title =
    `${countyDisplay} Health Insurance Plans (${PLAN_YEAR})` +
    ` | Compare ${planCount} Marketplace Plans`

  const premiumRange =
    minPremium != null && maxPremium != null
      ? ` Age 40 premiums $${minPremium.toFixed(0)}–$${maxPremium.toFixed(0)}/mo before subsidy.`
      : ''

  const description =
    `Compare ${planCount} ${stateName} Marketplace (Obamacare) health insurance plans` +
    ` in ${countyDisplay} from ${carrierCount} carrier${carrierCount !== 1 ? 's' : ''}.` +
    `${premiumRange} Source: federal marketplace plan data ${PLAN_YEAR}.`

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
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// NOTE: No name/NPN on this page — generic byline only
export default function CountyPlansPage({ params }: Props) {
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) notFound()

  const countyFips = getFipsFromSlug(params['county-slug'], stateCode)
  if (!countyFips) {
    // Fallback: /{state-slug}/{plan-slug}-plan → redirect to county-aware canonical.
    // This handles inbound links where the county was omitted from the URL.
    const maybePlanSlug = parsePlanSlug(params['county-slug'])
    if (maybePlanSlug) {
      const plan = getPlanBySlug(maybePlanSlug, stateCode)
      if (plan) {
        const planSlug = generatePlanSlug(plan.plan_name)
        const resolvedCountySlug = getCountySlug(plan.county_fips)
        permanentRedirect(
          `/${stateCodeToSlug(stateCode)}/${resolvedCountySlug}/${planSlug}`
        )
      }
    }
    notFound()
  }

  const countyDisplay = getCountyName(countyFips)
  if (!countyDisplay) notFound()
  const stateName = getStateName(stateCode)
  const stateSlug = stateCodeToSlug(stateCode)
  const canonicalUrl = `${SITE_URL}/${stateSlug}/${params['county-slug']}`

  // --- Data loading ---
  const plans = getPlansByCounty(stateCode, countyFips)
  const subsidy = getSubsidyByCounty(stateCode, countyFips)
  const rates = getRatesByCounty(stateCode, countyFips)

  // --- Derived stats ---
  const planCount = plans.length
  const carrierCount = new Set(plans.map((p) => p.issuer_name)).size
  const premiums40 = plans
    .map((p) => p.premiums?.age_40)
    .filter((v): v is number => v != null)
  const minPremium = premiums40.length > 0 ? Math.min(...premiums40) : null
  const maxPremium = premiums40.length > 0 ? Math.max(...premiums40) : null

  const medianSubsidy = subsidy?.subsidy_estimates?.fpl_250

  // --- Editorial content ---
  const editorial = plans.length > 0
    ? generatePlanComparisonContent({ countyName: countyDisplay, stateCode, plans, planYear: PLAN_YEAR })
    : null

  // --- Entity links ---
  const entityLinks = getRelatedEntities({
    pageType: 'plans',
    state: stateCode.toLowerCase(),
    county: countyFips,
    countyName: countyDisplay,
    plans: plans.slice(0, 10).map((p) => ({
      plan_id: p.plan_id,
      plan_name: p.plan_name,
      issuer_name: p.issuer_name,
      metal_level: p.metal_level,
      plan_variant_id: p.plan_variant_id,
    })),
  })

  // --- Schema ---
  const articleSchema = buildArticleSchema({
    headline: `${countyDisplay} Health Insurance Plans (${PLAN_YEAR})`,
    description: `${planCount} plans from ${carrierCount} carriers in ${countyDisplay}, ${stateName} for plan year ${PLAN_YEAR}. Source: federal marketplace plan data.`,
    dateModified: new Date().toISOString().slice(0, 7),
    dataSourceName: 'Federal Marketplace Plan Data',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  const productSchema = buildPlansProductSchema({
    countyName: countyDisplay,
    stateCode,
    planYear: PLAN_YEAR,
    plans: plans.slice(0, 50),
  })

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: `${stateName} Health Insurance Plans`, url: `${SITE_URL}/${stateSlug}/health-insurance-plans` },
    { name: countyDisplay, url: canonicalUrl },
  ])

  const webPageSchema = buildWebPageSchema({
    name: `${countyDisplay} Health Insurance Plans (${PLAN_YEAR})`,
    description: `Compare ${planCount} Marketplace plans in ${countyDisplay}, ${stateName} from ${carrierCount} carriers.`,
    url: canonicalUrl,
    dateModified: new Date().toISOString().split('T')[0],
    speakableCssSelectors: ['h1', '#plans-table-heading', '#faq-heading'],
  })

  const countyFaqs = buildCountyFaqs({
    countyDisplay,
    stateName,
    stateCode,
    planCount,
    carrierCount,
    minPremium,
    maxPremium,
    premiums40,
    subsidy,
    plans,
  })
  const faqSchema = countyFaqs.length > 0 ? buildFAQSchema(countyFaqs) : null

  return (
    <>
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={productSchema} id="product-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={webPageSchema} id="webpage-schema" />
      {faqSchema && <SchemaScript schema={faqSchema} id="faq-schema" />}
      <LlmComment pageType="county" state={stateCode} county={countyDisplay} planCount={planCount} carrierCount={carrierCount} exchange="FFM" />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">

        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <a href="/" className="hover:underline text-primary-600">Home</a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li>
              <a href={`/${stateSlug}/health-insurance-plans`} className="hover:underline text-primary-600">
                {stateName}
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li aria-current="page" className="text-neutral-700 font-medium">
              {countyDisplay}
            </li>
          </ol>
        </nav>

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">
            {countyDisplay} Health Insurance Plans ({PLAN_YEAR})
          </h1>
          <p className="text-primary-600 font-medium text-base mb-3">
            {stateName} Marketplace / Obamacare
          </p>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            {planCount > 0 ? (
              <>
                <strong>{planCount}</strong> marketplace plan
                {planCount !== 1 ? 's' : ''} available in {countyDisplay},{' '}
                {stateName} from <strong>{carrierCount}</strong> carrier
                {carrierCount !== 1 ? 's' : ''}.
                {minPremium != null && maxPremium != null && (
                  <>
                    {' '}Age 40 premiums range from{' '}
                    <strong>${minPremium.toFixed(0)}</strong> to{' '}
                    <strong>${maxPremium.toFixed(0)}/mo</strong> before subsidy.
                  </>
                )}{' '}
                Data source: federal marketplace plan data · Plan Year {PLAN_YEAR}.
              </>
            ) : (
              <>No marketplace plans found for this county in the {PLAN_YEAR} dataset.</>
            )}
          </p>
        </section>

        {/* ── Plan comparison table ── */}
        <section aria-labelledby="plans-table-heading">
          <h2 id="plans-table-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Compare All Available Plans
          </h2>
          <PlanComparisonTable plans={plans} />
        </section>

        {/* ── Subsidy estimate callout ── */}
        {subsidy && medianSubsidy && (
          <section
            aria-labelledby="subsidy-callout-heading"
            className="bg-primary-50 border border-primary-200 rounded-xl p-6"
          >
            <h2
              id="subsidy-callout-heading"
              className="text-lg font-semibold text-primary-900 mb-1"
            >
              Subsidy Estimate for {countyDisplay}, {stateName}
            </h2>
            <p className="text-sm text-primary-700 mb-4">
              At 250% FPL (~${medianSubsidy.annual_income.toLocaleString()}/yr for a
              household of {subsidy.household_size}):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SubsidyStat
                label="Monthly APTC"
                value={`$${medianSubsidy.monthly_aptc.toFixed(0)}`}
                highlight
              />
              <SubsidyStat
                label="Your Contribution"
                value={`$${medianSubsidy.monthly_contribution.toFixed(0)}/mo`}
              />
              <SubsidyStat
                label="Net Premium"
                value={`$${medianSubsidy.net_monthly_premium.toFixed(0)}/mo`}
              />
              <SubsidyStat
                label="Benchmark Silver"
                value={`$${subsidy.benchmark_silver_premium.toFixed(0)}/mo`}
              />
            </div>
            <p className="text-xs text-primary-600 mt-4">
              Estimates based on federal benchmark silver premium · Age 40 reference ·
              Subsidy amounts may vary by income, household size, and plan choice.{' '}
              <a
                href={`/subsidies/${stateCode.toLowerCase()}/${countyFips}`}
                className="underline font-medium"
              >
                See full subsidy calculator →
              </a>
            </p>
          </section>
        )}

        {/* ── Rate volatility summary ── */}
        {rates && (
          <section aria-labelledby="rates-heading">
            <h2 id="rates-heading" className="text-xl font-semibold text-navy-800 mb-4">
              Premium Rate Trends
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Plans Available" value={rates.plan_count.toString()} />
              <StatCard label="Carriers" value={rates.carrier_count.toString()} />
              <StatCard
                label="Avg Age 40 Premium"
                value={`$${rates.avg_premium_age_40.toFixed(0)}/mo`}
              />
              <StatCard
                label="Age 64 Shock Ratio"
                value={`${rates.age_64_shock_ratio}×`}
                note="Age 64 vs age 40 rate multiple"
              />
              {rates.yoy_change_pct != null && (
                <StatCard
                  label="Year-over-Year Change"
                  value={`${rates.yoy_change_pct > 0 ? '+' : ''}${rates.yoy_change_pct.toFixed(1)}%`}
                  highlight={Math.abs(rates.yoy_change_pct) > 5}
                />
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-3">
              Source: federal marketplace rate filings · Plan Year {rates.plan_year} ·{' '}
              <a href={`/rates/${stateCode.toLowerCase()}/${countyFips}`} className="underline">
                View full rate analysis →
              </a>
            </p>
          </section>
        )}

        {/* ── Editorial content ── */}
        {editorial && (
          <section className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }} />
        )}

        {/* ── At a Glance card ── */}
        {planCount > 0 && (
          <section className="rounded-xl border border-primary-200 bg-primary-50/50 p-5">
            <h2 className="text-sm font-bold text-navy-800 uppercase tracking-wide mb-3">
              {countyDisplay}, {stateName}: At a Glance ({PLAN_YEAR})
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Plans Available</dt>
                <dd className="font-semibold text-navy-800">{planCount}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Carriers</dt>
                <dd className="font-semibold text-navy-800">{carrierCount}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Avg Premium (Age 40)</dt>
                <dd className="font-semibold text-navy-800">
                  {premiums40.length > 0
                    ? `$${Math.round(premiums40.reduce((a, b) => a + b, 0) / premiums40.length)}/mo`
                    : '—'}
                </dd>
              </div>
              {minPremium != null && (
                <div>
                  <dt className="text-neutral-500">Lowest Premium</dt>
                  <dd className="font-semibold text-navy-800">${minPremium.toFixed(0)}/mo</dd>
                </div>
              )}
              {maxPremium != null && (
                <div>
                  <dt className="text-neutral-500">Highest Premium</dt>
                  <dd className="font-semibold text-navy-800">${maxPremium.toFixed(0)}/mo</dd>
                </div>
              )}
              {subsidy && (
                <div>
                  <dt className="text-neutral-500">Benchmark Silver</dt>
                  <dd className="font-semibold text-navy-800">
                    ${subsidy.benchmark_silver_premium.toFixed(0)}/mo
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-neutral-500">Exchange</dt>
                <dd className="font-semibold text-navy-800">FFM (HealthCare.gov)</dd>
              </div>
              <div>
                <dt className="text-neutral-500">OEP</dt>
                <dd className="font-semibold text-navy-800">Nov 1 – Jan 15</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Plan Year</dt>
                <dd className="font-semibold text-navy-800">{PLAN_YEAR}</dd>
              </div>
            </dl>
          </section>
        )}

        {/* ── Drug coverage quick-links ── */}
        <DrugCoveragePills
          countyDisplay={countyDisplay}
          stateSlug={stateSlug}
          countySlug={params['county-slug']}
          stateCode={stateCode}
        />

        {/* ── FAQ section ── */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-4">
            {countyDisplay} Health Insurance: Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {countyFaqs.map((faq, i) => (
              <details
                key={i}
                className="group border border-neutral-200 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-navy-900 font-medium text-sm hover:bg-neutral-50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <svg
                    className="w-4 h-4 text-neutral-400 shrink-0 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 pt-1 text-sm text-neutral-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Entity links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ── E-E-A-T byline ── */}
        <GenericByline />

        {/* ── Medical disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Premium data sourced from federal marketplace plan data, plan year {PLAN_YEAR}. All
            premium amounts are shown before applying any applicable premium tax credit (APTC)
            subsidy. Actual premiums, deductibles, and cost-sharing may vary based on enrollment
            date, household size, tobacco use, and rating area.
          </p>
          <p>
            This page is for informational purposes only and does not constitute insurance advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> to evaluate your specific
            coverage options and confirm eligibility.
          </p>
        </footer>

      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Local sub-components
// ---------------------------------------------------------------------------

const PRIORITY_DRUGS: { name: string; slug: string }[] = [
  { name: 'Metformin', slug: 'metformin' },
  { name: 'Ozempic', slug: 'ozempic' },
  { name: 'Wegovy', slug: 'wegovy' },
  { name: 'Mounjaro', slug: 'mounjaro' },
  { name: 'Jardiance', slug: 'jardiance' },
  { name: 'Trulicity', slug: 'trulicity' },
  { name: 'Lisinopril', slug: 'lisinopril' },
  { name: 'Amlodipine', slug: 'amlodipine' },
  { name: 'Losartan', slug: 'losartan' },
  { name: 'Atorvastatin', slug: 'atorvastatin' },
  { name: 'Rosuvastatin', slug: 'rosuvastatin' },
  { name: 'Sertraline', slug: 'sertraline' },
]

function DrugCoveragePills({
  countyDisplay,
  stateSlug,
  countySlug,
  stateCode,
}: {
  countyDisplay: string
  stateSlug: string
  countySlug: string
  stateCode: string
}) {
  return (
    <section aria-labelledby="drug-coverage-heading">
      <h2 id="drug-coverage-heading" className="text-xl font-semibold text-navy-800 mb-2">
        Check Drug Coverage in {countyDisplay}
      </h2>
      <p className="text-sm text-neutral-500 mb-4">
        See which plans in this county cover your prescription medications.
      </p>
      <div className="flex flex-wrap gap-2">
        {PRIORITY_DRUGS.map((drug) => (
          <a
            key={drug.slug}
            href={`/${stateSlug}/${countySlug}/${drug.slug}-coverage`}
            className="inline-block px-3 py-1.5 text-sm font-medium rounded-full border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 hover:border-primary-300 transition-colors"
          >
            {drug.name}
          </a>
        ))}
        <a
          href={`/${stateCodeToSlug(stateCode)}/all`}
          className="inline-block px-3 py-1.5 text-sm font-medium rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          Browse all drugs →
        </a>
      </div>
    </section>
  )
}

function SubsidyStat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`p-3 rounded-xl ${
        highlight
          ? 'bg-primary-100 border border-primary-300'
          : 'bg-white border border-primary-100'
      }`}
    >
      <div className="text-xs text-primary-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-xl font-bold ${highlight ? 'text-primary-800' : 'text-navy-800'}`}>
        {value}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  note,
  highlight = false,
}: {
  label: string
  value: string
  note?: string
  highlight?: boolean
}) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? 'bg-amber-50' : 'bg-neutral-50'}`}>
      <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-navy-800">{value}</div>
      {note && <div className="text-xs text-neutral-400 mt-0.5">{note}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FAQ builder — generates 5 county-specific FAQ items from plan data
// ---------------------------------------------------------------------------

function buildCountyFaqs({
  countyDisplay,
  stateName,
  stateCode,
  planCount,
  carrierCount,
  minPremium,
  maxPremium,
  premiums40,
  subsidy,
  plans,
}: {
  countyDisplay: string
  stateName: string
  stateCode: string
  planCount: number
  carrierCount: number
  minPremium: number | null
  maxPremium: number | null
  premiums40: number[]
  subsidy: ReturnType<typeof getSubsidyByCounty>
  plans: ReturnType<typeof getPlansByCounty>
}): Array<{ question: string; answer: string }> {
  const avgPremium =
    premiums40.length > 0
      ? Math.round(premiums40.reduce((a, b) => a + b, 0) / premiums40.length)
      : null

  const carriers = [...new Set(plans.map((p) => p.issuer_name))].sort()
  const carrierList =
    carriers.length <= 3
      ? carriers.join(', ')
      : `${carriers.slice(0, 3).join(', ')}, and ${carriers.length - 3} more`

  const cheapestPlan = minPremium != null
    ? plans.find((p) => p.premiums?.age_40 === minPremium)
    : null

  const medianSubsidy = subsidy?.subsidy_estimates?.fpl_250

  return [
    {
      question: `How many health insurance plans are available in ${countyDisplay}, ${stateName}?`,
      answer:
        `There are ${planCount} Marketplace (Obamacare) health insurance plans available in ${countyDisplay} for the ${PLAN_YEAR} plan year, offered by ${carrierCount} carrier${carrierCount !== 1 ? 's' : ''}. ` +
        `Plans span all metal levels including Bronze, Silver, Gold, and Platinum. You can compare them on HealthCare.gov during Open Enrollment (November 1 – January 15). Source: federal marketplace plan data ${PLAN_YEAR}.`,
    },
    {
      question: `What is the cheapest health insurance plan in ${countyDisplay}?`,
      answer:
        minPremium != null
          ? `The lowest-cost plan in ${countyDisplay} starts at $${minPremium.toFixed(0)}/month for a 40-year-old before subsidies` +
            (cheapestPlan ? ` (${cheapestPlan.plan_name} from ${cheapestPlan.issuer_name})` : '') +
            `. If you qualify for a premium tax credit (APTC), your net cost could be significantly lower. ` +
            `Consult a licensed agent to find the plan that best fits your budget and health needs.`
          : `Premium data for ${countyDisplay} is currently unavailable. Contact a licensed health insurance agent for current plan pricing in your area.`,
    },
    {
      question: `How much does health insurance cost in ${countyDisplay}?`,
      answer:
        avgPremium != null && minPremium != null && maxPremium != null
          ? `For a 40-year-old in ${countyDisplay}, ${stateName}, monthly premiums range from $${minPremium.toFixed(0)} to $${maxPremium.toFixed(0)} before subsidies, ` +
            `with an average of $${avgPremium}/month across all ${planCount} plans. ` +
            (medianSubsidy
              ? `At 250% FPL, the estimated monthly subsidy (APTC) is $${medianSubsidy.monthly_aptc.toFixed(0)}, which can dramatically reduce your out-of-pocket premium. `
              : '') +
            `Actual costs depend on age, income, household size, tobacco use, and the plan you select. Source: federal marketplace plan data ${PLAN_YEAR}.`
          : `Premium information for ${countyDisplay} is not yet available for ${PLAN_YEAR}. Check back during Open Enrollment or contact a licensed agent.`,
    },
    {
      question: `What insurance carriers offer plans in ${countyDisplay}?`,
      answer:
        `${carrierCount} carrier${carrierCount !== 1 ? 's offer' : ' offers'} Marketplace plans in ${countyDisplay} for ${PLAN_YEAR}: ${carrierList}. ` +
        `Carrier availability can vary year to year. Each carrier offers plans at multiple metal levels with different premium, deductible, and network configurations. ` +
        `Compare all available plans to find the best combination of cost and coverage for your needs.`,
    },
    {
      question: `How do I get subsidized health insurance in ${countyDisplay}, ${stateName}?`,
      answer:
        `Most ${countyDisplay} residents with household income between 100% and 400% of the Federal Poverty Level (FPL) qualify for Advance Premium Tax Credits (APTC) that lower monthly premiums. ` +
        (medianSubsidy
          ? `For example, a household at 250% FPL (~$${medianSubsidy.annual_income.toLocaleString()}/year) may receive about $${medianSubsidy.monthly_aptc.toFixed(0)}/month in subsidies. `
          : '') +
        `Note: The enhanced credits that previously extended subsidies above 400% FPL expired at the end of 2025. For ${PLAN_YEAR}, the standard 400% FPL subsidy cliff is back in effect. ` +
        `Apply through HealthCare.gov during Open Enrollment or a qualifying Special Enrollment Period. A licensed agent can help you maximize your subsidy.`,
    },
  ]
}
