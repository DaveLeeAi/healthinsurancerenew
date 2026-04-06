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
} from '@/components/trust';

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:
    'Editorial Standards — How We Create and Verify Health Insurance Content',
  description:
    'Our editorial standards at HealthInsuranceRenew.com: 7-step content workflow, fact-checking checklist, AI disclosure policy, corrections process, and editorial independence commitment.',
  alternates: {
    canonical: `${SITE_URL}
  openGraph: {
    title: 'Editorial Standards — How We Create and Verify Health Insurance Content',
    description:
      'Our editorial standards at HealthInsuranceRenew.com: 7-step content workflow, fact-checking checklist, AI disclosure policy, corrections process, and editorial independence commitment.',
    url: '${SITE_URL}/about/editorial-standards/',
    type: 'website',
    siteName: 'HealthInsuranceRenew',
  },
  twitter: {
    card: 'summary',
    title: 'Editorial Standards — How We Create and Verify Health Insurance Content',
    description:
      'Our editorial standards at HealthInsuranceRenew.com: 7-step content workflow, fact-checking checklist, AI disclosure policy, corrections process, and editorial independence commitment.',
  },/about/editorial-standards/`,
  },
};

// ─── Schema ──────────────────────────────────────────────────────────────────

const pageSchema = getWebPageSchema({
  url: `${SITE_URL}/about/editorial-standards/`,
  name: 'Editorial Standards',
  description:
    'Editorial standards, content workflow, AI disclosure, and corrections policy for HealthInsuranceRenew.com.',
  datePublished: '2026-03-29T00:00:00-04:00',
  dateModified: '2026-03-29T00:00:00-04:00',
  breadcrumbs: [
    { name: 'Home', url: SITE_URL },
    { name: 'About', url: `${SITE_URL}/about/` },
    {
      name: 'Editorial Standards',
      url: `${SITE_URL}/about/editorial-standards/`,
    },
  ],
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EditorialStandardsPage() {
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
          <span className="text-gray-900 font-medium">
            Editorial Standards
          </span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          Editorial Standards
        </h1>

        <TrustBar lastUpdated="March 29, 2026" lastUpdatedIso="2026-03-29" />

        <BLUFBox>
          Every article on HealthInsuranceRenew.com follows a 7-step editorial
          workflow that includes government source verification, licensed agent
          review, CMS compliance checking, and readability testing. We disclose
          our use of AI tools, maintain editorial independence from carrier
          relationships, and correct errors promptly when identified.
        </BLUFBox>

        {/* ── Our commitment ── */}
        <p className="text-gray-700 leading-relaxed mb-4">
          Health insurance is a YMYL (Your Money or Your Life) topic — the
          information we publish can directly affect a consumer&rsquo;s
          financial well-being and access to healthcare. We take that
          responsibility seriously. These editorial standards govern every piece
          of content on this site, from comprehensive state guides to individual
          drug coverage lookups.
        </p>

        {/* ── 7-Step Workflow ── */}
        <SectionHeading>Our 7-step editorial workflow</SectionHeading>

        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 1: Topic identification and research planning.</strong>{' '}
          Content topics are selected based on consumer search demand, regulatory
          developments, and gaps in available public information. Each piece
          begins with a research plan identifying the specific government data
          sources, regulatory documents, and reference materials needed.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 2: Primary source research.</strong> Content is drafted
          using primary government sources — CMS data files, HHS policy
          documents, IRS guidance, and state insurance department filings. We
          do not rely on secondary sources or other health insurance websites
          for factual claims. When we reference independent research (e.g., KFF
          studies), we cite the original publication directly.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 3: Content drafting.</strong> Articles are written at a
          grade 6–8 reading level using the BLUF (Bottom Line Up Front)
          format — every page opens with a 40–60 word summary answering the
          consumer&rsquo;s core question. Technical terms are defined on first
          use. Cost figures include the word &ldquo;estimated&rdquo; and cite
          their data source.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 4: Fact-checking against source data.</strong> Every
          factual claim is checked against its cited source. Our fact-checking
          checklist verifies that cost figures match CMS federal plan data,
          eligibility rules reflect current HHS guidance, formulary data matches
          published plan formularies, enrollment dates match the current plan
          year calendar, and regulatory references cite the correct CFR section
          or CMS bulletin.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 5: Licensed agent review.</strong> A{' '}
          <a
            href="/about/author/"
            className="text-blue-700 font-medium hover:underline"
          >
            licensed ACA health insurance agent
          </a>{' '}
          reviews the content for accuracy based on real-world enrollment
          experience, practical relevance to consumer decision-making,
          regulatory compliance, and correct use of insurance terminology.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 6: CMS compliance review.</strong> Content is checked
          against CMS marketing compliance standards for agents and brokers.
          This includes verifying required disclaimers are present, confirming
          no prohibited language is used (such as guarantees of specific benefit
          amounts or misleading plan comparisons), and ensuring accurate
          representation of plan benefits.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Step 7: Publication and date stamping.</strong> Approved
          content is published with a visible &ldquo;Last Updated&rdquo; date.
          The publication date is recorded in our content management system for
          audit purposes. Schema markup includes both the original publication
          date and the most recent modification date.
        </p>

        {/* ── AI Disclosure ── */}
        <SectionHeading>How we use AI tools</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          We believe in transparency about our content creation process. We may
          use AI tools to assist with research synthesis, initial content
          drafting, data analysis, and code generation for interactive tools
          like calculators and plan comparison features.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          AI tools are never the final authority on any content. Every piece of
          content — regardless of how it was initially drafted — goes through
          the complete 7-step editorial workflow described above, including
          primary source verification and licensed agent review. No AI-generated
          output is published without human expert review and approval.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          AI is never given an author byline on this site. Content is attributed
          to the licensed agent who reviewed and approved it, because that
          person bears professional responsibility for its accuracy.
        </p>

        {/* ── Fact-checking checklist ── */}
        <SectionHeading>Fact-checking checklist</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          Before any content page is published, it must pass every item on this
          checklist:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6 text-sm text-gray-700 space-y-2">
          <p>
            ✓ Every cost figure cites a specific CMS data source or plan benefit
            filing
          </p>
          <p>
            ✓ Eligibility rules match current-year HHS guidance (including any
            mid-year changes)
          </p>
          <p>
            ✓ Subsidy figures use current IRS applicable percentage tables and
            FPL guidelines
          </p>
          <p>
            ✓ Formulary data matches the plan&rsquo;s most recently published
            formulary file
          </p>
          <p>✓ Enrollment dates reflect the current plan year calendar</p>
          <p>
            ✓ No language promises specific outcomes (&ldquo;may qualify
            for&rdquo; not &ldquo;will receive&rdquo;)
          </p>
          <p>
            ✓ CMS disclaimer is present on every page
          </p>
          <p>
            ✓ Reading level is grade 6–8 as measured by Flesch-Kincaid
          </p>
          <p>
            ✓ All links to government sources are functional and point to
            current pages
          </p>
          <p>
            ✓ Schema markup is valid and matches visible page content
          </p>
        </div>

        {/* ── Corrections policy ── */}
        <SectionHeading>Corrections policy</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          We correct errors promptly. When we identify an inaccuracy — whether
          through our own review, reader feedback, or a change in underlying
          data — we follow this process:
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Factual errors</strong> (incorrect cost figures, wrong
          eligibility rules, outdated dates) are corrected immediately and the
          page&rsquo;s &ldquo;Last Updated&rdquo; date is changed to reflect
          the correction. If the error could have affected a consumer&rsquo;s
          decision, we add a brief correction notice at the top of the page
          noting what was changed and when.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Stale data</strong> (plan year turnover, expired enrollment
          periods, superseded regulations) is updated during our scheduled
          review cycle or sooner if we become aware of the change. Pages
          referencing a prior plan year are either updated with current data
          or clearly labeled with the applicable plan year.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Typographical and clarity errors</strong> are corrected
          without a correction notice unless the typo changed the meaning of
          a factual claim.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          To report an error, contact us at{' '}
          <span className="text-gray-900 font-medium">
            [corrections@healthinsurancerenew.com]
          </span>
          . We review all reports within 48 hours.
        </p>

        {/* ── Editorial independence ── */}
        <SectionHeading>Editorial independence</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          {AGENCY_NAME} is a licensed health insurance agency that may earn
          commissions when consumers enroll in marketplace plans through our
          agency. This is our primary revenue source. We want to be completely
          transparent about this because it matters for trust:
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Commission rates are set by carriers and are the same regardless of
          which plan a consumer chooses. This means we have no financial
          incentive to recommend one plan over another within the same carrier,
          or to steer consumers toward higher-premium plans. Our editorial
          content — guides, comparisons, and educational articles — is produced
          independently of any carrier relationship. No carrier pays for
          content placement, reviews its content before publication, or
          influences our recommendations.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Informational pages that do not involve enrollment (educational
          guides, regulatory explainers, glossary pages) may display
          advertising from third-party ad networks. Advertising does not
          influence editorial content and is clearly distinguished from
          editorial material.
        </p>

        {/* ── Content standards ── */}
        <SectionHeading>Content language standards</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-4">
          All consumer-facing content on this site follows these language rules,
          drawn from both CMS marketing compliance standards and our own
          editorial policy:
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          We always use &ldquo;may qualify for&rdquo; instead of &ldquo;will
          get&rdquo; when discussing subsidies or eligibility. We always precede
          calculated figures with &ldquo;estimated.&rdquo; We always spell out
          &ldquo;prior authorization&rdquo; in full — never abbreviated. We
          never use &ldquo;per fill&rdquo; or &ldquo;per pen&rdquo; language
          for drug costs. We present one consolidated disclaimer per cost block
          rather than cluttering individual figures. We write at a grade 6–8
          reading level and define technical terms on first use.
        </p>

        {/* ── Related pages ── */}
        <SectionHeading>Related</SectionHeading>
        <p className="text-gray-700 leading-relaxed mb-2">
          <a
            href="/about/methodology/"
            className="text-blue-700 font-medium hover:underline"
          >
            Our methodology
          </a>{' '}
          — Detailed breakdown of data sources across all 10 content pillars.
        </p>
        <p className="text-gray-700 leading-relaxed mb-2">
          <a
            href="/about/author/"
            className="text-blue-700 font-medium hover:underline"
          >
            Author credentials
          </a>{' '}
          — Licensing, certifications, and professional background of our
          reviewing agent.
        </p>

        <AuthorBioBox />
        <CMSDisclaimer />
      </article>
    </>
  );
}
