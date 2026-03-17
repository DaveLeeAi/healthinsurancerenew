# SBM Formulary Field Map

> Canonical field mapping between SBM issuer JSON schemas and our normalized output.
> Used by `scripts/fetch/fetch_formulary_sbm.py` and the shared `normalize_drug_records()` function.

---

## Canonical Output Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `drug_name` | string | yes | Normalized drug name (see mapping below) |
| `drug_tier` | string | yes | Normalized tier (see tier normalization) |
| `rxnorm_id` | string \| null | no | RxNorm CUI or NDC identifier |
| `issuer_ids` | string[] | yes | Issuer IDs from SBM source registry |
| `prior_authorization` | bool | yes | PA required (default false) |
| `step_therapy` | bool | yes | ST required (default false) |
| `quantity_limit` | bool | yes | QL required (default false) |
| `is_priority_drug` | bool | yes | Computed: matches priority drug list |

---

## Drug Name Field Variants

The `normalize_drug_records()` function checks these field names in order:

| Priority | Field Name | Seen In |
|----------|-----------|---------|
| 1 | `drug_name` | Most FFM issuers, Blue Shield, Kaiser |
| 2 | `drugName` | Some newer CMS-compliant JSON |
| 3 | `name` | Simplified schemas |
| 4 | `drug_label_name` | FDA-sourced datasets |
| — | `label_name` | Rare; not yet seen in SBM |
| — | `proprietary_name` | FDA crosswalk format |
| — | `nonproprietary_name` | Generic name variant |

If `drug_name` is a nested object (e.g., `{"name": "..."}`) the function extracts the inner `name` or `drug_name` key.

---

## RxNorm ID Field Variants

| Priority | Field Name | Seen In |
|----------|-----------|---------|
| 1 | `rxnorm_id` | Most issuers |
| 2 | `rxnormId` | camelCase variant |
| 3 | `rxcui` | RxNorm CUI format |
| 4 | `ndc` | National Drug Code fallback |

---

## Tier Name Normalization

SBM issuers use inconsistent tier labels. `normalize_tier()` maps all variants to canonical names:

| Input Variants | Canonical Output |
|---------------|-----------------|
| `"1"`, `"Tier 1"`, `"tier_1"`, `"Generic"`, `"GEN"` | `GENERIC` |
| `"2"`, `"Tier 2"`, `"Preferred Brand"`, `"Preferred"` | `PREFERRED-BRAND` |
| `"3"`, `"Tier 3"`, `"Non-Preferred"`, `"Non Preferred"` | `NON-PREFERRED-BRAND` |
| `"4"`, `"Tier 4"`, `"Specialty"`, `"SP"` | `SPECIALTY` |
| `"5"`, `"Tier 5"` | `SPECIALTY-HIGH` |
| `"0"`, `"ACA Preventive"`, `"Preventive"` | `ACA-PREVENTIVE-DRUGS` |
| `"PREVENT-DRUGS"` | `PREVENT-DRUGS` |
| `null`, `""` | `UNKNOWN` |
| Anything else | Passed through as-is (uppercased) |

**Note:** The FFM pipeline already outputs tiers like `PREFERRED-BRANDS` (plural). The tier map preserves those as-is to avoid breaking existing data.

---

## Plans Array Variants

The `plans` coverage data within each drug record can appear under:

| Priority | Field Name | Structure |
|----------|-----------|-----------|
| 1 | `plans` | `[{plan_id, drug_tier, prior_authorization, ...}]` |
| 2 | `coverage` | Same structure as `plans` |
| — | `plan_list` | Not yet seen in production |
| — | `formulary_plans` | Not yet seen in production |

If no plans array exists, the drug-level fields are used directly.

---

## PA / ST / QL Field Variants

### Prior Authorization
| Priority | Field Name |
|----------|-----------|
| 1 | `prior_authorization` |
| 2 | `priorAuthorization` |
| — | `prior_auth` |
| — | `pa_required` |

### Step Therapy
| Priority | Field Name |
|----------|-----------|
| 1 | `step_therapy` |
| 2 | `stepTherapy` |
| — | `step_therapy_applies` |
| — | `st_required` |

### Quantity Limit
| Priority | Field Name |
|----------|-----------|
| 1 | `quantity_limit` |
| 2 | `quantityLimit` |
| — | `quantity_limit_applies` |
| — | `ql_required` |

All default to `false` if missing.

---

## Index.json Structure Variants

Carrier index.json files have several common structures:

### Structure A: Flat URL List
```json
{
  "formulary_urls": [
    "https://carrier.com/drugs-2026.json"
  ]
}
```

### Structure B: Nested Reporting Structure
```json
{
  "reporting_structure": [
    {
      "in_network_files": [...],
      "formulary_files": [
        {"description": "...", "location": "https://carrier.com/drugs.json"}
      ]
    }
  ]
}
```

### Structure C: Deep Nested
```json
{
  "formulary_url_list": {
    "2026": {
      "individual": {
        "drugs": "https://carrier.com/individual/drugs.json"
      }
    }
  }
}
```

The `find_formulary_urls()` function handles all three via recursive traversal (max depth 10), looking for URL strings containing "drug" or "formulary" (excluding "provider").

---

## Drugs JSON Structure Variants

Drug data files can be wrapped in several ways:

| Wrapper | Structure |
|---------|-----------|
| Direct array | `[{drug_name, plans, ...}, ...]` |
| `drugs` key | `{"drugs": [...]}` |
| `data` key | `{"data": [...]}` |
| `formulary_drugs` key | `{"formulary_drugs": [...]}` |
| `results` key | `{"results": [...]}` |

`download_and_parse_drugs()` checks all five variants.

---

## SBM vs FFM Differences

| Aspect | FFM (Federal) | SBM (State) |
|--------|--------------|-------------|
| Source | CMS MR-PUF xlsx | sbm-source-registry.json |
| Index URL source | MR-PUF `URL Submitted` column | Manual curation per issuer |
| JSON schema | CMS-mandated 45 CFR 156.230 | Same spec, varied compliance |
| Tier labels | Generally consistent | More variation (see normalize_tier) |
| URL stability | Updated annually, generally stable | More frequent changes |
| Issuer count | ~110 unique URLs | ~5-10 per state |
| Multi-state issuers | Natural (one URL, many states) | Need manual tracking in registry |
