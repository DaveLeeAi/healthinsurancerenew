"""
ETL: Build County Names Lookup (data/config/county-names.json)

Generates a FIPS → county name mapping from the CMS Service Area PUF,
which contains a CountyName column for each county row.

Output: data/config/county-names.json
  { "37183": "Wake", "48201": "Harris", ... }

County names are stored WITHOUT "County" suffix (add in display layer).

Usage:
    python scripts/etl/build_county_names.py

Prerequisites:
    data/raw/puf/service-area-puf.csv  (download from CMS PUF page)
"""

import json
import logging
from pathlib import Path

import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")
CONFIG_DIR = Path("data/config")


def build_county_names() -> dict[str, str]:
    """Read Service Area PUF and extract FIPS → county name mapping."""
    sa_path = RAW_DIR / "service-area-puf.csv"
    if not sa_path.exists():
        raise FileNotFoundError(
            f"Service Area PUF not found at {sa_path}. "
            "Download from https://www.cms.gov/marketplace/resources/data/public-use-files"
        )

    logger.info("Loading Service Area PUF...")
    df = pd.read_csv(sa_path, low_memory=False, usecols=["County", "CountyName", "StateCode"])
    logger.info(f"  Loaded {len(df):,} rows")

    # Drop rows without county FIPS or name
    df = df.dropna(subset=["County", "CountyName"])
    df = df[df["County"].astype(str).str.len() == 5]

    # Build FIPS → name map (strip trailing " County" suffix — we add it in display)
    mapping: dict[str, str] = {}
    for _, row in df.iterrows():
        fips = str(row["County"]).zfill(5)
        name = str(row["CountyName"]).strip()
        # Strip " County", " Parish", " Borough", " Census Area" suffixes for clean storage
        for suffix in [" County", " Parish", " Borough", " Census Area", " Municipality"]:
            if name.endswith(suffix):
                name = name[: -len(suffix)]
                break
        if fips not in mapping:
            mapping[fips] = name

    logger.info(f"  Mapped {len(mapping):,} unique county FIPS codes")
    return mapping


def main() -> None:
    mapping = build_county_names()

    out_path = CONFIG_DIR / "county-names.json"
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(mapping, f, separators=(",", ":"))
    logger.info(f"Wrote {len(mapping):,} entries to {out_path}")


if __name__ == "__main__":
    main()
