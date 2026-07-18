import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LaunchPilot - AI Tools Directory',
    short_name: 'LaunchPilot',
    description: 'Discover the best AI tools for your workflow',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#3b82f6',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
