/**
 * lib/data-loader.ts
 *
 * Data loading layer for all 10 ACA dataset pillars.
 *
 * Loading strategy:
 *   Small datasets (<70 MB):  JSON.parse into module-level Map cache (loaded once per process)
 *   sbc_decoded.json (~6 MB slim): byte-offset index → seek-and-parse individual records
 *   formulary_intelligence.json (~44 MB deduped): drug-name block index → seek-and-parse matching lines
 *
 * Deployment strategy:
 *   Local dev:  All files read from data/processed/ on disk
 *   Vercel prod: Large files (>100 MB) fetched from Vercel Blob Storage via blob-manifest.json
 *                Small files bundled in the build
 *
 * Prerequisites for SBC + formulary lookups:
 *   Run `npm run build:indexes` once after downloading the data files.
 */

import path from 'path'
import fs from 'fs'
import type {
  PlanIntelligenceDataset,
  SubsidyDataset,
  SbcDataset,
  RateVolatilityDataset,
  FrictionQADataset,
  DentalDataset,
  BillingDataset,
  LifeEventsDataset,
  PolicyScenariosDataset,
  FormularySearchParams,
  FormularyDrug,
  SbcRecord,
  SubsidyRecord,
  RateVolatilityRecord,
  DentalRecord,
  FrictionQA,
  BillingScenario,
  LifeEventRecord,
  PolicyScenarioRecord,
  PlanRecord,
  DrugBaseline,
} from './types'
import type { SbcIndex, FormularyBlockIndex } from './data-index-builder'

const DATA_DIR = path.join(process.cwd(), 'data', 'processed')
const CACHE_DIR = path.join(process.cwd(), '.cache')
const IS_VERCEL = process.env.VERCEL === '1'

// ---------------------------------------------------------------------------
// Blob manifest — maps filenames to Vercel Blob URLs for large files
// Uploaded via: node scripts/upload-to-blob.mjs
// ---------------------------------------------------------------------------
interface BlobManifestEntry {
  url: string
  size: number
  uploadedAt: string
}
type BlobManifest = Record<string, BlobManifestEntry>

let blobManifestCache: BlobManifest | null = null

function loadBlobManifest(): BlobManifest {
  if (blobManifestCache) return blobManifestCache
  const manifestPath = path.join(DATA_DIR, 'blob-manifest.json')
  if (fs.existsSync(manifestPath)) {
    blobManifestCache = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as BlobManifest
  } else {
    blobManifestCache = {}
  }
  return blobManifestCache
}

/**
 * Returns the Blob URL for a file if running on Vercel and the file is in the manifest.
 * Returns null if the file should be loaded from disk.
 */
function getBlobUrl(filename: string): string | null {
  if (!IS_VERCEL) return null
  const manifest = loadBlobManifest()
  return manifest[filename]?.url ?? null
}

// ---------------------------------------------------------------------------
// Generic cached loader for small/medium datasets
// ---------------------------------------------------------------------------
const datasetCache = new Map<string, unknown>()

function loadCached<T>(filename: string, fallback?: T): T {
  if (datasetCache.has(filename)) return datasetCache.get(filename) as T
  const filepath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filepath)) {
    if (fallback !== undefined) {
      console.warn(`[data-loader] Dataset file not found — using empty fallback: ${filepath}`)
      return fallback
    }
    throw new Error(`[data-loader] Dataset file not found: ${filepath}`)
  }
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8')) as T
  datasetCache.set(filename, data)
  return data
}

/**
 * Async cached loader — fetches from Vercel Blob on prod, local file on dev.
 * Used for large files that are in Blob Storage on Vercel.
 */
async function loadCachedAsync<T>(filename: string): Promise<T> {
  if (datasetCache.has(filename)) return datasetCache.get(filename) as T

  const blobUrl = getBlobUrl(filename)
  if (blobUrl) {
    const res = await fetch(blobUrl)
    if (!res.ok) {
      throw new Error(`[data-loader] Failed to fetch ${filename} from Blob: ${res.status}`)
    }
    const data = (await res.json()) as T
    datasetCache.set(filename, data)
    return data
  }

  return loadCached<T>(filename)
}

// ---------------------------------------------------------------------------
// Index loaders (lazy, cached in module scope)
// ---------------------------------------------------------------------------
let sbcIndexCache: SbcIndex | null = null
let formularyIndexCache: FormularyBlockIndex | null = null

function loadSbcIndex(): SbcIndex {
  if (sbcIndexCache) return sbcIndexCache
  const indexPath = path.join(CACHE_DIR, 'sbc_index.json')
  if (!fs.existsSync(indexPath)) {
    console.warn('[data-loader] SBC index not found — run: npm run build:indexes')
    return {}
  }
  sbcIndexCache = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as SbcIndex
  return sbcIndexCache
}

