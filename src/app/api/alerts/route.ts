import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/alerts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const alerts = await prisma.alert.findMany({
      where: status && status !== 'all' ? { status } : undefined,
      orderBy: { triggeredAt: 'desc' },
      include: {
        server: { select: { id: true, name: true, ipAddress: true } },
        website: { select: { id: true, name: true, url: true } },
      },
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error: any) {
    console.error('Fetch alerts error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/alerts - Resolve alert
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    const updated = await prisma.alert.update({
      where: { id },
      data: {
        status: status || 'RESOLVED',
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Resolve alert error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
