// ============================================================
// lib/types.ts — ACA Dataset Authority — TypeScript interfaces
// ============================================================

// --- Shared ---
export interface DatasetMetadata {
  generated_at: string
  source: string
  record_count: number
  plan_year?: number
  version?: string
}

// --- Pillar 1: Plan Intelligence ---
export interface PlanRecord {
  plan_id: string
  plan_variant_id?: string
  state_code: string
  county_fips: string
  plan_name: string
  issuer_id: string
  issuer_name: string
  metal_level: 'catastrophic' | 'bronze' | 'expanded_bronze' | 'silver' | 'gold' | 'platinum' | string
  plan_type: 'HMO' | 'PPO' | 'EPO' | 'POS' | 'Indemnity' | string
  rating_area?: string
  premiums?: {
    age_21?: number
    age_27?: number
    age_30?: number
    age_40?: number
    age_50?: number
    age_60?: number
    age_64?: number
  }
  deductible_individual?: number
  deductible_family?: number
  moop_individual?: number
  moop_family?: number
  network_url?: string
  formulary_url?: string
}

export interface PlanIntelligenceDataset {
  metadata: DatasetMetadata
  data: PlanRecord[]
}

// --- Pillar 2: Subsidy Engine ---
export interface FplTierEstimate {
  fpl_percent: number
  annual_income: number
  applicable_percentage: number
  monthly_contribution: number
  monthly_aptc: number
  net_monthly_premium: number
}

export interface SubsidyRecord {
  state_code: string
  county_fips: string
  benchmark_silver_premium: number
  fpl_base: number
  household_size: number
  reference_age: number
  subsidy_estimates: {
    fpl_150?: FplTierEstimate
    fpl_200?: FplTierEstimate
    fpl_250?: FplTierEstimate
    fpl_300?: FplTierEstimate
    fpl_350?: FplTierEstimate
    fpl_400?: FplTierEstimate
    [key: string]: FplTierEstimate | undefined
  }
}

export interface SubsidyDataset {
  metadata: DatasetMetadata
  data: SubsidyRecord[]
}

// --- Pillar 3: SBC Decoded ---
export type CostSharingCategory =
  | 'primary_care' | 'specialist' | 'emergency_room' | 'inpatient_hospital'
  | 'outpatient_facility' | 'generic_drug' | 'preferred_brand_drug'
  | 'non_preferred_brand_drug' | 'specialty_drug' | 'mental_health'
  | 'prenatal_care' | 'lab_x_ray'

export interface CostSharingEntry {
  copay_in_network?: number | null
  coinsurance_in_network?: number | null
  copay_out_network?: number | null
  coinsurance_out_network?: number | null
  notes?: string
}

export interface SbcRecord {
  plan_variant_id: string
  plan_id?: string
  state_code?: string
  issuer_name?: string
  metal_level?: string
  cost_sharing_grid: Partial<Record<CostSharingCategory, CostSharingEntry>>
  exclusions: ExclusionRecord[]
}

export interface ExclusionRecord {
  category: string
  description: string
  source: 'puf' | 'pdf' | 'inferred'
  needs_pdf_parsing?: boolean
}

export interface SbcDataset {
  metadata: DatasetMetadata
  data: SbcRecord[]
}

// --- Pillar 4: Rate Volatility ---
export interface MetalLevelStats {
  plan_count: number
  avg_premium_40: number
  min_premium_40: number
  max_premium_40: number
}

export interface RateVolatilityRecord {
  state_code: string
  county_fips: string
  plan_year: number
  carrier_count: number
  plan_count: number
  carriers: string[]
  avg_premium_age_21: number
  avg_premium_age_40: number
  avg_premium_age_64: number
  age_64_shock_ratio: number
  by_metal_level: Partial<Record<string, MetalLevelStats>>
  yoy_change_pct?: number
}

export interface RateVolatilityDataset {
  metadata: DatasetMetadata
  data: RateVolatilityRecord[]
}

