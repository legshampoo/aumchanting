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

// Noise gate: passes audio untouched above the open threshold (so a held Om is
// never attenuated) and mutes the quiet gaps where background hiss lives. Two
// thresholds give hysteresis to avoid chatter; fast attack + slow release keep
// transitions smooth.
const GATE_FFT_SIZE = 1024;
const GATE_OPEN_THRESHOLD = 0.015; // RMS above this opens the gate
const GATE_CLOSE_THRESHOLD = 0.008; // RMS below this closes it
const GATE_ATTACK = 0.005; // seconds (fast open)
const GATE_RELEASE = 0.18; // seconds (gentle close)
const GATE_TICK_MS = 30;

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
  private micGainNode: GainNode | null = null;
  private micDestination: MediaStreamAudioDestinationNode | null = null;
  private gateGainNode: GainNode | null = null;
  private gateAnalyser: AnalyserNode | null = null;
  private gateData: Float32Array<ArrayBuffer> | null = null;
  private gateTimer: ReturnType<typeof setInterval> | null = null;
  private gateEnabled = false;
  private gateOpen = false;

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
    this.teardownMicChain();
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

  /**
   * Routes the raw mic through a gain node, taps the meter/waveform analysers
   * post-gain, and returns a processed MediaStreamTrack to publish so the input
   * gain slider actually changes how loud others hear you. Returns null if Web
   * Audio is unavailable — caller should fall back to the raw track.
   */
  buildMicChain(
    rawTrack: MediaStreamTrack,
    gain: number,
    gateEnabled: boolean,
  ): MediaStreamTrack | null {
    if (!this.ctx || !this.waveformAnalyser || !this.micMeterAnalyser) {
      return null;
    }
    this.teardownMicChain();

    try {
      const source = this.ctx.createMediaStreamSource(
        new MediaStream([rawTrack]),
      );
      // Level detector taps the raw source (pre-gate) so the gate can still
      // "see" your voice resume while it is closed.
      const gateAnalyser = this.ctx.createAnalyser();
      gateAnalyser.fftSize = GATE_FFT_SIZE;
      const gateGain = this.ctx.createGain();
      gateGain.gain.value = gateEnabled ? 0 : 1;
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = gain;
      const destination = this.ctx.createMediaStreamDestination();

      source.connect(gateAnalyser);
      source.connect(gateGain);
      gateGain.connect(gainNode);
      gainNode.connect(destination);
      gainNode.connect(this.waveformAnalyser);
      gainNode.connect(this.micMeterAnalyser);

      this.micSource = source;
      this.gateAnalyser = gateAnalyser;
      this.gateData = new Float32Array(gateAnalyser.fftSize);
      this.gateGainNode = gateGain;
      this.micGainNode = gainNode;
      this.micDestination = destination;
      this.gateEnabled = gateEnabled;
      this.gateOpen = !gateEnabled;

      if (gateEnabled) this.startGateLoop();

      return destination.stream.getAudioTracks()[0] ?? null;
    } catch {
      this.teardownMicChain();
      return null;
    }
  }

  setMicGain(gain: number): void {
    if (this.micGainNode) {
      this.micGainNode.gain.value = gain;
    }
  }

  /** Enable/disable the noise gate live, without rebuilding the chain. */
  setNoiseGate(enabled: boolean): void {
    this.gateEnabled = enabled;
    if (!this.ctx || !this.gateGainNode) return;

    if (enabled) {
      this.startGateLoop();
    } else {
      this.stopGateLoop();
      this.gateOpen = true;
      this.gateGainNode.gain.setTargetAtTime(
        1,
        this.ctx.currentTime,
        GATE_ATTACK,
      );
    }
  }

  private startGateLoop(): void {
    if (this.gateTimer != null) return;
    this.gateTimer = setInterval(() => {
      const ctx = this.ctx;
      const analyser = this.gateAnalyser;
      const gate = this.gateGainNode;
      const data = this.gateData;
      if (!this.gateEnabled || !ctx || !analyser || !gate || !data) return;

      analyser.getFloatTimeDomainData(data);
      let sumSq = 0;
      for (let i = 0; i < data.length; i++) sumSq += data[i]! * data[i]!;
      const rms = Math.sqrt(sumSq / data.length);

      if (!this.gateOpen && rms > GATE_OPEN_THRESHOLD) {
        this.gateOpen = true;
        gate.gain.setTargetAtTime(1, ctx.currentTime, GATE_ATTACK);
      } else if (this.gateOpen && rms < GATE_CLOSE_THRESHOLD) {
        this.gateOpen = false;
        gate.gain.setTargetAtTime(0, ctx.currentTime, GATE_RELEASE);
      }
    }, GATE_TICK_MS);
  }

  private stopGateLoop(): void {
    if (this.gateTimer != null) {
      clearInterval(this.gateTimer);
      this.gateTimer = null;
    }
  }

  teardownMicChain(): void {
    this.stopGateLoop();
    this.micSource?.disconnect();
    this.gateAnalyser?.disconnect();
    this.gateGainNode?.disconnect();
    this.micGainNode?.disconnect();
    this.micDestination?.disconnect();
    this.micSource = null;
    this.gateAnalyser = null;
    this.gateData = null;
    this.gateGainNode = null;
    this.micGainNode = null;
    this.micDestination = null;
    this.gateOpen = false;
  }

  get waveformAnalyserNode(): AnalyserNode | null {
    return this.waveformAnalyser;
  }

  get micMeterAnalyserNode(): AnalyserNode | null {
    return this.micMeterAnalyser;
  }
}
