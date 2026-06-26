/**
 * Single Web Audio session for the room: visualization and mic metering only.
 * Playback stays on LiveKit-attached <audio> elements — never tap those via
 * createMediaElementSource, which can hijack or silence WebRTC playback.
 */

const WAVEFORM_FFT_SIZE = 512;
const WAVEFORM_SMOOTHING = 0.78;
const MIC_METER_FFT_SIZE = 1024;

export class RoomAudioSession {
  private ctx: AudioContext | null = null;
  private waveformAnalyser: AnalyserNode | null = null;
  private micMeterAnalyser: AnalyserNode | null = null;
  private remoteSources = new Map<string, MediaStreamAudioSourceNode>();
  private micSource: MediaStreamAudioSourceNode | null = null;

  start(): void {
    if (this.ctx) return;

    const ctx = new AudioContext();
    const waveformAnalyser = ctx.createAnalyser();
    waveformAnalyser.fftSize = WAVEFORM_FFT_SIZE;
    waveformAnalyser.smoothingTimeConstant = WAVEFORM_SMOOTHING;

    const micMeterAnalyser = ctx.createAnalyser();
    micMeterAnalyser.fftSize = MIC_METER_FFT_SIZE;

    this.ctx = ctx;
    this.waveformAnalyser = waveformAnalyser;
    this.micMeterAnalyser = micMeterAnalyser;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }
  }

  stop(): void {
    this.clearMic();
    for (const source of this.remoteSources.values()) {
      source.disconnect();
    }
    this.remoteSources.clear();

    if (this.ctx) {
      void this.ctx.close();
    }
    this.ctx = null;
    this.waveformAnalyser = null;
    this.micMeterAnalyser = null;
  }

  addRemoteTrack(id: string, track: MediaStreamTrack): void {
    if (!this.ctx || !this.waveformAnalyser || this.remoteSources.has(id)) {
      return;
    }

    try {
      const source = this.ctx.createMediaStreamSource(new MediaStream([track]));
      source.connect(this.waveformAnalyser);
      this.remoteSources.set(id, source);
    } catch {
      // Track may not be ready yet.
    }
  }

  removeRemoteTrack(id: string): void {
    const source = this.remoteSources.get(id);
    if (!source) return;
    source.disconnect();
    this.remoteSources.delete(id);
  }

  setMicTrack(track: MediaStreamTrack | null): void {
    this.clearMic();
    if (!track || !this.ctx || !this.waveformAnalyser || !this.micMeterAnalyser) {
      return;
    }

    try {
      const source = this.ctx.createMediaStreamSource(new MediaStream([track]));
      source.connect(this.waveformAnalyser);
      source.connect(this.micMeterAnalyser);
      this.micSource = source;
    } catch {
      // ignore mic wiring errors
    }
  }

  get waveformAnalyserNode(): AnalyserNode | null {
    return this.waveformAnalyser;
  }

  get micMeterAnalyserNode(): AnalyserNode | null {
    return this.micMeterAnalyser;
  }

  private clearMic(): void {
    this.micSource?.disconnect();
    this.micSource = null;
  }
}
