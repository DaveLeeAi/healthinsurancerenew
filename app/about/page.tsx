import type { Metadata } from 'next';
import {
  SITE_URL,
  AGENCY_NAME,
  getWebPageSchema,
  schemaToJsonLd,
} from '@/lib/schema';
import {
  BLUFBox,
  CMSDisclaimer,
  SectionHeading,
} from '@/components/trust';

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `About ${AGENCY_NAME} — Licensed ACA Health Insurance Guide`,
  description:
    'HealthInsuranceRenew is operated by a licensed ACA agent with CMS Elite Circle of Champions recognition. Our mission, data sources, and editorial standards.',
  alternates: {
    canonical: `${SITE_URL}/about/`,
  },
  openGraph: {
    title: `About ${AGENCY_NAME} — Licensed ACA Health Insurance Guide`,
    description:
      'HealthInsuranceRenew is operated by a licensed ACA agent with CMS Elite Circle of Champions recognition. Our mission, data sources, and editorial standards.',
    url: `${SITE_URL}/about/`,
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary' as const,
    title: `About ${AGENCY_NAME} — Licensed ACA Health Insurance Guide`,
    description:
      'HealthInsuranceRenew is operated by a licensed ACA agent with CMS Elite Circle of Champions recognition. Our mission, data sources, and editorial standards.',
  },
};

// ─── Schema ──────────────────────────────────────────────────────────────────

const pageSchema = getWebPageSchema({
  url: `${SITE_URL}/about/`,
  name: `About ${AGENCY_NAME}`,
  description:
    'HealthInsuranceRenew is operated by a licensed ACA agent with CMS Elite Circle of Champions recognition. Our mission, data sources, and editorial standards.',
  datePublished: '2026-03-29T00:00:00-04:00',
  dateModified: '2026-03-29T00:00:00-04:00',
  breadcrumbs: [
    { name: 'Home', url: SITE_URL },
    { name: 'About', url: `${SITE_URL}/about/` },
  ],
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AboutPage() {
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
          <span className="text-gray-900 font-medium">About</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-6">
          About HealthInsuranceRenew.com
        </h1>

        <BLUFBox>
          HealthInsuranceRenew.com is an independent health insurance guide
          operated by {AGENCY_NAME}, a licensed ACA agency with CMS Elite Circle
          of Champions recognition. We help consumers compare marketplace plans,
          estimate premium tax credits, and understand their coverage options
          using verified data from federal government sources and state insurance departments.
        </BLUFBox>

        {/* ── Mission ── */}
        <SectionHeading>Our mission</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          Health insurance decisions affect your family&rsquo;s finances and
          well-being. Yet the information most people find online is either
          outdated, oversimplified, or buried behind jargon. We built
          HealthInsuranceRenew.com to close that gap.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Every page on this site is reviewed by a licensed ACA health insurance
          agent — not a content writer guessing at policy details. Our data comes
          directly from federal marketplace plan data, state insurance department rate
          databases, and HHS policy analyses. When regulations change, we update
          our content within days, not months.
        </p>

        {/* ── What we cover ── */}
        <SectionHeading>What we cover</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          Our content spans ten core areas of ACA health insurance, each built
          on a distinct data pillar sourced from government records:
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Plan intelligence</strong> — side-by-side comparisons of
          marketplace plans by state, county, and metal tier, drawn from federal
          plan benefit data.{' '}
          <strong>Subsidy estimation</strong> — premium tax credit calculators
          using current federal poverty level guidelines and benchmark plan
          premiums.{' '}
          <strong>Formulary data</strong> — drug coverage lookups across
          marketplace plans, including tier placement, prior authorization
          requirements, and cost estimates from federal plan data.{' '}
          <strong>SBC decoded</strong> — plain-language explanations of Summary
          of Benefits and Coverage documents.{' '}
          <strong>Provider networks</strong> — carrier network mapping by plan
          and region.{' '}
          <strong>Cost transparency</strong> — deductible, copay, and
          coinsurance comparisons across plans.{' '}
          <strong>Eligibility pathways</strong> — Medicaid expansion status,
          special enrollment period qualifying events, and coverage gap
          analysis.{' '}
          <strong>Enrollment guidance</strong> — step-by-step walkthroughs for
          HealthCare.gov and state-based exchange enrollment.{' '}
          <strong>Regulatory updates</strong> — coverage of ACA rule changes,
          subsidy extensions, and state-level policy developments.{' '}
          <strong>Consumer education</strong> — guides on choosing plans,
          understanding bills, and avoiding common enrollment mistakes.
        </p>

        {/* ── Who we are ── */}
        <SectionHeading>Who we are</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          {AGENCY_NAME} is a licensed health insurance agency. Our founder is a
          CMS Elite Circle of Champions member — the highest tier of the
          Marketplace Circle of Champions program, recognizing agents who have
          enrolled 100 or more consumers through the Health Insurance
          Marketplace. He is licensed to sell ACA marketplace plans in more than
          20 states.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <a
            href="/about/author/"
            className="text-blue-700 font-medium hover:underline"
          >
            Read the full author profile →
          </a>
        </p>

        {/* ── How we're different ── */}
        <SectionHeading>How we&rsquo;re different</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          Most health insurance information sites are run by marketing companies
          or content publishers with no insurance license. We are different in
          three ways:
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Licensed expertise.</strong> Every piece of content is reviewed
          by a licensed ACA agent who has personally guided consumers through
          plan selection and enrollment. This is not theoretical knowledge — it
          comes from direct experience answering real enrollment questions.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Government data sources.</strong> Our plan data, cost
          estimates, and eligibility information come from federal government sources, HHS, and state
          insurance departments — not third-party aggregators or outdated
          databases. We cite our sources on every page.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>No advertiser influence.</strong> Our editorial content is
          independent. We may earn commissions when consumers enroll in plans
          through our licensed agency, but this never influences which plans we
          recommend or how we present coverage options. Our{' '}
          <a
            href="/about/editorial-standards/"
            className="text-blue-700 font-medium hover:underline"
          >
            editorial standards
          </a>{' '}
          explain this in detail.
        </p>

        {/* ── Related pages ── */}
        <SectionHeading>Learn more</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-2">
          <a
            href="/about/author/"
            className="text-blue-700 font-medium hover:underline"
          >
            Author credentials
          </a>{' '}
          — Licensing, certifications, and professional background.
        </p>
        <p className="text-gray-700 leading-relaxed mb-2">
          <a
            href="/about/methodology/"
            className="text-blue-700 font-medium hover:underline"
          >
            Our methodology
          </a>{' '}
          — How we source, verify, and maintain data across all ten pillars.
        </p>
        <p className="text-gray-700 leading-relaxed mb-2">
          <a
            href="/about/editorial-standards/"
            className="text-blue-700 font-medium hover:underline"
          >
            Editorial standards
          </a>{' '}
          — Our editorial workflow, fact-checking process, and AI disclosure.
        </p>

        <CMSDisclaimer />
      </article>
    </>
  );
}
