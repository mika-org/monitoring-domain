import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const services = await prisma.nginxService.findMany({
      include: {
        server: {
          select: { id: true, name: true, ipAddress: true, status: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error: any) {
    console.error('Fetch Nginx services error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
