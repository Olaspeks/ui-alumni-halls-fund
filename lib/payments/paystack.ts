import "server-only";
import crypto from "node:crypto";
import { isPaystackConfigured } from "@/lib/config";
import type { PaymentInitParams, PaymentInitResult } from "./types";

const PAYSTACK_API = "https://api.paystack.co";

/** Initializes a Paystack transaction (NGN only). Amount must already be
 * in kobo — this file never re-does currency math. */
export async function initPaystackTransaction(
  params: PaymentInitParams,
): Promise<PaymentInitResult> {
  if (!isPaystackConfigured) {
    throw new Error("Paystack is not configured — call site should have used mock checkout.");
  }

  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountSubunits, // Paystack wants kobo already
      currency: "NGN",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {},
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Paystack init failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    status: boolean;
    data?: { authorization_url: string; reference: string };
    message?: string;
  };

  if (!json.status || !json.data) {
    throw new Error(`Paystack init rejected: ${json.message ?? "unknown error"}`);
  }

  return { checkoutUrl: json.data.authorization_url, providerRef: json.data.reference };
}

/** Verifies the `x-paystack-signature` header per Paystack's docs: an
 * HMAC-SHA512 of the raw request body, keyed with the secret key. Never
 * trust a webhook payload without this check. */
export function verifyPaystackSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !isPaystackConfigured) return false;
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    customer: { email: string };
  };
}
