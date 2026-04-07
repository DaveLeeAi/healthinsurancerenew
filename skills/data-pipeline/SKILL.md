---
name: data-pipeline
description: ACA data fetching, ETL, and validation for CMS Public Use Files. Triggers on PUF, ETL, data pipeline, fetch, transform, or validate.
---

# Skill: ACA Data Pipeline

> Covers all data fetching, ETL, and validation for CMS Public Use Files.
> Technical PUF file names are correct in pipeline/script context.
> In consumer-facing copy, always use "federal marketplace plan data and plan benefit documents" — never specific PUF file names.

---

## Data Coverage (current as of April 2026)

- **50 states + DC** — 320/320 ACA marketplace carriers = 100% carrier coverage
- **15,245,850 total formulary records** (14,854,187 FFE plan-level + 391,663 SBM drug-level)
- **46 enrichment files** with PA/QL/ST restriction data (199,438 drugs)
- **20,354+ SBC plan variants** (FFE + SBM)

---

## Data Sources

### data.healthcare.gov API
- **Base URL:** `https://data.healthcare.gov/api/1/`
- **Dataset catalog:** `https://data.healthcare.gov/api/1/metastore/schemas/dataset/items`
- **CMS PUF page:** `https://www.cms.gov/marketplace/resources/data/public-use-files`

### Key PUF Files

| PUF File | Description | Approx Size |
|----------|-------------|-------------|
| **Rate PUF** | Premium rates by plan, age, tobacco status, rating area | ~2GB |
| **Plan Attributes PUF** | Benefits, cost-sharing, network type, metal level | ~500MB |
| **BenCS PUF** | Benefits and Cost Sharing detail records | ~1GB |
| **MR-PUF** | Machine-Readable file URLs (formulary JSON links) | ~50MB |
| **SADP PUF** | Stand-Alone Dental Plan attributes | ~30MB |
| **QHP Landscape** | Consumer-facing plan comparison data | ~200MB |
| **Service Area PUF** | County-level service area mappings | ~100MB |
| **Rate Review PUF** | Rate change justifications and filings | ~20MB |

---

## SBM States (22 + DC for PY2026)

Full SBM: CA, CO, CT, DC, GA, ID, IL, KY, MA, MD, ME, MN, NJ, NM, NV, NY, OR, PA, RI, VA, VT, WA
SBM states are NOT in the CMS MR-PUF. Formulary data fetched from carrier endpoints.
SBM carrier URLs tracked in: `data/config/sbm-source-registry.json`

---

## Pipeline Commands

### Fetch scripts (`scripts/fetch/`)
```bash
python scripts/fetch/fetch_puf.py              # Download CMS PUF CSVs
python scripts/fetch/fetch_formulary.py         # Fetch FFM formulary JSON
python scripts/fetch/fetch_formulary_full.py    # Full formulary fetch (all issuers)
python scripts/fetch/fetch_formulary_sbm.py     # Fetch SBM state formularies
```

### ETL scripts (`scripts/etl/`)
```bash
python scripts/etl/build_plan_intelligence.py   # → plan_intelligence.json (107 MB)
python scripts/etl/build_sbc_from_puf.py        # → sbc_decoded.json (429 MB, gitignored)
python scripts/etl/build_rate_volatility.py     # → rate_volatility.json (654 KB)
python scripts/etl/build_subsidy_engine.py      # → subsidy_engine.json (2.86 MB)
python scripts/etl/build_dental_coverage.py     # → dental_coverage.json (4.4 MB)
```

### Generate scripts (`scripts/generate/`)
```bash
python scripts/generate/build_friction_qa.py    # → friction_qa.json
python scripts/generate/build_billing_intel.py  # → billing_intel.json
python scripts/generate/build_life_events.py    # → life_events.json
python scripts/generate/build_policy_scenarios.py # → policy_scenarios.json
python scripts/generate/generate_drug_baselines.py # → drug_national_baselines.json (not yet generated)
```

---

## Validation Rules

Every ETL output must pass:
- Record count > 0
- No nulls in required fields (plan_id, state_code, issuer_id)
- Valid state codes, HIOS plan IDs, issuer IDs
- Metal levels in allowed set
- Premiums > 0, < 10000
- No duplicate plan_id + rating_area + age combos

---

## Error Handling

- Retry 3x with exponential backoff on all API calls
- Stream large files — don't load full CSV into memory for downloads
- Use `pandas.read_csv(chunksize=...)` for files > 500MB
- Log every fetch attempt with URL, status code, and response time
- Use `logging` module — never `print()` for operational output

---

## Annual Refresh Process (for 2027 update)

1. Download new PUF CSVs from CMS when published (typically October)
2. Run all `scripts/etl/build_*.py` scripts against new data
3. Update `sbm-source-registry.json` — re-verify all SBM carrier URLs
4. Run `scripts/fetch/fetch_formulary_sbm.py` for SBM states
5. Validate all outputs against schemas
6. Update plan year references in content templates
7. Regenerate `drug_national_baselines.json`
8. Update lastmod dates in sitemap configuration
