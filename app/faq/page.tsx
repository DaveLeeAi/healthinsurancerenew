// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { loadFrictionQA } from '@/lib/data-loader'
import { buildFAQSchema, buildBreadcrumbSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'

const SITE_URL = 'https://healthinsurancerenew.com'

const CATEGORY_META: Record<string, { label: string; description: string; icon: string }> = {
  turning_26: {
    label: 'Turning 26',
    description: 'Aging off a parent\'s plan, SEP deadlines, COBRA vs Marketplace',
    icon: '🎂',
  },
  medicare_65: {
    label: 'Medicare at 65',
    description: 'Part B enrollment, late penalties, HSA rules, spousal coverage',
    icon: '🏥',
  },
  sep_triggers: {
    label: 'Special Enrollment Periods',
    description: 'Qualifying events, documentation, SEP windows, Medicaid transitions',
    icon: '📅',
  },
  immigration_dmi: {
    label: 'Immigration & Coverage',
    description: 'Data matching issues, visa eligibility, DACA options, citizenship verification',
    icon: '🌐',
  },
  income_changes: {
    label: 'Income Changes & Subsidies',
    description: 'APTC reconciliation, MAGI calculation, self-employment, 400% FPL cliff',
    icon: '💰',
  },
  employer_offer_adequacy: {
    label: 'Employer Coverage',
    description: 'Affordability test, minimum value, ICHRA, family glitch',
    icon: '🏢',
  },
  dental_surprises: {
    label: 'Dental Coverage',
    description: 'Waiting periods, annual maximums, pediatric vs adult dental, implants',
    icon: '🦷',
  },
  billing_scenarios: {
    label: 'Billing & Claims',
    description: 'Preventive visit billing, surprise bills, lab charges, split diagnoses',
    icon: '🧾',
  },
  prior_authorization: {
    label: 'Prior Authorization',
    description: 'PA requirements, appeals process, step therapy, urgent reviews',
    icon: '📋',
  },
}

export const metadata: Metadata = {
  title: 'Health Insurance FAQ — 54 Real Questions Answered | HealthInsuranceRenew',
  description:
    'Answers to the most common health insurance marketplace questions across 9 categories: turning 26, Medicare at 65, SEPs, income changes, dental, billing, and more. Based on ACA regulations and CMS guidance.',
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    type: 'website',
    title: 'Health Insurance FAQ — 54 Real Questions Answered',
    description:
      'Expert answers to real health insurance questions. Coverage transitions, subsidies, billing disputes, and more.',
    url: `${SITE_URL}/faq`,
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Health Insurance FAQ — 54 Real Questions Answered',
    description:
      'Expert answers to real health insurance questions. Coverage transitions, subsidies, billing disputes, and more.',
  },
}

export default function FAQIndexPage() {
  const dataset = loadFrictionQA()

  // Group by category
  const byCategory = new Map<string, typeof dataset.data>()
  for (const q of dataset.data) {
    if (!byCategory.has(q.category)) byCategory.set(q.category, [])
    byCategory.get(q.category)!.push(q)
  }

  // Build FAQ schema from top question per category
  const topFaqs = [...byCategory.entries()].map(([, questions]) => ({
    question: questions[0].question,
    answer: questions[0].answer,
  }))
  const faqSchema = buildFAQSchema(topFaqs)

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'FAQ', url: `${SITE_URL}/faq` },
  ])

  return (
    <>
      <SchemaScript schema={faqSchema} id="faq-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <LlmComment pageType="faq-index" year={2026} data="CMS-ACA-Regulations" extra={{ questions: dataset.data.length, categories: byCategory.size }} />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
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
            <li aria-current="page" className="text-neutral-700 font-medium">
              FAQ
            </li>
          </ol>
        </nav>

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            Health Insurance FAQ
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            <strong>{dataset.data.length}</strong> real questions about marketplace health
            insurance — also called Obamacare or the ACA — across{' '}
            <strong>{byCategory.size}</strong> categories. Answered with regulatory
            citations and practical guidance based on current CMS enrollment policy.
          </p>
        </section>

        {/* ── Category cards ── */}
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="sr-only">
            FAQ Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...byCategory.entries()].map(([category, questions]) => {
              const meta = CATEGORY_META[category]
              const label = meta?.label ?? category.replace(/_/g, ' ')
              const description = meta?.description ?? ''
              const icon = meta?.icon ?? '❓'

              return (
                <a
                  key={category}
                  href={`/faq/${category}`}
                  className="block p-5 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  <h3 className="font-semibold text-navy-800 group-hover:text-primary-800 mb-1">
                    {label}
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
                    {description}
                  </p>
                  <div className="text-xs font-medium text-primary-600">
                    {questions.length} question{questions.length !== 1 ? 's' : ''} →
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        {/* ── All questions by category ── */}
        <section aria-labelledby="all-questions-heading">
          <h2
            id="all-questions-heading"
            className="text-xl font-semibold text-navy-800 mb-6"
          >
            All Questions
          </h2>
          <div className="space-y-8">
            {[...byCategory.entries()].map(([category, questions]) => {
              const label =
                CATEGORY_META[category]?.label ?? category.replace(/_/g, ' ')

              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-navy-800 mb-3 pb-2 border-b border-neutral-100">
                    <a
                      href={`/faq/${category}`}
                      className="hover:text-primary-700"
                    >
                      {label}
                    </a>
                    <span className="ml-2 text-sm font-normal text-neutral-400">
                      {questions.length} questions
                    </span>
                  </h3>
                  <ul className="space-y-1">
                    {questions.map((q) => (
                      <li key={q.id}>
                        <a
                          href={`/faq/${q.category}/${q.id}`}
                          className="block px-4 py-3 rounded-lg hover:bg-neutral-50 hover:text-primary-700 transition-colors text-sm text-neutral-700"
                        >
                          {q.question}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-primary-50 border border-primary-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-2">
            Don&apos;t See Your Question?
          </h2>
          <p className="text-sm text-primary-700 leading-relaxed">
            As a licensed health insurance agent, I answer questions like these every day.
            Contact me for personalized guidance on your specific situation.
          </p>
        </section>

        <GenericByline dataSource="CMS ACA Regulations & Enrollment Policy" planYear={2026} />

        {/* ── Disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            This information is for educational purposes only and does not constitute
            legal, tax, or insurance advice. ACA rules and state regulations change
            frequently.{' '}
            <strong>Consult a licensed health insurance agent</strong> to evaluate your
            specific situation.
          </p>
        </footer>
      </main>
    </>
  )
}
