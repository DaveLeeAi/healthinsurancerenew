#!/usr/bin/env python3
"""
Parse 5 Covered California carrier formulary PDFs → per-issuer JSON files
then merge into data/processed/formulary_sbm_CA_merged.json

Carriers:
  1. Blue Shield of CA (70285) — 471 pages, tier 1-4 + preventive
  2. Kaiser Permanente CA (40513) — 165 pages, tier 1-4
  3. Molina Healthcare CA (18126) — 166 pages, bilingual (English first half)
  4. Aetna CA (unknown HIOS) — 302 pages, Tier 1(G)/NF format
  5. IEHP CA (51396) — 445 pages, tier 1-4

All PDFs use a 3-column layout: Drug Name | Drug Tier | Requirements/Limits
Column boundaries are consistent: name x<~360, tier x~360-430, reqs x>=430

Output schema matches formulary_intelligence.json:
  drug_name, drug_tier, prior_authorization, step_therapy, quantity_limit,
  quantity_limit_detail, issuer_ids, rxnorm_id, is_priority_drug

Run: python scripts/etl/parse_formulary_ca_carriers.py [--carrier CARRIER]
  CARRIER: blueshield, kaiser, molina, aetna, iehp, all (default: all)
"""

import argparse
import json
import logging
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ── Paths ────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAW_DIR = BASE_DIR / "data" / "raw" / "formulary_pdf"
OUT_DIR = BASE_DIR / "data" / "processed"

# ── Carrier configs ──────────────────────────────────────────────────────────

