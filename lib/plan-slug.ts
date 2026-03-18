// ============================================================
// lib/plan-slug.ts
//
// Plan slug generation, parsing, and lookup utilities.
//
// Public URL pattern for plan detail pages:
//   /{state-slug}/{county-slug}/{plan-slug}-plan
//   /{state-slug}/{plan-slug}-plan  (state-level fallback)
//
// plan_id stays internal. Slugs are derived from plan_name.
// ============================================================

import { loadPlanIntelligence, getPlansByCounty } from './data-loader'
import type { PlanRecord } from './types'

/**
 * Converts a plan name to a public URL slug.
 *
 * Rules:
 * - Lowercase, hyphenated
 * - Always ends in "-plan" (our canonical suffix marker)
 * - If the slugified name already ends in "-plan", don't add another
 *
 * Examples:
 *   "Everyday Bronze"          → "everyday-bronze-plan"
 *   "Blue Cross Silver 2500"   → "blue-cross-silver-2500-plan"
 *   "Simple Choice HMO Plan"   → "simple-choice-hmo-plan"
 */
export function generatePlanSlug(planName: string): string {
  const base = planName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // Avoid double "-plan-plan" if name already ends in "plan"
  return base.endsWith('-plan') ? base : `${base}-plan`
}

/**
 * Validates and parses a URL segment as a plan slug.
 * Returns the full slug (including "-plan") if valid, null otherwise.
 *
 * "everyday-bronze-plan" → "everyday-bronze-plan"
 * "metformin-coverage"   → null  (drug slug, not a plan slug)
 * "wake-county"          → null  (county slug, not a plan slug)
 */
export function parsePlanSlug(raw: string): string | null {
  if (!raw.endsWith('-plan')) return null
  // Must have at least one word before "-plan"
  if (raw === '-plan' || raw.length <= 5) return null
  return raw
}

/**
 * Converts a plan slug back to a human-readable display name.
 * Used as a fallback when the actual plan record is not available.
 *
 * "everyday-bronze-plan" → "Everyday Bronze Plan"
 */
export function planSlugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Looks up a PlanRecord by its public slug + state + (optional) county.
 *
 * When countyFips is provided, only plans in that county are searched.
 * When omitted, all plans in the state are searched (state-level fallback).
 *
 * Returns undefined if no plan matches.
 */
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

/**
 * Returns the canonical public URL path for a plan.
 * Prefers county-aware URL when county_fips is present.
 *
 * Requires imported slugification helpers:
 *   stateCodeToSlug, getCountySlug from '@/lib/county-lookup'
 */
export function buildPlanCanonicalPath(
  plan: Pick<PlanRecord, 'plan_name' | 'state_code' | 'county_fips'>,
  stateSlug: string,
  countySlug: string | null
): string {
  const planSlug = generatePlanSlug(plan.plan_name)
  if (countySlug) {
    return `/${stateSlug}/${countySlug}/${planSlug}`
  }
  return `/${stateSlug}/${planSlug}`
}
