import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Breadcrumbs from '../../../components/Breadcrumbs'
import AnswerBox from '../../../components/AnswerBox'
import FAQSection from '../../../components/FAQSection'
import SourcesBox from '../../../components/SourcesBox'
import SchemaScript from '../../../components/SchemaScript'
import GenericByline from '../../../components/GenericByline'
import LlmComment from '../../../components/LlmComment'
import { getCollectionSlugs, getCollectionEntry } from '../../../lib/markdown'
import type { StateFrontmatter } from '../../../lib/markdown'
import {
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildMedicalWebPageSchema,
} from '../../../lib/schema-markup'
import { getAllStateCountyCombos } from '../../../lib/data-loader'
import {
  getCountyName,
  getCountySlug,
  stateCodeToSlug,
} from '../../../lib/county-lookup'
import allStatesData from '../../../data/config/all-states.json'

// NOTE: No name/NPN on this page — generic byline only.
// This is an informational state overview hub, NOT the commercial plan comparison page.

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface StateEntry {
  name: string
  abbr: string
  slug: string
  exchange: string
  ownExchange: boolean
  exchangeUrl?: string
  medicaidExpanded?: boolean
}

interface Props {
  params: { state: string }
}

export async function generateStaticParams() {
  const slugs = getCollectionSlugs('states')
  return slugs.map((state) => ({ state }))
}

// ---------------------------------------------------------------------------
// Metadata — informational hub intent, distinct from /{state}/health-insurance-plans
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = await getCollectionEntry<StateFrontmatter>('states', params.state)
  if (!entry) return {}

  const { stateName } = entry.frontmatter
  const pageTitle = `Health Insurance in ${stateName} (${PLAN_YEAR} Guide, Costs, Coverage Options)`
  const pageDescription = `Explore health insurance in ${stateName}, including marketplace coverage options, subsidy resources, premium rates, county-level plan data, and where to compare ${PLAN_YEAR} plans.`
  const canonicalUrl = `${SITE_URL}/states/${params.state}`

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: 'HealthInsuranceRenew',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
    },
  }
}

// ---------------------------------------------------------------------------
// Hub-level FAQ generation (informational, not salesy)
// ---------------------------------------------------------------------------

function buildHubFAQs(
  stateName: string,
  stateAbbr: string,
  exchange: string,
  medicaidExpanded: boolean | undefined,
  stateSlug: string,
): { question: string; answer: string }[] {
  return [
    {
      question: `How does health insurance work in ${stateName}?`,
      answer: `${stateName} residents can get ACA marketplace coverage through ${exchange}. Plans are organized by metal tier (Bronze, Silver, Gold, Platinum), each offering different premium-to-cost-sharing trade-offs. All plans cover the ACA's ten essential health benefits. Financial assistance through premium tax credits and cost-sharing reductions may be available based on household income.`,
    },
    {
      question: `Where can I compare ${PLAN_YEAR} health insurance plans in ${stateName}?`,
      answer: `You can compare available ${PLAN_YEAR} marketplace plans, premiums, and carriers on our ${stateName} plan comparison page. That page includes county-level plan data, premium ranges by age and metal tier, and a subsidy estimator to help you understand your costs after financial assistance.`,
    },
    {
      question: `How do health insurance subsidies work in ${stateName}?`,
      answer: `Premium tax credits reduce the monthly cost of marketplace plans for eligible households. The amount depends on your income relative to the Federal Poverty Level (FPL) and the cost of the benchmark Silver plan in your area. ${stateName} premiums vary by county, so subsidy amounts differ depending on where you live. You can explore county-level subsidy estimates on our ${stateName} subsidies page.`,
    },
    {
      question: `${medicaidExpanded ? `Has ${stateName} expanded Medicaid?` : `Why hasn't ${stateName} expanded Medicaid?`}`,
      answer: medicaidExpanded
        ? `Yes, ${stateName} has expanded Medicaid under the ACA, covering adults with incomes up to 138% of the Federal Poverty Level. Residents who earn above that threshold may qualify for premium tax credits on marketplace plans instead.`
        : `As of ${PLAN_YEAR}, ${stateName} has not expanded Medicaid under the ACA. This means some low-income adults may fall into a coverage gap where they earn too much for traditional Medicaid but too little to qualify for marketplace subsidies. The marketplace remains the primary source of subsidized individual coverage.`,
    },
    {
      question: `Should I use the state overview page or the plan comparison page?`,
      answer: `This page is your starting point for understanding health insurance in ${stateName} — marketplace type, Medicaid status, and links to all coverage resources. When you're ready to compare specific plans, premiums, and costs, visit the ${stateName} plan comparison page for detailed county-level data.`,
    },
    {
      question: `When is Open Enrollment for ${stateName} health insurance?`,
      answer: `Open Enrollment for ${PLAN_YEAR} coverage typically runs from November 1 through ${exchange === 'Healthcare.gov' ? 'January 15' : 'mid-January (check your state exchange for exact dates)'}. To have coverage start January 1, you generally need to enroll by December 15. Special Enrollment Periods are available year-round for qualifying life events like losing coverage, getting married, or having a child.`,
    },
  ]
}

