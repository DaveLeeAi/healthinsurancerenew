#!/usr/bin/env python3
"""
Parse 2026 ACA formulary PDFs for 15 SBM states.

Handles multiple PDF formats:
- Elevance/Anthem FBO 3-col (Drug Name | Tier 1-4 | Notes)
- Centene/Ambetter 3-col (Drug Name | Drug Tier 1B/2/3/4 | Requirements/Limits)
- CareFirst 4-col (blank | Drug Name | Tier | Requirements)
- Kaiser MAS 3-col (Name | Tier | Restrictions)
- NJ Horizon Prime 14-col dual-column
- VT BCBS word-position parsing
- Standard 3-col (Product | Tier | Limits)

Usage:
    python scripts/etl/parse_formulary_15state.py [--state XX] [--carrier KEY]
"""

import argparse
import json
import logging
import re
import ssl
import sys
import time
import urllib.request
from collections import Counter
from pathlib import Path

import pdfplumber

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw" / "formulary_pdf"
OUT_DIR = PROJECT_ROOT / "data" / "processed"

PLAN_YEAR = 2026

# ── Tier normalization ──────────────────────────────────────────────────────

TIER_MAP = {
    # Elevance/Anthem
    "Tier 1": "GENERIC", "Tier 2": "PREFERRED-BRAND",
    "Tier 3": "NON-PREFERRED-BRAND", "Tier 4": "SPECIALTY",
    # Numeric
    "1": "GENERIC", "2": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND", "4": "SPECIALTY",
    "5": "SPECIALTY-HIGH", "Tier 5": "SPECIALTY-HIGH",
    "6": "SPECIALTY-HIGH", "Tier 6": "SPECIALTY-HIGH",
    # Centene/Ambetter
    "1A": "PREFERRED-GENERIC", "1B": "GENERIC",
    "1a": "PREFERRED-GENERIC", "1b": "GENERIC",
    # CareFirst
    "Tier 1": "GENERIC", "Tier 2": "PREFERRED-BRAND",
    "Tier 3": "NON-PREFERRED-BRAND", "Tier 4": "SPECIALTY",
    # Special
    "0": "ACA-PREVENTIVE", "$0": "ACA-PREVENTIVE",
    "PV": "ACA-PREVENTIVE",
    "NF": "NON-FORMULARY",
    # IBX / AmeriHealth
    "LCG": "LOW-COST-GENERIC", "G": "GENERIC",
    "PB": "PREFERRED-BRAND", "NP": "NON-PREFERRED-BRAND",
    "S": "SPECIALTY", "SP": "SPECIALTY",
    # UPMC Advantage Choice
    "SG": "GENERIC", "PG": "PREFERRED-GENERIC",
    "PBG": "PREFERRED-BRAND", "NP": "NON-PREFERRED-BRAND",
    # Geisinger T1-T5
    "T1": "GENERIC", "T2": "PREFERRED-BRAND",
    "T3": "NON-PREFERRED-BRAND", "T4": "SPECIALTY",
    "T5": "NON-FORMULARY",
    # Quartz MN (parenthetical form)
    "T1 (G)": "GENERIC", "T2 (PB)": "PREFERRED-BRAND",
    "T3 (NP)": "NON-PREFERRED-BRAND", "T4 (SP)": "SPECIALTY",
    "T1 PV": "ACA-PREVENTIVE", "T2 PV": "ACA-PREVENTIVE", "T3 PV": "ACA-PREVENTIVE",
    # BCBS VT
    "TIER 01": "GENERIC", "TIER 02": "PREFERRED-BRAND",
    "TIER 03": "NON-PREFERRED-BRAND", "TIER 04": "SPECIALTY",
    "TIER 05": "SPECIALTY-HIGH",
    # Molina NM
    "PREV": "ACA-PREVENTIVE",
    "DME": "NON-FORMULARY",  # Durable Medical Equipment — skip/non-drug
    # BCBS NM (2-tier: Preferred / Non-Preferred)
    "P": "PREFERRED-BRAND", "P+": "SPECIALTY",
    "NP+": "SPECIALTY-HIGH",
}


def normalize_tier(raw: str) -> str:
    """Normalize tier string to standard label."""
    s = raw.strip()
    # Direct lookup
    if s in TIER_MAP:
        return TIER_MAP[s]
    # Case-insensitive
    for k, v in TIER_MAP.items():
        if s.upper() == k.upper():
            return v
    # "Tier X" pattern
    m = re.match(r"Tier\s+(\d)", s, re.IGNORECASE)
    if m:
        return TIER_MAP.get(m.group(1), s)
    # Bare digit
    if re.match(r"^\d$", s):
        return TIER_MAP.get(s, s)
    return s


# ── Priority drugs ──────────────────────────────────────────────────────────

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
    "saxenda", "gabapentin", "sertraline",
}


def is_priority(name: str) -> bool:
    low = name.lower()
    return any(p in low for p in PRIORITY_DRUGS)


# ── Helpers ─────────────────────────────────────────────────────────────────

def parse_flags(text: str) -> dict:
    """Parse PA/ST/QL/SP flags from notes/requirements text."""
    up = (text or "").upper()
    pa = bool(re.search(r"\bPA\b", up))
    st = bool(re.search(r"\bST\b", up))
    ql = bool(re.search(r"\bQL\b", up))
    sp = bool(re.search(r"\bSP\b", up))
    ql_detail = ""
    m = re.search(r"QL\s*\(([^)]+)\)", text or "", re.IGNORECASE)
    if m:
        ql_detail = m.group(1).strip()
    return {"prior_authorization": pa, "step_therapy": st,
            "quantity_limit": ql, "quantity_limit_detail": ql_detail,
            "specialty": sp}


def clean_name(raw: str) -> str:
    """Clean drug name from PDF extraction."""
    if not raw:
        return ""
    name = re.sub(r"\s+", " ", raw.replace("\n", " ")).strip()
    name = name.replace("\ufffd", "'")
    if len(name) < 3:
        return ""
    # Skip obvious headers
    if re.match(r"^(Drug\s+Name|DRUG\s+NAME|Medication|Product)", name, re.IGNORECASE):
        return ""
    return name


def is_section_header(name: str, tier: str) -> bool:
    """Detect section/category headers (no tier, all-caps category names)."""
    if tier and tier.strip():
        return False
    s = name.strip()
    if not s:
        return True
    # Category headers: all caps, no dosage forms
    if (s.isupper() and len(s) > 5
            and not any(kw in s for kw in ["MG", "ML", "MCG", "TABLET", "CAPSULE", "SOLUTION",
                                            "CREAM", "OINTMENT", "INJECTION", "SYRINGE", "PATCH"])):
        return True
    # Mixed-case category with dash
    if re.match(r"^[A-Z][A-Za-z /&,\-\(\)]+$", s) and len(s) > 10 and not any(
            kw in s.upper() for kw in ["MG", "ML", "MCG"]):
        return True
    return False


def make_record(drug_name: str, tier: str, flags: dict, issuer_ids: list,
                source_file: str, state: str) -> dict:
    return {
        "drug_name": drug_name,
        "drug_tier": tier,
        "prior_authorization": flags["prior_authorization"],
        "step_therapy": flags["step_therapy"],
        "quantity_limit": flags["quantity_limit"],
        "quantity_limit_detail": flags["quantity_limit_detail"],
        "specialty": flags["specialty"] or tier in ("SPECIALTY", "SPECIALTY-HIGH"),
        "issuer_ids": issuer_ids,
        "rxnorm_id": None,
        "is_priority_drug": is_priority(drug_name),
        "source": "PDF Drug List",
        "source_file": source_file,
        "state_code": state,
        "plan_year": PLAN_YEAR,
    }


def dedupe_records(records: list[dict]) -> list[dict]:
    """Deduplicate by drug_name + tier, merge issuer_ids."""
    seen: dict[tuple, int] = {}
    out: list[dict] = []
    for rec in records:
        key = (rec["drug_name"].lower(), rec["drug_tier"])
        if key in seen:
            idx = seen[key]
            existing_ids = set(out[idx]["issuer_ids"])
            for iid in rec["issuer_ids"]:
                if iid not in existing_ids:
                    out[idx]["issuer_ids"].append(iid)
                    existing_ids.add(iid)
            if rec["prior_authorization"]:
                out[idx]["prior_authorization"] = True
            if rec["step_therapy"]:
                out[idx]["step_therapy"] = True
            if rec["quantity_limit"]:
                out[idx]["quantity_limit"] = True
                if rec.get("quantity_limit_detail") and not out[idx].get("quantity_limit_detail"):
                    out[idx]["quantity_limit_detail"] = rec["quantity_limit_detail"]
            if rec["is_priority_drug"]:
                out[idx]["is_priority_drug"] = True
        else:
            seen[key] = len(out)
            out.append(rec)
    return out


