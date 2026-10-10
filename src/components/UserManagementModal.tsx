'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, X, AlertCircle, CheckCircle2, User, Lock, Mail, Shield } from 'lucide-react';

interface ManagedUser {
  id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  createdAt: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
      setMessage({ text: 'Gagal memuat daftar pengguna', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setIsAddMode(false);
      setMessage(null);
    }
  }, [isOpen, fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName || undefined,
          email: newEmail || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menambahkan pengguna');
      }

      setMessage({ text: 'Pengguna baru berhasil ditambahkan', type: 'success' });
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewEmail('');
      setIsAddMode(false);
      fetchUsers();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Terjadi kesalahan', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Hapus pengguna "${username}" dari sistem?`)) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus pengguna');
      }

      setMessage({ text: `Pengguna "${username}" berhasil dihapus`, type: 'success' });
      fetchUsers();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menghapus pengguna', type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: '680px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Manajemen Pengguna
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                Kelola hak akses administrator dan operator sistem VioreCert
              </p>
            </div>
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

        {/* Status Message */}
        {message && (
          <div
            style={{
              margin: '1rem 1.5rem 0 1.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.84375rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {isAddMode ? (
            /* Form Add User */
            <form onSubmit={handleCreateUser}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                    Tambah Pengguna Baru
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddMode(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Contoh: operator1"
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.84375rem',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
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
                        height: '38px',
                        padding: '0 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.84375rem',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Contoh: Ahmad Fauzi"
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.84375rem',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Email (Opsional)
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@instansi.com"
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.84375rem',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    height: '40px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <Plus size={16} />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* User List Table */
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                  Daftar Akun Terdaftar ({users.length})
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddMode(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.85rem',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={15} />
                  <span>Tambah Pengguna</span>
                </button>
              </div>

              {isLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Memuat data pengguna...
                </div>
              ) : (
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84375rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Pengguna</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Email</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Dibuat Pada</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const isSelf = u.id === currentUserId;
                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {u.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span>{u.name || u.username}</span>
                                    {isSelf && (
                                      <span
                                        style={{
                                          fontSize: '0.65rem',
                                          padding: '0.1rem 0.4rem',
                                          borderRadius: '999px',
                                          background: '#dbeafe',
                                          color: '#1d4ed8',
                                          fontWeight: 600,
                                        }}
                                      >
                                        Anda
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{u.email || '-'}</td>
                            <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.75rem' }}>
                              {new Date(u.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                              {!isSelf && users.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '0.35rem',
                                    borderRadius: '6px',
                                  }}
                                  title="Hapus Pengguna"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
