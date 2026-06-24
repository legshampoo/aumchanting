import { RoomServiceClient } from 'livekit-server-sdk';
import { droneConfig } from './drone-config.js';

const ROOM = droneConfig.room;

function livekitApiHost(): string {
  const url = process.env.LIVEKIT_URL;
  if (!url) throw new Error('Missing LIVEKIT_URL');
  return url.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
}

function roomService(): RoomServiceClient {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error('Missing LIVEKIT_API_KEY / LIVEKIT_API_SECRET');
  }
  return new RoomServiceClient(livekitApiHost(), apiKey, apiSecret);
}

function isDroneIdentity(identity: string): boolean {
  return (
    identity === droneConfig.identity ||
    identity.startsWith(`${droneConfig.reservedIdPrefix}-`)
  );
}

export async function getRoomStats(): Promise<{
  listeners: number;
  chanters: number;
}> {
  const participants = await roomService().listParticipants(ROOM);
  const humans = participants.filter((p) => !isDroneIdentity(p.identity));

  const listeners = humans.length;
  const chanters = humans.filter((p) =>
    (p.tracks ?? []).some((track) => track.type === 0 && !track.muted),
  ).length;

  return { listeners, chanters };
}
