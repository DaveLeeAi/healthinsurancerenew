import type { Metadata } from 'next'
import { loadBillingIntel, getBillingByCategory } from '@/lib/data-loader'
import { getRelatedEntities } from '@/lib/entity-linker'
import {
  buildBillingProcedureSchema,
  buildBreadcrumbSchema,
  buildArticleSchema,
  buildFAQSchema,
  extractCptCodes,
} from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import EntityLinkCard from '@/components/EntityLinkCard'
import { generateBillingContent } from '@/lib/content-templates'
import type { BillingScenario, BillingCodeEntry } from '@/lib/types'

const SITE_URL = 'https://healthinsurancerenew.com'

const CATEGORY_DISPLAY: Record<string, string> = {
  preventive_split_billing: 'Preventive Split Billing',
  lab_routing: 'Lab Routing & Network Status',
  facility_fee: 'Facility Fees',
  emergency_care: 'Emergency Care Billing',
  specialist_referral: 'Specialist Referrals',
  outpatient_surgery: 'Outpatient Surgery Billing',
  mental_health_parity: 'Mental Health Parity',
  observation_status: 'Observation vs Inpatient Status',
  prescription_drug_tiers: 'Prescription Drug Tiers',
  out_of_network_air_ambulance: 'Air Ambulance & Out-of-Network',
  telehealth_cost_sharing: 'Telehealth Cost-Sharing',
  bundled_vs_unbundled: 'Bundled vs Unbundled Codes',
  deductible_reset: 'Deductible Reset Timing',
  moop_accumulation: 'Out-of-Pocket Maximum',
  preventive_screening_aca: 'ACA Preventive Screenings',
  coordination_of_benefits: 'Coordination of Benefits',
  dme_billing: 'Durable Medical Equipment',
  inpatient_drug_billing: 'Inpatient Drug Billing',
  cob_fsa_hsa: 'FSA & HSA Coordination',
  surprise_billing_protections: 'Surprise Billing Protections',
}

interface Props {
  params: { cpt_code: string }
}

// ---------------------------------------------------------------------------
// Static params — 20 billing scenarios by category
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const dataset = loadBillingIntel()
  return dataset.data.map((b) => ({ cpt_code: b.billing_category }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const scenario = getBillingByCategory(params.cpt_code)
  if (!scenario) return { title: 'Billing Scenario Not Found' }

  const cptCodes = extractCptCodes(scenario)
  const cptLabel = cptCodes.length > 0 ? ` (CPT ${cptCodes[0]})` : ''
  const canonicalUrl = `${SITE_URL}/billing/${params.cpt_code}`

  const title = `Understanding Your Bill: ${scenario.title}${cptLabel} | Insurance Billing Guide`
  const description =
    `${scenario.description.slice(0, 140)}... ` +
    `Learn how insurance covers this, common billing surprises, and what to do if you get this bill.`

  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      title,
      description: description.slice(0, 160),
      url: canonicalUrl,
      siteName: 'HealthInsuranceRenew',
      locale: 'en_US',
    },
  }
}

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

