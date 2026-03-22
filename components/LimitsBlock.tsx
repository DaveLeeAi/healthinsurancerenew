/** LimitsBlock — what this page can't confirm (V19 .limits-block, YMYL requirement) */

export default function LimitsBlock({
  title = 'What this page can\u2019t confirm',
  items,
}: {
  title?: string
  items: string[]
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-sm font-bold text-slate-900 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="text-slate-400 shrink-0" aria-hidden="true">&mdash;</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
