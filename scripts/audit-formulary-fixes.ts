/**
 * Quick audit script to validate the 4 formulary fixes.
 * Run: npx tsx scripts/audit-formulary-fixes.ts
 */
import {
  searchFormulary,
  getIssuerStateMap,
} from '../lib/data-loader'
import {
  classifyTier,
  humanizeTierForDrug,
  humanizeTiersForDrug,
  getDominantTierGroupForDrug,
  isInsulinDrug,
  isBiologicDrug,
} from '../lib/formulary-helpers'

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  FORMULARY FIX AUDIT')
  console.log('═══════════════════════════════════════════════════\n')

  // ── 1. Mississippi cross-bleed check ──
  console.log('── CHECK 1: Mississippi cross-bleed (ozempic) ──')
  const msResults = await searchFormulary({ drug_name: 'ozempic', state_code: 'MS' })
  const msIssuerIds = new Set<string>()
  for (const r of msResults) {
    for (const id of (r.issuer_ids ?? (r.issuer_id ? [r.issuer_id] : []))) {
      msIssuerIds.add(id)
    }
  }
  console.log(`  Records: ${msResults.length}`)
  console.log(`  Unique issuer IDs: ${msIssuerIds.size}`)
  console.log(`  Issuer IDs: ${[...msIssuerIds].join(', ')}`)

  // Cross-check: verify all issuer IDs actually serve MS
  const stateMap = getIssuerStateMap()
  let bleedCount = 0
  for (const id of msIssuerIds) {
    const states = stateMap.get(id)
    if (!states?.has('MS')) {
      console.log(`  ⚠️ BLEED: ${id} does NOT serve MS (serves: ${states ? [...states].join(',') : 'unknown'})`)
      bleedCount++
    }
  }
  console.log(bleedCount === 0 ? '  ✅ No cross-state bleed detected' : `  ❌ ${bleedCount} issuers bleeding from other states`)

  // 5-state check
  console.log('\n── 5-state cross-bleed summary ──')
  for (const state of ['MS', 'NC', 'TX', 'FL', 'OH']) {
    const results = await searchFormulary({ drug_name: 'metformin', state_code: state })
    const ids = new Set<string>()
    for (const r of results) {
      for (const id of (r.issuer_ids ?? (r.issuer_id ? [r.issuer_id] : []))) {
        ids.add(id)
      }
    }
    console.log(`  ${state}: ${results.length} records, ${ids.size} unique issuers`)
  }

  // ── 2. NC metformin dominant tier ──
  console.log('\n── CHECK 2: /formulary/north-carolina/metformin — dominant tier ──')
  const ncMet = await searchFormulary({ drug_name: 'metformin', state_code: 'NC' })
  const ncTiers = ncMet.map(r => r.drug_tier).filter(Boolean) as string[]
  const ncDominant = getDominantTierGroupForDrug(ncTiers, 'metformin')
  const ncHuman = humanizeTierForDrug(ncTiers[0], 'metformin')
  console.log(`  Records: ${ncMet.length}`)
  console.log(`  Raw tiers: ${[...new Set(ncTiers)].join(', ')}`)
  console.log(`  Dominant group: ${ncDominant}`)
  console.log(`  Display: ${ncHuman.shortLabel} / ${ncHuman.costRange}`)
  console.log(ncDominant === 'generic' ? '  ✅ Generic as expected' : `  ⚠️ Expected generic, got ${ncDominant}`)

  // ── 3. TX atorvastatin unknown tiers ──
  console.log('\n── CHECK 3: /formulary/texas/atorvastatin — unknown tiers ──')
  const txAtor = await searchFormulary({ drug_name: 'atorvastatin', state_code: 'TX' })
  const txTiers = txAtor.map(r => r.drug_tier).filter(Boolean) as string[]
  const txClassified = txTiers.map(t => ({ raw: t, group: classifyTier(t) }))
  const unknowns = txClassified.filter(t => t.group === 'unknown')
  console.log(`  Records: ${txAtor.length}`)
  console.log(`  Raw tiers: ${[...new Set(txTiers)].join(', ')}`)
  console.log(`  Unknown tiers: ${unknowns.length}`)
  if (unknowns.length > 0) {
    console.log(`  ⚠️ Unknown raw labels: ${[...new Set(unknowns.map(u => u.raw))].join(', ')}`)
  } else {
    console.log('  ✅ No unknown tiers')
  }

  // ── 4. Insulin check ──
  console.log('\n── CHECK 4: Insulin — $35 or $0? ──')
  for (const drug of ['insulin glargine', 'humulin', 'novolog']) {
    const results = await searchFormulary({ drug_name: drug })
    if (results.length === 0) {
      console.log(`  ${drug}: no results (may not be in dataset)`)
      continue
    }
    const tiers = results.map(r => r.drug_tier).filter(Boolean) as string[]
    const humanTiers = humanizeTiersForDrug(tiers, drug)
    console.log(`  ${drug}: ${results.length} records`)
    for (const ht of humanTiers) {
      console.log(`    → ${ht.shortLabel}: ${ht.costRange}`)
    }
    const hasIraLabel = humanTiers.some(t => t.group === 'insulin-ira')
    const hasPreventiveZero = humanTiers.some(t => t.group === 'preventive')
    if (hasIraLabel) console.log(`  ✅ Shows $35 IRA cap`)
    if (hasPreventiveZero) console.log(`  ⚠️ Still showing $0 Preventive — may need review`)
    if (!hasIraLabel && !hasPreventiveZero) console.log(`  ℹ️  Not classified as preventive in dataset`)
  }

  // ── 5. Dupixent biologic override ──
  console.log('\n── CHECK 5: /formulary/all/dupixent — Specialty or Preventive? ──')
  const dupResults = await searchFormulary({ drug_name: 'dupixent' })
  const dupTiers = dupResults.map(r => r.drug_tier).filter(Boolean) as string[]
  const dupHumanTiers = humanizeTiersForDrug(dupTiers, 'dupixent')
  const dupDominant = getDominantTierGroupForDrug(dupTiers, 'dupixent')
  console.log(`  Records: ${dupResults.length}`)
  console.log(`  Raw tiers: ${[...new Set(dupTiers)].join(', ')}`)
  console.log(`  Human tiers: ${dupHumanTiers.map(t => `${t.shortLabel} (${t.costRange})`).join(', ')}`)
  console.log(`  Dominant: ${dupDominant}`)
  const hasPrevDup = dupHumanTiers.some(t => t.group === 'preventive')
  console.log(hasPrevDup ? '  ❌ Still showing Preventive!' : '  ✅ No Preventive tier (biologic override working)')

  // Also check other biologics
  console.log('\n── Biologic spot-check ──')
  for (const bio of ['enbrel', 'humira', 'cosentyx', 'skyrizi', 'xolair']) {
    const results = await searchFormulary({ drug_name: bio })
    if (results.length === 0) { console.log(`  ${bio}: no results`); continue }
    const tiers = results.map(r => r.drug_tier).filter(Boolean) as string[]
    const human = humanizeTiersForDrug(tiers, bio)
    const hasPrev = human.some(t => t.group === 'preventive')
    console.log(`  ${bio}: ${results.length} records → ${human.map(t => t.shortLabel).join(', ')}${hasPrev ? ' ❌ PREVENTIVE LEAK' : ' ✅'}`)
  }

  console.log('\n═══════════════════════════════════════════════════')
  console.log('  AUDIT COMPLETE')
  console.log('═══════════════════════════════════════════════════')
}

main().catch(console.error)
