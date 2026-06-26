"use client";

import type { RefObject } from "react";
import type { AudioPreferences } from "../audio-config";
import { RoomAudioControls } from "./RoomAudioControls";
import { WaveformCanvas } from "./WaveformCanvas";

type RoomDashboardProps = {
  participants: number;
  micEnabled: boolean;
  micAvailable: boolean;
  micLevel: number;
  error: string | null;
  analyserRef: RefObject<AnalyserNode | null>;
  audioPreferences: AudioPreferences;
  onMicToggle: (enabled: boolean) => void;
  onMicGainChange: (gain: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onNoiseSuppressionChange: (enabled: boolean) => void;
  isLeaving: boolean;
  onLeave: () => void;
};

export function RoomDashboard({
  participants,
  micEnabled,
  micAvailable,
  micLevel,
  error,
  analyserRef,
  audioPreferences,
  onMicToggle,
  onMicGainChange,
  onMasterVolumeChange,
  onNoiseSuppressionChange,
  isLeaving,
  onLeave,
}: RoomDashboardProps) {
  return (
    <div className="w-full rounded-xl border border-border bg-white p-5 text-sm shadow-sm">
      <div className="text-center">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">Live sound</p>
      </div>

      <dl className="mt-4 text-center">
        <dt className="text-xs tracking-[0.16em] text-muted uppercase">
          Active chanters
        </dt>
        <dd className="mt-1 font-display text-3xl font-medium text-foreground">
          {participants}
        </dd>
      </dl>

      <div className="mt-4 w-full">
        <WaveformCanvas
          isJoined
          analyserRef={analyserRef}
          minHeight={64}
          maxHeight={88}
          ariaLabel="Your live audio waveform"
        />
      </div>

      <RoomAudioControls
        micEnabled={micEnabled}
        micAvailable={micAvailable}
        micLevel={micLevel}
        preferences={audioPreferences}
        onMicToggle={onMicToggle}
        onMicGainChange={onMicGainChange}
        onMasterVolumeChange={onMasterVolumeChange}
        onNoiseSuppressionChange={onNoiseSuppressionChange}
      />

      {error ? (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-center text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          className="h-11 cursor-pointer rounded-full border border-red-200 px-6 text-xs font-semibold tracking-[0.12em] text-red-700 uppercase hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onLeave}
          disabled={isLeaving}
        >
          Leave
        </button>
      </div>
    </div>
  );
}
