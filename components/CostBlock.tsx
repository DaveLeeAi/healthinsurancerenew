import React from 'react'

/** CostBlock — V19 .cost-block style
 *  White card, 1px border, rows with left text + progress bar + right figure.
 *  Cost note at bottom: surface bg, italic. Cost-vary-block below. */

interface CostRow {
  name: string
  desc: string
  figure: string
  unit: string
  hint?: string
  barPercent?: number
  barColor?: 'hi' | 'lo' | 'mid'
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

/** Guess a bar % from the figure string, e.g. "$30–$60" → ~40% */
function guessBarPercent(figure: string): number {
  const nums = figure.match(/\d[\d,]*/g)
  if (!nums || nums.length === 0) return 30
  const max = parseInt(nums[nums.length - 1].replace(',', ''), 10)
  if (max >= 400) return 85
  if (max >= 100) return 60
  if (max >= 50) return 40
  return 25
}

const BAR_COLORS: Record<string, string> = {
  hi: '#0d1b2a',
  lo: '#1a56a0',
  mid: 'rgba(26,86,160,0.4)',
}

export default function CostBlock({ rows, note, varyRows }: CostBlockProps) {
  return (
    <div>
      {/* Main cost card */}
      <div className="bg-white border border-rule rounded-[10px] overflow-hidden">
        {rows.map((r, i) => {
          const pct = r.barPercent ?? guessBarPercent(r.figure)
          const color = BAR_COLORS[r.barColor ?? (i === 0 ? 'hi' : 'lo')]
          return (
            <React.Fragment key={i}>
            <div
              className={`flex items-center ${i > 0 ? 'border-t border-rule' : ''}`}
              style={{ gap: '16px', padding: '14px 20px' }}
            >
              {/* Left: name + desc */}
              <div className="flex-1 min-w-0">
                <span className="text-ink block font-medium" style={{ fontSize: '13.5px' }}>
                  {r.name}
                </span>
                <span className="text-muted block" style={{ fontSize: '12px', marginTop: '2px' }}>
                  {r.desc}
                </span>
              </div>

              {/* Progress bar */}
              <div className="hidden sm:block shrink-0" style={{ width: 70 }}>
                <div style={{ height: 4, background: '#dbe3ec', borderRadius: 2, overflow: 'hidden', marginTop: 5 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
                </div>
              </div>

              {/* Right figure */}
              <div className="text-right shrink-0">
                <span className="text-ink font-medium" style={{ fontSize: '17px', lineHeight: 1 }}>
                  {r.figure}
                </span>
                {r.unit && (
                  <span className="text-muted block" style={{ fontSize: '11.5px', marginTop: '2px' }}>
                    {r.unit}
                  </span>
                )}
              </div>
            </div>
            {r.hint && (
              <div
                className="text-muted italic"
                style={{ fontSize: '12px', lineHeight: 1.55, padding: '0 20px 12px', marginTop: '-6px' }}
              >
                {r.hint}
              </div>
            )}
            </React.Fragment>
          )
        })}

        {/* Note */}
        {note && (
          <div
            className="bg-surface border-t border-rule"
            style={{ padding: '11px 20px', fontSize: '12.5px', color: '#728fa4', fontStyle: 'italic', lineHeight: 1.55 }}
          >
            {note}
          </div>
        )}
      </div>

      {/* Why costs vary block */}
      {varyRows && varyRows.length > 0 && (
        <div className="bg-white border border-rule rounded-[10px] overflow-hidden" style={{ marginTop: '12px' }}>
          {varyRows.map((v, i) => (
            <div
              key={i}
              className={`flex items-start ${i > 0 ? 'border-t border-rule' : ''}`}
              style={{ gap: '12px', padding: '11px 20px', fontSize: '13px' }}
            >
              <span className="text-muted shrink-0" style={{ width: 180, fontSize: '12px', paddingTop: 1 }}>
                {v.key}
              </span>
              <span className="text-ink3" style={{ lineHeight: 1.5 }}>
                {v.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
