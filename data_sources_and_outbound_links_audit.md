# Data Sources and Outbound Links Audit

**Repo:** HealthInsuranceRenew.com  
**Audit date:** 2026-04-24  
**Scope:** All public-facing rendered content — app/**, components/**, lib/**, public/**  
**Method:** Read-only. No edits made.

---

## Summary

- **Total findings:** 65
- **Visible Data Sources Blocks (A):** 22
- **CMS / Government Source Mentions (B):** 13
- **Third-Party / Non-CMS Source Mentions (C):** 15
- **Outbound Links (D):** 10
- **Public Schema / Metadata Outbound References (E):** 5

> **Note on dead code (Finding 4):** `buildDataSourcesHtml()` in `lib/content-templates.ts` (lines 134–154) renders a full `<h2>Data Sources</h2>` block including SERFF (`https://www.serff.com`) and NAIC (`https://www.naic.org/state_web_map.htm`) links. However, none of the page files (`app/**/*.tsx`) reference the returned `dataSourcesHtml` field. Only `editorial.bodyHtml` is passed to `dangerouslySetInnerHTML`. These source URLs therefore do **not** currently render publicly. Documented here because the code exists and could become active if any page adds `dataSourcesHtml` rendering.

---

## Findings

---

### Finding 1

- **Classification:** Visible Data Sources Block
- **File:** `components/SourcesBox.tsx`
- **Line(s):** 1–26
- **Public Surface:** Shared Component
- **Matched Text:** `<p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Sources</p>` — renders a labeled "Sources" box with `href={source.url}` links, `target="_blank"`
- **Domain (if link exists):** Varies per call-site (see Findings 10–26)
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Both — depends on source URLs passed by each page
- **Affected Route Type:** Shared Component
- **Representative Local URL(s):**
  - `http://localhost:3000/aca-income-guide-2026`
  - `http://localhost:3000/fpl-2026`
  - `http://localhost:3000/tools/income-savings-calculator`
- **Notes:**
  - Used on 17+ pages. Each page passes its own `sources` array. See Findings 10–26 for per-page source URLs.

---

### Finding 2

- **Classification:** Visible Data Sources Block
- **File:** `components/trust/index.tsx`
- **Line(s):** 203–246
- **Public Surface:** Shared Component
- **Matched Text:** `<p className="text-sm font-semibold text-slate-700 mb-2">Data Sources</p>` — renders a labeled "Data Sources" box with `href={source.url}` links, `target="_blank"`
- **Domain (if link exists):** Varies per call-site (see Findings 27–55)
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Both — depends on source URLs passed by each guide page
- **Affected Route Type:** Shared Component — `DataSourceAttribution` export
- **Representative Local URL(s):**
  - `http://localhost:3000/guides/aca-subsidy-cliff-2026`
  - `http://localhost:3000/guides/glp-1-drugs-covered-by-aca-plans`
  - `http://localhost:3000/guides/bronze-vs-silver-plan-2026`
- **Notes:**
  - Used exclusively in individual guide pages. See Findings 27–55 for each rendered block and its source URLs.

---

### Finding 3

- **Classification:** Outbound Link
- **File:** `components/trust/index.tsx`
- **Line(s):** 127–135
- **Public Surface:** Shared Component — `CMSDisclaimer` export
- **Matched Text:** `<a href="https://www.healthcare.gov" ... target="_blank" rel="noopener noreferrer">HealthCare.gov</a>`
- **Domain:** `healthcare.gov`
- **Link Type:** Body Link (disclaimer text)
- **CMS vs Non-CMS:** CMS / Government
- **Affected Route Type:** Shared Component — renders on every page that includes `<CMSDisclaimer />`
- **Representative Local URL(s):**
  - `http://localhost:3000/guides/aca-subsidy-cliff-2026`
  - `http://localhost:3000/about/methodology/`
  - `http://localhost:3000/` (homepage if CMSDisclaimer used there)
- **Notes:**
  - CMS-required compliance text. Link appears at the bottom of every content page that includes CMSDisclaimer.

---

### Finding 4

- **Classification:** Visible Data Sources Block
- **File:** `lib/content-templates.ts`
- **Line(s):** 134–154, 208–218
- **Public Surface:** Shared Template (DEAD CODE — not currently rendered)
- **Matched Text:** `<h2 id="data-sources-heading">Data Sources</h2>` ... includes `SERFF_SOURCE` (`https://www.serff.com`) and `STATE_DOI_SOURCE` (`https://www.naic.org/state_web_map.htm`)
- **Domain (if link exists):** `serff.com`, `naic.org`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Third-Party / Non-CMS — SERFF (Vertafore commercial product) and NAIC (insurance industry org)
- **Local URL(s) to Review:** Not currently resolvable — `dataSourcesHtml` field is returned by template functions but never referenced by any `app/**` page file
- **Notes:**
  - `buildDataSourcesHtml()` is called at lines 705–710 and 1099 but the returned `dataSourcesHtml` property is never consumed in any TSX page. If any page adds `dangerouslySetInnerHTML={{ __html: editorial.dataSourcesHtml }}`, SERFF and NAIC links would become public. Currently inert.

---

### Finding 5

