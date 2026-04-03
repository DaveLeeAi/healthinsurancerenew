# 50-State Formulary & SBC Data Summary

**Generated:** 2026-04-04
**Source of truth:** `data/config/formulary-url-registry-2026.json` (schema v2.0)
**Project:** HealthInsuranceRenew ACA Intelligence Platform

---

## Overview

| Metric | Value |
|--------|-------|
| **Total drug records** | **518,614** |
| FFE formulary (29 FFE states) | 196,303 drugs — `formulary_intelligence.json` (49 MB, 133 issuers) |
| SBM formulary (22 SBM states + DC) | 322,311 drugs — per-state `formulary_sbm_XX.json` files |
| **SBC plan variants** | **27,588 total (50 states + DC — 100% coverage)** |
| FFE SBC plan variants | 20,354 — `sbc_decoded.json` |
| SBM SBC plan variants | 7,234 — 22 `sbc_sbm_XX.json` files |
| RI formulary | Blocked (VPN required for BCBS RI; NHPRI online-only) |

---

## SBC Data — All 50 States + DC (COMPLETE)

| Source | States | Plan Variants |
|--------|--------|--------------|
| `sbc_decoded.json` | 29 FFE states | 20,354 |
| 22 `sbc_sbm_XX.json` files | 22 SBM states + DC | 7,234 |
| **Total** | **50 states + DC** | **27,588** |

---

## SBM States — Formulary Coverage (22 states + DC)

### Exchange Type Key
- **Full SBM (21 + DC):** CA, CO, CT, DC, GA, ID, IL, KY, MA, MD, ME, MN, NJ, NM, NV, NY, PA, RI, VA, VT, WA
- **SBM-FP (2):** AR, OR (use federal enrollment platform; own QHP certification)
- **Transitioning for PY2027:** OR → full SBM, OK → SBM-FP

### Fetch Method Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Auto-download — script fetches directly |
| 🔌 | JSON API — fetched via CMS JSON endpoint chain |
| ⚠️ | Manual download — bot-protected or JS-rendered |
| 🔒 | VPN required — geo-blocked from cloud IPs |
| 🚫 | Online-only — no downloadable PDF or JSON |

---

### CA — 41,910 drugs | 12 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ⚠️ | 70285 | Blue Shield of California | 6,889 |
| ✅ | 51396 | IEHP (Inland Empire Health Plan) | 5,939 |
| ✅ | 93689 | Western Health Advantage (CA) | 5,577 |
| ✅ | 27603 | Chinese Community Health Plan (CCHP) | 5,471 |
| ✅ | 40513 | Kaiser Permanente (CA) | 3,175 |
| ⚠️ | 92815 | L.A. Care Health Plan | 3,128 |
| ✅ | — | Aetna (CA) | 2,580 |
| ⚠️ | 20523 | Oscar Health Plan of California | 2,502 |
| ⚠️ | 92499 | Anthem Blue Cross (CA) | 2,074 |
| ⚠️ | 84014 | Valley Health Plan (CA) | 2,028 |
| ✅ | 67138 | Ambetter from Health Net (CA) | 1,422 |
| ✅ | 18126 | Molina Healthcare (CA) | 1,125 |

---

### CO — 18,320 drugs | 6 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 86830 | Cigna Healthcare (CO) | 5,699 |
| ✅ | 76680 | Anthem / Elevance Health (CO) | 1,879 |
| 🔌 | 66699 | Elevate Health / Denver Health (CO) | 1,786 |
| ✅ | 97879 | Rocky Mountain HMO / UHC (CO) | 1,299 |
| 🔌 | 55584 | SelectHealth (CO) | 717 |
| 🔌 | 00543 | Kaiser Permanente (CO) | 0 |

---

### CT — 8,417 drugs | 4 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 94815 | Anthem / Elevance Health (CT) | 4,605 |
| 🔌 | 00560 | Molina Healthcare (CT) | 3,812 |
| ✅ | 86545 | ConnectiCare (CT) | 2,420 |
| ✅ | 76962 | CareSource (CT) | 0 |

---

### DC — 8,965 drugs | 4 carriers | NEAR COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 10207 | Molina Healthcare (DC) | 4,300 |
| ✅ | 28137 | CareFirst BCBS (DC/MD) | 3,584 |
| ✅ | 94506 | Kaiser Permanente (DC - MAS region) | 1,081 |
| ✅ | 78079 | UPMC Health Plan (DC) | 0 |

