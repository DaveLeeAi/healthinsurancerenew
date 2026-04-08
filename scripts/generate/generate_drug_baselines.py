"""
generate_drug_baselines.py
──────────────────────────
Streams formulary_intelligence.json (4+ GB, ~14.8M records) line-by-line and
reads all SBM per-state files to produce data/processed/drug_national_baselines.json.

Uses plan_intelligence.json to build an issuer_id → state_code map so FFE
records (which lack state_code) can be attributed to states.

For each drug appearing in 3+ states, computes:
  - total_plans_national
  - total_states_with_coverage
  - tier_distribution_pct (normalised tier keys)
  - dominant_tier_national
  - prior_auth_pct_national
  - step_therapy_pct_national
  - quantity_limit_pct_national
  - per_state: {state_code: {plan_count, prior_auth_pct, dominant_tier,
                              pa_rank_among_states, total_states}}

Run:
    python scripts/generate/generate_drug_baselines.py

Outputs:
    data/processed/drug_national_baselines.json
"""

from __future__ import annotations

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
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_PROCESSED = REPO_ROOT / "data" / "processed"
DATA_CONFIG = REPO_ROOT / "data" / "config"
PLAN_INTEL_FILE = DATA_PROCESSED / "plan_intelligence.json"
FORMULARY_FILE = DATA_PROCESSED / "formulary_intelligence.json"
FORMULARY_URL_REGISTRY = DATA_CONFIG / "formulary-url-registry-2026.json"
OUTPUT_FILE = DATA_PROCESSED / "drug_national_baselines.json"

# SBM files are named formulary_sbm_XX.json (two-letter state codes only)
SBM_PATTERN = re.compile(r"^formulary_sbm_([A-Z]{2})\.json$")

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Tier normalisation ─────────────────────────────────────────────────────────
#
# Maps every observed FFE + SBM tier label to one of 5 canonical buckets:
#   generic | preferred-brand | non-preferred-brand | specialty | preventive
# (plus 'unknown' for unmappable / empty values)
#
# Mapping rules:
#   - tier-1, tier-one, preferred-generic, non-preferred-generic        → generic
#     (non-preferred generics are still generic drugs — not brand)
#   - tier-2, tier-two, preferred-brand, brand-preferred                → preferred-brand
#   - tier-3, tier-three, non-preferred-brand, brand-non-preferred      → non-preferred-brand
#   - tier-4/5/6, tier-four/five/six, specialty, medical-service        → specialty
#     (medical-service-drugs are typically high-cost biologics/injectables)
#   - any "preventive" / "zero-cost" variant                             → preventive
#   - mixed-tier labels ("non-preferred-generic-non-preferred-brand")    → mapped to
#     the more expensive bucket (non-preferred-brand) since dominant tier
#     stats track cost-share, not chemistry
#   - low-/moderate-/highest-cost-share                                  → generic / preferred / specialty
#
# Lookup is case-insensitive and whitespace/underscore tolerant.

CANONICAL_TIERS = frozenset({
    "generic", "preferred-brand", "non-preferred-brand", "specialty", "preventive", "unknown"
})

