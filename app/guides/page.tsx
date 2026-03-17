import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '../../components/Breadcrumbs'
import { getCollectionList } from '../../lib/markdown'
import type { GuideFrontmatter } from '../../lib/markdown'

export const metadata: Metadata = {
  title: 'Health Insurance Guides | HealthInsuranceRenew',
  description:
    'Educational guides about health insurance marketplace enrollment, subsidies, special enrollment periods, and factors that affect coverage costs.',
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Guides', url: '/guides' },
]

export default function GuidesIndexPage() {
  const entries = getCollectionList<GuideFrontmatter>('guides')

  const guides = entries
    .map(({ slug, frontmatter }) => ({
      slug,
      title: frontmatter.title,
      description: frontmatter.description,
      dateModified: frontmatter.dateModified,
    }))
    .sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime())

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
        Health Insurance Guides
      </h1>
      <p className="text-lg text-slate-600 mb-8 max-w-2xl font-serif">
        Clear, unbiased information about how marketplace health insurance works, from
        enrollment to subsidies.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="group block p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300"
          >
            <h2 className="text-lg font-semibold text-slate-800 group-hover:text-primary-600 transition-colors mb-2">
              {guide.title}
            </h2>
            <p className="text-sm text-slate-600 font-serif leading-relaxed mb-4">
              {guide.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Updated {guide.dateModified}</span>
              <span className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold group-hover:gap-2 transition-all">
                Read
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
