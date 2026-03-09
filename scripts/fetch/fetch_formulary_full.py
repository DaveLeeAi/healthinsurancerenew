"""
Fetch carrier formulary data from ALL issuers in the MR-PUF.

Pipeline:
  1. Parse MR-PUF xlsx to extract all issuer index.json URLs (deduped)
  2. Fetch each issuer's index.json (async, 5 concurrent)
  3. Find formulary/drugs URLs in each index
  4. Download and normalize drug formulary data
  5. Stream output to data/processed/formulary_intelligence.json
  6. Log errors to data/processed/formulary_errors.json

Usage:
    python scripts/fetch/fetch_formulary_full.py              # All issuers
    python scripts/fetch/fetch_formulary_full.py --limit 20   # First 20 (test)
"""

import argparse
import asyncio
import json
import logging
import time
from pathlib import Path
from typing import Any

import aiohttp
import pandas as pd

logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")
PROCESSED_DIR = Path("data/processed")

MAX_RETRIES = 3
REQUEST_TIMEOUT = 120
CONCURRENCY = 5
DELAY_BETWEEN_ISSUERS = 1.0

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/plain, */*",
}

PRIORITY_DRUGS = [
    "metformin", "ozempic", "semaglutide", "jardiance", "empagliflozin",
    "lisinopril", "atorvastatin", "sertraline", "levothyroxine",
    "albuterol", "humira", "adalimumab", "eliquis", "apixaban",
]


async def fetch_with_retry(
    session: aiohttp.ClientSession, url: str,
    max_retries: int = MAX_RETRIES, timeout: int = REQUEST_TIMEOUT,
) -> bytes | None:
    """Fetch URL with exponential backoff. Returns raw bytes or None."""
    for attempt in range(max_retries):
        try:
            async with session.get(
                url, timeout=aiohttp.ClientTimeout(total=timeout), headers=HEADERS,
            ) as resp:
                resp.raise_for_status()
                return await resp.read()
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            wait = 2 ** attempt
            logger.warning(f"  Attempt {attempt + 1}/{max_retries} failed for {url[:80]}: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(wait)
    return None


def find_formulary_urls(index_data: Any, base_url: str) -> list[str]:
    """Extract formulary/drug URLs from an index.json response."""
    urls: list[str] = []
    base = base_url.rsplit("/", 1)[0] + "/"

    def resolve_url(url: str) -> str:
        if url.startswith("http"):
            return url
        return base + url.lstrip("/")

    def extract_from_obj(obj: Any, depth: int = 0) -> None:
        if depth > 10:
            return
        if isinstance(obj, str):
            obj_lower = obj.lower()
            if "drug" in obj_lower or ("formulary" in obj_lower and "provider" not in obj_lower):
                urls.append(resolve_url(obj))
        elif isinstance(obj, dict):
            for key in ("url", "URL", "href"):
                val = obj.get(key, "")
                if isinstance(val, str):
                    val_lower = val.lower()
                    if "drug" in val_lower or ("formulary" in val_lower and "provider" not in val_lower):
                        urls.append(resolve_url(val))
            for key in ("formulary_urls", "formularyUrls", "formulary_url_list"):
                if key in obj:
                    extract_from_obj(obj[key], depth + 1)
            for val in obj.values():
                if isinstance(val, (dict, list)):
                    extract_from_obj(val, depth + 1)
        elif isinstance(obj, list):
            for item in obj:
                extract_from_obj(item, depth + 1)

    extract_from_obj(index_data)
    return list(dict.fromkeys(urls))


def normalize_drug_records(drugs: list[dict[str, Any]], issuer_ids: list[str]) -> list[dict[str, Any]]:
    """Normalize raw drug records into our standard schema."""
    records: list[dict[str, Any]] = []

    for drug in drugs:
        rxnorm_id = drug.get("rxnorm_id") or drug.get("rxnormId") or drug.get("rxcui") or drug.get("ndc")
        drug_name = drug.get("drug_name") or drug.get("drugName") or drug.get("name") or drug.get("drug_label_name")

        if isinstance(drug_name, dict):
            drug_name = drug_name.get("name") or drug_name.get("drug_name") or str(drug_name)
        if not isinstance(drug_name, str) or not drug_name:
            continue

        name_lower = drug_name.lower()
        is_priority = any(pd_name in name_lower for pd_name in PRIORITY_DRUGS)

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


async def download_and_parse_drugs(
    session: aiohttp.ClientSession, drugs_url: str,
) -> list[dict[str, Any]] | None:
    """Download and parse a drugs.json file. No record cap for full run."""
    logger.info(f"    Downloading: {drugs_url[:100]}...")
    raw = await fetch_with_retry(session, drugs_url, timeout=180)
    if not raw:
        return None

    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"    Invalid JSON from {drugs_url[:80]}: {e}")
        return None

    if isinstance(data, list):
        drugs = data
    elif isinstance(data, dict):
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

    logger.info(f"    Parsed {len(drugs):,} drug objects")
    return drugs


async def process_issuer(
    session: aiohttp.ClientSession, issuer: dict[str, Any],
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Process a single issuer: fetch index → find drugs URLs → download & normalize."""
    index_url = issuer["index_url"]
    issuer_ids = issuer["issuer_ids"]
    states = issuer["states"]

    result: dict[str, Any] = {
        "index_url": index_url,
        "issuer_ids": issuer_ids,
        "states": states,
        "status": "unknown",
        "formulary_urls_found": 0,
        "drugs_urls_attempted": 0,
        "drugs_urls_successful": 0,
        "drug_records": 0,
        "error": None,
    }

    # Step 1: Fetch index.json
    raw = await fetch_with_retry(session, index_url)
    if not raw:
        result["status"] = "index_fetch_failed"
        result["error"] = "Could not fetch index.json after retries"
        return result, []

    try:
        index_data = json.loads(raw)
    except (json.JSONDecodeError, ValueError) as e:
        result["status"] = "index_parse_failed"
        result["error"] = f"Invalid JSON in index.json: {str(e)[:200]}"
        return result, []

    # Step 2: Find formulary/drugs URLs
    formulary_urls = find_formulary_urls(index_data, index_url)
    result["formulary_urls_found"] = len(formulary_urls)

    if not formulary_urls:
        result["status"] = "no_formulary_url"
        result["error"] = "No drug/formulary URLs found in index.json"
        return result, []

    # Step 3: Download and normalize — process ALL URLs (no cap)
    all_records: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    for drugs_url in formulary_urls:
        # Deduplicate URLs that resolve to same endpoint
        if drugs_url in seen_urls:
            continue
        seen_urls.add(drugs_url)
        result["drugs_urls_attempted"] += 1

        drugs = await download_and_parse_drugs(session, drugs_url)
        if drugs:
            records = normalize_drug_records(drugs, issuer_ids)
            all_records.extend(records)
            result["drugs_urls_successful"] += 1
            logger.info(f"    Normalized {len(records):,} records")

    if all_records:
        result["status"] = "success"
        result["drug_records"] = len(all_records)
    else:
        result["status"] = "drugs_download_failed"
        result["error"] = f"Downloaded 0/{result['drugs_urls_attempted']} drugs files"

    return result, all_records


def load_mr_puf() -> list[dict[str, Any]]:
    """Load MR-PUF and extract unique issuer index.json URLs."""
    logger.info("Loading MR-PUF...")
    df = pd.read_excel(RAW_DIR / "Machine_Readable_PUF.xlsx")
    logger.info(f"  Raw rows: {len(df)}")

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


class StreamingJsonWriter:
    """Write JSON output incrementally to avoid holding all records in memory."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.f = open(path, "w", encoding="utf-8")
        self.record_count = 0
        self._started = False

    def write_header(self, metadata: dict[str, Any]) -> None:
        """Write the opening JSON structure with metadata placeholder."""
        self.f.write('{\n  "metadata": ')
        json.dump(metadata, self.f, default=str)
        self.f.write(',\n  "data": [\n')
        self._started = True

    def write_records(self, records: list[dict[str, Any]]) -> None:
        """Append records to the data array."""
        for rec in records:
            if self.record_count > 0:
                self.f.write(",\n")
            json.dump(rec, self.f, default=str)
            self.record_count += 1

    def finalize(self, metadata: dict[str, Any]) -> None:
        """Close the JSON structure. Rewrites the file header with final metadata."""
        self.f.write("\n  ]\n}\n")
        self.f.close()

        # Now rewrite the metadata at the top with final counts
        # Read the data portion back
        with open(self.path, "r", encoding="utf-8") as f:
            content = f.read()

        # Find where data array starts and replace metadata
        data_start = content.index('"data": [')
        new_header = '{\n  "metadata": ' + json.dumps(metadata, default=str) + ',\n  '
        final_content = new_header + content[content.index('"data":'):]

        with open(self.path, "w", encoding="utf-8") as f:
            f.write(final_content)

    def close_without_finalize(self) -> None:
        """Emergency close."""
        if not self.f.closed:
            self.f.write("\n  ]\n}\n")
            self.f.close()


async def run_pipeline(issuers: list[dict[str, Any]]) -> None:
    """Run the full formulary pipeline with async concurrency."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    # Set up streaming output
    out_path = PROCESSED_DIR / "formulary_intelligence.json"
    placeholder_meta: dict[str, Any] = {"status": "in_progress"}
    writer = StreamingJsonWriter(out_path)
    writer.write_header(placeholder_meta)

    results_summary: list[dict[str, Any]] = []
    total_drug_records = 0
    total_priority = 0
    unique_drug_names: set[str] = set()
    unique_rxnorm_ids: set[str] = set()
    semaphore = asyncio.Semaphore(CONCURRENCY)

    start_time = time.time()

    connector = aiohttp.TCPConnector(limit=CONCURRENCY, limit_per_host=3)
    timeout = aiohttp.ClientTimeout(total=300)

    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        for i, issuer in enumerate(issuers):
            async with semaphore:
                ids_str = ",".join(issuer["issuer_ids"][:5])
                states_str = ",".join(issuer["states"][:5])
                logger.info(f"\n[{i+1}/{len(issuers)}] Issuers: [{ids_str}] States: [{states_str}]")

                try:
                    result, records = await process_issuer(session, issuer)
                except Exception as e:
                    logger.error(f"  Unexpected error processing issuer: {e}")
                    result = {
                        "index_url": issuer["index_url"],
                        "issuer_ids": issuer["issuer_ids"],
                        "states": issuer["states"],
                        "status": "unexpected_error",
                        "formulary_urls_found": 0,
                        "drugs_urls_attempted": 0,
                        "drugs_urls_successful": 0,
                        "drug_records": 0,
                        "error": str(e)[:500],
                    }
                    records = []

                results_summary.append(result)

                if records:
                    # Track unique drugs
                    for rec in records:
                        if rec.get("drug_name"):
                            unique_drug_names.add(rec["drug_name"])
                        if rec.get("rxnorm_id"):
                            unique_rxnorm_ids.add(rec["rxnorm_id"])
                        if rec.get("is_priority_drug"):
                            total_priority += 1

                    # Stream to disk immediately
                    writer.write_records(records)
                    total_drug_records += len(records)
                    logger.info(f"  >> {len(records):,} records (running total: {total_drug_records:,})")

                # Rate limit
                await asyncio.sleep(DELAY_BETWEEN_ISSUERS)

                # Progress update every 10 issuers
                if (i + 1) % 10 == 0:
                    elapsed = time.time() - start_time
                    rate = (i + 1) / elapsed * 60
                    success = sum(1 for r in results_summary if r["status"] == "success")
                    logger.info(f"\n  --- Progress: {i+1}/{len(issuers)} "
                                f"({success} success, {total_drug_records:,} records, "
                                f"{rate:.1f} issuers/min) ---")

    elapsed = time.time() - start_time
    success_count = sum(1 for r in results_summary if r["status"] == "success")
    failed_count = len(results_summary) - success_count

    # Build final metadata
    final_metadata = {
        "source": "CMS MR-PUF + Carrier Formulary JSON Files",
        "plan_year": 2026,
        "issuers_attempted": len(results_summary),
        "issuers_successful": success_count,
        "issuers_failed": failed_count,
        "success_rate_pct": round(success_count * 100 / len(results_summary), 1),
        "total_drug_records": total_drug_records,
        "unique_drug_names": len(unique_drug_names),
        "unique_rxnorm_ids": len(unique_rxnorm_ids),
        "priority_drug_records": total_priority,
        "elapsed_seconds": round(elapsed, 1),
        "generated_at": pd.Timestamp.now().isoformat(),
        "schema_version": "1.0",
    }

    # Finalize the streaming JSON
    writer.finalize(final_metadata)
    logger.info(f"\nSaved {total_drug_records:,} drug records to {out_path}")

    # Save error log
    errors = [r for r in results_summary if r["status"] != "success"]
    error_output = {
        "metadata": {
            "total_errors": len(errors),
            "error_breakdown": {},
            "generated_at": pd.Timestamp.now().isoformat(),
        },
        "errors": errors,
    }
    # Count error types
    for r in errors:
        status = r["status"]
        error_output["metadata"]["error_breakdown"][status] = (
            error_output["metadata"]["error_breakdown"].get(status, 0) + 1
        )

    errors_path = PROCESSED_DIR / "formulary_errors.json"
    with open(errors_path, "w") as f:
        json.dump(error_output, f, indent=2, default=str)
    logger.info(f"Saved {len(errors)} error records to {errors_path}")

    # Print final summary
    print(f"\n{'=' * 70}")
    print(f"FORMULARY INTELLIGENCE - FULL PIPELINE RESULTS")
    print(f"{'=' * 70}")
    print(f"  Elapsed time:          {elapsed/60:.1f} minutes")
    print(f"  Issuers attempted:     {len(results_summary)}")
    print(f"  Successful:            {success_count} ({final_metadata['success_rate_pct']}%)")
    print(f"  Failed:                {failed_count}")
    print(f"  Total drug records:    {total_drug_records:,}")
    print(f"  Unique drug names:     {len(unique_drug_names):,}")
    print(f"  Unique RxNorm IDs:     {len(unique_rxnorm_ids):,}")
    print(f"  Priority drug records: {total_priority:,}")
    print(f"{'=' * 70}")

    # Error breakdown
    print(f"\nError breakdown:")
    for status, count in sorted(error_output["metadata"]["error_breakdown"].items(), key=lambda x: -x[1]):
        print(f"  {status}: {count}")

    # Priority drugs found
    priority_names_found: set[str] = set()
    # Re-scan unique drug names for priority matches
    for name in unique_drug_names:
        name_lower = name.lower()
        if any(pd_name in name_lower for pd_name in PRIORITY_DRUGS):
            priority_names_found.add(name)
    print(f"\nPriority drugs found ({len(priority_names_found)} unique names):")
    for name in sorted(priority_names_found)[:30]:
        print(f"  - {name}")

    # Per-issuer detail
    print(f"\nPer-issuer results:")
    for r in results_summary:
        icon = "OK" if r["status"] == "success" else "FAIL"
        ids = ",".join(r["issuer_ids"][:3])
        extra = f" ({r['error'][:60]})" if r.get("error") else ""
        print(f"  {icon} [{ids}] {r['status']} - {r['drug_records']:,} records{extra}")

    print(f"\nOutput files:")
    print(f"  {out_path} ({out_path.stat().st_size / 1024 / 1024:.1f} MB)")
    print(f"  {errors_path} ({errors_path.stat().st_size / 1024:.1f} KB)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch ALL carrier formulary data")
    parser.add_argument("--limit", type=int, default=0, help="Limit issuers (0=all)")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    issuers = load_mr_puf()

    if args.limit > 0:
        issuers = issuers[:args.limit]
    logger.info(f"Processing {len(issuers)} issuers (concurrency={CONCURRENCY})...")

    asyncio.run(run_pipeline(issuers))


if __name__ == "__main__":
    main()
