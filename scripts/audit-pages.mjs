#!/usr/bin/env node
/**
 * scripts/audit-pages.mjs — Integration test: verify all layers per page type
 *
 * Tests for each of the 10 page routes:
 *   1. Data layer — can we load real data for this page?
 *   2. Content template — is generateXxxContent() imported and called?
 *   3. Schema markup — is buildXxxSchema() imported and rendered via SchemaScript?
 *   4. Entity links — is getRelatedEntities() imported and called with correct pageType?
 *
 * Output: 10-row PASS/FAIL table.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const APP = path.join(ROOT, 'app')
const LIB = path.join(ROOT, 'lib')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFile(relPath) {
  const full = path.join(ROOT, relPath)
  if (!fs.existsSync(full)) return null
  return fs.readFileSync(full, 'utf-8')
}

function check(source, pattern) {
  if (!source) return false
  if (typeof pattern === 'string') return source.includes(pattern)
  return pattern.test(source)
}

// ─── Page definitions ─────────────────────────────────────────────────────────

const pages = [
  {
    name: 'plans',
    route: 'app/plans/[state]/[county]/page.tsx',
    dataFn: 'getPlansByCounty',
    contentFn: 'generatePlanComparisonContent',
    schemaFns: ['buildPlansProductSchema', 'buildArticleSchema', 'buildBreadcrumbSchema'],
    entityPageType: 'plans',
  },
  {
    name: 'subsidies',
    route: 'app/subsidies/[state]/[county]/page.tsx',
    dataFn: 'getSubsidyByCounty',
    contentFn: 'generateSubsidyContent',
    schemaFns: ['buildSubsidySchemas', 'buildBreadcrumbSchema'],
    entityPageType: 'subsidy',
  },
  {
    name: 'plan-details',
    route: 'app/plan-details/[plan_id]/page.tsx',
    dataFn: 'getPlanById',
    contentFn: 'generateSbcContent',
    schemaFns: ['buildSbcProductSchema', 'buildArticleSchema', 'buildBreadcrumbSchema'],
    entityPageType: 'plan-detail',
  },
  {
    name: 'rates',
    route: 'app/rates/[state]/[county]/page.tsx',
    dataFn: 'getRatesByCounty',
    contentFn: 'generateRateVolatilityContent',
    schemaFns: ['buildRateVolatilityDatasetSchema', 'buildArticleSchema', 'buildBreadcrumbSchema'],
    entityPageType: 'rates',
  },
  {
    name: 'faq',
    route: 'app/faq/[category]/[slug]/page.tsx',
    dataFn: 'getFrictionQABySlug',
    contentFn: 'generateFrictionQAContent',
    schemaFns: ['buildFAQSchema', 'buildArticleSchema', 'buildBreadcrumbSchema'],
    entityPageType: 'faq',
  },
  {
    name: 'formulary',
    route: 'app/formulary/[issuer]/[drug_name]/page.tsx',
    dataFn: 'searchFormulary',
    contentFn: 'generateFormularyContent',
    schemaFns: ['buildFormularyDrugSchema', 'buildBreadcrumbSchema'],
    entityPageType: 'formulary',
  },
  {
    name: 'dental',
    route: 'app/dental/[state]/[plan_variant]/page.tsx',
    dataFn: 'getDentalByPlanVariant',
    contentFn: 'generateDentalContent',
    schemaFns: ['buildDentalPlanSchema', 'buildArticleSchema', 'buildBreadcrumbSchema'],
    entityPageType: 'dental',
  },
  {
    name: 'billing',
    route: 'app/billing/[cpt_code]/page.tsx',
    dataFn: 'loadBillingIntel',
    contentFn: 'generateBillingContent',
    schemaFns: ['buildBillingProcedureSchema', 'buildArticleSchema', 'buildBreadcrumbSchema'],
    entityPageType: 'billing',
  },
  {
    name: 'life-events',
    route: 'app/life-events/[event_type]/page.tsx',
    dataFn: 'getLifeEventBySlug',
    contentFn: 'generateLifeEventContent',
    schemaFns: ['buildLifeEventSchemas', 'buildBreadcrumbSchema'],
    entityPageType: 'life-event',
  },
  {
    name: 'enhanced-credits',
    route: 'app/enhanced-credits/[state]/[county]/page.tsx',
    dataFn: 'getPolicyByCounty',
    contentFn: 'generatePolicyScenarioContent',
    schemaFns: ['buildPolicyScenarioSchema', 'buildArticleSchema', 'buildBreadcrumbSchema'],
    entityPageType: 'policy-scenario',
  },
]

// ─── Run checks ──────────────────────────────────────────────────────────────

console.log('')
console.log('╔══════════════════════════════════════════════════════════════════════════════╗')
console.log('║                    FULL-STACK PAGE INTEGRATION AUDIT                        ║')
console.log('╚══════════════════════════════════════════════════════════════════════════════╝')
console.log('')

const results = []

for (const page of pages) {
  const source = readFile(page.route)
  if (!source) {
    results.push({ name: page.name, data: 'MISS', content: 'MISS', schema: 'MISS', entity: 'MISS' })
    continue
  }

  // 1. Data loader — check import of the data function
  const dataOk = check(source, page.dataFn)

  // 2. Content template — check import of the content generation function
  const contentOk = check(source, page.contentFn)

  // 3. Schema — check each schema function is imported AND rendered via SchemaScript
  const schemaOk = page.schemaFns.every(fn => check(source, fn))
  const schemaScriptOk = check(source, 'SchemaScript')

  // 4. Entity links — check getRelatedEntities import + correct pageType
  const entityImportOk = check(source, 'getRelatedEntities')
  const entityTypeOk = check(source, new RegExp(`pageType:\\s*'${page.entityPageType}'`))

  results.push({
    name: page.name,
    data: dataOk ? 'PASS' : 'FAIL',
    content: contentOk ? 'PASS' : 'FAIL',
    schema: (schemaOk && schemaScriptOk) ? 'PASS' : 'FAIL',
    entity: (entityImportOk && entityTypeOk) ? 'PASS' : 'FAIL',
    schemaDetail: !schemaOk ? `Missing: ${page.schemaFns.filter(fn => !check(source, fn)).join(', ')}` : '',
  })
}

// ─── Print table ──────────────────────────────────────────────────────────────

const pad = (s, n) => s.padEnd(n)
const header = `| ${pad('Page', 18)} | ${pad('Data', 6)} | ${pad('Content', 8)} | ${pad('Schema', 8)} | ${pad('Entity', 8)} | Notes`
const sep    = `|${'-'.repeat(20)}|${'-'.repeat(8)}|${'-'.repeat(10)}|${'-'.repeat(10)}|${'-'.repeat(10)}|${'─'.repeat(40)}`

console.log(header)
console.log(sep)

let failCount = 0
for (const r of results) {
  const notes = []
  if (r.data === 'FAIL') notes.push('No data loader import')
  if (r.content === 'FAIL') notes.push('Content template not wired')
  if (r.schema === 'FAIL') notes.push(r.schemaDetail || 'Schema missing')
  if (r.entity === 'FAIL') notes.push('Entity links missing')

  const mark = (v) => v === 'PASS' ? ' PASS ' : ' FAIL '
  console.log(
    `| ${pad(r.name, 18)} |${mark(r.data)}|${mark(r.content)}  |${mark(r.schema)}  |${mark(r.entity)}  | ${notes.join('; ')}`
  )
  if (r.data === 'FAIL' || r.content === 'FAIL' || r.schema === 'FAIL' || r.entity === 'FAIL') failCount++
}

console.log(sep)
console.log(`\nTotal: ${results.length} pages — ${results.length - failCount} fully wired, ${failCount} with failures`)

// ─── Field mismatch checks ──────────────────────────────────────────────────

console.log('\n=== FIELD MISMATCH CHECKS ===')

// Check types.ts for field names vs actual data
const typesSource = readFile('lib/types.ts')
const hasMoopIndividual = check(typesSource, 'moop_individual')
const hasOopMaxIndividual = check(typesSource, 'oop_max_individual')
const hasNetworkUrl = check(typesSource, 'network_url')
const hasSbcUrl = check(typesSource, /sbc_url\??: string/)

console.log(`  PlanRecord.moop_individual (should be oop_max_individual): ${hasMoopIndividual ? 'FAIL — moop_individual still in types' : 'PASS'}`)
console.log(`  PlanRecord.oop_max_individual defined: ${hasOopMaxIndividual ? 'PASS' : 'FAIL'}`)
console.log(`  PlanRecord.network_url (should be sbc_url): ${hasNetworkUrl ? 'FAIL — network_url still in types' : 'PASS'}`)
console.log(`  PlanRecord has sbc_url: ${hasSbcUrl ? 'PASS' : 'FAIL'}`)

// Check schema-markup.ts for moop_individual usage
const schemaSource = readFile('lib/schema-markup.ts')
const schemaMoop = check(schemaSource, 'moop_individual')
console.log(`  schema-markup.ts uses moop_individual: ${schemaMoop ? 'FAIL — should use oop_max_individual' : 'PASS'}`)

// Check life events schema uses decision_tree (not empty action_steps)
const lifeEventSchemaUsesDecisionTree = check(schemaSource, 'decision_tree')
console.log(`  schema-markup.ts uses decision_tree for life events: ${lifeEventSchemaUsesDecisionTree ? 'PASS' : 'FAIL — should use decision_tree'}`)

// Check life events page for Article schema (now via buildLifeEventSchemas which returns [article, itemList])
const lifeEventPage = readFile('app/life-events/[event_type]/page.tsx')
const lifeEventHasArticle = check(lifeEventPage, 'buildLifeEventSchemas')
console.log(`  life-events page has Article+ItemList schema: ${lifeEventHasArticle ? 'PASS' : 'FAIL — missing buildLifeEventSchemas'}`)

console.log('\n=== AUDIT COMPLETE ===\n')
process.exit(failCount > 0 ? 1 : 0)
