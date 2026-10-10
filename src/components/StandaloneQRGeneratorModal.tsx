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
  { label: 'Neon Cyber', dark: '#06b6d4', light: '#ffffff' },
];

export const StandaloneQRGeneratorModal: React.FC<StandaloneQRGeneratorModalProps> = ({
  isOpen,
  onClose,
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
  const [darkColor, setDarkColor] = useState('#0f172a');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [margin, setMargin] = useState<number>(2);

  // Output States
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'style'>('link');

  useEffect(() => {
    if (initialDomain) {
      const parsed = parseDomainInput(initialDomain);
      if (parsed.host) {
        setRawDomain(parsed.host);
        if (parsed.port && parsed.port !== 443 && parsed.port !== 80) {
          setPort(parsed.port.toString());
        }
      }
    }
  }, [initialDomain]);

  // Construct target URL
  const constructedUrl = useMemo(() => {
    const cleanedDomain = rawDomain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (!cleanedDomain) return '';

    let url = `${protocol}${cleanedDomain}`;

    if (port.trim()) {
      const parsedPort = parseInt(port.trim(), 10);
      if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort !== 443 && parsedPort !== 80) {
        url += `:${parsedPort}`;
      }
    }

    if (path.trim()) {
      let cleanPath = path.trim();
      if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;
      url += cleanPath;
    }

    const validParams = queryParams.filter((p) => p.key.trim() && p.value.trim());
    if (validParams.length > 0) {
      const searchParams = new URLSearchParams();
      validParams.forEach((p) => searchParams.append(p.key.trim(), p.value.trim()));
      url += `?${searchParams.toString()}`;
    }

    if (hash.trim()) {
      let cleanHash = hash.trim();
      if (!cleanHash.startsWith('#')) cleanHash = `#${cleanHash}`;
      url += cleanHash;
    }

    return url;
  }, [protocol, rawDomain, port, path, queryParams, hash]);

  // Generate QR Code PNG
  const generateQRCode = useCallback(async () => {
    if (!constructedUrl) {
      setQrPngUrl('');
      return;
    }

    try {
      const dataUrl = await QRCode.toDataURL(constructedUrl, {
        width: qrSize,
        margin: margin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: 'H',
      });
      setQrPngUrl(dataUrl);
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  }, [constructedUrl, qrSize, margin, darkColor, lightColor]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const addQueryParam = () => {
    setQueryParams((prev) => [
      ...prev,
      { id: Date.now().toString(), key: '', value: '' },
    ]);
  };

  const removeQueryParam = (id: string) => {
    setQueryParams((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQueryParam = (id: string, field: 'key' | 'value', val: string) => {
    setQueryParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleCopyUrl = async () => {
    if (!constructedUrl) return;
    try {
      await navigator.clipboard.writeText(constructedUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadPNG = () => {
    if (!qrPngUrl) return;
    const cleanName = (rawDomain || 'link').replace(/[^a-zA-Z0-9]/g, '_');
    const a = document.createElement('a');
    a.href = qrPngUrl;
    a.download = `qrcode_${cleanName}_${qrSize}px.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSVG = async () => {
    if (!constructedUrl) return;
    try {
      const svgString = await QRCode.toString(constructedUrl, {
        type: 'svg',
        width: qrSize,
        margin: margin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: 'H',
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const cleanName = (rawDomain || 'link').replace(/[^a-zA-Z0-9]/g, '_');
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode_${cleanName}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting SVG:', err);
    }
  };

  const handleCopyImage = async () => {
    if (!qrPngUrl) return;
    try {
      const res = await fetch(qrPngUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: '890px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={20} />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Studio Generator QR Code Domain &amp; Link
            </h2>
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

        {/* Modal Body */}
        <div
          style={{
            padding: '1.75rem',
            display: 'grid',
            gridTemplateColumns: '1.15fr 1fr',
            gap: '1.75rem',
            maxHeight: '76vh',
            overflowY: 'auto',
          }}
        >
          {/* Left Column: Form & Link Builder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'link' ? '#2563eb' : '#f1f5f9',
                  color: activeTab === 'link' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                <LinkIcon size={14} />
                <span>Mekanisme Link &amp; Domain</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === 'style' ? '#2563eb' : '#f1f5f9',
                  color: activeTab === 'style' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                <Palette size={14} />
                <span>Kustomisasi Gaya &amp; Warna</span>
              </button>
            </div>

            {activeTab === 'link' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* 1. Protokol & Nama Domain */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.4rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    1. PROTOKOL &amp; NAMA DOMAIN <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value as 'https://' | 'http://')}
                      style={{
                        padding: '0.6rem 0.6rem',
                        fontSize: '0.84375rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    >
                      <option value="https://">https://</option>
                      <option value="http://">http://</option>
                    </select>

                    <div style={{ position: 'relative', flex: 1 }}>
                      <Globe
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '0.85rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94a3b8',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="domain.com atau sub.domain"
                        value={rawDomain}
                        onChange={(e) => setRawDomain(e.target.value)}
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 0.75rem 0 2.45rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          background: '#ffffff',
                          color: '#0f172a',
                          fontSize: '0.84375rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <input
                      type="number"
                      placeholder="Port"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      style={{
                        width: '85px',
                        height: '40px',
                        padding: '0 0.6rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.84375rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* 2. Path */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.4rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    2. PATH / RUTE HALAMAN (OPSIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="/login, /promo/event-2026, /produk/detail"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.84375rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 3. Query Parameter Builder */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      3. QUERY PARAMETER BUILDER (?KEY=VAL)
                    </label>
                    <button
                      type="button"
                      onClick={addQueryParam}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.78125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Plus size={14} /> Tambah Parameter
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {queryParams.map((param) => (
                      <div key={param.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Key"
                          value={param.key}
                          onChange={(e) => updateQueryParam(param.id, 'key', e.target.value)}
                          style={{
                            flex: 1,
                            height: '36px',
                            padding: '0 0.75rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '0.8125rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>=</span>
                        <input
                          type="text"
                          placeholder="Value"
                          value={param.value}
                          onChange={(e) => updateQueryParam(param.id, 'value', e.target.value)}
                          style={{
                            flex: 1,
                            height: '36px',
                            padding: '0 0.75rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '0.8125rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeQueryParam(param.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0.35rem',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Hash / Anchor */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.4rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    4. HASH / BAGIAN ANCHOR (OPSIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="#section-kontak, #daftar"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.84375rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Tab Style */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Tema Warna Cepat
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setDarkColor(p.dark);
                          setLightColor(p.light);
                        }}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '8px',
                          border: darkColor === p.dark ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: p.dark }} />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Warna Kode QR
                    </label>
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Warna Background Card
                    </label>
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Live Link Target Box (Clean modern light box) */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  LIVE LINK TARGET:
                </span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  disabled={!constructedUrl}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  {copiedUrl ? <Check size={12} style={{ color: '#16a34a' }} /> : <Copy size={12} />}
                  <span>{copiedUrl ? 'Tersalin' : 'Salin URL'}</span>
                </button>
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  color: constructedUrl ? '#0f172a' : '#94a3b8',
                  wordBreak: 'break-all',
                }}
              >
                {constructedUrl || 'Masukkan nama domain di atas untuk merakit link...'}
              </div>
            </div>
          </div>

          {/* Right Column: QR Code Preview (Slate Card matching Gambar 2) */}
          <div
            style={{
              background: '#64748b',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* The QR Code Card */}
            <div
              style={{
                background: lightColor,
                padding: `${cardPadding}px`,
                borderRadius: '14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '220px',
                minHeight: '220px',
              }}
            >
              {qrPngUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrPngUrl}
                  alt={`QR Code untuk ${rawDomain || 'domain'}`}
                  width={210}
                  height={210}
                  style={{ display: 'block', borderRadius: '4px', userSelect: 'none' }}
                />
              ) : (
                <div
                  style={{
                    width: '210px',
                    height: '210px',
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
                  <QrCode size={40} style={{ marginBottom: '0.5rem', opacity: 0.35 }} />
                  <span>Ketik domain untuk melihat preview QR</span>
                </div>
              )}
            </div>

            {/* Padding Card Control */}
            <div style={{ width: '100%', color: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                <span style={{ color: '#cbd5e1' }}>Padding Card Bingkai:</span>
                <span>{cardPadding}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                step={4}
                value={cardPadding}
                onChange={(e) => setCardPadding(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer', marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[0, 8, 16, 24, 36].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCardPadding(p)}
                    style={{
                      flex: 1,
                      padding: '0.25rem 0',
                      borderRadius: '999px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: cardPadding === p ? '#2563eb' : '#ffffff',
                      color: cardPadding === p ? '#ffffff' : '#334155',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {p}px
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Selector */}
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.4rem' }}>
                <span>Resolusi Ekspor:</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[300, 600, 1000].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setQrSize(sz)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: 'none',
                        background: qrSize === sz ? '#2563eb' : '#ffffff',
                        color: qrSize === sz ? '#ffffff' : '#334155',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                    >
                      {sz}px {sz === 1000 ? '(HD)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions Button Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '100%' }}>
              <button
                type="button"
                onClick={handleDownloadPNG}
                disabled={!qrPngUrl}
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: qrPngUrl ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
                }}
              >
                <Download size={14} />
                <span>Unduh PNG</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSVG}
                disabled={!constructedUrl}
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#334155',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: constructedUrl ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Download size={14} />
                <span>Unduh SVG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                disabled={!qrPngUrl}
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#334155',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: qrPngUrl ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                }}
              >
                {copiedImage ? <Check size={14} style={{ color: '#16a34a' }} /> : <Sparkles size={14} />}
                <span>{copiedImage ? 'Tersalin' : 'Salin Gambar'}</span>
              </button>

              {constructedUrl ? (
                <a
                  href={constructedUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Kunjungi</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#94a3b8',
                    border: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Kunjungi</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              fontSize: '0.84375rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
