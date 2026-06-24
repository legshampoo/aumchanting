"use client";

import { useEffect, useMemo, useState } from "react";

type RoomStats = {
  listeners: number;
  chanters: number;
};

export function useRoomStats(pollMs = 10_000) {
  const apiBase = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (configured !== undefined) return configured;
    if (process.env.NODE_ENV === "development") return "http://localhost:8787";
    return "";
  }, []);

  const [stats, setStats] = useState<RoomStats>({ listeners: 0, chanters: 0 });

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const resp = await fetch(`${apiBase}/room-stats`);
        if (!resp.ok) return;
        const data = (await resp.json()) as RoomStats;
        if (!cancelled) setStats(data);
      } catch {
        // keep last known stats
      }
    }

    void fetchStats();
    const timer = setInterval(fetchStats, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [apiBase, pollMs]);

  return stats;
}
