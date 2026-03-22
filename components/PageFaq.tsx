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
  sectionTitle: _sectionTitle,
}: PageFaqProps) {
  if (faqs.length === 0) return null

  const faqSchema = includeSchema ? buildFAQSchema(faqs) : null

  return (
    <>
      {faqSchema && <SchemaScript schema={faqSchema} id="page-faq-schema" />}
      <section aria-labelledby="faq-heading">
        <div className="flex flex-col" style={{ gap: '5px' }}>
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group bg-white border border-rule overflow-hidden"
              style={{ borderRadius: '8px' }}
            >
              <summary
                className="flex items-center justify-between cursor-pointer text-ink font-medium hover:bg-surface transition-colors select-none [&::-webkit-details-marker]:hidden list-none"
                style={{ padding: '13px 18px', fontSize: '13.5px', gap: '8px' }}
              >
                <span>{faq.question}</span>
                <svg
                  className="w-[10px] h-[10px] text-faint shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div
                className="text-mid border-t border-rule"
                style={{ padding: '10px 18px 15px', fontSize: '13.5px', lineHeight: 1.65 }}
              >
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
