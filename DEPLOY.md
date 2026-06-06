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

Instance → **Networking** → **IPv4 Firewall** — allow from **Anywhere** (`0.0.0.0/0`):

| Application | Port | Why |
|-------------|------|-----|
| **SSH** | 22 | GitHub Actions deploy (runners use random IPs) |
| **HTTP** | 80 | Site + Cloudflare (Flexible SSL) |

GitHub Actions cannot deploy if SSH (22) is restricted to your home IP only.

Attach a **static IP** in Lightsail so the public IP does not change; update `LIGHTSAIL_HOST` and Cloudflare DNS if it does.

### 5. Wait and test

Propagation often takes a few minutes up to an hour. Then open `https://aumchanting.com` and use **Join + Mic**.

LiveKit media uses `LIVEKIT_URL` from your API token (usually `wss://….livekit.cloud`), not your domain—no extra DNS for that if keys already work.

### Troubleshooting

- **404 on deploy curl**: private repos cannot use `raw.githubusercontent.com` without auth; deploy copies `docker-compose.yml` over SCP from the Actions checkout.
- **Too many redirects**: set SSL mode to **Flexible** (not Full) until origin has HTTPS.
- **Mic still blocked**: confirm the address bar shows `https://`, not `http://`.
## Instance freezes (SSH “try again later”, site dead until reboot)

Lightsail’s browser SSH shows that message when the VM is **overloaded or out of resources**, not only when AWS is down. If **reboot always fixes it**, the usual cause on a small instance is:

| Cause | Why reboot “fixes” it |
|--------|------------------------|
| **Out of memory (OOM)** | One container runs **nginx + Next.js + Express**. Next alone can use hundreds of MB; on a **512 MB / $5** plan the kernel kills processes or the box stops accepting SSH until reboot. |
| **Disk full** | Old Docker images/layers after many deploys → pulls fail, Docker misbehaves, logs can’t write. |
| **CPU pegged** | Less common; crash loop or traffic spike. |

This is **not** fixed by Cloudflare or Capacitor. Fix the VM size and steady-state resources.

### After the next reboot — confirm (SSH in, copy/paste)

```bash
free -h
df -h /
sudo dmesg -T | grep -iE 'oom|out of memory|killed process' | tail -20
sudo docker ps -a
sudo docker compose -f /opt/aumchanting/docker-compose.yml logs --tail=30
```

If `dmesg` shows **Out of memory** or **Killed process** → treat as OOM (steps below).

### Fixes (in order)

**1. Upsize Lightsail (most reliable)**  
Console → instance → **Change plan** → at least **$10 / 2 GB RAM** (1 GB is tight for Node + Next + Docker). Reattach the **same static IP** if prompted.

**2. Add swap (helps on 1 GB; not a substitute for RAM)**  
Run once on the server:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

**3. Prune Docker disk**  
After SSH works:

```bash
docker system df
docker image prune -af
docker system prune -f
df -h /
```

**4. Keep GitHub deploy green**  
A failed deploy can leave no healthy container; that looks like “no response” on `/health` but usually **SSH still works**. If SSH is dead too, suspect OOM/disk first.

**5. Optional: Lightsail alarm**  
Metrics → **CPU > 80%** or **Status check failed** → email you before the next hard freeze.

### Prevention checklist

- Static IP + **HTTP 80** open; `LIGHTSAIL_HOST` matches that IP.
- Don’t run other heavy services on the same micro instance.
- After upsizing + swap, `curl http://YOUR_IP/health` should return `{"ok":true}` without hanging.

---

## Site unreachable (`curl` fails / app times out)

Run these on your Mac. Replace `LIGHTSAIL_IP` with the value from GitHub secret `LIGHTSAIL_HOST` (Lightsail console → instance → public IP).

### A. DNS and HTTPS (domain layer)

```bash
dig +short aumchanting.com A
dig +short www.aumchanting.com A
```

Proxied Cloudflare often returns Cloudflare anycast IPs (not your Lightsail IP). That is OK if origin is healthy.

```bash
curl -sS -o /dev/null -w "https domain: HTTP %{http_code} in %{time_total}s\n" --max-time 20 https://aumchanting.com/
curl -sS -o /dev/null -w "http domain:  HTTP %{http_code} in %{time_total}s\n" --max-time 20 http://aumchanting.com/
```

### B. Origin (bypass Cloudflare)

```bash
curl -sS -o /dev/null -w "origin /health: HTTP %{http_code} in %{time_total}s\n" --max-time 10 http://LIGHTSAIL_IP/health
curl -sS -o /dev/null -w "origin /:        HTTP %{http_code} in %{time_total}s\n" --max-time 10 http://LIGHTSAIL_IP/
```

| Result | Likely fix |
|--------|------------|
| B works, A fails | **Cloudflare**: A record → correct Lightsail IP (static IP); SSL mode **Flexible**; not “Full” without origin HTTPS |
| B fails | **Lightsail/server**: firewall HTTP 80; container down; redeploy (sections C–D) |
| Both timeout | Wrong IP, instance stopped, or networking |

### C. GitHub Actions deploy

Repo → **Actions** → **Deploy** → latest run must be green.

Or with GitHub CLI:

```bash
gh run list --workflow=Deploy --limit 5
gh run view RUN_ID --log-failed
```

Redeploy after fixing secrets:

```bash
git commit --allow-empty -m "chore: redeploy" && git push origin main
```

Required repository secrets: `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, `LIGHTSAIL_SSH_PRIVATE_KEY`, `GHCR_READ_TOKEN`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.

### D. On the server (SSH)

Use Lightsail browser SSH or:

```bash
ssh -i /path/to/LightsailDefaultKey.pem ubuntu@LIGHTSAIL_IP
```

```bash
sudo docker ps -a
sudo docker compose -f /opt/aumchanting/docker-compose.yml ps
sudo docker compose -f /opt/aumchanting/docker-compose.yml logs --tail=80
curl -sS http://127.0.0.1/health
```

If the container is missing or exited:

```bash
cd /opt/aumchanting
cat .env   # should list LIVEKIT_* (values hidden); no empty keys
export GITHUB_REPOSITORY=YOUR_GITHUB_USER/aumchanting   # lowercase user/repo
echo "$GHCR_READ_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
docker compose pull
docker compose up -d --remove-orphans
```

(`GHCR_READ_TOKEN` is a GitHub PAT with `read:packages`; paste only on the server, do not commit.)

### E. Lightsail checklist (console)

1. Instance **Running**
2. **Static IP** attached; same IP in Cloudflare A record and `LIGHTSAIL_HOST`
3. **Networking** → IPv4: **SSH 22** and **HTTP 80** from `0.0.0.0/0`
4. After IP change: update Cloudflare DNS + GitHub `LIGHTSAIL_HOST`, then push `main`

