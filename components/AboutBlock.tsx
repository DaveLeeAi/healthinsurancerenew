/** AboutBlock — data methodology + trust signals (V19 .about-block) */

interface AboutLink {
  href: string
  label: string
}

export interface AboutBlockProps {
  text: string
  reviewedLine: string
  links: AboutLink[]
}

export default function AboutBlock({ text, reviewedLine, links }: AboutBlockProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
      <p className="text-sm text-slate-700 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
        {reviewedLine}
      </p>
      {links.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-1">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              className="text-sm text-blue-700 hover:underline font-medium"
            >
              {link.label} &rarr;
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
