# 50-State Formulary Data Summary

**Generated:** 2026-04-03  
**Project:** HealthInsuranceRenew ACA Intelligence Platform

---

## Overview

| Metric | Value |
|--------|-------|
| **SBC coverage** | **50 states + DC — 27,588 plan variants (100%)** |
| FFE formulary (32 states) | 196,303 drugs (formulary_intelligence.json, 49 MB) |
| SBM + supplemental files | 20 per-state files |
| Total SBM/supplemental drugs | 197,124 |
| Formulary states COMPLETE | NY, CO, GA |
| Formulary states MAJOR PROGRESS | CA (7/12 issuers, 24,910 drugs) |
| Formulary states MISSING | RI, VT |

---

## SBC Data — All 50 States + DC (COMPLETE)

| Source | States | Plan Variants |
|--------|--------|--------------|
| sbc_decoded.json | 32 FFE states (AL, AK, AR, AZ, DE, FL, GA, HI, IA, IL, IN, KS, LA, MI, MO, MS, MT, NC, ND, NE, NH, OH, OK, OR, SC, SD, TN, TX, UT, VA, WI, WY) | 20,354 |
| 18 sbc_sbm_XX.json files | 18 SBM states + DC (CA, CO, CT, DC, ID, KY, MA, MD, ME, MN, NJ, NM, NV, NY, PA, RI, VT, WA) | 7,234 |
| **Total** | **50 states + DC** | **27,588** |

### SBM State SBC Breakdown

| State | Plan Variants |
|-------|--------------|
| CA | 124 |
| CO | 589 |
| CT | 71 |
| DC | 92 |
| ID | 597 |
| KY | 386 |
| MA | 167 |
| MD | 195 |
| ME | 317 |
| MN | 964 |
| NJ | 192 |
| NM | 105 |
| NV | 600 |
| NY | 1,246 |
| PA | 1,121 |
| RI | 81 |
| VT | 104 |
| WA | 283 |

---

## All SBM States + GA — Carrier-Level Formulary Status

### CA — 24,910 drugs | 7 of 12 issuers | MAJOR PROGRESS

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| OK | 70285 | Blue Shield of California | 21 | 6,889 |
| OK | 51396 | IEHP (Inland Empire Health Plan) | — | 5,939 |
| OK | 40513 | Kaiser Permanente (CA) | 14 | 3,175 |
| OK | 92815 | L.A. Care Health Plan | — | 3,128 |
| OK | aetna_ca | Aetna (CA) — new issuer | — | 2,580 |
| OK | 92499 | Anthem Blue Cross (CA) | — | 2,074 |
| OK | 18126 | Molina Healthcare (CA) | — | 1,125 |
| MISSING | 67138 | Ambetter from Health Net (CA) | 1 | — |
| MISSING | 20523 | Oscar Health Plan of California | — | — |
| MISSING | 27603 | Chinese Community Health Plan | — | — |
| MISSING | 84014 | Valley Health Plan (CA) | — | — |
| MISSING | 93689 | Western Health Advantage (CA) | — | — |

---

### CO — 18,320 drugs | 6 of 6 issuers | COMPLETE

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| OK | 76680 | Anthem (Elevance Health) | 41 | 1,879 |
| OK | 97879 | Rocky Mountain HMO / UHC | 35 | 1,299 |
| OK | 21032 | Kaiser Permanente | 27 | 1,640 |
| OK | 55584 | SelectHealth | 20 | 717 |
| OK | 49375 | Cigna Healthcare | 12 | 5,487 |
| OK | 66699 | Elevate Health / Denver Health | 8 | 1,786 |

---

### CT — 3,830 drugs | 0 of 3 issuers matched | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 86545 | ConnectiCare | 11 | — |
| MISSING | 76962 | CareSource | 7 | — |
| MISSING | 94815 | Anthem CT | 4 | — |

*Note: 3,830 drugs from Molina JSON (HIOS 00560) — different issuer ID than SBC PUF*

---

### DC — 4,371 drugs | 0 of 3 issuers matched | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 94506 | Kaiser Permanente | 14 | — |
| MISSING | 86052 | Kaiser Permanente | 7 | — |
| MISSING | 78079 | UPMC Health Plan | 6 | — |

*Note: 4,371 drugs from Molina JSON (HIOS 10207) — different issuer ID than SBC PUF*

---

### GA — 30,248 drugs | 11 issuers | COMPLETE

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| OK | 15105 | Cigna Healthcare | — | 5,642 |
| OK | 89942 | Kaiser Permanente | — | 4,277 |
| OK | 45334 | Anthem / Elevance Health | — | 3,731 |
| OK | 13535 | UnitedHealthcare | — | 3,616 |
| OK | 83761 | Alliant Health Plans (JSON) | — | 3,373 |
| OK | 58081 | Oscar Health | — | 2,442 |
| OK | 54172 | Anthem BCBS (PDF) | — | 2,164 |
| OK | 51163 | Alliant Health Plans (PDF) | — | 1,941 |
| OK | 72001 | CareSource | — | 1,852 |
| OK | 45495 | Ambetter / Centene | — | * |
| OK | 70893 | Ambetter / Centene | — | * |

