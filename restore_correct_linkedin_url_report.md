# Restore Correct LinkedIn URL Report

**Repo:** HealthInsuranceRenew.com
**Date:** 2026-04-24
**Scope:** Narrow — restore intentional LinkedIn trust/profile link using only `https://www.linkedin.com/in/daveleeai/`; ensure no occurrence of the wrong `https://www.linkedin.com/in/daveleenow` remains in live code.

---

## Updated Files

### `app/about/author/page.tsx`
- Exact localhost URL to review: `http://localhost:3000/about/author/`
- What changed: Restored the "Connect and verify" trust section (previously removed in the broad cleanup pass). Renamed the heading back from "How to verify" to "Connect and verify". Added a visible LinkedIn link as the first sentence of that paragraph, using the **correct** URL. Rest of the paragraph (NPN self-service verification) preserved unchanged.

### `lib/schema/index.ts`
- Exact localhost URL to review (renders via JSON-LD): `http://localhost:3000/about/author/`
- What changed: Re-added `sameAs` arrays to both schemas, each containing only the correct LinkedIn URL:
  - `getOrganizationSchema()` (InsuranceAgency) — `sameAs: ['https://www.linkedin.com/in/daveleeai/']`
  - `getPersonSchema()` (author/Person) — `sameAs: ['https://www.linkedin.com/in/daveleeai/']`
- The empty `sameAs: []` placeholders removed in the prior sanity pass are replaced with real, populated arrays pointing to the correct profile.

---

## Wrong URL Removed

| File | Occurrence | Status |
|---|---|---|
| `app/about/author/page.tsx` (old L268–275) | `href="https://www.linkedin.com/in/daveleenow"` body link | Already removed in the earlier cleanup pass; **not** reintroduced. |
| `lib/schema/index.ts` (old L106) | `sameAs: ['https://www.linkedin.com/in/daveleenow', ...]` in Organization schema | Already removed in the earlier cleanup pass; **not** reintroduced. |
| `lib/schema/index.ts` (old L192) | `sameAs: ['https://www.linkedin.com/in/daveleenow', ...]` in Person schema | Already removed in the earlier cleanup pass; **not** reintroduced. |

Verification: `grep 'daveleenow' app/** components/** lib/**` → **zero matches** in live code. The string `daveleenow` only appears in historical audit/report markdown files documenting prior state (`data_sources_and_outbound_links_audit.md`, `data_sources_outbound_links_diff_report.md`, `final_schema_and_cta_sanity_report.md`, `IP_LEAK_AUDIT.md`) — internal docs, not public rendering.

---

## Correct URL Restored

### `app/about/author/page.tsx`
- Exact new URL: `https://www.linkedin.com/in/daveleeai/`
- Placement: Body link inside the "Connect and verify" SectionHeading, `target="_blank"` + `rel="noopener noreferrer"`.

### `lib/schema/index.ts` — Organization (InsuranceAgency) schema
- Exact new URL: `https://www.linkedin.com/in/daveleeai/`
- Placement: `sameAs: ['https://www.linkedin.com/in/daveleeai/']` immediately after `areaServed`.

### `lib/schema/index.ts` — Person (author) schema
- Exact new URL: `https://www.linkedin.com/in/daveleeai/`
- Placement: `sameAs: ['https://www.linkedin.com/in/daveleeai/']` as the final property before the closing of the schema object.

Post-edit verification: `grep 'daveleeai' .` returns exactly 3 hits — all in live code (`app/about/author/page.tsx:244`, `lib/schema/index.ts:106`, `lib/schema/index.ts:192`). No occurrences of the wrong URL in live code.

---

## Notes

- Nothing else restored. NIPR, CMS Circle of Champions verify, and other previously-removed outbound links remain removed.
- No visible "Data Sources" boxes restored.
- No third-party source references (KFF, FDA, NovoCare, Pharmacy Times, etc.) reintroduced.
- Compliance-required HealthCare.gov link at [components/trust/index.tsx:128](components/trust/index.tsx#L128) untouched.
- `app/about/author/page.tsx` now has both the visible trust link and matching JSON-LD `sameAs` anchor pointing at the same correct profile, keeping EEAT signals consistent.
