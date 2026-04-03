#!/usr/bin/env python3
"""
Annual SBC Refresh Script
==========================
Usage: python scripts/refresh/annual-sbc-refresh.py --year 2027

Steps:
1. Check if new CMS SBE QHP PUF is available for target year
2. Download FFE QHP Landscape PUF (for sbc_decoded.json)
3. Download SBE QHP PUF ZIPs for all SBM states (for sbc_sbm_XX.json)
4. Run existing SBC parser
5. Validate output counts vs prior year
6. Report: new plans, removed plans, changed carriers

SBC data sources:
- FFE: https://data.cms.gov/marketplace/qualified-health-plan-landscape-puf
- SBM: https://data.cms.gov/marketplace/qualified-health-plan-sbe-puf
"""

import argparse
import json
import os
import sys
import logging
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# CMS data catalog API
CMS_CATALOG_URL = "https://data.cms.gov/data-api/v1/dataset"

# Known PUF endpoints (check CMS for updated URLs each year)
PUF_SOURCES = {
    "qhp_landscape": {
        "name": "QHP Landscape PUF",
        "description": "Consumer-facing plan comparison data (FFE states)",
        "catalog_keyword": "qualified-health-plan-landscape",
        "download_page": "https://data.cms.gov/marketplace/qualified-health-plan-landscape-puf",
        "output": "data/raw/puf/qhp_landscape_{year}.csv",
        "parser": "scripts/etl/build_sbc_from_puf.py",
    },
    "sbe_qhp": {
        "name": "SBE QHP PUF",
        "description": "State-based exchange plan data (SBM states)",
        "catalog_keyword": "qualified-health-plan-sbe",
        "download_page": "https://data.cms.gov/marketplace/qualified-health-plan-sbe-puf",
        "output": "data/raw/puf/sbe_qhp_{year}.zip",
        "parser": "scripts/etl/build_sbc_sbm.py",
    },
    "plan_attributes": {
        "name": "Plan Attributes PUF",
        "description": "Detailed plan benefit attributes",
        "catalog_keyword": "plan-attributes",
        "download_page": "https://www.cms.gov/marketplace/resources/data/public-use-files",
        "output": "data/raw/puf/plan_attributes_{year}.csv",
    },
    "bencs": {
        "name": "Benefits and Cost Sharing PUF",
        "description": "Per-service copay/coinsurance details",
        "catalog_keyword": "benefits-cost-sharing",
        "download_page": "https://www.cms.gov/marketplace/resources/data/public-use-files",
        "output": "data/raw/puf/bencs_{year}.csv",
        "parser": "scripts/etl/build_bencs_cost_sharing.py",
    },
    "rate_puf": {
        "name": "Rate PUF",
        "description": "Premium rates by plan, age, tobacco, rating area",
        "catalog_keyword": "rate",
        "download_page": "https://www.cms.gov/marketplace/resources/data/public-use-files",
        "output": "data/raw/puf/rate_{year}.csv",
        "parser": "scripts/etl/build_rate_volatility.py",
    },
    "mr_puf": {
        "name": "Machine-Readable PUF",
        "description": "Carrier index.json URLs for formulary data",
        "catalog_keyword": "machine-readable",
        "download_page": "https://www.cms.gov/marketplace/resources/data/public-use-files",
        "output": "data/raw/puf/machine-readable-url-puf-{year}.xlsx",
        "parser": "scripts/fetch/fetch_formulary_full.py",
    },
}

# Prior year baseline counts for validation
BASELINE_COUNTS_2026 = {
    "sbc_decoded": 20354,  # FFE plan variants
    "sbc_sbm_total": 7234,  # SBM plan variants (estimate)
    "formulary_ffe": 196303,
    "formulary_sbm": 305442,
}


def check_url_available(url: str) -> tuple[bool, int]:
    """HEAD check if a URL is available."""
    try:
        req = Request(url, method="HEAD")
        req.add_header("User-Agent", "Mozilla/5.0 HealthInsuranceRenew/1.0")
        with urlopen(req, timeout=15) as resp:
            return (True, resp.status)
    except HTTPError as e:
        return (False, e.code)
    except Exception:
        return (False, -1)


