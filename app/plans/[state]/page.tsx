import { permanentRedirect } from 'next/navigation'
import { stateCodeToSlug } from '@/lib/county-lookup'

// Redirect: /plans/[state] → /[state-slug]/health-insurance-plans
// e.g. /plans/nc → /north-carolina/health-insurance-plans

interface Props {
  params: { state: string }
}

export default function PlansStateRedirect({ params }: Props) {
  const stateSlug = stateCodeToSlug(params.state.toUpperCase())
  permanentRedirect(`/${stateSlug}/health-insurance-plans`)
}
