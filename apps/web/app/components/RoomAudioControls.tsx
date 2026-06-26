"use client";

import { audioConfig, type AudioPreferences } from "../audio-config";

type RoomAudioControlsProps = {
  micEnabled: boolean;
  micAvailable: boolean;
  micLevel: number;
  preferences: AudioPreferences;
  onMicToggle: (enabled: boolean) => void;
  onMicGainChange: (gain: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onNoiseSuppressionChange: (enabled: boolean) => void;
};

const MIC_GAIN_MAX_PERCENT = Math.round(audioConfig.mic.maxGain * 100);

function SliderControl({
  id,
  label,
  hint,
  value,
  maxPercent = 100,
  labelClassName = "text-muted",
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  maxPercent?: number;
  labelClassName?: string;
  onChange: (value: number) => void;
}) {
  const percent = Math.round(value * 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
        <span className="text-xs tabular-nums text-foreground">{percent}%</span>
      </div>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      <input
        id={id}
        type="range"
        min={0}
        max={maxPercent}
        step={1}
        value={percent}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-2 h-2 w-full cursor-pointer accent-foreground"
        aria-valuemin={0}
        aria-valuemax={maxPercent}
        aria-valuenow={percent}
      />
    </div>
  );
}

function ToggleControl({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

export function RoomAudioControls({
  micEnabled,
  micAvailable,
  micLevel,
  preferences,
  onMicToggle,
  onMicGainChange,
  onMasterVolumeChange,
  onNoiseSuppressionChange,
}: RoomAudioControlsProps) {
  return (
    <div className="mt-5 space-y-5 border-t border-border pt-5 text-left">
      <SliderControl
        id="master-volume"
        label="Volume"
        labelClassName="text-xs font-semibold tracking-[0.16em] text-foreground uppercase"
        value={preferences.masterVolume}
        onChange={onMasterVolumeChange}
      />

      {micEnabled ? (
        <div className="space-y-4">
          <div>
            <span className="text-muted">Mic level</span>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-foreground transition-[width] duration-75"
                style={{
                  width: `${Math.min(100, Math.round(micLevel * 100))}%`,
                }}
              />
            </div>
          </div>

          <SliderControl
            id="mic-gain"
            label="Input volume"
            hint="How loud you are sent to the circle"
            value={preferences.micGain}
            maxPercent={MIC_GAIN_MAX_PERCENT}
            onChange={onMicGainChange}
          />

          <ToggleControl
            id="noise-suppression"
            label="Noise reduction"
            checked={preferences.noiseSuppression}
            onChange={onNoiseSuppressionChange}
          />
        </div>
      ) : null}

      <div className="flex justify-center">
        <MicToggleButton
          micEnabled={micEnabled}
          micAvailable={micAvailable}
          onMicToggle={onMicToggle}
        />
      </div>
    </div>
  );
}

function MicToggleButton({
  micEnabled,
  micAvailable,
  onMicToggle,
}: {
  micEnabled: boolean;
  micAvailable: boolean;
  onMicToggle: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onMicToggle(!micEnabled)}
      disabled={!micAvailable}
      title={
        micAvailable
          ? undefined
          : "Microphone requires HTTPS (not available on plain HTTP)"
      }
      className={`h-11 cursor-pointer rounded-full px-6 text-xs font-semibold tracking-[0.12em] uppercase disabled:cursor-not-allowed disabled:opacity-50 ${
        micEnabled
          ? "border border-border bg-white text-foreground hover:bg-border/40"
          : "bg-foreground text-background"
      }`}
    >
      {micEnabled ? "Disable Microphone" : "Enable Microphone"}
    </button>
  );
}
