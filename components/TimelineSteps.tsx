/** TimelineSteps — numbered step sequence (V19 .tl-item) */

interface Step {
  title: string
  desc: string
  time: string
}

export default function TimelineSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="space-y-4">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex-none w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
            {i + 1}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{s.title}</p>
            <p className="text-sm text-slate-600 leading-relaxed mt-0.5">{s.desc}</p>
            <p className="text-xs text-slate-400 mt-1">{s.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
