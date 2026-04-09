import { permanentRedirect } from 'next/navigation'
import { stateCodeToSlug, getCountySlug } from '@/lib/county-lookup'

// Redirect: /plans/[state]/[county] → /[state-slug]/[county-slug]
// e.g. /plans/nc/37183 → /north-carolina/wake-county

interface Props {
  params: { state: string; county: string }
}

export default function PlansCountyRedirect({ params }: Props) {
  const stateSlug = stateCodeToSlug(params.state.toUpperCase())
  const countySlug = getCountySlug(params.county)
  permanentRedirect(`/${stateSlug}/${countySlug}`)
}
