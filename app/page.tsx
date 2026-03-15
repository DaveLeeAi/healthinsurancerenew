import type { Metadata } from 'next'
import config from '../data/astro/config.json'

export const metadata: Metadata = {
  title: 'HealthInsuranceRenew | Understand Your ACA Health Insurance Options',
  description:
    'Educational ACA health insurance resource. Learn about marketplace plans, subsidies, enrollment periods, and compare coverage options. Licensed agents in 18 states.',
}

const guides = [
  { title: 'Health Insurance for Individuals & Families', description: 'A plain-English look at ACA marketplace plans, what they cover, and who qualifies.', url: '/guides/individual-family-health-insurance' },
  { title: 'Open Enrollment 2026', description: 'Important dates, how to sign up, and what to expect this year.', url: '/guides/open-enrollment-2026' },
  { title: 'How ACA Savings Work in 2026', description: 'Understand premium tax credits and cost-sharing reductions that lower your costs.', url: '/guides/how-aca-subsidies-work-2026' },
  { title: 'Missed Open Enrollment?', description: 'Life changes that let you sign up outside the regular enrollment window.', url: '/guides/special-enrollment-period' },
  { title: 'What Makes Health Insurance Cost More (or Less)', description: 'How your age, location, income, and plan choice affect what you pay.', url: '/guides/what-affects-health-insurance-costs' },
  { title: 'Lost Your Job? Compare COBRA vs. Marketplace', description: 'Side-by-side cost breakdown to help you pick the better option after leaving a job.', url: '/guides/cobra-vs-marketplace-after-job-loss' },
  { title: 'Turning 26? Your Insurance Options', description: "Aging off a parent's plan? Understand your marketplace, employer, and Medicaid options.", url: '/turning-26-health-insurance-options' },
  { title: 'Early Retirement Health Insurance', description: 'Bridge the gap between retirement and Medicare with ACA marketplace coverage.', url: '/early-retirement-health-insurance-2026' },
  { title: 'ACA Savings by Income Level', description: 'Understand subsidies and assistance at every income level, from Medicaid to coverage limits.', url: '/aca-income-guide-2026' },
  { title: 'Lost Your Job? Health Insurance Options', description: 'Compare ACA marketplace plans, COBRA, and Medicaid after a job loss. Includes 2026 costs and enrollment deadlines.', url: '/lost-job-health-insurance-2026' },
  { title: 'Self-Employed Health Insurance 2026', description: 'How self-employed individuals can maximize ACA subsidies, deduct premiums, and choose the right plan on variable income.', url: '/self-employed-health-insurance-2026' },
]

const tools = [
  { title: 'Estimate Your Savings', description: 'Calculate how much your income could reduce your monthly premiums.', url: '/tools/income-savings-calculator' },
  { title: 'Does My Employer Plan Count?', description: 'Check if your job-based coverage meets ACA affordability standards.', url: '/tools/job-plan-affordability' },
  { title: 'What Income Counts?', description: 'Discover which earnings types affect your marketplace savings.', url: '/tools/what-income-counts' },
  { title: 'Compare Plan Levels', description: 'Compare Bronze, Silver, Gold, and Platinum coverage and costs.', url: '/tools/plan-comparison' },
  { title: 'Check for Extra Savings on Silver Plans', description: 'Determine your eligibility for reduced copays and deductibles.', url: '/tools/csr-estimator' },
  { title: "Estimate Your Family's Costs", description: "Project your family's monthly costs across all plan levels.", url: '/tools/family-coverage-estimator' },
]

