import * as XLSX from 'xlsx';
import { MonitoredDomain } from '@/types/ssl';

export function exportDomainsToExcel(domains: MonitoredDomain[], fileNamePrefix = 'Laporan_SSL_VioreCert'): void {
  const rows = domains.map((item, index) => {
    const cert = item.lastCheck;
    let statusText = 'Belum Diperiksa';
    if (cert) {
      if (cert.status === 'valid') statusText = 'Aktif (Valid)';
      else if (cert.status === 'warning') statusText = 'Segera Habis (< 30 Hari)';
      else if (cert.status === 'critical') statusText = 'Kritis (< 7 Hari)';
      else if (cert.status === 'expired') statusText = 'Kedaluwarsa';
      else statusText = 'Error / Gagal';
    }

    return {
      No: index + 1,
      'Nama Domain': item.domain,
      Port: item.port,
      'Alias / Label': item.alias || '-',
      'Status SSL': statusText,
      'Sisa Hari': cert ? (cert.daysRemaining !== undefined ? `${cert.daysRemaining} hari` : '-') : '-',
      'Penerbit Sertifikat (Issuer)': cert?.issuer?.organization || cert?.issuer?.commonName || '-',
      'Subjek Sertifikat': cert?.subject?.commonName || '-',
      'Berlaku Dari': cert?.validFrom ? new Date(cert.validFrom).toLocaleString('id-ID') : '-',
      'Berlaku Hingga': cert?.validTo ? new Date(cert.validTo).toLocaleString('id-ID') : '-',
      'Terakhir Diperiksa': cert?.checkedAt ? new Date(cert.checkedAt).toLocaleString('id-ID') : '-',
      'Catatan / Error': cert?.error || cert?.authorizationError || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 28 }, // Nama Domain
    { wch: 8 },  // Port
    { wch: 20 }, // Alias
    { wch: 22 }, // Status SSL
    { wch: 14 }, // Sisa Hari
    { wch: 30 }, // Penerbit Sertifikat
    { wch: 28 }, // Subjek Sertifikat
    { wch: 22 }, // Berlaku Dari
    { wch: 22 }, // Berlaku Hingga
    { wch: 22 }, // Terakhir Diperiksa
    { wch: 30 }, // Catatan / Error
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Domain SSL');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
}
