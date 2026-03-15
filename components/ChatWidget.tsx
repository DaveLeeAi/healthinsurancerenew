'use client'

import { useState } from 'react'

const licensedStates = [
  { name: 'Alabama', abbr: 'AL', slug: 'alabama' },
  { name: 'California', abbr: 'CA', slug: 'california' },
  { name: 'Georgia', abbr: 'GA', slug: 'georgia' },
  { name: 'Iowa', abbr: 'IA', slug: 'iowa' },
  { name: 'Kansas', abbr: 'KS', slug: 'kansas' },
  { name: 'Maryland', abbr: 'MD', slug: 'maryland' },
  { name: 'Michigan', abbr: 'MI', slug: 'michigan' },
  { name: 'Missouri', abbr: 'MO', slug: 'missouri' },
  { name: 'Mississippi', abbr: 'MS', slug: 'mississippi' },
  { name: 'New Mexico', abbr: 'NM', slug: 'new-mexico' },
  { name: 'Ohio', abbr: 'OH', slug: 'ohio' },
  { name: 'Oregon', abbr: 'OR', slug: 'oregon' },
  { name: 'South Carolina', abbr: 'SC', slug: 'south-carolina' },
  { name: 'Tennessee', abbr: 'TN', slug: 'tennessee' },
  { name: 'Texas', abbr: 'TX', slug: 'texas' },
  { name: 'Utah', abbr: 'UT', slug: 'utah' },
  { name: 'Virginia', abbr: 'VA', slug: 'virginia' },
  { name: 'Washington', abbr: 'WA', slug: 'washington' },
]

const categories = [
  {
    id: 'new-to-aca',
    label: 'New to ACA',
    response: 'Here are some resources to help you get started with ACA health insurance:',
    links: [
      { title: 'Individual & Family Health Insurance Guide', url: '/guides/individual-family-health-insurance' },
      { title: 'How ACA Subsidies Work in 2026', url: '/guides/how-aca-subsidies-work-2026' },
    ],
  },
  {
    id: 'work-insurance',
    label: 'Work Insurance',
    response: "You can check whether your employer's plan meets ACA affordability standards:",
    links: [{ title: "Is My Job's Health Plan Affordable?", url: '/tools/job-plan-affordability' }],
  },
  {
    id: 'lowering-costs',
    label: 'Lowering Costs',
    response: 'These tools can help you understand how income affects your health insurance costs:',
    links: [
      { title: 'What Income Counts for Health Insurance?', url: '/tools/what-income-counts' },
      { title: 'Income & Savings Calculator', url: '/tools/income-savings-calculator' },
    ],
  },
  {
    id: 'state-questions',
    label: 'My State',
    response: 'Select your state to see state-specific health insurance information:',
    links: [],
    isStatePicker: true,
  },
  {
    id: 'enrollment',
    label: 'Enrollment',
    response: 'Learn about when and how you can enroll in health insurance coverage:',
    links: [
      { title: 'Open Enrollment 2026', url: '/guides/open-enrollment-2026' },
      { title: 'Special Enrollment Periods', url: '/guides/special-enrollment-period' },
    ],
  },
  {
    id: 'plan-levels',
    label: 'Plan Levels',
    response: 'Compare the different levels of ACA health insurance plans:',
    links: [{ title: 'Compare Bronze, Silver & Gold Plans', url: '/tools/plan-comparison' }],
  },
]

const DISCLAIMER =
  'This assistant helps you find educational resources on this site. It does not provide eligibility determinations, plan recommendations, quotes, or tax advice. For personalized guidance, speak with a licensed agent.'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState('')

  const currentCat = categories.find((c) => c.id === activeCategory)

  return (
    <div id="chat-widget">
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        aria-label="Open site librarian"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] flex flex-col bg-white/95 backdrop-blur-xl border-l border-slate-200/60 shadow-2xl">
            <div className="bg-gradient-to-r from-slate-900 to-primary-800 text-white px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <p className="font-semibold text-base">Site Librarian</p>
                <p className="text-sm text-slate-200 mt-0.5">Find the right resource for your question</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close librarian"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!activeCategory ? (
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className="text-left p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200/80 hover:border-primary-300 hover:bg-white hover:shadow-lg transition-all duration-200 text-sm font-medium text-slate-700"
                    >
                      <span className="block text-slate-900 font-semibold">{cat.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => { setActiveCategory(null); setSelectedState('') }}
                    className="text-sm text-primary-600 hover:text-primary-800 mb-4 flex items-center gap-1 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to topics
                  </button>
                  <p className="text-sm text-slate-700 mb-4 leading-relaxed">{currentCat?.response}</p>
                  <div className="space-y-2">
                    {currentCat?.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        className="block px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200/80 text-primary-700 text-sm font-medium hover:bg-white hover:shadow-md hover:border-primary-300 transition-all duration-200"
                      >
                        {link.title}
                      </a>
                    ))}
                  </div>
                  {currentCat?.isStatePicker && (
                    <div className="mt-4">
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      >
                        <option value="">Select your state...</option>
                        {licensedStates.map((s) => (
                          <option key={s.slug} value={s.slug}>{s.name} ({s.abbr})</option>
                        ))}
                      </select>
                      {selectedState && (
                        <a
                          href={`/states/${selectedState}`}
                          className="mt-3 block text-center px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                          View state info
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 p-6 border-t border-slate-200/60 space-y-3">
              <a
                href="/contact"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-primary-200 text-primary-700 text-sm font-semibold hover:bg-primary-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Talk to a Professional
              </a>
              <p className="text-[10px] text-slate-500 leading-relaxed text-center">{DISCLAIMER}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
