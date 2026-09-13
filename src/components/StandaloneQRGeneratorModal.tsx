'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Globe,
  Download,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Sliders,
  ShieldCheck,
  BookmarkPlus,
  Sparkles,
  Link as LinkIcon,
  Palette,
} from 'lucide-react';
import { parseDomainInput } from '@/lib/domain-utils';

interface QueryParam {
  id: string;
  key: string;
  value: string;
}

interface StandaloneQRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckSSL?: (domain: string, port?: number) => void;
  onAddToWatchlist?: (domain: string, port?: number) => Promise<boolean>;
  initialDomain?: string;
}

const COLOR_PRESETS = [
  { label: 'Cyber Dark', dark: '#090d16', light: '#ffffff' },
  { label: 'Deep Indigo', dark: '#1e1b4b', light: '#ffffff' },
  { label: 'Ocean Blue', dark: '#0369a1', light: '#f0f9ff' },
  { label: 'Emerald Green', dark: '#065f46', light: '#ecfdf5' },
  { label: 'Neon Cyber', dark: '#06b6d4', light: '#090d16' },
];

export const StandaloneQRGeneratorModal: React.FC<StandaloneQRGeneratorModalProps> = ({
  isOpen,
  onClose,
  onAddToWatchlist,
  initialDomain = '',
}) => {
  // Link Mechanism State
  const [protocol, setProtocol] = useState<'https://' | 'http://'>('https://');
  const [rawDomain, setRawDomain] = useState(initialDomain || '');
  const [port, setPort] = useState('');
  const [path, setPath] = useState('');
  const [queryParams, setQueryParams] = useState<QueryParam[]>([
    { id: '1', key: 'utm_source', value: 'qr' },
  ]);
  const [hash, setHash] = useState('');

  // QR Customization State
  const [qrSize, setQrSize] = useState<number>(400);
  const [cardPadding, setCardPadding] = useState<number>(16);
  const [darkColor, setDarkColor] = useState('#090d16');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [margin, setMargin] = useState<number>(2);

  // Output States
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isAddingWatchlist, setIsAddingWatchlist] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'style'>('link');

  useEffect(() => {
    if (initialDomain) {
      const parsed = parseDomainInput(initialDomain);
      setRawDomain(parsed.host);
      if (parsed.port && parsed.port !== 443 && parsed.port !== 80) {
        setPort(String(parsed.port));
      }
    }
  }, [initialDomain]);

  // Construct final URL
  const constructedUrl = useMemo(() => {
    let host = rawDomain.trim();
    if (!host) return '';

    // Strip existing protocol if typed by user
    if (host.startsWith('https://')) {
      host = host.slice(8);
    } else if (host.startsWith('http://')) {
      host = host.slice(7);
    }

    // Strip trailing slash from host
    if (host.endsWith('/')) {
      host = host.slice(0, -1);
    }

    const portPart = port.trim() && port.trim() !== '443' && port.trim() !== '80' ? `:${port.trim()}` : '';
    
    let pathPart = path.trim();
    if (pathPart && !pathPart.startsWith('/')) {
      pathPart = `/${pathPart}`;
    }

    // Build query params
    const validParams = queryParams.filter((p) => p.key.trim().length > 0);
    let queryPart = '';
    if (validParams.length > 0) {
      const searchParams = new URLSearchParams();
      validParams.forEach((p) => {
        searchParams.append(p.key.trim(), p.value.trim());
      });
      queryPart = `?${searchParams.toString()}`;
    }

    let hashPart = hash.trim();
    if (hashPart && !hashPart.startsWith('#')) {
      hashPart = `#${hashPart}`;
    }

    return `${protocol}${host}${portPart}${pathPart}${queryPart}${hashPart}`;
  }, [protocol, rawDomain, port, path, queryParams, hash]);

  // Generate QR Code data
  const renderQRCode = useCallback(async () => {
    if (!constructedUrl) {
      setQrPngUrl('');
      return;
    }

    try {
      const dataUrl = await QRCode.toDataURL(constructedUrl, {
        width: qrSize,
        margin,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });
      setQrPngUrl(dataUrl);
    } catch (err) {
      console.error('Failed generating QR code', err);
    }
  }, [constructedUrl, qrSize, margin, errorCorrection, darkColor, lightColor]);

  useEffect(() => {
    if (isOpen) {
      renderQRCode();
    }
  }, [isOpen, renderQRCode]);

  if (!isOpen) return null;

  // Add query param row
  const addQueryParam = () => {
    setQueryParams((prev) => [
      ...prev,
      { id: String(Date.now()), key: '', value: '' },
    ]);
  };

  // Remove query param row
  const removeQueryParam = (id: string) => {
    setQueryParams((prev) => prev.filter((p) => p.id !== id));
  };

  // Update query param
  const updateQueryParam = (id: string, field: 'key' | 'value', val: string) => {
    setQueryParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  // Download PNG with card padding
  const handleDownloadPNG = () => {
    if (!qrPngUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const pad = Math.round((cardPadding / 220) * qrSize);
      const canvas = document.createElement('canvas');
      canvas.width = qrSize + pad * 2;
      canvas.height = qrSize + pad * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = lightColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, pad, pad, qrSize, qrSize);
        const finalUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = finalUrl;
        const cleanName = (rawDomain || 'domain').replace(/[^a-zA-Z0-9]/g, '-');
        link.download = `qrcode-${cleanName}-${qrSize}px.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    img.src = qrPngUrl;
  };

  // Download SVG
  const handleDownloadSVG = async () => {
    if (!constructedUrl) return;
    try {
      const svgString = await QRCode.toString(constructedUrl, {
        type: 'svg',
        margin,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = (rawDomain || 'domain').replace(/[^a-zA-Z0-9]/g, '-');
      link.download = `qrcode-${cleanName}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed generating SVG', err);
    }
  };

  // Copy URL
  const handleCopyUrl = async () => {
    if (!constructedUrl) return;
    try {
      await navigator.clipboard.writeText(constructedUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed copying URL', err);
    }
  };

  // Copy Image to Clipboard with card padding
  const handleCopyImage = async () => {
    if (!qrPngUrl) return;
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
          ctx.fillStyle = lightColor;
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
      img.src = qrPngUrl;
    } catch (err) {
      console.error('Failed copying QR image', err);
    }
  };

  // Add domain to monitoring watchlist
  const handleAddToWatchlist = async () => {
    if (!onAddToWatchlist || !rawDomain.trim()) return;
    setIsAddingWatchlist(true);
    try {
      const parsedPort = port ? parseInt(port, 10) : 443;
      const success = await onAddToWatchlist(rawDomain.trim(), parsedPort);
      if (success) {
        setAddedSuccess(true);
      }
    } finally {
      setIsAddingWatchlist(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '95%' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <QrCode size={20} style={{ color: 'var(--cyan-400)' }} />
            <span>Studio Generator QR Code Domain &amp; Link</span>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div
          className="modal-body"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Link Builder & Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'link' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('link')}
              >
                <LinkIcon size={14} />
                <span>Mekanisme Link &amp; Domain</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'style' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('style')}
              >
                <Palette size={14} />
                <span>Kustomisasi Gaya &amp; Warna</span>
              </button>
            </div>

            {activeTab === 'link' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Protocol + Domain Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    1. Protokol &amp; Nama Domain <span style={{ color: 'var(--status-critical-text)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      className="sort-select"
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value as any)}
                      style={{ padding: '0.7rem 0.5rem', fontSize: '0.875rem' }}
                    >
                      <option value="https://">https://</option>
                      <option value="http://">http://</option>
                    </select>

                    <div style={{ position: 'relative', flex: 1 }}>
                      <Globe
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '0.875rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-dim)',
                        }}
                      />
                      <input
                        type="text"
                        className="input-text"
                        placeholder="domain.com atau sub.domain.id"
                        value={rawDomain}
                        onChange={(e) => setRawDomain(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <input
                      type="number"
                      className="input-text"
                      placeholder="Port"
                      style={{ width: '80px', paddingLeft: '0.75rem' }}
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                    />
                  </div>
                </div>

                {/* Path / Halaman Spesifik */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    2. Path / Rute Halaman (Opsional)
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="/login, /promo/event-2026, /produk/detail"
                    style={{ paddingLeft: '1rem' }}
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                  />
                </div>

                {/* Query Parameters Builder */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      3. Query Parameter Builder (?key=val)
                    </label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      onClick={addQueryParam}
                    >
                      <Plus size={12} /> Tambah Parameter
                    </button>
                  </div>

                  {queryParams.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                      Tidak ada query parameter. Klik &quot;Tambah Parameter&quot; untuk menambahkan tracking UTM atau token.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {queryParams.map((param) => (
                        <div key={param.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="input-text"
                            placeholder="Key (misal: utm_source)"
                            style={{ paddingLeft: '0.75rem', fontSize: '0.8125rem' }}
                            value={param.key}
                            onChange={(e) => updateQueryParam(param.id, 'key', e.target.value)}
                          />
                          <span style={{ color: 'var(--text-dim)' }}>=</span>
                          <input
                            type="text"
                            className="input-text"
                            placeholder="Nilai (misal: qr-banner)"
                            style={{ paddingLeft: '0.75rem', fontSize: '0.8125rem' }}
                            value={param.value}
                            onChange={(e) => updateQueryParam(param.id, 'value', e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-icon btn-sm"
                            onClick={() => removeQueryParam(param.id)}
                            title="Hapus parameter"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hash / Anchor */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    4. Hash / Bagian Anchor (Opsional)
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="#section-kontak, #daftar"
                    style={{ paddingLeft: '1rem' }}
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              /* Style & Customization Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Preset Tema Warna QR
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        className={`btn btn-sm ${darkColor === preset.dark ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={() => {
                          setDarkColor(preset.dark);
                          setLightColor(preset.light);
                        }}
                      >
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: preset.dark,
                            border: '1px solid #ffffff',
                          }}
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Warna QR Code (Gelap)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={darkColor}
                        onChange={(e) => setDarkColor(e.target.value)}
                        style={{ width: '40px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        className="input-text"
                        value={darkColor}
                        onChange={(e) => setDarkColor(e.target.value)}
                        style={{ paddingLeft: '0.75rem', fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Warna Background (Terang)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={lightColor}
                        onChange={(e) => setLightColor(e.target.value)}
                        style={{ width: '40px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        className="input-text"
                        value={lightColor}
                        onChange={(e) => setLightColor(e.target.value)}
                        style={{ paddingLeft: '0.75rem', fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Error Correction Level
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        className={`btn btn-sm ${errorCorrection === lvl ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, fontSize: '0.75rem' }}
                        onClick={() => setErrorCorrection(lvl)}
                      >
                        {lvl} ({lvl === 'L' ? '7%' : lvl === 'M' ? '15%' : lvl === 'Q' ? '25%' : '30%'})
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                    Tingkat &quot;H&quot; (30%) paling tahan gores / rusak dan sangat stabil dibaca kamera.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Margin / Border Padding
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 4].map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`btn btn-sm ${margin === m ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, fontSize: '0.75rem' }}
                        onClick={() => setMargin(m)}
                      >
                        {m} Modul {m === 2 ? '(Standar)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live URL Preview Box */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--cyan-400)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Live Link Target:
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}
                  onClick={handleCopyUrl}
                  disabled={!constructedUrl}
                >
                  {copiedUrl ? <Check size={12} style={{ color: 'var(--status-valid-text)' }} /> : <Copy size={12} />}
                  <span>{copiedUrl ? 'Tersalin' : 'Salin URL'}</span>
                </button>
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  color: constructedUrl ? '#ffffff' : 'var(--text-dim)',
                  wordBreak: 'break-all',
                }}
              >
                {constructedUrl || 'Masukkan nama domain di atas untuk merakit link...'}
              </div>
            </div>
          </div>

          {/* Right Column: QR Code Preview & Action Suite */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              background: 'rgba(10, 15, 29, 0.4)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* The QR Code Card */}
            <div
              style={{
                background: lightColor,
                padding: `${cardPadding}px`,
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              {qrPngUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrPngUrl}
                  alt={`QR Code untuk ${rawDomain || 'domain'}`}
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
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    fontSize: '0.8125rem',
                    textAlign: 'center',
                    padding: '1rem',
                  }}
                >
                  <QrCode size={36} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                  <span>Ketik domain untuk melihat preview QR</span>
                </div>
              )}
            </div>

            {/* Padding Card Control */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Padding Card Bingkai:</span>
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
                {[0, 8, 16, 24, 36].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${cardPadding === p ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.6875rem', flex: 1 }}
                    onClick={() => setCardPadding(p)}
                  >
                    {p === 0 ? '0px' : `${p}px`}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Selector */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Resolusi Ekspor:</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[300, 600, 1000].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`btn btn-sm ${qrSize === sz ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                    onClick={() => setQrSize(sz)}
                  >
                    {sz}px {sz === 1000 ? '(HD)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions Button Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '100%' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleDownloadPNG}
                disabled={!qrPngUrl}
              >
                <Download size={14} />
                <span>Unduh PNG</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadSVG}
                disabled={!constructedUrl}
                title="Unduh format vektor SVG (skalabilitas tinggi)"
              >
                <Download size={14} />
                <span>Unduh SVG</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyImage}
                disabled={!qrPngUrl}
              >
                {copiedImage ? <Check size={14} style={{ color: 'var(--status-valid-text)' }} /> : <Sparkles size={14} />}
                <span>{copiedImage ? 'Tersalin' : 'Salin Gambar'}</span>
              </button>

              {constructedUrl ? (
                <a
                  href={constructedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <ExternalLink size={14} />
                  <span>Kunjungi</span>
                </a>
              ) : (
                <button type="button" className="btn btn-secondary btn-sm" disabled>
                  <ExternalLink size={14} />
                  <span>Kunjungi</span>
                </button>
              )}
            </div>

            {/* Watchlist Integration */}
            {onAddToWatchlist && rawDomain.trim() && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                onClick={handleAddToWatchlist}
                disabled={isAddingWatchlist || addedSuccess}
              >
                {addedSuccess ? (
                  <>
                    <Check size={14} style={{ color: 'var(--status-valid-text)' }} />
                    <span>Domain Sudah Dalam Pemantauan</span>
                  </>
                ) : isAddingWatchlist ? (
                  <span>Menyimpan ke Pemantauan...</span>
                ) : (
                  <>
                    <BookmarkPlus size={14} style={{ color: 'var(--cyan-400)' }} />
                    <span>+ Simpan Domain ke Monitor SSL</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
