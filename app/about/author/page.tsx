import type { Metadata } from 'next';
import {
  SITE_URL,
  getProfilePageSchema,
  schemaToJsonLd,
} from '@/lib/schema';
import {
  BLUFBox,
  CMSDisclaimer,
  SectionHeading,
} from '@/components/trust';

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:
    'Dave Lee — Licensed ACA Health Insurance Agent | CMS Elite Circle of Champions',
  description:
    'Dave Lee is a licensed ACA health insurance agent with CMS Elite Circle of Champions recognition, licensed in 20+ states. Learn about his credentials, licensing, and experience helping consumers navigate marketplace enrollment.',
  alternates: {
    canonical: `${SITE_URL}/about/author/`,
  },
};

// ─── Schema ──────────────────────────────────────────────────────────────────

const pageSchema = getProfilePageSchema({
  url: `${SITE_URL}/about/author/`,
  name: 'Dave Lee — Licensed ACA Health Insurance Agent',
  description:
    'Author profile for Dave Lee, licensed ACA health insurance agent and CMS Elite Circle of Champions member.',
  datePublished: '2026-03-29T00:00:00-04:00',
  dateModified: '2026-03-29T00:00:00-04:00',
  breadcrumbs: [
    { name: 'Home', url: SITE_URL },
    { name: 'About', url: `${SITE_URL}/about/` },
    { name: 'Author', url: `${SITE_URL}/about/author/` },
  ],
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AuthorPage() {
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
          <span className="text-gray-900 font-medium">Author</span>
        </nav>

        {/* ── Author Header ── */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
          <img
            src="/images/dave-lee-headshot.jpg"
            alt="Dave Lee — Licensed ACA Health Insurance Agent"
            width={112}
            height={112}
            className="shrink-0 w-28 h-28 rounded-xl object-cover border-2 border-blue-200"
          />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Dave Lee
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Licensed ACA Health Insurance Agent
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                CMS Elite Circle of Champions
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                Licensed in 20+ States
              </span>
            </div>
          </div>
        </div>

        <BLUFBox>
          Dave Lee is a licensed ACA health insurance agent recognized by the
          Centers for Medicare &amp; Medicaid Services as an Elite Circle of
          Champions member. He is licensed to sell marketplace health insurance
          plans in more than 20 states and has personally guided hundreds of
          consumers through plan selection, subsidy estimation, and enrollment.
        </BLUFBox>

        {/* ── First-person experience paragraph (within first 100 words) ── */}
        <p className="text-gray-700 leading-relaxed mb-4">
          I started working in health insurance because I watched family members
          struggle to understand their coverage options. The ACA marketplace is
          powerful — it gives millions of Americans access to subsidized
          coverage — but the enrollment process is confusing, plan documents are
          dense, and the stakes are high. A wrong choice can mean thousands of
          dollars in unexpected costs or missing out on subsidies you qualified
          for.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          That direct experience — sitting with real people, walking through
          their household income, explaining what a Silver plan with
          cost-sharing reductions actually means versus a cheaper Bronze plan
          that covers less — is what I bring to every page on this site. I have
          seen the mistakes consumers make, the questions they ask, and the
          moments where the right information changes a financial outcome.
        </p>

        {/* ── Credentials ── */}
        <SectionHeading>Credentials and licensing</SectionHeading>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-gray-900">
                CMS Elite Circle of Champions
              </dt>
              <dd className="text-gray-600 mt-0.5">
                Highest tier of the Marketplace Circle of Champions program,
                awarded by the Centers for Medicare &amp; Medicaid Services to
                agents who have enrolled 100 or more consumers through the
                Health Insurance Marketplace.{' '}
                <a
                  href="https://www.cms.gov/marketplace/agents-brokers/circle-champions"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Verify on CMS.gov →
                </a>
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-gray-900">
                National Producer Number (NPN)
              </dt>
              <dd className="text-gray-600 mt-0.5">
                NPN: 7578729 — Verify on the{' '}
                <a
                  href="https://nipr.com/help/look-up-a-license"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  National Insurance Producer Registry →
                </a>
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-gray-900">
                State health insurance licenses
              </dt>
              <dd className="text-gray-600 mt-0.5">
                Licensed in 20+ states including Texas, Florida, Tennessee,
                Alabama, South Carolina, Mississippi, North Carolina, Ohio,
                Missouri, Michigan, Arizona, Wisconsin, Indiana, Georgia,
                Illinois, Virginia, Pennsylvania, New Jersey, Oklahoma, and
                Louisiana. Each license can be verified through the respective
                state Department of Insurance or through the{' '}
                <a
                  href="https://nipr.com/help/look-up-a-license"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  NIPR license lookup
                </a>
                .
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-gray-900">
                Marketplace registration
              </dt>
              <dd className="text-gray-600 mt-0.5">
                Registered with the Federally-facilitated Marketplace (FFM)
                and certified to assist consumers with enrollment on
                HealthCare.gov.
              </dd>
            </div>
          </dl>
        </div>

        {/* ── Expertise ── */}
        <SectionHeading>Areas of expertise</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          My focus areas include ACA marketplace plan comparison across metal
          tiers, premium tax credit (APTC) estimation and optimization,
          formulary analysis and drug coverage verification, cost-sharing
          reduction strategies for Silver plan enrollees, special enrollment
          period qualification and documentation, and state-by-state marketplace
          navigation for both FFM and state-based exchange states.
        </p>

        {/* ── Editorial role ── */}
        <SectionHeading>My role on this site</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          I review every piece of content published on HealthInsuranceRenew.com
          for accuracy, regulatory compliance, and practical usefulness. My
          review process checks all cost figures against CMS plan benefit
          filings, verifies eligibility rules against current HHS guidance,
          confirms formulary data matches published plan formularies, and
          ensures all consumer-facing language meets CMS marketing compliance
          standards.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          For a detailed description of our editorial workflow, see our{' '}
          <a
            href="/about/editorial-standards/"
            className="text-blue-700 font-medium hover:underline"
          >
            editorial standards
          </a>
          . For information about how we source and verify data, see our{' '}
          <a
            href="/about/methodology/"
            className="text-blue-700 font-medium hover:underline"
          >
            methodology page
          </a>
          .
        </p>

        {/* ── External validation ── */}
        <SectionHeading>Connect and verify</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          {/* TODO: Add real profile links */}
          You can find me on{' '}
          <a
            href="https://www.linkedin.com/in/daveleenow"
            className="text-blue-700 font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          . To verify my licensing status, search my NPN on the{' '}
          <a
            href="https://nipr.com/help/look-up-a-license"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            National Insurance Producer Registry
          </a>{' '}
          or contact your state&rsquo;s Department of Insurance directly.
        </p>

        {/* ── Published content (placeholder for paginated list) ── */}
        <SectionHeading>Published content</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          Below is a selection of guides and articles I have reviewed and
          approved for publication on HealthInsuranceRenew.com. This list is
          updated as new content is published.
        </p>
        <p className="text-sm text-gray-500 italic mb-6">
          Content listing will be populated as articles are published.
        </p>

        <CMSDisclaimer />
      </article>
    </>
  );
}
