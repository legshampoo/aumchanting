#!/bin/bash
# Run once on the Lightsail instance (as ubuntu), after SSH in:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/aumchanting/main/scripts/lightsail-bootstrap.sh | bash
# Or copy/paste sections manually.

set -euo pipefail

GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-}"

if [ -z "$GITHUB_REPOSITORY" ]; then
  echo "Set your GitHub repo (owner/name), e.g. youarmy/aumchanting"
  read -r -p "GITHUB_REPOSITORY: " GITHUB_REPOSITORY
fi

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg

# Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"

sudo mkdir -p /opt/aumchanting
sudo chown "$USER:$USER" /opt/aumchanting

curl -fsSL "https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/deploy/docker-compose.yml" \
  -o /opt/aumchanting/docker-compose.yml
echo ""
echo "Bootstrap done. Next:"
echo "  1) Add LIVEKIT_* and deploy secrets in GitHub (see DEPLOY.md)"
echo "  2) Log out and back in (docker group), or run: newgrp docker"
echo "  3) Open Lightsail firewall: HTTP (80), HTTPS (443) if you add TLS later"
echo "  4) Add GitHub Actions secrets (see DEPLOY.md)"
echo "  5) Push to main to deploy"
