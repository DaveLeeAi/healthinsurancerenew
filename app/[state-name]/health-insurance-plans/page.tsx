import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getAllStateCountyCombos,
  loadSbmSbcData,
  getStateAggregateStats,
  getSbmStateAggregateStats,
  type SbmSbcRecord,
  type StateAggregateStats,
} from '@/lib/data-loader'
import { getCollectionList, type GuideFrontmatter } from '@/lib/markdown'
import SbmPlanTable from '@/components/SbmPlanTable'
import PlanComparisonTable from '@/components/PlanComparisonTable'
import {
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildStatePlansArticleSchema,
  buildDatasetSchema,
} from '@/lib/schema-markup'
import SchemaScript from '@/components/SchemaScript'
import StateFPLCalculator from '@/components/StateFPLCalculator'
import GenericByline from '@/components/GenericByline'
import allStatesData from '@/data/config/all-states.json'
import {
  stateSlugToCode,
  stateCodeToSlug,
  getCountySlug,
  getCountyName,
} from '@/lib/county-lookup'

const PLAN_YEAR = 2026
const SITE_URL = 'https://healthinsurancerenew.com'
const BUILD_DATE = new Date().toISOString().slice(0, 10)

interface StateEntry {
  name: string
  abbr: string
  slug: string
  exchange: string
  ownExchange: boolean
  exchangeUrl?: string
  medicaidExpanded?: boolean
}

interface Props {
  params: { 'state-name': string }
}

// Static generation — all state plan pages pre-built at deploy; revalidate daily
export const revalidate = 86400

export async function generateStaticParams() {
  const states = [
    ...new Set(
      getAllStateCountyCombos().map((c) =>
        stateCodeToSlug(c.state.toUpperCase())
      )
    ),
  ]
  // Add SBM states that don't appear in rate_volatility
  const sbmStates = (allStatesData.states as StateEntry[])
    .filter((s) => s.ownExchange)
    .map((s) => s.slug)
  for (const slug of sbmStates) {
    if (!states.includes(slug)) states.push(slug)
  }
  return states.map((s) => ({ 'state-name': s }))
}

function getStateEntry(abbr: string): StateEntry | undefined {
  return (allStatesData.states as StateEntry[]).find(
    (s) => s.abbr === abbr.toUpperCase()
  )
}

// ---------------------------------------------------------------------------
// State-specific metadata for prose "About" section + FAQs
// ---------------------------------------------------------------------------

interface StateProseData {
  medicaidName: string
  oepEnd: string
  enrolledEstimate: string
  subsidyPct: string
  aboutProse: string
  faqs: { q: string; a: string }[]
}

