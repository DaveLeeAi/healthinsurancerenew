# CMS PUF Dataset Reference

> Last updated: 2026-03-09
> Most recent plan year available: **PY2026** (data imported Feb 3, 2026)

---

## PY2026 Direct Downloads

All files are ZIP archives containing CSV files.
Base URL: `https://download.cms.gov/marketplace-puf/2026/`

| PUF File | Filename | Our Pillar |
|----------|----------|------------|
| Rate PUF | `rate-puf.zip` | Pillar 1: Plan & Premium Intelligence |
| Plan Attributes PUF | `plan-attributes-puf.zip` | Pillar 1: Plan & Premium Intelligence |
| Benefits & Cost Sharing PUF | `benefits-and-cost-sharing-puf.zip` | Pillar 1 + Pillar 8: Billing Intelligence |
| Machine-Readable URL PUF | `machine-readable-url-puf.zip` | Pillar 6: Formulary Intelligence |
| Service Area PUF | `service-area-puf.zip` | Pillar 1: County-level plan mapping |
| Network PUF | `network-puf.zip` | Pillar 1: Network type data |
| Business Rules PUF | `business-rules-puf.zip` | Pillar 5: Friction & Guidance |
| Transparency in Coverage PUF | `transparency-in-coverage-puf.zip` | Pillar 8: Billing Intelligence |
| Plan ID Crosswalk PUF | `plan-id-crosswalk-puf.zip` | Year-over-year plan tracking |

---

## data.healthcare.gov API Datasets (PY2020-2021)

Useful for year-over-year analysis (Pillar 4: Rate Volatility Tracker).

| Dataset | ID | Year |
|---------|-----|------|
| Rate PUF | `7wqt-7ky9` | PY2021 |
| Plan Attributes PUF | `a2km-i629` | PY2021 |
| BenCS PUF | `86mw-kems` | PY2021 |
| Service Area PUF | `cqrd-buzn` | PY2021 |
| Network PUF | `efch-75vp` | PY2021 |
| Business Rules PUF | `g6ja-xx6f` | PY2021 |
| Quality PUF | `kxde-2cd8` | PY2021 |
| Plan ID Crosswalk PUF | `eh65-eh2p` | PY2021 |
| Rate PUF | `kvau-qy8m` | PY2020 |
| Plan Attributes PUF | `f7eh-7sxu` | PY2020 |
| BenCS PUF | `kq37-29bw` | PY2020 |
| Service Area PUF | `8kxw-8r6g` | PY2020 |

### Utility Datasets
| Dataset | ID | Notes |
|---------|-----|-------|
| US States | `9fpx-2mzv` | State codes + names |
| US Counties | `3nee-n9ij` | County FIPS + names |
| Agent/Broker Registration | `e4rr-zk4i` | Updated daily (2026-03-09) |

---

## Notes

- **SADP (Dental) data:** Not a separate PUF for PY2026. Dental plan data is included in Plan Attributes PUF and BenCS PUF (filter by `DentalOnlyPlan = Yes` or similar field).
- **Rate Review PUF:** Published separately at [cms.gov/CCIIO/Resources/Data-Resources/ratereview](https://www.cms.gov/CCIIO/Resources/Data-Resources/ratereview).
- **QHP Landscape files:** Published separately, may need to check CMS data page.
- **Download pattern for other years:** Replace `2026` in URL → `https://download.cms.gov/marketplace-puf/{YEAR}/rate-puf.zip`
- **File sizes:** Rate PUF is the largest (~2GB unzipped). Plan for streaming downloads.

---

## Fetch Priority Order

1. **Service Area PUF** — smallest, maps counties to plans (foundation)
2. **Plan Attributes PUF** — plan metadata (needed for everything)
3. **Rate PUF** — premium data (core product)
4. **BenCS PUF** — benefits detail (enriches plans)
5. **Machine-Readable URL PUF** — formulary URLs (Pillar 6)
6. **Network PUF** — network types
7. **Business Rules PUF** — enrollment rules
8. **Transparency in Coverage PUF** — pricing data
9. **Plan ID Crosswalk PUF** — year-over-year mapping
