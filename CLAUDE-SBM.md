# CLAUDE-SBM.md — SBM Data Acquisition Rules

**Scope:** This file governs all work related to acquiring SBC and formulary data for the 17 missing SBM (State-Based Marketplace) states. Read this BEFORE touching any SBM data files.

---

## Read First (in this order)

1. `CLAUDE.md` — project-wide rules (always applies)
2. `docs/SBM-DATA-SOURCES.md` — master spec for all 17 SBM states, verified URLs, feasibility ratings, implementation priority
3. `data/config/mn_source_registry.json` — MN carrier registry (template for building other state registries)
4. `data/processed/sbc_sbm_CA.json` — SBC output schema reference
5. `data/processed/formulary_sbm_CA.json` — Formulary output schema reference
6. `scripts/etl/parse_sbc_pdfs_ca.py` — existing SBC parser (reuse patterns)
7. `scripts/etl/parse_formulary_pdf_ca.py` — existing formulary PDF parser (reuse patterns)
8. `scripts/fetch/fetch_formulary_sbm.py` — existing MRF JSON fetcher (reuse for ID, ME)

---

## Schema Rules

- Output schemas MUST match CA reference files exactly — same field names, same nesting, same data types
- Do NOT invent new fields, rename existing ones, or change nesting depth
- After every parse, run a structural diff against the CA schema to verify:
  ```bash
  python3 -c "
  import json
  ca = json.load(open('data/processed/sbc_sbm_CA.json'))
  new = json.load(open('data/processed/sbc_sbm_[STATE].json'))
  # Compare top-level keys and nested structure, not values
  "
  ```
- If the CMS PUF has fields that don't map cleanly to the CA schema, document the mapping in a comment in the parser — do NOT silently drop fields or invent mappings

---

## SBC Data Rules

**Source: CMS SBE QHP PUF — this is the ONLY source for SBC data.**

- URL: `https://www.cms.gov/marketplace/resources/data/state-based-public-use-files`
- Download pattern: `https://www.cms.gov/files/zip/{statename}sbepuf2025.zip`
- Format: ZIP → 6 CSVs (Benefits & Cost Sharing, Rate, Plan Attributes, Business Rules, Service Area, Network)
- Parse the Benefits & Cost Sharing CSV into `sbc_sbm_[STATE].json`
- Plan Attributes CSV contains FormularyID — extract and store for cross-referencing

**One parser script handles all 17 states.** Write `scripts/etl/parse_sbc_puf_sbm.py` that takes a state abbreviation as argument and outputs `sbc_sbm_[STATE].json`. Do NOT write 17 separate parsers.

**Do NOT:**
- Scrape carrier SBC PDFs (CMS PUF is superior structured data)
- Scrape marketplace plan comparison tools
- Use any source other than the CMS SBE QHP PUF for SBC data

---

## Formulary Data Rules

### The regulatory reality

CMS only requires JSON formulary files (drugs.json/plans.json) from FFE issuers under 45 CFR §156.122(d)(2). Standalone SBE issuers are NOT required to publish formulary data in JSON format. Nearly all publish PDFs only.

**Do NOT search for drugs.json or plans.json for SBE carriers.** It does not exist except for these confirmed exceptions:

### Exceptions — carriers that voluntarily publish JSON
- **Idaho:** Blue Cross of Idaho (`corporate.bcidaho.com/json/files.page`), PacificSource (`pacificsource.com/resources/json-files`), SelectHealth (`selecthealth.org/disclaimers/machine-readable-data`)
- **Maine:** Harvard Pilgrim / Point32Health (confirmed voluntary JSON for ME marketplace plans; endpoint URL needs browser extraction from `harvardpilgrim.org/public/transparency`)

For these carriers, use `scripts/fetch/fetch_formulary_sbm.py` (the existing MRF JSON fetcher).

### All other states — PDF parsing

- Use pdfplumber for table extraction
- Reuse patterns from `scripts/etl/parse_formulary_pdf_ca.py` — adapt, don't rewrite from scratch
- Output: `formulary_sbm_[STATE].json` matching `formulary_sbm_CA.json` schema
- Each carrier's PDF has a different layout — expect to handle per-PBM variations:
  - **Prime Therapeutics** (BCBS MN, Medica MN, BCBS RI): 3-column (Drug Name, Tier, Notes/Requirements)
  - **Navitus** (Quartz, UCare): similar 3-column layout
  - **AdaptiveRx** (HealthPartners): verify layout after downloading
  - **CVS Caremark** (MVP, BCBS VT): verify layout after downloading
  - **FormularyNavigator/FDB** (Anthem): state-specific designations in filename

