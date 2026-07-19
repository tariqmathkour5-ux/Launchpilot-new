/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'images.pexels.com' },
      { hostname: '*.supabase.co' },
    ],
  },
  experimental: {
    mdxRs: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Sentry configuration
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: 'launchpilot',
    project: 'launchpilot-web',
    
    // Source maps configuration
    sourcemaps: {
      disable: process.env.NODE_ENV === 'development',
      remotePrefix: '/_next/static',
    },
    
    // Hide sentry integration errors in development
    widenClientFileUpload: true,
    
    // Enable automatic instrumentation for better performance
    automaticVercelMonitors: true,
  },
  {
    // Hide webpack output
    hideSourceMaps: true,
    
    // Enable React Strict Mode
    strictMode: true,
  }
);