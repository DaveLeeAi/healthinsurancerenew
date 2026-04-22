# Formulary URL Master Reference — 2027 Refresh Guide

**Generated:** 2026-04-05 | **Last updated:** 2026-04-22 (final audit)
**Purpose:** Centralized list of ALL formulary data source URLs for annual refresh.
**2026 Baseline:** 320/320 carriers, 15,260,139 records (FFE 14,854,187 + SBM 405,952), 51 enrichment files

## How to Use for 2027 Refresh
1. For URLs with year in path: replace `2026` with `2027`
2. HEAD-check each URL — if 404, carrier may have changed URL structure
3. Selenium-scraped sources: same script, same URL (key may change)
4. Local PDFs: check carrier websites for updated versions
5. CMS MR-PUF: download new PUF from cms.gov (published Oct each year)

---

## 1. CMS Federal Data Sources (FFE)

| Source | URL | Notes |
|--------|-----|-------|
| MR-PUF (formulary carrier URLs) | https://www.cms.gov/marketplace/resources/data/public-use-files | Download Machine_Readable_PUF.xlsx |
| QHP Landscape PUF | https://data.cms.gov/marketplace/qualified-health-plan-landscape-puf | Plan comparison data |
| Plan Attributes PUF | https://data.cms.gov/marketplace/qualified-health-plan-plan-attributes-puf | Benefits/network detail |
| Rate PUF | https://data.cms.gov/marketplace/qualified-health-plan-rate-puf | Premium rates by age/area |
| BenCS PUF | https://data.cms.gov/marketplace/qualified-health-plan-benefits-and-cost-sharing-puf | Cost-sharing detail |
| SADP PUF | https://data.cms.gov/marketplace/qualified-health-plan-sadp-puf | Dental plan data |
| Service Area PUF | https://data.cms.gov/marketplace/qualified-health-plan-service-area-puf | County-level availability |
| OEP Enrollment Data | https://www.cms.gov/data-research/statistics-trends-reports/marketplace-products/2026-marketplace-open-enrollment-period-public-use-files | Enrollment stats |

## 2. Medica MR-PUF API Endpoints (FFE)

Base: `https://esbgatewaypub.medica.com/rest/QHP/{STATE}/{HIOS}/cms-data-index.json`

| State | HIOS | Carrier | Drugs URL |
|-------|------|---------|-----------|
| IA | 93078 | Elevate by Medica | `.../rest/QHP/IA/93078/Drugs/drugs1.json` |
| KS | 39520 | Select by Medica | `.../rest/QHP/KS/39520/Drugs/drugs1.json` |
| MO | 53461 | Select by Medica (also covers 47840) | `.../rest/QHP/MO/53461/Drugs/drugs1.json` |
| ND | 73751 | Altru by Medica | `.../rest/QHP/ND/73751/Drugs/drugs1.json` |
| NE | 20305 | Elevate by Medica | `.../rest/QHP/NE/20305/Drugs/drugs1.json` |
| OK | 21333 | Harmony by Medica | `.../rest/QHP/OK/21333/Drugs/drugs1.json` |
| WI | 57845 | Medica Individual Choice | `.../rest/QHP/WI/57845/Drugs/drugs1.json` |
| WI | 38345 | Dean Health Plan (uses WI2 path) | `.../rest/QHP/WI2/38345/Drugs/drugs1.json` |

## 3. Carrier PDF Formularies (Enrichment)

