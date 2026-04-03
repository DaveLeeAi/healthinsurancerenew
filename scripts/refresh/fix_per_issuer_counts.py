"""
Fix per-issuer drugs_parsed counts in the registry using ground truth from data files.
Also check for FFE carrier names for the master reference.
"""
import json
import os
import glob
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REGISTRY_PATH = os.path.join(ROOT, "data", "config", "formulary-url-registry-2026.json")

# Map from data file issuer_ids to registry hios_prefix
# Some issuers use different IDs in data vs registry
ISSUER_TO_HIOS = {
    # IL
    "99167": "27833",  # Centene IL uses 99167 in data, 27833 in registry
    # NJ
    "99166": "17970",  # Centene NJ
    # NV
    "99169": "95865",  # Actually SilverSummit/Ambetter NV (Centene), but also covers 43314
    # WA
    "99164": "61836",  # Centene WA (Coordinated Care)
    "87718": "71281",  # Cambia/Regence WA secondary HIOS
    # KY
    "99168": "72001",  # Centene KY JSON
    # PA
    "99165": "15983",  # Centene PA JSON
    "93909": "19702",  # Jefferson Health PA secondary
    # DC
    "86052": "94506",  # Kaiser DC secondary
    "45532": "28137",  # CareFirst DC secondary
    "94084": "28137",  # CareFirst DC tertiary
    # GA
    "70893": "45495",  # Ambetter GA secondary
    # OR
    "77969": "63474",  # Cambia/Regence OR secondary
    # NY
    "92551": "94788",  # CDPHP NY secondary
    "78124": "40064",  # Excellus NY secondary
    # MD
    "90296": "90296",  # Kaiser MAS PDF (keep as-is)
    # MN
    "30242": "85736",  # UCare MN
    "31822": "70373",  # Quartz MN
}


def get_per_issuer_counts():
    """Get per-issuer drug counts from all SBM data files."""
    all_counts = {}
    for f in sorted(glob.glob(os.path.join(ROOT, "data", "processed", "formulary_sbm_*.json"))):
        bn = os.path.basename(f)
        if "_merged" in bn or "_old" in bn:
            continue
        parts = bn.replace(".json", "").split("_")
        if len(parts) >= 4 and parts[2].upper() == "CA" and len(parts[2]) == 2:
            continue
        if "WI_medica" in bn:
            continue
        st = parts[2].upper() if len(parts) >= 3 else "?"
        if len(st) != 2:
            continue

        data = json.load(open(f, encoding="utf-8"))
        drugs = data.get("data", [])

        issuer_counts = Counter()
        for d in drugs:
            iids = d.get("issuer_ids", [])
            if isinstance(iids, list):
                for iid in iids:
                    issuer_counts[str(iid)] += 1
            elif iids:
                issuer_counts[str(iids)] += 1

        all_counts[st] = dict(issuer_counts)
    return all_counts


def main():
    reg = json.load(open(REGISTRY_PATH, encoding="utf-8"))
    issuer_counts = get_per_issuer_counts()

    updates = 0
    for state, state_info in reg["states"].items():
        if state_info.get("exchange_type") == "FFE":
            continue
        state_counts = issuer_counts.get(state, {})
        if not state_counts:
            continue

        for carrier in state_info.get("carriers", []):
            hios = carrier.get("hios_prefix", "")
            if not hios or hios in ("ALL", "MULTIPLE"):
                continue

            # Direct match
            count = state_counts.get(hios, None)

            # Try reverse mapping (registry HIOS -> data file issuer ID)
            if count is None:
                for data_id, reg_hios in ISSUER_TO_HIOS.items():
                    if reg_hios == hios and data_id in state_counts:
                        count = state_counts[data_id]
                        break

            if count is not None:
                old = carrier.get("drugs_parsed") or 0
                if old != count:
                    print(f"  {state}/{hios} ({carrier['carrier_name'][:30]}): {old} -> {count}")
                    carrier["drugs_parsed"] = count
                    updates += 1

    print(f"\nUpdated {updates} carrier drug counts")

    # Save
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(reg, f, indent=2, ensure_ascii=False)
    print("Saved registry.")


if __name__ == "__main__":
    main()
