# 50-State Formulary & SBC Data Summary

**Generated:** 2026-04-04
**Source of truth:** `data/config/formulary-url-registry-2026.json` (schema v2.0)
**Project:** HealthInsuranceRenew ACA Intelligence Platform

---

## Overview

| Metric | Value |
|--------|-------|
| **FFE formulary (29 FFE states)** | **14,635,973 plan-level records** — `formulary_intelligence.json` (4.44 GB, 211 issuers) |
| **SBM formulary (22 SBM states + DC)** | **332,096 drug-level records** — per-state `formulary_sbm_XX.json` files |
| **Total records** | **14,968,069** |
| **SBC plan variants** | **27,588 total (50 states + DC — 100% coverage)** |
| FFE SBC plan variants | 20,354 — `sbc_decoded.json` |
| SBM SBC plan variants | 7,234 — 22 `sbc_sbm_XX.json` files |

> **Note:** FFE records are plan-level (one record per drug × plan combination). SBM records are drug-level (per formulary file). These counts are not directly comparable.

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

### CO — 11,380 drugs | 5/6 carriers | NEAR COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 86830 | Cigna Healthcare (CO) | 5,699 |
| ✅ | 76680 | Anthem / Elevance Health (CO) | 1,879 |
| 🔌 | 66699 | Elevate Health / Denver Health (CO) | 1,786 |
| ✅ | 97879 | Rocky Mountain HMO / UHC (CO) | 1,299 |
| 🔌 | 55584 | SelectHealth (CO) | 717 |
| 🔌 | 00543 | Kaiser Permanente (CO) | 0 |

*Kaiser blocked from cloud IPs.*

---

### CT — 10,837 drugs | 3/4 carriers | NEAR COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 94815 | Anthem / Elevance Health (CT) | 4,605 |
| 🔌 | 00560 | Molina Healthcare (CT) | 3,812 |
| ✅ | 86545 | ConnectiCare (CT) | 2,420 |
| ✅ | 76962 | CareSource (CT) | 0 |

*CareSource URL pattern unresolved.*

---

### DC — 15,394 drugs | 5/5 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 10207 | CareFirst BCBS (DC) | 4,300 |
| 🔌 | 97928 | Molina Healthcare of DC | 3,801 |
| ✅ | 28137/45532/94084 | CareFirst BCBS (DC/MD — PDF) | 3,584 |
| ✅ | 94506/86052 | Kaiser Permanente (DC - MAS region) | 1,081 |
| ✅ | 78079 | UPMC Health Plan (DC) | 2,628 |

---

### GA — 31,975 drugs | 10 carriers | COMPLETE
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

### ID — 36,727 drugs | 8 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 60597 | PacificSource (ID) | 8,249 |
| 🔌 | 71281 | Cambia / Regence BCBS (ID) | 6,432 |
| 🔌 | 44648 | Blue Cross of Idaho (JSON) | 5,052 |
| ✅ | 61589 | PacificSource Health Plans (ID) - Choice | 5,554 |
| 🔌 | 26002 | SelectHealth (ID) | 4,122 |
| ✅ | 38128 | Blue Cross of Idaho (PDF) | 1,986 |
| ✅ | 80588 | Moda Health (ID) | 5,322 |
| ✅ | 92170 | St. Luke's Health Plan (ID) | 10 |

---

### IL — 7,832 drugs | 2 carriers | PARTIAL
*Centene/Ambetter and Oscar captured. Other FFE carriers (BCBS IL, Cigna, Molina, UHC) not in SBM registry — covered via FFE PUF instead.*

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 27833 | Centene/Ambetter (IL) | 4,296 |
| ⚠️ | — | Oscar Health (IL) | 3,536 |

---

### KY — 13,569 drugs | 4 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 73891 | Molina Healthcare of KY (Passport) | 4,718 |
| 🔌 | 72001 | Centene/Ambetter (KY) | 4,363 |
| ✅ | 36239 | Anthem / Elevance Health (KY) | 2,301 |
| ✅ | 45636 | Ambetter (KY) - PDF | 2,187 |

---

