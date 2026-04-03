"""Parse 4 CO carrier formulary PDFs and merge into formulary_sbm_CO.json.

Carriers:
- Cigna (49375): 5-tier PDL, 85 pages, 3-col two-column layout
- Anthem (76680): 4-tier Select Drug List, 91 pages, 3-col
- Kaiser CO (21032): Marketplace formulary, 162 pages, 3-col
- SelectHealth CO (55584): 6-tier RxCore, ~pages, 3-col

Usage:
    python scripts/etl/parse_formulary_co_carriers.py
"""

import json
import re
import sys
import time
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "formulary_sbm_CO.json"

TIER_MAP = {
    "0": "ACA-PREVENTIVE-DRUGS",
    "$0": "ACA-PREVENTIVE-DRUGS",
    "1": "GENERIC",
    "Tier 1": "GENERIC",
    "2": "PREFERRED-BRAND",
    "Tier 2": "PREFERRED-BRAND",
    "3": "NON-PREFERRED-BRAND",
    "Tier 3": "NON-PREFERRED-BRAND",
    "4": "SPECIALTY",
    "Tier 4": "SPECIALTY",
    "5": "SPECIALTY-HIGH",
    "Tier 5": "SPECIALTY-HIGH",
    "6": "SPECIALTY-HIGH",
    "Tier 6": "SPECIALTY-HIGH",
}

PRIORITY_DRUGS = [
    "ozempic", "wegovy", "mounjaro", "zepbound", "humira", "enbrel",
    "stelara", "xeljanz", "otezla", "dupixent", "rinvoq", "skyrizi",
    "keytruda", "opdivo", "revlimid", "ibrance", "eliquis", "xarelto",
    "jardiance", "farxiga", "trulicity", "victoza", "lantus", "humalog",
    "novolog", "metformin", "atorvastatin", "lisinopril", "amlodipine",
    "omeprazole", "gabapentin", "sertraline", "levothyroxine",
]


def parse_pdf_tables(pdf_path: str, issuer_ids: list[str], source_file: str,
                     start_page: int, tier_col: int = 1, name_col: int = 0,
                     notes_col: int = 2, min_cols: int = 3,
                     tier_prefix: str = "") -> list[dict]:
    """Generic PDF table parser for CO carriers."""
    pdf = pdfplumber.open(pdf_path)
    records: list[dict] = []

    for page in pdf.pages[start_page:]:
        tables = page.extract_tables()
        for table in tables:
            if not table or len(table[0]) < min_cols:
                continue
            for row in table:
                ncols = len(row)
                drug = str(row[name_col] or "").strip().replace("\n", " ")
                tier_raw = str(row[tier_col] or "").strip()
                notes = str(row[notes_col] or "").strip().replace("\n", " ") if ncols > notes_col else ""

                # Skip headers
                if drug in ("Drug Name", "Medication Name") or "Tier" in tier_raw and "Drug" in tier_raw:
                    continue
                if not tier_raw or not drug or len(drug) < 3:
                    continue

                # Normalize tier
                tier_key = tier_prefix + tier_raw if tier_prefix else tier_raw
                tier = TIER_MAP.get(tier_key) or TIER_MAP.get(tier_raw)
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
                    "drug_name": drug,
                    "drug_tier": tier,
                    "prior_authorization": pa,
                    "step_therapy": st,
                    "quantity_limit": ql,
                    "quantity_limit_detail": ql_detail,
                    "specialty": sp or tier in ("SPECIALTY", "SPECIALTY-HIGH"),
                    "issuer_ids": issuer_ids,
                    "rxnorm_id": None,
                    "is_priority_drug": False,
                    "source": "PDF Drug List",
                    "source_file": source_file,
                    "state_code": "CO",
                    "plan_year": 2026,
                })

    pdf.close()

    # Dedup and flag priority
    seen: dict[tuple, bool] = {}
    deduped: list[dict] = []
    for rec in records:
        key = (rec["drug_name"].lower(), rec["drug_tier"], rec["prior_authorization"],
               rec["step_therapy"], rec["quantity_limit"])
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


