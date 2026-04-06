import type { Metadata } from 'next';
import {
  SITE_URL,
  AGENCY_NAME,
  getWebPageSchema,
  schemaToJsonLd,
} from '@/lib/schema';
import {
  TrustBar,
  BLUFBox,
  CMSDisclaimer,
  SectionHeading,
  AuthorBioBox,
  DataSourceAttribution,
} from '@/components/trust';

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Our Methodology — How We Source and Verify Health Insurance Data',
  description:
    'How HealthInsuranceRenew.com sources, verifies, and maintains data across 10 ACA data pillars. All information is drawn from CMS, HHS, and state insurance departments and reviewed by a licensed agent.',
  alternates: {
    canonical: `${SITE_URL}
  openGraph: {
    title: 'Our Methodology — How We Source and Verify Health Insurance Data',
    description:
      'How HealthInsuranceRenew.com sources, verifies, and maintains data across 10 ACA data pillars. All information is drawn from CMS, HHS, and state insurance departments and reviewed by a licensed agent.',
    url: '${SITE_URL}/about/methodology/',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Our Methodology — How We Source and Verify Health Insurance Data',
    description:
      'How HealthInsuranceRenew.com sources, verifies, and maintains data across 10 ACA data pillars. All information is drawn from CMS, HHS, and state insurance departments and reviewed by a licensed agent.',
  },/about/methodology/`,
  },
};

// ─── Schema ──────────────────────────────────────────────────────────────────

