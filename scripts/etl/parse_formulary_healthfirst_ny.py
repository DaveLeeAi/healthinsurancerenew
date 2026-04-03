"""Parse Healthfirst NY NYSOH Comprehensive Drug List PDF and merge into formulary_sbm_NY.json.

Source: assets.healthfirst.org 2026-leaf-leaf-premier-ep-hmo-nysoh-formulary-english
Issuer: Healthfirst (HIOS 91237, 25 plans)
Format: 4-column (empty | Drug Name | Drug Tier 0/1/2/3 | Requirements/Limits)

Usage:
    python scripts/etl/parse_formulary_healthfirst_ny.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PDF_PATH = PROJECT_ROOT / "data" / "raw" / "formulary_pdf" / "healthfirst_ny_nysoh_formulary_2026_fixed.pdf"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_NY.json"

TIER_MAP = {
    "0": "ACA-PREVENTIVE-DRUGS",
    "1": "GENERIC",
    "2": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND",
}

ISSUER_IDS = ["91237"]

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel",
    "stelara", "xeljanz", "otezla", "dupixent", "rinvoq", "skyrizi",
    "keytruda", "opdivo", "revlimid", "ibrance", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog",
    "novolog", "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "omeprazole", "gabapentin", "sertraline", "levothyroxine",
]


def parse_healthfirst_pdf() -> list[dict]:
    """Parse Healthfirst NYSOH formulary PDF."""
    pdf = pdfplumber.open(str(PDF_PATH))
    records: list[dict] = []

    for page in pdf.pages[6:]:  # Drug tables start page 7
        tables = page.extract_tables()
        for table in tables:
            if not table:
                continue
            ncols = len(table[0])
            if ncols < 3:
                continue
            for row in table:
                if ncols >= 4:
                    drug = str(row[1] or "").strip().replace("\n", " ")
                    tier = str(row[2] or "").strip()
                    notes = str(row[3] or "").strip().replace("\n", " ")
                else:
                    drug = str(row[0] or "").strip().replace("\n", " ")
                    tier = str(row[1] or "").strip()
                    notes = str(row[2] or "").strip().replace("\n", " ")

                if drug == "Drug Name" or tier in ("Drug Tier", "Drug"):
                    continue
                if not tier and drug:
                    continue
                if tier not in TIER_MAP:
                    continue
                if not drug or len(drug) < 3:
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

                rec = {
                    "drug_name": drug,
                    "drug_tier": TIER_MAP[tier],
                    "prior_authorization": pa,
                    "step_therapy": st,
                    "quantity_limit": ql,
                    "quantity_limit_detail": ql_detail,
                    "specialty": sp,
                    "issuer_ids": ISSUER_IDS,
                    "rxnorm_id": None,
                    "is_priority_drug": False,
                    "source": "PDF Drug List",
                    "source_file": "healthfirst_nysoh_formulary_2026.pdf",
                    "state_code": "NY",
                    "plan_year": 2026,
                }
                records.append(rec)

    pdf.close()

    seen: dict[tuple, bool] = {}
    deduped: list[dict] = []
    for rec in records:
        key = (
            rec["drug_name"].lower(), rec["drug_tier"],
            rec["prior_authorization"], rec["step_therapy"], rec["quantity_limit"],
        )
        if key not in seen:
            seen[key] = True
            deduped.append(rec)

    for rec in deduped:
        name_lower = rec["drug_name"].lower()
        for pd in PRIORITY_DRUGS:
            if pd in name_lower:
                rec["is_priority_drug"] = True
                break

    return deduped


def merge_and_save(new_records: list[dict]) -> None:
    """Merge Healthfirst records with existing NY data."""
    existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))
    existing_data = existing["data"]
    existing_results = existing["metadata"]["issuer_results"]

    non_hf = [r for r in existing_data if "91237" not in r.get("issuer_ids", [])]

    all_records = non_hf + new_records
    merged: dict[tuple, dict] = {}
    for rec in all_records:
        key = (
            rec["drug_name"].lower(), rec["drug_tier"],
            rec["prior_authorization"], rec["step_therapy"], rec["quantity_limit"],
        )
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
                "state_code": "NY", "plan_year": 2026,
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

    new_result = {
        "issuer_id": "91237",
        "issuer_name": "Healthfirst (NY) — NYSOH Comprehensive Drug List",
        "state_code": "NY",
        "source": "healthfirst_nysoh_formulary_2026.pdf",
        "source_url": "https://assets.healthfirst.org/pdf_wKm3xvi0oXWk/2026-leaf-leaf-premier-ep-hmo-nysoh-formulary-english",
        "status": "success",
        "drug_records": len(new_records),
    }
    updated_results = [r for r in existing_results if r.get("issuer_id") != "91237"]
    updated_results.append(new_result)

    output = {
        "metadata": {
            "source": "SBM Formulary - NY (multi-issuer PDF merge)",
            "state_code": "NY", "plan_year": 2026,
            "issuers_attempted": len(updated_results),
            "issuers_successful": len(updated_results),
            "issuers_failed": 0,
            "raw_records": len(non_hf) + len(new_records),
            "deduped_records": len(final),
            "unique_drug_names": len({r["drug_name"].lower() for r in final}),
            "unique_issuers": len(unique_issuers),
            "tier_breakdown": tier_counts,
            "pa_count": sum(1 for r in final if r["prior_authorization"]),
            "ql_count": sum(1 for r in final if r["quantity_limit"]),
            "st_count": sum(1 for r in final if r["step_therapy"]),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "schema_version": "1.0",
            "issuer_results": updated_results,
        },
        "data": final,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    print(f"Merged: {len(final)} records, {len(unique_issuers)} issuers, {size_mb:.1f} MB")
    print(f"  Previous (non-Healthfirst): {len(non_hf)} records")
    print(f"  Healthfirst new: {len(new_records)} records")
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

    print(f"Parsing Healthfirst NY: {PDF_PATH.name} ({PDF_PATH.stat().st_size / (1024*1024):.1f} MB)")
    records = parse_healthfirst_pdf()
    print(f"Parsed {len(records)} Healthfirst records")

    tier_counts: dict[str, int] = {}
    for r in records:
        tier_counts[r["drug_tier"]] = tier_counts.get(r["drug_tier"], 0) + 1
    print(f"Tiers: {tier_counts}")
    print(f"PA: {sum(1 for r in records if r['prior_authorization'])}, "
          f"ST: {sum(1 for r in records if r['step_therapy'])}, "
          f"QL: {sum(1 for r in records if r['quantity_limit'])}, "
          f"SP: {sum(1 for r in records if r['specialty'])}")

    print(f"\nMerging with existing data in {OUTPUT_PATH.name}...")
    merge_and_save(records)
    print("Done.")


if __name__ == "__main__":
    main()
