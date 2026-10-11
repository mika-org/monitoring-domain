import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendTelegramAlert } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { execSync } from 'child_process';

// GET /api/alerts/test-telegram - Helper to inspect Bot Info and recent chat IDs from getUpdates
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let token = (process.env.TELEGRAM_BOT_TOKEN || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^bot/i, '');
  if (!token) {
    return NextResponse.json({ success: false, error: 'TELEGRAM_BOT_TOKEN belum diisi di .env' }, { status: 400 });
  }

  try {
    const [meRes, updatesRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token}/getMe`),
      fetch(`https://api.telegram.org/bot${token}/getUpdates`),
    ]);

    const meData = await meRes.json();
    const updatesData = await updatesRes.json();

    const botUsername = meData.result?.username || 'Unknown';
    const rawUpdates = updatesData.result || [];

    const foundChats: Array<{ chatId: number | string; name: string; username?: string }> = [];
    const seen = new Set();

    for (const u of rawUpdates) {
      const msg = u.message || u.channel_post || u.my_chat_member;
      const chat = msg?.chat;
      if (chat && !seen.has(chat.id)) {
        seen.add(chat.id);
        foundChats.push({
          chatId: chat.id,
          name: chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || 'User',
          username: chat.username,
        });
      }
    }

    return NextResponse.json({
      success: true,
      botUsername,
      botId: meData.result?.id,
      configuredChatId: process.env.TELEGRAM_CHAT_ID,
      foundChats,
      instruction:
        foundChats.length > 0
          ? 'Salin salah satu chatId di atas ke TELEGRAM_CHAT_ID pada file .env Anda.'
          : `Buka Telegram, cari @${botUsername}, klik tombol "Start", lalu muat ulang halaman ini untuk melihat Chat ID Anda.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/alerts/test-telegram - Send test alert with existing server data
export async function POST() {
  const startTime = Date.now();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Retrieve git metadata with fallback
  let commitHash = '3b01c78bffd7f066fac1c905e7eca27f3bbbf988';
  let branch = 'master';
  let committer = session.name || session.username || 'aditiamuchlis';
  let commitMsg = 'fix(telegram): auto strip bot prefix and quotes, handle Telegram Not Found error';

  try {
    const gitHash = execSync('git rev-parse HEAD', { timeout: 1500 }).toString().trim();
    if (gitHash) commitHash = gitHash;
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { timeout: 1500 }).toString().trim();
    if (gitBranch) branch = gitBranch;
    const gitCommitter = execSync('git log -1 --format=%an', { timeout: 1500 }).toString().trim();
    if (gitCommitter) committer = gitCommitter;
    const gitMsg = execSync('git log -1 --format=%s', { timeout: 1500 }).toString().trim();
    if (gitMsg) commitMsg = gitMsg;
  } catch {
    // Keep defaults if git CLI unavailable in current environment
  }

  const commitUrl = `https://github.com/mika-org/monitoring-domain/commit/${commitHash}`;

  // Query existing servers and websites from database
  let servers: any[] = [];
  let totalWebsites = 0;
  let upWebsites = 0;
  let downWebsites = 0;

  try {
    [servers, totalWebsites, upWebsites, downWebsites] = await Promise.all([
      prisma.server.findMany({
        include: {
          metrics: { orderBy: { timestamp: 'desc' }, take: 1 },
          pm2Processes: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.website.count(),
      prisma.website.count({ where: { status: 'UP' } }),
      prisma.website.count({ where: { status: 'DOWN' } }),
    ]);
  } catch (err) {
    console.error('Error fetching existing servers/websites:', err);
  }

  // Format existing server section
  let serverSection = '';
  if (servers.length === 0) {
    serverSection = `🖥 <b>Server:</b>\n103.93.162.19 (Belum ada server terdaftar di database)`;
  } else if (servers.length === 1) {
    const s = servers[0];
    const m = s.metrics[0];
    const statusBadge = s.status === 'ONLINE' ? '🟢 ONLINE' : s.status === 'WARNING' ? '⚠️ WARNING' : '🔴 OFFLINE';
    const cpu = m ? `${m.cpuUsage.toFixed(1)}%` : 'N/A';
    const ram = m ? `${m.ramUsagePercent.toFixed(1)}% (${m.ramUsed.toFixed(2)} GB / ${m.ramTotal.toFixed(2)} GB)` : 'N/A';
    const pm2Count = s.pm2Processes?.length ?? 0;
    const heartbeatTime = s.lastHeartbeat
      ? new Date(s.lastHeartbeat).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\./g, ':') + ' WIB'
      : '-';

    serverSection = [
      `🖥 <b>Server:</b>`,
      `${s.ipAddress} (${s.name})`,
      `• <b>Status:</b> ${statusBadge}`,
      `• <b>CPU Usage:</b> ${cpu}`,
      `• <b>RAM Usage:</b> ${ram}`,
      `• <b>PM2 Processes:</b> ${pm2Count} active processes`,
      `• <b>Last Heartbeat:</b> ${heartbeatTime}`,
    ].join('\n');
  } else {
    serverSection = [
      `🖥 <b>Servers Infrastructure (${servers.length} Nodes):</b>`,
      ...servers.map((s) => {
        const m = s.metrics[0];
        const statusBadge = s.status === 'ONLINE' ? '🟢 ONLINE' : s.status === 'WARNING' ? '⚠️ WARNING' : '🔴 OFFLINE';
        const cpu = m ? `${m.cpuUsage.toFixed(1)}%` : '-';
        const ram = m ? `${m.ramUsagePercent.toFixed(1)}%` : '-';
        const pm2 = s.pm2Processes?.length ?? 0;
        return `• <b>${s.name}</b> (${s.ipAddress})\n  ${statusBadge} | CPU: ${cpu} | RAM: ${ram} | PM2: ${pm2} proc`;
      }),
    ].join('\n');
  }

  const durationMs = Date.now() - startTime;
  const durationStr = durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`;
  const finishedTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\./g, ':') + ' WIB';

  // Construct modern alert message
  const modernMessage = [
    '🚀 <b>Deploy &amp; Monitoring Notification</b>',
    '',
    '✅ <b>Alert Channel Verified (Diagnostic Test)</b>',
    '',
    '📦 <b>Repository:</b> <code>mika-org/monitoring-domain</code>',
    `🌿 <b>Branch:</b> <code>${branch}</code>`,
    `👤 <b>Committer:</b> ${committer}`,
    '',
    '📝 <b>Commit:</b>',
    commitMsg,
    '',
    '🔗 <b>Commit:</b>',
    commitUrl,
    '',
    serverSection,
    '',
    '🌐 <b>Application Port:</b> <code>3009</code>',
    '🌐 <b>Application Link:</b> https://monitoring-domain.elevore.web.id',
    `🌐 <b>Monitored Websites:</b> ${totalWebsites} Targets (${upWebsites} UP, ${downWebsites} DOWN)`,
    '',
    `🕒 <b>Finished:</b> ${finishedTime}`,
    `⏱️ <b>Duration:</b> ${durationStr}`,
    '',
    '🚀 <b>Status:</b> ✅ SUCCESS',
  ].join('\n');

  const result = await sendTelegramAlert({
    title: 'Deploy & Monitoring Notification',
    message: 'Alert Channel Verified',
    severity: 'INFO',
    customText: modernMessage,
    parseMode: 'HTML',
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: 'Pesan tes dengan data existing server berhasil dikirim ke Telegram',
    data: {
      serverCount: servers.length,
      websiteCount: totalWebsites,
      branch,
      committer,
    },
  });
}

