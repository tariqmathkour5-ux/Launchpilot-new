import { NextResponse } from 'next/server';
import { getPublished } from '@/lib/blog-posts';
import { buildBlogRssFeed } from '@/lib/rss';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const revalidate = 3600; // Revalidate every hour, matching the other public blog pages

export async function GET() {
  // getPublished() filters published: true at the query level, so drafts
  // and scheduled-but-not-yet-live posts never reach the feed.
  const posts = await getPublished();

  const xml = buildBlogRssFeed(posts, baseUrl);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
