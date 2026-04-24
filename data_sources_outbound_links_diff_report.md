# Data Sources / Outbound Links Diff Report

**Repo:** HealthInsuranceRenew.com
**Date:** 2026-04-24
**Source of truth:** `data_sources_and_outbound_links_audit.md`, `healthcare_gov_compliance_link_audit.md`
**Scope:** Narrow. Remove public "Data Sources" / "Sources" / "Data Provenance" boxes, third-party source references, and non-required outbound links. Preserve only the compliance-required HealthCare.gov link in `components/trust/index.tsx`.

---

## Summary

| Metric | Count |
|---|---|
| Total files edited | 37 |
| Visible source boxes removed (rendered-HTML) | 18 (17 SourcesBox call sites + 1 inline "Data Sources" block in `app/about/page.tsx`) |
| DataSourceAttribution JSX blocks removed (guides) | 29 |
| Outbound links (`<a href>`) removed | 6 (CMS Elite verify link, NIPR ×3, LinkedIn, law.cornell.edu 26 U.S.C. §36B) |
| Third-party references removed (sources/links) | 13 blocks: KFF ×9, NovoCare.com ×3, Ozempic.com ×1, Pharmacy Times ×1, Peterson-KFF Health System Tracker ×1, SERFF ×1, NAIC ×1, CBO ×1, Congress.gov ×1, LinkedIn ×3 (2 schema sameAs + 1 author body) |
| Government outbound links removed (non-compliance) | 35+ distinct URLs across `isBasedOn`, `dataSourceUrl`, sameAs, Certification `issuedBy`, source arrays — covering cms.gov, irs.gov, aspe.hhs.gov, medicaid.gov, medicare.gov, dol.gov, fda.gov, congress.gov, law.cornell.edu |
| Source notes simplified to high-level wording | `public/llms.txt` (section retitled "Data", body shortened to one sentence) |
| Compliance-required live links preserved | 1 — HealthCare.gov in `components/trust/index.tsx` CMSDisclaimer |

**Public outbound link audit after edits:** `grep -n 'href="https' app/** components/**` returns only: (a) `https://www.healthcare.gov` in `components/trust/index.tsx:128` (preserved); (b) `https://applyhealthinsuranceonline.com` — first-party agency enrollment CTA (not a data-source attribution, out of scope for this pass); (c) `https://fonts.googleapis.com` / `https://fonts.gstatic.com` preconnect hints in `app/layout.tsx` (not visible attribution).

---

## Edited Files

---

### File: `components/SourcesBox.tsx`
- Local URL(s) to Review: Shared component — previously rendered on:
  - `http://localhost:3000/aca-income-guide-2026`
  - `http://localhost:3000/fpl-2026`
  - `http://localhost:3000/tools/income-savings-calculator`
- Route Type: Shared Component
- What Changed: Neutralized shared component to return `null`.

#### Before
```tsx
export default function SourcesBox({ sources }: { sources: Source[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 my-6">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Sources</p>
      <ul className="space-y-1">
        {sources.map((source, i) => (
          <li key={i}>
            <a href={source.url} target="_blank" rel="noopener noreferrer" ...>{source.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

#### After
```tsx
export default function SourcesBox(_: { sources: Source[] }) {
  return null
}
```

#### Action Type
- Removed source box (neutralized component — defensive, belt-and-suspenders)

---

### File: `components/trust/index.tsx`
- Local URL(s) to Review: Shared component — previously rendered in guide pages:
  - `http://localhost:3000/guides/aca-subsidy-cliff-2026`
  - `http://localhost:3000/guides/glp-1-drugs-covered-by-aca-plans`
  - `http://localhost:3000/guides/bronze-vs-silver-plan-2026`
- Route Type: Shared Component — `DataSourceAttribution` export
- What Changed: Neutralized `DataSourceAttribution` to return `null`. `CMSDisclaimer` + HealthCare.gov compliance link preserved unchanged.

#### Before
```tsx
export function DataSourceAttribution({ sources }: DataSourceAttributionProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-4 mt-6 mb-6">
      <p className="text-sm font-semibold text-slate-700 mb-2">Data Sources</p>
      <ul>...sources mapped to <a href={source.url}> links...</ul>
    </div>
  );
}
```

