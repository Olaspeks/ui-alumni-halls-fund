import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/config";

/**
 * Lets the /thank-you page poll "has the webhook landed yet?" without
 * ever trusting the browser's own payment-provider redirect as proof.
 * Donation ids are unguessable UUIDs, and this only ever returns a
 * status + receipt link — nothing a stranger couldn't already do more
 * damage with elsewhere.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "server not configured" }, { status: 500 });

  const { data, error } = await admin.from("donations").select("status, receipt_token").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    status: data.status,
    receiptUrl: data.status === "success" ? `${siteUrl}/receipt/${data.receipt_token}` : null,
  });
}
