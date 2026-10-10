'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, Mail, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Login gagal, periksa username dan password Anda');
        }

        setSuccessMessage('Login berhasil! Mengalihkan ke dashboard...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 500);
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password,
            name: name || undefined,
            email: email || undefined,
          }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Pendaftaran gagal');
        }

        setSuccessMessage('Akun berhasil dibuat! Mengalihkan ke dashboard...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 500);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--bg-main)',
        backgroundImage: 'var(--bg-gradient)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient lights */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.08)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '20%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.08)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          borderRadius: '1.25rem',
          padding: '2.5rem 2.25rem',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(59, 130, 246, 0.2))',
              border: '1px solid var(--border-accent)',
              color: 'var(--cyan-400)',
              marginBottom: '1rem',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.25)',
            }}
          >
            <ShieldCheck size={32} strokeWidth={2.2} />
          </div>
          <h1
            style={{
              fontSize: '1.625rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              letterSpacing: '-0.025em',
              marginBottom: '0.35rem',
            }}
          >
            CertPulse
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Monitoring Masa Aktif SSL & Validitas Domain
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(15, 23, 42, 0.75)',
            padding: '0.25rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            style={{
              padding: '0.55rem 0.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: mode === 'login' ? 600 : 500,
              color: mode === 'login' ? 'var(--text-main)' : 'var(--text-dim)',
              background: mode === 'login' ? 'var(--bg-surface-elevated)' : 'transparent',
              border: mode === 'login' ? '1px solid var(--border-glass)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            style={{
              padding: '0.55rem 0.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: mode === 'register' ? 600 : 500,
              color: mode === 'register' ? 'var(--text-main)' : 'var(--text-dim)',
              background: mode === 'register' ? 'var(--bg-surface-elevated)' : 'transparent',
              border: mode === 'register' ? '1px solid var(--border-glass)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Daftar Akun
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '0.75rem 1rem',
              borderRadius: '0.625rem',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, color: '#f87171' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6ee7b7',
              padding: '0.75rem 1rem',
              borderRadius: '0.625rem',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0, color: '#34d399' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {mode === 'register' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: '0.45rem',
                }}
              >
                Nama Lengkap <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>(Opsional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.95rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: John Doe"
                  className="input-text"
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '0.45rem',
              }}
            >
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.95rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="input-text"
                style={{ paddingLeft: '2.75rem' }}
                autoComplete="username"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: '0.45rem',
                }}
              >
                Email <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>(Opsional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.95rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="input-text"
                  style={{ paddingLeft: '2.75rem' }}
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '0.45rem',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.95rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="input-text"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-main)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-dim)')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: '0.65rem',
              padding: '0.8rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Masuk ke Dashboard' : 'Buat Akun'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
