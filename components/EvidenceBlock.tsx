/** EvidenceBlock — visible proof for all claims (V19 .evidence-block)
 *  White card, surface header, 3-col stat grid, key/value rows, italic note. */

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
    <div className="bg-white border border-rule rounded-[10px] overflow-hidden mt-[14px]">
      {/* Header bar */}
      <div
        className="bg-surface border-b border-rule flex items-center justify-between gap-[10px] flex-wrap"
        style={{ padding: '10px 20px' }}
      >
        <span
          className="text-mid uppercase font-medium"
          style={{ fontSize: '11px', letterSpacing: '0.1em' }}
        >
          {title}
        </span>
        <span className="text-muted" style={{ fontSize: '11px' }}>
          {meta}
        </span>
      </div>

      {/* Stats grid — 3 col with right borders */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-rule">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`${i < stats.length - 1 ? 'sm:border-r border-rule' : ''}`}
              style={{ padding: '14px 20px' }}
            >
              <p
                className="text-faint uppercase font-medium"
                style={{ fontSize: '10.5px', letterSpacing: '0.07em', marginBottom: '5px' }}
              >
                {s.label}
              </p>
              <p
                className={`font-medium ${s.highlight ? 'text-vgreen' : 'text-ink'}`}
                style={{ fontSize: '22px', lineHeight: 1.1 }}
              >
                {s.value}
              </p>
              <p className="text-muted" style={{ fontSize: '11.5px', marginTop: '3px' }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Detail rows */}
      {rows.length > 0 && (
        <div>
          {rows.map((r, i) => (
            <div
              key={i}
              className={`flex items-center ${
                i < rows.length - 1 ? 'border-b border-rule' : ''
              }`}
              style={{ gap: '12px', padding: '10px 20px', fontSize: '13px' }}
            >
              <span className="text-muted shrink-0" style={{ width: 220, fontSize: '12px' }}>
                {r.key}
              </span>
              <span
                className={`font-medium ${
                  r.variant === 'varies' ? 'text-mid italic font-normal' : 'text-ink3'
                }`}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      {note && (
        <div
          className="bg-surface border-t border-rule"
          style={{ padding: '9px 20px', fontSize: '11.5px', color: '#728fa4', fontStyle: 'italic' }}
        >
          {note}
        </div>
      )}
    </div>
  )
}
