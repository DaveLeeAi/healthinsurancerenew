import type { Metadata } from 'next'
import { getDentalByPlanVariant, getDentalByState, loadDentalCoverage } from '@/lib/data-loader'
import { getRelatedEntities } from '@/lib/entity-linker'
import {
  buildDentalPlanSchema,
  buildBreadcrumbSchema,
  buildArticleSchema,
  buildFAQSchema,
} from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import EntityLinkCard from '@/components/EntityLinkCard'
import type { DentalRecord } from '@/lib/types'
import { generateDentalContent } from '@/lib/content-templates'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

const STATE_NAMES: Record<string, string> = {
  AK: 'Alaska', AL: 'Alabama', AR: 'Arkansas', AZ: 'Arizona', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DC: 'District of Columbia', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', IA: 'Iowa', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  MA: 'Massachusetts', MD: 'Maryland', ME: 'Maine', MI: 'Michigan', MN: 'Minnesota',
  MO: 'Missouri', MS: 'Mississippi', MT: 'Montana', NC: 'North Carolina',
  ND: 'North Dakota', NE: 'Nebraska', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NV: 'Nevada', NY: 'New York', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VA: 'Virginia',
  VT: 'Vermont', WA: 'Washington', WI: 'Wisconsin', WV: 'West Virginia', WY: 'Wyoming',
}

interface Props {
  params: { state: string; plan_variant: string }
}

// Dynamic rendering — 1,389 plan variants render on-demand via SSR
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const plan = getDentalByPlanVariant(params.plan_variant)
  if (!plan) return { title: 'Dental Plan Not Found' }

  const stateName = STATE_NAMES[plan.state_code] ?? plan.state_code
  const canonicalUrl = `${SITE_URL}/dental/${params.state}/${params.plan_variant}`

  const title = `${plan.plan_name} Dental Coverage ${PLAN_YEAR} | What's Actually Covered in ${stateName}`
  const description =
    `${plan.plan_name} is a stand-alone dental plan (SADP) from ${plan.issuer_name} ` +
    `in ${stateName}. ${plan.metal_level} tier ${plan.plan_type} plan. ` +
    `See coverage percentages, annual max, waiting periods, and what's actually included for ${PLAN_YEAR}.`

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
// FAQ data
// ---------------------------------------------------------------------------

