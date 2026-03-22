/** AboutBlock — V19 .about-block: surface bg, 1px border, 13px muted text, green dot before reviewed line */

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
    <div className="bg-surface border border-rule rounded-[10px]" style={{ padding: '18px 20px' }}>
      <p className="text-mid" style={{ fontSize: '13px', lineHeight: 1.7 }}>
        {text}
      </p>

      {/* Reviewed line with green dot */}
      <div
        className="flex items-start text-muted border-t border-rule"
        style={{ gap: '7px', fontSize: '12px', lineHeight: 1.55, marginTop: '12px', paddingTop: '12px' }}
      >
        <span
          className="rounded-full shrink-0"
          style={{ width: 6, height: 6, background: '#4ade80', marginTop: '3px' }}
          aria-hidden="true"
        />
        {reviewedLine}
      </div>

      {/* Links */}
      {links.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: '16px', marginTop: '10px' }}>
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              className="text-vblue hover:underline"
              style={{ fontSize: '12px' }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
