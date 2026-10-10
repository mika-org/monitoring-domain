import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAgentToken } from '@/lib/agent-auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const auth = await verifyAgentToken(authHeader);

    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Agent Token' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date();

    // Update agent last seen
    await prisma.serverAgent.update({
      where: { id: auth.agent.id },
      data: {
        lastSeenAt: now,
        version: body.version || auth.agent.version,
      },
    });

    // Update server status
    await prisma.server.update({
      where: { id: auth.server.id },
      data: {
        lastHeartbeat: now,
        status: 'ONLINE',
        agentStatus: 'ACTIVE',
        uptime: body.uptime !== undefined ? BigInt(Math.floor(Number(body.uptime))) : auth.server.uptime,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Heartbeat acknowledged',
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Agent heartbeat error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
