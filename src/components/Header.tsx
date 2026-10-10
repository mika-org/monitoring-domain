'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, RefreshCw, Plus, Layers, Download, QrCode, LogOut, User } from 'lucide-react';

interface HeaderProps {
  onRefreshAll: () => void;
  onOpenAddModal: () => void;
  onOpenBatchModal: () => void;
  onOpenQRStudio: () => void;
  onExport: () => void;
  isRefreshingAll: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onRefreshAll,
  onOpenAddModal,
  onOpenBatchModal,
  onOpenQRStudio,
  onExport,
  isRefreshingAll,
}) => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ username: string; name?: string } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar?')) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="header-glass">
      <div className="container header-container">
        <div className="brand-logo">
          <div className="brand-icon-wrapper">
            <ShieldCheck size={22} strokeWidth={2.2} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">CertPulse</span>
              <span className="brand-badge">Realtime</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>
              Monitoring Masa Aktif SSL Domain
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefreshAll}
            disabled={isRefreshingAll}
            title="Periksa ulang masa aktif seluruh domain sekarang"
          >
            <RefreshCw size={15} className={isRefreshingAll ? 'spin-slow' : ''} />
            <span>{isRefreshingAll ? 'Memeriksa...' : 'Periksa Ulang'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenQRStudio}
            title="Buka Studio Generator QR Code Domain & Link"
            style={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}
          >
            <QrCode size={15} style={{ color: 'var(--cyan-400)' }} />
            <span>QR Studio</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenBatchModal}
            title="Tambah banyak domain sekaligus"
          >
            <Layers size={15} />
            <span>Batch Add</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onExport}
            title="Export daftar domain ke format CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenAddModal}
            title="Tambah domain baru ke daftar pemantauan"
          >
            <Plus size={16} />
            <span>Tambah Domain</span>
          </button>

          {/* User Profile & Logout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginLeft: '0.25rem',
              paddingLeft: '0.5rem',
              borderLeft: '1px solid var(--border-subtle)',
            }}
          >
            {currentUser && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
                title={`Login sebagai ${currentUser.username}`}
              >
                <User size={13} style={{ color: 'var(--cyan-400)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.username}
                </span>
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Keluar dari akun"
              style={{
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.25)',
                padding: '0.45rem 0.6rem',
              }}
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