const heroTools = [
  { title: 'Estimate Your Savings', description: 'Calculate personalized subsidy estimates based on your income.', url: '/tools/income-savings-calculator', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { title: 'Check If You Qualify', description: 'Assess your eligibility for marketplace coverage and assistance.', url: '/eligibility-check', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { title: 'Find Your State', description: 'Get state-specific enrollment information and coverage details.', url: '/states', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(71 85 105) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-400/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8">
          <div className="max-w-4xl mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6 tracking-tight whitespace-nowrap">
              2026 ACA Health Insurance Made Simple
            </h1>
            <h2 className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl">
              Free tools and clear guides to help you understand your savings, eligibility, and next steps.
            </h2>
            <div className="flex flex-wrap gap-4 mt-10">
              <a href="/tools/income-savings-calculator" className="relative z-20 inline-flex items-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                Check My Options
              </a>
              <a href="/tools" className="relative z-20 inline-flex items-center px-6 py-3 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
                Explore Tools
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-8">
            {heroTools.map((tool) => (
              <a
                key={tool.url}
                href={tool.url}
                className="group block rounded-2xl bg-white border border-slate-200 p-6 shadow-md hover:shadow-xl hover:border-primary-300 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
                  </svg>
                </div>
                <h3 className="text-slate-900 font-semibold text-base mb-1.5">{tool.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{tool.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-heading">Learn How It Works</h2>
            <p className="text-slate-600">Clear, plain-English guides about ACA health insurance -- no jargon, no sales pressure.</p>
          </div>
          <a href="/guides" className="hidden sm:inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors whitespace-nowrap">
            View all guides
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <a key={guide.url} href={guide.url} className="group block p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-800 group-hover:text-primary-600 transition-colors mb-2">{guide.title}</h3>
              <p className="text-sm text-slate-600 font-serif leading-relaxed">{guide.description}</p>
              <span className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold mt-4 group-hover:gap-2 transition-all">
                Read guide
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </a>
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <a href="/guides" className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
            View all guides
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Tools */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-heading">Free Tools</h2>
          <p className="text-slate-600 mb-8">Answer a few questions and get a quick estimate. No sign-up needed.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <a key={tool.url} href={tool.url} className="group block p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300">
                <h3 className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors mb-1.5">{tool.title}</h3>
                <p className="text-sm text-slate-600 font-serif">{tool.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ACA Reference Pages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-heading">2026 ACA Reference Pages</h2>
        <p className="text-slate-600 mb-6">In-depth explanations of the rules and numbers behind ACA coverage.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { href: '/eligibility-check', title: 'Do I Qualify for ACA Savings?', desc: 'Step-by-step walkthrough of the main eligibility factors.' },
            { href: '/fpl-2026', title: '2026 FPL Guidelines', desc: 'Income tables by household size at every key FPL percentage.' },
            { href: '/csr-explained-2026', title: 'Cost-Sharing Reductions Explained', desc: 'How CSR tiers lower your deductibles, copays, and out-of-pocket costs.' },
          ].map((item) => (
            <a key={item.href} href={item.href} className="group block p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300">
              <h3 className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors mb-1.5">{item.title}</h3>
              <p className="text-sm text-slate-600 font-serif">{item.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* About section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-heading">Honest, Up-to-Date Health Insurance Help</h2>
            <p className="text-slate-600 mb-6 font-serif leading-relaxed">
              Everything on this site is free. We explain how ACA marketplace coverage works in plain English so you can make the best choice for your situation. Licensed agents are available in 18 states if you need personal help.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-xl bg-primary-50/50 border border-primary-100">
                <p className="text-2xl font-bold text-primary-700">18</p>
                <p className="text-xs text-slate-600 mt-1">Licensed States</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary-50/50 border border-secondary-100">
                <p className="text-2xl font-bold text-secondary-700">6</p>
                <p className="text-xs text-slate-600 mt-1">Free Tools</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-accent-50/50 border border-accent-100">
                <p className="text-2xl font-bold text-accent-700">10</p>
                <p className="text-xs text-slate-600 mt-1">In-Depth Guides</p>
              </div>
            </div>
            <a href="/about" className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Learn about us
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img src="/images/hero/hero-1.webp" alt="Family reviewing health insurance options together" className="rounded-2xl shadow-lg w-full h-48 object-cover" loading="lazy" />
            <img src="/images/hero/hero-2.webp" alt="Person using a laptop to compare health plans" className="rounded-2xl shadow-lg w-full h-48 object-cover mt-6" loading="lazy" />
            <img src="/images/hero/hero-3.webp" alt="Healthcare professional assisting a patient" className="rounded-2xl shadow-lg w-full h-48 object-cover col-span-2" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Elite Circle of Champions */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-[#0B1F3B] mb-2 leading-heading">CMS Marketplace Elite Circle of Champions Recognition</h2>
              <p className="text-slate-500 text-sm mb-4">Recognized for Excellence During the 2023 Health Insurance Marketplace Open Enrollment Period</p>
              <p className="text-slate-600 leading-relaxed font-serif mb-4">
                Health Insurance Renew is operated by a licensed health insurance agent recognized by the Centers for Medicare &amp; Medicaid Services (CMS) for outstanding service during the 2023 Marketplace Open Enrollment Period.
              </p>
              <p className="text-slate-600 leading-relaxed font-serif mb-4">
                During the 2022-2023 enrollment cycle, $2.9 million in annual premium was enrolled through Marketplace coverage, helping individuals and families secure qualified health plans.
              </p>
              <p className="text-sm text-slate-500 mb-4">NPN: 7578729</p>
              <a href="/circle-of-champions" className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                See recognition details
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#0B1F3B]/5 text-[#0B1F3B] flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-[#0B1F3B]">Elite Circle of Champions</p>
                  <p className="text-xs text-slate-500">2022-2023 Open Enrollment Period</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-white rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-[#0B1F3B]">$2.9M</p>
                  <p className="text-xs text-slate-500 mt-1">Annual Premium Enrolled</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-[#0B1F3B]">18</p>
                  <p className="text-xs text-slate-500 mt-1">Licensed States</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recognition awarded by CMS CCIIO division. Not affiliated with Healthcare.gov or any government agency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Licensed States */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-heading">Licensed agents are available in 18 states.</h2>
          <p className="text-slate-600 mb-8">Select your state to see local health insurance information and enrollment details.</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3">
            {config.licensedStates.map((state) => (
              <a
                key={state.slug}
                href={`/states/${state.slug}`}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 group"
              >
                <span className="text-lg font-bold text-slate-700 group-hover:text-primary-600 transition-colors">{state.abbr}</span>
                <span className="text-xs text-slate-500 mt-0.5">{state.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
