import config from '../../data/config.json';

interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  image?: string;
}

export function getArticleSchema(props: ArticleSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: props.title,
    description: props.description,
    url: props.url.startsWith('http') ? props.url : `${config.siteUrl}${props.url}`,
    datePublished: props.datePublished,
    dateModified: props.dateModified,
    image: props.image || `${config.siteUrl}/og-default.png`,
    author: {
      '@type': 'Organization',
      name: config.siteName,
      url: config.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      url: config.siteUrl,
    },
  };
}
