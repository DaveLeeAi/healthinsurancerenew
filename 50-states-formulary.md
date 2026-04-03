# 50-State Formulary Data Summary

**Generated:** 2026-04-03
**Project:** HealthInsuranceRenew ACA Intelligence Platform

---

## Overview

| Metric | Value |
|--------|-------|
| **FFE formulary (30 states)** | 196,303 drugs (49 MB) |
| **SBM/supplemental formulary files** | 20 states |
| **Total SBM/supplemental drugs** | 197,124 |
| **SBC (SBM states)** | 18/18 complete |
| **Formulary missing** | RI, VT |

### Coverage Model

- **30 FFE states** covered by formulary_intelligence.json (federal MR-PUF pipeline)
- **18 SBM states + 2 FFE supplements (GA, IL, OR, VA)** covered by per-state formulary_sbm_XX.json files
- **SBC data** for all 18 SBM states from CMS SBE QHP PUF

---

## SBM State SBC Data (18/18 complete)

| State | Marketplace | Plan Variants |
|-------|------------|--------------|
| CA | SBE QHP PUF | 124 |
| CO | SBE QHP PUF | 589 |
| CT | SBE QHP PUF | 71 |
| DC | SBE QHP PUF | 92 |
| ID | SBE QHP PUF | 597 |
| KY | SBE QHP PUF | 386 |
| MA | SBE QHP PUF | 167 |
| MD | SBE QHP PUF | 195 |
| ME | SBE QHP PUF | 317 |
| MN | SBE QHP PUF | 964 |
| NJ | SBE QHP PUF | 192 |
| NM | SBE QHP PUF | 105 |
| NV | SBE QHP PUF | 600 |
| NY | SBE QHP PUF | 1,246 |
| PA | SBE QHP PUF | 1,121 |
| RI | SBE QHP PUF | 81 |
| VT | SBE QHP PUF | 104 |
| WA | SBE QHP PUF | 283 |
| **Total** | | **7,234** |

---

## Formulary Data by State

### Fully Complete States (all carriers parsed)

| State | Drugs | Issuers | Status |
|-------|-------|---------|--------|
| **NY** | **31,439** | **12** | COMPLETE |
| **GA** | **30,248** | **11** | COMPLETE |
| **CO** | **18,320** | **7** | COMPLETE |

#### NY — 31,439 drugs, 12 issuers

