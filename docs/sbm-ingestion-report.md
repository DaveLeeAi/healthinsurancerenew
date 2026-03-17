# SBM Formulary Ingestion Report

> Generated: 2026-03-17
> Script: `scripts/fetch/fetch_formulary_sbm.py`
> Registry: `data/config/sbm-source-registry.json`

---

## Executive Summary

Successfully fetched and merged formulary data for **3 SBM states** (NJ, PA, WA) from the Centene/Ambetter API. Added **1,678 new drug groups** and updated **11,401 existing groups** in the main formulary. Total formulary grew from 174,201 to 175,879 deduped records (44.1 MB).

CA pilot failed: all 5 issuer URLs were dead (404/403). NY and MA also had zero live URLs.

---

## URL Verification Results

### CA (Covered California) - 0/5 live

| Issuer | HTTP | Status | Notes |
|--------|------|--------|-------|
| Blue Shield of CA | 404 | url_dead | Content returned as text/html |
| Kaiser Permanente (CA) | 403 | url_dead | Bot protection; HI/OR MR-PUF URLs also 403 |
| Anthem Blue Cross (CA) | 200 | not_json | Returns HTML search page |
| Health Net (CA) | 404 | url_dead | Centene subsidiary, but CA not in Ambetter API |
| Molina Healthcare (CA) | 403 | url_dead | Known MR-PUF URL now blocked |

### NJ (Get Covered New Jersey) - 1/4 live

| Issuer | HTTP | Status | Records |
|--------|------|--------|---------|
| **Centene/Ambetter (NJ)** | **200** | **active** | **4,364 drugs, 30,548 raw** |
| Horizon BCBS (NJ) | 200 | not_json | Returns empty body (invalid JSON) |
| Oscar Health (NJ) | 404 | url_dead | |
| Molina Healthcare (NJ) | 403 | url_dead | |

### PA (Pennie) - 1/4 live

| Issuer | HTTP | Status | Records |
|--------|------|--------|---------|
| **Centene/Ambetter (PA)** | **200** | **active** | **4,291 drugs, 72,947 raw** |
| Highmark (PA) | 404 | url_dead | |
| UPMC Health Plan | 404 | url_dead | |
| Independence Blue Cross | 404 | url_dead | |

### WA (Washington Healthplanfinder) - 1/5 live

| Issuer | HTTP | Status | Records |
|--------|------|--------|---------|
| **Centene/Ambetter (WA)** | **200** | **active** | **4,424 drugs, 39,816 raw** |
| Premera Blue Cross (WA) | 404 | url_dead | |
| Regence BlueShield (WA) | 404 | url_dead | |
| Molina Healthcare (WA) | 403 | url_dead | |
| Kaiser Permanente (WA) | 403 | url_dead | |

### NY (NY State of Health) - 0/4 live

| Issuer | HTTP | Status | Notes |
|--------|------|--------|-------|
| Fidelis Care | 200 | not_json | Redirects to /404 page |
| Oscar Health (NY) | 404 | url_dead | |
| EmblemHealth | 404 | url_dead | |
| Healthfirst (NY) | 404 | url_dead | |

### MA (Massachusetts Health Connector) - 0/4 live

| Issuer | HTTP | Status | Notes |
|--------|------|--------|-------|
| BCBS of MA | 403 | url_dead | |
| Kaiser Permanente (MA) | 403 | url_dead | |
| Harvard Pilgrim | 404 | url_dead | |
| Tufts Health Plan | 404 | url_dead | |

---

## Merge Results

| State | Raw Records | Deduped | New Groups | Updated Groups | File |
|-------|-------------|---------|------------|----------------|------|
| NJ | 30,548 | 4,364 | 1,091 | 3,273 | formulary_sbm_NJ.json (1.0 MB) |
| PA | 72,947 | 4,291 | 435 | 3,856 | formulary_sbm_PA.json (1.0 MB) |
| WA | 39,816 | 4,424 | 152 | 4,272 | formulary_sbm_WA.json (1.0 MB) |
| **Batch 1 Total** | **143,311** | **13,079** | **1,678** | **11,401** | |

Batch 1 merge: 174,201 -> 175,879 records (44.1 MB)

### Batch 2 — IL, KY, NV (2026-03-17)

