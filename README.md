# aumchanting

LiveKit + Next.js monorepo.

## Local dev

```bash
pnpm install
cp services/api/.env.example services/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Fill `LIVEKIT_*` in `services/api/.env`, then:

```bash
pnpm --filter api dev
pnpm --filter web dev
```

## Production deploy

See [DEPLOY.md](./DEPLOY.md). Secrets live in **GitHub Actions**; each push to `main` deploys to Lightsail.

edit for push