- **Classification:** Visible Data Sources Block
- **File:** `app/about/page.tsx`
- **Line(s):** 189–199
- **Public Surface:** Body
- **Matched Text:**
  ```
  <p className="text-sm font-semibold text-slate-700 mb-2">Data Sources</p>
  <span className="font-medium text-slate-700">Centers for Medicare &amp; Medicaid Services:</span>
  Plan benefit data, enrollment statistics, marketplace regulations
  ```
- **Domain (if link exists):** None — text-only, no hyperlink
- **Link Type:** N/A (no link)
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/about`
- **Notes:**
  - Named "Data Sources" heading in a styled box. Text attribution only; no outbound link attached to this box.

---

### Finding 6

- **Classification:** CMS / Government Source Mention
- **File:** `app/about/methodology/page.tsx`
- **Line(s):** 89–92, 105–109
- **Public Surface:** Body
- **Matched Text:**
  - Line 90–92: `Information on HealthInsuranceRenew.com is based on official CMS data and other government guidance, reviewed by a licensed ACA agent`
  - Line 105–109: `Plan, rate, benefit, and subsidy information is based on official CMS data and related federal and state government guidance. Where we reference outside research or policy analysis, the source is named directly in the content.`
- **Domain (if link exists):** None — text-only references
- **Link Type:** N/A
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/about/methodology/`
- **Notes:**
  - Methodology page states the attribution policy. No outbound links in these lines.

---

### Finding 7

- **Classification:** Outbound Link
- **File:** `app/about/author/page.tsx`
- **Line(s):** 159–166
- **Public Surface:** Body
- **Matched Text:** `<a href="https://www.cms.gov/marketplace/agents-brokers/circle-champions" ... target="_blank">Verify on CMS.gov →</a>`
- **Domain:** `cms.gov`
- **Link Type:** Body Link
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/about/author/`
- **Notes:**
  - Credential verification link for CMS Elite Circle of Champions recognition.

---

### Finding 8

- **Classification:** Outbound Link
- **File:** `app/about/author/page.tsx`
- **Line(s):** 177, 199, 278
- **Public Surface:** Body
- **Matched Text:**
  - Line 177: `<a href="https://nipr.com/help/look-up-a-license" ...>National Insurance Producer Registry →</a>`
  - Line 199: `<a href="https://nipr.com/help/look-up-a-license" ...>NIPR license lookup</a>`
  - Line 278: `<a href="https://nipr.com/help/look-up-a-license" ...>National Insurance Producer Registry</a>`
- **Domain:** `nipr.com`
- **Link Type:** Body Link
- **CMS vs Non-CMS:** Third-Party / Non-CMS — NIPR is a non-government industry registry operated by NAIC
- **Local URL(s) to Review:**
  - `http://localhost:3000/about/author/`
- **Notes:**
  - Three separate instances on the same page. All link to the same NIPR license lookup URL.

---

### Finding 9

- **Classification:** Outbound Link
- **File:** `app/about/author/page.tsx`
- **Line(s):** 268–275
- **Public Surface:** Body
- **Matched Text:** `<a href="https://www.linkedin.com/in/daveleenow" ... target="_blank" rel="noopener noreferrer">LinkedIn</a>`
- **Domain:** `linkedin.com`
- **Link Type:** Body Link
- **CMS vs Non-CMS:** Third-Party / Non-CMS
- **Local URL(s) to Review:**
  - `http://localhost:3000/about/author/`
- **Notes:**
  - Personal LinkedIn profile link. Comment in code reads `{/* TODO: Add real profile links */}` immediately above this link.

---

### Finding 10

- **Classification:** Visible Data Sources Block
- **File:** `app/aca-income-guide-2026/page.tsx`
- **Line(s):** 73–75, 257
- **Public Surface:** Body
- **Matched Text:**
  ```
  const sources = [
    { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
    { title: 'Medicaid.gov - Eligibility', url: 'https://www.medicaid.gov/medicaid/eligibility/index.html' },
  ]
  ```
  Rendered via `<SourcesBox sources={sources} />` (line 257)
- **Domain:** `irs.gov`, `medicaid.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (both)
- **Local URL(s) to Review:**
  - `http://localhost:3000/aca-income-guide-2026`

---

### Finding 11

- **Classification:** Visible Data Sources Block
- **File:** `app/csr-explained-2026/page.tsx`
- **Line(s):** 78–81, 271
- **Public Surface:** Body
- **Matched Text:**
  ```
  const sources = [
    { title: 'Federal Actuarial Value Standards', url: 'https://www.cms.gov/cciio/programs-and-initiatives/health-insurance-market-reforms/minimum-essential-coverage' },
    { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
  ]
  ```
- **Domain:** `cms.gov`, `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (both)
- **Local URL(s) to Review:**
  - `http://localhost:3000/csr-explained-2026`

---

### Finding 12

- **Classification:** Visible Data Sources Block
- **File:** `app/eligibility-check/page.tsx`
- **Line(s):** 69–72, 365
- **Public Surface:** Body
- **Matched Text:**
  ```
  const sources = [
    { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
    { title: 'Federal Medicaid Expansion Data', url: 'https://www.medicaid.gov/medicaid/national-medicaid-chip-program-information/medicaid-chip-enrollment-data/index.html' },
  ]
  ```
