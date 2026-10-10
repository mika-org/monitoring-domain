import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { generateAgentToken } from '@/lib/agent-auth';
import { safeJson } from '@/lib/json-response';

function getDb() {
  if (prisma && prisma.serverAgent) return prisma;
  return new PrismaClient();
}

// POST /api/servers/[id]/token - Rotate or regenerate agent token
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const server = await db.server.findUnique({
      where: { id },
      include: { agent: true },
    });

    if (!server) {
      return safeJson({ success: false, error: 'Server tidak ditemukan' }, { status: 404 });
    }

    const { token, hash } = generateAgentToken();

    await db.serverAgent.upsert({
      where: { serverId: id },
      update: {
        tokenHash: hash,
        status: 'ACTIVE',
      },
      create: {
        serverId: id,
        tokenHash: hash,
        status: 'ACTIVE',
      },
    });

    const host = req.headers.get('host') || 'localhost:3001';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const hubUrl = `${proto}://${host}`;

    const installCommand = `curl -sSL ${hubUrl}/agent/install-agent.sh | sudo bash -s -- --hub ${hubUrl} --token ${token}`;

    return safeJson({
      success: true,
      agentToken: token,
      installCommand,
      message: 'Token agent berhasil dirotasi. Harap jalankan perintah instalasi pada VPS target.',
    });
  } catch (error: any) {
    console.error('Rotate token error:', error);
    return safeJson({ success: false, error: error.message || 'Gagal merotasi token agent' }, { status: 500 });
  }
}
