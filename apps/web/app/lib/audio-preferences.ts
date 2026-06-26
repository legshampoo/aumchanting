import { audioConfig, type AudioPreferences } from "../audio-config";

export const AUDIO_PREFS_STORAGE_KEY = "aumchanting-audio-prefs-v2";

export function defaultAudioPreferences(): AudioPreferences {
  return {
    masterVolume: audioConfig.playback.defaultMasterVolume,
    selfMonitorVolume: audioConfig.playback.defaultSelfMonitorVolume,
    micGain: audioConfig.mic.defaultGain,
    noiseSuppression: audioConfig.capture.noiseSuppression,
    echoCancellation: audioConfig.capture.echoCancellation,
  };
}

function clampRange(value: unknown, fallback: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(0, value));
}

function clampVolume(value: unknown, fallback: number): number {
  return clampRange(value, fallback, 1);
}

export function normalizeAudioPreferences(
  value: Partial<AudioPreferences> | null | undefined,
): AudioPreferences {
  const defaults = defaultAudioPreferences();
  return {
    masterVolume: clampVolume(value?.masterVolume, defaults.masterVolume),
    selfMonitorVolume: clampVolume(
      value?.selfMonitorVolume,
      defaults.selfMonitorVolume,
    ),
    micGain: clampRange(
      value?.micGain,
      defaults.micGain,
      audioConfig.mic.maxGain,
    ),
    noiseSuppression:
      typeof value?.noiseSuppression === "boolean"
        ? value.noiseSuppression
        : defaults.noiseSuppression,
    echoCancellation:
      typeof value?.echoCancellation === "boolean"
        ? value.echoCancellation
        : defaults.echoCancellation,
  };
}

export function loadAudioPreferences(): AudioPreferences {
  if (typeof window === "undefined") return defaultAudioPreferences();
  try {
    const raw = window.localStorage.getItem(AUDIO_PREFS_STORAGE_KEY);
    if (!raw) return defaultAudioPreferences();
    return normalizeAudioPreferences(JSON.parse(raw) as Partial<AudioPreferences>);
  } catch {
    return defaultAudioPreferences();
  }
}

export function saveAudioPreferences(prefs: AudioPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUDIO_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota / private mode errors
  }
}
