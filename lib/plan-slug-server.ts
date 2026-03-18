// Server-only: plan lookup by slug (requires data-loader / fs)
// Client components must NOT import this file.
import { loadPlanIntelligence, getPlansByCounty } from './data-loader'
import { generatePlanSlug } from './plan-slug'
import type { PlanRecord } from './types'

export function getPlanBySlug(
  fullSlug: string,
  stateCode: string,
  countyFips?: string
): PlanRecord | undefined {
  const candidates = countyFips
    ? getPlansByCounty(stateCode, countyFips)
    : loadPlanIntelligence().data.filter(
        (p) => p.state_code === stateCode.toUpperCase()
      )
  return candidates.find((p) => generatePlanSlug(p.plan_name) === fullSlug)
}
