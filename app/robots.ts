import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/'],
      },
      // Selective disallow for AI crawlers on low-value routes
      // High-value routes (formulary, SBC, state, life events, dental, subsidy, guides) remain ALLOWED
      {
        userAgent: 'GPTBot',
        disallow: ['/faq/category/', '/billing/', '/tools/', '/glossary/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/faq/category/', '/billing/', '/tools/', '/glossary/'],
      },
      {
        userAgent: 'ClaudeBot',
        disallow: ['/faq/category/', '/billing/', '/tools/', '/glossary/'],
      },
    ],
    sitemap: 'https://healthinsurancerenew.com/sitemap.xml',
  }
}