#### After
```tsx
export function DataSourceAttribution(_props: DataSourceAttributionProps) {
  return null;
}
```

#### Action Type
- Removed source box (neutralized shared component)

---

### File: `app/aca-income-guide-2026/page.tsx`
- Local URL(s) to Review:
  - `http://localhost:3000/aca-income-guide-2026`
- Route Type: Direct Page
- What Changed: Removed `SourcesBox` import, `const sources = [...]` array (IRS + Medicaid.gov), `<SourcesBox sources={sources} />` JSX, and `dataSourceUrl` schema argument.

#### Before
```tsx
import SourcesBox from '../../components/SourcesBox'
...
const sources = [
  { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/...' },
  { title: 'Medicaid.gov - Eligibility', url: 'https://www.medicaid.gov/medicaid/eligibility/index.html' },
]
...
dataSourceUrl: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit',
...
<PageFaq faqs={faqs} />
<SourcesBox sources={sources} />
```

#### After
```tsx
// imports + sources array + SourcesBox JSX + dataSourceUrl all removed
<PageFaq faqs={faqs} />
```

#### Action Type
- Removed source box
- Removed outbound link (2 government URLs)
- Removed schema/metadata outbound reference

---

### File: `app/csr-explained-2026/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/csr-explained-2026`
- Route Type: Direct Page
- What Changed: Removed `SourcesBox` import, sources array (CMS CCIIO + IRS), JSX call, and `dataSourceUrl` schema arg.

#### Before
```tsx
const sources = [
  { title: 'Federal Actuarial Value Standards', url: 'https://www.cms.gov/cciio/...' },
  { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/...' },
]
...
dataSourceUrl: 'https://www.cms.gov/cciio/.../minimum-essential-coverage',
```

#### After
```tsx
// all removed
```

#### Action Type
- Removed source box
- Removed outbound link (government)
- Removed schema/metadata outbound reference

---

### File: `app/employer-coverage-unaffordable-2026/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/employer-coverage-unaffordable-2026`
- Route Type: Direct Page
- What Changed: Removed SourcesBox import + sources array (IRS + CMS fact sheet) + JSX.

#### Before / After
Before: `const sources = [ IRS employer shared responsibility URL, CMS fact sheet URL ]` + `<SourcesBox sources={sources} />`.
After: all removed.

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/eligibility-check/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/eligibility-check`
- Route Type: Direct Page
- What Changed: Removed SourcesBox import + sources array (IRS + Medicaid.gov) + JSX.

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/early-retirement-health-insurance-2026/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/early-retirement-health-insurance-2026`
- Route Type: Direct Page
- What Changed: Removed SourcesBox import + sources array (IRS ×2 + Medicare.gov) + JSX.

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/fpl-2026/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/fpl-2026`
- Route Type: Direct Page
- What Changed: Removed SourcesBox import + sources array (ASPE/HHS) + JSX + `dataSourceUrl` schema arg.

#### Action Type
- Removed source box
- Removed outbound link (government)
- Removed schema/metadata outbound reference

---

### File: `app/turning-26-health-insurance-options/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/turning-26-health-insurance-options`
- Route Type: Direct Page
- What Changed: Removed SourcesBox import + sources array (IRS Premium Tax Credit) + JSX.

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/lost-job-health-insurance-2026/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/lost-job-health-insurance-2026`
- Route Type: Direct Page
- What Changed: Removed SourcesBox import + sources array (DOL + Medicaid.gov) + JSX.

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/self-employed-health-insurance-2026/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/self-employed-health-insurance-2026`
- Route Type: Direct Page
- What Changed: Removed SourcesBox import + sources array (IRS ×2) + JSX.

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/guides/[slug]/page.tsx`
- Local URL(s) to Review: Dynamic route `http://localhost:3000/guides/[slug]` — applies to any CMS-sourced guide slug served via this dynamic page
- Route Type: Dynamic Page / Shared Template
- What Changed: Removed SourcesBox import + inline `<SourcesBox sources={[...]}/>` (IRS - Affordable Care Act).

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/tools/income-savings-calculator/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/tools/income-savings-calculator`
- Route Type: Direct Page (Tool)
- What Changed: Removed SourcesBox import + inline SourcesBox JSX (ASPE/HHS + IRS).

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/tools/what-income-counts/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/tools/what-income-counts`
- Route Type: Direct Page (Tool)
- What Changed: Removed SourcesBox import + inline SourcesBox JSX (IRS MAGI + IRS PTC).

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/tools/family-coverage-estimator/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/tools/family-coverage-estimator`
- Route Type: Direct Page (Tool)
- What Changed: Removed SourcesBox import + inline SourcesBox JSX (IRS PTC).

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/tools/csr-estimator/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/tools/csr-estimator`
- Route Type: Direct Page (Tool)
- What Changed: Removed SourcesBox import + inline SourcesBox JSX (CMS CCIIO + IRS PTC).

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/tools/job-plan-affordability/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/tools/job-plan-affordability`
- Route Type: Direct Page (Tool)
- What Changed: Removed SourcesBox import + inline SourcesBox JSX (IRS Employer Shared Responsibility).

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/tools/plan-comparison/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/tools/plan-comparison`
- Route Type: Direct Page (Tool)
- What Changed: Removed SourcesBox import + inline SourcesBox JSX (CMS CCIIO Marketplace PUF).

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/states/[state]/page.tsx`
- Local URL(s) to Review: Dynamic route — representative examples:
  - `http://localhost:3000/states/california` (was CMS + Covered California)
  - `http://localhost:3000/states/texas` (was CMS only)
