# SERVER MONITORING DASHBOARD — PROJECT SPECIFICATION

## 1. Project Overview

Buat aplikasi **Server Monitoring Dashboard** berbasis Next.js untuk memantau kondisi server VPS, performa sistem, status website, layanan backend, dan infrastruktur secara real-time.

Aplikasi harus memiliki tampilan profesional, sederhana, responsif, ringan, dan mudah digunakan oleh administrator server.

Aplikasi ditujukan untuk mengelola beberapa server Ubuntu yang menjalankan Next.js, PM2, Nginx, dan berbagai website production.

Integrasikan Biznet Cloud API apabila layanan Biznet yang digunakan menyediakan API dan metrik yang dibutuhkan. Jangan mengasumsikan semua metrik tersedia melalui API Biznet.

## 2. Technology Stack

Gunakan teknologi berikut:

- Frontend: Next.js dengan App Router dan TypeScript.
- Styling: Tailwind CSS.
- UI Components: shadcn/ui.
- Icons: Lucide React.
- Charts: Recharts.
- Backend: Next.js Route Handlers.
- Database: PostgreSQL.
- ORM: Prisma.
- Authentication: Auth.js atau autentikasi berbasis session yang aman.
- Server monitoring agent: Node.js atau Bash agent yang berjalan pada setiap server Ubuntu.
- Process manager: PM2.
- Reverse proxy: Nginx.
- Deployment: Ubuntu Server.
- Jangan menggunakan Docker.

Gunakan versi package yang stabil dan kompatibel ketika implementasi dilakukan.

## 3. Core Features

### A. Dashboard Overview

Buat halaman dashboard utama yang menampilkan ringkasan seluruh infrastruktur.

Tampilkan metrik berikut:

- Total server.
- Server online dan offline.
- Total website yang dimonitor.
- Website online dan offline.
- CPU usage keseluruhan dan per server.
- RAM usage keseluruhan dan per server.
- Disk usage.
- Network traffic: upload dan download.
- Uptime server.
- Load average.
- Total aplikasi PM2 yang berjalan.
- Jumlah aplikasi yang mengalami error.
- Waktu pembaruan data terakhir.

Sediakan grafik penggunaan CPU, RAM, disk, dan jaringan berdasarkan rentang waktu.

Rentang waktu yang tersedia: 1 jam, 6 jam, 24 jam, 7 hari, dan 30 hari, sesuai ketersediaan data historis.

### B. Server Management

Buat halaman untuk mengelola daftar server.

Setiap server memiliki informasi:

- Nama server.
- Hostname.
- IP address.
- Operating system.
- Versi kernel.
- CPU model dan jumlah core.
- Total RAM.
- Total disk.
- Status koneksi.
- Uptime.
- Last heartbeat.
- Status agent monitoring.

Fitur:

- Tambah server.
- Edit informasi server.
- Hapus server dengan konfirmasi.
- Melihat detail server.
- Menampilkan status online/offline.
- Melihat histori performa server.
- Menampilkan alert jika server tidak mengirim heartbeat sesuai batas waktu yang ditentukan.

Sediakan mekanisme registrasi agent dengan token unik per server.

Token hanya ditampilkan saat dibuat atau dirotasi, dan disimpan dalam bentuk hash di database jika memungkinkan.

### C. Real-Time System Monitoring

Monitor kondisi sistem Ubuntu menggunakan agent yang berjalan pada setiap server.

Metrik yang dikumpulkan:

1. CPU utilization dalam persen.
2. RAM total, terpakai, tersedia, dan persentase penggunaan.
3. Disk usage untuk setiap mount point.
4. Network throughput upload dan download.
5. Load average 1, 5, dan 15 menit.
6. Server uptime.
7. Jumlah proses.
8. Disk I/O apabila tersedia.
9. Informasi sistem dan resource.
10. Timestamp pengumpulan metrik.

Agent harus mengirim metrik ke server monitoring melalui HTTPS dengan autentikasi token.

