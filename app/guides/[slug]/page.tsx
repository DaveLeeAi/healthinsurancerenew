import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Breadcrumbs from '../../../components/Breadcrumbs'
import AnswerBox from '../../../components/AnswerBox'
import FAQSection from '../../../components/FAQSection'
import SourcesBox from '../../../components/SourcesBox'
import { getCollectionSlugs, getCollectionEntry } from '../../../lib/markdown'
import type { GuideFrontmatter } from '../../../lib/markdown'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const slugs = getCollectionSlugs('guides')
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = await getCollectionEntry<GuideFrontmatter>('guides', params.slug)
  if (!entry) return {}
  return {
    title: `${entry.frontmatter.title} | HealthInsuranceRenew`,
    description: entry.frontmatter.description,
  }
}

export default async function GuideDetailPage({ params }: Props) {
  const entry = await getCollectionEntry<GuideFrontmatter>('guides', params.slug)
  if (!entry) notFound()

  const { title, description, dateModified, keyTakeaways, faqs } = entry.frontmatter

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: title, url: `/guides/${params.slug}` },
  ]

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        {title}
      </h1>
      <p className="text-xs text-slate-400 mb-4">Updated {dateModified}</p>

      <AnswerBox answer={description} />

      {keyTakeaways && keyTakeaways.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-primary-900 mb-3 text-sm uppercase tracking-wide">
            Key Takeaways
          </h2>
          <ul className="space-y-2">
            {keyTakeaways.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-primary-800 font-serif leading-relaxed">
                <span className="text-primary-500 mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-primary-600 hover:prose-a:text-primary-700 font-serif mb-8"
        dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
      />

      {faqs && faqs.length > 0 && <FAQSection faqs={faqs} />}

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 my-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Resources</h2>
        <ul className="space-y-2 text-sm">
          <li><a href="/eligibility-check" className="text-primary-600 hover:text-primary-700 underline">Do I Qualify for Health Insurance Savings?</a></li>
          <li><a href="/aca-income-guide-2026" className="text-primary-600 hover:text-primary-700 underline">Health Insurance Savings by Income Level</a></li>
          <li><a href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">2026 FPL Guidelines</a></li>
          <li><a href="/csr-explained-2026" className="text-primary-600 hover:text-primary-700 underline">Cost-Sharing Reductions Explained</a></li>
          <li><a href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">Estimate Your Savings</a></li>
          <li><a href="/states" className="text-primary-600 hover:text-primary-700 underline">Find Your State</a></li>
        </ul>
      </div>

      <SourcesBox sources={[
        { title: 'Healthcare.gov', url: 'https://www.healthcare.gov/' },
        { title: 'IRS - Affordable Care Act', url: 'https://www.irs.gov/affordable-care-act' },
      ]} />
    </article>
  )
}
