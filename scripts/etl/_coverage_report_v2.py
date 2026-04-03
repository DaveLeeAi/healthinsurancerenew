#!/usr/bin/env python3
"""State-by-state formulary coverage report with carrier detail."""

import json
import os
import glob
from pathlib import Path

DATA = Path("data/processed")
CONFIG = Path("data/config")

with open(CONFIG / "all-states.json", encoding="utf-8") as f:
    ALL_NAMES = {s["abbr"]: s["name"] for s in json.load(f)["states"]}

FFM = set(['AK','AL','AR','AZ','DE','FL','GA','HI','IA','IL','IN','KS','LA',
           'MI','MO','MS','MT','NC','ND','NE','NH','OH','OK','SC','SD','TN',
           'TX','UT','WI','WV','WY'])
SBM = set(['CA','CO','CT','DC','ID','KY','MA','MD','ME','MN',
           'NJ','NM','NV','NY','OR','PA','RI','VA','VT','WA'])

# FFM issuers per state
ffm_issuers = {}
pi_path = DATA / "plan_intelligence.json"
if pi_path.exists():
    with open(pi_path, encoding="utf-8") as f:
        pi = json.load(f)
    for plan in pi.get("data", []):
        st = (plan.get("state_code") or "").upper()
        iid = plan.get("issuer_id", "")
        iname = plan.get("issuer_name", "")
        if st and iid:
            ffm_issuers.setdefault(st, {})[iid] = iname

# SBM data
sbm_data = {}
for fpath in sorted(glob.glob(str(DATA / "formulary_sbm_*.json"))):
    fname = os.path.basename(fpath)
    skip = ['_old','_merged','_ambetter','_blueshield','_kaiser','_molina',
            '_aetna','_iehp','_healthnet','_cchp','_lacare','_anthem',
            '_valleyhealth','_wha','_oscar','_medica']
    if any(x in fname for x in skip):
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

# CA per-carrier
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

# ── Classify each state ──
ALL = sorted(FFM | SBM)
complete = []
partial = []
nodata = []

for st in ALL:
    name = ALL_NAMES.get(st, st)
    is_ffm = st in FFM
    is_sbm = st in SBM
    ffm_n = len(ffm_issuers.get(st, {}))
    has_sbm = st in sbm_data

    if is_ffm and not has_sbm:
        if ffm_n > 0:
            complete.append(st)
        else:
            nodata.append(st)
    elif is_ffm and has_sbm:
        sd = sbm_data[st]
        if len(sd["zero"]) == 0 and len(sd["low"]) == 0:
            complete.append(st)
        else:
            partial.append(st)
    elif is_sbm and has_sbm:
        sd = sbm_data[st]
        if len(sd["zero"]) == 0 and len(sd["low"]) == 0 and len(sd["ok"]) > 0:
            complete.append(st)
        elif len(sd["ok"]) > 0:
            partial.append(st)
        else:
            nodata.append(st)
    else:
        nodata.append(st)

# ── PRINT REPORT ──

print("=" * 100)
print("COMPLETE 50-STATE + DC FORMULARY COVERAGE REPORT")
print("=" * 100)

# ── COMPLETE ──
print()
print("=" * 100)
hdr = "COMPLETE STATES (%d) -- All carriers parsed, no gaps" % len(complete)
print(hdr)
print("=" * 100)

for st in sorted(complete, key=lambda s: ALL_NAMES.get(s, s)):
    name = ALL_NAMES.get(st, st)
    is_ffm = st in FFM
    is_sbm = st in SBM
    ffm_n = len(ffm_issuers.get(st, {}))
    has_sbm = st in sbm_data

    if is_ffm and not has_sbm:
        typ = "FFM"
        print(f"\n  {st} {name} [{typ}] -- {ffm_n} issuers via Healthcare.gov PUF")
        for iid, iname in sorted(ffm_issuers.get(st, {}).items(), key=lambda x: x[1]):
            print(f"       {iname} ({iid})")
    elif is_ffm and has_sbm:
        sd = sbm_data[st]
        typ = "FFM+SBM"
        print(f"\n  {st} {name} [{typ}] -- {ffm_n} FFM issuers + {len(sd['ok'])} SBM carriers ({sd['drugs']:,} drugs)")
        for iid, cname, count in sorted(sd["ok"], key=lambda x: -x[2]):
            print(f"       {cname} ({iid}): {count:,} drugs")
    else:
        sd = sbm_data[st]
        typ = "SBM"
        print(f"\n  {st} {name} [{typ}] -- {len(sd['ok'])} carriers, {sd['drugs']:,} drugs")
        for iid, cname, count in sorted(sd["ok"], key=lambda x: -x[2]):
            print(f"       {cname} ({iid}): {count:,} drugs")

# ── PARTIAL ──
print()
print("=" * 100)
hdr2 = "PARTIAL STATES (%d) -- Some carriers missing or low yield" % len(partial)
print(hdr2)
print("=" * 100)

for st in sorted(partial, key=lambda s: ALL_NAMES.get(s, s)):
    name = ALL_NAMES.get(st, st)
    is_ffm = st in FFM
    has_sbm = st in sbm_data
    ffm_n = len(ffm_issuers.get(st, {}))

    sd = sbm_data.get(st, {"ok": [], "low": [], "zero": [], "drugs": 0})
    n_ok = len(sd["ok"])
    n_total = n_ok + len(sd["low"]) + len(sd["zero"])

    if is_ffm:
        typ = "FFM+SBM"
        print(f"\n  {st} {name} [{typ}] -- {ffm_n} FFM + {n_ok}/{n_total} SBM carriers ({sd['drugs']:,} drugs)")
    else:
        typ = "SBM"
        print(f"\n  {st} {name} [{typ}] -- {n_ok}/{n_total} carriers parsed ({sd['drugs']:,} drugs)")

    for iid, cname, count in sorted(sd["ok"], key=lambda x: -x[2]):
        print(f"     DONE   {cname} ({iid}): {count:,} drugs")
    for iid, cname, count in sd["low"]:
        print(f"     LOW    {cname} ({iid}): {count} drugs")
    for iid, cname, count in sd["zero"]:
        print(f"     MISS   {cname} ({iid})")

# ── NO DATA ──
if nodata:
    print()
    print("=" * 100)
    print("NO DATA (%d)" % len(nodata))
    print("=" * 100)
    for st in sorted(nodata, key=lambda s: ALL_NAMES.get(s, s)):
        name = ALL_NAMES.get(st, st)
        typ = "SBM" if st in SBM else "FFM"
        print(f"  {st} {name} [{typ}]")

# ── TOTALS ──
print()
print("=" * 100)
print("TOTALS")
print("=" * 100)
print(f"  Complete:  {len(complete)}/51")
print(f"  Partial:   {len(partial)}/51")
print(f"  No data:   {len(nodata)}/51")
print(f"  Coverage:  {len(complete) + len(partial)}/51 states+DC with formulary data")
