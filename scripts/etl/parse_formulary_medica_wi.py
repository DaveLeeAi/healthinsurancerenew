#!/usr/bin/env python3
"""
Parse Medica Wisconsin 2026 IFB formulary PDF → data/processed/formulary_sbm_WI_medica.json

Source: 2026-IFB-Formulary-WI.pdf (123 pages, 2-column layout)
Tiers: 1-5 (bare digits), drug tables pages 10-110, index from 111

Two-column layout:
  Left:  name x=49-165, tier x~178, reqs x=211+
  Right: name x=311-425, tier x~441, reqs x=473+

Run: python scripts/etl/parse_formulary_medica_wi.py
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

PDF_PATH = Path(
    r"C:\Users\Stuart\Downloads\Claude Code\Health Insurance Renew Website Resources"
    r"\SEO EEAT\Covered CA\2026-IFB-Formulary-WI.pdf"
)
OUT_PATH = Path("data/processed/formulary_sbm_WI_medica.json")

ISSUER_ID = "medica_wi"
ISSUER_NAME = "Medica (WI)"
STATE_CODE = "WI"
PLAN_YEAR = 2026

START_PAGE = 10   # 0-indexed
END_PAGE = 110    # exclusive (index starts at 111)

# Column boundaries
COL_SPLIT = 260.0
LEFT = {"name_max": 165.0, "tier_min": 170.0, "tier_max": 200.0, "req_min": 208.0}
RIGHT = {"name_max": 425.0, "tier_min": 430.0, "tier_max": 460.0, "req_min": 470.0}

Y_MIN = 70.0
Y_MAX = 700.0

TIER_MAP = {
    "1": "PREFERRED-GENERICS",
    "2": "PREFERRED-GENERICS",
    "3": "PREFERRED-BRANDS",
    "4": "NON-PREFERRED-BRANDS",
    "5": "SPECIALTY",
}

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
    "saxenda", "qsymia", "contrave",
}


def is_priority(drug_name: str) -> bool:
    name_lower = drug_name.lower()
    return any(p in name_lower for p in PRIORITY_DRUGS)


def parse_requirements(req_text: str) -> dict:
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


def parse_column(words: list[dict], col: dict) -> list[dict]:
    """Parse one column of words into drug entries using tier-anchored approach."""
    name_max = col["name_max"]
    tier_min = col["tier_min"]
    tier_max = col["tier_max"]
    req_min = col["req_min"]

    # Classify words
    name_words = []
    tier_words = []
    req_words = []

    for w in words:
        x0 = w["x0"]
        text = w["text"]
        if x0 >= req_min:
            req_words.append(w)
        elif tier_min <= x0 <= tier_max and text.strip().isdigit() and len(text.strip()) == 1:
            tier_words.append(w)
        elif x0 < name_max:
            name_words.append(w)
        # else: gap words — skip (dosage numbers in tier zone with >1 digit)

    name_words.sort(key=lambda w: (w["top"], w["x0"]))
    tier_words.sort(key=lambda w: w["top"])
    req_words.sort(key=lambda w: (w["top"], w["x0"]))

    if not tier_words:
        return []

    entries = []
    Y_TOL = 10.0

    for idx, tw in enumerate(tier_words):
        tier_y = tw["top"]
        tier_val = TIER_MAP.get(tw["text"].strip(), "")
        if not tier_val:
            continue

        # y-range for this entry
        y_start = tier_y - Y_TOL
        if idx + 1 < len(tier_words):
            y_end = (tier_y + tier_words[idx + 1]["top"]) / 2
        else:
            y_end = tier_y + 40

        entry_name = " ".join(
            w["text"] for w in name_words if y_start <= w["top"] <= y_end
        ).strip()

        entry_req = " ".join(
            w["text"] for w in req_words if y_start <= w["top"] <= y_end
        ).strip()

        if entry_name and len(entry_name) >= 3:
            entries.append({
                "name": entry_name,
                "tier": tier_val,
                "reqs": entry_req,
            })

    return entries


SECTION_HEADER_RE = re.compile(
    r"^Drug\s+Name$|^Drug\s+Requirements$|^Tier\s*/\s*Limits$|^\d+$",
    re.IGNORECASE,
)


def clean_drug_name(name: str) -> str:
    name = re.sub(r"\s+", " ", name).strip()
    if not name or len(name) < 3:
        return ""
    if SECTION_HEADER_RE.match(name):
        return ""
    if not re.search(r"[a-zA-Z]", name):
        return ""
    return name


def build_record(entry: dict) -> dict | None:
    drug_name = clean_drug_name(entry["name"])
    if not drug_name:
        return None

    flags = parse_requirements(entry["reqs"])

    return {
        "drug_name": drug_name,
        "drug_tier": entry["tier"],
        "prior_authorization": flags["prior_authorization"],
        "step_therapy": flags["step_therapy"],
        "quantity_limit": flags["quantity_limit"],
        "quantity_limit_detail": flags["quantity_limit_detail"],
        "specialty": flags["specialty"] or entry["tier"] == "SPECIALTY",
        "issuer_ids": [ISSUER_ID],
        "rxnorm_id": None,
        "is_priority_drug": is_priority(drug_name),
        "source": "PDF Drug List",
        "source_file": PDF_PATH.name,
        "state_code": STATE_CODE,
        "plan_year": PLAN_YEAR,
    }


def dedupe(records: list[dict]) -> list[dict]:
    seen: set[tuple] = set()
    out = []
    for rec in records:
        key = (rec["drug_name"].upper(), rec["drug_tier"])
        if key not in seen:
            seen.add(key)
            out.append(rec)
    return out


def main() -> None:
    if not PDF_PATH.exists():
        log.error("PDF not found: %s", PDF_PATH)
        return

    with pdfplumber.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        end = min(END_PAGE, total_pages)
        log.info("PDF has %d pages. Scanning pages %d-%d", total_pages, START_PAGE + 1, end)

        raw_entries: list[dict] = []
        for i in range(START_PAGE, end):
            page = pdf.pages[i]
            words = page.extract_words(x_tolerance=3, y_tolerance=3)
            words = [w for w in words if Y_MIN <= w["top"] <= Y_MAX]

            left_words = [w for w in words if w["x0"] < COL_SPLIT]
            right_words = [w for w in words if w["x0"] >= COL_SPLIT]

            raw_entries.extend(parse_column(left_words, LEFT))
            raw_entries.extend(parse_column(right_words, RIGHT))

            if (i - START_PAGE) % 20 == 0 and i > START_PAGE:
                log.info("  Page %d/%d — %d entries so far", i + 1, total_pages, len(raw_entries))

    log.info("Raw entries extracted: %d", len(raw_entries))

    records = []
    for entry in raw_entries:
        rec = build_record(entry)
        if rec:
            records.append(rec)

    log.info("Valid records before dedup: %d", len(records))
    records = dedupe(records)
    log.info("After dedup: %d unique drug entries", len(records))

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
            "source": "Medica Wisconsin 2026 IFB Drug List PDF",
            "source_file": PDF_PATH.name,
            "issuer_id": ISSUER_ID,
            "issuer_name": ISSUER_NAME,
            "state_code": STATE_CODE,
            "plan_year": PLAN_YEAR,
            "total_drug_records": len(records),
            "unique_drug_names": len({r["drug_name"] for r in records}),
            "priority_drug_records": priority_count,
            "tier_breakdown": dict(tier_counts),
            "pa_count": pa_count,
            "ql_count": ql_count,
            "st_count": st_count,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "schema_version": "1.0",
            "note": (
                "Parsed from Medica WI 2026 IFB formulary PDF. "
                "Tiers: 1-2=PREFERRED-GENERICS, 3=PREFERRED-BRANDS, "
                "4=NON-PREFERRED-BRANDS, 5=SPECIALTY. rxnorm_id=null."
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
