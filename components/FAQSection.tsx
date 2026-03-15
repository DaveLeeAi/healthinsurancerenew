interface FAQ {
  question: string
  answer: string
}

export default function FAQSection({ faqs }: { faqs: FAQ[] }) {
  if (!faqs.length) return null
  return (
    <section className="my-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6 leading-heading">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details key={i} className="group bg-white/70 backdrop-blur-sm border border-neutral-200/80 rounded-2xl overflow-hidden">
            <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-neutral-800 font-medium hover:bg-white transition-colors">
              <span>{faq.question}</span>
              <svg
                className="w-5 h-5 text-neutral-400 transition-transform group-open:rotate-180 shrink-0 ml-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-4 text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3 font-serif">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
