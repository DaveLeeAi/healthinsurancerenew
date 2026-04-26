"""
parse_ambetter_ky.py
────────────────────
Parse Ambetter KY 2026 formulary PDF into enrichment JSON.

Drug listing pages: 6–70 (0-indexed 5–69). Index section begins page 71.

Layout: two-column per page, words extracted positionally.
  Left col drug name : x0 in [28, 178]
  Left tier          : x0 in [178, 220]
  Left requirements  : x0 in [220, 298]
  Right col drug name: x0 in [298, 463]
  Right tier         : x0 in [463, 498]
  Right requirements : x0 in [498, 600]

Entry pattern: tier and drug name appear at slightly different y, merged
  by y_tol=3. Multi-line entries use continuation rows. Category headers
  appear as name-only rows (no tier, no notes, no digit/form words).

Tiers: 1A (generic), 1B (generic), 2 (preferred-brand),
       3 (non-preferred-brand), 4 (specialty), NF (non-formulary)

Output: data/processed/formulary_enrichment_ambetter_ky.json
"""
import json, re, sys
from datetime import date
from pathlib import Path

import pdfplumber

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

REPO = Path(r"c:\Users\Stuart\Downloads\Claude Code\healthinsurancerenew")
PDF_PATH = REPO / "docs" / "formulary" / "KY" / "2026-ky-formulary.pdf"
OUT_PATH = REPO / "data" / "processed" / "formulary_enrichment_ambetter_ky.json"

ISSUER_ID   = "45636"
ISSUER_NAME = "Ambetter from WellCare of Kentucky"
STATE       = "KY"
PLAN_YEAR   = 2026
PBM         = "WellCare/Centene"

# Drug pages 6–70 (0-indexed 5–69). Page 71 starts the index section.
FIRST_PAGE = 5
LAST_PAGE  = 69

L_NAME_MAX   = 178.0
L_TIER_MAX   = 220.0
L_NOTES_MAX  = 298.0
R_NAME_MIN   = 298.0
R_TIER_MIN   = 463.0
R_NOTES_MIN  = 498.0

TIER_MAP = {
    "1A": (1, "generic"),
    "1B": (1, "generic"),
    "2":  (2, "preferred-brand"),
    "3":  (3, "non-preferred-brand"),
    "4":  (4, "specialty"),
    "NF": (0, "non-formulary"),
}

PRIORITY_SLUGS = {
    "ozempic","mounjaro","wegovy","saxenda","rybelsus","trulicity","victoza",
    "zepbound","metformin","jardiance","farxiga","insulin","humira","keytruda",
    "eliquis","xarelto","repatha","entresto","biktarvy","dupixent","skyrizi",
    "taltz","cosentyx","enbrel","remicade","stelara","rinvoq","xeljanz",
    "ibrance","revlimid","opdivo","tecfidera","ocrevus","kesimpta",
    "spiriva","advair","symbicort","trikafta","lisdexamfetamine","vyvanse",
    "liraglutide","semaglutide","tirzepatide",
}

# Dosage form words — presence in a continuation row means it's a drug name, not a category header
DOSAGE_FORMS = frozenset({
    "sopn","soln","susp","tabs","tab","caps","cap","crea","oint","gel",
    "subl","aero","liqd","kwikpen","soct","inj","tbcr","tb12","tb24",
    "cp24","cpcr","syrp","prsy","supn","solr","ptwk","susy","sosy","soaj",
    "tbpk","tbdp","tbec","suer","pskt","ajkt","pack","mg","ml","mcg",
    "mmeq","unit","units","iu","gr","gm","grams",
})


def parse_tier(s: str):
    return TIER_MAP.get(s.strip().upper())


def group_rows(words: list[dict], y_tol: float = 3.0) -> list[list[dict]]:
    if not words:
        return []
    rows, cur, cy = [], [words[0]], words[0]["top"]
    for w in words[1:]:
        if abs(w["top"] - cy) <= y_tol:
            cur.append(w)
        else:
            rows.append(sorted(cur, key=lambda x: x["x0"]))
            cur, cy = [w], w["top"]
    rows.append(sorted(cur, key=lambda x: x["x0"]))
    return rows


