import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  searchFormulary,
  getTopIssuerIds,
  getIssuerName,
} from '@/lib/data-loader'
import type { FormularyDrug } from '@/lib/types'
import {
  buildFormularyDrugSchema,
  buildBreadcrumbSchema,
} from '@/lib/schema-markup'
import { getRelatedEntities } from '@/lib/entity-linker'
import SchemaScript from '@/components/SchemaScript'
import EntityLinkCard from '@/components/EntityLinkCard'

const PLAN_YEAR = 2025
const SITE_URL = 'https://healthinsurancerenew.com'

const SEED_DRUGS = [
  'metformin', 'lisinopril', 'atorvastatin', 'amlodipine', 'omeprazole',
  'levothyroxine', 'albuterol', 'losartan', 'gabapentin', 'hydrochlorothiazide',
  'sertraline', 'metoprolol', 'montelukast', 'escitalopram', 'rosuvastatin',
  'bupropion', 'pantoprazole', 'duloxetine', 'furosemide', 'trazodone',
]

interface Props {
  params: { issuer: string; drug_name: string }
}

// ---------------------------------------------------------------------------
// ISR — revalidate once per day (86 400 s)
// ---------------------------------------------------------------------------

export const revalidate = 86400

// ---------------------------------------------------------------------------
// Static params — top 20 drugs × top 20 issuers (400 pages at build time)
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const topIssuers = getTopIssuerIds(20)
  const params: { issuer: string; drug_name: string }[] = []
  for (const issuer of topIssuers) {
    for (const drug of SEED_DRUGS) {
      params.push({ issuer, drug_name: drug })
    }
  }
  return params
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const drugDisplay = decodeURIComponent(params.drug_name).replace(/-/g, ' ')
  const issuerName = params.issuer !== 'all'
    ? (getIssuerName(params.issuer) ?? params.issuer)
    : 'ACA Insurers'

  const title = `Does ${issuerName} Cover ${titleCase(drugDisplay)}? ${PLAN_YEAR} Formulary Details`
  const description =
    `Check if ${issuerName} covers ${drugDisplay} on their ${PLAN_YEAR} ACA formulary. ` +
    `See tier placement, prior authorization requirements, step therapy, and quantity limits. Source: CMS MR-PUF.`
  const canonical = `${SITE_URL}/formulary/${params.issuer}/${params.drug_name}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: 'HealthInsuranceRenew',
      locale: 'en_US',
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function FormularyDrugPage({ params }: Props) {
  const drugSlug = decodeURIComponent(params.drug_name)
  const drugDisplay = drugSlug.replace(/-/g, ' ')
  const issuer = params.issuer
  const isSpecificIssuer = issuer !== 'all'

  // --- Load drug results for this issuer ---
  const results = await searchFormulary({
    drug_name: drugDisplay,
    issuer_id: isSpecificIssuer ? issuer : undefined,
  })

  // 404 if no results for a specific issuer+drug combo
  if (results.length === 0 && isSpecificIssuer) {
    notFound()
  }

  // --- Load all issuers carrying this drug (for cross-linking) ---
  const allResults = await searchFormulary({ drug_name: drugDisplay })

  const issuerName = isSpecificIssuer
    ? (results[0]?.issuer_name ?? getIssuerName(issuer) ?? `Issuer ${issuer}`)
    : 'All ACA Insurers'

  // --- Derived coverage details ---
  const tiers = [...new Set(results.map((r) => r.drug_tier).filter(Boolean))] as string[]
  const hasPriorAuth = results.some((r) => r.prior_authorization)
  const hasStepTherapy = results.some((r) => r.step_therapy)
  const hasQuantityLimit = results.some((r) => r.quantity_limit)
  const isGenericAvailable = tiers.some((t) => t.toUpperCase().includes('GENERIC'))
  const rxnormId = results.find((r) => r.rxnorm_id)?.rxnorm_id

  // --- Other issuers covering this drug ---
  const otherIssuers = getUniqueIssuers(allResults).filter((i) => i.id !== issuer)

  // --- Schema.org ---
  const drugSchema = buildFormularyDrugSchema({
    drug: {
      drug_name: drugDisplay,
      rxnorm_id: rxnormId,
      drug_tier: tiers[0],
      issuer_name: issuerName,
      plan_id: results[0]?.plan_id,
      prior_authorization: hasPriorAuth,
      step_therapy: hasStepTherapy,
      quantity_limit: hasQuantityLimit,
    },
    issuerName,
    planYear: PLAN_YEAR,
  })

  const healthPlanSchema = {
    '@context': 'https://schema.org',
    '@type': 'HealthInsurancePlan',
    name: `${issuerName} ACA Marketplace Plan`,
    identifier: issuer,
    healthPlanDrugOption: tiers.map((t) => ({
      '@type': 'HealthPlanFormulary',
      healthPlanDrugTier: t,
    })),
  }

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Formulary', url: `${SITE_URL}/formulary` },
    { name: issuerName, url: `${SITE_URL}/formulary/${issuer}/all` },
    { name: titleCase(drugDisplay), url: `${SITE_URL}/formulary/${issuer}/${drugSlug}` },
  ])

  // --- Entity links ---
  const relatedPlanIds = results
    .map((r) => r.plan_id)
    .filter((id): id is string => id != null)
    .slice(0, 5)

  const entityLinks = getRelatedEntities({
    pageType: 'formulary',
    drugName: drugDisplay,
    issuer: issuerName,
    relatedPlanIds,
  })

  // --- Other drugs to cross-link ---
  const otherDrugs = SEED_DRUGS.filter((d) => d !== drugDisplay.toLowerCase())

  return (
    <>
      <SchemaScript schema={drugSchema} id="drug-schema" />
      <SchemaScript schema={healthPlanSchema} id="health-plan-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <a href="/" className="hover:underline text-primary-600">Home</a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li>
              <a href="/formulary" className="hover:underline text-primary-600">Formulary</a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li>
              <a
                href={`/formulary/${issuer}/all`}
                className="hover:underline text-primary-600"
              >
                {issuerName}
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">
              {titleCase(drugDisplay)}
            </li>
          </ol>
        </nav>

        {/* ── H1 + intro ── */}
        <section>
          <h1 className="text-3xl font-bold text-navy-900 mb-3">
            Does {issuerName} Cover {titleCase(drugDisplay)}? {PLAN_YEAR} Formulary Details
          </h1>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            {results.length > 0 ? (
              <>
                <strong>{titleCase(drugDisplay)}</strong> is listed on{' '}
                <strong>{issuerName}</strong>&apos;s {PLAN_YEAR} ACA formulary
                with {results.length} coverage{' '}
                {results.length === 1 ? 'entry' : 'entries'}.
                {rxnormId && <> RxNorm ID: {rxnormId}.</>}{' '}
                Source: CMS Machine-Readable PUF.
              </>
            ) : (
              <>
                No formulary data found for{' '}
                <strong>{titleCase(drugDisplay)}</strong> in the {PLAN_YEAR} CMS
                dataset. Try searching across all insurers.
              </>
            )}
          </p>
        </section>

        {/* ── Coverage Status ── */}
        {results.length > 0 && (
          <section aria-labelledby="coverage-status">
            <h2
              id="coverage-status"
              className="text-xl font-semibold text-navy-800 mb-4"
            >
              Coverage Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatusCard
                label="Formulary Tier"
                value={tiers.join(', ') || 'Not specified'}
              />
              <StatusCard
                label="Prior Authorization"
                value={hasPriorAuth ? 'Required' : 'Not required'}
                highlight={hasPriorAuth}
              />
              <StatusCard
                label="Step Therapy"
                value={hasStepTherapy ? 'Required' : 'Not required'}
                highlight={hasStepTherapy}
              />
              <StatusCard
                label="Quantity Limit"
                value={hasQuantityLimit ? 'Applies' : 'No limit'}
                highlight={hasQuantityLimit}
              />
            </div>
            {isGenericAvailable && (
              <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                A generic version of {titleCase(drugDisplay)} is available,
                typically at a lower tier and lower out-of-pocket cost.
              </div>
            )}
          </section>
        )}

        {/* ── Coverage Details Table ── */}
        {results.length > 0 && (
          <section aria-labelledby="coverage-table-heading">
            <h2
              id="coverage-table-heading"
              className="text-xl font-semibold text-navy-800 mb-4"
            >
              Coverage Details by Plan
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-left">
                    <th className="px-4 py-2 font-semibold text-navy-700">Drug Name</th>
                    <th className="px-4 py-2 font-semibold text-navy-700">Tier</th>
                    <th className="px-4 py-2 font-semibold text-navy-700">Prior Auth</th>
                    <th className="px-4 py-2 font-semibold text-navy-700">Step Therapy</th>
                    <th className="px-4 py-2 font-semibold text-navy-700">Qty Limit</th>
                    <th className="px-4 py-2 font-semibold text-navy-700">Plan Year</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((d, i) => (
                    <tr
                      key={i}
                      className="border-t border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="px-4 py-2 font-medium">{d.drug_name}</td>
                      <td className="px-4 py-2">
                        <TierBadge tier={d.drug_tier} />
                      </td>
                      <td className="px-4 py-2">
                        <RestrictionBadge active={d.prior_authorization} label="PA" />
                      </td>
                      <td className="px-4 py-2">
                        <RestrictionBadge active={d.step_therapy} label="ST" />
                      </td>
                      <td className="px-4 py-2">
                        <RestrictionBadge active={d.quantity_limit} label="QL" />
                      </td>
                      <td className="px-4 py-2 text-neutral-500">
                        {d.plan_year ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-400 mt-3">
              PA = Prior Authorization · ST = Step Therapy · QL = Quantity Limit ·
              Source: CMS MR-PUF {PLAN_YEAR}
            </p>
          </section>
        )}

        {/* ── Other Insurers Covering This Drug ── */}
        {otherIssuers.length > 0 && (
          <section aria-labelledby="other-insurers-heading">
            <h2
              id="other-insurers-heading"
              className="text-xl font-semibold text-navy-800 mb-4"
            >
              Other Insurers Covering {titleCase(drugDisplay)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherIssuers.slice(0, 12).map((ins) => (
                <a
                  key={ins.id}
                  href={`/formulary/${ins.id}/${drugSlug}`}
                  className="block p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <span className="text-sm font-medium text-primary-700">
                    {ins.name ?? `Issuer ${ins.id}`}
                  </span>
                  {ins.tier && (
                    <span className="block text-xs text-neutral-500 mt-0.5">
                      Tier: {ins.tier}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Other Drugs from This Issuer ── */}
        {isSpecificIssuer && (
          <section aria-labelledby="other-drugs-heading">
            <h2
              id="other-drugs-heading"
              className="text-xl font-semibold text-navy-800 mb-4"
            >
              Other Drugs from {issuerName}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {otherDrugs.slice(0, 16).map((drug) => (
                <a
                  key={drug}
                  href={`/formulary/${issuer}/${drug}`}
                  className="block p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
                >
                  <span className="text-sm font-medium text-primary-700">
                    {titleCase(drug)}
                  </span>
                </a>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-3">
              Showing commonly searched drugs.{' '}
              <a
                href={`/formulary/${issuer}/all`}
                className="underline"
              >
                Browse all {issuerName} formulary drugs &rarr;
              </a>
            </p>
          </section>
        )}

        {/* ── Entity Links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ── Disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Formulary data sourced from the CMS Machine-Readable PUF, plan year{' '}
            {PLAN_YEAR}. Drug tier placement, prior authorization requirements,
            and quantity limits may change during the plan year. Always verify
            current coverage with your insurance carrier or at healthcare.gov.
          </p>
          <p>
            This page is for informational purposes only and does not constitute
            medical or insurance advice.{' '}
            <strong>Consult a licensed health insurance agent</strong> to confirm
            formulary coverage for your specific plan.
          </p>
        </footer>

      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

interface IssuerInfo {
  id: string
  name?: string
  tier?: string
}

function getUniqueIssuers(drugs: FormularyDrug[]): IssuerInfo[] {
  const seen = new Map<string, IssuerInfo>()
  for (const d of drugs) {
    const ids = d.issuer_ids ?? (d.issuer_id ? [d.issuer_id] : [])
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.set(id, { id, name: d.issuer_name, tier: d.drug_tier })
      }
    }
  }
  return [...seen.values()]
}

// ---------------------------------------------------------------------------
// Local sub-components
// ---------------------------------------------------------------------------

function StatusCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`p-4 rounded-xl ${
        highlight ? 'bg-amber-50 border border-amber-200' : 'bg-neutral-50'
      }`}
    >
      <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold text-navy-800">{value}</div>
    </div>
  )
}

function TierBadge({ tier }: { tier?: string }) {
  if (!tier) return <span className="text-neutral-400">—</span>
  const upper = tier.toUpperCase()
  const isGeneric = upper.includes('GENERIC')
  const isPreferred = upper.includes('PREFERRED')
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        isGeneric
          ? 'bg-green-100 text-green-700'
          : isPreferred
            ? 'bg-blue-100 text-blue-700'
            : 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {tier}
    </span>
  )
}

function RestrictionBadge({ active, label }: { active?: boolean; label: string }) {
  return active ? (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      {label}
    </span>
  ) : (
    <span className="text-neutral-400 text-xs">No</span>
  )
}