- Route Type: Dynamic Page / Shared Template
- What Changed: Removed SourcesBox import + `<SourcesBox sources={[...CMS URL + conditional SBM exchange URL...]}/>` JSX. Eliminates per-state exposure of 19 SBM state exchange URLs.

#### Action Type
- Removed source box
- Removed outbound link (government federal + state-operated exchanges)

---

### File: `app/guides/aca-subsidy-cliff-2026/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/guides/aca-subsidy-cliff-2026`
- Route Type: Direct Page (Guide)
- What Changed: Removed `DataSourceAttribution` import and 6 JSX call blocks (IRS Rev Proc ×2, CMS.gov, HHS Poverty Guidelines, KFF + CBO, Congress.gov, State Exchange Reports/CMS).

#### Before (example block)
```tsx
<DataSourceAttribution
  sources={[
    { name: 'KFF Analysis', url: 'https://www.kff.org/health-reform/', description: 'Marketplace premium impact estimates' },
    { name: 'Congressional Budget Office', url: 'https://www.cbo.gov/', description: 'Coverage loss projections' },
  ]}
/>
```

#### After
Block fully removed.

#### Action Type
- Removed source box
- Removed third-party reference (KFF, CBO)
- Removed outbound link (government + third-party)

---

### File: `app/guides/glp-1-drugs-covered-by-aca-plans/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/guides/glp-1-drugs-covered-by-aca-plans`
- Route Type: Direct Page (Guide)
- What Changed: Removed DataSourceAttribution import + 6 JSX call blocks (FDA, KFF + CMS, CMS Formulary Data, KFF, CMS + Pharmacy Times, NovoCare.com).

#### Action Type
- Removed source box
- Removed third-party reference (KFF ×3, Pharmacy Times, NovoCare.com)
- Removed outbound link (government + third-party)

---

### File: `app/guides/does-aca-cover-ozempic-2026/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/guides/does-aca-cover-ozempic-2026`
- Route Type: Direct Page (Guide)
- What Changed: Removed DataSourceAttribution import + 7 JSX call blocks (KFF + CMS ×3, CMS BALANCE + IRA, NovoCare, CMS Marketplace, NovoCare + Ozempic.com).

#### Action Type
- Removed source box
- Removed third-party reference (KFF ×3, NovoCare ×2, Ozempic.com)
- Removed outbound link (government + third-party)

---

### File: `app/guides/bronze-vs-silver-plan-2026/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/guides/bronze-vs-silver-plan-2026`
- Route Type: Direct Page (Guide)
- What Changed: Removed DataSourceAttribution import + 5 JSX call blocks (CMS, Peterson-KFF Health System Tracker + CMS, KFF + CMS CSR, IRS ×2, KFF Silver Loading).

