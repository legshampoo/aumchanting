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

Repo → **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**:

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

- **Missing secret**: workflow fails at "Check required secrets".
- **401 pulling image**: fix `GHCR_READ_TOKEN`.
- **SSH failed**: `LIGHTSAIL_SSH_PRIVATE_KEY`, IP, `authorized_keys`.
- **LiveKit errors**: update `LIVEKIT_*` repository secrets and re-run deploy.
- **Container logs** (only if debugging): `docker compose -f /opt/aumchanting/docker-compose.yml logs -f`

## HTTPS (optional)

Point a domain A-record at the Lightsail IP; add Caddy/Certbot or a load balancer later.
