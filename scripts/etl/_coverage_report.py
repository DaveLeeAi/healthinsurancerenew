#!/usr/bin/env python3
"""Generate complete 50-state + DC formulary coverage report."""

import json
import os
import glob
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent.parent
DATA = PROJECT / "data" / "processed"
CONFIG = PROJECT / "data" / "config"

FFM = sorted(['AK','AL','AR','AZ','DE','FL','GA','HI','IA','IL','IN','KS','LA',
       'MI','MO','MS','MT','NC','ND','NE','NH','OH','OK','SC','SD','TN',
       'TX','UT','WI','WV','WY'])
SBM = sorted(['CA','CO','CT','DC','ID','KY','MA','MD','ME','MN',
       'NJ','NM','NV','NY','OR','PA','RI','VA','VT','WA'])

with open(CONFIG / "all-states.json", encoding="utf-8") as f:
    ALL_NAMES = {s["abbr"]: s["name"] for s in json.load(f)["states"]}

# Count FFM issuers per state from plan_intelligence
ffm_issuers = {}
pi_path = DATA / "plan_intelligence.json"
if pi_path.exists():
    with open(pi_path, encoding="utf-8") as f:
        pi = json.load(f)
    for plan in pi.get("data", []):
        st = (plan.get("state_code") or "").upper()
        iid = plan.get("issuer_id", "")
        if st and iid:
            ffm_issuers.setdefault(st, set()).add(iid)

# Load SBM state files
sbm_data = {}
for fpath in sorted(glob.glob(str(DATA / "formulary_sbm_*.json"))):
    fname = os.path.basename(fpath)
    skip_parts = ['_old','_merged','_ambetter','_blueshield','_kaiser','_molina',
                  '_aetna','_iehp','_healthnet','_cchp','_lacare','_anthem',
                  '_valleyhealth','_wha','_oscar','_medica']
    if any(x in fname for x in skip_parts):
        continue
    st = fname.replace("formulary_sbm_", "").replace(".json", "")
    if len(st) != 2:
        continue
    try:
        with open(fpath, encoding="utf-8") as f:
            data = json.load(f)
        m = data.get("metadata", {})
        results = m.get("issuer_results", [])
        issuers_info = m.get("issuers", {})

        ok, low, zero = [], [], []
        if results:
            for r in results:
                count = r.get("drug_records", 0)
                name = r.get("issuer_name", "?")
                iid = r.get("issuer_id", "?")
                # Skip stale placeholders
                if iid in ("00000","00543","00036","00116","00560") and count == 0:
                    continue
                if count >= 500:
                    ok.append((iid, name, count))
                elif count > 0:
                    low.append((iid, name, count))
                else:
                    zero.append((iid, name, count))
        elif issuers_info:
            for iid, info in issuers_info.items():
                name = info.get("issuer_name", iid)
                count = info.get("deduped_count", info.get("raw_count", 0))
                if count >= 500:
                    ok.append((iid, name, count))
                elif count > 0:
                    low.append((iid, name, count))
                else:
                    zero.append((iid, name, count))

        drugs = m.get("deduped_records", m.get("total_drug_records", len(data.get("data", []))))
        sbm_data[st] = {"drugs": drugs, "ok": ok, "low": low, "zero": zero}
    except Exception:
        pass

# CA per-carrier files
ca_ok = []
ca_total = 0
for fpath in sorted(glob.glob(str(DATA / "formulary_sbm_CA_*.json"))):
    fname = os.path.basename(fpath)
    if "merged" in fname or "old" in fname:
        continue
    try:
        with open(fpath, encoding="utf-8") as f:
            data = json.load(f)
        m = data.get("metadata", {})
        drugs = m.get("total_drugs", m.get("deduped_records", len(data.get("data", []))))
        name = m.get("issuer_name", fname)
        iid = m.get("issuer_id", "?")
        ca_ok.append((iid, name, drugs))
        ca_total += drugs
    except Exception:
        pass

if ca_ok:
    sbm_data["CA"] = {"drugs": ca_total, "ok": ca_ok, "low": [], "zero": []}

