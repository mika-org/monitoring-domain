import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendTelegramAlert } from '@/lib/notifications';

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

// POST /api/alerts/test-telegram - Send test alert
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendTelegramAlert({
    title: 'Uji Coba Notifikasi',
    message: 'Koneksi Telegram Bot VioreCert Monitor berhasil dikonfigurasi dengan sukses! Sistem siap mengirim peringatan insiden.',
    severity: 'INFO',
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'Pesan tes berhasil dikirim ke Telegram' });
}
