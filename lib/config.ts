/**
 * Central "is this integration configured?" switchboard.
 *
 * Every integration in this app (Supabase, Paystack, Stripe, Resend,
 * Turnstile, the blockchain stamp) has a real implementation and a mock
 * implementation. Which one runs is decided ONLY by whether its env vars
 * are present — never by a separate feature flag — so that adding real
 * keys later flips the app to live mode with zero code changes, per the
 * project's hard constraints.
 */

function has(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export const isSupabaseConfigured = has(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const isSupabaseAdminConfigured =
  isSupabaseConfigured && has(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const isPaystackConfigured = has(process.env.PAYSTACK_SECRET_KEY);

export const isStripeConfigured =
  has(process.env.STRIPE_SECRET_KEY) && has(process.env.STRIPE_WEBHOOK_SECRET);

export const isResendConfigured = has(process.env.RESEND_API_KEY);

export const isTurnstileConfigured =
  has(process.env.TURNSTILE_SECRET_KEY) &&
  has(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export const isChainConfigured =
  has(process.env.CHAIN_RPC_URL) &&
  has(process.env.CHAIN_PRIVATE_KEY) &&
  has(process.env.CHAIN_CONTRACT_ADDRESS);

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const receiptTokenSecret =
  process.env.RECEIPT_TOKEN_SIGNING_SECRET || "dev-only-insecure-secret-change-me";

export const chainExplorerTxBaseUrl =
  process.env.CHAIN_EXPLORER_TX_BASE_URL || "https://amoy.polygonscan.com/tx/";

/** True combined "does giving require a real payment provider" check. */
export const anyPaymentProviderConfigured = isPaystackConfigured || isStripeConfigured;