TIER_NORMALISE: dict[str, str] = {
    # ── Generic ────────────────────────────────────────────────────────────────
    "generic": "generic",
    "generics": "generic",
    "tier-1": "generic",
    "tier-one": "generic",
    "tier-one-a": "generic",
    "tier-one-b": "generic",
    "tier1": "generic",
    "preferred-generic": "generic",
    "preferred-generics": "generic",
    "preferred-generic-drugs": "generic",
    "preferredgeneric": "generic",
    "two-preferred-generic": "generic",
    "non-preferred-generic": "generic",
    "non-preferred-generics": "generic",
    "nonpreferredgeneric": "generic",
    "high-cost-generic": "generic",
    "low-cost-generic": "generic",
    "low-cost-share": "generic",
    "lower-cost-share": "generic",

    # ── Preferred brand ────────────────────────────────────────────────────────
    "preferred-brand": "preferred-brand",
    "preferred-brands": "preferred-brand",
    "preferred-brand-drugs": "preferred-brand",
    "brand-preferred": "preferred-brand",
    "preferredbrand": "preferred-brand",
    "tier-2": "preferred-brand",
    "tier-two": "preferred-brand",
    "tier2": "preferred-brand",
    "three-preferred-brand": "preferred-brand",
    "preferred": "preferred-brand",
    "brand": "preferred-brand",
    "moderate-cost-share": "preferred-brand",
    "generic-brand": "preferred-brand",            # mixed-chemistry combo tier
    "generic-preferred-brand": "preferred-brand",  # mixed tier — lean preferred
    "non-preferred-generic-and-preferred-brand": "preferred-brand",
    "non-preferred-generic-preferred-brand": "preferred-brand",
    "formulary-brands": "preferred-brand",         # "on formulary" brand bucket

    # ── Non-preferred brand ────────────────────────────────────────────────────
    "non-preferred-brand": "non-preferred-brand",
    "non-preferred-brands": "non-preferred-brand",
    "non-preferred-brand-drugs": "non-preferred-brand",
    "brand-non-preferred": "non-preferred-brand",
    "non-preferred": "non-preferred-brand",
    "nonpreferred": "non-preferred-brand",
    "nonpreferred-brand": "non-preferred-brand",
    "nonpreferredbrand": "non-preferred-brand",
    "nonpreferred-drugs": "non-preferred-brand",
    "tier-3": "non-preferred-brand",
    "tier-three": "non-preferred-brand",
    "tier3": "non-preferred-brand",
    "four-non-preferred-brand-and-generic": "non-preferred-brand",
    "non-preferred-generic-non-preferred-brand": "non-preferred-brand",
    "non-preferredgeneric-non-preferredbrand": "non-preferred-brand",
    "non-preferred-generic-and-non-preferred-brand": "non-preferred-brand",
    "non-formulary": "non-preferred-brand",
    "non-formulary-drugs": "non-preferred-brand",
    "non-formulary-brands": "non-preferred-brand",

    # ── Specialty ──────────────────────────────────────────────────────────────
    "specialty": "specialty",
    "specialty-drug": "specialty",
    "specialty-drugs": "specialty",
    "specialtydrugs": "specialty",
    "specialty-products": "specialty",
    "specialty-and-other-high-cost-drugs": "specialty",
    "specialty-high": "specialty",
    "specialty-tier": "specialty",
    "specialty-coinsurance": "specialty",
    "specialty-brands": "specialty",
    "specialty-generics": "specialty",
    "preferred-specialty": "specialty",
    "preferred-specialty-drugs": "specialty",
    "preferred-brand-specialty": "specialty",
    "non-preferred-specialty": "specialty",
    "nonpreferred-specialty": "specialty",
    "non-preferred-specialty-drugs": "specialty",
    "nonpreferred-specialty-drugs": "specialty",
    "non-preferred-brand-specialty": "specialty",
    "non-preferred-brand-specialty-drugs": "specialty",
    "non-formulary-specialty": "specialty",
    "nonpreferred-brand-and-specialty": "specialty",
    "brand-specialty": "specialty",
    "value-specialty": "specialty",
    "generic-specialty": "specialty",
    "five-specialty": "specialty",
    "highest-cost-share": "specialty",
    "formulary-specialty": "specialty",
    "zero-cost-share-specialty-drugs": "specialty",
    "tier-4": "specialty",
    "tier-four": "specialty",
    "tier4": "specialty",
    "tier-5": "specialty",
    "tier-five": "specialty",
    "tier5": "specialty",
    "tier-6": "specialty",
    "tier-six": "specialty",
    "tier6": "specialty",
    "tier-seven": "specialty",
    "tier-7": "specialty",
    "tier7": "specialty",
    "medicalservicedrugs": "specialty",
    "medical-service-drugs": "specialty",
    "medical-service-drug": "specialty",
    "medical-service": "specialty",
    "medical-benefit": "specialty",
    "medical-benefit-drugs": "specialty",
    "oral-chemotherapy": "specialty",
    "oral-chemotherapy-drugs": "specialty",

    # ── Preventive ─────────────────────────────────────────────────────────────
    "preventive": "preventive",
    "preventive-drugs": "preventive",
    "preventive-care": "preventive",
    "preventive-generic": "preventive",       # zero-cost generic preventives
    "preventative": "preventive",
    "aca-preventive": "preventive",
    "aca-preventive-drugs": "preventive",
    "prevent-drugs": "preventive",
    "one-preventive": "preventive",
    "zero-cost-share-preventive": "preventive",
    "zero-cost-share-preventive-drugs": "preventive",
    "zero-cost-share-preventative-services": "preventive",
    "zerocostsharepreventivedrugs": "preventive",
    "zerocostsharepreventativedrugs": "preventive",
    "zero-cost-preventive": "preventive",
    "zero-cost-preventive-drugs": "preventive",
    "zero-cost-preventative": "preventive",
    "zero-cost-preventative-drugs": "preventive",
    "zero-cost-sharing-preventive": "preventive",
    "zero-dollar-preventive-medications": "preventive",
    "insulin-discount": "preventive",         # zero-cost insulin programs

    # ── Unknown / non-tier descriptors ────────────────────────────────────────
    # These are cost-share formats, supply categories, or "on formulary" labels
    # that don't actually identify a tier — kept as 'unknown' rather than guessing.
    "unknown": "unknown",
    "": "unknown",
    "retail-and-mail-order-coinsurance": "unknown",
    "formulary-drugs": "unknown",
    "ancillary": "unknown",
    "infertility": "unknown",
    "diabetic-supplies": "unknown",
    "9": "unknown",
}


