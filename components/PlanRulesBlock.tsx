/** PlanRulesBlock — prior auth / step therapy / supply limit rules (V19 .rules-block) */

import type { ReactNode } from 'react'

interface Rule {
  badge: 'blue' | 'green' | 'gray'
  badgeText: string
  title: string
  observation: string
  body: string | ReactNode
}

export interface PlanRulesBlockProps {
  rules: Rule[]
}

const badgeColors: Record<Rule['badge'], string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  gray: 'bg-slate-100 text-slate-600',
}

export default function PlanRulesBlock({ rules }: PlanRulesBlockProps) {
  return (
    <div className="space-y-3">
      {rules.map((r, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeColors[r.badge]}`}
            >
              {r.badgeText}
            </span>
            <span className="text-sm font-bold text-slate-900">{r.title}</span>
          </div>
          <p className="text-xs text-slate-500 mb-1.5">{r.observation}</p>
          <div className="text-sm text-slate-700 leading-relaxed">{r.body}</div>
        </div>
      ))}
    </div>
  )
}
