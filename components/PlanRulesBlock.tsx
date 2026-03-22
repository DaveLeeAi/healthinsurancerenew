/** PlanRulesBlock — prior authorization / step therapy / supply limit rules (V19 .rules-block) */

import type { ReactNode } from 'react'

interface Rule {
  badge: 'blue' | 'green' | 'gray'
  badgeText: string
  title: string
  titleSuffix?: string
  observation: string
  body: string | ReactNode
}

export interface PlanRulesBlockProps {
  rules: Rule[]
}

const badgeColors: Record<Rule['badge'], string> = {
  blue: 'bg-bluedim text-vblue',
  green: 'bg-greendim text-vgreen',
  gray: 'bg-surface text-mid border border-rule',
}

export default function PlanRulesBlock({ rules }: PlanRulesBlockProps) {
  return (
    <div className="bg-white border border-rule rounded-[10px] overflow-hidden">
      {rules.map((r, i) => (
        <div
          key={i}
          className={`flex items-start ${i > 0 ? 'border-t border-rule' : ''}`}
          style={{ gap: '14px', padding: '15px 20px' }}
        >
          {/* Badge */}
          <span
            className={`shrink-0 w-[30px] h-[30px] rounded-md flex items-center justify-center font-medium ${badgeColors[r.badge]}`}
            style={{ fontSize: '11px', marginTop: '2px' }}
          >
            {r.badgeText}
          </span>

          <div className="min-w-0">
            <p style={{ fontSize: '13.5px' }}>
              <span className="font-medium text-ink">{r.title}</span>
              {r.titleSuffix && (
                <span className="text-muted font-normal" style={{ marginLeft: '4px' }}>
                  {r.titleSuffix}
                </span>
              )}
              {r.observation && (
                <span className="text-muted italic font-normal" style={{ fontSize: '11px', marginLeft: '6px' }}>
                  — {r.observation}
                </span>
              )}
            </p>
            {typeof r.body === 'string' ? (
              <div
                className="text-mid"
                style={{ fontSize: '13px', lineHeight: 1.6, marginTop: '3px' }}
                dangerouslySetInnerHTML={{ __html: r.body }}
              />
            ) : (
              <div className="text-mid" style={{ fontSize: '13px', lineHeight: 1.6, marginTop: '3px' }}>
                {r.body}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
