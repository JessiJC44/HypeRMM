#!/bin/bash
echo "[FLUX] Starting Mock Agent..."
# For this demo environment, we assume node is installed.
node "$(dirname "$0")/mock-agent.js" "$@"
