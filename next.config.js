/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    unoptimized: true,
  },

  // Large dataset builds (150K+ static pages) need extended timeout
  staticPageGenerationTimeout: 300,

  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
