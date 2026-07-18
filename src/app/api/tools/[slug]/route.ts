import { NextResponse } from 'next/server';
import { parseToolPage, parseReview, parseAlternative } from '@/lib/tools';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tool = parseToolPage(slug);

  if (!tool) {
    return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
  }

  const review = parseReview(slug);
  const alternative = parseAlternative(slug);

  return NextResponse.json({
    tool,
    review,
    alternative,
  });
}
