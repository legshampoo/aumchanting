"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

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

function CenterLabel({
  chanterCount,
  isEmpty,
}: {
  chanterCount: number;
  isEmpty: boolean;
}) {
  return (
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
  );
}

function AnimatedCount({ value }: { value: number }) {
  const count = useMotionValue(value);
  const display = useTransform(count, (latest) => formatCount(Math.round(latest)));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.6,
      ease: "easeOut",
    });
    return controls.stop;
  }, [count, value]);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
      <p className="text-xs tracking-[0.2em] text-gold uppercase">Live now</p>
      <motion.span className="font-display mt-2 block text-5xl font-medium text-foreground tabular-nums">
        {display}
      </motion.span>
      <p className="mt-1 text-sm text-muted">chanters</p>
    </div>
  );
}

function RingDot({
  x,
  y,
  radius,
  fill,
  pulse = false,
  delay = 0,
}: {
  x: number;
  y: number;
  radius: number;
  fill: string;
  pulse?: boolean;
  delay?: number;
}) {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={radius}
      fill={fill}
      initial={false}
      animate={
        pulse
          ? {
              r: [radius, radius * 2, radius],
              opacity: [0.45, 1, 0.45],
            }
          : {
              r: [radius, radius * 2, radius],
              opacity: [0.3, 0.7, 0.3],
            }
      }
      transition={{
        duration: pulse ? 2.8 : 4.2,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function StaticRingDot({
  x,
  y,
  radius,
  fill,
  opacity,
}: {
  x: number;
  y: number;
  radius: number;
  fill: string;
  opacity: number;
}) {
  return <circle cx={x} cy={y} r={radius} fill={fill} opacity={opacity} />;
}

function HeroCircleStatic({
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
    return polar(CX, CY, OUTER_RADIUS, angle - 90);
  });

  const energyDots = Array.from({ length: ENERGY_DOT_COUNT }, (_, index) => {
    const angle = (360 / ENERGY_DOT_COUNT) * index + 18;
    return polar(CX, CY, INNER_RADIUS, angle - 90);
  });

  const userDots = Array.from({ length: visibleUserDots }, (_, index) => {
    const angle = (360 / Math.max(visibleUserDots, 1)) * index;
    const point = polar(CX, CY, QUIET_RING_RADIUS, angle - 90);
    return { ...point, isActive: index < visibleActiveDots };
  });

  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg lg:max-w-none">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full"
        role="img"
        aria-hidden
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
        {ambientDots.map((dot, index) => (
          <StaticRingDot
            key={`ambient-${index}`}
            x={dot.x}
            y={dot.y}
            radius={isEmpty ? 3.5 : 2.5}
            fill={isEmpty ? GOLD_LIGHT : MUTED}
            opacity={isEmpty ? 0.7 : 0.5}
          />
        ))}
        {energyDots.map((dot, index) => (
          <StaticRingDot
            key={`energy-${index}`}
            x={dot.x}
            y={dot.y}
            radius={2}
            fill={isEmpty ? GOLD : "#ddd6c8"}
            opacity={0.6}
          />
        ))}
        {userDots.map((dot, index) => (
          <StaticRingDot
            key={`user-${index}`}
            x={dot.x}
            y={dot.y}
            radius={dot.isActive ? 5 : 4}
            fill={dot.isActive ? GOLD : INK}
            opacity={dot.isActive ? 1 : 0.75}
          />
        ))}
      </svg>
      <CenterLabel chanterCount={chanterCount} isEmpty={isEmpty} />
    </div>
  );
}

function HeroCircleAnimated({
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

        <motion.g
          initial={false}
          animate={{ rotate: 360 }}
          transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          {ambientDots.map((dot, index) => (
            <RingDot
              key={`ambient-${index}`}
              x={dot.x}
              y={dot.y}
              radius={isEmpty ? 3.5 : 2.5}
              fill={isEmpty ? GOLD_LIGHT : MUTED}
              pulse={isEmpty}
              delay={dot.delay}
            />
          ))}
        </motion.g>

        <motion.g
          initial={false}
          animate={{ rotate: -360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          {energyDots.map((dot, index) => (
            <RingDot
              key={`energy-${index}`}
              x={dot.x}
              y={dot.y}
              radius={2}
              fill={isEmpty ? GOLD : "#ddd6c8"}
              pulse
              delay={dot.delay}
            />
          ))}
        </motion.g>

        {!isEmpty
          ? userDots.map((dot, index) => (
              <RingDot
                key={`user-${index}`}
                x={dot.x}
                y={dot.y}
                radius={dot.isActive ? 5 : 4}
                fill={dot.isActive ? GOLD : INK}
                pulse={dot.isActive}
                delay={dot.delay}
              />
            ))
          : null}
      </svg>

      {isEmpty ? (
        <CenterLabel chanterCount={chanterCount} isEmpty />
      ) : (
        <AnimatedCount value={chanterCount} />
      )}
    </div>
  );
}

export function HeroCircleViz(props: HeroCircleVizProps) {
  return <HeroCircleAnimated {...props} />;
}
