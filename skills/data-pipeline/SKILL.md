---
name: data-pipeline
description: ACA data fetching, ETL, and validation for CMS Public Use Files. Triggers on PUF, ETL, data pipeline, fetch, transform, or validate.
---

# Skill: ACA Data Pipeline

> Covers all data fetching, ETL, and validation for CMS Public Use Files.

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

## Data Coverage Status

### FFM States (Federal Marketplace)
Covered by CMS PUF data — all FFM states are included in the standard pipeline.

### SBM States (State-Based Marketplaces)
SBM states are NOT in the CMS MR-PUF. Formulary data must be fetched directly from carrier endpoints.

| Status | States |
|--------|--------|
| **48 + DC covered** | All FFM states + SBM states with working formulary endpoints |
| **Geo-blocked (3)** | CA, NY, MA — no accessible public formulary endpoints found |

SBM carrier URLs and status tracked in: `data/config/sbm-source-registry.json`

### Annual Refresh Process (for 2027 update)
1. Download new PUF CSVs from CMS when published (typically October)
2. Run all `scripts/etl/build_*.py` scripts against new data
3. Update `sbm-source-registry.json` — re-verify all SBM carrier URLs
4. Run `scripts/fetch/fetch_formulary_sbm.py` for SBM states
5. Validate all outputs against schemas
6. Update plan year references in content templates

---

## Pipeline Commands

### Fetch scripts (`scripts/fetch/`)
```bash
python scripts/fetch/fetch_puf.py              # Download CMS PUF CSVs
python scripts/fetch/fetch_formulary.py         # Fetch FFM formulary JSON
python scripts/fetch/fetch_formulary_full.py    # Full formulary fetch (all issuers)
python scripts/fetch/fetch_formulary_sbm.py     # Fetch SBM state formularies
python scripts/fetch/inspect_puf.py             # Inspect PUF file structure
```

### ETL scripts (`scripts/etl/`)
```bash
python scripts/etl/build_plan_intelligence.py   # → plan_intelligence.json (107 MB)
python scripts/etl/build_sbc_from_puf.py        # → sbc_decoded.json (429 MB, gitignored)
python scripts/etl/build_rate_volatility.py     # → rate_volatility.json (654 KB)
python scripts/etl/build_subsidy_engine.py      # → subsidy_engine.json (2.86 MB)
python scripts/etl/build_bencs_cost_sharing.py  # → merged into sbc_decoded.json
python scripts/etl/build_dental_coverage.py     # → dental_coverage.json (4.4 MB)
python scripts/etl/build_county_names.py        # → county name lookups
python scripts/etl/slim_formulary.py            # → slimmed formulary for build
python scripts/etl/dedupe_formulary.py          # → deduplicated formulary
```

### Generate scripts (`scripts/generate/`)
```bash
python scripts/generate/build_friction_qa.py    # → friction_qa.json (56.8 KB)
python scripts/generate/build_billing_intel.py  # → billing_intel.json (52.8 KB)
python scripts/generate/build_life_events.py    # → life_events.json (49.8 KB)
python scripts/generate/build_policy_scenarios.py # → policy_scenarios.json (65.1 MB)
```

---

## Field Mappings (PUF Columns → Our Schema)

### Plan Attributes PUF
```
StandardComponentId    → plan_id          (14-char HIOS ID)
PlanMarketingName      → plan_name
IssuerId               → issuer_id        (5-digit CMS issuer ID)
IssuerMarketingName    → issuer_name
MetalLevel             → metal_level      (Bronze|Silver|Gold|Platinum|Catastrophic)
PlanType               → plan_type        (HMO|PPO|EPO|POS)
StateCode              → state_code       (2-letter)
SourceName             → source           (always "CMS PUF")
BusinessYear           → plan_year
```

