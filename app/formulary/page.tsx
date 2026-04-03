// NOTE: No name/NPN on this page — generic byline only
import type { Metadata } from 'next'
import FormularySearch from '@/components/FormularySearch'
import allStatesData from '@/data/config/all-states.json'
import formularyMeta from '@/data/processed/formulary_intelligence.meta.json'
import { buildBreadcrumbSchema, buildDatasetSchema } from '@/lib/schema-markup'
import GenericByline from '@/components/GenericByline'
import LlmComment from '@/components/LlmComment'
import PageFaq from '@/components/PageFaq'

// ── State classification ─────────────────────────────────────────────────────

type StateEntry = { name: string; abbr: string; exchange: string; ownExchange: boolean }

const allStates = (allStatesData.states as StateEntry[]).sort(
  (a, b) => a.name.localeCompare(b.name)
)

// FFM states: plan data from Healthcare.gov PUF (includes SBM-FP states GA, IL that use federal platform)
const FFM_STATES = new Set([
  'AK','AL','AR','AZ','DE','FL','GA','HI','IA','IL','IN','KS','LA',
  'MI','MO','MS','MT','NC','ND','NE','NH','OH','OK','SC','SD','TN',
  'TX','UT','WI','WV','WY'
])

// SBM states: formulary data from carrier PDF parsing (State-Based Marketplaces)
const SBM_STATES = new Set([
  'CA','CO','CT','DC','ID','KY','MA','MD','ME','MN',
  'NJ','NM','NV','NY','OR','PA','RI','VA','VT','WA'
])

const STATES_WITH_DATA = new Set(
  Array.from(FFM_STATES).concat(Array.from(SBM_STATES))
)

const ffmStates = allStates.filter(s => FFM_STATES.has(s.abbr))
const sbmStates = allStates.filter(s => SBM_STATES.has(s.abbr))
const noDataStates = allStates.filter(s => !STATES_WITH_DATA.has(s.abbr))

// ── Counts from formulary build metadata ─────────────────────────────────────

const DRUG_COUNT = formularyMeta.unique_drug_names.toLocaleString()
const ISSUER_COUNT = formularyMeta.unique_issuer_ids_with_data

// ── Drug categories ──────────────────────────────────────────────────────────

const DRUG_CATEGORIES = [
  {
    label: 'Diabetes',
    hubId: 'diabetes',
    drugs: ['Metformin', 'Ozempic', 'Jardiance', 'Trulicity', 'Farxiga', 'Glipizide'],
  },
  {
    label: 'Blood Pressure',
    hubId: 'blood-pressure',
    drugs: ['Lisinopril', 'Amlodipine', 'Losartan', 'Metoprolol', 'Hydrochlorothiazide', 'Atenolol'],
  },
  {
    label: 'Cholesterol',
    hubId: 'cholesterol',
    drugs: ['Atorvastatin', 'Rosuvastatin', 'Simvastatin', 'Ezetimibe', 'Pravastatin', 'Fenofibrate'],
  },
  {
    label: 'Mental Health',
    hubId: 'mental-health',
    drugs: ['Sertraline', 'Escitalopram', 'Bupropion', 'Trazodone', 'Fluoxetine', 'Buspirone'],
  },
  {
    label: 'Thyroid',
    hubId: 'thyroid',
    drugs: ['Levothyroxine', 'Liothyronine', 'Methimazole', 'Propylthiouracil', 'Armour Thyroid', 'Cytomel'],
  },
  {
    label: 'Weight Loss / GLP-1',
    hubId: 'weight-loss',
    drugs: ['Ozempic', 'Wegovy', 'Mounjaro', 'Saxenda', 'Qsymia', 'Contrave'],
  },
]