| State | Raw Records | Deduped | New Groups | Updated Groups | File |
|-------|-------------|---------|------------|----------------|------|
| IL | 77,328 | 4,296 | 289 | 4,007 | formulary_sbm_IL.json (1.0 MB) |
| KY | 91,623 | 4,363 | 62 | 4,301 | formulary_sbm_KY.json (1.0 MB) |
| NV | 144,602 | 4,253 | 23 | 4,230 | formulary_sbm_NV.json (1.0 MB) |
| **Batch 2 Total** | **313,553** | **12,912** | **374** | **12,538** | |

Batch 2 merge: 175,879 -> 176,253 records (44.3 MB)

**Cumulative SBM formulary: 6 states, 176,253 total records, 44.3 MB**

---

## Tier Normalization Edge Cases

Centene/Ambetter uses non-standard tier names. Added these mappings:

| Raw Tier (Centene) | Normalized |
|---------------------|-----------|
| `PREFERREDGENERIC` | `GENERIC` |
| `PREFERREDBRAND` | `PREFERRED-BRAND` |
| `NONPREFERREDBRAND` | `NON-PREFERRED-BRAND` |
| `NON-PREFERREDGENERIC-NON-PREFERREDBRAND` | `NON-PREFERRED-BRAND` |
| `SPECIALTYDRUGS` | `SPECIALTY` |
| `ZEROCOSTSHAREPREVENTATIVEDRUGS` | `ACA-PREVENTIVE-DRUGS` |
| `ZEROCOSTSHAREPREVENTIVEDRUGS` | `ACA-PREVENTIVE-DRUGS` |

---

## Schema Variations Encountered

The Centene/Ambetter API uses the **standard CMS QHP formulary schema** (45 CFR 156.230):
- `rxnorm_id`, `drug_name`, `plans[]` with `drug_tier`, `prior_authorization`, `step_therapy`, `quantity_limit`
- No new field names discovered
- `normalize_drug_records()` from `fetch_formulary_full.py` handled it without modification

Key discovery: Centene provides **direct drug file URLs** per state (e.g., `drugs-AMB-NJ.json`) rather than requiring index.json -> URL discovery. Added `direct_drugs_url` field to the registry schema to support this pattern.

---

## Architecture: What Works Automatically

1. **Registry-driven design**: Add issuer to `sbm-source-registry.json`, run script
2. **Shared normalization**: `normalize_drug_records()` handles all CMS-compliant schemas
3. **Dedup on merge**: Same (drug_name, drug_tier, PA, ST, QL) key as `dedupe_formulary.py`
4. **Direct URL support**: `direct_drugs_url` field skips index.json discovery for APIs like Centene
5. **Dead URL skipping**: `status: "url_dead"` entries are skipped automatically
6. **Tier normalization**: `normalize_tier()` handles carrier-specific tier names
7. **Index rebuild**: `node scripts/build-indexes.mjs` regenerates byte-offset index

## What Requires Manual Work Per State

1. **URL discovery**: Finding the actual machine-readable file URLs is the bottleneck
   - CMS well-known path (`/cms-data-index.json`) rarely works for SBM issuers
   - Most carriers return 403/404 on guessed URLs
   - Multi-state carriers (Centene, Molina, Kaiser) use different URL patterns per brand
2. **Issuer ID assignment**: SBM issuers don't appear in the federal MR-PUF, so IDs need manual lookup
3. **Tier map updates**: Each new carrier may introduce new tier label variants

---

## SBM Expansion Sweep — 2026-03-17

### Centene API Coverage (Definitive)

Centene's `cms-data-index.json` lists exactly **27 states**:
AL, AR, AZ, DE, FL, GA, IA, IL, IN, KS, KY, LA, MI, MO, MS, NC, NE, NH, NJ, NV, OH, OK, PA, SC, TN, TX, WA

Of these, **6 are SBM states** (IL, KY, NJ, NV, PA, WA) — all now ingested.
The remaining **21 are FFM states** already covered by `fetch_formulary_full.py`.

**Centene does NOT operate in:** CA, CO, CT, DC, ID, MA, MD, MN, NM, NY, OR, RI, VT

### Remaining SBM States — URL Discovery Results (updated 2026-03-17)

Second sweep tested 80+ URL patterns and cross-referenced all 346 entries in the CMS Machine-Readable URL PUF. Three new active sources discovered.

