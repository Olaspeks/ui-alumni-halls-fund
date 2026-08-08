import "server-only";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STATIC_HALLS } from "@/lib/halls";
import type { Hall } from "@/types/database";

/** Shared by the homepage server component and GET /api/halls, so the
 * "live DB vs. static demo data" branch lives in exactly one place. */
export async function getHallsServer(): Promise<{ halls: Hall[]; live: boolean }> {
  if (!isSupabaseConfigured) return { halls: STATIC_HALLS, live: false };

  const supabase = createSupabaseServerClient()!;
  const { data, error } = await supabase.from("halls").select("*").order("sort_order", { ascending: true });

  if (error || !data) {
    console.error("[hallsServer] query failed, falling back to static list:", error);
    return { halls: STATIC_HALLS, live: false };
  }

  return { halls: data as Hall[], live: true };
}
