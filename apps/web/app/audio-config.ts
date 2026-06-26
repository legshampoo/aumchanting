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
   * iOS WebKit often needs AGC for usable mic levels; other platforms keep it off
   * so chant timbre stays natural.
   */
  iosAutoGainControl: true,
  defaultAutoGainControl: false,
} as const;
