# Deploy to AWS Lightsail (GitHub Actions)

Push to `main` builds a Docker image, pushes to GitHub Container Registry (GHCR), and SSHs into your Lightsail box to pull and restart.

## Architecture

- One container: nginx on port 80 → Next.js (3000) + Express API (8787)
- Browser calls `/token` on the same host (`NEXT_PUBLIC_API_BASE_URL` is empty in production builds)

## 1. Lightsail networking

In the Lightsail console → your instance → **Networking**:

- Open **HTTP (80)** (and **443** later if you add TLS)

Copy the **public IP** — you will use it as `LIGHTSAIL_HOST`.

## 2. SSH key for GitHub Actions

On your Mac, create a deploy key (no passphrase is easiest for CI):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/aumchanting-deploy -N ""
```

Add the **public** key to the server:

```bash
ssh -i ~/.ssh/LIGHTSAIL_DEFAULT_KEY ubuntu@YOUR_LIGHTSAIL_IP
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the contents of ~/.ssh/aumchanting-deploy.pub on its own line, save.
```

(`LIGHTSAIL_DEFAULT_KEY` = the key you downloaded when creating the instance.)

## 3. One-time server setup

SSH in as `ubuntu` and install Docker + app directory.

**Option A** — after this repo is on GitHub `main`, with deploy files pushed:

```bash
export GITHUB_REPOSITORY=YOUR_GITHUB_USER/aumchanting
curl -fsSL "https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/scripts/lightsail-bootstrap.sh" | bash
```

**Option B** — manual copy: install Docker (see `scripts/lightsail-bootstrap.sh`), then:

```bash
sudo mkdir -p /opt/aumchanting
sudo chown ubuntu:ubuntu /opt/aumchanting
# Copy deploy/docker-compose.yml and deploy/env.example to /opt/aumchanting/
nano /opt/aumchanting/.env
```

Required in `/opt/aumchanting/.env`:

```env
GITHUB_REPOSITORY=your-user/aumchanting
PORT=8787
LIVEKIT_URL=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

Log out and back in so the `docker` group applies.

## 4. GitHub PAT for pulling images on the server

Private repos produce private GHCR images. Create a **classic** PAT:

- Scope: `read:packages` (and `repo` if the package is private)

Add it as repo secret **`GHCR_READ_TOKEN`**.

## 5. GitHub Actions secrets

Repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Value |
|--------|--------|
| `LIGHTSAIL_HOST` | Public IP |
| `LIGHTSAIL_USER` | `ubuntu` |
| `LIGHTSAIL_SSH_PRIVATE_KEY` | Full contents of `~/.ssh/aumchanting-deploy` (private key) |
| `GHCR_READ_TOKEN` | PAT from step 4 |

`GITHUB_TOKEN` is provided automatically for pushing the image to GHCR.

## 6. Push to deploy

```bash
git add .
git commit -m "Add Lightsail deploy pipeline"
git push origin main
```

Watch **Actions** → **Deploy**. When green, open `http://YOUR_LIGHTSAIL_IP`.

## Note on Node version

The Docker image uses **Node 22** because **pnpm 11** requires Node ≥ 22.13. Local dev can use Node 20 with an older pnpm, or match Node 22 via `nvm`.

## Troubleshooting

- **401 pulling image**: `GHCR_READ_TOKEN` wrong or missing `read:packages`.
- **SSH failed**: check `LIGHTSAIL_SSH_PRIVATE_KEY`, IP, and `authorized_keys` on the server.
- **502 / empty page**: `docker logs` on the server: `docker compose -f /opt/aumchanting/docker-compose.yml logs -f`
- **LiveKit errors**: verify `/opt/aumchanting/.env` on the server.

## HTTPS (optional later)

Point a domain A-record at the Lightsail IP, then add Caddy or Certbot in front of nginx, or terminate TLS in Lightsail’s load balancer.
