import { notFound, permanentRedirect } from 'next/navigation'
import { getPlanById } from '@/lib/data-loader'
import { stateCodeToSlug, getCountySlug } from '@/lib/county-lookup'
import { generatePlanSlug } from '@/lib/plan-slug'

// ─── Config ──────────────────────────────────────────────────────────────────
//
// This route is a permanent 301 redirect to the new canonical plan URL.
//
// Old pattern:  /plan-details/{plan_id}/{slug}
// New pattern:  /{state-slug}/{county-slug}/{plan-slug}-plan
//
// All incoming traffic to /plan-details/... is redirected permanently.
// The new canonical pages live at the county-level route:
//   app/[state-name]/[county-slug]/[drug-coverage]/page.tsx
//   (handles both -coverage and -plan slugs)

export const dynamic = 'force-dynamic'

interface Props {
  params: { plan_id: string; slug: string }
}

export default function PlanDetailsRedirect({ params }: Props) {
  const plan = getPlanById(params.plan_id)
  if (!plan) notFound()

  const stateSlug = stateCodeToSlug(plan.state_code)
  const planSlug = generatePlanSlug(plan.plan_name)

  // Prefer county-aware canonical route when county_fips is present
  if (plan.county_fips) {
    const countySlug = getCountySlug(plan.county_fips)
    permanentRedirect(`/${stateSlug}/${countySlug}/${planSlug}`)
  }

  // State-level fallback when county context is not available
  permanentRedirect(`/${stateSlug}/${planSlug}`)
}
