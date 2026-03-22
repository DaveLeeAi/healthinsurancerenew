/** EvidenceBlock — visible proof for all claims (V19 .evidence-block) */

interface EvidenceStat {
  label: string
  value: string
  sub: string
  highlight?: boolean
}

interface EvidenceRow {
  key: string
  value: string
  variant?: 'default' | 'varies'
}

export interface EvidenceBlockProps {
  title: string
  meta: string
  stats: EvidenceStat[]
  rows: EvidenceRow[]
  note: string
}

export default function EvidenceBlock({ title, meta, stats, rows, note }: EvidenceBlockProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden mb-5">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{meta}</p>
      </div>

      {/* Stats grid — 3 col on desktop, 1 col on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-200 mx-5 rounded-lg overflow-hidden">
        {stats.map((s, i) => (
          <div key={i} className="bg-white px-4 py-3 text-center">
            <p className="text-xs text-slate-500 mb-0.5">{s.label}</p>
            <p className={`text-xl font-bold ${s.highlight ? 'text-green-700' : 'text-slate-900'}`}>
              {s.value}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Detail rows */}
      {rows.length > 0 && (
        <div className="mx-5 mt-3 space-y-1.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-baseline justify-between text-sm">
              <span className="text-slate-600">{r.key}</span>
              <span
                className={`font-medium ${
                  r.variant === 'varies' ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      <p className="px-5 py-3 text-xs text-slate-400 italic">{note}</p>
    </div>
  )
}
