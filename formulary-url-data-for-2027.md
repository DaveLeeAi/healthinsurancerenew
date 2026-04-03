# Formulary URL Master Reference — Built for 2027 Refresh

> Generated: 2026-04-03 | Plan Year: 2026 data | Total: 518,614 drugs across 50 states + DC
>
> **How to use this file for 2027:**
> 1. Replace "2026" with "2027" in all URLs below
> 2. Run `python scripts/refresh/annual-formulary-refresh.py --from-year 2026 --to-year 2027`
> 3. Download the ⚠️ MANUAL and 🔒 VPN PDFs yourself (see manual-download-list output)
> 4. Skip the 🚫 ONLINE-ONLY carriers (no downloadable file exists)
> 5. Feed downloaded PDFs to Claude Code for parsing

---

## Status Legend

| Icon | Meaning | 2027 Action |
|------|---------|-------------|
| ✅ | Auto-fetch — Claude Code downloads directly | Run refresh script |
| ⚠️ | Manual download — bot-protected or JS-rendered | You download PDF, feed to Claude Code |
| 🔒 | VPN required — geo-blocked from cloud IPs | Connect VPN, download, feed to Claude Code |
| 🔌 | JSON API — fetched via CMS JSON endpoint chain | Run refresh script |
| 🚫 | Online-only — no downloadable PDF or JSON | Skip or scrape (low priority) |
| 📦 | FFE PUF bundle — all carriers via federal CMS file | Download new PUF from CMS |

---

## FFE States (29) — All via CMS Machine-Readable PUF

All carriers in these states come from a single federal data file. No per-carrier URLs needed.

**2027 refresh:** Download new MR-PUF from `data.cms.gov` (released Oct-Nov 2026), run `python scripts/fetch/fetch_formulary_full.py`.

**PY2026 total:** 196,303 drugs across 133 issuers in 29 states.

