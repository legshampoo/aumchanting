# Deploy to AWS Lightsail (GitHub Actions)

Push to `main` builds a Docker image, writes production `.env` from GitHub secrets, and restarts the app on Lightsail. **No manual SSH editing** for app config after initial Docker setup.

## Architecture

- One container: nginx on port 80 → Next.js (3000) + Express API (8787)
- Production secrets: GitHub **repository secrets** → `/opt/aumchanting/.env` on each deploy
- Local dev: `services/api/.env` + `apps/web/.env.local` (never committed)

## Local development

```bash
pnpm install
cp services/api/.env.example services/api/.env
cp apps/web/.env.local.example apps/web/.env.local
# Fill LIVEKIT_* in services/api/.env
pnpm --filter api dev    # terminal 1
pnpm --filter web dev    # terminal 2
```

See `deploy/env.example` for variable names.

## One-time Lightsail setup (Docker only)

SSH in once to install Docker and open port 80, **or** run the bootstrap script:

```bash
export GITHUB_REPOSITORY=YOUR_GITHUB_USER/aumchanting
curl -fsSL "https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/scripts/lightsail-bootstrap.sh" | bash
```

Add the GitHub Actions deploy public key to `~/.ssh/authorized_keys` (see below). Log out and back in for the `docker` group.

Lightsail **Networking**: allow **HTTP (80)**.

## GitHub repository secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **Repository secrets** (not “Environment secrets” unless you also add `environment:` to the workflow):

| Secret | Purpose |
|--------|---------|
| `LIGHTSAIL_HOST` | Instance public IP |
| `LIGHTSAIL_USER` | `ubuntu` |
| `LIGHTSAIL_SSH_PRIVATE_KEY` | Deploy key private key |
| `GHCR_READ_TOKEN` | PAT with `read:packages` (+ `repo` if private) |
| `LIVEKIT_URL` | LiveKit server URL |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |

`GITHUB_TOKEN` is automatic (pushes image to GHCR).

To change production config: update secrets in GitHub, then push to `main` or re-run the **Deploy** workflow.

## Deploy SSH key (one-time on server)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/aumchanting-deploy -N ""
```

Add `aumchanting-deploy.pub` to the server's `~/.ssh/authorized_keys` (one line). Use the Lightsail `.pem` for this one SSH session if needed.

## Deploy

```bash
git push origin main
```

Open `http://YOUR_LIGHTSAIL_IP` when Actions is green.

## Note on Node version

Docker uses **Node 22** (required by pnpm 11 in the image build).

## Troubleshooting

- **Missing secret**: workflow lists names at “Check required secrets”. Add them under **Repository secrets** (exact names: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`). Environment-only secrets are invisible to this workflow.
- **401 pulling image**: fix `GHCR_READ_TOKEN`.
- **SSH failed**: `LIGHTSAIL_SSH_PRIVATE_KEY`, IP, `authorized_keys`.
- **LiveKit errors**: update `LIVEKIT_*` repository secrets and re-run deploy.
- **Container logs** (only if debugging): `docker compose -f /opt/aumchanting/docker-compose.yml logs -f`

## HTTPS + domain (Cloudflare + Lightsail)

Browsers require **HTTPS** for the microphone. With Cloudflare in front of Lightsail, visitors use `https://aumchanting.com` while the origin can stay on HTTP (port 80).

### 1. GoDaddy → Cloudflare nameservers

In **GoDaddy** → domain → **Nameservers** → use Cloudflare’s two nameservers (if not already). DNS is managed in Cloudflare, not GoDaddy records.

### 2. Cloudflare DNS

**DNS** → **Records**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | Your Lightsail **public IP** | Proxied (orange cloud) |
| A or CNAME | `www` | `@` or same IP | Proxied |

### 3. Cloudflare SSL/TLS

**SSL/TLS** → **Overview** → encryption mode **Flexible** (easiest while Lightsail only serves HTTP on port 80).

Also turn on **Always Use HTTPS** under **SSL/TLS** → **Edge Certificates**.

Later you can move to **Full (strict)** with a cert on the server (Caddy/Certbot).

### 4. Lightsail firewall

Instance → **Networking** → allow **HTTP (80)**. For Flexible SSL, Cloudflare talks to origin on port 80. (Add **443** when you terminate TLS on the box.)

### 5. Wait and test

Propagation often takes a few minutes up to an hour. Then open `https://aumchanting.com` and use **Join + Mic**.

LiveKit media uses `LIVEKIT_URL` from your API token (usually `wss://….livekit.cloud`), not your domain—no extra DNS for that if keys already work.

### Troubleshooting

- **522 / timeout**: wrong IP, firewall blocking 80, or container not running (`docker compose ps` on server).
- **Too many redirects**: set SSL mode to **Flexible** (not Full) until origin has HTTPS.
- **Mic still blocked**: confirm the address bar shows `https://`, not `http://`.
