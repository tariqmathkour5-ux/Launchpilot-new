import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    // Fetch blog post data
    const { getBySlug } = await import('@/lib/blog-posts');
    const post = await getBySlug(slug);

    if (!post || !post.published) {
      return new Response('Blog post not found', { status: 404 });
    }

    // Calculate reading time
    const { calculateReadingTime } = await import('@/lib/reading-time');
    const readingTime = calculateReadingTime(post.content);

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
          {post.category?.name && (
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
                {post.category.name}
              </span>
            </div>
          )}

          {/* Blog Post Title */}
          <div
            style={{
              display: 'flex',
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: '30px',
              maxWidth: '1000px',
            }}
          >
            {post.title}
          </div>

          {/* Excerpt/Description */}
          {(post.excerpt || post.description) && (
            <div
              style={{
                display: 'flex',
                fontSize: '28px',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                lineHeight: 1.5,
                marginBottom: '40px',
                maxWidth: '900px',
              }}
            >
              {(post.excerpt || post.description || '').length > 150
                ? `${(post.excerpt || post.description || '').substring(0, 150)}...`
                : (post.excerpt || post.description || '')}
            </div>
          )}

          {/* Meta Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '16px 32px',
            }}
          >
            {/* Author */}
            {post.author?.name && (
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ffffff',
                }}
              >
                {post.author.name}
              </div>
            )}

            {/* Reading Time */}
            {readingTime > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '20px',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                <span>{readingTime} min read</span>
              </div>
            )}

            {/* Published Date */}
            {post.publishedAt && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '20px',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                </svg>
                <span>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
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
              LaunchPilot Blog
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating blog OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}