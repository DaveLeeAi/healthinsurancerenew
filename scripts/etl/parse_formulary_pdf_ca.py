#!/usr/bin/env python3
"""
Parse Ambetter CA drug formulary PDF → data/processed/formulary_sbm_CA.json

Source: data/raw/sbc_pdfs/ambetter_ca/pharmacy/hn-ambetter-essential-drug-list-2026.pdf
Output schema matches formulary_intelligence.json:
  drug_name, drug_tier, prior_authorization, step_therapy, quantity_limit,
  quantity_limit_detail, issuer_ids, rxnorm_id, is_priority_drug

The PDF uses a 2-column layout (boundary ≈ x=300).
Within each column: drug name (x < ~185/465) | tier (x ~185-200/465-480) | reqs (x >= 218/497)

Run: python scripts/etl/parse_formulary_pdf_ca.py
"""

import json
import logging
import re
from datetime import datetime
from pathlib import Path

import pdfplumber

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

PDF_PATH = Path(
    "data/raw/sbc_pdfs/ambetter_ca/pharmacy/hn-ambetter-essential-drug-list-2026.pdf"
)
OUT_PATH = Path("data/processed/formulary_sbm_CA.json")

ISSUER_ID = "67138"
ISSUER_NAME = "Ambetter from Health Net (CA)"
PLAN_YEAR = 2026

# Column split x-coordinate (words with x0 < this = left column)
COL_SPLIT = 300.0

# Within left column: tier lives at x ~185-205; right column: ~465-485
LEFT_TIER_X_MIN, LEFT_TIER_X_MAX = 180.0, 210.0
RIGHT_TIER_X_MIN, RIGHT_TIER_X_MAX = 460.0, 490.0

# Tier digit pattern (1-5, or PV)
TIER_RE = re.compile(r"^([1-5]|PV)$", re.IGNORECASE)

# Priority drugs (high-value / commonly searched)
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


def normalize_tier(tier_str: str) -> str:
    """Normalise tier to uppercase label matching formulary_intelligence schema."""
    tier_map = {
        "1": "PREFERRED-GENERICS",
        "2": "PREFERRED-BRANDS",
        "3": "NON-PREFERRED-BRANDS",
        "4": "SPECIALTY",
        "5": "PREVENTIVE",
        "PV": "PREVENTIVE",
    }
    return tier_map.get(tier_str.upper(), tier_str.upper())


def parse_requirements(req_text: str) -> dict:
    """
    Parse requirement abbreviation string into structured flags.
    Examples: 'PA', 'QL(1 EA daily); SP; PA', 'ST; QL(28 TABS per 30 days)'
    """
    text = req_text.upper()
    pa = bool(re.search(r"\bPA\b", text))
    st = bool(re.search(r"\bST\b", text))
    ql = bool(re.search(r"\bQL\b", text))
    sp = bool(re.search(r"\bSP\b", text))
    ac = bool(re.search(r"\bAC\b", text))
    la = bool(re.search(r"\bLA\b", text))

    # Extract QL detail
    ql_detail = ""
    m = re.search(r"QL\(([^)]+)\)", req_text, re.IGNORECASE)
    if m:
        ql_detail = m.group(1).strip()

    return {
        "prior_authorization": pa,
        "step_therapy": st,
        "quantity_limit": ql,
        "quantity_limit_detail": ql_detail,
        "specialty": sp,
        "anti_cancer": ac,
        "limited_access": la,
    }


def is_priority(drug_name: str) -> bool:
    name_lower = drug_name.lower()
    return any(p in name_lower for p in PRIORITY_DRUGS)


# ── Column parser ─────────────────────────────────────────────────────────────

def _is_tier_word(word: dict, x_min: float, x_max: float) -> bool:
    return x_min <= word["x0"] <= x_max and TIER_RE.match(word["text"])


def _in_band(word: dict, x_min: float, x_max: float) -> bool:
    return x_min <= word["x0"] <= x_max


