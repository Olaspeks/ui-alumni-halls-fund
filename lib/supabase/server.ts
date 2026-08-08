import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/config";

/**
 * Server-side Supabase client (Server Components, Route Handlers, Server
 * Actions) — runs as the visiting user via their session cookie, so RLS
 * still applies. Returns null when Supabase isn't configured.
 *
 * Cookie writes are wrapped in try/catch: Server Components are allowed
 * to *read* cookies but not set them, and Next throws if you try. Session
 * refresh writes happen in middleware.ts instead, which can set cookies.
 */
export function createSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — middleware handles refresh.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Called from a Server Component — middleware handles refresh.
          }
        },
      },
    },
  );
}
