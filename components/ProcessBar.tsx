/** ProcessBar — trust/credential strip below header (V19 .pbar) */
export default function ProcessBar({ items }: { items: string[] }) {
  return (
    <div
      role="complementary"
      aria-label="Page trust information"
      className="bg-slate-900 text-white py-2.5 px-4"
    >
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs sm:text-sm">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
