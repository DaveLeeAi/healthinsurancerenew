#!/usr/bin/env python3
"""
V2 parser: Fix low-yield and zero-yield carriers from the 15-state run.

Targets:
1. UHC IFP PDLs (MD/NJ/MA/WA) — dual-column word-position, tier at x~213/490
2. Jefferson PA — word-position, tier at x~381
3. HPN NV — word-position, dual-column with prefix codes
4. BC Idaho — word-position, tier at x~414, notes at x~464
5. Premera WA — word-position, tier at x~333, notes at x~393
6. CHPW WA — word-position, different layout
7. WellSense MA — needs deeper inspection
8. IBX/AmeriHealth NJ/PA — skip (confirmed $0 preventive listing, not full formulary)

Usage:
    python scripts/etl/parse_formulary_15state_v2.py [--carrier KEY]
"""

import argparse
import json
import logging
import re
import time
from collections import Counter
from pathlib import Path

import pdfplumber

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw" / "formulary_pdf"
OUT_DIR = PROJECT_ROOT / "data" / "processed"
PLAN_YEAR = 2026

TIER_MAP = {
    "1": "GENERIC", "2": "PREFERRED-BRAND", "3": "NON-PREFERRED-BRAND",
    "4": "SPECIALTY", "5": "SPECIALTY-HIGH", "6": "SPECIALTY-HIGH",
    "NF": "NON-FORMULARY",
    "T1": "GENERIC", "T2": "PREFERRED-BRAND", "T3": "NON-PREFERRED-BRAND",
    "T4": "SPECIALTY", "T5": "NON-FORMULARY",
}

PRIORITY_DRUGS = {
    "ozempic", "wegovy", "mounjaro", "zepbound", "semaglutide", "tirzepatide",
    "humira", "adalimumab", "eliquis", "apixaban", "xarelto", "rivaroxaban",
    "keytruda", "dupixent", "jardiance", "farxiga", "skyrizi", "stelara",
    "metformin", "atorvastatin", "lisinopril", "amlodipine", "omeprazole",
    "gabapentin", "sertraline", "levothyroxine", "albuterol", "insulin",
    "lantus", "humalog", "novolog", "trulicity", "victoza",
}

TIER_RE = re.compile(r"^[1-6]$")


def is_priority(name: str) -> bool:
    low = name.lower()
    return any(p in low for p in PRIORITY_DRUGS)


def parse_flags(text: str) -> dict:
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


def make_record(drug_name, tier, flags, issuer_ids, source_file, state):
    return {
        "drug_name": drug_name, "drug_tier": tier,
        "prior_authorization": flags["prior_authorization"],
        "step_therapy": flags["step_therapy"],
        "quantity_limit": flags["quantity_limit"],
        "quantity_limit_detail": flags["quantity_limit_detail"],
        "specialty": flags["specialty"] or tier in ("SPECIALTY", "SPECIALTY-HIGH"),
        "issuer_ids": issuer_ids, "rxnorm_id": None,
        "is_priority_drug": is_priority(drug_name),
        "source": "PDF Drug List", "source_file": source_file,
        "state_code": state, "plan_year": PLAN_YEAR,
    }


def group_words_into_rows(words, y_tol=4.0):
    """Group words into rows by y-position."""
    words = sorted(words, key=lambda w: (round(w["top"]), w["x0"]))
    rows = []
    cur_row = []
    cur_y = -999
    for w in words:
        if abs(w["top"] - cur_y) > y_tol:
            if cur_row:
                rows.append(cur_row)
            cur_row = [w]
            cur_y = w["top"]
        else:
            cur_row.append(w)
    if cur_row:
        rows.append(cur_row)
    return rows


def clean_drug_name(parts):
    """Join word parts into a clean drug name."""
    name = " ".join(parts).strip()
    name = re.sub(r"\s+", " ", name)
    if len(name) < 3:
        return ""
    if re.match(r"^(Drug\s+name|DRUG\s+NAME|Tier|Notes|Includes|Cost)", name, re.IGNORECASE):
        return ""
    return name


