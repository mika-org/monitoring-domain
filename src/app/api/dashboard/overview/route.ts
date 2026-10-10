import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { safeJson } from '@/lib/json-response';

function getDb() {
  if (prisma && prisma.server) return prisma;
  return new PrismaClient();
}

export async function GET() {
  try {
    const db = getDb();
    const now = Date.now();

    // 1. Fetch Servers
    const servers = await db.server.findMany({
      include: {
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        pm2Processes: true,
        alerts: {
          where: { status: 'TRIGGERED' },
        },
      },
    });

    let serversOnline = 0;
    let serversOffline = 0;
    let totalCpuSum = 0;
    let totalRamPercentSum = 0;
    let totalNetIn = 0;
    let totalNetOut = 0;
    let metricsCount = 0;
    let pm2Total = 0;
    let pm2Online = 0;
    let pm2Errored = 0;

    servers.forEach((s) => {
      const lastHb = s.lastHeartbeat ? new Date(s.lastHeartbeat).getTime() : 0;
      const isOnline = now - lastHb < 90000;
      if (isOnline) serversOnline++;
      else serversOffline++;

      if (s.metrics[0]) {
        totalCpuSum += s.metrics[0].cpuUsage;
        totalRamPercentSum += s.metrics[0].ramUsagePercent;
        totalNetIn += s.metrics[0].networkIn || 0;
        totalNetOut += s.metrics[0].networkOut || 0;
        metricsCount++;
      }

      pm2Total += s.pm2Processes.length;
      pm2Online += s.pm2Processes.filter((p) => p.status === 'ONLINE').length;
      pm2Errored += s.pm2Processes.filter((p) => p.status === 'ERRORED').length;
    });

    const avgCpu = metricsCount > 0 ? totalCpuSum / metricsCount : 0;
    const avgRam = metricsCount > 0 ? totalRamPercentSum / metricsCount : 0;

    // 2. Fetch Websites
    const websites = await db.website.findMany();
    const websitesTotal = websites.length;
    const websitesUp = websites.filter((w) => w.status === 'UP').length;
    const websitesDown = websites.filter((w) => w.status === 'DOWN').length;

    // 3. Active Alerts
    const activeAlerts = await db.alert.findMany({
      where: { status: 'TRIGGERED' },
      orderBy: { triggeredAt: 'desc' },
      take: 5,
      include: {
        server: { select: { name: true } },
      },
    });

    // 4. Domains (SSL)
    const monitoredDomains = await db.monitoredDomain.findMany();

    return safeJson({
      success: true,
      data: {
        servers: {
          total: servers.length,
          online: serversOnline,
          offline: serversOffline,
          avgCpu: parseFloat(avgCpu.toFixed(1)),
          avgRam: parseFloat(avgRam.toFixed(1)),
          totalNetIn: parseFloat(totalNetIn.toFixed(1)),
          totalNetOut: parseFloat(totalNetOut.toFixed(1)),
          list: servers.map((s) => ({
            id: s.id,
            name: s.name,
            ipAddress: s.ipAddress,
            status: now - (s.lastHeartbeat ? new Date(s.lastHeartbeat).getTime() : 0) < 90000 ? s.status : 'OFFLINE',
            cpu: s.metrics[0]?.cpuUsage || 0,
            ram: s.metrics[0]?.ramUsagePercent || 0,
          })),
        },
        websites: {
          total: websitesTotal,
          up: websitesUp,
          down: websitesDown,
        },
        pm2: {
          total: pm2Total,
          online: pm2Online,
          errored: pm2Errored,
        },
        domains: {
          total: monitoredDomains.length,
        },
        alerts: activeAlerts,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Fetch dashboard overview error:', error);
    return safeJson({ success: false, error: error.message }, { status: 500 });
  }
}
