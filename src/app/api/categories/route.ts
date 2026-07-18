import { NextResponse } from 'next/server';
import { CATEGORIES } from '@/types';
import { getAllTools } from '@/lib/tools';

export async function GET() {
  const tools = getAllTools();

  const categoriesWithCount = CATEGORIES.map(cat => ({
    ...cat,
    tool_count: tools.filter(t => t.category.toLowerCase() === cat.name.toLowerCase()).length,
  }));

  return NextResponse.json({ categories: categoriesWithCount });
}
