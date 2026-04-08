#!/usr/bin/env python3
"""
repair_formulary_intelligence.py
─────────────────────────────────
One-shot repair of data/processed/formulary_intelligence.json (4.2 GB master
formulary file). The file has been corrupted at the metadata/records boundary
by repeated in-place metadata-overwrite append cycles. Strict JSON parsers
fail at byte ~2599 with:

    json.decoder.JSONDecodeError: Expecting ',' delimiter: line 1 column 2600
    ijson.IncompleteJSONError: ... "is_priority_drug": false}lse,"issuer_ids"...

Existing readers (generate_drug_baselines.py line-by-line, data-loader.ts
byte-offset index) tolerate the corruption by accident — they never full-parse.
But the corruption can grow with each future append, and any future tool that
calls json.load() on this file will explode.

This script:
  1. Streams the corrupt file using the same line-skip pattern that
     generate_drug_baselines.py uses (so we lose nothing the build script
     wasn't already losing).
  2. Parses the metadata block tolerantly (raw_decode) and strips spurious
     record-like fields that one of the past appends accidentally injected
     into the metadata dict (drug_tier, prior_authorization, issuer_ids, etc.).
  3. Writes a NEW file at data/processed/formulary_intelligence.repaired.json
     with valid JSON: {"metadata": {...cleaned...}, "data": [{record}, ...]}
  4. Logs every skipped line to data/processed/formulary_intelligence.repair_audit.log
     so we have a permanent record of what was lost.
  5. Validates the new file with json.load() round-trip and prints diagnostics.

This script DOES NOT:
  - Modify the original file in any way.
  - Swap the repaired file into place. (Manual step after review.)
  - Upload to Vercel Blob. (Manual step after swap.)
  - Rebuild any downstream indexes. (Manual step after swap.)

Run:
  python scripts/etl/repair_formulary_intelligence.py

Then read the validation output and decide whether to swap.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data" / "processed"
SOURCE = DATA_DIR / "formulary_intelligence.json"
REPAIRED = DATA_DIR / "formulary_intelligence.repaired.json"
AUDIT_LOG = DATA_DIR / "formulary_intelligence.repair_audit.log"

# Bytes of the source file's first chunk to load when extracting metadata.
# Metadata is currently ~2.5 KB but has grown over time; 64 KB is safe headroom
# while still cheap to read.
HEAD_CHUNK_BYTES = 65_536

# Keys that appear in the current corrupt metadata dict but DO NOT belong there
# semantically. They're fields from a record that was partially absorbed into
# the metadata during one of the in-place overwrites. We strip them.
SPURIOUS_METADATA_KEYS = frozenset({
    "drug_tier",
    "prior_authorization",
    "step_therapy",
    "quantity_limit",
    "issuer_ids",
    "rxnorm_id",
    "is_priority_drug",
})


# ── Metadata extraction ───────────────────────────────────────────────────────

def extract_metadata(source_path: Path) -> tuple[dict, int, str]:
    """
    Read just enough of the source file to parse the metadata object.

    Returns:
        (metadata_dict, byte_position_after_metadata_close, leftover_garbage)

    Where leftover_garbage is the raw bytes between the metadata's closing }
    and the first newline — i.e. the corruption remnants we'll skip.
    """
    with source_path.open("rb") as fh:
        head_bytes = fh.read(HEAD_CHUNK_BYTES)

    head = head_bytes.decode("utf-8", errors="replace")

    # The file should start with: {"metadata":{...}
    # We use json.JSONDecoder.raw_decode to parse just the metadata sub-object.
    # raw_decode stops at the end of the first complete JSON value at idx.
    PREFIX = '{"metadata":'
    if not head.startswith(PREFIX):
        # Tolerate optional whitespace after the colon
        if not head.startswith('{"metadata"'):
            raise SystemExit(
                f"FATAL: source file does not start with {PREFIX!r}\n"
                f"  first 80 bytes: {head[:80]!r}"
            )
        # Find the colon and skip past it
        colon = head.index(":", len('{"metadata"'))
        idx = colon + 1
    else:
        idx = len(PREFIX)

    # Skip whitespace after the colon
    while idx < len(head) and head[idx] in " \t\r\n":
        idx += 1

    if idx >= len(head) or head[idx] != "{":
        raise SystemExit(
            f"FATAL: expected '{{' at byte {idx}, got {head[idx:idx+20]!r}"
        )

    # raw_decode the metadata object
    decoder = json.JSONDecoder()
    try:
        metadata, end_pos = decoder.raw_decode(head, idx=idx)
    except json.JSONDecodeError as e:
        raise SystemExit(
            f"FATAL: could not raw_decode metadata at byte {idx}: {e}\n"
            f"  context: ...{head[max(0,e.pos-60):e.pos+60]!r}..."
        )

    if not isinstance(metadata, dict):
        raise SystemExit(
            f"FATAL: metadata is not a dict, got {type(metadata).__name__}"
        )

    # Find the first newline after end_pos. Everything from end_pos to that
    # newline is corrupted leftover bytes from a previous record.
    nl_pos = head.find("\n", end_pos)
    if nl_pos == -1:
        raise SystemExit(
            f"FATAL: no newline after metadata close at byte {end_pos}; "
            f"head chunk may be too small"
        )

    leftover = head[end_pos:nl_pos]

    return metadata, nl_pos + 1, leftover


def clean_metadata(meta: dict, audit: list[str]) -> dict:
    """Strip spurious record-like fields and add a repair_history block."""
    cleaned = {}
    stripped = {}
    for k, v in meta.items():
        if k in SPURIOUS_METADATA_KEYS:
            stripped[k] = v
        else:
            cleaned[k] = v

    if stripped:
        audit.append(
            f"Stripped {len(stripped)} spurious metadata keys: "
            f"{sorted(stripped.keys())}"
        )

    cleaned["repair_history"] = {
        "repaired_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "repaired_by": "scripts/etl/repair_formulary_intelligence.py",
        "reason": (
            "In-place metadata-overwrite append cycles corrupted the boundary "
            "between metadata and records. Strict JSON parsers failed at "
            "byte ~2599. This repair re-serialized the file from a stream "
            "scan and stripped spurious record-like fields from metadata."
        ),
        "previous_corruption_signature": "is_priority_drug\": false}lse,",
        "stripped_metadata_keys": sorted(stripped.keys()),
    }

    return cleaned


# ── Body streaming ────────────────────────────────────────────────────────────

def stream_records(
    source_path: Path,
    body_start_byte: int,
    out_fh,
    audit_fh,
) -> tuple[int, int, int]:
    """
    Stream records from source starting at body_start_byte and write them as
    JSON-array elements to out_fh. Log every skipped line to audit_fh.

    Returns: (records_written, lines_skipped, parse_errors)
    """
    records_written = 0
    lines_skipped = 0
    parse_errors = 0
    last_progress = time.time()
    t0 = time.time()

    # Open in binary mode so we can seek to body_start_byte cleanly, then
    # decode line-by-line in a TextIOWrapper.
    raw = source_path.open("rb")
    try:
        raw.seek(body_start_byte)
        # Wrap in text mode with errors="replace" — same as the existing reader
        import io
        text_fh = io.TextIOWrapper(raw, encoding="utf-8", errors="replace", newline="")

        first_record_written = False
        for line_num, line in enumerate(text_fh, start=1):
            stripped = line.strip()
            if not stripped:
                continue

            # Skip the file's terminal closing brackets/braces
            if stripped in ("{", "}", "]", "]}", "],", "},"):
                continue

            # Strip trailing comma (records in the source are written as
            # "{...},\n" with a trailing comma on every line including the last
            # before the closing ]).
            if stripped.endswith(","):
                stripped = stripped[:-1]

            # Records must start with {
            if not stripped.startswith("{"):
                lines_skipped += 1
                audit_fh.write(
                    f"SKIP_NON_RECORD body_line={line_num}: {stripped[:200]!r}\n"
                )
                continue

            # Parse the record. If it fails, log and skip.
            try:
                rec = json.loads(stripped)
            except json.JSONDecodeError as e:
                parse_errors += 1
                audit_fh.write(
                    f"SKIP_PARSE_ERROR body_line={line_num} pos={e.pos}: "
                    f"{stripped[:200]!r}\n"
                )
                continue

            # Re-serialize with separators=(",",":") to keep the file as
            # compact as possible (the source uses both compact and spaced
            # formats — we normalize to compact).
            serialized = json.dumps(rec, separators=(",", ":"), ensure_ascii=False)

            if first_record_written:
                out_fh.write(",\n")
            else:
                first_record_written = True
            out_fh.write(serialized)

            records_written += 1

            now = time.time()
            if now - last_progress > 10:
                elapsed = now - t0
                rate = records_written / elapsed if elapsed > 0 else 0
                print(
                    f"  {records_written:,} records written "
                    f"({elapsed:.0f}s, {rate:,.0f}/s, "
                    f"{lines_skipped} skipped, {parse_errors} parse errors)",
                    flush=True,
                )
                last_progress = now
    finally:
        raw.close()

    return records_written, lines_skipped, parse_errors


# ── Validation ────────────────────────────────────────────────────────────────

def validate_repaired(
    repaired_path: Path,
    expected_records: int,
    audit: list[str],
) -> bool:
    """
    Validate the repaired file:
      1. json.load() succeeds (the original test that fails today)
      2. Top-level keys are exactly ["metadata", "data"]
      3. data is a list with the expected record count
      4. Records have the expected shape (drug_name, issuer_id or issuer_ids)
      5. File size is plausible (within 30% of source)
    """
    print("\n── Validation ──", flush=True)

    # 1. Strict JSON load
    print("  [1/5] Strict json.load() round-trip ...", flush=True)
    t0 = time.time()
    try:
        with repaired_path.open(encoding="utf-8") as f:
            obj = json.load(f)
    except Exception as e:
        print(f"    FAIL: {type(e).__name__}: {e}")
        return False
    print(f"    OK ({time.time()-t0:.1f}s)")

    # 2. Top-level shape
    print("  [2/5] Top-level shape ...", flush=True)
    if not isinstance(obj, dict):
        print(f"    FAIL: top-level is {type(obj).__name__}, expected dict")
        return False
    expected_keys = {"metadata", "data"}
    actual_keys = set(obj.keys())
    if actual_keys != expected_keys:
        print(f"    FAIL: top-level keys are {actual_keys}, expected {expected_keys}")
        return False
    print(f"    OK (keys: {sorted(actual_keys)})")

    # 3. Record count
    print("  [3/5] Record count ...", flush=True)
    data = obj["data"]
    if not isinstance(data, list):
        print(f"    FAIL: data is {type(data).__name__}, expected list")
        return False
    actual_records = len(data)
    if actual_records != expected_records:
        print(f"    FAIL: data has {actual_records:,} records, expected {expected_records:,}")
        return False
    print(f"    OK ({actual_records:,} records)")

    # 4. Record shape spot check (first, middle, last)
    print("  [4/5] Record shape spot check ...", flush=True)
    spot_indices = [0, actual_records // 2, actual_records - 1]
    for idx in spot_indices:
        rec = data[idx]
        if not isinstance(rec, dict):
            print(f"    FAIL: record[{idx}] is {type(rec).__name__}, expected dict")
            return False
        if "drug_name" not in rec:
            print(f"    FAIL: record[{idx}] missing drug_name: keys={list(rec.keys())}")
            return False
        # Either issuer_id (string) or issuer_ids (list) must be present
        if "issuer_id" not in rec and "issuer_ids" not in rec:
            print(f"    FAIL: record[{idx}] missing issuer_id/issuer_ids: keys={list(rec.keys())}")
            return False
    print(f"    OK (spot-checked indices: {spot_indices})")

    # 5. File size sanity
    print("  [5/5] File size sanity ...", flush=True)
    src_size = SOURCE.stat().st_size
    new_size = repaired_path.stat().st_size
    ratio = new_size / src_size
    if not (0.7 <= ratio <= 1.3):
        print(f"    WARN: new size is {ratio:.2f}x source ({new_size/1e9:.2f} GB vs {src_size/1e9:.2f} GB)")
        print(f"          (allowed range 0.7x–1.3x; investigate if outside)")
        # Not a hard fail — compact serialization can shrink the file noticeably
    print(f"    OK (source: {src_size/1e9:.2f} GB, repaired: {new_size/1e9:.2f} GB, ratio: {ratio:.2f}x)")

    return True


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    print("=" * 70)
    print("repair_formulary_intelligence — produces a clean copy")
    print("=" * 70)

    if not SOURCE.exists():
        print(f"FATAL: source not found at {SOURCE}")
        return 1

    src_size = SOURCE.stat().st_size
    print(f"\nSource: {SOURCE}")
    print(f"  size: {src_size:,} bytes ({src_size/1e9:.2f} GB)")
    print(f"\nRepaired output: {REPAIRED}")
    print(f"Audit log:       {AUDIT_LOG}")

    if REPAIRED.exists():
        print(f"\nFATAL: {REPAIRED.name} already exists. Delete it first if you want to re-run.")
        return 1

    audit_notes: list[str] = []

    # ── Step 1: Extract and clean metadata ─────────────────────────────────
    print("\n[Step 1/4] Extracting metadata from source head ...")
    t0 = time.time()
    metadata, body_start_byte, leftover = extract_metadata(SOURCE)
    print(f"  parsed metadata in {time.time()-t0:.2f}s")
    print(f"  metadata key count: {len(metadata)}")
    print(f"  metadata keys: {sorted(metadata.keys())}")
    print(f"  body starts at byte: {body_start_byte}")
    print(f"  corrupted leftover bytes: {len(leftover)}")
    print(f"  leftover preview: {leftover[:200]!r}")

    audit_notes.append(f"Extracted metadata: {len(metadata)} keys, body starts at byte {body_start_byte}")
    audit_notes.append(f"Corrupted leftover bytes (length {len(leftover)}): {leftover!r}")

    cleaned_meta = clean_metadata(metadata, audit_notes)
    print(f"\n  cleaned metadata key count: {len(cleaned_meta)}")
    print(f"  stripped keys: {sorted(set(metadata.keys()) - set(cleaned_meta.keys()) | {'repair_history'} - {'repair_history'})}")

    expected_records = metadata.get("raw_records") or metadata.get("deduped_records")
    print(f"\n  metadata claims raw_records:     {metadata.get('raw_records'):,}")
    print(f"  metadata claims deduped_records: {metadata.get('deduped_records'):,}")
    print(f"  (expected actual count is slightly less because of the corruption losses)")

    # ── Step 2: Open audit log and write the new file ──────────────────────
    print(f"\n[Step 2/4] Streaming records to {REPAIRED.name} ...")
    AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
    audit_fh = AUDIT_LOG.open("w", encoding="utf-8")
    try:
        audit_fh.write("# formulary_intelligence.json repair audit log\n")
        audit_fh.write(f"# Generated: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}\n")
        audit_fh.write(f"# Source: {SOURCE}\n")
        audit_fh.write(f"# Source size: {src_size:,} bytes\n")
        for note in audit_notes:
            audit_fh.write(f"# NOTE: {note}\n")
        audit_fh.write("#\n")
        audit_fh.write("# Below: every line that was skipped during the stream rewrite.\n")
        audit_fh.write("# Each entry shows the body line number (counting from byte body_start)\n")
        audit_fh.write("# and the first 200 chars of the skipped content.\n")
        audit_fh.write("#\n")

        # Open the new file and write metadata + opening of data array
        with REPAIRED.open("w", encoding="utf-8") as out_fh:
            # Write the repaired file as a streaming JSON object:
            #   {"metadata": {...}, "data": [
            #   {record},
            #   {record},
            #   ...
            #   {record}
            #   ]}
            out_fh.write('{"metadata":')
            json.dump(cleaned_meta, out_fh, separators=(",", ":"), ensure_ascii=False)
            out_fh.write(',\n"data":[\n')

            t0 = time.time()
            records_written, lines_skipped, parse_errors = stream_records(
                SOURCE, body_start_byte, out_fh, audit_fh
            )
            elapsed = time.time() - t0

            out_fh.write("\n]}\n")

        print(f"\n  records written: {records_written:,}")
        print(f"  lines skipped:   {lines_skipped:,}")
        print(f"  parse errors:    {parse_errors:,}")
        print(f"  elapsed:         {elapsed:.0f}s ({records_written/max(elapsed,0.001):,.0f} rec/s)")

        audit_fh.write(f"\n# SUMMARY\n")
        audit_fh.write(f"# records_written: {records_written}\n")
        audit_fh.write(f"# lines_skipped:   {lines_skipped}\n")
        audit_fh.write(f"# parse_errors:    {parse_errors}\n")
        audit_fh.write(f"# elapsed_seconds: {elapsed:.1f}\n")
    finally:
        audit_fh.close()

    # ── Step 3: Validate the new file ──────────────────────────────────────
    print(f"\n[Step 3/4] Validating {REPAIRED.name} ...")
    ok = validate_repaired(REPAIRED, expected_records=records_written, audit=audit_notes)

    if not ok:
        print(f"\n❌ VALIDATION FAILED — do NOT swap. Inspect {REPAIRED} and re-run.")
        return 2

    # ── Step 4: Print next-steps checklist ─────────────────────────────────
    print(f"\n[Step 4/4] Repair complete.")
    print()
    print("=" * 70)
    print("NEXT STEPS — manual, not done by this script")
    print("=" * 70)
    print(f"""
