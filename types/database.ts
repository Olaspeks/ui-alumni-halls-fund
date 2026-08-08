import type { Currency } from "@/lib/money";

export type DonorRole = "donor" | "staff_admin" | "finance_admin";
export type DonationStatus = "pending" | "success" | "failed";
export type PaymentProvider = "paystack" | "stripe" | "mock";

export interface Hall {
  id: string;
  name: string;
  slug: string;
  blurb: string | null;
  photo_url: string | null;
  sort_order: number;
  is_placeholder: boolean;
  goal_kobo: number;
  raised_kobo: number;
  goal_cents: number;
  raised_cents: number;
  onchain_ngn_tx_hash: string | null;
  onchain_usd_tx_hash: string | null;
  created_at: string;
}

export interface Donation {
  id: string;
  hall_id: string;
  donor_id: string | null;
  donor_name: string | null;
  donor_email: string;
  amount: number;
  currency: Currency;
  payment_provider: PaymentProvider;
  provider_ref: string;
  status: DonationStatus;
  is_anonymous: boolean;
  receipt_sent_at: string | null;
  receipt_token: string;
  onchain_tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface FundMovement {
  id: string;
  hall_id: string;
  amount: number;
  currency: Currency;
  note: string;
  recorded_by: string;
  onchain_tx_hash: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: DonorRole;
  created_at: string;
}

/** Helper: goal/raised for a given currency, read off a Hall row. */
export function hallTotals(hall: Hall, currency: Currency) {
  return currency === "NGN"
    ? { goal: hall.goal_kobo, raised: hall.raised_kobo }
    : { goal: hall.goal_cents, raised: hall.raised_cents };
}
