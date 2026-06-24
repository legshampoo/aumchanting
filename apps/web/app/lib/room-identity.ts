/** Keep in sync with services/api/src/drone-config.ts */
export const DRONE_IDENTITY = "drone-bot";
export const DRONE_ID_PREFIX = "drone";

export function isBotIdentity(identity: string | undefined): boolean {
  if (!identity) return false;
  return (
    identity === DRONE_IDENTITY || identity.startsWith(`${DRONE_ID_PREFIX}-`)
  );
}
