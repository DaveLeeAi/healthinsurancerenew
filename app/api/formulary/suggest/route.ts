import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface AutocompleteEntry {
  name: string
  freq: number
}

interface AutocompleteIndex {
  drugs: AutocompleteEntry[]
}

// ---------------------------------------------------------------------------
// Layer 1 — Top consumer drugs (most prescribed + most searched on formulary
// tools). These always rank first in autocomplete results.
// ---------------------------------------------------------------------------
const LAYER_1_DRUGS = new Set([
  // diabetes + GLP-1 (highest marketplace search volume 2025-2026)
  'metformin', 'ozempic', 'jardiance', 'trulicity', 'mounjaro', 'wegovy',
  'farxiga', 'januvia', 'victoza', 'rybelsus', 'semaglutide', 'tirzepatide',
  // blood pressure / cardiac
  'lisinopril', 'amlodipine', 'losartan', 'hydrochlorothiazide', 'metoprolol',
  'atenolol', 'valsartan', 'carvedilol', 'diltiazem', 'nifedipine',
  // mental health
  'sertraline', 'escitalopram', 'bupropion', 'trazodone', 'fluoxetine',
  'duloxetine', 'venlafaxine', 'citalopram', 'paroxetine', 'aripiprazole',
  'quetiapine', 'lamotrigine', 'buspirone',
  // brand psych
  'lexapro', 'zoloft', 'wellbutrin', 'seroquel', 'abilify',
  // cholesterol
  'atorvastatin', 'rosuvastatin', 'simvastatin', 'ezetimibe', 'pravastatin',
  'lipitor', 'crestor',
  // GI / acid reflux
  'omeprazole', 'pantoprazole', 'esomeprazole', 'famotidine', 'lansoprazole',
  'nexium', 'prilosec',
  // pain / inflammation
  'gabapentin', 'pregabalin', 'ibuprofen', 'naproxen', 'acetaminophen',
  'meloxicam', 'celecoxib', 'tramadol', 'cyclobenzaprine',
  'lyrica',
  // ADHD
  'adderall', 'vyvanse', 'concerta', 'ritalin', 'methylphenidate',
  // thyroid
  'levothyroxine', 'synthroid', 'liothyronine',
  // antibiotics
  'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline',
  'cephalexin', 'metronidazole', 'clindamycin',
  // biologics / specialty (high-cost search interest)
  'humira', 'enbrel', 'dupixent', 'stelara', 'cosentyx', 'otezla', 'skyrizi',
  'keytruda',
  // blood thinners (Eliquis/Xarelto = Medicare negotiated price 2026 interest)
  'eliquis', 'xarelto', 'warfarin',
  // insulin
  'insulin', 'humalog', 'lantus', 'novolog',
  // respiratory
  'albuterol', 'montelukast', 'fluticasone', 'budesonide', 'tiotropium',
  'singulair', 'symbicort', 'advair', 'breo',
  // anxiety / sleep
  'alprazolam', 'lorazepam', 'clonazepam', 'diazepam', 'zolpidem',
  'hydroxyzine', 'xanax',
  // steroids
  'prednisone', 'methylprednisolone', 'prednisolone',
  // other top-50 prescribed
  'linagliptin', 'empagliflozin', 'finasteride', 'tamsulosin',
  'montelukast', 'sumatriptan', 'ondansetron', 'spironolactone',
])

