"use client";

import { BetaTestButton } from "./BetaTestButton";

type RoomCTAsProps = {
  status: "idle" | "joining" | "joined" | "leaving" | "error";
  isJoined: boolean;
  micAvailable: boolean;
  onJoinWithMic: () => void;
  onListenOnly: () => void;
  onLeave: () => void;
  className?: string;
  align?: "center" | "start";
  showBetaTest?: boolean;
};

const primaryButtonClassName =
  "h-11 cursor-pointer rounded-full bg-foreground px-6 text-xs font-semibold tracking-[0.12em] text-background uppercase disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClassName =
  "h-11 cursor-pointer rounded-full border border-border px-6 text-xs font-semibold tracking-[0.12em] text-foreground uppercase disabled:cursor-not-allowed disabled:opacity-50";

export function RoomCTAs({
  status,
  isJoined,
  micAvailable,
  onJoinWithMic,
  onListenOnly,
  onLeave,
  className = "",
  align = "center",
  showBetaTest = true,
}: RoomCTAsProps) {
  const alignClass = align === "start" ? "items-start" : "items-center";

  return (
    <div className={`flex flex-col gap-3 ${alignClass} ${className}`}>
      <div
        className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${
          align === "start" ? "sm:justify-start" : "sm:justify-center"
        }`}
      >
        <button
          type="button"
          className={primaryButtonClassName}
          onClick={onJoinWithMic}
          disabled={status === "joining" || isJoined || !micAvailable}
          title={
            micAvailable
              ? undefined
              : "Microphone requires HTTPS (not available on plain HTTP)"
          }
        >
          Join + Mic
        </button>
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={onListenOnly}
          disabled={status === "joining" || isJoined}
        >
          Listen only
        </button>
        {isJoined ? (
          <button
            type="button"
            className="h-11 cursor-pointer rounded-full border border-red-200 px-6 text-xs font-semibold tracking-[0.12em] text-red-700 uppercase hover:bg-red-50"
            onClick={onLeave}
          >
            Leave
          </button>
        ) : null}
      </div>
      {showBetaTest ? <BetaTestButton /> : null}
    </div>
  );
}
