/**
 * lib/iowa-mvp/scoring.ts — Deterministic plan-fit scoring engine for Iowa MVP.
 *
 * Architecture: structured data determines facts → scoring engine ranks →
 * explanation layer only describes grounded results.
 *
 * The LLM never invents coverage facts, cost-sharing details, or carrier claims.
 */

import type {
  UserProfile,
  IowaPlan,
  IowaSubsidy,
  FormularyDrugEntry,
  DrugMatch,
  ScoreDimension,
  RiskFlag,
  VerificationItem,
  PlanResult,
  ScoringResult,
  IowaMvpDataset,
} from './types'
import { sanitizeExplanations, getRequiredDisclaimers } from './guardrails'
import { generateWhyItMayFit, generateTradeoffs } from './explain'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** ACA age rating curve — maps reference ages to rating factors (age 40 = 1.0) */
const AGE_FACTORS: Record<number, number> = {
  21: 0.6350, 22: 0.6350, 23: 0.6350, 24: 0.6350,
  25: 0.6604, 26: 0.6604, 27: 0.7929,
  28: 0.7929, 29: 0.7929, 30: 0.8575,
  31: 0.8778, 32: 0.8981, 33: 0.9183,
  34: 0.9386, 35: 0.9588, 36: 0.9791,
  37: 0.9993, 38: 1.0000, 39: 1.0000,
  40: 1.0000, 41: 1.0508, 42: 1.0508,
  43: 1.1016, 44: 1.1016, 45: 1.1524,
  46: 1.2032, 47: 1.2540, 48: 1.3199,
  49: 1.3199, 50: 1.3199, 51: 1.3858,
  52: 1.4516, 53: 1.5175, 54: 1.5882,
  55: 1.6590, 56: 1.7298, 57: 1.8006,
  58: 1.8714, 59: 1.9422, 60: 1.7452,
  61: 1.7452, 62: 1.7452, 63: 1.7452,
  64: 2.0160,
}

/** 2026 Federal Poverty Level base (single person) */
const FPL_BASE_2026 = 15650

// ---------------------------------------------------------------------------
// Premium interpolation
// ---------------------------------------------------------------------------

/**
 * Estimate monthly premium for a specific age using the plan's age-bracket premiums.
 * Uses ACA age rating factors to interpolate from the nearest available bracket.
 */
function estimatePremiumForAge(plan: IowaPlan, age: number): number | null {
  const p = plan.premiums
  if (!p || Object.keys(p).length === 0) return null

  // Direct match from available brackets
  const bracketKey = `age_${age}`
  if (p[bracketKey] != null) return p[bracketKey]

  // Interpolate: find the nearest bracket and scale by age factor ratio
  const brackets = [
    { age: 21, key: 'age_21' },
    { age: 27, key: 'age_27' },
    { age: 30, key: 'age_30' },
    { age: 40, key: 'age_40' },
    { age: 50, key: 'age_50' },
    { age: 60, key: 'age_60' },
    { age: 64, key: 'age_64' },
  ]

  // Find nearest bracket with data
  let nearest: { age: number; premium: number } | null = null
  let minDist = Infinity
  for (const b of brackets) {
    if (p[b.key] != null) {
      const dist = Math.abs(age - b.age)
      if (dist < minDist) {
        minDist = dist
        nearest = { age: b.age, premium: p[b.key] }
      }
    }
  }

  if (!nearest) return null

  const clampedAge = Math.max(21, Math.min(64, age))
  const nearestFactor = AGE_FACTORS[nearest.age] ?? 1.0
  const targetFactor = AGE_FACTORS[clampedAge] ?? 1.0

  if (nearestFactor === 0) return null
  return Math.round(nearest.premium * (targetFactor / nearestFactor))
}

// ---------------------------------------------------------------------------
// Subsidy estimation
// ---------------------------------------------------------------------------

interface SubsidyEstimate {
  monthly_aptc: number
  net_monthly_premium: number
  fpl_percent: number
  applicable_percentage: number
  subsidy_eligible: boolean
  cliff_warning: boolean
}

