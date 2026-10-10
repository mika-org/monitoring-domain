'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Layers,
  RefreshCw,
  Search,
  Server,
  CheckCircle2,
  XCircle,
  Shield,
  Activity,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function NginxPage() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/nginx/status');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setServices(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filtered = services.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return s.server.name.toLowerCase().includes(q) || s.server.ipAddress.includes(q);
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
              <Layers size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Nginx Reverse Proxy Monitoring
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Pantau status service web server &amp; reverse proxy Nginx pada seluruh VPS
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
                placeholder="Cari server..."
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
              onClick={fetchServices}
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

        {/* Nginx Table */}
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
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Server VPS</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status Service</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Versi Nginx</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Listening Ports</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Pembaruan Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((item) => {
                    const isOk = item.status === 'ACTIVE';
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Link
                            href={`/servers/${item.server.id}`}
                            style={{ fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}
                          >
                            {item.server.name}
                          </Link>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.server.ipAddress}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.71875rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              background: isOk ? '#dcfce7' : '#fee2e2',
                              color: isOk ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                          {item.version || 'Nginx'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                          Port 80, 443 (HTTP/HTTPS)
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.78125rem' }}>
                          {item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleTimeString('id-ID') : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      {isLoading ? 'Memuat status Nginx...' : 'Belum ada data Nginx yang dilaporkan.'}
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
