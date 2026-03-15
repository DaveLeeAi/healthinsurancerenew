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
}

module.exports = nextConfig
