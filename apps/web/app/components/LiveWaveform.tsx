"use client";

import type { RefObject } from "react";
import { WaveformCanvas } from "./WaveformCanvas";

const primaryButtonClassName =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-foreground px-5 text-xs font-semibold tracking-[0.12em] text-background uppercase disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClassName =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-border px-5 text-xs font-semibold tracking-[0.12em] text-foreground uppercase disabled:cursor-not-allowed disabled:opacity-50";

type LiveWaveformProps = {
  isJoined: boolean;
  isJoining: boolean;
  micAvailable: boolean;
  analyserRef: RefObject<AnalyserNode | null>;
  onJoinWithMic: () => void;
  onListenOnly: () => void;
};

export function LiveWaveform({
  isJoined,
  isJoining,
  micAvailable,
  analyserRef,
  onJoinWithMic,
  onListenOnly,
}: LiveWaveformProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">
              Live sound
            </p>
            <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
            <button
              type="button"
              className={primaryButtonClassName}
              onClick={onJoinWithMic}
              disabled={isJoining || isJoined || !micAvailable}
              title={
                micAvailable
                  ? undefined
                  : "Microphone requires HTTPS (not available on plain HTTP)"
              }
            >
              Join + Mic
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={onListenOnly}
              disabled={isJoining || isJoined}
            >
              Listen only
            </button>
          </div>
          <p className="mt-2 text-xs tracking-[0.16em] text-muted uppercase">
            Recorded in real time
          </p>
        </div>
      </div>

      <div className="mt-8 w-full">
        <WaveformCanvas isJoined={isJoined} analyserRef={analyserRef} />
      </div>
    </section>
  );
}
