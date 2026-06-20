# Aumchanting

A living global OM chanting circle. Join from a browser or mobile app to listen quietly, chant with your microphone, or simply be present in a continuous shared room with people around the world.

**Live site:** [https://aumchanting.com](https://aumchanting.com)

**Mobile:** iOS and Android apps are Capacitor shells that load the live site in a WebView. iOS is available via TestFlight / App Store; Android is in closed beta via [Google Groups testers](https://groups.google.com/g/aum-chanting-app-testers).

## Stack

Monorepo: **Next.js** web app (`apps/web`), **Express** API + LiveKit drone bot (`services/api`), real-time audio via **LiveKit**.

## Run locally

```bash
pnpm install
cp .env.example .env
```

Add your `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` to `.env` at the repo root, then:

```bash
pnpm dev
```

- Web: http://localhost:3000  
- API: http://localhost:8787  

Use headphones when testing mic to avoid feedback. HTTPS is required for microphone access in production; local HTTP is fine for dev.

## Deploy

Production runs on **AWS Lightsail** in Docker (nginx → Next.js + API). Pushing to `main` triggers **GitHub Actions**, which builds the image, writes secrets from GitHub repository secrets, and restarts the container.

```bash
git push origin main
```

Full setup (Lightsail bootstrap, GitHub secrets, Cloudflare HTTPS, troubleshooting): **[DEPLOY.md](./DEPLOY.md)**

## Mobile development

Native shells live under `apps/web/ios` and `apps/web/android`. UI updates ship with the normal web deploy; rebuild and resubmit to the stores only for native changes (permissions, plugins, bundle ID).

See **[MOBILE.md](./MOBILE.md)** for Xcode/Android Studio workflow and local device testing.