#### Action Type
- Removed source box
- Removed third-party reference (Peterson-KFF Health System Tracker, KFF ×2)
- Removed outbound link (government + third-party)

---

### File: `app/guides/how-to-read-your-sbc/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/guides/how-to-read-your-sbc`
- Route Type: Direct Page (Guide)
- What Changed: Removed DataSourceAttribution import + 5 JSX call blocks (all CMS Marketplace URLs).

#### Action Type
- Removed source box
- Removed outbound link (government)

---

### File: `app/about/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/about`
- Route Type: Direct Page
- What Changed: Removed inline "Data Sources" labeled styled box (text-only CMS attribution).

#### Before
```tsx
<div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-4 mt-6 mb-6">
  <p className="text-sm font-semibold text-slate-700 mb-2">Data Sources</p>
  <p className="text-sm text-slate-600">
    <span className="font-medium text-slate-700">Centers for Medicare &amp; Medicaid Services:</span>
    Plan benefit data, enrollment statistics, marketplace regulations
  </p>
</div>
```

#### After
Block fully removed.

#### Action Type
- Removed source box

---

### File: `app/about/author/page.tsx`
- Local URL(s) to Review: `http://localhost:3000/about/author/`
- Route Type: Direct Page
- What Changed: Removed 3 outbound links (CMS.gov Circle of Champions verify link, NIPR license lookup ×3, LinkedIn). Retitled "Connect and verify" → "How to verify". Kept factual credential statements as plain text; no NPN or licensing content weakened.

#### Before (excerpt)
```tsx
<a href="https://www.cms.gov/marketplace/agents-brokers/circle-champions" ...>Verify on CMS.gov →</a>
...
<a href="https://nipr.com/help/look-up-a-license" ...>National Insurance Producer Registry →</a>
...
<a href="https://www.linkedin.com/in/daveleenow" ...>LinkedIn</a>
```

#### After (excerpt)
```tsx
// CMS verify link: removed entirely; credential description preserved as plain text
// NPN line: "NPN: 7578729 — verifiable through the National Insurance Producer Registry."
// License paragraph: "Each license can be verified through the respective state Department of Insurance."
// LinkedIn paragraph replaced with plain "How to verify" paragraph naming NPN for self-service verification
```

#### Action Type
- Removed outbound link (government — CMS circle-champions page)
- Removed outbound link (third-party — NIPR ×3)
- Removed outbound link (third-party — LinkedIn)
- Removed third-party reference (LinkedIn)

---

### File: `app/enhanced-credits/[state]/[county]/page.tsx`
- Local URL(s) to Review: Dynamic route — representative example:
  - `http://localhost:3000/enhanced-credits/nc/37183`
- Route Type: Dynamic Page
- What Changed: (1) Removed law.cornell.edu outbound link on 26 U.S.C. §36B citation (kept citation text inline, dropped hyperlink). (2) Removed `dataSourceUrl: 'https://www.cms.gov/marketplace'` from Article schema.

#### Before
```tsx
<a href="https://www.law.cornell.edu/uscode/text/26/36B" target="_blank" rel="noopener noreferrer">
  26 U.S.C. &sect; 36B(b)(3)(A)
</a>
```

#### After
```tsx
26 U.S.C. &sect; 36B(b)(3)(A)
```

#### Action Type
- Removed outbound link (third-party — Cornell LII)
- Removed third-party reference (law.cornell.edu)
- Removed schema/metadata outbound reference

---

### File: `lib/schema-markup.ts`
- Local URL(s) to Review: Schema helpers consumed by many routes. Representative affected pages:
  - `http://localhost:3000/states/texas` (Article `isBasedOn`)
  - `http://localhost:3000/rates/nc/37183` (Rate volatility dataset `isBasedOn`)
  - `http://localhost:3000/enhanced-credits/nc/37183` (Enhanced credits dataset `isBasedOn`)
  - Any page that calls `buildArticleSchema()` with `dataSourceUrl`
