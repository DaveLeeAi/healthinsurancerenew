# SBM State Data Sources — Consolidated Research Spec

**Last updated:** 2026-04-05
**Purpose:** Single source of truth for SBC and formulary data acquisition across all SBM states.
**Current SBM coverage:** 391,663 drugs across 22 states — ALL COMPLETE. 320/320 carriers = 100%.
**Usage:** Claude Code reads this file to determine what to download, parse, and commit per state.

---

## Critical Context

### SBC Data — SOLVED for all 17 states

The **CMS SBE QHP Public Use File** provides structured plan-level benefits, rates, cost sharing, service areas, and plan attributes for ALL SBM states in CSV format.

- **URL:** `https://www.cms.gov/marketplace/resources/data/state-based-public-use-files`
- **Format:** ZIP → 6 CSVs per state (Benefits & Cost Sharing, Rate, Plan Attributes, Business Rules, Service Area, Network)
- **Download pattern:** `https://www.cms.gov/files/zip/{statename}sbepuf2025.zip`
- **Cloud accessible:** Yes, no auth, no geo-blocking
- **Coverage:** PY2016–PY2025 (PY2026 not yet published as of March 2026)
- **Contact:** `SBE_PublicUseFiles@cms.hhs.gov`

**Action for Claude Code:** Download all 17 state ZIPs, parse Benefits & Cost Sharing CSV into `sbc_sbm_[STATE].json` matching the schema in `data/processed/sbc_sbm_CA.json`.

### Formulary Data — Regulatory Gap

**CMS only requires JSON formulary files (drugs.json/plans.json) from FFE issuers** under 45 CFR §156.122(d)(2). Standalone SBE issuers publish formularies in whatever format they choose — nearly all use PDF. There is no federal bulk formulary dataset for SBE states.

**Formulary acquisition strategy (in priority order):**
1. **Direct-download PDFs** from carrier/PBM sites (parseable with pdfplumber)
2. **FFE cross-reference** — multi-state carriers publish JSON for their FFE states; same formulary often applies to SBE plans
3. **State marketplace Excel/CSV files** — some states (MN, NJ, CO) publish structured plan data with formulary URLs

---

## State-by-State Source Registry

### Feasibility Key
- 🟢 **Easy** — Direct-download data, cloud accessible
- 🟡 **Medium** — Redirect URLs or PDF parsing needed
- 🔴 **Hard** — Geo-blocked, login-walled, or no public source found

---

### 1. MINNESOTA (MNsure) — 🟢 SBC / 🟡 Formulary

**Source file:** `data/config/mn_source_registry.json` (complete, verified)
**MNsure Excel:** `Individual-Provider-Networks-2026_tcm34-708330.xlsx` — 270 plans, 5 carriers, HIOS IDs, 87-county service area matrix

**Carriers (5 medical, 2026):**

| Carrier | Plans | Formulary URL | Format | PBM | Verified |
|---------|-------|--------------|--------|-----|----------|
| Blue Plus (BCBS MN) | 95 | `myprime.com/content/dam/prime/memberportal/WebDocs/2025/Formularies/HIM/2025_MN_4T_BasicRx_Individual_Small_Group.pdf` | PDF 4-tier | Prime Therapeutics | ✅ |
| Medica | 84 | `medica.com/MNDrugList-2026` (redirect) | PDF 4-tier | Prime Therapeutics | ✅ redirect |
| HealthPartners | 33 | `healthpartners.com/prx26mn` (redirect) | PDF | AdaptiveRx | ✅ redirect |
| Quartz | 17 | `quartzbenefits.com/wp-content/uploads/docs/members/pharmacy/2026/2026-Individual-Family-Standard-Formulary.pdf` | PDF 4-tier DIRECT | Navitus | ✅ |
| Quartz (6T) | — | `quartzbenefits.com/wp-content/uploads/docs/members/pharmacy/2026/2026-Individual-and-Family-Standard-6T-formulary-MN.pdf` | PDF 6-tier DIRECT | Navitus | ✅ |
| UCare | 14 | `ucm-p-001.sitecorecontenthub.cloud/api/public/content/U5434_IFP_Formulary_2026` | PDF DIRECT | Navitus | ✅ |
| UCare Easy Compare | — | `ucm-p-001.sitecorecontenthub.cloud/api/public/content/U14431_IFP-EasyCompare_Formulary_2026` | PDF DIRECT | Navitus | ✅ |