// --- Pillar 5: Friction Q&A ---
export interface FrictionQA {
  id: string
  category: string
  question: string
  answer: string
  citations?: string[]
  tags?: string[]
  related_entities?: string[]
  regulatory_citation?: string
  state_specific?: boolean
  state_notes?: string
  plan_year?: number
}

export interface FrictionQADataset {
  metadata: DatasetMetadata
  data: FrictionQA[]
}

// --- Pillar 6: Formulary Intelligence ---
export interface FormularyDrug {
  drug_name: string
  rxnorm_id?: string
  drug_tier?: string       // e.g. "GENERIC", "PREFERRED-BRAND", "ACA-PREVENTIVE-DRUGS"
  issuer_ids?: string[]    // array of issuer IDs that carry this drug
  plan_id?: string
  plan_year?: number
  prior_authorization?: boolean
  step_therapy?: boolean
  quantity_limit?: boolean
  is_priority_drug?: boolean
  // Legacy flat fields (may not be present in all sources)
  issuer_id?: string
  issuer_name?: string
  state_code?: string
}

// Formulary is too large for eager loading — use streaming/search APIs
export interface FormularySearchParams {
  drug_name: string
  state_code?: string
  issuer_id?: string
  plan_id?: string
}

// --- Pillar 7: Dental Coverage ---
export interface DentalCostSharing {
  individual_in_network: number | null
  family_per_person_in_network: number | null
  family_per_group_in_network: number | null
  source_note: string
}

export interface DentalWaitingPeriods {
  preventive_months: number | null
  basic_months: number | null
  major_months: number | null
  ortho_months: number | null
  source: string
  needs_pdf_parsing: boolean
}

export interface DentalCoveragePercentages {
  preventive_adult: number | null
  preventive_child: number | null
  basic_adult: number | null
  basic_child: number | null
  major_adult: number | null
  major_child: number | null
  ortho_adult: number | null
  ortho_child: number | null
  xrays: number | null
  sealants_child: number | null
  fluoride_child: number | null
  root_canal: number | null
  oral_surgery: number | null
  periodontics: number | null
  dentures: number | null
  implants_adult: number | null
  implants_child: number | null
  extractions: number | null
  fillings: number | null
  accidental_adult: number | null
  accidental_child: number | null
}

export interface DentalQuantityLimit {
  qty: number
  unit: string
}

export interface DentalRecord {
  plan_id: string
  plan_variant_id: string
  plan_name: string
  issuer_id: string
  issuer_name: string
  state_code: string
  metal_level: 'Low' | 'High' | string
  plan_type: string
  csr_variation: string
  is_new_plan: boolean
  service_area_id: string
  covers_entire_state: boolean
  counties: number[]
  market_coverage: string
  deductible: DentalCostSharing
  annual_maximum: DentalCostSharing
  waiting_periods: DentalWaitingPeriods
  coverage_percentages: DentalCoveragePercentages
  quantity_limits: Record<string, DentalQuantityLimit>
  implants_adult_covered: boolean
  ortho_adult_covered: boolean
  pre_existing_excluded: boolean
  plan_level_exclusions_raw: string | null
  bencs_exclusion_notes: string[]
  premium_data_available: boolean
  premium_note: string
  ehb_pediatric_dental_apportionment: number
  sbc_url: string | null
}

export interface DentalDataset {
  metadata: DatasetMetadata
  data: DentalRecord[]
}

// --- Pillar 8: Billing Intelligence ---
export interface BillingCodeEntry {
  cpt: string
  description: string
  cost_sharing?: string
}

export interface BillingCoding {
  code_1?: BillingCodeEntry
  code_2?: BillingCodeEntry
  code_2_examples?: BillingCodeEntry[]
  facility_codes?: BillingCodeEntry[]
  physician_codes?: BillingCodeEntry[]
  ancillary_codes?: BillingCodeEntry[]
  modifier?: string
  icd10_examples?: string[]
  billing_mechanism?: string
}

