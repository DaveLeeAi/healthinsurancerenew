#!/usr/bin/env python3
"""
Download Blue Shield of California 2026 IFP medical SBC PDFs.

Source: https://www.blueshieldca.com/en/broker/ifp/medical/summary-of-benefits-2026

Downloads English-language medical plan SBCs only (excludes dental, vision,
Spanish-language duplicates, and legal disclosure docs).

Output: data/raw/sbc_pdfs/blueshield_ca/
URL list: data/raw/blueshield_ca_sbc_urls.txt

Run:
  python scripts/etl/download_blueshield_ca_sbcs.py
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

# ── English medical SBC URLs (filtered from blueshieldca.com SBC page) ────────
# 30 plans: Trio HMO (standard + CSR), PPO (standard + CSR), AI/AN variants

BASE = "https://www.blueshieldca.com/content/dam/bsca/en/broker/docs/2026/ifp"

MEDICAL_SBCS: list[str] = [
    # ── Trio HMO Plans ───────────────────────────────────────────────────────
    f"{BASE}/2026-Platinum-HMO-A49340-EN.pdf",
    f"{BASE}/2026-Gold-HMO-A49339-EN.pdf",
    f"{BASE}/2026-Silver-70-HMO-Covered-CA-A49341-CC-EN.pdf",
    f"{BASE}/2026-Silver-70-Off-Exchange-HMO-A50276-EN.pdf",
    f"{BASE}/2026-Bronze-7500-A52621-EN.pdf",
    # ── Trio HMO CSR Plans ───────────────────────────────────────────────────
    f"{BASE}/2026-Silver-73-HMO-A49342-EN.pdf",
    f"{BASE}/2026-Silver-87-HMO-A49343-EN.pdf",
    f"{BASE}/2026-Silver-94-HMO-A49344-EN.pdf",
    # ── PPO Plans ────────────────────────────────────────────────────────────
    f"{BASE}/2026-Platinum-PPO-A46204-EN.pdf",
    f"{BASE}/2026-Gold-PPO-A46205-EN.pdf",
    f"{BASE}/2026-Silver-70-PPO-Covered-CA-A46206-CC-EN.pdf",
    f"{BASE}/2026-Silver-70-Off-Exchange-PPO-A50277-EN.pdf",
    f"{BASE}/2026-Silver-1750-A48369-EN.pdf",
    f"{BASE}/2026-Silver-2600-HDHP-A51880-EN.pdf",
    f"{BASE}/2026-Bronze-60-A46210-EN.pdf",
    f"{BASE}/2026-Bronze-60-HDHP-A46210-HSA-EN.pdf",
    f"{BASE}/2026-Minimum-Coverage-A46212-EN.pdf",
    # ── PPO CSR Plans ────────────────────────────────────────────────────────
    f"{BASE}/2026-Silver-73-PPO-A46207-EN.pdf",
    f"{BASE}/2026-Silver-87-PPO-A46208-EN.pdf",
    f"{BASE}/2026-Silver-94-PPO-A46209-EN.pdf",
    # ── AI/AN Plans (HMO) ────────────────────────────────────────────────────
    f"{BASE}/2026-Platinum-HMO-AI-AN-A49340-NA-EN.pdf",
    f"{BASE}/2026-Gold-HMO-AI-AN-A49339-NA-EN.pdf",
    f"{BASE}/2026-Silver-70-HMO-AI-AN-A49341-NA-EN.pdf",
    f"{BASE}/2026-0-Cost-Share-HMO-AI-AN-A49353-EN.pdf",
    # ── AI/AN Plans (PPO) ────────────────────────────────────────────────────
    f"{BASE}/2026-Platinum-PPO-AI-AN-A46204-NA-EN.pdf",
    f"{BASE}/2026-Gold-PPO-AI-AN-A46205-NA-EN.pdf",
    f"{BASE}/2026-Silver-70-PPO-AI-AN-A46206-NA-EN.pdf",
    f"{BASE}/2026-Bronze-60-AI-AN-A46210-NA-EN.pdf",
    f"{BASE}/2026-Bronze-60-HDHP-AI-AN-A46210-HSA-NA-EN.pdf",
    f"{BASE}/2026-0-Cost-Share-PPO-AI-AN-A46213-EN.pdf",
]

OUT_DIR = Path("data/raw/sbc_pdfs/blueshield_ca")
URLS_FILE = Path("data/raw/blueshield_ca_sbc_urls.txt")
CONCURRENCY = 4
TIMEOUT = aiohttp.ClientTimeout(total=120)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; HealthInsuranceRenew-DataBot/1.0; "
        "+https://healthinsurancerenew.com)"
    ),
    "Accept": "application/pdf,*/*",
}


async def download_one(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    url: str,
    dest_dir: Path,
) -> Path | None:
    filename = url.rsplit("/", 1)[-1]
    dest = dest_dir / filename
    if dest.exists():
        log.info("SKIP   %s (already downloaded)", filename)
        return dest
    async with sem:
        try:
            async with session.get(url, headers=HEADERS, allow_redirects=True) as resp:
                if resp.status != 200:
                    log.warning("HTTP %d  %s", resp.status, filename)
                    return None
                content = await resp.read()
                dest.write_bytes(content)
                log.info("SAVED  %s  (%d KB)", filename, len(content) // 1024)
                return dest
        except aiohttp.ClientError as exc:
            log.warning("Error %s: %s", filename, exc)
            return None
        except asyncio.TimeoutError:
            log.warning("Timeout %s", filename)
            return None


async def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Write URL manifest
    URLS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(URLS_FILE, "w", encoding="utf-8") as f:
        for url in MEDICAL_SBCS:
            f.write(url + "\n")
    log.info("Wrote %d URLs -> %s", len(MEDICAL_SBCS), URLS_FILE)

    log.info("Downloading %d Blue Shield CA SBC PDFs -> %s ...", len(MEDICAL_SBCS), OUT_DIR)
    sem = asyncio.Semaphore(CONCURRENCY)
    connector = aiohttp.TCPConnector(ssl=True, limit=CONCURRENCY)
    async with aiohttp.ClientSession(connector=connector, timeout=TIMEOUT) as session:
        tasks = [download_one(session, sem, url, OUT_DIR) for url in MEDICAL_SBCS]
        results = await asyncio.gather(*tasks)

    saved = [p for p in results if p is not None]
    log.info("Downloaded %d / %d PDFs", len(saved), len(MEDICAL_SBCS))
    if len(saved) < len(MEDICAL_SBCS):
        failed = [MEDICAL_SBCS[i].rsplit("/",1)[-1]
                  for i, r in enumerate(results) if r is None]
        log.warning("Failed: %s", failed)
    log.info("Run next: python scripts/etl/parse_sbc_pdfs_ca_blueshield.py")


if __name__ == "__main__":
    asyncio.run(main())
