# Skill: Content Generator

> Generates programmatic SEO pages from structured ACA datasets. 150,000+ pages across entity types and comparisons.

---

## Content Safety Rules

These are **non-negotiable** on every generated page:

1. **No DIY medical instructions** — never tell users to self-diagnose, self-treat, or skip professional care
2. **No full names/addresses** on public pages — use only carrier names, plan names, and geographic identifiers
3. **All content saves as draft** — never auto-publish; human review required before go-live
4. **Medical disclaimer on every page:**
   > "This information is for educational purposes only and does not constitute medical or insurance advice. Plan details may change. Always verify coverage with your insurance carrier or a licensed agent before making healthcare decisions."
5. **Source citation** — every cost/premium claim must cite "CMS [PUF file name], Plan Year [year]"
6. **Agent CTA** — every page includes: "Need help choosing? Talk to a licensed agent" → lead form

---

## Entity Types (12 Total)

| Entity | Canonical URL Pattern | Example |
|--------|----------------------|---------|
| **Carrier** | `/carriers/{issuer_id}-{slug}` | `/carriers/12345-anthem-blue-cross` |
| **Plan** | `/plans/{plan_id}` | `/plans/12345VA0010001` |
| **County** | `/{state}/{county}-county` | `/virginia/fairfax-county` |
| **State** | `/{state}` | `/virginia` |
| **Exclusion** | `/exclusions/{category}` | `/exclusions/bariatric-surgery` |
| **Trigger** | `/triggers/{trigger-type}` | `/triggers/prior-authorization` |
| **Drug** | `/drugs/{rxnorm_id}-{slug}` | `/drugs/860975-metformin` |
| **Condition** | `/conditions/{slug}` | `/conditions/type-2-diabetes` |
| **Life Event** | `/life-events/{slug}` | `/life-events/turning-26` |
| **Metal Level** | `/metal-levels/{level}` | `/metal-levels/silver` |
| **Deadline** | `/deadlines/{slug}` | `/deadlines/open-enrollment-2026` |
| **Penalty** | `/penalties/{slug}` | `/penalties/no-coverage-tax` |

---

## Entity Page Templates

### County Page (`/{state}/{county}-county`)
```
H1: Health Insurance Plans in {County}, {State} ({Year})
├── Hero: plan count, carrier count, avg premium range
├── Plans Table: sortable by premium, metal level, carrier
├── Subsidy Calculator CTA: "See if you qualify for $0 premiums"
├── Top Carriers in {County}: logos + plan counts
├── Cost Comparison: Bronze vs Silver vs Gold avg premiums
├── FAQ (8+ questions): county-specific
├── Life Events Relevant: turning 26, losing job coverage, etc.
├── Medical Disclaimer
└── Agent CTA + Lead Form
```

### Carrier Page (`/carriers/{issuer_id}-{slug}`)
```
H1: {Carrier Name} Health Insurance Plans ({Year})
├── Carrier Overview: states served, plan count, metal levels offered
├── Plans by State: grouped tables
├── Formulary Highlights: drug tier summary for top 10 drugs
├── Exclusion Profile: what this carrier commonly excludes
├── Coverage Examples: avg "Having a Baby" / "Diabetes" costs
├── FAQ (8+ questions): carrier-specific
├── Compare with Other Carriers CTA
├── Medical Disclaimer
└── Agent CTA + Lead Form
```

### Plan Page (`/plans/{plan_id}`)
```
H1: {Plan Name} — {Metal Level} {Plan Type} ({Year})
├── Plan Summary Card: premium, deductible, OOP max, copays
├── Cost-Sharing Detail: full grid from SBC
├── Coverage Examples: Having a Baby, Managing Diabetes
├── Drug Coverage: tier for top 10 priority drugs
├── Exclusions: with explanations
├── Triggers: prior auth, step therapy, etc.
├── Compare This Plan CTA
├── Similar Plans in Your Area
├── Medical Disclaimer
└── Agent CTA + Lead Form
```

### Exclusion Page (`/exclusions/{category}`)
```
H1: Plans That {Exclude/Cover} {Exclusion Name} ({Year})
├── What This Exclusion Means: plain-language explanation
├── Plans That Exclude This: table with carrier, plan, state
├── Plans That Cover This: table (if any)
├── States With Mandated Coverage: if applicable
├── How to Find Coverage: guidance for this specific exclusion
├── Related Exclusions: links to similar categories
├── FAQ (5+ questions)
├── Medical Disclaimer
└── Agent CTA + Lead Form
```

### Drug Page (`/drugs/{rxnorm_id}-{slug}`)
```
H1: {Drug Name} Coverage by Health Insurance Plan ({Year})
├── Drug Overview: what it treats, generic vs brand, typical cost
├── Coverage by Carrier: tier, prior auth, step therapy, quantity limit
├── Lowest Tier Plans: plans with best coverage for this drug
├── Plans Requiring Prior Auth: list
├── Alternative Drugs: same class, potentially lower tier
├── FAQ (5+ questions)
├── Medical Disclaimer
└── Agent CTA + Lead Form
```

