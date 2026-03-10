import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ACA Health Insurance Intelligence — All 50 States',
  description:
    'Compare ACA health plans, calculate subsidies, and understand your coverage options with data directly from CMS.',
}

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-navy-900 mb-4">
        ACA Health Insurance Intelligence
      </h1>
      <p className="text-lg text-neutral-600 mb-8">
        Premium rates, subsidy calculators, formulary lookups, and coverage analysis
        for every Marketplace plan across all 50 states.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { href: '/plans', label: 'Plan & Premium Intelligence', desc: 'Compare plans by county, metal level, and premium.' },
          { href: '/subsidies', label: 'Subsidy Calculator', desc: 'Calculate your APTC based on income and county.' },
          { href: '/rates', label: 'Rate Volatility Tracker', desc: 'See year-over-year premium changes by carrier.' },
          { href: '/faq', label: 'Coverage Q&A', desc: 'Answers to 54+ real ACA questions.' },
          { href: '/formulary', label: 'Drug Formulary Lookup', desc: 'Find which plans cover your medications.' },
          { href: '/life-events', label: 'Life Events & SEPs', desc: 'Navigate coverage changes after major life events.' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block p-6 border border-neutral-200 rounded-xl hover:border-primary-500 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold text-navy-800 mb-2">{link.label}</h2>
            <p className="text-sm text-neutral-500">{link.desc}</p>
          </a>
        ))}
      </div>
    </main>
  )
}
