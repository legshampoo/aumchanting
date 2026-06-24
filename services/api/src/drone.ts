import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import {
  AudioFrame,
  AudioSource,
  LocalAudioTrack,
  Room,
  RoomEvent,
  TrackPublishOptions,
  TrackSource,
} from '@livekit/rtc-node';
import { droneConfig } from './drone-config.js';

const {
  room: ROOM,
  identity: DRONE_IDENTITY,
  displayName: DRONE_NAME,
  tokenTtl: TOKEN_TTL,
  volume: DRONE_VOLUME,
  sampleRate: SAMPLE_RATE,
  channels: NUM_CHANNELS,
  frameSamples: FRAME_SAMPLES,
  queueMs: QUEUE_MS,
  fadeMs: FADE_MS,
  tone,
  pollMs: POLL_MS,
  joinGraceMs: JOIN_GRACE_MS,
  reconnectMs: RECONNECT_MS,
} = droneConfig;

const FRAME_MS = (FRAME_SAMPLES / SAMPLE_RATE) * 1000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function livekitApiHost(): string {
  const url = requireEnv('LIVEKIT_URL');
  return url.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
}

function roomService(): RoomServiceClient {
  return new RoomServiceClient(
    livekitApiHost(),
    requireEnv('LIVEKIT_API_KEY'),
    requireEnv('LIVEKIT_API_SECRET'),
  );
}

async function mintToken(): Promise<{ url: string; token: string }> {
  const url = requireEnv('LIVEKIT_URL');
  const apiKey = requireEnv('LIVEKIT_API_KEY');
  const apiSecret = requireEnv('LIVEKIT_API_SECRET');

  const at = new AccessToken(apiKey, apiSecret, {
    identity: DRONE_IDENTITY,
    name: DRONE_NAME,
    ttl: TOKEN_TTL,
  });
  at.addGrant({
    roomJoin: true,
    room: ROOM,
    canPublish: true,
    canSubscribe: true,
  });

  return { url, token: await at.toJwt() };
}

function fillOmFrame(out: Int16Array, phase: number, gain: number): number {
  const amp = DRONE_VOLUME * 32767 * gain;

  for (let i = 0; i < out.length; i++) {
    const t = (phase + i) / SAMPLE_RATE;
    let sample = 0;
    for (const partial of tone.partials) {
      sample += Math.sin(2 * Math.PI * partial.hz * t) * partial.mix;
    }
    out[i] = Math.round(Math.max(-1, Math.min(1, sample)) * amp);
  }

  return phase + out.length;
}

export type DroneStatus = {
  enabled: boolean;
  started: boolean;
  connected: boolean;
  connecting: boolean;
  lastError: string | null;
  lastHumanActivityAt: number | null;
};

export function getDroneStatus(): DroneStatus {
  if (startError) {
    return {
      enabled: droneConfig.enabled,
      started: false,
      connected: false,
      connecting: false,
      lastError: startError,
      lastHumanActivityAt: null,
    };
  }
  return (
    controller?.getStatus() ?? {
      enabled: droneConfig.enabled,
      started: false,
      connected: false,
      connecting: false,
      lastError: null,
      lastHumanActivityAt: null,
    }
  );
}

export function notifyHumanActivity(room: string = ROOM): void {
  if (!droneConfig.enabled || room !== ROOM) return;
  controller?.onHumanActivity();
}

let controller: DroneController | null = null;
let startError: string | null = null;

class DroneController {
  private readonly room = new Room();
  private readonly publishOptions = new TrackPublishOptions();

  private source: AudioSource | null = null;
  private track: LocalAudioTrack | null = null;

  private publishing = false;
  private connected = false;
  private connecting = false;
  private phase = 0;
  private pumpGeneration = 0;
  private gain = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastHumanActivityAt = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private syncing = false;
  private pendingSync = false;
  private started = false;
  private lastError: string | null = null;

  constructor() {
    this.publishOptions.source = TrackSource.SOURCE_UNKNOWN;

    this.room.on(RoomEvent.Disconnected, () => {
      console.warn('[drone] disconnected from LiveKit');
      this.connected = false;
      void this.stopAudio('disconnect');
      void this.sync();
    });
  }

  start(): void {
    this.started = true;
    this.pollTimer = setInterval(() => {
      void this.sync();
    }, POLL_MS);
    void this.sync();
    console.log(`[drone] idle — joins "${ROOM}" when humans are present`);
  }

  getStatus(): DroneStatus {
    return {
      enabled: droneConfig.enabled,
      started: this.started,
      connected: this.connected,
      connecting: this.connecting,
      lastError: this.lastError,
      lastHumanActivityAt:
        this.lastHumanActivityAt > 0 ? this.lastHumanActivityAt : null,
    };
  }

  onHumanActivity(): void {
    this.lastHumanActivityAt = Date.now();
    void this.sync();
  }

