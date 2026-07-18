const SITE_NAME = 'LaunchPilot';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface RssBlogPost {
  slug: string;
  title: string;
  excerpt?: string | null;
  description?: string | null;
  publishedAt?: Date | string | null;
  author?: { name?: string | null; email?: string | null } | null;
}

/**
 * Builds an RSS 2.0 XML string for a list of (already published-only)
 * blog posts. Pure function — no Next.js/Prisma imports — so it can be
 * unit-validated on its own without the rest of the app's toolchain.
 */
export function buildBlogRssFeed(posts: RssBlogPost[], siteUrl: string): string {
  const feedUrl = `${siteUrl}/blog/rss.xml`;
  const blogUrl = `${siteUrl}/blog`;
  const lastBuildDate = new Date().toUTCString();

  const items = posts
    .map((post) => {
      const link = `${siteUrl}/blog/${post.slug}`;
      const description = post.excerpt || post.description || '';
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : undefined;

      const authorEmail = post.author?.email;
      const authorName = post.author?.name;
      const author = authorEmail
        ? `${authorEmail}${authorName ? ` (${authorName})` : ''}`
        : authorName || undefined;

      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        description ? `      <description>${escapeXml(description)}</description>` : '',
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : '',
        author ? `      <author>${escapeXml(author)}</author>` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(`${SITE_NAME} Blog`)}</title>`,
    `    <link>${escapeXml(blogUrl)}</link>`,
    `    <description>${escapeXml(`Guides, insights, and updates on AI tools from the ${SITE_NAME} team.`)}</description>`,
    '    <language>en-us</language>',
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
  ]
    .filter(Boolean)
    .join('\n');
}
