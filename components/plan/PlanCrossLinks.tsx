/**
 * PlanCrossLinks — Cross-navigation to related pages.
 *
 * Links to:
 *   - County plans index (all plans in this county)
 *   - Similar plans (same metal tier, different carrier)
 *   - Financial tools (subsidy, rates, enhanced credits)
 *
 * All URLs use canonical route format. No /plans/, /plan-details/, or /states/ fallbacks.
 */

import Link from 'next/link'
import type { PlanRecord } from '@/lib/types'
import { generatePlanSlug } from '@/lib/plan-slug'

interface Props {
  plan: PlanRecord
  countyDisplay: string
  stateSlug: string
  countySlug: string
  stateCode: string
  countyFips: string
  countyPlans: PlanRecord[]
}

function normalizeMetalLevel(level: string): string {
  return level.toLowerCase().replace(/\s+/g, '_')
}

export default function PlanCrossLinks({
  plan,
  countyDisplay,
  stateSlug,
  countySlug,
  stateCode,
  countyFips,
  countyPlans,
}: Props) {
  const metal = normalizeMetalLevel(plan.metal_level)
  const metalDisplay = plan.metal_level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // Similar plans: same metal tier, different carrier, up to 3
  const similarPlans = countyPlans
    .filter(
      p =>
        p.plan_id !== plan.plan_id &&
        normalizeMetalLevel(p.metal_level) === metal &&
        p.issuer_name !== plan.issuer_name,
    )
    .slice(0, 3)

  // Other available metal tiers in this county
  const availableTiers = ['bronze', 'silver', 'gold', 'platinum']
    .filter(t => t !== metal)
    .filter(t => countyPlans.some(p => normalizeMetalLevel(p.metal_level) === t))

  return (
    <nav aria-label="Related coverage pages" className="mb-10">
      <h2 className="text-base font-semibold text-neutral-700 mb-4">Explore Related Coverage</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* All county plans */}
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
            All Plans in {countyDisplay}
          </p>
          <Link
            href={`/${stateSlug}/${countySlug}`}
            className="flex items-center justify-between text-sm font-medium text-primary-700 hover:text-primary-900 hover:underline"
          >
            Compare all {countyDisplay} plans
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          {availableTiers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {availableTiers.map(tier => (
                <Link
                  key={tier}
                  href={`/${stateSlug}/${countySlug}`}
                  className="px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full hover:bg-neutral-200 transition-colors"
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)} plans
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Financial tools */}
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
            Financial Tools for {countyDisplay}
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                href={`/subsidies/${stateCode}/${countyFips}`}
                className="flex items-center gap-2 text-sm text-primary-700 hover:underline font-medium"
              >
                <span aria-hidden="true">→</span> Estimate subsidy eligibility
              </Link>
            </li>
            <li>
              <Link
                href={`/rates/${stateCode}/${countyFips}`}
                className="flex items-center gap-2 text-sm text-primary-700 hover:underline font-medium"
              >
                <span aria-hidden="true">→</span> Rate volatility analysis
              </Link>
            </li>
            <li>
              <Link
                href={`/enhanced-credits/${stateCode}/${countyFips}`}
                className="flex items-center gap-2 text-sm text-primary-700 hover:underline font-medium"
              >
                <span aria-hidden="true">→</span> Enhanced credit impact scenarios
              </Link>
            </li>
          </ul>
        </div>

        {/* Similar plans from other carriers */}
        {similarPlans.length > 0 && (
          <div className="rounded-xl border border-neutral-200 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
              Similar {metalDisplay} Plans in {countyDisplay} (Other Carriers)
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {similarPlans.map(p => (
                <Link
                  key={p.plan_id}
                  href={`/${stateSlug}/${countySlug}/${generatePlanSlug(p.plan_name)}`}
                  className="block p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <p className="text-sm font-medium text-navy-900 leading-snug line-clamp-2">
                    {p.plan_name}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{p.issuer_name}</p>
                  {p.premiums?.age_40 != null && (
                    <p className="text-xs font-semibold text-primary-700 mt-1.5">
                      ${p.premiums.age_40.toLocaleString()}/mo (age 40)
                    </p>
                  )}
                  {p.deductible_individual != null && (
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Deductible: ${p.deductible_individual.toLocaleString()}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
