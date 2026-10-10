#!/usr/bin/env bash

# VioreCert Server Monitoring Agent Auto-Installer for Ubuntu
set -e

DASHBOARD_URL="$1"
AGENT_TOKEN="$2"

if [ -z "$DASHBOARD_URL" ] || [ -z "$AGENT_TOKEN" ]; then
  echo "Usage: sudo bash install-agent.sh <DASHBOARD_URL> <AGENT_TOKEN>"
  exit 1
fi

echo "=========================================================="
echo "  Installing VioreCert Server Monitoring Agent..."
echo "  Target: $DASHBOARD_URL"
echo "=========================================================="

# 1. Ensure Node.js is installed
if ! command -v node >/dev/null 2>&1; then
  echo "[1/4] Node.js not found. Installing Node.js LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[1/4] Node.js is already installed ($(node -v))."
fi

# 2. Setup agent directory
INSTALL_DIR="/opt/viorecert-agent"
sudo mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "[2/4] Downloading agent script..."
cat << 'EOF' > "$INSTALL_DIR/server-agent.js"
$(cat /opt/viorecert-agent/server-agent.js 2>/dev/null || true)
EOF

# Fetch latest script from dashboard if accessible
curl -fsSL "$DASHBOARD_URL/agent/server-agent.js" -o "$INSTALL_DIR/server-agent.js" || true

# 3. Create Systemd Service for Auto-start
echo "[3/4] Configuring systemd background service..."
cat << EOF | sudo tee /etc/systemd/system/viorecert-agent.service > /dev/null
[Unit]
Description=VioreCert Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment="VIORECERT_DASHBOARD_URL=$DASHBOARD_URL"
Environment="VIORECERT_AGENT_TOKEN=$AGENT_TOKEN"
Environment="VIORECERT_AGENT_PORT=3010"
Environment="VIORECERT_INTERVAL=30"
ExecStart=$(which node) $INSTALL_DIR/server-agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 4. Enable and start service
echo "[4/4] Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable viorecert-agent
sudo systemctl restart viorecert-agent

echo "=========================================================="
echo "  VioreCert Agent successfully installed and running!"
echo "  Check status: sudo systemctl status viorecert-agent"
echo "  Check logs:   sudo journalctl -u viorecert-agent -f"
echo "=========================================================="
