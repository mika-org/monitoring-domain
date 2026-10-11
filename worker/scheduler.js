/**
 * VioreCert Infrastructure Background Scheduler Worker
 * Handles:
 *  1. Periodic Website Health Checks (SSRF safe) & SSL Expiration checks
 *  2. Server Heartbeat Watchdog (detects OFFLINE VPS)
 *  3. Incident Alert Triggering & Telegram notifications
 *  4. Database Metrics Retention policy cleanup
 *
 * Runs standalone via PM2 on Ubuntu Server:
 *   pm2 start worker/scheduler.js --name "viorecert-worker"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const tls = require('tls');
const { PrismaClient } = require('@prisma/client');

// Auto-load .env file if running standalone
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const prisma = new PrismaClient();

// SSRF Safety Check
function isSafeUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname)) return false;
    if (hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('169.254.')) return false;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

// Telegram alert sender
async function sendTelegramAlert(title, message, severity = 'WARNING', extra = {}) {
  let token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '').replace(/^bot/i, '');
  let chatId = (process.env.TELEGRAM_CHAT_ID || '').trim().replace(/^["']|["']$/g, '').replace(/^bot/i, '');
  if (!token || !chatId) return;

  const botId = token.split(':')[0];
  if (chatId === botId) return;

  const isCritical = severity === 'CRITICAL';
  const isWarning = severity === 'WARNING';
  const headerEmoji = isCritical ? '🚨' : isWarning ? '⚠️' : '🚀';
  const statusEmoji = isCritical ? '❌' : isWarning ? '⚠️' : '✅';
  const statusTitle = isCritical ? 'Incident Detected' : isWarning ? 'Warning Threshold Exceeded' : 'System Notification';
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\./g, ':') + ' WIB';

  const lines = [
    `${headerEmoji} <b>${title}</b>`,
    '',
    `${statusEmoji} <b>${statusTitle}</b>`,
    '',
    '📦 <b>Repository:</b> <code>mika-org/monitoring-domain</code>',
    '🌿 <b>Branch:</b> <code>master</code>',
  ];

  if (extra.serverName || extra.serverIp) {
    lines.push('');
    lines.push(`🖥 <b>Server:</b>`);
    lines.push(`${extra.serverIp || ''} ${extra.serverName ? `(${extra.serverName})` : ''}`.trim());
    if (extra.serverStatus) lines.push(`• <b>Status:</b> ${extra.serverStatus}`);
    if (extra.cpu !== undefined) lines.push(`• <b>CPU Usage:</b> ${extra.cpu}%`);
    if (extra.ram !== undefined) lines.push(`• <b>RAM Usage:</b> ${extra.ram}%`);
    if (extra.pm2Count !== undefined) lines.push(`• <b>PM2 Processes:</b> ${extra.pm2Count} active processes`);
  }

  if (extra.websiteUrl || extra.websiteName) {
    lines.push('');
    lines.push(`🌐 <b>Target Website:</b>`);
    lines.push(`${extra.websiteName || ''} (${extra.websiteUrl || ''})`.trim());
    if (extra.websiteStatus) lines.push(`• <b>Status:</b> ${extra.websiteStatus}`);
    if (extra.responseTime) lines.push(`• <b>Response Time:</b> ${extra.responseTime}ms`);
    if (extra.sslDays !== undefined) lines.push(`• <b>SSL Remaining:</b> ${extra.sslDays} days`);
  }

  lines.push('');
  lines.push('📝 <b>Detail:</b>');
  lines.push(message);
  lines.push('');
  lines.push('🌐 <b>Application Port:</b> <code>3009</code>');
  lines.push('🌐 <b>Application Link:</b> https://monitoring-domain.elevore.web.id');
  lines.push('');
  lines.push(`🕒 <b>Triggered:</b> ${now}`);
  lines.push('');
  lines.push(`🚀 <b>Status:</b> ${statusEmoji} ${severity}`);

  const text = lines.join('\n');

  try {
    const postData = JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    const req = https.request(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 8000,
      },
      (res) => {
        res.resume();
      }
    );
    req.on('error', (err) => console.error('[Worker] Telegram error:', err.message));
    req.write(postData);
    req.end();
  } catch (err) {
    console.error('[Worker] Telegram dispatch failed:', err.message);
  }
}

// Trigger alert with cooldown
async function triggerAlert({ serverId, websiteId, type, severity, message, cooldownMinutes = 15 }) {
  const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000);
  const existing = await prisma.alert.findFirst({
    where: {
      serverId: serverId || null,
      websiteId: websiteId || null,
      type,
      status: { in: ['TRIGGERED', 'ACKNOWLEDGED'] },
      createdAt: { gte: cutoff },
    },
  });

  if (existing) return;

  await prisma.alert.create({
    data: {
      serverId: serverId || null,
      websiteId: websiteId || null,
      type,
      severity,
      message,
      status: 'TRIGGERED',
    },
  });

  let extra = {};
  if (serverId) {
    try {
      const s = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
          metrics: { orderBy: { timestamp: 'desc' }, take: 1 },
          pm2Processes: true,
        },
      });
      if (s) {
        extra.serverName = s.name;
        extra.serverIp = s.ipAddress;
        extra.serverStatus = s.status === 'ONLINE' ? '🟢 ONLINE' : s.status === 'WARNING' ? '⚠️ WARNING' : '🔴 OFFLINE';
        if (s.metrics[0]) {
          extra.cpu = s.metrics[0].cpuUsage?.toFixed(1);
          extra.ram = s.metrics[0].ramUsagePercent?.toFixed(1);
        }
        extra.pm2Count = s.pm2Processes?.length;
      }
    } catch {}
  }

  if (websiteId) {
    try {
      const w = await prisma.website.findUnique({ where: { id: websiteId } });
      if (w) {
        extra.websiteName = w.name;
        extra.websiteUrl = w.url;
        extra.websiteStatus = w.status === 'UP' ? '🟢 UP' : '🔴 DOWN';
        if (w.responseTime) extra.responseTime = Math.round(w.responseTime);
        if (w.sslDaysRemaining !== null) extra.sslDays = w.sslDaysRemaining;
      }
    } catch {}
  }

  await sendTelegramAlert(`[${severity}] ${type}`, message, severity, extra);
}

// Check SSL Certificate expiration
function getSslExpiryDays(hostname, port = 443) {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        {
          host: hostname,
          port,
          servername: hostname,
          rejectUnauthorized: false,
          timeout: 5000,
        },
        () => {
          const cert = socket.getPeerCertificate();
          socket.destroy();
          if (cert && cert.valid_to) {
            const validTo = new Date(cert.valid_to);
            const diffDays = Math.ceil((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            resolve({ validTo, daysLeft: diffDays });
          } else {
            resolve(null);
          }
        }
      );
      socket.on('error', () => resolve(null));
      socket.on('timeout', () => {
        socket.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

// Task 1: Check website health
async function runWebsiteChecks() {
  try {
    const websites = await prisma.website.findMany();
    if (websites.length === 0) return;

    for (const site of websites) {
      if (!isSafeUrl(site.url)) continue;

      const startTime = Date.now();
      let status = 'DOWN';
      let statusCode = 0;
      let latencyMs = 0;
      let errorMsg = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), (site.timeoutSeconds || 10) * 1000);
        const res = await fetch(site.url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'VioreCert-Monitor/1.0' },
        });
        clearTimeout(timeout);
        latencyMs = Date.now() - startTime;
        statusCode = res.status;
        status = res.status >= 200 && res.status < 400 ? 'UP' : 'DOWN';
      } catch (err) {
        latencyMs = Date.now() - startTime;
        errorMsg = err.message || 'Connection failed';
        status = 'DOWN';
      }

      // Record check
      await prisma.websiteCheck.create({
        data: {
          websiteId: site.id,
          status,
          statusCode: statusCode || null,
          latencyMs,
          errorMsg,
        },
      });

      // Check SSL if https
      let sslDays = site.sslDaysRemaining;
      let sslExp = site.sslExpiresAt;
      try {
        const parsed = new URL(site.url);
        if (parsed.protocol === 'https:') {
          const sslInfo = await getSslExpiryDays(parsed.hostname, Number(parsed.port) || 443);
          if (sslInfo) {
            sslDays = sslInfo.daysLeft;
            sslExp = sslInfo.validTo;

            if (sslDays <= 14) {
              await triggerAlert({
                websiteId: site.id,
                type: 'SSL_EXPIRING',
                severity: sslDays <= 3 ? 'CRITICAL' : 'WARNING',
                message: `Sertifikat SSL untuk ${site.name} (${site.url}) akan kedaluwarsa dalam ${sslDays} hari!`,
              });
            }
          }
        }
      } catch (e) {
        // ignore SSL check parse error
      }

      // Update website aggregate status
      const failures = status === 'DOWN' ? site.consecutiveFailures + 1 : 0;
      await prisma.website.update({
        where: { id: site.id },
        data: {
          status,
          lastStatusCode: statusCode || null,
          lastResponseTimeMs: latencyMs,
          sslDaysRemaining: sslDays,
          sslExpiresAt: sslExp,
          consecutiveFailures: failures,
          lastCheckedAt: new Date(),
        },
      });

      // Alert if DOWN
      if (status === 'DOWN') {
        await triggerAlert({
          websiteId: site.id,
          type: 'WEBSITE_DOWN',
          severity: 'CRITICAL',
          message: `Website "${site.name}" (${site.url}) tidak dapat diakses (Status: ${statusCode || 'TIMEOUT'}, Error: ${errorMsg || 'None'}).`,
        });
      }
    }
    console.log(`[Worker] Website health check completed for ${websites.length} websites.`);
  } catch (err) {
    console.error('[Worker] Error in runWebsiteChecks:', err.message);
  }
}

// Task 2: Server Heartbeat Watchdog
async function runServerHeartbeatWatchdog() {
  try {
    const timeoutSeconds = 90;
    const thresholdDate = new Date(Date.now() - timeoutSeconds * 1000);

    const staleServers = await prisma.server.findMany({
      where: {
        status: 'ONLINE',
        lastHeartbeat: {
          lt: thresholdDate,
        },
      },
    });

    for (const server of staleServers) {
      await prisma.server.update({
        where: { id: server.id },
        data: { status: 'OFFLINE' },
      });

      await triggerAlert({
        serverId: server.id,
        type: 'SERVER_OFFLINE',
        severity: 'CRITICAL',
        message: `Server "${server.name}" (${server.ipAddress}) tidak merespons atau heartbeat terhenti lebih dari ${timeoutSeconds} detik. Status diubah ke OFFLINE.`,
      });
      console.log(`[Worker] Server ${server.name} marked OFFLINE due to heartbeat timeout.`);
    }
  } catch (err) {
    console.error('[Worker] Error in runServerHeartbeatWatchdog:', err.message);
  }
}

// Task 3: Data retention cleanup (keep last 30 days of metrics)
async function runRetentionCleanup() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedMetrics = await prisma.serverMetric.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    });
    const deletedChecks = await prisma.websiteCheck.deleteMany({
      where: { checkedAt: { lt: thirtyDaysAgo } },
    });
    console.log(`[Worker] Retention cleanup: Purged ${deletedMetrics.count} old metrics and ${deletedChecks.count} old checks.`);
  } catch (err) {
    console.error('[Worker] Error in runRetentionCleanup:', err.message);
  }
}

// Main Scheduler Loop
async function main() {
  console.log('----------------------------------------------------');
  console.log('VioreCert Background Scheduler Worker Started');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('----------------------------------------------------');

  // Initial runs
  await runWebsiteChecks();
  await runServerHeartbeatWatchdog();

  // Periodic intervals
  // 1. Website check every 60 seconds
  setInterval(runWebsiteChecks, 60 * 1000);

  // 2. Server heartbeat watchdog every 30 seconds
  setInterval(runServerHeartbeatWatchdog, 30 * 1000);

  // 3. Data retention cleanup every 24 hours
  setInterval(runRetentionCleanup, 24 * 60 * 60 * 1000);
}

main().catch((err) => {
  console.error('[Worker] Fatal scheduler error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received, disconnecting Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received, disconnecting Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});
