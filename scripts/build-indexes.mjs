/**
 * scripts/build-indexes.mjs
 * Plain ESM — no TypeScript, no esbuild, no transpilation.
 * Run: node scripts/build-indexes.mjs
 *
 * Outputs:
 *   .cache/sbc_index.json            — plan_variant_id → {offset, length}
 *   .cache/formulary_drug_index.json — drug_name_lower → {offset, length}
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data', 'processed')
const CACHE_DIR = path.join(__dirname, '..', '.cache')

// ---------------------------------------------------------------------------
// Core: stream file line by line with exact byte offsets (Buffer-based)
// ---------------------------------------------------------------------------
async function* streamLines(filepath) {
  const stream = fs.createReadStream(filepath)
  let absoluteByte = 0
  let remainderBuf = Buffer.alloc(0)

  for await (const rawChunk of stream) {
    const chunkAbsoluteStart = absoluteByte - remainderBuf.length
    const chunk = Buffer.concat([remainderBuf, rawChunk])

    let lineStart = 0
    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] === 0x0a) { // \n
        const hasCR = i > lineStart && chunk[i - 1] === 0x0d
        const lineContentEnd = hasCR ? i - 1 : i
        const line = chunk.slice(lineStart, lineContentEnd).toString('utf8')
        const startByte = chunkAbsoluteStart + lineStart
        const endByte = chunkAbsoluteStart + i + 1
        yield { line, startByte, endByte }
        lineStart = i + 1
      }
    }

    remainderBuf = chunk.slice(lineStart)
    absoluteByte += rawChunk.length
  }

  if (remainderBuf.length > 0) {
    const line = remainderBuf.toString('utf8').replace(/\r$/, '')
    yield { line, startByte: absoluteByte - remainderBuf.length, endByte: absoluteByte }
  }
}

// ---------------------------------------------------------------------------
// SBC Index
// sbc_decoded.json: pretty-printed, 4-space indent, 20,354 records
// Top-level array items delimited by lines "    {" and "    }" / "    },"
// ---------------------------------------------------------------------------
async function buildSbcIndex() {
  const filepath = path.join(DATA_DIR, 'sbc_decoded.json')
  const outputPath = path.join(CACHE_DIR, 'sbc_index.json')

  if (!fs.existsSync(filepath)) {
    console.warn('[SBC] sbc_decoded.json not found — skipping')
    return
  }

  console.log('[SBC] Building byte-offset index...')
  const t0 = Date.now()
  const index = {}

  let inDataArray = false
  let recordStartByte = -1
  let recordLines = []
  let count = 0
  let lastEndByte = 0

  for await (const { line, startByte, endByte } of streamLines(filepath)) {
    if (!inDataArray) {
      const t = line.trimEnd()
      if (t === '  "data": [' || t === '"data": [') inDataArray = true
      continue
    }

    if (line === '    {' && recordStartByte === -1) {
      recordStartByte = startByte
      recordLines = ['{']
      continue
    }

    if (recordStartByte !== -1) {
      const stripped = line.startsWith('    ') ? line.slice(4) : line

      if (line === '    }' || line === '    },') {
        recordLines.push('}')
        lastEndByte = endByte

        try {
          const record = JSON.parse(recordLines.join('\n'))
          const key = record.plan_variant_id ?? record.plan_id
          if (key) {
            index[key] = { offset: recordStartByte, length: lastEndByte - recordStartByte }
            count++
            if (count % 2000 === 0) process.stdout.write(`\r  ${count} records indexed...`)
          }
        } catch { /* skip */ }

        recordStartByte = -1
        recordLines = []
      } else {
        recordLines.push(stripped)
      }
    }
  }

  console.log(`\n[SBC] ${count} entries in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(index))
  console.log(`[SBC] → ${outputPath}`)
}

// ---------------------------------------------------------------------------
// Formulary Index
// formulary_intelligence.json: NDJSON, one record per line, grouped by drug
// ---------------------------------------------------------------------------
async function buildFormularyIndex() {
  const filepath = path.join(DATA_DIR, 'formulary_intelligence.json')
  const outputPath = path.join(CACHE_DIR, 'formulary_drug_index.json')

  if (!fs.existsSync(filepath)) {
    console.warn('[Formulary] formulary_intelligence.json not found — skipping')
    return
  }

  console.log('[Formulary] Building drug block index (large file — takes several minutes)...')
  const t0 = Date.now()
  const index = {}
  const drugNameRe = /"drug_name":\s*"((?:[^"\\]|\\.)*)"/

  let inDataArray = false
  let currentDrug = null
  let blockStart = -1
  let blockLastEnd = -1
  let lineCount = 0
  let drugCount = 0

  for await (const { line, startByte, endByte } of streamLines(filepath)) {
    if (!inDataArray) {
      const t = line.trim()
      if (t === '"data": [' || t.startsWith('"data":[')) inDataArray = true
      continue
    }

    if (!line.startsWith('{')) continue

    lineCount++
    if (lineCount % 500_000 === 0) {
      process.stdout.write(`\r  ${lineCount.toLocaleString()} lines, ${drugCount.toLocaleString()} drugs...`)
    }

    const match = drugNameRe.exec(line)
    if (!match) continue

    const drugName = match[1].toLowerCase()

    if (drugName !== currentDrug) {
      if (currentDrug !== null && blockStart !== -1) {
        index[currentDrug] = { offset: blockStart, length: blockLastEnd - blockStart }
        drugCount++
      }
      currentDrug = drugName
      blockStart = startByte
    }

    blockLastEnd = endByte
  }

  if (currentDrug !== null && blockStart !== -1) {
    index[currentDrug] = { offset: blockStart, length: blockLastEnd - blockStart }
    drugCount++
  }

  console.log(
    `\n[Formulary] ${drugCount.toLocaleString()} drugs, ${lineCount.toLocaleString()} records in ${((Date.now() - t0) / 1000).toFixed(1)}s`
  )
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(index))
  console.log(`[Formulary] → ${outputPath}`)
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
console.log('=== ACA Data Index Builder ===')
fs.mkdirSync(CACHE_DIR, { recursive: true })

await buildSbcIndex()
await buildFormularyIndex()

console.log('\n=== Done ===')