function loadFormularyIndex(): FormularyBlockIndex {
  if (formularyIndexCache) return formularyIndexCache
  const indexPath = path.join(CACHE_DIR, 'formulary_drug_index.json')
  if (!fs.existsSync(indexPath)) {
    console.warn('[data-loader] Formulary index not found — run: npm run build:indexes')
    return {}
  }
  formularyIndexCache = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as FormularyBlockIndex
  return formularyIndexCache
}

// ---------------------------------------------------------------------------
// Pillar 1 — Plan Intelligence (~42 MB, cached)
// ---------------------------------------------------------------------------
export function loadPlanIntelligence(): PlanIntelligenceDataset {
  const dataset = loadCached<PlanIntelligenceDataset>('plan_intelligence.json', { metadata: { generated_at: '', source: '', record_count: 0 }, data: [] })
  // Resolve plan_name from metadata lookup (normalized out of records to save ~5 MB)
  const nameMap = dataset.metadata.plan_names
  if (nameMap && dataset.data.length > 0 && !dataset.data[0].plan_name) {
    for (const p of dataset.data) {
      p.plan_name = nameMap[p.plan_id] ?? p.plan_id
    }
  }
  // Alias oop_max_individual → moop_individual for component compatibility
  if (dataset.data.length > 0 && dataset.data[0].oop_max_individual != null && dataset.data[0].moop_individual == null) {
    for (const p of dataset.data) {
      if (p.oop_max_individual != null) p.moop_individual = p.oop_max_individual
    }
  }
  return dataset
}

export function getPlansByCounty(stateCode: string, countyFips: string): PlanRecord[] {
  return loadPlanIntelligence().data.filter(
    (p) => p.state_code === stateCode.toUpperCase() && p.county_fips === countyFips
  )
}

export function getPlanById(planId: string): PlanRecord | undefined {
  return loadPlanIntelligence().data.find(
    (p) => p.plan_id === planId || p.plan_variant_id === planId
  )
}

// ---------------------------------------------------------------------------
// Pillar 2 — Subsidy Engine (2.7 MB, cached)
// ---------------------------------------------------------------------------
export function loadSubsidyEngine(): SubsidyDataset {
  return loadCached<SubsidyDataset>('subsidy_engine.json', { metadata: { generated_at: '', source: '', record_count: 0 }, data: [] })
}

export function getSubsidyByCounty(stateCode: string, countyFips: string): SubsidyRecord | undefined {
  return loadSubsidyEngine().data.find(
    (r) => r.state_code === stateCode.toUpperCase() && r.county_fips === countyFips
  )
}

// ---------------------------------------------------------------------------
// Pillar 3 — SBC Decoded (~6 MB slim — byte-offset indexed for individual lookups)
// ---------------------------------------------------------------------------

/**
 * Read a single SBC record from sbc_decoded.json using a pre-built byte-offset index.
 * First call loads the ~1 MB index; subsequent calls go straight to disk seek.
 * Falls back to full scan if index is absent (slow, warns once).
 */
export async function getSbcByPlanVariantId(planVariantId: string): Promise<SbcRecord | null> {
  const index = loadSbcIndex()
  const entry = index[planVariantId]

  if (!entry) {
    // Not in index — index may be stale or not yet built
    return null
  }

  const filepath = path.join(DATA_DIR, 'sbc_decoded.json')
  if (!fs.existsSync(filepath)) return null

  const fd = await fs.promises.open(filepath, 'r')
  try {
    const buf = Buffer.alloc(entry.length)
    await fd.read(buf, 0, entry.length, entry.offset)
    // Raw bytes include leading whitespace and possible trailing comma — strip both
    const raw = buf.toString('utf8').trimEnd().replace(/,\s*$/, '')
    return JSON.parse(raw) as SbcRecord
  } finally {
    await fd.close()
  }
}

// ---------------------------------------------------------------------------
// Pillar 4 — Rate Volatility (0.6 MB, cached)
// ---------------------------------------------------------------------------
export function loadRateVolatility(): RateVolatilityDataset {
  return loadCached<RateVolatilityDataset>('rate_volatility.json', { metadata: { generated_at: '', source: '', record_count: 0 }, data: [] })
}

export function getRatesByCounty(stateCode: string, countyFips: string): RateVolatilityRecord | undefined {
  return loadRateVolatility().data.find(
    (r) => r.state_code === stateCode.toUpperCase() && r.county_fips === countyFips
  )
}

// ---------------------------------------------------------------------------
// Pillar 5 — Friction Q&A (0.1 MB, cached)
// ---------------------------------------------------------------------------
export function loadFrictionQA(): FrictionQADataset {
  return loadCached<FrictionQADataset>('friction_qa.json', { metadata: { generated_at: '', source: '', record_count: 0 }, data: [] })
}

export function getFrictionQAByCategory(category: string): FrictionQA[] {
  return loadFrictionQA().data.filter((q) => q.category === category)
}

export function getFrictionQABySlug(slug: string): FrictionQA | undefined {
  return loadFrictionQA().data.find(
    (q) => q.id === slug || q.question.toLowerCase().replace(/\W+/g, '-') === slug
  )
}

