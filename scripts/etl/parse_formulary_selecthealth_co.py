"""Parse SelectHealth CO 6-tier RxCore formulary PDF (text layout).

Source: selecthealth.org colorado-tier6-rxcore.pdf
Issuer: SelectHealth (HIOS 55584, 20 plans)
Format: Two-column text layout grouped by category.
  Drug lines: "DrugName Dosageform TIER (PA)(ST)(QL)(M)(AGE)"

Usage:
    python scripts/etl/parse_formulary_selecthealth_co.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PDF_PATH = PROJECT_ROOT / "data" / "raw" / "formulary_pdf" / "selecthealth_co_tier6_rxcore_2026.pdf"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_CO.json"

TIER_MAP = {
    "1": "GENERIC",
    "2": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND",
    "4": "SPECIALTY",
    "5": "SPECIALTY",
    "6": "SPECIALTY-HIGH",
}

ISSUER_IDS = ["55584"]

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel",
    "stelara", "xeljanz", "otezla", "dupixent", "rinvoq", "skyrizi",
    "keytruda", "opdivo", "revlimid", "ibrance", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog",
    "novolog", "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "omeprazole", "gabapentin", "sertraline", "levothyroxine",
]

# Drug line regex: drug name, then tier number, then optional restrictions in parens
DRUG_LINE_RE = re.compile(
    r"^(.+?)\s+([1-6])(?:\s+(.+))?$"
)

SKIP_WORDS = [
    "Drug Name", "Drug Requirements", "Tier", "& Limits", "Effective as of",
    "selecthealth", "RxCore", "Prescription drug list", "LEGEND",
    "Coverage of drugs", "Preauthorization", "Step Therapy", "Quantity",
    "Mail Order", "Age Limit", "Specialty", "PRO TIP", "Drug costs",
    "commonly prescribed", "member account", "drug search", "formulary",
    "Your formulary", "drugs on lower", "preventive medications",
    "no-out-of-pocket", "contraception", "fluoride", "aspirin",
    "gastrointestinal", "folic acid", "iron supplement", "bowel prep",
    "tobacco cessation", "vitamin D", "statin",
]


def is_category(line: str) -> bool:
    """Check if line is a category header (ALL CAPS, no tier number at end)."""
    stripped = line.strip()
    if not stripped or len(stripped) < 3:
        return False
    if stripped.isupper() and not re.search(r"\b[1-6]$", stripped):
        return True
    return False


def parse_selecthealth_pdf() -> list[dict]:
    """Parse SelectHealth CO formulary using text extraction."""
    pdf = pdfplumber.open(str(PDF_PATH))
    records: list[dict] = []

    for page in pdf.pages[1:]:  # Drug data starts page 2
        text = page.extract_text()
        if not text:
            continue

        for line in text.split("\n"):
            line = line.strip()
            if not line or len(line) < 5:
                continue

            # Skip known non-drug lines
            if any(line.startswith(sw) or sw in line for sw in SKIP_WORDS):
                continue
            if is_category(line):
                continue

            m = DRUG_LINE_RE.match(line)
            if not m:
                continue

            drug_name = m.group(1).strip()
            tier = m.group(2)
            rest = m.group(3) or ""

            # Skip very short names or dosage fragments
            if len(drug_name) < 3:
                continue

            pa = "(PA)" in rest or "PA" in rest.split(";")
            st = "(ST)" in rest or "ST" in rest.split(";")
            ql = "(QL)" in rest or "QL" in rest.split(";")
            sp = "(SP)" in rest

            rec = {
                "drug_name": drug_name,
                "drug_tier": TIER_MAP.get(tier, f"TIER-{tier}"),
                "prior_authorization": pa,
                "step_therapy": st,
                "quantity_limit": ql,
                "quantity_limit_detail": None,
                "specialty": sp or tier in ("4", "5", "6"),
                "issuer_ids": ISSUER_IDS,
                "rxnorm_id": None,
                "is_priority_drug": False,
                "source": "PDF Drug List",
                "source_file": "selecthealth_co_tier6_rxcore_2026.pdf",
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
    """Merge SelectHealth records into CO formulary."""
    existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))
    existing_data = existing["data"]
    existing_results = existing["metadata"]["issuer_results"]

    non_sh = [r for r in existing_data if "55584" not in r.get("issuer_ids", [])]

    all_records = non_sh + new_records
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
        "issuer_id": "55584",
        "issuer_name": "SelectHealth (CO)",
        "state_code": "CO",
        "source": "selecthealth_co_tier6_rxcore_2026.pdf",
        "source_url": "https://selecthealth.org/content/dam/selecthealth/pharmacy/PDFs/colorado-tier6-rxcore.pdf",
        "status": "success",
        "drug_records": len(new_records),
    }
    updated = [r for r in existing_results if r.get("issuer_id") != "55584"]
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
    print(f"  Previous: {len(non_sh)}, SelectHealth: {len(new_records)}")
    print(f"  Tiers: {tier_counts}")


def main() -> None:
    if not PDF_PATH.exists():
        print(f"ERROR: PDF not found at {PDF_PATH}")
        sys.exit(1)
    if not OUTPUT_PATH.exists():
        print(f"ERROR: {OUTPUT_PATH} not found")
        sys.exit(1)

    print(f"Parsing SelectHealth CO: {PDF_PATH.name}")
    records = parse_selecthealth_pdf()
    print(f"Parsed {len(records)} records")

    tier_counts: dict[str, int] = {}
    for r in records:
        tier_counts[r["drug_tier"]] = tier_counts.get(r["drug_tier"], 0) + 1
    print(f"Tiers: {tier_counts}")
    pa = sum(1 for r in records if r["prior_authorization"])
    st = sum(1 for r in records if r["step_therapy"])
    ql = sum(1 for r in records if r["quantity_limit"])
    print(f"PA={pa}, ST={st}, QL={ql}")

    print("\nMerging...")
    merge_and_save(records)
    print("Done.")


if __name__ == "__main__":
    main()
