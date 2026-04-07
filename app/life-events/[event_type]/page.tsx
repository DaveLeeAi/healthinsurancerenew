// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLifeEventBySlug, getAllLifeEventParams, loadLifeEvents } from '@/lib/data-loader'
import { buildLifeEventHowToSchema, buildBreadcrumbSchema, buildWebPageSchema, buildFAQSchema } from '@/lib/schema-markup'
import { getRelatedEntities } from '@/lib/entity-linker'
import SchemaScript from '@/components/SchemaScript'
import EntityLinkCard from '@/components/EntityLinkCard'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import { generateLifeEventContent } from '@/lib/content-templates'
import SEPDecisionTree from '@/components/SEPDecisionTree'

// ─── Params ───────────────────────────────────────────────────────────────────

interface Props {
  params: { event_type: string }
}

export async function generateStaticParams() {
  return getAllLifeEventParams()
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = getLifeEventBySlug(params.event_type)
  if (!event) return { title: 'Life Event Not Found' }

  const windowLabel = event.sep_details.window_days
    ? `${event.sep_details.window_days}-day SEP window`
    : 'Special enrollment rules apply'

  const title = `${event.title} — Do You Qualify for Special Enrollment? | SEP Guide 2026`
  const description = `${event.trigger_description} ${windowLabel}. Step-by-step guide: documentation needed, key deadlines, decision tree, and common mistakes to avoid.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://healthinsurancerenew.com/life-events/${event.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://healthinsurancerenew.com/life-events/${event.slug}`,
      type: 'article',
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

// ─── Breadcrumb helper ────────────────────────────────────────────────────────

function Breadcrumbs({ eventTitle }: { eventTitle: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-neutral-400 mb-6">
      <ol className="flex items-center gap-1.5">
        <li>
          <a href="/" className="hover:text-primary-600 transition-colors">Home</a>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <a href="/life-events" className="hover:text-primary-600 transition-colors">Life Events</a>
        </li>
        <li aria-hidden="true">/</li>
        <li className="text-neutral-600 font-medium truncate max-w-[200px] sm:max-w-none">{eventTitle}</li>
      </ol>
    </nav>
  )
}

// ─── Category badge ───────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  coverage_loss:         { bg: 'bg-red-50',    text: 'text-red-700' },
  household_change:      { bg: 'bg-blue-50',   text: 'text-blue-700' },
  new_coverage_eligible: { bg: 'bg-green-50',  text: 'text-green-700' },
  coverage_change:       { bg: 'bg-orange-50', text: 'text-orange-700' },
  eligibility_change:    { bg: 'bg-purple-50', text: 'text-purple-700' },
}

