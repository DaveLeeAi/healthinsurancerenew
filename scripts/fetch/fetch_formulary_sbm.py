"""
Fetch formulary data for State-Based Marketplace (SBM) issuers.

SBM states are absent from the federal CMS Machine-Readable PUF.
This script uses the source registry (data/config/sbm-source-registry.json)
to fetch formulary data directly from issuer-hosted machine-readable files.

The JSON schema is identical to FFM issuers — this script reuses the
normalize_drug_records() and find_formulary_urls() functions from
fetch_formulary_full.py.

Usage:
    python scripts/fetch/fetch_formulary_sbm.py                        # All states in registry
    python scripts/fetch/fetch_formulary_sbm.py --state CA             # California only
    python scripts/fetch/fetch_formulary_sbm.py --state CA NY WA       # Multiple states
    python scripts/fetch/fetch_formulary_sbm.py --verify-urls          # Test URLs, no download
    python scripts/fetch/fetch_formulary_sbm.py --state CA --verify-urls
    python scripts/fetch/fetch_formulary_sbm.py --state CA --merge     # Merge into main formulary

Outputs:
    data/processed/formulary_sbm_CA.json   # Per-state intermediate
    data/processed/formulary_sbm_NY.json
    etc.

    With --merge flag: merges into formulary_intelligence.json
"""

import argparse
import asyncio
import json
import logging
import sys
import time
from pathlib import Path
from typing import Any

import aiohttp

# ---------------------------------------------------------------------------
# Import shared functions from the full FFM pipeline
# ---------------------------------------------------------------------------
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_formulary_full import (
    HEADERS,
    PRIORITY_DRUGS,
    fetch_with_retry,
    find_formulary_urls,
    normalize_drug_records,
    download_and_parse_drugs,
)

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
REGISTRY_PATH = PROJECT_ROOT / "data" / "config" / "sbm-source-registry.json"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
MAIN_FORMULARY = PROCESSED_DIR / "formulary_intelligence.json"

CONCURRENCY = 3
DELAY_BETWEEN_ISSUERS = 1.5  # Be polite — SBM issuers are smaller orgs
LARGE_FILE_TIMEOUT = 600  # 10 min for 112MB+ Cambia files


# ---------------------------------------------------------------------------
# Tier normalization (SBM issuers may use non-standard tier labels)
# ---------------------------------------------------------------------------
TIER_MAP: dict[str, str] = {
    "1": "GENERIC", "TIER 1": "GENERIC", "TIER_1": "GENERIC",
    "GENERIC": "GENERIC", "GEN": "GENERIC",
    "PREFERREDGENERIC": "GENERIC",
    "2": "PREFERRED-BRAND", "TIER 2": "PREFERRED-BRAND", "TIER_2": "PREFERRED-BRAND",
    "PREFERRED BRAND": "PREFERRED-BRAND", "PREFERRED": "PREFERRED-BRAND",
    "PREFERRED-BRAND": "PREFERRED-BRAND", "PREFERRED-BRANDS": "PREFERRED-BRANDS",
    "PREFERREDBRAND": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND", "TIER 3": "NON-PREFERRED-BRAND", "TIER_3": "NON-PREFERRED-BRAND",
    "NON-PREFERRED": "NON-PREFERRED-BRAND", "NON PREFERRED": "NON-PREFERRED-BRAND",
    "NON-PREFERRED-BRAND": "NON-PREFERRED-BRAND", "NON-PREFERRED-BRANDS": "NON-PREFERRED-BRANDS",
    "NONPREFERREDBRAND": "NON-PREFERRED-BRAND",
    "NON-PREFERREDGENERIC-NON-PREFERREDBRAND": "NON-PREFERRED-BRAND",
    "4": "SPECIALTY", "TIER 4": "SPECIALTY", "SPECIALTY": "SPECIALTY", "SP": "SPECIALTY",
    "SPECIALTYDRUGS": "SPECIALTY",
    "5": "SPECIALTY-HIGH", "TIER 5": "SPECIALTY-HIGH",
    "ACA PREVENTIVE": "ACA-PREVENTIVE-DRUGS", "PREVENTIVE": "ACA-PREVENTIVE-DRUGS",
    "PREVENT-DRUGS": "PREVENT-DRUGS", "ACA-PREVENTIVE-DRUGS": "ACA-PREVENTIVE-DRUGS",
    "ZEROCOSTSHAREPREVENTATIVEDRUGS": "ACA-PREVENTIVE-DRUGS",
    "ZEROCOSTSHAREPREVENTIVEDRUGS": "ACA-PREVENTIVE-DRUGS",
    "0": "ACA-PREVENTIVE-DRUGS",
}


