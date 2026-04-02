"""Parse Anthem NY Select Drug List PDF and merge into formulary_sbm_NY.json.

Source: FormularyNavigator FBO/143/2026_Select_3_Tier_NY_ABS_IND.pdf
Issuer: Anthem Health Plans of New York (HIOS 41046)
Format: 3-column (Drug Name | Tier | Notes), 3-tier (Tier 1/2/3)

Usage:
    python scripts/etl/parse_formulary_anthem_ny.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PDF_PATH = PROJECT_ROOT / "data" / "raw" / "formulary_pdf" / "anthem_ny_select_3tier_ind_2026.pdf"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_NY.json"

TIER_MAP = {
    "Tier 1": "GENERIC",
    "Tier 2": "PREFERRED-BRAND",
    "Tier 3": "NON-PREFERRED-BRAND",
}

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel",
    "stelara", "xeljanz", "otezla", "dupixent", "rinvoq", "skyrizi",
    "keytruda", "opdivo", "revlimid", "ibrance", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog",
    "novolog", "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "omeprazole", "gabapentin", "sertraline", "levothyroxine",
]


def parse_notes(notes_str: str) -> tuple[bool, bool, bool, bool]:
    """Parse Notes column into PA, ST, QL, SP flags."""
    if not notes_str:
        return False, False, False, False
    n = notes_str.replace("\n", " ").strip()
    return "PA" in n, "ST" in n, "QL" in n, "SP" in n


def parse_anthem_pdf() -> list[dict]:
    """Parse Anthem NY 3-tier Select Drug List PDF."""
    pdf = pdfplumber.open(str(PDF_PATH))
    records: list[dict] = []

    for page in pdf.pages[6:]:  # Drug tables start page 7
        tables = page.extract_tables()
        for table in tables:
            if not table or len(table[0]) < 3:
                continue
            for row in table:
                drug = str(row[0] or "").strip().replace("\n", " ")
                tier = str(row[1] or "").strip()
                notes = str(row[2] or "").strip()

                # Skip headers and category rows
                if drug == "Drug Name" or tier == "Tier":
                    continue
                if not tier and drug:
                    continue
                if tier not in TIER_MAP:
                    continue

                pa, st, ql, sp = parse_notes(notes)
                is_preventive = "$0" in drug or "$0" in notes
                final_tier = "ACA-PREVENTIVE-DRUGS" if is_preventive else TIER_MAP[tier]

                rec = {
                    "drug_name": drug,
                    "drug_tier": final_tier,
                    "prior_authorization": pa,
                    "step_therapy": st,
                    "quantity_limit": ql,
                    "quantity_limit_detail": None,
                    "specialty": sp,
                    "issuer_ids": ["41046"],
                    "rxnorm_id": None,
                    "is_priority_drug": False,
                    "source": "PDF Drug List",
                    "source_file": "2026_Select_3_Tier_NY_ABS_IND.pdf",
                    "state_code": "NY",
                    "plan_year": 2026,
                }
                records.append(rec)

    pdf.close()

    # Dedup within Anthem records
    seen: dict[tuple, bool] = {}
    deduped: list[dict] = []
    for rec in records:
        key = (
            rec["drug_name"].lower(),
            rec["drug_tier"],
            rec["prior_authorization"],
            rec["step_therapy"],
            rec["quantity_limit"],
        )
        if key not in seen:
            seen[key] = True
            deduped.append(rec)

    # Flag priority drugs
    for rec in deduped:
        name_lower = rec["drug_name"].lower()
        for pd in PRIORITY_DRUGS:
            if pd in name_lower:
                rec["is_priority_drug"] = True
                break

    return deduped


def merge_and_save(anthem_records: list[dict]) -> None:
    """Merge Anthem records with existing Fidelis data in formulary_sbm_NY.json."""
    # Load existing data
    existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))
    existing_data = existing["data"]

    # Filter out any previous Anthem records (in case of re-run)
    fidelis_only = [r for r in existing_data if "41046" not in r.get("issuer_ids", [])]

    # Merge all records, dedup across issuers
    all_records = fidelis_only + anthem_records
    merged: dict[tuple, dict] = {}
    for rec in all_records:
        key = (
            rec["drug_name"].lower(),
            rec["drug_tier"],
            rec["prior_authorization"],
            rec["step_therapy"],
            rec["quantity_limit"],
        )
        if key not in merged:
            merged[key] = {
                "drug_name": rec["drug_name"],
                "drug_tier": rec["drug_tier"],
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
                "state_code": "NY",
                "plan_year": 2026,
            }
        else:
            m = merged[key]
            for iid in rec.get("issuer_ids", []):
                m["issuer_ids"].add(iid)
            if rec.get("is_priority_drug"):
                m["is_priority_drug"] = True
            if rec.get("quantity_limit_detail") and not m.get("quantity_limit_detail"):
                m["quantity_limit_detail"] = rec["quantity_limit_detail"]

    # Sort and serialize
    sorted_keys = sorted(merged.keys(), key=lambda k: k[0].lower())
    final: list[dict] = []
    for key in sorted_keys:
        m = merged[key]
        m["issuer_ids"] = sorted(m["issuer_ids"])
        final.append(m)

    unique_issuers = {iid for r in final for iid in r["issuer_ids"]}
    tier_counts = {}
    for r in final:
        t = r["drug_tier"]
        tier_counts[t] = tier_counts.get(t, 0) + 1

    output = {
        "metadata": {
            "source": "SBM Formulary - NY (multi-issuer PDF merge)",
            "state_code": "NY",
            "plan_year": 2026,
            "issuers_attempted": 2,
            "issuers_successful": 2,
            "issuers_failed": 0,
            "raw_records": len(fidelis_only) + len(anthem_records),
            "deduped_records": len(final),
            "unique_drug_names": len({r["drug_name"].lower() for r in final}),
            "unique_issuers": len(unique_issuers),
            "tier_breakdown": tier_counts,
            "pa_count": sum(1 for r in final if r["prior_authorization"]),
            "ql_count": sum(1 for r in final if r["quantity_limit"]),
            "st_count": sum(1 for r in final if r["step_therapy"]),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "schema_version": "1.0",
            "issuer_results": [
                {
                    "issuer_id": "25303",
                    "issuer_name": "Ambetter from Fidelis Care (NY)",
                    "state_code": "NY",
                    "source": "QHP-2026-formulary-Fidelis-Care.pdf",
                    "status": "success",
                    "drug_records": len(fidelis_only),
                },
                {
                    "issuer_id": "41046",
                    "issuer_name": "Anthem Health Plans of New York (Elevance Health)",
                    "state_code": "NY",
                    "source": "2026_Select_3_Tier_NY_ABS_IND.pdf",
                    "source_url": "https://fm.formularynavigator.com/FBO/143/2026_Select_3_Tier_NY_ABS_IND.pdf",
                    "status": "success",
                    "drug_records": len(anthem_records),
                },
            ],
        },
        "data": final,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    print(f"Merged output: {len(final)} records, {len(unique_issuers)} issuers, {size_mb:.1f} MB")
    print(f"  Fidelis: {len(fidelis_only)} records")
    print(f"  Anthem:  {len(anthem_records)} records")
    print(f"  Tiers:   {tier_counts}")
    print(f"  PA={output['metadata']['pa_count']}, "
          f"ST={output['metadata']['st_count']}, "
          f"QL={output['metadata']['ql_count']}")


def main() -> None:
    if not PDF_PATH.exists():
        print(f"ERROR: PDF not found at {PDF_PATH}")
        sys.exit(1)
    if not OUTPUT_PATH.exists():
        print(f"ERROR: Existing formulary not found at {OUTPUT_PATH}")
        sys.exit(1)

    print(f"Parsing Anthem NY formulary: {PDF_PATH.name}")
    anthem_records = parse_anthem_pdf()
    print(f"Parsed {len(anthem_records)} Anthem records")

    # Tier breakdown
    tier_counts = {}
    for r in anthem_records:
        t = r["drug_tier"]
        tier_counts[t] = tier_counts.get(t, 0) + 1
    print(f"Anthem tiers: {tier_counts}")
    print(f"PA: {sum(1 for r in anthem_records if r['prior_authorization'])}, "
          f"ST: {sum(1 for r in anthem_records if r['step_therapy'])}, "
          f"QL: {sum(1 for r in anthem_records if r['quantity_limit'])}, "
          f"SP: {sum(1 for r in anthem_records if r['specialty'])}")

    print(f"\nMerging with existing data in {OUTPUT_PATH.name}...")
    merge_and_save(anthem_records)
    print("Done.")


if __name__ == "__main__":
    main()
