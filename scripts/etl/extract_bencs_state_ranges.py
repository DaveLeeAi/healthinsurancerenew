"""
extract_bencs_state_ranges.py
──────────────────────────────
Extract state-level preferred-brand Rx copay ranges from CMS BenCS PUF.
Output: data/processed/bencs_preferred_brand_rx_ranges.json

Used by build_formulary_state_drug_summaries.py as Priority-2 source for
cost_range_after_deductible when drug_cost_ranges.json has no entry.

Usage:
    python scripts/etl/extract_bencs_state_ranges.py
"""
import pandas as pd
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
CSV_PATH = REPO / "data/raw/puf/benefits-and-cost-sharing-puf.csv"
OUT_PATH = REPO / "data/processed/bencs_preferred_brand_rx_ranges.json"

print("Loading BenCS PUF preferred-brand rows...")
df = pd.read_csv(
    CSV_PATH,
    low_memory=False,
    usecols=["BusinessYear", "StateCode", "PlanId", "BenefitName",
             "CopayInnTier1", "CoinsInnTier1"],
    dtype={"PlanId": str},
)
df = df[df["BusinessYear"] == 2026].copy()
pb = df[df["BenefitName"].fillna("").str.lower().str.contains("preferred brand", na=False)].copy()
print(f"Preferred brand rows: {len(pb):,}  ({pb['StateCode'].nunique()} states)")


def parse_dollar(val):
    """Return (amount, after_deductible). None if not parseable as dollar copay."""
    if pd.isna(val):
        return None, None
    s = str(val).strip().lower()
    if s in ("not applicable", "n/a", "nan", "", "-"):
        return None, None
    after_ded = "after deductible" in s or "after the deductible" in s
    if "no charge" in s:
        return 0.0, after_ded
    if "not covered" in s:
        return None, None
    # Dollar copay
    m = re.search(r"\$(\d+(?:,\d{3})*(?:\.\d+)?)", s)
    if m:
        return float(m.group(1).replace(",", "")), after_ded
    # Coinsurance (%) — skip
    return None, None


after_vals_by_state = {}
all_vals_by_state = {}

for _, row in pb.iterrows():
    state = str(row.get("StateCode", "") or "").strip().upper()
    if not state or len(state) != 2:
        continue
    for col in ("CopayInnTier1", "CoinsInnTier1"):
        amt, after = parse_dollar(row.get(col))
        if amt is None or amt == 0:  # skip $0/No Charge for range calc
            continue
        if amt > 500:  # sanity: preferred brand copay can't be $500+
            continue
        all_vals_by_state.setdefault(state, []).append(amt)
        if after:
            after_vals_by_state.setdefault(state, []).append(amt)

print()
print(f"{'State':<6} {'After-ded low-high (N)':<25} {'All-copay low-high (N)':<25}")
print("-" * 60)

result = {}
all_states = sorted(set(list(all_vals_by_state) + list(after_vals_by_state)))
for state in all_states:
    all_v  = all_vals_by_state.get(state, [])
    aft_v  = after_vals_by_state.get(state, [])
    primary = aft_v if aft_v else all_v
    if not primary:
        continue
    low  = int(min(primary))
    high = int(max(primary))
    aft_str = f"{int(min(aft_v))}-{int(max(aft_v))} ({len(aft_v)})" if aft_v else "—"
    all_str = f"{int(min(all_v))}-{int(max(all_v))} ({len(all_v)})" if all_v else "—"
    print(f"  {state}    {aft_str:<23} {all_str}")
    result[state] = {
        "low": low,
        "high": high,
        "n_copay_values": len(primary),
        "source": "bencs_puf_2026_preferred_brand_rx",
    }

output = {
    "metadata": {
        "description": (
            "State-level preferred-brand Rx copay ranges extracted from CMS Benefits and Cost "
            "Sharing PUF (PY2026). Represents after-deductible copay range for preferred-brand "
            "drug tier across all ACA plans in the state. Used by "
            "build_formulary_state_drug_summaries.py as Priority-2 source for "
            "cost_range_after_deductible when drug_cost_ranges.json has no entry."
        ),
        "source_file": "data/raw/puf/benefits-and-cost-sharing-puf.csv",
        "plan_year": 2026,
        "states": sorted(result.keys()),
        "state_count": len(result),
        "generated_at": "2026-04-22",
    },
    "states": result,
}

with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2)
print()
print(f"Wrote {len(result)} states to {OUT_PATH.name}")