// ── FAQ items ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  { question: 'What is a drug formulary?', answer: 'A drug formulary is a list of prescription medications covered by a health insurance plan. Each plan maintains its own formulary, which determines whether a drug is covered, what tier it falls under, and what cost-sharing (copay or coinsurance) applies. Formularies are updated annually and may change during the plan year.' },
  { question: 'Why does drug coverage vary between health insurance plans?', answer: 'Each insurance issuer negotiates its own drug pricing with manufacturers and pharmacy benefit managers. These negotiations result in different formularies per plan. A drug that is Tier 1 (low cost) on one plan may be Tier 3 (higher cost) or not covered at all on another plan from a different issuer.' },
  { question: 'What does "prior authorization" mean?', answer: 'Prior authorization means your doctor must get approval from the insurance company before the plan will cover the medication. The insurer reviews whether the drug is medically necessary for your condition. Without prior authorization, the plan may deny coverage or require you to pay full price.' },
  { question: 'What are drug tiers on a health insurance plan?', answer: 'Drug tiers are categories that determine your out-of-pocket cost for a medication. Most plans use 4 to 6 tiers: Tier 1 (preferred generic, lowest cost), Tier 2 (generic), Tier 3 (preferred brand), Tier 4 (non-preferred brand), Tier 5 (specialty). The higher the tier, the more you pay.' },
  { question: 'How do I check if my medication is covered?', answer: 'Use this formulary lookup tool to search for your medication by name. Select your state and issuer to see whether the drug is covered, which tier it falls under, and whether it requires prior authorization, step therapy, or quantity limits. Always confirm coverage with your plan before filling a prescription.' },
]

// ── Metadata ─────────────────────────────────────────────────────────────────

const CANONICAL = 'https://healthinsurancerenew.com/formulary'

export function generateMetadata(): Metadata {
  return {
    title: 'Drug Formulary Lookup — Search 200,000+ Covered Medications (2026)',
    description:
      'Search prescription drug coverage across all marketplace health plans. Find your medication\'s tier, copay, and prior authorization requirements.',
    alternates: { canonical: CANONICAL },
    openGraph: {
      title: 'Drug Formulary Lookup — Search 200,000+ Covered Medications (2026)',
      description:
        'Search prescription drug coverage across all marketplace health plans. Find your medication\'s tier, copay, and prior authorization requirements.',
      url: CANONICAL,
      type: 'website',
      siteName: 'HealthInsuranceRenew',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Drug Formulary Lookup — Search 200,000+ Covered Medications (2026)',
      description:
        'Search prescription drug coverage across all marketplace health plans. Find your medication\'s tier, copay, and prior authorization requirements.',
    },
  }
}

// ── Structured data ──────────────────────────────────────────────────────────

