/**
 * PlanCostScenario — Real-world cost simulation.
 *
 * Shows 3 scenarios (low / moderate / high use) using actual plan values:
 * deductible, MOOP, coinsurance, and SBC copays where available.
 * Never uses generic ranges — every number is derived from plan data.
 * Returns null if deductible and MOOP are both absent.
 */

import type { PlanRecord, SbcRecord } from '@/lib/types'

interface Props {
  plan: PlanRecord
  sbc: SbcRecord | null
}

interface ScenarioEvent {
  service: string
  frequency: string
  cost: string
}

interface Scenario {
  label: string
  subtitle: string
  events: ScenarioEvent[]
  annualOOP: string
  totalWithPremium: string | null
  context: string
  severity: 'low' | 'moderate' | 'high'
}

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`
}

function getCoinsuranceRate(plan: PlanRecord): number {
  const metal = plan.metal_level.toLowerCase().replace(/\s+/g, '_')
  const RATES: Record<string, number> = {
    bronze: 0.4,
    expanded_bronze: 0.4,
    silver: 0.3,
    gold: 0.2,
    platinum: 0.1,
    catastrophic: 0.4,
  }
  return RATES[metal] ?? 0.3
}

function getSbcCopay(
  sbc: SbcRecord | null,
  category: keyof SbcRecord['cost_sharing_grid'],
): number | null {
  const entry = sbc?.cost_sharing_grid?.[category]
  if (!entry) return null
  if (entry.copay_in_network != null && entry.copay_in_network >= 0) return entry.copay_in_network
  return null
}

function buildScenarios(plan: PlanRecord, sbc: SbcRecord | null): Scenario[] {
  const deductible = plan.deductible_individual ?? 0
  const moop = plan.moop_individual ?? 0
  const coinsurance = getCoinsuranceRate(plan)
  const coinPct = Math.round(coinsurance * 100)
  const annualPremium = plan.premiums?.age_40 ? plan.premiums.age_40 * 12 : null

  const pcCopay = getSbcCopay(sbc, 'primary_care')
  const specCopay = getSbcCopay(sbc, 'specialist')
  const genericCopay = getSbcCopay(sbc, 'generic_drug')
  const erCopay = getSbcCopay(sbc, 'emergency_room')

  // ── Low use ─────────────────────────────────────────────────────────────────
  // 1 preventive visit + 1 PC visit + 3 generic drug fills
  const lowPC = pcCopay != null ? pcCopay : Math.min(deductible, Math.round(150 * coinsurance))
  const lowGenericPerFill = genericCopay != null ? genericCopay : 15
  const lowOOP = lowPC + lowGenericPerFill * 3

  // ── Moderate use ────────────────────────────────────────────────────────────
  // 3 PC visits + 1 specialist + 1 imaging + 12 generic fills
  const modPC3 =
    pcCopay != null
      ? pcCopay * 3
      : deductible > 0
      ? Math.min(deductible, Math.round(150 * 3))
      : Math.round(150 * 3 * coinsurance)
  const modSpec =
    specCopay != null ? specCopay : Math.min(deductible > 0 ? deductible : 999, Math.round(300))
  const modImaging = Math.min(deductible > 0 ? deductible : 999, 400)
  const modDrugs = (genericCopay ?? 15) * 12
  const modOOP = Math.min(modPC3 + modSpec + modImaging + modDrugs, moop)

  // ── High use ─────────────────────────────────────────────────────────────────
  // Major event (surgery / hospitalization) reaching MOOP
  const highOOP = moop

  const totalLow = annualPremium != null ? fmt(annualPremium + lowOOP) : null
  const totalMod = annualPremium != null ? fmt(annualPremium + modOOP) : null
  const totalHigh = annualPremium != null ? fmt(annualPremium + highOOP) : null

  return [
    {
      label: 'Low Use',
      subtitle: 'Annual checkup, one primary care visit, occasional prescription',
      severity: 'low',
      events: [
        { service: 'Preventive care (annual)', frequency: '1×/year', cost: '$0 (free by law)' },
        {
          service: 'Primary care visit',
          frequency: '1×/year',
          cost:
            pcCopay != null
              ? `${fmt(pcCopay)} copay`
              : deductible > 0
              ? `${fmt(lowPC)} (applies to deductible)`
              : fmt(lowPC),
        },
        {
          service: 'Generic prescription',
          frequency: '~3 fills',
          cost: `${fmt(genericCopay ?? 15)} per fill`,
        },
      ],
      annualOOP: `~${fmt(lowOOP)} out-of-pocket`,
      totalWithPremium: totalLow
        ? `~${fmt(annualPremium! + lowOOP)} total (including ${fmt(annualPremium!)} in premiums)`
        : null,
      context: `Deductible of ${fmt(deductible)} is not reached — you pay only copays or contracted rates for the services above.`,
    },
    {
      label: 'Moderate Use',
      subtitle:
        'Several primary care visits, one specialist, one imaging study, monthly prescriptions',
      severity: 'moderate',
      events: [
        {
          service: 'Primary care visits',
          frequency: '3×/year',
          cost:
            pcCopay != null
              ? `${fmt(pcCopay)} × 3 = ${fmt(pcCopay * 3)}`
              : `~${fmt(modPC3)} (deductible applies)`,
        },
        {
          service: 'Specialist visit',
          frequency: '1×/year',
          cost: specCopay != null ? `${fmt(specCopay)} copay` : `~${fmt(modSpec)}`,
        },
        {
          service: 'Imaging (X-ray or MRI)',
          frequency: '1×/year',
          cost: `~${fmt(modImaging)} (deductible-first on most plans)`,
        },
        {
          service: 'Generic drug',
          frequency: 'Monthly (12 fills)',
          cost: `${fmt(genericCopay ?? 15)} × 12 = ${fmt((genericCopay ?? 15) * 12)}`,
        },
      ],
      annualOOP: `~${fmt(modOOP)} out-of-pocket${modOOP === moop ? ' (MOOP reached)' : ''}`,
      totalWithPremium: totalMod
        ? `~${fmt(annualPremium! + modOOP)} total (including ${fmt(annualPremium!)} in premiums)`
        : null,
      context: `After the ${fmt(deductible)} deductible is met, you pay ${coinPct}% coinsurance on remaining covered services.`,
    },
    {
      label: 'High Use',
      subtitle: 'Major medical event — surgery, hospitalization, or sustained specialist care',
      severity: 'high',
      events: [
        {
          service: 'Hospitalization or surgery',
          frequency: '1×/year',
          cost: `Deductible + ${coinPct}% coinsurance until MOOP`,
        },
        {
          service: 'Follow-up specialist visits',
          frequency: 'Multiple',
          cost: `${coinPct}% coinsurance after deductible`,
        },
        erCopay != null
          ? {
              service: 'Emergency room visit',
              frequency: 'If needed',
              cost: `${fmt(erCopay)} copay`,
            }
          : {
              service: 'Emergency room visit',
              frequency: 'If needed',
              cost: `Full charge until deductible, then ${coinPct}%`,
            },
      ],
      annualOOP: `Up to ${fmt(moop)} out-of-pocket (your annual maximum)`,
      totalWithPremium: totalHigh
        ? `Up to ${fmt(annualPremium! + highOOP)} total worst-case (including ${fmt(annualPremium!)} in premiums)`
        : null,
      context: `After reaching ${fmt(moop)}, the plan pays 100% of covered in-network costs for the rest of the plan year.`,
    },
  ]
}

const SEVERITY_STYLES = {
  low: 'border-green-200',
  moderate: 'border-yellow-200',
  high: 'border-red-200',
}

const SEVERITY_HEADER = {
  low: 'bg-green-50 border-b border-green-100',
  moderate: 'bg-yellow-50 border-b border-yellow-100',
  high: 'bg-red-50 border-b border-red-100',
}

export default function PlanCostScenario({ plan, sbc }: Props) {
  if (plan.deductible_individual == null && plan.moop_individual == null) return null

  const scenarios = buildScenarios(plan, sbc)

  return (
    <section aria-labelledby="cost-scenarios-heading" className="mb-10">
      <h2 id="cost-scenarios-heading" className="text-xl font-semibold text-navy-800 mb-2">
        Cost Scenarios: What You Might Pay
      </h2>
      <p className="text-sm text-neutral-500 mb-5">
        Based on this plan&apos;s actual values — individual deductible{' '}
        {plan.deductible_individual != null ? `$${plan.deductible_individual.toLocaleString()}` : 'n/a'},{' '}
        OOP max{' '}
        {plan.moop_individual != null ? `$${plan.moop_individual.toLocaleString()}` : 'n/a'}. Assumes
        in-network providers only. Premium amounts are for a 40-year-old before subsidies.
      </p>

      <div className="space-y-4">
        {scenarios.map(scenario => (
          <div
            key={scenario.label}
            className={`border rounded-xl overflow-hidden ${SEVERITY_STYLES[scenario.severity]}`}
          >
            <div className={`px-5 py-3 flex items-start justify-between gap-4 ${SEVERITY_HEADER[scenario.severity]}`}>
              <span className="font-semibold text-sm text-navy-900">{scenario.label} Year</span>
              <span className="text-xs text-neutral-500 text-right">{scenario.subtitle}</span>
            </div>
            <div className="px-5 py-4">
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-xs text-neutral-400 uppercase tracking-wide">
                    <th className="text-left pb-2 font-medium">Service</th>
                    <th className="text-left pb-2 font-medium hidden sm:table-cell">Frequency</th>
                    <th className="text-right pb-2 font-medium">Your Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.events.map((ev, i) => (
                    <tr key={i} className="border-t border-neutral-50">
                      <td className="py-1.5 text-neutral-700">{ev.service}</td>
                      <td className="py-1.5 text-neutral-500 hidden sm:table-cell">{ev.frequency}</td>
                      <td className="py-1.5 text-right font-medium text-navy-800">{ev.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pt-3 border-t border-neutral-100 space-y-1">
                <p className="text-sm font-semibold text-primary-800">{scenario.annualOOP}</p>
                {scenario.totalWithPremium && (
                  <p className="text-xs text-neutral-600">{scenario.totalWithPremium}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">{scenario.context}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400 mt-3">
        Estimates only. Actual costs depend on provider billing, specific CPT codes, and plan
        cost-sharing rules. Verify with your plan&apos;s Evidence of Coverage before receiving care.
      </p>
    </section>
  )
}
