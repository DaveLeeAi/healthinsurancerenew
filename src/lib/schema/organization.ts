import config from '../../data/config.json';

const areaServed = config.licensedStates.map((s) => ({
  '@type': 'State',
  name: s.name,
}));

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'InsuranceAgency'],
    name: config.siteName,
    url: config.siteUrl,
    description: config.siteDescription,
    areaServed,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${config.siteUrl}/contact`,
    },
  };
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName,
    url: config.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${config.siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
