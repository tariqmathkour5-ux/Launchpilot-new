import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notifyReviewSubmitted, logGrowthEvent } from '@/lib/growth-automation';

interface ReviewRouteParams {
  params: Promise<{ slug: string }>;
}

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().min(10).max(2000),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
});

// GET /api/tools/[slug]/reviews - Fetch user reviews for a tool
export async function GET(_: Request, { params }: ReviewRouteParams) {
  try {
    const { slug } = await params;

    // Find the tool in the database by slug (mapped from markdown)
    // Note: This assumes tools have been synced to DB; if not, return empty reviews
    const tool = await prisma.tool.findFirst({
      where: { slug },
    }).catch(() => null);

    if (!tool) {
      // Tool not in DB yet - return empty reviews (SSR will still work with markdown data)
      return NextResponse.json({
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
      });
    }

    // Fetch reviews separately
    const reviews = await prisma.userReview.findMany({
      where: { toolId: tool.id },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, image: true },
        },
      },
    });

    // Calculate aggregate rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
      : 0;

    // Get total count
    const totalReviews = await prisma.userReview.count({
      where: { toolId: tool.id },
    });

    return NextResponse.json({
      reviews: reviews.map((r: {
        id: string;
        rating: number;
        title: string | null;
        content: string;
        pros: string;
        cons: string;
        verified: boolean;
        helpful: number;
        createdAt: Date;
        user: { name: string | null; image: string | null } | null;
      }) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        pros: JSON.parse(r.pros || '[]'),
        cons: JSON.parse(r.cons || '[]'),
        verified: r.verified,
        helpful: r.helpful,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
      averageRating: Number(avgRating.toFixed(1)),
      totalReviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/tools/[slug]/reviews - Submit a user review
export async function POST(request: Request, { params }: ReviewRouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { rating, title, content, pros, cons } = reviewSchema.parse(body);

    // Find the tool in database
    const tool = await prisma.tool.findFirst({
      where: { slug },
    }).catch(() => null);

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Check if review exists to determine if this is a new creation
    const existingReview = await prisma.userReview.findUnique({
      where: {
        toolId_userId: {
          toolId: tool.id,
          userId: session.user.id,
        },
      },
    });

    // Create or update review (one review per user per tool)
    const review = await prisma.userReview.upsert({
      where: {
        toolId_userId: {
          toolId: tool.id,
          userId: session.user.id,
        },
      },
      update: {
        rating,
        title,
        content,
        pros: JSON.stringify(pros || []),
        cons: JSON.stringify(cons || []),
      },
      create: {
        toolId: tool.id,
        userId: session.user.id,
        rating,
        title,
        content,
        pros: JSON.stringify(pros || []),
        cons: JSON.stringify(cons || []),
      },
    });

    // Notify Growth Automation system about new review (only on creation)
    if (!existingReview) {
      // Trigger notification asynchronously (don't await to avoid slowing response)
      notifyReviewSubmitted({
        toolId: tool.id,
        toolName: tool.name,
        toolSlug: tool.slug,
        userId: session.user.id,
        userName: session.user.name || undefined,
        userEmail: session.user.email || undefined,
        rating,
        title,
        content,
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}