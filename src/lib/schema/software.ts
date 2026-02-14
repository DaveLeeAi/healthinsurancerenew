import config from '../../data/config.json';

interface SoftwareSchemaProps {
  name: string;
  description: string;
  url: string;
}

export function getSoftwareApplicationSchema(props: SoftwareSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: props.name,
    description: props.description,
    url: props.url.startsWith('http') ? props.url : `${config.siteUrl}${props.url}`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: config.siteName,
    },
  };
}
