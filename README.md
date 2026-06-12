# aumchanting

LiveKit + Next.js monorepo.

## Local dev

```bash
pnpm install
cp .env.example .env
```

Fill `LIVEKIT_*` in `.env` at the repo root, then:

```bash
pnpm dev
```

Opens the web app at http://localhost:3000 (API on :8787).

## Production deploy

See [DEPLOY.md](./DEPLOY.md). Secrets live in **GitHub Actions**; each push to `main` deploys to Lightsail.

## iOS / Android (Capacitor hybrid)

Native shell + WebView loads the deployed site. UI ships with your normal web deploy; rebuild the store app only for native changes. See [MOBILE.md](./MOBILE.md).