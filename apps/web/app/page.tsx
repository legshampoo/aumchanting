"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createLocalAudioTrack,
  type RemoteParticipant,
  Room,
  RoomEvent,
  type LocalAudioTrack,
  type Participant,
  Track,
} from "livekit-client";

type TokenResponse = {
  url: string;
  token: string;
  room: string;
  identity: string;
  name: string;
};

export default function Home() {
  const apiBase = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (configured !== undefined) return configured;
    return "http://localhost:8787";
  }, []);

  const [status, setStatus] = useState<
    "idle" | "joining" | "joined" | "leaving" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [room] = useState(() => new Room());
  const [participants, setParticipants] = useState<number>(0);
  const [micEnabled, setMicEnabled] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [activeSpeakerCount, setActiveSpeakerCount] = useState<number>(0);
  const [micAvailable, setMicAvailable] = useState(false);
  const audioElsByTrackSid = useRef(new Map<string, HTMLMediaElement>());
  const audioBinRef = useRef<HTMLDivElement | null>(null);
  const localMicTrackRef = useRef<LocalAudioTrack | null>(null);
  const micLevelRafRef = useRef<number | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    setMicAvailable(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia,
    );
  }, []);

  useEffect(() => {
    function syncParticipants() {
      setParticipants(1 + room.remoteParticipants.size);
    }

    syncParticipants();

    room
      .on(RoomEvent.ParticipantConnected, syncParticipants)
      .on(RoomEvent.ParticipantDisconnected, syncParticipants)
      .on(RoomEvent.Connected, syncParticipants)
      .on(RoomEvent.Disconnected, syncParticipants);

    return () => {
      room
        .off(RoomEvent.ParticipantConnected, syncParticipants)
        .off(RoomEvent.ParticipantDisconnected, syncParticipants)
        .off(RoomEvent.Connected, syncParticipants)
        .off(RoomEvent.Disconnected, syncParticipants);
    };
  }, [room]);

  useEffect(() => {
    function onActiveSpeakersChanged(speakers: Participant[]) {
      const others = speakers.filter(
        (p) => p.identity !== room.localParticipant.identity,
      );
      setActiveSpeakerCount(others.length);
    }

    room.on(RoomEvent.ActiveSpeakersChanged, onActiveSpeakersChanged);
    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, onActiveSpeakersChanged);
    };
  }, [room]);

  function stopMicMeter() {
    if (micLevelRafRef.current) {
      cancelAnimationFrame(micLevelRafRef.current);
      micLevelRafRef.current = null;
    }
    micAnalyserRef.current = null;
    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close().catch(() => {});
      micAudioCtxRef.current = null;
    }
    setMicLevel(0);
  }

  function startMicMeter(track: LocalAudioTrack) {
    stopMicMeter();

    const mediaStreamTrack = track.mediaStreamTrack;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;

    const src = ctx.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
    src.connect(analyser);

    micAudioCtxRef.current = ctx;
    micAnalyserRef.current = analyser;

    const data = new Uint8Array(analyser.fftSize);

    const tick = () => {
      const a = micAnalyserRef.current;
      if (!a) return;

      a.getByteTimeDomainData(data);
      let sumSq = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i]! - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / data.length); // 0..~1
      // Smooth a little to avoid jitter.
      setMicLevel((prev) => prev * 0.85 + rms * 0.15);
      micLevelRafRef.current = requestAnimationFrame(tick);
    };

    micLevelRafRef.current = requestAnimationFrame(tick);
  }

  function attachRemoteAudio(track: Track) {
    if (track.kind !== Track.Kind.Audio) return;
    if (!audioBinRef.current) return;

    const key = track.sid ?? track.mediaStreamTrack.id;
    if (audioElsByTrackSid.current.has(key)) return;

    const el = track.attach();
    el.autoplay = true;
    // iOS/Safari sometimes needs explicit unmute.
    // Note: audio playback still requires a user gesture; clicking Join satisfies that.
    const mediaEl = el as HTMLMediaElement;
    mediaEl.muted = false;
    // playsinline is most relevant for video, but setting the attribute is harmless.
    mediaEl.setAttribute("playsinline", "true");

    audioBinRef.current.appendChild(el);
    audioElsByTrackSid.current.set(key, el);

    void mediaEl.play().catch((err) => {
      console.warn("audio play() failed", err);
    });
  }

  function detachRemoteAudio(track: Track) {
    if (track.kind !== Track.Kind.Audio) return;
    const key = track.sid ?? track.mediaStreamTrack.id;
    const el = audioElsByTrackSid.current.get(key);
    if (!el) return;
    try {
      track.detach(el);
    } finally {
      el.remove();
      audioElsByTrackSid.current.delete(key);
    }
  }

  async function join(opts: { withMic: boolean }) {
    setStatus("joining");
    setError(null);
    try {
      const resp = await fetch(`${apiBase}/token`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ room: "globalAum", name: "Guest" }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `token request failed: ${resp.status}`);
      }
      const data = (await resp.json()) as TokenResponse;

      await room.connect(data.url, data.token);

      if (opts.withMic) {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Microphone needs HTTPS (or localhost). On HTTP use “Listen only”, or add TLS to your site.",
          );
        }
        // Mic only (avoid camera permission prompt).
        // Disable voice-style processing that can gate steady tones (aum).
        const micTrack = await createLocalAudioTrack({
          autoGainControl: false,
          noiseSuppression: false,
          // Echo cancellation can gate steady tones; prefer headphones for now.
          echoCancellation: false,
        });
        localMicTrackRef.current = micTrack;
        await room.localParticipant.publishTrack(micTrack);
        setMicEnabled(true);
        startMicMeter(micTrack);
      } else {
        setMicEnabled(false);
        stopMicMeter();
      }

      room.remoteParticipants.forEach((p: RemoteParticipant) => {
        p.getTrackPublications().forEach((pub) => {
          if (pub.kind === Track.Kind.Audio && pub.track) {
            attachRemoteAudio(pub.track);
          }
        });
      });

      room
        .on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
          // Don't play your own mic back (sidetone) — it feels like echo.
          if (participant.identity === room.localParticipant.identity) return;
          attachRemoteAudio(track);
        })
        .on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
          if (participant.identity === room.localParticipant.identity) return;
          detachRemoteAudio(track);
        });

      setStatus("joined");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function leave() {
    setStatus("leaving");
    setError(null);
    try {
      // Clean up any remote audio elements we created.
      audioElsByTrackSid.current.forEach((el) => el.remove());
      audioElsByTrackSid.current.clear();

      if (localMicTrackRef.current) {
        try {
          await room.localParticipant.unpublishTrack(localMicTrackRef.current);
        } finally {
          localMicTrackRef.current.stop();
          localMicTrackRef.current = null;
        }
      }
      stopMicMeter();

      await room.disconnect();
      setStatus("idle");
      setMicEnabled(false);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-2xl flex-col items-center justify-center gap-6 py-20 px-6 bg-white dark:bg-black">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            AUM Dome
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            24/7 chanting room (MVP)
          </p>
        </div>

        <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-sm">
          <div className="flex items-center justify-between">
            <div className="text-zinc-600 dark:text-zinc-400">Status</div>
            <div className="font-medium text-zinc-950 dark:text-zinc-50">
              {status}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-zinc-600 dark:text-zinc-400">Participants</div>
            <div className="font-medium text-zinc-950 dark:text-zinc-50">
              {participants}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-zinc-600 dark:text-zinc-400">Mic</div>
            <div className="font-medium text-zinc-950 dark:text-zinc-50">
              {micEnabled ? "on" : "off"}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="text-zinc-600 dark:text-zinc-400">Mic level</div>
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-950 dark:bg-zinc-50"
                  style={{
                    width: `${Math.min(100, Math.round(micLevel * 140))}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-zinc-600 dark:text-zinc-400">
              Active chanters
            </div>
            <div className="font-medium text-zinc-950 dark:text-zinc-50">
              {activeSpeakerCount}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-zinc-600 dark:text-zinc-400">API</div>
            <div className="font-mono text-xs text-zinc-950 dark:text-zinc-50">
              {apiBase}
            </div>
          </div>
          {error ? (
            <div className="mt-3 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2 text-red-700 dark:text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="h-11 rounded-full bg-zinc-950 px-6 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
            onClick={() => join({ withMic: true })}
            disabled={
              status === "joining" || status === "joined" || !micAvailable
            }
            title={
              micAvailable
                ? undefined
                : "Microphone requires HTTPS (not available on plain HTTP)"
            }
          >
            Join + Mic
          </button>
          <button
            className="h-11 rounded-full border border-zinc-200 px-6 text-zinc-950 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50"
            onClick={() => join({ withMic: false })}
            disabled={status === "joining" || status === "joined"}
          >
            Listen only
          </button>
          <button
            className="h-11 rounded-full border border-zinc-200 px-6 text-zinc-950 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50"
            onClick={leave}
            disabled={status !== "joined"}
          >
            Leave
          </button>
        </div>

        {/* Container for remote <audio> tags. Avoid display:none; it can break playback. */}
        <div
          ref={audioBinRef}
          className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden"
        />

        <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center max-w-md">
          {micAvailable
            ? "Tip: if you join with mic, use headphones to avoid feedback. If audio feels choppy, try “Listen only”."
            : "This site is on HTTP: use “Listen only” to hear the room. “Join + Mic” needs HTTPS (add a domain + TLS)."}
        </p>
      </main>
    </div>
  );
}
