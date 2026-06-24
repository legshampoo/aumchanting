"use client";

import type { RefObject } from "react";
import { WaveformCanvas } from "./WaveformCanvas";

type RoomDashboardProps = {
  participants: number;
  micEnabled: boolean;
  micLevel: number;
  activeSpeakerCount: number;
  error: string | null;
  analyserRef: RefObject<AnalyserNode | null>;
};

export function RoomDashboard({
  participants,
  micEnabled,
  micLevel,
  activeSpeakerCount,
  error,
  analyserRef,
}: RoomDashboardProps) {
  const chanters = activeSpeakerCount + (micEnabled ? 1 : 0);

  return (
    <div className="mx-auto mt-8 w-full max-w-lg rounded-xl border border-border bg-white p-5 text-sm">
      <div className="text-center">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">Live sound</p>
        <p className="mt-1 text-xs tracking-[0.14em] text-muted uppercase">
          Your connection
        </p>
      </div>

      <div className="mt-4 w-full">
        <WaveformCanvas
          isJoined
          analyserRef={analyserRef}
          minHeight={64}
          maxHeight={88}
          ariaLabel="Your live audio waveform"
        />
      </div>

      <dl className="mt-5 space-y-2 text-center">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Participants</dt>
          <dd className="font-medium text-foreground">{participants}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Mic</dt>
          <dd className="font-medium text-foreground">
            {micEnabled ? "on" : "off"}
          </dd>
        </div>
        {micEnabled ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Mic level</dt>
            <dd className="flex-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-foreground"
                  style={{
                    width: `${Math.min(100, Math.round(micLevel * 100))}%`,
                  }}
                />
              </div>
            </dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Active chanters</dt>
          <dd className="font-medium text-foreground">{chanters}</dd>
        </div>
      </dl>

      {error ? (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-center text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
