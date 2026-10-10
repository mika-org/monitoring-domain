# VIORECERT API SPECIFICATION & REFERENCE

Dokumentasi endpoint API Route Handler Next.js pada VioreCert Infrastructure Monitor.

---

## 1. Agent Ingestion API (Machine-to-Machine)

Endpoint ini diakses secara periodik oleh monitoring agent pada setiap server target Ubuntu.

### A. Agent Heartbeat
Mengirim sinyal liveness agent untuk menandai server `ONLINE`.

- **Endpoint:** `POST /api/agent/heartbeat`
- **Headers:** `Authorization: Bearer <AGENT_TOKEN>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Heartbeat received",
  "server": "vps-elevore-prod",
  "status": "ONLINE",
  "timestamp": "2026-10-11T05:00:00.000Z"
}
```

### B. Agent Metrics Ingestion
Mengirim kumpulan metrik performa sistem, proses PM2, dan status Nginx.

- **Endpoint:** `POST /api/agent/metrics`
- **Headers:** `Authorization: Bearer <AGENT_TOKEN>`
- **Request Body:**
```json
{
  "metrics": {
    "cpuUsage": 14.2,
    "ramUsagePercent": 48.5,
    "ramTotalBytes": 8589934592,
    "ramUsedBytes": 4165681152,
    "ramAvailableBytes": 4424253440,
    "diskMounts": [
      {
        "filesystem": "/dev/sda1",
        "mount": "/",
        "total": "40G",
        "used": "18G",
        "available": "22G",
        "percent": 45
      }
    ],
    "netRxBytes": 104857600,
    "netTxBytes": 52428800,
    "loadAvg": [0.45, 0.38, 0.25],
    "processCount": 118,
    "uptimeSeconds": 1209600
  },
  "pm2Processes": [
    {
      "name": "elevore-frontend",
      "pmId": 0,
      "status": "ONLINE",
      "cpu": 0.8,
      "memory": 157286400,
      "restarts": 1,
      "uptime": 86400,
      "nodeVersion": "v20.18.0"
    }
  ],
  "nginx": {
    "status": "ACTIVE",
    "version": "1.24.0",
    "ports": [80, 443],
    "vhostsCount": 5
  }
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Metrics stored successfully",
  "timestamp": "2026-10-11T05:00:10.000Z"
}
```

---

## 2. Server Management API

### A. List Servers
- **Endpoint:** `GET /api/servers`
- **Otorisasi:** Admin / Viewer Session
- **Query Params:** `?page=1&limit=20`

### B. Tambah Server Baru & Buat Token
- **Endpoint:** `POST /api/servers`
- **Otorisasi:** Super Admin / Admin
- **Request Body:**
```json
{
  "name": "Production VPS 1",
  "hostname": "vps-prod-1.local",
  "ipAddress": "103.93.162.20"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "server": { "id": "...", "name": "Production VPS 1" },
  "agentToken": "vcert_ag_9f83e2...",
  "installCommand": "curl -sSL https://.../agent/install-agent.sh | sudo bash -s -- --hub ... --token vcert_ag_9f83e2..."
}
```
> **Catatan:** Token `agentToken` hanya ditampilkan sekali dan tidak pernah disimpan dalam format teks biasa di database.

### C. Server Metrics Time-Series
- **Endpoint:** `GET /api/servers/[id]/metrics?range=1h|6h|24h|7d|30d`
- **Response `200 OK`:**
```json
{
  "metrics": [
    {
      "time": "12:00",
      "cpu": 12.5,
      "ram": 45.2,
      "netRx": 1048576,
      "netTx": 524288
    }
  ]
}
```

---

## 3. Website Monitoring API

### A. List Websites
- **Endpoint:** `GET /api/websites`
- **Query Params:** `?page=1&limit=50`

### B. Tambah Website Baru (Protected with SSRF Validation)
- **Endpoint:** `POST /api/websites`
- **Request Body:**
```json
{
  "name": "Elevore Portal",
  "url": "https://elevore.web.id",
  "intervalSeconds": 60,
  "timeoutSeconds": 10
}
```
> URL akan divalidasi terhadap range IP internal untuk mencegah Server-Side Request Forgery.

---

## 4. PM2 & Nginx Monitoring API

- **Endpoint:** `GET /api/pm2/processes` (Menampilkan daftar agregat seluruh aplikasi PM2 di seluruh server).
- **Endpoint:** `GET /api/nginx/status` (Menampilkan status service Nginx dan port di seluruh server).

---

## 5. Incidents & Alert API

- **Endpoint:** `GET /api/alerts?status=TRIGGERED|RESOLVED`
- **Endpoint:** `PATCH /api/alerts/[id]`
  - Body: `{ "status": "RESOLVED" }` (Menandai insiden telah selesai ditangani).
- **Endpoint:** `POST /api/alerts/test-telegram` (Menguji pengiriman notifikasi instan ke Telegram Bot).

---

## 6. Biznet Cloud Integration API

- **Endpoint:** `GET /api/integrations/biznet` (Melihat status integrasi tanpa membocorkan API Key).
- **Endpoint:** `POST /api/integrations/biznet` (Menjalankan uji koneksi atau menyimpan API Key di server-side).
