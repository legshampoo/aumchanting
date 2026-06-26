"use client";

type RoomCTAsProps = {
  status: "idle" | "joining" | "joined" | "leaving" | "error";
  isJoined: boolean;
  onJoin: () => void;
  className?: string;
  align?: "center" | "start";
};

const primaryButtonClassName =
  "h-11 cursor-pointer rounded-full bg-foreground px-6 text-xs font-semibold tracking-[0.12em] text-background uppercase disabled:cursor-not-allowed disabled:opacity-50";

export function RoomCTAs({
  status,
  isJoined,
  onJoin,
  className = "",
  align = "center",
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
          onClick={onJoin}
          disabled={status === "joining" || isJoined}
        >
          Join Now
        </button>
      </div>
    </div>
  );
}