def normalise_tier(raw: str | None) -> str:
    """
    Normalise any FFE/SBM tier label to one of the 5 canonical buckets.

    Lookup key: lowercase, hyphens for spaces/underscores, stripped.
    Anything not in the map falls through to 'unknown' so the dominant_tier
    field can never contain non-canonical noise.
    """
    if not raw:
        return "unknown"
    key = raw.strip().lower().replace("_", "-").replace(" ", "-")
    # Collapse repeated hyphens that can appear in source labels
    while "--" in key:
        key = key.replace("--", "-")
    return TIER_NORMALISE.get(key, "unknown")


_DOSAGE_FORM_WORDS = frozenset({
    "inj", "sopn", "subcutaneous", "pen", "solution", "tablet", "tab",
    "capsule", "cap", "cream", "ointment", "susp", "oral", "injection",
    "injector", "pen-injector", "vial", "syringe", "patch", "gel",
    "spray", "drops", "powder", "chewable", "extended-release", "er", "suspension",
    "dr", "sr", "hfa", "inhaler", "nebulizer", "ophthalmic", "otic",
    "nasal", "rectal", "topical", "transdermal", "suppository",
    # Delivery system words (not drug names)
    "system", "device", "kit", "pack", "blister",
    # Units that appear as standalone tokens
    "mg", "mcg", "ml", "mg/ml", "unit", "units", "dose", "gm", "g",
})

_DOSAGE_PATTERN = re.compile(
    r"^\d"                              # starts with digit
    r"|^[\d.]+\s*(mg|mcg|ml|%|unit)"    # "500mg", "0.5 mg"
    r"|/\d"                             # "2mg/3ml"
)


# ── Salt / ester / formulation suffix stripping ──────────────────────────────

# Order matters: longer suffixes first to avoid partial matches.
# These are stripped from the END of the canonical name after initial normalisation.
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

# Formulation suffixes (release-type modifiers) — stripped as trailing words
_FORM_SUFFIXES = ["er", "sr", "xr", "xl", "dr", "ec", "cr", "la", "hfa", "cp24", "tb24"]

# Combo-drug separator normalisation: "amphetamine- dextroamphetamine" and
# "amphetamine-dextroamphetamine" and "amphetamine / dextroamphetamine" and
# "amphetamine-dextroamphet er" should all become "amphetamine-dextroamphetamine"
_COMBO_NORMALIZE = re.compile(
    r"\s*/\s*"     # " / " or "/"
    r"|\s*-\s+"    # "- " with trailing space (e.g. "amphetamine- dextro")
    r"|\s+-\s*"    # " -" with leading space
)