# ══════════════════════════════════════════════════════════════════════════════
# PARSER: Standard 3-col table (most common format)
# ══════════════════════════════════════════════════════════════════════════════

def parse_standard_3col(pdf_path: Path, issuer_ids: list, state: str,
                        start_page: int = 0, end_page: int = -1,
                        name_col: int = 0, tier_col: int = 1, notes_col: int = 2,
                        min_cols: int = 3, tier_prefix: str = "") -> list[dict]:
    """Generic 3-column table parser (Drug Name | Tier | Notes)."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  Parsing pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))
        for i in range(start_page, ep):
            tables = pdf.pages[i].extract_tables()
            for table in tables:
                if not table or len(table[0]) < min_cols:
                    continue
                for row in table:
                    ncols = len(row)
                    drug = clean_name(str(row[name_col] or ""))
                    tier_raw = str(row[tier_col] or "").strip().replace("\n", " ") if ncols > tier_col else ""
                    notes = str(row[notes_col] or "").strip().replace("\n", " ") if ncols > notes_col else ""

                    if not drug or not tier_raw:
                        continue
                    # Skip "Formulary Status" header column
                    if "formulary" in tier_raw.lower() or "status" in tier_raw.lower():
                        continue
                    if is_section_header(drug, tier_raw):
                        continue

                    tier_key = tier_prefix + tier_raw if tier_prefix else tier_raw
                    tier = normalize_tier(tier_key)
                    if tier == tier_key and not re.match(r"^(GENERIC|PREFERRED|NON-|SPECIALTY|ACA|LOW)", tier):
                        continue  # unrecognized tier

                    flags = parse_flags(notes)
                    records.append(make_record(drug, tier, flags, issuer_ids,
                                               pdf_path.name, state))
    return records


# ══════════════════════════════════════════════════════════════════════════════
# PARSER: CareFirst 4-col (blank | Drug Name | Tier | Requirements)
# ══════════════════════════════════════════════════════════════════════════════

def parse_carefirst_4col(pdf_path: Path, issuer_ids: list, state: str,
                         start_page: int = 5, end_page: int = -1) -> list[dict]:
    """Parse CareFirst Exchange Formulary (4 columns, first col blank)."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  CareFirst: parsing pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))
        for i in range(start_page, ep):
            tables = pdf.pages[i].extract_tables()
            for table in tables:
                if not table or len(table[0]) < 3:
                    continue
                for row in table:
                    ncols = len(row)
                    # 4-col: blank, name, tier, reqs
                    if ncols >= 4:
                        drug = clean_name(str(row[1] or ""))
                        tier_raw = str(row[2] or "").strip()
                        notes = str(row[3] or "").strip().replace("\n", " ")
                    elif ncols == 3:
                        drug = clean_name(str(row[0] or ""))
                        tier_raw = str(row[1] or "").strip()
                        notes = str(row[2] or "").strip().replace("\n", " ")
                    else:
                        continue

                    if not drug or not tier_raw:
                        continue
                    if is_section_header(drug, tier_raw):
                        continue

                    tier = normalize_tier(tier_raw)
                    if tier == tier_raw and "TIER" not in tier.upper():
                        continue

                    flags = parse_flags(notes)
                    records.append(make_record(drug, tier, flags, issuer_ids,
                                               pdf_path.name, state))
    return records


# ══════════════════════════════════════════════════════════════════════════════
# PARSER: Centene/Ambetter format
# ══════════════════════════════════════════════════════════════════════════════

CENTENE_TIER_RE = re.compile(r"^(1[AB]?|2|3|4|5|6)$", re.IGNORECASE)


def parse_centene(pdf_path: Path, issuer_ids: list, state: str,
                  start_page: int = 5, end_page: int = -1) -> list[dict]:
    """Parse Centene/Ambetter formulary (Drug Name | Tier 1A/1B/2/3/4 | Requirements/Limits)."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  Centene: parsing pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))
        for i in range(start_page, ep):
            tables = pdf.pages[i].extract_tables()
            for table in tables:
                if not table or len(table[0]) < 3:
                    continue
                for row in table:
                    drug = clean_name(str(row[0] or ""))
                    tier_raw = str(row[1] or "").strip().replace("\n", "")
                    notes = str(row[2] or "").strip().replace("\n", " ") if len(row) > 2 else ""

                    if not drug or not tier_raw:
                        continue
                    if not CENTENE_TIER_RE.match(tier_raw):
                        continue

                    tier = normalize_tier(tier_raw)
                    flags = parse_flags(notes)
                    records.append(make_record(drug, tier, flags, issuer_ids,
                                               pdf_path.name, state))
    return records


# ══════════════════════════════════════════════════════════════════════════════
# PARSER: NJ Horizon (Prime Therapeutics) — 14-col dual-column layout
# ══════════════════════════════════════════════════════════════════════════════

def parse_horizon_nj(pdf_path: Path, issuer_ids: list,
                     start_page: int = 9, end_page: int = -1) -> list[dict]:
    """Parse Horizon BCBS NJ Prime Therapeutics formulary (dual-column 14-col table)."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  Horizon NJ: parsing pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))
        for i in range(start_page, ep):
            tables = pdf.pages[i].extract_tables()
            for table in tables:
                if not table:
                    continue
                for row in table:
                    ncols = len(row)
                    # Left column: cols 0 (drug), 1 (tier), 2-5 (flags)
                    if ncols > 1:
                        drug_l = clean_name(str(row[0] or ""))
                        tier_l = str(row[1] or "").strip() if ncols > 1 else ""
                        if drug_l and tier_l and re.match(r"^[1-3]$", tier_l):
                            # Check flag columns
                            flag_text = ""
                            for fc in range(2, min(6, ncols)):
                                val = str(row[fc] or "").strip()
                                if val in ("✓", "†", "●", "◆", "✗", "♦"):
                                    # Map column position to flag
                                    if fc == 2:
                                        flag_text += " PA"
                                    elif fc == 3:
                                        flag_text += " ST"
                                    elif fc == 4:
                                        flag_text += " QL"
                                    elif fc == 5:
                                        flag_text += " SP"
                            tier = normalize_tier(tier_l)
                            flags = parse_flags(flag_text)
                            records.append(make_record(drug_l, tier, flags, issuer_ids,
                                                       pdf_path.name, "NJ"))

                    # Right column: cols 7 (drug), 8 (tier), 9-12 (flags)
                    if ncols > 8:
                        drug_r = clean_name(str(row[7] or ""))
                        tier_r = str(row[8] or "").strip() if ncols > 8 else ""
                        if drug_r and tier_r and re.match(r"^[1-3]$", tier_r):
                            flag_text = ""
                            for fc in range(9, min(13, ncols)):
                                val = str(row[fc] or "").strip()
                                if val in ("✓", "†", "●", "◆", "✗", "♦"):
                                    if fc == 9:
                                        flag_text += " PA"
                                    elif fc == 10:
                                        flag_text += " ST"
                                    elif fc == 11:
                                        flag_text += " QL"
                                    elif fc == 12:
                                        flag_text += " SP"
                            tier = normalize_tier(tier_r)
                            flags = parse_flags(flag_text)
                            records.append(make_record(drug_r, tier, flags, issuer_ids,
                                                       pdf_path.name, "NJ"))
    return records


# ══════════════════════════════════════════════════════════════════════════════
# PARSER: VT BCBS — word-position parsing (no table lines)
# ══════════════════════════════════════════════════════════════════════════════

VT_BCBS_TIER_RE = re.compile(r"^TIER\s*0[1-5]$", re.IGNORECASE)


