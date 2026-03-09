"""
Fetch CMS PUF (Public Use Files) for a given plan year.

Downloads ZIP files from download.cms.gov, extracts CSVs to data/raw/puf/.
Each file is streamed to handle large downloads (Rate PUF can be ~2GB).

Usage:
    python scripts/fetch/fetch_puf.py
    python scripts/fetch/fetch_puf.py --year 2025
    python scripts/fetch/fetch_puf.py --only service-area-puf rate-puf
"""

import argparse
import logging
import time
import zipfile
from io import BytesIO
from pathlib import Path

import requests
from tqdm import tqdm

logger = logging.getLogger(__name__)

BASE_URL = "https://download.cms.gov/marketplace-puf/{year}/{slug}.zip"

# Ordered by fetch priority (smallest/foundational first)
PUF_FILES = [
    "service-area-puf",
    "plan-attributes-puf",
    "rate-puf",
    "machine-readable-url-puf",
    "benefits-and-cost-sharing-puf",
    "network-puf",
    "business-rules-puf",
    "transparency-in-coverage-puf",
    "plan-id-crosswalk-puf",
]

RAW_DIR = Path("data/raw/puf")
MAX_RETRIES = 3
CHUNK_SIZE = 1024 * 1024  # 1MB chunks for streaming


def fetch_with_retry(url: str, max_retries: int = MAX_RETRIES) -> requests.Response:
    """Fetch URL with exponential backoff retry. Streams response."""
    for attempt in range(max_retries):
        try:
            logger.info(f"Fetching {url} (attempt {attempt + 1}/{max_retries})")
            response = requests.get(url, stream=True, timeout=120)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            wait = 2 ** attempt
            logger.warning(f"Attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise RuntimeError(f"Failed to fetch {url} after {max_retries} attempts") from e
    raise RuntimeError("Unreachable")


def download_and_extract(slug: str, year: int) -> list[Path]:
    """Download a PUF ZIP and extract CSV(s) to data/raw/puf/."""
    url = BASE_URL.format(year=year, slug=slug)
    response = fetch_with_retry(url)

    # Get total size for progress bar
    total_size = int(response.headers.get("content-length", 0))
    label = f"{slug} ({total_size / 1024 / 1024:.0f}MB)" if total_size else slug

    # Stream download into memory buffer
    buffer = BytesIO()
    with tqdm(total=total_size, unit="B", unit_scale=True, desc=label) as pbar:
        for chunk in response.iter_content(chunk_size=CHUNK_SIZE):
            buffer.write(chunk)
            pbar.update(len(chunk))

    # Extract ZIP contents
    extracted_files: list[Path] = []
    buffer.seek(0)
    with zipfile.ZipFile(buffer) as zf:
        for member in zf.namelist():
            if member.endswith("/"):
                continue
            # Flatten: extract all files directly into RAW_DIR
            filename = Path(member).name
            target = RAW_DIR / filename
            logger.info(f"Extracting {member} → {target}")
            with zf.open(member) as src, open(target, "wb") as dst:
                while True:
                    chunk = src.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    dst.write(chunk)
            extracted_files.append(target)

    logger.info(f"Extracted {len(extracted_files)} file(s) from {slug}")
    return extracted_files


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch CMS PUF files")
    parser.add_argument("--year", type=int, default=2026, help="Plan year (default: 2026)")
    parser.add_argument("--only", nargs="+", help="Only fetch these PUF slugs")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    slugs = args.only if args.only else PUF_FILES
    logger.info(f"Fetching {len(slugs)} PUF file(s) for PY{args.year}")

    results: dict[str, list[Path]] = {}
    errors: dict[str, str] = {}

    for slug in slugs:
        try:
            files = download_and_extract(slug, args.year)
            results[slug] = files
        except Exception as e:
            logger.error(f"FAILED: {slug} — {e}")
            errors[slug] = str(e)

    # Summary
    print("\n" + "=" * 60)
    print(f"FETCH SUMMARY — PY{args.year}")
    print("=" * 60)
    for slug, files in results.items():
        for f in files:
            size_mb = f.stat().st_size / 1024 / 1024
            print(f"  OK {f.name} ({size_mb:.1f} MB)")
    for slug, err in errors.items():
        print(f"  FAIL {slug}: {err}")
    print(f"\nSuccess: {len(results)}/{len(slugs)} | Failed: {len(errors)}/{len(slugs)}")


if __name__ == "__main__":
    main()
