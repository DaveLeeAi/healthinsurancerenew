# SERP Validation Research — 2026-04-07

Source: Manus 1.6 Max research agent
Method: Google autocomplete + SERP analysis + weighted priority scoring across 12 query buckets

## Priority Scores

| Query bucket | Score | Decision |
|---|---|---|
| does [plan] cover [drug] | 96 | BUILD NOW |
| [drug] formulary | 88 | BUILD NOW |
| [drug] coverage [state] | 75 | QUEUE |
| [drug] tier | 74 | QUEUE (module only) |
| [drug] coverage | 71 | QUEUE |
| Marketplace plans that cover [drug] | 71 | QUEUE |
| [drug] prior authorization | 71 | QUEUE (module) |
| Obamacare coverage for [drug] | 65 | MODULE ONLY |
| [drug] step therapy | 55 | MODULE ONLY |
| [drug] quantity limits | 55 | MODULE ONLY |
| [drug] copay | 47 | REJECT |
| County + drug | 37 | REJECT |

## Key Findings

1. "does [plan] cover [drug]" is the strongest scalable page class
2. County + drug pages REJECTED — SERP intent unstable
3. Drug copay pages REJECTED — SERP dominated by manufacturer savings cards
4. Minimum answer fields for plan+drug: coverage status, tier, PA, QL, cost range

## Impact
Phase 4 resequenced: SBC first (96), county hubs deprioritized (37).
Phase 5 = plan+drug template (15.2M page tier).
