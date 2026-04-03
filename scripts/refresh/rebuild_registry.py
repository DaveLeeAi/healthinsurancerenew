"""
One-time script to rebuild formulary-url-registry-2026.json from ground truth data files.
Fixes drug counts, adds missing carriers, backfills URLs, adds fetch_method flags.
"""
import json
import os
import glob
import copy
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REGISTRY_PATH = os.path.join(ROOT, "data", "config", "formulary-url-registry-2026.json")
OUTPUT_PATH = REGISTRY_PATH  # overwrite in place

def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def get_data_file_counts():
    """Get actual record counts per state from data files."""
    counts = {}
    pattern = os.path.join(ROOT, "data", "processed", "formulary_sbm_*.json")
    for f in sorted(glob.glob(pattern)):
        basename = os.path.basename(f)
        if "_merged" in basename or "_old" in basename:
            continue
        # Skip individual CA carrier files — they're included in CA aggregate
        parts = basename.replace(".json", "").split("_")
        if len(parts) >= 4 and parts[2].upper() == "CA" and len(parts[2]) == 2:
            continue  # e.g., formulary_sbm_CA_kaiser.json
        # WI_medica is special — supplement to FFE WI
        if "WI_medica" in basename:
            continue

        state = parts[2].upper() if len(parts) >= 3 else "?"
        if len(state) != 2:
            continue

        try:
            data = load_json(f)
            record_count = len(data.get("data", [])) if isinstance(data, dict) else 0
            counts[state] = record_count
        except Exception as e:
            print(f"  ERROR reading {basename}: {e}")
    return counts

def get_issuer_results():
    """Extract issuer_results metadata from all data files."""
    results = {}
    pattern = os.path.join(ROOT, "data", "processed", "formulary_sbm_*.json")
    for f in sorted(glob.glob(pattern)):
        basename = os.path.basename(f)
        if "_merged" in basename or "_old" in basename:
            continue
        parts = basename.replace(".json", "").split("_")
        if len(parts) >= 4 and parts[2].upper() == "CA" and len(parts[2]) == 2:
            continue
        if "WI_medica" in basename:
            continue

        state = parts[2].upper() if len(parts) >= 3 else "?"
        if len(state) != 2:
            continue

        try:
            data = load_json(f)
            meta = data.get("metadata", {})
            ir = meta.get("issuer_results", [])
            if isinstance(ir, list) and len(ir) > 0:
                results[state] = ir
        except Exception:
            pass
    return results

