#!/usr/bin/env node

/**
 * VioreCert Server Monitoring Agent
 * Lightweight system, PM2, and Nginx monitoring agent for Ubuntu servers.
 * Runs HTTP server on port 3010 and periodically pushes metrics to the dashboard.
 */

const os = require('os');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const { exec } = require('child_process');

// Configuration from environment or command line
const AGENT_PORT = parseInt(process.env.VIORECERT_AGENT_PORT || process.env.PORT || '3010', 10);
let DASHBOARD_URL = process.env.VIORECERT_DASHBOARD_URL || process.argv[2] || 'http://localhost:3001';
let AGENT_TOKEN = process.env.VIORECERT_AGENT_TOKEN || process.argv[3];
const INTERVAL_SECONDS = parseInt(process.env.VIORECERT_INTERVAL || '15', 10);

// Check if token stored in local file if not passed in argv/env
const tokenFilePath = path.resolve(__dirname, '.agent-token');
if (!AGENT_TOKEN && fs.existsSync(tokenFilePath)) {
  AGENT_TOKEN = fs.readFileSync(tokenFilePath, 'utf8').trim();
}

let prevCpuInfo = null;
let prevNetInfo = null;
let prevNetTime = null;
let latestPayload = null;
let lastSentTime = null;
let lastSendStatus = 'WAITING';
let lastSendError = null;

// Exec promise helper
function runCmd(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 8000 }, (error, stdout) => {
      if (error) return resolve(null);
      resolve(stdout.trim());
    });
  });
}

// 1. Calculate CPU Usage percentage
function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  if (!prevCpuInfo) {
    prevCpuInfo = { idle: totalIdle, total: totalTick };
    return 0;
  }

  const idleDiff = totalIdle - prevCpuInfo.idle;
  const totalDiff = totalTick - prevCpuInfo.total;
  prevCpuInfo = { idle: totalIdle, total: totalTick };

  if (totalDiff === 0) return 0;
  const usage = 100 - (idleDiff / totalDiff) * 100;
  return Math.max(0, Math.min(100, parseFloat(usage.toFixed(2))));
}

// 2. RAM Usage
function getRamUsage() {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;

  const totalGB = parseFloat((totalBytes / (1024 * 1024 * 1024)).toFixed(2));
  const usedGB = parseFloat((usedBytes / (1024 * 1024 * 1024)).toFixed(2));
  const usagePercent = parseFloat(((usedBytes / totalBytes) * 100).toFixed(2));

  return { total: totalGB, used: usedGB, usagePercent };
}

// 3. Disk Usage (/bin/df -hP)
async function getDiskUsage() {
  const output = await runCmd('df -hP');
  if (!output) return [];

  const lines = output.split('\n').slice(1);
  const mounts = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 6 && parts[0].startsWith('/dev/')) {
      mounts.push({
        filesystem: parts[0],
        size: parts[1],
        used: parts[2],
        available: parts[3],
        usePercent: parseInt(parts[4].replace('%', ''), 10) || 0,
        mount: parts[5],
      });
    }
  }

  return mounts;
}

// 4. Network throughput via /proc/net/dev
function getNetworkThroughput() {
  try {
    if (!fs.existsSync('/proc/net/dev')) return { in: 0, out: 0 };
    const content = fs.readFileSync('/proc/net/dev', 'utf8');
    const lines = content.split('\n');

    let rxBytes = 0;
    let txBytes = 0;

    for (const line of lines) {
      const match = line.match(/^\s*([a-zA-Z0-9]+):\s*(\d+)\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+(\d+)/);
      if (match && match[1] !== 'lo') {
        rxBytes += parseInt(match[2], 10);
        txBytes += parseInt(match[3], 10);
      }
    }

    const now = Date.now();
    if (!prevNetInfo || !prevNetTime) {
      prevNetInfo = { rx: rxBytes, tx: txBytes };
      prevNetTime = now;
      return { in: 0, out: 0 };
    }

    const timeDiffSec = (now - prevNetTime) / 1000;
    prevNetTime = now;

    if (timeDiffSec <= 0) return { in: 0, out: 0 };

    const rxDiffKB = (rxBytes - prevNetInfo.rx) / 1024;
    const txDiffKB = (txBytes - prevNetInfo.tx) / 1024;
    prevNetInfo = { rx: rxBytes, tx: txBytes };

    return {
      in: Math.max(0, parseFloat((rxDiffKB / timeDiffSec).toFixed(2))),
      out: Math.max(0, parseFloat((txDiffKB / timeDiffSec).toFixed(2))),
    };
  } catch {
    return { in: 0, out: 0 };
  }
}

// 5. PM2 Processes
async function getPm2Processes() {
  const output = await runCmd('pm2 jlist');
  if (!output) return [];

  try {
    const list = JSON.parse(output);
    return list.map((item) => ({
      name: item.name,
      pmId: item.pm_id,
      status: item.pm2_env?.status === 'online' ? 'ONLINE' : item.pm2_env?.status === 'stopped' ? 'STOPPED' : 'ERRORED',
      cpu: parseFloat((item.monit?.cpu || 0).toFixed(1)),
      memory: parseFloat(((item.monit?.memory || 0) / (1024 * 1024)).toFixed(1)), // MB
      restarts: item.pm2_env?.restart_time || 0,
      uptime: item.pm2_env?.pm_uptime ? Math.floor((Date.now() - item.pm2_env.pm_uptime) / 1000) : 0,
      nodeVersion: item.pm2_env?.node_version || process.version,
    }));
  } catch {
    return [];
  }
}