const CATEGORY_LABELS: Record<string, string> = {
  coverage_loss:         'Loss of Coverage',
  household_change:      'Household Change',
  new_coverage_eligible: 'New Coverage Eligible',
  coverage_change:       'Coverage Change',
  eligibility_change:    'Eligibility Change',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LifeEventPage({ params }: Props) {
  const event = getLifeEventBySlug(params.event_type)
  if (!event) notFound()

  const dataset = loadLifeEvents()

  // Schema
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://healthinsurancerenew.com' },
    { name: 'Life Events', url: 'https://healthinsurancerenew.com/life-events' },
    { name: event.title, url: `https://healthinsurancerenew.com/life-events/${event.slug}` },
  ])

  const howToSchema = buildLifeEventHowToSchema({ event })

  const webPageSchema = buildWebPageSchema({
    name: `${event.title} — Special Enrollment Period Guide 2026`,
    description: `${event.trigger_description} Step-by-step guide: documentation needed, key deadlines, decision tree.`,
    url: `https://healthinsurancerenew.com/life-events/${event.slug}`,
    dateModified: new Date().toISOString().split('T')[0],
    speakableCssSelectors: ['h1', '#faq-heading'],
  })

  const faqItems = (event.content_page_data?.faq_questions ?? []).map((q) => ({
    question: q,
    answer: 'For detailed guidance on this question, review the decision tree and timeline sections above, or contact a licensed agent for personalized assistance.',
  }))
  const faqSchema = faqItems.length > 0 ? buildFAQSchema(faqItems) : null

  // Editorial content
  const editorial = generateLifeEventContent({ event })

  // Entity links
  const entityLinks = getRelatedEntities({
    pageType: 'life-event',
    slug: event.slug,
    title: event.title,
    category: event.category,
    sepWindowDays: event.sep_details.window_days ?? 60,
  })

  // Category styling
  const catColors = CATEGORY_COLORS[event.category] ?? { bg: 'bg-neutral-100', text: 'text-neutral-600' }
  const catLabel = CATEGORY_LABELS[event.category] ?? event.category.replace(/_/g, ' ')

  const windowDays = event.sep_details.window_days

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={webPageSchema} id="webpage-schema" />
      <SchemaScript schema={howToSchema} id="howto-schema" />
      {faqSchema && <SchemaScript schema={faqSchema} id="faq-schema" />}
      <LlmComment
        pageType="life-event"
        data="editorial"
        extra={{ event: event.slug, category: event.category }}
      />

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <Breadcrumbs eventTitle={event.title} />

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <span className={`inline-block text-[11px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full ${catColors.bg} ${catColors.text}`}>
          {catLabel}
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mt-3 mb-3 leading-tight">
          {event.title} — Special Enrollment Period Guide 2026
        </h1>

        {/* ── SEP Quick Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-federal-50 border border-federal-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-federal-800">{windowDays ?? '7 mo'}</div>
            <div className="text-[11px] text-federal-600 font-medium uppercase tracking-wide mt-0.5">
              {windowDays ? 'Day Window' : 'IEP Window'}
            </div>
          </div>
          <div className="bg-federal-50 border border-federal-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-federal-800">
              {event.sep_details.marketplace_eligible !== false ? 'Yes' : 'No'}
            </div>
            <div className="text-[11px] text-federal-600 font-medium uppercase tracking-wide mt-0.5">
              Marketplace
            </div>
          </div>
          <div className="bg-federal-50 border border-federal-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-federal-800">
              {event.sep_details.medicaid_eligible !== false ? 'Yes' : 'No'}
            </div>
            <div className="text-[11px] text-federal-600 font-medium uppercase tracking-wide mt-0.5">
              Medicaid
            </div>
          </div>
          <div className="bg-federal-50 border border-federal-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-federal-800">
              {event.sep_details.retroactive_coverage ? 'Yes' : 'No'}
            </div>
            <div className="text-[11px] text-federal-600 font-medium uppercase tracking-wide mt-0.5">
              Retroactive
            </div>
          </div>
        </div>

        {/* ── Do You Qualify? Intro ────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-navy-800 mb-3">Do You Qualify?</h2>
          <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
            <p className="text-neutral-700 leading-relaxed">
              {event.trigger_description}
            </p>
            <div className="text-sm text-neutral-600 space-y-1.5">
              <p>
                <span className="font-semibold text-navy-700">SEP Type:</span>{' '}
                {event.sep_details.sep_type}
              </p>
              {event.sep_details.window_start && (
                <p>
                  <span className="font-semibold text-navy-700">Window Starts:</span>{' '}
                  {event.sep_details.window_start}
                </p>
              )}
              {event.sep_details.notes && (
                <p className="text-neutral-500 italic text-xs mt-2">{event.sep_details.notes}</p>
              )}
              {event.sep_details.retroactive_notes && (
                <p className="bg-trust-50 border border-trust-200 rounded-lg px-3 py-2 text-trust-800 text-xs mt-2">
                  {event.sep_details.retroactive_notes}
                </p>
              )}
              {event.sep_details.medicare_iep_note && (
                <p className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-800 text-xs mt-2">
                  {event.sep_details.medicare_iep_note}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Interactive Decision Tree ────────────────────────────── */}
        {event.decision_tree && event.decision_tree.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-navy-800 mb-2">What Should You Do?</h2>
            <p className="text-sm text-neutral-500 mb-4">
              Answer each question to get personalized guidance for your situation.
            </p>
            <SEPDecisionTree
              nodes={event.decision_tree}
              eventTitle={event.title}
            />
          </section>
        )}

        {/* ── Important Deadlines ──────────────────────────────────── */}
        {event.key_deadlines && event.key_deadlines.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-navy-800 mb-4">Important Deadlines</h2>
            <div className="border border-amber-200 bg-amber-50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-amber-100 border-b border-amber-200">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                  Don&apos;t miss these dates
                </span>
              </div>
              <div className="divide-y divide-amber-100">
                {event.key_deadlines.map((dl, i) => (
                  <div key={i} className="px-4 py-3 flex gap-4">
                    <div className="flex-shrink-0 w-28">
                      <span className="text-sm font-bold text-amber-900">{dl.deadline}</span>
                    </div>
                    <div className="text-sm text-amber-800">{dl.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Timeline ─────────────────────────────────────────────── */}
        {event.timeline_days && Object.keys(event.timeline_days).length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-navy-800 mb-4">Your Timeline</h2>
            <div className="space-y-4">
              {Object.entries(event.timeline_days).map(([phase, steps]) => (
                <div key={phase} className="border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">
                    <h3 className="text-xs font-semibold text-navy-700 uppercase tracking-wide">
                      {phase.replace(/_/g, ' ')}
                    </h3>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {Object.entries(steps).map(([timeLabel, action]) => (
                      <div key={timeLabel} className="px-4 py-3 flex gap-4 items-start">
                        <span className="flex-shrink-0 text-xs font-medium text-neutral-400 w-28 pt-0.5">
                          {timeLabel.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-neutral-700 leading-relaxed">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── What You Need to Enroll ──────────────────────────────── */}
        {event.documentation_needed && event.documentation_needed.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-navy-800 mb-3">What You Need to Enroll</h2>
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <ul className="space-y-2.5">
                {event.documentation_needed.map((doc, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                    <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded bg-federal-100 text-federal-700 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <span className="leading-relaxed">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Common Mistakes ──────────────────────────────────────── */}
        {event.consumer_mistakes && event.consumer_mistakes.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-navy-800 mb-3">Common Mistakes to Avoid</h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <ul className="space-y-3">
                {event.consumer_mistakes.map((mistake, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-red-800">
                    <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-200 text-red-700 flex items-center justify-center text-xs font-bold">
                      !
                    </span>
                    <span className="leading-relaxed">{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── State-Specific Rules ─────────────────────────────────── */}
        {event.state_specific_rules && Object.keys(event.state_specific_rules).length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-navy-800 mb-3">State-Specific Rules</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
              {Object.entries(event.state_specific_rules).map(([rule, detail]) => (
                <div key={rule}>
                  <h3 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                    {rule.replace(/_/g, ' ')}
                  </h3>
                  {typeof detail === 'string' ? (
                    <p className="text-sm text-blue-700 leading-relaxed">{detail}</p>
                  ) : (
                    <ul className="space-y-1 text-sm text-blue-700">
                      {Object.entries(detail as Record<string, string>)
                        .filter(([k]) => k !== 'note')
                        .map(([state, val]) => (
                          <li key={state}>
                            <span className="font-medium">{state}:</span> {val}
                          </li>
                        ))}
                      {(detail as Record<string, string>).note && (
                        <li className="text-xs text-blue-500 mt-1 italic">
                          {(detail as Record<string, string>).note}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ Questions ────────────────────────────────────────── */}
        {event.content_page_data?.faq_questions && event.content_page_data.faq_questions.length > 0 && (
          <section className="mb-10">
            <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-3">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {event.content_page_data.faq_questions.map((q, i) => (
                <details key={i} className="group border border-neutral-200 rounded-lg">
                  <summary className="px-4 py-3 text-sm font-medium text-navy-700 cursor-pointer hover:bg-neutral-50 transition-colors list-none flex items-center justify-between">
                    <span>{q}</span>
                    <svg
                      className="w-4 h-4 text-neutral-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-3 text-sm text-neutral-600">
                    <p>
                      For detailed guidance on this question, review the decision tree and timeline sections above,
                      or contact a licensed agent for personalized assistance.
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ── Editorial content ── */}
        <section className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }} />

        {/* ── Entity Links ─────────────────────────────────────────── */}
        <EntityLinkCard
          links={entityLinks}
          title="Related Resources"
          variant="bottom"
        />

        <GenericByline dataSource="HealthInsuranceRenew editorial team" />

        {/* ── Medical Disclaimer ───────────────────────────────────── */}
        <footer className="mt-6 pt-4 border-t border-neutral-100">
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            {dataset.metadata.disclaimer ??
              'For informational purposes only. Individual situations vary. Consult a licensed insurance agent.'}
          </p>
        </footer>
      </main>
    </>
  )
}