**Networks (per MNsure Excel):**
- Blue Plus: Minnesota Value, Southeast MN, Metro MN
- HealthPartners: Cornerstone, Peak, Select, Alpine
- Medica: Altru Prime, Bold (M Health Fairview), Engage, Essentia Choice Care, Applause, North Memorial Acclaim, Ridgeview Distinct
- Quartz: Select
- UCare: IFP Broad, IFP with M Health Fairview

**TODO:**
- [ ] Follow HealthPartners redirect (`healthpartners.com/prx26mn`) from VPN to get final PDF URL
- [ ] Follow Medica redirect (`medica.com/MNDrugList-2026`) from VPN to get final PDF URL
- [ ] Parse all PDFs with pdfplumber → `formulary_sbm_MN.json`

---

### 2. PENNSYLVANIA (Pennie) — 🟢 SBC / 🟢 Formulary

**SBC:** CMS SBE PUF ✅
**State data:** PA Insurance Dept at `pa.gov/agencies/insurance/…/aca-health-rate-filings` — carrier-level rate data with county maps

| Carrier | Formulary MRF | Cloud | Notes |
|---------|--------------|-------|-------|
| UPMC Health Plan | `upmchealthplan.com/transparency-in-coverage/mrf/` | ✅ | 100% file accessibility per Payerset |
| Highmark | `mrfdata.hmhs.com` | ✅ | Sapphire MRF hub |
| Geisinger | `geisinger.org/health-plan/nosurprisesact` | ✅ | |
| Oscar Health | `hioscar.com/transparency-in-coverage-files/oscar` | ❌ | JS SPA, needs headless browser |

**Note:** MRF files are TiC negotiated rates, NOT formulary drug lists. For formulary: check if these carriers publish drugs.json voluntarily, or fall back to PDF extraction.

---

### 3. COLORADO (Connect for Health CO) — 🟢 SBC / 🟢 Formulary

**SBC:** CMS SBE PUF ✅
**State data:** CO DOI at `doi.colorado.gov/for-consumers/…/insurance-plan-filings-approved-plans` — Excel plan data by county and metal tier

| Carrier | MRF Endpoint | Cloud |
|---------|-------------|-------|
| Cigna | `cigna.com/legal/compliance/machine-readable-files` | ✅ |
| Anthem CO | `anthem.com/co/machine-readable-file/search/` | ✅ |
| Kaiser CO | `healthy.kaiserpermanente.org/colorado/front-door/machine-readable` | ✅ |
| Rocky Mountain (UHC) | `transparency-in-coverage.uhc.com` | ✅ |

---

### 4. IDAHO (Your Health Idaho) — 🟢 SBC / 🟢 Formulary

**SBC:** CMS SBE PUF ✅
**Best-positioned medium-value state — all 3 carriers publish JSON directly.**

| Carrier | Formulary Endpoint | Format | Cloud |
|---------|-------------------|--------|-------|
| Blue Cross of Idaho | `corporate.bcidaho.com/json/files.page` | JSON (drugs, plans, providers) | ✅ |
| PacificSource | `pacificsource.com/resources/json-files` | JSON | ✅ |
| SelectHealth | `selecthealth.org/disclaimers/machine-readable-data` | JSON | ✅ |

**Priority: HIGH — easiest formulary win. All three carriers voluntarily publish CMS-schema JSON.**

---

### 5. NEVADA (Nevada Health Link) — 🟢 SBC / 🟢 Formulary

**SBC:** CMS SBE PUF ✅
**State data:** NV DOI ACA rate filings at `doi.nv.gov/Insurers/Life_and_Health/ACA_Plans/Rate_Filings/`

| Carrier | Formulary Source | Cloud |
|---------|-----------------|-------|
| Ambetter (Centene) | `centene.com/price-transparency-files.html` → ambetter_index.json | ✅ |
| Health Plan of Nevada (UHC) | `transparency-in-coverage.uhc.com` | ✅ |
| Hometown Health | UNVERIFIED | ❓ |

---

### 6. NEW JERSEY (GetCoveredNJ) — 🟢 SBC / 🟡 Formulary

**SBC:** CMS SBE PUF ✅
**State data:** NJ DOBI publishes actual premium rate tables at `nj.gov/dobi/division_insurance/ihcseh/ihcrates.htm`

