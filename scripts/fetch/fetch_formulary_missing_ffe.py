"""
Targeted re-fetch for the 68 FFE issuers missing from formulary_intelligence.json.

These issuers are all present in the MR-PUF but were never fetched (or failed)
in the original fetch_formulary_full.py run. This script:

  1. Loads the 46 missing index URLs (hardcoded from MR-PUF analysis 2026-04-04)
  2. Fetches each index.json -> finds drug URLs -> downloads & normalizes
  3. Appends new records to data/processed/formulary_intelligence.json
  4. Writes per-run results to data/processed/formulary_missing_ffe_results.json
  5. Updates data/processed/formulary_errors.json with any new failures

Usage:
    cd healthinsurancerenew
    python scripts/fetch/fetch_formulary_missing_ffe.py
    python scripts/fetch/fetch_formulary_missing_ffe.py --dry-run   # test URLs only
    python scripts/fetch/fetch_formulary_missing_ffe.py --concurrency 3
"""

import argparse
import asyncio
import json
import logging
import time
from pathlib import Path
from typing import Any

import aiohttp

logger = logging.getLogger(__name__)

PROCESSED_DIR = Path("data/processed")
OUT_PATH = PROCESSED_DIR / "formulary_intelligence.json"
RESULTS_PATH = PROCESSED_DIR / "formulary_missing_ffe_results.json"
ERRORS_PATH = PROCESSED_DIR / "formulary_errors.json"

MAX_RETRIES = 3
REQUEST_TIMEOUT = 120
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

