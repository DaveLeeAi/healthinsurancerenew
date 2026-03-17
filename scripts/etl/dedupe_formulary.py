"""
Deduplicate formulary_intelligence.json by grouping records that share
the same (drug_name, drug_tier, prior_authorization, step_therapy,
quantity_limit) and merging their issuer_ids.

Reduces ~20.5M per-plan records to ~500K-2M unique drug+tier+restriction
combinations, cutting file size from ~6 GB to under 2 GB.

Input:  data/processed/formulary_intelligence.json   (NDJSON inside JSON wrapper)
Output: data/processed/formulary_intelligence.json   (replaced in-place, backup kept)

Run: python scripts/etl/dedupe_formulary.py
"""

import json
import os
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

INPUT = Path("data/processed/formulary_intelligence.json")
OUTPUT = Path("data/processed/formulary_intelligence_deduped.json")


def make_group_key(rec: dict[str, Any]) -> tuple:
    """Build the dedup key: (drug_name, drug_tier, PA, ST, QL)."""
    return (
        rec.get("drug_name", ""),
        rec.get("drug_tier", ""),
        bool(rec.get("prior_authorization")),
        bool(rec.get("step_therapy")),
        bool(rec.get("quantity_limit")),
    )


def main() -> None:
    if not INPUT.exists():
        print(f"Input not found: {INPUT}")
        sys.exit(1)

    input_size_gb = os.path.getsize(INPUT) / (1024**3)
    print(f"Input: {input_size_gb:.2f} GB")

    # ── Pass 1: read all records, group by key ──────────────────────────
    print("Pass 1: reading and grouping records...")
    t0 = time.time()

    groups: dict[tuple, dict[str, Any]] = {}
    raw_count = 0
    skipped = 0
    metadata_lines: list[str] = []
    in_data = False

    with open(INPUT, encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()

            # Detect start of data array
            if not in_data:
                metadata_lines.append(line)
                if '"data"' in stripped and "[" in stripped:
                    in_data = True
                continue

            # End of data array / end of file
            if stripped in ("]", "]}") or not stripped.startswith("{"):
                continue

            # Parse record
            try:
                json_str = stripped.rstrip(",")
                rec = json.loads(json_str)
            except json.JSONDecodeError:
                skipped += 1
                continue

            raw_count += 1
            if raw_count % 2_000_000 == 0:
                elapsed = time.time() - t0
                print(f"  {raw_count:,} records read ({elapsed:.0f}s)...")

            key = make_group_key(rec)

            if key not in groups:
                # First occurrence — seed the group
                issuer_ids = rec.get("issuer_ids") or []
                groups[key] = {
                    "drug_name": rec.get("drug_name", ""),
                    "drug_tier": rec.get("drug_tier", ""),
                    "prior_authorization": bool(rec.get("prior_authorization")),
                    "step_therapy": bool(rec.get("step_therapy")),
                    "quantity_limit": bool(rec.get("quantity_limit")),
                    "issuer_ids": set(issuer_ids),
                    "rxnorm_id": rec.get("rxnorm_id"),
                    "is_priority_drug": bool(rec.get("is_priority_drug")),
                }
            else:
                g = groups[key]
                # Merge issuer_ids
                for iid in (rec.get("issuer_ids") or []):
                    g["issuer_ids"].add(iid)
                # Keep first non-null rxnorm_id
                if g["rxnorm_id"] is None and rec.get("rxnorm_id"):
                    g["rxnorm_id"] = rec["rxnorm_id"]
                # is_priority_drug = True if ANY record has it True
                if rec.get("is_priority_drug"):
                    g["is_priority_drug"] = True

    elapsed = time.time() - t0
    print(f"  Read {raw_count:,} records in {elapsed:.0f}s")
    print(f"  Grouped into {len(groups):,} unique combinations")
    print(f"  Dedup ratio: {raw_count / max(len(groups), 1):.1f}x")
    if skipped:
        print(f"  Skipped {skipped} malformed lines")

    # ── Pass 2: write deduped output ────────────────────────────────────
    print("Pass 2: writing deduped output...")
    t1 = time.time()

    # Sort groups by drug_name for better index locality
    sorted_keys = sorted(groups.keys(), key=lambda k: k[0].lower())

    with open(OUTPUT, "w", encoding="utf-8") as f:
        # Write metadata header
        f.write('{\n')
        f.write(f'  "metadata": {{"status": "complete", "raw_records": {raw_count}, "deduped_records": {len(groups)}}},\n')
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

        f.write(']\n}\n')

    elapsed2 = time.time() - t1
    output_size_gb = os.path.getsize(OUTPUT) / (1024**3)
    output_size_mb = os.path.getsize(OUTPUT) / (1024**2)
    input_size_mb = os.path.getsize(INPUT) / (1024**2)
    reduction = (1 - output_size_mb / input_size_mb) * 100

    print(f"  Wrote {len(groups):,} records in {elapsed2:.0f}s")
    print(f"  Output: {output_size_mb:.0f} MB ({output_size_gb:.2f} GB)")
    print(f"  Reduction: {reduction:.0f}%")

    # ── Replace original ────────────────────────────────────────────────
    bak = INPUT.with_suffix(".json.bak")
    if bak.exists():
        print(f"  Removing old backup: {bak}")
        bak.unlink()
    print(f"  Backing up original to {bak.name}")
    INPUT.rename(bak)
    OUTPUT.rename(INPUT)
    print(f"  Replaced original with deduped version")

    total_elapsed = time.time() - t0
    print(f"\nDone in {total_elapsed:.0f}s total.")
    print(f"  {raw_count:,} -> {len(groups):,} records ({reduction:.0f}% size reduction)")


if __name__ == "__main__":
    main()
