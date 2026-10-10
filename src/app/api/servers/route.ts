import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { generateAgentToken } from '@/lib/agent-auth';
import { safeJson } from '@/lib/json-response';

function getDb() {
  if (prisma && prisma.server) return prisma;
  return new PrismaClient();
}

// GET /api/servers
export async function GET() {
  try {
    const db = getDb();
    const servers = await db.server.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          select: { status: true, version: true, lastSeenAt: true },
        },
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        pm2Processes: {
          select: { id: true, name: true, status: true },
        },
        nginxServices: {
          select: { id: true, status: true, version: true },
        },
        alerts: {
          where: { status: 'TRIGGERED' },
          select: { id: true, severity: true, message: true },
        },
      },
    });

    // Compute online/offline status based on heartbeat threshold (e.g. within last 90 seconds)
    const now = Date.now();
    const formatted = servers.map((s) => {
      const lastHb = s.lastHeartbeat ? new Date(s.lastHeartbeat).getTime() : 0;
      const isOnline = now - lastHb < 90000; // 90 seconds threshold

      return {
        id: s.id,
        name: s.name,
        hostname: s.hostname,
        ipAddress: s.ipAddress,
        os: s.os,
        kernelVersion: s.kernelVersion,
        cpuModel: s.cpuModel,
        cpuCores: s.cpuCores,
        totalRam: s.totalRam,
        totalDisk: s.totalDisk,
        status: isOnline ? s.status : 'OFFLINE',
        uptime: s.uptime ? Number(s.uptime) : 0,
        lastHeartbeat: s.lastHeartbeat,
        agentStatus: s.agent?.status || 'PENDING',
        latestMetric: s.metrics[0] || null,
        pm2Count: s.pm2Processes.length,
        pm2OnlineCount: s.pm2Processes.filter((p) => p.status === 'ONLINE').length,
        nginxStatus: s.nginxServices[0]?.status || 'UNKNOWN',
        activeAlertsCount: s.alerts.length,
        createdAt: s.createdAt,
      };
    });

    return safeJson({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Fetch servers error:', error);
    return safeJson({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/servers - Create server and issue unique agent token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ipAddress, hostname } = body;

    if (!name || !ipAddress) {
      return safeJson({ success: false, error: 'Nama server dan IP Address wajib diisi' }, { status: 400 });
    }

    const { token, hash } = generateAgentToken();
    const db = getDb();

    const server = await db.server.create({
      data: {
        name: name.trim(),
        ipAddress: ipAddress.trim(),
        hostname: hostname ? hostname.trim() : null,
        agent: {
          create: {
            tokenHash: hash,
            status: 'ACTIVE',
          },
        },
      },
      include: { agent: true },
    });

    return safeJson({
      success: true,
      data: server,
      agentToken: token, // Sent only once upon creation
      message: 'Server berhasil didaftarkan. Harap salin token agent ini untuk instalasi pada VPS.',
    });
  } catch (error: any) {
    console.error('Create server error:', error);
    return safeJson({ success: false, error: error.message || 'Gagal menambahkan server' }, { status: 500 });
  }
}
