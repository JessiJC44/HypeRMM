#!/bin/bash

# HypeRemote Agent Installer for Linux
# Usage: curl -sSL https://get.hyperemote.com/install.sh | sudo bash -s -- --user-id "xxx" --name "My-PC"

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}  HypeRemote Agent Installer${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# Parse arguments
USER_ID=""
DEVICE_NAME=$(hostname)

while [[ $# -gt 0 ]]; do
    case $1 in
        --user-id)
            USER_ID="$2"
            shift 2
            ;;
        --name)
            DEVICE_NAME="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

if [ -z "$USER_ID" ]; then
    echo -e "${RED}Error: --user-id is required${NC}"
    echo "Usage: $0 --user-id <user-id> [--name <device-name>]"
    exit 1
fi

# Variables
INSTALL_DIR="/opt/hyperemote"
CONFIG_DIR="/etc/hyperemote"
AGENT_URL="https://github.com/YOUR_REPO/releases/latest/download/hyperemote-agent-linux-amd64"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Create directories
echo -e "${YELLOW}[1/5] Creating directories...${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"

# Download agent
echo -e "${YELLOW}[2/5] Downloading HypeRemote Agent...${NC}"
curl -sSL "$AGENT_URL" -o "$INSTALL_DIR/hyperemote-agent"
chmod +x "$INSTALL_DIR/hyperemote-agent"

# Create config
echo -e "${YELLOW}[3/5] Creating configuration...${NC}"
cat > "$CONFIG_DIR/config.json" << EOF
{
  "user_id": "$USER_ID",
  "device_id": "",
  "flux_id": ""
}
EOF
chmod 600 "$CONFIG_DIR/config.json"

# Create systemd service
echo -e "${YELLOW}[4/5] Creating systemd service...${NC}"
cat > /etc/systemd/system/hyperemote-agent.service << EOF
[Unit]
Description=HypeRemote Remote Monitoring Agent
After=network.target

[Service]
Type=simple
ExecStart=$INSTALL_DIR/hyperemote-agent $USER_ID "$DEVICE_NAME"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable hyperemote-agent
systemctl start hyperemote-agent

# Verify
echo -e "${YELLOW}[5/5] Verifying installation...${NC}"
sleep 3
if systemctl is-active --quiet hyperemote-agent; then
    echo ""
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}  Installation Complete!${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo ""
    echo -e "Device Name: ${DEVICE_NAME}"
    echo -e "User ID: ${USER_ID}"
    echo -e "Status: ${GREEN}Running${NC}"
    echo ""
    echo "The device will appear in your HypeRemote dashboard shortly."
else
    echo -e "${RED}Service failed to start. Check: journalctl -u hyperemote-agent${NC}"
fi