const pageSchema = getWebPageSchema({
  url: `${SITE_URL}/about/methodology/`,
  name: 'Our Methodology',
  description:
    'How HealthInsuranceRenew.com sources, verifies, and maintains health insurance data across 10 ACA data pillars.',
  datePublished: '2026-03-29T00:00:00-04:00',
  dateModified: '2026-03-29T00:00:00-04:00',
  breadcrumbs: [
    { name: 'Home', url: SITE_URL },
    { name: 'About', url: `${SITE_URL}/about/` },
    { name: 'Methodology', url: `${SITE_URL}/about/methodology/` },
  ],
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MethodologyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToJsonLd(pageSchema) }}
      />

      <article className="mx-auto max-w-[720px] px-4 py-10">
        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-6">
          <a href="/" className="hover:text-blue-700 hover:underline">
            Home
          </a>
          <span className="mx-1.5" aria-hidden="true">
            ›
          </span>
          <a href="/about/" className="hover:text-blue-700 hover:underline">
            About
          </a>
          <span className="mx-1.5" aria-hidden="true">
            ›
          </span>
          <span className="text-gray-900 font-medium">Methodology</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          Our Methodology
        </h1>

        <TrustBar lastUpdated="March 29, 2026" lastUpdatedIso="2026-03-29" />

        <BLUFBox>
          Every data point on HealthInsuranceRenew.com is sourced from official
          government records — primarily CMS federal plan data, HHS policy
          analyses, and state insurance department databases. All content is
          verified by a licensed ACA agent before publication and reviewed at
          least once per plan year or when regulations change.
        </BLUFBox>

        {/* ── Why methodology matters ── */}
        <p className="text-gray-700 leading-relaxed mb-4">
          Health insurance information directly affects financial decisions. A
          single inaccurate cost figure or outdated eligibility rule could lead
          a consumer to choose the wrong plan or miss out on subsidies worth
          thousands of dollars. That is why we document exactly where our data
          comes from, how we verify it, and how often we update it.
        </p>

        {/* ── Primary data sources ── */}
        <SectionHeading>Primary data sources</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          We draw from five categories of government and institutional data
          sources. Each source feeds specific content areas on the site.
        </p>

        <SectionHeading level={3}>
          CMS plan benefit and rate data
        </SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          The Centers for Medicare &amp; Medicaid Services publishes detailed
          plan benefit data for every qualified health plan (QHP) sold on the
          Health Insurance Marketplace. This includes premiums by age and
          rating area, deductibles, copayments, coinsurance rates, out-of-pocket
          maximums, covered benefits, formulary drug lists, and network
          composition. We use these filings as the primary source for our plan
          comparison pages, formulary lookups, and cost transparency tools.
        </p>

        <SectionHeading level={3}>
          HHS and ASPE policy analyses
        </SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          The Department of Health and Human Services and its Office of the
          Assistant Secretary for Planning and Evaluation (ASPE) publish
          enrollment reports, premium trend analyses, and policy impact studies.
          We reference these for subsidy eligibility thresholds, federal poverty
          level guidelines, and enrollment statistics cited in our guides.
        </p>

        <SectionHeading level={3}>
          State insurance department filings
        </SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          Each state&rsquo;s Department of Insurance approves rate filings and
          carrier participation for its marketplace. We consult these filings
          for state-specific carrier availability, approved premium rates, and
          network adequacy data. For state-based exchange (SBE) states, we also
          reference the state exchange&rsquo;s published plan data.
        </p>

        <SectionHeading level={3}>
          IRS premium tax credit rules
        </SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          Subsidy calculations use IRS-published rules for the premium tax
          credit, including applicable percentage tables, household income
          thresholds, and the second-lowest-cost Silver plan benchmark. We
          update our subsidy calculators when the IRS releases new applicable
          percentage tables each plan year.
        </p>

        <SectionHeading level={3}>
          Independent research institutions
        </SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          We reference peer-reviewed research and policy analyses from KFF
          (Kaiser Family Foundation), the Commonwealth Fund, and academic
          institutions for contextual analysis, trend data, and consumer survey
          findings. These sources are always cited with publication dates and
          direct links.
        </p>

        {/* ── How we build each content type ── */}
        <SectionHeading>
          How we build content across 10 data pillars
        </SectionHeading>

        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Plan intelligence pages</strong> are generated from CMS plan
          benefit data files, filtered by state and county. Each page displays
          only plans available in the consumer&rsquo;s rating area. Premium
          figures reflect filed rates before subsidies; estimated after-subsidy
          costs use the applicable APTC formula.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Subsidy estimation tools</strong> implement the IRS premium
          tax credit formula using current-year applicable percentage tables and
          the consumer&rsquo;s county-level benchmark Silver plan premium. All
          outputs are labeled &ldquo;estimated&rdquo; with a note that actual
          amounts may differ based on final tax filing.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Formulary pages</strong> are built from plan-level formulary
          files published by carriers as part of their CMS QHP submissions.
          Each drug lookup shows tier placement, quantity limits, prior
          authorization requirements, and step therapy protocols. Cost
          estimates are derived from the plan&rsquo;s published cost-sharing
          schedule for that tier.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>State hub pages</strong> combine CMS enrollment data,
          carrier participation lists, average premium ranges, and
          state-specific policy context (expansion status, SBE vs FFM, state
          supplemental subsidies) into comprehensive guides. Each state page
          is reviewed for accuracy against current-year data before publication.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Consumer guides</strong> synthesize regulatory guidance, plan
          data, and enrollment experience into plain-language explanations.
          Every factual claim cites a specific source. Cost figures use language
          like &ldquo;estimated&rdquo; or &ldquo;may qualify for&rdquo; — never
          &ldquo;will get&rdquo; or &ldquo;guaranteed.&rdquo;
        </p>

        {/* ── Verification process ── */}
        <SectionHeading>Verification process</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          Every page undergoes a five-step verification process before
          publication:
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 1: Source verification.</strong> All data points are
          traced to their original government source. If a figure cannot be
          verified against an official record, it is not published.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 2: Currency check.</strong> Every data point is checked
          against the most recent available filing. Plan year, effective dates,
          and regulatory changes are confirmed current.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 3: Licensed agent review.</strong> A licensed ACA health
          insurance agent reviews the content for accuracy, regulatory
          compliance, and practical usefulness based on real enrollment
          experience.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 4: Compliance check.</strong> Content is checked against
          CMS marketing guidelines, including prohibited language, required
          disclaimers, and accuracy standards for plan benefit descriptions.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 5: Readability review.</strong> Consumer-facing content
          is evaluated for reading level (target: grade 6–8) and clarity. Jargon
          is replaced with plain language, and technical terms are defined on
          first use.
        </p>

        {/* ── Update policy ── */}
        <SectionHeading>Update policy</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          Content is refreshed on three triggers: when CMS publishes new plan
          year data (annually, typically in October), when HHS or CMS issues
          rule changes affecting eligibility or benefits (as they occur), and
          during a scheduled review cycle that ensures every page is reviewed
          at least once per plan year. Each update changes the visible
          &ldquo;Last Updated&rdquo; date displayed on the page.
        </p>

        {/* ── Limitations ── */}
        <SectionHeading>Limitations and disclaimers</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          While we strive for accuracy, government data sources occasionally
          contain errors or lag behind regulatory changes. Cost estimates on
          this site are based on published federal plan data and may not
          reflect negotiated rates, manufacturer rebates, or individual
          circumstances. Subsidy estimates are for informational purposes and
          may differ from amounts determined by HealthCare.gov or the IRS.
          This site is not a substitute for professional tax or legal advice.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          If you believe any information on this site is inaccurate, please
          contact us. We investigate all reported errors and publish corrections
          promptly. See our{' '}
          <a
            href="/about/editorial-standards/"
            className="text-blue-700 font-medium hover:underline"
          >
            editorial standards
          </a>{' '}
          for our corrections policy.
        </p>

        <DataSourceAttribution
          sources={[
            {
              name: 'CMS Plan Benefit Data',
              url: 'https://data.cms.gov',
              description: 'QHP plan benefits, formularies, and rate filings',
            },
            {
              name: 'HHS ASPE',
              url: 'https://aspe.hhs.gov',
              description: 'Enrollment reports and policy analyses',
            },
            {
              name: 'IRS.gov',
              url: 'https://www.irs.gov/affordable-care-act',
              description: 'Premium tax credit rules and applicable percentages',
            },
            {
              name: 'KFF',
              url: 'https://www.kff.org',
              description: 'Health policy research and consumer survey data',
            },
            {
              name: 'NAIC',
              url: 'https://content.naic.org/state-insurance-departments',
              description: 'State insurance department directories',
            },
          ]}
        />

        <AuthorBioBox />
        <CMSDisclaimer />
      </article>
    </>
  );
}
