import { MonitoredDomain, SSLCertificateInfo } from '@/types/ssl';
import { parseDomainInput } from './ssl-checker';
import { prisma } from './prisma';

function mapDbToDomain(row: {
  id: string;
  domain: string;
  port: number;
  alias: string | null;
  lastCheck: unknown;
  createdAt: Date;
  updatedAt: Date;
}): MonitoredDomain {
  return {
    id: row.id,
    domain: row.domain,
    port: row.port,
    alias: row.alias || undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastCheck: (row.lastCheck as unknown as SSLCertificateInfo) || null,
  };
}

export async function getMonitoredDomains(): Promise<MonitoredDomain[]> {
  try {
    const list = await prisma.monitoredDomain.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return list.map(mapDbToDomain);
  } catch (error) {
    console.error('Error fetching domains from database:', error);
    return [];
  }
}

export async function addMonitoredDomain(
  rawInput: string,
  customPort?: number,
  alias?: string
): Promise<{ domain: MonitoredDomain; isDuplicate: boolean }> {
  const parsed = parseDomainInput(rawInput);
  const host = parsed.host;
  const port = customPort || parsed.port || 443;

  if (!host) {
    throw new Error('Nama domain tidak valid');
  }

  const existing = await prisma.monitoredDomain.findUnique({
    where: {
      domain_port: {
        domain: host,
        port,
      },
    },
  });

  if (existing) {
    return { domain: mapDbToDomain(existing), isDuplicate: true };
  }

  const created = await prisma.monitoredDomain.create({
    data: {
      domain: host,
      port,
      alias: alias?.trim() || null,
    },
  });

  return { domain: mapDbToDomain(created), isDuplicate: false };
}

export async function updateDomainCheckResult(
  id: string,
  certInfo: SSLCertificateInfo
): Promise<MonitoredDomain | null> {
  try {
    const updated = await prisma.monitoredDomain.update({
      where: { id },
      data: {
        lastCheck: certInfo as unknown as object,
      },
    });
    return mapDbToDomain(updated);
  } catch (error) {
    console.error(`Error updating domain check result for id ${id}:`, error);
    return null;
  }
}

export async function deleteMonitoredDomain(id: string): Promise<boolean> {
  try {
    await prisma.monitoredDomain.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error(`Error deleting domain id ${id}:`, error);
    return false;
  }
}

export async function batchAddMonitoredDomains(
  domainsRaw: string[]
): Promise<{ added: MonitoredDomain[]; skipped: number }> {
  const added: MonitoredDomain[] = [];
  let skipped = 0;

  for (const raw of domainsRaw) {
    const parsed = parseDomainInput(raw);
    const host = parsed.host;
    const port = parsed.port || 443;

    if (!host) {
      skipped++;
      continue;
    }

    try {
      const existing = await prisma.monitoredDomain.findUnique({
        where: {
          domain_port: {
            domain: host,
            port,
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const created = await prisma.monitoredDomain.create({
        data: {
          domain: host,
          port,
        },
      });

      added.push(mapDbToDomain(created));
    } catch {
      skipped++;
    }
  }

  return { added, skipped };
}
