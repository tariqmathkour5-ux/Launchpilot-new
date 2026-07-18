import { NextResponse } from 'next/server';
import { getAllTools } from '@/lib/tools';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let tools = getAllTools();

  if (category) {
    tools = tools.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  const total = tools.length;
  tools = tools.slice(offset, offset + limit);

  return NextResponse.json({
    tools,
    total,
    limit,
    offset,
  });
}