# URLs discovered in scripts but missing from registry
SCRIPT_URLS = {
    "CO": {
        "49375": {
            "carrier_name": "Cigna Healthcare (CO)",
            "formulary_url": "https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-co-989873-cigna-rx-essential-5-tier-pdl.pdf",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "Express Scripts",
            "notes": "Direct PDF — also available via Cigna JSON index but this PDF is the actual parsed source"
        },
        "21032": {
            "carrier_name": "Kaiser Permanente (CO)",
            "formulary_url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/co/marketplace-formulary-co-en-2026.pdf",
            "notes": "Direct PDF works even though JSON index returns 403"
        },
        "55584": {
            "carrier_name": "SelectHealth (CO)",
            "formulary_url": "https://selecthealth.org/content/dam/selecthealth/pharmacy/PDFs/colorado-tier6-rxcore.pdf",
            "notes": "Direct PDF from SelectHealth"
        },
        "66699": {
            "carrier_name": "Elevate Health / Denver Health (CO)",
            "formulary_url": "https://www.denverhealthmedicalplan.org/sites/default/files/resources/document/Q1%202026%20Commercial%20formulary.pdf",
            "notes": "Denver Health direct PDF"
        }
    },
    "GA": {
        "51163": {
            "carrier_name": "Alliant Health Plans (GA)",
            "formulary_url": "https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_Alliant_SoloCare_Drug_List.pdf",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "Prime Therapeutics",
            "tiers": 4,
            "drugs_parsed": 1941
        },
        "54172": {
            "carrier_name": "Anthem BCBS (GA)",
            "formulary_url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_GA_IND.pdf",
            "formulary_type": "pdf",
            "source_type": "formulary_navigator",
            "pbm": "IngenioRx",
            "tiers": 4,
            "drugs_parsed": 2164
        },
        "72001": {
            "carrier_name": "CareSource (GA)",
            "formulary_url": "https://www.caresource.com/documents/marketplace-2026-in-formulary.pdf",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "CareSource Pharmacy",
            "tiers": 4,
            "drugs_parsed": 1852
        },
        "58081": {
            "carrier_name": "Oscar Health (GA)",
            "formulary_url": "https://assets.ctfassets.net/plyq12u1bv8a/1BRyy9wlIB2GkFVaATc5Or/e3492bf8adca3b47da8e3ac20060b0af/Oscar_6T_GA_STND_Member_Doc__April_2026__as_of_03252026.pdf",
            "formulary_type": "pdf",
            "source_type": "contentful_cdn",
            "pbm": "Oscar (in-house)",
            "tiers": 6,
            "drugs_parsed": 2442
        },
        "15105": {
            "carrier_name": "Cigna Healthcare (GA)",
            "formulary_url": None,
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "Express Scripts",
            "tiers": 5,
            "drugs_parsed": 5642,
            "notes": "URL pattern: cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-ga-[CODE]-cigna-rx-plus-5-tier-pdl.pdf — exact doc code needs discovery"
        },
        "89942": {
            "carrier_name": "Kaiser Permanente (GA)",
            "formulary_url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/ga/marketplace-formulary-ga-en-2026.pdf",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "Self-integrated",
            "tiers": 4,
            "drugs_parsed": 4277
        },
        "45334": {
            "carrier_name": "Anthem / Elevance Health (GA)",
            "formulary_url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_GA_IND.pdf",
            "formulary_type": "pdf",
            "source_type": "formulary_navigator",
            "pbm": "IngenioRx",
            "tiers": 4,
            "drugs_parsed": 3731,
            "notes": "Same PDF as Anthem BCBS (54172) — shared Elevance formulary"
        },
        "13535": {
            "carrier_name": "UnitedHealthcare (GA)",
            "formulary_url": "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-GA_UHC_IFP_PY26.pdf",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "OptumRx",
            "tiers": 4,
            "drugs_parsed": 3616
        },
        "83761": {
            "carrier_name": "Alliant Health Plans (GA) - JSON",
            "formulary_url": "CMS Machine-Readable PUF",
            "formulary_type": "json",
            "source_type": "cms_puf",
            "pbm": "Prime Therapeutics",
            "tiers": 4,
            "drugs_parsed": 3373,
            "notes": "Via FFE PUF pipeline. HIOS 83761 is the Alliant JSON entry."
        }
    },
    "NY": {
        "41046": {
            "carrier_name": "Anthem / Elevance (NY)",
            "formulary_url": "https://fm.formularynavigator.com/FBO/143/2026_Select_3_Tier_NY_ABS_IND.pdf",
            "formulary_type": "pdf",
            "source_type": "formulary_navigator",
            "pbm": "IngenioRx",
            "tiers": 3,
            "drugs_parsed": 2343
        },
        "40064": {
            "carrier_name": "Excellus BCBS (NY)",
            "formulary_url": "https://fm.formularynavigator.com/FBO/251/Excellus_2026_Metal_Plans_Base___Simply_Blue_Plus___College_Blue_Plans_Formulary_Guide_2981_v26.pdf",
            "formulary_type": "pdf",
            "source_type": "formulary_navigator",
            "pbm": "Excellus Pharmacy",
            "tiers": 4,
            "drugs_parsed": 3530
        },
        "54235": {
            "carrier_name": "UnitedHealthcare (NY)",
            "formulary_url": "https://www.uhc.com/content/dam/uhcdotcom/en/Pharmacy/PDFs/IFP_M58643_UHC_NY-PDL-12312025.pdf",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "OptumRx",
            "tiers": 3,
            "drugs_parsed": 3373
        },
        "91237": {
            "carrier_name": "Healthfirst (NY)",
            "formulary_url": "https://assets.healthfirst.org/pdf_wKm3xvi0oXWk/2026-leaf-leaf-premier-ep-hmo-nysoh-formulary-english",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "Healthfirst Pharmacy",
            "tiers": 4,
            "drugs_parsed": 3631
        },
        "88582": {
            "carrier_name": "EmblemHealth (NY)",
            "formulary_url": "https://www.emblemhealth.com/content/dam/emblemhealth/pdfs/resources/formularies/2026/essential-plan-individual-family-plans-small-group-formulary-2026-emblemhealth.pdf",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "EmblemHealth Pharmacy",
            "tiers": 4,
            "drugs_parsed": 2684
        },
        "11177": {
            "carrier_name": "MetroPlus Health (NY)",
            "formulary_url": "https://metroplus.org/wp-content/uploads/2026/01/Marketplace_EP_Formulary-Document_126_fin.pdf",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "MetroPlus Pharmacy",
            "tiers": 4,
            "drugs_parsed": 2066
        },
        "94788": {
            "carrier_name": "CDPHP (NY)",
            "formulary_url": "https://www.cdphp.com/-/media/files/pharmacy/formulary-1.pdf",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "CDPHP Pharmacy",
            "tiers": 4,
            "drugs_parsed": 6554
        },
        "56184": {
            "carrier_name": "MVP Health Care (NY)",
            "formulary_url": "https://www.mvphealthcare.com/-/media/project/mvp/healthcare/documents/formularies/2026/marketplace-pharmacy-formulary-2026.pdf",
            "formulary_type": "pdf",
            "source_type": "direct_download",
            "pbm": "MVP Pharmacy",
            "tiers": 4,
            "drugs_parsed": 6163
        },
        "18029": {
            "carrier_name": "Independent Health (NY)",
            "formulary_url": "https://fm.formularynavigator.com/FBO/43/2026DrugFormulary1.pdf",
            "formulary_type": "pdf",
            "source_type": "formulary_navigator",
            "pbm": "Independent Health Pharmacy",
            "tiers": 4,
            "drugs_parsed": 1715
        }
    }
}