Jangan menjalankan perintah shell langsung dari request publik Next.js.

Pengambilan metrik harus dilakukan oleh agent lokal atau mekanisme server-side yang terkontrol, bukan dengan mengakses filesystem server lain secara sembarangan.

### D. Website Monitoring

Buat fitur untuk memonitor banyak domain sekaligus.

Contoh website:

- photobooth.elevore.web.id
- smartkids.elevore.web.id
- pos.elevore.web.id
- tkistiqamah.com
- alfalah.elevore.web.id

Daftar domain harus dapat ditambahkan dan diedit melalui dashboard, bukan ditulis permanen di source code.

Metrik website:

- HTTP status code.
- Status UP atau DOWN.
- Response time.
- SSL certificate expiration.
- Domain expiration jika penyedia informasi domain mendukung pemeriksaan.
- Timestamp pengecekan terakhir.
- Persentase uptime.
- Riwayat gangguan.
- Jumlah kegagalan berturut-turut.

Buat health check dengan interval yang dapat dikonfigurasi, misalnya setiap 30–60 detik.

Jangan menjalankan seluruh pengecekan hanya saat pengguna membuka dashboard. Gunakan background worker atau scheduled job yang berjalan secara berkala.

Hindari SSRF dengan memvalidasi URL, membatasi protokol HTTP/HTTPS, dan memblokir alamat IP internal atau metadata cloud untuk URL yang dapat ditambahkan pengguna.

### E. PM2 Monitoring

Buat halaman khusus untuk memantau proses PM2 di setiap server.

Informasi yang ditampilkan:

- Nama aplikasi.
- PM2 process ID.
- Status proses.
- CPU usage.
- Memory usage.
- Restart count.
- Uptime proses.
- Waktu mulai.
- Versi Node.js apabila tersedia.
- Status error.

Contoh nama aplikasi:

- elevore
- pos
- smart_kids
- snapore

Tampilkan aplikasi yang online, stopped, errored, atau mengalami restart berulang.

Ambil informasi PM2 melalui agent lokal dengan izin minimum yang diperlukan.

Jangan mengekspos PM2 API atau port internal PM2 langsung ke internet.

Secara default, dashboard hanya menyediakan monitoring read-only. Jika fitur restart aplikasi ditambahkan di kemudian hari, gunakan allowlist nama proses, otorisasi administrator, audit log, dan mekanisme eksekusi terbatas.

### F. Nginx Monitoring

Monitor layanan Nginx pada masing-masing server.

Fitur:

- Status service Nginx.
- Versi Nginx.
- Status port HTTP dan HTTPS.
- Pemeriksaan endpoint website.
- Jumlah virtual host yang terdaftar jika dapat diambil oleh agent.
- Error rate apabila access/error log dapat dianalisis secara aman.
- Waktu pengecekan terakhir.

Jangan mengasumsikan Nginx menyediakan metrik detail secara default. Gunakan konfigurasi status endpoint atau analisis log yang dibatasi sesuai kebutuhan.

Jangan pernah menampilkan isi lengkap file konfigurasi rahasia atau log yang berisi token dan kredensial.

### G. Biznet Cloud API Integration

Buat modul integrasi Biznet yang terpisah dari sistem monitoring agent.

Persyaratan:

- Gunakan dokumentasi API resmi Biznet yang sesuai dengan produk yang digunakan.
- Simpan API Key hanya pada environment variable server-side.
- Jangan pernah mengirim API Key ke browser.
- Jangan menyimpan API Key di localStorage.
- Jangan mengekspos API Key melalui response API, log, maupun error message.
- Terapkan timeout, retry terbatas, rate limiting, dan penanganan kegagalan.
- Sediakan tombol Test Connection.
- Tampilkan waktu sinkronisasi terakhir.
- Tampilkan status integrasi: Connected, Disconnected, atau Not Configured.
- Jika API tidak tersedia atau metrik tertentu tidak didukung, tampilkan status Not Supported atau Unavailable.
- Jangan membuat data monitoring palsu untuk menggantikan respons API.
- Bedakan metrik dari API cloud provider dan metrik yang dikumpulkan agent lokal.

