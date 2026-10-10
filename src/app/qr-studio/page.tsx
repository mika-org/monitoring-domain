'use client';

import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Sliders,
  Sparkles,
  Palette,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

const COLOR_PRESETS = [
  { label: 'Cyber Dark', dark: '#0f172a', light: '#ffffff' },
  { label: 'Deep Indigo', dark: '#1e1b4b', light: '#ffffff' },
  { label: 'Ocean Blue', dark: '#0284c7', light: '#f0f9ff' },
  { label: 'Emerald Green', dark: '#059669', light: '#ecfdf5' },
  { label: 'Royal Purple', dark: '#7c3aed', light: '#faf5ff' },
];

export default function QRStudioPage() {
  const [protocol, setProtocol] = useState<'https://' | 'http://'>('https://');
  const [domain, setDomain] = useState('example.com');
  const [port, setPort] = useState('');
  const [path, setPath] = useState('');
  const [qrSize, setQrSize] = useState<number>(400);
  const [darkColor, setDarkColor] = useState('#0f172a');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const fullUrl = useMemo(() => {
    let clean = domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (!clean) return '';
    let res = `${protocol}${clean}`;
    if (port.trim() && port !== '443' && port !== '80') {
      res += `:${port.trim()}`;
    }
    if (path.trim()) {
      let p = path.trim();
      if (!p.startsWith('/')) p = `/${p}`;
      res += p;
    }
    return res;
  }, [protocol, domain, port, path]);

  useEffect(() => {
    if (!fullUrl) {
      setQrPngUrl('');
      return;
    }

    QRCode.toDataURL(fullUrl, {
      width: qrSize,
      margin: 2,
      color: { dark: darkColor, light: lightColor },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrPngUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [fullUrl, qrSize, darkColor, lightColor]);

  const handleCopyUrl = async () => {
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!qrPngUrl) return;
    const link = document.createElement('a');
    link.href = qrPngUrl;
    link.download = `viorecert-qr-${domain.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <header style={{ flexShrink: 0 }}>
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
              <QrCode size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Studio Generator QR Code Domain
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Buat dan kustomisasi kode QR berkualitas tinggi untuk domain pemantauan SSL Anda
              </p>
            </div>
          </div>
        </header>

        {/* 2-Column Studio Workspace */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '1.25rem',
            overflow: 'hidden',
          }}
        >
          {/* Left Column: Form Controls */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              overflowY: 'auto',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Domain URL Builder */}
            <div>
              <label style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Pengaturan URL Domain
              </label>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as any)}
                  style={{
                    height: '38px',
                    padding: '0 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                >
                  <option value="https://">https://</option>
                  <option value="http://">http://</option>
                </select>

                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="domain-anda.com"
                  style={{
                    flex: 1,
                    height: '38px',
                    padding: '0 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84375rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />

                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="Port (443)"
                  style={{
                    width: '90px',
                    height: '38px',
                    padding: '0 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="Path tambahan (misal: /api/status)"
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Pilihan Palet Warna
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = darkColor === preset.dark;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setDarkColor(preset.dark);
                        setLightColor(preset.light);
                      }}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: preset.dark, border: '1px solid #e2e8f0' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 700 : 500, color: '#334155' }}>
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resolution Selector */}
            <div>
              <label style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                Resolusi QR Code (Ukuran Export)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[300, 400, 600, 800].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setQrSize(size)}
                    style={{
                      flex: 1,
                      height: '36px',
                      borderRadius: '8px',
                      border: qrSize === size ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: qrSize === size ? '#eff6ff' : '#ffffff',
                      color: qrSize === size ? '#2563eb' : '#334155',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {size} x {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Result URL box */}
            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: 'auto' }}>
              <div style={{ fontSize: '0.71875rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>
                URL TARGET QR CODE
              </div>
              <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>
                {fullUrl || '-'}
              </div>
            </div>
          </div>

          {/* Right Column: Live QR Preview & Actions */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                padding: '1rem',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {qrPngUrl ? (
                <img
                  src={qrPngUrl}
                  alt="QR Code Preview"
                  style={{ width: '240px', height: '240px', display: 'block', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  Membuat QR Code...
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', width: '100%', maxWidth: '320px' }}>
              <button
                type="button"
                onClick={handleCopyUrl}
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                }}
              >
                {copiedUrl ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
                <span>{copiedUrl ? 'Tersalin!' : 'Salin URL'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={!qrPngUrl}
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  cursor: !qrPngUrl ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Download size={15} />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