function estimateSubsidy(
  premium: number,
  income: number,
  householdSize: number,
  subsidy: IowaSubsidy | undefined,
): SubsidyEstimate {
  const fplThreshold = FPL_BASE_2026 * householdSize
  const fplPercent = Math.round((income / fplThreshold) * 100)

  // 2026 rules: subsidy cliff at 400% FPL
  if (fplPercent > 400 || !subsidy) {
    return {
      monthly_aptc: 0,
      net_monthly_premium: premium,
      fpl_percent: fplPercent,
      applicable_percentage: 0,
      subsidy_eligible: false,
      cliff_warning: fplPercent > 380 && fplPercent <= 420,
    }
  }

  // Find the nearest FPL tier in subsidy data
  const tiers = [150, 200, 250, 300, 400]
  let closestTier = 150
  let closestDist = Infinity
  for (const t of tiers) {
    const dist = Math.abs(fplPercent - t)
    if (dist < closestDist) {
      closestDist = dist
      closestTier = t
    }
  }

  const tierKey = `fpl_${closestTier}`
  const tierData = subsidy.subsidy_estimates[tierKey]
  if (!tierData) {
    return {
      monthly_aptc: 0,
      net_monthly_premium: premium,
      fpl_percent: fplPercent,
      applicable_percentage: 0,
      subsidy_eligible: false,
      cliff_warning: false,
    }
  }

  // Apply the applicable percentage to the user's actual income
  const monthlyContribution = (income * tierData.applicable_percentage) / 12
  const benchmarkPremium = subsidy.benchmark_silver_premium

  // APTC = benchmark silver premium - contribution (can't be negative)
  // Scale benchmark to user's age vs reference age 40
  const aptc = Math.max(0, benchmarkPremium - monthlyContribution)
  const netPremium = Math.max(0, premium - aptc)

  return {
    monthly_aptc: Math.round(aptc),
    net_monthly_premium: Math.round(netPremium),
    fpl_percent: fplPercent,
    applicable_percentage: tierData.applicable_percentage,
    subsidy_eligible: aptc > 0,
    cliff_warning: fplPercent > 380 && fplPercent <= 420,
  }
}

// ---------------------------------------------------------------------------
// Drug matching
// ---------------------------------------------------------------------------

function matchDrugs(
  userMeds: string[],
  formularyDrugs: FormularyDrugEntry[],
  carrierName: string,
): DrugMatch[] {
  if (userMeds.length === 0) return []

  const isOscar = carrierName === 'Oscar Insurance Company'

  return userMeds.map((medName) => {
    const normalizedName = medName.toLowerCase().trim()

    if (!isOscar) {
      // Non-Oscar carriers: no formulary data available
      return {
        drug_name: medName,
        found: false,
        tier: null,
        prior_authorization: false,
        quantity_limit: false,
        step_therapy: false,
        carrier_verified: false,
        notes: `Drug coverage data not available for ${carrierName}. Verify directly with the carrier.`,
      }
    }

    // Search Oscar formulary
    const match = formularyDrugs.find(
      (d) => d.drug_name?.toLowerCase().trim() === normalizedName
    )

    // Also try partial match (drug name contains the search term)
    const partialMatch = !match
      ? formularyDrugs.find(
          (d) => d.drug_name?.toLowerCase().includes(normalizedName) ||
                 normalizedName.includes(d.drug_name?.toLowerCase() ?? '')
        )
      : null

    const found = match || partialMatch

    if (!found) {
      return {
        drug_name: medName,
        found: false,
        tier: null,
        prior_authorization: false,
        quantity_limit: false,
        step_therapy: false,
        carrier_verified: true,
        notes: 'Not found in Oscar Iowa formulary. May be covered under a different name or require an exception.',
      }
    }

    const tierStr = found.tier != null ? String(found.tier) : null
    const pa = found.pa === true || found.pa === 'Y' || found.pa === 'Yes'
    const ql = found.ql === true || found.ql === 'Y' || found.ql === 'Yes'
    const st = found.st === true || found.st === 'Y' || found.st === 'Yes'

    const notes: string[] = []
    if (pa) notes.push('Prior authorization required')
    if (ql) notes.push('Quantity limits apply')
    if (st) notes.push('Step therapy required')
    if (!match && partialMatch) notes.push('Partial name match — verify exact drug name')

    return {
      drug_name: medName,
      found: true,
      tier: tierStr,
      prior_authorization: pa,
      quantity_limit: ql,
      step_therapy: st,
      carrier_verified: true,
      notes: notes.length > 0 ? notes.join('. ') + '.' : 'Found in Oscar Iowa formulary.',
    }
  })
}

