'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, ExternalLink, QrCode, Globe, Sparkles } from 'lucide-react';

interface QRCodeModalProps {
  domain: string | null;
  port?: number;
  alias?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  domain,
  port = 443,
  alias,
  isOpen,
  onClose,
}) => {
  const [url, setUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSize, setQrSize] = useState<number>(300);
  const [cardPadding, setCardPadding] = useState<number>(16);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize URL whenever domain or port changes
  useEffect(() => {
    if (domain) {
      const portSuffix = port && port !== 443 && port !== 80 ? `:${port}` : '';
      setUrl(`https://${domain}${portSuffix}`);
    }
  }, [domain, port]);

  // Generate QR Code whenever URL or qrSize changes
  const generateQRCode = useCallback(async (targetUrl: string, size: number) => {
    if (!targetUrl) return;
    setIsGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(targetUrl, {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#090d16',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed generating QR code', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && url) {
      generateQRCode(url, qrSize);
    }
  }, [isOpen, url, qrSize, generateQRCode]);

  if (!isOpen || !domain) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const pad = Math.round((cardPadding / 220) * qrSize);
      const canvas = document.createElement('canvas');
      canvas.width = qrSize + pad * 2;
      canvas.height = qrSize + pad * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, pad, pad, qrSize, qrSize);
        const finalUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = finalUrl;
        link.download = `qrcode-${domain.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    img.src = qrDataUrl;
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL', err);
    }
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const pad = Math.round((cardPadding / 220) * qrSize);
        const canvas = document.createElement('canvas');
        canvas.width = qrSize + pad * 2;
        canvas.height = qrSize + pad * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, pad, pad, qrSize, qrSize);
          canvas.toBlob(async (blob) => {
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
              ]);
              setCopiedImage(true);
              setTimeout(() => setCopiedImage(false), 2000);
            }
          }, 'image/png');
        }
      };
      img.src = qrDataUrl;
    } catch (err) {
      console.error('Failed to copy QR image', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <QrCode size={20} style={{ color: 'var(--cyan-400)' }} />
            <span>QR Code Domain: {domain}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div
          className="modal-body"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            textAlign: 'center',
          }}
        >
          {alias && (
            <div
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Alias: <strong style={{ color: '#ffffff' }}>{alias}</strong>
            </div>
          )}

          {/* QR Code Canvas Card */}
          <div
            style={{
              background: '#ffffff',
              padding: `${cardPadding}px`,
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 211, 238, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
          >
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`QR Code untuk ${domain}`}
                width={220}
                height={220}
                style={{
                  display: 'block',
                  borderRadius: '4px',
                  userSelect: 'none',
                }}
              />
            ) : (
              <div
                style={{
                  width: '220px',
                  height: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                Membuat QR Code...
              </div>
            )}
          </div>

          {/* Padding Card Control */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Padding Card Putih:</span>
              <strong style={{ color: 'var(--cyan-400)' }}>{cardPadding}px</strong>
            </div>
            <input
              type="range"
              min={0}
              max={48}
              step={4}
              value={cardPadding}
              onChange={(e) => setCardPadding(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--cyan-400)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'space-between' }}>
              {[0, 8, 16, 24, 32].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${cardPadding === p ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', flex: 1 }}
                  onClick={() => setCardPadding(p)}
                >
                  {p === 0 ? '0px' : `${p}px`}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
            Scan dengan kamera ponsel untuk membuka website secara langsung.
          </p>

          {/* URL Input & Customization */}
          <div style={{ width: '100%', textAlign: 'left' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: '0.35rem',
              }}
            >
              Target URL
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-text"
                style={{ paddingLeft: '1rem', fontSize: '0.8125rem' }}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://domain.com"
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyUrl}
                title="Salin URL"
              >
                {copiedUrl ? <Check size={14} style={{ color: 'var(--status-valid-text)' }} /> : <Copy size={14} />}
                <span>{copiedUrl ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* QR Size Options */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Resolusi Unduh:</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[250, 400, 800].map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`btn btn-sm ${qrSize === size ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={() => setQrSize(size)}
                >
                  {size === 250 ? 'Kecil' : size === 400 ? 'Sedang' : 'Tinggi (HD)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
          >
            <ExternalLink size={14} />
            <span>Buka Website</span>
          </a>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopyImage}
            disabled={!qrDataUrl}
          >
            {copiedImage ? (
              <Check size={14} style={{ color: 'var(--status-valid-text)' }} />
            ) : (
              <Sparkles size={14} />
            )}
            <span>{copiedImage ? 'Gambar Tersalin' : 'Salin Gambar'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleDownload}
            disabled={!qrDataUrl || isGenerating}
          >
            <Download size={14} />
            <span>Unduh PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
