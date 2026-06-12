import "dotenv/config";
import { AccessToken } from "livekit-server-sdk";
import { AudioFrame, AudioSource, LocalAudioTrack, Room, RoomEvent, TrackPublishOptions, TrackSource, } from "@livekit/rtc-node";
const SAMPLE_RATE = 48000;
const NUM_CHANNELS = 1;
const FRAME_SAMPLES = 480; // 10 ms @ 48 kHz
const QUEUE_SIZE = FRAME_SAMPLES * 20; // 200 ms buffer
const RECONNECT_MS = 5000;
const TOKEN_TTL = "10h";
const ROOM = process.env.DRONE_ROOM ?? "globalAum";
const DRONE_IDENTITY = "drone-bot";
function requireEnv(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing ${name}`);
    return value;
}
async function mintToken() {
    const url = requireEnv("LIVEKIT_URL");
    const apiKey = requireEnv("LIVEKIT_API_KEY");
    const apiSecret = requireEnv("LIVEKIT_API_SECRET");
    const at = new AccessToken(apiKey, apiSecret, {
        identity: DRONE_IDENTITY,
        name: "Ambient Om",
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
/** Soft multi-tone drone (~136 Hz + harmonics) — replace with a WAV via DRONE_AUDIO_PATH later. */
function fillOmFrame(out, phase) {
    const amp = 0.12 * 32767;
    const f1 = 136.1;
    const f2 = 272.2;
    const f3 = 204.15;
    for (let i = 0; i < out.length; i++) {
        const t = (phase + i) / SAMPLE_RATE;
        const sample = Math.sin(2 * Math.PI * f1 * t) * 0.5 +
            Math.sin(2 * Math.PI * f2 * t) * 0.25 +
            Math.sin(2 * Math.PI * f3 * t) * 0.25;
        out[i] = Math.round(sample * amp);
    }
    return phase + out.length;
}
async function main() {
    const room = new Room();
    const source = new AudioSource(SAMPLE_RATE, NUM_CHANNELS, QUEUE_SIZE);
    const track = LocalAudioTrack.createAudioTrack("drone", source);
    const publishOptions = new TrackPublishOptions();
    publishOptions.source = TrackSource.SOURCE_UNKNOWN;
    let publishing = false;
    let connected = false;
    let phase = 0;
    let reconnectTimer = null;
    async function pumpAudio() {
        const buffer = new Int16Array(FRAME_SAMPLES);
        while (publishing) {
            phase = fillOmFrame(buffer, phase);
            try {
                await source.captureFrame(new AudioFrame(buffer, SAMPLE_RATE, NUM_CHANNELS, FRAME_SAMPLES));
            }
            catch (err) {
                console.warn("[drone] captureFrame:", err);
            }
            await new Promise((r) => setTimeout(r, 10));
        }
    }
    async function connect() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        try {
            publishing = false;
            if (connected) {
                await room.disconnect();
                connected = false;
            }
            const { url, token } = await mintToken();
            await room.connect(url, token);
            connected = true;
            const local = room.localParticipant;
            if (!local) {
                throw new Error("No local participant after connect");
            }
            await local.publishTrack(track, publishOptions);
            publishing = true;
            void pumpAudio();
            console.log(`[drone] publishing ambient audio to room "${ROOM}"`);
        }
        catch (err) {
            console.error("[drone] connect failed:", err);
            connected = false;
            scheduleReconnect();
        }
    }
    function scheduleReconnect() {
        publishing = false;
        connected = false;
        if (reconnectTimer)
            return;
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            void connect();
        }, RECONNECT_MS);
    }
    room.on(RoomEvent.Disconnected, () => {
        console.warn("[drone] disconnected");
        scheduleReconnect();
    });
    process.on("SIGTERM", () => {
        publishing = false;
        void room.disconnect().finally(() => process.exit(0));
    });
    await connect();
}
main().catch((err) => {
    console.error("[drone] fatal:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map