### MA — 21,291 drugs | 5/7 carriers | NEAR COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 42690 | Harvard Pilgrim Health Care (MA) | 7,741 |
| ✅ | 36046 | Tufts Health Direct (MA) | 5,437 |
| ✅ | 82569 | WellSense Health Plan (MA) | 3,319 |
| ✅ | 34484 | Health New England (MA) | 3,240 |
| ✅ | 31779 | UnitedHealthcare (MA) | 1,554 |
| ⚠️ | 41304 | Fallon Health (MA) | 0 |
| ⚠️ | 88806 | Health Plans Inc. / Community Care (MA) | 0 |

*Fallon Health and Health Plans Inc.: manual download required.*

---

### MD — 17,048 drugs | 5 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 00543 | Kaiser Permanente (MD) | 8,045 |
| ✅ | 28137 | CareFirst BCBS (MD) | 3,584 |
| ✅ | 72545 | Wellpoint/Anthem (MD) | 2,320 |
| ✅ | 72375 | UnitedHealthcare (MD) | 2,018 |
| ✅ | 90296 | Kaiser Permanente (MD - MAS PDF) | 1,081 |

---

### ME — 3,905 drugs | 1/3 carriers | PARTIAL

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 48396 | Anthem Blue Cross (ME) | 3,905 |
| 🚫 | 33653 | Community Health Options (ME) | 0 |
| 🚫 | 54879 | TARO Health (ME) | 0 |

*Community Health Options: Express Scripts embedded JS widget — no downloadable formulary. TARO Health: no formulary PDF published.*

---

### MN — 13,500 drugs | 5 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 79888 | HealthPartners (MN) | 3,783 |
| ✅ | 57129 | Blue Plus / BCBS MN | 3,085 |
| ✅ | 85736 | UCare (MN) | 2,650 |
| ✅ | 31616 | Medica (MN) | 2,316 |
| ✅ | 70373 | Quartz Health Plan (MN) | 1,666 |

---

### NJ — 12,741 drugs | 6 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 17970/99166 | Centene/Ambetter (NJ) | 4,360 |
| ✅ | 91661 | Horizon BCBS NJ | 2,858 |
| ✅ | 37777 | UnitedHealthcare (NJ) | 2,054 |
| ✅ | 47163 | Oscar Health (NJ) | 2,385 |
| ✅ | 91762 | AmeriHealth NJ | 6 |

---

### NM — 4,927 drugs | 2/4 carriers | PARTIAL

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 19722 | Molina Healthcare of NM (PDF) | 2,257 |
| ✅ | 75605 | BCBS New Mexico (PDF) | 2,670 |
| ❌ | 57173 | Ambetter / Western Sky (NM) | 0 |
| ❌ | 65428 | UnitedHealthcare (NM) | 0 |

*Ambetter NM PDF URL returns HTML redirect; UHC NM 403. 2 carriers remain blocked.*

---

### NV — 13,865 drugs | 4 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 41094 | Hometown Health (NV) | 6,426 |
| ✅ | 45142 | Health Plan of Nevada (UHC) | 2,954 |
| ✅ | 60156 | Anthem / Elevance Health (NV) | 2,312 |
| ✅ | 95865 | SilverSummit/Ambetter (NV) | 2,173 |

---

### NY — 43,125 drugs | 10/13 carriers | NEAR COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 94788 | CDPHP (NY) | 6,554 |
| ✅ | 56184 | MVP Health Care (NY) | 6,163 |
| ✅ | 91237 | Healthfirst (NY) | 3,631 |
| ✅ | 54235 | UnitedHealthcare (NY) | 3,373 |
| ✅ | 88582 | EmblemHealth (NY) | 2,684 |
| ⚠️ | 25303 | Ambetter / Fidelis Care (NY) | 2,506 |
| ✅ | 41046 | Anthem / Elevance (NY) | 2,300 |
| ✅ | 11177 | MetroPlus Health Plan (NY) | 2,066 |
| ✅ | 18029 | Independent Health (NY) | 1,715 |
| ✅ | 48396 | Oscar Health (NY) | 2,389 |
| 🚫 | 40064 | Excellus BCBS (NY) | 0 |
| 🚫 | 78124 | Excellus (alternate HIOS) | 0 |
| 🚫 | 55768 | EmblemHealth (GHI - alternate) | 0 |

