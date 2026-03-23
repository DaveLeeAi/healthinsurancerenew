# CLAUDE.md — HealthInsuranceRenew ACA Intelligence Platform

> Read this file at the start of EVERY session. Follow all instructions precisely.

---

## Project Overview

**Name:** HealthInsuranceRenew — ACA Intelligence Platform
**Purpose:** Build structured datasets from public government data to power 150,000+ programmatic SEO pages covering ACA health insurance plans, premiums, subsidies, formularies, and compliance scenarios across all US states and counties.
**Owner:** Dave Lee — Licensed health insurance agent, CMS Elite Circle of Champions recognition, licensed in 20+ states.
**Site:** healthinsurancerenew.com
**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Vercel

---

## Critical Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — master project instructions |
| `DESIGN.md` | Single source of truth for every page type, component, schema, and copy rule |
| `ozempic_nc_formulary_v19.html` | V19 approved visual mockup — all page types inherit from this standard |
| `PHASE1_PROMPTS.md` | Phase 1 implementation prompts and task tracking |

---

## Working Style

1. **Read DESIGN.md before touching any page file** — it is the visual and structural authority
2. **Always show diffs first** before making changes
3. **One task at a time** — complete and validate before moving on
4. **Commit after each step** with descriptive messages
5. **Test/validate after every ETL step** — record counts, null checks, schema validation
6. **Ask before installing** unapproved packages

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

## Data Coverage

- **48 states + DC** covered via FFM PUF + SBM formulary sources
- **CA, NY, MA** geo-blocked — State-Based Marketplaces with no accessible public formulary endpoints
- SBM source registry: `data/config/sbm-source-registry.json`

---

## 2026 Rules (Critical)

- **Enhanced subsidies expired** end of 2025
- **Subsidy cliff is back** at 400% FPL ($62,600 single / $128,600 family of 4)
- All subsidy and enhanced-credits pages must reflect post-enhancement 2026 rules
- Do NOT show 2021–2025 enhanced figures as current rates

---

## Implementation Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Formulary page redesign to V19 standard | **COMPLETE** — locked at 9.5/10 |
| 2 | Sitewide component migration (FAQ, AEO, schema fixes) | Pending |
| 3 | Critical 2026 content updates (subsidy cliff, enhanced credits) | Pending |
| 4 | Page-type-by-page-type conversion to V19 | Pending |

**Phase 1 details:** Formulary template scored 9.5/10 by external LLM reviewers (ChatGPT, Gemini). Template file: `app/formulary/[issuer]/[drug_name]/page.tsx`. This is the locked reference — all other page types should aim to match this quality.

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

### TypeScript (Pages & Components)
- **Framework:** Next.js 14 App Router — strict TypeScript, no `any`
- **Styling:** Tailwind CSS
- **Validation:** Zod for API routes
- **Components:** Follow DESIGN.md component library (EvidenceBlock, AeoBlock, etc.)

### Python (Data Pipeline)
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

## Folder Structure

```
healthinsurancerenew/
├── CLAUDE.md                          # This file — master instructions
├── DESIGN.md                          # Page design framework (V19 standard)
├── app/                               # Next.js App Router pages
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Homepage
│   ├── [state-name]/                  # State/county/plan routes
│   ├── formulary/                     # Formulary drug pages
│   ├── plans/                         # Plan listing pages
│   ├── subsidies/                     # Subsidy calculator pages
│   ├── rates/                         # Rate volatility pages
│   ├── dental/                        # Dental coverage pages
│   ├── drugs/                         # Drug index/category pages
│   ├── enhanced-credits/              # Policy scenario pages
│   ├── life-events/                   # Life event decision trees
│   ├── billing/                       # CPT billing pages
│   ├── states/                        # State hub pages
│   ├── guides/                        # Editorial guides
│   ├── faq/                           # FAQ pages
│   ├── tools/                         # Interactive tools
│   └── api/                           # API routes
├── components/                        # React components
│   ├── AnswerBox.tsx                  # → Being replaced by AeoBlock
│   ├── Breadcrumbs.tsx
│   ├── Disclaimer.tsx
│   ├── FAQSection.tsx                 # → Being replaced by StaticFaq
│   ├── Footer.tsx
│   ├── Header.tsx
│   └── ...
├── lib/                               # Shared utilities
│   ├── formulary-helpers.ts           # Tier normalization
│   ├── schema-markup.ts               # JSON-LD schema builders
│   ├── content-templates.ts           # Content generation helpers
│   ├── markdown.ts                    # Markdown collection helpers
│   └── ...
├── content/                           # Markdown content files
│   ├── guides/                        # Guide articles
│   ├── states/                        # State data markdown
│   └── faq/                           # FAQ entries
├── data/
│   ├── raw/                           # ⚠️ GITIGNORED — large CMS files
│   │   ├── puf/                       # Downloaded PUF CSVs
│   │   ├── formulary_json/            # Carrier formulary JSON files
│   │   └── sbc_pdfs/                  # SBC PDF documents
│   ├── processed/                     # ✅ COMMITTED — structured datasets
│   ├── config/                        # Configuration files
│   │   ├── sbm-source-registry.json   # SBM issuer formulary URLs
│   │   └── ...
│   └── schema/                        # JSON schemas for validation
├── scripts/
│   ├── fetch/                         # Data download scripts
│   ├── etl/                           # Transform & normalize scripts
│   └── generate/                      # Content generation scripts
├── skills/                            # Claude Code skill definitions
├── public/                            # Static assets
├── docs/                              # Documentation & audits
├── requirements.txt                   # Python dependencies
├── package.json                       # Node dependencies
└── .gitignore
```

