---
name: sbc-parser
description: Parses Summary of Benefits and Coverage (SBC) PDFs into structured JSON. Triggers on SBC parsing, cost-sharing extraction, exclusion taxonomy, or coverage examples.
---

# Skill: SBC Parser

> Parses Summary of Benefits and Coverage (SBC) PDFs into structured JSON data.
> In consumer-facing copy, use "federal marketplace plan data and plan benefit documents" — never specific PUF file names.

---

## SBC Page Spec

See **DESIGN.md Section 12b** for the SBC plan detail page specification.

- URL pattern: `/{state-slug}/{county-slug}/{plan}-plan`
- Schema: `WebPage` + `HealthInsurancePlan` + `FAQPage` + `BreadcrumbList`
- **Never** use `MedicalWebPage` — insurance decision-support is not clinical content
- **Note:** `/plan-details/{id}/{slug}` is a correct `permanentRedirect()` to the canonical plan URL. Do not change the routing logic.
- Page-class status: **APPROVED** (SERP score: 96 — highest priority page class)

---

## Data File

- **Output:** `data/processed/sbc_decoded.json` (429 MB)
- **Status:** Gitignored due to size — too large for Git
- **Schema version:** v2.0 (includes BenCS cost-sharing grid merge)
- **Records:** 20,354 plan variants across 30 states (Individual market, medical only, all CSR variants)
- **Join key:** `plan_variant_id` (= BenCS `PlanId`)

---

## SBC Template Structure

Every ACA-compliant health plan must publish an SBC in a **mandated 4-page format** (per 45 CFR 147.200):

| Page | Contents |
|------|----------|
| **Page 1** | Plan header, deductibles, OOP maximums, cost-sharing overview |
| **Page 2** | Common medical events cost-sharing grid |
| **Page 3** | Two coverage examples — "Having a Baby" and "Managing Type 2 Diabetes" |
| **Page 4** | Excluded services list, other covered services, grievance rights |

---

## Extraction Fields

### Cost-Sharing Grid (from pages 1–2)

```json
{
  "plan_id": "12345VA0010001",
  "plan_name": "Blue Choice Silver PPO",
  "issuer_name": "Anthem Blue Cross",
  "metal_level": "Silver",
  "plan_type": "PPO",
  "deductible_individual": 3000,
  "deductible_family": 6000,
  "oop_max_individual": 8550,
  "oop_max_family": 17100,
  "copay_primary_care": 30,
  "copay_specialist": 60,
  "copay_er": 500,
  "copay_urgent_care": 75,
  "copay_generic_rx": 15,
  "copay_preferred_brand_rx": 50,
  "copay_specialty_rx": "30% after deductible"
}
```

### Coverage Examples (from page 3)

```json
{
  "coverage_example_baby": { "total_cost": 12700, "plan_pays": 9400, "you_pay": 3300 },
  "coverage_example_diabetes": { "total_cost": 5600, "plan_pays": 3500, "you_pay": 2100 }
}
```

---

## 20-Category Exclusion Taxonomy

| # | Category Key | Description |
|---|-------------|-------------|
| 1 | `cosmetic` | Cosmetic surgery and procedures |
| 2 | `experimental` | Experimental or investigational treatments |
| 3 | `bariatric` | Weight loss surgery |
| 4 | `fertility` | Infertility treatment (IVF, IUI, etc.) |
| 5 | `dental_adult` | Adult dental services |
| 6 | `vision_adult` | Adult vision services |
| 7 | `chiropractic` | Chiropractic services |
| 8 | `acupuncture` | Acupuncture |
| 9 | `out_of_country` | Out-of-country coverage |
| 10 | `weight_loss` | Weight loss programs (non-surgical) |
| 11 | `hearing_aids` | Hearing aids and exams |
| 12 | `dme_limits` | Durable medical equipment limits |
| 13 | `private_nursing` | Private-duty nursing |
| 14 | `custodial_care` | Long-term / custodial care |
| 15 | `dental_implants` | Dental implants |
| 16 | `tmj` | TMJ / jaw disorder treatment |
| 17 | `foot_care` | Routine foot care |
| 18 | `cosmetic_dental` | Cosmetic dental procedures |
| 19 | `non_emergency_transport` | Non-emergency medical transport |
| 20 | `other` | Any exclusion not fitting above |

---

## QA Process

1. Spot-check 50 plans — compare parsed JSON against source PDF
2. Cross-validate deductibles/OOP max against Plan Attributes PUF (should match within $1)
3. Completeness: every parsed SBC must have deductible, OOP max, at least 5 copay fields, at least 1 exclusion
4. Flag anomalies: deductible > OOP max, $0 deductible on non-CSR Silver, OOP max > federal limit

---

## Environment

- **PDF extraction:** `pdfplumber` (primary), `PyMuPDF` (fallback)
- **Claude API:** For intelligent SBC parsing (env var: `ANTHROPIC_API_KEY`)
- **Rate limit:** Max 10 SBC parsing calls per minute
- **Storage:** Raw PDFs in `data/raw/sbc_pdfs/`, parsed JSON in `data/processed/sbc/`