- **Domain:** `irs.gov`, `medicaid.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (both)
- **Local URL(s) to Review:**
  - `http://localhost:3000/eligibility-check`

---

### Finding 13

- **Classification:** Visible Data Sources Block
- **File:** `app/early-retirement-health-insurance-2026/page.tsx`
- **Line(s):** 70–74, 235
- **Public Surface:** Body
- **Matched Text:**
  ```
  const sources = [
    { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
    { title: 'Medicare.gov - When to Sign Up', url: 'https://www.medicare.gov/basics/get-started-with-medicare/sign-up/when-does-medicare-coverage-start' },
    { title: 'IRS - Modified Adjusted Gross Income', url: 'https://www.irs.gov/e-file-providers/definition-of-adjusted-gross-income' },
  ]
  ```
- **Domain:** `irs.gov`, `medicare.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (all)
- **Local URL(s) to Review:**
  - `http://localhost:3000/early-retirement-health-insurance-2026`

---

### Finding 14

- **Classification:** Visible Data Sources Block
- **File:** `app/lost-job-health-insurance-2026/page.tsx`
- **Line(s):** 79–82, 212
- **Public Surface:** Body
- **Matched Text:**
  ```
  const sources = [
    { title: 'DOL - COBRA Information', url: 'https://www.dol.gov/general/topic/health-plans/cobra' },
    { title: 'Medicaid.gov', url: 'https://www.medicaid.gov/' },
  ]
  ```
- **Domain:** `dol.gov`, `medicaid.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (both)
- **Local URL(s) to Review:**
  - `http://localhost:3000/lost-job-health-insurance-2026`

---

### Finding 15

- **Classification:** Visible Data Sources Block
- **File:** `app/employer-coverage-unaffordable-2026/page.tsx`
- **Line(s):** 70–72, 222
- **Public Surface:** Body
- **Matched Text:**
  ```
  const sources = [
    { title: 'IRS - Employer Shared Responsibility', url: 'https://www.irs.gov/affordable-care-act/employers/employer-shared-responsibility-provisions' },
  ]
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/employer-coverage-unaffordable-2026`

---

### Finding 16

- **Classification:** Visible Data Sources Block
- **File:** `app/self-employed-health-insurance-2026/page.tsx`
- **Line(s):** 70–73, 229
- **Public Surface:** Body
- **Matched Text:**
  ```
  const sources = [
    { title: 'IRS - Self-Employed Health Insurance Deduction', url: 'https://www.irs.gov/taxtopics/tc502' },
    { title: 'IRS - HSA Contribution Limits', url: 'https://www.irs.gov/publications/p969' },
  ]
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/self-employed-health-insurance-2026`

---

### Finding 17

- **Classification:** Visible Data Sources Block
- **File:** `app/fpl-2026/page.tsx`
- **Line(s):** 88–90, 221
- **Public Surface:** Body
- **Matched Text:**
  ```
  const sources = [
    { title: 'HHS 2026 Federal Poverty Guidelines', url: 'https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines' },
  ]
  ```
- **Domain:** `aspe.hhs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (HHS/ASPE)
- **Local URL(s) to Review:**
  - `http://localhost:3000/fpl-2026`

---

### Finding 18

- **Classification:** Visible Data Sources Block
- **File:** `app/turning-26-health-insurance-options/page.tsx`
- **Line(s):** 70–72, 222
- **Public Surface:** Body
- **Matched Text:**
  ```
  const sources = [
    { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
  ]
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/turning-26-health-insurance-options`

---

### Finding 19

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/[slug]/page.tsx`
- **Line(s):** 141–143
- **Public Surface:** Shared Template — all CMS-sourced guide slug pages
- **Matched Text:**
  ```
  <SourcesBox sources={[
    { title: 'IRS - Affordable Care Act', url: 'https://www.irs.gov/affordable-care-act' },
  ]} />
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Route Pattern:** `http://localhost:3000/guides/[slug]`
- **Best Example(s):** Any guide page served via the `[slug]` dynamic route (not one of the individually-coded guide files)
- **Why unresolved:** Route depends on CMS content entries; exact slugs not enumerable from code alone.

---

### Finding 20

- **Classification:** Visible Data Sources Block
- **File:** `app/states/[state]/page.tsx`
- **Line(s):** 579–589
- **Public Surface:** Shared Template
- **Matched Text:**
  ```
  <SourcesBox
    sources={[
      { title: 'Federal Marketplace Data', url: 'https://www.cms.gov/marketplace' },
      ...(stateConfig?.ownExchange && stateConfig.exchangeUrl
        ? [{ title: exchange, url: stateConfig.exchangeUrl }]
        : []),
    ]}
  />
  ```
- **Domain:** `cms.gov` always; plus state exchange domain conditionally for SBM states
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (federal); state exchanges vary (government for state-operated exchanges)
- **Route Pattern:** `http://localhost:3000/states/[state]`
- **Best Example(s):**
  - `http://localhost:3000/states/california` (CMS + Covered California)
  - `http://localhost:3000/states/texas` (CMS only)
- **Notes:**
  - SBM state exchange URLs pulled from `stateConfig.exchangeUrl` at runtime. These are the 19 state exchange domains listed in Finding 62.

