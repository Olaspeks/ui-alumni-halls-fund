import { NextRequest, NextResponse } from "next/server";
import { mockConfirmSchema } from "@/lib/validation";
import { isMockToken, decodeMockToken, encodeMockToken } from "@/lib/receiptToken";
import { sendReceiptEmail } from "@/lib/email/resend";
import { stampConfirmation } from "@/lib/blockchain/stamp";
import { resolveBaseUrl } from "@/lib/requestUrl";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { finalizeDonationSuccess } from "@/lib/donations";

/**
 * Backs the mock checkout page (/checkout/mock/[token]) — this is the
 * ONLY code path that can mark a mock donation as paid, and it only
 * exists at all because no real payment provider is configured for this
 * donation. It plays the same role a Paystack/Stripe webhook plays in
 * live mode: the client redirect that got the user here is never itself
 * trusted as proof of payment.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = mockConfirmSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { initToken, outcome } = parsed.data;

  // --- DB-less path: the token itself IS the record. ---
  if (isMockToken(initToken)) {
    const payload = decodeMockToken(initToken);
    if (!payload) return NextResponse.json({ error: "Invalid or tampered token." }, { status: 400 });

    if (outcome === "failed") {
      return NextResponse.json({ ok: true, status: "failed" });
    }

    const finalPayload = { ...payload, status: "success" as const };
    const receiptToken = encodeMockToken(finalPayload);
    const receiptUrl = `${resolveBaseUrl()}/receipt/${receiptToken}`;

    await sendReceiptEmail(payload.donorEmail, {
      donorDisplayName: payload.donorName?.trim() || "Friend of UI",
      hallName: payload.hallName,
      hallSlug: payload.hallSlug,
      amount: payload.amount,
      currency: payload.currency,
      reference: payload.ref,
      createdAt: payload.createdAt,
      receiptUrl,
      isAnonymous: payload.isAnonymous,
    });

    // Fire-and-forget — there's no DB row to persist a tx hash onto in
    // this mode, so we just let it log.
    void stampConfirmation({
      hallSlug: payload.hallSlug,
      currency: payload.currency,
      totalSubunits: payload.amount,
      note: `Mock-mode donation ${payload.ref} confirmed`,
    });

    return NextResponse.json({ ok: true, status: "success", receiptUrl });
  }

  // --- DB-backed path: initToken is a real donations.id. ---
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server not configured." }, { status: 500 });

  if (outcome === "failed") {
    await admin.from("donations").update({ status: "failed" }).eq("id", initToken).eq("status", "pending");
    return NextResponse.json({ ok: true, status: "failed" });
  }

  const result = await finalizeDonationSuccess(initToken);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true, status: "success", receiptUrl: result.receiptUrl });
}