def load_prior_year_counts(year: int) -> dict:
    """Load record counts from prior year's processed files."""
    counts = {}

    # sbc_decoded.json
    sbc_path = os.path.join(ROOT, "data", "processed", "sbc_decoded.json")
    if os.path.exists(sbc_path):
        try:
            with open(sbc_path, encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                counts["sbc_decoded"] = len(data)
            elif isinstance(data, dict) and "data" in data:
                counts["sbc_decoded"] = len(data["data"])
        except Exception as e:
            log.warning(f"Could not read sbc_decoded.json: {e}")

    # formulary_intelligence.json
    fi_path = os.path.join(ROOT, "data", "processed", "formulary_intelligence.json")
    if os.path.exists(fi_path):
        try:
            with open(fi_path, encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and "data" in data:
                counts["formulary_ffe"] = len(data["data"])
        except Exception as e:
            log.warning(f"Could not read formulary_intelligence.json: {e}")

    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description="Annual SBC Data Refresh")
    parser.add_argument("--year", type=int, required=True, help="Target plan year (e.g. 2027)")
    parser.add_argument("--check-only", action="store_true", help="Only check if PUFs are available, don't download")
    args = parser.parse_args()

    year = args.year
    prior_year = year - 1

    log.info(f"=== SBC REFRESH FOR PY{year} ===")
    log.info(f"Prior year: PY{prior_year}")
    log.info("")

    # Step 1: Check PUF availability
    log.info("--- Step 1: Checking CMS PUF availability ---")
    for key, source in PUF_SOURCES.items():
        log.info(f"  {source['name']}:")
        log.info(f"    Check: {source['download_page']}")
        available, status = check_url_available(source["download_page"])
        log.info(f"    Status: {'Available' if available else f'Not available ({status})'}")

    if args.check_only:
        log.info("\n--check-only mode, stopping here.")
        log.info(f"\nTo proceed with download, run without --check-only flag.")
        log.info(f"Expected CMS PUF release: October-November {prior_year}")
        return

    # Step 2: Load prior year baselines
    log.info("\n--- Step 2: Prior year baselines ---")
    prior_counts = load_prior_year_counts(prior_year)
    for key, count in prior_counts.items():
        log.info(f"  {key}: {count:,} records")

    # Step 3: Print download instructions
    log.info("\n--- Step 3: Download instructions ---")
    log.info("The following PUF files need to be downloaded manually from CMS:")
    log.info("")
    for key, source in PUF_SOURCES.items():
        output = source["output"].format(year=year)
        log.info(f"  {source['name']}:")
        log.info(f"    URL: {source['download_page']}")
        log.info(f"    Save to: {output}")
        if source.get("parser"):
            log.info(f"    Then run: python {source['parser']} --year {year}")
        log.info("")

    # Step 4: Validation checklist
    log.info("--- Step 4: Post-download validation checklist ---")
    log.info("After downloading and parsing, verify:")
    log.info(f"  [ ] sbc_decoded.json record count >= {BASELINE_COUNTS_2026.get('sbc_decoded', '?'):,}")
    log.info(f"  [ ] formulary_intelligence.json record count >= {BASELINE_COUNTS_2026.get('formulary_ffe', '?'):,}")
    log.info(f"  [ ] SBM formulary total >= {BASELINE_COUNTS_2026.get('formulary_sbm', '?'):,}")
    log.info("  [ ] No new states missing (compare carrier lists)")
    log.info("  [ ] New market entrants captured")
    log.info("  [ ] Market exits removed")
    log.info("")

    # Generate report
    os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)
    report_path = os.path.join(ROOT, "docs", f"sbc-refresh-status-{year}.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"=== SBC REFRESH STATUS FOR PY{year} ===\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")

        f.write("PUF FILES NEEDED:\n")
        for key, source in PUF_SOURCES.items():
            output = source["output"].format(year=year)
            f.write(f"  {source['name']}\n")
            f.write(f"    Download: {source['download_page']}\n")
            f.write(f"    Save to: {output}\n")
            if source.get("parser"):
                f.write(f"    Parse: python {source['parser']} --year {year}\n")
            f.write("\n")

        f.write("PRIOR YEAR BASELINES:\n")
        for key, count in prior_counts.items():
            f.write(f"  {key}: {count:,}\n")
        for key, count in BASELINE_COUNTS_2026.items():
            if key not in prior_counts:
                f.write(f"  {key}: {count:,} (hardcoded baseline)\n")

    log.info(f"Status report saved: {report_path}")
    log.info("Done!")


if __name__ == "__main__":
    main()