// ---------------------------------------------------------------------------
// Salt / formulation suffixes stripped to derive parent drug name
// ---------------------------------------------------------------------------
const SALT_SUFFIXES = new Set([
  'hydrochloride', 'hcl', 'sodium', 'sulfate', 'tartrate', 'succinate',
  'calcium', 'acetate', 'phosphate', 'potassium', 'chloride', 'maleate',
  'besylate', 'fumarate', 'mesylate', 'citrate', 'bromide', 'nitrate',
  'oxide', 'dihydrate', 'monohydrate', 'anhydrous', 'decanoate',
  'dimesylate', 'disoproxil', 'etabonate', 'valerate', 'propionate',
  // release / form modifiers
  'er', 'sr', 'xr', 'cr', 'dr', 'ec', 'la', 'sa', 'ir', 'odt', 'cd',
  'extended', 'release', 'delayed', 'modified',
  // dosage forms & delivery devices
  'oral', 'tablet', 'capsule', 'injection', 'solution', 'suspension',
  'hfa', 'diskus', 'respimat', 'inhaler', 'flexhaler', 'ellipta',
  'pen', 'prefilled', 'syringe', 'autoinjector', 'kwikpen',
  // biosimilar suffixes
  'yfgn', 'adbm', 'adaz', 'atto', 'bvls', 'aaci', 'afzb', 'fkjp',
  'aqvh', 'bwwd', 'yufp', 'ayyh', 'bmez', 'bkjx',
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let drugList: AutocompleteEntry[] | null = null

function loadDrugList(): AutocompleteEntry[] {
  if (drugList) return drugList
  const filePath = path.join(process.cwd(), 'data', 'processed', 'drug_autocomplete.json')
  if (!fs.existsSync(filePath)) {
    console.warn('[suggest] drug_autocomplete.json not found — run: node scripts/build_drug_autocomplete.js')
    return []
  }
  const data: AutocompleteIndex = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  drugList = data.drugs
  return drugList
}

function titleCase(str: string): string {
  return str
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** Strip salt/formulation suffixes to get the clean parent drug name. */
function getParentName(fullName: string): string {
  const words = fullName.toLowerCase().split(/\s+/)
  if (words.length === 1) return titleCase(words[0])

  // Strip trailing suffixes
  while (words.length > 1 && SALT_SUFFIXES.has(words[words.length - 1])) {
    words.pop()
  }
  return titleCase(words.join(' '))
}

/**
 * Classify a parent drug name into a priority layer.
 *
 *   Layer 1 — common parent drugs (Metformin, Ozempic, Lisinopril, …)
 *   Layer 2 — multi-word drugs whose first word is Layer 1 (Insulin Lispro)
 *   Layer 3 — other clean single/two-word drug names
 *   Layer 4 — formulation variants, combos, descriptors
 */
function classifyLayer(parentName: string): 1 | 2 | 3 | 4 {
  const key = parentName.toLowerCase()
  const words = key.split(/\s+/)
  const firstWord = words[0]

  // Layer 4 signals: numbers, commas, descriptor prefixes, very long names
  if (/\d/.test(key)) return 4
  if (key.includes(',')) return 4
  if (['once', 'twice', 'daily', 'weekly', 'bi'].includes(firstWord)) return 4
  if (words.length > 2) return 4

  // Layer 1: exact match or single-word match in the priority set
  if (LAYER_1_DRUGS.has(key)) return 1
  if (words.length === 1 && LAYER_1_DRUGS.has(firstWord)) return 1

  // Layer 2: multi-word where first word is a priority drug
  if (LAYER_1_DRUGS.has(firstWord)) return 2

  // Layer 3: clean single or two-word names (real generics / brands)
  if (words.length <= 2) return 3

  return 4
}

// ---------------------------------------------------------------------------
// Prescription rank — top 20 most prescribed drugs in the US get an extra
// boost within Layer 1 so Metformin always beats Metronidazole for "met".
// ---------------------------------------------------------------------------
const PRESCRIPTION_RANK = new Map<string, number>([
  ['lisinopril', 20], ['atorvastatin', 19], ['metformin', 18],
  ['levothyroxine', 17], ['amlodipine', 16], ['metoprolol', 15],
  ['omeprazole', 14], ['losartan', 13], ['albuterol', 12],
  ['gabapentin', 11], ['sertraline', 10], ['hydrochlorothiazide', 9],
  ['amoxicillin', 8], ['pantoprazole', 7], ['escitalopram', 6],
  ['bupropion', 5], ['montelukast', 4], ['rosuvastatin', 3],
  ['fluoxetine', 2], ['acetaminophen', 1],
])

// ---------------------------------------------------------------------------
// Scoring structure (match type is PRIMARY, layer is SECONDARY):
//
//   score = matchBase + layerBonus + rxRankBonus + freq + brevity
//
//   matchBase       exact:100000  starts_with:70000  word_boundary:40000  contains:10000
//   layerBonus      L1:5000  L2:500  L3:1000  L4:0
//                   (L2 < L3: clean unique names rank above combo variants)
//   rxRankBonus     top-20 prescribed: rank * 50  (range 50-1000)
//   freq            raw CMS formulation count (0-200)
//   brevity         max(0, 30 - name.length) * 2
//
// This ensures starts-with always beats contains, and within the same
// match type, Layer 1 drugs rank above Layer 3, etc.
// ---------------------------------------------------------------------------

const MATCH_BASES = { exact: 100000, starts_with: 70000, word_boundary: 40000, contains: 10000 }
const LAYER_BONUSES: Record<number, number> = { 1: 5000, 2: 500, 3: 1000, 4: 0 }

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase()
  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const drugs = loadDrugList()

  // Score each entry, group by parent name, keep best score per group
  const parentGroups = new Map<string, { parentName: string; score: number }>()

  for (const drug of drugs) {
    const lower = drug.name.toLowerCase()

    // Skip truncated CMS artifacts (e.g. "Metfor Tab", "Methylphenid Cap")
    if (/\b(tab|cap|sol|inj|pwd|susp|crm|oint)\b$/.test(lower)) continue

    // Determine match type
    let matchBase = 0
    if (lower === q) {
      matchBase = MATCH_BASES.exact
    } else if (lower.startsWith(q)) {
      matchBase = MATCH_BASES.starts_with
    } else {
      const words = lower.split(/[\s-]+/)
      if (words.some(w => w.startsWith(q))) {
        matchBase = MATCH_BASES.word_boundary
      } else if (lower.includes(q)) {
        matchBase = MATCH_BASES.contains
      } else {
        continue
      }
    }

    const parentName = getParentName(drug.name)
    const parentKey = parentName.toLowerCase()
    const layer = classifyLayer(parentName)
    const layerBonus = LAYER_BONUSES[layer]

    // Prescription rank bonus (only for top-20 most prescribed)
    const rxRank = PRESCRIPTION_RANK.get(parentKey) ?? 0
    const rxRankBonus = rxRank * 50

    // Shorter names are cleaner suggestions
    const brevityBonus = Math.max(0, 30 - parentKey.length) * 2

    const totalScore = matchBase + layerBonus + rxRankBonus + drug.freq + brevityBonus

    const existing = parentGroups.get(parentKey)
    if (!existing || totalScore > existing.score) {
      parentGroups.set(parentKey, { parentName, score: totalScore })
    }
  }

  // Sort by score descending
  const sorted = [...parentGroups.values()]
    .sort((a, b) => b.score - a.score)

  // Remove truncation artifacts: if "Amlod" is a prefix of higher-ranked
  // "Amlodipine", drop the shorter entry
  const suggestions: string[] = []
  for (const item of sorted) {
    if (suggestions.length >= 8) break
    const key = item.parentName.toLowerCase()
    const isPrefix = suggestions.some(s =>
      s.toLowerCase().startsWith(key) && s.length > item.parentName.length
    )
    if (!isPrefix) suggestions.push(item.parentName)
  }

  return NextResponse.json(suggestions)
}
