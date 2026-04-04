# 2026 ACA Formulary Intelligence — 50 States + DC

## 100% Carrier Coverage Achieved

**Last Updated:** 2026-04-05
**Carrier Coverage:** 320/320 = 100% (all carriers across 51 jurisdictions)

| Data Source | Records |
|------------|---------|
| FFE plan-level records (formulary_intelligence.json) | **14,854,187** |
| SBM drug-level records (22 state files) | **349,753** |
| Enrichment files (PA/QL/ST detail) | **45 files, 157,885 drugs** |
| **Grand total** | **15,203,940** |

| Restriction Data | Count |
|-----------------|-------|
| Prior Authorization (PA) flags | 25,718 |
| Quantity Limit (QL) flags | 38,770 |
| Step Therapy (ST) flags | 3,132 |

---

## Data Architecture

### Core Formulary Data (drug coverage by plan)
- **FFE (29 states):** `formulary_intelligence.json` — 4.52 GB, 14.85M plan-level records from CMS MR-PUF
- **SBM (22 + DC):** `formulary_sbm_XX.json` per state — carrier formulary JSON APIs + PDF parsing

### Enrichment Data (PA/QL/ST restrictions + drug categories)
- **45 enrichment files** from carrier-published PDFs and web scraping
- Adds Prior Authorization, Quantity Limit, Step Therapy flags
- Therapeutic drug categories (500+ categories across carriers)
- Tier detail (4-tier, 5-tier, 6-tier structures)

---

## Enrichment Files

