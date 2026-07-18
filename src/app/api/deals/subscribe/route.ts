import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint for subscribing to deal alerts
 * Mock handler - stores subscription in database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, favoriteToolSlugs } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Validate favoriteToolSlugs
    if (!Array.isArray(favoriteToolSlugs) || favoriteToolSlugs.length === 0) {
      return NextResponse.json(
        { error: 'At least one favorite tool is required' },
        { status: 400 }
      );
    }

    // Check if subscriber already exists
    let subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (subscriber) {
      // Update existing subscriber with deal preferences
      subscriber = await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          source: 'deals_hub',
          status: 'ACTIVE',
        },
      });
    } else {
      // Create new subscriber
      subscriber = await prisma.newsletterSubscriber.create({
        data: {
          email,
          name: email.split('@')[0], // Use email prefix as name
          source: 'deals_hub',
          status: 'ACTIVE',
        },
      });
    }

    // Store deal preferences as activity log (for mock purposes)
    // In production, you'd create a DealSubscription model
    await prisma.activityLog.create({
      data: {
        action: 'DEAL_SUBSCRIPTION_CREATED',
        resource: 'deal_subscription',
        resourceId: subscriber.id,
        details: JSON.stringify({
          email,
          favoriteTools: favoriteToolSlugs,
          subscribedAt: new Date().toISOString(),
        }),
      },
    });

    // Send welcome email (mock - using console log)
    console.log(`[DealsHub] Deal subscription created for ${email} with favorites: ${favoriteToolSlugs.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to deal alerts!',
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
      },
      favoriteTools: favoriteToolSlugs,
    }, { status: 201 });

  } catch (error) {
    console.error('[DealsHub] Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if email is subscribed
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    );
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  return NextResponse.json({
    subscribed: !!subscriber,
    subscriber: subscriber || null,
  });
}