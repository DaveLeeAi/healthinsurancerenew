/**
 * lib/data-index-builder.ts
 *
 * Pre-builds byte-offset indexes for large JSON files.
 * Run once:  npm run build:indexes
 *
 * Outputs:
 *   .cache/sbc_index.json           — plan_variant_id → {offset, length}
 *   .cache/formulary_drug_index.json — drug_name_lower → Array<{offset, length}>
 *
 * Schema note: the formulary index value is an ARRAY of byte ranges, not a
 * single range. The master file's records are not grouped globally by drug
 * name — the same drug name can appear in multiple non-contiguous runs from
 * different fetch batches. The pre-2026-04-08 indexer used a single-entry
 * value and silently overwrote prior runs (904K of 959K runs were lost,
 * making 92% of file bytes unreachable via the index). The array form
 * preserves every run.
 */

import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'processed')
const CACHE_DIR = path.join(process.cwd(), '.cache')

export interface ByteOffsetEntry {
  offset: number
  length: number
}

export type SbcIndex = Record<string, ByteOffsetEntry>
export type FormularyBlockIndex = Record<string, ByteOffsetEntry[]>

// ---------------------------------------------------------------------------
// Core helper: stream a file line-by-line with exact byte offsets.
// Uses raw Buffer operations so offsets survive CRLF/LF differences.
// ---------------------------------------------------------------------------
async function* streamLines(
  filepath: string
): AsyncGenerator<{ line: string; startByte: number; endByte: number }> {
  const stream = fs.createReadStream(filepath)
  let absoluteByte = 0
  let remainderBuf = Buffer.alloc(0)

  for await (const rawChunk of stream as AsyncIterable<Buffer>) {
    const chunkAbsoluteStart = absoluteByte - remainderBuf.length
    const chunk = Buffer.concat([remainderBuf, rawChunk])

    let lineStart = 0
    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] === 0x0a) {
        // \n found — line runs from lineStart to i (exclusive of \n)
        const hasCR = i > lineStart && chunk[i - 1] === 0x0d
        const lineContentEnd = hasCR ? i - 1 : i
        const line = chunk.slice(lineStart, lineContentEnd).toString('utf8')
        const startByte = chunkAbsoluteStart + lineStart
        const endByte = chunkAbsoluteStart + i + 1 // byte past the \n
        yield { line, startByte, endByte }
        lineStart = i + 1
      }
    }

    remainderBuf = chunk.slice(lineStart)
    absoluteByte += rawChunk.length
  }

  // Flush last line if file doesn't end with \n
  if (remainderBuf.length > 0) {
    const line = remainderBuf.toString('utf8').replace(/\r$/, '')
    const startByte = absoluteByte - remainderBuf.length
    yield { line, startByte, endByte: absoluteByte }
  }
}

