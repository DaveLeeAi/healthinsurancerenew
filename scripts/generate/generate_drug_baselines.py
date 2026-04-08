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
PLAN_INTEL_FILE = DATA_PROCESSED / "plan_intelligence.json"
FORMULARY_FILE = DATA_PROCESSED / "formulary_intelligence.json"
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
TIER_NORMALISE: dict[str, str] = {
    "GENERIC": "generic",
    "PREFERRED-BRAND": "preferred-brand",
    "PREFERRED BRAND": "preferred-brand",
    "PREFERRED-GENERICS": "generic",
    "PREFERRED GENERICS": "generic",
    "NON-PREFERRED-BRAND": "non-preferred-brand",
    "NON-PREFERRED BRAND": "non-preferred-brand",
    "NON PREFERRED BRAND": "non-preferred-brand",
    "NON-PREFERRED-GENERICS": "generic",
    "SPECIALTY": "specialty",
    "ACA-PREVENTIVE-DRUGS": "preventive",
    "PREVENT-DRUGS": "preventive",
    "PREVENTIVE": "preventive",
    "TIER 1": "generic",
    "TIER 2": "preferred-brand",
    "TIER 3": "non-preferred-brand",
    "TIER 4": "specialty",
    "TIER1": "generic",
    "TIER2": "preferred-brand",
    "TIER3": "non-preferred-brand",
    "TIER4": "specialty",
    "MEDICAL-SERVICE-DRUG": "specialty",
    "MEDICAL-BENEFIT": "specialty",
    "NON-FORMULARY-DRUGS": "non-preferred-brand",
    "NON-FORMULARY": "non-preferred-brand",
}


def normalise_tier(raw: str | None) -> str:
    if not raw:
        return "unknown"
    upper = raw.strip().upper()
    return TIER_NORMALISE.get(upper, raw.strip().lower().replace("_", "-").replace(" ", "-"))


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

def build_issuer_state_map() -> dict[str, str]:
    """
    Returns {issuer_id_str: state_code} from plan_intelligence.json.
    Each FFE issuer operates in exactly one state.
    """
    if not PLAN_INTEL_FILE.exists():
        log.error("plan_intelligence.json not found — cannot map issuers to states")
        return {}

    log.info("Building issuer → state map from plan_intelligence.json …")
    with PLAN_INTEL_FILE.open("r", encoding="utf-8") as fh:
        pi = json.load(fh)

    issuer_map: dict[str, str] = {}
    for plan in pi.get("data", []):
        iid = str(plan.get("issuer_id", "")).strip()
        state = (plan.get("state_code") or "").upper().strip()
        if iid and state and len(state) == 2:
            issuer_map[iid] = state  # last-wins is fine — each issuer has one state

    log.info("  %d issuers mapped to states", len(issuer_map))
    return issuer_map


# ── Stream FFE records ─────────────────────────────────────────────────────────

def stream_ffe_records(
    issuer_map: dict[str, str],
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

            drug_name = normalise_drug_name(rec.get("drug_name") or "")
            if not drug_name:
                continue

            # Resolve state from issuer_ids
            issuer_ids = rec.get("issuer_ids") or []
            states_for_record: set[str] = set()
            for iid in issuer_ids:
                iid_str = str(iid).strip()
                state = issuer_map.get(iid_str)
                if state:
                    states_for_record.add(state)

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
                drug_name = normalise_drug_name(rec.get("drug_name") or rec.get("name") or "")
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
        "description": "National and per-state baseline stats per drug for content differentiation",
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