*GA is FFE state — no SBC PUF plan counts. Centene data from existing JSON pipeline.*

---

### ID — 25,324 drugs | 4 of 8 issuers | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 61589 | PacificSource Health Plans | 62 | — |
| OK | 26002 | SelectHealth | 32 | * |
| MISSING | 38128 | Blue Cross of Idaho | 16 | — |
| OK | 44648 | Cambia / Regence BCBS ID | 12 | * |
| OK | 60597 | Mountain Health CO-OP | 10 | * |
| MISSING | 80588 | Moda Health | 8 | — |
| MISSING | 91278 | Unknown | 5 | — |
| MISSING | 92170 | St. Luke's Health Plan | 4 | — |

---

### KY — 4,363 drugs | 0 of 4 issuers matched | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 36239 | Anthem | 62 | — |
| MISSING | 45636 | Ambetter / Centene | 18 | — |
| MISSING | 72001 | CareSource | 13 | — |
| MISSING | 73891 | Unknown | 5 | — |

*Note: 4,363 drugs from Centene JSON (HIOS 99168) — different issuer ID than SBC PUF*

---

### MA — 3,267 drugs | 0 of 8 issuers matched | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 41304 | AmeriHealth | 9 | — |
| MISSING | 34484 | Health New England | 6 | — |
| MISSING | 36046 | Tufts Health Plan | 6 | — |
| MISSING | 42690 | Harvard Pilgrim | 6 | — |
| MISSING | 59763 | ConnectiCare Insurance | 6 | — |
| MISSING | 31779 | UnitedHealthcare | 5 | — |
| MISSING | 82569 | WellSense Health Plan | 5 | — |
| MISSING | 88806 | Health Plans Inc. | 5 | — |

*Note: 3,267 drugs from BCBS MA JSON (HIOS 36096)*

---

### MD — 12,417 drugs | 0 of 7 issuers matched | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 90296 | Kaiser Permanente | 11 | — |
| MISSING | 72545 | Wellpoint / Anthem | 10 | — |
| MISSING | 66516 | Aetna | 9 | — |
| MISSING | 72375 | UnitedHealthcare | 9 | — |
| MISSING | 28137 | CareFirst BlueChoice | 7 | — |
| MISSING | 45532 | CareFirst BCBS | 3 | — |
| MISSING | 94084 | CareFirst BCBS | 3 | — |

*Note: 12,417 drugs from Molina + Kaiser JSON (HIOS 10207, 00543)*

---

### ME — 3,905 drugs | 1 of 4 issuers | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| OK | 48396 | Anthem | 27 | 3,905 |
| MISSING | 33653 | Community Health Options | 27 | — |
| MISSING | 96667 | Community Health Options | 20 | — |
| MISSING | 54879 | Taro Health | 7 | — |

---

### MN — 4,273 drugs | 0 of 5 issuers matched | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 57129 | Blue Plus (BCBS MN) | 95 | — |
| MISSING | 31616 | Medica | 91 | — |
| MISSING | 79888 | HealthPartners | 27 | — |
| MISSING | 70373 | Quartz Health Plan | 18 | — |
| MISSING | 85736 | UCare | 16 | — |

*Note: 4,273 drugs parsed from Quartz + UCare PDFs but HIOS IDs differ from SBC PUF*

---

### NJ — 4,364 drugs | 0 of 6 issuers matched | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 91762 | AmeriHealth | 12 | — |
| MISSING | 91661 | Horizon BCBS NJ | 8 | — |
| MISSING | 23818 | Oscar Health | 7 | — |
| MISSING | 17970 | Aetna / CVS Health | 6 | — |
| MISSING | 37777 | UnitedHealthcare | 6 | — |
| MISSING | 89217 | Aetna | 5 | — |

*Note: 4,364 drugs from Centene JSON (HIOS 99166)*

---

### NM — 3,830 drugs | 0 of 4 issuers matched | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 57173 | Ambetter from Wellcare | 8 | — |
| MISSING | 65428 | UnitedHealthcare | 6 | — |
| MISSING | 75605 | Blue Cross Blue Shield of NM | 6 | — |
| MISSING | 19722 | Molina Healthcare | 4 | — |

*Note: 3,830 drugs from Molina JSON (HIOS 00560)*

---