// ---------------------------------------------------------------------------
// County data helpers
// ---------------------------------------------------------------------------

interface CountyInfo {
  fips: string
  name: string
  slug: string
}

function getCountiesForState(stateAbbr: string): CountyInfo[] {
  const code = stateAbbr.toUpperCase()
  const combos = getAllStateCountyCombos().filter(
    (c) => c.state === code.toLowerCase(),
  )

  const counties: CountyInfo[] = []
  const seen = new Set<string>()
  for (const { county } of combos) {
    if (seen.has(county)) continue
    seen.add(county)
    const name = getCountyName(county)
    if (!name) continue
    counties.push({
      fips: county,
      name,
      slug: getCountySlug(county),
    })
  }

  // Sort alphabetically by name
  counties.sort((a, b) => a.name.localeCompare(b.name))
  return counties
}

// ---------------------------------------------------------------------------
// State config helpers
// ---------------------------------------------------------------------------

function getStateConfig(abbr: string): StateEntry | undefined {
  return (allStatesData.states as StateEntry[]).find(
    (s) => s.abbr === abbr.toUpperCase(),
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function StateDetailPage({ params }: Props) {
  const entry = await getCollectionEntry<StateFrontmatter>('states', params.state)
  if (!entry) notFound()

  const { title, description, stateName, stateAbbr, exchange, dateModified, faqs } =
    entry.frontmatter
  const slug = params.state
  const stateConfig = getStateConfig(stateAbbr)
  const stateSlug = stateCodeToSlug(stateAbbr)

  // County data for discovery section
  const counties = getCountiesForState(stateAbbr)
  const COUNTY_DISPLAY_LIMIT = 24
  const displayCounties = counties.slice(0, COUNTY_DISPLAY_LIMIT)
  const hasMoreCounties = counties.length > COUNTY_DISPLAY_LIMIT

  // Combine frontmatter FAQs with hub-level FAQs
  const hubFaqs = buildHubFAQs(
    stateName,
    stateAbbr,
    exchange,
    stateConfig?.medicaidExpanded,
    stateSlug,
  )
  const allFaqs = [...(faqs ?? []), ...hubFaqs]

  // ---- Schema ----
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'States', url: '/states' },
    { name: stateName, url: `/states/${slug}` },
  ]

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'States', url: `${SITE_URL}/states` },
    { name: stateName, url: `${SITE_URL}/states/${slug}` },
  ])

  const webPageSchema = buildMedicalWebPageSchema({
    name: `Health Insurance in ${stateName} (${PLAN_YEAR} Guide)`,
    description: `Informational overview of health insurance options, subsidies, and marketplace resources in ${stateName} for ${PLAN_YEAR}.`,
    url: `${SITE_URL}/states/${slug}`,
    dateModified: dateModified ?? new Date().toISOString().slice(0, 10),
    medicalAudience: 'Patient',
    speakableCssSelectors: ['h1', '#state-snapshot', '#hub-faqs'],
  })

  const faqSchemaData = allFaqs.length > 0 ? buildFAQSchema(allFaqs) : null

  // ---- Resource links for this state ----
  const stateResourceLinks = [
    {
      href: `/${stateSlug}/health-insurance-plans`,
      label: `Compare ${PLAN_YEAR} ${stateName} Plans`,
      description: 'Browse plans by county, metal tier, carrier, and premium',
    },
    {
      href: `/subsidies/${stateAbbr.toLowerCase()}`,
      label: `${stateName} Subsidy Estimates`,
      description: 'APTC estimates by county and income level',
    },
    {
      href: `/rates/${stateAbbr.toLowerCase()}`,
      label: `${stateName} Premium Rates`,
      description: 'County-level premium averages and rate trends',
    },
    {
      href: `/enhanced-credits/${stateAbbr.toLowerCase()}`,
      label: `${stateName} Enhanced Credits Impact`,
      description: 'What happens if IRA enhanced subsidies expire',
    },
    {
      href: `/dental/${stateAbbr.toLowerCase()}`,
      label: `${stateName} Dental Plans`,
      description: 'Stand-alone dental plan options and coverage',
    },
  ]

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={webPageSchema} id="webpage-schema" />
      {faqSchemaData && <SchemaScript schema={faqSchemaData} id="faq-schema" />}
      <LlmComment
        pageType="state-overview-hub"
        state={stateAbbr}
        exchange={exchange}
        extra={{
          intent: 'informational',
          counties: counties.length,
          medicaidExpanded: stateConfig?.medicaidExpanded ?? false,
        }}
      />

      <Breadcrumbs items={breadcrumbs} />

      {/* ── 1. HERO / INTRO ── */}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-3">
          Health Insurance in {stateName}: {PLAN_YEAR} Overview
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-4">
          Your starting point for understanding health insurance options in{' '}
          {stateName} — marketplace type, Medicaid status, subsidy resources, and
          links to county-level plan data.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
            {stateAbbr}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
            {exchange}
          </span>
          {stateConfig?.medicaidExpanded !== undefined && (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                stateConfig.medicaidExpanded
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              Medicaid {stateConfig.medicaidExpanded ? 'Expanded' : 'Not Expanded'}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Last updated {dateModified} &middot; Plan year {PLAN_YEAR}
        </p>
      </header>

      <AnswerBox answer={description} />

      {/* ── 2. STATE SNAPSHOT ── */}
      <section id="state-snapshot" className="my-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {stateName} at a Glance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Marketplace
            </p>
            <p className="text-base font-medium text-slate-800">{exchange}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stateConfig?.ownExchange
                ? 'State-based exchange'
                : 'Federal exchange (Healthcare.gov)'}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Medicaid Expansion
            </p>
            <p className="text-base font-medium text-slate-800">
              {stateConfig?.medicaidExpanded === true
                ? 'Expanded'
                : stateConfig?.medicaidExpanded === false
                  ? 'Not Expanded'
                  : 'Check state resources'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stateConfig?.medicaidExpanded
                ? 'Adults up to 138% FPL may qualify'
                : 'Coverage gap may affect low-income adults'}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Counties with Plan Data
            </p>
            <p className="text-base font-medium text-slate-800">
              {counties.length > 0
                ? `${counties.length} ${counties.length === 1 ? 'county' : 'counties'}`
                : 'State-level data available'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {counties.length > 0
                ? 'Browse county-level plans and premiums below'
                : 'See plan comparison page for details'}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Source: CMS Public Use Files, {PLAN_YEAR} plan year
        </p>
      </section>

      {/* ── 3. WHAT THIS PAGE HELPS WITH ── */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          What This Page Helps With
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              icon: '📋',
              text: `Understanding how health insurance works in ${stateName}`,
            },
            {
              icon: '💰',
              text: 'Reviewing costs, subsidies, and financial assistance options',
            },
            {
              icon: '🗺️',
              text: 'Finding county-level plan and premium data',
            },
            {
              icon: '🔗',
              text: `Navigating to the ${stateName} plan comparison page`,
            },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-start gap-3 bg-slate-50 rounded-xl p-4"
            >
              <span className="text-lg shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              <p className="text-sm text-slate-700">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. PRIMARY CTA TO COMMERCIAL PAGE ── */}
      <section className="my-10 rounded-2xl bg-primary-50 border border-primary-200 p-6 sm:p-8 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
          Ready to Compare {stateName} Health Insurance Plans?
        </h2>
        <p className="text-sm text-slate-600 mb-5 max-w-lg mx-auto">
          View {PLAN_YEAR} marketplace plans, premiums by age and metal tier,
          carrier options, and subsidy estimates — broken down by county.
        </p>
        <Link
          href={`/${stateSlug}/health-insurance-plans`}
          className="inline-block px-8 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg shadow-sm hover:shadow-md transition-all duration-200"
        >
          Compare {stateName} Plans for {PLAN_YEAR}
        </Link>
      </section>

      {/* ── Markdown body content ── */}
      <div
        className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-primary-600 hover:prose-a:text-primary-700 font-serif mb-8"
        dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
      />

      {/* ── 5. STATE RESOURCE GRID ── */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {stateName} Coverage Resources
        </h2>
        <p className="text-sm text-slate-600 mb-5">
          Explore detailed {PLAN_YEAR} health insurance data for {stateName} across
          these topics:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stateResourceLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group block bg-white border border-slate-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <p className="text-sm font-semibold text-primary-700 group-hover:text-primary-800 mb-1">
                {link.label}
              </p>
              <p className="text-xs text-slate-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 6. COUNTY DISCOVERY ── */}
      {counties.length > 0 && (
        <section className="my-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Browse {stateName} Counties
          </h2>
          <p className="text-sm text-slate-600 mb-5">
            Health insurance plans and premiums vary by county. Select a county to
            see local plan options, premium rates, and subsidy estimates.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayCounties.map((county) => (
              <Link
                key={county.fips}
                href={`/${stateSlug}/${county.slug}`}
                className="block p-3 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors text-center"
              >
                <span className="text-sm font-medium text-primary-700">
                  {county.name}
                </span>
              </Link>
            ))}
          </div>
          {hasMoreCounties && (
            <p className="mt-4 text-sm text-slate-500">
              Showing {COUNTY_DISPLAY_LIMIT} of {counties.length} counties.{' '}
              <Link
                href={`/${stateSlug}/health-insurance-plans`}
                className="text-primary-600 hover:text-primary-700 underline"
              >
                View all {stateName} counties
              </Link>
            </p>
          )}
        </section>
      )}

      {/* ── 7. FAQ SECTION ── */}
      <section id="hub-faqs" className="my-10">
        <FAQSection faqs={allFaqs} />
      </section>

      {/* ── 8. RELATED GUIDES & TOOLS ── */}
      <section className="my-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Guides &amp; Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/guides/how-aca-subsidies-work-2026"
            className="group flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-primary-300 transition-colors"
          >
            <span className="text-lg shrink-0" aria-hidden="true">📖</span>
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700">
                How ACA Subsidies Work in {PLAN_YEAR}
              </p>
              <p className="text-xs text-slate-500">
                Premium tax credits, cost-sharing reductions, and eligibility
              </p>
            </div>
          </Link>
          <Link
            href="/tools/income-savings-calculator"
            className="group flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-primary-300 transition-colors"
          >
            <span className="text-lg shrink-0" aria-hidden="true">🧮</span>
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700">
                Savings Estimator
              </p>
              <p className="text-xs text-slate-500">
                Estimate your premium tax credit based on income
              </p>
            </div>
          </Link>
          <Link
            href="/guides/open-enrollment-2026"
            className="group flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-primary-300 transition-colors"
          >
            <span className="text-lg shrink-0" aria-hidden="true">📅</span>
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700">
                Open Enrollment Guide {PLAN_YEAR}
              </p>
              <p className="text-xs text-slate-500">
                Key dates, deadlines, and how to enroll
              </p>
            </div>
          </Link>
          <Link
            href="/life-events"
            className="group flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-primary-300 transition-colors"
          >
            <span className="text-lg shrink-0" aria-hidden="true">🔄</span>
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700">
                Life Events &amp; Special Enrollment
              </p>
              <p className="text-xs text-slate-500">
                Lost coverage, got married, or had a baby?
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ── CTA (secondary — external enrollment) ── */}
      <div className="mt-12 rounded-2xl bg-white border border-slate-200 shadow-sm p-8 sm:p-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">
          Need Help Enrolling in {stateName}?
        </h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
          Compare plans first on our{' '}
          <Link
            href={`/${stateSlug}/health-insurance-plans`}
            className="text-primary-600 hover:text-primary-700 underline"
          >
            {stateName} plan comparison page
          </Link>
          , or continue to a licensed enrollment platform.
        </p>
        <a
          href="https://applyhealthinsuranceonline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-base shadow-sm hover:shadow-md transition-all duration-200"
        >
          Continue to Licensed Enrollment
        </a>
        <p className="mt-3 text-xs text-slate-400 max-w-md mx-auto">
          You are leaving HealthInsuranceRenew.com and entering a separate
          enrollment platform operated by licensed agents.
        </p>
      </div>

      <GenericByline dataSource="CMS Public Use Files" planYear={PLAN_YEAR} />

      <SourcesBox
        sources={[
          {
            title: 'CMS Public Use Files',
            url: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
          },
          { title: 'Healthcare.gov', url: 'https://www.healthcare.gov/' },
          ...(stateConfig?.ownExchange && stateConfig.exchangeUrl
            ? [{ title: exchange, url: stateConfig.exchangeUrl }]
            : []),
          {
            title: `${stateName} Marketplace Info`,
            url: 'https://www.healthcare.gov/marketplace-in-your-state/',
          },
        ]}
      />
    </article>
  )
}
