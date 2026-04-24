import type { Metadata } from 'next'
import {
  getRatesByCounty,
  getPlansByCounty,
  getAllStateCountyCombos,
} from '@/lib/data-loader'
import { getRelatedEntities } from '@/lib/entity-linker'
import {
  buildRateVolatilityDatasetSchema,
  buildBreadcrumbSchema,
  buildArticleSchema,
  buildWebPageSchema,
} from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import EntityLinkCard from '@/components/EntityLinkCard'
import type { PlanRecord } from '@/lib/types'
import { generateRateVolatilityContent } from '@/lib/content-templates'
import { getCountyName } from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface Props {
  params: { state: string; county: string }
}

// Static generation — all state/county combos pre-built at deploy; revalidate daily
export const revalidate = 86400

export async function generateStaticParams() {
  return getAllStateCountyCombos()
    .map(({ state, county }) => ({ state, county }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateUpper = params.state.toUpperCase()
  const countyDisplay = getCountyName(params.county) ?? `County ${params.county}`
  const rates = getRatesByCounty(stateUpper, params.county)

  const carrierCount = rates?.carrier_count ?? 0
  const yoyDirection =
    rates?.yoy_change_pct != null
      ? rates.yoy_change_pct > 0
        ? 'increasing'
        : rates.yoy_change_pct < 0
          ? 'decreasing'
          : 'stable'
      : null

  const canonicalUrl = `${SITE_URL}/rates/${params.state}/${params.county}`

  const title = `Health Insurance Rate Changes in ${countyDisplay}, ${stateUpper} ${PLAN_YEAR} | Premium Trends`

  const yoyPhrase = yoyDirection ? ` Premiums are ${yoyDirection} year-over-year.` : ''
  const description =
    `${PLAN_YEAR} health insurance premium rate trends for ${countyDisplay}, ${stateUpper}.` +
    ` ${carrierCount} carrier${carrierCount !== 1 ? 's' : ''} competing.${yoyPhrase}` +
    ` Source: federal marketplace rate filings.`

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
export default function RatesPage({ params }: Props) {
  const stateUpper = params.state.toUpperCase()
  const countyDisplay = getCountyName(params.county) ?? `County ${params.county}`

  // --- Data loading ---
  const rates = getRatesByCounty(stateUpper, params.county)
  const plans = getPlansByCounty(stateUpper, params.county)

  // --- Entity links ---
  const entityLinks = getRelatedEntities({
    pageType: 'rates',
    state: params.state,
    county: params.county,
    countyName: countyDisplay,
  })

  // --- Schema ---
  const canonicalUrl = `${SITE_URL}/rates/${params.state}/${params.county}`

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Rates', url: `${SITE_URL}/rates` },
    { name: stateUpper, url: `${SITE_URL}/rates/${params.state}` },
    { name: countyDisplay, url: canonicalUrl },
  ])

  const articleSchema = buildArticleSchema({
    headline: `${countyDisplay}, ${stateUpper} Health Insurance Rate Changes for ${PLAN_YEAR}`,
    description: `Premium rate analytics for ${countyDisplay}, ${stateUpper}. ${rates?.plan_count ?? 0} plans across ${rates?.carrier_count ?? 0} carriers. Source: federal marketplace rate filings.`,
    dateModified: '2026-01-15',
    dataSourceName: 'Federal Marketplace Rate Filings',
  })

  const datasetSchema = rates
    ? buildRateVolatilityDatasetSchema({ record: rates, countyName: countyDisplay })
    : undefined

  const webPageSchema = buildWebPageSchema({
    name: `Health Insurance Rate Changes in ${countyDisplay}, ${stateUpper} ${PLAN_YEAR}`,
    description: `Premium rate analytics for ${countyDisplay}, ${stateUpper}. ${rates?.plan_count ?? 0} plans across ${rates?.carrier_count ?? 0} carriers.`,
    url: canonicalUrl,
    dateModified: '2026-01-15',
    speakableCssSelectors: ['h1', '#key-stats-heading'],
  })

  // --- No data fallback ---
  if (!rates) {
    return (
      <>
        <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
        <SchemaScript schema={articleSchema} id="article-schema" />
        <SchemaScript schema={webPageSchema} id="webpage-schema" />
        <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
          <Breadcrumbs
            state={params.state}
            stateUpper={stateUpper}
            countyDisplay={countyDisplay}
          />
          <section>
            <h1 className="text-3xl font-bold text-navy-900 mb-3">
              {countyDisplay}, {stateUpper} Health Insurance Rate Changes for {PLAN_YEAR}
            </h1>
            <p className="text-neutral-500">
              No rate data available for this county in the {PLAN_YEAR} dataset.
            </p>
          </section>
          <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />
        </main>
      </>
    )
  }

  // --- Editorial content ---
  const editorial = generateRateVolatilityContent({
    countyName: countyDisplay,
    stateCode: stateUpper,
    record: rates,
  })

  // --- Derived data ---
  const carrierPremiums = deriveCarrierPremiums(plans)
  const stabilityScore = getStabilityScore(rates.yoy_change_pct)
  const metalLevels = Object.entries(rates.by_metal_level).filter(
    (entry): entry is [string, NonNullable<(typeof entry)[1]>] => entry[1] != null
  )

  return (
    <>
      <SchemaScript schema={articleSchema} id="article-schema" />
      {datasetSchema && <SchemaScript schema={datasetSchema} id="dataset-schema" />}
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={webPageSchema} id="webpage-schema" />
      <LlmComment
        pageType="rates-county"
        state={stateUpper}
        county={countyDisplay}
        planCount={rates.plan_count}
        carrierCount={rates.carrier_count}
        data="federal-marketplace-rate-filings"
        extra={{
          avgPremium40: `$${rates.avg_premium_age_40.toFixed(0)}`,
          yoyChange: rates.yoy_change_pct != null ? `${rates.yoy_change_pct.toFixed(1)}%` : 'N/A',
        }}
      />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* ── Breadcrumbs ── */}
        <Breadcrumbs
          state={params.state}
          stateUpper={stateUpper}
          countyDisplay={countyDisplay}
        />

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            {countyDisplay}, {stateUpper} Health Insurance Rate Changes for {PLAN_YEAR}
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            <strong>{rates.carrier_count}</strong> carrier
            {rates.carrier_count !== 1 ? 's' : ''} offer{' '}
            <strong>{rates.plan_count}</strong> marketplace plan
            {rates.plan_count !== 1 ? 's' : ''} in {countyDisplay}, {stateUpper}
            {rates.yoy_change_pct != null && (
              <>
                {'. '}Average premiums{' '}
                {rates.yoy_change_pct > 0
                  ? `increased ${rates.yoy_change_pct.toFixed(1)}%`
                  : rates.yoy_change_pct < 0
                    ? `decreased ${Math.abs(rates.yoy_change_pct).toFixed(1)}%`
                    : 'remained stable'}{' '}
                year-over-year
              </>
            )}
            . Data sourced from federal marketplace rate filings for plan year {rates.plan_year}.
          </p>
        </section>

        {/* ── Key stats callout ── */}
        <section aria-labelledby="key-stats-heading">
          <h2 id="key-stats-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Key Rate Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Carriers" value={rates.carrier_count.toString()} />
            <StatCard label="Total Plans" value={rates.plan_count.toString()} />
            <StatCard
              label="Avg Premium (Age 40)"
              value={`$${rates.avg_premium_age_40.toFixed(0)}/mo`}
            />
            <StatCard
              label="Age 64 Shock Ratio"
              value={`${rates.age_64_shock_ratio.toFixed(1)}×`}
              note="Age 64 vs age 21 rate multiple"
              highlight={rates.age_64_shock_ratio > 2.5}
            />
            {rates.yoy_change_pct != null && (
              <StatCard
                label="Year-over-Year Change"
                value={`${rates.yoy_change_pct > 0 ? '+' : ''}${rates.yoy_change_pct.toFixed(1)}%`}
                highlight={Math.abs(rates.yoy_change_pct) > 5}
              />
            )}
            <StatCard
              label="Age 21 Avg"
              value={`$${rates.avg_premium_age_21.toFixed(0)}/mo`}
            />
            <StatCard
              label="Age 64 Avg"
              value={`$${rates.avg_premium_age_64.toFixed(0)}/mo`}
            />
          </div>
        </section>

        {/* ── Age 64 shock ratio explainer ── */}
        <section aria-labelledby="age-64-heading">
          <h2 id="age-64-heading" className="text-xl font-semibold text-navy-800 mb-4">
            What the Age 64 Shock Ratio Means
          </h2>
          <div
            className={`rounded-xl p-6 ${
              rates.age_64_shock_ratio > 2.5
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-primary-50 border border-primary-200'
            }`}
          >
            <p className="text-neutral-700 leading-relaxed">
              The age 64 shock ratio of{' '}
              <strong>{rates.age_64_shock_ratio.toFixed(1)}×</strong> means a 64-year-old
              enrollee pays roughly {rates.age_64_shock_ratio.toFixed(1)} times more than a
              21-year-old for the same plan. In {countyDisplay}, a 21-year-old pays an average
              of <strong>${rates.avg_premium_age_21.toFixed(0)}/mo</strong> while a 64-year-old
              pays <strong>${rates.avg_premium_age_64.toFixed(0)}/mo</strong> — a difference
              of{' '}
              <strong>
                ${(rates.avg_premium_age_64 - rates.avg_premium_age_21).toFixed(0)}/mo
              </strong>
              .
            </p>
            {rates.age_64_shock_ratio > 2.5 && (
              <p className="text-amber-800 font-medium mt-3">
                With a shock ratio above 2.5×, older enrollees in this county face
                significantly higher premiums. If you are over 50, compare plans carefully and
                check whether your APTC subsidy offsets the increase.
              </p>
            )}
            <p className="text-neutral-600 text-sm mt-3">
              Under ACA rules, insurance companies can charge up to a 3:1 age ratio — the oldest
              enrollees pay no more than 3× the youngest. The actual ratio in your county
              depends on each carrier&apos;s rate filing with CMS.
            </p>
          </div>
        </section>

        {/* ── Carrier-by-carrier premium comparison ── */}
        {carrierPremiums.length > 0 && (
          <section aria-labelledby="carrier-table-heading">
            <h2
              id="carrier-table-heading"
              className="text-xl font-semibold text-navy-800 mb-4"
            >
              Carrier Premium Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-navy-50 text-navy-700">
                    <th className="text-left py-3 px-4 font-semibold">Carrier</th>
                    <th className="text-right py-3 px-4 font-semibold">Plans</th>
                    <th className="text-right py-3 px-4 font-semibold">Avg Age 40</th>
                    <th className="text-right py-3 px-4 font-semibold">Min Age 40</th>
                    <th className="text-right py-3 px-4 font-semibold">Max Age 40</th>
                  </tr>
                </thead>
                <tbody>
                  {carrierPremiums.map((carrier) => (
                    <tr
                      key={carrier.name}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-3 px-4 font-medium text-navy-800">{carrier.name}</td>
                      <td className="py-3 px-4 text-right text-neutral-600">
                        {carrier.planCount}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-navy-800">
                        ${carrier.avgPremium40.toFixed(0)}/mo
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600">
                        ${carrier.minPremium40.toFixed(0)}/mo
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600">
                        ${carrier.maxPremium40.toFixed(0)}/mo
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Premiums shown for age 40, before subsidy. Source: federal marketplace plan data{' '}
              {PLAN_YEAR}.
            </p>
          </section>
        )}

        {/* ── Metal level breakdown ── */}
        {metalLevels.length > 0 && (
          <section aria-labelledby="metal-heading">
            <h2 id="metal-heading" className="text-xl font-semibold text-navy-800 mb-4">
              Premiums by Metal Level
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {metalLevels.map(([level, stats]) => (
                <div
                  key={level}
                  className="p-4 rounded-xl bg-neutral-50 border border-neutral-200"
                >
                  <div className="text-sm font-semibold text-navy-700 capitalize mb-2">
                    {formatMetalLevel(level)}
                  </div>
                  <div className="text-2xl font-bold text-navy-800 mb-1">
                    ${stats.avg_premium_40.toFixed(0)}/mo
                  </div>
                  <div className="text-xs text-neutral-500">
                    {stats.plan_count} plan{stats.plan_count !== 1 ? 's' : ''} · $
                    {stats.min_premium_40.toFixed(0)}–${stats.max_premium_40.toFixed(0)} range
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Rate Stability Score ── */}
        <section aria-labelledby="stability-heading">
          <h2 id="stability-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Rate Stability Score
          </h2>
          <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-5 h-5 rounded-full ${stabilityScore.color}`} />
              <span className="text-xl font-bold text-navy-800">{stabilityScore.label}</span>
            </div>
            <p className="text-neutral-600 text-sm">{stabilityScore.description}</p>
          </div>
        </section>

        {/* ── What You Can Do ── */}
        <section aria-labelledby="action-heading">
          <h2 id="action-heading" className="text-xl font-semibold text-navy-800 mb-4">
            What You Can Do
          </h2>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 space-y-4">
            <ActionTip
              number={1}
              title="Shop during Open Enrollment"
              text="Don't auto-renew. Compare every plan available in your county during the annual Open Enrollment Period (Nov 1 – Jan 15). Premiums and networks change yearly."
            />
            <ActionTip
              number={2}
              title="Check if a subsidy offsets the increase"
              text={`Use the APTC subsidy calculator for ${countyDisplay}, ${stateUpper} to see if your income qualifies for premium assistance. Many enrollees qualify for larger subsidies when premiums rise.`}
            />
            <ActionTip
              number={3}
              title="Consider switching metal levels"
              text="If premiums increased, a lower metal level (e.g., Bronze instead of Silver) may save you money on premiums — but review out-of-pocket costs before switching."
            />
            <ActionTip
              number={4}
              title="Contact a licensed agent"
              text="A licensed health insurance agent can review your specific situation — including income, medications, and providers — to recommend the best plan at the best price."
            />
          </div>
        </section>

        {/* ── Editorial content ── */}
        <section className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }} />

        {/* ── Entity links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ── Byline ── */}
        <GenericByline dataSource="Federal Marketplace Rate Filings" />

        {/* ── Medical disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Premium rate data sourced from federal marketplace rate filings, plan year {rates.plan_year}
            . All premium amounts are pre-subsidy and represent the unsubsidized rate. Actual
            premiums may vary based on age, tobacco use, household size, and applicable premium
            tax credits (APTC).
          </p>
          <p>
            This page is for informational purposes only and does not constitute insurance
            advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> to evaluate your
            specific coverage options and confirm eligibility.
          </p>
        </footer>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

interface CarrierPremium {
  name: string
  planCount: number
  avgPremium40: number
  minPremium40: number
  maxPremium40: number
}

function deriveCarrierPremiums(plans: PlanRecord[]): CarrierPremium[] {
  const map = new Map<string, number[]>()
  for (const plan of plans) {
    const premium = plan.premiums?.age_40
    if (premium == null) continue
    const existing = map.get(plan.issuer_name) ?? []
    existing.push(premium)
    map.set(plan.issuer_name, existing)
  }
  return [...map.entries()]
    .map(([name, premiums]) => ({
      name,
      planCount: premiums.length,
      avgPremium40: premiums.reduce((a, b) => a + b, 0) / premiums.length,
      minPremium40: Math.min(...premiums),
      maxPremium40: Math.max(...premiums),
    }))
    .sort((a, b) => a.avgPremium40 - b.avgPremium40)
}

interface StabilityScore {
  label: string
  color: string
  description: string
}

function getStabilityScore(yoyChangePct: number | undefined | null): StabilityScore {
  if (yoyChangePct == null) {
    return {
      label: 'Data Pending',
      color: 'bg-neutral-400',
      description:
        'Year-over-year rate change data is not yet available for this county. This indicator will update when prior-year data is loaded into the system.',
    }
  }
  const abs = Math.abs(yoyChangePct)
  if (abs < 5) {
    return {
      label: 'Stable',
      color: 'bg-green-500',
      description: `Premiums changed by ${yoyChangePct > 0 ? '+' : ''}${yoyChangePct.toFixed(1)}% year-over-year — within the stable range (under 5%). This is a positive sign for enrollees in this county.`,
    }
  }
  if (abs <= 15) {
    return {
      label: 'Moderate',
      color: 'bg-yellow-500',
      description: `Premiums changed by ${yoyChangePct > 0 ? '+' : ''}${yoyChangePct.toFixed(1)}% year-over-year — a moderate shift. Review your plan options during Open Enrollment to ensure you're getting the best value.`,
    }
  }
  return {
    label: 'Volatile',
    color: 'bg-red-500',
    description: `Premiums changed by ${yoyChangePct > 0 ? '+' : ''}${yoyChangePct.toFixed(1)}% year-over-year — a significant shift (over 15%). Shopping and comparing plans is especially important this year.`,
  }
}

function formatMetalLevel(level: string): string {
  return level
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ---------------------------------------------------------------------------
// Local sub-components
// ---------------------------------------------------------------------------

function Breadcrumbs({
  state,
  stateUpper,
  countyDisplay,
}: {
  state: string
  stateUpper: string
  countyDisplay: string
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <a href="/" className="hover:underline text-primary-600">
            Home
          </a>
        </li>
        <li aria-hidden="true" className="text-neutral-300">
          ›
        </li>
        <li>
          <a href="/rates" className="hover:underline text-primary-600">
            Rates
          </a>
        </li>
        <li aria-hidden="true" className="text-neutral-300">
          ›
        </li>
        <li>
          <a href={`/rates/${state}`} className="hover:underline text-primary-600">
            {stateUpper}
          </a>
        </li>
        <li aria-hidden="true" className="text-neutral-300">
          ›
        </li>
        <li aria-current="page" className="text-neutral-700 font-medium">
          {countyDisplay}
        </li>
      </ol>
    </nav>
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

function ActionTip({
  number,
  title,
  text,
}: {
  number: number
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-primary-900 mb-1">{title}</h3>
        <p className="text-sm text-primary-700 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
