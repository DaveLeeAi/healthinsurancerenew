"""Parse MVP Health Care NY Marketplace Formulary PDF and merge into formulary_sbm_NY.json.

Source: mvphealthcare.com marketplace-pharmacy-formulary-2026.pdf
Issuer: MVP Health Care (HIOS 56184, 28 plans)
Format: 4-column (empty | Drug Name | Drug Tier 1-3 | Requirements/Limits)

Usage:
    python scripts/etl/parse_formulary_mvp_ny.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PDF_PATH = PROJECT_ROOT / "data" / "raw" / "formulary_pdf" / "mvp_ny_marketplace_formulary_2026.pdf"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_NY.json"

TIER_MAP = {
    "0": "ACA-PREVENTIVE-DRUGS",
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


def parse_mvp_pdf() -> list[dict]:
    """Parse MVP NY Marketplace Formulary PDF."""
    pdf = pdfplumber.open(str(PDF_PATH))
    records: list[dict] = []

    for page in pdf.pages[17:]:  # Drug tables start page 18
        tables = page.extract_tables()
        for table in tables:
            if not table:
                continue
            ncols = len(table[0])
            if ncols < 3:
                continue
            for row in table:
                # Handle 4-col (empty|name|tier|reqs) and 5-col variants
                if ncols >= 4:
                    drug = str(row[1] or "").strip().replace("\n", " ")
                    tier = str(row[2] or "").strip()
                    reqs = str(row[3] or "").strip().replace("\n", " ")
                else:
                    drug = str(row[0] or "").strip().replace("\n", " ")
                    tier = str(row[1] or "").strip()
                    reqs = str(row[2] or "").strip().replace("\n", " ")

                # Skip headers/categories
                if drug == "Drug Name" or tier in ("Drug Tier", "Drug"):
                    continue
                if not tier and drug:
                    continue
                if tier not in TIER_MAP:
                    continue

                pa = "PA" in reqs if reqs else False
                st = "ST" in reqs if reqs else False
                ql = "QL" in reqs if reqs else False
                sp = "SP" in reqs if reqs else False

                ql_detail = None
                if ql:
                    m = re.search(r"QL\s*\(([^)]+)\)", reqs)
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
                    "issuer_ids": ["56184"],
                    "rxnorm_id": None,
                    "is_priority_drug": False,
                    "source": "PDF Drug List",
                    "source_file": "marketplace-pharmacy-formulary-2026.pdf",
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


def merge_and_save(mvp_records: list[dict]) -> None:
    """Merge MVP records with existing NY data."""
    existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))
    existing_data = existing["data"]
    existing_results = existing["metadata"]["issuer_results"]

    # Filter out any previous MVP records
    non_mvp = [r for r in existing_data if "56184" not in r.get("issuer_ids", [])]

    # Merge all records
    all_records = non_mvp + mvp_records
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

    mvp_result = {
        "issuer_id": "56184",
        "issuer_name": "MVP Health Care (NY)",
        "state_code": "NY",
        "source": "marketplace-pharmacy-formulary-2026.pdf",
        "source_url": "https://www.mvphealthcare.com/-/media/project/mvp/healthcare/documents/formularies/2026/marketplace-pharmacy-formulary-2026.pdf",
        "status": "success",
        "drug_records": len(mvp_records),
    }
    new_results = [r for r in existing_results if r.get("issuer_id") != "56184"]
    new_results.append(mvp_result)

    output = {
        "metadata": {
            "source": "SBM Formulary - NY (multi-issuer PDF merge)",
            "state_code": "NY",
            "plan_year": 2026,
            "issuers_attempted": len(new_results),
            "issuers_successful": len(new_results),
            "issuers_failed": 0,
            "raw_records": len(non_mvp) + len(mvp_records),
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
    print(f"  Previous (non-MVP): {len(non_mvp)} records")
    print(f"  MVP new: {len(mvp_records)} records")
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

    print(f"Parsing MVP NY formulary: {PDF_PATH.name} ({PDF_PATH.stat().st_size / (1024*1024):.1f} MB)")
    mvp_records = parse_mvp_pdf()
    print(f"Parsed {len(mvp_records)} MVP records")

    tier_counts: dict[str, int] = {}
    for r in mvp_records:
        t = r["drug_tier"]
        tier_counts[t] = tier_counts.get(t, 0) + 1
    print(f"MVP tiers: {tier_counts}")
    print(f"PA: {sum(1 for r in mvp_records if r['prior_authorization'])}, "
          f"ST: {sum(1 for r in mvp_records if r['step_therapy'])}, "
          f"QL: {sum(1 for r in mvp_records if r['quantity_limit'])}, "
          f"SP: {sum(1 for r in mvp_records if r['specialty'])}")

    print(f"\nMerging with existing data in {OUTPUT_PATH.name}...")
    merge_and_save(mvp_records)
    print("Done.")


if __name__ == "__main__":
    main()
