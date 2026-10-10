'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Shield,
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ConfirmModal } from '@/components/ConfirmModal';

interface ManagedUser {
  id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMode, setIsAddMode] = useState(false);

  // New user form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals & Feedback
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
        if (data.currentUserId) setCurrentUserId(data.currentUserId);
      }
    } catch {
      showToast('Gagal memuat daftar pengguna', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
          email: newEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Akun @${newUsername} berhasil ditambahkan`);
        setNewUsername('');
        setNewPassword('');
        setNewName('');
        setNewEmail('');
        setIsAddMode(false);
        fetchUsers();
      } else {
        throw new Error(data.error || 'Gagal menambahkan pengguna');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Terjadi kesalahan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/users?id=${userToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Akun @${userToDelete.username} berhasil dihapus`);
        fetchUsers();
      } else {
        throw new Error(data.error || 'Gagal menghapus pengguna');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus akun', 'error');
    } finally {
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
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
              <Users size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Manajemen Akun Pengguna
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Kelola hak akses administrator yang dapat login ke sistem VioreCert
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
                placeholder="Cari user..."
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
              onClick={() => setIsAddMode(!isAddMode)}
              style={{
                height: '36px',
                padding: '0 1rem',
                borderRadius: '8px',
                background: isAddMode ? '#f1f5f9' : '#2563eb',
                color: isAddMode ? '#334155' : '#ffffff',
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
              <span>{isAddMode ? 'Tutup Form' : 'Tambah Pengguna Baru'}</span>
            </button>
          </div>
        </header>

        {/* Add User Form Card if isAddMode */}
        {isAddMode && (
          <form
            onSubmit={handleCreateUser}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              flexShrink: 0,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
              Form Pendaftaran Administrator Baru
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="admin2"
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

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
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

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Nama Lengkap (Opsional)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
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

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@example.com"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsAddMode(false)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  background: '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Akun Baru'}
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
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
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Pengguna</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Role / Peran</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Tanggal Dibuat</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((item) => {
                    const isSelf = item.id === currentUserId;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: isSelf ? '#eff6ff' : '#f1f5f9',
                                color: isSelf ? '#2563eb' : '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.8125rem',
                              }}
                            >
                              {(item.name || item.username).slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>{item.name || item.username}</span>
                                {isSelf && (
                                  <span style={{ fontSize: '0.6875rem', background: '#dcfce7', color: '#15803d', padding: '0.05rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{item.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                          {item.email || '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: 700 }}>
                            Administrator
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.78125rem' }}>
                          {new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(item)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #fee2e2',
                                background: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Hapus</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      {isLoading ? 'Memuat daftar pengguna...' : 'Tidak ada data pengguna.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Delete User Confirm Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Konfirmasi Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun administrator @${userToDelete?.username}? Pengguna ini tidak akan dapat login lagi.`}
        confirmText="Hapus Akun"
        cancelText="Batal"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setUserToDelete(null)}
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
