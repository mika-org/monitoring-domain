import { NextRequest, NextResponse } from 'next/server';
import { checkSSL, parseDomainInput } from '@/lib/ssl-checker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, port } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Domain harus diisi berupa string' },
        { status: 400 }
      );
    }

    const parsed = parseDomainInput(domain);
    const targetPort = port ? Number(port) : parsed.port;
    const certInfo = await checkSSL(parsed.host, targetPort);

    return NextResponse.json({
      success: true,
      data: certInfo,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan saat memeriksa SSL',
      },
      { status: 500 }
    );
  }
}