def split_row(row: list[dict]) -> tuple[str,str,str,str,str,str]:
    ln, lt, lnotes, rn, rt, rnotes = [], [], [], [], [], []
    for w in row:
        x, t = w["x0"], w["text"]
        if x < L_NAME_MAX:         ln.append(t)
        elif x < L_TIER_MAX:       lt.append(t)
        elif x < L_NOTES_MAX:      lnotes.append(t)
        elif x < R_TIER_MIN:       rn.append(t)
        elif x < R_NOTES_MIN:      rt.append(t)
        else:                      rnotes.append(t)
    return (" ".join(ln), " ".join(lt), " ".join(lnotes),
            " ".join(rn), " ".join(rt), " ".join(rnotes))


def parse_notes(s: str) -> dict:
    return {
        "prior_authorization": bool(re.search(r"\bPA\b", s)),
        "quantity_limit":      bool(re.search(r"\bQL\b", s)),
        "step_therapy":        bool(re.search(r"\bST\b", s)),
        "age_limit":           bool(re.search(r"\bAL\b", s)),
        "specialty_pharmacy":  bool(re.search(r"\bSP\b", s)),
        "split_fill":          bool(re.search(r"\bSF\b", s)),
        "copay_variant":       bool(re.search(r"\bD\b|\bD\+\b|\bC\b", s)),
    }


def is_page_header(ln: str, rn: str) -> bool:
    combined = ln + " " + rn
    return "Drug Name" in combined or ("Tier" in combined and "Limits" in combined)


def is_priority(name: str) -> bool:
    low = name.lower()
    return any(s in low for s in PRIORITY_SLUGS)


def is_category_text(s: str) -> bool:
    """Return True if the text looks like a section category header, not a drug name continuation.

    Category headers: plain English phrases with no dosage info.
    Drug continuations: contain digits, dosage form words, slashes, or parens.
    """
    low = s.lower().strip()
    if not low:
        return False
    # Contains digits → dosage amount → continuation
    if any(c.isdigit() for c in low):
        return False
    # Starts or ends with ")" → closing a parenthesized generic name like "propanediol)"
    if low[0] in "()" or low[-1] == ")":
        return False
    # Contains "/" or "%" → dosage combination or concentration → continuation
    if "/" in low or "%" in low:
        return False
    # Contains dosage form words → continuation
    words = set(low.split())
    if words & DOSAGE_FORMS:
        return False
    return True


def finalize(pending: dict, records: list, category: str) -> None:
    if not pending:
        return
    tier_result = parse_tier(pending["tier_str"])
    if not tier_result:
        return
    numeric, canonical = tier_result
    name = pending["name"].strip()
    if not name or len(name) < 2:
        return
    notes_str = pending["notes_str"].strip()
    flags = parse_notes(notes_str)
    records.append({
        "drug_name":          name,
        "drug_tier":          numeric,
        "tier_label":         pending["tier_str"].strip().upper(),
        "tier_canonical":     canonical,
        "formulary_type":     "STD",
        "drug_category":      category,
        "prior_authorization": flags["prior_authorization"],
        "quantity_limit":     flags["quantity_limit"],
        "step_therapy":       flags["step_therapy"],
        "age_limit":          flags["age_limit"],
        "specialty_pharmacy": flags["specialty_pharmacy"],
        "split_fill":         flags["split_fill"],
        "copay_variant":      flags["copay_variant"],
        "notes":              notes_str,
        "issuer_ids":         [ISSUER_ID],
        "is_priority_drug":   is_priority(name),
        "source_page":        pending["page"],
        "rxnorm_id":          None,
    })


def new_pending(name: str, tier: str, notes: str, page: int) -> dict:
    return {"name": name, "tier_str": tier, "notes_str": notes, "page": page}


def process_name_no_tier(name: str, notes: str, pending: dict | None,
                         records: list, category: str, page: int) -> tuple[dict | None, str]:
    """
    Handle a row with name content but no tier.
    Returns (updated_pending, updated_category).
    """
    if pending and pending["tier_str"]:
        # We have a pending entry with a tier already set.
        # Check: does the name look like a category header?
        if is_category_text(name) and not notes:
            # Flush pending, update category
            finalize(pending, records, category)
            return None, name.strip()
        else:
            # Drug name continuation (or notes-bearing row)
            pending["name"] = (pending["name"] + " " + name).strip()
            if notes:
                pending["notes_str"] = (pending["notes_str"] + " " + notes).strip()
            return pending, category
    elif pending and not pending["tier_str"]:
        # Pending entry has no tier yet (waiting for tier to appear) — accumulate name
        pending["name"] = (pending["name"] + " " + name).strip()
        if notes:
            pending["notes_str"] = (pending["notes_str"] + " " + notes).strip()
        return pending, category
    else:
        # No pending entry
        if is_category_text(name) and not notes:
            return None, name.strip()
        else:
            return new_pending(name, "", notes, page), category