**AK** 📦 — 2 carriers: Moda Health Plan, Inc., Premera Blue Cross Blue Shield of Alaska
**AL** 📦 — 5 carriers: Ambetter of Alabama, Blue Cross and Blue Shield of Alabama, Humana, Oscar Insurance Company, UnitedHealthcare
**AR** 📦 — 4 carriers: Ambetter from Arkansas Health & Wellness, Arkansas Blue Cross and Blue Shield, Health Advantage, Octave
**AZ** 📦 — 8 carriers: Ambetter from Arizona Complete Health, Antidote Health Plan of Arizona, Inc., Blue Cross Blue Shield of Arizona, Cigna HealthCare of Arizona, Inc, Cigna Healthcare, Humana, Oscar Health Plan, Inc., UnitedHealthcare
**DE** 📦 — 3 carriers: Ambetter Health of Delaware, AmeriHealth Caritas Next, Highmark Blue Cross Blue Shield Delaware
**FL** 📦 — 16 carriers: 22 Health, Ambetter Health, AmeriHealth Caritas Next, AvMed, Capital Health Plan, Cigna HealthCare of Florida, Inc., Cigna Healthcare, Florida Blue (BlueCross BlueShield FL), Florida Blue HMO (a BlueCross BlueShield FL company), Florida Health Care Plans, Health First Commercial Plans, Inc., Humana, Molina Healthcare, Oscar Health Maintenance Organization of Florida, UnitedHealthcare, Wellpoint
**HI** 📦 — 3 carriers: HMSA, Humana, Kaiser Permanente
**IA** 📦 — 6 carriers: Ambetter Health, Avera Health Plans, Medica, Oscar Insurance Company, UnitedHealthcare, Wellmark Health Plan of Iowa, Inc.
**IN** 📦 — 6 carriers: Ambetter Health, Anthem Blue Cross and Blue Shield, CareSource, Cigna Healthcare, Humana, UnitedHealthcare
**KS** 📦 — 6 carriers: Ambetter from Sunflower Health Plan, Blue Cross and Blue Shield of Kansas City, Blue Cross and Blue Shield of Kansas, Inc., Medica, Oscar Insurance Company, UnitedHealthcare
**LA** 📦 — 7 carriers: Ambetter from Louisiana Healthcare Connections, AmeriHealth Caritas Next, Blue Cross and Blue Shield of Louisiana, CHRISTUS Health Plan, HMO Louisiana, Humana, UnitedHealthcare
**MI** 📦 — 9 carriers: Ambetter from Meridian, Blue Care Network of Michigan, Blue Cross Blue Shield of Michigan Mutual Insurance Company, Humana, McLaren Health Plan Community, Oscar Insurance Company, Paramount, Priority Health, UnitedHealthcare
**MO** 📦 — 8 carriers: Ambetter from Home State Health, Anthem Blue Cross and Blue Shield, Blue Cross and Blue Shield of Kansas City, Cox HealthPlans, Humana, Medica, Oscar Insurance Company, UnitedHealthcare
**MS** 📦 — 6 carriers: Ambetter from Magnolia Health, Cigna Healthcare, Humana, Molina Healthcare, Oscar Health Plan, Inc., UnitedHealthcare
**MT** 📦 — 3 carriers: Blue Cross and Blue Shield of Montana, Mountain Health CO-OP, PacificSource Health Plans
**NC** 📦 — 7 carriers: Ambetter of North Carolina, AmeriHealth Caritas Next, Blue Cross and Blue Shield of NC, Cigna Healthcare, Humana, Oscar Health Plan of North Carolina, Inc, UnitedHealthcare
**ND** 📦 — 3 carriers: Blue Cross Blue Shield of North Dakota, Medica, Sanford Health Plan
**NE** 📦 — 5 carriers: Ambetter Health, Blue Cross and Blue Shield of Nebraska, Medica, Oscar Insurance Company, UnitedHealthcare
**NH** 📦 — 5 carriers: Ambetter from NH Healthy Families, Anthem Blue Cross and Blue Sheld, Anthem Blue Cross and Blue Shield, Harvard Pilgrim Health Care, WellSense Health Plan
**OH** 📦 — 12 carriers: Ambetter from Buckeye Health Plan, Anthem Blue Cross and Blue Shield, Antidote Health Plan of Ohio, Inc., CareSource, Humana, MedMutual, Molina Healthcare, Oscar Health Insurance, Oscar Insurance Corporation of Ohio, Paramount, SummaCare, UnitedHealthcare
**OK** 📦 — 8 carriers: Ambetter of Oklahoma, Blue Cross and Blue Shield of Oklahoma, CommunityCare, Humana, Medica, Mending Health, Oscar Insurance Company, UnitedHealthcare
**SC** 📦 — 6 carriers: Ambetter from Absolute Total Care, BlueCross BlueShield of South Carolina, First Choice Next, InStil Health, Molina Healthcare, UnitedHealthcare
**SD** 📦 — 3 carriers: Avera Health Plans, Sanford Health Plan, Wellmark of South Dakota, Inc.
**TN** 📦 — 7 carriers: Alliant Health Plans, Inc., Ambetter of Tennessee, BlueCross BlueShield of Tennessee, Cigna Healthcare, Humana, Oscar Insurance Company, UnitedHealthcare
**TX** 📦 — 17 carriers: Ambetter from Superior HealthPlan, Baylor Scott and White Health Plan, Blue Cross and Blue Shield of Texas, CHRISTUS Health Plan, Cigna Healthcare, Community First, Community Health Choice, DeltaCare USA, Harbor Health, Humana, MetLife, Moda Health Plan, Inc., Molina Healthcare, Oscar Insurance Company, Sendero Health Plans, Local Nonprofit, UnitedHealthcare, WellPoint
**UT** 📦 — 9 carriers: BridgeSpan Health Company, DeltaCare USA, Humana, Imperial Health Plan of the Southwest, Inc., Molina Healthcare, Regence BlueCross BlueShield of Utah, Select Health, UnitedHealthcare, University of Utah Health Plans
**WI** 📦 — 13 carriers: Anthem Blue Cross and Blue Shield, Aspirus Health Plan, CareSource (Common Ground Healthcare), Dean Health Plan, Group Health Cooperative-SCW, HealthPartners, Humana, Medica, MercyCare Health Plans, Network Health, Quartz, Security Health Plan, UnitedHealthcare
**WV** 📦 — 2 carriers: CareSource, Highmark Blue Cross Blue Shield West Virginia
**WY** 📦 — 2 carriers: Blue Cross Blue Shield of Wyoming, UnitedHealthcare

---

## SBM States (22) — Per-Carrier URLs