# Known abbreviation expansions for combo merging
_ABBREV_EXPAND: dict[str, str] = {
    "dextroamphet": "dextroamphetamine",
    "metform": "metformin",
}


def canonicalize_base_drug(name: str) -> str:
    """
    Given a normalised drug name (lowercase, dosage stripped), produce a
    canonical base-drug key by stripping salt/ester suffixes and normalising
    combo-drug separators.

    Examples:
      "metformin hcl"           → "metformin"
      "metformin hydrochloride" → "metformin"
      "metformin hcl er"        → "metformin"
      "amphetamine-dextroamphet er" → "amphetamine-dextroamphetamine"
      "amphetamine- dextroamphetamine" → "amphetamine-dextroamphetamine"
      "dextroamphetamine sulfate er" → "dextroamphetamine"
      "glipizide-metformin hcl" → "glipizide-metformin"
    """
    s = name.strip()
    if not s:
        return s

    # 1. Fix escaped slashes from some SBM sources
    s = s.replace("\\/", "/").replace("\\", "")

    # 2. Normalise combo separators to hyphen (no spaces)
    s = _COMBO_NORMALIZE.sub("-", s)

    # 3. Expand known abbreviations
    for abbrev, full in _ABBREV_EXPAND.items():
        # Only replace as a whole word
        s = re.sub(rf"\b{re.escape(abbrev)}\b", full, s)

    # 4. Strip salt/ester suffixes (try longest first)
    for suffix in _SALT_SUFFIXES:
        if s.endswith(" " + suffix):
            s = s[: -(len(suffix) + 1)].rstrip(" -")
        elif s.endswith("-" + suffix):
            s = s[: -(len(suffix) + 1)].rstrip(" -")

    # 5. Strip trailing formulation modifiers (er, sr, xr, etc.)
    tokens = s.split()
    while tokens and tokens[-1] in _FORM_SUFFIXES:
        tokens.pop()
    s = " ".join(tokens) if tokens else s

    # 6. Clean up stray trailing punctuation / hyphens
    s = s.strip(" -,;")

    # 7. Collapse duplicate-word combos: "amphetamine-dextroamphetamine amphetamine-dextroamphetamine"
    if " " in s:
        parts = s.split()
        if len(parts) == 2 and parts[0] == parts[1]:
            s = parts[0]

    # 8. Reject non-drug tokens that survive stripping (delivery/form words)
    _REJECT_WORDS = _DOSAGE_FORM_WORDS | {
        "extended", "release", "delayed", "immediate", "modified",
        "oral", "topical", "vaginal", "ophthalmic", "intravenous",
        "tablet", "capsule", "injection", "solution", "suspension",
        "agents", "disorders", "drugs", "products", "preparations",
        "concentrate", "liquid", "elixir", "lotion", "emulsion",
        "aerosol", "foam", "film", "granules", "lozenge", "troche",
        "enema", "douche", "irrigant", "implant", "insert",
    }
    if s in _REJECT_WORDS:
        # Return empty — caller will skip this record
        return ""

    return s if s else name.strip()


