// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { loadFrictionQA, getFrictionQABySlug, getFrictionQAByCategory } from '@/lib/data-loader'
import { getRelatedEntities } from '@/lib/entity-linker'
import { buildFAQSchema, buildBreadcrumbSchema, buildArticleSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import EntityLinkCard from '@/components/EntityLinkCard'
import GenericByline from '@/components/GenericByline'
import GlobalCTA from '@/components/GlobalCTA'
import LlmComment from '@/components/LlmComment'

const SITE_URL = 'https://healthinsurancerenew.com'

const CATEGORY_LABELS: Record<string, string> = {
  turning_26: 'Turning 26',
  medicare_65: 'Medicare at 65',
  sep_triggers: 'Special Enrollment Periods',
  immigration_dmi: 'Immigration & Coverage',
  income_changes: 'Income Changes & Subsidies',
  employer_offer_adequacy: 'Employer Coverage',
  dental_surprises: 'Dental Coverage',
  billing_scenarios: 'Billing & Claims',
  prior_authorization: 'Prior Authorization',
}

interface Props {
  params: { category: string; slug: string }
}

// ---------------------------------------------------------------------------
// Static params — 54 Q&As across 9 categories
// ---------------------------------------------------------------------------

export const revalidate = 86400

export async function generateStaticParams() {
  const dataset = loadFrictionQA()
  return dataset.data.map((q) => ({
    category: q.category,
    slug: q.id,
  }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const qa = getFrictionQABySlug(params.slug)
  if (!qa) return { title: 'FAQ Not Found' }

  const canonicalUrl = `${SITE_URL}/faq/${params.category}/${params.slug}`
  const title = `${qa.question} | Health Insurance FAQ`
  const description = qa.answer.slice(0, 155).replace(/\s+\S*$/, '…')

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

export default function FAQDetailPage({ params }: Props) {
  const qa = getFrictionQABySlug(params.slug)

  if (!qa) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-navy-900 mb-3">FAQ Not Found</h1>
        <p className="text-neutral-500">
          This question could not be found.{' '}
          <a href="/faq" className="text-primary-600 hover:underline">
            Browse all FAQ categories →
          </a>
        </p>
      </main>
    )
  }

  const categoryLabel = CATEGORY_LABELS[qa.category] ?? qa.category.replace(/_/g, ' ')

  // Related questions in the same category (excluding current)
  const relatedQuestions = getFrictionQAByCategory(qa.category).filter((q) => q.id !== qa.id)

  // Entity links — contextual to category
  const entityLinks = getRelatedEntities({
    pageType: 'faq',
    category: qa.category,
    slug: qa.id,
    question: qa.question,
    tags: qa.tags,
  })

  // Schema
  const canonicalUrl = `${SITE_URL}/faq/${params.category}/${params.slug}`

  const faqSchema = buildFAQSchema([{ question: qa.question, answer: qa.answer }])

  const articleSchema = buildArticleSchema({
    headline: qa.question,
    description: qa.answer.slice(0, 155),
    dateModified: '2026-03-15',
    dataSourceName: 'ACA regulations & federal enrollment guidance',
  })

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'FAQ', url: `${SITE_URL}/faq` },
    { name: categoryLabel, url: `${SITE_URL}/faq/${qa.category}` },
    { name: qa.question.slice(0, 60), url: canonicalUrl },
  ])

  // Split the answer into paragraphs for better readability
  const answerParagraphs = splitIntoParagraphs(qa.answer)

  return (
    <>
      <SchemaScript schema={faqSchema} id="faq-schema" />
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <LlmComment
        pageType="faq-detail"
        data="editorial"
        extra={{ category: qa.category, slug: qa.id }}
      />

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* ── Breadcrumbs ── */}
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
              <a href="/faq" className="hover:underline text-primary-600">
                FAQ
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">
              ›
            </li>
            <li>
              <a
                href={`/faq/${qa.category}`}
                className="hover:underline text-primary-600"
              >
                {categoryLabel}
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">
              ›
            </li>
            <li aria-current="page" className="text-neutral-700 font-medium truncate max-w-[200px]">
              {qa.question.slice(0, 50)}…
            </li>
          </ol>
        </nav>

        {/* ── Category badge ── */}
        <div>
          <a
            href={`/faq/${qa.category}`}
            className="inline-block text-xs uppercase tracking-widest text-primary-600 font-semibold hover:text-primary-800"
          >
            {categoryLabel}
          </a>
        </div>

        {/* ── H1: The question ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-6">{qa.question}</h1>

          {/* ── Answer ── */}
          <div className="space-y-4">
            {answerParagraphs.map((paragraph, i) => (
              <p key={i} className="text-neutral-700 text-lg leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* ── Regulatory citation ── */}
        {qa.regulatory_citation && (
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
              Regulatory Basis
            </div>
            <p className="text-sm text-neutral-600">{qa.regulatory_citation}</p>
          </div>
        )}

        {/* ── State-specific note ── */}
        {qa.state_specific && qa.state_notes && (
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
              State-Specific Variations
            </div>
            <p className="text-sm text-amber-800">{qa.state_notes}</p>
          </div>
        )}

        {/* ── Related Questions ── */}
        {relatedQuestions.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="text-xl font-semibold text-navy-800 mb-4"
            >
              Related Questions in {categoryLabel}
            </h2>
            <ul className="space-y-2">
              {relatedQuestions.map((rq) => (
                <li key={rq.id}>
                  <a
                    href={`/faq/${rq.category}/${rq.id}`}
                    className="block px-4 py-3 rounded-lg border border-neutral-100 hover:bg-primary-50 hover:border-primary-200 transition-colors text-sm text-neutral-700 hover:text-primary-800"
                  >
                    {rq.question}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Entity links ── */}
        <EntityLinkCard links={entityLinks} title="Related Resources" variant="bottom" />

        <GlobalCTA />

        <GenericByline dataSource="HealthInsuranceRenew editorial team" />

        {/* ── Disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            This information is for educational purposes only and does not constitute legal,
            tax, or insurance advice. ACA rules and state regulations change frequently.{' '}
            <strong>Consult a licensed health insurance agent</strong> to evaluate your
            specific situation and confirm eligibility.
          </p>
        </footer>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Split a long answer into 2–3 natural paragraphs at sentence boundaries.
 * If the answer is short, returns it as a single paragraph.
 */
function splitIntoParagraphs(text: string): string[] {
  // Split on sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g)
  if (!sentences || sentences.length <= 3) return [text]

  // Aim for ~3 paragraphs
  const perParagraph = Math.ceil(sentences.length / 3)
  const paragraphs: string[] = []
  for (let i = 0; i < sentences.length; i += perParagraph) {
    paragraphs.push(sentences.slice(i, i + perParagraph).join('').trim())
  }
  return paragraphs.filter((p) => p.length > 0)
}
