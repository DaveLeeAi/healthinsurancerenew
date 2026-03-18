import { notFound, redirect } from 'next/navigation'
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
import {
  humanizeTier,
  humanizeTiers,
  summarizeTierPlacement,
  getDominantTierGroup,
  interpretCoverage,
} from '@/lib/formulary-helpers'
import type { HumanTier } from '@/lib/formulary-helpers'
import {
  getDrugCategory,
  getRelatedDrugs,
  getComparisonLinks,
  getEducationalLinks,
  getStatePlanLinks,
  getRelatedGuides,
} from '@/lib/drug-linking'
import DrugPageCta from '@/components/DrugPageCta'
import allStatesData from '@/data/config/all-states.json'
import { stateCodeToSlug } from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'

const VALID_STATE_CODES = new Set(
  (allStatesData.states as { abbr: string }[]).map((s) => s.abbr.toLowerCase())
)

function isStateCode(param: string): boolean {
  return param.length === 2 && VALID_STATE_CODES.has(param.toLowerCase())
}

function getStateNameFromAbbr(abbr: string): string {
  const found = (allStatesData.states as { name: string; abbr: string }[]).find(
    (s) => s.abbr === abbr.toUpperCase()
  )
  return found?.name ?? abbr.toUpperCase()
}


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
  if (decodeURIComponent(params.drug_name).toLowerCase() === 'all') {
    return { title: 'Drug Formulary Lookup' }
  }

  const drugDisplay = decodeURIComponent(params.drug_name).replace(/-/g, ' ')
  const isState = isStateCode(params.issuer)
  const stateName = isState ? getStateNameFromAbbr(params.issuer) : undefined

  const stateConf = isState
    ? (allStatesData.states as { abbr: string; name: string; exchange: string; ownExchange: boolean }[])
        .find(s => s.abbr.toUpperCase() === params.issuer.toUpperCase())
    : undefined

  const issuerName = isState
    ? `Plans in ${stateName}`
    : params.issuer !== 'all'
      ? (getIssuerName(params.issuer) ?? params.issuer)
      : 'All Insurers'

  const title = isState
    ? `${titleCase(drugDisplay)} Coverage in ${stateName} — ${PLAN_YEAR} Marketplace (Obamacare) Plans`
    : `Does ${issuerName} Cover ${titleCase(drugDisplay)}? ${PLAN_YEAR} Marketplace Formulary`
  const description = isState
    ? stateConf?.ownExchange
      ? `Check if ${drugDisplay} is covered by ${stateName} Marketplace (Obamacare) plans. ${stateName} uses ${stateConf.exchange} for enrollment.`
      : `Is ${drugDisplay} covered by Marketplace plans in ${stateName}? See tier, cost, and prior authorization details. CMS ${PLAN_YEAR} data.`
    : `Check if ${issuerName} covers ${drugDisplay} on their ${PLAN_YEAR} Marketplace formulary. ` +
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

  // Guard: /formulary/[state]/all is not a drug search
  if (drugSlug.toLowerCase() === 'all') {
    redirect('/formulary')
  }

  const issuer = params.issuer
  const isState = isStateCode(issuer)
  const stateCode = isState ? issuer.toUpperCase() : undefined
  const isSpecificIssuer = !isState && issuer !== 'all'

  // Full state config for exchange info
  const stateConfig = isState
    ? (allStatesData.states as {
        abbr: string; name: string; exchange: string;
        exchangeUrl: string; ownExchange: boolean
      }[]).find(s => s.abbr.toUpperCase() === issuer.toUpperCase())
    : undefined
  const stateName = stateConfig?.name ?? (isState ? issuer.toUpperCase() : undefined)
  const isSBMState = stateConfig?.ownExchange ?? false

  // --- Load drug results ---
  const results = await searchFormulary({
    drug_name: drugDisplay,
    state_code: stateCode,
    issuer_id: isSpecificIssuer ? issuer : undefined,
  })

  // 404 if no results for a specific issuer+drug combo
  if (results.length === 0 && isSpecificIssuer) {
    notFound()
  }

  // --- Load all issuers carrying this drug (for cross-linking) ---
  const allResults = await searchFormulary({
    drug_name: drugDisplay,
    state_code: stateCode,
  })

  // ── SBM state or state with no formulary data — show explanation page ──
  if (isState && results.length === 0) {
    return <SBMExplanationPage
      issuer={issuer}
      drugSlug={drugSlug}
      drugDisplay={drugDisplay}
      stateName={stateName!}
      isSBMState={isSBMState}
      exchangeName={stateConfig?.exchange ?? `${stateName} Marketplace`}
      exchangeUrl={stateConfig?.exchangeUrl ?? 'https://www.healthcare.gov'}
      allResults={allResults}
    />
  }

  const issuerName = isState
    ? `Plans in ${stateName}`
    : isSpecificIssuer
      ? (results[0]?.issuer_name ?? getIssuerName(issuer) ?? `Issuer ${issuer}`)
      : 'All Insurers'

  // --- Derived coverage details ---
  const rawTiers = results.map((r) => r.drug_tier).filter(Boolean) as string[]
  const tiers = [...new Set(rawTiers)]
  const humanTiers = humanizeTiers(rawTiers)
  const dominantGroup = getDominantTierGroup(rawTiers)
  const dominantHumanTier = humanizeTier(
    results.find(r => getDominantTierGroup([r.drug_tier]) === dominantGroup)?.drug_tier
  )

  const hasPriorAuth = results.some((r) => r.prior_authorization)
  const priorAuthCount = results.filter((r) => r.prior_authorization).length
  const priorAuthPct = results.length > 0 ? (priorAuthCount / results.length) * 100 : 0
  const hasStepTherapy = results.some((r) => r.step_therapy)
  const stepTherapyCount = results.filter((r) => r.step_therapy).length
  const hasQuantityLimit = results.some((r) => r.quantity_limit)
  const quantityLimitCount = results.filter((r) => r.quantity_limit).length
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
    name: `${issuerName} Marketplace Plan`,
    identifier: issuer,
    healthPlanDrugOption: tiers.map((t) => ({
      '@type': 'HealthPlanFormulary',
      healthPlanDrugTier: t,
    })),
  }

  const breadcrumbItems = isState
    ? [
        { name: 'Home', url: SITE_URL },
        { name: 'Formulary', url: `${SITE_URL}/formulary` },
        { name: stateName!, url: `${SITE_URL}/formulary/${issuer}/all` },
        { name: titleCase(drugDisplay), url: `${SITE_URL}/formulary/${issuer}/${drugSlug}` },
      ]
    : [
        { name: 'Home', url: SITE_URL },
        { name: 'Formulary', url: `${SITE_URL}/formulary` },
        { name: issuerName, url: `${SITE_URL}/formulary/${issuer}/all` },
        { name: titleCase(drugDisplay), url: `${SITE_URL}/formulary/${issuer}/${drugSlug}` },
      ]
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems)

  // ── FAQ data ────────────────────────────────────────────────────────────
  const tierSummaryText = summarizeTierPlacement(rawTiers, titleCase(drugDisplay))
  const stateOrIssuerLabel = isState ? `in ${stateName}` : `from ${issuerName}`
  const stateOrNational = isState ? ` in ${stateName}` : ''

  // Featured snippet FAQ (first item, rendered prominently)
  const featuredSnippetFaq = {
    question: isState
      ? `Is ${titleCase(drugDisplay)} covered by Marketplace (Obamacare) plans in ${stateName}?`
      : `Is ${titleCase(drugDisplay)} covered by Marketplace (Obamacare) plans?`,
    answer: results.length > 0
      ? `Yes, ${titleCase(drugDisplay)} is covered by most Marketplace plans${stateOrNational}. ${tierSummaryText}`
      : `${titleCase(drugDisplay)} was not found on Marketplace plan formularies${stateOrNational} in the ${PLAN_YEAR} CMS dataset. You may be able to request a formulary exception if your doctor demonstrates medical necessity.`,
  }

  const formularyFaqs = [
    featuredSnippetFaq,
    {
      question: `Does ${titleCase(drugDisplay)} require prior authorization on Marketplace plans?`,
      answer: hasPriorAuth
        ? `Yes, prior authorization is required for ${titleCase(drugDisplay)} on ${priorAuthCount === results.length ? 'all' : 'some'} Marketplace plans${stateOrNational}. Your doctor must submit a request to your insurer demonstrating medical necessity before prescribing. Requirements can change during the plan year.`
        : `No, prior authorization is not required for ${titleCase(drugDisplay)} on Marketplace plans${stateOrNational}. Your doctor can prescribe it directly. However, this can change during the plan year, so confirm with your insurer before filling.`,
    },
    {
      question: `How much does ${titleCase(drugDisplay)} cost with Marketplace insurance?`,
      answer: humanTiers.length > 0
        ? `${titleCase(drugDisplay)} typically costs ${dominantHumanTier.costRange} per fill on most Marketplace plans. Actual cost depends on your deductible status, plan variant, and pharmacy network. A 90-day mail-order supply often reduces the per-dose cost.`
        : `Cost depends on your plan's specific tier placement and cost-sharing structure. Check your plan's Summary of Benefits and Coverage for exact copay or coinsurance amounts.`,
    },
    {
      question: `What tier is ${titleCase(drugDisplay)} on Marketplace drug formularies?`,
      answer: humanTiers.length > 0
        ? `${titleCase(drugDisplay)} is placed on a ${dominantHumanTier.shortLabel.toLowerCase()} tier on most Marketplace plans${stateOrNational}. ${dominantHumanTier.costHint}. Tier placement can vary by insurer, so always check your specific plan's drug list.`
        : `Tier details for ${titleCase(drugDisplay)} vary across plans. Check your specific plan's formulary document for tier placement.`,
    },
    {
      question: `What if ${titleCase(drugDisplay)} is not covered by my plan?`,
      answer: `You have options if your drug is not covered. Request a formulary exception — your doctor submits a letter of medical necessity explaining why alternatives won't work. If denied, file an internal appeal (response required within 72 hours for urgent requests). If still denied, request an independent external review, which is binding under federal law.`,
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

  // --- Coverage interpretation ---
  const coverageInterpretation = interpretCoverage({
    drugName: titleCase(drugDisplay),
    totalPlans: results.length,
    dominantGroup,
    hasPriorAuth,
    priorAuthPct,
    hasGenericAvailable: isGenericAvailable,
  })

  // --- Internal linking data ---
  const drugCategory = getDrugCategory(drugDisplay)
  const relatedDrugs = getRelatedDrugs(drugDisplay, issuer)
  const comparisonLinks = getComparisonLinks(drugDisplay)
  const educationalLinks = getEducationalLinks({
    drugName: drugDisplay,
    tierGroup: dominantGroup,
    hasPriorAuth,
    hasStepTherapy,
    hasQuantityLimit,
    category: drugCategory,
  })
  const statePlanLinks = getStatePlanLinks(drugDisplay, stateCode, stateName)
  const relatedGuides = getRelatedGuides(drugCategory)

  const priorAuthLabel = !hasPriorAuth
    ? 'Not required'
    : priorAuthPct > 80
      ? 'Usually required'
      : priorAuthPct > 30
        ? 'Sometimes required'
        : 'Rarely required'

  return (
    <>
      <SchemaScript schema={drugSchema} id="drug-schema" />
      <SchemaScript schema={healthPlanSchema} id="health-plan-schema" />
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">

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
                {isState ? stateName : issuerName}
              </a>
            </li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">
              {titleCase(drugDisplay)}
            </li>
          </ol>
        </nav>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 1: HERO ANSWER BLOCK
            The key answer in plain English — scannable in under 3 seconds
            ════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="hero-heading">
          <h1 id="hero-heading" className="text-3xl sm:text-4xl font-bold text-navy-900">
            {titleCase(drugDisplay)} Coverage{isState ? ` in ${stateName}` : ` \u2014 ${issuerName}`}
          </h1>
          <p className="text-base text-neutral-500 mt-1.5 mb-5">
            Marketplace / Obamacare Plans &bull; {PLAN_YEAR}
          </p>

          {results.length > 0 ? (
            <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/30 p-6 sm:p-7">
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-green-500 text-xl shrink-0">&#10004;</span>
                  <span className="text-neutral-500 text-base sm:text-lg">Covered:</span>
                  <span className="text-lg sm:text-xl font-bold text-green-800">
                    Yes ({results.length} plan{results.length === 1 ? '' : 's'})
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-green-500 text-xl shrink-0">&#10004;</span>
                  <span className="text-neutral-500 text-base sm:text-lg">Cost:</span>
                  <span className={`text-lg sm:text-xl font-bold ${dominantHumanTier.color}`}>
                    {dominantHumanTier.costRange}
                    <span className="text-sm font-normal text-neutral-500 ml-1">per fill (typical range)</span>
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-green-500 text-xl shrink-0">&#10004;</span>
                  <span className="text-neutral-500 text-base sm:text-lg">Tier:</span>
                  <span className="text-lg sm:text-xl font-bold text-navy-800">
                    {dominantHumanTier.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className={`text-xl shrink-0 ${hasPriorAuth ? 'text-amber-500' : 'text-green-500'}`}>
                    {hasPriorAuth ? '\u26A0' : '\u2714'}
                  </span>
                  <span className="text-neutral-500 text-base sm:text-lg">Prior Authorization:</span>
                  <span className={`text-lg sm:text-xl font-bold ${hasPriorAuth ? 'text-amber-700' : 'text-green-700'}`}>
                    {priorAuthLabel}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-500 mt-5 pt-3 border-t border-green-200/60">
                Based on CMS {PLAN_YEAR} plan data &middot; Updated March 2026 &middot; {results.length} plan{results.length === 1 ? '' : 's'} analyzed
                {isState ? ` in ${stateName}` : ` from ${issuerName}`}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Actual cost varies by plan, deductible, and pharmacy.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-neutral-600 text-lg leading-relaxed">
                No formulary records found for{' '}
                <strong>{titleCase(drugDisplay)}</strong>
                {isState
                  ? ` among ${stateName} marketplace plans in the CMS dataset.`
                  : ` in the ${PLAN_YEAR} CMS dataset.`
                }{' '}
                {isState && (
                  <a href={`/formulary/all/${drugSlug}`} className="text-primary-600 hover:underline font-medium">
                    Search all states &rarr;
                  </a>
                )}
              </p>
            </div>
          )}
        </section>

        {/* ═══ HERO CTA — plan check prompt ═══ */}
        {results.length > 0 && (
          <DrugPageCta
            variant="hero"
            drugName={titleCase(drugDisplay)}
            stateCode={stateCode}
            stateName={stateName}
          />
        )}

        {/* ═══ COST — Estimated cost per fill ═══ */}
        {results.length > 0 && humanTiers.length > 0 && (
          <section aria-labelledby="cost-heading">
            <h2 id="cost-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Estimated cost per fill
            </h2>
            <ul className="space-y-2">
              {humanTiers.map((ht) => (
                <li key={ht.group} className={`flex items-center gap-3 rounded-lg border ${ht.border} ${ht.bg} px-4 py-3`}>
                  <span className={`text-sm font-semibold ${ht.color} min-w-[160px]`}>
                    {ht.label}
                  </span>
                  <span className={`text-lg font-bold ${ht.color}`}>
                    {ht.costRange}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-neutral-400 mt-3">
              Ranges are estimates based on typical Marketplace plan cost-sharing.
              Actual cost depends on your deductible status and pharmacy network.
            </p>
          </section>
        )}

        {/* ═══ WHAT THIS MEANS — Plain-English interpretation ═══ */}
        {results.length > 0 && (
          <section aria-labelledby="interpretation-heading" className="rounded-xl bg-primary-50 border-2 border-primary-200 p-5 sm:p-6">
            <h2 id="interpretation-heading" className="text-lg font-bold text-navy-900 mb-2">
              What this means for you
            </h2>
            <p className="text-base sm:text-lg text-neutral-800 leading-relaxed">
              {coverageInterpretation}
            </p>
          </section>
        )}

        {/* ═══ MID-PAGE CTA — primary conversion ═══ */}
        {results.length > 0 && (
          <DrugPageCta
            variant="mid"
            drugName={titleCase(drugDisplay)}
            stateCode={stateCode}
            stateName={stateName}
            costRange={dominantHumanTier.costRange}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4: RESTRICTION SUMMARY CARDS
            Prior auth, step therapy, quantity limit — clean compact cards
            ════════════════════════════════════════════════════════════════ */}
        {results.length > 0 && (hasPriorAuth || hasStepTherapy || hasQuantityLimit) && (
          <section aria-labelledby="restrictions-heading">
            <h2 id="restrictions-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Coverage restrictions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <RestrictionCard
                active={hasPriorAuth}
                title="Prior authorization"
                activeText={priorAuthPct > 80
                  ? `Required on most plans (${priorAuthCount} of ${results.length})`
                  : `Required on some plans (${priorAuthCount} of ${results.length})`
                }
                inactiveText="Not required on any plan in this dataset"
                detail={hasPriorAuth
                  ? 'Your doctor must get insurer approval before prescribing. If denied, you can appeal.'
                  : 'Your doctor can prescribe this medication directly.'
                }
              />
              <RestrictionCard
                active={hasStepTherapy}
                title="Step therapy"
                activeText={`Required on ${stepTherapyCount} plan${stepTherapyCount === 1 ? '' : 's'}`}
                inactiveText="No 'try first' requirement"
                detail={hasStepTherapy
                  ? 'You may need to try a lower-cost alternative before this drug is approved.'
                  : 'You don\'t need to try other drugs first.'
                }
              />
              <RestrictionCard
                active={hasQuantityLimit}
                title="Quantity limit"
                activeText={`Applies on ${quantityLimitCount} plan${quantityLimitCount === 1 ? '' : 's'}`}
                inactiveText="No monthly fill limit"
                detail={hasQuantityLimit
                  ? 'The amount dispensed per fill may be capped. Your doctor can request an exception.'
                  : 'No restrictions on quantity per fill in this dataset.'
                }
              />
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION 5: HOW TO SAVE ON THIS MEDICATION
            ════════════════════════════════════════════════════════════════ */}
        {results.length > 0 && (
          <section aria-labelledby="save-tips-heading" className="rounded-xl border border-green-200 bg-green-50/50 p-5">
            <h2 id="save-tips-heading" className="text-base font-semibold text-green-900 mb-3">
              How to save on {titleCase(drugDisplay)}
            </h2>
            <ul className="space-y-2 text-sm text-green-800">
              {isGenericAvailable && (
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold shrink-0">&#10003;</span>
                  <span>
                    <strong>Generic available</strong> — ask your doctor to prescribe the generic version for a lower copay.
                  </span>
                </li>
              )}
              <li className="flex gap-2">
                <span className="text-green-600 font-bold shrink-0">&#10003;</span>
                <span>
                  <strong>90-day mail order</strong> — many plans offer a lower per-dose cost for 90-day supplies.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold shrink-0">&#10003;</span>
                <span>
                  <strong>Manufacturer copay cards</strong> — most brand-name drugs have copay assistance programs. Search &ldquo;{drugDisplay} copay card.&rdquo;
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 font-bold shrink-0">&#10003;</span>
                <span>
                  <strong>Compare plans at open enrollment</strong> — formulary tiers change yearly. Always check the formulary when comparing plans.
                </span>
              </li>
            </ul>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION 6: INSURER COMPARISON (moved higher)
            ════════════════════════════════════════════════════════════════ */}
        {otherIssuers.length > 0 && (
          <section aria-labelledby="insurers-heading">
            <h2 id="insurers-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Insurers that cover {titleCase(drugDisplay)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherIssuers.slice(0, 12).map((ins) => {
                const ht = humanizeTier(ins.tier)
                return (
                  <a
                    key={ins.id}
                    href={`/formulary/${ins.id}/${drugSlug}`}
                    className="block p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-primary-700">
                      {ins.name}
                    </span>
                    <span className={`block text-xs mt-0.5 ${ht.color}`}>
                      {ht.shortLabel} — {ht.costRange}
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* ═══ WHAT IF NOT COVERED? ═══ */}
        {results.length > 0 && (
          <section aria-labelledby="not-covered-heading" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <h2 id="not-covered-heading" className="text-base font-semibold text-navy-800 mb-3">
              What if your plan doesn&apos;t cover this drug?
            </h2>
            <div className="space-y-3 text-sm text-neutral-700">
              <div className="flex gap-3">
                <span className="text-primary-600 font-bold shrink-0">1.</span>
                <div>
                  <strong>Request a formulary exception.</strong>{' '}
                  Your doctor submits a letter of medical necessity explaining why listed alternatives won&apos;t work for you.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-primary-600 font-bold shrink-0">2.</span>
                <div>
                  <strong>File an internal appeal.</strong>{' '}
                  The insurer must respond within <strong>72 hours</strong> for urgent requests or 30 days for standard requests.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-primary-600 font-bold shrink-0">3.</span>
                <div>
                  <strong>Request external review.</strong>{' '}
                  An independent reviewer makes a binding decision. You have this right under federal law.
                </div>
              </div>
              <p className="text-xs text-neutral-400 pt-2 border-t border-neutral-200">
                Source: 42 U.S.C. §300gg-19, 45 CFR §147.136. Contact your state insurance commissioner or a licensed agent for specific guidance.
              </p>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            RELATED MEDICATIONS — category-aware internal linking
            ════════════════════════════════════════════════════════════════ */}
        {relatedDrugs.length > 0 && (
          <section aria-labelledby="related-drugs-heading">
            <h2 id="related-drugs-heading" className="text-lg font-semibold text-navy-800 mb-1">
              Related medications
            </h2>
            {drugCategory && (
              <p className="text-sm text-neutral-500 mb-3">
                Other {drugCategory.label.toLowerCase()} covered by Marketplace plans
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {relatedDrugs.map((drug) => (
                <a
                  key={drug.slug}
                  href={drug.href}
                  className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <span className="text-primary-500 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <span className="text-sm font-medium text-primary-700">
                    {drug.name}
                  </span>
                </a>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-3">
              <a href={`/formulary/${issuer}/all`} className="underline hover:text-neutral-600">
                Browse all {isState ? stateName : issuerName} formulary drugs &rarr;
              </a>
            </p>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            COMPARISON LINKS — high SEO value "Drug A vs Drug B"
            ════════════════════════════════════════════════════════════════ */}
        {comparisonLinks.length > 0 && (
          <section aria-labelledby="compare-heading">
            <h2 id="compare-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Compare {titleCase(drugDisplay)}
            </h2>
            <div className="space-y-2">
              {comparisonLinks.map((comp) => (
                <a
                  key={comp.href}
                  href={comp.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                >
                  <span className="text-primary-400 group-hover:text-primary-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-primary-700 group-hover:text-primary-900">
                    {comp.label}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STATE + PLAN LINKS — contextual when state is selected
            ════════════════════════════════════════════════════════════════ */}
        {statePlanLinks.length > 0 && (
          <section aria-labelledby="state-links-heading">
            <h2 id="state-links-heading" className="text-lg font-semibold text-navy-800 mb-3">
              {stateName} Marketplace resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {statePlanLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block p-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm font-medium text-primary-700"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ═══ DETAILED DATA — Expandable table ═══ */}
        {results.length > 0 && (
          <section aria-labelledby="detail-table-heading">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div>
                  <h2 id="detail-table-heading" className="text-base font-semibold text-navy-800">
                    View detailed formulary entries
                  </h2>
                  <p className="text-sm text-neutral-500">
                    {groupByFormulation(results).length} formulation{groupByFormulation(results).length === 1 ? '' : 's'} across {results.length} plan{results.length === 1 ? '' : 's'}
                  </p>
                </div>
                <svg className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="mt-3">
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 text-left">
                        <th className="px-4 py-2.5 font-semibold text-navy-700">Formulation</th>
                        <th className="px-4 py-2.5 font-semibold text-navy-700">Tier</th>
                        <th className="px-4 py-2.5 font-semibold text-navy-700">Prior Authorization</th>
                        <th className="px-4 py-2.5 font-semibold text-navy-700">Step Therapy</th>
                        <th className="px-4 py-2.5 font-semibold text-navy-700">Quantity Limit</th>
                        <th className="px-4 py-2.5 font-semibold text-navy-700 text-right">Plans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupByFormulation(results).map((g, i) => {
                        const ht = humanizeTier(g.drug_tier)
                        return (
                          <tr
                            key={i}
                            className="border-t border-neutral-100 hover:bg-neutral-50"
                          >
                            <td className="px-4 py-2.5 font-medium">{g.drug_name}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ht.bg} ${ht.color}`}>
                                {ht.shortLabel}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <RestrictionBadge active={g.prior_authorization} />
                            </td>
                            <td className="px-4 py-2.5">
                              <RestrictionBadge active={g.step_therapy} />
                            </td>
                            <td className="px-4 py-2.5">
                              <RestrictionBadge active={g.quantity_limit} />
                            </td>
                            <td className="px-4 py-2.5 text-neutral-500 text-right whitespace-nowrap">
                              {g.planCount}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Source: CMS Machine-Readable PUF, {PLAN_YEAR} plan year
                </p>
              </div>
            </details>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            LEARN MORE — contextual educational links
            ════════════════════════════════════════════════════════════════ */}
        {educationalLinks.length > 0 && (
          <section aria-labelledby="learn-links-heading">
            <h2 id="learn-links-heading" className="text-lg font-semibold text-navy-800 mb-3">
              Learn more
            </h2>
            <div className="space-y-2">
              {educationalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                >
                  <span className="text-primary-400 group-hover:text-primary-600 mt-0.5 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </span>
                  <div>
                    <span className="text-sm font-medium text-primary-700 group-hover:text-primary-900 block">
                      {link.label}
                    </span>
                    <span className="text-xs text-neutral-500">{link.context}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Entity Links ── */}
        <EntityLinkCard links={entityLinks} title="Related Pages" variant="bottom" />

        {/* ════════════════════════════════════════════════════════════════
            SECTION 9: EDUCATIONAL EXPLAINERS (collapsed by default)
            Moved lower — supporting education, not the main answer
            ════════════════════════════════════════════════════════════════ */}
        {editorial && (
          <section aria-labelledby="learn-more-heading">
            <h2 id="learn-more-heading" className="text-sm font-semibold text-neutral-600 mb-3 uppercase tracking-wide">
              Understanding formulary coverage
            </h2>
            <div className="space-y-2">
              <ExpandableSection title="How formulary tiers work">
                <p className="mb-2">
                  Marketplace (Obamacare) plans organize covered medications into tiers, from lowest to highest cost-sharing:
                </p>
                <ol className="space-y-2 list-decimal list-inside text-sm text-neutral-700">
                  <li><strong>Tier 1 — Generic (low cost):</strong> Same active ingredients as brand-name drugs. Typically $5–$20 copay.</li>
                  <li><strong>Tier 2 — Preferred brand (moderate cost):</strong> Brand-name drugs with insurer-negotiated pricing. Typically $30–$60 copay.</li>
                  <li><strong>Tier 3 — Non-preferred brand (higher cost):</strong> Brand-name drugs not on the preferred list. Higher cost-sharing.</li>
                  <li><strong>Tier 4 — Specialty (highest cost):</strong> High-cost or complex medications, often coinsurance-based (25–33% of cost).</li>
                  <li><strong>Preventive:</strong> Covered at $0 cost-sharing under the Marketplace preventive services mandate.</li>
                </ol>
              </ExpandableSection>

              {hasPriorAuth && (
                <ExpandableSection title="What is prior authorization?">
                  <p className="mb-2">
                    Prior authorization means your insurer requires advance approval before covering a medication. Your prescribing doctor must submit clinical documentation showing medical necessity.
                  </p>
                  <p>
                    If denied, you can appeal. Marketplace plans are required to offer an internal appeals process and, if that fails, an independent external review. For urgent situations, expedited appeals must be decided within 72 hours.
                  </p>
                </ExpandableSection>
              )}

              {hasStepTherapy && (
                <ExpandableSection title="What is step therapy?">
                  <p>
                    Step therapy (also called &ldquo;fail first&rdquo;) requires you to try a lower-cost drug before the insurer will authorize the prescribed medication. If your doctor believes step therapy is medically inappropriate, they can file an exception request with clinical documentation.
                  </p>
                </ExpandableSection>
              )}

              {hasQuantityLimit && (
                <ExpandableSection title="What are quantity limits?">
                  <p>
                    Quantity limits restrict the amount of a drug dispensed per fill or per month. If your prescribed quantity exceeds the limit, your doctor can request a quantity limit exception with your insurer.
                  </p>
                </ExpandableSection>
              )}

              <ExpandableSection title="How to request a formulary exception">
                <p>
                  If your medication is not on your plan&apos;s formulary or is on a high-cost tier, your doctor can submit a written exception request with clinical documentation. The insurer must respond within 72 hours (24 hours for urgent). If denied, you can appeal through internal and external review. Federal law prohibits discriminatory tier placement for specific conditions.
                </p>
              </ExpandableSection>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION 10: FAQ
            ════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-lg font-semibold text-navy-800 mb-3">
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {formularyFaqs.map((faq, i) => (
              <details key={i} open={i === 0} className="group border border-neutral-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-neutral-50 transition-colors list-none">
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

        {/* ════════════════════════════════════════════════════════════════
            SECTION 11: DATA METHODOLOGY + SOURCES
            ════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="methodology-heading" className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <h2 id="methodology-heading" className="text-sm font-semibold text-neutral-700 mb-2">Data Methodology</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Formulary data is derived from CMS Machine-Readable Public Use Files
            for plan year {PLAN_YEAR}. Drug tier placement, prior authorization requirements,
            and quantity limits may change during the plan year. Cost ranges shown are general
            estimates based on typical Marketplace plan cost-sharing structures and do not reflect
            your specific plan. Always verify coverage with your insurer before enrollment.
            Data is updated when CMS publishes new PUF releases.
          </p>
        </section>

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
              <span className="text-neutral-500"> — Carrier formulary JSON files mandated by CMS for all Marketplace plans.</span>
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
              <span className="text-neutral-500"> — Official guidance on how formularies work in Marketplace plans.</span>
            </li>
          </ul>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            RELATED COVERAGE GUIDES — bottom-of-page topical authority
            ════════════════════════════════════════════════════════════════ */}
        {relatedGuides.length > 0 && (
          <section aria-labelledby="related-guides-heading" className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5">
            <h2 id="related-guides-heading" className="text-base font-semibold text-navy-800 mb-3">
              Related coverage guides
            </h2>
            <div className="space-y-3">
              {relatedGuides.map((guide) => (
                <a
                  key={guide.href}
                  href={guide.href}
                  className="flex items-start gap-3 group"
                >
                  <span className="text-primary-400 group-hover:text-primary-600 mt-0.5 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                  <div>
                    <span className="text-sm font-medium text-primary-700 group-hover:text-primary-900 group-hover:underline block">
                      {guide.label}
                    </span>
                    <span className="text-xs text-neutral-500">{guide.context}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ═══ BOTTOM CTA — final conversion prompt ═══ */}
        <DrugPageCta
          variant="bottom"
          drugName={titleCase(drugDisplay)}
          stateCode={stateCode}
          stateName={stateName}
        />

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
// SBM / Empty-State Explanation Page (extracted for clarity)
// ---------------------------------------------------------------------------

function SBMExplanationPage({
  issuer,
  drugSlug,
  drugDisplay,
  stateName,
  isSBMState,
  exchangeName,
  exchangeUrl,
  allResults,
}: {
  issuer: string
  drugSlug: string
  drugDisplay: string
  stateName: string
  isSBMState: boolean
  exchangeName: string
  exchangeUrl: string
  allResults: FormularyDrug[]
}) {
  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: 'Formulary', url: `${SITE_URL}/formulary` },
    { name: stateName, url: `${SITE_URL}/formulary/${issuer}/all` },
    { name: titleCase(drugDisplay), url: `${SITE_URL}/formulary/${issuer}/${drugSlug}` },
  ]
  const bSchema = buildBreadcrumbSchema(breadcrumbItems)

  return (
    <>
      <SchemaScript schema={bSchema} id="breadcrumb-schema" />
      <main className="max-w-3xl mx-auto px-4 py-10">

        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li><a href="/formulary" className="hover:underline text-primary-600">Formulary</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li><a href={`/formulary/${issuer}/all`} className="hover:underline text-primary-600">{stateName}</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">{titleCase(drugDisplay)}</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-4">
          {titleCase(drugDisplay)} Formulary Coverage in {stateName}
        </h1>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-amber-800 mb-1">
                {isSBMState
                  ? `${stateName} uses its own state exchange`
                  : `Formulary data not available for ${stateName}`
                }
              </p>
              <p className="text-amber-700 text-sm leading-relaxed">
                {isSBMState
                  ? `${stateName} marketplace plans enroll through ${exchangeName}, which maintains its own formulary database separate from the federal CMS dataset. To check if ${titleCase(drugDisplay)} is covered by a ${stateName} plan, use the ${exchangeName} plan finder directly.`
                  : `Formulary records for ${stateName} marketplace plans are not available in the current CMS dataset. This does not mean ${titleCase(drugDisplay)} is uncovered — check directly with your plan or the federal marketplace.`
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <a
            href={`/formulary/all/${drugSlug}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Search all states for {titleCase(drugDisplay)}
          </a>
          <a
            href={`/${stateCodeToSlug(issuer.toUpperCase())}/health-insurance-plans`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100 transition-colors"
          >
            View {stateName} health plans
          </a>
        </div>

        {allResults.length > 0 && (
          <div className="border border-slate-200 rounded-2xl p-5">
            <h2 className="font-semibold text-slate-800 mb-3">
              {titleCase(drugDisplay)} is covered nationally
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Across all states in our dataset, {titleCase(drugDisplay)} appears on{' '}
              {allResults.length} formulary {allResults.length === 1 ? 'record' : 'records'} from{' '}
              {new Set(allResults.map(r => (r.issuer_ids?.[0] ?? r.issuer_id))).size} insurers.
              {allResults[0]?.drug_tier && (
                <> It is typically listed as a {humanizeTier(allResults[0].drug_tier).shortLabel.toLowerCase()} drug.</>
              )}
            </p>
            <a href={`/formulary/all/${drugSlug}`} className="text-sm text-primary-600 font-semibold hover:text-primary-700">
              View national coverage details &rarr;
            </a>
          </div>
        )}

        <footer className="border-t border-neutral-200 mt-8 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Formulary data sourced from the CMS Machine-Readable PUF, plan year {PLAN_YEAR}.
            Always verify current coverage with your insurance carrier or at healthcare.gov.
          </p>
          <p>
            This page is for informational purposes only and does not constitute medical or
            insurance advice. <strong>Consult a licensed health insurance agent</strong> to
            confirm formulary coverage for your specific plan.
          </p>
        </footer>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RestrictionCard({
  active,
  title,
  activeText,
  inactiveText,
  detail,
}: {
  active: boolean
  title: string
  activeText: string
  inactiveText: string
  detail: string
}) {
  return (
    <div className={`rounded-xl p-4 ${active ? 'bg-amber-50 border border-amber-200' : 'bg-neutral-50 border border-neutral-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        {active ? (
          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span className="text-sm font-semibold text-navy-800">{title}</span>
      </div>
      <p className={`text-sm font-medium mb-1 ${active ? 'text-amber-700' : 'text-green-700'}`}>
        {active ? activeText : inactiveText}
      </p>
      <p className="text-xs text-neutral-500">{detail}</p>
    </div>
  )
}

function ExpandableSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border border-neutral-200 rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-neutral-50 transition-colors list-none">
        <span className="font-medium text-navy-800 text-sm pr-4">{title}</span>
        <svg className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </summary>
      <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
        {children}
      </div>
    </details>
  )
}

function RestrictionBadge({ active }: { active?: boolean }) {
  return active ? (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      Yes
    </span>
  ) : (
    <span className="text-neutral-400 text-xs">No</span>
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
