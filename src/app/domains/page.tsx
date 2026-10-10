'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Globe,
  Search,
  Plus,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Trash2,
  Clock,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MonitoredDomain, SSLCheckSummary } from '@/types/ssl';
import { Sidebar } from '@/components/Sidebar';
import { AddDomainModal } from '@/components/AddDomainModal';
import { BatchAddModal } from '@/components/BatchAddModal';
import { DomainDetailModal } from '@/components/DomainDetailModal';
import { QRCodeModal } from '@/components/QRCodeModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { exportDomainsToExcel } from '@/lib/excel-export';

type FilterType = 'all' | 'valid' | 'warning' | 'critical' | 'expired' | 'error';

export default function DomainsPage() {
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [isRecheckingId, setIsRecheckingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedDetailDomain, setSelectedDetailDomain] = useState<MonitoredDomain | null>(null);
  const [qrModalTarget, setQrModalTarget] = useState<{ domain: string; port?: number; alias?: string } | null>(null);

  // Confirm Modals
  const [domainToDelete, setDomainToDelete] = useState<MonitoredDomain | null>(null);
  const [showExcelConfirm, setShowExcelConfirm] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchDomains = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const res = await fetch('/api/domains');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDomains(json.data);
      }
    } catch {
      showToast('Gagal memuat daftar domain', 'error');
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDomains(true);
  }, [fetchDomains]);

  // Summary
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

  // Recheck Single
  const handleRecheck = async (id: string) => {
    setIsRecheckingId(id);
    try {
      const res = await fetch(`/api/domains/${id}/check`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setDomains((prev) => prev.map((d) => (d.id === id ? json.data : d)));
        showToast(`SSL domain ${json.data.domain} berhasil diperbarui`);
      } else {
        throw new Error(json.error || 'Gagal memeriksa domain');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal memeriksa domain', 'error');
    } finally {
      setIsRecheckingId(null);
    }
  };

  // Add Domain
  const handleAddDomain = async (domain: string, port = 443, alias?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, port, alias }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.isDuplicate) {
          showToast(`Domain ${domain} sudah terdaftar`, 'error');
          return false;
        }
        setDomains((prev) => [json.data, ...prev]);
        showToast(`Domain ${domain} berhasil ditambahkan`);
        return true;
      }
      throw new Error(json.error || 'Gagal menambahkan domain');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Terjadi kesalahan', 'error');
      return false;
    }
  };

  // Batch Add
  const handleBatchAdd = async (domainsRaw: string[]) => {
    try {
      const res = await fetch('/api/domains/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: domainsRaw }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDomains(json.data);
        showToast(`Berhasil menambahkan ${json.addedCount} domain`);
        return { addedCount: json.addedCount, skippedCount: json.skippedCount };
      }
      throw new Error(json.error || 'Gagal memproses batch');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal batch domain', 'error');
      return { addedCount: 0, skippedCount: domainsRaw.length };
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!domainToDelete) return;
    try {
      const res = await fetch(`/api/domains?id=${domainToDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDomains((prev) => prev.filter((d) => d.id !== domainToDelete.id));
        showToast(`Domain ${domainToDelete.domain} telah dihapus`);
      } else {
        throw new Error(json.error || 'Gagal menghapus');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus domain', 'error');
    } finally {
      setDomainToDelete(null);
    }
  };

  // Confirm Excel Export
  const handleConfirmExportExcel = () => {
    if (domains.length === 0) {
      showToast('Tidak ada data domain untuk diexport', 'error');
      setShowExcelConfirm(false);
      return;
    }
    exportDomainsToExcel(domains);
    showToast('Laporan Excel berhasil diunduh');
    setShowExcelConfirm(false);
  };

  // Filtered Domains
  const filteredDomains = useMemo(() => {
    return domains.filter((item) => {
      if (statusFilter !== 'all') {
        const status = item.lastCheck?.status;
        if (statusFilter === 'error') {
          const isErr = status === 'error' || Boolean(item.lastCheck?.error) || (!status && !isLoading);
          if (!isErr) return false;
        } else {
          if (status !== statusFilter) return false;
        }
      }
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        item.domain.toLowerCase().includes(query) ||
        (item.alias && item.alias.toLowerCase().includes(query)) ||
        (item.lastCheck?.issuer?.organization && item.lastCheck.issuer.organization.toLowerCase().includes(query))
      );
    });
  }, [domains, statusFilter, searchQuery, isLoading]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Paginated Domains
  const totalPages = Math.ceil(filteredDomains.length / itemsPerPage) || 1;
  const paginatedDomains = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDomains.slice(start, start + itemsPerPage);
  }, [filteredDomains, currentPage, itemsPerPage]);

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
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Kelola Domain
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Daftar lengkap seluruh domain yang dipantau sertifikat SSL-nya
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
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari domain..."
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 0.75rem 0 2.2rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '0.8125rem',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowExcelConfirm(true)}
              style={{
                height: '36px',
                padding: '0 0.85rem',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                background: '#f0fdf4',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FileSpreadsheet size={15} />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              style={{
                height: '36px',
                padding: '0 0.85rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Layers size={15} style={{ color: '#2563eb' }} />
              <span>Batch Import</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              style={{
                height: '36px',
                padding: '0 1rem',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Plus size={15} />
              <span>Tambah Domain</span>
            </button>
          </div>
        </header>

        {/* Table Container */}
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
          {/* Filter Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {[
                { key: 'all' as FilterType, label: 'Semua', count: summary.total, color: '#2563eb', bg: '#eff6ff' },
                { key: 'valid' as FilterType, label: 'Valid', count: summary.valid, color: '#16a34a', bg: '#f0fdf4' },
                { key: 'warning' as FilterType, label: 'Warning', count: summary.warning, color: '#d97706', bg: '#fefce8' },
                { key: 'critical' as FilterType, label: 'Kritis', count: summary.critical, color: '#ea580c', bg: '#fff7ed' },
                { key: 'expired' as FilterType, label: 'Expired', count: summary.expired, color: '#e11d48', bg: '#ffe4e6' },
                { key: 'error' as FilterType, label: 'Error', count: summary.error, color: '#dc2626', bg: '#fef2f2' },
              ].map((btn) => {
                const isActive = statusFilter === btn.key;
                return (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={() => setStatusFilter(btn.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      border: isActive ? `1.5px solid ${btn.color}` : '1px solid #e2e8f0',
                      background: isActive ? btn.bg : '#ffffff',
                      color: isActive ? btn.color : '#64748b',
                      fontSize: '0.78125rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{btn.label}</span>
                    <span
                      style={{
                        padding: '0.1rem 0.4rem',
                        borderRadius: '999px',
                        background: isActive ? btn.color : '#f1f5f9',
                        color: isActive ? '#ffffff' : '#475569',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                      }}
                    >
                      {btn.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <span style={{ fontSize: '0.78125rem', color: '#64748b' }}>
              Menampilkan {filteredDomains.length} domain
            </span>
          </div>

          {/* Table Body */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10, borderBottom: '1px solid #e2e8f0' }}>
                <tr style={{ color: '#64748b', fontSize: '0.78125rem' }}>
                  <th style={{ padding: '0.75rem 1rem', width: '32px' }}>
                    <input type="checkbox" style={{ borderRadius: '4px' }} />
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Domain / Host</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Penerbit (CA)</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Sisa Waktu</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Kadaluarsa Pada</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status SSL</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDomains.length > 0 ? (
                  paginatedDomains.map((item) => {
                    const cert = item.lastCheck;
                    const isRecheckingThis = isRecheckingId === item.id;

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
                      <tr
                        key={item.id}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <input type="checkbox" style={{ borderRadius: '4px' }} />
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: statusBg,
                                color: statusColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                flexShrink: 0,
                              }}
                            >
                              {item.domain.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                {item.domain}
                                {item.port !== 443 && (
                                  <span style={{ fontSize: '0.6875rem', color: '#64748b', background: '#f1f5f9', padding: '0.05rem 0.35rem', borderRadius: '4px', marginLeft: '0.35rem' }}>
                                    :{item.port}
                                  </span>
                                )}
                              </div>
                              {item.alias && (
                                <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>{item.alias}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155', fontSize: '0.8125rem' }}>
                          {cert?.issuer?.organization || cert?.issuer?.commonName || '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {cert && cert.daysRemaining !== undefined && !cert.error ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Clock size={13} style={{ color: statusColor }} />
                              <span style={{ fontWeight: 700, color: statusColor }}>
                                {cert.daysRemaining < 0 ? 'Sudah Lewat' : `${cert.daysRemaining} hari`}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.78125rem' }}>
                          {cert?.validTo
                            ? new Date(cert.validTo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: statusBg,
                              color: statusColor,
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
                            <span>{statusLabel}</span>
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedDetailDomain(item)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #bfdbfe',
                                background: '#eff6ff',
                                color: '#2563eb',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={13} />
                              <span>Detail</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRecheck(item.id)}
                              disabled={isRecheckingThis}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                background: '#ffffff',
                                color: '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: isRecheckingThis ? 'not-allowed' : 'pointer',
                              }}
                              title="Cek Ulang SSL"
                            >
                              <RefreshCw size={13} className={isRecheckingThis ? 'spin-slow' : ''} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setQrModalTarget({ domain: item.domain, port: item.port, alias: item.alias })}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                background: '#ffffff',
                                color: '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              title="QR Code"
                            >
                              <QrCode size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDomainToDelete(item)}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                border: '1px solid #fee2e2',
                                background: '#fef2f2',
                                color: '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              title="Hapus Domain"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      Belum ada data domain yang cocok.
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
              Menampilkan {filteredDomains.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredDomains.length)} dari {filteredDomains.length} domain
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
                    border: page === currentPage ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    background: page === currentPage ? '#2563eb' : '#ffffff',
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

      {/* Modals */}
      <AddDomainModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddDomain={handleAddDomain} />
      <BatchAddModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} onBatchAdd={handleBatchAdd} />
      <DomainDetailModal domain={selectedDetailDomain} onClose={() => setSelectedDetailDomain(null)} />
      <QRCodeModal isOpen={!!qrModalTarget} domain={qrModalTarget?.domain || null} port={qrModalTarget?.port} alias={qrModalTarget?.alias} onClose={() => setQrModalTarget(null)} />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!domainToDelete}
        title="Konfirmasi Hapus Domain"
        message={`Apakah Anda yakin ingin menghapus domain "${domainToDelete?.domain}" dari daftar pemantauan? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Domain"
        cancelText="Batal"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDomainToDelete(null)}
      />

      {/* Excel Download Confirmation Modal */}
      <ConfirmModal
        isOpen={showExcelConfirm}
        title="Konfirmasi Unduh Laporan Excel"
        message={`Apakah Anda ingin mengunduh laporan status sertifikat SSL untuk seluruh ${domains.length} domain dalam format XLSX?`}
        confirmText="Unduh Sekarang"
        cancelText="Batal"
        type="info"
        onConfirm={handleConfirmExportExcel}
        onClose={() => setShowExcelConfirm(false)}
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