def normalise_drug_name(name: str) -> str:
    """
    Extract canonical brand/drug name, matching the formulary template's
    slugification logic (lib/drug-linking.ts normalizeDrugName).

    1. If CMS bracket format — "0.25 MG SEMAGLUTIDE [OZEMPIC]" → "ozempic"
    2. CMS generic format (starts with number, no bracket) — "0.5 MG LISINOPRIL" →
       extract the last non-dosage word(s) as the drug name
    3. Brand-first format — "ozempic 0.25-0.5 mg/dose pen" → strip dosage suffix
    """
    raw = name.strip()
    if not raw:
        return ""

    # Step 1: CMS bracket format — extract brand name inside [ ]
    bracket = re.search(r"\[([^\]]+)\]", raw)
    if bracket:
        return bracket.group(1).strip().lower()

    low = raw.lower().strip()

    # Step 2: If name starts with a digit, it's likely CMS generic format
    # e.g. "0.5 mg tablet lisinopril" or "10 mg/ml solution amoxicillin"
    # Extract the rightmost non-dosage-form word(s) as the drug name
    if re.match(r"^\d", low):
        tokens = low.replace(",", " ").split()
        # Walk from the right, collect drug-name tokens until we hit a dosage/form word
        drug_tokens: list[str] = []
        for tok in reversed(tokens):
            tok_clean = tok.strip(".,;:-")
            if (
                _DOSAGE_PATTERN.match(tok_clean)
                or tok_clean in _DOSAGE_FORM_WORDS
                or re.match(r"^\d+\.?\d*$", tok_clean)
            ):
                break
            drug_tokens.append(tok_clean)
        if drug_tokens:
            drug_tokens.reverse()
            result = " ".join(drug_tokens)
            if result and not re.match(r"^[\d.]+$", result):
                return result
        # Fallback: return the whole thing lowered (rare)
        return low

    # Step 3: Brand-first format — strip dosage/form suffixes
    # Strip SBM "brand - generic form" suffix: "ozempic - semaglutide soln" → "ozempic"
    if " - " in low:
        low = low.split(" - ", 1)[0].strip()
    # Remove all (...) parenthetical groups (dosage, generic names)
    low = re.sub(r"\s*\([^)]*\)", "", low)

    # Truncate at first dosage/form token
    low = re.split(
        r"\s+(?=\d)"               # space before a digit  — "ozempic 0.25..."
        r"|\s+(?=inj\b)"           # "ozempic      inj 2mg"
        r"|\s+(?=sopn\b)"          # "ozempic sopn 2mg"
        r"|\s+(?=subcutaneous\b)"  # "ozempic subcutaneous pen"
        r"|\s+(?=pen\b)"           # trailing "pen"
        r"|\s+(?=solution\b)"
        r"|\s+(?=tablet\b)"
        r"|\s+(?=tab\b)"
        r"|\s+(?=capsule\b)"
        r"|\s+(?=cap\b)"
        r"|\s+(?=cream\b)"
        r"|\s+(?=ointment\b)"
        r"|\s+(?=susp\b)"
        r"|\s+(?=oral\b)"
        r"|\s+(?=mg\b)"
        r"|\s+(?=ml\b)"
        r"|\s+(?=mcg\b)",
        low,
        maxsplit=1,
    )[0]

    # Collapse multiple spaces, strip trailing whitespace/punctuation
    result = re.sub(r"\s+", " ", low).strip().rstrip("- ,;")
    return result if result else name.strip().lower()


# ── Per-drug state accumulator ─────────────────────────────────────────────────

class DrugStateAccum:
    """Accumulates plan records for one (drug, state) pair."""

    __slots__ = ("plan_count", "pa_count", "st_count", "ql_count", "tier_counts")

    def __init__(self) -> None:
        self.plan_count: int = 0
        self.pa_count: int = 0
        self.st_count: int = 0
        self.ql_count: int = 0
        self.tier_counts: dict[str, int] = defaultdict(int)

    def add(self, tier: str | None, pa: bool, st: bool, ql: bool) -> None:
        self.plan_count += 1
        if pa:
            self.pa_count += 1
        if st:
            self.st_count += 1
        if ql:
            self.ql_count += 1
        self.tier_counts[normalise_tier(tier)] += 1

    def dominant_tier(self) -> str:
        if not self.tier_counts:
            return "unknown"
        return max(self.tier_counts, key=lambda k: self.tier_counts[k])

    def pa_pct(self) -> float:
        if self.plan_count == 0:
            return 0.0
        return round(self.pa_count / self.plan_count * 100, 1)


# ── Issuer → State map ────────────────────────────────────────────────────────