def parse_column(words: list, name_x_max: float, tier_x_min: float, tier_x_max: float,
                 req_x_min: float) -> list[dict]:
    """
    Parse one column's words into drug entries.

    Each entry:
      name_words (x0 < name_x_max)  +  tier_word (at tier_x)  +  req_words (x0 >= req_x_min)

    Words are sorted by y0 (top to bottom).
    """
    if not words:
        return []

    # Sort by y then x
    words = sorted(words, key=lambda w: (round(w["top"] / 3) * 3, w["x0"]))

    entries = []
    current_name_parts: list[str] = []
    current_tier: str = ""
    current_req_parts: list[str] = []
    in_entry = False

    def flush():
        nonlocal current_name_parts, current_tier, current_req_parts, in_entry
        if current_name_parts and current_tier:
            entries.append({
                "name": " ".join(current_name_parts).strip(),
                "tier": current_tier,
                "reqs": " ".join(current_req_parts).strip(),
            })
        current_name_parts = []
        current_tier = ""
        current_req_parts = []
        in_entry = False

    for word in words:
        text = word["text"]
        x0 = word["x0"]

        if _is_tier_word(word, tier_x_min, tier_x_max):
            # Flush previous entry and start a new one
            if in_entry:
                flush()
            current_tier = text
            in_entry = True
            continue

        if not in_entry:
            # Accumulate name words before we've seen a tier
            if x0 < name_x_max:
                current_name_parts.append(text)
            continue

        # We are in an entry (tier seen)
        if x0 < name_x_max:
            # This is a continuation of the name on a new line? Or a new drug?
            # Only treat as name continuation if no tier yet for new entry
            # Since we already set in_entry, these are probably continuation words
            current_name_parts.append(text)
        elif x0 >= req_x_min:
            current_req_parts.append(text)

    # Flush last entry
    if in_entry:
        flush()

    return entries


def parse_page(page) -> list[dict]:
    """Parse a single page into drug entries from both columns."""
    words = page.extract_words(
        x_tolerance=3, y_tolerance=3, keep_blank_chars=False,
        use_text_flow=False, extra_attrs=["fontname", "size"]
    )
    if not words:
        return []

    # Split into left / right columns
    left_words = [w for w in words if w["x0"] < COL_SPLIT]
    right_words = [w for w in words if w["x0"] >= COL_SPLIT]

    # Left column: name x < 180, tier x 180-210, req x >= 218
    left_entries = parse_column(
        left_words,
        name_x_max=182.0, tier_x_min=LEFT_TIER_X_MIN, tier_x_max=LEFT_TIER_X_MAX,
        req_x_min=215.0,
    )
    # Right column: name x < 460, tier x 460-490, req x >= 495
    right_entries = parse_column(
        right_words,
        name_x_max=462.0, tier_x_min=RIGHT_TIER_X_MIN, tier_x_max=RIGHT_TIER_X_MAX,
        req_x_min=493.0,
    )

    return left_entries + right_entries


def clean_drug_name(name: str) -> str:
    """Remove noise from parsed drug name strings."""
    # Drop header rows
    if re.match(r"^Drug\s+Name\s*$", name, re.IGNORECASE):
        return ""
    # Drop section headers (all caps, no digits)
    if name.isupper() and not any(c.isdigit() for c in name) and len(name) < 60:
        return ""
    # Normalise whitespace and encoding
    name = re.sub(r"\s+", " ", name).strip()
    name = name.replace("\ufffd", "'")
    return name


def build_record(entry: dict) -> dict | None:
    drug_name = clean_drug_name(entry["name"])
    if not drug_name or len(drug_name) < 2:
        return None

    tier_raw = entry["tier"].upper()
    if not TIER_RE.match(tier_raw):
        return None

    drug_tier = normalize_tier(tier_raw)
    flags = parse_requirements(entry["reqs"])

    return {
        "drug_name": drug_name,
        "drug_tier": drug_tier,
        "prior_authorization": flags["prior_authorization"],
        "step_therapy": flags["step_therapy"],
        "quantity_limit": flags["quantity_limit"],
        "quantity_limit_detail": flags["quantity_limit_detail"],
        "specialty": flags["specialty"],
        "issuer_ids": [ISSUER_ID],
        "rxnorm_id": None,
        "is_priority_drug": is_priority(drug_name),
        "source": "PDF Drug List",
        "source_file": PDF_PATH.name,
        "state_code": "CA",
        "plan_year": PLAN_YEAR,
    }


