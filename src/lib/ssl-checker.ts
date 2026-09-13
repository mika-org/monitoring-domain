import tls from 'node:tls';
import { SSLCertificateInfo, SSLStatus } from '@/types/ssl';

import { parseDomainInput } from './domain-utils';
export { parseDomainInput };

const DEFAULT_TIMEOUT_MS = Number(process.env.SSL_CHECK_TIMEOUT_MS) || 9000;

export function checkSSL(
  rawInput: string,
  customPort?: number,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<SSLCertificateInfo> {
  const parsed = parseDomainInput(rawInput);
  const host = parsed.host;
  const port = customPort || parsed.port || 443;
  const checkedAt = new Date().toISOString();

  return new Promise((resolve) => {
    if (!host) {
      resolve({
        domain: rawInput,
        port,
        status: 'error',
        issuer: { commonName: '', organization: '' },
        subject: { commonName: '' },
        validFrom: '',
        validTo: '',
        daysRemaining: 0,
        isExpired: false,
        authorized: false,
        subjectAltNames: [],
        checkedAt,
        error: 'Nama domain tidak valid atau kosong',
      });
      return;
    }

    let resolved = false;
    const socket = tls.connect(
      {
        host,
        port,
        servername: host, // SNI support
        rejectUnauthorized: false, // Don't crash on invalid/expired certs so we can inspect them
        timeout: timeoutMs,
      },
      () => {
        if (resolved) return;
        resolved = true;

        try {
          const cert = socket.getPeerCertificate(true);
          const authorized = socket.authorized;
          const authError = socket.authorizationError
            ? String(socket.authorizationError)
            : null;

          if (!cert || Object.keys(cert).length === 0) {
            socket.destroy();
            resolve({
              domain: host,
              port,
              status: 'error',
              issuer: { commonName: '', organization: '' },
              subject: { commonName: '' },
              validFrom: '',
              validTo: '',
              daysRemaining: 0,
              isExpired: false,
              authorized: false,
              subjectAltNames: [],
              checkedAt,
              error: 'Server tidak menyediakan sertifikat SSL/TLS',
            });
            return;
          }

          const validFromDate = new Date(cert.valid_from);
          const validToDate = new Date(cert.valid_to);
          const now = Date.now();
          const msRemaining = validToDate.getTime() - now;
          const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
          const isExpired = daysRemaining <= 0;

          // Determine status
          let status: SSLStatus = 'valid';
          if (isExpired) {
            status = 'expired';
          } else if (daysRemaining <= 7) {
            status = 'critical';
          } else if (daysRemaining <= 30) {
            status = 'warning';
          } else if (!authorized && authError && !authError.includes('EXPIRED')) {
            // Self-signed or untrusted CA
            status = 'error';
          }

          // Parse Subject Alternative Names
          const sans: string[] = [];
          if (cert.subjectaltname) {
            const parts = cert.subjectaltname.split(',');
            for (const p of parts) {
              const cleaned = p.trim().replace(/^DNS:/, '');
              if (cleaned) sans.push(cleaned);
            }
          }

          const cipherObj = socket.getCipher();
          const cipher = cipherObj ? `${cipherObj.name} (${cipherObj.version})` : undefined;
          const protocol = socket.getProtocol() || undefined;

          socket.end();

function formatCertField(value?: string | string[]): string {
  if (!value) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

          resolve({
            domain: host,
            port,
            status,
            issuer: {
              commonName: formatCertField(cert.issuer?.CN),
              organization: formatCertField(cert.issuer?.O),
              country: formatCertField(cert.issuer?.C),
            },
            subject: {
              commonName: formatCertField(cert.subject?.CN) || host,
              organization: formatCertField(cert.subject?.O),
              country: formatCertField(cert.subject?.C),
            },
            validFrom: validFromDate.toISOString(),
            validTo: validToDate.toISOString(),
            daysRemaining,
            isExpired,
            authorized,
            authorizationError: authError,
            subjectAltNames: sans,
            serialNumber: cert.serialNumber || '',
            fingerprint256: cert.fingerprint256 || '',
            protocol,
            cipher,
            checkedAt,
            error: !authorized && authError ? authError : null,
          });
        } catch (err: unknown) {
          socket.destroy();
          resolve({
            domain: host,
            port,
            status: 'error',
            issuer: { commonName: '', organization: '' },
            subject: { commonName: '' },
            validFrom: '',
            validTo: '',
            daysRemaining: 0,
            isExpired: false,
            authorized: false,
            subjectAltNames: [],
            checkedAt,
            error: err instanceof Error ? err.message : 'Gagal memproses sertifikat',
          });
        }
      }
    );

    socket.on('timeout', () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({
        domain: host,
        port,
        status: 'error',
        issuer: { commonName: '', organization: '' },
        subject: { commonName: '' },
        validFrom: '',
        validTo: '',
        daysRemaining: 0,
        isExpired: false,
        authorized: false,
        subjectAltNames: [],
        checkedAt,
        error: `Koneksi timeout setelah ${timeoutMs / 1000} detik`,
      });
    });

    socket.on('error', (err: NodeJS.ErrnoException) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();

      let friendlyError = err.message;
      if (err.code === 'ENOTFOUND') {
        friendlyError = 'Domain tidak ditemukan (DNS lookup gagal)';
      } else if (err.code === 'ECONNREFUSED') {
        friendlyError = `Koneksi ditolak pada port ${port}`;
      } else if (err.code === 'ETIMEDOUT') {
        friendlyError = 'Koneksi ke server timeout';
      } else if (err.code === 'CERT_HAS_EXPIRED') {
        friendlyError = 'Sertifikat SSL telah kadaluarsa';
      } else if (err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        friendlyError = 'Sertifikat tidak dapat diverifikasi (Untrusted CA)';
      }

      resolve({
        domain: host,
        port,
        status: 'error',
        issuer: { commonName: '', organization: '' },
        subject: { commonName: '' },
        validFrom: '',
        validTo: '',
        daysRemaining: 0,
        isExpired: false,
        authorized: false,
        subjectAltNames: [],
        checkedAt,
        error: friendlyError,
      });
    });
  });
}
