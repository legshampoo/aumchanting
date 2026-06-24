"use client";

import { useEffect, useRef, type RefObject } from "react";

type UseWaveformAnalyserOptions = {
  audioBinRef: RefObject<HTMLDivElement | null>;
  isJoined: boolean;
  localMicTrack: MediaStreamTrack | null;
};

type ElementSource =
  | { kind: "stream"; node: MediaStreamAudioSourceNode }
  | { kind: "element"; node: MediaElementAudioSourceNode };

function captureElementStream(el: HTMLMediaElement): MediaStream | null {
  const capture = (
    el as HTMLMediaElement & { captureStream?: () => MediaStream }
  ).captureStream;
  if (typeof capture !== "function") return null;
  try {
    return capture.call(el);
  } catch {
    return null;
  }
}

export function useWaveformAnalyser({
  audioBinRef,
  isJoined,
  localMicTrack,
}: UseWaveformAnalyserOptions) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const elementSourcesRef = useRef(new Map<HTMLMediaElement, ElementSource>());
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!isJoined) {
      micSourceRef.current?.disconnect();
      micSourceRef.current = null;
      elementSourcesRef.current.forEach(({ node }) => node.disconnect());
      elementSourcesRef.current.clear();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      analyserRef.current = null;
      return;
    }

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.78;

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    let destinationConnected = false;
    const elementListeners = new Map<HTMLMediaElement, () => void>();

    const connectElement = (el: HTMLMediaElement) => {
      if (elementSourcesRef.current.has(el)) return;

      const stream = captureElementStream(el);
      if (stream) {
        try {
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          elementSourcesRef.current.set(el, { kind: "stream", node: source });
          return;
        } catch {
          // Fall back to MediaElementSource below.
        }
      }

      try {
        const source = ctx.createMediaElementSource(el);
        source.connect(analyser);
        if (!destinationConnected) {
          analyser.connect(ctx.destination);
          destinationConnected = true;
        }
        elementSourcesRef.current.set(el, { kind: "element", node: source });
      } catch {
        // Element may already be wired; retry when playback starts.
      }
    };

    const bindElement = (el: HTMLMediaElement) => {
      connectElement(el);
      if (elementListeners.has(el)) return;

      const retry = () => connectElement(el);
      el.addEventListener("playing", retry);
      el.addEventListener("loadeddata", retry);
      elementListeners.set(el, () => {
        el.removeEventListener("playing", retry);
        el.removeEventListener("loadeddata", retry);
      });
    };

    const syncElements = () => {
      const bin = audioBinRef.current;
      if (!bin) return;
      bin.querySelectorAll("audio,video").forEach((node) => {
        if (node instanceof HTMLMediaElement) bindElement(node);
      });
    };

    syncElements();

    const observer = new MutationObserver(syncElements);
    const bin = audioBinRef.current;
    if (bin) {
      observer.observe(bin, { childList: true, subtree: true });
    }

    const syncInterval = window.setInterval(syncElements, 1000);

    if (localMicTrack) {
      try {
        const micSource = ctx.createMediaStreamSource(
          new MediaStream([localMicTrack]),
        );
        micSource.connect(analyser);
        micSourceRef.current = micSource;
      } catch {
        // ignore mic wiring errors
      }
    }

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    return () => {
      window.clearInterval(syncInterval);
      observer.disconnect();
      elementListeners.forEach((cleanup) => cleanup());
      elementListeners.clear();
      micSourceRef.current?.disconnect();
      micSourceRef.current = null;
      elementSourcesRef.current.forEach(({ node }) => node.disconnect());
      elementSourcesRef.current.clear();
      void ctx.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
    };
  }, [isJoined, audioBinRef, localMicTrack]);

  return analyserRef;
}