# ══════════════════════════════════════════════════════════════════════════════
# UHC IFP PDL — dual-column word-position
# Left: drug x<210, tier x~213, notes x~232-310
# Right: drug x 325-480, tier x~490, notes x~510+
# ══════════════════════════════════════════════════════════════════════════════

def parse_uhc_dual_column(pdf_path, issuer_ids, state, start_page=6, end_page=-1):
    """Parse UHC IFP PDL dual-column format."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  UHC dual-col: pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))

        for i in range(start_page, ep):
            words = pdf.pages[i].extract_words(x_tolerance=2, y_tolerance=3)
            if not words:
                continue
            rows = group_words_into_rows(words)

            # Process each row, extracting left and right drug entries
            left_name_parts = []
            left_tier = ""
            left_notes_parts = []
            right_name_parts = []
            right_tier = ""
            right_notes_parts = []

            def flush_left():
                nonlocal left_name_parts, left_tier, left_notes_parts
                if left_name_parts and left_tier:
                    name = clean_drug_name(left_name_parts)
                    if name:
                        tier = TIER_MAP.get(left_tier, left_tier)
                        flags = parse_flags(" ".join(left_notes_parts))
                        records.append(make_record(name, tier, flags, issuer_ids, pdf_path.name, state))
                left_name_parts = []
                left_tier = ""
                left_notes_parts = []

            def flush_right():
                nonlocal right_name_parts, right_tier, right_notes_parts
                if right_name_parts and right_tier:
                    name = clean_drug_name(right_name_parts)
                    if name:
                        tier = TIER_MAP.get(right_tier, right_tier)
                        flags = parse_flags(" ".join(right_notes_parts))
                        records.append(make_record(name, tier, flags, issuer_ids, pdf_path.name, state))
                right_name_parts = []
                right_tier = ""
                right_notes_parts = []

            for row_words in rows:
                # Classify words into left/right columns
                l_name = []
                l_tier_w = None
                l_notes = []
                r_name = []
                r_tier_w = None
                r_notes = []

                for w in row_words:
                    x = w["x0"]
                    txt = w["text"]
                    if x < 210:
                        if TIER_RE.match(txt) and 200 < x < 230:
                            l_tier_w = txt
                        else:
                            l_name.append(txt)
                    elif 210 <= x < 240:
                        if TIER_RE.match(txt):
                            l_tier_w = txt
                        else:
                            l_notes.append(txt)
                    elif 240 <= x < 315:
                        l_notes.append(txt)
                    elif 315 <= x < 480:
                        if TIER_RE.match(txt) and 478 < x < 500:
                            r_tier_w = txt
                        else:
                            r_name.append(txt)
                    elif 480 <= x < 500:
                        if TIER_RE.match(txt):
                            r_tier_w = txt
                        else:
                            r_notes.append(txt)
                    else:
                        r_notes.append(txt)

                # Left column
                if l_tier_w:
                    flush_left()
                    left_name_parts = l_name
                    left_tier = l_tier_w
                    left_notes_parts = l_notes
                else:
                    left_name_parts.extend(l_name)
                    left_notes_parts.extend(l_notes)

                # Right column
                if r_tier_w:
                    flush_right()
                    right_name_parts = r_name
                    right_tier = r_tier_w
                    right_notes_parts = r_notes
                else:
                    right_name_parts.extend(r_name)
                    right_notes_parts.extend(r_notes)

            flush_left()
            flush_right()

    return records


# ══════════════════════════════════════════════════════════════════════════════
# Jefferson PA — word-position, drug x<370, tier x~381, notes x>420
# ══════════════════════════════════════════════════════════════════════════════

def parse_jefferson(pdf_path, issuer_ids, start_page=7, end_page=-1):
    """Parse Jefferson Health Plans IFP formulary."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  Jefferson: pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))

        for i in range(start_page, ep):
            words = pdf.pages[i].extract_words(x_tolerance=2, y_tolerance=3)
            if not words:
                continue
            rows = group_words_into_rows(words)

            cur_name = []
            cur_tier = ""
            cur_notes = []

            def flush():
                nonlocal cur_name, cur_tier, cur_notes
                if cur_name and cur_tier:
                    name = clean_drug_name(cur_name)
                    if name:
                        tier = TIER_MAP.get(cur_tier, cur_tier)
                        flags = parse_flags(" ".join(cur_notes))
                        records.append(make_record(name, tier, flags, issuer_ids, pdf_path.name, "PA"))
                cur_name = []
                cur_tier = ""
                cur_notes = []

            for row_words in rows:
                name_parts = []
                tier_w = None
                notes_parts = []

                for w in row_words:
                    x = w["x0"]
                    txt = w["text"]
                    if 370 < x < 400 and TIER_RE.match(txt):
                        tier_w = txt
                    elif x < 370:
                        name_parts.append(txt)
                    elif x >= 400:
                        notes_parts.append(txt)

                if tier_w:
                    flush()
                    cur_name = name_parts
                    cur_tier = tier_w
                    cur_notes = notes_parts
                else:
                    cur_name.extend(name_parts)
                    cur_notes.extend(notes_parts)

            flush()

    return records


