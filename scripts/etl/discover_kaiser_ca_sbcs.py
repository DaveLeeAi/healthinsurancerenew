#!/usr/bin/env python3
"""
Discover and download Kaiser Permanente CA 2026 individual/family SBC PDFs.

URL pattern:
  https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/
  health-plan-documents/summary-of-benefits/ca/individual-family/2026/
  {PLAN_ID}-en-2026.pdf

Known working IDs: 40513CA0380002-00, 40513CA0380004-00

Steps:
  1. Probe 40513CA0380001-00 … 40513CA0380099-{02} via async HEAD requests
  2. Write all found URLs to data/raw/kaiser_ca_sbc_urls.txt
  3. Download all found PDFs to data/raw/sbc_pdfs/kaiser_ca/

Run:
  python scripts/etl/discover_kaiser_ca_sbcs.py
"""

import asyncio
import logging
import sys
from pathlib import Path

import aiohttp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

BASE_URL = (
    "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/"
    "health-plan-documents/summary-of-benefits/ca/individual-family/2026/"
)
ISSUER_PREFIX = "40513CA038"
PLAN_SEQ_RANGE = range(1, 100)     # 0001 … 0099
VARIANT_SUFFIXES = ["00", "01", "02"]
CONCURRENCY = 10                    # max simultaneous HEAD requests
DOWNLOAD_CONCURRENCY = 4            # max simultaneous PDF downloads
TIMEOUT = aiohttp.ClientTimeout(total=30)

OUT_DIR = Path("data/raw/sbc_pdfs/kaiser_ca")
URLS_FILE = Path("data/raw/kaiser_ca_sbc_urls.txt")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; HealthInsuranceRenew-DataBot/1.0; "
        "+https://healthinsurancerenew.com)"
    ),
    "Accept": "application/pdf,*/*",
}


# ── URL generation ────────────────────────────────────────────────────────────

def all_candidate_ids() -> list[str]:
    """Generate every candidate plan ID to probe."""
    ids = []
    for seq in PLAN_SEQ_RANGE:
        for suffix in VARIANT_SUFFIXES:
            plan_id = f"{ISSUER_PREFIX}{seq:04d}-{suffix}"
            ids.append(plan_id)
    return ids


def plan_url(plan_id: str) -> str:
    return f"{BASE_URL}{plan_id}-en-2026.pdf"


# ── Async probe ───────────────────────────────────────────────────────────────

async def probe_one(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    plan_id: str,
) -> str | None:
    """Return plan_id if URL exists (HTTP 200/301/302), else None."""
    url = plan_url(plan_id)
    async with sem:
        try:
            async with session.head(url, headers=HEADERS, allow_redirects=True) as resp:
                if resp.status == 200:
                    log.info("FOUND  %s  [%d]", plan_id, resp.status)
                    return plan_id
                elif resp.status in (301, 302):
                    # Follow redirect — treat as found
                    log.info("FOUND  %s  [%d → redirect]", plan_id, resp.status)
                    return plan_id
                else:
                    log.debug("MISS   %s  [%d]", plan_id, resp.status)
                    return None
        except aiohttp.ClientError as exc:
            log.debug("ERROR  %s  %s", plan_id, exc)
            return None
        except asyncio.TimeoutError:
            log.debug("TIMEOUT %s", plan_id)
            return None


async def probe_all(candidate_ids: list[str]) -> list[str]:
    """Probe all candidates; return list of found plan IDs."""
    sem = asyncio.Semaphore(CONCURRENCY)
    connector = aiohttp.TCPConnector(ssl=True, limit=CONCURRENCY)
    async with aiohttp.ClientSession(
        connector=connector,
        timeout=TIMEOUT,
    ) as session:
        tasks = [probe_one(session, sem, pid) for pid in candidate_ids]
        results = await asyncio.gather(*tasks)

    found = [pid for pid in results if pid is not None]
    return found


# ── Download ──────────────────────────────────────────────────────────────────

async def download_one(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    plan_id: str,
    dest_dir: Path,
) -> Path | None:
    """Download PDF for plan_id → dest_dir/{plan_id}-en-2026.pdf."""
    url = plan_url(plan_id)
    filename = f"{plan_id}-en-2026.pdf"
    dest = dest_dir / filename

    if dest.exists():
        log.info("SKIP   %s (already downloaded)", filename)
        return dest

    async with sem:
        try:
            async with session.get(url, headers=HEADERS, allow_redirects=True) as resp:
                if resp.status != 200:
                    log.warning("Download failed %s [%d]", plan_id, resp.status)
                    return None
                content = await resp.read()
                dest.write_bytes(content)
                log.info("SAVED  %s  (%d KB)", filename, len(content) // 1024)
                return dest
        except aiohttp.ClientError as exc:
            log.warning("Download error %s: %s", plan_id, exc)
            return None
        except asyncio.TimeoutError:
            log.warning("Download timeout %s", plan_id)
            return None


async def download_all(found_ids: list[str], dest_dir: Path) -> list[Path]:
    """Download all found PDFs; return list of saved paths."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(DOWNLOAD_CONCURRENCY)
    download_timeout = aiohttp.ClientTimeout(total=120)
    connector = aiohttp.TCPConnector(ssl=True, limit=DOWNLOAD_CONCURRENCY)
    async with aiohttp.ClientSession(
        connector=connector,
        timeout=download_timeout,
    ) as session:
        tasks = [download_one(session, sem, pid, dest_dir) for pid in found_ids]
        results = await asyncio.gather(*tasks)

    saved = [p for p in results if p is not None]
    return saved


# ── Main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    candidates = all_candidate_ids()
    log.info("Probing %d candidate plan IDs (seq 0001–0099, suffixes 00/01/02)…",
             len(candidates))

    found_ids = await probe_all(candidates)
    log.info("Found %d live URLs out of %d probed", len(found_ids), len(candidates))

    if not found_ids:
        log.warning("No PDFs found. Check URL pattern or network access.")
        return

    # Write URL list
    URLS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(URLS_FILE, "w", encoding="utf-8") as f:
        for pid in sorted(found_ids):
            f.write(plan_url(pid) + "\n")
    log.info("Wrote %d URLs -> %s", len(found_ids), URLS_FILE)

    # Download PDFs
    log.info("Downloading %d PDFs -> %s ...", len(found_ids), OUT_DIR)
    saved = await download_all(found_ids, OUT_DIR)
    log.info("Downloaded %d / %d PDFs", len(saved), len(found_ids))

    # Summary
    log.info("-" * 60)
    log.info("Plan IDs found:")
    for pid in sorted(found_ids):
        log.info("  %s", pid)
    log.info("-" * 60)
    log.info("Run next: python scripts/etl/parse_sbc_pdfs_ca_kaiser.py")


if __name__ == "__main__":
    asyncio.run(main())
