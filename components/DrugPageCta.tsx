import Link from 'next/link'
import config from '@/data/config/config.json'
import { stateCodeToSlug } from '@/lib/county-lookup'
import { CTA_CONFIG } from '@/lib/cta-config'

const LICENSED_ABBRS = new Set(
  (config.licensedStates as { abbr: string }[]).map((s) => s.abbr.toUpperCase())
)

type Variant = 'hero' | 'mid' | 'bottom'

interface DrugPageCtaProps {
  variant: Variant
  drugName: string
  stateCode?: string
  stateName?: string
  costRange?: string
}

function isLicensedState(abbr?: string): boolean {
  if (!abbr) return false
  return LICENSED_ABBRS.has(abbr.toUpperCase())
}

function getCtaHref(stateCode?: string): string {
  if (stateCode) {
    return `/${stateCodeToSlug(stateCode.toUpperCase())}/health-insurance-plans`
  }
  return '/plans'
}

/** DrugPageCta — V19 green/mid/bottom CTA variants for drug pages. */
export default function DrugPageCta({
  variant,
  drugName,
  stateCode,
  stateName,
  costRange,
}: DrugPageCtaProps) {
  const licensed = isLicensedState(stateCode)
  const href = getCtaHref(stateCode)
  const stateLabel = stateName ?? stateCode?.toUpperCase()

  /* ── Hero: green bg, white button (V19 .cta-primary) ── */
  if (variant === 'hero') {
    return (
      <section
        className="flex items-center justify-between flex-wrap"
        style={{ background: '#0b6e4a', borderRadius: '10px', padding: '15px 20px', gap: '14px', marginTop: '14px' }}
      >
        <div>
          <p className="text-white font-medium" style={{ fontSize: '15px', lineHeight: 1.3 }}>
            Need help choosing a plan that covers this medication?
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
            Compare plans covering {drugName}{stateLabel ? ` in ${stateLabel}` : ''}
          </p>
        </div>
        <Link
          href={href}
          className="inline-block shrink-0 bg-white font-medium hover:opacity-90 transition-opacity"
          style={{ color: '#0b6e4a', borderRadius: '6px', padding: '9px 22px', fontSize: '13.5px', textDecoration: 'none' }}
        >
          {stateLabel ? `Check Plans in ${stateLabel}` : 'Check Plans'} &rarr;
        </Link>
      </section>
    )
  }

  /* ── Mid: white bg, left blue border (V19 .cta-mid) ── */
  if (variant === 'mid') {
    return (
      <section
        className="bg-white border border-rule flex items-center justify-between flex-wrap"
        style={{ borderLeft: '3px solid #1a56a0', borderRadius: '0 8px 8px 0', padding: '14px 18px', gap: '14px' }}
      >
        <div>
          <p className="text-ink font-medium" style={{ fontSize: '14px' }}>
            Not sure which plan is best for your prescriptions?
          </p>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
            {licensed
              ? CTA_CONFIG.body
              : 'Compare marketplace plans to find coverage that includes your medications at the lowest cost.'}
          </p>
          {costRange && stateLabel && (
            <p className="text-vblue" style={{ fontSize: '12px', marginTop: '4px' }}>
              Plans covering {drugName}{stateLabel ? ` in ${stateLabel}` : ''} typically
              cost {costRange} per month.
            </p>
          )}
        </div>
        <Link
          href={href}
          className="inline-block shrink-0 bg-vblue text-white font-medium hover:bg-ink transition-colors"
          style={{ borderRadius: '6px', padding: '9px 20px', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          See Plans That Cover {drugName} &rarr;
        </Link>
      </section>
    )
  }

  /* ── Bottom: dark ink bg, Lora serif title (V19 .cta-bottom) ── */
  return (
    <section
      className="flex items-center justify-between flex-wrap"
      style={{ background: '#0d1b2a', borderRadius: '16px', padding: '28px 32px', gap: '18px', marginTop: '36px' }}
    >
      <div>
        <p
          className="font-heading text-white font-medium"
          style={{ fontSize: '21px', lineHeight: 1.2, marginBottom: '4px' }}
        >
          Still have questions about your coverage?
        </p>
        <p style={{ fontSize: '13px', color: '#7fb3e0' }}>
          Get personalized help with your health plan options
        </p>
      </div>
      <Link
        href={licensed ? '/contact' : href}
        className="inline-block shrink-0 bg-white text-ink font-medium hover:opacity-90 transition-opacity"
        style={{ borderRadius: '6px', padding: '12px 26px', fontSize: '14px', textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        {licensed ? CTA_CONFIG.buttonText : 'Get Help'} &rarr;
      </Link>
    </section>
  )
}
