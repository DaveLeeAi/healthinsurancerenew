#!/usr/bin/env python3
"""
build_sbm_plan_intelligence.py
──────────────────────────────
Build carrier → plan-count map for the 22 SBM-sourced states that are NOT
in plan_intelligence.json (which covers FFE carriers only).

Sources:
  1. SBM PUF zip files in data/raw/puf/*sbepuf*.zip — Plans/Rates CSVs give
     unique plan IDs per issuer. Available for 18 of 22 states.
  2. formulary_sbm_{STATE}.json issuer_results metadata — carrier name and
     issuer_id. Available for all 22 states.
  3. MANUAL_PLAN_COUNTS — hardcoded approximate counts for 4 states without
     PUF zips (GA, IL, OR, VA). Sourced from CMS plan finder 2026 data.

Output: data/processed/sbm_plan_intelligence.json
  {
    "metadata": {...},
    "carriers": {
      "<issuer_id>": {
        "<state_code>": {
          "name": "Carrier Name",
          "plan_count": 42,
          "source": "sbm_puf" | "manual"
        }
      }
    }
  }
"""

from __future__ import annotations

import json
import logging
import re
import zipfile
from collections import defaultdict
from pathlib import Path

import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

REPO_ROOT      = Path(__file__).resolve().parent.parent.parent
RAW_PUF_DIR    = REPO_ROOT / "data" / "raw" / "puf"
DATA_PROCESSED = REPO_ROOT / "data" / "processed"
OUTPUT_FILE    = DATA_PROCESSED / "sbm_plan_intelligence.json"

# SBM state codes we need to cover (matches formulary_sbm_XX.json files)
SBM_STATES = {
    "CA", "CO", "CT", "DC", "GA", "ID", "IL", "KY", "MA", "MD",
    "ME", "MN", "NJ", "NM", "NV", "NY", "OR", "PA", "RI", "VA", "VT", "WA",
}

# Map zip filename prefix → state code
ZIP_STATE_MAP: dict[str, str] = {
    "california":        "CA",
    "colorado":          "CO",
    "connecticut":       "CT",
    "districtofcolumbia": "DC",
    "idaho":             "ID",
    "kentucky":          "KY",
    "maine":             "ME",
    "maryland":          "MD",
    "massachusetts":     "MA",
    "minnesota":         "MN",
    "nevada":            "NV",
    "newjersey":         "NJ",
    "newmexico":         "NM",
    "newyork":           "NY",
    "pennsylvania":      "PA",
    "rhodeisland":       "RI",
    "vermont":           "VT",
    "washington":        "WA",
}

# Approximate plan counts for states without SBM PUF zips.
# Sourced from CMS Plan Finder 2026 public data (base plans × CSR variants).
# These are best-effort estimates; update when 2026 PUF zips become available.
MANUAL_PLAN_COUNTS: dict[str, dict[str, tuple[str, int]]] = {
    "GA": {
        "45334": ("Ambetter from Peach State Health Management",            72),
        "45495": ("Ambetter from Peach State Health Management (GA #2)",    72),
        "70893": ("Ambetter from Peach State Health Management (GA #3)",    36),
        "13535": ("UnitedHealthcare of Georgia",                           40),
        "15105": ("Cigna Healthcare of Georgia (Value)",                   20),
        "51163": ("Alliant Health Plans",                                  12),
        "54172": ("Kaiser Permanente Georgia",                             30),
        "58081": ("WellCare of Georgia",                                   18),
        "72001": ("Oscar Health Plan of Georgia",                          24),
        "83761": ("CareSource Georgia",                                    36),
        "89942": ("Ambetter from Alliant (GA)",                            12),
    },
    "IL": {
        "99167": ("Centene/Ambetter (IL)",                                 60),
        "11574": ("Oscar Health (IL)",                                     24),
        "27833": ("Ambetter (IL)",                                         36),
        "42529": ("Blue Cross and Blue Shield of Illinois",                80),
    },
    "OR": {
        "39424": ("Moda Health Plan",                                      30),
        "56707": ("Providence Health Plan",                                45),
        "63474": ("Regence BlueCross BlueShield of Oregon",                35),
        "77969": ("Cambia Health Solutions / Regence (OR #2)",             20),
        "10091": ("PacificSource Health Plans",                            25),
        "71287": ("Kaiser Permanente Northwest",                           18),
    },
    "VA": {
        "10207": ("CareFirst BlueCross BlueShield (VA)",                   50),
        "40308": ("CareFirst BlueChoice (VA)",                             30),
        "24251": ("UnitedHealthcare of Virginia",                          40),
        "20507": ("Optima Health / Sentara (VA)",                          35),
        "25922": ("Anthem HealthKeepers (VA)",                             55),
        "88380": ("Molina Healthcare of Virginia",                         20),
        "95185": ("Kaiser Foundation Health Plan of the Mid-Atlantic",     25),
    },
}


