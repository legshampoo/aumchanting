import { RoomServiceClient } from 'livekit-server-sdk';
import { droneConfig, isBotIdentity } from './drone-config.js';

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

function isPublishingAudio(participant: {
  tracks?: { type?: number; muted?: boolean; source?: number }[];
}): boolean {
  return (participant.tracks ?? []).some((track) => {
    if (track.muted) return false;
    // AUDIO = 0, MICROPHONE source = 1 in LiveKit protocol
    return track.type === 0 && (track.source === 1 || track.source === undefined);
  });
}

export async function evictDisabledDrone(): Promise<void> {
  if (droneConfig.enabled) return;
  try {
    await roomService().removeParticipant(ROOM, droneConfig.identity);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      !message.includes('requested room does not exist') &&
      !message.includes('participant not found')
    ) {
      console.warn('[room-stats] evict drone:', message);
    }
  }
}

export async function getRoomStats(): Promise<{
  listeners: number;
  chanters: number;
}> {
  const participants = await roomService().listParticipants(ROOM);

  if (
    !droneConfig.enabled &&
    participants.some((p) => isBotIdentity(p.identity))
  ) {
    await evictDisabledDrone();
    const refreshed = await roomService().listParticipants(ROOM);
    return countHumans(refreshed);
  }

  return countHumans(participants);
}

function countHumans(
  participants: Awaited<ReturnType<RoomServiceClient['listParticipants']>>,
) {
  const humans = participants.filter((p) => !isBotIdentity(p.identity));
  return {
    listeners: humans.length,
    chanters: humans.filter((p) => isPublishingAudio(p)).length,
  };
}
