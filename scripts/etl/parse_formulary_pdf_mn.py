#!/usr/bin/env python3
"""
Parse MN formulary PDFs → data/processed/formulary_sbm_MN.json

Carriers:
  1. Quartz 4-tier (Navitus PBM) — table extraction works
  2. UCare IFP (Navitus PBM) — word-position parsing (no table lines)

Output schema matches formulary_sbm_CA.json:
  drug_name, drug_tier, prior_authorization, step_therapy, quantity_limit,
  quantity_limit_detail, issuer_ids, rxnorm_id, is_priority_drug

Run: python scripts/etl/parse_formulary_pdf_mn.py
"""

import json
import logging
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ── Paths ────────────────────────────────────────────────────────────────────

BASE_DIR = Path("data/raw/sbc_pdfs/mn/formulary")
OUT_PATH = Path("data/processed/formulary_sbm_MN.json")

QUARTZ_PDF = BASE_DIR / "quartz_4tier_2026.pdf"
UCARE_PDF = BASE_DIR / "ucare_ifp_2026.pdf"

PLAN_YEAR = 2026

# ── Priority drugs (same as CA parser) ───────────────────────────────────────

PRIORITY_DRUGS = {
    "ozempic", "wegovy", "mounjaro", "zepbound", "semaglutide", "tirzepatide",
    "humira", "adalimumab", "eliquis", "apixaban", "xarelto", "rivaroxaban",
    "keytruda", "pembrolizumab", "opdivo", "nivolumab", "dupixent", "dupilumab",
    "jardiance", "empagliflozin", "farxiga", "dapagliflozin", "skyrizi",
    "tremfya", "cosentyx", "taltz", "stelara", "mavyret", "epclusa",
    "harvoni", "vyvanse", "adderall", "ritalin", "methylphenidate",
    "suboxone", "buprenorphine", "naloxone", "narcan", "metformin",
    "atorvastatin", "lipitor", "rosuvastatin", "crestor", "metoprolol",
    "lisinopril", "amlodipine", "omeprazole", "pantoprazole",
    "levothyroxine", "synthroid", "albuterol", "montelukast",
    "insulin", "lantus", "basaglar", "toujeo", "tresiba", "novolog",
    "humalog", "fiasp", "levemir", "trulicity", "victoza", "liraglutide",
    "saxenda", "qsymia", "contrave", "belviq",
}


def is_priority(drug_name: str) -> bool:
    name_lower = drug_name.lower()
    return any(p in name_lower for p in PRIORITY_DRUGS)


# ── Tier normalization ───────────────────────────────────────────────────────

TIER_MAP = {
    "1": "PREFERRED-GENERICS",
    "2": "PREFERRED-BRANDS",
    "3": "NON-PREFERRED-BRANDS",
    "4": "SPECIALTY",
    "5": "PREVENTIVE",
    "PV": "PREVENTIVE",
    "T1": "PREFERRED-GENERICS",
    "T2": "PREFERRED-BRANDS",
    "T3": "NON-PREFERRED-BRANDS",
    "T4": "SPECIALTY",
}


def normalize_tier(tier_str: str) -> str:
    """Normalise tier to uppercase label matching formulary_intelligence schema."""
    clean = tier_str.strip().upper()
    # Handle "T1 (G)" / "T2 (PB)" / "T3 (NP)" / "T4 (S)" / "T3 PV" formats
    m = re.match(r"^(T[1-4])\b", clean)
    if m:
        base = m.group(1)
        if "PV" in clean:
            return "PREVENTIVE"
        return TIER_MAP.get(base, clean)
    # "$0" cost-share items → PREVENTIVE
    if clean.startswith("$0"):
        return "PREVENTIVE"
    return TIER_MAP.get(clean, clean)


# ── Requirements parser ─────────────────────────────────────────────────────