# URLs to backfill from prompt (13 missing URLs)
BACKFILL_URLS = {
    ("ID", "38128"): "https://res.cloudinary.com/bluecrossofidaho/image/upload/web/pdfs/pharmacy/2026/2026-Blue-Cross-of-Idaho-QHP-Formulary.pdf",
    ("MA", "31779"): "https://www.uhcprovider.com/content/dam/provider/docs/public/resources/pharmacy/commercial-pdl-jan-2026.pdf",
    ("MA", "82569"): "https://www.wellsense.org/hubfs/Pharmacy/MA_Clarity_Formulary_Guidebook_2026.pdf?hsLang=en",
    ("MD", "72375"): "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-MD_UHC_IFP_PY26.pdf",
    ("NJ", "37777"): "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-NJ_UHC_IFP_PY26.pdf",
    ("NV", "45142"): "https://www.healthplanofnevada.com/content/dam/hpnv-public-sites/health-plan-of-nevada/documents/pharmacy/2026/UHC8654_25.1_Essential%20Individual%204%20tier%20PDL_JAN26_FINAL.pdf",
    ("PA", "19702"): "https://www.jeffersonhealthplans.com/content/dam/jeffersonhealthplans/documents/formularies/ifp/rxflex-formulary-jhp-ifp-2026-11012025.pdf",
    ("WA", "18581"): "https://individualandfamily.chpw.org/wp-content/uploads/cascade-select/content/member/pharmacy/CS_RX010_Formulary_2026.pdf",
    ("WA", "23371"): "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/nw/washington-marketplace-formulary-nw-en-2026-commercial.pdf",
    ("WA", "38498"): "https://www.wahealthplan.org/wp-content/uploads/2024/02/LifeWise-2026-Pharmacy-Formulary.pdf",
    ("WA", "49831"): "https://www.premera.com/documents/052146_2026.pdf",
    ("WA", "62650"): "https://www.wahealthplan.org/wp-content/uploads/2024/02/UHC-2026-WA-Formulary.pdf",
}