const STATE_PROSE: Partial<Record<string, StateProseData>> = {
  CA: {
    medicaidName: 'Medi-Cal',
    oepEnd: 'January 31',
    enrolledEstimate: '1.6 million',
    subsidyPct: '88%',
    aboutProse:
      'California operates Covered California, the largest state-based marketplace in the country. ' +
      'Unlike states on Healthcare.gov, Covered California negotiates standardized plan designs directly with carriers, ' +
      'sets its own enrollment timeline (Open Enrollment runs through January 31 — two weeks longer than the federal marketplace), ' +
      'and administers both federal and state-funded premium subsidies. California fully expanded Medicaid (called Medi-Cal), ' +
      'covering adults below 138% FPL regardless of immigration status. With 19 rating regions and carriers ranging from Kaiser Permanente ' +
      'to regional plans like L.A. Care and Chinese Community Health Plan, plan selection varies significantly by county. ' +
      'Approximately 88% of Covered California enrollees receive federal premium tax credits.',
    faqs: [
      {
        q: 'How many health insurance plans are available in California for 2026?',
        a: 'Covered California offers plans from 11 carriers across 19 rating regions. The exact number of available plans depends on your county — major metro areas like Los Angeles and the Bay Area have the most options. All plans cover ACA essential health benefits and are available in Bronze, Silver, Gold, and Platinum metal tiers.',
      },
      {
        q: 'What is the cheapest health insurance plan in California for 2026?',
        a: 'Before subsidies, the lowest-premium plans are typically Bronze or Catastrophic tier. After premium tax credits, many Californians at 150% FPL or below can find $0 or $1/month Bronze plans. Silver plans with Cost Sharing Reductions are often the best value for enrollees under 250% FPL. Use the subsidy estimator on this page to check your estimated costs.',
      },
      {
        q: 'Does Covered California have different enrollment dates than Healthcare.gov?',
        a: 'Yes. Covered California extends Open Enrollment through January 31 each year, while the federal marketplace closes January 15. This gives California residents an extra two weeks to enroll. Coverage starting January 1 still requires enrollment by December 15.',
      },
      {
        q: 'Can I get health insurance in California if I am undocumented?',
        a: 'California expanded Medi-Cal eligibility to all income-eligible adults regardless of immigration status. Undocumented adults aged 19–64 with qualifying income may enroll in Medi-Cal. Covered California marketplace plans require lawful presence, but Medi-Cal coverage is broader under California state law.',
      },
      {
        q: 'What is the average cost of health insurance in California?',
        a: 'The average benchmark Silver premium for a 40-year-old in California is approximately $512/month before subsidies. After premium tax credits, most enrollees pay significantly less. A single adult at 200% FPL (~$29,160) would owe about $103/month for a Silver plan after credits.',
      },
    ],
  },
  FL: {
    medicaidName: 'Medicaid',
    oepEnd: 'January 15',
    enrolledEstimate: '3.6 million',
    subsidyPct: '92%',
    aboutProse:
      'Florida has the largest ACA marketplace enrollment of any state, with approximately 3.6 million residents enrolled through Healthcare.gov. ' +
      'Despite not expanding Medicaid under the ACA, Florida\'s marketplace is highly competitive — most counties have multiple carriers, ' +
      'and the state consistently ranks first in total marketplace enrollment. The high enrollment is driven partly by Florida\'s large ' +
      'self-employed population, retirees under 65, and significant uninsured population prior to ACA expansion. ' +
      'Approximately 92% of Florida marketplace enrollees receive premium tax credits. ' +
      'Because Florida did not expand Medicaid, there is a coverage gap for adults earning below 100% FPL who do not qualify for either Medicaid or marketplace subsidies. ' +
      'Open Enrollment follows the federal timeline: November 1 through January 15.',
    faqs: [
      {
        q: 'How many health insurance plans are available in Florida for 2026?',
        a: 'Florida marketplace plan availability varies by county. Major metro areas like Miami-Dade, Broward, and Orange counties typically have the most options from carriers like Ambetter, Molina, Oscar, Florida Blue, and others. Rural counties may have fewer carrier choices. Plan counts range from a handful in smaller counties to dozens in major metros.',
      },
      {
        q: 'Why are health insurance premiums in Florida different by county?',
        a: 'ACA premiums are set by rating area, and Florida has multiple rating areas across its 67 counties. Factors include local healthcare costs, provider networks, hospital pricing, and insurer competition. South Florida tends to have higher premiums than the northern part of the state.',
      },
      {
        q: 'Does Florida have Medicaid expansion?',
        a: 'No. As of 2026, Florida has not expanded Medicaid under the ACA. This means adults without dependent children generally cannot qualify for Medicaid regardless of income. The marketplace with premium tax credits is the primary source of subsidized coverage for most low- and moderate-income Floridians.',
      },
      {
        q: 'What is the average cost of health insurance in Florida?',
        a: 'Florida premiums vary widely by county and rating area. Average Silver plan premiums for a 40-year-old typically range from $400–$700/month before subsidies, depending on location. After premium tax credits, most enrollees pay significantly less — 92% of Florida enrollees receive APTC.',
      },
      {
        q: 'When is Open Enrollment for Florida health insurance in 2026?',
        a: 'Florida uses the federal Healthcare.gov marketplace, with Open Enrollment running November 1 through January 15. To have coverage start January 1, you must enroll by December 15. Enrolling in January gives a February 1 effective date. Special Enrollment Periods are available year-round for qualifying life events.',
      },
    ],
  },
  TX: {
    medicaidName: 'Medicaid',
    oepEnd: 'January 15',
    enrolledEstimate: '2.4 million',
    subsidyPct: '90%',
    aboutProse:
      'Texas is the second-largest marketplace state by enrollment, with approximately 2.4 million residents on Healthcare.gov plans. ' +
      'The state has not expanded Medicaid, making the marketplace the primary source of subsidized individual coverage. ' +
      'Texas has strong insurer competition in major metro areas — Houston, Dallas-Fort Worth, San Antonio, and Austin typically offer plans from multiple carriers. ' +
      'Rural West Texas and the Rio Grande Valley may have fewer options. ' +
      'With 26 rating areas spanning 254 counties, premium variation across the state is significant. ' +
      'About 90% of Texas marketplace enrollees receive premium tax credits. ' +
      'Texas also has one of the highest uninsured rates in the country, partly due to the Medicaid coverage gap for adults below 100% FPL.',
    faqs: [
      {
        q: 'How many health insurance plans are available in Texas for 2026?',
        a: 'Texas plan availability varies widely by county across its 26 rating areas. Major metros like Harris County (Houston) and Dallas County offer dozens of plan options from carriers including Ambetter, Molina, Oscar, Blue Cross Blue Shield of Texas, and Community Health Choice. Some rural counties may have only 1–2 carriers.',
      },
      {
        q: 'Does Texas have Medicaid expansion?',
        a: 'No. Texas has not expanded Medicaid under the ACA as of 2026. Adults without dependent children generally do not qualify for Texas Medicaid regardless of income. The marketplace with premium tax credits is the main source of subsidized individual health coverage.',
      },
      {
        q: 'What is the average cost of health insurance in Texas?',
        a: 'Average Silver plan premiums for a 40-year-old in Texas vary by rating area, typically ranging from $400–$650/month before subsidies. After premium tax credits, approximately 90% of enrollees pay a reduced premium. Use the subsidy estimator on this page to calculate your expected costs.',
      },
      {
        q: 'Can I get health insurance in Texas outside of Open Enrollment?',
        a: 'Yes, if you experience a qualifying life event such as losing employer coverage, getting married, having a baby, or moving to Texas. You have 60 days from the qualifying event to enroll through a Special Enrollment Period (SEP) on Healthcare.gov.',
      },
      {
        q: 'Which carriers offer marketplace plans in Texas?',
        a: 'Texas has broad insurer participation including Ambetter (Superior HealthPlan), Molina Healthcare, Oscar Health, Blue Cross Blue Shield of Texas, Community Health Choice, Sendero Health Plans, and others. Carrier availability varies by county and rating area.',
      },
    ],
  },
  NY: {
    medicaidName: 'Medicaid',
    oepEnd: 'January 31',
    enrolledEstimate: '350,000',
    subsidyPct: '75%',
    aboutProse:
      'New York operates NY State of Health, its own state-based marketplace. New York is one of the most regulated individual insurance markets in the country — ' +
      'it has required community rating (no tobacco surcharge) and guaranteed issue since before the ACA. ' +
      'The state fully expanded Medicaid and offers the Essential Plan, a low-cost coverage option for residents earning 138%–200% FPL. ' +
      'NY State of Health enrollment runs through January 31, longer than the federal marketplace. ' +
      'New York\'s marketplace covers all 62 counties, with strong carrier participation in the New York City metro area and more limited options in upstate rural counties. ' +
      'The state\'s community rating rules mean all enrollees of the same age pay the same premium regardless of health status or tobacco use.',
    faqs: [
      {
        q: 'How many health insurance plans are available in New York for 2026?',
        a: 'NY State of Health offers plans from carriers including Fidelis Care, Healthfirst, EmblemHealth, Oscar, MVP Health Care, and others. Plan availability varies by county — New York City and surrounding counties have the most options, while some upstate counties may have fewer carriers.',
      },
      {
        q: 'What is the Essential Plan in New York?',
        a: 'The Essential Plan is a New York-specific low-cost health coverage option for residents earning between 138%–200% of the Federal Poverty Level. It is not available in other states. Monthly premiums are $0–$15/month with no deductible and low copays. It covers the same essential health benefits as standard marketplace plans.',
      },
      {
        q: 'Does New York charge a tobacco surcharge on health insurance?',
        a: 'No. New York has community rating laws that prohibit insurers from charging different premiums based on tobacco use. This is stricter than the federal ACA rules, which allow up to a 1.5:1 tobacco surcharge. New York residents pay the same premium regardless of smoking status.',
      },
      {
        q: 'When is Open Enrollment for New York health insurance?',
        a: 'NY State of Health runs Open Enrollment from November 1 through January 31 each year — two weeks longer than the federal marketplace. Essential Plan enrollment is available year-round. Special Enrollment Periods are available for qualifying life events.',
      },
      {
        q: 'What is the average cost of health insurance in New York?',
        a: 'New York premiums vary by region and age. Community rating rules mean no tobacco surcharges. Average Silver plan premiums for a 40-year-old typically range from $500–$800/month before subsidies. The Essential Plan offers coverage as low as $0/month for qualifying residents.',
      },
    ],
  },
}