def parse_requirements(req_text: str) -> dict:
    """Parse requirement string into structured flags."""
    text = req_text.upper()
    pa = bool(re.search(r"\bPA\b", text))
    st = bool(re.search(r"\bST\b", text))
    ql = bool(re.search(r"\bQL\b", text))
    sp = bool(re.search(r"\bSP\b", text))

    ql_detail = ""
    m = re.search(r"QL\s*\(([^)]+)\)", req_text, re.IGNORECASE)
    if m:
        ql_detail = m.group(1).strip()

    return {
        "prior_authorization": pa,
        "step_therapy": st,
        "quantity_limit": ql,
        "quantity_limit_detail": ql_detail,
        "specialty": sp,
    }


# ── Drug name cleaning ──────────────────────────────────────────────────────

def clean_drug_name(name: str) -> str:
    """Remove noise from parsed drug name strings."""
    if not name:
        return ""
    # Drop header rows
    if re.match(r"^Drug\s+Name\s*$", name, re.IGNORECASE):
        return ""
    if re.match(r"^DRUG\s+NAME\s*$", name):
        return ""
    # Normalise whitespace and encoding
    name = re.sub(r"\s+", " ", name).strip()
    name = name.replace("\ufffd", "'")
    # Drop if too short
    if len(name) < 2:
        return ""
    return name


# ══════════════════════════════════════════════════════════════════════════════
# QUARTZ PARSER — uses pdfplumber extract_tables()
# ══════════════════════════════════════════════════════════════════════════════

QUARTZ_ISSUER_ID = "30242"
QUARTZ_ISSUER_NAME = "Quartz Health Plan MN Corporation"

# Drug table pages: 20-101 (1-indexed), i.e. 19-100 (0-indexed)
QUARTZ_TABLE_START = 19
QUARTZ_TABLE_END = 101  # exclusive — pages 19..100

# Section header pattern: all-alpha category headers (no tier)
QUARTZ_SECTION_RE = re.compile(
    r"^[A-Z][A-Za-z /&,\-\(\)]+$"
)


def is_quartz_section_header(drug_name: str, tier: str) -> bool:
    """Detect section/category headers that aren't drugs."""
    if tier:
        return False
    name = drug_name.strip()
    if not name:
        return True
    # Headers like "Analgesics - Drugs for Pain" have no tier
    if QUARTZ_SECTION_RE.match(name) and len(name) > 3:
        return True
    return False


def parse_quartz() -> list[dict]:
    """Parse Quartz 4-tier formulary PDF using table extraction."""
    if not QUARTZ_PDF.exists():
        log.error("Quartz PDF not found: %s", QUARTZ_PDF)
        return []

    records = []
    with pdfplumber.open(QUARTZ_PDF) as pdf:
        total_pages = len(pdf.pages)
        end_page = min(QUARTZ_TABLE_END, total_pages)
        log.info("Quartz: %d pages, parsing pages %d-%d",
                 total_pages, QUARTZ_TABLE_START + 1, end_page)

        for i in range(QUARTZ_TABLE_START, end_page):
            tables = pdf.pages[i].extract_tables()
            if not tables:
                continue

            for table in tables:
                for row in table:
                    if not row or len(row) < 2:
                        continue

                    raw_name = (row[0] or "").strip()
                    raw_tier = (row[1] or "").strip()
                    raw_notes = (row[2] or "").strip() if len(row) > 2 else ""

                    # Skip header rows
                    if raw_name.lower().startswith("drug name"):
                        continue

                    # Skip section headers (no tier)
                    if is_quartz_section_header(raw_name, raw_tier):
                        continue

                    # Clean multi-line drug names
                    drug_name = clean_drug_name(raw_name.replace("\n", " "))
                    if not drug_name:
                        continue

                    # Must have a tier
                    if not raw_tier:
                        continue

                    drug_tier = normalize_tier(raw_tier)
                    flags = parse_requirements(raw_notes)

                    records.append({
                        "drug_name": drug_name,
                        "drug_tier": drug_tier,
                        "prior_authorization": flags["prior_authorization"],
                        "step_therapy": flags["step_therapy"],
                        "quantity_limit": flags["quantity_limit"],
                        "quantity_limit_detail": flags["quantity_limit_detail"],
                        "specialty": flags["specialty"],
                        "issuer_ids": [QUARTZ_ISSUER_ID],
                        "rxnorm_id": None,
                        "is_priority_drug": is_priority(drug_name),
                        "source": "PDF Drug List",
                        "source_file": QUARTZ_PDF.name,
                        "state_code": "MN",
                        "plan_year": PLAN_YEAR,
                    })

            if (i - QUARTZ_TABLE_START) % 20 == 0:
                log.info("  Quartz page %d/%d — %d records so far",
                         i + 1, total_pages, len(records))

    log.info("Quartz: %d raw records extracted", len(records))
    return records


