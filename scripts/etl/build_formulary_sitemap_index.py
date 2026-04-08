#!/usr/bin/env python3
"""
Build the formulary sitemap index — the list of every (state-slug, drug-slug)
pair that should appear in the public XML sitemap.

Source of truth: data/processed/drug_national_baselines.json

Why this file (and not formulary_intelligence.json directly):
  - Baselines is already canonicalised: salt/ester variants merged, dose-form
    suffixes stripped. One row per real drug, not per NDC variant.
  - Baselines already merges FFE + SBM coverage into a per_state map. The
    previous sitemap builder only enumerated drugs from the FFE file and
    missed every pure-SBM state (CA, MA, MN, NY, RI, VT) plus SD.
  - The page route at app/formulary/[issuer]/[drug_name]/page.tsx already
    uses these canonical names (see PRIORITY_DRUGS) — slugs round-trip
    cleanly via slug.replace(/-/g, ' ').

Output schema (consumed by lib/data-loader.ts loadFormularySitemapIndex
and app/sitemaps/[type]/route.ts buildFormularyEntries):
  {
    "metadata": {
      "description": "...",
      "total_pairs": int,
      "unique_drugs": int,
      "unique_states": int,
      "states": ["AK", "AL", ...],          # uppercase state codes
      "generated_at": "YYYY-MM-DDTHH:MM:SS",
      "source": "drug_national_baselines.json"
    },
    "pairs": ["state-slug/drug-slug", ...]  # one entry per valid combo
  }
"""

import json
import os
import re
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "processed"
BASELINE_PATH = DATA_DIR / "drug_national_baselines.json"
OUTPUT_PATH = DATA_DIR / "formulary_sitemap_index.json"

# State code -> URL slug. All 51 jurisdictions (50 states + DC).
STATE_NAMES = {
    "AL": "alabama", "AK": "alaska", "AZ": "arizona", "AR": "arkansas",
    "CA": "california", "CO": "colorado", "CT": "connecticut", "DE": "delaware",
    "DC": "district-of-columbia", "FL": "florida", "GA": "georgia", "HI": "hawaii",
    "ID": "idaho", "IL": "illinois", "IN": "indiana", "IA": "iowa",
    "KS": "kansas", "KY": "kentucky", "LA": "louisiana", "ME": "maine",
    "MD": "maryland", "MA": "massachusetts", "MI": "michigan", "MN": "minnesota",
    "MS": "mississippi", "MO": "missouri", "MT": "montana", "NE": "nebraska",
    "NV": "nevada", "NH": "new-hampshire", "NJ": "new-jersey", "NM": "new-mexico",
    "NY": "new-york", "NC": "north-carolina", "ND": "north-dakota", "OH": "ohio",
    "OK": "oklahoma", "OR": "oregon", "PA": "pennsylvania", "RI": "rhode-island",
    "SC": "south-carolina", "SD": "south-dakota", "TN": "tennessee", "TX": "texas",
    "UT": "utah", "VT": "vermont", "VA": "virginia", "WA": "washington",
    "WV": "west-virginia", "WI": "wisconsin", "WY": "wyoming",
}


_SLUG_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_SLUG_MULTI_HYPHEN = re.compile(r"-+")


def drug_name_to_slug(name: str) -> str:
    """
    Convert a canonical drug name from baselines to a URL slug.

    Canonical names are already lowercase, hyphenated for combos
    ("amphetamine-dextroamphetamine"), and have salt/ester suffixes stripped
    by canonicalize_base_drug() in generate_drug_baselines.py. So in most
    cases the slug is just the input. We still run it through the same
    sanitiser the page route uses to be safe against any oddballs.
    """
    s = name.strip().strip('"').lower()
    if not s:
        return ""
    s = _SLUG_NON_ALNUM.sub("-", s)
    s = _SLUG_MULTI_HYPHEN.sub("-", s)
    return s.strip("-")


