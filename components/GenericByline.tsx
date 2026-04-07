// NOTE: No name/NPN on this component — generic byline only.
// Dave Lee name/NPN ONLY on app/page.tsx (homepage) + app/circle-of-champions/page.tsx.

interface GenericBylineProps {
  dataSource?: string
  planYear?: number
  lastReviewed?: string
}

export default function GenericByline({
  dataSource = 'federal marketplace plan data and plan benefit documents',
  planYear = 2026,
  lastReviewed,
}: GenericBylineProps) {
  const reviewDate =
    lastReviewed ??
    new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <section className="border-t border-neutral-200 pt-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-navy-800">
            Reviewed by a licensed health insurance professional
          </div>
          <div className="text-xs text-neutral-500">
            CMS-certified marketplace enrollment assistance &middot; Licensed in
            20+ states
          </div>
        </div>
      </div>
      <div className="text-xs text-neutral-400 space-y-1">
        <p>
          <strong>Data source:</strong> {dataSource} &middot; Plan Year{' '}
          {planYear}
        </p>
        <p>
          <strong>Last reviewed:</strong>{' '}
          <time dateTime={lastReviewed ?? new Date().toISOString().slice(0, 10)}>
            {reviewDate}
          </time>
        </p>
      </div>
    </section>
  )
}
