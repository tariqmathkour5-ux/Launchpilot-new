import { NextRequest, NextResponse } from 'next/server';
import { getRevenueSummary, getRevenueBreakdown, getRevenueChartData, getFinancialMetrics, getPendingPayouts, processPayout } from '@/lib/revenue';

// GET /api/admin/revenue - Revenue dashboard data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view') || 'summary';
    const days = parseInt(searchParams.get('days') || '30');

    switch (view) {
      case 'summary': {
        const summary = await getRevenueSummary(days);
        return NextResponse.json(summary);
      }

      case 'breakdown': {
        const breakdown = await getRevenueBreakdown(days);
        return NextResponse.json(breakdown);
      }

      case 'chart': {
        const chartData = await getRevenueChartData(days);
        return NextResponse.json(chartData);
      }

      case 'metrics': {
        const metrics = await getFinancialMetrics();
        return NextResponse.json(metrics);
      }

      case 'payouts': {
        const payouts = await getPendingPayouts();
        return NextResponse.json(payouts);
      }

      default:
        return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}

// POST /api/admin/revenue - Process payouts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, partnerId, amount, description } = body;

    if (action === 'process_payout') {
      if (!partnerId || !amount) {
        return NextResponse.json({ error: 'Partner ID and amount are required' }, { status: 400 });
      }

      const result = await processPayout(
        partnerId,
        parseInt(amount),
        description
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing revenue action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}