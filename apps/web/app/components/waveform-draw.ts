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
  const count = amplitudes.length;
  const totalBarSpan = count * BAR_WIDTH + (count - 1) * BAR_GAP;
  const startX = (width - totalBarSpan) / 2;

  for (let i = 0; i < count; i++) {
    const amp = Math.min(1, Math.max(0, amplitudes[i] ?? 0));
    const barHeight = amp * height * 0.46;
    const x = startX + i * (BAR_WIDTH + BAR_GAP);

    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.15 + amp * 0.75;
    ctx.fillRect(x, mid - barHeight, BAR_WIDTH, barHeight);
    ctx.fillRect(x, mid, BAR_WIDTH, barHeight);
  }

  ctx.globalAlpha = 1;
}

export function idleAmplitudes(barCount: number, time: number) {
  const amps: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const t = time * 0.001 + i * 0.22;
    const centerBoost = 1 - Math.abs(i / barCount - 0.5) * 1.4;
    const wave =
      (Math.sin(t) * 0.35 +
        Math.sin(t * 1.9 + 0.8) * 0.25 +
        Math.sin(t * 0.6 + 2.1) * 0.2) *
      Math.max(0.15, centerBoost);
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
