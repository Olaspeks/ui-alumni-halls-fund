import "server-only";

/**
 * USD/NGN exchange rate, used ONLY to compute a friendly combined
 * "what's this worth in the other currency" figure for display — the
 * barometer array's global ₦/$ toggle, and the homepage's combined
 * total, both read from here.
 *
 * Important: this never touches how money is actually stored or
 * accounted for. Every donation is still recorded in the exact currency
 * it was given in (lib/money.ts, supabase/schema.sql) — that stays
 * precise and unconverted, because real reconciliation (matching what
 * hit the Paystack/Stripe balance) has to be exact. This module only
 * feeds on-screen totals, which are inherently an approximation that
 * moves with the market — never stamped on-chain, never used in any
 * accounting record.
 *
 * Three sources, in priority order:
 *   1. FX_OVERRIDE_RATE (env var) — an admin-set fixed rate, for when
 *      the university wants to quote one official/internal rate rather
 *      than whatever the market is doing. This is the "admin-editable
 *      config value" called for in the brief; an env var is genuinely
 *      the simplest correct implementation until Supabase (and a real
 *      admin session) exists — see the TODO below for the natural next
 *      step, which is a small, mechanical change, not a redesign.
 *   2. A live rate from exchangerate-api.com's free, keyless endpoint —
 *      the default, so the figure is accurate with zero configuration.
 *      Cached in-memory for an hour per server instance (same caveat as
 *      lib/rateLimit.ts: serverless instances don't share memory, so
 *      this is "at most one fetch per instance per hour," not a hard
 *      global cap — fine for a free API with no meaningful rate limit).
 *   3. A fixed fallback, clearly logged, if the API is unreachable —
 *      the page must never break just because a third-party FX API is
 *      down.
 *
 * TODO(post-Supabase): once there's a real `finance_admin` session,
 * move the override into a small `settings` table (key/value is
 * enough) and give it a control in the admin dashboard, so it's
 * editable without a redeploy. Swap step 1 below for a `select` from
 * that table — everything else in this file (and every call site) stays
 * identical, since they only ever see the resolved FxRate shape.
 */

export interface FxRate {
  usdToNgn: number;
  asOf: string;
  source: "override" | "live" | "fallback";
}

const FX_API_URL = "https://open.er-api.com/v6/latest/USD";
const FALLBACK_USD_TO_NGN = 1500; // conservative fallback only — see module comment.
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cached: (FxRate & { fetchedAt: number }) | null = null;

function getOverrideRate(): number | null {
  const raw = process.env.FX_OVERRIDE_RATE;
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(`[fx] FX_OVERRIDE_RATE="${raw}" is not a valid positive number — ignoring it.`);
    return null;
  }
  return parsed;
}

export async function getUsdToNgnRate(): Promise<FxRate> {
  const override = getOverrideRate();
  if (override !== null) {
    return { usdToNgn: override, asOf: new Date().toISOString(), source: "override" };
  }

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
