import { permanentRedirect } from 'next/navigation'
import allStatesData from '../../../../data/config/all-states.json'

// ---------------------------------------------------------------------------
// 301 redirect: /states/{state}/aca-2026 → /{state}/health-insurance-plans
//
// The canonical state marketplace guide now lives at:
//   /{state}/health-insurance-plans
// (app/[state-name]/health-insurance-plans/page.tsx)
//
// This file exists only to handle any inbound links or bookmarks to the old
// /states/:state/aca-2026 pattern. next.config.js redirects also cover this
// at the edge for cached traffic.
// ---------------------------------------------------------------------------

interface Props {
  params: { state: string }
}

// Keep generateStaticParams so the redirect renders during the build and
// Next.js can emit the correct 308 response for every slug at build time.
export async function generateStaticParams() {
  return allStatesData.states.map((s) => ({ state: s.slug }))
}

export default function StateAca2026Redirect({ params }: Props) {
  permanentRedirect(`/${params.state}/health-insurance-plans`)
}