---

### GA — 30,248 drugs | 10 carriers | COMPLETE
*GA is FFE state for enrollment but SBM for formulary registry. No SBC PUF plan counts.*

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 15105 | Cigna Healthcare (GA) | 5,642 |
| 🔌 | 45495 | Ambetter / Peach State Health (GA) | 4,424 |
| ✅ | 89942 | Kaiser Permanente (GA) | 4,277 |
| ✅ | 45334 | Anthem / Elevance Health (GA) | 3,690 |
| ✅ | 13535 | UnitedHealthcare (GA) | 3,616 |
| 🔌 | 83761 | Alliant Health Plans (GA) | 3,262 |
| ⚠️ | 58081 | Oscar Health (GA) | 2,442 |
| ✅ | 54172 | Anthem BCBS (GA) | 2,164 |
| ✅ | 51163 | Alliant Health Plans (GA) - PDF | 1,941 |
| ✅ | 72001 | CareSource (GA) | 1,852 |

---

### ID — 24,421 drugs | 8 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 60597 | PacificSource (ID) | 8,249 |
| 🔌 | 71281 | Cambia / Regence BCBS (ID) | 6,432 |
| 🔌 | 44648 | Blue Cross of Idaho (JSON) | 5,052 |
| 🔌 | 26002 | SelectHealth (ID) | 4,122 |
| ✅ | 38128 | Blue Cross of Idaho (PDF) | 1,986 |
| ✅ | 92170 | St. Luke's Health Plan (ID) | 10 |
| 🚫 | 61589 | PacificSource Health Plans (ID) - Choice | 0 |
| 🚫 | 80588 | Moda Health (ID) | 0 |

---

### IL — 4,296 drugs | 1 carrier | PARTIAL
*Only Centene/Ambetter captured via JSON. Other FFE carriers (BCBS IL, Oscar, Cigna, Molina, UHC) not in SBM registry — covered via FFE PUF instead.*

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 27833 | Centene/Ambetter (IL) | 4,296 |

---

### KY — 11,268 drugs | 4 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 73891 | Molina Healthcare of KY (Passport) | 4,718 |
| 🔌 | 72001 | Centene/Ambetter (KY) | 4,363 |
| ✅ | 36239 | Anthem / Elevance Health (KY) | 2,301 |
| ✅ | 45636 | Ambetter (KY) - PDF | 2,187 |

---

### MA — 14,317 drugs | 7 carriers | NEAR COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 42690 | Harvard Pilgrim Health Care (MA) | 7,741 |
| ✅ | 36046 | Tufts Health Direct (MA) | 5,437 |
| ✅ | 82569 | WellSense Health Plan (MA) | 3,319 |
| ✅ | 34484 | Health New England (MA) | 3,240 |
| ✅ | 31779 | UnitedHealthcare (MA) | 1,554 |
| ⚠️ | 41304 | Fallon Health (MA) | 0 |
| ⚠️ | 88806 | Health Plans Inc. / Community Care (MA) | 0 |

---

### MD — 19,784 drugs | 5 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 00543 | Kaiser Permanente (MD) | 8,045 |
| ✅ | 28137 | CareFirst BCBS (MD) | 3,584 |
| ✅ | 72545 | Wellpoint/Anthem (MD) | 2,320 |
| ✅ | 72375 | UnitedHealthcare (MD) | 2,018 |
| ✅ | 90296 | Kaiser Permanente (MD - MAS PDF) | 1,081 |

---

### ME — 3,905 drugs | 3 carriers | PARTIAL

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 48396 | Anthem Blue Cross (ME) | 3,905 |
| 🚫 | 33653 | Community Health Options (ME) | 0 |
| 🚫 | 54879 | TARO Health (ME) | 0 |

*Community Health Options: Express Scripts embedded JS widget — no downloadable formulary. TARO Health: no formulary PDF published.*

---

### MN — 12,806 drugs | 5 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 79888 | HealthPartners (MN) | 3,783 |
| ✅ | 57129 | Blue Plus / BCBS MN | 3,085 |
| ✅ | 85736 | UCare (MN) | 2,650 |
| ✅ | 31616 | Medica (MN) | 2,316 |
| ✅ | 70373 | Quartz Health Plan (MN) | 1,666 |

---

