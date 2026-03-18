/**
 * PlanNetworkInsight — Network type implications.
 *
 * Varies by plan_type: HMO / PPO / EPO / POS / Indemnity.
 * Returns null for unrecognized plan types rather than generic filler.
 */

import type { PlanRecord } from '@/lib/types'

interface Props {
  plan: PlanRecord
}

interface NetworkContent {
  headline: string
  description: string
  keyPoints: string[]
  oonWarning: string | null
}

function getNetworkContent(plan: PlanRecord): NetworkContent | null {
  const planType = (plan.plan_type ?? '').toUpperCase().trim()

  if (planType === 'HMO') {
    return {
      headline: 'HMO Network: Primary Care Coordination Required',
      description: `This is a Health Maintenance Organization (HMO) plan. HMOs typically offer lower premiums and copays in exchange for a more structured network — you must work within the plan's defined provider network for covered care.`,
      keyPoints: [
        'You must choose a primary care physician (PCP) who acts as the coordinator for all your care.',
        'Specialist visits require a referral from your PCP — self-referrals are generally not covered.',
        'Out-of-network care is not covered except in a genuine emergency.',
        'Emergency care is covered nationwide at in-network cost-sharing rates regardless of provider.',
        'Lab work, imaging, and procedures ordered by your PCP must typically use in-network facilities.',
      ],
      oonWarning:
        'If you have established relationships with out-of-network specialists, verify those providers participate in this HMO network before enrolling. Switching mid-year requires a qualifying life event.',
    }
  }

  if (planType === 'PPO') {
    return {
      headline: 'PPO Network: Flexible Provider Access at Higher Premium',
      description: `This is a Preferred Provider Organization (PPO) plan. PPOs provide the broadest provider flexibility available in ACA-compliant plans — you can see any provider without a referral, including out-of-network providers.`,
      keyPoints: [
        'No primary care physician (PCP) requirement — you access care directly.',
        'No referrals needed for specialist visits, including out-of-network specialists.',
        'Out-of-network care is covered, but at a higher cost-sharing rate (higher deductible, higher coinsurance).',
        'In-network (preferred) providers offer the lowest cost-sharing as shown in the grid above.',
        'Out-of-network balances may apply — providers can bill amounts above the plan\'s allowed fee.',
      ],
      oonWarning:
        "Out-of-network cost-sharing is substantially higher than in-network. The plan's cost-sharing grid shows both rates. Review your out-of-network deductible and coinsurance before using non-preferred providers.",
    }
  }

  if (planType === 'EPO') {
    return {
      headline: 'EPO Network: No Referrals, No Out-of-Network Coverage',
      description: `This is an Exclusive Provider Organization (EPO) plan — a hybrid structure combining the flexibility of a PPO (no PCP or referral requirement) with the network exclusivity of an HMO (no out-of-network coverage).`,
      keyPoints: [
        'No primary care physician (PCP) requirement.',
        'No referrals needed — you can schedule specialists directly within the EPO network.',
        'Out-of-network care is not covered except in a genuine medical emergency.',
        'Emergency care is covered nationwide at in-network cost-sharing rates.',
        'The EPO network may be narrower than a PPO — verify your specific providers are in-network.',
      ],
      oonWarning:
        'EPOs have strict out-of-network exclusions. If a hospital or specialist you rely on is outside the EPO network, you will bear the full cost. Always verify the network directory before using a new provider.',
    }
  }

  if (planType === 'POS') {
    return {
      headline: 'POS Network: Hybrid Referral System with Out-of-Network Option',
      description: `This is a Point of Service (POS) plan — a hybrid that combines the PCP coordination structure of an HMO with limited out-of-network flexibility similar to a PPO.`,
      keyPoints: [
        'A primary care physician (PCP) is required — you choose one from the plan network.',
        'In-network specialist visits require a referral from your PCP.',
        'Out-of-network care is covered at a higher cost-sharing rate, similar to a PPO.',
        'Using out-of-network providers without a referral typically results in the highest out-of-pocket cost.',
        'Emergency care is covered nationwide regardless of referral status.',
      ],
      oonWarning:
        'Out-of-network access exists but triggers significantly higher cost-sharing and may require a referral. Confirm the POS rules with the carrier before seeking non-emergency out-of-network care.',
    }
  }

  if (planType === 'INDEMNITY') {
    return {
      headline: 'Indemnity Plan: Fee-for-Service, Maximum Provider Flexibility',
      description: `This is an Indemnity (fee-for-service) plan, which offers the greatest provider flexibility of all plan types. You may see any licensed provider without network restrictions or referrals.`,
      keyPoints: [
        'No network restrictions — see any provider you choose.',
        'No PCP requirement, no referrals.',
        'You pay the provider directly and submit claims for reimbursement at the plan\'s allowed rate.',
        'Costs may be higher than network plans if providers charge above the plan\'s fee schedule.',
      ],
      oonWarning: null,
    }
  }

  return null
}

export default function PlanNetworkInsight({ plan }: Props) {
  const content = getNetworkContent(plan)
  if (!content) return null

  return (
    <section aria-labelledby="network-insight-heading" className="mb-10">
      <h2 id="network-insight-heading" className="text-xl font-semibold text-navy-800 mb-2">
        {content.headline}
      </h2>
      <p className="text-sm text-neutral-600 mb-4 leading-relaxed">{content.description}</p>

      <ul className="space-y-2 mb-4">
        {content.keyPoints.map((point, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-neutral-600 leading-relaxed">
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0"
              aria-hidden="true"
            />
            {point}
          </li>
        ))}
      </ul>

      {content.oonWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
            Provider Access Note
          </p>
          <p className="text-sm text-amber-800 leading-relaxed">{content.oonWarning}</p>
        </div>
      )}
    </section>
  )
}
