// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import { loadLifeEvents } from '@/lib/data-loader'
import { buildBreadcrumbSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'

const SITE_URL = 'https://healthinsurancerenew.com'

export const metadata: Metadata = {
  title: 'Life Events & Health Insurance — Special Enrollment Periods',
  description:
    'What happens to your health insurance after a life event? Special enrollment periods, deadlines, and next steps for turning 26, job loss, marriage, and more.',
  alternates: {
    canonical: `${SITE_URL}/life-events`,
  },
  openGraph: {
    type: 'website',
    title: 'Life Events & Health Insurance — Special Enrollment Periods',
    description:
      'Check SEP windows, deadlines, and documentation after job loss, marriage, turning 26, and other qualifying life events.',
    url: `${SITE_URL}/life-events`,
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Life Events & Health Insurance — Special Enrollment Periods',
    description:
      'Check SEP windows, deadlines, and documentation after job loss, marriage, turning 26, and other qualifying life events.',
  },
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; description: string; icon: string }> = {
  coverage_loss: {
    label: 'Loss of Coverage',
    description: 'Lost your health insurance? These qualifying life events open a 60-day Special Enrollment Period.',
    icon: '🔴',
  },
  household_change: {
    label: 'Household Changes',
    description: 'Marriage, birth, or adoption changes your household — and your coverage options.',
    icon: '👨‍👩‍👧',
  },
  new_coverage_eligible: {
    label: 'New Coverage Eligible',
    description: 'Turning 65 or gaining new eligibility triggers enrollment in Medicare or other programs.',
    icon: '🟢',
  },
  coverage_change: {
    label: 'Coverage Changes',
    description: 'Moving to a new state means new plans, new networks, and potentially new subsidy amounts.',
    icon: '🔄',
  },
  eligibility_change: {
    label: 'Eligibility Changes',
    description: 'Immigration status changes can unlock marketplace coverage and Medicaid eligibility.',
    icon: '📋',
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LifeEventsIndexPage() {
  const dataset = loadLifeEvents()
  const events = dataset.data

  // Group by category preserving order
  const byCategory = new Map<string, typeof events>()
  for (const e of events) {
    const cat = e.category ?? 'other'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(e)
  }

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://healthinsurancerenew.com' },
    { name: 'Life Events', url: 'https://healthinsurancerenew.com/life-events' },
  ])

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <LlmComment pageType="life-events-index" year={2026} data="federal-SEP-rules" extra={{ events: events.length, categories: byCategory.size }} />

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-xs text-neutral-400 mb-6">
          <ol className="flex items-center gap-1.5">
            <li>
              <a href="/" className="hover:text-primary-600 transition-colors">Home</a>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-600 font-medium">Life Events</li>
          </ol>
        </nav>

        {/* Hero */}
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2">
          Life Events &amp; Special Enrollment Periods
        </h1>
        <p className="text-neutral-500 mb-3 leading-relaxed">
          A qualifying life event (QLE) gives you a Special Enrollment Period (SEP) to enroll in
          or change your health insurance coverage outside of Open Enrollment. Each event has specific
          rules, deadlines, and documentation requirements.
        </p>
        <p className="text-sm text-neutral-400 mb-8">
          {events.length} qualifying life events covered below — click any event for a full guide
          with interactive decision trees and deadline checklists.
        </p>

        {/* Category sections */}
        <div className="space-y-10">
          {[...byCategory.entries()].map(([cat, catEvents]) => {
            const meta = CATEGORY_META[cat] ?? {
              label: cat.replace(/_/g, ' '),
              description: '',
              icon: '📌',
            }

            return (
              <section key={cat}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-navy-800 flex items-center gap-2">
                    <span aria-hidden="true">{meta.icon}</span>
                    {meta.label}
                  </h2>
                  {meta.description && (
                    <p className="text-sm text-neutral-500 mt-1">{meta.description}</p>
                  )}
                </div>

                <div className="space-y-3">
                  {catEvents.map((e) => (
                    <a
                      key={e.id}
                      href={`/life-events/${e.slug}`}
                      className="group block border border-neutral-200 rounded-xl p-4 hover:border-federal-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-medium text-navy-800 group-hover:text-federal-700 transition-colors">
                            {e.title}
                          </h3>
                          <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                            {e.trigger_description}
                          </p>
                        </div>
                        <span className="flex-shrink-0 mt-1 text-neutral-300 group-hover:text-federal-400 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>

                      {/* Quick stats row */}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="inline-flex items-center text-xs text-federal-600 font-medium bg-federal-50 px-2 py-0.5 rounded">
                          {e.sep_details?.window_days
                            ? `${e.sep_details.window_days}-day window`
                            : '7-month IEP'}
                        </span>
                        {e.decision_tree && e.decision_tree.length > 0 && (
                          <span className="text-xs text-neutral-400">
                            {e.decision_tree.length} decision points
                          </span>
                        )}
                        {e.key_deadlines && e.key_deadlines.length > 0 && (
                          <span className="text-xs text-neutral-400">
                            {e.key_deadlines.length} deadlines
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-federal-50 border border-federal-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-federal-900 mb-2">
            Not Sure If You Qualify for an SEP?
          </h2>
          <p className="text-sm text-federal-700 max-w-lg mx-auto mb-4">
            Special Enrollment rules can be complex. As a licensed agent, I can review your
            situation and determine your enrollment options at no cost.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-2.5 bg-federal-700 text-white text-sm font-semibold rounded-lg hover:bg-federal-800 transition-colors"
          >
            Get Free Help
          </a>
        </div>

        <GenericByline dataSource="federal special enrollment period rules" planYear={2026} />

        {/* Disclaimer */}
        <footer className="mt-8 pt-4 border-t border-neutral-100">
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            {dataset.metadata.disclaimer ??
              'For informational purposes only. Individual situations vary. Consult a licensed insurance agent.'}
          </p>
        </footer>
      </main>
    </>
  )
}
