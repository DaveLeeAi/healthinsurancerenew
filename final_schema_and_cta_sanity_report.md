# Final Schema and CTA Sanity Report

**Repo:** HealthInsuranceRenew.com
**Date:** 2026-04-24
**Scope:** Narrow follow-up after the Data Sources / Outbound Links cleanup pass. (1) Remove empty schema leftovers. (2) Verify first-party `applyhealthinsuranceonline.com` enrollment CTAs were not accidentally removed.

---

## Summary

- **Empty schema properties removed:** 2 (both `sameAs: []` in `lib/schema/index.ts`)
- **First-party CTA instances found:** 7 (all `applyhealthinsuranceonline.com` enrollment CTAs in app pages)
- **CTA instances preserved:** 7 (all intact and rendering — none altered by the cleanup pass)
- **CTA instances restored:** 0 (none were removed; no restoration needed)
- **CTA issues found:** 0
- **Compliance-required HealthCare.gov link status:** Intact at [components/trust/index.tsx:128](components/trust/index.tsx#L128)

---

## Schema Cleanup

### Finding 1
- File: `lib/schema/index.ts`
- Line(s): 106 (before edit)
- Issue: Empty `sameAs: []` array left over from the prior pass, where `'https://www.linkedin.com/in/daveleenow'` was removed from the Organization (InsuranceAgency) schema. The empty array adds no information — schema.org treats absence and an empty `sameAs` identically.
- Before:
```ts
    areaServed: getLicensedStates().map((state) => ({
      '@type': 'AdministrativeArea',
      name: state,
    })),
    sameAs: [],
    contactPoint: {
```
- After:
```ts
    areaServed: getLicensedStates().map((state) => ({
      '@type': 'AdministrativeArea',
      name: state,
    })),
    contactPoint: {
```

### Finding 2
- File: `lib/schema/index.ts`
- Line(s): 192 (before edit)
- Issue: Empty `sameAs: []` array left over from the prior pass, where `'https://www.linkedin.com/in/daveleenow'` was removed from the Person (author) schema. Same rationale — omit rather than leave a no-op placeholder.
- Before:
```ts
      {
        '@type': 'Thing',
        name: 'Cost-Sharing Reductions (CSR)',
      },
    ],
    sameAs: [],
  };
}
```
- After:
```ts
      {
        '@type': 'Thing',
        name: 'Cost-Sharing Reductions (CSR)',
      },
    ],
  };
}
```

### Verification of other potential leftovers
- `grep ':\s*\[\s*\]|:\s*\{\s*\}|url:\s*[\'"]?\s*[\'"]?\s*,' lib/schema/**` — **no matches.** No other empty schema arrays or empty objects detected.
- `grep 'dataSourceUrl' app/**` — **no matches.** All deprecated `dataSourceUrl` call-site args were removed in the prior pass.
- `isBasedOn` emissions in `lib/schema-markup.ts` still carry `@type: 'Dataset'` + `name: '...'` — structurally valid Schema.org with no empty placeholders.

---

## First-Party CTA Audit

All seven `applyhealthinsuranceonline.com` enrollment CTAs found in the repo are first-party commercial links to the agency's enrollment platform. Each is still present, rendering as an active `<a href>` element with `target="_blank"` and `rel="noopener noreferrer"`, and was not touched by the prior cleanup pass.

### CTA Finding 1
- File: `app/turning-26-health-insurance-options/page.tsx`
- Line(s): 183–185
- Current Status: **Preserved**
- Exact CTA URL: `https://applyhealthinsuranceonline.com`
- Local URL(s) to Review:
  - `http://localhost:3000/turning-26-health-insurance-options`
- Notes:
  - Rendered inside a numbered action-step list (`<li>` — "Apply within 60 days. Enroll through ApplyHealthInsuranceOnline.com, your state exchange, or your employer's benefits portal."). Intact.

### CTA Finding 2
- File: `app/tools/page.tsx`
- Line(s): 208–215
- Current Status: **Preserved**
- Exact CTA URL: `https://applyhealthinsuranceonline.com`
- Local URL(s) to Review:
  - `http://localhost:3000/tools`
- Notes:
  - Rendered inside an estimates/disclaimer paragraph ("For official numbers and enrollment, visit ApplyHealthInsuranceOnline.com or speak with a licensed agent."). Intact.

### CTA Finding 3
- File: `app/states/[state]/page.tsx`
- Line(s): 562–569
- Current Status: **Preserved**
- Exact CTA URL: `https://applyhealthinsuranceonline.com`
- Local URL(s) to Review:
  - `http://localhost:3000/states/california`
  - `http://localhost:3000/states/texas`
  - `http://localhost:3000/states/florida`
- Notes:
  - Rendered as the primary "Continue to Licensed Enrollment" button CTA on every state page (dynamic route). Intact, styled `bg-slate-800` pill, with "You are leaving HealthInsuranceRenew.com…" disclaimer paragraph beneath it. Previous cleanup removed a separate `SourcesBox` from the same file but did not touch this CTA.

### CTA Finding 4
- File: `app/employer-coverage-unaffordable-2026/page.tsx`
- Line(s): 192–194
- Current Status: **Preserved**
- Exact CTA URL: `https://applyhealthinsuranceonline.com`
- Local URL(s) to Review:
  - `http://localhost:3000/employer-coverage-unaffordable-2026`
- Notes:
  - Rendered inside the "If unaffordable: Apply through…" list item. Intact.

### CTA Finding 5
- File: `app/self-employed-health-insurance-2026/page.tsx`
- Line(s): 201–204
- Current Status: **Preserved**
- Exact CTA URL: `https://applyhealthinsuranceonline.com`
- Local URL(s) to Review:
  - `http://localhost:3000/self-employed-health-insurance-2026`
- Notes:
  - Rendered inside the "Enroll during open enrollment through ApplyHealthInsuranceOnline.com or your state exchange." list item. Intact.

### CTA Finding 6
- File: `app/eligibility-check/page.tsx`
- Line(s): 345–351
- Current Status: **Preserved**
- Exact CTA URL: `https://applyhealthinsuranceonline.com`
- Local URL(s) to Review:
  - `http://localhost:3000/eligibility-check`
- Notes:
  - Rendered inside FAQ answer body ("…or apply through ApplyHealthInsuranceOnline.com"). Intact.

### CTA Finding 7
- File: `app/licensing/page.tsx`
- Line(s): 106–113
- Current Status: **Preserved**
- Exact CTA URL: `https://applyhealthinsuranceonline.com`
- Local URL(s) to Review:
  - `http://localhost:3000/licensing`
- Notes:
  - Rendered as the primary "Continue to Licensed Enrollment" button CTA in a standalone conversion card at the bottom of the licensing page ("Ready to Enroll With a Licensed Agent?"). Intact.

### Additional (non-visible) references — informational only
- `data/config/config.json:15` — `"enrollmentUrl": "https://applyhealthinsuranceonline.com"` — internal config value (not a direct render path), unchanged.
- `docs/audits/site-audit-2026-03.md`, `seo-states.md`, `IP_LEAK_AUDIT.md`, and `data_sources_outbound_links_diff_report.md` — mention the CTA in prose/audit notes. Internal docs; not rendered publicly. No edits needed.

---

## Final Notes

- **No first-party money/enrollment CTA was accidentally deleted or altered** during the prior Data Sources / Outbound Links cleanup. All seven `applyhealthinsuranceonline.com` links remain intact with their original surrounding markup (class names, disclaimers, button styling).
- **The single compliance-required HealthCare.gov link remains intact** at [components/trust/index.tsx:128](components/trust/index.tsx#L128) with its original `href="https://www.healthcare.gov"`, `target="_blank"`, `rel="noopener noreferrer"` attributes and surrounding 45 CFR § 155.220 compliance text.
- **Schema cleanup was limited in scope** to the two empty `sameAs: []` arrays. No other empty fields, empty strings, or structural leftovers were found in `lib/schema/**` or on `app/**` schema call sites.
- **No third-party source references were reintroduced.** No visible "Data Sources" boxes were restored. Scope remained narrow per instructions.
