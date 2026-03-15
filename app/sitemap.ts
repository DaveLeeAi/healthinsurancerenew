/**
 * app/sitemap.ts
 *
 * Next.js Metadata API sitemap — generates /sitemap.xml at request time.
 *
 * Coverage:
 *   - Static marketing and editorial pages
 *   - Dynamic routes: guides, faq, billing, life-events, dental, states
 *   - Large data routes: plans/rates (rate_volatility combos), subsidies
 *     (subsidy_engine combos), enhanced-credits (policy_scenarios combos)
 *
 * changeFrequency:
 *   - 'weekly'  — all data pillar pages (county, dental, faq, billing, life-events)
 *   - 'monthly' — static editorial, guides, state content pages
 *   - 'yearly'  — legal pages (privacy, terms, licensing)
 *
 * Each section is wrapped in try/catch so a failure in one pillar does not
 * suppress the rest of the sitemap.
 */

import type { MetadataRoute } from 'next'
import {
  loadFrictionQA,
  loadBillingIntel,
  getAllLifeEventSlugs,
  loadDentalCoverage,
  getAllStateCountyCombos,
  getAllSubsidyStateCountyCombos,
  getAllPolicyStateCountyCombos,
} from '@/lib/data-loader'
import { getCollectionSlugs } from '@/lib/markdown'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://healthinsurancerenew.com'
const TODAY = new Date().toISOString().split('T')[0]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function url(
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'monthly',
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: TODAY,
    changeFrequency,
    priority,
  }
}

// ---------------------------------------------------------------------------
// Static pages
// ---------------------------------------------------------------------------

function staticPages(): MetadataRoute.Sitemap {
  return [
    // ── Homepage ──────────────────────────────────────────────────────────
    url('/', 1.0, 'weekly'),

    // ── Main section indexes ──────────────────────────────────────────────
    url('/guides', 0.9, 'weekly'),
    url('/tools', 0.9, 'monthly'),
    url('/states', 0.9, 'monthly'),
    url('/faq', 0.9, 'weekly'),
    url('/billing', 0.8, 'monthly'),

    // ── Core editorial / policy pages ────────────────────────────────────
    url('/about', 0.7, 'monthly'),
    url('/contact', 0.7, 'monthly'),
    url('/privacy', 0.5, 'yearly'),
    url('/terms', 0.5, 'yearly'),
    url('/licensing', 0.5, 'yearly'),
    url('/editorial-policy', 0.6, 'monthly'),
    url('/how-we-get-paid', 0.6, 'monthly'),
    url('/data-methodology', 0.6, 'monthly'),
    url('/glossary', 0.7, 'monthly'),
    url('/eligibility-check', 0.7, 'monthly'),
    url('/circle-of-champions', 0.6, 'monthly'),

    // ── High-value ACA content pages ──────────────────────────────────────
    url('/fpl-2026', 0.8, 'yearly'),
    url('/aca-income-guide-2026', 0.8, 'yearly'),
    url('/csr-explained-2026', 0.8, 'yearly'),
    url('/early-retirement-health-insurance-2026', 0.8, 'yearly'),
    url('/employer-coverage-unaffordable-2026', 0.8, 'yearly'),
    url('/lost-job-health-insurance-2026', 0.8, 'yearly'),
    url('/self-employed-health-insurance-2026', 0.8, 'yearly'),
    url('/turning-26-health-insurance-options', 0.8, 'yearly'),

    // ── Tools (individual) ────────────────────────────────────────────────
    url('/tools/csr-estimator', 0.8, 'monthly'),
    url('/tools/family-coverage-estimator', 0.8, 'monthly'),
    url('/tools/income-savings-calculator', 0.8, 'monthly'),
    url('/tools/job-plan-affordability', 0.8, 'monthly'),
    url('/tools/plan-comparison', 0.8, 'monthly'),
    url('/tools/what-income-counts', 0.8, 'monthly'),
  ]
}

// ---------------------------------------------------------------------------
// Guides — markdown collection
// ---------------------------------------------------------------------------