def parse_formulary() -> list[dict]:
    records: list[dict] = []
    category = ""
    left_p: dict | None = None
    right_p: dict | None = None

    with pdfplumber.open(PDF_PATH) as pdf:
        for pi in range(FIRST_PAGE, min(LAST_PAGE + 1, len(pdf.pages))):
            page_num = pi + 1
            words = pdf.pages[pi].extract_words(
                keep_blank_chars=False, x_tolerance=2, y_tolerance=2
            )
            if not words:
                continue

            rows = group_rows(words, y_tol=3.0)

            for row in rows:
                ln, lt, lnotes, rn, rt, rnotes = split_row(row)

                if is_page_header(ln, rn):
                    continue

                # ── LEFT COLUMN ──────────────────────────────────────────────
                lt_valid = parse_tier(lt)

                if lt_valid:
                    # New entry: finalize previous, start pending
                    finalize(left_p, records, category)
                    left_p = new_pending(ln, lt, lnotes, page_num)

                elif ln:
                    left_p, category = process_name_no_tier(
                        ln, lnotes, left_p, records, category, page_num
                    )

                elif lnotes and not ln and not lt:
                    # Notes-only continuation
                    if left_p:
                        left_p["notes_str"] = (left_p["notes_str"] + " " + lnotes).strip()

                # ── RIGHT COLUMN ─────────────────────────────────────────────
                rt_valid = parse_tier(rt)

                if rt_valid:
                    finalize(right_p, records, category)
                    right_p = new_pending(rn, rt, rnotes, page_num)

                elif rn:
                    right_p, category = process_name_no_tier(
                        rn, rnotes, right_p, records, category, page_num
                    )

                elif rnotes and not rn and not rt:
                    if right_p:
                        right_p["notes_str"] = (right_p["notes_str"] + " " + rnotes).strip()

    # Flush any remaining
    finalize(left_p, records, category)
    finalize(right_p, records, category)

    return records


def main() -> None:
    print(f"Parsing {PDF_PATH.name} (pages {FIRST_PAGE+1}–{LAST_PAGE+1}) ...")
    records = parse_formulary()
    print(f"Raw records: {len(records):,}")

    seen: dict[str, dict] = {}
    for r in records:
        seen.setdefault(r["drug_name"].lower().strip(), r)
    deduped = list(seen.values())
    print(f"After dedup: {len(deduped):,} unique entries")

    priority = sum(1 for r in deduped if r["is_priority_drug"])
    print(f"Priority drugs: {priority}")

    glp1 = ["ozempic","mounjaro","wegovy","saxenda","rybelsus","trulicity",
             "victoza","zepbound","liraglutide","semaglutide","tirzepatide",
             "jardiance","farxiga","metformin"]
    print("\nGLP-1 / diabetes drugs:")
    for r in deduped:
        if any(s in r["drug_name"].lower() for s in glp1):
            pa = "PA" if r["prior_authorization"] else "--"
            ql = "QL" if r["quantity_limit"]      else "--"
            st = "ST" if r["step_therapy"]        else "--"
            print(f"  {r['drug_name']:<55} tier={r['tier_label']:<4} {pa} {ql} {st}  {r['notes']!r}")

    # Sanity check: flag any suspiciously long names or notes
    bad = [r for r in deduped if len(r["drug_name"]) > 120 or len(r["notes"]) > 200]
    if bad:
        print(f"\n⚠  {len(bad)} suspicious records (long name/notes):")
        for r in bad[:5]:
            print(f"  name={r['drug_name'][:80]!r}  notes={r['notes'][:80]!r}")

    output = {
        "metadata": {
            "issuer_id":             ISSUER_ID,
            "issuer_name":           ISSUER_NAME,
            "state":                 STATE,
            "plan_year":             PLAN_YEAR,
            "source":               f"{ISSUER_NAME} PDF formulary",
            "formulary_urls": {
                "STD": "https://www.ambetterhealth.com/content/dam/centene/kentucky/ambetter/pdf/2026-ky-formulary.pdf"
            },
            "total_records":         len(deduped),
            "priority_drug_records": priority,
            "parse_method":         "pdfplumber word extraction, two-column layout, continuation-row accumulation",
            "pbm":                   PBM,
            "generated_at":          str(date.today()),
            "schema_version":        "1.0",
        },
        "data": deduped,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)

    print(f"\nWrote: {OUT_PATH}")
    print(f"Size:  {OUT_PATH.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
