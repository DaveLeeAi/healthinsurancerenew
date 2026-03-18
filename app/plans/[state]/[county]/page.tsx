import type { Metadata } from 'next'
import {
  getPlansByCounty,
  getSubsidyByCounty,
  getRatesByCounty,
} from '@/lib/data-loader'
import { getRelatedEntities } from '@/lib/entity-linker'
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildPlansProductSchema,
} from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import PlanComparisonTable from '@/components/PlanComparisonTable'
import EntityLinkCard from '@/components/EntityLinkCard'
import { generatePlanComparisonContent } from '@/lib/content-templates'
import { getCountyName, getStateName, stateCodeToSlug, getCountySlug } from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface Props {
  params: { state: string; county: string }
}

// Dynamic rendering — plan_intelligence.json (107 MB) is too large to
// process during build. Pages render on-demand via SSR.
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateUpper = params.state.toUpperCase()
  const countyDisplay = getCountyName(params.county)
  const stateName = getStateName(stateUpper)
  const plans = getPlansByCounty(stateUpper, params.county)

  const planCount = plans.length
  const carrierCount = new Set(plans.map((p) => p.issuer_name)).size
  const premiums40 = plans
    .map((p) => p.premiums?.age_40)
    .filter((v): v is number => v != null)
  const minPremium = premiums40.length > 0 ? Math.min(...premiums40) : null
  const maxPremium = premiums40.length > 0 ? Math.max(...premiums40) : null

  const canonicalUrl = `${SITE_URL}/plans/${params.state}/${params.county}`

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
    `${premiumRange} Source: CMS QHP Landscape PUF ${PLAN_YEAR}.`

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

export default function PlansPage({ params }: Props) {
  const stateUpper = params.state.toUpperCase()
  const countyDisplay = getCountyName(params.county)
  const stateName = getStateName(stateUpper)

  // --- Data loading (all server-side, no external API calls) ---
  const plans = getPlansByCounty(stateUpper, params.county)
  const subsidy = getSubsidyByCounty(stateUpper, params.county)
  const rates = getRatesByCounty(stateUpper, params.county)

  // --- Derived stats ---
  const planCount = plans.length
  const carrierCount = new Set(plans.map((p) => p.issuer_name)).size
  const premiums40 = plans
    .map((p) => p.premiums?.age_40)
    .filter((v): v is number => v != null)
  const minPremium = premiums40.length > 0 ? Math.min(...premiums40) : null
  const maxPremium = premiums40.length > 0 ? Math.max(...premiums40) : null

  // Subsidy at 250% FPL (representative median tier)
  const medianSubsidy = subsidy?.subsidy_estimates?.fpl_250

  // --- Editorial content ---
  const editorial = plans.length > 0
    ? generatePlanComparisonContent({ countyName: countyDisplay, stateCode: stateUpper, plans, planYear: PLAN_YEAR })
    : null

  // --- Entity links ---
  const entityLinks = getRelatedEntities({
    pageType: 'plans',
    state: params.state,
    county: params.county,
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
  const canonicalUrl = `${SITE_URL}/plans/${params.state}/${params.county}`

  const articleSchema = buildArticleSchema({
    headline: `${countyDisplay} Health Insurance Plans (${PLAN_YEAR})`,
    description: `${planCount} plans from ${carrierCount} carriers in ${countyDisplay}, ${stateName} for plan year ${PLAN_YEAR}. Source: CMS QHP Landscape PUF.`,
    dateModified: new Date().toISOString().slice(0, 7),
    dataSourceName: 'CMS QHP Landscape PUF',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  const productSchema = buildPlansProductSchema({
    countyName: countyDisplay,
    stateCode: stateUpper,
    planYear: PLAN_YEAR,
    // Cap at 50 offers to keep schema payload manageable
    plans: plans.slice(0, 50),
  })

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Plans', url: `${SITE_URL}/plans` },
    { name: stateName, url: `${SITE_URL}/plans/${params.state}` },
    { name: countyDisplay, url: canonicalUrl },
  ])

  return (
    <>
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={productSchema} id="product-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">

        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <a href="/" className="hover:underline text-primary-600">Home</a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li>
              <a href="/plans" className="hover:underline text-primary-600">Plans</a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li>
              <a href={`/plans/${params.state}`} className="hover:underline text-primary-600">
                {stateUpper}
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
                {stateUpper} from <strong>{carrierCount}</strong> carrier
                {carrierCount !== 1 ? 's' : ''}.
                {minPremium != null && maxPremium != null && (
                  <>
                    {' '}Age 40 premiums range from{' '}
                    <strong>${minPremium.toFixed(0)}</strong> to{' '}
                    <strong>${maxPremium.toFixed(0)}/mo</strong> before subsidy.
                  </>
                )}{' '}
                Data source: CMS QHP Landscape PUF · Plan Year {PLAN_YEAR}.
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
              Subsidy Estimate for {countyDisplay}, {stateUpper}
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
              Estimates based on CMS benchmark silver premium · Age 40 reference ·
              Subsidy amounts may vary by income, household size, and plan choice.{' '}
              <a
                href={`/subsidies/${params.state}/${params.county}`}
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
              Source: CMS Rate PUF · Plan Year {rates.plan_year} ·{' '}
              <a href={`/rates/${params.state}/${params.county}`} className="underline">
                View full rate analysis →
              </a>
            </p>
          </section>
        )}

        {/* ── Editorial content ── */}
        {editorial && (
          <section className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }} />
        )}

        {/* ── Drug coverage quick-links ── */}
        <DrugCoveragePills
          countyDisplay={countyDisplay}
          stateCode={stateUpper}
          countyFips={params.county}
        />

        {/* ── Entity links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ── Medical disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Premium data sourced from the CMS QHP Landscape PUF, plan year {PLAN_YEAR}. All
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

// ─── Priority drugs for county drug coverage cross-links ────────────────────
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
  stateCode,
  countyFips,
}: {
  countyDisplay: string
  stateCode: string
  countyFips: string
}) {
  const stateSlug = stateCodeToSlug(stateCode)
  const countySlug = getCountySlug(countyFips)

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
          href={`/formulary/${stateCode.toLowerCase()}/all`}
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
