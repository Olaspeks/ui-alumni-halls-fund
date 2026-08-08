import "server-only";
import Stripe from "stripe";
import { isStripeConfigured } from "@/lib/config";
import type { PaymentInitParams, PaymentInitResult } from "./types";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!isStripeConfigured) {
    throw new Error("Stripe is not configured — call site should have used mock checkout.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-06-20",
    });
  }
  return stripeClient;
}

/** Creates a Stripe Checkout Session (USD only). Amount must already be
 * in cents — this file never re-does currency math. */
export async function initStripeCheckout(
  params: PaymentInitParams,
  successUrl: string,
  cancelUrl: string,
): Promise<PaymentInitResult> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: params.email,
    client_reference_id: params.reference,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: params.amountSubunits, // Stripe wants cents already
          product_data: {
            name: "Donation — UI Alumni Halls Fund",
            description: String(params.metadata?.hallName ?? ""),
          },
        },
      },
    ],
    metadata: {
      donationRef: params.reference,
      ...Object.fromEntries(
        Object.entries(params.metadata ?? {}).map(([k, v]) => [k, String(v)]),
      ),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");

  return { checkoutUrl: session.url, providerRef: session.id };
}

/** Verifies the Stripe-Signature header via the official SDK — never
 * trust a webhook payload without this check. */
export function constructStripeEvent(rawBody: string, signatureHeader: string | null): Stripe.Event {
  if (!signatureHeader) throw new Error("Missing Stripe-Signature header.");
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    rawBody,
    signatureHeader,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}