// ---------------------------------------------------------------------------
// Scoring dimensions
// ---------------------------------------------------------------------------

function scoreAffordability(
  netPremium: number | null,
  income: number,
  preference: UserProfile['budget_preference'],
): ScoreDimension {
  if (netPremium == null) {
    return { name: 'Affordability', score: 50, weight: 0.25, reason: 'Premium data not available for this age bracket.' }
  }

  const annualPremium = netPremium * 12
  const premiumShare = annualPremium / income

  let score: number
  if (premiumShare <= 0.02) score = 100
  else if (premiumShare <= 0.04) score = 90
  else if (premiumShare <= 0.06) score = 80
  else if (premiumShare <= 0.085) score = 70
  else if (premiumShare <= 0.10) score = 55
  else if (premiumShare <= 0.15) score = 40
  else score = 20

  // Adjust by preference
  if (preference === 'lowest_premium') score = Math.min(100, score + 10)
  if (preference === 'lowest_risk') score = Math.max(0, score - 5)

  return {
    name: 'Affordability',
    score: Math.round(score),
    weight: preference === 'lowest_premium' ? 0.35 : 0.25,
    reason: `Estimated net monthly premium: $${netPremium}. Annual premium is ${(premiumShare * 100).toFixed(1)}% of income.`,
  }
}

function scoreDeductibleFit(
  plan: IowaPlan,
  usage: UserProfile['expected_usage'],
  preference: UserProfile['budget_preference'],
): ScoreDimension {
  const ded = plan.deductible_individual
  if (ded == null) {
    return { name: 'Deductible Fit', score: 50, weight: 0.20, reason: 'Deductible data not available.' }
  }

  let score: number
  if (usage === 'high') {
    // High usage: lower deductible is much better
    if (ded <= 1000) score = 95
    else if (ded <= 2500) score = 80
    else if (ded <= 5000) score = 55
    else if (ded <= 7000) score = 35
    else score = 15
  } else if (usage === 'moderate') {
    if (ded <= 2000) score = 90
    else if (ded <= 4000) score = 75
    else if (ded <= 6000) score = 55
    else score = 35
  } else {
    // Low usage: deductible matters less
    if (ded <= 3000) score = 85
    else if (ded <= 6000) score = 70
    else if (ded <= 8000) score = 60
    else score = 50
  }

  if (preference === 'lowest_risk') score = Math.min(100, score + 5)

  return {
    name: 'Deductible Fit',
    score: Math.round(score),
    weight: usage === 'high' ? 0.25 : 0.20,
    reason: `Individual deductible: $${ded.toLocaleString()}. ${usage === 'high' ? 'Higher usage makes a lower deductible more valuable.' : ''}`.trim(),
  }
}

function scoreMoopProtection(
  plan: IowaPlan,
  usage: UserProfile['expected_usage'],
  preference: UserProfile['budget_preference'],
): ScoreDimension {
  const moop = plan.oop_max_individual
  if (moop == null) {
    return { name: 'Out-of-Pocket Protection', score: 50, weight: 0.15, reason: 'Maximum out-of-pocket data not available.' }
  }

  let score: number
  if (moop <= 3000) score = 95
  else if (moop <= 5000) score = 85
  else if (moop <= 7000) score = 70
  else if (moop <= 8500) score = 55
  else score = 40

  if (preference === 'lowest_risk') score = Math.min(100, score + 10)

  return {
    name: 'Out-of-Pocket Protection',
    score: Math.round(score),
    weight: preference === 'lowest_risk' ? 0.25 : 0.15,
    reason: `Maximum out-of-pocket: $${moop.toLocaleString()}. This is the most you would pay in a plan year for covered services.`,
  }
}

