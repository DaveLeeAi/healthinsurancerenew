// ============================================================
// lib/plan-slug.ts
//
// Plan slug generation, parsing, and lookup utilities.
//
// Canonical public URL pattern for plan detail pages:
//   /{state-slug}/{county-slug}/{plan-name}-plan
//
// The state-level form /{state-slug}/{plan-name}-plan is a transient redirect
// target only — the county page resolves county from data and issues a 301 to
// the canonical county-aware URL. Do not emit it as a permanent canonical link.
//
// plan_id stays internal. Slugs are derived from plan_name.
// ============================================================

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
