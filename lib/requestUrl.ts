import "server-only";
import { headers } from "next/headers";
import { siteUrl as configuredSiteUrl } from "@/lib/config";

/**
 * Resolves the current deployment's real base URL for building absolute
 * links (receipt URLs, payment provider callback URLs, email links).
 *
 * Deliberately does NOT just trust lib/config.ts's static `siteUrl`
 * (which is only NEXT_PUBLIC_SITE_URL or a hardcoded localhost
 * fallback) as the primary source — that value is baked in at build
 * time and, if the env var is never set, silently defaults to
 * "http://localhost:3000" even in production. That's exactly what
 * broke receipt links on the live Vercel deploy: nothing was wrong
 * with the deploy, the app just had no way to know its own real URL.
 *
 * Instead: read the actual incoming request's Host header (which
 * Vercel/any host sets correctly regardless of custom domain, preview
 * URL, etc.) and use that, unless NEXT_PUBLIC_SITE_URL was explicitly
 * set — an explicit value always wins, for the rare case someone wants
 * to force a specific canonical domain.
 */
export function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  try {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() only works inside an active request — fall through.
  }

  return configuredSiteUrl;
}
