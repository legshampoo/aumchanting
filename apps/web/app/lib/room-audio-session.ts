/**
 * Single Web Audio session for the room: visualization and mic metering only.
 *
 * Playback stays entirely on the LiveKit-attached <audio> elements. For remote
 * visualization we tap el.captureStream() — a non-destructive copy of the
 * element's OUTPUT. We never feed the live remote WebRTC track into the
 * AudioContext: WebKit (and sometimes Chrome) will then route that track
 * exclusively into Web Audio and silence the <audio> element. We also never use
 * createMediaElementSource, which re-routes the element into the graph.
 *
 * If captureStream() is unavailable (older iOS WebKit), we simply skip the
 * remote tap so playback is never at risk; the waveform falls back to mic/idle.
 */

const WAVEFORM_FFT_SIZE = 512;
const WAVEFORM_SMOOTHING = 0.78;
const MIC_METER_FFT_SIZE = 1024;

function captureElementStream(el: HTMLMediaElement): MediaStream | null {
  const capture = (
    el as HTMLMediaElement & { captureStream?: () => MediaStream }
  ).captureStream;
  if (typeof capture !== "function") return null;
  try {
    return capture.call(el);
  } catch {
    return null;
  }
}

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

  addRemoteTrack(id: string, el: HTMLMediaElement): void {
    if (!this.ctx || !this.waveformAnalyser || this.remoteSources.has(id)) {
      return;
    }

    const stream = captureElementStream(el);
    if (!stream) return;

    try {
      const source = this.ctx.createMediaStreamSource(stream);
      source.connect(this.waveformAnalyser);
      this.remoteSources.set(id, source);
    } catch {
      // captureStream not yet producing audio; waveform will rely on mic/idle.
    }
  }

  removeRemoteTrack(id: string): void {
    const source = this.remoteSources.get(id);
    if (!source) return;
    source.disconnect();
    this.remoteSources.delete(id);
  }

  setMicMonitor(el: HTMLMediaElement | null): void {
    this.clearMic();
    if (!el || !this.ctx || !this.waveformAnalyser || !this.micMeterAnalyser) {
      return;
    }

    const stream = captureElementStream(el);
    if (!stream) return;

    try {
      const source = this.ctx.createMediaStreamSource(stream);
      source.connect(this.waveformAnalyser);
      source.connect(this.micMeterAnalyser);
      this.micSource = source;
    } catch {
      // captureStream not yet producing audio.
    }
  }

  /** Fallback when local monitor playback is disabled — meter/waveform only. */
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
