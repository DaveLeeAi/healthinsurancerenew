// ============================================================
// lib/plan-sources/types.ts
//
// Normalized interfaces for plan/formulary/SBC data adapters.
//
// The public URL structure (/{state-slug}/{county-slug}/{plan-slug}-plan)
// remains stable regardless of which underlying source supplies the data.
// Source-specific adapters implement these interfaces so page components
// don't need to know where the data came from.
// ============================================================

import type { PlanRecord, SbcRecord, FormularyDrug } from '../types'

// ─── Source identifier ───────────────────────────────────────────────────────

export type PlanSourceId =
  | 'federal_puf'    // CMS QHP Landscape + Plan Attributes PUF (default for FFM states)
  | 'sbm_exchange'   // State-Based Marketplace exchange endpoint
  | 'carrier_api'    // Carrier-hosted machine-readable resource
  | 'state_endpoint' // State-specific API / data feed

// ─── Source registry entry ───────────────────────────────────────────────────

export interface PlanSourceEntry {
  /** Which adapter handles this state's plan data */
  planSource: PlanSourceId
  /** Which adapter handles this state's formulary data */
  formularySource: PlanSourceId
  /** Which adapter handles this state's SBC-equivalent data */
  sbcSource: PlanSourceId
  /** Human-readable name for attribution in UI */
  dataSourceName: string
  /** URL to the authoritative data source for attribution */
  dataSourceUrl: string
  /** Whether full county-level plan data is available from this source */
  hasCountyPlans: boolean
  /** Whether formulary lookup is available from this source */
  hasFormulary: boolean
  /** Whether SBC cost-sharing grid data is available from this source */
  hasSbc: boolean
}

// ─── Normalized plan lookup interface ───────────────────────────────────────
//
// Adapters return PlanRecord[] (defined in lib/types.ts).
// This keeps the page components source-agnostic.

export interface PlanAdapter {
  /** Returns all plans available in a county */
  getPlansByCounty(stateCode: string, countyFips: string): PlanRecord[]
  /** Returns a single plan by its internal plan_id or plan_variant_id */
  getPlanById(planId: string): PlanRecord | undefined
}

// ─── Normalized formulary lookup interface ───────────────────────────────────

export interface FormularySearchParams {
  drug_name: string
  state_code?: string
  issuer_id?: string
  plan_id?: string
}

export interface FormularyAdapter {
  search(params: FormularySearchParams): Promise<FormularyDrug[]>
}

// ─── Normalized SBC / plan detail interface ───────────────────────────────────

export interface SbcAdapter {
  /** Returns cost-sharing grid and exclusions for a plan variant */
  getByPlanVariantId(planVariantId: string): Promise<SbcRecord | null>
}

// ─── Combined source adapter ────────────────────────────────────────────────

export interface PlanSourceAdapter {
  sourceId: PlanSourceId
  plan: PlanAdapter
  formulary: FormularyAdapter
  sbc: SbcAdapter
}
