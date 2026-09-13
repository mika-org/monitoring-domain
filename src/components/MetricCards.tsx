'use client';

import React from 'react';
import { Globe, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { SSLCheckSummary } from '@/types/ssl';

interface MetricCardsProps {
  summary: SSLCheckSummary;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  summary,
  activeFilter,
  onFilterChange,
}) => {
  const criticalAndExpired = summary.critical + summary.expired + summary.error;

  return (
    <div className="metrics-grid">
      <div
        className={`metric-card metric-total ${activeFilter === 'all' ? 'active-filter' : ''}`}
        onClick={() => onFilterChange('all')}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
      >
        <div className="metric-info">
          <span className="metric-label">Total Domain</span>
          <span className="metric-value">{summary.total}</span>
          <span className="metric-subtext">Domain dalam watchlist</span>
        </div>
        <div className="metric-icon-box" style={{ color: '#38bdf8' }}>
          <Globe size={22} />
        </div>
      </div>

      <div
        className={`metric-card metric-valid ${activeFilter === 'valid' ? 'active-filter' : ''}`}
        onClick={() => onFilterChange('valid')}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
      >
        <div className="metric-info">
          <span className="metric-label">SSL Aman (&gt; 30 Hari)</span>
          <span className="metric-value" style={{ color: 'var(--status-valid-text)' }}>
            {summary.valid}
          </span>
          <span className="metric-subtext">Sertifikat valid & aman</span>
        </div>
        <div className="metric-icon-box" style={{ color: 'var(--status-valid-text)' }}>
          <ShieldCheck size={22} />
        </div>
      </div>

      <div
        className={`metric-card metric-warning ${activeFilter === 'warning' ? 'active-filter' : ''}`}
        onClick={() => onFilterChange('warning')}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
      >
        <div className="metric-info">
          <span className="metric-label">Segera Kadaluarsa</span>
          <span className="metric-value" style={{ color: 'var(--status-warning-text)' }}>
            {summary.warning}
          </span>
          <span className="metric-subtext">Sisa 8 - 30 hari</span>
        </div>
        <div className="metric-icon-box" style={{ color: 'var(--status-warning-text)' }}>
          <AlertTriangle size={22} />
        </div>
      </div>

      <div
        className={`metric-card metric-critical ${
          activeFilter === 'critical' || activeFilter === 'expired' || activeFilter === 'error'
            ? 'active-filter'
            : ''
        }`}
        onClick={() => onFilterChange('critical')}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
      >
        <div className="metric-info">
          <span className="metric-label">Kritis &amp; Kadaluarsa</span>
          <span className="metric-value" style={{ color: 'var(--status-critical-text)' }}>
            {criticalAndExpired}
          </span>
          <span className="metric-subtext">
            {summary.critical} kritis · {summary.expired} expired · {summary.error} error
          </span>
        </div>
        <div className="metric-icon-box" style={{ color: 'var(--status-critical-text)' }}>
          <AlertOctagon size={22} />
        </div>
      </div>
    </div>
  );
};
