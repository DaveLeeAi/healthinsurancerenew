#!/usr/bin/env python3
"""
Split formulary_intelligence.json into per-state files for Phase 5 plan+drug pages.
Input:  data/processed/formulary_intelligence.json (4.0GB)
Output: data/processed/formulary/by-state/{STATE_CODE}.json
"""

import json
import os
import sys
from collections import defaultdict

INPUT_FILE = "data/processed/formulary_intelligence.json"
OUTPUT_DIR = "data/processed/formulary/by-state"


def main():
    if not os.path.exists(INPUT_FILE):
        print(f"ERROR: {INPUT_FILE} not found. Run formulary aggregation first.")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Loading {INPUT_FILE}...")
    print("WARNING: This file is ~4GB. Expect 30-60 seconds load time.")

    # Stream-read approach for memory efficiency
    state_records: dict[str, list] = defaultdict(list)
    record_count = 0

    with open(INPUT_FILE, "r") as f:
        data = json.load(f)

    if isinstance(data, list):
        records = data
    elif isinstance(data, dict):
        # Handle wrapped format: {"records": [...]} or {"data": [...]}
        records = data.get("records", data.get("data", []))
    else:
        print(f"ERROR: Unexpected data format: {type(data)}")
        sys.exit(1)

    print(f"Total records: {len(records):,}")

    for record in records:
        state = record.get("state_code", record.get("state", "UNKNOWN"))
        if state and state != "UNKNOWN":
            state_records[state.upper()].append(record)
            record_count += 1

    print(f"\nRecords with valid state: {record_count:,}")
    print(f"States found: {len(state_records)}")

    # Write per-state files
    for state_code, state_recs in sorted(state_records.items()):
        output_file = os.path.join(OUTPUT_DIR, f"{state_code}.json")
        with open(output_file, "w") as f:
            json.dump(state_recs, f)
        size_mb = os.path.getsize(output_file) / (1024 * 1024)
        print(f"  {state_code}: {len(state_recs):>10,} records ({size_mb:.1f} MB)")

    print(f"\nDone. {len(state_records)} state files written to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