  private async countHumans(): Promise<number> {
    try {
      const participants = await roomService().listParticipants(ROOM);
      return participants.filter((p) => p.identity !== DRONE_IDENTITY).length;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('requested room does not exist')) {
        console.warn('[drone] listParticipants:', message);
      }
      return 0;
    }
  }

  private async clearStaleParticipant(): Promise<void> {
    try {
      await roomService().removeParticipant(ROOM, DRONE_IDENTITY);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('requested room does not exist')) {
        console.warn('[drone] removeParticipant:', message);
      }
    }
  }

  private async shouldBeConnected(): Promise<boolean> {
    const humans = await this.countHumans();
    if (humans > 0) return true;
    return Date.now() - this.lastHumanActivityAt < JOIN_GRACE_MS;
  }

  async sync(): Promise<void> {
    if (this.syncing) {
      this.pendingSync = true;
      return;
    }
    this.syncing = true;
    try {
      const wantConnected = await this.shouldBeConnected();
      if (wantConnected) {
        if (!this.connected && !this.connecting) {
          await this.connect();
        }
      } else if (this.connected) {
        await this.disconnect('room empty');
      }
    } finally {
      this.syncing = false;
      if (this.pendingSync) {
        this.pendingSync = false;
        void this.sync();
      }
    }
  }

  private createPublisher(): void {
    void this.disposePublisher();
    this.source = new AudioSource(SAMPLE_RATE, NUM_CHANNELS, QUEUE_MS);
    this.track = LocalAudioTrack.createAudioTrack('drone', this.source);
  }

  private async disposePublisher(): Promise<void> {
    this.pumpGeneration++;
    this.publishing = false;
    if (this.source) {
      await this.source.close().catch(() => {});
      this.source = null;
    }
    this.track = null;
  }

  private async pumpAudio(generation: number): Promise<void> {
    const source = this.source;
    if (!source) return;

    let nextFrameAt = performance.now();

    while (this.publishing && generation === this.pumpGeneration) {
      const now = performance.now();
      if (now < nextFrameAt) {
        await sleep(nextFrameAt - now);
      } else if (now - nextFrameAt > FRAME_MS * 3) {
        nextFrameAt = now;
      }

      const frame = new Int16Array(FRAME_SAMPLES);
      this.phase = fillOmFrame(frame, this.phase, this.gain);

      try {
        await source.captureFrame(
          new AudioFrame(frame, SAMPLE_RATE, NUM_CHANNELS, FRAME_SAMPLES),
        );
      } catch (err) {
        console.warn('[drone] captureFrame:', err);
      }

      nextFrameAt += FRAME_MS;
    }
  }

  private async rampGain(target: number): Promise<void> {
    const steps = Math.max(1, Math.round(FADE_MS / FRAME_MS));
    const start = this.gain;
    for (let i = 1; i <= steps; i++) {
      if (!this.publishing && target > start) return;
      this.gain = start + ((target - start) * i) / steps;
      await sleep(FRAME_MS);
    }
    this.gain = target;
  }

  private async stopAudio(_reason: string): Promise<void> {
    if (!this.publishing) {
      await this.disposePublisher();
      return;
    }

    await this.rampGain(0);
    this.publishing = false;
    this.pumpGeneration++;
    await sleep(FRAME_MS * 2);
    await this.disposePublisher();
  }

  private async connect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.connecting = true;
    try {
      await this.disposePublisher();
      this.createPublisher();
      await this.clearStaleParticipant();

      const { url, token } = await mintToken();
      await this.room.connect(url, token);
      this.connected = true;
      this.lastError = null;

      const local = this.room.localParticipant;
      const track = this.track;
      if (!local || !track) {
        throw new Error('No local participant or track after connect');
      }

      await local.publishTrack(track, this.publishOptions);

      this.pumpGeneration++;
      const generation = this.pumpGeneration;
      this.gain = 0;
      this.publishing = true;
      void this.pumpAudio(generation);
      void this.rampGain(1);

      console.log(`[drone] publishing ambient audio to "${ROOM}"`);
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      console.error('[drone] connect failed:', err);
      this.connected = false;
      await this.stopAudio('connect failed');
      if (await this.shouldBeConnected()) {
        this.scheduleReconnect();
      }
    } finally {
      this.connecting = false;
    }
  }

  private async disconnect(reason: string): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    await this.stopAudio(reason);

    if (this.connected) {
      await this.room.disconnect();
      this.connected = false;
      console.log(`[drone] left "${ROOM}" (${reason})`);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.sync();
    }, RECONNECT_MS);
  }
}

export function startDrone(): void {
  if (!droneConfig.enabled) return;
  try {
    controller = new DroneController();
    controller.start();
  } catch (err) {
    startError = err instanceof Error ? err.message : String(err);
    console.error('[drone] failed to start:', err);
  }
}
