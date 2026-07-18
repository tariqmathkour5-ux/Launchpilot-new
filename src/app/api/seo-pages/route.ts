import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function isAdmin(userId: string) {
  const rows = await prisma.$queryRaw<Array<{ role: string }>>`SELECT role FROM "User" WHERE id = ${userId}`;
  return rows[0]?.role === 'ADMIN';
}

export async function GET() {
  const [pages, tags, indexSettings, viewStats, pageTypeStats] = await Promise.all([
    prisma.$queryRaw<Array<{
      id: string; slug: string; title: string; heading: string | null;
      page_type: string; is_published: boolean; view_count: number;
      tool_count: number; sort_order: number; meta_description: string | null;
    }>>`SELECT id, slug, title, heading, page_type, is_published, view_count, tool_count, sort_order, meta_description
       FROM seo_landing_pages ORDER BY sort_order, title`,

    prisma.$queryRaw<Array<{
      id: string; slug: string; name: string; description: string | null;
      is_published: boolean; tool_count: number; view_count: number;
    }>>`SELECT id, slug, name, description, is_published, tool_count, view_count FROM seo_tags ORDER BY name`,

    prisma.$queryRaw<Array<{
      id: string; url_pattern: string; should_index: boolean;
      priority: number; change_freq: string; notes: string | null;
    }>>`SELECT id, url_pattern, should_index, priority, change_freq, notes FROM seo_index_settings ORDER BY url_pattern`,

    prisma.$queryRaw<Array<{ page_slug: string; page_type: string; views: bigint }>>`
      SELECT page_slug, page_type, COUNT(*) as views
      FROM seo_page_views
      GROUP BY page_slug, page_type
      ORDER BY views DESC
      LIMIT 10`,

    prisma.$queryRaw<Array<{ page_type: string; count: bigint }>>`
      SELECT page_type, COUNT(*) as count FROM seo_landing_pages GROUP BY page_type`,
  ]);

  const totalViews = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM seo_page_views`;

  return NextResponse.json({
    pages,
    tags,
    indexSettings,
    analytics: {
      totalViews: Number(totalViews[0]?.count ?? 0),
      topPages: viewStats.map(r => ({ ...r, views: Number(r.views) })),
      pageTypeBreakdown: pageTypeStats.map(r => ({ page_type: r.page_type, count: Number(r.count) })),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { slug, title, heading, meta_description, page_type } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: 'slug and title are required' }, { status: 400 });
  }

  await prisma.$executeRaw`
    INSERT INTO seo_landing_pages (slug, title, heading, meta_description, page_type, is_published, filter_config)
    VALUES (${slug}, ${title}, ${heading || null}, ${meta_description || null}, ${page_type || 'collection'}, false, '{}'::jsonb)
  `;

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, type, is_published } = body;

  if (!id || !type) {
    return NextResponse.json({ error: 'id and type are required' }, { status: 400 });
  }

  if (type === 'page') {
    await prisma.$executeRaw`
      UPDATE seo_landing_pages SET is_published = ${is_published}, updated_at = now() WHERE id = ${id}::uuid
    `;
  } else if (type === 'tag') {
    await prisma.$executeRaw`
      UPDATE seo_tags SET is_published = ${is_published} WHERE id = ${id}::uuid
    `;
  }

  return NextResponse.json({ success: true });
}
