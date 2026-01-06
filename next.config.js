/** @type {import('next').NextConfig} */
const nextConfig = {
  // Azure Static Web Apps will deploy as a full Next.js app with API routes
  images: {
    unoptimized: true, // Required for Azure Static Web Apps
  },
  serverExternalPackages: ['@googleapis/drive', 'pako'],
  turbopack: {},
}

module.exports = nextConfig
