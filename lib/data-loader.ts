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

function getIssuerStateMap(): Map<string, Set<string>> {
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
  const sbmStates = ['NJ', 'PA', 'WA', 'IL', 'KY', 'NV', 'OR', 'ID', 'GA', 'VA', 'ME']
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

  if (matchingKeys.length === 0) return []

  // Build issuer→state map if filtering by state
  const issuerStateMap = params.state_code ? getIssuerStateMap() : undefined

  // On Vercel: use HTTP Range requests against Blob-hosted formulary
  const blobUrl = getBlobUrl('formulary_intelligence.json')
  if (blobUrl) {
    return searchFormularyFromBlob(params, matchingKeys, index, blobUrl, issuerStateMap)
  }

  // Local: random-access file read
  const filepath = path.join(DATA_DIR, 'formulary_intelligence.json')
  if (!fs.existsSync(filepath)) return searchFormularySample(params)

  const results: FormularyDrug[] = []
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

  return results
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
      if (params.state_code && issuerStateMap) {
        const stateUpper = params.state_code.toUpperCase()
        const issuerIds = record.issuer_ids ?? (record.issuer_id ? [record.issuer_id] : [])
        const isInState = issuerIds.some((id) => issuerStateMap.get(id)?.has(stateUpper))
        if (!isInState) continue
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
 * Returns id + name pairs for every entry in the SBC index.
 * Used by generateStaticParams and the sitemap to build slugged URLs.
 */
export function getAllSbcPlans(): { plan_variant_id: string; plan_name: string }[] {
  const nameMap = new Map<string, string>()
  for (const p of loadPlanIntelligence().data) {
    if (p.plan_variant_id) nameMap.set(p.plan_variant_id, p.plan_name)
    nameMap.set(p.plan_id, p.plan_name)
  }
  return Object.keys(loadSbcIndex()).map((id) => ({
    plan_variant_id: id,
    plan_name: nameMap.get(id) ?? id,
  }))
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
 * Suitable for generateStaticParams on the /plans/[state]/[county] route.
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
