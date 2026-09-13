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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Layers size={18} style={{ color: 'var(--cyan-400)' }} />
            <span>Tambah Banyak Domain (Batch Import)</span>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Masukkan satu domain per baris. Protokol (https://) dan port khusus (misal :8443) akan dideteksi secara otomatis.
            </p>

            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-critical-bg)',
                  border: '1px solid var(--status-critical-border)',
                  color: 'var(--status-critical-text)',
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
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-valid-bg)',
                  border: '1px solid var(--status-valid-border)',
                  color: 'var(--status-valid-text)',
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

            <div>
              <textarea
                className="textarea-input"
                placeholder="google.com&#10;github.com&#10;mysite.id:8443&#10;https://api.example.com"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
                rows={7}
              />
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                {lines.length} domain terdeteksi
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isLoading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading || lines.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="spin-slow" />
                  <span>Memproses {lines.length} Domain...</span>
                </>
              ) : (
                <>
                  <Layers size={14} />
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
