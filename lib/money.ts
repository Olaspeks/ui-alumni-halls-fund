/**
 * All money in this app is stored and moved as integer subunits (kobo for
 * NGN, cents for USD) — never floats — to avoid rounding bugs. These
 * helpers are the only place subunit <-> display conversion happens.
 */

export type Currency = "NGN" | "USD";

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  NGN: "₦", // ₦
  USD: "$",
};

/** Server-side clamp bounds, in subunits. Deliberately conservative
 * placeholders — flagged in the README as needing the Dean's sign-off. */
export const DONATION_LIMITS: Record<Currency, { min: number; max: number }> = {
  NGN: { min: 10_000, max: 1_000_000_000 }, // ₦100 – ₦10,000,000
  USD: { min: 100, max: 2_000_000 }, // $1 – $20,000
};

export function formatMoney(subunits: number, currency: Currency): string {
  const major = subunits / 100;
  const formatted = major.toLocaleString(currency === "NGN" ? "en-NG" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${CURRENCY_SYMBOL[currency]}${formatted}`;
}

/** Format for the monospace currency figures (no symbol, fixed width feel). */
export function formatMoneyMono(subunits: number): string {
  return (subunits / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function majorToSubunits(major: number): number {
  return Math.round(major * 100);
}

export function clampDonationAmount(subunits: number, currency: Currency): number {
  const { min, max } = DONATION_LIMITS[currency];
  return Math.min(Math.max(Math.round(subunits), min), max);
}

export function isWithinDonationLimits(subunits: number, currency: Currency): boolean {
  const { min, max } = DONATION_LIMITS[currency];
  return Number.isInteger(subunits) && subunits >= min && subunits <= max;
}

export function percentRaised(raised: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 1000) / 10);
}

/**
 * Converts a subunit amount between NGN and USD using a supplied live
 * rate (see lib/fx.ts). Display-only — see lib/fx.ts's module comment
 * for why this never touches stored/accounted amounts.
 */
export function convertSubunits(amountSubunits: number, from: Currency, to: Currency, usdToNgnRate: number): number {
  if (from === to) return amountSubunits;
  if (from === "USD" && to === "NGN") return Math.round(amountSubunits * usdToNgnRate);
  return Math.round(amountSubunits / usdToNgnRate); // NGN -> USD
}