- Route Type: Schema/Metadata (affects all consumers)
- What Changed: (1) Stripped `url:` field from all three `isBasedOn` Dataset emitters (state plans article, rate volatility dataset, enhanced credits dataset). (2) `buildArticleSchema` now ignores `dataSourceUrl` param (retained on signature as `@deprecated` for caller compatibility) and emits `isBasedOn` without `url`.

#### Before (example — rate volatility)
```ts
isBasedOn: {
  '@type': 'Dataset',
  name: 'Federal Marketplace Rate Filings',
  url: 'https://www.cms.gov/marketplace',
}
```

#### After
```ts
isBasedOn: {
  '@type': 'Dataset',
  name: 'Federal Marketplace Rate Filings',
}
```

#### Action Type
- Removed schema/metadata outbound reference (×3 isBasedOn sites + `buildArticleSchema` builder)

---

### File: `lib/schema/index.ts`
- Local URL(s) to Review: Sitewide — emits Organization + Person JSON-LD
- Route Type: Schema/Metadata
- What Changed: (1) Emptied `sameAs: [...]` arrays on Organization (InsuranceAgency) and Person (author) schemas — removed `https://www.linkedin.com/in/daveleenow` (×2). (2) Removed `url: 'https://www.cms.gov'` from the CMS Elite Circle of Champions Certification `issuedBy` GovernmentOrganization; the organization name is retained.

#### Before
```ts
sameAs: [
  'https://www.linkedin.com/in/daveleenow',
  // Add other social profiles here
],
...
issuedBy: {
  '@type': 'GovernmentOrganization',
  name: 'Centers for Medicare & Medicaid Services',
  url: 'https://www.cms.gov',
},
```

#### After
```ts
sameAs: [],
...
issuedBy: {
  '@type': 'GovernmentOrganization',
  name: 'Centers for Medicare & Medicaid Services',
},
```

#### Action Type
- Removed schema/metadata outbound reference
- Removed third-party reference (LinkedIn ×2)
- Removed outbound link (government — cms.gov in Certification issuer)

---

### File: `lib/content-templates.ts`
- Local URL(s) to Review: Shared template module — consumed by rate volatility, life events, and other programmatic content builders. Dead-code `dataSourcesHtml` return value is not rendered on any public page; edits documented for moat protection.
- Route Type: Shared Template
- What Changed: (1) Neutralized `buildDataSourcesHtml()` to return empty string. (2) Deleted `SERFF_SOURCE` constant (`https://www.serff.com`) and `STATE_DOI_SOURCE` constant (`https://www.naic.org/state_web_map.htm`). (3) Removed SERFF/STATE_DOI references from the two builder arrays that used them (rate-volatility builder at line 705 and life-events builder at line 1099).

#### Before (excerpt)
```ts
export function buildDataSourcesHtml(sources: DataSourceEntry[]): string {
  const items = sources
    .map((s) => `<li><strong>${s.name}</strong> — ${s.description}. <a href="${s.url}" ...>View source</a></li>`)
    .join('\n    ')
  return `<section class="data-sources" aria-labelledby="data-sources-heading">
    <h2 id="data-sources-heading">Data Sources</h2>...`.trim()
}
const SERFF_SOURCE: DataSourceEntry = { name: 'SERFF Rate Filing Database', url: 'https://www.serff.com', ... }
const STATE_DOI_SOURCE: DataSourceEntry = { name: 'State Department of Insurance Publications', url: 'https://www.naic.org/state_web_map.htm', ... }
```

#### After
```ts
export function buildDataSourcesHtml(_sources: DataSourceEntry[]): string {
  return ''
}
// SERFF_SOURCE and STATE_DOI_SOURCE constants deleted
// buildDataSourcesHtml call sites updated to remove SERFF/STATE_DOI references
```

#### Action Type
- Removed source box (neutralized dead-code HTML emitter)
- Removed third-party reference (SERFF, NAIC)
- Removed outbound link (third-party — serff.com, naic.org)

---

### Files: `dataSourceUrl` arguments removed from `buildArticleSchema()` call sites (13 files)

