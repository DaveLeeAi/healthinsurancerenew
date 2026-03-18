// ============================================================
// lib/plan-sources/sbm-adapter.ts
//
// Scaffold adapter for State-Based Marketplace (SBM) states.
//
// SBM states operate their own exchanges and may provide plan,
// formulary, and SBC-equivalent data through state-specific
// endpoints rather than the federal CMS PUF.
//
// CURRENT STATUS: Scaffold only.
//   - Plan lookup: not yet implemented (returns empty)
//   - Formulary: delegates to federal adapter (CMS MR-PUF covers most SBM carriers)
//   - SBC: not yet implemented (returns null)
//
// TO IMPLEMENT for a specific state:
//   1. Create lib/plan-sources/states/sbm-{state}.ts
//   2. Implement PlanAdapter, FormularyAdapter, SbcAdapter for that state
//   3. Register the state adapter in getAdapterForState() below
//   4. Update source-registry.ts hasCountyPlans / hasSbc flags
//
// Example state adapter file: lib/plan-sources/states/sbm-wa.ts
//   - Fetches from Washington Healthplanfinder API
//   - Normalizes to PlanRecord / SbcRecord / FormularyDrug shapes
// ============================================================

import type {
  PlanSourceAdapter,
  PlanAdapter,
  FormularyAdapter,
  SbcAdapter,
} from './types'
import { federalAdapter } from './federal-adapter'
import type { PlanRecord } from '../types'

// ─── Scaffold plan adapter ───────────────────────────────────────────────────
//
// SBM plan data is not in federal PUF. Until state-specific adapters
// are built, county plan lookup returns empty arrays for SBM states.
// The state plans page (/{state}/health-insurance-plans) handles this
// gracefully by showing the SBM exchange info panel instead.

const sbmPlanAdapter: PlanAdapter = {
  getPlansByCounty(_stateCode: string, _countyFips: string): PlanRecord[] {
    // TODO: implement per-state via lib/plan-sources/states/sbm-{state}.ts
    return []
  },

  getPlanById(_planId: string): PlanRecord | undefined {
    // TODO: implement per-state
    return undefined
  },
}

// ─── Formulary adapter ───────────────────────────────────────────────────────
//
// CMS mandates machine-readable formulary files even for SBM-state carriers.
// Most SBM carrier formularies are present in formulary_intelligence.json.
// Delegate to the federal adapter for formulary lookups.

const sbmFormularyAdapter: FormularyAdapter = federalAdapter.formulary

// ─── Scaffold SBC adapter ────────────────────────────────────────────────────
//
// SBC cost-sharing data for SBM states is not in the federal BenCS PUF.
// Until state-specific SBC sources are integrated, returns null.

const sbmSbcAdapter: SbcAdapter = {
  async getByPlanVariantId(_planVariantId: string) {
    // TODO: implement per-state via carrier-hosted SBC or state exchange API
    return null
  },
}

// ─── Combined SBM adapter ────────────────────────────────────────────────────

export const sbmAdapter: PlanSourceAdapter = {
  sourceId: 'sbm_exchange',
  plan: sbmPlanAdapter,
  formulary: sbmFormularyAdapter,
  sbc: sbmSbcAdapter,
}

// ─── Adapter resolver ────────────────────────────────────────────────────────

/**
 * Returns the best available adapter for a given state code.
 *
 * Currently returns the federal adapter for FFM states and the SBM
 * scaffold for SBM states. As state-specific adapters are built,
 * add them here before the generic sbmAdapter fallback.
 *
 * @example
 *   const adapter = getAdapterForState('WA')
 *   const plans = adapter.plan.getPlansByCounty('WA', '53033')
 */
export function getAdapterForState(stateCode: string): PlanSourceAdapter {
  const code = stateCode.toUpperCase()

  // Future: add state-specific adapters here as they are built
  // Example:
  //   case 'WA': return waAdapter  // lib/plan-sources/states/sbm-wa.ts
  //   case 'CA': return caAdapter

  // FFM states (most states): use federal PUF adapter
  const SBM_STATES = new Set([
    'CA', 'CO', 'CT', 'DC', 'ID', 'KY', 'MA', 'MD', 'ME',
    'MN', 'NJ', 'NM', 'NV', 'NY', 'OR', 'PA', 'RI', 'VT', 'WA',
  ])

  if (!SBM_STATES.has(code)) {
    return federalAdapter
  }

  return sbmAdapter
}
