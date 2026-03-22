/** AeoBlock — AI Overview extraction target (V19 .aeo-block) */
export default function AeoBlock({
  label = 'Quick answer',
  answer,
  caveat,
}: {
  label?: string
  answer: string
  caveat: string
}) {
  return (
    <>
      <div className="border-l-4 border-blue-600 bg-white rounded-r-lg px-5 py-4 mb-1">
        <span className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">
          {label}
        </span>
        <div className="text-sm sm:text-base text-slate-800 leading-relaxed">
          {answer}
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-1 mb-5">{caveat}</p>
    </>
  )
}
