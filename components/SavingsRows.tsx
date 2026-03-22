/** SavingsRows — ways to save / next steps (V19 .sv-row) */

import type { ReactNode } from 'react'

interface SavingsRow {
  icon: string
  title: string
  desc: string | ReactNode
}

export interface SavingsRowsProps {
  rows: SavingsRow[]
  note?: string
}

export default function SavingsRows({ rows, note }: SavingsRowsProps) {
  return (
    <div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-start"
          style={{
            gap: '14px',
            padding: '13px 0',
            borderBottom: i < rows.length - 1 ? '1px solid #dbe3ec' : 'none',
          }}
        >
          <span
            className="shrink-0 rounded-md bg-greendim text-vgreen flex items-center justify-center"
            style={{ width: 28, height: 28, fontSize: '13px', marginTop: '2px' }}
            aria-hidden="true"
          >
            {r.icon}
          </span>
          <div className="min-w-0">
            <p className="text-ink font-medium" style={{ fontSize: '13.5px' }}>{r.title}</p>
            {typeof r.desc === 'string' ? (
              <div
                className="text-mid [&_a]:text-vblue [&_a:hover]:underline"
                style={{ fontSize: '13px', marginTop: '2px', lineHeight: 1.55 }}
                dangerouslySetInnerHTML={{ __html: r.desc }}
              />
            ) : (
              <div className="text-mid" style={{ fontSize: '13px', marginTop: '2px', lineHeight: 1.55 }}>
                {r.desc}
              </div>
            )}
          </div>
        </div>
      ))}
      {note && (
        <p
          className="text-muted italic border-t border-rule"
          style={{ fontSize: '12px', marginTop: '12px', paddingTop: '12px' }}
        >
          {note}
        </p>
      )}
    </div>
  )
}
