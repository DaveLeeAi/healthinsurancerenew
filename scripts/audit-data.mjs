/**
 * scripts/audit-data.mjs — Data layer verification for the full-stack audit
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(ROOT, 'data', 'processed')
const CACHE = path.join(ROOT, '.cache')

function loadJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA, filename), 'utf-8'))
}

// ─── 1. Plan Intelligence ───────────────────────────────────────────────
const pi = loadJSON('plan_intelligence.json')
const piSample = pi.data[0]
console.log('=== PLAN INTELLIGENCE ===')
console.log('Record count:', pi.data.length)
console.log('Sample keys:', Object.keys(piSample).join(', '))
console.log('Has plan_variant_id?', piSample.plan_variant_id !== undefined)
console.log('Has moop_individual?', 'moop_individual' in piSample)
console.log('Has oop_max_individual?', 'oop_max_individual' in piSample)
console.log('Has moop_family?', 'moop_family' in piSample)
console.log('Has oop_max_family?', 'oop_max_family' in piSample)
console.log('Has network_url?', 'network_url' in piSample)
console.log('Has sbc_url?', 'sbc_url' in piSample)
console.log('Has formulary_url?', 'formulary_url' in piSample)
const piWithVariant = pi.data.filter(p => p.plan_variant_id).length
console.log('Records with plan_variant_id:', piWithVariant, '/', pi.data.length)
console.log()

// ─── 2. SBC Index cross-check ───────────────────────────────────────────
const sbcIndex = JSON.parse(fs.readFileSync(path.join(CACHE, 'sbc_index.json'), 'utf-8'))
const sbcKeys = Object.keys(sbcIndex)
console.log('=== SBC INDEX ===')
console.log('Total entries:', sbcKeys.length)
console.log('Sample keys:', sbcKeys.slice(0, 3).join(', '))

// Read 3 SBC records via byte-offset
const sbcPath = path.join(DATA, 'sbc_decoded.json')
const fd = fs.openSync(sbcPath, 'r')
const testSbcKeys = [sbcKeys[0], sbcKeys[Math.floor(sbcKeys.length / 2)], sbcKeys[sbcKeys.length - 1]]
for (const key of testSbcKeys) {
  const entry = sbcIndex[key]
  const buf = Buffer.alloc(entry.length)
  fs.readSync(fd, buf, 0, entry.length, entry.offset)
  const raw = buf.toString('utf8').trimEnd().replace(/,\s*$/, '')
  try {
    const record = JSON.parse(raw)
    const gridCats = Object.keys(record.cost_sharing_grid || {})
    console.log(`  ${key}: grid=${gridCats.length} cats, excl=${(record.exclusions || []).length}, state=${record.state_code || 'N/A'}`)
  } catch (e) {
    console.log(`  ${key}: PARSE ERROR: ${e.message.slice(0, 80)}`)
  }
}
fs.closeSync(fd)

// Cross-check plan_variant_ids
const piVariantIds = pi.data.filter(p => p.plan_variant_id).map(p => p.plan_variant_id)
const piPlanIds = pi.data.map(p => p.plan_id)
const matchByVariant = piVariantIds.filter(id => sbcIndex[id]).length
const matchByPlanId = piPlanIds.filter(id => sbcIndex[id]).length
console.log('PI variant IDs matching SBC index:', matchByVariant, '/', piVariantIds.length)
console.log('PI plan IDs matching SBC index:', matchByPlanId, '/', piPlanIds.length)
// Show format comparison
console.log('PI plan_id sample:', piPlanIds.slice(0, 3))
console.log('SBC key sample:', sbcKeys.slice(0, 3))
console.log()

// ─── 3. Formulary ────────────────────────────────────────────────────────
const formularyIndex = JSON.parse(fs.readFileSync(path.join(CACHE, 'formulary_drug_index.json'), 'utf-8'))
const fKeys = Object.keys(formularyIndex)
console.log('=== FORMULARY INDEX ===')
console.log('Total drug keys:', fKeys.length)
const metforminKeys = fKeys.filter(k => k.includes('metformin'))
console.log('Metformin keys:', metforminKeys.length, metforminKeys.slice(0, 3))

if (metforminKeys.length > 0) {
  const key = metforminKeys[0]
  const entry = formularyIndex[key]
  const formularyPath = path.join(DATA, 'formulary_intelligence.json')
  const ffd = fs.openSync(formularyPath, 'r')
  const readLen = Math.min(entry.length, 5000)
  const buf = Buffer.alloc(readLen)
  fs.readSync(ffd, buf, 0, readLen, entry.offset)
  const blockText = buf.toString('utf8')
  const lines = blockText.split('\n').filter(l => l.trim().startsWith('{'))

  if (lines.length > 0) {
    const raw = lines[0].trim().replace(/,$/, '')
    try {
      const record = JSON.parse(raw)
      console.log('Sample record keys:', Object.keys(record).join(', '))
      console.log('drug_name:', record.drug_name)
      console.log('drug_tier:', record.drug_tier, '| type:', typeof record.drug_tier)
      console.log('prior_authorization:', record.prior_authorization, '| type:', typeof record.prior_authorization)
      console.log('issuer_name:', record.issuer_name, '| type:', typeof record.issuer_name)
      console.log('issuer_id:', record.issuer_id)
      console.log('issuer_ids:', record.issuer_ids)
      console.log('state_code:', record.state_code)
    } catch (e) {
      console.log('Parse error:', e.message.slice(0, 200))
    }
  }
  fs.closeSync(ffd)
}
console.log()

// ─── 4. Cross-county check ──────────────────────────────────────────────
const rv = loadJSON('rate_volatility.json')
const se = loadJSON('subsidy_engine.json')
const ps = loadJSON('policy_scenarios.json')
const testCounty = rv.data[0]
console.log('=== CROSS-COUNTY CHECK ===')
console.log('Test county:', testCounty.state_code, testCounty.county_fips)
console.log('In plan_intelligence:', pi.data.some(p => p.state_code === testCounty.state_code && p.county_fips === testCounty.county_fips) ? 'YES' : 'NO')
console.log('In subsidy_engine:', se.data.some(r => r.state_code === testCounty.state_code && r.county_fips === testCounty.county_fips) ? 'YES' : 'NO')
console.log('In policy_scenarios:', ps.records.some(r => r.state_code === testCounty.state_code && r.county_fips === testCounty.county_fips) ? 'YES' : 'NO')
console.log()

// ─── 5. Life Events action_steps check ──────────────────────────────────
const le = loadJSON('life_events.json')
console.log('=== LIFE EVENTS ===')
for (const event of le.data) {
  const hasActionSteps = Array.isArray(event.action_steps) && event.action_steps.length > 0
  const hasDecisionTree = Array.isArray(event.decision_tree) && event.decision_tree.length > 0
  console.log(`  ${event.slug}: action_steps=${hasActionSteps}, decision_tree=${hasDecisionTree}`)
}
console.log()

// ─── 6. Dental PLAN_YEAR check ──────────────────────────────────────────
const dc = loadJSON('dental_coverage.json')
console.log('=== DENTAL ===')
console.log('Metadata plan_year:', dc.metadata.plan_year)
console.log()

// ─── Summary ─────────────────────────────────────────────────────────────
console.log('=== FIELD MISMATCH SUMMARY ===')
console.log('ISSUE: plan_intelligence.json uses oop_max_individual/oop_max_family')
console.log('       but TypeScript PlanRecord has moop_individual/moop_family')
console.log('ISSUE: plan_intelligence.json has plan_variant_id on', piWithVariant, 'of', pi.data.length, 'records')
console.log('ISSUE: plan_intelligence.json uses sbc_url, TS interface uses network_url')
console.log('ISSUE: life_events.json has NO action_steps on any record (HowTo schema generates empty steps)')
console.log('ISSUE: dental page uses PLAN_YEAR=2026, all other pages use 2025')