| File | State | Carrier | Drugs | PA | QL | ST |
|------|-------|---------|-------|-----|-----|-----|
| formulary_enrichment_15287_RI.json | RI | BCBSRI-5T | 1,521 | 0 | 0 | 0 |
| formulary_enrichment_18029_NY.json | NY | Independent Health (NY) Essential Plan | 2,199 | 580 | 110 | 55 |
| formulary_enrichment_25922_VA.json | VA | Oscar-VA-4T | 2,438 | 595 | 1,031 | 19 |
| formulary_enrichment_27603_CA.json | CA | CCHP-CA | 1,716 | 253 | 235 | 0 |
| formulary_enrichment_38345_WI.json | ? | formulary_enrichment_38345_WI.json | 7,425 | 545 | 824 | 46 |
| formulary_enrichment_70285_CA.json | CA | Blue-Shield-CA | 721 | 677 | 0 | 1 |
| formulary_enrichment_77514_RI.json | RI | NHPRI-6T | 4,206 | 870 | 1,199 | 131 |
| formulary_enrichment_84014_CA.json | CA | ValleyHealth-CA | 2,077 | 448 | 544 | 25 |
| formulary_enrichment_92499_CA.json | CA | Anthem-CA-5T | 3,519 | 574 | 2,002 | 309 |
| formulary_enrichment_92815_CA.json | CA | LACare-CA | 2,841 | 566 | 730 | 38 |
| formulary_enrichment_ambetter_FL.json | FL | Ambetter/Centene (FL) | 2,501 | 672 | 1,130 | 35 |
| formulary_enrichment_ambetter_GA.json | GA | Ambetter/Centene (GA) | 2,453 | 627 | 1,084 | 36 |
| formulary_enrichment_ambetter_IN.json | IN | Ambetter/Centene (IN) | 2,411 | 626 | 1,109 | 29 |
| formulary_enrichment_bcbsil_IL.json | IL | BCBS IL (Health Care Service Corp) - HMO POS  | 2,446 | 639 | 1,098 | 0 |
| formulary_enrichment_bcbsma_MA.json | MA | Blue Cross Blue Shield of Massachusetts (ACA  | 6,222 | 1,925 | 281 | 106 |
| formulary_enrichment_caresource_nv_NV.json | NV | CareSource NV | 2,429 | 376 | 1,025 | 111 |
| formulary_enrichment_caresource_wv_WV.json | WV | CareSource (WV) | 2,429 | 376 | 1,025 | 111 |
| formulary_enrichment_cigna_AZ.json | AZ | Cigna Premiere 5-Tier (AZ) | 5,677 | 776 | 1,004 | 43 |
| formulary_enrichment_cigna_CO.json | CO | Cigna Essential CO 5-Tier | 5,487 | 729 | 932 | 15 |
| formulary_enrichment_cigna_FL.json | FL | Cigna Plus FL 5-Tier | 5,666 | 753 | 991 | 38 |
| formulary_enrichment_cigna_GA.json | GA | Cigna Plus GA IFP 5-Tier | 5,644 | 759 | 995 | 37 |
| formulary_enrichment_cigna_IN.json | IN | Cigna Premiere IN 5-Tier | 5,678 | 776 | 1,005 | 43 |
| formulary_enrichment_cigna_MS.json | MS | Cigna Plus MS 4-Tier | 5,636 | 753 | 989 | 37 |
| formulary_enrichment_cigna_NC.json | NC | Cigna Plus NC 5-Tier | 5,643 | 759 | 995 | 37 |
| formulary_enrichment_cigna_TN.json | TN | Cigna Plus TN 4-Tier | 5,642 | 759 | 995 | 37 |
| formulary_enrichment_cigna_VA.json | VA | Cigna Premiere VA 4-Tier | 5,677 | 775 | 1,004 | 43 |
| formulary_enrichment_cigna_multi.json | MULTI | Cigna Healthcare Performance 4-Tier | 1,406 | 729 | 360 | 34 |
| formulary_enrichment_imperial_CA_NV.json | CA | Imperial Health Plan (CA/NV) | 2,970 | 1,343 | 791 | 769 |
| formulary_enrichment_mending_me_ME.json | ME | Mending ME (WellPoint) | 2,359 | 422 | 1,388 | 78 |
| formulary_enrichment_mercycare_il_IL.json | IL | MercyCare HMO (IL) | 2,058 | 516 | 430 | 0 |
| formulary_enrichment_mercycare_wi_WI.json | WI | MercyCare HMO (WI) | 4,151 | 411 | 529 | 0 |
| formulary_enrichment_mgb_MA.json | MA | Mass General Brigham Health Plan (MA) 6-Tier | 2,525 | 664 | 835 | 106 |
| formulary_enrichment_mhcoop_ID.json | ID | Mountain Health CO-OP (ID) - Preventive Drug  | 230 | 0 | 0 | 0 |
| formulary_enrichment_molina_id_ID.json | ID | Molina Healthcare of Idaho (Utah) | 2,409 | 475 | 1,261 | 56 |
| formulary_enrichment_molina_il_IL.json | IL | Molina Healthcare of Illinois | 2,546 | 522 | 1,341 | 0 |
| formulary_enrichment_presbyterian_NM.json | NM | Presbyterian Health Plan (NM) - IFP Metal Pla | 16,561 | 0 | 0 | 0 |
| formulary_enrichment_selecthealth_NV.json | NV | SelectHealth (NV) | 942 | 84 | 421 | 48 |
| formulary_enrichment_sharp_CA.json | CA | Sharp Health Plan (CA) | 1,521 | 332 | 604 | 111 |
| formulary_enrichment_uhc_il_IL.json | IL | UnitedHealthcare Illinois IFP | 4,064 | 839 | 1,858 | 0 |
| formulary_enrichment_unknown_mn_MN.json | MN | IFB-MN | 2,316 | 342 | 621 | 132 |
| formulary_enrichment_unknown_wi_WI.json | WI | IFB-WI | 2,338 | 344 | 647 | 138 |
| formulary_enrichment_wellpoint_FL.json | FL | WellPoint FL Select 4-Tier IND | 2,354 | 391 | 1,384 | 73 |
| formulary_enrichment_wellpoint_MD.json | MD | WellPoint MD Select 4-Tier IND | 2,319 | 381 | 1,349 | 65 |
| formulary_enrichment_wellpoint_TX.json | TX | WellPoint TX Select 4-Tier IND | 2,161 | 351 | 1,261 | 65 |
| formulary_enrichment_wellpoint_WA.json | WA | WellPoint Washington Select 4-Tier IND | 2,351 | 384 | 1,353 | 75 |
| **TOTAL** | | **45 files** | **157,885** | **25,718** | **38,770** | **3,132** |

---

## Market Exits 2026

| Carrier | States | Notes |
|---------|--------|-------|
| Aetna/CVS Health | ALL | Complete ACA individual market withdrawal for 2026 nationally (but CA  |
| CareSource | KY, NC | Exited KY and NC marketplace for 2026 |
| Friday Health Plans | CO | Liquidated 2023 â€” permanently exited |
| Bright Health | CO | Exited 2023 â€” permanently exited |
| Oscar Health | CO, CA | Exited CO 2023, CA after 2023. Not in Covered California 2026. |
| Molina | MI | Exited MI marketplace after 2025 |
| Mountain Health CO-OP | WY | Exited WY marketplace after 2025 |
| Primewell Health Services | MS | Exited MS marketplace for 2026 |
| Chorus Community Health Plan | WI | Exited WI marketplace after 2025 |

---

## Data Sources

| Source | Type | Coverage |
|--------|------|----------|
| CMS MR-PUF (Machine-Readable PUF) | Federal mandate | All FFE carriers |
| Carrier JSON APIs (esbgatewaypub.medica.com, etc.) | MR-PUF endpoints | Per-issuer formulary data |
| Carrier PDF formularies | Published by carriers | PA/QL/ST enrichment |
| FormularyNavigator (Selenium scrape) | Web tool | Presbyterian NM |
| AdaptiveRx (preventive list PDF) | Web tool | Mountain Health CO-OP ID |
| CMS QHP Landscape + Plan Attributes PUF | Federal data | Plan metadata |