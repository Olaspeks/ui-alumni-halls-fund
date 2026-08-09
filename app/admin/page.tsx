import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import AdminDashboard, { type DonationRow, type FundMovementRow } from "@/components/AdminDashboard";
import AdminCommandCenter from "@/components/AdminCommandCenter";

export default async function AdminPage() {
  // Mock mode: no real logins to check yet, so show the "Command Center"
  // preview (fabricated data) instead of a real dashboard. Reached
  // normally via the themed entrance at /admin/login, but works fine
  // landed on directly too — just without the "Welcome, {name}" cinematic.
  if (!isSupabaseConfigured) return <AdminCommandCenter />;

  const session = await requireRole("staff_admin", "finance_admin");
  if (!session) redirect("/login?next=/admin");

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

  return (
    <AdminDashboard
      role={session.profile.role}
      initialHalls={halls ?? []}
      initialDonations={(donations ?? []) as unknown as DonationRow[]}
      initialFundMovements={(fundMovements ?? []) as unknown as FundMovementRow[]}
    />
  );
}
