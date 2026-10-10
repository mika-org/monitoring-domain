import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { safeJson } from '@/lib/json-response';

function getDb() {
  if (prisma && prisma.serverMetric) return prisma;
  return new PrismaClient();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '1h';

    let since = new Date(Date.now() - 60 * 60 * 1000); // default 1 hour
    if (range === '6h') since = new Date(Date.now() - 6 * 60 * 60 * 1000);
    else if (range === '24h') since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (range === '7d') since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '30d') since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const db = getDb();
    const metrics = await db.serverMetric.findMany({
      where: {
        serverId: id,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
      take: 200,
    });

    const formatted = metrics.map((m) => ({
      time: new Date(m.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(m.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      timestamp: m.timestamp,
      cpuUsage: m.cpuUsage,
      ramUsagePercent: m.ramUsagePercent,
      ramUsed: m.ramUsed,
      ramTotal: m.ramTotal,
      networkIn: m.networkIn,
      networkOut: m.networkOut,
      load1: m.load1,
      load5: m.load5,
      load15: m.load15,
    }));

    return safeJson({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Fetch server metrics error:', error);
    return safeJson({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