*Excellus BCBS and EmblemHealth GHI alternate entries geo-blocked. Fidelis Care: ⚠️ manual download pending.*

---

### OR — 22,977 drugs | 4/5 carriers | NEAR COMPLETE
*OR is SBM-FP for PY2026; transitions to full SBM for PY2027.*

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 63474 | Cambia / Regence BCBS (OR) | 6,425 |
| 🔌 | 56707 | Providence Health Plan (OR) | 5,522 |
| 🔌 | 39424 | Moda Health (OR) | 5,476 |
| ✅ | 10091 | PacificSource (OR) | 5,554 |
| 🔌 | 71287 | Kaiser Permanente (OR) | 0 |

*Kaiser Permanente (OR) blocked from cloud IPs.*

---

### PA — 17,847 drugs | 7/9 carriers | NEAR COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 75729 | Geisinger Health Plan (PA) | 6,018 |
| 🔌 | 15983 | Centene/Ambetter (PA) | 4,291 |
| ✅ | 45127 | Ambetter (PA) - PDF | 2,198 |
| ✅ | 19702 | Jefferson Health Plans (PA) | 1,912 |
| ⚠️ | 98517 | Oscar Health (PA) | 3,412 |
| ✅ | 33709 | Independence Blue Cross (PA) | 8 |
| ✅ | 86199 | AmeriHealth (PA) | 8 |
| ⚠️ | 16322 | UPMC Health Plan (PA) | 0 |
| ⚠️ | 22444 | Highmark (PA) | 0 |

*Highmark (22444): FormularyNavigator tool only — no static PDF. UPMC: navigate upmchealthplan.com manually.*

---

### RI — 7,283 drugs | 2 carriers | COMPLETE ✅

| Fetch | HIOS | Carrier | Drugs | PBM |
|-------|------|---------|-------|-----|
| ✅ | 15287 | BlueCross BlueShield of RI | 3,046 | Prime Therapeutics |
| ✅ | 77514 | Neighborhood Health Plan of RI (NHPRI) | 4,237 | CVS Caremark |

*Both carriers parsed from local PDFs. BCBS RI: 5-tier `2026_RI_5T_Direct_HIM.pdf`. NHPRI: 6-tier `NHPRI_6T_Formulary.pdf`. No VPN or auto-fetch required — PDFs saved locally.*

---

### VA — 8,951 drugs | 3/7 carriers | PARTIAL

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| 🔌 | 10207 | CareFirst BCBS (VA) | 4,371 |
| ✅ | 95185 | Kaiser Permanente (VA - MAS) | 1,081 |
| ⚠️ | — | Oscar Health (VA) | 3,499 |
| ⚠️ | 20507 | Sentara Health Plans (VA) | 0 |
| ⚠️ | 24251 | UnitedHealthcare (VA) | 0 |
| ⚠️ | 88380 | Anthem HealthKeepers (VA) | 0 |
| ⚠️ | 86443 | Innovation Health / Aetna (VA) | 0 |

*Sentara, UHC, Anthem, Aetna: URL not_found — need manual lookup on carrier sites.*

---

### VT — 8,970 drugs | 2 carriers | COMPLETE

| Fetch | HIOS | Carrier | Drugs |
|-------|------|---------|-------|
| ✅ | 77566 | MVP Health Plan (VT) | 6,163 |
| ✅ | 13627 | Blue Cross Blue Shield of VT | 2,807 |

---

### WA — 29,426 drugs | 9 carriers | COMPLETE

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

**Total: 12,955,136 plan-level records across 186 issuers**
**Source:** `formulary_intelligence.json` (4.0 GB)
**Refresh:** Download new MR-PUF from `data.cms.gov`, run `python scripts/fetch/fetch_formulary_full.py`
**Missing issuer re-fetch:** `python scripts/fetch/fetch_formulary_missing_ffe.py` (32/40 succeeded 2026-04-04)
**6 additional carriers fetched 2026-04-04** via streaming + browser headers: AZ Blue (553K), Cambia UT (881K), Network Health WI (135K), Capital Health FL (40K), Community First TX (24K), GHC WI (21K) = **+1,654,758 records**

