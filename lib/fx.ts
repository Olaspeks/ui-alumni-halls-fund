import "server-only";

/**
 * Live USD/NGN exchange rate, used ONLY to compute a friendly combined
 * "what's this worth in the other currency" figure for display on the
 * public giving page.
 *
 * Important: this never touches how money is actually stored or
 * accounted for. Every donation is still recorded in the exact currency
 * it was given in (lib/money.ts, supabase/schema.sql) — that stays
 * precise and unconverted, because real reconciliation (matching what
 * hit the Paystack/Stripe balance) has to be exact. This module only
 * feeds the on-screen "combined total," which is inherently an
 * approximation that moves with the market — never stamped on-chain,
 * never used in any accounting record.
 *
 * Source: exchangerate-api.com's free, keyless endpoint. Cached
 * in-memory for an hour per server instance (same caveat as
 * lib/rateLimit.ts: serverless instances don't share memory, so this is
 * "at most one fetch per instance per hour," not a hard global cap —
 * fine for a free API with no meaningful rate limit). Falls back to a
 * fixed rate, clearly logged, if the API is unreachable — the page must
 * never break just because a third-party FX API is down.
 */

export interface FxRate {
  usdToNgn: number;
  asOf: string;
  source: "live" | "fallback";
}

const FX_API_URL = "https://open.er-api.com/v6/latest/USD";
const FALLBACK_USD_TO_NGN = 1500; // conservative fallback only — see module comment.
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cached: (FxRate & { fetchedAt: number }) | null = null;

export async function getUsdToNgnRate(): Promise<FxRate> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const res = await fetch(FX_API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`FX API returned HTTP ${res.status}`);

    const json = (await res.json()) as { rates?: Record<string, number> };
    const rate = json.rates?.NGN;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new Error("FX API response missing a usable NGN rate");
    }

    cached = { usdToNgn: rate, asOf: new Date().toISOString(), source: "live", fetchedAt: now };
    return cached;
  } catch (err) {
    console.error("[fx] live rate fetch failed, using fallback rate:", err);
    cached = {
      usdToNgn: FALLBACK_USD_TO_NGN,
      asOf: new Date().toISOString(),
      source: "fallback",
      fetchedAt: now,
    };
    return cached;
  }
}
