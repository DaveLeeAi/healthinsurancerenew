import type { Metadata } from 'next'
import config from '../data/config/config.json'
import SchemaScript from '../components/SchemaScript'

export const metadata: Metadata = {
  title: 'HealthInsuranceRenew | 2026 Health Insurance Marketplace — Plans, Savings & Tools',
  description:
    `Free marketplace health insurance tools and guides powered by CMS Public Use Files. Compare 2026 plans, calculate your premium tax credit, and understand your coverage options. Licensed agents in ${config.licensedStates.length} states.`,
  openGraph: {
    title: 'HealthInsuranceRenew — 2026 Health Insurance Marketplace Data & Tools',
    description:
      `CMS-powered tools and plain-English guides for marketplace health insurance (Obamacare). Subsidy calculators, plan comparisons, drug lookup, and licensed agent help in ${config.licensedStates.length} states.`,
    type: 'website',
    url: 'https://healthinsurancerenew.com',
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
  },
}

const guides = [
  { title: 'Health Insurance for Individuals & Families', description: 'A plain-English look at marketplace plans, what they cover, and who qualifies.', url: '/guides/individual-family-health-insurance' },
  { title: 'Open Enrollment 2026', description: 'Important dates, how to sign up, and what to expect this year.', url: '/guides/open-enrollment-2026' },
  { title: 'How Health Insurance Savings Work in 2026', description: 'Understand premium tax credits and cost-sharing reductions that lower your costs.', url: '/guides/how-aca-subsidies-work-2026' },
  { title: 'Missed Open Enrollment?', description: 'Life changes that let you sign up outside the regular enrollment window.', url: '/guides/special-enrollment-period' },
  { title: 'What Makes Health Insurance Cost More (or Less)', description: 'How your age, location, income, and plan choice affect what you pay.', url: '/guides/what-affects-health-insurance-costs' },
  { title: 'Lost Your Job? Compare COBRA vs. Marketplace', description: 'Side-by-side cost breakdown to help you pick the better option after leaving a job.', url: '/guides/cobra-vs-marketplace-after-job-loss' },
  { title: 'Turning 26? Your Insurance Options', description: "Aging off a parent's plan? Understand your marketplace, employer, and Medicaid options.", url: '/turning-26-health-insurance-options' },
  { title: 'Early Retirement Health Insurance', description: 'Bridge the gap between retirement and Medicare with marketplace coverage.', url: '/early-retirement-health-insurance-2026' },
  { title: 'Health Insurance Savings by Income Level', description: 'Understand subsidies and assistance at every income level, from Medicaid to coverage limits.', url: '/aca-income-guide-2026' },
  { title: 'Lost Your Job? Health Insurance Options', description: 'Compare marketplace plans, COBRA, and Medicaid after a job loss. Includes 2026 costs and enrollment deadlines.', url: '/lost-job-health-insurance-2026' },
  { title: 'Self-Employed Health Insurance 2026', description: 'How self-employed individuals can maximize marketplace savings, deduct premiums, and choose the right plan on variable income.', url: '/self-employed-health-insurance-2026' },
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

const whoItsFor = [
  { label: 'Individuals & Families', url: '/guides/individual-family-health-insurance' },
  { label: 'Self-Employed Workers', url: '/self-employed-health-insurance-2026' },
  { label: 'Turning 26', url: '/turning-26-health-insurance-options' },
  { label: 'Early Retirees', url: '/early-retirement-health-insurance-2026' },
  { label: 'Job Changers', url: '/lost-job-health-insurance-2026' },
  { label: 'Employer Coverage Questions', url: '/tools/job-plan-affordability' },
]

const dataPillars = [
  { title: 'Plans', url: '/plans', description: 'Compare plans in every county. Premiums, metal levels, deductibles. CMS QHP Landscape PUF.' },
  { title: 'Subsidies', url: '/subsidies', description: 'Calculate your premium tax credit by county. Based on benchmark silver premiums. CMS Rate PUF.' },
  { title: 'Rates', url: '/rates', description: 'Track premium rate volatility. Age-rating ratios and carrier counts. CMS Rate PUF.' },
  { title: 'Drug Formulary', url: '/formulary', description: '551,000+ drug coverage records. Tier placement and cost-sharing by plan.' },
  { title: 'Dental Plans', url: '/dental', description: '942 stand-alone dental plans across 30 states. CMS SADP PUF.' },
  { title: 'Billing', url: '/billing', description: 'Common billing scenarios. No Surprises Act protections and dispute guidance.' },
  { title: 'Life Events', url: '/life-events', description: '8 qualifying life events with SEP windows, deadlines, and documentation.' },
  { title: 'Enhanced Credits', url: '/enhanced-credits', description: 'County-level subsidy cliff modeling. IRA credit expiration impact.' },
  { title: 'FAQ', url: '/faq', description: '54 expert answers across 9 categories. Regulatory citations included.' },
  { title: 'Plan Details / SBC', url: '/states', description: 'Full SBC data for individual plans. Select a state and county to view plan details, coverage, cost-sharing, and formulary.' },
]

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': 'HealthInsuranceRenew',
  'url': 'https://healthinsurancerenew.com',
  'description': 'Free marketplace health insurance tools and guides powered by CMS Public Use Files for all 50 states.',
  'potentialAction': {
    '@type': 'SearchAction',
    'target': {
      '@type': 'EntryPoint',
      'urlTemplate': 'https://healthinsurancerenew.com/formulary?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'HealthInsuranceRenew',
  'alternateName': ['Health Insurance Renew', 'HealthInsuranceRenew.com'],
  'url': 'https://healthinsurancerenew.com',
  'logo': 'https://healthinsurancerenew.com/favicon.svg',
  'description': 'HealthInsuranceRenew.com is a free ACA Marketplace intelligence platform powered by CMS Public Use Files. It provides plan comparisons, subsidy calculators, drug formulary lookup, and plain-English guides for all 50 US states. Content is reviewed by licensed health insurance professionals holding CMS Elite Circle of Champions recognition.',
  'areaServed': {
    '@type': 'Country',
    'name': 'United States'
  },
  'knowsAbout': [
    'ACA Marketplace Health Insurance',
    'Premium Tax Credits',
    'Cost-Sharing Reductions',
    'Health Insurance Formulary',
    'Special Enrollment Periods',
    'Open Enrollment',
    'Medicaid Eligibility',
    'COBRA vs Marketplace',
    'CMS Public Use Files',
    'Summary of Benefits and Coverage',
    'Metal Tier Health Plans',
    'Prior Authorization',
    'Step Therapy',
    'Health Insurance Subsidies',
    'Federal Poverty Level',
    'Health Insurance Deductible',
    'Out-of-Pocket Maximum',
    'Affordable Care Act'
  ],
  'hasCredential': {
    '@type': 'EducationalOccupationalCredential',
    'credentialCategory': 'CMS Marketplace Elite Circle of Champions',
    'recognizedBy': {
      '@type': 'GovernmentOrganization',
      'name': 'Centers for Medicare & Medicaid Services',
      'url': 'https://www.cms.gov'
    }
  },
  'publishingPrinciples': 'https://healthinsurancerenew.com/editorial-policy',
  'ethicsPolicy': 'https://healthinsurancerenew.com/how-we-get-paid',
  'sameAs': [
    'https://healthinsurancerenew.com/about',
    'https://healthinsurancerenew.com/circle-of-champions'
  ]
}

const speakableSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  'url': 'https://healthinsurancerenew.com',
  'speakable': {
    '@type': 'SpeakableSpecification',
    'cssSelector': [
      '#site-bluf',
      '#data-pillars-heading',
      '#trust-heading',
      '#elite-recognition-heading',
      '#why-trust-heading'
    ]
  }
}

export default function HomePage() {
  return (
    <>
      {/* Schema */}
      <SchemaScript schema={websiteSchema} id="schema-website" />
      <SchemaScript schema={organizationSchema} id="schema-organization" />
      <SchemaScript schema={speakableSchema} id="schema-speakable" />

      <p id="site-bluf" className="sr-only">
        HealthInsuranceRenew.com is a free ACA health insurance intelligence platform
        powered by CMS Public Use Files. It covers all 50 US states and provides
        subsidy calculators, drug formulary lookup, plan comparisons, and
        plain-English guides written and reviewed by licensed health insurance
        professionals recognized with CMS Elite Circle of Champions status.
      </p>

      {/* Section 1: Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(71 85 105) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-400/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8">
          <div className="max-w-4xl mb-12">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
              <span>&#11088;</span> Licensed health insurance agent &middot; Recognized by CMS &middot; Serving {config.licensedStates.length} states
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6 tracking-tight">
              Health insurance that actually makes sense.
            </h1>
            <p className="text-sm font-medium text-primary-600 mb-3">2026 Marketplace Coverage</p>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl">
              Free tools and plain-English guides to help you figure out your 2026 coverage options — what you qualify for, what it costs, and what to do next. No sales pitch.
            </p>

            {/* Who it's for */}
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-500 mb-2">I&rsquo;m looking for help with:</p>
              <div className="flex flex-wrap gap-2">
                {whoItsFor.map((item) => (
                  <a
                    key={item.url}
                    href={item.url}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mt-10">
              <a href="/tools/income-savings-calculator" className="relative z-20 inline-flex items-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                See what I qualify for
              </a>
              <a href="/tools" className="relative z-20 inline-flex items-center px-6 py-3 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
                Browse free tools
              </a>
            </div>
          </div>

          {/* Hero tool cards */}
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

      {/* Section 2: Data Authority Bar */}
      <section className="bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-bold text-white mb-2 leading-heading">What&rsquo;s Behind This Site — CMS Public Use File Coverage</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-3xl">
            All data is sourced directly from CMS (Centers for Medicare &amp; Medicaid Services) Public Use Files — the same government datasets that power Healthcare.gov.
          </p>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-6 mb-6">
            {[
              { value: '551,000+', label: 'Drugs in Formulary Database' },
              { value: '1,852', label: 'County Subsidy Records' },
              { value: '942', label: 'Dental Plans Tracked' },
              { value: '54', label: 'Expert Q&As' },
              { value: '50', label: 'States Covered' },
              { value: String(config.licensedStates.length), label: 'Licensed Agent States' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Source: CMS QHP Landscape PUF &middot; CMS Rate PUF &middot; CMS MR-PUF &middot; CMS SADP PUF &middot; IRS FPL Tables &middot; Updated 2026
          </p>
        </div>
      </section>

      {/* Section 3: Guides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-heading">Plain-English Guides — Written for Real People</h2>
            <p className="text-slate-600">Every guide is written by a licensed health insurance agent with direct enrollment experience. No filler content, no generic summaries.</p>
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

      {/* Section 4: Tools */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-heading">Free Tools — No Sign-Up Required</h2>
          <p className="text-slate-600 mb-8">Answer a few questions and get a personalized estimate in under 60 seconds. All calculations use current CMS data and IRS FPL tables.</p>
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

      {/* Section 5: Data Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 id="data-pillars-heading" className="text-2xl font-bold text-slate-900 mb-2 leading-heading">10 Data Pillars — Full Coverage of Marketplace Health Insurance</h2>
        <p className="text-slate-600 mb-8">Explore the complete dataset. Each pillar is powered by a separate CMS Public Use File and updated annually.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {dataPillars.map((pillar) => (
            <a
              key={pillar.url}
              href={pillar.url}
              className="group block p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300"
            >
              <h3 className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors mb-1.5">{pillar.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{pillar.description}</p>
              <span className="inline-flex items-center text-xs text-primary-600 font-medium mt-3 group-hover:gap-1 transition-all">
                Explore
                <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Section 6: Trust / E-E-A-T */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 id="why-trust-heading" className="text-2xl font-bold text-slate-900 mb-8 leading-heading">Why Trust This Site</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1 — Licensed Expert */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Written by a Licensed Agent</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              All content is developed and reviewed by a licensed health insurance agent — not a content farm. {config.operator.recognition} recognition. NPN: {config.operator.npn}. Licensed in {config.licensedStates.length} states.
            </p>
            <a href="/about" className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              About us
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>

          {/* Card 2 — Primary Source Data */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Powered by CMS Public Use Files</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Every data point — plans, rates, subsidies, formulary — comes directly from CMS government datasets, the same source used by Healthcare.gov. No third-party data aggregators.
            </p>
            <a href="/data-methodology" className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Our data methodology
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>

          {/* Card 3 — No Conflicts */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">No Ads. No Lead Sales. No Pressure.</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              This site is free to use. We do not sell your data, display advertising, or push you toward specific plans. How we earn is fully disclosed.
            </p>
            <a href="/how-we-get-paid" className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              How we get paid
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-2 gap-3">
          <img src="/images/hero/hero-1.webp" alt="Family reviewing health insurance options together" className="rounded-2xl shadow-lg w-full h-48 object-cover" loading="lazy" />
          <img src="/images/hero/hero-2.webp" alt="Person using a laptop to compare health plans" className="rounded-2xl shadow-lg w-full h-48 object-cover mt-6" loading="lazy" />
          <img src="/images/hero/hero-3.webp" alt="Healthcare professional assisting a patient" className="rounded-2xl shadow-lg w-full h-48 object-cover col-span-2" loading="lazy" />
        </div>
      </section>

      {/* Section 7: CMS Elite Circle of Champions */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 id="elite-recognition-heading" className="text-2xl font-bold text-[#0B1F3B] mb-2 leading-heading">{config.operator.recognition} Recognition</h2>
              <p className="text-slate-500 text-sm mb-4">Recognized for Excellence During the {config.operator.recognitionYear} Health Insurance Marketplace Open Enrollment Period</p>
              <p className="text-slate-600 leading-relaxed font-serif mb-4">
                Health Insurance Renew is operated by a licensed health insurance agent recognized by the {config.operator.recognitionBody} (CMS) for outstanding service during the {config.operator.recognitionYear} Marketplace Open Enrollment Period.
              </p>
              <p className="text-slate-600 leading-relaxed font-serif mb-4">
                During the {config.operator.recognitionPeriod.replace(' Open Enrollment Period', '')} enrollment cycle, {config.operator.enrollmentVolume} in annual premium was enrolled through Marketplace coverage, helping individuals and families secure qualified health plans.
              </p>
              <p className="text-sm text-slate-500 mb-4">NPN: {config.operator.npn}</p>
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
                  <p className="text-xs text-slate-500">{config.operator.recognitionPeriod}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-white rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-[#0B1F3B]">{config.operator.enrollmentVolume.replace(' million', 'M')}</p>
                  <p className="text-xs text-slate-500 mt-1">Annual Premium Enrolled</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-[#0B1F3B]">{config.licensedStates.length}</p>
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

      {/* Section 8: Licensed States */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-heading">Licensed agents are available in {config.licensedStates.length} states.</h2>
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
