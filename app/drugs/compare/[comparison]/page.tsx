import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DRUG_TAXONOMY, getDrugCategory } from '@/lib/drug-linking'
import { buildArticleSchema, buildBreadcrumbSchema, buildFAQSchema } from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

interface Props {
  params: { comparison: string }
}

// ── High-priority seed pairs ─────────────────────────────────────────────────
// Pre-defined metadata for the top comparison pairs.
// Format: "drug-a-vs-drug-b" (alphabetical, lowercase, slugified)

const SEED_PAIRS: Record<string, { context: string }> = {
  'metformin-vs-ozempic': { context: 'The most searched diabetes drug comparison — generic first-line vs. GLP-1 brand' },
  'metformin-vs-jardiance': { context: 'Type 2 diabetes: first-line generic vs. SGLT2 inhibitor' },
  'ozempic-vs-wegovy': { context: 'Same active ingredient (semaglutide), different approved uses: diabetes vs. weight loss' },
  'ozempic-vs-mounjaro': { context: 'GLP-1 vs. dual GIP/GLP-1: the two leading diabetes/weight loss injectables' },
  'wegovy-vs-mounjaro': { context: 'Head-to-head weight loss injectables: semaglutide vs. tirzepatide' },
  'atorvastatin-vs-rosuvastatin': { context: 'Two most-prescribed statins: coverage and cost comparison' },
  'lisinopril-vs-losartan': { context: 'ACE inhibitor vs. ARB: first-line blood pressure medications' },
  'sertraline-vs-escitalopram': { context: 'Two most commonly prescribed SSRIs on Marketplace plans' },
  'eliquis-vs-xarelto': { context: 'Novel oral anticoagulants (NOACs): coverage and cost on Marketplace plans' },
  'humira-vs-enbrel': { context: 'Biologic TNF inhibitors: specialty tier coverage comparison' },
  'ozempic-vs-trulicity': { context: 'GLP-1 agonists for type 2 diabetes: semaglutide vs. dulaglutide' },
  'amlodipine-vs-lisinopril': { context: 'Calcium channel blocker vs. ACE inhibitor for hypertension' },
  'levothyroxine-vs-synthroid': { context: 'Generic vs. brand-name thyroid hormone: coverage and tier differences' },
  'adderall-vs-vyvanse': { context: 'ADHD stimulants: amphetamine salts vs. lisdexamfetamine' },
  'jardiance-vs-farxiga': { context: 'SGLT2 inhibitors for type 2 diabetes: empagliflozin vs. dapagliflozin' },
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function parseComparison(slug: string): { drugA: string; drugB: string } | null {
  const match = slug.match(/^(.+)-vs-(.+)$/)
  if (!match) return null

  // Greedy split can fail on multi-word drugs like "insulin-glargine-vs-ozempic"
  // Walk all split points to find valid drug names
  const parts = slug.split('-vs-')
  if (parts.length < 2) return null

  const drugA = parts[0].replace(/-/g, ' ')
  const drugB = parts.slice(1).join('-vs-').replace(/-/g, ' ')

  return { drugA, drugB }
}

export async function generateStaticParams() {
  return Object.keys(SEED_PAIRS).map((comparison) => ({ comparison }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = parseComparison(params.comparison)
  if (!parsed) return { title: 'Comparison Not Found' }

  const { drugA, drugB } = parsed
  const nameA = titleCase(drugA)
  const nameB = titleCase(drugB)

  const title = `${nameA} vs ${nameB}: Coverage, Cost, and Marketplace Differences (${PLAN_YEAR})`
  const description =
    `Compare ${nameA} and ${nameB} on ACA Marketplace plans. ` +
    `Coverage status, cost tier, prior authorization, and which plans include each medication in ${PLAN_YEAR}.`
  const canonicalUrl = `${SITE_URL}/drugs/compare/${params.comparison}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonicalUrl,
      siteName: 'HealthInsuranceRenew',
      locale: 'en_US',
    },
  }
}

export default function ComparisonPage({ params }: Props) {
  const parsed = parseComparison(params.comparison)
  if (!parsed) notFound()

  const { drugA, drugB } = parsed
  const nameA = titleCase(drugA)
  const nameB = titleCase(drugB)
  const slugA = drugA.replace(/\s+/g, '-')
  const slugB = drugB.replace(/\s+/g, '-')

  const canonicalUrl = `${SITE_URL}/drugs/compare/${params.comparison}`
  const seed = SEED_PAIRS[params.comparison]

  const catA = getDrugCategory(drugA)
  const catB = getDrugCategory(drugB)
  const sharedCategory = catA && catB && catA.id === catB.id ? catA : null

  const faqs = buildComparisonFAQs(nameA, nameB, slugA, slugB, sharedCategory?.id)

  const articleSchema = buildArticleSchema({
    headline: `${nameA} vs ${nameB}: Coverage, Cost, and Marketplace Differences`,
    description: `Side-by-side comparison of ${nameA} and ${nameB} on ACA Marketplace plans for ${PLAN_YEAR}.`,
    dateModified: new Date().toISOString().slice(0, 7),
    dataSourceName: 'CMS Machine-Readable Formulary PUF',
    dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
  })

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Drug Coverage', url: `${SITE_URL}/drugs` },
    { name: `${nameA} vs ${nameB}`, url: canonicalUrl },
  ])

  const faqSchema = buildFAQSchema(faqs)

  return (
    <>
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li><a href="/drugs" className="hover:underline text-primary-600">Drug Coverage</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li aria-current="page" className="text-neutral-700 font-medium">
              {nameA} vs {nameB}
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-2">
            Drug Coverage Comparison · {PLAN_YEAR}
          </p>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            {nameA} vs {nameB}: Coverage, Cost, and Marketplace Differences ({PLAN_YEAR})
          </h1>
          {seed && (
            <p className="text-neutral-500 text-sm mb-3">{seed.context}</p>
          )}
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            This page compares how ACA Marketplace (Obamacare) plans cover {nameA} and {nameB},
            including cost tier placement, prior authorization requirements, and coverage availability
            across plans for the {PLAN_YEAR} plan year.
          </p>
        </section>

        {/* Quick summary cards */}
        <section aria-labelledby="summary-heading" className="grid sm:grid-cols-2 gap-6">
          <h2 id="summary-heading" className="sr-only">Quick Comparison Summary</h2>
          <DrugSummaryCard
            name={nameA}
            slug={slugA}
            category={catA?.label}
            note={getDrugSummaryNote(drugA)}
          />
          <DrugSummaryCard
            name={nameB}
            slug={slugB}
            category={catB?.label}
            note={getDrugSummaryNote(drugB)}
          />
        </section>

        {/* Coverage comparison table */}
        <section aria-labelledby="coverage-table-heading">
          <h2 id="coverage-table-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Coverage Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left px-4 py-3 font-semibold text-neutral-600 border border-neutral-200">Factor</th>
                  <th className="text-left px-4 py-3 font-semibold text-primary-700 border border-neutral-200">{nameA}</th>
                  <th className="text-left px-4 py-3 font-semibold text-primary-700 border border-neutral-200">{nameB}</th>
                </tr>
              </thead>
              <tbody>
                {getComparisonRows(drugA, drugB, nameA, nameB).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}>
                    <td className="px-4 py-3 font-medium text-neutral-700 border border-neutral-200">{row.factor}</td>
                    <td className="px-4 py-3 text-neutral-600 border border-neutral-200">{row.valueA}</td>
                    <td className="px-4 py-3 text-neutral-600 border border-neutral-200">{row.valueB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            Coverage varies by plan and state. Data based on CMS Machine-Readable Formulary PUF, {PLAN_YEAR}.{' '}
            Check individual drug pages for plan-level detail.
          </p>
        </section>

        {/* Who might compare these */}
        {getWhoComparesContext(params.comparison) && (
          <section
            aria-labelledby="who-compares-heading"
            className="bg-amber-50 border border-amber-200 rounded-xl p-5"
          >
            <h2 id="who-compares-heading" className="text-base font-semibold text-amber-900 mb-2">
              Who typically compares these medications?
            </h2>
            <p className="text-sm text-amber-800 leading-relaxed">
              {getWhoComparesContext(params.comparison)}
            </p>
          </section>
        )}

        {/* Individual drug links */}
        <section aria-labelledby="individual-links-heading">
          <h2 id="individual-links-heading" className="text-lg font-semibold text-navy-800 mb-4">
            Check Coverage for Each Drug
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href={`/formulary/all/${slugA}`}
              className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <div>
                <p className="font-semibold text-navy-900 group-hover:text-primary-700">{nameA} Coverage</p>
                <p className="text-xs text-neutral-500 mt-0.5">Coverage status, tier, restrictions →</p>
              </div>
              <svg className="w-4 h-4 text-neutral-400 group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </a>
            <a
              href={`/formulary/all/${slugB}`}
              className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <div>
                <p className="font-semibold text-navy-900 group-hover:text-primary-700">{nameB} Coverage</p>
                <p className="text-xs text-neutral-500 mt-0.5">Coverage status, tier, restrictions →</p>
              </div>
              <svg className="w-4 h-4 text-neutral-400 group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
        </section>

        {/* Category hub link */}
        {sharedCategory && (
          <section className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
            <p className="text-sm text-neutral-600">
              Both {nameA} and {nameB} belong to the{' '}
              <a
                href={`/drugs/categories/${sharedCategory.id}`}
                className="text-primary-600 font-medium hover:underline"
              >
                {sharedCategory.label}
              </a>{' '}
              category. See the full list of {sharedCategory.label.toLowerCase()} covered
              by Marketplace plans.
            </p>
          </section>
        )}

        {/* FAQ */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-5">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-neutral-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-navy-900 font-medium text-sm hover:bg-neutral-50 transition-colors list-none">
                  {faq.question}
                  <svg className="w-4 h-4 text-neutral-400 flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-4 pt-1 text-sm text-neutral-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Soft CTA */}
        <section className="bg-primary-50 border border-primary-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-primary-900 mb-2">
            Need help choosing a plan that covers {nameA} or {nameB}?
          </h2>
          <p className="text-sm text-primary-700 mb-4">
            Check which Marketplace plans include your medication and estimate your subsidy.
          </p>
          <a
            href="/plans"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Check Plans Near You
          </a>
        </section>

        {/* Disclaimer */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Drug coverage data sourced from the CMS Machine-Readable Formulary PUF, plan year {PLAN_YEAR}.
            Coverage information reflects issuer formulary filings and is subject to change. Verify coverage
            directly with your insurer before enrolling.
          </p>
          <p>
            This page is for informational purposes only and does not constitute medical or insurance advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> to evaluate your specific coverage options.
          </p>
        </footer>

      </main>
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function DrugSummaryCard({
  name, slug, category, note,
}: {
  name: string
  slug: string
  category?: string
  note: string
}) {
  return (
    <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">
        {category ?? 'Prescription Drug'}
      </p>
      <h3 className="text-xl font-bold text-navy-900 mb-2">{name}</h3>
      <p className="text-sm text-neutral-600 mb-4">{note}</p>
      <a
        href={`/formulary/all/${slug}`}
        className="text-sm text-primary-600 font-medium hover:underline"
      >
        Check {name} coverage →
      </a>
    </div>
  )
}

// ── Drug summary notes ────────────────────────────────────────────────────────

const DRUG_NOTES: Record<string, string> = {
  metformin: 'Generic first-line medication for type 2 diabetes. Available as Tier 1 (generic) on nearly all Marketplace plans.',
  ozempic: 'Brand-name GLP-1 agonist (semaglutide) for type 2 diabetes. Tier 3–4 on most plans. Prior authorization common.',
  wegovy: 'Brand-name semaglutide approved specifically for chronic weight management. Specialty tier; limited coverage on many plans.',
  mounjaro: 'Brand-name dual GIP/GLP-1 agonist (tirzepatide) for type 2 diabetes. Specialty tier; prior authorization typically required.',
  jardiance: 'Brand-name SGLT2 inhibitor for type 2 diabetes and heart failure. Tier 3 on most plans; prior authorization varies.',
  trulicity: 'Brand-name GLP-1 agonist (dulaglutide) for type 2 diabetes. Tier 3 on most plans.',
  lisinopril: 'Generic ACE inhibitor for hypertension and heart failure. Tier 1 (generic) on virtually all Marketplace plans.',
  losartan: 'Generic ARB for hypertension. Tier 1 (generic) on nearly all Marketplace plans.',
  atorvastatin: 'Generic statin for high cholesterol. Tier 1 (generic) on virtually all plans. Widely covered.',
  rosuvastatin: 'Generic statin (formerly brand Crestor). Tier 1 on most plans. Some brand-name versions may be Tier 2.',
  sertraline: 'Generic SSRI antidepressant. Tier 1 (generic) on most Marketplace plans.',
  escitalopram: 'Generic SSRI antidepressant. Tier 1 (generic) on most Marketplace plans.',
  eliquis: 'Brand-name anticoagulant (apixaban). Specialty or Tier 3 on most plans; no generic available.',
  xarelto: 'Brand-name anticoagulant (rivaroxaban). Specialty or Tier 3 on most plans; no generic available.',
  humira: 'Brand-name biologic (adalimumab) for autoimmune conditions. Specialty tier; prior authorization required.',
  levothyroxine: 'Generic thyroid hormone replacement. Tier 1 (generic) on virtually all plans.',
  synthroid: 'Brand-name thyroid hormone (levothyroxine). Tier 2 or higher; generic is preferred.',
}

function getDrugSummaryNote(drug: string): string {
  return DRUG_NOTES[drug.toLowerCase()] ?? `${titleCase(drug)} is a prescription medication. Coverage and tier vary by Marketplace plan.`
}

// ── Comparison table rows ────────────────────────────────────────────────────

interface ComparisonRow { factor: string; valueA: string; valueB: string }

const DRUG_COMPARISON_DATA: Record<string, {
  type: string; tier: string; pa: string; genericAvailable: string; approvedUse: string
}> = {
  metformin: { type: 'Generic (biguanide)', tier: 'Tier 1 (Generic)', pa: 'Not required', genericAvailable: 'Yes', approvedUse: 'Type 2 diabetes (first-line)' },
  ozempic: { type: 'Brand (GLP-1 agonist)', tier: 'Tier 3–4 (Preferred/Non-Preferred Brand)', pa: 'Often required', genericAvailable: 'No', approvedUse: 'Type 2 diabetes' },
  wegovy: { type: 'Brand (GLP-1 agonist)', tier: 'Tier 4 (Specialty)', pa: 'Required on most plans', genericAvailable: 'No', approvedUse: 'Chronic weight management (BMI ≥30)' },
  mounjaro: { type: 'Brand (GIP/GLP-1 agonist)', tier: 'Tier 4 (Specialty)', pa: 'Required on most plans', genericAvailable: 'No', approvedUse: 'Type 2 diabetes' },
  jardiance: { type: 'Brand (SGLT2 inhibitor)', tier: 'Tier 3 (Non-Preferred Brand)', pa: 'Varies by plan', genericAvailable: 'No (patent protected through 2028+)', approvedUse: 'Type 2 diabetes, heart failure' },
  lisinopril: { type: 'Generic (ACE inhibitor)', tier: 'Tier 1 (Generic)', pa: 'Not required', genericAvailable: 'Yes', approvedUse: 'Hypertension, heart failure, CKD' },
  losartan: { type: 'Generic (ARB)', tier: 'Tier 1 (Generic)', pa: 'Not required', genericAvailable: 'Yes', approvedUse: 'Hypertension, diabetic nephropathy' },
  amlodipine: { type: 'Generic (CCB)', tier: 'Tier 1 (Generic)', pa: 'Not required', genericAvailable: 'Yes', approvedUse: 'Hypertension, angina' },
  atorvastatin: { type: 'Generic (statin)', tier: 'Tier 1 (Generic)', pa: 'Not required', genericAvailable: 'Yes', approvedUse: 'High cholesterol, cardiovascular prevention' },
  rosuvastatin: { type: 'Generic (statin)', tier: 'Tier 1 (Generic)', pa: 'Not required', genericAvailable: 'Yes', approvedUse: 'High cholesterol, cardiovascular prevention' },
  sertraline: { type: 'Generic (SSRI)', tier: 'Tier 1 (Generic)', pa: 'Not required', genericAvailable: 'Yes', approvedUse: 'Depression, anxiety, OCD, PTSD' },
  escitalopram: { type: 'Generic (SSRI)', tier: 'Tier 1 (Generic)', pa: 'Not required', genericAvailable: 'Yes', approvedUse: 'Depression, generalized anxiety disorder' },
  eliquis: { type: 'Brand (NOAC)', tier: 'Tier 3–4 (Non-Preferred/Specialty)', pa: 'Sometimes required', genericAvailable: 'No', approvedUse: 'AFib, DVT, PE prevention and treatment' },
  xarelto: { type: 'Brand (NOAC)', tier: 'Tier 3–4 (Non-Preferred/Specialty)', pa: 'Sometimes required', genericAvailable: 'No', approvedUse: 'AFib, DVT, PE prevention and treatment' },
  humira: { type: 'Brand (biologic/TNF inhibitor)', tier: 'Tier 4 (Specialty)', pa: 'Required', genericAvailable: 'Yes (biosimilars)', approvedUse: 'RA, psoriasis, Crohn\'s, UC, AS' },
  levothyroxine: { type: 'Generic (thyroid hormone)', tier: 'Tier 1 (Generic)', pa: 'Not required', genericAvailable: 'Yes', approvedUse: 'Hypothyroidism' },
  synthroid: { type: 'Brand (thyroid hormone)', tier: 'Tier 2 (Preferred Brand)', pa: 'Rarely required', genericAvailable: 'Yes (levothyroxine)', approvedUse: 'Hypothyroidism' },
}

function getComparisonRows(drugA: string, drugB: string, nameA: string, nameB: string): ComparisonRow[] {
  const dataA = DRUG_COMPARISON_DATA[drugA.toLowerCase()]
  const dataB = DRUG_COMPARISON_DATA[drugB.toLowerCase()]

  const fallback = { type: 'Prescription drug', tier: 'Varies by plan', pa: 'Varies by plan', genericAvailable: 'Check formulary', approvedUse: 'Check prescribing information' }
  const a = dataA ?? fallback
  const b = dataB ?? fallback

  return [
    { factor: 'Drug type', valueA: a.type, valueB: b.type },
    { factor: 'Typical cost tier', valueA: a.tier, valueB: b.tier },
    { factor: 'Prior authorization', valueA: a.pa, valueB: b.pa },
    { factor: 'Generic available', valueA: a.genericAvailable, valueB: b.genericAvailable },
    { factor: 'Primary approved use', valueA: a.approvedUse, valueB: b.approvedUse },
  ]
}

// ── Who compares context ─────────────────────────────────────────────────────

const WHO_COMPARES: Record<string, string> = {
  'metformin-vs-ozempic': 'People recently diagnosed with type 2 diabetes often compare metformin (the standard first-line generic) with Ozempic (a newer branded GLP-1 injection). They differ significantly in cost, how they work, and Marketplace coverage.',
  'ozempic-vs-wegovy': 'People who have been prescribed semaglutide for either diabetes or weight loss often compare these two products. They contain the same active ingredient but are approved for different conditions — which affects Marketplace plan coverage.',
  'ozempic-vs-mounjaro': 'People with type 2 diabetes considering injectable GLP-1 therapy frequently compare these two options. Both require prior authorization on most plans; mounjaro (tirzepatide) is newer and may have different formulary placement.',
  'lisinopril-vs-losartan': 'Patients with hypertension or heart failure often compare these two first-line generics. Both are Tier 1 on virtually all Marketplace plans, so the comparison is usually clinical rather than cost-driven.',
  'atorvastatin-vs-rosuvastatin': 'People managing high cholesterol on Marketplace plans compare these two statins. Both are Tier 1 generics on most plans, so cost is similar — the comparison is typically about clinical preference or side effect profiles.',
  'sertraline-vs-escitalopram': 'People starting antidepressant therapy often compare these two commonly prescribed SSRIs. Both are Tier 1 generics on Marketplace plans, making coverage nearly identical.',
  'eliquis-vs-xarelto': 'People with atrial fibrillation or DVT/PE risk compare these two NOACs. Both are brand-name medications with high out-of-pocket costs; Marketplace coverage and prior authorization requirements vary significantly by plan.',
}

function getWhoComparesContext(comparison: string): string | null {
  return WHO_COMPARES[comparison] ?? null
}

// ── FAQ content ──────────────────────────────────────────────────────────────

interface FAQ { question: string; answer: string }

function buildComparisonFAQs(
  nameA: string,
  nameB: string,
  slugA: string,
  slugB: string,
  categoryId?: string,
): FAQ[] {
  return [
    {
      question: `Which is covered more broadly on Marketplace plans — ${nameA} or ${nameB}?`,
      answer: `Coverage varies by plan and state. Generally, generic medications (Tier 1) are covered on virtually all Marketplace plans with low copays. Brand-name drugs (Tier 3–4) are covered on fewer plans and at higher cost. Check the individual coverage pages for ${nameA} and ${nameB} to see plan-level data for your state.`,
    },
    {
      question: `Do I need prior authorization for ${nameA} or ${nameB}?`,
      answer: `Prior authorization (PA) requirements vary by plan. Generic medications rarely require PA. Brand-name medications — especially GLP-1 agonists, biologics, and specialty drugs — commonly require prior authorization. Your doctor can submit a PA request on your behalf. If denied, you have the right to appeal.`,
    },
    {
      question: `Can I switch from ${nameA} to ${nameB} if my plan doesn't cover one?`,
      answer: `Switching between medications is a clinical decision for your doctor. If your plan doesn't cover a medication or places it at a high cost tier, you can: (1) request a formulary exception, (2) ask your doctor about covered alternatives, (3) switch to a plan with better coverage during open enrollment, or (4) apply for manufacturer patient assistance programs.`,
    },
    {
      question: `How do I find a Marketplace plan that covers both ${nameA} and ${nameB}?`,
      answer: `During open enrollment, use the plan finder on HealthCare.gov (or your state exchange) and enter both medications to filter plans. A licensed insurance agent can also help you compare formularies across all available plans in your area to find one that covers your specific medications at the lowest tier.`,
    },
    {
      question: `What is the difference in out-of-pocket cost for ${nameA} vs ${nameB}?`,
      answer: `Out-of-pocket cost depends on your plan's tier placement, deductible, copay or coinsurance structure, and whether you've met your deductible or out-of-pocket maximum. Generic Tier 1 drugs typically cost $5–$20 per fill after deductible. Brand-name Tier 3–4 drugs can cost $50–$400+ per fill, though specialty drugs may qualify for cost-sharing reductions.`,
    },
  ]
}
