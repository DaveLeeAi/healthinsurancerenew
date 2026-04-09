/**
 * PlanAuthorityBlock — YMYL authority and data methodology block.
 *
 * Required on every plan detail page.
 * - No personal names
 * - References CMS / Healthcare.gov / CFR regulatory citations
 * - Explains data provenance and limitations
 * - Links to editorial policy
 */

export default function PlanAuthorityBlock({ planYear = 2026 }: { planYear?: number }) {
  return (
    <section
      aria-labelledby="authority-heading"
      className="mb-10 rounded-xl border border-neutral-200 bg-neutral-50 p-5"
    >
      <h2 id="authority-heading" className="text-sm font-semibold text-neutral-700 mb-3">
        About This Information
      </h2>

      <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
        <p>
          <strong>Reviewed by licensed insurance professionals.</strong> Plan benefit and
          cost-sharing data on this page is sourced from federal marketplace data published
          under{' '}
          <a
            href="https://www.cms.gov/marketplace/resources/data/public-use-files"
            className="text-primary-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            CMS Marketplace Resources
          </a>{' '}
          and is subject to the ACA regulatory framework (42 U.S.C. §&nbsp;18021; 45 CFR Part
          156).
        </p>

        <p>
          Cost-sharing information is derived from federal plan benefit documents,
          which carriers are required to submit annually. While federal rules require accurate
          carrier filings, discrepancies between PUF data and the carrier&apos;s actual plan
          documents may exist. The full Evidence of Coverage (EOC) governs your actual benefits —
          PUF data is for comparison purposes only.
        </p>

        <p>
          Premium data is derived from federal marketplace plan data. Amounts shown are full pre-subsidy rates
          and do not reflect Advance Premium Tax Credits (APTC) that may reduce your net monthly
          cost. To estimate your APTC, use the{' '}
          <a
            href="/tools/income-savings-calculator"
            className="text-primary-600 hover:underline"
          >
            subsidy estimator
          </a>{' '}
          on this site, or{' '}
          <a href="/contact" className="text-primary-600 hover:underline">
            contact a licensed agent
          </a>
          {' '}for a personalized quote.
        </p>

        <p className="text-xs text-neutral-400 border-t border-neutral-200 pt-3 mt-3">
          Regulatory references: ACA Section 1302 (essential health benefits); ACA
          Section&nbsp;1311(c) (actuarial value); 45 CFR §&nbsp;147.130 (preventive care); 45 CFR
          §&nbsp;156.122 (formulary exception process); IRS Rev. Proc. 2024-35 (FPL tables and
          applicable percentages, plan year {planYear}).{' '}
          <a href="/about/editorial-standards" className="text-primary-500 hover:underline">
            Editorial policy →
          </a>
          {' · '}
          <a href="/data-methodology" className="text-primary-500 hover:underline">
            Data methodology →
          </a>
        </p>
      </div>
    </section>
  )
}
