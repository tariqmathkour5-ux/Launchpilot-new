import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://launchpilot.app';

export interface ToolMetadataParams {
  title: string;
  description?: string;
  path?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  canonicalUrl?: string;
  category?: string;
  pricing?: string;
  rating?: number | null;
}

export function buildMetadata(params: {
  title: string;
  description?: string;
  path?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  canonicalUrl?: string;
}): Metadata;

export function buildMetadata(params: ToolMetadataParams): Metadata;

export function buildMetadata(params: ToolMetadataParams | {
  title: string;
  description?: string;
  path?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  canonicalUrl?: string;
}): Metadata {
  const { title, description, path, ogImage, ogImageAlt, noindex = false, canonicalUrl, category, pricing, rating } = params as ToolMetadataParams;
  const url = path ? `${BASE_URL}${path}` : BASE_URL;
  const canonical = canonicalUrl || url;

  // Build enhanced title with category and pricing info
  let enhancedTitle = title;
  if (category || pricing) {
    const parts = [title];
    if (pricing || rating) {
      parts.push(`- Rating: ${rating ? `${rating}/5` : 'N/A'}`);
    }
    enhancedTitle = parts.join(' ');
  }

  return {
    title,
    description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: ogImage ? [{ url: ogImage, alt: ogImageAlt || title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/**
 * Build tool-specific metadata optimized for SEO
 * Includes structured data-ready properties
 */
export function buildToolMetadata({
  toolName,
  category,
  description,
  pricing,
  rating,
  slug,
}: {
  toolName: string;
  category: string;
  description: string;
  pricing: string;
  rating?: number | null;
  slug: string;
}): Metadata {
  const baseTitle = `${toolName} - ${category} Tool Review`;
  const ratingText = rating ? ` - Rated ${rating}/5` : '';
  
  return {
    title: baseTitle + ratingText,
    description: `${toolName} is a ${pricing} tool in the ${category} category. ${description}`,
    alternates: {
      canonical: `${BASE_URL}/tools/${slug}`,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: baseTitle,
      description,
      url: `${BASE_URL}/tools/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: baseTitle,
      description,
    },
  };
}
