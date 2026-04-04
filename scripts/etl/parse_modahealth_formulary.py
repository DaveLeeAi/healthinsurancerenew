"""
Parse Moda Health IFP (Individual & Family Plan) formulary proxy PDF.
Updated 3/1/2026 — 679 pages, alphabetical index.

Column layout (text-based, not tabular):
  Drug Name  Special Code  Tier  Category

Tier values span two lines due to PDF layout:
  "Preferre\nd Brands", "Non-Pref\nerred\nBrands", "Select", "Value", "Specialty"

Note: Moda does not publish a separate individual/ACA formulary PDF; individual
plans use the Navitus online tool. This large group PDF is used as a proxy —
same PBM (Navitus), same drug coverage basis as IFP plans.

Output: data/processed/formulary_modahealth_ifp_2026.json
"""

import json
import logging
import re
from pathlib import Path

import pdfplumber

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

PDF_PATH = Path("data/raw/formulary_pdfs/modahealth/moda_largegroup.pdf")
OUT_FILE = Path("data/processed/formulary_modahealth_ifp_2026.json")

# Tier normalization — PDF splits tier names across lines
TIER_MAP = {
    "preferred brands": "Preferred Brands",
    "preferre": "Preferred Brands",   # partial first line
    "non-preferred brands": "Non-Preferred Brands",
    "non-pref": "Non-Preferred Brands",
    "select": "Select",
    "value": "Value",
    "specialty": "Specialty",
    "preventive": "Preventive",
    "high cost generics": "High Cost Generics",
    "high": "High Cost Generics",     # partial first line
    "exc": "Excluded",
}

# Known category names (all caps in PDF)
KNOWN_CATEGORIES = re.compile(
    r"^[A-Z][A-Z\s/\-&\.,]+$"
)

HEADER_RE = re.compile(
    r"^(Moda Large Group|Alphabetical Index|Last Updated|Drug Name Special Code)"
)


def normalize_tier(raw: str) -> str | None:
    """Collapse multi-line tier text to canonical value."""
    clean = raw.strip().lower()
    for key, val in TIER_MAP.items():
        if clean.startswith(key):
            return val
    return raw.strip() or None


def parse_line(line: str) -> dict | None:
    """
    Parse a single text line into drug record.
    Format: DRUG_NAME [SPECIAL_CODE] TIER CATEGORY
    Tier is one of: Select, Value, Preferre(d), Non-Pref(erred), Specialty, Preventive, -
    """
    line = line.strip()
    if not line:
        return None
    if HEADER_RE.match(line):
        return None

    # Match pattern: drug name ... [special codes] ... tier token ... category
    # Tier tokens we can detect at word boundaries
    tier_pattern = re.compile(
        r"\b(Select|Value|Preferre[d]?\s*Brands?|Non-Pref(?:erred)?\s*Brands?|Specialty|Preventive|High\s*Cost\s*Generics?|High|EXC)\b",
        re.IGNORECASE,
    )

    m = tier_pattern.search(line)
    if not m:
        return None

    tier_start = m.start()
    tier_end = m.end()

    drug_part = line[:tier_start].strip()
    remainder = line[tier_end:].strip()

    # Strip trailing OTC marker (appears before tier in some rows)
    otc_flag = False
    drug_part_clean = re.sub(r"\s+OTC\s*$", "", drug_part).strip()
    if drug_part_clean != drug_part:
        otc_flag = True
        drug_part = drug_part_clean

    # Extract special codes (PA, QL, ST, AMSP, etc.) from drug_part tail
    code_pattern = re.compile(r"\b([A-Z]{2,}(?:-[A-Z]{2,})*)\s*$")
    code_match = code_pattern.search(drug_part)
    special_code = None
    drug_name = drug_part
    if code_match:
        candidate = code_match.group(1)
        # Only treat as code if it looks like an abbreviation, not a drug name word
        if len(candidate) <= 15 and candidate.isupper():
            special_code = candidate
            drug_name = drug_part[: code_match.start()].strip()
    if otc_flag:
        special_code = ("OTC " + special_code) if special_code else "OTC"

    tier_raw = m.group(0)
    category = remainder.strip() or None

    drug_name = re.sub(r"\s+", " ", drug_name).strip()
    if not drug_name:
        return None

    return {
        "drug_name": drug_name,
        "special_code": special_code,
        "tier": normalize_tier(tier_raw),
        "category": category,
    }


def parse_pdf(pdf_path: Path) -> list[dict]:
    records = []
    seen = set()

    with pdfplumber.open(pdf_path) as pdf:
        log.info(f"Pages: {len(pdf.pages)}")
        for i, page in enumerate(pdf.pages):
            if i % 100 == 0:
                log.info(f"  Page {i+1}/{len(pdf.pages)}  records so far: {len(records):,}")
            text = page.extract_text() or ""
            for line in text.splitlines():
                rec = parse_line(line)
                if rec:
                    key = rec["drug_name"].lower()
                    if key not in seen:
                        seen.add(key)
                        records.append(rec)

    log.info(f"Total unique drug records: {len(records):,}")
    return records


def main() -> None:
    if not PDF_PATH.exists():
        log.error(f"PDF not found: {PDF_PATH}")
        return

    log.info("Parsing Moda Health IFP formulary proxy...")
    drugs = parse_pdf(PDF_PATH)

    from collections import Counter
    tier_dist = dict(Counter(d["tier"] for d in drugs).most_common())
    log.info(f"Tier distribution: {tier_dist}")

    output = {
        "source": "Moda Health IFP Formulary (large group proxy — no separate IFP PDF published)",
        "source_url": "https://www.modahealth.com/-/media/modahealth/shared/formulary/largegroup/Prescription-drug-list-large-group.pdf",
        "plan_year": 2026,
        "updated": "2026-03-01",
        "carrier_name": "Moda Health Plan",
        "hios_prefix": "80588",
        "states": ["ID", "OR"],
        "formulary_type": "ifp_proxy",
        "note": (
            "Large group commercial formulary — closest available proxy for Moda individual/ACA "
            "plans (same PBM: Navitus). No separate individual/ACA formulary PDF is published."
        ),
        "drug_count": len(drugs),
        "tier_distribution": tier_dist,
        "drugs": drugs,
    }

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    log.info(f"Written → {OUT_FILE}")


if __name__ == "__main__":
    main()