---

### Finding 21

- **Classification:** Visible Data Sources Block
- **File:** `app/tools/plan-comparison/page.tsx`
- **Line(s):** 159–161
- **Public Surface:** Tool
- **Matched Text:**
  ```
  <SourcesBox sources={[
    { title: 'Federal Actuarial Value and Cost Sharing Standards', url: 'https://www.cms.gov/cciio/resources/data-resources/marketplace-puf' },
  ]} />
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/tools/plan-comparison`

---

### Finding 22

- **Classification:** Visible Data Sources Block
- **File:** `app/tools/csr-estimator/page.tsx`
- **Line(s):** 251–254
- **Public Surface:** Tool
- **Matched Text:**
  ```
  { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/tools/csr-estimator`

---

### Finding 23

- **Classification:** Visible Data Sources Block
- **File:** `app/tools/income-savings-calculator/page.tsx`
- **Line(s):** 249–252
- **Public Surface:** Tool
- **Matched Text:**
  ```
  { title: 'Federal Poverty Level Guidelines - ASPE', url: 'https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines' },
  { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
  ```
- **Domain:** `aspe.hhs.gov`, `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (both)
- **Local URL(s) to Review:**
  - `http://localhost:3000/tools/income-savings-calculator`

---

### Finding 24

- **Classification:** Visible Data Sources Block
- **File:** `app/tools/family-coverage-estimator/page.tsx`
- **Line(s):** 258–260
- **Public Surface:** Tool
- **Matched Text:**
  ```
  { title: 'IRS - Premium Tax Credit', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/tools/family-coverage-estimator`

---

### Finding 25

- **Classification:** Visible Data Sources Block
- **File:** `app/tools/job-plan-affordability/page.tsx`
- **Line(s):** 238–240
- **Public Surface:** Tool
- **Matched Text:**
  ```
  { title: 'IRS - Employer Health Plan Affordability', url: 'https://www.irs.gov/affordable-care-act/employers/employer-shared-responsibility-provisions' },
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/tools/job-plan-affordability`

---

### Finding 26

- **Classification:** Visible Data Sources Block
- **File:** `app/tools/what-income-counts/page.tsx`
- **Line(s):** 263–266
- **Public Surface:** Tool
- **Matched Text:**
  ```
  { title: 'IRS - Modified Adjusted Gross Income (MAGI)', url: 'https://www.irs.gov/e-file-providers/definition-of-adjusted-gross-income' },
  { title: 'IRS - Premium Tax Credit Eligibility', url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit' },
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/tools/what-income-counts`

---

### Finding 27

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/aca-subsidy-cliff-2026/page.tsx`
- **Line(s):** 130–135
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  <DataSourceAttribution
    sources={[
      { name: 'IRS Revenue Procedure 2025-25', url: 'https://www.irs.gov/irb/2025-25_IRB' },
      { name: 'CMS.gov', url: 'https://www.cms.gov/marketplace' },
    ]}
  />
  ```
- **Domain:** `irs.gov`, `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (both)
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/aca-subsidy-cliff-2026`

---

### Finding 28

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/aca-subsidy-cliff-2026/page.tsx`
- **Line(s):** 170–174
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'IRS Revenue Procedure 2025-25', url: 'https://www.irs.gov/irb/2025-25_IRB', description: 'Applicable percentage table for 2026' },
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/aca-subsidy-cliff-2026`

---

### Finding 29

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/aca-subsidy-cliff-2026/page.tsx`
- **Line(s):** 244–248
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'HHS Poverty Guidelines', url: 'https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines', description: 'Federal Register, 2025 guidelines' },
  ```
- **Domain:** `aspe.hhs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (HHS/ASPE)
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/aca-subsidy-cliff-2026`

---

### Finding 30

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/aca-subsidy-cliff-2026/page.tsx`
- **Line(s):** 299–304
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'KFF Analysis', url: 'https://www.kff.org/health-reform/', description: 'Marketplace premium impact estimates' },
  { name: 'Congressional Budget Office', url: 'https://www.cbo.gov/', description: 'Coverage loss projections' },
  ```
- **Domain:** `kff.org`, `cbo.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Third-Party / Non-CMS — KFF (nonprofit research); CBO (federal but non-CMS/non-HHS)
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/aca-subsidy-cliff-2026`
- **Notes:**
  - KFF (Kaiser Family Foundation) is a private nonprofit. CBO (Congressional Budget Office) is a federal agency, but neither CMS nor an insurance regulatory body.

---

### Finding 31

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/aca-subsidy-cliff-2026/page.tsx`
- **Line(s):** 326–330
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'Congress.gov', url: 'https://www.congress.gov/', description: 'H.R. 5145 status' },
  ```
- **Domain:** `congress.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (official government legislative site)
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/aca-subsidy-cliff-2026`

---

### Finding 32

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/aca-subsidy-cliff-2026/page.tsx`
- **Line(s):** 346–350
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'State Exchange Reports', url: 'https://www.cms.gov/marketplace', description: 'State-level subsidy replacement programs' },
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/aca-subsidy-cliff-2026`

---

