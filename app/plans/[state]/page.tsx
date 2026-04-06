import { redirect } from 'next/navigation'
import { stateCodeToSlug } from '@/lib/county-lookup'

// TODO: production — change to permanentRedirect for 301
// Redirect: /plans/[state] → /[state-slug]/health-insurance-plans
// e.g. /plans/nc → /north-carolina/health-insurance-plans

interface Props {
  params: { state: string }
}

export default function PlansStateRedirect({ params }: Props) {
  const stateSlug = stateCodeToSlug(params.state.toUpperCase())
  redirect(`/${stateSlug}/health-insurance-plans`)
}
