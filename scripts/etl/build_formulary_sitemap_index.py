#!/usr/bin/env python3
"""
Build a compact formulary sitemap index: all valid (state_slug, drug_slug) pairs.

Reads:
  - .cache/formulary_drug_index.json     (drug_name -> byte offset/length)
  - data/processed/formulary_intelligence.json  (NDJSON blocks, 7+ GB)
  - data/processed/plan_intelligence.json  (issuer_id -> state_code mapping)
  - data/processed/formulary_sbm_*.json   (SBM issuer -> state mapping)

Writes:
  - data/processed/formulary_sitemap_index.json

The output is a compact JSON: { metadata: {...}, pairs: ["state-slug/drug-slug", ...] }
Each entry is a unique state-slug + drug-slug pair where at least one issuer in that
state carries the drug.
"""

import json
import os
import re
import sys
import time
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "processed"
CACHE_DIR = ROOT / ".cache"
INDEX_PATH = CACHE_DIR / "formulary_drug_index.json"
FORMULARY_PATH = DATA_DIR / "formulary_intelligence.json"
PLAN_INTEL_PATH = DATA_DIR / "plan_intelligence.json"
OUTPUT_PATH = DATA_DIR / "formulary_sitemap_index.json"

# State code -> slug mapping
STATE_NAMES = {
    "AL": "alabama", "AK": "alaska", "AZ": "arizona", "AR": "arkansas",
    "CA": "california", "CO": "colorado", "CT": "connecticut", "DE": "delaware",
    "DC": "district-of-columbia", "FL": "florida", "GA": "georgia", "HI": "hawaii",
    "ID": "idaho", "IL": "illinois", "IN": "indiana", "IA": "iowa",
    "KS": "kansas", "KY": "kentucky", "LA": "louisiana", "ME": "maine",
    "MD": "maryland", "MA": "massachusetts", "MI": "michigan", "MN": "minnesota",
    "MS": "mississippi", "MO": "missouri", "MT": "montana", "NE": "nebraska",
    "NV": "nevada", "NH": "new-hampshire", "NJ": "new-jersey", "NM": "new-mexico",
    "NY": "new-york", "NC": "north-carolina", "ND": "north-dakota", "OH": "ohio",
    "OK": "oklahoma", "OR": "oregon", "PA": "pennsylvania", "RI": "rhode-island",
    "SC": "south-carolina", "SD": "south-dakota", "TN": "tennessee", "TX": "texas",
    "UT": "utah", "VT": "vermont", "VA": "virginia", "WA": "washington",
    "WV": "west-virginia", "WI": "wisconsin", "WY": "wyoming",
}

SBM_STATES = ["NJ", "PA", "WA", "IL", "KY", "NV", "OR", "ID", "GA", "VA",
              "ME", "CA", "CO", "CT", "DC", "MD", "NM"]


def build_issuer_state_map() -> dict[str, set[str]]:
    """Build issuer_id -> set of state codes from plan_intelligence + SBM files."""
    issuer_states: dict[str, set[str]] = defaultdict(set)

    # 1. FFM states from plan_intelligence.json
    print("  Loading plan_intelligence.json for issuer->state mapping...")
    with open(PLAN_INTEL_PATH, "r", encoding="utf-8") as f:
        pi = json.load(f)
    for plan in pi.get("data", []):
        iid = plan.get("issuer_id")
        sc = plan.get("state_code")
        if iid and sc:
            issuer_states[str(iid)].add(sc.upper())
    print(f"    FFM: {len(issuer_states)} issuers across {len(set(s for ss in issuer_states.values() for s in ss))} states")

    # 2. SBM states from per-state formulary files
    sbm_count = 0
    for state in SBM_STATES:
        sbm_path = DATA_DIR / f"formulary_sbm_{state}.json"
        if not sbm_path.exists():
            continue
        try:
            with open(sbm_path, "r", encoding="utf-8") as f:
                sbm_data = json.load(f)
            for record in sbm_data.get("data", []):
                for iid in record.get("issuer_ids", []):
                    issuer_states[str(iid)].add(state)
                    sbm_count += 1
        except (json.JSONDecodeError, KeyError):
            pass
    print(f"    SBM: added {sbm_count} issuer-state mappings from {len(SBM_STATES)} state files")

    return dict(issuer_states)


def drug_name_to_slug(name: str) -> str:
    """Convert a CMS drug name to a URL-safe slug matching the site's convention.

    The formulary page uses: drugSlug.replace(/-/g, ' ') to reconstruct the display name.
    So the slug is just the lowercase, hyphenated version of the simplified drug name.

    For CMS names like '"0.25 ML SEMAGLUTIDE 0.68 MG/ML PEN INJECTOR [OZEMPIC]"',
    we extract the brand name from brackets if present, otherwise use the full name.
    """
    # Strip surrounding quotes
    name = name.strip().strip('"')

    # Extract brand name from [BRACKETS] if present
    bracket_match = re.search(r'\[([^\]]+)\]', name)
    if bracket_match:
        name = bracket_match.group(1)

    # Lowercase, replace non-alphanumeric with hyphens, collapse
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    # Collapse multiple hyphens
    slug = re.sub(r'-+', '-', slug)
    return slug


