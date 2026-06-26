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

export function buildAudioCaptureOptions(isIOS: boolean): AudioCaptureOptions {
  return {
    echoCancellation: audioConfig.capture.echoCancellation,
    noiseSuppression: audioConfig.capture.noiseSuppression,
    autoGainControl: isIOS
      ? audioConfig.iosAutoGainControl
      : audioConfig.defaultAutoGainControl,
  };
}

export function buildRoomOptions(): RoomOptions {
  return {
    publishDefaults: buildPublishDefaults(),
    audioCaptureDefaults: buildAudioCaptureOptions(false),
  };
}
