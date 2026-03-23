---
name: formulary-aggregator
description: Aggregates drug formulary data from CMS MR-PUF and SBM carrier JSON files. Triggers on formulary, drug tier, MR-PUF, drugs.json, or SBM formulary fetching.
---

# Skill: Formulary Aggregator

> Aggregates drug formulary data from carrier machine-readable JSON files mandated by CMS.

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

## SBM State Fetching Workflow

SBM states are NOT in the CMS MR-PUF. Use `data/config/sbm-source-registry.json` for carrier URLs.

```bash
# Fetch SBM formulary data
python scripts/fetch/fetch_formulary_sbm.py

# The script reads sbm-source-registry.json for:
# - Per-state issuer entries with index_url or direct_drugs_url
# - Status flags (live, url_dead, url_unknown)
# - Only fetches entries with status = "live" or "verified"
```

### SBM Coverage Status
- **48 states + DC** have formulary data (FFM + working SBM endpoints)
- **CA, NY, MA** — geo-blocked, no accessible public formulary endpoints
- See `sbm-source-registry.json` for per-issuer status and research notes

---

## Tier Normalization (matches `lib/formulary-helpers.ts`)

Raw CMS tier labels are highly inconsistent. The `classifyTier()` function in `lib/formulary-helpers.ts` normalizes them into 6 consumer-facing groups:

| Group | Consumer Label | Cost Range | Sort |
|-------|---------------|------------|------|
| `preventive` | Preventive ($0 on eligible plans) | $0 | 0 |
| `generic` | Generic (low cost) | $5–$20 | 1 |
| `preferred-brand` | Preferred brand (moderate cost) | $30–$60 | 2 |
| `non-preferred-brand` | Non-preferred brand (higher cost) | $60–$100+ | 3 |
| `specialty` | Specialty (highest cost) | $100–$500+ | 4 |
| `unknown` | See plan documents | Varies | 5 |

### Cost Language Rule
Always use **"per month"** — never "per fill", "per pen", or "per unit". This applies to all consumer-facing labels, content templates, and page copy.

---

## CMS JSON Schema Reference

**Specification:** [github.com/CMSgov/QHP-provider-formulary-APIs](https://github.com/CMSgov/QHP-provider-formulary-APIs)

CMS mandates that every QHP issuer publish:
- `index.json` — master index linking to formulary, provider, and plan files
- `drugs.json` — complete drug formulary with tier and restriction data
- `plans.json` — plan-level metadata
- `providers.json` — in-network provider directory

We focus on `drugs.json` for formulary intelligence.

---

## drugs.json Structure

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

## MR-PUF Processing

### Step 1: Extract Issuer URLs from MR-PUF

```python
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

---

## Priority Drugs for Validation

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

## Tier Override Rules (implemented in `lib/formulary-helpers.ts`)

The following overrides are applied during tier normalization to correct known CMS data inconsistencies:

### TIER-ONE / TIER-ONE-B → Generic
Raw CMS labels `TIER-ONE` and `TIER-ONE-B` are mapped to the `generic` group. These are low-cost tiers that CMS data inconsistently labels.

### Insulin + PREVENTIVE → `insulin-ira` ($35 cap)
When a drug is identified as insulin and the raw tier is `PREVENTIVE`, it is classified as `insulin-ira` with a fixed $35/month cost cap per the Inflation Reduction Act. This overrides the default `preventive` ($0) classification.

### Biologic Blocklist + PREVENTIVE → Specialty
17 biologic drugs are blocklisted from the `preventive` tier. When any of these drugs appear with a `PREVENTIVE` raw tier, the classification is overridden to `specialty`. The blocklist includes: adalimumab, etanercept, infliximab, rituximab, trastuzumab, bevacizumab, ustekinumab, secukinumab, dupilumab, golimumab, certolizumab, abatacept, tocilizumab, vedolizumab, natalizumab, omalizumab, and denosumab.

### Unknown Tier Logging
Any raw tier value that does not match a known classification pattern is logged via `console.warn` with the raw tier string for investigation. The drug is classified as `unknown` group.
