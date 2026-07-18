import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRecommendationsForUser, getRecentlyViewedTools, getNewInFavoriteCategories, getTrendingTools } from '@/lib/recommendations';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    const trending = await getTrendingTools(12);
    return NextResponse.json({ recommended: trending, recentlyViewed: [], newInCategories: [], trending });
  }

  const userId = session.user.id;

  const privacy = await prisma.$queryRaw<Array<{ personalization_enabled: boolean; show_recommendations: boolean }>>`
    SELECT personalization_enabled, show_recommendations FROM user_privacy_settings WHERE user_id = ${userId}
  `;

  const privacyEnabled = privacy.length === 0 || privacy[0].personalization_enabled;
  const showRecs = privacy.length === 0 || privacy[0].show_recommendations;

  if (!privacyEnabled || !showRecs) {
    const trending = await getTrendingTools(12);
    return NextResponse.json({ recommended: trending, recentlyViewed: [], newInCategories: [], trending });
  }

  const [recommended, recentlyViewed, newInCategories, trending] = await Promise.all([
    getRecommendationsForUser(userId, 12),
    getRecentlyViewedTools(userId, 8),
    getNewInFavoriteCategories(userId, 8),
    getTrendingTools(8),
  ]);

  return NextResponse.json({ recommended, recentlyViewed, newInCategories, trending });
}
