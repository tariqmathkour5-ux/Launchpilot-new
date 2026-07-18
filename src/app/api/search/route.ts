import { NextResponse } from 'next/server';
import { searchTools } from '@/lib/tools';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ tools: [], total: 0 });
  }

  const tools = searchTools(q.trim());
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  const total = tools.length;
  const paginatedTools = tools.slice(offset, offset + limit);

  return NextResponse.json({
    tools: paginatedTools,
    total,
    query: q,
    limit,
    offset,
  });
}
