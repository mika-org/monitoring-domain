'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Shield,
  Calendar,
  Key,
  Globe,
  ExternalLink,
  Server,
  QrCode,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { MonitoredDomain } from '@/types/ssl';
import { QRCodeModal } from './QRCodeModal';

interface DomainDetailModalProps {
  domain: MonitoredDomain | null;
  onClose: () => void;
}

export const DomainDetailModal: React.FC<DomainDetailModalProps> = ({ domain, onClose }) => {
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!domain) return null;

  const info = domain.lastCheck;

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }).format(new Date(isoStr));
    } catch {
      return isoStr;
    }
  };

  const copyToClipboard = async (text: string, type: 'fingerprint' | 'serial') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'fingerprint') {
        setCopiedFingerprint(true);
        setTimeout(() => setCopiedFingerprint(false), 2000);
      } else {
        setCopiedSerial(true);
        setTimeout(() => setCopiedSerial(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Determine status color & badge
  let statusBadgeBg = '#dcfce7';
  let statusBadgeColor = '#15803d';
  let statusLabel = 'Valid & Aktif';

  if (!info) {
    statusBadgeBg = '#f1f5f9';
    statusBadgeColor = '#475569';
    statusLabel = 'Belum Diperiksa';
  } else if (info.status === 'expired') {
    statusBadgeBg = '#ffe4e6';
    statusBadgeColor = '#be123c';
    statusLabel = 'Kadaluarsa';
  } else if (info.status === 'error' || Boolean(info.error)) {
    statusBadgeBg = '#fee2e2';
    statusBadgeColor = '#b91c1c';
    statusLabel = 'Error / Gagal';
  } else if (info.status === 'critical') {
    statusBadgeBg = '#ffedd5';
    statusBadgeColor = '#c2410c';
    statusLabel = 'Kritis (< 7 Hari)';
  } else if (info.status === 'warning') {
    statusBadgeBg = '#fef3c7';
    statusBadgeColor = '#b45309';
    statusLabel = 'Warning (< 30 Hari)';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
          fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Detail Sertifikat SSL
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.84375rem', fontWeight: 600, color: '#2563eb' }}>
                  {domain.domain}
                </span>
                {domain.port !== 443 && (
                  <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#64748b', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                    Port {domain.port}
                  </span>
                )}
                {domain.alias && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    &bull; {domain.alias}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body with clean scrolling */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            background: '#f8fafc',
          }}
        >
          {!info ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Clock size={36} style={{ color: '#94a3b8', margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                Belum Ada Data Pengecekan
              </div>
              <div style={{ fontSize: '0.84375rem', marginTop: '0.35rem' }}>
                Domain ini belum pernah diperiksa atau proses pengecekan sedang berjalan.
              </div>
            </div>
          ) : (
            <>
              {/* Error Notice if any */}
              {(info.status === 'error' || Boolean(info.error) || Boolean(info.authorizationError)) && (
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Peringatan Masalah SSL</div>
                    <div style={{ fontSize: '0.8125rem', marginTop: '0.2rem', lineHeight: 1.5 }}>
                      {info.error || info.authorizationError || 'Terjadi galat saat menghubungkan ke port TLS/SSL domain ini.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Status & Validity Banner Card */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '999px',
                        background: statusBadgeBg,
                        color: statusBadgeColor,
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusBadgeColor }} />
                      <span>{statusLabel}</span>
                    </span>

                    {info.daysRemaining !== undefined && !info.error && (
                      <span
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 800,
                          color: statusBadgeColor,
                        }}
                      >
                        {info.daysRemaining < 0 ? 'Sudah Lewat' : `${info.daysRemaining} Hari Tersisa`}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Dicek: {info.checkedAt ? new Date(info.checkedAt).toLocaleString('id-ID') : '-'}
                  </span>
                </div>

                {/* Validity Dates 2-Column Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1rem',
                    marginTop: '1.25rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} style={{ color: '#2563eb' }} />
                      <span>Berlaku Sejak (Valid From)</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.35rem' }}>
                      {formatDate(info.validFrom)}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ color: '#dc2626' }} />
                      <span>Kadaluarsa Pada (Valid Until)</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.35rem' }}>
                      {formatDate(info.validTo)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1: Certificate Authority (Issuer) */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 700, fontSize: '0.9375rem' }}>
                  <Server size={18} style={{ color: '#2563eb' }} />
                  <span>Penerbit Sertifikat (Certificate Authority)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Organisasi (O)</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                      {info.issuer.organization || '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Common Name (CN)</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                      {info.issuer.commonName || '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Negara (C)</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                      {info.issuer.country || '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Root CA Trust</div>
                    <div style={{ marginTop: '0.2rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: info.authorized ? '#dcfce7' : '#fef3c7',
                          color: info.authorized ? '#15803d' : '#b45309',
                        }}
                      >
                        {info.authorized ? 'Trusted CA' : 'Untrusted / Self-signed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Subject & SANs */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 700, fontSize: '0.9375rem' }}>
                  <Globe size={18} style={{ color: '#2563eb' }} />
                  <span>Subjek &amp; Domain yang Dilindungi</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Subject Common Name (CN)</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                      {info.subject.commonName || domain.domain}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem' }}>
                      Subject Alternative Names (SANs) &bull; {info.subjectAltNames?.length || 0} domain
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {info.subjectAltNames && info.subjectAltNames.length > 0 ? (
                        info.subjectAltNames.map((san, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#eff6ff',
                              color: '#1e40af',
                              border: '1px solid #bfdbfe',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.78125rem',
                              fontFamily: 'monospace',
                            }}
                          >
                            {san}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                          Tidak ada domain SANs tambahan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Technical & Cryptographic Details */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 700, fontSize: '0.9375rem' }}>
                  <Key size={18} style={{ color: '#2563eb' }} />
                  <span>Detail Kriptografi &amp; Keamanan</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Protokol TLS</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                      {info.protocol || 'TLSv1.3'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cipher Suite</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                      {info.cipher || '-'}
                    </div>
                  </div>
                </div>

                {/* Serial Number with Copy */}
                {info.serialNumber && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Nomor Seri (Serial Number)</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(info.serialNumber!, 'serial')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedSerial ? '#16a34a' : '#2563eb',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        {copiedSerial ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedSerial ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#0f172a',
                        wordBreak: 'break-all',
                      }}
                    >
                      {info.serialNumber}
                    </div>
                  </div>
                )}

                {/* SHA-256 Fingerprint with Copy */}
                {info.fingerprint256 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>SHA-256 Fingerprint</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(info.fingerprint256!, 'fingerprint')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedFingerprint ? '#16a34a' : '#2563eb',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        {copiedFingerprint ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedFingerprint ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#0f172a',
                        wordBreak: 'break-all',
                      }}
                    >
                      {info.fingerprint256}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowQr(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <QrCode size={15} />
              <span>QR Code</span>
            </button>

            <a
              href={`https://${domain.domain}${domain.port !== 443 ? `:${domain.port}` : ''}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={15} />
              <span>Kunjungi Domain</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.35rem',
              borderRadius: '8px',
              background: '#2563eb',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
            }}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* QR Code Modal Child */}
      <QRCodeModal
        isOpen={showQr}
        domain={domain.domain}
        port={domain.port}
        alias={domain.alias}
        onClose={() => setShowQr(false)}
      />
    </div>
  );
};
