'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Users,
  Bell,
  Database,
  Shield,
  CheckCircle2,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function SettingsPage() {
  const [telegramStatus, setTelegramStatus] = useState<string>('Terkonfigurasi via Environment Variables');
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestMsg, setTelegramTestMsg] = useState<string | null>(null);

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramTestMsg(null);
    try {
      const res = await fetch('/api/alerts/test-telegram', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setTelegramTestMsg('Notifikasi uji coba Telegram berhasil terkirim!');
      } else {
        setTelegramTestMsg(data.error || 'Pastikan TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID terisi di .env');
      }
    } catch {
      setTelegramTestMsg('Gagal mengirim uji coba notifikasi');
    } finally {
      setIsTestingTelegram(false);
    }
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
              <Settings size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Pengaturan Sistem &amp; Notifikasi
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Konfigurasi notifikasi Telegram, manajemen akun pengguna, dan kebijakan retensi database
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Card 1: Telegram Bot Alert Channel */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Bell size={20} style={{ color: '#0284c7' }} />
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Notifikasi Peringatan Telegram</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Kirim alert real-time saat CPU &gt; 80%, RAM &gt; 85%, server offline, atau website down
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={isTestingTelegram}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: isTestingTelegram ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Send size={14} />
                <span>{isTestingTelegram ? 'Mengirim...' : 'Kirim Uji Coba Alert'}</span>
              </button>
            </div>

            {telegramTestMsg && (
              <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.8125rem' }}>
                {telegramTestMsg}
              </div>
            )}
          </div>

          {/* Card 2: User Management Shortcut */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Users size={20} style={{ color: '#16a34a' }} />
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Manajemen Akun Administrator</h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Kelola akun dengan role Super Admin, Admin, dan Viewer
                </div>
              </div>
            </div>

            <Link
              href="/users"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>Buka Kelola User</span>
              <ExternalLink size={14} />
            </Link>
          </div>

          {/* Card 3: Database Retention Policy */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <Database size={20} style={{ color: '#7c3aed' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Kebijakan Retensi Metrik (PostgreSQL)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Resolusi Tinggi (Per Menit)</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>7 Hari</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Resolusi Menengah (Per Jam)</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>30 Hari</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Agregat Harian</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>12 Bulan</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
