'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Trash2,
  Info,
  ExternalLink,
  Shield,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  XCircle,
  HelpCircle,
  QrCode,
} from 'lucide-react';
import { MonitoredDomain, SSLStatus } from '@/types/ssl';
import { DomainDetailModal } from './DomainDetailModal';
import { QRCodeModal } from './QRCodeModal';

interface DomainTableProps {
  domains: MonitoredDomain[];
  onRecheck: (id: string) => Promise<void>;
  onDelete: (id: string, domainName: string) => Promise<void>;
  isRecheckingId: string | null;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onOpenAddModal: () => void;
}

export const DomainTable: React.FC<DomainTableProps> = ({
  domains,
  onRecheck,
  onDelete,
  isRecheckingId,
  activeFilter,
  onFilterChange,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'days-asc' | 'days-desc' | 'name-asc' | 'name-desc' | 'checked'>('days-asc');
  const [selectedDomainForDetail, setSelectedDomainForDetail] = useState<MonitoredDomain | null>(null);
  const [qrModalTarget, setQrModalTarget] = useState<{ domain: string; port?: number; alias?: string } | null>(null);

  // Filter & Sort logic
  const filteredDomains = useMemo(() => {
    return domains
      .filter((item) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchDomain = item.domain.toLowerCase().includes(q);
          const matchAlias = item.alias?.toLowerCase().includes(q);
          const matchIssuer = item.lastCheck?.issuer.organization.toLowerCase().includes(q) ||
                              item.lastCheck?.issuer.commonName.toLowerCase().includes(q);
          if (!matchDomain && !matchAlias && !matchIssuer) return false;
        }

        // Status tab filter
        if (activeFilter === 'all') return true;
        const status = item.lastCheck?.status || 'unchecked';
        if (activeFilter === 'valid') return status === 'valid';
        if (activeFilter === 'warning') return status === 'warning';
        if (activeFilter === 'critical') return status === 'critical';
        if (activeFilter === 'expired') return status === 'expired';
        if (activeFilter === 'error') return status === 'error';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'days-asc') {
          const daysA = a.lastCheck ? a.lastCheck.daysRemaining : 99999;
          const daysB = b.lastCheck ? b.lastCheck.daysRemaining : 99999;
          return daysA - daysB;
        }
        if (sortBy === 'days-desc') {
          const daysA = a.lastCheck ? a.lastCheck.daysRemaining : -99999;
          const daysB = b.lastCheck ? b.lastCheck.daysRemaining : -99999;
          return daysB - daysA;
        }
        if (sortBy === 'name-asc') {
          return a.domain.localeCompare(b.domain);
        }
        if (sortBy === 'name-desc') {
          return b.domain.localeCompare(a.domain);
        }
        if (sortBy === 'checked') {
          const timeA = a.lastCheck?.checkedAt ? new Date(a.lastCheck.checkedAt).getTime() : 0;
          const timeB = b.lastCheck?.checkedAt ? new Date(b.lastCheck.checkedAt).getTime() : 0;
          return timeB - timeA;
        }
        return 0;
      });
  }, [domains, searchQuery, activeFilter, sortBy]);

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(isoStr));
    } catch {
      return isoStr;
    }
  };

  const formatRelativeTime = (isoStr?: string) => {
    if (!isoStr) return 'Belum pernah dicek';
    try {
      const diffMs = Date.now() - new Date(isoStr).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Baru saja';
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} jam lalu`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} hari lalu`;
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (status?: SSLStatus) => {
    switch (status) {
      case 'valid':
        return (
          <span className="result-badge badge-valid">
            <CheckCircle2 size={12} /> Valid
          </span>
        );
      case 'warning':
        return (
          <span className="result-badge badge-warning">
            <AlertTriangle size={12} /> Segera Habis
          </span>
        );
      case 'critical':
        return (
          <span className="result-badge badge-critical">
            <AlertOctagon size={12} /> Kritis
          </span>
        );
      case 'expired':
        return (
          <span className="result-badge badge-expired">
            <XCircle size={12} /> Expired
          </span>
        );
      case 'error':
        return (
          <span className="result-badge badge-error">
            <AlertCircle size={12} /> Error
          </span>
        );
      default:
        return (
          <span className="result-badge badge-error">
            <HelpCircle size={12} /> Menunggu
          </span>
        );
    }
  };

  // Progress bar percentage (assuming 90 days standard SSL validity)
  const getProgressWidth = (daysRemaining: number) => {
    if (daysRemaining <= 0) return 0;
    const maxDays = 90; // Standard Let's Encrypt lifecycle
    const pct = Math.min(100, Math.max(5, Math.round((daysRemaining / maxDays) * 100)));
    return pct;
  };

  const getProgressClass = (status?: SSLStatus) => {
    if (status === 'valid') return 'progress-fill-valid';
    if (status === 'warning') return 'progress-fill-warning';
    if (status === 'critical') return 'progress-fill-critical';
    return 'progress-fill-expired';
  };

  return (
    <div className="watchlist-section">
      <div className="watchlist-header">
        <h2 className="section-title">
          <Shield size={20} style={{ color: 'var(--primary-500)' }} />
          Daftar Domain Terpantau ({filteredDomains.length} dari {domains.length})
        </h2>
      </div>

      <div className="toolbar-container">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Cari domain, alias, atau issuer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            Semua ({domains.length})
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'valid' ? 'active' : ''}`}
            onClick={() => onFilterChange('valid')}
          >
            Aman
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'warning' ? 'active' : ''}`}
            onClick={() => onFilterChange('warning')}
          >
            Segera Habis
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'critical' ? 'active' : ''}`}
            onClick={() => onFilterChange('critical')}
          >
            Kritis
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'expired' ? 'active' : ''}`}
            onClick={() => onFilterChange('expired')}
          >
            Kadaluarsa
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === 'error' ? 'active' : ''}`}
            onClick={() => onFilterChange('error')}
          >
            Error
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpDown size={14} style={{ color: 'var(--text-dim)' }} />
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="days-asc">Sisa Hari Terdekat</option>
            <option value="days-desc">Sisa Hari Terbanyak</option>
            <option value="name-asc">Nama Domain (A-Z)</option>
            <option value="name-desc">Nama Domain (Z-A)</option>
            <option value="checked">Terakhir Dicek</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {filteredDomains.length === 0 ? (
          <div className="empty-state">
            <Shield className="empty-icon" />
            <h3 className="empty-title">
              {domains.length === 0 ? 'Belum Ada Domain yang Dipantau' : 'Tidak Ada Domain yang Cocok'}
            </h3>
            <p className="empty-desc">
              {domains.length === 0
                ? 'Tambahkan domain pertama Anda untuk mulai memantau masa aktif sertifikat SSL secara realtime.'
                : 'Coba ubah kata kunci pencarian atau reset filter status di atas.'}
            </p>
            {domains.length === 0 && (
              <button type="button" className="btn btn-primary btn-sm" onClick={onOpenAddModal}>
                + Tambah Domain Sekarang
              </button>
            )}
          </div>
        ) : (
          <table className="domain-table">
            <thead>
              <tr>
                <th>Domain &amp; Info</th>
                <th>Status</th>
                <th>Sisa Masa Berlaku</th>
                <th>Kadaluarsa Pada</th>
                <th>Penerbit (CA)</th>
                <th>Terakhir Dicek</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredDomains.map((item) => {
                const info = item.lastCheck;
                const isRecheckingThis = isRecheckingId === item.id;

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="domain-primary">
                        <div className="domain-name-link">
                          <span>{item.domain}</span>
                          {item.port !== 443 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              :{item.port}
                            </span>
                          )}
                          <a
                            href={`https://${item.domain}${item.port !== 443 ? `:${item.port}` : ''}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--text-dim)' }}
                            title="Kunjungi Domain"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        {item.alias && <span className="domain-alias">{item.alias}</span>}
                      </div>
                    </td>

                    <td>{getStatusBadge(info?.status)}</td>

                    <td>
                      {!info ? (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                          Belum diperiksa
                        </span>
                      ) : info.status === 'error' ? (
                        <span style={{ color: 'var(--status-critical-text)', fontSize: '0.8125rem' }}>
                          {info.error || 'Gagal'}
                        </span>
                      ) : (
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              color:
                                info.status === 'valid'
                                  ? 'var(--status-valid-text)'
                                  : info.status === 'warning'
                                  ? 'var(--status-warning-text)'
                                  : 'var(--status-critical-text)',
                            }}
                          >
                            {info.daysRemaining <= 0 ? 'Kadaluarsa' : `${info.daysRemaining} hari lagi`}
                          </div>
                          <div className="progress-bar-container">
                            <div
                              className={`progress-bar-fill ${getProgressClass(info.status)}`}
                              style={{ width: `${getProgressWidth(info.daysRemaining)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                        {formatDate(info?.validTo)}
                      </span>
                    </td>

                    <td>
                      <div style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }} title={info?.issuer.organization || info?.issuer.commonName}>
                          {info?.issuer.organization || info?.issuer.commonName || '-'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        <Clock size={12} />
                        <span>{formatRelativeTime(info?.checkedAt)}</span>
                      </div>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => onRecheck(item.id)}
                          disabled={isRecheckingThis}
                          title="Periksa ulang sertifikat SSL domain ini"
                        >
                          <RefreshCw size={14} className={isRecheckingThis ? 'spin-slow' : ''} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => setQrModalTarget({ domain: item.domain, port: item.port, alias: item.alias })}
                          title="Generate QR Code untuk domain ini"
                        >
                          <QrCode size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => setSelectedDomainForDetail(item)}
                          title="Lihat detail sertifikat lengkap"
                        >
                          <Info size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger-ghost btn-icon btn-sm"
                          onClick={() => onDelete(item.id, item.domain)}
                          title="Hapus domain dari pantauan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <DomainDetailModal
        domain={selectedDomainForDetail}
        onClose={() => setSelectedDomainForDetail(null)}
      />

      <QRCodeModal
        isOpen={!!qrModalTarget}
        domain={qrModalTarget?.domain || null}
        port={qrModalTarget?.port}
        alias={qrModalTarget?.alias}
        onClose={() => setQrModalTarget(null)}
      />
    </div>
  );
};
