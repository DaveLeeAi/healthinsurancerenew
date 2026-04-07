"""
generate_drug_baselines.py
──────────────────────────
Reads formulary_intelligence.json (via its drug index) and all SBM per-state
formulary files, then produces data/processed/drug_national_baselines.json.

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

Run standalone:
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
CACHE_DIR = REPO_ROOT / ".cache"
FORMULARY_FILE = DATA_PROCESSED / "formulary_intelligence.json"
FORMULARY_INDEX = CACHE_DIR / "formulary_drug_index.json"
OUTPUT_FILE = DATA_PROCESSED / "drug_national_baselines.json"

# SBM files are named formulary_sbm_XX.json (two-letter state codes)
SBM_PATTERN = re.compile(r"^formulary_sbm_([A-Z]{2})\.json$")

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Tier normalisation ─────────────────────────────────────────────────────────
TIER_NORMALISE: dict[str, str] = {
    "GENERIC": "generic",
    "PREFERRED-BRAND": "preferred-brand",
    "PREFERRED BRAND": "preferred-brand",
    "NON-PREFERRED-BRAND": "non-preferred-brand",
    "NON-PREFERRED BRAND": "non-preferred-brand",
    "NON PREFERRED BRAND": "non-preferred-brand",
    "SPECIALTY": "specialty",
    "ACA-PREVENTIVE-DRUGS": "preventive",
    "PREVENTIVE": "preventive",
    "TIER 1": "generic",
    "TIER 2": "preferred-brand",
    "TIER 3": "non-preferred-brand",
    "TIER 4": "specialty",
    "TIER1": "generic",
    "TIER2": "preferred-brand",
    "TIER3": "non-preferred-brand",
    "TIER4": "specialty",
}


def normalise_tier(raw: str | None) -> str:
    if not raw:
        return "unknown"
    upper = raw.strip().upper()
    return TIER_NORMALISE.get(upper, raw.strip().lower())


def normalise_drug_name(name: str) -> str:
    return name.strip().lower()


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

    def add(
        self,
        tier: str | None,
        pa: bool,
        st: bool,
        ql: bool,
    ) -> None:
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


# ── Index-based FFE reader ─────────────────────────────────────────────────────

def load_index() -> dict[str, dict[str, int]]:
    """Load drug → {offset, length} index.  Returns empty dict if absent."""
    if not FORMULARY_INDEX.exists():
        log.warning("Formulary index not found at %s — run: npm run build:indexes", FORMULARY_INDEX)
        return {}
    log.info("Loading formulary index …")
    with FORMULARY_INDEX.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def iter_ffe_records(
    index: dict[str, dict[str, int]],
    drug_name_lower: str,
) -> list[dict[str, Any]]:
    """
    Reads the byte block for *drug_name_lower* from formulary_intelligence.json.
    Returns a list of record dicts (may be empty if drug not in index).
    """
    if not FORMULARY_FILE.exists():
        return []

    records: list[dict[str, Any]] = []

    # Find all index keys that contain the drug name
    matching_keys = [k for k in index if drug_name_lower in k]
    if not matching_keys:
        return records

    with FORMULARY_FILE.open("rb") as fh:
        for key in matching_keys:
            entry = index[key]
            offset = entry.get("offset", 0)
            length = entry.get("length", 0)
            if length == 0:
                continue
            fh.seek(offset)
            block_bytes = fh.read(length)
            block_text = block_bytes.decode("utf-8", errors="replace")
            for line in block_text.splitlines():
                line = line.strip().rstrip(",")
                if not line or line in ("{", "}"):
                    continue
                try:
                    rec = json.loads(line)
                    records.append(rec)
                except json.JSONDecodeError:
                    continue

    return records


# ── SBM reader ─────────────────────────────────────────────────────────────────

def load_sbm_files() -> dict[str, list[dict[str, Any]]]:
    """
    Returns {state_code: [drug_records, ...]} for every formulary_sbm_XX.json
    found in data/processed/.
    """
    sbm: dict[str, list[dict[str, Any]]] = {}
    for fpath in DATA_PROCESSED.iterdir():
        m = SBM_PATTERN.match(fpath.name)
        if not m:
            continue
        state = m.group(1)
        log.info("Loading SBM file %s …", fpath.name)
        try:
            with fpath.open("r", encoding="utf-8") as fh:
                obj = json.load(fh)
            data = obj.get("data") or obj.get("records") or []
            sbm[state] = data
            log.info("  %s: %d records", state, len(data))
        except Exception as exc:
            log.warning("  Failed to load %s: %s", fpath.name, exc)
    return sbm


# ── Build accumulator from all sources ────────────────────────────────────────

def build_accumulators(
    index: dict[str, dict[str, int]],
    sbm_data: dict[str, list[dict[str, Any]]],
) -> dict[str, dict[str, DrugStateAccum]]:
    """
    Returns {drug_name_lower: {state_code_upper: DrugStateAccum}}.

    Processes:
      1. FFE records from formulary_intelligence.json (index-based)
      2. SBM records from per-state files
    """
    # drug → state → accum
    accums: dict[str, dict[str, DrugStateAccum]] = defaultdict(lambda: defaultdict(DrugStateAccum))

    # ── FFE ──
    if index:
        log.info("Processing FFE records …")
        all_drug_keys = list(index.keys())
        total_keys = len(all_drug_keys)
        log.info("  Index has %d drug keys", total_keys)

        # To avoid loading the whole 4 GB file repeatedly, we open it once and
        # process all keys in sorted-offset order (minimises seek distance).
        offset_sorted = sorted(all_drug_keys, key=lambda k: index[k].get("offset", 0))

        processed = 0
        t0 = time.time()

        if FORMULARY_FILE.exists():
            with FORMULARY_FILE.open("rb") as fh:
                for drug_key in offset_sorted:
                    entry = index[drug_key]
                    offset = entry.get("offset", 0)
                    length = entry.get("length", 0)
                    if length == 0:
                        continue
                    fh.seek(offset)
                    block_bytes = fh.read(length)
                    block_text = block_bytes.decode("utf-8", errors="replace")

                    for line in block_text.splitlines():
                        line = line.strip().rstrip(",")
                        if not line or line in ("{", "}"):
                            continue
                        try:
                            rec = json.loads(line)
                        except json.JSONDecodeError:
                            continue

                        drug_name = normalise_drug_name(rec.get("drug_name") or drug_key)
                        state_code = (rec.get("state_code") or "").upper().strip()
                        if not state_code:
                            # Try to infer from issuer_id / plan_id (last resort)
                            plan_id = rec.get("plan_id") or ""
                            if len(plan_id) >= 5:
                                state_code = plan_id[5:7].upper()

                        if not state_code or len(state_code) != 2:
                            state_code = "XX"  # unknown state — include in national but not per-state ranking

                        accums[drug_name][state_code].add(
                            tier=rec.get("drug_tier"),
                            pa=bool(rec.get("prior_authorization")),
                            st=bool(rec.get("step_therapy")),
                            ql=bool(rec.get("quantity_limit")),
                        )

                    processed += 1
                    if processed % 5000 == 0:
                        elapsed = time.time() - t0
                        log.info("  FFE: %d/%d keys processed (%.0fs)", processed, total_keys, elapsed)

        log.info("FFE processing complete — %d drug names", len(accums))
    else:
        log.warning("No formulary index — skipping FFE records")

    # ── SBM ──
    log.info("Processing SBM records …")
    for state_code, records in sbm_data.items():
        state_upper = state_code.upper()
        for rec in records:
            drug_name = normalise_drug_name(rec.get("drug_name") or rec.get("name") or "")
            if not drug_name:
                continue
            accums[drug_name][state_upper].add(
                tier=rec.get("drug_tier") or rec.get("tier"),
                pa=bool(rec.get("prior_authorization") or rec.get("pa")),
                st=bool(rec.get("step_therapy") or rec.get("st")),
                ql=bool(rec.get("quantity_limit") or rec.get("ql")),
            )

    log.info("SBM processing complete")
    return accums


# ── Compute baselines from accumulators ────────────────────────────────────────

def compute_baselines(
    accums: dict[str, dict[str, DrugStateAccum]],
    min_states: int = 3,
) -> dict[str, Any]:
    """
    Produces the output dict keyed by drug_name (lowercase).
    Only includes drugs with coverage in >= min_states states.
    """
    output: dict[str, Any] = {}

    for drug_name, state_map in accums.items():
        # Exclude placeholder / unknown state for ranking but include for national totals
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

        # Per-state stats
        per_state: dict[str, Any] = {}
        # Build PA rate list for ranking
        pa_rates = [(s, a.pa_pct()) for s, a in known_states.items()]
        pa_rates_sorted = sorted(pa_rates, key=lambda x: x[1], reverse=True)  # highest first
        pa_rank_map = {s: rank + 1 for rank, (s, _) in enumerate(pa_rates_sorted)}
        total_states = len(known_states)

        for state_code, a in known_states.items():
            per_state[state_code] = {
                "plan_count": a.plan_count,
                "prior_auth_pct": a.pa_pct(),
                "dominant_tier": a.dominant_tier(),
                "pa_rank_among_states": pa_rank_map.get(state_code, total_states),
                "total_states": total_states,
            }

        output[drug_name] = {
            "drug_name": drug_name,
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

    # Validate paths
    if not DATA_PROCESSED.exists():
        log.error("data/processed/ not found — run from repo root or check path")
        sys.exit(1)

    # Load index
    index = load_index()

    # Load SBM files
    sbm_data = load_sbm_files()

    if not index and not sbm_data:
        log.error("No data sources found — nothing to process")
        sys.exit(1)

    # Build accumulators
    t_start = time.time()
    accums = build_accumulators(index, sbm_data)
    log.info("Accumulation complete in %.1fs — %d unique drugs", time.time() - t_start, len(accums))

    # Compute baselines
    log.info("Computing national baselines (min 3 states) …")
    baselines = compute_baselines(accums, min_states=3)
    log.info("Baselines computed: %d drugs", len(baselines))

    # Write output
    metadata = {
        "generated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "source": "CMS MR-PUF formulary_intelligence.json + SBM formulary files",
        "drug_count": len(baselines),
        "min_states_required": 3,
        "description": "National and per-state baseline stats per drug for content differentiation",
    }
    output_obj = {"metadata": metadata, "data": baselines}

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as fh:
        json.dump(output_obj, fh, indent=2, ensure_ascii=False)

    log.info("Written to %s (%.2f MB)", OUTPUT_FILE, OUTPUT_FILE.stat().st_size / 1_048_576)

    # Summary stats
    pa_rates = [b["prior_auth_pct_national"] for b in baselines.values()]
    if pa_rates:
        log.info(
            "PA rate — min %.1f%% | avg %.1f%% | max %.1f%%",
            min(pa_rates),
            sum(pa_rates) / len(pa_rates),
            max(pa_rates),
        )
    log.info("Done.")


if __name__ == "__main__":
    main()
