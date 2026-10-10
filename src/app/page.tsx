'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  Server,
  Globe,
  Cpu,
  AlertTriangle,
  RefreshCw,
  Activity,
  Wifi,
  Clock,
  Layers,
  ArrowRight,
  Shield,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function OverviewDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/overview');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const intv = setInterval(fetchOverview, 15000);
    return () => clearInterval(intv);
  }, [fetchOverview]);

  const s = data?.servers || { total: 0, online: 0, offline: 0, avgCpu: 0, avgRam: 0, totalNetIn: 0, totalNetOut: 0, list: [] };
  const w = data?.websites || { total: 0, up: 0, down: 0 };
  const pm2 = data?.pm2 || { total: 0, online: 0, errored: 0 };
  const alerts = data?.alerts || [];

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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Server Monitoring Dashboard
              </h1>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: '#dcfce7', color: '#15803d' }}>
                System Normal
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0 0' }}>
              Pusat kendali infrastruktur VPS Ubuntu, proses PM2, dan website production
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.71875rem', color: '#94a3b8' }}>
              Diperbarui: {data?.updatedAt ? new Date(data.updatedAt).toLocaleTimeString('id-ID') : '-'}
            </span>

            <button
              type="button"
              onClick={fetchOverview}
              disabled={isLoading}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Refresh metrik"
            >
              <RefreshCw size={14} className={isLoading ? 'spin-slow' : ''} style={{ color: '#2563eb' }} />
            </button>

            <Link
              href="/servers"
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '0.78125rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Server size={14} />
              <span>Kelola Server</span>
            </Link>
          </div>
        </header>

        {/* 5 Core Infrastructure Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', flexShrink: 0 }}>
          {/* Card 1: Servers */}
          <Link
            href="/servers"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.71875rem', color: '#64748b', fontWeight: 600 }}>Total VPS Server</span>
              <Server size={16} style={{ color: '#2563eb' }} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {s.total}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 600, marginTop: '0.15rem' }}>
              {s.online} Online • {s.offline} Offline
            </div>
          </Link>

          {/* Card 2: Websites */}
          <Link
            href="/websites"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.71875rem', color: '#64748b', fontWeight: 600 }}>Websites Monitored</span>
              <Globe size={16} style={{ color: '#0284c7' }} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {w.total}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 600, marginTop: '0.15rem' }}>
              {w.up} UP • {w.down} DOWN
            </div>
          </Link>

          {/* Card 3: CPU Overall */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.71875rem', color: '#64748b', fontWeight: 600 }}>Rata-rata CPU</span>
              <Cpu size={16} style={{ color: '#d97706' }} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: s.avgCpu >= 80 ? '#dc2626' : '#0f172a', marginTop: '0.2rem' }}>
              {s.avgCpu}%
            </div>
            <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '999px', marginTop: '0.35rem', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, s.avgCpu)}%`, height: '100%', background: '#d97706', borderRadius: '999px' }} />
            </div>
          </div>

          {/* Card 4: RAM Overall */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.71875rem', color: '#64748b', fontWeight: 600 }}>Rata-rata RAM</span>
              <Activity size={16} style={{ color: '#16a34a' }} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: s.avgRam >= 85 ? '#dc2626' : '#0f172a', marginTop: '0.2rem' }}>
              {s.avgRam}%
            </div>
            <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '999px', marginTop: '0.35rem', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, s.avgRam)}%`, height: '100%', background: '#16a34a', borderRadius: '999px' }} />
            </div>
          </div>

          {/* Card 5: PM2 Apps */}
          <Link
            href="/processes"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.71875rem', color: '#64748b', fontWeight: 600 }}>PM2 Processes</span>
              <Layers size={16} style={{ color: '#7c3aed' }} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {pm2.total}
            </div>
            <div style={{ fontSize: '0.6875rem', color: pm2.errored > 0 ? '#dc2626' : '#16a34a', fontWeight: 600, marginTop: '0.15rem' }}>
              {pm2.online} Online {pm2.errored > 0 ? `• ${pm2.errored} Errored` : ''}
            </div>
          </Link>
        </div>

        {/* Middle Section: Servers Live Status Grid & Active Incidents */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.85rem', overflow: 'hidden' }}>
          {/* Left: Server Infrastructure Overview */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Kondisi Server Real-Time
              </h2>
              <Link href="/servers" style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                Lihat Semua &rarr;
              </Link>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {s.list && s.list.length > 0 ? (
                s.list.map((srv: any) => {
                  const isOnline = srv.status === 'ONLINE';
                  return (
                    <div
                      key={srv.id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #f1f5f9',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#16a34a' : '#94a3b8' }} />
                        <div>
                          <Link href={`/servers/${srv.id}`} style={{ fontWeight: 700, color: '#0f172a', textDecoration: 'none', fontSize: '0.8125rem' }}>
                            {srv.name}
                          </Link>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{srv.ipAddress}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.75rem' }}>
                        <div>
                          <span style={{ color: '#64748b' }}>CPU: </span>
                          <strong style={{ color: srv.cpu >= 80 ? '#dc2626' : '#0f172a' }}>{srv.cpu.toFixed(1)}%</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>RAM: </span>
                          <strong style={{ color: srv.ram >= 85 ? '#dc2626' : '#0f172a' }}>{srv.ram.toFixed(1)}%</strong>
                        </div>
                        <Link href={`/servers/${srv.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700, fontSize: '0.71875rem' }}>
                          Detail
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
                  Belum ada server yang terdaftar. <Link href="/servers" style={{ color: '#2563eb', fontWeight: 600 }}>Daftarkan VPS</Link>
                </div>
              )}
            </div>
          </div>

          {/* Right: Active Incidents & Alerts */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertTriangle size={16} style={{ color: '#dc2626' }} />
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Insiden &amp; Peringatan Aktif
                </h2>
              </div>
              <Link href="/alerts" style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                Lihat Semua &rarr;
              </Link>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {alerts.length > 0 ? (
                alerts.map((al: any) => (
                  <div
                    key={al.id}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      fontSize: '0.78125rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#991b1b' }}>{al.type}</span>
                      <span style={{ fontSize: '0.6875rem', color: '#b91c1c' }}>
                        {new Date(al.triggeredAt).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <div style={{ color: '#7f1d1d', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      {al.message}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#16a34a', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <CheckCircle2 size={24} style={{ margin: '0 auto 0.5rem auto' }} />
                  Tidak ada insiden aktif. Seluruh sistem normal.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