### Formulary URL sources

**Every URL must come from `docs/SBM-DATA-SOURCES.md`.** Do NOT:
- Guess or hallucinate carrier MRF URLs
- Use URLs from Gemini, ChatGPT, or any other LLM without verification
- Assume a URL pattern works for a different carrier or state

If a URL in SBM-DATA-SOURCES.md is marked "redirect" or "unverified," flag it and skip — do not attempt to resolve redirects programmatically from cloud servers (many will 403).

---

## TiC vs Formulary — Critical Distinction

**Transparency in Coverage (TiC) Machine Readable Files** contain negotiated provider rates and allowed amounts. These are NOT formulary drug lists.

**Formulary data** contains drug name, tier, prior authorization, step therapy, quantity limits. It follows the CMS QHP Provider-Formulary API schema (drugs.json format).

Many carrier "MRF" pages only host TiC files. When SBM-DATA-SOURCES.md lists a carrier's MRF endpoint, check whether it contains formulary data or just TiC rates before building a parser for it.

---

## File Naming and Output

### Output files per state
```
data/config/[state]_source_registry.json    — carrier/URL mapping (like mn_source_registry.json)
data/processed/sbc_sbm_[STATE].json         — SBC/cost-sharing data
data/processed/formulary_sbm_[STATE].json   — formulary/drug tier data
```

### ETL scripts
```
scripts/etl/parse_sbc_puf_sbm.py           — CMS PUF → sbc_sbm_[STATE].json (one script, all states)
scripts/etl/parse_formulary_pdf_[PBM].py   — per-PBM PDF parser (Prime, Navitus, etc.)
```

Do NOT write per-state formulary parsers. Write per-PBM parsers since carriers using the same PBM have identical PDF layouts.

### Commit pattern
```
git add data/config/[state]_source_registry.json
git add data/processed/sbc_sbm_[STATE].json
git add data/processed/formulary_sbm_[STATE].json
git add scripts/etl/[any new or modified parsers]
git commit -m "data(sbm): add [STATE] SBC and formulary data"
```

One commit per state. Do NOT batch multiple states into one commit.

---

## Implementation Priority

Follow the phase order in `docs/SBM-DATA-SOURCES.md`:

**Phase 1 — Quick wins:**
1. All 17 states SBC via CMS PUF (one script, one pass)
2. ID — all 3 carriers publish JSON
3. MN — Quartz + UCare direct PDFs, Blue Plus via myprime.com
4. NV — Centene + UHC
5. NJ — AmeriHealth direct PDF, Horizon

**Phase 2 — PDF parsing:**
6. PA → CO → NY → WA → NM → KY → CT → ME → DC

**Phase 3 — Hard problems (may need VPN/proxy):**
15. MD → MA → RI → VT

Do NOT skip ahead to Phase 3 states. Complete Phase 1 first.

---

## Audit Before Code

Before writing any new parser or fetcher:
1. Read the target state's section in `SBM-DATA-SOURCES.md`
2. Verify the carrier URLs are still in the spec (do not use URLs from memory)
3. Check if an existing parser already handles the format (Prime Therapeutics PDF? Navitus PDF? CMS JSON?)
4. If reusing a parser, copy and adapt — do not modify the original CA parsers

---

## What NOT To Do

- Do NOT hallucinate MRF URLs — every URL must come from SBM-DATA-SOURCES.md
- Do NOT confuse TiC MRF (negotiated rates) with formulary data (drug lists)
- Do NOT write per-state SBC parsers — one CMS PUF parser handles all states
- Do NOT write per-state formulary parsers — write per-PBM parsers
- Do NOT fetch from carrier APIs without checking SBM-DATA-SOURCES.md for accessibility
- Do NOT commit empty, malformed, or placeholder JSON files
- Do NOT attempt to resolve "redirect" URLs from cloud servers — they will 403
- Do NOT search for drugs.json for SBE carriers (it doesn't exist, see regulatory reality above)
- Do NOT use Gemini-generated URLs without independent verification
- Do NOT modify existing CA parsers — copy and adapt for SBM use
