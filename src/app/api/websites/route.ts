import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import https from 'https';
import http from 'http';

// Helper to check website health & response time with SSRF protection
async function checkWebsiteHealth(urlStr: string): Promise<{
  statusCode: number | null;
  responseTime: number;
  status: 'UP' | 'DOWN' | 'WARNING';
  error: string | null;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    try {
      const parsed = new URL(urlStr);

      // SSRF protection: block localhost, 127.0.0.1, internal metadata IPs
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '169.254.169.254' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('172.16.')
      ) {
        return resolve({
          statusCode: null,
          responseTime: 0,
          status: 'DOWN',
          error: 'SSRF Blocked: URL lokal/privat tidak diizinkan',
        });
      }

      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.request(
        urlStr,
        {
          method: 'GET',
          timeout: 10000,
          headers: { 'User-Agent': 'VioreCert-Monitor/1.0' },
        },
        (res) => {
          const responseTime = Date.now() - startTime;
          const code = res.statusCode || 0;
          const isUp = code >= 200 && code < 400;
          resolve({
            statusCode: code,
            responseTime,
            status: isUp ? 'UP' : 'WARNING',
            error: isUp ? null : `HTTP status code ${code}`,
          });
        }
      );

      req.on('error', (err) => {
        resolve({
          statusCode: null,
          responseTime: Date.now() - startTime,
          status: 'DOWN',
          error: err.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          statusCode: null,
          responseTime: Date.now() - startTime,
          status: 'DOWN',
          error: 'Request timeout (10s)',
        });
      });

      req.end();
    } catch (e: any) {
      resolve({
        statusCode: null,
        responseTime: 0,
        status: 'DOWN',
        error: e.message || 'Invalid URL',
      });
    }
  });
}

// GET /api/websites
export async function GET() {
  try {
    const websites = await prisma.website.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 10,
        },
      },
    });

    return NextResponse.json({ success: true, data: websites });
  } catch (error: any) {
    console.error('Fetch websites error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/websites
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { url, name, interval } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL website wajib diisi' }, { status: 400 });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const websiteName = name?.trim() || new URL(url).hostname;
    const initialCheck = await checkWebsiteHealth(url);

    const website = await prisma.website.create({
      data: {
        url: url.trim(),
        name: websiteName,
        interval: Number(interval) || 60,
        status: initialCheck.status,
        statusCode: initialCheck.statusCode,
        responseTime: initialCheck.responseTime,
        lastCheckedAt: new Date(),
        checks: {
          create: {
            statusCode: initialCheck.statusCode,
            responseTime: initialCheck.responseTime,
            status: initialCheck.status,
            error: initialCheck.error,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: website });
  } catch (error: any) {
    console.error('Create website error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gagal menambahkan website' }, { status: 500 });
  }
}
