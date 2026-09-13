'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Shield, Calendar, Key, Globe, ExternalLink, Server, QrCode } from 'lucide-react';
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Shield size={20} style={{ color: 'var(--cyan-400)' }} />
            <span>Detail Sertifikat SSL: {domain.domain}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {domain.alias && (
            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Alias / Nama Label: <strong style={{ color: '#ffffff' }}>{domain.alias}</strong>
            </div>
          )}

          {!info ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Data SSL untuk domain ini belum pernah diperiksa.
            </div>
          ) : (
            <>
              {/* Masa Berlaku */}
              <div className="detail-section-title">
                <Calendar size={15} /> Masa Berlaku &amp; Status
              </div>
              <div className="detail-grid">
                <div>
                  <div className="result-item-label">Status Sertifikat</div>
                  <div className="result-item-value" style={{ textTransform: 'capitalize' }}>
                    {info.status === 'valid'
                      ? 'Valid & Aktif'
                      : info.status === 'warning'
                      ? 'Segera Kadaluarsa'
                      : info.status === 'critical'
                      ? 'Kritis'
                      : info.status === 'expired'
                      ? 'Kadaluarsa'
                      : 'Error'}
                  </div>
                </div>

                <div>
                  <div className="result-item-label">Sisa Waktu</div>
                  <div
                    className="result-item-value"
                    style={{
                      fontWeight: 700,
                      color:
                        info.status === 'valid'
                          ? 'var(--status-valid-text)'
                          : info.status === 'warning'
                          ? 'var(--status-warning-text)'
                          : 'var(--status-critical-text)',
                    }}
                  >
                    {info.daysRemaining <= 0 ? 'Sudah Kadaluarsa' : `${info.daysRemaining} Hari`}
                  </div>
                </div>

                <div className="detail-item-full">
                  <div className="result-item-label">Berlaku Sejak</div>
                  <div className="result-item-value">{formatDate(info.validFrom)}</div>
                </div>

                <div className="detail-item-full">
                  <div className="result-item-label">Kadaluarsa Pada (Valid Until)</div>
                  <div className="result-item-value">{formatDate(info.validTo)}</div>
                </div>
              </div>

              {/* Penerbit (Issuer) */}
              <div className="detail-section-title">
                <Server size={15} /> Penerbit Sertifikat (Certificate Authority)
              </div>
              <div className="detail-grid">
                <div>
                  <div className="result-item-label">Organisasi (O)</div>
                  <div className="result-item-value">{info.issuer.organization || '-'}</div>
                </div>

                <div>
                  <div className="result-item-label">Common Name (CN)</div>
                  <div className="result-item-value">{info.issuer.commonName || '-'}</div>
                </div>

                <div>
                  <div className="result-item-label">Negara (C)</div>
                  <div className="result-item-value">{info.issuer.country || '-'}</div>
                </div>

                <div>
                  <div className="result-item-label">Root CA Trust</div>
                  <div className="result-item-value">
                    {info.authorized ? 'Trusted CA' : 'Untrusted / Self-signed'}
                  </div>
                </div>
              </div>

              {/* Subjek (Subject) */}
              <div className="detail-section-title">
                <Globe size={15} /> Subjek &amp; Domain yang Dilindungi
              </div>
              <div className="detail-grid">
                <div className="detail-item-full">
                  <div className="result-item-label">Common Name (CN)</div>
                  <div className="result-item-value">{info.subject.commonName || '-'}</div>
                </div>

                <div className="detail-item-full">
                  <div className="result-item-label">
                    Subject Alternative Names (SANs) — {info.subjectAltNames.length} domain
                  </div>
                  <div className="tag-list">
                    {info.subjectAltNames.length > 0 ? (
                      info.subjectAltNames.map((san, idx) => (
                        <span key={idx} className="tag-item">
                          {san}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Tidak ada catatan SANs
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detail Kriptografi & Teknis */}
              <div className="detail-section-title">
                <Key size={15} /> Detail Kriptografi &amp; Keamanan
              </div>
              <div className="detail-grid">
                <div>
                  <div className="result-item-label">Protokol TLS</div>
                  <div className="result-item-value">{info.protocol || 'TLS'}</div>
                </div>

                <div>
                  <div className="result-item-label">Cipher Suite</div>
                  <div className="result-item-value" style={{ fontSize: '0.8rem' }}>
                    {info.cipher || '-'}
                  </div>
                </div>

                {info.serialNumber && (
                  <div className="detail-item-full">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div className="result-item-label">Nomor Seri (Serial Number)</div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                        onClick={() => copyToClipboard(info.serialNumber!, 'serial')}
                      >
                        {copiedSerial ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedSerial ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <div
                      className="result-item-value"
                      style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                    >
                      {info.serialNumber}
                    </div>
                  </div>
                )}

                {info.fingerprint256 && (
                  <div className="detail-item-full">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div className="result-item-label">SHA-256 Fingerprint</div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                        onClick={() => copyToClipboard(info.fingerprint256!, 'fingerprint')}
                      >
                        {copiedFingerprint ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedFingerprint ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <div
                      className="result-item-value"
                      style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                    >
                      {info.fingerprint256}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowQr(true)}
            title="Generate QR Code"
          >
            <QrCode size={14} />
            <span>QR Code</span>
          </button>

          <a
            href={`https://${domain.domain}${domain.port !== 443 ? `:${domain.port}` : ''}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={14} />
            <span>Kunjungi Domain</span>
          </a>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>

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
