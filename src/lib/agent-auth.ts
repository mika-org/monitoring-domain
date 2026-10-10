import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export function hashAgentToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function generateAgentToken(): { token: string; hash: string } {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const token = `vcert_ag_${randomBytes}`;
  const hash = hashAgentToken(token);
  return { token, hash };
}

export async function verifyAgentToken(authHeader: string | null) {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const token = parts[1];
  const tokenHash = hashAgentToken(token);

  const agent = await prisma.serverAgent.findUnique({
    where: { tokenHash },
    include: { server: true },
  });

  if (!agent || agent.status !== 'ACTIVE') {
    return null;
  }

  return { agent, server: agent.server };
}
