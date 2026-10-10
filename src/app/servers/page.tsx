'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Server,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  Cpu,
  Layers,
  Clock,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ConfirmModal } from '@/components/ConfirmModal';

interface ServerItem {
  id: string;
  name: string;
  hostname?: string | null;
  ipAddress: string;
  os?: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  uptime: number;
  lastHeartbeat?: string | null;
  agentStatus: string;
  pm2Count: number;
  pm2OnlineCount: number;
  nginxStatus: string;
  activeAlertsCount: number;
  latestMetric?: {
    cpuUsage: number;
    ramUsagePercent: number;
    ramUsed: number;
    ramTotal: number;
    networkIn?: number;
    networkOut?: number;
  } | null;
}

export default function ServersPage() {
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Server Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newHostname, setNewHostname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ server: any; token: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Delete Confirm Modal
  const [serverToDelete, setServerToDelete] = useState<ServerItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchServers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/servers');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setServers(json.data);
      }
    } catch {
      showToast('Gagal memuat daftar server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [fetchServers]);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, ipAddress: newIp, hostname: newHostname }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedResult({ server: data.data, token: data.agentToken });
        fetchServers();
        showToast('Server berhasil ditambahkan. Silakan pasang agent.');
      } else {
        throw new Error(data.error || 'Gagal menambahkan server');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!serverToDelete) return;
    try {
      const res = await fetch(`/api/servers/${serverToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setServers((prev) => prev.filter((s) => s.id !== serverToDelete.id));
        showToast(`Server ${serverToDelete.name} berhasil dihapus`);
      } else {
        throw new Error(data.error || 'Gagal menghapus');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus server', 'error');
    } finally {
      setServerToDelete(null);
    }
  };

  const filteredServers = servers.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.ipAddress.toLowerCase().includes(q) ||
      (s.hostname && s.hostname.toLowerCase().includes(q))
    );
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
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: '1rem',
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
              <Server size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Server Management (Ubuntu VPS)
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Kelola dan pantau resource server VPS, PM2, dan Nginx secara real-time
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
                placeholder="Cari server / IP..."
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
              onClick={fetchServers}
              disabled={isLoading}
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
              title="Refresh status server"
            >
              <RefreshCw size={15} className={isLoading ? 'spin-slow' : ''} style={{ color: '#2563eb' }} />
            </button>

            <button
              type="button"
              onClick={() => {
                setCreatedResult(null);
                setNewName('');
                setNewIp('');
                setNewHostname('');
                setIsAddModalOpen(true);
              }}
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
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Plus size={15} />
              <span>Tambah Server</span>
            </button>
          </div>
        </header>

        {/* Server Cards Grid */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredServers.length > 0 ? (
            filteredServers.map((srv) => {
              const isOnline = srv.status === 'ONLINE';
              const cpu = srv.latestMetric?.cpuUsage || 0;
              const ram = srv.latestMetric?.ramUsagePercent || 0;

              return (
                <div
                  key={srv.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Left: Server Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '220px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: isOnline ? '#f0fdf4' : '#f8fafc',
                        color: isOnline ? '#16a34a' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isOnline ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                        flexShrink: 0,
                      }}
                    >
                      <Server size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Link
                          href={`/servers/${srv.id}`}
                          style={{
                            fontSize: '0.9375rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            textDecoration: 'none',
                          }}
                        >
                          {srv.name}
                        </Link>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '999px',
                            background: isOnline ? '#dcfce7' : '#f1f5f9',
                            color: isOnline ? '#15803d' : '#64748b',
                          }}
                        >
                          {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {srv.ipAddress} {srv.hostname ? `• ${srv.hostname}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* CPU Usage Bar */}
                  <div style={{ width: '130px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748b', fontWeight: 600 }}>
                      <span>CPU</span>
                      <span style={{ color: cpu >= 85 ? '#dc2626' : '#0f172a' }}>{cpu.toFixed(1)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', marginTop: '0.25rem', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, cpu)}%`,
                          height: '100%',
                          background: cpu >= 90 ? '#dc2626' : cpu >= 75 ? '#d97706' : '#2563eb',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>

                  {/* RAM Usage Bar */}
                  <div style={{ width: '140px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748b', fontWeight: 600 }}>
                      <span>RAM</span>
                      <span style={{ color: ram >= 90 ? '#dc2626' : '#0f172a' }}>{ram.toFixed(1)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', marginTop: '0.25rem', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, ram)}%`,
                          height: '100%',
                          background: ram >= 90 ? '#dc2626' : ram >= 80 ? '#d97706' : '#16a34a',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>

                  {/* PM2 Processes Pill */}
                  <div style={{ fontSize: '0.78125rem', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Cpu size={14} style={{ color: '#2563eb' }} />
                      <span style={{ fontWeight: 700 }}>{srv.pm2OnlineCount}/{srv.pm2Count}</span>
                      <span style={{ color: '#64748b', fontSize: '0.71875rem' }}>PM2 App</span>
                    </div>
                  </div>

                  {/* Nginx Status Pill */}
                  <div>
                    <span
                      style={{
                        fontSize: '0.71875rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: srv.nginxStatus === 'ACTIVE' ? '#eff6ff' : '#f1f5f9',
                        color: srv.nginxStatus === 'ACTIVE' ? '#2563eb' : '#64748b',
                      }}
                    >
                      Nginx: {srv.nginxStatus}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Link
                      href={`/servers/${srv.id}`}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Activity size={13} />
                      <span>Detail &amp; Metrik</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setServerToDelete(srv)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Hapus server"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <Server size={38} style={{ color: '#94a3b8', margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Belum ada Server yang Didaftarkan
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', maxWidth: '420px', margin: '0.35rem auto 1rem auto' }}>
                Tambahkan server VPS Ubuntu Anda untuk mulai memantau CPU, RAM, disk, proses PM2, dan Nginx.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Tambah Server Pertama
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add Server Modal & Installation Guide */}
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
              maxWidth: '600px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Server size={20} style={{ color: '#2563eb' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {createdResult ? 'Server Berhasil Didaftarkan' : 'Daftarkan Server VPS Baru'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!createdResult ? (
                <form onSubmit={handleCreateServer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                      Nama Server *
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Contoh: VPS-Production-01"
                      style={{ width: '100%', height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84375rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                      IP Address Public *
                    </label>
                    <input
                      type="text"
                      required
                      value={newIp}
                      onChange={(e) => setNewIp(e.target.value)}
                      placeholder="Contoh: 103.93.162.19"
                      style={{ width: '100%', height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84375rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                      Hostname (Opsional)
                    </label>
                    <input
                      type="text"
                      value={newHostname}
                      onChange={(e) => setNewHostname(e.target.value)}
                      placeholder="Contoh: srv1.elevore.web.id"
                      style={{ width: '100%', height: '38px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84375rem', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{ padding: '0.55rem 1.35rem', borderRadius: '8px', background: '#2563eb', color: '#ffffff', border: 'none', fontSize: '0.8125rem', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                    >
                      {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan & Generate Token'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Show Agent Token & 1-line Installation Command */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem 1rem', borderRadius: '10px', color: '#166534', fontSize: '0.8125rem' }}>
                    <strong>Server &amp; Token Berhasil Dibuat!</strong> Token ini hanya ditampilkan sekali demi keamanan.
                  </div>

                  {/* Token Box */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      AGENT SECRET TOKEN
                    </div>
                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      <input
                        type="text"
                        readOnly
                        value={createdResult.token}
                        style={{ flex: 1, height: '36px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(createdResult.token);
                          setCopiedToken(true);
                          setTimeout(() => setCopiedToken(false), 2000);
                        }}
                        style={{ padding: '0 0.85rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        {copiedToken ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
                        <span>{copiedToken ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 1-Line Installer Command */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      PERINTAH INSTALASI UBUNTU (JALANKAN DI VPS TARGET)
                    </div>
                    <div style={{ background: '#0b1120', color: '#38bdf8', padding: '0.85rem 1rem', borderRadius: '10px', fontFamily: 'monospace', fontSize: '0.78125rem', lineHeight: 1.5, wordBreak: 'break-all', position: 'relative' }}>
                      curl -sSL {typeof window !== 'undefined' ? window.location.origin : 'https://DOMAIN'}/agent/install-agent.sh | sudo bash -s -- {typeof window !== 'undefined' ? window.location.origin : 'https://DOMAIN'} {createdResult.token}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const cmd = `curl -sSL ${window.location.origin}/agent/install-agent.sh | sudo bash -s -- ${window.location.origin} ${createdResult.token}`;
                        await navigator.clipboard.writeText(cmd);
                        setCopiedCmd(true);
                        setTimeout(() => setCopiedCmd(false), 2000);
                      }}
                      style={{ marginTop: '0.45rem', padding: '0.4rem 0.85rem', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      {copiedCmd ? <Check size={13} style={{ color: '#16a34a' }} /> : <Copy size={13} />}
                      <span>{copiedCmd ? 'Perintah Tersalin!' : 'Salin Perintah Bash'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      style={{ padding: '0.55rem 1.35rem', borderRadius: '8px', background: '#2563eb', color: '#ffffff', border: 'none', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Server Confirm Modal */}
      <ConfirmModal
        isOpen={!!serverToDelete}
        title="Konfirmasi Hapus Server"
        message={`Apakah Anda yakin ingin menghapus server "${serverToDelete?.name}"? Seluruh riwayat metrik, PM2, dan Nginx server ini akan dihapus.`}
        confirmText="Hapus Server"
        cancelText="Batal"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setServerToDelete(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            right: '1.25rem',
            zIndex: 9999,
            padding: '0.75rem 1.15rem',
            borderRadius: '10px',
            background: toast.type === 'success' ? '#166534' : '#991b1b',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
