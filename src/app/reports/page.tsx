'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { MonitoredDomain, SSLCheckSummary } from '@/types/ssl';
import { Sidebar } from '@/components/Sidebar';
import { ConfirmModal } from '@/components/ConfirmModal';
import { exportDomainsToExcel } from '@/lib/excel-export';

export default function ReportsPage() {
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    fetch('/api/domains')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setDomains(json.data);
        }
      })
      .catch(() => showToast('Gagal memuat data laporan', 'error'))
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const summary: SSLCheckSummary = useMemo(() => {
    const res = { total: domains.length, valid: 0, warning: 0, critical: 0, expired: 0, error: 0 };
    domains.forEach((item) => {
      const status = item.lastCheck?.status;
      if (status === 'valid') res.valid++;
      else if (status === 'warning') res.warning++;
      else if (status === 'critical') res.critical++;
      else if (status === 'expired') res.expired++;
      else if (status === 'error' || Boolean(item.lastCheck?.error)) res.error++;
      else if (!status && !isLoading) res.error++;
    });
    return res;
  }, [domains, isLoading]);

  const filteredDomains = useMemo(() => {
    return domains.filter((item) => {
      if (statusFilter !== 'all') {
        const s = item.lastCheck?.status;
        if (statusFilter === 'error') {
          const isErr = s === 'error' || Boolean(item.lastCheck?.error) || (!s && !isLoading);
          if (!isErr) return false;
        } else {
          if (s !== statusFilter) return false;
        }
      }
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        item.domain.toLowerCase().includes(q) ||
        (item.alias && item.alias.toLowerCase().includes(q)) ||
        (item.lastCheck?.issuer?.organization && item.lastCheck.issuer.organization.toLowerCase().includes(q))
      );
    });
  }, [domains, statusFilter, searchQuery, isLoading]);

  const totalPages = Math.ceil(filteredDomains.length / itemsPerPage) || 1;
  const paginatedDomains = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDomains.slice(start, start + itemsPerPage);
  }, [filteredDomains, currentPage, itemsPerPage]);

  const handleExecuteExport = () => {
    if (domains.length === 0) {
      showToast('Tidak ada data domain untuk diexport', 'error');
      setShowExportConfirm(false);
      return;
    }
    exportDomainsToExcel(domains);
    showToast('Laporan Excel berhasil diunduh');
    setShowExportConfirm(false);
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
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Laporan &amp; Export Excel
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Unduh rekapitulasi data sertifikat SSL domain dalam format spreadsheet (.xlsx)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowExportConfirm(true)}
            style={{
              height: '38px',
              padding: '0 1.25rem',
              borderRadius: '8px',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.84375rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(22, 163, 74, 0.3)',
            }}
          >
            <Download size={16} />
            <span>Download Laporan Excel (.xlsx)</span>
          </button>
        </header>

        {/* 4 Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Domain Terdaftar</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
              {summary.total}
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>SSL Aktif &amp; Aman</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', marginTop: '0.15rem' }}>
              {summary.valid}
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>Perlu Perhatian (Warning/Kritis)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '0.15rem' }}>
              {summary.warning + summary.critical}
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Error / Gagal Pengecekan</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '0.15rem' }}>
              {summary.error + summary.expired}
            </div>
          </div>
        </div>

        {/* Report Preview Table */}
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
          {/* Toolbar */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a' }}>
                Pratinjau Data Laporan ({filteredDomains.length} Data)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  placeholder="Cari domain..."
                  style={{
                    width: '100%',
                    height: '34px',
                    padding: '0 0.75rem 0 2.2rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  height: '34px',
                  padding: '0 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.8125rem',
                  color: '#334155',
                  outline: 'none',
                }}
              >
                <option value="all">Semua Status</option>
                <option value="valid">Valid ({summary.valid})</option>
                <option value="warning">Warning ({summary.warning})</option>
                <option value="critical">Kritis ({summary.critical})</option>
                <option value="expired">Expired ({summary.expired})</option>
                <option value="error">Error ({summary.error})</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10, borderBottom: '1px solid #e2e8f0' }}>
                <tr style={{ color: '#64748b', fontSize: '0.78125rem' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>No</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Domain / Host</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Penerbit (CA)</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Sisa Waktu</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Kadaluarsa Pada</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status SSL</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDomains.length > 0 ? (
                  paginatedDomains.map((item, idx) => {
                    const cert = item.lastCheck;
                    let statusLabel = 'Valid';
                    let statusColor = '#15803d';
                    let statusBg = '#dcfce7';

                    if (!cert) {
                      statusLabel = 'Pending';
                      statusColor = '#475569';
                      statusBg = '#f1f5f9';
                    } else if (cert.status === 'expired') {
                      statusLabel = 'Expired';
                      statusColor = '#be123c';
                      statusBg = '#ffe4e6';
                    } else if (cert.status === 'error' || Boolean(cert.error)) {
                      statusLabel = 'Error';
                      statusColor = '#b91c1c';
                      statusBg = '#fee2e2';
                    } else if (cert.status === 'critical') {
                      statusLabel = 'Kritis';
                      statusColor = '#c2410c';
                      statusBg = '#ffedd5';
                    } else if (cert.status === 'warning') {
                      statusLabel = 'Warning';
                      statusColor = '#b45309';
                      statusBg = '#fef3c7';
                    }

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                          {item.domain}
                          {item.port !== 443 && <span style={{ color: '#64748b', fontSize: '0.75rem' }}>:{item.port}</span>}
                          {item.alias && <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>{item.alias}</div>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                          {cert?.issuer?.organization || cert?.issuer?.commonName || '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: statusColor }}>
                          {cert && cert.daysRemaining !== undefined && !cert.error
                            ? `${cert.daysRemaining} hari`
                            : '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                          {cert?.validTo
                            ? new Date(cert.validTo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: statusBg,
                              color: statusColor,
                            }}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      Tidak ada data laporan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: '0.78125rem', color: '#64748b' }}>
              Halaman {currentPage} dari {totalPages}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentPage === 1 ? '#cbd5e1' : '#334155',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: page === currentPage ? '1px solid #16a34a' : '1px solid #cbd5e1',
                    background: page === currentPage ? '#16a34a' : '#ffffff',
                    color: page === currentPage ? '#ffffff' : '#334155',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentPage === totalPages ? '#cbd5e1' : '#334155',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Excel Download Confirmation Modal */}
      <ConfirmModal
        isOpen={showExportConfirm}
        title="Konfirmasi Unduh Laporan Excel"
        message={`Apakah Anda ingin mengunduh laporan status sertifikat SSL untuk seluruh ${domains.length} domain dalam format XLSX?`}
        confirmText="Unduh Sekarang"
        cancelText="Batal"
        type="info"
        onConfirm={handleExecuteExport}
        onClose={() => setShowExportConfirm(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            right: '1.25rem',
            zIndex: 9999,
            padding: '0.75rem 1.15rem',
            borderRadius: '10px',
            background: toast.type === 'success' ? '#166534' : '#991b1b',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
