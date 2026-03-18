/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },

  // Large dataset builds (150K+ static pages) need extended timeout
  staticPageGenerationTimeout: 300,

  experimental: {
    serverComponentsExternalPackages: [],
    // Limit to 1 worker to reduce per-worker memory pressure on large datasets
    cpus: 1,
  },

  // ---------------------------------------------------------------------------
  // Permanent 308 redirects for old public URL patterns.
  //
  // Dynamic redirects (FIPS → county slug, state code → state slug) are
  // handled at the page level via permanentRedirect() in:
  //   app/plans/[state]/page.tsx
  //   app/plans/[state]/[county]/page.tsx
  //   app/drugs/[state]/[county]/[drug]/page.tsx
  //   app/plan-details/[plan_id]/[slug]/page.tsx
  //
  // Static redirects below cover the top-level index pages that moved.
  // ---------------------------------------------------------------------------
  async redirects() {
    return [
      // /plans → states index (legacy top-level)
      {
        source: '/plans',
        destination: '/states',
        permanent: true,
      },
      // /drugs/:state → drug hub (legacy state-scoped drug index)
      {
        source: '/drugs/:state',
        destination: '/drugs',
        permanent: true,
      },
      // /plan-details top-level index → states index
      // (individual plan URLs are handled dynamically in app/plan-details/[plan_id]/[slug]/page.tsx)
      {
        source: '/plan-details',
        destination: '/states',
        permanent: true,
      },
      // /states/:state/aca-2026 → /:state/health-insurance-plans (canonical state route)
      {
        source: '/states/:state/aca-2026',
        destination: '/:state/health-insurance-plans',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