Buat halaman Settings → Integrations → Biznet Cloud.

Sediakan konfigurasi:

- Nama integrasi.
- Produk atau layanan Biznet.
- API endpoint sesuai dokumentasi resmi.
- API Key.
- Status koneksi.
- Waktu sinkronisasi terakhir.

Credential harus disimpan secara aman, idealnya dienkripsi saat tersimpan di database apabila penyimpanan dinamis diperlukan. Untuk konfigurasi statis, utamakan environment variable.

Jika Biznet API hanya menyediakan informasi instance atau billing dan tidak menyediakan CPU/RAM aktual, tampilkan metrik CPU/RAM dari monitoring agent.

### H. Alerting and Notifications

Buat sistem notifikasi untuk kondisi:

- Server offline.
- Website down.
- CPU melewati threshold.
- RAM melewati threshold.
- Disk usage melewati threshold.
- SSL akan kedaluwarsa.
- PM2 process mengalami error.
- Nginx tidak aktif.
- Agent berhenti mengirim heartbeat.

Sediakan pengaturan threshold per server dan per website.

Contoh default:

- CPU warning: 80%.
- CPU critical: 95%.
- RAM warning: 85%.
- RAM critical: 95%.
- Disk warning: 80%.
- Disk critical: 90%.
- SSL warning: 30 hari sebelum kedaluwarsa.

Threshold dapat diubah administrator.

Integrasikan notifikasi melalui Telegram atau email secara opsional.

Terapkan deduplication, cooldown, dan recovery notification agar sistem tidak mengirim notifikasi berulang tanpa batas.

### I. Historical Metrics

Simpan histori metrik di PostgreSQL.

Data yang perlu disimpan:

- Server ID.
- Timestamp.
- CPU usage.
- RAM usage.
- Disk usage.
- Network traffic.
- Load average.
- Website response time.
- Website status.
- PM2 process status.
- Alert events.

Gunakan retention policy yang dapat dikonfigurasi.

Contoh kebijakan:

- Data resolusi tinggi: 7 hari.
- Data resolusi menengah: 30 hari.
- Data agregat harian: 12 bulan.

Lakukan agregasi berkala dan pembersihan data lama secara otomatis.

Hindari menyimpan sampel setiap detik untuk seluruh server jika tidak dibutuhkan karena dapat membebani database.

### J. Authentication and Authorization

Buat sistem autentikasi yang aman.

Role:

- Super Admin: akses seluruh fitur.
- Admin: mengelola server dan monitoring.
- Viewer: hanya melihat dashboard dan laporan.

Fitur:

- Login dan logout.
- Session management.
- Proteksi seluruh halaman privat.
- Validasi permission di server.
- Rate limiting login.
- Audit log untuk tindakan penting.

Jangan hanya mengandalkan middleware atau menyembunyikan tombol di frontend. Setiap endpoint sensitif harus memeriksa otorisasi di backend.

## 4. Database Design

Gunakan PostgreSQL dan Prisma.

Gunakan nama tabel lowercase dengan snake_case.

Minimal buat tabel berikut:

- users
- servers
- server_agents
- server_metrics
- websites
- website_checks
- pm2_processes
- nginx_services
- alerts
- notification_channels
- notification_logs
- integrations
- audit_logs

Tambahkan:

- Primary key.
- Foreign key.
- Index pada timestamp dan relasi yang sering digunakan.
- Created at dan updated at.
- Unique constraint yang sesuai.
- Pagination untuk histori.
- Retention policy untuk tabel metrik.

Hindari menyimpan seluruh histori metrik dalam satu kolom JSON tanpa kebutuhan yang jelas.

Simpan credential dan token secara aman serta pisahkan konfigurasi sensitif dari data yang dapat dibaca pengguna biasa.

## 5. API Routes

Gunakan Next.js Route Handlers.

Contoh endpoint:

- GET /api/dashboard/overview
- GET /api/servers
- POST /api/servers
- GET /api/servers/[id]
- PATCH /api/servers/[id]
- DELETE /api/servers/[id]
- GET /api/servers/[id]/metrics
- POST /api/agent/heartbeat
- POST /api/agent/metrics
- GET /api/websites
- POST /api/websites
- GET /api/websites/[id]/history
- GET /api/pm2/processes
- GET /api/nginx/status
- GET /api/alerts
- PATCH /api/alerts/[id]
- GET /api/integrations/biznet/status
- POST /api/integrations/biznet/test
- POST /api/integrations/biznet/sync

Endpoint di atas adalah rancangan aplikasi, bukan endpoint resmi Biznet.

Semua endpoint harus memiliki validasi input menggunakan Zod, autentikasi yang sesuai, error handling, pagination jika diperlukan, serta proteksi terhadap akses tidak sah.

Endpoint agent wajib menggunakan autentikasi machine-to-machine yang berbeda dari session pengguna.

## 6. UI/UX Design Requirements

Buat desain yang terlihat seperti aplikasi monitoring server profesional yang benar-benar dirancang oleh product designer, bukan dashboard generik hasil generator AI.

Prinsip desain:

- Sederhana, bersih, dan fungsional.
- Layout dashboard yang ringkas.
- Gunakan latar belakang netral.
- Gunakan warna status hanya untuk menunjukkan kondisi.
- Hindari border berwarna pada setiap card.
- Gunakan shadow tipis dan seperlunya.
- Hindari gradient dekoratif yang berlebihan.
- Hindari terlalu banyak card dengan bentuk identik.
- Utamakan keterbacaan angka dan grafik.
- Gunakan tipografi yang konsisten.
- Sediakan dark mode dan light mode.
- Responsive untuk desktop, tablet, dan mobile.
- Gunakan skeleton loading, empty state, error state, dan tooltip.
- Tampilkan timestamp pembaruan data dengan jelas.

Layout desktop:

- Sidebar navigasi di sebelah kiri.
- Header dengan nama halaman, status monitoring, dan profil pengguna.
- Konten utama dengan ringkasan server dan grafik.
- Panel alert untuk insiden yang membutuhkan perhatian.

Navigasi:

1. Overview
2. Servers
3. Websites
4. Processes
5. Nginx
6. Alerts
7. Reports
8. Integrations
9. Settings

Buat halaman detail server dengan tab Overview, Metrics, Processes, Services, dan History.

Gunakan komponen reusable, tetapi jangan memaksakan seluruh halaman memiliki struktur visual yang sama.

## 7. Architecture

Pisahkan sistem menjadi tiga komponen:

### A. Monitoring Dashboard

Aplikasi Next.js yang menyediakan UI, autentikasi, API internal, pengelolaan konfigurasi, histori, dan laporan.

### B. Monitoring Agent

Program ringan yang berjalan pada setiap Ubuntu server.

Tanggung jawab:

- Mengumpulkan metrik lokal.
- Memeriksa PM2.
- Memeriksa Nginx.
- Mengirim heartbeat.
- Mengirim metrik secara periodik.
- Melakukan autentikasi ke dashboard.
- Mengirim data dengan timeout dan retry terbatas.

Agent hanya boleh mengumpulkan data yang diperlukan dan tidak boleh menjalankan perintah arbitrary dari dashboard.

### C. Background Worker

Komponen terpisah yang menjalankan pekerjaan terjadwal:

- Pengecekan website.
- Pemeriksaan SSL.
- Sinkronisasi Biznet API.
- Evaluasi alert.
- Pengiriman notifikasi.
- Agregasi dan pembersihan data.

Gunakan mekanisme cron atau scheduler yang sesuai dengan deployment. Hindari mengandalkan setInterval di dalam proses Next.js yang dapat berjalan pada beberapa instance atau berhenti saat aplikasi restart.

## 8. Security Requirements

Keamanan wajib menjadi prioritas.