function buildFAQs(scenario: BillingScenario): Array<{ question: string; answer: string }> {
  const catDisplay = CATEGORY_DISPLAY[scenario.billing_category] ?? scenario.billing_category.replace(/_/g, ' ')
  const cptCodes = extractCptCodes(scenario)

  const faqs: Array<{ question: string; answer: string }> = [
    {
      question: `What does "${scenario.title}" mean on my medical bill?`,
      answer: scenario.description,
    },
    {
      question: `How does my insurance plan handle ${catDisplay.toLowerCase()}?`,
      answer: `Coverage depends on your plan type (Bronze, Silver, Gold, Platinum) and whether providers are in-network. ${Object.entries(scenario.cost_impact_by_plan_type).slice(0, 2).map(([, v]) => v).join('. ')}. Always check your Explanation of Benefits (EOB) to verify how your plan processed the claim.`,
    },
    {
      question: 'What should I do if I receive an unexpected bill for this?',
      answer: 'First, request an itemized bill and compare it line-by-line with your EOB. Verify that all codes are correct and that in-network providers were billed at in-network rates. If you find errors, call your insurer\'s customer service to dispute. For surprise bills from out-of-network providers, the No Surprises Act may protect you. Keep all documentation and note dates and names when calling.',
    },
    {
      question: 'Can I appeal this charge with my insurance company?',
      answer: 'Yes. Under the ACA, you have the right to an internal appeal for any claim denial or unexpected charge. If the internal appeal is denied, you can request an External Independent Review. For billing disputes involving the No Surprises Act, you can also file a complaint with the federal No Surprises Help Desk at 1-800-985-3059.',
    },
    {
      question: `What are the consumer protections for ${catDisplay.toLowerCase()}?`,
      answer: `Key protections include: ${scenario.related_cfr}. Additionally, the ACA requires all plans to provide a Summary of Benefits and Coverage (SBC) that explains cost-sharing for common medical events. Your state's Department of Insurance can investigate billing complaints against insurers.`,
    },
  ]

  if (cptCodes.length > 0) {
    faqs.push({
      question: `What do CPT codes ${cptCodes.slice(0, 3).join(', ')} mean?`,
      answer: `These Current Procedural Terminology (CPT) codes identify specific medical services for billing purposes. ${getAllCodeEntries(scenario).slice(0, 3).map((e) => `CPT ${e.cpt}: ${e.description}`).join('. ')}. CPT codes are maintained by the American Medical Association and are used by all insurers to process claims.`,
    })
  }

  if (scenario.how_it_gets_coded.icd10_examples && scenario.how_it_gets_coded.icd10_examples.length > 0) {
    faqs.push({
      question: 'What ICD-10 diagnosis codes are associated with this billing scenario?',
      answer: `Common ICD-10 codes paired with this scenario include: ${scenario.how_it_gets_coded.icd10_examples.join('; ')}. ICD-10 codes identify the medical reason for the service. The combination of CPT (procedure) and ICD-10 (diagnosis) codes determines how your insurer processes and covers the claim.`,
    })
  }

  return faqs
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAllCodeEntries(scenario: BillingScenario): BillingCodeEntry[] {
  const c = scenario.how_it_gets_coded
  const entries: BillingCodeEntry[] = []
  if (c.code_1) entries.push(c.code_1)
  if (c.code_2) entries.push(c.code_2)
  for (const e of c.code_2_examples ?? []) entries.push(e)
  for (const e of c.facility_codes ?? []) entries.push(e)
  for (const e of c.physician_codes ?? []) entries.push(e)
  for (const e of c.ancillary_codes ?? []) entries.push(e)
  return entries
}

function formatCategory(cat: string): string {
  return CATEGORY_DISPLAY[cat] ?? cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function riskColor(level: string): { bg: string; text: string } {
  if (level.startsWith('High')) return { bg: 'bg-red-50 border-red-200', text: 'text-red-800' }
  if (level.startsWith('Medium-High')) return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800' }
  if (level.startsWith('Medium')) return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' }
  return { bg: 'bg-green-50 border-green-200', text: 'text-green-800' }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BillingScenarioPage({ params }: Props) {
  const scenario = getBillingByCategory(params.cpt_code)

  if (!scenario) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-neutral-500">Billing scenario not found.</p>
      </main>
    )
  }

  const cptCodes = extractCptCodes(scenario)
  const codeEntries = getAllCodeEntries(scenario)
  const coding = scenario.how_it_gets_coded
  const catDisplay = formatCategory(scenario.billing_category)
  const cptLabel = cptCodes.length > 0 ? ` (CPT ${cptCodes[0]})` : ''
  const canonicalUrl = `${SITE_URL}/billing/${params.cpt_code}`
  const risk = riskColor(scenario.consumer_risk_level)

  // --- Other scenarios for cross-linking ---
  const allScenarios = loadBillingIntel().data
  const otherScenarios = allScenarios.filter((s) => s.id !== scenario.id).slice(0, 5)

  // --- Entity links ---
  const entityLinks = getRelatedEntities({
    pageType: 'billing',
    billingCategory: scenario.billing_category,
  })

  // --- Editorial content ---
  const editorial = generateBillingContent({ scenario })

  // --- FAQs ---
  const faqs = buildFAQs(scenario)

  // --- Schema ---
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Billing Guides', url: `${SITE_URL}/billing` },
    { name: scenario.title, url: canonicalUrl },
  ])

  const articleSchema = buildArticleSchema({
    headline: `${scenario.title}${cptLabel} — Insurance Billing Guide`,
    description: scenario.description,
    dateModified: new Date().toISOString().slice(0, 10),
    dataSourceName: 'AMA CPT, CMS ACA Regulations',
    dataSourceUrl: 'https://www.cms.gov/nosurprises',
  })

  const billingSchema = buildBillingProcedureSchema({ scenario })
  const faqSchema = buildFAQSchema(faqs)

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={billingSchema} id="billing-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li><a href="/billing" className="hover:underline text-primary-600">Billing Guides</a></li>
            <li aria-hidden="true" className="text-neutral-300">›</li>
            <li aria-current="page" className="text-neutral-700 font-medium truncate max-w-sm">
              {scenario.title}
            </li>
          </ol>
        </nav>

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            {scenario.title}
            {cptLabel && (
              <span className="text-lg font-normal text-neutral-500 ml-2">{cptLabel}</span>
            )}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {catDisplay}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${risk.bg} ${risk.text}`}>
              {scenario.consumer_risk_level}
            </span>
          </div>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            {scenario.description}
          </p>
        </section>

        {/* ── What This Code Means ── */}
        {codeEntries.length > 0 && (
          <section aria-labelledby="codes-heading">
            <h2 id="codes-heading" className="text-xl font-semibold text-navy-800 mb-4">
              What These Codes Mean
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-blue-800">
                    <th className="text-left py-3 px-4 font-semibold">CPT Code</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-left py-3 px-4 font-semibold">Cost-Sharing</th>
                  </tr>
                </thead>
                <tbody>
                  {codeEntries.map((entry, i) => (
                    <tr key={`${entry.cpt}-${i}`} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4 font-mono font-semibold text-navy-800">{entry.cpt}</td>
                      <td className="py-3 px-4 text-neutral-600">{entry.description}</td>
                      <td className="py-3 px-4 text-neutral-500 text-xs">
                        {entry.cost_sharing ?? 'Varies by plan'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {coding.modifier && (
              <div className="mt-3 bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-600">
                <span className="font-semibold text-navy-700">Modifier: </span>
                {coding.modifier}
              </div>
            )}
            {coding.billing_mechanism && (
              <p className="text-sm text-neutral-500 mt-2">
                <span className="font-medium">How it works: </span>{coding.billing_mechanism}
              </p>
            )}
            <p className="text-xs text-neutral-400 mt-2">
              CPT codes &copy; American Medical Association. Codes provided for educational reference only.
            </p>
          </section>
        )}

        {/* ── ICD-10 Cross-Reference ── */}
        {coding.icd10_examples && coding.icd10_examples.length > 0 && (
          <section aria-labelledby="icd10-heading">
            <h2 id="icd10-heading" className="text-xl font-semibold text-navy-800 mb-4">
              ICD-10 Diagnosis Codes Commonly Paired
            </h2>
            <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
              <p className="text-sm text-neutral-600 mb-3">
                These ICD-10 diagnosis codes typically appear alongside the CPT codes in this billing
                scenario. The diagnosis code tells your insurer <em>why</em> the service was
                performed, which affects coverage determinations.
              </p>
              <ul className="space-y-2">
                {coding.icd10_examples.map((code) => (
                  <li key={code} className="flex items-start gap-2 text-sm">
                    <span className="font-mono font-semibold text-navy-700 flex-shrink-0">
                      {code.split(' ')[0]}
                    </span>
                    <span className="text-neutral-600">
                      {code.includes('(') ? code.slice(code.indexOf('(') + 1, -1) : code}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── How Insurance Covers This ── */}
        <section aria-labelledby="coverage-heading">
          <h2 id="coverage-heading" className="text-xl font-semibold text-navy-800 mb-4">
            How Insurance Covers This
          </h2>
          <p className="text-neutral-600 text-sm mb-4">
            Cost-sharing varies significantly by plan type. Here is how each metal level typically
            handles this scenario.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(scenario.cost_impact_by_plan_type).map(([planType, impact]) => (
              <div
                key={planType}
                className="p-4 rounded-xl bg-neutral-50 border border-neutral-200"
              >
                <div className="text-sm font-semibold text-navy-700 mb-2 capitalize">
                  {planType.replace(/_/g, ' ')}
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{impact}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Common Billing Surprises ── */}
        <section aria-labelledby="surprises-heading">
          <h2 id="surprises-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Common Billing Surprises
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
            <SurpriseItem
              title="Balance Billing"
              text="If an out-of-network provider charges more than your insurer's allowed amount, you may receive a 'balance bill' for the difference. The No Surprises Act protects against this for emergency services and certain in-facility scenarios, but gaps remain for non-emergency elective care."
            />
            <SurpriseItem
              title="Out-of-Network Providers at In-Network Facilities"
              text="Even at an in-network hospital, individual providers (anesthesiologists, radiologists, pathologists) may be out-of-network. The No Surprises Act requires these providers to bill at in-network rates when you had no choice, but always verify before scheduled procedures."
            />
            <SurpriseItem
              title="Facility Fees"
              text="Hospital-owned clinics and outpatient centers often add a separate facility fee on top of the physician's charge for the same service. This can double or triple your cost compared to an independent physician's office. Ask whether your provider's office charges a facility fee before scheduling."
            />
            <SurpriseItem
              title="Coding Errors"
              text="Up to 80% of medical bills contain errors according to industry estimates. Common errors include: upcoding (billing a more expensive code), unbundling (billing components separately instead of as one procedure), and duplicate charges. Always request an itemized bill."
            />
          </div>
        </section>

        {/* ── What to Do If You Get This Bill ── */}
        <section aria-labelledby="action-heading">
          <h2 id="action-heading" className="text-xl font-semibold text-navy-800 mb-4">
            What to Do If You Get This Bill
          </h2>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 space-y-4">
            <ActionStep
              number={1}
              title="Request an itemized bill"
              text="Call the provider's billing department and ask for a line-by-line itemized statement showing every CPT code, quantity, and charge. Compare each line to your EOB from the insurer."
            />
            <ActionStep
              number={2}
              title="Check your Explanation of Benefits (EOB)"
              text="Your insurer sends an EOB after processing each claim. It shows the billed amount, allowed amount, what the plan paid, and what you owe. If the bill doesn't match the EOB, the provider may have billed incorrectly."
            />
            <ActionStep
              number={3}
              title="Verify coding accuracy"
              text={`Confirm that CPT codes on the bill match the services you actually received. ${cptCodes.length > 0 ? `For this scenario, expect codes like ${cptCodes.slice(0, 3).join(', ')}.` : ''} Look for upcoding, unbundling, and duplicate charges.`}
            />
            <ActionStep
              number={4}
              title="Confirm network status"
              text="Verify that all providers who billed you were in-network at the time of service. If an out-of-network provider billed you at an in-network facility for emergency or involuntary services, the No Surprises Act likely protects you."
            />
            <ActionStep
              number={5}
              title="File an appeal if needed"
              text="If you believe the bill is incorrect or the claim was improperly denied, file an internal appeal with your insurer within 180 days. If denied, request an External Independent Review. For No Surprises Act disputes, call 1-800-985-3059."
            />
            <ActionStep
              number={6}
              title="Contact a licensed agent or patient advocate"
              text="A licensed health insurance agent can review your specific billing situation, verify plan benefits, and help navigate the appeals process — typically at no additional cost to you."
            />
          </div>
        </section>

        {/* ── Consumer Tip ── */}
        <section aria-labelledby="tip-heading">
          <h2 id="tip-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Consumer Tip
          </h2>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
            <p className="text-neutral-700 leading-relaxed">{scenario.consumer_tip}</p>
            {scenario.related_cfr && (
              <p className="text-xs text-teal-700 mt-3 font-medium">
                Regulatory reference: {scenario.related_cfr}
              </p>
            )}
          </div>
        </section>

        {/* ── FAQ Section ── */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group bg-neutral-50 border border-neutral-200 rounded-xl"
              >
                <summary className="cursor-pointer px-5 py-4 text-navy-800 font-medium hover:bg-neutral-100 rounded-xl transition-colors">
                  {faq.question}
                </summary>
                <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Related Billing Scenarios ── */}
        {otherScenarios.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-semibold text-navy-800 mb-4">
              Related Billing Scenarios
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherScenarios.map((s) => {
                const sr = riskColor(s.consumer_risk_level)
                return (
                  <a
                    key={s.id}
                    href={`/billing/${s.billing_category}`}
                    className="p-4 border border-neutral-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all"
                  >
                    <div className="font-medium text-navy-800 text-sm mb-1 line-clamp-2">
                      {s.title}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${sr.bg} ${sr.text}`}>
                      {s.consumer_risk_level.split(' — ')[0]}
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Editorial content ── */}
        <section className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }} />

        {/* ── Entity links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ── Disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            CPT codes &copy; American Medical Association. Codes provided for educational reference
            only. Billing scenarios are generalized — actual cost-sharing depends on your specific
            plan, network, and provider agreements.
          </p>
          <p>
            This page is for informational purposes only and does not constitute medical, legal,
            or insurance advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> for guidance on your specific
            billing situation.
          </p>
        </footer>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Local sub-components
// ---------------------------------------------------------------------------

function SurpriseItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 mt-2" />
      <div>
        <h3 className="font-semibold text-amber-900 text-sm">{title}</h3>
        <p className="text-sm text-neutral-700 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

function ActionStep({
  number,
  title,
  text,
}: {
  number: number
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-primary-900 mb-1">{title}</h3>
        <p className="text-sm text-primary-700 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
