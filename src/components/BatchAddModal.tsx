'use client';

import React, { useState } from 'react';
import { X, Layers, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BatchAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchAdd: (domains: string[]) => Promise<{ addedCount: number; skippedCount: number }>;
}

export const BatchAddModal: React.FC<BatchAddModalProps> = ({
  isOpen,
  onClose,
  onBatchAdd,
}) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<{ added: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return;

    setIsLoading(true);
    setErrorMsg(null);
    setResultMsg(null);

    try {
      const res = await onBatchAdd(lines);
      setResultMsg({ added: res.addedCount, skipped: res.skippedCount });
      setTimeout(() => {
        setText('');
        setResultMsg(null);
        onClose();
      }, 1600);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memproses daftar batch');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.55)',
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
          maxWidth: '560px',
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
            padding: '1.25rem 1.5rem',
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
              <Layers size={20} />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Tambah Banyak Domain (Batch Import)
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

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.84375rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Masukkan satu domain per baris. Protokol (<code style={{ color: '#2563eb', background: '#eff6ff', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>https://</code>) dan port khusus (misal <code style={{ color: '#2563eb', background: '#eff6ff', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>:8443</code>) akan dideteksi secara otomatis.
            </p>

            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {resultMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={16} />
                <span>
                  Berhasil menambahkan {resultMsg.added} domain ({resultMsg.skipped} duplikat dilewati).
                </span>
              </div>
            )}

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  Daftar Domain (1 baris per domain)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setText('google.com\ngithub.com\ncloudflare.com:443\nhttps://api.telegram.org')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                    }}
                  >
                    + Isi Contoh
                  </button>
                  {text && (
                    <button
                      type="button"
                      onClick={() => setText('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: '0.15rem 0.4rem',
                      }}
                    >
                      Bersihkan
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
                placeholder="google.com&#10;github.com&#10;mysite.id:8443&#10;https://api.example.com"
                rows={6}
                style={{
                  width: '100%',
                  minWidth: '100%',
                  maxWidth: '100%',
                  height: '170px',
                  minHeight: '150px',
                  display: 'block',
                  boxSizing: 'border-box',
                  padding: '0.875rem 1rem',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.background = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Format: domain.com atau domain.com:port
                </span>
                <span
                  style={{
                    fontSize: '0.78125rem',
                    fontWeight: 700,
                    color: lines.length > 0 ? '#2563eb' : '#64748b',
                    background: lines.length > 0 ? '#eff6ff' : '#f1f5f9',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                  }}
                >
                  {lines.length} domain terdeteksi
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.84375rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || lines.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                background: lines.length === 0 ? '#93c5fd' : '#2563eb',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.84375rem',
                fontWeight: 600,
                cursor: lines.length === 0 || isLoading ? 'not-allowed' : 'pointer',
                boxShadow: lines.length > 0 ? '0 2px 4px rgba(37, 99, 235, 0.25)' : 'none',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="spin-slow" />
                  <span>Memproses {lines.length} Domain...</span>
                </>
              ) : (
                <>
                  <Layers size={15} />
                  <span>Import {lines.length} Domain</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