export interface BillingScenario {
  id: string
  billing_category: string
  title: string
  description: string
  how_it_gets_coded: BillingCoding
  cost_impact_by_plan_type: Record<string, string>
  consumer_tip: string
  related_triggers: string[]
  related_cfr: string
  consumer_risk_level: string
}

export interface BillingDataset {
  metadata: DatasetMetadata & {
    cpt_code_disclaimer: string
    disclaimer: string
  }
  data: BillingScenario[]
}

// --- Pillar 9: Life Events ---
export interface SepDetails {
  sep_type: string
  window_days: number | null
  window_start?: string
  marketplace_eligible?: boolean
  medicaid_eligible?: boolean
  retroactive_coverage?: boolean
  retroactive_notes?: string
  notes?: string
  medicare_iep_note?: string
  marketplace_note?: string
  // Legacy fields (kept for backwards compat)
  qualifying_event?: string
  documentation_required?: string[]
}

export interface DecisionTreeNode {
  node: string
  yes_path?: string
  no_path?: string
  [key: string]: string | undefined
}

export interface KeyDeadline {
  deadline: string
  action: string
}

export interface LifeEventContentPageData {
  faq_questions: string[]
  schema_type: string
  related_entities: string[]
}

export interface LifeEventRecord {
  id: string
  slug: string
  title: string
  category: string
  url_pattern: string
  trigger_description: string
  sep_details: SepDetails
  documentation_needed?: string[]
  timeline_days?: Record<string, Record<string, string>>
  decision_tree?: DecisionTreeNode[]
  state_specific_rules?: Record<string, string>
  consumer_mistakes?: string[]
  key_deadlines?: KeyDeadline[]
  pillar_connections?: Record<string, string>
  content_page_data?: LifeEventContentPageData
  // Legacy fields
  action_steps?: string[]
  deadlines?: Record<string, string>
  common_mistakes?: string[]
}

export interface LifeEventsDataset {
  metadata: DatasetMetadata & {
    categories?: Record<string, number>
    disclaimer?: string
  }
  data: LifeEventRecord[]
}

// --- Pillar 10: Policy Scenarios ---

export interface CreditBreakdown {
  full_monthly_premium: number
  applicable_percentage: number
  monthly_contribution: number
  monthly_aptc: number
  net_monthly_premium: number
  annual_aptc: number
  annual_net_cost: number
}

export interface ExpirationImpact {
  monthly_premium_increase: number
  annual_premium_increase: number
  percent_increase: number
  impact_level: 'catastrophic' | 'severe' | 'significant' | 'moderate' | 'minimal' | 'no_impact'
}

export interface FplScenarioDetail {
  fpl_percent: number
  annual_income: number
  with_enhanced_credits: CreditBreakdown
  without_enhanced_credits_pre_arp: CreditBreakdown
  cliff_applies_pre_arp: boolean
  expiration_impact: ExpirationImpact
}

export interface AgeScenario {
  age: number
  age_rating_factor: number
  benchmark_premium_at_age: number
  aptc_at_250_fpl?: number
  net_premium_at_250_fpl?: number
  fpl_scenarios?: Record<string, FplScenarioDetail>
}

export interface PolicyHeadline {
  description: string
  age: number
  fpl_percent: number
  annual_income: number
  current_net_monthly_with_enhanced: number
  net_monthly_without_enhanced_pre_arp: number
  monthly_increase_at_expiration: number
  annual_increase_at_expiration: number
}

export interface PolicyScenarioRecord {
  state_code: string
  county_fips: string
  benchmark_silver_premium_age40: number
  fpl_base: number
  household_size: number
  headline: PolicyHeadline
  age_scenarios: {
    age_27?: AgeScenario
    age_40?: AgeScenario
    age_50?: AgeScenario
    age_60?: AgeScenario
    age_64?: AgeScenario
  }
}

export interface PolicyScenariosDataset {
  metadata: DatasetMetadata
  records: PolicyScenarioRecord[]
}

// --- Page params helpers ---
export interface StateCountyParams {
  state: string
  county: string
}

export interface PlanParams {
  plan_id: string
}