### CA — Covered California — 41,910 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Blue Shield of California | 70285 | 6,889 | ⚠️ | AdaptiveRx web viewer — save PDF manually URL: `https://blueshieldca.adaptiverx.com/web/pdf?key=8F02B26A288102C27BAC82D14C006C6FC54D480F80409B6859E59FD67B258E57` |
| 2 | IEHP (Inland Empire Health Plan) | 51396 | 5,939 | ✅ | `https://www.iehp.org/content/dam/iehp-org/en/documents/coveredcalifornia/Formulary.pdf` |
| 3 | Western Health Advantage (CA) | 93689 | 5,577 | ✅ | `https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/western-health/Premium-Prescription-Drug-Plan-Infertility.pdf` |
| 4 | Chinese Community Health Plan (CCHP) | 27603 | 5,471 | ✅ | `https://balancebycchp.com/wp-content/uploads/2026/03/2026_CCHP_March_Commercial_Exchange_Formulary_26.03.01.pdf` |
| 5 | Kaiser Permanente (CA) | 40513 | 3,175 | ✅ | `https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/ca/commercial-marketplace-formulary-ca-en-2026-drug-formulary.pdf` |
| 6 | L.A. Care Health Plan | 92815 | 3,128 | ⚠️ | PDF URL changes each revision — check lacare.org/members/pharmacy URL: `https://www.lacare.org/members/pharmacy` |
| 7 | Aetna (CA) | unknown_aetna_ca | 2,580 | ✅ | `https://fm.formularynavigator.com/FBO/41/2026_Advanced_Control_Plan_Aetna_CA.pdf` |
| 8 | Oscar Health Plan of California | 20523 | 2,502 | ⚠️ | Contentful CDN — go to hioscar.com/forms/{YEAR}, select CA |
| 9 | Anthem Blue Cross (CA) | 92499 | 2,074 | ⚠️ | Bot-protected landing page — navigate anthem.com/ca manually URL: `https://www.anthem.com/ca/ms/home.html#formulary` |
| 10 | Valley Health Plan (CA) | 84014 | 2,028 | ⚠️ | Santa Clara County file server — returns 403 on automated download URL: `https://files.santaclaracounty.gov/exjcpb1461/2025-11/covered-california-and-individual-and-family-plan-formulary-2026-110525.pdf` |
| 11 | Ambetter from Health Net (CA) | 67138 | 1,422 | ✅ | `http://healthnet.com/content/dam/centene/healthnet/pdfs/general/ca/pharmacy/hn-ambetter-essential-drug-list-2026.pdf` |
| 12 | Molina Healthcare (CA) | 18126 | 1,125 | ✅ | `https://www.molinamarketplace.com/Marketplace/CA/en-us/MemberForms.aspx/-/media/Molina/PublicWebsite/PDF/members/ca/en-us/Marketplace/2026/CAFormulary2026.pdf` |

### CO — Connect for Health Colorado — 18,320 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Cigna Healthcare (CO) | 86830 | 5,699 | 🔌 | `https://www.cigna.com/sites/json/cms-data-index.json` |
| 2 | Anthem / Elevance Health (CO) | 76680 | 1,879 | ✅ | `https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_CO_IND.pdf` |
| 3 | Elevate Health / Denver Health (CO) | 66699 | 1,786 | 🔌 | `https://www.denverhealthmedicalplan.org/sites/default/files/resources/document/Q1%202026%20Commercial%20formulary.pdf` |
| 4 | Rocky Mountain HMO / UHC (CO) | 97879 | 1,299 | ✅ | `https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP1432766-CO_UHC_IFP_PY26.pdf` |
| 5 | SelectHealth (CO) | 55584 | 717 | 🔌 | `https://selecthealth.org/content/dam/selecthealth/pharmacy/PDFs/colorado-tier6-rxcore.pdf` |
| 6 | Kaiser Permanente (CO) | 00543 | 0 | 🔌 | `https://healthy.kaiserpermanente.org/content/dam/kporg/data/co/cms-data-index.json` |

### CT — Access Health CT — 8,417 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Anthem (CT) - Elevance Health | 94815 | 4,605 | ✅ | `https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_CT_IND.pdf` |
| 2 | Molina Healthcare (CT) | 00560 | 3,812 | 🔌 | `https://www.molinahealthcare.com/cmsjson/378245/cms/index.json` |
| 3 | ConnectiCare (CT) | 86545 | 2,420 | ✅ | `https://www.connecticare.com/en/-/media/Project/PWS/Microsites/ConnectiCare/PDFs/Members/Marketplace/EN/Pharmacy/CTFormulary2026.pdf` |
| 4 | CareSource (CT) | 76962 | 0 | ✅ | `https://www.caresource.com/documents/marketplace-2026-ct-formulary.pdf` |

### DC — DC Health Link — 8,965 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Molina Healthcare (DC) | 10207 | 4,300 | 🔌 | `https://www.molinahealthcare.com/cmsjson/378245/cms/index.json` |
| 2 | CareFirst BCBS (DC/MD) | 28137 | 3,584 | ✅ | `https://member.carefirst.com/carefirst-resources/pdf/exchange-formulary-sum7277-2026.pdf` |
| 3 | Kaiser Permanente (DC - MAS region) | 94506 | 1,081 | ✅ | `https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/mas/marketplace-formulary-mas-en.pdf` |
| 4 | UPMC Health Plan (DC) | 78079 | 0 | ✅ | `https://upmc.widen.net/view/pdf/02jjoeuifc/25TOTEX6064850---2026-Advantage-Choice-Formulary-Book_WEB.pdf?t.download=true&u=oid6pr` |