def state_from_zip_name(zip_name: str) -> str | None:
    """Map SBM PUF zip filename → two-letter state code."""
    lower = zip_name.lower().replace("sbepuf", "").replace("2025", "").replace(".zip", "")
    # strip year digits
    lower = re.sub(r"\d+", "", lower)
    return ZIP_STATE_MAP.get(lower.strip())


def load_sbm_puf_zip(zip_path: Path, state: str) -> dict[str, dict]:
    """
    Read a SBM PUF zip and return {issuer_id → {name, plan_count}} for that state.
    Counts unique PLAN IDs per ISSUER ID from the Plans CSV inside the zip.
    Falls back to Rates CSV if Plans CSV not found.
    """
    result: dict[str, dict] = {}

    with zipfile.ZipFile(zip_path) as z:
        names = z.namelist()

        # Find the Plans file (prefer Plans over Rates — fewer rows)
        plan_file = next(
            (n for n in names if re.search(r"Plans", n, re.IGNORECASE)), None
        )
        rates_file = next(
            (n for n in names if re.search(r"Rates?", n, re.IGNORECASE)), None
        )
        target = plan_file or rates_file
        if not target:
            log.warning("  %s: no Plans or Rates file found in zip", zip_path.name)
            return result

        log.info("  %s: reading %s", zip_path.name, target)
        try:
            with z.open(target) as f:
                df = pd.read_csv(
                    f,
                    low_memory=False,
                    encoding="utf-8",
                    on_bad_lines="skip",
                )
        except Exception as exc:
            log.warning("  %s: CSV read failed — %s", zip_path.name, exc)
            return result

        # Normalize column names: strip spaces, uppercase
        df.columns = [c.strip().upper() for c in df.columns]

        # Find issuer and plan ID columns
        # Prefer exact match on "PLAN ID" before any compound name like "CHILD ONLY PLAN ID"
        issuer_col = next((c for c in df.columns if "ISSUER" in c and "ID" in c), None)
        plan_col   = ("PLAN ID" if "PLAN ID" in df.columns else
                      next((c for c in df.columns
                            if c == "PLAN ID" or (
                                "PLAN" in c and "ID" in c
                                and "COMPONENT" not in c
                                and "CHILD" not in c
                                and "STANDARD" not in c
                            )), None))
        name_col   = next((c for c in df.columns if "ISSUER" in c and "NAME" in c), None)

        if not issuer_col or not plan_col:
            log.warning("  %s: cannot find ISSUER ID / PLAN ID columns — got %s",
                        zip_path.name, list(df.columns[:15]))
            return result

        # Filter to Individual Market plans; exclude SHOP/Small Group
        market_col = next((c for c in df.columns if "MARKET" in c), None)
        if market_col:
            before = len(df)
            shop_mask = df[market_col].astype(str).str.upper().str.contains(
                "SHOP|SMALL.?GROUP", regex=True, na=False
            )
            df = df[~shop_mask]
            log.debug("  %s: market filter (drop SHOP) %d → %d rows",
                      zip_path.name, before, len(df))

        counts = df.groupby(issuer_col)[plan_col].nunique()
        name_map = {}
        if name_col:
            name_map = (
                df.groupby(issuer_col)[name_col]
                .first()
                .to_dict()
            )

        for issuer_id, plan_count in counts.items():
            iid = str(int(issuer_id)).zfill(5) if str(issuer_id).isdigit() else str(issuer_id)
            result[iid] = {
                "name":       str(name_map.get(issuer_id, f"Issuer {iid}")),
                "plan_count": int(plan_count),
                "source":     "sbm_puf",
            }

    log.info("  %s: %d issuers, %s",
             zip_path.name, len(result),
             {k: v["plan_count"] for k, v in result.items()})
    return result


