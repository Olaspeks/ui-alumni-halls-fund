import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DonorRole, Profile } from "@/types/database";

export interface SessionProfile {
  userId: string;
  email: string;
  profile: Profile;
}

/**
 * Resolves the current request's logged-in user + their role, reading the
 * `profiles` table server-side. Roles are NEVER trusted from the browser
 * (no client-sent role field is ever honored anywhere in this app) — this
 * is the one function every role-gated page/route calls.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;

  return { userId: user.id, email: user.email ?? profile.email, profile: profile as Profile };
}

export async function requireRole(...allowed: DonorRole[]): Promise<SessionProfile | null> {
  const session = await getSessionProfile();
  if (!session) return null;
  if (!allowed.includes(session.profile.role)) return null;
  return session;
}
