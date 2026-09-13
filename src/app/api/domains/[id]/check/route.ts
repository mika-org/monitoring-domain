import { NextRequest, NextResponse } from 'next/server';
import { getMonitoredDomains, updateDomainCheckResult } from '@/lib/storage';
import { checkSSL } from '@/lib/ssl-checker';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const domains = await getMonitoredDomains();
    const target = domains.find((d) => d.id === id);

    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Domain tidak ditemukan' },
        { status: 404 }
      );
    }

    const certInfo = await checkSSL(target.domain, target.port);
    const updated = await updateDomainCheckResult(target.id, certInfo);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memeriksa ulang SSL domain',
      },
      { status: 500 }
    );
  }
}