---

## 8 Comparison Page Types

| # | Type | URL Pattern | Example |
|---|------|-------------|---------|
| 1 | **Plan vs Plan** | `/compare/plans/{id1}-vs-{id2}` | Side-by-side cost-sharing, exclusions, drug tiers |
| 2 | **County vs County** | `/compare/{state}/{county1}-vs-{county2}` | Avg premiums, carrier availability, plan count |
| 3 | **Drug Coverage** | `/compare/drug-coverage/{rxnorm_id}` | Which plans cover this drug at each tier |
| 4 | **Scenario-Based** | `/scenarios/{slug}` | "Best plan for a family of 4 with diabetes" |
| 5 | **Year-over-Year** | `/trends/{state}/{year1}-vs-{year2}` | Premium changes, carrier exits/entries |
| 6 | **Metal Level** | `/compare/metal-levels/{state}` | Bronze vs Silver vs Gold cost breakdown |
| 7 | **Dental Comparison** | `/compare/dental/{state}` | SADP waiting periods, maximums, coverage % |
| 8 | **Enhanced Credit Impact** | `/subsidy-impact/{state}/{income}` | What happens when enhanced credits expire |

---

## Schema Markup (JSON-LD)

### Every Page Gets:

**BreadcrumbList:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://healthinsurancerenew.com"},
    {"@type": "ListItem", "position": 2, "name": "{Parent}", "item": "https://healthinsurancerenew.com/{parent}"},
    {"@type": "ListItem", "position": 3, "name": "{Page Title}"}
  ]
}
```

**FAQPage** (on every entity page with FAQ section):
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does health insurance cost in {County}, {State}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In {County}, {State}, individual health insurance premiums range from ${min} to ${max} per month for {Year} plans..."
      }
    }
  ]
}
```

### Dataset Schema (on data-heavy pages):
```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "ACA Health Insurance Plans in {County}, {State} ({Year})",
  "description": "Complete dataset of {count} Affordable Care Act marketplace plans...",
  "url": "https://healthinsurancerenew.com/{path}",
  "license": "https://creativecommons.org/publicdomain/zero/1.0/",
  "creator": {"@type": "Organization", "name": "HealthInsuranceRenew"},
  "dateModified": "{date}",
  "temporalCoverage": "{year}",
  "spatialCoverage": {"@type": "Place", "name": "{County}, {State}"},
  "isBasedOn": {"@type": "Dataset", "name": "CMS Public Use Files", "url": "https://data.healthcare.gov"}
}
```

### MedicalWebPage (on condition/drug pages):
```json
{
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "about": {"@type": "MedicalCondition", "name": "{Condition}"},
  "lastReviewed": "{date}",
  "medicalAudience": {"@type": "MedicalAudience", "audienceType": "Patient"}
}
```

---

## Internal Linking Rules

1. **Entity-to-entity only** — every link connects two entities in the graph (plan→carrier, drug→plan, county→state, etc.)
2. **Bidirectional** — if Plan A links to Carrier B, Carrier B must link back to Plan A
3. **Max 5-7 internal links per page** — quality over quantity
4. **Anchor text** — use descriptive entity names, never "click here" or "read more"
5. **Cross-entity links** — every page links to at least 2 different entity types
6. **Comparison page links** — entity pages link to relevant comparison pages
7. **Hierarchy links** — County → State (parent), Plan → Carrier (parent), Drug → Plan (coverage)

---

## Entity Graph Relationships

```
State ──has──→ County ──has──→ Plan
                                │
Carrier ──offers──→ Plan ──covers──→ Drug
                     │                │
                     ├──excludes──→ Exclusion
                     ├──requires──→ Trigger
                     └──relevant──→ Life Event
                                      │
Condition ──treated_by──→ Drug        │
                                      │
Deadline ──affects──→ Life Event      │
Penalty ──applies_when──→ Life Event ─┘
Metal Level ──categorizes──→ Plan
```

---

## Page Generation Pipeline

```
1. Load processed datasets (plans, carriers, counties, drugs, SBCs)
2. Build entity graph (relationships between all entities)
3. For each entity page:
   a. Query relevant data from processed datasets
   b. Apply page template
   c. Generate FAQ section (templated, data-driven)
   d. Inject schema markup (JSON-LD)
   e. Add internal links (from entity graph)
   f. Add medical disclaimer
   g. Save as draft (never auto-publish)
4. Generate comparison pages from entity pairs
5. Generate sitemap.xml
6. Run QA checks (links valid, schema valid, disclaimer present)
```

---

## Content QA Checklist (per page)

- [ ] Medical disclaimer present
- [ ] Source citation on all cost/premium data
- [ ] FAQ section with 5+ questions
- [ ] Schema markup valid (test via Google Rich Results)
- [ ] Internal links: 5-7, all bidirectional
- [ ] No broken links
- [ ] No PII / personal information
- [ ] Agent CTA present
- [ ] All data from current plan year
- [ ] Mobile-readable layout
