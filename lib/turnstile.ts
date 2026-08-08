import "server-only";
import { isTurnstileConfigured } from "@/lib/config";

/**
 * Verifies a Cloudflare Turnstile token server-side. In mock mode
 * (no secret key configured) this always passes, so the donation form
 * works end-to-end with zero keys — matching the widget itself, which
 * renders in a harmless "always pass" placeholder state on the client
 * when no site key is configured.
 */
export async function verifyTurnstileToken(token: string | null | undefined, ip?: string): Promise<boolean> {
  if (!isTurnstileConfigured) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });
    const json = (await res.json()) as { success: boolean };
    return json.success === true;
  } catch (err) {
    console.error("[turnstile] verification request failed:", err);
    return false;
  }
}
