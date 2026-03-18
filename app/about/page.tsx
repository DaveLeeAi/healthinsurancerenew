import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import config from '../../data/config/config.json'

export const metadata: Metadata = {
  title: 'About Us | HealthInsuranceRenew',
  description:
    `Learn about HealthInsuranceRenew, an educational health insurance resource operated by a licensed health insurance agent (NPN: ${config.operator.npn}) serving clients in ${config.licensedStates.length} states.`,
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'About', url: '/about' },
]

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">About HealthInsuranceRenew</h1>

      <div className="prose prose-neutral max-w-none">
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          This site is an educational health insurance resource operated by a licensed insurance agent.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          HealthInsuranceRenew was created to address a common challenge: finding clear, straightforward information
          about health insurance marketplace options can be difficult to
          navigate, with complex terminology, shifting enrollment windows, and financial assistance rules that change
          from year to year. This site exists to make that information more accessible.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          Our mission is to provide accurate, unbiased health insurance education at no cost to consumers.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Every guide, tool, and state resource on this site is designed to help individuals and families understand
          how marketplace health coverage works. The content focuses on explaining concepts rather than steering
          decisions. Topics include how premium tax credits are calculated, what metal tier plans cover, when
          enrollment periods open, and how state-specific rules may apply. The goal is informed decision-making, not
          sales pressure.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          Our approach prioritizes clarity, accuracy, and transparency in everything we publish.
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Content is developed and reviewed by professionals with direct experience in health insurance markets.
          Guides are updated regularly to reflect current-year rules, federal poverty level guidelines, and marketplace
          changes. When readers are ready to speak with a licensed agent, that option is available — but the
          educational content stands on its own regardless.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          Licensed agents associated with this site hold active appointments in {config.licensedStates.length} states.
          A full list of those states is available on the{' '}
          <a href="/licensing" className="text-primary-600 hover:text-primary-700 underline">
            licensing page
          </a>
          . Information about how this site is funded can be found on the{' '}
          <a href="/how-we-get-paid" className="text-primary-600 hover:text-primary-700 underline">
            How We Get Paid
          </a>{' '}
          page.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-10">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 to-primary-100 text-[#0B1F3B] flex items-center justify-center shrink-0">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Licensed Health Insurance Agent</h3>
            <p className="text-sm text-primary-600 mb-2">Site Operator</p>
            <p className="text-sm text-slate-600 leading-relaxed font-serif mb-3">
              This site is operated by a licensed health insurance agent (NPN: {config.operator.npn}) serving clients in multiple
              U.S. states. HealthInsuranceRenew was built to provide clear, educational information about marketplace
              health coverage options.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-slate-500">NPN: {config.operator.npn}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                Licensed in {config.licensedStates.length} states:{' '}
                {config.licensedStates.map((s) => s.abbr).join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0B1F3B]/5 text-[#0B1F3B] flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              CMS Marketplace Elite Circle of Champions Recognition
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-serif mb-3">
              Recognized by the {config.operator.recognitionBody} (CMS) for outstanding service during the
              {config.operator.recognitionYear} Marketplace Open Enrollment Period. During the {config.operator.recognitionPeriod.replace(' Open Enrollment Period', '')} enrollment cycle, {config.operator.enrollmentVolume} in annual
              premium was enrolled through Marketplace coverage.
            </p>
            <a
              href="/circle-of-champions"
              className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              View recognition details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 mt-8">
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-700">Non-Government Disclaimer:</strong> {config.siteName} is not a government
          website. This site is not affiliated with the federal Health Insurance Marketplace, HealthCare.gov, or any
          state-based exchange. It is independently operated by a licensed insurance agent and provides educational
          information only. Nothing on this site constitutes legal, tax, or benefits advice.
        </p>
      </div>
    </div>
  )
}