/**
 * Generate default prose + FAQ content for states without hand-written copy.
 * Dynamically builds 300+ word About section and data-rich FAQ answers using
 * all available state data: stateEntry, stats, carrierList, exchangeType,
 * medicaidExpanded, premiumRanges.
 */
function getStateProseData(
  stateCode: string,
  stateName: string,
  stateEntry: StateEntry,
  stats: StateAggregateStats | null
): StateProseData {
  const specific = STATE_PROSE[stateCode]
  if (specific) return specific

  const isSbm = stateEntry.ownExchange
  const exchange = stateEntry.exchange
  const expanded = stateEntry.medicaidExpanded
  const carrierList = stats?.carriers?.slice(0, 5).join(', ') || 'multiple carriers'
  const allCarriers = stats?.carriers?.join(', ') || 'multiple carriers'
  const planCount = stats?.planCount ?? 0
  const carrierCount = stats?.carrierCount ?? 0
  const countyCount = stats?.countyCount ?? 0
  const avgPrem40 = stats?.avgPremiumAge40
  const lowPrem40 = stats?.lowestPremiumAge40
  const highPrem40 = stats?.highestPremiumAge40
  const avgPrem21 = stats?.avgPremiumAge21
  const avgPrem64 = stats?.avgPremiumAge64
  const avgDeductible = stats?.avgDeductible
  const metalTiers = stats?.premiumByMetal ? Object.keys(stats.premiumByMetal) : []

  // OEP end date — SBM states may have extended deadlines
  const oepEnd = isSbm ? 'January 31' : 'January 15'

  // --- Build 300+ word About prose dynamically ---
  const paragraphs: string[] = []

  // P1: Exchange type explanation (what FFM vs SBM means)
  if (isSbm) {
    paragraphs.push(
      `${stateName} operates ${exchange}, a state-based health insurance marketplace (SBM). ` +
      `Unlike the 33 states that use the federal Healthcare.gov platform, ${exchange} independently manages plan certification, ` +
      `carrier contracting, enrollment processing, and consumer assistance. This means ${stateName} sets its own enrollment deadlines, ` +
      `negotiates directly with insurance carriers, and may offer state-specific programs or subsidies not available in federal marketplace states. ` +
      `Residents of ${stateName} enroll through ${exchange} rather than Healthcare.gov.`
    )
  } else {
    paragraphs.push(
      `${stateName} uses Healthcare.gov, the federally facilitated marketplace (FFM), for ACA health insurance enrollment. ` +
      `Healthcare.gov serves as the central enrollment platform where ${stateName} residents can compare plans, check subsidy eligibility, ` +
      `and enroll in coverage. The federal marketplace standardizes the enrollment experience across participating states, ` +
      `with plan certification and rate review handled jointly by CMS and the ${stateName} Department of Insurance.`
    )
  }

  // P2: Medicaid expansion status + impact
  if (expanded) {
    paragraphs.push(
      `${stateName} has expanded Medicaid under the Affordable Care Act, extending coverage to adults with household incomes ` +
      `below 138% of the Federal Poverty Level (approximately $20,783 per year for a single adult in ${PLAN_YEAR}). ` +
      `Medicaid expansion significantly reduced the uninsured rate in ${stateName} by closing the coverage gap between traditional ` +
      `Medicaid eligibility and marketplace subsidy eligibility. Residents who qualify for Medicaid are enrolled in that program ` +
      `rather than marketplace plans, and Medicaid has no monthly premium in most cases.`
    )
  } else {
    paragraphs.push(
      `${stateName} has not expanded Medicaid under the Affordable Care Act as of ${PLAN_YEAR}. ` +
      `This creates a coverage gap for some low-income adults who earn too much for traditional Medicaid but too little to qualify ` +
      `for marketplace premium tax credits (which begin at 100% FPL). Adults without dependent children in ${stateName} may find ` +
      `it particularly difficult to qualify for Medicaid. The ACA marketplace with premium tax credits remains the primary ` +
      `source of subsidized individual health coverage for most ${stateName} residents.`
    )
  }

  // P3: Plan/carrier count context + premium ranges
  if (planCount > 0 && carrierCount > 0) {
    const premRange = lowPrem40 && highPrem40
      ? ` Monthly premiums for a 40-year-old range from $${lowPrem40} to $${highPrem40} before subsidies, ` +
        `with a statewide average of $${avgPrem40}/month.`
      : avgPrem40
        ? ` The statewide average monthly premium for a 40-year-old is approximately $${avgPrem40} before subsidies.`
        : ''
    paragraphs.push(
      `For ${PLAN_YEAR}, ${stateName} has ${planCount} marketplace health insurance plans available from ${carrierCount} carriers, ` +
      `including ${carrierList}.${premRange}` +
      `${countyCount > 0 ? ` The state's ${countyCount} counties span multiple rating areas, so plan availability and premiums ` +
        `vary by location — urban counties typically offer more carrier choices than rural areas.` : ''}` +
      `${metalTiers.length > 0 ? ` Plans are available across ${metalTiers.length} metal tiers, from low-premium Catastrophic and Bronze ` +
        `options to comprehensive Gold and Platinum coverage.` : ''}`
    )
  } else {
    paragraphs.push(
      `${stateName} offers marketplace health insurance plans from multiple carriers through ${exchange}. ` +
      `Plan availability and premiums vary by county and rating area. Urban areas generally have more plan options ` +
      `than rural counties. Plans are available in Bronze, Silver, Gold, and Platinum metal tiers, each with different ` +
      `cost-sharing structures. All plans cover the ACA's ten essential health benefits regardless of metal level.`
    )
  }

  // P4: OEP dates + SEP rules summary
  paragraphs.push(
    `Open Enrollment for ${PLAN_YEAR} coverage ${isSbm ? `on ${exchange}` : 'on Healthcare.gov'} runs from November 1 through ${oepEnd}. ` +
    `To have coverage effective January 1, residents must enroll by December 15. ${isSbm ? `${exchange} may extend its enrollment deadline ` +
      `beyond the federal marketplace's January 15 cutoff, giving ${stateName} residents additional time to select a plan. ` : ''}` +
    `Outside of Open Enrollment, ${stateName} residents can enroll through a Special Enrollment Period (SEP) if they experience ` +
    `a qualifying life event. Common qualifying events include losing employer-sponsored coverage, getting married or divorced, ` +
    `having a baby or adopting a child, moving to a new state or county, or losing Medicaid eligibility. ` +
    `SEPs typically provide a 60-day enrollment window from the date of the qualifying event.`
  )

  // P5: Subsidy context + at least 2 state-specific differentiating facts
  const deductibleNote = avgDeductible ? ` The average individual deductible across all ${stateName} marketplace plans is $${avgDeductible}.` : ''
  const age21Note = avgPrem21 ? ` Young adults at age 21 pay an average of $${avgPrem21}/month` : ''
  const age64Note = avgPrem64 ? `${avgPrem21 ? ', while' : ' Adults at age'} 64 pay approximately $${avgPrem64}/month` : ''
  const ageSpread = (avgPrem21 || avgPrem64) ? `${age21Note}${age64Note} before subsidies, reflecting the ACA's 3:1 age rating band.` : ''

  paragraphs.push(
    `The majority of ${stateName} marketplace enrollees receive federal premium tax credits (APTC) that significantly reduce ` +
    `monthly premiums. Under the current IRA-enhanced subsidy structure, households earning up to and above 400% of the Federal ` +
    `Poverty Level may qualify for assistance.${deductibleNote}${ageSpread ? ' ' + ageSpread : ''} ` +
    `Silver-tier plans are often the best value for subsidy-eligible enrollees because they unlock Cost Sharing Reductions (CSR) ` +
    `for households below 250% FPL, reducing deductibles and copays in addition to the premium subsidy.`
  )

  const aboutProse = paragraphs.join('\n\n')

  return {
    medicaidName: stateCode === 'CA' ? 'Medi-Cal' : 'Medicaid',
    oepEnd,
    enrolledEstimate: 'hundreds of thousands',
    subsidyPct: '~80%',
    aboutProse,
    faqs: [
      {
        q: `How many health insurance plans are available in ${stateName} for ${PLAN_YEAR}?`,
        a: planCount > 0
          ? `${planCount} marketplace plans from ${carrierCount} carriers are available in ${stateName} for ${PLAN_YEAR}. ` +
            `${lowPrem40 && highPrem40 ? `Plans range from $${lowPrem40} to $${highPrem40}/mo for a 40-year-old before subsidies. ` : ''}` +
            `${stateName} uses ${exchange}. Carriers include ${carrierList}. ` +
            `All plans cover the ACA's ten essential health benefits across Bronze, Silver, Gold, and Platinum tiers.`
          : `${stateName} offers marketplace plans through ${exchange} from multiple carriers. Plan availability varies by county ` +
            `and rating area. All plans cover ACA essential health benefits in Bronze, Silver, Gold, and Platinum tiers.`,
      },
      {
        q: `What is the average cost of health insurance in ${stateName}?`,
        a: avgPrem40
          ? `The average monthly premium for a 40-year-old in ${stateName} is $${avgPrem40} before subsidies. ` +
            `${lowPrem40 && highPrem40 ? `Premiums range from $${lowPrem40} to $${highPrem40}/mo depending on plan and county. ` : ''}` +
            `${avgDeductible ? `The average individual deductible is $${avgDeductible}. ` : ''}` +
            `Most enrollees pay significantly less after premium tax credits. Use the subsidy estimator on this page to calculate your cost.`
          : `Health insurance premiums in ${stateName} vary by county, age, tobacco use, and metal tier. After premium tax credits, ` +
            `most marketplace enrollees pay a reduced premium. Use the subsidy estimator on this page to check your estimated costs.`,
      },
      {
        q: `Does ${stateName} have Medicaid expansion?`,
        a: expanded
          ? `Yes. ${stateName} expanded Medicaid under the ACA, covering adults with incomes below 138% FPL (~$20,783/year for a ` +
            `single adult in ${PLAN_YEAR}). ${stateName} has ${carrierCount > 0 ? `${carrierCount} marketplace carriers for those above the Medicaid threshold` : 'marketplace plans for those above the threshold'}. ` +
            `Medicaid enrollees pay no monthly premium. Those just above 138% FPL often qualify for Silver plans with Cost Sharing Reductions.`
          : `No. ${stateName} has not expanded Medicaid as of ${PLAN_YEAR}. This creates a coverage gap where adults below 100% FPL ` +
            `may not qualify for either Medicaid or marketplace subsidies. ${carrierCount > 0 ? `The marketplace offers ${planCount} plans from ${carrierCount} carriers ` : 'The marketplace offers plans '}` +
            `for those who do qualify for premium tax credits (100%–400%+ FPL under enhanced credits).`,
      },
      {
        q: `When is Open Enrollment for ${stateName} health insurance?`,
        a: `${isSbm
            ? `${exchange} runs Open Enrollment from November 1 through ${oepEnd} — state-based marketplaces may extend beyond the federal January 15 deadline.`
            : `${stateName} uses Healthcare.gov, with Open Enrollment from November 1 through January 15.`} ` +
           `Enroll by December 15 for January 1 coverage. Outside Open Enrollment, you can enroll through a Special Enrollment Period ` +
           `if you experience a qualifying life event such as losing job-based coverage, getting married, having a baby, or moving to a new county.`,
      },
      {
        q: `How do I apply for health insurance subsidies in ${stateName}?`,
        a: `Apply through ${exchange} and enter your household size and estimated annual income. Premium tax credits are calculated ` +
           `automatically based on your income relative to the Federal Poverty Level. Under current enhanced credits, households ` +
           `above 400% FPL may also qualify. ${avgPrem40 ? `In ${stateName}, the average unsubsidized premium is $${avgPrem40}/mo (age 40) — ` +
           `subsidies can reduce this to under $100/mo for many enrollees. ` : ''}` +
           `Silver plans unlock additional Cost Sharing Reductions for households below 250% FPL.`,
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) return { title: 'Not Found' }

  const stateEntry = getStateEntry(stateCode)
  if (!stateEntry) return { title: 'Not Found' }

  const stateName = stateEntry.name
  const canonical = `${SITE_URL}/${params['state-name']}/health-insurance-plans`

  // Get stats for description
  const isSbm = stateEntry.ownExchange
  const stats = isSbm
    ? getSbmStateAggregateStats(stateCode)
    : getStateAggregateStats(stateCode)

  const planCountStr = stats ? `${stats.planCount} plans from ${stats.carrierCount} carriers` : 'marketplace plans'
  const premiumStr = stats?.lowestPremiumAge40
    ? ` Premiums from $${stats.lowestPremiumAge40}/mo (age 40, before subsidy).`
    : ''

  const title = `${PLAN_YEAR} Health Insurance Plans in ${stateName} | Compare ${stats?.carrierCount ?? ''} Carriers`.replace('| Compare  Carriers', '| Plans & Premiums')
  const description =
    `Compare ${PLAN_YEAR} ACA health insurance plans in ${stateName}. ${planCountStr} on ${stateEntry.exchange}.${premiumStr} ` +
    `Estimate your subsidy, compare metal tiers, and find coverage. Reviewed by a licensed agent.`

  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description: description.slice(0, 160),
      url: canonical,
      siteName: 'HealthInsuranceRenew',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.slice(0, 160),
    },
  }
}