def merge_and_save(all_carrier_records: dict[str, list[dict]],
                   carrier_info: list[dict]) -> None:
    """Merge all carrier records into formulary_sbm_CO.json."""
    existing = json.load(open(OUTPUT_PATH, encoding="utf-8"))

    # Collect all new issuer IDs
    new_issuer_ids = set()
    for records in all_carrier_records.values():
        for r in records:
            new_issuer_ids.update(r.get("issuer_ids", []))

    # Keep existing records from issuers we're NOT replacing
    existing_keep = [
        r for r in existing.get("data", [])
        if not any(iid in r.get("issuer_ids", []) for iid in new_issuer_ids)
    ]

    # Merge all
    all_records = existing_keep
    for records in all_carrier_records.values():
        all_records.extend(records)

    merged: dict[tuple, dict] = {}
    for rec in all_records:
        key = (rec["drug_name"].lower(), rec["drug_tier"], rec["prior_authorization"],
               rec["step_therapy"], rec["quantity_limit"])
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
            if rec.get("quantity_limit_detail") and not m.get("quantity_limit_detail"):
                m["quantity_limit_detail"] = rec["quantity_limit_detail"]

    sorted_keys = sorted(merged.keys(), key=lambda k: k[0].lower())
    final = [dict(merged[k], issuer_ids=sorted(merged[k]["issuer_ids"])) for k in sorted_keys]

    unique_issuers = {iid for r in final for iid in r["issuer_ids"]}
    tier_counts: dict[str, int] = {}
    for r in final:
        tier_counts[r["drug_tier"]] = tier_counts.get(r["drug_tier"], 0) + 1

    # Keep old results, add new
    old_results = [
        r for r in existing.get("metadata", {}).get("issuer_results", [])
        if r.get("issuer_id") not in {ci["issuer_id"] for ci in carrier_info}
    ]

    output = {
        "metadata": {
            "source": "SBM Formulary - CO (multi-issuer PDF merge)",
            "state_code": "CO", "plan_year": 2026,
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
    print(f"  Existing kept: {len(existing_keep)} records")
    print(f"  Tiers: {tier_counts}")
    print(f"  PA={output['metadata']['pa_count']}, ST={output['metadata']['st_count']}, QL={output['metadata']['ql_count']}")


def main() -> None:
    raw = PROJECT_ROOT / "data" / "raw" / "formulary_pdf"
    all_records: dict[str, list[dict]] = {}
    carrier_info: list[dict] = []

    # 1. Cigna CO — 5-tier, two-column 3-col tables, start page 6
    cigna_path = raw / "cigna_co_rx_essential_5tier_pdl_2026.pdf"
    if cigna_path.exists():
        print(f"Parsing Cigna CO: {cigna_path.name}")
        recs = parse_pdf_tables(str(cigna_path), ["49375"],
                                "cigna_co_rx_essential_5tier_pdl_2026.pdf",
                                start_page=5, name_col=0, tier_col=1, notes_col=2)
        all_records["cigna"] = recs
        tier_c = {}
        for r in recs:
            tier_c[r["drug_tier"]] = tier_c.get(r["drug_tier"], 0) + 1
        print(f"  {len(recs)} drugs, tiers: {tier_c}")
        carrier_info.append({
            "issuer_id": "49375", "issuer_name": "Cigna Healthcare (CO)",
            "state_code": "CO",
            "source": "cigna_co_rx_essential_5tier_pdl_2026.pdf",
            "source_url": "https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-co-989873-cigna-rx-essential-5-tier-pdl.pdf",
            "status": "success", "drug_records": len(recs),
        })

    # 2. Anthem CO — 4-tier, 3-col, start page 7 (same format as NY)
    anthem_path = raw / "anthem_co_select_4tier_ind_2026.pdf"
    if anthem_path.exists():
        print(f"Parsing Anthem CO: {anthem_path.name}")
        recs = parse_pdf_tables(str(anthem_path), ["76680"],
                                "2026_Select_4_Tier_CO_IND.pdf",
                                start_page=6, name_col=0, tier_col=1, notes_col=2,
                                tier_prefix="Tier ")
        all_records["anthem"] = recs
        tier_c = {}
        for r in recs:
            tier_c[r["drug_tier"]] = tier_c.get(r["drug_tier"], 0) + 1
        print(f"  {len(recs)} drugs, tiers: {tier_c}")
        carrier_info.append({
            "issuer_id": "76680", "issuer_name": "Anthem (CO) — Elevance Health",
            "state_code": "CO",
            "source": "2026_Select_4_Tier_CO_IND.pdf",
            "source_url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_CO_IND.pdf",
            "status": "success", "drug_records": len(recs),
        })

    # 3. Kaiser CO — Marketplace, 3-col, start page 8
    kaiser_path = raw / "kaiser_co_marketplace_formulary_2026.pdf"
    if kaiser_path.exists():
        print(f"Parsing Kaiser CO: {kaiser_path.name}")
        recs = parse_pdf_tables(str(kaiser_path), ["21032"],
                                "kaiser_co_marketplace_formulary_2026.pdf",
                                start_page=7, name_col=0, tier_col=1, notes_col=2,
                                tier_prefix="Tier ")
        all_records["kaiser"] = recs
        tier_c = {}
        for r in recs:
            tier_c[r["drug_tier"]] = tier_c.get(r["drug_tier"], 0) + 1
        print(f"  {len(recs)} drugs, tiers: {tier_c}")
        carrier_info.append({
            "issuer_id": "21032", "issuer_name": "Kaiser Permanente (CO)",
            "state_code": "CO",
            "source": "kaiser_co_marketplace_formulary_2026.pdf",
            "source_url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/co/marketplace-formulary-co-en-2026.pdf",
            "status": "success", "drug_records": len(recs),
        })

    # 4. SelectHealth CO — 6-tier RxCore, 3-col
    select_path = raw / "selecthealth_co_tier6_rxcore_2026.pdf"
    if select_path.exists():
        print(f"Parsing SelectHealth CO: {select_path.name}")
        # Need to check start page
        pdf = pdfplumber.open(str(select_path))
        start = 0
        for i, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            for t in tables:
                if t and len(t) > 2 and len(t[0]) >= 3:
                    tier_val = str(t[1][1] or "").strip() if len(t) > 1 else ""
                    if tier_val in TIER_MAP:
                        start = i
                        break
            if start > 0:
                break
        pdf.close()
        print(f"  Drug tables start page {start + 1}")

        recs = parse_pdf_tables(str(select_path), ["55584"],
                                "selecthealth_co_tier6_rxcore_2026.pdf",
                                start_page=max(0, start), name_col=0, tier_col=1, notes_col=2)
        all_records["selecthealth"] = recs
        tier_c = {}
        for r in recs:
            tier_c[r["drug_tier"]] = tier_c.get(r["drug_tier"], 0) + 1
        print(f"  {len(recs)} drugs, tiers: {tier_c}")
        carrier_info.append({
            "issuer_id": "55584", "issuer_name": "SelectHealth (CO)",
            "state_code": "CO",
            "source": "selecthealth_co_tier6_rxcore_2026.pdf",
            "source_url": "https://selecthealth.org/content/dam/selecthealth/pharmacy/PDFs/colorado-tier6-rxcore.pdf",
            "status": "success", "drug_records": len(recs),
        })

    total_new = sum(len(r) for r in all_records.values())
    print(f"\nTotal new records: {total_new} from {len(all_records)} carriers")

    if not OUTPUT_PATH.exists():
        print(f"ERROR: {OUTPUT_PATH} not found")
        sys.exit(1)

    print("Merging into formulary_sbm_CO.json...")
    merge_and_save(all_records, carrier_info)
    print("Done.")


if __name__ == "__main__":
    main()
