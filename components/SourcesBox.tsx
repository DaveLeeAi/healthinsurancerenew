interface Source {
  title: string
  url: string
}

export default function SourcesBox({ sources }: { sources: Source[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 my-6">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Sources</p>
      <ul className="space-y-1">
        {sources.map((source, i) => (
          <li key={i}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              {source.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