### Finding 33

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/glp-1-drugs-covered-by-aca-plans/page.tsx`
- **Line(s):** 195–199
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'FDA Drug Approvals', url: 'https://www.fda.gov/drugs', description: 'FDA-approved indications and approval dates' },
  ```
- **Domain:** `fda.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (FDA is a federal agency, part of HHS)
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/glp-1-drugs-covered-by-aca-plans`

---

### Finding 34

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/glp-1-drugs-covered-by-aca-plans/page.tsx`
- **Line(s):** 240–245
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'KFF Marketplace Formulary Analysis', url: 'https://www.kff.org/health-reform/' },
  { name: 'Federal EHB Framework', url: 'https://www.cms.gov/marketplace' },
  ```
- **Domain:** `kff.org`, `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Mixed — KFF is Third-Party / Non-CMS; CMS is CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/glp-1-drugs-covered-by-aca-plans`

---

### Finding 35

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/glp-1-drugs-covered-by-aca-plans/page.tsx`
- **Line(s):** 267–271
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'Federal Formulary Data', url: 'https://www.cms.gov/marketplace' },
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/glp-1-drugs-covered-by-aca-plans`

---

### Finding 36

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/glp-1-drugs-covered-by-aca-plans/page.tsx`
- **Line(s):** 294–298
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'KFF', url: 'https://www.kff.org/health-reform/' },
  ```
- **Domain:** `kff.org`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Third-Party / Non-CMS — KFF is a private nonprofit
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/glp-1-drugs-covered-by-aca-plans`

---

### Finding 37

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/glp-1-drugs-covered-by-aca-plans/page.tsx`
- **Line(s):** 334–338
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'State Exchange Data', url: 'https://www.cms.gov/marketplace', description: 'EHB benchmark plans by state' },
  { name: 'Pharmacy Times', url: 'https://www.pharmacytimes.com/', description: 'State mandate tracking' },
  ```
- **Domain:** `cms.gov`, `pharmacytimes.com`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Mixed — CMS is government; Pharmacy Times is a trade publication (Third-Party / Non-CMS)
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/glp-1-drugs-covered-by-aca-plans`

---

### Finding 38

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/glp-1-drugs-covered-by-aca-plans/page.tsx`
- **Line(s):** 369–373
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'NovoCare.com', url: 'https://www.novocare.com/', description: 'Self-pay and PAP pricing' },
  ```
- **Domain:** `novocare.com`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Third-Party / Non-CMS — NovoCare is Novo Nordisk's patient services program (pharmaceutical manufacturer)
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/glp-1-drugs-covered-by-aca-plans`

---

### Finding 39

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/does-aca-cover-ozempic-2026/page.tsx`
- **Line(s):** 154–159
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'KFF Marketplace Formulary Analysis', url: 'https://www.kff.org/health-reform/', description: 'Coverage rate estimates' },
  { name: 'Federal Essential Health Benefits Framework', url: 'https://www.cms.gov/marketplace', description: 'EHB framework and USP categories' },
  ```
- **Domain:** `kff.org`, `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Mixed — KFF is Third-Party; CMS is government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/does-aca-cover-ozempic-2026`

---

### Finding 40

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/does-aca-cover-ozempic-2026/page.tsx`
- **Line(s):** 186–191
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'KFF Formulary Analysis', url: 'https://www.kff.org/health-reform/' },
  { name: 'Federal Formulary Data', url: 'https://www.cms.gov/marketplace' },
  ```
- **Domain:** `kff.org`, `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Mixed
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/does-aca-cover-ozempic-2026`

---

### Finding 41

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/does-aca-cover-ozempic-2026/page.tsx`
- **Line(s):** 222–227
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'CMS CY2026 Final Rule', url: 'https://www.cms.gov/marketplace', description: 'USP classification decision' },
  { name: 'KFF Marketplace Formulary Analysis', url: 'https://www.kff.org/health-reform/' },
  ```
- **Domain:** `cms.gov`, `kff.org`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Mixed — CMS government, KFF third-party
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/does-aca-cover-ozempic-2026`

---

### Finding 42

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/does-aca-cover-ozempic-2026/page.tsx`
- **Line(s):** 256–261
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'CMS BALANCE Model', url: 'https://www.cms.gov/', description: 'Medicare/Medicaid GLP-1 program' },
  { name: 'IRA Drug Negotiation Program', url: 'https://www.cms.gov/inflation-reduction-act-and-medicare' },
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government (both)
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/does-aca-cover-ozempic-2026`

---

### Finding 43

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/does-aca-cover-ozempic-2026/page.tsx`
- **Line(s):** 292–296
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'Novo Nordisk / NovoCare.com', url: 'https://www.novocare.com/', description: 'Self-pay and PAP pricing' },
  ```
- **Domain:** `novocare.com`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Third-Party / Non-CMS — pharmaceutical manufacturer
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/does-aca-cover-ozempic-2026`

---

### Finding 44

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/does-aca-cover-ozempic-2026/page.tsx`
- **Line(s):** 318–322
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'CMS Marketplace Guidance', url: 'https://www.cms.gov/marketplace' },
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/does-aca-cover-ozempic-2026`

---

### Finding 45

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/does-aca-cover-ozempic-2026/page.tsx`
- **Line(s):** 344–349
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'NovoCare.com', url: 'https://www.novocare.com/', description: 'Patient assistance and savings programs' },
  { name: 'Ozempic.com', url: 'https://www.ozempic.com/', description: 'Savings card details' },
  ```
- **Domain:** `novocare.com`, `ozempic.com`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Third-Party / Non-CMS — both are Novo Nordisk manufacturer/brand sites
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/does-aca-cover-ozempic-2026`

