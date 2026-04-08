export async function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Disallow: /admin/

# LLM and AI crawlers — explicitly permitted on high-value routes
# Selectively blocked on low-value routes (faq/category, billing, tools, glossary)

User-agent: GPTBot
Allow: /
Disallow: /faq/category/
Disallow: /billing/
Disallow: /tools/
Disallow: /glossary/

User-agent: ChatGPT-User
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: ClaudeBot
Allow: /
Disallow: /faq/category/
Disallow: /billing/
Disallow: /tools/
Disallow: /glossary/

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /
Disallow: /faq/category/
Disallow: /billing/
Disallow: /tools/
Disallow: /glossary/

User-agent: Applebot-Extended
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: meta-externalagent
Allow: /

User-agent: Manus
Allow: /

User-agent: GrokBot
Allow: /

# Sitemap index
Sitemap: https://healthinsurancerenew.com/sitemap.xml

# LLM instructions file
LLM: https://healthinsurancerenew.com/llms.txt`

  return new Response(robots, { headers: { 'Content-Type': 'text/plain' } })
}
