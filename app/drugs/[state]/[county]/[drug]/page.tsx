import { permanentRedirect } from 'next/navigation'
import { stateCodeToSlug, getFipsFromSlug, getCountySlug } from '@/lib/county-lookup'

// 301 redirect: /drugs/[state]/[county]/[drug] → /[state-slug]/[county-slug]/[drug]-coverage
// Accepts county param as either 5-digit FIPS or county slug.
// e.g. /drugs/nc/37183/metformin → /north-carolina/wake-county/metformin-coverage
// e.g. /drugs/nc/wake-county/metformin → /north-carolina/wake-county/metformin-coverage

interface Props {
  params: { state: string; county: string; drug: string }
}

export default function DrugsCountyRedirect({ params }: Props) {
  const stateCode = params.state.toUpperCase()
  const stateSlug = stateCodeToSlug(stateCode)

  // Resolve county param: 5-digit FIPS → slug, or pass existing slug through
  let countySlug: string
  if (/^\d{5}$/.test(params.county)) {
    countySlug = getCountySlug(params.county)
  } else {
    // Already a slug — normalise to lowercase-hyphenated just in case
    countySlug = params.county.toLowerCase()
    // Verify it resolves; if not, try to look up via FIPS path anyway
    const fips = getFipsFromSlug(countySlug, stateCode)
    if (fips) countySlug = getCountySlug(fips)
  }

  // Drug name already a plain slug; append -coverage suffix
  const drugSlug = params.drug.toLowerCase()

  permanentRedirect(`/${stateSlug}/${countySlug}/${drugSlug}-coverage`)
}
