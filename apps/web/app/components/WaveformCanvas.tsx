"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  barCountForWidth,
  drawBarWaveform,
  idleAmplitudes,
  liveAmplitudes,
} from "./waveform-draw";

type WaveformCanvasProps = {
  isJoined: boolean;
  analyserRef: RefObject<AnalyserNode | null>;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  ariaLabel?: string;
};

export function WaveformCanvas({
  isJoined,
  analyserRef,
  className = "",
  minHeight = 72,
  maxHeight = 120,
  ariaLabel = "Live audio waveform",
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let raf = 0;
    let start = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = Math.max(1, Math.floor(parent.clientWidth));
      const height = Math.max(
        minHeight,
        Math.min(maxHeight, Math.floor(width / 12)),
      );
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = (now: number) => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const analyser = analyserRef.current;
      const bars = barCountForWidth(width);

      if (isJoined && analyser) {
        const buffer = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buffer);
        const amps = liveAmplitudes(buffer, bars);
        const peak = amps.reduce((max, amp) => Math.max(max, amp), 0);

        drawBarWaveform(
          context,
          width,
          height,
          peak < 0.03 ? idleAmplitudes(bars, now - start) : amps,
        );
      } else {
        drawBarWaveform(
          context,
          width,
          height,
          idleAmplitudes(bars, now - start),
        );
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mounted, isJoined, analyserRef, minHeight, maxHeight]);

  if (!mounted) {
    return <div className={`w-full ${className}`} style={{ height: minHeight }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full ${className}`}
      aria-label={ariaLabel}
    />
  );
}