Each of the following pages had its `dataSourceUrl: '...'` argument removed from the `buildArticleSchema({...})` call. `dataSourceName` was retained where present. Because `buildArticleSchema` no longer emits a `url` in `isBasedOn`, the URL argument was unused — stripping it from call sites removes the literal URL string from the compiled bundle.

| File | URL removed | Route Type | Representative Local URL |
|---|---|---|---|
| `app/aca-income-guide-2026/page.tsx` | `https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit` | Direct | `http://localhost:3000/aca-income-guide-2026` |
| `app/csr-explained-2026/page.tsx` | `https://www.cms.gov/cciio/.../minimum-essential-coverage` | Direct | `http://localhost:3000/csr-explained-2026` |
| `app/fpl-2026/page.tsx` | `https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines` | Direct | `http://localhost:3000/fpl-2026` |
| `app/billing/page.tsx` | `https://www.cms.gov/nosurprises` | Direct | `http://localhost:3000/billing` |
| `app/billing/[cpt_code]/page.tsx` | `https://www.cms.gov/nosurprises` | Dynamic | `http://localhost:3000/billing/99213` |
| `app/dental/page.tsx` | `https://www.cms.gov/marketplace` | Direct | `http://localhost:3000/dental` |
| `app/dental/[state]/[plan_variant]/page.tsx` | `https://www.cms.gov/marketplace` | Dynamic | `http://localhost:3000/dental/nc/example` |
| `app/enhanced-credits/page.tsx` | `https://www.cms.gov/marketplace` | Direct | `http://localhost:3000/enhanced-credits` |
| `app/enhanced-credits/[state]/page.tsx` | `https://www.cms.gov/marketplace` | Dynamic | `http://localhost:3000/enhanced-credits/nc` |
| `app/enhanced-credits/[state]/[county]/page.tsx` | `https://www.cms.gov/marketplace` | Dynamic | `http://localhost:3000/enhanced-credits/nc/37183` |
| `app/rates/[state]/[county]/page.tsx` | `https://www.cms.gov/marketplace` | Dynamic | `http://localhost:3000/rates/nc/37183` |
| `app/[state-name]/[county-slug]/page.tsx` | `https://www.cms.gov/marketplace` | Dynamic | `http://localhost:3000/north-carolina/mecklenburg-county` |
| `app/[state-name]/[county-slug]/[county-page]/page.tsx` | `https://www.cms.gov/marketplace` (×2) | Dynamic | `http://localhost:3000/north-carolina/mecklenburg-county/plans` |
| `app/faq/[category]/[slug]/page.tsx` | `https://www.cms.gov/marketplace/resources` | Dynamic | `http://localhost:3000/faq/enrollment/example-slug` |

#### Action Type
- Removed schema/metadata outbound reference

---

### File: `public/llms.txt`
- Local URL(s) to Review: `http://localhost:3000/llms.txt`
- Route Type: Public Artifact (LLM crawler instructions)
- What Changed: Retitled section from `## Data Provenance` to `## Data`. Replaced two-sentence body referencing "official CMS data... updated annually following CMS release cycles" with one-sentence high-level note: "Based on official CMS data and plan documents." No outbound links added or removed (section was already text-only).

#### Before
```
## Data Provenance

Plan, rate, subsidy, and formulary data are based on official CMS data.
Data is updated annually following CMS release cycles.
```

#### After
```
## Data

Based on official CMS data and plan documents.
```

#### Action Type
- Replaced with high-level CMS note

---

## Preserved Compliance Link(s)

### File: `components/trust/index.tsx`
- Line(s): 127–134
- Local URL(s) to Review (representative — renders on every page including `CMSDisclaimer`):
  - `http://localhost:3000/guides/aca-subsidy-cliff-2026`
  - `http://localhost:3000/about/methodology/`
  - `http://localhost:3000/` (any content page)
- Reason Preserved:
  - Compliance-required live link per Finding 1 of `healthcare_gov_compliance_link_audit.md`: federally mandated non-Exchange / web-broker disclosure under 45 CFR §§ 155.220(c) and (d), which directs consumers to the Health Insurance Marketplace® website. Only outbound link intentionally retained.