- HTTPS untuk seluruh komunikasi.
- API Key Biznet hanya di backend.
- Agent menggunakan token unik per server.
- Token tidak ditampilkan dalam log.
- Validasi seluruh payload.
- Batasi ukuran request.
- Rate limit endpoint publik.
- Proteksi SSRF untuk website monitoring.
- Gunakan least privilege untuk agent.
- Hindari eksekusi shell dari input pengguna.
- Batasi akses filesystem.
- Jangan expose port internal PM2.
- Gunakan audit log.
- Terapkan rotasi token.
- Jangan menyimpan password server dalam plaintext.
- Sediakan backup database dan prosedur pemulihan.
- Pastikan error response tidak membocorkan credential atau stack trace sensitif.

## 9. Deployment

Target deployment:

- Ubuntu Server.
- Node.js versi LTS yang kompatibel.
- PostgreSQL.
- PM2.
- Nginx.
- SSL menggunakan Certbot.
- GitHub Actions untuk CI/CD jika dibutuhkan.

Jangan menggunakan Docker.

Sediakan dokumentasi instalasi dan deployment yang mencakup:

1. Instalasi dependency.
2. Pembuatan database PostgreSQL.
3. Konfigurasi environment variables.
4. Prisma migration.
5. Build Next.js.
6. Konfigurasi PM2.
7. Konfigurasi Nginx.
8. Instalasi SSL.
9. Instalasi monitoring agent pada server yang dipantau.
10. Pengaturan scheduler dan background worker.
11. Backup database.
12. Troubleshooting dan rollback.

Jangan mengekspos port aplikasi Next.js atau PostgreSQL langsung ke internet jika tidak diperlukan.

## 10. Environment Variables

Sediakan `.env.example` tanpa credential asli.

Contoh konfigurasi:

DATABASE_URL=
AUTH_SECRET=
APP_BASE_URL=
BIZNET_API_BASE_URL=
BIZNET_API_KEY=
BIZNET_API_TIMEOUT_MS=10000
AGENT_INGEST_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

Gunakan secret terpisah untuk autentikasi agent dan integrasi eksternal. Jangan commit file `.env` ke Git.

## 11. Deliverables

Buat aplikasi secara bertahap dan hasilkan:

1. Dokumen arsitektur sistem.
2. ERD database.
3. Prisma schema.
4. Struktur direktori proyek.
5. UI dashboard.
6. Authentication dan authorization.
7. CRUD server dan website.
8. Monitoring agent.
9. API ingestion untuk metrik.
10. PM2 dan Nginx monitoring.
11. Biznet API integration.
12. Website dan SSL monitoring.
13. Alerting dan notifikasi.
14. Histori metrik dan grafik.
15. Background worker.
16. Unit test dan integration test.
17. `.env.example`.
18. Dokumentasi deployment Ubuntu tanpa Docker.
19. Dokumentasi API.
20. Panduan troubleshooting.

## 12. Implementation Rules

- Implementasikan secara bertahap dan pastikan setiap tahap dapat dijalankan.
- Jangan membuat tombol yang hanya bersifat dekoratif.
- Jangan menggunakan data dummy sebagai data monitoring produksi.
- Jika data belum tersedia, tampilkan empty state.
- Jangan mengarang respons atau endpoint API Biznet.
- Verifikasi dokumentasi resmi Biznet sebelum integrasi.
- Pisahkan komponen frontend, backend, agent, dan worker.
- Gunakan TypeScript secara konsisten.
- Hindari file yang terlalu besar dan duplikasi kode.
- Pastikan dashboard tetap responsif saat jumlah server dan histori meningkat.
- Buat README yang jelas untuk instalasi lokal dan deployment.
- Lakukan pengujian terhadap akses tidak sah, kegagalan agent, koneksi API timeout, dan server yang offline.

Mulai dengan merancang arsitektur, database schema, struktur direktori, dan alur pengiriman metrik. Setelah rancangan disetujui, implementasikan secara bertahap sampai aplikasi siap digunakan di production.
