/**
 * HealthInsuranceRenew.com — JSON-LD Schema Utilities
 *
 * Two-script architecture:
 *   1. Site-wide @graph: WebSite + InsuranceAgency + Person (loaded on every page)
 *   2. Page-level @graph: WebPage/ProfilePage/Article + BreadcrumbList (per page)
 *
 * All entities use canonical URL + fragment identifier for @id cross-referencing.
 * Schema.org v30.0 — uses Certification type for CMS Elite Circle of Champions.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const SITE_URL = 'https://healthinsurancerenew.com';
export const SITE_NAME = 'HealthInsuranceRenew.com';
export const AGENCY_NAME = 'Dave Lee Agency';

// Stable @id references used across every page
export const IDS = {
  website: `${SITE_URL}/#website`,
  organization: `${SITE_URL}/#organization`,
  person: `${SITE_URL}/about/author/#person`,
  logo: `${SITE_URL}/#logo`,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ArticleMeta {
  title: string;
  description: string;
  url: string;
  datePublished: string; // ISO 8601 with timezone
  dateModified: string;
  imageUrl?: string;
  section?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

// ─── Site-Wide @graph (loaded on every page via layout.tsx) ──────────────────

export function getSiteWideSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      getWebSiteSchema(),
      getOrganizationSchema(),
      getPersonSchema(),
    ],
  };
}

// ─── WebSite ─────────────────────────────────────────────────────────────────

function getWebSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': IDS.website,
    url: SITE_URL,
    name: SITE_NAME,
    description:
      'Independent ACA health insurance guide. Compare plans, estimate subsidies, and find coverage — powered by federal marketplace data and reviewed by a licensed agent.',
    publisher: { '@id': IDS.organization },
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ─── Organization (InsuranceAgency) ──────────────────────────────────────────

function getOrganizationSchema() {
  return {
    '@type': 'InsuranceAgency',
    '@id': IDS.organization,
    name: AGENCY_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      '@id': IDS.logo,
      url: `${SITE_URL}/images/logo.png`,
      width: 600,
      height: 60,
    },
    founder: { '@id': IDS.person },
    description:
      'Licensed ACA health insurance agency helping consumers compare marketplace plans, estimate premium tax credits, and enroll in coverage.',
    areaServed: getLicensedStates().map((state) => ({
      '@type': 'AdministrativeArea',
      name: state,
    })),
    sameAs: ['https://www.linkedin.com/in/daveleeai/'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'ACA Health Insurance Enrollment Assistance',
        description:
          'Free help comparing and enrolling in Affordable Care Act marketplace health insurance plans, including subsidy estimation and plan comparison.',
        serviceType: 'Insurance Enrollment',
      },
    },
  };
}

// ─── Person (Author) ─────────────────────────────────────────────────────────

function getPersonSchema() {
  return {
    '@type': 'Person',
    '@id': IDS.person,
    name: 'Dave Lee',
    url: `${SITE_URL}/about/author/`,
    image: `${SITE_URL}/images/dave-lee-headshot-april-2026.png`,
    jobTitle: 'Licensed ACA Health Insurance Agent',
    worksFor: { '@id': IDS.organization },
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Insurance Sales Agent',
      occupationalCategory: '41-3021.00',
      description:
        'Licensed health insurance agent specializing in ACA marketplace plans across 20+ states.',
    },
    hasCredential: [
      // CMS Elite Circle of Champions — uses schema.org v30.0 Certification
      {
        '@type': 'Certification',
        name: 'CMS Elite Circle of Champions',
        issuedBy: {
          '@type': 'GovernmentOrganization',
          name: 'Centers for Medicare & Medicaid Services',
        },
        certificationStatus: 'https://schema.org/CertificationActive',
        description:
          'Highest tier of the CMS Marketplace Circle of Champions program, recognizing agents who have enrolled 100+ consumers through the Health Insurance Marketplace.',
        validFrom: '2024-01-01',
      },
      // State insurance licenses — placeholder pattern, add per-state
      {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'Health Insurance License',
        description: 'Licensed health insurance agent in 20+ states',
        recognizedBy: {
          '@type': 'GovernmentOrganization',
          name: 'State Department of Insurance',
        },
      },
    ],
    knowsAbout: [
      {
        '@type': 'Thing',
        '@id': 'https://www.wikidata.org/wiki/Q245031',
        name: 'Patient Protection and Affordable Care Act',
      },
      {
        '@type': 'Thing',
        '@id': 'https://www.wikidata.org/wiki/Q15062448',
        name: 'Health insurance marketplace',
      },
      {
        '@type': 'Thing',
        name: 'Premium Tax Credits (APTC)',
      },
      {
        '@type': 'Thing',
        name: 'Health Insurance Formularies',
      },
      {
        '@type': 'Thing',
        name: 'Cost-Sharing Reductions (CSR)',
      },
    ],
    sameAs: ['https://www.linkedin.com/in/daveleeai/'],
  };
}

// ─── Page-Level Schema Builders ──────────────────────────────────────────────

/**
 * Generic WebPage schema for informational pages
 */
export function getWebPageSchema(opts: {
  url: string;
  name: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumbs: BreadcrumbItem[];
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${opts.url}/#webpage`,
        url: opts.url,
        name: opts.name,
        description: opts.description,
        isPartOf: { '@id': IDS.website },
        about: { '@id': IDS.organization },
        ...(opts.datePublished && { datePublished: opts.datePublished }),
        ...(opts.dateModified && { dateModified: opts.dateModified }),
        inLanguage: 'en-US',
      },
      getBreadcrumbSchema(opts.breadcrumbs),
    ],
  };
}

