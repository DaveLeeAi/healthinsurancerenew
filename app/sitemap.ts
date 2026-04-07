import type { MetadataRoute } from 'next'
import {
  getAllPlanStateCountyCombos,
  getAllStateCountyCombos,
  getAllSubsidyStateCountyCombos,
  getAllPolicyStateCountyCombos,
  getAllPolicyStates,
  loadDentalCoverage,
  loadBillingIntel,
  loadLifeEvents,
  loadFrictionQA,
} from '@/lib/data-loader'
import { getCollectionSlugs } from '@/lib/markdown'
import {
  stateCodeToSlug,
  getCountySlug,
} from '@/lib/county-lookup'

const SITE_URL = 'https://healthinsurancerenew.com'

/**
 * Dynamic sitemap generation for all public page types.
 *
 * Priority weighting for phased indexing (signals to Google which pages matter most):
 *   1.0  — Homepage
 *   0.9  — Formulary drug lookup, state plan listings (money pages)
 *   0.8  — County hubs, SBC plan detail pages
 *   0.7  — Dental plan pages, subsidy pages, rate pages
 *   0.6  — Life events, enhanced credits, state hubs
 *   0.5  — Billing, guides, FAQ
 *   0.4  — Index/landing pages
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()
  const entries: MetadataRoute.Sitemap = []

  // ── Homepage ──
  entries.push({
    url: SITE_URL,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1.0,
  })

  // ── Static pages ──
  const staticPages = [
    { path: '/formulary', priority: 0.9 },
    { path: '/dental', priority: 0.7 },
    { path: '/rates', priority: 0.5 },
    { path: '/billing', priority: 0.5 },
    { path: '/subsidies', priority: 0.7 },
    { path: '/enhanced-credits', priority: 0.6 },
    { path: '/life-events', priority: 0.6 },
    { path: '/states', priority: 0.6 },
    { path: '/faq', priority: 0.4 },
    { path: '/about', priority: 0.3 },
    { path: '/about/editorial-policy', priority: 0.3 },
    { path: '/about/data-methodology', priority: 0.3 },
    { path: '/contact', priority: 0.4 },
    { path: '/tools/subsidy-estimator', priority: 0.7 },
    { path: '/tools/income-savings-calculator', priority: 0.7 },
  ]
  for (const page of staticPages) {
    entries.push({
      url: `${SITE_URL}${page.path}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: page.priority,
    })
  }

  // ── State hub pages (/states/{state}) ──
  const stateSlugs = getCollectionSlugs('states')
  for (const slug of stateSlugs) {
    entries.push({
      url: `${SITE_URL}/states/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // ── State plan listing pages (/{state}/health-insurance-plans) ──
  // ── County hub pages (/{state}/{county}) ──
  const planCombos = getAllPlanStateCountyCombos()
  const seenStates = new Set<string>()
  for (const { state, county } of planCombos) {
    const stateSlug = stateCodeToSlug(state.toUpperCase())
    const countySlug = getCountySlug(county)

    if (!seenStates.has(stateSlug)) {
      seenStates.add(stateSlug)
      entries.push({
        url: `${SITE_URL}/${stateSlug}/health-insurance-plans`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.9,
      })
    }

    entries.push({
      url: `${SITE_URL}/${stateSlug}/${countySlug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  }

  // ── Subsidy pages (/subsidies/{state}/{county}) ──
  const subsidyCombos = getAllSubsidyStateCountyCombos()
  for (const { state, county } of subsidyCombos) {
    entries.push({
      url: `${SITE_URL}/subsidies/${state}/${county}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  // ── Rate pages (/rates/{state}/{county}) ──
  const rateCombos = getAllStateCountyCombos()
  const rateStates = new Set<string>()
  for (const { state, county } of rateCombos) {
    if (!rateStates.has(state)) {
      rateStates.add(state)
      entries.push({
        url: `${SITE_URL}/rates/${state}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
    entries.push({
      url: `${SITE_URL}/rates/${state}/${county}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  // ── Enhanced credits pages ──
  const policyCombos = getAllPolicyStateCountyCombos()
  const policyStates = getAllPolicyStates()
  for (const state of policyStates) {
    entries.push({
      url: `${SITE_URL}/enhanced-credits/${state.toLowerCase()}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }
  for (const { state, county } of policyCombos) {
    entries.push({
      url: `${SITE_URL}/enhanced-credits/${state}/${county}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // ── Dental pages (/dental/{state}/{plan_variant}) ──
  const dental = loadDentalCoverage()
  const dentalStates = new Set<string>()
  for (const plan of dental.data) {
    const state = plan.state_code.toLowerCase()
    if (!dentalStates.has(state)) {
      dentalStates.add(state)
      entries.push({
        url: `${SITE_URL}/dental/${state}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
    entries.push({
      url: `${SITE_URL}/dental/${state}/${plan.plan_variant_id}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  // ── Life events pages ──
  const lifeEvents = loadLifeEvents()
  for (const event of lifeEvents.data) {
    entries.push({
      url: `${SITE_URL}/life-events/${event.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // ── Billing pages ──
  const billing = loadBillingIntel()
  for (const scenario of billing.data) {
    entries.push({
      url: `${SITE_URL}/billing/${scenario.billing_category}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  }

  // ── Guide pages ──
  const guideSlugs = getCollectionSlugs('guides')
  for (const slug of guideSlugs) {
    entries.push({
      url: `${SITE_URL}/guides/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  }

  // ── FAQ pages ──
  const faqData = loadFrictionQA()
  const faqCategories = new Set<string>()
  for (const q of faqData.data) {
    if (!faqCategories.has(q.category)) {
      faqCategories.add(q.category)
      entries.push({
        url: `${SITE_URL}/faq/${q.category}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.4,
      })
    }
    entries.push({
      url: `${SITE_URL}/faq/${q.category}/${q.id}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  }

  return entries
}