CARRIERS = {
    "blueshield": {
        "issuer_id": "70285",
        "issuer_name": "Blue Shield of California",
        "pdf_path": Path(
            r"C:\Users\Stuart\Downloads\Claude Code\Health Insurance Renew Website Resources"
            r"\SEO EEAT\Covered CA\RXFLEX-PRINTABLE-FORMULARY-(PDF)-PLUS-GF_CDI-2026-V2.PDF"
        ),
        "start_page": 38,    # 0-indexed, first page with drug data
        "end_page": 465,     # exclusive
        "tier_x_min": 280.0,
        "tier_x_max": 360.0,
        "req_x_min": 430.0,
        "name_x_max": 275.0,
    },
    "kaiser": {
        "issuer_id": "40513",
        "issuer_name": "Kaiser Permanente (CA)",
        "pdf_path": RAW_DIR / "kaiser_ca_2026_formulary.pdf",
        "start_page": 12,
        "end_page": 160,
        "tier_x_min": 330.0,
        "tier_x_max": 380.0,
        "req_x_min": 385.0,
        "name_x_max": 325.0,
    },
    "molina": {
        "issuer_id": "18126",
        "issuer_name": "Molina Healthcare (CA)",
        "pdf_path": RAW_DIR / "molina_ca_2026_formulary.pdf",
        "start_page": 33,
        "end_page": 83,  # English section only (Spanish starts ~page 84)
        "tier_x_min": 360.0,
        "tier_x_max": 430.0,
        "req_x_min": 430.0,
        "name_x_max": 355.0,
    },
    "aetna": {
        "issuer_id": "aetna_ca",
        "issuer_name": "Aetna (CA)",
        "pdf_path": RAW_DIR / "aetna_ca_2026_formulary.pdf",
        "start_page": 29,
        "end_page": 295,
        "tier_x_min": 355.0,
        "tier_x_max": 430.0,
        "req_x_min": 430.0,
        "name_x_max": 350.0,
    },
    "iehp": {
        "issuer_id": "51396",
        "issuer_name": "IEHP (Inland Empire Health Plan)",
        "pdf_path": RAW_DIR / "iehp_ca_2026_formulary.pdf",
        "start_page": 14,
        "end_page": 440,
        "tier_x_min": 355.0,
        "tier_x_max": 430.0,
        "req_x_min": 430.0,
        "name_x_max": 350.0,
    },
    "healthnet": {
        "issuer_id": "67138",
        "issuer_name": "Ambetter from Health Net (CA)",
        "pdf_path": RAW_DIR / "healthnet_ambetter_ca_2026.pdf",
        "start_page": 15,
        "end_page": 160,
        "tier_x_min": 180.0,
        "tier_x_max": 210.0,
        "req_x_min": 215.0,
        "name_x_max": 175.0,
        "two_column": True,
        "col_split": 300.0,
        "right_tier_x_min": 460.0,
        "right_tier_x_max": 490.0,
        "right_req_x_min": 495.0,
        "right_name_x_max": 455.0,
    },
    "cchp": {
        "issuer_id": "27603",
        "issuer_name": "Chinese Community Health Plan (CA)",
        "pdf_path": RAW_DIR / "cchp_ca_2026_formulary.pdf",
        "start_page": 14,
        "end_page": 425,
        "tier_x_min": 355.0,
        "tier_x_max": 430.0,
        "req_x_min": 430.0,
        "name_x_max": 350.0,
    },
    "lacare": {
        "issuer_id": "92815",
        "issuer_name": "L.A. Care Health Plan",
        "pdf_path": Path(
            r"C:\Users\Stuart\Downloads\Claude Code\Health Insurance Renew Website Resources"
            r"\SEO EEAT\Covered CA\LA Care\la2133_lacc_formulary_202603rev.pdf"
        ),
        "start_page": 15,
        "end_page": 340,
        "tier_x_min": 300.0,
        "tier_x_max": 380.0,
        "req_x_min": 385.0,
        "name_x_max": 295.0,
    },
    "valleyhealth": {
        "issuer_id": "84014",
        "issuer_name": "Valley Health Plan (CA)",
        "pdf_path": Path(
            r"C:\Users\Stuart\Downloads\Claude Code\Health Insurance Renew Website Resources"
            r"\SEO EEAT\Covered CA\Valley Health\covered-california-and-individual-and-family-plan-formulary-2026-110525.pdf"
        ),
        "start_page": 30,
        "end_page": 238,
        "tier_x_min": 300.0,
        "tier_x_max": 380.0,
        "req_x_min": 385.0,
        "name_x_max": 295.0,
    },
    "oscar": {
        "issuer_id": "20523",
        "issuer_name": "Oscar Health Plan of California",
        "pdf_path": RAW_DIR / "oscar_fl_2026_formulary.pdf",
        "start_page": 7,
        "end_page": 129,
        "tier_x_min": 335.0,
        "tier_x_max": 410.0,
        "req_x_min": 409.0,
        "name_x_max": 330.0,
    },
    "wha": {
        "issuer_id": "93689",
        "issuer_name": "Western Health Advantage (CA)",
        "pdf_path": RAW_DIR / "wha_ca_2026_formulary.pdf",
        "start_page": 12,
        "end_page": 535,
        "tier_x_min": 355.0,
        "tier_x_max": 430.0,
        "req_x_min": 430.0,
        "name_x_max": 350.0,
    },
    "anthem": {
        "issuer_id": "92499",
        "issuer_name": "Anthem Blue Cross (CA)",
        "pdf_path": Path(
            r"C:\Users\Stuart\Downloads\Claude Code\Health Insurance Renew Website Resources"
            r"\SEO EEAT\Covered CA\Anthem\Essential_5_Tier_ABC.pdf"
        ),
        "start_page": 10,
        "end_page": 152,
        "tier_x_min": 355.0,
        "tier_x_max": 430.0,
        "req_x_min": 430.0,
        "name_x_max": 350.0,
    },
}

# ── Tier normalization ───────────────────────────────────────────────────────

