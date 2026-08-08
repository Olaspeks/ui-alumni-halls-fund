"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Hall } from "@/types/database";

/**
 * Takes the server-rendered hall list (fast first paint, works with
 * mock data too) and layers a live Supabase Realtime subscription on
 * top of it. In mock mode (no Supabase) this is a pure no-op passthrough
 * — the initial list is all there is.
 */
export function useHallsRealtime(initialHalls: Hall[]): Hall[] {
  const [halls, setHalls] = useState(initialHalls);

  useEffect(() => {
    setHalls(initialHalls);
  }, [initialHalls]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("halls-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "halls" },
        (payload) => {
          const updated = payload.new as Hall;
          setHalls((prev) => prev.map((h) => (h.id === updated.id ? { ...h, ...updated } : h)));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return halls;
}