---

### Finding 46

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/bronze-vs-silver-plan-2026/page.tsx`
- **Line(s):** 140–144
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'CMS', url: 'https://www.cms.gov/marketplace', description: 'Metal tier definitions' },
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/bronze-vs-silver-plan-2026`

---

### Finding 47

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/bronze-vs-silver-plan-2026/page.tsx`
- **Line(s):** 177–182
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'Peterson-KFF Health System Tracker', url: 'https://www.healthsystemtracker.org/', description: 'Premium and deductible averages' },
  { name: 'CMS 2026 Payment Notice', url: 'https://www.cms.gov/marketplace', description: 'Out-of-pocket maximum revision' },
  ```
- **Domain:** `healthsystemtracker.org`, `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Mixed — Peterson-KFF Health System Tracker is a joint project of Peterson Center on Healthcare (private foundation) and KFF (nonprofit); CMS is government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/bronze-vs-silver-plan-2026`

---

### Finding 48

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/bronze-vs-silver-plan-2026/page.tsx`
- **Line(s):** 226–231
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'KFF', url: 'https://www.kff.org/health-reform/', description: 'CSR enrollment and benefit analysis' },
  { name: 'Federal Cost-Sharing Reduction Guidelines', url: 'https://www.cms.gov/marketplace' },
  ```
- **Domain:** `kff.org`, `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Mixed
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/bronze-vs-silver-plan-2026`

---

### Finding 49

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/bronze-vs-silver-plan-2026/page.tsx`
- **Line(s):** 258–263
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'IRS Notice 2026-5', url: 'https://www.irs.gov/', description: 'OBBBA HSA provisions' },
  { name: 'IRS Revenue Procedure 2025-19', url: 'https://www.irs.gov/', description: '2026 HSA limits' },
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/bronze-vs-silver-plan-2026`
- **Notes:**
  - Both link to `https://www.irs.gov/` (root domain) rather than specific document pages.

---

### Finding 50

- **Classification:** Third-Party / Non-CMS Source Mention
- **File:** `app/guides/bronze-vs-silver-plan-2026/page.tsx`
- **Line(s):** 283–287
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'KFF Silver Loading Analysis', url: 'https://www.kff.org/health-reform/', description: 'How CSR loading affects benchmark premiums' },
  ```
- **Domain:** `kff.org`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** Third-Party / Non-CMS — KFF
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/bronze-vs-silver-plan-2026`

---

### Finding 51

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/how-to-read-your-sbc/page.tsx`
- **Line(s):** 127–132
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'CMS SBC Template', url: 'https://www.cms.gov/marketplace', description: 'Uniform SBC template requirements' },
  { name: 'ACA Section 2715', url: 'https://www.cms.gov/marketplace', description: 'Public Health Service Act amendment' },
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/how-to-read-your-sbc`

---

### Finding 52

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/how-to-read-your-sbc/page.tsx`
- **Line(s):** 185–189
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'CMS SBC Template', url: 'https://www.cms.gov/marketplace' },
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/how-to-read-your-sbc`

---

### Finding 53

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/how-to-read-your-sbc/page.tsx`
- **Line(s):** 227–231
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'CMS Uniform Glossary', url: 'https://www.cms.gov/marketplace', description: 'Standardized health insurance terms' },
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/how-to-read-your-sbc`

---

### Finding 54

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/how-to-read-your-sbc/page.tsx`
- **Line(s):** 258–262
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'CMS SBC Template', url: 'https://www.cms.gov/marketplace', description: 'Standardized coverage example scenarios' },
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/how-to-read-your-sbc`

---

### Finding 55

- **Classification:** Visible Data Sources Block
- **File:** `app/guides/how-to-read-your-sbc/page.tsx`
- **Line(s):** 290–294
- **Public Surface:** Guide Body
- **Matched Text:**
  ```
  { name: 'CMS Marketplace', url: 'https://www.cms.gov/marketplace', description: 'Plan lookup and SBC access' },
  ```
- **Domain:** `cms.gov`
- **Link Type:** Source Box
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/guides/how-to-read-your-sbc`

---

### Finding 56

- **Classification:** Outbound Link
- **File:** `app/enhanced-credits/[state]/[county]/page.tsx`
- **Line(s):** 278–285
- **Public Surface:** Body
- **Matched Text:**
  ```
  <a
    href="https://www.law.cornell.edu/uscode/text/26/36B"
    className="text-primary-600 hover:underline"
    target="_blank"
    rel="noopener noreferrer"
  >
    26 U.S.C. § 36B(b)(3)(A)
  </a>
  ```
- **Domain:** `law.cornell.edu`
- **Link Type:** Body Link
- **CMS vs Non-CMS:** Third-Party / Non-CMS — Cornell LII (Legal Information Institute, non-government legal repository)
- **Route Pattern:** `http://localhost:3000/enhanced-credits/[state]/[county]`
- **Best Example(s):**
  - `http://localhost:3000/enhanced-credits/nc/37183`
