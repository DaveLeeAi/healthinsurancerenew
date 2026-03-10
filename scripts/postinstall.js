/**
 * scripts/postinstall.js
 * Runs automatically after `npm install` / `pnpm install`.
 * Builds byte-offset indexes only if data files are present.
 * Silently skips if running in CI or data files are absent (they are gitignored).
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const sbcPath = path.join(__dirname, '..', 'data', 'processed', 'sbc_decoded.json')
const formularyPath = path.join(__dirname, '..', 'data', 'processed', 'formulary_intelligence.json')
const sbcIndexPath = path.join(__dirname, '..', '.cache', 'sbc_index.json')
const formularyIndexPath = path.join(__dirname, '..', '.cache', 'formulary_drug_index.json')

const hasSbc = fs.existsSync(sbcPath)
const hasFormulary = fs.existsSync(formularyPath)
const sbcIndexed = fs.existsSync(sbcIndexPath)
const formularyIndexed = fs.existsSync(formularyIndexPath)

if (!hasSbc && !hasFormulary) {
  console.log('[postinstall] Data files not present — skipping index build.')
  console.log('[postinstall] After downloading CMS data, run: npm run build:indexes')
  process.exit(0)
}

if (sbcIndexed && formularyIndexed) {
  console.log('[postinstall] Indexes already up to date.')
  process.exit(0)
}

console.log('[postinstall] Building data indexes...')
try {
  execSync('npm run build:indexes', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
} catch (err) {
  console.error('[postinstall] Index build failed (non-fatal):', err.message)
  console.error('[postinstall] Run manually: npm run build:indexes')
}