// ---------------------------------------------------------------------------
// Formulary helpers — issuer → state mapping (built from plan_intelligence)
// ---------------------------------------------------------------------------

let issuerStateMapCache: Map<string, Set<string>> | null = null

export function getIssuerStateMap(): Map<string, Set<string>> {
  if (issuerStateMapCache) return issuerStateMapCache
  const map = new Map<string, Set<string>>()

  // 1. FFM states from plan_intelligence.json
  const plans = loadPlanIntelligence()
  for (const plan of plans.data) {
    if (!plan.issuer_id || !plan.state_code) continue
    if (!map.has(plan.issuer_id)) map.set(plan.issuer_id, new Set())
    map.get(plan.issuer_id)!.add(plan.state_code.toUpperCase())
  }

  // 2. SBM states from per-state formulary files (formulary_sbm_NJ.json, etc.)
  const sbmStates = ['CA', 'CO', 'CT', 'DC', 'GA', 'ID', 'IL', 'KY', 'MA', 'MD', 'ME', 'MN', 'NJ', 'NM', 'NV', 'NY', 'OR', 'PA', 'VA', 'VT', 'WA']
  for (const state of sbmStates) {
    const sbmPath = path.join(DATA_DIR, `formulary_sbm_${state}.json`)
    if (!fs.existsSync(sbmPath)) continue
    try {
      const sbmData = JSON.parse(
        fs.readFileSync(sbmPath, 'utf-8')
      ) as { data?: Array<{ issuer_ids?: string[] }> }
      const records = sbmData.data ?? []
      for (const record of records) {
        for (const issuerId of (record.issuer_ids ?? [])) {
          if (!map.has(issuerId)) map.set(issuerId, new Set())
          map.get(issuerId)!.add(state)
        }
      }
    } catch {
      // skip missing or malformed files
    }
  }

  issuerStateMapCache = map
  return map
}

// ---------------------------------------------------------------------------
// Pillar 6 — Formulary Intelligence (7.2 GB on disk — block-range indexed)
//
// Index maps normalized drug_name → {offset, length} byte block.
// We read only the relevant byte block, then parse each NDJSON line inside it.
// ---------------------------------------------------------------------------

/**
 * Search formulary by drug name.
 *
 * Strategy by environment:
 *   Local dev:  byte-offset index → random-access read on 7.2 GB file (fast)
 *   Vercel prod: Formulary drug index uploaded to Blob; fetch matching block via Range request
 *                Falls back to formulary_sample if Blob is unavailable
 *
 * Requires .cache/formulary_drug_index.json built by `npm run build:indexes`.
 */
export async function searchFormulary(params: FormularySearchParams): Promise<FormularyDrug[]> {
  const index = loadFormularyIndex()

  // No index → fall back to sample file (or Blob sample)
  if (Object.keys(index).length === 0) {
    return searchFormularySample(params)
  }

  const searchLower = params.drug_name.toLowerCase().trim()
  const matchingKeys = Object.keys(index).filter((k) => k.includes(searchLower))

  // Build issuer→state map if filtering by state
  const issuerStateMap = params.state_code ? getIssuerStateMap() : undefined

  let results: FormularyDrug[] = []

  if (matchingKeys.length > 0) {
    // On Vercel: use HTTP Range requests against Blob-hosted formulary
    const blobUrl = getBlobUrl('formulary_intelligence.json')
    if (blobUrl) {
      results = await searchFormularyFromBlob(params, matchingKeys, index, blobUrl, issuerStateMap)
    } else {
      // Local: random-access file read
      const filepath = path.join(DATA_DIR, 'formulary_intelligence.json')
      if (fs.existsSync(filepath)) {
        const fd = await fs.promises.open(filepath, 'r')
        try {
          for (const key of matchingKeys.slice(0, 10)) {
            if (results.length >= 200) break
            const entry = index[key]
            const buf = Buffer.alloc(entry.length)
            await fd.read(buf, 0, entry.length, entry.offset)
            const block = buf.toString('utf8')
            parseFormularyBlock(block, params, results, issuerStateMap)
          }
        } finally {
          await fd.close()
        }
      }
    }
  }

  // SBM state fallback: if filtering by state and few/no FFM results,
  // also search the per-state SBM formulary file (formulary_sbm_XX.json)
  if (params.state_code && results.length < 5) {
    const sbmResults = searchSbmFormulary(params)
    if (sbmResults.length > 0) {
      // Merge, dedup by drug_name + drug_tier + issuer
      const existingKeys = new Set(
        results.map(r => `${r.drug_name}|${r.drug_tier}|${(r.issuer_ids ?? []).join(',')}`)
      )
      for (const r of sbmResults) {
        const key = `${r.drug_name}|${r.drug_tier}|${(r.issuer_ids ?? []).join(',')}`
        if (!existingKeys.has(key)) {
          results.push(r)
          existingKeys.add(key)
        }
      }
    }
  }

  return results
}

