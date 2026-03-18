// ============================================================
// lib/plan-sources/federal-adapter.ts
//
// Adapter that wraps existing CMS PUF data loaders to satisfy
// the normalized PlanSourceAdapter interface.
//
// This is the current production adapter for all FFM states
// (those that use Healthcare.gov / federal marketplace).
//
// Data sourced from:
//   - CMS QHP Landscape PUF → plan_intelligence.json
//   - CMS Plan Attributes + BenCS PUF → sbc_decoded.json
//   - CMS Machine-Readable Formulary PUF → formulary_intelligence.json
// ============================================================

import {
  getPlansByCounty as _getPlansByCounty,
  getPlanById as _getPlanById,
  getSbcByPlanVariantId,
  searchFormulary as _searchFormulary,
} from '../data-loader'
import type { PlanRecord } from '../types'
import type {
  PlanSourceAdapter,
  PlanAdapter,
  FormularyAdapter,
  SbcAdapter,
  FormularySearchParams,
} from './types'

// ─── Plan adapter (wraps data-loader) ────────────────────────────────────────

const federalPlanAdapter: PlanAdapter = {
  getPlansByCounty(stateCode: string, countyFips: string): PlanRecord[] {
    return _getPlansByCounty(stateCode, countyFips)
  },

  getPlanById(planId: string): PlanRecord | undefined {
    return _getPlanById(planId)
  },
}

// ─── Formulary adapter ───────────────────────────────────────────────────────

const federalFormularyAdapter: FormularyAdapter = {
  async search(params: FormularySearchParams) {
    return _searchFormulary({
      drug_name: params.drug_name,
      state_code: params.state_code,
      issuer_id: params.issuer_id,
      plan_id: params.plan_id,
    })
  },
}

// ─── SBC adapter ─────────────────────────────────────────────────────────────

const federalSbcAdapter: SbcAdapter = {
  async getByPlanVariantId(planVariantId: string) {
    return getSbcByPlanVariantId(planVariantId)
  },
}

// ─── Combined adapter ─────────────────────────────────────────────────────────

export const federalAdapter: PlanSourceAdapter = {
  sourceId: 'federal_puf',
  plan: federalPlanAdapter,
  formulary: federalFormularyAdapter,
  sbc: federalSbcAdapter,
}
