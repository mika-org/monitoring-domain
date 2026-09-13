import fs from 'node:fs/promises';
import path from 'node:path';
import { MonitoredDomain, SSLCertificateInfo } from '@/types/ssl';
import { parseDomainInput } from './ssl-checker';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILENAME = process.env.DATA_STORAGE_FILENAME || 'domains.json';
const DATA_FILE = path.join(DATA_DIR, DATA_FILENAME);

const INITIAL_DOMAINS: Array<{ domain: string; port: number; alias?: string }> = [
  { domain: 'google.com', port: 443, alias: 'Google Search' },
  { domain: 'github.com', port: 443, alias: 'GitHub' },
  { domain: 'cloudflare.com', port: 443, alias: 'Cloudflare' },
  { domain: 'wikipedia.org', port: 443, alias: 'Wikipedia' },
];

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      // File does not exist, initialize with empty array or seed domains
      const initialData: MonitoredDomain[] = INITIAL_DOMAINS.map((item, idx) => ({
        id: `seed-${idx + 1}-${Date.now()}`,
        domain: item.domain,
        port: item.port,
        alias: item.alias,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastCheck: null,
      }));
      await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error ensuring data file:', error);
  }
}

export async function getMonitoredDomains(): Promise<MonitoredDomain[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error reading domains file:', error);
    return [];
  }
}

export async function saveMonitoredDomains(domains: MonitoredDomain[]): Promise<void> {
  await ensureDataFile();
  const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
  await fs.writeFile(tempFile, JSON.stringify(domains, null, 2), 'utf-8');
  await fs.rename(tempFile, DATA_FILE);
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

  const list = await getMonitoredDomains();
  const existing = list.find((item) => item.domain === host && item.port === port);
  if (existing) {
    return { domain: existing, isDuplicate: true };
  }

  const now = new Date().toISOString();
  const newDomain: MonitoredDomain = {
    id: `dom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    domain: host,
    port,
    alias: alias?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    lastCheck: null,
  };

  list.unshift(newDomain);
  await saveMonitoredDomains(list);
  return { domain: newDomain, isDuplicate: false };
}

export async function updateDomainCheckResult(
  id: string,
  certInfo: SSLCertificateInfo
): Promise<MonitoredDomain | null> {
  const list = await getMonitoredDomains();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    updatedAt: new Date().toISOString(),
    lastCheck: certInfo,
  };

  await saveMonitoredDomains(list);
  return list[index];
}

export async function deleteMonitoredDomain(id: string): Promise<boolean> {
  const list = await getMonitoredDomains();
  const filtered = list.filter((item) => item.id !== id);
  if (filtered.length === list.length) {
    return false;
  }
  await saveMonitoredDomains(filtered);
  return true;
}

export async function batchAddMonitoredDomains(
  domainsRaw: string[]
): Promise<{ added: MonitoredDomain[]; skipped: number }> {
  const list = await getMonitoredDomains();
  const added: MonitoredDomain[] = [];
  let skipped = 0;

  const now = new Date().toISOString();

  for (const raw of domainsRaw) {
    const parsed = parseDomainInput(raw);
    const host = parsed.host;
    const port = parsed.port || 443;
    if (!host) {
      skipped++;
      continue;
    }

    const exists = list.some((item) => item.domain === host && item.port === port);
    if (exists) {
      skipped++;
      continue;
    }

    const newDom: MonitoredDomain = {
      id: `dom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      domain: host,
      port,
      createdAt: now,
      updatedAt: now,
      lastCheck: null,
    };

    list.unshift(newDom);
    added.push(newDom);
  }

  if (added.length > 0) {
    await saveMonitoredDomains(list);
  }

  return { added, skipped };
}
