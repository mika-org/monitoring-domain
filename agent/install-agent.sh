#!/usr/bin/env bash

# VioreCert Server Monitoring Agent Auto-Installer for Ubuntu
set -e

DASHBOARD_URL=""
AGENT_TOKEN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --hub|-h)
      DASHBOARD_URL="$2"
      shift 2
      ;;
    --token|-t)
      AGENT_TOKEN="$2"
      shift 2
      ;;
    *)
      if [ -z "$DASHBOARD_URL" ]; then
        DASHBOARD_URL="$1"
      elif [ -z "$AGENT_TOKEN" ]; then
        AGENT_TOKEN="$1"
      fi
      shift
      ;;
  esac
done

if [ -z "$DASHBOARD_URL" ] || [ -z "$AGENT_TOKEN" ]; then
  echo "Usage:"
  echo "  sudo bash install-agent.sh <DASHBOARD_URL> <AGENT_TOKEN>"
  echo "  sudo bash install-agent.sh --hub <DASHBOARD_URL> --token <AGENT_TOKEN>"
  exit 1
fi

echo "=========================================================="
echo "  Installing VioreCert Server Monitoring Agent..."
echo "  Target Hub: $DASHBOARD_URL"
echo "  HTTP Port:  3010"
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
# Fetch latest script from dashboard hub
curl -fsSL "$DASHBOARD_URL/agent/server-agent.js" -o "$INSTALL_DIR/server-agent.js" || true

if [ ! -s "$INSTALL_DIR/server-agent.js" ]; then
  echo "Warning: Could not fetch server-agent.js from $DASHBOARD_URL/agent/server-agent.js. Please check network/URL."
fi

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
Environment="VIORECERT_INTERVAL=15"
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
echo "  VioreCert Agent successfully installed and running on port 3010!"
echo "  Local Health Check: curl http://localhost:3010/health"
echo "  Service Status:     sudo systemctl status viorecert-agent"
echo "  Live Logs:          sudo journalctl -u viorecert-agent -f"
echo "=========================================================="
