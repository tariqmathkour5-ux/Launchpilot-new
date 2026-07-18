import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { recommendation_id, event_type, tool_id, source } = await request.json();

  if (!event_type || !tool_id) {
    return NextResponse.json({ error: 'event_type and tool_id required' }, { status: 400 });
  }

  const validEvents = ['shown', 'clicked', 'dismissed', 'saved'];
  if (!validEvents.includes(event_type)) {
    return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
  }

  await prisma.$executeRaw`
    INSERT INTO recommendation_events (user_id, recommendation_id, event_type, tool_id, source)
    VALUES (${session.user.id}, ${recommendation_id || null}, ${event_type}, ${tool_id}, ${source || 'homepage'})
  `;

  if (event_type === 'clicked') {
    await prisma.$executeRaw`
      INSERT INTO user_interests (user_id, tool_id, category_id, interest_type, weight)
      VALUES (
        ${session.user.id},
        ${tool_id},
        (SELECT "categoryId" FROM "Tool" WHERE id = ${tool_id}),
        'clicked_recommendation',
        1.5
      )
    `;
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.$queryRaw<Array<{ role: string }>>`
    SELECT role FROM "User" WHERE id = ${session.user.id}
  `;

  if (user.length === 0 || user[0].role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const overview = await prisma.$queryRaw<Array<{
    event_type: string; count: bigint;
  }>>`
    SELECT event_type, COUNT(*) as count
    FROM recommendation_events
    WHERE created_at > now() - interval '30 days'
    GROUP BY event_type
  `;

  const dailyMetrics = await prisma.$queryRaw<Array<{
    date: Date; shown: bigint; clicked: bigint; saved: bigint; dismissed: bigint;
  }>>`
    SELECT
      DATE(created_at) as date,
      COUNT(*) FILTER (WHERE event_type = 'shown') as shown,
      COUNT(*) FILTER (WHERE event_type = 'clicked') as clicked,
      COUNT(*) FILTER (WHERE event_type = 'saved') as saved,
      COUNT(*) FILTER (WHERE event_type = 'dismissed') as dismissed
    FROM recommendation_events
    WHERE created_at > now() - interval '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `;

  const topRecommended = await prisma.$queryRaw<Array<{
    tool_id: string; name: string; shown: bigint; clicked: bigint; ctr: number;
  }>>`
    SELECT
      re.tool_id,
      t.name,
      COUNT(*) FILTER (WHERE re.event_type = 'shown') as shown,
      COUNT(*) FILTER (WHERE re.event_type = 'clicked') as clicked,
      CASE WHEN COUNT(*) FILTER (WHERE re.event_type = 'shown') > 0
        THEN (COUNT(*) FILTER (WHERE re.event_type = 'clicked')::float / COUNT(*) FILTER (WHERE re.event_type = 'shown')::float * 100)
        ELSE 0 END as ctr
    FROM recommendation_events re
    JOIN "Tool" t ON t.id = re.tool_id
    WHERE re.created_at > now() - interval '30 days'
    GROUP BY re.tool_id, t.name
    ORDER BY clicked DESC
    LIMIT 20
  `;

  const sourceBreakdown = await prisma.$queryRaw<Array<{
    source: string; count: bigint;
  }>>`
    SELECT source, COUNT(*) as count
    FROM recommendation_events
    WHERE created_at > now() - interval '30 days'
    GROUP BY source
    ORDER BY count DESC
  `;

  const totalShown = overview.find(o => o.event_type === 'shown');
  const totalClicked = overview.find(o => o.event_type === 'clicked');
  const totalSaved = overview.find(o => o.event_type === 'saved');

  const clickRate = totalShown && Number(totalShown.count) > 0
    ? (Number(totalClicked?.count || 0) / Number(totalShown.count) * 100).toFixed(2)
    : '0';
  const saveRate = totalShown && Number(totalShown.count) > 0
    ? (Number(totalSaved?.count || 0) / Number(totalShown.count) * 100).toFixed(2)
    : '0';

  return NextResponse.json({
    overview: overview.map(o => ({ ...o, count: Number(o.count) })),
    dailyMetrics: dailyMetrics.map(d => ({
      ...d, shown: Number(d.shown), clicked: Number(d.clicked),
      saved: Number(d.saved), dismissed: Number(d.dismissed),
    })),
    topRecommended: topRecommended.map(t => ({
      ...t, shown: Number(t.shown), clicked: Number(t.clicked),
    })),
    sourceBreakdown: sourceBreakdown.map(s => ({ ...s, count: Number(s.count) })),
    rates: { clickRate: parseFloat(clickRate), saveRate: parseFloat(saveRate) },
  });
}