### GA — Georgia Access — 30,248 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Cigna Healthcare (GA) | 15105 | 5,642 | ✅ | (no URL) |
| 2 | Ambetter / Peach State Health (GA) | 45495 | 4,424 | 🔌 | `https://api.centene.com/ambetter/reference/drugs-AMB-GA.json` |
| 3 | Kaiser Permanente (GA) | 89942 | 4,277 | ✅ | `https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/ga/marketplace-formulary-ga-en-2026.pdf` |
| 4 | Anthem / Elevance Health (GA) | 45334 | 3,690 | ✅ | `https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_GA_IND.pdf` |
| 5 | UnitedHealthcare (GA) | 13535 | 3,616 | ✅ | `https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-GA_UHC_IFP_PY26.pdf` |
| 6 | Alliant Health Plans (GA) - JSON | 83761 | 3,262 | 🔌 | CMS Machine-Readable PUF |
| 7 | Oscar Health (GA) | 58081 | 2,442 | ⚠️ | Contentful CDN — hioscar.com/forms/{YEAR}, select GA URL: `https://assets.ctfassets.net/plyq12u1bv8a/1BRyy9wlIB2GkFVaATc5Or/e3492bf8adca3b47da8e3ac20060b0af/Oscar_6T_GA_STND_Member_Doc__April_2026__as_of_03252026.pdf` |
| 8 | Anthem BCBS (GA) | 54172 | 2,164 | ✅ | `https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_GA_IND.pdf` |
| 9 | Alliant Health Plans (GA) | 51163 | 1,941 | ✅ | `https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_Alliant_SoloCare_Drug_List.pdf` |
| 10 | CareSource (GA) | 72001 | 1,852 | ✅ | `https://www.caresource.com/documents/marketplace-2026-in-formulary.pdf` |

### ID — Your Health Idaho — 24,421 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | PacificSource (ID) | 60597 | 8,249 | 🔌 | `https://enroll.pacificsource.com/MRF/ID/drugs.json` |
| 2 | Cambia / Regence BCBS (ID) | 71281 | 6,432 | 🔌 | `https://cms-machine-readable.cambiahealth.com/index.json` |
| 3 | Blue Cross of Idaho (JSON) | 44648 | 5,052 | 🔌 | `https://shoppers.bcidaho.com/resources/static/json/bci-drugs-2026.json` |
| 4 | SelectHealth (ID) | 26002 | 4,122 | 🔌 | `http://ebu.intermountainhealthcare.org/shprovider/ID_exchange_drugs.json` |
| 5 | Blue Cross of Idaho (PDF) | 38128 | 1,986 | ✅ | `https://res.cloudinary.com/bluecrossofidaho/image/upload/web/pdfs/pharmacy/2026/2026-Blue-Cross-of-Idaho-QHP-Formulary.pdf` |
| 6 | St. Luke's Health Plan (ID) | 92170 | 10 | ✅ | `https://www.stlukeshealthplan.org/assets/blt41861338f1f78cbf` |
| 7 | PacificSource Health Plans (ID) - Choice | 61589 | 0 | 🚫 | CVS Caremark online tool only — pacificsource.com/find-a-drug |
| 8 | Moda Health (ID) | 80588 | 0 | 🚫 | Navitus online tool only — modahealth.com/pdl/ |

### IL — Get Covered Illinois — 4,296 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Centene/Ambetter (IL) | 27833 | 4,296 | 🔌 | `https://api.centene.com/ambetter/reference/drugs-AMB-IL.json` |

### KY — kynect — 11,268 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Molina Healthcare of KY (Passport) | 73891 | 4,718 | ✅ | `https://www.molinamarketplace.com/marketplace/ky/en-us/-/media/Molina/PublicWebsite/PDF/members/ky/en-us/Marketplace/2026/KYFormulary2026.pdf` |
| 2 | Centene/Ambetter (KY) - JSON | 72001 | 4,363 | 🔌 | `https://api.centene.com/ambetter/reference/drugs-AMB-KY.json` |
| 3 | Anthem (KY) - Elevance Health | 36239 | 2,301 | ✅ | `https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_KY_IND.pdf` |
| 4 | Ambetter (KY) - PDF | 45636 | 2,187 | ✅ | `https://www.ambetterhealth.com/content/dam/centene/kentucky/ambetter/pdf/2026-ky-formulary.pdf` |

### MA — Massachusetts Health Connector — 14,317 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Harvard Pilgrim Health Care (MA) | 42690 | 7,741 | ✅ | `https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/harvard-pilgrim/hphc-formulary-documents/2026-oe/HPHC-Core-MA-5T-Comprehensive.pdf` |
| 2 | Tufts Health Direct (MA) | 36046 | 5,437 | ✅ | `https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/harvard-pilgrim/p32-formulary-documents/2026/P32H-Value-Direct-3T-Comprehensive-Tufts.pdf` |
| 3 | WellSense Health Plan (MA) | 82569 | 3,319 | ✅ | `https://www.wellsense.org/hubfs/Pharmacy/MA_Clarity_Formulary_Guidebook_2026.pdf?hsLang=en` |
| 4 | Health New England (MA) | 34484 | 3,240 | ✅ | `https://healthnewengland.org/Portals/_default/Shared%20Documents/pharmacy/Find%20a%20Drug/2026/Health_New_England_NEHIM.pdf` |
| 5 | UnitedHealthcare (MA) | 31779 | 1,554 | ✅ | `https://www.uhcprovider.com/content/dam/provider/docs/public/resources/pharmacy/commercial-pdl-jan-2026.pdf` |
| 6 | Fallon Health (MA) | 41304 | 0 | ⚠️ | URL not yet discovered — check carrier website |
| 7 | Health Plans Inc. / Community Care (MA) | 88806 | 0 | ⚠️ | URL not yet discovered — check carrier website |