def is_publishable_slug(slug: str) -> bool:
    """
    Drop slugs that are NDC dose-form variants rather than real drug names.

    The canonicaliser in generate_drug_baselines.py tries to merge dose-form
    rows like "0.5 ML HEPARIN SODIUM 10000 UNT-ML PREFILLED SYRINGE" back into
    "heparin", but it cannot collapse every CMS row (different strengths,
    vaccines with per-strain breakdowns, combo injectables). Anything that
    survives in baselines with a leading digit is a dose-form variant, not a
    drug the public page can render usefully — slugs starting with a digit
    are almost always garbage like "0-5-ml-...-prefilled-syringe".

    Real canonical drugs (metformin, ozempic, amphetamine-dextroamphetamine,
    abacavir-lamivudine, ...) always begin with a letter.
    """
    if not slug or len(slug) < 2:
        return False
    if slug[0].isdigit():
        return False
    return True


def main() -> None:
    t0 = time.time()
    print("=" * 60)
    print("Building formulary sitemap index from drug_national_baselines.json")
    print("=" * 60)

    if not BASELINE_PATH.exists():
        raise SystemExit(
            f"ERROR: {BASELINE_PATH} not found. Run "
            f"scripts/generate/generate_drug_baselines.py first."
        )

    print(f"\nLoading {BASELINE_PATH.name} ...")
    with open(BASELINE_PATH, "r", encoding="utf-8") as f:
        baselines_obj = json.load(f)
    raw = baselines_obj.get("data", baselines_obj)
    print(f"  {len(raw):,} canonical drugs in baselines")

    # ── Build pairs ────────────────────────────────────────────────────────
    # Dedup with a set: multiple canonical drugs can slug to the same value
    # after aggressive normalisation, so we keep each (state, slug) pair unique.
    pair_set: set[str] = set()
    states_seen: set[str] = set()
    drugs_seen: set[str] = set()
    skipped_no_slug = 0
    skipped_dose_form = 0
    skipped_no_state_slug = 0

    for drug_name, entry in raw.items():
        slug = drug_name_to_slug(drug_name)
        if not slug or len(slug) < 2:
            skipped_no_slug += 1
            continue
        if not is_publishable_slug(slug):
            skipped_dose_form += 1
            continue

        per_state = entry.get("per_state", {})
        if not isinstance(per_state, dict) or not per_state:
            continue

        added_for_drug = False
        for state_code in per_state.keys():
            sc = state_code.upper().strip()
            if sc not in STATE_NAMES:
                skipped_no_state_slug += 1
                continue
            state_slug = STATE_NAMES[sc]
            pair_set.add(f"{state_slug}/{slug}")
            states_seen.add(sc)
            added_for_drug = True

        if added_for_drug:
            drugs_seen.add(slug)

    # Sort for deterministic output (helpful for diff-based code review)
    pairs = sorted(pair_set)

    print(f"\n  Built {len(pairs):,} (state, drug) pairs")
    print(f"  {len(drugs_seen):,} unique drug slugs")
    print(f"  {len(states_seen)} unique states")
    if skipped_no_slug:
        print(f"  Skipped {skipped_no_slug} drugs (could not generate slug)")
    if skipped_dose_form:
        print(f"  Skipped {skipped_dose_form} drugs (dose-form variants — leading digit)")
    if skipped_no_state_slug:
        print(f"  Skipped {skipped_no_state_slug} state references (unknown state code)")

    missing_states = sorted(set(STATE_NAMES.keys()) - states_seen)
    if missing_states:
        print(f"  WARNING: {len(missing_states)} states have no drugs: {missing_states}")

    # ── Write output ───────────────────────────────────────────────────────
    print(f"\nWriting {OUTPUT_PATH.name} ...")
    output = {
        "metadata": {
            "description": "All canonical (state-slug, drug-slug) pairs for the formulary sitemap",
            "source": "drug_national_baselines.json",
            "total_pairs": len(pairs),
            "unique_drugs": len(drugs_seen),
            "unique_states": len(states_seen),
            "states": sorted(states_seen),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        },
        "pairs": pairs,
    }
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    file_mb = os.path.getsize(OUTPUT_PATH) / 1_048_576
    elapsed = time.time() - t0
    print(f"  Wrote {OUTPUT_PATH} ({file_mb:.1f} MB)")
    print(f"  Elapsed: {elapsed:.1f}s")
    print(f"\n{'=' * 60}")
    print(f"DONE — {len(pairs):,} formulary URLs across {len(states_seen)} states")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