function scoreDrugFit(drugMatches: DrugMatch[]): ScoreDimension {
  if (drugMatches.length === 0) {
    return { name: 'Drug Coverage Fit', score: 70, weight: 0.10, reason: 'No medications specified. Drug coverage not evaluated.' }
  }

  const found = drugMatches.filter((d) => d.found).length
  const verified = drugMatches.filter((d) => d.carrier_verified).length
  const withRestrictions = drugMatches.filter(
    (d) => d.found && (d.prior_authorization || d.quantity_limit || d.step_therapy)
  ).length

  let score: number
  if (verified === 0) {
    // No formulary data for this carrier
    score = 40
  } else {
    const coverageRate = found / drugMatches.length
    score = Math.round(coverageRate * 90)
    // Penalty for restrictions
    if (withRestrictions > 0) {
      score = Math.max(10, score - withRestrictions * 8)
    }
  }

  const unverifiedCount = drugMatches.length - verified
  let reason = `${found} of ${drugMatches.length} medications found in formulary.`
  if (unverifiedCount > 0) {
    reason += ` ${unverifiedCount} could not be verified — formulary data not available for this carrier.`
  }
  if (withRestrictions > 0) {
    reason += ` ${withRestrictions} have restrictions (prior authorization, quantity limits, or step therapy).`
  }

  return {
    name: 'Drug Coverage Fit',
    score: Math.round(score),
    weight: drugMatches.length > 0 ? 0.20 : 0.10,
    reason,
  }
}

function scorePlanTypeFit(
  plan: IowaPlan,
  preference: UserProfile['plan_type_preference'],
): ScoreDimension {
  if (preference === 'no_preference') {
    return { name: 'Plan Type Fit', score: 70, weight: 0.05, reason: 'No plan type preference specified.' }
  }

  const match = plan.plan_type === preference
  return {
    name: 'Plan Type Fit',
    score: match ? 95 : 45,
    weight: 0.10,
    reason: match
      ? `This is a ${plan.plan_type} plan, matching your preference.`
      : `This is a ${plan.plan_type} plan, but you preferred ${preference}.`,
  }
}

function computeUncertaintyPenalty(plan: IowaPlan, drugMatches: DrugMatch[]): ScoreDimension {
  let penalty = 0
  const reasons: string[] = []

  // Penalty for missing cost-sharing data
  if (plan.deductible_individual == null) {
    penalty += 10
    reasons.push('deductible data missing')
  }
  if (plan.oop_max_individual == null) {
    penalty += 10
    reasons.push('out-of-pocket max data missing')
  }

  // Penalty for unverified drug coverage
  const unverified = drugMatches.filter((d) => !d.carrier_verified)
  if (unverified.length > 0) {
    penalty += Math.min(15, unverified.length * 5)
    reasons.push(`${unverified.length} drug(s) not verifiable`)
  }

  return {
    name: 'Data Confidence',
    score: Math.max(0, 100 - penalty),
    weight: 0.05,
    reason: reasons.length > 0
      ? `Score reduced due to: ${reasons.join(', ')}.`
      : 'All key data fields available.',
  }
}

// ---------------------------------------------------------------------------
// Risk flags
// ---------------------------------------------------------------------------