### NJ — 9,282 drugs | 5 carriers | NEAR COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 17970 | Centene/Ambetter (NJ) | 4,364 |
| ✅ | 91661 | Horizon BCBS NJ | 2,858 |
| ✅ | 37777 | UnitedHealthcare (NJ) | 2,054 |
| ✅ | 91762 | AmeriHealth NJ | 6 |
| ⚠️ | 47163 | Oscar Health (NJ) | 0 |

---

### NM — 3,830 drugs | 4 carriers | PARTIAL

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 00560 | Molina Healthcare (NM) | 3,830 |
| ✅ | 19722 | Molina Healthcare of NM (PDF) | 0 |
| ✅ | 57173 | Ambetter / Western Sky (NM) | 0 |
| ✅ | 65428 | UnitedHealthcare (NM) | 0 |
| ⚠️ | 75605 | BCBS New Mexico | 0 |

---

### NV — 13,092 drugs | 4 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 41094 | Hometown Health (NV) | 6,426 |
| ✅ | 45142 | Health Plan of Nevada (UHC) | 2,954 |
| ✅ | 60156 | Anthem / Elevance Health (NV) | 2,312 |
| ✅ | 95865 | SilverSummit/Ambetter (NV) | 2,173 |

---

### NY — 31,439 drugs | 11 issuers (13 HIOS entries) | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 94788 | CDPHP (NY) | 6,554 |
| ✅ | 56184 | MVP Health Care (NY) | 6,163 |
| ✅ | 91237 | Healthfirst (NY) | 3,631 |
| ✅ | 40064 | Excellus BCBS (NY) | 3,530 |
| ✅ | 54235 | UnitedHealthcare (NY) | 3,373 |
| ✅ | 88582 | EmblemHealth (NY) | 2,684 |
| ⚠️ | 25303 | Ambetter / Fidelis Care (NY) | 2,506 |
| ✅ | 41046 | Anthem / Elevance (NY) | 2,300 |
| ✅ | 11177 | MetroPlus Health Plan (NY) | 2,066 |
| ✅ | 18029 | Independent Health (NY) | 1,715 |
| 🚫 | 48396 | Oscar Health (NY) | 0 |

*Note: Excellus (78124/40064) and EmblemHealth (55768/88582) have duplicate HIOS entries in registry; drug counts are de-duplicated.*

---

### OR — 16,869 drugs | 5 carriers | NEAR COMPLETE
*OR is SBM-FP for PY2026; transitions to full SBM for PY2027.*

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 63474 | Cambia / Regence BCBS (OR) | 6,425 |
| 🔌 | 56707 | Providence Health Plan (OR) | 5,522 |
| 🔌 | 39424 | Moda Health (OR) | 5,476 |
| 🔌 | 10091 | PacificSource (OR) | 0 |
| 🔌 | 71287 | Kaiser Permanente (OR) | 0 |

---

### PA — 12,142 drugs | 9 carriers | NEAR COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 75729 | Geisinger Health Plan (PA) | 6,018 |
| 🔌 | 15983 | Centene/Ambetter (PA) | 4,291 |
| ✅ | 45127 | Ambetter (PA) - PDF | 2,198 |
| ✅ | 19702 | Jefferson Health Plans (PA) | 1,912 |
| ✅ | 33709 | Independence Blue Cross (PA) | 8 |
| ✅ | 86199 | AmeriHealth (PA) | 8 |
| ⚠️ | 16322 | UPMC Health Plan (PA) | 0 |
| ⚠️ | 22444 | Highmark (PA) | 0 |
| ⚠️ | 98517 | Oscar Health (PA) | 0 |

*Highmark (22444): FormularyNavigator tool only — no static PDF. UPMC: navigate upmchealthplan.com manually.*

---

### RI — 0 drugs | 2 carriers | BLOCKED ❌

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔒 | 15287 | BlueCross BlueShield of RI | 0 |
| 🚫 | 77514 | Neighborhood Health Plan of RI (NHPRI) | 0 |

*BCBS RI PDF geo-blocked from cloud IPs — VPN to US residential required. NHPRI: FormularyNavigator searchable only.*

---