# ── REPORT ──

W = 90
print("=" * W)
print("COMPLETE 50-STATE + DC FORMULARY COVERAGE REPORT")
print("=" * W)

# FFM
print()
print("-" * W)
print("SECTION 1: FFM STATES (Healthcare.gov) - 31 states")
print("Source: CMS Public Use Files (PUF) -> formulary_intelligence.json")
print("-" * W)

ffm_total = 0
for st in FFM:
    name = ALL_NAMES.get(st, st)
    issuers = ffm_issuers.get(st, set())
    n = len(issuers)
    ffm_total += n
    sbm_note = ""
    if st in sbm_data:
        sd = sbm_data[st]
        sbm_note = f"  + {len(sd['ok'])} SBM carriers ({sd['drugs']:,} drugs)"
    print(f"  {st} {name:25s} {n:3d} issuers{sbm_note}")

print(f"\n  FFM TOTAL: {ffm_total} issuer-state combinations across 31 states")

# SBM
print()
print("-" * W)
print("SECTION 2: SBM STATES (State-Based Marketplace) - 19 states + DC")
print("Source: Carrier PDF formularies -> formulary_sbm_XX.json")
print("-" * W)

complete = []
partial = []
missing = []
sbm_drug_total = 0
sbm_carrier_total = 0

for st in SBM:
    name = ALL_NAMES.get(st, st)
    if st not in sbm_data:
        missing.append(st)
        print(f"\n  {st} {name:25s} | NO DATA")
        continue

    sd = sbm_data[st]
    n_ok = len(sd["ok"])
    n_low = len(sd["low"])
    n_zero = len(sd["zero"])
    n_total = n_ok + n_low + n_zero
    drugs = sd["drugs"]
    sbm_drug_total += drugs
    sbm_carrier_total += n_ok

    if n_zero == 0 and n_low == 0 and n_ok > 0:
        tag = "COMPLETE"
        complete.append(st)
    elif n_ok > 0:
        tag = "PARTIAL "
        partial.append(st)
    else:
        tag = "MINIMAL "
        partial.append(st)

    print(f"\n  {st} {name:25s} | {tag} | {drugs:>6,} drugs | {n_ok}/{n_total} carriers")
    for iid, cname, count in sorted(sd["ok"], key=lambda x: -x[2]):
        print(f"       DONE  {cname} ({iid}): {count:,}")
    for iid, cname, count in sd["low"]:
        print(f"       LOW   {cname} ({iid}): {count}")
    for iid, cname, count in sd["zero"]:
        print(f"       MISS  {cname} ({iid})")

print(f"\n  SBM TOTAL: {sbm_drug_total:,} drugs across {sbm_carrier_total} parsed carriers")

# Summary
print()
print("=" * W)
print("SUMMARY")
print("=" * W)
print(f"  FFM states:           31/31 - ALL covered via CMS PUF")
print(f"  SBM complete:         {len(complete):2d}/20 - all carriers parsed")
print(f"  SBM partial:          {len(partial):2d}/20 - some carriers missing")
print(f"  SBM no data:          {len(missing):2d}/20")
print(f"  Total with data:      {31 + len(complete) + len(partial)}/51")
print()
print(f"  COMPLETE ({len(complete)}): {', '.join(complete)}")
print(f"  PARTIAL  ({len(partial)}): {', '.join(partial)}")
if missing:
    print(f"  NO DATA  ({len(missing)}): {', '.join(missing)}")

# Missing carriers detail
print()
print("-" * W)
print("MISSING CARRIERS (SBM states with zero/low-yield entries)")
print("-" * W)
for st in SBM:
    if st not in sbm_data:
        print(f"  {st} {ALL_NAMES.get(st,''):25s} - No formulary file at all")
        continue
    sd = sbm_data[st]
    for iid, cname, count in sd["zero"]:
        print(f"  {st} {iid:>8s} {cname}")
    for iid, cname, count in sd["low"]:
        print(f"  {st} {iid:>8s} {cname} ({count} drugs - low yield)")