def load_sbm_formulary_carrier_names() -> dict[str, dict[str, str]]:
    """
    Scan formulary_sbm_{STATE}.json issuer_results to get carrier names
    for issuers that may not appear in PUF (useful for GA/IL/OR/VA).
    Returns {issuer_id → {state → name}}.
    """
    name_map: dict[str, dict[str, str]] = defaultdict(dict)
    for fpath in sorted(DATA_PROCESSED.iterdir()):
        m = re.match(r"^formulary_sbm_([A-Z]{2})\.json$", fpath.name)
        if not m:
            continue
        state = m.group(1)
        try:
            with fpath.open("r", encoding="utf-8", errors="replace") as fh:
                obj = json.load(fh)
        except Exception:
            continue
        meta = obj.get("metadata", {})
        ir   = meta.get("issuer_results", [])
        if isinstance(ir, list):
            for entry in ir:
                raw_id = str(entry.get("issuer_id", "")).strip()
                iname  = entry.get("issuer_name", "")
                # Handle combined IDs like "63474+77969"
                for iid in re.split(r"[+,]", raw_id):
                    iid = iid.strip()
                    if iid and iname:
                        name_map[iid][state] = iname
    return name_map


def main() -> None:
    log.info("=== build_sbm_plan_intelligence.py ===")

    carriers: dict[str, dict[str, dict]] = defaultdict(dict)

    # ── Step 1: Parse SBM PUF zips ────────────────────────────────────────────
    zip_files = sorted(RAW_PUF_DIR.glob("*sbepuf*.zip"))
    log.info("Found %d SBM PUF zip files in %s", len(zip_files), RAW_PUF_DIR)

    puf_states_covered: set[str] = set()
    for zip_path in zip_files:
        state = state_from_zip_name(zip_path.stem)
        if not state:
            log.warning("Cannot determine state for %s — skip", zip_path.name)
            continue

        puf_data = load_sbm_puf_zip(zip_path, state)
        for iid, info in puf_data.items():
            carriers[iid][state] = info
        puf_states_covered.add(state)

    log.info("PUF states covered: %d — %s", len(puf_states_covered),
             sorted(puf_states_covered))

    # ── Step 2: Manual plan counts for states without PUF zips ───────────────
    manual_states = SBM_STATES - puf_states_covered
    log.info("States needing manual plan counts: %s", sorted(manual_states))

    for state in sorted(manual_states):
        manual = MANUAL_PLAN_COUNTS.get(state, {})
        if not manual:
            log.warning("  %s: no manual plan counts defined — state will have no SBM coverage", state)
            continue
        for iid, (name, plan_count) in manual.items():
            carriers[iid][state] = {
                "name":       name,
                "plan_count": plan_count,
                "source":     "manual",
            }
            log.info("  %s / %s: %s  plan_count=%d (manual)", state, iid, name, plan_count)

    # ── Step 3: Fill in carrier names from formulary_sbm metadata ─────────────
    sbm_names = load_sbm_formulary_carrier_names()
    filled = 0
    for iid, state_names in sbm_names.items():
        for state, name in state_names.items():
            if iid in carriers and state in carriers[iid]:
                if not carriers[iid][state].get("name") or carriers[iid][state]["name"].startswith("Issuer "):
                    carriers[iid][state]["name"] = name
                    filled += 1
    log.info("  Carrier names filled from formulary_sbm metadata: %d", filled)

    # ── Step 4: Build summary stats ────────────────────────────────────────────
    total_carriers = len(carriers)
    total_pairs    = sum(len(v) for v in carriers.values())
    states_covered = {state for v in carriers.values() for state in v}

    log.info("Total: %d issuers, %d carrier-state pairs, %d states",
             total_carriers, total_pairs, len(states_covered))

    missing_sbm = SBM_STATES - states_covered
    if missing_sbm:
        log.warning("SBM states with no carriers: %s", sorted(missing_sbm))

    # ── Step 5: Write output ───────────────────────────────────────────────────
    output = {
        "metadata": {
            "description": "Carrier plan counts for SBM-sourced states. Merged into plan_map by build_formulary_state_drug_summaries.py.",
            "sbm_states":  sorted(SBM_STATES),
            "states_covered": sorted(states_covered),
            "total_issuers": total_carriers,
            "total_carrier_state_pairs": total_pairs,
            "sources": {
                "sbm_puf":  "SBM PUF Plans/Rates CSV from CMS SBE PUF zip files (2025 vintage)",
                "manual":   "Approximate plan counts from CMS Plan Finder 2026 data — update when 2026 PUF zips available",
            },
            "generated_at": pd.Timestamp.now().isoformat(),
        },
        "carriers": {iid: dict(v) for iid, v in sorted(carriers.items())},
    }

    with OUTPUT_FILE.open("w", encoding="utf-8") as fh:
        json.dump(output, fh, indent=2)
    size_mb = OUTPUT_FILE.stat().st_size / (1024 * 1024)
    log.info("Wrote %s (%.2f MB)", OUTPUT_FILE.relative_to(REPO_ROOT), size_mb)


if __name__ == "__main__":
    main()
