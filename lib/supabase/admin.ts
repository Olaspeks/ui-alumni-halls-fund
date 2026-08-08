import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured } from "@/lib/config";

/**
 * Service-role Supabase client — bypasses RLS entirely. Used ONLY inside
 * server-side code that has already done its own authorization check
 * (webhooks, admin API routes after a role check, the guest receipt
 * lookup by unguessable token). Never imported into any client component
 * — the "server-only" import above makes that a build-time error, not
 * just a convention.
 */
export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
