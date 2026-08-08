import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Feeds the /admin dashboard: all halls (both currencies), the recent
 * donations feed, and recent fund movements. Read-only for staff_admin;
 * finance_admin gets the same data plus write access via
 * /api/admin/fund-movements. Role is checked here server-side — never
 * trusted from the browser.
 */
export async function GET() {
  const session = await requireRole("staff_admin", "finance_admin");
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const admin = createSupabaseAdminClient()!;

  const [{ data: halls }, { data: donations }, { data: fundMovements }] = await Promise.all([
    admin.from("halls").select("*").order("sort_order", { ascending: true }),
    admin
      .from("donations")
      .select("id, hall_id, donor_name, is_anonymous, amount, currency, status, created_at, halls(name)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("fund_movements")
      .select("id, hall_id, amount, currency, note, created_at, onchain_tx_hash, profiles(email), halls(name)")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  return NextResponse.json({
    role: session.profile.role,
    halls: halls ?? [],
    donations: donations ?? [],
    fundMovements: fundMovements ?? [],
  });
}
