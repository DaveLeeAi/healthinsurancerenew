/**
 * app/api/iowa-compare/route.ts — API endpoint for Iowa plan scoring.
 *
 * Accepts a UserProfile, runs the deterministic scoring engine,
 * and returns grounded plan-fit results.
 */

import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { scorePlans } from '@/lib/iowa-mvp/scoring'
import { validateText } from '@/lib/iowa-mvp/guardrails'
import type { UserProfile, IowaMvpDataset } from '@/lib/iowa-mvp/types'

const DATA_PATH = path.join(process.cwd(), 'data', 'processed', 'iowa_mvp_plans.json')

let datasetCache: IowaMvpDataset | null = null

function loadDataset(): IowaMvpDataset {
  if (datasetCache) return datasetCache
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error('Iowa MVP dataset not found. Run: python scripts/generate/build_iowa_mvp.py')
  }
  datasetCache = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')) as IowaMvpDataset
  return datasetCache
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

function validateProfile(body: unknown): { valid: true; profile: UserProfile } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' }
  }

  const b = body as Record<string, unknown>

  if (!b.county_fips || typeof b.county_fips !== 'string') {
    return { valid: false, error: 'county_fips is required and must be a string.' }
  }

  const age = Number(b.age)
  if (!Number.isFinite(age) || age < 18 || age > 64) {
    return { valid: false, error: 'age must be a number between 18 and 64.' }
  }

  const householdSize = Number(b.household_size)
  if (!Number.isFinite(householdSize) || householdSize < 1 || householdSize > 10) {
    return { valid: false, error: 'household_size must be a number between 1 and 10.' }
  }

  const income = Number(b.annual_income)
  if (!Number.isFinite(income) || income < 0 || income > 1000000) {
    return { valid: false, error: 'annual_income must be a number between 0 and 1,000,000.' }
  }

  const validUsage = ['low', 'moderate', 'high']
  if (!validUsage.includes(b.expected_usage as string)) {
    return { valid: false, error: `expected_usage must be one of: ${validUsage.join(', ')}` }
  }

  const validBudget = ['lowest_premium', 'balanced', 'lowest_risk']
  if (!validBudget.includes(b.budget_preference as string)) {
    return { valid: false, error: `budget_preference must be one of: ${validBudget.join(', ')}` }
  }

  const validPlanType = ['no_preference', 'HMO', 'PPO', 'EPO']
  const planTypePref = (b.plan_type_preference as string) || 'no_preference'
  if (!validPlanType.includes(planTypePref)) {
    return { valid: false, error: `plan_type_preference must be one of: ${validPlanType.join(', ')}` }
  }

  const validRisk = ['low', 'moderate', 'high']
  const riskTol = (b.risk_tolerance as string) || 'moderate'
  if (!validRisk.includes(riskTol)) {
    return { valid: false, error: `risk_tolerance must be one of: ${validRisk.join(', ')}` }
  }

  // Validate medications array
  let medications: string[] = []
  if (Array.isArray(b.medications)) {
    medications = (b.medications as unknown[])
      .filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
      .map((m) => m.trim())
      .slice(0, 10) // Cap at 10 medications
  }

  // Validate notes (free text, sanitize)
  const notes = typeof b.notes === 'string' ? b.notes.slice(0, 500) : ''

  const profile: UserProfile = {
    county_fips: b.county_fips as string,
    age,
    household_size: householdSize,
    annual_income: income,
    is_smoker: b.is_smoker === true,
    medications,
    expected_usage: b.expected_usage as UserProfile['expected_usage'],
    budget_preference: b.budget_preference as UserProfile['budget_preference'],
    plan_type_preference: planTypePref as UserProfile['plan_type_preference'],
    risk_tolerance: riskTol as UserProfile['risk_tolerance'],
    notes,
  }

  return { valid: true, profile }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = validateProfile(body)

    if (!validation.valid) {
      return NextResponse.json(
        { status: 'error', error: validation.error },
        { status: 400 }
      )
    }

    const dataset = loadDataset()
    const result = scorePlans(validation.profile, dataset)

    // Final guardrail check on all output text
    const allText = result.top_plans
      .flatMap((p) => [...p.why_it_may_fit, ...p.main_tradeoffs])
      .join(' ')
    const violations = validateText(allText)
    if (violations.length > 0) {
      console.error('[iowa-compare] Guardrail violations detected in output:', violations)
      // Strip the violated content rather than failing
      for (const plan of result.top_plans) {
        plan.why_it_may_fit = plan.why_it_may_fit.filter((t) => validateText(t).length === 0)
        plan.main_tradeoffs = plan.main_tradeoffs.filter((t) => validateText(t).length === 0)
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[iowa-compare] Error:', err)
    return NextResponse.json(
      { status: 'error', error: 'An internal error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
