/**
 * PlanFAQ — Plan-specific FAQ (4–6 questions).
 *
 * Content varies based on plan attributes:
 *   - Metal tier (Bronze/Silver/Gold/Catastrophic get unique Q1)
 *   - Silver → CSR eligibility question
 *   - HMO → referral question
 *   - High-deductible Bronze → HSA question
 *   - SBC data available → drug copay question
 *
 * FAQ items are also exported for use in FAQPage schema injection.
 */

import type { PlanRecord, SbcRecord } from '@/lib/types'

export interface FAQItem {
  question: string
  answer: string
}

interface Props {
  plan: PlanRecord
  sbc: SbcRecord | null
  countyDisplay: string
  planYear: number
}

function fmt(n: number | undefined | null): string {
  if (n == null) return 'the amount listed in plan documents'
  return `$${n.toLocaleString()}`
}

function normalizeMetalLevel(level: string): string {
  return level.toLowerCase().replace(/\s+/g, '_')
}

/**
 * Exported builder — used by both PlanFAQ component and page-level FAQPage schema.
 */
export function buildPlanFAQItems(
  plan: PlanRecord,
  sbc: SbcRecord | null,
  countyDisplay: string,
  planYear: number,
): FAQItem[] {
  const metal = normalizeMetalLevel(plan.metal_level)
  const metalDisplay = plan.metal_level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const deductible = plan.deductible_individual
  const moop = plan.moop_individual
  const isSilver = metal === 'silver'
  const isHMO = plan.plan_type === 'HMO'
  const isHighDeductibleBronze =
    (metal === 'bronze' || metal === 'expanded_bronze') && (deductible ?? 0) >= 3000

  const faqs: FAQItem[] = []

  // Q1: Is this plan a good fit? (varies completely by metal tier)
  if (metal === 'bronze' || metal === 'expanded_bronze') {
    faqs.push({
      question: `Is this ${metalDisplay} plan a good choice for ${planYear}?`,
      answer: `${plan.plan_name} is best suited for enrollees who expect minimal healthcare use and want to keep monthly premiums as low as possible. With a ${fmt(deductible)} individual deductible, you pay out-of-pocket for most services until that threshold is met each plan year. Preventive care is always free under federal rules. If you expect regular doctor visits, ongoing prescriptions, or specialist care, a Silver or Gold plan may cost less over the full year once out-of-pocket costs are added to premiums.`,
    })
  } else if (isSilver) {
    faqs.push({
      question: `Is this Silver plan a good choice for ${planYear}?`,
      answer: `Silver plans are the most selected tier on the Marketplace because they balance monthly premiums with cost-sharing — and are the only tier eligible for Cost Sharing Reductions (CSRs). If your household income falls between 100% and 250% of the Federal Poverty Level, enrolling in a Silver plan automatically activates CSR benefits that can substantially reduce the ${fmt(deductible)} deductible and ${fmt(moop)} out-of-pocket maximum at no additional premium. If you don't qualify for CSRs, compare this plan against Gold alternatives to find the lower total annual cost for your expected usage.`,
    })
  } else if (metal === 'gold') {
    faqs.push({
      question: `Is this Gold plan worth the higher monthly premium?`,
      answer: `${plan.plan_name} charges a higher monthly premium than Bronze or Silver options but lowers your costs when care is received. With a ${fmt(deductible)} individual deductible, cost-sharing begins sooner. The break-even calculation: if your out-of-pocket costs on a lower-tier plan would exceed the premium difference, this Gold plan reduces your total annual spend. This plan is most cost-effective for enrollees who regularly see specialists, fill multiple prescriptions, or have a planned medical procedure in ${planYear}. Note that Gold plans are not eligible for CSRs.`,
    })
  } else if (metal === 'platinum') {
    faqs.push({
      question: `Who should consider this Platinum plan?`,
      answer: `Platinum plans are best for enrollees with high ongoing medical expenses who want maximum predictability. Covering approximately 90% of expected costs, this plan offers the lowest deductibles and copays — in exchange for the highest monthly premium. The ${fmt(moop)} out-of-pocket maximum is your annual exposure ceiling for in-network care. Platinum is cost-effective when your expected medical spending is consistently high; it rarely makes financial sense for low-use enrollees.`,
    })
  } else if (metal === 'catastrophic') {
    faqs.push({
      question: `Who qualifies for this Catastrophic plan?`,
      answer: `Catastrophic plans are available only to individuals under 30 years old, or those holding a hardship exemption or affordability exemption (when the lowest available Bronze plan exceeds a set percentage of income). These plans cannot typically be purchased with Advance Premium Tax Credits. The ${fmt(deductible)} deductible applies to virtually all covered services except preventive care and three primary care visits per year. This plan is designed as catastrophic financial protection, not routine coverage.`,
    })
  } else {
    faqs.push({
      question: `Who is this ${metalDisplay} plan best suited for?`,
      answer: `This ${metalDisplay} plan from ${plan.issuer_name} has a ${fmt(deductible)} individual deductible and a ${fmt(moop)} out-of-pocket maximum. Review the metal tier section and cost scenarios above in relation to your expected healthcare usage for ${planYear} to determine whether this plan fits your needs.`,
    })
  }

  // Q2: How does the deductible work?
  faqs.push({
    question: `How does the ${fmt(deductible)} deductible work on this plan?`,
    answer: `The individual deductible is the amount you pay out of pocket for most covered services before this plan begins sharing costs. It resets each January 1 (plan year start). ACA-mandated preventive services — annual physicals, immunizations, cancer screenings, contraception — are covered at $0 regardless of deductible status, as required by 45 CFR § 147.130. For other services such as specialist visits, diagnostic imaging, and most prescription drugs, you pay the contracted rate until the ${fmt(deductible)} threshold is met. After that, you pay your plan's coinsurance percentage until reaching the out-of-pocket maximum.`,
  })

  // Q3: Maximum possible cost
  faqs.push({
    question: `What is the most I could pay in a single year with this plan?`,
    answer: `For in-network covered care, your maximum out-of-pocket exposure is ${fmt(moop)} per individual per plan year. Once you reach this limit, the plan pays 100% of covered in-network costs for the rest of the year. This cap does not apply to out-of-network services on plans that restrict out-of-network coverage (HMOs, EPOs). Adding your annual premium to the out-of-pocket maximum gives your total worst-case annual cost for in-network care: ${
      plan.premiums?.age_40 != null && moop != null
        ? `approximately $${((plan.premiums.age_40 * 12) + moop).toLocaleString()} for a 40-year-old before subsidies`
        : 'premiums plus ' + fmt(moop)
    }.`,
  })

  // Q4: CSR eligibility (Silver only)
  if (isSilver) {
    faqs.push({
      question: `Do I qualify for Cost Sharing Reductions (CSRs) on this Silver plan?`,
      answer: `CSRs are available to Marketplace enrollees with household income between 100% and 250% of the Federal Poverty Level who select a Silver plan. If you qualify, you receive an enhanced version of this plan — the same name and premium, but with a lower deductible, lower copays, and a lower out-of-pocket maximum. At 200% FPL, the deductible on an enhanced Silver plan can be half or less of the standard version. You must select a Silver plan at enrollment; CSR benefits cannot be applied retroactively or added later. Check eligibility at HealthCare.gov using the plan finder tool.`,
    })
  }

  // Q5: HMO referral question
  if (isHMO) {
    faqs.push({
      question: `Do I need a referral to see a specialist on this HMO plan?`,
      answer: `Yes. As an HMO, ${plan.plan_name} requires you to designate a primary care physician (PCP) who coordinates your care. To see a specialist in-network, you will generally need a referral from your PCP. Visiting a specialist without a referral is typically not covered. The exception: emergency care is covered nationwide at in-network cost-sharing rates regardless of referral status. If you currently have an ongoing relationship with any specialist, verify they participate in this HMO network before enrolling.`,
    })
  }

  // Q6: HSA question for high-deductible bronze
  if (isHighDeductibleBronze) {
    faqs.push({
      question: `Can I contribute to a Health Savings Account (HSA) with this plan?`,
      answer: `This plan may qualify as a High Deductible Health Plan (HDHP) under IRS criteria, which would make you eligible to contribute to an HSA. For ${planYear}, HSA contribution limits are $4,150 for self-only coverage and $8,300 for family coverage (IRS Rev. Proc. 2023-23). Contributions are pre-tax, growth is tax-free, and withdrawals for qualified medical expenses are tax-free — a triple tax benefit. Not all high-deductible plans meet every HDHP requirement (specific deductible and out-of-pocket maximum thresholds apply). Verify HDHP status with ${plan.issuer_name} before establishing an HSA.`,
    })
  }

  // Q7: Generic drug cost (if SBC data available)
  const genericEntry = sbc?.cost_sharing_grid?.generic_drug
  if (genericEntry?.copay_in_network != null && faqs.length < 6) {
    const copay = genericEntry.copay_in_network
    faqs.push({
      question: `How much does a generic prescription cost on this plan?`,
      answer: `Based on CMS Benefits and Cost Sharing PUF data, this plan charges ${copay === 0 ? '$0 (no cost)' : `$${copay}`} per fill for generic drugs${deductible && deductible > 0 ? ' — confirm whether this copay applies before or after the deductible' : ''}. Preferred brand-name drugs and specialty drugs carry higher cost-sharing as shown in the cost-sharing grid above. Always verify current formulary placement and cost-sharing directly with ${plan.issuer_name}, as carriers can update formularies during the plan year.`,
    })
  }

  return faqs.slice(0, 6)
}

export default function PlanFAQ({ plan, sbc, countyDisplay, planYear }: Props) {
  const faqs = buildPlanFAQItems(plan, sbc, countyDisplay, planYear)

  if (faqs.length === 0) return null

  return (
    <section aria-labelledby="plan-faq-heading" className="mb-10">
      <h2 id="plan-faq-heading" className="text-xl font-semibold text-navy-800 mb-4">
        Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group border border-neutral-200 rounded-xl overflow-hidden"
          >
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors list-none">
              <span className="font-medium text-navy-800 text-sm pr-4">{faq.question}</span>
              <svg
                className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>
            <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">{faq.answer}</div>
          </details>
        ))}
      </div>
    </section>
  )
}
