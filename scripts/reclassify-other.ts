/**
 * scripts/reclassify-other.ts
 *
 * Reads data/processed/drug_classifications.json, finds all "other" entries,
 * runs them through the 7 new archetype name-matchers, updates matches in-place,
 * and writes the result back. Logs a before/after count per archetype.
 *
 * Usage:
 *   npx tsx scripts/reclassify-other.ts
 *
 * SAFETY RULE: only modifies entries whose archetype is currently "other".
 * Any entry already classified as something else is left untouched.
 */

import fs from 'fs'
import path from 'path'
import { reclassifyByName, type DrugArchetype } from '../lib/drug-archetype'

const DATA_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/%20/g, ' ')),
  '../data/processed/drug_classifications.json'
)

type DrugRecord = {
  archetype: DrugArchetype
  isGeneric: boolean
  isBrand: boolean
  isSpecialty: boolean
  isInjectable: boolean
  isControlled: boolean
  isInsulin: boolean
  chronicOrAcute: 'chronic' | 'acute' | 'both'
  typicalFriction: 'low' | 'moderate' | 'high'
  costSensitivity: 'low' | 'moderate' | 'high'
  quantityLimitLikelihood: 'low' | 'moderate' | 'high'
}

// ─── Load ────────────────────────────────────────────────────────────────────

console.log(`Reading ${DATA_PATH} …`)
const raw = fs.readFileSync(DATA_PATH, 'utf8')
const classifications = JSON.parse(raw) as Record<string, DrugRecord>

const entries = Object.entries(classifications)
const totalEntries = entries.length

// ─── Count baseline ──────────────────────────────────────────────────────────

const baselineCounts: Record<string, number> = {}
for (const [, rec] of entries) {
  baselineCounts[rec.archetype] = (baselineCounts[rec.archetype] ?? 0) + 1
}
const otherBefore = baselineCounts['other'] ?? 0

console.log(`\nTotal entries: ${totalEntries}`)
console.log(`"other" entries before: ${otherBefore}`)
console.log()

// ─── Reclassify ──────────────────────────────────────────────────────────────

const newArchetypeCounts: Record<string, number> = {}
let matched = 0

for (const [drugName, rec] of entries) {
  // SAFETY: only touch 'other' entries
  if (rec.archetype !== 'other') continue

  const result = reclassifyByName(drugName)
  if (!result) continue

  // Update the record in-place
  rec.archetype            = result.archetype
  rec.chronicOrAcute       = result.chronicOrAcute
  rec.typicalFriction      = result.typicalFriction
  rec.costSensitivity      = result.costSensitivity
  rec.quantityLimitLikelihood = result.quantityLimitLikelihood

  newArchetypeCounts[result.archetype] = (newArchetypeCounts[result.archetype] ?? 0) + 1
  matched++
}

// ─── Write back ──────────────────────────────────────────────────────────────

console.log(`Writing updated classifications …`)
fs.writeFileSync(DATA_PATH, JSON.stringify(classifications, null, 2), 'utf8')
console.log(`Done.\n`)

// ─── Report ──────────────────────────────────────────────────────────────────

const otherAfter = otherBefore - matched
const otherPctRemaining = ((otherAfter / otherBefore) * 100).toFixed(1)

console.log('══════════════════════════════════════════════════════')
console.log('  RECLASSIFICATION REPORT')
console.log('══════════════════════════════════════════════════════')
console.log()
console.log(`  Total entries in file : ${totalEntries}`)
console.log(`  "other" before        : ${otherBefore}`)
console.log(`  Reclassified          : ${matched}`)
console.log(`  "other" after         : ${otherAfter}`)
console.log(`  "other" % remaining   : ${otherPctRemaining}%`)
console.log()
console.log('  Counts per new archetype:')

const NEW_ARCHETYPES = [
  'pain-chronic',
  'seizure-neuro',
  'gi-acid',
  'blood-pressure-other',
  'transplant-immuno',
  'oncology',
  'copd-maintenance',
] as const

for (const arch of NEW_ARCHETYPES) {
  const count = newArchetypeCounts[arch] ?? 0
  const pct = otherBefore > 0 ? ((count / otherBefore) * 100).toFixed(1) : '0.0'
  console.log(`    ${arch.padEnd(22)} : ${String(count).padStart(5)}  (${pct}% of prior "other")`)
}

console.log()
console.log('  Baseline archetype distribution (before):')
for (const [arch, count] of Object.entries(baselineCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${arch.padEnd(26)} : ${String(count).padStart(5)}`)
}
console.log()
console.log('  Archetype distribution (after, new archetypes only):')
for (const arch of NEW_ARCHETYPES) {
  const after = newArchetypeCounts[arch] ?? 0
  console.log(`    ${arch.padEnd(26)} : ${String(after).padStart(5)}`)
}
console.log()
