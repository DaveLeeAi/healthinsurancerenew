/**
 * scripts/upload-to-blob.mjs
 *
 * Uploads large processed datasets to Vercel Blob Storage.
 * Files >100 MB are gitignored and cannot be included in the Vercel build.
 * This script uploads them to Blob so the app can fetch them at runtime.
 *
 * Prerequisites:
 *   pnpm add @vercel/blob
 *   Set BLOB_READ_WRITE_TOKEN in .env.local or environment
 *
 * Usage:
 *   node scripts/upload-to-blob.mjs                  # upload all large files
 *   node scripts/upload-to-blob.mjs --file sbc_decoded.json   # upload one file
 *   node scripts/upload-to-blob.mjs --dry-run        # preview without uploading
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data', 'processed')

// Files too large for the Vercel build (>100 MB) — must go to Blob
const LARGE_FILES = [
  'formulary_intelligence.json',  // 7.2 GB
  'formulary_sample.json',        // 2.1 GB
  'sbc_decoded.json',             // 429 MB
  'plan_intelligence.json',       // 107 MB
  'policy_scenarios.json',        // 65 MB (borderline — include for safety)
]

// Manifest written after upload — consumed by data-loader at runtime
const MANIFEST_PATH = path.join(DATA_DIR, 'blob-manifest.json')

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const fileFlag = args.indexOf('--file')
  const singleFile = fileFlag !== -1 ? args[fileFlag + 1] : null

  const filesToUpload = singleFile
    ? LARGE_FILES.filter((f) => f === singleFile)
    : LARGE_FILES

  if (singleFile && filesToUpload.length === 0) {
    console.error(`[blob] File "${singleFile}" is not in the large files list.`)
    console.error(`[blob] Large files: ${LARGE_FILES.join(', ')}`)
    process.exit(1)
  }

  // Dynamically import @vercel/blob (only needed when actually uploading)
  let put
  try {
    const blob = await import('@vercel/blob')
    put = blob.put
  } catch {
    console.error('[blob] @vercel/blob not installed. Run: pnpm add @vercel/blob')
    process.exit(1)
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('[blob] BLOB_READ_WRITE_TOKEN not set.')
    console.error('[blob] Get a token from: Vercel Dashboard → Storage → Blob → Tokens')
    process.exit(1)
  }

  // Load existing manifest
  let manifest = {}
  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  }

  console.log(`[blob] Uploading ${filesToUpload.length} files to Vercel Blob...`)
  if (dryRun) console.log('[blob] DRY RUN — no files will be uploaded\n')

  for (const filename of filesToUpload) {
    const filepath = path.join(DATA_DIR, filename)

    if (!fs.existsSync(filepath)) {
      console.warn(`[blob] SKIP ${filename} — file not found locally`)
      continue
    }

    const stat = fs.statSync(filepath)
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(1)
    console.log(`[blob] ${filename} (${sizeMB} MB)`)

    if (dryRun) {
      console.log(`  → Would upload to: aca-data/${filename}\n`)
      continue
    }

    const stream = fs.createReadStream(filepath)
    const startTime = Date.now()

    try {
      const result = await put(`aca-data/${filename}`, stream, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      })

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`  → ${result.url} (${elapsed}s)`)

      manifest[filename] = {
        url: result.url,
        size: stat.size,
        uploadedAt: new Date().toISOString(),
      }
    } catch (err) {
      console.error(`  ✗ Upload failed: ${err.message}`)
      process.exit(1)
    }
  }

  if (!dryRun) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
    console.log(`\n[blob] Manifest written to ${MANIFEST_PATH}`)
  }

  console.log('[blob] Done.')
}

main()