### MD — Maryland Health Connection — 19,784 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Kaiser Permanente (MD) | 00543 | 8,045 | 🔌 | `https://healthy.kaiserpermanente.org/content/dam/kporg/data/md/cms-data-index.json` |
| 2 | CareFirst BCBS (MD) | 28137 | 3,584 | ✅ | `https://member.carefirst.com/carefirst-resources/pdf/exchange-formulary-sum7277-2026.pdf` |
| 3 | Wellpoint/Anthem (MD) - Elevance | 72545 | 2,320 | ✅ | `https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_MD_IND.pdf` |
| 4 | UnitedHealthcare (MD) | 72375 | 2,018 | ✅ | `https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-MD_UHC_IFP_PY26.pdf` |
| 5 | Kaiser Permanente (MD - MAS PDF) | 90296 | 1,081 | ✅ | `https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/mas/marketplace-formulary-mas-en.pdf` |

### ME — CoverME.gov — 3,905 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Anthem Blue Cross (ME) - Elevance | 48396 | 3,905 | ✅ | `https://fm.formularynavigator.com/jsonFiles/publish/143/35/drugs.json` |
| 2 | Community Health Options (ME) | 33653 | 0 | 🚫 | Express Scripts embedded JS widget only |
| 3 | TARO Health (ME) | 54879 | 0 | 🚫 | No 2026 formulary PDF published |

### MN — MNsure — 12,806 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | HealthPartners (MN) | 79888 | 3,783 | ✅ | (no URL) |
| 2 | Blue Plus / BCBS MN | 57129 | 3,085 | ✅ | `https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_MN_4T_BluePlus_BasicRx.pdf` |
| 3 | UCare (MN) | 85736 | 2,650 | ✅ | (no URL) |
| 4 | Medica (MN) | 31616 | 2,316 | ✅ | `https://www.medica.com/-/media/Documents/Pharmacy/Individual/2026/2026-IFB-Formulary-MN.pdf` |
| 5 | Quartz Health Plan (MN) | 70373 | 1,666 | ✅ | (no URL) |

### NJ — Get Covered New Jersey — 9,282 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Centene/Ambetter (NJ) | 17970 | 4,364 | 🔌 | `https://api.centene.com/ambetter/reference/drugs-AMB-NJ.json` |
| 2 | Horizon BCBS NJ | 91661 | 2,858 | ✅ | `https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_NJ_3T_HealthInsuranceMarketplace.pdf` |
| 3 | UnitedHealthcare (NJ) | 37777 | 2,054 | ✅ | `https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-NJ_UHC_IFP_PY26.pdf` |
| 4 | AmeriHealth NJ | 91762 | 6 | ✅ | `https://www.amerihealth.com/pdfs/providers/pharmacy_information/value/ah-value-formulary-nj.pdf` |
| 5 | Oscar Health (NJ) | 47163 | 0 | ⚠️ | Contentful CDN — asset IDs change annually, must rediscover |

### NM — beWellnm — 3,830 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Molina Healthcare of NM | 19722 | 0 | ✅ | `https://www.molinamarketplace.com/marketplace/nm/en-us/-/media/Molina/PublicWebsite/PDF/members/nm/en-us/Marketplace/2026/NMFormulary2026.pdf` |
| 2 | Ambetter / Western Sky (NM) | 57173 | 0 | ✅ | `https://www.ambetterhealth.com/content/dam/centene/ambetter-from-western-sky-community-care/PDFs/2026-nm-formulary.pdf` |
| 3 | UnitedHealthcare (NM) | 65428 | 0 | ✅ | `https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-NM_UHC_IFP_PY26.pdf` |
| 4 | BCBS New Mexico | 75605 | 0 | ⚠️ | URL not yet discovered — check carrier website |