TIER_MAP: dict[str, str] = {
    "1": "PREFERRED-GENERICS",
    "TIER 1": "PREFERRED-GENERICS",
    "TIER 1 (G)": "PREFERRED-GENERICS",
    "1 (G)": "PREFERRED-GENERICS",
    "1A": "PREFERRED-GENERICS",         # Oscar: preferred generic ($3)
    "1B": "PREFERRED-GENERICS",         # Oscar: non-preferred generic
    "1A*": "PREFERRED-GENERICS",        # Anthem: generic
    "1B*": "PREFERRED-GENERICS",        # Anthem: preferred generic
    "1 OR 1A*": "PREFERRED-GENERICS",
    "1 OR 1B*": "PREFERRED-GENERICS",
    "2": "PREFERRED-BRANDS",
    "TIER 2": "PREFERRED-BRANDS",
    "TIER 2 (B)": "PREFERRED-BRANDS",
    "2 (B)": "PREFERRED-BRANDS",
    "3": "NON-PREFERRED-BRANDS",
    "TIER 3": "NON-PREFERRED-BRANDS",
    "TIER 3 (NP)": "NON-PREFERRED-BRANDS",
    "3 (NP)": "NON-PREFERRED-BRANDS",
    "4": "SPECIALTY",
    "TIER 4": "SPECIALTY",
    "TIER 4 (SP)": "SPECIALTY",
    "4 (SP)": "SPECIALTY",
    "5": "SPECIALTY-HIGH",
    "TIER 5": "SPECIALTY-HIGH",
    "PV": "ACA-PREVENTIVE-DRUGS",
    "PREVENTIVE": "ACA-PREVENTIVE-DRUGS",
    "PREV": "ACA-PREVENTIVE-DRUGS",
    "$0": "ACA-PREVENTIVE-DRUGS",
    "0": "ACA-PREVENTIVE-DRUGS",
    "OA": "SPECIALTY",             # WHA: "Other Authorization" / specialty
    "NF": "NON-FORMULARY",
    "NOT COVERED": "NON-FORMULARY",
}

# Tier patterns in text (regex)
TIER_RE = re.compile(
    r"^(?:Tier\s*)?([1-5])\s*(?:[ab]\*?)?(?:\s*(?:\([A-Z]+\)))?$"
    r"|^(NF|PV|PREV|PREVENTIVE|\$0|OA)$"
    r"|^([1-5])\s*or\s*[1-5][ab]\*$",  # Anthem "1 or 1b*" format
    re.IGNORECASE,
)

# ── Priority drugs ───────────────────────────────────────────────────────────

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


# ── Requirement parsing ──────────────────────────────────────────────────────

def parse_requirements(req_text: str) -> dict:
    """Parse restriction codes from requirement text."""
    text = req_text.upper()
    pa = bool(re.search(r"\bPA\b", text))
    st = bool(re.search(r"\bST\b", text))
    ql = bool(re.search(r"\bQL[CR]?\b", text))
    sp = bool(re.search(r"\bSP\b", text))

    # Extract QL detail
    ql_detail = ""
    m = re.search(r"QL[CR]?\s*\(([^)]+)\)", req_text, re.IGNORECASE)
    if m:
        ql_detail = m.group(1).strip()

    return {
        "prior_authorization": pa,
        "step_therapy": st,
        "quantity_limit": ql,
        "quantity_limit_detail": ql_detail,
        "specialty": sp,
    }


# ── Tier extraction from word ────────────────────────────────────────────────

def extract_tier_from_words(tier_words: list[str]) -> str:
    """Combine tier words and normalize to standard tier label."""
    raw = " ".join(tier_words).strip()
    if not raw:
        return ""

    # Try direct lookup
    normalized = TIER_MAP.get(raw.upper(), "")
    if normalized:
        return normalized

    # Try regex match
    m = TIER_RE.match(raw)
    if m:
        digit = m.group(1)
        label = m.group(2)
        anthem_digit = m.group(3) if m.lastindex >= 3 else None
        if digit:
            return TIER_MAP.get(digit, f"TIER-{digit}")
        if label:
            return TIER_MAP.get(label.upper(), label.upper())
        if anthem_digit:
            return TIER_MAP.get(anthem_digit, f"TIER-{anthem_digit}")

    # Handle Anthem "1 or 1b*" / "1 or 1a*" patterns
    m2 = re.match(r"^([1-5])\s*or\s*[1-5][ab]\*", raw, re.IGNORECASE)
    if m2:
        return TIER_MAP.get(m2.group(1), "")

    # Handle bare "1a", "1b", "1a*", "1b*" etc.
    m3 = re.match(r"^([1-5])[ab]\*?$", raw, re.IGNORECASE)
    if m3:
        return TIER_MAP.get(m3.group(1), "")

    # Try just the first digit
    digits = re.findall(r"\d", raw)
    if digits and digits[0] in TIER_MAP:
        return TIER_MAP[digits[0]]

    return ""