### Rate PUF
```
PlanId                 → plan_id
StateCode              → state_code
RatingAreaId           → rating_area
Age                    → age              ("0-20", "21", ... "64", "65+", "Family")
Tobacco                → tobacco_status
IndividualRate         → premium_monthly
IndividualTobaccoRate  → premium_tobacco_monthly
Couple                 → premium_couple
```

### Service Area PUF
```
IssuerId               → issuer_id
StateCode              → state_code
CountyName             → county_name
ServiceAreaId          → service_area_id
```

---

## ETL Script Template Pattern

Every ETL script follows this structure:

```python
"""
ETL: [Description]
Source: [PUF file name]
Output: data/processed/[output_name].json
"""

import logging
import json
from pathlib import Path
from typing import Any

import pandas as pd
from jsonschema import validate

logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")
PROCESSED_DIR = Path("data/processed")
SCHEMA_DIR = Path("data/schema")

def load_raw(filename: str) -> pd.DataFrame:
    """Load raw PUF CSV file."""
    filepath = RAW_DIR / filename
    logger.info(f"Loading {filepath}")
    df = pd.read_csv(filepath, low_memory=False)
    logger.info(f"Loaded {len(df):,} rows, {len(df.columns)} columns")
    return df

def transform(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Transform raw data into our schema."""
    raise NotImplementedError("Implement per-PUF transform logic")

def validate_output(records: list[dict[str, Any]], schema_file: str) -> bool:
    """Validate output against JSON schema."""
    schema_path = SCHEMA_DIR / schema_file
    with open(schema_path) as f:
        schema = json.load(f)
    for record in records[:100]:
        validate(instance=record, schema=schema)
    logger.info(f"Schema validation passed ({len(records):,} records)")
    return True

def save(records: list[dict[str, Any]], output_name: str) -> Path:
    """Save processed records with metadata wrapper."""
    output = {
        "metadata": {
            "source": "CMS PUF",
            "record_count": len(records),
            "generated_at": pd.Timestamp.now().isoformat(),
            "schema_version": "1.0"
        },
        "data": records
    }
    outpath = PROCESSED_DIR / f"{output_name}.json"
    with open(outpath, "w") as f:
        json.dump(output, f, indent=2, default=str)
    logger.info(f"Saved {len(records):,} records to {outpath}")
    return outpath

def main() -> None:
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s %(name)s %(levelname)s %(message)s")
    df = load_raw("FILENAME.csv")
    records = transform(df)
    validate_output(records, "SCHEMA.json")
    save(records, "OUTPUT_NAME")

if __name__ == "__main__":
    main()
```

---

## Validation Rules

Every ETL output must pass these checks before saving:

| Rule | Check |
|------|-------|
| Record count | `len(records) > 0` — fail if empty |
| Required fields | No nulls in: `plan_id`, `state_code`, `issuer_id` |
| State codes | Valid 2-letter US state/territory codes |
| HIOS plan IDs | Match pattern: `^\d{5}[A-Z]{2}\d{7}$` (14 characters) |
| Issuer IDs | 5-digit numeric strings |
| Metal levels | One of: Bronze, Silver, Gold, Platinum, Catastrophic, Expanded Bronze |
| Premiums | Numeric, > 0, < 10000 (sanity check) |
| Duplicates | No duplicate `plan_id + rating_area + age` combos in Rate PUF |

---

## Error Handling

```python
import time
import requests

def fetch_with_retry(url: str, max_retries: int = 3) -> requests.Response:
    """Fetch URL with exponential backoff retry."""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, stream=True, timeout=60)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            wait = 2 ** attempt
            logger.warning(f"Attempt {attempt + 1}/{max_retries} failed: {e}. Retrying in {wait}s...")
            time.sleep(wait)
    raise RuntimeError(f"Failed to fetch {url} after {max_retries} attempts")
```

- Stream large files (don't load full CSV into memory at once for downloads)
- Log every fetch attempt with URL, status code, and response time
- Use `pandas.read_csv(chunksize=...)` for files > 500MB