- **Why unresolved:** Route requires valid state + county FIPS combinations from the data set.

---

### Finding 57

- **Classification:** CMS / Government Source Mention
- **File:** `components/plan/PlanAuthorityBlock.tsx`
- **Line(s):** 22–25, 52–56
- **Public Surface:** Shared Component — renders on all plan detail pages
- **Matched Text:**
  - Line 22–25: `Plan benefit and cost-sharing data on this page is based on official CMS data, subject to the ACA regulatory framework (42 U.S.C. § 18021; 45 CFR Part 156).`
  - Line 52–56: `IRS Rev. Proc. 2024-35 (FPL tables and applicable percentages, plan year {planYear}).`
- **Domain (if link exists):** No external links in this component — internal links to `/about/editorial-standards` and `/about/methodology/` only
- **Link Type:** Body Link (internal only)
- **CMS vs Non-CMS:** CMS / Government
- **Route Pattern:** All plan detail pages
- **Best Example(s):**
  - Route uncertain — plan detail page URL structure not fully confirmed
- **Notes:**
  - Regulatory CFR and USC citations are text-only. No outbound hyperlinks in this component.

---

### Finding 58

- **Classification:** Public Schema / Metadata Outbound Reference
- **File:** `lib/schema-markup.ts`
- **Line(s):** 175–179
- **Public Surface:** JSON-LD
- **Matched Text:**
  ```json
  "isBasedOn": {
    "@type": "Dataset",
    "name": "Federal Marketplace Plan Data",
    "url": "https://www.cms.gov/marketplace"
  }
  ```
  Emitted by `buildStatePlansArticleSchema()`, used in `app/states/[state]/page.tsx`
- **Domain:** `cms.gov`
- **Link Type:** Schema Link
- **CMS vs Non-CMS:** CMS / Government
- **Route Pattern:** `http://localhost:3000/states/[state]`
- **Best Example(s):**
  - `http://localhost:3000/states/texas`

---

### Finding 59

- **Classification:** Public Schema / Metadata Outbound Reference
- **File:** `lib/schema-markup.ts`
- **Line(s):** 454–459
- **Public Surface:** JSON-LD
- **Matched Text:**
  ```json
  "isBasedOn": {
    "@type": "Dataset",
    "name": "Federal Marketplace Rate Filings",
    "url": "https://www.cms.gov/marketplace"
  }
  ```
  Emitted by `buildRateVolatilityDatasetSchema()`, used in `app/rates/[state]/[county]/page.tsx`
- **Domain:** `cms.gov`
- **Link Type:** Schema Link
- **CMS vs Non-CMS:** CMS / Government
- **Route Pattern:** `http://localhost:3000/rates/[state]/[county]`
- **Best Example(s):**
  - `http://localhost:3000/rates/nc/37183`

---

### Finding 60

- **Classification:** Public Schema / Metadata Outbound Reference
- **File:** `lib/schema-markup.ts`
- **Line(s):** 746–750
- **Public Surface:** JSON-LD
- **Matched Text:**
  ```json
  "isBasedOn": {
    "@type": "Dataset",
    "name": "Federal Marketplace Rate Data and IRS Income Guidelines",
    "url": "https://www.cms.gov/marketplace"
  }
  ```
  Emitted by the enhanced-credits dataset schema builder, used in `app/enhanced-credits/[state]/[county]/page.tsx`
- **Domain:** `cms.gov`
- **Link Type:** Schema Link
- **CMS vs Non-CMS:** CMS / Government
- **Route Pattern:** `http://localhost:3000/enhanced-credits/[state]/[county]`
- **Best Example(s):**
  - `http://localhost:3000/enhanced-credits/nc/37183`

---

### Finding 61

- **Classification:** Public Schema / Metadata Outbound Reference
- **File:** `app/aca-income-guide-2026/page.tsx`
- **Line(s):** 88
- **Public Surface:** JSON-LD (Article schema `dataSourceUrl`)
- **Matched Text:**
  ```
  dataSourceUrl: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit',
  ```
  Passed to `buildArticleSchema()` which emits it as `isBasedOn.url` in JSON-LD