# Fetch method assignments
FETCH_METHODS = {
    # Manual download carriers
    ("CA", "70285"): ("manual_download", "AdaptiveRx web viewer — save PDF manually"),
    ("CA", "20523"): ("manual_download", "Contentful CDN — go to hioscar.com/forms/{YEAR}, select CA"),
    ("CA", "92499"): ("manual_download", "Bot-protected landing page — navigate anthem.com/ca manually"),
    ("CA", "92815"): ("manual_download", "PDF URL changes each revision — check lacare.org/members/pharmacy"),
    ("CA", "84014"): ("manual_download", "Santa Clara County file server — returns 403 on automated download"),
    ("PA", "22444"): ("manual_download", "FormularyNavigator tool only — no static PDF"),
    ("PA", "16322"): ("manual_download", "JS auth wall on download"),
    ("PA", "98517"): ("manual_download", "Contentful CDN — go to hioscar.com/forms/{YEAR}, select PA"),
    ("NJ", "23818"): ("manual_download", "Contentful CDN — go to hioscar.com/forms/{YEAR}, select NJ"),
    ("GA", "58081"): ("manual_download", "Contentful CDN — hioscar.com/forms/{YEAR}, select GA"),
    ("NY", "25303"): ("manual_download", "Centene API, may need VPN"),

    # Online-only carriers
    ("ID", "61589"): ("online_only", "CVS Caremark online tool only — pacificsource.com/find-a-drug"),
    ("ID", "80588"): ("online_only", "Navitus online tool only — modahealth.com/pdl/"),
    ("ME", "33653"): ("online_only", "Express Scripts embedded JS widget only"),
    ("ME", "54879"): ("online_only", "No 2026 formulary PDF published"),
    ("RI", "77514"): ("online_only", "FormularyNavigator searchable only — no static PDF"),

    # VPN required
    ("RI", "15287"): ("vpn_required", "Cloud-IP blocked — needs US residential VPN from Providence RI area"),
}

def determine_fetch_method(state, hios, carrier):
    """Determine fetch_method for a carrier entry."""
    key = (state, str(hios))
    if key in FETCH_METHODS:
        return FETCH_METHODS[key]

    source_type = carrier.get("source_type", "")
    status = carrier.get("status", "")
    url = carrier.get("formulary_url") or ""

    if source_type == "cms_puf":
        return ("json_api", "Fetched via CMS MR-PUF → carrier index.json → drugs.json chain")
    if source_type in ("centene_api", "cms_json"):
        return ("json_api", "Fetched via JSON API endpoint")
    if source_type == "online_only":
        return ("online_only", "Interactive search tool only — no downloadable file")
    if source_type == "contentful_cdn":
        return ("manual_download", "Contentful CDN — asset IDs change annually, must rediscover")
    if source_type == "adaptiversx":
        return ("manual_download", "AdaptiveRx viewer — save PDF manually")
    if status == "blocked" and not url:
        return ("online_only", "No downloadable endpoint discovered")
    if status == "not_found":
        return ("manual_download", "URL not yet discovered — check carrier website")
    if url and url.startswith("http"):
        return ("auto_download", "PDF downloads directly — no auth needed")
    if url and "CMS Machine-Readable PUF" in url:
        return ("json_api", "Via CMS MR-PUF pipeline")

    return ("auto_download", "Direct download")


