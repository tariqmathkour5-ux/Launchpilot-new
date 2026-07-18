import { NextResponse } from 'next/server';
import { getToolsAnalytics } from '@/lib/tools-analytics';

export async function GET() {
  try {
    const analytics = getToolsAnalytics();
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to fetch tools analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}