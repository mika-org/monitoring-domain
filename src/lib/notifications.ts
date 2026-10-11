import { prisma } from './prisma';

export interface SendAlertOptions {
  title: string;
  message: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  serverId?: string;
  websiteId?: string;
  customText?: string;
  parseMode?: 'HTML' | 'Markdown';
  meta?: {
    repository?: string;
    branch?: string;
    committer?: string;
    commitMessage?: string;
    commitUrl?: string;
    serverIp?: string;
    serverName?: string;
    serverStatus?: string;
    cpu?: number | string;
    ram?: number | string;
    disk?: string;
    pm2Count?: number;
    appPort?: string | number;
    appLink?: string;
    duration?: string;
    statusText?: string;
    [key: string]: any;
  };
}

export async function sendTelegramAlert(options: SendAlertOptions): Promise<{ success: boolean; error?: string }> {
  let token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');
  let chatId = (process.env.TELEGRAM_CHAT_ID || '').trim().replace(/^["']|["']$/g, '');

  // Strip accidental "bot" prefix from token if present (e.g. "bot123456:ABC..." -> "123456:ABC...")
  if (token.toLowerCase().startsWith('bot')) {
    token = token.slice(3).trim();
  }

  // Strip accidental "bot" prefix from chatId if present
  if (chatId.toLowerCase().startsWith('bot')) {
    chatId = chatId.slice(3).trim();
  }

  if (!token || !chatId) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum dikonfigurasi di environment variable' };
  }

  // Prevent sending to bot itself
  const botId = token.split(':')[0];
  if (chatId === botId) {
    return {
      success: false,
      error: `TELEGRAM_CHAT_ID (${chatId}) terisi ID bot. Bot Telegram tidak dapat mengirim pesan ke dirinya sendiri. Silakan masukkan Chat ID akun Telegram pribadi Anda (misal didapat dari @userinfobot) atau ID grup.`,
    };
  }

  let text = options.customText;

  if (!text) {
    const isCritical = options.severity === 'CRITICAL';
    const isWarning = options.severity === 'WARNING';
    const headerEmoji = isCritical ? '🚨' : isWarning ? '⚠️' : '🚀';
    const statusEmoji = isCritical ? '❌' : isWarning ? '⚠️' : '✅';
    const statusText = options.meta?.statusText || (isCritical ? 'CRITICAL INCIDENT DETECTED' : isWarning ? 'WARNING THRESHOLD EXCEEDED' : 'SYSTEM NOTIFICATION');

    const repo = options.meta?.repository || 'mika-org/monitoring-domain';
    const branch = options.meta?.branch || 'master';
    const appPort = options.meta?.appPort || '3009';
    const appLink = options.meta?.appLink || 'https://monitoring-domain.elevore.web.id';

    const lines: string[] = [
      `${headerEmoji} <b>${options.title}</b>`,
      '',
      `${statusEmoji} <b>${statusText}</b>`,
      '',
      `📦 <b>Repository:</b> <code>${repo}</code>`,
      `🌿 <b>Branch:</b> <code>${branch}</code>`,
    ];

    if (options.meta?.committer) {
      lines.push(`👤 <b>Committer:</b> ${options.meta.committer}`);
    }

    if (options.meta?.commitMessage) {
      lines.push('');
      lines.push(`📝 <b>Commit:</b>`);
      lines.push(options.meta.commitMessage);
    }

    if (options.meta?.commitUrl) {
      lines.push('');
      lines.push(`🔗 <b>Commit:</b>`);
      lines.push(options.meta.commitUrl);
    }

    let serverRendered = false;
    if (options.meta?.serverIp || options.meta?.serverName) {
      lines.push('');
      lines.push(`🖥 <b>Server:</b>`);
      const srvTitle = [options.meta.serverIp, options.meta.serverName ? `(${options.meta.serverName})` : ''].filter(Boolean).join(' ');
      lines.push(srvTitle);
      if (options.meta.serverStatus) lines.push(`• <b>Status:</b> ${options.meta.serverStatus}`);
      if (options.meta.cpu !== undefined) lines.push(`• <b>CPU Usage:</b> ${options.meta.cpu}%`);
      if (options.meta.ram !== undefined) lines.push(`• <b>RAM Usage:</b> ${options.meta.ram}%`);
      if (options.meta.pm2Count !== undefined) lines.push(`• <b>PM2 Processes:</b> ${options.meta.pm2Count} processes`);
      serverRendered = true;
    } else if (options.serverId) {
      try {
        const srv = await prisma.server.findUnique({
          where: { id: options.serverId },
          include: { metrics: { orderBy: { timestamp: 'desc' }, take: 1 } },
        });
        if (srv) {
          lines.push('');
          lines.push(`🖥 <b>Server:</b>`);
          lines.push(`${srv.ipAddress} (${srv.name})`);
          lines.push(`• <b>Status:</b> ${srv.status === 'ONLINE' ? '🟢 ONLINE' : srv.status === 'WARNING' ? '⚠️ WARNING' : '🔴 OFFLINE'}`);
          if (srv.metrics[0]) {
            lines.push(`• <b>CPU Usage:</b> ${srv.metrics[0].cpuUsage.toFixed(1)}%`);
            lines.push(`• <b>RAM Usage:</b> ${srv.metrics[0].ramUsagePercent.toFixed(1)}%`);
          }
          serverRendered = true;
        }
      } catch {}
    }

    if (!serverRendered) {
      lines.push('');
      lines.push(`🖥 <b>Server:</b>`);
      lines.push('103.93.162.19');
    }

    if (options.websiteId) {
      try {
        const web = await prisma.website.findUnique({ where: { id: options.websiteId } });
        if (web) {
          lines.push('');
          lines.push(`🌐 <b>Target Website:</b>`);
          lines.push(`${web.name} (${web.url})`);
          lines.push(`• <b>Status:</b> ${web.status}`);
          if (web.responseTime) lines.push(`• <b>Response Time:</b> ${Math.round(web.responseTime)}ms`);
          if (web.sslDaysRemaining !== null) lines.push(`• <b>SSL Remaining:</b> ${web.sslDaysRemaining} days`);
        }
      } catch {}
    }

    if (options.message) {
      lines.push('');
      lines.push(`📝 <b>Detail:</b>`);
      lines.push(options.message);
    }

    lines.push('');
    lines.push(`🌐 <b>Application Port:</b> <code>${appPort}</code>`);
    lines.push(`🌐 <b>Application Link:</b> ${appLink}`);

    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\./g, ':');
    lines.push('');
    lines.push(`🕒 <b>Finished:</b> ${now} WIB`);
    if (options.meta?.duration) {
      lines.push(`⏱️ <b>Duration:</b> ${options.meta.duration}`);
    }

    lines.push('');
    lines.push(`🚀 <b>Status:</b> ${statusEmoji} ${options.severity || 'SUCCESS'}`);

    text = lines.join('\n');
  }

  const parseMode = options.parseMode || 'HTML';

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      let errMsg = data.description || 'Gagal mengirim pesan ke Telegram API';
      if (errMsg === 'Not Found') {
        errMsg = 'Telegram API merespons "Not Found" (404). Ini biasanya terjadi jika TELEGRAM_BOT_TOKEN di .env salah atau diawali prefix "bot". Pastikan token berformat angka:token (contoh: 8841464386:AAFw49...).';
      }
      await logNotification('TELEGRAM', false, errMsg);
      return { success: false, error: errMsg };
    }

    await logNotification('TELEGRAM', true);
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown network error';
    await logNotification('TELEGRAM', false, errMsg);
    return { success: false, error: errMsg };
  }
}

async function logNotification(channelType: 'TELEGRAM' | 'EMAIL' | 'WEBHOOK', success: boolean, errorMsg?: string) {
  try {
    // Cari atau buat channel log
    let channel = await prisma.notificationChannel.findFirst({
      where: { type: channelType },
    });

    if (!channel) {
      channel = await prisma.notificationChannel.create({
        data: {
          name: channelType === 'TELEGRAM' ? 'Default Telegram' : channelType,
          type: channelType,
          config: {},
          isEnabled: true,
        },
      });
    }

    await prisma.notificationLog.create({
      data: {
        channelId: channel.id,
        status: success ? 'SENT' : 'FAILED',
        error: errorMsg || null,
      },
    });
  } catch (e) {
    console.error('Failed to write notification log:', e);
  }
}
