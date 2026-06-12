import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type { CapacitorConfig } from "@capacitor/cli";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

/**
 * Hybrid shell: native iOS/Android wrapper loads the deployed web app.
 * UI updates ship via your normal web deploy (push to main → Lightsail).
 * Rebuild the store app only when native permissions, plugins, or shell config change.
 *
 * Local override (simulator / device on LAN):
 *   CAPACITOR_SERVER_URL=http://192.168.x.x:3000 pnpm --filter web cap:sync:ios
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "https://aumchanting.com";

const config: CapacitorConfig = {
  appId: "com.aumchanting.app",
  appName: "Aumchanting",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
};

export default config;