# ══════════════════════════════════════════════════════════════════════════════
# BC Idaho — word-position, drug x<240, brand x~244, tier x~414, notes x~464
# ══════════════════════════════════════════════════════════════════════════════

def parse_bcidaho(pdf_path, issuer_ids, start_page=5, end_page=-1):
    """Parse Blue Cross of Idaho QHP formulary."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  BC Idaho: pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))

        for i in range(start_page, ep):
            words = pdf.pages[i].extract_words(x_tolerance=3, y_tolerance=3)
            if not words:
                continue
            rows = group_words_into_rows(words)

            cur_name = []
            cur_tier = ""
            cur_notes = []

            def flush():
                nonlocal cur_name, cur_tier, cur_notes
                if cur_name and cur_tier:
                    name = clean_drug_name(cur_name)
                    if name:
                        tier = TIER_MAP.get(cur_tier, cur_tier)
                        flags = parse_flags(" ".join(cur_notes))
                        records.append(make_record(name, tier, flags, issuer_ids, pdf_path.name, "ID"))
                cur_name = []
                cur_tier = ""
                cur_notes = []

            for row_words in rows:
                name_parts = []
                tier_w = None
                notes_parts = []

                for w in row_words:
                    x = w["x0"]
                    txt = w["text"]
                    if 400 < x < 430 and TIER_RE.match(txt):
                        tier_w = txt
                    elif x < 240:
                        name_parts.append(txt)
                    elif x >= 450:
                        notes_parts.append(txt)
                    # 240-400 = brand reference column, skip

                if tier_w:
                    flush()
                    cur_name = name_parts
                    cur_tier = tier_w
                    cur_notes = notes_parts
                else:
                    if name_parts:
                        cur_name.extend(name_parts)
                    if notes_parts:
                        cur_notes.extend(notes_parts)

            flush()

    return records


# ══════════════════════════════════════════════════════════════════════════════
# Premera WA — word-position, drug x<320, tier x~333, notes x~393
# ══════════════════════════════════════════════════════════════════════════════

def parse_premera(pdf_path, issuer_ids, start_page=5, end_page=-1):
    """Parse Premera Blue Cross Metallic formulary."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  Premera: pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))

        for i in range(start_page, ep):
            words = pdf.pages[i].extract_words(x_tolerance=2, y_tolerance=3)
            if not words:
                continue
            rows = group_words_into_rows(words)

            cur_name = []
            cur_tier = ""
            cur_notes = []

            def flush():
                nonlocal cur_name, cur_tier, cur_notes
                if cur_name and cur_tier:
                    name = clean_drug_name(cur_name)
                    if name:
                        tier = TIER_MAP.get(cur_tier, cur_tier)
                        flags = parse_flags(" ".join(cur_notes))
                        records.append(make_record(name, tier, flags, issuer_ids, pdf_path.name, "WA"))
                cur_name = []
                cur_tier = ""
                cur_notes = []

            for row_words in rows:
                name_parts = []
                tier_w = None
                notes_parts = []

                for w in row_words:
                    x = w["x0"]
                    txt = w["text"]
                    if 320 < x < 350 and TIER_RE.match(txt):
                        tier_w = txt
                    elif x < 320:
                        name_parts.append(txt)
                    elif x >= 380:
                        notes_parts.append(txt)

                if tier_w:
                    flush()
                    cur_name = name_parts
                    cur_tier = tier_w
                    cur_notes = notes_parts
                else:
                    if name_parts:
                        cur_name.extend(name_parts)
                    if notes_parts:
                        cur_notes.extend(notes_parts)

            flush()

    return records


