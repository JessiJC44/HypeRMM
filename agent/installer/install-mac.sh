#!/bin/bash

# HypeRemote Agent Installer for macOS
# Usage: curl -sSL https://get.hyperemote.com/install-mac.sh | bash -s -- --user-id "xxx" --name "My-Mac"

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}  HypeRemote Agent Installer (macOS)${NC}"
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
    exit 1
fi

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    AGENT_URL="https://github.com/YOUR_REPO/releases/latest/download/hyperemote-agent-darwin-arm64"
else
    AGENT_URL="https://github.com/YOUR_REPO/releases/latest/download/hyperemote-agent-darwin-amd64"
fi

# Variables
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="$HOME/.config/hyperemote"
PLIST_PATH="$HOME/Library/LaunchAgents/com.hyperemote.agent.plist"

# Create directories
echo -e "${YELLOW}[1/5] Creating directories...${NC}"
mkdir -p "$CONFIG_DIR"
mkdir -p "$HOME/Library/LaunchAgents"

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

# Create LaunchAgent
echo -e "${YELLOW}[4/5] Creating LaunchAgent...${NC}"
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.hyperemote.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>$INSTALL_DIR/hyperemote-agent</string>
        <string>$USER_ID</string>
        <string>$DEVICE_NAME</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

# Load agent
launchctl load "$PLIST_PATH"

# Verify
echo -e "${YELLOW}[5/5] Verifying installation...${NC}"
sleep 3
if launchctl list | grep -q "com.hyperemote.agent"; then
    echo ""
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}  Installation Complete!${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo ""
    echo "Device Name: $DEVICE_NAME"
    echo "User ID: $USER_ID"
    echo -e "Status: ${GREEN}Running${NC}"
else
    echo -e "${RED}Agent may not be running. Check Console.app for errors.${NC}"
fi
