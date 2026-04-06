// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { loadFrictionQA, getFrictionQAByCategory } from '@/lib/data-loader'
import { buildFAQSchema, buildBreadcrumbSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'

const SITE_URL = 'https://healthinsurancerenew.com'

const CATEGORY_META: Record<string, { label: string; description: string }> = {
  turning_26: {
    label: 'Turning 26',
    description:
      'Everything you need to know about aging off a parent\'s health insurance plan at 26 — SEP deadlines, COBRA vs Marketplace, state extensions, and more.',
  },
  medicare_65: {
    label: 'Medicare at 65',
    description:
      'Navigating the transition from employer or Marketplace coverage to Medicare — Part B enrollment, late penalties, HSA contribution rules, and spousal coverage.',
  },
  sep_triggers: {
    label: 'Special Enrollment Periods',
    description:
      'What qualifies as a Special Enrollment Period, documentation requirements, 60-day windows, and how to avoid coverage gaps between qualifying events.',
  },
  immigration_dmi: {
    label: 'Immigration & Coverage',
    description:
      'ACA eligibility for immigrants, Data Matching Issues (DMI), visa-based coverage options, DACA alternatives, and citizenship verification.',
  },
  income_changes: {
    label: 'Income Changes & Subsidies',
    description:
      'How income changes affect your APTC subsidy — reconciliation, MAGI calculation, self-employment income, the 400% FPL cliff, and reporting requirements.',
  },
  employer_offer_adequacy: {
    label: 'Employer Coverage',
    description:
      'When employer health insurance doesn\'t meet ACA affordability or minimum value standards — and when you can still qualify for Marketplace subsidies.',
  },
  dental_surprises: {
    label: 'Dental Coverage',
    description:
      'Common dental insurance surprises — waiting periods, annual maximums, pediatric vs adult coverage, implant exclusions, and network tier differences.',
  },
  billing_scenarios: {
    label: 'Billing & Claims',
    description:
      'Understanding health insurance billing — preventive visit charges, surprise bills, lab billing, split diagnoses, and the No Surprises Act.',
  },
  prior_authorization: {
    label: 'Prior Authorization',
    description:
      'How prior authorization works, your appeal rights, step therapy requirements, urgent reviews, and what to do when PA is denied.',
  },
}

interface Props {
  params: { category: string }
}

// ---------------------------------------------------------------------------
// Static params — 9 categories
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const dataset = loadFrictionQA()
  const categories = new Set(dataset.data.map((q) => q.category))
  return [...categories].map((category) => ({ category }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const meta = CATEGORY_META[params.category]
  const label = meta?.label ?? params.category.replace(/_/g, ' ')
  const questions = getFrictionQAByCategory(params.category)
  const canonicalUrl = `${SITE_URL}/faq/${params.category}`

  const title = `${label} — Health Insurance FAQ | HealthInsuranceRenew`
  const description = meta?.description
    ?? `${questions.length} frequently asked questions about ${label.toLowerCase()} in marketplace health insurance.`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
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

export default function FAQCategoryPage({ params }: Props) {
  const questions = getFrictionQAByCategory(params.category)
  const meta = CATEGORY_META[params.category]
  const label = meta?.label ?? params.category.replace(/_/g, ' ')
  const description = meta?.description ?? ''

  // Schema
  const canonicalUrl = `${SITE_URL}/faq/${params.category}`

  const faqSchema = buildFAQSchema(
    questions.map((q) => ({ question: q.question, answer: q.answer }))
  )

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'FAQ', url: `${SITE_URL}/faq` },
    { name: label, url: canonicalUrl },
  ])

  if (questions.length === 0) {
    return (
      <>
        <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
        <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
          <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <a href="/" className="hover:underline text-primary-600">Home</a>
              </li>
              <li aria-hidden="true" className="text-neutral-300">›</li>
              <li>
                <a href="/faq" className="hover:underline text-primary-600">FAQ</a>
              </li>
              <li aria-hidden="true" className="text-neutral-300">›</li>
              <li aria-current="page" className="text-neutral-700 font-medium">{label}</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-navy-900">{label}</h1>
          <p className="text-neutral-500">
            No questions found in this category.{' '}
            <a href="/faq" className="text-primary-600 hover:underline">
              Browse all categories →
            </a>
          </p>
        </main>
      </>
    )
  }

  // Count state-specific questions
  const stateSpecificCount = questions.filter((q) => q.state_specific).length

  return (
    <>
      <SchemaScript schema={faqSchema} id="faq-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <LlmComment
        pageType="faq-category"
        data="editorial"
        extra={{ category: params.category, questions: questions.length }}
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
            <li aria-current="page" className="text-neutral-700 font-medium">
              {label}
            </li>
          </ol>
        </nav>

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">{label}</h1>
          <p className="text-neutral-600 text-lg leading-relaxed">
            {description}
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
            {stateSpecificCount > 0 && (
              <> · {stateSpecificCount} with state-specific variations</>
            )}
          </p>
        </section>

        {/* ── Question list ── */}
        <section aria-labelledby="questions-heading">
          <h2 id="questions-heading" className="sr-only">
            Questions in {label}
          </h2>
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q.id}>
                <a
                  href={`/faq/${q.category}/${q.id}`}
                  className="block px-5 py-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                >
                  <div className="font-medium text-navy-800 group-hover:text-primary-800 mb-1">
                    {q.question}
                  </div>
                  <div className="text-xs text-neutral-500 line-clamp-2">
                    {q.answer.slice(0, 120)}…
                  </div>
                  <div className="flex gap-2 mt-2">
                    {q.state_specific && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                        State-specific
                      </span>
                    )}
                    {q.regulatory_citation && (
                      <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">
                        Cites regulation
                      </span>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Back to all categories ── */}
        <div>
          <a
            href="/faq"
            className="text-sm text-primary-600 hover:underline font-medium"
          >
            ← Browse all FAQ categories
          </a>
        </div>

        <GenericByline dataSource="HealthInsuranceRenew editorial team" />

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
