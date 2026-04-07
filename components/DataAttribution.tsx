/**
 * Data attribution footer — renders CMS source citation + last-reviewed date.
 * Use in page footers where a full GenericByline is too heavy.
 */
interface DataAttributionProps {
  source?: string
  planYear?: number
  lastReviewed?: string
}

export default function DataAttribution({
  source = 'federal marketplace plan data',
  planYear = 2026,
  lastReviewed,
}: DataAttributionProps) {
  const reviewDate =
    lastReviewed ??
    new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="text-xs text-neutral-400 space-y-1 mt-4">
      <p>
        Data source: {source} &middot; Plan Year {planYear}
      </p>
      <p>Last reviewed: {reviewDate}</p>
    </div>
  )
}
