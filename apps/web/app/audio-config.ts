/**
 * LiveKit audio tuning — edit here when optimizing chant quality.
 *
 * Strategy A: sustained-tone / music-oriented publish settings (DTX off, higher bitrate).
 * Playback and visualization fixes live in separate follow-up work.
 */

export const audioPublishPresetNames = [
  "telephone",
  "speech",
  "music",
  "musicStereo",
  "musicHighQuality",
  "musicHighQualityStereo",
] as const;

export type AudioPublishPreset = (typeof audioPublishPresetNames)[number];

export const audioConfig = {
  publish: {
    /**
     * LiveKit Opus bitrate preset for published mic audio.
     * Options: telephone | speech | music | musicStereo | musicHighQuality | musicHighQualityStereo
     */
    preset: "musicHighQuality" satisfies AudioPublishPreset,

    /**
     * Discontinuous transmission — off for sustained Om/chant tones.
     * Speech defaults leave this on and can cause cutouts on steady vowels.
     */
    dtx: false,

    /** Redundant encoding — helps recover from packet loss on mobile networks. */
    red: true,

    /** Mono is enough for chant; stereo costs bandwidth and disables DTX/RED by default. */
    forceStereo: false,
  },

  capture: {
    echoCancellation: false,
    noiseSuppression: false,
  },

  /**
   * Automatic Gain Control is OFF on all platforms: AGC pulls down sustained loud
   * input (e.g. a held "aum"), causing the volume to fade while chanting. Users
   * set loudness manually via the Input volume slider instead.
   */
  iosAutoGainControl: false,
  defaultAutoGainControl: false,

  playback: {
    /** Hear your own mic locally while chanting. Use headphones to avoid feedback. */
    localMonitor: true,
    /** Default circle / remote playback volume (0–1). */
    defaultMasterVolume: 1,
    /** Default self-monitor volume when chanting (0–1). */
    defaultSelfMonitorVolume: 0.85,
  },

  mic: {
    /** Default mic input gain (1 = unity = 100%). Slider ranges 0–maxGain. */
    defaultGain: 1,
    /** Max mic input gain (1 = 100%, no boost above unity). */
    maxGain: 1,
  },
} as const;

export type AudioPreferences = {
  masterVolume: number;
  selfMonitorVolume: number;
  micGain: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
};