### NV — Nevada Health Link — 13,092 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Hometown Health (NV) | 41094 | 6,426 | ✅ | `https://www.hometownhealth.com/wp-content/uploads/2025/12/Hometown_Health_IFP_Exchange-Formulary-_Eff-01.01.2026.pdf` |
| 2 | Health Plan of Nevada (UHC) | 45142 | 2,954 | ✅ | `https://www.healthplanofnevada.com/content/dam/hpnv-public-sites/health-plan-of-nevada/documents/pharmacy/2026/UHC8654_25.1_Essential%20Individual%204%20tier%20PDL_JAN26_FINAL.pdf` |
| 3 | Anthem (NV) - Elevance Health | 60156 | 2,312 | ✅ | `https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_NV_IND.pdf` |
| 4 | SilverSummit/Ambetter (NV) - Centene | 95865 | 2,173 | ✅ | `https://www.ambetterhealth.com/content/dam/centene/Nevada/ambetter/pdfs/2026-nv-formulary.pdf` |

### NY — NY State of Health — 31,439 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | CDPHP (NY) | 94788 | 6,554 | ✅ | `https://www.cdphp.com/-/media/files/pharmacy/formulary-1.pdf` |
| 2 | MVP Health Care (NY) | 56184 | 6,163 | ✅ | `https://www.mvphealthcare.com/-/media/project/mvp/healthcare/documents/formularies/2026/marketplace-pharmacy-formulary-2026.pdf` |
| 3 | Healthfirst (NY) | 91237 | 3,631 | ✅ | `https://assets.healthfirst.org/pdf_wKm3xvi0oXWk/2026-leaf-leaf-premier-ep-hmo-nysoh-formulary-english` |
| 4 | Excellus BCBS (NY) | 78124 | 3,530 | 🚫 | No downloadable endpoint discovered |
| 5 | Excellus BCBS (NY) | 40064 | 3,530 | ✅ | `https://fm.formularynavigator.com/FBO/251/Excellus_2026_Metal_Plans_Base___Simply_Blue_Plus___College_Blue_Plans_Formulary_Guide_2981_v26.pdf` |
| 6 | UnitedHealthcare (NY) | 54235 | 3,373 | ✅ | `https://www.uhc.com/content/dam/uhcdotcom/en/Pharmacy/PDFs/IFP_M58643_UHC_NY-PDL-12312025.pdf` |
| 7 | EmblemHealth (NY) | 55768 | 2,684 | 🚫 | No downloadable endpoint discovered |
| 8 | EmblemHealth (NY) | 88582 | 2,684 | ✅ | `https://www.emblemhealth.com/content/dam/emblemhealth/pdfs/resources/formularies/2026/essential-plan-individual-family-plans-small-group-formulary-2026-emblemhealth.pdf` |
| 9 | Ambetter / Fidelis Care (NY) | 25303 | 2,506 | ⚠️ | Centene API, may need VPN |
| 10 | Anthem / Elevance (NY) | 41046 | 2,300 | ✅ | `https://www22.elevancehealth.com/cms-data-index-json/Elevance-Health-Data-Index.json` |
| 11 | MetroPlus Health Plan (NY) | 11177 | 2,066 | ✅ | `https://www.metroplus.org/members/pharmacy/` |
| 12 | Independent Health (NY) | 18029 | 1,715 | ✅ | `https://fm.formularynavigator.com/FBO/43/2026DrugFormulary1.pdf` |
| 13 | Oscar Health (NY) | 48396 | 0 | 🚫 | No downloadable endpoint discovered |

### OR — Oregon Health Insurance Marketplace — 16,869 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Cambia / Regence BCBS (OR) | 63474 | 6,425 | 🔌 | `https://cms-machine-readable.cambiahealth.com/index.json` |
| 2 | Providence Health Plan (OR) | 56707 | 5,522 | 🔌 | `https://www.providencehealthplan.com/cms-data-index.json` |
| 3 | Moda Health (OR) | 39424 | 5,476 | 🔌 | `https://www.modahealth.com/cms-data/drugs-OR.json` |
| 4 | PacificSource (OR) | 10091 | 0 | 🔌 | `https://enroll.pacificsource.com/MRF/OR/cms-data-index.json` |
| 5 | Kaiser Permanente (OR) | 71287 | 0 | 🔌 | `https://healthy.kaiserpermanente.org/content/dam/kporg/data/or/cms-data-index.json` |

