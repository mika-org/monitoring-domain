import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { safeJson } from '@/lib/json-response';

function getDb() {
  if (prisma && prisma.pm2Process) return prisma;
  return new PrismaClient();
}

export async function GET() {
  try {
    const db = getDb();
    const processes = await db.pm2Process.findMany({
      orderBy: [{ serverId: 'asc' }, { name: 'asc' }],
      include: {
        server: {
          select: { id: true, name: true, ipAddress: true, status: true },
        },
      },
    });

    return safeJson({ success: true, data: processes });
  } catch (error: any) {
    console.error('Fetch PM2 processes error:', error);
    return safeJson({ success: false, error: error.message }, { status: 500 });
  }
}
