import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Breadcrumbs from '../../../components/Breadcrumbs'
import AnswerBox from '../../../components/AnswerBox'
import FAQSection from '../../../components/FAQSection'
import SourcesBox from '../../../components/SourcesBox'
import { getCollectionSlugs, getCollectionEntry } from '../../../lib/markdown'
import type { StateFrontmatter } from '../../../lib/markdown'

interface Props {
  params: { state: string }
}

export async function generateStaticParams() {
  const slugs = getCollectionSlugs('states')
  return slugs.map((state) => ({ state }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = await getCollectionEntry<StateFrontmatter>('states', params.state)
  if (!entry) return {}
  return {
    title: `${entry.frontmatter.title} | HealthInsuranceRenew`,
    description: entry.frontmatter.description,
  }
}

export default async function StateDetailPage({ params }: Props) {
  const entry = await getCollectionEntry<StateFrontmatter>('states', params.state)
  if (!entry) notFound()

  const { title, description, stateName, stateAbbr, exchange, dateModified, faqs } =
    entry.frontmatter
  const slug = params.state

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'States', url: '/states' },
    { name: stateName, url: `/states/${slug}` },
  ]

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        {title}
      </h1>
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
          {stateAbbr}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm">
          Exchange: {exchange}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-4">Updated {dateModified}</p>

      <AnswerBox answer={description} />

      <div
        className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-primary-600 hover:prose-a:text-primary-700 font-serif mb-8"
        dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
      />

      {faqs && faqs.length > 0 && <FAQSection faqs={faqs} />}

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 my-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Resources</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <a href={`/states/${slug}/aca-2026`} className="text-primary-600 hover:text-primary-700 underline">
              {stateName} Marketplace Coverage Guide 2026
            </a>
          </li>
          <li><a href="/eligibility-check" className="text-primary-600 hover:text-primary-700 underline">Do I Qualify for Health Insurance Savings in 2026?</a></li>
          <li><a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">2026 Federal Poverty Level Guidelines</a></li>
          <li><a href="/csr-explained-2026" className="text-primary-600 hover:text-primary-700 underline">Cost-Sharing Reductions Explained</a></li>
          <li><a href="/aca-income-guide-2026" className="text-primary-600 hover:text-primary-700 underline">Health Insurance Savings by Income Level</a></li>
          <li><a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">Estimate Your Savings</a></li>
          <li><a href="/lost-job-health-insurance-2026" className="text-primary-600 hover:text-primary-700 underline">Lost Your Job? Your Options Explained</a></li>
        </ul>
      </div>

      <div className="mt-12 rounded-2xl bg-white border border-slate-200 shadow-sm p-8 sm:p-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-6">
          Ready to Review Coverage Options in {stateName}?
        </h2>
        <a
          href="https://applyhealthinsuranceonline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg shadow-sm hover:shadow-md transition-all duration-200"
        >
          Continue to Licensed Enrollment
        </a>
        <p className="mt-4 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          You are leaving HealthInsuranceRenew.com and entering a separate enrollment platform
          operated by licensed agents.
        </p>
      </div>

      <SourcesBox sources={[
        { title: 'Healthcare.gov', url: 'https://www.healthcare.gov/' },
        { title: `${stateName} Insurance Department`, url: 'https://www.healthcare.gov/marketplace-in-your-state/' },
      ]} />
    </article>
  )
}