function buildFAQs(plan: DentalRecord, stateName: string): Array<{ question: string; answer: string }> {
  const annualMax = plan.annual_maximum.individual_in_network
  const cp = plan.coverage_percentages

  return [
    {
      question: `What does ${plan.plan_name} cover for preventive dental care?`,
      answer: cp.preventive_adult != null
        ? `${plan.plan_name} covers preventive dental care (cleanings, exams, x-rays) at ${cp.preventive_adult}% for adults${cp.preventive_child != null ? ` and ${cp.preventive_child}% for children` : ''}. Most dental plans consider two cleanings and exams per year as standard preventive care.`
        : `Preventive coverage details for ${plan.plan_name} are not published in the CMS dataset. Check the plan's Summary of Benefits and Coverage (SBC) document for exact preventive care percentages.`,
    },
    {
      question: `What is the annual maximum benefit for ${plan.plan_name}?`,
      answer: annualMax != null
        ? `The annual maximum benefit for ${plan.plan_name} is $${annualMax.toLocaleString()} per individual. This is the most the plan will pay toward covered dental services in a single plan year. Once you reach this limit, you pay 100% of any remaining dental costs.`
        : `The annual maximum benefit for ${plan.plan_name} is not published in the CMS dataset. Contact ${plan.issuer_name} directly or review the plan's SBC for this information.`,
    },
    {
      question: `Does ${plan.plan_name} cover crowns, root canals, and other major dental work?`,
      answer: cp.major_adult != null
        ? `Yes, ${plan.plan_name} covers major restorative work at ${cp.major_adult}% for adults${cp.major_child != null ? ` and ${cp.major_child}% for children` : ''}. Major dental work typically includes crowns, bridges, root canals, dentures, and oral surgery. Note that this is applied after any deductible and subject to the annual maximum.`
        : `Major restorative coverage details are not published in the CMS dataset for this plan. Check the SBC or contact ${plan.issuer_name} for specifics on crowns, root canals, and other major work.`,
    },
    {
      question: `Does ${plan.plan_name} cover orthodontia (braces)?`,
      answer: plan.ortho_adult_covered
        ? `Yes, ${plan.plan_name} includes orthodontia coverage for adults${cp.ortho_adult != null ? ` at ${cp.ortho_adult}%` : ''}${cp.ortho_child != null ? `. Children's orthodontia is covered at ${cp.ortho_child}%` : ''}. Orthodontia often has a separate lifetime maximum — check the SBC for details.`
        : cp.ortho_child != null
          ? `${plan.plan_name} covers orthodontia for children at ${cp.ortho_child}% but does not cover adult orthodontia. This is typical for ACA stand-alone dental plans — pediatric dental is an essential health benefit, but adult ortho is not required.`
          : `${plan.plan_name} does not include adult orthodontia coverage. Most ACA stand-alone dental plans only cover pediatric orthodontia as part of the essential health benefits requirement.`,
    },
    {
      question: `Are there waiting periods for ${plan.plan_name}?`,
      answer: plan.waiting_periods.needs_pdf_parsing
        ? `Waiting period details for ${plan.plan_name} are not published in the CMS public dataset. Many dental plans impose waiting periods of 6–12 months for basic and major services. Review the plan's SBC document or contact ${plan.issuer_name} to confirm.`
        : plan.waiting_periods.basic_months != null && plan.waiting_periods.basic_months > 0
          ? `Yes, ${plan.plan_name} has waiting periods: ${plan.waiting_periods.basic_months} months for basic services${plan.waiting_periods.major_months != null ? ` and ${plan.waiting_periods.major_months} months for major services` : ''}. Preventive care typically has no waiting period.`
          : `Based on available data, ${plan.plan_name} has no documented waiting periods. However, always confirm with the plan's SBC document, as some waiting periods may apply.`,
    },
    {
      question: `What type of dental plan is ${plan.plan_name}?`,
      answer: `${plan.plan_name} is a ${plan.metal_level} tier ${plan.plan_type} stand-alone dental plan (SADP) offered by ${plan.issuer_name} in ${stateName}. As an SADP, it is purchased separately from your medical health insurance plan through the ACA Marketplace. The "${plan.metal_level}" designation indicates the plan's actuarial value tier — ${plan.metal_level === 'High' ? 'High plans generally have lower out-of-pocket costs but higher premiums' : 'Low plans generally have lower premiums but higher out-of-pocket costs'}.`,
    },
    {
      question: `Does ${plan.plan_name} cover dental implants?`,
      answer: plan.implants_adult_covered
        ? `Yes, ${plan.plan_name} includes coverage for adult dental implants. Implants are typically categorized as major restorative work and subject to the plan's major coverage percentage and annual maximum. Check the SBC for specific implant coverage terms and any limitations.`
        : `${plan.plan_name} does not cover adult dental implants based on CMS plan data. Dental implants are not commonly covered by stand-alone dental plans. If you need implant coverage, compare plans specifically for this benefit or consider supplemental dental discount programs.`,
    },
    {
      question: `How does ${plan.plan_name} compare to other dental plans in ${stateName}?`,
      answer: `${plan.plan_name} is one of multiple stand-alone dental plans available in ${stateName} through the ACA Marketplace. To compare, look at the annual maximum benefit${annualMax != null ? ` ($${annualMax.toLocaleString()} for this plan)` : ''}, coverage percentages for the services you use most, waiting periods, and the provider network (${plan.plan_type}). Use our state dental comparison page to see all available options side by side.`,
    },
  ]
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DentalPlanPage({ params }: Props) {
  const plan = getDentalByPlanVariant(params.plan_variant)

  if (!plan) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-neutral-500">Dental plan not found.</p>
      </main>
    )
  }

  const stateUpper = plan.state_code
  const stateName = STATE_NAMES[stateUpper] ?? stateUpper
  const cp = plan.coverage_percentages
  const annualMax = plan.annual_maximum.individual_in_network
  const deductible = plan.deductible.individual_in_network
  const canonicalUrl = `${SITE_URL}/dental/${params.state}/${params.plan_variant}`

  // --- Editorial content ---
  const editorial = generateDentalContent({ dental: plan, planYear: PLAN_YEAR })

  // --- Sibling plans in same state for comparison ---
  const statePlans = getDentalByState(stateUpper)
  const siblingPlans = statePlans
    .filter((p) => p.plan_variant_id !== plan.plan_variant_id)
    .slice(0, 6)

  // --- Entity links ---
  const entityLinks = getRelatedEntities({
    pageType: 'dental',
    state: params.state,
    planVariantId: params.plan_variant,
    issuerName: plan.issuer_name,
    planName: plan.plan_name,
  })

  // --- FAQs ---
  const faqs = buildFAQs(plan, stateName)

  // --- Schema ---
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Dental', url: `${SITE_URL}/dental` },
    { name: stateName, url: `${SITE_URL}/dental/${params.state}` },
    { name: plan.plan_name, url: canonicalUrl },
  ])

  const articleSchema = buildArticleSchema({
    headline: `${plan.plan_name} Dental Coverage in ${stateName} — ${PLAN_YEAR} Benefits`,
    description: `Stand-alone dental plan (SADP) from ${plan.issuer_name}. Coverage tiers, annual maximum, waiting periods, and what's included. Source: CMS SADP PUF.`,
    dateModified: new Date().toISOString().slice(0, 10),
    dataSourceName: 'CMS SADP PUF',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  const dentalSchema = buildDentalPlanSchema({ dental: plan, planYear: PLAN_YEAR })
  const faqSchema = buildFAQSchema(faqs)

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={dentalSchema} id="dental-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* ── Breadcrumbs ── */}
        <Breadcrumbs state={params.state} stateName={stateName} planName={plan.plan_name} />

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            {plan.plan_name} Dental Coverage in {stateName} — {PLAN_YEAR} Benefits
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            {plan.metal_level} tier {plan.plan_type} stand-alone dental plan from{' '}
            <strong>{plan.issuer_name}</strong>.{' '}
            {plan.covers_entire_state
              ? `Available statewide in ${stateName}`
              : `Available in select counties in ${stateName}`}
            . Plan year {PLAN_YEAR}.
          </p>
        </section>

        {/* ── Coverage Type Badge ── */}
        <section aria-labelledby="coverage-type-heading">
          <h2 id="coverage-type-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Dental Coverage Type
          </h2>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-teal-100 text-teal-800">
                Standalone Dental Plan (SADP)
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-100 text-neutral-700">
                {plan.metal_level} Tier
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-100 text-neutral-700">
                {plan.plan_type}
              </span>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              This is a <strong>stand-alone dental plan (SADP)</strong> — it is purchased separately
              from your medical health insurance through the ACA Marketplace. Unlike embedded dental
              (included in some medical plans), an SADP provides dedicated dental coverage with its
              own deductible, annual maximum, and provider network. SADPs are the primary way adults
              get dental coverage through the Marketplace, since adult dental is not an essential
              health benefit under the ACA.
            </p>
          </div>
        </section>

        {/* ── Key Stats ── */}
        <section aria-labelledby="key-stats-heading">
          <h2 id="key-stats-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Plan at a Glance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Annual Maximum"
              value={annualMax != null ? `$${annualMax.toLocaleString()}` : 'N/A'}
              note="Most the plan pays per year"
            />
            <StatCard
              label="Deductible"
              value={deductible != null ? `$${deductible.toLocaleString()}` : 'None / N/A'}
              note="Per individual, in-network"
            />
            <StatCard
              label="Metal Level"
              value={plan.metal_level}
              note={plan.metal_level === 'High' ? 'Lower out-of-pocket' : 'Lower premiums'}
            />
            <StatCard
              label="Network Type"
              value={plan.plan_type}
              note={plan.covers_entire_state ? 'Statewide' : 'Select counties'}
            />
          </div>
        </section>

        {/* ── Coverage Grid ── */}
        <section aria-labelledby="coverage-grid-heading">
          <h2 id="coverage-grid-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Coverage Breakdown by Service Type
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-teal-50 text-teal-800">
                  <th className="text-left py-3 px-4 font-semibold">Service Category</th>
                  <th className="text-left py-3 px-4 font-semibold">What&apos;s Included</th>
                  <th className="text-right py-3 px-4 font-semibold">Adult Coverage</th>
                  <th className="text-right py-3 px-4 font-semibold">Child Coverage</th>
                  <th className="text-right py-3 px-4 font-semibold">Waiting Period</th>
                </tr>
              </thead>
              <tbody>
                <CoverageRow
                  category="Preventive"
                  services="Cleanings, exams, x-rays, fluoride"
                  adultPct={cp.preventive_adult}
                  childPct={cp.preventive_child}
                  waitMonths={plan.waiting_periods.preventive_months}
                  highlight
                />
                <CoverageRow
                  category="Basic"
                  services="Fillings, extractions, simple repairs"
                  adultPct={cp.basic_adult}
                  childPct={cp.basic_child}
                  waitMonths={plan.waiting_periods.basic_months}
                />
                <CoverageRow
                  category="Major"
                  services="Crowns, root canals, bridges, dentures"
                  adultPct={cp.major_adult}
                  childPct={cp.major_child}
                  waitMonths={plan.waiting_periods.major_months}
                />
                <CoverageRow
                  category="Orthodontia"
                  services="Braces, aligners, retainers"
                  adultPct={plan.ortho_adult_covered ? cp.ortho_adult : null}
                  childPct={cp.ortho_child}
                  waitMonths={plan.waiting_periods.ortho_months}
                  adultNote={!plan.ortho_adult_covered ? 'Not covered' : undefined}
                />
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Coverage percentages represent the plan&apos;s share of costs (plan pays %). You pay
            the remaining percentage after any deductible. Source: CMS BenCS PUF + SADP Plan
            Attributes PUF, plan year {PLAN_YEAR}.
          </p>
          {plan.waiting_periods.needs_pdf_parsing && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Waiting period details for this plan are not published in the CMS public dataset.
              Many dental plans impose 6–12 month waiting periods for basic and major services.
              Review the plan&apos;s Summary of Benefits and Coverage (SBC) document for exact terms.
            </div>
          )}
        </section>

        {/* ── Additional Coverage Details ── */}
        <section aria-labelledby="additional-heading">
          <h2 id="additional-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Additional Coverage Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailCard
              label="Dental Implants (Adult)"
              value={plan.implants_adult_covered ? 'Covered' : 'Not Covered'}
              positive={plan.implants_adult_covered}
            />
            <DetailCard
              label="Adult Orthodontia"
              value={plan.ortho_adult_covered ? 'Covered' : 'Not Covered'}
              positive={plan.ortho_adult_covered}
            />
            <DetailCard
              label="Pre-Existing Conditions"
              value={plan.pre_existing_excluded ? 'Excluded' : 'Covered'}
              positive={!plan.pre_existing_excluded}
            />
            <DetailCard
              label="Plan Status"
              value={plan.is_new_plan ? 'New for ' + PLAN_YEAR : 'Returning plan'}
              positive={plan.is_new_plan}
            />
          </div>
          {Object.keys(plan.quantity_limits).length > 0 && (
            <div className="mt-4 bg-neutral-50 rounded-xl p-4 border border-neutral-200">
              <h3 className="text-sm font-semibold text-navy-700 mb-2">Visit & Quantity Limits</h3>
              <ul className="text-sm text-neutral-600 space-y-1">
                {Object.entries(plan.quantity_limits).map(([key, limit]) => (
                  <li key={key}>
                    <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>: {limit.qty}{' '}
                    {limit.unit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ── Annual Maximum Explainer ── */}
        <section aria-labelledby="annual-max-heading">
          <h2 id="annual-max-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Understanding the Annual Maximum
          </h2>
          <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
            {annualMax != null ? (
              <>
                <p className="text-neutral-700 leading-relaxed">
                  {plan.plan_name} has an annual maximum benefit of{' '}
                  <strong>${annualMax.toLocaleString()}</strong> per individual. This is the most the
                  plan will pay toward your covered dental services in a single plan year. Once you
                  hit this cap, you are responsible for 100% of any additional dental costs.
                </p>
                <p className="text-neutral-600 text-sm mt-3">
                  For context, a single crown typically costs $800–$1,500 and a root canal $700–$1,200.
                  With a ${annualMax.toLocaleString()} annual max, one major procedure could consume
                  most or all of your annual benefit. Plan accordingly if you anticipate major dental
                  work.
                </p>
              </>
            ) : (
              <p className="text-neutral-700 leading-relaxed">
                The annual maximum benefit for this plan is not published in the CMS dataset. Contact{' '}
                {plan.issuer_name} or review the SBC document for this information.
              </p>
            )}
          </div>
        </section>

        {/* ── The Dental Coverage Reality ── */}
        <section aria-labelledby="reality-heading">
          <h2 id="reality-heading" className="text-xl font-semibold text-navy-800 mb-4">
            The Dental Coverage Reality
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
            <p className="text-neutral-700 leading-relaxed">
              Adult dental coverage through the ACA Marketplace has significant limitations that
              every enrollee should understand. Unlike pediatric dental (which is an essential health
              benefit), <strong>adult dental is not required under the ACA</strong>. Stand-alone dental
              plans are the primary option, and they come with real constraints.
            </p>
            <div className="space-y-3">
              <RealityPoint
                title="Low Annual Maximums"
                text={`Most SADPs cap annual benefits at $150–$450. ${annualMax != null ? `This plan's $${annualMax.toLocaleString()} maximum` : 'Typical maximums'} can be consumed by a single major procedure like a crown or root canal.`}
              />
              <RealityPoint
                title="Waiting Periods"
                text="Many plans require you to pay premiums for 6–12 months before covering basic or major work. Preventive care is usually covered immediately. If you need dental work soon, check the waiting periods carefully."
              />
              <RealityPoint
                title="Coverage Percentages Decrease with Complexity"
                text={`Preventive care is typically covered at 80–100%, but major work (crowns, root canals, dentures) often drops to 30–50%. ${cp.major_adult != null ? `This plan covers major work at ${cp.major_adult}%.` : ''} You pay the difference.`}
              />
              <RealityPoint
                title="No Premium Subsidies for Dental"
                text="APTC premium tax credits only apply to medical plans — they cannot be used to reduce SADP premiums. You pay the full dental premium out of pocket."
              />
            </div>
            <p className="text-sm text-amber-800 font-medium mt-2">
              Consult a licensed health insurance agent to understand whether a stand-alone dental
              plan, a medical plan with embedded dental, or a dental discount program best fits your
              needs.
            </p>
          </div>
        </section>

        {/* ── FAQ Section ── */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group bg-neutral-50 border border-neutral-200 rounded-xl"
              >
                <summary className="cursor-pointer px-5 py-4 text-navy-800 font-medium hover:bg-neutral-100 rounded-xl transition-colors">
                  {faq.question}
                </summary>
                <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Comparison: Other plans in state ── */}
        {siblingPlans.length > 0 && (
          <section aria-labelledby="compare-heading">
            <h2 id="compare-heading" className="text-xl font-semibold text-navy-800 mb-4">
              How This Compares to Other Dental Options in {stateName}
            </h2>
            <p className="text-neutral-600 text-sm mb-4">
              There are {statePlans.length} dental plan variants available in {stateName} for{' '}
              {PLAN_YEAR}. Here are some alternatives to compare.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-700">
                    <th className="text-left py-3 px-4 font-semibold">Plan Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Issuer</th>
                    <th className="text-right py-3 px-4 font-semibold">Level</th>
                    <th className="text-right py-3 px-4 font-semibold">Annual Max</th>
                    <th className="text-right py-3 px-4 font-semibold">Preventive</th>
                    <th className="text-right py-3 px-4 font-semibold">Major</th>
                  </tr>
                </thead>
                <tbody>
                  {siblingPlans.map((sib) => (
                    <tr
                      key={sib.plan_variant_id}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="py-3 px-4">
                        <a
                          href={`/dental/${params.state}/${sib.plan_variant_id}`}
                          className="text-primary-600 hover:underline font-medium"
                        >
                          {sib.plan_name}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{sib.issuer_name}</td>
                      <td className="py-3 px-4 text-right text-neutral-600">{sib.metal_level}</td>
                      <td className="py-3 px-4 text-right font-medium text-navy-800">
                        {sib.annual_maximum.individual_in_network != null
                          ? `$${sib.annual_maximum.individual_in_network.toLocaleString()}`
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600">
                        {sib.coverage_percentages.preventive_adult != null
                          ? `${sib.coverage_percentages.preventive_adult}%`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600">
                        {sib.coverage_percentages.major_adult != null
                          ? `${sib.coverage_percentages.major_adult}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-neutral-500 mt-3">
              <a
                href={`/dental/${params.state}`}
                className="text-primary-600 hover:underline font-medium"
              >
                View all {statePlans.length} dental plans in {stateName} →
              </a>
            </p>
          </section>
        )}

        {/* ── Editorial content ── */}
        <section className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }} />

        {/* ── Entity links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ── Medical disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Dental plan data sourced from the CMS SADP Plan Attributes PUF and BenCS PUF, plan
            year {PLAN_YEAR}. Coverage percentages and benefits shown are based on CMS public data
            and may not reflect all plan terms. Always review the Summary of Benefits and Coverage
            (SBC) document for complete plan details.
          </p>
          <p>
            This page is for informational purposes only and does not constitute dental or insurance
            advice.{' '}
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

function Breadcrumbs({
  state,
  stateName,
  planName,
}: {
  state: string
  stateName: string
  planName: string
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <a href="/" className="hover:underline text-primary-600">Home</a>
        </li>
        <li aria-hidden="true" className="text-neutral-300">›</li>
        <li>
          <a href="/dental" className="hover:underline text-primary-600">Dental</a>
        </li>
        <li aria-hidden="true" className="text-neutral-300">›</li>
        <li>
          <a href={`/dental/${state}`} className="hover:underline text-primary-600">{stateName}</a>
        </li>
        <li aria-hidden="true" className="text-neutral-300">›</li>
        <li aria-current="page" className="text-neutral-700 font-medium truncate max-w-xs">
          {planName}
        </li>
      </ol>
    </nav>
  )
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div className="p-4 rounded-xl bg-neutral-50">
      <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-navy-800">{value}</div>
      {note && <div className="text-xs text-neutral-400 mt-0.5">{note}</div>}
    </div>
  )
}

function CoverageRow({
  category,
  services,
  adultPct,
  childPct,
  waitMonths,
  highlight = false,
  adultNote,
}: {
  category: string
  services: string
  adultPct: number | null
  childPct: number | null
  waitMonths: number | null
  highlight?: boolean
  adultNote?: string
}) {
  return (
    <tr className={`border-b border-neutral-100 ${highlight ? 'bg-teal-50/50' : 'hover:bg-neutral-50'}`}>
      <td className="py-3 px-4 font-semibold text-navy-800">{category}</td>
      <td className="py-3 px-4 text-neutral-600">{services}</td>
      <td className="py-3 px-4 text-right font-medium text-navy-800">
        {adultNote ?? (adultPct != null ? `${adultPct}%` : '—')}
      </td>
      <td className="py-3 px-4 text-right text-neutral-600">
        {childPct != null ? `${childPct}%` : '—'}
      </td>
      <td className="py-3 px-4 text-right text-neutral-500">
        {waitMonths != null
          ? waitMonths === 0
            ? 'None'
            : `${waitMonths} mo`
          : '—'}
      </td>
    </tr>
  )
}

function DetailCard({
  label,
  value,
  positive,
}: {
  label: string
  value: string
  positive: boolean
}) {
  return (
    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
      <span className="text-sm text-neutral-600">{label}</span>
      <span className={`text-sm font-semibold ${positive ? 'text-green-700' : 'text-neutral-500'}`}>
        {value}
      </span>
    </div>
  )
}

function RealityPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 mt-2" />
      <div>
        <h3 className="font-semibold text-amber-900 text-sm">{title}</h3>
        <p className="text-sm text-neutral-700 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
