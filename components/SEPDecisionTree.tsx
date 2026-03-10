'use client'

import { useState, useCallback } from 'react'
import type { DecisionTreeNode } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PathOption {
  key: string
  label: string
  text: string
}

interface Props {
  nodes: DecisionTreeNode[]
  eventTitle: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract clickable path options from a decision tree node. */
function getPathOptions(node: DecisionTreeNode): PathOption[] {
  const options: PathOption[] = []
  for (const [key, value] of Object.entries(node)) {
    if (key === 'node' || value === undefined) continue
    // Generate a human-friendly label from the key
    const label = key
      .replace(/_path/g, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim()
    options.push({ key, label, text: value })
  }
  return options
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SEPDecisionTree({ nodes, eventTitle }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState<Map<number, PathOption>>(new Map())
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  const totalSteps = nodes.length
  const isComplete = currentStep >= totalSteps

  const handleSelect = useCallback(
    (stepIndex: number, option: PathOption) => {
      setSelections((prev) => {
        const next = new Map(prev)
        next.set(stepIndex, option)
        return next
      })
      // If this is the current step, advance to the next
      if (stepIndex === currentStep) {
        setExpandedStep(stepIndex)
        // Small delay to let user read the answer before advancing
        setTimeout(() => {
          setCurrentStep(stepIndex + 1)
          setExpandedStep(null)
        }, 600)
      }
    },
    [currentStep]
  )

  const handleStartOver = useCallback(() => {
    setCurrentStep(0)
    setSelections(new Map())
    setExpandedStep(null)
  }, [])

  const handleJumpTo = useCallback((step: number) => {
    setCurrentStep(step)
    setSelections((prev) => {
      const next = new Map(prev)
      // Clear selections from this step onward
      for (const key of [...next.keys()]) {
        if (key >= step) next.delete(key)
      }
      return next
    })
    setExpandedStep(null)
  }, [])

  if (nodes.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-federal-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(((isComplete ? totalSteps : currentStep) / totalSteps) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-neutral-500 whitespace-nowrap">
          {isComplete ? 'Complete' : `${currentStep + 1} of ${totalSteps}`}
        </span>
      </div>

      {/* Decision nodes */}
      <div className="space-y-3">
        {nodes.map((node, i) => {
          const options = getPathOptions(node)
          const selected = selections.get(i)
          const isCurrent = i === currentStep
          const isPast = i < currentStep
          const isFuture = i > currentStep
          const isExpanded = expandedStep === i

          return (
            <div
              key={i}
              className={`
                rounded-xl border transition-all duration-300
                ${isCurrent ? 'border-federal-300 bg-federal-50 shadow-sm' : ''}
                ${isPast ? 'border-neutral-200 bg-white' : ''}
                ${isFuture ? 'border-neutral-100 bg-neutral-50 opacity-50' : ''}
              `}
            >
              {/* Question header */}
              <button
                type="button"
                onClick={() => isPast ? handleJumpTo(i) : undefined}
                disabled={isFuture}
                className={`w-full text-left p-4 flex items-start gap-3 ${isPast ? 'cursor-pointer hover:bg-neutral-50 rounded-xl' : 'cursor-default'}`}
              >
                <span
                  className={`
                    flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${isCurrent ? 'bg-federal-600 text-white' : ''}
                    ${isPast ? 'bg-trust-600 text-white' : ''}
                    ${isFuture ? 'bg-neutral-200 text-neutral-400' : ''}
                  `}
                >
                  {isPast ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={`text-sm font-medium leading-snug ${isFuture ? 'text-neutral-400' : 'text-navy-800'}`}>
                  {node.node}
                </span>
              </button>

              {/* Options (visible when current or reviewing past) */}
              {(isCurrent || (isPast && selected)) && (
                <div className="px-4 pb-4 pl-14 space-y-2">
                  {isCurrent && !selected && (
                    <div className="flex flex-wrap gap-2">
                      {options.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleSelect(i, opt)}
                          className="px-4 py-2 text-sm font-medium rounded-lg border border-federal-300 text-federal-700 bg-white hover:bg-federal-100 hover:border-federal-400 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected answer */}
                  {selected && (
                    <div
                      className={`
                        text-sm rounded-lg p-3 transition-all duration-300
                        ${isExpanded ? 'bg-federal-100 border border-federal-200' : 'bg-neutral-50 border border-neutral-150'}
                      `}
                    >
                      <span className="font-semibold text-federal-700 text-xs uppercase tracking-wide">
                        {selected.label}:
                      </span>
                      <p className="mt-1 text-neutral-700 leading-relaxed">{selected.text}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion state */}
      {isComplete && (
        <div className="mt-6 rounded-xl border border-trust-200 bg-trust-50 p-5">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-trust-600 text-white flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <h3 className="font-semibold text-trust-800 text-base">Decision Guide Complete</h3>
              <p className="text-sm text-trust-700 mt-1">
                You've reviewed all the key decision points for {eventTitle.toLowerCase()}.
                Use your answers above to determine your best coverage path.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Start over button */}
      {(currentStep > 0 || selections.size > 0) && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleStartOver}
            className="text-sm text-neutral-500 hover:text-federal-700 transition-colors underline underline-offset-2"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  )
}
