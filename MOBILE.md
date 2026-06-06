# Mobile (Capacitor hybrid)

The iOS app is a **thin native shell** (permissions, App Store identity). The UI and client logic load from your **deployed website** in a WebView—same flow as production web: push to `main` → Lightsail → users get updates on next app open without an App Store release.

## Architecture

| Layer | Where | Updates |
|-------|--------|---------|
| UI, CSS, LiveKit client | `https://aumchanting.com` (WebView) | Git push → [DEPLOY.md](./DEPLOY.md) |
| Token API + LiveKit secrets | Lightsail / LiveKit cloud | Same as web |
| iOS shell | `apps/web/ios/` | App Store only when native config changes |

Default WebView URL is set in `apps/web/capacitor.config.ts` (`https://aumchanting.com`). Override with `CAPACITOR_SERVER_URL` for local testing.

## Prerequisites

- Mac with **Xcode**
- **Apple Developer** account (device + TestFlight + App Store)
- **pnpm** and repo dependencies (`pnpm install` from repo root)
- Production site working (`https://aumchanting.com`) for normal shell builds

## One-time setup

```bash
pnpm install
cd apps/web
pnpm exec cap sync ios
```

Open in Xcode:

```bash
pnpm --filter web cap:open:ios
```

In Xcode: select your **Team**, set **Bundle Identifier** if you change it from `com.aumchanting.app`, connect a **physical iPhone** (recommended for mic/WebRTC), then **Run**.

Microphone permission copy lives in `ios/App/App/Info.plist` (`NSMicrophoneUsageDescription`).

## Day-to-day workflow

**Web/UI changes** — no native rebuild required:

1. Change `apps/web` (or API) as usual.
2. Push to `main` and let GitHub Actions deploy.
3. Users open the app (or pull to refresh if you add that later); they load the latest site.

**Native shell changes** (new permission, Capacitor upgrade, bundle ID, icons) — rebuild and ship:

```bash
pnpm --filter web cap:sync:ios
pnpm --filter web cap:open:ios
# Archive → TestFlight / App Store
```

## Local dev against your machine

The simulator/device must reach your dev server (not `localhost` on a physical phone).

1. Run web + API as in [README.md](./README.md).
2. Use your LAN IP, e.g. `http://192.168.1.42:3000`, and point the API env at your machine (`NEXT_PUBLIC_API_BASE_URL` in the **deployed** build only applies to static builds; for remote URL dev the **site** you load must serve the right API—simplest path is test against production URL or run production-like nginx locally).

For a **shell** pointed at local Next:

```bash
CAPACITOR_SERVER_URL=http://192.168.1.42:3000 pnpm --filter web cap:sync:ios
pnpm --filter web cap:open:ios
```

`cleartext` is enabled automatically for `http://` URLs. Mic/WebRTC on HTTP may still be limited; **HTTPS production** is the reliable test for “Join + Mic”.

Unset `CAPACITOR_SERVER_URL` before App Store builds so the embedded config uses `https://aumchanting.com`.

## Performance note

The app uses the same **WKWebView** engine whether assets are bundled or loaded remotely. For a global live audio room you already need network; remote load adds a normal HTTPS page fetch, then behavior matches the website. Native shell overhead is negligible compared to LiveKit media.

## Android (later)

```bash
pnpm --filter web exec cap add android
# RECORD_AUDIO in AndroidManifest, same server.url hybrid model
pnpm --filter web cap:sync:android
```

## Troubleshooting

- **Blank WebView**: check device network; open `https://aumchanting.com` in Safari on the device.
- **Token / API errors**: site must call `/token` on the same origin as the loaded URL (production nginx proxies `/token` to the API).
- **Mic denied**: Settings → Aumchanting → Microphone; confirm plist string is present after `cap sync`.
- **Stale shell URL**: run `cap sync ios` after changing `capacitor.config.ts`; verify `ios/App/App/capacitor.config.json` shows the expected `server.url`.
