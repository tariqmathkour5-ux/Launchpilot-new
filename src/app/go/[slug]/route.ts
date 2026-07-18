import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { trackAffiliateClick } from '@/lib/affiliate';

// GET /go/[slug] - Redirect affiliate links and track clicks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find the affiliate link
    const link = await prisma.affiliateLink.findUnique({
      where: { slug },
      include: {
        tool: { select: { websiteUrl: true, id: true } },
        partner: { select: { id: true, status: true } },
      },
    });

    if (!link || !link.isActive || !link.partner || link.partner.status !== 'ACTIVE') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Track the click
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    const referrer = request.headers.get('referer') || undefined;

    await trackAffiliateClick({
      linkId: link.id,
      toolId: link.toolId,
      partnerId: link.partnerId,
      source: link.source || undefined,
      medium: link.medium || undefined,
      campaign: link.campaign || undefined,
      term: link.term || undefined,
      content: link.content || undefined,
      ipAddress,
      userAgent,
      referrer,
    });

    // Redirect to the tool's website
    const targetUrl = link.tool.websiteUrl || link.url;
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error('Error processing affiliate redirect:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}