def main():
    t0 = time.time()
    print("=" * 60)
    print("Building formulary sitemap index")
    print("=" * 60)

    # Step 1: Build issuer -> state mapping
    print("\nStep 1: Building issuer->state mapping...")
    issuer_states = build_issuer_state_map()
    all_states = sorted(set(s for ss in issuer_states.values() for s in ss))
    print(f"  Total: {len(issuer_states)} issuers, {len(all_states)} states")

    # Step 2: Load the byte-offset index
    print("\nStep 2: Loading formulary drug index...")
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        drug_index = json.load(f)
    print(f"  {len(drug_index)} drug name entries in index")

    # Step 3: Stream through formulary file, reading each block
    print("\nStep 3: Scanning formulary blocks for issuer_ids...")
    # We'll collect: drug_slug -> set of state codes
    drug_states: dict[str, set[str]] = defaultdict(set)
    # Also track: drug_slug -> display name (shortest/simplest)
    drug_display: dict[str, str] = {}

    total_entries = len(drug_index)
    processed = 0
    skipped_no_states = 0

    with open(FORMULARY_PATH, "rb") as f:
        for drug_name_key, block_info in drug_index.items():
            processed += 1
            if processed % 5000 == 0:
                print(f"    Processed {processed}/{total_entries} drug entries "
                      f"({len(drug_states)} unique slugs so far)...")

            offset = block_info["offset"]
            length = block_info["length"]

            # Read the byte block
            f.seek(offset)
            block = f.read(length).decode("utf-8", errors="replace")

            # Parse NDJSON lines in block
            states_for_this_drug: set[str] = set()
            for line in block.split("\n"):
                line = line.strip().rstrip(",")
                if not line.startswith("{"):
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue

                issuer_ids = record.get("issuer_ids", [])
                if not issuer_ids and record.get("issuer_id"):
                    issuer_ids = [record["issuer_id"]]

                for iid in issuer_ids:
                    iid_str = str(iid)
                    if iid_str in issuer_states:
                        states_for_this_drug.update(issuer_states[iid_str])

            if not states_for_this_drug:
                skipped_no_states += 1
                continue

            # Convert CMS drug name key to slug
            # The key in the index is the raw drug_name (lowercase, with quotes)
            slug = drug_name_to_slug(drug_name_key)
            if not slug or len(slug) < 2:
                continue

            drug_states[slug].update(states_for_this_drug)

            # Track shortest display name for this slug
            clean_name = drug_name_key.strip().strip('"')
            bracket_match = re.search(r'\[([^\]]+)\]', clean_name)
            display = bracket_match.group(1) if bracket_match else clean_name
            if slug not in drug_display or len(display) < len(drug_display[slug]):
                drug_display[slug] = display

    print(f"\n  Scan complete:")
    print(f"    {processed} index entries processed")
    print(f"    {skipped_no_states} entries skipped (no state mapping)")
    print(f"    {len(drug_states)} unique drug slugs with state data")

    # Step 4: Build state-slug/drug-slug pairs
    print("\nStep 4: Building state/drug pairs...")
    pairs: list[str] = []
    states_with_drugs: set[str] = set()
    for drug_slug, state_codes in sorted(drug_states.items()):
        for sc in sorted(state_codes):
            state_slug = STATE_NAMES.get(sc)
            if not state_slug:
                continue
            pairs.append(f"{state_slug}/{drug_slug}")
            states_with_drugs.add(sc)

    print(f"  {len(pairs)} total state/drug pairs")
    print(f"  {len(states_with_drugs)} states with formulary data")
    print(f"  {len(drug_states)} unique drug slugs")

    # Step 5: Write output
    print("\nStep 5: Writing formulary_sitemap_index.json...")
    output = {
        "metadata": {
            "description": "All valid (state-slug, drug-slug) pairs for formulary sitemap",
            "total_pairs": len(pairs),
            "unique_drugs": len(drug_states),
            "unique_states": len(states_with_drugs),
            "states": sorted(states_with_drugs),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        },
        "pairs": pairs,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    file_size = os.path.getsize(OUTPUT_PATH)
    elapsed = time.time() - t0
    print(f"  Written: {OUTPUT_PATH}")
    print(f"  File size: {file_size / 1024 / 1024:.1f} MB")
    print(f"  Elapsed: {elapsed:.1f}s")
    print(f"\n{'=' * 60}")
    print(f"DONE — {len(pairs)} formulary sitemap URLs to generate")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