# ══════════════════════════════════════════════════════════════════════════════
# UCare PARSER — uses word-position parsing (no table lines in PDF)
# ══════════════════════════════════════════════════════════════════════════════

UCARE_ISSUER_ID = "31822"
UCARE_ISSUER_NAME = "UCare"

# Drug table pages: 8-114 (1-indexed), i.e. 7-113 (0-indexed)
UCARE_TABLE_START = 7
UCARE_TABLE_END = 114  # exclusive — pages 7..113

# Layout constants (from word position analysis):
# Drug name: x0 42-270
# Tier digit: x0 ~319 (single digit 1-5)
# Requirements: x0 ~396+
UCARE_TIER_X_MIN = 300.0
UCARE_TIER_X_MAX = 370.0
UCARE_REQ_X_MIN = 390.0
UCARE_NAME_X_MAX = 275.0

UCARE_TIER_RE = re.compile(r"^[1-5]$")

# Section headers in UCare: ALL CAPS lines with no tier
UCARE_HEADER_PATTERNS = [
    re.compile(r"^[A-Z][A-Z /&,\-\(\)\.]+$"),  # ALL CAPS category
]


def parse_ucare_page(page) -> list[dict]:
    """Parse a single UCare page into drug entries using word positions."""
    words = page.extract_words(x_tolerance=3, y_tolerance=3)
    if not words:
        return []

    # Skip pages with just headers
    page_text = page.extract_text() or ""
    if page_text.strip().startswith("Index"):
        return []

    # Sort words by y position (top to bottom), then x
    words = sorted(words, key=lambda w: (round(w["top"]), w["x0"]))

    # Group words into rows by y position (within 4pt tolerance)
    rows: list[list[dict]] = []
    current_row: list[dict] = []
    current_y = -999.0

    for w in words:
        if abs(w["top"] - current_y) > 4.0:
            if current_row:
                rows.append(current_row)
            current_row = [w]
            current_y = w["top"]
        else:
            current_row.append(w)
    if current_row:
        rows.append(current_row)

    # Process rows into drug entries
    # UCare format: drug name spans multiple rows sometimes, tier is on the first line
    entries: list[dict] = []
    current_name_parts: list[str] = []
    current_tier: str = ""
    current_req_parts: list[str] = []

    def flush():
        nonlocal current_name_parts, current_tier, current_req_parts
        if current_name_parts and current_tier:
            entries.append({
                "name": " ".join(current_name_parts).strip(),
                "tier": current_tier,
                "reqs": " ".join(current_req_parts).strip(),
            })
        current_name_parts = []
        current_tier = ""
        current_req_parts = []

    for row_words in rows:
        # Skip header rows
        row_text = " ".join(w["text"] for w in row_words)
        if "DRUG NAME" in row_text and "DRUG TIER" in row_text:
            continue

        # Find tier digit in this row
        tier_word = None
        for w in row_words:
            if (UCARE_TIER_X_MIN <= w["x0"] <= UCARE_TIER_X_MAX
                    and UCARE_TIER_RE.match(w["text"])):
                tier_word = w
                break

        # Classify words
        name_words = []
        req_words = []
        for w in row_words:
            if w is tier_word:
                continue
            if w["x0"] < UCARE_NAME_X_MAX:
                name_words.append(w["text"])
            elif w["x0"] >= UCARE_REQ_X_MIN:
                req_words.append(w["text"])

        if tier_word:
            # New drug entry — flush previous
            flush()
            current_name_parts = name_words
            current_tier = tier_word["text"]
            current_req_parts = req_words
        else:
            # Continuation line — append to current entry
            if name_words:
                current_name_parts.extend(name_words)
            if req_words:
                current_req_parts.extend(req_words)

    flush()
    return entries


