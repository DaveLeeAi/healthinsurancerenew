#!/usr/bin/env python3
"""
Generate formulary-url-data-for-2027.md from the corrected registry.
This is the human-readable master reference for annual refresh.
Includes emoji status indicators and FFE carrier detail from PUF data.
"""
import csv
import json
import os
from collections import defaultdict
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REGISTRY_PATH = os.path.join(ROOT, "data", "config", "formulary-url-registry-2026.json")
PLAN_ATTRS_PATH = os.path.join(ROOT, "data", "raw", "puf", "plan-attributes-puf.csv")
OUTPUT_PATH = os.path.join(ROOT, "formulary-url-data-for-2027.md")

FETCH_EMOJI = {
    "auto_download": "\u2705",       # green check
    "json_api": "\U0001f50c",        # electric plug
    "manual_download": "\u26a0\ufe0f",  # warning
    "online_only": "\U0001f6ab",     # no entry
    "vpn_required": "\U0001f512",    # lock
}

FFE_STATES = [
    "AK", "AL", "AR", "AZ", "DE", "FL", "HI", "IA", "IN", "KS",
    "LA", "MI", "MO", "MS", "MT", "NC", "ND", "NE", "NH", "OH",
    "OK", "SC", "SD", "TN", "TX", "UT", "WI", "WV", "WY",
]


