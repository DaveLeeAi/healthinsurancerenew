import Link from 'next/link'
import { CTA_CONFIG, CTA_VARIANTS } from '@/lib/cta-config'
import type { CTAConfig, CTAVariantKey } from '@/lib/cta-config'

interface GlobalCTAProps {
  variant?: CTAVariantKey
  override?: Partial<CTAConfig>
  href?: string
}

/** GlobalCTA — V19 .cta-bottom: dark ink bg, Lora serif title, white button. */
export default function GlobalCTA({
  variant,
  override,
  href = '/contact',
}: GlobalCTAProps) {
  const base = variant ? CTA_VARIANTS[variant] : CTA_CONFIG
  const config: CTAConfig = { ...base, ...override }

  return (
    <section
      aria-labelledby="global-cta-heading"
      className="flex items-center justify-between flex-wrap"
      style={{ background: '#0d1b2a', borderRadius: '16px', padding: '28px 32px', gap: '18px', marginTop: '36px' }}
    >
      <div>
        <h2
          id="global-cta-heading"
          className="font-heading text-white font-medium"
          style={{ fontSize: '21px', lineHeight: 1.2, marginBottom: '4px' }}
        >
          {config.headline}
        </h2>
        <p style={{ fontSize: '13px', color: '#7fb3e0' }}>
          {config.body}
        </p>
      </div>
      <Link
        href={href}
        className="inline-block shrink-0 bg-white text-ink font-medium hover:opacity-90 transition-opacity"
        style={{ borderRadius: '6px', padding: '12px 26px', fontSize: '14px', textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        {config.buttonText} &rarr;
      </Link>
    </section>
  )
}
