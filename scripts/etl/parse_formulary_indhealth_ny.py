"""Parse Independent Health NY Drug Formulary I PDF and merge into formulary_sbm_NY.json.

Source: fm.formularynavigator.com/FBO/43/2026DrugFormulary1.pdf
Issuer: Independent Health (HIOS 18029, 13 plans)
Format: Two-column text layout. Each drug line: "drug_name TIER NOTES"
  Tier = 1/2/3, Notes = PA/ST/QL/SP/MM/AL/LDD etc.

Note: PDF states "large group employers" but this is the only available
Independent Health formulary. Drug coverage likely overlaps significantly
with IFP/Exchange plans.

Usage:
    python scripts/etl/parse_formulary_indhealth_ny.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PDF_PATH = PROJECT_ROOT / "data" / "raw" / "formulary_pdf" / "healthfirst_ny_formulary_2026.pdf"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_NY.json"

TIER_MAP = {
    "1": "GENERIC",
    "2": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND",
}

ISSUER_IDS = ["18029"]

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel",
    "stelara", "xeljanz", "otezla", "dupixent", "rinvoq", "skyrizi",
    "keytruda", "opdivo", "revlimid", "ibrance", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog",
    "novolog", "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "omeprazole", "gabapentin", "sertraline", "levothyroxine",
]

# Regex: drug name, then tier (1/2/3), then optional notes
# Drug lines end with a standalone 1, 2, or 3 (possibly followed by notes)
DRUG_LINE_RE = re.compile(
    r"^(.+?)\s+(1|2|3)(?:\s+(.+))?$"
)


def is_header_or_category(line: str) -> bool:
    """Check if line is a header, category, or non-drug text."""
    stripped = line.strip()
    if not stripped:
        return True
    if stripped.startswith("Drug Name"):
        return True
    if stripped.startswith("*") and stripped.endswith("*"):
        return True
    if stripped.startswith("PAGE ") or "LAST UPDATED" in stripped:
        return True
    if stripped.startswith("Current as of") or stripped.startswith("Effective"):
        return True
    return False


def parse_indhealth_pdf() -> list[dict]:
    """Parse Independent Health formulary using text extraction."""
    pdf = pdfplumber.open(str(PDF_PATH))
    records: list[dict] = []

    for page in pdf.pages[6:]:  # Drug tables start page 7
        text = page.extract_text()
        if not text:
            continue

        for line in text.split("\n"):
            line = line.strip()
            if not line or is_header_or_category(line):
                continue

            m = DRUG_LINE_RE.match(line)
            if not m:
                continue

            drug_name = m.group(1).strip()
            tier = m.group(2)
            notes = m.group(3) or ""
            notes = notes.strip()

            # Skip very short names or continuation lines
            if len(drug_name) < 3:
                continue
            # Skip lines that are just dosage continuations
            if drug_name.lower().startswith(("mg", "ml", "mcg", "hour", "release")):
                continue

            pa = "PA" in notes
            st = "ST" in notes
            ql = "QL" in notes
            sp = "SP" in notes

            rec = {
                "drug_name": drug_name,
                "drug_tier": TIER_MAP.get(tier, f"TIER-{tier}"),
                "prior_authorization": pa,
                "step_therapy": st,
                "quantity_limit": ql,
                "quantity_limit_detail": None,
                "specialty": sp,
                "issuer_ids": ISSUER_IDS,
                "rxnorm_id": None,
                "is_priority_drug": False,
                "source": "PDF Drug List",
                "source_file": "2026DrugFormulary1.pdf",
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

    for rec in deduped:
        name_lower = rec["drug_name"].lower()
        for pd in PRIORITY_DRUGS:
            if pd in name_lower:
                rec["is_priority_drug"] = True
                break

    return deduped


def merge_and_save(new_records: list[dict]) -> None:
    """Merge Independent Health records with existing NY data."""
    existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))
    existing_data = existing["data"]
    existing_results = existing["metadata"]["issuer_results"]

    non_ind = [
        r for r in existing_data
        if not any(iid in r.get("issuer_ids", []) for iid in ISSUER_IDS)
    ]

    all_records = non_ind + new_records
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
        tier_counts[r["drug_tier"]] = tier_counts.get(r["drug_tier"], 0) + 1

    new_result = {
        "issuer_id": "18029",
        "issuer_name": "Independent Health (NY)",
        "state_code": "NY",
        "source": "2026DrugFormulary1.pdf",
        "source_url": "https://fm.formularynavigator.com/FBO/43/2026DrugFormulary1.pdf",
        "status": "success",
        "drug_records": len(new_records),
        "note": "Drug Formulary I (large group label). Best available source for HIOS 18029.",
    }
    updated_results = [r for r in existing_results if r.get("issuer_id") != "18029"]
    updated_results.append(new_result)

    output = {
        "metadata": {
            "source": "SBM Formulary - NY (multi-issuer PDF merge)",
            "state_code": "NY",
            "plan_year": 2026,
            "issuers_attempted": len(updated_results),
            "issuers_successful": len(updated_results),
            "issuers_failed": 0,
            "raw_records": len(non_ind) + len(new_records),
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
    print(f"  Previous (non-IndHealth): {len(non_ind)} records")
    print(f"  IndHealth new: {len(new_records)} records")
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

    print(f"Parsing Independent Health NY: {PDF_PATH.name} ({PDF_PATH.stat().st_size / (1024*1024):.1f} MB)")
    records = parse_indhealth_pdf()
    print(f"Parsed {len(records)} Independent Health records")

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
