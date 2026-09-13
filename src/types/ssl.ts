export type SSLStatus = 'valid' | 'warning' | 'critical' | 'expired' | 'error';

export interface SSLCertificateInfo {
  domain: string;
  port: number;
  status: SSLStatus;
  issuer: {
    commonName: string;
    organization: string;
    country?: string;
  };
  subject: {
    commonName: string;
    organization?: string;
    country?: string;
  };
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  isExpired: boolean;
  authorized: boolean;
  authorizationError?: string | null;
  subjectAltNames: string[];
  serialNumber?: string;
  fingerprint256?: string;
  protocol?: string;
  cipher?: string;
  checkedAt: string;
  error?: string | null;
}

export interface MonitoredDomain {
  id: string;
  domain: string;
  port: number;
  alias?: string;
  createdAt: string;
  updatedAt: string;
  lastCheck?: SSLCertificateInfo | null;
}

export interface SSLCheckSummary {
  total: number;
  valid: number;
  warning: number;
  critical: number;
  expired: number;
  error: number;
}
