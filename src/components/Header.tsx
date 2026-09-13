'use client';

import React from 'react';
import { ShieldCheck, RefreshCw, Plus, Layers, Download, QrCode } from 'lucide-react';

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
        </div>
      </div>
    </header>
  );
};
