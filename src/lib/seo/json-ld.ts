const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://launchpilot.app';

/**
 * Serializes a JSON-LD object for embedding inside a
 * <script type="application/ld+json"> tag via dangerouslySetInnerHTML.
 * Plain JSON.stringify does NOT escape "<", so a value containing the
 * literal text "</script>" (e.g. a post title, category name, or author
 * bio someone entered) can close the script tag early and let whatever
 * follows in the string be parsed as HTML/script by the browser — a real
 * script-injection vector, not a theoretical one, since every JSON-LD
 * value embedded on these pages ultimately comes from user-entered
 * content (post titles, category names, etc.). Escaping "<" to its
 * unicode form neutralizes this while producing byte-identical JSON-LD
 * semantics (JSON parsers treat \u003c and < the same way).
 */
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function breadcrumbJsonLd(items: Array<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.href}`,
    })),
  };
}

export function toolListJsonLd(
  tools: Array<{ slug: string; name: string; description: string; rating?: number | null }>,
  listName: string,
  listUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    url: `${BASE_URL}${listUrl}`,
    numberOfItems: tools.length,
    itemListElement: tools.slice(0, 20).map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.name,
      description: tool.description,
      url: `${BASE_URL}/tools/${tool.slug}`,
    })),
  };
}

export function softwareApplicationJsonLd(tool: {
  name: string; description: string; slug: string; rating?: number | null;
  pricing?: string; website_url?: string;
  reviewCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: `${BASE_URL}/tools/${tool.slug}`,
    sameAs: tool.website_url,
    applicationCategory: 'BusinessApplication',
    ...(tool.rating != null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: tool.rating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: tool.reviewCount || 0,
          },
        }
      : {}),
  };
}

/**
 * Enhanced Offers schema for tool pricing information.
 * Enables price range display in search results (Rich Snippets).
 */
export function offersJsonLd(tool: {
  slug: string;
  pricing: string;
  has_free_tier?: boolean;
}) {
  const offers: unknown[] = [];

  // Free tier offer
  if (tool.has_free_tier || tool.pricing?.toLowerCase() === 'freemium' || tool.pricing?.toLowerCase() === 'free') {
    offers.push({
      '@type': 'Offer',
      name: 'Free Plan',
      price: 0,
      priceCurrency: 'USD',
      category: 'Free',
      url: `${BASE_URL}/tools/${tool.slug}`,
    });
  }

  // Pricing-based offers
  const pricing = tool.pricing?.toLowerCase() || '';
  if (pricing.includes('freemium') || pricing.includes('free')) {
    // Already added free plan
  } else if (pricing.includes('paid') || pricing.includes('premium') || pricing.includes('subscription')) {
    offers.push({
      '@type': 'Offer',
      name: 'Paid Plan',
      priceCurrency: 'USD',
      category: 'Paid',
      url: `${BASE_URL}/tools/${tool.slug}`,
    });
  } else if (pricing.includes('custom')) {
    offers.push({
      '@type': 'Offer',
      name: 'Enterprise Plan',
      priceCurrency: 'USD',
      category: 'Custom',
      url: `${BASE_URL}/tools/${tool.slug}`,
    });
  }

  return offers.length > 0 ? offers : undefined;
}

/**
 * Combined tool JSON-LD with AggregateRating and Offers for rich snippets.
 */
export function enhancedToolJsonLd(tool: {
  name: string;
  description: string;
  slug: string;
  rating?: number | null;
  pricing?: string;
  website_url?: string;
  has_free_tier?: boolean;
  reviewCount?: number;
  relatedLinks?: Array<{ href: string; label: string }>;
}) {
  const offers = offersJsonLd({
    slug: tool.slug,
    pricing: tool.pricing || '',
    has_free_tier: tool.has_free_tier,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: `${BASE_URL}/tools/${tool.slug}`,
    sameAs: tool.website_url,
    applicationCategory: 'BusinessApplication',
    ...(tool.rating != null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: tool.rating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: tool.reviewCount || 0,
          },
        }
      : {}),
    ...(offers ? { offers } : {}),
  };
}

export function faqJsonLd(questions: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}

export function blogPostingJsonLd(post: {
  slug: string;
  title: string;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
}) {
  const publishedIso = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.description || undefined,
    image: post.coverImage || undefined,
    url: `${BASE_URL}/blog/${post.slug}`,
    datePublished: publishedIso,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : publishedIso,
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LaunchPilot',
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.svg`,
  };
}
