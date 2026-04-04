#!/usr/bin/env python3
"""
Fetch 2026 ACA Marketplace formulary PDFs for 15 SBM states.

Downloads verified/pattern PDF URLs to data/raw/formulary_pdf/.
Logs results (success/fail/skip) for each carrier.

Usage:
    python scripts/fetch/fetch_formulary_15state.py [--state XX] [--dry-run]
"""

import argparse
import json
import logging
import sys
import time
from pathlib import Path
from urllib.parse import unquote

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw" / "formulary_pdf"

# Each entry: (state, carrier_key, hios_ids, url, local_filename, notes)
CARRIERS = [
    # ── CT ──────────────────────────────────────────────────────────────────
    ("CT", "connecticare", ["86545"],
     "https://www.connecticare.com/en/-/media/Project/PWS/Microsites/ConnectiCare/PDFs/Members/Marketplace/EN/Pharmacy/CTFormulary2026.pdf",
     "connecticare_ct_formulary_2026.pdf",
     "Molina-based, 4 tiers"),
    ("CT", "caresource_ct", ["76962"],
     "https://www.caresource.com/documents/marketplace-2026-ct-formulary.pdf",
     "caresource_ct_formulary_2026.pdf",
     "PATTERN — may 404"),
    ("CT", "anthem_ct", ["94815"],
     "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_CT_IND.pdf",
     "anthem_ct_select_4tier_ind_2026.pdf",
     "Elevance 4-tier Select"),

    # ── DC ──────────────────────────────────────────────────────────────────
    ("DC", "kaiser_dc", ["94506", "86052"],
     "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/mas/marketplace-formulary-mas-en.pdf",
     "kaiser_mas_marketplace_formulary_2026.pdf",
     "MAS region: DC+MD+VA"),
    ("DC", "carefirst_dc", ["28137", "45532", "94084"],
     "https://member.carefirst.com/carefirst-resources/pdf/exchange-formulary-sum7277-2026.pdf",
     "carefirst_exchange_formulary_2026.pdf",
     "Single PDF covers 3 CareFirst entities"),
    ("DC", "upmc_dc", ["78079"],
     "https://upmc.widen.net/view/pdf/02jjoeuifc/25TOTEX6064850---2026-Advantage-Choice-Formulary-Book_WEB.pdf?t.download=true&u=oid6pr",
     "upmc_advantage_choice_formulary_2026.pdf",
     "7-tier Advantage Choice"),

    # ── ID ──────────────────────────────────────────────────────────────────
    ("ID", "bcidaho", ["38128"],
     "https://res.cloudinary.com/bluecrossofidaho/image/upload/web/pdfs/pharmacy/2026/2026-Blue-Cross-of-Idaho-QHP-Formulary.pdf",
     "bcidaho_qhp_formulary_2026.pdf",
     "6-tier QHP"),
    ("ID", "stlukes_id", ["92170"],
     "https://www.stlukeshealthplan.org/assets/blt41861338f1f78cbf",
     "stlukes_id_formulary_2026.pdf",
     "5 tiers, Capital Rx PBM"),

    # ── KY ──────────────────────────────────────────────────────────────────
    ("KY", "anthem_ky", ["36239"],
     "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_KY_IND.pdf",
     "anthem_ky_select_4tier_ind_2026.pdf",
     "Elevance 4-tier Select"),
    ("KY", "ambetter_ky", ["45636"],
     "https://www.ambetterhealth.com/content/dam/centene/kentucky/ambetter/pdf/2026-ky-formulary.pdf",
     "ambetter_ky_formulary_2026.pdf",
     "Centene standard"),
    ("KY", "molina_ky", ["73891"],
     "https://www.molinamarketplace.com/marketplace/ky/en-us/-/media/Molina/PublicWebsite/PDF/members/ky/en-us/Marketplace/2026/KYFormulary2026.pdf",
     "molina_ky_formulary_2026.pdf",
     "PATTERN — Passport by Molina"),

    # ── MA ──────────────────────────────────────────────────────────────────
    ("MA", "hne_ma", ["34484"],
     "https://healthnewengland.org/Portals/_default/Shared%20Documents/pharmacy/Find%20a%20Drug/2026/Health_New_England_NEHIM.pdf",
     "hne_ma_formulary_2026.pdf",
     "3-tier, OptumRx"),
    ("MA", "tufts_ma", ["36046"],
     "https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/harvard-pilgrim/p32-formulary-documents/2026/P32H-Value-Direct-3T-Comprehensive-Tufts.pdf",
     "tufts_ma_value_direct_3t_2026.pdf",
     "3-tier Value Direct"),
    ("MA", "harvardpilgrim_ma", ["42690"],
     "https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/harvard-pilgrim/hphc-formulary-documents/2026-oe/HPHC-Core-MA-5T-Comprehensive.pdf",
     "harvardpilgrim_ma_core_5t_2026.pdf",
     "5-tier Core MA"),
    ("MA", "uhc_ma", ["31779"],
     "https://www.uhcprovider.com/content/dam/provider/docs/public/resources/pharmacy/commercial-pdl-jan-2026.pdf",
     "uhc_ma_commercial_pdl_2026.pdf",
     "3-tier Advantage list"),
    ("MA", "wellsense_ma", ["82569"],
     "https://www.wellsense.org/hubfs/Pharmacy/MA_Clarity_Formulary_Guidebook_2026.pdf?hsLang=en",
     "wellsense_ma_clarity_formulary_2026.pdf",
     "5-tier Clarity"),

    # ── MD ──────────────────────────────────────────────────────────────────
    # Kaiser MD uses same MAS PDF as DC — reuse kaiser_mas_marketplace_formulary_2026.pdf
    ("MD", "wellpoint_md", ["72545"],
     "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_MD_IND.pdf",
     "wellpoint_md_select_4tier_ind_2026.pdf",
     "Wellpoint/Anthem 4-tier Select"),
    ("MD", "uhc_md", ["72375"],
     "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-MD_UHC_IFP_PY26.pdf",
     "uhc_md_ifp_pdl_2026.pdf",
     "State-specific IFP PDL"),
    # CareFirst MD uses same PDF as DC — reuse carefirst_exchange_formulary_2026.pdf

    # ── MN ──────────────────────────────────────────────────────────────────
    # Blue Plus — already have bcbsmn_basicrx_4tier_2026.pdf in sbc_pdfs/mn/formulary/
    # Quartz — already have quartz_4tier_2026.pdf
    # UCare — already have ucare_ifp_2026.pdf
    # HealthPartners — already have healthpartners_formulary_2026.pdf
    ("MN", "medica_mn", ["31616"],
     "https://www.medica.com/-/media/Documents/Pharmacy/Individual/2026/2026-IFB-Formulary-MN.pdf",
     "medica_mn_ifb_formulary_2026.pdf",
     "4-tier IFB — only missing MN carrier"),

    # ── NJ ──────────────────────────────────────────────────────────────────
    ("NJ", "amerihealth_nj", ["91762"],
     "https://www.amerihealth.com/pdfs/providers/pharmacy_information/value/ah-value-formulary-nj.pdf",
     "amerihealth_nj_value_formulary_2026.pdf",
     "5-tier Value"),
    ("NJ", "horizon_nj", ["91661"],
     "https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_NJ_3T_HealthInsuranceMarketplace.pdf",
     "horizon_nj_marketplace_3t_2026.pdf",
     "PATTERN — 2026 path, may 404"),
    ("NJ", "uhc_nj", ["37777"],
     "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-NJ_UHC_IFP_PY26.pdf",
     "uhc_nj_ifp_pdl_2026.pdf",
     "State-specific IFP PDL"),

    # ── NM ──────────────────────────────────────────────────────────────────
    ("NM", "ambetter_nm", ["57173"],
     "https://www.ambetterhealth.com/content/dam/centene/ambetter-from-western-sky-community-care/PDFs/2026-nm-formulary.pdf",
     "ambetter_nm_formulary_2026.pdf",
     "PATTERN — Western Sky"),
    ("NM", "uhc_nm", ["65428"],
     "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-NM_UHC_IFP_PY26.pdf",
     "uhc_nm_ifp_pdl_2026.pdf",
     "PATTERN — IFP PDL"),
    ("NM", "molina_nm", ["19722"],
     "https://www.molinamarketplace.com/marketplace/nm/en-us/-/media/Molina/PublicWebsite/PDF/members/nm/en-us/Marketplace/2026/NMFormulary2026.pdf",
     "molina_nm_formulary_2026.pdf",
     "VERIFIED"),

    # ── NV ──────────────────────────────────────────────────────────────────
    ("NV", "anthem_nv", ["60156"],
     "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_NV_IND.pdf",
     "anthem_nv_select_4tier_ind_2026.pdf",
     "PATTERN — Elevance 4-tier"),
    ("NV", "silversummit_nv", ["95865"],
     "https://www.ambetterhealth.com/content/dam/centene/Nevada/ambetter/pdfs/2026-nv-formulary.pdf",
     "silversummit_nv_formulary_2026.pdf",
     "Centene/Ambetter NV"),
    ("NV", "hpn_nv", ["45142"],
     "https://www.healthplanofnevada.com/content/dam/hpnv-public-sites/health-plan-of-nevada/documents/pharmacy/2026/UHC8654_25.1_Essential%20Individual%204%20tier%20PDL_JAN26_FINAL.pdf",
     "hpn_nv_essential_4tier_2026.pdf",
     "Health Plan of Nevada, 4-tier"),
    ("NV", "hometown_nv", ["41094", "43314"],
     "https://www.hometownhealth.com/wp-content/uploads/2025/12/Hometown_Health_IFP_Exchange-Formulary-_Eff-01.01.2026.pdf",
     "hometown_nv_ifp_exchange_formulary_2026.pdf",
     "Hometown Health/Renown, 4-tier"),

    # ── PA ──────────────────────────────────────────────────────────────────
    ("PA", "ibx_pa_value", ["33709", "79962", "79279", "33871", "31609"],
     "https://www.ibx.com/documents/35221/56635/value-formulary-guide.pdf",
     "ibx_pa_value_formulary_2026.pdf",
     "IBX Value Formulary — 5 HIOS entities"),
    ("PA", "ibx_pa_select", ["33709", "79962", "79279", "33871", "31609"],
     "https://www.ibx.com/documents/35221/56635/select-drug-guide.pdf",
     "ibx_pa_select_drug_guide_2026.pdf",
     "IBX Select Drug Guide — same 5 entities"),
    ("PA", "ambetter_pa", ["45127"],
     "https://www.ambetterhealth.com/content/dam/centene/Pennsylvania/ambetter/pdfs/2026-pa-formulary.pdf",
     "ambetter_pa_formulary_2026.pdf",
     "Centene PA"),
    ("PA", "amerihealth_pa", ["86199"],
     "https://www.amerihealth.com/pdfs/providers/pharmacy_information/select_drug/ah_select_drug_guide.pdf",
     "amerihealth_pa_select_drug_2026.pdf",
     "5-tier Select Drug"),
    ("PA", "geisinger_pa", ["75729"],
     "https://www.geisinger.org/-/media/OneGeisinger/Files/PDFs/Shared-PDFs/Formulary-Updates/Marketplace-Formulary-2026.pdf",
     "geisinger_pa_marketplace_formulary_2026.pdf",
     "Marketplace 2026"),
    ("PA", "jefferson_pa", ["19702", "93909"],
     "https://www.jeffersonhealthplans.com/content/dam/jeffersonhealthplans/documents/formularies/ifp/rxflex-formulary-jhp-ifp-2026-11012025.pdf",
     "jefferson_pa_ifp_formulary_2026.pdf",
     "Jefferson Health Plans IFP"),
    ("PA", "upmc_pa", ["16322", "62560"],
     "https://upmc.widen.net/view/pdf/02jjoeuifc/25TOTEX6064850---2026-Advantage-Choice-Formulary-Book_WEB.pdf?t.download=true&u=oid6pr",
     "upmc_pa_advantage_choice_2026.pdf",
     "Try DC URL for PA too — same formulary"),

    # ── VT ──────────────────────────────────────────────────────────────────
    ("VT", "bcbsvt", ["13627"],
     "https://www.bluecrossvt.org/documents/2026-blue-cross-vt-formulary-booklet",
     "bcbsvt_formulary_booklet_2026.pdf",
     "OptumRx PBM"),
    ("VT", "mvp_vt", ["77566"],
     "https://www.mvphealthcare.com/-/media/project/mvp/healthcare/documents/formularies/2026/marketplace-pharmacy-formulary-2026.pdf",
     "mvp_vt_marketplace_formulary_2026.pdf",
     "CVS Caremark PBM"),

    # ── WA ──────────────────────────────────────────────────────────────────
    ("WA", "ambetter_wa", ["61836"],
     "https://www.ambetterhealth.com/content/dam/centene/Coordinated%20Care/ambetter/PDFs/2026-wa-cascade-formulary.pdf",
     "ambetter_wa_cascade_formulary_2026.pdf",
     "Cascade version"),
    ("WA", "lifewise_wa", ["38498"],
     "https://www.wahealthplan.org/wp-content/uploads/2024/02/LifeWise-2026-Pharmacy-Formulary.pdf",
     "lifewise_wa_formulary_2026.pdf",
     "Cambia subsidiary"),
    ("WA", "kaiser_wa", ["23371"],
     "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/nw/washington-marketplace-formulary-nw-en-2026-commercial.pdf",
     "kaiser_wa_marketplace_formulary_2026.pdf",
     "NW region"),
    ("WA", "molina_wa", ["80473"],
     "https://www.molinamarketplace.com/marketplace/wa/en-us/-/media/Molina/PublicWebsite/PDF/members/wa/en-us/Marketplace/2026/WAFormulary2026.pdf",
     "molina_wa_formulary_2026.pdf",
     "Molina WA Marketplace"),
    ("WA", "premera_wa", ["49831"],
     "https://www.premera.com/documents/052146_2026.pdf",
     "premera_wa_metallic_formulary_2026.pdf",
     "4-tier Metallic M4"),
    ("WA", "uhc_wa", ["62650"],
     "https://www.wahealthplan.org/wp-content/uploads/2024/02/UHC-2026-WA-Formulary.pdf",
     "uhc_wa_formulary_2026.pdf",
     "WA-specific via broker"),
    ("WA", "bridgespan_wa", ["53732"],
     "https://fm.formularynavigator.com/MemberPages/pdf/StateExchangeFormularyWA_2076_Full_442.pdf",
     "bridgespan_wa_exchange_formulary_2026.pdf",
     "PATTERN — BridgeSpan/Cambia"),
    ("WA", "chpw_wa", ["18581"],
     "https://individualandfamily.chpw.org/wp-content/uploads/cascade-select/content/member/pharmacy/CS_RX010_Formulary_2026.pdf",
     "chpw_wa_cascade_select_formulary_2026.pdf",
     "Community Health Plan of WA, Express Scripts"),

    # DC UPMC entry already at line 53 above — no duplicate needed

    # ── OR gap carriers ────────────────────────────────────────────────────────
    ("OR", "kaiser_or", ["71287"],
     "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/nw/washington-marketplace-formulary-nw-en-2026-commercial.pdf",
     "kaiser_nw_marketplace_formulary_2026.pdf",
     "Kaiser NW region covers both OR and WA — reuse WA Kaiser PDF"),
    ("OR", "pacificsource_or", ["10091"],
     "https://pacificsource.com/ps_find_drug/pdf/OR/2026",
     "pacificsource_or_formulary_2026.pdf",
     "VERIFIED in registry — direct PDF download"),

    # ── VA gap carriers ────────────────────────────────────────────────────────
    ("VA", "kaiser_va", ["95185"],
     "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/mas/marketplace-formulary-mas-en.pdf",
     "kaiser_mas_marketplace_formulary_2026.pdf",
     "Kaiser MAS region covers DC, MD, VA — reuse DC/MD Kaiser PDF"),
    ("VA", "anthem_hk_va", ["88380"],
     "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_VA_IND.pdf",
     "anthem_va_select_4tier_ind_2026.pdf",
     "PATTERN — Anthem/Elevance FBO/143 VA, same format as CT/KY/NV Anthem"),
    ("VA", "uhc_va", ["24251"],
     "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-VA_UHC_IFP_PY26.pdf",
     "uhc_va_ifp_pdl_2026.pdf",
     "PATTERN — UHC IFP PDL VA (IFP2895550 is multi-state code used for MD/MA/NJ/NM)"),
    ("VA", "oscar_va", ["VA_OSCAR_HIOS_TBD"],
     "https://assets.ctfassets.net/plyq12u1bv8a/31SHD9kMQqcXQjBa3Kja4R/094cd572318caa382cf01e323ababed6/Oscar_4T_VA_STND_Member_Doc__January_2026__as_of_09162025.pdf",
     "oscar_va_4t_formulary_2026.pdf",
     "VERIFIED in registry — Oscar VA 4-tier standard formulary"),

    # ── PA gap carriers ────────────────────────────────────────────────────────
    ("PA", "oscar_pa", ["98517"],
     "https://assets.ctfassets.net/plyq12u1bv8a/63B8wAgFLaG6cPTA9ZY9uy/a917f396ad20287d6a6234b17d2aa351/Oscar_4T_PA_STND_Member_Doc__January_2026__as_of_09162025.pdf",
     "oscar_pa_4t_formulary_2026.pdf",
     "VERIFIED in registry — Oscar PA 4-tier standard formulary"),

    # ── ME gap carriers ────────────────────────────────────────────────────────
    ("ME", "hphc_ne_me", ["77432"],
     "https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/harvard-pilgrim/hphc-formulary-documents/2026-oe/HPHC-Core-MA-5T-Comprehensive.pdf",
     "harvardpilgrim_ma_core_5t_2026.pdf",
     "PATTERN — Harvard Pilgrim NE (ME issuer 77432) likely shares HPHC Core MA formulary via OptumRx"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "application/pdf,*/*",
}


def download_pdf(url: str, dest: Path, notes: str) -> dict:
    """Download a PDF, return status dict."""
    if dest.exists() and dest.stat().st_size > 10000:
        size_mb = dest.stat().st_size / (1024 * 1024)
        return {"status": "skipped_exists", "size_mb": round(size_mb, 2),
                "message": f"Already exists ({size_mb:.1f} MB)"}

    try:
        # HEAD first for patterns
        if "PATTERN" in notes:
            head = requests.head(url, headers=HEADERS, timeout=15, allow_redirects=True)
            if head.status_code != 200:
                return {"status": "failed_head", "http_code": head.status_code,
                        "message": f"HEAD returned {head.status_code}"}

        resp = requests.get(url, headers=HEADERS, timeout=120, allow_redirects=True,
                            stream=True)
        if resp.status_code != 200:
            return {"status": "failed", "http_code": resp.status_code,
                    "message": f"GET returned {resp.status_code}"}

        content_type = resp.headers.get("Content-Type", "")
        # Some servers return octet-stream or no type for PDFs
        if "html" in content_type.lower() and "pdf" not in url.lower():
            return {"status": "failed_html", "http_code": 200,
                    "message": "Response is HTML, not PDF"}

        dest.parent.mkdir(parents=True, exist_ok=True)
        total = 0
        with open(dest, "wb") as f:
            for chunk in resp.iter_content(chunk_size=65536):
                f.write(chunk)
                total += len(chunk)

        size_mb = total / (1024 * 1024)
        # Sanity check — PDFs should be > 50KB
        if total < 50000:
            # Check if it's actually HTML
            with open(dest, "rb") as f:
                head_bytes = f.read(100)
            if b"<html" in head_bytes.lower() or b"<!doctype" in head_bytes.lower():
                dest.unlink()
                return {"status": "failed_html", "http_code": 200,
                        "message": f"Response was HTML ({total} bytes), deleted"}
            # Small but might be valid
            return {"status": "success_small", "size_mb": round(size_mb, 2),
                    "message": f"Downloaded but small ({total} bytes) — verify manually"}

        return {"status": "success", "size_mb": round(size_mb, 2),
                "message": f"Downloaded {size_mb:.1f} MB"}

    except requests.exceptions.Timeout:
        return {"status": "failed_timeout", "message": "Request timed out (120s)"}
    except requests.exceptions.ConnectionError as e:
        return {"status": "failed_conn", "message": str(e)[:200]}
    except Exception as e:
        return {"status": "failed_error", "message": str(e)[:200]}


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch 15-state formulary PDFs")
    parser.add_argument("--state", type=str, help="Only fetch for this state code (e.g. MN)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be downloaded")
    args = parser.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    carriers = CARRIERS
    if args.state:
        carriers = [c for c in CARRIERS if c[0] == args.state.upper()]
        if not carriers:
            log.error("No carriers found for state %s", args.state)
            sys.exit(1)

    results = []
    success = 0
    skipped = 0
    failed = 0

    for state, key, hios_ids, url, filename, notes in carriers:
        dest = RAW_DIR / filename
        log.info("[%s] %s — %s", state, key, notes)

        if args.dry_run:
            exists = "EXISTS" if dest.exists() else "MISSING"
            log.info("  %s → %s [%s]", url[:80], filename, exists)
            continue

        result = download_pdf(url, dest, notes)
        result["state"] = state
        result["carrier"] = key
        result["hios_ids"] = hios_ids
        result["url"] = url
        result["filename"] = filename
        results.append(result)

        status = result["status"]
        if status.startswith("success"):
            success += 1
            log.info("  ✓ %s — %s", status, result["message"])
        elif status == "skipped_exists":
            skipped += 1
            log.info("  ○ %s", result["message"])
        else:
            failed += 1
            log.warning("  ✗ %s — %s", status, result["message"])

        # Rate limit: 1 request per second
        time.sleep(1.0)

    if args.dry_run:
        log.info("\nDry run complete. %d carriers across %d states.",
                 len(carriers), len({c[0] for c in carriers}))
        return

    log.info("\n" + "=" * 60)
    log.info("RESULTS: %d success, %d skipped (exist), %d failed", success, skipped, failed)
    log.info("=" * 60)

    # Save results log
    log_path = PROJECT_ROOT / "data" / "raw" / "fetch_15state_log.json"
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    log.info("Log saved to %s", log_path)

    if failed > 0:
        log.info("\nFailed downloads:")
        for r in results:
            if r["status"].startswith("failed"):
                log.info("  [%s] %s — %s", r["state"], r["carrier"], r["message"])


if __name__ == "__main__":
    main()
