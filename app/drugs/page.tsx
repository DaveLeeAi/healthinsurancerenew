// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { DRUG_TAXONOMY } from '@/lib/drug-linking'
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

const title = `Drug Coverage on Marketplace Plans (${PLAN_YEAR}) — By Category`
const description =
  `Browse prescription drug coverage by category on ACA Marketplace (Obamacare) plans. ` +
  `Check which medications are covered, at what cost tier, and with what restrictions for ${PLAN_YEAR}.`

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/drugs` },
  openGraph: {
    type: 'website',
    title,
    description,
    url: `${SITE_URL}/drugs`,
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
  },
}

// High-priority comparison pairs for the homepage grid
const FEATURED_COMPARISONS = [
  { slug: 'metformin-vs-ozempic', label: 'Metformin vs Ozempic' },
  { slug: 'ozempic-vs-wegovy', label: 'Ozempic vs Wegovy' },
  { slug: 'ozempic-vs-mounjaro', label: 'Ozempic vs Mounjaro' },
  { slug: 'lisinopril-vs-losartan', label: 'Lisinopril vs Losartan' },
  { slug: 'atorvastatin-vs-rosuvastatin', label: 'Atorvastatin vs Rosuvastatin' },
  { slug: 'sertraline-vs-escitalopram', label: 'Sertraline vs Escitalopram' },
  { slug: 'eliquis-vs-xarelto', label: 'Eliquis vs Xarelto' },
  { slug: 'levothyroxine-vs-synthroid', label: 'Levothyroxine vs Synthroid' },
]

// Priority categories to show at top
const PRIORITY_CATEGORY_IDS = [
  'diabetes', 'weight-loss', 'blood-pressure', 'cholesterol',
  'mental-health', 'thyroid',
]

export default function DrugsIndexPage() {
  const priorityCategories = PRIORITY_CATEGORY_IDS.map(
    (id) => DRUG_TAXONOMY.find((c) => c.id === id)!
  ).filter(Boolean)

  const otherCategories = DRUG_TAXONOMY.filter(
    (c) => !PRIORITY_CATEGORY_IDS.includes(c.id)
  )

  const articleSchema = buildArticleSchema({
    headline: `Drug Coverage on Marketplace Plans (${PLAN_YEAR})`,
    description,
    dateModified: new Date().toISOString().slice(0, 7),
    dataSourceName: 'CMS Machine-Readable Formulary PUF',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Drug Coverage', url: `${SITE_URL}/drugs` },
  ])

  return (
    <>
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <LlmComment pageType="drugs-index" year={PLAN_YEAR} data="CMS-MR-Formulary-PUF" extra={{ categories: DRUG_TAXONOMY.length }} />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-12">

        {/* Hero */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-2">
            Marketplace Drug Coverage · {PLAN_YEAR}
          </p>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            Drug Coverage on Marketplace Plans ({PLAN_YEAR})
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            Browse prescription drug coverage by category. Each category page lists which
            medications are covered by ACA Marketplace (Obamacare) plans, their cost tier,
            and any prior authorization or step therapy requirements.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <a
              href="/formulary"
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Search a specific drug
            </a>
            <a
              href="/plans"
              className="px-5 py-2.5 border border-neutral-300 text-navy-700 rounded-xl text-sm font-semibold hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              Compare plans in your area
            </a>
          </div>
        </section>

        {/* Priority categories */}
        <section aria-labelledby="priority-cats-heading">
          <h2 id="priority-cats-heading" className="text-xl font-semibold text-navy-800 mb-5">
            Most Searched Drug Categories
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {priorityCategories.map((cat) => (
              <a
                key={cat.id}
                href={`/drugs/categories/${cat.id}`}
                className="group p-5 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
              >
                <h3 className="font-semibold text-navy-900 group-hover:text-primary-700 transition-colors mb-1">
                  {cat.label}
                </h3>
                <p className="text-sm text-neutral-500 mb-3">{cat.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.drugs.slice(0, 4).map((d) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-600"
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </span>
                  ))}
                  {cat.drugs.length > 4 && (
                    <span className="px-2 py-0.5 text-xs text-neutral-400">
                      +{cat.drugs.length - 4} more
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* All categories */}
        <section aria-labelledby="all-cats-heading">
          <h2 id="all-cats-heading" className="text-xl font-semibold text-navy-800 mb-5">
            All Drug Categories
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[...priorityCategories, ...otherCategories].map((cat) => (
              <a
                key={cat.id}
                href={`/drugs/categories/${cat.id}`}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group text-sm"
              >
                <span className="font-medium text-navy-900 group-hover:text-primary-700 transition-colors">
                  {cat.label}
                </span>
                <svg className="w-3.5 h-3.5 text-neutral-300 group-hover:text-primary-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </a>
            ))}
          </div>
        </section>

        {/* Comparisons */}
        <section aria-labelledby="comparisons-heading">
          <h2 id="comparisons-heading" className="text-xl font-semibold text-navy-800 mb-2">
            Drug Coverage Comparisons
          </h2>
          <p className="text-sm text-neutral-500 mb-5">
            Side-by-side coverage, tier, and prior authorization comparisons.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURED_COMPARISONS.map((cmp) => (
              <a
                key={cmp.slug}
                href={`/drugs/compare/${cmp.slug}`}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group text-sm"
              >
                <span className="font-medium text-navy-900 group-hover:text-primary-700 transition-colors">
                  {cmp.label}
                </span>
                <svg className="w-3.5 h-3.5 text-neutral-300 group-hover:text-primary-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </a>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          aria-labelledby="how-it-works-heading"
          className="bg-neutral-50 border border-neutral-200 rounded-xl p-6"
        >
          <h2 id="how-it-works-heading" className="text-lg font-semibold text-navy-800 mb-4">
            How Marketplace Drug Coverage Works
          </h2>
          <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
            <p>
              All Marketplace (Obamacare) plans are required to cover prescription drugs as an
              Essential Health Benefit, but each insurer decides which specific medications are
              covered and at what cost tier.
            </p>
            <p>
              <strong>Tiers</strong> determine your out-of-pocket cost: Tier 1 (generics, $5–$20/fill),
              Tier 2 (preferred brands, $30–$60), Tier 3 (non-preferred brands, $50–$100+), and
              Tier 4 (specialty drugs, often hundreds per fill).
            </p>
            <p>
              Some medications require <strong>prior authorization</strong> (insurer approval before
              you can fill) or <strong>step therapy</strong> (trying a lower-cost alternative first).
              You always have the right to appeal these restrictions.
            </p>
          </div>
        </section>

        <GenericByline dataSource="CMS Machine-Readable Formulary PUF" planYear={PLAN_YEAR} />

        {/* Disclaimer */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Drug coverage data sourced from the CMS Machine-Readable Formulary PUF, plan year {PLAN_YEAR}.
            Coverage reflects issuer formulary filings and is subject to change throughout the plan year.
          </p>
          <p>
            This site is for informational purposes only and does not constitute medical or insurance advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> to evaluate your specific
            coverage options. Verify formulary coverage directly with your insurer before enrolling.
          </p>
        </footer>

      </main>
    </>
  )
}