| Carrier | Formulary Source | Cloud | Notes |
|---------|-----------------|-------|-------|
| Horizon BCBS | `horizonblue.sapphiremrfhub.com` | ✅ | Sapphire MRF hub (TiC rates, check for formulary) |
| AmeriHealth NJ | `amerihealthnj.com/html/developer-resources/` | ❌ | Robots-blocked; explicitly states "pharmacy MRF delayed pending further rule-making" |
| AmeriHealth NJ (PDF fallback) | `amerihealth.com/pdfs/providers/pharmacy_information/select_drug/ah-select-drug-formulary-nj.pdf` | ✅ | Direct PDF, NJ-specific formulary |
| AmeriHealth Caritas Next | `amerihealthcaritasnext.com/json/index.aspx` | ✅ | JSON but covers FFE states only (FL, NC, LA, SC), NOT NJ |
| Oscar Health | JS SPA | ❌ | PDF formularies on Contentful CDN |
| Aetna | `health1.aetna.com/app/public/#/…` | ✅ | TiC rates |

---

### 7. WASHINGTON (WA Healthplanfinder) — 🟢 SBC / 🟡 Formulary

**SBC:** CMS SBE PUF ✅

| Carrier | Formulary Source | Cloud | Notes |
|---------|-----------------|-------|-------|
| Premera Blue Cross | `premera.sapphiremrfhub.com` | ✅ | Sapphire MRF hub |
| Coordinated Care (Centene) | `centene.com/…/ambetter_index.json` | ✅ | May be under Ambetter index |
| Molina | `molinahealthcare.com/members/common/mrf.aspx` | ⚠️ | Strict IP blocking for bulk downloads |
| Kaiser WA | `healthy.kaiserpermanente.org/oregon-washington/front-door/machine-readable` | ❓ | Unverified |

---

### 8. NEW YORK (NY State of Health) — 🟢 SBC / 🟡 Formulary

**SBC:** CMS SBE PUF ✅

| Carrier | Formulary Source | Cloud | Notes |
|---------|-----------------|-------|-------|
| Fidelis Care (Centene) | `centene.com/…/fidelis_index.json` | ✅ | Confirmed on Centene page |
| MVP Health Care | `mvphealthcare.com/developers/machine-readable-files` | ✅ | |
| Oscar Health | JS SPA → Contentful CDN PDFs | ❌ | State-specific PDFs with PA/ST/QL |
| MetroPlus | `metroplus.org/wp-content/uploads/…` marketplace formulary PDFs | ✅ | 3-tier with PA/ST/QL/SGM flags |
| Molina NY | N/A | — | Offers Essential Plan and Medicaid, NOT QHP marketplace plans |

---

### 9. NEW MEXICO (beWellnm) — 🟢 SBC / 🟡 Formulary

**SBC:** CMS SBE PUF ✅
**State data:** NM HCA has PY26 Clear Cost Plan Designs in Excel at `hca.nm.gov/health-insurance-marketplace-affordability-program/`

| Carrier | MRF Page | Cloud |
|---------|----------|-------|
| BCBS NM | `bcbsnm.com/member/policy-forms/machine-readable-file` | ✅ |
| Molina | `molinahealthcare.com/members/common/mrf.aspx` | ⚠️ IP blocking |
| Presbyterian | `phs.org/tools-resources/member/applicable-rates` | ✅ |

---

### 10. KENTUCKY (kynect) — 🟢 SBC / 🟡 Formulary

**SBC:** CMS SBE PUF ✅ (KY is SBE-FP, may also appear in FFE PUFs)

| Carrier | Formulary Source | Cloud |
|---------|-----------------|-------|
| Ambetter (Centene) | `centene.com/…/ambetter_index.json` | ✅ |
| Molina | IP blocking concern | ⚠️ |
| CareSource | TiC MRF page unverified | ❓ |

---

### 11. MARYLAND (Maryland Health Connection) — 🟢 SBC / 🔴 Formulary

**SBC:** CMS SBE PUF ✅

| Carrier | Formulary Source | Cloud | Notes |
|---------|-----------------|-------|-------|
| CareFirst BCBS | `individual.carefirst.com/…/machine-readable-data.page` | ❌ | Robots-blocked; but operates in VA (FFE) — VA index URL in MR-PUF may reveal same infrastructure |
| CareFirst (PDF fallback) | `member.carefirst.com/members/drug-pharmacy-information/drug-search.page` | ✅ | Web search tool + exchange formulary PDFs |
| Kaiser Mid-Atlantic | `healthy.kaiserpermanente.org/front-door/machine-readable` | ✅ | |
| Aetna | `health1.aetna.com/app/public/#/…` | ✅ | TiC rates |

