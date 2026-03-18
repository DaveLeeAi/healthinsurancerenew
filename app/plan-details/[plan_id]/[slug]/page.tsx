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
//   app/[state-name]/[county-slug]/[county-page]/page.tsx
//   (dispatcher: routes -plan slugs to SBC page, -coverage slugs to drug page)

export const dynamic = 'force-dynamic'

interface Props {
  params: { plan_id: string; slug: string }
}

export default function PlanDetailsRedirect({ params }: Props) {
  const plan = getPlanById(params.plan_id)
  if (!plan) notFound()

  const stateSlug = stateCodeToSlug(plan.state_code)
  const planSlug = generatePlanSlug(plan.plan_name)

  // All ACA Marketplace plans carry a county_fips. Always redirect to the
  // county-aware canonical route: /{state}/{county}/{plan}-plan
  // Avoids the double-redirect that the state-level fallback would cause
  // (/{state}/{plan}-plan hits the county page, which issues a second 301).
  if (plan.county_fips) {
    const countySlug = getCountySlug(plan.county_fips)
    permanentRedirect(`/${stateSlug}/${countySlug}/${planSlug}`)
  }

  // Last-resort fallback for plans without county context (SBM edge cases).
  // The county page will resolve the county via data lookup and issue a
  // final redirect — two hops total, but only for plans missing county_fips.
  permanentRedirect(`/${stateSlug}/${planSlug}`)
}
