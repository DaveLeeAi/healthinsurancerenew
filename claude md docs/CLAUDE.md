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
| `ozempic_nc_formulary_v19.html` | V19 approved visual/layout reference — all page types inherit this layout |
| `healthinsurancerenew_v35_formulary.html` | V35 locked content, copy, and schema reference |
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

- **50 states + DC** — 320/320 ACA marketplace carriers = **100% carrier coverage**
- **15,245,850 total formulary records** (14,854,187 FFE plan-level + 391,663 SBM drug-level)
- **46 enrichment files** with PA/QL/ST restriction data (199,438 drugs)
- Includes Selenium-scraped data: Presbyterian NM (16,561), Mountain Health CO-OP ID (33,862), Highmark PA (7,921)
- **20,354+ SBC plan variants** (FFE + SBM)
- Formulary URL registry: `data/config/formulary-url-registry-2026.json` (primary source of truth)
- Carrier fact-check: `docs/aca_2026_ifp_carriers_fact_check.md` (320 carriers verified)
- Formulary landing page: `docs/50-states-formulary.md` (complete audit)
- Annual refresh scripts: `scripts/refresh/annual-formulary-refresh.py` and `scripts/refresh/annual-sbc-refresh.py`
- Refresh calendar: `docs/annual-refresh-calendar.md`

### SBM State List (22 + DC for PY2026)
Full SBM (22): CA, CO, CT, DC, GA, ID, IL, KY, MA, MD, ME, MN, NJ, NM, NV, NY, OR, PA, RI, VA, VT, WA
SBM-FP (2): AR, OR
Transitioning for PY2027: OR (full SBM), OK (SBM-FP)

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
| 1 | Formulary page redesign — V35 locked as content/schema standard | **COMPLETE** — locked at 9.5/10 |
| 2 | Sitewide component migration (FAQ, AEO, schema fixes) | Pending |
| 3 | Critical 2026 content updates (subsidy cliff, enhanced credits) | Pending |
| 4 | Page-type conversion + ISR + 15.2M drug/plan pages | Pending |

**Phase 1 details:** Formulary template scored 9.5/10 by external LLM reviewers (ChatGPT, Gemini). Template file: `app/[state]/[drug]/page.tsx` (brand/generic conditional rendering). V19 remains the visual layout reference; V35 is the locked content, copy, and schema reference. V35 is the locked template for the ~37,500 drug-in-state page tier. Phase 4 drug+plan pages (`/[state]/[drug]/[plan-slug]/`) need their own simpler template.

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
│   ├── [state]/                       # Formulary pages: /[state]/[drug]/page.tsx (brand/generic conditional)
│   ├── formulary/                     # Legacy formulary routes (redirect to /[state]/[drug]/)
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
"insurer" / "insurers"          → "insurance company" or "your plan" per actor rotation
"clinical situation"            → "your situation" or remove
"plan filings" (consumer copy)  → "plan information" or "federal plan data"
"provide the medication"        → "fill the prescription"
"pick it up from the pharmacy"  → "fill the prescription" or "fill it"
"your health plan" (overuse)    → rotate: "your plan" / "the plan" / "your insurance company"
"clinical information"          → remove or rephrase
"criteria"                      → "approval requirements"
"negotiated rate"               → remove or rephrase
"substantial"                   → remove or rephrase
"claims data"                   → remove or rephrase
"medically appropriate"         → avoid unless clinically necessary
```

### Actor Rotation Rule (locked)

Confirmed across Cigna, Prime Therapeutics, Florida Blue carrier research.

| Context | Actor to use |
|---|---|
| Coverage rules / tiers / deductibles | `your plan` or `the plan` |
| Approval / process steps | `the plan` or `your insurance company` |
| Human institution clearly acting | `your insurance company` |

- Never repeat the same actor phrase in adjacent sentences
- Never use `insurer` anywhere
- `your health plan` is permitted but must not be overused — rotate with above

### Vocabulary — Always Use

- `fill the prescription` / `fill it` — pharmacy actions only, NOT in summaries or structured sections
- `tier` (not `formulary tier level`)
- `approval` — plain English for prior authorization
- `approval requirements` — not `criteria`
- `federal plan data` — not `plan filings` in consumer copy
- `drug list` — not `formulary` in consumer copy
- `insurance company` OR `your plan` / `the plan` — by context per actor rotation

### Reading Level

- Target: Grade 6–8 (Flesch-Kincaid), Flesch Reading Ease 60+
- Active voice default
- Consumer-first framing — `you/your` language throughout

---

## Validation Commands

```bash
# TypeScript
npx tsc --noEmit

# Forbidden phrases (MedicalWebPage/medicalAudience allowed in formulary pages only)
grep -r "per pen\|per fill\|prior auth[^o]\|TL;DR\|most plans cover\|related conditions\|insurer\b\|insurers\b\|clinical situation\|provide the medication\|pick it up from" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts"

# MedicalWebPage audit — should ONLY appear in app/[state]/[drug]/page.tsx
grep -r "MedicalWebPage\|medicalAudience" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts"

# <br> in headings
grep -r "<h1.*<br\|<h2.*<br" app/ --include="*.tsx"

# JS-rendered FAQ (should return nothing after Phase 2)
grep -r "getElementById.*faq\|\.forEach.*faq\|faq.*innerHTML" \
  app/ --include="*.tsx"

# Meta description present on all pages
grep -rL "meta name=\"description\"" app/ --include="*.tsx"

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

- Never use `MedicalWebPage` schema on any page EXCEPT formulary pages (triple schema — see DESIGN.md §7)
- Never use `medicalAudience` in schema on any page EXCEPT formulary pages (`medicalAudience: Patient`)
- Never use `insurer` or `insurers` anywhere — use `insurance company` or `your plan`
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