def parse_vt_bcbs_words(pdf_path: Path, issuer_ids: list,
                        start_page: int = 8, end_page: int = -1) -> list[dict]:
    """Parse VT BCBS formulary using word-position parsing.
    Layout: Drug Name (x<245) | Brand Reference (x 245-390) | Drug Tier (x 392-465) | Notes (x>465)
    """
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  VT BCBS: word-position parsing pages %d-%d of %d",
                 start_page + 1, ep, len(pdf.pages))

        for i in range(start_page, ep):
            words = pdf.pages[i].extract_words(x_tolerance=3, y_tolerance=3)
            if not words:
                continue

            # Sort by y then x
            words = sorted(words, key=lambda w: (round(w["top"]), w["x0"]))

            # Group into rows
            rows: list[list[dict]] = []
            cur_row: list[dict] = []
            cur_y = -999.0
            for w in words:
                if abs(w["top"] - cur_y) > 4.0:
                    if cur_row:
                        rows.append(cur_row)
                    cur_row = [w]
                    cur_y = w["top"]
                else:
                    cur_row.append(w)
            if cur_row:
                rows.append(cur_row)

            # Accumulate multi-line drug entries
            cur_name_parts: list[str] = []
            cur_tier = ""
            cur_notes_parts: list[str] = []

            def flush():
                nonlocal cur_name_parts, cur_tier, cur_notes_parts
                if cur_name_parts and cur_tier:
                    drug = clean_name(" ".join(cur_name_parts))
                    if drug:
                        tier = normalize_tier(cur_tier)
                        notes_text = " ".join(cur_notes_parts)
                        flags = parse_flags(notes_text)
                        records.append(make_record(drug, tier, flags, issuer_ids,
                                                   pdf_path.name, "VT"))
                cur_name_parts = []
                cur_tier = ""
                cur_notes_parts = []

            for row_words in rows:
                # Skip header rows
                row_text = " ".join(w["text"] for w in row_words)
                if "Drug Name" in row_text and "Drug Tier" in row_text:
                    continue

                # Find tier word (x 392-465)
                tier_word = None
                for w in row_words:
                    if 380 <= w["x0"] <= 465:
                        combined = w["text"]
                        if re.match(r"TIER|0[1-5]|\d", combined, re.IGNORECASE):
                            tier_word = w
                            break

                # Classify words
                name_words = [w["text"] for w in row_words if w["x0"] < 245 and w is not tier_word]
                notes_words = [w["text"] for w in row_words if w["x0"] > 465 and w is not tier_word]

                if tier_word:
                    # Build full tier string from this row
                    tier_parts = [w["text"] for w in row_words if 380 <= w["x0"] <= 465]
                    tier_str = " ".join(tier_parts).strip()
                    if VT_BCBS_TIER_RE.match(tier_str) or re.match(r"^0[1-5]$", tier_str):
                        flush()
                        cur_name_parts = name_words
                        cur_tier = tier_str
                        cur_notes_parts = notes_words
                    elif name_words:
                        cur_name_parts.extend(name_words)
                        cur_notes_parts.extend(notes_words)
                else:
                    if name_words:
                        cur_name_parts.extend(name_words)
                    if notes_words:
                        cur_notes_parts.extend(notes_words)

            flush()

    return records


# ══════════════════════════════════════════════════════════════════════════════
# PARSER: OptumRx word-position (MA Tufts / Harvard Pilgrim)
# ══════════════════════════════════════════════════════════════════════════════

def parse_optumrx_words(pdf_path: Path, issuer_ids: list, state: str,
                        start_page: int = 5, end_page: int = -1) -> list[dict]:
    """Parse OptumRx formulary PDFs using word-position parsing.
    These PDFs often lack table lines. Drug Name | Tier | Requirements laid out by x-position.
    """
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  OptumRx word-position: parsing pages %d-%d of %d",
                 start_page + 1, ep, len(pdf.pages))

        # First pass: detect column boundaries from header rows
        name_x_max = 300.0
        tier_x_min = 300.0
        tier_x_max = 380.0
        req_x_min = 400.0

        # Try to find header on first data page
        page0_words = pdf.pages[start_page].extract_words(x_tolerance=3, y_tolerance=3)
        for w in page0_words:
            text = w["text"].lower()
            if "tier" in text and "drug" not in text:
                tier_x_min = w["x0"] - 10  # 10px tolerance handles slight column drift
                tier_x_max = w["x0"] + 60
                name_x_max = w["x0"] - 10
            if text in ("requirements", "restrictions", "notes", "limits"):
                req_x_min = w["x0"] - 5

        tier_re = re.compile(r"^([1-6]|\$0)$")  # $0 = ACA-preventive tier

        for i in range(start_page, ep):
            words = pdf.pages[i].extract_words(x_tolerance=3, y_tolerance=3)
            if not words:
                continue
            words = sorted(words, key=lambda w: (round(w["top"]), w["x0"]))

            # Group into rows
            rows: list[list[dict]] = []
            cur_row: list[dict] = []
            cur_y = -999.0
            for w in words:
                if abs(w["top"] - cur_y) > 4.0:
                    if cur_row:
                        rows.append(cur_row)
                    cur_row = [w]
                    cur_y = w["top"]
                else:
                    cur_row.append(w)
            if cur_row:
                rows.append(cur_row)

            cur_name_parts: list[str] = []
            cur_tier = ""
            cur_req_parts: list[str] = []

            def flush():
                nonlocal cur_name_parts, cur_tier, cur_req_parts
                if cur_name_parts and cur_tier:
                    drug = clean_name(" ".join(cur_name_parts))
                    if drug:
                        tier = normalize_tier(cur_tier)
                        flags = parse_flags(" ".join(cur_req_parts))
                        records.append(make_record(drug, tier, flags, issuer_ids,
                                                   pdf_path.name, state))
                cur_name_parts = []
                cur_tier = ""
                cur_req_parts = []

            for row_words in rows:
                row_text = " ".join(w["text"] for w in row_words)
                if "Drug Name" in row_text or "DRUG NAME" in row_text:
                    continue

                tier_word = None
                for w in row_words:
                    if tier_x_min <= w["x0"] <= tier_x_max and tier_re.match(w["text"]):
                        tier_word = w
                        break

                name_words = [w["text"] for w in row_words if w["x0"] < name_x_max and w is not tier_word]
                req_words = [w["text"] for w in row_words if w["x0"] >= req_x_min and w is not tier_word]

                if tier_word:
                    flush()
                    cur_name_parts = name_words
                    cur_tier = tier_word["text"]
                    cur_req_parts = req_words
                else:
                    if name_words:
                        cur_name_parts.extend(name_words)
                    if req_words:
                        cur_req_parts.extend(req_words)

            flush()

    return records


# ══════════════════════════════════════════════════════════════════════════════
# PARSER: IBX / AmeriHealth — 2-col then 5-col drug tables deeper in PDF
# ══════════════════════════════════════════════════════════════════════════════

IBX_TIER_RE = re.compile(r"^(LCG|G|PB|NP|S|1|2|3|4|5)$", re.IGNORECASE)


