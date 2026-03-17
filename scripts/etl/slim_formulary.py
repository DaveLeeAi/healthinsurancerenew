"""
Post-process formulary_intelligence.json to remove unused fields.
Reads the existing file line by line (JSON with NDJSON-style data array)
and writes a slimmed version with only UI-required fields.

Removes: plan_id, plan_year (not used by the UI)

Run: python scripts/etl/slim_formulary.py
"""

import json
import os
import sys
from pathlib import Path

INPUT = Path("data/processed/formulary_intelligence.json")
OUTPUT = Path("data/processed/formulary_intelligence_slim.json")

KEEP_FIELDS = {
    "drug_name", "drug_tier", "issuer_ids",
    "prior_authorization", "step_therapy",
    "quantity_limit", "rxnorm_id", "is_priority_drug",
}


def slim_record(record: dict) -> dict:
    """Keep only UI-required fields."""
    return {k: v for k, v in record.items() if k in KEEP_FIELDS}


def main() -> None:
    if not INPUT.exists():
        print(f"Input not found: {INPUT}")
        sys.exit(1)

    input_size = os.path.getsize(INPUT) / (1024**3)
    print(f"Input: {input_size:.2f} GB")

    count = 0
    skipped = 0
    with open(INPUT, encoding="utf-8") as fin, open(OUTPUT, "w", encoding="utf-8") as fout:
        for line_num, line in enumerate(fin, 1):
            stripped = line.strip()

            # Non-record lines: metadata wrapper, array brackets, etc.
            if not stripped.startswith("{") or stripped in ("{", "}"):
                fout.write(line)
                continue

            # Try to parse as a data record
            try:
                # Strip trailing comma for JSON parsing
                json_str = stripped.rstrip(",")
                record = json.loads(json_str)
                slimmed = slim_record(record)

                # Preserve trailing comma if original had one
                suffix = "," if stripped.endswith(",") else ""
                fout.write(json.dumps(slimmed, separators=(",", ":")) + suffix + "\n")
                count += 1

                if count % 1_000_000 == 0:
                    print(f"  {count:,} records processed...")

            except json.JSONDecodeError:
                # Not a valid JSON record line — pass through as-is
                fout.write(line)
                skipped += 1

    output_size = os.path.getsize(OUTPUT) / (1024**3)
    reduction = (1 - output_size / input_size) * 100 if input_size > 0 else 0
    print(f"Output: {output_size:.2f} GB ({count:,} records, {skipped} non-record lines)")
    print(f"Reduction: {reduction:.1f}%")

    # Replace original if output looks good
    if count > 0 and output_size < input_size * 0.95:
        bak = INPUT.with_suffix(".json.bak")
        print(f"Backing up original to {bak}")
        INPUT.rename(bak)
        OUTPUT.rename(INPUT)
        print("Replaced original with slimmed version")
    elif count > 0:
        print("Output is not significantly smaller — keeping both files")
    else:
        print("ERROR: No records processed — keeping original")
        OUTPUT.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