| # | ST | Carrier | Drugs | URL | Refresh Pattern |
|---|-----|---------|-------|-----|-----------------|
| 1 | RI | BCBS Rhode Island (15287) — 5-Tier | 2,950 | https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2025/Formularies/HIM/2025_RI_5T_Direct_HIM.pdf | Replace `2025` with `2026` (then `2027`) |
| 2 | NY | Independent Health (NY) Essential Plan | 2,199 | https://fm.formularynavigator.com/FBO/43/2026Essential.pdf | Replace `2026` with `2027` |
| 3 | VA | Oscar-VA-4T | 2,438 | Oscar_4T_VA_STND_Member_Doc__April_2026__as_of_03252026.pdf | Check carrier website |
| 4 | CA | CCHP-CA | 1,716 | 2026_CCHP_March_Commercial_Exchange_Formulary_26.03.01.pdf | Check carrier website |
| 5 | ? | ? | 7,425 | LOCAL PDF | Check carrier website for new PDF |
| 6 | CA | Blue-Shield-CA | 721 | RXFLEX-PRINTABLE-FORMULARY-(PDF)-PLUS-GF_CDI-2026-V2.PDF | Check carrier website |
| 7 | RI | Neighborhood Health Plan of RI (77514) — 6-Tier | 4,092 | https://www.caremark.com/content/dam/enterprise/headless/caremark/cmk/en/assets/clinical/drug-lists-client/ltr-n/NHPRI_6T_Formulary.pdf | Caremark CDN — filename may be stable; HEAD-check annually |
| 8 | CA | ValleyHealth-CA | 2,077 | covered-california-and-individual-and-family-plan-formulary-2026-110525.pdf | Check carrier website |
| 9 | CA | Anthem-CA-5T | 3,519 | Essential_5_Tier_ABC.pdf | Check carrier website |
| 10 | CA | LACare-CA | 2,841 | la2133_lacc_formulary_202603rev.pdf | Check carrier website |
| 11 | FL | Ambetter/Centene (FL) | 2,501 | https://www.ambetterhealth.com/content/dam/centene/solutions/fl/2026-Solutions-f | Replace `2026` with `2027` |
| 12 | GA | Ambetter/Centene (GA) | 2,453 | https://www.ambetterhealth.com/content/dam/centene/peachstate/ambetter/PDFs/2026 | Replace `2026` with `2027` |
| 13 | IN | Ambetter/Centene (IN) | 2,411 | https://www.ambetterhealth.com/content/dam/centene/mhsindiana/Ambetter/PDFs/2026 | Replace `2026` with `2027` |
| 14 | IL | BCBS IL (Health Care Service Corp) - HMO | 2,446 | https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/ | Replace `2026` with `2027` |
| 15 | MA | Blue Cross Blue Shield of Massachusetts  | 6,222 | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam | Same URLs (updated in-place by carrier) |
| 16 | NV | CareSource NV | 2,429 | https://www.caresource.com/documents/Marketplace-2026-NV-formulary.pdf | Replace `2026` with `2027` |
| 17 | WV | CareSource (WV) | 2,429 | https://www.caresource.com/documents/Marketplace-2026-NV-formulary.pdf | Replace `2026` with `2027` |
| 18 | AZ | Cigna Premiere 5-Tier (AZ) | 5,677 | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-az-989888-cigna-rx-p | Replace `26` with `27` in URL path |
| 19 | CO | Cigna Essential CO 5-Tier | 5,487 | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-co-989873-cigna-rx-e | Replace `26` with `27` in URL path |
| 20 | FL | Cigna Plus FL 5-Tier | 5,666 | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-fl-989875-cigna-rx-p | Replace `26` with `27` in URL path |
| 21 | GA | Cigna Plus GA IFP 5-Tier | 5,644 | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-ga-989876-cigna-rx-p | Replace `26` with `27` in URL path |
| 22 | IN | Cigna Premiere IN 5-Tier | 5,678 | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-in-989890-cigna-rx-p | Replace `26` with `27` in URL path |
| 23 | MS | Cigna Plus MS 4-Tier | 5,636 | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-ms-989879-cigna-rx-p | Replace `26` with `27` in URL path |
| 24 | NC | Cigna Plus NC 5-Tier | 5,643 | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-tn-989884-cigna-rx-p | Replace `26` with `27` in URL path |
| 25 | TN | Cigna Plus TN 4-Tier | 5,642 | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-tn-989883-cigna-rx-p | Replace `26` with `27` in URL path |
| 26 | VA | Cigna Premiere VA 4-Tier | 5,677 | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-va-989891-cigna-rx-p | Replace `26` with `27` in URL path |
| 27 | MULTI | Cigna Healthcare Performance 4-Tier | 1,406 | https://www.cigna.com/static/www-cigna-com/docs/ifp/performance-4tier-spec.pdf | Replace `26` with `27` in URL path |
| 28 | PA | Highmark (PA) Commercial Formulary | 7,921 | https://client.formularynavigator.com/Search.aspx?siteCode=8103967260 | Selenium scrape (same URL, new year data) |
| 29 | CA | Imperial Health Plan (CA/NV) | 2,970 | https://imperialhealthplan.com/wp-content/uploads/2025/09/2026_September_Formula | Replace `2026` with `2027` |
| 30 | ME | Anthem Blue Cross / WellPoint (ME) (HIOS 48396) — 4-Tier | 3,905 | https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_ME_IND_Split.pdf | Replace `2026` with `2027` |
| 49 | ME+OK | **Mending (formerly TARO Health) — SmithRx 3-Tier (ME HIOS 54879 / OK HIOS TBD)** | 6,698 | https://smithrx.adaptiverx.com/web/pdf?key=8F02B26A288102C27BAC82D14C006C6FC54D480F80409B68152E2998CC6B2D92 | Key changes annually — rediscover via carrier pharmacy page |
| 31 | IL | MercyCare HMO (IL) | 2,058 | mercycarehealthplans.com il-qhp-formulary-individual-small-group-2026.pdf | Replace `2026` with `2027` |
| 32 | WI | MercyCare HMO (WI) | 4,151 | mercycarehealthplans.com 2026 QHP formulary | Replace `2026` with `2027` |
| 33 | MA | **Mass General Brigham Health Plan (MA) (HIOS 36096) — 6-Tier** | 3,052 | https://fm.formularynavigator.com/FBO/192/2026_6_Tier_Formulary.pdf | Replace `2026` with `2027` |
| 34 | ID | Mountain Health CO-OP (ID) | 33,862 | https://cbg.adaptiverx.com/webSearch/index?key=8F02B26A288102C27BAC82D14C006C6FC | Selenium scrape (key may change) |
| 35 | ID | Molina Healthcare of Idaho (Utah) | 2,409 | molinamarketplace.com IDFormulary2026.pdf | Replace `2026` with `2027` in filename |
| 36 | IL | Molina Healthcare of Illinois | 2,546 | molinamarketplace.com ILFormulary2026.pdf | Replace `2026` with `2027` in filename |
| 37 | NM | Presbyterian Health Plan (NM) - IFP Meta | 16,561 | https://client.formularynavigator.com/Search.aspx?siteCode=0324498195 | Selenium scrape (same URL, new year data) |
| 38 | NV | SelectHealth (NV) | 942 | selecthealth.org nevada-tier6-rxcore.pdf | Check carrier site for new PDF |
| 39 | CA | Sharp Health Plan (CA) | 1,521 | sharphealthplan.com 2026 formulary | Replace `01012026` with `01012027` |
| 40 | IL | **UnitedHealthcare IL (HIOS 42529) — 4-Tier** | 3,357 | https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP-M58644-UHC-IFP-PY26-IL-PDL-2026.pdf | Replace `PY26` with `PY27` |
| 56 | CO | **UnitedHealthcare CO (HIOS 97879) — 5-Tier** | 1,477 | https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP1432766-CO_UHC_IFP_PY26.pdf | Replace `PY26` with `PY27` |
| 57 | NY | **UnitedHealthcare NY (HIOS 54235) — 3-Tier** | 3,349 | https://www.uhc.com/content/dam/uhcdotcom/en/Pharmacy/PDFs/IFP_M58643_UHC_NY-PDL-12312025.pdf | Replace year in filename (`12312025` → `12312026`) |
| 41 | MN | IFB-MN | 2,316 | 2026-IFB-Formulary-MN.pdf | Check carrier website |
| 42 | WI | IFB-WI | 2,338 | 2026-IFB-Formulary-WI.pdf | Check carrier website |
| 43 | FL | WellPoint FL Select 4-Tier IND | 2,354 | https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_FL_IND_.pdf | Replace `2026` with `2027` |
| 44 | MD | WellPoint MD Select 4-Tier IND | 2,319 | https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_MD_IND.pdf | Replace `2026` with `2027` |
| 45 | TX | WellPoint TX Select 4-Tier IND | 2,161 | https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_TX_IND.pdf | Replace `2026` with `2027` |
| 46 | WA | WellPoint Washington Select 4-Tier IND | 2,351 | https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_WA_IND.pdf | Replace `2026` with `2027` |
| 47 | NC | **Blue Cross Blue Shield of NC (11512) — 4-Tier** | 1,378 | https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_NC_4T_HealthInsuranceMarketplace.pdf | Replace `2026` with `2027` |
| 48 | NC | **Blue Cross Blue Shield of NC (11512) — 5-Tier** | 1,392 | https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_NC_5T_HealthInsuranceMarketplace.pdf | Replace `2026` with `2027` |
| 50 | MN | **HealthPartners (MN) (HIOS 79888) — 3-Tier** | 2,244 | https://www.healthpartners.com/content/dam/plan/b2c/pharmacy/comm-2026-formulary-shelf.pdf | Replace `2026` with `2027` |
| 51 | OR | **Regence BCBS OR (HIOS 77969 + 63474) — 4-Tier** | 2,215 | https://regence.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_RBO_Four_Tier_Drug_List_Metallic.pdf | Replace `2026` with `2027` in both path and filename |
| 52 | MA | **WellSense Health Plan MA (HIOS 82569) — 4-Tier** | 2,414 | https://www.wellsense.org/hubfs/Pharmacy/MA_Clarity_Formulary_Guidebook_2026.pdf | Replace `2026` with `2027` in filename |
| 53 | MA | **UnitedHealthcare MA (HIOS 31779) — 3-Tier** | 2,590 | https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-MA_UHC_IFP_PY26.pdf | Replace `PY26` with `PY27` |
| 54 | CO | **Kaiser Permanente CO (HIOS 00543) — 7-Tier** | 1,598 | https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/co/marketplace-formulary-co-en-2026.pdf | Replace `2026` with `2027` |
| 55 | GA | **Cigna Healthcare Value 4-Tier GA (HIOS 15105)** | 1,284 | https://www.cigna.com/static/www-cigna-com/docs/ifp/value-4-tier-spec.pdf | Check carrier site — filename may change (no year in URL) |
| 58 | WA | **Premera Blue Cross WA (HIOS 47570) — M4/B4/E4** | 7,112 | M4: premera.com/documents/052166_2026.pdf · B4: 052147_2026.pdf · E4: 052149_2025.pdf | Replace `2026` with `2027`; E4 lagged one year — verify. Requires `Referer: https://www.premera.com` header. |
| 59 | WA | **Molina Healthcare of Washington (HIOS 00560)** | 2,183 | molinamarketplace.com/marketplace/wa/.../WAFormulary2026.pdf — VPN required; local copy: docs/WAFormulary2026.pdf | Replace `2026` with `2027` in filename. CVS Caremark PBM. 163pp bilingual EN/ES. |
| 60 | PA | **UPMC Health Plan PA (HIOS 16322 / also covers 93688, 62560)** | 1,954 | https://upmc.widen.net/view/pdf/02jjoeuifc/25TOTEX6064850---2026-Advantage-Choice-Formulary-Book_WEB.pdf | Widen CDN — asset ID changes per year. FHIR API also available (public): apis.upmchp.com/fhir/R4/Group/RxFormulary/$exportStatus (Azure DNS blocks locally). EasyOCR extracted 2026 data. |

