import { buildFAQSchema } from '@/lib/schema-markup'
import SchemaScript from './SchemaScript'

interface PageFaqProps {
  faqs: Array<{ question: string; answer: string }>
  includeSchema?: boolean
  sectionTitle?: string
}

export default function PageFaq({
  faqs,
  includeSchema = true,
  sectionTitle = 'Frequently Asked Questions',
}: PageFaqProps) {
  if (faqs.length === 0) return null

  const faqSchema = includeSchema ? buildFAQSchema(faqs) : null

  return (
    <>
      {faqSchema && <SchemaScript schema={faqSchema} id="page-faq-schema" />}
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-4">
          {sectionTitle}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl border border-neutral-200 bg-white overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer px-5 py-4 text-sm font-medium text-navy-800 hover:bg-neutral-50 transition-colors select-none">
                <span>{faq.question}</span>
                <svg
                  className="w-4 h-4 text-neutral-400 shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
