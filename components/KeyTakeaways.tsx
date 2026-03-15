export default function KeyTakeaways({ items }: { items: string[] }) {
  return (
    <div className="bg-secondary-50/60 backdrop-blur-sm border border-secondary-200/60 rounded-2xl p-5 my-6">
      <p className="text-xs font-semibold text-secondary-700 uppercase tracking-wider mb-3">Key Takeaways</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-neutral-700">
            <svg className="w-5 h-5 text-secondary-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-serif">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
