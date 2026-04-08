// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import FormularySearch from '@/components/FormularySearch'
import allStatesData from '@/data/config/all-states.json'
import { buildBreadcrumbSchema, buildDatasetSchema, buildFAQSchema } from '@/lib/schema-markup'
import Breadcrumbs from '@/components/Breadcrumbs'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import PageFaq from '@/components/PageFaq'

// ── State classification ─────────────────────────────────────────────────────

type StateEntry = { name: string; abbr: string; exchange: string; ownExchange: boolean }

const allStates = (allStatesData.states as StateEntry[]).sort(
  (a, b) => a.name.localeCompare(b.name)
)

// FFM states: plan data from Healthcare.gov PUF
const FFM_STATES = new Set([
  'AK','AL','AR','AZ','DE','FL','HI','IA','IN','KS','LA',
  'MI','MO','MS','MT','NC','ND','NE','NH','OH','OK','SC','SD','TN',
  'TX','UT','WI','WV','WY'
])

// SBM states (22 + DC): State-Based Marketplaces (includes SBM-FP states AR, GA, IL, OR)
const SBM_STATES = new Set([
  'CA','CO','CT','DC','GA','ID','IL','KY','MA','MD','ME','MN',
  'NJ','NM','NV','NY','OR','PA','RI','VA','VT','WA'
])

const STATES_WITH_DATA = new Set(
  Array.from(FFM_STATES).concat(Array.from(SBM_STATES))
)

const ffmStates = allStates.filter(s => FFM_STATES.has(s.abbr))
const sbmStates = allStates.filter(s => SBM_STATES.has(s.abbr))
const noDataStates = allStates.filter(s => !STATES_WITH_DATA.has(s.abbr))

// ── Counts from canonical drug baselines ─────────────────────────────────────
// Source: data/processed/drug_national_baselines.json (2026-04-08)
// 15,218 unique drugs across 14,851,095 FFE + 391,663 SBM records.
// Carrier total = 320 (174 FFE + 146 SBM) covering all 50 states + DC.

const DRUG_COUNT = '15,000+'
const ISSUER_COUNT = 320

// ── Drug categories ──────────────────────────────────────────────────────────

const DRUG_CATEGORIES = [
  {
    label: 'Diabetes',
    drugs: ['Metformin', 'Ozempic', 'Jardiance', 'Trulicity', 'Farxiga', 'Glipizide'],
  },
  {
    label: 'Blood Pressure',
    drugs: ['Lisinopril', 'Amlodipine', 'Losartan', 'Metoprolol', 'Hydrochlorothiazide', 'Atenolol'],
  },
  {
    label: 'Cholesterol',
    drugs: ['Atorvastatin', 'Rosuvastatin', 'Simvastatin', 'Ezetimibe', 'Pravastatin', 'Fenofibrate'],
  },
  {
    label: 'Mental Health',
    drugs: ['Sertraline', 'Escitalopram', 'Bupropion', 'Trazodone', 'Fluoxetine', 'Buspirone'],
  },
  {
    label: 'Thyroid',
    drugs: ['Levothyroxine', 'Liothyronine', 'Methimazole', 'Propylthiouracil', 'Armour Thyroid', 'Cytomel'],
  },
  {
    label: 'Weight Loss / GLP-1',
    drugs: ['Ozempic', 'Wegovy', 'Mounjaro', 'Saxenda', 'Qsymia', 'Contrave'],
  },
]