- **Domain:** `irs.gov`
- **Link Type:** Schema Link
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/aca-income-guide-2026`

---

### Finding 62

- **Classification:** Public Schema / Metadata Outbound Reference
- **File:** `lib/plan-sources/source-registry.ts`
- **Line(s):** 58–100
- **Public Surface:** JSON-LD (propagated through schema builders at render time)
- **Matched Text (abbreviated):**
  ```
  FEDERAL_SOURCE_ENTRY.dataSourceUrl: 'https://www.cms.gov/marketplace/resources/data/public-use-files'

  SBM_EXCHANGE_INFO:
    CA → https://www.coveredca.com
    CO → https://connectforhealthco.com
    CT → https://www.accesshealthct.com
    DC → https://dchealthlink.com
    ID → https://yourhealthidaho.org
    KY → https://kynect.ky.gov
    MA → https://www.mahealthconnector.org
    MD → https://www.marylandhealthconnection.gov
    ME → https://coverme.gov
    MN → https://www.mnsure.org
    NJ → https://www.getcovered.nj.gov
    NM → https://www.bewellnm.com
    NV → https://www.nevadahealthlink.com
    NY → https://nystateofhealth.ny.gov
    OR → https://healthcare.oregon.gov
    PA → https://pennie.com
    RI → https://healthsourceri.com
    VT → https://portal.healthconnect.vermont.gov
    WA → https://www.wahealthplanfinder.org
  ```
- **Domain:** `cms.gov` + 19 state exchange domains
- **Link Type:** Schema Link
- **CMS vs Non-CMS:** CMS / Government (federal + state-operated exchanges)
- **Route Pattern:** `http://localhost:3000/states/[state]` (for SBM states via SourcesBox) and any route using `PlanSourceEntry`
- **Notes:**
  - `FEDERAL_SOURCE_ENTRY.dataSourceUrl` targets the CMS Public Use Files page (more specific than `cms.gov/marketplace`). SBM exchange URLs appear in SourcesBox on state pages (see Finding 20) and potentially in schema.

---

### Finding 63

- **Classification:** Public Schema / Metadata Outbound Reference
- **File:** `app/fpl-2026/page.tsx`
- **Line(s):** 102
- **Public Surface:** JSON-LD (Article schema `dataSourceUrl`)
- **Matched Text:**
  ```
  dataSourceUrl: 'https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines',
  ```
  Passed to `buildArticleSchema()` as `isBasedOn.url`
- **Domain:** `aspe.hhs.gov`
- **Link Type:** Schema Link
- **CMS vs Non-CMS:** CMS / Government (HHS/ASPE)
- **Local URL(s) to Review:**
  - `http://localhost:3000/fpl-2026`

---

### Finding 64

- **Classification:** Visible Data Sources Block
- **File:** `public/llms.txt`
- **Line(s):** 35–38
- **Public Surface:** Public Artifact (LLM crawler instructions)
- **Matched Text:**
  ```
  ## Data Provenance

  Plan, rate, subsidy, and formulary data are based on official CMS data.
  Data is updated annually following CMS release cycles.
  ```
- **Domain (if link exists):** None — text-only in this section
- **Link Type:** N/A
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:**
  - `http://localhost:3000/llms.txt`
- **Notes:**
  - "Data Provenance" is the visible heading label. This file is publicly served and indexed by LLM crawlers. No outbound links within the Data Provenance section.

---

### Finding 65

- **Classification:** CMS / Government Source Mention
- **File:** `lib/content-templates.ts`
- **Line(s):** 202–206
- **Public Surface:** Shared Template (IRS FPL source definition — used in `dataSourcesHtml` which is currently DEAD CODE; also a baseline for understanding what WOULD render)
- **Matched Text:**
  ```
  const IRS_FPL_SOURCE: DataSourceEntry = {
    name: 'IRS Revenue Procedure — Federal Poverty Level Tables',
    url: 'https://www.irs.gov/affordable-care-act/individuals-and-families/aca-premium-tax-credit-2025',
    description: `${PLAN_YEAR} Federal Poverty Level percentages and applicable contribution percentages under IRC Section 36B`,
  }
  ```
- **Domain:** `irs.gov`
- **Link Type:** Source Box (currently not rendered — see Finding 4 note)
- **CMS vs Non-CMS:** CMS / Government
- **Local URL(s) to Review:** Not currently resolvable — dead code
- **Notes:**
  - This is a more specific IRS URL than the root `irs.gov` domain used in SourcesBox instances on live pages. URL targets the 2025 premium tax credit page, which does not match the 2026 plan year.

---

## Appendix — Domains referenced across all findings

| Domain | Type | Count of findings |
|---|---|---|
| `cms.gov` | CMS / Government | 26+ |
| `irs.gov` | CMS / Government | 14+ |
| `aspe.hhs.gov` | CMS / Government (HHS) | 4 |
| `medicaid.gov` | CMS / Government | 3 |
| `healthcare.gov` | CMS / Government | 1 (shared, all pages) |
| `medicare.gov` | CMS / Government | 1 |
| `dol.gov` | CMS / Government | 1 |
| `fda.gov` | CMS / Government (HHS) | 1 |
| `congress.gov` | CMS / Government | 1 |
| `cbo.gov` | Government (non-CMS) | 1 |
| `law.cornell.edu` | Third-Party / Non-CMS | 1 |
| `kff.org` | Third-Party / Non-CMS | 9 |
| `healthsystemtracker.org` | Third-Party / Non-CMS | 1 |
| `pharmacytimes.com` | Third-Party / Non-CMS | 1 |
| `novocare.com` | Third-Party / Non-CMS | 3 |
| `ozempic.com` | Third-Party / Non-CMS | 1 |
| `nipr.com` | Third-Party / Non-CMS | 3 |
| `linkedin.com` | Third-Party / Non-CMS | 1 |
| `serff.com` | Third-Party / Non-CMS | 1 (dead code, Finding 4) |
| `naic.org` | Third-Party / Non-CMS | 1 (dead code, Finding 4) |
| State exchange domains (19) | Government (state-operated) | 1 finding (Finding 62) |
