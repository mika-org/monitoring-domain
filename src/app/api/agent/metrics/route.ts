import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { verifyAgentToken } from '@/lib/agent-auth';
import { triggerAlert } from '@/lib/alerts';
import { safeJson } from '@/lib/json-response';

function getDb() {
  if (prisma && prisma.pm2Process && prisma.serverMetric) return prisma;
  return new PrismaClient();
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const auth = await verifyAgentToken(authHeader);

    if (!auth) {
      return safeJson({ success: false, error: 'Unauthorized: Invalid Agent Token' }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    if (!payload || !payload.metrics) {
      return safeJson({ success: false, error: 'Invalid payload: missing metrics' }, { status: 400 });
    }

    const serverId = auth.server.id;
    const now = new Date();
    const db = getDb();
    const { system, metrics, pm2, nginx } = payload;

    // 1. Update Server status & system info if provided
    const serverUpdateData: any = {
      lastHeartbeat: now,
      status: 'ONLINE',
      agentStatus: 'ACTIVE',
    };

    if (system) {
      if (system.hostname) serverUpdateData.hostname = system.hostname;
      if (system.os) serverUpdateData.os = system.os;
      if (system.kernelVersion) serverUpdateData.kernelVersion = system.kernelVersion;
      if (system.cpuModel) serverUpdateData.cpuModel = system.cpuModel;
      if (system.cpuCores) serverUpdateData.cpuCores = system.cpuCores;
      if (system.totalRam) serverUpdateData.totalRam = system.totalRam;
      if (system.totalDisk) serverUpdateData.totalDisk = system.totalDisk;
      if (system.uptime !== undefined) serverUpdateData.uptime = BigInt(Math.floor(Number(system.uptime)));
    }

    await db.server.update({
      where: { id: serverId },
      data: serverUpdateData,
    });

    // 2. Insert into server_metrics
    await db.serverMetric.create({
      data: {
        serverId,
        cpuUsage: Number(metrics.cpuUsage || 0),
        ramTotal: Number(metrics.ramTotal || 0),
        ramUsed: Number(metrics.ramUsed || 0),
        ramUsagePercent: Number(metrics.ramUsagePercent || 0),
        diskUsage: metrics.diskUsage || null,
        networkIn: Number(metrics.networkIn || 0),
        networkOut: Number(metrics.networkOut || 0),
        load1: metrics.load1 !== undefined ? Number(metrics.load1) : null,
        load5: metrics.load5 !== undefined ? Number(metrics.load5) : null,
        load15: metrics.load15 !== undefined ? Number(metrics.load15) : null,
        uptime: system?.uptime !== undefined ? BigInt(Math.floor(Number(system.uptime))) : null,
        timestamp: now,
      },
    });

    // 3. Update PM2 processes if array provided
    if (Array.isArray(pm2)) {
      for (const proc of pm2) {
        if (!proc.name || proc.pmId === undefined) continue;

        let procStatus = 'ONLINE';
        const rawStatus = String(proc.status || '').toLowerCase();
        if (rawStatus === 'stopped' || rawStatus === 'stopping') {
          procStatus = 'STOPPED';
        } else if (rawStatus === 'errored' || rawStatus === 'error' || rawStatus === 'crashed') {
          procStatus = 'ERRORED';
        }

        await db.pm2Process.upsert({
          where: {
            serverId_name_pmId: {
              serverId,
              name: proc.name,
              pmId: Number(proc.pmId),
            },
          },
          update: {
            status: procStatus,
            cpu: Number(proc.cpu || 0),
            memory: Number(proc.memory || 0),
            restarts: Number(proc.restarts || 0),
            uptime: BigInt(Math.floor(Number(proc.uptime || 0))),
            nodeVersion: proc.nodeVersion || null,
            lastSeenAt: now,
          },
          create: {
            serverId,
            name: proc.name,
            pmId: Number(proc.pmId),
            status: procStatus,
            cpu: Number(proc.cpu || 0),
            memory: Number(proc.memory || 0),
            restarts: Number(proc.restarts || 0),
            uptime: BigInt(Math.floor(Number(proc.uptime || 0))),
            nodeVersion: proc.nodeVersion || null,
            lastSeenAt: now,
          },
        });

        // Trigger alert if PM2 process errored
        if (procStatus === 'ERRORED') {
          await triggerAlert({
            serverId,
            type: 'PM2_ERRORED',
            severity: 'CRITICAL',
            message: `Aplikasi PM2 "${proc.name}" (ID ${proc.pmId}) pada server ${auth.server.name} mengalami error/crash.`,
          });
        }
      }
    }

    // 4. Update Nginx status if provided
    if (nginx) {
      const nginxStatus = String(nginx.status || '').toUpperCase();
      const validStatus = nginxStatus === 'ACTIVE' ? 'ACTIVE' : nginxStatus === 'FAILED' ? 'FAILED' : 'INACTIVE';

      const existingNginx = await db.nginxService.findFirst({
        where: { serverId },
      });

      if (existingNginx) {
        await db.nginxService.update({
          where: { id: existingNginx.id },
          data: {
            status: validStatus,
            version: nginx.version || existingNginx.version,
            ports: nginx.ports || existingNginx.ports,
            vhostsCount: nginx.vhostsCount || existingNginx.vhostsCount,
            lastCheckedAt: now,
          },
        });
      } else {
        await db.nginxService.create({
          data: {
            serverId,
            status: validStatus,
            version: nginx.version || null,
            ports: nginx.ports || [80, 443],
            vhostsCount: nginx.vhostsCount || null,
            lastCheckedAt: now,
          },
        });
      }

      if (validStatus !== 'ACTIVE') {
        await triggerAlert({
          serverId,
          type: 'NGINX_INACTIVE',
          severity: 'CRITICAL',
          message: `Service Nginx pada server ${auth.server.name} tidak aktif (${validStatus}).`,
        });
      }
    }

    // 5. Evaluate System Resource Alerts
    const cpuVal = Number(metrics.cpuUsage || 0);
    if (cpuVal >= 95) {
      await triggerAlert({
        serverId,
        type: 'CPU_HIGH',
        severity: 'CRITICAL',
        message: `CPU Usage pada server ${auth.server.name} mencapai ${cpuVal.toFixed(1)}% (Threshold: 95%).`,
      });
    } else if (cpuVal >= 80) {
      await triggerAlert({
        serverId,
        type: 'CPU_HIGH',
        severity: 'WARNING',
        message: `CPU Usage pada server ${auth.server.name} mencapai ${cpuVal.toFixed(1)}% (Threshold: 80%).`,
      });
    }

    const ramVal = Number(metrics.ramUsagePercent || 0);
    if (ramVal >= 95) {
      await triggerAlert({
        serverId,
        type: 'RAM_HIGH',
        severity: 'CRITICAL',
        message: `RAM Usage pada server ${auth.server.name} mencapai ${ramVal.toFixed(1)}% (Threshold: 95%).`,
      });
    } else if (ramVal >= 85) {
      await triggerAlert({
        serverId,
        type: 'RAM_HIGH',
        severity: 'WARNING',
        message: `RAM Usage pada server ${auth.server.name} mencapai ${ramVal.toFixed(1)}% (Threshold: 85%).`,
      });
    }

    return safeJson({
      success: true,
      message: 'Metrics stored successfully',
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Agent metrics ingestion error:', error);
    return safeJson({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
