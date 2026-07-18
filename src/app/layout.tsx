import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'LaunchPilot - Discover the Best AI Tools for Your Workflow',
    template: '%s | LaunchPilot',
  },
  description: 'Comprehensive AI tools directory with reviews, alternatives, and comparisons. Find the best AI solutions for your workflow.',
  keywords: ['AI tools', 'artificial intelligence', 'ChatGPT', 'Claude', 'AI image generation', 'AI writing', 'AI coding'],
  authors: [{ name: 'LaunchPilot' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://launchpilot.ai',
    siteName: 'LaunchPilot',
    title: 'LaunchPilot - Discover the Best AI Tools',
    description: 'Comprehensive AI tools directory with reviews, alternatives, and comparisons.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LaunchPilot - Discover the Best AI Tools',
    description: 'Comprehensive AI tools directory with reviews, alternatives, and comparisons.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-secondary-50 font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
