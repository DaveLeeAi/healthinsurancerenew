import config from '../../data/config.json';

export function getPersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Dave Lee',
    jobTitle: 'Licensed Health Insurance Agent',
    url: config.siteUrl + '/about',
    sameAs: ['https://www.linkedin.com/in/daveleeai/'],
    worksFor: {
      '@type': 'InsuranceAgency',
      name: config.siteName,
      url: config.siteUrl,
    },
    knowsAbout: [
      'Affordable Care Act',
      'Health Insurance Marketplace',
      'ACA Subsidies',
      'Health Insurance Enrollment',
    ],
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'National Producer Number',
      name: 'NPN 7578729',
    },
  };
}

export function getAwardSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: 'CMS Marketplace Circle of Champions 2023',
    description:
      'Recognition awarded by the Centers for Medicare & Medicaid Services (CMS) CCIIO division for outstanding enrollment performance during the 2023 Marketplace Open Enrollment Period.',
    dateCreated: '2023',
    creator: {
      '@type': 'GovernmentOrganization',
      name: 'Centers for Medicare & Medicaid Services',
      alternateName: 'CMS',
    },
    about: {
      '@type': 'Person',
      name: 'Dave Lee',
      jobTitle: 'Licensed Health Insurance Agent',
    },
  };
}
