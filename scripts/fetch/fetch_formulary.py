"""
Fetch carrier formulary data via MR-PUF index.json URLs.

Pipeline:
  1. Parse MR-PUF xlsx to extract issuer index.json URLs
  2. Fetch each issuer's index.json
  3. Find formulary/drugs URLs in the index
  4. Download and normalize drug formulary data
  5. Output: data/processed/formulary_sample.json

Usage:
    python scripts/fetch/fetch_formulary.py                  # First 10 issuers (POC)
    python scripts/fetch/fetch_formulary.py --limit 50       # First 50 issuers
    python scripts/fetch/fetch_formulary.py --limit 0        # All issuers
"""

import argparse
import json
import logging
import time
from pathlib import Path
from typing import Any

import pandas as pd
import requests

logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")
PROCESSED_DIR = Path("data/processed")

MAX_RETRIES = 3
REQUEST_TIMEOUT = 60
DELAY_BETWEEN_ISSUERS = 1.0  # seconds

# Priority drugs to flag in output (by name substring, case-insensitive)
PRIORITY_DRUGS = [
    "metformin", "ozempic", "semaglutide", "jardiance", "empagliflozin",
    "lisinopril", "atorvastatin", "sertraline", "levothyroxine",
    "albuterol", "humira", "adalimumab", "eliquis", "apixaban",
]


