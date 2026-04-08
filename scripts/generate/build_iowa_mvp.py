#!/usr/bin/env python3
"""
build_iowa_mvp.py — Extract and normalize Iowa ACA plan data for the MVP.

Reads from existing project data files:
  - data/processed/plan_intelligence.json  (plans, premiums, deductibles)
  - data/processed/subsidy_engine.json     (APTC by county)
  - data/processed/rate_volatility.json    (county-level rate context)
  - data/processed/formulary_oscar_ia_4t_2026.json  (Oscar drug coverage)

Outputs:
  - data/processed/iowa_mvp_plans.json     (normalized Iowa dataset)

Usage:
  python scripts/generate/build_iowa_mvp.py
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "processed"
CONFIG_DIR = PROJECT_ROOT / "data" / "config"

STATE_CODE = "IA"


def load_json(filepath: Path) -> Any:
    """Load a JSON file with error handling."""
    if not filepath.exists():
        log.error("File not found: %s", filepath)
        sys.exit(1)
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_iowa_plans(plan_data: dict) -> list[dict]:
    """Extract and deduplicate Iowa plans from plan_intelligence.json.

    plan_intelligence has one record per plan × county. We deduplicate to
    one record per unique plan_id, keeping the list of counties served.
    """
    ia_records = [p for p in plan_data["data"] if p.get("state_code") == STATE_CODE]
    log.info("Found %d Iowa plan-county records", len(ia_records))

    # Group by plan_id
    plan_map: dict[str, dict] = {}
    for rec in ia_records:
        pid = rec["plan_id"]
        if pid not in plan_map:
            plan_map[pid] = {
                "plan_id": pid,
                "issuer_id": rec.get("issuer_id", ""),
                "issuer_name": rec.get("issuer_name", ""),
                "plan_name": rec.get("plan_name", pid),
                "state_code": STATE_CODE,
                "metal_level": rec.get("metal_level", ""),
                "plan_type": rec.get("plan_type", ""),
                "premiums": rec.get("premiums", {}),
                "deductible_individual": rec.get("deductible_individual"),
                "deductible_family": rec.get("deductible_family"),
                "oop_max_individual": rec.get("oop_max_individual") or rec.get("moop_individual"),
                "oop_max_family": rec.get("oop_max_family") or rec.get("moop_family"),
                "counties_served": [],
            }
        plan_map[pid]["counties_served"].append(rec.get("county_fips", ""))

    # Deduplicate county lists
    for plan in plan_map.values():
        plan["counties_served"] = sorted(set(plan["counties_served"]))

    plans = sorted(plan_map.values(), key=lambda p: (p["issuer_name"], p["metal_level"], p["plan_name"]))
    log.info("Deduplicated to %d unique Iowa plans across %d carriers",
             len(plans), len(set(p["issuer_name"] for p in plans)))
    return plans


def extract_iowa_subsidies(subsidy_data: dict) -> list[dict]:
    """Extract Iowa county-level subsidy records."""
    ia_subs = [s for s in subsidy_data["data"] if s.get("state_code") == STATE_CODE]
    log.info("Found %d Iowa subsidy (county) records", len(ia_subs))
    return ia_subs


def extract_iowa_rates(rate_data: dict) -> list[dict]:
    """Extract Iowa county-level rate volatility data."""
    ia_rates = [r for r in rate_data["data"] if r.get("state_code") == STATE_CODE]
    log.info("Found %d Iowa rate volatility records", len(ia_rates))
    return ia_rates


def load_oscar_formulary() -> list[dict]:
    """Load Oscar Iowa 4-tier formulary (the richer of the two Oscar files)."""
    filepath = DATA_DIR / "formulary_oscar_ia_4t_2026.json"
    if not filepath.exists():
        log.warning("Oscar IA formulary not found at %s — drug matching will be limited", filepath)
        return []
    data = load_json(filepath)
    drugs = data.get("data", data.get("drugs", []))
    log.info("Loaded %d Oscar IA formulary drugs", len(drugs))
    return drugs


def load_county_names() -> dict[str, str]:
    """Load FIPS → county name mapping."""
    filepath = CONFIG_DIR / "county-names.json"
    if not filepath.exists():
        return {}
    data = load_json(filepath)
    # Filter to Iowa FIPS codes (19xxx)
    return {fips: name for fips, name in data.items() if fips.startswith("19")}


def build_iowa_mvp_dataset() -> dict:
    """Build the complete Iowa MVP normalized dataset."""
    log.info("=" * 60)
    log.info("Building Iowa MVP normalized dataset")
    log.info("=" * 60)

    # Load source data
    plan_data = load_json(DATA_DIR / "plan_intelligence.json")
    subsidy_data = load_json(DATA_DIR / "subsidy_engine.json")
    rate_data = load_json(DATA_DIR / "rate_volatility.json")

    # Extract Iowa-specific data
    plans = extract_iowa_plans(plan_data)
    subsidies = extract_iowa_subsidies(subsidy_data)
    rates = extract_iowa_rates(rate_data)
    oscar_drugs = load_oscar_formulary()
    county_names = load_county_names()

    # Build carrier summary
    carriers = {}
    for p in plans:
        iname = p["issuer_name"]
        if iname not in carriers:
            carriers[iname] = {
                "issuer_id": p["issuer_id"],
                "issuer_name": iname,
                "plan_count": 0,
                "metal_levels": set(),
                "plan_types": set(),
                "has_formulary_data": iname == "Oscar Insurance Company",
            }
        carriers[iname]["plan_count"] += 1
        carriers[iname]["metal_levels"].add(p["metal_level"])
        carriers[iname]["plan_types"].add(p["plan_type"])

    # Convert sets to sorted lists for JSON serialization
    carrier_list = []
    for c in sorted(carriers.values(), key=lambda x: x["issuer_name"]):
        c["metal_levels"] = sorted(c["metal_levels"])
        c["plan_types"] = sorted(c["plan_types"])
        carrier_list.append(c)

    # Build the output dataset
    dataset = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "state": "Iowa",
            "state_code": STATE_CODE,
            "plan_year": 2026,
            "source_files": [
                "plan_intelligence.json",
                "subsidy_engine.json",
                "rate_volatility.json",
                "formulary_oscar_ia_4t_2026.json",
            ],
            "plan_count": len(plans),
            "county_count": len(county_names),
            "carrier_count": len(carrier_list),
            "formulary_drug_count": len(oscar_drugs),
            "data_limitations": {
                "cost_sharing": "SBC cost-sharing grid (copays, coinsurance) is not populated for Iowa plans. Only deductible and MOOP are available.",
                "formulary": "Drug formulary data is only available for Oscar Insurance Company. Other carriers have unverified drug coverage.",
                "providers": "No provider directory or network adequacy data is included.",
                "pharmacy_pricing": "No pharmacy-specific drug pricing data is available.",
            },
            "snapshot_note": "Based on 2026 CMS Public Use Files. Carrier rules and plan details can change. Verify all details before enrolling.",
        },
        "carriers": carrier_list,
        "plans": plans,
        "subsidies": subsidies,
        "rates": rates,
        "formulary": {
            "source": "Oscar Insurance Company — Iowa 4-Tier 2026 Formulary",
            "issuer_id": "36873",
            "drug_count": len(oscar_drugs),
            "drugs": oscar_drugs,
        },
        "county_names": county_names,
    }

    return dataset


def main() -> None:
    dataset = build_iowa_mvp_dataset()

    output_path = DATA_DIR / "iowa_mvp_plans.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    file_size_mb = output_path.stat().st_size / (1024 * 1024)
    log.info("=" * 60)
    log.info("Output: %s (%.1f MB)", output_path, file_size_mb)
    log.info("Plans: %d | Counties: %d | Carriers: %d | Drugs: %d",
             dataset["metadata"]["plan_count"],
             dataset["metadata"]["county_count"],
             dataset["metadata"]["carrier_count"],
             dataset["metadata"]["formulary_drug_count"])
    log.info("Done.")


if __name__ == "__main__":
    main()