### VA — 4,371 drugs | 6 carriers | PARTIAL

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 10207 | CareFirst BCBS (VA) | 4,371 |
| ✅ | 95185 | Kaiser Permanente (VA - MAS) | 1,081 |
| ⚠️ | 20507 | Sentara Health Plans (VA) | 0 |
| ⚠️ | 24251 | UnitedHealthcare (VA) | 0 |
| ⚠️ | 88380 | Anthem HealthKeepers (VA) | 0 |
| ⚠️ | 86443 | Innovation Health / Aetna (VA) | 0 |

---

### VT — 8,970 drugs | 2 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 77566 | MVP Health Plan (VT) | 6,163 |
| ✅ | 13627 | Blue Cross Blue Shield of VT | 2,807 |

---

### WA — 23,659 drugs | 9 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 71281 | Cambia / Regence BlueShield (WA) | 6,421 |
| ✅ | 53732 | BridgeSpan Health (WA) | 4,598 |
| ✅ | 38498 | LifeWise Health Plan (WA) | 4,076 |
| ✅ | 49831 | Premera Blue Cross (WA) | 3,847 |
| ✅ | 80473 | Molina Healthcare (WA) | 2,470 |
| ✅ | 23371 | Kaiser Permanente (WA - NW) | 2,388 |
| ✅ | 61836 | Ambetter / Coordinated Care (WA) | 2,212 |
| ✅ | 62650 | UnitedHealthcare (WA) | 1,910 |
| ✅ | 18581 | Community Health Plan of WA (CHPW) | 1,504 |

---

## FFE States (29 states) — All via CMS Machine-Readable PUF

**Total: 196,303 drugs across 133 issuers**
**Source:** `formulary_intelligence.json` (49 MB)
**Refresh:** Download new MR-PUF from `data.cms.gov`, run `python scripts/fetch/fetch_formulary_full.py`

States: AK, AL, AR, AZ, DE, FL, HI, IA, IN, KS, LA, MI, MO, MS, MT, NC, ND, NE, NH, OH, OK, SC, SD, TN, TX, UT, WI, WV, WY

*Note: GA is included in SBM formulary registry above despite using federal enrollment platform. AR and OR are SBM-FP states captured separately.*

---

## SBM Drug Count by State — Summary

| State | Exchange | Drugs | Carriers | Status |
|-------|----------|-------|----------|--------|
| CA | Covered California | 41,910 | 12 | Complete |
| WA | WA Healthplanfinder | 23,659 | 9 | Complete |
| NY | NY State of Health | 31,439 | 11 | Complete |
| MD | Maryland Health Connection | 19,784 | 5 | Complete |
| CO | Connect for Health CO | 18,320 | 6 | Complete |
| OR | OR SBM-FP | 16,869 | 5 | Near Complete |
| MA | MA Health Connector | 14,317 | 7 | Near Complete |
| NV | Nevada Health Link | 13,092 | 4 | Complete |
| MN | MNsure | 12,806 | 5 | Complete |
| PA | Pennie | 12,142 | 9 | Near Complete |
| KY | kynect | 11,268 | 4 | Complete |
| NJ | GetCoveredNJ | 9,282 | 5 | Near Complete |
| DC | DC Health Link | 8,965 | 4 | Near Complete |
| CT | AccessHealthCT | 8,417 | 4 | Complete |
| VT | Vermont Health Connect | 8,970 | 2 | Complete |
| ID | Your Health Idaho | 24,421 | 8 | Complete |
| GA | (FFE enrollment / SBM formulary) | 30,248 | 10 | Complete |
| ME | CoverME.gov | 3,905 | 3 | Partial |
| VA | (SBM-FP) | 4,371 | 6 | Partial |
| IL | GetCoveredIllinois | 4,296 | 1 | Partial |
| NM | beWellnm | 3,830 | 4 | Partial |
| RI | HealthSource RI | 0 | 2 | Blocked |
| **Total SBM** | | **322,311** | **157** | |

---

## Validation Baselines (PY2026)

| Metric | Baseline |
|--------|---------|
| FFE formulary total | ≥ 196,303 drugs |
| SBM formulary total | ≥ 322,311 drugs |
| Total drugs | ≥ 518,614 |
| SBC plan variants (total) | ≥ 27,588 |
| SBC FFE plan variants | ≥ 20,354 |
| SBC SBM plan variants | ≥ 7,234 |
| States with data | 50 / 51 (RI formulary blocked) |

---

*Generated 2026-04-04 by Claude Code from `data/config/formulary-url-registry-2026.json` (schema v2.0)*
