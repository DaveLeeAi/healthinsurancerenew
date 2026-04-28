// Registry of {state, drug} pairs wired into the V79 page system.
//
// Adding a row here:
//   - pre-renders /{state}/{drug} via generateStaticParams in the
//     [state-name]/[county-slug] dispatcher
//   - emits the URL into the sitemap (only when indexable: true)
//   - causes /formulary/{issuer}/{drug} for the matching state to redirect
//   - subjects the pair to the validate:v79 scripts
//
// Removing a row reverts all three behaviors.
//
// This registry is SEPARATE from LOCKED_OZEMPIC_STATES in wired-states.ts,
// which governs the existing /formulary/[issuer]/[drug] LockedFormularyPage
// rendering for the 5 pilot states that have not yet been wired into the
// V79 system. The two registries serve different routes.

export interface WiredPair {
  state: string
  drug: string
  stateCode: string
  lastReviewedISO: string
  indexable: boolean
  // Per-pair occurrence-count overrides for the fact-drift validator.
  // Keys are documented in scripts/validate-v79-facts.ts.
  factsExpectations?: Record<string, number>
}

export const WIRED_PAIRS: ReadonlyArray<WiredPair> = [
  {
    state: 'north-carolina',
    drug: 'ozempic',
    stateCode: 'NC',
    lastReviewedISO: '2026-04-14',
    indexable: true,
  },
  {
    state: 'north-carolina',
    drug: 'metformin',
    stateCode: 'NC',
    lastReviewedISO: '2026-04-27',
    indexable: true,
  },
  {
    state: 'north-carolina',
    drug: 'jardiance',
    stateCode: 'NC',
    lastReviewedISO: '2026-04-27',
    indexable: true,
  },
  {
    state: 'north-carolina',
    drug: 'farxiga',
    stateCode: 'NC',
    lastReviewedISO: '2026-04-28',
    indexable: true,
  },
]

const PAIR_INDEX = new Map<string, WiredPair>(
  WIRED_PAIRS.map((p) => [`${p.state}/${p.drug}`, p]),
)

export function getWiredPair(
  state: string,
  drug: string,
): WiredPair | undefined {
  return PAIR_INDEX.get(`${state}/${drug}`)
}

export function isWiredPair(state: string, drug: string): boolean {
  return PAIR_INDEX.has(`${state}/${drug}`)
}

export function listIndexableWiredPairs(): WiredPair[] {
  return WIRED_PAIRS.filter((p) => p.indexable)
}

export function listAllWiredPairs(): WiredPair[] {
  return [...WIRED_PAIRS]
}

export function listAllWiredDrugSlugs(): string[] {
  return [...new Set(WIRED_PAIRS.map((p) => p.drug))]
}