### BCBS NC Notes (added 2026-04-19)
- **PBM:** Prime Therapeutics (myprime.com) — same PBM as BCBS IL (row 14 above)
- **Not in CMS MR-PUF electronic feed** — PDF download + pdfplumber parse required
- **Parse script:** `c:/tmp/bcbs_nc_pdf_extract.py`
- **Output:** `data/processed/formulary_enrichment_bcbs_nc.json` (2,770 records)
- **Market share:** 117/206 NC health plans (57%) — largest NC issuer
- **2026 Ozempic:** 4T=Tier 2, 5T=Tier 3; PA+QL required on both; Wegovy NOT listed
- **2026 myprime.com 2025-year URL (for regression check):** https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2025/Formularies/HIM/2025_NC_5T_HealthInsuranceMarketplace.pdf
- **SBC URL pattern (CAPTCHA-protected, manual only):** https://buyonline.bcbsnc.com/assets/bol/public/pdf/sbc/Blue_Value_Silver_Preferred_350_CSR87_2026.pdf
- **ACA preventive list (separate from formulary):** https://www.bluecrossnc.com/content/dam/bcbsnc/pdf/members/preventive-care/aca-preventive-list-26.pdf — change `26` to `27`
- **Machine-readable files page:** https://www.bluecrossnc.com/policies-best-practices/machine-readable-files (provider rates only, not formulary)

### NY Notes (added 2026-04-22)

