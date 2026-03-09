# Skill: Formulary Aggregator

> Aggregates drug formulary data from carrier machine-readable JSON files mandated by CMS.

---

## Pipeline Overview

```
MR-PUF (CSV)
  → Extract issuer index.json URLs
  → Crawl each issuer's index.json
  → Download drugs.json files
  → Normalize drug records
  → Merge with Plan-PUF (plan_id → plan metadata)
  → Output: processed formulary dataset
```

---

## CMS JSON Schema Reference

**Specification:** [github.com/CMSgov/QHP-provider-formulary-APIs](https://github.com/CMSgov/QHP-provider-formulary-APIs)

CMS mandates that every QHP issuer publish machine-readable files including:
- `index.json` — master index linking to formulary, provider, and plan files
- `drugs.json` — complete drug formulary with tier and restriction data
- `plans.json` — plan-level metadata
- `providers.json` — in-network provider directory

We focus on `drugs.json` for formulary intelligence.

---

## drugs.json Structure

Each `drugs.json` file contains an array of drug records:

```json
{
  "rxnorm_id": "860975",
  "drug_name": "Metformin Hydrochloride 500 MG Oral Tablet",
  "plans": [
    {
      "plan_id": "12345VA0010001",
      "drug_tier": "GENERIC",
      "prior_authorization": false,
      "step_therapy": false,
      "quantity_limit": true,
      "years": [2026]
    }
  ]
}
```

---

## Standard Drug Tier Values

| Tier | Description |
|------|-------------|
| `GENERIC` | Generic drugs, lowest cost |
| `PREFERRED-GENERIC` | Preferred generic, low cost |
| `PREFERRED-BRAND` | Preferred brand-name, moderate cost |
| `NON-PREFERRED-BRAND` | Non-preferred brand, higher cost |
| `SPECIALTY` | Specialty drugs, highest cost (often >$1000/mo) |
| `ZERO-COST-SHARE-PREVENTIVE` | $0 cost preventive medications |
| `MEDICAL-SERVICE` | Administered by provider, billed as medical |

---

## MR-PUF Processing

### Step 1: Extract Issuer URLs from MR-PUF

```python
"""
MR-PUF columns of interest:
- IssuerId: 5-digit CMS issuer ID
- IssuerMarketingName: carrier display name
- MRF_URL: URL to the issuer's machine-readable index.json
- StateCode: state where issuer operates
- BusinessYear: plan year
"""

def extract_issuer_urls(mr_puf_path: str) -> list[dict]:
    """Extract unique issuer index.json URLs from MR-PUF."""
    df = pd.read_csv(mr_puf_path)
    issuers = (
        df.dropna(subset=["MRF_URL"])
        .drop_duplicates(subset=["IssuerId"])
        [["IssuerId", "IssuerMarketingName", "MRF_URL", "StateCode"]]
        .to_dict(orient="records")
    )
    return issuers
```

### Step 2: Crawl index.json → Find drugs.json URL

```python
def get_drugs_url(index_url: str) -> str | None:
    """Parse issuer index.json to find drugs.json URL."""
    response = fetch_with_retry(index_url)
    index_data = response.json()
    for item in index_data.get("formulary_urls", []):
        if "drug" in item.get("url", "").lower():
            return item["url"]
    return None
```

### Step 3: Download and normalize drugs.json

```python
def normalize_drugs(drugs_data: list[dict], issuer_id: str) -> list[dict]:
    """Normalize drugs.json into our standard schema."""
    records = []
    for drug in drugs_data:
        for plan in drug.get("plans", []):
            records.append({
                "rxnorm_id": drug.get("rxnorm_id"),
                "drug_name": drug.get("drug_name"),
                "issuer_id": issuer_id,
                "plan_id": plan.get("plan_id"),
                "drug_tier": plan.get("drug_tier"),
                "prior_authorization": plan.get("prior_authorization", False),
                "step_therapy": plan.get("step_therapy", False),
                "quantity_limit": plan.get("quantity_limit", False),
                "plan_year": plan.get("years", [None])[0],
            })
    return records
```

---

## Known Issues

- **~46% of issuers have errors** in their MR files (broken URLs, invalid JSON, missing drugs.json). Handle gracefully — log and skip, don't fail the whole pipeline.
- Some `index.json` files use non-standard keys or nesting. Try multiple key paths.
- Some `drugs.json` files are 500MB+. Stream and process in chunks.
- Some issuers host files behind CDNs with aggressive rate limiting.
- RxNorm IDs may be missing or non-standard on some records — log but don't discard.

---

## Rate Limiting

| Parameter | Value |
|-----------|-------|
| Max concurrent requests | 5 |
| Delay between issuers | 1 second minimum |
| Per-request timeout | 60 seconds |
| Max retries per URL | 3 (exponential backoff) |

Use `asyncio` + `aiohttp` with a semaphore for concurrency control:

```python
import asyncio
import aiohttp

CONCURRENCY = 5
DELAY_SECONDS = 1.0

async def fetch_all_formularies(issuer_urls: list[dict]) -> list[dict]:
    """Fetch all formulary files with rate limiting."""
    semaphore = asyncio.Semaphore(CONCURRENCY)
    results = []

    async with aiohttp.ClientSession() as session:
        for issuer in issuer_urls:
            async with semaphore:
                result = await fetch_issuer_formulary(session, issuer)
                if result:
                    results.extend(result)
                await asyncio.sleep(DELAY_SECONDS)

    return results
```

---

## Priority Drugs for Initial Build

Start validation with these high-interest drugs:

| Drug | Category | Why Priority |
|------|----------|-------------|
| **Metformin** | Diabetes (generic) | Most prescribed diabetes drug |
| **Ozempic** (semaglutide) | Diabetes/weight loss | High demand, coverage varies wildly |
| **Jardiance** (empagliflozin) | Diabetes | Preferred brand, tier varies |
| **Lisinopril** | Blood pressure (generic) | Universally covered, baseline test |
| **Atorvastatin** | Cholesterol (generic) | High volume, should be Tier 1 everywhere |
| **Sertraline** | Mental health (generic) | Common SSRI, good coverage test |
| **Levothyroxine** | Thyroid (generic) | Essential medication |
| **Albuterol** | Asthma (generic) | Emergency inhaler |
| **Humira** (adalimumab) | Autoimmune (specialty) | Expensive, specialty tier test |
| **Eliquis** (apixaban) | Blood thinner (brand) | High cost, tier placement varies |

---

## Output Schema

```json
{
  "metadata": {
    "source": "CMS MR-PUF + Carrier Formulary Files",
    "plan_year": 2026,
    "issuers_attempted": 450,
    "issuers_successful": 243,
    "issuers_failed": 207,
    "total_drug_records": 5000000,
    "generated_at": "2026-03-09T12:00:00"
  },
  "data": [
    {
      "rxnorm_id": "860975",
      "drug_name": "Metformin Hydrochloride 500 MG Oral Tablet",
      "issuer_id": "12345",
      "plan_id": "12345VA0010001",
      "drug_tier": "GENERIC",
      "prior_authorization": false,
      "step_therapy": false,
      "quantity_limit": true,
      "plan_year": 2026
    }
  ]
}
```
