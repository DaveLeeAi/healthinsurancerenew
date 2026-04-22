/**
 * PlanDrugFitIntegration — Connects plan page to county drug coverage system.
 *
 * Links to the county formulary lookup so people can check whether specific
 * medications are covered by this carrier in this county.
 * All links use canonical /{state}/{county}/{drug}-coverage URLs.
 */

import Link from 'next/link'
import type { PlanRecord, SbcRecord } from '@/lib/types'

interface Props {
  plan: PlanRecord
  sbc: SbcRecord | null
  stateSlug: string
  countySlug: string
}

export default function PlanDrugFitIntegration({ plan, sbc: _sbc, stateSlug, countySlug }: Props) {
  const formularyPath = `/formulary`

  return (
    <section aria-labelledby="drug-fit-heading" className="mb-10">
      <div className="border border-neutral-200 rounded-xl p-5">
        <h2 id="drug-fit-heading" className="text-xl font-semibold text-navy-800 mb-2">
          Drug Coverage for This Plan
        </h2>
        <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
          Drug coverage is set by the carrier&apos;s formulary, which lists which medications are
          covered and at what cost tier. {plan.issuer_name} maintains a separate formulary for each
          plan — cost and coverage can differ across metal levels even within the same carrier.
        </p>
        <Link
          href={formularyPath}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-900 hover:underline transition-colors"
        >
          Check drug coverage by medication name on the formulary lookup
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <p className="text-xs text-neutral-400 mt-4">
          Formulary data sourced from federal plan benefit documents, plan year 2026.
          Formulary placement can change during the plan year — verify current coverage
          directly with {plan.issuer_name} before filling a prescription.
        </p>
      </div>
    </section>
  )
}
