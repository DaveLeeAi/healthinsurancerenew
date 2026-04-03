/**
 * HealthInsuranceRenew.com — Trust & E-E-A-T Components
 *
 * Reusable across all page types. Single-column centered layout (720px max-width).
 * Design follows DESIGN.md V19 law.
 */

// ─── TrustBar ────────────────────────────────────────────────────────────────
// Appears above the fold on every content page.
// Shows: freshness date + credentials + CMS Elite badge

interface TrustBarProps {
  lastUpdated: string; // Display format: "March 29, 2026"
  reviewedBy?: string; // e.g. "Licensed ACA Agent"
  reviewedDate?: string;
}

export function TrustBar({
  lastUpdated,
  reviewedBy = 'Licensed ACA Agent',
  reviewedDate,
}: TrustBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 pb-3 mb-6 text-sm text-gray-600">
      <span className="flex items-center gap-1.5">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <span>
          Updated <time>{lastUpdated}</time>
        </span>
      </span>

      <span className="hidden sm:inline text-gray-300" aria-hidden="true">
        |
      </span>

      <a
        href="/about/author/"
        className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 hover:underline"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.745 3.745 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
          />
        </svg>
        <span>
          Reviewed by{' '}
          <span className="font-medium">{reviewedBy}</span>
          {reviewedDate && (
            <>
              {' '}
              on <time>{reviewedDate}</time>
            </>
          )}
        </span>
      </a>

      <span className="hidden sm:inline text-gray-300" aria-hidden="true">
        |
      </span>

      <span className="flex items-center gap-1.5">
        {/* CMS Elite Circle of Champions badge */}
        <svg
          className="h-4 w-4 text-amber-500"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span className="font-medium text-gray-700">
          CMS Elite Circle of Champions
        </span>
      </span>
    </div>
  );
}

// ─── CMSDisclaimer ───────────────────────────────────────────────────────────
// Required on every page per CMS compliance rules.

interface CMSDisclaimerProps {
  agencyName?: string;
}

export function CMSDisclaimer({
  agencyName = 'Dave Lee Agency',
}: CMSDisclaimerProps) {
  return (
    <p className="text-xs text-gray-500 border-t border-gray-200 pt-4 mt-8">
      This website is operated by {agencyName} and is not the Health Insurance
      Marketplace® website. In offering this website, {agencyName} is required
      to comply with all applicable federal laws, including the standards
      established under 45 CFR §§ 155.220(c) and (d) and standards established
      under 45 CFR § 155.260 to protect the privacy and security of personally
      identifiable information. This website may not display all data on
      qualified health plans being offered in your state through the Health
      Insurance Marketplace® website. To see all available data on qualified
      health plan options in your state, go to the Health Insurance Marketplace®
      website at{' '}
      <a
        href="https://www.healthcare.gov"
        className="text-blue-600 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        HealthCare.gov
      </a>
      .
    </p>
  );
}

// ─── BLUFBox ─────────────────────────────────────────────────────────────────
// Bottom Line Up Front — 40-60 word answer block for AI extraction.

interface BLUFBoxProps {
  children: React.ReactNode;
}

export function BLUFBox({ children }: BLUFBoxProps) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg px-5 py-4 mb-8">
      <p className="text-base leading-relaxed text-gray-800 font-medium">
        {children}
      </p>
    </div>
  );
}

// ─── AuthorBioBox ────────────────────────────────────────────────────────────
// Compact bio box for bottom of every content page.
// Inner pages show "Licensed ACA Agent" — NOT Dave Lee's name.

interface AuthorBioBoxProps {
  showFullName?: boolean; // true only on homepage and /about/author/
}

export function AuthorBioBox({ showFullName = false }: AuthorBioBoxProps) {
  const displayName = showFullName
    ? 'Dave Lee'
    : 'Licensed ACA Agent';

  return (
    <div className="flex gap-4 items-start border border-gray-200 rounded-lg p-5 mt-10 mb-6 bg-gray-50">
      <div className="shrink-0">
        <img
          src="/images/dave-lee-headshot.jpg"
          alt={showFullName ? 'Dave Lee — Licensed ACA Health Insurance Agent' : 'Licensed ACA Agent'}
          width={56}
          height={56}
          className="w-14 h-14 rounded-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">
          <a
            href="/about/author/"
            className="hover:text-blue-700 hover:underline"
          >
            {displayName}
          </a>
        </p>
        <p className="text-sm text-gray-600 mt-0.5">
          CMS Elite Circle of Champions · Licensed in 20+ states
        </p>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          {showFullName
            ? 'Dave Lee is a licensed ACA health insurance agent recognized by the Centers for Medicare & Medicaid Services as an Elite Circle of Champions member for enrolling 100+ consumers through the Health Insurance Marketplace.'
            : 'Written by a licensed ACA health insurance agent and CMS Elite Circle of Champions member with direct experience helping consumers navigate marketplace enrollment.'}
        </p>
      </div>
    </div>
  );
}

// ─── DataSourceAttribution ───────────────────────────────────────────────────
// Inline data source block for transparency.

interface DataSourceAttributionProps {
  sources: Array<{
    name: string;
    url: string;
    description?: string;
  }>;
}

export function DataSourceAttribution({
  sources,
}: DataSourceAttributionProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 mt-6 mb-6">
      <p className="text-sm font-semibold text-gray-700 mb-2">
        Data Sources
      </p>
      <ul className="text-sm text-gray-600 space-y-1.5">
        {sources.map((source) => (
          <li key={source.url} className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 shrink-0" aria-hidden="true">
              ›
            </span>
            <span>
              <a
                href={source.url}
                className="text-blue-600 hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.name}
              </a>
              {source.description && (
                <span className="text-gray-500"> — {source.description}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── SectionHeading ──────────────────────────────────────────────────────────
// Consistent heading style across all pages.

interface SectionHeadingProps {
  level?: 2 | 3;
  children: React.ReactNode;
  id?: string;
}

export function SectionHeading({
  level = 2,
  children,
  id,
}: SectionHeadingProps) {
  const Tag = `h${level}` as 'h2' | 'h3';
  const styles =
    level === 2
      ? 'text-2xl font-bold text-gray-900 mt-10 mb-4'
      : 'text-xl font-semibold text-gray-900 mt-8 mb-3';

  return (
    <Tag id={id} className={styles}>
      {children}
    </Tag>
  );
}