def normalize_tier(raw_tier: str | None) -> str:
    """Normalize drug tier labels from various SBM issuer formats."""
    if not raw_tier:
        return "UNKNOWN"
    t = str(raw_tier).strip().upper()
    return TIER_MAP.get(t, t)


async def download_and_parse_drugs_large(
    session: aiohttp.ClientSession, drugs_url: str,
) -> list[dict[str, Any]] | None:
    """Download large drug files (112MB+ Cambia) by streaming to disk first.

    This avoids holding 112MB raw bytes + parsed objects in memory simultaneously.
    """
    import tempfile
    import gc

    logger.info(f"    Downloading (large file → disk, {LARGE_FILE_TIMEOUT}s timeout): {drugs_url[:100]}...")

    # Stream to a temp file to avoid MemoryError on large responses
    tmp_path = None
    for attempt in range(3):
        try:
            async with session.get(
                drugs_url,
                timeout=aiohttp.ClientTimeout(total=LARGE_FILE_TIMEOUT),
                headers=HEADERS,
            ) as resp:
                resp.raise_for_status()
                with tempfile.NamedTemporaryFile(delete=False, suffix=".json", dir=str(PROCESSED_DIR)) as tmp:
                    tmp_path = Path(tmp.name)
                    total = 0
                    async for chunk in resp.content.iter_chunked(1024 * 256):  # 256KB chunks
                        tmp.write(chunk)
                        total += len(chunk)
                    logger.info(f"    Downloaded {total / (1024*1024):.1f} MB to {tmp_path.name}")
                break
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            wait = 2 ** attempt
            logger.warning(f"    Attempt {attempt + 1}/3 failed: {e}")
            if tmp_path and tmp_path.exists():
                tmp_path.unlink()
                tmp_path = None
            if attempt < 2:
                await asyncio.sleep(wait)

    if not tmp_path or not tmp_path.exists():
        return None

    # Parse from disk (json.load uses less peak memory than json.loads on bytes)
    try:
        gc.collect()  # Free memory before parsing large JSON
        with open(tmp_path, encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"    Invalid JSON from {drugs_url[:80]}: {e}")
        return None
    finally:
        if tmp_path.exists():
            tmp_path.unlink()

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


def normalize_sbm_records(records: list[dict[str, Any]], state_code: str) -> list[dict[str, Any]]:
    """Post-process records from normalize_drug_records() with SBM-specific fixes.

    - Normalizes tier names via TIER_MAP
    - Tags each record with state_code for tracking
    """
    for rec in records:
        rec["drug_tier"] = normalize_tier(rec.get("drug_tier"))
        rec["state_code"] = state_code
    return records


# ---------------------------------------------------------------------------
# Registry loader
# ---------------------------------------------------------------------------
def load_registry(state_filter: list[str] | None = None) -> dict[str, list[dict[str, Any]]]:
    """Load the SBM source registry, optionally filtered by state codes.

    Returns: dict mapping state_code -> list of issuer dicts
    """
    if not REGISTRY_PATH.exists():
        logger.error(f"Registry not found: {REGISTRY_PATH}")
        sys.exit(1)

    with open(REGISTRY_PATH, encoding="utf-8") as f:
        registry = json.load(f)

    states_data: dict[str, list[dict[str, Any]]] = {}
    all_states = registry.get("states", {})

    filter_set = {s.upper() for s in state_filter} if state_filter else None

    for state_code, state_info in all_states.items():
        if filter_set and state_code not in filter_set:
            continue
        issuers = state_info.get("issuers", [])
        if issuers:
            states_data[state_code] = issuers
            logger.info(f"  {state_code}: {len(issuers)} issuers "
                        f"({state_info.get('exchange_name', 'Unknown exchange')})")

    if not states_data:
        logger.warning("No matching states found in registry")

    return states_data


