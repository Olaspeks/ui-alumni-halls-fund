import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackSignature, type PaystackWebhookEvent } from "@/lib/payments/paystack";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { finalizeDonationSuccess } from "@/lib/donations";

/**
 * The only place an NGN donation is ever marked successful. Never trust
 * the browser redirect after checkout — only this signed server-to-
 * server callback.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    console.warn("[webhooks/paystack] signature verification failed");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "server not configured" }, { status: 500 });

  const event = JSON.parse(rawBody) as PaystackWebhookEvent;

  // Anything besides success/failure (refunds, transfers, etc.) is
  // acknowledged and ignored — we only act on the two outcomes that
  // affect a donation's status.
  if (event.event !== "charge.success" && event.event !== "charge.failed") {
    return NextResponse.json({ received: true });
  }

  const { data: donation, error } = await admin
    .from("donations")
    .select("id")
    .eq("payment_provider", "paystack")
    .eq("provider_ref", event.data.reference)
    .single();

  if (error || !donation) {
    console.warn("[webhooks/paystack] no matching donation for reference", event.data.reference);
    return NextResponse.json({ received: true });
  }

  if (event.event === "charge.failed") {
    // Leaves already-success donations alone; only a still-pending one
    // (a genuinely declined/abandoned charge) gets marked failed, so a
    // donor's /thank-you page resolves to a clear outcome instead of
    // polling forever — see app/thank-you/PendingConfirmation.tsx.
    await admin.from("donations").update({ status: "failed" }).eq("id", donation.id).eq("status", "pending");
    return NextResponse.json({ received: true });
  }

  const result = await finalizeDonationSuccess(donation.id);
  if (!result.ok) console.error("[webhooks/paystack] finalize failed:", result.error);

  return NextResponse.json({ received: true });
}
