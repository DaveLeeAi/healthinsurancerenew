#!/usr/bin/env python3
"""One-time script to update sbm-source-registry.json with 15-state audit results."""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
REG_PATH = PROJECT_ROOT / "data" / "config" / "sbm-source-registry.json"

with open(REG_PATH, encoding="utf-8") as f:
    reg = json.load(f)

new_entries = {
    "CT": [
        {"issuer_id": "86545", "issuer_name": "ConnectiCare (CT)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.connecticare.com/en/-/media/Project/PWS/Microsites/ConnectiCare/PDFs/Members/Marketplace/EN/Pharmacy/CTFormulary2026.pdf",
         "parsed_drug_count": 2420, "verified_date": "2026-04-03",
         "notes": "Molina-based formulary, 4 tiers (incl. Specialty). Parsed with pdfplumber."},
        {"issuer_id": "94815", "issuer_name": "Anthem (CT) - Elevance Health", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_CT_IND.pdf",
         "parsed_drug_count": 2262, "verified_date": "2026-04-03",
         "notes": "4-tier Select Drug List. Elevance FBO/143 pattern."},
    ],
    "DC": [
        {"issuer_id": "94506", "issuer_name": "Kaiser Permanente (DC - MAS)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/mas/marketplace-formulary-mas-en.pdf",
         "parsed_drug_count": 1081, "verified_date": "2026-04-03",
         "notes": "MAS region covers DC+MD+VA. Updated 02/03/2026."},
        {"issuer_id": "28137", "issuer_name": "CareFirst BCBS (DC/MD)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://member.carefirst.com/carefirst-resources/pdf/exchange-formulary-sum7277-2026.pdf",
         "parsed_drug_count": 3584, "verified_date": "2026-04-03",
         "notes": "Single Exchange Formulary covers HIOS 28137, 45532, 94084. 4 tiers + ACA-Preventive."},
    ],
    "ID": [
        {"issuer_id": "38128", "issuer_name": "Blue Cross of Idaho", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://res.cloudinary.com/bluecrossofidaho/image/upload/web/pdfs/pharmacy/2026/2026-Blue-Cross-of-Idaho-QHP-Formulary.pdf",
         "parsed_drug_count": 10, "verified_date": "2026-04-03",
         "notes": "6-tier QHP. Low parse count - needs format-specific parser."},
        {"issuer_id": "92170", "issuer_name": "St. Lukes Health Plan (ID)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.stlukeshealthplan.org/assets/blt41861338f1f78cbf",
         "parsed_drug_count": 2020, "verified_date": "2026-04-03",
         "notes": "5 tiers, Capital Rx PBM."},
    ],
    "KY": [
        {"issuer_id": "36239", "issuer_name": "Anthem (KY) - Elevance Health", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_KY_IND.pdf",
         "parsed_drug_count": 2301, "verified_date": "2026-04-03",
         "notes": "4-tier Select Drug List. Elevance FBO/143 pattern."},
        {"issuer_id": "45636", "issuer_name": "Ambetter (KY) - Centene", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.ambetterhealth.com/content/dam/centene/kentucky/ambetter/pdf/2026-ky-formulary.pdf",
         "parsed_drug_count": 2187, "verified_date": "2026-04-03",
         "notes": "Centene standard format with 1A/1B/2/3/4 tiers."},
        {"issuer_id": "73891", "issuer_name": "Molina Healthcare of KY (Passport)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.molinamarketplace.com/marketplace/ky/en-us/-/media/Molina/PublicWebsite/PDF/members/ky/en-us/Marketplace/2026/KYFormulary2026.pdf",
         "parsed_drug_count": 2432, "verified_date": "2026-04-03",
         "notes": "Molina Marketplace format. 5 counties only (Clark, Fayette, Jessamine, Scott, Woodford)."},
    ],
    "MA": [
        {"issuer_id": "34484", "issuer_name": "Health New England (MA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://healthnewengland.org/Portals/_default/Shared%20Documents/pharmacy/Find%20a%20Drug/2026/Health_New_England_NEHIM.pdf",
         "parsed_drug_count": 3240, "verified_date": "2026-04-03",
         "notes": "3-tier, OptumRx PBM."},
        {"issuer_id": "36046", "issuer_name": "Tufts Health Direct (MA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/harvard-pilgrim/p32-formulary-documents/2026/P32H-Value-Direct-3T-Comprehensive-Tufts.pdf",
         "parsed_drug_count": 2274, "verified_date": "2026-04-03",
         "notes": "3-tier Value Direct. Point32Health."},
        {"issuer_id": "42690", "issuer_name": "Harvard Pilgrim Health Care (MA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/harvard-pilgrim/hphc-formulary-documents/2026-oe/HPHC-Core-MA-5T-Comprehensive.pdf",
         "parsed_drug_count": 2397, "verified_date": "2026-04-03",
         "notes": "5-tier Core MA. OptumRx PBM."},
        {"issuer_id": "31779", "issuer_name": "UnitedHealthcare (MA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.uhcprovider.com/content/dam/provider/docs/public/resources/pharmacy/commercial-pdl-jan-2026.pdf",
         "parsed_drug_count": 0, "verified_date": "2026-04-03",
         "notes": "3-tier Advantage list. Non-standard table layout - needs custom parser."},
        {"issuer_id": "82569", "issuer_name": "WellSense Health Plan (MA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.wellsense.org/hubfs/Pharmacy/MA_Clarity_Formulary_Guidebook_2026.pdf?hsLang=en",
         "parsed_drug_count": 118, "verified_date": "2026-04-03",
         "notes": "5-tier Clarity formulary. Needs parser tuning."},
    ],
    "MD": [
        {"issuer_id": "90296", "issuer_name": "Kaiser Permanente (MD - MAS)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/mas/marketplace-formulary-mas-en.pdf",
         "parsed_drug_count": 1081, "verified_date": "2026-04-03",
         "notes": "Same MAS PDF as DC."},
        {"issuer_id": "72545", "issuer_name": "Wellpoint/Anthem (MD) - Elevance", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_MD_IND.pdf",
         "parsed_drug_count": 2320, "verified_date": "2026-04-03",
         "notes": "4-tier Select Drug List."},
        {"issuer_id": "72375", "issuer_name": "UnitedHealthcare (MD)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-MD_UHC_IFP_PY26.pdf",
         "parsed_drug_count": 0, "verified_date": "2026-04-03",
         "notes": "State-specific IFP PDL. Needs custom parser."},
    ],
    "NJ": [
        {"issuer_id": "91762", "issuer_name": "AmeriHealth NJ", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.amerihealth.com/pdfs/providers/pharmacy_information/value/ah-value-formulary-nj.pdf",
         "parsed_drug_count": 6, "verified_date": "2026-04-03",
         "notes": "5-tier Value Formulary. Needs custom parser for non-standard layout."},
        {"issuer_id": "91661", "issuer_name": "Horizon BCBS NJ", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_NJ_3T_HealthInsuranceMarketplace.pdf",
         "parsed_drug_count": 2858, "verified_date": "2026-04-03",
         "notes": "3-tier Marketplace. Prime Therapeutics dual-column format."},
        {"issuer_id": "37777", "issuer_name": "UnitedHealthcare (NJ)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-NJ_UHC_IFP_PY26.pdf",
         "parsed_drug_count": 0, "verified_date": "2026-04-03",
         "notes": "IFP PDL. Needs custom parser."},
    ],
    "NV": [
        {"issuer_id": "60156", "issuer_name": "Anthem (NV) - Elevance Health", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_NV_IND.pdf",
         "parsed_drug_count": 2312, "verified_date": "2026-04-03",
         "notes": "4-tier Select Drug List."},
        {"issuer_id": "95865", "issuer_name": "SilverSummit/Ambetter (NV) - Centene", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.ambetterhealth.com/content/dam/centene/Nevada/ambetter/pdfs/2026-nv-formulary.pdf",
         "parsed_drug_count": 2173, "verified_date": "2026-04-03",
         "notes": "Centene standard format."},
        {"issuer_id": "41094", "issuer_name": "Hometown Health (NV)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.hometownhealth.com/wp-content/uploads/2025/12/Hometown_Health_IFP_Exchange-Formulary-_Eff-01.01.2026.pdf",
         "parsed_drug_count": 2208, "verified_date": "2026-04-03",
         "notes": "4-tier IFP Exchange. HIOS 43314 shares same formulary."},
        {"issuer_id": "45142", "issuer_name": "Health Plan of Nevada (UHC)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.healthplanofnevada.com/content/dam/hpnv-public-sites/health-plan-of-nevada/documents/pharmacy/2026/UHC8654_25.1_Essential%20Individual%204%20tier%20PDL_JAN26_FINAL.pdf",
         "parsed_drug_count": 0, "verified_date": "2026-04-03",
         "notes": "4-tier Essential Individual PDL. Needs custom parser."},
    ],
    "PA": [
        {"issuer_id": "33709", "issuer_name": "Independence Blue Cross (PA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.ibx.com/documents/35221/56635/value-formulary-guide.pdf",
         "parsed_drug_count": 8, "verified_date": "2026-04-03",
         "notes": "All 5 IBX entities (33709, 79962, 79279, 33871, 31609). Needs custom parser."},
        {"issuer_id": "45127", "issuer_name": "Ambetter (PA) - Centene", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.ambetterhealth.com/content/dam/centene/Pennsylvania/ambetter/pdfs/2026-pa-formulary.pdf",
         "parsed_drug_count": 2198, "verified_date": "2026-04-03",
         "notes": "Centene standard format."},
        {"issuer_id": "86199", "issuer_name": "AmeriHealth (PA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.amerihealth.com/pdfs/providers/pharmacy_information/select_drug/ah_select_drug_guide.pdf",
         "parsed_drug_count": 3, "verified_date": "2026-04-03",
         "notes": "5-tier Select Drug. Needs custom parser."},
        {"issuer_id": "75729", "issuer_name": "Geisinger Health Plan (PA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.geisinger.org/-/media/OneGeisinger/Files/PDFs/Shared-PDFs/Formulary-Updates/Marketplace-Formulary-2026.pdf",
         "parsed_drug_count": 3833, "verified_date": "2026-04-03",
         "notes": "Marketplace 2026. 5 tiers (T1-T5)."},
        {"issuer_id": "19702", "issuer_name": "Jefferson Health Plans (PA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.jeffersonhealthplans.com/content/dam/jeffersonhealthplans/documents/formularies/ifp/rxflex-formulary-jhp-ifp-2026-11012025.pdf",
         "parsed_drug_count": 0, "verified_date": "2026-04-03",
         "notes": "RxFlex Formulary IFP. Needs custom parser."},
    ],
    "VT": [
        {"issuer_id": "13627", "issuer_name": "Blue Cross Blue Shield of Vermont", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.bluecrossvt.org/documents/2026-blue-cross-vt-formulary-booklet",
         "parsed_drug_count": 2807, "verified_date": "2026-04-03",
         "notes": "OptumRx PBM. Multi-tier (TIER 01-05)."},
        {"issuer_id": "77566", "issuer_name": "MVP Health Plan (VT)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.mvphealthcare.com/-/media/project/mvp/healthcare/documents/formularies/2026/marketplace-pharmacy-formulary-2026.pdf",
         "parsed_drug_count": 6163, "verified_date": "2026-04-03",
         "notes": "CVS Caremark PBM. 3 tiers."},
    ],
    "WA": [
        {"issuer_id": "61836", "issuer_name": "Ambetter/Coordinated Care (WA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.ambetterhealth.com/content/dam/centene/Coordinated%20Care/ambetter/PDFs/2026-wa-cascade-formulary.pdf",
         "parsed_drug_count": 2212, "verified_date": "2026-04-03"},
        {"issuer_id": "80473", "issuer_name": "Molina Healthcare (WA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.molinamarketplace.com/marketplace/wa/en-us/-/media/Molina/PublicWebsite/PDF/members/wa/en-us/Marketplace/2026/WAFormulary2026.pdf",
         "parsed_drug_count": 2470, "verified_date": "2026-04-03"},
        {"issuer_id": "53732", "issuer_name": "BridgeSpan Health (WA) - Cambia", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://fm.formularynavigator.com/MemberPages/pdf/StateExchangeFormularyWA_2076_Full_442.pdf",
         "parsed_drug_count": 2387, "verified_date": "2026-04-03"},
        {"issuer_id": "49831", "issuer_name": "Premera Blue Cross (WA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.premera.com/documents/052146_2026.pdf",
         "parsed_drug_count": 41, "verified_date": "2026-04-03",
         "notes": "4-tier Metallic M4. Low parse count - needs custom parser."},
        {"issuer_id": "38498", "issuer_name": "LifeWise Health Plan (WA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.wahealthplan.org/wp-content/uploads/2024/02/LifeWise-2026-Pharmacy-Formulary.pdf",
         "parsed_drug_count": 57, "verified_date": "2026-04-03",
         "notes": "Cambia subsidiary. Low count - needs custom parser."},
        {"issuer_id": "23371", "issuer_name": "Kaiser Permanente (WA - NW)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/nw/washington-marketplace-formulary-nw-en-2026-commercial.pdf",
         "parsed_drug_count": 180, "verified_date": "2026-04-03",
         "notes": "NW region. Low count - multi-column layout needs custom parser."},
        {"issuer_id": "18581", "issuer_name": "Community Health Plan of WA", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://individualandfamily.chpw.org/wp-content/uploads/cascade-select/content/member/pharmacy/CS_RX010_Formulary_2026.pdf",
         "parsed_drug_count": 36, "verified_date": "2026-04-03",
         "notes": "Cascade Select. Express Scripts PBM. Low count - needs custom parser."},
        {"issuer_id": "62650", "issuer_name": "UnitedHealthcare (WA)", "status": "pdf_live", "format": "pdf",
         "direct_pdf_url": "https://www.wahealthplan.org/wp-content/uploads/2024/02/UHC-2026-WA-Formulary.pdf",
         "parsed_drug_count": 0, "verified_date": "2026-04-03",
         "notes": "WA-specific. Needs custom parser."},
    ],
}

added = 0
updated = 0
for state, entries in new_entries.items():
    if state not in reg["states"]:
        reg["states"][state] = {"exchange_name": f"{state} Exchange", "exchange_url": "", "issuers": []}
    existing_ids = {iss.get("issuer_id") for iss in reg["states"][state].get("issuers", [])}
    for entry in entries:
        if entry["issuer_id"] not in existing_ids:
            reg["states"][state]["issuers"].append(entry)
            added += 1
            print(f"  + {state} {entry['issuer_id']} {entry['issuer_name']}")
        else:
            for iss in reg["states"][state]["issuers"]:
                if iss.get("issuer_id") == entry["issuer_id"]:
                    iss.update(entry)
                    updated += 1
                    print(f"  ~ {state} {entry['issuer_id']} {entry['issuer_name']}")
                    break

reg["last_updated"] = "2026-04-03 (15-state PDF audit: 41 PDFs fetched, 65,266 drugs parsed across 11 states)"

with open(REG_PATH, "w", encoding="utf-8") as f:
    json.dump(reg, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"\nDone: {added} added, {updated} updated in {REG_PATH.name}")