function getStructuredData(): object[] {
  const dataset = buildDatasetSchema({
    name: 'ACA Marketplace Formulary Intelligence Dataset',
    description: `Prescription drug coverage data for ${DRUG_COUNT} unique medications across ${ISSUER_COUNT} insurance issuers on the ACA Marketplace. Includes drug tier, prior authorization, step therapy, and quantity limit flags. Source: CMS MR-PUF and carrier formulary JSON files.`,
    url: CANONICAL,
    year: '2026',
  })

  const breadcrumbs = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://healthinsurancerenew.com' },
    { name: 'Formulary Lookup', url: CANONICAL },
  ])

  const speakable = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Health Insurance Formulary & Drug Coverage Lookup',
    url: CANONICAL,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['#formulary-bluf'],
    },
    description: `Search ${DRUG_COUNT} prescription drugs across ${ISSUER_COUNT} insurance issuers for 2026. Compare drug tiers, copays, and prior authorization requirements by plan and state.`,
  }

  return [dataset, breadcrumbs, speakable]
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
        data="CMS-MR-PUF"
        extra={{ drugs: DRUG_COUNT, issuers: ISSUER_COUNT, states: STATES_WITH_DATA.size }}
      />

      <main className="mx-auto px-5 pt-10 pb-16" style={{ maxWidth: 800 }}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">
            Marketplace Drug Coverage Tool
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 leading-tight mb-3">
            Health Insurance Formulary &amp; Drug Coverage Lookup
          </h1>
          <p id="formulary-bluf" className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Search {DRUG_COUNT} prescription drugs across {ISSUER_COUNT} insurance issuers
            for 2026. Compare drug tiers, copays, and prior authorization requirements
            by plan and state. Data sourced from CMS machine-readable formulary files
            that insurers are required by law to publish.
          </p>
        </div>

        {/* ── TRUST BAR ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Data source: CMS + issuer filings
          </span>
          <span className="hidden sm:inline text-neutral-300">|</span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
            Updated: 2026 plan year
          </span>
          <span className="hidden sm:inline text-neutral-300">|</span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
            {STATES_WITH_DATA.size} states covered
          </span>
          <span className="hidden sm:inline text-neutral-300">|</span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
            Reviewed by a licensed health insurance professional
          </span>
        </div>

        {/* ── SEARCH BOX (client component) ─────────────────────── */}
        <FormularySearch ffmStates={ffmStates} sbmStates={sbmStates} />

        {/* ── WHAT YOU'LL SEE ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <PreviewCard
            icon={<CheckCircleIcon />}
            title="Coverage Status"
            description="Covered, not covered, or varies by plan"
          />
          <PreviewCard
            icon={<TierIcon />}
            title="Cost Tier"
            description="Generic, preferred brand, specialty, etc."
          />
          <PreviewCard
            icon={<ClipboardIcon />}
            title="Restrictions"
            description="Prior authorization, step therapy, quantity limits"
          />
          <PreviewCard
            icon={<BuildingIcon />}
            title="Plans & Issuers"
            description="Which insurers include the drug"
          />
        </div>

        {/* ── COMMON MEDICATIONS ───────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">
            Common medications people check
          </h2>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {DRUG_CATEGORIES.map((cat) => (
              <div key={cat.label} className="p-5 rounded-xl border border-neutral-200 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold tracking-wide text-neutral-500">
                    {cat.label}
                  </h3>
                  <a
                    href={`/drugs/categories/${cat.hubId}`}
                    className="text-xs text-primary-600 hover:underline font-medium"
                  >
                    See all &rarr;
                  </a>
                </div>
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
          <p className="text-xs text-neutral-400 mt-4 text-center">
            Browse all drug categories &rarr;{' '}
            <a href="/drugs" className="text-primary-600 hover:underline font-medium">
              Drug Coverage Hub
            </a>
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

        {/* ── WHY TRUST THIS TOOL ──────────────────────────────── */}
        <section className="border-t border-neutral-200 pt-8">
          <h2 className="text-base font-semibold text-navy-900 mb-4">
            Why trust this tool
          </h2>
          <ul className="space-y-2.5 text-sm text-neutral-600">
            <TrustBullet>
              Uses official CMS machine-readable data (MR-PUF) &mdash; the same data insurers are
              required by law to publish
            </TrustBullet>
            <TrustBullet>
              Updated for the current 2026 plan year
            </TrustBullet>
            <TrustBullet>
              Simplified into plain English &mdash; tier names, cost ranges, and restriction flags
              explained for consumers, not just brokers
            </TrustBullet>
            <TrustBullet>
              Reviewed by a licensed health insurance professional with CMS
              Elite Circle of Champions recognition
            </TrustBullet>
          </ul>
        </section>

        <PageFaq faqs={FAQ_ITEMS} />

        <GenericByline
          dataSource="CMS Machine-Readable PUF + Carrier Formulary JSON Files"
          planYear={2026}
        />
      </main>
    </>
  )
}

// ── Sub-components (server-rendered, no interactivity needed) ─────────────────

function PreviewCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-center">
      <div className="flex justify-center mb-2 text-primary-500">{icon}</div>
      <p className="text-sm font-semibold text-navy-900 mb-0.5">{title}</p>
      <p className="text-xs text-neutral-500 leading-snug">{description}</p>
    </div>
  )
}

function TrustBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
      <span>{children}</span>
    </li>
  )
}

// ── Icons ───────────────────────────────────────────────────────────────────

function CheckCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  )
}

function TierIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/>
    </svg>
  )
}
