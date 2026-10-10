import { NextRequest, NextResponse } from 'next/server';
import { batchAddMonitoredDomains, updateDomainCheckResult, getMonitoredDomains } from '@/lib/storage';
import { checkSSL } from '@/lib/ssl-checker';
import { batchDomainSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = batchDomainSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Input tidak valid';
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { domains } = parseResult.data;

    const { added, skipped } = await batchAddMonitoredDomains(domains);

    // Immediately run checks on newly added domains
    await Promise.all(
      added.map(async (item) => {
        try {
          const cert = await checkSSL(item.domain, item.port);
          await updateDomainCheckResult(item.id, cert);
        } catch (err) {
          console.error(`Error initial check on ${item.domain}:`, err);
        }
      })
    );

    const refreshed = await getMonitoredDomains();

    return NextResponse.json({
      success: true,
      data: refreshed,
      addedCount: added.length,
      skippedCount: skipped,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memproses penambahan batch domain',
      },
      { status: 500 }
    );
  }
}