// ── FAQ items ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: 'What is a drug formulary?',
    answer:
      "A formulary is the list of prescription drugs that a health plan covers. Each marketplace plan has its own formulary, and the same drug can be on one plan's list but not another's. Formularies also group drugs into cost tiers — lower tiers cost you less out of pocket.",
  },
  {
    question: 'Why does the same drug cost different amounts on different plans?',
    answer:
      "Plans put drugs on different cost tiers. A drug on Tier 1 (generic) might cost you $10–$20 a month, while the same drug on Tier 3 (non-preferred brand) could cost $60–$100 or more. The tier your plan assigns determines your price — not the drug's retail cost.",
  },
  {
    question: 'What does prior authorization mean for my prescription?',
    answer:
      "It means your plan requires your doctor to submit paperwork explaining why you need the drug before the plan will agree to pay for it. Your doctor handles this — you don't have to do it yourself. Most documented requests are approved within a few business days.",
  },
  {
    question: "Can my plan's drug list change during the year?",
    answer:
      "Yes. Plans can update their formulary during the plan year — adding drugs, removing drugs, or moving drugs to a different cost tier. That's why it's important to confirm coverage with your plan directly, especially if you're relying on coverage for an expensive or critical medication.",
  },
  {
    question: 'How do I check if my specific plan covers a medication?',
    answer:
      'Start with the search tool above to see general coverage across marketplace plans in your state. For your specific plan, check the Summary of Benefits and Coverage (SBC) document or call the member services number on your insurance card.',
  },
]

// ── Metadata ─────────────────────────────────────────────────────────────────

const CANONICAL = 'https://healthinsurancerenew.com/formulary'

const META_TITLE = 'Drug Coverage Lookup — All 2026 Marketplace Plans'
const META_DESCRIPTION =
  'Look up whether your medication is covered by your 2026 health plan. We reviewed drug coverage across 320 insurance companies in all 50 states and DC.'

export function generateMetadata(): Metadata {
  return {
    title: META_TITLE,
    description: META_DESCRIPTION,
    alternates: { canonical: CANONICAL },
    openGraph: {
      title: META_TITLE,
      description: META_DESCRIPTION,
      url: CANONICAL,
      type: 'website',
      siteName: 'HealthInsuranceRenew',
    },
    twitter: {
      card: 'summary_large_image',
      title: META_TITLE,
      description: META_DESCRIPTION,
    },
  }
}

// ── Structured data ──────────────────────────────────────────────────────────