### NV — 4,253 drugs | 0 of 8 issuers matched | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 60156 | Anthem | 68 | — |
| MISSING | 95865 | SilverSummit / Centene | 18 | — |
| MISSING | 45142 | Health Plan of Nevada / UHC | 16 | — |
| MISSING | 84445 | Medica | 12 | — |
| MISSING | 41094 | Hometown Health (Renown) | 10 | — |
| MISSING | 65779 | Aetna | 7 | — |
| MISSING | 43314 | Hometown Health | 5 | — |
| MISSING | 79363 | Unknown | 5 | — |

*Note: 4,253 drugs from Centene JSON (HIOS 99169)*

---

### NY — 31,439 drugs | 11 of 12 issuers | NEAR-COMPLETE (95%)

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| OK | 78124 | BCBS / HealthNow WNY | 60 | 3,530 |
| OK | 40064 | Excellus BCBS | 56 | 3,530 |
| OK | 94788 | CDPHP | 30 | 6,554 |
| OK | 56184 | MVP Health Care | 28 | 6,163 |
| OK | 41046 | Anthem (Elevance) | 26 | 2,343 |
| OK | 88582 | EmblemHealth | 26 | 2,684 |
| OK | 91237 | Healthfirst | 25 | 3,631 |
| OK | 25303 | Ambetter / Fidelis Care | 23 | 2,591 |
| OK | 54235 | UnitedHealthcare | 19 | 3,373 |
| MISSING | 74289 | Unknown (Circle network) | 17 | — |
| OK | 11177 | MetroPlus | 16 | 2,066 |
| OK | 18029 | Independent Health | 13 | 1,715 |

---

### PA — 4,291 drugs | 0 of 14 issuers matched | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 33709 | Independence Blue Cross | 84 | — |
| MISSING | 22444 | Highmark / ConnectiCare | 42 | — |
| MISSING | 16322 | UPMC Health Plan | 28 | — |
| MISSING | 79962 | Independence Blue Cross | 28 | — |
| MISSING | 45127 | Ambetter / Centene | 20 | — |
| MISSING | 86199 | AmeriHealth | 19 | — |
| MISSING | 75729 | Geisinger Health Plan | 16 | — |
| MISSING | 79279 | Independence Blue Cross | 16 | — |
| MISSING | 98517 | Oscar Health | 14 | — |
| MISSING | 33871 | Independence Blue Cross | 10 | — |
| MISSING | 19702 | Jefferson Health Plans | 9 | — |
| MISSING | 31609 | Independence Blue Cross | 9 | — |
| MISSING | 93909 | Jefferson Health Plans | 9 | — |
| MISSING | 62560 | UPMC Health Plan | 6 | — |

*Note: 4,291 drugs from Centene JSON (HIOS 99165)*

---

### RI — NO FORMULARY | 0 of 2 issuers | MISSING

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 15287 | Blue Cross Blue Shield of RI | 13 | — |
| MISSING | 77514 | Neighborhood Health Plan of RI | 7 | — |

**Blocker:** BCBS RI PDF blocked from cloud. NHPRI publishes TiC rates only.

---

### VT — NO FORMULARY | 0 of 2 issuers | MISSING

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 13627 | Blue Cross Blue Shield of VT | 14 | — |
| MISSING | 77566 | MVP Health Plan | 14 | — |

**Blocker:** BCBS VT MRF hosting unreliable (Change Healthcare). MVP PDF needed.

---

### WA — 10,849 drugs | 2 of 11 issuers | PARTIAL

| Status | HIOS | Carrier | Plans | Drugs |
|--------|------|---------|-------|-------|
| MISSING | 61836 | Ambetter / Centene | 11 | — |
| MISSING | 38498 | LifeWise Health Plan | 9 | — |
| MISSING | 23371 | Kaiser Permanente | 8 | — |
| OK | 71281 | Cambia / Regence BCBS | 8 | * |
| MISSING | 80473 | Molina Healthcare | 8 | — |
| MISSING | 49831 | Premera Blue Cross | 7 | — |
| MISSING | 62650 | UnitedHealthcare | 6 | — |
| OK | 87718 | Community Health Plan | 6 | * |
| MISSING | 53732 | Coordinated Care | 4 | — |
| MISSING | 84481 | Unknown | 4 | — |
| MISSING | 18581 | Community Health Plan of WA | 3 | — |

---

## FFE States (30 states)

Covered by formulary_intelligence.json (196,303 drugs, 133 issuers, 49 MB)

Source: Federal CMS Machine-Readable PUF via carrier JSON endpoints

States: AL, AK, AZ, AR, DE, FL, GA, HI, IL, IN, IA, KS, LA, MI, MS, MO, MT, NE, NH, NC, ND, OH, OK, OR, SC, SD, TN, TX, UT, VA, WI, WY

---

*Generated 2026-04-03 by Claude Code*
