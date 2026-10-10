'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  Lock,
  Server,
  Zap,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function IntegrationsPage() {
  const [biznetData, setBiznetData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchIntegrationStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/integrations/biznet');
      const json = await res.json();
      if (json.success) {
        setBiznetData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrationStatus();
  }, [fetchIntegrationStatus]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/biznet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      setTestResult(data);
      fetchIntegrationStatus();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const status = biznetData?.status || 'NOT_CONFIGURED';
  const isOk = status === 'CONNECTED';
  const isNotConfig = status === 'NOT_CONFIGURED';

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
              <Cloud size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Integrations &amp; Cloud Provider API
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Integrasikan API resmi Biznet Cloud / GIO untuk sinkronisasi infrastruktur cloud
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Biznet GIO Cloud Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#0284c7',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    flexShrink: 0,
                  }}
                >
                  B
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Biznet Cloud (GIO / Neo Cloud)
                    </h2>
                    <span
                      style={{
                        fontSize: '0.71875rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '999px',
                        background: isOk ? '#dcfce7' : isNotConfig ? '#f1f5f9' : '#fee2e2',
                        color: isOk ? '#15803d' : isNotConfig ? '#64748b' : '#b91c1c',
                      }}
                    >
                      {status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.5, maxWidth: '560px' }}>
                    Sinkronisasi data instance dan status infrastruktur Biznet Cloud. Sesuai arsitektur keamanan, API Key disimpan eksklusif pada environment server-side (tidak dikirim ke browser).
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: isTesting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <RefreshCw size={14} className={isTesting ? 'spin-slow' : ''} />
                  <span>{isTesting ? 'Menguji...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>

            {/* Test Result Banner */}
            {testResult && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: testResult.success ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                  color: testResult.success ? '#166534' : '#991b1b',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Connection Details */}
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #f1f5f9',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                fontSize: '0.8125rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>API Endpoint:</span>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                  {biznetData?.endpoint || 'https://api.biznetgio.com/v1'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>Kredensial (.env):</span>
                <div style={{ fontWeight: 600, color: biznetData?.isEnvConfigured ? '#16a34a' : '#dc2626', marginTop: '0.2rem' }}>
                  {biznetData?.isEnvConfigured ? 'Terkonfigurasi (BIZNET_API_KEY)' : 'Belum diisi di .env'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b' }}>Waktu Sinkronisasi:</span>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                  {biznetData?.lastSyncedAt ? new Date(biznetData.lastSyncedAt).toLocaleString('id-ID') : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
