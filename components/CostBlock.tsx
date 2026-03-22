/** CostBlock — cost rows with optional progress bars (V19 .cost-block) */

interface CostRow {
  name: string
  desc: string
  figure: string
  unit: string
  barPercent?: number
  barColor?: string
}

interface VaryRow {
  key: string
  value: string
}

export interface CostBlockProps {
  rows: CostRow[]
  note: string
  varyRows?: VaryRow[]
}

export default function CostBlock({ rows, note, varyRows }: CostBlockProps) {
  return (
    <div className="space-y-5">
      {/* Cost rows */}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-baseline justify-between mb-1">
              <div>
                <span className="text-sm font-semibold text-slate-900">{r.name}</span>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
              <span className="text-lg font-bold text-slate-900 shrink-0 ml-3">
                {r.figure}
                {r.unit && <span className="text-xs font-normal text-slate-500">/{r.unit}</span>}
              </span>
            </div>
            {r.barPercent != null && (
              <div className="h-1.5 rounded-full bg-slate-100 mt-2">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(r.barPercent, 100)}%`,
                    backgroundColor: r.barColor ?? '#3b82f6',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="text-xs text-slate-400">{note}</p>

      {/* Vary block */}
      {varyRows && varyRows.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
            What makes cost vary
          </p>
          <div className="space-y-1">
            {varyRows.map((v, i) => (
              <div key={i} className="flex items-baseline justify-between text-sm">
                <span className="text-amber-900">{v.key}</span>
                <span className="text-amber-700 font-medium">{v.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