def is_ucare_section_header(name: str) -> bool:
    """Detect UCare section/category headers."""
    if not name:
        return True
    # All caps, no digits, typically category names
    stripped = name.strip()
    if stripped.isupper() and not any(c.isdigit() for c in stripped) and len(stripped) > 3:
        # But drug names in UCare can be uppercase too (brand names)
        # Section headers tend to be longer descriptive phrases
        # Check for common header patterns
        if any(sep in stripped for sep in [" - ", "/"]):
            return True
        # Multi-word all-caps with no parentheses are usually headers
        if len(stripped.split()) >= 2 and "(" not in stripped and "MG" not in stripped:
            return True
    return False


def parse_ucare() -> list[dict]:
    """Parse UCare IFP formulary PDF using word-position parsing."""
    if not UCARE_PDF.exists():
        log.error("UCare PDF not found: %s", UCARE_PDF)
        return []

    records = []
    with pdfplumber.open(UCARE_PDF) as pdf:
        total_pages = len(pdf.pages)
        end_page = min(UCARE_TABLE_END, total_pages)
        log.info("UCare: %d pages, parsing pages %d-%d",
                 total_pages, UCARE_TABLE_START + 1, end_page)

        for i in range(UCARE_TABLE_START, end_page):
            entries = parse_ucare_page(pdf.pages[i])

            for entry in entries:
                drug_name = clean_drug_name(entry["name"])
                if not drug_name:
                    continue

                # Skip section headers
                if is_ucare_section_header(drug_name):
                    continue

                tier_raw = entry["tier"]
                if not UCARE_TIER_RE.match(tier_raw):
                    continue

                drug_tier = normalize_tier(tier_raw)
                flags = parse_requirements(entry["reqs"])

                records.append({
                    "drug_name": drug_name,
                    "drug_tier": drug_tier,
                    "prior_authorization": flags["prior_authorization"],
                    "step_therapy": flags["step_therapy"],
                    "quantity_limit": flags["quantity_limit"],
                    "quantity_limit_detail": flags["quantity_limit_detail"],
                    "specialty": flags["specialty"],
                    "issuer_ids": [UCARE_ISSUER_ID],
                    "rxnorm_id": None,
                    "is_priority_drug": is_priority(drug_name),
                    "source": "PDF Drug List",
                    "source_file": UCARE_PDF.name,
                    "state_code": "MN",
                    "plan_year": PLAN_YEAR,
                })

            if (i - UCARE_TABLE_START) % 20 == 0:
                log.info("  UCare page %d/%d — %d records so far",
                         i + 1, total_pages, len(records))

    log.info("UCare: %d raw records extracted", len(records))
    return records


# ── Deduplication ────────────────────────────────────────────────────────────