// 6. Nginx Status
async function getNginxStatus() {
  const isRunning = await runCmd('systemctl is-active nginx');
  const versionOut = await runCmd('nginx -v 2>&1');
  const portsOut = await runCmd('ss -tulpn | grep nginx');

  const status = isRunning === 'active' ? 'ACTIVE' : 'INACTIVE';
  const version = versionOut ? versionOut.replace('nginx version:', '').trim() : null;

  const ports = [];
  if (portsOut) {
    if (portsOut.includes(':80')) ports.push(80);
    if (portsOut.includes(':443')) ports.push(443);
  }

  return { status, version, ports: ports.length > 0 ? ports : [80, 443] };
}

// HTTP/HTTPS Request Sender
function sendJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;

    const payload = JSON.stringify(data);
    const req = client.request(
      urlStr,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Authorization: `Bearer ${AGENT_TOKEN}`,
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(payload);
    req.end();
  });
}

// Collect and Send Cycle
async function collectAndSend() {
  try {
    const cpu = getCpuUsage();
    const ram = getRamUsage();
    const disk = await getDiskUsage();
    const net = getNetworkThroughput();
    const load = os.loadavg();
    const pm2 = await getPm2Processes();
    const nginx = await getNginxStatus();

    let totalDiskGB = 0;
    if (disk.length > 0) {
      const root = disk.find((d) => d.mount === '/') || disk[0];
      totalDiskGB = parseFloat(root.size.replace(/[^0-9.]/g, '')) || 0;
    }

    const payload = {
      system: {
        hostname: os.hostname(),
        os: `${os.type()} ${os.release()}`,
        kernelVersion: os.release(),
        cpuModel: os.cpus()[0]?.model || 'Unknown',
        cpuCores: os.cpus().length,
        totalRam: ram.total,
        totalDisk: totalDiskGB,
        uptime: os.uptime(),
      },
      metrics: {
        cpuUsage: cpu,
        ramTotal: ram.total,
        ramUsed: ram.used,
        ramUsagePercent: ram.usagePercent,
        diskUsage: disk,
        networkIn: net.in,
        networkOut: net.out,
        load1: parseFloat(load[0].toFixed(2)),
        load5: parseFloat(load[1].toFixed(2)),
        load15: parseFloat(load[2].toFixed(2)),
      },
      pm2,
      nginx,
    };

    latestPayload = payload;

    if (AGENT_TOKEN && DASHBOARD_URL) {
      const metricsEndpoint = `${DASHBOARD_URL.replace(/\/$/, '')}/api/agent/metrics`;
      await sendJson(metricsEndpoint, payload);
      lastSentTime = new Date();
      lastSendStatus = 'SUCCESS';
      lastSendError = null;
      console.log(`[VioreCert Agent] Metrics pushed to ${DASHBOARD_URL} (CPU: ${cpu}%, RAM: ${ram.usagePercent}%)`);
    } else {
      lastSendStatus = 'TOKEN_MISSING';
      console.log(`[VioreCert Agent] Metrics collected locally (CPU: ${cpu}%, RAM: ${ram.usagePercent}%). Waiting for AGENT_TOKEN.`);
    }
  } catch (err) {
    lastSendStatus = 'FAILED';
    lastSendError = err.message;
    console.error(`[VioreCert Agent] Push failed: ${err.message}`);
  }
}

// Start Local HTTP Daemon Server on Port 3010
const localServer = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // GET / or /health or /status
  if (['/', '/health', '/status'].includes(parsedUrl.pathname)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(
      JSON.stringify(
        {
          status: 'RUNNING',
          agent: 'VioreCert Server Monitoring Agent',
          version: '1.0.0',
          port: AGENT_PORT,
          dashboardUrl: DASHBOARD_URL,
          hasToken: Boolean(AGENT_TOKEN),
          lastSendStatus,
          lastSendError,
          lastSentAt: lastSentTime ? lastSentTime.toISOString() : null,
          uptimeSeconds: Math.floor(process.uptime()),
          quickMetrics: latestPayload
            ? {
                cpuUsage: latestPayload.metrics.cpuUsage,
                ramUsagePercent: latestPayload.metrics.ramUsagePercent,
                hostname: latestPayload.system.hostname,
                pm2Count: latestPayload.pm2.length,
                nginxStatus: latestPayload.nginx.status,
              }
            : null,
        },
        null,
        2
      )
    );
  }

  // GET /metrics
  if (parsedUrl.pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(latestPayload || { message: 'Collecting initial metrics...' }, null, 2));
  }

  // POST /config to set token & dashboard dynamically
  if (req.method === 'POST' && parsedUrl.pathname === '/config') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        if (body.token) {
          AGENT_TOKEN = body.token.trim();
          fs.writeFileSync(tokenFilePath, AGENT_TOKEN, 'utf8');
        }
        if (body.dashboardUrl) {
          DASHBOARD_URL = body.dashboardUrl.trim();
        }
        collectAndSend();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Agent configuration updated' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

localServer.listen(AGENT_PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('  VioreCert Server Monitoring Agent v1.0.0');
  console.log(`  HTTP Listener: http://0.0.0.0:${AGENT_PORT}`);
  console.log(`  Health Check:  http://localhost:${AGENT_PORT}/health`);
  console.log(`  Target Hub:    ${DASHBOARD_URL}`);
  console.log(`  Has Token:     ${Boolean(AGENT_TOKEN)}`);
  console.log(`  Interval:      ${INTERVAL_SECONDS}s`);
  console.log('====================================================');

  // Trigger initial collection
  collectAndSend();
  setInterval(collectAndSend, INTERVAL_SECONDS * 1000);
});

localServer.on('error', (err) => {
  console.error(`[VioreCert Agent] Server error on port ${AGENT_PORT}:`, err.message);
});
