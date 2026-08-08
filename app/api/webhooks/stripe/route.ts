import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { constructStripeEvent } from "@/lib/payments/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { finalizeDonationSuccess } from "@/lib/donations";

/**
 * The only place a USD donation is ever marked successful. Never trust
 * the browser redirect after checkout — only this signed server-to-
 * server callback.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = constructStripeEvent(rawBody, signature);
  } catch (err) {
    console.warn("[webhooks/stripe] signature verification failed:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const reference = session.client_reference_id || session.metadata?.donationRef;
  if (!reference) return NextResponse.json({ received: true });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "server not configured" }, { status: 500 });

  const { data: donation, error } = await admin
    .from("donations")
    .select("id")
    .eq("payment_provider", "stripe")
    .eq("provider_ref", reference)
    .single();

  if (error || !donation) {
    console.warn("[webhooks/stripe] no matching donation for reference", reference);
    return NextResponse.json({ received: true });
  }

  const result = await finalizeDonationSuccess(donation.id);
  if (!result.ok) console.error("[webhooks/stripe] finalize failed:", result.error);

  return NextResponse.json({ received: true });
}
