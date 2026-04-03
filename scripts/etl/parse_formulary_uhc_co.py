"""Parse UHC CO Individual & Family PDL PDF and merge into formulary_sbm_CO.json.

Source: uhc.com IFP1432766-CO_UHC_IFP_PY26.pdf
Issuer: Rocky Mountain HMO / UHC (HIOS 97879, 35 plans)
Format: Two-column layout with 4-col tables (Brand | Generic | Tier | Notes)
  Table extraction works but drug names are sometimes in separate columns.

Usage:
    python scripts/etl/parse_formulary_uhc_co.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PDF_PATH = PROJECT_ROOT / "data" / "raw" / "formulary_pdf" / "uhc_co_ifp_py26.pdf"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_CO.json"

TIER_MAP = {
    "$0": "ACA-PREVENTIVE-DRUGS",
    "1": "GENERIC",
    "2": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND",
    "4": "SPECIALTY",
    "5": "SPECIALTY-HIGH",
}

ISSUER_IDS = ["97879"]

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel",
    "stelara", "xeljanz", "otezla", "dupixent", "rinvoq", "skyrizi",
    "keytruda", "opdivo", "revlimid", "ibrance", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog",
    "novolog", "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "omeprazole", "gabapentin", "sertraline", "levothyroxine",
]

# Regex for drug lines in text: "drug_name TIER NOTES"
# Tier is a standalone number 1-5 or $0
DRUG_LINE_RE = re.compile(
    r"^(.+?)\s+(\$0|[1-5])(?:\s+(.+))?$"
)

SKIP_STARTS = [
    "Drug name", "Tier", "Notes", "Brand name", "Generic name",
    "Page ", "Pharmacy", "Individual", "Effective", "Coverage",
    "2026 ", "2025 ", "Current as of",
    "$0 Copay", "mm ", "members", "between", "years",
]


def parse_uhc_text() -> list[dict]:
    """Parse UHC CO PDL using text extraction."""
    pdf = pdfplumber.open(str(PDF_PATH))
    records: list[dict] = []

    for page in pdf.pages[8:]:  # Drug content starts around page 9
        text = page.extract_text()
        if not text:
            continue

        for line in text.split("\n"):
            line = line.strip()
            if not line or len(line) < 5:
                continue

            if any(line.startswith(s) for s in SKIP_STARTS):
                continue

            # Skip category headers (title case, no tier)
            if line[0].isupper() and not re.search(r"\b[1-5]\b", line) and not "$0" in line:
                # But allow UPPERCASE drug names (brands)
                words = line.split()
                if len(words) <= 4 and all(w[0].isupper() for w in words if w.isalpha()):
                    continue

            m = DRUG_LINE_RE.match(line)
            if not m:
                continue

            drug_name = m.group(1).strip()
            tier = m.group(2)
            notes = m.group(3) or ""

            if len(drug_name) < 3:
                continue
            # Skip continuation fragments
            if drug_name.lower().startswith(("mg", "ml", "mcg", "tablet", "capsule", "solution")):
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
                "specialty": sp or tier in ("4", "5"),
                "issuer_ids": ISSUER_IDS,
                "rxnorm_id": None,
                "is_priority_drug": False,
                "source": "PDF Drug List",
                "source_file": "IFP1432766-CO_UHC_IFP_PY26.pdf",
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
    """Merge UHC records into CO formulary."""
    existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))
    existing_data = existing["data"]
    existing_results = existing["metadata"]["issuer_results"]

    non_uhc = [r for r in existing_data if "97879" not in r.get("issuer_ids", [])]

    all_records = non_uhc + new_records
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
        "issuer_id": "97879",
        "issuer_name": "Rocky Mountain HMO / UnitedHealthcare (CO)",
        "state_code": "CO",
        "source": "IFP1432766-CO_UHC_IFP_PY26.pdf",
        "source_url": "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP1432766-CO_UHC_IFP_PY26.pdf",
        "status": "success",
        "drug_records": len(new_records),
    }
    updated = [r for r in existing_results if r.get("issuer_id") != "97879"]
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
    print(f"  Previous: {len(non_uhc)}, UHC new: {len(new_records)}")
    print(f"  Tiers: {tier_counts}")


def main() -> None:
    if not PDF_PATH.exists():
        print(f"ERROR: PDF not found at {PDF_PATH}")
        sys.exit(1)
    if not OUTPUT_PATH.exists():
        print(f"ERROR: {OUTPUT_PATH} not found")
        sys.exit(1)

    print(f"Parsing UHC CO: {PDF_PATH.name}")
    records = parse_uhc_text()
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
