import type { Metadata } from 'next'
import Breadcrumbs from '../../components/Breadcrumbs'
import config from '../../data/config/config.json'

export const metadata: Metadata = {
  title: 'CMS Marketplace Elite Circle of Champions Recognition | HealthInsuranceRenew',
  description:
    'Health Insurance Renew received CMS Marketplace Elite Circle of Champions recognition for the 2022-2023 Open Enrollment Period, enrolling $2.9 million in annual Marketplace premium.',
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Elite Circle of Champions', url: '/circle-of-champions' },
]

const faqItems = [
  {
    question: 'What is the CMS Marketplace Elite Circle of Champions?',
    answer:
      'The Elite Circle of Champions is a recognition program administered by the Centers for Medicare & Medicaid Services (CMS), specifically the Center for Consumer Information and Insurance Oversight (CCIIO). It acknowledges agents and brokers who demonstrate exceptional enrollment performance and commitment to helping consumers access health coverage through the Health Insurance Marketplace.',
  },
  {
    question: 'What does the 2022-2023 recognition represent?',
    answer:
      'The 2022-2023 Elite Circle of Champions recognition reflects significant enrollment activity during the 2023 Open Enrollment Period. For Health Insurance Renew, this included $2.9 million in annual premium enrolled through Marketplace coverage, helping individuals and families in multiple states secure qualified health plans.',
  },
  {
    question: 'Does this recognition mean the agent is endorsed by the government?',
    answer:
      'No. Elite Circle of Champions recognition is based on enrollment volume and does not constitute a government endorsement, partnership, or affiliation. Health Insurance Renew is independently operated and is not part of Healthcare.gov or any government agency.',
  },
  {
    question: 'How does this benefit consumers?',
    answer:
      'Working with a recognized agent can provide confidence that the agent has demonstrated experience enrolling consumers in Marketplace plans. This experience typically translates to better guidance on plan selection, subsidy eligibility, and enrollment procedures.',
  },
]

export default function CircleOfChampionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        CMS Marketplace Elite Circle of Champions Recognition
      </h1>

      <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-5 mt-6 mb-8">
        <p className="text-slate-700 leading-relaxed font-serif">
          Health Insurance Renew is operated by a licensed health insurance agent recognized by the Centers for
          Medicare &amp; Medicaid Services (CMS) through the Marketplace Elite Circle of Champions program. This recognition
          was awarded for the 2022-2023 Open Enrollment Period based on enrollment volume and consumer service, with
          $2.9 million in annual premium enrolled through Marketplace coverage.
        </p>
      </div>

      <div className="prose prose-neutral max-w-none">
        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          What Is the Marketplace Elite Circle of Champions?
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          The Marketplace Elite Circle of Champions is a recognition program run by the Center for Consumer Information and
          Insurance Oversight (CCIIO), a division of CMS. The program identifies agents and brokers across the country
          who have demonstrated exceptional enrollment activity during the annual Health Insurance Marketplace Open
          Enrollment Period.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          Recognition is based on verified enrollment data. Agents who meet specific thresholds for the number of
          consumers enrolled and the volume of premium placed through the Marketplace are acknowledged for their
          contribution to expanding health coverage access.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">
          2022–2023 Open Enrollment Recognition
        </h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          During the 2022-2023 enrollment cycle, the licensed agent operating Health Insurance Renew enrolled $2.9
          million in annual premium through Marketplace coverage. This enrollment activity helped individuals and
          families in multiple states secure qualified health plans with applicable premium tax credits and
          cost-sharing reductions.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          This level of enrollment reflects a commitment to consumer education and enrollment accuracy. Each
          enrollment involves assessing household income, determining subsidy eligibility, comparing available plan
          options, and ensuring applications are submitted correctly through the Marketplace system.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Consumer Impact</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          The primary measure of this recognition is consumer impact. Marketplace enrollment connects people with
          health coverage they might otherwise struggle to obtain on their own. Many consumers who enroll through an
          agent qualify for significant financial assistance but may not realize they are eligible without professional
          guidance.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          Working with a licensed agent is free to the consumer. Agents are compensated by insurance carriers, not by
          the individuals they help enroll. This means consumers receive professional enrollment assistance at no
          additional cost compared to enrolling directly through Healthcare.gov.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Licensing Information</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Health Insurance Renew is operated by Dave Lee, a licensed health insurance agent.
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Agent:</span>
              <span className="text-slate-800 font-medium ml-1">Dave Lee</span>
            </div>
            <div>
              <span className="text-slate-500">NPN:</span>
              <span className="text-slate-800 font-medium ml-1">7578729</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500">Licensed States:</span>
              <span className="text-slate-800 font-medium ml-1">
                {config.licensedStates.map((s) => s.abbr).join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900 mb-5">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqItems.map((faq) => (
            <details key={faq.question} className="group bg-white border border-slate-200 rounded-xl">
              <summary className="flex items-center justify-between p-4 cursor-pointer text-slate-800 font-medium text-sm">
                {faq.question}
                <svg
                  className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0 ml-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4">
                <p className="text-sm text-slate-600 leading-relaxed font-serif">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 mt-10">
        <p className="text-xs text-slate-500 leading-relaxed">
          Recognition awarded by CMS CCIIO division. HealthInsuranceRenew.com is not affiliated with Healthcare.gov
          or any government agency. This recognition does not constitute a government endorsement. All enrollment data
          referenced on this page reflects verified Marketplace enrollment activity during the stated period.
        </p>
      </div>

      <div className="mt-8 text-center">
        <a
          href="/contact"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
        >
          Talk to a Licensed Agent
        </a>
      </div>
    </div>
  )
}
