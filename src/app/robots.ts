// =====================================================
// DYNAMIC ROBOTS.TXT GENERATOR (Next.js App Router)
// Points to the auto-generated sitemap.xml and blocks
// irrelevant paths from crawling (auth, admin, api, etc.)
// =====================================================

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://launchpilot.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/tools',
          '/tools/',
          '/blog',
          '/blog/',
          '/categories',
          '/categories/',
          '/deals',
          '/compare',
          '/pricing',
          '/favorites',
          '/companies',
          '/companies/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/dashboard/',
          '/tools/premium',
          '/tools/dashboard',
          '/favorites',
          '/*/reviews/',   // Review pages are duplicative of tool pages
          '/*/alternatives/', // Alternatives pages are duplicative
          '/*?page=',       // Paginated URLs create thin content duplicates
          '/_next/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}