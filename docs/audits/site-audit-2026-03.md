# HealthInsuranceRenew.com — Comprehensive Site Audit
**Date:** March 2026
**Audited by:** Claude Code (claude-sonnet-4-6)
**Scope:** SEO/AEO/GEO/AIO/SXO · E-E-A-T · HCU · YMYL · Technical SEO
**Method:** Full codebase audit — app/, components/, lib/, content/, data/config/

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Homepage](#1-homepage)
3. [/plans (Plans Index)](#2-plans-index)
4. [/[state]/health-insurance-plans](#3-state-health-insurance-plans)
5. [/[state] (State Landing)](#4-state-landing)
6. [/subsidies](#5-subsidies-index)
7. [/formulary (Drug Lookup)](#6-formulary-drug-lookup)
8. [/guides/[slug]](#7-guides)
9. [/dental](#8-dental-index)
10. [Cross-Cutting Technical Issues](#cross-cutting-technical-issues)
11. [Schema Library Assessment](#schema-library-assessment)
12. [Prioritized Master Fix List](#prioritized-master-fix-list)

---

## Executive Summary

HealthInsuranceRenew.com is a legitimately differentiated ACA intelligence platform with a technically advanced schema library, real government data sourcing, and a credible E-E-A-T foundation (NPN, CMS Elite Circle of Champions, transparent monetization disclosure). It has competitive advantages that are genuinely hard to replicate: 551,000 drug records, 1,852 county subsidy records, 10 CMS PUF data pillars, and licensed-agent editorial oversight.

**The problem: the infrastructure far outperforms the content layer.**

- Index pages are skeletal navigation grids with no educational content, no FAQs, no schema beyond breadcrumbs
- The highest-traffic intent pages (formulary search, plans index, subsidies index) are either client-side-only (invisible to crawlers) or carry near-zero content signals
- The richest content exists on SBM state pages (CA specifically), but FFM states — where 30+ states live — get a bare county-picker with one paragraph
- Guides are short (400–600 words), lack specific data citations, missing Article schema entirely, and have only 3 FAQs each
- The site's unique data assets (county-level APTC amounts, formulary coverage, rate volatility) are largely locked behind navigation rather than surfaced on SEO-optimized landing pages

**Overall site score: 5.8/10.** The foundation is exceptional; the content execution is 30–40% of what it could be.

---

## 1. Homepage

### Scores

| Framework | Score | Rationale |
|-----------|-------|-----------|
| SEO | 6/10 | Title/meta are good; H1 is brand-voice, not keyword-targeted; no FAQ schema |
| AEO | 4/10 | No FAQ schema on homepage; BLUF paragraph is `sr-only` (screen-reader only!) |
| GEO | 7/10 | Organization schema has `knowsAbout` array, CMS attribution bar, Speakable schema |
| AIO/LLMO | 6/10 | Good entity definitions in Organization schema; BLUF not surfaced in HTML body |
| SXO | 7/10 | Clear CTAs, "Who it's for" intent segmentation, tools grid, no friction |
| E-E-A-T | 8/10 | NPN shown, CMS recognition, editorial policy linked, monetization disclosed |
| HCU | 5/10 | High-value tooling & trust signals; hero copy is editorial not informational |
| YMYL | 7/10 | No medical advice, licensing stated, "consult agent" language present |
| Information Gain | 5/10 | No unique data presented; homepage navigates to data but doesn't surface any |
| Topical Authority | 6/10 | 10 pillars linked; no topic cluster map or depth signal on homepage |
| Zero-Click | 2/10 | Critical failure: BLUF answer is `sr-only` — hidden from visible HTML and likely deprioritized by crawlers |

### Top 3 Critical Gaps

1. **H1 is not keyword-targeted.** `"Health insurance that actually makes sense."` is a brand tagline, not a search-intent match. Primary query: `"health insurance marketplace 2026"`, `"ACA health insurance plans"`. H1 should be the primary keyword-bearing sentence.

2. **BLUF paragraph is invisible.** The most AI-extractable content on the page — `<p id="site-bluf" className="sr-only">` — is hidden with CSS. Google and AI engines may deprioritize content that is not visible to users. This is the most citable description of the site and it's screen-reader only.

3. **No FAQPage schema on homepage.** With 54 expert Q&As and 9 categories, a selection of 5–8 homepage FAQs (e.g., "How do ACA subsidies work?", "What is an APTC?", "When is Open Enrollment 2026?") would capture People Also Ask boxes and AI-overview slots.

### Specific Fixes

```
Homepage H1: Change to → "2026 ACA Health Insurance Plans, Subsidies & Coverage Tools"
  Subheadline becomes the tagline copy.

BLUF: Remove sr-only class. Render as a visible 2–3 sentence paragraph below H1.
  This is the most AI-citable content on the page.

Add FAQ section (4–6 questions) from friction_qa.json + FAQPage schema.
  Suggested Q&As:
  - "How do I know if I qualify for ACA subsidies in 2026?"
  - "What is the difference between a Bronze, Silver, Gold, and Platinum plan?"
  - "Can I get marketplace insurance if I lost my job?"
  - "What is the income limit for Obamacare subsidies in 2026?"
  - "Is there a penalty for not having health insurance in 2026?"

Add Person schema for the operator (Dave Lee, NPN) on homepage to tie content
  to a real licensed individual — critical for AI entity resolution.
```

---

## 2. Plans Index

**Route:** `/plans/page.tsx`

### Scores

| Framework | Score | Rationale |
|-----------|-------|-----------|
| SEO | 4/10 | Generic title; H1 has no year; no OG tags (falls to layout default); no schema |
| AEO | 2/10 | No FAQs, no answer blocks, no featured snippet opportunities |
| GEO | 2/10 | No data surfaces, no citable facts, no educational content |
| AIO/LLMO | 2/10 | Pure navigation page — nothing for AI to extract or cite |
| SXO | 6/10 | State grid is functional; "Plan Data Coming Soon" fallback CTAs are helpful |
| E-E-A-T | 2/10 | No trust signals, no author, no source attribution |
| HCU | 2/10 | Fails HCU — navigational pages with no content are precisely what HCU penalizes |
| YMYL | 5/10 | No false claims; but no caveats or disclosures either |
| Information Gain | 1/10 | Provides nothing beyond what Healthcare.gov itself provides |
| Zero-Click | 1/10 | Answers zero questions |

### Top 3 Critical Gaps

1. **Zero content above the fold.** The page is 165 lines and every line is navigation. No one searching "compare health insurance plans 2026" wants a list of state abbreviations — they want to understand what they're comparing. The absence of any educational content guarantees this page will not rank for transactional queries.

2. **No schema whatsoever.** Not even BreadcrumbList. The plans index is one of the most strategically important pages on the site and has zero structured data.

3. **Thin description doesn't differentiate.** "Find and compare 2026 marketplace health insurance plans by state and county" is identical to what Healthcare.gov says. No mention of what makes this data unique (CMS PUF source, county-level granularity, all metal tiers, no signup required).

### Specific Fixes

```
Add above-fold content block (~200 words):
  - What CMS PUF plan data shows (metal tiers, premiums, carrier counts)
  - How this differs from Healthcare.gov (all plans visible, no enrollment pressure)
  - Key stat: "[X] plans across [Y] states and [Z] counties" from rate_volatility data

Add FAQPage schema + visible FAQ section (5 Q&As):
  - "What is a marketplace health insurance plan?"
  - "What is the difference between Bronze, Silver, Gold, and Platinum plans?"
  - "How do I compare health insurance plans in my county?"
  - "What does deductible mean on a health insurance plan?"
  - "How many plans are available in [my state]?" → link to state pages

Add BreadcrumbList schema.

Title: Change to → "Compare 2026 ACA Health Insurance Plans by State & County | CMS Data"
  (adds year, CMS sourcing as differentiation)
```

---

## 3. State Health Insurance Plans

**Route:** `/[state-name]/health-insurance-plans/page.tsx`

### Scores (split: FFM states vs SBM/CA)

| Framework | FFM Score | SBM/CA Score | Rationale |
|-----------|-----------|--------------|-----------|
| SEO | 5/10 | 8/10 | FFM: county-picker only; SBM: title, H1, meta all good |
| AEO | 1/10 | 8/10 | FFM: zero FAQs; CA: 10 FAQs with schema |
| GEO | 2/10 | 7/10 | FFM: no data; CA: cost stats, enrollment data, carriers named |
| AIO/LLMO | 2/10 | 7/10 | FFM: nothing citable; CA: structured facts, enrollment timeline |
| SXO | 5/10 | 9/10 | FFM: poor — no context before navigation; CA: full journey with calculator |
| E-E-A-T | 2/10 | 7/10 | FFM: nothing; CA: attribution, carriers listed, subsidy pct cited |
| HCU | 2/10 | 8/10 | FFM: fails HCU entirely; CA: passes with good depth |
| YMYL | 4/10 | 8/10 | FFM: missing caveats; CA: source attribution, "consult agent" |
| Information Gain | 1/10 | 8/10 | FFM: identical to Healthcare.gov; CA: significant original analysis |
| Zero-Click | 1/10 | 7/10 | FFM: answers nothing; CA: cost stats + eligibility info above fold |

### Top 3 Critical Gaps

1. **FFM state pages are structurally identical to the plans index — just with a county list instead of a state list.** There are 30 FFM states and each has a county navigation page with one paragraph of content, no FAQs, no cost data, and no schema beyond breadcrumbs. These pages will not rank for `"health insurance plans [state] 2026"` against pages that have actual content.

2. **Generic SBM fallback content has a broken template bug.** `getSbmContent()` line 131: `${stateName === 'CA' ? 'expanded' : (stateCode === 'ME' || stateCode === 'PA' ? 'expanded' : 'expanded')}` — this always renders "expanded" regardless of actual Medicaid expansion status. A factual error on a YMYL page.

3. **No Person-level author entity on any state page.** The Article schema uses `HealthInsuranceRenew Editorial Team` as author, never the licensed agent (NPN). For state-specific health insurance pages — a direct YMYL category — Google requires demonstrable human expertise. The generic org author is a missed E-E-A-T signal.

### Specific Fixes

```
FFM State Pages — add content template (~300 words + FAQs):
  Generate per-state content from rate_volatility.json:
  - "How many health insurance plans are available in [State] in 2026?" → from plan_count
  - Carrier count statistic from carrier_count field
  - Link to subsidy calculator, rates, dental, and drug lookup for that state

  Add 5 templated FAQs per FFM state page:
  - "How do I enroll in health insurance in [State] in 2026?"
  - "What is the cheapest health insurance plan in [State]?"
  - "What are the income limits for subsidies in [State]?"
  - "How many health insurance carriers are in [State]?"
  - "When does Open Enrollment end in [State] for 2026?"

  Add FAQPage schema to all FFM state pages.

Fix Medicaid expansion bug in getSbmContent() — use the
  `stateEntry.medicaidExpanded` boolean that already exists in all-states.json.

Add Person schema for content author (Dave Lee, NPN: [from config]) to all
  state plan pages. Currently schema-markup.ts only has Organization author.
```

---

## 4. State Landing

**Route:** `/states/[state]/page.tsx`

### Scores

| Framework | Score | Rationale |
|-----------|-------|-----------|
| SEO | 6/10 | Dynamic metadata good; no Article or BreadcrumbList JSON-LD schema (only visual breadcrumbs) |
| AEO | 6/10 | FAQSection present from frontmatter; no FAQPage schema being injected |
| GEO | 5/10 | AnswerBox + SourcesBox provide some structure; no data tables |
| AIO/LLMO | 5/10 | AnswerBox is ideal for AI extraction but lacks schema signal |
| SXO | 6/10 | Good CTA to enrollment; external domain hand-off could use more context |
| E-E-A-T | 6/10 | AnswerBox, exchange info, date updated, SourcesBox; no author attribution |
| HCU | 6/10 | Markdown content with FAQs is substantive; quality depends on content file depth |
| YMYL | 5/10 | Enrollment CTA exits to external domain with minimal disclosure |

### Top 3 Critical Gaps

1. **FAQSection component renders `<details>/<summary>` accordion but no FAQPage JSON-LD is injected on state pages.** The `/app/states/[state]/page.tsx` uses `FAQSection` from frontmatter but doesn't call `buildFAQSchema()` — so the rich FAQ content gets no structured data. This is a two-line fix that unlocks FAQ rich results for all 50 state pages.

2. **No Article or BreadcrumbList JSON-LD.** Visual `<Breadcrumbs>` component exists but there's no `SchemaScript` call. State pages are substantive content pages (markdown + FAQs + CTAs) that should have Article schema with `dateModified` and `isBasedOn`.

3. **External CTA to `applyhealthinsuranceonline.com` needs disclosure.** The enrollment CTA exits to a separate domain with only a small paragraph saying "You are leaving HealthInsuranceRenew.com." For YMYL/trust purposes this should include: (a) that this is an affiliate/referral, per the how-we-get-paid page, (b) what happens to user data after leaving. This is also an E-E-A-T issue.

### Specific Fixes

```typescript
// In app/states/[state]/page.tsx, add:
import { buildFAQSchema, buildBreadcrumbSchema, buildArticleSchema } from '../../../lib/schema-markup'
import SchemaScript from '../../../components/SchemaScript'

// Before return statement:
const breadcrumbSchema = buildBreadcrumbSchema([...breadcrumbs])
const articleSchema = buildArticleSchema({
  headline: title,
  description,
  dateModified,
  dataSourceName: 'CMS Marketplace Data',
  dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
})
const faqSchema = faqs && faqs.length > 0
  ? buildFAQSchema(faqs.map(f => ({ question: f.question, answer: f.answer })))
  : null

// In JSX:
<SchemaScript schema={breadcrumbSchema} id="breadcrumb-schema" />
<SchemaScript schema={articleSchema} id="article-schema" />
{faqSchema && <SchemaScript schema={faqSchema} id="faq-schema" />}
```

---

## 5. Subsidies Index

**Route:** `/subsidies/page.tsx`

### Scores

| Framework | Score | Rationale |
|-----------|-------|-----------|
| SEO | 5/10 | Good title/description; H1 is functional; no schema; thin content |
| AEO | 2/10 | No FAQs, no answer blocks |
| GEO | 2/10 | No data surfaces; subsidy data is locked behind navigation |
| AIO/LLMO | 2/10 | Nothing citable above the state grid |
| SXO | 5/10 | Functional instruction card; SBM fallback section reasonable |
| E-E-A-T | 2/10 | CMS attribution in description only; no content authority signals |
| HCU | 2/10 | Fails — navigational, no educational content |
| YMYL | 4/10 | No caveats about estimated vs actual APTC amounts |
| Information Gain | 1/10 | Provides nothing Healthcare.gov doesn't already link to |
| Zero-Click | 1/10 | Answers zero questions |

### Top 3 Critical Gaps

1. **The subsidy index is the most strategically valuable page on the site and it has 90 lines of code with no content.** Queries like "how much is my health insurance subsidy 2026", "ACA subsidy calculator", "income limits for health insurance subsidy" are high-intent, high-volume. The page ranks as a navigation tool but offers nothing for someone who arrives from search.

2. **The APTC calculation formula is never explained on any index page.** The subsidy engine (`subsidy_engine.json`) contains benchmark silver premiums and FPL-tier estimates for 1,852 counties. None of that intelligence is visible above the state navigation grid. A concise explanation of how APTC is calculated (% of income formula, benchmark plan anchor, IRA enhanced credits) would make this page genuinely useful and citeable.

3. **No schema.** Not even BreadcrumbList.

### Specific Fixes

```
Add above-fold educational block (~250 words):
  "How premium tax credits work in 2026"
  - The APTC formula: benchmark silver plan cost − (your % of income × household income)
  - 2026 applicable percentage table (condensed: 100–133% FPL = 0%, up to 400%+ = 8.5%)
  - IRA enhanced credits status note
  - Key stat: subsidy data covers [N] counties across [N] states

Add income/subsidy quick-reference table:
  | Income Level | 1-Person Household | Estimated Max APTC |
  Using national averages from subsidy_engine.json metadata

Add FAQPage schema + visible section (5 Q&As):
  - "What is an APTC subsidy for health insurance?"
  - "What is the income limit for ACA subsidies in 2026?"
  - "How is my health insurance subsidy calculated?"
  - "Do I have to pay back my health insurance subsidy?"
  - "What happens to my subsidy if my income changes mid-year?"

Add BreadcrumbList schema.
```

---

## 6. Formulary / Drug Lookup

**Route:** `/formulary/page.tsx`

### Scores

| Framework | Score | Rationale |
|-----------|-------|-----------|
| SEO | 1/10 | `'use client'` directive = no server-side metadata; falls to layout default title; not crawlable as rich HTML |
| AEO | 2/10 | Content-wise has drug categories and trust section; schema-invisible |
| GEO | 2/10 | Drug category data is hardcoded but CMS attribution is present |
| AIO/LLMO | 1/10 | Client-rendered content cannot be extracted by AI crawlers without JS |
| SXO | 8/10 | Best UX on the site — autocomplete, categories, state filter, clear CTAs |
| E-E-A-T | 6/10 | CMS MR-PUF attribution, licensed agent mention, but schema-less |
| HCU | 4/10 | Good intent-match UX; content not crawlable |
| YMYL | 5/10 | No medical advice; "consult agent" missing on drug coverage page |
| Technical | 1/10 | Client component cannot have generateMetadata; no structured data |
| Zero-Click | 1/10 | Page content not visible to search engines without JS execution |

### Top 3 Critical Gaps

1. **CRITICAL: `/formulary/page.tsx` is a `'use client'` component.** This means:
   - `generateMetadata()` cannot run — title falls to layout default: `"HealthInsuranceRenew — ACA Health Insurance Intelligence"`
   - The page renders with JavaScript — most search engine crawlers (and all AI crawlers) see a blank shell
   - All drug categories, trust content, and CMS attribution are invisible to crawlers
   - **This is the highest-traffic-potential page on the site being served as a JavaScript blob.**

2. **No schema of any kind.** The formulary page has no BreadcrumbList, no WebApplication schema, no FAQPage. It's the most-linked page in the nav yet has zero structured data signals.

3. **The drug category grid is hardcoded with arbitrary 6-drug pills.** For `"does Ozempic coverage ACA"` or `"is Mounjaro covered by Obamacare"` — which are extremely high-intent queries — the page has no crawlable text answering these questions. The drug names are rendered in `<a>` tags that require JS to be present.

### Specific Fixes

```
CRITICAL — Split into server + client components:
  - Create /formulary/page.tsx as a SERVER component with generateMetadata()
  - Move search form + autocomplete into a client component: FormularySearchClient.tsx
  - Server component renders: H1, educational content, static drug links, FAQs — all crawlable
  - Client component handles: state selector, drug search, routing

Add generateMetadata():
  title: 'Drug Formulary Lookup — Check ACA Marketplace Medication Coverage | 2026'
  description: 'Check if your prescription is covered by 2026 Obamacare plans.
    551,000+ drugs across all metal tiers. CMS machine-readable formulary data.
    Tier, prior auth, and step therapy info by plan.'

Add WebApplication schema:
  {
    "@type": "WebApplication",
    "name": "ACA Drug Formulary Lookup",
    "applicationCategory": "HealthApplication",
    "description": "...",
    "featureList": ["Drug coverage lookup", "Tier information", "Restriction flags"]
  }

Add FAQPage schema (5 Q&As on drug coverage):
  - "What is a drug formulary in health insurance?"
  - "What does 'prior authorization' mean for a prescription?"
  - "What is step therapy and how does it affect my medication?"
  - "What is a Tier 1, Tier 2, or Tier 3 drug?"
  - "Does every ACA marketplace plan cover the same drugs?"

Render drug category sections as static HTML server-side.
  Each drug name = an <a> link that is crawlable without JS.
```

---

## 7. Guides

**Route:** `/guides/[slug]/page.tsx` + `content/guides/*.md`

### Scores (based on `how-aca-subsidies-work-2026.md` + template structure)

| Framework | Score | Rationale |
|-----------|-------|-----------|
| SEO | 5/10 | Dynamic metadata good; NO Article schema (critical gap); canonical set |
| AEO | 5/10 | FAQSection present (3 Q&As in sample); no FAQPage schema injected |
| GEO | 4/10 | No data tables, no specific figures, no sourced statistics in guide body |
| AIO/LLMO | 5/10 | AnswerBox is extractable; content too vague for authoritative citation |
| SXO | 6/10 | Related resources box is good; weak CTA — no tool link in-line with content |
| E-E-A-T | 5/10 | No author attribution in HTML or schema; dateModified shown visually |
| HCU | 4/10 | Sample guide is ~500 words, 4 H2s, 3 FAQs — below HCU threshold |
| YMYL | 5/10 | Good caveats ("Consult a licensed agent" implied via SourcesBox) |
| Information Gain | 3/10 | Guide content is structurally sound but lacks specific data that competitors don't have |
| Topical Authority | 4/10 | 11 guides; no cross-linking between guides; no content cluster structure |

### Top 3 Critical Gaps

1. **No Article schema on any guide page.** `app/guides/[slug]/page.tsx` has no `SchemaScript` calls. The site has a robust `buildArticleSchema()` in `lib/schema-markup.ts` but never uses it for guides. Google uses Article schema to attribute authorship, establish freshness, and build E-E-A-T signals. Without it, guides are anonymous content blobs.

2. **Guide content is too thin.** The `how-aca-subsidies-work-2026.md` guide is ~500 words with 4 H2 sections and 3 FAQs. It doesn't include:
   - A specific 2026 applicable percentage table
   - An example calculation ("At $40,000 income, you would pay approximately $...")
   - A cost table with actual FPL thresholds and dollar amounts
   - More than 3 FAQs (HCU recommends 5–8 minimum for YMYL guides)
   - A named data source beyond "IRS" and "Healthcare.gov"

3. **No Person-level authorship.** The operator (Dave Lee, NPN, CMS Elite Circle of Champions) is the site's most powerful E-E-A-T signal. It's never in any guide's HTML, metadata, or schema. An Author byline with NPN number, linked to `/about`, would dramatically improve AI engine attribution.

### Specific Fixes

```typescript
// In app/guides/[slug]/page.tsx, add:
import { buildArticleSchema, buildBreadcrumbSchema, buildFAQSchema } from '../../../lib/schema-markup'
import SchemaScript from '../../../components/SchemaScript'

// Add to generateMetadata():
openGraph: {
  type: 'article',
  title: ...,
  description: ...,
  publishedTime: entry.frontmatter.datePublished,
  modifiedTime: entry.frontmatter.dateModified,
  authors: ['https://healthinsurancerenew.com/about'],
}

// Add to page component:
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  datePublished: datePublished,
  dateModified,
  author: {
    '@type': 'Person',
    name: config.operator.name,   // from config.json
    url: 'https://healthinsurancerenew.com/about',
    identifier: config.operator.npn,
  },
  publisher: { '@type': 'Organization', name: 'HealthInsuranceRenew', ... },
}
const faqSchema = faqs?.length > 0 ? buildFAQSchema(faqs.map(...)) : null
const breadcrumbSchema = buildBreadcrumbSchema([...])
```

**Guide content minimum standards (add to CLAUDE.md):**
```
- Minimum 800 words
- Minimum 1 data table (with CMS/IRS source)
- Minimum 5 FAQs
- At least 1 specific dollar amount or percentage with source
- Author byline: "Written by [Name], NPN [#], Licensed in [N] states"
- datePublished field in frontmatter (currently missing from some guides)
```

---

## 8. Dental Index

**Route:** `/dental/page.tsx`

### Scores

| Framework | Score | Rationale |
|-----------|-------|-----------|
| SEO | 7/10 | Good title/description; BreadcrumbList + Article schema present; no FAQPage |
| AEO | 5/10 | "What Is a Stand-Alone Dental Plan?" explainer is good; no FAQ schema |
| GEO | 6/10 | Stats (1,389 variants, 30 states, N issuers) are cited from CMS SADP PUF |
| AIO/LLMO | 6/10 | Explainer box is extractable; state grid has structured data |
| SXO | 7/10 | Clear navigation; plan count + ortho availability per state is useful |
| E-E-A-T | 5/10 | CMS attribution; no author; disclaimer present but brief |
| HCU | 6/10 | Explainer box adds value; page is thin beyond it |
| YMYL | 6/10 | Disclaimer present; "consult a licensed agent" included |
| Information Gain | 6/10 | SADP-not-eligible-for-APTC fact is valuable and often missed |
| Zero-Click | 4/10 | SADP explainer box answers "what is a dental plan" query well |

### Top 3 Critical Gaps

1. **No FAQPage schema.** The "What Is a Stand-Alone Dental Plan?" section and several implied questions (Does dental coverage count toward APTC? Are pediatric dental plans different? What is an annual maximum?) could be formatted as FAQs with schema to capture PAA (People Also Ask) results.

2. **`dateModified` in Article schema is `new Date().toISOString().slice(0, 10)`** — meaning every page build tells Google the article was modified *today*, even if data hasn't changed. This is misleading and may cause freshness signals to degrade if Google notices content isn't actually changing. Should be set to the actual PUF data release date.

3. **State grid doesn't show plan counts or cost ranges.** Users arriving from "stand-alone dental plans in Florida 2026" see a grid with plan count and issuer count, but no benchmark premium or coverage tier snapshot. Adding even one data point per state (e.g., "avg annual max: $1,500") would significantly improve information density.

### Specific Fixes

```typescript
// Fix dateModified — use actual data release date, not today:
const articleSchema = buildArticleSchema({
  headline: `Stand-Alone Dental Plans for ${PLAN_YEAR}`,
  description: ...,
  dateModified: '2026-01-15',  // Actual CMS SADP PUF release date
  dataSourceName: 'CMS SADP PUF',
  dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files',
})

// Add FAQ section + FAQPage schema:
const dentalFaqs = [
  { question: "What is a stand-alone dental plan (SADP)?", answer: "..." },
  { question: "Are dental plan premiums eligible for ACA premium tax credits?", answer: "No. SADP premiums are not eligible for APTC premium tax credits..." },
  { question: "What is an annual maximum on a dental plan?", answer: "..." },
  { question: "What is a waiting period on a dental plan?", answer: "..." },
  { question: "Does pediatric dental coverage work differently from adult dental?", answer: "..." },
]
```

---

## Cross-Cutting Technical Issues

### CWV / Performance

| Issue | Impact | Severity |
|-------|--------|----------|
| Google Fonts loaded from external CDN in `<head>` | Potential render-blocking; Google recommends `next/font/google` which self-hosts | Medium |
| Hero images (`/images/hero/hero-*.webp`) loaded without `next/image` on homepage | No lazy loading optimization, no LCP preload hint | Medium |
| `formulary/page.tsx` is `'use client'` — entire page content renders client-side | Poor LCP (blank until JS hydrates); bad Core Web Vitals on slow connections | High |
| No `<link rel="preload">` for above-fold images | LCP may be delayed | Low |

### Fonts

```typescript
// Current (not optimal — external CDN request in <head>):
<link href="https://fonts.googleapis.com/css2?family=Public+Sans..." rel="stylesheet" />

// Recommended (self-hosted, preloaded, zero render-blocking):
// In app/layout.tsx:
import { Public_Sans, Lora } from 'next/font/google'
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' })
```

### OG Images

- Layout default OG image: `/og-default.png` — single image for all pages
- State pages, plan pages, and guides use the same generic OG image
- Missed: dynamic OG images per page type would improve click-through from social/AI-shared links
- At minimum: separate OG images for homepage, plans section, formulary, and guides

### Sitemap

- Dynamic sitemaps exist at `/sitemaps/[type]/route.ts` — good
- Verify: formulary pages are included (they're force-dynamic, needs checking)
- Verify: SBM state pages (`/ca/health-insurance-plans`, etc.) are in sitemap

### robots.txt

- Dynamic route exists at `/app/robots.txt/route.ts`
- Should explicitly allow: `/formulary/`, `/plans/`, `/subsidies/`, `/dental/`
- Should disallow: `/api/`, `/admin/` (if any), query-param URLs

### Missing `datePublished` in Guide Frontmatter

Some guides don't have `datePublished` in frontmatter (only `dateModified`). Article schema requires both for Google's freshness signals. Check: `individual-family-health-insurance.md`, `special-enrollment-period.md`.

---

## Schema Library Assessment

The `lib/schema-markup.ts` file is one of the strongest parts of the codebase — comprehensive, type-safe, and purpose-built for ACA content.

### Strengths

- 13 specialized schema builders covering all 10 data pillars
- `MedicalWebPage` with `SpeakableSpecification` — rare and valuable for AI engine extraction
- `FinancialProduct` schema for plans — correct type for insurance products
- `GovernmentService` schema for APTC — signals data origin to AI engines
- `Drug` schema with `rxnorm_id` + `HealthInsurancePlan` linkage — excellent for knowledge graph
- `buildSubsidySchemas()` generates FAQ-per-FPL-tier — very smart for long-tail subsidy queries

### Gaps

| Gap | Affected Pages | Priority |
|-----|---------------|----------|
| `Article` schema never used on guide pages | All `/guides/[slug]` pages | Critical |
| `FAQPage` schema not injected on state landing pages | All `/states/[state]` | High |
| `FAQPage` schema missing from homepage | Homepage | High |
| `FAQPage` missing from dental, plans, subsidies index pages | All index pages | High |
| `Article` schema uses `Organization` author, never `Person` | All article pages | Medium |
| `datePublished` field missing from `ArticleSchema` type | All article-schema pages | Medium |
| No `WebApplication` schema on formulary/tool pages | `/formulary`, `/tools/*` | Medium |
| `Person` schema for operator not defined anywhere | All pages | Medium |
| `isBasedOn` in Article schema links to CMS generic URL, not specific PUF | All data pages | Low |

---

## Prioritized Master Fix List

Sorted by estimated SEO impact (revenue × likelihood × effort ratio).

### P0 — Critical Fixes (do these first, high ROI)

| # | Fix | Affected Pages | Impact |
|---|-----|---------------|--------|
| 1 | Convert `/formulary/page.tsx` from `'use client'` to server component | Formulary index | ⭐⭐⭐⭐⭐ |
| 2 | Add `generateMetadata()` to formulary page (currently falls to layout default) | Formulary index | ⭐⭐⭐⭐⭐ |
| 3 | Change homepage H1 from tagline to keyword-targeted text | Homepage | ⭐⭐⭐⭐ |
| 4 | Make homepage BLUF paragraph visible (remove `sr-only`) | Homepage | ⭐⭐⭐⭐ |
| 5 | Add Article + FAQPage schema to all guide pages (`/guides/[slug]`) | 11 guide pages | ⭐⭐⭐⭐ |
| 6 | Add FAQPage schema to `/states/[state]` pages (schema infrastructure exists, just not wired) | 50 state pages | ⭐⭐⭐⭐ |
| 7 | Add Article + BreadcrumbList schema to `/states/[state]` pages | 50 state pages | ⭐⭐⭐ |

### P1 — Content Depth Fixes (highest information gain uplift)

| # | Fix | Affected Pages | Impact |
|---|-----|---------------|--------|
| 8 | Add educational content block + FAQ section to `/plans` index | Plans index | ⭐⭐⭐⭐⭐ |
| 9 | Add educational content block + FAQ section to `/subsidies` index | Subsidies index | ⭐⭐⭐⭐⭐ |
| 10 | Add FAQ template (5 Q&As) + FAQPage schema to ALL FFM state plan pages | 30 FFM state pages | ⭐⭐⭐⭐⭐ |
| 11 | Add WebApplication schema + FAQPage to formulary page | Formulary | ⭐⭐⭐⭐ |
| 12 | Add homepage FAQ section (5–8 Q&As) + FAQPage schema | Homepage | ⭐⭐⭐⭐ |
| 13 | Add FAQ section + FAQPage schema to dental index | Dental index | ⭐⭐⭐ |
| 14 | Add content template to FFM state plan pages: carrier count, plan count, data-driven intro | 30 FFM state pages | ⭐⭐⭐⭐ |

### P2 — E-E-A-T & Author Attribution

| # | Fix | Affected Pages | Impact |
|---|-----|---------------|--------|
| 15 | Add Person schema for operator (Dave Lee, NPN) to guides, state pages, and homepage | All content pages | ⭐⭐⭐⭐ |
| 16 | Add author byline (name, NPN, licensed states) to all guide pages in HTML | All guide pages | ⭐⭐⭐⭐ |
| 17 | Fix `datePublished` field: add to Article schema and guide frontmatter | All article pages | ⭐⭐⭐ |
| 18 | Fix `dateModified: new Date().toISOString()` in dental index — use static data date | Dental index | ⭐⭐⭐ |
| 19 | Fix generic SBM Medicaid expansion bug (`always returns "expanded"`) | All SBM state pages | ⭐⭐ |

### P3 — Content Quality Improvements

| # | Fix | Affected Pages | Impact |
|---|-----|---------------|--------|
| 20 | Expand all guides to 800+ words; add data table per guide; increase FAQs to 5–8 | 11 guide pages | ⭐⭐⭐⭐ |
| 21 | Add income/subsidy reference table (FPL% → income → monthly APTC) to subsidies index | Subsidies index | ⭐⭐⭐ |
| 22 | Add SBM-specific content templates for all non-CA SBM states (CO, CT, DC, ID, IL, KY, ME, MD, NJ, NM, NV, OR, PA, VA, WA, WA) | 15 SBM state pages | ⭐⭐⭐ |
| 23 | Add disclosure/attribution to external enrollment CTA on state pages | All `/states/[state]` | ⭐⭐ |

### P4 — Technical SEO Polish

| # | Fix | Affected Pages | Impact |
|---|-----|---------------|--------|
| 24 | Migrate Google Fonts from CDN `<link>` to `next/font/google` | Global (layout) | ⭐⭐⭐ |
| 25 | Add `next/image` to homepage hero images (LCP optimization) | Homepage | ⭐⭐⭐ |
| 26 | Add per-page OG images for key page types (not just one global default) | All major pages | ⭐⭐ |
| 27 | Audit sitemap to confirm formulary + SBM state pages are included | Site-wide | ⭐⭐ |
| 28 | Add `WebApplication` schema to all 6 tool pages | `/tools/*` | ⭐⭐ |
| 29 | Add `isAvailableAtOrFrom` or `areaServed` to more data-page schemas | Data pages | ⭐ |

---

## Appendix: Schema Coverage Matrix

| Page Type | BreadcrumbList | Article | FAQPage | Speakable | Person | WebApplication | Dataset |
|-----------|:--------------:|:-------:|:-------:|:---------:|:------:|:--------------:|:-------:|
| Homepage | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| /plans index | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| /[state]/health-insurance-plans (SBM) | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| /[state]/health-insurance-plans (FFM) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| /states/[state] | ❌ (visual only) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| /subsidies index | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| /formulary | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| /guides/[slug] | ✅ (visual) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| /dental index | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| /plans/[state]/[county] | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| /subsidies/[state]/[county] | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| /dental/[state]/[variant] | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| /formulary/[issuer]/[drug] | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| /life-events/[event] | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Summary:** Schema coverage is excellent on deep-level county/drug/plan pages, and catastrophically absent on the high-traffic index pages that get organic discovery traffic. Fix order should be top-of-funnel first (index pages → state pages → guides), then deepen deep-page coverage.

---

*Audit completed: March 2026. Next recommended audit: September 2026 (after open enrollment data refresh).*