function guidesPages(): MetadataRoute.Sitemap {
  try {
    const slugs = getCollectionSlugs('guides')
    return slugs.map((slug) => url(`/guides/${slug}`, 0.8, 'monthly'))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// States (markdown content pages) — /states/[state]
// ---------------------------------------------------------------------------

function stateContentPages(): MetadataRoute.Sitemap {
  try {
    const slugs = getCollectionSlugs('states')
    return slugs.map((slug) => url(`/states/${slug}`, 0.7, 'monthly'))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// FAQ — categories and individual question pages
// ---------------------------------------------------------------------------

function faqPages(): MetadataRoute.Sitemap {
  try {
    const dataset = loadFrictionQA()
    const entries: MetadataRoute.Sitemap = []

    // Unique category pages
    const categories = new Set(dataset.data.map((q) => q.category))
    for (const category of categories) {
      entries.push(url(`/faq/${category}`, 0.7, 'weekly'))
    }

    // Individual Q&A pages
    for (const q of dataset.data) {
      entries.push(url(`/faq/${q.category}/${q.id}`, 0.6, 'weekly'))
    }

    return entries
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Billing — scenarios keyed by billing_category
// ---------------------------------------------------------------------------

function billingPages(): MetadataRoute.Sitemap {
  try {
    const dataset = loadBillingIntel()
    return dataset.data.map((b) =>
      url(`/billing/${b.billing_category}`, 0.7, 'weekly'),
    )
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Life events — /life-events/[event_type]
// ---------------------------------------------------------------------------

function lifeEventPages(): MetadataRoute.Sitemap {
  try {
    const slugs = getAllLifeEventSlugs()
    return slugs.map((slug) => url(`/life-events/${slug}`, 0.8, 'weekly'))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Dental — /dental/[state] and /dental/[state]/[plan_variant]
// ---------------------------------------------------------------------------

function dentalPages(): MetadataRoute.Sitemap {
  try {
    const dataset = loadDentalCoverage()
    const entries: MetadataRoute.Sitemap = []

    // Unique state-level pages
    const states = new Set(dataset.data.map((p) => p.state_code.toLowerCase()))
    for (const state of states) {
      entries.push(url(`/dental/${state}`, 0.7, 'weekly'))
    }

    // Per-variant pages — /dental/[state]/[plan_variant_id]
    for (const plan of dataset.data) {
      entries.push(
        url(
          `/dental/${plan.state_code.toLowerCase()}/${plan.plan_variant_id}`,
          0.6,
          'weekly',
        ),
      )
    }

    return entries
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Plans & Rates — /plans/[state]/[county] and /rates/[state]/[county]
//
// Uses getAllStateCountyCombos() which reads rate_volatility.json (0.6 MB).
// This is the fastest proxy for the shared coverage footprint and avoids
// loading plan_intelligence.json (107 MB) at sitemap generation time.
// ---------------------------------------------------------------------------

function plansAndRatesPages(): MetadataRoute.Sitemap {
  try {
    const combos = getAllStateCountyCombos()
    const entries: MetadataRoute.Sitemap = []
    for (const { state, county } of combos) {
      const stateSlug = state.toLowerCase()
      entries.push(url(`/plans/${stateSlug}/${county}`, 0.7, 'weekly'))
      entries.push(url(`/rates/${stateSlug}/${county}`, 0.7, 'weekly'))
    }
    return entries
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Subsidies — /subsidies/[state]/[county]
//
// Uses getAllSubsidyStateCountyCombos() from subsidy_engine.json (2.8 MB).
// ---------------------------------------------------------------------------

function subsidyPages(): MetadataRoute.Sitemap {
  try {
    const combos = getAllSubsidyStateCountyCombos()
    return combos.map(({ state, county }) =>
      url(`/subsidies/${state.toLowerCase()}/${county}`, 0.8, 'weekly'),
    )
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Enhanced Credits — /enhanced-credits/[state]/[county]
//
// Uses getAllPolicyStateCountyCombos() from policy_scenarios.json (65 MB).
// ---------------------------------------------------------------------------

function enhancedCreditsPages(): MetadataRoute.Sitemap {
  try {
    const combos = getAllPolicyStateCountyCombos()
    return combos.map(({ state, county }) =>
      url(`/enhanced-credits/${state.toLowerCase()}/${county}`, 0.8, 'weekly'),
    )
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    ...staticPages(),
    ...guidesPages(),
    ...stateContentPages(),
    ...faqPages(),
    ...billingPages(),
    ...lifeEventPages(),
    ...dentalPages(),
    ...plansAndRatesPages(),
    ...subsidyPages(),
    ...enhancedCreditsPages(),
  ]
}
