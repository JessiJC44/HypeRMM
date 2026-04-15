#!/bin/bash

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose
sudo apt-get install -y docker-compose

# Create data directory
mkdir -p data

# Start Flux server
docker-compose up -d

echo "Flux server started!"
echo "Ports: 21115, 21116, 21117, 21118"
echo ""
echo "Public key (for clients):"
cat data/id_ed25519.pub