| State | Exchange | Carriers Tested | Result | Blocking Issue |
|-------|----------|----------------|--------|----------------|
| **OR** | **Oregon Marketplace** | **Moda, Providence, Cambia/Regence**, PacificSource, Kaiser | **3 LIVE** | Moda + Providence + Cambia confirmed. PacificSource 403; Kaiser 403 |
| **WA** | **WA Healthplanfinder** | **Cambia/Regence (71281, 87718)**, Premera, Kaiser | **1 LIVE (new)** | Cambia drugs contain WA plan IDs. Premera 404; Kaiser 403 |
| **ID** | **Your Health Idaho** | **Cambia/Regence**, Blue Cross ID, SelectHealth | **1 LIVE (new)** | Cambia drugs contain ID plan IDs. Others 403/404 |
| CO | Connect for Health CO | Kaiser, Cigna | All blocked | Kaiser 403; Cigna drugs.json has FFM states only (no CO) |
| CT | Access Health CT | ConnectiCare, Molina, Elevance | All blocked | Elevance index LIVE but formulary = FFM only (no CT drugs) |
| DC | DC Health Link | CareFirst, Kaiser | VA-only | CareFirst 5 drug files = VA plan IDs only |
| MD | Maryland Health Connection | CareFirst, Kaiser | VA-only | Same CareFirst issue as DC |
| MN | MNsure | HealthPartners, Medica, UCare | All 403/404 | Not in MR-PUF |
| NM | beWellnm | BCBS NM, Molina, Presbyterian | All 403/404 | Molina 403; others 404 |
| NY | NY State of Health | Fidelis, Oscar, EmblemHealth, Healthfirst | All 404/HTML | All return 404 or HTML-not-JSON |
| CA | Covered California | 7 issuers tested | All blocked | No discoverable endpoints; Covered CA doesn't publish MR URLs |
| MA | MA Health Connector | BCBS MA, Kaiser, Harvard Pilgrim, Tufts | All 403/404 | Harvard Pilgrim + Tufts merged to Point32Health; still no JSON |
| RI | HealthSource RI | BCBS RI, Neighborhood HP | All 404 | Not in MR-PUF |
| VT | Vermont Health Connect | BCBS VT, MVP Health Care | All 404 | MVP uses HealthSparq portal |

### Key Discoveries — MR-PUF Cross-Reference

By analyzing the CMS Machine-Readable URL PUF (346 issuer entries), we found that multi-state carrier index.json files sometimes contain SBM state drug data even when only listed for FFM states:

**Cambia Health Systems** (`cms-machine-readable.cambiahealth.com/index.json`):
- Listed in MR-PUF for: OR (63474, 77969), UT (22013, 34541)
- drugs1.json (112 MB) + drugs2.json (112 MB) contain plan IDs for: **WA, OR, ID, UT**
- WA issuers: 71281 (Regence BlueShield WA), 87718 (Asuris Northwest Health WA)
- This is genuine SBM state data accessible through an FFM-listed carrier URL

**Moda Health** (`www.modahealth.com/cms-data-index.json`):
- Listed in MR-PUF for: AK (73836), OR (39424), TX (17933)
- State-specific drug files: drugs-OR.json (14.3 MB) with 39424OR* plan IDs
- OR is SBM-FP — issuers appear in federal MR-PUF

**Providence Health Plan** (`www.providencehealthplan.com/cms-data-index.json`):
- Listed in MR-PUF for: OR (56707)
- Drug files via FormularyNavigator: drugs/267 (24.9 MB) + drugs/268 (4.1 MB)
- 56707OR* plan IDs, 2025+2026 plan years

**Elevance Health / Anthem** (`www22.elevancehealth.com/cms-data-index-json/Elevance-Health-Data-Index.json`):
- Listed in MR-PUF for: FL, IN, MO, NH, OH, TX, WI + 1 more
- Index LIVE (3.9 KB), 11 formulary URLs on FormularyNavigator
- Has PROVIDERS_CT.json (94 MB) — confirms Elevance operates in CT
- BUT: No CT plans file, no CT drug data. Formulary = FFM states only

### CareFirst Deep Dive (DC + MD)

CareFirst BCBS has a working machine-readable index at `member.carefirst.com`:
- Index.json: 200 OK, valid JSON, lists 5 drug files + 15 provider files
- Drugs_1–5.json: All 200 OK, 3,700+ drugs each, standard CMS schema
- **BUT**: All 5 drug files contain only VA (FFM) plan IDs (issuers 10207, 40308)
- DC and MD SBM plan data is NOT in any of these files
- CareFirst appears to publish MR data only for their FFM-regulated plans

