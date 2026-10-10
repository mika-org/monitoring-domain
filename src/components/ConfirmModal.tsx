'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info, HelpCircle, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  type = 'info',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  let icon = <Info size={24} style={{ color: '#2563eb' }} />;
  let iconBg = '#eff6ff';
  let confirmBg = '#2563eb';
  let confirmHoverBg = '#1d4ed8';

  if (type === 'danger') {
    icon = <AlertCircle size={24} style={{ color: '#dc2626' }} />;
    iconBg = '#fef2f2';
    confirmBg = '#dc2626';
    confirmHoverBg = '#b91c1c';
  } else if (type === 'warning') {
    icon = <AlertTriangle size={24} style={{ color: '#d97706' }} />;
    iconBg = '#fefce8';
    confirmBg = '#d97706';
    confirmHoverBg = '#b45309';
  } else if (type === 'success') {
    icon = <CheckCircle2 size={24} style={{ color: '#16a34a' }} />;
    iconBg = '#f0fdf4';
    confirmBg = '#16a34a';
    confirmHoverBg = '#15803d';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
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
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'modalIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
              {title}
            </h3>
            <p style={{ fontSize: '0.84375rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.2rem',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: '0.85rem 1.5rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.65rem',
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
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              background: confirmBg,
              border: 'none',
              color: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
