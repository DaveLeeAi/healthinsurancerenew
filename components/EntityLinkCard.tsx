import type { EntityLink } from '@/lib/entity-linker'

// ─── Type badge config ────────────────────────────────────────────────────────

const TYPE_META: Record<
  EntityLink['type'],
  { label: string; bg: string; text: string; dot: string }
> = {
  plan:              { label: 'Plans',        bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-400' },
  subsidy:           { label: 'Subsidy',      bg: 'bg-green-50',    text: 'text-green-700',   dot: 'bg-green-400' },
  rate:              { label: 'Rates',        bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-400' },
  sbc:               { label: 'SBC',          bg: 'bg-indigo-50',   text: 'text-indigo-700',  dot: 'bg-indigo-400' },
  formulary:         { label: 'Formulary',    bg: 'bg-purple-50',   text: 'text-purple-700',  dot: 'bg-purple-400' },
  dental:            { label: 'Dental',       bg: 'bg-teal-50',     text: 'text-teal-700',    dot: 'bg-teal-400' },
  billing:           { label: 'Billing',      bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-400' },
  faq:               { label: 'FAQ',          bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
  'life-event':      { label: 'Life Event',   bg: 'bg-yellow-50',   text: 'text-yellow-700',  dot: 'bg-yellow-400' },
  'policy-scenario': { label: 'Policy',       bg: 'bg-rose-50',     text: 'text-rose-700',    dot: 'bg-rose-400' },
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  links: EntityLink[]
  title?: string
  /**
   * 'sidebar' — vertical list for a right rail or sticky aside (default)
   * 'bottom'  — 2-column responsive grid placed after main content
   */
  variant?: 'sidebar' | 'bottom'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: EntityLink['type'] }) {
  const meta = TYPE_META[type]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.bg} ${meta.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

function LinkItem({ link }: { link: EntityLink }) {
  return (
    <li className="group">
      <a
        href={link.href}
        className="flex flex-col gap-1.5 rounded-lg p-2 transition-colors hover:bg-neutral-50"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-primary-700 group-hover:text-primary-900 leading-snug">
            {link.label}
          </span>
          {/* Subtle high-relevance indicator: filled dot on scores ≥ 85 */}
          {link.relevanceScore >= 85 && (
            <span
              className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-primary-300"
              aria-hidden="true"
            />
          )}
        </span>
        <TypeBadge type={link.type} />
      </a>
    </li>
  )
}

// ─── EntityLinkCard ───────────────────────────────────────────────────────────

export default function EntityLinkCard({
  links,
  title = 'Related Pages',
  variant = 'sidebar',
}: Props) {
  if (links.length === 0) return null

  if (variant === 'bottom') {
    return (
      <section aria-label={title} className="border-t border-neutral-200 pt-8 mt-10">
        <h2 className="text-base font-semibold text-neutral-700 mb-4">{title}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {links.map((link) => (
            <LinkItem key={link.href} link={link} />
          ))}
        </ul>
      </section>
    )
  }

  return (
    <aside aria-label={title} className="border border-neutral-200 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
        {title}
      </h3>
      <ul className="space-y-0.5">
        {links.map((link) => (
          <LinkItem key={link.href} link={link} />
        ))}
      </ul>
    </aside>
  )
}