def main():
    print("Loading registry...")
    registry = load_json(REGISTRY_PATH)

    print("Loading data file counts...")
    data_counts = get_data_file_counts()
    print(f"  Found counts for {len(data_counts)} states: {sorted(data_counts.keys())}")
    for st, count in sorted(data_counts.items()):
        print(f"    {st}: {count:,}")

    print("\nLoading issuer results...")
    issuer_data = get_issuer_results()
    print(f"  Found issuer_results for {len(issuer_data)} states")

    # Update schema version
    registry["schema_version"] = "2.0"
    registry["last_updated"] = datetime.now().strftime("%Y-%m-%d")

    # Fix state drug totals
    print("\nUpdating state drug totals...")
    for state, count in data_counts.items():
        if state in registry["states"]:
            old = registry["states"][state].get("state_drugs_total", 0) or 0
            if old != count:
                print(f"  {state}: {old:,} → {count:,}")
                registry["states"][state]["state_drugs_total"] = count

    # Add missing GA carriers
    print("\nAdding missing GA carriers...")
    ga = registry["states"]["GA"]
    existing_hios = {c.get("hios_prefix") for c in ga["carriers"]}

    for hios, info in SCRIPT_URLS.get("GA", {}).items():
        if hios not in existing_hios:
            entry = {
                "carrier_name": info["carrier_name"],
                "hios_prefix": hios,
                "formulary_url": info.get("formulary_url"),
                "formulary_type": info.get("formulary_type", "pdf"),
                "source_type": info.get("source_type", "direct_download"),
                "pbm": info.get("pbm", "Unknown"),
                "tiers": info.get("tiers", 4),
                "status": "verified" if info.get("formulary_url") else "parsed_but_url_unknown",
                "last_fetched": "2026-04-03",
                "drugs_parsed": info.get("drugs_parsed"),
                "year_pattern": "See url_patterns section",
                "notes": info.get("notes", "Discovered in parse scripts, backfilled to registry")
            }
            ga["carriers"].append(entry)
            print(f"  Added GA carrier: {hios} {info['carrier_name']}")

    # Remove the generic "FFE PUF carriers" entry from GA since we now have individual entries
    ga["carriers"] = [c for c in ga["carriers"] if c.get("hios_prefix") != "MULTIPLE"]

    # Add missing NY carrier entries
    print("\nUpdating NY carriers...")
    ny = registry["states"].get("NY", {})
    if ny:
        ny_existing = {c.get("hios_prefix") for c in ny.get("carriers", [])}
        for hios, info in SCRIPT_URLS.get("NY", {}).items():
            if hios not in ny_existing:
                entry = {
                    "carrier_name": info["carrier_name"],
                    "hios_prefix": hios,
                    "formulary_url": info["formulary_url"],
                    "formulary_type": info.get("formulary_type", "pdf"),
                    "source_type": info.get("source_type", "direct_download"),
                    "pbm": info.get("pbm", "Unknown"),
                    "tiers": info.get("tiers", 4),
                    "status": "verified",
                    "last_fetched": "2026-04-03",
                    "drugs_parsed": info.get("drugs_parsed"),
                    "year_pattern": "See url_patterns section",
                    "notes": info.get("notes", "URL discovered in parse scripts")
                }
                ny["carriers"].append(entry)
                print(f"  Added NY carrier: {hios} {info['carrier_name']}")
            else:
                # Update existing entry with URL if it was null/blocked
                for c in ny["carriers"]:
                    if c.get("hios_prefix") == hios:
                        if not c.get("formulary_url") or c.get("status") == "blocked":
                            c["formulary_url"] = info["formulary_url"]
                            c["drugs_parsed"] = info.get("drugs_parsed", c.get("drugs_parsed"))
                            c["status"] = "verified"
                            print(f"  Updated NY carrier URL: {hios} {info['carrier_name']}")
                        break

    # Backfill URLs from CO scripts
    print("\nBackfilling CO carrier URLs from scripts...")
    co = registry["states"].get("CO", {})
    if co:
        for c in co.get("carriers", []):
            hios = c.get("hios_prefix", "")
            if hios in SCRIPT_URLS.get("CO", {}):
                script_info = SCRIPT_URLS["CO"][hios]
                if script_info.get("formulary_url") and (not c.get("formulary_url") or "cms-data-index" in str(c.get("formulary_url", "")) or c.get("status") == "blocked"):
                    old_url = c.get("formulary_url") or "None"
                    new_url = script_info.get("formulary_url") or ""
                    if new_url:
                        c["formulary_url"] = new_url
                        c["status"] = "verified"
                        if script_info.get("notes"):
                            c["notes"] = (c.get("notes", "") + " " + script_info["notes"]).strip()
                        print(f"  Updated CO {hios}: {old_url[:50]} -> {new_url[:60]}")

    # Backfill the 13 missing URLs from prompt
    print("\nBackfilling 13 missing URLs...")
    for (state, hios), url in BACKFILL_URLS.items():
        if state in registry["states"]:
            for c in registry["states"][state]["carriers"]:
                if c.get("hios_prefix") == hios:
                    if not c.get("formulary_url") or c.get("drugs_parsed") == 0:
                        c["formulary_url"] = url
                        c["status"] = "verified"
                        print(f"  Backfilled {state}/{hios}: {url[:70]}...")
                    break

    # Add fetch_method to ALL carrier entries
    print("\nAdding fetch_method to all carriers...")
    for state, info in registry["states"].items():
        for c in info.get("carriers", []):
            hios = c.get("hios_prefix", "")
            method, notes = determine_fetch_method(state, hios, c)
            c["fetch_method"] = method
            c["fetch_notes"] = notes

    # Update summary
    sbm_total = sum(
        info.get("state_drugs_total", 0) or 0
        for info in registry["states"].values()
        if info.get("exchange_type") == "SBM"
    )
    registry["summary"]["sbm_drugs_total"] = sbm_total
    registry["summary"]["total_drugs"] = registry["summary"]["ffe_drugs_total"] + sbm_total

    # Add market intelligence section
    registry["market_intelligence"] = {
        "market_exits_2026": [
            {"carrier": "Aetna/CVS Health", "states": ["ALL"], "effective": "2026-01-01", "notes": "Complete ACA individual market withdrawal nationally (but new CA entity discovered via FormularyNavigator)"},
            {"carrier": "CareSource", "states": ["KY"], "effective": "2026-01-01"},
            {"carrier": "Friday Health Plans", "states": ["CO"], "effective": "2023-08-31", "notes": "Liquidated"},
            {"carrier": "Bright Health", "states": ["CO"], "effective": "2023-01-01"},
            {"carrier": "Oscar Health", "states": ["CO"], "effective": "2023-01-01"}
        ],
        "new_entrants_2026": [
            {"carrier": "Aetna (FormularyNavigator)", "states": ["CA"], "notes": "New to Covered California — FormularyNavigator FBO/41"},
            {"carrier": "Illinois transitioned FFE→SBM", "states": ["IL"], "notes": "Get Covered Illinois launched PY2026"}
        ],
        "blocked_carriers": [
            {"carrier": "BCBS RI", "hios": "15287", "state": "RI", "reason": "Cloud-IP blocked + Prime Therapeutics interactive tool only", "workaround": "VPN to US residential IP"},
            {"carrier": "NHPRI", "hios": "77514", "state": "RI", "reason": "FormularyNavigator searchable only, no static PDF"},
            {"carrier": "PacificSource Choice", "hios": "61589", "state": "ID", "reason": "CVS Caremark online tool only"},
            {"carrier": "Moda Health", "hios": "80588", "state": "ID", "reason": "Navitus online tool only"},
            {"carrier": "Community Health Options", "hios": "33653", "state": "ME", "reason": "Express Scripts embedded JS widget only"},
            {"carrier": "Taro Health/Mending", "hios": "54879", "state": "ME", "reason": "No 2026 formulary PDF published"}
        ],
        "sbm_states_2026": {
            "full_sbm": ["CA", "CO", "CT", "DC", "GA", "ID", "IL", "KY", "MA", "MD", "ME", "MN", "NJ", "NM", "NV", "NY", "PA", "RI", "VA", "VT", "WA"],
            "sbm_fp": ["AR", "OR"],
            "transitioning_2027": ["OR (→ full SBM)", "OK (→ SBM-FP)"],
            "notes": "IL was new SBM for 2026. OR transitions to full SBM for PY2027. OK transitions to SBM-FP May 2026."
        }
    }

    # Expand url_patterns section
    registry["url_patterns"] = {
        "anthem_formularynavigator": {
            "pattern": "https://fm.formularynavigator.com/FBO/143/{YEAR}_Select_4_Tier_{ST}_IND.pdf",
            "confirmed_states_2026": ["CO", "CT", "GA", "KY", "MD", "ME", "NV"],
            "pbm": "IngenioRx / CVS Caremark",
            "tiers": 4,
            "refresh_method": "Replace year in URL",
            "notes": "FBO/143 is the Anthem/Elevance code. NY uses 3-tier variant (FBO/143/...3_Tier_NY_ABS_IND.pdf)"
        },
        "ambetter_centene_pdf": {
            "pattern": "https://www.ambetterhealth.com/content/dam/centene/{Subsidiary}/ambetter/pdf/{YEAR}-{st}-formulary.pdf",
            "confirmed_states_2026": ["KY", "NV", "PA", "WA", "NM"],
            "pbm": "Centene Pharmacy Services",
            "tiers": "4-6 varies",
            "refresh_method": "Replace year in URL. Subsidiary name varies per state.",
            "subsidiary_map": {
                "KY": "kentucky",
                "NV": "Nevada",
                "PA": "Pennsylvania",
                "WA": "Coordinated%20Care",
                "NM": "ambetter-from-western-sky-community-care",
                "CA": "healthnet (via healthnet.com not ambetterhealth.com)"
            }
        },
        "centene_api_json": {
            "pattern": "https://api.centene.com/ambetter/reference/drugs-AMB-{ST}.json",
            "confirmed_states_2026": ["GA", "IL", "KY", "NJ", "NV", "PA", "WA"],
            "pbm": "Centene Pharmacy Services",
            "refresh_method": "Same URL — content updates annually"
        },
        "molina_marketplace_pdf": {
            "pattern": "https://www.molinamarketplace.com/marketplace/{st}/en-us/-/media/Molina/PublicWebsite/PDF/members/{st}/en-us/Marketplace/{YEAR}/{ST}Formulary{YEAR}.pdf",
            "confirmed_states_2026": ["CA", "KY", "NM", "WA"],
            "pbm": "CVS Caremark / Molina Pharmacy",
            "refresh_method": "Replace year (appears twice). st=lowercase, ST=uppercase."
        },
        "uhc_ifp_pdl": {
            "pattern": "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP{DOC_ID}-{ST}_UHC_IFP_PY{YY}.pdf",
            "confirmed_states_2026": ["CO", "GA", "MD", "NJ"],
            "pbm": "OptumRx",
            "refresh_method": "Replace PY26 with PY27. DOC_ID may change.",
            "doc_ids": {"CO": "1432766", "GA": "2895550", "MD": "2895550", "NJ": "2895550"}
        },
        "kaiser_marketplace_pdf": {
            "pattern": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/{region}/marketplace-formulary-{region}-en-{YEAR}.pdf",
            "confirmed_states_2026": ["CA", "CO", "GA"],
            "pbm": "Self-integrated (Kaiser owns pharmacies)",
            "refresh_method": "Replace year. Region codes: ca, co, ga, mas (DC/MD/VA), nw (WA/OR).",
            "region_map": {"CA": "ca", "CO": "co", "GA": "ga", "DC": "mas", "MD": "mas", "VA": "mas", "WA": "nw", "OR": "nw"}
        },
        "caresource_marketplace_pdf": {
            "pattern": "https://www.caresource.com/documents/marketplace-{YEAR}-{st}-formulary.pdf",
            "confirmed_states_2026": ["CT", "GA", "IN"],
            "pbm": "Internal",
            "refresh_method": "Replace year in URL. CareSource exited KY for 2026."
        },
        "myprime_formulary_pdf": {
            "pattern": "https://www.myprime.com/content/dam/prime/memberportal/WebDocs/{YEAR}/Formularies/HIM/{FILENAME}.pdf",
            "confirmed_states_2026": ["GA (Alliant)", "MN (Blue Plus)", "NJ (Horizon)"],
            "pbm": "Prime Therapeutics",
            "refresh_method": "Replace year in path. FILENAME varies per carrier."
        },
        "carefirst_exchange_pdf": {
            "pattern": "https://member.carefirst.com/carefirst-resources/pdf/exchange-formulary-{DOC_CODE}-{YEAR}.pdf",
            "confirmed_states_2026": ["DC", "MD", "VA"],
            "pbm": "CVS Caremark",
            "refresh_method": "Replace year. DOC_CODE (sum7277) may change annually.",
            "notes": "Single PDF covers ALL CareFirst entities across DC/MD/VA (3 HIOS IDs, 1 formulary)"
        },
        "oscar_contentful_cdn": {
            "pattern": "https://assets.ctfassets.net/plyq12u1bv8a/{ASSET_ID}/{HASH}/Oscar_{TIER}T_{ST}_STND_Member_Doc__{MONTH}_{YEAR}__as_of_{DATE}.pdf",
            "confirmed_states_2026": ["GA", "AZ", "TX", "TN", "FL"],
            "pbm": "Oscar (in-house)",
            "refresh_method": "CANNOT increment year — asset ID and hash change every year. Must re-discover via hioscar.com/forms/{YEAR} or hioscar.com/search-documents/drug-formularies/",
            "notes": "Oscar uses Contentful CDN with unique asset IDs per document. JS-rendered page requires browser."
        },
        "optumrx_contenthub_pdf": {
            "pattern": "https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/{carrier}/{path}.pdf",
            "confirmed_states_2026": ["CA (Western Health Advantage)", "MA (Harvard Pilgrim, Tufts)"],
            "pbm": "OptumRx",
            "refresh_method": "Path includes year subfolder — replace year. Carrier path is stable."
        },
        "cambia_json": {
            "pattern": "https://cms-machine-readable.cambiahealth.com/index.json",
            "confirmed_states_2026": ["ID", "OR", "WA"],
            "pbm": "Cambia Pharmacy",
            "refresh_method": "Same URL — content updates. drugs1.json + drugs2.json (each ~112MB)."
        }
    }

    # Write output
    print(f"\nWriting corrected registry to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

    # Compute stats
    carrier_count = 0
    sbm_carrier_count = 0
    auto_count = 0
    manual_count = 0
    online_count = 0
    vpn_count = 0
    json_count = 0
    for state, info in registry["states"].items():
        for c in info.get("carriers", []):
            carrier_count += 1
            if info.get("exchange_type") == "SBM":
                sbm_carrier_count += 1
            fm = c.get("fetch_method", "")
            if fm == "auto_download": auto_count += 1
            elif fm == "manual_download": manual_count += 1
            elif fm == "online_only": online_count += 1
            elif fm == "vpn_required": vpn_count += 1
            elif fm == "json_api": json_count += 1

    print(f"\n=== REGISTRY STATS ===")
    print(f"Total carrier entries: {carrier_count}")
    print(f"SBM carrier entries: {sbm_carrier_count}")
    print(f"FFE drugs: {registry['summary']['ffe_drugs_total']:,}")
    print(f"SBM drugs: {sbm_total:,}")
    print(f"Total drugs: {registry['summary']['ffe_drugs_total'] + sbm_total:,}")
    print(f"\nFetch methods:")
    print(f"  auto_download: {auto_count}")
    print(f"  json_api: {json_count}")
    print(f"  manual_download: {manual_count}")
    print(f"  online_only: {online_count}")
    print(f"  vpn_required: {vpn_count}")
    print(f"\nDone!")


if __name__ == "__main__":
    main()
