import { NextResponse } from 'next/server';
import { getMonitoredDomains, updateDomainCheckResult } from '@/lib/storage';
import { checkSSL } from '@/lib/ssl-checker';

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await fn(items[index]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function POST() {
  try {
    const domains = await getMonitoredDomains();

    if (domains.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Tidak ada domain untuk diperiksa',
      });
    }

    // Run SSL checks with maximum 5 concurrent connections
    await mapConcurrent(domains, 5, async (item) => {
      try {
        const cert = await checkSSL(item.domain, item.port);
        await updateDomainCheckResult(item.id, cert);
      } catch (err) {
        console.error(`Error checking ${item.domain}:`, err);
      }
    });

    const refreshed = await getMonitoredDomains();
    return NextResponse.json({
      success: true,
      data: refreshed,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memperbarui status SSL domain',
      },
      { status: 500 }
    );
  }
}
