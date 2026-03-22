---
name: post-deploy-audit
description: Post-deployment audit, monitoring, and optimization for HealthInsuranceRenew. Use this skill after deploying to production or staging â covers crawl infrastructure, indexation quality, template quality, internal linking, conversion readiness, and prioritization. Trigger when user mentions deploy, launch, go live, production audit, crawl audit, sitemap check, indexing issues, post-launch, or site quality review. Also trigger for GSC analysis, thin content audits, or scaling readiness checks.
---

# Skill: Post-Deploy Audit & Orchestration

> Senior technical SEO + product + QA orchestrator for a live YMYL site.
> Not a rebuild â a production optimization pass.

## FIRST STEP

Read CLAUDE.md and DESIGN.md before starting any audit.
This skill assumes the V19 template standard is already applied.

---

## Mode

You are in **post-deploy production optimization mode**.
Do NOT rebuild from scratch. Do NOT flatten the consumer-first tone.
Do NOT remove trust/proof layers. Do NOT destroy V19 structure.

Preserve the strongest page pattern:
- Answer-first, consumer-readable, proof-aware
- Strong summary + cost section + plan rules in plain English
- Balanced CTA placement, trust without compliance-overload

---

## Audit Phases (run in order)

### Phase 1 â Technical Crawl & Render

```bash
# 1. Sitemap check
curl -s https://healthinsurancerenew.com/sitemap.xml | head -50
# Verify: index exists, child sitemaps load, no redirect URLs,
# no noindex URLs, canonicals match sitemap entries

# 2. Robots.txt
curl -s https://healthinsurancerenew.com/robots.txt
# Verify: sitemap declared, no accidental disallow on public pages

# 3. Response check (sample 5 key URLs)
for url in \
  "/formulary/north-carolina/ozempic" \
  "/formulary/texas/metformin" \
  "/mississippi/hinds-county" \
  "/subsidies/florida/miami-dade-county" \
  "/guides/how-deductibles-affect-drug-costs"; do
  echo "=== $url ==="
  curl -sI "https://healthinsurancerenew.com$url" | grep -E "HTTP|canonical|robots|x-"
done

# 4. ISR fallback test â hit a non-prebuilt URL
curl -s "https://healthinsurancerenew.com/formulary/alaska/atorvastatin" | head -20
# Verify: full HTML, not empty shell

# 5. Canonical logic
grep -r "canonical" app/ --include="*.tsx" -l
# Verify: self-canonicals, no competing variants
```

Report: status codes, missing metadata, render issues, canonical conflicts.

### Phase 2 â Indexation Quality

Check for near-duplicate risk across page groups:

```bash
# FAQ repetition â are FAQ answers identical across state/drug combos?
# Title pattern â are titles too formulaic?
# Ways to save â is savings copy identical on every page?
# Timeline â is PA timeline copy identical everywhere?
```

Flag: too-similar titles, identical FAQ blocks, identical savings copy.
Score: how many URLs affected, how identical the text is.

### Phase 3 â Internal Linking & Discovery

Check whether long-tail pages have crawl paths beyond sitemaps:

- Hub pages that link to formulary
- Related drug links on formulary pages
- State hub â formulary links
- County â formulary links

Evaluate: Are 225K formulary pages reachable via internal links,
or do they depend entirely on sitemaps?

### Phase 4 â Template Quality (sample audit)

Load 3 representative pages and check against DESIGN.md Section 11:

```
Sample pages:
1. High-data: /formulary/north-carolina/ozempic (47+ plans)
2. Low-data: /formulary/alaska/metformin (1-3 plans)
3. Edge case: /formulary/california/ozempic (SBM, limited data)
```

For each, run the full YMYL checklist from DESIGN.md Section 11.
Check for tier contradictions across evidence/FAQ/cost/insurer table.

### Phase 5 â Priority Scoring

Categorize URL groups:

| Bucket | Criteria | Action |
|--------|----------|--------|
| 1. Must strengthen + pre-render | High demand, high value | Optimize, add to generateStaticParams |
| 2. Keep indexed, improve later | Solid template, moderate demand | Monitor, batch improve |
| 3. Discoverable but not priority | Low demand, thin data | Keep in sitemap, don't over-invest |
| 4. Consider noindex/consolidate | <3 plans, no unique value | Evaluate case-by-case |

### Phase 6 â Deliverables

Produce:
1. **Executive summary** â strong/risky/urgent
2. **Critical issues** â deploy blockers only
3. **High-impact improvements** â ranked by discovery/trust/conversion effect
4. **Template verdict** â production-ready / needs polish / too repetitive
5. **File-level action plan** â specific files and changes
6. **Implementation order** â fix sequence

---

## Special Focus Areas

1. Are redirect helper routes in XML sitemaps?
2. Multiple route patterns competing for same intent?
3. Long-tail pages internally linked from hubs?
4. Summary blocks useful enough to justify indexing at scale?
5. Titles too formulaic?
6. Cost sections decision-oriented or just reference?
7. FAQ answers too repetitive across thousands of pages?
8. "Ways to save" blocks too generic?
9. Bottom trust area too crowded?
10. Weak URL groups over-promoted in sitemaps?

---

## Guardrails

NEVER:
- Remove trust/proof layers
- Make content colder for "authority"
- Generic E-E-A-T theater
- Assume sitemap = indexed
- Assume ISR = bad
- Massive rewrites without proving the pattern problem
- Noindex important pages casually (YMYL â coverage breadth matters)

ALWAYS:
- Distinguish discovery from indexing
- Distinguish architecture from content problems
- Distinguish real risks from polish
- Keep recommendations scalable
- Ground in actual repo files, not theory
- Be specific â no "improve SEO" generics