# ---------------------------------------------------------------------------
# URL verification (HEAD requests only, no downloads)
# ---------------------------------------------------------------------------
async def verify_urls(states_data: dict[str, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    """Test each issuer's index_url with a HEAD request. Returns results per state."""
    results: dict[str, list[dict[str, Any]]] = {}

    connector = aiohttp.TCPConnector(limit=5)
    timeout = aiohttp.ClientTimeout(total=30)

    async with aiohttp.ClientSession(connector=connector, timeout=timeout, headers=HEADERS) as session:
        for state_code, issuers in states_data.items():
            state_results: list[dict[str, Any]] = []
            for issuer in issuers:
                url = issuer["index_url"]
                issuer_name = issuer["issuer_name"]
                result: dict[str, Any] = {
                    "issuer_id": issuer["issuer_id"],
                    "issuer_name": issuer_name,
                    "index_url": url,
                    "status": "unknown",
                    "http_status": None,
                    "content_type": None,
                    "redirect_url": None,
                }

                try:
                    # Try GET with small read instead of HEAD (many servers block HEAD)
                    async with session.get(
                        url,
                        timeout=aiohttp.ClientTimeout(total=20),
                        allow_redirects=True,
                    ) as resp:
                        result["http_status"] = resp.status
                        result["content_type"] = resp.content_type
                        if str(resp.url) != url:
                            result["redirect_url"] = str(resp.url)

                        if resp.status == 200:
                            # Read a small chunk to verify it's JSON
                            peek = await resp.content.read(512)
                            peek_str = peek.decode("utf-8", errors="replace").strip()
                            if peek_str.startswith("{") or peek_str.startswith("["):
                                result["status"] = "live"
                            else:
                                result["status"] = "not_json"
                                result["peek"] = peek_str[:100]
                        elif resp.status in (301, 302, 307, 308):
                            result["status"] = "redirect"
                        elif resp.status == 403:
                            result["status"] = "forbidden"
                        elif resp.status == 404:
                            result["status"] = "not_found"
                        else:
                            result["status"] = f"http_{resp.status}"

                except asyncio.TimeoutError:
                    result["status"] = "timeout"
                except aiohttp.ClientError as e:
                    result["status"] = "error"
                    result["error"] = str(e)[:200]

                state_results.append(result)
                await asyncio.sleep(0.5)

            results[state_code] = state_results

    return results


def print_verification_table(results: dict[str, list[dict[str, Any]]]) -> None:
    """Print a formatted table of URL verification results."""
    total_live = 0
    total_dead = 0

    print(f"\n{'=' * 90}")
    print("SBM FORMULARY URL VERIFICATION RESULTS")
    print(f"{'=' * 90}")

    for state_code, state_results in sorted(results.items()):
        print(f"\n  {state_code}:")
        print(f"  {'-' * 86}")
        print(f"  {'Issuer':<35} {'Status':<12} {'HTTP':<6} {'Content-Type':<25}")
        print(f"  {'-' * 86}")

        for r in state_results:
            icon = "OK" if r["status"] == "live" else "!!"
            http_str = str(r["http_status"] or "-")
            ct = (r["content_type"] or "-")[:24]
            name = r["issuer_name"][:34]
            print(f"  {icon} {name:<33} {r['status']:<12} {http_str:<6} {ct}")

            if r.get("redirect_url"):
                print(f"       -> Redirected to: {r['redirect_url'][:70]}")
            if r.get("peek"):
                print(f"       -> Content starts with: {r['peek'][:60]}")
            if r.get("error"):
                print(f"       -> Error: {r['error'][:70]}")

            if r["status"] == "live":
                total_live += 1
            else:
                total_dead += 1

    print(f"\n{'-' * 90}")
    print(f"  SUMMARY: {total_live} live, {total_dead} not reachable")
    print(f"{'=' * 90}")


# ---------------------------------------------------------------------------
# Fetch formulary data for a state
# ---------------------------------------------------------------------------
def _group_issuers_by_source(issuers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Group issuers that share the same index_url to avoid duplicate downloads.

    Returns a new issuer list where shared-URL issuers are merged into single
    entries with combined issuer_ids. Prevents OOM on 112MB+ Cambia files.
    """
    # Separate dead from active
    dead: list[dict[str, Any]] = []
    active_by_url: dict[str, dict[str, Any]] = {}

    for issuer in issuers:
        status = issuer.get("status", "needs_verification")
        if status == "url_dead" and not issuer.get("direct_drugs_url"):
            dead.append(issuer)
            continue

        # Key: effective source URL (direct_drugs_url takes priority)
        source_url = issuer.get("direct_drugs_url") or issuer.get("index_url", "")
        if not source_url:
            dead.append(issuer)
            continue

        if source_url in active_by_url:
            # Merge issuer_id into existing group
            existing = active_by_url[source_url]
            existing["_issuer_ids"].append(issuer["issuer_id"])
            existing["_issuer_names"].append(issuer["issuer_name"])
        else:
            active_by_url[source_url] = {
                **issuer,
                "_issuer_ids": [issuer["issuer_id"]],
                "_issuer_names": [issuer["issuer_name"]],
            }

    grouped = dead + list(active_by_url.values())
    return grouped


async def fetch_sbm_state(
    state_code: str,
    issuers: list[dict[str, Any]],
    session: aiohttp.ClientSession,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Fetch and normalize formulary data for all issuers in a state.

    Returns: (all_records, issuer_results)

    Groups issuers sharing the same source URL to avoid duplicate downloads
    of large files (e.g. Cambia drugs1.json + drugs2.json = 112MB each).
    """
    issuer_results: list[dict[str, Any]] = []
    total_records = 0

    # Write records to NDJSON temp file to avoid OOM on large states (Cambia 880K+ records)
    ndjson_path = PROCESSED_DIR / f"_tmp_sbm_{state_code}.ndjson"
    ndjson_file = open(ndjson_path, "w", encoding="utf-8")

    # Group issuers sharing the same URL to avoid duplicate 112MB downloads
    grouped_issuers = _group_issuers_by_source(issuers)
    logger.info(f"  {len(issuers)} issuers grouped into {len(grouped_issuers)} source(s)")

    for i, issuer in enumerate(grouped_issuers):
        # Merged issuers have _issuer_ids list; solo issuers don't
        issuer_ids = issuer.get("_issuer_ids", [issuer["issuer_id"]])
        issuer_names = issuer.get("_issuer_names", [issuer["issuer_name"]])
        issuer_id_str = "+".join(issuer_ids)
        issuer_name = " + ".join(issuer_names)
        index_url = issuer.get("index_url", "")
        direct_drugs_url = issuer.get("direct_drugs_url")
        status = issuer.get("status", "needs_verification")

        # Skip known-dead URLs
        if status == "url_dead" and not direct_drugs_url:
            logger.info(f"\n  [{i+1}/{len(grouped_issuers)}] {state_code} - {issuer_name} ({issuer_id_str}) -- SKIPPED (url_dead)")
            for iid, iname in zip(issuer_ids, issuer_names):
                issuer_results.append({
                    "issuer_id": iid,
                    "issuer_name": iname,
                    "state_code": state_code,
                    "index_url": index_url,
                    "status": "skipped_url_dead",
                    "formulary_urls_found": 0,
                    "drugs_urls_attempted": 0,
                    "drugs_urls_successful": 0,
                    "drug_records": 0,
                    "error": "URL marked as dead in registry",
                })
            continue

        logger.info(f"\n  [{i+1}/{len(grouped_issuers)}] {state_code} - {issuer_name} ({issuer_id_str})")

        result: dict[str, Any] = {
            "issuer_id": issuer_id_str,
            "issuer_name": issuer_name,
            "state_code": state_code,
            "index_url": direct_drugs_url or index_url,
            "status": "unknown",
            "formulary_urls_found": 0,
            "drugs_urls_attempted": 0,
            "drugs_urls_successful": 0,
            "drug_records": 0,
            "error": None,
        }

        issuer_records: list[dict[str, Any]] = []

        # Detect large-file issuers (Cambia 112MB+ drugs files)
        is_large_file = "cambiahealth" in (index_url or "") or "cambiahealth" in (direct_drugs_url or "")
        _download = download_and_parse_drugs_large if is_large_file else download_and_parse_drugs

        # Fast path: direct_drugs_url bypasses index.json discovery
        if direct_drugs_url:
            logger.info(f"    Direct drugs URL: {direct_drugs_url[:80]}...")
            result["formulary_urls_found"] = 1
            result["drugs_urls_attempted"] = 1

            drugs = await _download(session, direct_drugs_url)
            if drugs:
                records = normalize_drug_records(drugs, issuer_ids)
                del drugs  # Free raw drug objects before SBM normalization
                records = normalize_sbm_records(records, state_code)
                issuer_records.extend(records)
                result["drugs_urls_successful"] = 1
                logger.info(f"    Normalized {len(records):,} records")
        else:
            # Standard path: fetch index.json -> discover drugs URLs
            logger.info(f"    Fetching index.json: {index_url[:80]}...")
            raw = await fetch_with_retry(session, index_url)
            if not raw:
                result["status"] = "index_fetch_failed"
                result["error"] = "Could not fetch index.json after retries"
                issuer_results.append(result)
                logger.warning(f"    FAILED: {result['error']}")
                continue

            try:
                index_data = json.loads(raw)
            except (json.JSONDecodeError, ValueError) as e:
                result["status"] = "index_parse_failed"
                result["error"] = f"Invalid JSON in index.json: {str(e)[:200]}"
                issuer_results.append(result)
                logger.warning(f"    FAILED: {result['error']}")
                continue

            # Find formulary/drugs URLs (reused from full pipeline)
            formulary_urls = find_formulary_urls(index_data, index_url)
            result["formulary_urls_found"] = len(formulary_urls)

            if not formulary_urls:
                result["status"] = "no_formulary_url"
                result["error"] = "No drug/formulary URLs found in index.json"
                issuer_results.append(result)
                logger.warning(f"    FAILED: {result['error']}")
                continue

            logger.info(f"    Found {len(formulary_urls)} formulary URL(s)")

            # Download and normalize drugs
            seen_urls: set[str] = set()

            for drugs_url in formulary_urls:
                if drugs_url in seen_urls:
                    continue
                seen_urls.add(drugs_url)
                result["drugs_urls_attempted"] += 1

                drugs = await _download(session, drugs_url)
                if drugs:
                    records = normalize_drug_records(drugs, issuer_ids)
                    del drugs  # Free raw drug objects before SBM normalization
                    import gc; gc.collect()
                    records = normalize_sbm_records(records, state_code)
                    issuer_records.extend(records)
                    del records  # Free intermediate list
                    result["drugs_urls_successful"] += 1
                    logger.info(f"    Normalized {len(issuer_records):,} records so far from {drugs_url[:60]}...")

        if issuer_records:
            result["status"] = "success"
            result["drug_records"] = len(issuer_records)
            # Write to NDJSON temp file instead of accumulating in memory
            for rec in issuer_records:
                ndjson_file.write(json.dumps(rec, separators=(",", ":")) + "\n")
            total_records += len(issuer_records)
            logger.info(f"    Total: {len(issuer_records):,} records for {issuer_name} (flushed to disk)")
            del issuer_records
            import gc; gc.collect()
        else:
            result["status"] = "drugs_download_failed"
            result["error"] = f"Downloaded 0/{result['drugs_urls_attempted']} drugs files"
            logger.warning(f"    FAILED: {result['error']}")

        issuer_results.append(result)

        # Rate limit between issuers
        await asyncio.sleep(DELAY_BETWEEN_ISSUERS)

    ndjson_file.close()

    # Read back all records from disk
    logger.info(f"  Reading back {total_records:,} records from temp file...")
    all_records: list[dict[str, Any]] = []
    with open(ndjson_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                all_records.append(json.loads(line))
    ndjson_path.unlink()
    logger.info(f"  Loaded {len(all_records):,} records from disk")

    return all_records, issuer_results


# ---------------------------------------------------------------------------
# Save per-state output
# ---------------------------------------------------------------------------
def save_state_output(state_code: str, records: list[dict[str, Any]],
                      issuer_results: list[dict[str, Any]]) -> Path:
    """Write per-state formulary JSON to data/processed/formulary_sbm_{STATE}.json."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    # Deduplicate within the state output using same logic as dedupe_formulary.py
    groups: dict[tuple, dict[str, Any]] = {}
    for rec in records:
        key = (
            rec.get("drug_name", ""),
            rec.get("drug_tier", ""),
            bool(rec.get("prior_authorization")),
            bool(rec.get("step_therapy")),
            bool(rec.get("quantity_limit")),
        )
        if key not in groups:
            groups[key] = {
                "drug_name": rec.get("drug_name", ""),
                "drug_tier": rec.get("drug_tier", ""),
                "prior_authorization": bool(rec.get("prior_authorization")),
                "step_therapy": bool(rec.get("step_therapy")),
                "quantity_limit": bool(rec.get("quantity_limit")),
                "issuer_ids": set(rec.get("issuer_ids", [])),
                "rxnorm_id": rec.get("rxnorm_id"),
                "is_priority_drug": bool(rec.get("is_priority_drug")),
                "state_code": state_code,
            }
        else:
            g = groups[key]
            for iid in (rec.get("issuer_ids") or []):
                g["issuer_ids"].add(iid)
            if g["rxnorm_id"] is None and rec.get("rxnorm_id"):
                g["rxnorm_id"] = rec["rxnorm_id"]
            if rec.get("is_priority_drug"):
                g["is_priority_drug"] = True

    # Sort by drug_name for index locality
    sorted_keys = sorted(groups.keys(), key=lambda k: k[0].lower())
    deduped = []
    for key in sorted_keys:
        g = groups[key]
        deduped.append({
            "drug_name": g["drug_name"],
            "drug_tier": g["drug_tier"],
            "prior_authorization": g["prior_authorization"],
            "step_therapy": g["step_therapy"],
            "quantity_limit": g["quantity_limit"],
            "issuer_ids": sorted(g["issuer_ids"]),
            "rxnorm_id": g["rxnorm_id"],
            "is_priority_drug": g["is_priority_drug"],
        })

    # Count unique drugs and issuers
    unique_drugs = {r["drug_name"].lower() for r in deduped}
    unique_issuers = {iid for r in deduped for iid in r["issuer_ids"]}

    success_count = sum(1 for r in issuer_results if r["status"] == "success")
    failed_count = len(issuer_results) - success_count

    output = {
        "metadata": {
            "source": f"SBM Formulary - {state_code}",
            "state_code": state_code,
            "plan_year": 2026,
            "issuers_attempted": len(issuer_results),
            "issuers_successful": success_count,
            "issuers_failed": failed_count,
            "raw_records": len(records),
            "deduped_records": len(deduped),
            "unique_drug_names": len(unique_drugs),
            "unique_issuers": len(unique_issuers),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "schema_version": "1.0",
            "issuer_results": issuer_results,
        },
        "data": deduped,
    }

    out_path = PROCESSED_DIR / f"formulary_sbm_{state_code}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    size_mb = out_path.stat().st_size / (1024 * 1024)
    logger.info(f"  Saved {len(deduped):,} deduped records to {out_path.name} ({size_mb:.1f} MB)")

    return out_path


# ---------------------------------------------------------------------------
# Merge into main formulary
# ---------------------------------------------------------------------------
def merge_into_main(state_code: str) -> None:
    """Merge per-state SBM data into formulary_intelligence.json.

    Reads the existing main formulary line by line, reads the SBM state file,
    deduplicates by (drug_name, drug_tier, PA, ST, QL), and writes back.
    """
    sbm_path = PROCESSED_DIR / f"formulary_sbm_{state_code}.json"
    if not sbm_path.exists():
        logger.error(f"SBM file not found: {sbm_path}")
        return

    if not MAIN_FORMULARY.exists():
        logger.error(f"Main formulary not found: {MAIN_FORMULARY}")
        return

    logger.info(f"Merging {sbm_path.name} into {MAIN_FORMULARY.name}...")

    # Load SBM records
    with open(sbm_path, encoding="utf-8") as f:
        sbm_data = json.load(f)
    sbm_records = sbm_data.get("data", [])
    logger.info(f"  SBM records to merge: {len(sbm_records):,}")

    # Read main formulary line by line (same approach as dedupe_formulary.py)
    logger.info("  Reading main formulary...")
    t0 = time.time()

    groups: dict[tuple, dict[str, Any]] = {}
    raw_count = 0
    in_data = False

    with open(MAIN_FORMULARY, encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()

            if not in_data:
                if '"data"' in stripped and "[" in stripped:
                    in_data = True
                continue

            if stripped in ("]", "]}") or not stripped.startswith("{"):
                continue

            try:
                json_str = stripped.rstrip(",")
                rec = json.loads(json_str)
            except json.JSONDecodeError:
                continue

            raw_count += 1
            key = (
                rec.get("drug_name", ""),
                rec.get("drug_tier", ""),
                bool(rec.get("prior_authorization")),
                bool(rec.get("step_therapy")),
                bool(rec.get("quantity_limit")),
            )

            if key not in groups:
                groups[key] = {
                    "drug_name": rec.get("drug_name", ""),
                    "drug_tier": rec.get("drug_tier", ""),
                    "prior_authorization": bool(rec.get("prior_authorization")),
                    "step_therapy": bool(rec.get("step_therapy")),
                    "quantity_limit": bool(rec.get("quantity_limit")),
                    "issuer_ids": set(rec.get("issuer_ids", [])),
                    "rxnorm_id": rec.get("rxnorm_id"),
                    "is_priority_drug": bool(rec.get("is_priority_drug")),
                }
            else:
                g = groups[key]
                for iid in (rec.get("issuer_ids") or []):
                    g["issuer_ids"].add(iid)
                if g["rxnorm_id"] is None and rec.get("rxnorm_id"):
                    g["rxnorm_id"] = rec["rxnorm_id"]
                if rec.get("is_priority_drug"):
                    g["is_priority_drug"] = True

    logger.info(f"  Main formulary: {raw_count:,} records -> {len(groups):,} groups")

    # Merge SBM records into groups
    new_groups = 0
    merged_groups = 0
    for rec in sbm_records:
        key = (
            rec.get("drug_name", ""),
            rec.get("drug_tier", ""),
            bool(rec.get("prior_authorization")),
            bool(rec.get("step_therapy")),
            bool(rec.get("quantity_limit")),
        )
        if key not in groups:
            groups[key] = {
                "drug_name": rec.get("drug_name", ""),
                "drug_tier": rec.get("drug_tier", ""),
                "prior_authorization": bool(rec.get("prior_authorization")),
                "step_therapy": bool(rec.get("step_therapy")),
                "quantity_limit": bool(rec.get("quantity_limit")),
                "issuer_ids": set(rec.get("issuer_ids", [])),
                "rxnorm_id": rec.get("rxnorm_id"),
                "is_priority_drug": bool(rec.get("is_priority_drug")),
            }
            new_groups += 1
        else:
            g = groups[key]
            for iid in (rec.get("issuer_ids") or []):
                g["issuer_ids"].add(iid)
            if g["rxnorm_id"] is None and rec.get("rxnorm_id"):
                g["rxnorm_id"] = rec["rxnorm_id"]
            if rec.get("is_priority_drug"):
                g["is_priority_drug"] = True
            merged_groups += 1

    logger.info(f"  Merge: {new_groups:,} new groups, {merged_groups:,} existing groups updated")
    logger.info(f"  Total groups: {len(groups):,}")

    # Write merged output
    sorted_keys = sorted(groups.keys(), key=lambda k: k[0].lower())

    bak = MAIN_FORMULARY.with_suffix(".json.pre-sbm-merge.bak")
    if bak.exists():
        bak.unlink()
    logger.info(f"  Backing up to {bak.name}...")
    MAIN_FORMULARY.rename(bak)

    logger.info("  Writing merged formulary...")
    with open(MAIN_FORMULARY, "w", encoding="utf-8") as f:
        metadata = {
            "status": "complete",
            "raw_records": raw_count + len(sbm_records),
            "deduped_records": len(groups),
        }
        f.write("{\n")
        f.write(f'  "metadata": {json.dumps(metadata)},\n')
        f.write('  "data": [\n')

        for i, key in enumerate(sorted_keys):
            g = groups[key]
            record = {
                "drug_name": g["drug_name"],
                "drug_tier": g["drug_tier"],
                "prior_authorization": g["prior_authorization"],
                "step_therapy": g["step_therapy"],
                "quantity_limit": g["quantity_limit"],
                "issuer_ids": sorted(g["issuer_ids"]),
                "rxnorm_id": g["rxnorm_id"],
                "is_priority_drug": g["is_priority_drug"],
            }
            suffix = "," if i < len(sorted_keys) - 1 else ""
            f.write(json.dumps(record, separators=(",", ":")) + suffix + "\n")

        f.write("]\n}\n")

    elapsed = time.time() - t0
    new_size_mb = MAIN_FORMULARY.stat().st_size / (1024 * 1024)
    logger.info(f"  Merged formulary: {len(groups):,} records, {new_size_mb:.1f} MB ({elapsed:.0f}s)")

    print(f"\n  Merge complete: {state_code}")
    print(f"    New drug groups added:  {new_groups:,}")
    print(f"    Existing groups updated: {merged_groups:,}")
    print(f"    Total records:          {len(groups):,}")
    print(f"    File size:              {new_size_mb:.1f} MB")
    print(f"    Backup:                 {bak.name}")


# ---------------------------------------------------------------------------
# Main async pipeline
# ---------------------------------------------------------------------------
async def run_fetch(states_data: dict[str, list[dict[str, Any]]]) -> dict[str, Path]:
    """Fetch formulary data for all requested states."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    connector = aiohttp.TCPConnector(limit=CONCURRENCY, limit_per_host=2)
    timeout = aiohttp.ClientTimeout(total=LARGE_FILE_TIMEOUT + 60)
    output_files: dict[str, Path] = {}

    async with aiohttp.ClientSession(connector=connector, timeout=timeout, headers=HEADERS) as session:
        for state_code, issuers in sorted(states_data.items()):
            print(f"\n{'-' * 70}")
            print(f"  FETCHING: {state_code} ({len(issuers)} issuers)")
            print(f"{'-' * 70}")

            all_records, issuer_results = await fetch_sbm_state(state_code, issuers, session)

            if all_records:
                out_path = save_state_output(state_code, all_records, issuer_results)
                output_files[state_code] = out_path
            else:
                logger.warning(f"  No records fetched for {state_code}")

            # Print per-state summary
            success = sum(1 for r in issuer_results if r["status"] == "success")
            failed = len(issuer_results) - success
            unique_drugs = len({r.get("drug_name", "").lower() for r in all_records})
            unique_issuers = len({iid for r in all_records for iid in r.get("issuer_ids", [])})

            print(f"\n  {state_code} Summary:")
            print(f"    Issuers:       {success} OK / {failed} failed")
            print(f"    Raw records:   {len(all_records):,}")
            print(f"    Unique drugs:  {unique_drugs:,}")
            print(f"    Unique issuers: {unique_issuers}")

            for r in issuer_results:
                icon = "OK" if r["status"] == "success" else "!!"
                print(f"    {icon} {r['issuer_name'][:35]:<36} "
                      f"{r['status']:<22} {r['drug_records']:>8,} records")
                if r.get("error"):
                    print(f"       -> {r['error'][:70]}")

    return output_files


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch formulary data for State-Based Marketplace (SBM) issuers"
    )
    parser.add_argument(
        "--state", nargs="+", metavar="ST",
        help="State codes to process (e.g. CA NY WA). Default: all in registry."
    )
    parser.add_argument(
        "--verify-urls", action="store_true",
        help="Only test issuer URLs (HEAD requests), do not download data."
    )
    parser.add_argument(
        "--merge", action="store_true",
        help="After fetch, merge per-state output into main formulary_intelligence.json."
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    print(f"\n{'=' * 70}")
    print("SBM FORMULARY INGESTION")
    print(f"{'=' * 70}")

    # Load registry
    logger.info(f"Loading registry: {REGISTRY_PATH}")
    states_data = load_registry(args.state)

    if not states_data:
        print("No states to process. Check --state filter and registry file.")
        sys.exit(1)

    total_issuers = sum(len(v) for v in states_data.values())
    print(f"  States: {', '.join(sorted(states_data.keys()))}")
    print(f"  Total issuers: {total_issuers}")

    # Verify-only mode
    if args.verify_urls:
        print(f"\n  Mode: URL verification only (no data download)")
        results = asyncio.run(verify_urls(states_data))
        print_verification_table(results)
        return

    # Full fetch
    print(f"\n  Mode: Full fetch + normalize")
    output_files = asyncio.run(run_fetch(states_data))

    # Print final summary
    print(f"\n{'=' * 70}")
    print("SBM FETCH COMPLETE")
    print(f"{'=' * 70}")

    for state_code, path in sorted(output_files.items()):
        size_mb = path.stat().st_size / (1024 * 1024)
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        record_count = len(data.get("data", []))
        print(f"  {state_code}: {record_count:,} records ({size_mb:.1f} MB) -> {path.name}")

    if not output_files:
        print("  No data fetched from any state.")

    # Merge mode
    if args.merge and output_files:
        print(f"\n{'=' * 70}")
        print("MERGING INTO MAIN FORMULARY")
        print(f"{'=' * 70}")
        for state_code in sorted(output_files.keys()):
            merge_into_main(state_code)

        print(f"\n  Rebuild indexes with: node scripts/build-indexes.mjs")


if __name__ == "__main__":
    main()
