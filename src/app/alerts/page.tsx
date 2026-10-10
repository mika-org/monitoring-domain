'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Shield,
  Sliders,
  Check,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

interface AlertItem {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  status: 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';
  triggeredAt: string;
  resolvedAt?: string | null;
  server?: { id: string; name: string; ipAddress: string } | null;
  website?: { id: string; name: string; url: string } | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'TRIGGERED' | 'RESOLVED'>('TRIGGERED');

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/alerts?status=${statusFilter}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAlerts(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolveAlert = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'RESOLVED' }),
      });
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

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
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Incident &amp; Alert Center
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Pusat insiden dan peringatan otomatis saat CPU, RAM, Disk, Nginx, atau PM2 bermasalah
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', background: '#e2e8f0', padding: '0.2rem', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('TRIGGERED')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: statusFilter === 'TRIGGERED' ? '#ffffff' : 'transparent',
                  color: statusFilter === 'TRIGGERED' ? '#0f172a' : '#64748b',
                  fontSize: '0.78125rem',
                  fontWeight: statusFilter === 'TRIGGERED' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                Aktif (Belum Selesai)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('RESOLVED')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: statusFilter === 'RESOLVED' ? '#ffffff' : 'transparent',
                  color: statusFilter === 'RESOLVED' ? '#0f172a' : '#64748b',
                  fontSize: '0.78125rem',
                  fontWeight: statusFilter === 'RESOLVED' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                Terselesaikan
              </button>
            </div>

            <button
              type="button"
              onClick={fetchAlerts}
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

        {/* Threshold Reference Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={16} style={{ color: '#2563eb' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
              Threshold Otomatis Sistem:
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: '#64748b' }}>
            <span>CPU: <strong>Warn 80% / Crit 95%</strong></span>
            <span>RAM: <strong>Warn 85% / Crit 95%</strong></span>
            <span>Disk: <strong>Warn 80% / Crit 90%</strong></span>
            <span>Heartbeat: <strong>Timeout 90s</strong></span>
          </div>
        </div>

        {/* Alerts List */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            overflowY: 'auto',
          }}
        >
          {alerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {alerts.map((al) => {
                const isCrit = al.severity === 'CRITICAL';
                const isResolved = al.status === 'RESOLVED';

                return (
                  <div
                    key={al.id}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isResolved ? '#f0fdf4' : isCrit ? '#fef2f2' : '#fefce8',
                          color: isResolved ? '#16a34a' : isCrit ? '#dc2626' : '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isResolved ? <CheckCircle2 size={18} /> : <AlertOctagon size={18} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              background: isCrit ? '#fee2e2' : '#fef3c7',
                              color: isCrit ? '#b91c1c' : '#b45309',
                            }}
                          >
                            {al.severity}
                          </span>
                          <span style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a' }}>
                            {al.type}
                          </span>
                          {al.server && (
                            <Link
                              href={`/servers/${al.server.id}`}
                              style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                            >
                              ({al.server.name})
                            </Link>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem' }}>
                          {al.message}
                        </div>
                        <div style={{ fontSize: '0.71875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                          Terpicu: {new Date(al.triggeredAt).toLocaleString('id-ID')}
                          {al.resolvedAt && ` • Selesai: ${new Date(al.resolvedAt).toLocaleString('id-ID')}`}
                        </div>
                      </div>
                    </div>

                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(al.id)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '6px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          color: '#15803d',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={13} />
                        <span>Tandai Selesai</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <CheckCircle2 size={36} style={{ color: '#16a34a', margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                Tidak Ada Alert Aktif
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                Seluruh server, PM2, dan Nginx beroperasi dalam batas parameter normal.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