# ══════════════════════════════════════════════════════════════════════════════
# HPN NV — dual-column like UHC, drug/tier/notes in two columns
# Left: x<290, right: x 305+. Tier = standalone digit. Prefix: g=generic, B=brand, NF
# ══════════════════════════════════════════════════════════════════════════════

def parse_hpn_nv(pdf_path, issuer_ids, start_page=7, end_page=-1):
    """Parse Health Plan of Nevada Essential 4-tier PDL."""
    records = []
    prefix_re = re.compile(r"^[gBH]$|^NF$")

    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  HPN NV: pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))

        for i in range(start_page, ep):
            words = pdf.pages[i].extract_words(x_tolerance=2, y_tolerance=3)
            if not words:
                continue
            rows = group_words_into_rows(words)

            for row_words in rows:
                # Split into left (x<290) and right (x>=305)
                for col_words, col_offset in [(
                    [w for w in row_words if w["x0"] < 290], 0
                ), (
                    [w for w in row_words if w["x0"] >= 305], 305
                )]:
                    if not col_words:
                        continue

                    name_parts = []
                    tier_w = None
                    notes_parts = []

                    for w in col_words:
                        txt = w["text"]
                        if TIER_RE.match(txt):
                            tier_w = txt
                        elif prefix_re.match(txt):
                            # g=generic, B=brand, H=?, NF=non-formulary
                            if txt == "NF":
                                tier_w = "NF"
                        elif txt in ("PA", "QL", "ST", "SP", "LA", "MME", "7D"):
                            notes_parts.append(txt)
                        elif txt.startswith("$"):
                            pass  # cost info, skip
                        else:
                            name_parts.append(txt)

                    if tier_w and name_parts:
                        name = clean_drug_name(name_parts)
                        if name:
                            tier = TIER_MAP.get(tier_w, tier_w)
                            flags = parse_flags(" ".join(notes_parts))
                            records.append(make_record(name, tier, flags, issuer_ids, pdf_path.name, "NV"))

    return records


# ══════════════════════════════════════════════════════════════════════════════
# WellSense MA — needs inspection first
# ══════════════════════════════════════════════════════════════════════════════