# ── Page parser ──────────────────────────────────────────────────────────────

def parse_page_words(page, cfg: dict) -> list[dict]:
    """
    Parse a single page using word-level positions.

    Strategy:
    1. Separate words into 3 columns: name, tier, requirements.
    2. Find all tier indicators (these anchor each drug entry).
    3. For each tier, find the name words at the same y-position (±tolerance).
    4. Continuation lines (name words without a matching tier) attach to the
       previous entry.
    """
    words = page.extract_words(
        x_tolerance=3, y_tolerance=3, keep_blank_chars=False
    )
    if not words:
        return []

    name_x_max = cfg["name_x_max"]
    tier_x_min = cfg["tier_x_min"]
    tier_x_max = cfg["tier_x_max"]
    req_x_min = cfg["req_x_min"]

    # Filter out footer/header words
    y_min = cfg.get("y_min", 55.0)
    y_max = cfg.get("y_max", 690.0)
    words = [w for w in words if y_min <= w["top"] <= y_max]

    # Classify words into columns
    name_words: list[dict] = []
    tier_words: list[dict] = []
    req_words: list[dict] = []

    for w in words:
        x0 = w["x0"]
        text = w["text"]
        if x0 >= req_x_min:
            req_words.append(w)
        elif x0 >= tier_x_min and x0 <= tier_x_max:
            tier_words.append(w)
        elif x0 < name_x_max:
            name_words.append(w)
        else:
            # Gap between name and tier — classify by content
            if text.lower() in ("tier", "nf", "pv", "prev", "or", "oa") or (
                text.isdigit() and len(text) == 1
            ) or re.match(r"^[1-5][ab]\*?;?$", text, re.IGNORECASE):
                tier_words.append(w)
            else:
                name_words.append(w)

    # Sort all by y-position
    name_words.sort(key=lambda w: (w["top"], w["x0"]))
    tier_words.sort(key=lambda w: w["top"])
    req_words.sort(key=lambda w: (w["top"], w["x0"]))

    # Group tier words into tier entries by y-proximity (within 6pt = same row)
    tier_entries: list[tuple[float, str]] = []  # (y, tier_text)
    i = 0
    while i < len(tier_words):
        group = [tier_words[i]]
        j = i + 1
        while j < len(tier_words) and abs(tier_words[j]["top"] - tier_words[i]["top"]) < 6:
            group.append(tier_words[j])
            j += 1
        group.sort(key=lambda w: w["x0"])
        tier_text = " ".join(w["text"] for w in group)
        tier_val = extract_tier_from_words(tier_text.split())
        if tier_val:
            y_center = sum(w["top"] for w in group) / len(group)
            tier_entries.append((y_center, tier_val))
        i = j

    if not tier_entries:
        return []

    # For each tier entry, find name words and req words within y-tolerance
    Y_TOL = 10.0  # ±10pt to match name row to tier row (accounts for baseline offset)
    entries: list[dict] = []

    for idx, (tier_y, tier_val) in enumerate(tier_entries):
        # y-range for this entry: from tier_y - tolerance to midpoint to next tier
        y_start = tier_y - Y_TOL
        if idx + 1 < len(tier_entries):
            y_end = (tier_y + tier_entries[idx + 1][0]) / 2
        else:
            y_end = tier_y + 40  # last entry: allow up to 40pt for continuation

        # Collect name words for this entry
        entry_name_parts: list[str] = []
        for w in name_words:
            if y_start <= w["top"] <= y_end:
                entry_name_parts.append(w["text"])

        # Collect req words for this entry
        entry_req_parts: list[str] = []
        for w in req_words:
            if y_start <= w["top"] <= y_end:
                entry_req_parts.append(w["text"])

        if entry_name_parts:
            entries.append({
                "name": " ".join(entry_name_parts).strip(),
                "tier": tier_val,
                "reqs": " ".join(entry_req_parts).strip(),
            })

    return entries


