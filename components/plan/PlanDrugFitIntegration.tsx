/**
 * PlanDrugFitIntegration — Connects plan page to county drug coverage system.
 *
 * Shows this plan's drug cost-sharing from SBC data (if available), then links
 * to county-specific drug coverage pages for common medication categories.
 * All links use canonical /{state}/{county}/{drug}-coverage URLs.
 */

import Link from 'next/link'
import type { PlanRecord, SbcRecord } from '@/lib/types'

interface Props {
  plan: PlanRecord
  sbc: SbcRecord | null
  stateSlug: string
  countySlug: string
}

interface DrugCategory {
  label: string
  drugs: string[]
}

// Common medications by therapeutic category — covers the most searched drugs
const DRUG_CATEGORIES: DrugCategory[] = [
  {
    label: 'Cardiovascular',
    drugs: ['lisinopril', 'metoprolol', 'amlodipine', 'atorvastatin', 'losartan'],
  },
  {
    label: 'Diabetes',
    drugs: ['metformin', 'glipizide', 'januvia', 'ozempic', 'trulicity'],
  },
  {
    label: 'Mental Health',
    drugs: ['sertraline', 'fluoxetine', 'escitalopram', 'venlafaxine', 'bupropion'],
  },
  {
    label: 'Respiratory',
    drugs: ['albuterol', 'montelukast', 'advair', 'spiriva', 'symbicort'],
  },
  {
    label: 'Thyroid & Hormonal',
    drugs: ['levothyroxine', 'synthroid', 'estradiol', 'progesterone'],
  },
  {
    label: 'Pain & Inflammatory',
    drugs: ['ibuprofen', 'naproxen', 'celecoxib', 'prednisone', 'meloxicam'],
  },
]

function toDrugSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getDrugCostSummary(sbc: SbcRecord | null): string | null {
  if (!sbc) return null
  const grid = sbc.cost_sharing_grid
  const parts: string[] = []

  const generic = grid?.generic_drug
  const preferred = grid?.preferred_brand_drug
  const nonPreferred = grid?.non_preferred_brand_drug
  const specialty = grid?.specialty_drug

  if (generic?.copay_in_network != null)
    parts.push(`Generics: $${generic.copay_in_network}/fill`)
  if (preferred?.copay_in_network != null)
    parts.push(`Preferred brand: $${preferred.copay_in_network}/fill`)
  if (nonPreferred?.copay_in_network != null)
    parts.push(`Non-preferred brand: $${nonPreferred.copay_in_network}/fill`)
  if (specialty?.copay_in_network != null)
    parts.push(`Specialty: $${specialty.copay_in_network}/fill`)
  else if (specialty?.coinsurance_in_network != null)
    parts.push(`Specialty: ${Math.round(specialty.coinsurance_in_network * 100)}% coinsurance`)

  return parts.length > 0 ? parts.join(' · ') : null
}

export default function PlanDrugFitIntegration({ plan, sbc, stateSlug, countySlug }: Props) {
  const drugCostSummary = getDrugCostSummary(sbc)

  return (
    <section aria-labelledby="drug-fit-heading" className="mb-10">
      <h2 id="drug-fit-heading" className="text-xl font-semibold text-navy-800 mb-2">
        Check Drug Coverage for This Plan
      </h2>
      <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
        Drug coverage varies by carrier formulary. Use the links below to check whether specific
        medications are covered by {plan.issuer_name} in this county. Each link goes to a
        county-specific formulary page sourced from federal formulary data.
      </p>

      {drugCostSummary && (
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 mb-5 text-sm text-neutral-700">
          <span className="font-medium">Drug cost-sharing on this plan: </span>
          {drugCostSummary}
        </div>
      )}

      <div className="space-y-5">
        {DRUG_CATEGORIES.map(cat => (
          <div key={cat.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
              {cat.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {cat.drugs.map(drug => (
                <Link
                  key={drug}
                  href={`/${stateSlug}/${countySlug}/${toDrugSlug(drug)}-coverage`}
                  className="px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700 font-medium hover:bg-primary-100 hover:border-primary-300 transition-colors"
                >
                  {capitalize(drug)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400 mt-4">
        Drug coverage links are county-specific, sourced from federal formulary data,
        plan year 2026. Formulary placement can change during the plan year — always verify current
        coverage directly with {plan.issuer_name} before filling a prescription.
      </p>
    </section>
  )
}