function generateRiskFlags(
  plan: IowaPlan,
  subsidyEst: SubsidyEstimate,
  drugMatches: DrugMatch[],
  usage: UserProfile['expected_usage'],
): RiskFlag[] {
  const flags: RiskFlag[] = []

  if (subsidyEst.cliff_warning) {
    flags.push({
      severity: 'warning',
      message: 'Your estimated income is near the 400% FPL subsidy cliff. A small income change could significantly affect your premium tax credit.',
    })
  }

  if (!subsidyEst.subsidy_eligible && subsidyEst.fpl_percent <= 400) {
    flags.push({
      severity: 'info',
      message: 'Based on this income estimate, you may not qualify for premium tax credits. Verify with HealthCare.gov.',
    })
  }

  const ded = plan.deductible_individual
  if (ded != null && ded >= 7000 && usage === 'high') {
    flags.push({
      severity: 'warning',
      message: `This plan has a $${ded.toLocaleString()} deductible. With high expected usage, you may pay significantly before coverage kicks in.`,
    })
  }

  const unfoundDrugs = drugMatches.filter((d) => d.carrier_verified && !d.found)
  if (unfoundDrugs.length > 0) {
    flags.push({
      severity: 'warning',
      message: `${unfoundDrugs.length} of your medications were not found in this plan's formulary: ${unfoundDrugs.map((d) => d.drug_name).join(', ')}.`,
    })
  }

  const unverifiedDrugs = drugMatches.filter((d) => !d.carrier_verified)
  if (unverifiedDrugs.length > 0) {
    flags.push({
      severity: 'info',
      message: `Drug coverage for ${plan.issuer_name} could not be verified in this system. Confirm coverage directly with the carrier.`,
    })
  }

  const restrictedDrugs = drugMatches.filter(
    (d) => d.found && (d.prior_authorization || d.step_therapy)
  )
  if (restrictedDrugs.length > 0) {
    flags.push({
      severity: 'info',
      message: `${restrictedDrugs.length} medication(s) require prior authorization or step therapy: ${restrictedDrugs.map((d) => d.drug_name).join(', ')}.`,
    })
  }

  return flags
}

// ---------------------------------------------------------------------------
// Verification checklist
// ---------------------------------------------------------------------------

