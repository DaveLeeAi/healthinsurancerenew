// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DRUG_TAXONOMY } from '@/lib/drug-linking'
import { buildArticleSchema, buildBreadcrumbSchema, buildFAQSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface Props {
  params: { category: string }
}

function getCategoryBySlug(slug: string) {
  return DRUG_TAXONOMY.find((c) => c.id === slug) ?? null
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function generateStaticParams() {
  return DRUG_TAXONOMY.map((c) => ({ category: c.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = getCategoryBySlug(params.category)
  if (!cat) return { title: 'Category Not Found' }

  const title = `${cat.label} Covered by Marketplace Plans (${PLAN_YEAR})`
  const description =
    `See which ${cat.label.toLowerCase()} are covered by ACA Marketplace (Obamacare) plans. ` +
    `Compare coverage status, cost tier, prior authorization, and plan availability for ${PLAN_YEAR}.`
  const canonicalUrl = `${SITE_URL}/drugs/categories/${params.category}`

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

export default function CategoryHubPage({ params }: Props) {
  const cat = getCategoryBySlug(params.category)
  if (!cat) notFound()

  const canonicalUrl = `${SITE_URL}/drugs/categories/${params.category}`

  const faqs = buildCategoryFAQs(cat.id, cat.label)

  const articleSchema = buildArticleSchema({
    headline: `${cat.label} Covered by Marketplace Plans (${PLAN_YEAR})`,
    description: cat.description,
    dateModified: new Date().toISOString().slice(0, 7),
    dataSourceName: 'CMS Machine-Readable Formulary PUF',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Drugs', url: `${SITE_URL}/drugs` },
    { name: cat.label, url: canonicalUrl },
  ])

  const faqSchema = buildFAQSchema(faqs)

  // Related categories (same tier / adjacent)
  const relatedCategories = DRUG_TAXONOMY
    .filter((c) => c.id !== cat.id)
    .slice(0, 4)

  return (
    <>
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />
      <LlmComment
        pageType="drug-category"
        year={PLAN_YEAR}
        data="CMS-MR-PUF"
        extra={{ category: cat.id, drugs: cat.drugs.length }}
      />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li><a href="/drugs" className="hover:underline text-primary-600">Drug Coverage</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{cat.label}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-2">
            Marketplace Drug Coverage · {PLAN_YEAR}
          </p>
          <h1 className="text-3xl font-bold text-navy-900 mb-1">
            {cat.label} Covered by Marketplace Plans ({PLAN_YEAR})
          </h1>
          <p className="text-xs text-slate-400 mb-3">
            Data snapshot: <time dateTime="2026-01-15">January 2026</time> · Plan year {PLAN_YEAR}
          </p>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            {cat.description}. Use the links below to check coverage status, cost tier,
            and prior authorization requirements for each medication on ACA Marketplace
            (Obamacare) plans.
          </p>
        </section>

        {/* Drug grid */}
        <section aria-labelledby="drugs-heading">
          <h2 id="drugs-heading" className="text-xl font-semibold text-navy-800 mb-5">
            Medications in This Category
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {cat.drugs.map((drug) => {
              const slug = drug.toLowerCase().replace(/\s+/g, '-')
              const displayName = titleCase(drug)
              return (
                <a
                  key={drug}
                  href={`/formulary/all/${slug}`}
                  className="group flex items-start gap-3 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <span className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full bg-primary-400 group-hover:bg-primary-600 transition-colors" />
                  <div>
                    <p className="font-semibold text-navy-900 group-hover:text-primary-700 transition-colors">
                      {displayName}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Check coverage &amp; tier →
                    </p>
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        {/* Coverage explainer */}
        <section
          aria-labelledby="coverage-explainer-heading"
          className="bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <h2
            id="coverage-explainer-heading"
            className="text-lg font-semibold text-blue-900 mb-3"
          >
            How Marketplace Plans Cover {cat.label}
          </h2>
          <div className="space-y-3 text-sm text-blue-800 leading-relaxed">
            <p>
              Marketplace (Obamacare) plans are required to cover prescription drugs, but each
              insurance company sets its own formulary — the list of covered medications and their cost
              tiers. Coverage for {cat.label.toLowerCase()} varies significantly across plans.
            </p>
            <p>
              <strong>What to look for:</strong> Check whether your medication is on a plan&apos;s
              formulary before enrolling. Key factors are the cost tier (generic, preferred brand,
              non-preferred brand, or specialty), and whether prior authorization or step therapy
              is required.
            </p>
            <p>
              <strong>If your drug isn&apos;t covered:</strong> You can request a formulary
              exception through your insurance company. Under federal law (45 C.F.R. § 156.122), plans
              must have a process for these appeals.
            </p>
          </div>
        </section>

        {/* Internal links to tools */}
        <section aria-labelledby="tools-heading">
          <h2 id="tools-heading" className="text-lg font-semibold text-navy-800 mb-4">
            Related Tools &amp; Resources
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {getRelatedTools(cat.id).map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                className="flex items-start gap-2 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 transition-colors"
              >
                <span className="text-primary-500 text-lg">{tool.icon}</span>
                <div>
                  <p className="text-sm font-medium text-navy-900">{tool.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{tool.context}</p>
                </div>
              </a>
            ))}
          </div>
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

        {/* Related categories */}
        <section aria-labelledby="related-cats-heading">
          <h2 id="related-cats-heading" className="text-lg font-semibold text-navy-800 mb-4">
            Other Drug Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedCategories.map((c) => (
              <a
                key={c.id}
                href={`/drugs/categories/${c.id}`}
                className="px-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded-full text-sm text-navy-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors"
              >
                {c.label}
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary-50 border border-primary-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-primary-900 mb-2">
            Need help choosing a plan that covers your {cat.label.toLowerCase()}?
          </h2>
          <p className="text-sm text-primary-700 mb-4">
            Compare Marketplace plans in your area. Search by drug, check formularies,
            and estimate your subsidy in minutes.
          </p>
          <a
            href="/plans"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Check Plans Near You
          </a>
        </section>

        <GenericByline dataSource="CMS MR-PUF & carrier formulary files" planYear={PLAN_YEAR} />

        {/* Disclaimer */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Drug coverage data sourced from the CMS Machine-Readable Formulary PUF, plan year {PLAN_YEAR}.
            Coverage status reflects issuer formulary filings and may not reflect real-time plan changes.
          </p>
          <p>
            This page is for informational purposes only and does not constitute medical or insurance advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> to evaluate your specific coverage
            options. Always verify formulary coverage directly with your plan before enrolling.
          </p>
        </footer>

      </main>
    </>
  )
}

// ── FAQ content ──────────────────────────────────────────────────────────────

interface FAQ { question: string; answer: string }

function buildCategoryFAQs(categoryId: string, categoryLabel: string): FAQ[] {
  const base: FAQ[] = [
    {
      question: `Are ${categoryLabel.toLowerCase()} covered by Marketplace (Obamacare) plans?`,
      answer: `Most Marketplace plans cover ${categoryLabel.toLowerCase()}, but coverage varies by plan. Each plan has its own formulary — the list of covered drugs. Some medications may require prior authorization or step therapy before coverage is approved. Check each drug's individual coverage page for plan-specific details.`,
    },
    {
      question: `What does "drug tier" mean for ${categoryLabel.toLowerCase()}?`,
      answer: `Plans divide medications into tiers that determine your cost. Tier 1 (generics) typically cost $5–$20 per month. Tier 2 (preferred brands) cost $30–$60. Tier 3 (non-preferred brands) cost $50–$100+. Tier 4 (specialty drugs) can cost hundreds per month, though cost-sharing reductions may apply. Lower-tier medications significantly reduce your annual prescription costs.`,
    },
    {
      question: `What is prior authorization for ${categoryLabel.toLowerCase()}?`,
      answer: `Prior authorization (PA) means your doctor must get approval from your insurance company before the plan will cover a medication. Your plan reviews whether the drug is medically necessary and whether you've tried lower-cost alternatives. PA is common for brand-name and specialty ${categoryLabel.toLowerCase()}. If PA is denied, you can appeal — your insurance company must provide an internal review process under federal law.`,
    },
    {
      question: `Can I appeal if my ${categoryLabel.toLowerCase()} isn't covered?`,
      answer: `Yes. Under the Affordable Care Act (45 C.F.R. § 156.122), you have the right to request a formulary exception if your medication isn't on your plan's formulary or if you disagree with its tier placement. Your doctor must document medical necessity. You can also request a step therapy exception if alternatives didn't work or aren't appropriate for your condition.`,
    },
    {
      question: `How do I find a Marketplace plan that covers my ${categoryLabel.toLowerCase()}?`,
      answer: `Use the drug search tool on this site to check coverage across Marketplace plans. During open enrollment (November 1 – January 15), compare plans using HealthCare.gov's plan finder and filter by your specific medications. Look for plans that place your drugs on the lowest possible tier. A licensed health insurance agent can help you compare formularies across all available plans in your area.`,
    },
  ]

  // Category-specific additional FAQ
  const extras: Record<string, FAQ> = {
    'weight-loss': {
      question: 'Are GLP-1 weight loss drugs like Ozempic and Wegovy covered by Marketplace plans?',
      answer: 'GLP-1 medications (Ozempic, Wegovy, Mounjaro, Zepbound) have highly variable coverage on Marketplace plans. Many plans cover them for diabetes (Ozempic, Mounjaro) but not for weight loss specifically (Wegovy, Zepbound). Coverage is improving but remains inconsistent. Check each drug\'s coverage page for current plan-level data. Some plans require prior authorization or step therapy.',
    },
    'diabetes': {
      question: 'Is insulin covered by Marketplace plans in 2026?',
      answer: 'Under the Inflation Reduction Act provisions applicable to ACA plans, out-of-pocket costs for insulin are capped at $35 per month per covered insulin product. Most Marketplace plans cover common insulin types (insulin glargine, NPH insulin, etc.) at Tier 1 or Tier 2. Check your plan\'s formulary for the specific insulin brand you use.',
    },
    'mental-health': {
      question: 'Are mental health medications covered the same as other drugs?',
      answer: 'Yes. Under the Mental Health Parity and Addiction Equity Act (MHPAEA), Marketplace plans must cover mental health and substance use disorder medications at parity with medical/surgical benefits. This means prior authorization and quantity limits for antidepressants, mood stabilizers, and anti-anxiety medications must be comparable to similar requirements for other drug categories.',
    },
  }

  const extra = extras[categoryId]
  if (extra) base.push(extra)

  return base
}

// ── Related tools ────────────────────────────────────────────────────────────

interface Tool { label: string; href: string; icon: string; context: string }

function getRelatedTools(categoryId: string): Tool[] {
  const common: Tool[] = [
    { label: 'Check drug coverage by state', href: '/drugs', icon: '🔍', context: 'Search 551,000+ medications across Marketplace plans' },
    { label: 'Compare plans in your area', href: '/plans', icon: '📋', context: 'Browse all Marketplace plans by state and county' },
    { label: 'Estimate your subsidy', href: '/subsidies', icon: '💰', context: 'See how much APTC you qualify for in 2026' },
    { label: 'Prior authorization explained', href: '/faq/prior_authorization/pa_001', icon: '📝', context: 'How to request PA and appeal a denial' },
  ]

  const extras: Record<string, Tool> = {
    'weight-loss': { label: 'Are GLP-1 drugs covered?', href: '/all/ozempic', icon: '💊', context: 'Ozempic, Wegovy, Mounjaro coverage comparison' },
    'diabetes': { label: 'Insulin cost cap explained', href: '/guides/how-aca-subsidies-work-2026', icon: '🩺', context: '$35/month insulin cap under ACA plans' },
    'mental-health': { label: 'Mental health parity rights', href: '/faq/aca-marketplace-basics', icon: '⚖️', context: 'Federal parity rules for mental health coverage' },
  }

  const extra = extras[categoryId]
  return extra ? [extra, ...common].slice(0, 4) : common.slice(0, 4)
}
