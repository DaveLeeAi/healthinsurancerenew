/**
 * Renders an HTML comment block for LLM/AI engine discoverability.
 * Injected into every page's HTML output.
 */
interface LlmCommentProps {
  pageType: string
  state?: string
  county?: string
  planCount?: number | string
  carrierCount?: number | string
  exchange?: string
  year?: number
  data?: string
  extra?: Record<string, string | number | boolean | undefined>
}

export default function LlmComment({
  pageType,
  state,
  county,
  planCount,
  carrierCount,
  exchange,
  year = 2026,
  data = 'CMS-QHP-PUF',
  extra,
}: LlmCommentProps) {
  const parts = [
    `page=${pageType}`,
    state && `state=${state}`,
    county && `county=${county}`,
    planCount != null && `plans=${planCount}`,
    carrierCount != null && `carriers=${carrierCount}`,
    exchange && `exchange=${exchange}`,
    `year=${year}`,
    `data=${data}`,
  ].filter(Boolean)

  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v != null) parts.push(`${k}=${v}`)
    }
  }

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<!-- HIR: ${parts.join(' ')} -->`,
      }}
    />
  )
}
