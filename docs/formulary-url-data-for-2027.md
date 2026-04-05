# Formulary URL Master Reference — 2027 Refresh Guide

**Generated:** 2026-04-05
**Purpose:** Centralized list of ALL formulary data source URLs for annual refresh.
**2026 Baseline:** 320/320 carriers, 15,245,850+ records, 46 enrichment files

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
| 1 | RI | BCBSRI-5T | 1,521 | 2026_RI_5T_Direct_HIM.pdf | Check carrier website |
| 2 | NY | Independent Health (NY) Essential Plan | 2,199 | https://fm.formularynavigator.com/FBO/43/2026Essential.pdf | Replace `2026` with `2027` |
| 3 | VA | Oscar-VA-4T | 2,438 | Oscar_4T_VA_STND_Member_Doc__April_2026__as_of_03252026.pdf | Check carrier website |
| 4 | CA | CCHP-CA | 1,716 | 2026_CCHP_March_Commercial_Exchange_Formulary_26.03.01.pdf | Check carrier website |
| 5 | ? | ? | 7,425 | LOCAL PDF | Check carrier website for new PDF |
| 6 | CA | Blue-Shield-CA | 721 | RXFLEX-PRINTABLE-FORMULARY-(PDF)-PLUS-GF_CDI-2026-V2.PDF | Check carrier website |
| 7 | RI | NHPRI-6T | 4,206 | NHPRI_6T_Formulary.pdf | Check carrier website |
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
| 30 | ME | Mending ME (WellPoint) | 2,359 | https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_ME_IND_Split.pdf | Replace `2026` with `2027` |
| 31 | IL | MercyCare HMO (IL) | 2,058 | mercycarehealthplans.com il-qhp-formulary-individual-small-group-2026.pdf | Replace `2026` with `2027` |
| 32 | WI | MercyCare HMO (WI) | 4,151 | mercycarehealthplans.com 2026 QHP formulary | Replace `2026` with `2027` |
| 33 | MA | Mass General Brigham Health Plan (MA) 6- | 2,525 | https://fm.formularynavigator.com/FBO/192/2026_6_Tier_Formulary.pdf | Replace `2026` with `2027` |
| 34 | ID | Mountain Health CO-OP (ID) | 33,862 | https://cbg.adaptiverx.com/webSearch/index?key=8F02B26A288102C27BAC82D14C006C6FC | Selenium scrape (key may change) |
| 35 | ID | Molina Healthcare of Idaho (Utah) | 2,409 | molinamarketplace.com IDFormulary2026.pdf | Replace `2026` with `2027` in filename |
| 36 | IL | Molina Healthcare of Illinois | 2,546 | molinamarketplace.com ILFormulary2026.pdf | Replace `2026` with `2027` in filename |
| 37 | NM | Presbyterian Health Plan (NM) - IFP Meta | 16,561 | https://client.formularynavigator.com/Search.aspx?siteCode=0324498195 | Selenium scrape (same URL, new year data) |
| 38 | NV | SelectHealth (NV) | 942 | selecthealth.org nevada-tier6-rxcore.pdf | Check carrier site for new PDF |
| 39 | CA | Sharp Health Plan (CA) | 1,521 | sharphealthplan.com 2026 formulary | Replace `01012026` with `01012027` |
| 40 | IL | UnitedHealthcare Illinois IFP | 4,064 | https://www.uhc.com/content/dam/uhcdotcom/en/ifp/pdls/IFP-M58644-UHC-IFP-PY26-IL | Replace `PY26` with `PY27` |
| 41 | MN | IFB-MN | 2,316 | 2026-IFB-Formulary-MN.pdf | Check carrier website |
| 42 | WI | IFB-WI | 2,338 | 2026-IFB-Formulary-WI.pdf | Check carrier website |
| 43 | FL | WellPoint FL Select 4-Tier IND | 2,354 | https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_FL_IND_.pdf | Replace `2026` with `2027` |
| 44 | MD | WellPoint MD Select 4-Tier IND | 2,319 | https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_MD_IND.pdf | Replace `2026` with `2027` |
| 45 | TX | WellPoint TX Select 4-Tier IND | 2,161 | https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_TX_IND.pdf | Replace `2026` with `2027` |
| 46 | WA | WellPoint Washington Select 4-Tier IND | 2,351 | https://fm.formularynavigator.com/FBO/143/2026_Select_4_Tier_WA_IND.pdf | Replace `2026` with `2027` |

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
| CA | 10 | 0 | Covered California |
| CO | 6 | 18,320 | Connect for Health Colorado |
| CT | 4 | 8,417 | Access Health CT |
| DC | 4 | 15,394 | DC Health Link |
| GA | 10 | 30,248 | Georgia Access |
| ID | 8 | 29,743 | Your Health Idaho |
| IL | 3 | 6,742 | Get Covered Illinois |
| KY | 4 | 11,268 | kynect |
| MA | 9 | 15,831 | Massachusetts Health Connector |
| MD | 5 | 19,784 | Maryland Health Connection |
| ME | 4 | 10,007 | CoverME.gov |
| MN | 6 | 14,594 | MNsure |
| NJ | 5 | 12,741 | Get Covered New Jersey |
| NM | 4 | 8,064 | beWellnm |
| NV | 4 | 13,092 | Nevada Health Link |
| NY | 13 | 31,126 | NY State of Health |
| OR | 6 | 27,379 | Oregon Health Insurance Marketplace |
| PA | 9 | 20,119 | Pennie |
| RI | 2 | 7,283 | HealthSource RI |
| VA | 6 | 14,209 | Virginia Insurance Marketplace |
| VT | 2 | 8,970 | Vermont Health Connect |
| WA | 9 | 26,422 | Washington Healthplanfinder |

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