# ── Deduplication ─────────────────────────────────────────────────────────────

def dedupe(records: list[dict]) -> list[dict]:
    """Keep the first occurrence of each drug_name + drug_tier combination."""
    seen: set[tuple] = set()
    out = []
    for rec in records:
        key = (rec["drug_name"].upper(), rec["drug_tier"])
        if key not in seen:
            seen.add(key)
            out.append(rec)
    return out


# ── Main ──────────────────────────────────────────────────────────────────────

# Pages to skip: cover, TOC, intro (typically pages 1-18), and index pages at end
SKIP_BEFORE_PAGE = 18   # 0-indexed: skip pages 0-17
SKIP_AFTER_PAGE = 155   # skip index pages near end (approximate)


def main() -> None:
    if not PDF_PATH.exists():
        log.error("PDF not found: %s", PDF_PATH)
        return

    with pdfplumber.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        log.info("PDF has %d pages. Parsing pages %d-%d",
                 total_pages, SKIP_BEFORE_PAGE + 1, SKIP_AFTER_PAGE)

        raw_entries: list[dict] = []
        for i in range(SKIP_BEFORE_PAGE, min(SKIP_AFTER_PAGE, total_pages)):
            page = pdf.pages[i]
            entries = parse_page(page)
            raw_entries.extend(entries)
            if (i - SKIP_BEFORE_PAGE) % 20 == 0:
                log.info("  Page %d/%d — %d entries so far",
                         i + 1, total_pages, len(raw_entries))

    log.info("Raw entries extracted: %d", len(raw_entries))

    records = []
    for entry in raw_entries:
        rec = build_record(entry)
        if rec:
            records.append(rec)

    log.info("Valid records before dedup: %d", len(records))
    records = dedupe(records)
    log.info("After dedup: %d unique drug entries", len(records))

    # Tier breakdown
    from collections import Counter
    tier_counts = Counter(r["drug_tier"] for r in records)
    for tier, count in sorted(tier_counts.items()):
        log.info("  %s: %d", tier, count)

    pa_count = sum(1 for r in records if r["prior_authorization"])
    ql_count = sum(1 for r in records if r["quantity_limit"])
    st_count = sum(1 for r in records if r["step_therapy"])
    priority_count = sum(1 for r in records if r["is_priority_drug"])
    log.info("PA: %d  QL: %d  ST: %d  Priority: %d", pa_count, ql_count, st_count, priority_count)

    output = {
        "metadata": {
            "source": "Ambetter CA (Health Net) Drug List PDF",
            "source_file": PDF_PATH.name,
            "issuer_id": ISSUER_ID,
            "issuer_name": ISSUER_NAME,
            "state_code": "CA",
            "plan_year": PLAN_YEAR,
            "total_drug_records": len(records),
            "unique_drug_names": len({r["drug_name"] for r in records}),
            "priority_drug_records": priority_count,
            "tier_breakdown": dict(tier_counts),
            "pa_count": pa_count,
            "ql_count": ql_count,
            "st_count": st_count,
            "generated_at": datetime.utcnow().isoformat(),
            "schema_version": "1.0",
            "note": (
                "Parsed from PDF drug list. rxnorm_id=null (not in PDF). "
                "Tier labels: PREFERRED-GENERICS=1, PREFERRED-BRANDS=2, "
                "NON-PREFERRED-BRANDS=3, SPECIALTY=4, PREVENTIVE=5/PV. "
                "Matches formulary_intelligence.json schema."
            ),
        },
        "data": records,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
        f.write("\n")

    log.info("Wrote %d records → %s", len(records), OUT_PATH)


if __name__ == "__main__":
    main()