---

### 12. CONNECTICUT (Access Health CT) — 🟢 SBC / 🟡 Formulary

**SBC:** CMS SBE PUF ✅
**State data:** CT Insurance Dept rate filing portal at `catalog.state.ct.us/cid/portalApps/RateFilingDefault.aspx`

| Carrier | Formulary Source | Cloud | Notes |
|---------|-----------------|-------|-------|
| Anthem | `anthem.com/machine-readable-file/search/` | ✅ | TiC rates; formulary via FormularyNavigator PDFs |
| ConnectiCare (EmblemHealth) | `transparency.connecticare.com` | ✅ | **Confirmed TiC-only**, no formulary |
| ConnectiCare (PDF fallback) | `connecticare.com/en/resources/pharmacy/drugs-covered` | ✅ | Web page + PDFs |

---

### 13. DC (DC Health Link) — 🟢 SBC / 🟡 Formulary

**SBC:** CMS SBE PUF ✅
**State data:** DISB rate filings; DC HBX is open-source on GitHub (`github.com/dchbx`)

| Carrier | Formulary Source | Cloud |
|---------|-----------------|-------|
| CareFirst | Robots-blocked (same as MD) | ❌ |
| Kaiser | ✅ | ✅ |
| Aetna | ✅ | ✅ |

---

### 14. MAINE (CoverME) — 🟢 SBC / 🟡 Formulary

**SBC:** CMS SBE PUF ✅ (Maine transitioned from FFE to SBE in PY2022)
**State data:** Maine BOI ACA filings at `maine.gov/pfr/insurance/legal/upcoming-hearings/public-access-to-aca-filings`

| Carrier | Formulary Source | Cloud | Notes |
|---------|-----------------|-------|-------|
| Harvard Pilgrim / Point32Health | **CONFIRMED voluntary JSON publication for ME marketplace plans** | ✅ | Legacy from FFE era; actual endpoint URL needs browser extraction from `harvardpilgrim.org/public/transparency` |
| Anthem ME | `anthem.com/machine-readable-file/search/` + FormularyNavigator PDFs (ME_IND designation) | ✅ | |
| Community Health Options | `healthoptions.org/members/pharmacy` — web search tool + PDF | ✅ | No JSON |

**Harvard Pilgrim ME is the only confirmed SBE carrier voluntarily publishing CMS-schema formulary JSON.** Priority lead.

---

### 15. MASSACHUSETTS (Health Connector) — 🟢 SBC / 🔴 Formulary

**SBC:** CMS SBE PUF ✅
**Hardest state. All carriers blocked. No Centene presence.**

| Carrier | Formulary Source | Cloud | Notes |
|---------|-----------------|-------|-------|
| BCBS MA | PDF guides + web lookup at `bluecrossma.org/medication` | ⚠️ | PBM: CVS Caremark |
| Harvard Pilgrim / Point32Health | TiC only; explicitly states "awaiting CMS guidance on prescription drug file" | ❌ | Publishes JSON for ME/NH only |
| Tufts Health Plan | TiC only; same "awaiting CMS guidance" language | ❌ | Merged with Harvard Pilgrim |
| Fallon Health | Online search tool + PDF | ❓ | May not sell Health Connector individual plans currently |

**Recommended path:** PDF extraction from carrier sites; BCBS MA via CVS Caremark PDFs.

---

### 16. RHODE ISLAND (HealthSource RI) — 🟢 SBC / 🔴 Formulary

**SBC:** CMS SBE PUF ✅
**State data:** OHIC rate review at `ohic.ri.gov/regulatory-review/rate-review` — exceptionally well-organized with SERFF tracking numbers

| Carrier | Formulary Source | Cloud |
|---------|-----------------|-------|
| BCBS RI | PDF (4-tier, 5-tier variants); PBM: Prime Therapeutics | ⚠️ expect blocking |
| NHPRI | `nhpri.org/members/price-transparency-machine-readable-files/` — TiC rates only | ✅ TiC only |

**Only 2 carriers. Small market. PDF parsing is the only path.**

