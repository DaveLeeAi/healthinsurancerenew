interface MethodologyBlockProps {
  pillar: string
  dataSource: string
  dataSourceUrl: string
  planYear: number
  coverageScope: string
  lastUpdated?: string
}

export default function MethodologyBlock({
  pillar,
  dataSource,
  dataSourceUrl,
  planYear,
  coverageScope,
  lastUpdated,
}: MethodologyBlockProps) {
  return (
    <section aria-labelledby="methodology-heading" className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
      <h2 id="methodology-heading" className="text-base font-semibold text-navy-800 mb-3">
        Data Source &amp; Methodology
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-neutral-400 uppercase tracking-wide">Dataset</dt>
          <dd className="text-neutral-700 font-medium mt-0.5">{pillar}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-400 uppercase tracking-wide">Primary Source</dt>
          <dd className="mt-0.5">
            <a
              href={dataSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline font-medium"
            >
              {dataSource}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-400 uppercase tracking-wide">Plan Year</dt>
          <dd className="text-neutral-700 font-medium mt-0.5">{planYear}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-400 uppercase tracking-wide">Coverage</dt>
          <dd className="text-neutral-700 font-medium mt-0.5">{coverageScope}</dd>
        </div>
        {lastUpdated && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-neutral-400 uppercase tracking-wide">Last Updated</dt>
            <dd className="text-neutral-700 font-medium mt-0.5">{lastUpdated}</dd>
          </div>
        )}
      </dl>
      <p className="text-xs text-neutral-400 mt-4">
        All data on this page is derived from publicly available CMS and IRS datasets.
        We do not collect, scrape, or estimate data from private sources.
      </p>
    </section>
  )
}