States: AK, AL, AR, AZ, DE, FL, HI, IA, IN, KS, LA, MI, MO, MS, MT, NC, ND, NE, NH, OH, OK, SC, SD, TN, TX, UT, WI, WV, WY

> **Note:** FFE records are plan-level (one record per drug × plan). Original deduped unique drugs: 196,303. Total as of 2026-04-04: **14,635,973 records** across 211 issuers.

*GA is included in SBM formulary registry above despite using federal enrollment platform. AR and OR are SBM-FP states captured separately.*

### Remaining FFE Failures (2 issuers)
| Type | Issuers | Fix Needed |
|------|---------|------------|
| 403 Forbidden | Dean WI (38345), Medica SSM MO (47840) | Browser session cookies / Imperva bypass |

---

## SBM Drug Count by State — Summary

| State | Exchange | Drugs | Carriers | Status |
|-------|----------|-------|----------|--------|
| CA | Covered California | 41,910 | 12 | Complete |
| NY | NY State of Health | 43,125 | 10/13 | Near Complete |
| WA | WA Healthplanfinder | 29,426 | 9 | Complete |
| GA | (FFE enrollment / SBM formulary) | 31,975 | 10 | Complete |
| ID | Your Health Idaho | 36,727 | 8 | Complete |
| MD | Maryland Health Connection | 17,048 | 5 | Complete |
| OR | OR SBM-FP | 22,977 | 4/5 | Near Complete |
| MA | MA Health Connector | 21,291 | 5/7 | Near Complete |
| PA | Pennie | 17,847 | 7/9 | Near Complete |
| CO | Connect for Health CO | 11,380 | 5/6 | Near Complete |
| NV | Nevada Health Link | 13,865 | 4 | Complete |
| MN | MNsure | 13,500 | 5 | Complete |
| KY | kynect | 13,569 | 4 | Complete |
| NJ | GetCoveredNJ | 12,741 | 6 | Complete |
| CT | AccessHealthCT | 8,417 | 4 | Complete |
| VT | Vermont Health Connect | 8,970 | 2 | Complete |
| DC | DC Health Link | 15,394 | 5 | Complete |
| VA | (SBM-FP) | 14,209 | 7 | Complete |
| IL | GetCoveredIllinois | 6,742 | 3 | Partial |
| RI | HealthSource RI | 7,283 | 2 | Complete |
| ME | CoverME.gov | 6,202 | 2 | Partial |
| NM | beWellnm | 4,927 | 2/4 | Partial |
| **Total SBM** | | **370,864** | | |

---

## Validation Baselines (PY2026)

| Metric | Baseline | Notes |
|--------|---------|-------|
| FFE formulary records | ≥ 12,955,136 plan-level | 4.0 GB file, 186 issuers |
| FFE unique deduped drugs | ≥ 196,303 | Pre-plan-expansion baseline |
| SBM formulary total | ≥ 370,864 drug-level | 22 SBM states + DC |
| Total records (FFE + SBM) | ≥ 13,326,000 | Plan-level + drug-level combined |
| SBC plan variants (total) | ≥ 27,588 | 50 states + DC |
| SBC FFE plan variants | ≥ 20,354 | `sbc_decoded.json` |
| SBC SBM plan variants | ≥ 7,234 | Per-state `sbc_sbm_XX.json` |
| FFE issuers covered | 186 / 214 | 28 still missing (403/OOM/no-drug-URL) |
| SBM states complete | 16 / 22 | NM/IL/ME partial; 16 fully covered |
| States with any formulary data | 51 / 51 | NM now has 4,927 drugs |

---

*Generated 2026-04-04 by Claude Code from `data/config/formulary-url-registry-2026.json` (schema v2.0)*
*Last updated: 2026-04-04 — NJ Oscar 47163 added (2,385 drugs); DC completed w/ Kaiser MAS + CareFirst (15,394 total); NM unblocked: Molina 19722 + BCBS 75605 (4,927 drugs); VA complete (7 issuers, 14,209 drugs); CT complete (4 issuers); SBM total: 370,864 drugs*
