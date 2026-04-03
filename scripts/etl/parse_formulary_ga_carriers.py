"""Parse GA carrier formulary PDFs and create/update formulary_sbm_GA.json.

Carriers parsed:
- Alliant Health Plans: 3-col (Drug Name | G/P/NP/S tier | Restrictions)
- Anthem BCBS GA: 3-col (Drug Name | Tier 1-4 | Notes)
- CareSource GA: 3-col (Drug Name | Tier 1/2/3 | Restrictions/Limits)

Usage:
    python scripts/etl/parse_formulary_ga_carriers.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_GA.json"
RAW_DIR = PROJECT_ROOT / "data" / "raw" / "formulary_pdf"

TIER_MAP = {
    # Alliant codes
    "G": "GENERIC", "P": "PREFERRED-BRAND", "NP": "NON-PREFERRED-BRAND",
    "S": "SPECIALTY", "PV": "ACA-PREVENTIVE-DRUGS",
    # Anthem/CareSource tiers
    "1": "GENERIC", "Tier 1": "GENERIC",
    "2": "PREFERRED-BRAND", "Tier 2": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND", "Tier 3": "NON-PREFERRED-BRAND",
    "4": "SPECIALTY", "Tier 4": "SPECIALTY",
    "$0": "ACA-PREVENTIVE-DRUGS", "Tier 0": "ACA-PREVENTIVE-DRUGS",
}

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel",
    "stelara", "xeljanz", "otezla", "dupixent", "rinvoq", "skyrizi",
    "keytruda", "opdivo", "revlimid", "ibrance", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog",
    "novolog", "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "omeprazole", "gabapentin", "sertraline", "levothyroxine",
]


def parse_generic_tables(pdf_path: str, issuer_ids: list[str], source_file: str,
                         start_page: int, name_col: int = 0, tier_col: int = 1,
                         notes_col: int = 2) -> list[dict]:
    """Parse a standard 3-col PDF formulary."""
    pdf = pdfplumber.open(pdf_path)
    records: list[dict] = []

    for page in pdf.pages[start_page:]:
        tables = page.extract_tables()
        for table in tables:
            if not table or len(table[0]) < 2:
                continue
            ncols = len(table[0])
            for row in table:
                drug = str(row[name_col] or "").strip().replace("\n", " ")
                tier_raw = str(row[tier_col] or "").strip() if ncols > tier_col else ""
                notes = str(row[notes_col] or "").strip().replace("\n", " ") if ncols > notes_col else ""

                if drug in ("Drug Name", "DRUG NAME") or "Tier" in tier_raw and "Drug" in tier_raw:
                    continue
                if not tier_raw or not drug or len(drug) < 3:
                    continue

                tier = TIER_MAP.get(tier_raw)
                if not tier:
                    continue

                pa = "PA" in notes if notes else False
                st = "ST" in notes if notes else False
                ql = "QL" in notes if notes else False
                sp = "SP" in notes if notes else False

                ql_detail = None
                if ql and notes:
                    m = re.search(r"QL\s*\(([^)]+)\)", notes)
                    if m:
                        ql_detail = m.group(1).strip()

                records.append({
                    "drug_name": drug, "drug_tier": tier,
                    "prior_authorization": pa, "step_therapy": st,
                    "quantity_limit": ql, "quantity_limit_detail": ql_detail,
                    "specialty": sp or tier in ("SPECIALTY", "SPECIALTY-HIGH"),
                    "issuer_ids": issuer_ids, "rxnorm_id": None,
                    "is_priority_drug": False, "source": "PDF Drug List",
                    "source_file": source_file, "state_code": "GA", "plan_year": 2026,
                })

    pdf.close()

    # Dedup and flag priority
    seen: dict[tuple, bool] = {}
    deduped: list[dict] = []
    for rec in records:
        key = (rec["drug_name"].lower(), rec["drug_tier"],
               rec["prior_authorization"], rec["step_therapy"], rec["quantity_limit"])
        if key not in seen:
            seen[key] = True
            deduped.append(rec)

    for rec in deduped:
        for pd in PRIORITY_DRUGS:
            if pd in rec["drug_name"].lower():
                rec["is_priority_drug"] = True
                break

    return deduped


def merge_and_save(all_carrier_records: dict[str, list[dict]],
                   carrier_info: list[dict]) -> None:
    """Merge all carrier records into formulary_sbm_GA.json."""
    # Load existing if present
    existing_data: list[dict] = []
    existing_results: list[dict] = []
    if OUTPUT_PATH.exists():
        existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))
        existing_data = existing.get("data", [])
        existing_results = existing.get("metadata", {}).get("issuer_results", [])

    new_issuer_ids = set()
    for records in all_carrier_records.values():
        for r in records:
            new_issuer_ids.update(r.get("issuer_ids", []))

    existing_keep = [
        r for r in existing_data
        if not any(iid in r.get("issuer_ids", []) for iid in new_issuer_ids)
    ]

    all_records = existing_keep
    for records in all_carrier_records.values():
        all_records.extend(records)

    merged: dict[tuple, dict] = {}
    for rec in all_records:
        key = (rec["drug_name"].lower(), rec["drug_tier"],
               rec["prior_authorization"], rec["step_therapy"], rec["quantity_limit"])
        if key not in merged:
            merged[key] = {
                "drug_name": rec["drug_name"], "drug_tier": rec["drug_tier"],
                "prior_authorization": rec["prior_authorization"],
                "step_therapy": rec["step_therapy"],
                "quantity_limit": rec["quantity_limit"],
                "quantity_limit_detail": rec.get("quantity_limit_detail"),
                "specialty": rec.get("specialty", False),
                "issuer_ids": set(rec.get("issuer_ids", [])),
                "rxnorm_id": rec.get("rxnorm_id"),
                "is_priority_drug": rec.get("is_priority_drug", False),
                "source": rec.get("source", ""),
                "source_file": rec.get("source_file", ""),
                "state_code": "GA", "plan_year": 2026,
            }
        else:
            m = merged[key]
            for iid in rec.get("issuer_ids", []):
                m["issuer_ids"].add(iid)
            if rec.get("is_priority_drug"):
                m["is_priority_drug"] = True
            if rec.get("quantity_limit_detail") and not m.get("quantity_limit_detail"):
                m["quantity_limit_detail"] = rec["quantity_limit_detail"]

    sorted_keys = sorted(merged.keys(), key=lambda k: k[0].lower())
    final = [dict(merged[k], issuer_ids=sorted(merged[k]["issuer_ids"])) for k in sorted_keys]

    unique_issuers = {iid for r in final for iid in r["issuer_ids"]}
    tier_counts: dict[str, int] = {}
    for r in final:
        tier_counts[r["drug_tier"]] = tier_counts.get(r["drug_tier"], 0) + 1

    old_results = [
        r for r in existing_results
        if r.get("issuer_id") not in {ci["issuer_id"] for ci in carrier_info}
    ]

    output = {
        "metadata": {
            "source": "SBM Formulary - GA (multi-issuer PDF merge)",
            "state_code": "GA", "plan_year": 2026,
            "issuers_attempted": len(old_results) + len(carrier_info),
            "issuers_successful": len(old_results) + len(carrier_info),
            "issuers_failed": 0,
            "raw_records": len(all_records),
            "deduped_records": len(final),
            "unique_drug_names": len({r["drug_name"].lower() for r in final}),
            "unique_issuers": len(unique_issuers),
            "tier_breakdown": tier_counts,
            "pa_count": sum(1 for r in final if r["prior_authorization"]),
            "ql_count": sum(1 for r in final if r["quantity_limit"]),
            "st_count": sum(1 for r in final if r["step_therapy"]),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "schema_version": "1.0",
            "issuer_results": old_results + carrier_info,
        },
        "data": final,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    print(f"\nMerged: {len(final)} records, {len(unique_issuers)} issuers, {size_mb:.1f} MB")
    print(f"  Existing kept: {len(existing_keep)}")
    print(f"  Tiers: {tier_counts}")
    print(f"  PA={output['metadata']['pa_count']}, ST={output['metadata']['st_count']}, QL={output['metadata']['ql_count']}")


def main() -> None:
    all_records: dict[str, list[dict]] = {}
    carrier_info: list[dict] = []

    # 1. Alliant Health Plans — G/P/NP/S tier codes, start page 9
    alliant_path = RAW_DIR / "alliant_ga_formulary_2026.pdf"
    if alliant_path.exists():
        print(f"Parsing Alliant GA: {alliant_path.name}")
        recs = parse_generic_tables(str(alliant_path), ["51163"],
                                    "alliant_ga_formulary_2026.pdf",
                                    start_page=8)
        all_records["alliant"] = recs
        t = {}
        for r in recs:
            t[r["drug_tier"]] = t.get(r["drug_tier"], 0) + 1
        print(f"  {len(recs)} drugs, tiers: {t}")
        carrier_info.append({
            "issuer_id": "51163", "issuer_name": "Alliant Health Plans (GA)",
            "state_code": "GA",
            "source": "alliant_ga_formulary_2026.pdf",
            "source_url": "https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_Alliant_SoloCare_Drug_List.pdf",
            "status": "success", "drug_records": len(recs),
        })

    # 2. Anthem BCBS GA — Tier 1-4, start page 7
    anthem_path = RAW_DIR / "anthem_ga_formulary_2026.pdf"
    if anthem_path.exists():
        print(f"Parsing Anthem GA: {anthem_path.name}")
        recs = parse_generic_tables(str(anthem_path), ["54172"],
                                    "2026_Select_4_Tier_GA_IND.pdf",
                                    start_page=6)
        all_records["anthem"] = recs
        t = {}
        for r in recs:
            t[r["drug_tier"]] = t.get(r["drug_tier"], 0) + 1
        print(f"  {len(recs)} drugs, tiers: {t}")
        carrier_info.append({
            "issuer_id": "54172", "issuer_name": "Anthem BCBS (GA) — Elevance Health",
            "state_code": "GA",
            "source": "2026_Select_4_Tier_GA_IND.pdf",
            "source_url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_GA_IND.pdf",
            "status": "success", "drug_records": len(recs),
        })

    # 3. CareSource GA — Tier 1-3, start page 9
    cs_path = RAW_DIR / "caresource_ga_formulary_2026.pdf"
    if cs_path.exists():
        print(f"Parsing CareSource GA: {cs_path.name}")
        recs = parse_generic_tables(str(cs_path), ["72001"],
                                    "caresource_ga_marketplace_formulary_2026.pdf",
                                    start_page=8)
        all_records["caresource"] = recs
        t = {}
        for r in recs:
            t[r["drug_tier"]] = t.get(r["drug_tier"], 0) + 1
        print(f"  {len(recs)} drugs, tiers: {t}")
        carrier_info.append({
            "issuer_id": "72001", "issuer_name": "CareSource (GA)",
            "state_code": "GA",
            "source": "caresource_ga_marketplace_formulary_2026.pdf",
            "source_url": "https://www.caresource.com/documents/marketplace-2026-in-formulary.pdf",
            "status": "success", "drug_records": len(recs),
        })

    total = sum(len(r) for r in all_records.values())
    print(f"\nTotal new: {total} from {len(all_records)} carriers")

    print("Merging...")
    merge_and_save(all_records, carrier_info)
    print("Done.")


if __name__ == "__main__":
    main()
