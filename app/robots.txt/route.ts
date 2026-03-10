export async function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Disallow: /admin/

Sitemap: https://healthinsurancerenew.com/sitemap.xml`

  return new Response(robots, { headers: { 'Content-Type': 'text/plain' } })
}