---

### 17. VERMONT (Vermont Health Connect) — 🟢 SBC / 🔴 Formulary

**SBC:** CMS SBE PUF ✅
**State data:** Green Mountain Care Board rate review at `ratereview.vermont.gov` — dedicated site with pending/archived filings

| Carrier | Formulary Source | Cloud | Notes |
|---------|-----------------|-------|-------|
| BCBS VT | `bluecrossvt.org/our-plans/employers-and-groups/machine-readable-files` | ⚠️ | Data hosted on Change Healthcare — **confirmed persistent access failures** (Serif Health analysis) |
| BCBS VT (drug lists) | `member.myhealthtoolkitvt.com/web/public/brands/vt/prescription-drugs/drug-lists/` | ✅ | Web page with PDF links |
| MVP Health Care | `mvphealthcare.com/developers/machine-readable-files` | ✅ | PDF via CVS Caremark |

**Only 2 carriers. BCBS VT MRF hosting unreliable. PDF parsing required.**

---

## Implementation Priority Order

Based on data accessibility and traffic value:

### Phase 1 — Quick wins (cloud-accessible JSON or direct-download PDFs)

1. **All 17 states SBC** — Download CMS SBE PUF ZIPs, parse to `sbc_sbm_[STATE].json`
2. **ID** — All 3 carriers publish JSON directly (bcidaho.com, pacificsource.com, selecthealth.org)
3. **MN** — Quartz + UCare direct PDFs, Blue Plus via myprime.com
4. **NV** — Centene + UHC both cloud-accessible
5. **NJ** — AmeriHealth NJ direct PDF, Horizon Sapphire hub

### Phase 2 — PDF parsing required

6. **PA** — UPMC, Highmark, Geisinger MRF endpoints (verify if they include formulary, not just TiC)
7. **CO** — All carrier MRFs accessible; CO DOI Excel supplementary
8. **NY** — Fidelis (Centene) + MVP accessible; Oscar/MetroPlus PDFs
9. **WA** — Premera Sapphire + Centene; Molina needs proxy
10. **NM** — All 3 carrier MRF pages verified
11. **KY** — Centene accessible; Molina/CareSource need proxy
12. **CT** — Anthem accessible; ConnectiCare PDF only
13. **ME** — Harvard Pilgrim JSON (extract endpoint from VPN); Anthem PDFs
14. **DC** — Kaiser/Aetna accessible; CareFirst blocked

### Phase 3 — Hard problems (VPN/proxy or PDF-only)

15. **MD** — CareFirst blocked; try VA FFE cross-reference
16. **MA** — All carriers blocked; PDF extraction from carrier sites
17. **RI** — BCBS RI blocked; NHPRI TiC only; PDF parsing
18. **VT** — BCBS VT MRF hosting unreliable; PDF parsing

---

## Key Infrastructure Notes

### Existing parsers to reuse
- `scripts/etl/parse_sbc_pdfs_ca.py` — pdfplumber table extraction
- `scripts/etl/parse_formulary_pdf_ca.py` — formulary PDF parser
- `scripts/fetch/fetch_formulary_sbm.py` — MRF JSON fetcher

### Schema references
- `data/processed/sbc_sbm_CA.json` — SBC output schema
- `data/processed/formulary_sbm_CA.json` — Formulary output schema
- `data/config/sbm-source-registry.json` — carrier URL registry

### Open-source tools
- **healthcare-mrf-api** (github.com/EndurantDevs/healthcare-mrf-api) — crawled 735 FFE issuers' formulary JSON; forkable for SBE voluntary publishers
- **CMSgov/QHP-provider-formulary-APIs** — CMS QHP Provider-Formulary API schema (drugs.json, plans.json)
- **MRF Data Solutions** directory at `mrfdatasolutions.com/payers` — curated links to 80+ carrier MRF pages

### Centene hub (covers multiple states)
- **URL:** `centene.com/price-transparency-files.html`
- **Pattern:** `centene.com/content/dam/centene/Centene%20Corporate/json/DOCUMENT/{YYYY-MM-DD}_{brand}_index.json`
- **Current date stamp:** 2026-03-04
- **Brands:** Fidelis (NY), Ambetter (NV, KY, + others), Health Net (CA), Coordinated Care (WA — may be under Ambetter)
- **Contact:** `price_transparency@centene.com`
