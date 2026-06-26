"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ConnectionState,
  LocalAudioTrack,
  Room,
  RoomEvent,
  type Participant,
  Track,
} from "livekit-client";
import {
  buildAudioCaptureOptions,
  buildRoomOptions,
} from "../lib/audio-livekit";
import {
  loadAudioPreferences,
  saveAudioPreferences,
} from "../lib/audio-preferences";
import { RoomAudioSession } from "../lib/room-audio-session";
import { isBotIdentity } from "../lib/room-identity";
import { audioConfig, type AudioPreferences } from "../audio-config";

function isIOSDevice() {
  return (
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

function rmsToMeterLevel(rms: number) {
  return Math.min(1, Math.log10(1 + rms * 800) / Math.log10(1 + 800));
}

type TokenResponse = {
  url: string;
  token: string;
  room: string;
  identity: string;
  name: string;
};

type AudioHandle = {
  track: Track;
  el: HTMLMediaElement;
};

export type RoomStatus = "idle" | "joining" | "joined" | "leaving" | "error";

export function useGlobalAumRoom() {
  const apiBase = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (configured !== undefined) return configured;
    return "http://localhost:8787";
  }, []);

  const [roomGeneration, setRoomGeneration] = useState(0);
  const room = useMemo(() => new Room(buildRoomOptions()), [roomGeneration]);

  const [status, setStatus] = useState<RoomStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [activeSpeakerCount, setActiveSpeakerCount] = useState(0);
  const [micAvailable, setMicAvailable] = useState(false);
  const [localMicTrack, setLocalMicTrack] = useState<MediaStreamTrack | null>(
    null,
  );
  const [audioPreferences, setAudioPreferences] = useState<AudioPreferences>(
    () => loadAudioPreferences(),
  );

  const audioBinRef = useRef<HTMLDivElement | null>(null);
  const audioBySid = useRef(new Map<string, AudioHandle>());
  const audioPreferencesRef = useRef(audioPreferences);
  const localMicTrackRef = useRef<LocalAudioTrack | null>(null);
  const rawMicStreamRef = useRef<MediaStream | null>(null);
  const localMicMonitorRef = useRef<{
    track: LocalAudioTrack;
    el: HTMLMediaElement;
  } | null>(null);
  const audioSessionRef = useRef(new RoomAudioSession());
  const waveformAnalyserRef = useRef<AnalyserNode | null>(null);
  const micLevelRafRef = useRef<number | null>(null);

  const isJoined = status === "joined";

  useEffect(() => {
    audioPreferencesRef.current = audioPreferences;
  }, [audioPreferences]);

  useEffect(() => {
    setMicAvailable(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia,
    );
  }, []);

  /** Master volume controls the entire playback stream: remote chanters + your own monitor. */
  function applyMasterVolume(volume: number) {
    for (const { el } of audioBySid.current.values()) {
      el.volume = volume;
    }
    const monitor = localMicMonitorRef.current?.el;
    if (monitor) monitor.volume = volume;
  }

  function updateAudioPreferences(
    patch: Partial<AudioPreferences>,
    options?: { persist?: boolean },
  ) {
    setAudioPreferences((current) => {
      const next = { ...current, ...patch };
      audioPreferencesRef.current = next;
      if (options?.persist !== false) {
        saveAudioPreferences(next);
      }
      return next;
    });
  }

  function setMasterVolume(volume: number) {
    const clamped = Math.min(1, Math.max(0, volume));
    updateAudioPreferences({ masterVolume: clamped });
    applyMasterVolume(clamped);
  }

  function setMicGain(gain: number) {
    const clamped = Math.min(audioConfig.mic.maxGain, Math.max(0, gain));
    updateAudioPreferences({ micGain: clamped });
    audioSessionRef.current.setMicGain(clamped);
  }

  async function acquireRawMic(
    prefs: AudioPreferences = audioPreferencesRef.current,
  ): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Microphone needs HTTPS (or localhost). Add TLS to your site to chant.",
      );
    }
    return navigator.mediaDevices.getUserMedia({
      audio: buildAudioCaptureOptions(isIOSDevice(), prefs),
    });
  }

  /** Wraps the raw mic in the gain + noise-gate chain (falls back to raw on failure). */
  function processedMicTrack(rawStream: MediaStream): MediaStreamTrack {
    const rawTrack = rawStream.getAudioTracks()[0];
    if (!rawTrack) throw new Error("No microphone track available");
    const processed = audioSessionRef.current.buildMicChain(
      rawTrack,
      audioPreferencesRef.current.micGain,
      audioPreferencesRef.current.noiseSuppression,
    );
    return processed ?? rawTrack;
  }

  async function enableMic() {
    if (localMicTrackRef.current) return;

    const rawStream = await acquireRawMic();
    rawMicStreamRef.current = rawStream;

    const micTrack = new LocalAudioTrack(
      processedMicTrack(rawStream),
      undefined,
      true,
    );
    localMicTrackRef.current = micTrack;
    setLocalMicTrack(micTrack.mediaStreamTrack);

    await room.localParticipant.publishTrack(micTrack);
    setMicEnabled(true);
    attachLocalMonitor(micTrack);
    startMicMeter();
  }

  async function disableMic() {
    stopMicMeter();
    detachLocalMonitor();

    const micTrack = localMicTrackRef.current;
    if (micTrack) {
      try {
        await room.localParticipant.unpublishTrack(micTrack);
      } finally {
        micTrack.stop();
      }
    }
    localMicTrackRef.current = null;

    audioSessionRef.current.teardownMicChain();
    rawMicStreamRef.current?.getTracks().forEach((t) => t.stop());
    rawMicStreamRef.current = null;

    setLocalMicTrack(null);
    setMicEnabled(false);
  }

  async function toggleMic(enabled: boolean) {
    setError(null);
    try {
      if (enabled) {
        await enableMic();
      } else {
        await disableMic();
      }
    } catch (e) {
      await disableMic().catch(() => {});
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /**
   * "Noise reduction" is our own Web Audio noise gate (not the browser's
   * speech noiseSuppression, which ducks sustained tones). Toggling it is live —
   * no mic re-capture or track swap needed.
   */
  function setNoiseSuppression(enabled: boolean) {
    updateAudioPreferences({ noiseSuppression: enabled });
    audioSessionRef.current.setNoiseGate(enabled);
  }

  function attachRemoteAudio(track: Track) {
    if (track.kind !== Track.Kind.Audio || !track.sid || !audioBinRef.current) {
      return;
    }
    if (audioBySid.current.has(track.sid)) return;

    const el = track.attach() as HTMLMediaElement;
    el.autoplay = true;
    el.setAttribute("playsinline", "true");
    el.volume = audioPreferencesRef.current.masterVolume;
    audioBinRef.current.appendChild(el);
    audioBySid.current.set(track.sid, { track, el });

    const sid = track.sid;
    audioSessionRef.current.addRemoteTrack(sid, el);
    el.addEventListener(
      "playing",
      () => audioSessionRef.current.addRemoteTrack(sid, el),
      { once: true },
    );
    void el.play().catch(() => {});
  }

  function detachRemoteAudio(track: Track) {
    if (!track.sid) return;
    const handle = audioBySid.current.get(track.sid);
    if (!handle) return;
    try {
      handle.track.detach(handle.el);
    } catch {
      // ignore
    }
    handle.el.remove();
    audioBySid.current.delete(track.sid);
    audioSessionRef.current.removeRemoteTrack(track.sid);
  }

  function detachLocalMonitor() {
    const handle = localMicMonitorRef.current;
    if (!handle) return;
    try {
      handle.track.detach(handle.el);
    } catch {
      // ignore
    }
    handle.el.remove();
    localMicMonitorRef.current = null;
  }

  function attachLocalMonitor(track: LocalAudioTrack): HTMLMediaElement | null {
    if (!audioConfig.playback.localMonitor || !audioBinRef.current) return null;
    detachLocalMonitor();

    const el = track.attach() as HTMLMediaElement;
    el.autoplay = true;
    el.setAttribute("playsinline", "true");
    el.volume = audioPreferencesRef.current.masterVolume;
    audioBinRef.current.appendChild(el);
    localMicMonitorRef.current = { track, el };
    void el.play().catch(() => {});
    return el;
  }

  function clearRemoteAudio() {
    audioBySid.current.forEach(({ track, el }) => {
      try {
        track.detach(el);
      } catch {
        // ignore
      }
      el.remove();
    });
    audioBySid.current.clear();
  }

  function startAudioSession() {
    const session = audioSessionRef.current;
    session.start();
    waveformAnalyserRef.current = session.waveformAnalyserNode;
  }

  function stopAudioSession() {
    stopMicMeter();
    detachLocalMonitor();
    audioSessionRef.current.stop();
    waveformAnalyserRef.current = null;
  }

  function resetRoom() {
    clearRemoteAudio();
    setRoomGeneration((n) => n + 1);
  }

  function stopMicMeter() {
    if (micLevelRafRef.current) {
      cancelAnimationFrame(micLevelRafRef.current);
      micLevelRafRef.current = null;
    }
    setMicLevel(0);
  }

  function startMicMeter() {
    stopMicMeter();

    const analyser = audioSessionRef.current.micMeterAnalyserNode;
    if (!analyser) return;

    const data = new Float32Array(analyser.fftSize);
    const tick = () => {
      const meter = audioSessionRef.current.micMeterAnalyserNode;
      if (!meter) return;
      meter.getFloatTimeDomainData(data);
      let sumSq = 0;
      for (let i = 0; i < data.length; i++) sumSq += data[i]! * data[i]!;
      const visual = rmsToMeterLevel(Math.sqrt(sumSq / data.length));
      setMicLevel((prev) => prev * 0.75 + visual * 0.25);
      micLevelRafRef.current = requestAnimationFrame(tick);
    };
    micLevelRafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    function countHumanParticipants(): number {
      if (room.state !== ConnectionState.Connected) return 0;
      let count = 1;
      for (const participant of room.remoteParticipants.values()) {
        if (!isBotIdentity(participant.identity)) count++;
      }
      return count;
    }

    function syncParticipants() {
      setParticipants(countHumanParticipants());
    }

    function onActiveSpeakersChanged(speakers: Participant[]) {
      const humans = speakers.filter((p) => !isBotIdentity(p.identity));
      const others = humans.filter(
        (p) => p.identity !== room.localParticipant.identity,
      );
      setActiveSpeakerCount(others.length);
    }

    function onTrackSubscribed(track: Track, _pub: unknown, participant: Participant) {
      if (participant.identity === room.localParticipant.identity) return;
      attachRemoteAudio(track);
    }

    function onTrackUnsubscribed(track: Track, _pub: unknown, participant: Participant) {
      if (participant.identity === room.localParticipant.identity) return;
      detachRemoteAudio(track);
    }

    syncParticipants();

    room
      .on(RoomEvent.ParticipantConnected, syncParticipants)
      .on(RoomEvent.ParticipantDisconnected, syncParticipants)
      .on(RoomEvent.Connected, syncParticipants)
      .on(RoomEvent.Disconnected, syncParticipants)
      .on(RoomEvent.ActiveSpeakersChanged, onActiveSpeakersChanged)
      .on(RoomEvent.TrackSubscribed, onTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);

    return () => {
      room
        .off(RoomEvent.ParticipantConnected, syncParticipants)
        .off(RoomEvent.ParticipantDisconnected, syncParticipants)
        .off(RoomEvent.Connected, syncParticipants)
        .off(RoomEvent.Disconnected, syncParticipants)
        .off(RoomEvent.ActiveSpeakersChanged, onActiveSpeakersChanged)
        .off(RoomEvent.TrackSubscribed, onTrackSubscribed)
        .off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    };
  }, [room]);

  async function join() {
    setStatus("joining");
    setError(null);

    try {
      const resp = await fetch(`${apiBase}/token`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ room: "globalAum", name: "Guest" }),
      });
      if (!resp.ok) {
        throw new Error((await resp.text()) || `token request failed: ${resp.status}`);
      }
      const data = (await resp.json()) as TokenResponse;

      await room.connect(data.url, data.token);
      startAudioSession();
      setMicEnabled(false);
      setLocalMicTrack(null);

      for (const p of room.remoteParticipants.values()) {
        for (const pub of p.getTrackPublications()) {
          if (pub.kind === Track.Kind.Audio && pub.track) {
            attachRemoteAudio(pub.track);
          }
        }
      }

      setStatus("joined");
    } catch (e) {
      stopAudioSession();
      await disableMic().catch(() => {});
      try {
        await room.disconnect();
      } catch {
        // ignore
      }
      resetRoom();
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function leave() {
    setStatus("leaving");
    setError(null);

    try {
      await disableMic().catch(() => {});
      stopAudioSession();
      await room.disconnect();
      clearRemoteAudio();
      setStatus("idle");
      resetRoom();
    } catch (e) {
      resetRoom();
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return {
    status,
    error,
    isJoined,
    micAvailable,
    participants,
    micEnabled,
    micLevel,
    activeSpeakerCount,
    audioBinRef,
    localMicTrack,
    waveformAnalyserRef,
    audioPreferences,
    setMasterVolume,
    setMicGain,
    setNoiseSuppression,
    toggleMic,
    join,
    leave,
  };
}
