#!/usr/bin/env node
/**
 * scripts/build_drug_autocomplete.js
 *
 * Builds a lightweight autocomplete index from the formulary drug index.
 * Extracts clean drug names (brand + generic), deduplicates, and ranks
 * by frequency (number of formulations = proxy for commonness).
 *
 * Input:  .cache/formulary_drug_index.json (36K+ verbose CMS drug entries)
 * Output: data/processed/drug_autocomplete.json (~1500-2000 clean names, ~30KB)
 *
 * Usage:  node scripts/build_drug_autocomplete.js
 */

const fs = require('fs')
const path = require('path')

const INDEX_PATH = path.join(process.cwd(), '.cache', 'formulary_drug_index.json')
const OUTPUT_PATH = path.join(process.cwd(), 'data', 'processed', 'drug_autocomplete.json')

// Common form/route words to strip when extracting generic names
const NOISE_WORDS = new Set([
  'oral', 'tablet', 'capsule', 'solution', 'injection', 'cream', 'ointment',
  'suspension', 'syrup', 'patch', 'gel', 'spray', 'inhaler', 'drops',
  'suppository', 'powder', 'film', 'lozenge', 'enema', 'kit', 'pack',
  'prefilled', 'syringe', 'pen', 'injector', 'vial', 'cartridge',
  'extended', 'release', 'delayed', 'chewable', 'disintegrating',
  'sublingual', 'buccal', 'topical', 'ophthalmic', 'nasal', 'rectal',
  'vaginal', 'transdermal', 'intramuscular', 'intravenous', 'subcutaneous',
  'mg', 'ml', 'mcg', 'mg/ml', 'unt', 'unt/ml', 'mg/mg',
  'hr', 'dose', 'mg/hr',
])

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function titleCase(str) {
  return str.split(/[\s-]+/).map(capitalize).join(' ')
}

function main() {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error('Drug index not found at', INDEX_PATH)
    console.error('Run: npm run build:indexes')
    process.exit(1)
  }

  console.log('Loading drug index...')
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'))
  const keys = Object.keys(index)
  console.log(`  ${keys.length} drug entries`)

  // frequency map: clean name → count of formulations
  const freq = new Map()

  for (const raw of keys) {
    // Strip surrounding quotes if present
    const key = raw.replace(/^"+|"+$/g, '').replace(/\\"/g, '"')

    // 1. Extract brand name from [brackets]
    const bracketMatch = key.match(/\[([^\]]+)\]/)
    if (bracketMatch) {
      const brand = bracketMatch[1].trim().toLowerCase()
      // Skip vaccine year suffixes and very short names
      if (brand.length >= 3 && !brand.match(/^\d/) && !brand.match(/\d{4}-\d{4}$/)) {
        freq.set(brand, (freq.get(brand) || 0) + 1)
      }
    }

    // 2. Extract generic name — first meaningful words before dosage
    const clean = key.replace(/^"+|"+$/g, '').replace(/\\"/g, '"')
    // Remove leading dosage like "0.5 ml " or "24 hr "
    const withoutLeadingDose = clean.replace(/^[\d.]+ *(ml|mg|mcg|hr|unt) */i, '')
    // Take text before first number that looks like a dosage
    const genericMatch = withoutLeadingDose.match(/^([a-z][a-z\s;,/-]+?)(?:\s+\d|\s+\[)/i)
    if (genericMatch) {
      let generic = genericMatch[1].trim().toLowerCase()
      // Clean up trailing semicolons, commas, slashes
      generic = generic.replace(/[;,/\s]+$/, '')
      // Split on " / " for combination drugs and take each part
      const parts = generic.split(/\s*\/\s*/)
      for (let part of parts) {
        part = part.trim()
        // Remove noise words from the end
        const words = part.split(/\s+/)
        while (words.length > 0 && NOISE_WORDS.has(words[words.length - 1])) {
          words.pop()
        }
        const cleaned = words.join(' ')
        if (cleaned.length >= 3 && !cleaned.match(/^\d/) && words.length <= 5) {
          freq.set(cleaned, (freq.get(cleaned) || 0) + 1)
        }
      }
    }
  }

  console.log(`  ${freq.size} unique names extracted`)

  // Sort by frequency descending, then alphabetically
  const sorted = [...freq.entries()]
    .filter(([name]) => {
      // Filter out noise: too short, starts with number, contains weird chars
      if (name.length < 3) return false
      if (name.match(/^\d/)) return false
      if (name.match(/[{}=<>]/)) return false
      // Filter out vaccine long names
      if (name.includes('vaccine') && name.length > 30) return false
      return true
    })
    .sort((a, b) => {
      // Higher frequency first
      if (b[1] !== a[1]) return b[1] - a[1]
      // Then alphabetical
      return a[0].localeCompare(b[0])
    })

  // Take top entries — aim for ~2000 for good coverage
  const MAX_ENTRIES = 2000
  const entries = sorted.slice(0, MAX_ENTRIES).map(([name, count]) => ({
    name: titleCase(name),
    freq: count,
  }))

  const output = {
    generated_at: new Date().toISOString(),
    total_source_keys: keys.length,
    entry_count: entries.length,
    drugs: entries,
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 0))
  const sizeKb = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1)
  console.log(`  Written ${entries.length} entries to ${OUTPUT_PATH} (${sizeKb} KB)`)

  // Show top 20
  console.log('\nTop 20 drugs by frequency:')
  entries.slice(0, 20).forEach((e, i) =>
    console.log(`  ${(i + 1).toString().padStart(2)}. ${e.name} (${e.freq} formulations)`)
  )
}

main()
