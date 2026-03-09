# CLAUDE.md — HealthInsuranceRenew ACA Dataset Authority System

> Read this file at the start of EVERY session. Follow all instructions precisely.

---

## Project Overview

**Name:** HealthInsuranceRenew — ACA Intelligence Platform
**Purpose:** Build structured datasets from public government data to power 150,000+ programmatic SEO pages covering ACA health insurance plans, premiums, subsidies, formularies, and compliance scenarios across all US states and counties.
**Owner:** Dave Lee — Licensed health insurance agent, CMS Elite Circle of Champions recognition, licensed in 20+ states.
**Site:** healthinsurancerenew.com (existing Astro site in `/src`)

---

## Architecture — 10 Data Pillars

| # | Pillar | Primary Data Sources |
|---|--------|---------------------|
| 1 | **Plan & Premium Intelligence** | CMS QHP Landscape + Plan Attributes PUF + Rate PUF |
| 2 | **Subsidy & Affordability Engine** | IRS FPL tables + CMS benchmark premiums + APTC formula |
| 3 | **SBC Decoded (Exclusions & Triggers)** | Carrier SBC PDFs → structured JSON |
| 4 | **Rate Volatility Tracker** | CMS Rate Review PUF + URRT multi-year data |
| 5 | **Friction & Guidance Q&A** | Regulatory citations + real client experience scenarios |
| 6 | **Formulary Intelligence** | CMS MR-PUF → carrier JSON formulary files (mandated by law) |
| 7 | **Dental Coverage Reality** | SADP PUF + dental SBCs (waiting periods, coverage %, annual max) |
| 8 | **Billing Intelligence** | CPT/ICD-10 coding scenarios + visit limit data |
| 9 | **Life Events & Transitions** | SEP rules, turning 26, Medicare at 65, immigration/DMI |
| 10 | **Regulatory Risk & Policy Scenarios** | Enhanced credit expiration modeling, state mandates |

---

## Primary Data Source

**data.healthcare.gov API** — CMS publishes 12 Exchange PUF (Public Use Files) as downloadable CSVs.

- API base: `https://data.healthcare.gov/api/1/`
- Dataset catalog: `https://data.healthcare.gov/api/1/metastore/schemas/dataset/items`
- CMS PUF download page: `https://www.cms.gov/marketplace/resources/data/public-use-files`

The MR-PUF contains URLs to every carrier's machine-readable formulary JSON files. All public domain, no scraping needed.

### Key PUF Files

| PUF File | Contents |
|----------|----------|
| Rate PUF | Premium rates by plan, age, tobacco, rating area |
| Plan Attributes PUF | Benefits, cost-sharing, network, metal level details |
| BenCS PUF | Benefits and Cost Sharing details |
| MR-PUF | Machine-Readable URLs → formulary JSON files |
| SADP PUF | Stand-Alone Dental Plan data |
| QHP Landscape | Consumer-facing plan comparison data |
| Service Area PUF | County-level service area mappings |
| Rate Review PUF | Rate change justifications |

---

## Coding Standards

- **Language:** Python 3.11+
- **Type hints:** Required on all functions
- **Docstrings:** Required on all public functions and classes
- **Logging:** Use `logging` module — never `print()` for operational output
- **API calls:** Retry 3x with exponential backoff
- **Validation:** Validate all outputs against JSON schemas
- **Scripts:** Atomic — each script does one thing, runnable standalone (`python scripts/fetch/fetch_puf.py`)
- **Environment variables:** Use `.env` + `python-dotenv` for API keys
- **Error handling:** Catch specific exceptions, log context, fail loudly on data corruption

---

## Working Style

1. **Always show diffs first** before making changes
2. **One task at a time** — complete and validate before moving on
3. **Commit after each step** with descriptive messages
4. **Test/validate after every ETL step** — record counts, null checks, schema validation
5. **Ask before installing** unapproved packages

---

## Folder Structure

```
healthinsurancerenew/
├── CLAUDE.md                          # This file — master instructions
├── skills/                            # Claude Code skill definitions
│   ├── data-pipeline/SKILL.md
│   ├── formulary-aggregator/SKILL.md
│   ├── sbc-parser/SKILL.md
│   └── content-generator/SKILL.md
├── scripts/
│   ├── fetch/                         # Data download scripts
│   ├── etl/                           # Transform & normalize scripts
│   └── generate/                      # Content generation scripts
├── data/
│   ├── raw/                           # ⚠️ GITIGNORED — large CMS files
│   │   ├── puf/                       # Downloaded PUF CSVs
│   │   ├── formulary_json/            # Carrier formulary JSON files
│   │   └── sbc_pdfs/                  # SBC PDF documents
│   ├── processed/                     # ✅ COMMITTED — our structured dataset
│   └── schema/                        # JSON schemas for validation
├── site/                              # Generated site content (future)
├── docs/                              # Documentation
├── src/                               # Existing Astro site
├── public/                            # Existing static assets
├── requirements.txt                   # Python dependencies
└── .gitignore
```

---

## Git Rules

- `data/raw/*` is gitignored — CMS files are too large
- `data/processed/` JSON files ARE committed — they are the dataset product
- `data/schema/` JSON schemas ARE committed
- Never commit `.env` or API keys
- Commit after each major step with a clear message

---

## Safety & Content Rules

- No DIY medical instructions on public pages
- No full names/addresses on public pages
- All generated content saves as draft — never auto-publish
- Medical disclaimers required on every public page
- Cost/premium data must cite source and plan year
- HIPAA-safe: we use only public government data, never PII

---

## NEVER Do This

- Never hardcode API keys or secrets
- Never use `print()` for operational logging
- Never skip validation after ETL
- Never commit raw CMS data files (too large)
- Never publish unsourced cost/premium claims
- Never provide medical advice — always "consult a licensed agent"
