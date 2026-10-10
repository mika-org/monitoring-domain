import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { safeJson } from '@/lib/json-response';

function getDb() {
  if (prisma && prisma.server) return prisma;
  return new PrismaClient();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const server = await db.server.findUnique({
      where: { id },
      include: {
        agent: true,
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 30,
        },
        pm2Processes: {
          orderBy: { name: 'asc' },
        },
        nginxServices: true,
        alerts: {
          orderBy: { triggeredAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!server) {
      return safeJson({ success: false, error: 'Server tidak ditemukan' }, { status: 404 });
    }

    const now = Date.now();
    const lastHb = server.lastHeartbeat ? new Date(server.lastHeartbeat).getTime() : 0;
    const isOnline = now - lastHb < 90000;

    return safeJson({
      success: true,
      data: {
        ...server,
        status: isOnline ? server.status : 'OFFLINE',
        uptime: server.uptime ? Number(server.uptime) : 0,
        latestMetric: server.metrics[0] || null,
      },
    });
  } catch (error: any) {
    console.error('Get server detail error:', error);
    return safeJson({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await req.json();
    const { name, ipAddress, hostname } = body;

    const updated = await db.server.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(ipAddress ? { ipAddress: ipAddress.trim() } : {}),
        ...(hostname !== undefined ? { hostname: hostname?.trim() || null } : {}),
      },
    });

    return safeJson({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update server error:', error);
    return safeJson({ success: false, error: error.message || 'Gagal memperbarui server' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.server.delete({ where: { id } });
    return safeJson({ success: true, message: 'Server berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete server error:', error);
    return safeJson({ success: false, error: error.message || 'Gagal menghapus server' }, { status: 500 });
  }
}