def _parse_words_list(words: list[dict], cfg: dict) -> list[dict]:
    """Parse a pre-filtered list of words (for 2-column split) using the same
    tier-anchored logic as parse_page_words."""
    if not words:
        return []

    name_x_max = cfg["name_x_max"]
    tier_x_min = cfg["tier_x_min"]
    tier_x_max = cfg["tier_x_max"]
    req_x_min = cfg["req_x_min"]

    name_words: list[dict] = []
    tier_words: list[dict] = []
    req_words: list[dict] = []

    for w in words:
        x0 = w["x0"]
        text = w["text"]
        if x0 >= req_x_min:
            req_words.append(w)
        elif tier_x_min <= x0 <= tier_x_max and text.strip().isdigit() and len(text.strip()) == 1:
            tier_words.append(w)
        elif x0 < name_x_max:
            name_words.append(w)
        else:
            if text.lower() in ("tier", "nf", "pv") or (text.isdigit() and len(text) == 1):
                tier_words.append(w)
            else:
                name_words.append(w)

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
        y_start = tier_y - Y_TOL
        if idx + 1 < len(tier_words):
            y_end = (tier_y + tier_words[idx + 1]["top"]) / 2
        else:
            y_end = tier_y + 40
        entry_name = " ".join(w["text"] for w in name_words if y_start <= w["top"] <= y_end).strip()
        entry_req = " ".join(w["text"] for w in req_words if y_start <= w["top"] <= y_end).strip()
        if entry_name and len(entry_name) >= 3:
            entries.append({"name": entry_name, "tier": tier_val, "reqs": entry_req})
    return entries


# ── Text-based parser (fallback for Blue Shield which has no extractable tables) ──

def parse_page_text(page, cfg: dict) -> list[dict]:
    """
    Parse using extract_text() for PDFs where word extraction doesn't work well.
    Blue Shield uses: DRUG NAME tier N REQUIREMENTS
    """
    text = page.extract_text()
    if not text:
        return []

    entries: list[dict] = []
    lines = text.split("\n")

    # Pattern: drug text ... tier N ... requirements
    tier_pattern = re.compile(
        r"^(.+?)\s+(tier\s+[1-4]|Tier\s+[1-4])\s*(.*?)$", re.IGNORECASE
    )

    current_name = ""
    current_tier = ""
    current_req = ""

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Skip headers
        if line.startswith("PRESCRIPTION DRUG NAME") or line.startswith("AND LIMITS"):
            continue

        m = tier_pattern.match(line)
        if m:
            # Flush previous
            if current_name and current_tier:
                entries.append({
                    "name": current_name,
                    "tier": extract_tier_from_words(current_tier.split()),
                    "reqs": current_req,
                })
            current_name = m.group(1).strip()
            current_tier = m.group(2).strip()
            current_req = m.group(3).strip()
        else:
            # Check if it's a continuation of requirements (PA, QLC, etc.)
            if current_name and re.match(r"^[A-Z,\s()\d/]+$", line) and len(line) < 40:
                current_req += " " + line
            elif current_name:
                # Continuation of drug name
                current_name += " " + line

    # Flush last
    if current_name and current_tier:
        entries.append({
            "name": current_name,
            "tier": extract_tier_from_words(current_tier.split()),
            "reqs": current_req,
        })

    return entries


# ── Drug name cleaning ───────────────────────────────────────────────────────

# Section header patterns to skip
SECTION_HEADER_RE = re.compile(
    r"^\*+[A-Za-z\s&/,()-]+\*+$"  # *Section Name* patterns (Molina)
    r"|^[A-Z][A-Z\s&/,()-]{5,}$"  # ALL CAPS section headers
    r"|^Drug\s+(Name|Coverage|Tier)"  # Table headers
    r"|^Prescription\s+Drug"
    r"|^Formulary$"
    r"|^Status$"
    r"|^Requirements"
    r"|^Coverage$"
    r"|^AND\s+LIMITS$"
    r"|^Limits$",
    re.IGNORECASE,
)