# -----------------------------------------------------------------------
# The 46 unique index URLs covering the 68 missing issuers.
# Source: MR-PUF cross-referenced against formulary_intelligence.json
# on 2026-04-04. Issuer IDs and states per URL as published in MR-PUF.
# -----------------------------------------------------------------------
MISSING_ISSUERS: list[dict[str, Any]] = [
    # --- Cigna (1 URL covers 8 issuers across 7 states) ---
    {
        "index_url": "https://www.cigna.com/sites/json/cms-data-index.json",
        "issuer_ids": ["48121", "56766", "73943", "76589", "79850", "94419", "97667", "99248"],
        "states": ["AZ", "FL", "IN", "MS", "NC", "TN", "TX"],
        "carrier_hint": "Cigna Healthcare",
    },
    # --- Molina (1 URL covers 6 issuers across 6 states) ---
    {
        "index_url": "https://www.molinahealthcare.com/cms/json/index.json",
        "issuer_ids": ["18167", "42326", "45786", "54172", "64353", "79975"],
        "states": ["FL", "MS", "OH", "SC", "TX", "UT"],
        "carrier_hint": "Molina Healthcare",
    },
    # --- AmeriHealth Caritas Next (1 URL, 4 issuers, 4 states) ---
    {
        "index_url": "https://www.amerihealthcaritasnext.com/cms-data-index.json",
        "issuer_ids": ["17414", "38246", "67926", "72760"],
        "states": ["DE", "FL", "LA", "NC"],
        "carrier_hint": "AmeriHealth Caritas Next",
    },
    # --- Moda Health (1 URL, 2 issuers — AK + TX) [PREVIOUSLY FAILED] ---
    {
        "index_url": "https://www.modahealth.com/cms-data-index.json",
        "issuer_ids": ["73836", "17933"],
        "states": ["AK", "TX"],
        "carrier_hint": "Moda Health",
    },
    # --- Medica per-state REST endpoints (7 separate URLs) ---
    {
        "index_url": "https://esbgatewaypub.medica.com/rest/QHP/IA/93078/cms-data-index.json",
        "issuer_ids": ["93078"],
        "states": ["IA"],
        "carrier_hint": "Elevate by Medica (IA)",
    },
    {
        "index_url": "https://esbgatewaypub.medica.com/rest/QHP/KS/39520/cms-data-index.json",
        "issuer_ids": ["39520"],
        "states": ["KS"],
        "carrier_hint": "Select by Medica (KS)",
    },
    {
        "index_url": "https://esbgatewaypub.medica.com/rest/QHP/MO/53461/cms-data-index.json",
        "issuer_ids": ["53461"],
        "states": ["MO"],
        "carrier_hint": "Select by Medica (MO)",
    },
    {
        "index_url": "https://esbgatewaypub.medica.com/rest/QHP/ND/73751/cms-data-index.json",
        "issuer_ids": ["73751"],
        "states": ["ND"],
        "carrier_hint": "Altru by Medica (ND)",
    },
    {
        "index_url": "https://esbgatewaypub.medica.com/rest/QHP/NE/20305/cms-data-index.json",
        "issuer_ids": ["20305"],
        "states": ["NE"],
        "carrier_hint": "Elevate by Medica (NE)",
    },
    {
        "index_url": "https://esbgatewaypub.medica.com/rest/QHP/OK/21333/cms-data-index.json",
        "issuer_ids": ["21333"],
        "states": ["OK"],
        "carrier_hint": "Harmony by Medica (OK)",
    },
    {
        "index_url": "https://esbgatewaypub.medica.com/rest/QHP/WI/57845/cms-data-index.json",
        "issuer_ids": ["57845"],
        "states": ["WI"],
        "carrier_hint": "Medica Individual Choice (WI)",
    },
    # --- Medica MO SSM Health (separate URL) ---
    {
        "index_url": "https://app.mo-central.medica.com/MachineReadable/Medica-MO-cms-data-index.json",
        "issuer_ids": ["47840"],
        "states": ["MO"],
        "carrier_hint": "Medica with SSM Health (MO)",
    },
    # --- BCBS state plans ---
    {
        "index_url": "https://www.bcbsal.org/cms/cms-data-index.json",
        "issuer_ids": ["46944"],
        "states": ["AL"],
        "carrier_hint": "Blue Cross Blue Shield of Alabama",
    },
    {
        "index_url": "https://www.bcbsfl.com/DocumentLibrary/Providers/cms/index.json",
        "issuer_ids": ["16842", "30252"],
        "states": ["FL"],
        "carrier_hint": "Florida Blue / BCBS FL",
    },
    {
        "index_url": "https://www.bcbsnc.com/cms-data-index.json",
        "issuer_ids": ["11512"],
        "states": ["NC"],
        "carrier_hint": "Blue Cross Blue Shield of NC",
    },
    {
        "index_url": "https://www.bcbst.com/cms-data-index.json",
        "issuer_ids": ["14002"],
        "states": ["TN"],
        "carrier_hint": "BlueCross BlueShield of Tennessee",
    },
    # --- Arkansas plans ---
    {
        "index_url": "https://secure.healthadvantage-hmo.com/doclib/QHP/HA/index.json",
        "issuer_ids": ["13262"],
        "states": ["AR"],
        "carrier_hint": "Health Advantage (AR)",
    },
    {
        "index_url": "https://secure.arkansasoctave.com/doclib/QHP/Octave/index.json",
        "issuer_ids": ["48772"],
        "states": ["AR"],
        "carrier_hint": "Octave Health (AR)",
    },
    {
        "index_url": "https://secure.arkansasbluecross.com/doclib/QHP/index.json",
        "issuer_ids": ["75293"],
        "states": ["AR"],
        "carrier_hint": "Arkansas Blue Cross",
    },
    # --- Wellmark (IA + SD) ---
    {
        "index_url": "https://public-cdn.wellmark.com/json/WHPI/index.json",
        "issuer_ids": ["25896"],
        "states": ["IA"],
        "carrier_hint": "Wellmark (IA)",
    },
    {
        "index_url": "https://public-cdn.wellmark.com/json/WSD/index.json",
        "issuer_ids": ["50305"],
        "states": ["SD"],
        "carrier_hint": "Wellmark (SD)",
    },
    # --- Sanford / Altru (ND + SD) ---
    {
        "index_url": "https://tools.sanfordhealthplan.com/json/index.json",
        "issuer_ids": ["31195", "89364"],
        "states": ["ND", "SD"],
        "carrier_hint": "Sanford Health Plan",
    },
    # --- AHS Secure / ConnectPlus (IA + SD) ---
    {
        "index_url": "https://www.ahsecure.net/CMS/index.json",
        "issuer_ids": ["60536", "74980"],
        "states": ["IA", "SD"],
        "carrier_hint": "ConnectPlus / AHS",
    },
    # --- AZ Blue ---
    {
        "index_url": "https://azblue.com/JSON/Index.JSON",
        "issuer_ids": ["53901"],
        "states": ["AZ"],
        "carrier_hint": "Arizona Blue Cross Blue Shield",
    },
    # --- Louisiana Blue (2 separate issuer-specific URLs) ---
    {
        "index_url": "https://www.lablue.com/acadirectory/19636/19636Index.json",
        "issuer_ids": ["19636"],
        "states": ["LA"],
        "carrier_hint": "Blue Cross Blue Shield of Louisiana (19636)",
    },
    {
        "index_url": "https://www.lablue.com/acadirectory/97176/97176Index.json",
        "issuer_ids": ["97176"],
        "states": ["LA"],
        "carrier_hint": "Blue Cross Blue Shield of Louisiana (97176)",
    },
    # --- CHRISTUS Health (LA + TX) ---
    {
        "index_url": "https://chppayment.christushealth.org/workfiles/json/index.json",
        "issuer_ids": ["66252", "98780"],
        "states": ["LA", "TX"],
        "carrier_hint": "CHRISTUS Health Plan",
    },
    # --- Florida plans ---
    {
        "index_url": "https://apps.hf.org/applications/dn/cms_json/index.json",
        "issuer_ids": ["36194"],
        "states": ["FL"],
        "carrier_hint": "Bright Health / BCBS FL (36194)",
    },
    {
        "index_url": "https://capitalhealth.com/cms-data-index.json",
        "issuer_ids": ["66966"],
        "states": ["FL"],
        "carrier_hint": "Capital Health Plan (FL)",
    },
    # --- Texas community plans ---
    {
        "index_url": "https://providerdirectory.communityhealthchoice.org/him/index.json",
        "issuer_ids": ["11718", "27248"],
        "states": ["TX"],
        "carrier_hint": "Community Health Choice (TX)",
    },
    {
        "index_url": "https://exchange.communityfirsthealthplans.com/cms-data-index.json",
        "issuer_ids": ["63251"],
        "states": ["TX"],
        "carrier_hint": "Community First Health Plans (TX)",
    },
    # --- McLaren Health Plan (MI) ---
    {
        "index_url": "https://www.mclaren.org/Uploads/Public/Documents/HealthPlan/documents/CMSUploads/cms-data-index.json",
        "issuer_ids": ["74917"],
        "states": ["MI"],
        "carrier_hint": "McLaren Health Plan (MI)",
    },
    # --- Cox HealthPlans (MO) ---
    {
        "index_url": "https://www.thinkinghealthforward.com/Index.json",
        "issuer_ids": ["96384"],
        "states": ["MO"],
        "carrier_hint": "Cox HealthPlans (MO)",
    },
    # --- PacificSource MT ---
    {
        "index_url": "https://enroll.pacificsource.com/MRF/MT/cms-data-index.json",
        "issuer_ids": ["23603"],
        "states": ["MT"],
        "carrier_hint": "PacificSource (MT)",
    },
    # --- Mountain Health Cooperative (MT) ---
    {
        "index_url": "https://rmm.mhc.coop/plans_providers/32225_MT_Index_2026.json",
        "issuer_ids": ["32225"],
        "states": ["MT"],
        "carrier_hint": "Mountain Health Cooperative (MT)",
    },
    # --- WellSense (NH) ---
    {
        "index_url": "https://connect.wellsense.org:8443/NHACA_MRF/data/cms-data-index.json",
        "issuer_ids": ["13219"],
        "states": ["NH"],
        "carrier_hint": "WellSense Health Plan (NH)",
    },
    # --- Ohio plans ---
    {
        "index_url": "https://www.myparamount.org/machinereadablefiles/cms-data-index.json",
        "issuer_ids": ["74313"],
        "states": ["OH"],
        "carrier_hint": "Paramount Health Care (OH)",
    },
    {
        "index_url": "https://providersearch.medmutual.com/cms-data-index.json",
        "issuer_ids": ["99969"],
        "states": ["OH"],
        "carrier_hint": "Medical Mutual of Ohio",
    },
    # --- First Choice Next (SC) ---
    {
        "index_url": "https://www.firstchoicenext.com/cms-data-index.json",
        "issuer_ids": ["73107"],
        "states": ["SC"],
        "carrier_hint": "First Choice Next (SC)",
    },
    # --- Utah plans ---
    {
        "index_url": "https://cms-machine-readable.cambiahealth.com/index.json",
        "issuer_ids": ["22013", "34541"],
        "states": ["UT"],
        "carrier_hint": "Cambia Health / BridgeSpan (UT)",
    },
    {
        "index_url": "https://doc.uhealthplan.utah.edu/individual/json/42261_UT_index.json",
        "issuer_ids": ["42261"],
        "states": ["UT"],
        "carrier_hint": "University of Utah Health Plans",
    },
    # --- Wisconsin plans ---
    {
        "index_url": "https://apps.quartzbenefits.com/cmsfiles/CMS-INDEX-JSON.json",
        "issuer_ids": ["37833"],
        "states": ["WI"],
        "carrier_hint": "Quartz / UW Health (WI)",
    },
    {
        "index_url": "https://app.deancare.com/MachineReadable/deanhealthplan-cms-data-index.json",
        "issuer_ids": ["38345"],
        "states": ["WI"],
        "carrier_hint": "Dean Health Plan (WI)",
    },
    {
        "index_url": "https://www.mercycarehealthplans.com/wp-content/uploads/JSON/cms-data-index.json",
        "issuer_ids": ["58326"],
        "states": ["WI"],
        "carrier_hint": "MercyCare Health Plans (WI)",
    },
    {
        "index_url": "https://data.networkhealth.com/hix/index.json",
        "issuer_ids": ["81413"],
        "states": ["WI"],
        "carrier_hint": "Network Health (WI)",
    },
    {
        "index_url": "https://planfinder.ghcscw.com/cms/index.json",
        "issuer_ids": ["94529"],
        "states": ["WI"],
        "carrier_hint": "Group Health Cooperative of South Central WI",
    },
]


