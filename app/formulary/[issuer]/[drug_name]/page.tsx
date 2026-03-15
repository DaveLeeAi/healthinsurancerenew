import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  searchFormulary,
  getIssuerName,
  getPlanById,
} from '@/lib/data-loader'
import type { FormularyDrug } from '@/lib/types'
import {
  buildFormularyDrugSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
} from '@/lib/schema-markup'
import { getRelatedEntities } from '@/lib/entity-linker'
import SchemaScript from '@/components/SchemaScript'
import EntityLinkCard from '@/components/EntityLinkCard'
import { generateFormularyContent } from '@/lib/content-templates'

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

// Dynamic rendering — getTopIssuerIds() loads plan_intelligence.json (107 MB),
// too large to process during build. Pages render on-demand via SSR.
export const dynamic = 'force-dynamic'

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

  // ── Feature 4: FAQ data ───────────────────────────────────────────────────
  const tierCostContext = getTierCostContext(tiers)
  const formularyFaqs = [
    {
      question: `Does ${issuerName} cover ${titleCase(drugDisplay)}?`,
      answer: results.length > 0
        ? `Yes, ${issuerName} covers ${titleCase(drugDisplay)} on their ${PLAN_YEAR} ACA formulary across ${results.length} plan${results.length === 1 ? '' : 's'}. It is listed as ${tiers.join(', ') || 'specified in plan documents'}. Formulary coverage can vary by plan and county — always verify with your specific plan documents or the insurer directly.`
        : `${titleCase(drugDisplay)} was not found on the ${issuerName} formulary in the ${PLAN_YEAR} CMS dataset. You may be able to request a formulary exception through your insurer if your doctor demonstrates medical necessity.`,
    },
    {
      question: `Is prior authorization required for ${titleCase(drugDisplay)}?`,
      answer: hasPriorAuth
        ? `Yes, prior authorization is required for ${titleCase(drugDisplay)} on this formulary. Your doctor must submit a request to ${issuerName} before prescribing, demonstrating that the medication is medically necessary. Without prior authorization, claims may be denied. Prior authorization requirements can change during the plan year.`
        : `No prior authorization is required for ${titleCase(drugDisplay)} on this formulary. Your doctor can prescribe it directly without needing insurer approval beforehand. However, this can change during the plan year, so confirm with your insurer before filling.`,
    },
    {
      question: `How much does ${titleCase(drugDisplay)} cost with insurance?`,
      answer: tierCostContext
        ? `${titleCase(drugDisplay)} is placed on a ${tiers.join('/')} tier on this formulary. ${tierCostContext}. Actual cost depends on whether your deductible has been met, your specific plan variant, and your pharmacy network. A 90-day mail-order supply often reduces the per-dose cost significantly.`
        : `Cost depends on the tier placement and your plan's specific cost-sharing structure. Check your plan's Summary of Benefits and Coverage for exact copay or coinsurance amounts. A 90-day mail-order supply may reduce your per-dose cost.`,
    },
    {
      question: `What if ${titleCase(drugDisplay)} is not on my plan's formulary?`,
      answer: `If your drug is not covered, you have several options. First, request a formulary exception — your doctor submits a letter of medical necessity explaining why listed alternatives won't work for you. If denied, file an internal appeal (the insurer must respond within 72 hours for urgent requests or 30 days for standard requests). If still denied, request an independent external review, which is binding on the insurer under federal ACA law (ACA §2719, 45 CFR §147.136).`,
    },
    {
      question: `What is the difference between generic and brand-name drugs on a formulary?`,
      answer: `Generic drugs contain the same active ingredients as brand-name drugs and are FDA-approved as therapeutically equivalent. They are typically placed on lower formulary tiers (Tier 1–2) with lower copays or coinsurance — often $5–20 per fill. Brand-name drugs are usually Tier 3 or higher with higher cost-sharing. ${isGenericAvailable ? `A generic version of ${titleCase(drugDisplay)} is available on this formulary at a lower tier and lower cost.` : `Ask your doctor whether a generic alternative is available for your condition.`}`,
    },
  ]
  const faqSchema = buildFAQSchema(formularyFaqs)

  // --- Editorial content ---
  const editorial = results.length > 0
    ? generateFormularyContent({ drugName: drugDisplay, drugs: results, issuerName })
    : null

  // --- Entity links ---
  const relatedPlans = results
    .map((r) => r.plan_id)
    .filter((id): id is string => id != null)
    .slice(0, 5)
    .map((id) => {
      const plan = getPlanById(id)
      return { id, name: plan?.plan_name ?? id }
    })

  const entityLinks = getRelatedEntities({
    pageType: 'formulary',
    drugName: drugDisplay,
    issuer: issuerName,
    relatedPlans,
  })

  // --- Other drugs to cross-link ---
  const otherDrugs = SEED_DRUGS.filter((d) => d !== drugDisplay.toLowerCase())

  return (
    <>
      <SchemaScript schema={drugSchema} id="drug-schema" />
      <SchemaScript schema={healthPlanSchema} id="health-plan-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />

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

        {/* ── Feature 5: Drug Coverage Snapshot Card ── */}
        {results.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-3">
              {titleCase(drugDisplay)} Coverage Snapshot
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-neutral-500 mb-1">Drug Tier</div>
                <div className="text-sm font-semibold text-navy-800">
                  {tiers.join(', ') || '—'}
                </div>
                {tierCostContext && (
                  <div className="text-xs text-neutral-500 mt-0.5 leading-snug">{tierCostContext.split('—')[0]}</div>
                )}
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Prior Authorization</div>
                <div className={`text-sm font-semibold ${hasPriorAuth ? 'text-amber-700' : 'text-green-700'}`}>
                  {hasPriorAuth ? 'Required' : 'Not required'}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Step Therapy</div>
                <div className={`text-sm font-semibold ${hasStepTherapy ? 'text-amber-700' : 'text-green-700'}`}>
                  {hasStepTherapy ? 'Required' : 'Not required'}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Quantity Limit</div>
                <div className={`text-sm font-semibold ${hasQuantityLimit ? 'text-amber-700' : 'text-neutral-700'}`}>
                  {hasQuantityLimit ? 'Applies' : 'No limit'}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Plans Covering It</div>
                <div className="text-sm font-semibold text-navy-800">{results.length}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Generic Available</div>
                <div className={`text-sm font-semibold ${isGenericAvailable ? 'text-green-700' : 'text-neutral-600'}`}>
                  {isGenericAvailable ? 'Yes — lower cost' : 'Not on formulary'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Feature 6: Estimated Out-of-Pocket Cost Visual ── */}
        {results.length > 0 && tiers.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
              Estimated Out-of-Pocket Cost per Fill
            </p>
            <EstimatedCostVisual tiers={tiers} drugDisplay={drugDisplay} />
          </div>
        )}

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
                across {results.length} plan{results.length === 1 ? '' : 's'}.
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
          {/* ── Feature 3: Data Version Bar ── */}
          <p className="text-xs text-neutral-400 mt-3">
            Last Updated: March 2026 · Data Version: CMS Marketplace PUF 2025 · Plan Year: 2025
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
                subtitle={getTierCostContext(tiers)}
              />
              <StatusCard
                label="Prior Authorization"
                value={hasPriorAuth ? 'Required' : 'No approval needed'}
                subtitle={
                  hasPriorAuth
                    ? 'Your doctor must get insurer approval before prescribing'
                    : 'Your doctor can prescribe this directly'
                }
                highlight={hasPriorAuth}
              />
              <StatusCard
                label="Step Therapy"
                value={hasStepTherapy ? 'Required' : "No 'fail first' requirement"}
                subtitle={
                  hasStepTherapy
                    ? 'You may need to try a lower-cost drug first'
                    : "You don't need to try a cheaper drug first"
                }
                highlight={hasStepTherapy}
              />
              <StatusCard
                label="Quantity Limit"
                value={hasQuantityLimit ? 'Applies' : 'No monthly fill limit'}
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

        {/* ── How to Save on This Medication ── */}
        {results.length > 0 && (
          <section aria-labelledby="save-tips-heading" className="rounded-xl border border-green-200 bg-green-50/50 p-5">
            <h2 id="save-tips-heading" className="text-base font-semibold text-green-900 mb-3">
              How to Save on {titleCase(drugDisplay)}
            </h2>
            <ul className="space-y-2.5 text-sm text-green-800">
              {isGenericAvailable && (
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold shrink-0">✓</span>
                  <span>
                    <strong>Generic available:</strong> A generic version of {titleCase(drugDisplay)} is on
                    this formulary at a lower tier. Ask your doctor to prescribe the generic to reduce your cost.
                  </span>
                </li>
              )}
              <li className="flex gap-2">
                <span className="text-green-600 font-bold shrink-0">✓</span>
                <span>
                  <strong>90-day mail order:</strong> Many plans offer a lower per-dose cost for 90-day
                  supplies through mail-order pharmacy. Ask your plan about mail-order options.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold shrink-0">✓</span>
                <span>
                  <strong>Manufacturer copay cards:</strong> Most brand-name drugs have copay assistance
                  programs that can reduce your cost to $0–$35/month. Search &ldquo;{drugDisplay} copay
                  card&rdquo; or visit the manufacturer&apos;s website.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold shrink-0">✓</span>
                <span>
                  <strong>Compare plans at open enrollment:</strong> Formulary tiers change yearly. A drug
                  on Tier 3 this year may move to Tier 2 next year — always check the formulary when
                  comparing plans.
                </span>
              </li>
            </ul>
          </section>
        )}

        {/* ── Editorial content ── */}
        {editorial && (
          <section className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: editorial.bodyHtml }} />
        )}

        {/* ── Coverage Details Table ── */}
        {results.length > 0 && (
          <section aria-labelledby="coverage-table-heading">
            <h2
              id="coverage-table-heading"
              className="text-xl font-semibold text-navy-800 mb-4"
            >
              Coverage Details
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
                    <th className="px-4 py-2 font-semibold text-navy-700">Plans</th>
                  </tr>
                </thead>
                <tbody>
                  {groupByFormulation(results).map((g, i) => (
                    <tr
                      key={i}
                      className="border-t border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="px-4 py-2 font-medium">{g.drug_name}</td>
                      <td className="px-4 py-2">
                        <TierBadge tier={g.drug_tier} />
                      </td>
                      <td className="px-4 py-2">
                        <RestrictionBadge active={g.prior_authorization} label="PA" />
                      </td>
                      <td className="px-4 py-2">
                        <RestrictionBadge active={g.step_therapy} label="ST" />
                      </td>
                      <td className="px-4 py-2">
                        <RestrictionBadge active={g.quantity_limit} label="QL" />
                      </td>
                      <td className="px-4 py-2 text-neutral-500 whitespace-nowrap">
                        {g.planCount} {g.planCount === 1 ? 'plan' : 'plans'}
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
                    {ins.name}
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

        {/* ── What If Your Plan Doesn't Cover This Drug? ── */}
        {results.length > 0 && (
          <section aria-labelledby="not-covered-heading" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <h2 id="not-covered-heading" className="text-base font-semibold text-navy-800 mb-4">
              What If Your Plan Doesn&apos;t Cover This Drug?
            </h2>
            <div className="space-y-4 text-sm text-neutral-700">
              <div>
                <h3 className="font-semibold mb-1">Formulary Exception Request</h3>
                <p className="text-neutral-600">
                  You can ask your insurer to cover a non-formulary drug by filing a formulary exception.
                  Your doctor must submit a letter of medical necessity explaining why listed alternatives
                  won&apos;t work for you.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Internal Appeal</h3>
                <p className="text-neutral-600">
                  If your exception request is denied, you have the right to file an internal appeal with
                  your insurer. Under ACA rules, they must respond within{' '}
                  <strong>72 hours for urgent requests</strong> or 30 days for standard requests.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">External Review</h3>
                <p className="text-neutral-600">
                  If your internal appeal is denied, you can request an independent external review. You
                  have this right under federal law for all non-grandfathered ACA plans. The external
                  reviewer&apos;s decision is binding on your insurer.
                </p>
              </div>
              <p className="text-xs text-neutral-400 pt-2 border-t border-neutral-200">
                Source: ACA §2719, 45 CFR §147.136. Contact your state insurance commissioner or a
                licensed health insurance agent for specific guidance.
              </p>
            </div>
          </section>
        )}

        {/* ── Entity Links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ── Feature 4: FAQ Section ── */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {formularyFaqs.map((faq, i) => (
              <details key={i} className="group border border-neutral-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors list-none">
                  <span className="font-medium text-navy-800 text-sm pr-4">{faq.question}</span>
                  <svg className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Feature 2: Data Methodology Block ── */}
        <section aria-labelledby="methodology-heading" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <h2 id="methodology-heading" className="text-sm font-semibold text-neutral-700 mb-2">Data Methodology</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Plan cost-sharing numbers and formulary information are derived from CMS Marketplace Public Use Files
            for plan year 2025. Plan details may vary by county and plan variant. Users should confirm coverage
            with the insurer before enrollment. Data is updated when CMS publishes new PUF releases.
          </p>
        </section>

        {/* ── Feature 1: Source Citations ── */}
        <section aria-labelledby="sources-heading" className="rounded-xl border border-neutral-200 p-5">
          <h2 id="sources-heading" className="text-sm font-semibold text-neutral-700 mb-3">Sources</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://www.cms.gov/marketplace/resources/data/public-use-files"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline font-medium"
              >
                CMS Machine-Readable PUF
              </a>
              <span className="text-neutral-500"> — Carrier formulary JSON files mandated by CMS for all ACA marketplace plans.</span>
            </li>
            <li>
              <a
                href="https://data.cms.gov/tools/medicare-plan-finder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline font-medium"
              >
                CMS Formulary Reference File
              </a>
              <span className="text-neutral-500"> — Drug tier, prior authorization, step therapy, and quantity limit data by plan.</span>
            </li>
            <li>
              <a
                href="https://www.healthcare.gov/glossary/formulary/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline font-medium"
              >
                Healthcare.gov Formulary Information
              </a>
              <span className="text-neutral-500"> — Official guidance on how formularies work in ACA marketplace plans.</span>
            </li>
          </ul>
        </section>

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
// EstimatedCostVisual sub-component (Feature 6)
// ---------------------------------------------------------------------------

const TIER_COST_RANGES: Record<string, { label: string; low: string; high: string; color: string; bg: string; border: string }> = {
  GENERIC:        { label: 'Generic',          low: '$5',    high: '$20',   color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200' },
  PREFERRED:      { label: 'Preferred Brand',  low: '$30',   high: '$60',   color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  NON_PREFERRED:  { label: 'Non-Preferred',    low: '$60',   high: '$100',  color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  NONPREFERRED:   { label: 'Non-Preferred',    low: '$60',   high: '$100',  color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  SPECIALTY:      { label: 'Specialty',         low: '$100',  high: '$500+', color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200' },
}

function normalizeTierKey(tier: string): string {
  return tier.toUpperCase().replace(/[-\s]+/g, '_')
}

function EstimatedCostVisual({ tiers, drugDisplay }: { tiers: string[]; drugDisplay: string }) {
  const matchedEntries = tiers
    .map((t) => {
      const key = normalizeTierKey(t)
      const found = Object.entries(TIER_COST_RANGES).find(([k]) => key.includes(k))
      return found ? { tier: t, ...found[1] } : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  if (matchedEntries.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Cost estimate unavailable for tier: {tiers.join(', ')}. Check your plan&apos;s Summary of Benefits.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {matchedEntries.map((entry, i) => (
        <div key={i} className={`rounded-lg border ${entry.border} ${entry.bg} p-4`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={`text-xs font-semibold uppercase tracking-wide ${entry.color}`}>{entry.label}</span>
              <div className={`text-2xl font-bold mt-1 ${entry.color}`}>
                {entry.low} – {entry.high}
                <span className="text-sm font-normal ml-1">per fill</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Estimated copay range for {titleCase(drugDisplay)} at this tier.
                Actual cost varies by plan deductible status and pharmacy network.
              </p>
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-neutral-400">
        Ranges are general estimates based on typical ACA marketplace cost-sharing for this tier.
        Confirm exact amounts in your plan&apos;s Summary of Benefits and Coverage.
      </p>
    </div>
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
  name: string
  tier?: string
}

interface FormulationGroup {
  drug_name: string
  drug_tier?: string
  prior_authorization?: boolean
  step_therapy?: boolean
  quantity_limit?: boolean
  planCount: number
}

function getTierCostContext(tiers: string[]): string | undefined {
  if (tiers.length === 0) return undefined
  const tierStr = tiers.join(' ').toUpperCase()
  if (tierStr.includes('SPECIALTY')) return 'Highest cost — typically 25–33% coinsurance, could be $100–500+ per fill'
  if (tierStr.includes('NON-PREFERRED') || tierStr.includes('NON_PREFERRED') || tierStr.includes('NONPREFERRED'))
    return 'Higher cost — typically $60–100+ copay or 25–40% coinsurance'
  if (tierStr.includes('PREFERRED')) return 'Moderate cost — typically $30–60 copay per fill'
  if (tierStr.includes('GENERIC')) return 'Lowest cost — typically $5–20 copay per fill'
  return undefined
}

function groupByFormulation(drugs: FormularyDrug[]): FormulationGroup[] {
  const map = new Map<string, FormulationGroup>()
  for (const d of drugs) {
    const key = [
      d.drug_name ?? '',
      d.drug_tier ?? '',
      String(!!d.prior_authorization),
      String(!!d.step_therapy),
      String(!!d.quantity_limit),
    ].join('|')
    const existing = map.get(key)
    if (existing) {
      existing.planCount += 1
    } else {
      map.set(key, {
        drug_name: d.drug_name ?? '',
        drug_tier: d.drug_tier,
        prior_authorization: d.prior_authorization,
        step_therapy: d.step_therapy,
        quantity_limit: d.quantity_limit,
        planCount: 1,
      })
    }
  }
  return [...map.values()]
}

function getUniqueIssuers(drugs: FormularyDrug[]): IssuerInfo[] {
  const seen = new Map<string, IssuerInfo>()
  for (const d of drugs) {
    const ids = d.issuer_ids ?? (d.issuer_id ? [d.issuer_id] : [])
    for (const id of ids) {
      if (!seen.has(id)) {
        const name = getIssuerName(id)
        if (!name) continue
        seen.set(id, { id, name, tier: d.drug_tier })
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
  subtitle,
  highlight = false,
}: {
  label: string
  value: string
  subtitle?: string
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
      {subtitle && (
        <div className="text-xs text-neutral-500 mt-1 leading-snug">{subtitle}</div>
      )}
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
