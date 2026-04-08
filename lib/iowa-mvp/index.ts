/**
 * lib/iowa-mvp/index.ts — Public API for the Iowa MVP scoring engine.
 */

export { scorePlans } from './scoring'
export { validateText, isTextSafe, getRequiredDisclaimers, DISCLAIMERS } from './guardrails'
export type {
  UserProfile,
  IowaPlan,
  IowaSubsidy,
  IowaMvpDataset,
  ScoringResult,
  PlanResult,
  DrugMatch,
  ScoreDimension,
  RiskFlag,
  VerificationItem,
} from './types'