function generateVerificationChecklist(
  plan: IowaPlan,
  drugMatches: DrugMatch[],
): VerificationItem[] {
  const items: VerificationItem[] = [
    {
      category: 'Provider Network',
      action: `Confirm your doctors and hospitals participate in ${plan.issuer_name}'s ${plan.plan_type} network for this plan.`,
    },
    {
      category: 'Pharmacy',
      action: `Verify your preferred pharmacy is in ${plan.issuer_name}'s pharmacy network.`,
    },
    {
      category: 'Premium',
      action: 'Confirm your exact premium and tax credit on HealthCare.gov using your actual household and income details.',
    },
    {
      category: 'Plan Availability',
      action: 'Confirm this plan is still available in your county during open enrollment.',
    },
  ]

  if (drugMatches.some((d) => !d.carrier_verified)) {
    items.push({
      category: 'Drug Coverage',
      action: `Contact ${plan.issuer_name} to verify formulary coverage for your medications.`,
    })
  }

  if (drugMatches.some((d) => d.prior_authorization)) {
    items.push({
      category: 'Prior Authorization',
      action: 'Ask your doctor if they can obtain prior authorization before you enroll, or confirm the process with the carrier.',
    })
  }

  items.push({
    category: 'Licensed Agent',
    action: 'Consider speaking with a licensed health insurance agent for personalized guidance before making a final decision.',
  })

  return items
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

export function scorePlans(
  profile: UserProfile,
  dataset: IowaMvpDataset,
): ScoringResult {
  const countyName = dataset.county_names[profile.county_fips] ?? profile.county_fips

  // Filter plans available in this county
  const availablePlans = dataset.plans.filter((p) =>
    p.counties_served.includes(profile.county_fips)
  )

  if (availablePlans.length === 0) {
    return {
      status: 'no_plans',
      county_name: countyName,
      plan_year: dataset.metadata.plan_year,
      snapshot_note: dataset.metadata.snapshot_note,
      data_limitations: Object.values(dataset.metadata.data_limitations),
      top_plans: [],
      input_summary: {
        county: countyName,
        age: profile.age,
        income: profile.annual_income,
        household_size: profile.household_size,
        medications_checked: profile.medications.length,
        expected_usage: profile.expected_usage,
        budget_preference: profile.budget_preference,
      },
      disclaimers: getRequiredDisclaimers(),
    }
  }

  // Find subsidy data for this county
  const subsidy = dataset.subsidies.find(
    (s) => s.county_fips === profile.county_fips
  )

  // Score each plan
  const scoredPlans: PlanResult[] = availablePlans
    .filter((plan) => {
      // Exclude catastrophic plans for age 30+
      if (plan.metal_level === 'Catastrophic' && profile.age >= 30) return false
      return true
    })
    .map((plan) => {
      const premium = estimatePremiumForAge(plan, profile.age)
      const subsidyEst = premium != null
        ? estimateSubsidy(premium, profile.annual_income, profile.household_size, subsidy)
        : { monthly_aptc: 0, net_monthly_premium: 0, fpl_percent: 0, applicable_percentage: 0, subsidy_eligible: false, cliff_warning: false }

      const drugMatches = matchDrugs(
        profile.medications,
        dataset.formulary.drugs,
        plan.issuer_name,
      )

      // Compute all scoring dimensions
      const dimensions: ScoreDimension[] = [
        scoreAffordability(subsidyEst.net_monthly_premium, profile.annual_income, profile.budget_preference),
        scoreDeductibleFit(plan, profile.expected_usage, profile.budget_preference),
        scoreMoopProtection(plan, profile.expected_usage, profile.budget_preference),
        scoreDrugFit(drugMatches),
        scorePlanTypeFit(plan, profile.plan_type_preference),
        computeUncertaintyPenalty(plan, drugMatches),
      ]

      // Weighted overall score
      const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0)
      const overallScore = totalWeight > 0
        ? Math.round(dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight)
        : 50

      const riskFlags = generateRiskFlags(plan, subsidyEst, drugMatches, profile.expected_usage)
      const verification = generateVerificationChecklist(plan, drugMatches)

      // Generate grounded explanations
      const whyItMayFit = sanitizeExplanations(
        generateWhyItMayFit(plan, dimensions, subsidyEst, drugMatches)
      )
      const tradeoffs = sanitizeExplanations(
        generateTradeoffs(plan, dimensions, subsidyEst, profile)
      )

      return {
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        issuer_name: plan.issuer_name,
        metal_level: plan.metal_level,
        plan_type: plan.plan_type,
        monthly_premium_before_subsidy: premium,
        estimated_monthly_aptc: subsidyEst.monthly_aptc,
        estimated_net_monthly_premium: subsidyEst.net_monthly_premium,
        deductible_individual: plan.deductible_individual,
        oop_max_individual: plan.oop_max_individual,
        overall_score: overallScore,
        dimensions,
        drug_matches: drugMatches,
        risk_flags: riskFlags,
        why_it_may_fit: whyItMayFit,
        main_tradeoffs: tradeoffs,
        verification_checklist: verification,
      }
    })
    // Sort by overall score descending, then by net premium ascending
    .sort((a, b) => {
      if (b.overall_score !== a.overall_score) return b.overall_score - a.overall_score
      return (a.estimated_net_monthly_premium ?? Infinity) - (b.estimated_net_monthly_premium ?? Infinity)
    })

  // Return top 5 plans
  const topPlans = scoredPlans.slice(0, 5)

  return {
    status: 'success',
    county_name: countyName,
    plan_year: dataset.metadata.plan_year,
    snapshot_note: dataset.metadata.snapshot_note,
    data_limitations: Object.values(dataset.metadata.data_limitations),
    top_plans: topPlans,
    input_summary: {
      county: countyName,
      age: profile.age,
      income: profile.annual_income,
      household_size: profile.household_size,
      medications_checked: profile.medications.length,
      expected_usage: profile.expected_usage,
      budget_preference: profile.budget_preference,
    },
    disclaimers: getRequiredDisclaimers(),
  }
}
