import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Landing point for both magic-link sign-in and email/password
 * confirmation links — Supabase redirects here with a `code` param,
 * which we exchange for a session cookie. Covers both auth methods with
 * one handler since Supabase's PKCE code-exchange flow is identical for
 * either.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/account";

  if (code) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[auth/callback] code exchange failed:", error);
        return NextResponse.redirect(`${origin}/login?error=confirm_failed`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