**Fidelis Care / Ambetter NY (HIOS 25303)**
- **Direct URL confirmed:** https://www.fideliscare.org/Portals/0/Formularies/QHP-2026-formulary-Fidelis-Care.pdf
- **2027 pattern:** replace `2026` with `2027` in filename
- **Format:** two-column table layout; use `pdfplumber` `page.extract_tables()` (NOT text-line parser)
- **3-tier:** Generic / Preferred-Brand / Non-Preferred-Brand
- **Drugs parsed:** 2,343 (PA=647, QL=1,135, ST=123)
- **Previously:** marked `blocked` — data obtained via proxy. Now fully direct.

**Excellus BCBS NY — Essential Plan (HIOS 78124)**
- **Direct URL confirmed:** https://fm.formularynavigator.com/FBO/251/Excellus_Essential_Plan_Formulary_5930_v26.pdf
- **2027 pattern:** `fm.formularynavigator.com/FBO/251/Excellus_Essential_Plan_Formulary_{NUM}_v27.pdf` — the `{NUM}` (5930) may change; check FormularyNavigator FBO/251 listing
- **3-tier (Express Scripts PBM):** Generic / Preferred-Brand / Non-Preferred-Brand
- **Drugs parsed:** 1,747 — separate product from Metal Plans (2981); add as distinct issuer entry
- **Tier-changes companion doc:** https://www.excellusbcbs.com/documents/d/global/tier-changes_hix_2026_updated — this is actually a PDF; check same path for 2027

**Excellus BCBS NY — Metal Plans (HIOS 40064 + 78124)**
- **Direct URL confirmed:** https://fm.formularynavigator.com/FBO/251/Excellus_2026_Metal_Plans_Base___Simply_Blue_Plus___College_Blue_Plans_Formulary_Guide_2981_v26.pdf
- **2027 pattern:** replace `2026` with `2027`; `2981` and `v26` suffix may also change — check FBO/251

**EmblemHealth NY (HIOS 88582)**
- **Primary URL:** https://www.emblemhealth.com/content/dam/emblemhealth/pdfs/resources/formularies/2026/essential-plan-individual-family-plans-small-group-formulary-2026-emblemhealth.pdf
- **Alternate CDN (identical file):** `zt.emblemhealth.com` subdomain — same path, same MD5; either URL works
- **2027 pattern:** replace `2026` with `2027` in both path segments

---

### RI Notes (added 2026-04-22)

**BCBS Rhode Island (HIOS 15287) — 5-Tier**
- **PBM:** Prime Therapeutics (myprime.com) — same CDN as BCBS IL and BCBS NC
- **Confirmed URL (2025 year):** https://www.myprime.com/content/dam/prime/memberportal/WebDocs/2025/Formularies/HIM/2025_RI_5T_Direct_HIM.pdf
- **2026 URL (for current baseline):** replace `2025` with `2026` — verify it exists before refresh
- **2027 pattern:** replace year in both path segment and filename
- **Parsed file:** `data/processed/formulary_sbm_ri_bcbsri.json` (2,950 records, parsed 2026-04-22)
- **Note:** currently in SBM as a separate carrier file, not merged into a combined RI SBM file

**Neighborhood Health Plan of RI (HIOS 77514) — 6-Tier**
- **PBM:** CVS Caremark (caremark.com CDN)
- **Confirmed URL:** https://www.caremark.com/content/dam/enterprise/headless/caremark/cmk/en/assets/clinical/drug-lists-client/ltr-n/NHPRI_6T_Formulary.pdf
- **2027 pattern:** filename (`NHPRI_6T_Formulary.pdf`) appears stable — Caremark updates in-place; HEAD-check for Last-Modified header to detect refresh
- **Tiers:** 0=Preventive/Generic ($0), 1=Preferred Generic, 2=Non-Preferred Generic, 3=Preferred Brand, 4=Non-Preferred Brand, 5=Specialty, 6=Non-Preferred Specialty
- **Parsed file:** `data/processed/formulary_sbm_ri_nhpri.json` (4,092 records, parsed 2026-04-22)

---

### ME Notes (added 2026-04-22)

**Mending (formerly TARO Health) (HIOS 54879) — SmithRx / AdaptiveRx**
- **PBM:** SmithRx (adaptiverx.com delivery platform)
- **3-tier:** Generic / Preferred-Brand / Non-Preferred-Brand
- **Drugs parsed:** 6,698 (PA=209, QL=1,119, ST=86)
- **Parsed file:** `data/processed/formulary_sbm_me_mending.json`
- **Four PDFs — all confirmed 2026-04-22 (direct GET, no auth):**

| Document | URL |
|----------|-----|
| Formulary | `https://smithrx.adaptiverx.com/web/pdf?key=...152E2998CC6B2D92` |
| Prior Auth list | `https://smithrx.adaptiverx.com/web/pdf?key=...4A92B9441814F0D7` |
| Step Therapy criteria | `https://smithrx.adaptiverx.com/web/pdf?key=...772B497B2D96BB32` |
| Step Therapy drug list | `https://smithrx.adaptiverx.com/web/pdf?key=...2F7BA2F1A45C4F2D` |

- **Key prefix:** all four share `8F02B26A288102C27BAC82D14C006C6FC54D480F80409B68` — suffix differs per document
- **Multi-state:** Mending operates in both **ME and OK (FFE)**. All four PDF keys are byte-for-byte identical across both states — single national SmithRx formulary.
- **OK web search interface** (different key suffix, same plan data): `smithrx.adaptiverx.com/webSearch/index?key=...80F20571612BC46E`
- **OK HIOS prefix:** pending MR-PUF lookup. Drug data already captured via ME parse — no separate OK parse needed.
- **2027 refresh:** keys will change; rediscover by searching AdaptiveRx portal for "Mending" or via carrier pharmacy page. The shared 48-char prefix (`8F02B26A...09B68`) may be stable; only the trailing 16 hex chars differ per document type.
- **Parse method:** pdfplumber word-level positional extraction (3-column: name x0<305, tier x0 305–345, UM x0>355). Multi-line drug names handled via row continuation logic. Supplement PDFs cross-referenced for PA and ST flags.

