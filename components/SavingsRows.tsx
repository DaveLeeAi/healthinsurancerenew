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
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">{r.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{r.title}</p>
            <div className="text-sm text-slate-600 leading-relaxed mt-0.5">{r.desc}</div>
          </div>
        </div>
      ))}
      {note && (
        <p className="text-xs text-slate-400 mt-2 italic">{note}</p>
      )}
    </div>
  )
}