1. REVIEW the audit log:
     less {AUDIT_LOG}

   Confirm the skipped lines look like the expected boundary corruption
   (leftover record fragments) and not like a wider data loss event.

2. CROSS-CHECK against the previous baselines build. The old build script
   saw 14,851,095 ffe records. This repair saw {records_written:,} records.
   The delta should be small (handful of records, not thousands).

3. SWAP the files (atomic, instant, no copy):
     mv data/processed/formulary_intelligence.json data/processed/formulary_intelligence.json.bak
     mv data/processed/formulary_intelligence.repaired.json data/processed/formulary_intelligence.json

4. RE-RUN downstream builds and confirm outputs are within rounding:
     python scripts/generate/generate_drug_baselines.py
     python scripts/etl/build_formulary_sitemap_index.py
     # then any byte-offset index rebuild used by lib/data-loader.ts

5. UPLOAD the repaired file to Vercel Blob (replaces the old corrupt copy):
     # Use whatever script/CLI you normally use for blob uploads.
     # The blob URL must continue to point at "formulary_intelligence.json".

6. KEEP the .bak file for at least 7 days:
     # In 7 days, if nothing downstream has reported issues:
     #   rm data/processed/formulary_intelligence.json.bak
""")

    return 0


if __name__ == "__main__":
    sys.exit(main())
