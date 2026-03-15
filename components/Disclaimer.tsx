export default function Disclaimer({ variant = 'general' }: { variant?: 'tool' | 'general' }) {
  if (variant === 'tool') {
    return (
      <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/80 rounded-2xl p-4 my-6">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>Educational tool only.</strong> This calculator provides general educational estimates and is not a guarantee of eligibility, savings, or costs. Actual amounts depend on many factors including your specific location, plan availability, and household circumstances. This is not tax, legal, or benefits advice. Consult a licensed professional for guidance specific to your situation.
        </p>
      </div>
    )
  }
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-neutral-200/80 rounded-2xl p-4 my-6">
      <p className="text-sm text-neutral-600 leading-relaxed">
        This website is not affiliated with the federal government or any state health insurance exchange. Information provided is for educational purposes only and does not constitute legal, tax, or benefits advice.
      </p>
    </div>
  )
}
