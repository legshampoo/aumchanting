"use client";

import styles from "./HeroCircleViz.module.css";

const SIZE = 400;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_RADIUS = 158;
const INNER_RADIUS = 118;
const QUIET_RING_RADIUS = 142;

const AMBIENT_DOT_COUNT = 20;
const ENERGY_DOT_COUNT = 10;
const MAX_USER_DOTS = 24;

const GOLD = "#b8954a";
const GOLD_LIGHT = "#d4bc82";
const INK = "#1a1a1a";
const MUTED = "#c9c4b8";
const BORDER = "#e8e4dc";

type HeroCircleVizProps = {
  chanterCount: number;
  activeChanters: number;
};

function polar(cx: number, cy: number, radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    x: round(cx + radius * Math.cos(radians)),
    y: round(cy + radius * Math.sin(radians)),
  };
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function RingDot({
  x,
  y,
  radius,
  fill,
  strong = false,
  delay = 0,
}: {
  x: number;
  y: number;
  radius: number;
  fill: string;
  strong?: boolean;
  delay?: number;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill={fill}
        className={`${styles.dotPulse} ${strong ? styles.dotPulseStrong : ""}`}
        style={{ animationDelay: `${delay}s` }}
      />
    </g>
  );
}

export function HeroCircleViz({
  chanterCount,
  activeChanters,
}: HeroCircleVizProps) {
  const isEmpty = chanterCount === 0;
  const visibleUserDots = isEmpty
    ? 0
    : Math.min(chanterCount, MAX_USER_DOTS);
  const visibleActiveDots = Math.min(activeChanters, visibleUserDots);

  const ambientDots = Array.from({ length: AMBIENT_DOT_COUNT }, (_, index) => {
    const angle = (360 / AMBIENT_DOT_COUNT) * index;
    const { x, y } = polar(CX, CY, OUTER_RADIUS, angle - 90);
    return { x, y, delay: index * 0.12 };
  });

  const energyDots = Array.from({ length: ENERGY_DOT_COUNT }, (_, index) => {
    const angle = (360 / ENERGY_DOT_COUNT) * index + 18;
    const { x, y } = polar(CX, CY, INNER_RADIUS, angle - 90);
    return { x, y, delay: index * 0.18 };
  });

  const userDots = Array.from({ length: visibleUserDots }, (_, index) => {
    const angle = (360 / Math.max(visibleUserDots, 1)) * index;
    const { x, y } = polar(CX, CY, QUIET_RING_RADIUS, angle - 90);
    const isActive = index < visibleActiveDots;
    return { x, y, isActive, delay: index * 0.08 };
  });

  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg lg:max-w-none">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full"
        role="img"
        aria-label={
          isEmpty
            ? "The circle is open. Be the first to join."
            : `${chanterCount} chanters in the live circle`
        }
      >
        <circle
          cx={CX}
          cy={CY}
          r={OUTER_RADIUS}
          fill="none"
          stroke={BORDER}
          strokeWidth={1}
          opacity={isEmpty ? 0.55 : 0.35}
        />
        <circle
          cx={CX}
          cy={CY}
          r={QUIET_RING_RADIUS}
          fill="none"
          stroke={BORDER}
          strokeWidth={1}
          strokeDasharray="3 9"
          opacity={isEmpty ? 0.4 : 0.25}
        />
        <circle
          cx={CX}
          cy={CY}
          r={INNER_RADIUS}
          fill="none"
          stroke={BORDER}
          strokeWidth={1}
          opacity={0.2}
        />

        <g className={styles.ringCw}>
          {ambientDots.map((dot, index) => (
            <RingDot
              key={`ambient-${index}`}
              x={dot.x}
              y={dot.y}
              radius={isEmpty ? 3.5 : 2.5}
              fill={isEmpty ? GOLD_LIGHT : MUTED}
              strong={isEmpty}
              delay={dot.delay}
            />
          ))}
        </g>

        <g className={styles.ringCcw}>
          {energyDots.map((dot, index) => (
            <RingDot
              key={`energy-${index}`}
              x={dot.x}
              y={dot.y}
              radius={2}
              fill={isEmpty ? GOLD : "#ddd6c8"}
              strong
              delay={dot.delay}
            />
          ))}
        </g>

        {!isEmpty
          ? userDots.map((dot, index) => (
              <RingDot
                key={`user-${index}`}
                x={dot.x}
                y={dot.y}
                radius={dot.isActive ? 5 : 4}
                fill={dot.isActive ? GOLD : INK}
                strong={dot.isActive}
                delay={dot.delay}
              />
            ))
          : null}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">
          {isEmpty ? "The circle is open" : "Live now"}
        </p>
        <p className="font-display mt-2 text-5xl font-medium text-foreground tabular-nums">
          {formatCount(chanterCount)}
        </p>
        <p className="mt-1 text-sm text-muted">chanters</p>
        {isEmpty ? (
          <p className="mt-1 text-sm text-gold">Be the first</p>
        ) : null}
      </div>
    </div>
  );
}
