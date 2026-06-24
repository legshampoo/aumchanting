"use client";

import { useEffect, useRef, type RefObject } from "react";

type UseWaveformAnalyserOptions = {
  audioBinRef: RefObject<HTMLDivElement | null>;
  isJoined: boolean;
  localMicTrack: MediaStreamTrack | null;
};

export function useWaveformAnalyser({
  audioBinRef,
  isJoined,
  localMicTrack,
}: UseWaveformAnalyserOptions) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const elementSourcesRef = useRef(
    new Map<HTMLMediaElement, MediaElementAudioSourceNode>(),
  );
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!isJoined) {
      micSourceRef.current?.disconnect();
      micSourceRef.current = null;
      elementSourcesRef.current.forEach((source) => source.disconnect());
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
    analyser.connect(ctx.destination);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    const connectElement = (el: HTMLMediaElement) => {
      if (elementSourcesRef.current.has(el)) return;
      try {
        const source = ctx.createMediaElementSource(el);
        source.connect(analyser);
        elementSourcesRef.current.set(el, source);
      } catch {
        // Element may already be wired to another context.
      }
    };

    const syncElements = () => {
      const bin = audioBinRef.current;
      if (!bin) return;
      bin.querySelectorAll("audio,video").forEach((node) => {
        if (node instanceof HTMLMediaElement) connectElement(node);
      });
    };

    syncElements();

    const observer = new MutationObserver(syncElements);
    const bin = audioBinRef.current;
    if (bin) {
      observer.observe(bin, { childList: true, subtree: true });
    }

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
      observer.disconnect();
      micSourceRef.current?.disconnect();
      micSourceRef.current = null;
      elementSourcesRef.current.forEach((source) => source.disconnect());
      elementSourcesRef.current.clear();
      void ctx.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
    };
  }, [isJoined, audioBinRef, localMicTrack]);

  return analyserRef;
}