// Standard CSR variant codes — only these are shown in the plan table
const STANDARD_CSR = new Set(['01', 'Standard'])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '—'
  return `$${val.toLocaleString()}`
}

function getRelatedGuides(): { slug: string; title: string }[] {
  const guides = getCollectionList<GuideFrontmatter>('guides')
  // Pick the most universally relevant guides
  const prioritySlugs = [
    'how-aca-subsidies-work-2026',
    'how-to-choose-health-plan',
    'open-enrollment-2026',
    'special-enrollment-period',
    'what-affects-health-insurance-costs',
  ]
  const result: { slug: string; title: string }[] = []
  for (const slug of prioritySlugs) {
    const entry = guides.find((g) => g.slug === slug)
    if (entry) result.push({ slug, title: entry.frontmatter.title })
    if (result.length >= 4) break
  }
  return result
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StatePlansPage({ params }: Props) {
  const stateCode = stateSlugToCode(params['state-name'])
  if (!stateCode) notFound()

  const stateEntry = getStateEntry(stateCode)
  if (!stateEntry) notFound()

  const stateName = stateEntry.name
  const stateSlug = stateCodeToSlug(stateCode)
  const counties = getAllStateCountyCombos().filter(
    (c) => c.state === stateCode.toLowerCase()
  )
  const isSbm = stateEntry.ownExchange && counties.length === 0
  const canonical = `${SITE_URL}/${stateSlug}/health-insurance-plans`

  // Load plan data
  const sbmPlans: SbmSbcRecord[] = isSbm ? loadSbmSbcData(stateCode) : []
  const sbmStandardPlans = sbmPlans.filter((p) => STANDARD_CSR.has(p.csr_variation))
  const sbmIssuers = [...new Set(sbmPlans.map((p) => p.issuer_name))].sort()

  // If no county data AND not an SBM state, 404
  if (counties.length === 0 && !stateEntry.ownExchange) notFound()

  // Aggregate stats
  const stats: StateAggregateStats | null = isSbm
    ? getSbmStateAggregateStats(stateCode)
    : getStateAggregateStats(stateCode)

  // State prose + FAQs
  const proseData = getStateProseData(stateCode, stateName, stateEntry, stats)

  // Top counties (for Related Counties section) — FFM states only
  const topCounties: { fips: string; name: string; slug: string }[] = []
  if (!isSbm && stats?.topCountyFips) {
    for (const fips of stats.topCountyFips.slice(0, 5)) {
      const name = getCountyName(fips)
      if (name) {
        topCounties.push({ fips, name, slug: getCountySlug(fips) })
      }
    }
  }

  // Related guides
  const relatedGuides = getRelatedGuides()

  // Carrier names for display
  const carrierNames = isSbm ? sbmIssuers : (stats?.carriers ?? [])

  // Zero-click opening paragraph
  const exchangeLabel = isSbm ? stateEntry.exchange : 'Healthcare.gov (the federal marketplace)'
  const planCountLabel = stats
    ? `${stats.planCount} marketplace plan${stats.planCount !== 1 ? 's' : ''} from ${stats.carrierCount} carrier${stats.carrierCount !== 1 ? 's' : ''}`
    : 'marketplace plans from multiple carriers'
  const premiumLabel = stats?.avgPremiumAge40
    ? `Monthly premiums average $${stats.avgPremiumAge40} for a 40-year-old before subsidies.`
    : 'Monthly premiums vary by age, county, and plan selection.'
  const openingParagraph = `${planCountLabel} are available in ${stateName} for ${PLAN_YEAR}. ${premiumLabel} ${stateName} uses ${exchangeLabel}.`

  // --- Schema ---
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: `${stateName}`, url: `${SITE_URL}/states/${stateCode.toLowerCase()}` },
    { name: `Health Insurance Plans`, url: canonical },
  ])

  const faqSchema = buildFAQSchema(
    proseData.faqs.map((f) => ({ question: f.q, answer: f.a }))
  )

  const articleSchema = buildStatePlansArticleSchema({
    headline: `${PLAN_YEAR} Health Insurance Plans in ${stateName}`,
    description: openingParagraph,
    url: canonical,
    dateModified: BUILD_DATE,
    stateName,
  })

  const datasetSchema = buildDatasetSchema({
    name: `${PLAN_YEAR} ACA Health Insurance Plans — ${stateName}`,
    description: `Marketplace health insurance plan data for ${stateName}, plan year ${PLAN_YEAR}. Includes premiums, deductibles, carrier information, and metal tier details. Source: CMS QHP Landscape PUF.`,
    url: canonical,
    year: String(PLAN_YEAR),
  })

  return (
    <>
      <SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
      <SchemaScript schema={faqSchema} id="faq-schema" />
      <SchemaScript schema={articleSchema} id="article-schema" />
      <SchemaScript schema={datasetSchema} id="dataset-schema" />

      {/* LLM-friendly structured comment */}
      <div
        dangerouslySetInnerHTML={{
          __html: `<!-- STATE: ${stateName} | STATE_CODE: ${stateCode} | PLANS: ${stats?.planCount ?? 'N/A'} | CARRIERS: ${stats?.carrierCount ?? 'N/A'} | EXCHANGE: ${isSbm ? 'SBM' : 'FFM'} | YEAR: ${PLAN_YEAR} | DATA: CMS QHP PUF | MEDICAID_EXPANDED: ${stateEntry.medicaidExpanded ? 'Yes' : 'No'} -->`,
        }}
      />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* ── Breadcrumbs ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><a href="/" className="hover:underline text-primary-600">Home</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li><a href={`/states/${stateCode.toLowerCase()}`} className="hover:underline text-primary-600">{stateName}</a></li>
            <li aria-hidden="true" className="text-neutral-300">&rsaquo;</li>
            <li aria-current="page" className="text-neutral-700 font-medium">
              Health Insurance Plans
            </li>
          </ol>
        </nav>

        {/* ── Section 1: H1 + Zero-Click Opening ── */}
        <section>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
            {PLAN_YEAR} Health Insurance Plans in {stateName}
          </h1>
          <p id="state-bluf" className="text-neutral-600 text-lg leading-relaxed max-w-3xl">
            {openingParagraph}
          </p>
        </section>

        {/* ── Section 2: Key Stats Bar ── */}
        <section aria-labelledby="key-stats-heading">
          <h2 id="key-stats-heading" className="sr-only">Key Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
              <div className="text-2xl font-bold text-navy-900">{stats?.planCount ?? '—'}</div>
              <div className="text-xs text-neutral-500 mt-1">Plans Available</div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
              <div className="text-2xl font-bold text-navy-900">{stats?.carrierCount ?? '—'}</div>
              <div className="text-xs text-neutral-500 mt-1">Insurance Carriers</div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
              <div className="text-2xl font-bold text-navy-900">
                {stats?.lowestPremiumAge40 != null ? formatCurrency(stats.lowestPremiumAge40) : (stats?.lowestDeductible != null ? formatCurrency(stats.lowestDeductible) : '—')}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {stats?.lowestPremiumAge40 != null ? 'Lowest Avg Premium (40)' : 'Lowest Deductible'}
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
              <div className="text-2xl font-bold text-navy-900">
                {stats?.avgDeductible != null ? formatCurrency(stats.avgDeductible) : '—'}
              </div>
              <div className="text-xs text-neutral-500 mt-1">Avg Deductible</div>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Data: CMS QHP Landscape PUF &middot; Plan Year {PLAN_YEAR} &middot; Premiums before tax credits
          </p>
        </section>

        {/* ── Section 3: Carrier Filter + Plan Table ── */}
        {isSbm && sbmPlans.length > 0 ? (
          <section aria-labelledby="plans-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="plans-heading" className="text-xl font-semibold text-navy-800">
                {PLAN_YEAR} Plans Available in {stateName}
              </h2>
              <span className="text-sm text-neutral-500">
                {sbmStandardPlans.length} plans &middot; {sbmIssuers.length}{' '}
                {sbmIssuers.length === 1 ? 'carrier' : 'carriers'}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mb-5">
              Standard plan variants (base rates, no CSR). Deductibles and out-of-pocket maxima sourced from
              carrier Summary of Benefits and Coverage (SBC) documents.
              Plans are available through <strong>{stateEntry.exchange}</strong>.{' '}
              <a href="/contact" className="text-primary-600 underline hover:text-primary-700">
                Contact a licensed agent to enroll &rarr;
              </a>
            </p>
            <SbmPlanTable
              plans={sbmStandardPlans}
              stateSlug={stateSlug}
              exchangeName={stateEntry.exchange}
              planYear={PLAN_YEAR}
            />
          </section>
        ) : !isSbm && counties.length > 0 ? (
          <section aria-labelledby="plans-heading">
            <h2 id="plans-heading" className="text-xl font-semibold text-navy-800 mb-2">
              Browse Plans by County
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              {stateName} has <strong>{counties.length} counties</strong> with marketplace plans.
              Select a county to compare premiums, deductibles, and carriers for plan year {PLAN_YEAR}.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {counties.map(({ county }) => {
                const countySlug = getCountySlug(county)
                const countyName = getCountyName(county)
                const countyDisplay = countyName || countySlug
                  .split('-')
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')
                return (
                  <a
                    key={county}
                    href={`/${stateSlug}/${countySlug}`}
                    className="block p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-primary-700">{countyDisplay}</span>
                  </a>
                )
              })}
            </div>
          </section>
        ) : null}

        {/* ── Section 4: Average Cost by Age + Metal Tier ── */}
        {stats && (stats.avgPremiumAge21 || stats.avgPremiumAge40 || stats.avgPremiumAge64 || Object.keys(stats.premiumByMetal).length > 0) && (
          <section aria-labelledby="avg-cost-heading">
            <h2 id="avg-cost-heading" className="text-xl font-semibold text-navy-800 mb-4">
              Average Cost of Health Insurance in {stateName} ({PLAN_YEAR})
            </h2>

            {/* Age-based premium table */}
            {(stats.avgPremiumAge21 || stats.avgPremiumAge40 || stats.avgPremiumAge64) && (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-xs text-neutral-500 uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium">Age</th>
                      <th className="text-right px-4 py-2.5 font-medium">Avg Monthly Premium</th>
                      <th className="text-right px-4 py-2.5 font-medium">Low</th>
                      <th className="text-right px-4 py-2.5 font-medium">High</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {stats.avgPremiumAge21 && (
                      <tr>
                        <td className="px-4 py-3 font-medium text-navy-800">Age 21</td>
                        <td className="px-4 py-3 text-right text-neutral-700">{formatCurrency(stats.avgPremiumAge21)}</td>
                        <td className="px-4 py-3 text-right text-neutral-500">—</td>
                        <td className="px-4 py-3 text-right text-neutral-500">—</td>
                      </tr>
                    )}
                    {stats.avgPremiumAge40 && (
                      <tr>
                        <td className="px-4 py-3 font-medium text-navy-800">Age 40</td>
                        <td className="px-4 py-3 text-right text-neutral-700">{formatCurrency(stats.avgPremiumAge40)}</td>
                        <td className="px-4 py-3 text-right text-neutral-500">{formatCurrency(stats.lowestPremiumAge40)}</td>
                        <td className="px-4 py-3 text-right text-neutral-500">{formatCurrency(stats.highestPremiumAge40)}</td>
                      </tr>
                    )}
                    {stats.avgPremiumAge64 && (
                      <tr>
                        <td className="px-4 py-3 font-medium text-navy-800">Age 64</td>
                        <td className="px-4 py-3 text-right text-neutral-700">{formatCurrency(stats.avgPremiumAge64)}</td>
                        <td className="px-4 py-3 text-right text-neutral-500">—</td>
                        <td className="px-4 py-3 text-right text-neutral-500">—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Premium by metal tier */}
            {Object.keys(stats.premiumByMetal).length > 0 && (
              <>
                <h3 className="text-base font-semibold text-navy-800 mb-3">
                  Average Premium by Metal Tier (Age 40)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-xs text-neutral-500 uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium">Metal Tier</th>
                        <th className="text-right px-4 py-2.5 font-medium">Avg Premium</th>
                        <th className="text-right px-4 py-2.5 font-medium">Lowest</th>
                        <th className="text-right px-4 py-2.5 font-medium">Highest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {['catastrophic', 'bronze', 'expanded_bronze', 'silver', 'gold', 'platinum']
                        .filter((m) => stats.premiumByMetal[m])
                        .map((m) => {
                          const d = stats.premiumByMetal[m]
                          const label = m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                          return (
                            <tr key={m}>
                              <td className="px-4 py-3 font-medium text-navy-800">{label}</td>
                              <td className="px-4 py-3 text-right text-neutral-700">{formatCurrency(d.avg40)}</td>
                              <td className="px-4 py-3 text-right text-neutral-500">{formatCurrency(d.min40)}</td>
                              <td className="px-4 py-3 text-right text-neutral-500">{formatCurrency(d.max40)}</td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <p className="text-xs text-neutral-400 mt-3">
              Premiums shown before premium tax credits. Actual cost depends on income, household size, and plan selection.
              Source: CMS QHP Landscape PUF, plan year {PLAN_YEAR}.
            </p>
          </section>
        )}

        {/* ── Section 5: Subsidy Estimator ── */}
        <section aria-labelledby="subsidy-calc-heading">
          <h2 id="subsidy-calc-heading" className="text-xl font-semibold text-navy-800 mb-2">
            Estimate Your {PLAN_YEAR} Subsidy in {stateName}
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Enter your household size and annual income to see if you qualify for premium tax credits that reduce your monthly cost.
          </p>
          <StateFPLCalculator
            stateName={stateName}
            stateAbbr={stateCode}
            exchangeName={stateEntry.exchange}
            exchangeUrl="/contact"
          />
        </section>

        {/* ── Section 6: About [State] Health Insurance (prose — 300+ words, GEO/AEO/LLMO optimized) ── */}
        <section aria-labelledby="about-heading">
          <h2 id="about-heading" className="text-xl font-semibold text-navy-800 mb-4">
            About Health Insurance in {stateName}
          </h2>

          {/* GEO: AI-citable "At a Glance" stat block — structured for SGE/Perplexity/ChatGPT extraction */}
          <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-5 mb-6 not-prose" id="state-at-a-glance">
            <h3 className="text-sm font-bold text-navy-800 uppercase tracking-wide mb-3">
              Health Insurance in {stateName}: At a Glance ({PLAN_YEAR})
            </h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-neutral-500 text-xs">Marketplace Plans</dt>
                <dd className="font-semibold text-navy-800">{stats?.planCount ?? 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 text-xs">Insurance Carriers</dt>
                <dd className="font-semibold text-navy-800">{stats?.carrierCount ?? 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 text-xs">Exchange</dt>
                <dd className="font-semibold text-navy-800">{isSbm ? `${stateEntry.exchange} (SBM)` : 'Healthcare.gov (FFM)'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 text-xs">Avg Premium (Age 40)</dt>
                <dd className="font-semibold text-navy-800">{stats?.avgPremiumAge40 ? `$${stats.avgPremiumAge40}/mo` : 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 text-xs">Premium Range (Age 40)</dt>
                <dd className="font-semibold text-navy-800">
                  {stats?.lowestPremiumAge40 && stats?.highestPremiumAge40
                    ? `$${stats.lowestPremiumAge40}–$${stats.highestPremiumAge40}/mo`
                    : 'Varies by county'}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500 text-xs">Avg Deductible</dt>
                <dd className="font-semibold text-navy-800">{stats?.avgDeductible ? `$${stats.avgDeductible}` : 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 text-xs">Medicaid Expanded</dt>
                <dd className="font-semibold text-navy-800">{stateEntry.medicaidExpanded ? `Yes (${proseData.medicaidName})` : 'No'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 text-xs">Open Enrollment Ends</dt>
                <dd className="font-semibold text-navy-800">{proseData.oepEnd}, {PLAN_YEAR}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 text-xs">Counties</dt>
                <dd className="font-semibold text-navy-800">{stats?.countyCount ?? (counties.length || 'N/A')}</dd>
              </div>
            </dl>
            <p className="text-[10px] text-neutral-400 mt-2">
              Source: CMS QHP Landscape PUF, plan year {PLAN_YEAR}. Premiums before premium tax credits.
            </p>
          </div>

          {/* About prose — renders each paragraph separately for 300+ word target */}
          <div className="prose prose-neutral max-w-none text-sm leading-relaxed space-y-4">
            {proseData.aboutProse.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}

            {/* Carrier list — Topical Authority / Entity signals */}
            {carrierNames.length > 0 && (
              <div className="not-prose">
                <h3 className="text-base font-semibold text-navy-800 mb-2">
                  Carriers on {stateEntry.exchange} ({PLAN_YEAR})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {carrierNames.map((name) => (
                    <span key={name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-xs font-medium text-primary-700 border border-primary-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 7: FAQ Section ── */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold text-navy-800 mb-4">
            Frequently Asked Questions — Health Insurance in {stateName}
          </h2>
          <div className="space-y-3">
            {proseData.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-neutral-200 bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-navy-800 list-none">
                  <span>{faq.q}</span>
                  <svg
                    className="w-4 h-4 text-neutral-400 shrink-0 ml-3 transition-transform group-open:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Section 8: Related Counties (FFM states) ── */}
        {topCounties.length > 0 && (
          <section aria-labelledby="counties-heading">
            <h2 id="counties-heading" className="text-xl font-semibold text-navy-800 mb-4">
              Most Popular Counties in {stateName}
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Select a county to see plan-level details including premiums, deductibles, and carrier options.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topCounties.map(({ fips, name, slug }) => (
                <a
                  key={fips}
                  href={`/${stateSlug}/${slug}`}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-primary-700">{name}</span>
                  <svg className="w-4 h-4 text-neutral-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Section 9: Related Guides ── */}
        {relatedGuides.length > 0 && (
          <section aria-labelledby="guides-heading">
            <h2 id="guides-heading" className="text-xl font-semibold text-navy-800 mb-4">
              Health Insurance Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="block rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <span className="text-sm font-medium text-primary-700">{guide.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Section 10: Topical Authority Interlinks ── */}
        <section className="border-t border-neutral-200 pt-6">
          <h2 className="text-lg font-semibold text-navy-800 mb-3">
            More About Health Insurance in {stateName}
          </h2>
          <div className="flex flex-wrap gap-3">
            <a href={`/states/${stateCode.toLowerCase()}`}
              className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
              {stateName} Overview
            </a>
            <a href={`/subsidies/${stateCode.toLowerCase()}`}
              className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
              Subsidies in {stateName}
            </a>
            <a href={`/enhanced-credits/${stateCode.toLowerCase()}`}
              className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
              Enhanced Credits in {stateName}
            </a>
            <a href={`/dental/${stateCode.toLowerCase()}`}
              className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
              Dental Plans in {stateName}
            </a>
            <a href={`/rates/${stateCode.toLowerCase()}`}
              className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
              Rate Trends in {stateName}
            </a>
            <a href={`/formulary/${stateCode.toLowerCase()}/metformin`}
              className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-primary-700 hover:bg-primary-50 transition-colors">
              Drug Coverage Lookup
            </a>
          </div>
        </section>

        {/* ── E-E-A-T: Author Byline + Data Attribution ── */}
        {/* DO NOT add Dave Lee name or NPN here — name/NPN only on homepage + /circle-of-champions */}
        <GenericByline
          dataSource={isSbm
            ? `${stateEntry.exchange} carrier Summary of Benefits and Coverage documents`
            : 'CMS QHP Landscape Public Use File'}
          planYear={PLAN_YEAR}
          lastReviewed={new Date(BUILD_DATE).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        />

        {/* ── Editorial Disclaimer ── */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
          <p>
            Plan data sourced from{' '}
            {isSbm
              ? `${stateEntry.exchange} carrier Summary of Benefits and Coverage documents`
              : 'CMS QHP Landscape Public Use File'}
            , plan year {PLAN_YEAR}. Premiums shown are before premium tax credits and vary by age,
            household size, tobacco use (where applicable), and county of residence.
          </p>
          <p>
            This page provides educational information about health insurance marketplace options in {stateName}.
            It does not constitute medical or legal advice. Subsidy estimates are approximations based on
            federal poverty level guidelines and ACA affordability formulas. Consult a licensed health
            insurance agent for personalized enrollment assistance.
          </p>
        </footer>

      </main>
    </>
  )
}