/** Search per-state SBM formulary file for a drug. */
function searchSbmFormulary(params: FormularySearchParams): FormularyDrug[] {
  if (!params.state_code) return []
  const state = params.state_code.toUpperCase()
  const sbmPath = path.join(DATA_DIR, `formulary_sbm_${state}.json`)
  if (!fs.existsSync(sbmPath)) return []

  try {
    const sbmData = JSON.parse(
      fs.readFileSync(sbmPath, 'utf-8')
    ) as { data?: FormularyDrug[] }
    const records = sbmData.data ?? []
    const searchLower = params.drug_name.toLowerCase().trim()

    return records.filter(r => {
      if (!r.drug_name) return false
      return r.drug_name.toLowerCase().includes(searchLower)
    }).slice(0, 200)
  } catch {
    return []
  }
}

/**
 * Fetch formulary blocks from Vercel Blob using HTTP Range requests.
 * Only downloads the byte ranges needed for matching drug names.
 */
async function searchFormularyFromBlob(
  params: FormularySearchParams,
  matchingKeys: string[],
  index: FormularyBlockIndex,
  blobUrl: string,
  issuerStateMap?: Map<string, Set<string>>
): Promise<FormularyDrug[]> {
  const results: FormularyDrug[] = []

  for (const key of matchingKeys.slice(0, 10)) {
    if (results.length >= 200) break
    const entry = index[key]

    try {
      const res = await fetch(blobUrl, {
        headers: {
          Range: `bytes=${entry.offset}-${entry.offset + entry.length - 1}`,
        },
      })
      if (!res.ok && res.status !== 206) continue
      const block = await res.text()
      parseFormularyBlock(block, params, results, issuerStateMap)
    } catch {
      // Skip failed range requests
    }
  }

  return results
}

/** Parse NDJSON lines from a formulary block and push matching records into results. */
function parseFormularyBlock(
  block: string,
  params: FormularySearchParams,
  results: FormularyDrug[],
  issuerStateMap?: Map<string, Set<string>>
): void {
  for (const line of block.split('\n')) {
    if (!line.startsWith('{')) continue
    if (results.length >= 200) break
    try {
      const record = JSON.parse(line.trim().replace(/,$/, '')) as FormularyDrug

      // State filter: check if any of the record's issuer_ids operate in the requested state
      // CRITICAL: Also strip out-of-state issuer_ids to prevent cross-state bleed
      if (params.state_code && issuerStateMap) {
        const stateUpper = params.state_code.toUpperCase()
        const issuerIds = record.issuer_ids ?? (record.issuer_id ? [record.issuer_id] : [])
        const inStateIds = issuerIds.filter((id) => issuerStateMap.get(id)?.has(stateUpper))
        if (inStateIds.length === 0) continue
        // Replace issuer_ids with only the in-state ones
        record.issuer_ids = inStateIds
        if (record.issuer_id && !inStateIds.includes(record.issuer_id)) {
          record.issuer_id = inStateIds[0]
        }
      }

      // Issuer filter
      if (params.issuer_id) {
        const issuerIds = record.issuer_ids ?? (record.issuer_id ? [record.issuer_id] : [])
        if (!issuerIds.includes(params.issuer_id)) continue
      }

      if (params.plan_id && record.plan_id !== params.plan_id) continue

      results.push(record)
    } catch {
      // skip malformed lines
    }
  }
}

async function searchFormularySample(_params: FormularySearchParams): Promise<FormularyDrug[]> {
  console.warn(
    '[formulary] formulary_intelligence.json not available — ' +
    'returning empty results. Run fetch_formulary_full.py to ' +
    'populate local data, or deploy to Vercel for Blob access.'
  )
  return []
}

// ---------------------------------------------------------------------------
// Pillar 7 — Dental Coverage (4.2 MB, cached)
// ---------------------------------------------------------------------------
export function loadDentalCoverage(): DentalDataset {
  return loadCached<DentalDataset>('dental_coverage.json', { metadata: { generated_at: '', source: '', record_count: 0 }, data: [] })
}

export function getDentalByState(stateCode: string): DentalRecord[] {
  return loadDentalCoverage().data.filter((p) => p.state_code === stateCode.toUpperCase())
}

export function getDentalByPlanVariant(planVariantId: string): DentalRecord | undefined {
  return loadDentalCoverage().data.find((p) => p.plan_variant_id === planVariantId)
}

// ---------------------------------------------------------------------------
// Pillar 8 — Billing Intelligence (0.1 MB, cached)
// ---------------------------------------------------------------------------
export function loadBillingIntel(): BillingDataset {
  return loadCached<BillingDataset>('billing_intel.json', { metadata: { generated_at: '', source: '', record_count: 0, cpt_code_disclaimer: '', disclaimer: '' }, data: [] })
}

