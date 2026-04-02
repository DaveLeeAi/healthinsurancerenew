"""Parse Excellus BCBS NY 3-Tier Open Formulary PDF and merge into formulary_sbm_NY.json.

Source: fm.formularynavigator.com/FBO/251/Excellus_3_Tier_Open_Formulary_2950_v26.pdf
Issuers: Excellus BCBS (HIOS 40064 + 78124, combined 116 plans)
Format: 3-column (Product Description | Tier 1/2/3 | Limits/Restrictions/Notes)

Usage:
    python scripts/etl/parse_formulary_excellus_ny.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PDF_PATH = PROJECT_ROOT / "data" / "raw" / "formulary_pdf" / "Excellus_3_Tier_Open_Formulary_2950_v26.pdf"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_NY.json"

TIER_MAP = {
    "1": "GENERIC",
    "2": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND",
}

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel",
    "stelara", "xeljanz", "otezla", "dupixent", "rinvoq", "skyrizi",
    "keytruda", "opdivo", "revlimid", "ibrance", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog",
    "novolog", "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "omeprazole", "gabapentin", "sertraline", "levothyroxine",
]

# Both Excellus HIOS IDs — they share the same formulary
ISSUER_IDS = ["40064", "78124"]


def parse_excellus_pdf() -> list[dict]:
    """Parse Excellus BCBS NY 3-Tier Open Formulary PDF."""
    pdf = pdfplumber.open(str(PDF_PATH))
    records: list[dict] = []

    for page in pdf.pages[4:]:  # Drug tables start around page 5-6
        tables = page.extract_tables()
        for table in tables:
            if not table:
                continue
            ncols = len(table[0])
            if ncols < 3:
                continue
            for row in table:
                drug = str(row[0] or "").strip().replace("\n", " ")
                tier = str(row[1] or "").strip()
                notes = str(row[2] or "").strip().replace("\n", " ")

                # Skip headers
                if drug == "Product Description" or tier == "Tier":
                    continue
                # Category rows (no tier, all caps with no numbers)
                if not tier and drug:
                    continue
                if tier not in TIER_MAP:
                    continue

                pa = "PA" in notes if notes else False
                st = "ST" in notes if notes else False
                ql = "QL" in notes if notes else False
                sp = "SP" in notes or "S" == notes.strip() if notes else False

                rec = {
                    "drug_name": drug,
                    "drug_tier": TIER_MAP[tier],
                    "prior_authorization": pa,
                    "step_therapy": st,
                    "quantity_limit": ql,
                    "quantity_limit_detail": None,
                    "specialty": sp,
                    "issuer_ids": ISSUER_IDS,
                    "rxnorm_id": None,
                    "is_priority_drug": False,
                    "source": "PDF Drug List",
                    "source_file": "Excellus_3_Tier_Open_Formulary_2950_v26.pdf",
                    "state_code": "NY",
                    "plan_year": 2026,
                }
                records.append(rec)

    pdf.close()

    # Dedup
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


def merge_and_save(excellus_records: list[dict]) -> None:
    """Merge Excellus records with existing NY data."""
    existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))
    existing_data = existing["data"]
    existing_results = existing["metadata"]["issuer_results"]

    # Filter out any previous Excellus records
    non_excellus = [
        r for r in existing_data
        if not any(iid in r.get("issuer_ids", []) for iid in ISSUER_IDS)
    ]

    # Merge all records
    all_records = non_excellus + excellus_records
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

    sorted_keys = sorted(merged.keys(), key=lambda k: k[0].lower())
    final: list[dict] = []
    for key in sorted_keys:
        m = merged[key]
        m["issuer_ids"] = sorted(m["issuer_ids"])
        final.append(m)

    unique_issuers = {iid for r in final for iid in r["issuer_ids"]}
    tier_counts: dict[str, int] = {}
    for r in final:
        t = r["drug_tier"]
        tier_counts[t] = tier_counts.get(t, 0) + 1

    excellus_result = {
        "issuer_id": "40064+78124",
        "issuer_name": "Excellus BlueCross BlueShield (NY) + HealthNow BCBS WNY",
        "state_code": "NY",
        "source": "Excellus_3_Tier_Open_Formulary_2950_v26.pdf",
        "source_url": "https://fm.formularynavigator.com/FBO/251/Excellus_3_Tier_Open_Formulary_2950_v26.pdf",
        "status": "success",
        "drug_records": len(excellus_records),
    }
    new_results = [
        r for r in existing_results
        if r.get("issuer_id") not in ("40064", "78124", "40064+78124")
    ]
    new_results.append(excellus_result)

    output = {
        "metadata": {
            "source": "SBM Formulary - NY (multi-issuer PDF merge)",
            "state_code": "NY",
            "plan_year": 2026,
            "issuers_attempted": len(new_results),
            "issuers_successful": len(new_results),
            "issuers_failed": 0,
            "raw_records": len(non_excellus) + len(excellus_records),
            "deduped_records": len(final),
            "unique_drug_names": len({r["drug_name"].lower() for r in final}),
            "unique_issuers": len(unique_issuers),
            "tier_breakdown": tier_counts,
            "pa_count": sum(1 for r in final if r["prior_authorization"]),
            "ql_count": sum(1 for r in final if r["quantity_limit"]),
            "st_count": sum(1 for r in final if r["step_therapy"]),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "schema_version": "1.0",
            "issuer_results": new_results,
        },
        "data": final,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    print(f"Merged: {len(final)} records, {len(unique_issuers)} issuers, {size_mb:.1f} MB")
    print(f"  Previous (non-Excellus): {len(non_excellus)} records")
    print(f"  Excellus new: {len(excellus_records)} records")
    print(f"  Tiers: {tier_counts}")
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

    print(f"Parsing Excellus BCBS NY: {PDF_PATH.name} ({PDF_PATH.stat().st_size / (1024*1024):.1f} MB)")
    records = parse_excellus_pdf()
    print(f"Parsed {len(records)} Excellus records")

    tier_counts: dict[str, int] = {}
    for r in records:
        t = r["drug_tier"]
        tier_counts[t] = tier_counts.get(t, 0) + 1
    print(f"Excellus tiers: {tier_counts}")
    print(f"PA: {sum(1 for r in records if r['prior_authorization'])}, "
          f"ST: {sum(1 for r in records if r['step_therapy'])}, "
          f"QL: {sum(1 for r in records if r['quantity_limit'])}, "
          f"SP: {sum(1 for r in records if r['specialty'])}")

    print(f"\nMerging with existing data in {OUTPUT_PATH.name}...")
    merge_and_save(records)
    print("Done.")


if __name__ == "__main__":
    main()
