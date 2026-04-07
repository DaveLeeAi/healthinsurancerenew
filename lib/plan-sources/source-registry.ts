// ============================================================
// lib/plan-sources/source-registry.ts
//
// Maps each US state to its data source configuration.
//
// Federal (FFM) states use CMS PUF data via the federal adapter.
// State-Based Marketplace (SBM) states have their own exchanges and
// may have carrier-hosted or state-specific data — these use the sbm
// adapter, which is scaffolded for future implementation.
//
// When adding a new state-specific source:
// 1. Add the state code to SBM_STATES (or create a new category)
// 2. Implement the source in sbm-adapter.ts (or a state-specific adapter)
// 3. Update the entry below with the correct dataSourceUrl
// ============================================================

import type { PlanSourceEntry } from './types'

// ─── SBM state codes (operate their own exchange) ────────────────────────────
//
// These states do NOT use Healthcare.gov for enrollment.
// CMS PUF data may be partial or absent for these states.
// Full plan/formulary data requires state-specific adapters.

const SBM_STATES = new Set([
  'CA', // Covered California
  'CO', // Connect for Health Colorado
  'CT', // Access Health CT
  'DC', // DC Health Link
  'ID', // Your Health Idaho
  'KY', // kynect
  'MA', // Massachusetts Health Connector
  'MD', // Maryland Health Connection
  'ME', // CoverME.gov
  'MN', // MNsure
  'NJ', // GetCoveredNJ
  'NM', // beWellnm
  'NV', // Nevada Health Link
  'NY', // NY State of Health
  'OR', // OregonHealthPlan / OHA
  'PA', // Pennie
  'RI', // HealthSource RI
  'VT', // Vermont Health Connect
  'WA', // Washington Healthplanfinder
])

// ─── Federal source defaults ─────────────────────────────────────────────────

const FEDERAL_DEFAULTS: Omit<PlanSourceEntry, 'dataSourceName' | 'dataSourceUrl'> = {
  planSource: 'federal_puf',
  formularySource: 'federal_puf',
  sbcSource: 'federal_puf',
  hasCountyPlans: true,
  hasFormulary: true,
  hasSbc: true,
}

const FEDERAL_SOURCE_ENTRY: Pick<PlanSourceEntry, 'dataSourceName' | 'dataSourceUrl'> = {
  dataSourceName: 'Federal Marketplace Plan Data and Plan Benefit Documents',
  dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
}

// ─── SBM source defaults ────────────────────────────────────────────────────
//
// SBM states: plan county data is not in federal PUF.
// Formulary and SBC-like data may be available from carrier-hosted sources
// (CMS mandated machine-readable format even in SBM states).
// hasCountyPlans=false until a state-specific adapter is implemented.

const SBM_DEFAULTS: Omit<PlanSourceEntry, 'dataSourceName' | 'dataSourceUrl'> = {
  planSource: 'sbm_exchange',
  formularySource: 'federal_puf', // CMS MR-PUF formulary is available for most SBM carriers
  sbcSource: 'sbm_exchange',      // SBC-equivalent via state exchange (future)
  hasCountyPlans: false,
  hasFormulary: true,             // Formulary available via CMS MR-PUF for covered carriers
  hasSbc: false,                  // Not yet implemented for SBM states
}

// ─── Per-state exchange info ────────────────────────────────────────────────

const SBM_EXCHANGE_INFO: Partial<Record<string, Pick<PlanSourceEntry, 'dataSourceName' | 'dataSourceUrl'>>> = {
  CA: { dataSourceName: 'Covered California', dataSourceUrl: 'https://www.coveredca.com' },
  CO: { dataSourceName: 'Connect for Health Colorado', dataSourceUrl: 'https://connectforhealthco.com' },
  CT: { dataSourceName: 'Access Health CT', dataSourceUrl: 'https://www.accesshealthct.com' },
  DC: { dataSourceName: 'DC Health Link', dataSourceUrl: 'https://dchealthlink.com' },
  ID: { dataSourceName: 'Your Health Idaho', dataSourceUrl: 'https://yourhealthidaho.org' },
  KY: { dataSourceName: 'kynect', dataSourceUrl: 'https://kynect.ky.gov' },
  MA: { dataSourceName: 'Massachusetts Health Connector', dataSourceUrl: 'https://www.mahealthconnector.org' },
  MD: { dataSourceName: 'Maryland Health Connection', dataSourceUrl: 'https://www.marylandhealthconnection.gov' },
  ME: { dataSourceName: 'CoverME.gov', dataSourceUrl: 'https://coverme.gov' },
  MN: { dataSourceName: 'MNsure', dataSourceUrl: 'https://www.mnsure.org' },
  NJ: { dataSourceName: 'GetCoveredNJ', dataSourceUrl: 'https://www.getcovered.nj.gov' },
  NM: { dataSourceName: 'beWellnm', dataSourceUrl: 'https://www.bewellnm.com' },
  NV: { dataSourceName: 'Nevada Health Link', dataSourceUrl: 'https://www.nevadahealthlink.com' },
  NY: { dataSourceName: 'NY State of Health', dataSourceUrl: 'https://nystateofhealth.ny.gov' },
  OR: { dataSourceName: 'Oregon Health Plan', dataSourceUrl: 'https://healthcare.oregon.gov' },
  PA: { dataSourceName: 'Pennie', dataSourceUrl: 'https://pennie.com' },
  RI: { dataSourceName: 'HealthSource RI', dataSourceUrl: 'https://healthsourceri.com' },
  VT: { dataSourceName: 'Vermont Health Connect', dataSourceUrl: 'https://portal.healthconnect.vermont.gov' },
  WA: { dataSourceName: 'Washington Healthplanfinder', dataSourceUrl: 'https://www.wahealthplanfinder.org' },
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the source configuration for a given state code.
 * FFM states get federal PUF defaults.
 * SBM states get SBM defaults with exchange-specific info.
 */
export function getSourceEntry(stateCode: string): PlanSourceEntry {
  const code = stateCode.toUpperCase()

  if (SBM_STATES.has(code)) {
    const exchangeInfo = SBM_EXCHANGE_INFO[code] ?? {
      dataSourceName: 'State-Based Marketplace',
      dataSourceUrl: 'https://www.healthcare.gov/marketplace-in-your-state/',
    }
    return { ...SBM_DEFAULTS, ...exchangeInfo }
  }

  return { ...FEDERAL_DEFAULTS, ...FEDERAL_SOURCE_ENTRY }
}

/**
 * Returns true when a state uses the federal PUF as its primary plan source.
 * Use this to gate county-level plan comparison features.
 */
export function isFederalState(stateCode: string): boolean {
  return !SBM_STATES.has(stateCode.toUpperCase())
}

/**
 * Returns true when a state operates its own exchange.
 */
export function isSbmState(stateCode: string): boolean {
  return SBM_STATES.has(stateCode.toUpperCase())
}