def dedupe(records: list[dict]) -> list[dict]:
    """Deduplicate by drug_name + drug_tier. Merge issuer_ids for cross-carrier dupes."""
    seen: dict[tuple, int] = {}
    out: list[dict] = []

    for rec in records:
        key = (rec["drug_name"].upper(), rec["drug_tier"])
        if key in seen:
            idx = seen[key]
            # Merge issuer_ids
            existing_ids = set(out[idx]["issuer_ids"])
            for iid in rec["issuer_ids"]:
                if iid not in existing_ids:
                    out[idx]["issuer_ids"].append(iid)
                    existing_ids.add(iid)
            # Merge flags (OR logic — if any carrier requires PA, mark it)
            if rec["prior_authorization"]:
                out[idx]["prior_authorization"] = True
            if rec["step_therapy"]:
                out[idx]["step_therapy"] = True
            if rec["quantity_limit"]:
                out[idx]["quantity_limit"] = True
                if rec["quantity_limit_detail"] and not out[idx]["quantity_limit_detail"]:
                    out[idx]["quantity_limit_detail"] = rec["quantity_limit_detail"]
            if rec["specialty"]:
                out[idx]["specialty"] = True
            if rec["is_priority_drug"]:
                out[idx]["is_priority_drug"] = True
        else:
            seen[key] = len(out)
            out.append(rec)

    return out


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    all_records: list[dict] = []
    issuer_stats: dict[str, dict] = {}

    # Parse Quartz
    quartz_records = parse_quartz()
    if quartz_records:
        quartz_deduped = dedupe(quartz_records)
        log.info("Quartz after dedup: %d unique", len(quartz_deduped))
        all_records.extend(quartz_deduped)
        issuer_stats[QUARTZ_ISSUER_ID] = {
            "issuer_name": QUARTZ_ISSUER_NAME,
            "raw_count": len(quartz_records),
            "deduped_count": len(quartz_deduped),
        }

    # Parse UCare
    ucare_records = parse_ucare()
    if ucare_records:
        ucare_deduped = dedupe(ucare_records)
        log.info("UCare after dedup: %d unique", len(ucare_deduped))
        all_records.extend(ucare_deduped)
        issuer_stats[UCARE_ISSUER_ID] = {
            "issuer_name": UCARE_ISSUER_NAME,
            "raw_count": len(ucare_records),
            "deduped_count": len(ucare_deduped),
        }

    if not all_records:
        log.error("No records extracted from any MN formulary PDF")
        return

    # Cross-carrier dedup
    combined = dedupe(all_records)
    log.info("Combined after cross-carrier dedup: %d unique", len(combined))

    # Stats
    tier_counts = Counter(r["drug_tier"] for r in combined)
    for tier, count in sorted(tier_counts.items()):
        log.info("  %s: %d", tier, count)

    pa_count = sum(1 for r in combined if r["prior_authorization"])
    ql_count = sum(1 for r in combined if r["quantity_limit"])
    st_count = sum(1 for r in combined if r["step_therapy"])
    priority_count = sum(1 for r in combined if r["is_priority_drug"])
    multi_issuer = sum(1 for r in combined if len(r["issuer_ids"]) > 1)
    log.info("PA: %d  QL: %d  ST: %d  Priority: %d  Multi-issuer: %d",
             pa_count, ql_count, st_count, priority_count, multi_issuer)

    output = {
        "metadata": {
            "source": "MN formulary PDFs (Quartz + UCare)",
            "source_file": f"{QUARTZ_PDF.name}, {UCARE_PDF.name}",
            "issuer_id": f"{QUARTZ_ISSUER_ID},{UCARE_ISSUER_ID}",
            "issuer_name": f"{QUARTZ_ISSUER_NAME}, {UCARE_ISSUER_NAME}",
            "state_code": "MN",
            "plan_year": PLAN_YEAR,
            "total_drug_records": len(combined),
            "unique_drug_names": len({r["drug_name"] for r in combined}),
            "priority_drug_records": priority_count,
            "tier_breakdown": dict(tier_counts),
            "pa_count": pa_count,
            "ql_count": ql_count,
            "st_count": st_count,
            "issuers": issuer_stats,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "schema_version": "1.0",
            "note": (
                "Parsed from PDF drug lists. rxnorm_id=null (not in PDFs). "
                "Tier labels: PREFERRED-GENERICS=1, PREFERRED-BRANDS=2, "
                "NON-PREFERRED-BRANDS=3, SPECIALTY=4, PREVENTIVE=5/PV. "
                "Cross-carrier duplicates merged with combined issuer_ids. "
                "Matches formulary_sbm_CA.json schema."
            ),
        },
        "data": combined,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
        f.write("\n")

    log.info("Wrote %d records → %s", len(combined), OUT_PATH)


if __name__ == "__main__":
    main()
