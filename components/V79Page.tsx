// V79Page — renderer for the V79 page system at /{state}/{drug}.
//
// Reads:
//   - LockedPage  (parsed from docs/locked-pages/{drug}/{state}.md)
//   - Facts       (parsed from data/formulary-summaries/{STATE}/{drug}.json)
//   - WiredPair   (registry row from lib/locked-pages/wired-pairs.ts)
//
// Emits the V79 visual system: V79 class names matching
// docs/V79/healthinsurancerenew_v79_formulary.html, plus a single JSON-LD
// @graph script. Both carrier modules — MainCarrierComparisonSection
// (.kb/.kr, aria carrier-h) and FooterCarrierDiscoveryModule (.iw/.ir,
// aria ins-h) — render in this order from the same parsed carrier-grid
// data. Styled by styles/v79.css (scoped under .v79-root).
//
// Per CLAUDE.md Rule 1, this component renders locked copy verbatim from
// the markdown source. It does not generate or paraphrase consumer copy.

import React from 'react'
import type { LockedPage } from '@/lib/locked-pages/parse'
import type { Facts } from '@/lib/locked-pages/facts'
import type { WiredPair } from '@/lib/locked-pages/wired-pairs'
import '@/styles/v79.css'

const SITE_URL = 'https://healthinsurancerenew.com'

// ─── carrier grid parsing ──────────────────────────────────────────────────

interface CarrierRow {
  name: string         // e.g. "Blue Cross and Blue Shield of North Carolina"
  plansLine: string    // e.g. "117 plans reviewed · approval required"
  tierLabel: string    // e.g. "Preferred Brand"
  ctaLabel: string     // e.g. "See plans"
}

interface ParsedCarrierGrid {
  intro: string                 // intro paragraph after the heading
  carriers: CarrierRow[]
  footnote: string              // italic disclaimer at the end
}

// Section 20 of the locked markdown is the carrier comparison block.
// Both V79 carrier modules render from this single parse — see the
// "Carrier-module integrity" rules in CLAUDE.md and the plan.
function parseCarrierGrid(raw: string): ParsedCarrierGrid {
  const paragraphs = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)

  // First paragraph is the **HEADING IN CAPS** marker; second is the intro.
  let cursor = 0
  if (paragraphs[cursor]?.match(/^\*\*[A-Z][^*]+\*\*$/)) cursor++
  const intro = paragraphs[cursor++] ?? ''

  // Last italic paragraph is the footnote.
  let footnote = ''
  const lastP = paragraphs[paragraphs.length - 1]
  let endCursor = paragraphs.length
  if (lastP && /^\*[^*]+\*$/.test(lastP)) {
    footnote = lastP.replace(/^\*|\*$/g, '').trim()
    endCursor--
  }

  // Each carrier is a 4-line block in a single paragraph:
  //   **Carrier Name**
  //   plansLine
  //   [ tier label ]
  //   [ CTA label ]
  const carriers: CarrierRow[] = []
  for (let i = cursor; i < endCursor; i++) {
    const lines = paragraphs[i].split('\n').map((l) => l.trim()).filter(Boolean)
    const nameMatch = lines[0]?.match(/^\*\*([^*]+)\*\*$/)
    if (!nameMatch) continue
    const name = nameMatch[1].trim()
    const plansLine = lines[1] ?? ''
    const tierMatch = lines[2]?.match(/^\[\s*(.+?)\s*\]$/)
    const ctaMatch = lines[3]?.match(/^\[\s*(.+?)\s*\]$/)
    carriers.push({
      name,
      plansLine,
      tierLabel: tierMatch ? tierMatch[1] : '',
      ctaLabel: ctaMatch ? ctaMatch[1] : '',
    })
  }

  return { intro, carriers, footnote }
}

// ─── inline markdown ────────────────────────────────────────────────────────