/**
 * ProfilePage schema for the author page
 */
export function getProfilePageSchema(opts: {
  url: string;
  name: string;
  description: string;
  datePublished: string;
  dateModified: string;
  breadcrumbs: BreadcrumbItem[];
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${opts.url}/#profilepage`,
        url: opts.url,
        name: opts.name,
        description: opts.description,
        isPartOf: { '@id': IDS.website },
        mainEntity: { '@id': IDS.person },
        datePublished: opts.datePublished,
        dateModified: opts.dateModified,
        inLanguage: 'en-US',
      },
      getBreadcrumbSchema(opts.breadcrumbs),
    ],
  };
}

/**
 * Article schema for guides, state pages, drug pages
 */
export function getArticleSchema(opts: {
  article: ArticleMeta;
  breadcrumbs: BreadcrumbItem[];
  faqs?: FAQItem[];
}) {
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      '@id': `${opts.article.url}/#article`,
      headline: opts.article.title,
      description: opts.article.description,
      url: opts.article.url,
      datePublished: opts.article.datePublished,
      dateModified: opts.article.dateModified,
      author: { '@id': IDS.person },
      publisher: { '@id': IDS.organization },
      isPartOf: { '@id': IDS.website },
      mainEntityOfPage: { '@id': `${opts.article.url}/#webpage` },
      inLanguage: 'en-US',
      ...(opts.article.imageUrl && {
        image: {
          '@type': 'ImageObject',
          url: opts.article.imageUrl,
        },
      }),
      ...(opts.article.section && {
        articleSection: opts.article.section,
      }),
    },
    {
      '@type': 'WebPage',
      '@id': `${opts.article.url}/#webpage`,
      url: opts.article.url,
      name: opts.article.title,
      description: opts.article.description,
      isPartOf: { '@id': IDS.website },
      datePublished: opts.article.datePublished,
      dateModified: opts.article.dateModified,
      inLanguage: 'en-US',
    },
    getBreadcrumbSchema(opts.breadcrumbs),
  ];

  // FAQPage schema if FAQs provided
  if (opts.faqs && opts.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${opts.article.url}/#faq`,
      mainEntity: opts.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

// ─── BreadcrumbList ──────────────────────────────────────────────────────────

function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${items[items.length - 1]?.url || SITE_URL}/#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLicensedStates(): string[] {
  // TODO: Replace with actual licensed states from data
  return [
    'Texas',
    'Florida',
    'Tennessee',
    'Alabama',
    'South Carolina',
    'Mississippi',
    'North Carolina',
    'Ohio',
    'Missouri',
    'Michigan',
    'Arizona',
    'Wisconsin',
    'Indiana',
    'Georgia',
    'Illinois',
    'Virginia',
    'Pennsylvania',
    'New Jersey',
    'Oklahoma',
    'Louisiana',
  ];
}

// ─── Drug Schema ────────────────────────────────────────────────────────────

export interface DrugSchemaOptions {
  name: string;
  genericName: string;
  drugClass: string;
  manufacturer: string;
  administrationRoute: string;
  fdaApprovedIndications: string[];
  prescriptionStatus?: 'PrescriptionOnly';
  url?: string;
  warning?: string;
}

export function generateDrugSchema(opts: DrugSchemaOptions): Record<string, unknown> {
  const normalizedSlug = opts.name.toLowerCase().replace(/\s+/g, '-');
  return {
    '@type': 'Drug',
    '@id': `${SITE_URL}/guides/${normalizedSlug}#drug-${normalizedSlug}`,
    name: opts.name,
    nonProprietaryName: opts.genericName,
    drugClass: { '@type': 'DrugClass', name: opts.drugClass },
    manufacturer: { '@type': 'Organization', name: opts.manufacturer },
    administrationRoute: opts.administrationRoute,
    recognizingAuthority: {
      '@type': 'Organization',
      name: 'U.S. Food and Drug Administration',
      url: 'https://www.fda.gov',
    },
    prescriptionStatus: 'https://schema.org/PrescriptionOnly',
    legalStatus: 'https://schema.org/PrescriptionOnly',
    medicineSystem: 'https://schema.org/WesternConventional',
    ...(opts.url && { url: opts.url }),
    warning:
      opts.warning ??
      'This page provides general information about insurance coverage. It is not medical advice. Consult your healthcare provider and check your specific plan formulary.',
  };
}

// ─── WebApplication Schema ──────────────────────────────────────────────────

export interface WebApplicationSchemaOptions {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: { price: string; priceCurrency: string };
}

export function generateWebApplicationSchema(
  opts: WebApplicationSchemaOptions
): Record<string, unknown> {
  return {
    '@type': 'WebApplication',
    '@id': `${opts.url}#webapp`,
    name: opts.name,
    description: opts.description,
    url: opts.url,
    applicationCategory: opts.applicationCategory ?? 'HealthApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: opts.offers?.price ?? '0',
      priceCurrency: opts.offers?.priceCurrency ?? 'USD',
    },
    provider: { '@type': 'InsuranceAgency', '@id': IDS.organization },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Render a schema object as a <script type="application/ld+json"> string.
 * Use in Next.js metadata or dangerouslySetInnerHTML.
 */
export function schemaToJsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, null, 0);
}