### PA — Pennie — 12,142 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Geisinger Health Plan (PA) | 75729 | 6,018 | ✅ | `https://www.geisinger.org/-/media/OneGeisinger/Files/PDFs/Shared-PDFs/Formulary-Updates/Marketplace-Formulary-2026.pdf` |
| 2 | Centene/Ambetter (PA) - JSON | 15983 | 4,291 | 🔌 | `https://api.centene.com/ambetter/reference/drugs-AMB-PA.json` |
| 3 | Ambetter (PA) - PDF | 45127 | 2,198 | ✅ | `https://www.ambetterhealth.com/content/dam/centene/Pennsylvania/ambetter/pdfs/2026-pa-formulary.pdf` |
| 4 | Jefferson Health Plans (PA) | 19702 | 1,912 | ✅ | `https://www.jeffersonhealthplans.com/content/dam/jeffersonhealthplans/documents/formularies/ifp/rxflex-formulary-jhp-ifp-2026-11012025.pdf` |
| 5 | Independence Blue Cross (PA) - Value | 33709 | 8 | ✅ | `https://www.ibx.com/documents/35221/56635/value-formulary-guide.pdf` |
| 6 | AmeriHealth (PA) | 86199 | 8 | ✅ | `https://www.amerihealth.com/pdfs/providers/pharmacy_information/select_drug/ah_select_drug_guide.pdf` |
| 7 | UPMC Health Plan (PA) | 16322 | 0 | ⚠️ | JS auth wall on download URL: `https://upmc.widen.net/view/pdf/02jjoeuifc/25TOTEX6064850---2026-Advantage-Choice-Formulary-Book_WEB.pdf?t.download=true&u=oid6pr` |
| 8 | Highmark (PA) | 22444 | 0 | ⚠️ | FormularyNavigator tool only — no static PDF |
| 9 | Oscar Health (PA) | 98517 | 0 | ⚠️ | Contentful CDN — go to hioscar.com/forms/{YEAR}, select PA |

### RI — HealthSource RI — 0 drugs ❌

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | BlueCross BlueShield of RI | 15287 | 0 | 🔒 | Cloud-IP blocked — needs US residential VPN from Providence RI area |
| 2 | Neighborhood Health Plan of RI | 77514 | 0 | 🚫 | FormularyNavigator searchable only — no static PDF |

### VA — Virginia Insurance Marketplace — 4,371 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | CareFirst BCBS (VA) | 10207 | 4,371 | 🔌 | `https://member.carefirst.com/carefirst-resources/machine-readable/Index.json` |
| 2 | Kaiser Permanente (VA - MAS) | 95185 | 1,081 | ✅ | `https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/mas/marketplace-formulary-mas-en.pdf` |
| 3 | Sentara Health Plans (VA) | 20507 | 0 | ⚠️ | URL not yet discovered — check carrier website |
| 4 | UnitedHealthcare (VA) | 24251 | 0 | ⚠️ | URL not yet discovered — check carrier website |
| 5 | Anthem HealthKeepers (VA) | 88380 | 0 | ⚠️ | URL not yet discovered — check carrier website |
| 6 | Innovation Health / Aetna (VA) | 86443 | 0 | ⚠️ | URL not yet discovered — check carrier website |

### VT — Vermont Health Connect — 8,970 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | MVP Health Plan (VT) | 77566 | 6,163 | ✅ | `https://www.mvphealthcare.com/-/media/project/mvp/healthcare/documents/formularies/2026/marketplace-pharmacy-formulary-2026.pdf` |
| 2 | Blue Cross Blue Shield of VT | 13627 | 2,807 | ✅ | `https://www.bluecrossvt.org/documents/2026-blue-cross-vt-formulary-booklet` |

### WA — Washington Healthplanfinder — 23,659 drugs

| # | Carrier | HIOS | Drugs | Fetch | URL / Notes |
|---|---------|------|-------|-------|-------------|
| 1 | Cambia / Regence BlueShield (WA) | 71281 | 6,421 | 🔌 | `https://cms-machine-readable.cambiahealth.com/index.json` |
| 2 | BridgeSpan Health (WA) | 53732 | 4,598 | ✅ | `https://fm.formularynavigator.com/MemberPages/pdf/StateExchangeFormularyWA_2076_Full_442.pdf` |
| 3 | LifeWise Health Plan (WA) | 38498 | 4,076 | ✅ | `https://www.wahealthplan.org/wp-content/uploads/2024/02/LifeWise-2026-Pharmacy-Formulary.pdf` |
| 4 | Premera Blue Cross (WA) | 49831 | 3,847 | ✅ | `https://www.premera.com/documents/052146_2026.pdf` |
| 5 | Molina Healthcare (WA) | 80473 | 2,470 | ✅ | `https://www.molinamarketplace.com/marketplace/wa/en-us/-/media/Molina/PublicWebsite/PDF/members/wa/en-us/Marketplace/2026/WAFormulary2026.pdf` |
| 6 | Kaiser Permanente (WA - NW) | 23371 | 2,388 | ✅ | `https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/nw/washington-marketplace-formulary-nw-en-2026-commercial.pdf` |
| 7 | Ambetter / Coordinated Care (WA) | 61836 | 2,212 | ✅ | `https://www.ambetterhealth.com/content/dam/centene/Coordinated%20Care/ambetter/PDFs/2026-wa-cascade-formulary.pdf` |
| 8 | UnitedHealthcare (WA) | 62650 | 1,910 | ✅ | `https://www.wahealthplan.org/wp-content/uploads/2024/02/UHC-2026-WA-Formulary.pdf` |
| 9 | Community Health Plan of WA (CHPW) | 18581 | 1,504 | ✅ | `https://individualandfamily.chpw.org/wp-content/uploads/cascade-select/content/member/pharmacy/CS_RX010_Formulary_2026.pdf` |

