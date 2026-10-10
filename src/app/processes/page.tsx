'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Cpu,
  RefreshCw,
  Search,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

interface ProcessItem {
  id: string;
  name: string;
  pmId: number;
  status: 'ONLINE' | 'STOPPED' | 'ERRORED';
  cpu: number;
  memory: number;
  restarts: number;
  uptime: number;
  nodeVersion?: string | null;
  lastSeenAt: string;
  server: {
    id: string;
    name: string;
    ipAddress: string;
    status: string;
  };
}

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ONLINE' | 'STOPPED' | 'ERRORED'>('all');

  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/pm2/processes');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProcesses(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
    const intv = setInterval(fetchProcesses, 15000);
    return () => clearInterval(intv);
  }, [fetchProcesses]);

  const onlineCount = processes.filter((p) => p.status === 'ONLINE').length;
  const errorCount = processes.filter((p) => p.status === 'ERRORED').length;
  const stoppedCount = processes.filter((p) => p.status === 'STOPPED').length;

  const filtered = processes.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.server.name.toLowerCase().includes(q) ||
      p.server.ipAddress.includes(q)
    );
  });

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
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
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
              <Cpu size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                PM2 Process Monitoring
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Pantau seluruh aplikasi backend Node.js yang berjalan di bawah PM2 pada seluruh server Ubuntu
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama aplikasi PM2..."
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 0.75rem 0 2.2rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '0.8125rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="button"
              onClick={fetchProcesses}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} style={{ color: '#2563eb' }} />
            </button>
          </div>
        </header>

        {/* 3 Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', flexShrink: 0 }}>
          <div
            onClick={() => setStatusFilter('all')}
            style={{
              background: '#ffffff',
              border: statusFilter === 'all' ? '2px solid #2563eb' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Aplikasi PM2</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
              {processes.length}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('ONLINE')}
            style={{
              background: '#ffffff',
              border: statusFilter === 'ONLINE' ? '2px solid #16a34a' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Proses Online</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', marginTop: '0.15rem' }}>
              {onlineCount}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('ERRORED')}
            style={{
              background: '#ffffff',
              border: statusFilter === 'ERRORED' ? '2px solid #dc2626' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Proses Errored / Crash</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '0.15rem' }}>
              {errorCount}
            </div>
          </div>
        </div>

        {/* Process Table */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10, borderBottom: '1px solid #e2e8f0' }}>
                <tr style={{ color: '#64748b', fontSize: '0.78125rem' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Aplikasi PM2</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Server VPS</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>PM2 ID</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>CPU Usage</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Memory</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Restarts</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Uptime</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((item) => {
                    const isOk = item.status === 'ONLINE';
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Link
                            href={`/servers/${item.server.id}`}
                            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                          >
                            {item.server.name} ({item.server.ipAddress})
                          </Link>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{item.pmId}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.71875rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              background: isOk ? '#dcfce7' : '#fee2e2',
                              color: isOk ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{item.cpu}%</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{item.memory} MB</td>
                        <td style={{ padding: '0.75rem 1rem', color: item.restarts > 5 ? '#dc2626' : '#64748b', fontWeight: item.restarts > 5 ? 700 : 500 }}>
                          {item.restarts}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.78125rem' }}>
                          {item.uptime ? `${Math.floor(item.uptime / 3600)}j ${Math.floor((item.uptime % 3600) / 60)}m` : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      {isLoading ? 'Memuat proses PM2...' : 'Belum ada aplikasi PM2 yang terlaporkan.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