### Recommended Next Steps for Blocked States

1. **Ingest OR/WA/ID from Cambia + Moda + Providence** — Run `fetch_formulary_sbm.py --state OR WA ID --merge` after updating the script to handle Cambia's large drug files (112 MB each) and FormularyNavigator URLs.
2. **State exchange data partnerships** — Contact DC Health Link, Maryland Health Connection, MNsure, and Vermont Health Connect data teams directly. Small exchanges may provide bulk formulary data on request.
3. **CMS SBE PUF** — Check if CMS publishes a separate SBE (State-Based Exchange) PUF with formulary URLs. The current MR-PUF covers FFM and SBM-FP states but not true SBM.
4. **Carrier developer portals** — Some carriers (ConnectiCare, MVP) have transparency portals that may expose JSON via JS rendering. A headless browser approach could extract URLs.
5. **Annual re-check** — Re-probe all blocked URLs during OE (Oct–Jan) when carriers typically refresh their MR compliance files.

---

## Reusability Score: 8/10 (updated from 7/10)

**Strengths:**
- Architecture is solid — registry + shared normalizer + dedup merge works perfectly
- Centene/Ambetter API covers all 6 SBM states where they operate
- **NEW: MR-PUF cross-referencing revealed 3 additional active sources (Cambia, Moda, Providence)**
- **NEW: Cambia drugs contain bonus SBM data for WA and ID (not listed in MR-PUF)**
- Adding a state with a known URL takes < 5 minutes

**Weaknesses:**
- Bot protection (403) blocks Kaiser, Molina, SelectHealth, Medica, ConnectiCare
- No centralized SBM equivalent to the federal MR-PUF
- CareFirst publishes MR data for FFM plans only, excluding their SBM states (DC, MD)
- Elevance has CT providers but no CT formulary (FFM-only drug data)
- True SBM states (CA, NY, MA) have zero discoverable MR endpoints

**Coverage Summary (updated 2026-03-17):**
- **SBM states with formulary data: 6/18 ingested** (NJ, PA, WA, IL, KY, NV — all via Centene)
- **SBM states with confirmed new sources: 3** (OR: 3 carriers, WA: +2 Cambia issuers, ID: 1 Cambia)
- **SBM states blocked: 9/18** (CA, CO, CT, DC, MA, MD, MN, NY, RI, VT)
- **Centene SBM coverage: exhausted** (all 6 available states ingested)
- **Next ingestion batch: OR + WA + ID** (est. 5 new issuers, ~250 MB raw data)

---

## California (Covered California) — Status: Blocked

Covered California does not publish machine-readable formulary URLs externally. FORMULARY_URL column in CMS SBE PUF is blank for all 7 CA issuers. Correct HIOS IDs documented in registry for future use. Recommended path: direct outreach to Covered California data team or per-carrier website discovery.

Carriers: Molina (18126), Kaiser (40513), Centene/Ambetter (67138), Blue Shield (70285), Anthem (92499), L.A. Care (92815), IEHP (51396)

---

## Files Created/Modified

| File | Action | Size |
|------|--------|------|
| `data/config/sbm-source-registry.json` | Created, expanded to 18 states | ~15 KB |
| `scripts/fetch/fetch_formulary_sbm.py` | Created | 25 KB |
| `docs/sbm-field-map.md` | Created | 5.1 KB |
| `docs/sbm-ingestion-report.md` | Created | This file |
| `data/processed/formulary_sbm_NJ.json` | Created (batch 1) | 1.0 MB |
| `data/processed/formulary_sbm_PA.json` | Created (batch 1) | 1.0 MB |
| `data/processed/formulary_sbm_WA.json` | Created (batch 1) | 1.0 MB |
| `data/processed/formulary_sbm_IL.json` | Created (batch 2) | 1.0 MB |
| `data/processed/formulary_sbm_KY.json` | Created (batch 2) | 1.0 MB |
| `data/processed/formulary_sbm_NV.json` | Created (batch 2) | 1.0 MB |
| `data/processed/formulary_intelligence.json` | Modified | 44.3 MB |
| `.cache/formulary_drug_index.json` | Rebuilt | 2.7 MB |
