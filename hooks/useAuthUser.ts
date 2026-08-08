"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export interface AuthState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
}

/**
 * Client-side "who's logged in, and what's their role" hook. Powers the
 * header nav and gates the /account and /admin client shells. The role
 * shown here is for UI convenience only (show/hide a link) — every
 * server route re-checks the role itself and never trusts this.
 */
export function useAuthUser(): AuthState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({
    loading: true,
    userId: null,
    email: null,
    profile: null,
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setState({ loading: false, userId: null, email: null, profile: null });
      return;
    }

    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase!.auth.getUser();

      if (!active) return;

      if (!user) {
        setState({ loading: false, userId: null, email: null, profile: null });
        return;
      }

      const { data: profile } = await supabase!.from("profiles").select("*").eq("id", user.id).single();
      if (!active) return;
      setState({ loading: false, userId: user.id, email: user.email ?? null, profile: (profile as Profile) ?? null });
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    setState({ loading: false, userId: null, email: null, profile: null });
  }

  return { ...state, signOut };
}