def load_json(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_ffe_carrier_names() -> dict[str, list[str]]:
    """Extract carrier marketing names per state from plan-attributes PUF."""
    state_issuers: dict[str, set[str]] = defaultdict(set)
    if not os.path.exists(PLAN_ATTRS_PATH):
        return {}
    with open(PLAN_ATTRS_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            st = row.get("StateCode", "")
            name = row.get("IssuerMarketPlaceMarketingName", "")
            if st and name and len(st) == 2:
                # Filter out dental-only carriers for cleaner formulary reference
                lower = name.lower()
                if any(kw in lower for kw in ["delta dental", "dentaquest", "best life",
                    "guardian", "renaissance dental", "truassure", "dominion national",
                    "solstice", "dencap", "imperial insurance", "companion life",
                    "emi health", "hri dental", "superior dental", "dentegra",
                    "northeast delta", "alwayscare", "florida combined",
                    "metropolitan life", "unum", "retailers insurance",
                    "hawaii dental"]):
                    continue
                state_issuers[st].add(name)
    return {st: sorted(names) for st, names in state_issuers.items()}


def main() -> None:
    reg = load_json(REGISTRY_PATH)
    now = datetime.now().strftime("%Y-%m-%d")

    ffe_total = reg["summary"]["ffe_drugs_total"]
    sbm_total = reg["summary"]["sbm_drugs_total"]
    grand_total = reg["summary"].get("total_drugs", ffe_total + sbm_total)

    ffe_carriers = get_ffe_carrier_names()

    lines: list[str] = []
    w = lines.append

    # Header
    w("# Formulary URL Master Reference \u2014 Built for 2027 Refresh")
    w("")
    w(f"> Generated: {now} | Plan Year: 2026 data | Total: {grand_total:,} drugs across 50 states + DC")
    w(">")
    w("> **How to use this file for 2027:**")
    w("> 1. Replace \"2026\" with \"2027\" in all URLs below")
    w("> 2. Run `python scripts/refresh/annual-formulary-refresh.py --from-year 2026 --to-year 2027`")
    w("> 3. Download the \u26a0\ufe0f MANUAL and \U0001f512 VPN PDFs yourself (see manual-download-list output)")
    w("> 4. Skip the \U0001f6ab ONLINE-ONLY carriers (no downloadable file exists)")
    w("> 5. Feed downloaded PDFs to Claude Code for parsing")
    w("")
    w("---")
    w("")

    # Status legend
    w("## Status Legend")
    w("")
    w("| Icon | Meaning | 2027 Action |")
    w("|------|---------|-------------|")
    w("| \u2705 | Auto-fetch \u2014 Claude Code downloads directly | Run refresh script |")
    w("| \u26a0\ufe0f | Manual download \u2014 bot-protected or JS-rendered | You download PDF, feed to Claude Code |")
    w("| \U0001f512 | VPN required \u2014 geo-blocked from cloud IPs | Connect VPN, download, feed to Claude Code |")
    w("| \U0001f50c | JSON API \u2014 fetched via CMS JSON endpoint chain | Run refresh script |")
    w("| \U0001f6ab | Online-only \u2014 no downloadable PDF or JSON | Skip or scrape (low priority) |")
    w("| \U0001f4e6 | FFE PUF bundle \u2014 all carriers via federal CMS file | Download new PUF from CMS |")
    w("")
    w("---")
    w("")

    # FFE states with carrier detail
    ffe_state_entries = [(st, reg["states"].get(st, {})) for st in sorted(FFE_STATES)]

    w(f"## FFE States ({len(FFE_STATES)}) \u2014 All via CMS Machine-Readable PUF")
    w("")
    w("All carriers in these states come from a single federal data file. No per-carrier URLs needed.")
    w("")
    w(f"**2027 refresh:** Download new MR-PUF from `data.cms.gov` (released Oct-Nov 2026), run `python scripts/fetch/fetch_formulary_full.py`.")
    w("")
    w(f"**PY2026 total:** {ffe_total:,} drugs across 133 issuers in {len(FFE_STATES)} states.")
    w("")

    for st in sorted(FFE_STATES):
        carriers = ffe_carriers.get(st, [])
        # Filter to medical carriers only (already filtered in get_ffe_carrier_names)
        if carriers:
            carrier_str = ", ".join(carriers)
            w(f"**{st}** \U0001f4e6 \u2014 {len(carriers)} carriers: {carrier_str}")
        else:
            w(f"**{st}** \U0001f4e6 \u2014 (carrier names not available)")
    w("")
    w("---")
    w("")

    # SBM states
    sbm_states = [
        (st, info) for st, info in sorted(reg["states"].items())
        if info.get("exchange_type") != "FFE"
    ]

    w(f"## SBM States ({len(sbm_states)}) \u2014 Per-Carrier URLs")
    w("")

    for st, info in sbm_states:
        exchange = info.get("exchange_name", "?")
        drug_total = info.get("state_drugs_total", 0) or 0
        carriers = info.get("carriers", [])

        # Sort carriers by drugs_parsed desc
        carriers_sorted = sorted(
            carriers,
            key=lambda c: c.get("drugs_parsed") or 0,
            reverse=True,
        )

        blocked_note = " \u274c" if drug_total == 0 else ""
        w(f"### {st} \u2014 {exchange} \u2014 {drug_total:,} drugs{blocked_note}")
        w("")
        w("| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |")
        w("|---|---------|------|-------|-------|-------------|")

        for i, c in enumerate(carriers_sorted, 1):
            name = c.get("carrier_name", "?")
            hios = c.get("hios_prefix", "?")
            drugs = c.get("drugs_parsed")
            drugs_str = f"{drugs:,}" if drugs else "0"
            fm = c.get("fetch_method", "auto_download")
            emoji = FETCH_EMOJI.get(fm, "\u2705")
            url = c.get("formulary_url") or ""

            # Build URL/Notes column
            fn = c.get("fetch_notes") or ""
            if fm in ("manual_download", "vpn_required", "online_only") and fn:
                url_display = fn
                if url and url.startswith("http"):
                    url_display += f" URL: `{url}`"
            elif url and url.startswith("http"):
                url_display = f"`{url}`"
            elif url:
                url_display = url[:80]
            else:
                url_display = "(no URL)"

            w(f"| {i} | {name} | {hios} | {drugs_str} | {emoji} | {url_display} |")

        w("")

    # URL pattern cheat sheet
    w("---")
    w("")
    w("## URL Pattern Cheat Sheet (for finding new carrier URLs)")
    w("")
    w("| Pattern | Carriers | Template |")
    w("|---------|----------|----------|")

    patterns = reg.get("url_patterns", {})
    for key, p in patterns.items():
        pat = p.get("pattern", "")
        states = ", ".join(p.get("confirmed_states_2026", []))
        w(f"| {key} | {states} | `{pat}` |")

    w("")

    # Market intelligence
    w("---")
    w("")
    w("## Market Intelligence")
    w("")

    mi = reg.get("market_intelligence", {})

    w("### Market Exits (PY2026)")
    w("")
    for e in mi.get("market_exits_2026", []):
        states_str = ", ".join(e.get("states", []))
        notes = e.get("notes", "")
        suffix = " \u2014 " + notes if notes else ""
        carrier = e["carrier"]
        w(f"- **{carrier}** \u2014 {states_str}{suffix}")
    w("")

    w("### New Entrants (PY2026)")
    w("")
    for e in mi.get("new_entrants_2026", []):
        states_str = ", ".join(e.get("states", []))
        notes = e.get("notes", "")
        suffix = " \u2014 " + notes if notes else ""
        carrier = e["carrier"]
        w(f"- **{carrier}** \u2014 {states_str}{suffix}")
    w("")

    w("### Blocked Carriers (no data obtainable)")
    w("")
    for b in mi.get("blocked_carriers", []):
        bcarrier = b["carrier"]
        bstate = b["state"]
        bhios = b["hios"]
        breason = b["reason"]
        w(f"- **{bcarrier}** ({bstate}, HIOS {bhios}) \u2014 {breason}")
    w("")

    w("### SBM State Transitions for PY2027")
    w("")
    for t in mi.get("sbm_states_2026", {}).get("transitioning_2027", []):
        w(f"- {t}")
    w("")

    # Summary stats
    w("---")
    w("")
    w("## Summary Stats")
    w("")
    w("| Metric | Count |")
    w("|--------|-------|")
    w(f"| Total states with data | 50 / 51 (RI blocked) |")
    w(f"| Total drugs (FFE + SBM) | {grand_total:,} |")
    w(f"| FFE drugs | {ffe_total:,} |")
    w(f"| SBM drugs | {sbm_total:,} |")

    auto = manual = vpn = online = api = 0
    for st, info in reg["states"].items():
        if info.get("exchange_type") == "FFE":
            continue
        for c in info.get("carriers", []):
            fm = c.get("fetch_method", "")
            if fm == "auto_download": auto += 1
            elif fm == "manual_download": manual += 1
            elif fm == "vpn_required": vpn += 1
            elif fm == "online_only": online += 1
            elif fm == "json_api": api += 1

    w(f"| SBM carriers with \u2705 auto-fetch URL | {auto} |")
    w(f"| SBM carriers via \U0001f50c JSON API | {api} |")
    w(f"| SBM carriers needing \u26a0\ufe0f manual download | {manual} |")
    w(f"| SBM carriers needing \U0001f512 VPN | {vpn} |")
    w(f"| SBM carriers \U0001f6ab online-only (no PDF) | {online} |")
    w(f"| States fully blocked | 1 (RI) |")
    w("")

    # Write output
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Generated: {OUTPUT_PATH}")
    print(f"  {len(lines)} lines")
    print(f"  {len(sbm_states)} SBM state sections")
    print(f"  {len(FFE_STATES)} FFE states with carrier detail")
    print(f"  {len(patterns)} URL patterns")


if __name__ == "__main__":
    main()
