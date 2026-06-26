import {
  AudioPresets,
  type AudioCaptureOptions,
  type AudioPreset,
  type RoomOptions,
  type TrackPublishOptions,
} from "livekit-client";
import {
  audioConfig,
  type AudioPublishPreset,
} from "../audio-config";
import type { AudioPreferences } from "../audio-config";

const publishPresetByName: Record<AudioPublishPreset, AudioPreset> = {
  telephone: AudioPresets.telephone,
  speech: AudioPresets.speech,
  music: AudioPresets.music,
  musicStereo: AudioPresets.musicStereo,
  musicHighQuality: AudioPresets.musicHighQuality,
  musicHighQualityStereo: AudioPresets.musicHighQualityStereo,
};

export function buildPublishDefaults(): TrackPublishOptions {
  const { publish } = audioConfig;
  return {
    audioPreset: publishPresetByName[publish.preset],
    dtx: publish.dtx,
    red: publish.red,
    forceStereo: publish.forceStereo,
  };
}

export function buildAudioCaptureOptions(
  isIOS: boolean,
  prefs?: Pick<AudioPreferences, "echoCancellation">,
): AudioCaptureOptions {
  return {
    echoCancellation: prefs?.echoCancellation ?? audioConfig.capture.echoCancellation,
    // Browser noiseSuppression is built for speech and progressively ducks a
    // sustained Om (it treats the steady tone as background noise). We disable
    // it and instead apply our own noise gate in the Web Audio chain, which
    // never attenuates the tone itself.
    noiseSuppression: false,
    autoGainControl: isIOS
      ? audioConfig.iosAutoGainControl
      : audioConfig.defaultAutoGainControl,
    // Safari/iOS can enable system Voice Isolation by default, which ducks a
    // sustained Om over time. Force it off so the held tone stays level.
    voiceIsolation: false,
  };
}

export function buildRoomOptions(): RoomOptions {
  return {
    publishDefaults: buildPublishDefaults(),
    audioCaptureDefaults: buildAudioCaptureOptions(false),
  };
}
