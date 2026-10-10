'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Server,
  Globe,
  Cpu,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  Cloud,
  Settings,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  QrCode,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface SidebarProps {
  onOpenQuickCheck?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenQuickCheck }) => {
  const pathname = usePathname();
  const router = useRouter();
  
  // Persist sidebar state: default true (expanded)
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync with localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('viorecert_sidebar_expanded');
    if (saved !== null) {
      setIsExpanded(saved === 'true');
    }
  }, []);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem('viorecert_sidebar_expanded', String(next));
      return next;
    });
  };

  // Exact 9 navigation items per Section 6 of project specification
  const menuItems = [
    { label: 'Overview', href: '/', icon: LayoutGrid },
    { label: 'Servers', href: '/servers', icon: Server },
    { label: 'Websites', href: '/websites', icon: Globe },
    { label: 'Processes (PM2)', href: '/processes', icon: Cpu },
    { label: 'Nginx', href: '/nginx', icon: Layers },
    { label: 'Alerts', href: '/alerts', icon: AlertTriangle },
    { label: 'Reports', href: '/reports', icon: FileSpreadsheet },
    { label: 'Integrations', href: '/integrations', icon: Cloud },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <>
      <aside
        style={{
          width: isExpanded ? '240px' : '68px',
          height: '100vh',
          background: '#0b1120',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isExpanded ? 'stretch' : 'center',
          justifyContent: 'space-between',
          padding: '1rem 0.65rem',
          flexShrink: 0,
          zIndex: 50,
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        {/* Top: Logo & Toggle Button */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'space-between' : 'center',
              marginBottom: '1.25rem',
              padding: isExpanded ? '0 0.4rem' : '0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                }}
                onClick={handleToggleExpand}
                title={isExpanded ? 'Ciutkan Menu' : 'Buka Menu (Expand)'}
              >
                V
              </div>
              {isExpanded && (
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    VioreCert
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#38bdf8', fontWeight: 600 }}>
                    Server Monitor
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={handleToggleExpand}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: '#1e293b',
                color: '#94a3b8',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: isExpanded ? '0' : '0.5rem',
              }}
              title={isExpanded ? 'Ciutkan Menu' : 'Buka Menu (Expand)'}
            >
              {isExpanded ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isExpanded ? '0.75rem' : '0',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    padding: isExpanded ? '0.55rem 0.75rem' : '0.55rem 0',
                    width: '100%',
                    borderRadius: '8px',
                    background: isActive ? '#1e293b' : 'transparent',
                    color: isActive ? '#38bdf8' : '#94a3b8',
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  {isExpanded && (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
          {/* Expand Toggle when collapsed */}
          {!isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              style={{
                width: '100%',
                height: '36px',
                borderRadius: '8px',
                background: 'transparent',
                color: '#64748b',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Perluas Menu (Expand)"
            >
              <ChevronRight size={16} />
            </button>
          )}

          {/* Quick Check Button */}
          {onOpenQuickCheck && (
            <button
              type="button"
              onClick={onOpenQuickCheck}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isExpanded ? '0.75rem' : '0',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                padding: isExpanded ? '0.55rem 0.75rem' : '0.55rem 0',
                width: '100%',
                borderRadius: '8px',
                background: 'transparent',
                color: '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
              title="Cek Cepat SSL"
            >
              <Search size={18} style={{ flexShrink: 0 }} />
              {isExpanded && <span style={{ whiteSpace: 'nowrap' }}>Cek Cepat SSL</span>}
            </button>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isExpanded ? '0.75rem' : '0',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '0.55rem 0.75rem' : '0.55rem 0',
              width: '100%',
              borderRadius: '8px',
              background: 'transparent',
              color: '#f87171',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
            title="Keluar dari Sistem"
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {isExpanded && <span style={{ whiteSpace: 'nowrap' }}>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin mengakhiri sesi login VioreCert?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        type="warning"
        onConfirm={handleLogout}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};
