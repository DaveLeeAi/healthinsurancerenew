"""Parse Denver Health Medical Plan (Elevate) Commercial Formulary PDF for CO.

Source: denverhealthmedicalplan.org Q1 2026 Commercial formulary
Issuer: Elevate Health Plans / Denver Health (HIOS 66699, 8 plans)
Format: 7-column sparse table (Drug Name | brand | | Tier | | Requirements | )

Note: This is the DHHA Employee (commercial) formulary, used as proxy because
the 2026 Exchange formulary is not published (page broken 404).

Usage:
    python scripts/etl/parse_formulary_denverhealth_co.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PDF_PATH = PROJECT_ROOT / "data" / "raw" / "formulary_pdf" / "denverhealth_co_commercial_formulary_2026.pdf"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_CO.json"

TIER_MAP = {
    "1": "GENERIC",
    "2": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND",
    "4": "SPECIALTY",
    "PREV": "ACA-PREVENTIVE-DRUGS",
}

ISSUER_IDS = ["66699"]

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel",
    "stelara", "xeljanz", "otezla", "dupixent", "rinvoq", "skyrizi",
    "keytruda", "opdivo", "revlimid", "ibrance", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog",
    "novolog", "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "omeprazole", "gabapentin", "sertraline", "levothyroxine",
]


def parse_denverhealth_pdf() -> list[dict]:
    """Parse Denver Health Commercial Formulary PDF."""
    pdf = pdfplumber.open(str(PDF_PATH))
    records: list[dict] = []

    for page in pdf.pages[12:]:  # Drug tables start around page 13-14
        tables = page.extract_tables()
        for table in tables:
            if not table or len(table) < 2:
                continue
            ncols = len(table[0])
            if ncols < 4:
                continue

            for row in table:
                drug = str(row[0] or "").strip().replace("\n", " ")
                # Tier is in col 3 for 7-col, col 1 for 3-col
                if ncols >= 7:
                    tier = str(row[3] or "").strip()
                    notes = str(row[5] or "").strip().replace("\n", " ") if ncols > 5 else ""
                elif ncols >= 4:
                    tier = str(row[2] or "").strip() or str(row[3] or "").strip()
                    notes = str(row[3] or "").strip().replace("\n", " ")
                else:
                    tier = str(row[1] or "").strip()
                    notes = str(row[2] or "").strip().replace("\n", " ") if ncols > 2 else ""

                # Skip headers
                if drug == "Drug Name" or "Drug Tier" in tier:
                    continue
                if not drug or len(drug) < 3:
                    continue
                if tier not in TIER_MAP:
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
                    "specialty": sp or tier == "4",
                    "issuer_ids": ISSUER_IDS,
                    "rxnorm_id": None,
                    "is_priority_drug": False,
                    "source": "PDF Drug List",
                    "source_file": "denverhealth_co_commercial_formulary_2026.pdf",
                    "state_code": "CO",
                    "plan_year": 2026,
                }
                records.append(rec)

    pdf.close()

    # Dedup
    seen: dict[tuple, bool] = {}
    deduped: list[dict] = []
    for rec in records:
        key = (rec["drug_name"].lower(), rec["drug_tier"],
               rec["prior_authorization"], rec["step_therapy"], rec["quantity_limit"])
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
    """Merge Denver Health records into CO formulary."""
    existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))
    existing_data = existing["data"]
    existing_results = existing["metadata"]["issuer_results"]

    non_dh = [r for r in existing_data if "66699" not in r.get("issuer_ids", [])]

    all_records = non_dh + new_records
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
                "state_code": "CO", "plan_year": 2026,
            }
        else:
            m = merged[key]
            for iid in rec.get("issuer_ids", []):
                m["issuer_ids"].add(iid)
            if rec.get("is_priority_drug"):
                m["is_priority_drug"] = True

    sorted_keys = sorted(merged.keys(), key=lambda k: k[0].lower())
    final = [dict(merged[k], issuer_ids=sorted(merged[k]["issuer_ids"])) for k in sorted_keys]

    unique_issuers = {iid for r in final for iid in r["issuer_ids"]}
    tier_counts: dict[str, int] = {}
    for r in final:
        tier_counts[r["drug_tier"]] = tier_counts.get(r["drug_tier"], 0) + 1

    new_result = {
        "issuer_id": "66699",
        "issuer_name": "Elevate Health Plans / Denver Health Medical Plan (CO)",
        "state_code": "CO",
        "source": "denverhealth_co_commercial_formulary_2026.pdf",
        "source_url": "https://www.denverhealthmedicalplan.org/sites/default/files/resources/document/Q1%202026%20Commercial%20formulary.pdf",
        "status": "success",
        "drug_records": len(new_records),
        "note": "Commercial/employee formulary used as proxy — 2026 Exchange formulary page broken (404). PBM: MedImpact for Exchange, internal for Commercial.",
    }
    updated = [r for r in existing_results if r.get("issuer_id") != "66699"]
    updated.append(new_result)

    output = {
        "metadata": {
            "source": "SBM Formulary - CO (multi-issuer PDF merge)",
            "state_code": "CO", "plan_year": 2026,
            "issuers_attempted": len(updated), "issuers_successful": len(updated),
            "issuers_failed": 0,
            "raw_records": len(all_records), "deduped_records": len(final),
            "unique_drug_names": len({r["drug_name"].lower() for r in final}),
            "unique_issuers": len(unique_issuers),
            "tier_breakdown": tier_counts,
            "pa_count": sum(1 for r in final if r["prior_authorization"]),
            "ql_count": sum(1 for r in final if r["quantity_limit"]),
            "st_count": sum(1 for r in final if r["step_therapy"]),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "schema_version": "1.0",
            "issuer_results": updated,
        },
        "data": final,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    print(f"Merged: {len(final)} records, {len(unique_issuers)} issuers, {size_mb:.1f} MB")
    print(f"  Previous: {len(non_dh)}, Denver Health: {len(new_records)}")
    print(f"  Tiers: {tier_counts}")


def main() -> None:
    if not PDF_PATH.exists():
        print(f"ERROR: PDF not found at {PDF_PATH}")
        sys.exit(1)
    if not OUTPUT_PATH.exists():
        print(f"ERROR: {OUTPUT_PATH} not found")
        sys.exit(1)

    print(f"Parsing Denver Health CO: {PDF_PATH.name} ({PDF_PATH.stat().st_size / (1024*1024):.1f} MB)")
    records = parse_denverhealth_pdf()
    print(f"Parsed {len(records)} records")

    tier_counts: dict[str, int] = {}
    for r in records:
        tier_counts[r["drug_tier"]] = tier_counts.get(r["drug_tier"], 0) + 1
    print(f"Tiers: {tier_counts}")
    print(f"PA={sum(1 for r in records if r['prior_authorization'])}, "
          f"ST={sum(1 for r in records if r['step_therapy'])}, "
          f"QL={sum(1 for r in records if r['quantity_limit'])}")

    print("\nMerging...")
    merge_and_save(records)
    print("Done.")


if __name__ == "__main__":
    main()
