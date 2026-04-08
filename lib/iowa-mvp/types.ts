/**
 * lib/iowa-mvp/types.ts — Type definitions for the Iowa MVP scoring engine.
 *
 * All types are specific to the Iowa plan-fit comparison tool.
 * These do NOT replace or conflict with the main lib/types.ts definitions.
 */

// ---------------------------------------------------------------------------
// User input
// ---------------------------------------------------------------------------

export interface UserProfile {
  county_fips: string
  age: number
  household_size: number
  annual_income: number
  is_smoker: boolean
  medications: string[]               // drug names to match against formulary
  expected_usage: 'low' | 'moderate' | 'high'
  budget_preference: 'lowest_premium' | 'balanced' | 'lowest_risk'
  plan_type_preference: 'no_preference' | 'HMO' | 'PPO' | 'EPO'
  risk_tolerance: 'low' | 'moderate' | 'high'
  notes: string                       // free-text provider/constraint notes
}

// ---------------------------------------------------------------------------
// Normalized plan data (loaded from iowa_mvp_plans.json)
// ---------------------------------------------------------------------------

export interface IowaPlan {
  plan_id: string
  issuer_id: string
  issuer_name: string
  plan_name: string
  state_code: string
  metal_level: string
  plan_type: string
  premiums: Record<string, number>     // age_21, age_27, age_30, age_40, age_50, age_60, age_64
  deductible_individual: number | null
  deductible_family: number | null
  oop_max_individual: number | null
  oop_max_family: number | null
  counties_served: string[]
}

export interface IowaCarrier {
  issuer_id: string
  issuer_name: string
  plan_count: number
  metal_levels: string[]
  plan_types: string[]
  has_formulary_data: boolean
}

export interface IowaSubsidy {
  state_code: string
  county_fips: string
  benchmark_silver_premium: number
  fpl_base: number
  household_size: number
  reference_age: number
  subsidy_estimates: Record<string, {
    fpl_percent: number
    annual_income: number
    applicable_percentage: number
    monthly_contribution: number
    monthly_aptc: number
    net_monthly_premium: number
  }>
}

export interface FormularyDrugEntry {
  drug_name: string
  tier?: string | number
  category?: string
  subcategory?: string
  pa?: boolean | string
  ql?: boolean | string
  st?: boolean | string
  sp?: boolean | string
  otc?: boolean | string
  insulin_cap?: boolean | string
  restrictions_raw?: string
}

export interface IowaFormulary {
  source: string
  issuer_id: string
  drug_count: number
  drugs: FormularyDrugEntry[]
}

export interface IowaMvpDataset {
  metadata: {
    generated_at: string
    state: string
    state_code: string
    plan_year: number
    source_files: string[]
    plan_count: number
    county_count: number
    carrier_count: number
    formulary_drug_count: number
    data_limitations: Record<string, string>
    snapshot_note: string
  }
  carriers: IowaCarrier[]
  plans: IowaPlan[]
  subsidies: IowaSubsidy[]
  rates: unknown[]
  formulary: IowaFormulary
  county_names: Record<string, string>
}

// ---------------------------------------------------------------------------
// Scoring output
// ---------------------------------------------------------------------------

export interface DrugMatch {
  drug_name: string
  found: boolean
  tier: string | null
  prior_authorization: boolean
  quantity_limit: boolean
  step_therapy: boolean
  carrier_verified: boolean           // true only for Oscar
  notes: string
}

export interface ScoreDimension {
  name: string
  score: number                       // 0–100
  weight: number                      // 0–1
  reason: string
}

export interface RiskFlag {
  severity: 'info' | 'warning' | 'critical'
  message: string
}

export interface VerificationItem {
  category: string
  action: string
}

export interface PlanResult {
  plan_id: string
  plan_name: string
  issuer_name: string
  metal_level: string
  plan_type: string
  monthly_premium_before_subsidy: number | null
  estimated_monthly_aptc: number | null
  estimated_net_monthly_premium: number | null
  deductible_individual: number | null
  oop_max_individual: number | null
  overall_score: number               // 0–100
  dimensions: ScoreDimension[]
  drug_matches: DrugMatch[]
  risk_flags: RiskFlag[]
  why_it_may_fit: string[]
  main_tradeoffs: string[]
  verification_checklist: VerificationItem[]
}

export interface ScoringResult {
  status: 'success' | 'no_plans' | 'error'
  county_name: string
  plan_year: number
  snapshot_note: string
  data_limitations: string[]
  top_plans: PlanResult[]
  input_summary: {
    county: string
    age: number
    income: number
    household_size: number
    medications_checked: number
    expected_usage: string
    budget_preference: string
  }
  disclaimers: string[]
}
