"""
Inspect downloaded PUF CSV files — show row counts, column names, and sample data.

Usage:
    python scripts/fetch/inspect_puf.py
    python scripts/fetch/inspect_puf.py --file data/raw/puf/SomeFile.csv
"""

import argparse
import logging
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/puf")


def inspect_csv(filepath: Path) -> dict:
    """Inspect a single CSV file. Returns summary dict."""
    logger.info(f"Inspecting {filepath.name}...")
    size_mb = filepath.stat().st_size / 1024 / 1024

    # Read just enough to get shape and columns
    # For very large files, count rows separately
    try:
        df = pd.read_csv(filepath, low_memory=False, nrows=5)
        columns = list(df.columns)

        # Count total rows without loading full file into memory
        row_count = sum(1 for _ in open(filepath, encoding="utf-8", errors="replace")) - 1  # subtract header

        return {
            "file": filepath.name,
            "size_mb": round(size_mb, 1),
            "rows": row_count,
            "columns": len(columns),
            "column_names": columns,
            "sample": df.head(2).to_dict(orient="records"),
        }
    except Exception as e:
        return {
            "file": filepath.name,
            "size_mb": round(size_mb, 1),
            "error": str(e),
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect PUF CSV files")
    parser.add_argument("--file", type=str, help="Inspect a specific file")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    if args.file:
        files = [Path(args.file)]
    else:
        files = sorted(RAW_DIR.glob("*.csv"))

    if not files:
        print(f"No CSV files found in {RAW_DIR}")
        return

    print(f"\n{'=' * 70}")
    print(f"PUF FILE INSPECTION — {len(files)} file(s)")
    print(f"{'=' * 70}")

    for filepath in files:
        result = inspect_csv(filepath)
        print(f"\n{'─' * 70}")
        print(f"📄 {result['file']}  ({result['size_mb']} MB)")

        if "error" in result:
            print(f"   ❌ Error: {result['error']}")
            continue

        print(f"   Rows: {result['rows']:,}")
        print(f"   Columns: {result['columns']}")
        print(f"   Column names:")
        # Print columns in groups of 4 for readability
        cols = result["column_names"]
        for i in range(0, len(cols), 4):
            chunk = cols[i:i + 4]
            print(f"     {', '.join(chunk)}")

    print(f"\n{'=' * 70}")


if __name__ == "__main__":
    main()
