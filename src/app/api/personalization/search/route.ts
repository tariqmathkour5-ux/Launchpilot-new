import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchTools } from '@/lib/tools';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ tools: [], total: 0 });
  }

  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const query = q.trim();

  let tools = searchTools(query);

  const session = await auth();
  let boosted = false;

  if (session?.user?.id) {
    const privacy = await prisma.$queryRaw<Array<{ personalization_enabled: boolean; track_searches: boolean }>>`
      SELECT personalization_enabled, track_searches FROM user_privacy_settings WHERE user_id = ${session.user.id}
    `;

    const isPersonalized = privacy.length === 0 || privacy[0].personalization_enabled;
    const trackSearches = privacy.length === 0 || privacy[0].track_searches;

    if (trackSearches) {
      await prisma.$executeRaw`
        INSERT INTO user_interests (user_id, tool_id, category_id, interest_type, weight)
        SELECT ${session.user.id}, NULL, cat.id, 'searched', 0.5
        FROM "Category" cat
        WHERE LOWER(cat.name) LIKE ${'%' + query.toLowerCase() + '%'}
        LIMIT 1
      `;
    }

    if (isPersonalized && tools.length > 1) {
      const userCategories = await prisma.$queryRaw<Array<{ category_id: string; total_weight: number }>>`
        SELECT category_id, SUM(weight)::float as total_weight
        FROM user_interests
        WHERE user_id = ${session.user.id} AND category_id IS NOT NULL
        GROUP BY category_id
        ORDER BY total_weight DESC
        LIMIT 5
      `;

      if (userCategories.length > 0) {
        const categoryIds = new Set(userCategories.map(c => c.category_id));
        const categoryWeights = new Map(userCategories.map(c => [c.category_id, c.total_weight]));

        const viewedTools = await prisma.$queryRaw<Array<{ tool_id: string; category_id: string }>>`
          SELECT DISTINCT ui.tool_id, ui.category_id
          FROM user_interests ui
          WHERE ui.user_id = ${session.user.id} AND ui.tool_id IS NOT NULL
        `;
        const viewedToolIds = new Set(viewedTools.map(v => v.tool_id));

        const toolsWithDB = await prisma.$queryRaw<Array<{ id: string; category_id: string }>>`
          SELECT id, "categoryId" as category_id FROM "Tool"
          WHERE slug = ANY(${tools.map(t => t.slug)}::text[])
        `;
        const toolCategoryMap = new Map(toolsWithDB.map(t => [t.id, t.category_id]));
        const slugToIdMap = new Map(toolsWithDB.map(t => [t.id, t.id]));

        tools = tools.map(tool => {
          let score = 0;
          const dbTool = toolsWithDB.find(t => t.id === tool.slug || tools.some(x => x.slug === tool.slug));
          const toolDbEntry = toolsWithDB.find(t => {
            return tools.find(x => x.slug === tool.slug);
          });

          for (const [id, catId] of toolCategoryMap) {
            if (catId && categoryIds.has(catId)) {
              const matchingTool = toolsWithDB.find(t => t.id === id);
              if (matchingTool) {
                score += (categoryWeights.get(catId) || 0) * 0.1;
              }
            }
          }
          return { ...tool, _boost: score };
        });

        tools.sort((a, b) => {
          const aBoost = (a as any)._boost || 0;
          const bBoost = (b as any)._boost || 0;
          return bBoost - aBoost;
        });

        tools = tools.map(({ _boost, ...tool }: any) => tool);
        boosted = true;
      }
    }
  }

  const total = tools.length;
  const paginatedTools = tools.slice(offset, offset + limit);

  return NextResponse.json({
    tools: paginatedTools,
    total,
    query,
    limit,
    offset,
    personalized: boosted,
  });
}