def build_issuer_state_map() -> dict[str, set[str]]:
    """
    Returns {issuer_id_str: set_of_state_codes} merged from two sources:

    1. data/processed/plan_intelligence.json — covers ~183 of the ~320 ACA
       carriers. This used to be the only source. Missing carriers caused
       234,952 FFE records to be silently skipped during baseline build,
       which in turn caused per-drug state coverage gaps in baselines (see
       the 2026-04-08 audit: drug `biorphen` had a CO record in the master
       file that never reached baselines because the CO carrier wasn't in
       plan_intelligence.json).

    2. data/config/formulary-url-registry-2026.json — covers ~131 carriers
       across all 51 jurisdictions, including SBM-side carriers that
       plan_intelligence.json doesn't track.

    After merging both sources we get ~305 of 320 carriers (the remaining
    15 are still unmapped — typically tiny carriers without a known HIOS ID
    in either source). The return type is `dict[str, set[str]]` because a
    handful of multi-state carriers (e.g. Medica operates in 7 states)
    legitimately appear in multiple states.
    """
    if not PLAN_INTEL_FILE.exists():
        log.error("plan_intelligence.json not found — cannot map issuers to states")
        return {}

    log.info("Building issuer → state map …")

    # Source 1: plan_intelligence.json
    with PLAN_INTEL_FILE.open("r", encoding="utf-8") as fh:
        pi = json.load(fh)

    issuer_map: dict[str, set[str]] = {}
    for plan in pi.get("data", []):
        iid = str(plan.get("issuer_id", "")).strip()
        state = (plan.get("state_code") or "").upper().strip()
        if iid and state and len(state) == 2:
            issuer_map.setdefault(iid, set()).add(state)
    pi_count = len(issuer_map)
    log.info("  %d issuers from plan_intelligence.json", pi_count)

    # Source 2: formulary URL registry — walk all carrier dicts and pick up
    # any digit-only ID-like values (HIOS IDs are typically 5 digits, but
    # 4-6 covers known historical variants).
    if FORMULARY_URL_REGISTRY.exists():
        with FORMULARY_URL_REGISTRY.open("r", encoding="utf-8") as fh:
            registry = json.load(fh)

        def _walk(obj: Any, state_code: str) -> None:
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if isinstance(v, str) and v.isdigit() and 4 <= len(v) <= 6:
                        issuer_map.setdefault(v, set()).add(state_code)
                    elif isinstance(v, (dict, list)):
                        _walk(v, state_code)
            elif isinstance(obj, list):
                for item in obj:
                    _walk(item, state_code)

        for state_code, state_data in registry.get("states", {}).items():
            sc_up = state_code.upper().strip()
            if len(sc_up) != 2:
                continue
            for carrier in state_data.get("carriers", []):
                _walk(carrier, sc_up)
        log.info("  %d issuers after merging formulary URL registry (+%d new)",
                 len(issuer_map), len(issuer_map) - pi_count)
    else:
        log.warning(
            "  formulary-url-registry-2026.json not found at %s — skipping merge",
            FORMULARY_URL_REGISTRY,
        )

    multi_state = sum(1 for s in issuer_map.values() if len(s) > 1)
    log.info("  %d total issuers, %d multi-state", len(issuer_map), multi_state)
    return issuer_map


# ── Stream FFE records ─────────────────────────────────────────────────────────