def clean_drug_name(name: str) -> str:
    """Clean and validate a drug name."""
    # Normalize whitespace
    name = re.sub(r"\s+", " ", name).strip()
    name = name.replace("\ufffd", "'")

    if not name or len(name) < 3:
        return ""

    # Skip section headers
    if SECTION_HEADER_RE.match(name):
        return ""

    # Skip if no alphanumeric content
    if not re.search(r"[a-zA-Z]", name):
        return ""

    # Skip page numbers
    if re.match(r"^\d+$", name):
        return ""

    # Skip category headers (Molina uses *Category**)
    if name.startswith("*") and name.endswith("*"):
        return ""

    return name


# ── Build output record ──────────────────────────────────────────────────────

def build_record(entry: dict, cfg: dict) -> dict | None:
    drug_name = clean_drug_name(entry["name"])
    if not drug_name:
        return None

    tier = entry["tier"]
    if not tier:
        return None

    # Skip NF (non-formulary) entries — they're not covered drugs
    if tier == "NON-FORMULARY":
        return None

    flags = parse_requirements(entry["reqs"])

    return {
        "drug_name": drug_name,
        "drug_tier": tier,
        "prior_authorization": flags["prior_authorization"],
        "step_therapy": flags["step_therapy"],
        "quantity_limit": flags["quantity_limit"],
        "quantity_limit_detail": flags["quantity_limit_detail"],
        "specialty": flags["specialty"] or tier == "SPECIALTY",
        "issuer_ids": [cfg["issuer_id"]],
        "rxnorm_id": None,
        "is_priority_drug": is_priority(drug_name),
        "source": "PDF Drug List",
        "source_file": cfg["pdf_path"].name,
        "state_code": "CA",
        "plan_year": 2026,
    }


# ── Deduplication ────────────────────────────────────────────────────────────

def dedupe(records: list[dict]) -> list[dict]:
    """Keep first occurrence of each drug_name + drug_tier."""
    seen: set[tuple] = set()
    out = []
    for rec in records:
        key = (rec["drug_name"].upper(), rec["drug_tier"])
        if key not in seen:
            seen.add(key)
            out.append(rec)
    return out


# ── Parse a single carrier ───────────────────────────────────────────────────

def parse_carrier(carrier_key: str) -> dict | None:
    cfg = CARRIERS[carrier_key]
    pdf_path = cfg["pdf_path"]

    if not pdf_path.exists():
        log.error("PDF not found: %s", pdf_path)
        return None

    log.info("Parsing %s: %s", cfg["issuer_name"], pdf_path.name)

    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        start = cfg["start_page"]
        end = min(cfg["end_page"], total_pages)
        log.info("  PDF has %d pages. Scanning pages %d-%d", total_pages, start + 1, end)

        raw_entries: list[dict] = []
        is_two_col = cfg.get("two_column", False)

        for i in range(start, end):
            page = pdf.pages[i]

            if is_two_col:
                # Two-column layout: split words and parse each column separately
                all_words = page.extract_words(x_tolerance=3, y_tolerance=3)
                col_split = cfg["col_split"]
                y_min = cfg.get("y_min", 55.0)
                y_max = cfg.get("y_max", 690.0)
                all_words = [w for w in all_words if y_min <= w["top"] <= y_max]

                left_words = [w for w in all_words if w["x0"] < col_split]
                right_words = [w for w in all_words if w["x0"] >= col_split]

                # Left column config
                left_cfg = {**cfg, "tier_x_min": cfg["tier_x_min"], "tier_x_max": cfg["tier_x_max"],
                            "req_x_min": cfg["req_x_min"], "name_x_max": cfg["name_x_max"]}
                # Right column config
                right_cfg = {**cfg, "tier_x_min": cfg["right_tier_x_min"], "tier_x_max": cfg["right_tier_x_max"],
                             "req_x_min": cfg["right_req_x_min"], "name_x_max": cfg["right_name_x_max"]}

                raw_entries.extend(_parse_words_list(left_words, left_cfg))
                raw_entries.extend(_parse_words_list(right_words, right_cfg))
            else:
                entries = parse_page_words(page, cfg)
                raw_entries.extend(entries)

            if (i - start) % 50 == 0 and i > start:
                log.info("    Page %d/%d — %d entries so far", i + 1, total_pages, len(raw_entries))

    log.info("  Raw entries extracted: %d", len(raw_entries))

    records = []
    for entry in raw_entries:
        rec = build_record(entry, cfg)
        if rec:
            records.append(rec)

    log.info("  Valid records before dedup: %d", len(records))
    records = dedupe(records)
    log.info("  After dedup: %d unique drug entries", len(records))

    # Stats
    tier_counts = Counter(r["drug_tier"] for r in records)
    for tier, count in sorted(tier_counts.items()):
        log.info("    %s: %d", tier, count)

    pa_count = sum(1 for r in records if r["prior_authorization"])
    ql_count = sum(1 for r in records if r["quantity_limit"])
    st_count = sum(1 for r in records if r["step_therapy"])
    priority_count = sum(1 for r in records if r["is_priority_drug"])
    log.info("  PA: %d  QL: %d  ST: %d  Priority: %d", pa_count, ql_count, st_count, priority_count)

    output = {
        "metadata": {
            "source": f"{cfg['issuer_name']} Drug List PDF",
            "source_file": pdf_path.name,
            "issuer_id": cfg["issuer_id"],
            "issuer_name": cfg["issuer_name"],
            "state_code": "CA",
            "plan_year": 2026,
            "total_drug_records": len(records),
            "unique_drug_names": len({r["drug_name"] for r in records}),
            "priority_drug_records": priority_count,
            "tier_breakdown": dict(tier_counts),
            "pa_count": pa_count,
            "ql_count": ql_count,
            "st_count": st_count,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "schema_version": "1.0",
        },
        "data": records,
    }

    # Write per-carrier file
    out_path = OUT_DIR / f"formulary_sbm_CA_{carrier_key}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
        f.write("\n")

    log.info("  Wrote %d records → %s", len(records), out_path)
    return output


