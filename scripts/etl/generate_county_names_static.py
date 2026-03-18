"""
Generate data/config/county-names.json from the US Census Bureau
national county FIPS reference file.

No CMS PUF required. Downloads ~200 KB from Census Bureau once.

Output: data/config/county-names.json
  { "37183": "Wake", "48201": "Harris", ... }

Names stored WITHOUT "County" / "Parish" suffix (display layer adds it).

Usage:
    python scripts/etl/generate_county_names_static.py
"""

import csv
import io
import json
import logging
import urllib.request
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# US Census Bureau national county reference file (public domain, no API key needed)
CENSUS_URL = (
    "https://www2.census.gov/geo/docs/reference/codes/files/national_county.txt"
)

SUFFIXES = [
    " County", " Parish", " Borough", " Census Area",
    " Municipality", " City and Borough", " Island", " Municipio",
]

CONFIG_DIR = Path("data/config")


def strip_suffix(name: str) -> str:
    for suffix in SUFFIXES:
        if name.endswith(suffix):
            return name[: -len(suffix)].strip()
    return name.strip()


def download_county_names() -> dict[str, str]:
    logger.info(f"Downloading county reference from Census Bureau...")
    with urllib.request.urlopen(CENSUS_URL, timeout=30) as resp:
        content = resp.read().decode("latin-1")
    logger.info(f"  Downloaded {len(content):,} bytes")

    mapping: dict[str, str] = {}
    reader = csv.reader(io.StringIO(content))
    # Columns: STATE, STATEFP, COUNTYFP, COUNTYNAME, CLASSFP
    for row in reader:
        if len(row) < 4:
            continue
        state_fp = row[1].strip().zfill(2)
        county_fp = row[2].strip().zfill(3)
        county_name = row[3].strip()
        if not state_fp.isdigit() or not county_fp.isdigit():
            continue
        fips = state_fp + county_fp
        mapping[fips] = strip_suffix(county_name)

    logger.info(f"  Parsed {len(mapping):,} county FIPS entries")
    return mapping


def main() -> None:
    mapping = download_county_names()

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    out_path = CONFIG_DIR / "county-names.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(mapping, f, separators=(",", ":"), ensure_ascii=False)

    logger.info(f"Wrote {len(mapping):,} entries to {out_path}")
    logger.info("Sample entries:")
    sample_fips = ["37183", "48201", "28003", "12086", "06037"]
    for fips in sample_fips:
        logger.info(f"  {fips} → {mapping.get(fips, '(not found)')}")


if __name__ == "__main__":
    main()
