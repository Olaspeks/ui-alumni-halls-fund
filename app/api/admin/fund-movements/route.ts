import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { fundMovementSchema } from "@/lib/validation";
import { majorToSubunits } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stampConfirmation } from "@/lib/blockchain/stamp";

/**
 * Only a finance_admin may record a fund movement — checked server-side
 * against the `profiles.role` column, never trusted from the browser.
 * This inserts a ledger row only; the smart contract never moves or
 * holds funds (see /contracts/HallConfirmation.sol).
 */
export async function POST(req: NextRequest) {
  const session = await requireRole("finance_admin");
  if (!session) {
    return NextResponse.json({ error: "Finance admin access required." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = fundMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid fund movement.", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const admin = createSupabaseAdminClient()!;

  const { data: hall, error: hallErr } = await admin
    .from("halls")
    .select("*")
    .eq("id", input.hallId)
    .single();
  if (hallErr || !hall) return NextResponse.json({ error: "Unknown hall." }, { status: 404 });

  const amount = majorToSubunits(input.amountMajor);

  const { data: movement, error: insertErr } = await admin
    .from("fund_movements")
    .insert({
      hall_id: input.hallId,
      amount,
      currency: input.currency,
      note: input.note,
      recorded_by: session.userId,
    })
    .select()
    .single();

  if (insertErr || !movement) {
    console.error("[admin/fund-movements] insert failed:", insertErr);
    return NextResponse.json({ error: "Could not record fund movement." }, { status: 500 });
  }

  // Re-stamp the hall's current total on-chain, timestamped to this
  // movement, so alumni can verify the Dean's figures independently.
  // Fire-and-forget: a slow/unreachable chain must never block this
  // response, per the hard constraints.
  void (async () => {
    const totalSubunits = input.currency === "NGN" ? hall.raised_kobo : hall.raised_cents;
    const result = await stampConfirmation({
      hallSlug: hall.slug,
      currency: input.currency,
      totalSubunits,
      note: `Fund movement: ${input.note}`,
    });
    if (result.txHash) {
      await admin.from("fund_movements").update({ onchain_tx_hash: result.txHash }).eq("id", movement.id);
      const column = input.currency === "NGN" ? "onchain_ngn_tx_hash" : "onchain_usd_tx_hash";
      await admin.from("halls").update({ [column]: result.txHash }).eq("id", hall.id);
    }
  })();

  return NextResponse.json({ ok: true, movement });
}
