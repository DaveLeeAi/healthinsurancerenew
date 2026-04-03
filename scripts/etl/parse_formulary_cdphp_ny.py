"""Parse CDPHP NY Commercial Clinical Formulary-1 PDF and merge into formulary_sbm_NY.json.

Source: cdphp.com/-/media/files/pharmacy/formulary-1.pdf
Issuers: CDPHP (HIOS 94788, 30 plans) + CDPHP Universal Benefits (92551)
Format: Text-based layout, not table cells.
  Each drug entry: optional QL line, then "drug_name TIER restrictions" line.
  Drug line pattern: lowercase/UPPERCASE drug name, then tier 1/2/3, then PA/ST/QL/etc.

Usage:
    python scripts/etl/parse_formulary_cdphp_ny.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PDF_PATH = PROJECT_ROOT / "data" / "raw" / "formulary_pdf" / "cdphp_ny_formulary_2026.pdf"
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_NY.json"

TIER_MAP = {
    "1": "GENERIC",
    "2": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND",
}

ISSUER_IDS = ["92551", "94788"]

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel",
    "stelara", "xeljanz", "otezla", "dupixent", "rinvoq", "skyrizi",
    "keytruda", "opdivo", "revlimid", "ibrance", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog",
    "novolog", "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "omeprazole", "gabapentin", "sertraline", "levothyroxine",
]

# Lines that are restrictions/notes, not drug entries
SKIP_PATTERNS = [
    "PRODUCT DESCRIPTION", "TIER", "LIMITS & RESTRICTIONS",
    "PAGE ", "LAST UPDATED", "LIST OF COVERED",
    "OTC Over the Counter", "ACA Affordable Care Act",
]

# Regex to match a drug line: drug name followed by tier number
# The tier is a standalone 1, 2, or 3 that appears after the drug name
DRUG_LINE_RE = re.compile(
    r"^(.+?)\s+(1|2|3)\s*(.*?)$"
)


def is_category_line(line: str) -> bool:
    """Check if a line is a therapeutic category header (ALL CAPS, no tier)."""
    stripped = line.strip()
    if not stripped:
        return False
    # Category lines are all uppercase and don't end with a tier number
    if stripped.isupper() and not re.search(r"\b[123]\b", stripped):
        return True
    return False


def parse_cdphp_pdf() -> list[dict]:
    """Parse CDPHP formulary using text extraction."""
    pdf = pdfplumber.open(str(PDF_PATH))
    records: list[dict] = []
    pending_ql: str | None = None

    for page in pdf.pages[7:]:  # Drug list starts page 8
        text = page.extract_text()
        if not text:
            continue

        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue

            # Skip known non-drug lines
            if any(line.startswith(p) for p in SKIP_PATTERNS):
                continue

            # QL detail line (appears before the drug line)
            if line.startswith("QL ") and "/" in line:
                pending_ql = line
                continue

            # Skip category headers
            if is_category_line(line):
                pending_ql = None
                continue

            # Try to match a drug line
            m = DRUG_LINE_RE.match(line)
            if not m:
                pending_ql = None
                continue

            drug_name = m.group(1).strip()
            tier = m.group(2)
            rest = m.group(3).strip()

            # Skip if drug name is too short or looks like a restriction
            if len(drug_name) < 3:
                pending_ql = None
                continue

            # Parse restrictions from the rest of the line
            pa = "PA" in rest or "Prior Auth" in rest
            st = "ST" in rest or "Step Therapy" in rest
            ql = pending_ql is not None or "QL" in rest
            sp = "SP" in rest or "Specialty" in rest

            ql_detail = pending_ql if pending_ql else None

            rec = {
                "drug_name": drug_name,
                "drug_tier": TIER_MAP.get(tier, f"TIER-{tier}"),
                "prior_authorization": pa,
                "step_therapy": st,
                "quantity_limit": ql,
                "quantity_limit_detail": ql_detail,
                "specialty": sp,
                "issuer_ids": ISSUER_IDS,
                "rxnorm_id": None,
                "is_priority_drug": False,
                "source": "PDF Drug List",
                "source_file": "cdphp_formulary-1_2026.pdf",
                "state_code": "NY",
                "plan_year": 2026,
            }
            records.append(rec)
            pending_ql = None

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


def merge_and_save(cdphp_records: list[dict]) -> None:
    """Merge CDPHP records with existing NY data."""
    existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))
    existing_data = existing["data"]
    existing_results = existing["metadata"]["issuer_results"]

    # Filter out previous CDPHP records
    non_cdphp = [
        r for r in existing_data
        if not any(iid in r.get("issuer_ids", []) for iid in ISSUER_IDS)
    ]

    all_records = non_cdphp + cdphp_records
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

    cdphp_result = {
        "issuer_id": "92551+94788",
        "issuer_name": "CDPHP (NY) — Commercial Clinical Formulary-1",
        "state_code": "NY",
        "source": "cdphp_formulary-1_2026.pdf",
        "source_url": "https://www.cdphp.com/-/media/files/pharmacy/formulary-1.pdf",
        "status": "success",
        "drug_records": len(cdphp_records),
    }
    new_results = [
        r for r in existing_results
        if r.get("issuer_id") not in ("92551", "94788", "92551+94788")
    ]
    new_results.append(cdphp_result)

    output = {
        "metadata": {
            "source": "SBM Formulary - NY (multi-issuer PDF merge)",
            "state_code": "NY",
            "plan_year": 2026,
            "issuers_attempted": len(new_results),
            "issuers_successful": len(new_results),
            "issuers_failed": 0,
            "raw_records": len(non_cdphp) + len(cdphp_records),
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
    print(f"  Previous (non-CDPHP): {len(non_cdphp)} records")
    print(f"  CDPHP new: {len(cdphp_records)} records")
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

    print(f"Parsing CDPHP NY: {PDF_PATH.name} ({PDF_PATH.stat().st_size / (1024*1024):.1f} MB)")
    records = parse_cdphp_pdf()
    print(f"Parsed {len(records)} CDPHP records")

    tier_counts: dict[str, int] = {}
    for r in records:
        t = r["drug_tier"]
        tier_counts[t] = tier_counts.get(t, 0) + 1
    print(f"CDPHP tiers: {tier_counts}")
    print(f"PA: {sum(1 for r in records if r['prior_authorization'])}, "
          f"ST: {sum(1 for r in records if r['step_therapy'])}, "
          f"QL: {sum(1 for r in records if r['quantity_limit'])}, "
          f"SP: {sum(1 for r in records if r['specialty'])}")

    print(f"\nMerging with existing data in {OUTPUT_PATH.name}...")
    merge_and_save(records)
    print("Done.")


if __name__ == "__main__":
    main()