function getStructuredData(): object[] {
  const dataset = buildDatasetSchema({
    name: 'ACA Marketplace Drug Coverage Dataset',
    description: `Prescription drug coverage data for ${DRUG_COUNT} medications across ${ISSUER_COUNT} insurance companies on the ACA Marketplace in all 50 states and DC. Includes drug tier, prior authorization, step therapy, and quantity limit flags. Source: federal plan benefit documents and carrier formulary filings.`,
    url: CANONICAL,
    year: '2026',
  })

  const breadcrumbs = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://healthinsurancerenew.com' },
    { name: 'Drug Coverage Lookup', url: CANONICAL },
  ])

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Does Your Health Plan Cover Your Medication?',
    url: CANONICAL,
    description: META_DESCRIPTION,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['#formulary-bluf'],
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://healthinsurancerenew.com/formulary/all/{drug_name}',
      },
      'query-input': 'required name=drug_name',
    },
  }

  const faqSchema = buildFAQSchema(FAQ_ITEMS)

  return [dataset, breadcrumbs, webPage, faqSchema]
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FormularyIndexPage() {
  const schemas = getStructuredData()

  return (
    <>
      {/* Structured data */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <LlmComment
        pageType="formulary-index"
        data="federal-plan-benefit-documents"
        extra={{ drugs: DRUG_COUNT, issuers: ISSUER_COUNT, states: STATES_WITH_DATA.size }}
      />

      <main className="mx-auto px-5 pt-6 pb-16" style={{ maxWidth: 800 }}>

        {/* ── BREADCRUMB ───────────────────────────────────────── */}
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: 'Drug Coverage Lookup', url: '/formulary' },
          ]}
        />

        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 leading-tight mb-2">
            Does Your Health Plan Cover Your Medication?
          </h1>
          <p className="text-xs text-neutral-500 mb-4">
            Data reviewed{' '}
            <time dateTime="2026-04">March 2026</time> · 2026 plan year
          </p>
          <p className="text-base sm:text-lg text-neutral-700 leading-relaxed mb-4">
            You can check right here. We looked at drug coverage on marketplace
            health plans in all 50 states and DC for 2026 — which plans include
            a drug, what cost tier it&apos;s on, and whether you need your
            doctor&apos;s approval before you can fill it.
          </p>
        </div>

        {/* ── SEARCH BOX (client component) ─────────────────────── */}
        <FormularySearch ffmStates={ffmStates} sbmStates={sbmStates} />

        {/* ── AEO BLOCK (extractable answer for AI engines) ────── */}
        <div
          id="formulary-bluf"
          className="bg-primary-50/60 border-l-4 border-primary-400 rounded-r-lg p-4 mb-3"
        >
          <p className="text-sm sm:text-base text-navy-900 leading-relaxed">
            This tool checks drug coverage across marketplace health plans in
            all 50 states and DC for 2026. It shows which plans include a
            medication, what cost tier it&apos;s on, and whether prior approval
            is required — using the same data insurance companies are required
            to publish.
          </p>
        </div>
        <p className="text-xs text-neutral-500 mb-10">
          Drug lists can change during the plan year. Confirm with your plan
          before enrolling.
        </p>

        {/* ── WHY CHECKING MATTERS (information gain + topical authority) ── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-navy-900 mb-3">
            Why it helps to check before you pick a plan
          </h2>
          <p className="text-base text-neutral-700 leading-relaxed mb-3">
            Every marketplace health plan has its own drug list. The same
            medication can be covered on one plan and not on another — or
            covered on both but at very different prices. One plan might charge
            you $15 a month for a drug. Another plan might charge $90 for the
            same drug, or make you get your doctor&apos;s approval before it
            will pay anything.
          </p>
          <p className="text-base text-neutral-700 leading-relaxed">
            That&apos;s why checking before you enroll matters more than most
            people realize. This tool pulls from the data files that insurance
            companies are required to publish for every marketplace plan.
            You&apos;ll see how many plans in your state cover your drug, what
            tier most of them put it on, and whether you&apos;re likely to run
            into extra steps like prior approval or quantity limits.
          </p>
        </section>

        {/* ── WHAT YOU'LL SEE ──────────────────────────────────── */}
        <p className="text-sm sm:text-base text-neutral-700 leading-relaxed mb-10">
          <strong className="text-navy-900">What you&apos;ll see for each
          drug:</strong>{' '}
          Whether plans in your state include it &middot; What cost tier most
          plans assign &middot; Whether prior approval is common &middot; Which
          insurance companies cover it
        </p>

        {/* ── COMMON MEDICATIONS ───────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">
            Medications people search most
          </h2>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {DRUG_CATEGORIES.map((cat) => (
              <div key={cat.label} className="p-5 rounded-xl border border-neutral-200 h-full flex flex-col">
                <h3 className="text-sm font-semibold tracking-wide text-neutral-500 mb-3">
                  {cat.label}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cat.drugs.map((d) => (
                    <a
                      key={d}
                      href={`/formulary/all/${d.toLowerCase().replace(/\s+/g, '-')}`}
                      className="inline-flex items-center justify-center min-w-[6rem] px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700 font-medium text-center leading-tight hover:bg-primary-100 hover:border-primary-300 transition-colors"
                      title={`Check ${d} coverage`}
                    >
                      {d}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-600 mt-5">
            Don&apos;t see yours? The search covers over 15,000 medications.
          </p>
        </section>

        {/* ── STATE DATA NOTICE ────────────────────────────────── */}
        <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-4 mb-10">
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong>Coverage data is based on {STATES_WITH_DATA.size} states</strong> using the
            federal Marketplace (Healthcare.gov) and select state-based exchanges where
            machine-readable formulary data is published.
            States like CA, NY, and MA run their own exchanges &mdash; if you select one,
            we&apos;ll guide you to the correct source.
          </p>
        </div>

        {/* ── FAQ (schema emitted at page level — disable here to avoid dupes) ── */}
        <section className="border-t border-neutral-200 pt-8 mb-8">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">
            Common questions about drug coverage
          </h2>
          <PageFaq faqs={FAQ_ITEMS} includeSchema={false} />
        </section>

        <GenericByline
          dataSource="Federal plan benefit documents + carrier formulary filings"
          planYear={2026}
          lastReviewed="April 2026"
        />
      </main>
    </>
  )
}

