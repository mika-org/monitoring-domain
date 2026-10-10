'use client';

import React, { useState, useEffect, useId, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Server,
  ArrowLeft,
  Cpu,
  Layers,
  Activity,
  Clock,
  HardDrive,
  Wifi,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { Sidebar } from '@/components/Sidebar';

type TabType = 'overview' | 'metrics' | 'processes' | 'nginx' | 'alerts';

export default function ServerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [server, setServer] = useState<any>(null);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('1h');
  const [tokenModal, setTokenModal] = useState<{ isOpen: boolean; token: string; command: string } | null>(null);
  const [isRotatingToken, setIsRotatingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRotateToken = async () => {
    setIsRotatingToken(true);
    try {
      const res = await fetch(`/api/servers/${id}/token`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTokenModal({
          isOpen: true,
          token: data.agentToken,
          command: data.installCommand,
        });
      }
    } catch (err) {
      console.error('Rotate token error:', err);
    } finally {
      setIsRotatingToken(false);
    }
  };

  const fetchServerDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/servers/${id}`);
      const json = await res.json();
      if (json.success) {
        setServer(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchMetricsHistory = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/servers/${id}/metrics?range=${timeRange}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMetricsHistory(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [id, timeRange]);

  useEffect(() => {
    fetchServerDetail();
    fetchMetricsHistory();
    const intv = setInterval(() => {
      fetchServerDetail();
      fetchMetricsHistory();
    }, 15000);
    return () => clearInterval(intv);
  }, [fetchServerDetail, fetchMetricsHistory]);

  if (isLoading && !server) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <RefreshCw size={24} className="spin-slow" style={{ color: '#2563eb' }} />
          <span style={{ marginLeft: '0.65rem', fontWeight: 600 }}>Memuat detail server...</span>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
        <Sidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <Link href="/servers" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Kembali ke Daftar Server
          </Link>
          <div style={{ marginTop: '2rem', color: '#dc2626' }}>Server tidak ditemukan.</div>
        </div>
      </div>
    );
  }

  const isOnline = server.status === 'ONLINE';
  const latest = server.latestMetric || {};

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem 1.5rem',
          gap: '0.85rem',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Top Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              href="/servers"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                textDecoration: 'none',
              }}
              title="Kembali ke daftar server"
            >
              <ArrowLeft size={16} />
            </Link>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {server.name}
                </h1>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    background: isOnline ? '#dcfce7' : '#f1f5f9',
                    color: isOnline ? '#15803d' : '#64748b',
                  }}
                >
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {server.ipAddress} {server.hostname ? `• ${server.hostname}` : ''} • {server.os || 'Ubuntu Linux'}
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#e2e8f0', padding: '0.2rem', borderRadius: '8px' }}>
            {[
              { key: 'overview' as TabType, label: 'Overview' },
              { key: 'metrics' as TabType, label: 'Grafik Metrik' },
              { key: 'processes' as TabType, label: `PM2 (${server.pm2Processes?.length || 0})` },
              { key: 'nginx' as TabType, label: 'Nginx' },
              { key: 'alerts' as TabType, label: `Alerts (${server.alerts?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === tab.key ? '#ffffff' : 'transparent',
                  color: activeTab === tab.key ? '#0f172a' : '#64748b',
                  fontSize: '0.78125rem',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: activeTab === tab.key ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Content Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Offline Warning Banner with One-Click Install Command */}
              {server.status === 'OFFLINE' && (
                <div
                  style={{
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '12px',
                    padding: '0.85rem 1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: '#ffe4e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#e11d48',
                        flexShrink: 0,
                      }}
                    >
                      <Terminal size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.85rem' }}>
                        Server Ini Berstatus OFFLINE (Belum Mengirimkan Heartbeat)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#be123c', marginTop: '0.15rem' }}>
                        Pasang Monitoring Agent pada server VPS Ubuntu Anda menggunakan perintah curl 1 baris agar metrik real-time & status ONLINE langsung aktif.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRotateToken}
                    disabled={isRotatingToken}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      background: '#e11d48',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexShrink: 0,
                    }}
                  >
                    <Terminal size={14} />
                    <span>{isRotatingToken ? 'Menyiapkan...' : 'Lihat Perintah Pasang Agent'}</span>
                  </button>
                </div>
              )}

              {/* 4 Live Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Cpu size={14} style={{ color: '#2563eb' }} />
                    <span>CPU Utilization</span>
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    {(latest.cpuUsage || 0).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {server.cpuCores ? `${server.cpuCores} Cores` : '1 Core'} • {server.cpuModel || 'Intel/AMD'}
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Activity size={14} style={{ color: '#16a34a' }} />
                    <span>RAM Utilization</span>
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    {(latest.ramUsagePercent || 0).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {latest.ramUsed ? `${latest.ramUsed} GB` : '0 GB'} / {latest.ramTotal ? `${latest.ramTotal} GB` : '0 GB'}
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Wifi size={14} style={{ color: '#0284c7' }} />
                    <span>Network Throughput</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    ↓ {(latest.networkIn || 0).toFixed(1)} KB/s
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: '#64748b', marginTop: '0.15rem' }}>
                    ↑ {(latest.networkOut || 0).toFixed(1)} KB/s Upload
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} style={{ color: '#ea580c' }} />
                    <span>Load Average</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    {latest.load1 || 0} / {latest.load5 || 0} / {latest.load15 || 0}
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Uptime: {server.uptime ? `${Math.floor(server.uptime / 86400)} hari` : '0 hari'}
                  </div>
                </div>
              </div>

              {/* Server Specs & Disks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                {/* Specs Box */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.85rem 0' }}>
                    Spesifikasi Hardware &amp; Sistem Operasi
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Operating System:</span>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{server.os || 'Ubuntu Linux'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Kernel Version:</span>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{server.kernelVersion || '-'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>CPU Model:</span>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{server.cpuModel || '-'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>IP Address:</span>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{server.ipAddress}</div>
                    </div>
                  </div>
                </div>

                {/* Disk Mounts Box */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.85rem 0' }}>
                    Partisi Disk &amp; Mount Points
                  </h3>
                  {latest.diskUsage && Array.isArray(latest.diskUsage) && latest.diskUsage.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {latest.diskUsage.map((d: any, idx: number) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                            <span>{d.mount} ({d.filesystem})</span>
                            <span>{d.used} / {d.size} ({d.usePercent}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', marginTop: '0.2rem', overflow: 'hidden' }}>
                            <div style={{ width: `${d.usePercent}%`, height: '100%', background: d.usePercent >= 90 ? '#dc2626' : '#2563eb', borderRadius: '999px' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Data disk belum tersedia.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: METRICS CHARTS (RECHARTS) */}
          {activeTab === 'metrics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Time Range Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                  Rentang Waktu Histori Metrik
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {(['1h', '6h', '24h', '7d', '30d'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTimeRange(r)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        border: timeRange === r ? '1px solid #2563eb' : '1px solid #cbd5e1',
                        background: timeRange === r ? '#eff6ff' : '#ffffff',
                        color: timeRange === r ? '#2563eb' : '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart 1: CPU Usage */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  CPU Utilization History (%)
                </div>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metricsHistory}>
                      <defs>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                      <Tooltip />
                      <Area type="monotone" dataKey="cpuUsage" stroke="#2563eb" fillOpacity={1} fill="url(#cpuGrad)" name="CPU Usage" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: RAM Usage */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  RAM Usage History (%)
                </div>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metricsHistory}>
                      <defs>
                        <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                      <Tooltip />
                      <Area type="monotone" dataKey="ramUsagePercent" stroke="#16a34a" fillOpacity={1} fill="url(#ramGrad)" name="RAM Usage" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PM2 PROCESSES */}
          {activeTab === 'processes' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78125rem' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem' }}>App Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>PM2 ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>CPU %</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Memory (MB)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Restarts</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Uptime</th>
                  </tr>
                </thead>
                <tbody>
                  {server.pm2Processes && server.pm2Processes.length > 0 ? (
                    server.pm2Processes.map((p: any) => {
                      const isOk = p.status === 'ONLINE';
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                            {p.name}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.pmId}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.71875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: isOk ? '#dcfce7' : '#fee2e2', color: isOk ? '#15803d' : '#b91c1c' }}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.cpu}%</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.memory} MB</td>
                          <td style={{ padding: '0.75rem 1rem', color: p.restarts > 5 ? '#dc2626' : '#64748b' }}>{p.restarts}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                            {p.uptime ? `${Math.floor(p.uptime / 3600)}j ${Math.floor((p.uptime % 3600) / 60)}m` : '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        Tidak ada proses PM2 yang terdeteksi dari agent.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: NGINX */}
          {activeTab === 'nginx' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem 0' }}>
                Status Layanan Nginx
              </h3>
              {server.nginxServices && server.nginxServices.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Status Service</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: server.nginxServices[0].status === 'ACTIVE' ? '#16a34a' : '#dc2626', marginTop: '0.25rem' }}>
                      {server.nginxServices[0].status}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Versi Nginx</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                      {server.nginxServices[0].version || 'Nginx Standard'}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Port Listening</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
                      80, 443 (HTTP/HTTPS)
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.84375rem' }}>Layanan Nginx belum pernah dilaporkan oleh agent.</div>
              )}
            </div>
          )}

          {/* TAB 5: ALERTS */}
          {activeTab === 'alerts' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              {server.alerts && server.alerts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {server.alerts.map((al: any) => (
                    <div key={al.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '4px', background: al.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7', color: al.severity === 'CRITICAL' ? '#b91c1c' : '#b45309' }}>
                            {al.severity}
                          </span>
                          <span style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a' }}>{al.type}</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
                          {al.message}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(al.triggeredAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                  Tidak ada alert aktif pada server ini. Seluruh metrik beroperasi normal.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal: Perintah Instalasi Agent */}
        {tokenModal?.isOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '560px',
                padding: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Perintah Instalasi Monitoring Agent
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                      Jalankan perintah ini di terminal server VPS Ubuntu Anda ({server.name})
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Perintah 1-Baris (Curl &amp; Auto-Config Systemd):
                </label>
                <div
                  style={{
                    background: '#0b1120',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    wordBreak: 'break-all',
                    marginTop: '0.35rem',
                    lineHeight: 1.5,
                  }}
                >
                  {tokenModal.command}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tokenModal.command);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: copied ? '#16a34a' : '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Perintah'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTokenModal(null)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
