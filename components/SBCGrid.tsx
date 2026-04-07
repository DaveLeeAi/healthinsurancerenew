import type { SbcRecord, CostSharingCategory, CostSharingEntry } from '@/lib/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  sbc: SbcRecord
}

// ─── Category config: display order, labels, tooltips ────────────────────────

interface CategoryMeta {
  key: CostSharingCategory
  label: string
  tooltip: string
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'primary_care',
    label: 'Primary Care Visit',
    tooltip: 'Office visit with your regular doctor for routine checkups, illness, or injury.',
  },
  {
    key: 'specialist',
    label: 'Specialist Visit',
    tooltip: 'Visit to a doctor who focuses on a specific area of medicine (cardiologist, dermatologist, etc.).',
  },
  {
    key: 'emergency_room',
    label: 'Emergency Room',
    tooltip: 'Care in a hospital emergency department. ER visits cost significantly more than urgent care.',
  },
  {
    key: 'mental_health',
    label: 'Mental Health / Behavioral',
    tooltip: 'Outpatient therapy, psychiatry, and substance use disorder treatment visits.',
  },
  {
    key: 'generic_drug',
    label: 'Generic Drugs',
    tooltip: 'Lower-cost medications that have the same active ingredients as brand-name drugs.',
  },
  {
    key: 'preferred_brand_drug',
    label: 'Preferred Brand Drugs',
    tooltip: 'Brand-name drugs on your plan\'s preferred list. Costs more than generic but less than non-preferred.',
  },
  {
    key: 'non_preferred_brand_drug',
    label: 'Non-Preferred Brand',
    tooltip: 'Brand-name drugs not on the preferred list. Typically the most expensive tier before specialty.',
  },
  {
    key: 'specialty_drug',
    label: 'Specialty Drugs',
    tooltip: 'High-cost drugs for complex conditions. Often require prior authorization.',
  },
  {
    key: 'lab_x_ray',
    label: 'Lab Work & Imaging',
    tooltip: 'Diagnostic tests including blood work, X-rays, MRIs, and CT scans.',
  },
  {
    key: 'inpatient_hospital',
    label: 'Inpatient Hospital Stay',
    tooltip: 'Overnight hospital admission. Cost shown is per day or per admission — check your plan document.',
  },
  {
    key: 'outpatient_facility',
    label: 'Outpatient Surgery',
    tooltip: 'Surgery or procedures at a hospital or ambulatory surgical center without an overnight stay.',
  },
  {
    key: 'prenatal_care',
    label: 'Prenatal / Postnatal Care',
    tooltip: 'Maternity care including prenatal visits, delivery, and postnatal follow-ups.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCopay(entry: CostSharingEntry | undefined): string {
  if (!entry) return 'Contact carrier'
  if (entry.copay_in_network != null) return `$${entry.copay_in_network}`
  if (entry.coinsurance_in_network != null) return `${(entry.coinsurance_in_network * 100).toFixed(0)}% coinsurance`
  return 'Contact carrier'
}

function formatCoinsurance(entry: CostSharingEntry | undefined): string {
  if (!entry) return '—'
  if (entry.coinsurance_in_network != null) return `${(entry.coinsurance_in_network * 100).toFixed(0)}%`
  if (entry.copay_in_network != null) return 'Copay only'
  return '—'
}

// ─── Tooltip component ──────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 cursor-help">
      <svg
        className="inline h-3.5 w-3.5 text-neutral-400 group-hover:text-primary-500 transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg bg-neutral-800 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}

// ─── Insurance term tooltips ────────────────────────────────────────────────

const TERM_TOOLTIPS: Record<string, string> = {
  copay: 'A fixed dollar amount you pay for a covered service at the time of your visit.',
  coinsurance: 'The percentage of costs you pay after meeting your deductible. Your plan pays the rest.',
  deductible: 'The amount you pay out of pocket before your insurance begins to cover costs.',
  'out-of-pocket maximum': 'The most you\'ll pay in a year. After reaching this, your plan pays 100% of covered services.',
}

export function TermTooltip({ term }: { term: string }) {
  const tip = TERM_TOOLTIPS[term.toLowerCase()]
  if (!tip) return <span className="font-medium">{term}</span>
  return (
    <span className="inline-flex items-center">
      <span className="font-medium">{term}</span>
      <Tooltip text={tip} />
    </span>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export default function SBCGrid({ sbc }: Props) {
  const grid = sbc.cost_sharing_grid

  return (
    <section aria-labelledby="sbc-grid-heading">
      <h2 id="sbc-grid-heading" className="text-xl font-semibold text-navy-800 mb-2">
        Cost-Sharing Summary
      </h2>
      <p className="text-sm text-neutral-500 mb-4">
        What you pay for covered in-network services. All costs shown are{' '}
        <TermTooltip term="copay" /> or{' '}
        <TermTooltip term="coinsurance" /> amounts after any applicable{' '}
        <TermTooltip term="deductible" />.
      </p>

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="px-4 py-3 text-left font-semibold text-neutral-600 w-[45%]">
                Service
              </th>
              <th className="px-4 py-3 text-left font-semibold text-neutral-600">
                What You Pay
                <Tooltip text="Your share of the cost when using an in-network provider. Subject to deductible unless noted." />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-neutral-600">
                Coinsurance Rate
                <Tooltip text="Percentage you owe after deductible. 0% means the plan pays everything; 20% means you pay 20%." />
              </th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat, idx) => {
              const entry = grid[cat.key]
              return (
                <tr
                  key={cat.key}
                  className={`border-t border-neutral-100 ${idx % 2 === 1 ? 'bg-neutral-50/50' : ''}`}
                >
                  <td className="px-4 py-3 text-neutral-700">
                    {cat.label}
                    <Tooltip text={cat.tooltip} />
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-800">
                    {formatCopay(entry)}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-600">
                    {formatCoinsurance(entry)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-400 mt-3">
        Costs shown are for in-network providers. Out-of-network costs are typically higher.
        Preventive care is covered at $0 under all ACA plans.
        Source: federal plan benefit documents.
      </p>
    </section>
  )
}
