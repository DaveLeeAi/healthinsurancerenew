# Annual Data Refresh Calendar

## October (when CMS publishes new PUFs)
- [ ] Check CMS for new QHP Landscape PUF (FFE SBC data): https://data.cms.gov/marketplace/qualified-health-plan-landscape-puf
- [ ] Check CMS for new SBE QHP PUF (SBM SBC data): https://data.cms.gov/marketplace/qualified-health-plan-sbe-puf
- [ ] Check CMS for new MR-PUF (FFE formulary carrier URLs): https://www.cms.gov/marketplace/resources/data/public-use-files
- [ ] Download all new PUF files to `data/raw/puf/`
- [ ] Run `python scripts/refresh/annual-sbc-refresh.py --year {YEAR} --check-only` to verify availability

## November (formulary URL verification)
- [ ] Run `python scripts/refresh/annual-formulary-refresh.py --from-year {PREV} --to-year {YEAR}`
- [ ] Review `docs/refresh-report-{YEAR}.txt` -- fix dead URLs
- [ ] Review `docs/manual-download-list-{YEAR}.txt` -- download all manual PDFs
- [ ] Check for new market entrants (new carriers in CMS QHP PUF that weren't in prior year)
- [ ] Check for market exits (compare carrier lists year-over-year)
- [ ] Research URLs for any new SBM carriers (check carrier pharmacy pages)
- [ ] VPN fetch for geo-blocked carriers (RI, any new blocks)

## November (data parsing)
- [ ] Run FFE formulary fetch: `python scripts/fetch/fetch_formulary_full.py --year {YEAR}`
- [ ] Cross-check fetched issuers vs plan_intelligence issuer list — run `fetch_formulary_missing_ffe.py` for any gaps
- [ ] Run SBM PDF fetch + parse for each state with auto_download carriers
- [ ] Parse manually downloaded PDFs: `python scripts/fetch/parse_manual_pdfs.py --year {YEAR}`
- [ ] Run SBC parsers: `python scripts/etl/build_sbc_from_puf.py` (FFE) + SBM parsers
- [ ] Validate all output counts vs prior year baseline
- [ ] Rebuild indexes: `node scripts/build-indexes.mjs`

## December (content + deploy)
- [ ] Update PLAN_YEAR constants in page files
- [ ] Update DESIGN.md date references
- [ ] Update `data/config/formulary-url-registry-{YEAR}.json` with final drug counts
- [ ] Update llms.txt drug count
- [ ] Run `npm run build` -- verify programmatic pages regenerate
- [ ] Spot-check 10 pages across different pillars
- [ ] Deploy to Vercel

## Carriers That Always Need Manual Work

### Contentful CDN (Oscar Health -- all states)
Oscar uses Contentful CDN with unique asset IDs per document. Cannot increment year in URL.
- Go to `hioscar.com/forms/{YEAR}` or `hioscar.com/search-documents/drug-formularies/`
- Select each state (GA, AZ, TX, TN, FL, CA, NJ, PA)
- Download formulary PDF, save to `data/raw/pdfs/{ST}/Oscar_{YEAR}.pdf`

### AdaptiveRx Viewer (Blue Shield CA)
- Open URL in browser, save/print as PDF
- URL: `blueshieldca.adaptiverx.com` (key changes periodically)

### Bot-Protected Landing Pages
- **Anthem CA** (`92499`): Navigate `anthem.com/ca/ms/home.html#formulary` manually
- **L.A. Care** (`92815`): Check `lacare.org/members/pharmacy` for current year link
- **Valley Health Plan** (`84014`): Santa Clara County file server returns 403 on auto-download

### Selenium Scrape Required (headless Chrome)
- **Highmark PA** (`22444`): FormularyNavigator `siteCode=8103967260` — 7,921 drugs (2026)
- **Presbyterian NM**: FormularyNavigator `siteCode=0324498195` — 16,561 drugs (2026)
- **Mountain Health CO-OP ID**: AdaptiveRx `cbg.adaptiverx.com` — 33,862 drugs (2026)
- Script: `pip install selenium`, use headless Chrome, click A-Z letters or extract div.drug-item textContent
- **UPMC PA** (`16322`): Navigate `upmchealthplan.com/en/formulary` manually
- **NHPRI RI** (`77514`): FormularyNavigator — already have PDF enrichment (4,206 drugs)

### Online-Only (supplemental — core data exists via other sources)
- **PacificSource ID** (`61589`): Core data in SBM file (5,554 drugs)
- **Moda Health ID** (`80588`): Core data in SBM file (5,322 drugs)
- **Community Health Options ME** (`33653`): 2025 formulary used as proxy (3,814 drugs)
- **Mending ME** (`54879`): WellPoint formulary PDF available (2,359 drugs)

### VPN Required (geo-blocked from cloud IPs)
- **BCBS RI** (`15287`): Connect VPN to US residential IP, try Prime Therapeutics URL

## Manual Download Workflow
1. Run refresh script: `python scripts/refresh/annual-formulary-refresh.py --from-year {PREV} --to-year {YEAR}`
2. Script outputs `docs/manual-download-list-{YEAR}.txt` with every PDF you need to download by hand
3. Connect VPN if needed (for geo-blocked carriers)
4. Download each PDF, save to `data/raw/pdfs/{ST}/{carrier_name}_{YEAR}.pdf`
5. Run manual PDF parser: `python scripts/fetch/parse_manual_pdfs.py --year {YEAR}`
6. The parser reads from `data/raw/pdfs/`, parses with pdfplumber, outputs to `data/processed/`
7. Merge into state files and rebuild indexes

## Key Dates
- **CMS PUF release**: Usually October-November of the prior year
- **OEP start**: November 1
- **Carrier formulary PDFs**: Published September-October for next plan year
- **Sitemap resubmission**: After build with new data

## Validation Checklist (after all parsing complete)
- [ ] FFE formulary_intelligence.json >= 14,854,187 records (PY2026 baseline, plan-level)
- [ ] SBM formulary total >= 391,663 drugs (PY2026 baseline, drug-level)
- [ ] Enrichment files >= 46 files (PY2026 baseline)
- [ ] SBC plan variants >= 20,354 (PY2026 baseline)
- [ ] All 320 carriers have data (check against `aca_2026_ifp_carriers_fact_check.md`)
- [ ] Selenium scrapes complete: Presbyterian NM, Mountain Health CO-OP ID, Highmark PA
- [ ] BCBS MA multi-PDF compilation refreshed (13 source PDFs)
- [ ] `npm run build` passes with 0 errors
- [ ] Spot-check: 5 formulary pages, 3 plan pages, 2 subsidy pages render correctly

## PY2026 Baselines (as of 2026-04-05)
| Dataset | Baseline | Notes |
|---------|---------|-------|
| `formulary_intelligence.json` | 14,854,187 records | Plan-level; 4.52 GB |
| SBM drugs | 391,663 | Drug-level across 22 SBM states |
| Enrichment files | 46 files, 199,438 drugs | PA/QL/ST restriction data |
| SBC plan variants | 20,354 | From sbc_decoded.json |
| Carrier coverage | 320/320 = 100% | All ACA marketplace carriers |
| FFE carriers | 174/174 | CMS MR-PUF Bundle |
| SBM carriers | 146/146 | JSON APIs + PDFs + Selenium |
| **Grand total** | **15,245,850+** | FFE + SBM + enrichment |
