import { NextRequest, NextResponse } from 'next/server';
import {
  getMonitoredDomains,
  addMonitoredDomain,
  deleteMonitoredDomain,
  updateDomainCheckResult,
} from '@/lib/storage';
import { checkSSL } from '@/lib/ssl-checker';
import { addDomainSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const domains = await getMonitoredDomains();

    // Check if auto-refresh is requested or if initial items have no lastCheck
    const { searchParams } = new URL(request.url);
    const autoCheckUnchecked = searchParams.get('init') === 'true';

    if (autoCheckUnchecked) {
      const unchecked = domains.filter((d) => !d.lastCheck);
      if (unchecked.length > 0) {
        await Promise.all(
          unchecked.map(async (item) => {
            try {
              const info = await checkSSL(item.domain, item.port);
              await updateDomainCheckResult(item.id, info);
            } catch (err) {
              console.error(`Failed auto-checking ${item.domain}:`, err);
            }
          })
        );
        const refreshed = await getMonitoredDomains();
        return NextResponse.json({ success: true, data: refreshed });
      }
    }

    return NextResponse.json({
      success: true,
      data: domains,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal mengambil data domain',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = addDomainSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Input tidak valid';
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { domain, port, alias } = parseResult.data;

    const { domain: newDomain, isDuplicate } = await addMonitoredDomain(domain, port, alias);

    // Immediately run SSL check for this domain
    const certInfo = await checkSSL(newDomain.domain, newDomain.port);
    const updated = await updateDomainCheckResult(newDomain.id, certInfo);

    return NextResponse.json({
      success: true,
      data: updated || newDomain,
      isDuplicate,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menambahkan domain',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Parameter ID wajib disertakan' },
        { status: 400 }
      );
    }

    const deleted = await deleteMonitoredDomain(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Domain dengan ID tersebut tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Domain berhasil dihapus dari pemantauan',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghapus domain',
      },
      { status: 500 }
    );
  }
}
