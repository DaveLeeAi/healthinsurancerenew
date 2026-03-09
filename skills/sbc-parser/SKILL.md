# Skill: SBC Parser

> Parses Summary of Benefits and Coverage (SBC) PDFs into structured JSON data.

---

## SBC Template Structure

Every ACA-compliant health plan must publish an SBC in a **mandated 4-page format** (per 45 CFR 147.200):

| Page | Contents |
|------|----------|
| **Page 1** | Plan header, deductibles, OOP maximums, cost-sharing overview |
| **Page 2** | Common medical events cost-sharing grid (doctor visits, ER, hospital, Rx, etc.) |
| **Page 3** | Two coverage examples — "Having a Baby" and "Managing Type 2 Diabetes" |
| **Page 4** | Excluded services list, other covered services, grievance rights |

---

## Extraction Fields

### Cost-Sharing Grid (from pages 1-2)

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
  "copay_specialty_rx": "30% after deductible",
  "coinsurance_hospital_inpatient": "20% after deductible",
  "coinsurance_outpatient_surgery": "20% after deductible",
  "coinsurance_imaging": "20% after deductible",
  "coinsurance_mental_health_outpatient": 30,
  "coinsurance_mental_health_inpatient": "20% after deductible",
  "preventive_care": "No charge (in-network)",
  "maternity_prenatal": 30,
  "maternity_delivery": "20% after deductible"
}
```

### Coverage Examples (from page 3)

```json
{
  "coverage_example_baby": {
    "total_cost": 12700,
    "plan_pays": 9400,
    "you_pay": 3300,
    "deductible_applied": 3000,
    "copays": 200,
    "coinsurance": 100,
    "not_covered_limit": 0
  },
  "coverage_example_diabetes": {
    "total_cost": 5600,
    "plan_pays": 3500,
    "you_pay": 2100,
    "deductible_applied": 2000,
    "copays": 100,
    "coinsurance": 0,
    "not_covered_limit": 0
  }
}
```

### Exclusions (from page 4)

```json
{
  "exclusions": [
    "cosmetic_surgery",
    "bariatric_surgery",
    "infertility_treatment",
    "dental_adult",
    "vision_adult",
    "hearing_aids",
    "private_nursing",
    "non_emergency_transport"
  ]
}
```

---

## 20-Category Exclusion Taxonomy

Every SBC exclusion maps to one of these canonical categories:

| # | Category Key | Description |
|---|-------------|-------------|
| 1 | `cosmetic` | Cosmetic surgery and procedures |
| 2 | `experimental` | Experimental or investigational treatments |
| 3 | `bariatric` | Weight loss surgery (bariatric) |
| 4 | `fertility` | Infertility treatment (IVF, IUI, etc.) |
| 5 | `dental_adult` | Adult dental services (beyond ACA pediatric) |
| 6 | `vision_adult` | Adult vision services (beyond ACA pediatric) |
| 7 | `chiropractic` | Chiropractic services (or limited visits) |
| 8 | `acupuncture` | Acupuncture |
| 9 | `out_of_country` | Out-of-country / international coverage |
| 10 | `weight_loss` | Weight loss programs (non-surgical) |
| 11 | `hearing_aids` | Hearing aids and exams |
| 12 | `dme_limits` | Durable medical equipment limits |
| 13 | `private_nursing` | Private-duty nursing |
| 14 | `custodial_care` | Long-term / custodial care |
| 15 | `dental_implants` | Dental implants specifically |
| 16 | `tmj` | TMJ / jaw disorder treatment |
| 17 | `foot_care` | Routine foot care |
| 18 | `cosmetic_dental` | Cosmetic dental procedures |
| 19 | `non_emergency_transport` | Non-emergency medical transport |
| 20 | `other` | Any exclusion not fitting above categories |

---

## Claim Trigger Keywords

Extract these triggers whenever they appear in the SBC:

| Trigger | Keywords to Match |
|---------|-------------------|
| `preauthorization` | "preauthorization", "prior authorization", "pre-authorization", "advance approval" |
| `referral_required` | "referral required", "referral needed", "PCP referral" |
| `step_therapy` | "step therapy", "fail first", "try first" |
| `quantity_limit` | "quantity limit", "supply limit", "dispensing limit" |
| `waiting_period` | "waiting period", "elimination period" |
| `medical_necessity` | "medically necessary", "medical necessity determination" |
| `network_restriction` | "in-network only", "no out-of-network", "network restriction" |

---

## Claude API Parsing Prompt

Use Claude API to extract structured data from SBC PDFs:

```python
SYSTEM_PROMPT = """You are an expert health insurance analyst extracting structured data
from Summary of Benefits and Coverage (SBC) documents. Extract data precisely as it
appears in the document. Use null for any field not found. Never guess or infer values
that aren't explicitly stated."""