export function getBillingByCptCode(cptCode: string): BillingScenario[] {
  return loadBillingIntel().data.filter((b) => {
    const c = b.how_it_gets_coded
    const codes: string[] = []
    if (c.code_1?.cpt) codes.push(c.code_1.cpt)
    if (c.code_2?.cpt) codes.push(c.code_2.cpt)
    for (const e of c.code_2_examples ?? []) codes.push(e.cpt)
    for (const e of c.facility_codes ?? []) codes.push(e.cpt)
    for (const e of c.physician_codes ?? []) codes.push(e.cpt)
    for (const e of c.ancillary_codes ?? []) codes.push(e.cpt)
    return codes.includes(cptCode)
  })
}

export function getBillingByCategory(category: string): BillingScenario | undefined {
  return loadBillingIntel().data.find((b) => b.billing_category === category)
}

export function getBillingAllCategories(): BillingScenario[] {
  return loadBillingIntel().data
}

// ---------------------------------------------------------------------------
// Pillar 9 — Life Events (0.05 MB, cached)
// ---------------------------------------------------------------------------
export function loadLifeEvents(): LifeEventsDataset {
  return loadCached<LifeEventsDataset>('life_events.json', { metadata: { generated_at: '', source: '', record_count: 0 }, data: [] })
}

export function getLifeEventBySlug(slug: string): LifeEventRecord | undefined {
  return loadLifeEvents().data.find((e) => e.slug === slug || e.id === slug)
}

export function getAllLifeEventSlugs(): string[] {
  return loadLifeEvents().data.map((e) => e.slug)
}

// ---------------------------------------------------------------------------
// Pillar 10 — Policy Scenarios (65 MB, cached)
// ---------------------------------------------------------------------------
export function loadPolicyScenarios(): PolicyScenariosDataset {
  return loadCached<PolicyScenariosDataset>('policy_scenarios.json', { metadata: { generated_at: '', source: '', record_count: 0 }, records: [] })
}

export function getPolicyByCounty(
  stateCode: string,
  countyFips: string
): PolicyScenarioRecord | undefined {
  return loadPolicyScenarios().records.find(
    (r) => r.state_code === stateCode.toUpperCase() && r.county_fips === countyFips
  )
}

// ---------------------------------------------------------------------------
// SBC helpers — plan variant IDs from the byte-offset index
// ---------------------------------------------------------------------------

/** Returns all plan_variant_ids from the SBC byte-offset index (~20K entries). */
export function getAllSbcPlanVariantIds(): string[] {
  return Object.keys(loadSbcIndex())
}

/**
 * Returns id + name + first-occurrence location for every entry in the SBC index.
 * Used by generateStaticParams and the sitemap to build canonical slugged URLs:
 *   /{state-slug}/{county-slug}/{plan-slug}
 *
 * state_code is the 2-letter code (e.g. "NC"); county_fips is the 5-digit FIPS.
 * Both are derived from the first plan_intelligence record that references this variant.
 */
export function getAllSbcPlans(): {
  plan_variant_id: string
  plan_name: string
  state_code: string
  county_fips: string
}[] {
  // Build a map: plan_variant_id → { name, state_code, county_fips } (first occurrence)
  const infoMap = new Map<string, { plan_name: string; state_code: string; county_fips: string }>()
  for (const p of loadPlanIntelligence().data) {
    const id = p.plan_variant_id ?? p.plan_id
    if (!infoMap.has(id)) {
      infoMap.set(id, {
        plan_name: p.plan_name,
        state_code: p.state_code ?? '',
        county_fips: p.county_fips ?? '',
      })
    }
    if (!infoMap.has(p.plan_id)) {
      infoMap.set(p.plan_id, {
        plan_name: p.plan_name,
        state_code: p.state_code ?? '',
        county_fips: p.county_fips ?? '',
      })
    }
  }
  return Object.keys(loadSbcIndex()).map((id) => {
    const info = infoMap.get(id)
    return {
      plan_variant_id: id,
      plan_name: info?.plan_name ?? id,
      state_code: info?.state_code ?? '',
      county_fips: info?.county_fips ?? '',
    }
  })
}

// ---------------------------------------------------------------------------
// Formulary helpers — issuer lookups from plan data
// ---------------------------------------------------------------------------

