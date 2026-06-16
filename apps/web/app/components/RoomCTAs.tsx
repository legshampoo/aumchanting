type RoomCTAsProps = {
  status: "idle" | "joining" | "joined" | "leaving" | "error";
  isJoined: boolean;
  micAvailable: boolean;
  onJoinWithMic: () => void;
  onListenOnly: () => void;
  onLeave: () => void;
  className?: string;
};

export function RoomCTAs({
  status,
  isJoined,
  micAvailable,
  onJoinWithMic,
  onListenOnly,
  onLeave,
  className = "mt-10",
}: RoomCTAsProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 sm:flex-row sm:justify-center ${className}`}
    >
      <button
        type="button"
        className="h-10 w-40 cursor-pointer rounded-full bg-zinc-950 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
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
        className="h-10 w-40 cursor-pointer rounded-full border border-zinc-200 text-sm text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50"
        onClick={onListenOnly}
        disabled={status === "joining" || isJoined}
      >
        Listen only
      </button>
      {isJoined ? (
        <button
          type="button"
          className="h-10 w-40 cursor-pointer rounded-full border border-red-200 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
          onClick={onLeave}
        >
          Leave
        </button>
      ) : null}
    </div>
  );
}