---

### MN Notes (added 2026-04-22)

**HealthPartners (MN) (HIOS 79888) — 3-Tier**
- **Direct URL confirmed:** https://www.healthpartners.com/content/dam/plan/b2c/pharmacy/comm-2026-formulary-shelf.pdf
- **UM edits PDF:** https://www.healthpartners.com/content/dam/plan/b2c/pharmacy/comm-2026-formulary-shelf-um-edits.pdf (91 pages — PA criteria + ST criteria by drug name)
- **2027 pattern:** replace `2026` with `2027` in both URLs
- **3-tier:** 1=Low Cost Generic (GENERIC), 2=High Cost Generic (PREFERRED-BRAND), 3=Formulary Brand (NON-PREFERRED-BRAND)
- **Non-Formulary (NF) tier:** listed in PDF but excluded from parsed output — use for coverage-gap identification only
- **Drugs parsed:** 2,244 (PA=638, QL=557, ST=12) — replaced 3,763 proxy records
- **PA/QL flags:** captured directly from Requirements/Limits column in main formulary PDF
- **Parse method:** pdfplumber word-level positional extraction (3-column: name x0<308, tier x0 308–375, UM x0>388)
- **Anthem ME fix (row 30):** row 30 in this table was previously mislabelled "Mending ME (WellPoint)" — corrected to "Anthem Blue Cross / WellPoint (ME) (HIOS 48396)" on 2026-04-22. Drug count updated from 2,359 (stale) to 3,905 (from registry JSON API).

---

### UHC CO / NY / IL Notes (added 2026-04-22)

**UnitedHealthcare CO (HIOS 97879) — 5-Tier**
- **Direct URL confirmed:** https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP1432766-CO_UHC_IFP_PY26.pdf
- **2027 pattern:** replace `PY26` with `PY27`; DOC_ID 1432766 is CO-specific (differs from MA/NJ/MD DOC_ID 2895550)
- **PBM:** OptumRx
- **5-tier:** 1=GENERIC, 2=PREFERRED-BRAND, 3=NON-PREFERRED-BRAND, 4+5=NON-PREFERRED-BRAND (specialty); $0=GENERIC (ACA preventive)
- **Drugs parsed:** 1,477 (QL=159, SP=107); replaced 1,299 proxy/pattern records
- **Parse method:** word-level two-column positional extraction (L: name<207, tier 207–235, notes>235; R: name 322–484, tier 484–512, notes>512)
- **Parse script:** `c:/tmp/parse_uhc_co.py`
- **Registry:** 97879 updated from `pattern` → `verified`, tiers updated 4→5

**UnitedHealthcare NY (HIOS 54235) — 3-Tier**
- **Direct URL confirmed:** https://www.uhc.com/content/dam/uhcdotcom/en/Pharmacy/PDFs/IFP_M58643_UHC_NY-PDL-12312025.pdf
- **2027 pattern:** replace `12312025` with `12312026` in filename (date-stamped, not year-keyed)
- **PBM:** OptumRx; UHC Compass network
- **3-tier + $0:** $0=GENERIC (preventive), 1=GENERIC, 2=PREFERRED-BRAND, 3=NON-PREFERRED-BRAND
- **Drugs parsed:** 3,349 (PA=637, QL=1,627, ST=52, SP=427); replaced 3,373 proxy records
- **Format:** 174-page single-column table per page — Brand name | Generic name | Tier | Notes; generic name used as drug_name
- **Parse method:** `pdfplumber` `page.extract_tables()` (single-column, generic name = row[1])
- **Parse script:** `c:/tmp/parse_uhc_ny.py`
- **Registry:** 54235 updated source_type `blocked` → `direct_download`, status confirmed `verified`

**UnitedHealthcare IL (HIOS 42529) — 4-Tier**
- **Direct URL confirmed:** https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP-M58644-UHC-IFP-PY26-IL-PDL-2026.pdf
- **2027 pattern:** replace `PY26` with `PY27`; DOC_ID M58644 is IL-specific
- **HIOS confirmed:** 42529 — extracted from plan IDs embedded in PDF (pages 2–3 list `42529IL0070xxx` / `42529IL0080xxx`)
- **Exchange:** GetCoveredIllinois (SBM) — not an FFE state
- **PBM:** OptumRx
- **4-tier:** 1=GENERIC, 2=PREFERRED-BRAND, 3=NON-PREFERRED-BRAND, 4=NON-PREFERRED-BRAND (specialty); $0=GENERIC
- **Drugs parsed:** 3,357 (PA=334, QL=1,161); previous enrichment file had 4,064 (TIER-1/2/3 format, no HIOS)
- **Format:** 164-page single-column layout; name x0<372, tier x0=372–400, notes x0>396
- **Parse method:** word-level single-column positional extraction (not table extraction — two-col table fragmentation)
- **Parse script:** `c:/tmp/parse_uhc_il.py`
- **Registry:** 42529 added as new IL carrier entry (was missing entirely)

---

### CO Notes (added 2026-04-22)

