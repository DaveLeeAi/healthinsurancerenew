// lib/formulary-lookup.ts
// Phase 5: Efficient single-record lookup for plan+drug pages
// Reads from pre-split per-state JSON files instead of 4GB master file

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data/processed/formulary/by-state')

interface FormularyRecord {
  drug_name?: string
  rxnorm_desc?: string
  plan_id?: string
  plan_variant_id?: string
  state_code?: string
  state?: string
  tier?: string | number
  prior_authorization?: boolean
  step_therapy?: boolean
  quantity_limit?: boolean
  [key: string]: unknown
}

// In-memory cache per state (populated on first request, cleared by ISR)
const stateCache = new Map<string, FormularyRecord[]>()

export function getStateFormularyData(stateCode: string): FormularyRecord[] {
  const normalized = stateCode.toUpperCase()

  if (stateCache.has(normalized)) {
    return stateCache.get(normalized)!
  }

  const filePath = join(DATA_DIR, `${normalized}.json`)
  if (!existsSync(filePath)) {
    console.warn(`[formulary-lookup] No data file for state: ${normalized}`)
    return []
  }

  try {
    const raw = readFileSync(filePath, 'utf-8')
    const records: FormularyRecord[] = JSON.parse(raw)
    stateCache.set(normalized, records)
    return records
  } catch (err) {
    console.error(`[formulary-lookup] Error reading ${filePath}:`, err)
    return []
  }
}

export function lookupPlanDrug(
  stateCode: string,
  drugName: string,
  planId: string
): FormularyRecord | null {
  const records = getStateFormularyData(stateCode)

  // Normalize for matching
  const drugLower = drugName.toLowerCase().replace(/-/g, ' ')
  const planLower = planId.toLowerCase()

  const match = records.find((r) => {
    const rDrug = (r.drug_name || r.rxnorm_desc || '').toLowerCase()
    const rPlan = (r.plan_id || r.plan_variant_id || '').toLowerCase()
    return rDrug.includes(drugLower) && rPlan.includes(planLower)
  })

  return match || null
}

export function lookupDrugAllPlans(
  stateCode: string,
  drugName: string
): FormularyRecord[] {
  const records = getStateFormularyData(stateCode)
  const drugLower = drugName.toLowerCase().replace(/-/g, ' ')

  return records.filter((r) => {
    const rDrug = (r.drug_name || r.rxnorm_desc || '').toLowerCase()
    return rDrug.includes(drugLower)
  })
}