def stream_ffe_records(
    issuer_map: dict[str, set[str]],
    accums: dict[str, dict[str, DrugStateAccum]],
) -> int:
    """
    Streams formulary_intelligence.json line-by-line.
    Each line after the metadata block is a JSON record (with trailing comma).
    Returns the count of records processed.
    """
    if not FORMULARY_FILE.exists():
        log.warning("formulary_intelligence.json not found — skipping FFE")
        return 0

    log.info("Streaming FFE records from %s …", FORMULARY_FILE.name)
    count = 0
    skipped_no_state = 0
    t0 = time.time()

    with FORMULARY_FILE.open("r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue

            # Skip metadata wrapper lines
            if line.startswith("{\"metadata\""):
                continue
            if line in ("{", "}", "]", "]}"):
                continue

            # Strip trailing comma
            if line.endswith(","):
                line = line[:-1]

            # Must start with { to be a record
            if not line.startswith("{"):
                continue

            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue

            drug_name = canonicalize_base_drug(normalise_drug_name(rec.get("drug_name") or ""))
            if not drug_name:
                continue

            # Resolve state from issuer_ids. Each issuer can map to multiple
            # states (multi-state carriers like Medica), so we update() the
            # set instead of add()ing a single state.
            issuer_ids = rec.get("issuer_ids") or []
            states_for_record: set[str] = set()
            for iid in issuer_ids:
                iid_str = str(iid).strip()
                states = issuer_map.get(iid_str)
                if states:
                    states_for_record.update(states)

            tier = rec.get("drug_tier")
            pa = bool(rec.get("prior_authorization"))
            st = bool(rec.get("step_therapy"))
            ql = bool(rec.get("quantity_limit"))

            if not states_for_record:
                # Still count toward national totals under "XX"
                accums[drug_name]["XX"].add(tier=tier, pa=pa, st=st, ql=ql)
                skipped_no_state += 1
            else:
                # Add to each state the issuers operate in
                for state in states_for_record:
                    accums[drug_name][state].add(tier=tier, pa=pa, st=st, ql=ql)

            count += 1
            if count % 2_000_000 == 0:
                elapsed = time.time() - t0
                log.info("  FFE: %dM records (%.0fs)", count // 1_000_000, elapsed)

    elapsed = time.time() - t0
    log.info("FFE complete: %d records in %.0fs (%d without state)", count, elapsed, skipped_no_state)
    return count


# ── SBM reader ─────────────────────────────────────────────────────────────────

def process_sbm_files(accums: dict[str, dict[str, DrugStateAccum]]) -> int:
    """Reads all formulary_sbm_XX.json files. Returns total record count."""
    total = 0
    for fpath in sorted(DATA_PROCESSED.iterdir()):
        m = SBM_PATTERN.match(fpath.name)
        if not m:
            continue
        state = m.group(1)
        try:
            with fpath.open("r", encoding="utf-8") as fh:
                obj = json.load(fh)
            data = obj.get("data") or obj.get("records") or []
            for rec in data:
                drug_name = canonicalize_base_drug(normalise_drug_name(rec.get("drug_name") or rec.get("name") or ""))
                if not drug_name:
                    continue
                accums[drug_name][state].add(
                    tier=rec.get("drug_tier") or rec.get("tier"),
                    pa=bool(rec.get("prior_authorization") or rec.get("pa")),
                    st=bool(rec.get("step_therapy") or rec.get("st")),
                    ql=bool(rec.get("quantity_limit") or rec.get("ql")),
                )
            log.info("  SBM %s: %d records", state, len(data))
            total += len(data)
        except Exception as exc:
            log.warning("  Failed to load %s: %s", fpath.name, exc)
    return total


# ── Compute baselines from accumulators ────────────────────────────────────────

def compute_baselines(
    accums: dict[str, dict[str, DrugStateAccum]],
    min_states: int = 3,
) -> dict[str, Any]:
    """
    Produces the output dict keyed by drug_name (lowercase).
    Only includes drugs with coverage in >= min_states known states.
    """
    output: dict[str, Any] = {}

    for drug_name, state_map in accums.items():
        # Exclude XX (unknown state) for per-state ranking
        known_states = {s: a for s, a in state_map.items() if s != "XX" and len(s) == 2}

        if len(known_states) < min_states:
            continue

        # National totals (include all records, including XX)
        total_plans = sum(a.plan_count for a in state_map.values())
        total_pa = sum(a.pa_count for a in state_map.values())
        total_st = sum(a.st_count for a in state_map.values())
        total_ql = sum(a.ql_count for a in state_map.values())

        # Tier distribution (national)
        tier_totals: dict[str, int] = defaultdict(int)
        for a in state_map.values():
            for t, c in a.tier_counts.items():
                tier_totals[t] += c
        total_tier_plans = sum(tier_totals.values()) or 1
        tier_dist_pct = {
            t: round(c / total_tier_plans * 100, 1)
            for t, c in tier_totals.items()
        }
        dominant_tier_national = max(tier_totals, key=lambda k: tier_totals[k]) if tier_totals else "unknown"

        # Per-state stats + PA ranking
        pa_rates = [(s, a.pa_pct()) for s, a in known_states.items()]
        pa_rates_sorted = sorted(pa_rates, key=lambda x: x[1], reverse=True)
        pa_rank_map = {s: rank + 1 for rank, (s, _) in enumerate(pa_rates_sorted)}
        total_states = len(known_states)

        per_state: dict[str, Any] = {}
        for state_code, a in known_states.items():
            per_state[state_code] = {
                "plan_count": a.plan_count,
                "prior_auth_pct": a.pa_pct(),
                "dominant_tier": a.dominant_tier(),
                "pa_rank_among_states": pa_rank_map.get(state_code, total_states),
            }

        output[drug_name] = {
            "total_plans_national": total_plans,
            "total_states_with_coverage": total_states,
            "tier_distribution_pct": tier_dist_pct,
            "dominant_tier_national": dominant_tier_national,
            "prior_auth_pct_national": round(total_pa / total_plans * 100, 1) if total_plans else 0.0,
            "step_therapy_pct_national": round(total_st / total_plans * 100, 1) if total_plans else 0.0,
            "quantity_limit_pct_national": round(total_ql / total_plans * 100, 1) if total_plans else 0.0,
            "per_state": per_state,
        }

    return output


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    log.info("=== generate_drug_baselines.py ===")
    log.info("REPO_ROOT: %s", REPO_ROOT)

    if not DATA_PROCESSED.exists():
        log.error("data/processed/ not found — run from repo root")
        sys.exit(1)

    # Build issuer → state map
    issuer_map = build_issuer_state_map()
    if not issuer_map:
        log.error("No issuer→state mapping — cannot attribute FFE records to states")
        sys.exit(1)

    # Accumulators: drug_name → state → DrugStateAccum
    accums: dict[str, dict[str, DrugStateAccum]] = defaultdict(lambda: defaultdict(DrugStateAccum))

    # Stream FFE records (14.8M)
    ffe_count = stream_ffe_records(issuer_map, accums)

    # Process SBM files (~391K)
    sbm_count = process_sbm_files(accums)

    log.info("Total records: %d FFE + %d SBM = %d", ffe_count, sbm_count, ffe_count + sbm_count)
    log.info("Unique drugs (all): %d", len(accums))

    # Compute baselines (min 3 states)
    log.info("Computing national baselines (min 3 states) …")
    baselines = compute_baselines(accums, min_states=3)
    log.info("Baselines computed: %d drugs qualify", len(baselines))

    # Write output
    metadata = {
        "generated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "source": "CMS MR-PUF formulary_intelligence.json + SBM formulary files",
        "ffe_records": ffe_count,
        "sbm_records": sbm_count,
        "drug_count": len(baselines),
        "min_states_required": 3,
        "description": "National and per-state baseline stats per drug for content differentiation. "
                       "Salt/ester variants (hcl, hydrochloride, sulfate, etc.) merged into canonical base drug names.",
    }
    output_obj = {"metadata": metadata, "data": baselines}

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as fh:
        json.dump(output_obj, fh, ensure_ascii=False)

    file_mb = OUTPUT_FILE.stat().st_size / 1_048_576
    log.info("Written to %s (%.1f MB)", OUTPUT_FILE, file_mb)

    # Summary stats
    pa_rates = [b["prior_auth_pct_national"] for b in baselines.values()]
    if pa_rates:
        log.info(
            "PA rate — min %.1f%% | avg %.1f%% | max %.1f%%",
            min(pa_rates),
            sum(pa_rates) / len(pa_rates),
            max(pa_rates),
        )

    # Top drugs by plan count
    top_drugs = sorted(baselines.items(), key=lambda x: x[1]["total_plans_national"], reverse=True)[:10]
    log.info("Top 10 drugs by plan count:")
    for name, d in top_drugs:
        log.info("  %s — %d plans, %d states, PA=%.1f%%",
                 name[:60], d["total_plans_national"],
                 d["total_states_with_coverage"], d["prior_auth_pct_national"])

    log.info("Done.")


if __name__ == "__main__":
    main()
