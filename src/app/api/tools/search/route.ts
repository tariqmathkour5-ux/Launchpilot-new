import { NextRequest, NextResponse } from 'next/server';
import { searchToolsKb } from '@/lib/tools-kb';

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || undefined;
    const pricing = searchParams.get('pricing') || undefined;
    const platform = searchParams.get('platform') || undefined;
    const hasApi = searchParams.get('hasApi') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const slugs = searchParams.get('slugs')?.split(',').filter(Boolean);

    // If slugs are provided, fetch tools by slugs
    if (slugs && slugs.length > 0) {
      const result = searchToolsKb({ limit: 10000, excludeAgents: true });
      const allTools = result.tools;
      const matchedTools = allTools.filter(t => slugs.includes(t.slug));
      
      return NextResponse.json({
        tools: matchedTools,
        total: matchedTools.length,
      });
    }

    // Otherwise, perform search
    const result = searchToolsKb({
      query: query || undefined,
      category,
      pricing,
      platform,
      hasApi: hasApi || undefined,
      limit,
      offset,
      excludeAgents: true,
    });

    return NextResponse.json({
      tools: result.tools,
      total: result.total,
      filters: result.filters,
    });
  } catch (error) {
    console.error('Error in tools search API:', error);
    return NextResponse.json(
      { error: 'Failed to search tools' },
      { status: 500 }
    );
  }
}