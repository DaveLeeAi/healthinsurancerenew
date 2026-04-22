#!/usr/bin/env python3
"""
build_formulary_state_drug_summaries.py
───────────────────────────────────────
Emits one JSON per state+drug pair in FormularyStateDrugSummary format.

Sources:
  1. formulary_intelligence.json (4.5 GB, line-by-line streaming)
  2. formulary_sbm_{STATE}.json per-state SBM files
  3. formulary_enrichment_*.json per-carrier enrichment files
  4. plan_intelligence.json (carrier names + plan counts)
  5. formulary-url-registry-2026.json (carrier name overrides)

Output:  data/formulary-summaries/{STATE_CODE}/{drug-slug}.json

Usage:
  # Ozempic only (test case — validates NC against V79 locked data)
  python scripts/etl/build_formulary_state_drug_summaries.py --drug ozempic

  # Any drug across all 51 jurisdictions
  python scripts/etl/build_formulary_state_drug_summaries.py --drug mounjaro

NC Ozempic V79 locked reference (DO NOT modify to match ETL output):
  plan_count         : 206
  carriers           : BCBS NC 117 | Ambetter 29 | Oscar 22 | Cigna 17 | UHC 13 | AmeriHealth 8
  tier_placement     : Preferred Brand (all 6 carriers)
  pa_required        : True (all 6 carriers)
  cost after ded     : $30–$75 / month
  cost before ded    : $400–$650 / month
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

# ── Paths ──────────────────────────────────────────────────────────────────────
REPO_ROOT       = Path(__file__).resolve().parent.parent.parent
DATA_PROCESSED  = REPO_ROOT / "data" / "processed"
DATA_CONFIG     = REPO_ROOT / "data" / "config"
DATA_SUMMARIES  = REPO_ROOT / "data" / "formulary-summaries"

PLAN_INTEL_FILE      = DATA_PROCESSED / "plan_intelligence.json"
FORMULARY_FILE       = DATA_PROCESSED / "formulary_intelligence.json"
FORMULARY_URL_REG    = DATA_CONFIG    / "formulary-url-registry-2026.json"
SBC_DECODED_FILE     = DATA_PROCESSED / "sbc_decoded.json"

SBM_PATTERN       = re.compile(r"^formulary_sbm_([A-Z]{2})\.json$")
ENRICHMENT_PATTERN = re.compile(r"^formulary_enrichment_.*\.json$", re.IGNORECASE)

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── V79 locked validation target (NC Ozempic) ─────────────────────────────────
# These values come from the locked V79 reference page and must NOT be modified
# to match ETL output.  If ETL output differs, the script reports the discrepancy
# and exits non-zero.  See CLAUDE.md §Authority order #1 and #2.
V79_NC_OZEMPIC: dict[str, Any] = {
    "state_code": "NC",
    "drug_slug":  "ozempic",
    "plan_count": 206,
    "carriers": [
        {"issuer_id": "11512", "name": "Blue Cross and Blue Shield of North Carolina",
         "plan_count": 117, "tier_placement": "preferred-brand", "pa_required": True},
        {"issuer_id": "77264", "name": "Ambetter of North Carolina",
         "plan_count":  29, "tier_placement": "preferred-brand", "pa_required": True},
        {"issuer_id": "69803", "name": "Oscar Health Plan of North Carolina, Inc",
         "plan_count":  22, "tier_placement": "preferred-brand", "pa_required": True},
        {"issuer_id": "73943", "name": "Cigna Healthcare",
         "plan_count":  17, "tier_placement": "preferred-brand", "pa_required": True},
        {"issuer_id": "54332", "name": "UnitedHealthcare",
         "plan_count":  13, "tier_placement": "preferred-brand", "pa_required": True},
        {"issuer_id": "17414", "name": "AmeriHealth Caritas Next",
         "plan_count":   8, "tier_placement": "preferred-brand", "pa_required": True},
    ],
    "cost_range_after_deductible":  {"low": 30,  "high": 75},
    "cost_range_before_deductible": {"low": 400, "high": 650},
}

# ── Tier normalisation ─────────────────────────────────────────────────────────
# Identical to generate_drug_baselines.py — keep in sync if adding new labels.
TIER_NORMALISE: dict[str, str] = {
    # Generic
    "generic": "generic", "generics": "generic",
    "tier-1": "generic", "tier-one": "generic", "tier1": "generic",
    "tier-one-a": "generic", "tier-one-b": "generic",
    "preferred-generic": "generic", "preferred-generics": "generic",
    "preferred-generic-drugs": "generic", "preferredgeneric": "generic",
    "non-preferred-generic": "generic", "non-preferred-generics": "generic",
    "nonpreferredgeneric": "generic",
    "high-cost-generic": "generic", "low-cost-generic": "generic",
    "low-cost-share": "generic", "lower-cost-share": "generic",
    "two-preferred-generic": "generic",

    # Preferred brand
    "preferred-brand": "preferred-brand", "preferred-brands": "preferred-brand",
    "preferred-brand-drugs": "preferred-brand", "brand-preferred": "preferred-brand",
    "preferredbrand": "preferred-brand",
    "tier-2": "preferred-brand", "tier-two": "preferred-brand", "tier2": "preferred-brand",
    "three-preferred-brand": "preferred-brand",
    "preferred": "preferred-brand", "brand": "preferred-brand",
    "moderate-cost-share": "preferred-brand",
    "generic-brand": "preferred-brand",
    "generic-preferred-brand": "preferred-brand",
    "non-preferred-generic-and-preferred-brand": "preferred-brand",
    "non-preferred-generic-preferred-brand": "preferred-brand",
    "formulary-brands": "preferred-brand",

    # Non-preferred brand
    "non-preferred-brand": "non-preferred-brand",
    "non-preferred-brands": "non-preferred-brand",
    "non-preferred-brand-drugs": "non-preferred-brand",
    "brand-non-preferred": "non-preferred-brand",
    "non-preferred": "non-preferred-brand", "nonpreferred": "non-preferred-brand",
    "nonpreferred-brand": "non-preferred-brand", "nonpreferredbrand": "non-preferred-brand",
    "nonpreferred-drugs": "non-preferred-brand",
    "tier-3": "non-preferred-brand", "tier-three": "non-preferred-brand", "tier3": "non-preferred-brand",
    "four-non-preferred-brand-and-generic": "non-preferred-brand",
    "non-preferred-generic-non-preferred-brand": "non-preferred-brand",
    "non-formulary": "non-preferred-brand", "non-formulary-drugs": "non-preferred-brand",

    # Specialty
    "specialty": "specialty", "specialty-drug": "specialty", "specialty-drugs": "specialty",
    "specialtydrugs": "specialty", "specialty-products": "specialty",
    "specialty-tier": "specialty", "specialty-high": "specialty",
    "preferred-specialty": "specialty", "non-preferred-specialty": "specialty",
    "nonpreferred-specialty": "specialty",
    "tier-4": "specialty", "tier-four": "specialty", "tier4": "specialty",
    "tier-5": "specialty", "tier-five": "specialty", "tier5": "specialty",
    "tier-6": "specialty", "tier-six": "specialty", "tier6": "specialty",
    "tier-seven": "specialty", "tier-7": "specialty", "tier7": "specialty",
    "medical-service-drugs": "specialty", "medical-service-drug": "specialty",
    "medical-service": "specialty", "medical-benefit": "specialty",
    "highest-cost-share": "specialty",

    # Preventive
    "preventive": "preventive", "preventive-drugs": "preventive",
    "prevent-drugs": "preventive", "preventive-care": "preventive",
    "preventive-generic": "preventive", "preventative": "preventive",
    "aca-preventive": "preventive", "aca-preventive-drugs": "preventive",
    "zero-cost-share-preventive": "preventive",
    "zero-cost-share-preventive-drugs": "preventive",
    "zero-cost-preventive": "preventive", "zero-cost-preventive-drugs": "preventive",
    "insulin-discount": "preventive",

    # Unknown
    "unknown": "unknown", "": "unknown",
    "formulary-drugs": "unknown", "ancillary": "unknown",
    "diabetic-supplies": "unknown",
}

# Per-carrier numeric-tier→canonical mappings for enrichment files that use
# integer tier labels.  Key: issuer_id (numeric string).
# Rule: maps int tier → canonical tier string for that carrier's formulary.
# When a carrier has multiple formulary types (4T, 5T), we take the most
# consumer-favorable tier across formulations (lowest cost tier first).
CARRIER_TIER_MAP: dict[str, dict[int, str]] = {
    # BCBS NC 4-tier (4T): 1=generic, 2=preferred-brand, 3=non-preferred-brand, 4=specialty
    "11512": {1: "generic", 2: "preferred-brand", 3: "non-preferred-brand", 4: "specialty"},
    # BCBS NC 5-tier (5T) uses same structure but with 5 tiers
    # Tier 3 on 5T = non-preferred-brand, but we take the 4T result (preferred-brand)
    # when resolving across formulary types — handled in _resolve_enrichment_tier().
}

# Manual mapping from non-numeric enrichment issuer_id labels → numeric HIOS prefix.
# Only needed for enrichment files that don't use a plain HIOS prefix as issuer_id.
ENRICHMENT_ID_OVERRIDE: dict[str, str] = {
    "cigna_nc": "73943",
    "cigna_tn": "69443",
    "cigna_va": "25485",
    "cigna_fl": "31260",
    "cigna_in": "72850",
    "cigna_ms": "97560",
    "cigna_az": "86584",
    "cigna_co": "34762",
    "cigna_multi": None,    # multi-state; skip — individual state files take priority
    "cigna_ga_value": "15105",
    "mhcoop": None,         # Mountain Health CO-OP — resolve by state in enrichment metadata
}

# ── Drug name normalisation (from generate_drug_baselines.py) ──────────────────
_DOSAGE_FORM_WORDS = frozenset({
    "inj", "sopn", "subcutaneous", "pen", "solution", "tablet", "tab",
    "capsule", "cap", "cream", "ointment", "susp", "oral", "injection",
    "injector", "pen-injector", "vial", "syringe", "patch", "gel",
    "spray", "drops", "powder", "chewable", "extended-release", "er", "suspension",
    "dr", "sr", "hfa", "inhaler", "nebulizer", "ophthalmic", "otic",
    "nasal", "rectal", "topical", "transdermal", "suppository",
    "system", "device", "kit", "pack", "blister",
    "mg", "mcg", "ml", "mg/ml", "unit", "units", "dose", "gm", "g",
})

_DOSAGE_PATTERN = re.compile(
    r"^\d"
    r"|^[\d.]+\s*(mg|mcg|ml|%|unit)"
    r"|/\d"
)

_SALT_SUFFIXES = [
    "hydrochloride", "hydrobromide",
    "hcl er tb24", "hcl er cp24", "hcl er", "hcl tb24", "hcl tabs", "hcl",
    "sulfate er cp24", "sulfate er", "sulfate soln", "sulfate tabs", "sulfate",
    "sodium", "potassium", "calcium", "magnesium",
    "mesylate", "maleate", "fumarate", "tartrate", "besylate", "tosylate",
    "acetate", "succinate", "phosphate", "citrate", "bromide", "nitrate",
    "propanediol", "disoproxil", "alafenamide",
    "sol", "soln", "tabs",
]

_FORM_SUFFIXES = ["er", "sr", "xr", "xl", "dr", "ec", "cr", "la", "hfa", "cp24", "tb24"]

_COMBO_NORMALIZE = re.compile(r"\s*/\s*|\s*-\s+|\s+-\s*")

_ABBREV_EXPAND: dict[str, str] = {
    "dextroamphet": "dextroamphetamine",
    "metform": "metformin",
}

_SLUG_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_SLUG_MULTI_HYPHEN = re.compile(r"-+")


def normalise_drug_name(name: str) -> str:
    raw = name.strip()
    if not raw:
        return ""
    bracket = re.search(r"\[([^\]]+)\]", raw)
    if bracket:
        return bracket.group(1).strip().lower()
    low = raw.lower().strip()
    if re.match(r"^\d", low):
        tokens = low.replace(",", " ").split()
        drug_tokens: list[str] = []
        for tok in reversed(tokens):
            tok_clean = tok.strip(".,;:-")
            if (_DOSAGE_PATTERN.match(tok_clean)
                    or tok_clean in _DOSAGE_FORM_WORDS
                    or re.match(r"^\d+\.?\d*$", tok_clean)):
                break
            drug_tokens.append(tok_clean)
        if drug_tokens:
            drug_tokens.reverse()
            result = " ".join(drug_tokens)
            if result and not re.match(r"^[\d.]+$", result):
                return result
        return low
    # Handle "BRAND - generic" (space-dash-space) and "BRAND- generic" (dash-space, no leading space).
    # Both are brand-generic separator patterns used in enrichment files (e.g. BCBS NC PDF parse).
    # Combo drug names like "amphetamine-dextroamphetamine" never have a space AFTER the hyphen,
    # so matching on "-\s+" is safe: it only fires on the brand-generic separator.
    sep_match = re.search(r"\s*-\s+(?=[a-z])", low)
    if sep_match and sep_match.start() > 0:
        candidate = low[:sep_match.start()].strip().rstrip("-")
        # Reject if the candidate looks like a dosage value (e.g. "0.25") rather than a drug name
        if candidate and not _DOSAGE_PATTERN.match(candidate):
            low = candidate
    if " - " in low:
        low = low.split(" - ", 1)[0].strip()
    low = re.sub(r"\s*\([^)]*\)", "", low)
    low = re.split(
        r"\s+(?=\d)|"
        r"\s+(?=inj\b)|\s+(?=sopn\b)|\s+(?=subcutaneous\b)|\s+(?=pen\b)|"
        r"\s+(?=solution\b)|\s+(?=tablet\b)|\s+(?=tab\b)|\s+(?=capsule\b)|"
        r"\s+(?=cap\b)|\s+(?=cream\b)|\s+(?=ointment\b)|\s+(?=susp\b)|"
        r"\s+(?=oral\b)|\s+(?=mg\b)|\s+(?=ml\b)|\s+(?=mcg\b)",
        low, maxsplit=1,
    )[0]
    return re.sub(r"\s+", " ", low).strip().rstrip("- ,;") or name.strip().lower()


def canonicalize_base_drug(name: str) -> str:
    s = name.strip()
    if not s:
        return s
    s = s.replace("\\/", "/").replace("\\", "")
    s = _COMBO_NORMALIZE.sub("-", s)
    for abbrev, full in _ABBREV_EXPAND.items():
        s = re.sub(rf"\b{re.escape(abbrev)}\b", full, s)
    for suffix in _SALT_SUFFIXES:
        if s.endswith(" " + suffix):
            s = s[: -(len(suffix) + 1)].rstrip(" -")
        elif s.endswith("-" + suffix):
            s = s[: -(len(suffix) + 1)].rstrip(" -")
    tokens = s.split()
    while tokens and tokens[-1] in _FORM_SUFFIXES:
        tokens.pop()
    s = " ".join(tokens) if tokens else s
    s = s.strip(" -,;")
    _REJECT = _DOSAGE_FORM_WORDS | {
        "extended", "release", "delayed", "immediate", "modified",
        "oral", "topical", "vaginal", "ophthalmic", "intravenous",
        "tablet", "capsule", "injection", "solution", "suspension",
        "agents", "disorders", "drugs", "products", "preparations",
        "concentrate", "liquid", "elixir", "lotion", "emulsion",
        "aerosol", "foam", "film", "granules", "lozenge", "troche",
        "enema", "douche", "irrigant", "implant", "insert",
    }
    if s in _REJECT:
        return ""
    return s if s else name.strip()


def drug_name_to_slug(name: str) -> str:
    s = name.strip().strip('"').lower()
    if not s:
        return ""
    s = _SLUG_NON_ALNUM.sub("-", s)
    s = _SLUG_MULTI_HYPHEN.sub("-", s)
    return s.strip("-")


def normalise_tier(raw: str | None) -> str:
    if not raw:
        return "unknown"
    key = str(raw).strip().lower().replace("_", "-").replace(" ", "-")
    while "--" in key:
        key = key.replace("--", "-")
    return TIER_NORMALISE.get(key, "unknown")


# ── Per-carrier drug accumulator ───────────────────────────────────────────────

class CarrierDrugAccum:
    """Accumulates drug records for one (issuer_id, state_code) pair."""

    __slots__ = ("tier_counts", "pa_count", "ql_count", "st_count",
                 "record_count", "sources")

    def __init__(self) -> None:
        self.tier_counts: dict[str, int] = defaultdict(int)
        self.pa_count: int = 0
        self.ql_count: int = 0
        self.st_count: int = 0
        self.record_count: int = 0
        self.sources: set[str] = set()

    def add(self, tier: str | None, pa: bool, ql: bool, st: bool,
            source: str = "ffe") -> None:
        canonical = normalise_tier(tier)
        self.tier_counts[canonical] += 1
        if pa:
            self.pa_count += 1
        if ql:
            self.ql_count += 1
        if st:
            self.st_count += 1
        self.record_count += 1
        self.sources.add(source)

    def dominant_tier(self) -> str:
        """Most common canonical tier, excluding 'unknown' if any real tier exists."""
        real = {t: c for t, c in self.tier_counts.items() if t != "unknown"}
        pool = real if real else self.tier_counts
        if not pool:
            return "unknown"
        return max(pool, key=lambda k: pool[k])

    def pa_majority(self) -> bool:
        return self.pa_count >= (self.record_count / 2) if self.record_count else False

    def ql_majority(self) -> bool:
        return self.ql_count >= (self.record_count / 2) if self.record_count else False

    def st_majority(self) -> bool:
        return self.st_count >= (self.record_count / 2) if self.record_count else False


# ── Plan map ───────────────────────────────────────────────────────────────────

def build_plan_map() -> dict[str, dict[str, dict]]:
    """
    Returns: {issuer_id: {state_code: {"name": str, "plan_ids": set[str]}}}
    Loads plan_intelligence.json.
    """
    log.info("Building plan map from %s …", PLAN_INTEL_FILE.name)
    if not PLAN_INTEL_FILE.exists():
        log.error("plan_intelligence.json not found")
        sys.exit(1)

    plan_map: dict[str, dict[str, dict]] = defaultdict(lambda: defaultdict(
        lambda: {"name": "", "plan_ids": set()}
    ))

    with PLAN_INTEL_FILE.open("r", encoding="utf-8") as fh:
        pi = json.load(fh)

    records = pi.get("data", pi) if isinstance(pi, dict) else pi
    for plan in records:
        iid   = str(plan.get("issuer_id", "")).strip()
        state = (plan.get("state_code") or "").upper().strip()
        pid   = str(plan.get("plan_id", "")).strip()
        name  = plan.get("issuer_name", "")
        if iid and state and len(state) == 2:
            entry = plan_map[iid][state]
            if not entry["name"] and name:
                entry["name"] = name
            if pid:
                entry["plan_ids"].add(pid)

    total_issuers = len(plan_map)
    total_states  = sum(len(v) for v in plan_map.values())
    log.info("  %d issuers, %d state-issuer pairs loaded", total_issuers, total_states)
    return plan_map


# ── Issuer → state map ────────────────────────────────────────────────────────

def build_issuer_state_map(plan_map: dict) -> dict[str, set[str]]:
    """
    Returns {issuer_id: set_of_state_codes} merged from plan_intelligence +
    formulary URL registry (same two-source approach as generate_drug_baselines.py).
    """
    issuer_map: dict[str, set[str]] = {}

    for iid, states in plan_map.items():
        issuer_map.setdefault(iid, set()).update(states.keys())

    if FORMULARY_URL_REG.exists():
        with FORMULARY_URL_REG.open("r", encoding="utf-8") as fh:
            registry = json.load(fh)

        def _walk(obj: Any, sc: str) -> None:
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if isinstance(v, str) and v.isdigit() and 4 <= len(v) <= 6:
                        issuer_map.setdefault(v, set()).add(sc)
                    elif isinstance(v, (dict, list)):
                        _walk(v, sc)
            elif isinstance(obj, list):
                for item in obj:
                    _walk(item, sc)

        for sc, sd in registry.get("states", {}).items():
            sc_up = sc.upper().strip()
            if len(sc_up) == 2:
                for carrier in sd.get("carriers", []):
                    _walk(carrier, sc_up)

    log.info("  %d issuers in issuer→state map", len(issuer_map))
    return issuer_map


# ── Enrichment registry ────────────────────────────────────────────────────────

def _resolve_enrichment_tier_numeric(
    issuer_id: str,
    records: list[dict],
) -> str:
    """
    For enrichment files that use integer tier labels, return the most
    consumer-favorable canonical tier seen across all formulary_type variants.

    For BCBS NC (11512): tier map defined in CARRIER_TIER_MAP.
    For others with integer tiers: use an approximation based on the lowest
    tier number seen (lower = more favorable = cheaper).
    """
    tier_map = CARRIER_TIER_MAP.get(issuer_id, {})

    canonical_tiers: list[str] = []
    for rec in records:
        raw_tier = rec.get("drug_tier")
        if isinstance(raw_tier, int):
            if tier_map:
                ct = tier_map.get(raw_tier, "unknown")
            else:
                # Generic fallback: 1=generic, 2=preferred-brand, 3=non-preferred-brand, 4+=specialty
                ct = {1: "generic", 2: "preferred-brand", 3: "non-preferred-brand"}.get(
                    raw_tier, "specialty" if raw_tier >= 4 else "unknown"
                )
            canonical_tiers.append(ct)
        elif isinstance(raw_tier, str):
            canonical_tiers.append(normalise_tier(raw_tier))

    if not canonical_tiers:
        return "unknown"

    # Tier priority: generic > preferred-brand > non-preferred-brand > specialty
    _TIER_RANK = {"generic": 0, "preferred-brand": 1, "non-preferred-brand": 2,
                  "specialty": 3, "preventive": 0, "unknown": 99}
    return min(canonical_tiers, key=lambda t: _TIER_RANK.get(t, 99))


def build_enrichment_registry(
    drug_slug: str,
    plan_map: dict,
) -> dict[tuple[str, str], dict]:
    """
    Scan all formulary_enrichment_*.json files.  For each file, find records
    matching drug_slug and return a mapping of (issuer_id, state_code) →
    enrichment result dict with keys: tier_placement, pa_required,
    quantity_limits, step_therapy, sources.

    enrichment data is authoritative over FFE for carriers that have it
    (primarily PDF-sourced carriers like BCBS NC that are not in CMS MR-PUF).
    """
    log.info("Building enrichment registry for drug '%s' …", drug_slug)

    # Build a name→issuer_id resolver from plan_map for non-numeric enrichment IDs
    name_to_iid: dict[str, str] = {}
    for iid, states in plan_map.items():
        for state, info in states.items():
            name = info.get("name", "").lower()
            if name:
                name_to_iid[name] = iid

    registry: dict[tuple[str, str], dict] = {}

    for fpath in sorted(DATA_PROCESSED.iterdir()):
        if not ENRICHMENT_PATTERN.match(fpath.name):
            continue
        try:
            with fpath.open("r", encoding="utf-8", errors="replace") as fh:
                obj = json.load(fh)
        except Exception as exc:
            log.warning("  Skip %s: %s", fpath.name, exc)
            continue

        meta   = obj.get("metadata", {})
        data   = obj.get("data", [])
        raw_id = str(meta.get("issuer_id", "")).strip()
        state  = (meta.get("state") or meta.get("state_code") or "").upper().strip()

        if not state or len(state) != 2:
            continue

        # Resolve numeric issuer_id
        issuer_id = ENRICHMENT_ID_OVERRIDE.get(raw_id, raw_id)
        if issuer_id is None:
            continue  # explicitly skipped (multi-state files handled elsewhere)

        # If still non-numeric, try name-based resolution
        if not issuer_id.isdigit():
            carrier_label = (
                meta.get("issuer_name") or meta.get("carrier_label") or ""
            ).lower()
            # Fuzzy: find the plan_map entry whose name best matches
            for plan_name, piid in name_to_iid.items():
                # Both must be in the same state
                if state in plan_map.get(piid, {}):
                    # Simple substring match on first word of carrier name
                    brand = carrier_label.split()[0] if carrier_label.split() else ""
                    if brand and brand in plan_name:
                        issuer_id = piid
                        break
            if not issuer_id.isdigit():
                log.debug("  Cannot resolve issuer_id '%s' in %s — skip",
                          raw_id, fpath.name)
                continue

        # Find drug records matching the slug
        matching: list[dict] = []
        for rec in data:
            raw_name = rec.get("drug_name") or rec.get("name") or ""
            canonical = canonicalize_base_drug(normalise_drug_name(raw_name))
            if drug_name_to_slug(canonical) == drug_slug:
                matching.append(rec)

        if not matching:
            continue

        pa_count = sum(1 for r in matching if r.get("prior_authorization"))
        ql_count = sum(1 for r in matching if r.get("quantity_limit") or r.get("ql"))
        st_count = sum(1 for r in matching if r.get("step_therapy") or r.get("st"))
        n = len(matching)

        # Determine canonical tier — handle integer tiers for enrichment files
        first_tier = matching[0].get("drug_tier")
        if isinstance(first_tier, int) or (isinstance(first_tier, str) and first_tier.isdigit()):
            tier = _resolve_enrichment_tier_numeric(issuer_id, matching)
        else:
            # String tiers — find dominant canonical
            tiers = [normalise_tier(r.get("drug_tier")) for r in matching]
            real = [t for t in tiers if t != "unknown"]
            tier = max(set(real), key=real.count) if real else "unknown"

        key = (issuer_id, state)
        registry[key] = {
            "tier_placement":  tier,
            "pa_required":     pa_count >= (n / 2),
            "quantity_limits": ql_count >= (n / 2),
            "step_therapy":    st_count >= (n / 2),
            "record_count":    n,
            "source_file":     fpath.name,
        }
        log.info("  Enrichment: %s → %s / %s  tier=%s pa=%s ql=%s records=%d",
                 fpath.name, issuer_id, state, tier,
                 registry[key]["pa_required"],
                 registry[key]["quantity_limits"], n)

    log.info("Enrichment registry: %d carrier+state entries", len(registry))
    return registry


# ── SBC cost-range lookup ──────────────────────────────────────────────────────

def build_sbc_cost_ranges(state: str) -> dict[str, dict | None]:
    """
    Try to derive preferred-brand drug copay ranges for a state from
    sbc_decoded.json cost_sharing_grid.

    Returns {"after_deductible": {low, high} | None, "before_deductible": {low, high} | None}
    """
    if not SBC_DECODED_FILE.exists():
        return {"after_deductible": None, "before_deductible": None}

    try:
        with SBC_DECODED_FILE.open("r", encoding="utf-8") as fh:
            sbc = json.load(fh)
        records = sbc.get("data", sbc) if isinstance(sbc, dict) else sbc
    except Exception as exc:
        log.warning("  sbc_decoded.json load failed: %s", exc)
        return {"after_deductible": None, "before_deductible": None}

    after_vals:  list[float] = []
    before_vals: list[float] = []

    for rec in records:
        if (rec.get("state_code") or "").upper() != state:
            continue
        grid = rec.get("cost_sharing_grid") or {}
        # BenCS PUF field names for preferred brand tier drug copay
        for key in (
            "preferred_brand_after_deductible",
            "tier2_drug_copay_after_deductible",
            "brand_preferred_after_deductible",
        ):
            v = grid.get(key)
            if isinstance(v, (int, float)) and v >= 0:
                after_vals.append(float(v))
        for key in (
            "preferred_brand_before_deductible",
            "tier2_drug_copay_before_deductible",
            "brand_preferred_before_deductible",
            "preferred_brand_deductible_cost",
        ):
            v = grid.get(key)
            if isinstance(v, (int, float)) and v >= 0:
                before_vals.append(float(v))

    def _range(vals: list[float]) -> dict | None:
        if not vals:
            return None
        return {"low": int(min(vals)), "high": int(max(vals))}

    return {
        "after_deductible":  _range(after_vals),
        "before_deductible": _range(before_vals),
    }


# ── Stream FFE records ─────────────────────────────────────────────────────────

def stream_ffe_for_drug(
    drug_slug: str,
    issuer_state_map: dict[str, set[str]],
    accums: dict[tuple[str, str], CarrierDrugAccum],
) -> tuple[int, set[tuple[str, str]]]:
    """
    Stream formulary_intelligence.json line-by-line, collect records for
    drug_slug into accums[(issuer_id, state_code)].
    Returns (match_count, ffe_present_keys) where ffe_present_keys is the
    set of (issuer_id, state_code) pairs that received at least one FFE record.
    This set is used by apply_enrichment_overrides to protect FFE tiers from
    being overwritten by carrier-specific enrichment tier numbering.
    """
    ffe_present_keys: set[tuple[str, str]] = set()

    if not FORMULARY_FILE.exists():
        log.warning("formulary_intelligence.json not found — skipping FFE")
        return 0, ffe_present_keys

    log.info("Streaming FFE: %s  drug='%s' …", FORMULARY_FILE.name, drug_slug)
    count = 0
    match_count = 0
    t0 = time.time()

    with FORMULARY_FILE.open("r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line or line in ("{", "}", "]", "]}"):
                continue
            if line.startswith('{"metadata"'):
                continue
            if line.endswith(","):
                line = line[:-1]
            if not line.startswith("{"):
                continue

            count += 1

            # Fast pre-filter: skip lines that definitely don't match the slug
            # (avoids JSON parse cost on ~14M unrelated records)
            if drug_slug not in line.lower():
                continue

            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue

            raw_name   = rec.get("drug_name") or ""
            canonical  = canonicalize_base_drug(normalise_drug_name(raw_name))
            rec_slug   = drug_name_to_slug(canonical)
            if rec_slug != drug_slug:
                continue

            tier       = rec.get("drug_tier")
            pa         = bool(rec.get("prior_authorization"))
            ql         = bool(rec.get("quantity_limit"))
            st         = bool(rec.get("step_therapy"))
            issuer_ids = [str(i).strip() for i in (rec.get("issuer_ids") or [])]

            for iid in issuer_ids:
                states = issuer_state_map.get(iid, set())
                for state in states:
                    key = (iid, state)
                    accums[key].add(tier, pa, ql, st, source="ffe")
                    ffe_present_keys.add(key)
                    match_count += 1

            if count % 2_000_000 == 0:
                log.info("  FFE: %dM lines scanned, %d drug matches so far (%.0fs)",
                         count // 1_000_000, match_count, time.time() - t0)

    log.info("FFE complete: %d lines scanned, %d drug-carrier-state pairs in %.0fs",
             count, match_count, time.time() - t0)
    return match_count, ffe_present_keys


# ── SBM files ─────────────────────────────────────────────────────────────────

def process_sbm_for_drug(
    drug_slug: str,
    accums: dict[tuple[str, str], CarrierDrugAccum],
    plan_map: dict,
) -> int:
    """
    Read all formulary_sbm_{STATE}.json files, find records matching drug_slug,
    accumulate into accums[(issuer_id, state)].

    SBM records are drug-level (not plan-level) with carrier metadata in the
    file's metadata.carriers list.  We attribute the record to the carrier's
    issuer_id if resolvable.
    """
    total = 0
    for fpath in sorted(DATA_PROCESSED.iterdir()):
        m = SBM_PATTERN.match(fpath.name)
        if not m:
            continue
        state = m.group(1).upper()

        try:
            with fpath.open("r", encoding="utf-8") as fh:
                obj = json.load(fh)
        except Exception as exc:
            log.warning("  SBM %s: load failed — %s", fpath.name, exc)
            continue

        meta    = obj.get("metadata", {})
        data    = obj.get("data", [])
        carriers = meta.get("carriers", [])

        # Build a carrier label → issuer_id map from the SBM metadata
        sbm_carrier_iids: list[str] = []
        for c in carriers:
            iid = str(c.get("issuer_id", "")).strip()
            if iid.isdigit():
                sbm_carrier_iids.append(iid)

        matched_in_file = 0
        for rec in data:
            raw_name  = rec.get("drug_name") or rec.get("name") or ""
            canonical = canonicalize_base_drug(normalise_drug_name(raw_name))
            if drug_name_to_slug(canonical) != drug_slug:
                continue

            tier = rec.get("drug_tier") or rec.get("tier")
            pa   = bool(rec.get("prior_authorization") or rec.get("pa"))
            ql   = bool(rec.get("quantity_limit")      or rec.get("ql"))
            st   = bool(rec.get("step_therapy")        or rec.get("st"))

            # Try issuer_ids on the record first, then fall back to file-level carriers
            rec_iids = [str(i).strip() for i in (rec.get("issuer_ids") or [])
                        if str(i).strip().isdigit()]
            target_iids = rec_iids if rec_iids else sbm_carrier_iids

            for iid in target_iids:
                # Only add if this issuer is known to operate in this state
                if iid in plan_map and state in plan_map[iid]:
                    accums[(iid, state)].add(tier, pa, ql, st, source="sbm")
                    matched_in_file += 1

        if matched_in_file:
            log.info("  SBM %s: %d drug-carrier records added", state, matched_in_file)
        total += matched_in_file

    log.info("SBM processing complete: %d drug-carrier-state pairs added", total)
    return total


# ── Apply enrichment overrides ─────────────────────────────────────────────────

def apply_enrichment_overrides(
    accums: dict[tuple[str, str], CarrierDrugAccum],
    enrichment: dict[tuple[str, str], dict],
    ffe_present_keys: set[tuple[str, str]],
) -> None:
    """
    Apply enrichment data to accumulators.

    Tier-override rule (critical):
      - Carriers NOT in FFE (e.g. BCBS NC, PDF-only): enrichment tier is authoritative.
      - Carriers WITH FFE data: keep the CMS-standard tier from FFE. Enrichment
        files that use carrier-specific tier numbering (e.g. Cigna TIER-3 in a
        5-tier plan = preferred-brand, but TIER_NORMALISE maps tier-3 to
        non-preferred-brand) would produce the wrong canonical tier if applied.
        FFE uses CMS-standard labels (PREFERRED-BRAND, etc.) and is always correct.

    PA/QL/ST override: always applied from enrichment when present, because PDF
    formularies have explicit restriction annotations that FFE bulk data may blur.
    """
    for key, edata in enrichment.items():
        accum = accums[key]
        n = edata["record_count"]

        # Ensure record_count is set first so pa/ql/st majority() calls work correctly
        if accum.record_count == 0:
            accum.record_count = n

        accum.sources.add(f"enrichment:{edata['source_file']}")

        # Tier override: only for carriers without FFE data
        if key not in ffe_present_keys:
            canon_tier = edata["tier_placement"]
            if canon_tier != "unknown":
                accum.tier_counts.clear()
                accum.tier_counts[canon_tier] = 9999

        # PA/QL/ST: always override from enrichment (PDF annotations are authoritative)
        target = accum.record_count  # use updated record_count as ceiling
        accum.pa_count = target if edata["pa_required"]     else 0
        accum.ql_count = target if edata["quantity_limits"] else 0
        accum.st_count = target if edata["step_therapy"]    else 0

    log.info("Enrichment overrides applied to %d carrier-state pairs", len(enrichment))


# ── Build state summary ────────────────────────────────────────────────────────

def build_state_summary(
    state: str,
    drug_slug: str,
    accums: dict[tuple[str, str], CarrierDrugAccum],
    plan_map: dict,
    cost_ranges: dict,
) -> dict | None:
    """
    Build a FormularyStateDrugSummary dict for one state.
    Returns None if no carriers cover the drug in this state.
    """
    # Find all carriers in this state that have drug data
    state_entries = {
        iid: accum
        for (iid, sc), accum in accums.items()
        if sc == state and accum.record_count > 0
    }

    if not state_entries:
        return None

    carriers = []
    total_plan_count = 0
    all_sources: set[str] = set()

    for iid, accum in state_entries.items():
        state_plan_info = plan_map.get(iid, {}).get(state, {})
        carrier_plan_ids = state_plan_info.get("plan_ids", set())
        carrier_plan_count = len(carrier_plan_ids)
        carrier_name = state_plan_info.get("name", f"Issuer {iid}")

        if carrier_plan_count == 0:
            # Issuer has enrichment data but no plans in plan_intelligence — skip
            log.debug("  %s/%s: no plans in plan_intelligence — skipping", state, iid)
            continue

        tier = accum.dominant_tier()
        carrier_rec = {
            "issuer_id":       iid,
            "name":            carrier_name,
            "plan_count":      carrier_plan_count,
            "tier_placement":  tier,
            "pa_required":     accum.pa_majority(),
            "quantity_limits": accum.ql_majority(),
            "step_therapy":    accum.st_majority(),
            "data_record_count": accum.record_count,
        }
        carriers.append(carrier_rec)
        total_plan_count += carrier_plan_count
        all_sources.update(accum.sources)

    if not carriers:
        return None

    # Sort carriers by plan_count descending (matches V79 table order)
    carriers.sort(key=lambda c: c["plan_count"], reverse=True)

    return {
        "state_code":   state,
        "drug_slug":    drug_slug,
        "plan_count":   total_plan_count,
        "carriers":     carriers,
        "cost_range_after_deductible":  cost_ranges.get("after_deductible"),
        "cost_range_before_deductible": cost_ranges.get("before_deductible"),
        "data_sources": sorted(all_sources),
    }


# ── NC Ozempic validation ──────────────────────────────────────────────────────

def validate_nc_ozempic(summary: dict) -> list[str]:
    """
    Compare ETL summary for NC Ozempic against V79 locked data.
    Returns list of discrepancy strings (empty = all match).

    NEVER modifies V79_NC_OZEMPIC.  All discrepancies are reported as ETL gaps.
    """
    ref = V79_NC_OZEMPIC
    discrepancies: list[str] = []

    # plan_count
    if summary["plan_count"] != ref["plan_count"]:
        discrepancies.append(
            f"plan_count: ETL={summary['plan_count']}  V79={ref['plan_count']}"
        )

    # carriers — check count, plan_counts, tiers, PA
    ref_carriers = {c["issuer_id"]: c for c in ref["carriers"]}
    etl_carriers = {c["issuer_id"]: c for c in summary.get("carriers", [])}

    for iid, ref_c in ref_carriers.items():
        if iid not in etl_carriers:
            discrepancies.append(
                f"carrier {iid} ({ref_c['name']}): MISSING from ETL output"
            )
            continue
        etl_c = etl_carriers[iid]
        if etl_c["plan_count"] != ref_c["plan_count"]:
            discrepancies.append(
                f"carrier {iid} plan_count: ETL={etl_c['plan_count']}  V79={ref_c['plan_count']}"
            )
        if etl_c["tier_placement"] != ref_c["tier_placement"]:
            discrepancies.append(
                f"carrier {iid} tier_placement: ETL='{etl_c['tier_placement']}'  V79='{ref_c['tier_placement']}'"
            )
        if etl_c["pa_required"] != ref_c["pa_required"]:
            discrepancies.append(
                f"carrier {iid} pa_required: ETL={etl_c['pa_required']}  V79={ref_c['pa_required']}"
            )

    for iid in etl_carriers:
        if iid not in ref_carriers:
            discrepancies.append(
                f"carrier {iid} ({etl_carriers[iid]['name']}): EXTRA in ETL, not in V79"
            )

    # cost ranges — only report if ETL produced a value (null = data gap, not a mismatch)
    for field, ref_key in [
        ("cost_range_after_deductible",  "cost_range_after_deductible"),
        ("cost_range_before_deductible", "cost_range_before_deductible"),
    ]:
        etl_val = summary.get(field)
        ref_val = ref[ref_key]
        if etl_val is None:
            discrepancies.append(
                f"{field}: ETL=null (data gap)  V79={ref_val}"
            )
        elif etl_val != ref_val:
            discrepancies.append(
                f"{field}: ETL={etl_val}  V79={ref_val}"
            )

    return discrepancies


# ── Write output ───────────────────────────────────────────────────────────────

def write_summary(summary: dict) -> Path:
    state = summary["state_code"].upper()
    slug  = summary["drug_slug"]
    out_dir = DATA_SUMMARIES / state
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slug}.json"
    with out_path.open("w", encoding="utf-8") as fh:
        json.dump(summary, fh, ensure_ascii=False, indent=2)
    return out_path


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build FormularyStateDrugSummary JSON files per state+drug."
    )
    parser.add_argument(
        "--drug", default="ozempic",
        help="Drug slug to process (default: ozempic)",
    )
    parser.add_argument(
        "--states", nargs="*",
        help="Limit to specific state codes (default: all 51 jurisdictions)",
    )
    parser.add_argument(
        "--skip-ffe", action="store_true",
        help="Skip formulary_intelligence.json streaming (faster dev iteration with enrichment only)",
    )
    parser.add_argument(
        "--validate-nc", action="store_true", default=False,
        help="Validate NC output against V79 locked data when drug=ozempic",
    )
    parser.add_argument(
        "--no-validate-nc", dest="validate_nc", action="store_false",
        help="Skip NC V79 validation (default)",
    )
    args = parser.parse_args()

    drug_slug   = drug_name_to_slug(args.drug)
    target_states = {s.upper() for s in args.states} if args.states else None

    log.info("=== build_formulary_state_drug_summaries.py ===")
    log.info("Drug: '%s'  slug: '%s'", args.drug, drug_slug)
    if target_states:
        log.info("States: %s", sorted(target_states))

    # 1. Plan map
    plan_map = build_plan_map()

    # 2. Issuer→state map
    issuer_state_map = build_issuer_state_map(plan_map)

    # 3. Enrichment registry for this drug
    enrichment = build_enrichment_registry(drug_slug, plan_map)

    # 4. Accumulators
    accums: dict[tuple[str, str], CarrierDrugAccum] = defaultdict(CarrierDrugAccum)

    # 5. Stream FFE — returns set of (issuer_id, state) pairs with FFE coverage
    if not args.skip_ffe:
        _ffe_count, ffe_present_keys = stream_ffe_for_drug(
            drug_slug, issuer_state_map, accums
        )
    else:
        log.info("FFE streaming skipped (--skip-ffe)")
        ffe_present_keys: set[tuple[str, str]] = set()

    # 6. SBM files
    process_sbm_for_drug(drug_slug, accums, plan_map)

    # 7. Apply enrichment overrides:
    #    - tier only for carriers NOT in FFE (PDF-only carriers like BCBS NC)
    #    - PA/QL/ST always overridden by enrichment
    apply_enrichment_overrides(accums, enrichment, ffe_present_keys)

    # 8. Collect all states with drug coverage
    covered_states: set[str] = {sc for (_, sc) in accums}
    if target_states:
        covered_states &= target_states
    log.info("States with '%s' coverage: %d", drug_slug, len(covered_states))

    # 9. Build and write summaries
    written: list[Path] = []
    nc_summary: dict | None = None

    for state in sorted(covered_states):
        cost_ranges = build_sbc_cost_ranges(state)
        summary = build_state_summary(state, drug_slug, accums, plan_map, cost_ranges)
        if summary is None:
            log.debug("  %s: no carriers with known plan counts — skip", state)
            continue
        path = write_summary(summary)
        written.append(path)
        log.info("  Wrote: %s  (plan_count=%d, carriers=%d)",
                 path.relative_to(REPO_ROOT), summary["plan_count"], len(summary["carriers"]))
        if state == "NC":
            nc_summary = summary

    log.info("Done: %d summaries written to %s", len(written),
             DATA_SUMMARIES.relative_to(REPO_ROOT))

    # 10. NC Ozempic validation
    if args.validate_nc and drug_slug == "ozempic":
        log.info("")
        log.info("=== NC Ozempic V79 Validation ===")
        if nc_summary is None:
            log.error("NC summary not generated — cannot validate against V79")
            sys.exit(1)

        discrepancies = validate_nc_ozempic(nc_summary)

        if not discrepancies:
            log.info("PASS — NC Ozempic ETL output matches V79 locked data exactly.")
        else:
            log.error("DISCREPANCY — NC Ozempic ETL output does not match V79 locked data.")
            log.error("The following fields differ (ETL vs V79):")
            for d in discrepancies:
                log.error("  ✗  %s", d)
            log.error("")
            log.error("DO NOT adjust V79 locked data to match ETL output.")
            log.error("Investigate the ETL data source for each discrepancy above.")
            log.error("NC summary written to: %s",
                      (DATA_SUMMARIES / "NC" / "ozempic.json").relative_to(REPO_ROOT))
            sys.exit(1)


if __name__ == "__main__":
    main()
