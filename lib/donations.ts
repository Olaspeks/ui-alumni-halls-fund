import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendReceiptEmail } from "@/lib/email/resend";
import { stampConfirmation } from "@/lib/blockchain/stamp";
import { resolveBaseUrl } from "@/lib/requestUrl";
import type { Hall } from "@/types/database";

/**
 * Flips a DB-backed donation to `success`, sends the receipt email, and
 * fires off (without waiting on) the blockchain confirmation stamp.
 *
 * This is the ONLY place a donation is ever marked successful — called
 * exclusively from the Paystack/Stripe webhook routes, never from a
 * client redirect. Idempotent: a webhook retry on an already-success
 * donation just returns the existing receipt link.
 */
export async function finalizeDonationSuccess(
  donationId: string,
): Promise<{ ok: boolean; receiptUrl?: string; error?: string }> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, error: "Supabase admin client not configured" };

  const { data: existing, error: fetchErr } = await admin
    .from("donations")
    .select("*, halls(*)")
    .eq("id", donationId)
    .single();

  if (fetchErr || !existing) return { ok: false, error: "donation not found" };

  const receiptUrl = `${resolveBaseUrl()}/receipt/${existing.receipt_token}`;

  if (existing.status === "success") {
    // Already processed — webhook retries are expected, just no-op.
    return { ok: true, receiptUrl };
  }

  // Guard the update with .eq("status", "pending") so two concurrent
  // webhook deliveries can't both apply the total twice.
  const { data: updated, error: updateErr } = await admin
    .from("donations")
    .update({ status: "success" })
    .eq("id", donationId)
    .eq("status", "pending")
    .select()
    .single();

  if (updateErr || !updated) {
    // Someone else's concurrent request already flipped it — treat as success.
    return { ok: true, receiptUrl };
  }

  const hall = existing.halls as Hall;

  const emailResult = await sendReceiptEmail(updated.donor_email, {
    donorDisplayName: updated.donor_name?.trim() || "Friend of UI",
    hallName: hall.name,
    hallSlug: hall.slug,
    amount: updated.amount,
    currency: updated.currency,
    reference: updated.provider_ref,
    createdAt: updated.created_at,
    receiptUrl,
    isAnonymous: updated.is_anonymous,
  });

  await admin
    .from("donations")
    .update({ receipt_sent_at: emailResult.sent ? new Date().toISOString() : null })
    .eq("id", donationId);

  // Fire-and-forget: re-fetch the hall's post-trigger total and stamp it.
  // Deliberately not awaited — chain latency must never delay this
  // function (and therefore the webhook's HTTP response).
  void (async () => {
    const { data: freshHall } = await admin.from("halls").select("*").eq("id", hall.id).single();
    if (!freshHall) return;

    const totalSubunits = updated.currency === "NGN" ? freshHall.raised_kobo : freshHall.raised_cents;

    const result = await stampConfirmation({
      hallSlug: hall.slug,
      currency: updated.currency,
      totalSubunits,
      note: `Donation ${updated.provider_ref} confirmed`,
    });

    if (result.txHash) {
      await admin.from("donations").update({ onchain_tx_hash: result.txHash }).eq("id", donationId);
      const column = updated.currency === "NGN" ? "onchain_ngn_tx_hash" : "onchain_usd_tx_hash";
      await admin.from("halls").update({ [column]: result.txHash }).eq("id", hall.id);
    }
  })();

  return { ok: true, receiptUrl };
}
