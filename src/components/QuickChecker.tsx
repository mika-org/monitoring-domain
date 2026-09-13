'use client';

import React, { useState } from 'react';
import { Search, Globe, Shield, ShieldCheck, AlertTriangle, AlertCircle, Plus, Check, Loader2, Calendar, Award, ExternalLink, QrCode } from 'lucide-react';
import { SSLCertificateInfo } from '@/types/ssl';
import { QRCodeModal } from './QRCodeModal';

interface QuickCheckerProps {
  onAddToWatchlist: (domain: string, port?: number) => Promise<boolean>;
  isDomainAlreadyMonitored: (domain: string, port?: number) => boolean;
}

export const QuickChecker: React.FC<QuickCheckerProps> = ({
  onAddToWatchlist,
  isDomainAlreadyMonitored,
}) => {
  const [domainInput, setDomainInput] = useState('');
  const [portInput, setPortInput] = useState('443');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SSLCertificateInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);
    setAddedSuccess(false);

    try {
      const res = await fetch('/api/ssl/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domainInput.trim(),
          port: parseInt(portInput, 10) || 443,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memeriksa domain');
      }

      setResult(json.data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat memeriksa domain');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!result) return;
    setIsAdding(true);
    try {
      const success = await onAddToWatchlist(result.domain, result.port);
      if (success) {
        setAddedSuccess(true);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const isMonitored = result ? isDomainAlreadyMonitored(result.domain, result.port) || addedSuccess : false;

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(new Date(isoStr));
    } catch {
      return isoStr;
    }
  };

  const getStatusBadge = (info: SSLCertificateInfo) => {
    if (info.status === 'valid') {
      return (
        <span className="result-badge badge-valid">
          <span className="status-dot" /> Valid &amp; Aktif
        </span>
      );
    }
    if (info.status === 'warning') {
      return (
        <span className="result-badge badge-warning">
          <span className="status-dot" /> Segera Kadaluarsa
        </span>
      );
    }
    if (info.status === 'critical') {
      return (
        <span className="result-badge badge-critical">
          <span className="status-dot" /> Kritis (&le; 7 Hari)
        </span>
      );
    }
    if (info.status === 'expired') {
      return (
        <span className="result-badge badge-expired">
          <span className="status-dot" /> Sertifikat Kadaluarsa
        </span>
      );
    }
    return (
      <span className="result-badge badge-error">
        <span className="status-dot" /> Error / Tidak Valid
      </span>
    );
  };

  return (
    <div className="quick-checker-card">
      <div className="checker-header">
        <h2 className="checker-title">
          <Shield size={20} style={{ color: 'var(--cyan-400)' }} />
          Pengecekan Instan Sertifikat SSL
        </h2>
        <p className="checker-subtitle">
          Ketik nama domain atau URL untuk memeriksa langsung sisa masa aktif, penerbit (CA), dan keabsahan sertifikat SSL/TLS.
        </p>
      </div>

      <form onSubmit={handleCheck} className="checker-form">
        <div className="checker-input-wrapper">
          <Search size={18} className="checker-input-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Contoh: google.com, tokopedia.com, atau api.mysite.id"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="port-input-wrapper">
          <input
            type="number"
            className="input-text"
            placeholder="Port (443)"
            value={portInput}
            onChange={(e) => setPortInput(e.target.value)}
            disabled={isLoading}
            min={1}
            max={65535}
            style={{ paddingLeft: '1rem' }}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isLoading || !domainInput.trim()}>
          {isLoading ? (
            <>
              <Loader2 size={16} className="spin-slow" />
              <span>Memeriksa...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Periksa SSL</span>
            </>
          )}
        </button>
      </form>

      {errorMsg && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-critical-bg)',
            border: '1px solid var(--status-critical-border)',
            color: 'var(--status-critical-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {result && (
        <div className="ssl-result-box">
          <div className="result-header">
            <div className="result-domain-info">
              <Globe size={22} style={{ color: 'var(--cyan-400)' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="result-domain-name">{result.domain}</span>
                  {result.port !== 443 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>:{result.port}</span>
                  )}
                  <a
                    href={`https://${result.domain}${result.port !== 443 ? `:${result.port}` : ''}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--text-dim)' }}
                    title="Buka website di tab baru"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Common Name: {result.subject.commonName || '-'}
                </div>
              </div>
            </div>

            {getStatusBadge(result)}
          </div>

          <div className="result-grid">
            <div>
              <div className="result-item-label">Masa Berlaku Tersisa</div>
              <div
                className="result-item-highlight"
                style={{
                  color:
                    result.status === 'valid'
                      ? 'var(--status-valid-text)'
                      : result.status === 'warning'
                      ? 'var(--status-warning-text)'
                      : 'var(--status-critical-text)',
                }}
              >
                {result.status === 'error'
                  ? 'Gagal Membaca'
                  : result.daysRemaining <= 0
                  ? 'Kadaluarsa'
                  : `${result.daysRemaining} Hari Lagi`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                {result.isExpired ? 'Sertifikat tidak lagi berlaku' : `Berakhir pada: ${formatDate(result.validTo)}`}
              </div>
            </div>

            <div>
              <div className="result-item-label">
                <Award size={13} style={{ display: 'inline', marginRight: 4 }} />
                Penerbit Sertifikat (CA)
              </div>
              <div className="result-item-value">
                {result.issuer.organization || result.issuer.commonName || 'Tidak Diketahui'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                {result.issuer.commonName}
              </div>
            </div>

            <div>
              <div className="result-item-label">
                <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                Tanggal Berlaku
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                Mulai: {formatDate(result.validFrom)}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Hingga: {formatDate(result.validTo)}
              </div>
            </div>

            <div>
              <div className="result-item-label">Keamanan &amp; Protokol</div>
              <div className="result-item-value" style={{ fontSize: '0.8125rem' }}>
                {result.protocol || 'TLS 1.2 / 1.3'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                {result.authorized ? 'Terverifikasi (Trusted Root CA)' : result.error || 'Untrusted / Self-Signed'}
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setResult(null)}
            >
              Tutup Hasil
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowQr(true)}
              title="Generate QR Code untuk domain ini"
            >
              <QrCode size={14} />
              <span>Generate QR</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${isMonitored ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleAdd}
              disabled={isMonitored || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 size={14} className="spin-slow" />
                  <span>Menyimpan...</span>
                </>
              ) : isMonitored ? (
                <>
                  <Check size={14} style={{ color: 'var(--status-valid-text)' }} />
                  <span>Sudah Dipantau</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>+ Tambahkan ke Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <QRCodeModal
        isOpen={showQr}
        domain={result?.domain || null}
        port={result?.port}
        onClose={() => setShowQr(false)}
      />
    </div>
  );
};
