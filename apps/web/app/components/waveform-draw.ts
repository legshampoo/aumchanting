const INK = "#1a1a1a";
const BAR_GAP = 3;
const BAR_WIDTH = 2;

export function barCountForWidth(width: number) {
  return Math.max(32, Math.floor(width / (BAR_WIDTH + BAR_GAP)));
}

export function drawBarWaveform(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amplitudes: number[],
) {
  ctx.clearRect(0, 0, width, height);

  const mid = height / 2;
  const centerX = width / 2;
  const stride = BAR_WIDTH + BAR_GAP;
  const half = Math.ceil(amplitudes.length / 2);

  const drawBar = (x: number, amp: number) => {
    const barHeight = amp * height * 0.46;
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.15 + amp * 0.75;
    ctx.fillRect(x, mid - barHeight, BAR_WIDTH, barHeight);
    ctx.fillRect(x, mid, BAR_WIDTH, barHeight);
  };

  // Mirror around the center: index 0 sits at the middle and bars grow outward,
  // the right column to the right and the left column to the left.
  for (let i = 0; i < half; i++) {
    const amp = Math.min(1, Math.max(0, amplitudes[i] ?? 0));
    drawBar(centerX + i * stride, amp);
    if (i > 0) drawBar(centerX - i * stride, amp);
  }

  ctx.globalAlpha = 1;
}

export function idleAmplitudes(barCount: number, time: number) {
  const amps: number[] = [];
  for (let i = 0; i < barCount; i++) {
    // index 0 is the center bar; subtracting i pushes crests outward over time.
    const t = time * 0.001 - i * 0.22;
    const centerFalloff = Math.max(0.15, 1 - (i / barCount) * 1.4);
    const wave =
      (Math.sin(t) * 0.35 +
        Math.sin(t * 1.9 + 0.8) * 0.25 +
        Math.sin(t * 0.6 + 2.1) * 0.2) *
      centerFalloff;
    amps.push(Math.max(0.06, Math.min(1, 0.22 + wave)));
  }
  return amps;
}

export function liveAmplitudes(frequencyData: Uint8Array, barCount: number) {
  const amps: number[] = [];
  const step = Math.max(1, Math.floor(frequencyData.length / barCount));

  for (let i = 0; i < barCount; i++) {
    const sample = frequencyData[i * step] ?? 0;
    amps.push(sample / 255);
  }

  return amps;
}