def parse_wellsense(pdf_path, issuer_ids, start_page=8, end_page=-1):
    """Parse WellSense Clarity formulary using word positions."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  WellSense: pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))

        # First detect layout from header page
        for i in range(start_page, ep):
            words = pdf.pages[i].extract_words(x_tolerance=2, y_tolerance=3)
            if not words:
                continue
            rows = group_words_into_rows(words)

            cur_name = []
            cur_tier = ""
            cur_notes = []

            def flush():
                nonlocal cur_name, cur_tier, cur_notes
                if cur_name and cur_tier:
                    name = clean_drug_name(cur_name)
                    if name:
                        tier = TIER_MAP.get(cur_tier, cur_tier)
                        flags = parse_flags(" ".join(cur_notes))
                        records.append(make_record(name, tier, flags, issuer_ids, pdf_path.name, "MA"))
                cur_name = []
                cur_tier = ""
                cur_notes = []

            for row_words in rows:
                name_parts = []
                tier_w = None
                notes_parts = []

                for w in row_words:
                    x = w["x0"]
                    txt = w["text"]
                    if TIER_RE.match(txt) and x > 200:
                        tier_w = txt
                    elif x < 250:
                        name_parts.append(txt)
                    else:
                        notes_parts.append(txt)

                if tier_w:
                    flush()
                    cur_name = name_parts
                    cur_tier = tier_w
                    cur_notes = notes_parts
                else:
                    if name_parts:
                        cur_name.extend(name_parts)
                    if notes_parts:
                        cur_notes.extend(notes_parts)

            flush()

    return records


# ══════════════════════════════════════════════════════════════════════════════
# CHPW WA — word-position parser
# ══════════════════════════════════════════════════════════════════════════════

def parse_chpw(pdf_path, issuer_ids, start_page=7, end_page=-1):
    """Parse CHPW Cascade Select formulary."""
    records = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        ep = end_page if end_page > 0 else len(pdf.pages)
        ep = min(ep, len(pdf.pages))
        log.info("  CHPW: pages %d-%d of %d", start_page + 1, ep, len(pdf.pages))

        for i in range(start_page, ep):
            words = pdf.pages[i].extract_words(x_tolerance=2, y_tolerance=3)
            if not words:
                continue
            rows = group_words_into_rows(words)

            cur_name = []
            cur_tier = ""
            cur_notes = []

            def flush():
                nonlocal cur_name, cur_tier, cur_notes
                if cur_name and cur_tier:
                    name = clean_drug_name(cur_name)
                    if name:
                        tier = TIER_MAP.get(cur_tier, cur_tier)
                        flags = parse_flags(" ".join(cur_notes))
                        records.append(make_record(name, tier, flags, issuer_ids, pdf_path.name, "WA"))
                cur_name = []
                cur_tier = ""
                cur_notes = []

            for row_words in rows:
                name_parts = []
                tier_w = None
                notes_parts = []

                for w in row_words:
                    x = w["x0"]
                    txt = w["text"]
                    # Tier is often after the drug name, look for standalone digits
                    if TIER_RE.match(txt) and x > 200:
                        tier_w = txt
                    elif x < 300:
                        name_parts.append(txt)
                    else:
                        notes_parts.append(txt)

                if tier_w:
                    flush()
                    cur_name = name_parts
                    cur_tier = tier_w
                    cur_notes = notes_parts
                else:
                    if name_parts:
                        cur_name.extend(name_parts)
                    if notes_parts:
                        cur_notes.extend(notes_parts)

            flush()

    return records


# ══════════════════════════════════════════════════════════════════════════════
# CARRIER DEFS
# ══════════════════════════════════════════════════════════════════════════════

V2_CARRIERS = {
    "uhc_md": {"state": "MD", "issuer_ids": ["72375"], "issuer_name": "UnitedHealthcare (MD)",
               "pdf": "uhc_md_ifp_pdl_2026.pdf", "parser": "uhc_dual", "start_page": 6},
    "uhc_nj": {"state": "NJ", "issuer_ids": ["37777"], "issuer_name": "UnitedHealthcare (NJ)",
               "pdf": "uhc_nj_ifp_pdl_2026.pdf", "parser": "uhc_dual", "start_page": 6},
    "uhc_ma": {"state": "MA", "issuer_ids": ["31779"], "issuer_name": "UnitedHealthcare (MA)",
               "pdf": "uhc_ma_commercial_pdl_2026.pdf", "parser": "uhc_dual", "start_page": 6},
    "uhc_wa": {"state": "WA", "issuer_ids": ["62650"], "issuer_name": "UnitedHealthcare (WA)",
               "pdf": "uhc_wa_formulary_2026.pdf", "parser": "uhc_dual", "start_page": 6},
    "jefferson_pa": {"state": "PA", "issuer_ids": ["19702", "93909"], "issuer_name": "Jefferson Health Plans (PA)",
                     "pdf": "jefferson_pa_ifp_formulary_2026.pdf", "parser": "jefferson", "start_page": 7},
    "bcidaho": {"state": "ID", "issuer_ids": ["38128"], "issuer_name": "Blue Cross of Idaho",
                "pdf": "bcidaho_qhp_formulary_2026.pdf", "parser": "bcidaho", "start_page": 5},
    "hpn_nv": {"state": "NV", "issuer_ids": ["45142"], "issuer_name": "Health Plan of Nevada",
               "pdf": "hpn_nv_essential_4tier_2026.pdf", "parser": "hpn_nv", "start_page": 7},
    "premera_wa": {"state": "WA", "issuer_ids": ["49831"], "issuer_name": "Premera Blue Cross (WA)",
                   "pdf": "premera_wa_metallic_formulary_2026.pdf", "parser": "premera", "start_page": 5},
    "wellsense_ma": {"state": "MA", "issuer_ids": ["82569"], "issuer_name": "WellSense Health Plan (MA)",
                     "pdf": "wellsense_ma_clarity_formulary_2026.pdf", "parser": "wellsense", "start_page": 8},
    "chpw_wa": {"state": "WA", "issuer_ids": ["18581"], "issuer_name": "Community Health Plan of WA",
                "pdf": "chpw_wa_cascade_select_formulary_2026.pdf", "parser": "chpw", "start_page": 7},
    # LifeWise and Kaiser WA use similar formats to Premera
    "lifewise_wa": {"state": "WA", "issuer_ids": ["38498"], "issuer_name": "LifeWise Health Plan (WA)",
                    "pdf": "lifewise_wa_formulary_2026.pdf", "parser": "premera", "start_page": 5},
    "kaiser_wa": {"state": "WA", "issuer_ids": ["23371"], "issuer_name": "Kaiser Permanente (WA-NW)",
                  "pdf": "kaiser_wa_marketplace_formulary_2026.pdf", "parser": "premera", "start_page": 3},
}


def parse_carrier(key, cdef):
    pdf_path = RAW_DIR / cdef["pdf"]
    if not pdf_path.exists():
        log.warning("  PDF not found: %s", pdf_path)
        return []
    p = cdef["parser"]
    sp = cdef.get("start_page", 0)
    ids = cdef["issuer_ids"]
    state = cdef["state"]

    if p == "uhc_dual":
        return parse_uhc_dual_column(pdf_path, ids, state, sp)
    elif p == "jefferson":
        return parse_jefferson(pdf_path, ids, sp)
    elif p == "bcidaho":
        return parse_bcidaho(pdf_path, ids, sp)
    elif p == "hpn_nv":
        return parse_hpn_nv(pdf_path, ids, sp)
    elif p == "premera":
        return parse_premera(pdf_path, ids, sp)
    elif p == "wellsense":
        return parse_wellsense(pdf_path, ids, sp)
    elif p == "chpw":
        return parse_chpw(pdf_path, ids, sp)
    else:
        log.error("Unknown parser: %s", p)
        return []


def dedupe(records):
    seen = {}
    out = []
    for rec in records:
        key = (rec["drug_name"].lower(), rec["drug_tier"])
        if key in seen:
            idx = seen[key]
            for iid in rec["issuer_ids"]:
                if iid not in out[idx]["issuer_ids"]:
                    out[idx]["issuer_ids"].append(iid)
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


def merge_into_state(state, new_records, carrier_info):
    """Merge new records into existing state file."""
    out_path = OUT_DIR / f"formulary_sbm_{state}.json"
    existing_data = []
    existing_results = []
    if out_path.exists():
        with open(out_path, encoding="utf-8") as f:
            existing = json.load(f)
        existing_data = existing.get("data", [])
        existing_results = existing.get("metadata", {}).get("issuer_results", [])

    new_ids = set()
    for r in new_records:
        new_ids.update(r.get("issuer_ids", []))

    keep = [r for r in existing_data if not any(iid in r.get("issuer_ids", []) for iid in new_ids)]
    combined = keep + new_records
    deduped = dedupe(combined)
    deduped.sort(key=lambda r: r["drug_name"].lower())

    tier_counts = Counter(r["drug_tier"] for r in deduped)
    unique_issuers = {iid for r in deduped for iid in r["issuer_ids"]}

    old_results = [r for r in existing_results
                   if r.get("issuer_id") not in {ci["issuer_id"] for ci in carrier_info}]

    output = {
        "metadata": {
            "source": f"SBM Formulary - {state} (multi-issuer PDF merge)",
            "state_code": state, "plan_year": PLAN_YEAR,
            "issuers_attempted": len(old_results) + len(carrier_info),
            "issuers_successful": len(old_results) + sum(1 for c in carrier_info if c["drug_records"] > 0),
            "raw_records": len(combined), "deduped_records": len(deduped),
            "unique_drug_names": len({r["drug_name"].lower() for r in deduped}),
            "unique_issuers": len(unique_issuers),
            "tier_breakdown": dict(tier_counts),
            "pa_count": sum(1 for r in deduped if r["prior_authorization"]),
            "ql_count": sum(1 for r in deduped if r["quantity_limit"]),
            "st_count": sum(1 for r in deduped if r["step_therapy"]),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "schema_version": "1.0",
            "issuer_results": old_results + carrier_info,
        },
        "data": deduped,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    size_mb = out_path.stat().st_size / (1024 * 1024)
    log.info("  %s: %d records, %d issuers, %.1f MB", state, len(deduped), len(unique_issuers), size_mb)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--carrier", type=str)
    args = parser.parse_args()

    carriers = dict(V2_CARRIERS)
    if args.carrier:
        carriers = {k: v for k, v in carriers.items() if k == args.carrier}

    # Group by state
    states = {}
    for key, cdef in carriers.items():
        st = cdef["state"]
        if st not in states:
            states[st] = {}
        states[st][key] = cdef

    total = 0
    for state in sorted(states.keys()):
        log.info("=" * 50)
        log.info("STATE: %s", state)
        all_records = []
        carrier_info = []

        for key, cdef in states[state].items():
            log.info("[%s] %s", key, cdef["issuer_name"])
            try:
                recs = parse_carrier(key, cdef)
                deduped = dedupe(recs)
                count = len(deduped)
                log.info("  -> %d raw, %d deduped", len(recs), count)
                if count > 0:
                    tc = Counter(r["drug_tier"] for r in deduped)
                    log.info("    Tiers: %s", dict(tc))
                all_records.extend(deduped)
                carrier_info.append({
                    "issuer_id": cdef["issuer_ids"][0], "issuer_name": cdef["issuer_name"],
                    "state_code": state, "source": cdef["pdf"],
                    "status": "success" if count > 0 else "empty",
                    "drug_records": count,
                })
                total += count
            except Exception as e:
                log.error("  FAILED: %s", e)
                carrier_info.append({
                    "issuer_id": cdef["issuer_ids"][0], "issuer_name": cdef["issuer_name"],
                    "state_code": state, "source": cdef["pdf"],
                    "status": "error", "drug_records": 0,
                })

        merge_into_state(state, all_records, carrier_info)

    log.info("=" * 50)
    log.info("V2 COMPLETE: %d total new records", total)


if __name__ == "__main__":
    main()