- Exact preserved code:
```tsx
<a
  href="https://www.healthcare.gov"
  className="text-blue-600 hover:underline"
  target="_blank"
  rel="noopener noreferrer"
>
  HealthCare.gov
</a>
```

---

## Shared Component / Template Impact

| Shared file | Representative localhost URLs | Downstream impact |
|---|---|---|
| `components/SourcesBox.tsx` | `/aca-income-guide-2026`, `/fpl-2026`, `/tools/income-savings-calculator`, `/states/[state]`, `/tools/plan-comparison` | Neutralized to `return null`. Any remaining import/usage (now also removed from 17 call sites) is a harmless no-op. |
| `components/trust/index.tsx` — `DataSourceAttribution` | `/guides/aca-subsidy-cliff-2026`, `/guides/glp-1-drugs-covered-by-aca-plans`, `/guides/does-aca-cover-ozempic-2026`, `/guides/bronze-vs-silver-plan-2026`, `/guides/how-to-read-your-sbc` | Neutralized to `return null`. `CMSDisclaimer` + preserved HealthCare.gov compliance link untouched. |
| `components/trust/index.tsx` — `CMSDisclaimer` | Renders sitewide on every content page that includes it | No changes. Compliance text + healthcare.gov link preserved exactly. |
| `lib/schema-markup.ts` — `buildArticleSchema` | All pages using Article schema (guides, billing, dental, enhanced-credits, rates, state-level county pages, FAQ) | Signature unchanged; `dataSourceUrl` now `@deprecated` and ignored. `isBasedOn` emits only `{@type, name}` — no URL. |
| `lib/schema-markup.ts` — `buildStatePlansArticleSchema` / `buildRateVolatilityDatasetSchema` / enhanced-credits dataset schema | `/states/[state]`, `/rates/[state]/[county]`, `/enhanced-credits/[state]/[county]` | `isBasedOn.url` removed from all three. |
| `lib/schema/index.ts` — `getOrganizationSchema` / `getPersonSchema` | Sitewide JSON-LD graph | `sameAs` arrays emptied (LinkedIn removed). Certification `issuedBy` no longer carries cms.gov URL. |
| `lib/content-templates.ts` — `buildDataSourcesHtml` + constants | Dead-code path (never rendered); used by rate_volatility and life_events builders to set `dataSourcesHtml` field that is not consumed by any page | Function now returns `''`. `SERFF_SOURCE` and `STATE_DOI_SOURCE` constants deleted entirely. |

---

## Notes

- **Author body content** retained factual credential statements (NPN 7578729, licensed states, CMS Elite Circle of Champions) as plain text with no hyperlinks. The "Connect and verify" section was renamed "How to verify" and reduced to a single plain-text paragraph pointing the reader to NPN-based self-service verification.
- **26 U.S.C. §36B citation** in the enhanced-credits page remains as inline text; only the `law.cornell.edu` hyperlink was removed.
- **First-party enrollment CTAs** (`https://applyhealthinsuranceonline.com`) were left in place on several pages. These are the agency's own commercial enrollment channel, not third-party source attribution; out of scope for this pass.
- **Google Fonts preconnect hints** (`fonts.googleapis.com`, `fonts.gstatic.com`) in `app/layout.tsx` are performance directives, not visible outbound source references; left as-is.
- **`lib/plan-sources/source-registry.ts`** retains `dataSourceUrl` values for internal data-fetching logic. These strings are not consumed by any remaining public rendering path: `app/states/[state]/page.tsx` (formerly rendered SBM exchange URLs via SourcesBox in Finding 62) had its SourcesBox call removed. Exchange URLs now stay in the data layer only.
- **No new third-party references were introduced.** No PUF / public-use-files / source-equivalence language added.
- **Schema validity preserved.** `isBasedOn` remains a valid `Dataset` reference with `@type` and `name` (URL is optional per schema.org). `sameAs: []` is empty but structurally valid. `issuedBy` still names the issuing organization.
- Internal audit/governance docs (`data_sources_and_outbound_links_audit.md`, `IP_LEAK_AUDIT.md`, `docs/HIR-*`, `cms_data_puf_healthcare.md`) were not edited — they are internal reference material and not part of the public rendering surface.
