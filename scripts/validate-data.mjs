/**
 * scripts/validate-data.mjs
 *
 * Pre-build validation: checks that all 10 ACA dataset JSON files exist
 * and contain expected minimum record counts.
 *
 * Run: node scripts/validate-data.mjs
 * Exits 0 on success, 1 on any failure.
 *
 * Large files (gitignored, >100 MB) are marked optional — they are served
 * from Vercel Blob in production and may not be present locally or in CI.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data', 'processed')

/**
 * @typedef {{ file: string, dataKey: string, minRecords: number, optional: boolean }} DatasetSpec
 */

/** @type {DatasetSpec[]} */
const DATASETS = [
  // --- Required (committed to git, <100 MB) ---
  { file: 'subsidy_engine.json',     dataKey: 'data',    minRecords: 100,    optional: false },
  { file: 'rate_volatility.json',    dataKey: 'data',    minRecords: 50,     optional: false },
  { file: 'friction_qa.json',        dataKey: 'data',    minRecords: 40,     optional: false },
  { file: 'dental_coverage.json',    dataKey: 'data',    minRecords: 500,    optional: false },
  { file: 'billing_intel.json',      dataKey: 'data',    minRecords: 15,     optional: false },
  { file: 'life_events.json',        dataKey: 'data',    minRecords: 5,      optional: false },

  // --- Optional (gitignored, >100 MB — served from Vercel Blob in prod) ---
  { file: 'plan_intelligence.json',  dataKey: 'data',    minRecords: 1000,   optional: true },
  { file: 'sbc_decoded.json',        dataKey: 'data',    minRecords: 10000,  optional: true },
  { file: 'policy_scenarios.json',   dataKey: 'records', minRecords: 1000,   optional: true },
  { file: 'formulary_intelligence.json', dataKey: null,   minRecords: 0,     optional: true },
]

let passed = 0
let failed = 0
let skipped = 0

console.log('=== ACA Data Validation ===\n')

for (const spec of DATASETS) {
  const filepath = path.join(DATA_DIR, spec.file)
  const exists = fs.existsSync(filepath)

  if (!exists) {
    if (spec.optional) {
      console.log(`  SKIP  ${spec.file} — optional, not present (served from Blob in prod)`)
      skipped++
      continue
    }
    console.error(`  FAIL  ${spec.file} — MISSING (required for build)`)
    failed++
    continue
  }

  const stat = fs.statSync(filepath)
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(1)

  // Formulary is NDJSON — can't JSON.parse the whole 7.2 GB
  if (spec.dataKey === null) {
    if (stat.size > 0) {
      console.log(`  OK    ${spec.file} — ${sizeMB} MB (NDJSON, size check only)`)
      passed++
    } else {
      console.error(`  FAIL  ${spec.file} — file is empty`)
      failed++
    }
    continue
  }

  // For parseable JSON: validate structure and record count
  try {
    const raw = fs.readFileSync(filepath, 'utf-8')
    const parsed = JSON.parse(raw)
    const records = parsed[spec.dataKey]

    if (!Array.isArray(records)) {
      console.error(`  FAIL  ${spec.file} — missing "${spec.dataKey}" array at top level`)
      failed++
      continue
    }

    if (records.length < spec.minRecords) {
      console.error(
        `  FAIL  ${spec.file} — ${records.length} records (expected ≥${spec.minRecords})`
      )
      failed++
      continue
    }

    console.log(`  OK    ${spec.file} — ${records.length.toLocaleString()} records, ${sizeMB} MB`)
    passed++
  } catch (err) {
    console.error(`  FAIL  ${spec.file} — parse error: ${err.message}`)
    failed++
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${skipped} skipped ===`)

if (failed > 0) {
  console.error('\nBuild validation FAILED. Fix missing/invalid data files before building.')
  process.exit(1)
}

console.log('\nAll required datasets validated. Ready to build.')
