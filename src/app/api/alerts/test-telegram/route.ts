import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendTelegramAlert } from '@/lib/notifications';

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
