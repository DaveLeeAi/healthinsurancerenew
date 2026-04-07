---
name: formulary-aggregator
description: Aggregates drug formulary data from CMS MR-PUF and SBM carrier JSON files. Triggers on formulary, drug tier, MR-PUF, drugs.json, or SBM formulary fetching.
---

# Skill: Formulary Aggregator

> Aggregates drug formulary data from carrier machine-readable JSON files mandated by CMS.
> Technical MR-PUF references are correct in pipeline context.
> In consumer-facing copy, always use "federal marketplace plan data and plan benefit documents."

---

## Current Coverage (April 2026)

- **320/320 ACA marketplace carriers** — 100% carrier coverage
- **15,245,850 total formulary records** (14,854,187 FFE + 391,663 SBM)
- **46 enrichment files** with PA/QL/ST restriction data (199,438 drugs)
- Formulary URL registry: `data/config/formulary-url-registry-2026.json`

---

## Pipeline Overview

```
FFM States:
  MR-PUF (CSV) → Extract issuer index.json URLs → Crawl index.json
  → Download drugs.json → Normalize → Merge with Plan-PUF → Output

SBM States:
  sbm-source-registry.json → Direct carrier URLs → Download drugs.json
  → Normalize → Merge with Plan-PUF → Output
```

---

## SBM State Fetching

SBM states are NOT in the CMS MR-PUF. Use `data/config/sbm-source-registry.json`.

```bash
python scripts/fetch/fetch_formulary_sbm.py
```

### SBM Coverage: 22 states + DC for PY2026
CA, CO, CT, DC, GA, ID, IL, KY, MA, MD, ME, MN, NJ, NM, NV, NY, OR, PA, RI, VA, VT, WA

---

## Tier Normalization (matches `lib/formulary-helpers.ts`)

| Group | Consumer Label | Cost Range | Sort |
|-------|---------------|------------|------|
| `preventive` | Preventive ($0 on eligible plans) | $0 | 0 |
| `generic` | Generic (low cost) | $5–$20 | 1 |
| `preferred-brand` | Preferred brand (moderate cost) | $30–$60 | 2 |
| `non-preferred-brand` | Non-preferred brand (higher cost) | $60–$100+ | 3 |
| `specialty` | Specialty (highest cost) | $100–$500+ | 4 |
| `unknown` | See plan documents | Varies | 5 |

Always use **"per month"** — never "per fill", "per pen", or "per unit".

---

## Tier Override Rules

- **TIER-ONE / TIER-ONE-B** → Generic
- **Insulin + PREVENTIVE** → `insulin-ira` ($35 cap per IRA)
- **Biologic blocklist (17 drugs) + PREVENTIVE** → Specialty
- **Unknown tiers** → logged via `console.warn`, classified as `unknown`

---

## CMS JSON Schema Reference

Spec: [github.com/CMSgov/QHP-provider-formulary-APIs](https://github.com/CMSgov/QHP-provider-formulary-APIs)

CMS mandates every QHP issuer publish: `index.json`, `drugs.json`, `plans.json`, `providers.json`.
We use `drugs.json` for formulary intelligence.

---

## Known Issues

- ~46% of issuers have errors in MR files (broken URLs, invalid JSON)
- Some `drugs.json` files are 500MB+ — stream and process in chunks
- Some issuers use non-standard keys or nesting in `index.json`
- RxNorm IDs may be missing on some records — log but don't discard

---

## Rate Limiting

| Parameter | Value |
|-----------|-------|
| Max concurrent requests | 5 |
| Delay between issuers | 1 second minimum |
| Per-request timeout | 60 seconds |
| Max retries per URL | 3 (exponential backoff) |

---

## Priority Drugs for Validation

| Drug | Category | Why Priority |
|------|----------|-------------|
| Metformin | Diabetes (generic) | Most prescribed diabetes drug |
| Ozempic (semaglutide) | Diabetes/weight loss | High demand, coverage varies |
| Eliquis (apixaban) | Blood thinner (brand) | High cost, tier varies |
| Humira (adalimumab) | Autoimmune (specialty) | Specialty tier test |
| Lisinopril | Blood pressure (generic) | Universally covered baseline |
| Atorvastatin | Cholesterol (generic) | Should be Tier 1 everywhere |