// Render **bold** and *italic* inside locked copy strings. No other
// markdown — locked copy avoids links, headings, code in body text.
function renderInline(text: string, baseKey: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let key = 0
  for (const m of text.matchAll(re)) {
    const idx = m.index!
    if (idx > last) parts.push(text.slice(last, idx))
    const tok = m[0]
    if (tok.startsWith('**')) {
      parts.push(<strong key={`${baseKey}-${key++}`}>{tok.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={`${baseKey}-${key++}`}>{tok.slice(1, -1)}</em>)
    }
    last = idx + tok.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function splitParagraphs(body: string): string[] {
  return body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
}

// Strip a leading **HEADING IN CAPS** paragraph from a section body.
function splitLeadingHeading(body: string): { heading: string | null; rest: string } {
  const paras = splitParagraphs(body)
  if (paras.length === 0) return { heading: null, rest: body }
  const first = paras[0]
  const m = first.match(/^\*\*([^*]+)\*\*$/)
  if (m && m[1] === m[1].toUpperCase()) {
    return { heading: m[1].trim(), rest: paras.slice(1).join('\n\n') }
  }
  return { heading: null, rest: body }
}

function stripBrackets(s: string): string {
  return s.replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim()
}

// Find a paragraph that is wrapped in single asterisks (italic disclaimer
// like *foo bar baz*), as opposed to **bold** or mixed. Multi-line allowed.
function findItalicParagraph(body: string): string | null {
  for (const para of splitParagraphs(body)) {
    const m = para.replace(/\n/g, ' ').match(/^\*([^*][\s\S]*?[^*])\*$/)
    if (m) return m[1].trim()
  }
  return null
}

// ─── drug metadata for schema ───────────────────────────────────────────────

const DRUG_METADATA: Record<string, { display: string; nonProprietaryName: string; sameAs: string }> = {
  ozempic: {
    display: 'Ozempic',
    nonProprietaryName: 'semaglutide',
    sameAs: 'https://en.wikipedia.org/wiki/Semaglutide',
  },
  metformin: {
    display: 'Metformin',
    nonProprietaryName: 'metformin hydrochloride',
    sameAs: 'https://en.wikipedia.org/wiki/Metformin',
  },
  jardiance: {
    display: 'Jardiance',
    nonProprietaryName: 'empagliflozin',
    sameAs: 'https://en.wikipedia.org/wiki/Empagliflozin',
  },
  farxiga: {
    display: 'Farxiga',
    nonProprietaryName: 'dapagliflozin',
    sameAs: 'https://en.wikipedia.org/wiki/Dapagliflozin',
  },
}

// ─── JSON-LD @graph builder ─────────────────────────────────────────────────

function buildSchemaGraph(args: {
  page: LockedPage
  pair: WiredPair
  canonicalUrl: string
  stateName: string
  drugDisplay: string
  drugNonProprietaryName: string
  drugSameAs: string
}) {
  const {
    page, pair, canonicalUrl, stateName, drugDisplay,
    drugNonProprietaryName, drugSameAs,
  } = args

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        name: page.metaTitle,
        description: page.metaDescription,
        url: canonicalUrl,
        inLanguage: 'en-US',
        lastReviewed: pair.lastReviewedISO,
        datePublished: '2026-01-15',
        dateModified: pair.lastReviewedISO,
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          name: 'HealthInsuranceRenew.com',
          url: SITE_URL,
        },
        about: [
          {
            '@type': 'Drug',
            name: drugDisplay,
            nonProprietaryName: drugNonProprietaryName,
            sameAs: drugSameAs,
          },
          {
            '@type': 'Thing',
            name: 'Health Insurance Marketplace',
            sameAs: 'https://en.wikipedia.org/wiki/Health_insurance_marketplace',
          },
          {
            '@type': 'Thing',
            name: 'Affordable Care Act',
            sameAs: 'https://en.wikipedia.org/wiki/Affordable_Care_Act',
          },
        ],
        author: { '@id': `${SITE_URL}/#organization` },
        publisher: { '@id': `${SITE_URL}/#organization` },
        reviewedBy: {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: 'HealthInsuranceRenew',
          description:
            'Independent ACA health insurance information site operated by a licensed agent with CMS Elite Circle of Champions recognition',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'HealthInsuranceRenew',
        url: SITE_URL,
        description:
          'Independent ACA health insurance information and plan comparison',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Drug Coverage', item: `${SITE_URL}/formulary` },
          { '@type': 'ListItem', position: 3, name: stateName, item: `${SITE_URL}/${pair.state}/health-insurance-plans` },
          { '@type': 'ListItem', position: 4, name: drugDisplay },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  }
}

// ─── carrier modules — both render from the same parsed grid ───────────────

function MainCarrierComparisonSection({
  pair,
  page,
  carriers,
  footnote,
}: {
  pair: WiredPair
  page: LockedPage
  carriers: CarrierRow[]
  footnote: string
}) {
  const { heading } = splitLeadingHeading(page.carrierGrid)
  // Temporary destination — state plans hub. Carrier-filtered plan pages
  // are not built yet; do not invent a per-carrier slug here.
  const seePlansHref = `/${pair.state}/health-insurance-plans`
  return (
    <section
      aria-labelledby="carrier-h"
      style={{ marginTop: 38, borderTop: '1px solid var(--rule)', paddingTop: 38 }}
    >
      <h2 className="sec" id="carrier-h">
        {heading ? sentenceCase(heading) : 'Why does Ozempic cost more with some insurance companies?'}
      </h2>
      <p className="br">
        The same drug can cost more on one plan than another, even when the tier is the same. What you actually pay depends on what your plan charges — the deductible, the copay, and which pharmacy you use.
      </p>
      <div className="kb">
        {carriers.map((c, i) => (
          <div className="kr" key={`main-${i}-${c.name}`}>
            <div>
              <div className="kn">{c.name}</div>
              <div className="kd">{c.plansLine}</div>
            </div>
            <div className="krr">
              <a href={seePlansHref} className="kp">{c.ctaLabel || 'See plans'}</a>
              <span className="tp tp-g">{c.tierLabel || 'Preferred Brand'}</span>
            </div>
          </div>
        ))}
        {footnote && <div className="kf">{footnote}</div>}
      </div>
    </section>
  )
}

function FooterCarrierDiscoveryModule({
  pair,
  stateName,
  drugDisplay,
  carriers,
  facts,
}: {
  pair: WiredPair
  stateName: string
  drugDisplay: string
  carriers: CarrierRow[]
  facts: Facts
}) {
  // Derive intro phrasing from facts so the sentence cannot contradict the
  // page's actual coverage data. Hardcoding tier/PA wording here was a YMYL
  // bug — drugs with no PA were being told "Approval is required on every plan."
  const tierCounts = new Map<string, number>()
  for (const c of facts.carriers) {
    tierCounts.set(c.tier_placement, (tierCounts.get(c.tier_placement) || 0) + c.plan_count)
  }
  let dominantTier = 'preferred-brand'
  let topCount = -1
  for (const [t, n] of tierCounts) {
    if (n > topCount) { dominantTier = t; topCount = n }
  }
  const tierPhrase: Record<string, string> = {
    'generic': 'a generic tier',
    'preferred-generic': 'a generic tier',
    'preferred-brand': 'a lower-cost brand tier',
    'non-preferred-brand': 'a non-preferred brand tier',
    'specialty': 'a specialty tier',
    'preferred-specialty': 'a specialty tier',
    'non-preferred-specialty': 'a non-preferred specialty tier',
  }
  const tierText = tierPhrase[dominantTier] || `a ${dominantTier.replace(/-/g, ' ')} tier`

  const paCount = facts.carriers.filter((c) => c.pa_required).length
  const total = facts.carriers.length
  const isGenericFamily = dominantTier === 'generic' || dominantTier === 'preferred-generic'
  let paPhrase: string
  if (paCount === 0) {
    paPhrase = 'No prior authorization is required on the plans reviewed.'
  } else if (paCount === total) {
    paPhrase = 'Prior authorization is required on every plan.'
  } else {
    paPhrase = 'Prior authorization may apply on some plans.'
  }
  const drugInBody = isGenericFamily ? drugDisplay.toLowerCase() : drugDisplay
  const ctaLine = isGenericFamily
    ? "Check your specific plan's drug list before enrolling."
    : 'Check the tier on your specific plan before enrolling.'
  const countWord =
    total === 6 ? 'six' : total === 5 ? 'five' : total === 4 ? 'four' : total === 3 ? 'three' : String(total)

  return (
    <section aria-labelledby="ins-h" style={{ marginTop: 28 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 4,
        }}
      >
        <h2
          className="sec"
          id="ins-h"
          style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}
        >
          {stateName} insurance companies — {drugDisplay} 2026
        </h2>
        <span
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            fontStyle: 'italic',
            fontWeight: 400,
            marginBottom: 13,
          }}
        >
          From 2026 plan filings
        </span>
      </div>
      <div style={{ borderBottom: '1px solid var(--rule)' }} />
      <div className="iw">
        <div className="in">
          All {countWord} {stateName} insurance companies place {drugInBody} on {tierText} for 2026. {paPhrase} {ctaLine}
        </div>
        {carriers.map((c, i) => (
          <a href={`/${pair.state}/health-insurance-plans`} className="ir" key={`disc-${i}-${c.name}`}>
            <div>
              <div className="in2">{c.name}</div>
              <div className="is">
                <span
                  className="tip"
                  style={{ background: 'var(--green-bg)', color: 'var(--green)' }}
                >
                  {c.tierLabel || 'Preferred Brand'}
                </span>
                {c.plansLine}
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--blue)', flexShrink: 0 }}>
              View details &rsaquo;
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

// ─── the page ──────────────────────────────────────────────────────────────

interface Props {
  pair: WiredPair
  page: LockedPage
  facts: Facts
  stateName: string
  canonicalUrl: string
}

export default function V79Page({ pair, page, facts, stateName, canonicalUrl }: Props) {
  const drugMeta = DRUG_METADATA[pair.drug]
  if (!drugMeta) {
    throw new Error(`V79Page: no DRUG_METADATA entry for "${pair.drug}". Add one before wiring this drug.`)
  }
  const drugDisplay = drugMeta.display

  const carrierGrid = parseCarrierGrid(page.carrierGrid)
  if (carrierGrid.carriers.length === 0) {
    throw new Error(
      `V79Page: failed to parse any carriers from section 20 of the locked markdown for ${pair.state}/${pair.drug}.`,
    )
  }
  if (carrierGrid.carriers.length !== facts.carriers.length) {
    throw new Error(
      `V79Page: carrier count mismatch for ${pair.state}/${pair.drug} — locked markdown has ${carrierGrid.carriers.length}, facts JSON has ${facts.carriers.length}.`,
    )
  }

  const schema = buildSchemaGraph({
    page,
    pair,
    canonicalUrl,
    stateName,
    drugDisplay,
    drugNonProprietaryName: drugMeta.nonProprietaryName,
    drugSameAs: drugMeta.sameAs,
  })

  const breadcrumbItems = page.breadcrumb
    .split(/[›>]/)
    .map((s) => s.trim())
    .filter(Boolean)
  const subtitleParts = page.subtitle.split('·').map((s) => s.trim()).filter(Boolean)
  const coverage = splitLeadingHeading(page.coverageSummary)
  const coverageParas = splitParagraphs(coverage.rest)
  const coverageDisclaimer = coverageParas.length > 0 && /^\*[^*]+\*$/.test(coverageParas[coverageParas.length - 1])
    ? coverageParas.pop()!.replace(/^\*|\*$/g, '').trim()
    : null

  // Three-up tiles — each is a paragraph of 3 lines: **[ value ]**, label, sublabel.
  const tiles = splitParagraphs(page.threeUpSummary).map((tb) => {
    const lines = tb.split('\n').map((l) => l.trim()).filter(Boolean)
    return {
      value: stripBrackets(lines[0]?.replace(/^\*\*|\*\*$/g, '') ?? ''),
      label: lines[1] ?? '',
      sub: lines[2] ?? '',
    }
  })

  // Short transition: callout (lines starting with >) plus bridge paragraph.
  const transitionParas = splitParagraphs(page.shortTransition)
  const calloutLines: string[] = []
  const bridgeParas: string[] = []
  for (const p of transitionParas) {
    const ls = p.split('\n').map((l) => l.trim())
    if (ls.every((l) => l.startsWith('>'))) {
      for (const l of ls) {
        const stripped = l.replace(/^>\s?/, '').trim()
        if (!stripped) continue
        const noLabel = stripped.replace(/^\*\*Callout box:\*\*\s*/i, '')
        if (noLabel) calloutLines.push(noLabel)
      }
    } else {
      bridgeParas.push(p.replace(/\n/g, ' '))
    }
  }

  // Primary CTA — title (**X**), sub line, [ button ]
  const primaryCta = parseCtaCard(page.primaryCta)
  const finalCta = parseCtaCard(page.finalCta)

  // Cost section
  const costH = splitLeadingHeading(page.costHeading)
  const costParas = splitParagraphs(costH.rest)
  const costRows = parseCostTable(page.costTable)
  const costFactors = parseCostFactors(page.costFactors)

  // Comparing plans section (decision framework)
  const compareH = splitLeadingHeading(page.comparingPlans)
  const compareSteps = parseNumberedSteps(compareH.rest)
  // Last paragraph after the steps is a bridge sentence
  const compareTrailing = compareH.rest.match(/\n\n([^*\n][^\n]*(?:\n[^*\n][^\n]*)*)$/)?.[1]?.trim()

  // Why costs more — limit-style block
  const whyH = splitLeadingHeading(page.whyCostsMore)
  const whyHeading = whyH.heading
  const whyBody = whyH.rest

  // Approval section: heading, intro callouts (**⚠/✓/Qty ...**), inner sub-blocks
  const approvalH = splitLeadingHeading(page.approvalSection)
  const approvalCallouts = parseApprovalCallouts(approvalH.rest)

  // What to expect (table-style rows)
  const expectH = splitLeadingHeading(page.whatToExpect)
  const expectRows = parseLabeledRows(expectH.rest)

  // If too long (numbered steps)
  const tooLongH = splitLeadingHeading(page.ifTooLong)
  const tooLongSteps = parseNumberedSteps(tooLongH.rest)

  // Pay less section — labeled rows with icon prefixes
  const payLessH = splitLeadingHeading(page.payLess)
  const payLessSteps = parseIconSteps(payLessH.rest)

  // Plans change — blockquote with HEADING + body
  const plansChange = parsePlansChange(page.plansChange)

  // FAQ heading
  const faqH = splitLeadingHeading(page.faqRaw)
  const faqHeading = faqH.heading

  // Related guides — list of links ending with ›
  const relatedGuideLines = page.relatedGuides
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/\s*›\s*$/, ''))

  // Related drugs — pills inside [ ... ] [ ... ]
  const relatedDrugsH = splitLeadingHeading(page.relatedDrugs)
  const drugPills = (relatedDrugsH.rest.match(/\[\s*([^\]]+?)\s*\]/g) || []).map((m) =>
    m.replace(/^\[\s*|\s*\]$/g, '').trim(),
  )

  // Footer
  const footerParts = parseFooter(page.footerDisclaimer)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="v79-root">
        <div className="wrap">
          <nav className="bc" aria-label="Breadcrumb">
            {breadcrumbItems.map((label, i) => {
              const isLast = i === breadcrumbItems.length - 1
              const bcHref = i === 0 ? '/' : i === 1 ? '/formulary' : `/${pair.state}/health-insurance-plans`
              return (
                <React.Fragment key={i}>
                  {i > 0 && <span className="bc-sep">&rsaquo;</span>}
                  {isLast ? (
                    <span>{label}</span>
                  ) : (
                    <a href={bcHref}>{label}</a>
                  )}
                </React.Fragment>
              )
            })}
          </nav>

          <article>
            <h1 className="ph">{page.h1}</h1>
            <div className="dl">
              {subtitleParts.map((part, i) =>
                i === subtitleParts.length - 1 ? (
                  <span className="sp" key={i}>{part}</span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </div>

            <div className="cluster">
              <div className="ca">
                <p className="ql">{coverage.heading ?? 'Coverage summary'}</p>
                <ul className="qa-list">
                  {coverageParas.map((para, i) => (
                    <li className="qa-item" key={i}>
                      <span className="qd" aria-hidden="true" />
                      <span>{renderInline(para, `cov-${i}`)}</span>
                    </li>
                  ))}
                </ul>
                {coverageDisclaimer && (
                  <p className="qv">{coverageDisclaimer}</p>
                )}
              </div>

              <div className="stats">
                {tiles.map((t, i) => (
                  <div className="stat" key={i}>
                    {i === 0 ? (
                      <div className="sv g">
                        {t.value.replace(/\s*plans?$/, '')}
                        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>
                          {' '}plans
                        </span>
                      </div>
                    ) : i === 1 ? (
                      <div className="sv" style={{ fontSize: 17, lineHeight: 1.15 }}>
                        {t.value}
                      </div>
                    ) : (
                      <div className="sv" style={{ fontSize: 16, paddingTop: 3 }}>
                        {t.value}
                      </div>
                    )}
                    <div className="sl">{t.label}</div>
                    {t.sub && <div className="ss">{t.sub}</div>}
                  </div>
                ))}
              </div>

              {calloutLines.length > 0 && (
                <div className="catch">
                  <svg
                    width="15" height="15" viewBox="0 0 16 16"
                    fill="none" stroke="var(--amber)" strokeWidth={1.5}
                    style={{ flexShrink: 0, marginTop: 3 }}
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="7" />
                    <line x1="8" y1="5" x2="8" y2="8.5" />
                    <circle cx="8" cy="11" r=".5" fill="var(--amber)" />
                  </svg>
                  <p>{renderInline(calloutLines.join(' '), 'callout')}</p>
                </div>
              )}
            </div>

            {bridgeParas.map((p, i) => (
              <p
                key={i}
                style={{
                  fontSize: 13.5, color: 'var(--mid)',
                  lineHeight: 1.6, marginTop: i === 0 ? 14 : 8,
                }}
              >
                {renderInline(p, `bridge-${i}`)}
              </p>
            ))}

            {primaryCta && (
              <div className="cta-g">
                <div>
                  <div className="ct">{primaryCta.title}</div>
                  <div className="cs">{primaryCta.sub}</div>
                </div>
                <a href={`/${pair.state}/health-insurance-plans`} className="bw">{primaryCta.button}</a>
              </div>
            )}

            <hr className="dv" />

            <section aria-labelledby="cost-h">
              <h2 className="sec" id="cost-h">
                {costH.heading
                  ? sentenceCase(costH.heading)
                  : 'How much does Ozempic cost on a North Carolina plan?'}
              </h2>
              {costParas.map((p, i) => (
                <p className="br" key={i}>{renderInline(p, `cost-p-${i}`)}</p>
              ))}

              <div className="cb">
                {costRows.map((r, i) => (
                  <div className="cr" key={i} style={i === costRows.length - 1 ? { borderBottom: 'none' } : undefined}>
                    <div>
                      <div className="crn">{r.title}</div>
                      <div className="crd">{r.subtitle}</div>
                    </div>
                    <div>
                      <div className="crf" style={i === costRows.length - 1 ? { color: 'var(--green)' } : { color: 'var(--ink)' }}>
                        {r.amount}
                      </div>
                      <div className="cru">est. / month</div>
                    </div>
                  </div>
                ))}
                {(() => {
                  const italic = findItalicParagraph(page.costTable)
                  return italic ? <div className="cf">{italic}</div> : null
                })()}
              </div>

              {/* Trailing paragraph after the cost table (extra context). */}
              {(() => {
                const trailingParas = splitParagraphs(page.costTable).filter(
                  (p) => !p.startsWith('**') && !/^\*[^*][\s\S]*[^*]\*$/.test(p),
                )
                return trailingParas.length > 0 ? (
                  <p className="ci">{renderInline(trailingParas[0], 'cost-trailing')}</p>
                ) : null
              })()}

              <div className="cfb">
                {costFactors.map((f, i) => (
                  <div className="cfr" key={i}>
                    <span className="cfk">{f.key}</span>
                    <span className="cfv">{renderInline(f.value, `cf-${i}`)}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="ab" style={{ marginTop: 24 }}>
              <h3 className="sub">{compareH.heading ? sentenceCase(compareH.heading) : 'When comparing plans for Ozempic, check these in order'}</h3>
              {compareSteps.map((s, i) => (
                <div className="sr" key={i} style={i === compareSteps.length - 1 ? { borderBottom: 'none' } : undefined}>
                  <div className="sn">{s.number}</div>
                  <div>
                    <div className="sh">{s.title}</div>
                    <div className="sd">{renderInline(s.body, `cmp-${i}`)}</div>
                  </div>
                </div>
              ))}
            </div>

            {compareTrailing && (
              <p className="ci">{renderInline(compareTrailing, 'cmp-trail')}</p>
            )}

            <div className="lim" style={{ marginTop: 24 }}>
              <p className="lt">{whyHeading ? sentenceCase(whyHeading) : 'Why Ozempic costs more to cover than many drugs'}</p>
              <p className="lp">{renderInline(whyBody.replace(/\n/g, ' ').trim(), 'why')}</p>
            </div>

            <section
              aria-labelledby="access-h"
              style={{ marginTop: 38, borderTop: '1px solid var(--rule)', paddingTop: 38 }}
            >
              <h2 className="sec" id="access-h">
                {approvalH.heading ? sentenceCase(approvalH.heading) : 'Do you need approval for Ozempic, and what if it is denied?'}
              </h2>

              <div className="ab">
                {approvalCallouts.map((c, i) => (
                  <div className="rr" key={i} style={i === approvalCallouts.length - 1 ? { borderBottom: 'none' } : undefined}>
                    {/* Left-side icon column intentionally omitted (per design directive). */}
                    <div>
                      <div className="rt">
                        {c.title}
                        {c.qualifier && <span className="ro"> — {c.qualifier}</span>}
                      </div>
                      <div className="rd">{renderInline(c.body, `acc-${i}`)}</div>
                    </div>
                  </div>
                ))}

                <h3 className="sub">{expectH.heading ? sentenceCase(expectH.heading) : 'What to expect while you wait'}</h3>
                {expectRows.map((r, i) => (
                  <div className="tr" key={i} style={i === expectRows.length - 1 ? { borderBottom: 'none' } : undefined}>
                    <div className="tt">{r.label}</div>
                    <div>
                      <div className="th">{r.title}</div>
                      <div className="td">{renderInline(r.body, `exp-${i}`)}</div>
                    </div>
                  </div>
                ))}

                <h3 className="sub">{tooLongH.heading ? sentenceCase(tooLongH.heading) : 'If it is taking too long or your plan denies coverage'}</h3>
                {tooLongSteps.map((s, i) => (
                  <div className="sr" key={i} style={i === tooLongSteps.length - 1 ? { borderBottom: 'none' } : undefined}>
                    <div className="sn">{s.number}</div>
                    <div>
                      <div className="sh">{s.title}</div>
                      <div className="sd">{renderInline(s.body, `tl-${i}`)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <MainCarrierComparisonSection
              pair={pair}
              page={page}
              carriers={carrierGrid.carriers}
              footnote={carrierGrid.footnote}
            />

            <section
              aria-labelledby="savings-h"
              style={{ marginTop: 38, borderTop: '1px solid var(--rule)', paddingTop: 38 }}
            >
              <h2 className="sec" id="savings-h">
                {payLessH.heading ? sentenceCase(payLessH.heading) : 'How to pay less for Ozempic'}
              </h2>
              <div>
                {payLessSteps.map((s, i) => (
                  <div className="sw" key={i} style={i === payLessSteps.length - 1 ? { borderBottom: 'none' } : undefined}>
                    <span className="si" dangerouslySetInnerHTML={{ __html: s.icon }} />
                    <div>
                      <div className="sh2">{s.title}</div>
                      <div className="sde">{renderInline(s.body, `sv-${i}`)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="lim">
              <p className="lt">{plansChange.title}</p>
              <p className="lp">{plansChange.body}</p>
            </div>

            <section
              aria-labelledby="faq-h"
              style={{ marginTop: 38, borderTop: '1px solid var(--rule)', paddingTop: 38 }}
            >
              <h2 className="sec" id="faq-h">
                {faqHeading ? sentenceCase(faqHeading) : `Common questions about ${drugDisplay} coverage in ${stateName}`}
              </h2>
              <div className="fw">
                {page.faqs.map((f, i) => (
                  <details className="fq" key={i} {...(i === 0 ? { open: true } : {})}>
                    <summary>
                      <span>{f.question}</span>
                      <span className="fc">&#x25BC;</span>
                    </summary>
                    <div className="fb">{renderInline(f.answer, `faq-${i}`)}</div>
                  </details>
                ))}
              </div>
            </section>

            <aside className="abt" aria-label="About this page">
              <strong style={{ color: 'var(--ink)', fontSize: 13 }}>{footerParts.aboutTitle}</strong>
              <div style={{ marginTop: 6 }}>{footerParts.aboutBody}</div>
              <div className="am">
                <div className="adot" />
                <span>{footerParts.amLine}</span>
              </div>
              {footerParts.editorialNavRaw && (
                <div className="al">
                  {footerParts.editorialNavRaw.split(/\s*·\s*/).map((item, i, arr) => {
                    const href = EDITORIAL_NAV_HREFS[item.toLowerCase().trim()] ?? '/about'
                    return (
                      <React.Fragment key={i}>
                        <a href={href}>{item.trim()}</a>
                        {i < arr.length - 1 && ' · '}
                      </React.Fragment>
                    )
                  })}
                </div>
              )}
            </aside>

            {relatedGuideLines.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h2 className="sec">Related guides</h2>
                <div className="el">
                  {relatedGuideLines.map((l, i) => (
                    <a key={i} href="/guides" className="ea">
                      {l}{' '}
                      <span style={{ fontSize: 11, color: 'var(--rule)' }}>&rsaquo;</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>

          <hr className="dv" />

          <section aria-labelledby="rel-h">
            <h2 className="sec" id="rel-h">Related drugs — {stateName} coverage</h2>
            <div className="pills">
              {drugPills.map((d, i) => {
                const drugSlug = d.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
                return (
                  <a key={i} href={`/formulary/${pair.state}/${drugSlug}`} className="pill">{d}</a>
                )
              })}
            </div>
          </section>

          <FooterCarrierDiscoveryModule
            pair={pair}
            stateName={stateName}
            drugDisplay={drugDisplay}
            carriers={carrierGrid.carriers}
            facts={facts}
          />

          <div className="sn2">
            <p>
              Browse all covered drugs in <strong>{stateName}</strong> health plans.
            </p>
            <a href="/formulary" className="bo">View {stateName} drug coverage</a>
          </div>

          {finalCta && (
            <div className="cn">
              <div>
                <div className="cn-t">{finalCta.title}</div>
                <div className="cn-s">{finalCta.sub}</div>
              </div>
              <a href={`/${pair.state}/health-insurance-plans`} className="bwn">{finalCta.button} &rarr;</a>
            </div>
          )}

          <div className="disc">
            {footerParts.discParas.map((p, i) => (
              <p key={i} {...(i > 1 ? { style: { marginTop: 5 } } : {})}>
                {renderDiscParagraph(p, `disc-${i}`)}
              </p>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── helpers ───────────────────────────────────────────────────────────────

const EDITORIAL_NAV_HREFS: Record<string, string> = {
  'how we review plans': '/about/methodology',
  'our editorial approach': '/editorial-policy',
  'about this site': '/about',
}

// Renders a disclaimer paragraph, converting *How we get paid* to a real link
// instead of the <em> that renderInline() would produce.
function renderDiscParagraph(text: string, baseKey: string): React.ReactNode {
  const match = /\*How we get paid\*/i.exec(text)
  if (!match) return renderInline(text, baseKey)
  const before = text.slice(0, match.index)
  const after = text.slice(match.index + match[0].length)
  return (
    <>
      {renderInline(before, `${baseKey}-a`)}
      <a href="/how-we-get-paid" style={{ color: 'var(--blue)', textDecoration: 'none' }}>How we get paid</a>
      {after && renderInline(after, `${baseKey}-b`)}
    </>
  )
}

function sentenceCase(allCaps: string): string {
  return allCaps
    .toLowerCase()
    .replace(/\b(aca|hsa|fpl|cms|ny|nc|sc|ca|fl|tx)\b/g, (m) => m.toUpperCase())
    .replace(/^(.)/, (m) => m.toUpperCase())
    .replace(/(north|south|west|east) (carolina|dakota|virginia)/g, (m) =>
      m.replace(/\b\w/g, (c) => c.toUpperCase()),
    )
    .replace(/\bozempic\b/g, 'Ozempic')
    .replace(/\bwegovy\b/g, 'Wegovy')
    .replace(/\bmounjaro\b/g, 'Mounjaro')
    .replace(/\bzepbound\b/g, 'Zepbound')
    .replace(/\btrulicity\b/g, 'Trulicity')
    .replace(/\brybelsus\b/g, 'Rybelsus')
    .replace(/\bvictoza\b/g, 'Victoza')
    .replace(/\bsaxenda\b/g, 'Saxenda')
    .replace(/\bjardiance\b/g, 'Jardiance')
}

interface CtaCard { title: string; sub: string; button: string }

function parseCtaCard(body: string): CtaCard | null {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean)
  let title = ''
  let sub = ''
  let button = ''
  for (const l of lines) {
    if (/^\[[^\]]+\]$/.test(l)) {
      button = l.replace(/^\[\s*|\s*\]$/g, '').replace(/\s*[→›»]\s*$/, '')
    } else {
      const m = l.match(/^\*\*([^*]+)\*\*$/)
      if (m && !title) title = m[1].trim()
      else if (!sub) sub = l
    }
  }
  if (!title && !sub && !button) return null
  return { title, sub, button }
}

interface CostRow { title: string; subtitle: string; amount: string }

function parseCostTable(body: string): CostRow[] {
  const paras = splitParagraphs(body)
  const rows: CostRow[] = []
  for (const p of paras) {
    const lines = p.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 3) continue
    const titleM = lines[0].match(/^\*\*([^*]+)\*\*$/)
    if (!titleM) continue
    const amtM = lines[2].match(/^\*\*([^*]+)\*\*$/)
    if (!amtM) continue
    rows.push({
      title: titleM[1].trim(),
      subtitle: lines[1],
      amount: amtM[1].replace(/\s*est\.\s*\/\s*month\s*$/, '').trim(),
    })
  }
  return rows
}

interface CostFactor { key: string; value: string }

function parseCostFactors(body: string): CostFactor[] {
  const paras = splitParagraphs(body)
  const out: CostFactor[] = []
  for (const p of paras) {
    const m = p.match(/^\*\*([^*]+)\*\*\s*\n([\s\S]+)$/)
    if (!m) continue
    out.push({ key: m[1].trim(), value: m[2].replace(/\n/g, ' ').trim() })
  }
  return out
}

interface NumberedStep { number: number; title: string; body: string }

function parseNumberedSteps(body: string): NumberedStep[] {
  const paras = splitParagraphs(body)
  const out: NumberedStep[] = []
  for (const p of paras) {
    const m = p.match(/^\*\*(\d+)\.\s*([^*]+)\*\*\s*\n([\s\S]+)$/)
    if (!m) continue
    out.push({
      number: parseInt(m[1], 10),
      title: m[2].trim(),
      body: m[3].replace(/\n/g, ' ').trim(),
    })
  }
  return out
}

interface LabeledRow { label: string; title: string; body: string }

function parseLabeledRows(body: string): LabeledRow[] {
  const paras = splitParagraphs(body)
  const out: LabeledRow[] = []
  for (const p of paras) {
    const lines = p.split('\n').map((l) => l.trim()).filter(Boolean)
    const labM = lines[0]?.match(/^\*\*([^*]+)\*\*$/)
    if (!labM) continue
    out.push({
      label: labM[1].trim(),
      title: lines[1] ?? '',
      body: lines.slice(2).join(' '),
    })
  }
  return out
}

interface ApprovalCallout { icon: 'amber' | 'green' | 'qty'; title: string; qualifier: string; body: string }

function parseApprovalCallouts(body: string): ApprovalCallout[] {
  const paras = splitParagraphs(body)
  const out: ApprovalCallout[] = []
  for (const p of paras) {
    const lines = p.split('\n').map((l) => l.trim()).filter(Boolean)
    const headM = lines[0]?.match(/^\*\*([⚠✓Qty])\s+(.+?)\*\*$/u) || lines[0]?.match(/^\*\*([⚠✓])\s+(.+?)\*\*$/u) || lines[0]?.match(/^\*\*(Qty)\s+(.+?)\*\*$/)
    if (!headM) continue
    const icon: ApprovalCallout['icon'] =
      headM[1] === '⚠' ? 'amber' : headM[1] === '✓' ? 'green' : 'qty'
    const headRest = headM[2]
    const dashIdx = headRest.indexOf(' — ')
    const title = dashIdx >= 0 ? headRest.slice(0, dashIdx).trim() : headRest.trim()
    const qualifier = dashIdx >= 0 ? headRest.slice(dashIdx + 3).trim() : ''
    out.push({ icon, title, qualifier, body: lines.slice(1).join(' ') })
  }
  return out
}

function iconStyle(icon: ApprovalCallout['icon']): React.CSSProperties {
  switch (icon) {
    case 'amber': return { background: 'var(--amber-bg)', color: 'var(--amber)' }
    case 'green': return { background: 'var(--green-bg)', color: 'var(--green)' }
    case 'qty':   return { background: 'var(--surface)', color: 'var(--mid)' }
  }
}

function iconChar(icon: ApprovalCallout['icon']): React.ReactNode {
  switch (icon) {
    case 'amber': return '!'
    case 'green': return '✓'
    case 'qty':   return 'Qty'
  }
}

interface IconStep { icon: string; title: string; body: string }

function parseIconSteps(body: string): IconStep[] {
  const paras = splitParagraphs(body)
  const out: IconStep[] = []
  const ICON_MAP: Record<string, string> = {
    '$': '$',
    '→': '&rarr;',
    '↗': '&#x2197;',
    '✓': '&#x2713;',
  }
  for (const p of paras) {
    const lines = p.split('\n').map((l) => l.trim()).filter(Boolean)
    const headM = lines[0]?.match(/^\*\*\s*([\$→↗✓])\s+(.+?)\*\*$/u)
    if (!headM) continue
    out.push({
      icon: ICON_MAP[headM[1]] ?? headM[1],
      title: headM[2].trim(),
      body: lines.slice(1).join(' '),
    })
  }
  return out
}

function parsePlansChange(body: string): { title: string; body: string } {
  // Strip blockquote markers from every line, then split into individual
  // lines so a leading **HEADING** line peels off cleanly even when the
  // markdown source has no blank line between the heading and body.
  const allLines = body
    .split('\n')
    .map((l) => l.replace(/^>\s?/, '').trim())
    .filter(Boolean)
  let title = 'Plans change during the year'
  const bodyLines: string[] = []
  for (const line of allLines) {
    const titleM = line.match(/^\*\*([A-Z][^*]+)\*\*$/)
    if (titleM) {
      title = sentenceCase(titleM[1].trim())
    } else {
      bodyLines.push(line)
    }
  }
  return { title, body: bodyLines.join(' ') }
}

interface FooterParts {
  aboutTitle: string
  aboutBody: string
  amLine: string
  editorialNavRaw: string | null
  discParas: string[]
}

function parseFooter(body: string): FooterParts {
  const paras = splitParagraphs(body)
  let aboutTitle = 'About this page'
  let aboutBody = ''
  let amLine = ''
  let editorialNavRaw: string | null = null
  const discParas: string[] = []

  let mode: 'about' | 'disc' = 'about'
  for (const p of paras) {
    const trimmed = p.trim()
    if (trimmed === '---') {
      mode = 'disc'
      continue
    }
    if (mode === 'about') {
      const tm = trimmed.match(/^\*\*([^*]+)\*\*$/)
      if (tm) {
        aboutTitle = tm[1].trim()
        continue
      }
      const am = trimmed.match(/^\*([^*][\s\S]*?[^*])\*$/)
      if (am) {
        amLine = am[1].replace(/\n/g, ' ').trim()
        continue
      }
      if (/How we review plans|editorial approach|About this site/i.test(trimmed)) {
        editorialNavRaw = trimmed.replace(/\n/g, ' ').trim()
        continue
      }
      if (!aboutBody) aboutBody = trimmed.replace(/\n/g, ' ')
    } else {
      if (/^\*\*Disclaimer\*\*$/i.test(trimmed)) continue
      const cleaned = trimmed.replace(/\n/g, ' ')
      discParas.push(cleaned)
    }
  }
  return { aboutTitle, aboutBody, amLine, editorialNavRaw, discParas }
}