def parse_ibx_amerihealth(pdf_path: Path, issuer_ids: list, state: str,
                          start_page: int = 8, end_page: int = -1) -> list[dict]:
    """Parse IBX/AmeriHealth formulary. Drug tables have: Drug Name | Tier Code | Notes."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  IBX/AmeriHealth: parsing pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))

        for i in range(start_page, ep):
            tables = pdf.pages[i].extract_tables()
            for table in tables:
                if not table or len(table[0]) < 2:
                    continue
                for row in table:
                    ncols = len(row)
                    drug = clean_name(str(row[0] or ""))
                    tier_raw = str(row[1] or "").strip() if ncols > 1 else ""
                    notes = str(row[2] or "").strip().replace("\n", " ") if ncols > 2 else ""

                    if not drug or not tier_raw:
                        continue
                    if not IBX_TIER_RE.match(tier_raw):
                        continue

                    tier = normalize_tier(tier_raw)
                    flags = parse_flags(notes)
                    records.append(make_record(drug, tier, flags, issuer_ids,
                                               pdf_path.name, state))
    return records


# ══════════════════════════════════════════════════════════════════════════════
# PARSER: Centene/Ambetter API JSON — https://api.centene.com/ambetter/reference/drugs-AMB-XX.json
# ══════════════════════════════════════════════════════════════════════════════

_CENTENE_JSON_TIER_MAP = {
    "GENERIC": "GENERIC",
    "PREFERREDGENERIC": "PREFERRED-GENERIC",
    "PREFERREDBRAND": "PREFERRED-BRAND",
    "NON-PREFERREDBRAND": "NON-PREFERRED-BRAND",
    "NON-PREFERREDGENERIC-NON-PREFERREDBRAND": "NON-PREFERRED-BRAND",
    "SPECIALTY": "SPECIALTY",
    "SPECIALTYGENERIC": "SPECIALTY-GENERIC",
    "SPECIALTYDRUGS": "SPECIALTY",
    "ZEROCOSTSHAREPREVENTIVEDRUGS": "ACA-PREVENTIVE",     # IL spelling (no "ative")
    "ZEROCOSTSHAREPREVENTATIVEDRUGS": "ACA-PREVENTIVE",   # NJ/other spelling
    "PREVENTIVE": "ACA-PREVENTIVE",
    "NONFORMULARY": "NON-FORMULARY",
}

_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE


def parse_centene_json(url: str, issuer_ids: list, state: str) -> list[dict]:
    """Parse Centene/Ambetter API JSON drug list.

    URL format: https://api.centene.com/ambetter/reference/drugs-AMB-XX.json
    Returns one record per unique drug_name (deduped across plans).
    """
    log.info("  Centene JSON: fetching %s", url)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, context=_SSL_CTX, timeout=60) as r:
            raw = json.loads(r.read())
    except Exception as e:
        log.error("  Centene JSON fetch failed: %s", e)
        return []

    if not isinstance(raw, list):
        log.error("  Centene JSON: unexpected format (expected list)")
        return []

    log.info("  Centene JSON: %d raw records", len(raw))
    seen: set[str] = set()
    records: list[dict] = []
    for item in raw:
        drug_name = clean_name(str(item.get("drug_name", "")))
        if not drug_name or drug_name in seen:
            continue
        seen.add(drug_name)

        plans = item.get("plans", [])
        if not plans:
            continue

        # Use first plan's tier/flags (same drug, same tier across plans for same issuer)
        p = plans[0]
        tier_raw = str(p.get("drug_tier", "")).strip().upper().replace(" ", "")
        tier = _CENTENE_JSON_TIER_MAP.get(tier_raw, tier_raw) if tier_raw else ""
        if not tier:
            continue

        rxnorm = str(item.get("rxnorm_id", "")) or None
        flags = {
            "prior_authorization": any(pl.get("prior_authorization") for pl in plans),
            "step_therapy": any(pl.get("step_therapy") for pl in plans),
            "quantity_limit": any(pl.get("quantity_limit") for pl in plans),
        }

        records.append({
            "drug_name": drug_name,
            "drug_tier": tier,
            "prior_authorization": flags["prior_authorization"],
            "step_therapy": flags["step_therapy"],
            "quantity_limit": flags["quantity_limit"],
            "quantity_limit_detail": None,
            "specialty": "SPECIALTY" in tier.upper(),
            "issuer_ids": issuer_ids,
            "rxnorm_id": rxnorm,
            "source_pdf": f"centene_api_{state.lower()}.json",
            "state_code": state,
            "plan_year": PLAN_YEAR,
            "is_priority_drug": is_priority(drug_name),
        })

    log.info("  → %d unique drugs from Centene JSON", len(records))
    return records


# ══════════════════════════════════════════════════════════════════════════════
# CARRIER DEFINITIONS — all 41 downloadable carriers
# ══════════════════════════════════════════════════════════════════════════════

CARRIER_DEFS = {
    # ── CT ──
    "connecticare_ct": {
        "state": "CT", "issuer_ids": ["86545"],
        "issuer_name": "ConnectiCare (CT)",
        "pdf": "connecticare_ct_formulary_2026.pdf",
        "url": "https://www.connecticare.com/en/-/media/Project/PWS/Microsites/ConnectiCare/PDFs/Members/Marketplace/EN/Pharmacy/CTFormulary2026.pdf",
        "parser": "standard_3col", "start_page": 30, "end_page": -1,
        "notes_col": 2,
    },
    "anthem_ct": {
        "state": "CT", "issuer_ids": ["94815"],
        "issuer_name": "Anthem (CT) — Elevance Health",
        "pdf": "anthem_ct_select_4tier_ind_2026.pdf",
        "url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_CT_IND.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
    },
    # ── DC ──
    "kaiser_dc": {
        "state": "DC", "issuer_ids": ["94506", "86052"],
        "issuer_name": "Kaiser Permanente (DC — MAS)",
        "pdf": "kaiser_mas_marketplace_formulary_2026.pdf",
        "url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/mas/marketplace-formulary-mas-en.pdf",
        "parser": "standard_3col", "start_page": 3, "end_page": -1,
    },
    "carefirst_dc": {
        "state": "DC", "issuer_ids": ["28137", "45532", "94084"],
        "issuer_name": "CareFirst BCBS (DC/MD)",
        "pdf": "carefirst_exchange_formulary_2026.pdf",
        "url": "https://member.carefirst.com/carefirst-resources/pdf/exchange-formulary-sum7277-2026.pdf",
        "parser": "carefirst_4col", "start_page": 5, "end_page": -1,
    },
    # ── ID ──
    "bcidaho": {
        "state": "ID", "issuer_ids": ["38128"],
        "issuer_name": "Blue Cross of Idaho",
        "pdf": "bcidaho_qhp_formulary_2026.pdf",
        "url": "https://res.cloudinary.com/bluecrossofidaho/image/upload/web/pdfs/pharmacy/2026/2026-Blue-Cross-of-Idaho-QHP-Formulary.pdf",
        "parser": "optumrx_words", "start_page": 5, "end_page": -1,
    },
    "stlukes_id": {
        "state": "ID", "issuer_ids": ["92170"],
        "issuer_name": "St. Luke's Health Plan (ID)",
        "pdf": "stlukes_id_formulary_2026.pdf",
        "url": "https://www.stlukeshealthplan.org/assets/blt41861338f1f78cbf",
        "parser": "optumrx_words", "start_page": 5, "end_page": -1,
    },
    # ── KY ──
    "anthem_ky": {
        "state": "KY", "issuer_ids": ["36239"],
        "issuer_name": "Anthem (KY) — Elevance Health",
        "pdf": "anthem_ky_select_4tier_ind_2026.pdf",
        "url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_KY_IND.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
    },
    "ambetter_ky": {
        "state": "KY", "issuer_ids": ["45636"],
        "issuer_name": "Ambetter (KY) — Centene",
        "pdf": "ambetter_ky_formulary_2026.pdf",
        "url": "https://www.ambetterhealth.com/content/dam/centene/kentucky/ambetter/pdf/2026-ky-formulary.pdf",
        "parser": "centene", "start_page": 5, "end_page": -1,
    },
    "molina_ky": {
        "state": "KY", "issuer_ids": ["73891"],
        "issuer_name": "Molina Healthcare of KY (Passport)",
        "pdf": "molina_ky_formulary_2026.pdf",
        "url": "https://www.molinamarketplace.com/marketplace/ky/en-us/-/media/Molina/PublicWebsite/PDF/members/ky/en-us/Marketplace/2026/KYFormulary2026.pdf",
        "parser": "standard_3col", "start_page": 28, "end_page": -1,
    },
    # ── MA ──
    "hne_ma": {
        "state": "MA", "issuer_ids": ["34484"],
        "issuer_name": "Health New England (MA)",
        "pdf": "hne_ma_formulary_2026.pdf",
        "url": "https://healthnewengland.org/Portals/_default/Shared%20Documents/pharmacy/Find%20a%20Drug/2026/Health_New_England_NEHIM.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
    },
    "tufts_ma": {
        "state": "MA", "issuer_ids": ["36046"],
        "issuer_name": "Tufts Health Direct (MA)",
        "pdf": "tufts_ma_value_direct_3t_2026.pdf",
        "url": "https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/harvard-pilgrim/p32-formulary-documents/2026/P32H-Value-Direct-3T-Comprehensive-Tufts.pdf",
        "parser": "optumrx_words", "start_page": 5, "end_page": -1,
    },
    "harvardpilgrim_ma": {
        "state": "MA", "issuer_ids": ["42690"],
        "issuer_name": "Harvard Pilgrim Health Care (MA)",
        "pdf": "harvardpilgrim_ma_core_5t_2026.pdf",
        "url": "https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/harvard-pilgrim/hphc-formulary-documents/2026-oe/HPHC-Core-MA-5T-Comprehensive.pdf",
        "parser": "optumrx_words", "start_page": 5, "end_page": -1,
    },
    "uhc_ma": {
        "state": "MA", "issuer_ids": ["31779"],
        "issuer_name": "UnitedHealthcare (MA)",
        "pdf": "uhc_ma_commercial_pdl_2026.pdf",
        "url": "https://www.uhcprovider.com/content/dam/provider/docs/public/resources/pharmacy/commercial-pdl-jan-2026.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
        "name_col": 0, "tier_col": 1, "notes_col": 2, "min_cols": 2,
    },
    "wellsense_ma": {
        "state": "MA", "issuer_ids": ["82569"],
        "issuer_name": "WellSense Health Plan (MA)",
        "pdf": "wellsense_ma_clarity_formulary_2026.pdf",
        "url": "https://www.wellsense.org/hubfs/Pharmacy/MA_Clarity_Formulary_Guidebook_2026.pdf",
        "parser": "optumrx_words", "start_page": 5, "end_page": -1,
    },
    # ── MD ──
    "kaiser_md": {
        "state": "MD", "issuer_ids": ["90296"],
        "issuer_name": "Kaiser Permanente (MD — MAS)",
        "pdf": "kaiser_mas_marketplace_formulary_2026.pdf",  # reuse DC PDF
        "url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/mas/marketplace-formulary-mas-en.pdf",
        "parser": "standard_3col", "start_page": 3, "end_page": -1,
    },
    "wellpoint_md": {
        "state": "MD", "issuer_ids": ["72545"],
        "issuer_name": "Wellpoint/Anthem (MD) — Elevance Health",
        "pdf": "wellpoint_md_select_4tier_ind_2026.pdf",
        "url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_MD_IND.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
    },
    "uhc_md": {
        "state": "MD", "issuer_ids": ["72375"],
        "issuer_name": "UnitedHealthcare (MD)",
        "pdf": "uhc_md_ifp_pdl_2026.pdf",
        "url": "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-MD_UHC_IFP_PY26.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
        "min_cols": 2,
    },
    "carefirst_md": {
        "state": "MD", "issuer_ids": ["28137", "45532", "94084"],
        "issuer_name": "CareFirst BCBS (MD)",
        "pdf": "carefirst_exchange_formulary_2026.pdf",  # reuse DC PDF
        "url": "https://member.carefirst.com/carefirst-resources/pdf/exchange-formulary-sum7277-2026.pdf",
        "parser": "carefirst_4col", "start_page": 5, "end_page": -1,
    },
    # ── NJ ──
    "amerihealth_nj": {
        "state": "NJ", "issuer_ids": ["91762"],
        "issuer_name": "AmeriHealth NJ",
        "pdf": "amerihealth_nj_value_formulary_2026.pdf",
        "url": "https://www.amerihealth.com/pdfs/providers/pharmacy_information/value/ah-value-formulary-nj.pdf",
        "parser": "ibx_amerihealth", "start_page": 8, "end_page": -1,
    },
    "horizon_nj": {
        "state": "NJ", "issuer_ids": ["91661"],
        "issuer_name": "Horizon BCBS NJ",
        "pdf": "horizon_nj_marketplace_3t_2026.pdf",
        "url": "https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_NJ_3T_HealthInsuranceMarketplace.pdf",
        "parser": "horizon_nj", "start_page": 9, "end_page": -1,
    },
    "uhc_nj": {
        "state": "NJ", "issuer_ids": ["37777"],
        "issuer_name": "UnitedHealthcare (NJ)",
        "pdf": "uhc_nj_ifp_pdl_2026.pdf",
        "url": "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-NJ_UHC_IFP_PY26.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
        "min_cols": 2,
    },
    # ── NM ──
    "molina_nm": {
        # HIOS 19722. Bilingual PDF: pages 1-85 = therapeutic category index + intro;
        # pages 86+ = standard 3-col drug table (Drug Name | Formulary Status | Requirements/Limits).
        # Tier values: Tier 1/2/3/4/5, PREV (preventive), DME (non-drug, skip).
        "state": "NM", "issuer_ids": ["19722"],
        "issuer_name": "Molina Healthcare of NM",
        "pdf": "molina_nm_formulary_2026.pdf",
        "url": "https://www.molinamarketplace.com/marketplace/nm/en-us/-/media/Molina/PublicWebsite/PDF/members/nm/en-us/Marketplace/2026/NMFormulary2026.pdf",
        "parser": "standard_3col", "start_page": 85, "end_page": -1,
        "tier_col": 1,  # col[1] = "Formulary Status"
    },
    "bcbsnm": {
        # HIOS 75605. 2-tier formulary: P=Preferred, NP=Non-Preferred, P+=Specialty, NP+=Specialty-High.
        # Notes flags: AC=ACA-preventive, SP=specialty, PA=prior-auth, QL=qty-limit, BH=behavioral-health.
        # Drug table starts page 11 (index 10). 3-col: Drug Name | Drug Tier | Requirements/Limits.
        "state": "NM", "issuer_ids": ["75605"],
        "issuer_name": "BCBS New Mexico",
        "pdf": "bcbsnm_2026.pdf",
        "url": "https://www.bcbsnm.com/nm/documents/rx-drugs/drug-lists/performance-nm-2026.pdf",
        "parser": "standard_3col", "start_page": 10, "end_page": -1,
        "min_cols": 2,
    },
    # NM Ambetter (57173, Western Sky): ambetterhealth.com PDF redirects to HTML; Centene API 404
    # NM UHC (65428): uhc.com PDF returns 403. Both blocked as of 2026-04-04.
    # ── NV ──
    "anthem_nv": {
        "state": "NV", "issuer_ids": ["60156"],
        "issuer_name": "Anthem (NV) — Elevance Health",
        "pdf": "anthem_nv_select_4tier_ind_2026.pdf",
        "url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_NV_IND.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
    },
    "silversummit_nv": {
        "state": "NV", "issuer_ids": ["95865"],
        "issuer_name": "SilverSummit/Ambetter (NV) — Centene",
        "pdf": "silversummit_nv_formulary_2026.pdf",
        "url": "https://www.ambetterhealth.com/content/dam/centene/Nevada/ambetter/pdfs/2026-nv-formulary.pdf",
        "parser": "centene", "start_page": 5, "end_page": -1,
    },
    "hpn_nv": {
        "state": "NV", "issuer_ids": ["45142"],
        "issuer_name": "Health Plan of Nevada (UHC subsidiary)",
        "pdf": "hpn_nv_essential_4tier_2026.pdf",
        "url": "https://www.healthplanofnevada.com/content/dam/hpnv-public-sites/health-plan-of-nevada/documents/pharmacy/2026/UHC8654_25.1_Essential%20Individual%204%20tier%20PDL_JAN26_FINAL.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
        "min_cols": 2,
    },
    "hometown_nv": {
        "state": "NV", "issuer_ids": ["41094", "43314"],
        "issuer_name": "Hometown Health (NV)",
        "pdf": "hometown_nv_ifp_exchange_formulary_2026.pdf",
        "url": "https://www.hometownhealth.com/wp-content/uploads/2025/12/Hometown_Health_IFP_Exchange-Formulary-_Eff-01.01.2026.pdf",
        "parser": "standard_3col", "start_page": 4, "end_page": -1,
        "min_cols": 2,
    },
    # ── PA ──
    "ibx_pa_value": {
        "state": "PA", "issuer_ids": ["33709", "79962", "79279", "33871", "31609"],
        "issuer_name": "Independence Blue Cross (PA) — Value Formulary",
        "pdf": "ibx_pa_value_formulary_2026.pdf",
        "url": "https://www.ibx.com/documents/35221/56635/value-formulary-guide.pdf",
        "parser": "ibx_amerihealth", "start_page": 8, "end_page": -1,
    },
    "ibx_pa_select": {
        "state": "PA", "issuer_ids": ["33709", "79962", "79279", "33871", "31609"],
        "issuer_name": "Independence Blue Cross (PA) — Select Drug",
        "pdf": "ibx_pa_select_drug_guide_2026.pdf",
        "url": "https://www.ibx.com/documents/35221/56635/select-drug-guide.pdf",
        "parser": "ibx_amerihealth", "start_page": 8, "end_page": -1,
    },
    "ambetter_pa": {
        "state": "PA", "issuer_ids": ["45127"],
        "issuer_name": "Ambetter (PA) — Centene",
        "pdf": "ambetter_pa_formulary_2026.pdf",
        "url": "https://www.ambetterhealth.com/content/dam/centene/Pennsylvania/ambetter/pdfs/2026-pa-formulary.pdf",
        "parser": "centene", "start_page": 5, "end_page": -1,
    },
    "amerihealth_pa": {
        "state": "PA", "issuer_ids": ["86199"],
        "issuer_name": "AmeriHealth (PA)",
        "pdf": "amerihealth_pa_select_drug_2026.pdf",
        "url": "https://www.amerihealth.com/pdfs/providers/pharmacy_information/select_drug/ah_select_drug_guide.pdf",
        "parser": "ibx_amerihealth", "start_page": 8, "end_page": -1,
    },
    "geisinger_pa": {
        "state": "PA", "issuer_ids": ["75729"],
        "issuer_name": "Geisinger Health Plan (PA)",
        "pdf": "geisinger_pa_marketplace_formulary_2026.pdf",
        "url": "https://www.geisinger.org/-/media/OneGeisinger/Files/PDFs/Shared-PDFs/Formulary-Updates/Marketplace-Formulary-2026.pdf",
        "parser": "standard_3col", "start_page": 15, "end_page": -1,
    },
    "jefferson_pa": {
        "state": "PA", "issuer_ids": ["19702", "93909"],
        "issuer_name": "Jefferson Health Plans (PA)",
        "pdf": "jefferson_pa_ifp_formulary_2026.pdf",
        "url": "https://www.jeffersonhealthplans.com/content/dam/jeffersonhealthplans/documents/formularies/ifp/rxflex-formulary-jhp-ifp-2026-11012025.pdf",
        "parser": "standard_3col", "start_page": 5, "end_page": -1,
    },
    # ── VT ──
    "bcbsvt": {
        "state": "VT", "issuer_ids": ["13627"],
        "issuer_name": "Blue Cross Blue Shield of Vermont",
        "pdf": "bcbsvt_formulary_booklet_2026.pdf",
        "url": "https://www.bluecrossvt.org/documents/2026-blue-cross-vt-formulary-booklet",
        "parser": "vt_bcbs_words", "start_page": 8, "end_page": -1,
    },
    "mvp_vt": {
        "state": "VT", "issuer_ids": ["77566"],
        "issuer_name": "MVP Health Plan (VT)",
        "pdf": "mvp_vt_marketplace_formulary_2026.pdf",
        "url": "https://www.mvphealthcare.com/-/media/project/mvp/healthcare/documents/formularies/2026/marketplace-pharmacy-formulary-2026.pdf",
        "parser": "carefirst_4col", "start_page": 17, "end_page": -1,
    },
    # ── WA ──
    "ambetter_wa": {
        "state": "WA", "issuer_ids": ["61836"],
        "issuer_name": "Ambetter/Coordinated Care (WA) — Centene",
        "pdf": "ambetter_wa_cascade_formulary_2026.pdf",
        "url": "https://www.ambetterhealth.com/content/dam/centene/Coordinated%20Care/ambetter/PDFs/2026-wa-cascade-formulary.pdf",
        "parser": "centene", "start_page": 5, "end_page": -1,
    },
    "lifewise_wa": {
        "state": "WA", "issuer_ids": ["38498"],
        "issuer_name": "LifeWise Health Plan (WA)",
        "pdf": "lifewise_wa_formulary_2026.pdf",
        "url": "https://www.wahealthplan.org/wp-content/uploads/2024/02/LifeWise-2026-Pharmacy-Formulary.pdf",
        "parser": "optumrx_words", "start_page": 5, "end_page": -1,
    },
    "kaiser_wa": {
        "state": "WA", "issuer_ids": ["23371"],
        "issuer_name": "Kaiser Permanente (WA — NW)",
        "pdf": "kaiser_wa_marketplace_formulary_2026.pdf",
        "url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/nw/washington-marketplace-formulary-nw-en-2026-commercial.pdf",
        "parser": "standard_3col", "start_page": 3, "end_page": -1,
    },
    "molina_wa": {
        "state": "WA", "issuer_ids": ["80473"],
        "issuer_name": "Molina Healthcare (WA)",
        "pdf": "molina_wa_formulary_2026.pdf",
        "url": "https://www.molinamarketplace.com/marketplace/wa/en-us/-/media/Molina/PublicWebsite/PDF/members/wa/en-us/Marketplace/2026/WAFormulary2026.pdf",
        "parser": "standard_3col", "start_page": 30, "end_page": -1,
    },
    "premera_wa": {
        "state": "WA", "issuer_ids": ["49831"],
        "issuer_name": "Premera Blue Cross (WA)",
        "pdf": "premera_wa_metallic_formulary_2026.pdf",
        "url": "https://www.premera.com/documents/052146_2026.pdf",
        "parser": "optumrx_words", "start_page": 5, "end_page": -1,
    },
    "uhc_wa": {
        "state": "WA", "issuer_ids": ["62650"],
        "issuer_name": "UnitedHealthcare (WA)",
        "pdf": "uhc_wa_formulary_2026.pdf",
        "url": "https://www.wahealthplan.org/wp-content/uploads/2024/02/UHC-2026-WA-Formulary.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
        "min_cols": 2,
    },
    "bridgespan_wa": {
        "state": "WA", "issuer_ids": ["53732"],
        "issuer_name": "BridgeSpan Health (WA) — Cambia",
        "pdf": "bridgespan_wa_exchange_formulary_2026.pdf",
        "url": "https://fm.formularynavigator.com/MemberPages/pdf/StateExchangeFormularyWA_2076_Full_442.pdf",
        "parser": "standard_3col", "start_page": 5, "end_page": -1,
        "min_cols": 2,
    },
    "chpw_wa": {
        "state": "WA", "issuer_ids": ["18581"],
        "issuer_name": "Community Health Plan of WA",
        "pdf": "chpw_wa_cascade_select_formulary_2026.pdf",
        "url": "https://individualandfamily.chpw.org/wp-content/uploads/cascade-select/content/member/pharmacy/CS_RX010_Formulary_2026.pdf",
        "parser": "optumrx_words", "start_page": 5, "end_page": -1,
    },

    # ── CT gap carriers ────────────────────────────────────────────────────────
    "connecticare_choice_ct": {
        # Issuer 76962 = ConnectiCare (Choice-branded plans). Not CareSource.
        # Uses same ConnectiCare formulary PDF as issuer 86545.
        "state": "CT", "issuer_ids": ["76962"],
        "issuer_name": "ConnectiCare (CT — Choice plans)",
        "pdf": "connecticare_ct_formulary_2026.pdf",
        "url": "https://www.connecticare.com/en/-/media/Project/PWS/Microsites/ConnectiCare/PDFs/Members/Marketplace/EN/Pharmacy/CTFormulary2026.pdf",
        # col[0]=Drug Name, col[1]=Formulary Status (Tier 1/2/3/4), col[2]=Requirements
        "parser": "standard_3col", "start_page": 31, "end_page": -1,
    },

    # ── DC gap carriers ────────────────────────────────────────────────────────
    "upmc_dc": {
        "state": "DC", "issuer_ids": ["78079"],
        "issuer_name": "UPMC Health Plan (DC)",
        "pdf": "upmc_advantage_choice_formulary_2026.pdf",
        "url": "https://upmc.widen.net/view/pdf/02jjoeuifc/25TOTEX6064850---2026-Advantage-Choice-Formulary-Book_WEB.pdf?t.download=true&u=oid6pr",
        # Same PDF as UPMC PA. Tiers: SG/PG/PBG/NP/SP
        "parser": "standard_3col", "start_page": 10, "end_page": -1,
    },

    # ── OR gap carriers ────────────────────────────────────────────────────────
    "kaiser_or": {
        "state": "OR", "issuer_ids": ["71287"],
        "issuer_name": "Kaiser Permanente (OR — NW region)",
        "pdf": "kaiser_nw_marketplace_formulary_2026.pdf",
        "url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/nw/washington-marketplace-formulary-nw-en-2026-commercial.pdf",
        # NW Kaiser PDF: col[0]=drug, col[1]=None, col[2]=tier, col[3]=notes
        "parser": "standard_3col", "name_col": 0, "tier_col": 2, "notes_col": 3,
        "min_cols": 3, "start_page": 3, "end_page": -1,
    },
    "pacificsource_or": {
        "state": "OR", "issuer_ids": ["10091"],
        "issuer_name": "PacificSource Health Plans (OR)",
        "pdf": "pacificsource_or_formulary_2026.pdf",
        "url": "https://pacificsource.com/ps_find_drug/pdf/OR/2026",
        "parser": "standard_3col", "start_page": 5, "end_page": -1,
    },

    # ── VA gap carriers ────────────────────────────────────────────────────────
    "kaiser_va": {
        "state": "VA", "issuer_ids": ["95185"],
        "issuer_name": "Kaiser Permanente (VA — MAS region)",
        "pdf": "kaiser_mas_marketplace_formulary_2026.pdf",
        "url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/mas/marketplace-formulary-mas-en.pdf",
        "parser": "standard_3col", "start_page": 3, "end_page": -1,
    },
    "anthem_hk_va": {
        "state": "VA", "issuer_ids": ["88380"],
        "issuer_name": "Anthem HealthKeepers (VA)",
        "pdf": "anthem_va_select_4tier_ind_2026.pdf",
        "url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_VA_IND.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1,
    },
    "uhc_va": {
        "state": "VA", "issuer_ids": ["24251"],
        "issuer_name": "UnitedHealthcare (VA)",
        "pdf": "uhc_va_ifp_pdl_2026.pdf",
        "url": "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-VA_UHC_IFP_PY26.pdf",
        "parser": "standard_3col", "start_page": 6, "end_page": -1, "min_cols": 2,
    },
    "oscar_va": {
        # HIOS prefix 25922 confirmed via HealthSherpa VA plan URLs (25922VA001xxxxx)
        "state": "VA", "issuer_ids": ["25922"],
        "issuer_name": "Oscar Health (VA)",
        # April 2026 update (as of 03/25/2026) — newer than January version
        "pdf": "oscar_va_4t_formulary_2026_apr.pdf",
        "url": "https://assets.ctfassets.net/plyq12u1bv8a/2MZUcXQmrJ9F5OY99YNSmt/51c9c67ab20b524f6135b88946b53d11/Oscar_4T_VA_STND_Member_Doc__April_2026__as_of_03252026.pdf",
        # Oscar PDFs: col[0]=blank/category, col[1]=drug name, col[2]=tier, col[3]=notes
        "parser": "standard_3col", "name_col": 1, "tier_col": 2, "notes_col": 3,
        "min_cols": 4, "start_page": 8, "end_page": -1,
    },

    "sentara_va": {
        "state": "VA", "issuer_ids": ["20507"],
        "issuer_name": "Sentara Health Plans (VA)",
        "pdf": "sentara_va_individual_formulary_2026.pdf",
        "url": "https://shc-p-001.sitecorecontenthub.cloud/api/public/content/2bcba04af2334f9fab14d927a4221c12?v=723f233b",
        # Standard 3-col: col[0]=Drug Name, col[1]=Drug Tier, col[2]=Requirements/Limits
        "parser": "standard_3col", "start_page": 12, "end_page": -1,
    },

    # ── PA gap carriers ────────────────────────────────────────────────────────
    "upmc_pa": {
        "state": "PA", "issuer_ids": ["16322", "62560"],
        "issuer_name": "UPMC Health Plan (PA)",
        "pdf": "upmc_advantage_choice_formulary_2026.pdf",
        "url": "https://upmc.widen.net/view/pdf/02jjoeuifc/25TOTEX6064850---2026-Advantage-Choice-Formulary-Book_WEB.pdf?t.download=true&u=oid6pr",
        # 3-col: col[0]=Drug Name, col[1]=Drug Tier (SG/PG/PBG/NP/SP), col[2]=Notes
        "parser": "standard_3col", "start_page": 10, "end_page": -1,
    },
    "oscar_pa": {
        "state": "PA", "issuer_ids": ["98517"],
        "issuer_name": "Oscar Health (PA)",
        "pdf": "oscar_pa_4t_formulary_2026.pdf",
        "url": "https://assets.ctfassets.net/plyq12u1bv8a/63B8wAgFLaG6cPTA9ZY9uy/a917f396ad20287d6a6234b17d2aa351/Oscar_4T_PA_STND_Member_Doc__January_2026__as_of_09162025.pdf",
        "parser": "standard_3col", "name_col": 1, "tier_col": 2, "notes_col": 3,
        "min_cols": 4, "start_page": 8, "end_page": -1,
    },

    # ── MA gap carriers ────────────────────────────────────────────────────────
    "fallon_ma": {
        "state": "MA", "issuer_ids": ["41304"],
        "issuer_name": "Fallon Health (MA)",
        "pdf": "fallon_ma_qhp_formulary_2026.pdf",
        "url": "https://fm.formularynavigator.com/FBO/126/2026_QHP_Formulary.pdf",
        # Standard 3-col: col[0]=Drug Name, col[1]=Drug Tier (Tier 1-4), col[2]=Requirements
        "parser": "standard_3col", "start_page": 13, "end_page": -1,
    },

    # ── MN gap carriers ────────────────────────────────────────────────────────
    "quartz_mn": {
        # HIOS 30242 = Quartz Health Plan MN Corporation (existing MN data)
        # HIOS 70373 = Quartz Health Plan, Inc. (WI parent — also offers in MN)
        # Both share the same quartzbenefits.com formulary PDF.
        "state": "MN", "issuer_ids": ["30242", "70373"],
        "issuer_name": "Quartz Health Plan (MN)",
        "pdf": "quartz_mn_individual_formulary_2026.pdf",
        "url": "https://quartzbenefits.com/wp-content/uploads/docs/members/pharmacy/2026/2026-Individual-Family-Standard-Formulary.pdf",
        # 3-col: Drug Name | Drug Tier | Notes. Drug table starts page 20 (index 19).
        "parser": "standard_3col", "start_page": 19, "end_page": 101,
    },
    "ucare_mn": {
        # HIOS 85736. UCare IFP 2026 formulary — word-position PDF (no table lines).
        # Format: DRUG NAME (x0~44) | DRUG TIER (x0~325, bare digit 1-4) | REQUIREMENTS/LIMITS (x0~396)
        # Drug table starts page 9 (index 8). URL confirmed live 2026-04-04.
        "state": "MN", "issuer_ids": ["85736"],
        "issuer_name": "UCare (MN)",
        "pdf": "ucare_mn_ifp_2026.pdf",
        "url": "https://ucm-p-001.sitecorecontenthub.cloud/api/public/content/U5434_IFP_Formulary_2026",
        "parser": "optumrx_words", "start_page": 8, "end_page": -1,
    },

    # ── IL gap carriers ────────────────────────────────────────────────────────
    "ambetter_il": {
        # HIOS 27833. Centene API JSON — replaces old 99167 placeholder.
        "state": "IL", "issuer_ids": ["27833", "99167"],
        "issuer_name": "Ambetter (IL) — Centene",
        "pdf": None,  # JSON source — no PDF
        "url": "https://api.centene.com/ambetter/reference/drugs-AMB-IL.json",
        "parser": "centene_json",
    },
    "oscar_il": {
        # HIOS 11574 = Oscar Health Plan of Illinois, Inc. Confirmed from plan ID 11574IL0010053.
        "state": "IL", "issuer_ids": ["11574"],
        "issuer_name": "Oscar Health (IL)",
        "pdf": "oscar_il_4t_formulary_2026.pdf",
        "url": "https://assets.ctfassets.net/plyq12u1bv8a/2Hw9ni8AT8gZNlWzniNeNR/b74be679716ee5423e64457ac79a944a/Oscar_4T_IL_STND_Member_Doc__January_2026__as_of_09162025.pdf",
        # 4-col: col[0]=blank/category, col[1]=Drug Name, col[2]=Drug Tier, col[3]=Notes
        "parser": "standard_3col", "name_col": 1, "tier_col": 2, "notes_col": 3,
        "min_cols": 4, "start_page": 7, "end_page": -1,
    },

    # ── NJ gap carriers ────────────────────────────────────────────────────────
    "ambetter_nj": {
        # HIOS 17970. Centene API JSON. Confirmed from plan ID 17970NJ0010003.
        "state": "NJ", "issuer_ids": ["17970"],
        "issuer_name": "Ambetter (NJ) — Centene",
        "pdf": None,
        "url": "https://api.centene.com/ambetter/reference/drugs-AMB-NJ.json",
        "parser": "centene_json",
    },

    # ── NJ gap carriers ────────────────────────────────────────────────────────
    "oscar_nj": {
        # HIOS 47163. 5-tier NJ individual plan. Same 4-col format as oscar_il/oscar_ny.
        "state": "NJ", "issuer_ids": ["47163"],
        "issuer_name": "Oscar Health (NJ)",
        "pdf": "oscar_nj_5t_formulary_2026.pdf",
        "url": "https://assets.ctfassets.net/plyq12u1bv8a/5XDRKjZ9RywAxaGeHDyWeA/3afb2d356d5a1648af48f653353989b0/Oscar_5T_NJ_STND_Member_Doc__January_2026__as_of_09162025.pdf",
        # 4-col: col[0]=blank/category, col[1]=Drug Name, col[2]=Drug Tier, col[3]=Notes
        "parser": "standard_3col", "name_col": 1, "tier_col": 2, "notes_col": 3,
        "min_cols": 4, "start_page": 7, "end_page": -1,
    },

    # ── NY gap carriers ────────────────────────────────────────────────────────
    "oscar_ny": {
        # HIOS 48396. 3-tier NY individual plan.
        "state": "NY", "issuer_ids": ["48396"],
        "issuer_name": "Oscar Health (NY)",
        "pdf": "oscar_ny_3t_formulary_2026.pdf",
        "url": "https://assets.ctfassets.net/plyq12u1bv8a/5V5W0bduhehLDqK6CNPl4Z/1583de01d37024720ea42cc196a99197/Oscar_3T_NY_STND_Member_Doc__January_2026__as_of_09162025.pdf",
        # 4-col: col[0]=blank/category, col[1]=Drug Name, col[2]=Drug Tier, col[3]=Notes
        "parser": "standard_3col", "name_col": 1, "tier_col": 2, "notes_col": 3,
        "min_cols": 4, "start_page": 7, "end_page": -1,
    },

    # ── ME gap carriers ────────────────────────────────────────────────────────
    "hphc_ne_me": {
        # Harvard Pilgrim Health Care of New England — ME issuer, likely same formulary
        # as HPHC MA (OptumRx Core 5-tier). Reuses the already-downloaded MA PDF.
        "state": "ME", "issuer_ids": ["77432"],
        "issuer_name": "Harvard Pilgrim Health Care of New England (ME)",
        "pdf": "harvardpilgrim_ma_core_5t_2026.pdf",
        "url": "https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/harvard-pilgrim/hphc-formulary-documents/2026-oe/HPHC-Core-MA-5T-Comprehensive.pdf",
        "parser": "optumrx_words", "start_page": 5, "end_page": -1,
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# DISPATCH & OUTPUT
# ══════════════════════════════════════════════════════════════════════════════

def parse_carrier(key: str, cdef: dict) -> list[dict]:
    """Dispatch to the right parser for a carrier."""
    parser = cdef["parser"]
    state = cdef["state"]
    ids = cdef["issuer_ids"]

    # JSON-based parsers (no PDF needed)
    if parser == "centene_json":
        return parse_centene_json(cdef["url"], ids, state)

    pdf_path = RAW_DIR / cdef["pdf"]
    if not pdf_path.exists():
        log.warning("  PDF not found: %s", pdf_path)
        return []

    sp = cdef.get("start_page", 0)
    ep = cdef.get("end_page", -1)

    if parser == "standard_3col":
        return parse_standard_3col(pdf_path, ids, state, sp, ep,
                                   name_col=cdef.get("name_col", 0),
                                   tier_col=cdef.get("tier_col", 1),
                                   notes_col=cdef.get("notes_col", 2),
                                   min_cols=cdef.get("min_cols", 3),
                                   tier_prefix=cdef.get("tier_prefix", ""))
    elif parser == "carefirst_4col":
        return parse_carefirst_4col(pdf_path, ids, state, sp, ep)
    elif parser == "centene":
        return parse_centene(pdf_path, ids, state, sp, ep)
    elif parser == "horizon_nj":
        return parse_horizon_nj(pdf_path, ids, sp, ep)
    elif parser == "vt_bcbs_words":
        return parse_vt_bcbs_words(pdf_path, ids, sp, ep)
    elif parser == "optumrx_words":
        return parse_optumrx_words(pdf_path, ids, state, sp, ep)
    elif parser == "ibx_amerihealth":
        return parse_ibx_amerihealth(pdf_path, ids, state, sp, ep)
    else:
        log.error("  Unknown parser: %s", parser)
        return []


def merge_state_output(state: str, carrier_results: dict[str, dict]) -> None:
    """Merge all carrier results for a state into formulary_sbm_XX.json."""
    out_path = OUT_DIR / f"formulary_sbm_{state}.json"

    # Load existing data
    existing_data: list[dict] = []
    existing_results: list[dict] = []
    if out_path.exists():
        with open(out_path, encoding="utf-8") as f:
            existing = json.load(f)
        existing_data = existing.get("data", [])
        existing_results = existing.get("metadata", {}).get("issuer_results", [])

    # Collect new issuer IDs
    new_issuer_ids = set()
    all_new_records: list[dict] = []
    new_results: list[dict] = []
    for key, result in carrier_results.items():
        for iid in result["issuer_ids"]:
            new_issuer_ids.add(iid)
        all_new_records.extend(result["records"])
        new_results.append({
            "issuer_id": result["issuer_ids"][0],
            "issuer_name": result["issuer_name"],
            "state_code": state,
            "source": result["pdf"] or result.get("url", ""),
            "source_url": result.get("url", ""),
            "status": "success" if result["count"] > 0 else "empty",
            "drug_records": result["count"],
        })

    # Keep existing records from issuers we're NOT replacing
    keep = [r for r in existing_data
            if not any(iid in r.get("issuer_ids", []) for iid in new_issuer_ids)]

    # Merge
    combined = keep + all_new_records
    deduped = dedupe_records(combined)

    # Sort alphabetically
    deduped.sort(key=lambda r: r["drug_name"].lower())

    # Stats
    tier_counts = Counter(r["drug_tier"] for r in deduped)
    unique_issuers = {iid for r in deduped for iid in r["issuer_ids"]}
    pa_count = sum(1 for r in deduped if r["prior_authorization"])
    ql_count = sum(1 for r in deduped if r["quantity_limit"])
    st_count = sum(1 for r in deduped if r["step_therapy"])

    # Keep old results for issuers we didn't re-parse
    old_results = [r for r in existing_results
                   if r.get("issuer_id") not in {nr["issuer_id"] for nr in new_results}]

    output = {
        "metadata": {
            "source": f"SBM Formulary - {state} (multi-issuer PDF merge)",
            "state_code": state,
            "plan_year": PLAN_YEAR,
            "issuers_attempted": len(old_results) + len(new_results),
            "issuers_successful": len(old_results) + sum(1 for r in new_results if r["status"] == "success"),
            "issuers_failed": sum(1 for r in new_results if r["status"] != "success"),
            "raw_records": len(combined),
            "deduped_records": len(deduped),
            "unique_drug_names": len({r["drug_name"].lower() for r in deduped}),
            "unique_issuers": len(unique_issuers),
            "tier_breakdown": dict(tier_counts),
            "pa_count": pa_count,
            "ql_count": ql_count,
            "st_count": st_count,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "schema_version": "1.0",
            "issuer_results": old_results + new_results,
        },
        "data": deduped,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    size_mb = out_path.stat().st_size / (1024 * 1024)
    log.info("  %s: %d records, %d issuers, %.1f MB → %s",
             state, len(deduped), len(unique_issuers), size_mb, out_path.name)
    log.info("    Kept %d existing + %d new, tiers: %s", len(keep), len(all_new_records), dict(tier_counts))


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse 15-state formulary PDFs")
    parser.add_argument("--state", type=str, help="Only parse carriers for this state")
    parser.add_argument("--carrier", type=str, help="Only parse this carrier key")
    args = parser.parse_args()

    # Filter carriers
    carriers = dict(CARRIER_DEFS)
    if args.state:
        carriers = {k: v for k, v in carriers.items() if v["state"] == args.state.upper()}
    if args.carrier:
        carriers = {k: v for k, v in carriers.items() if k == args.carrier}

    if not carriers:
        log.error("No carriers matched filters")
        sys.exit(1)

    # Group by state
    states: dict[str, dict[str, dict]] = {}
    for key, cdef in carriers.items():
        st = cdef["state"]
        if st not in states:
            states[st] = {}
        states[st][key] = cdef

    total_records = 0
    total_carriers = 0

    for state in sorted(states.keys()):
        log.info("\n" + "=" * 60)
        log.info("STATE: %s (%d carriers)", state, len(states[state]))
        log.info("=" * 60)

        carrier_results: dict[str, dict] = {}
        for key, cdef in states[state].items():
            log.info("[%s] %s — %s", state, key, cdef["issuer_name"])
            try:
                records = parse_carrier(key, cdef)
                deduped = dedupe_records(records)
                count = len(deduped)
                log.info("  → %d raw, %d deduped", len(records), count)
                if count > 0:
                    tier_c = Counter(r["drug_tier"] for r in deduped)
                    log.info("    Tiers: %s", dict(tier_c))
                carrier_results[key] = {
                    "issuer_ids": cdef["issuer_ids"],
                    "issuer_name": cdef["issuer_name"],
                    "pdf": cdef["pdf"],
                    "url": cdef.get("url", ""),
                    "records": deduped,
                    "count": count,
                }
                total_records += count
                total_carriers += 1
            except Exception as e:
                log.error("  FAILED: %s", e)
                carrier_results[key] = {
                    "issuer_ids": cdef["issuer_ids"],
                    "issuer_name": cdef["issuer_name"],
                    "pdf": cdef["pdf"],
                    "records": [],
                    "count": 0,
                }

        # Merge into state file
        log.info("\nMerging %s...", state)
        merge_state_output(state, carrier_results)

    log.info("\n" + "=" * 60)
    log.info("COMPLETE: %d carriers, %d total records across %d states",
             total_carriers, total_records, len(states))
    log.info("=" * 60)


if __name__ == "__main__":
    main()
