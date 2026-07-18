import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const interests = await prisma.$queryRaw<Array<{
    interest_type: string;
    tool_id: string | null;
    category_id: string | null;
    weight: number;
    tool_name: string | null;
    tool_slug: string | null;
    category_name: string | null;
    category_slug: string | null;
    interaction_count: bigint;
  }>>`
    SELECT
      ui.interest_type,
      ui.tool_id,
      ui.category_id,
      ui.weight,
      t.name as tool_name,
      t.slug as tool_slug,
      cat.name as category_name,
      cat.slug as category_slug,
      COUNT(*) OVER (PARTITION BY ui.interest_type) as interaction_count
    FROM user_interests ui
    LEFT JOIN "Tool" t ON t.id = ui.tool_id
    LEFT JOIN "Category" cat ON cat.id = ui.category_id
    WHERE ui.user_id = ${session.user.id}
    ORDER BY ui.weight DESC, ui.updated_at DESC
    LIMIT 100
  `;

  const topCategories = await prisma.$queryRaw<Array<{
    category_id: string;
    name: string;
    slug: string;
    total_weight: number;
  }>>`
    SELECT ui.category_id, cat.name, cat.slug, SUM(ui.weight)::float as total_weight
    FROM user_interests ui
    JOIN "Category" cat ON cat.id = ui.category_id
    WHERE ui.user_id = ${session.user.id} AND ui.category_id IS NOT NULL
    GROUP BY ui.category_id, cat.name, cat.slug
    ORDER BY total_weight DESC
    LIMIT 10
  `;

  const summary = {
    total_interactions: interests.length,
    viewed: interests.filter(i => i.interest_type === 'viewed').length,
    favorited: interests.filter(i => i.interest_type === 'favorited').length,
    compared: interests.filter(i => i.interest_type === 'compared').length,
    searched: interests.filter(i => i.interest_type === 'searched').length,
  };

  return NextResponse.json({
    interests: interests.map(i => ({ ...i, interaction_count: Number(i.interaction_count) })),
    topCategories,
    summary,
  });
}
