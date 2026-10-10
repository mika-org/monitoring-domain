# PANDUAN DEPLOYMENT UBUNTU PRODUCTION (TANPA DOCKER)

Dokumen ini menjelaskan langkah demi langkah untuk melakukan deployment **VioreCert Infrastructure Monitor** pada Ubuntu Server (20.04 / 22.04 / 24.04 LTS) menggunakan stack native: **Node.js, PostgreSQL, PM2, dan Nginx**.

---

## 1. Persiapan Server Ubuntu

Perbarui package dan instal dependency dasar:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw
```

Instal Node.js 20 LTS (NodeSource):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

## 2. Instalasi dan Konfigurasi PostgreSQL

Instal PostgreSQL:

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Buat database dan user khusus:

```bash
sudo -u postgres psql
```

Di dalam prompt PostgreSQL:

```sql
CREATE DATABASE monitoring_domain;
CREATE USER viorecert WITH ENCRYPTED PASSWORD 'PASSWORD_DATABASE_KUAT';
GRANT ALL PRIVILEGES ON DATABASE monitoring_domain TO viorecert;
\q
```

---

## 3. Clone Proyek dan Instalasi Dependency

```bash
cd /var/www
sudo git clone <URL_REPO_ANDA> viorecert
sudo chown -R $USER:$USER /var/www/viorecert
cd /var/www/viorecert
npm ci
```

---

## 4. Konfigurasi Environment Variable (`.env`)

Salin template configuration:

```bash
cp .env.example .env
nano .env
```

Isi variabel penting:
```env
DATABASE_URL="postgresql://viorecert:PASSWORD_DATABASE_KUAT@localhost:5432/monitoring_domain?schema=public"
JWT_SECRET="isi-dengan-string-acak-minimal-32-karakter-sangat-rahasia"
AUTH_SECRET="isi-dengan-string-acak-lainnya"
PORT=3001
APP_BASE_URL="https://monitor.domainanda.com"
NEXT_PUBLIC_APP_NAME="VioreCert Monitor"
NEXT_PUBLIC_APP_URL="https://monitor.domainanda.com"

# Integrasi Telegram (Opsional)
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
TELEGRAM_CHAT_ID="-1001234567890"

# Integrasi Biznet Cloud (Opsional)
BIZNET_API_KEY=""
```

---

## 5. Sinkronisasi Database dan Build Next.js

Jalankan migrasi schema Prisma dan lakukan build Next.js:

```bash
npx prisma db push
npm run build
```

Jalankan test integrasi untuk memverifikasi seluruh komponen:

```bash
npm run test:system
```

---

## 6. Jalankan Aplikasi Menggunakan PM2

Jalankan **Web Dashboard** dan **Background Scheduler Worker** langsung menggunakan perintah PM2:

```bash
# 1. Jalankan Next.js Web Dashboard pada port 3001
pm2 start npm --name "viorecert-web" -- start -- -p 3001

# 2. Jalankan Background Scheduler Worker
pm2 start worker/scheduler.js --name "viorecert-worker"

# 3. Simpan daftar proses PM2 agar aktif otomatis setelah reboot server
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
```

Periksa status dan log:
```bash
pm2 status
pm2 logs viorecert-web
pm2 logs viorecert-worker
```

---

## 7. Konfigurasi Nginx Reverse Proxy

Instal Nginx:
```bash
sudo apt install -y nginx
```

Buat virtual host Nginx:
```bash
sudo nano /etc/nginx/sites-available/viorecert.conf
```

Tambahkan konfigurasi berikut:

```nginx
server {
    server_name monitor.domainanda.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    client_max_body_size 10M;
}
```

Aktifkan konfigurasi dan reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/viorecert.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. Pasang SSL menggunakan Certbot (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d monitor.domainanda.com
```

Certbot akan otomatis memperbarui sertifikat SSL sebelum kedaluwarsa.

---

## 9. Pemasangan Agent pada Server Ubuntu yang Dipantau

Untuk setiap server Ubuntu yang ingin dipantau:
1. Buka dashboard VioreCert di browser (`https://monitor.domainanda.com/servers`).
2. Klik tombol **"+ Tambah Server"**.
3. Masukkan nama server, hostname, dan IP Address.
4. Klik **"Simpan & Generate Token"**.
5. Salin 1 baris perintah curl yang disediakan modal, lalu jalankan di terminal server target:

```bash
curl -sSL https://monitor.domainanda.com/agent/install-agent.sh | sudo bash -s -- --hub https://monitor.domainanda.com --token vcert_ag_xxxxxxxx
```

Agent akan otomatis terpasang sebagai service background systemd (`viorecert-agent.service`) dan mulai mengirimkan metrik setiap 10 detik.

---

## 10. Backup Database PostgreSQL Otomatis

Buat script backup harian:

```bash
sudo mkdir -p /var/backups/viorecert
sudo nano /usr/local/bin/backup-viorecert.sh
```

Isi script:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/viorecert"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/db_viorecert_$TIMESTAMP.sql.gz"

pg_dump -U viorecert -h localhost monitoring_domain | gzip > "$FILENAME"

# Hapus backup yang lebih tua dari 14 hari
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete
```

Beri izin eksekusi dan pasang di crontab:
```bash
sudo chmod +x /usr/local/bin/backup-viorecert.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-viorecert.sh >/dev/null 2>&1") | crontab -
```

---

## 11. Troubleshooting & Rollback

### A. Melihat Log PM2
```bash
pm2 logs viorecert-web
pm2 logs viorecert-worker
```

### B. Memeriksa Status Agent pada Server Target
```bash
sudo systemctl status viorecert-agent
sudo journalctl -u viorecert-agent -f
```

### C. Port Conflict
Jika port 3001 sudah digunakan layanan lain:
- Ubah `PORT=3002` di `.env`.
- Sesuaikan `proxy_pass http://127.0.0.1:3002;` di Nginx.
- Restart PM2: `pm2 restart viorecert-web`.

### D. Rollback ke Versi Sebelumnya
```bash
git checkout <commit-hash-sebelumnya>
npm ci
npm run build
pm2 restart viorecert-web
pm2 restart viorecert-worker
```
