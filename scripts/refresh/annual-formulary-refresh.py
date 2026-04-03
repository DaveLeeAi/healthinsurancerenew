#!/usr/bin/env python3
"""
Annual Formulary Refresh Script
================================
Usage: python scripts/refresh/annual-formulary-refresh.py --from-year 2026 --to-year 2027

Steps:
1. Read formulary-url-registry-{from_year}.json
2. Copy to formulary-url-registry-{to_year}.json
3. Increment all year references in URLs
4. HEAD-request every URL where fetch_method is "auto_download" or "json_api"
5. Skip carriers where fetch_method is "manual_download", "online_only", or "vpn_required"
6. Flag new failures for manual review
7. Output: formulary-url-registry-{to_year}.json with updated statuses
8. Output: refresh-report-{to_year}.txt with summary
9. Output: manual-download-list-{to_year}.txt -- the PDFs human needs to download

Does NOT download or parse any PDFs -- that's a separate step.
This script just validates that the URLs are still live.
"""

import argparse
import json
import os
import re
import sys
import time
import logging
from datetime import datetime
from typing import Optional
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFIG_DIR = os.path.join(ROOT, "data", "config")


def load_json(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: str, data: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    log.info(f"Saved: {path}")


def increment_year_in_url(url: str, from_year: int, to_year: int) -> str:
    """Replace year references in a URL."""
    if not url or not url.startswith("http"):
        return url

    result = url
    # Full year: 2026 -> 2027
    result = result.replace(str(from_year), str(to_year))
    # Short year in PY pattern: PY26 -> PY27
    from_short = str(from_year)[2:]
    to_short = str(to_year)[2:]
    result = re.sub(rf"PY{from_short}\b", f"PY{to_short}", result)
    return result


def head_check_url(url: str, timeout: int = 15) -> tuple[int, str]:
    """
    HEAD request to check if URL is live.
    Returns (status_code, final_url_after_redirects).
    Returns (-1, error_message) on network error.
    """
    if not url or not url.startswith("http"):
        return (-1, "not_a_url")

    try:
        req = Request(url, method="HEAD")
        req.add_header(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HealthInsuranceRenew/1.0 FormularyRefresh",
        )
        with urlopen(req, timeout=timeout) as resp:
            return (resp.status, resp.url)
    except HTTPError as e:
        return (e.code, str(e))
    except URLError as e:
        return (-1, str(e.reason))
    except Exception as e:
        return (-1, str(e))


def classify_status(code: int, to_year: int) -> str:
    """Classify HTTP status code into a registry status."""
    if code == 200:
        return f"verified_{to_year}"
    elif code in (301, 302, 303, 307, 308):
        return f"redirect_{to_year}"
    elif code == 403:
        return f"blocked_{to_year}"
    elif code == 404:
        return f"dead_{to_year}"
    elif code == -1:
        return f"error_{to_year}"
    else:
        return f"http_{code}_{to_year}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Annual Formulary URL Refresh")
    parser.add_argument("--from-year", type=int, required=True, help="Current plan year (e.g. 2026)")
    parser.add_argument("--to-year", type=int, required=True, help="Target plan year (e.g. 2027)")
    parser.add_argument("--dry-run", action="store_true", help="Don't write output files, just report")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between HEAD requests (seconds)")
    args = parser.parse_args()

    from_year = args.from_year
    to_year = args.to_year

    input_path = os.path.join(CONFIG_DIR, f"formulary-url-registry-{from_year}.json")
    output_path = os.path.join(CONFIG_DIR, f"formulary-url-registry-{to_year}.json")
    report_path = os.path.join(ROOT, "docs", f"refresh-report-{to_year}.txt")
    manual_path = os.path.join(ROOT, "docs", f"manual-download-list-{to_year}.txt")

    if not os.path.exists(input_path):
        log.error(f"Registry not found: {input_path}")
        sys.exit(1)

    log.info(f"Loading registry: {input_path}")
    registry = load_json(input_path)

    registry["plan_year"] = to_year
    registry["last_updated"] = datetime.now().strftime("%Y-%m-%d")
    registry["generated"] = datetime.now().strftime("%Y-%m-%d")

    stats: dict[str, int] = {
        "auto_verified": 0,
        "auto_redirect": 0,
        "auto_dead": 0,
        "auto_blocked": 0,
        "auto_error": 0,
        "manual_download": 0,
        "vpn_required": 0,
        "online_only": 0,
        "contentful_rediscovery": 0,
        "cms_puf_awaiting": 0,
        "json_api_verified": 0,
        "json_api_failed": 0,
        "skipped": 0,
    }

    manual_downloads: list[dict] = []
    problems: list[dict] = []
    verified: list[dict] = []

    log.info(f"Processing {len(registry['states'])} states...")

    for state, state_info in sorted(registry["states"].items()):
        carriers = state_info.get("carriers", [])
        for carrier in carriers:
            name = carrier.get("carrier_name", "Unknown")
            hios = carrier.get("hios_prefix", "?")
            fetch_method = carrier.get("fetch_method", "auto_download")
            source_type = carrier.get("source_type", "")
            old_url = carrier.get("formulary_url") or ""

            # Increment year in URL
            if old_url.startswith("http"):
                new_url = increment_year_in_url(old_url, from_year, to_year)
                carrier["formulary_url"] = new_url
            else:
                new_url = old_url

            # --- CMS PUF bundle (FFE states) ---
            if source_type == "cms_puf" or hios == "ALL":
                carrier["status"] = f"awaiting_cms_puf_{to_year}"
                stats["cms_puf_awaiting"] += 1
                continue

            # --- Online-only ---
            if fetch_method == "online_only":
                carrier["status"] = f"still_online_only_{to_year}"
                stats["online_only"] += 1
                continue

            # --- VPN required ---
            if fetch_method == "vpn_required":
                carrier["status"] = f"needs_vpn_{to_year}"
                stats["vpn_required"] += 1
                manual_downloads.append({
                    "state": state,
                    "hios": hios,
                    "carrier": name,
                    "url": new_url,
                    "type": "VPN_REQUIRED",
                    "notes": carrier.get("fetch_notes", ""),
                })
                continue

            # --- Manual download (bot-protected, JS-rendered, Contentful) ---
            if fetch_method == "manual_download":
                if source_type == "contentful_cdn" or "contentful" in (carrier.get("notes") or "").lower():
                    carrier["status"] = f"needs_manual_rediscovery_{to_year}"
                    stats["contentful_rediscovery"] += 1
                    manual_downloads.append({
                        "state": state,
                        "hios": hios,
                        "carrier": name,
                        "url": new_url,
                        "type": "CONTENTFUL_REDISCOVERY",
                        "notes": f"Go to hioscar.com/forms/{to_year}, select {state}",
                    })
                else:
                    carrier["status"] = f"needs_manual_download_{to_year}"
                    stats["manual_download"] += 1
                    manual_downloads.append({
                        "state": state,
                        "hios": hios,
                        "carrier": name,
                        "url": new_url,
                        "type": "MANUAL_DOWNLOAD",
                        "notes": carrier.get("fetch_notes", ""),
                    })
                continue

            # --- Auto-download or JSON API: HEAD check ---
            if not new_url.startswith("http"):
                stats["skipped"] += 1
                continue

            log.info(f"  HEAD {state}/{hios} {name[:30]}... {new_url[:70]}")
            code, result_url = head_check_url(new_url)
            status = classify_status(code, to_year)
            carrier["status"] = status
            carrier["last_checked"] = datetime.now().strftime("%Y-%m-%d")

            if code == 200:
                if fetch_method == "json_api":
                    stats["json_api_verified"] += 1
                else:
                    stats["auto_verified"] += 1
                verified.append({"state": state, "hios": hios, "carrier": name, "url": new_url})
            elif code in (301, 302, 303, 307, 308):
                stats["auto_redirect"] += 1
                carrier["redirect_url"] = result_url
                problems.append({
                    "state": state, "hios": hios, "carrier": name,
                    "issue": f"Redirected ({code})",
                    "old_url": new_url, "new_url": result_url,
                })
            elif code == 403:
                stats["auto_blocked"] += 1
                problems.append({
                    "state": state, "hios": hios, "carrier": name,
                    "issue": "Blocked (403)", "url": new_url,
                })
            elif code == 404:
                stats["auto_dead"] += 1
                problems.append({
                    "state": state, "hios": hios, "carrier": name,
                    "issue": "Dead (404)", "url": new_url,
                })
            else:
                if fetch_method == "json_api":
                    stats["json_api_failed"] += 1
                else:
                    stats["auto_error"] += 1
                problems.append({
                    "state": state, "hios": hios, "carrier": name,
                    "issue": f"Error ({code}: {result_url})", "url": new_url,
                })

            time.sleep(args.delay)

    # --- Print summary ---
    log.info("")
    log.info("=== REFRESH SUMMARY ===")
    for key, val in stats.items():
        log.info(f"  {key}: {val}")

    if args.dry_run:
        log.info("DRY RUN -- no files written")
        return

    os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)

    # Save updated registry
    save_json(output_path, registry)

    # Generate refresh report
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"=== FORMULARY URL REFRESH REPORT ===\n")
        f.write(f"From: PY{from_year} -> PY{to_year}\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")

        f.write("--- SUMMARY ---\n")
        for key, val in stats.items():
            f.write(f"  {key}: {val}\n")

        f.write(f"\n--- VERIFIED ({len(verified)}) ---\n")
        for v in verified:
            f.write(f"  {v['state']} | {v['hios']} | {v['carrier']}\n")

        f.write(f"\n--- PROBLEMS ({len(problems)}) ---\n")
        for p in problems:
            f.write(f"  {p['state']} | {p['hios']} | {p['carrier']} | {p['issue']}\n")
            if p.get("new_url"):
                f.write(f"    Redirect target: {p['new_url']}\n")

        f.write(f"\n--- MANUAL DOWNLOADS ({len(manual_downloads)}) ---\n")
        for m in manual_downloads:
            f.write(f"  {m['state']} | {m['hios']} | {m['carrier']} | {m['type']}\n")
            f.write(f"    URL: {m['url']}\n")
            if m.get("notes"):
                f.write(f"    Notes: {m['notes']}\n")

    log.info(f"Report saved: {report_path}")

    # Generate manual download list
    with open(manual_path, "w", encoding="utf-8") as f:
        f.write(f"=== MANUAL DOWNLOADS NEEDED FOR {to_year} ===\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d')}\n\n")

        vpn_items = [m for m in manual_downloads if m["type"] == "VPN_REQUIRED"]
        manual_items = [m for m in manual_downloads if m["type"] == "MANUAL_DOWNLOAD"]
        contentful_items = [m for m in manual_downloads if m["type"] == "CONTENTFUL_REDISCOVERY"]
        online_items = [
            {
                "state": st,
                "hios": c.get("hios_prefix", "?"),
                "carrier": c.get("carrier_name", "?"),
                "notes": c.get("fetch_notes", ""),
            }
            for st, info in registry["states"].items()
            for c in info.get("carriers", [])
            if c.get("fetch_method") == "online_only"
        ]

        f.write("VPN REQUIRED:\n")
        if vpn_items:
            for m in vpn_items:
                f.write(f"  {m['state']} | {m['hios']} | {m['carrier']}\n")
                f.write(f"    URL: {m['url']}\n")
                f.write(f"    Notes: {m['notes']}\n")
        else:
            f.write("  (none)\n")

        f.write("\nMANUAL PDF DOWNLOAD (bot-protected or JS-rendered):\n")
        if manual_items:
            for m in manual_items:
                f.write(f"  {m['state']} | {m['hios']} | {m['carrier']}\n")
                f.write(f"    URL: {m['url']}\n")
                if m.get("notes"):
                    f.write(f"    Notes: {m['notes']}\n")
        else:
            f.write("  (none)\n")

        f.write("\nCONTENTFUL CDN (must rediscover asset IDs annually):\n")
        if contentful_items:
            for m in contentful_items:
                f.write(f"  {m['state']} | {m['hios']} | {m['carrier']}\n")
                f.write(f"    {m['notes']}\n")
        else:
            f.write("  (none)\n")

        f.write("\nONLINE-ONLY (no PDF -- skip or scrape):\n")
        if online_items:
            for m in online_items:
                f.write(f"  {m['state']} | {m['hios']} | {m['carrier']}\n")
                if m.get("notes"):
                    f.write(f"    Notes: {m['notes']}\n")
        else:
            f.write("  (none)\n")

        f.write(f"\nPlace downloaded PDFs in: data/raw/pdfs/{{ST}}/{{carrier_name}}_{to_year}.pdf\n")
        f.write(f"Then run: python scripts/fetch/parse_manual_pdfs.py --year {to_year}\n")

    log.info(f"Manual download list saved: {manual_path}")
    log.info("Done!")


if __name__ == "__main__":
    main()