---

## Forbidden Phrases — Search and Replace Before Every PR

```
"per pen" / "per fill"          → "per month"
"prior auth"                    → "prior authorization" (full term)
"TL;DR"                         → "Quick answer"
"observed in"                   → "found in {N} of {total} plans"
"most plans cover"              → "covered by {N} of {total} plans reviewed"
"based on available data"       → "in our review of {N} plans"
"estimated, per [unit]"         → remove inline — one disclaimer in footer
"Plan benefit documents"        → "2026 plan benefit filings"
"ACA" in hero/H1                → "health plan" or "Marketplace plan"
"formulary" in H1               → "drug list" or "drug coverage"
"patients"                      → "people" or "enrollees"
"related conditions"            → remove
"ACA guidelines"                → remove
"FPL" in visible copy           → "income limit" (link to /fpl-2026)
"coinsurance" in hero           → move below fold
"Machine-Readable PUF"          → "plan benefit documents"
```

---

## Validation Commands

```bash
# TypeScript
npx tsc --noEmit

# Forbidden phrases
grep -r "per pen\|per fill\|prior auth[^o]\|MedicalWebPage\|medicalAudience\|TL;DR\|most plans cover\|related conditions" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts"

# <br> in headings
grep -r "<h1.*<br\|<h2.*<br" app/ --include="*.tsx"

# JS-rendered FAQ (should return nothing after Phase 2)
grep -r "getElementById.*faq\|\.forEach.*faq\|faq.*innerHTML" \
  app/ --include="*.tsx"

# Schema/meta sync (manual)
# WebPage description === <meta name="description"> in each page
# FAQPage question names === visible <summary> text in each page
```

---

## Git Rules

- `data/raw/*` is gitignored — CMS files are too large
- `data/processed/` JSON files ARE committed — they are the dataset product
- `data/schema/` JSON schemas ARE committed
- `sbc_decoded.json` is gitignored (429 MB) — too large for Git
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
- Consumer tone, not clinician — decision support, not medical guidance

---

## NEVER Do This

- Never use `MedicalWebPage` schema on any page
- Never use `medicalAudience` in schema
- Never expose raw CMS issuer IDs (e.g., `77422`) in visible UI
- Never add named author on inner pages (asset-sale constraint)
- Never use `<br>` in headings
- Never use "per fill" or "per pen" — always "per month"
- Never use "Machine-Readable PUF" — use "plan benefit documents"
- Never use "TL;DR" — use "Quick answer"
- Never use "patients" — use "people" or "enrollees"
- Never use "ACA" in H1 — use "health plan" or "Marketplace plan"
- Never use "formulary" in H1 — use "drug list" or "drug coverage"
- Never put caveat inside AEO block element
- Never hardcode API keys or secrets
- Never use `print()` for operational logging (Python)
- Never skip validation after ETL
- Never commit raw CMS data files (too large)
- Never publish unsourced cost/premium claims
- Never provide medical advice — always "consult a licensed agent"
