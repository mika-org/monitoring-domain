import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

function getDb() {
  if (prisma && prisma.integration) return prisma;
  return new PrismaClient();
}

// Normalize endpoint to official Biznet Gio portal API if invalid
function getBiznetEndpoint() {
  const envUrl = process.env.BIZNET_API_BASE_URL;
  if (!envUrl || envUrl.includes('api.biznetcloud.com')) {
    return 'https://api.portal.biznetgio.com/v1';
  }
  return envUrl.replace(/\/$/, '');
}

// GET /api/integrations/biznet - Fetch Biznet integration status & config (without exposing API Key)
export async function GET() {
  try {
    const db = getDb();
    const integration = await db.integration.findUnique({
      where: { provider: 'BIZNET' },
    });

    const isEnvConfigured = Boolean(process.env.BIZNET_API_KEY);
    const endpoint = getBiznetEndpoint();

    return NextResponse.json({
      success: true,
      data: {
        provider: 'BIZNET',
        name: integration?.name || 'Biznet GIO Cloud Integration',
        status: isEnvConfigured ? (integration?.status || 'CONNECTED') : 'NOT_CONFIGURED',
        endpoint,
        isEnvConfigured,
        lastSyncedAt: integration?.lastSyncedAt,
      },
    });
  } catch (error: any) {
    console.error('Fetch Biznet integration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/biznet - Test Connection & Sync
export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const apiKey = process.env.BIZNET_API_KEY;
    const endpoint = getBiznetEndpoint();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'BIZNET_API_KEY belum dikonfigurasi pada environment variable (.env). Sesuai aturan keamanan, kredensial tidak disimpan di browser.',
          status: 'NOT_CONFIGURED',
        },
        { status: 400 }
      );
    }

    // Perform live connection test with timeout using official Biznet Gio x-token header
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let testStatus = 'CONNECTED';
    let message = 'Koneksi ke Biznet GIO Cloud API berhasil (HTTP 200 OK)';

    try {
      // Test with /baremetals/products per official Biznet Gio OpenAPI spec
      const testUrl = `${endpoint}/baremetals/products`;
      const res = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'x-token': apiKey.trim(),
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      if (res.ok) {
        testStatus = 'CONNECTED';
        message = 'Koneksi ke Biznet GIO Cloud API berhasil dan terverifikasi (HTTP 200 OK)';
      } else if (res.status === 401 || res.status === 403) {
        testStatus = 'DISCONNECTED';
        message = 'Autentikasi gagal: Token API Biznet tidak valid atau kedaluwarsa (HTTP 401/403)';
      } else {
        testStatus = 'DISCONNECTED';
        message = `Gagal menghubungkan ke Biznet API: HTTP ${res.status}`;
      }
    } catch (err: any) {
      testStatus = 'DISCONNECTED';
      message = `Koneksi timeout atau gagal: ${err.message}`;
    } finally {
      clearTimeout(timeout);
    }

    const now = new Date();
    await db.integration.upsert({
      where: { provider: 'BIZNET' },
      update: {
        status: testStatus,
        lastSyncedAt: now,
      },
      create: {
        name: 'Biznet GIO Cloud Integration',
        provider: 'BIZNET',
        status: testStatus,
        lastSyncedAt: now,
      },
    });

    return NextResponse.json({
      success: testStatus === 'CONNECTED',
      status: testStatus,
      message,
      lastSyncedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Biznet integration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