# -----------------------------------------------------------------------
# Core fetch/parse helpers (same logic as fetch_formulary_full.py)
# -----------------------------------------------------------------------

async def fetch_with_retry(
    session: aiohttp.ClientSession,
    url: str,
    max_retries: int = MAX_RETRIES,
    timeout: int = REQUEST_TIMEOUT,
) -> bytes | None:
    """Fetch URL with exponential backoff. Returns raw bytes or None."""
    for attempt in range(max_retries):
        try:
            async with session.get(
                url,
                timeout=aiohttp.ClientTimeout(total=timeout),
                headers=HEADERS,
            ) as resp:
                resp.raise_for_status()
                return await resp.read()
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            wait = 2 ** attempt
            logger.warning(f"  Attempt {attempt+1}/{max_retries} failed for {url[:80]}: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(wait)
    return None


def find_formulary_urls(index_data: Any, base_url: str) -> list[str]:
    """Extract formulary/drug URLs from an index.json response."""
    urls: list[str] = []
    base = base_url.rsplit("/", 1)[0] + "/"

    def resolve(url: str) -> str:
        return url if url.startswith("http") else base + url.lstrip("/")

    def extract(obj: Any, depth: int = 0) -> None:
        if depth > 10:
            return
        if isinstance(obj, str):
            lo = obj.lower()
            if "drug" in lo or ("formulary" in lo and "provider" not in lo):
                urls.append(resolve(obj))
        elif isinstance(obj, dict):
            for key in ("url", "URL", "href"):
                val = obj.get(key, "")
                if isinstance(val, str):
                    lo = val.lower()
                    if "drug" in lo or ("formulary" in lo and "provider" not in lo):
                        urls.append(resolve(val))
            for key in ("formulary_urls", "formularyUrls", "formulary_url_list"):
                if key in obj:
                    extract(obj[key], depth + 1)
            for val in obj.values():
                if isinstance(val, (dict, list)):
                    extract(val, depth + 1)
        elif isinstance(obj, list):
            for item in obj:
                extract(item, depth + 1)

    extract(index_data)
    return list(dict.fromkeys(urls))


def normalize_drug_records(
    drugs: list[dict[str, Any]], issuer_ids: list[str]
) -> list[dict[str, Any]]:
    """Normalize raw drug records into the standard formulary_intelligence schema."""
    records: list[dict[str, Any]] = []
    for drug in drugs:
        rxnorm_id = (
            drug.get("rxnorm_id") or drug.get("rxnormId")
            or drug.get("rxcui") or drug.get("ndc")
        )
        drug_name = (
            drug.get("drug_name") or drug.get("drugName")
            or drug.get("name") or drug.get("drug_label_name")
        )
        if isinstance(drug_name, dict):
            drug_name = drug_name.get("name") or drug_name.get("drug_name") or str(drug_name)
        if not isinstance(drug_name, str) or not drug_name:
            continue

        is_priority = any(p in drug_name.lower() for p in PRIORITY_DRUGS)
        plans = drug.get("plans") or drug.get("coverage") or []

        if isinstance(plans, list) and plans:
            for plan in plans:
                if not isinstance(plan, dict):
                    continue
                records.append({
                    "rxnorm_id": str(rxnorm_id) if rxnorm_id else None,
                    "drug_name": drug_name,
                    "issuer_ids": issuer_ids,
                    "plan_id": plan.get("plan_id") or plan.get("planId"),
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


async def download_drugs(
    session: aiohttp.ClientSession, drugs_url: str
) -> list[dict[str, Any]] | None:
    """Download and parse a drugs.json file."""
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
        return data
    if isinstance(data, dict):
        for key in ("drugs", "data", "formulary_drugs", "results"):
            if key in data and isinstance(data[key], list):
                return data[key]
        logger.warning(f"    Unexpected JSON structure (keys: {list(data.keys())[:10]})")
        return None
    logger.warning(f"    Unexpected JSON type: {type(data)}")
    return None


async def process_issuer(
    session: aiohttp.ClientSession,
    issuer: dict[str, Any],
    dry_run: bool = False,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Process a single issuer entry."""
    index_url = issuer["index_url"]
    issuer_ids = issuer["issuer_ids"]
    states = issuer["states"]
    carrier_hint = issuer.get("carrier_hint", "")

    result: dict[str, Any] = {
        "index_url": index_url,
        "issuer_ids": issuer_ids,
        "states": states,
        "carrier_hint": carrier_hint,
        "status": "unknown",
        "formulary_urls_found": 0,
        "drugs_urls_attempted": 0,
        "drugs_urls_successful": 0,
        "drug_records": 0,
        "error": None,
    }

    if dry_run:
        result["status"] = "dry_run_skipped"
        return result, []

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

    formulary_urls = find_formulary_urls(index_data, index_url)
    result["formulary_urls_found"] = len(formulary_urls)

    if not formulary_urls:
        result["status"] = "no_formulary_url"
        result["error"] = "No drug/formulary URLs found in index.json"
        return result, []

    all_records: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    for drugs_url in formulary_urls:
        if drugs_url in seen_urls:
            continue
        seen_urls.add(drugs_url)
        result["drugs_urls_attempted"] += 1
        drugs = await download_drugs(session, drugs_url)
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
        result["error"] = f"Downloaded 0/{result['drugs_urls_attempted']} drug files"

    return result, all_records


# -----------------------------------------------------------------------
# Merge helpers — append new records to existing formulary_intelligence.json
# -----------------------------------------------------------------------

def append_records_to_formulary_intelligence(new_records: list[dict[str, Any]]) -> int:
    """
    Append new_records to the existing formulary_intelligence.json.

    The file ends with:
        ...last_record
      ]
    }

    We truncate the closing `  ]\n}\n` (7 bytes), insert a comma + new records,
    then re-close. Also updates the metadata.total_drug_records count via
    the same fixed-size reserved block written by StreamingJsonWriter.
    """
    if not new_records:
        return 0

    path = OUT_PATH
    if not path.exists():
        logger.error(f"{path} does not exist — run fetch_formulary_full.py first")
        raise FileNotFoundError(path)

    # Read the tail of the file to find the closing bracket position
    with open(path, "rb") as f:
        f.seek(0, 2)
        file_size = f.tell()
        tail_size = min(512, file_size)
        f.seek(file_size - tail_size)
        tail_bytes = f.read()

    # Normalise to LF for searching regardless of platform line endings
    tail = tail_bytes.decode("utf-8").replace("\r\n", "\n").replace("\r", "\n")

    # Find the last `]` before the closing `}`
    close_bracket_pos = tail.rfind("\n]")
    if close_bracket_pos == -1:
        close_bracket_pos = tail.rfind("]")
    if close_bracket_pos == -1:
        raise ValueError("Could not find closing array bracket in formulary_intelligence.json")

    # Map normalised position back to raw byte offset
    # Count how many raw bytes correspond to the normalised prefix
    prefix_normalised = tail[:close_bracket_pos]
    prefix_raw = tail_bytes.decode("utf-8")[:len(prefix_normalised)]
    raw_prefix_bytes = prefix_raw.encode("utf-8")
    truncate_at = file_size - tail_size + len(raw_prefix_bytes)

    with open(path, "r+", encoding="utf-8", newline="") as f:
        f.seek(truncate_at)
        f.truncate()
        # Append comma + new records
        for rec in new_records:
            f.write(",\n")
            json.dump(rec, f, default=str)
        # Re-close the array and object
        f.write("\n]\n}\n")

    logger.info(f"Appended {len(new_records):,} records to {path}")
    return len(new_records)


def update_metadata_record_count(added: int) -> None:
    """
    Read the current metadata.total_drug_records from formulary_intelligence.json
    and write the updated count back using the fixed-size reserved block.

    The StreamingJsonWriter reserves 2048 bytes at a fixed offset for metadata.
    We locate it by reading the first 4096 bytes and finding the JSON object.
    """
    path = OUT_PATH
    METADATA_RESERVE = 2048

    with open(path, "r+", encoding="utf-8") as f:
        header = f.read(4096)

    # Find the metadata JSON within the first 4096 bytes
    prefix = '{\n  "metadata": '
    start = header.find(prefix)
    if start == -1:
        logger.warning("Could not find metadata prefix — skipping metadata update")
        return

    meta_start = start + len(prefix)
    # The metadata block is METADATA_RESERVE bytes padded with spaces
    meta_json_raw = header[meta_start: meta_start + METADATA_RESERVE].rstrip()
    try:
        meta = json.loads(meta_json_raw)
    except json.JSONDecodeError as e:
        logger.warning(f"Could not parse metadata JSON: {e} — skipping update")
        return

    old_count = meta.get("total_drug_records", 0)
    meta["total_drug_records"] = old_count + added

    # Also update deduped_records if present
    if "deduped_records" in meta:
        meta["deduped_records"] = meta["total_drug_records"]
    if "raw_records" in meta:
        meta["raw_records"] = meta["total_drug_records"]

    new_meta_json = json.dumps(meta, default=str).ljust(METADATA_RESERVE)
    if len(new_meta_json) > METADATA_RESERVE:
        logger.warning("Updated metadata exceeds reserved block — writing sidecar")
        sidecar = path.with_suffix(".meta.json")
        with open(sidecar, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)
        return

    # Write back at the correct byte offset
    with open(path, "r+", encoding="utf-8") as f:
        f.seek(meta_start)
        f.write(new_meta_json)

    logger.info(f"Updated metadata: total_drug_records {old_count} -> {meta['total_drug_records']}")


def update_errors_file(new_errors: list[dict[str, Any]]) -> None:
    """Merge new failures into the existing formulary_errors.json."""
    if ERRORS_PATH.exists():
        with open(ERRORS_PATH, encoding="utf-8") as f:
            existing = json.load(f)
        all_errors = existing.get("errors", []) + new_errors
    else:
        all_errors = new_errors

    breakdown: dict[str, int] = {}
    for e in all_errors:
        s = e.get("status", "unknown")
        breakdown[s] = breakdown.get(s, 0) + 1

    output = {
        "metadata": {
            "total_errors": len(all_errors),
            "error_breakdown": breakdown,
            "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
        },
        "errors": all_errors,
    }
    with open(ERRORS_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, default=str)
    logger.info(f"Updated {ERRORS_PATH} — {len(all_errors)} total errors")


# -----------------------------------------------------------------------
# Main pipeline
# -----------------------------------------------------------------------

async def run(concurrency: int, dry_run: bool, skip_failed: bool = False) -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    issuers = MISSING_ISSUERS

    # Skip issuers that previously failed with non-retriable errors
    if skip_failed and RESULTS_PATH.exists():
        with open(RESULTS_PATH, encoding="utf-8") as f:
            prev = json.load(f)
        non_retriable = {"no_formulary_url", "index_parse_failed"}
        failed_ids: set[str] = set()
        for r in prev.get("results", []):
            if r.get("status") in non_retriable:
                for iid in r.get("issuer_ids", []):
                    failed_ids.add(iid)
        if failed_ids:
            issuers = [i for i in issuers if not any(iid in failed_ids for iid in i["issuer_ids"])]
            logger.info(f"Skipping {len(MISSING_ISSUERS) - len(issuers)} non-retriable issuers from previous run")

    total = len(issuers)
    logger.info(f"Processing {total} issuer groups (concurrency={concurrency}, dry_run={dry_run})")

    results: list[dict[str, Any]] = []
    all_new_records: list[dict[str, Any]] = []
    semaphore = asyncio.Semaphore(concurrency)
    start = time.time()

    connector = aiohttp.TCPConnector(limit=concurrency, limit_per_host=2)
    async with aiohttp.ClientSession(connector=connector) as session:
        for i, issuer in enumerate(issuers):
            async with semaphore:
                ids_str = ",".join(issuer["issuer_ids"])
                logger.info(
                    f"\n[{i+1}/{total}] {issuer.get('carrier_hint','')} "
                    f"| issuers=[{ids_str}] | states={issuer['states']}"
                )
                try:
                    result, records = await process_issuer(session, issuer, dry_run=dry_run)
                except Exception as e:
                    logger.error(f"  Unexpected error: {e}")
                    result = {**issuer, "status": "unexpected_error", "drug_records": 0,
                              "formulary_urls_found": 0, "drugs_urls_attempted": 0,
                              "drugs_urls_successful": 0, "error": str(e)[:500]}
                    records = []

                results.append(result)
                all_new_records.extend(records)

                icon = "OK" if result["status"] == "success" else "FAIL"
                logger.info(f"  {icon} {result['status']} — {result['drug_records']:,} records")

                await asyncio.sleep(DELAY_BETWEEN_ISSUERS)

    elapsed = time.time() - start
    success = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] not in ("success", "dry_run_skipped")]

    # Save per-run results
    run_output = {
        "metadata": {
            "run_date": __import__("datetime").datetime.utcnow().isoformat(),
            "issuers_attempted": total,
            "issuers_successful": len(success),
            "issuers_failed": len(failed),
            "new_drug_records": len(all_new_records),
            "elapsed_seconds": round(elapsed, 1),
            "dry_run": dry_run,
        },
        "results": results,
    }
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(run_output, f, indent=2, default=str)
    logger.info(f"Results saved to {RESULTS_PATH}")

    if not dry_run and all_new_records:
        added = append_records_to_formulary_intelligence(all_new_records)
        update_metadata_record_count(added)

    if failed:
        update_errors_file(failed)

    # Summary
    print(f"\n{'=' * 65}")
    print(f"MISSING FFE FORMULARY FETCH — RESULTS")
    print(f"{'=' * 65}")
    print(f"  Elapsed:          {elapsed/60:.1f} min")
    print(f"  Issuers attempted:{total}")
    print(f"  Successful:       {len(success)}")
    print(f"  Failed:           {len(failed)}")
    print(f"  New drug records: {len(all_new_records):,}")
    print(f"  Dry run:          {dry_run}")
    print(f"{'=' * 65}")

    if success:
        print("\nSuccessful fetches:")
        for r in success:
            print(f"  OK  [{','.join(r['issuer_ids'])}] {r.get('carrier_hint','')} — {r['drug_records']:,} records")

    if failed:
        print("\nFailed fetches:")
        for r in failed:
            ids = ",".join(r.get("issuer_ids", []))
            hint = r.get("carrier_hint", "")
            err = r.get("error", "")
            print(f"  FAIL [{ids}] {hint} — {r['status']}: {err[:80]}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch formulary data for 68 missing FFE issuers and merge into formulary_intelligence.json"
    )
    parser.add_argument("--concurrency", type=int, default=3,
                        help="Concurrent HTTP connections (default: 3)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Test URL reachability without writing any output files")
    parser.add_argument("--skip-failed", action="store_true",
                        help="Skip issuers that had non-retriable errors in the previous run")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    asyncio.run(run(concurrency=args.concurrency, dry_run=args.dry_run, skip_failed=args.skip_failed))


if __name__ == "__main__":
    main()