// ---------------------------------------------------------------------------
// SBC Index Builder
// sbc_decoded.json is pretty-printed Python JSON with 4-space indentation.
// Top-level array items start with "    {" and end with "    }" or "    },".
// We strip 4-space indent to reconstruct parseable JSON for key extraction.
// ---------------------------------------------------------------------------
export async function buildSbcIndex(): Promise<void> {
  const filepath = path.join(DATA_DIR, 'sbc_decoded.json')
  const outputPath = path.join(CACHE_DIR, 'sbc_index.json')

  if (!fs.existsSync(filepath)) {
    console.warn('[index-builder] sbc_decoded.json not found — skipping SBC index')
    return
  }

  console.log('[index-builder] Building SBC byte-offset index (this takes ~60s)...')
  const t0 = Date.now()
  const index: SbcIndex = {}

  let inDataArray = false
  let recordStartByte = -1
  let recordLines: string[] = []
  let count = 0
  let lastEndByte = 0

  for await (const { line, startByte, endByte } of streamLines(filepath)) {
    if (!inDataArray) {
      // Look for the line that opens the data array:  "data": [
      const trimmed = line.trimEnd()
      if (trimmed === '  "data": [' || trimmed === '"data": [') {
        inDataArray = true
      }
      continue
    }

    // Record start: exactly 4 spaces + open brace, nothing else on the line
    if (line === '    {' && recordStartByte === -1) {
      recordStartByte = startByte
      recordLines = ['{']
      continue
    }

    if (recordStartByte !== -1) {
      // Strip the 4-space record indent to reconstruct minimal JSON
      const stripped = line.startsWith('    ') ? line.slice(4) : line

      if (line === '    }' || line === '    },') {
        // Record complete — push closing brace and parse for key extraction
        recordLines.push('}')
        lastEndByte = endByte

        try {
          const record = JSON.parse(recordLines.join('\n')) as {
            plan_variant_id?: string
            plan_id?: string
          }
          const key = record.plan_variant_id ?? record.plan_id
          if (key) {
            index[key] = {
              offset: recordStartByte,
              length: lastEndByte - recordStartByte,
            }
            count++
            if (count % 2000 === 0) {
              process.stdout.write(`\r  [SBC] Indexed ${count} records...`)
            }
          }
        } catch {
          // Skip unparseable records — should not happen with well-formed PUF output
        }

        recordStartByte = -1
        recordLines = []
      } else {
        recordLines.push(stripped)
      }
    }
  }

  console.log(`\n[index-builder] SBC: ${count} entries indexed in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(index))
  console.log(`[index-builder] SBC index → ${outputPath}`)
}

// ---------------------------------------------------------------------------
// Formulary Index Builder
// formulary_intelligence.json is NDJSON: one JSON object per line in "data": [
// Records ARE NOT globally grouped by drug name — the same drug can appear
// in multiple non-contiguous runs from different fetch batches. We index
// drug_name_lower → Array<{offset, length}> with one array entry per run.
// The pre-2026-04-08 indexer used a single-entry value and silently dropped
// 904K of 959K runs (92% of file bytes unreachable via the index).
// ---------------------------------------------------------------------------
export async function buildFormularyIndex(): Promise<void> {
  const filepath = path.join(DATA_DIR, 'formulary_intelligence.json')
  const outputPath = path.join(CACHE_DIR, 'formulary_drug_index.json')

  if (!fs.existsSync(filepath)) {
    console.warn('[index-builder] formulary_intelligence.json not found — skipping formulary index')
    return
  }

  console.log('[index-builder] Building formulary drug block index (this takes several minutes)...')
  const t0 = Date.now()
  const index: FormularyBlockIndex = {}

  let inDataArray = false
  let currentDrug: string | null = null
  let blockStart = -1
  let blockLastEnd = -1
  let lineCount = 0
  let runCount = 0
  let uniqueDrugCount = 0

  // Regex to extract drug_name value without full JSON.parse (faster on 7 GB)
  const drugNameRe = /"drug_name":\s*"((?:[^"\\]|\\.)*)"/

  const flushCurrent = (): void => {
    if (currentDrug !== null && blockStart !== -1) {
      let bucket = index[currentDrug]
      if (!bucket) {
        bucket = []
        index[currentDrug] = bucket
        uniqueDrugCount++
      }
      bucket.push({ offset: blockStart, length: blockLastEnd - blockStart })
      runCount++
    }
  }

  for await (const { line, startByte, endByte } of streamLines(filepath)) {
    if (!inDataArray) {
      const trimmed = line.trim()
      if (trimmed === '"data": [' || trimmed.startsWith('"data":[')) {
        inDataArray = true
      }
      continue
    }

    // Only process record lines (NDJSON records start with '{')
    if (!line.startsWith('{')) continue

    lineCount++
    if (lineCount % 500_000 === 0) {
      process.stdout.write(`\r  [Formulary] ${lineCount.toLocaleString()} lines processed, ${uniqueDrugCount.toLocaleString()} unique drugs / ${runCount.toLocaleString()} runs indexed...`)
    }

    const match = drugNameRe.exec(line)
    if (!match) continue

    const drugName = match[1].toLowerCase()

    if (drugName !== currentDrug) {
      flushCurrent()
      currentDrug = drugName
      blockStart = startByte
    }

    blockLastEnd = endByte
  }

  // Flush the final drug block
  flushCurrent()

  // Per-drug run statistics (helps catch regressions)
  const runsPerDrug = Object.values(index).map((arr) => arr.length)
  const maxRunsPerDrug = runsPerDrug.length > 0 ? Math.max(...runsPerDrug) : 0
  const avgRunsPerDrug = runsPerDrug.length > 0 ? runCount / runsPerDrug.length : 0

  console.log(
    `\n[index-builder] Formulary: ${uniqueDrugCount.toLocaleString()} unique drugs, ${runCount.toLocaleString()} runs, ${lineCount.toLocaleString()} records in ${((Date.now() - t0) / 1000).toFixed(1)}s`
  )
  console.log(
    `[index-builder] Runs per drug: avg ${avgRunsPerDrug.toFixed(1)}, max ${maxRunsPerDrug}`
  )
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(index))
  console.log(`[index-builder] Formulary index → ${outputPath}`)
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== ACA Data Index Builder ===')
  fs.mkdirSync(CACHE_DIR, { recursive: true })

  await buildSbcIndex()
  await buildFormularyIndex()

  console.log('\n=== Index build complete ===')
}

// Run when executed directly (tsx lib/data-index-builder.ts)
main().catch((err) => {
  console.error('[index-builder] Fatal error:', err)
  process.exit(1)
})
