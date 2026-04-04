"""
Parse PacificSource 2026 drug list PDFs (ID, MT, OR, WA, COMPDL).

Columns: DRUG NAME | TIER | REQUIREMENTS/LIMITS
Section headers appear as rows where TIER and REQUIREMENTS are None.
Output: data/processed/formulary_pacificsource_2026.json
"""

import json
import logging
import re
from pathlib import Path

import pdfplumber

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

RAW_DIR = Path("data/raw/formulary_pdfs/pacificsource")
OUT_FILE = Path("data/processed/formulary_pacificsource_2026.json")

PDFS = {
    "ID": "pacificsource_ID_2026.pdf",
    "MT": "pacificsource_MT_2026.pdf",
    "OR": "pacificsource_OR_2026.pdf",
    "WA": "pacificsource_WA_2026.pdf",
    "COMPDL": "pacificsource_COMPDL_2026.pdf",
}

# Map state codes to carrier info
STATE_META = {
    "ID": {"carrier_name": "PacificSource Health Plans (ID)", "hios_prefix": "60597"},
    "MT": {"carrier_name": "PacificSource Health Plans (MT)", "hios_prefix": None},
    "OR": {"carrier_name": "PacificSource Health Plans (OR)", "hios_prefix": "10091"},
    "WA": {"carrier_name": "PacificSource Health Plans (WA)", "hios_prefix": None},
    "COMPDL": {"carrier_name": "PacificSource Preferred PDL", "hios_prefix": None},
}


def normalize_drug_name(raw: str) -> str:
    """Collapse whitespace/newlines in drug name."""
    return re.sub(r"\s+", " ", raw.strip()) if raw else ""


def is_section_header(row: list) -> bool:
    """True if row is a category/section header (TIER and REQUIREMENTS are blank)."""
    if not row or len(row) < 3:
        return False
    return bool(row[0]) and not row[1] and not row[2]


def parse_pdf(state: str, pdf_path: Path) -> list[dict]:
    """Parse one PDF, return list of drug records."""
    records = []
    current_category = ""
    current_subcategory = ""
    header_depth = 0  # track category vs subcategory level by ALL_CAPS vs Title Case

    with pdfplumber.open(pdf_path) as pdf:
        log.info(f"  {state}: {len(pdf.pages)} pages")
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row or not row[0]:
                        continue

                    name_raw = row[0] or ""
                    tier_raw = row[1] if len(row) > 1 else None
                    reqs_raw = row[2] if len(row) > 2 else None

                    # Skip table header row
                    if name_raw.strip().upper() == "DRUG NAME":
                        continue

                    # Section/category header
                    if is_section_header(row):
                        name_clean = normalize_drug_name(name_raw)
                        # ALL CAPS = top-level category; mixed = subcategory
                        if name_clean == name_clean.upper() and len(name_clean) > 3:
                            current_category = name_clean
                            current_subcategory = ""
                        else:
                            current_subcategory = name_clean
                        continue

                    # Drug row
                    tier = tier_raw.strip() if tier_raw else None
                    if not tier:
                        continue  # skip malformed rows

                    records.append(
                        {
                            "drug_name": normalize_drug_name(name_raw),
                            "tier": tier,
                            "requirements": (reqs_raw or "").strip() or None,
                            "category": current_category,
                            "subcategory": current_subcategory or None,
                        }
                    )

    log.info(f"  {state}: {len(records):,} drug records parsed")
    return records


def main() -> None:
    output: dict = {
        "source": "PacificSource 2026 Drug List PDFs",
        "source_url": "https://pacificsource.com/find-a-drug",
        "plan_year": 2026,
        "updated": "2026-02-23",
        "states": {},
    }

    total = 0
    for state, filename in PDFS.items():
        pdf_path = RAW_DIR / filename
        if not pdf_path.exists():
            log.warning(f"Missing: {pdf_path}")
            continue

        log.info(f"Parsing {state}...")
        drugs = parse_pdf(state, pdf_path)
        output["states"][state] = {
            **STATE_META[state],
            "state": state,
            "drug_count": len(drugs),
            "drugs": drugs,
        }
        total += len(drugs)

    output["total_drug_records"] = total
    log.info(f"Total: {total:,} records across {len(output['states'])} state PDFs")

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    log.info(f"Written → {OUT_FILE}")


if __name__ == "__main__":
    main()
