'use client';

import React, { useState } from 'react';
import { X, Plus, Globe, Tag, Loader2, AlertCircle } from 'lucide-react';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDomain: (domain: string, port?: number, alias?: string) => Promise<boolean>;
}

export const AddDomainModal: React.FC<AddDomainModalProps> = ({
  isOpen,
  onClose,
  onAddDomain,
}) => {
  const [domain, setDomain] = useState('');
  const [port, setPort] = useState('443');
  const [alias, setAlias] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const parsedPort = parseInt(port, 10) || 443;
      const success = await onAddDomain(domain.trim(), parsedPort, alias.trim() || undefined);
      if (success) {
        setDomain('');
        setPort('443');
        setAlias('');
        onClose();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menambahkan domain');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={18} style={{ color: 'var(--cyan-400)' }} />
            <span>Tambah Domain Pemantauan</span>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                Nama Domain / Host <span style={{ color: 'var(--status-critical-text)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
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
                  placeholder="Contoh: portal.instansi.go.id"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                Port (Opsional, Default: 443)
              </label>
              <input
                type="number"
                className="input-text"
                style={{ paddingLeft: '1rem' }}
                placeholder="443"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                disabled={isLoading}
                min={1}
                max={65535}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                Nama Alias / Label Keterangan (Opsional)
              </label>
              <div style={{ position: 'relative' }}>
                <Tag
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
                  placeholder="Contoh: Server Production / Website Utama"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isLoading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading || !domain.trim()}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="spin-slow" />
                  <span>Memeriksa &amp; Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Simpan Domain</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