**Kaiser Permanente CO (HIOS 00543) — 7-Tier**
- **Direct URL confirmed:** https://healthy.kaiserpermanente.org/content/dam/kporg/final/documents/formularies/co/marketplace-formulary-co-en-2026.pdf
- **2027 pattern:** replace `2026` with `2027`
- **PBM:** Kaiser Permanente (self-managed)
- **7-tier system:** Tiers 1+2=GENERIC, 3=PREFERRED-BRAND, 4=NON-PREFERRED-BRAND, 5=NON-PREFERRED-BRAND (specialty), 6=Medical Service (excluded), 7=Diabetic Supplies (excluded)
- **Tiers 6+7 excluded** from parsed output — not pharmacy benefit
- **Drugs parsed:** 1,598 (PA=68, QL=49, ST=9); resolved from `blocked` (0 drugs) to `verified`
- **Parse method:** `pdfplumber` `page.extract_tables()` (3-column table); section headers have empty/None tier cell; drug data starts page 8
- **EPO variant:** `exclusive-provider-organization-formulary-co-en-2026-drug-formulary.pdf` is self-funded, not ACA — excluded

### OR Notes (added 2026-04-22)

**Regence BlueCross BlueShield OR / Cambia (HIOS 77969 + 63474) — 4-Tier**
- **Direct URL confirmed:** https://regence.myprime.com/content/dam/prime/memberportal/WebDocs/2026/Formularies/HIM/2026_RBO_Four_Tier_Drug_List_Metallic.pdf
- **2027 pattern:** replace `2026` with `2027` in both path segments and filename
- **PBM:** Prime Therapeutics (myprime.com CDN)
- **Shared formulary:** HIOS 77969 (Regence BCBS OR #2) and 63474 (Cambia/Regence BCBS OR) share this PDF; records tagged with both issuer IDs
- **4-tier:** 1=GENERIC, 2=PREFERRED-BRAND, 3=NON-PREFERRED-BRAND, 4=NON-PREFERRED-BRAND (specialty)
- **ACA:** "ACA" restriction code = ACA preventive drug (zero cost share)
- **Drugs parsed:** 2,215 (PA=247, QL=703, SP=346, ST=0)
- **Parse method:** `pdfplumber` `page.extract_tables()` (3-column table: drug name | tier digit | notes); drug data starts page 5
- **Registry note:** replaced 6,421 proxy records shared between 77969 and 63474

### MA Notes — WellSense + UHC + MGB (added 2026-04-22)

**WellSense Health Plan MA (HIOS 82569) — 4-Tier**
- **Direct URL confirmed:** https://www.wellsense.org/hubfs/Pharmacy/MA_Clarity_Formulary_Guidebook_2026.pdf
- **2027 pattern:** replace `2026` with `2027` in filename (`?hsLang=en` query param optional)
- **4-tier:** 1=GENERIC, 2=PREFERRED-BRAND, 3=NON-PREFERRED-BRAND, 4=GENERIC (Zero Cost Share Preventative)
- **Restriction codes:** PA, ST, QL, SP, DS (diabetic supply), SRX
- **Drugs parsed:** 2,414 (PA=649, QL=844, ST=82, SP=486); replaced 3,319 proxy records
- **Parse method:** `pdfplumber` `page.extract_tables()` (3-column table); drug data starts around page 12

**UnitedHealthcare MA (HIOS 31779) — 3-Tier**
- **Direct URL confirmed:** https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP2895550-MA_UHC_IFP_PY26.pdf
- **2027 pattern:** replace `PY26` with `PY27`
- **PBM:** OptumRx
- **3-tier + $0:** $0=GENERIC (zero-cost preventive), 1=GENERIC, 2=PREFERRED-BRAND, 3=NON-PREFERRED-BRAND
- **Two-column page layout:** each page has two side-by-side drug listing columns; requires word-level positional extraction (not table extraction)
- **Left column:** name x0<205, tier x0 205–228, notes x0>228; **Right column:** name x0 322–480, tier x0 480–503, notes x0>503
- **Drugs parsed:** 2,590 (PA=630, QL=1,191, ST=131, SP=437); drug data starts page 8
- **Parse method:** `parse_uhc_ma.py` — `pdfplumber` word-level two-column extraction

**Mass General Brigham Health Plan MA (HIOS 36096) — 6-Tier**
- **Direct URL confirmed:** https://fm.formularynavigator.com/FBO/192/2026_6_Tier_Formulary.pdf
- **2027 pattern:** replace `2026` with `2027`
- **FormularyNavigator:** FBO code 192 (MGB Health Plan)
- **6-tier:** 1+2=GENERIC, 3=PREFERRED-BRAND, 4+5+6=NON-PREFERRED-BRAND (specialty in tiers 5–6)
- **$0 status:** zero-cost preventive drugs (mapped to GENERIC tier)
- **Notes column format:** "PA; SP; QL" semicolon-separated
- **HIOS confirmed:** 36096 (present in formulary_sbm_MA.json; previously listed as `unknown_mgb_ma`)
- **Drugs parsed:** 3,052 (PA=708, QL=982, ST=109, SP=505); replaced 3,267 prior records
- **Parse method:** `pdfplumber` `page.extract_tables()` (4-column: Drug | Reference | Status | Notes); Status = "Tier N" or "$0"

**Cigna Healthcare Value 4-Tier GA (HIOS 15105)**
- **Direct URL confirmed:** https://www.cigna.com/static/www-cigna-com/docs/ifp/value-4-tier-spec.pdf
- **2027 pattern:** no year in URL — check cigna.com/ifp/pharmacy for updated link annually
- **Effective:** July 1, 2026 (mid-year formulary)
- **Distinct from 5-tier Plus plan:** same HIOS 15105 but different plan design; 29 drugs overlap, 1,255 unique to Value
- **4-tier:** 1=GENERIC, 2=PREFERRED-BRAND, 3=NON-PREFERRED-BRAND, 4=NON-PREFERRED-BRAND (specialty)
- **Restriction codes:** PA, SP, QL, ST, PPACA (ACA preventive)
- **Drugs parsed:** 1,284 (PA=387, QL=331, ST=30, SP=350)
- **Parse method:** `pdfplumber` `page.extract_tables()` (3-column: Medication | Tier | Notes); drug data starts page 6
- **Enrichment file:** `data/processed/formulary_enrichment_cigna_ga_value_GA.json`
- **GA SBM:** 1,255 net-new drugs added to GA SBM (additive merge under HIOS 15105)

**Highmark ACA Preventive Drug List (SUPPLEMENT ONLY — NOT full formulary)**
- **Preventive PDF URL:** https://www.highmark.com/content/dam/digital-marketing/en/highmark/highmarkdotcom/aon/documents/aca-preventive-drug-list-bcbs.pdf
- **Format:** 5-page, 4-column layout (drug names only — no tier column); all drugs are $0 ACA preventive
- **Full formulary:** requires Selenium from FormularyNavigator siteCode=8103967260 (see section 4)
- **HIOS:** 22444 (Highmark PA) — currently absent from formulary_sbm_PA.json; Selenium scrape needed
- **Health Plans Inc. / Community Care (88806 MA):** NOT an ACA marketplace carrier — TPA for self-funded employer groups only. Status set to `not_applicable` in registry. No ACA formulary exists.

---

## 4. Selenium-Scraped Sources (Headless Chrome Required)

These carriers have no downloadable PDF — data must be scraped via Selenium.

| Carrier | State | URL | Drugs | Script Pattern |
|---------|-------|-----|-------|----------------|
| Presbyterian NM | NM | https://client.formularynavigator.com/Search.aspx?siteCode=0324498195 | 16,561 | Click A-Z letters, extract brandName/genericName |
| Mountain Health CO-OP | ID | https://cbg.adaptiverx.com/webSearch/index?key=8F02B26A288102C27BAC82D14C006C6FC54D480F80409B68F5408441E329A787 | 33,862 | Load page, JS extract div.drug-item textContent |
| Highmark PA | PA | https://client.formularynavigator.com/Search.aspx?siteCode=8103967260 | 7,921 | Click A-Z letters, extract brandName/genericName |

**Selenium setup:** `pip install selenium` + system Chrome. Playwright fails on this Windows system.

## 5. SBM Core Data Sources (JSON APIs)

These are in `data/config/formulary-url-registry-2026.json` — the primary registry.
Run `scripts/refresh/annual-formulary-refresh.py --from-year 2026 --to-year 2027` to auto-check.

| State | Carriers | Drugs | Exchange |
|-------|----------|-------|----------|
| CA | 10 | 41,910 | Covered California |
| CO | 7 | 20,096 | Connect for Health Colorado |
| CT | 4 | 8,417 | Access Health CT |
| DC | 4 | 15,394 | DC Health Link |
| GA | 10 | 31,503 | Georgia Access |
| ID | 8 | 29,743 | Your Health Idaho |
| IL | 4 | 10,099 | Get Covered Illinois |
| KY | 4 | 11,268 | kynect |
| MA | 9 | 17,301 | Massachusetts Health Connector |
| MD | 5 | 19,784 | Maryland Health Connection |
| ME | 4 | 16,692 | CoverME.gov |
| MN | 6 | 13,075 | MNsure |
| NJ | 5 | 12,741 | Get Covered New Jersey |
| NM | 4 | 8,064 | beWellnm |
| NV | 4 | 13,092 | Nevada Health Link |
| NY | 13 | 30,978 | NY State of Health |
| OR | 6 | 23,173 | Oregon Health Insurance Marketplace |
| PA | 9 | 28,725 | Pennie |
| RI | 2 | 7,283 | HealthSource RI |
| VA | 6 | 14,209 | Virginia Insurance Marketplace |
| VT | 2 | 8,970 | Vermont Health Connect |
| WA | 9 | 34,444 | Washington Healthplanfinder |

## 6. BCBS MA — Multi-PDF Compilation (13 Sources)

BCBS MA has no single formulary PDF. Data compiled from:

| PDF | URL | Drugs |
|-----|-----|-------|
| ACA Preventive List | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 427 |
| Specialty Pharmacy | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 822 |
| Specialty 6-Tier | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 803 |
| HSA Preventive | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 590 |
| Maintenance | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 742 |
| Zero Copay | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 159 |
| Formulary Guide | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 2,474 |
| No-Cost Generics | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 42 |
| Step Therapy | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 14 |
| Pain Management | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 1 |
| Opioid Alternatives | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 16 |
| Medical Benefit PA | https://www.bluecrossma.org/medical-policies/sites/g/files/csphws2091/files/acqu... | 111 |
| Chronic Condition | https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam... | 21 |
| **TOTAL** | | **6,222** |

## 7. Cigna IFP URL Pattern (11 States)

Base pattern: `https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-{state}-{code}-cigna-rx-{tier}-pdl.pdf`

| State | Code | Tier | URL |
|-------|------|------|-----|
| AZ | 989888 | premiere-5-tier | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-az-989888-cigna-rx-p |
| CO | 989873 | essential-5-tier | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-co-989873-cigna-rx-e |
| FL | 989875 | plus-5-tier | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-fl-989875-cigna-rx-p |
| GA | 989876 | plus-5-tier | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-ga-989876-cigna-rx-p |
| IN | 989890 | premiere-5-tier | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-in-989890-cigna-rx-p |
| MS | 989879 | plus-4-tier | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-ms-989879-cigna-rx-p |
| NC | 989884 | plus-5-tier | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-nc-989884-cigna-rx-p |
| TN | 989883 | plus-4-tier | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-tn-989883-cigna-rx-p |
| VA | 989891 | premiere-4-tier | https://www.cigna.com/static/www-cigna-com/docs/ifp/m-26-rx-va-989891-cigna-rx-p |
| IL | TBD | TBD (placeholder for 2026) | Performance 4-Tier national spec used (state PDF pending) |
| TX | TBD | TBD (placeholder for 2026) | Performance 4-Tier national spec used (state PDF pending) |

**National fallback:** `https://www.cigna.com/static/www-cigna-com/docs/ifp/performance-4tier-spec.pdf`

---

### WA Notes (added 2026-04-22)

**Premera Blue Cross WA (HIOS 47570) — 3-Tier Metal Plans**
- **PBM:** Premera (self-managed)
- **Three PDFs** (M4=Metallic, B4=Bronze-Specific, E4=EPO): download with `Referer: https://www.premera.com` header; direct GET without Referer → 403
- **M4 URL:** https://www.premera.com/documents/052166_2026.pdf
- **B4 URL:** https://www.premera.com/documents/052147_2026.pdf
- **E4 URL:** https://www.premera.com/documents/052149_2025.pdf (NOTE: E4 lagged one year in 2026 — verify for 2027)
- **2027 pattern:** replace `2026` with `2027` in filename; DOC IDs (052166, 052147, 052149) appear stable
- **Drugs parsed:** 7,112 total (M4+B4+E4 deduped); 6,033 net-new to WA SBM
- **Enrichment file:** `data/processed/formulary_enrichment_premera_wa_WA.json`

**Molina Healthcare of Washington (HIOS 00560)**
- **PBM:** CVS Caremark
- **URL:** VPN required — molinamarketplace.com/marketplace/wa/.../WAFormulary2026.pdf
- **Local copy:** `docs/WAFormulary2026.pdf` (163pp bilingual EN/ES; deleted after parse)
- **2027 pattern:** replace `2026` with `2027` in filename
- **Drugs parsed:** 2,183 (PA/QL/ST flags captured); 1,989 net-new to WA SBM
- **Enrichment file:** `data/processed/formulary_enrichment_molina_wa_WA.json`
- **Kaiser WA (HIOS 15690):** covered via KP NW (HIOS 23371) — same formulary, no separate parse needed

---

### PA Notes — UPMC (added 2026-04-22)

**UPMC Health Plan PA (HIOS 16322 — also covers 93688, 62560)**
- **PDF:** Advantage Choice 2026 Formulary Book (Widen CDN)
- **Widen URL:** https://upmc.widen.net/view/pdf/02jjoeuifc/25TOTEX6064850---2026-Advantage-Choice-Formulary-Book_WEB.pdf
- **2027 pattern:** Widen CDN asset ID (`02jjoeuifc`) changes per year — find new URL from upmchealthplan.com/formulary
- **Parse method:** EasyOCR via PyMuPDF (fitz) pixel render at 1.5× scale; Value Choice PDF (29pp) OCR yield 0 — scanned quality insufficient
- **7-tier:** SG/PG → PREFERRED-GENERIC, PBG → PREFERRED-BRAND, NP → NON-PREFERRED-BRAND, SP → SPECIALTY, ACA → ACA-PREVENTIVE
- **Drugs parsed:** 1,954 (PA=712, QL=876, ST=36); 685 net-new to PA SBM
- **Enrichment file:** `data/processed/formulary_enrichment_upmc_pa_PA.json`
- **FHIR Bulk Data API (alternative for 2027):** `apis.upmchp.com/fhir/R4/Group/RxFormulary/$exportStatus` → Azure blob NDJSON; public, no auth; DNS blocked locally but may work from server/cloud environment
- **IBC (HIOS 00116):** covered via IBC 33709 Value PDF (same formulary)

---

## 8. UHC FFE States — National OptumRx PDL (added 2026-04-22)

All 19 UHC FFE states share a **single national OptumRx PDL** via the CMS MR-PUF bundle. No per-state PDF download required — data is in `formulary_intelligence.json` (14,854,187 plan-level records).

**CMS MR-PUF index URL:** `https://www.uhc.com/content/dam/uhcdotcom/en/general/cms-data-index.json`
- Year-agnostic URL — same endpoint for 2026 and 2027
- Each UHC FFE issuer has exactly **4,347 records** (national PDL fingerprint)
- PBM: OptumRx

| State | HIOS | Carrier Name in Registry |
|-------|------|--------------------------|
| AL | 69461 | UnitedHealthcare (AL) |
| AZ | 40702 | UnitedHealthcare (AZ) |
| FL | 68398 | UnitedHealthcare (FL) |
| IA | 56610 | UnitedHealthcare (IA) |
| IN | 72850 | UnitedHealthcare (IN) |
| KS | 94968 | UnitedHealthcare (KS) |
| LA | 69842 | UnitedHealthcare (LA) |
| MI | 71667 | UnitedHealthcare (MI) |
| MO | 95426 | UnitedHealthcare (MO) |
| MS | 97560 | UnitedHealthcare (MS) |
| NC | 54332 | UnitedHealthcare (NC) |
| NE | 73102 | UnitedHealthcare (NE) |
| OH | 33931 | UnitedHealthcare (OH) |
| OK | 45480 | UnitedHealthcare (OK) |
| SC | 33764 | UnitedHealthcare (SC) |
| TN | 69443 | UnitedHealthcare (TN) |
| TX | 40220 | UnitedHealthcare (TX) — issuer 1 of 2 |
| TX | 70754 | UnitedHealthcare (TX) — issuer 2 of 2 |
| WI | 80180 | UnitedHealthcare (WI) |
| WY | 49714 | UnitedHealthcare (WY) |

**UHC SBM states (11)** — individual SBM formulary entries in registry (not CMS PUF):
CO(97879) GA(13535) IL(42529) MA(31779) MD(72375) NJ(37777) NM(65428) NV(45142) NY(54235) VA(24251) WA(62650)

**UHC non-participant states (confirmed):** CA CT DC ID KY ME MN OR PA RI VT
