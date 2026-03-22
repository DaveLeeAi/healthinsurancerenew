export default function AnswerBox({ answer }: { answer: string }) {
  return (
    <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 my-6">
      <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1.5">Quick answer</p>
      <p className="text-slate-800 leading-relaxed font-serif">{answer}</p>
    </div>
  )
}
