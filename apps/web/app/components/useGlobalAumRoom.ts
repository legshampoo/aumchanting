"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createLocalAudioTrack,
  ConnectionState,
  Room,
  RoomEvent,
  type LocalAudioTrack,
  type Participant,
  Track,
} from "livekit-client";
import {
  buildAudioCaptureOptions,
  buildRoomOptions,
} from "../lib/audio-livekit";
import { RoomAudioSession } from "../lib/room-audio-session";
import { isBotIdentity } from "../lib/room-identity";

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

  const audioBinRef = useRef<HTMLDivElement | null>(null);
  const audioBySid = useRef(new Map<string, AudioHandle>());
  const localMicTrackRef = useRef<LocalAudioTrack | null>(null);
  const audioSessionRef = useRef(new RoomAudioSession());
  const waveformAnalyserRef = useRef<AnalyserNode | null>(null);
  const micLevelRafRef = useRef<number | null>(null);

  const isJoined = status === "joined";

  useEffect(() => {
    setMicAvailable(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia,
    );
  }, []);

  function attachRemoteAudio(track: Track) {
    if (track.kind !== Track.Kind.Audio || !track.sid || !audioBinRef.current) {
      return;
    }
    if (audioBySid.current.has(track.sid)) return;

    const el = track.attach() as HTMLMediaElement;
    el.autoplay = true;
    el.setAttribute("playsinline", "true");
    audioBinRef.current.appendChild(el);
    audioBySid.current.set(track.sid, { track, el });
    audioSessionRef.current.addRemoteTrack(track.sid, track.mediaStreamTrack);
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
    audioSessionRef.current.setMicTrack(null);
    setMicLevel(0);
  }

  function startMicMeter(track: LocalAudioTrack) {
    stopMicMeter();
    audioSessionRef.current.setMicTrack(track.mediaStreamTrack);

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
        throw new Error((await resp.text()) || `token request failed: ${resp.status}`);
      }
      const data = (await resp.json()) as TokenResponse;

      await room.connect(data.url, data.token);
      startAudioSession();

      if (opts.withMic) {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Microphone needs HTTPS (or localhost). On HTTP use “Listen only”, or add TLS to your site.",
          );
        }
        const micTrack = await createLocalAudioTrack(
          buildAudioCaptureOptions(isIOSDevice()),
        );
        localMicTrackRef.current = micTrack;
        setLocalMicTrack(micTrack.mediaStreamTrack);
        await room.localParticipant.publishTrack(micTrack);
        setMicEnabled(true);
        void startMicMeter(micTrack);
      } else {
        setMicEnabled(false);
        setLocalMicTrack(null);
        stopMicMeter();
      }

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
      localMicTrackRef.current?.stop();
      localMicTrackRef.current = null;
      setLocalMicTrack(null);
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
      stopAudioSession();
      if (localMicTrackRef.current) {
        try {
          await room.localParticipant.unpublishTrack(localMicTrackRef.current);
        } finally {
          localMicTrackRef.current.stop();
          localMicTrackRef.current = null;
          setLocalMicTrack(null);
        }
      }

      await room.disconnect();
      clearRemoteAudio();
      setMicEnabled(false);
      setLocalMicTrack(null);
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
    join,
    leave,
  };
}