/** Returns the top N issuer IDs ranked by plan count in plan_intelligence.json. */
export function getTopIssuerIds(limit = 20): string[] {
  const counts = new Map<string, number>()
  for (const p of loadPlanIntelligence().data) {
    counts.set(p.issuer_id, (counts.get(p.issuer_id) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
}

/** Resolves an issuer ID to a human-readable name via plan_intelligence.json. */
export function getIssuerName(issuerId: string): string | undefined {
  return loadPlanIntelligence().data.find((p) => p.issuer_id === issuerId)?.issuer_name
}

// ---------------------------------------------------------------------------
// Formulary sitemap index (pre-built by scripts/etl/build_formulary_sitemap_index.py)
// ---------------------------------------------------------------------------

interface FormularySitemapIndex {
  metadata: {
    total_pairs: number
    unique_drugs: number
    unique_states: number
    states: string[]
    generated_at: string
  }
  pairs: string[] // "state-slug/drug-slug" entries
}

let formularySitemapCache: FormularySitemapIndex | null = null

/**
 * Load the pre-built formulary sitemap index.
 * Returns all valid state-slug/drug-slug pairs for sitemap generation.
 * Falls back to empty if index hasn't been generated yet.
 */
export function loadFormularySitemapIndex(): FormularySitemapIndex {
  if (formularySitemapCache) return formularySitemapCache
  const filepath = path.join(DATA_DIR, 'formulary_sitemap_index.json')
  if (!fs.existsSync(filepath)) {
    formularySitemapCache = { metadata: { total_pairs: 0, unique_drugs: 0, unique_states: 0, states: [], generated_at: '' }, pairs: [] }
    return formularySitemapCache
  }
  formularySitemapCache = JSON.parse(fs.readFileSync(filepath, 'utf-8')) as FormularySitemapIndex
  return formularySitemapCache
}

// ---------------------------------------------------------------------------
// Static params helpers (used by generateStaticParams in route pages)
// ---------------------------------------------------------------------------

/** Returns all state/county combos from the rate volatility dataset (fast, 0.6 MB). */
export function getAllStateCountyCombos(): { state: string; county: string }[] {
  return loadRateVolatility().data.map((r) => ({
    state: r.state_code.toLowerCase(),
    county: r.county_fips,
  }))
}

export function getAllLifeEventParams(): { event_type: string }[] {
  return getAllLifeEventSlugs().map((slug) => ({ event_type: slug }))
}

// ---------------------------------------------------------------------------
// State-level plan aggregation (for /[state-name]/health-insurance-plans)
// ---------------------------------------------------------------------------

export interface StateAggregateStats {
  planCount: number
  carrierCount: number
  carriers: string[]
  countyCount: number
  /** County FIPS codes — sorted by carrier count desc (proxy for population) */
  topCountyFips: string[]
  avgPremiumAge21: number | null
  avgPremiumAge40: number | null
  avgPremiumAge64: number | null
  lowestPremiumAge40: number | null
  highestPremiumAge40: number | null
  avgDeductible: number | null
  lowestDeductible: number | null
  premiumByMetal: Record<string, { avg40: number; min40: number; max40: number; count: number }>
}

/**
 * Aggregate plan statistics for an FFM state from rate_volatility + plan_intelligence.
 * Uses rate_volatility for fast per-county stats, and plan_intelligence for deductible data.
 */
export function getStateAggregateStats(stateCode: string): StateAggregateStats | null {
  const code = stateCode.toUpperCase()
  const countyRecords = loadRateVolatility().data.filter(r => r.state_code === code)
  if (countyRecords.length === 0) return null

  const allCarriers = new Set<string>()
  let totalPlans = 0
  const premiums21: number[] = []
  const premiums40: number[] = []
  const premiums64: number[] = []
  const metalAgg: Record<string, { sum40: number; min40: number; max40: number; count: number }> = {}

  // Sort counties by carrier_count desc (proxy for populous counties)
  const sorted = [...countyRecords].sort((a, b) => b.carrier_count - a.carrier_count)

  for (const r of countyRecords) {
    totalPlans += r.plan_count
    for (const c of r.carriers) allCarriers.add(c)
    if (r.avg_premium_age_21 > 0) premiums21.push(r.avg_premium_age_21)
    if (r.avg_premium_age_40 > 0) premiums40.push(r.avg_premium_age_40)
    if (r.avg_premium_age_64 > 0) premiums64.push(r.avg_premium_age_64)

    for (const [metal, stats] of Object.entries(r.by_metal_level ?? {})) {
      if (!stats) continue
      if (!metalAgg[metal]) metalAgg[metal] = { sum40: 0, min40: Infinity, max40: 0, count: 0 }
      metalAgg[metal].sum40 += stats.avg_premium_40 * stats.plan_count
      metalAgg[metal].count += stats.plan_count
      if (stats.min_premium_40 < metalAgg[metal].min40) metalAgg[metal].min40 = stats.min_premium_40
      if (stats.max_premium_40 > metalAgg[metal].max40) metalAgg[metal].max40 = stats.max_premium_40
    }
  }

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
  const min = (arr: number[]) => arr.length > 0 ? Math.round(Math.min(...arr)) : null

  // Deduplicate plan count across counties (rate_volatility counts per-county)
  // Use unique carrier count * avg plans per carrier as rough unique estimate
  const carriers = [...allCarriers].sort()

  // Get deductible data from plan_intelligence (sample — first county with data)
  const plans = loadPlanIntelligence().data.filter(p => p.state_code === code)
  const deductibles = plans
    .map(p => p.deductible_individual)
    .filter((d): d is number => d != null && d > 0)
  const uniquePlanIds = new Set(plans.map(p => p.plan_id))

  const premiumByMetal: Record<string, { avg40: number; min40: number; max40: number; count: number }> = {}
  for (const [metal, agg] of Object.entries(metalAgg)) {
    premiumByMetal[metal] = {
      avg40: Math.round(agg.sum40 / agg.count),
      min40: Math.round(agg.min40),
      max40: Math.round(agg.max40),
      count: agg.count,
    }
  }

  return {
    planCount: uniquePlanIds.size || totalPlans,
    carrierCount: carriers.length,
    carriers,
    countyCount: countyRecords.length,
    topCountyFips: sorted.slice(0, 10).map(r => r.county_fips),
    avgPremiumAge21: avg(premiums21),
    avgPremiumAge40: avg(premiums40),
    avgPremiumAge64: avg(premiums64),
    lowestPremiumAge40: min(premiums40),
    highestPremiumAge40: premiums40.length > 0 ? Math.round(Math.max(...premiums40)) : null,
    avgDeductible: avg(deductibles),
    lowestDeductible: min(deductibles),
    premiumByMetal,
  }
}

/**
 * Aggregate plan statistics for an SBM state from sbc_sbm_XX.json data.
 */
export function getSbmStateAggregateStats(stateCode: string): StateAggregateStats | null {
  const plans = loadSbmSbcData(stateCode)
  if (plans.length === 0) return null

  const STANDARD_CSR = new Set(['01', 'Standard'])
  const standardPlans = plans.filter(p => STANDARD_CSR.has(p.csr_variation))
  const carriers = [...new Set(standardPlans.map(p => p.issuer_name))].sort()

  const deductibles = standardPlans
    .map(p => typeof p.deductible_individual === 'number' ? p.deductible_individual : null)
    .filter((d): d is number => d != null && d > 0)

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
  const min = (arr: number[]) => arr.length > 0 ? Math.round(Math.min(...arr)) : null

  // Group by metal level
  const metalGroups: Record<string, number[]> = {}
  for (const p of standardPlans) {
    const m = p.metal_level
    if (!metalGroups[m]) metalGroups[m] = []
    const ded = typeof p.deductible_individual === 'number' ? p.deductible_individual : null
    if (ded != null) metalGroups[m].push(ded)
  }

  return {
    planCount: standardPlans.length,
    carrierCount: carriers.length,
    carriers,
    countyCount: 0,
    topCountyFips: [],
    avgPremiumAge21: null,
    avgPremiumAge40: null,
    avgPremiumAge64: null,
    lowestPremiumAge40: null,
    highestPremiumAge40: null,
    avgDeductible: avg(deductibles),
    lowestDeductible: min(deductibles),
    premiumByMetal: {},
  }
}

/**
 * Returns all unique state/county combos from subsidy_engine.json (2.7 MB, fast).
 * Suitable for generateStaticParams on the /subsidies/[state]/[county] route.
 */
export function getAllSubsidyStateCountyCombos(): { state: string; county: string }[] {
  const seen = new Set<string>()
  const result: { state: string; county: string }[] = []
  for (const r of loadSubsidyEngine().data) {
    const key = `${r.state_code}|${r.county_fips}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ state: r.state_code.toLowerCase(), county: r.county_fips })
    }
  }
  return result
}

/**
 * Returns all unique state/county combos from policy_scenarios.json (65 MB).
 * Suitable for generateStaticParams on the /enhanced-credits/[state]/[county] route.
 * 1,852 counties across 26 states.
 */
export function getAllPolicyStateCountyCombos(): { state: string; county: string }[] {
  const seen = new Set<string>()
  const result: { state: string; county: string }[] = []
  for (const r of loadPolicyScenarios().records) {
    const key = `${r.state_code}|${r.county_fips}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ state: r.state_code.toLowerCase(), county: r.county_fips })
    }
  }
  return result
}

