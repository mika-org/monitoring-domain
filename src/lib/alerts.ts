import { prisma } from './prisma';
import { sendTelegramAlert } from './notifications';

interface TriggerAlertParams {
  serverId?: string;
  websiteId?: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  cooldownMinutes?: number;
}

export async function triggerAlert(params: TriggerAlertParams) {
  const cooldown = params.cooldownMinutes ?? 15;
  const cutoff = new Date(Date.now() - cooldown * 60 * 1000);

  // Check if an identical alert already exists that is TRIGGERED or ACKNOWLEDGED recently
  const existing = await prisma.alert.findFirst({
    where: {
      serverId: params.serverId || null,
      websiteId: params.websiteId || null,
      type: params.type,
      status: { in: ['TRIGGERED', 'ACKNOWLEDGED'] },
      triggeredAt: { gte: cutoff },
    },
    orderBy: { triggeredAt: 'desc' },
  });

  if (existing) {
    // Cooldown active, don't spam
    return existing;
  }

  // Create alert
  const alert = await prisma.alert.create({
    data: {
      serverId: params.serverId || null,
      websiteId: params.websiteId || null,
      type: params.type,
      severity: params.severity,
      message: params.message,
      status: 'TRIGGERED',
    },
  });

  // Dispatch notification asynchronously
  sendTelegramAlert({
    title: `[${params.severity}] ${params.type}`,
    message: params.message,
    severity: params.severity,
    serverId: params.serverId,
    websiteId: params.websiteId,
  }).catch((err) => console.error('Telegram dispatch error:', err));

  return alert;
}
