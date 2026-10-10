# VIORECERT SERVER MONITORING ARCHITECTURE

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph TargetServers ["Managed Ubuntu Servers"]
        VPS1["Ubuntu VPS 1<br/>- PM2 Apps<br/>- Nginx"]
        Agent1["viorecert-agent.service<br/>(Lightweight Node.js)"]
        VPS1 --> Agent1
    end

    subgraph MonitoringHub ["VioreCert Production Hub (Ubuntu Server)"]
        NginxProxy["Nginx Reverse Proxy<br/>(SSL/TLS via Certbot)"]
        WebDash["Next.js App Router (Port 3001)<br/>- UI Dashboard<br/>- Recharts Metrics<br/>- Admin Session Auth"]
        Worker["Background Scheduler Worker<br/>- Website Checker (SSRF Safe)<br/>- Heartbeat Watchdog<br/>- Retention Cleaner"]
        DB[(PostgreSQL Database<br/>Prisma ORM)]
        PM2Hub["PM2 Process Manager<br/>- viorecert-web<br/>- viorecert-worker"]
    end

    subgraph External ["External Services"]
        BiznetAPI["Biznet Cloud API<br/>(Server-Side API Key)"]
        Telegram["Telegram Bot API<br/>(Instant Incident Alerts)"]
        PublicWebsites["Client Websites<br/>(Uptime & SSL Expiration)"]
    end

    Agent1 -->|"HTTPS POST /api/agent/metrics<br/>Bearer Token Auth (SHA-256)"| NginxProxy
    Agent1 -->|"HTTPS POST /api/agent/heartbeat"| NginxProxy
    NginxProxy --> WebDash
    WebDash --> DB
    Worker --> DB
    Worker --> PublicWebsites
    Worker --> Telegram
    WebDash --> BiznetAPI
    PM2Hub --> WebDash
    PM2Hub --> Worker
```

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o{ audit_logs : "creates"
    users {
        string id PK
        string username UK
        string email UK
        string password
        string name
        enum role "SUPER_ADMIN | ADMIN | VIEWER"
        datetime createdAt
    }

    servers ||--o{ server_agents : "has"
    servers ||--o{ server_metrics : "records"
    servers ||--o{ pm2_processes : "runs"
    servers ||--o{ nginx_services : "hosts"
    servers ||--o{ alerts : "triggers"
    servers {
        string id PK
        string name
        string hostname
        string ipAddress
        string os
        int cpuCores
        bigint totalRam
        bigint totalDisk
        enum status "ONLINE | OFFLINE | DEGRADED"
        datetime lastHeartbeat
    }

    server_agents {
        string id PK
        string serverId FK
        string tokenHash UK
        datetime lastSeenAt
        boolean isRevoked
    }

    server_metrics {
        string id PK
        string serverId FK
        float cpuUsage
        float ramUsagePercent
        json diskMounts
        bigint netRxBytes
        bigint netTxBytes
        json loadAvg
        datetime createdAt
    }

    websites ||--o{ website_checks : "measured"
    websites ||--o{ alerts : "triggers"
    websites {
        string id PK
        string name
        string url
        enum status "UP | DOWN | PENDING"
        int lastStatusCode
        int lastResponseTimeMs
        int sslDaysRemaining
        datetime lastCheckedAt
    }

    alerts {
        string id PK
        string serverId FK
        string websiteId FK
        string type
        enum severity "INFO | WARNING | CRITICAL"
        string message
        enum status "TRIGGERED | ACKNOWLEDGED | RESOLVED"
        datetime resolvedAt
    }

    notification_channels ||--o{ notification_logs : "sends"
    notification_channels {
        string id PK
        string name
        enum type "TELEGRAM | EMAIL | WEBHOOK"
        json config
        boolean isEnabled
    }
```

---

## 3. Security & Ingestion Architecture

1. **Machine-to-Machine Authentication:**
   - When a server is added via Dashboard, a high-entropy registration token `vcert_ag_<hex>` is issued once.
   - The database stores strictly `SHA-256(token)`. Plaintext tokens are never stored.
   - Every agent payload includes `Authorization: Bearer vcert_ag_...`.
   - The API verifies hashes in constant time to prevent timing attacks.

2. **SSRF Mitigation:**
   - Any website added for monitoring undergoes DNS and IP range validation.
   - Private IP blocks (`127.0.0.1`, `localhost`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`) and non-HTTP protocols (`file://`, `ftp://`, `gopher://`) are strictly blocked.

3. **Biznet Cloud Isolation:**
   - Biznet credentials (`BIZNET_API_KEY`) reside exclusively in server-side environment variables.
   - Keys are never reflected back in API responses, browser local storage, or audit logs.

4. **Alert Cooldown & Deduplication:**
   - Alerts of the same type for a given server or website are subject to a 15-minute cooldown window to prevent notification floods.
   - Resolved alerts generate clear audit trails.
