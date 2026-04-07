/**
 * lib/iowa-mvp/guardrails.ts — Hard-coded safety guardrails for the Iowa MVP.
 *
 * Validates output text to ensure compliance with:
 * - No guarantee language
 * - No enrollment-advice language
 * - No discriminatory logic
 * - No unsupported claims
 */

// ---------------------------------------------------------------------------
// Forbidden phrase patterns
// ---------------------------------------------------------------------------

const GUARANTEE_PATTERNS = [
  /\bguaranteed?\b/i,
  /\bdefinitely covered\b/i,
  /\bdefinitely in[- ]network\b/i,
  /\byou will be approved\b/i,
  /\bexact cost will be\b/i,
  /\bwill definitely\b/i,
  /\b100% certain\b/i,
  /\bwe guarantee\b/i,
  /\bpromise you\b/i,
  /\bassured\b/i,
]

const ENROLLMENT_ADVICE_PATTERNS = [
  /\byou should enroll\b/i,
  /\bapply now\b/i,
  /\benroll now\b/i,
  /\bsign up (?:now|today|immediately)\b/i,
  /\bthis is the best plan for you\b/i,
  /\bthe best plan\b/i,
  /\bthe only plan you need\b/i,
  /\bwe recommend you choose\b/i,
  /\byou must select\b/i,
]

const UNSUPPORTED_CLAIM_PATTERNS = [
  /\byour doctor (?:is|will be) in[- ]network\b/i,
  /\byour pharmacy (?:is|will) cover\b/i,
  /\byour exact (?:premium|cost|price) (?:is|will be)\b/i,
  /\byou will (?:save|pay) exactly\b/i,
  /\byour subsidy (?:is|will be) exactly\b/i,
]

const DISCRIMINATORY_PATTERNS = [
  /\bpeople (?:like you|in your area|with your income) (?:should|deserve|only need)\b/i,
  /\bbased on your (?:neighborhood|zip code|race|gender|ethnicity)\b/i,
  /\byou (?:only )?deserve\b/i,
  /\blower[- ]income (?:people|individuals) should (?:accept|settle)\b/i,
]

// ---------------------------------------------------------------------------
// Validation functions
// ---------------------------------------------------------------------------

export interface GuardrailViolation {
  category: 'guarantee' | 'enrollment_advice' | 'unsupported_claim' | 'discriminatory'
  pattern: string
  matched_text: string
}

/**
 * Scan text for guardrail violations. Returns an array of violations found.
 * Empty array = text is safe.
 */
export function validateText(text: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = []

  const checkPatterns = (
    patterns: RegExp[],
    category: GuardrailViolation['category']
  ) => {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        violations.push({
          category,
          pattern: pattern.source,
          matched_text: match[0],
        })
      }
    }
  }

  checkPatterns(GUARANTEE_PATTERNS, 'guarantee')
  checkPatterns(ENROLLMENT_ADVICE_PATTERNS, 'enrollment_advice')
  checkPatterns(UNSUPPORTED_CLAIM_PATTERNS, 'unsupported_claim')
  checkPatterns(DISCRIMINATORY_PATTERNS, 'discriminatory')

  return violations
}

/**
 * Check if text is safe (no violations).
 */
export function isTextSafe(text: string): boolean {
  return validateText(text).length === 0
}

/**
 * Sanitize an array of explanation strings, removing any that contain violations.
 * Returns only safe strings.
 */
export function sanitizeExplanations(explanations: string[]): string[] {
  return explanations.filter((text) => isTextSafe(text))
}

// ---------------------------------------------------------------------------
// Required disclaimers
// ---------------------------------------------------------------------------

export const DISCLAIMERS = {
  general:
    'This tool provides estimates for educational purposes only. It is not insurance advice, and results are not a guarantee of coverage, costs, or eligibility. Plans, premiums, and benefits may differ from what is shown here.',
  non_enrollment:
    'This tool does not sell, solicit, or negotiate insurance. It is not affiliated with any government agency. Talk to a licensed agent or visit HealthCare.gov before making enrollment decisions.',
  data_snapshot:
    'Results are based on 2026 federal marketplace plan data loaded into this system. Carrier rules, plan availability, formulary coverage, and provider networks can change. Always verify details directly with the carrier or HealthCare.gov before enrolling.',
  subsidy_estimate:
    'Subsidy estimates shown here are approximate. Your actual premium tax credit depends on your final tax return, household composition, and the benchmark Silver plan in your area. Use the official HealthCare.gov calculator for binding estimates.',
  drug_coverage:
    'Drug coverage information is based on available formulary data. Not all carriers have verified formulary data in this system. Prior authorization, step therapy, and quantity limit requirements may apply. Confirm coverage with the carrier before enrolling.',
  no_provider_data:
    'This tool does not include provider directory or network data. Verify that your doctors, hospitals, and preferred pharmacies participate in any plan before enrolling.',
  non_discrimination:
    'This tool uses only lawful rating factors (age, location, tobacco use) and user-stated preferences. It does not discriminate based on gender, race, ethnicity, religion, disability, or any protected characteristic.',
} as const

export type DisclaimerKey = keyof typeof DISCLAIMERS

/**
 * Returns the standard set of disclaimers for display on the results page.
 */
export function getRequiredDisclaimers(): string[] {
  return [
    DISCLAIMERS.general,
    DISCLAIMERS.non_enrollment,
    DISCLAIMERS.data_snapshot,
    DISCLAIMERS.subsidy_estimate,
    DISCLAIMERS.no_provider_data,
  ]
}
