'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { MetricCards } from '@/components/MetricCards';
import { QuickChecker } from '@/components/QuickChecker';
import { DomainTable } from '@/components/DomainTable';
import { AddDomainModal } from '@/components/AddDomainModal';
import { BatchAddModal } from '@/components/BatchAddModal';
import { StandaloneQRGeneratorModal } from '@/components/StandaloneQRGeneratorModal';
import { MonitoredDomain, SSLCheckSummary } from '@/types/ssl';
import { ShieldCheck, Sparkles, CheckCircle2, AlertCircle, QrCode } from 'lucide-react';

export default function Home() {
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [isRecheckingId, setIsRecheckingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isQRStudioOpen, setIsQRStudioOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const fetchDomains = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const url = isInitial ? '/api/domains?init=true' : '/api/domains';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDomains(json.data);
      }
    } catch (err) {
      console.error('Failed fetching domains', err);
      showToast('Gagal memuat daftar domain', 'error');
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDomains(true);
  }, [fetchDomains]);

  // Handle Refresh All
  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    try {
      const res = await fetch('/api/domains/check-all', { method: 'POST' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDomains(json.data);
        showToast('Semua status SSL domain berhasil diperbarui');
      } else {
        throw new Error(json.error || 'Gagal memperbarui status');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui semua domain', 'error');
    } finally {
      setIsRefreshingAll(false);
    }
  };

  // Handle Single Recheck
  const handleRecheck = async (id: string) => {
    setIsRecheckingId(id);
    try {
      const res = await fetch(`/api/domains/${id}/check`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setDomains((prev) =>
          prev.map((d) => (d.id === id ? json.data : d))
        );
        showToast(`SSL domain ${json.data.domain} berhasil diperiksa`);
      } else {
        throw new Error(json.error || 'Gagal memeriksa domain');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal memeriksa SSL domain', 'error');
    } finally {
      setIsRecheckingId(null);
    }
  };

  // Handle Add Domain
  const handleAddDomain = async (domain: string, port = 443, alias?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, port, alias }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menambahkan domain');
      }

      if (json.isDuplicate) {
        showToast(`Domain ${domain} sudah ada dalam pemantauan`, 'error');
        return false;
      }

      setDomains((prev) => [json.data, ...prev.filter((d) => d.id !== json.data.id)]);
      showToast(`Domain ${domain} berhasil ditambahkan dan diperiksa`);
      return true;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan domain', 'error');
      return false;
    }
  };

  // Handle Batch Add
  const handleBatchAdd = async (domainList: string[]) => {
    const res = await fetch('/api/domains/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: domainList }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memproses batch import');
    }

    if (Array.isArray(json.data)) {
      setDomains(json.data);
    }
    showToast(`Berhasil menambahkan ${json.addedCount} domain baru`);
    return { addedCount: json.addedCount, skippedCount: json.skippedCount };
  };

  // Handle Delete
  const handleDelete = async (id: string, domainName: string) => {
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus "${domainName}" dari daftar pemantauan?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/domains?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setDomains((prev) => prev.filter((d) => d.id !== id));
        showToast(`Domain ${domainName} berhasil dihapus dari pemantauan`);
      } else {
        throw new Error(json.error || 'Gagal menghapus');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus domain', 'error');
    }
  };

  // Check if domain is already monitored
  const isDomainAlreadyMonitored = useCallback(
    (domain: string, port = 443) => {
      const cleanHost = domain.toLowerCase().replace(/^(https?:\/\/)/, '').split('/')[0];
      return domains.some((d) => d.domain.toLowerCase() === cleanHost && d.port === port);
    },
    [domains]
  );

  // Handle CSV Export
  const handleExportCSV = () => {
    if (domains.length === 0) {
      showToast('Tidak ada data domain untuk diekspor', 'error');
      return;
    }

    const headers = ['Domain', 'Port', 'Alias', 'Status', 'Sisa Hari', 'Kadaluarsa Pada', 'Penerbit CA', 'Protokol', 'Terakhir Dicek'];
    const rows = domains.map((d) => [
      `"${d.domain}"`,
      d.port,
      `"${d.alias || ''}"`,
      `"${d.lastCheck?.status || 'unchecked'}"`,
      d.lastCheck?.daysRemaining ?? '',
      `"${d.lastCheck?.validTo || ''}"`,
      `"${d.lastCheck?.issuer.organization || d.lastCheck?.issuer.commonName || ''}"`,
      `"${d.lastCheck?.protocol || ''}"`,
      `"${d.lastCheck?.checkedAt || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ssl-domains-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data domain berhasil diekspor ke CSV');
  };

  // Summary Metrics
  const summary: SSLCheckSummary = useMemo(() => {
    const s: SSLCheckSummary = {
      total: domains.length,
      valid: 0,
      warning: 0,
      critical: 0,
      expired: 0,
      error: 0,
    };

    for (const d of domains) {
      const st = d.lastCheck?.status;
      if (st === 'valid') s.valid++;
      else if (st === 'warning') s.warning++;
      else if (st === 'critical') s.critical++;
      else if (st === 'expired') s.expired++;
      else if (st === 'error') s.error++;
    }

    return s;
  }, [domains]);

  return (
    <>
      <Header
        onRefreshAll={handleRefreshAll}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenQRStudio={() => setIsQRStudioOpen(true)}
        onExport={handleExportCSV}
        isRefreshingAll={isRefreshingAll}
      />

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              zIndex: 99,
              padding: '0.875rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: toast.type === 'success' ? '#064e3b' : '#881337',
              color: '#ffffff',
              border: `1px solid ${toast.type === 'success' ? '#059669' : '#e11d48'}`,
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Hero Welcome banner */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--cyan-400)',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <Sparkles size={12} /> Dashboard Tanpa Login
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Pemantauan Masa Aktif SSL &amp; Keamanan Domain
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '0.35rem' }}>
              Pantau tanggal kedaluwarsa sertifikat SSL/TLS domain Anda secara instan dan otomatis tanpa perlu registrasi.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsQRStudioOpen(true)}
            style={{
              padding: '0.75rem 1.25rem',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(15, 23, 42, 0.75)',
              boxShadow: '0 4px 20px rgba(6, 182, 212, 0.15)',
            }}
          >
            <QrCode size={18} style={{ color: 'var(--cyan-400)' }} />
            <span>Buka QR Studio &amp; Link Builder</span>
          </button>
        </div>

        {/* Metric Cards */}
        <MetricCards
          summary={summary}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Quick Instant SSL Checker */}
        <QuickChecker
          onAddToWatchlist={handleAddDomain}
          isDomainAlreadyMonitored={isDomainAlreadyMonitored}
        />

        {/* Monitored Domains Watchlist Table */}
        <DomainTable
          domains={domains}
          onRecheck={handleRecheck}
          onDelete={handleDelete}
          isRecheckingId={isRecheckingId}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
      </main>

      {/* Add Domain Modal */}
      <AddDomainModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDomain={handleAddDomain}
      />

      {/* Batch Import Modal */}
      <BatchAddModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchAdd={handleBatchAdd}
      />

      {/* Standalone QR Studio & Link Mechanism Modal */}
      <StandaloneQRGeneratorModal
        isOpen={isQRStudioOpen}
        onClose={() => setIsQRStudioOpen(false)}
        onAddToWatchlist={handleAddDomain}
      />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 0',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.8125rem',
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <ShieldCheck size={16} style={{ color: 'var(--cyan-400)' }} />
            <strong style={{ color: 'var(--text-main)' }}>CertPulse SSL Monitor</strong>
          </div>
          <p>
            Ditenagai oleh Next.js App Router &amp; Native Node.js TLS Certificate Engine. Bekerja secara otomatis tanpa memerlukan autentikasi pihak ketiga.
          </p>
        </div>
      </footer>
    </>
  );
}