EXTRACTION_PROMPT = """Extract the following from this SBC document:

1. COST SHARING:
   - Individual deductible (in-network)
   - Family deductible (in-network)
   - Individual OOP maximum (in-network)
   - Family OOP maximum (in-network)
   - Copay/coinsurance for: primary care, specialist, ER, urgent care, hospital inpatient,
     outpatient surgery, generic Rx, preferred brand Rx, specialty Rx, mental health outpatient,
     mental health inpatient, imaging, preventive care, maternity

2. COVERAGE EXAMPLES:
   - Having a Baby: total cost, plan pays, you pay
   - Managing Type 2 Diabetes: total cost, plan pays, you pay

3. EXCLUSIONS:
   - List every excluded service mentioned
   - Map each to the closest category from: cosmetic, experimental, bariatric, fertility,
     dental_adult, vision_adult, chiropractic, acupuncture, out_of_country, weight_loss,
     hearing_aids, dme_limits, private_nursing, custodial_care, dental_implants, tmj,
     foot_care, cosmetic_dental, non_emergency_transport, other

4. TRIGGERS:
   - For each service, note if it requires: preauthorization, referral, step therapy,
     quantity limit, waiting period, or medical necessity review

Return as valid JSON matching the schema provided."""
```

---

## Dental SBC Parsing

Dental SBCs (Stand-Alone Dental Plans) have additional fields:

```json
{
  "plan_id": "12345VA0080001",
  "plan_type": "SADP",
  "waiting_periods": {
    "preventive": 0,
    "basic": 6,
    "major": 12,
    "orthodontia": 12
  },
  "coverage_percentages": {
    "preventive": 100,
    "basic": 80,
    "major": 50,
    "orthodontia": 50
  },
  "annual_maximum": 1500,
  "orthodontia_lifetime_max": 1500,
  "deductible_individual": 50,
  "deductible_family": 150
}
```

Waiting period values are in **months**. Coverage percentages represent what the **plan pays** (not patient responsibility).

---

## QA Process

After parsing a batch of SBCs:

1. **Spot-check 50 plans** — manually compare parsed JSON against source PDF
2. **Cross-validate** — check parsed deductibles/OOP max against Plan Attributes PUF values (should match within $1)
3. **Completeness check** — every parsed SBC must have: deductible, OOP max, at least 5 copay fields, at least 1 exclusion
4. **Flag anomalies** — deductible > OOP max, $0 deductible on non-CSR Silver, negative values, OOP max > federal limit ($9,200 individual / $18,400 family for 2025)

---

## Environment

- **PDF extraction library:** `pdfplumber` (primary), `PyMuPDF` (fallback)
- **Claude API:** Required for intelligent SBC parsing (env var: `ANTHROPIC_API_KEY`)
- **Rate limit:** Max 10 SBC parsing calls per minute to Claude API
- **Storage:** Raw PDFs in `data/raw/sbc_pdfs/`, parsed JSON in `data/processed/sbc/`