---

## URL Pattern Cheat Sheet (for finding new carrier URLs)

| Pattern | Carriers | Template |
|---------|----------|----------|
| anthem_formularynavigator | CO, CT, GA, KY, MD, ME, NV | `https://fm.formularynavigator.com/FBO/143/{YEAR}_Select_4_Tier_{ST}_IND.pdf` |
| ambetter_centene_pdf | KY, NV, PA, WA, NM | `https://www.ambetterhealth.com/content/dam/centene/{Subsidiary}/ambetter/pdf/{YEAR}-{st}-formulary.pdf` |
| centene_api_json | GA, IL, KY, NJ, NV, PA, WA | `https://api.centene.com/ambetter/reference/drugs-AMB-{ST}.json` |
| molina_marketplace_pdf | CA, KY, NM, WA | `https://www.molinamarketplace.com/marketplace/{st}/en-us/-/media/Molina/PublicWebsite/PDF/members/{st}/en-us/Marketplace/{YEAR}/{ST}Formulary{YEAR}.pdf` |
| uhc_ifp_pdl | CO, GA, MD, NJ | `https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP{DOC_ID}-{ST}_UHC_IFP_PY{YY}.pdf` |
| kaiser_marketplace_pdf | CA, CO, GA | `https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/{region}/marketplace-formulary-{region}-en-{YEAR}.pdf` |
| caresource_marketplace_pdf | CT, GA, IN | `https://www.caresource.com/documents/marketplace-{YEAR}-{st}-formulary.pdf` |
| myprime_formulary_pdf | GA (Alliant), MN (Blue Plus), NJ (Horizon) | `https://www.myprime.com/content/dam/prime/memberportal/WebDocs/{YEAR}/Formularies/HIM/{FILENAME}.pdf` |
| carefirst_exchange_pdf | DC, MD, VA | `https://member.carefirst.com/carefirst-resources/pdf/exchange-formulary-{DOC_CODE}-{YEAR}.pdf` |
| oscar_contentful_cdn | GA, AZ, TX, TN, FL | `https://assets.ctfassets.net/plyq12u1bv8a/{ASSET_ID}/{HASH}/Oscar_{TIER}T_{ST}_STND_Member_Doc__{MONTH}_{YEAR}__as_of_{DATE}.pdf` |
| optumrx_contenthub_pdf | CA (Western Health Advantage), MA (Harvard Pilgrim, Tufts) | `https://contenthub-aem.optumrx.com/content/dam/contenthub/rx-assets/en/documents/clients/{carrier}/{path}.pdf` |
| cambia_json | ID, OR, WA | `https://cms-machine-readable.cambiahealth.com/index.json` |

---

## Market Intelligence

### Market Exits (PY2026)

- **Aetna/CVS Health** — ALL — Complete ACA individual market withdrawal nationally (but new CA entity discovered via FormularyNavigator)
- **CareSource** — KY
- **Friday Health Plans** — CO — Liquidated
- **Bright Health** — CO
- **Oscar Health** — CO

### New Entrants (PY2026)

- **Aetna (FormularyNavigator)** — CA — New to Covered California — FormularyNavigator FBO/41
- **Illinois transitioned FFE→SBM** — IL — Get Covered Illinois launched PY2026

### Blocked Carriers (no data obtainable)

- **BCBS RI** (RI, HIOS 15287) — Cloud-IP blocked + Prime Therapeutics interactive tool only
- **NHPRI** (RI, HIOS 77514) — FormularyNavigator searchable only, no static PDF
- **PacificSource Choice** (ID, HIOS 61589) — CVS Caremark online tool only
- **Moda Health** (ID, HIOS 80588) — Navitus online tool only
- **Community Health Options** (ME, HIOS 33653) — Express Scripts embedded JS widget only
- **Taro Health/Mending** (ME, HIOS 54879) — No 2026 formulary PDF published

### SBM State Transitions for PY2027

- OR (→ full SBM)
- OK (→ SBM-FP)

---

## Summary Stats

| Metric | Count |
|--------|-------|
| Total states with data | 50 / 51 (RI blocked) |
| Total drugs (FFE + SBM) | 518,614 |
| FFE drugs | 196,303 |
| SBM drugs | 322,311 |
| SBM carriers with ✅ auto-fetch URL | 77 |
| SBM carriers via 🔌 JSON API | 24 |
| SBM carriers needing ⚠️ manual download | 18 |
| SBM carriers needing 🔒 VPN | 1 |
| SBM carriers 🚫 online-only (no PDF) | 8 |
| States fully blocked | 1 (RI) |
