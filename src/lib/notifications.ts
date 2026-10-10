import { prisma } from './prisma';

interface SendAlertOptions {
  title: string;
  message: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  serverId?: string;
  websiteId?: string;
}

export async function sendTelegramAlert(options: SendAlertOptions): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum dikonfigurasi di environment variable' };
  }

  const icon = options.severity === 'CRITICAL' ? '🚨' : options.severity === 'WARNING' ? '⚠️' : 'ℹ️';
  const text = `${icon} *[VioreCert Monitor Alert]*\n*${options.title}*\n\n${options.message}\n\n_Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB_`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      const errMsg = data.description || 'Gagal mengirim pesan ke Telegram API';
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
