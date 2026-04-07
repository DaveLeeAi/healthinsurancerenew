import type { FormularyDrug } from '@/lib/types'

interface Props {
  drugs: FormularyDrug[]
  drugName: string
}

export default function DrugLookup({ drugs, drugName }: Props) {
  if (drugs.length === 0) {
    return (
      <p className="text-neutral-500">
        No formulary data found for <strong>{drugName}</strong>. The full formulary database may not be loaded.
      </p>
    )
  }

  return (
    <div>
      <p className="text-neutral-500 mb-4">{drugs.length} coverage entries found</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-navy-50 text-left">
            <th className="px-4 py-2 font-semibold text-navy-700">Drug</th>
            <th className="px-4 py-2 font-semibold text-navy-700">Issuer ID</th>
            <th className="px-4 py-2 font-semibold text-navy-700">Plan Year</th>
            <th className="px-4 py-2 font-semibold text-navy-700">Tier</th>
            <th className="px-4 py-2 font-semibold text-navy-700">PA</th>
            <th className="px-4 py-2 font-semibold text-navy-700">QL</th>
          </tr>
        </thead>
        <tbody>
          {drugs.map((d, i) => (
            <tr key={i} className="border-t border-neutral-100 hover:bg-neutral-50">
              <td className="px-4 py-2">{d.drug_name}</td>
              <td className="px-4 py-2 text-neutral-500">{d.issuer_ids?.[0] ?? d.issuer_id ?? '—'}</td>
              <td className="px-4 py-2">{d.plan_year ?? '—'}</td>
              <td className="px-4 py-2">
                <span className="px-2 py-0.5 rounded-full text-xs bg-federal-100 text-federal-700">
                  {d.drug_tier ?? '—'}
                </span>
              </td>
              <td className="px-4 py-2">{d.prior_authorization ? 'Yes' : 'No'}</td>
              <td className="px-4 py-2">{d.quantity_limit ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-neutral-400 mt-3">
        Source: federal marketplace data · Prior Auth = PA · Quantity Limit = QL · Consult your plan for current coverage
      </p>
    </div>
  )
}