# ── Merge all carrier outputs ────────────────────────────────────────────────

def merge_all(carrier_outputs: dict[str, dict]) -> None:
    """Merge all carrier outputs into a single CA file."""
    all_records = []
    all_meta = []

    for key, output in carrier_outputs.items():
        if output:
            all_records.extend(output["data"])
            all_meta.append({
                "carrier": key,
                "issuer_id": output["metadata"]["issuer_id"],
                "issuer_name": output["metadata"]["issuer_name"],
                "drug_count": output["metadata"]["total_drug_records"],
            })

    # Dedupe across carriers: keep all (different issuers), but merge if same drug+tier+issuer
    tier_counts = Counter(r["drug_tier"] for r in all_records)
    pa_count = sum(1 for r in all_records if r["prior_authorization"])
    ql_count = sum(1 for r in all_records if r["quantity_limit"])
    st_count = sum(1 for r in all_records if r["step_therapy"])
    priority_count = sum(1 for r in all_records if r["is_priority_drug"])

    merged = {
        "metadata": {
            "source": "Covered California Carrier PDF Formularies (merged)",
            "state_code": "CA",
            "plan_year": 2026,
            "carriers": all_meta,
            "total_drug_records": len(all_records),
            "unique_drug_names": len({r["drug_name"].upper() for r in all_records}),
            "priority_drug_records": priority_count,
            "tier_breakdown": dict(tier_counts),
            "pa_count": pa_count,
            "ql_count": ql_count,
            "st_count": st_count,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "schema_version": "1.0",
        },
        "data": all_records,
    }

    out_path = OUT_DIR / "formulary_sbm_CA_merged.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
        f.write("\n")

    log.info("Merged %d records from %d carriers → %s",
             len(all_records), len(all_meta), out_path)


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Parse CA carrier formulary PDFs")
    parser.add_argument(
        "--carrier",
        choices=list(CARRIERS.keys()) + ["all"],
        default="all",
        help="Which carrier to parse (default: all)",
    )
    args = parser.parse_args()

    if args.carrier == "all":
        targets = list(CARRIERS.keys())
    else:
        targets = [args.carrier]

    outputs: dict[str, dict] = {}
    for key in targets:
        result = parse_carrier(key)
        if result:
            outputs[key] = result

    if len(outputs) > 1:
        merge_all(outputs)

    log.info("Done. Processed %d carriers.", len(outputs))


if __name__ == "__main__":
    main()
