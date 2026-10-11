import { prisma } from './prisma';

interface SendAlertOptions {
  title: string;
  message: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  serverId?: string;
  websiteId?: string;
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
