"""Parse Oscar GA 6-tier formulary and merge into formulary_sbm_GA.json."""

import json
import re
import sys
import time
import gc
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PDF_PATH = PROJECT_ROOT / "data" / "raw" / "formulary_pdf" / "oscar_ga_6t_formulary_2026.pdf"
OUTPUT = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_GA.json"

TIER_MAP = {
    "0": "ACA-PREVENTIVE-DRUGS", "1A": "GENERIC", "1B": "GENERIC", "1": "GENERIC",
    "2": "PREFERRED-BRAND", "3": "NON-PREFERRED-BRAND", "4": "SPECIALTY", "5": "SPECIALTY-HIGH",
}

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel", "stelara", "xeljanz",
    "otezla", "dupixent", "rinvoq", "skyrizi", "keytruda", "opdivo", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog", "novolog",
    "metformin", "atorvastatin", "lisinopril", "amlodipine", "omeprazole", "gabapentin",
    "sertraline", "levothyroxine",
]


def parse_oscar():
    pdf = pdfplumber.open(str(PDF_PATH))
    records = []
    for page in pdf.pages[8:]:
        for table in page.extract_tables():
            if not table or len(table[0]) < 3:
                continue
            ncols = len(table[0])
            for row in table:
                drug = str(row[1] if ncols >= 4 else row[0] or "").strip().replace("\n", " ")
                tier = str(row[2] if ncols >= 4 else row[1] or "").strip()
                notes = str(row[3] if ncols >= 4 else (row[2] if ncols > 2 else "") or "").strip().replace("\n", " ")
                if drug == "Drug Name" or "Drug Tier" in tier:
                    continue
                if not drug or len(drug) < 3 or tier not in TIER_MAP:
                    continue
                ql_detail = None
                if "QL" in notes:
                    m = re.search(r"QL\s*\(([^)]+)\)", notes)
                    if m:
                        ql_detail = m.group(1).strip()
                records.append({
                    "drug_name": drug, "drug_tier": TIER_MAP[tier],
                    "prior_authorization": "PA" in notes, "step_therapy": "ST" in notes,
                    "quantity_limit": "QL" in notes, "quantity_limit_detail": ql_detail,
                    "specialty": tier in ("4", "5"), "issuer_ids": ["58081"],
                    "rxnorm_id": None, "is_priority_drug": False,
                    "source": "PDF Drug List",
                    "source_file": "Oscar_6T_GA_STND_Member_Doc_April_2026.pdf",
                    "state_code": "GA", "plan_year": 2026,
                })
    pdf.close()

    seen = {}
    deduped = []
    for rec in records:
        key = (rec["drug_name"].lower(), rec["drug_tier"], rec["prior_authorization"],
               rec["step_therapy"], rec["quantity_limit"])
        if key not in seen:
            seen[key] = True
            deduped.append(rec)
    for rec in deduped:
        for pd in PRIORITY_DRUGS:
            if pd in rec["drug_name"].lower():
                rec["is_priority_drug"] = True
                break
    return deduped


def main():
    print(f"Parsing Oscar GA: {PDF_PATH.name}")
    deduped = parse_oscar()
    tc = {}
    for r in deduped:
        tc[r["drug_tier"]] = tc.get(r["drug_tier"], 0) + 1
    print(f"Oscar GA: {len(deduped)} drugs, tiers: {tc}")

    # Read existing GA - memory efficient
    gc.collect()
    print("Reading existing GA file...")
    with open(OUTPUT, "rb") as f:
        raw_str = f.read().decode("utf-8")

    # Extract metadata/issuer_results
    results_match = re.search(r'"issuer_results":\[(.+?)\]', raw_str)
    existing_results = json.loads("[" + results_match.group(1) + "]") if results_match else []

    # Extract data records
    data_start = raw_str.find('"data":[') + len('"data":[')
    data_end = raw_str.rfind("]")
    data_section = raw_str[data_start:data_end]
    del raw_str
    gc.collect()

    record_strs = data_section.split("},{")
    del data_section
    gc.collect()

    non_oscar = []
    for rs in record_strs:
        s = rs.strip()
        if not s.startswith("{"):
            s = "{" + s
        if not s.endswith("}"):
            s = s + "}"
        try:
            rec = json.loads(s)
            if "58081" not in rec.get("issuer_ids", []):
                non_oscar.append(rec)
        except json.JSONDecodeError:
            pass

    del record_strs
    gc.collect()
    print(f"Non-Oscar: {len(non_oscar)}, Oscar new: {len(deduped)}")

    # Merge
    all_recs = non_oscar + deduped
    merged = {}
    for rec in all_recs:
        key = (rec["drug_name"].lower(), rec["drug_tier"], rec["prior_authorization"],
               rec["step_therapy"], rec["quantity_limit"])
        if key not in merged:
            merged[key] = dict(rec, issuer_ids=set(rec.get("issuer_ids", [])))
        else:
            for iid in rec.get("issuer_ids", []):
                merged[key]["issuer_ids"].add(iid)
            if rec.get("is_priority_drug"):
                merged[key]["is_priority_drug"] = True
            if rec.get("rxnorm_id") and not merged[key].get("rxnorm_id"):
                merged[key]["rxnorm_id"] = rec["rxnorm_id"]

    sorted_keys = sorted(merged.keys(), key=lambda k: k[0].lower())
    final = [dict(merged[k], issuer_ids=sorted(merged[k]["issuer_ids"])) for k in sorted_keys]
    unique_issuers = {iid for r in final for iid in r["issuer_ids"]}
    tier_final = {}
    for r in final:
        tier_final[r["drug_tier"]] = tier_final.get(r["drug_tier"], 0) + 1

    old_results = [r for r in existing_results if r.get("issuer_id") != "58081"]
    old_results.append({
        "issuer_id": "58081", "issuer_name": "Oscar Health (GA)",
        "state_code": "GA", "source": "Oscar_6T_GA_STND_Member_Doc_April_2026.pdf",
        "source_url": "https://assets.ctfassets.net/plyq12u1bv8a/1BRyy9wlIB2GkFVaATc5Or/e3492bf8adca3b47da8e3ac20060b0af/Oscar_6T_GA_STND_Member_Doc__April_2026__as_of_03252026.pdf",
        "status": "success", "drug_records": len(deduped),
    })

    output = {
        "metadata": {
            "source": "SBM Formulary - GA (multi-source merge)",
            "state_code": "GA", "plan_year": 2026,
            "issuers_attempted": len(old_results),
            "issuers_successful": len(old_results),
            "issuers_failed": 0,
            "raw_records": len(all_recs),
            "deduped_records": len(final),
            "unique_drug_names": len({r["drug_name"].lower() for r in final}),
            "unique_issuers": len(unique_issuers),
            "tier_breakdown": tier_final,
            "pa_count": sum(1 for r in final if r["prior_authorization"]),
            "ql_count": sum(1 for r in final if r["quantity_limit"]),
            "st_count": sum(1 for r in final if r["step_therapy"]),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "schema_version": "1.0",
            "issuer_results": old_results,
        },
        "data": final,
    }

    del merged, all_recs, non_oscar
    gc.collect()

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    size_mb = OUTPUT.stat().st_size / (1024 * 1024)
    print(f"Merged: {len(final)} records, {len(unique_issuers)} issuers, {size_mb:.1f} MB")
    print(f"Tiers: {tier_final}")
    print("GA COMPLETE")


if __name__ == "__main__":
    main()
