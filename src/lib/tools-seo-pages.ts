// =====================================================
// SEO PAGE GENERATOR FOR TOOLS, CATEGORIES, AND COMPANIES
// Generates SEO-optimized metadata and structured data
// =====================================================

import { Metadata } from 'next';
import { Tool } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://launchpilot.app';

// Tool interface for knowledge base data (matches tools_master.json)
interface KbTool {
  id: string;
  slug: string;
  name: string;
  title?: string;
  description: string;
  category: string;
  pricing: string;
  has_free_tier: boolean;
  has_api: boolean;
  platforms: string[];
  features: string[];
  website_url: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  slug: string;
  name: string;
  description: string;
  industry: string;
  founded?: number;
  headquarters?: string;
  website?: string;
  tools: string[];
}

/**
 * Generate SEO metadata for a tool page
 */
export function generateToolSeoMetadata(tool: KbTool): Metadata {
  const title = tool.title || `${tool.name} - ${tool.category} AI Tool`;
  const description = tool.description.length > 160 
    ? tool.description.substring(0, 157) + '...' 
    : tool.description;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/tools/${tool.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/tools/${tool.slug}`,
      type: 'website',
      images: tool.website_url ? [{
        url: `https://www.google.com/s2/favicons?domain=${new URL(tool.website_url).hostname}&sz=128`,
        alt: `${tool.name} logo`,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Generate structured data JSON-LD for a tool
 */
export function generateToolJsonLd(tool: KbTool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: tool.category,
    offers: {
      '@type': 'Offer',
      price: tool.pricing === 'free' ? '0' : tool.pricing === 'freemium' ? '0+' : 'Paid',
      priceCurrency: 'USD',
    },
    featureList: tool.features.slice(0, 5),
    operatingSystem: tool.platforms,
    url: tool.website_url,
    datePublished: tool.created_at,
    dateModified: tool.updated_at,
  };
}

/**
 * Generate SEO metadata for a category page
 */
export function generateCategorySeoMetadata(category: { slug: string; name: string; description: string; toolCount?: number }): Metadata {
  const title = `${category.name} AI Tools - LaunchPilot`;
  const description = category.toolCount
    ? `Discover ${category.toolCount}+ ${category.name.toLowerCase()} tools. ${category.description}`
    : `Explore ${category.name.toLowerCase()} AI tools. ${category.description}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/categories/${category.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/categories/${category.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Generate structured data for a category
 */
export function generateCategoryJsonLd(category: { slug: string; name: string; description: string; toolCount?: number }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} AI Tools`,
    description: category.description,
    url: `${BASE_URL}/categories/${category.slug}`,
  };
}

/**
 * Generate SEO metadata for a company page
 */
export function generateCompanySeoMetadata(company: Company): Metadata {
  const title = `${company.name} - AI Tools by ${company.name}`;
  const description = company.description.length > 150 
    ? company.description.substring(0, 147) + '...' 
    : company.description;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/companies/${company.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/companies/${company.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Generate structured data for a company
 */
export function generateCompanyJsonLd(company: Company) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    description: company.description,
    url: company.website,
    foundingDate: company.founded ? company.founded.toString() : undefined,
    address: company.headquarters ? {
      '@type': 'PostalAddress',
      addressLocality: company.headquarters,
    } : undefined,
  };
}

/**
 * Get category slug from category name
 */
export function getCategorySlug(categoryName: string): string {
  return categoryName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get company slug from company data
 */
export function getCompanySlug(companyName: string): string {
  return companyName.toLowerCase().replace(/\s+/g, '-');
}