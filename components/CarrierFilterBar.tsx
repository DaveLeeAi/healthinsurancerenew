'use client'

// ---------------------------------------------------------------------------
// CarrierFilterBar — shared carrier filter tabs for all plan listing pages
// ---------------------------------------------------------------------------
//
// Usage:
//   <CarrierFilterBar
//     carriers={[{ name: 'Ambetter', count: 12 }, ...]}   // sorted A-Z by caller
//     selected="all"                                        // or carrier name
//     totalCount={43}                                       // total plans (all carriers)
//     onSelect={(name) => setCarrierFilter(name)}
//   />
//
// Renders "All (43) | Ambetter (12) | Blue Cross (8) | ..." pill tabs.
// When only one carrier is present the "All" + single-carrier tabs still render,
// giving the same consistent UI regardless of data shape.

interface Carrier {
  name: string
  count: number
}

interface Props {
  carriers: Carrier[]
  selected: string      // 'all' | carrier name
  totalCount: number    // count shown on the "All" tab
  onSelect: (name: string) => void
}

export default function CarrierFilterBar({ carriers, selected, totalCount, onSelect }: Props) {
  if (carriers.length === 0) return null

  const btnBase =
    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
  const btnActive = 'bg-primary-600 text-white'
  const btnInactive = 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Filter by carrier
      </p>
      <div role="tablist" aria-label="Filter by carrier" className="flex flex-wrap gap-2">
        {/* All tab */}
        <button
          role="tab"
          aria-selected={selected === 'all'}
          onClick={() => onSelect('all')}
          className={`${btnBase} ${selected === 'all' ? btnActive : btnInactive}`}
        >
          All ({totalCount})
        </button>

        {/* Per-carrier tabs */}
        {carriers.map((c) => (
          <button
            key={c.name}
            role="tab"
            aria-selected={selected === c.name}
            onClick={() => onSelect(c.name)}
            className={`${btnBase} ${selected === c.name ? btnActive : btnInactive}`}
          >
            {c.name} ({c.count})
          </button>
        ))}
      </div>
    </div>
  )
}
