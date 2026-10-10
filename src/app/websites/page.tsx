'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Activity,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ConfirmModal } from '@/components/ConfirmModal';

interface WebsiteItem {
  id: string;
  url: string;
  name: string;
  status: 'UP' | 'DOWN' | 'WARNING' | 'UNKNOWN';
  statusCode?: number | null;
  responseTime?: number | null;
  lastCheckedAt?: string | null;
  checks?: any[];
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState<WebsiteItem | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const fetchWebsites = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/websites');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setWebsites(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  const handleCreateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, name: newName }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewUrl('');
        setNewName('');
        fetchWebsites();
      } else {
        alert(data.error || 'Gagal menambahkan website');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!websiteToDelete) return;
    try {
      await fetch(`/api/websites?id=${websiteToDelete.id}`, { method: 'DELETE' });
      setWebsites((prev) => prev.filter((w) => w.id !== websiteToDelete.id));
    } catch (e) {
      console.error(e);
    } finally {
      setWebsiteToDelete(null);
    }
  };

  const filtered = websites.filter((w) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return w.name.toLowerCase().includes(q) || w.url.toLowerCase().includes(q);
  });

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
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
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
              <Globe size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Website &amp; Endpoint Monitoring
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Pantau ketersediaan (uptime), HTTP status code, dan latency response time website production
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari URL website..."
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 0.75rem 0 2.2rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '0.8125rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="button"
              onClick={fetchWebsites}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} style={{ color: '#2563eb' }} />
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              style={{
                height: '36px',
                padding: '0 1rem',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} />
              <span>Tambah Website</span>
            </button>
          </div>
        </header>

        {/* Websites Table */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10, borderBottom: '1px solid #e2e8f0' }}>
                <tr style={{ color: '#64748b', fontSize: '0.78125rem' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Nama &amp; URL Target</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>HTTP Code</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Response Time</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Pengecekan Terakhir</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((item) => {
                    const isUp = item.status === 'UP';
                    const isWarning = item.status === 'WARNING';

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '0.75rem',
                              color: '#2563eb',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              marginTop: '0.15rem',
                            }}
                          >
                            <span>{item.url}</span>
                            <ExternalLink size={11} />
                          </a>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              fontSize: '0.71875rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              background: isUp ? '#dcfce7' : isWarning ? '#fef3c7' : '#fee2e2',
                              color: isUp ? '#15803d' : isWarning ? '#b45309' : '#b91c1c',
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                          {item.statusCode || '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {item.responseTime !== undefined && item.responseTime !== null ? (
                            <span style={{ fontWeight: 700, color: item.responseTime > 1000 ? '#dc2626' : '#16a34a' }}>
                              {item.responseTime} ms
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.78125rem' }}>
                          {item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleTimeString('id-ID') : '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => setWebsiteToDelete(item)}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              border: '1px solid #fee2e2',
                              color: '#dc2626',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      {isLoading ? 'Memuat website...' : 'Belum ada website yang dimonitor.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Website Modal */}
      {isAddModalOpen && (
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
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Tambah Website Monitoring</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWebsite} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  URL Target *
                </label>
                <input
                  type="text"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://photobooth.elevore.web.id"
                  style={{ width: '100%', height: '36px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Nama Label (Opsional)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Photobooth Elevore"
                  style={{ width: '100%', height: '36px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.8125rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}
                >
                  {isSubmitting ? 'Memeriksa...' : 'Tambah & Periksa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!websiteToDelete}
        title="Hapus Website Monitoring"
        message={`Hapus website "${websiteToDelete?.name}" dari pemantauan uptime?`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setWebsiteToDelete(null)}
      />
    </div>
  );
}