| Issuer | HIOS | Drugs | Source |
|--------|------|-------|--------|
| CDPHP (NY) — Commercial Clinical Formula | 92551+94788 | 6,554 | cdphp_formulary-1_2026.pdf |
| MVP Health Care (NY) | 56184 | 6,163 | marketplace-pharmacy-formulary-2026.pdf |
| Healthfirst (NY) — NYSOH Comprehensive D | 91237 | 3,631 | healthfirst_nysoh_formulary_2026.pdf |
| Excellus BCBS (NY) — Individual & Family | 40064+78124 | 3,530 | Excellus_2026_Metal_Plans_Formulary_Guide_2981_v26 |
| UnitedHealthcare of New York | 54235 | 3,373 | IFP_M58643_UHC_NY-PDL-12312025.pdf |
| EmblemHealth (NY) — Individual & Family  | 88582 | 2,684 | emblemhealth_ny_ifp_formulary_2026.pdf |
| Ambetter from Fidelis Care (NY) | 25303 | 2,591 | QHP-2026-formulary-Fidelis-Care.pdf |
| Anthem Health Plans of New York (Elevanc | 41046 | 2,343 | 2026_Select_3_Tier_NY_ABS_IND.pdf |
| MetroPlus Health Plan (NY) — Marketplace | 11177 | 2,066 | Marketplace_EP_Formulary-Document_126_fin.pdf |
| Independent Health (NY) | 18029 | 1,715 | 2026DrugFormulary1.pdf |

**Tiers:** ACA-PREVENTIVE-DRUGS=1,432, GENERIC=12,938, NON-PREFERRED-BRAND=9,472, PREFERRED-BRAND=7,597
**PA:** 6,066 | **ST:** 750 | **QL:** 9,240

#### GA — 30,248 drugs, 11 issuers

| Issuer | HIOS | Drugs | Source |
|--------|------|-------|--------|
| Ambetter from Peach State Health Managem | 45495 | 300,832 | ? |
| Ambetter from Peach State Health Managem | 70893 | 300,832 | ? |
| Cigna Healthcare (GA) | 15105 | 5,642 | csg-26-rx-ga-cigna-5-tier-pdl.pdf |
| Kaiser GA | 89942 | 4,277 | drugs.json |
| Anthem/Elevance Health (GA) | 45334 | 3,731 | drugs.json (FormularyNavigator FID 32) |
| UnitedHealthcare (GA) | 13535 | 3,616 | JSON_Drugs_UHCGAEX_HIX.json |
| Alliant GA | 83761 | 3,373 | Formulary_GA_2026.json |
| Oscar Health (GA) | 58081 | 2,442 | Oscar_6T_GA_STND_Member_Doc_April_2026.pdf |
| Anthem BCBS (GA) — Elevance Health | 54172 | 2,164 | 2026_Select_4_Tier_GA_IND.pdf |
| Alliant Health Plans (GA) | 51163 | 1,941 | alliant_ga_formulary_2026.pdf |
| CareSource (GA) | 72001 | 1,852 | caresource_ga_marketplace_formulary_2026.pdf |

**Tiers:** ACA-PREVENTIVE-DRUGS=894, GENERIC=12,228, NON-PREFERRED-BRAND=6,590, PREFERRED-BRAND=4,923, SPECIALTY=5,067, SPECIALTY-HIGH=546
**PA:** 6,114 | **ST:** 2,863 | **QL:** 11,083

#### CO — 18,320 drugs, 7 issuers

| Issuer | HIOS | Drugs | Source |
|--------|------|-------|--------|
| Cigna (CO) | 86830 | 1,423,046 | ? |
| Cigna Healthcare (CO) | 49375 | 5,487 | cigna_co_rx_essential_5tier_pdl_2026.pdf |
| Anthem (CO) — Elevance Health | 76680 | 1,879 | 2026_Select_4_Tier_CO_IND.pdf |
| Elevate Health Plans / Denver Health Med | 66699 | 1,786 | denverhealth_co_commercial_formulary_2026.pdf |
| Kaiser Permanente (CO) | 21032 | 1,640 | kaiser_co_marketplace_formulary_2026.pdf |
| Rocky Mountain HMO / UnitedHealthcare (C | 97879 | 1,299 | IFP1432766-CO_UHC_IFP_PY26.pdf |
| SelectHealth (CO) | 55584 | 717 | selecthealth_co_tier6_rxcore_2026.pdf |

**Tiers:** ACA-PREVENTIVE-DRUGS=361, GENERIC=5,199, NON-PREFERRED-BRAND=3,511, PREFERRED-BRAND=5,777, PREFERRED-GENERIC=588, PREVENTIVE-CARE=373, SPECIALTY=1,147, SPECIALTY-AND-OTHER-HIGH-COST-DRUGS=521, SPECIALTY-HIGH=843
**PA:** 2,365 | **ST:** 260 | **QL:** 4,491

### Partial Coverage States

| State | Drugs | Issuers | Type |
|-------|-------|---------|------|
| ID | 25,324 | 4 | SBM |
| OR | 16,869 | 4 | FFE supplement |
| MD | 12,417 | 2 | SBM |
| WA | 10,849 | 3 | SBM |
| DC | 4,371 | 1 | SBM |
| VA | 4,371 | 2 | FFE supplement |
| NJ | 4,364 | 1 | SBM |
| KY | 4,363 | 1 | SBM |
| IL | 4,296 | 1 | FFE supplement |
| PA | 4,291 | 1 | SBM |
| MN | 4,273 | ? | SBM |
| NV | 4,253 | 1 | SBM |
| ME | 3,905 | 1 | SBM |
| CT | 3,830 | 1 | SBM |
| NM | 3,830 | 1 | SBM |
| MA | 3,267 | 1 | SBM |
| CA | 2,244 | ? | SBM |

### Missing Formulary

| State | Marketplace | Carriers | Blocker |
|-------|------------|----------|---------|
| **RI** | HealthSource RI | BCBS RI, NHPRI | BCBS RI PDF blocked, NHPRI TiC only |
| **VT** | Vermont Health Connect | BCBS VT, MVP VT | BCBS VT MRF unreliable, MVP PDF needed |

---

## FFE States (30 states)

Covered by formulary_intelligence.json (196,303 drugs, 49 MB)

Source: Federal CMS Machine-Readable PUF → carrier JSON endpoints

States: AL, AK, AZ, AR, DE, FL, GA, HI, IL, IN, IA, KS, LA, MI, MS, MO, MT, NE, NH, NC, ND, OH, OK, OR, SC, SD, TN, TX, UT, VA, WI, WY

---

## Data Files

| File | Size | Records | Description |
|------|------|---------|-------------|
| formulary_intelligence.json | 49 MB | 196,303 | FFE all-state formulary |
| formulary_sbm_CA.json | — | 2,244 | CA formulary |
| formulary_sbm_CO.json | — | 18,320 | CO formulary (COMPLETE) |
| formulary_sbm_CT.json | — | 3,830 | CT formulary |
| formulary_sbm_DC.json | — | 4,371 | DC formulary |
| formulary_sbm_GA.json | — | 30,248 | GA formulary (COMPLETE) |
| formulary_sbm_ID.json | — | 25,324 | ID formulary |
| formulary_sbm_IL.json | — | 4,296 | IL formulary |
| formulary_sbm_KY.json | — | 4,363 | KY formulary |
| formulary_sbm_MA.json | — | 3,267 | MA formulary |
| formulary_sbm_MD.json | — | 12,417 | MD formulary |
| formulary_sbm_ME.json | — | 3,905 | ME formulary |
| formulary_sbm_MN.json | — | 4,273 | MN formulary |
| formulary_sbm_NJ.json | — | 4,364 | NJ formulary |
| formulary_sbm_NM.json | — | 3,830 | NM formulary |
| formulary_sbm_NV.json | — | 4,253 | NV formulary |
| formulary_sbm_NY.json | — | 31,439 | NY formulary (COMPLETE) |
| formulary_sbm_OR.json | — | 16,869 | OR formulary |
| formulary_sbm_PA.json | — | 4,291 | PA formulary |
| formulary_sbm_VA.json | — | 4,371 | VA formulary |
| formulary_sbm_WA.json | — | 10,849 | WA formulary |

### SBC Files

| File | Records | Description |
|------|---------|-------------|
| sbc_decoded.json | 20,354 | FFE 30-state SBC (cost sharing, exclusions) |
| sbc_sbm_CA.json | 124 | CA SBC |
| sbc_sbm_CO.json | 589 | CO SBC |
| sbc_sbm_CT.json | 71 | CT SBC |
| sbc_sbm_DC.json | 92 | DC SBC |
| sbc_sbm_ID.json | 597 | ID SBC |
| sbc_sbm_KY.json | 386 | KY SBC |
| sbc_sbm_MA.json | 167 | MA SBC |
| sbc_sbm_MD.json | 195 | MD SBC |
| sbc_sbm_ME.json | 317 | ME SBC |
| sbc_sbm_MN.json | 964 | MN SBC |
| sbc_sbm_NJ.json | 192 | NJ SBC |
| sbc_sbm_NM.json | 105 | NM SBC |
| sbc_sbm_NV.json | 600 | NV SBC |
| sbc_sbm_NY.json | 1,246 | NY SBC |
| sbc_sbm_PA.json | 1,121 | PA SBC |
| sbc_sbm_RI.json | 81 | RI SBC |
| sbc_sbm_VT.json | 104 | VT SBC |
| sbc_sbm_WA.json | 283 | WA SBC |

---

*Generated 2026-04-03 by Claude Code*