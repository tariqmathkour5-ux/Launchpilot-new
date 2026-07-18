import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const startTime = Date.now();
  
  try {
    // Fetch tool data from the knowledge base
    const { searchToolsKb } = await import('@/lib/tools-kb');
    const tools = searchToolsKb({}).tools;
    const tool = tools.find(t => t.slug === slug);

    if (!tool) {
      return new Response('Tool not found', { status: 404 });
    }

    // Fetch user rating if available
    const { prisma } = await import('@/lib/prisma');
    let avgRating = tool.rating || null;
    let reviewCount = 0;

    try {
      const dbTool = await prisma.tool.findFirst({
        where: { slug },
        select: { id: true },
      });

      if (dbTool) {
        const reviews = await prisma.userReview.findMany({
          where: { toolId: dbTool.id },
          select: { rating: true },
        });

        if (reviews.length > 0) {
          avgRating = Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1));
          reviewCount = reviews.length;
        }
      }
    } catch {
      // Use default tool rating if DB query fails
    }

    // Determine rating badge color and text
    const ratingBadge = avgRating 
      ? `${avgRating}/5 ${reviewCount > 0 ? `(${reviewCount})` : ''}`
      : 'New Tool';

    const ratingColor = avgRating 
      ? avgRating >= 4.5 ? '#10b981' // green
      : avgRating >= 4.0 ? '#22c55e'
      : avgRating >= 3.5 ? '#eab308' // yellow
      : avgRating >= 3.0 ? '#f97316' // orange
      : '#ef4444' // red
      : '#6b7280'; // gray for no rating

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '80px 60px',
          }}
        >
          {/* Category Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '9999px',
              padding: '12px 24px',
              marginBottom: '40px',
            }}
          >
            <span
              style={{
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: '600',
              }}
            >
              {tool.category}
            </span>
          </div>

          {/* Tool Name */}
          <div
            style={{
              display: 'flex',
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: '30px',
              maxWidth: '1000px',
            }}
          >
            {tool.name}
          </div>

          {/* Description */}
          <div
            style={{
              display: 'flex',
              fontSize: '28px',
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              lineHeight: 1.5,
              marginBottom: '50px',
              maxWidth: '900px',
            }}
          >
            {tool.description.length > 120 
              ? `${tool.description.substring(0, 120)}...` 
              : tool.description}
          </div>

          {/* Rating Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              backgroundColor: ratingColor,
              borderRadius: '16px',
              padding: '16px 32px',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              {ratingBadge}
            </span>
          </div>

          {/* LaunchPilot Branding */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              Powered by LaunchPilot
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
    
    // Log performance metrics for OG image generation
    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'production' && duration > 1000) {
      console.warn(`[Performance] OG image generation took ${duration}ms for slug: ${slug}`);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Performance] Failed OG image generation after ${duration}ms:`, error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