/**
 * Returns all unique state codes from policy_scenarios.json, sorted alphabetically.
 */
export function getAllPolicyStates(): string[] {
  const states = new Set<string>()
  for (const r of loadPolicyScenarios().records) {
    states.add(r.state_code)
  }
  return [...states].sort()
}

/**
 * Returns all policy scenario records for a given state.
 */
export function getPolicyByState(stateCode: string): PolicyScenarioRecord[] {
  return loadPolicyScenarios().records.filter(
    (r) => r.state_code === stateCode.toUpperCase()
  )
}

/**
 * Returns all unique state/county combos present in plan_intelligence.json.
 * Suitable for generateStaticParams on the /sitemaps/plans route (canonical county pages).
 * Uses the module-level cache, so the ~42 MB file is loaded only once per build.
 */
export function getAllPlanStateCountyCombos(): { state: string; county: string }[] {
  const seen = new Set<string>()
  const result: { state: string; county: string }[] = []
  for (const p of loadPlanIntelligence().data) {
    const key = `${p.state_code}|${p.county_fips}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ state: p.state_code.toLowerCase(), county: p.county_fips })
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// SBM SBC data — per-state files parsed from carrier PDFs
// ---------------------------------------------------------------------------

export interface SbmSbcCostSharingGrid {
  primary_care?: string
  specialist?: string
  preventive_care?: string
  diagnostic_lab?: string
  imaging?: string
  generic_drugs_tier1?: string
  preferred_brand_tier2?: string
  nonpreferred_brand_tier3?: string
  specialty_tier4?: string
  er_facility?: string
  emergency_transport?: string
  urgent_care?: string
  inpatient_hospital_facility?: string
  outpatient_surgery_facility?: string
  mental_health_outpatient?: string
  mental_health_inpatient?: string
}

export interface SbmSbcRecord {
  plan_variant_id: string
  state_code: string
  issuer_id: string
  issuer_name: string
  plan_year: number
  metal_level: string
  metal_pct?: number | null
  csr_variation: string
  network_type: string
  marketplace_type?: string
  marketplace_label?: string
  is_hdhp?: boolean
  is_ai_an?: boolean
  plan_name_from_sbc: string
  plan_id: string | null
  source?: string
  source_file?: string
  deductible_individual: number | string | null
  deductible_family: number | string | null
  drug_deductible?: string | null
  oop_max_individual: number | string | null
  oop_max_family: number | string | null
  cost_sharing_grid?: SbmSbcCostSharingGrid
  exclusions?: string[]
}

const sbmSbcCache = new Map<string, SbmSbcRecord[]>()

/**
 * Load SBC plan records for a specific SBM state from sbc_sbm_XX.json.
 * Returns an empty array if the file doesn't exist.
 */
export function loadSbmSbcData(stateCode: string): SbmSbcRecord[] {
  const code = stateCode.toUpperCase()
  if (sbmSbcCache.has(code)) return sbmSbcCache.get(code)!
  const filePath = path.join(DATA_DIR, `sbc_sbm_${code}.json`)
  if (!fs.existsSync(filePath)) {
    sbmSbcCache.set(code, [])
    return []
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as {
      data?: SbmSbcRecord[]
    }
    const records = raw.data ?? []
    sbmSbcCache.set(code, records)
    return records
  } catch {
    sbmSbcCache.set(code, [])
    return []
  }
}

/**
 * Generate a URL slug from an SBM plan name.
 * Mirrors generatePlanSlug() in lib/plan-slug.ts — kept here to avoid
 * circular imports since data-loader is used server-side only.
 */
export function generateSbmPlanSlug(planName: string): string {
  const base = planName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base.endsWith('-plan') ? base : `${base}-plan`
}

/**
 * Look up a single SBM plan by state code and URL slug derived from plan name.
 * Prefers plan_year === 2026 and marketplace_type === 'iex' (on-exchange).
 * Returns the first match or null if not found.
 */
export function getSbmPlanBySlug(
  stateCode: string,
  slug: string
): SbmSbcRecord | null {
  const all = loadSbmSbcData(stateCode)
  const matches = all.filter(
    (p) => generateSbmPlanSlug(p.plan_name_from_sbc) === slug
  )
  if (matches.length === 0) return null
  // Prefer 2026 on-exchange first, then any 2026, then fall back
  return (
    matches.find((p) => p.plan_year === 2026 && p.marketplace_type === 'iex') ??
    matches.find((p) => p.plan_year === 2026) ??
    matches[0]
  )
}

/**
 * Return all SBM plans for a state, deduplicated by plan name + year,
 * filtered to on-exchange (iex) plans only, sorted by metal level then name.
 * Used for generateStaticParams on SBM plan detail pages.
 */
export function getSbmPlansForStaticParams(
  stateCode: string
): SbmSbcRecord[] {
  const all = loadSbmSbcData(stateCode)
  const seen = new Set<string>()
  const result: SbmSbcRecord[] = []
  // 2026 iex first, then 2025 iex as fallback
  const sorted = [
    ...all.filter((p) => p.plan_year === 2026 && p.marketplace_type === 'iex'),
    ...all.filter((p) => p.plan_year === 2025 && p.marketplace_type === 'iex'),
  ]
  for (const p of sorted) {
    const slug = generateSbmPlanSlug(p.plan_name_from_sbc)
    if (!seen.has(slug)) {
      seen.add(slug)
      result.push(p)
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Pillar 6b — Drug National Baselines (content differentiation)
// ---------------------------------------------------------------------------

interface DrugBaselinesFile {
  metadata: { generated_at: string; drug_count: number }
  data: Record<string, DrugBaseline>
}

let drugBaselinesCache: Record<string, DrugBaseline> | null = null

/**
 * Returns national + per-state baseline stats for a drug, or null if the
 * baselines file hasn't been generated yet or the drug isn't in it.
 *
 * drugName is the raw display name — it will be normalised to lowercase for lookup.
 */
export function getDrugBaseline(drugName: string): DrugBaseline | null {
  if (!drugBaselinesCache) {
    const filepath = path.join(DATA_DIR, 'drug_national_baselines.json')
    if (!fs.existsSync(filepath)) {
      return null
    }
    try {
      const file = JSON.parse(fs.readFileSync(filepath, 'utf-8')) as DrugBaselinesFile
      drugBaselinesCache = file.data ?? {}
    } catch {
      return null
    }
  }
  const key = drugName.trim().toLowerCase()
  return drugBaselinesCache[key] ?? null
}