def fetch_with_retry(url: str, max_retries: int = MAX_RETRIES, timeout: int = REQUEST_TIMEOUT) -> requests.Response | None:
    """Fetch URL with exponential backoff. Returns None on failure (don't crash pipeline)."""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=timeout, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json, text/plain, */*",
            })
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            wait = 2 ** attempt
            logger.warning(f"  Attempt {attempt + 1}/{max_retries} failed for {url[:80]}: {e}")
            if attempt < max_retries - 1:
                time.sleep(wait)
    return None


def load_mr_puf() -> list[dict[str, Any]]:
    """Load MR-PUF and extract unique issuer index.json URLs."""
    logger.info("Loading MR-PUF...")
    df = pd.read_excel(RAW_DIR / "Machine_Readable_PUF.xlsx")
    logger.info(f"  Raw rows: {len(df)}")

    # Deduplicate by URL (many issuers share the same URL across states)
    # Keep all issuer IDs per unique URL for tracking
    url_issuers: dict[str, dict[str, Any]] = {}
    for _, row in df.iterrows():
        url = str(row["URL Submitted"]).strip()
        issuer_id = str(int(row["Issuer ID"]))
        state = str(row["State"])

        if url not in url_issuers:
            url_issuers[url] = {
                "index_url": url,
                "issuer_ids": [],
                "states": [],
            }
        if issuer_id not in url_issuers[url]["issuer_ids"]:
            url_issuers[url]["issuer_ids"].append(issuer_id)
        if state not in url_issuers[url]["states"]:
            url_issuers[url]["states"].append(state)

    issuers = list(url_issuers.values())
    logger.info(f"  Unique index URLs: {len(issuers)} (from {len(df)} issuer rows)")
    return issuers


def find_formulary_urls(index_data: Any, base_url: str) -> list[str]:
    """
    Extract formulary/drug URLs from an index.json response.

    CMS index.json files have various structures:
    - Standard: {"formulary_urls": [{"url": "...drugs.json"}]}
    - Alternative: list of objects with "url" keys containing "drug" or "formulary"
    - Nested: {"configs": [{"urls": [{"url": "..."}]}]}
    """
    urls: list[str] = []

    # Determine base for relative URLs
    base = base_url.rsplit("/", 1)[0] + "/"

    def resolve_url(url: str) -> str:
        """Resolve relative URLs against the index.json base."""
        if url.startswith("http"):
            return url
        return base + url.lstrip("/")

    def extract_from_obj(obj: Any) -> None:
        """Recursively search for drug/formulary URLs."""
        if isinstance(obj, str):
            # Plain string URL (common in CMS formulary_urls lists)
            obj_lower = obj.lower()
            if "drug" in obj_lower or ("formulary" in obj_lower and "provider" not in obj_lower):
                urls.append(resolve_url(obj))

        elif isinstance(obj, dict):
            # Check for direct URL fields
            for key in ("url", "URL", "href"):
                val = obj.get(key, "")
                if isinstance(val, str):
                    val_lower = val.lower()
                    if "drug" in val_lower or ("formulary" in val_lower and "provider" not in val_lower):
                        urls.append(resolve_url(val))

            # Check known CMS key patterns
            for key in ("formulary_urls", "formularyUrls", "formulary_url_list"):
                if key in obj:
                    extract_from_obj(obj[key])

            # Recurse into all dict values
            for val in obj.values():
                if isinstance(val, (dict, list, str)):
                    extract_from_obj(val)

        elif isinstance(obj, list):
            for item in obj:
                extract_from_obj(item)

    extract_from_obj(index_data)

    # Deduplicate
    return list(dict.fromkeys(urls))


def download_drugs(drugs_url: str, max_records: int = 50000) -> list[dict[str, Any]] | None:
    """
    Download and parse a drugs.json file.
    Returns list of raw drug records, or None on failure.
    Limits records for POC (full pipeline processes all).
    """
    logger.info(f"    Downloading drugs: {drugs_url[:100]}...")
    response = fetch_with_retry(drugs_url, timeout=120)
    if not response:
        return None

    try:
        data = response.json()
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"    Invalid JSON from {drugs_url[:80]}: {e}")
        return None

    # drugs.json can be a list of drug objects directly, or wrapped
    if isinstance(data, list):
        drugs = data
    elif isinstance(data, dict):
        # Try common wrapper keys
        for key in ("drugs", "data", "formulary_drugs", "results"):
            if key in data and isinstance(data[key], list):
                drugs = data[key]
                break
        else:
            logger.warning(f"    Unexpected JSON structure (keys: {list(data.keys())[:10]})")
            return None
    else:
        logger.warning(f"    Unexpected JSON type: {type(data)}")
        return None

    logger.info(f"    Found {len(drugs):,} drug records")
    return drugs[:max_records]


def normalize_drug_records(drugs: list[dict[str, Any]], issuer_ids: list[str]) -> list[dict[str, Any]]:
    """Normalize raw drug records into our standard schema."""
    records: list[dict[str, Any]] = []

    for drug in drugs:
        # Extract drug-level fields (various key naming conventions)
        rxnorm_id = drug.get("rxnorm_id") or drug.get("rxnormId") or drug.get("rxcui") or drug.get("ndc")
        drug_name = drug.get("drug_name") or drug.get("drugName") or drug.get("name") or drug.get("drug_label_name")

        # Some formats return dict for name fields — extract string
        if isinstance(drug_name, dict):
            drug_name = drug_name.get("name") or drug_name.get("drug_name") or str(drug_name)
        if not isinstance(drug_name, str) or not drug_name:
            continue

        # Check if this is a priority drug
        name_lower = drug_name.lower() if drug_name else ""
        is_priority = any(pd in name_lower for pd in PRIORITY_DRUGS)

        # Extract plan-level coverage data
        plans = drug.get("plans") or drug.get("coverage") or []
        if isinstance(plans, list) and plans:
            for plan in plans:
                if not isinstance(plan, dict):
                    continue
                records.append({
                    "rxnorm_id": str(rxnorm_id) if rxnorm_id else None,
                    "drug_name": drug_name,
                    "issuer_ids": issuer_ids,
                    "plan_id": plan.get("plan_id") or plan.get("planId") or plan.get("plan_id_type"),
                    "drug_tier": plan.get("drug_tier") or plan.get("drugTier") or plan.get("tier"),
                    "prior_authorization": plan.get("prior_authorization", plan.get("priorAuthorization", False)),
                    "step_therapy": plan.get("step_therapy", plan.get("stepTherapy", False)),
                    "quantity_limit": plan.get("quantity_limit", plan.get("quantityLimit", False)),
                    "plan_year": (plan.get("years") or [None])[0] if isinstance(plan.get("years"), list) else plan.get("year"),
                    "is_priority_drug": is_priority,
                })
        else:
            # No plan-level data — record at drug level only
            records.append({
                "rxnorm_id": str(rxnorm_id) if rxnorm_id else None,
                "drug_name": drug_name,
                "issuer_ids": issuer_ids,
                "plan_id": None,
                "drug_tier": drug.get("drug_tier") or drug.get("tier"),
                "prior_authorization": drug.get("prior_authorization", False),
                "step_therapy": drug.get("step_therapy", False),
                "quantity_limit": drug.get("quantity_limit", False),
                "plan_year": None,
                "is_priority_drug": is_priority,
            })

    return records


def process_issuer(issuer: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """
    Process a single issuer: fetch index.json -> find drugs URL -> download & normalize.
    Returns (result_summary, drug_records).
    """
    index_url = issuer["index_url"]
    issuer_ids = issuer["issuer_ids"]
    states = issuer["states"]

    result = {
        "index_url": index_url,
        "issuer_ids": issuer_ids,
        "states": states,
        "status": "unknown",
        "formulary_urls_found": [],
        "drug_records": 0,
        "error": None,
    }

    # Step 1: Fetch index.json
    logger.info(f"  Fetching index: {index_url[:80]}...")
    response = fetch_with_retry(index_url)
    if not response:
        result["status"] = "index_fetch_failed"
        result["error"] = "Could not fetch index.json"
        return result, []

    try:
        index_data = response.json()
    except (json.JSONDecodeError, ValueError) as e:
        result["status"] = "index_parse_failed"
        result["error"] = f"Invalid JSON: {e}"
        return result, []

    # Step 2: Find formulary/drugs URLs
    formulary_urls = find_formulary_urls(index_data, index_url)
    result["formulary_urls_found"] = formulary_urls
    logger.info(f"  Found {len(formulary_urls)} formulary URL(s)")

    if not formulary_urls:
        result["status"] = "no_formulary_url"
        result["error"] = "No drug/formulary URLs found in index.json"
        return result, []

    # Step 3: Download and normalize drugs
    # Cap at 3 URLs per issuer for POC; some issuers have per-state files
    all_records: list[dict[str, Any]] = []
    for drugs_url in formulary_urls[:3]:
        drugs = download_drugs(drugs_url, max_records=10000)
        if drugs:
            records = normalize_drug_records(drugs, issuer_ids)
            all_records.extend(records)
            logger.info(f"    Normalized {len(records):,} records from {drugs_url[:60]}...")

    if all_records:
        result["status"] = "success"
        result["drug_records"] = len(all_records)
    else:
        result["status"] = "drugs_download_failed"
        result["error"] = "Could not download/parse any drug files"

    return result, all_records


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch carrier formulary data")
    parser.add_argument("--limit", type=int, default=10, help="Number of issuers to process (0=all)")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    issuers = load_mr_puf()

    if args.limit > 0:
        issuers = issuers[:args.limit]
    logger.info(f"Processing {len(issuers)} issuers...")

    all_drug_records: list[dict[str, Any]] = []
    results_summary: list[dict[str, Any]] = []

    for i, issuer in enumerate(issuers):
        logger.info(f"\n[{i+1}/{len(issuers)}] Issuers: {issuer['issuer_ids'][:5]} States: {issuer['states'][:5]}")
        result, records = process_issuer(issuer)
        results_summary.append(result)
        all_drug_records.extend(records)
        time.sleep(DELAY_BETWEEN_ISSUERS)

    # Summary
    success_count = sum(1 for r in results_summary if r["status"] == "success")
    failed_count = len(results_summary) - success_count

    logger.info(f"\n{'=' * 60}")
    logger.info(f"FORMULARY FETCH SUMMARY")
    logger.info(f"{'=' * 60}")
    logger.info(f"  Issuers attempted: {len(results_summary)}")
    logger.info(f"  Successful: {success_count}")
    logger.info(f"  Failed: {failed_count}")
    logger.info(f"  Total drug records: {len(all_drug_records):,}")

    # Show failure reasons
    for r in results_summary:
        status_icon = "OK" if r["status"] == "success" else "FAIL"
        logger.info(f"  {status_icon} Issuers {r['issuer_ids']}: {r['status']} ({r.get('error', '')})")

    # Priority drugs found
    priority = [r for r in all_drug_records if r.get("is_priority_drug")]
    logger.info(f"  Priority drug records: {len(priority):,}")
    priority_names = sorted(set(r["drug_name"] for r in priority))
    for name in priority_names[:20]:
        logger.info(f"    - {name}")

    # Save output
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output = {
        "metadata": {
            "source": "CMS MR-PUF + Carrier Formulary JSON Files",
            "plan_year": 2026,
            "issuers_attempted": len(results_summary),
            "issuers_successful": success_count,
            "issuers_failed": failed_count,
            "total_drug_records": len(all_drug_records),
            "priority_drug_records": len(priority),
            "generated_at": pd.Timestamp.now().isoformat(),
            "schema_version": "1.0",
            "note": "POC sample - first 10 issuers only",
        },
        "issuer_results": [
            {k: v for k, v in r.items() if k != "drug_records_data"}
            for r in results_summary
        ],
        "data": all_drug_records,
    }

    outpath = PROCESSED_DIR / "formulary_sample.json"
    with open(outpath, "w") as f:
        json.dump(output, f, indent=2, default=str)
    logger.info(f"\nSaved to {outpath}")

    # Print sample
    print(f"\nSaved {len(all_drug_records):,} drug records to {outpath}")
    if all_drug_records:
        print("\nSample drug record:")
        print(json.dumps(all_drug_records[0], indent=2))
    if priority:
        print("\nSample priority drug:")
        print(json.dumps(priority[0], indent=2))


if __name__ == "__main__":
    main()
